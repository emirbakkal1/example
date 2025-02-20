const { logChannelId } = require("../config.json");

const sendLogMessage = async (interaction, embed) => {
  const logChannel = await interaction.guild.channels.fetch(logChannelId, {
    force: true,
  });

  if (logChannel) {
    logChannel.send({
      embeds: [embed],
    });
  }
};

module.exports = { sendLogMessage };
