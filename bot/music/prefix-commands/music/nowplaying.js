const { Message, ComponentType } = require("discord.js");
const {
  convert,
  CustomEmbedBuilder,
  errorEmbed,
  interactionServerEmbed,
  interactionErrorEmbed,
  progressBar,
} = require("../../utils/functions");

const { isButtonEnabled } = require("../../lib/info");
const { row2, row3 } = require("../../utils/components");
module.exports = {
  data: {
    name: "nowplaying",
    description: "Show the current music",
    aliases: ["np"],
  },
  musicCommand: true,
  memberVoice: false,
  botVoice: true,
  sameVoice: false,
  /**
   *
   * @param {Message} message
   */
  async execute(message, args) {
    const player = message.client.moon.players.get(message.guild.id);

    if (!player) {
      if (!message.client.embed)
        return message.reply("I am not playing any music");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    if (!player.current) {
      if (!message.client.embed)
        return message.reply("I am not playing any music");
      return message.reply({
        embeds: [
          errorEmbed(message).setDescription("I am not playing any music"),
        ],
      });
    }

    const client = message.client;

    const current = player.current;
    const requester = await client.users.fetch(current.requester || client.user.id);

    const playerEmbed = new CustomEmbedBuilder(client)
      .setColor()
      .setDescription(
        `Now playing: [${current.title}](${current.url})\n${progressBar(current.position, current.duration)}`,
      )
      .setImage(current.artworkUrl)
      .setFooter({
        text: `Requested by ${requester.tag}`,
        iconURL: requester.displayAvatarURL({ size: 1024 }),
      })
      .addFields([
        {
          name: "Song Time",
          value: `${convert(current.duration)}`,
        },
        {
          name: "Current Sound",
          value: `${player.volume}%`,
        },
        {
          name: "Paused status",
          value: "_",
        },
        {
          name: "Loop status",
          value: "_",
        },
        {
          name: "Auto Play",
          value: "_",
        },
      ]);

    playerEmbed.data.fields[2].value = "";
    playerEmbed.data.fields[3].value = "";
    playerEmbed.data.fields[2].name = "";
    playerEmbed.data.fields[3].name = "";
    playerEmbed.data.fields[4].name = "";
    playerEmbed.data.fields[4].value = "";

    const buttonsEnabled = await isButtonEnabled(client.user.id);

    const messageBody = [
      `> Now playing: [${current.title}]`,
      `> Song Time ( ${convert(current.duration)} )`,
      `> Current Sound ( ${player.volume}% )`,
      "> ",
      `> By: <@${requester.id}>`,
    ];

    if (player.loop === 1 || player.loop === 2) {
      playerEmbed.data.fields[3].name = "Loop status";
      playerEmbed.data.fields[3].value =
        player.loop === 1 ? "Song looped" : "Queue looped";

      if (!client.embed) {
        messageBody.splice(3, 0, "> Loop status: Song looped");
      }
    }

    if (!player.playing) {
      playerEmbed.data.fields[2].name = "Paused status";
      playerEmbed.data.fields[2].value = "Paused";

      if (!client.embed) {
        messageBody.splice(3, 0, "> Paused status: Paused");
      }
    }

    if (player.autoplay) {
      playerEmbed.data.fields[4].name = "Auto Play";
      playerEmbed.data.fields[4].value = "ON";
    }

    if (!buttonsEnabled) {
      if (!client.embed)
        return await client.channels.cache
          .get(player.textChannel)
          .send(messageBody.join("\n"));
      return await client.channels.cache.get(player.textChannel).send({
        embeds: [playerEmbed],
      });
    }

    let reply;

    if (!client.embed) {
      reply = await message.reply({
        content: messageBody.join("\n"),
        components: [row2, row3],
      });
    } else {
      reply = await message.reply({
        embeds: [playerEmbed],
        components: [row2, row3],
      });
    }

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: current.duration - current.position,
    });

    client.moon.on("playerStop", async () => {
      player.queue.clear();
      player.loop = 0;

      player.stop(true);
      collector.stop();
    });

    collector.on("collect", async (interaction) => {
      if (interaction.member.voice.channel?.id !== player.voiceChannel) {
        if (!client.embed)
          return interaction.reply({
            content: "You must join my voice channel first",
            ephemeral: true,
          });
        return interaction.reply({
          embeds: [
            interactionErrorEmbed(interaction).setDescription(
              "You must join my voice channel first",
            ),
          ],
          ephemeral: true,
        });
      }

      switch (interaction.customId) {
        case "loop-song":
          if (player.loop === 1) {
            player.loop = 0;
            if (!client.embed) {
              const index = messageBody.indexOf(
                messageBody.find((m) => m.startsWith("> Loop status")),
              );
              messageBody.splice(index, 1);
              interaction.update({
                content: messageBody.join("\n"),
                components: [row2, row3],
              });
            } else {
              playerEmbed.data.fields[3].value = "";
              playerEmbed.data.fields[3].name = "";
              interaction.update({
                embeds: [playerEmbed],
                components: [row2, row3],
              });
            }
          } else {
            player.loop = 1;
            if (!client.embed) {
              // inster new line after the song time
              const index = messageBody.indexOf(
                messageBody.find((m) => m.startsWith("> Loop status")),
              );

              if (index !== -1) messageBody.splice(index, 1);
              messageBody.splice(3, 0, "> Loop status: Song looped");
              interaction.update({
                content: messageBody.join("\n"),
                components: [row2, row3],
              });
            } else {
              playerEmbed.data.fields[3].name = "Loop status";
              playerEmbed.data.fields[3].value = "Song looped";
              interaction.update({
                embeds: [playerEmbed],
                components: [row2, row3],
              });
            }
          }
          break;
        case "previous":
          const previous = player.previous;
          previous.requester = interaction.user.id;

          if (previous.length === 0) {
            if (!client.embed) {
              interaction.reply({
                content: "No previous song",
                ephemeral: true,
              });
            } else {
              interaction.reply({
                embeds: [
                  interactionErrorEmbed(interaction).setDescription(
                    "No previous song",
                  ),
                ],
                ephemeral: true,
              });
            }
            break;
          }

          if (!client.embed) {
            interaction.reply({
              content: `The music has been gone back [${previous.title}]`,
              ephemeral: true,
            });
          } else {
            interaction.reply({
              embeds: [
                interactionServerEmbed(interaction).setDescription(
                  `The music has been gone back [${previous.title}](${previous.url})`,
                ),
              ],
              ephemeral: true,
            });
          }

          collector.stop();
          break;
        case "pauseUnpause":
          if (player.playing) {
            player.pause();
            if (!client.embed) {
              messageBody.splice(3, 0, "> Paused status: Paused");
              interaction.update({
                content: messageBody.join("\n"),
                components: [row2, row3],
              });
            } else {
              playerEmbed.data.fields[2].name = "Paused status";
              playerEmbed.data.fields[2].value = "Paused";

              interaction.update({
                embeds: [playerEmbed],
                components: [row2, row3],
              });
            }
          } else {
            player.resume();
            if (!client.embed) {
              const index = messageBody.indexOf(
                messageBody.find((m) => m.startsWith("> Paused status")),
              );
              messageBody.splice(index, 1);
              interaction.update({
                content: messageBody.join("\n"),
                components: [row2, row3],
              });
            } else {
              playerEmbed.data.fields[2].value = "";
              playerEmbed.data.fields[2].name = "";
              interaction.update({
                embeds: [playerEmbed],
                components: [row2, row3],
              });
            }
          }
          break;
        case "next":
          if (player.queue.size === 0) {
            player.skip();
            if (!client.embed) {
              interaction.reply({
                content: "You have skipped the current song",
                ephemeral: true,
              });
            } else {
              interaction.reply({
                embeds: [
                  interactionServerEmbed(interaction).setDescription(
                    "You have skipped the current song",
                  ),
                ],
                ephemeral: true,
              });
            }

            break;
          }

          player.skip();
          collector.stop();
          if (!client.embed) {
            interaction.reply({
              content: `The music has been skipped [${player.current?.title}]`,
              ephemeral: true,
            });
          } else {
            interaction.reply({
              embeds: [
                interactionServerEmbed(interaction).setDescription(
                  `The music has been skipped [${player.current?.title}](${player.current?.url})`,
                ),
              ],
              ephemeral: true,
            });
          }
          break;
        case "loop-queue":
          if (player.loop === 2) {
            player.loop = 0;
            if (!client.embed) {
              const index = messageBody.indexOf(
                messageBody.find((m) => m.startsWith("> Loop status")),
              );
              messageBody.splice(index, 1);
              interaction.update({
                content: messageBody.join("\n"),
                components: [row2, row3],
              });
            } else {
              playerEmbed.data.fields[3].value = "";
              playerEmbed.data.fields[3].name = "";
              interaction.update({
                embeds: [playerEmbed],
                components: [row2, row3],
              });
            }
          } else {
            player.loop = 2;
            if (!client.embed) {
              const index = messageBody.indexOf(
                messageBody.find((m) => m.startsWith("> Loop status")),
              );
              if (index !== -1) messageBody.splice(index, 1);
              messageBody.splice(3, 0, "> Loop status: Queue looped");
              interaction.update({
                content: messageBody.join("\n"),
                components: [row2, row3],
              });
            } else {
              playerEmbed.data.fields[3].value = "Queue looped";
              playerEmbed.data.fields[3].name = "Loop status";
              interaction.update({
                embeds: [playerEmbed],
                components: [row2, row3],
              });
            }
          }
          break;
        case "vol-down":
          const volumeDown = player.volume - 10;
          player.setVolume(volumeDown);
          if (!client.embed) {
            messageBody[2] = `> Current Sound ( ${volumeDown}% )`;
            interaction.update({
              content: messageBody.join("\n"),
              components: [row2, row3],
            });
          } else {
            playerEmbed.data.fields[1].value = volumeDown + "%";
            interaction.update({
              embeds: [playerEmbed],
              components: [row2, row3],
            });
          }
          break;
        case "backward":
          if (player.current.position > 11000) {
            player.seek(player.current.position - 10000);
          } else {
            player.seek(0);
          }
          if (!client.embed) {
            interaction.reply({
              content: "backward the song 10 seconds",
              ephemeral: true,
            });
          } else {
            interaction.reply({
              embeds: [
                interactionServerEmbed(interaction).setDescription(
                  `backward the song 10 seconds`,
                ),
              ],
              ephemeral: true,
            });
          }

          break;
        case "stop":
          client.moon.emit("playerStop");
          if (!client.embed) {
            interaction.reply({
              content: "The song stopped completely",
              ephemeral: true,
            });
          } else {
            interaction.reply({
              embeds: [
                interactionServerEmbed(interaction).setDescription(
                  `The song stopped completely`,
                ),
              ],
              ephemeral: true,
            });
          }
          break;
        case "forward":
          if (player.current.duration - player.current.position < 10000) {
            player.seek(player.current.duration);
          } else {
            player.seek(player.current.position + 10000);
          }
          if (!client.embed) {
            interaction.reply({
              content: "forward the song 10 seconds",
              ephemeral: true,
            });
          } else {
            interaction.reply({
              embeds: [
                interactionServerEmbed(interaction).setDescription(
                  `forward the song 10 seconds`,
                ),
              ],
              ephemeral: true,
            });
          }
          break;
        case "vol-up":
          const volumeUp = player.volume + 10;
          player.setVolume(volumeUp);
          if (!client.embed) {
            messageBody[2] = `> Current Sound ( ${volumeUp}% )`;
            interaction.update({
              content: messageBody.join("\n"),
              components: [row2, row3],
            });
          } else {
            playerEmbed.data.fields[1].value = volumeUp + "%";
            interaction.update({
              embeds: [playerEmbed],
              components: [row2, row3],
            });
          }
          break;
      }
    });

    collector.on("end", async (collection, reason) => {
      if (["messageDelete", "messageDeleteBulk"].includes(reason)) return;
      await reply.edit({ components: [] }).catch(() => null);
    });
  },
};
