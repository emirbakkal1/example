const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  CommandInteraction,
  EmbedBuilder,
  ComponentType,
} = require("discord.js");
const {
  getSubscriptionsFromUser,
  addAdminAll,
  addAdmin,
} = require("../../lib/subscriptions");
const { interactionServerEmbed, capitalize } = require("../../utils/functions");
const { sendLogMessage } = require("../../utils/logMessage");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");

module.exports = {
  name: "add-admin",
  description: "Add an admin to the subscription.",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions Add Admin",
      "Copy the ID of the admin. Select from which subscription do you want to add the admin",
      "selector-add-admin",
      "Add an admin to all subscriptions",
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

      const modal = new ModalBuilder()
        .setCustomId("add-admin-modal")
        .setTitle("Add owner for selected subscription");

      const newServerId = new TextInputBuilder()
        .setCustomId("add-admin-modal-new-admin-id")
        .setLabel("What is the new admin ID?")
        .setStyle(TextInputStyle.Short);

      const row = new ActionRowBuilder().addComponents(newServerId);
      modal.addComponents(row);

      await selectInteraction.showModal(modal);

      const filter = (i) => i;

      await selectInteraction
        .awaitModalSubmit({ time: 1000 * 60, filter })
        .then(async (i) => {
          const newAdminId = i.fields.getTextInputValue(
            "add-admin-modal-new-admin-id",
          );

          i.guild.members
            .fetch(newAdminId, {
              force: true,
            })
            .then(async (adminUser) => {
              if (adminUser.user.bot) {
                throw new Error("You can't add a bot as an admin");
              }

              if (adminUser.user.id === interaction.user.id) {
                throw new Error("You can't add yourself as an admin");
              }

              const successData = [];

              if (value === "all") {
                if (
                  subscriptions.every((e) =>
                    e.tokens.every((token) =>
                      token.setting.admins.includes(adminUser.user.id),
                    ),
                  )
                ) {
                  throw new Error("This user is already an admin");
                }
                await addAdminAll(interaction.user, adminUser.user.id);

                successData.push(...subscriptions);
              } else {
                if (
                  subFound.tokens.every((e) =>
                    e.setting.admins.includes(adminUser.user.id),
                  )
                ) {
                  throw new Error("This user is already an admin");
                }
                await addAdmin(subFound, adminUser.user.id);

                successData.push(subFound);
              }

              const description =
                `* **Your subscriptions :**\n` +
                `${successData.map((sub) => ` * ${capitalize(sub.botType)} x${sub.botAmount} (sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName}`).join("\n")}` +
                `\n* **Added admin :**\n` +
                ` * <@${adminUser.user.id}>`;

              const successEmbed = interactionServerEmbed(
                interaction,
                interaction.user,
              )
                .setTitle("Subscriptions Add Admin")
                .setDescription(description);

              await interaction.editReply({
                embeds: [successEmbed],
                components: [],
              });

              interaction.user.createDM().then((dm) => {
                dm.send({
                  embeds: [successEmbed],
                });
              });

              setTimeout(async () => {
                const logEmbed = EmbedBuilder.from(successEmbed);
                logEmbed.setDescription(
                  description +
                    `\n* **Subscription Owner :**\n * <@${interaction.user.id}>`,
                );

                await sendLogMessage(interaction, logEmbed);
              }, 500);

              await i.deferUpdate();
            })
            .catch(async (err) => {
              console.error(err);
              await i.reply({
                content:
                  err?.code === 10007
                    ? "This person does not exist on our server"
                    : err.message,
                ephemeral: true,
              });
            });
        });

      return collector.stop("done");
    });

    collector.on("end", async () => {
      if (collector.endReason === "time") {
        console.log("time is over invitation");
        await interaction.editReply({
          components: [],
          embeds: [],
          content: "Time is over!",
        });
      }
    });
  },
};
