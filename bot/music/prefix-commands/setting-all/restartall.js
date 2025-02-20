const { Message } = require("discord.js");
const { determineRespondingBot } = require("../../lib/master");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "restartall",
    description: "Restart all the bot",
    aliases: ["rsa"],
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

    // if restart command is already used under 1 minitune then return a error message
    const uptimeInSeconds = Math.floor(message.client.uptime / 1000); // Convert milliseconds to seconds
    const uptimeInMinutes = Math.floor(uptimeInSeconds / 60);

    if (isMaster && uptimeInMinutes < 1) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Please wait at least 1 minute before restarting the bot.",
          ),
        ],
      });
    }

    if (uptimeInMinutes < 1) return;

    await message.react("✅");

    process.exit();
  },
};
