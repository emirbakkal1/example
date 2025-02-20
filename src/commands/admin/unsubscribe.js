const {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const {
  getSubscriptionsFromUser,
  removeSubscriptions,
} = require("../../lib/subscriptions");
const { resetBotState } = require("../../lib/tokens");
const { capitalize, interactionServerEmbed } = require("../../utils/functions");
const { shutDownBot } = require("../../lib/botProcess");
const { logChannelId } = require("../../config.json");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unsubscribe")
    .setDescription("Unsubscribe subscription of an user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("client")
        .setDescription("The client user.")
        .setRequired(true),
    ),

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const client = interaction.options.getUser("client");

    if (client.bot) {
      return await interaction.editReply(
        "You can't get information from a bot user.",
      );
    }

    const subscriptions = await getSubscriptionsFromUser(client);

    if (!subscriptions.length) {
      return await interaction.editReply(
        `${client.username} does not have any subscriptions.`,
      );
    }

    const options = [
      {
        label: "All subscriptions",
        value: "all",
        description: "Remove all subscriptions of the user.",
      },
      ...subscriptions.map((subscription) => ({
        label: `${capitalize(subscription.botType)} - ${subscription.botAmount} bots`,
        value: subscription.id,
        description: `Subscription ID: ${subscription.subId} | Valid until: ${new Date(
          Number(subscription.subscriptionDuration),
        ).toLocaleDateString()}`,
      })),
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select-subscription-remove")
      .setPlaceholder("Select a subscription to remove")
      .addOptions(options)
      .setMaxValues(options.length)
      .setMinValues(1);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder().setDescription(
      "Select a subscription to remove",
    );

    const reply = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 1000 * 60,
    });

    collector.on("collect", async (selectInteraction) => {
      await selectInteraction.deferReply({ ephemeral: true });
      const subscriptionIdArray = selectInteraction.values;

      if (
        subscriptionIdArray.includes("all") &&
        subscriptionIdArray.length > 1
      ) {
        return await selectInteraction.editReply({
          content: "You can't select all and another subscription.",
        });
      }

      const subsToRemove = [];

      if (subscriptionIdArray.includes("all")) {
        subsToRemove.push(...subscriptions);
      } else {
        const subscription = subscriptionIdArray.map((id) =>
          subscriptions.find((sub) => sub.id === id),
        );

        subsToRemove.push(...subscription);
      }

      for (const sub of subsToRemove) {
        for (const token of sub.tokens) {
          await resetBotState(token);
          if (token.process) {
            await shutDownBot(
              token.process.id,
              token.process.processId,
              token.botType,
            );
          }
        }
      }

      await removeSubscriptions(subsToRemove);
      const subRemoveEmbed = interactionServerEmbed(interaction, client)
        .setTitle("Subscription removed")
        .setDescription(
          `* **Your Subscriptions :**\n${subsToRemove
            .map((sub) => {
              const expirationTime = sub.expired
                ? "End"
                : prettyMilliseconds(
                    Number(sub.subscriptionDuration) - Date.now(),
                  );
              return ` * ${capitalize(sub.botType)} x${sub.botAmount} (sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName} | ${expirationTime}`;
            })
            .join(
              "\n",
            )}\n* **Subscription Owner:**\n * <@${subsToRemove[0].customerId}>`,
        );
      await interaction.editReply({
        embeds: [subRemoveEmbed],
        components: [],
      });

      const logChannel = await interaction.guild.channels.fetch(logChannelId, {
        force: true,
      });

      if (logChannel) {
        logChannel.send({
          embeds: [subRemoveEmbed],
        });
      }

      await selectInteraction.deleteReply();
      return collector.stop("remove all subscriptions");
    });

    collector.on("end", async () => {
      if (collector.endReason === "time") {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("Time is up.")],
          components: [],
        });
      }
    });
  },
};
