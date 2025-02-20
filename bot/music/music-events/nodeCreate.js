module.exports = {
  name: "nodeCreate",
  execute(client, node) {
    console.log(
      `${node.host} was connected, and the magic is in the air ${client.user.username}!`,
    );
  },
};
