const { Message, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");
const { updateBotName } = require("../../lib/info");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "setname",
    description: "Set the bot's name",
    aliases: ["sn"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    if (!args.length) {
      const error = errorEmbed(message).setDescription(
        codeBlock("diff", "Please provide a name."),
      );

      return await message.reply({ embeds: [error] });
    }

    const name = args.join(" ");

    await message.client.user.setUsername(name);

    const updatedName = await updateBotName(message.client.user.id, name);
    return await message.react("✅");
  },
};
