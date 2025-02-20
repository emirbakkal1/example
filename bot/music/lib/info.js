const { prisma } = require("../../../src/database/db");

const getSubscriptionId = async (botId) => {
  const subscriptionId = await prisma.token.findFirst({
    where: {
      botId,
    },
    select: {
      subscriptionId: true,
    },
  });

  return subscriptionId.subscriptionId;
};

const getSetting = async (botId) => {
  return await prisma.setting.findFirst({
    where: {
      token: {
        botId: botId,
      },
    },
  });
};

const getTokenId = async (botId) => {
  const tokenId = await prisma.token.findFirst({
    where: {
      botId,
    },
    select: {
      id: true,
    },
  });

  return tokenId.id;
};

const getToken = async (botId) => {
  const tokenId = await getTokenId(botId);

  const token = await prisma.token.findFirst({
    where: {
      id: tokenId,
    },
    include: {
      setting: true,
    },
  });

  return token;
};

const getSubscription = async (botId) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: await getSubscriptionId(botId),
    },
  });

  return subscription;
};

// finde customerId by BotId
const getOwner = async (botId) => {
  const subscriptionId = await getSubscriptionId(botId);

  const ownerId = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
    },
    select: {
      customerId: true,
    },
  });

  return ownerId.customerId;
};

// get owners from subscription
const getAdmins = async (botId) => {
  const admins = await prisma.setting.findFirst({
    where: {
      token: {
        botId: botId,
      },
    },
  });

  return admins.admins;
};

const addAdmin = async (botId, adminId) => {
  const setting = await getSetting(botId);
  const newOwners = [...setting.admins, adminId];

  const newSub = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      admins: newOwners,
    },
  });

  return newSub.admins.includes(adminId);
};

const removeAdmin = async (botId, adminId) => {
  const setting = await getSetting(botId);
  const newOwners = setting.admins.filter((owner) => owner !== adminId);

  const newSub = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      admins: newOwners,
    },
  });

  return !newSub.admins.includes(adminId);
};

const changeOwner = async (botId, ownerId) => {
  const subscriptionId = await getSubscriptionId(botId);

  const newOwner = await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      customerId: ownerId,
    },
    select: {
      customerId: true,
    },
  });

  return newOwner.customerId === ownerId;
};

const getPrefix = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      prefix: true,
    },
  });

  return setting.prefix;
};

const setPrefix = async (botId, prefix) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
  });

  const updatedToken = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      prefix,
    },
    select: {
      prefix: true,
    },
  });

  return updatedToken.prefix;
};

const getEmbedColor = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      embedColor: true,
    },
  });

  return setting;
};

const toggleEmbed = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      embed: true,
    },
  });

  const updatedSetting = await prisma.setting.update({
    where: {
      tokenId,
    },
    data: {
      embed: !setting.embed,
    },
    select: {
      embed: true,
    },
  });

  return updatedSetting.embed;
};

const getEmbed = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      embed: true,
    },
  });

  return setting.embed;
};

const updateEmbedColor = async (botId, color) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
  });

  const updatedSetting = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      embedColor: color,
      embed: true
    },
    select: {
      embedColor: true,
    },
  });

  return updatedSetting.embedColor;
};

const toggleButtons = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      buttons: true,
    },
  });

  const updatedSetting = await prisma.setting.update({
    where: {
      tokenId,
    },
    data: {
      buttons: !setting.buttons,
    },
    select: {
      buttons: true,
    },
  });

  return updatedSetting.buttons;
};

const isButtonEnabled = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      buttons: true,
    },
  });

  return setting.buttons;
};

const updateCommandsChannel = async (botId, channelId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
  });

  const updatedSetting = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      commandsChannelId: channelId,
    },
    select: {
      commandsChannelId: true,
    },
  });

  return updatedSetting.commandsChannelId;
};

const deleteCommandsChannel = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
  });

  await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      commandsChannelId: null,
    },
  });
};

const getCommandsChannel = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      commandsChannelId: true,
    },
  });

  return setting.commandsChannelId;
};

const updateActivity = async (botId, activity, activityType) => {
  const setting = await prisma.setting.findFirst({
    where: {
      token: {
        botId,
      },
    },
    include: {
      token: true,
    },
  });

  if (activity) {
    return await prisma.setting.update({
      where: {
        id: setting.id,
      },
      data: {
        activity,
      },
      select: {
        activity: true,
        activityType: true,
      },
    });
  }

  if (activityType) {
    return await prisma.setting.update({
      where: {
        id: setting.id,
      },
      data: {
        activityType,
      },
      select: {
        activity: true,
        activityType: true,
      },
    });
  }

  return {
    activity: setting.activity,
    activityType: setting.activityType,
  };
};

