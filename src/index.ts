import { app, BrowserWindow, ipcMain, session } from "electron";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import path from "path";
import {
  ActivityType,
  Client as d_Client,
  REST as d_REST,
  Routes as d_Routes,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";

interface NumOption {
  name: string;
  selector: string;
  min: number;
  max: number;
}

interface BoolOption {
  name: string;
  selector: string;
}

interface ThenValue {
  name: string;
  value: boolean | number;
}

interface Preset {
  name: string;
  selector: string;
  thenValue?: ThenValue[];
}

dotenv.config();

let roomid = "";
let playid = "";

const num_options: NumOption[] = [
  {
    name: "중력",
    selector: "game.options.g",
    min: 0,
    max: 20,
  },
  {
    name: "중력 증가량",
    selector: "game.options.gincrease",
    min: 0,
    max: 1,
  },
  {
    name: "중력 공백 시간",
    selector: "game.options.gmargin",
    min: 0,
    max: 100000,
  },
  {
    name: "쓰래기 배수",
    selector: "game.options.garbagemultiplier",
    min: 0,
    max: 100,
  },
  {
    name: "쓰래기 공백 시간",
    selector: "game.options.garbagemargin",
    min: 0,
    max: 100000,
  },
  {
    name: "쓰래기 배수 증가량",
    selector: "game.options.garbageincrease",
    min: 0,
    max: 1,
  },
  {
    name: "땅에서 있을 수 있는 최대 시간",
    selector: "game.options.locktime",
    min: 1,
    max: 7200,
  },
  {
    name: "쓰래기가 돌아다니는 시간",
    selector: "game.options.garbagespeed",
    min: 1,
    max: 600,
  },
  {
    name: "garbage cap",
    selector: "game.options.garbagecap",
    min: 1,
    max: 40,
  },
  {
    name: "garbage cap increase",
    selector: "game.options.garbagecapincrease",
    min: 0,
    max: 1,
  },
  {
    name: "garbage cap max",
    selector: "game.options.garbagecapmax",
    min: 1,
    max: 40,
  },
  {
    name: "가로 크기",
    selector: "game.options.boardwidth",
    min: 4,
    max: 20,
  },
  {
    name: "세로 크기",
    selector: "game.options.boardheight",
    min: 4,
    max: 40,
  },
  {
    name: "보여주는 다음 조각의 수",
    selector: "game.options.nextcount",
    min: 1,
    max: 5,
  },
  {
    name: "ARE",
    selector: "game.options.are",
    min: 0,
    max: 300,
  },
  {
    name: "line clear ARE",
    selector: "game.options.lineclear_are",
    min: 0,
    max: 300,
  },
  {
    name: "enforced ARR",
    selector: "game.options.room_handling_arr",
    min: 0,
    max: 5,
  },
  {
    name: "enforced DAS",
    selector: "game.options.room_handling_das",
    min: 1,
    max: 20,
  },
  {
    name: "enforced SDF",
    selector: "game.options.room_handling_sdf",
    min: 5,
    max: 21,
  },
];
const bool_options: BoolOption[] = [
  {
    name: "allow 180 spins",
    selector: "game.options.allow180",
  },
  {
    name: "use hard drop",
    selector: "game.options.allow_harddrop",
  },
  {
    name: "use NEXT queue",
    selector: "game.options.display_next",
  },
  {
    name: "use HOLD queue",
    selector: "game.options.display_hold",
  },
  {
    name: "show shadow piece",
    selector: "game.options.display_shadow",
  },
  {
    name: "enforce below handling settings",
    selector: "game.options.room_handling",
  },
  {
    name: "garbage passthrough",
    selector: "game.options.passthrough",
  },
  {
    name: "allow manual targeting",
    selector: "game.options.manual_allowed",
  },
  {
    name: "enable back-to-back chaining",
    selector: "game.options.b2bchaining",
  },
  {
    name: "enable clutch clears",
    selector: "game.options.clutch",
  },
  {
    name: "disable lockout",
    selector: "game.options.nolockout",
  },
];
const presets: Preset[] = [
  {
    name: "DEFAULT",
    selector: "default",
  },
  {
    name: "TETRA LEAGUE",
    selector: "tetra league",
  },
  {
    name: "CLASSIC",
    selector: "classic",
  },
  {
    name: "ARCADE",
    selector: "arcade",
  },
  {
    name: "ENFORCED DELAYS",
    selector: "enforced delays",
  },
  {
    name: "QUICK PLAY",
    selector: "quickplay",
  },
  {
    name: "4x20",
    selector: "___default",
    thenValue: [
      {
        name: "가로 크기",
        value: 4,
      },
    ],
  },
  {
    name: "5x5",
    selector: "___default",
    thenValue: [
      {
        name: "가로 크기",
        value: 5,
      },
      {
        name: "세로 크기",
        value: 5,
      },
    ],
  },
];

const token = process.env.DISCORD || "";
const client = new d_Client({ intents: [] });
const rest = new d_REST({ version: "10" }).setToken(token);
const discordCommands: SlashCommandBuilder[] = [
  new SlashCommandBuilder()
    .setName("roomid")
    .setDescription("Tetrio 방의 코드를 알 수 있어요"),
  new SlashCommandBuilder().setName("play").setDescription("게임을 시작해요"),
  new SlashCommandBuilder()
    .addSubcommand((i) => {
      return i
        .addStringOption((s) => {
          num_options.map((i) =>
            s.addChoices({
              name: i.name,
              value: i.selector,
            })
          );
          return s
            .setName("opt")
            .setDescription("변경할 게임의 옵션을 선택해 주세요")
            .setRequired(true);
        })
        .addNumberOption((n) =>
          n
            .setName("val")
            .setDescription("값을 설정해 주세요.")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(100000)
        )
        .setName("숫자")
        .setDescription("숫자로 값을 가질 수 있는 설정을 변경해요.");
    })
    .addSubcommand((i) => {
      return i
        .addStringOption((s) => {
          bool_options.map((i) =>
            s.addChoices({
              name: i.name,
              value: i.selector,
            })
          );
          return s
            .setName("opt")
            .setDescription("변경할 게임의 옵션을 선택해 주세요")
            .setRequired(true);
        })
        .addBooleanOption((n) =>
          n
            .setName("val")
            .setDescription("값을 설정해 주세요.")
            .setRequired(true)
        )
        .setName("참거짓")
        .setDescription("참거짓을 값을 가질 수 있는 설정을 변경해요.");
    })
    .setName("options")
    .setDescription("게임의 설정을 변경해요"),
  new SlashCommandBuilder()
    .addStringOption((s) => {
      presets.map((i) => {
        s.addChoices({
          name: i.name,
          value: i.selector,
        });
      });
      return s.setName("pre").setRequired(true).setDescription("프리셋");
    })
    .setName("preset")
    .setDescription("게임 프리셋을 지정해요."),
  new SlashCommandBuilder()
    .setName("spectator")
    .setDescription("관전자 모드로 변경해요."),
  new SlashCommandBuilder()
    .setName("player")
    .setDescription("플레이어 모드로 변경해요."),
];
const optChangeScript = readFileSync(
  path.join(__dirname, "..", "optChange.js")
).toString();
const optChangeBoolScript = readFileSync(
  path.join(__dirname, "..", "optChangeBool.js")
).toString();
const initScript = readFileSync(
  path.join(__dirname, "..", "inject.js")
).toString();
const injectScript = readFileSync(
  path.join(__dirname, "..", "injectS2.js")
).toString();
const injectAllScript = readFileSync(
  path.join(__dirname, "..", "injectToAll.js")
).toString();

let win: BrowserWindow;
let bot: d_Client<true>;
let spectating = true;
let playing = false;

const rpcer = (name: string, url: string) => {
  if (!bot) return;
  bot.user.setActivity({
    name: name,
    type: ActivityType.Playing,
    url: url,
  });
};

const createWindow = () => {
  win = new BrowserWindow({
    width: 100,
    height: 1,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("https://tetr.io/");

  win.webContents.on("dom-ready", () => {
    win.webContents.executeJavaScript(injectAllScript);
  });

  win.webContents.session.on("will-download", (event, item, web) => {
    item.setSavePath(path.join(__dirname, "game.ttrm"));

    item.on("done", async () => {
      const waitID = () => {
        return new Promise<void>((resolve, reject) => {
          let inter = setInterval(() => {
            if (playid.length > 0) {
              clearInterval(inter);
              return resolve();
            }
            return;
          }, 50);
        });
      };

      await waitID();

      ((await bot.channels.fetch("1076518532797452419")) as TextChannel).send({
        content: `**PLAYID ${playid}**`,
        files: [path.join(__dirname, "game.ttrm")],
      });
    });
  });

  win.webContents.once("dom-ready", async () => {
    await win.webContents.executeJavaScript(
      initScript
        .replace("__ENV__ID__", process.env.ID || "")
        .replace("__ENV__PW__", process.env.PW || "")
    );

    win.webContents.reload();

    roomid = await win.webContents.executeJavaScript(
      injectScript
        .replace("__ENV__ID__", process.env.ID || "")
        .replace("__ENV__PW__", process.env.PW || "")
    );

    win.webContents.on("dom-ready", async () => {
      roomid = await win.webContents.executeJavaScript(
        injectScript
          .replace("__ENV__ID__", process.env.ID || "")
          .replace("__ENV__PW__", process.env.PW || "")
      );
    });

    rpcer(`Tetr.io 방 관리중 / ${roomid}`, `https://tetr.io/${roomid}`);
  });

  win.webContents.setAudioMuted(true);
};

app.whenReady().then(async () => {
  await session.defaultSession.clearStorageData();
  await session.defaultSession.clearAuthCache();
  await session.defaultSession.clearHostResolverCache();
  await session.defaultSession.clearCache();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

client.on("ready", async (bot_) => {
  bot = bot_;

  console.log("[Discord Boot]", `Logged in as ${bot.user.tag}!`);

  if (roomid.length == 0) rpcer("Tetr.io 키는중...", "https://tetr.io/");
  else rpcer(`Tetr.io 방 관리중 / ${roomid}`, `https://tetr.io/${roomid}`);

  (async () => {
    try {
      console.log(
        "[Discord Boot]",
        "Started refreshing application (/) commands."
      );

      await rest.put(d_Routes.applicationCommands(bot.user.id), {
        body: discordCommands.map((i) => i.toJSON()),
      });

      console.log(
        "[Discord Boot]",
        "Successfully reloaded application (/) commands."
      );
    } catch (error) {
      console.error(error);
    }
  })();

  (() => {
    ipcMain.handle("event.game.end", async (event) => {
      rpcer(`TETR.IO ${roomid} / 게임 메뉴`, `https://tetr.io/${roomid}`);
      playing = false;
      return 0;
    });
    ipcMain.handle("data.game.crash", async () => {
      roomid = "";
      rpcer("Tetr.io 키는중...", "https://tetr.io/");
      playing = false;
      return 0;
    });
    ipcMain.handle("data.game.winner", async (event: any, winnerID: string) => {
      playid = `T${new Date().getTime()}`;
      ((await bot.channels.fetch("1076379331456147468")) as TextChannel)?.send({
        embeds: [
          {
            title: "Winner 👑",
            description: `is \`${winnerID}\``,
            fields: [
              {
                name: "Winner Profile URL",
                value: `https://ch.tetr.io/u/${winnerID}`,
              },
              {
                name: "PLAY_ID",
                value: playid,
              },
            ],
          },
        ],
      });
    });
  })();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  let commandName = interaction.commandName;

  if (roomid.length == 0) {
    interaction.reply("아직 Tetr.io를 키고 있어요.");
    return;
  }

  switch (commandName) {
    case "roomid":
      if (roomid.length > 0)
        interaction.reply(
          `> 방 ID는 \`` + roomid + `\`입니다!\n> https://tetr.io/${roomid}`
        );
      return;
    case "play":
      if (playing) {
        interaction.reply("아직 게임이 진행중 이에요.");
        return;
      }
      if (
        parseInt(
          (await win.webContents.executeJavaScript(
            "document.getElementById('playercount').innerText"
          )) || "0"
        ) < 2
      ) {
        interaction.reply("플레이어 수가 부족해요.");
        return;
      }

      playing = true;

      console.log("[Electron]", "Request Play");

      rpcer(
        `TETR.IO ${roomid} / 게임 ${spectating ? "관전" : "플레이"}중..`,
        `https://tetr.io/${roomid}`
      );
      interaction.reply(`게임 시작을 요청했어요! 곧 시작될테니 준비하세요.`);
      win.webContents.executeJavaScript(
        `document.getElementById("startroom").click()`
      );
      return;
    case "options":
      if (playing) {
        interaction.reply("아직 게임이 진행중 이에요.");
        return;
      }

      const scommand = interaction.options.getSubcommand(true);
      const type = interaction.options.getString("opt") || "";

      console.log("[Electron]", "Option change", scommand, type);

      switch (scommand) {
        case "숫자":
          (async () => {
            const val = interaction.options.getNumber("val") || 0;

            let opta = num_options.filter((i) => i.selector == type)[0];

            if (val < opta.min || val > opta.max) {
              interaction.reply(
                `잘못된 값이에요. \`${opta.name}\`은(는) \`${opta.min}\` 과 \`${opta.max}\`사이로만 값을 정할 수 있어요.`
              );
              return;
            }

            await win.webContents.executeJavaScript(
              optChangeScript
                .replace("${sel}", type)
                .replace("${val}", val.toString())
            );

            interaction.reply("설정이 변경됬을 꺼에요.");
          })();
          return;
        case "참거짓":
          (async () => {
            const val = interaction.options.getBoolean("val") || false;

            await win.webContents.executeJavaScript(
              optChangeBoolScript
                .replace("__sel__", type)
                .replace("__val__", val ? "true" : "false")
            );

            interaction.reply("설정이 변경됬을 꺼에요.");
          })();

          return;
        default:
          return;
      }
    case "preset":
      if (playing) {
        interaction.reply("아직 게임이 진행중 이에요.");
        return;
      }

      const pres = interaction.options.getString("pre") || "";
      interaction.reply("프리셋을 설정했어요.");
      await win.webContents.executeJavaScript(
        `document.getElementById("game-presets").click(); document.querySelector('#list_request_scroller > div[data-id="${pres.replace(
          "___",
          ""
        )}"]').click();`
      );

      if (!pres.startsWith("___")) return;
      let pr = presets.filter((i) => i.selector == pres)[0];
      if (!pr.thenValue) return;

      pr.thenValue.forEach(async (i) => {
        if (typeof i.value == "number") {
          let op = num_options.filter((g) => g.name == i.name)[0];
          await win.webContents.executeJavaScript(
            optChangeScript
              .replace("${sel}", op.selector)
              .replace("${val}", i.value.toString())
          );
          return;
        }

        let op = bool_options.filter((g) => g.name == i.name)[0];
        await win.webContents.executeJavaScript(
          optChangeBoolScript
            .replace("__sel__", op.selector)
            .replace("__val__", i.value ? "true" : "false")
        );
      });

      return;
    case "spectator":
      if (spectating) {
        interaction.reply("이미 관전자 모드에요.");
        return;
      }
      if (playing) {
        interaction.reply("아직 게임이 진행중 이에요.");
        return;
      }
      spectating = true;
      win.webContents.executeJavaScript("isSpectator = true;");
      interaction.reply("관전자 모드로 변경했어요.");
      return;
    case "player":
      if (!spectating) {
        interaction.reply("이미 플레이어 모드에요.");
        return;
      }
      if (playing) {
        interaction.reply("아직 게임이 진행중 이에요.");
        return;
      }
      win.webContents.executeJavaScript("isSpectator = false;");
      interaction.reply("플레이어 모드로 변경했어요.");
      spectating = false;
      return;
    default:
      return;
  }
});
client.login(token);
