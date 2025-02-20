const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));
const commandCooldowns = config.commandCooldowns || {};

// Create a formatter for currency with commas and no fractional numbers
const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

module.exports = {
  data: {
    name: "risk",
    description: "Risk an amount of your balance for a chance to win or lose.",
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const commandName = this.data.name;
    const cooldownDuration = commandCooldowns[commandName] || 0;

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

    // Parse the amount argument
    const balance = user.balance;
    let amount = parseFloat(args[0]);

    if (!args[0]) {
      return message.reply("Please specify the amount to risk.");
    }

    if (args[0].toLowerCase() === "whole") {
      amount = balance;
    } else if (args[0].toLowerCase() === "half") {
      amount = balance / 2;
    } else if (args[0].toLowerCase() === "quarter") {
      amount = balance / 4;
    } else if (isNaN(amount) || amount <= 0 || amount > balance) {
      return message.reply("Invalid amount specified.");
    }

    // Determine win or loss
    const win = Math.random() < 0.7; // 70% chance to win
    const resultAmount = win ? amount * 1 : 0;

    // Update user balance
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: {
        balance: resultAmount > 0 ? { increment: resultAmount - amount } : { decrement: amount },
      },
    });

    // Update cooldown for the command
    cooldowns[commandName] = now.toISOString();
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: { cooldowns },
    });

    // Send a result message
    const resultEmbed = new EmbedBuilder()
      .setTitle("Risk Result")
      .setColor(win ? 0x00FF00 : 0xFF0000) // Green for win, red for loss
      .setDescription(
        win
          ? `Congratulations! You risked **${formatter.format(amount)}** coins and won **${formatter.format(resultAmount)}** coins.`
          : `Sorry, you risked **${formatter.format(amount)}** coins and lost.`
      );

    return message.reply({ embeds: [resultEmbed] });
  },
};