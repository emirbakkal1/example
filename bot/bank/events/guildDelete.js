const { Events, Guild } = require("discord.js");
const { setIsInGuildByBotId } = require("../lib/master");

module.exports = {
  name: Events.GuildDelete,
  on: true,

  /**
   * @param {Guild} guild
   */
  async execute(guild) {
    await setIsInGuildByBotId(guild.client.user.id, false, guild.name);
  },
};
