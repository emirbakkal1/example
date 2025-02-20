const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  CommandInteraction,
  EmbedBuilder,
} = require("discord.js");
const {
  getSubscriptionsFromUser,
  removeAdminAll,
  removeAdmin,
} = require("../../lib/subscriptions");
const { interactionServerEmbed, capitalize } = require("../../utils/functions");
const { sendLogMessage } = require("../../utils/logMessage");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");

module.exports = {
  name: "remove-admin",
  description: "Remove an admin from the subscription.",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
     const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions Remove Admin",
      "Copy the ID of the admin. Select from which subscription do you want to remove the admin",
      "selector-remove-admin",
      "Remove an admin from all subscriptions",
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
      .setCustomId("remove-admin-modal")
      .setTitle("Remove owner from selected subscription");

    const newServerId = new TextInputBuilder()
      .setCustomId("remove-admin-modal-admin-id")
      .setLabel("What is the new admin ID to be removed?")
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(newServerId);
    modal.addComponents(row);

    await selectInteraction.showModal(modal);

    const filter = (i) => i;

    await selectInteraction
      .awaitModalSubmit({ time: 1000 * 10, filter })
      .then(async (i) => {
        const adminId = i.fields.getTextInputValue(
          "remove-admin-modal-admin-id",
        );

        i.guild.members
          .fetch(adminId, {
            force: true,
          })
          .then(async (adminUser) => {
            if (adminUser.user.bot) {
              throw new Error("You can't remove a bot as an admin");
            }

            if (adminUser.user.id === interaction.user.id) {
              throw new Error("You can't remove yourself as an admin");
            }

            const successData = [];

            if (value === "all") {
              if (
                subscriptions.every((e) =>
                  e.tokens.every(
                    (token) =>
                      !token.setting.admins.includes(adminUser.user.id),
                  ),
                )
              ) {
                throw new Error("This user is not an admin");
              }
              await removeAdminAll(interaction.user, adminUser.user.id);

              successData.push(...subscriptions);
            } else {
              if (
                subFound.tokens.every(
                  (e) => !e.setting.admins.includes(adminUser.user.id),
                )
              ) {
                throw new Error("This user is not an admin");
              } else await removeAdmin(subFound, adminUser.user.id);
              successData.push(subFound);
            }
            const description =
              `* **Your subscriptions :**\n` +
              `${successData.map((sub) => ` * ${capitalize(sub.botType)} x${sub.botAmount} (sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName}`).join("\n")}` +
              `\n* **Removed admin :**\n` +
              ` * <@${adminUser.user.id}>`;

            const successEmbed = interactionServerEmbed(
              interaction,
              interaction.user,
            )
              .setTitle("Subscriptions Remove Admin")
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
      })
      .catch((err) => {
        console.error(err);
        interaction.editReply({
          content: "There was an error while adding the admin",
          embeds: [],
          components: [],
        });
      });

      collector.stop("done")
    })

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
