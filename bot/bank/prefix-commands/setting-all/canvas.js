const { EmbedBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
  data: {
    name: "canvas",
    description: "Enable and set an image or disable canvas functionality"
  },
  async execute(message, args) {
    const guildId = message.guild.id;

    // Fetch settings for the guild using findFirst instead of findUnique
    const settings = await prisma.setting.findFirst({
      where: { guildId: guildId },
    });

    if (!settings) {
      return message.reply('Settings for this guild could not be found.');
    }

    // Check if settings.token and settings.token.subscription exist
    const isOwner = settings.token?.subscription?.customerId === message.author.id;

    // Check if the user is the bot owner or an admin
    const isAdmin = settings.admins.includes(message.author.id);

    if (!isAdmin && !isOwner) {
      return message.reply('Only the bot owner or an admin can use this command.');
    }

    if (!args.length) {
      return message.reply('Please specify `enable` or `disable`.');
    }

    const action = args[0].toLowerCase();

    if (action !== 'enable' && action !== 'disable') {
      return message.reply('Invalid argument. Please specify `enable` or `disable`.');
    }

    // Update the canvas setting
    const canvasEnabled = action === 'enable';

    // Use the setting's unique ID for the update
    await prisma.setting.update({
      where: { id: settings.id },
      data: { canvas: canvasEnabled },
    });

    // Create the embed response
    const embed = new EmbedBuilder()
      .setColor(canvasEnabled ? 0x008000 : 0xff0000)
      .setTitle(`Canvas has been ${canvasEnabled ? 'enabled' : 'disabled'}`)
      .setDescription(`Canvas functionality is now ${canvasEnabled ? 'enabled' : 'disabled'}.`);

    if (canvasEnabled && message.attachments.size > 0) {
      const attachment = message.attachments.first();
      const imageUrl = attachment.url;
      const imageName = `${guildId}.png`;  // Name the image with the guild ID
      const imagePath = path.join(__dirname, '../canvasimages', imageName);  // Path to save the image

      // Ensure the canvasimages directory exists
      const canvasImagesDir = path.join(__dirname, '../canvasimages');
      if (!fs.existsSync(canvasImagesDir)) {
        fs.mkdirSync(canvasImagesDir, { recursive: true });
      }

      // Download the image and save it locally
      try {
        const response = await axios({
          url: imageUrl,
          responseType: 'stream'
        });

        // Save the image to the canvasimages folder
        response.data.pipe(fs.createWriteStream(imagePath));

        embed.setImage(`attachment://${imageName}`);
        message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.error('Error downloading or saving the image:', error);
        return message.reply('There was an error saving the image.');
      }
    } else {
      return message.channel.send({ embeds: [embed] });
    }
  },
};