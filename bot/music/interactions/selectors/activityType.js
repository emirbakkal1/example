const { CommandInteraction, ActivityType } = require("discord.js");
const { updateActivity } = require("../../lib/info");
const { getMessageAndEmbed } = require("../../utils/functions");

module.exports = {
  name: "select-activity-type",
  description: "Select the activity type",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const { message, messageEmbedRef } = await getMessageAndEmbed(interaction);

    const value = interaction.values[0];

    const game = await updateActivity(interaction.client.user.id, null, value);

    interaction.client.user.setActivity({
      name: game.activity,
      type: ActivityType[value],
      url:
        ActivityType[value] === ActivityType.Streaming
          ? `https://twitch.tv/${value}`
          : null,
    });

    messageEmbedRef
      .setTitle("Change Status")
      .setDescription(`The bot’s game has changed to ${value}`)
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
