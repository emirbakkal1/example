const { EmbedBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");

module.exports = {
    data: {
        name: "thieves",
        description: "Check out the top 10 thieves.",
    },
    async execute(message) {
        const guildId = message.guild.id;

        // Retrieve the top 10 thieves based on total amount looted
        const users = await prisma.user.findMany({
            where: { guildId, totalLootedAmount: { not: null } },
            orderBy: { totalLootedAmount: 'desc' },
            take: 10
        });

        if (users.length === 0) {
            return message.reply('No thieves found in the system.');
        }

        // Create an embed with the top thieves
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Top 10 Thieves')
            .setDescription(users.map((user, index) => `${index + 1}. <@${user.id}>: ${user.totalLootedAmount.toLocaleString('en-US')}$`).join('\n'))
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
            .setAuthor({ name: message.author.displayName, iconURL: message.author.avatarURL({ dynamic: true }) })

        return message.channel.send({ embeds: [embed] });
    }
};
