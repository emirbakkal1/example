const {
  Message,
  bold,
  hyperlink,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { invitaionWithGuildLink } = require("../../utils/constants");
const { getBotAll, getBotInfoAll } = require("../../lib/setting");
const { getBotInfoByLogin, serverEmbed } = require("../../utils/functions");
const { determineRespondingBot } = require("../../lib/master");

module.exports = {
  data: {
    name: "linksall",
    description: "Sends all invite links each bot",
    aliases: ["lka"],
  },
  ownerOnly: true,
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
    if (!isMaster) return;

    const botAll = await getBotInfoAll(
      message.author.id,
      message.guild.id,
      true,
    );

    console.log(botAll);

    const invitations = botAll.map(async (bot, index) => {
      const botInfo = await getBotInfoByLogin(bot.token.token);
      const serverInfo = message.client.guilds.cache.get(bot.guildId);
      return `${index + 1}. ${hyperlink(`${botInfo.username}#${botInfo.discriminator}`, invitaionWithGuildLink(bot.token.botId, bot.guildId))}  | ${serverInfo ? serverInfo.name : bot.guildName} ${bot.inGuild ? "🟢" : "🔴"}`;
    });

    const awaitInvitations = await Promise.all(invitations);

    const outSideBot = botAll.filter((bot) => !bot.inGuild).length;
    const inSideBot = botAll.filter((bot) => bot.inGuild).length;

    const n = awaitInvitations.length / 20;
    const embeds = [];

    for (let i = 0; n > i; i++) {
      const queueEmbed = serverEmbed(message)
        .setTitle("Invitations")
        .setDescription(
          `${bold(`All Bot: ${botAll.length}\noutside bots: ${outSideBot}\ninside bots: ${inSideBot}`)}\n${awaitInvitations.slice(i * 20, (i + 1) * 20).join("\n-\n")}`,
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
    } = require("../../utils/components");
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
  },
};
