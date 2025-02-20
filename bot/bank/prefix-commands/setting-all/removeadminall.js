const { Message } = require("discord.js");
const { errorEmbed } = require("../../utils/functions");
const {
  removeAdminAll,
  getAdminsAll,
  getBotInfoAll,
} = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");

module.exports = {
  data: {
    name: "removeadminall",
    description: "Remove admin to all bots",
    aliases: ["raa"],
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
        "You cannot remove a bot as an admin.",
      );

      return await message.reply({ embeds: [botEmbed] });
    }

    if (user.id === message.author.id) {
      const selfEmbed = errorEmbed(message).setDescription(
        "You cannot remove yourself as an admin.",
      );

      return await message.reply({ embeds: [selfEmbed] });
    }

    const adminsData = await getAdminsAll(
      message.author.id,
      message.guild.id,
      true,
    );

    if (adminsData.every((e) => !e.includes(user.id))) {
      const notAdminEmbed = errorEmbed(message).setDescription(
        "This user is not an admin.",
      );

      return await message.reply({ embeds: [notAdminEmbed] });
    }

    await removeAdminAll(message.author.id, message.guild.id, user.id);

    const botInfoAll = await getBotInfoAll(
      message.author.id,
      message.guild.id,
      true,
    );

    const botChanged = botInfoAll.filter(
      (e) => e.admins.includes(user.id) === false,
    ).length;
    const botNotChanged = botInfoAll.filter((e) =>
      e.admins.includes(user.id),
    ).length;

    const description = botInfoAll.map((e, i) => {
      return `${i + 1}. <@${e.token.botId}> - ${
        !e.admins.includes(user.id) ? "✅" : "❌"
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
