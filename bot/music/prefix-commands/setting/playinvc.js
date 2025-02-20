const { Message } = require("discord.js");
const { toggleVoiceChannelChat } = require("../../lib/info");
const { serverEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "playinvc",
    description: "Enable or disable voice channel chat music commands",
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const voiceChannelChat = await toggleVoiceChannelChat(
      message.client.user.id,
    );

    const successEmbed = serverEmbed(message)
      .setTitle("Voice Channel Chat")
      .setDescription(
        `Voice channel chat is now ${voiceChannelChat ? "enabled" : "disabled"}`,
      );

    return await message.reply({ embeds: [successEmbed] });
  },
};
