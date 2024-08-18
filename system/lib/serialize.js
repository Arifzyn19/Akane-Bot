/* 
  Original Source : https://github.com/Hisoka-Morrou/hisoka-baileys
  Recode By : Arifzyn
  Github : https://github.com/Arifzyn19
*/

import "dotenv/config";
import "../../config.js";

import {
  escapeRegExp,
  getFile,
  getBuffer,
  fetchBuffer,
  isReadableStream,
  saveStreamToFile,
} from "./function.js";
import { writeExif, writeExifStik } from "./sticker.js";

import baileys, {
  jidNormalizedUser,
  extractMessageContent,
  areJidsSameUser,
  downloadMediaMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  toReadable,
  WA_DEFAULT_EPHEMERAL,
} from "@whiskeysockets/baileys";
const { proto } = baileys;
import { parsePhoneNumber } from "libphonenumber-js";
import { fileTypeFromBuffer, fileTypeStream } from "file-type";
import path from "path";
import fs from "fs";
import pino from "pino";

export const getContentType = (content) => {
  if (content) {
    const keys = Object.keys(content);
    const key = keys.find(
      (k) =>
        (k === "conversation" ||
          k.endsWith("Message") ||
          k.includes("V2") ||
          k.includes("V3")) &&
        k !== "senderKeyDistributionMessage",
    );
    return key;
  }
};

