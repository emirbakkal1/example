const { Message, EmbedBuilder, bold, inlineCode } = require("discord.js");
const config = require("../../config.json");
const {
  toggleEmbedColor,
  updateEmbedColor,
  getMasterInfo,
} = require("../../lib/info");
const {
  buildEmbed,
  CustomEmbedBuilder,
  serverEmbed,
  errorEmbed,
} = require("../../utils/functions");
const {
  setEmbedAll,
  updateEmbedColorAll,
  getBotInfoAll,
} = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const { prisma } = require("../../../../src/database/db");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "embedall",
    description: "Activate embed and specify its color or disable it",
    aliases: ["ea"],
  },
  adminOnly: true,
  allCommands: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const isMaster = await determineRespondingBot(
      message.author.id,
      message.guild.id,
      message.client.user.id,
    );
    if (!args.length) {
      if (!isMaster) return;
      const embed = errorEmbed(message).setDescription(
        "Please use `on` or `off` to enable or disable embeds. You can also specify a hex color to set the embed color.",
      );

      return await message.reply({ embeds: [embed] });
    }

    if (args[0].toLowerCase() === "on") {
      message.client.embed = true;

      if (!isMaster) return;
      await setEmbedAll(message.author.id, message.guild.id, true);

      const allEmbed = await getBotInfoAll(message.author.id, message.guild.id);

      const botChanged = allEmbed.filter((e) => e.embed === true).length;
      const botNotChanged = allEmbed.filter((e) => e.embed === false).length;

      const description = allEmbed.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${e.embed === true ? "✅" : "❌"}`;
      });

      return await pagingEmbed(
        description,
        message,
        20,
        null,
        botChanged,
        botNotChanged,
      );
    }

    if (args[0].toLowerCase() === "off") {
      message.client.embed = false;

      if (!isMaster) return;
      await setEmbedAll(message.author.id, message.guild.id, false);

      const allEmbed = await getBotInfoAll(message.author.id, message.guild.id);

      const botChanged = allEmbed.filter((e) => e.embed === false).length;
      const botNotChanged = allEmbed.filter((e) => e.embed === true).length;

      const description = allEmbed.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${e.embed === false ? "✅" : "❌"}`;
      });

      return await pagingEmbed(
        description,
        message,
        20,
        null,
        botChanged,
        botNotChanged,
      );
    }

    // regex for hex color
    const hexColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    const color = args.join(" ");

    if (isMaster && !hexColor.test(color)) {
      const embed = errorEmbed(message).setDescription(
        "Please provide a valid hex color.",
      );
      return await message.reply({ embeds: [embed] });
    }

    message.client.embedColor = color;

    if (!isMaster) return;
    await updateEmbedColorAll(message.author.id, message.guild.id, color);

    const allEmbed = await getBotInfoAll(message.author.id, message.guild.id);

    const botChanged = allEmbed.filter((e) => e.embedColor === color).length;
    const botNotChanged = allEmbed.filter((e) => e.embedColor !== color).length;

    const description = allEmbed.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${e.embedColor === color ? "✅" : "❌"}`;
    });

    return await pagingEmbed(
      description,
      message,
      20,
      null,
      botChanged,
      botNotChanged,
    );
  },
};
