const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');
const { getAverageColor } = require('fast-average-color-node');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const commandCooldowns = config.commandCooldowns || {};

const JOBS = ["pilot", "lawyer", "doctor", "teacher"];
const MIN_SALARY = 5000;
const MAX_SALARY = 50000;
const COOLDOWN_DURATION = commandCooldowns["salary"] || 240000; // Default to 4 minutes

module.exports = {
  data: {
    name: "salary",
    description: "Get a random job and earn a random amount of coins.",
    cooldown: COOLDOWN_DURATION,
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

    // Generate random job and salary
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    const salary = Math.floor(Math.random() * (MAX_SALARY - MIN_SALARY + 1)) + MIN_SALARY;

    // Update the user's balance
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: { balance: { increment: salary } },
    });

    // Update cooldown for the command
    cooldowns[commandName] = now.toISOString();
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: { cooldowns },
    });


    const settings = await prisma.setting.findFirst({
      where: { guildId: guildId },
    });

    if (settings?.canvas) {
      const canvas = createCanvas(1361, 571);
      const ctx = canvas.getContext('2d');

      function drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
      }

      const imagePath = path.join(__dirname, '../canvasimages', `${guildId}.png`);

      const imageAverageColor = await getAverageColor(imagePath)
      const colorHex = imageAverageColor.hex

      if (fs.existsSync(imagePath)) {
        try {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = colorHex // Set the background color (Hex or RGB)
          ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas with the color
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // 50% opacity black
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const outerFrameThickness = 5;
          const outerRadius = 15; // Radius for the outer rounded corners
          ctx.strokeStyle = colorHex; // Frame color
          ctx.lineWidth = outerFrameThickness;
          drawRoundedRect(ctx, outerFrameThickness / 2, outerFrameThickness / 2, canvas.width - outerFrameThickness, canvas.height - outerFrameThickness, outerRadius);
          ctx.stroke();
              } catch (error) {
          console.error('Error loading the background image:', error);
          return message.reply('There was an error loading the background image.');
        }
      } else {
        ctx.fillStyle = '#2C2F33';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
  
      // Load the user's avatar as a PNG image
      try {
        const avatarUrl = message.author.displayAvatarURL({ format: 'png', size: 256 });
        const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];

        let avatarBuffer = Buffer.from(response.data, 'binary');

        if (!contentType.startsWith('image/png')) {
          avatarBuffer = await sharp(avatarBuffer).png().toBuffer();
        }

        const avatar = await loadImage(avatarBuffer);
  
        // Draw the rounded rectangle and use it as a clipping mask
        const avatarX = 50;
        const avatarY = canvas.height - 110;
        const avatarWidth = 68;
        const avatarHeight = 68;
        const avatarRadius = 10;
  
        ctx.save(); // Save the current state
  
        // Create the clipping mask
        drawRoundedRect(ctx, avatarX, avatarY, avatarWidth, avatarHeight, avatarRadius);
        ctx.clip(); // Clip to the rounded rectangle
  
        // Draw the avatar inside the clipped area
        ctx.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
  
        ctx.restore(); // Restore the previous state
        
      } catch (error) {
        console.error('Error loading user profile picture:', error);
      }

      try {
        const guildUrl = message.guild.iconURL({ format: 'png', size: 256 });
  
        if (guildUrl) {
          const response = await axios.get(guildUrl, { responseType: 'arraybuffer' });
          const contentType = response.headers['content-type'];
  
          let guildBuffer = Buffer.from(response.data, 'binary');
  
          if (!contentType.startsWith('image/png')) {
            guildBuffer = await sharp(guildBuffer).png().toBuffer();
          }
  
          const guildImage = await loadImage(guildBuffer);
  
          // Draw the rounded rectangle and use it as a clipping mask
          const avatarX = 73;
          const avatarY = 40;
          const avatarWidth = 75;
          const avatarHeight = 75;
          const avatarRadius = 10;
  
          ctx.save(); // Save the current state
  
          // Create the clipping mask
          drawRoundedRect(ctx, avatarX, avatarY, avatarWidth, avatarHeight, avatarRadius);
          ctx.clip(); // Clip to the rounded rectangle
  
          // Draw the guild image inside the clipped area
          ctx.drawImage(guildImage, avatarX, avatarY, avatarWidth, avatarHeight);
  
          ctx.restore(); // Restore the previous state
        } else {
          // Guild does not have an icon, fill the square with colorHex
          const avatarX = 73;
          const avatarY = 40;
          const avatarWidth = 75;
          const avatarHeight = 75;
          const avatarRadius = 10;
  
          // Set the fill color
          ctx.fillStyle = colorHex;
  
          // Draw the rounded rectangle and fill it with the color
          drawRoundedRect(ctx, avatarX, avatarY, avatarWidth, avatarHeight, avatarRadius);
          ctx.fill(); // Fill the rounded rectangle with the color
        }
      } catch (error) {
        console.error('Error loading guild picture:', error);
  
        // In case of any error, also fill the square with colorHex
        const avatarX = 73;
        const avatarY = 30;
        const avatarWidth = 75;
        const avatarHeight = 75;
        const avatarRadius = 10;
  
        // Set the fill color
        ctx.fillStyle = colorHex;
  
        // Draw the rounded rectangle and fill it with the color
        drawRoundedRect(ctx, avatarX, avatarY, avatarWidth, avatarHeight, avatarRadius);
        ctx.fill(); // Fill the rounded rectangle with the color
      }

      const dollarEmojiPath = path.join(__dirname, '../canvasimages', 'dollar_emoji.png');
      try {
        const dollarEmojiImage = await loadImage(dollarEmojiPath);
        const emojiSize = 75;
        ctx.drawImage(dollarEmojiImage, 50, canvas.height - 195, emojiSize, emojiSize);
      } catch (error) {
        console.error('Error loading the dollar emoji image:', error);
      }

      const bagEmojiPath = path.join(__dirname, '../canvasimages', 'money-bag.png');
      try {
        const bagEmojiImage = await loadImage(bagEmojiPath);
        const emojiSize = 75;
        ctx.drawImage(bagEmojiImage, 50, canvas.height - 280, emojiSize, emojiSize);
      } catch (error) {
        console.error('Error loading the bag emoji image:', error);
      }

      const padding = 60;
      const lineY = 160; // Fixed distance from the top of the canvas
      
      // Set the X position where the line should start and end
      const startX = padding;  // 15 units from the left edge
      const endX = canvas.width - padding; // 15 units from the right edge
      
      ctx.strokeStyle = colorHex;
      
      // Set the line width
      ctx.lineWidth = 7;  // Adjust the line width as needed
      
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(startX, lineY);  // Start point of the line
      ctx.lineTo(endX, lineY);    // End point of the line
      ctx.stroke();  // Render the line

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px Sans';
      ctx.fillText(`${message.author.displayName}`, 150, + canvas.height - 55);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${((user.balance) + salary).toLocaleString('en-US')}`, 150, + canvas.height - 140);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${(salary).toLocaleString('en-US')}`, 150, + canvas.height - 220);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Deposit process`, canvas.width - 460, + canvas.height - 335);

      ctx.font = 'bold 65px Sans'
      ctx.fillStyle = '#808080';
      ctx.fillText(`now`, canvas.width - 200, 110);

      ctx.font = 'bold 30px Sans';

      const jobWidth = ctx.measureText("Salary amount has been deposited, job : "+job).width;

      const textJobX = canvas.width - padding - jobWidth; // Position text with padding from the right edge
      const textJobY = canvas.height / 2; // Example Y position, adjust as needed
    
      // Set text color and draw the text
      ctx.fillStyle = '#ffffff';
      ctx.fillText("Salary amount has been deposited, job : "+job, textJobX, textJobY + 10); // Draw the text

      let fontSize = 70;
      ctx.font = `bold ${fontSize}px Sans`;
      const payText = `Pay`;

      const framePadding = 40;

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
      const textXPay = 170;
      const textYPay = 105; // 10 pixels from the bottom

      // Draw the guild name in colorHex
      ctx.fillStyle = colorHex;
      ctx.fillText(message.guild.name, textXPay, textYPay);

      // Draw "Pay" in white, positioned right after the guild name
      ctx.fillStyle = '#ffffff';
      ctx.fillText(payText, textXPay + guildNameWidth, textYPay);

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'balance.png' });

      await message.reply({ files: [attachment] });
    } else {
    // Send a result message
    const salaryEmbed = new EmbedBuilder()
      .setTitle('Salary Received!')
      .setColor(0x00FF00)
      .setDescription(`You worked as a **${job}**\nearned **${salary.toLocaleString('en-US')}** coins!\nYour current balance **${((user.balance) + salary).toLocaleString('en-US')}**`)
      .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

    return message.reply({ embeds: [salaryEmbed] });
    }
  },
};