const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { prisma } = require('../../../src/database/db');

async function handleCanvasOrEmbed(interaction) {
  const canvasSelectMenu = new StringSelectMenuBuilder()
      .setCustomId('canvas_options_select')
      .setPlaceholder('Choose a canvas option')
      .addOptions([
          {
              label: 'Send a banner',
              description: 'Send a custom banner for the bot replies',
              value: 'send_banner',
          },
          {
              label: 'Use server banner',
              description: 'Automatically use the server banner for bot replies',
              value: 'server_banner',
          },
      ]);

  const row = new ActionRowBuilder().addComponents(canvasSelectMenu);
  await interaction.reply({ content: 'Choose how to use Canvas for bot replies:', components: [row], ephemeral: true });

  const filter = i => i.customId === 'canvas_options_select' && i.user.id === interaction.user.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 60000 });

  collector.on('collect', async i => {
      const selection = i.values[0];

      if (selection === 'send_banner') {
          await prisma.botSettings.update({
              where: { guildId: interaction.guildId },
              data: { replyType: 'canvas', canvasType: 'custom' },
          });
          await i.update({ content: 'Please upload a custom banner image for bot replies.', components: [] });

          // Wait for the user's attachment upload
          const attachmentFilter = m => m.author.id === interaction.user.id && m.attachments.size > 0;
          const attachmentCollector = interaction.channel.createMessageCollector({ filter: attachmentFilter, max: 1, time: 60000 });

          attachmentCollector.on('collect', async msg => {
              const attachment = msg.attachments.first();
              
              // Check if the attachment is an image
              if (!attachment.contentType.startsWith('image/')) {
                  return msg.reply('The uploaded file is not an image. Please try again.');
              }

              const imageUrl = attachment.url;
              const imageName = `${interaction.guildId}.png`;
              const imagePath = path.join(__dirname, '../canvasimages', imageName);

              try {
                  // Ensure the canvasimages directory exists
                  const canvasImagesDir = path.join(__dirname, '../canvasimages');
                  if (!fs.existsSync(canvasImagesDir)) {
                      fs.mkdirSync(canvasImagesDir, { recursive: true });
                  }

                  // Download and save the image
                  const response = await axios({
                      url: imageUrl,
                      responseType: 'stream'
                  });
                  response.data.pipe(fs.createWriteStream(imagePath));

                  await msg.reply('Banner image has been successfully uploaded and saved!');
              } catch (error) {
                  console.error('Error downloading or saving the image:', error);
                  await msg.reply('There was an error saving the image.');
              }
          });

          attachmentCollector.on('end', collected => {
              if (collected.size === 0) {
                  interaction.editReply({ content: 'No image uploaded. Operation canceled.', components: [] });
              }
          });
      } else if (selection === 'server_banner') {
          await prisma.botSettings.update({
              where: { guildId: interaction.guildId },
              data: { replyType: 'canvas', canvasType: 'server' },
          });
          await i.update({ content: 'Bot replies will now use the server banner.', components: [] });
      }
  });

  collector.on('end', collected => {
      if (collected.size === 0) {
          interaction.editReply({ content: 'No selection made. Operation canceled.', components: [] });
      }
  });
}

module.exports = { handleCanvasOrEmbed };