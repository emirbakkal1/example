const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "forward",
    description: "Forward the music",
    aliases: ["fwd", "ff"],
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
        return message.reply("I am not playing any music");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    if (!args[0]) {
      if (player.current.duration - player.current.position < 10000) {
        player.seek(player.current.duration);
      } else {
        player.seek(player.current.position + 10000);
      }
      if (!message.client.embed)
        return message.reply("The music has been forwarded by 10 seconds");
      return message.reply({
        embeds: [
          serverEmbed(message).setDescription(
            "The music has been forwarded by 10 seconds",
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

    if (time > player.current.duration) {
      if (!message.client.embed)
        return message.reply(
          "You can't forward the music more than the duration",
        );
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You can't forward the music more than the duration",
          ),
        ],
      });
    }

    player.seek(player.current.position + time);

    if (!message.client.embed)
      return message.reply(
        `The music has been forwarded by ${args[0]} seconds`,
      );

    const forwardEmbed = serverEmbed(message)
      .setTitle("Forward")
      .setDescription(`The music has been forwarded by ${args[0]} seconds`);

    return await message.reply({ embeds: [forwardEmbed] });
  },
};
