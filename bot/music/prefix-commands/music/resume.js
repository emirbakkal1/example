const { Message } = require("discord.js");
const { serverEmbed } = require("../../utils/functions");
module.exports = {
  data: {
    name: "resume",
    description: "Resume the music",
    aliases: ["r", "unpause"],
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

    const resumeEmbed = serverEmbed(message)
      .setTitle("Resume")
      .setDescription(`The music has been resumed`);

    if (!player.paused) {
      if (!message.client.embed)
        return await message.reply("The music is not paused");
      resumeEmbed.setDescription("The music is not paused");
      return message.reply({ embeds: [resumeEmbed] });
    }

    player.resume();

    if (!message.client.embed)
      return await message.reply("The music has been resumed");

    return await message.reply({ embeds: [resumeEmbed] });
  },
};
