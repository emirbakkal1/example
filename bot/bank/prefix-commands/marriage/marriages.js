const { Message } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "marriages",
    description: "List the top 10 most expensive marriages.",
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    const guildId = message.guild.id;

    // Retrieve the top 10 most expensive marriages
    const topMarriages = await prisma.marriage.findMany({
      where: { guildId: guildId },
      orderBy: { amount: 'desc' },
      take: 10,
    });

    if (topMarriages.length === 0) {
      const noMarriagesEmbed = new EmbedBuilder()
        .setTitle("No Marriages Found")
        .setColor(0xFF0000)
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setDescription("No marriages have been recorded in this server.");

      return await message.reply({ embeds: [noMarriagesEmbed] });
    }

    // Create the embed message
    const marriagesEmbed = new EmbedBuilder()
      .setTitle("Top 10 Most Expensive Marriages")
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${message.author.tag}` });

    // Add the marriage details to the embed
    topMarriages.forEach((marriage, index) => {
      marriagesEmbed.addFields({
        name: `#${index + 1} - Amount: ${marriage.amount}`,
        value: `<@${marriage.user1Id}> and <@${marriage.user2Id}>`,
      });
    });

    return await message.reply({ embeds: [marriagesEmbed] });
  },
};