const {
  Message,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  updateServer,
  getToken,
  deleteCommandsChannel,
  deleteVoiceChannel,
} = require("../../lib/info");
const {
  getGuildIdFromLink,
  serverEmbed,
  errorEmbed,
} = require("../../utils/functions");
const { DISCORD_INVITATION } = require("../../utils/constants");

module.exports = {
  data: {
    name: "setserver",
    description: "To change the server of bot",
    aliases: ["ss"],
  },
  ownerOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    if (!args.length) {
      const noArgsEmbed = errorEmbed(message).setDescription(
        "Please provide a server",
      );
      return await message.reply({ embeds: [noArgsEmbed] });
    }

    const server = await getGuildIdFromLink(args[0]);

    console.log(server);

    if (!server) {
      const invalidServerEmbed = errorEmbed(message).setDescription(
        "Please provide a valid server",
      );

      return await message.reply({ embeds: [invalidServerEmbed] });
    }

    if (server.id === message.guild.id) {
      const sameServerEmbed = errorEmbed(message).setDescription(
        "The server is already the same",
      );

      return await message.reply({ embeds: [sameServerEmbed] });
    }

    const updatedServer = await updateServer(
      message.client.user.id,
      server.id,
      server.name,
    );

    if (!updatedServer) {
      const error = errorEmbed(message).setDescription(
        "An error occurred while changing the server",
      );

      return await message.reply({ embeds: [error] });
    }

    await deleteCommandsChannel(message.client.user.id);
    await deleteVoiceChannel(message.client.user.id);

    const successEmbed = serverEmbed(message)
      .setDescription(`Server has been changed to ${server.name}`)
      .setTitle("Change Server");

    const token = await getToken(message.client.user.id);
    const invitations = `https://discord.com/api/oauth2/authorize?client_id=${token.botId}&guild_id=${server.id}&permissions=0&scope=bot`;

    const invitationsButton = new ButtonBuilder()
      .setURL(invitations)
      .setLabel("Invitations")
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(invitationsButton);

    await message.reply({ components: [row], embeds: [successEmbed] });

    return await message.guild.leave();
  },
};
