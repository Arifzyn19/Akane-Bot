import "dotenv/config";

import axios from "axios";
import FormData from "form-data";
import { fileTypeFromBuffer, fileTypeStream } from "file-type";
import { toBuffer } from "@whiskeysockets/baileys";
import mimes from "mime-types";
import Stream, { Readable } from "stream";
import { createGzip } from "zlib";
import { promisify } from "util";
import { pipeline } from "stream";

const pipelineAsync = promisify(pipeline);

export function ucword(str) {
  return (str + "").replace(/^([a-z])|\s+([a-z])/g, function ($1) {
    return $1.toUpperCase();
  });
}

export function isReadableStream(stream) {
  if (typeof Stream.isReadable === "function") return Stream.isReadable(stream);
  if (stream && stream[kIsReadable] != null) return stream[kIsReadable];
  if (typeof stream?.readable !== "boolean") return null;
  if (isDestroyed(stream)) return false;
  return (
    (isReadableNodeStream(stream) &&
      !!stream.readable &&
      !isReadableFinished(stream)) ||
    stream instanceof fs.ReadStream ||
    stream instanceof Readable
  );
}

export function saveStreamToFile(stream, file) {
  new Promise((resolve, reject) => {
    const writable = stream.pipe(fs.createWriteStream(file));
    writable.once("finish", () => {
      resolve();
      writable.destroy();
    });
    writable.once("error", () => {
      reject();
      writable.destroy();
    });
  });
}

export const getBuffer = async (url, options) => {
  try {
    options ? options : {};
    const res = await axios({
      method: "get",
      url,
      headers: {
        DNT: 1,
        "Upgrade-Insecure-Request": 1,
      },
      ...options,
      responseType: "arraybuffer",
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

export function fetchBuffer(url, options = {}) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Upgrade-Insecure-Requests": "1",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
          ...(!!options.headers ? options.headers : {}),
        },
        responseType: "stream",
        ...options,
      })
      .then(async ({ data, headers }) => {
        let buffer = await toBuffer(data);
        let position = headers
          .get("content-disposition")
          ?.match(/filename=(?:(?:"|')(.*?)(?:"|')|([^"'\s]+))/);
        let filename =
          decodeURIComponent(position?.[1] || position?.[2]) || null;
        let mimetype =
          mimes.lookup(filename) ||
          (await fileTypeFromBuffer(buffer)).mime ||
          "application/octet-stream";
        let ext =
          mimes.extension(mimetype) ||
          (await fileTypeFromBuffer(buffer)).ext ||
          "bin";

        resolve({ data: buffer, filename, mimetype, ext });
      })
      .catch(reject);
  });
}

export async function getFile(PATH, save) {
  try {
    let filename = null;
    let data = await fetchBuffer(PATH);

    if (data?.data && save) {
      filename = path.join(
        process.cwd(),
        "system",
        "temp",
        Date.now() + "." + data.ext,
      );
      fs.promises.writeFile(filename, data?.data);
    }
    return {
      filename: data?.name ? data.name : filename,
      ...data,
    };
  } catch (e) {
    throw e;
  }
}

export function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
          ...(!!options.headers ? options.headers : {}),
        },
        responseType: "json",
        ...options,
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
}

export function fetchText(url, options = {}) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
          ...(!!options.headers ? options.headers : {}),
        },
        responseType: "text",
        ...options,
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
}

export function isUrl(url) {
  let regex = new RegExp(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,9}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
    "gi",
  );
  if (!regex.test(url)) return false;
  return url.match(regex);
}

export const upload = {
  pomf(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();

      form.append("files[]", media, `file-${Date.now()}.${mime.ext}`);

      axios
        .post("https://pomf.lain.la/upload.php", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => resolve(data.files[0].url))
        .catch(reject);
    });
  },

  telegra(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();

      form.append("file", media, `file-${Date.now()}.${mime.ext}`);

      axios
        .post("https://telegra.ph/upload", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => resolve("https://telegra.ph" + data[0].src))
        .catch(reject);
    });
  },

  hari(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();

      form.append("file", media, `file-${Date.now()}.${mime.ext}`);

      axios
        .post("https://hari.christmas/upload", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => resolve(data.downloadUrl))
        .catch(reject);
    });
  },

  tmp(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();

      form.append("file", media, `file-${Date.now()}.${mime.ext}`);

      axios
        .post("https://tmpfiles.org/api/v1/upload", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => {
          const url = data.data.url.match(/https:\/\/tmpfiles.org\/(.*)/)[1];
          const hasil = "https://tmpfiles.org/dl/" + url;
          resolve(hasil);
        })
        .catch(reject);
    });
  },

  async freeimage(buffer) {
    const { data: html } = await axios
      .get("https://freeimage.host/")
      .catch(() => null);
    const token = html.match(/PF.obj.config.auth_token = "(.+?)";/)[1];
    let mime = await fileTypeFromBuffer(buffer);
    let form = new FormData();

    form.append("source", buffer, `file-${Date.now()}.${mime.ext}`);

    const options = {
      type: "file",
      action: "upload",
      timestamp: (Date.now() / 1000).toString(),
      auth_token: token,
      nsfw: "0",
    };
    for (const [key, value] of Object.entries(options)) {
      form.append(key, value);
    }
    const { data } = await axios.post("https://freeimage.host/json", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.image.url;
  },
};

