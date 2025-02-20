const { Message } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const { setVoiceChannelChatAll, getBotInfoAll } = require("../../lib/setting");
const pagingEmbed = require("../../utils/pagingEmbed");
const { determineRespondingBot } = require("../../lib/master");

module.exports = {
  data: {
    name: "playinvcall",
    description:
      "Enable or disable voice channel chat music commands for all bot",
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
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Please provide a valid option (on/off)",
          ),
        ],
      });
    }

    if (args[0].toLowerCase() === "on") {
      await setVoiceChannelChatAll(message.author.id, message.guild.id, true);

      const botInfoAll = await getBotInfoAll(
        message.author.id,
        message.guild.id,
      );

      const botChanged = botInfoAll.filter(
        (e) => e.voiceChannelChat === true,
      ).length;
      const botNotChanged = botInfoAll.filter(
        (e) => e.voiceChannelChat !== true,
      ).length;

      const description = botInfoAll.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${
          e.voiceChannelChat === true ? "✅" : "❌"
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

    if (args[0].toLowerCase() === "off") {
      await setVoiceChannelChatAll(message.author.id, message.guild.id, false);

      const botInfoAll = await getBotInfoAll(
        message.author.id,
        message.guild.id,
      );

      const botChanged = botInfoAll.filter(
        (e) => e.voiceChannelChat === false,
      ).length;
      const botNotChanged = botInfoAll.filter(
        (e) => e.voiceChannelChat !== false,
      ).length;

      const description = botInfoAll.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${
          e.voiceChannelChat === false ? "✅" : "❌"
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
