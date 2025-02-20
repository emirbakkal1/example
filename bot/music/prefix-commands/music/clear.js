const { Message } = require("discord.js");
const { CustomEmbedBuilder, errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "clear",
    description: "Clear the queue",
    aliases: ["cl", "end", "leave"],
  },
  musicCommand: true,
  memberVoice: false,
  botVoice: false,
  sameVoice: false,
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

    const queue = player.queue;

    if (queue.size === 0) {
      if (!message.client.embed) return message.reply("The queue is empty");
      return message.reply({
        embeds: [errorEmbed(message).setDescription("The queue is empty")],
      });
    }

    queue.clear();

    if (!message.client.embed)
      return message.reply("The queue has been cleared");

    const clearEmbed = new CustomEmbedBuilder(message.client)
      .setColor()
      .setDescription("The queue has been cleared")
      .setFooter({
        text: `Commanded by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ size: 1024 }),
      });

    return await message.reply({ embeds: [clearEmbed] });
  },
};
