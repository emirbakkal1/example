const { prisma } = require("../../../src/database/db");

const setIsInGuildByBotId = async (botId, isInGuild, guildName) => {
  const token = await prisma.token.findFirst({
    where: {
      botId: botId,
    },
    include: {
      setting: true,
    },
  });
  await prisma.setting.update({
    where: {
      id: token.setting.id,
    },
    data: {
      inGuild: isInGuild,
      guildName: guildName,
    },
  });
};

const determineRespondingBot = async (userId, guildId, botId) => {
  const token = await prisma.token.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              subscription: {
                customerId: userId,
              },
            },
            {
              setting: {
                admins: {
                  has: userId,
                },
              },
            },
          ],
        },
        {
          setting: {
            guildId: guildId,
            inGuild: true,
          },
        },
        {
          process: {
            running: true,
          },
        },
      ],
    },
    include: {
      subscription: true,
    },
    orderBy: {
      tokenId: "desc",
    },
  });

  const personalBot = token.find((t) => t.subscription.customerId === userId);

  try {
    if (personalBot === undefined) {
      token.sort((a, b) => a.tokenId - b.tokenId);

      return token[0].botId === botId;
    }

    return personalBot.botId === botId;
  } catch (error) {
    return false;
  }
};

module.exports = {
  setIsInGuildByBotId,
  determineRespondingBot,
};
