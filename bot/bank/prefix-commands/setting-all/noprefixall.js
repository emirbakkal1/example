const { Message } = require("discord.js");
const { deletePrefixAll, getBotInfoAll } = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "noprefixall",
    description: "Disable the prefix for all bots",
    aliases: ["npa"],
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

    if (isMaster) {
      await deletePrefixAll(message.author.id);

      const botInfoAll = await getBotInfoAll(
        message.author.id,
        message.guild.id,
      );

      const botChanged = botInfoAll.filter((e) => e.prefix === "").length;
      const botNotChanged = botInfoAll.filter((e) => e.prefix !== "").length;

      const description = botInfoAll.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${
          e.prefix === "" ? "✅" : "❌"
        }`;
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
