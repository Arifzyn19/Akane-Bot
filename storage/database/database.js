import fs from "fs";
import path from "path";

export default class Database {
  data = {};
  file = path.join(process.cwd(), "storage", "database.json");

  read() {
    let data;
    if (fs.existsSync(this.file)) {
      data = JSON.parse(fs.readFileSync(this.file));
    } else {
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
      data = this.data;
    }

    return data;
  }

  write(data) {
    this.data = !!data ? data : global.db;
    let dataCopy = JSON.parse(
      JSON.stringify(this.data, (key, value) => {
        // Exclude properties causing circular structure
        if (key === "updateAnimeInterval") return undefined;
        return value;
      }),
    );

    let dirname = path.dirname(this.file);
    if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(dataCopy, null, 2));
    return this.file;
  }

  load(m) {
    const isNumber = (x) => typeof x === "number" && !isNaN(x);
    const isBoolean = (x) => typeof x === "boolean" && Boolean(x);
    let user = global.db.users[m.sender];
    if (typeof user !== "object") global.db.users[m.sender] = {};
    if (user) {
      if (!("lastChat" in user)) user.lastChat = new Date() * 1;
      if (!("name" in user)) user.name = m.pushName;
      if (!isBoolean(user.banned)) user.banned = false;

      if (!isNumber(user.limit)) user.limit = 50;
      if (!isNumber(user.glimit)) user.glimit = 30;
      if (!isNumber(user.balance)) user.balance = 0;
      if (!isNumber(user.exp)) user.exp = 0;
      if (!isNumber(user.level)) user.level = 1;
      if (!isNumber(user.hit)) user.hit = 1;

      if (!("serial" in user)) user.serial = makeid(4);
      if (!isNumber(user.afk)) user.afk = -1;
      if (!("afkReason" in user)) user.afkReason = "";
      if (!isNumber(user.lastclaim)) user.lastclaim = 0;
      if (!isNumber(user.pc)) user.pc = 0;
      if (!isBoolean(user.autolevelup)) user.autolevelup = false;
      if (!isNumber(user.pc)) user.pc = 0;
      if (!user.grade) user.grade = "Newbie";

      if (!isBoolean(user.premium)) user.premium = false;
      if (!isNumber(user.premiumTime)) user.premiumTime = 0;
    } else {
      global.db.users[m.sender] = {
        lastChat: new Date() * 1,
        name: m.pushName,
        banned: false,

        limit: 50,
        glimit: 30,
        balance: 0,
        exp: 100,
        level: 1,
        hit: 0,

        serial: makeid(4).toUpperCase(),
        lastclaim: 0,
        afk: -1,
        pc: 0,
        grade: "Newbie",
        autolevelup: false,

        premium: false,
        premiumTime: 0,
      };
    }
    
    if (m.isGroup) {
      let group = global.db.groups[m.from];
      if (typeof group !== "object") global.db.groups[m.from] = {};
      if (group) {
        if (!isBoolean(group.mute)) group.mute = false;
        if (!isNumber(group.lastChat)) group.lastChat = new Date() * 1;
        if (!isBoolean(group.welcome)) group.welcome = true;
        if (!isBoolean(group.leave)) group.leave = true;
        if (!isBoolean(group.banned)) group.banned = false;
        if (!isBoolean(group.antilink)) group.antilink = false;

        if (!isNumber(group.joindate)) group.joindate = 0;
        if (!isNumber(group.joincd)) group.joincd = 0;
        if (!isNumber(group.expired)) group.expired = 0;

        if (!isBoolean(group.antiporn)) group.antiporn = false;
        if (!isBoolean(group.updateAnime)) group.updateAnime = false;
        if (!("updateAnimeInterval" in group)) group.updateAnimeInterval = null;
        if (!("lastAnime" in group)) group.lastAnime = [];
      } else {
        global.db.groups[m.from] = {
          lastChat: new Date() * 1,
          mute: false,
          welcome: true,
          leave: true,
          banned: false,
          antilink: false,

          joindate: 0,
          joincd: 0,
          expired: 0
        };
      }
    }

    let datas = global.db.datas;
    if (typeof datas !== "object") global.db.datas = {};
    if (datas) {
      if (!("anonymous" in datas)) datas.anonymous = [];
      if (!("blockcmd" in datas)) datas.blockcmd = [];
      if (!("dashboard" in datas)) datas.dashboard = [];
      if (!("hitToday" in datas)) datas.hitToday = [];
      if (!("allcommand" in datas)) datas.allcommand = [];
      if (!("data" in datas)) datas.data = [];
      if (!("sewa" in datas)) datas.sewa = [];
      if (!("store" in datas)) datas.store = [];
    } else
      global.db.datas = {
        anonymous: [],
        blockcmd: [],
        dashboard: [],
        hitToday: [],
        allcommand: [],
        data: [],
        sewa: [],
        store: []
      };
  }
}

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
