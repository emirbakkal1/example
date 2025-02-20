const {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const { listTokens, addToken, removeToken } = require("../../lib/tokens");
const { logChannelId } = require("../../config.json");
const { interactionServerEmbed, capitalize } = require("../../utils/functions");

const processEmbed = (dataArray, interaction, type, isRemove) => {
  const messages = {
    already: [],
    success: [],
    invalid: [],
    active: [],
  };

  const ALREADY = "already exists";
  const SUCCESS = "success";
  const INVALID = "invalid token";
  const ACTIVE = "active";

  // Process each item in dataArray
  dataArray.forEach((data) => {
    if (data.startsWith(ALREADY)) {
      messages.already.push(data.substring(ALREADY.length + 1));
    } else if (data.startsWith(SUCCESS)) {
      messages.success.push(data.substring(SUCCESS.length + 1));
    } else if (data.startsWith(INVALID)) {
      messages.invalid.push(data.substring(INVALID.length + 1));
    } else if (data.startsWith(ACTIVE)) {
      messages.active.push(data.substring(ACTIVE.length + 1));
    }
  });

  // Create an array to store MessageEmbed objects
  const embeds = [];
  let successEmbed;

  // Create an embed for each message type if there are any messages
  if (messages.already.length > 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("Already Exists")
      .setDescription(messages.already.join("\n"));
    embeds.push(embed);
  }

  if (messages.success.length > 0) {
    successEmbed = interactionServerEmbed(interaction, interaction.user)
      .setTitle("Tokens")
      .setDescription(
        `${isRemove ? "" : `* **Type of bot added to it :**\n * ${capitalize(type)}\n`}* **Number of tokens ${isRemove ? "removed" : "added"} :** \n * ${messages.success.length}\n* **Administrator :** \n * <@${interaction.user.id}>`,
      );
    embeds.push(successEmbed);
  }

  if (messages.invalid.length > 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff9900")
      .setTitle("Invalid Token")
      .setDescription(messages.invalid.join("\n"));
    embeds.push(embed);
  }

  if (messages.active.length > 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("Active Tokens")
      .setDescription(messages.active.join("\n"));
    embeds.push(embed);
  }

  return {
    embeds,
    successEmbed,
  };
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tokens")
    .setDescription("List, add or remove tokens from the database.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Lists all tokens from the database.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type to filter tokens.")
            .setChoices(
              { name: "Music BOT", value: "music" },
              { name: "Bank BOT", value: "bank" }
            )
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a token to the database.")
        .addStringOption((option) =>
          option
            .setName("token")
            .setDescription("The token to be added.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("The bot type for the token.")
            .setChoices(
              { name: "Music BOT", value: "music" },
              { name: "Bank BOT", value: "bank" }
            )
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Removes a token from the database.")
        .addStringOption((option) =>
          option
            .setName("token")
            .setDescription("The token to be removed.")
            .setRequired(true),
        ),
    ),

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "list": {
        const type = interaction.options.getString("type");
        return await listTokens(interaction, type);
      }
      case "add": {
        const token = interaction.options.getString("token");
        const tokenArray = token.split(":");
        console.log(tokenArray);
        const type = interaction.options.getString("type");

        const dataArray = [];
        for (const token of tokenArray) {
          const message = await addToken(interaction, token.trim(), type);
          dataArray.push(message);
        }

        const { embeds, successEmbed } = processEmbed(
          dataArray,
          interaction,
          type,
          false,
        );

        if (successEmbed) {
          const logChannel = await interaction.guild.channels.fetch(
            logChannelId,
            {
              force: true,
            },
          );

          if (logChannel) {
            logChannel.send({
              embeds: [successEmbed],
            });
          }
        }

        return await interaction.editReply({
          embeds,
        });
      }
      case "remove": {
        const token = interaction.options.getString("token");
        const tokenArray = token.split(":");
        console.log(tokenArray);

        const dataArray = [];
        for (const token of tokenArray) {
          const message = await removeToken(interaction, token.trim());
          dataArray.push(message);
        }

        const { embeds, successEmbed } = processEmbed(
          dataArray,
          interaction,
          "music",
          true,
        );

        if (successEmbed) {
          const logChannel = await interaction.guild.channels.fetch(
            logChannelId,
            {
              force: true,
            },
          );

          if (logChannel) {
            logChannel.send({
              embeds: [successEmbed],
            });
          }
        }

        return await interaction.editReply({
          embeds,
        });
      }
      default:
        return await interaction.editReply("Invalid subcommand.");
    }
  },
};
