const { CommandInteraction, ComponentType, bold, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");
const { getSubscriptionsFromUser } = require("../../lib/subscriptions");
const { interactionServerEmbed, capitalize } = require("../../utils/functions");
const { sendLogMessage } = require("../../utils/logMessage");

module.exports = {
  name: "show-admins",
  description: "Show admins modal for selected bot",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions Show Admins",
      "Select from which subscription do you want to show the admins",
      "selector-show-admin",
      "Show admins from all subscriptions",
      true,
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

      selectInteraction.deferUpdate();
        const description = subFound.tokens.map((e, i) => {
          return `${i + 1}. <@${e.botId}>\n ${
        e.setting.admins.length
          ? e.setting.admins.map((a) => ` - <@${a}>`).join("\n")
          : "No admins"
      }`
        })

        const n = description.length / 10;
        const embeds = [];
  
        for (let i = 0; n > i; i++) {
          const queueEmbed = interactionServerEmbed(interaction, interaction.user)
            .setTitle("Invitations")
            .setDescription(
              `${bold(`${capitalize(subFound.botType)} x${subFound.botAmount} (Sub_ID: ${subFound.subId})`)} | ${subFound.tokens[0].setting.guildName}\n${description.slice(i * 10, (i + 1) * 20).join("\n")}`,
            )
            .setFooter({
              text: `page ${i + 1}/${Math.ceil(n)}`,
            });
  
          embeds.push(queueEmbed);
        }
  
        const {
          paginationStartButton,
          paginationBackButton,
          paginationForwardButton,
          paginationEndButton,
        } = require("../../utils/components");
        const startButton = ButtonBuilder.from(paginationStartButton);
        const backButton = ButtonBuilder.from(paginationBackButton);
        const forwardButton = ButtonBuilder.from(paginationForwardButton);
        const endButton = ButtonBuilder.from(paginationEndButton);
  
        let group = new ActionRowBuilder().addComponents([
          startButton.setDisabled(true),
          backButton.setDisabled(true),
          forwardButton.setDisabled(true),
          endButton.setDisabled(true),
        ]);
        if (embeds.length > 1)
          group = new ActionRowBuilder().addComponents([
            startButton.setDisabled(true),
            backButton.setDisabled(true),
            forwardButton.setDisabled(false),
            endButton.setDisabled(false),
          ]);
  
        const paginReply = await interaction.editReply({
          embeds: [embeds[0]],
          components: [group],
        });
  
        const pagingCollector = paginReply.createMessageComponentCollector({
          time: 1000 * 60 * 2,
        });
  
        let currentPage = 0;
  
        pagingCollector.on("collect", async (int) => {
          if (int.customId !== "messageDelete") await pagingCollector.resetTimer();
  
          if (int.customId === "start") {
            currentPage = 0;
            group = new ActionRowBuilder().addComponents([
              startButton.setDisabled(true),
              backButton.setDisabled(true),
              forwardButton.setDisabled(false),
              endButton.setDisabled(false),
            ]);
            int.update({ embeds: [embeds[currentPage]], components: [group] });
          } else if (int.customId === "back") {
            --currentPage;
            if (currentPage === 0) {
              group = new ActionRowBuilder().addComponents([
                startButton.setDisabled(true),
                backButton.setDisabled(true),
                forwardButton.setDisabled(false),
                endButton.setDisabled(false),
              ]);
            } else {
              group = new ActionRowBuilder().addComponents([
                startButton.setDisabled(false),
                backButton.setDisabled(false),
                forwardButton.setDisabled(false),
                endButton.setDisabled(false),
              ]);
            }
            int.update({ embeds: [embeds[currentPage]], components: [group] });
          } else if (int.customId === "messageDelete") {
            await int.deferUpdate();
            await int.deleteReply().catch(() => null);
            //   await selectInteraction.delete().catch(() => null);
          } else if (int.customId === "forward") {
            currentPage++;
            if (currentPage === embeds.length - 1) {
              group = new ActionRowBuilder().addComponents([
                startButton.setDisabled(false),
                backButton.setDisabled(false),
                forwardButton.setDisabled(true),
                endButton.setDisabled(true),
              ]);
            } else {
              group = new ActionRowBuilder().addComponents([
                startButton.setDisabled(false),
                backButton.setDisabled(false),
                forwardButton.setDisabled(false),
                endButton.setDisabled(false),
              ]);
            }
            int.update({ embeds: [embeds[currentPage]], components: [group] });
          } else if (int.customId === "end") {
            currentPage = embeds.length - 1;
            group = new ActionRowBuilder().addComponents([
              startButton.setDisabled(false),
              backButton.setDisabled(false),
              forwardButton.setDisabled(true),
              endButton.setDisabled(true),
            ]);
            int.update({ embeds: [embeds[currentPage]], components: [group] });
          }
        });
  
        pagingCollector.on("end", async (collected, reason) => {
          if (["messageDelete", "messageDeleteBulk"].includes(reason)) return;
          return await interaction.editReply({
            components: [
              new ActionRowBuilder().addComponents(
                startButton.setDisabled(true),
                backButton.setDisabled(true),
                forwardButton.setDisabled(true),
                endButton.setDisabled(true),
              ),
            ],
          });
        });


      await sendLogMessage(
        interaction,
        interactionServerEmbed(interaction, user)
        .setTitle("Subscriptions Show Admin")
        .setDescription(
          `* **Your subscriptions :**\n` +
           ` * ${capitalize(subFound.botType)} x${subFound.botAmount} (Sub_ID: ${subFound.subId}) | ${subFound.tokens[0].setting.guildName}` +
            `\n* **Subscription Owner :**\n * <@${interaction.user.id}>`,
        ),
      );

      collector.stop("done");
    });

    collector.on("end", async () => {
      if (collector.endReason === "time") {
        console.log("Time is over! Show Admins");
        await interaction.editReply({
          components: [],
          embeds: [],
          content: "Time is over!",
        });
      }
    });
  },
};
