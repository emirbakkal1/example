const { Message, ChannelType } = require("discord.js");
const { updateVoiceChannel, getCommandsChannel } = require("../../lib/info");
const { errorEmbed, serverEmbed } = require("../../utils/functions");
const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  data: {
    name: "come",
    description: "Select a fixed voice channel for bot",
    aliases: ["join"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
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

    const updatedVoiceChannelId = await updateVoiceChannel(
      message.client.user.id,
      voiceChannelId,
    );

    const commandChannel = await getCommandsChannel(message.client.user.id);

    const successEmbed = serverEmbed(message)
      .setTitle("Change Voicemusic")
      .setDescription(`Bot will now join <#${voiceChannelId}>`);

    const voiceJoin = joinVoiceChannel({
      channelId: voiceChannelId,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    return await message.reply({ embeds: [successEmbed] });
  },
};
