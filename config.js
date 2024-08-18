import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

global.owner = ["6285691464024"];
global.mongoURL = process.env.MONGO_URL || "";

// watermark
global.wm = "Copyright © 2024 _Arifzyn API._";
global.nameown = "Arifzyn.";
global.namebot = "Arifzyn AI";
global.thumbnail = "https://telegra.ph/file/1b256c20ef6983f5608b8.jpg";
global.web = "https://api.arifzyn.tech"

global.APIs = {
  arifzyn: "https://api.arifzyn.tech",
};

global.APIKeys = {
  "https://api.arifzyn.tech": process.env.APIKEY || "",
};

global.API = (name, path = "/", query = {}, apikeyqueryname) => {
  const baseUrl = name in global.APIs ? global.APIs[name] : name;
  const apiKey = apikeyqueryname ? global.APIKeys[baseUrl] : "";
  const queryParams = new URLSearchParams({
    ...query,
    ...(apikeyqueryname && apiKey ? { [apikeyqueryname]: apiKey } : {}),
  });

  return baseUrl + path + (queryParams.toString() ? "?" + queryParams : "");
};

global.msg = {
  owner: "Features can only be accessed owner!",
  group: "Features only accessible in group!",
  private: "Features only accessible private chat!",
  admin: "Features can only be accessed by group admin!",
  botAdmin: "Bot is not admin, can't use the features!",
  bot: "Features only accessible by me",
  premium: "Features only accessible by premium users",
  media: "Reply media...",
  query: "No Query?",
  error:
    "Seems to have encountered an unexpected error, please repeat your command for a while again",
  quoted: "Reply message...",
  wait: "Wait a minute...",
  urlInvalid: "Url Invalid",
  notFound: "Result Not Found!",
};

global.__filename = fileURLToPath(import.meta.url);
global.__dirname = path.dirname(__filename);

fs.watchFile(__filename, (file) => {
  fs.unwatchFile(__filename);
  console.log(`Update ${__filename}`);
  import(filename);
});
