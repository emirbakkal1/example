const { Message } = require("discord.js");
const { serverEmbed } = require("../../utils/functions");
const { getSettingFromBotId } = require("../../lib/setting");

module.exports = {
  data: {
    name: "setting",
    description: "Display bot settings",
    aliases: ["sett"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const setting = await getSettingFromBotId(message.client.user.id);

    const description = `**Subscription ID :** \`${setting.token.subscription.subId}\`
**Subscription Owner :** <@${setting.token.subscription.customerId}>
**Prefix :** \`${setting.prefix || "Not Set"}\`
**Voice Channel :** ${setting.voiceChannelId ? `<#${setting.voiceChannelId}>` : `\`Not Set\``}
**Text Channel :** ${setting.commandsChannelId ? `<#${setting.commandsChannelId}>` : `\`Not Set\``}
**Voice Channel Chat :** \`${setting.voiceChannelChat ? "ON" : "OFF"}\`
**Embed :** \`${setting.embed ? "ON" : "OFF"}\`
**Embed Color :** ${setting.embedColor ? `\`${setting.embedColor}\`` : `\`Not Set\``}
**Buttons :** \`${setting.buttons ? "ON" : "OFF"}\``;

    const settingEmbed = serverEmbed(message)
      .setTitle("Settings")
      .setDescription(description);

    return await message.reply({ embeds: [settingEmbed] });
  },
};
