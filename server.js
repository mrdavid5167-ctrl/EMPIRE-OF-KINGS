'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const ROOT = __dirname;
const CONFIG = path.join(ROOT, 'config');
const DATA = path.join(ROOT, 'data');
const SAVE_FILE = path.join(DATA, 'players.json');
const LOG_FILE = path.join(DATA, 'activity.log');

fs.mkdirSync(DATA, { recursive: true });

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function writeJson(file, value) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function loadConfig(name, fallback) {
  return readJson(path.join(CONFIG, name), fallback);
}

const banks = loadConfig('banks.json', []);
const events = loadConfig('events.json', []);
const factions = loadConfig('factions.json', []);
const missions = loadConfig('missions.json', []);
const players = readJson(SAVE_FILE, {});
const sessions = new Map();
const accountIndex = new Map();
const phoneIndex = new Map();
let nextPlayerId = Number(readJson(path.join(DATA, 'nextPlayerId.json'), 1));

for (const p of Object.values(players)) {
  if (Array.isArray(p.bankAccounts)) for (const a of p.bankAccounts) accountIndex.set(a.accountNumber, p.id);
  if (p.phone?.number) phoneIndex.set(p.phone.number, p.id);
}

function savePlayers() {
  writeJson(SAVE_FILE, players);
  writeJson(path.join(DATA, 'nextPlayerId.json'), nextPlayerId);
}
function logActivity(type, playerId, details = {}) {
  const entry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), type, playerId: playerId ?? null, details };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  return entry;
}
function nowIso() { return new Date().toISOString(); }
function publicPlayer(p) {
  return {
    id:p.id, nickname:p.nickname, level:p.level, exp:p.exp, money:p.money, seCoins:p.seCoins,
    faction:p.faction, factionRank:p.factionRank, adminLevel:p.adminLevel, health:p.health,
    armor:p.armor, location:p.location, online:sessions.has(p.id)
  };
}
function getPlayer(id) { return players[String(id)]; }
function send(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}
function broadcast(payload) {
  for (const ws of sessions.values()) send(ws, payload);
}
function requirePlayer(ws) {
  return getPlayer(ws.playerId);
}
function requireAdmin(p, minLevel = 1) {
  return p && Number(p.adminLevel || 0) >= minLevel;
}
function isLeadershipRank(rank) { return Number(rank) >= 9; }
function safeNumber(v, min=0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : null;
}
function accountNumber(bank) {
  let n;
  do {
    n = `${bank.prefix}${String(Math.floor(10000000 + Math.random()*90000000))}`;
  } while (accountIndex.has(n));
  return n;
}
function phoneNumber() {
  let n;
  do { n = `555${String(Math.floor(1000000 + Math.random()*9000000))}`; }
  while (phoneIndex.has(n));
  return n;
}
function ensurePlayer(id, nickname='Player') {
  if (players[String(id)]) return players[String(id)];
  const p = {
    id, nickname:String(nickname).slice(0,24), level:1, exp:0, money:0, seCoins:0,
    health:100, armor:0, faction:null, factionRank:0, adminLevel:0,
    location:{x:0,y:0,z:0,zone:'spawn'}, inventory:{}, vehicles:[], properties:[],
    businesses:[], pets:[], bankAccounts:[], phone:{number:null,model:null},
    licenses:[], jobs:{}, missions:{}, eventHistory:[], statistics:{},
    createdAt:nowIso(), updatedAt:nowIso()
  };
  players[String(id)] = p;
  logActivity('player_created', id);
  savePlayers();
  return p;
}

