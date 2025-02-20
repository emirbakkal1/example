const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "pay",
    description: "Pay off your active loan.",
  },
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Fetch the user with their loan data
    const user = await prisma.user.findUnique({
      where: { id: userId, guildId: guildId },
    });

    if (!user) {
      const userNotFoundEmbed = errorEmbed(message).setDescription(
        "User not found."
      );
      return await message.reply({ embeds: [userNotFoundEmbed] });
    }

    // Check if the user has an active loan
    if (!user.loanAmount || user.loanAmount <= 0) {
      const noLoanEmbed = errorEmbed(message).setDescription(
        "You have no active loan to pay off."
      );
      return await message.reply({ embeds: [noLoanEmbed] });
    }

    // Check if the user has enough balance to pay the loan
    if (user.balance < user.loanAmount) {
      const insufficientFundsEmbed = errorEmbed(message).setDescription(
        `You don't have enough money to pay off the loan. You need **${user.loanAmount}** coins.`
      );
      return await message.reply({ embeds: [insufficientFundsEmbed] });
    }

    // Process the payment: deduct loan amount and reset loan fields
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: {
        balance: { decrement: user.loanAmount },
        loanAmount: 0, // Reset loan amount
        loanTimestamp: null, // Reset loan timestamp
      },
    });

    const paymentSuccessEmbed = new EmbedBuilder()
      .setTitle("Loan Paid Off")
      .setColor(0x50C878)
      .setDescription(`You have successfully paid off your loan of **${user.loanAmount}** coins.`);

    await message.reply({ embeds: [paymentSuccessEmbed] });
  },
};