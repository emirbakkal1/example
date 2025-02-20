const { Events, VoiceState } = require("discord.js");
const { getVoiceChannel } = require("../lib/info");
const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  name: Events.VoiceStateUpdate,
  on: true,

  /**
   * @param {VoiceState} oldState
   * @param {VoiceState} newState
   */
  async execute(oldState, newState) {
    const player = newState.client.moon.players.get(newState.guild.id);
    const voiceChannel = await getVoiceChannel(newState.client.user.id);

    const members = player?.playing
      ? newState.guild.channels.cache.get(player.voiceChannel)?.members.size
      : newState.channel?.members.size;

    if (members) {
      if (members < 2 && voiceChannel === null) {
        if (!player) return;
        setTimeout(() => {
          const channel = newState.guild.channels.cache.get(
            player.voiceChannel,
          );
          const count = channel ? channel.members.size : 0;
          if (count === 1) {
            player.stop(true);
          }
        }, 1000 * 60);
      }
    }

    if (voiceChannel !== null && newState.channel?.id !== voiceChannel) {
      const voiceJoin = joinVoiceChannel({
        channelId: voiceChannel,
        guildId: newState.guild.id,
        adapterCreator: newState.guild.voiceAdapterCreator,
      });
    }
  },
};
