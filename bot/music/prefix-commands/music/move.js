const { Message } = require("discord.js");
const config = require("../../config.json");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "move",
    description: "Move a song to the top of the queue or to specific position",
    aliases: ["mv", "m"],
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

    const queue = player.queue;

    const moveEmbed = serverEmbed(message).setTitle("Move");

    if (queue.size === 0) {
      if (!message.client.embed)
        return message.reply("There is no music to move");
      moveEmbed.setDescription("There is no music to move");
      return await message.reply({ embeds: [moveEmbed] });
    }

    if (!args[0]) {
      if (!message.client.embed)
        return message.reply("Please specify the song position");
      moveEmbed
        .setDescription("Please specify the song position")
        .setColor(config.ErrorColor);
      return await message.reply({ embeds: [moveEmbed] });
    }

    const position = parseInt(args[0]);

    if (isNaN(position) || position < 1 || position > player.queue.size) {
      if (!message.client.embed) return message.reply("Invalid song position");
      moveEmbed
        .setDescription("Invalid song position")
        .setColor(config.ErrorColor);
      return await message.reply({ embeds: [moveEmbed] });
    }

    const songs = queue.getQueue();

    console.log(songs[position - 1]);

    if (!args[1]) {
      queue.add(songs[position - 1], 1);
      queue.remove(position + 1);
    }

    if (args[1]) {
      const newPosition = parseInt(args[1]);

      if (
        isNaN(newPosition) ||
        newPosition < 1 ||
        newPosition > player.queue.size
      ) {
        if (!message.client.embed) return message.reply("Invalid new position");
        moveEmbed
          .setDescription("Invalid new position")
          .setColor(config.ErrorColor);
        return await message.reply({ embeds: [moveEmbed] });
      }

      queue.add(songs[position - 1], newPosition);
      queue.remove(position + 1);
    }

    if (!message.client.embed) return message.reply("The song has been moved");

    moveEmbed.setDescription("The song has been moved");

    return await message.reply({ embeds: [moveEmbed] });
  },
};
