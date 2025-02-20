const { Message, ChannelType, inlineCode } = require("discord.js");
const { errorEmbed, fetchChannel } = require("../../utils/functions");
const { updateVoiceChannelAll, getBotInfoAll } = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const { joinVoiceChannel } = require("@discordjs/voice");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "comeall",
    description: "Select a fixed voice channel for all bots",
    aliases: ["joinall"],
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

    let voiceChannel;

    if (!args.length) {
      voiceChannel = message.member.voice.channel;

      if (!voiceChannel) {
        if (!isMaster) return;
        return await message.reply({
          embeds: [
            errorEmbed(message).setDescription(
              "Please provide a voice channel",
            ),
          ],
        });
      }
    }

    if (!voiceChannel) {
      voiceChannel = await fetchChannel(message, args);
    }

    if (isMaster && voiceChannel?.type !== ChannelType.GuildVoice) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Voice channel is invalid, please provide a valid voice channel",
          ),
        ],
      });
    }

    const voiceChannelId = voiceChannel.id;

    await updateVoiceChannelAll(
      message.author.id,
      message.guild.id,
      voiceChannelId,
    );

    joinVoiceChannel({
      channelId: voiceChannelId,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    if (isMaster) {
      const allBot = await getBotInfoAll(message.author.id, message.guild.id);

      const botChanged = allBot.filter(
        (e) => e.voiceChannelId === voiceChannelId,
      ).length;

      const botNotChanged = allBot.filter(
        (e) => e.voiceChannelId !== voiceChannelId,
      ).length;

      const description = allBot.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${
          e.voiceChannelId === voiceChannelId ? "✅" : "❌"
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
