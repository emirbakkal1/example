const { Message, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const {
  convert,
  CustomEmbedBuilder,
  errorEmbed,
} = require("../../utils/functions");

module.exports = {
  data: {
    name: "queue",
    description: "Show the queue",
    aliases: ["q"],
  },
  musicCommand: true,
  memberVoice: true,
  botVoice: true,
  sameVoice: true,
  /**
   *
   * @param {Message} message
   */
  async execute(message, args) {
    const player = message.client.moon.players.get(message.guild.id);

    if (!player) {
      if (!message.client.embed)
        return message.reply("I am not playing any music");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    if (player.queue.size < 1) {
      if (!message.client.embed) return message.reply("The queue is empty");
      return message.reply({
        embeds: [errorEmbed(message).setDescription("The queue is empty")],
      });
    }

    const allQueue = player.queue.getQueue();

    const queueSongs = allQueue.map(
      (song, i) =>
        `${`**${i + 1}.**`} [${song.title}](${song.url}) (${convert(song.duration)}) - <@${song.requester}>`,
    );
    const n = allQueue.length / 20;
    const embeds = [];

    for (let i = 0; n > i; i++) {
      const queueEmbed = new CustomEmbedBuilder(message.client)
        .setColor()
        .setTitle(`${message.guild.name}'s Queue [${i + 1}/${Math.ceil(n)}]`)
        .setDescription(queueSongs.slice(i * 20, (i + 1) * 20).join("\n"))
        .setFooter({
          text: `Commanded by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ size: 1024 }),
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
