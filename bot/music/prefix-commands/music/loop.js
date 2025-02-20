const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "loop",
    description: "Toggle loop",
    aliases: ["repeat", "lp"],
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

    if (player.loop === 0) {
      player.loop = 1;
    } else {
      player.loop = 0;
    }

    if (!message.client.embed)
      return message.reply({
        content: `Song Loop has been ${player.loop === 1 ? "enabled" : "disabled"}`,
      });

    const loopEmbed = serverEmbed(message)
      .setTitle("Loop")
      .setDescription(
        `Song Loop has been ${player.loop === 1 ? "enabled" : "disabled"}`,
      );

    return await message.reply({ embeds: [loopEmbed] });
  },
};
