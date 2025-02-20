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
  renewSubscription,
} = require("../../lib/subscriptions");
const { capitalize, interactionServerEmbed } = require("../../utils/functions");
const prettyMilliseconds = require("pretty-ms");
const { logChannelId } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("renew")
    .setDescription("Renew subscription of an user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("client")
        .setDescription("The client user.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("months")
        .setChoices(
          { name: "1 month", value: "1" },
          { name: "2 months", value: "2" },
          { name: "3 months", value: "3" },
        )
        .setDescription("How many months is the subscription valid.")
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
    const months = interaction.options.getString("months");

    if (client.bot) {
      return await interaction.editReply(
        "You can't renew subscription of a bot user.",
      );
    }

    const subscriptions = await getSubscriptionsFromUser(client);

    if (!subscriptions.length) {
      return await interaction.editReply(
        `${client.username} has no subscriptions.`,
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
      .setCustomId("select-subscription-renew")
      .setPlaceholder("Select a subscription to renew.")
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

      const newSubscriptions = [];
      if (subscriptionIdArray.includes("all")) {
        for (const subscription of subscriptions) {
          const newSub = await renewSubscription(subscription, months);
          newSubscriptions.push(newSub);
        }
      } else {
        for (const subscriptionId of subscriptionIdArray) {
          const subscription = subscriptions.find(
            (sub) => sub.id === subscriptionId,
          );
          const newSub = await renewSubscription(subscription, months);
          newSubscriptions.push(newSub);
        }
      }

      const description = `* **Your subscriptions**:\n${newSubscriptions
        .map((newSub) => {
          const expirationTime = newSub.expired
            ? "End"
            : prettyMilliseconds(
                Number(newSub.subscriptionDuration) - Date.now(),
              );
          return ` * ${capitalize(newSub.botType)} x${newSub.botAmount} (sub_ID: ${newSub.subId}) | ${newSub.tokens[0].setting.guildName} | ${expirationTime}`;
        })
        .join(
          "\n",
        )}\n* **Subscription renewal administrator**:\n * <@${interaction.user.id}>\n* **Subscription renewal period**:\n * ${months} months\n`;

      const newSubEmbed = interactionServerEmbed(interaction, client)
        .setTitle("Subscription renewed")
        .setDescription(description);

      client.createDM().then((dm) => {
        dm.send({
          embeds: [newSubEmbed],
        });
      });

      await interaction.editReply({ embeds: [newSubEmbed], components: [] });

      const logChannel = await interaction.guild.channels.fetch(logChannelId, {
        force: true,
      });

      if (logChannel) {
        logChannel.send({
          embeds: [newSubEmbed],
        });
      }

      await selectInteraction.deleteReply();

      return collector.stop("renewed");
    });

    collector.on("end", async () => {
      if (collector.endReason === "time") {
        const embed = new EmbedBuilder()
          .setTitle("❌ Time is over")
          .setColor("#ff4444")
          .setDescription("You took too long to select a subscription.");

        await interaction.editReply({ embeds: [embed], components: [] });
      }
    });
  },
};
