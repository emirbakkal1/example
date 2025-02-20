const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "transfer",
    description: "Transfer a certain amount from your balance to another user after deducting a 10% fee.",
  },
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @returns
   */
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Check if the user provided enough arguments
    if (args.length < 2) {
      const noArgsEmbed = errorEmbed(message).setDescription(
        "Please provide the recipient and the amount to transfer."
      );
      return await message.reply({ embeds: [noArgsEmbed] });
    }

    const targetUserId = args[0].replace("<@", "").replace(">", "");
    const amountArg = args[1].toLowerCase();

    // Fetch the user and target user from the database
    const [user, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId, guildId: guildId } }),
      prisma.user.findUnique({ where: { id: targetUserId, guildId: guildId } }),
    ]);

    // Check if the target user is a bot
    const targetUserObject = await message.guild.members.fetch(targetUserId);
    if (targetUserObject.user.bot) {
      const botEmbed = errorEmbed(message).setDescription(
        "The account you mentioned is not a user."
      );
      return await message.reply({ embeds: [botEmbed] });
    }

    if (!user || !targetUser) {
      const notFoundEmbed = errorEmbed(message).setDescription(
        "One or both users not found."
      );
      return await message.reply({ embeds: [notFoundEmbed] });
    }

    // Determine the transfer amount
    let transferAmount;

    if (amountArg === "whole") {
      transferAmount = user.balance;
    } else if (amountArg === "half") {
      transferAmount = Math.floor(user.balance / 2);
    } else if (amountArg === "quarter") {
      transferAmount = Math.floor(user.balance / 4);
    } else {
      transferAmount = Math.floor(parseFloat(amountArg));
    }

    if (isNaN(transferAmount) || transferAmount <= 0) {
      const invalidAmountEmbed = errorEmbed(message).setDescription(
        "Please provide a valid amount to transfer."
      );
      return await message.reply({ embeds: [invalidAmountEmbed] });
    }

    // Calculate the fee and net transfer amount
    const fee = Math.floor(transferAmount * 0.10);
    const netAmount = transferAmount - fee;

    // Check if the user has enough balance
    if (user.balance < transferAmount) {
      const insufficientFundsEmbed = errorEmbed(message).setDescription(
        "You do not have enough balance to complete this transfer."
      );
      return await message.reply({ embeds: [insufficientFundsEmbed] });
    }

    // Process the transfer
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId, guildId: guildId },
        data: {
          balance: { decrement: transferAmount },
        },
      }),
      prisma.user.update({
        where: { id: targetUserId, guildId: guildId },
        data: {
          balance: { increment: netAmount },
        },
      }),
    ]);

    // Send confirmation message
    const successEmbed = new EmbedBuilder()
      .setTitle("Transfer Successful")
      .setColor(0x50C878)
      .setDescription(`Successfully transferred **${netAmount.toLocaleString('en-US')}** coins to <@${targetUserId}>.\nA fee of **${fee.toLocaleString('en-US')}** coins was deducted.`);

    await message.reply({ embeds: [successEmbed] });
  },
};