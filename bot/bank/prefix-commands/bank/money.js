const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const { getAverageColor } = require('fast-average-color-node');

module.exports = {
  data: {
    name: "money",
    description: "Learn your balance or another user's balance",
  },
  async execute(message, args) {
    const guildId = message.guild.id;
    let userId = message.author.id;

    if (args.length > 0) {
      const mention = args[0];
      if (mention.startsWith('<@') && mention.endsWith('>')) {
        userId = mention.replace(/[<>@!]/g, '');  // Extract ID from mention
      } else if (/^\d{17,19}$/.test(mention)) {
        userId = mention;  // Use the plain ID
      } else {
        return message.reply("Please provide a valid user mention or ID.");
      }
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
          },
        });
      }

      return user;
    }

    let member;
    try {
      member = await message.guild.members.fetch(userId);
    } catch (error) {
      return message.reply("The account you mentioned is not a user.");
    }

    if (member.user.bot) {
      return message.reply("The account you mentioned is not a user.");
    }

    const user = await findOrCreateUser(userId, guildId);
    const settings = await prisma.setting.findFirst({
      where: { guildId: guildId },
    });

    const formattedBalance = user.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (settings?.canvas) {
      const canvas = createCanvas(1361, 571);
      const ctx = canvas.getContext('2d');

      const imagePath = path.join(__dirname, '../canvasimages', `${guildId}.png`);

      if (fs.existsSync(imagePath)) {
        try {
          ctx.globalAlpha = 0.3;
          const background = await loadImage(imagePath);
          ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 50% opacity black
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error('Error loading the background image:', error);
          return message.reply('There was an error loading the background image.');
        }
      } else {
        ctx.fillStyle = '#2C2F33';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      function drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
        ctx.lineTo(x + radius, y + height);
        ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
        ctx.lineTo(x, y + radius);
        ctx.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2);
        ctx.closePath();
        ctx.stroke();
      }

      const imageAverageColor = await getAverageColor(imagePath)
      const colorHex = imageAverageColor.hex
      ctx.strokeStyle = colorHex
      
      ctx.lineWidth = 5;
      const framePadding = 40;
      drawRoundedRect(ctx, framePadding, framePadding, canvas.width - 2 * framePadding, canvas.height - 2 * framePadding, 15);

      try {
        const avatarUrl = member.user.displayAvatarURL({ format: 'png', size: 256 });
        const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];

        let avatarBuffer = Buffer.from(response.data, 'binary');

        if (!contentType.startsWith('image/png')) {
          avatarBuffer = await sharp(avatarBuffer).png().toBuffer();
        }

        const avatarImage = await loadImage(avatarBuffer);

        const avatarSize = 270;
        const avatarX = (canvas.width - avatarSize) / 2 - 350;
        const avatarY = (canvas.height - avatarSize) / 2 - 15;

        const frameSize = avatarSize + 20;
        const frameX = avatarX - 10;
        const frameY = avatarY - 10;

        ctx.save();
        ctx.beginPath();
        ctx.arc(frameX + frameSize / 2, frameY + frameSize / 2, frameSize / 2, 0, Math.PI * 2, true);
        ctx.lineWidth = 15;
        ctx.strokeStyle = colorHex;
        ctx.stroke();
        ctx.clip();

        ctx.save();
        ctx.beginPath();
        ctx.arc(frameX + frameSize / 2, frameY + frameSize / 2, frameSize / 2, 0, Math.PI * 2, true);
        ctx.clip();
        ctx.drawImage(avatarImage, frameX, frameY, frameSize, frameSize);
        ctx.restore();

        ctx.restore();
      } catch (error) {
        console.error('Error loading the avatar image:', error);
        return message.reply('There was an error loading the avatar image.');
      }

      const textX = canvas.width / 2 - 150;
      const textY = canvas.height / 2 - 60;

      ctx.fillStyle = colorHex;
      ctx.font = 'bold 60px Sans';
      ctx.fillText(`${member.displayName}`, textX, textY + 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px Sans';
      ctx.fillText(`${formattedBalance}`, textX + 70, textY + 90); // Adjust position for balance

      // Load dollar emoji and draw it next to the balance
      const dollarEmojiPath = path.join(__dirname, '../canvasimages', 'dollar_emoji.png');
      try {
        const dollarEmojiImage = await loadImage(dollarEmojiPath);
        const emojiSize = 60;
        ctx.drawImage(dollarEmojiImage, textX, textY + 38, emojiSize, emojiSize);
      } catch (error) {
        console.error('Error loading the dollar emoji image:', error);
      }

      let fontSize = 70;
      ctx.font = `bold ${fontSize}px Sans`;
      const payText = `Pay`;

      // Measure the width of both parts of the text (guildName and payText)
      let guildNameWidth = ctx.measureText(message.guild.name).width;
      let payTextWidth = ctx.measureText(payText).width;
      let totalTextWidth = guildNameWidth + payTextWidth;

      // Adjust the font size if the combined text is too wide for the canvas
      while (totalTextWidth > canvas.width - framePadding * 2) {
        fontSize -= 2; // Decrease font size
        ctx.font = `bold ${fontSize}px Sans`;
        guildNameWidth = ctx.measureText(message.guild.name).width;
        payTextWidth = ctx.measureText(payText).width;
        totalTextWidth = guildNameWidth + payTextWidth;
      }

      // Calculate position for the text (bottom right with padding)
      const textXPay = canvas.width - framePadding - totalTextWidth - 50;
      const textYPay = canvas.height - framePadding - 50; // 10 pixels from the bottom

      // Draw the guild name in colorHex
      ctx.fillStyle = colorHex;
      ctx.fillText(message.guild.name, textXPay, textYPay);

      // Draw "Pay" in white, positioned right after the guild name
      ctx.fillStyle = '#ffffff';
      ctx.fillText(payText, textXPay + guildNameWidth, textYPay);

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'balance.png' });

      await message.reply({ files: [attachment] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Balance")
        .setDescription(`<@${userId}> has a balance of **${formattedBalance}** coins.`)
        .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
        .setColor(0x00FF00);

      await message.reply({ embeds: [embed] });
    }
  },
};
