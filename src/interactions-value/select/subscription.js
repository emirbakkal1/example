const {
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
} = require("discord.js");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");
const { getSubscriptionsFromUser } = require("../../lib/subscriptions");
const { interactionServerEmbed, capitalize } = require("../../utils/functions");
const prettyMilliseconds = require("pretty-ms");
const { sendLogMessage } = require("../../utils/logMessage");

module.exports = {
  name: "subscription",
  description:
    "Choose from the selection menu to see your subscriptions, the duration of the bots' subscription and the remaining period until the end of the subscription",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions see the duration and the remaining period",
      "Choose an subscription to see the duration and the remaining period",
      "selector-subscription",
      "All Subscriptions",
    );

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 1000 * 60 * 2,
    });

    collector.on("collect", async (selectInteraction) => {
      const user = selectInteraction.user;
      const value = selectInteraction.values[0];

      const subscriptions = await getSubscriptionsFromUser(user);

      const subFound = subscriptions.find(
        (subscription) => subscription.id === value,
      );

      if (!subFound && !(value === "all")) {
        await selectInteraction.deferReply({ ephemeral: true });
        return await selectInteraction.editReply("Bot not found!");
      }

      const dataArray = [];

      if (value === "all") {
        dataArray.push(...subscriptions);
      } else {
        dataArray.push(subFound);
      }

      const description = `- **Your subscriptions :**\n${dataArray
        .map((sub) => {
          return (
            ` - ${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName}` +
            `\n   - **Duration :** ${sub.months} months` +
            `\n   - **Remaining Period :** ${
              sub.expired
                ? "End"
                : prettyMilliseconds(
                    Number(sub.subscriptionDuration) - Date.now(),
                  )
            }`
          );
        })
        .join("\n")}`;

      console.log(description);

      const embed = interactionServerEmbed(interaction, user)
        .setTitle("Subscriptions Information")
        .setDescription(description);

      await selectInteraction.deferUpdate();

      await interaction.editReply({
        embeds: [embed],
        components: [],
      });

      interaction.user.createDM().then((dm) => {
        dm.send({
          embeds: [embed],
        });
      });

      setTimeout(async () => {
        const logEmbed = EmbedBuilder.from(embed);
        logEmbed.setDescription(
          description +
            `\n* **Subscription Owner :**\n * <@${interaction.user.id}>`,
        );

        await sendLogMessage(interaction, logEmbed);
      }, 500);

      return collector.stop("done");
    });

    collector.on("end", async () => {
      if (collector.endReason === "time") {
        await interaction.editReply({
          components: [],
          embeds: [],
          content: "Time is over!",
        });
      }
    });
  },
};
