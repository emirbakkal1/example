const {
  Message,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  codeBlock,
  ActivityType,
} = require("discord.js");
const { updateActivityAll, getBotInfoAll } = require("../../lib/setting");
const { determineRespondingBot } = require("../../lib/master");
const pagingEmbed = require("../../utils/pagingEmbed");
const { serverEmbed, errorEmbed } = require("../../utils/functions");
const { prisma } = require("../../../../src/database/db");

module.exports = {
  data: {
    name: "setgameall",
    description: "Change the status of all bots",
    aliases: ["setga"],
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

    if (!args.length) {
      if (!isMaster) return;
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            codeBlock("diff", "Please provide a text."),
          ),
        ],
      });
    }

    if (args[0].toLowerCase() === "off") {
      setTimeout(() => {
        message.client.user.setActivity(null);
      }, 1000 * 30);
      if (!isMaster) return;
      await updateActivityAll(message.author.id, message.guild.id, null, null);

      const botInfoAll = await getBotInfoAll(
        message.author.id,
        message.guild.id,
      );

      const botChanged = botInfoAll.filter(
        (e) => e.activity === null && e.activityType === null,
      ).length;
      const botNotChanged = botInfoAll.filter(
        (e) => e.activity !== null && e.activityType !== null,
      ).length;

      const description = botInfoAll.map((e, i) => {
        return `${i + 1}. <@${e.token.botId}> - ${
          e.activity === null && e.activityType === null ? "✅" : "❌"
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
    }

    const activity = args.join(" ");

    if (!isMaster) {
      setTimeout(async () => {
        const setting = await prisma.setting.findFirst({
          where: {
            token: {
              botId: message.client.user.id,
            },
          },
          select: {
            activity: true,
            activityType: true,
          },
        });

        message.client.user.setActivity({
          name: setting.activity,
          type: ActivityType[setting.activityType],
          url:
            ActivityType[setting.activityType] === ActivityType.Streaming
              ? `https://twitch.tv/${setting.activity}`
              : null,
        });
        console.log("Activity changed to", setting.activity);
      }, 1000 * 70);
    }

    if (!isMaster) return;

    const options = [
      { label: "Playing", value: "Playing", emoji: "🎮" },
      { label: "Listening", value: "Listening", emoji: "🎧" },
      { label: "Watching", value: "Watching", emoji: "🎥" },
      { label: "Streaming", value: "Streaming", emoji: "📡" },
      { label: "Competing", value: "Competing", emoji: "🏆" },
      { label: "Custom", value: "Custom", emoji: "🔧" },
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId("select-activity-type-all")
      .setPlaceholder("Select the activity type")
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
      "Please select the activity type.",
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
