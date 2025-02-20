const { Client, GatewayIntentBits, Collection } = require("discord.js");
require("dotenv").config();

const MUSIC_BOT_TOKEN = process.env.MUSIC_BOT_TOKEN;
const HOST = process.env.HOST;
const PORT = process.env.PORT;
const PASSWORD = process.env.PASSWORD;
const loanTimeInMinutes = 60;

const { Guilds, GuildVoiceStates, GuildMessages, MessageContent, MessageReactions } = GatewayIntentBits;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
});

// Anti Crash
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log("Uncaught Exception Monitor:", err, origin);
});

client.prefix = new Collection();
client.interactions = new Collection();
client.embedColor = null;
client.embed = true;

[
  "prefix_command_handler",
  "event_handler",
  "interaction_handler",
].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

client.on("customEventTest", (data) => {
  console.log(data);
});

// Automatically pay loan

const cron = require('node-cron');
const { prisma } = require('../../src/database/db');

// Schedule the job to run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running loan scheduler...');

  try {
    // Get all users who have an active loan (loanAmount > 0) and the loan was taken more than 1 hour ago
    const usersWithLoans = await prisma.user.findMany({
      where: {
        loanAmount: {
          gt: 0, // Active loans
        },
        loanTimestamp: {
          lte: BigInt(Date.now() - loanTimeInMinutes * 60 * 1000), // Loans older than 1 hour
        },
      },
    });

    for (const user of usersWithLoans) {
      if (user.balance >= user.loanAmount) {
        // Deduct loan amount from user balance and mark the loan as paid off
        await prisma.user.update({
          where: { id: user.id },
          data: {
            balance: { decrement: user.loanAmount },
            loanAmount: 0, // Reset loan amount
            loanTimestamp: null, // Clear the loan timestamp
          },
        });

        console.log(`Loan of ${Math.ceil(user.loanAmount).toLocaleString('en-US')} deducted from user ${user.id}`);

        // Fetch the Discord user and send a DM notification
        try {
          const discordUser = await client.users.fetch(user.id);
          await discordUser.send(
            `Your loan of **${Math.ceil(user.loanAmount).toLocaleString('en-US')}** coins has been automatically paid off after 1 hour.`
          );
        } catch (dmError) {
          console.error(`Failed to send DM to user ${user.id}:`, dmError);
        }
      } else {
        console.log(`User ${user.id} has insufficient funds to repay the loan.`);
      }
    }
  } catch (error) {
    console.error('Error running loan scheduler:', error);
  }
});

// CHECK DEPOSITS

cron.schedule('*/15 * * * *', async () => {
  console.log('Running deposit profit scheduler...');

  try {
    // Get all users with active deposits
    const usersWithDeposits = await prisma.user.findMany({
      where: {
        depositAmount: {
          gt: 0, // Active deposits
        },
        depositTimestamp: {
          lte: BigInt(Date.now() - 45 * 60 * 1000), // Deposits older than 45 minutes
        },
      },
    });

    for (const user of usersWithDeposits) {
      // Check if the deposit time has elapsed
      const depositTime = BigInt(user.depositTimestamp);
      const currentTime = BigInt(Date.now());
      const timeElapsed = (currentTime - depositTime) / BigInt(60000); // Time in minutes

      const timeMap = {
        "1h": 1,
        "2h": 120,
        "3h": 180,
        "4h": 240,
        "5h": 300
      };

      const requiredTime = timeMap[user.depositTimePeriod];

      if (timeElapsed >= requiredTime) {
        // Calculate profit
        const profit = user.depositAmount * (user.profitPercentage / 100);

        // Update the user's balance
        await prisma.user.update({
          where: { id: user.id },
          data: {
            balance: { increment: user.depositAmount + profit },
            depositAmount: 0, // Clear the deposit
            depositTimestamp: null,
            profitPercentage: null,
            depositTimePeriod: null
          },
        });

        // Send DM to the user
        const userDM = await client.users.fetch(user.id);
        if (userDM) {
          await userDM.send(`Your deposit of **${Math.ceil(user.depositAmount).toLocaleString('en-US')}** coins has matured. You have earned a profit of **${Math.ceil(profit).toLocaleString('en-US')}** coins. Your new balance is **${Math.ceil(user.balance).toLocaleString('en-US')}**.`);
        }

        console.log(`Deposit of ${user.depositAmount} processed for user ${user.id}`);
      }
    }
  } catch (error) {
    console.error('Error running deposit profit scheduler:', error);
  }
});

//client.login(process.argv[2] || MUSIC_BOT_TOKEN);
client.login("MTI3NTQ3NDIxOTMzMjgwMDU3NA.GoUGFX.IG7Zc5kWQ8hhbvh5gKRw60yr42pgCS20N3pS1M")