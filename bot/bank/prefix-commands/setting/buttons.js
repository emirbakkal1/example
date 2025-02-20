const { Message, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");
const { toggleButtons } = require("../../lib/info");
const { CustomEmbedBuilder } = require("../../utils/functions");

module.exports = {
  data: {
    name: "buttons",
    description: "Enable or disable buttons",
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const buttonsAvailable = await toggleButtons(message.client.user.id);

    const successEmbed = new CustomEmbedBuilder(message.client)
      .setColor()
      .setDescription(
        `Buttons are now ${buttonsAvailable ? "enabled" : "disabled"}`,
      )
      .setFooter({
        text: `Commanded by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ size: 1024 }),
      });

    return await message.reply({ embeds: [successEmbed] });
  },
};
