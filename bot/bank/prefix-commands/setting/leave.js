const { Message, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");
const { getVoiceChannel, deleteVoiceChannel } = require("../../lib/info");
const { CustomEmbedBuilder } = require("../../utils/functions");

module.exports = {
  data: {
    name: "leave",
    description:
      "De-selecting the bot's fixed voice channel and exiting the bot from the voice channel",
  },
  adminOnly: true,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    const voiceChannelId = await getVoiceChannel(message.client.user.id);

    if (!voiceChannelId) {
      const noVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.ErrorColor)
        .setDescription("No voice channel is selected for the bot")
        .setFooter({
          text: `Commanded by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ size: 1024 }),
        });

      return await message.reply({ embeds: [noVoiceChannelEmbed] });
    }

    const voiceChannel = await message.guild.channels.cache.get(voiceChannelId);

    if (!voiceChannel) {
      const invalidVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.ErrorColor)
        .setDescription(
          "The voice channel is invalid, please setup a new voice channel by using 'come' or 'setup' command",
        )
        .setFooter({
          text: `Commanded by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ size: 1024 }),
        });

      return await message.reply({ embeds: [invalidVoiceChannelEmbed] });
    }

    await deleteVoiceChannel(message.client.user.id);

    const leaveEmbed = new CustomEmbedBuilder(message.client)
      .setColor()
      .setDescription(
        `Bot has left the voice channel: <#${voiceChannel.id}> \nVoice channel has been reset`,
      )
      .setFooter({
        text: `Commanded by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ size: 1024 }),
      });

    if (message.client.moon.players.has(message.guild.id)) {
      const player = message.client.moon.players.get(message.guild.id);

      if (player.voiceChannel === voiceChannel.id) {
        player.destroy();
      }
    } else {
      const player = message.client.moon.players.create({
        guildId: message.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: message.channel.id,
        autoPlay: false,
        autoLeave: true,
        volume: 50,
      });

      if (player.voiceChannel === voiceChannel.id) {
        player.disconnect();
        player.destroy();
      }
    }

    return await message.reply({ embeds: [leaveEmbed] });
  },
};
