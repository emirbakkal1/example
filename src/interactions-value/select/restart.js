const {
  CommandInteraction,
  ComponentType,
  Collection,
  EmbedBuilder,
} = require("discord.js");
const { sendSetupInteraction } = require("../../utils/setupInterectionHelper");
const { getSubscriptionsFromUser } = require("../../lib/subscriptions");
const { prisma } = require("../../database/db");
const { interactionServerEmbed, capitalize } = require("../../utils/functions");
const { sendLogMessage } = require("../../utils/logMessage");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
  name: "restart-bot",
  description: "Restart a bot",

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  execute: async (interaction) => {
    const reply = await sendSetupInteraction(
      interaction,
      "Subscriptions to restart",
      "Select the subscription you want to restart the bot from",
      "selector-restart-bot",
      "Restart all the subscriptions bots",
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

      for (const sub of dataArray) {
        const { cooldowns } = interaction.client;

        if (!cooldowns.has(sub.id)) {
          cooldowns.set(sub.id, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(sub.id);
        const cooldownAmount = 1000 * 60 * 3;

        if (timestamps.has(sub.id)) {
          const expirationTime = timestamps.get(sub.id) + cooldownAmount;

          if (now < expirationTime) {
            await interaction.editReply({
              content: `You have to wait ${prettyMilliseconds(
                expirationTime - now,
              )} before restarting the bot again!`,
              embeds: [],
              components: [],
            });

            return collector.stop("done");
          }
        }

        timestamps.set(sub.id, now);
        setTimeout(() => timestamps.delete(sub.id), cooldownAmount);

        for (const token of sub.tokens) {
          await prisma.setting.update({
            where: {
              id: token.setting.id,
            },
            data: {
              restart: true,
            },
          });
        }
      }

      const description = `* **Your Subscriptions :**\n${dataArray
        .map((sub) => {
          return ` * **${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId})** | ${sub.tokens[0].setting.guildName}`;
        })
        .join("\n")}`;

      const embed = interactionServerEmbed(interaction, interaction.user)
        .setTitle("Subscriptions bots restarting!")
        .setDescription(description);

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
