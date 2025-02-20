const {
  Message,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { serverEmbed } = require("../../utils/functions");
const { prisma } = require("../../../../src/database/db");
module.exports = {
  data: {
    name: "help",
    description: "Help command",
  },
  /**
   *
   * @param {Message} message
   * @param {*} args
   * @returns
   */
  async execute(message, args) {
    const helpButton = new ButtonBuilder()
      .setLabel("Help")
      .setStyle(ButtonStyle.Link)
      .setURL("http://discord.com");

    const row = new ActionRowBuilder().addComponents(helpButton);

    const bot = await prisma.setting.findFirst({
      where: {
        token: {
          botId: message.client.user.id,
        },
      },
      select: {
        prefix: true,
      },
    });

    const isOwner = await prisma.token.findFirst({
      where: {
        AND: [
          {
            subscription: {
              customerId: message.author.id,
            },
          },
          {
            botId: message.client.user.id,
          },
        ],
      },
    });

    const isAdmin = await prisma.token.findFirst({
      where: {
        AND: [
          {
            setting: {
              admins: {
                has: message.author.id,
              },
            },
          },
          {
            botId: message.client.user.id,
          },
        ],
      },
    });

    const prefix = bot.prefix;

    const musicEmbed = serverEmbed(message)
      .setTitle("Music Commands")
      .setDescription(
        `* ${prefix}play : Play song from youtube or soundcloud or spotify or platforms supported by lavalink\n` +
          `* ${prefix}stop : Stop the music\n` +
          `* ${prefix}pause : Pause the song\n` +
          `* ${prefix}resume : Resume the song\n` +
          `* ${prefix}queue : Displays the queue\n` +
          `* ${prefix}skip : Skip to the next song or any song in queue\n` +
          `* ${prefix}skipto : Skips to a certain position in the queue\n` +
          `* ${prefix}back : Back to the previous song\n` +
          `* ${prefix}volume : Change the volume\n` +
          `* ${prefix}autoplay :  Toggle autoplay on/off\n` +
          `* ${prefix}nowplaying : Displays info about the song\n` +
          `* ${prefix}clear : Remove the queue and stop the song\n` +
          `* ${prefix}loop : Repeat the song\n` +
          `* ${prefix}loopqueue : Repeat the queue\n` +
          `* ${prefix}shuffle : Shuffles the queue\n` +
          `* ${prefix}move : Move a song to the top of the queue or to specific position\n` +
          `* ${prefix}remove : Remove songs from queue\n` +
          `* ${prefix}search : Search in Youtube\n` +
          `* ${prefix}scsearch : Search in Soundcloud\n` +
          `* ${prefix}seek : Change the position of the track or to specific time\n` +
          `* ${prefix}forward : Forwards the playing song to a specific number of seconds\n` +
          `* ${prefix}backward : Backwards the playing song to a specific number of seconds`,
      );

    const embed = [musicEmbed];

    if (isOwner) {
      console.log("owner");
      const controllIndividualOwner = serverEmbed(message)
        .setTitle("Commands to control each music bot individually")
        .setDescription(
          `* ${prefix}changeowner : Change ownership of bot to another person\n` +
            `* ${prefix}addadmin : Add admin to bot\n` +
            `* ${prefix}removeadmin : Remove admin to bot\n` +
            `* ${prefix}showadmin : Show admins to bot\n` +
            `* ${prefix}setname : Change the name of the bot\n` +
            `* ${prefix}setavatar : Change the avatar of the bot\n` +
            `* ${prefix}setbanner : Change the banner of the bot\n` +
            `* ${prefix}setstatus : Change the status of the bot\n` +
            `* ${prefix}setgame : Change the game of the bot\n` +
            `* ${prefix}restart : Restart bot\n` +
            `* ${prefix}prefix [prefix] : Change the bot prefix\n` +
            `* ${prefix}embed [#hex color OR off] : Activate embed and specify its color or disable it\n` +
            `* ${prefix}buttons [on OR off] : Activate or disable the buttons\n` +
            `* ${prefix}chat : Define a commands text channel for bot\n` +
            `* ${prefix}come : Select a fixed voice channel for bot\n` +
            `* ${prefix}leave : De-selecting the bot's fixed voice channel and exiting the bot from the voice channel\n` +
            `* ${prefix}setup : Select a fixed voice channel for the bot + change the bot name to the name of the voice channel\n` +
            `* ${prefix}playinvc : Allow the bot to use music commands in the voice channel chat or not\n` +
            `* ${prefix}setting : Display bot settings\n` +
            `* ${prefix}setserver : To change the server of bot\n` +
            `* ${prefix}link : Sends invite link bot`,
        );

      embed.push(controllIndividualOwner);

      const controllAllOwner = serverEmbed(message)
        .setTitle(
          "Commands to control all music bots (specific to the main music bot)",
        )
        .setDescription(
          `* #changeownerall : Change ownership of all bots to another person\n` +
            `* #addadminall : Add admin to all bots\n` +
            `* #removeadminall : Remove admin to all bots\n` +
            `* #showadminall : Show admins to all bots\n` +
            `* #avatarall : Change the avatar of all bots\n` +
            `* #bannerall : Change the banner of all bots\n` +
            `* #setstatusall : Change the status of all bots\n` +
            `* #setgameall : Change the game of all bots\n` +
            `* #restartall : Restart all bots\n` +
            `* #noprefixall : Disable the prefix for all bots\n` +
            `* #embedall [#hex color OR off] : Activate embed and specify its color or disable it\n` +
            `* #buttonsall [on OR off] : Activate or disable the buttons\n` +
            `* #chatall : Define a commands text channel for all bots\n` +
            `* #comeall : Select a fixed voice channel for all bots\n` +
            `* #leaveall : De-selecting the all bots fixed voice channel and exiting the all bot from the voice channel\n` +
            `* #playinvcall : Allow the use of music commands for all bots in the voice channel chat or not\n` +
            `* #setserverall : To change the server of all bots\n` +
            `* #linksall : Sends all invite links each bot`,
        );

      embed.push(controllAllOwner);
    }

    if (isAdmin) {
      console.log("admin");
      const controllIndividualAdmin = serverEmbed(message)
        .setTitle("Commands to control each music bot individually")
        .setDescription(
          `* ${prefix}setname : Change the name of the bot\n` +
            `* ${prefix}setavatar : Change the avatar of the bot\n` +
            `* ${prefix}setbanner : Change the banner of the bot\n` +
            `* ${prefix}setstatus : Change the status of the bot\n` +
            `* ${prefix}setgame : Change the game of the bot\n` +
            `* ${prefix}restart : Restart bot\n` +
            `* ${prefix}prefix [prefix] : Change the bot prefix\n` +
            `* ${prefix}embed [#hex color OR off] : Activate embed and specify its color or disable it\n` +
            `* ${prefix}buttons [on OR off] : Activate or disable the buttons\n` +
            `* ${prefix}chat : Define a commands text channel for bot\n` +
            `* ${prefix}come : Select a fixed voice channel for bot\n` +
            `* ${prefix}leave : De-selecting the bot's fixed voice channel and exiting the bot from the voice channel\n` +
            `* ${prefix}setup : Select a fixed voice channel for the bot + change the bot name to the name of the voice channel\n` +
            `* ${prefix}playinvc : Allow the bot to use music commands in the voice channel chat or not\n` +
            `* ${prefix}setting : Display bot settings`,
        );

      embed.push(controllIndividualAdmin);

      const controllAllAdmin = serverEmbed(message)
        .setTitle(
          "Commands to control all music bots (specific to the main music bot)",
        )
        .setDescription(
          `* #avatarall : Change the avatar of all bots\n` +
            `* #bannerall : Change the banner of all bots\n` +
            `* #setstatusall : Change the status of all bots\n` +
            `* #setgameall : Change the game of all bots\n` +
            `* #restartall : Restart all bots\n` +
            `* #noprefixall : Disable the prefix for all bots\n` +
            `* #embedall [#hex color OR off] : Activate embed and specify its color or disable it\n` +
            `* #buttonsall [on OR off] : Activate or disable the buttons\n` +
            `* #chatall : Define a commands text channel for all bots\n` +
            `* #comeall : Select a fixed voice channel for all bots\n` +
            `* #leaveall : De-selecting the all bots fixed voice channel and exiting the all bot from the voice channel\n` +
            `* #playinvcall : Allow the use of music commands for all bots in the voice channel chat or not`,
        );

      embed.push(controllAllAdmin);
    }

    message.author.createDM().then((dm) => {
      dm.send({
        embeds: embed,
        components: [row],
      })
        .then(() => {
          message.react("✅");
        })
        .catch(async (err) => {
          await message.reply(
            "I can't send you a DM! Make sure you have DMs enabled.",
          );
        });
    });
  },
};
