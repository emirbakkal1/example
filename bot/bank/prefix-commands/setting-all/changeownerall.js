const { Message } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const { changeOwnerAll, getBotInfoAll } = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "changeownerall",
    description: "Change ownership of all bots to another person",
    aliases: ["coa"],
  },
  ownerOnly: true,
  allCommands: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const isMaster = await determineRespondingBot(
      message.author.id,
      message.guild.id,
      message.client.user.id,
    );
    if (!isMaster) return;

    if (!args[0]) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription("Please provide a user ID."),
        ],
      });
    }

    const user = message.client.users.cache.get(
      args[0].replace("<@", "").replace(">", ""),
    );

    if (!user) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription("Please provide a valid user ID."),
        ],
      });
    }

    if (user.bot) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You cannot change the owner to a bot.",
          ),
        ],
      });
    }

    if (user.id === message.author.id) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You cannot change the owner to yourself.",
          ),
        ],
      });
    }

    const botInfoAll = await getBotInfoAll(message.author.id, message.guild.id);
    await changeOwnerAll(message.author.id, message.guild.id, user.id);

    const subscriptionAll = botInfoAll.map(async (e) => {
      return await prisma.subscription.findFirst({
        where: {
          id: e.token.subscriptionId,
        },
      });
    });

    // resolve all promises
    const subscriptionAllResolved = await Promise.all(subscriptionAll);

    // marge two arrays
    const botInfoAllMerged = botInfoAll.map((e, i) => {
      return { ...e, subscription: subscriptionAllResolved[i] };
    });

    const botChanged = botInfoAllMerged.filter(
      (e) => e.subscription.customerId === user.id,
    ).length;
    const botNotChanged = botInfoAllMerged.filter(
      (e) => e.subscription.customerId !== user.id,
    ).length;

    const description = botInfoAllMerged.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${
        e.subscription.customerId === user.id ? "✅" : "❌"
      }`;
    });

    return await pagingEmbed(
      description,
      message,
      20,
      null,
      botChanged,
      botNotChanged,
    );
  },
};
