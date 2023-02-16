import { app, BrowserWindow, session } from "electron";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import path from "path";
import {
  ActivityType,
  Client as d_Client,
  REST as d_REST,
  Routes as d_Routes,
  SlashCommandBuilder,
} from "discord.js";

interface Option {
  name: string;
  selector: string;
}

dotenv.config();

let roomid = "";
const options: Option[] = [
  {
    name: "가로 크기",
    selector: "game.options.boardwidth",
  },
  {
    name: "세로 크기",
    selector: "game.options.boardheight",
  },
  {
    name: "중력",
    selector: "game.options.g",
  },
  {
    name: "중력 증가",
    selector: "game.options.gincrease",
  },
  {
    name: "쓰래기 배수",
    selector: "game.options.garbagemultiplier",
  },
  {
    name: "쓰래기 배수 증가",
    selector: "game.options.garbageincrease",
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
    .addStringOption((s) => {
      options.map((i) =>
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
        .setMaxValue(40)
    )
    .setName("options")
    .setDescription("게임 설정을 변경해요"),
  new SlashCommandBuilder()
    .addStringOption((s) =>
      s.setName("pre").setRequired(true).setDescription("프리셋")
    )
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
const initScript = readFileSync(
  path.join(__dirname, "..", "inject.js")
).toString();
const isPlayingScript = readFileSync(
  path.join(__dirname, "..", "isPlaying.js")
).toString();

let win: BrowserWindow;
let bot: d_Client<true>;

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
    height: 90,
  });

  win.loadURL("https://tetr.io/");

  win.webContents.once("dom-ready", async () => {
    roomid = await win.webContents.executeJavaScript(
      initScript
        .replace("__ENV__ID__", process.env.ID || "")
        .replace("__ENV__PW__", process.env.PW || "")
    );

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

const isPlaying = async (): Promise<boolean> => {
  return await win.webContents.executeJavaScript(isPlayingScript);
};

client.on("ready", (bot_) => {
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

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    let commandName = interaction.commandName;

    if (roomid.length == 0) {
      interaction.reply("아직 Tetr.io를 키고 있어요.");
      return;
    }

    switch (commandName) {
      case "roomid":
        if (await isPlaying()) {
          interaction.reply("아직 게임이 진행중 이에요.");
          return;
        }

        if (roomid.length > 0)
          interaction.reply(
            `> 방 ID는 \`` + roomid + `\`입니다!\n> https://tetr.io/${roomid}`
          );
        return;
      case "play":
        if (await isPlaying()) {
          interaction.reply("아직 게임이 진행중 이에요.");
          return;
        }

        interaction.reply(`게임 시작을 요청했어요! 곧 시작될테니 준비하세요.`);
        win.webContents.executeJavaScript(
          `document.getElementById("startroom").click()`
        );
        return;
      case "options":
        if (await isPlaying()) {
          interaction.reply("아직 게임이 진행중 이에요.");
          return;
        }

        const type = interaction.options.getString("opt") || "";
        const val = interaction.options.get("val", true) || 0;

        await win.webContents.executeJavaScript(
          optChangeScript
            .replace("${sel}", type)
            .replace("${val}", val.toString())
        );

        interaction.reply("설정이 변경됬을 꺼에요.");

        return;
      case "preset":
        if (await isPlaying()) {
          interaction.reply("아직 게임이 진행중 이에요.");
          return;
        }

        const pres = interaction.options.getString("pre") || "";
        await interaction.reply("프리셋을 설정했어요.");
        if (pres.startsWith("__")) {
          win.webContents.executeJavaScript(
            `document.getElementById("game-presets").click(); document.querySelector('#list_request_scroller > div[data-id="default"]').click();`
          );
          switch (pres) {
          }
          return;
        }
        win.webContents.executeJavaScript(
          `document.getElementById("game-presets").click(); document.querySelector('#list_request_scroller > div[data-id="${pres}"]').click();`
        );
        return;
      case "spectator":
        if (await isPlaying()) {
          interaction.reply("아직 게임이 진행중 이에요.");
          return;
        }
        win.webContents.executeJavaScript("isSpectator = true;");
        interaction.reply("관전자 모드로 변경했어요.");
        return;
      case "player":
        if (await isPlaying()) {
          interaction.reply("아직 게임이 진행중 이에요.");
          return;
        }
        win.webContents.executeJavaScript("isSpectator = false;");
        interaction.reply("플레이어 모드로 변경했어요.");
        return;
      default:
        return;
    }
  });
});
client.login(token);