function routeCommand(p, text) {
  const parts = String(text || '').trim().split(/\s+/);
  if (!parts[0]?.startsWith('/')) return {ok:false,error:'Commands must start with /'};
  const cmd = parts[0].toLowerCase();
  if (cmd === '/players') return {ok:true, players:Object.values(players).map(publicPlayer), onlineCount:sessions.size};
  if (cmd === '/stats') {
    const target = Number(parts[1] || p.id); const t = getPlayer(target);
    if (!t) return {ok:false,error:'Player not found'}; return {ok:true,player:publicPlayer(t)};
  }
  if (cmd === '/admininfo') {
    const target = Number(parts[1] || p.id); const t=getPlayer(target);
    if (!t || !requireAdmin(p,1)) return {ok:false,error:'Not authorized'}; return {ok:true,player:{id:t.id,nickname:t.nickname,adminLevel:t.adminLevel}};
  }
  if (cmd === '/admins') return {ok:true,players:Object.values(players).filter(x=>x.adminLevel>0).map(publicPlayer)};
  if (cmd === '/giveadmin') {
    if (!requireAdmin(p,2)) return {ok:false,error:'Chief Admin required'};
    const t=getPlayer(Number(parts[1])); const level=Number(parts[2]);
    if (!t || ![1,2,3].includes(level)) return {ok:false,error:'Invalid target or admin level'};
    t.adminLevel=level; t.updatedAt=nowIso(); logActivity('give_admin',p.id,{target:t.id,level}); savePlayers();
    return {ok:true,player:publicPlayer(t)};
  }
  if (cmd === '/removeadmin') {
    if (!requireAdmin(p,2)) return {ok:false,error:'Chief Admin required'};
    const t=getPlayer(Number(parts[1])); if(!t)return {ok:false,error:'Player not found'};
    t.adminLevel=0; t.updatedAt=nowIso(); logActivity('remove_admin',p.id,{target:t.id}); savePlayers(); return {ok:true};
  }
  if (['/kick','/ban','/mute','/unmute','/warn','/freeze','/unfreeze','/respawn','/tp','/gethere'].includes(cmd)) {
    if (!requireAdmin(p,1)) return {ok:false,error:'Admin required'};
    const t=getPlayer(Number(parts[1])); if(!t)return {ok:false,error:'Player not found'};
    if(cmd==='/respawn'){ respawn(t); }
    if(cmd==='/freeze')t.frozen=true;
    if(cmd==='/unfreeze')t.frozen=false;
    logActivity(`admin_${cmd.slice(1)}`,p.id,{target:t.id});
    if(cmd==='/kick'||cmd==='/ban') { const ws=sessions.get(t.id); if(ws){send(ws,{type:'kicked',reason:cmd.slice(1)}); ws.close();} }
    if(cmd==='/tp' && p.location) t.location={...p.location};
    if(cmd==='/gethere' && t.location) p.location={...t.location};
    t.updatedAt=nowIso(); p.updatedAt=nowIso(); savePlayers(); return {ok:true};
  }
  if (cmd === '/spawncar') {
    if (!requireAdmin(p,1)) return {ok:false,error:'Admin required'};
    const model=parts.slice(1).join(' ') || 'SE Sedan';
    const v={id:crypto.randomUUID(),model,ownerId:p.id,fuel:100,health:100,location:{...p.location}};
    p.vehicles.push(v); logActivity('admin_spawn_vehicle',p.id,{vehicle:v}); p.updatedAt=nowIso(); savePlayers(); return {ok:true,vehicle:v};
  }
  if (cmd === '/announce') {
    if (!requireAdmin(p,1)) return {ok:false,error:'Admin required'};
    const message=parts.slice(1).join(' ').slice(0,500); broadcast({type:'announcement',message});
    logActivity('admin_announce',p.id,{message}); return {ok:true};
  }
  if (cmd === '/hropen' || cmd === '/hrclose' || cmd === '/hrstatus') {
    if (!p.faction) return {ok:false,error:'Join a faction first'};
    const f=factions.find(x=>x.id===p.faction); if(!f||p.factionRank<8)return {ok:false,error:'Rank 8+ required'};
    if(cmd==='/hrstatus')return {ok:true,open:Boolean(f.hrOpen)};
    f.hrOpen=cmd==='/hropen'; logActivity('hr_status',p.id,{faction:p.faction,open:f.hrOpen}); saveConfigRuntime();
    return {ok:true,open:f.hrOpen};
  }
  if (cmd === '/war') return startWar(p, parts[1], parts[2]);
  if (cmd === '/ghouse') return {ok:true,houseNumber:String(parts[1]||'').padStart(3,'0'),message:'GPS target prepared'};
  if (cmd === '/gps' || cmd === '/waypoint' || cmd === '/route') return {ok:true,target:parts.slice(1).join(' ')};
  if (cmd === '/pet') return petCommand(p, parts.slice(1));
  return {ok:false,error:'Unknown command'};
}

let war = null;
function startWar(p, factionId, locationId) {
  if (!p.faction || !factions.find(f=>f.id===p.faction && f.type==='crime')) return {ok:false,error:'Crime faction required'};
  if (!factions.find(f=>f.id===factionId && f.type==='crime')) return {ok:false,error:'Invalid target faction'};
  if (factionId===p.faction) return {ok:false,error:'Cannot war your own faction'};
  const locations=['ironworks','blackwater_docks','old_town_yard'];
  if (!locations.includes(locationId)) return {ok:false,error:'Invalid war location'};
  if (war && Date.now()<war.endsAt) return {ok:false,error:'A war is already active'};
  war={id:crypto.randomUUID(),a:p.faction,b:factionId,location:locationId,startedAt:Date.now(),endsAt:Date.now()+900000,score:{[p.faction]:0,[factionId]:0},participants:new Set()};
  broadcast({type:'war_started',war:{...war,participants:undefined}});
  logActivity('war_started',p.id,{war:{...war,participants:undefined}});
  return {ok:true,war:{...war,participants:undefined}};
}

