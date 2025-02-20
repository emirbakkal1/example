const {
  SlashCommandBuilder,
  CommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { interactionServerEmbed } = require("../../utils/functions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Sends a setup embed to control the subscriptions."),

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    await interaction.deferReply();

    const controllButton = new ButtonBuilder()
      .setCustomId("controll-button")
      .setLabel("Controll")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(controllButton);

    const embed = interactionServerEmbed(interaction, interaction.client.user)
      .setTitle("Subscriptions Setup")
      .setDescription("Send a setup interaction to manage the bot.");

    await interaction.deleteReply();

    return await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });
  },
};
