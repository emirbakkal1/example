const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));

module.exports = {
  data: {
    name: "game",
    description: "Play rock-paper-scissors!",
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
    const cooldownDuration = config.commandCooldowns[commandName] || 0;

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
      where: { id: userId },
      data: { cooldowns },
    });

    // Create and send the game prompt embed with buttons
    const gameEmbed = new EmbedBuilder()
      .setTitle("Rock-Paper-Scissors")
      .setDescription("Choose your move:")
      .setColor('#5865F2')
      .setFooter({ text: 'Click a button to make your choice!' });

    const rockButton = new ButtonBuilder()
      .setCustomId('rock')
      .setEmoji("🧱")
      .setStyle(ButtonStyle.Primary);

    const paperButton = new ButtonBuilder()
      .setCustomId('paper')
      .setEmoji("📰")
      .setStyle(ButtonStyle.Primary);

    const scissorsButton = new ButtonBuilder()
      .setCustomId('scissors')
      .setEmoji("✂️")
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(rockButton, paperButton, scissorsButton);

    const gameMessage = await message.reply({ embeds: [gameEmbed], components: [actionRow] });

    // Set up a collector to handle button interactions
    const filter = interaction => ['rock', 'paper', 'scissors'].includes(interaction.customId);
    const collector = gameMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timeout

    collector.on('collect', async interaction => {
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: `Only <@${message.author.id}> can use these buttons.`,
          ephemeral: true
        });
      }

      const userChoice = interaction.customId;
      const choices = ['rock', 'paper', 'scissors'];
      const botChoice = choices[Math.floor(Math.random() * choices.length)];

      let result;
      if (userChoice === botChoice) {
        result = "It's a tie!";
      } else if (
        (userChoice === 'rock' && botChoice === 'scissors') ||
        (userChoice === 'paper' && botChoice === 'rock') ||
        (userChoice === 'scissors' && botChoice === 'paper')
      ) {
        result = "You win!";
      } else {
        result = "You lose!";
      }

      // Create and send the updated result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle("Rock-Paper-Scissors")
        .setDescription(`You chose **${userChoice}**, I chose **${botChoice}**.\n\n**Result:** ${result}`)
        .setColor(result === "You win!" ? '#00FF00' : result === "It's a tie!" ? '#FFFF00' : '#FF0000')
        .setFooter({ text: 'Good luck next time!' });
        
        await interaction.deferUpdate({ fetchReply: true });

      await gameMessage.edit({ embeds: [resultEmbed], components: [] });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        // Notify the user if no response was given in time
        gameMessage.edit({
          embeds: [gameEmbed.setDescription("You did not choose an option in time.")],
          components: []
        });
      }
    });
  },
};
