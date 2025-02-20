const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "richest",
    description: "Check out who the top 10 richest is.",
  },
  async execute(message) {
    const guildId = message.guild.id;

    // Retrieve the top 10 richest users
    const users = await prisma.user.findMany({
        where: { guildId },
        orderBy: { balance: 'desc' },
        take: 10
    });

    if (users.length === 0) {
        return message.reply('No users found in the system.');
    }

    // Create an embed with the richest users
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Top 10 Richest Players')
        .setDescription(users.map((user, index) => `${index + 1}. <@${user.id}>: ${user.balance.toLocaleString('en-US')}$`).join('\n'))
        .setThumbnail(message.guild.iconURL())
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
        .setAuthor({ name: message.author.displayName, iconURL: message.author.avatarURL({ dynamic: true }) })

    return message.channel.send({ embeds: [embed] });
    }
};