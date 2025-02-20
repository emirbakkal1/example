const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.registerSlashCommands();
		client.user.setActivity({ name: 'Bots for sale!', type: ActivityType.Custom });
		logger.info(`Ready! Logged in as ${client.user.tag}`);
	},
};
