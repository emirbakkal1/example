const { EmbedBuilder } = require('discord.js');
const { prisma } = require("../../../../src/database/db");
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('../bank/config.json', 'utf8'));

const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let formattedDuration = '';
    if (days > 0) formattedDuration += `${days} days `;
    if (hours > 0) formattedDuration += ` ${hours} hours `;
    if (minutes > 0) formattedDuration += ` ${minutes} minutes`;
    if (seconds > 0) formattedDuration += ` ${seconds} seconds`;
    return formattedDuration.trim().replace(/,\s*$/, '');
  };

module.exports = {
    data: {
        name: "loot",
        description: "Loot a random percentage from a users balance.",
      },
    async execute(message, args) {
        const looterId = message.author.id;
        const lootedUser = message.mentions.users.first();

        if (!lootedUser) {
            return message.reply('Please mention a valid user to loot.');
        }

        const lootedUserId = lootedUser.id;
        const guildId = message.guild.id;

        // Check if looter and looted user are the same
        if (looterId === lootedUserId) {
            return message.reply('You cannot loot yourself.');
        }

        // Retrieve looter and looted user's data
        const looter = await prisma.user.findUnique({
            where: { id_guildId: { id: looterId, guildId } }
        });
        
        const looted = await prisma.user.findUnique({
            where: { id_guildId: { id: lootedUserId, guildId } }
        });

        if (!looter || !looted) {
            return message.reply('Either you or the mentioned user is not registered in the system.');
        }

        // Check if looted user has protection
        // Check if looted user has protection
        if (looted.protectionExpiry && looted.protectionExpiry > Date.now()) {
            // Convert BigInt to a number
            const protectionExpiry = Number(looted.protectionExpiry);
            const timeLeftToLoot = protectionExpiry - Date.now(); // Correct time difference calculation
            
            const embed = new EmbedBuilder()
                .setColor(0x00FFFF)
                .setTitle('Protection Active')
                .setDescription(`${lootedUser} is currently under protection.`)
                .addFields(
                    { name: 'Protection Expiry', value: `You can loot them in ${formatDuration(timeLeftToLoot)}.` }
                )
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }


        // Check cooldowns
        const looterCooldown = looter.cooldowns?.looting || 0;
        const lootedCooldown = looted.cooldowns?.looted || 0;

        const now = new Date();

        if (lootedCooldown > Date.now()) {
            const lootedCooldownTime = new Date(lootedCooldown);
            const lootedtimeDifference = lootedCooldownTime - now;

            const embed = new EmbedBuilder()
                .setColor(0x00FFFF)
                .setTitle('User on Cooldown')
                .setDescription(`${lootedUser.displayName} has already been looted recently. You can loot them again in ${formatDuration(Math.floor(lootedtimeDifference))}.`)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        if (looterCooldown) {
            const looterCooldownTime = new Date(looterCooldown);
            const timeDifference = now - looterCooldownTime;
      
            if (timeDifference < config.commandCooldowns.loot) {

            const cooldownEmbed = new EmbedBuilder()
            .setTitle('Cooldown Time')
            .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
            .setThumbnail(message.author.displayAvatarURL())
            .setDescription(`${message.author} Please wait **${formatDuration(Math.ceil((config.commandCooldowns.loot - timeDifference)))}** before using this command again.`)
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() });
    
            // Send the embed
            return message.reply({ embeds: [cooldownEmbed] });
            }
          }

        const minLootValue = 0.01;
        const maxLootValue = 0.10;

        const lootingRate = Math.random() * (maxLootValue - minLootValue) + minLootValue;

        const lootAmount = Math.floor(looted.balance * lootingRate);

        if (lootAmount <= 0) {
            return message.reply(`${lootedUser.displayName} does not have enough balance to be looted.`);
        }

        // Update balances and looting data
        await prisma.user.update({
            where: { id_guildId: { id: looterId, guildId } },
            data: {
                balance: looter.balance + lootAmount,
                totalLootedAmount: looter.totalLootedAmount ? looter.totalLootedAmount + lootAmount : lootAmount,
                cooldowns: {
                    ...looter.cooldowns,
                    looting: Date.now() + config.commandCooldowns.loot  // Defined time cooldown from config
                }
            }
        });

        await prisma.user.update({
            where: { id_guildId: { id: lootedUserId, guildId } },
            data: {
                balance: looted.balance - lootAmount,
                lootedAmount: looted.lootedAmount ? looted.lootedAmount + lootAmount : lootAmount,
                cooldowns: {
                    ...looted.cooldowns,
                    looted: Date.now() + 10 * 60 * 1000 // 10-minute cooldown for looted person
                }
            }
        });

        // Send an embed with the result    
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Loot Successful!')
            .setDescription(`${message.author.displayName} looted $${lootAmount} from ${lootedUser.displayName}!`)
            .addFields(
                { name: 'Looter New Balance', value: `$${(looter.balance + lootAmount).toLocaleString('en-US')}`, inline: true },
                { name: 'Looting percentage', value: `%${Math.ceil(lootingRate * 100)}`, inline: true },
                { name: 'Looted User New Balance', value: `$${(looted.balance - lootAmount).toLocaleString('en-US')}`, inline: true }
            )
            .setTimestamp();

        return message.channel.send({ embeds: [embed] }).then(embedMessage => {
            const url = embedMessage.url

            const lootedEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('You have been looted!')
            .setDescription(`${message.author.displayName} looted $${lootAmount} from ${lootedUser.displayName}!`)
            .addFields(
                { name: 'Looter New Balance', value: `$${(looter.balance + lootAmount).toLocaleString('en-US')}`, inline: true },
                { name: 'Looting percentage', value: `%${Math.ceil(lootingRate * 100)}`, inline: true },
                { name: 'Your New Balance', value: `$${(looted.balance - lootAmount).toLocaleString('en-US')}`, inline: true },
                { name: 'Message Link', value: `${url}`, inline: true }
            )
            .setTimestamp();

            lootedUser.send({ embeds: [lootedEmbed] })
            
        });
    }
};