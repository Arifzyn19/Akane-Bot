/* 
  Original Source : https://github.com/Hisoka-Morrou/hisoka-baileys
  Recode By : Arifzyn
  Github : https://github.com/Arifzyn19
*/

import "dotenv/config";
import "../config.js";
const {
  delay,
  jidNormalizedUser,
  generateWAMessageFromContent,
  proto,
  prepareWAMessageMedia,
  areJidsSameUser,
} = await (
  await import("@whiskeysockets/baileys")
).default;

import * as Func from "./lib/function.js";
import serialize, { getContentType } from "./lib/serialize.js";
import Color from "./lib/color.js";

import ms from "ms";
import fs, { watchFile, unwatchFile } from "fs";
import axios from "axios";
import util from "util";
import cp, { exec as _exec } from "child_process";
let exec = util.promisify(_exec).bind(cp);
import { createRequire } from "module";
import moment from "moment-timezone";

import { fileTypeFromBuffer } from "file-type";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import FormData from "form-data";

const __filename = fileURLToPath(import.meta.url);

const require = createRequire(import.meta.url);
const database = new (await import("../storage/database/database.js")).default();

export default async function message(client, store, m) {
  try {
    let quoted = m.isQuoted ? m.quoted : m;
    let downloadM = async (filename) =>
      await client.downloadMediaMessage(quoted, filename);
    let isCommand = (m.prefix && m.body.startsWith(m.prefix)) || false;

    // mengabaikan pesan dari bot
    if (m.isBot) return;

    await database.load(m);

    const isPrems =
      global.db.users[m.sender].premium &&
      global.db.users[m.sender].premiumTime > 1;
    const isBanchat = m.isGroup ? global.db.groups[m.from].banned : false;

    const body = typeof m.body == "string" ? m.body : false;
    const botNumber = client.user.id.split(":")[0] + "@s.whatsapp.net";
    
    if (isCommand && !m.sender.startsWith("62") && !m.sender.startsWith("60"))
      return; // m.reply("> _Sorry Bot Only +62 and +60!_");

    const fkontak = {
      key: {
        fromMe: false,
        participant: `0@s.whatsapp.net`,
        ...(m.from ? { remoteJid: `status@broadcast` } : {}),
      },
      message: {
        contactMessage: {
          displayName: `${m.pushName}`,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${m.pushName}\nitem1.TEL;waid=${m.sender.split("@")[0]}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        },
      },
    };

    const ftextt = {
      key: {
        participant: "0@s.whatsapp.net",
        ...(m.from ? { remoteJid: `0@s.whatsapp.net` } : {}),
      },
      message: {
        extendedTextMessage: {
          text: "_Arifzyn-AI - WhatsApp Bot_",
          title: "",
        },
      },
    };

    const today = moment().tz("Asia/Jakarta");
    const day = today.format("dddd");
    const datee = today.format("D");
    const month = today.format("MMMM");
    const year = today.format("YYYY");

    if (m.isGroup && isBanchat) {
      if (!m.isBot && !m.isOwner) return;
    }

    const isAntilinkGc = m.isGroup ? global.db.groups[m.from].antilink : false;
    //Anti Link Group
    if (m.isGroup && isAntilinkGc && m.body.includes(`chat.whatsapp.com`)) {
      if (m.isAdmin) return m.reply("Alah sia admin grup mah bebas yekan :v");
      if (!m.isBotAdmin)
        return m.reply("Bot bukan admin jadi gbisa hapus pesan nya :(");
      if (owner.includes(m.sender))
        return m.reply("Alah sia owner bot mah bebas yekan :v");
      let linkgc = await zex.groupInviteCode(from);
      if (budy.includes(`${linkgc}`))
        return m.reply(
          "Wuanjir kirain link grup lain, huh hampir aja kena kick 😆",
        );
      await m.reply(
        ` *「 LINK GROUP DETECTED 」*\nKamu mengirimkan link group, maaf saya hapus karena antilink grub aktif`,
      );
      await delay(2000);
      if (m.isBotAdmin) await client.sendMessage(m.from, { delete: m.key });
    }

    // wm
    const newsletter = {
      contextInfo: {
        mentionedJid: [m.sender],
        groupMentions: [],
        forwardingScore: 1,
        isForwarded: true,
        externalAdReply: {
          showAdAttribution: true,
          title: namebot,
          body: wm,
          thumbnail: fs.readFileSync("./storage/media/menu.jpg"),
          sourceUrl: global.API("arifzyn"),
          mediaType: 1,
          renderLargerThumbnail: true,
        },
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363189539738060@newsletter",
          newsletterName: "Arifzyn Information",
        },
      },
    };

    const menus = {
      anime: ["komiku"],
      balance: [
        "me",
        "buylimit",
        "buyglimit",
        "claim",
        "transfer",
        "topbalance",
        "leaderboard",
      ],
      convert: ["sticker", "toimg", "exif", "tourl"],
      download: ["yts", "pinterest", "play", "tiktok", "instagram", "spotify"],
      group: [
        "hidetag",
        "group",
        "promote",
        "demote",
        "link",
        "delete",
        "banchat",
        "unbanchat",
      ],
      owner: [
        ">",
        "$",
        "bcgc",
        "mode",
        "upsw",
        "listpc",
        "banchat",
        "unbanchat",
        "restart",
        "clearsesi"
      ],
      info: ["info", "sc", "owner", "donasi", "listpc", "info"],
    };

    const more = String.fromCharCode(8206);
    const readMore = more.repeat(4001);

    // command
    switch (isCommand ? m.command.toLowerCase() : false) {
      case "menu":
      case "allmenu":
        {
          let txt;
          let arr = new Array();
          Object.keys(menus).forEach(function (x, i) {
            arr.push({
              title: `${i + 1}. ${Func.ucword(x)} Feature`,
              description: `Displays menus ${Func.ucword(x)} ( List Menu )`,
              id: `${m.prefix + m.command} ${x}`,
            });
          });

          let teks = `Hai, @${m.sender.split("@")[0]}!.
I am an automated system (WhatsApp Bot) that can help to do something, search and get data / information only through WhatsApp.
          
 ◦  *Library:* Baileys
 ◦  *Version:* ${JSON.parse(fs.readFileSync("./package.json")).version}
 ◦  *Uptime:* ${Func.runtime(process.uptime())}
 ◦  *Website:* ${global.web}
 
${readMore}`;
          const action = menus[m.args[0]];
          if (action) {
            txt = teks;
            txt += `\`</> ${Func.ucword(m.args[0])} Feature </>\`\n\n`;
            txt += action
              .map((item, i) => `${i + 1}. - *${m.prefix + item}*`)
              .join("\n");

            txt += `\n\n${wm}`;
            await client.sendMessage(
              m.from,
              {
                text: txt,
                contextInfo: {
                  mentionedJid: client.parseMention(txt),
                  externalAdReply: {
                    showAdAttribution: true,
                    title: namebot,
                    body: wm,
                    thumbnailUrl: global.thumbnail,
                    sourceUrl: global.API("arifzyn"),
                    mediaType: 1,
                    renderLargerThumbnail: true,
                  },
                },
              },
              { quoted: ftextt },
            );
          } else if (m.command.toLowerCase() == "allmenu") {
            Object.entries(menus)
              .map(([type, command]) => {
                teks += `\`</> ${Func.toUpper(type)} Feature </>\`\n`;
                teks += `> ${command.map((a) => `${m.prefix + a}`).join("\n> ")}\n`;
                teks += `\n\n`;
              })
              .join("\n\n");
            teks += `${wm}`;
            m.reply(teks, { mentions: [m.sender] });
          } else {
            teks += `Please click on the list below to see the menu for client bot.`;
            const sections = [
              {
                title: "List Menu",
                rows: arr,
              },
              {
                title: "System Information ( info )",
                rows: [
                  {
                    title: "Creator Bot",
                    id: ".owner",
                    description:
                      "Bot owner info, who created it ( information )",
                  },
                  {
                    title: "Info System",
                    id: ".info",
                    description: "Viewing System Info on Bots ( information )",
                  },
                  {
                    title: "Script Info",
                    id: ".sc",
                    description:
                      "Source Code Bot WhatsApp Info ( information )",
                  },
                  {
                    title: "Donasi Info",
                    id: ".donasi",
                    description: "Donate to Support Bot ( information )",
                  },
                ],
              },
            ];

            await client.sendListM(
              m.from,
              teks,
              wm,
              "https://telegra.ph/file/1b256c20ef6983f5608b8.jpg",
              sections,
              m,
              {
                mentions: [m.sender],
                contextInfo: {
                  mentionedJid: client.parseMention(teks),
                },
              },
            );
          }
        }
        break;
      // batas menfess
      case "tweetc":
        {
          if (!m.text) throw "Input Your Text.";
          const avatar = await client
            .profilePictureUrl(m.sender, "image")
            .catch((_) => "https://telegra.ph/file/24fa902ead26340f3df2c.png");
          const displayName = await client.getName(m.sender);
          const username = m.sender.split("@")[0];
          const replies = "176k"; // Replace with the desired value
          const retweets = "672k"; // Replace with the desired value
          const theme = "dark"; // Replace with the desired value

          const url = `https://some-random-api.com/canvas/misc/tweet?displayname=${encodeURIComponent(displayName)}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatar)}&comment=${encodeURIComponent(m.text)}&replies=${encodeURIComponent(replies)}&retweets=${encodeURIComponent(retweets)}&theme=${encodeURIComponent(theme)}`;

          client.sendMessage(
            m.from,
            {
              image: { url },
              caption: "```Success...\nDont forget to donate```",
              mimetype: "image/png",
            },
            { quoted: m },
          );
        }
        break;
      // feature Ai Di Sini Ajh dah
      case "ai":
        {
          if (!m.text)
            throw `[!] _Input Your text_\n\n${m.prefix + m.command} how to gay`;

          try {
            const response = await Func.fetchJson(
              API(
                "arifzyn",
                "/ai/chatgpt-completions",
                { text: m.text },
                "apikey",
              ),
            );
            if (response.status !== 200) return m.reply(util.format(response));

            await m.reply(response.result);
          } catch (e) {
            console.error(e);
            m.reply("error");
          }
        }
        break;
      // batas
      // ingfo
      case "me":
        {
          const user = global.db.users[m.sender];
          let txt = "`</> User Info </>`\n\n";
          txt +=
            `◦ Name : *${user.name}*\n` +
            `◦ Number : *${m.sender.split("@")[0]}*\n` +
            `◦ Limit : *${user.limit}*\n` +
            `◦ Balance : *${toDollar(user.balance)}*\n` +
            `◦ Premium : *${user.premium}*`;

          m.reply(txt);
        }
        break;
        
      case "claim":
      case "daily":
        {
          const limi = [
            "2",
            "4",
            "1",
            "5",
            "9",
            "3",
            "8",
            "7",
            "6",
            "10",
            "11",
          ];
          const randomny = limi[Math.floor(Math.random() * limi.length)];
          const limitfree = randomny;
          const free = 3000;
          const prem = 10000;
          const moneyfree = 3000;
          const moneyprem = 10000;
          const timeout = 86400000;
          let time = users[m.sender].lastclaim + 86400000;
          if (new Date() - users[m.sender].lastclaim < 86400000)
            return m.reply(
              `You have claimed, daily claim today\nwait as long ${client.msToTime(time - new Date())} Again`,
            );
          users[m.sender].exp += isPrems ? prem : free;
          users[m.sender].limit += limitfree;
          users[m.sender].balance += isPrems ? moneyprem : moneyfree;

          let txt =
            "`</> Daily Claim </>`\n\n" +
            `*Congratulations you got it:*\n\n` +
            `_+${limitfree} Limit_\n` +
            `_+${isPrems ? prem : free} Exp_\n` +
            `_+${isPrems ? moneyprem : moneyfree} Balance_`;
          m.reply(txt);
          users[m.sender].lastclaim = new Date() * 1;
        }
        break;

      case "tfbalance":
        {
          let user = users[m.sender];
          if (!("balance" in user) || typeof user.balance !== "number") {
            return m.reply(`Your balance is not available.`);
          }

          let formatMessage =
            `_Use format ${m.prefix}${m.command} [value] [number]_\n` +
            `_example ${m.prefix + m.command} 9999 @62xxx_\n`;

          const count = Math.min(
            Number.MAX_SAFE_INTEGER,
            Math.max(1, isNumber(m.args[0]) ? parseInt(m.args[0]) : 1),
          );

          let who = m.args[1]
            ? m.args[1].replace(/[@ .+-]/g, "") + "@s.whatsapp.net"
            : m.quoted
              ? m.quoted.sender
              : m.mentions && m.mentions[0]
                ? m.mentions[0]
                : "";

          if (!who) return m.reply("Tag one, or type in the number!!");
          if (!(who in db.users)) return m.reply(`User ${who} not in database`);

          if (user.balance < count)
            return m.reply(
              `Your balance is less than ${toDollar(count)}. You need ${toDollar(count - user.balance)} more.`,
            );

          let _user = users[who];

          let previous = user.balance;
          let _previous = _user.balance;
          user.balance -= count;
          _user.balance += count;

          m.reply(
            `Success! Transferred ${toDollar(count)} balance to @${(who || "").replace(/@s\.whatsapp\.net/g, "")}`,
            { mentions: [who] },
          );
        }
        break;

      case "transfer":
      case "tf":
        {
          let who = m.args[2]
            ? m.args[2].replace(/[@ .+-]/g, "") + "@s.whatsapp.net"
            : m.quoted
              ? m.quoted.sender
              : m.mentions && m.mentions[0]
                ? m.mentions[0]
                : "";
          const _user = users[who];
          const myuser = users[m.sender];

          const items = ["balance", "limit"];

          const item = items.filter(
            (v) => v in myuser && typeof myuser[v] == "number",
          );
          let lol =
            `_Use format ${m.prefix}${m.command} [type] [value] [number]_\n` +
            `_example ${m.prefix + m.command} money 9999 @62xxx_\n\n` +
            "`</> Transferable items </>`\n" +
            `${item.map((v) => `> ${v}`.trim()).join("\n")}`;

          const type = (m.args[0] || "").toLowerCase();
          if (!item.includes(type)) return m.reply(lol);

          const count =
            Math.min(
              Number.MAX_SAFE_INTEGER,
              Math.max(1, isNumber(m.args[1]) ? parseInt(m.args[1]) : 1),
            ) * 1;
          if (!who) return m.reply("Tag one, or type in the number!!");
          if (!(who in db.users)) return m.reply(`User ${who} not in database`);
          if (db.users[m.sender][type] * 1 < count)
            return m.reply(
              `Your > *${type}${special(type)}* is less *${count - user[type]}*`,
            );

          let previous = myuser[type] * 1;
          let _previous = _user[type] * 1;
          myuser[type] -= count * 1;
          _user[type] += count * 1;
          console.log(
            `User: ${myuser}, Type: ${type}, Count: ${count}, Who: ${who}`,
          );
          console.log(
            `Before Transfer - User[type]: ${user[type]}, _User[type]: ${_user[type]}`,
          );
          if (previous > myuser[type] * 1 && _previous < _user[type] * 1)
            m.reply(
              `Succes transfer *${count}* ${type}${special(type)} to *@${(who || "").replace(/@s\.whatsapp\.net/g, "")}*`,
              { mentions: [who] },
            );
          else {
            myuser[type] = previous;
            _user[type] = _previous;
            m.reply(
              `Failted to transfer *${count}* ${type}${special(type)} to *@${(who || "").replace(/@s\.whatsapp\.net/g, "")}*`,
              { mentions: [who] },
            );
          }
        }
        break;
        
      case "buylimit":
        {
          if (!m.text)
            return m.reply(
              `Send the command *${m.prefix + m.command}* the amount of limit you want to buy\n\nPrice of 1 limit = IDR 1000`,
            );
          if (m.text.includes("-")) return m.reply(`Do not use -`);
          if (isNaN(m.text)) return m.reply(`Must be a number`);
          let ane = Number(Math.floor(m.text) * 1000);
          if (users[m.sender].balance < ane)
            return m.reply(`Your balance is insufficient for this purchase`);
          users[m.sender].balance -= ane;
          users[m.sender].limit += Math.floor(m.text) * 1;
          m.reply(
            `Purchase limit of ${m.text} was successful\n\nRemainder Balance : $${users[m.sender].balance.toLocaleString()}\nRemaining Limit : ${users[m.sender].limit}`,
          );
        }
        break;

      case "buyglimit":
        {
          if (!m.text)
            return m.reply(
              `Send the command *${m.prefix + m.command}* the amount of limit you want to buy\n\nPrice of 1 game limit = IDR 700`,
            );
          if (m.text.includes("-")) return m.reply(`Do not use -`);
          if (isNaN(m.text)) return m.reply(`Must be a number`);
          let ane = Number(Math.floor(m.text) * 700);
          if (users[m.sender].balance < ane)
            return m.reply(`Your balance is insufficient for this purchase`);
          users[m.sender].balance -= ane;
          users[m.sender].glimit += Math.floor(m.text);
          m.reply(
            `Purchase of game limit of ${m.text} was successful\nn\Remaining Balance : $${users[m.sender].balance.toLocaleString()}\nRemaining Limit : ${users[m.sender].glimit}`,
          );
        }
        break;

      case "topbalance":
      case "topglobal":
        {
          if (!m.isGroup) return m.reply("group");
          let uang = Object.values(global.db.users)
            .filter((user) => user.balance !== undefined)
            .sort((a, b) => b.balance - a.balance);
          let top = "*── 「 TOP BALANCE 」 ──*\n\n";
          var arrTop = [];
          var total = 15;
          if (uang.length < 15) total = uang.length;
          for (let i = 0; i < total; i++) {
            let userId = Object.keys(global.db.users)[
              Object.values(global.db.users).indexOf(uang[i])
            ];
            let names = await client.getName(userId);
            let userIdWithoutSuffix = userId.replace("@s.whatsapp.net", ""); // Menghilangkan @s.whatsapp.net
            top += `${i + 1}. ${names} - wa.me/${userIdWithoutSuffix}\n=> balance : ${toDollar(uang[i].balance)}\n\n`;
            arrTop.push(userIdWithoutSuffix);
          }
          m.reply(top, { mentions: arrTop });
        }
        break;

      case "lb":
      case "leaderboard":
        {
          const leaderboards = ["balance", "limit"];
          let userData = Object.entries(db.users).map(([key, value]) => {
            return { ...value, jid: key };
          });
          let leaderboard = leaderboards.filter(
            (v) =>
              v &&
              !v.includes("@g.us") &&
              userData.filter((user) => user && user[v]).length,
          );
          let type = (m.args[0] || "").toLowerCase();
          const getPage = (item) =>
            Math.ceil(
              userData.filter(async (user) => (await user) && user[item])
                .length / 25,
            );
          let wrong = `
Use format *${m.prefix + m.command} [type] [page]*
example *${m.prefix + m.command} money 1*

\`</> Type list </>\`
${leaderboard
  .map((v) =>
    `
> ${v}
`.trim(),
  )
  .join("\n")}
`.trim();
          if (!leaderboard.includes(type)) return m.reply(wrong);
          let page = isNumber(m.args[1])
            ? Math.min(Math.max(parseInt(m.args[1]), 0), getPage(type))
            : 0;
          let sortedItem = userData.map(toNumber(type)).sort(sort(type));
          let userItem = sortedItem.map(enumGetKey);
          const getName = async (jid) => await client.getName(jid);

          let text = `
• *${type} Leaderboard page ${page} of ${getPage(type)}* •
You: *${userItem.indexOf(m.sender) + 1}* of *${userItem.length}*

${(await Promise.all(sortedItem.slice(page * 25, page * 25 + 25).map(async (user, i) => `*[${i + 1}]* ${m.metadata.participants.some((p) => areJidsSameUser(user.jid, p.id)) ? `(${await getName(user.jid)}) wa.me/` : "@"}${user.jid.split("@")[0]}\n┗⊱ *${type == "limit" && users[user.jid.split("@")[0]].premium ? "~ Infinity ~" : user[type]} > ${type}*`))).join("\n")}
`.trim();
          await m.reply(text, {
            mentions: [...userItem.slice(page * 25, page * 25 + 25)].filter(
              (v) =>
                !m.metadata.participants.some((p) => areJidsSameUser(v, p.id)),
            ),
          });
        }
        break;
      // batas
      // feature download
      case "tiktok":
      case "tt":
        {
          if (!m.args[0])
            throw `[!] _Input Url TikTok_\n\n${m.prefix + m.command}`;
          if (!Func.isUrl(m.args[0]))
            throw "An error occurred with the URL, please enter the correct one";

          await m.reply("[!] _Process Download..._");
          try {
            const response = await Func.fetchJson(
              API("arifzyn", "/download/tiktok", { url: m.args[0] }, "apikey"),
            );

            if (response.result.type !== "image") {
              await client.sendMessage(
                m.from,
                {
                  video: { url: response.result.content.noWatermark },
                  caption: `${response.result.desc}\n\n${wm}`,
                  mimetype: "video/mp4",
                },
                { quoted: m },
              );
            } else {
              for (let x of response.result.content) {
                await client.sendMessage(
                  m.from,
                  {
                    image: { url: x },
                    caption: `${response.result.desc}\n\n${wm}`,
                    mimetype: "image/jpeg",
                  },
                  { quoted: m },
                );
                await delay(2000);
              }
            }
          } catch (e) {
            console.error(e);
            throw "Error downloader tiktok";
          }
        }
        break;

      case "instagram":
      case "ig":
        {
          if (!m.args[0])
            throw `[!] _Input Url instagram_\n\n${m.prefix + m.command}`;
          if (!Func.isUrl(m.args[0]))
            throw "An error occurred with the URL, please enter the correct one";

          await m.reply("[!] _Process Download..._");
          try {
            const response = await Func.fetchJson(
              API("arifzyn", "/download/instagram", { url: m.text }, "apikey"),
            );

            for (let media of response.result.media) {
              await client.sendFile(m.from, media, "", wm, m);
            }
          } catch (e) {
            console.error(e);
            throw "Error downloader Instagram";
          }
        }
        break;

      case "facebook":
      case "fb":
        {
          if (!m.args[0])
            throw `[!] _Input Url instagram_\n\n${m.prefix + m.command}`;
          if (!Func.isUrl(m.args[0]))
            throw "An error occurred with the URL, please enter the correct one";

          await m.reply("[!] _Process Download..._");
          try {
            const response = await Func.fetchJson(
              API("arifzyn", "/download/instagram", { url: m.text }, "apikey"),
            );

            for (let media of response.result.media) {
              await client.sendFile(m.from, media, "", wm, m);
            }
          } catch (e) {
            console.error(e);
            throw "Error downloader Instagram";
          }
        }
        break;

      case "krakenfiles":
      case "kf":
        {
          if (!m.args[0])
            throw `[!] _Input Url Krakenfiles_\n\n*Example :* ${m.prefix + m.command} link`;
          if (!Func.isUrl(m.args[0]))
            throw "An error occurred with the URL, please enter the correct one";

          await m.reply("[!] _Process Download..._");
          try {
            const response = await Func.fetchJson(
              API(
                "arifzyn",
                "/download/krakenfiles",
                { url: m.text },
                "apikey",
              ),
            );

            if (response.status !== 200) return m.reply(util.format(response));

            let caption =
              "`</> Krakenfiles </>`\n\n" +
              `> *Title :* _${response.result.title}_` +
              `> *Upload :* _${response.result.uploaddate}_` +
              `> *Filesize :* _${response.result.filesize}_` +
              `> *Type :* _${response.result.type}_` +
              `> *Views :* _${response.result.views}_`;

            await client.sendFile(m.from, response.result.url, caption, m);
          } catch (e) {
            console.error(e);
            throw "Error downloader Instagram";
          }
        }
        break;
      case "pinterest":
      case "pin":
        {
          if (!m.text)
            throw `[!] Enter query/URL_\n\n*Contoh :*\n${m.prefix + m.command} anime \`or\` ${m.prefix + m.command} https://pin.it/5fIqiofOo`;

          try {
            const json = await Func.fetchJson(
              API(
                "arifzyn",
                "/download/pinterest",
                { query: m.text },
                "apikey",
              ),
            );

            if (json.status !== 200) return m.reply(util.format(json));

            const caption = Func.isUrl(m.text)
              ? `*Source:* ${m.text}`
              : `> Query : ${m.text}`;

            if (/\.(jpg|png)$/i.test(json.result)) {
              client.sendMessage(
                m.from,
                {
                  image: { url: json.result },
                  caption,
                  mimetype: "image/jpeg",
                },
                { quoted: m },
              );
            } else {
              client.sendMessage(
                m.from,
                { video: { url: json.result }, caption, mimetype: "video/mp4" },
                { quoted: m },
              );
            }
          } catch (e) {
            console.error(e);
            throw "Error download/search pinterest.";
          }
        }
        break;
      // search feature ajh
      case "googlef":
      case "google":
        {
          let googleIt = require("google-it");
          let full = /f$/i.test(m.command);
          let text = m.args.join` `;
          if (!text) return m.reply("There is no text to search for!");
          let url = "https://google.com/search?q=" + encodeURIComponent(text);
          let search = await googleIt({ query: text });
          let msg = search.map(({ title, link, snippet }) => {
            return `*${title}*\n_${link}_\n_${snippet}_`;
          }).join`\n\n`;
          try {
            m.reply(url + "\n\n" + msg);
          } catch (e) {
            m.reply(msg);
          }
        }
        break;
      // ini anime
      case "waifu":
        {
          const { url } = await Func.fetchJson(
            "https://api.waifu.pics/sfw/waifu",
          );
          await client.sendMessage(
            m.from,
            { image: { url: url }, caption: `${wm}`, mimetype: "image/png" },
            { quoted: m },
          );
        }
        break;
      case "neko":
        {
          if (!isPrems) return m.reply("premium");

          const { url } = await Func.fetchJson(
            "https://api.waifu.pics/nsfw/neko",
          );
          await client.sendMessage(
            m.from,
            {
              image: { url: url },
              caption: `${wm}`,
              mimetype: "image/png",
              viewOnce: true,
            },
            { quoted: m },
          );
        }
        break;
      case "komiku":
        {
          let exam =
            `_*[ Example using ]*_\n\n` +
            `*Search:*\n_${m.prefix + m.command} <query>_\n_${m.prefix + m.command} seirei gensouki_\n` +
            `*Detail:*\n_${m.prefix + m.command} <number>_\n_${m.prefix + m.command}  1_\n` +
            `*Chapter:*\n_${m.prefix + m.command} chapter <number>_\n_${m.prefix + m.command} chapter 1_\n\n` +
            `Please search to get detailed numbers and chapters`;
          if (!m.text) return m.reply(exam);

          client.komiku = client.komiku ? client.komiku : {};
          const komikuCheck = client.komiku[m.sender]
            ? client.komiku[m.sender]
            : null;
          if (!komikuCheck && !isNaN(m.text))
            return m.reply(
              `Your session has expired / does not exist, do another search using the keywords you want.`,
            );
          if (/chapter/.test(m.args[0])) {
            if (Number(m.text) > komikuCheck.chapter.length)
              return m.reply(`Exceed amount of data.`);
            if (isNaN(m.args[1])) return m.reply("Only Number.");

            m.reply("[!] _Processing Download Chapter..._");
            try {
              const json = await Func.fetchJson(
                API(
                  "arifzyn",
                  "/animanga/komiku-chapter",
                  {
                    url: komikuCheck.chapter[Number(m.args[1]) - 1],
                  },
                  "apikey",
                ),
              );
              if (json.status !== 200) throw "No result (error)";
              client.sendMessage(
                m.from,
                {
                  document: { url: json.result.url },
                  caption: json.result.title,
                  fileName: json.result.title + ".pdf",
                  mimetype: "application/pdf",
                },
                { quoted: m },
              );
            } catch (e) {
              console.error(e);
              throw "Error to showing...";
            }
          } else if (komikuCheck && !isNaN(m.text)) {
            if (Number(m.text) > komikuCheck.result.length)
              return m.reply(`Exceed amount of data.`);

            try {
              const json = await Func.fetchJson(
                API(
                  "arifzyn",
                  "/animanga/komiku-detail",
                  {
                    url: komikuCheck.result[Number(m.text) - 1],
                  },
                  "apikey",
                ),
              );
              if (json.status !== 200) throw "No result (error)";
              let txt = `[  *K O M I K U* ]\n\n`;
              txt += `	\u2022  *Title* : ${json.result.title}\n`;
              for (let key in json.result.metadata)
                if (!/chapters|genre/i.test(key))
                  txt += `	\u2022  *${Func.ucword(key).replace("_", " ")}* : ${json.result.metadata[key]}\n`;
              txt += `\n[  *S I N O P S I S* ]\n\n`;
              txt += `${json.result.sinopsis}\n`;
              const arr = [];
              
                txt += `\n[ *C H A P T E R S* ]\n\n`;
                txt += json.result.chapters
                  .reverse()
                  .map(
                    (v, i) =>
                      `${i + 1} - ${v.title} (${v.upload})\n*Link* : ${v.url}`,
                  )
                  .join("\n\n");

                client
                  .sendMessage(
                    m.from,
                    { image: { url: json.result.img }, caption: txt },
                    { quoted: m },
                  )
                  .then(() => {
                    komikuCheck.chapter = json.result.chapters.map(
                      (v) => v.url,
                    );
                  });
              
            } catch (e) {
              console.error(e);
              throw "Error to showing...";
            }
          } else {
            if (!m.args[0]) return m.reply(exam);
            // if (!m.args[1]) throw "Input query.";

            try {
              const json = await Func.fetchJson(
                API(
                  "arifzyn",
                  "/animanga/komiku-search", 
                  { q: m.text },
                  "apikey",
                ),
              );
              if (json.status !== 200) throw json;
              if (json.result.length == 0)
                return m.reply(`Query *${m.text}* not found`);

              if (!komikuCheck) {
                client.komiku[m.sender] = {
                  result: json.result.map((v) => v.link),
                  created_at: new Date() * 1,
                };
              } else komikuCheck.result = json.result.map((v) => v.link);
              
                let p = `To showing information use client command *${m.prefix + m.command} number*\n`;
                p += `*Example* : ${m.prefix + m.command} 1\n\n`;

                json.result
                  .map((v, i) => {
                    p += `*${i + 1}*. ${v.title}\n`;
                    p += ` \u2022 *image* : ${v.img}\n`;
                    p += ` \u2022 *url* : ${v.link}\n\n`;
                  })
                  .join("\n\n");
                m.reply(p);
            } catch (e) {
              console.error(e);
              throw "Error searching...";
            }
          }
        }
        break;
        
      // batas anime
      case "listpc":
        {
          if (!m.isOwner) return m.reply("owner");
          let anulistp = await store.chats
            .all()
            .filter((v) => v.id.endsWith(".net"))
            .map((v) => v.id);
          let teks = `*Private Chat*\nTotal: ${anulistp.length} Chat\n\n`;
          for (let i of anulistp) {
            let nama = store.messages[i].array[0].pushName;
            teks += `*Name :* ${nama}\n*User :* @${i.split("@")[0]}\n*Chat :* https://wa.me/${i.split("@")[0]}\n\n───────────\n\n`;
          }
          m.reply(teks, {
            mentions: await client.parseMention(teks),
          });
        }
        break;
      case "get":
        if (!/^https?:\/\//.test(m.text))
          return m.reply("Awali *URL* dengan http:// atau https://");
        const ajg = await fetch(m.text);
        if (ajg.headers.get("content-length") > 100 * 1024 * 1024 * 1024) {
          throw `Content-Length: ${ajg.headers.get("content-length")}`;
        }
        const contentType = ajg.headers.get("content-type");
        if (contentType.startsWith("image/")) {
          return client.sendMessage(
            m.from,
            { image: { url: m.text } },
            "imageMessage",
            m.text,
            m,
          );
        }
        if (contentType.startsWith("video/")) {
          return client.sendMessage(
            m.from,
            { video: { url: m.text } },
            "videoMessage",
            m.text,
            m,
          );
        }
        if (contentType.startsWith("audio/")) {
          return client.sendMessage(
            m.from,
            { audio: { url: m.text }, mimetype: "audio/mpeg" },
            { quoted: m },
          );
        }
        let alak = await ajg.arrayBuffer();
        alak = Buffer.from(alak, "binary");
        try {
          alak = util.format(JSON.parse(alak + "", null, 2));
        } catch (e) {
          alak = alak + "";
        } finally {
          m.reply(alak.slice(0, 65536));
        }
        break;
      case "ssweb":
        {
          if (!m.args[0])
            throw `[!] _enter the wrong URL_\n\n${m.prefix + m.command} https://api.arifzyn.tech`;

          await m.reply("[!] _Processing Your request_");
          try {
            const url = API(
              "arifzyn",
              "/tools/ssweb",
              { url: m.args[0], device: m.args[1] ? m.args[1] : "desktop" },
              "apikey",
            );
            client.sendMessage(
              m.from,
              { image: { url: url }, caption: wm },
              { quoted: m },
            );
          } catch (e) {
            console.error(e);
            throw "Error screenshot Website";
          }
        }
        break;

      case "owner":
        {
          const setMsg = await client.sendContact(m.from, global.owner, m);

          await client.sendMessage(
            m.from,
            { text: "`client is my owner's number, no calls or spam texts!`" },
            { quoted: setMsg },
          );
        }
        break;

      case "sc":
        {
          let teks = "`Sorry not open source code`\n\n";
          teks +=
            "*If you want to ask questions, please chat :*\n> _https://wa.me/6288213503541_ (owner)\n\n";
          teks +=
            "*Jika ingin Tahu Informasi Mengenai Bot Ini :*\n> _https://whatsapp.com/channel/0029VaHMgM3Lo4hcfGTJ3W1e_";
          m.reply(teks);
        }
        break;
      case "donasi":
        {
          client.sendMessage(
            m.from,
            {
              image: {
                url: "https://telegra.ph/file/3fcbe92c5bdbe3a229d84.jpg",
              },
            },
            { quoted: m },
          );
        }
        break;

      case "info":
        {
          let os = (await import("os")).default;
          let v8 = (await import("v8")).default;
          let { performance } = (await import("perf_hooks")).default;
          let eold = performance.now();

          const used = process.memoryUsage();
          const cpus = os.cpus().map((cpu) => {
            cpu.total = Object.keys(cpu.times).reduce(
              (last, type) => last + cpu.times[type],
              0,
            );
            return cpu;
          });
          const cpu = cpus.reduce(
            (last, cpu, _, { length }) => {
              last.total += cpu.total;
              last.speed += cpu.speed / length;
              last.times.user += cpu.times.user;
              last.times.nice += cpu.times.nice;
              last.times.sys += cpu.times.sys;
              last.times.idle += cpu.times.idle;
              last.times.irq += cpu.times.irq;
              return last;
            },
            {
              speed: 0,
              total: 0,
              times: {
                user: 0,
                nice: 0,
                sys: 0,
                idle: 0,
                irq: 0,
              },
            },
          );
          let heapStat = v8.getHeapStatistics();
          let neow = performance.now();

          let teks = `
*Ping :* *_${Number(neow - eold).toFixed(2)} milisecond(s)_*

💻 *_Info Server_*
*- Hostname :* ${os.hostname() || client.user?.name}
*- Platform :* ${os.platform()}
*- OS :* ${os.version()} / ${os.release()}
*- Arch :* ${os.arch()}
*- RAM :* ${Func.formatSize(os.totalmem() - os.freemem(), false)} / ${Func.formatSize(os.totalmem(), false)}

*_Runtime OS_*
${Func.runtime(os.uptime())}

*_Runtime Bot_*
${Func.runtime(process.uptime())}

*_NodeJS Memory Usage_*
${Object.keys(used)
  .map(
    (key, _, arr) =>
      `*- ${key.padEnd(Math.max(...arr.map((v) => v.length)), " ")} :* ${Func.formatSize(used[key])}`,
  )
  .join("\n")}
*- Heap Executable :* ${Func.formatSize(heapStat?.total_heap_size_executable)}
*- Physical Size :* ${Func.formatSize(heapStat?.total_physical_size)}
*- Available Size :* ${Func.formatSize(heapStat?.total_available_size)}
*- Heap Limit :* ${Func.formatSize(heapStat?.heap_size_limit)}
*- Malloced Memory :* ${Func.formatSize(heapStat?.malloced_memory)}
*- Peak Malloced Memory :* ${Func.formatSize(heapStat?.peak_malloced_memory)}
*- Does Zap Garbage :* ${Func.formatSize(heapStat?.does_zap_garbage)}
*- Native Contexts :* ${Func.formatSize(heapStat?.number_of_native_contexts)}
*- Detached Contexts :* ${Func.formatSize(heapStat?.number_of_detached_contexts)}
*- Total Global Handles :* ${Func.formatSize(heapStat?.total_global_handles_size)}
*- Used Global Handles :* ${Func.formatSize(heapStat?.used_global_handles_size)}
${
  cpus[0]
    ? `

*_Total CPU Usage_*
${cpus[0].model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times)
        .map(
          (type) =>
            `*- ${(type + "*").padEnd(6)}: ${((100 * cpu.times[type]) / cpu.total).toFixed(2)}%`,
        )
        .join("\n")}

*_CPU Core(s) Usage (${cpus.length} Core CPU)_*
${cpus
  .map(
    (cpu, i) =>
      `${i + 1}. ${cpu.model.trim()} (${cpu.speed} MHZ)\n${Object.keys(
        cpu.times,
      )
        .map(
          (type) =>
            `*- ${(type + "*").padEnd(6)}: ${((100 * cpu.times[type]) / cpu.total).toFixed(2)}%`,
        )
        .join("\n")}`,
  )
  .join("\n\n")}`
    : ""
}
`.trim();
          await m.reply(teks);
        }
        break;

      case "quoted":
      case "q":
        if (!m.isQuoted) throw "Reply Message";
        try {
          var message = await serialize(
            client,
            await store.loadMessage(m.from, m.quoted.id),
            store,
          );
          if (!message.isQuoted) throw "Pesan quoted gaada";
          await client.sendMessage(m.from, {
            forward: message.quoted,
            force: true,
          });
        } catch (e) {
          throw "Pesan gaada";
        }
        break;

      case "rvo":
        if (!quoted.msg.viewOnce) throw "Reply Messages One View";
        quoted.msg.viewOnce = false;
        await client.sendMessage(m.from, { forward: quoted, force: true });
        break;
        
      case "sticker":
      case "s":
        // if (!/image|video|webp/.test(quoted.msg.mimetype)) throw "Send or reply image/video";
        if (/image|video|webp/.test(quoted.msg.mimetype)) {
          let media = await downloadM();
          if (quoted.msg?.seconds > 10)
            throw "Video diatas durasi 10 detik gabisa";
          let exif;
          if (m.text) {
            let [packname, author] = m.text.split(/[,|\-+&]/);
            exif = {
              packName: packname ? packname : "",
              packPublish: author ? author : "",
            };
          } else {
            exif = {
              packName: `Arifzyn AI`,
              packPublish: `By Arifzyn.`,
            };
          }

          let sticker = await (
            await import("./lib/sticker.js")
          ).writeExif({ mimetype: quoted.msg.mimetype, data: media }, exif);
          await m.reply(sticker);
        } else if (m.mentions.length !== 0) {
          for (let id of m.mentions) {
            await delay(1500);
            let url = await client.profilePictureUrl(id, "image");
            let media = await Func.fetchBuffer(url);
            let sticker = await (
              await import("./lib/sticker.js")
            ).writeExif(media, {
              packName: `Arifzyn AI`,
              packPublish: `By Arifzyn.`,
            });
            await m.reply(sticker);
          }
        } else if (
          /(https?:\/\/.*\.(?:png|jpg|jpeg|webp|mov|mp4|webm|gif))/i.test(
            m.text,
          )
        ) {
          for (let url of Func.isUrl(m.text)) {
            await delay(1500);
            let media = await Func.fetchBuffer(url);
            let sticker = await (
              await import("./lib/sticker.js")
            ).writeExif(media, {
              packName: `Arifzyn AI`,
              packPublish: `By Arifzyn.`,
            });
            await m.reply(sticker);
          }
        } else throw "Send or reply image/video";
        break;

      case "toimg":
      case "toimage":
        {
          let { webp2mp4File } = await import("./lib/sticker.js");
          if (!/webp/i.test(quoted.msg.mimetype))
            return m.reply(
              `Reply Sticker with command ${m.prefix + m.command}`,
            );
          if (quoted.msg.isAnimated) {
            let media = await webp2mp4File(await quoted.download());
            await m.reply(media);
          }
          let media = await downloadM();
          await client.sendFile(m.from, media, "", "", m, null, {
            mimetype: "image/png",
          });
        }
        break;

      case "exif":
        let webp = (await import("node-webpmux")).default;
        let img = new webp.Image();
        await img.load(await downloadM());
        await m.reply(util.format(JSON.parse(img.exif.slice(22).toString())));
        break;

      case "tourl":
        if (!quoted.isMedia) throw "Reply media messages";
        if (Number(quoted.msg?.fileLength) > 350000000) throw "Kegeden mas";
        let media = await downloadM();
        let url =
          /image|video/i.test(quoted.msg.mimetype) &&
          !/webp/i.test(quoted.msg.mimetype)
            ? await Func.upload.telegra(media)
            : await Func.upload.pomf(media);
        await client.reply(m.from, url, m);
        break;

      case "smeme":
        {
          let respond = `Kirim/reply image/sticker dengan caption ${m.prefix + m.command} text1|text2`;
          if (!/image/.test(quoted.msg.mimetype)) return m.reply(respond);
          if (!m.text) return m.reply(respond);
          let [atas = "-", bawah = "-"] = m.text.split(`|`);
          const medias = await downloadM();
          let url =
            /image|video/i.test(quoted.msg.mimetype) &&
            !/webp/i.test(quoted.msg.mimetype)
              ? await Func.upload.telegra(medias)
              : await Func.upload.pomf(medias);
          let smeme = `https://api.memegen.link/images/custom/${encodeURIComponent(bawah)}/${encodeURIComponent(atas)}.png?background=${url}`;
          let buff = await Func.fetchBuffer(smeme);
          let sticker = await (
            await import("./lib/sticker.js")
          ).writeExif(buff, {
            packName: `${wm} : `,
            packPublish: ``,
          });
          await m.reply(sticker);
        }
        break;

      case "qc":
        var teks = quoted.text;
        if (!teks) return m.reply(`Send command *${m.prefix}qc* text`);
        let jsonnya = {
          type: "quoted",
          format: "webp",
          backgroudnColor: "#FFFFFF",
          width: 512,
          height: 768,
          scale: 2,
          messages: [
            {
              entities: [],
              avatar: true,
              from: {
                id: 1,
                name: client.getName(quoted.sender),
                photo: {
                  url: await client
                    .profilePictureUrl(quoted.sender, "image")
                    .catch(
                      () =>
                        "https://i0.wp.com/telegra.ph/file/134ccbbd0dfc434a910ab.png",
                    ),
                },
              },
              text: teks,
              replyMessage: {},
            },
          ],
        };
        console.log(JSON.stringify(jsonnya, 0, 2));
        const post = await axios
          .post("https://bot.lyo.su/quote/generate", jsonnya, {
            headers: { "Content-Type": "application/json" },
          })
          .catch((e) => console.error(e?.response));

        let buff = await Buffer.from(post.data.result.image, "base64");
        let sticker = await (
          await import("./lib/sticker.js")
        ).writeExif(buff, {
          packName: "",
          packPublish: wm,
        });
        await m.reply(sticker);
        break;

      // tools
      case "translate":
      case "tr":
        {
          let translate = require("translate-google-api");
          let defaultLang = "en";
          let tld = "cn";
          let toks = `
Example:
${m.prefix + m.command} <lang> [text]
${m.prefix + m.command} id your messages

List of supported languages: https://cloud.google.com/translate/docs/languages
`.trim();

          if (!m.text) throw toks;
          let lang = m.args[0];
          let text = m.args.slice(1).join(" ");
          if ((m.args[0] || "").length !== 2) {
            lang = defaultLang;
            text = m.args.join(" ");
          }
          if (!text && m.quoted && m.quoted.text) text = m.quoted.text;
          var result;

          try {
            result = await translate(`${text}`, { to: lang });
          } catch (e) {
            result = await translate(`${text}`, { to: defaultLang });
            m.reply(toks);
          } finally {
            m.reply(result[0]);
          }
        }
        break;
      // group feature
      case "hidetag":
      case "ht":
        {
          if (!m.isGroup) return m.reply("group");
          if (!m.isAdmin) return m.reply("admin");
          let member = m.metadata.participants.map((a) => a.id);
          let mod = await client.cMod(
            m.from,
            quoted,
            /hidetag|tag|ht|h|totag/i.test(quoted.body.toLowerCase())
              ? quoted.body.toLowerCase().replace(m.prefix + m.command, "")
              : quoted.body,
          );
          client.sendMessage(
            m.from,
            { forward: mod, mentions: member },
            { quoted: ftextt },
          );
        }
        break;

      case "group":
        {
          if (!m.isGroup) return m.reply("group");
          if (!m.isAdmin) return m.reply("admin");
          if (!m.isBotAdmin) return m.reply("botAdmin");
          let isClose = {
            open: "not_announcement",
            close: "announcement",
          }[m.args[0] || ""];
          if (isClose === undefined)
            throw `
*Usage Example :*
  *○ ${m.prefix + m.command} close*
  *○ ${m.prefix + m.command} open* 
`.trim();
          await client.groupSettingUpdate(m.from, isClose);
        }
        break;

      case "demote":
      case "promote":
        {
          if (!m.isGroup) return m.reply("group");
          if (!m.isAdmin) return m.reply("admin");
          if (!m.isBotAdmin) return m.reply("botAdmin");
          let who = m.quoted
            ? m.quoted.sender
            : m.mentions
              ? m.mentions[0]
              : "";
          if (!who) throw `*quote / @tag* salah satu !`;

          try {
            if (m.command.toLowerCase() == "promote") {
              await client.groupParticipantsUpdate(m.from, [who], "promote");
              await m.reply(
                `_*Succes promote member*_ *@${who.split("@")[0]}*`,
                {
                  mentions: [who],
                },
              );
            } else {
              await client.groupParticipantsUpdate(m.from, [who], "demote");
              await m.reply(`_*Succes demote admin*_ *@${who.split("@")[0]}*`, {
                mentions: [who],
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
        break;

      case "link":
        if (!m.isGroup) return m.reply("group");
        if (!m.isAdmin) return m.reply("admin");
        if (!m.isBotAdmin) return m.reply("botAdmin");
        await m.reply(
          "https://chat.whatsapp.com/" +
            (m.metadata?.inviteCode || (await client.groupInviteCode(m.from))),
        );
        break;

      case "delete":
      case "del":
        if (quoted.fromMe) {
          await client.sendMessage(m.from, { delete: quoted.key });
        } else {
          if (!m.isBotAdmin) return m.reply("botAdmin");
          if (!m.isAdmin) return m.reply("admin");
          await client.sendMessage(m.from, { delete: quoted.key });
        }
        break;

      case "banchat":
      case "unbanchat":
        {
          if (!m.isOwner) return m.reply("owner");
          if (!m.isGroup) return m.reply("group");
          if (m.command.toLowerCase() == "banchat") {
            if (isBanchat) return;
            global.db.groups[m.from].banned = true;
            m.reply(`The bot will not respond to the group.`);
          } else {
            if (!isBanchat) return m.reply(`chat has been banned.`);
            global.db.groups[m.from].banned = false;
            m.reply(`Bot Response in this chat.`);
          }
        }
        break;

      // Si paling store
      case "shop":
      case "list":
        {
          if (!m.isGroup) return m.reply("group");
          if (db_respon_list.length === 0)
            return m.reply(`Belum ada list message di database`);
          if (!isAlreadyResponListGroup(m.from, db_respon_list))
            return m.reply(
              `Belum ada list message yang terdaftar di group ini`,
            );

          var arr_rows = [];
          db_respon_list.forEach((x, i) => {
            if (x.id === m.from) {
              arr_rows.push({
                title: `${i + 1}. ${x.key}`,
                id: x.key,
              });
            }
          });
          let teks = `Hai @${m.sender.split("@")[0]}\nBerikut list item yang tersedia di group ini!\n\nSilahkan pilih produk yang diinginkan!`;

          const sections = [
            {
              title: "List Produk",
              rows: arr_rows,
            },
          ];
          await client.sendListM(m.from, teks, wm, null, sections, m, {
            contextInfo: {
              mentionedJid: [m.sender],
            },
          });
        }
        break;
        
      case "join":
        if (!m.isOwner) return m.reply("owner");

        try {
          let link = m.text.startsWith("http");
          if (!link) return m.reply(`Kirim perintah ${command} _linkgrup_`);
          let ano = m.text.split("https://chat.whatsapp.com/")[1];
          await client.groupAcceptInvite(ano);
          m.reply("Successfully joining the group!");
        } catch (e) {
          console.log(e);
          m.reply(`Expired / bot link has been kicked previously.`);
        }
        break;

      case "restart":
        if (!m.isOwner) return m.reply("owner");
        exec("npm run restart:pm2", (err) => {
          if (err) return process.send("reset");
        });
        break;

      case "bcgc":
        {
          if (!m.isOwner) return m.reply("owner");
          if (!m.text) return setReply("Masukkan teks!");

          let getGroups = await client.groupFetchAllParticipating();
          let groupIds = Object.values(getGroups).map((group) => group.id);

          m.reply(
            `Sending Broadcast to ${groupIds.length} Group, Estimated Time: ${groupIds.length * 0.5} seconds`,
          );

          for (let groupId of groupIds) {
            let text = `
      *_Broadcast Grup_*
      ––––––『 *MESSAGE* 』––––––
      ${m.text}
    `;

            const image = pickRandom(
              await search.pinterest("shina mahiru anime icons"),
            );

            let contextInfo = {
              forwardingScore: 50,
              isForwarded: true,
              externalAdReply: {
                showAdAttribution: true,
                title: "Broadcast Groups",
                body: wm,
                previewType: "PHOTO",
                thumbnailUrl: image,
              },
            };

            await delay(3000); // Tunggu 5 detik sebelum mengirim pesan berikutnya

            if (m.isMedia) {
              let mediaData = await downloadM();
              client.sendFile(
                groupId,
                mediaData,
                ".file",
                text,
                fkontak,
                false,
                {
                  contextInfo,
                },
              );
            } else {
              client.sendMessage(
                groupId,
                { text, contextInfo },
                { quoted: fkontak },
              );
            }
          }

          m.reply(`Broadcast to ${groupIds.length} Group Sent Successfully`);
        }
        break;

      case "clearsesi":
      case "clearsession":
        {
          fs.readdir("./session", async function (err, files) {
            if (err) {
              console.log("Unable to scan directory: " + err);
              return m.reply("Unable to scan directory: " + err);
            }
            let filteredArray = await files.filter(
              (item) =>
                item.startsWith("pre-key") ||
                item.startsWith("sender-key") ||
                item.startsWith("session-"),
            );
            console.log(filteredArray.length);
            let teks = `Detected ${filteredArray.length} memory file\n\n`;
            if (filteredArray.length == 0) return m.reply(teks);
            m.reply(teks);
            await delay(2000);
            m.reply("delete session files...");
            await filteredArray.forEach(function (file) {
              fs.unlinkSync(`./session/${file}`);
            });
            await delay(2000);
            m.reply("Successfully deleted all memories in the session folder");
          });
        }
        break;

      case "mode":
        {
          if (!m.isOwner) return m.reply("owner");
          if (m.args == "public") {
            process.env.SELF = false;
            m.reply("Success Public mode!");
          } else if (m.args == "self") {
            process.env.SELF = true;
            m.reply("Success Self mode!");
          } else
            m.reply(
              "What node do you want to redirect to?\n\n*Example :* _.mode self_",
            );
        }
        break;
        
      case "getcase":
        {
          if (!m.isOwner) return;
          if (!m.text) throw "What case command?";
          try {
            const getCase = (cases) => {
              const fileContent = fs
                .readFileSync("./system/message.js")
                .toString();

              const regex = new RegExp(
                `case\\s*['"]${cases}['"]([\\s\\S]*?)break`,
              );
              const match = fileContent.match(regex);

              if (!match) {
                throw `No case '${cases}' found in file.`;
              }

              return `case '${cases}'${match[1]}break`;
            };
            const res = await getCase(m.text);
            m.reply(res);
          } catch (e) {
            console.error(e);
            throw "No case command!";
          }
        }
        break;
      case "ttstalk":
      case "tiktokstalk":
        {
          if (!m.text)
            throw `[!] _Input Yout Username!_\n\n${m.prefix + m.command} arifzxa19`;

          try {
            let res = await Func.fetchJson(
              API("arifzyn", "/stalk/tiktok", { username: m.text }, "apikey"),
            );
            res = res.result.data;
            let txt = "`</> TikTok Stalk </>`\n\n";
            txt += `> *Name :* ${m.text}\n`;
            txt += `> *following :* ${res.following}\n`;
            txt += `> *followers :* ${res.followers}\n`;
            txt += `> *likes :* ${res.likes}\n\n`;
            txt += wm;
            await client.sendMessage(
              m.from,
              {
                image: { url: res.avatar },
                caption: txt,
                mimetype: "image/jpeg",
              },
              { quoted: m },
            );
          } catch (e) {
            console.error(e);
          }
        }
        break;
      case "ghstalk":
      case "githubstalk":
        {
          if (!m.text)
            throw `[!] _Input Yout Username!_\n\n${m.prefix + m.command} arifzxa19`;

          try {
            const res = await Func.fetchJson(
              `https://api.github.com/users/${m.text}`,
            );
            let txt = "`</> Github Stalk </>`\n\n";

            const filter = Object.keys(res).filter(
              (x) =>
                !/avatar_url|html_url|followers_url|following_url|gists_url|starred_url|subscriptions_url|organizations_url|events_url|received_events_url/g.test(
                  x,
                ),
            );
            for (const x of filter) {
              txt += `> *${Func.ucword(x).replace(/_/g, " ")} :* ${res[x]}\n`;
            }
            txt += `\n${wm}`;
            await client.sendMessage(
              m.from,
              {
                image: { url: res.avatar_url },
                caption: txt,
                mimetype: "image/jpeg",
              },
              { quoted: m },
            );
          } catch (e) {
            console.error(e);
            throw "Error stalk github!";
          }
        }
        break;
      
      default:
        // eval
        if (
          [">", "eval", "=>"].some((a) =>
            m.command.toLowerCase().startsWith(a),
          ) &&
          m.isOwner
        ) {
          if (!owner.includes(m.sender.split("@")[0])) return;

          let evalCmd = "";
          try {
            evalCmd = /await/i.test(m.text)
              ? eval("(async() => { " + m.text + " })()")
              : eval(m.text);
          } catch (e) {
            evalCmd = e;
          }
          new Promise(async (resolve, reject) => {
            try {
              resolve(evalCmd);
            } catch (err) {
              reject(err);
            }
          })
            ?.then((res) => client.reply(m.from, util.format(res), m))
            ?.catch((err) => {
              let text = util.format(err);
              for (let key of Object.values(global.APIKeys)) {
                text = text.replace(new RegExp(key, "g"), "#HIDDEN#");
              }
              client.reply(m.from, util.format(text), m);
            });
        }

        // exec
        if (
          ["$", "exec"].some((a) => m.command.toLowerCase().startsWith(a)) &&
          m.isOwner
        ) {
          if (!owner.includes(m.sender.split("@")[0])) return;
          let o;

          try {
            o = await exec(m.text);
          } catch (e) {
            o = e;
          } finally {
            let { stdout, stderr } = o;
            if (typeof stdout === "string" && stdout.trim()) m.reply(stdout);
            if (typeof stderr === "string" && stderr.trim()) m.reply(stderr);
          }
        }
    }
  } catch (err) {
    console.error(util.format(err));
    await m.reply(util.format(err));
  }
}

const __filenames = fileURLToPath(import.meta.url);

watchFile(__filenames, () => {
  unwatchFile(__filename);
  console.log(`Update ${__filenames}`);
  import(__filenames);
});
