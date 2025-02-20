const { ActionRowBuilder, StringSelectMenuBuilder, CommandInteraction } = require('discord.js');
const { getSubscriptionsFromUser } = require('../../lib/subscriptions');
const { capitalize, interactionServerEmbed } = require('../../utils/functions');

module.exports = {
	name: 'controll-button',
	description: 'Send a setup interaction to manage the bot.',

	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @returns
	 */
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subscriptions = await getSubscriptionsFromUser(interaction.user);

        if (!subscriptions.length) {
          return await interaction.editReply({
            embeds: [
              interactionServerEmbed(interaction, interaction.client.user).setDescription(
                "You don't have any subscriptions.",
              ).setColor("#colorHexCode"),
            ],
          });
        }
    
        const manageBot = new StringSelectMenuBuilder()
          .setCustomId("select-manage-bot")
          .setPlaceholder("Choose a option")
          .addOptions([
            {
              label: "Transfer ownership",
              value: "transfer-ownership",
            },
            {
              label: "Add Admin",
              value: "add-admin",
            },
            {
              label: "Remove Admin",
              value: "remove-admin",
            },
            {
              label: "Show Admins",
              value: "show-admins",
            },
            {
              label: "Restart bot",
              value: "restart-bot",
            },
            {
              label: "Change Server",
              value: "change-server",
            },
            {
              label: "Invitation",
              value: "invitation",
            },
            {
              label: "Subscription",
              value: "subscription",
            },
          ]);
    
        const row = new ActionRowBuilder().addComponents(manageBot);
    
        const embed = interactionServerEmbed(interaction, interaction.client.user)
          .setTitle("Subscriptions Setup")
          .setDescription("Choose an option to manage your subscriptions.");
    
        return await interaction.editReply({ embeds: [embed], components: [row] });
      },
};
