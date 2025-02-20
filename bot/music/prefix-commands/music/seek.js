const { Message } = require("discord.js");
const {
  errorEmbed,
  serverEmbed,
  timeToMilliseconds,
} = require("../../utils/functions");

module.exports = {
  data: {
    name: "seek",
    description: "Seek the music",
    aliases: ["sk"],
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
      if (!message.client.embed)
        return message.reply("Please provide a valid time");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("Please provide a valid time"),
        ],
      });
    }

    const time = Number(timeToMilliseconds(args[0]));

    if (isNaN(time)) {
      if (!message.client.embed)
        return message.reply("Please provide a valid time");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("Please provide a valid time"),
        ],
      });
    }

    if (time < 0) {
      if (!message.client.embed)
        return message.reply("The time cannot be negative");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("The time cannot be negative"),
        ],
      });
    }

    if (time > player.current?.duration) {
      if (!message.client.embed)
        return message.reply(
          "The time cannot be greater than the song duration",
        );
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "The time cannot be greater than the song duration",
          ),
        ],
      });
    }

    player.seek(time);

    if (!message.client.embed)
      return message.reply(`The music has been seeked to ${args[0]} seconds`);

    const seekEmbed = serverEmbed(message)
      .setTitle("Seek")
      .setDescription(`The music has been seeked to ${args[0]} seconds`);

    return await message.reply({ embeds: [seekEmbed] });
  },
};
