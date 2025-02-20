const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../database/db");
const { Client } = require("discord.js");
const { removeBotProcess } = require("./botProcess");
const { capitalize, interactionServerEmbed } = require("../utils/functions");

const listTokens = async (interaction, type) => {
  const tokens = await prisma.token.findMany({
    where: {
      botType: type ? type : undefined,
      subscription: null,
    },
  });

  if (!tokens.length) {
    return await interaction.editReply("No tokens found.");
  }

  const embed = interactionServerEmbed(interaction, interaction.user).setTitle(
    "Tokens",
  );

  if (type) {
    const freeTokens = tokens.reduce(
      (acc, token) => (token.botType === type ? acc + 1 : acc),
      0,
    );
    embed.addFields({
      name: capitalize(type),
      value: `\`${freeTokens}\` Tokens`,
    });
  } else {
    const freeMusicTokens = tokens.reduce(
      (acc, token) => (token.botType === "music" ? acc + 1 : acc),
      0,
    );
    const freeGameTokens = tokens.reduce(
      (acc, token) => (token.botType === "game" ? acc + 1 : acc),
      0,
    );

    embed.addFields(
      {
        name: "Music",
        value: `\`${freeMusicTokens}\` Tokens`,
      },
      {
        name: "Game",
        value: `\`${freeGameTokens}\` Tokens`,
      },
    );
  }

  await interaction.editReply({ embeds: [embed] });
};

const getBotToken = async (botId) => {
  const token = await prisma.token.findFirst({
    where: {
      botId,
    },
  });

  return token;
};

const addToken = async (interaction, token, type) => {
  const existingToken = await prisma.token.findUnique({
    where: {
      token,
    },
  });

  if (existingToken) {
    return `already exists * \`${token}\``;
  }

  try {
    const client = new Client({
      intents: [],
    });

    client.on("ready", async () => {
      const botId = client.user.id;
      const lastToken = await prisma.token.findFirst({
        select: {
          tokenId: true,
        },
        orderBy: {
          tokenId: "desc",
        },
      });

      const tokenId = lastToken ? lastToken.tokenId + 1 : 0;
      await prisma.token.create({
        data: {
          token: token,
          botType: type,
          botName: `Bot ${tokenId}`,
          botId,
          tokenId,
        },
      });

      await client.user.setUsername(`Bot ${tokenId}`);
      await client.user.setAvatar("src/assets/bot.jpeg");
      await client.user.setBanner("src/assets/banner.gif");
      await client.destroy();
    });

    await client.login(token);
  } catch (error) {
    console.log(error);
    return `invalid token * \`${token}\``;
  }

  return `success \`${token}\` added with type \`${type}\`!`;
};

const removeToken = async (interaction, token) => {
  const existingToken = await prisma.token.findUnique({
    where: {
      token: token,
    },
    include: {
      process: true,
      subscription: true,
    },
  });

  if (!existingToken) {
    return `invalid token \`${token}\``;
  }

  if (existingToken.subscriptionId) {
    return `active \`${token}\` has an active subscription (Sub_ID: ${existingToken.subscription.subId}) Owner: <@${existingToken.subscription.customerId}>`;
  }

  const processId = existingToken.process
    ? existingToken.process.processId
    : null;

  if (processId) {
    await removeBotProcess(existingToken);
  }

  const deletedToken = await prisma.token.delete({
    where: {
      token,
    },
  });

  return `success \`${deletedToken.token}\` removed with type \`${deletedToken.botType}\`!`;
};

const resetSetting = async (token) => {
  await prisma.setting.deleteMany({
    where: {
      token: {
        token,
      },
    },
  });
};

const resetBotState = async (token) => {
  try {
    const client = new Client({
      intents: [],
    });

    client.on("ready", async () => {
      const guild = client.guilds.cache.first();
      console.log(guild?.id);

      if (!guild) {
        console.log("Guild not found");
        return;
      }

      await client.user.setAvatar("src/assets/bot.jpeg");
      await client.user.setUsername(`Bot ${token.tokenId}`);
      await client.user.setBanner("src/assets/banner.gif");
      await guild.leave();
      await client.destroy();
    });

    return await client.login(token.token);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  listTokens,
  addToken,
  removeToken,
  resetBotState,
  getBotToken,
};
