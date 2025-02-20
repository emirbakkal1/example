const { prisma } = require("../database/db");
const { resetBotState } = require("../lib/tokens");
const { removeSubscriptions } = require("../lib/subscriptions");

module.exports = {
  name: "expiry",
  description: "Check the expiry of all subscriptions",
  cron: "* * * * *",
  execute: async () => {
    const subscriptionsExpired = await prisma.subscription.findMany({
      where: {
        subscriptionDuration: {
          lt: new Date().getTime(),
          not: null,
        },
      },
    });

    console.log("Subscription expired", subscriptionsExpired);

    if (subscriptionsExpired.length) {
      for (const sub of subscriptionsExpired) {
        await prisma.subscription.update({
          where: {
            id: sub.id,
          },
          data: {
            expired: true,
            expirationTime: new Date().getTime() + 3456000000,
            subscriptionDuration: null,
          },
        });
      }
    }

    const subscriptionsExpired40Days = await prisma.subscription.findMany({
      where: {
        expirationTime: {
          lt: new Date().getTime(),
          not: null,
        },
        expired: true,
      },
      include: {
        tokens: true,
      },
    });

    console.log(
      "Subscription Expired after 40 days",
      subscriptionsExpired40Days,
    );

    if (subscriptionsExpired40Days.length) {
      for (const sub of subscriptionsExpired40Days) {
        for (const token of sub.tokens) {
          await resetBotState(token);
        }
      }

      await removeSubscriptions(subscriptionsExpired40Days);
    }
  },
};
