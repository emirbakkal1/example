const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "marriage",
    description: "Marry another user and pay the specified amount.",
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Validate the arguments
    if (args.length < 2) {
      const noArgsEmbed = errorEmbed(message).setDescription(
        "Please provide the user to marry and the amount."
      );
      return await message.reply({ embeds: [noArgsEmbed] });
    }

    const targetUser = await message.client.users.fetch(args[0].replace("<@", "").replace(">", "")).catch(() => null);
    const amount = parseFloat(args[1]);

    if (!targetUser || isNaN(amount) || amount <= 0) {
      const invalidArgsEmbed = errorEmbed(message).setDescription(
        "Invalid user or amount provided."
      );
      return await message.reply({ embeds: [invalidArgsEmbed] });
    }

    if (userId === targetUser.id) {
      const selfEmbed = errorEmbed(message).setDescription(
        "You cannot marry yourself."
      );
      return await message.reply({ embeds: [selfEmbed] });
    }

    // Fetch users from the database
    const user = await prisma.user.findUnique({ where: { id: userId, guildId: guildId } });
    const target = await prisma.user.findUnique({ where: { id: targetUser.id, guildId: guildId } });

    if (!user || !target) {
      const userNotFoundEmbed = errorEmbed(message).setDescription(
        "User not found."
      );
      return await message.reply({ embeds: [userNotFoundEmbed] });
    }

    if (user.marriedTo || target.marriedTo) {
      const alreadyMarriedEmbed = errorEmbed(message).setDescription(
        "One of the users is already married."
      );
      return await message.reply({ embeds: [alreadyMarriedEmbed] });
    }

    if (user.balance < amount) {
      const insufficientFundsEmbed = errorEmbed(message).setDescription(
        "Insufficient funds."
      );
      return await message.reply({ embeds: [insufficientFundsEmbed] });
    }

    // Create the proposal message with Accept and Reject buttons
    const proposalEmbed = new EmbedBuilder()
      .setTitle("Marriage Proposal")
      .setColor(0x50C878)
      .setDescription(
        `<@${targetUser.id}>, do you accept the marriage proposal from <@${message.author.id}> for **${amount}** coins?`
      );

    const acceptButton = new ButtonBuilder()
      .setCustomId("accept_marriage")
      .setLabel("Accept 💍")
      .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
      .setCustomId("reject_marriage")
      .setLabel("Reject ❌")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(acceptButton, rejectButton);

    const proposalMessage = await message.reply({ embeds: [proposalEmbed], components: [row] });

    try {
      const filter = (interaction) => interaction.user.id === targetUser.id;
      const collector = proposalMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 10000 });

      collector.on("collect", async (interaction) => {
        await interaction.deferUpdate();

        if (interaction.customId === "accept_marriage") {
          // Process the acceptance
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId, guildId: guildId },
              data: {
                marriedTo: targetUser.id,
                balance: { decrement: amount },
              },
            }),
            prisma.user.update({
              where: { id: targetUser.id, guildId: guildId },
              data: {
                marriedTo: userId,
                balance: { increment: amount },
              },
            }),
            prisma.marriage.create({
              data: {
                user1Id: userId,
                user2Id: targetUser.id,
                amount: amount,
                guildId: guildId,
              },
            }),
          ]);

          const marriageSuccessful = new EmbedBuilder()
            .setTitle("Marriage Successful")
            .setColor(0x50C878)
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setDescription(`You've married <@${targetUser.id}> and got paid **${amount}** coins.`);

          await proposalMessage.edit({ embeds: [marriageSuccessful], components: [] });
        } else if (interaction.customId === "reject_marriage") {
          // Process the rejection
          const rejectionEmbed = new EmbedBuilder()
            .setTitle("Marriage Proposal Rejected")
            .setColor(0xFF0000)
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setDescription(`<@${targetUser.id}> has rejected the marriage proposal.`);

          await proposalMessage.edit({ embeds: [rejectionEmbed], components: [] });
        }

        collector.stop();
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "time") {
          const noResponseEmbed = errorEmbed(message).setDescription(
            `<@${targetUser.id}> did not respond in time. Marriage proposal expired.`
          );
          await proposalMessage.edit({ embeds: [noResponseEmbed], components: [] });
        }
      });
    } catch (error) {
      const errorEmbedMessage = errorEmbed(message).setDescription(
        "An error occurred while processing the marriage proposal."
      );
      return await message.reply({ embeds: [errorEmbedMessage] });
    }
  },
};