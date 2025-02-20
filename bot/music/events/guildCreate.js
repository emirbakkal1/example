const { Events, Guild } = require("discord.js");
const { getServer } = require("../lib/info");
const { setIsInGuildByBotId } = require("../lib/master");

module.exports = {
  name: Events.GuildCreate,
  on: true,

  /**
   * @param {Guild} guild
   */
  async execute(guild) {
    const serverId = await getServer(guild.client.user.id);

    if (serverId === guild.id) {
      await setIsInGuildByBotId(guild.client.user.id, true, guild.name);
    }

    if (guild.id !== serverId) {
      setTimeout(() => {
        guild.leave();
      }, 5000);
    }
  },
};
