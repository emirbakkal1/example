const { Message, ChannelType, inlineCode } = require("discord.js");
const { errorEmbed, fetchChannel } = require("../../utils/functions");
const {
  updateCommandsChannelAll,
  getBotInfoAll,
} = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "chatall",
    description: "Define a commands text channel for all bots",
    aliases: ["ca"],
  },
  adminOnly: true,
  allCommands: true,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    const isMaster = await determineRespondingBot(
      message.author.id,
      message.guild.id,
      message.client.user.id,
    );
    if (!isMaster) return;

    if (!args.length) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Please provide a text channel Or use `off` to remove the commands text channel for all bots",
          ),
        ],
      });
    }

    if (args[0].toLowerCase() === "off") {
      await updateCommandsChannelAll(message.author.id, message.guild.id, null);

      const newBotInfo = await getBotInfoAll(
        message.author.id,
        message.guild.id,
      );

      const botChanged = newBotInfo.filter(
        (e) => e.commandsChannelId === null,
      ).length;

      const botNotChanged = newBotInfo.filter(
        (e) => e.commandsChannelId !== null,
      ).length;

      const description = newBotInfo.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${e.commandsChannelId === null ? "✅" : "❌"}`;
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

    const textChannel = await fetchChannel(message, args);

    if (textChannel?.type !== ChannelType.GuildText) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Please provide a valid text channel",
          ),
        ],
      });
    }

    await updateCommandsChannelAll(
      message.author.id,
      message.guild.id,
      textChannel.id,
    );

    const allBot = await getBotInfoAll(message.author.id, message.guild.id);

    const botChanged = allBot.filter(
      (e) => e.commandsChannelId === textChannel.id,
    ).length;

    const botNotChanged = allBot.filter(
      (e) => e.commandsChannelId !== textChannel.id,
    ).length;

    const description = allBot.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${e.commandsChannelId === textChannel.id ? "✅" : "❌"}`;
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