const getActivity = async (botId) => {
  const setting = await prisma.setting.findFirst({
    where: {
      token: {
        botId,
      },
    },
    select: {
      activity: true,
      activityType: true,
    },
  });

  return setting;
};

const deleteActivity = async (botId) => {
  const setting = await prisma.setting.findFirst({
    where: {
      token: {
        botId,
      },
    },
  });

  await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      activity: null,
      activityType: null,
    },
  });
};

const updateStatus = async (botId, status) => {
  const setting = await prisma.setting.findFirst({
    where: {
      token: {
        botId,
      },
    },
    include: {
      token: true,
    },
  });

  await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      status,
    },
  });
};

const getStatus = async (botId) => {
  const setting = await prisma.setting.findFirst({
    where: {
      token: {
        botId,
      },
    },
    select: {
      status: true,
    },
  });

  return setting.status;
};

const updateVoiceChannel = async (botId, channelId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
  });

  const updatedSetting = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      voiceChannelId: channelId,
    },
    select: {
      voiceChannelId: true,
    },
  });

  return updatedSetting.voiceChannelId;
};

const getVoiceChannel = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      voiceChannelId: true,
    },
  });

  return setting.voiceChannelId;
};

const deleteVoiceChannel = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
  });

  await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      voiceChannelId: null,
    },
    select: {
      voiceChannelId: true,
    },
  });
};

const updateServer = async (botId, serverId, guildName) => {
  const setting = await getSetting(botId);

  const updateServer = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      guildId: serverId,
      guildName: guildName,
    },
    select: {
      guildId: true,
    },
  });

  return updateServer.guildId;
};

const getServer = async (botId) => {
  const setting = await getSetting(botId);

  return setting.guildId;
};

const updateBotName = async (botId, botName) => {
  const token = await getToken(botId);

  const updatedToken = await prisma.token.update({
    where: {
      id: token.id,
    },
    data: {
      botName,
    },
    select: {
      botName: true,
    },
  });

  return updatedToken.botName;
};

const getMasterInfo = async (botId) => {
  const token = await getToken(botId);
  const setting = await prisma.setting.findFirst({
    where: {
      tokenId: token.id,
    },
    select: {
      master: true,
    },
  });

  return setting.master;
};

const assignMaster = async (botId) => {
  const token = await getToken(botId);
  const setting = await prisma.setting.findFirst({
    where: {
      tokenId: token.id,
    },
  });

  const updatedSetting = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      master: true,
    },
    select: {
      master: true,
    },
  });

  return updatedSetting.master;
};

const deleteMaster = async (botId) => {
  const token = await getToken(botId);
  const setting = await prisma.setting.findFirst({
    where: {
      tokenId: token.id,
    },
  });

  const updatedSetting = await prisma.setting.update({
    where: {
      id: setting.id,
    },
    data: {
      master: false,
    },
    select: {
      master: true,
    },
  });

  return updatedSetting.master;
};

const toggleVoiceChannelChat = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      voiceChannelChat: true,
    },
  });

  const updateSetting = await prisma.setting.update({
    where: {
      tokenId,
    },
    data: {
      voiceChannelChat: !setting.voiceChannelChat,
    },
    select: {
      voiceChannelChat: true,
    },
  });

  return updateSetting.voiceChannelChat;
};

const getVoiceChannelChat = async (botId) => {
  const tokenId = await getTokenId(botId);

  const setting = await prisma.setting.findFirst({
    where: {
      tokenId,
    },
    select: {
      voiceChannelChat: true,
    },
  });

  return setting.voiceChannelChat;
};

module.exports = {
  getSetting,
  getOwner,
  getAdmins,
  addAdmin,
  removeAdmin,
  getSubscription,
  changeOwner,
  getPrefix,
  setPrefix,
  getEmbedColor,
  toggleEmbed,
  getEmbed,
  updateEmbedColor,
  toggleButtons,
  isButtonEnabled,
  updateCommandsChannel,
  getCommandsChannel,
  updateActivity,
  getActivity,
  updateVoiceChannel,
  getVoiceChannel,
  deleteVoiceChannel,
  updateServer,
  getServer,
  getToken,
  updateBotName,
  getMasterInfo,
  assignMaster,
  deleteMaster,
  getStatus,
  updateStatus,
  deleteActivity,
  deleteCommandsChannel,
  toggleVoiceChannelChat,
  getVoiceChannelChat,
};
