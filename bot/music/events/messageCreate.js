const {
  Events,
  ChannelType,
  EmbedBuilder,
  Message,
  Colors,
  codeBlock,
} = require("discord.js");
const {
  getOwner,
  getAdmins,
  getPrefix,
  getCommandsChannel,
  getVoiceChannel,
  getVoiceChannelChat,
} = require("../lib/info");
const { determineRespondingBot } = require("../lib/master");
const { errorEmbed } = require("../utils/functions");

function getCommand(message, cmd) {
  return (
    message.client.prefix.get(cmd) ||
    message.client.prefix.find(
      (c) => c.data.aliases && c.data.aliases.includes(cmd),
    )
  );
}

async function handleCommandError(message, err) {
  const errorEmbed = new EmbedBuilder()
    .setTitle("Error message")
    .setColor(Colors.Red)
    .setDescription(codeBlock(err.message.trim()))
    .setAuthor({
      name: message.author.displayName,
      iconURL: message.author.displayAvatarURL({ size: 1024 }),
    })
    .setThumbnail(message.guild.iconURL({ dynamic: true }))
    .setFooter({
      text: message.guild.name,
      iconURL: message.guild.iconURL({ dynamic: true }),
    });

  if (err.url?.includes("https://discord.com/api")) {
    errorEmbed.setDescription(
      codeBlock(`[Discord API]\n${err.message.split(":")[1].trim()}`),
    );
  }

  await message.reply({ embeds: [errorEmbed] });
}

async function hasVoiceChannelRequirements(message, prefixCommand) {
  const memberVC = message.member.voice.channel || null;
  const botVC = message.guild.members.me.voice.channel || null;

  if (prefixCommand.memberVoice && !memberVC) {
    if (!message.client.embed)
      await message.reply({
        content: "You aren't connected to any Voice Channel.",
      });
    else
      await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You aren't connected to any Voice Channel.",
          ),
        ],
      });
    return false;
  }

  if (prefixCommand.botVoice && !botVC) {
    if (!message.client.embed)
      await message.reply({
        content: "I'm not connected to any Voice Chnanel.",
      });
    else
      await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "I'm not connected to any Voice Chnanel.",
          ),
        ],
      });

    return false;
  }

  if (
    prefixCommand.sameVoice &&
    memberVC &&
    botVC &&
    memberVC.id !== botVC.id
  ) {
    if (!message.client.embed)
      await message.reply({
        content: "You aren't in my Voice Channel.",
      });
    else
      await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You aren't connected to my Voice Channel.",
          ),
        ],
      });

    return false;
  }

  return true;
}

function isOwner(message, ownerId) {
  return message.author.id === ownerId;
}

function isAdmin(message, ownerId, admins) {
  return admins.includes(message.author.id) || isOwner(message, ownerId);
}

async function hasPermission(message, prefixCommand, ownerId, admins) {
  if (prefixCommand.ownerOnly && !isOwner(message, ownerId)) {
    await message.reply({
      embeds: [
        errorEmbed(message).setDescription(
          "You don't have permission to use this command.",
        ),
      ],
    });
    return false;
  }

  if (prefixCommand.adminOnly && !isAdmin(message, ownerId, admins)) {
    await message.reply({
      embeds: [
        errorEmbed(message).setDescription(
          "You don't have permission to use this command.",
        ),
      ],
    });
    return false;
  }

  return true;
}

async function handleAllCommands(message, ownerId, admins) {
  const args = message.content.slice(1).split(/ +/);
  const cmd = args.shift().toLowerCase();


  const prefixCommand = getCommand(message, cmd);
  if (!prefixCommand) return;

  const isMaster = await determineRespondingBot(
    message.author.id,
    message.guild.id,
    message.client.user.id,
  );

  console.log(isMaster);

  if (prefixCommand.allCommands) {
    if (prefixCommand.ownerOnly && !isOwner(message, ownerId)) {
      if (!isMaster) return;
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You don't have permission to use this command.",
          ),
        ],
      });
    }

    if (prefixCommand.adminOnly && !isAdmin(message, ownerId, admins)) {
      if (!isMaster) return;
      return await message.reply({
        embeds: [
          errorEmbed(message).setDescription(
            "You don't have permission to use this command.",
          ),
        ],
      });
    }

    try {
      await prefixCommand.execute(message, args);
    } catch (err) {
      console.error(err);
      if (!isMaster) return;
      return await handleCommandError(message, err);
    }
  }
}

