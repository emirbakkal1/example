const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "autoplay",
    description: "Toggle autoplay",
    aliases: ["ap", "toggleautoplay"],
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
        return await message.reply({ content: "I am not playing any music" });

      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    player.autoplay = !player.autoplay;

    player.setAutoPlay(player.autoplay);

    if (!message.client.embed)
      return await message.reply({
        content: `Auto Play mode changed to \`${player.autoplay ? "ON" : "OFF"}\``,
      });

    const autoplayEmbed = serverEmbed(message)
      .setTitle("Auto Play")
      .setDescription(
        `Auto Play mode changed to \`${player.autoplay ? "ON" : "OFF"}\``,
      );

    return await message.reply({ embeds: [autoplayEmbed] });
  },
};
