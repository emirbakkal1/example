const getPrefixCommand = (message, prefix) => {
  const args = message.content.slice(prefix.length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  const prefixCommand =
    message.client.prefix.get(cmd) ||
    message.client.prefix.find(
      (c) => c.data.aliases && c.data.aliases.includes(cmd),
    );

  return prefixCommand;
};

module.exports = { getPrefixCommand };
