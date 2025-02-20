const { Client, GatewayIntentBits } = require("discord.js");
const { prisma } = require("../database/db");
const { mainBotGuildId, customerRole } = require("../config.json");

module.exports = {
  name: "roleassign",
  description: "Assign roles to subscribers",
  cron: "0 * * * *",
  execute: async () => {
    const subscribers = await prisma.subscription.findMany({
      where: {
        expired: false,
      },
      select: {
        customerId: true,
      },
    });

    try {
      const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
      });

      client.on("ready", async () => {
        const guild = await client.guilds.fetch(mainBotGuildId);

        for (const subscriber of subscribers) {
          const member = await guild.members.fetch(subscriber.customerId);
          const role = await guild.roles.fetch(customerRole);

          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
          }
        }
        client.destroy();
      });

      client.login(process.env.TOKEN);
    } catch (error) {
      console.log("Error in roleAssign task", error);
    }
  },
};
