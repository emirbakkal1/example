const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const { prisma } = require("../../../../src/database/db");
const { errorEmbed } = require("../../utils/functions");

// Load configuration
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));

// Function to format duration
const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let formattedDuration = '';
    if (days > 0) formattedDuration += `${days} days `;
    if (hours > 0) formattedDuration += `${hours} hours `;
    if (minutes > 0) formattedDuration += `${minutes} minutes `;
    if (seconds > 0) formattedDuration += `${seconds} seconds`;
    return formattedDuration.trim();
};

module.exports = {
    data: {
        name: "protection",
        description: "Protect your money from getting stolen.",
    },
    async execute(message) {
        const userId = message.author.id;
        const guildId = message.guild.id;

        // Fetch the user
        const user = await prisma.user.findUnique({
            where: { id_guildId: { id: userId, guildId } }
        });

        if (!user) {
            const userNotFoundEmbed = errorEmbed(message).setDescription(
                "You are not registered in the system."
            );
            return await message.reply({ embeds: [userNotFoundEmbed] });
        }

        const cooldown = config.commandCooldowns.protection; // Get cooldown from config

        // Check if the user is on cooldown
        if (user.cooldowns.protection && Date.now() < user.cooldowns.protection) {
            const cooldownRemaining = user.cooldowns.protection - Date.now();
            const formattedCooldown = formatDuration(cooldownRemaining);
  
            return await message.reply(`You need to wait ${formattedCooldown} before using this command again.`);
        }

        // Check if the user already has protection
        if (user.protectionExpiry && user.protectionExpiry > Date.now()) {
            const alreadyProtectedEmbed = errorEmbed(message).setDescription(
                "You already have active protection."
            );
            return await message.reply({ embeds: [alreadyProtectedEmbed] });
        }

        // Create the selection menu for protection times
        const timeSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('protectionTimeSelect')
            .setPlaceholder('Select a protection time period')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('1 hour').setValue('1h').setDescription('Protect for 1 hour - 100,000$'),
                new StringSelectMenuOptionBuilder().setLabel('2 hours').setValue('2h').setDescription('Protect for 2 hours - 200,000$'),
                new StringSelectMenuOptionBuilder().setLabel('3 hours').setValue('3h').setDescription('Protect for 3 hours - 300,000$'),
                new StringSelectMenuOptionBuilder().setLabel('4 hours').setValue('4h').setDescription('Protect for 4 hours - 400,000$'),
                new StringSelectMenuOptionBuilder().setLabel('5 hours').setValue('5h').setDescription('Protect for 5 hours - 500,000$')
            );

        const actionRow = new ActionRowBuilder().addComponents(timeSelectMenu);

        const protectionPromptEmbed = new EmbedBuilder()
            .setTitle("Select Protection Time")
            .setDescription("Please select the protection time period from the dropdown menu.")
            .setColor('#5865F2');

        const protectionMessage = await message.reply({ embeds: [protectionPromptEmbed], components: [actionRow] });

        await prisma.user.update({
            where: { id_guildId: { id: userId, guildId } },
            data: {
                cooldowns: {
                    ...user.cooldowns,
                    protection: Date.now() + cooldown // Set cooldown based on config
                }
            },
        });

        // Set up a collector to handle the selection menu interaction
        const filter = interaction => {
            if (interaction.customId === 'protectionTimeSelect') {
                if (interaction.user.id === userId) {
                    return true;
                } else {
                    interaction.reply({ content: `Only <@${userId}> can use this command.`, ephemeral: true });
                    return false;
                }
            }
            return false;
        };

        const collector = protectionMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timeout

        collector.on('collect', async interaction => {
            // Ensure proper interaction acknowledgment

            const timePeriod = interaction.values[0];
            const timeMap = {
                "1h": 100000,
                "2h": 200000,
                "3h": 300000,
                "4h": 400000,
                "5h": 500000
            };

            const price = timeMap[timePeriod];
            if (price === undefined) {
                const invalidTimeEmbed = errorEmbed(message).setDescription(
                    "An error occurred while processing the protection time period."
                );
                return await interaction.reply({ embeds: [invalidTimeEmbed], ephemeral: true });
            }

            // Check if the user has enough balance
            if (user.balance < price) {
                const insufficientFundsEmbed = errorEmbed(message).setDescription(
                    "You do not have enough balance to purchase this protection."
                );
                return await interaction.reply({ embeds: [insufficientFundsEmbed], ephemeral: true });
            }

            // Calculate protection expiry time
            const protectionExpiry = Date.now() + (parseInt(timePeriod) * 60 * 60 * 1000);

            // Update the user's balance and protection details

            await prisma.user.update({
                where: { id_guildId: { id: userId, guildId } },
                data: {
                    balance: { decrement: price },
                    protectionExpiry: protectionExpiry
                }
            });

            const protectionSuccessEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Protection Purchased!')
                .setDescription(`You have purchased protection for ${timePeriod}. You are now protected from looting until <t:${Math.floor(protectionExpiry / 1000)}:f>.`)
                .setTimestamp();

            await interaction.update({ embeds: [protectionSuccessEmbed], components: [] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                // Notify the user if no response was given in time
                protectionMessage.edit({
                    embeds: [protectionPromptEmbed.setDescription("You did not select a protection time period in time.")],
                    components: []
                });
            }
        });
    },
};