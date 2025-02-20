const { Message } = require("discord.js");
const {
  errorEmbed,
  serverEmbed,
} = require("../../utils/functions");
module.exports = {
  data: {
    name: "pause",
    description: "Pause the music",
    aliases: ["pa"],
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

    const pauseEmbed = serverEmbed(message)
      .setTitle("Pause")
      .setDescription(
        `The music has been paused\n\ [${player.current.title} - ${player.current.author}]`,
      );

    if (player.paused) {
      if (!message.client.embed)
        return await message.reply("The music is already paused");
      pauseEmbed.setDescription("The music is already paused");
      return message.reply({ embeds: [pauseEmbed] });
    }

    player.pause();

    if (!message.client.embed)
      return await message.reply("The music has been paused");

    return await message.reply({ embeds: [pauseEmbed] });
  },
};
