const { Message, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: {
    name: "memory",
    description: "Get the bot's memory usage",
    aliases: ["ram"],
  },
  memberVoice: false,
  botVoice: false,
  sameVoice: false,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const embed = new EmbedBuilder()
      .setTitle("Memory Usage")
      .setDescription(
        `The bot is currently using ${Math.round(used * 100) / 100} MB of memory`,
      )
      .setColor(config.MainColor);
    return await message.reply({ embeds: [embed] });
  },
};
