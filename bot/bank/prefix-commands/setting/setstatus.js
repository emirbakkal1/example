const {
  Message,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  codeBlock,
  ComponentType,
} = require("discord.js");
const { updateActivity, updateStatus } = require("../../lib/info");
const { serverEmbed, errorEmbed } = require("../../utils/functions");

module.exports = {
  data: {
    name: "setstatus",
    description: "Set the bot's status",
    aliases: ["ssu"],
  },
  adminOnly: true,
  /**
   * @param {Message} message
   * @param {Array<String>} args
   */
  async execute(message, args) {
    const options = [
      { label: "Online", value: "online", emoji: "🟢" },
      { label: "Idle", value: "idle", emoji: "🟡" },
      { label: "Do Not Disturb", value: "dnd", emoji: "🔴" },
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId("select-status-type")
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
