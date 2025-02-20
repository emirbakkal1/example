const ms = require("ms");
const { prisma } = require("../database/db");

const addSubscription = async (
  client,
  type,
  guildId,
  months,
  botAmount,
  tokens,
  guildName,
) => {
  const subscriptionDuration = Date.now() + ms(`${months * 30} days`);

  const lastObject = await prisma.subscription.findFirst({
    select: {
      subId: true,
    },
    orderBy: {
      subId: "desc",
    },
  });

  for (const token of tokens) {
    await prisma.setting.create({
      data: {
        guildId: guildId,
        guildName: guildName,
        token: {
          connect: {
            id: token.id,
          },
        },
      },
    });
  }

  return await prisma.subscription.create({
    data: {
      subId: lastObject ? lastObject.subId + 1 : 0,
      customerId: client.id,
      botType: type,
      months: Number(months),
      subscriptionDuration,
      botAmount: botAmount,
      tokens: {
        connect: tokens.map((token) => ({ id: token.id })),
      },
    },
    include: {
      tokens: true,
    },
  });
};

const renewSubscription = async (subscription, months) => {
  const subscriptionDuration = new Date(
    Number(subscription.subscriptionDuration),
  ).getTime();
  const now = Date.now();

  let newDuration = Date.now();
  if (now > subscriptionDuration) {
    newDuration = now + ms(`${months * 30} days`);
  } else {
    newDuration = subscriptionDuration + ms(`${months * 30} days`);
  }

  const newSub = await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      subscriptionDuration: newDuration,
      expirationTime: null,
      expired: false,
    },
    include: {
      tokens: {
        include: {
          setting: true,
        },
      },
    },
  });

  return newSub;
};

const removeSubscriptions = async (subscriptions) => {
  await prisma.setting.deleteMany({
    where: {
      token: {
        subscription: {
          id: {
            in: subscriptions.map((sub) => sub.id),
          },
        },
      },
    },
  });

  await prisma.subscription.deleteMany({
    where: {
      id: {
        in: subscriptions.map((sub) => sub.id),
      },
    },
  });
};

const changeServer = async (subscription, guild) => {
  await prisma.setting.updateMany({
    where: {
      token: {
        subscription: {
          id: subscription.id,
        },
      },
    },
    data: {
      guildId: guild.id,
      guildName: guild.name,
    },
  });
};

const changeServerAll = async (user, guild) => {
  await prisma.setting.updateMany({
    where: {
      token: {
        subscription: {
          customerId: user.id,
        },
      },
    },
    data: {
      guildId: guild.id,
      guildName: guild.name,
    },
  });
};

const getSubscriptionsFromUser = async (
  user,
  type,
  guildId,
  id,
  allowOwners,
) => {
  const condition = [
    {
      customerId: user.id ?? undefined,
    },
  ];

  if (allowOwners) {
    condition.push({
      tokens: {
        some: {
          setting: {
            admins: {
              has: user.id,
            },
          },
        },
      },
    });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      subId: id ?? undefined,
      OR: condition,
      botType: type ?? undefined,
      tokens: {
        some: {
          setting: guildId ?? undefined,
        },
      },
    },
    include: {
      tokens: {
        include: {
          setting: true,
          process: true,
        },
      },
    },
  });

  return subscriptions;
};

const addAdmin = async (subscription, adminId) => {
  subscription.tokens.map(async (token) => {
    const newAdmin = [...token.setting.admins, adminId];

    const uniqueAdmin = [...new Set(newAdmin)];

    await prisma.setting.update({
      where: {
        id: token.setting.id,
      },
      data: {
        admins: uniqueAdmin,
      },
    });
  });
};

const getAdmins = async (subscription, all) => {
  if (all) {
    const data = await prisma.setting.findMany({
      where: {
        token: {
          subscription: {
            customerId: subscription.customerId,
          },
        },
      },
      select: {
        admins: true,
      },
    });

    return data.map((e) => e.admins);
  }
  const data = await prisma.setting.findMany({
    where: {
      token: {
        subscription: {
          id: subscription.id,
        },
      },
    },
    select: {
      admins: true,
    },
  });

  return data.map((e) => e.admins);
};

const addAdminAll = async (user, adminId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      customerId: user.id,
    },
    include: {
      tokens: {
        include: {
          setting: true,
        },
      },
    },
  });

  for (const subscription of subscriptions) {
    subscription.tokens.map(async (token) => {
      const newAdmin = [...token.setting.admins, adminId];

      const uniqueAdmin = [...new Set(newAdmin)];

      await prisma.setting.update({
        where: {
          id: token.setting.id,
        },
        data: {
          admins: uniqueAdmin,
        },
      });
    });
  }
};

const removeAdmin = async (subscription, adminId) => {
  subscription.tokens.map(async (token) => {
    const newAdmin = token.setting.admins.filter((admin) => admin !== adminId);

    await prisma.setting.update({
      where: {
        id: token.setting.id,
      },
      data: {
        admins: newAdmin,
      },
    });
  });
};

const removeAdminAll = async (user, adminId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      customerId: user.id,
    },
    include: {
      tokens: {
        include: {
          setting: true,
        },
      },
    },
  });

  for (const subscription of subscriptions) {
    subscription.tokens.map(async (token) => {
      const newAdmin = token.setting.admins.filter(
        (admin) => admin !== adminId,
      );

      await prisma.setting.update({
        where: {
          id: token.setting.id,
        },
        data: {
          admins: newAdmin,
        },
      });
    });
  }
};

const transferOwner = async (subscription, newOwnerId) => {
  const newSub = await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      customerId: newOwnerId,
    },
  });

  return newSub;
};

const transferOwnerAll = async (user, newOwnerId) => {
  await prisma.subscription.updateMany({
    where: {
      customerId: user.id,
    },
    data: {
      customerId: newOwnerId,
    },
  });
};

module.exports = {
  addSubscription,
  renewSubscription,
  changeServerAll,
  changeServer,
  removeSubscriptions,
  getSubscriptionsFromUser,
  getAdmins,
  addAdmin,
  addAdminAll,
  removeAdmin,
  removeAdminAll,
  transferOwner,
  transferOwnerAll,
};
