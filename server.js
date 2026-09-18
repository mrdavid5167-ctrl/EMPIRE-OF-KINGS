const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const ROOT = __dirname;
const CONFIG = path.join(ROOT, "config");
const DATA = path.join(ROOT, "data");

fs.mkdirSync(DATA, { recursive: true });

const FILES = {
  players: path.join(DATA, "players.json"),
  nextPlayer: path.join(DATA, "nextPlayerId.json"),
  nextCharacter: path.join(DATA, "nextCharacterId.json"),
  activity: path.join(DATA, "activity.log")
};

function readJson(file, fallback) {
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
  } catch (e) {
    console.error("Read error:", file, e.message);
    return fallback;
  }
}
function writeJson(file, value) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function loadConfig(name, fallback) {
  const file = path.join(CONFIG, name);
  return fs.existsSync(file) ? readJson(file, fallback) : fallback;
}
function iso() { return new Date().toISOString(); }
function log(type, details = {}) {
  fs.appendFileSync(FILES.activity, JSON.stringify({ time: iso(), type, ...details }) + "\n");
}

let players = readJson(FILES.players, []);
let nextPlayerId = Number(readJson(FILES.nextPlayer, { nextId: 1 }).nextId || 1);
let nextCharacterId = Number(readJson(FILES.nextCharacter, { nextId: 1 }).nextId || 1);

function saveAll() {
  writeJson(FILES.players, players);
  writeJson(FILES.nextPlayer, { nextId: nextPlayerId });
  writeJson(FILES.nextCharacter, { nextId: nextCharacterId });
}
function newPlayerId() {
  while (players.some(p => Number(p.id) === nextPlayerId)) nextPlayerId++;
  return nextPlayerId++;
}
function newCharacterId() {
  while (players.some(p => (p.characters || []).some(c => Number(c.characterId) === nextCharacterId))) nextCharacterId++;
  return nextCharacterId++;
}
function findAccount(id) {
  return players.find(p => String(p.accountId) === String(id));
}
function findCharacter(account, id) {
  return account && (account.characters || []).find(c => String(c.characterId) === String(id));
}
function nicknameTaken(name, exceptId = null) {
  const n = String(name).trim().toLowerCase();
  return players.some(p => (p.characters || []).some(c =>
    c.name.toLowerCase() === n && String(c.characterId) !== String(exceptId)
  ));
}
function makeCharacter(name, skinId) {
  const t = iso();
  return {
    characterId: newCharacterId(),
    name,
    skinId: skinId || "skin_001",
    level: 1,
    experience: 0,
    money: 0,
    seCoins: 0,
    health: 100,
    armor: 0,
    hunger: 100,
    faction: null,
    factionRank: 0,
    inventory: {},
    vehicles: [],
    properties: [],
    businesses: [],
    pets: [],
    bankAccounts: [],
    jobs: [],
    missions: [],
    eventHistory: [],
    statistics: { playSeconds: 0, jobsCompleted: 0, eventsCompleted: 0 },
    position: { x: 0, y: 0, z: 0 },
    phone: null,
    createdAt: t,
    updatedAt: t
  };
}
function normalizeAccount(p) {
  if (!p.accountId) p.accountId = `acct_${crypto.randomUUID()}`;
  if (!Array.isArray(p.characters)) {
    const old = makeCharacter(
      p.nickname || p.name || `Player${p.id}`,
      p.skinId || "skin_001"
    );
    Object.assign(old, {
      level: Number(p.level || 1),
      experience: Number(p.experience || 0),
      money: Number(p.money || 0),
      vehicles: p.vehicles || [],
      properties: p.properties || [],
      businesses: p.businesses || [],
      pets: p.pets || [],
      inventory: p.inventory || {},
      bankAccounts: p.bankAccounts || []
    });
    p.characters = [old];
  }
  p.characters = p.characters.slice(0, 5);
  p.maxCharacters = 5;
  p.activeCharacterId = p.activeCharacterId || p.characters[0]?.characterId || null;
  p.createdAt = p.createdAt || iso();
  p.updatedAt = iso();
  return p;
}
players = players.map(normalizeAccount);
saveAll();

const banks = loadConfig("banks.json", []);
const factions = loadConfig("factions.json", []);
const events = loadConfig("events.json", []);
const missions = loadConfig("missions.json", []);
const vehicles = loadConfig("vehicles.json", []);
const characters = loadConfig("characters.json", []);
const properties = loadConfig("properties.json", []);
const businesses = loadConfig("businesses.json", []);
const pets = loadConfig("pets.json", []);
const shops = loadConfig("shops.json", []);

const startedAt = Date.now();

