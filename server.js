const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')); }
  catch (e) { return fallback; }
}

const banks = readJSON('config/banks.json', []);
const events = readJSON('config/events.json', []);
const factions = readJSON('config/factions.json', []);
const missions = readJSON('config/missions.json', {optional:true});

const state = {
  startedAt: new Date().toISOString(),
  onlinePlayers: new Map(),
  nextPlayerId: 1,
  banks,
  events,
  factions,
  missions
};

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type':'application/json',
    'Content-Length':Buffer.byteLength(data)
  });
  res.end(data);
}

function publicState() {
  return {
    name:'Supreme Empire',
    status:'online',
    onlinePlayers:state.onlinePlayers.size,
    banks:state.banks.length,
    factions:state.factions.length,
    missionsOptional:true,
    eventSchedule:state.events
  };
}

function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/api/health') {
    return json(res, 200, publicState());
  }

  if (url.pathname === '/api/status') {
    return json(res, 200, {
      ...publicState(),
      uptimeSeconds: Math.floor(process.uptime()),
      serverTime:new Date().toISOString()
    });
  }

  if (url.pathname === '/api/banks') {
    return json(res, 200, {banks:state.banks});
  }

  if (url.pathname === '/api/factions') {
    return json(res, 200, {factions:state.factions});
  }

  if (url.pathname === '/api/events') {
    return json(res, 200, {events:state.events});
  }

  if (url.pathname === '/api/missions') {
    return json(res, 200, state.missions);
  }

  return json(res, 404, {error:'Not Found', service:'Supreme Empire'});
}

const server = http.createServer(handle);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Supreme Empire server listening on 0.0.0.0:${PORT}`);
  console.log(`Banks loaded: ${banks.length}`);
  console.log(`Factions loaded: ${factions.length}`);
  console.log(`Events loaded: ${events.length}`);
  console.log('Missions optional: true');
});
