const { prisma } = require("../../../src/database/db");

const changeOwnerAll = async (user, guildId, newUser) => {
  await prisma.subscription.updateMany({
    where: {
      customerId: user,
      tokens: {
        every: {
          setting: {
            guildId: guildId,
          },
        },
      },
    },
    data: {
      customerId: newUser,
    },
  });
};

const addAdminAll = async (user, guildId, adminId) => {
  await prisma.setting.updateMany({
    where: {
      AND: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          NOT: {
            admins: {
              has: adminId,
            },
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      admins: {
        push: adminId,
      },
    },
  });
};

const removeAdminAll = async (user, guildId, adminId) => {
  const settings = await prisma.setting.findMany({
    where: {
      token: {
        subscription: {
          customerId: user,
        },
      },
      guildId: guildId,
    },
  });

  for (const setting of settings) {
    const newAdmins = setting.admins.filter((admin) => admin !== adminId);

    await prisma.setting.update({
      where: {
        id: setting.id,
      },
      data: {
        admins: newAdmins,
      },
    });
  }
};

const getAdminsAll = async (user, guildId) => {
  const setting = await prisma.setting.findMany({
    where: {
      token: {
        subscription: {
          customerId: user,
        },
      },
      guildId: guildId,
    },
    select: {
      admins: true,
    },
  });

  return setting.map((s) => s.admins);
};

const updateActivityAll = async (user, guildId, activity, activityType) => {
  if (activity) {
    await prisma.setting.updateMany({
      where: {
        OR: [
          {
            token: {
              subscription: {
                customerId: user,
              },
            },
          },
          {
            admins: {
              has: user,
            },
          },
        ],
        guildId: guildId,
      },
      data: {
        activity: activity,
      },
    });
  }

  if (activityType) {
    await prisma.setting.updateMany({
      where: {
        OR: [
          {
            token: {
              subscription: {
                customerId: user,
              },
            },
          },
          {
            admins: {
              has: user,
            },
          },
        ],
        guildId: guildId,
      },
      data: {
        activityType: activityType,
      },
    });
  }

  if (activity === null && activityType === null) {
    await prisma.setting.updateMany({
      where: {
        OR: [
          {
            token: {
              subscription: {
                customerId: user,
              },
            },
          },
          {
            admins: {
              has: user,
            },
          },
        ],
        guildId: guildId,
      },
      data: {
        activity: null,
        activityType: null,
      },
    });
  }
};

const updateStatusAll = async (user, guildId, status) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      status: status,
    },
  });
};

const deletePrefixAll = async (user, guildId) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      prefix: "",
    },
  });
};

const setEmbedAll = async (user, guildId, value) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      embed: value,
    },
  });
};

const getBotInfoAll = async (user, guildid, ownerOnly) => {
  if (ownerOnly) {
    const setting = await prisma.setting.findMany({
      where: {
        OR: [
          {
            token: {
              subscription: {
                customerId: user,
              },
            },
          },
        ],
        guildId: guildid,
      },
      include: {
        token: true,
      },
    });

    return setting;
  }
  const setting = await prisma.setting.findMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildid,
    },
    include: {
      token: true,
    },
  });

  return setting;
};

const updateEmbedColorAll = async (user, guildId, color) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      embedColor: color,
      embed: true
    },
  });
};

const setButtonAll = async (user, guildId, value) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      buttons: value,
    },
  });
};

const updateCommandsChannelAll = async (user, guildId, channelId) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      commandsChannelId: channelId,
    },
  });
};

const updateVoiceChannelAll = async (user, guildId, channelId) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      voiceChannelId: channelId,
    },
  });
};

const updateServerAll = async (user, guildId, serverId, guildName) => {
  await prisma.setting.updateMany({
    where: {
      token: {
        subscription: {
          customerId: user,
        },
      },
      guildId: guildId,
    },
    data: {
      guildId: serverId,
      guildName: guildName,
      voiceChannelId: null,
      commandsChannelId: null,
    },
  });
};

const getBotAll = async (user) => {
  const token = await prisma.token.findMany({
    where: {
      subscription: {
        customerId: user,
      },
    },
    include: {
      setting: true,
    },
  });

  return token;
};

const getSettingFromBotId = async (botId) => {
  const setting = await prisma.setting.findFirst({
    where: {
      token: {
        botId: botId,
      },
    },
    include: {
      token: {
        include: {
          subscription: true,
        },
      },
    },
  });

  return setting;
};

const setVoiceChannelChatAll = async (user, guildId, value) => {
  await prisma.setting.updateMany({
    where: {
      OR: [
        {
          token: {
            subscription: {
              customerId: user,
            },
          },
        },
        {
          admins: {
            has: user,
          },
        },
      ],
      guildId: guildId,
    },
    data: {
      voiceChannelChat: value,
    },
  });
};

module.exports = {
  changeOwnerAll,
  addAdminAll,
  removeAdminAll,
  getAdminsAll,
  updateActivityAll,
  updateStatusAll,
  deletePrefixAll,
  setEmbedAll,
  getBotInfoAll,
  updateEmbedColorAll,
  setButtonAll,
  updateCommandsChannelAll,
  updateVoiceChannelAll,
  updateServerAll,
  getBotAll,
  getSettingFromBotId,
  setVoiceChannelChatAll,
};
