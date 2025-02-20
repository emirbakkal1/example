const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "bet",
    description: "Bet another user and determine the winner based on dice rolls.",
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @returns
   */
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    if (args.length < 2) {
      return message.reply("Please provide the target user and the bet amount (whole, half, quarter, or a numeric value).");
    }

    const targetUserId = args[0].replace("<@", "").replace(">", "");
    const betInput = args[1].toLowerCase();

    // Fetch users from the database
    const [user, target] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId, guildId: guildId } }),
      prisma.user.findUnique({ where: { id: targetUserId, guildId: guildId } }),
    ]);

    // Check if the target user is a bot
    const targetMember = await message.guild.members.fetch(targetUserId);
    if (targetMember.user.bot) {
      return message.reply("The account you mentioned is not a user.");
    }

    if (!user || !target) {
      return message.reply("One or both users not found.");
    }

    let betAmount;
    if (["whole", "half", "quarter"].includes(betInput)) {
      switch (betInput) {
        case 'whole':
          betAmount = user.balance;
          break;
        case 'half':
          betAmount = user.balance / 2;
          break;
        case 'quarter':
          betAmount = user.balance / 4;
          break;
      }
    } else {
      betAmount = parseFloat(betInput);
      if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply("Please provide a valid numeric bet amount or 'whole', 'half', or 'quarter'.");
      }
    }

    if (user.balance < betAmount) {
      return message.reply("You do not have enough balance to make this bet.");
    }

    if (target.balance < betAmount) {
      return message.reply(`<@${targetUserId}> does not have enough balance to accept this bet.`);
    }

    // Create and send the bet proposal message
    const betEmbed = new EmbedBuilder()
      .setTitle("Bet Proposal")
      .setDescription(`<@${targetUserId}>, <@${userId}> has proposed a bet of **${betAmount.toLocaleString('en-US')}** coins. Do you accept?`)
      .setColor('#5865F2');

    const acceptButton = new ButtonBuilder()
      .setCustomId('accept_bet')
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
      .setCustomId('reject_bet')
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(acceptButton, rejectButton);

    const betMessage = await message.reply({ embeds: [betEmbed], components: [actionRow] });

    // Set up a collector to handle the response
    const filter = interaction => ['accept_bet', 'reject_bet'].includes(interaction.customId);
    const collector = betMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timeout

    collector.on('collect', async interaction => {
      if (interaction.user.id !== targetUserId) {
        // Notify the user that they were not the one mentioned in an ephemeral message
        return interaction.reply({
          content: `Only <@${targetUserId}> can use these buttons.`,
          ephemeral: true
        });
      }

      if (interaction.customId === 'accept_bet') {
        // Roll dice for both users between 1 and 99
        const userRoll = Math.floor(Math.random() * 99) + 1; // Roll between 1 and 99
        const targetRoll = Math.floor(Math.random() * 99) + 1;

        // Determine the winner based on rolls
        let winner, loser, winnerRoll, loserRoll;
        if (userRoll > targetRoll) {
          winner = user;
          loser = target;
          winnerRoll = userRoll;
          loserRoll = targetRoll;
        } else if (targetRoll > userRoll) {
          winner = target;
          loser = user;
          winnerRoll = targetRoll;
          loserRoll = userRoll;
        } else {
          // It's a tie
          const tieEmbed = new EmbedBuilder()
            .setTitle("Bet Result")
            .setDescription(`It's a tie! Both <@${userId}> and <@${targetUserId}> rolled a **${userRoll}**.`)
            .setColor('#FFFF00');

          await betMessage.edit({ embeds: [tieEmbed], components: [] });
          return;
        }

        // Transfer the bet amount between users
        await prisma.$transaction([
          prisma.user.update({
            where: { id: winner.id, guildId: guildId },
            data: { balance: { increment: betAmount } },
          }),
          prisma.user.update({
            where: { id: loser.id, guildId: guildId },
            data: { balance: { decrement: betAmount } },
          })
        ]);

        // Notify both users by editing the original bet message
        const resultEmbed = new EmbedBuilder()
          .setTitle("Bet Result")
          .setDescription(`<@${winner.id}> has won **${betAmount.toLocaleString('en-US')}** coins from <@${loser.id}>!\n\n**Dice Rolls:**\n<@${userId}> rolled a **${userRoll}**\n<@${targetUserId}> rolled a **${targetRoll}**`)
          .setColor('#00FF00');

        await betMessage.edit({ embeds: [resultEmbed], components: [] });

      } else if (interaction.customId === 'reject_bet') {
        const rejectEmbed = new EmbedBuilder()
          .setTitle("Bet Rejected")
          .setDescription(`<@${userId}>, <@${targetUserId}> has rejected your bet of **${betAmount.toLocaleString('en-US')}** coins.`)
          .setColor('#FF0000');

        await betMessage.edit({ embeds: [rejectEmbed], components: [] });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        // Notify the user if no response was given in time
        betMessage.edit({
          embeds: [betEmbed.setDescription(`<@${targetUserId}> did not reply in time.`)],
          components: []
        });
      }
    });
  },
};