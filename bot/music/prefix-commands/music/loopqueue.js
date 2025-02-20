const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "loopqueue",
    description: "Toggle loop queue",
    aliases: ["lpq", "repeatqueue"],
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
      player.loop = 2;
    } else {
      player.loop = 0;
    }

    if (!message.client.embed)
      return message.reply({
        content: `Queue Loop has been ${player.loop === 2 ? "enabled" : "disabled"}`,
      });

    const loopEmbed = serverEmbed(message)
      .setTitle("Loop Queue")
      .setDescription(
        `Queue Loop has been ${player.loop === 2 ? "enabled" : "disabled"}`,
      );

    return await message.reply({ embeds: [loopEmbed] });
  },
};
