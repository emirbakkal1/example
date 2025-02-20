const { Message } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const { errorEmbed } = require("../../utils/functions");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "revoke-marriage",
    description: "Revoke the marriage of a specified user.",
    options: [
      {
        name: "user",
        type: "USER",
        description: "The user whose marriage is to be revoked.",
        required: true,
      },
    ],
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const targetUser = message.mentions.users.first();

    if (!targetUser) {
      const noUserEmbed = errorEmbed(message).setDescription(
        "Please mention a valid user.",
      );
      return await message.reply({ embeds: [noUserEmbed] });
    }

    const user = await prisma.user.findUnique({ where: { id: userId, guildId: guildId } });
    const target = await prisma.user.findUnique({ where: { id: targetUser.id, guildId: guildId } });

    if (!user || !target || user.marriedTo !== targetUser.id || target.marriedTo !== userId) {
      const notMarriedEmbed = errorEmbed(message).setDescription(
        "The mentioned user is not married to you.",
      );
      return await message.reply({ embeds: [notMarriedEmbed] });
    }

    // Remove marriage status from both users
    await prisma.user.updateMany({
      where: { id: { in: [userId, targetUser.id] }, guildId: guildId },
      data: { 
        marriedTo: null,
      },
    });

    // Optionally, you can remove the marriage record from the database if needed
    await prisma.marriage.deleteMany({
      where: { 
        OR: [
          { user1Id: userId, user2Id: targetUser.id },
          { user1Id: targetUser.id, user2Id: userId },
        ],
        guildId: guildId,
      },
    });

    const revocationSuccessful = new EmbedBuilder()
      .setTitle("Marriage Revoked")
      .setColor(0xFF0000)
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setDescription(`The marriage with <@${targetUser.id}> has been revoked.`);

    return await message.reply({ embeds: [revocationSuccessful] });
  },
};