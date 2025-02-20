const { Message, codeBlock } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const { determineRespondingBot } = require("../../lib/master");

module.exports = {
  data: {
    name: "avatarall",
    description: "Change the avatar of all bots",
    aliases: ["setaa"],
  },
  adminOnly: true,
  allCommands: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const isMaster = await determineRespondingBot(
      message.author.id,
      message.guild.id,
      message.client.user.id,
    );

    const avatar = args[0] || message.attachments.first()?.url;

    if (!avatar || !avatar.startsWith("http")) {
      const noAvatarEmbed = errorEmbed(message).setDescription(
        codeBlock("diff", "Please provide a valid image link or attachment."),
      );

      if (!isMaster) return;
      return await message.reply({ embeds: [noAvatarEmbed] });
    }

    message.client.user
      .setAvatar(avatar)
      .then(async () => {
        await message.react("✅");
      })
      .catch(async (err) => {
        await message.react("❌");
      });
  },
};
