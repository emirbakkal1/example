const { Message } = require("discord.js");
const { serverEmbed, errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "backward",
    description: "Go backward in the queue",
    aliases: ["bk", "rewind"],
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

    if (!player || !player.playing) {
      if (!message.client.embed)
        return await message.reply({ content: "I am not playing any music" });

      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    if (!args[0]) {
      if (player.current.position > 11000) {
        player.seek(player.current.position - 10000);
      } else {
        player.seek(0);
      }
      if (!message.client.embed)
        return message.reply("The music has been moved backward by 10 seconds");
      return message.reply({
        embeds: [
          serverEmbed(message).setDescription(
            "The music has been moved backward by 10 seconds",
          ),
        ],
      });
    }

    if (isNaN(args[0])) {
      if (!message.client.embed)
        return message.reply("Please provide a valid seconds");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("Please provide a valid seconds"),
        ],
      });
    }

    const time = Number(args[0]) * 1000;

    if (player.current.position - time < 0) {
      if (!message.client.embed)
        return await message.reply({
          content: "You can't move the music backward more than the start",
        });

      return message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You can't move the music backward more than the start",
          ),
        ],
      });
    }

    player.seek(player.current.position - time);

    if (!message.client.embed)
      return await message.reply({
        content: "The music has been moved backward by 10 seconds",
      });

    const backwardEmbed = serverEmbed(message)
      .setTitle("Backward")
      .setDescription(`The music has been moved backward by 10 seconds`);

    return await message.reply({ embeds: [backwardEmbed] });
  },
};