function respawn(p) {
  p.health=100; p.armor=0; p.location={x:0,y:0,z:0,zone:'hospital'};
  p.updatedAt=nowIso(); logActivity('hospital_respawn',p.id,{location:p.location}); savePlayers();
}
function heal(p) {
  p.health=100; p.armor=Math.max(p.armor,0); p.updatedAt=nowIso();
  logActivity('hospital_heal',p.id); savePlayers();
}
function petCommand(p,args) {
  const action=args[0]||'stats'; const pet=p.pets[0];
  if(!pet && action!=='buy') return {ok:false,error:'No active pet'};
  if(action==='stats')return {ok:true,pet};
  if(['follow','stay','come','sit','defend','home'].includes(action)){pet.state=action;logActivity('pet_action',p.id,{action});savePlayers();return {ok:true,pet};}
  return {ok:false,error:'Unknown pet action'};
}

function saveConfigRuntime() {
  // Runtime HR status is kept in memory; persistent faction configuration remains source-controlled.
}
function handleJson(req,res,body) {
  let parsed={};
  try { parsed=JSON.parse(body||'{}'); } catch { return json(res,400,{error:'Invalid JSON'}); }
  return parsed;
}
function json(res,status,payload) {
  const data=JSON.stringify(payload);
  res.writeHead(status,{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data),'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});
  res.end(data);
}
function publicState() {
  return {
    name:'Supreme Empire',status:'online',serverTime:nowIso(),uptimeSeconds:Math.floor(process.uptime()),
    onlinePlayers:sessions.size, totalPlayers:Object.keys(players).length,
    banks:banks.length,factions:factions.length,missionsOptional:true,events
  };
}

const server=http.createServer((req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET'){
    if(['/', '/health','/api/health','/api/status'].includes(url.pathname)) return json(res,200,publicState());
    if(url.pathname==='/api/players') return json(res,200,{onlineCount:sessions.size,players:Object.values(players).map(publicPlayer)});
    if(url.pathname==='/api/banks') return json(res,200,{banks});
    if(url.pathname==='/api/factions') return json(res,200,{factions});
    if(url.pathname==='/api/events') return json(res,200,{events});
    if(url.pathname==='/api/missions') return json(res,200,{missions,optional:true});
    if(url.pathname==='/api/war') return json(res,200,{active:Boolean(war),war:war?{...war,participants:undefined}:null});
    return json(res,404,{error:'Not Found'});
  }
  if(req.method==='POST'){
    let body=''; req.on('data',c=>body+=c); req.on('end',()=>{
      const data=handleJson(req,res,body); if(!data)return;
      if(url.pathname==='/api/account/create'){
        const p=getPlayer(Number(data.playerId)); const bank=banks.find(b=>b.id===data.bankId);
        if(!p||!bank)return json(res,400,{error:'Player or bank not found'});
        const a={bankId:bank.id,bankName:bank.name,accountNumber:accountNumber(bank),balance:0,transactions:[]};
        p.bankAccounts.push(a);accountIndex.set(a.accountNumber,p.id);p.updatedAt=nowIso();logActivity('bank_account_created',p.id,{bankId:bank.id,accountNumber:a.accountNumber});savePlayers();
        return json(res,200,{ok:true,account:a});
      }
      if(url.pathname==='/api/transfer'){
        const from=getPlayer(Number(data.fromPlayerId)); const toId=accountIndex.get(String(data.toAccountNumber)); const amount=safeNumber(data.amount,0.01);
        if(!from||!toId||!amount)return json(res,400,{error:'Invalid transfer'});
        const to=getPlayer(toId); const src=from.bankAccounts.find(a=>a.accountNumber===data.fromAccountNumber); const dst=to.bankAccounts.find(a=>a.accountNumber===data.toAccountNumber);
        if(!src||!dst||src.balance<amount)return json(res,400,{error:'Invalid account or insufficient balance'});
        src.balance-=amount;dst.balance+=amount;const tx={id:crypto.randomUUID(),amount,timestamp:nowIso(),from:src.accountNumber,to:dst.accountNumber};
        src.transactions.push({...tx,type:'debit'});dst.transactions.push({...tx,type:'credit'});from.updatedAt=to.updatedAt=nowIso();logActivity('bank_transfer',from.id,{to:to.id,amount,fromAccount:src.accountNumber,toAccount:dst.accountNumber});savePlayers();
        return json(res,200,{ok:true,transaction:tx});
      }
      if(url.pathname==='/api/heal'){
        const p=getPlayer(Number(data.playerId)); if(!p)return json(res,404,{error:'Player not found'});
        if(p.location?.zone!=='hospital')return json(res,403,{error:'Healing requires a hospital healing spot'});
        heal(p);return json(res,200,{ok:true,player:publicPlayer(p)});
      }
      if(url.pathname==='/api/death'){
        const p=getPlayer(Number(data.playerId)); if(!p)return json(res,404,{error:'Player not found'});
        logActivity('death',p.id,{cause:data.cause||'unknown'});respawn(p);return json(res,200,{ok:true,player:publicPlayer(p)});
      }
      return json(res,404,{error:'Not Found'});
    }); return;
  }
  json(res,405,{error:'Method Not Allowed'});
});

