const { Message } = require("discord.js");
const {
  CustomEmbedBuilder,
  errorEmbed,
  serverEmbed,
} = require("../../utils/functions");

module.exports = {
  data: {
    name: "stop",
    description: "Stop the music",
    aliases: ["end", "leave"],
  },
  musicCommand: true,
  memberVoice: true,
  botVoice: true,
  sameVoice: true,
  /**
   *
   * @param {Message} message
   */
  async execute(message, args) {
    const player = message.client.moon.players.get(message.guild.id);

    if (!player) {
      if (!message.client.embed)
        return message.reply("I am not playing any music");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    if (!player.playing) {
      if (!message.client.embed)
        return message.reply("I am not playing any music");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    player.stop(true);

    if (!message.client.embed)
      return await message.reply(
        `The music has been stopped\n\n${player.current.title} - ${player.current.author}`,
      );

    const stopEmbed = serverEmbed(message)
      .setTitle("Music Stopped")
      .setDescription(
        `The music has been stopped\n\n${player.current.title} - ${player.current.author}`,
      );
    return await message.reply({ embeds: [stopEmbed] });
  },
};
