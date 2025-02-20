const { Message, inlineCode } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const { determineRespondingBot } = require("../../lib/master");
const { getBotInfoAll, updateVoiceChannelAll } = require("../../lib/setting");
const { joinVoiceChannel } = require("@discordjs/voice");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "leaveall",
    description:
      "De-selecting all bot's fixed voice channel and exiting the bot from the voice channel",
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
    const allbotInfo = await getBotInfoAll(message.author.id, message.guild.id);

    const isVoiceChannel = allbotInfo.some((e) => e.voiceChannelId !== null);

    if (!isVoiceChannel) {
      if (!isMaster) return;
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You can't leave the voice channel because you haven't set the voice channel for any bots yet.",
          ),
        ],
      });
    }

    const voiceChannel = allbotInfo.map((e) => e.voiceChannelId);

    if (message.client.moon.players.has(message.guild.id)) {
      const player = message.client.moon.players.get(message.guild.id);

      player.destroy();
    } else {
      const joinedvoiceChannel = joinVoiceChannel({
        channelId: voiceChannel,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      joinedvoiceChannel.destroy();
    }

    if (!isMaster) return;

    await updateVoiceChannelAll(message.author.id, message.guild.id, null);

    const botInfo = await getBotInfoAll(message.author.id, message.guild.id);

    const botChanged = botInfo.filter((e) => e.voiceChannelId === null).length;
    const botNotChanged = botInfo.filter(
      (e) => e.voiceChannelId !== null,
    ).length;

    const description = botInfo.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${
        e.voiceChannelId === null ? "✅" : "❌"
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
  },
};
