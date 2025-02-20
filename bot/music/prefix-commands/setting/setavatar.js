const { Message, codeBlock } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "setavatar",
    description: "Set the bot's avatar",
    aliases: ["sa"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const avatar = args[0] || message.attachments.first()?.url;

    if (!avatar || !avatar.startsWith("http")) {
      const noAvatarEmbed = errorEmbed(message).setDescription(
        codeBlock("diff", "Please provide a valid image link or attachment."),
      );

      return await message.reply({ embeds: [noAvatarEmbed] });
    }

    await message.client.user.setAvatar(avatar);
    return await message.react("✅");
  },
};
