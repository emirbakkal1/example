const { Message } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const { setButtonAll, getBotInfoAll } = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "buttonsall",
    description: "Activate or disable the buttons",
    aliases: ["ba"],
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
    if (!isMaster) return;

    if (!args.length || !["on", "off"].includes(args[0].toLowerCase())) {
      const embed = errorEmbed(message).setDescription(
        "Please use `on` or `off` to enable or disable buttons.",
      );

      return await message.reply({ embeds: [embed] });
    }

    if (args[0].toLowerCase() === "on") {
      await setButtonAll(message.author.id, message.guild.id, true);

      const allbotInfo = await getBotInfoAll(
        message.author.id,
        message.guild.id,
      );

      const botChanged = allbotInfo.filter((e) => e.buttons === true).length;
      const botNotChanged = allbotInfo.filter(
        (e) => e.buttons === false,
      ).length;

      const description = allbotInfo.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${e.buttons === true ? "✅" : "❌"}`;
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
      await setButtonAll(message.author.id, message.guild.id, false);

      const allbotInfo = await getBotInfoAll(
        message.author.id,
        message.guild.id,
      );

      const botChanged = allbotInfo.filter((e) => e.buttons === false).length;
      const botNotChanged = allbotInfo.filter((e) => e.buttons === true).length;

      const description = allbotInfo.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${e.buttons === false ? "✅" : "❌"}`;
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
  },
};
