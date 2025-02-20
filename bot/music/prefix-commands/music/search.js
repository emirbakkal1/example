const {
  Message,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");
const { getCommandsChannel, getVoiceChannel } = require("../../lib/info");

module.exports = {
  data: {
    name: "search",
    description: "Search in Youtube",
    aliases: ["s"],
  },
  musicCommand: true,
  memberVoice: true,
  botVoice: false,
  sameVoice: true,
  /**
   *
   * @param {Message} message
   */
  async execute(message, args) {
    const query = args.join(" ");

    if (!query) {
      return await message.reply({
        embeds: [errorEmbed(message).setDescription("Please provide a query")],
      });
    }

    let res = await message.client.moon.search({
      query,
      source: "youtube",
      requester: message.author.id,
    });

    if (res.loadType === "loadfailed") {
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            ":x: Load failed - the system is not cooperating.",
          ),
        ],
      });
    } else if (res.loadType === "empty") {
      return await message.reply({
        embeds: [errorEmbed(message).setDescription(":x: No matches found!")],
      });
    }

    const tracks = res.tracks.slice(0, 5);
    const trackList = tracks
      .map((track, index) => `${index + 1}. [${track.title}](${track.url})`)
      .join("\n");

    const number1Button = new ButtonBuilder()
      .setCustomId("1")
      .setEmoji("1️⃣")
      .setStyle(ButtonStyle.Secondary);

    const number2Button = new ButtonBuilder()
      .setCustomId("2")
      .setEmoji("2️⃣")
      .setStyle(ButtonStyle.Secondary);

    const number3Button = new ButtonBuilder()
      .setCustomId("3")
      .setEmoji("3️⃣")
      .setStyle(ButtonStyle.Secondary);

    const number4Button = new ButtonBuilder()
      .setCustomId("4")
      .setEmoji("4️⃣")
      .setStyle(ButtonStyle.Secondary);

    const number5Button = new ButtonBuilder()
      .setCustomId("5")
      .setEmoji("5️⃣")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents([
      number1Button,
      number2Button,
      number3Button,
      number4Button,
      number5Button,
    ]);

    const searchEmbed = serverEmbed(message)
      .setTitle("Search")
      .setDescription(trackList);

    const reply = await message.reply({
      embeds: [searchEmbed],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 1000 * 30,
    });

    collector.on("collect", async (interaction) => {
      const track = tracks[Number(interaction.customId) - 1];

      const textChannel = await getCommandsChannel(message.client.user.id);
      const voiceChannel = await getVoiceChannel(message.client.user.id);

      let player;

      if (message.client.moon.players.has(message.guild.id)) {
        player = message.client.moon.players.get(message.guild.id);
      } else {
        player = message.client.moon.players.create({
          guildId: message.guild.id,
          voiceChannel: voiceChannel
            ? voiceChannel
            : message.member.voice.channel.id,
          textChannel: textChannel ? textChannel : message.channel.id,
          autoPlay: false,
          autoLeave: false,
          volume: 50,
        });
      }

      player.setTextChannel(textChannel ? textChannel : message.channel.id);

      if (!player.connected) {
        player.connect({
          setDeaf: true,
          setMute: false,
        });
      }

      player.queue.add(track);

      if (!message.client.embed) {
        await interaction.reply(
          `New song added to the queue. [${track.title}]`,
        );
      } else {
        await interaction.reply({
          embeds: [
            serverEmbed(message)
              .setTitle("Song")
              .setDescription(
                `New song added to the queue. [${track.title}](${track.url}) `,
              ),
          ],
        });
      }

      if (!player.playing) {
        player.play();
      }

      collector.stop();
      reply.delete();
    });

    collector.on("end", async (collection, reason) => {
      if (["messageDelete", "messageDeleteBulk"].includes(reason)) return;
      await reply
        .edit({
          components: [
            new ActionRowBuilder().addComponents([
              number1Button.setDisabled(true),
              number2Button.setDisabled(true),
              number3Button.setDisabled(true),
              number4Button.setDisabled(true),
              number5Button.setDisabled(true),
            ]),
          ],
        })
        .catch(() => null);
    });
  },
};
