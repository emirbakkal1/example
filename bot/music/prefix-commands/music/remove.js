const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "remove",
    description: "Remove a song from the queue",
    aliases: ["rm", "r"],
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

    if (player.queue.size === 0) {
      if (!message.client.embed) return message.reply("The queue is empty");
      return message.reply({
        embeds: [errorEmbed(message).setDescription("The queue is empty")],
      });
    }

    const index = parseInt(args[0]);

    if (isNaN(index)) {
      if (!message.client.embed)
        return message.reply("Please provide a valid number");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("Please provide a valid number"),
        ],
      });
    }

    if (index < 1 || index > player.queue.size) {
      if (!message.client.embed)
        return message.reply("Please provide a valid number");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("Please provide a valid number"),
        ],
      });
    }

    player.queue.remove(index);

    if (!message.client.embed)
      return message.reply(
        `The song has been removed from the queue at position ${index}`,
      );

    const removeEmbed = serverEmbed(message)
      .setTitle("Remove")
      .setDescription(
        `The song has been removed from the queue at position ${index}`,
      );

    return await message.reply({ embeds: [removeEmbed] });
  },
};
