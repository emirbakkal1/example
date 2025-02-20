const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  CommandInteraction,
  EmbedBuilder,
} = require("discord.js");
const { getSubscriptionsFromUser } = require("../../lib/subscriptions");
const {
  getGuildIdFromLink,
  interactionServerEmbed,
  capitalize,
} = require("../../utils/functions");
const { leaveGuild } = require("../../lib/botProcess");
const { sendLogMessage } = require("../../utils/logMessage");
const { prisma } = require("../../database/db");
const {invitaionWithGuildLink} = require("../../utils/constants");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");

module.exports = {
  name: "change-server",
  description: "Change server modal for selected bot",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
     const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions Change Server",
      "Select from which subscription do you want to change the server",
      "selector-change-server",
      "Change server from all subscriptions",
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
      .setCustomId("change-server-modal")
      .setTitle("Change server for selected subscription");

    const newServer = new TextInputBuilder()
      .setCustomId("change-server-modal-new-server")
      .setLabel("What is the new invitation link?")
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(newServer);
    modal.addComponents(row);

    await selectInteraction.showModal(modal);

    const filter = (i) => i;

    await selectInteraction
      .awaitModalSubmit({ time: 60_000, filter })
      .then(async (i) => {
        const serverLink = i.fields.getTextInputValue(
          "change-server-modal-new-server",
        );
        const server = await getGuildIdFromLink(serverLink);

        if (!server) {
          await i.deferReply({ ephemeral: true });
          return await i.editReply("Invalid invite link.");
        }

        const dataArray = [];

        if (value === "all") {
          dataArray.push(...subscriptions);
        } else {
          dataArray.push(subFound);
        }

        if (
          dataArray.every((sub) =>
            sub.tokens.every((bot) => bot.setting.guildId === server.id),
          )
        ) {
          await i.deferUpdate();
          return await interaction.editReply({
            content: "The bot is already in this server.",
            embeds: [],
            components: [],
          });
        }

        await prisma.setting.updateMany({
          where: {
            token: {
              subscription: {
                id: { in: dataArray.map((sub) => sub.id) },
              },
            },
          },
          data: {
            guildId: server.id,
            guildName: server.name,
          },
        });

        for (const sub of dataArray) {
          for (const token of sub.tokens) {
            await leaveGuild(token.token);
          }
        }

        const description =
          `* **Your Subscriptions :**\n${dataArray
            .map((sub) => {
              return ` * [${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId})] (${invitaionWithGuildLink(sub.tokens[0].botId, server.id)})`;
            })
            .join("\n")}` +
          `\n* **Server changed to:**\n * [${server.name}](${serverLink}) (${server.id})`;

        const embed = interactionServerEmbed(interaction, interaction.user)
          .setTitle("Subscriptions server changed")
          .setDescription(description);

        await i.deferUpdate();
        await interaction.editReply({
          components: [],
          embeds: [embed],
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
      })
      .catch(async (err) => {
        console.log(err);
        await interaction.editReply({
          content: "❌ An error occurred. Please try again!",
          components: [],
          embeds: [],
          ephemeral: true,
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
