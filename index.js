require("dotenv").config();

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { TOKEN } = process.env;

const { Guilds, GuildMessages, GuildModeration, MessageContent } =
  GatewayIntentBits;

const client = new Client({
  intents: [Guilds, GuildMessages, GuildModeration, MessageContent],
});

// Anti Crash
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log("Uncaught Exception Monitor:", err, origin);
});

client.commands = new Collection();
client.interactions = new Collection();
client.interactionsValue = new Collection();
client.slash = new Collection();
client.guessingGame = new Collection();
client.registerSlashCommands = require("./src/utils/registerSlash");
client.cooldowns = new Collection();

[
  "event_handler",
  "command_handler",
  "interaction_handler",
  "task_handler",
  "interaction_value_handler",
].forEach((handler) => {
  require(`./src/handlers/${handler}`)(client);
});

client.login(TOKEN);
