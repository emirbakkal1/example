const { Message, hyperlink } = require("discord.js");
const {
  getGuildIdFromLink,
  errorEmbed,
  getBotInfoByLogin,
} = require("../../utils/functions");
const {
  invitaionWithGuildLink,
} = require("../../utils/constants");
const { updateServerAll, getBotInfoAll } = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "setserverall",
    description: "To change the server of all bots",
    aliases: ["ssa"],
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
    if (isMaster && !args.length) {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Please provide a valid invite link",
          ),
        ],
      });
    }

    const server = await getGuildIdFromLink(args[0]);

    if (!server) {
      if (!isMaster) return;
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "Please provide a valid invite link",
          ),
        ],
      });
    }

    if (server.id === message.guild.id) {
      const sameServerEmbed = errorEmbed(message).setDescription(
        "The server is already the same",
      );

      if (!isMaster) return;
      return await message.reply({ embeds: [sameServerEmbed] });
    }

    if (isMaster) {
      const botInfoAll = await getBotInfoAll(
        message.author.id,
        message.guild.id,
        true,
      );

      await updateServerAll(
        message.author.id,
        message.guild.id,
        server.id,
        server.name,
      );

      const newBotInfoAll = botInfoAll.map(async (e) => {
        return await prisma.setting.findFirst({
          where: {
            token: {
              id: e.token.id,
            },
          },
          include: {
            token: true,
          },
        });
      });

      const awaitNewBotInfoAll = await Promise.all(newBotInfoAll);

      const botChanged = awaitNewBotInfoAll.filter(
        (e) => e.guildId === server.id,
      ).length;
      const botNotChanged = awaitNewBotInfoAll.filter(
        (e) => e.guildId !== server.id,
      ).length;

      const description = awaitNewBotInfoAll.map(async (e, i) => {
        const botInfo = await getBotInfoByLogin(e.token.token);
        const serverInfo = message.client.guilds.cache.get(e.guildId);
        return `${i + 1}. ${hyperlink(`${botInfo.username}#${botInfo.discriminator}`, invitaionWithGuildLink(e.token.botId, e.guildId))}  | ${serverInfo ? serverInfo.name : e.guildName}`;
      });

      const awaitdescription = await Promise.all(description);

      await pagingEmbed(
        awaitdescription,
        message,
        20,
        null,
        botChanged,
        botNotChanged,
      );
    }
    return await message.guild.leave();
  },
};
