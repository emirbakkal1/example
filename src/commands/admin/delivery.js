const {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  inlineCode,
  EmbedBuilder,
} = require("discord.js");
const { prisma } = require("../../database/db");
const { addSubscription } = require("../../lib/subscriptions");
const {
  getGuildIdFromLink,
  capitalize,
  interactionServerEmbed,
} = require("../../utils/functions");
const {
  invitaionWithGuildLink,
} = require("../../utils/constants");

const { logChannelId, customerRole } = require("../../config.json");

const getSubscriptionsInformationEmbedDescription = (
  subscriptions,
  serverDetails,
  server,
  months,
) =>
  `* **Your subscriptions :**\n${subscriptions
    .map(
      (sub) =>
        ` - ${sub.sub.botType} x${sub.sub.botAmount} (sub_ID: ${sub.sub.subId})`,
    )
    .join(
      "\n",
    )}\n* **Subscription Owner:**\n - <@${subscriptions[0].sub.customerId}>\n* **Subscription server :**\n - [${serverDetails.name}](${server})\n* **Subscription duration :**\n - ${months} month(s)\n* **Subscription expiration :**\n - ${new Date(Number(subscriptions[0].sub.subscriptionDuration)).toLocaleDateString()}`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delivery")
    .setDescription("Delivers a subscription to a client.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addUserOption((option) =>
      option
        .setName("client")
        .setDescription("The client user.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("server")
        .setDescription("The server id or invite link")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("months")
        .setChoices(
          { name: "1 month", value: "1" },
          { name: "2 months", value: "2" },
          { name: "3 months", value: "3" },
        )
        .setDescription("How many months is the subscription valid.")
        .setRequired(true),
    ),

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const client = interaction.options.getUser("client");
    const server = interaction.options.getString("server");
    const months = interaction.options.getString("months");

    if (client.bot) {
      return await interaction.editReply("Bot users are not allowed.");
    }

    const serverDetails = await getGuildIdFromLink(server);

    if (!serverDetails) {
      return await interaction.editReply("Invalid invite link.");
    }

    const freeTokens = await prisma.token.findMany({
      where: {
        subscription: null,
      },
    });

    if (!freeTokens.length) {
      return await interaction.editReply("No free tokens found.");
    }

    const options = [
      {
        label: "Music BOT",
        value: "music",
        description: "Music BOT delivery",
      },
      {
        label: "Bank BOT",
        value: "bank",
        description: "Bank BOT delivery",
      },
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select-bot-type")
      .setPlaceholder("Select Bot Type")
      .addOptions(
        options.map((option) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(option.label)
            .setValue(option.value)
            .setDescription(option.description),
        ),
      )
      .setMaxValues(options.length)
      .setMinValues(1);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const reply = await interaction.editReply({
      embeds: [new EmbedBuilder().setTitle("Select bot type.")],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on("collect", async (selectInteraction) => {
      if (selectInteraction.user.id !== interaction.user.id) {
        return await selectInteraction.reply({
          content: "This select menu is not for you.",
          ephemeral: true,
        });
      }
      const typeArray = selectInteraction.values;

      let filteredBots = freeTokens.filter((bot) =>
        typeArray.includes(bot.botType),
      );

      // Check if any type from typeArray is missing in the filteredBots
      let missingTypes = typeArray.filter(
        (type) => !filteredBots.some((bot) => bot.botType === type),
      );

      if (missingTypes.length > 0) {
        return await selectInteraction.reply(
          `No free tokens found for ${missingTypes.join(", ")} bots.`,
        );
      }

      if (!filteredBots.length) {
        return await selectInteraction.reply(
          `No free tokens found for ${type} bots.`,
        );
      }

      const totalSubsCreated = [];

      typeArray.forEach(async (type) => {
        if (type === "music") {
          const freeTokensByType = filteredBots.filter(
            (bot) => bot.botType === type,
          );

          const model = new ModalBuilder()
            .setCustomId("model-bot-amount")
            .setTitle("How many music bots do you want to deliver?");

          const amountText = new TextInputBuilder()
            .setCustomId("Input-bot-amount")
            .setLabel("Amount")
            .setPlaceholder("Amount")
            .setRequired(true)
            .setMaxLength(10)
            .setMinLength(1)
            .setValue("1")
            .setStyle(TextInputStyle.Short);

          const row = new ActionRowBuilder().addComponents(amountText);
          model.addComponents(row);

          await selectInteraction.showModal(model);

          const filter = (i) => i;

          await selectInteraction
            .awaitModalSubmit({ time: 60000, filter })
            .then(async (i) => {
              await i.deferUpdate();
              let botAmount = i.fields.getTextInputValue("Input-bot-amount");

              botAmount = parseInt(botAmount);

              if (botAmount > freeTokensByType.length) {
                return await i.reply({
                  content: `You can't deliver more than ${freeTokensByType.length} music bots.`,
                  ephemeral: true,
                });
              }

              const newSub = await addSubscription(
                client,
                type,
                serverDetails.id,
                months,
                botAmount,
                freeTokensByType.slice(0, botAmount),
                serverDetails.name,
              );

              totalSubsCreated.push({
                sub: newSub,
                invitations: invitaionWithGuildLink(
                  newSub.tokens[0].botId,
                  serverDetails.id,
                ),
              });
            });
        } else {
          let botAmount = 1;
          
          const freeTokensByType = filteredBots.filter(
            (bot) => bot.botType === type,
          );

          const newSub = await addSubscription(
            client,
            type,
            serverDetails.id,
            months,
            botAmount,
            freeTokensByType.slice(0, 1),
            serverDetails.name,
          );

          totalSubsCreated.push({
            sub: newSub,
            invitations: invitaionWithGuildLink(
              newSub.tokens[0].botId,
              serverDetails.id,
            ),
          });

          await selectInteraction.deferUpdate();
        }
      });

      // resolve when all subscriptions are created
      const awaitSubs = new Promise((resolve) => {
        const interval = setInterval(() => {
          if (totalSubsCreated.length === typeArray.length) {
            clearInterval(interval);
            resolve();
          }
        }, 500);
      });

      await awaitSubs;

      if (totalSubsCreated.length === typeArray.length) {
        const invitationsButton = totalSubsCreated.map((sub) => {
          return new ButtonBuilder()
            .setLabel(
              `${capitalize(sub.sub.botType)} x${sub.sub.botAmount} (${sub.sub.subId})`,
            )
            .setStyle(ButtonStyle.Link)
            .setURL(sub.invitations);
        });

        // if invitationsButton has more then 5 buttons, split them into multiple rows
        const buttons = [];
        while (invitationsButton.length) {
          buttons.push(invitationsButton.splice(0, 5));
        }

        const rows = buttons.map((button) =>
          new ActionRowBuilder().addComponents(button),
        );
        const subEmbed = interactionServerEmbed(interaction, client)
          .setTitle("New subscription")
          .setDescription(
            getSubscriptionsInformationEmbedDescription(
              totalSubsCreated,
              serverDetails,
              server,
              months,
            ),
          );
        await interaction.editReply({
          content: "",
          embeds: [subEmbed],
          components: rows,
        });

        const logChannel = await interaction.guild.channels.fetch(
          logChannelId,
          {
            force: true,
          },
        );

        if (logChannel) {
          logChannel.send({
            embeds: [subEmbed],
            components: rows,
          });
        }

        let dmDescription = `* **Notes**\n * Bots can be added to one server only\n${typeArray.includes("music") ? ` * After inviting the main music bot, you must type the ${inlineCode("#linksall")} command to invite the rest of the music bots\n` : ""}${getSubscriptionsInformationEmbedDescription(totalSubsCreated, serverDetails, server, months)}`;

        const dmEmbed = subEmbed.setDescription(dmDescription);
        client.createDM().then((dm) => {
          dm.send({
            embeds: [dmEmbed],
            components: rows,
          });
        });

        const role = await interaction.guild.roles.fetch(customerRole, {
          force: true,
        });

        if (role) {
          interaction.guild.members
            .fetch(client.id, {
              force: true,
            })
            .then((member) => {
              if (!member.roles.cache.has(role.id)) {
                member.roles.add(role);
              }
            })
            .catch((err) => {});
        }

        collector.stop("done");
      }
    });

    collector.on("end", async () => {
      if (collector.endReason === "time") {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("Time is up.")],
          components: [],
        });
      }
    });
  },
};
