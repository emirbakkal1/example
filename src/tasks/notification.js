const { Client, EmbedBuilder, GatewayIntentBits } = require("discord.js");
const { prisma } = require("../database/db");
const { capitalize } = require("../utils/functions");
const { logChannelId } = require("../config.json");
const config = require("../config.json");

module.exports = {
  name: "notification",
  description: "Check for subscription expiration to send reminder",
  cron: "* * * * *",
  execute: async () => {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          {
            AND: [
              {
                subscriptionDuration: {
                  lte: Date.now() + 2 * 24 * 60 * 60 * 1000,
                  gt: Date.now() + 5 * 60 * 1000,
                },
              },
              {
                aboutToExpireNotificationSent: false,
              },
            ],
          },
          {
            AND: [
              {
                expired: true,
              },
              {
                expiredNotificationSent: false,
              },
            ],
          },
          {
            AND: [
              {
                subscriptionDuration: {
                  lte: Date.now() + 5 * 60 * 1000,
                  gt: Date.now(),
                },
              },
              {
                oneMinuteBeforeExpireNotificationSent: false,
              },
            ],
          },
        ],
      },
      include: {
        tokens: {
          include: {
            setting: true,
          },
        },
      },
    });

    console.log("SUBSCRIPTIONS TO NOTIFY", subscriptions);

    if (!subscriptions.length) return;

    const { TOKEN } = process.env;

    // Group subscriptions by customerId and expiration date
    const groupedSubscriptions = subscriptions.reduce((acc, sub) => {
      const customerId = sub.customerId;
      const expirationDate = new Date(Number(sub.subscriptionDuration))
        .toISOString()
        .split("T")[0];
      if (!acc[customerId]) {
        acc[customerId] = {};
      }
      if (!acc[customerId][expirationDate]) {
        acc[customerId][expirationDate] = [];
      }
      acc[customerId][expirationDate].push(sub);
      return acc;
    }, {});

    console.log("GROUPED SUBSCRIPTIONS", groupedSubscriptions);

    try {
      const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      });

      client.on("ready", async (client) => {
        const guild = client.guilds.cache.get(config.mainBotGuildId);
        if (!guild) {
          console.log("Bot not in any guild");
        }

        const embed = new EmbedBuilder()
          .setTitle("Subscription reminder")
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter({
            text: guild.name,
            iconURL: guild.iconURL({ dynamic: true }),
          });
        for (const customerId in groupedSubscriptions) {
          const user = await client.users.fetch(customerId, { force: true });

          embed.setAuthor({
            name: user.displayName,
            iconURL: user.displayAvatarURL({ dynamic: true }),
          });

          for (const expirationDate in groupedSubscriptions[customerId]) {
            const subs = groupedSubscriptions[customerId][expirationDate];
            const isExpired = subs.some((sub) => sub.expired);
            let twoDaysMessage = "";
            let oneMinuteMessage = "";

            const twoDaysBefore = subs.some((sub) => {
              return (
                sub.subscriptionDuration <=
                  Date.now() + 2 * 24 * 60 * 60 * 1000 &&
                !sub.aboutToExpireNotificationSent
              );
            });
            const oneMinuteBefore = subs.some((sub) => {
              return (
                sub.subscriptionDuration <= Date.now() + 5 * 60 * 1000 &&
                sub.subscriptionDuration > Date.now() &&
                !sub.oneMinuteBeforeExpireNotificationSent
              );
            });

            if (isExpired) {
              twoDaysMessage =
                `* **Your subscriptions :**\n${subs
                  .map((sub) => {
                    return ` * ${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName} | ${sub.months} months`;
                  })
                  .join("\n")}` +
                `\n* We would like to remind you that the term of these subscriptions has expired. It will be deleted from the database after 40 days in case it is not renewed`;
            } else if (twoDaysBefore) {
              twoDaysMessage =
                `* **Your subscriptions :**\n${subs
                  .map((sub) => {
                    return ` * ${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName} | ${sub.months} months`;
                  })
                  .join("\n")}` +
                `\n* We would like to remind you that there are two days left until the end of these subscriptions`;
            }

            if (oneMinuteBefore) {
              oneMinuteMessage =
                `* **Your subscriptions :**\n${subs
                  .map((sub) => {
                    return ` * ${capitalize(sub.botType)} x${sub.botAmount} (Sub_ID: ${sub.subId}) | ${sub.tokens[0].setting.guildName} | ${sub.months} months`;
                  })
                  .join("\n")}` +
                `\n* We would like to remind you that there are 5 mintues left until the end of these subscriptions`;
            }

            user.createDM().then(async (dm) => {
              if (twoDaysMessage) {
                await dm.send({
                  embeds: [embed.setDescription(twoDaysMessage)],
                });
              }
              if (oneMinuteMessage) {
                await dm.send({
                  embeds: [embed.setDescription(oneMinuteMessage)],
                });
              }
            });

            const logChannel = await guild.channels.fetch(logChannelId, {
              force: true,
            });

            if (logChannel) {
              const logEmbed = EmbedBuilder.from(embed).setDescription(
                (twoDaysMessage || oneMinuteMessage) +
                  `\n* **Subscription Owner:**\n * <@${customerId}>`,
              );
              logChannel.send({
                embeds: [logEmbed],
              });
            }

            // Update notification sent flags
            if (twoDaysBefore || isExpired) {
              await prisma.subscription.updateMany({
                where: {
                  id: { in: subs.map((sub) => sub.id) },
                },
                data: {
                  aboutToExpireNotificationSent: !isExpired,
                  expiredNotificationSent: isExpired,
                },
              });
            }

            if (oneMinuteBefore) {
              await prisma.subscription.updateMany({
                where: {
                  id: { in: subs.map((sub) => sub.id) },
                },
                data: {
                  oneMinuteBeforeExpireNotificationSent: true,
                },
              });
            }
          }
        }

        await client.destroy();
      });

      await client.login(TOKEN);
    } catch (error) {
      console.log(error);
    }
  },
};
