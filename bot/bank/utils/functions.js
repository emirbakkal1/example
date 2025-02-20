// convert milliseconds to 3:00 format (3 minutes and 0 seconds)
const { EmbedBuilder, Colors, Client, Message } = require("discord.js");
const { getEmbedColor } = require("../lib/info");

function convert(x) {
  const seconds = Math.floor(x / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;
}

class CustomEmbedBuilder extends EmbedBuilder {
  constructor(client) {
    super();
    this.embedColor = client.embedColor;
  }

  setColor() {
    if (this.embedColor !== null) {
      return super.setColor(this.embedColor);
    }
    return this;
  }
}

const getGuildIdFromLink = async (link) => {
  const linkId = link.split("discord.gg/")[1];
  if (linkId === undefined) return null;
  const response = await fetch(
    `https://discord.com/api/invites/${linkId}`,
  ).then((res) => res.json());
  if (response?.guild === undefined) return null;
  return response.guild;
};

const getMessageAndEmbed = async (interaction) => {
  const message = await interaction.client.channels.cache
    .get(interaction.channelId)
    .messages.cache.get(interaction.message.id);

  const messageEmbedData = message.embeds[0].toJSON();

  const messageEmbedRef = EmbedBuilder.from(messageEmbedData);

  return { message, messageEmbedRef };
};

/**
 *
 * @param {Message} message
 * @returns
 */
const serverEmbed = (message) => {
  if (!(message instanceof Message)) {
    throw new TypeError(
      'Expected parameter "message" to be a Message instance.',
    );
  }

  const embed = new CustomEmbedBuilder(message.client)
    .setColor()
    .setAuthor({
      name: message.author.displayName,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail(message.guild.iconURL({ dynamic: true }))
    .setFooter({
      text: message.guild.name,
      iconURL: message.guild.iconURL({ dynamic: true }),
    });

  return embed;
};

const interactionServerEmbed = (interaction) => {
  const embed = new CustomEmbedBuilder(interaction.client)
    .setColor()
    .setAuthor({
      name: interaction.member.displayName,
      iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
    .setFooter({
      text: interaction.guild.name,
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    });

  return embed;
};

/**
 *
 * @param {Message} message
 * @returns
 */
const errorEmbed = (message) => {
  const errorEmbed = new EmbedBuilder()
    .setTitle("Error message")
    .setColor(Colors.Red)
    .setAuthor({
      name: message.author.displayName,
      iconURL: message.author.displayAvatarURL({ size: 1024 }),
    })
    .setThumbnail(message.guild.iconURL({ dynamic: true }))
    .setFooter({
      text: message.guild.name,
      iconURL: message.guild.iconURL({ dynamic: true }),
    });

  return errorEmbed;
};

const interactionErrorEmbed = (interaction) => {
  const errorEmbed = new EmbedBuilder()
    .setTitle("Error message")
    .setColor(Colors.Red)
    .setAuthor({
      name: interaction.member.displayName,
      iconURL: interaction.member.displayAvatarURL({ size: 1024 }),
    })
    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
    .setFooter({
      text: interaction.guild.name,
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    });

  return errorEmbed;
};

function progressBar(current, total, size = 20) {
  const percent = Math.round((current / total) * 100);
  const filledSize = Math.round((size * current) / total);
  const filledBar = "▓".repeat(filledSize);
  const emptyBar = "░".repeat(size - filledSize);
  return `${filledBar}${emptyBar} ( ${convert(current)} / ${convert(total)} )`;
}

function timeToMilliseconds(timeString) {
  // Split the input string into minutes and seconds
  const [minutes, seconds] = timeString.split(":").map(Number);

  // Calculate the total number of milliseconds
  const milliseconds = minutes * 60000 + seconds * 1000;

  return milliseconds;
}

function checkIfVoiceChannelChatCan(message) {
  const voiceChannelChat = message.guild.id;
}

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

/**
 * Fetches a channel by ID or channel mention.
 * @param {Message} message - The message object that contains the guild.
 * @param {string[]} args - The command arguments.
 * @returns {Promise<import("discord.js").GuildBasedChannel>} The fetched channel object.
 */
const fetchChannel = async (message, args) => {
  const id = args
    .join(" ")
    .replace(/\D/g, "")
    .replace("<#", "")
    .replace(">", "");

  return await message.guild.channels.fetch(id, {
    force: true,
  });
};

module.exports = {
  fetchChannel,
  getBotInfoByLogin,
  convert,
  CustomEmbedBuilder,
  getGuildIdFromLink,
  getMessageAndEmbed,
  serverEmbed,
  errorEmbed,
  interactionServerEmbed,
  interactionErrorEmbed,
  progressBar,
  timeToMilliseconds,
};
