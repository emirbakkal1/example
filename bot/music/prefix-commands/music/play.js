const { Message } = require("discord.js");
const { errorEmbed, serverEmbed } = require("../../utils/functions");
const { getVoiceChannel } = require("../../lib/info");
module.exports = {
  data: {
    name: "play",
    description: "Play a song",
    aliases: ["p", "pl"],
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
    const voiceChannel = await getVoiceChannel(message.client.user.id);

    // check if bot can join the voice channel
    const memberVoiceChannel = message.member.voice.channel;
    if (memberVoiceChannel) {
      if (!memberVoiceChannel.joinable) {
        if (!message.client.embed)
          return await message.reply("I can't join your voice channel.");
        const joinErrorEmbed = errorEmbed(message).setDescription(
          "I can't join your voice channel.",
        );
        return await message.reply({ embeds: [joinErrorEmbed] });
      }
    }

    let player;

    if (message.client.moon.players.has(message.guild.id)) {
      player = message.client.moon.players.get(message.guild.id);
    } else {
      player = message.client.moon.players.create({
        guildId: message.guild.id,
        voiceChannel: voiceChannel
          ? voiceChannel
          : message.member.voice.channel.id,
        textChannel: message.channel.id,
        autoPlay: false,
        autoLeave: false,
        volume: 50,
      });
    }

    player.setTextChannel(message.channel.id);
    player.setVoiceChannel(
      voiceChannel ? voiceChannel : message.member.voice.channel.id,
    );

    if (!player.connected) {
      player.connect({
        setDeaf: true,
        setMute: false,
      });
    }

    if (!query) {
      // checking if the player already exists

      if (!message.client.embed)
        return await message.reply(
          "Please enter a song url or query to search.",
        );

      const queryEmbed = errorEmbed(message).setDescription(
        "Please enter a song url or query to search.",
      );

      return await message.reply({ embeds: [queryEmbed] });
    }

    const res = await message.client.moon.search({
      query,
      source: "youtube",
      requester: message.author.id,
    });

    if (res.loadType === "loadfailed") {
      if (!message.client.embed)
        return await message.reply(
          "Load failed - the system is not cooperating.",
        );

      const loadFailedEmbed = errorEmbed(message).setDescription(
        ":x: Load failed - the system is not cooperating.",
      );

      return await message.reply({ embeds: [loadFailedEmbed] });
    } else if (res.loadType === "empty") {
      if (!message.client.embed)
        return await message.reply("No matches found!");

      const emptyEmbed = errorEmbed(message).setDescription(
        ":x: No matches found!",
      );

      return await message.reply({ embeds: [emptyEmbed] });
    }

    if (res.loadType === "playlist") {
      const playlistEmbed = serverEmbed(message)
        .setTitle("Playlist")
        .setDescription(
          `Playlist added to the queue. [${res.playlistInfo.name} - ${res.tracks.length}](${query})`,
        );

      for (const track of res.tracks) {
        player.queue.add(track);
      }

      if (!message.client.embed)
        await message.reply(
          `Playlist added to the queue. [${res.playlistInfo.name} - ${res.tracks.length}]`,
        );
      else await message.reply({ embeds: [playlistEmbed] });
    } else {
      const songEmbed = serverEmbed(message)
        .setTitle("Song")
        .setDescription(
          `New song added to the queue. [${res.tracks[0].title}](${res.tracks[0].url}) `,
        );

      player.queue.add(res.tracks[0]);

      if (player.playing) {
        if (!message.client.embed)
          await message.reply(
            `New song added to the queue. [${res.tracks[0].title}]`,
          );
        else await message.reply({ embeds: [songEmbed] });
      }
    }

    if (!player.playing) {
      player.play();
    }
  },
};
