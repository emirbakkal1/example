const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));
const commandCooldowns = config.commandCooldowns || {};

module.exports = {
  data: {
    name: "button",
    description: "Button game",
  },
  async execute(message, args) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const commandName = this.data.name;
    const cooldownDuration = commandCooldowns[commandName] || 0;

    // Retrieve or create a user in the database
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
        const timeRemaining = cooldownDuration - timeDifference;
        const seconds = Math.floor((timeRemaining / 1000) % 60);
        const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
        const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

        const formattedTime = `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
        const cooldownEmbed = new EmbedBuilder()
        .setTitle('Cooldown Time')
        .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(`${message.author} Please wait **${formattedTime}** before using this command again.`)
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

    // Create an initial grid of gray buttons
    const buttons = [];
    for (let i = 0; i < 16; i++) {
      buttons.push(new ButtonBuilder()
        .setCustomId(`button_${i}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel('・')
        .setDisabled(true));  // Initially disabled
    }

    const rows = [
      new ActionRowBuilder().addComponents(buttons.slice(0, 4)),
      new ActionRowBuilder().addComponents(buttons.slice(4, 8)),
      new ActionRowBuilder().addComponents(buttons.slice(8, 12)),
      new ActionRowBuilder().addComponents(buttons.slice(12, 16))
    ];

    // Send the initial message with gray buttons
    const gameMessage = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Button Game")
          .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setDescription("Be the fastest to press the button to win $10,000!")
          .setColor('#008000')
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
      ],
      components: rows
    });

    // After 5 seconds, turn one random button green and make it clickable
    setTimeout(async () => {
      const randomButtonIndex = Math.floor(Math.random() * 16);
      buttons[randomButtonIndex]
        .setStyle(ButtonStyle.Success)
        .setLabel('🟩')
        .setDisabled(false);  // Enable only the green button

      // Update the message with the new button setup
      await gameMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle("Button Game")
            .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setDescription("Be the fastest to press the button to win $10,000!")
            .setColor('#008000')
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
        ],
        components: rows
      });

      // Interaction filter and collector
      const filter = i => i.customId === `button_${randomButtonIndex}`;
      const collector = gameMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30000 });

      collector.on('collect', async interaction => {
        await interaction.deferUpdate({ fetchReply: true });
        // Add 10,000 coins to the winner's balance
        await prisma.user.update({
          where: { id: interaction.user.id },
          data: { balance: { increment: 10000 } }
        });

        // Announce the winner by editing the original message
        rows.forEach(row => row.components.forEach(button => button.setDisabled(true)));
        await gameMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle("Button Game")
              .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
              .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
              .setDescription(`${interaction.user} was the fastest!\nYou won! $10,000 have been added to your bank.`)
              .setColor('#008000')
              .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
          ],
          components: rows
        });

        collector.stop();
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          // No one pressed the button in time, disable all buttons
          rows.forEach(row => row.components.forEach(button => button.setDisabled(true)));
          await gameMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle("Button Game")
                .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setDescription('No one pressed the button in time!\nYou missed your chance to win $10,000.')
                .setColor('#FF0000')
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            ],
            components: rows
          });
        }
      });
    }, 5000);  // Delay of 5 seconds before enabling one button
  },
};