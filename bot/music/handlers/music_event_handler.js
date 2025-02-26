const fs = require("node:fs");
const path = require("path");

module.exports = (client) => {
  const eventsPath = path.join(__dirname, "../music-events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    client.moon.on(event.name, (...args) => event.execute(client, ...args));
  }
};
