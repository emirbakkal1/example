const { Events } = require("discord.js");
const ID_EXTRACT_REGEX = /\{(.*?)\}/g;

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

    let interactionWithId = interaction.customId;
    const matches = ID_EXTRACT_REGEX.exec(interactionWithId);
    if (matches && matches.length > 1 && matches[1]) {
      interactionWithId = interactionWithId.replace(matches[1], "id");
    }

    const interactionAction =
      interaction.client.interactions.get(interaction.customId) ||
      interaction.client.interactions.get(interactionWithId);

    if (!interactionAction) return;

    try {
      await interactionAction.execute(interaction);
    } catch (err) {
      interaction.editReply("there was an error executing this command. 😫");
      console.error(err);
    }
  },
};
