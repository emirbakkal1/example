const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));
const commandCooldowns = config.commandCooldowns || {};

const COMPANIES = ["Real Estate", "Lands", "Gold", "Digital Currencies"];
const MINIMUM_AMOUNT = 5000;

module.exports = {
  data: {
    name: "trade",
    description: "Trade in various assets.",
  },
  /**
   *
   * @param {Message} message
   * @param {*} args
   * @returns
   */
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const commandName = this.data.name;
    const cooldownDuration = commandCooldowns[commandName] || 0;

    // Ensure a valid amount argument is provided
    const amount = parseFloat(args[0]);
    if (isNaN(amount) || amount < MINIMUM_AMOUNT) {
      return message.reply(`Please provide a valid trade amount of at least ${MINIMUM_AMOUNT}$.`);
    }

    async function findOrCreateUser(userId, guildId) {
      let user = await prisma.user.findFirst({
        where: {
          id: userId,
          guildId: guildId,
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            guildId: guildId,
            balance: 0,
            cooldowns: {},
          },
        });
      }

      return user;
    }

    const user = await findOrCreateUser(userId, guildId);

    // Cooldown check
    const now = new Date();
    const cooldowns = user.cooldowns || {};
    const lastUsed = cooldowns[commandName];

    if (lastUsed) {
      const lastUsedTime = new Date(lastUsed);
      const timeDifference = now - lastUsedTime;

      if (timeDifference < cooldownDuration) {
        const formatDuration = (ms) => {
          const seconds = Math.floor((ms / 1000) % 60);
          const minutes = Math.floor((ms / (1000 * 60)) % 60);
          const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
          const days = Math.floor(ms / (1000 * 60 * 60 * 24));
          let formattedDuration = '';
          if (days > 0) formattedDuration += `${days} days `;
          if (hours > 0) formattedDuration += ` ${hours} hours `;
          if (minutes > 0) formattedDuration += ` ${minutes} minutes`;
          if (seconds > 0) formattedDuration += ` ${seconds} seconds`;
          return formattedDuration.trim().replace(/,\s*$/, '');
        };

        const cooldownEmbed = new EmbedBuilder()
        .setTitle('Cooldown Time')
        .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(`${message.author} Please wait **${formatDuration(Math.ceil((cooldownDuration - timeDifference)))}** before using this command again.`)
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() });

        // Send the embed
        return message.reply({ embeds: [cooldownEmbed] });
      }
    }

    cooldowns[commandName] = now.toISOString();
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: { cooldowns },
    });

    if (user.balance < amount) {
      return message.reply("You don't have enough balance to trade.");
    }

    // Create a select menu for the assets
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('trade_asset_select')
      .setPlaceholder('Select an asset to trade in.')
      .addOptions(COMPANIES.map(company => ({
        label: company,
        value: company,
      })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle('Trade Selection')
      .setDescription(`Please select an asset to trade in.`)
      .setColor(0x0099ff);

    const tradeMessage = await message.reply({ embeds: [embed], components: [row] });

    const filter = (interaction) => interaction.isStringSelectMenu() && interaction.customId === 'trade_asset_select';
    const collector = tradeMessage.createMessageComponentCollector({ filter, time: 15000 }); // 15 seconds to select

    collector.on('collect', async (interaction) => {

      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: `Only <@${message.author.id}> can select that.`,
          ephemeral: true
        });
      }

      const selectedAsset = interaction.values[0];

      // Calculate the trade outcome
      const outcome = Math.random() > 0.3 ? 'win' : 'lose';
      const percentage = Math.random() * 0.5 + 0.5; // Random percentage between 50% and 100%
      const tradeAmount = amount * percentage;
      const profitOrLoss = outcome === 'win' ? tradeAmount : -amount;
      const newBalance = user.balance + profitOrLoss;

      let resultMessage;
      if (outcome === 'win') {
        await prisma.user.update({
          where: { id: userId, guildId: guildId },
          data: { balance: newBalance },
        });
        resultMessage = `Your trade in **${selectedAsset}** was successful! You gained **${Math.ceil(tradeAmount).toLocaleString('en-US')}** coins.`;
        embed.setColor(0x00ff00); // Green for success
      } else {
        await prisma.user.update({
          where: { id: userId, guildId: guildId },
          data: { balance: newBalance },
        });
        resultMessage = `The trade in **${selectedAsset}** didn't go well. You lost **${Math.ceil(amount).toLocaleString('en-US')}** coins.`;
        embed.setColor(0xff0000); // Red for failure
      }

      // Update the embed with the result and additional details
      embed
        .setTitle('Trade Result')
        .setDescription(resultMessage)
        .addFields(
          { name: 'Asset', value: selectedAsset, inline: true },
          { name: outcome === 'win' ? 'Profit Ratio' : 'Loss Ratio', value: `${(percentage * 100).toFixed(2)}%`, inline: true },
          { name: outcome === 'win' ? 'Profit Amount' : 'Loss Amount', value: `${Math.ceil(profitOrLoss).toLocaleString('en-US')} coins`, inline: true },
          { name: 'Current Balance', value: `${Math.ceil(newBalance).toLocaleString('en-US')} coins`, inline: true }
        );

      // Edit the original message with the updated embed
      await tradeMessage.edit({ embeds: [embed], components: [] });

      collector.stop();
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('Trade Selection')
          .setDescription('You did not select an asset to trade in, in time.')
          .setColor(0xff0000);

        await tradeMessage.edit({ embeds: [timeoutEmbed], components: [] });
      } else {
        tradeMessage.edit({ components: [] });
      }
    });
  },
};
