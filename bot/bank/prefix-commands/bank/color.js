const { EmbedBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const { Flood } = require('discord-gamecord');
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));
const commandCooldowns = config.commandCooldowns || {};

module.exports = {
  data: {
    name: "color",
    description: "Color game",
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
            lastPlayed: null,
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

    // Update cooldown for the command
    cooldowns[commandName] = now.toISOString();
    await prisma.user.update({
      where: { id: userId },
      data: { cooldowns },
    });

    // Start the Flood game
    const Game = new Flood({
      message: message,
      isSlashGame: false,
      embed: {
        title: 'Color',
        color: '#5865F2',
      },
      difficulty: 13,
      timeoutTime: 60000,
      buttonStyle: 'PRIMARY',
      emojis: ['🟥', '🟦', '🟧', '🟪', '🟩'],
      winMessage: 'You won! You took **{turns}** attempts.\n$5,000 have been added to your bank.',
      loseMessage: 'You lost! You took **{turns}** attempts.\nYou missed your chance to win $5,000',
      playerOnlyMessage: 'Only {player} can use these buttons.'
    });

    const gameMessage = await Game.startGame();

    Game.on('gameOver', async result => {
      console.log(result);  // =>  { result... }
      if (result.result === 'win') {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: user.balance + 5000 },
        });
      }

      cooldowns[commandName] = new Date().toISOString();
      await prisma.user.update({
        where: { id: userId },
        data: { cooldowns },
      });
    });
  },
};