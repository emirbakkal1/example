const {
  CommandInteraction,
  ComponentType,
  bold,
  ActionRowBuilder,
  ButtonBuilder,
  hyperlink,
} = require("discord.js");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");
const { sendLogMessage } = require("../../utils/logMessage");
const {
  interactionServerEmbed,
  getBotInfoByLogin,
  capitalize,
} = require("../../utils/functions");
const { getSubscriptionsFromUser } = require("../../lib/subscriptions");
const { invitaionWithGuildLink } = require("../../utils/constants");

module.exports = {
  name: "invitation",
  description: "Send a setup interaction to change the server of the bot.",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions Invitation",
      "Select from which subscription do you want to get the invitation link",
      "selector-invitation",
      "Get invitation link from all subscriptions",
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

      const sortedData = dataArray.sort((a, b) => {
        if (a.botType === "music") return 1;
        if (b.botType === "music") return -1;
        return 0;
      });

      selectInteraction.deferUpdate();

      const invitations = sortedData.map(async (sub) => {
        const data = `* **${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId}) :**\n`;
        const tempDataArray = [];

        for (const bot of sub.tokens) {
          const botInfo = await getBotInfoByLogin(bot.token);
          const serverInfo = interaction.client.guilds.cache.get(
            bot.setting.guildId,
          );
          tempDataArray.push(
            ` * ${hyperlink(`${botInfo.username}#${botInfo.discriminator}`, invitaionWithGuildLink(bot.botId, bot.setting.guildId))}  | ${serverInfo ? serverInfo.name : bot.setting.guildName} ${bot.setting.inGuild ? "🟢" : "🔴"}`,
          );
        }

        return data + tempDataArray.join("\n");
      });

      const awaitInvitations = await Promise.all(invitations);

      console.log(awaitInvitations);

      let outSideBot = 0;
      let inSideBot = 0;

      for (const sub of dataArray) {
        for (const token of sub.tokens) {
          if (token.setting.inGuild) {
            inSideBot++;
          } else {
            outSideBot++;
          }
        }
      }

      const n = awaitInvitations.length / 20;
      const embeds = [];

      for (let i = 0; n > i; i++) {
        const queueEmbed = interactionServerEmbed(interaction, interaction.user)
          .setTitle("Invitations")
          .setDescription(
            `${bold(`outside bots: ${outSideBot}\ninside bots: ${inSideBot}`)}\n${awaitInvitations.slice(i * 20, (i + 1) * 20).join("\n")}`,
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
        if (int.customId !== "messageDelete")
          await pagingCollector.resetTimer();

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
        interactionServerEmbed(interaction, interaction.user)
          .setTitle("Subscriptions Initation")
          .setDescription(
            `* **Your Subscriptions :**\n${sortedData
              .map((sub) => {
                return ` * ${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName}`;
              })
              .join("\n")}` +
              `\n* **Subscription Owner :**\n * <@${interaction.user.id}>`,
          ),
      );

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
