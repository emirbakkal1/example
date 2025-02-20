const { CommandInteraction } = require("discord.js");
const { updateStatus } = require("../../lib/info");
const { getMessageAndEmbed } = require("../../utils/functions");

module.exports = {
  name: "select-status-type",
  description: "Select the status type",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const { message, messageEmbedRef } = await getMessageAndEmbed(interaction);

    const value = interaction.values[0];

    const game = await updateStatus(interaction.client.user.id, value);

    interaction.client.user.setStatus(value);

    messageEmbedRef
      .setTitle("Change Status")
      .setDescription(`The bot’s status has changed to ${value}`)
      .setAuthor({
        name: interaction.user.displayName,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    return await message.edit({
      embeds: [messageEmbedRef],
      components: [],
    });
  },
};
