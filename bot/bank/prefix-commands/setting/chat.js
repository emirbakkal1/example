const { Message, EmbedBuilder, ChannelType } = require("discord.js");
const config = require("../../config.json");
const {
  updateCommandsChannel,
  getCommandsChannel,
  deleteCommandsChannel,
} = require("../../lib/info");
const {
  CustomEmbedBuilder,
  errorEmbed,
  serverEmbed,
  fetchChannel,
} = require("../../utils/functions");

module.exports = {
  data: {
    name: "chat",
    description: "Change the commands text channel",
  },
  adminOnly: true,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    if (!args.length) {
      const commandChannel = await getCommandsChannel(message.client.user.id);

      if (commandChannel) {
        await deleteCommandsChannel(message.client.user.id);

        const embed = serverEmbed(message).setDescription(
          "Commands text channel removed successfully",
        );

        return await message.reply({ embeds: [embed] });
      }

      const noArgsEmbed = errorEmbed(message).setDescription(
        "Please provide a text channel",
      );

      return await message.reply({ embeds: [noArgsEmbed] });
    }

    const textChannel = await fetchChannel(message, args);

    if (textChannel?.type !== ChannelType.GuildText) {
      const invalidIdEmbed = errorEmbed(message).setDescription(
        "Please provide a valid text channel",
      );

      return await message.reply({ embeds: [invalidIdEmbed] });
    }

    const updatedTestChannelId = await updateCommandsChannel(
      message.client.user.id,
      textChannel.id,
    );

    if (!updatedTestChannelId) {
      const error = errorEmbed(message).setDescription(
        "An error occurred while changing the text channel",
      );
      return await message.reply({ embeds: [error] });
    }

    const successEmbed = serverEmbed(message)
      .setTitle("Change Chatmusic")
      .setDescription(
        `Text channel changed successfully. <#${updatedTestChannelId}>`,
      );

    return await message.reply({ embeds: [successEmbed] });
  },
};
