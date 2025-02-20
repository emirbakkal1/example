const { ButtonBuilder, ActionRowBuilder, bold } = require("discord.js");
const { serverEmbed } = require("./functions");

const pagingEmbed = async (
  botInfos,
  message,
  size,
  title,
  botChanged,
  botNotChanged,
) => {
  size = size || 20;
  title = title || "Bot List";
  const n = botInfos.length / size;
  const embeds = [];

  for (let i = 0; n > i; i++) {
    const queueEmbed = serverEmbed(message)
      .setTitle(title)
      .setDescription(
        `${bold(`All Bot: ${botInfos.length}${botChanged ? `\nBots Changed: ${botChanged}` : ""}${botNotChanged ? `\nBots not Changed: ${botNotChanged}` : ""}`)}\n${botInfos.slice(i * size, (i + 1) * size).join("\n-\n")}`,
      )
      .setFooter({
        text: `page ${i + 1}/${Math.ceil(n)}`,
      });

    embeds.push(queueEmbed);
  }

  const {
    paginationStartButton,
    paginationBackButton,
    paginationForwardButton,
    paginationEndButton,
  } = require("../utils/components");
  const startButton = ButtonBuilder.from(paginationStartButton);
  const backButton = ButtonBuilder.from(paginationBackButton);
  const forwardButton = ButtonBuilder.from(paginationForwardButton);
  const endButton = ButtonBuilder.from(paginationEndButton);

  let group = new ActionRowBuilder().addComponents([
    startButton.setDisabled(true),
    backButton.setDisabled(true),
    forwardButton.setDisabled(true),
    endButton.setDisabled(true),
  ]);
  if (embeds.length > 1)
    group = new ActionRowBuilder().addComponents([
      startButton.setDisabled(true),
      backButton.setDisabled(true),
      forwardButton.setDisabled(false),
      endButton.setDisabled(false),
    ]);

  const reply = await message.reply({
    embeds: [embeds[0]],
    components: [group],
  });

  const collector = reply.createMessageComponentCollector({ time: 60000 });

  let currentPage = 0;

  collector.on("collect", async (int) => {
    if (
      !(
        int.channel.permissionsFor(int.member).has("ManageMessages") &&
        int.customId === "messageDelete"
      ) &&
      int.member.id !== message.member.id
    )
      return await int.reply({
        content: `This button is only works for ${message.user.tag}`,
        ephemeral: true,
      });

    if (int.customId !== "messageDelete") await collector.resetTimer();

    if (int.customId === "start") {
      currentPage = 0;
      group = new ActionRowBuilder().addComponents([
        startButton.setDisabled(true),
        backButton.setDisabled(true),
        forwardButton.setDisabled(false),
        endButton.setDisabled(false),
      ]);
      int.update({ embeds: [embeds[currentPage]], components: [group] });
    } else if (int.customId === "back") {
      --currentPage;
      if (currentPage === 0) {
        group = new ActionRowBuilder().addComponents([
          startButton.setDisabled(true),
          backButton.setDisabled(true),
          forwardButton.setDisabled(false),
          endButton.setDisabled(false),
        ]);
      } else {
        group = new ActionRowBuilder().addComponents([
          startButton.setDisabled(false),
          backButton.setDisabled(false),
          forwardButton.setDisabled(false),
          endButton.setDisabled(false),
        ]);
      }
      int.update({ embeds: [embeds[currentPage]], components: [group] });
    } else if (int.customId === "messageDelete") {
      await int.deferUpdate();
      await int.deleteReply().catch(() => null);
      await message.delete().catch(() => null);
    } else if (int.customId === "forward") {
      currentPage++;
      if (currentPage === embeds.length - 1) {
        group = new ActionRowBuilder().addComponents([
          startButton.setDisabled(false),
          backButton.setDisabled(false),
          forwardButton.setDisabled(true),
          endButton.setDisabled(true),
        ]);
      } else {
        group = new ActionRowBuilder().addComponents([
          startButton.setDisabled(false),
          backButton.setDisabled(false),
          forwardButton.setDisabled(false),
          endButton.setDisabled(false),
        ]);
      }
      int.update({ embeds: [embeds[currentPage]], components: [group] });
    } else if (int.customId === "end") {
      currentPage = embeds.length - 1;
      group = new ActionRowBuilder().addComponents([
        startButton.setDisabled(false),
        backButton.setDisabled(false),
        forwardButton.setDisabled(true),
        endButton.setDisabled(true),
      ]);
      int.update({ embeds: [embeds[currentPage]], components: [group] });
    }
  });

  collector.on("end", async (collected, reason) => {
    if (["messageDelete", "messageDeleteBulk"].includes(reason)) return;
    return await reply.edit({
      components: [
        new ActionRowBuilder().addComponents(
          startButton.setDisabled(true),
          backButton.setDisabled(true),
          forwardButton.setDisabled(true),
          endButton.setDisabled(true),
        ),
      ],
    });
  });
};

module.exports = pagingEmbed;