function publicCharacter(c) {
  return c ? {
    characterId: c.characterId, name: c.name, skinId: c.skinId,
    level: c.level, experience: c.experience, money: c.money, seCoins: c.seCoins,
    faction: c.faction, factionRank: c.factionRank,
    health: c.health, armor: c.armor, hunger: c.hunger,
    createdAt: c.createdAt, updatedAt: c.updatedAt
  } : null;
}
function publicAccount(a) {
  return {
    accountId: a.accountId,
    playerId: a.id,
    maxCharacters: 5,
    activeCharacterId: a.activeCharacterId,
    characters: (a.characters || []).map(publicCharacter)
  };
}
function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data, null, 2));
}
function fail(res, status, message, extra = {}) {
  return send(res, status, { error: message, ...extra });
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1024 * 1024) reject(new Error("Request body too large"));
    });
    req.on("end", () => {
      if (!data.trim()) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

async function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const p = url.pathname;

  if (req.method === "GET" && p === "/") {
    return send(res, 200, {
      name: "Supreme Empire",
      status: "online",
      message: "Supreme Empire server is running"
    });
  }

  if (req.method === "GET" && p === "/health") {
    return send(res, 200, {
      status: "ok",
      service: "Supreme Empire",
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
    });
  }

  if (req.method === "GET" && p === "/api/status") {
    return send(res, 200, {
      name: "Supreme Empire",
      status: "online",
      serverTime: iso(),
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      onlinePlayers: 0,
      totalPlayers: players.length,
      banks: banks.length,
      factions: factions.length,
      missionsOptional: true,
      events
    });
  }

  if (req.method === "GET" && p === "/api/config") {
    return send(res, 200, {
      banks, factions, events, missions, vehicles, characters,
      properties, businesses, pets, shops
    });
  }

  if (req.method === "GET" && p === "/api/players") {
    return send(res, 200, players.flatMap(a => (a.characters || []).map(c => ({
      id: c.characterId,
      nickname: c.name,
      level: c.level,
      accountId: a.accountId
    }))));
  }

  if (req.method === "POST" && p === "/api/account") {
    let b;
    try { b = await readBody(req); } catch (e) { return fail(res, 400, e.message); }

    if (b.accountId) {
      const a = findAccount(b.accountId);
      if (!a) return fail(res, 404, "Account not found");
      return send(res, 200, publicAccount(a));
    }

    const a = {
      id: newPlayerId(),
      accountId: `acct_${crypto.randomUUID()}`,
      maxCharacters: 5,
      characters: [],
      activeCharacterId: null,
      createdAt: iso(),
      updatedAt: iso()
    };
    players.push(a);
    saveAll();
    log("account_created", { accountId: a.accountId, playerId: a.id });
    return send(res, 201, publicAccount(a));
  }

  let m = p.match(/^\/api\/account\/([^/]+)$/);
  if (req.method === "GET" && m) {
    const a = findAccount(decodeURIComponent(m[1]));
    return a ? send(res, 200, publicAccount(a)) : fail(res, 404, "Account not found");
  }

  m = p.match(/^\/api\/account\/([^/]+)\/characters$/);
  if (m && req.method === "GET") {
    const a = findAccount(decodeURIComponent(m[1]));
    return a ? send(res, 200, publicAccount(a)) : fail(res, 404, "Account not found");
  }

  if (m && req.method === "POST") {
    const a = findAccount(decodeURIComponent(m[1]));
    if (!a) return fail(res, 404, "Account not found");

    let b;
    try { b = await readBody(req); } catch (e) { return fail(res, 400, e.message); }

    const name = String(b.name || "").trim();
    const skinId = String(b.skinId || "skin_001").trim();

    if (a.characters.length >= 5) {
      return fail(res, 409, "Character limit reached", { maxCharacters: 5 });
    }
    if (name.length < 2 || name.length > 24) {
      return fail(res, 400, "Nickname must be 2-24 characters");
    }
    if (!/^[A-Za-z0-9_ ]+$/.test(name)) {
      return fail(res, 400, "Nickname may contain letters, numbers, spaces and underscores only");
    }
    if (nicknameTaken(name)) {
      return fail(res, 409, "Nickname already taken");
    }

    const c = makeCharacter(name, skinId);
    a.characters.push(c);
    if (!a.activeCharacterId) a.activeCharacterId = c.characterId;
    a.updatedAt = iso();
    saveAll();
    log("character_created", {
      accountId: a.accountId, playerId: a.id,
      characterId: c.characterId, nickname: c.name
    });

    return send(res, 201, {
      success: true,
      character: publicCharacter(c),
      account: publicAccount(a)
    });
  }

  m = p.match(/^\/api\/account\/([^/]+)\/characters\/([^/]+)\/select$/);
  if (m && req.method === "POST") {
    const a = findAccount(decodeURIComponent(m[1]));
    if (!a) return fail(res, 404, "Account not found");
    const c = findCharacter(a, decodeURIComponent(m[2]));
    if (!c) return fail(res, 404, "Character not found");

    a.activeCharacterId = c.characterId;
    c.updatedAt = iso();
    a.updatedAt = c.updatedAt;
    saveAll();
    log("character_selected", { accountId: a.accountId, characterId: c.characterId });

    return send(res, 200, {
      success: true,
      activeCharacterId: c.characterId,
      character: publicCharacter(c)
    });
  }

  m = p.match(/^\/api\/account\/([^/]+)\/characters\/([^/]+)\/save$/);
  if (m && req.method === "POST") {
    const a = findAccount(decodeURIComponent(m[1]));
    if (!a) return fail(res, 404, "Account not found");
    const c = findCharacter(a, decodeURIComponent(m[2]));
    if (!c) return fail(res, 404, "Character not found");

    let b;
    try { b = await readBody(req); } catch (e) { return fail(res, 400, e.message); }

    if (b.name !== undefined) {
      const n = String(b.name).trim();
      if (n.length < 2 || n.length > 24) return fail(res, 400, "Nickname must be 2-24 characters");
      if (n.toLowerCase() !== c.name.toLowerCase() && nicknameTaken(n, c.characterId)) {
        return fail(res, 409, "Nickname already taken");
      }
      if (!/^[A-Za-z0-9_ ]+$/.test(n)) return fail(res, 400, "Invalid nickname characters");
    }

    const allowed = [
      "name","skinId","level","experience","money","seCoins","health","armor","hunger",
      "faction","factionRank","inventory","vehicles","properties","businesses","pets",
      "bankAccounts","jobs","missions","eventHistory","statistics","position","phone"
    ];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(b, key)) c[key] = b[key];
    }

    c.updatedAt = iso();
    a.updatedAt = c.updatedAt;
    saveAll();
    log("character_saved", { accountId: a.accountId, characterId: c.characterId });

    return send(res, 200, {
      success: true,
      savedAt: c.updatedAt,
      character: publicCharacter(c)
    });
  }

  m = p.match(/^\/api\/account\/([^/]+)\/characters\/([^/]+)\/position$/);
  if (m && req.method === "POST") {
    const a = findAccount(decodeURIComponent(m[1]));
    if (!a) return fail(res, 404, "Account not found");
    const c = findCharacter(a, decodeURIComponent(m[2]));
    if (!c) return fail(res, 404, "Character not found");

    let b;
    try { b = await readBody(req); } catch (e) { return fail(res, 400, e.message); }

    const x = Number(b.x), y = Number(b.y), z = Number(b.z);
    if (![x, y, z].every(Number.isFinite)) return fail(res, 400, "x, y and z must be numbers");

    c.position = { x, y, z };
    c.updatedAt = iso();
    a.updatedAt = c.updatedAt;
    saveAll();

    return send(res, 200, { success: true, position: c.position, savedAt: c.updatedAt });
  }

  m = p.match(/^\/api\/account\/([^/]+)\/characters\/([^/]+)$/);
  if (m && req.method === "DELETE") {
    const a = findAccount(decodeURIComponent(m[1]));
    if (!a) return fail(res, 404, "Account not found");
    const id = decodeURIComponent(m[2]);
    const c = findCharacter(a, id);
    if (!c) return fail(res, 404, "Character not found");

    let b;
    try { b = await readBody(req); } catch (e) { return fail(res, 400, e.message); }
    if (b.confirm !== true) return fail(res, 400, "Deletion requires confirm=true");

    a.characters = a.characters.filter(x => String(x.characterId) !== String(id));
    if (String(a.activeCharacterId) === String(id)) {
      a.activeCharacterId = a.characters[0]?.characterId || null;
    }
    a.updatedAt = iso();
    saveAll();
    log("character_deleted", { accountId: a.accountId, characterId: c.characterId });

    return send(res, 200, { success: true, account: publicAccount(a) });
  }

  return fail(res, 404, "Not Found");
}

http.createServer((req, res) => {
  handle(req, res).catch(e => {
    console.error("Unhandled error:", e);
    if (!res.headersSent) fail(res, 500, "Internal Server Error");
  });
}).listen(PORT, HOST, () => {
  console.log(`Supreme Empire server listening on ${HOST}:${PORT}`);
  console.log(`Players: ${players.length} | Banks: ${banks.length} | Factions: ${factions.length}`);
});
