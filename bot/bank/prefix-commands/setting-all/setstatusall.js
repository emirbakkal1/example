const {
  Message,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");
const { serverEmbed } = require("../../utils/functions");
const { determineRespondingBot } = require("../../lib/master");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "setstatusall",
    description: "Set the bot's status",
    aliases: ["ssuall"],
  },
  adminOnly: true,
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

    if (!isMaster) {
      setTimeout(async () => {
        const setting = await prisma.setting.findFirst({
          where: {
            token: {
              botId: message.client.user.id,
            },
          },
          select: {
            status: true,
          },
        });

        message.client.user.setStatus(setting.status);
        console.log("Status changed to", setting.status);
      }, 1000 * 70);
    }

    if (!isMaster) return;

    const options = [
      { label: "Online", value: "online", emoji: "🟢" },
      { label: "Idle", value: "idle", emoji: "🟡" },
      { label: "Do Not Disturb", value: "dnd", emoji: "🔴" },
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId("select-status-type-all")
      .setPlaceholder("Select the status type")
      .addOptions(
        options.map((option) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(option.label)
            .setValue(option.value)
            .setEmoji(option.emoji),
        ),
      );

    const row = new ActionRowBuilder().addComponents(select);

    const embed = serverEmbed(message).setTitle(
      "Please select the Status type.",
    );

    const reply = await message.reply({
      embeds: [embed],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on("end", async (collection, reason) => {
      if (collection.size > 0) return;

      if (["messageDelete", "messageDeleteBulk"].includes(reason)) return;
      await reply
        .edit({
          components: [],
          embeds: [],
          content: "The selection time has expired, try again.",
        })
        .catch(() => null);
    });
  },
};
