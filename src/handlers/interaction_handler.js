const fs = require('node:fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = (client) => {
  const foldersPath = path.join(__dirname, '../interactions');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const interactionsPath = path.join(foldersPath, folder);
    const interactionsFiles = fs.readdirSync(interactionsPath).filter((file) => file.endsWith('.js'));

    for (const file of interactionsFiles) {
      const filePath = path.join(interactionsPath, file);
      const interaction = require(filePath);

      if ('name' in interaction && 'execute' in interaction) {
        client.interactions.set(interaction.name, interaction);
      } else {
        logger.warn(`The command at ${file} is missing a required "name" or "execute" property.`);
      }
    }
  }
};