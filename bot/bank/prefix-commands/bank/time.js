const { EmbedBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));

function capitalizeFirstLetter(str) {
  if (str.length === 0) return str; // Return an empty string if input is empty
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  data: {
    name: "time",
    description: "Learn your remaining cooldowns for commands and deposit time.",
  },
  /**
   *
   * @param {Message} message
   * @param {*} args
   * @returns
   */
  async execute(message, args) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    const commandCooldowns = config.commandCooldowns;

    async function findOrCreateUser(userId, guildId) {
      let user = await prisma.user.findUnique({
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
            depositAmount: 0,
            depositTimestamp: null,
            profitPercentage: 0,
            depositTimePeriod: null,
          },
        });
      }

      return user;
    }

    const user = await findOrCreateUser(userId, guildId);
    const cooldowns = user.cooldowns || {};
    const now = new Date();

    let cooldownMessages = [];

    // Check remaining cooldowns for each command
    for (const [commandName, cooldownDuration] of Object.entries(commandCooldowns)) {
      const lastUsed = cooldowns[commandName];

      if (lastUsed) {
        const lastUsedTime = new Date(lastUsed);
        const timeDifference = now - lastUsedTime;

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

        if (timeDifference < cooldownDuration) {
          const remainingTime = Math.ceil((cooldownDuration - timeDifference) / 1000); // in seconds
          cooldownMessages.push(`**${capitalizeFirstLetter(commandName)}**: ${formatDuration((cooldownDuration - timeDifference))} remaining`);
        } else {
          cooldownMessages.push(`**${capitalizeFirstLetter(commandName)}**: Ready to use`);
        }
      } else {
        cooldownMessages.push(`**${capitalizeFirstLetter(commandName)}**: Ready to use`);
      }
    }

    // Check deposit status
    if (user.depositTimestamp && user.depositTimePeriod) {
      const depositEnd = new Date(parseInt(user.depositTimestamp) + (parseInt(user.depositTimePeriod.replace('h', '')) * 60 * 60 * 1000));
      const depositTimeRemaining = depositEnd - now;

      const depositFormatDuration = (ms) => {
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

      if (depositTimeRemaining > 0) {
        cooldownMessages.push(`**Deposit**: ${depositFormatDuration(depositTimeRemaining)} remaining`);
      } else {
        cooldownMessages.push(`**Deposit**: Ready to use`);
      }
    } else {
      cooldownMessages.push("**Deposit**: Ready to use");
    }

    // Send the cooldowns and deposit status as a single message
    const cooldownEmbed = new EmbedBuilder()
      .setTitle('Remaining Cooldowns and Deposit Status')
      .setColor('#5865F2')
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
      .setAuthor({ name: message.author.displayName, iconURL: message.author.avatarURL({ dynamic:true }) })
      .setThumbnail(message.author.avatarURL({ dynamic:true }))
      .setDescription(cooldownMessages.join("\n"));

    await message.reply({ embeds: [cooldownEmbed] });
  },
};