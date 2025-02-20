exports.COLOR = "#0099ff";
exports.ID_EXTRACT_REGEX = /\{(.*?)\}/g;
exports.SUPPORT_ROLE = "1215660630980300830";
exports.DISCORD_INVITATION =
  "https://discord.com/oauth2/authorize?permissions=8&scope=bot&client_id=";
exports.DISCORD_INVITATION_GUILD = "";
exports.DISCORD_INVITES_ID = "https://discord.com/api/invites/";

const invitaionWithGuildLink = (botId, guildId) => {
  return `https://discord.com/api/oauth2/authorize?client_id=${botId}&guild_id=${guildId}&permissions=0&scope=bot`;
};

module.exports = {
  invitaionWithGuildLink,
};
