const { Message, codeBlock } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "setbanner",
    description: "Set the bot's banner",
    aliases: ["sb"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const banner = args[0] || message.attachments.first()?.url;

    if (!banner || !banner.startsWith("http")) {
      const error = errorEmbed(message).setDescription(
        codeBlock("diff", "Please provide a valid image link or attachment."),
      );

      return await message.reply({ embeds: [error] });
    }

    await message.client.user.setBanner(banner);
    return await message.react("✅");
  },
};
