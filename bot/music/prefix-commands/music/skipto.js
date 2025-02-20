const { Message } = require("discord.js");
const {
  errorEmbed,
  serverEmbed,
} = require("../../utils/functions");

module.exports = {
  data: {
    name: "skipto",
    description: "Skip to the specified music",
    aliases: ["st"],
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

    if (!args[0]) {
      if (!message.client.embed)
        return await message.reply(
          "Please specify the index of the music to skip to",
        );

      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Please specify the index of the music to skip to",
          ),
        ],
      });
    }

    if (player.queue.size === 0) {
      if (!message.client.embed)
        return await message.reply("There is only one music in the queue");

      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "There is only one music in the queue",
          ),
        ],
      });
    }

    const index = parseInt(args[0]);

    if (isNaN(index) || index < 1 || index > player.queue.size) {
      if (!message.client.embed) return await message.reply("Invalid index");

      return await message.reply({
        embeds: [errorEmbed(message).setDescription("Invalid index")],
      });
    }

    player.skip(index);

    const song = player.current;

    if (!message.client.embed)
      return await message.reply(
        `The music has been skipped to [${song?.title}]`,
      );

    const skipToEmbed = serverEmbed(message)
      .setTitle("Skip To")
      .setDescription(
        `The music has been skipped to [${song?.title}](${song?.url})`,
      );
    return await message.reply({ embeds: [skipToEmbed] });
  },
};
