const { Message } = require("discord.js");
const { getAdmins } = require("../../lib/info");
const { errorEmbed, serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "showadmin",
    description: "Show the admins of the bot",
  },
  ownerOnly: true,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   *
   */
  async execute(message) {
    const adminsData = await getAdmins(message.client.user.id);

    if (!adminsData.length) {
      const noAdminsEmbed =
        errorEmbed(message).setDescription("No admins found.");
      return await message.reply({ embeds: [noAdminsEmbed] });
    }

    const admins = adminsData
      .map((admin, i) => `${i + 1} - <@${admin}>`)
      .join("\n");

    const successEmbed = serverEmbed(message)
      .setTitle("Admins list")
      .setDescription(admins);

    return await message.reply({ embeds: [successEmbed] });
  },
};
