const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { handleCanvasOrEmbed } = require('../../setupFunctions/handleCanvasOrEmbed');

module.exports = {
    data: {
        name: "setup",
        description: "Setup the bot settings"
    },
    async execute(message) {
        try {

            // Create the main selection menu for the !setup command
            const setupMenu = new StringSelectMenuBuilder()
                .setCustomId('setup_menu_select')
                .setPlaceholder('Choose a setup option')
                .addOptions([
                    {
                        label: 'Add a manager',
                        description: 'Add a manager to the bank',
                        value: 'add_manager',
                    },
                    {
                        label: 'Remove a manager',
                        description: 'Remove a manager from the bank',
                        value: 'remove_manager',
                    },
                    {
                        label: 'View managers',
                        description: 'View all managers of the bank',
                        value: 'view_managers',
                    },
                    {
                        label: 'Block a player',
                        description: 'Block a player from using bot commands',
                        value: 'block_player',
                    },
                    {
                        label: 'Allow a player',
                        description: 'Allow a blocked player to use bot commands',
                        value: 'allow_player',
                    },
                    {
                        label: 'View blocked players',
                        description: 'View all blocked players',
                        value: 'view_blocked_players',
                    },
                    {
                        label: 'Bank chat',
                        description: 'Specify the bank chat for bot commands',
                        value: 'bank_chat',
                    },
                    {
                        label: 'Canvas or Embed',
                        description: 'Activate bot replies as Canvas or Embed with color settings',
                        value: 'canvas_or_embed',
                    },
                    {
                        label: 'Activate or disable transfers',
                        description: 'Activate or deactivate the transfer command',
                        value: 'toggle_transfers',
                    },
                    // {
                    //     label: 'Change limits',
                    //     description: 'Change or view limits of specific commands',
                    //     value: 'change_limits',
                    // },
                    {
                        label: 'Clear bot data',
                        description: 'Clear player balances, marriages, or both',
                        value: 'clear_bot_data',
                    },
                    {
                        label: 'Clear player data',
                        description: 'Clear specific player data',
                        value: 'clear_player_data',
                    },
                ]);

            // Send the selection menu to the user
            const row = new ActionRowBuilder().addComponents(setupMenu);
            const interactionMessage = await message.channel.send({ content: 'Choose a setup option:', components: [row] });

            // Create a message collector to handle the user's choice
            const filter = i => i.customId === 'setup_menu_select' && i.user && i.user.id === message.author.id;
            const collector = interactionMessage.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 60000 });

            collector.on('collect', async i => {
                try {
                    const selection = i.values[0];

                    switch (selection) {
                        case 'add_manager':
                            await handleAddManager(i);
                            break;
                        case 'remove_manager':
                            await handleRemoveManager(i);
                            break;
                        case 'view_managers':
                            await handleViewManagers(i);
                            break;
                        case 'block_player':
                            await handleBlockPlayer(i);
                            break;
                        case 'allow_player':
                            await handleAllowPlayer(i);
                            break;
                        case 'view_blocked_players':
                            await handleViewBlockedPlayers(i);
                            break;
                        case 'bank_chat':
                            await handleBankChat(i);
                            break;
                        case 'canvas_or_embed':
                            await handleCanvasOrEmbed(i);
                            break;
                        case 'toggle_transfers':
                            await handleToggleTransfers(i);
                            break;
                        // case 'change_limits':
                        //     await handleChangeLimits(i);
                        //     break;
                        case 'clear_bot_data':
                            await handleClearBotData(i);
                            break;
                        case 'clear_player_data':
                            await handleClearPlayerData(i);
                            break;
                        default:
                            await i.update({ content: 'Invalid option selected.', components: [] });
                            break;
                    }
                } catch (error) {
                    console.error('Error during interaction collection:', error);
                    await i.update({ content: 'An error occurred while processing your selection.', components: [] });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interactionMessage.edit({ content: 'No selection made. Operation canceled.', components: [] });
                }
            });
        } catch (error) {
            console.error('Error during setup execution:', error);
            await message.channel.send('An error occurred while setting up the bot.');
        }
    }
};