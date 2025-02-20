const { Message } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const { getBotInfoAll } = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "showadminall",
    description: "Show all admins of all bots",
    aliases: ["saa"],
  },
  ownerOnly: true,
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

    const botInfoAll = await getBotInfoAll(message.author.id, message.guild.id, true);

    if (botInfoAll.every((v) => !v.admins.length)) {
      return await message.reply({
        embeds: [errorEmbed(message).setDescription("No admins found.")],
      });
    }

    const description = botInfoAll.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}>\n ${
        e.admins.length
          ? e.admins.map((a) => ` - <@${a}>`).join("\n")
          : "No admins"
      }`;
    });

    return await pagingEmbed(description, message, 20, null, null, null);
  },
};
