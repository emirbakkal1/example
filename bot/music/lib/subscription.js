const { prisma } = require("../../../src/database/db");

async function updateSubscriptionModel(botId, newCustomerId) {
  const tokenWithSubscription = await prisma.token.findFirst({
    where: {
      botId: botId,
    },
    include: {
      subscription: true,
    },
  });

  if (!tokenWithSubscription || !tokenWithSubscription.subscription) {
    throw new Error("Token or Subscription not found.");
  }

  const { subscription } = tokenWithSubscription;

  // Step 2: Check the botAmount in the subscription
  if (subscription.botAmount > 1) {
    // Decrement botAmount by 1 in the current subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { botAmount: subscription.botAmount - 1 },
    });

    const lastObject = await prisma.subscription.findFirst({
      select: {
        subId: true,
      },
      orderBy: {
        subId: "desc",
      },
    });

    // Create a new subscription with botAmount = 1 and new customerId
    const newSubscription = await prisma.subscription.create({
      data: {
        subId: lastObject.subId + 1, // Assuming subId needs to be unique and incremented
        customerId: newCustomerId,
        subscriptionDuration: subscription.subscriptionDuration,
        expirationTime: subscription.expirationTime,
        expired: subscription.expired,
        expiredNotificationSent: subscription.expiredNotificationSent,
        aboutToExpireNotificationSent:
          subscription.aboutToExpireNotificationSent,
        botType: subscription.botType,
        botAmount: 1,
        months: subscription.months,
        // Copy other necessary fields from the existing subscription
      },
    });

    // Update the token to reference the new subscription
    await prisma.token.update({
      where: {
        id: tokenWithSubscription.id,
      },
      data: {
        subscriptionId: newSubscription.id,
      },
    });
  } else if (subscription.botAmount === 1) {
    // Update the customerId of the current subscription
    await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        customerId: newCustomerId,
      },
    });
  }
}

module.exports = {
  updateSubscriptionModel,
};
