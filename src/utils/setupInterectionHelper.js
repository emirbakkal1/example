const {
  CommandInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const { getSubscriptionsFromUser } = require("../lib/subscriptions");
const { interactionServerEmbed, capitalize } = require("./functions");
const prettyMilliseconds = require("pretty-ms");

/**
 *
 * @param {CommandInteraction} interaction
 * @returns
 */
const sendSetupInteraction = async (
  interaction,
  title,
  description,
  customId,
  optionDescription,
  temoffShowAdmins = false,
) => {
  await interaction.deferReply({ ephemeral: true });
  const user = interaction.user;
  const subscriptions = await getSubscriptionsFromUser(user);

  if (!subscriptions.length) {
    return await interaction.editReply(
      "You have no bots or you don't have enough permissions!",
    );
  }

  const options = [
    {
      label: "All subscriptions",
      value: "all",
      description: optionDescription,
    },
    ...subscriptions.map((subscription) => ({
      label: `${capitalize(subscription.botType)} x${subscription.botAmount} (${subscription.subId})`,
      value: subscription.id,
      description: `${subscription.tokens[0].setting.guildName} - ${
        subscription.expired
          ? "End"
          : prettyMilliseconds(
              Number(subscription.subscriptionDuration) - Date.now(),
            )
      }`,
    })),
  ];

  if (temoffShowAdmins) {
    options.shift();
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder("Choose a subscription!")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  const embed = interactionServerEmbed(interaction, interaction.user)
    .setTitle(title)
    .setDescription(description);

  return await interaction.editReply({ embeds: [embed], components: [row] });
};

module.exports = {
  sendSetupInteraction,
};
