const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const {
  getSubscriptionsFromUser,
  transferOwnerAll,
  transferOwner,
} = require("../../lib/subscriptions");
const { interactionServerEmbed, capitalize } = require("../../utils/functions");
const { sendLogMessage } = require("../../utils/logMessage");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");

module.exports = {
  name: "transfer-ownership",
  description: "Transfer owner modal for selected bot",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions transfer ownership",
      "Copy the ID of the new owner. Select from which subscription do you want to transfer the ownership",
      "selector-transfer-owner",
      "Transfer owner from all subscriptions",
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
        .setCustomId("transfer-owner-modal")
        .setTitle("Transfer owner for selected subscription");

      const newServerId = new TextInputBuilder()
        .setCustomId("transfer-owner-modal-new-owner-id")
        .setLabel("What is the new owner ID?")
        .setStyle(TextInputStyle.Short);

      const row = new ActionRowBuilder().addComponents(newServerId);
      modal.addComponents(row);

      await selectInteraction.showModal(modal);

      const filter = (i) => i;

      await selectInteraction
        .awaitModalSubmit({ time: 60_000, filter })
        .then(async (i) => {
          await i.deferReply({ ephemeral: true });
          const newOwnerId = i.fields.getTextInputValue(
            "transfer-owner-modal-new-owner-id",
          );
          i.guild.members
            .fetch(newOwnerId, {
              force: true,
            })
            .then(async (ownerUser) => {
              if (!ownerUser) {
                return await i.editReply(
                  "This person does not exist on our server",
                );
              }

              if (ownerUser.id === interaction.user.id) {
                return await i.editReply(
                  "You cannot transfer ownership to yourself",
                );
              }

              if (ownerUser.bot) {
                return await i.editReply(
                  "You cannot transfer ownership to a bot",
                );
              }

              const dataArray = [];

              if (value === "all") {
                dataArray.push(...subscriptions);
              } else {
                dataArray.push(subFound);
              }

              if (value === "all")
                await transferOwnerAll(interaction.user, newOwnerId);
              else await transferOwner(subFound, newOwnerId);

              const description =
                `* **Your Subscriptions :**\n${dataArray
                  .map((sub) => {
                    return ` * [${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId})]`;
                  })
                  .join("\n")}` +
                `\n* **Transfer Owner To:**\n * <@${newOwnerId}>`;

              const embed = interactionServerEmbed(
                interaction,
                interaction.user,
              )
                .setTitle("Subscriptions server changed")
                .setDescription(description);

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

              await i.deleteReply();
              await interaction.editReply({
                embeds: [embed],
                components: [],
              });
            })
            .catch(async (err) => {
              console.error(err);
              await i.editReply("This person does not exist on our server");
            });
        })
        .catch((err) => {
          console.error(err);
          interaction.editReply({
            content: "There was an error while transferring the owner",
            embeds: [],
            components: [],
          });
        });

      collector.stop("done");
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
