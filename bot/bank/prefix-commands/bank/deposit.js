const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "deposit",
    description: "Deposit an amount and earn a profit based on the time period.",
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

    // Fetch the user
    const user = await prisma.user.findUnique({
      where: { id: userId, guildId: guildId },
    });

    if (!user) {
      const userNotFoundEmbed = errorEmbed(message).setDescription(
        "User not found."
      );
      return await message.reply({ embeds: [userNotFoundEmbed] });
    }

    // Check if the user has an active deposit
    if (user.depositTimestamp) {
      const now = new Date();
      const depositEnd = new Date(Number(user.depositTimestamp) + (parseInt(user.depositTimePeriod.replace('h', '')) * 60 * 60 * 1000));
      const depositTimeRemaining = depositEnd - now;

      const formatDuration = (ms) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        let formattedDuration = '';
        if (days > 0) formattedDuration += `${days} days `;
        if (hours > 0) formattedDuration += `${hours} hours `;
        if (minutes > 0) formattedDuration += `${minutes} minutes `;
        if (seconds > 0) formattedDuration += `${seconds} seconds `;
        return formattedDuration.trim().replace(/,\s*$/, '');
      };

      if (depositTimeRemaining > 0) {
        const remainingTimeEmbed = new EmbedBuilder()
          .setTitle("Active Deposit")
          .setDescription(`You already have an active deposit. Your deposit of **${Math.ceil(user.depositAmount).toLocaleString('en-US')}** coins will mature in **${formatDuration(depositTimeRemaining)}**.`)
          .setColor('#5865F2');

        return await message.reply({ embeds: [remainingTimeEmbed] });
      } else {
        // If the deposit time has expired, reset deposit fields
        await prisma.user.update({
          where: { id: userId, guildId: guildId },
          data: {
            depositAmount: 0,
            depositTimestamp: null,
            profitPercentage: 0,
            depositTimePeriod: null
          },
        });

        const depositExpiredEmbed = new EmbedBuilder()
          .setTitle("Deposit Expired")
          .setDescription("Your previous deposit has matured. You can now make a new deposit.")
          .setColor('#50C878');

        await message.reply({ embeds: [depositExpiredEmbed] });
      }
    } else {
      // Check if the user provided the amount to deposit
      if (args.length < 1) {
        const noArgsEmbed = errorEmbed(message).setDescription(
          "Please provide the amount to deposit."
        );
        return await message.reply({ embeds: [noArgsEmbed] });
      }

      const amountArg = args[0].toLowerCase();

      // Determine the deposit amount
      let depositAmount;

      if (amountArg === "whole") {
        depositAmount = user.balance;
      } else if (amountArg === "half") {
        depositAmount = user.balance / 2;
      } else if (amountArg === "quarter") {
        depositAmount = user.balance / 4;
      } else {
        depositAmount = parseFloat(amountArg);
      }

      if (isNaN(depositAmount) || depositAmount <= 0) {
        const invalidAmountEmbed = errorEmbed(message).setDescription(
          "Please provide a valid amount to deposit."
        );
        return await message.reply({ embeds: [invalidAmountEmbed] });
      }

      // Check if the user has enough balance
      if (user.balance < depositAmount) {
        const insufficientFundsEmbed = errorEmbed(message).setDescription(
          "You do not have enough balance to make this deposit."
        );
        return await message.reply({ embeds: [insufficientFundsEmbed] });
      }

      // Create the selection menu for time periods
      const timeSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('timePeriodSelect')
        .setPlaceholder('Select a time period')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('1 hour').setValue('1h'),
          new StringSelectMenuOptionBuilder().setLabel('2 hours').setValue('2h'),
          new StringSelectMenuOptionBuilder().setLabel('3 hours').setValue('3h'),
          new StringSelectMenuOptionBuilder().setLabel('4 hours').setValue('4h'),
          new StringSelectMenuOptionBuilder().setLabel('5 hours').setValue('5h')
        );

      const actionRow = new ActionRowBuilder().addComponents(timeSelectMenu);

      const depositPromptEmbed = new EmbedBuilder()
        .setTitle("Select Time Period")
        .setDescription("Please select the time period for your deposit from the dropdown menu.")
        .setColor('#5865F2');

      const depositMessage = await message.reply({ embeds: [depositPromptEmbed], components: [actionRow] });

      // Set up a collector to handle the selection menu interaction
      const filter = interaction => interaction.customId === 'timePeriodSelect' && interaction.user.id === userId;
      const collector = depositMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timeout

      collector.on('collect', async interaction => {
        const timePeriod = interaction.values[0];
        const timeMap = {
          "1h": 10,
          "2h": 20,
          "3h": 30,
          "4h": 40,
          "5h": 50
        };

        const profitPercentage = timeMap[timePeriod];
        if (profitPercentage === undefined) {
          const invalidTimeEmbed = errorEmbed(message).setDescription(
            "An error occurred while processing the time period."
          );
          return await interaction.reply({ embeds: [invalidTimeEmbed], ephemeral: true });
        }

        // Record the deposit
        await prisma.user.update({
          where: { id: userId, guildId: guildId },
          data: {
            balance: { decrement: depositAmount },
            depositAmount: depositAmount,
            depositTimestamp: BigInt(Date.now()), // Store the timestamp as BigInt
            profitPercentage: profitPercentage,
            depositTimePeriod: timePeriod
          },
        });

        const depositSuccessEmbed = new EmbedBuilder()
          .setTitle("Deposit Successful")
          .setColor(0x50C878)
          .setDescription(`You have successfully deposited **${Math.ceil(depositAmount).toLocaleString('en-US')}** coins for **${timePeriod}**. You will receive a **${profitPercentage}%** profit after the period.`);

        await interaction.update({ embeds: [depositSuccessEmbed], components: [] });
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          // Notify the user if no response was given in time
          depositMessage.edit({
            embeds: [depositPromptEmbed.setDescription("You did not select a time period in time.")],
            components: []
          });
        }
      });
    }
  },
};