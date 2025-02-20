const fs = require("node:fs");
const path = require("path");

module.exports = (client) => {
  const foldersPath = path.join(__dirname, "../prefix-commands");
  const prefixCommandFolders = fs.readdirSync(foldersPath);

  for (const folder of prefixCommandFolders) {
    const prefixCommandsPath = path.join(foldersPath, folder);
    const prefixCommandsFiles = fs
      .readdirSync(prefixCommandsPath)
      .filter((file) => file.endsWith(".js"));

    console.log(prefixCommandsFiles);

    for (const file of prefixCommandsFiles) {
      const filePath = path.join(prefixCommandsPath, file);
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        client.prefix.set(command.data.name, command);
      } else {
        console.log(
          `The command at ${file} is missing a required "data" or "execute" property.`,
        );
      }
    }
  }
};
