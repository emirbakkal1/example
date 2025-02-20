const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));

module.exports = {
  data: {
    name: "dice",
    description: "Play a dice game and bet an amount.",
    cooldown: config.commandCooldowns.dice, // Cooldown from config.json
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const commandName = this.data.name;
    const cooldownDuration = this.data.cooldown;

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

    // Parse the bet amount
    const balance = user.balance;
    let amount = parseFloat(args[0]);

    if (!args[0]) {
      return message.reply("Please specify the amount to bet.");
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

    // Roll the dice
    const playerRoll = Math.floor(Math.random() * 99) + 1; // Roll between 1 and 99
    const botRoll = Math.floor(Math.random() * 99) + 1;

    let resultMessage;
    if (playerRoll > botRoll) {
      // Player wins
      await prisma.user.update({
        where: { id: userId, guildId: guildId },
        data: { balance: { increment: amount } },
      });
      resultMessage = `🎉 You rolled **${playerRoll}** and the bot rolled **${botRoll}**. You won **${Math.ceil(amount).toLocaleString('en-US')}** coins!`;
    } else if (playerRoll < botRoll) {
      // Player loses
      await prisma.user.update({
        where: { id: userId, guildId: guildId },
        data: { balance: { decrement: amount } },
      });
      resultMessage = `😢 You rolled **${playerRoll}** and the bot rolled **${botRoll}**. You lost **${Math.ceil(amount).toLocaleString('en-US')}** coins.`;
    } else {
      // Draw
      resultMessage = `🤝 You both rolled **${playerRoll}**. It's a draw, and you neither lose nor win coins.`;
    }

    // Update cooldown for the command
    cooldowns[commandName] = now.toISOString();
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: { cooldowns },
    });

    // Send the result message
    const resultEmbed = new EmbedBuilder()
      .setTitle("Dice Game Result")
      .setColor("#5865F2")
      .setDescription(resultMessage);

    return message.reply({ embeds: [resultEmbed] });
  },
};