const { prisma } = require("../database/db");
const { restartBot } = require("../lib/botProcess");

module.exports = {
  name: "restartbot",
  description: "Check for bots that need to be restart",
  cron: "* * * * *",
  execute: async () => {
    const tokens = await prisma.token.findMany({
      where: {
        AND: [
          {
            process: {
              running: true,
            },
          },
          {
            setting: {
              restart: true,
            },
          },
        ],
      },
      include: {
        process: true,
      },
    });

    console.log("TOKENS TO RESTART", tokens);

    for (const token of tokens) {
      if (token.process) {
        await restartBot(token);
      }
    }
  },
};
