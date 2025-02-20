const { prisma } = require("../database/db");
const { Client } = require("discord.js");
const { exec } = require("child_process");

const saveProcess = async (processId, clientId, tokenBot) => {
  if (!processId) return;
  const existingProcess = await prisma.botProcess.findFirst({
    where: {
      processId: `${processId}`,
    },
    include: {
      token: true,
    },
  });

  const token = await prisma.token.findFirst({
    where: {
      botId: clientId,
      token: tokenBot,
    },
    include: {
      process: true,
    },
  });

  if (existingProcess) {
    await prisma.botProcess.update({
      where: {
        processId: `${processId}`,
      },
      data: {
        running: true,
        token: {
          connect: {
            id: token.id,
          },
        },
      },
    });

    return;
  }

  if (!token) {
    console.log("Token not found");
    return;
  }

  console.log(existingProcess, token);

  await prisma.botProcess.create({
    data: {
      processId: `${processId}`,
      running: true,
      token: {
        connect: {
          id: token.id,
        },
      },
    },
  });
};

/**
 * @typedef {import('@prisma/client').Token} Token
 */

/**
 *
 * @param {Token} token
 */
const initializeStartBot = (token) => {

  exec(
    `pm2 start ./bot/${token.botType}/index.js -f --name ${token.botType}_${token.botId} -- ${token.token}`,
    (err) => {
      if (err) {
        return;
      }
    },
  );
};

/**
 *
 * @param {string} id
 * @param {string} type
 */
const startBot = async (id, type) => {
 
  exec(`pm2 start ${type}_${id}`, (err) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
  });

  await prisma.botProcess.update({
    where: {
      processId: id,
    },
    data: {
      running: true,
    },
  });
};

/**
 *
 * @param {string} id
 * @param {string} processId
 * @param {string} type
 * @returns
 */
const shutDownBot = async (id, processId, type) => {
  if (!id || !processId || !type) {
    console.log("Bot not found");
    return;
  }
  exec(`pm2 stop ${type}_${processId}`, (err) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
  });

  await prisma.botProcess.update({
    where: {
      id: id,
    },
    data: {
      running: false,
    },
  });
};

const restartBot = async (token) => {
  if (!token.processId) {
    console.log("Bot not found");
    return;
  }

  exec(`pm2 restart ${token.botType}_${token.process.processId}`, (err) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
  });
};

const restartAllBotFromSubscription = async (user) => {
  const botProcesses = await prisma.botProcess.findMany({
    where: {
      token: {
        subscription: {
          OR: [
            {
              customerId: user,
            },
            {
              owners: {
                has: user,
              },
            },
          ],
        },
      },
    },
    include: {
      token: true,
    },
  });

  if (!botProcesses) {
    console.log("Bot not found");
    return;
  }

  botProcesses.forEach((botProcess) => {
    exec(
      `pm2 restart ${botProcess.token.botType}_${botProcess.processId}`,
      (err) => {
        if (err) {
          console.error(`exec error: ${err}`);
          return;
        }
      },
    );
  });
};

const leaveGuild = async (token) => {
  try {
    const client = new Client({
      intents: [],
    });

    client.on("ready", async () => {
      const guild = client.guilds.cache.first();

      if (!guild) {
        return await client.destroy();
      }

      await guild.leave();
      return await client.destroy();
    });

    await client.login(token);
  } catch (error) {
    console.log(error);
  }
};

const removeBotProcess = async (token) => {
  
  exec(`pm2 delete ${token.botType}_${token.process.processId}`, (err) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
  });

  await prisma.botProcess.delete({
    where: {
      id: token.process.id,
    },
  });
};

module.exports = {
  saveProcess,
  startBot,
  shutDownBot,
  initializeStartBot,
  removeBotProcess,
  restartBot,
  restartAllBotFromSubscription,
  leaveGuild,
};