export async function sendTelegram(chatId, data, options = {}) {
  try {
    let token = process.env.TELEGRAM_TOKEN;

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const DEFAULT_EXTENSIONS = {
      audio: "mp3",
      photo: "jpg",
      sticker: "webp",
      video: "mp4",
      animation: "mp4",
      video_note: "mp4",
      voice: "ogg",
    };

    let type = options?.type
      ? options.type
      : typeof data === "string"
        ? "text"
        : /webp/.test((await fileTypeFromBuffer(data))?.mime)
          ? "sticker"
          : /image/.test((await fileTypeFromBuffer(data))?.mime)
            ? "photo"
            : /video/.test((await fileTypeFromBuffer(data))?.mime)
              ? "video"
              : /opus/.test((await fileTypeFromBuffer(data))?.mime)
                ? "voice"
                : /audio/.test((await fileTypeFromBuffer(data))?.mime)
                  ? "audio"
                  : "document";

    let url = `https://api.telegram.org/bot${token}/send${type === "text" ? "Message" : capitalizeFirstLetter(type)}`;

    let form = new FormData();

    form.append("chat_id", chatId);
    if (type === "text") form.append(type, data);
    else {
      let fileType = await fileTypeFromBuffer(data);
      form.append(
        type,
        data,
        `file-${Date.now()}.${DEFAULT_EXTENSIONS?.[type] || fileType?.ext}`,
      );
      if (options?.caption) form.append("caption", options.caption);
    }

    let { data: response } = await axios.post(url, form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response;
  } catch (e) {
    throw e;
  }
}

export function formatSize(bytes, si = true, dp = 2) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return `${bytes.toFixed(dp)} ${units[u]}`;
}

// source code https://github.com/patrickkettner/filesize-parser
export function parseFileSize(input, si = true) {
  const thresh = si ? 1000 : 1024;

  var validAmount = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  var parsableUnit = function (u) {
    return u.match(/\D*/).pop() === u;
  };

  var incrementBases = {
    2: [
      [["b", "bit", "bits"], 1 / 8],
      [["B", "Byte", "Bytes", "bytes"], 1],
      [["Kb"], 128],
      [["k", "K", "kb", "KB", "KiB", "Ki", "ki"], thresh],
      [["Mb"], 131072],
      [["m", "M", "mb", "MB", "MiB", "Mi", "mi"], Math.pow(thresh, 2)],
      [["Gb"], 1.342e8],
      [["g", "G", "gb", "GB", "GiB", "Gi", "gi"], Math.pow(thresh, 3)],
      [["Tb"], 1.374e11],
      [["t", "T", "tb", "TB", "TiB", "Ti", "ti"], Math.pow(thresh, 4)],
      [["Pb"], 1.407e14],
      [["p", "P", "pb", "PB", "PiB", "Pi", "pi"], Math.pow(thresh, 5)],
      [["Eb"], 1.441e17],
      [["e", "E", "eb", "EB", "EiB", "Ei", "ei"], Math.pow(thresh, 6)],
    ],
    10: [
      [["b", "bit", "bits"], 1 / 8],
      [["B", "Byte", "Bytes", "bytes"], 1],
      [["Kb"], 125],
      [["k", "K", "kb", "KB", "KiB", "Ki", "ki"], 1000],
      [["Mb"], 125000],
      [["m", "M", "mb", "MB", "MiB", "Mi", "mi"], 1.0e6],
      [["Gb"], 1.25e8],
      [["g", "G", "gb", "GB", "GiB", "Gi", "gi"], 1.0e9],
      [["Tb"], 1.25e11],
      [["t", "T", "tb", "TB", "TiB", "Ti", "ti"], 1.0e12],
      [["Pb"], 1.25e14],
      [["p", "P", "pb", "PB", "PiB", "Pi", "pi"], 1.0e15],
      [["Eb"], 1.25e17],
      [["e", "E", "eb", "EB", "EiB", "Ei", "ei"], 1.0e18],
    ],
  };

  var options = arguments[1] || {};
  var base = parseInt(options.base || 2);

  var parsed = input.toString().match(/^([0-9\.,]*)(?:\s*)?(.*)$/);
  var amount = parsed[1].replace(",", ".");
  var unit = parsed[2];

  var validUnit = function (sourceUnit) {
    return sourceUnit === unit;
  };

  if (!validAmount(amount) || !parsableUnit(unit)) {
    return false;
  }
  if (unit === "") return Math.round(Number(amount));

  var increments = incrementBases[base];
  for (var i = 0; i < increments.length; i++) {
    var _increment = increments[i];

    if (_increment[0].some(validUnit)) {
      return Math.round(amount * _increment[1]);
    }
  }

  throw unit + " doesn't appear to be a valid unit";
}

export function escapeRegExp(string) {
  return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
}

export function runtime(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

export function toUpper(query) {
  const arr = query.split(" ");
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
  }

  return arr.join(" ");
}
