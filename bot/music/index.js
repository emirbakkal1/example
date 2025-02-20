const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { MoonlinkManager } = require("moonlink.js");
require("dotenv").config();

const MUSIC_BOT_TOKEN = process.env.MUSIC_BOT_TOKEN;
const HOST = process.env.HOST;
const PORT = process.env.PORT;
const PASSWORD = process.env.PASSWORD;

const { Guilds, GuildVoiceStates, GuildMessages, MessageContent } =
  GatewayIntentBits;

const client = new Client({
  intents: [Guilds, GuildVoiceStates, GuildMessages, MessageContent],
});

// Configuring the Moonlink.js package
const nodes = [
  {
    host: HOST,
    port: Number(PORT),
    secure: false,
    password: PASSWORD,
    retryAmount: 5,
    retryDelay: 10,
  },
];

client.moon = new MoonlinkManager(
  nodes,
  {
    /* Options */
  },
  (guild, sPayload) => {
    client.guilds.cache.get(guild).shard.send(JSON.parse(sPayload));
  },
);

// nodeReconnect
client.moon.on("nodeReconnect", (node) => {
  console.log(`Node ${node} has reconnected`);
});

client.moon.on("nodeError", (node, error) => {
  process.exit(1);
});

// nodeDestroy
client.moon.on("nodeDestroy", (node) => {
  console.log(`Node ${node.options.identifier} has been destroyed`);
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

client.prefix = new Collection();
client.interactions = new Collection();
client.embedColor = null;
client.embed = true;

[
  "prefix_command_handler",
  "event_handler",
  "interaction_handler",
].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

client.on("raw", (data) => {
  // Updating the Moonlink.js package with the necessary data
  client.moon.packetUpdate(data);
});

client.on("customEventTest", (data) => {
  console.log(data);
});

client.login(process.argv[2] || MUSIC_BOT_TOKEN);
