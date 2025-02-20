const { prisma } = require("../database/db");
const { initializeStartBot, startBot } = require("../lib/botProcess");

module.exports = {
  name: "startup",
  description: "Check for bots that need to be started",
  cron: "* * * * *",
  execute: async () => {
    const tokens = await prisma.token.findMany({
      where: {
        OR: [
          {
            process: {
              running: false,
            },
          },
          {
            process: null,
          },
        ],
        subscription: {
          expired: false,
        },
      },
      include: {
        process: true,
      },
    });

    console.log("TOKENS TO RUN", tokens);

    for (const token of tokens) {
      if (token.process) {
        startBot(token.process.processId, token.botType);
      } else {
        initializeStartBot(token);
      }
    }
  },
};
