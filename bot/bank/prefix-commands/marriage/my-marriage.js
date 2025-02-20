const { Message } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const { errorEmbed } = require("../../utils/functions");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "my-marriage",
    description: "View your current marriage status.",
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

    const user = await prisma.user.findUnique({ where: { id: userId, guildId: guildId } });

    if (!user || !user.marriedTo) {
      const notMarriedEmbed = errorEmbed(message).setDescription(
        "You are not currently married.",
      );
      return await message.reply({ embeds: [notMarriedEmbed] });
    }

    const spouse = await prisma.user.findUnique({ where: { id: user.marriedTo, guildId: guildId } });

    if (!spouse) {
      const spouseNotFoundEmbed = errorEmbed(message).setDescription(
        "Your spouse could not be found.",
      );
      return await message.reply({ embeds: [spouseNotFoundEmbed] });
    }

    const marriageStatus = new EmbedBuilder()
      .setTitle("Marriage Status")
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setDescription(`You are married to <@${spouse.id}>.`);

    return await message.reply({ embeds: [marriageStatus] });
  },
};