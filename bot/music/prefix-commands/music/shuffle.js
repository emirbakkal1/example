const { Message } = require("discord.js");
const { serverEmbed } = require("../../utils/functions");
module.exports = {
  data: {
    name: "shuffle",
    description: "Shuffle the music",
    aliases: ["sf", "random"],
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

    player.shuffle();

    if (!message.client.embed)
      return await message.reply("The music has been shuffled");

    const shuffleEmbed = serverEmbed(message)
      .setTitle("Shuffle")
      .setDescription(`The music has been shuffled`);

    return await message.reply({ embeds: [shuffleEmbed] });
  },
};
