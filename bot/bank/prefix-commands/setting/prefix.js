const { Message, EmbedBuilder } = require("discord.js");
const config = require("../../config.json");
const { setPrefix, getCommandsChannel } = require("../../lib/info");
const { errorEmbed, serverEmbed } = require("../../utils/functions");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "prefix",
    description: "Set the bot's prefix",
    aliases: ["p"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    if (!args.length) {
      const commandChannel = await getCommandsChannel(message.client.user.id);
      if (commandChannel === null) {
        return await message.reply({
          embeds: [
            errorEmbed(message).setDescription(
              "Cannot turn off prefix without a command channel. Please set a command channel first.",
            ),
          ],
        });
      }
      const bot = await prisma.setting.findFirst({
        where: {
          token: {
            botId: message.client.user.id,
          },
        },
        select: {
          prefix: true,
        },
      });

      if (bot.prefix !== "") {
        const prefixOff = await setPrefix(message.client.user.id, "");

        return await message.reply({
          embeds: [serverEmbed(message).setDescription("Prefix turned off")],
        });
      }

      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(`Please provide a prefix to set`),
        ],
      });
    }

    const prefix = args.join(" ");

    const updatedPrefix = await setPrefix(message.client.user.id, prefix);
    return await message.react("✅");
  },
};
