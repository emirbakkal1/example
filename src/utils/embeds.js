const { EmbedBuilder } = require('discord.js');
const { capitalize } = require('./functions');
const prettyMilliseconds = require('pretty-ms');

const getSubscriptionsEmbed = (subscriptions) => {
	const embed = new EmbedBuilder()
		.setTitle('✅ Subscriptions')
		.setColor('#4455ff')
		.setFields(
			subscriptions.map((subscription) => {
				const expirationTime = subscription.expired
					? 'Expired'
					: prettyMilliseconds(Number(subscription.subscriptionDuration) - Date.now());

				const validUntil = new Date(Number(subscription.expirationTime ?? subscription.subscriptionDuration)).toLocaleDateString();

				return {
					name: `\n${subscription.expired ? '🔴' : '🟢'} ${capitalize(subscription.botType)} x${
						subscription.botAmount
					} | \`(SubID : ${subscription.subId})\` | \`${expirationTime}\` `,
					value: `Bots: ${
						subscription.botType === 'music' ? `${capitalize(subscription.botType)} x${subscription.botAmount}\n` : ''
					}\nGuild: \`${subscription.guildId}\`\nValid until: \`${validUntil}\`\n`,
				};
			})
		)
		.setTimestamp();

	return embed;
};

module.exports = {
	getSubscriptionsEmbed,
};
