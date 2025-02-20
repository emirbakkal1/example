const { Message } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const { errorEmbed } = require("../../utils/functions");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "divorce",
    description: "Divorce the user you are married to.",
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    console.log('neee')
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Fetch the user and their marriage details
    const user = await prisma.user.findUnique({ where: { id: userId, guildId: guildId } });
    if (!user) {
      const userNotFoundEmbed = errorEmbed(message).setDescription(
        "User not found.",
      );
      return await message.reply({ embeds: [userNotFoundEmbed] });
    }

    const marriedToId = user.marriedTo;
    if (!marriedToId) {
      const notMarriedEmbed = errorEmbed(message).setDescription(
        "You are not married.",
      );
      return await message.reply({ embeds: [notMarriedEmbed] });
    }

    // Fetch the spouse user details
    const spouse = await prisma.user.findUnique({ where: { id: marriedToId, guildId: guildId } });
    if (!spouse) {
      const spouseNotFoundEmbed = errorEmbed(message).setDescription(
        "Spouse not found.",
      );
      return await message.reply({ embeds: [spouseNotFoundEmbed] });
    }

    // Remove marriage details from both users
    await prisma.user.updateMany({
      where: {
        id: { in: [userId, marriedToId] },
        guildId: guildId,
      },
      data: {
        marriedTo: null,
      },
    });

    // Delete the marriage record from the database
    await prisma.marriage.deleteMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: marriedToId },
          { user1Id: marriedToId, user2Id: userId },
        ],
        guildId: guildId,
      },
    });

    const divorceSuccessful = new EmbedBuilder()
      .setTitle("Divorce Successful")
      .setColor(0xFF0000)
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setDescription(`You have divorced <@${marriedToId}>.`);

    return await message.reply({ embeds: [divorceSuccessful] });
  },
};