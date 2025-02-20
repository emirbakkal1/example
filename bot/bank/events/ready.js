const { Events, ActivityType, Client } = require("discord.js");
const {
  getEmbedColor,
  getActivity,
  getServer,
  getStatus,
  getVoiceChannel,
  getEmbed,
} = require("../lib/info");
const { joinVoiceChannel } = require("@discordjs/voice");
const { setIsInGuildByBotId } = require("../lib/master");
const { saveProcess } = require("../lib/botProcess");

module.exports = {
  name: Events.ClientReady,
  once: true,

  /**
   * @param {Client} client
   */
  async execute(client) {
    const embedColor = await getEmbedColor(client.user.id);
    const embed = await getEmbed(client.user.id);
    const serverId = await getServer(client.user.id);
    const voiceChannel = await getVoiceChannel(client.user.id);

    client.embedColor = embedColor.embedColor;
    client.embed = embed;

    const game = await getActivity(client.user.id);
    const status = await getStatus(client.user.id);

    if (game.activity && game.activityType) {
      client.user.setActivity({
        name: game.activity,
        type: ActivityType[game.activityType],
        url:
          ActivityType[game.activityType] === ActivityType.Streaming
            ? `https://twitch.tv/${game.activity}`
            : null,
      });
    }
    client.user.setStatus(status);

    const guild = await client.guilds.fetch();
    for (const [key, value] of guild) {
      if (value.id === serverId) {
        await setIsInGuildByBotId(client.user.id, true);
      }
      if (value.id !== serverId) {
        const guildResolvable = client.guilds.resolve(value.id);
        await setIsInGuildByBotId(client.user.id, false);
        await guildResolvable.leave();
      }
    }

    if (voiceChannel) {
      const voiceJoin = joinVoiceChannel({
        channelId: voiceChannel,
        guildId: serverId,
        adapterCreator: client.guilds.cache.get(serverId).voiceAdapterCreator,
      });
    }

    saveProcess(client.user.id);
  },
};
