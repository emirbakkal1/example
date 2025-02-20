const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) return;

		const prefix = '!';

		if (!message.content.startsWith(prefix) || message.author.bot) return;
		const args = message.content.slice(prefix.length).split(/ +/);
		const cmd = args.shift().toLowerCase();

		const command = message.client.commands.get(cmd);
		if (!command) return;

		try {
			await command.execute(message, args);
		} catch (err) {
			message.reply({ content: 'there was an error executing this command', ephemeral: true });
			logger.error(err);
		}
	},
};