const wss=new WebSocketServer({server,path:'/ws'});
wss.on('connection',(ws)=>{
  let authenticated=false;
  ws.on('message',(raw)=>{
    let m;try{m=JSON.parse(raw.toString());}catch{return send(ws,{type:'error',error:'Invalid JSON'});}
    if(m.type==='login'){
      let id=Number(m.playerId);
      if(!id){id=nextPlayerId++;} 
      const p=ensurePlayer(id,m.nickname||'Player');
      if(sessions.has(p.id)) return send(ws,{type:'error',error:'Player already connected'});
      ws.playerId=p.id;sessions.set(p.id,ws);authenticated=true;p.updatedAt=nowIso();logActivity('connect',p.id);savePlayers();
      send(ws,{type:'connected',player:publicPlayer(p),server:publicState()});
      broadcast({type:'player_list',onlineCount:sessions.size,players:Object.values(players).filter(x=>sessions.has(x.id)).map(publicPlayer)});
      return;
    }
    if(!authenticated)return send(ws,{type:'error',error:'Login required'});
    const p=requirePlayer(ws); if(!p)return;
    if(m.type==='command'){
      const result=routeCommand(p,m.command);send(ws,{type:'command_result',result});
      return;
    }
    if(m.type==='chat'){
      const message=String(m.message||'').slice(0,500); if(!message)return;
      logActivity('chat',p.id,{message,channel:m.channel||'local'});
      broadcast({type:'chat',playerId:p.id,nickname:p.nickname,message,channel:m.channel||'local'});return;
    }
    if(m.type==='activity'){
      logActivity(String(m.activity||'client_activity').slice(0,80),p.id,m.details||{});
      return;
    }
    if(m.type==='position'){
      if(p.frozen)return send(ws,{type:'error',error:'Player is frozen'});
      const x=safeNumber(m.x),y=safeNumber(m.y),z=safeNumber(m.z);
      if([x,y,z].some(v=>v===null))return send(ws,{type:'error',error:'Invalid position'});
      p.location={x,y,z,zone:String(m.zone||'city').slice(0,80)};p.updatedAt=nowIso();
      logActivity('movement_checkpoint',p.id,{location:p.location});
      savePlayers(); broadcast({type:'player_position',playerId:p.id,location:p.location});return;
    }
  });
  ws.on('close',()=>{
    if(authenticated&&ws.playerId){sessions.delete(ws.playerId);const p=getPlayer(ws.playerId);if(p){p.updatedAt=nowIso();logActivity('disconnect',p.id);savePlayers();}
      broadcast({type:'player_list',onlineCount:sessions.size,players:Object.values(players).filter(x=>sessions.has(x.id)).map(publicPlayer)});
    }
  });
});

setInterval(()=>{
  const d=new Date(); const minute=d.getUTCMinutes(), second=d.getUTCSeconds();
  for(const e of events){
    if(minute===((e.minute+60)%60)&&second===0) broadcast({type:'event_starting',event:e});
    if(minute===((e.minute+59)%60)&&second===0) broadcast({type:'event_announcement',event:e,message:`📢 GAME CENTER: ${e.name} starts in 5 minutes! Head to the Game Center to register.`});
  }
  if(war&&Date.now()>=war.endsAt){broadcast({type:'war_ended',war:{...war,participants:undefined}});logActivity('war_ended',null,{war:{...war,participants:undefined}});war=null;}
},1000);

server.listen(PORT,HOST,()=>{
  console.log(`Supreme Empire server listening on ${HOST}:${PORT}`);
  console.log(`Banks loaded: ${banks.length}`);
  console.log(`Factions loaded: ${factions.length}`);
  console.log(`Events loaded: ${events.length}`);
  console.log(`Missions loaded: ${missions.length} (optional)`);
});
