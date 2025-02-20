const {
  Message,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  codeBlock,
  ComponentType,
} = require("discord.js");
const {
  updateActivity,
  getActivity,
  deleteActivity,
} = require("../../lib/info");
const { serverEmbed, errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "setgame",
    description: "Set the bot's game",
    aliases: ["sg"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    if (!args.length) {
      const getGame = await getActivity(message.client.user.id);

      if (getGame.activity && getGame.activityType) {
        const embed = serverEmbed(message).setDescription("Activy turned off");

        message.client.user.setActivity(undefined);

        await deleteActivity(message.client.user.id);

        return await message.reply({ embeds: [embed] });
      }

      const error = errorEmbed(message).setDescription(
        codeBlock("diff", "Please provide a text."),
      );

      return await message.reply({ embeds: [error] });
    }
    const activity = args.join(" ");

    const options = [
      { label: "Playing", value: "Playing", emoji: "🎮" },
      { label: "Listening", value: "Listening", emoji: "🎧" },
      { label: "Watching", value: "Watching", emoji: "🎥" },
      { label: "Streaming", value: "Streaming", emoji: "📡" },
      { label: "Competing", value: "Competing", emoji: "🏆" },
      { label: "Custom", value: "Custom", emoji: "🔧" },
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId("select-activity-type")
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

    await updateActivity(message.client.user.id, activity, null);

    const reply = await message.reply({
      embeds: [embed],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on("collect", async (interection) => {
      await updateActivity(message.client.user.id, activity, null);
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
