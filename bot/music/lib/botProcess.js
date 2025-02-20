const { prisma } = require("../../../src/database/db");

const saveProcess = async (clientId) => {
  if (!clientId) return;
  const existingProcess = await prisma.botProcess.findFirst({
    where: {
      processId: `${clientId}`,
    },
    include: {
      token: true,
    },
  });

  const token = await prisma.token.findFirst({
    where: {
      botId: clientId,
    },
    include: {
      process: true,
      setting: true,
    },
  });

  await prisma.setting.update({
    where: {
      id: token.setting.id,
    },
    data: {
      restart: false,
    },
  });

  if (existingProcess) {
    await prisma.botProcess.update({
      where: {
        processId: `${clientId}`,
      },
      data: {
        running: true,
        token: {
          connect: {
            id: token.id,
          },
        },
      },
    });

    return;
  }

  if (!token) {
    console.log("Token not found");
    return;
  }

  await prisma.botProcess.create({
    data: {
      processId: `${clientId}`,
      running: true,
      token: {
        connect: {
          id: token.id,
        },
      },
    },
  });
};

module.exports = {
  saveProcess,
};
