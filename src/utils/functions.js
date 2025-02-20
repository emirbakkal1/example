const { EmbedBuilder, Client } = require("discord.js");

const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getGuildIdFromLink = async (link) => {
  const linkId = link.split("discord.gg/")[1];
  if (linkId === undefined) return null;
  const response = await fetch(
    `https://discord.com/api/invites/${linkId}`,
  ).then((res) => res.json());
  if (response?.guild === undefined) return null;
  return response.guild;
};

const interactionServerEmbed = (interaction, client) => {
  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setAuthor({
      name: client.displayName,
      iconURL: client.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
    .setFooter({
      text: interaction.guild.name,
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    });

  return embed;
};

async function getBotInfoByLogin(token) {
  const botInfoPromises = new Promise((resolve, reject) => {
    const client = new Client({
      intents: [],
    });

    client.on("ready", () => {
      const clientUser = client.user;
      resolve(clientUser);
    });

    client.on("error", reject);

    client.login(token).catch(reject);
  });

  // Wait for all bots to be ready and gather their information
  const botInfo = await Promise.resolve(botInfoPromises);

  return botInfo;
}

module.exports = {
  getBotInfoByLogin,
  capitalize,
  getGuildIdFromLink,
  interactionServerEmbed,
};
