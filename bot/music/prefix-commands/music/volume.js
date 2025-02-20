const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");
module.exports = {
  data: {
    name: "volume",
    description: "Set the volume of the music",
    aliases: ["v"],
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
        return message.reply(`The current volume is ${player.volume}%`);

      return message.reply({
        embeds: [
          serverEmbed(message).setDescription(
            `The current volume is ${player.volume}%`,
          ),
        ],
      });
    }

    const volume = parseInt(args[0]);

    if (isNaN(volume)) {
      if (!message.client.embed)
        return message.reply("The volume must be a number");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("The volume must be a number"),
        ],
      });
    }

    if (volume < 1 || volume > 200) {
      if (!message.client.embed)
        return message.reply("The volume must be between 1 and 200");

      return message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "The volume must be between 1 and 200",
          ),
        ],
      });
    }

    const old_volume = player.volume;

    player.setVolume(volume);

    if (!message.client.embed)
      return message.reply(`The volume has been set ${old_volume} to ${volume}%`);

    return await message.reply({
      embeds: [
        serverEmbed(message)
          .setTitle("Volume")
          .setDescription(`The volume has been set ${old_volume} to ${volume}%`),
      ],
    });
  },
};
