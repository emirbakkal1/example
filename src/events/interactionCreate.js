const { Events } = require("discord.js");
const logger = require("../utils/logger");
const { ID_EXTRACT_REGEX } = require("../utils/constants");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (
      !interaction.isStringSelectMenu() &&
      !interaction.isButton() &&
      !interaction.isModalSubmit() &&
      !interaction.isChatInputCommand() &&
      !interaction.isUserContextMenuCommand() &&
      !interaction.isMessageContextMenuCommand()
    ) {
      return;
    }

    if (interaction.customId === "select-manage-bot") {
      const value = interaction.values[0];

      const interactionAction = interaction.client.interactionsValue.get(value);

      if (!interactionAction) return;

      try {
        await interactionAction.execute(interaction);
      } catch (err) {
        interaction.editReply(
          err.message || "there was an error executing this command. 😫",
        );
        logger.error(err);
      }

      return;
    }

    let interactionWithId = interaction.customId;
    const matches = ID_EXTRACT_REGEX.exec(interactionWithId);
    if (matches && matches.length > 1 && matches[1]) {
      interactionWithId = interactionWithId.replace(matches[1], "id");
    }

    const interactionAction =
      interaction.client.interactions.get(interaction.customId) ||
      interaction.client.slash.get(interaction.commandName) ||
      interaction.client.interactions.get(interactionWithId);

    if (!interactionAction) return;

    try {
      await interactionAction.execute(interaction);
    } catch (err) {
      interaction.editReply(
        err.message || "there was an error executing this command. 😫",
      );
      logger.error(err);
      console.error(err);
    }
  },
};
