const { Message, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");
const { getMasterInfo } = require("../../lib/info");
const {
  addAdminAll,
  getBotInfoAll,
  getAdminsAll,
} = require("../../lib/setting");
const { CustomEmbedBuilder, errorEmbed } = require("../../utils/functions");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "addadminall",
    description: "Add an admin to all bots",
    aliases: ["aaa"],
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
      const noArgsEmbed = errorEmbed(message).setDescription(
        "Please provide a user.",
      );

      return await message.reply({ embeds: [noArgsEmbed] });
    }
    const user = await message.client.users.fetch(
      args[0].replace("<@", "").replace(">", ""),
    );

    if (!user) {
      const invalidIdEmbed = errorEmbed(message).setDescription(
        "Please provide a valid user.",
      );

      return await message.reply({ embeds: [invalidIdEmbed] });
    }

    if (user.bot) {
      const botEmbed = errorEmbed(message).setDescription(
        "You cannot add a bot as an admin.",
      );

      return await message.reply({ embeds: [botEmbed] });
    }

    if (user.id === message.author.id) {
      const selfEmbed = errorEmbed(message).setDescription(
        "You cannot add yourself as an admin.",
      );

      return await message.reply({ embeds: [selfEmbed] });
    }

    const adminsData = await getAdminsAll(message.author.id, message.guild.id);

    if (adminsData.every((e) => e.includes(user.id))) {
      const alreadyAdminEmbed = errorEmbed(message).setDescription(
        "This user is already an admin.",
      );

      return await message.reply({ embeds: [alreadyAdminEmbed] });
    }

    await addAdminAll(message.author.id, message.guild.id, user.id);

    const botInfoAll = await getBotInfoAll(message.author.id, message.guild.id, true);

    const botChanged = botInfoAll.filter((e) =>
      e.admins.includes(user.id),
    ).length;
    const botNotChanged = botInfoAll.filter(
      (e) => e.admins.includes(user.id) === false,
    ).length;

    const description = botInfoAll.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${
        e.admins.includes(user.id) ? "✅" : "❌"
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
