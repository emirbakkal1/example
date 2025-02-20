const {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
} = require("discord.js");
const { getSubscriptionsFromUser } = require("../../lib/subscriptions");
const prettyMilliseconds = require("pretty-ms");
const { capitalize, interactionServerEmbed } = require("../../utils/functions");
const { invitaionWithGuildLink } = require("../../utils/constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Information about an user subscription.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to get information from.")
        .setRequired(true),
    ),

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser("user");

    if (user.bot) {
      return await interaction.editReply(
        "You can't get information from a bot user.",
      );
    }

    const subscriptions = await getSubscriptionsFromUser(user);

    if (!subscriptions.length) {
      return await interaction.editReply(
        `${user.displayName} has no subscriptions.`,
      );
    }

    const embed = interactionServerEmbed(interaction, user)
      .setTitle("Info subscriptions")
      .setDescription(
        subscriptions
          .map((subscription) => {
            const expirationTime = subscription.expired
              ? "End"
              : prettyMilliseconds(
                  Number(subscription.subscriptionDuration) - Date.now(),
                );

            return `* **[${subscription.expired ? "🔴" : "🟢"} ${capitalize(subscription.botType)} x${
              subscription.botAmount
            } | (SubID : ${subscription.subId})](${invitaionWithGuildLink(subscription.tokens[0].botId, subscription.tokens[0].setting.guildId)})** | ${subscription.tokens[0].setting.guildName} | \`${expirationTime}\``;
          })
          .join("\n"),
      );

    return await interaction.editReply({ embeds: [embed] });
  },
};
