const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");
const { updateSubscriptionModel } = require("../../lib/subscription");

module.exports = {
  data: {
    name: "changeowner",
    description: "Change the owner of the bot",
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
        "You cannot change the owner to a bot.",
      );

      return await message.reply({ embeds: [botEmbed] });
    }

    if (user.id === message.author.id) {
      const selfEmbed = errorEmbed(message).setDescription(
        "You cannot change the owner to yourself.",
      );

      return await message.reply({ embeds: [selfEmbed] });
    }

    await updateSubscriptionModel(message.client.user.id, user.id);

    const successEmbed = serverEmbed(message).setDescription(
      `Owner changed successfully to <@${user.id}>`,
    );

    return await message.reply({ embeds: [successEmbed] });
  },
};
