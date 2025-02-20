const { Message, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");
const { CustomEmbedBuilder, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "back",
    description: "Go back to the previous music",
    aliases: ["prev", "previous"],
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

    const goBackEmbed = serverEmbed(message)
      .setTitle("Go back")
      .setDescription(`The music has been gone back`);

    if (!player) {
      goBackEmbed.setDescription("I am not playing any music");
      if (!message.client.embed)
        return await message.reply({ content: "I am not playing any music" });
      return message.reply({ embeds: [goBackEmbed] });
    }

    const previous = player.previous;
    previous.requester = message.author.id;

    console.log(previous);

    if (previous.length === 0) {
      goBackEmbed.setDescription("There is no music to go back");

      if (!message.client.embed)
        return await message.reply({ content: "There is no music to go back" });

      return await message.reply({ embeds: [goBackEmbed] });
    }

    player.play(previous);

    if (!message.client.embed)
      return await message.reply({ content: "The music has been gone back" });

    return await message.reply({ embeds: [goBackEmbed] });
  },
};