async function getPrefixFromMessage(message) {
  const mentionRegex = message.content.match(
    new RegExp(`^<@!?${message.client.user.id}>`, "gi"),
  );
  if (mentionRegex) {
    return `${mentionRegex[0]} `;
  } else {
    return await getPrefix(message.client.user.id);
  }
}

module.exports = {
  name: Events.MessageCreate,

  /**
   *
   * @param {Message} message
   * @returns
   */
  async execute(message) {
    if (
      message.channel.type === ChannelType.DM ||
      message.system ||
      message.author.bot
    )
      return;

    const prefix = await getPrefixFromMessage(message);
    const ownerId = await getOwner(message.client.user.id);
    const admins = await getAdmins(message.client.user.id);
    const commandChannel = await getCommandsChannel(message.client.user.id);
    const voiceChannel = await getVoiceChannel(message.client.user.id);
    const voiceChannelChat = await getVoiceChannelChat(message.client.user.id);

    if (message.content.startsWith("#") && !message.author.bot) {
      await handleAllCommands(message, ownerId, admins);
    }
    // For music commands  user can use commands without prefix in command channel
    if (
      commandChannel &&
      voiceChannel &&
      (message.channel.id === commandChannel ||
        (voiceChannelChat && message.channel.id === voiceChannel)) &&
      (!message.content.startsWith(prefix) || prefix === "")
    ) {
      if (!message.member.voice.channel) return;
      if (message.member.voice.channel.id !== voiceChannel) return;
      const args = message.content.slice(0).split(/ +/);
      const cmd = args.shift().toLowerCase();

      const prefixCommand = getCommand(message, cmd);
      if (!prefixCommand) return;

      if (!prefixCommand.musicCommand) return;

      if (message.member.voice.channel?.id !== voiceChannel) return;

      try {
        return await prefixCommand.execute(message, args);
      } catch (err) {
        console.error(err);

        return await handleCommandError(message, err);
      }
    }
    // end of music commands spacial case

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const cmd = args.shift().toLowerCase();

    const prefixCommand = getCommand(message, cmd);
    if (!prefixCommand) return;

    if (prefixCommand.allCommands) return;
    if (prefix === "" && !prefixCommand.musicCommand) return;

    if (prefix === "" && prefixCommand.musicCommand) {
      if (voiceChannel === "" || voiceChannel === null) return;
      if (message.channel.id !== commandChannel) return;
    }

    if (!(await hasPermission(message, prefixCommand, ownerId, admins))) return;

    if (commandChannel !== "" && commandChannel !== null) {
        if (prefixCommand.musicCommand) {
          if (message.channel.id !== commandChannel) return;
        }
    }

    if (
      message.channel.type === ChannelType.GuildVoice &&
      prefixCommand.musicCommand
    ) {
      if (voiceChannel !== null && message.channel.id !== voiceChannel) return;
      if (!voiceChannelChat) return;
      const botVoiceChannel = message.guild.members.cache.get(message.client.user.id).voice.channel;
      if (!botVoiceChannel) return;
      if (botVoiceChannel.id !== message.channel.id) return;

      if (voiceChannel === null) {
        const player = message.client.moon.players.get(message.guild.id);
        if (!player) return;
        if (player.voiceChannel !== message.member.voice.channel.id) return;
      } else {
        if (message.channel.id !== voiceChannel) return;
      }
    }

    if (!(await hasVoiceChannelRequirements(message, prefixCommand))) return;

    try {
      await prefixCommand.execute(message, args);
    } catch (err) {
      console.error(err);

      return await handleCommandError(message, err);
    }
  },
};
