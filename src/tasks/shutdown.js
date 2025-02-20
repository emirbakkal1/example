const { prisma } = require("../database/db");
const { shutDownBot } = require("../lib/botProcess");

module.exports = {
  name: "shutdown",
  description: "Check for bots that need to be shutdown",
  cron: "* * * * *",
  execute: async () => {
    const tokens = await prisma.token.findMany({
      where: {
        process: {
          running: true,
        },
        OR: [
          {
            subscriptionId: null,
          },
          {
            subscription: {
              expired: true,
            },
          },
        ],
      },
      include: {
        process: true,
      },
    });

    console.log("TOKENS TO SHUTDOWN", tokens);

    for (const token of tokens) {
      await shutDownBot(
        token.process.id,
        token.process.processId,
        token.botType,
      );
    }
  },
};