export function Client({ client, store }) {
  const Akane = Object.defineProperties(client, {
    getName: {
      async value(jid) {
        let id = jidNormalizedUser(jid);
        if (id.endsWith("g.us")) {
          let metadata =
            store.groupMetadata?.[id] || (await client.groupMetadata(id));
          return metadata.subject;
        } else {
          let metadata = store.contacts[id];
          return (
            metadata?.name ||
            metadata?.verifiedName ||
            metadata?.notify ||
            parsePhoneNumber("+" + id.split("@")[0]).format("INTERNATIONAL")
          );
        }
      },
    },

    sendContact: {
      async value(jid, number, quoted, options = {}) {
        let list = [];
        for (let v of number) {
          if (v.endsWith("g.us")) continue;
          v = v.replace(/\D+/g, "");
          list.push({
            displayName: await client.getName(v + "@s.whatsapp.net"),
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await client.getName(v + "@s.whatsapp.net")}\nFN:${await client.getName(v + "@s.whatsapp.net")}\nitem1.TEL;waid=${v}:${v}\nEND:VCARD`,
          });
        }
        return client.sendMessage(
          jid,
          {
            contacts: {
              displayName: `${list.length} Contact`,
              contacts: list,
            },
          },
          { quoted, ...options },
        );
      },
      enumerable: true,
    },

    parseMention: {
      value(text) {
        return (
          [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
            (v) => v[1] + "@s.whatsapp.net",
          ) || []
        );
      },
    },

    downloadMediaMessage: {
      async value(message, filename) {
        let media = await downloadMediaMessage(
          message,
          "buffer",
          {},
          {
            logger: pino({
              timestamp: () => `,"time":"${new Date().toJSON()}"`,
              level: "fatal",
            }).child({ class: "client" }),
            reuploadRequest: client.updateMediaMessage,
          },
        );

        if (filename) {
          let mime = await fileTypeFromBuffer(media);
          let filePath = path.join(process.cwd(), `${filename}.${mime.ext}`);
          fs.promises.writeFile(filePath, media);
          return filePath;
        }

        return media;
      },
      enumerable: true,
    },

    getFile: {
      /**
       * getBuffer hehe
       * @param {fs.PathLike} PATH
       * @param {Boolean} saveToFile
       */
      async value(PATH, saveToFile = false) {
        let res, filename;
        const data = Buffer.isBuffer(PATH)
          ? PATH
          : PATH instanceof ArrayBuffer
            ? PATH.toBuffer()
            : /^data:.*?\/.*?;base64,/i.test(PATH)
              ? Buffer.from(PATH.split`,`[1], "base64")
              : /^https?:\/\//.test(PATH)
                ? await (res = await getBuffer(PATH))
                : fs.existsSync(PATH)
                  ? ((filename = PATH), fs.readFileSync(PATH))
                  : typeof PATH === "string"
                    ? PATH
                    : Buffer.alloc(0);
        if (!Buffer.isBuffer(data))
          throw new TypeError("Result is not a buffer");
        const type = (await fileTypeFromBuffer(data)) || {
          mime: "application/octet-stream",
          ext: ".bin",
        };
        if (data && saveToFile && !filename)
          (filename = path.join(
            process.cwd(),
            "system",
            "tmp/" + new Date() * 1 + "." + type.ext,
          )),
            await fs.promises.writeFile(filename, data);
        return {
          res,
          filename,
          ...type,
          data,
          deleteFile() {
            return filename && fs.promises.unlink(filename);
          },
        };
      },
      enumerable: true,
    },

    sendMedia: {
      async value(jid, url, quoted = "", options = {}) {
        let { mime, data: buffer, ext, size } = await client.getFile(url);
        mime = options?.mimetype ? options.mimetype : mime;
        let data = { text: "" },
          mimetype = /audio/i.test(mime) ? "audio/mpeg" : mime;
        if (size > 45000000)
          data = {
            document: buffer,
            mimetype: mime,
            fileName: options?.fileName
              ? options.fileName
              : `${client.user?.name} (${new Date()}).${ext}`,
            ...options,
          };
        else if (options.asDocument)
          data = {
            document: buffer,
            mimetype: mime,
            fileName: options?.fileName
              ? options.fileName
              : `${client.user?.name} (${new Date()}).${ext}`,
            ...options,
          };
        else if (options.asSticker || /webp/.test(mime)) {
          let pathFile = await writeExifStik(
            { mimetype, data: buffer },
            { ...options },
          );
          data = {
            sticker: fs.readFileSync(pathFile),
            mimetype: "image/webp",
            ...options,
          };
          fs.existsSync(pathFile) ? await fs.promises.unlink(pathFile) : "";
        } else if (/image/.test(mime))
          data = {
            image: buffer,
            mimetype: options?.mimetype ? options.mimetype : "image/png",
            ...options,
          };
        else if (/video/.test(mime))
          data = {
            video: buffer,
            mimetype: options?.mimetype ? options.mimetype : "video/mp4",
            ...options,
          };
        else if (/audio/.test(mime))
          data = {
            audio: buffer,
            mimetype: options?.mimetype ? options.mimetype : "audio/mpeg",
            ...options,
          };
        else data = { document: buffer, mimetype: mime, ...options };
        let msg = await client.sendMessage(jid, data, { quoted, ...options });
        return msg;
      },
      enumerable: true,
    },

    sendFile: {
      async value(
        jid,
        path,
        filename = "",
        caption = "",
        quoted,
        ptt = false,
        options = {},
        isConvert = false,
      ) {
        const file = await client.getFile(path);
        let mtype = "",
          buffer = file.data,
          mimetype = options.mimetype || file.mime,
          convert;
        const opt = {};

        if (quoted) opt.quoted = quoted;
        if (!file.ext === ".bin") options.asDocument = true;

        if (
          /webp/.test(mimetype) ||
          (/image/.test(mimetype) && options.asSticker)
        )
          mtype = "sticker";
        else if (
          /image/.test(mimetype) ||
          (/webp/.test(mimetype) && options.asImage)
        )
          mtype = "image";
        else if (/video/.test(mimetype)) mtype = "video";
        else if (/audio/.test(mimetype)) {
          mtype = "audio";
          mimetype = options.mimetype || file.mime || "audio/mpeg";
        } else mtype = "document";
        if (options.asDocument) mtype = "document";
        if (Buffer.byteLength(buffer) > 70000000) mtype = "document";

        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;

        let message = {
          ...options,
          caption,
          ptt,
          [mtype]: buffer,
          mimetype,
          fileName: filename || file.filename || `file.${file.ext}`,
        };
        let error = false;
        try {
          return await client.sendMessage(jid, message, { ...opt, ...options });
        } catch (e) {
          console.error(e);
          error = e;
        } finally {
          if (error) throw error;
        }
      },
    },

    cMod: {
      value(jid, copy, text = "", sender = client.user.id, options = {}) {
        let mtype = getContentType(copy.message);
        let content = copy.message[mtype];
        if (typeof content === "string") copy.message[mtype] = text || content;
        else if (content.caption) content.caption = text || content.caption;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== "string") {
          copy.message[mtype] = { ...content, ...options };
          copy.message[mtype].contextInfo = {
            ...(content.contextInfo || {}),
            mentionedJid:
              options.mentions || content.contextInfo?.mentionedJid || [],
          };
        }
        if (copy.key.participant)
          sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes("@s.whatsapp.net"))
          sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes("@broadcast"))
          sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, client.user.id);
        return baileys.proto.WebMessageInfo.fromObject(copy);
      },
      enumerable: false,
    },

    reply: {
      /**
       * Reply to a message
       * @param {String} jid
       * @param {String|Buffer} text
       * @param {import('@whiskeyclientets/baileys').proto.WebMessageInfo} quoted
       * @param {Object} options
       */
      value(jid, text = "", quoted, options = {}) {
        return Buffer.isBuffer(text)
          ? client.sendFile(jid, text, "file", "", quoted, false, options)
          : client.sendMessage(
              jid,
              { ...options, text },
              { quoted, ...options },
            );
      },
      writable: true,
    },

    sendButton: {
      async value(jid, text, footer, buttons, quoted, opts = {}) {
        let msg = generateWAMessageFromContent(
          jid,
          {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2,
                },
                interactiveMessage:
                  baileys.proto.Message.InteractiveMessage.create({
                    ...opts,
                    body: baileys.proto.Message.InteractiveMessage.Body.create({
                      text: text,
                    }),
                    footer:
                      baileys.proto.Message.InteractiveMessage.Footer.create({
                        text: footer,
                      }),
                    header:
                      baileys.proto.Message.InteractiveMessage.Header.create({
                        title: "",
                        subtitle: "",
                      }),
                    nativeFlowMessage:
                      baileys.proto.Message.InteractiveMessage.NativeFlowMessage.create(
                        {
                          buttons,
                        },
                      ),
                  }),
              },
            },
          },
          {
            quoted: quoted,
            userJid: opts && opts.userJid ? opts.userJid : null,
          },
        );

        await client.relayMessage(msg.key.remoteJid, msg.message, {
          messageId: msg.key.id,
        });
      },
      writable: true,
    },

    sendList: {
      async value(jid, title, text, footer, sections, opts = {}) {
        let message = generateWAMessageFromContent(
          jid,
          {
            viewOnceMessage: {
              message: {
                interactiveMessage:
                  baileys.proto.Message.InteractiveMessage.create({
                    ...opts,
                    header: {
                      title: title,
                    },
                    body: {
                      text: text,
                    },
                    footer: {
                      text: footer,
                    },
                    nativeFlowMessage: {
                      buttons: [
                        {
                          name: "single_select",
                          buttonParamsJson: JSON.stringify({
                            title: "Click Here",
                            sections: sections,
                          }),
                        },
                      ],
                      messageParamsJson: "",
                    },
                  }),
              },
            },
          },
          { ...opts },
        );
        await client.sendPresenceUpdate("composing", jid);
        client.relayMessage(jid, message["message"], {
          messageId: message.key.id,
        });
      },
      writable: true,
    },

    sendListM: {
      async value(jid, text, footer, url, list, quoted, options = {}) {
        let header = {
          hasMediaAttachment: false,
        };

        if (url) {
          const media = await prepareWAMessageMedia(
            { image: { url: url } },
            { upload: client.waUploadToServer },
          );
          header = {
            ...header,
            ...media,
          };
        }

        let msg = generateWAMessageFromContent(
          jid,
          {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2,
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                  body: proto.Message.InteractiveMessage.Body.create({
                    text: text,
                  }),
                  footer: proto.Message.InteractiveMessage.Footer.create({
                    text: footer,
                  }),
                  header:
                    proto.Message.InteractiveMessage.Header.create(header),
                  nativeFlowMessage:
                    proto.Message.InteractiveMessage.NativeFlowMessage.create({
                      buttons: [
                        {
                          name: "single_select",
                          buttonParamsJson: JSON.stringify({
                            title: "Click Here",
                            sections: list,
                          }),
                        },
                      ],
                    }),
                  contextInfo: options.contextInfo || {},
                }),
              },
            },
          },
          { quoted, userJid: quoted.key.remoteJid },
        );

        client.relayMessage(jid, msg.message, {
          messageId: msg.key.id,
        });
      },
      enumerable: true,
    },

    sendButtonCard: {
      async value(jid, cards, quoted, opts = {}) {
        const prepareMedia = async (media) => {
          const { data } = await client.getFile(media);

          return await prepareWAMessageMedia(
            {
              image: { url: media },
            },
            { upload: client.waUploadToServer },
          );
        };

        const carouselCards = await Promise.all(
          cards.map(async (card) => {
            const media = await prepareMedia(card.image);
            const buttonType = card.buttonType || "cta_url";
            const displayText =
              card.displayText ||
              buttonType.charAt(0).toUpperCase() + buttonType.slice(1);
            const buttonId = card.buttonId || null;
            return {
              header: {
                ...(await media),
                hasMediaAttachment: true,
              },
              body: { text: card.bodyText },
              nativeFlowMessage: {
                buttons: card.buttons.map((button) => ({
                  name: button.type,
                  buttonParamsJson: JSON.stringify({
                    display_text: button.displayText,
                    id: button.id,
                    url: button.type === "cta_url" ? button.url : null,
                    merchant_url:
                      button.type === "cta_url" ? button.merchant_url : null,
                  }),
                })),
              },
            };
          }),
        );

        const message = generateWAMessageFromContent(
          jid,
          {
            viewOnceMessage: {
              message: {
                interactiveMessage: {
                  carouselMessage: {
                    cards: carouselCards,
                    messageVersion: 1,
                  },
                },
              },
            },
          },
          {
            quoted: quoted,
          },
        );

        await client.sendPresenceUpdate("composing", jid);
        client.relayMessage(jid, message.message, {
          messageId: message.key.id,
        });
      },
      writable: true,
    },

    sendTemplate: {
      async value(jid, templateMessage, quoted = null) {
        var quotedMsg;
        if (quoted) {
          quotedMsg = quoted.message;
        }
        const buttons = templateMessage.templateButtons.map((button) => {
          if (button.urlButton) {
            return {
              name: "cta_url",
              buttonParamsJson: `{"display_text":"${button.urlButton.displayText}","url":"${button.urlButton.url}","merchant_url":"${button.urlButton.url}"}`,
            };
          } else if (button.callButton) {
            return {
              name: "cta_call",
              buttonParamsJson: `{"display_text":"${button.callButton.displayText}","id":"${button.callButton.phoneNumber}"}`,
            };
          } else if (button.quickReplyButton) {
            return {
              name: "quick_reply",
              buttonParamsJson: `{"display_text":"${button.quickReplyButton.displayText}","id":"${button.quickReplyButton.id}"}`,
            };
          } else if (button.copyButton) {
            return {
              name: "cta_copy",
              buttonParamsJson: `{"display_text":"${button.copyButton.displayText}","id":"${button.copyButton.id}","copy_code":"${button.copyButton.code}"}`,
            };
          }
        });
        let header = proto.Message.InteractiveMessage.Header.fromObject({
          title: templateMessage.title,
          subtitle: "",
          hasMediaAttachment: false,
        });

        console.log(buttons);

        if (templateMessage.image) {
          header = {
            ...header,
            ...(await prepareWAMessageMedia(
              { image: templateMessage.image },
              { upload: client.waUploadToServer },
            )),
          };
        } else if (templateMessage.video) {
          header = {
            ...header,
            ...(await prepareWAMessageMedia(
              { video: templateMessage.video },
              { upload: client.waUploadToServer },
            )),
          };
        }
        let msg = generateWAMessageFromContent(
          jid,
          {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2,
                },
                contextInfo: {
                  quotedMessage: quotedMsg,
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject(
                  {
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                      text: templateMessage.text,
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                      text: templateMessage.footer,
                    }),
                    header: header,
                    nativeFlowMessage:
                      proto.Message.InteractiveMessage.NativeFlowMessage.fromObject(
                        {
                          buttons: buttons,
                        },
                      ),
                  },
                ),
              },
            },
          },
          { quoted: quoted },
        );
        await client.relayMessage(jid, msg.message, {
          messageId: msg.key.id,
        });
      },
      writable: true,
    },

    msToDate: {
      value(ms) {
        let days = Math.floor(ms / (24 * 60 * 60 * 1000));
        let daysms = ms % (24 * 60 * 60 * 1000);
        let hours = Math.floor(daysms / (60 * 60 * 1000));
        let hoursms = ms % (60 * 60 * 1000);
        let minutes = Math.floor(hoursms / (60 * 1000));
        let minutesms = ms % (60 * 1000);
        let sec = Math.floor(minutesms / 1000);
        return days + " Days " + hours + " Hours " + minutes + " Minutes";
      },
      enumerable: true,
    },

    msToTime: {
      value(ms) {
        let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
        let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
        let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
        return [h + " Hours ", m + " Minutes ", s + " Second"]
          .map((v) => v.toString().padStart(2, 0))
          .join(" ");
      },
      enumerable: true,
    },

    msToHour: {
      value(ms) {
        let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
        return [h + " Jam "].map((v) => v.toString().padStart(2, 0)).join(" ");
      },
      enumerable: true,
    },

    msToMinute: {
      value(ms) {
        let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
        return [m + " Menit "]
          .map((v) => v.toString().padStart(2, 0))
          .join(" ");
      },
      enumerable: true,
    },

    msToSecond: {
      value(ms) {
        let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
        return [s + " Detik"].map((v) => v.toString().padStart(2, 0)).join(" ");
      },
      enumerable: true,
    },

    clockString: {
      value(ms) {
        let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
        let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
        let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
        return [h + " Jam ", m + " Menit ", s + " Detik"]
          .map((v) => v.toString().padStart(2, 0))
          .join(" ");
      },
      enumerable: true,
    },

    sendMsg: {
      async value(jid, message = {}, options = {}) {
        return await client.sendMessage(jid, message, {
          ...options,
          backgroundColor: "",
          ephemeralExpiration: 86400,
        });
      },
      enumerable: false,
      writable: true,
    },

    sendFThumb: {
      async value(
        jid,
        title,
        text = "",
        thumbnailUrl,
        sourceUrl,
        quoted,
        LargerThumbnail = true,
        AdAttribution = true,
      ) {
        return client.sendMsg(
          jid,
          {
            ...{
              contextInfo: {
                mentionedJid: await client.parseMention(text),
                externalAdReply: {
                  title: title,
                  body: null,
                  mediaType: 1,
                  previewType: 0,
                  showAdAttribution: AdAttribution,
                  renderLargerThumbnail: LargerThumbnail,
                  thumbnailUrl: thumbnailUrl,
                  sourceUrl: sourceUrl,
                },
              },
            },
            text,
          },
          { quoted },
        );
      },
      enumerable: false,
      writable: true,
    },
    sendFAudio: {
      async value(
        jid,
        audioinfo = {},
        m,
        title,
        thumbnailUrl,
        sourceUrl,
        body = "",
        LargerThumbnail = true,
        AdAttribution = true,
      ) {
        return await client.sendMsg(
          jid,
          {
            ...audioinfo,
            contextInfo: {
              externalAdReply: {
                title: title,
                body: body,
                thumbnailUrl: thumbnailUrl,
                sourceUrl: sourceUrl,
                mediaType: 1,
                showAdAttribution: AdAttribution,
                renderLargerThumbnail: LargerThumbnail,
              },
            },
          },
          { quoted: m },
        );
      },
      enumerable: false,
      writable: true,
    },

    sendQuick: {
      async value(jid, message, footer, buttons, quoted, options = {}) {
        let buttonsArray = buttons.map(([buttonText, quickText]) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: buttonText,
            id: quickText,
          }),
        }));
        let content = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                  text: message,
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: footer,
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  hasMediaAttachment: false,
                }),
                contextInfo: {
                  mentionedJid: [message],
                  stanzaId: quoted ? quoted.key.id : undefined,
                  remoteJid: quoted ? quoted.key.remoteJid : undefined,
                  participant: quoted ? quoted.key.participant : undefined,
                  quotedMessage: quoted ? quoted.message : undefined,
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363220399960108@newsletter",
                    newsletterName: "NEKOHIME SAN NYAA",
                    serverMessageId: 103,
                  },
                },
                ...options,
                nativeFlowMessage:
                  proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: buttonsArray,
                  }),
              }),
            },
          },
        };
        let msg = generateWAMessageFromContent(jid, content, {
          quoted: quoted,
          ephemeralExpiration: WA_DEFAULT_EPHEMERAL,
        });
        await client.relayMessage(jid, msg.message, {
          messageId: msg.key.id,
        });
      },
      enumerable: true,
      writable: true,
    },
  });

  return Akane;
}

export default async function serialize(client, msg, store) {
  const m = {};

  if (!msg.message) return;

  // oke
  if (!msg) return msg;

  //let M = proto.WebMessageInfo
  m.message = parseMessage(msg.message);

  if (msg.key) {
    m.key = msg.key;
    m.from = m.key.remoteJid.startsWith("status")
      ? jidNormalizedUser(m.key.participant)
      : jidNormalizedUser(m.key.remoteJid);
    m.fromMe = m.key.fromMe;
    m.id = m.key.id;
    m.device = /^3A/.test(m.id)
      ? "ios"
      : /^3E/.test(m.id)
        ? "web"
        : /^.{21}/.test(m.id)
          ? "android"
          : /^.{18}/.test(m.id)
            ? "desktop"
            : "unknown";
    m.isBot = m.id.startsWith("BAE5") || m.id.startsWith("HSK");
    m.isGroup = m.from.endsWith("@g.us");
    m.participant =
      jidNormalizedUser(msg?.participant || m.key.participant) || false;
    m.sender = jidNormalizedUser(
      m.fromMe ? client.user.id : m.isGroup ? m.participant : m.from,
    );
  }

  if (m.isGroup) {
    m.metadata =
      store.groupMetadata[m.from] || (await client.groupMetadata(m.from));
    m.groupAdmins =
      m.isGroup &&
      m.metadata.participants.reduce(
        (memberAdmin, memberNow) =>
          (memberNow.admin
            ? memberAdmin.push({ id: memberNow.id, admin: memberNow.admin })
            : [...memberAdmin]) && memberAdmin,
        [],
      );
    m.isAdmin =
      m.isGroup && !!m.groupAdmins.find((member) => member.id === m.sender);
    m.isBotAdmin =
      m.isGroup &&
      !!m.groupAdmins.find(
        (member) => member.id === jidNormalizedUser(client.user.id),
      );
  }

  m.pushName = msg.pushName;
  m.isOwner = m.sender && global.owner.includes(m.sender.replace(/\D+/g, ""));

  if (m.message) {
    m.type = getContentType(m.message) || Object.keys(m.message)[0];
    m.msg = parseMessage(m.message[m.type]) || m.message[m.type];
    m.mentions = [
      ...(m.msg?.contextInfo?.mentionedJid || []),
      ...(m.msg?.contextInfo?.groupMentions?.map((v) => v.groupJid) || []),
    ];
    m.body =
      m.msg?.text ||
      m.msg?.conversation ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedId ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      m.msg?.name ||
      "";

    // respon btn
    if (m.type === "interactiveResponseMessage") {
      let msg = m.message[m.type] || m.msg;
      if (msg.nativeFlowResponseMessage && !m.isBot) {
        let { id } = JSON.parse(msg.nativeFlowResponseMessage.paramsJson) || {};
        if (id) {
          let emit_msg = {
            key: {
              ...m.key,
            },
            message: {
              extendedTextMessage: {
                text: id,
              },
            },
            pushName: m.pushName,
            messageTimestamp: m.messageTimestamp || 754785898978,
          };
          return client.ev.emit("messages.upsert", {
            messages: [emit_msg],
            type: "notify",
          });
        }
      }
    }
    m.prefix = new RegExp(`^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]`, "gi").test(
      m.body,
    )
      ? m.body.match(new RegExp(`^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]`, "gi"))[0]
      : "";
    m.command =
      m.body && m.body.trim().replace(m.prefix, "").trim().split(/ +/).shift();
    m.args =
      m.body
        .trim()
        .replace(new RegExp("^" + escapeRegExp(m.prefix), "i"), "")
        .replace(m.command, "")
        .split(/ +/)
        .filter((a) => a) || [];
    m.text = m.args.join(" ").trim();
    m.expiration = m.msg?.contextInfo?.expiration || 0;
    m.timestamps =
      typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp * 1000
        : m.msg.timestampMs * 1000;
    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;

    m.isQuoted = false;
    if (m.msg?.contextInfo?.quotedMessage) {
      m.isQuoted = true;
      m.quoted = {};
      m.quoted.message = parseMessage(m.msg?.contextInfo?.quotedMessage);

      if (m.quoted.message) {
        m.quoted.type =
          getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0];
        m.quoted.msg =
          parseMessage(m.quoted.message[m.quoted.type]) ||
          m.quoted.message[m.quoted.type];
        m.quoted.isMedia =
          !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
        m.quoted.key = {
          remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
          participant: jidNormalizedUser(m.msg?.contextInfo?.participant),
          fromMe: areJidsSameUser(
            jidNormalizedUser(m.msg?.contextInfo?.participant),
            jidNormalizedUser(client?.user?.id),
          ),
          id: m.msg?.contextInfo?.stanzaId,
        };
        m.quoted.from = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid)
          ? m.quoted.key.participant
          : m.quoted.key.remoteJid;
        m.quoted.fromMe = m.quoted.key.fromMe;
        m.quoted.id = m.msg?.contextInfo?.stanzaId;
        m.quoted.device = /^3A/.test(m.quoted.id)
          ? "ios"
          : /^3E/.test(m.quoted.id)
            ? "web"
            : /^.{21}/.test(m.quoted.id)
              ? "android"
              : /^.{18}/.test(m.quoted.id)
                ? "desktop"
                : "unknown";
        m.quoted.isBot =
          m.quoted.id?.length === 16 ||
          (m.quoted.id?.startsWith("3EB0") && m.quoted.id?.length === 12) ||
          false;
        m.quoted.isGroup = m.quoted.from.endsWith("@g.us");
        m.quoted.participant =
          jidNormalizedUser(m.msg?.contextInfo?.participant) || false;
        m.quoted.sender = jidNormalizedUser(
          m.msg?.contextInfo?.participant || m.quoted.from,
        );
        m.quoted.mentions = [
          ...(m.quoted.msg?.contextInfo?.mentionedJid || []),
          ...(m.quoted.msg?.contextInfo?.groupMentions?.map(
            (v) => v.groupJid,
          ) || []),
        ];
        m.quoted.body =
          m.quoted.msg?.text ||
          m.quoted.msg?.caption ||
          m.quoted?.message?.conversation ||
          m.quoted.msg?.selectedButtonId ||
          m.quoted.msg?.singleSelectReply?.selectedRowId ||
          m.quoted.msg?.selectedId ||
          m.quoted.msg?.contentText ||
          m.quoted.msg?.selectedDisplayText ||
          m.quoted.msg?.title ||
          m.quoted?.msg?.name ||
          "";
        m.quoted.prefix = new RegExp(
          `^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]`,
          "gi",
        ).test(m.quoted.body)
          ? m.quoted.body.match(
              new RegExp(`^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]`, "gi"),
            )[0]
          : "";
        m.quoted.command =
          m.quoted.body &&
          m.quoted.body.replace(m.quoted.prefix, "").trim().split(/ +/).shift();
        m.quoted.args =
          m.quoted.body
            .trim()
            .replace(new RegExp("^" + escapeRegExp(m.quoted.prefix), "i"), "")
            .replace(m.quoted.command, "")
            .split(/ +/)
            .filter((a) => a) || [];
        m.quoted.text = m.quoted.args.join(" ").trim() || m.quoted.body;
        m.quoted.isOwner =
          m.quoted.sender &&
          global.owner.includes(m.quoted.sender.replace(/\D+/g, ""));
      }
    }
  }

  m.react = (emoji) =>
    client.sendMessage(m.from, {
      react: {
        text: String(emoji),
        key: m.key,
      },
    });

  m.reply = async (text, options = {}) => {
    let chatId = options?.from ? options.from : m.from;
    let quoted = options?.quoted ? options.quoted : m;
    let caption = options?.caption ? options.caption : "";

    if (
      Buffer.isBuffer(text) ||
      /^data:.?\/.*?;base64,/i.test(text) ||
      /^https?:\/\//.test(text) ||
      fs.existsSync(text)
    ) {
      let data = await client.getFile(text);
      if (
        !options.mimetype &&
        (/utf-8|json/i.test(data.mime) || data.ext == ".bin" || !data.ext)
      ) {
        if (!!global.msg[text]) text = global.msg[text];
        return client.sendMessage(
          chatId,
          {
            text,
            mentions: [m.sender, ...client.parseMention(text)],
            ...options,
          },
          { quoted, ephemeralExpiration: m.expiration, ...options },
        );
      } else {
        return client.sendFile(m.from, data.data, null, caption, quoted, {
          ephemeralExpiration: m.expiration,
          ...options,
        });
      }
    } else {
      if (!!global.msg[text]) text = global.msg[text];
      return client.sendMessage(
        chatId,
        {
          text,
          mentions: [m.sender, ...client.parseMention(text)],
          ...options,
        },
        { quoted, ephemeralExpiration: m.expiration, ...options },
      );
    }
  };

  m.replyUpdate = (text, cb) => {
    return new Promise(async (resolve) => {
      const response = await client.sendMessage(
        m.from,
        { text: String(text) },
        { quoted: m },
      );
      if (typeof cb === "function") {
        /**
         * @param {string} n_text - The new text to update the message.
         * @returns {void}
         */
        cb(async (n_text) => {
          await client.sendMessage(m.from, {
            text: String(n_text),
            edit: response.key,
          });
          resolve();
        });
      }
      resolve();
    });
  };

  return m;
}

function parseMessage(content) {
  content = extractMessageContent(content);

  if (content && content.viewOnceMessageV2Extension) {
    content = content.viewOnceMessageV2Extension.message;
  }
  if (
    content &&
    content.protocolMessage &&
    content.protocolMessage.type == 14
  ) {
    let type = getContentType(content.protocolMessage);
    content = content.protocolMessage[type];
  }
  if (content && content.message) {
    let type = getContentType(content.message);
    content = content.message[type];
  }

  return content;
}

ArrayBuffer.prototype.toBuffer = function toBuffer() {
  return Buffer.from(new Uint8Array(this));
};
