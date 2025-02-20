const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../../../../src/database/db");
const { errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "loan",
    description: "Take out a loan.",
  },
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Fetch the user
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
    if (user.loanAmount && user.loanAmount > 0) {
      const activeLoanEmbed = errorEmbed(message).setDescription(
        "You already have an active loan. Please pay it off before taking out a new loan."
      );
      return await message.reply({ embeds: [activeLoanEmbed] });
    }

    // Determine the loan amount (this is just an example)
    const loanAmount = 1000000; // For example purposes, you can change this
    const loanTimestamp = Date.now(); // Store the timestamp as a BigInt

    // Process the loan
    await prisma.user.update({
      where: { id: userId, guildId: guildId },
      data: {
        balance: { increment: loanAmount },
        loanAmount: loanAmount,
        loanTimestamp: BigInt(loanTimestamp),
      },
    });

    const loanSuccessEmbed = new EmbedBuilder()
      .setTitle("Loan Taken")
      .setColor(0x50C878)
      .setDescription(`You have successfully taken out a loan of **${loanAmount}** coins.`);

    await message.reply({ embeds: [loanSuccessEmbed] });
  },
};