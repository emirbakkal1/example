const { Message, ChannelType } = require("discord.js");
const { updateVoiceChannel, updateBotName } = require("../../lib/info");
const { errorEmbed, serverEmbed } = require("../../utils/functions");
const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  data: {
    name: "setup",
    description:
      "Select a fixed voice channel for the bot + change the bot name to the name of the voice channel",
  },
  adminOnly: true,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    let voiceChannel;
    if (!args.length) {
      voiceChannel = message.member.voice.channel;

      if (!voiceChannel) {
        const noArgsEmbed = errorEmbed(message).setDescription(
          "Please provide a voice channel",
        );

        return await message.reply({ embeds: [noArgsEmbed] });
      }
    }

    if (!voiceChannel) {
      voiceChannel = message.guild.channels.cache.get(
        args[0].replace("<#", "").replace(">", ""),
      );
    }

    if (voiceChannel?.type !== ChannelType.GuildVoice) {
      const error = errorEmbed(message).setDescription(
        "Voice channel is invalid, please provide a valid voice channel",
      );

      return await message.reply({ embeds: [error] });
    }

    const voiceChannelId = voiceChannel.id;

    await message.client.user.setUsername(voiceChannel.name);
    const updatedName = await updateBotName(
      message.client.user.id,
      voiceChannel.name,
    );

    const updatedVoiceChannelId = await updateVoiceChannel(
      message.client.user.id,
      voiceChannelId,
    );

    const voiceJoin = await joinVoiceChannel({
      channelId: voiceChannelId,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    const successEmbed = serverEmbed(message)
      .setTitle("Change Voicemusic")
      .setDescription(`Bot will now join <#${voiceChannelId}>`);

    return await message.reply({ embeds: [successEmbed] });
  },
};
