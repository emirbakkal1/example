const { CommandInteraction, ActivityType } = require("discord.js");
const { updateActivity } = require("../../lib/info");
const { getMessageAndEmbed } = require("../../utils/functions");
const { updateActivityAll, getBotInfoAll } = require("../../lib/setting");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  name: "select-activity-type-all",
  description: "Select the activity type",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    await interaction.deferUpdate();
    const { message } = await getMessageAndEmbed(interaction);

    const value = interaction.values[0];

    const messageRef = await interaction.client.channels.cache
      .get(interaction.channelId)
      .messages.cache.get(interaction.message.reference.messageId);

    const content = messageRef.content.split(" ").slice(1).join(" ");

    await updateActivityAll(
      interaction.user.id,
      interaction.guild.id,
      content,
      value,
    );

    const botInfoAll = await getBotInfoAll(
      interaction.user.id,
      interaction.guild.id,
    );

    interaction.client.user.setActivity({
      name: content,
      type: ActivityType[value],
      url:
        ActivityType[value] === ActivityType.Streaming
          ? `https://twitch.tv/${value}`
          : null,
    });

    const botChanged = botInfoAll.filter(
      (e) => e.activity === content && e.activityType === value,
    ).length;
    const botNotChanged = botInfoAll.filter(
      (e) => e.activity !== content && e.activityType !== value,
    ).length;

    const description = botInfoAll.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${
        e.activity === content && e.activityType === value ? "✅" : "❌"
      }`;
    });

    await message.delete();

    return await pagingEmbed(
      description,
      messageRef,
      20,
      null,
      botChanged,
      botNotChanged,
    );
  },
};
