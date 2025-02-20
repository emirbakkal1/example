const { Message } = require("discord.js");
const { addAdmin, getAdmins } = require("../../lib/info");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "addadmin",
    description: "Add an admin to the bot",
  },
  ownerOnly: true,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message, args) {
    if (!args[0]) {
      const noArgsEmbed = errorEmbed(message).setDescription(
        "Please provide a user.",
      );

      return await message.reply({ embeds: [noArgsEmbed] });
    }

    const user = await message.client.users
      .fetch(args[0].replace("<@", "").replace(">", ""))
      .catch((_e) => null);

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

    const adminsData = await getAdmins(message.client.user.id);

    if (adminsData.includes(user.id)) {
      const alreadyAdminEmbed = errorEmbed(message).setDescription(
        "This user is already an admin.",
      );

      return await message.reply({ embeds: [alreadyAdminEmbed] });
    }

    const id = await addAdmin(message.client.user.id, user.id);

    if (!id) {
      const error = errorEmbed(message).setDescription(
        "An error occurred while adding the admin.",
      );

      return await message.reply({ embeds: [error] });
    }

    const successEmbed = serverEmbed(message)
      .setTitle("Added Adminbot")
      .setDescription(`Admin added <@${user.id}>`);

    return await message.reply({ embeds: [successEmbed] });
  },
};
