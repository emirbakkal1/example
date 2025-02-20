const { Message } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "restart",
    description: "Restart the bot",
    aliases: ["rs"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const uptimeInSeconds = Math.floor(message.client.uptime / 1000); // Convert milliseconds to seconds
    const uptimeInMinutes = Math.floor(uptimeInSeconds / 60);

    if (uptimeInMinutes < 1) {
      const error = errorEmbed(message).setDescription(
        "Please wait at least 1 minute before restarting the bot.",
      );

      return await message.reply({ embeds: [error] });
    }

    await message.react("✅");
    process.exit();
  },
};
