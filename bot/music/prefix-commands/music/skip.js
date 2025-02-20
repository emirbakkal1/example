const { Message } = require("discord.js");
const { serverEmbed, errorEmbed } = require("../../utils/functions");
module.exports = {
  data: {
    name: "skip",
    description: "Skip the music",
    aliases: ["s"],
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

    if (!player || !player?.playing) {
      if (!message.client.embed)
        return message.reply("I am not playing any music");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    const skipEmbed = serverEmbed(message)
      .setTitle("Skip")
      .setDescription(
        `The music has been skipped\n\n[${player.current.title}](${player.current.url})`,
      );

    if (player.queue.size === 0) {
      if (player.autoPlay) {
        player.seek(player.current.duration - 500);
      } else {
        player.skip();
      }
      if (!message.client.embed)
        return await message.reply("You have skipped the current song");
      skipEmbed.setDescription("You have skipped the current song");
      return await message.reply({ embeds: [skipEmbed] });
    }

    if (player.autoPlay && player.queue.size === 0) {
      player.seek(player.current.duration - 500);
    } else {
      player.skip();
    }

    if (!message.client.embed)
      return await message.reply("The music has been skipped");

    return await message.reply({ embeds: [skipEmbed] });
  },
};
