const { CommandInteraction } = require("discord.js");
const { updateStatus } = require("../../lib/info");
const { getMessageAndEmbed } = require("../../utils/functions");
const { updateStatusAll, getBotInfoAll } = require("../../lib/setting");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  name: "select-status-type-all",
  description: "Select the status type",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const { message } = await getMessageAndEmbed(interaction);

    const value = interaction.values[0];

    const messageRef = await interaction.client.channels.cache
      .get(interaction.channelId)
      .messages.cache.get(interaction.message.reference.messageId);

    await updateStatusAll(interaction.user.id, interaction.guild.id, value);

    const botInfoAll = await getBotInfoAll(
      interaction.user.id,
      interaction.guild.id,
    );

    interaction.client.user.setStatus(value);

    const botChanged = botInfoAll.filter((e) => e.status === value).length;
    const botNotChanged = botInfoAll.filter((e) => e.status !== value).length;

    const description = botInfoAll.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${
        e.status === value ? "✅" : "❌"
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
