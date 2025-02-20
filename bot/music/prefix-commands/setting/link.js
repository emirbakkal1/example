const {
  Message,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { getToken } = require("../../lib/info");
const { serverEmbed } = require("../../utils/functions");
const { invitaionWithGuildLink } = require("../../utils/constants");

module.exports = {
  data: {
    name: "link",
    description: "Sends invite link bot",
    aliases: ["lk"],
  },
  ownerOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const token = await getToken(message.client.user.id);

    const invitationsButton = new ButtonBuilder()
      .setURL(invitaionWithGuildLink(token.botId, token.setting.guildId))
      .setLabel("Invitations")
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(invitationsButton);

    const embed = serverEmbed(message)
      .setTitle("Invitations")
      .setDescription(`• \`${token.botName}\``);

    return await message.reply({ embeds: [embed], components: [row] });
  },
};
