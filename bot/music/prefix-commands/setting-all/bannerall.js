const { Message, codeBlock } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const { determineRespondingBot } = require("../../lib/master");

module.exports = {
  data: {
    name: "bannerall",
    description: "Change the banner of all bots",
    aliases: ["setba"],
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

    const banner = args[0] || message.attachments.first()?.url;

    if (!banner || !banner.startsWith("http")) {
      const error = errorEmbed(message).setDescription(
        codeBlock("diff", "Please provide a valid image link or attachment."),
      );

      if (!isMaster) return;
      return await message.reply({ embeds: [error] });
    }

    message.client.user
      .setBanner(banner)
      .then(async () => {
        await message.react("✅");
      })
      .catch(async (err) => {
        await message.react("❌");
      });
  },
};
