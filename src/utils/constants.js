const COLOR = "#0099ff";
const ID_EXTRACT_REGEX = /\{(.*?)\}/g;
const SUPPORT_ROLE = "1215660630980300830";
const DISCORD_INVITATION =
  "https://discord.com/oauth2/authorize?permissions=8&scope=bot&client_id=";
const DISCORD_INVITES_ID = "https://discord.com/api/invites/";

const invitaionWithGuildLink = (botId, guildId) => {
  return `https://discord.com/api/oauth2/authorize?client_id=${botId}&guild_id=${guildId}&permissions=0&scope=bot`;
};

module.exports = {
  invitaionWithGuildLink,
  COLOR,
  ID_EXTRACT_REGEX,
  SUPPORT_ROLE,
  DISCORD_INVITATION,
  DISCORD_INVITES_ID,
};
