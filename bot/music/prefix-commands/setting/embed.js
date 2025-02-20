const { Message } = require("discord.js");
const { updateEmbedColor, toggleEmbed } = require("../../lib/info");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "embed",
    description: "Send an embed message",
    aliases: ["e"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    if (!args.length) {
      const emberAvailable = await toggleEmbed(message.client.user.id);

      const embed = serverEmbed(message)
        .setTitle("Change Embed")
        .setDescription(
          `Embed is now ${emberAvailable ? "enabled" : "disabled"}`,
        );

      message.client.embed = emberAvailable;

      return await message.reply({ embeds: [embed] });
    }

    // regex for hex color
    const hexColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    const color = args.join(" ");

    if (!hexColor.test(color)) {
      const embed = errorEmbed(message).setDescription(
        "Please provide a valid hex color.",
      );

      return await message.reply({ embeds: [embed] });
    }

    const embedColor = await updateEmbedColor(message.client.user.id, color);

    message.client.embedColor = embedColor;
    message.client.embed = true;

    const embed = serverEmbed(message)
      .setTitle("Change Embed")
      .setDescription(`Embed color set to \`${embedColor}\``);

    return await message.channel.send({ embeds: [embed] });
  },
};
