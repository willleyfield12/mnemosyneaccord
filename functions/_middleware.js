import {ASSESSMENTS, minimumDeck, publicAssessment, validatePuzzle} from '../lib/station-assessments.js';
// =============================================================================
// Station API — Single-file Pages Function (ported from server.py)
// =============================================================================

const REQUIRED = new Set(["citrus_oil", "rosemary_tincture", "jasmine_oil"]);

const HALLS = [
  "hall-WakingDreams.html", "hall-dividedmirror.html",
  "hall-answeringworld.html", "hall-livingaxis.html",
  "hall-returningvoice.html", "hall-openmind.html",
  "hall-sharedheart.html", "hall-livingscripture.html",
  "hall-unbrokenseed.html", "hall-rememberedhours.html",
  "hall-secondform.html", "hall-enduringself.html",
];

const PROTOCOL_RECORDS = {
  1: [
    "ORIENTATION // Follow the traces.",
    "The station admits you to Decks 6, 7, and 8. Three traces survive where testimony fails: the sun concealed in a rind at the threshold; remembrance keeping vigil where sleepers pray; a pale bloom whose night watches the ice. Bring what each has surrendered, not merely what resembles it. Present three correspondences at the sealed Deck 5 checkpoint. Offered objects leave your manifest; your testimony remains. Rejected evidence may be recovered again. Consult the Mission Timeline when the trial is granted.",
  ],
  2: [
    "RESONANCE // Protocol retained.",
    "Decks 5 and 4 are authorised. Use adjacent stairwells to establish new anchors. Four Greater Hall records await you under Archive Access.",
  ],
  3: [
    "CLEARANCE // The record has widened.",
    "Deck 3 is authorised: Main Engineering and Solar Array Control. Eight Hall records await you under Archive Access.",
  ],
};

const HALL_RECORD_LEVELS = {"1": 0, "2": 0, "3": 0, "5": 0, "4": 2, "6": 2, "7": 3, "8": 3,"9":4,"11":4,"10":5,"12":5};

const SESSION_TTL = 30 * 24 * 60 * 60;

class ProtocolError extends Error {
  constructor(msg) { super(msg); this.name = "ProtocolError"; }
}

function jsonResponse(data, status = 200, cookie = null) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  if (cookie) {
    headers["Set-Cookie"] = `aegis=${cookie}; HttpOnly; SameSite=Strict; Path=/`;
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function getToken(request) {
  const h = request.headers.get("Cookie");
  if (!h) return null;
  const m = h.match(/(?:^|;\s*)aegis=([^;]+)/);
  return m ? m[1] : null;
}

function generateToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

function generateCode() {
  const b = new Uint8Array(3);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function timingSafeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function checkOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin) {
    if (new URL(origin).host !== request.headers.get("Host")) return false;
  }
  return true;
}

async function getSession(env, request) {
  if (!env.SESSIONS) return null;
  const token = getToken(request);
  if (!token) return null;
  const raw = await env.SESSIONS.get("session:" + token);
  if (!raw) return null;
  return migrateSession(JSON.parse(raw));
}

async function saveSession(env, token, session) {
  if (!env.SESSIONS) return;
  await env.SESSIONS.put("session:" + token, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
  });
}

let ROOMS_CACHE = null;

async function loadRooms(env) {
  if (ROOMS_CACHE) return ROOMS_CACHE;
  const resp = await env.ASSETS.fetch(
    new Request("https://assets.local/data/station.json")
  );
  ROOMS_CACHE = await resp.json();
  return ROOMS_CACHE;
}

function createSession(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ProtocolError("A valid transmission address is required.");
  }
  return {
    token: generateToken(),
    session: {
      active: true,
      email,
      level: 1,
      progressionVersion: 2,
      runId: generateToken(),
      scene: "d6_docking",
      visited: [6],
      inventory: [],
      journal: [],
      stage: "hunt",
      intro: false,
      transmissions: [{
        title: "ORIENTATION // Observer detected",
        body: "Your imprint is retained. Enter Kepler III through the Primary Docking Port.",
      }],
    },
  };
}

function allowed(s, deck) {
  const minDeck = minimumDeck(s.level);
  return s.active && deck >= minDeck && deck <= 8;
}

function processLegacyAction(s, action, data, rooms) {
  if (!s.active) throw new ProtocolError("Your imprint has been forgotten. Station access is revoked.");

  if (action === "intro" || action === "retain_protocol") {
    if (action === "intro") s.intro = true;
    const level = Math.min(s.level, 3);
    const [title, body] = PROTOCOL_RECORDS[level];
    const key = "aegis-protocol-" + level;
    if (!s.journal.some((e) => e.id === key)) {
      s.journal.push({ level: s.level, id: key, protocol: true, title, body, items: [] });
    }
  } else if (action === "move") {
    const target = data.scene || "";
    let deck;
    if (/^d[1-8]_corridor$/.test(target)) {
      deck = parseInt(target.split("_")[0].substring(1));
    } else {
      deck = rooms[target] ? rooms[target].deck : 0;
    }
    const current = parseInt(s.scene.split("_")[0].substring(1));
    if (!allowed(s, deck)) throw new ProtocolError("This deck remains sealed by AEGIS.");
    if (deck !== current) {
      if (!s.scene.endsWith("_corridor")) throw new ProtocolError("Return to the deck corridor before changing decks.");
      const wormhole = data.mode === "wormhole" && s.level >= 2 && s.visited.includes(deck);
      if (!wormhole && (Math.abs(deck - current) !== 1 || !target.endsWith("_corridor"))) {
        throw new ProtocolError("Only an adjacent deck can be reached by the stairwell.");
      }
    } else if (s.scene !== target && !s.scene.endsWith("_corridor") && !target.endsWith("_corridor")) {
      throw new ProtocolError("Return to the corridor before entering another room.");
    }
    s.scene = target;
    if (!s.visited.includes(deck)) s.visited.push(deck);
  } else if (action === "collect") {
    const room = rooms[s.scene];
    const item = room ? (room.items.find((i) => i.id === data.id) || null) : null;
    if (!item) throw new ProtocolError("Evidence must be recovered from your current room.");
    if (!s.inventory.includes(item.id)) s.inventory.push(item.id);
  } else if (action === "submit") {
    if (s.level !== 1 || s.stage !== "hunt") throw new ProtocolError("This assessment is not accepting another offering.");
    if (s.scene !== "d6_corridor") throw new ProtocolError("Approach the Deck 5 checkpoint from the Deck 6 corridor.");
    const ids = data.ids || [];
    if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some((i) => !s.inventory.includes(i))) {
      throw new ProtocolError("Choose evidence currently held in your manifest.");
    }
    const accepted = ids.length === REQUIRED.size && ids.every((i) => REQUIRED.has(i));
    s.inventory = s.inventory.filter((i) => !ids.includes(i));
    s.journal.push({
      level: s.level,
      title: accepted ? "Evidence accepted" : "Evidence rejected",
      items: ids,
      body: accepted
        ? "Three traces align. The elevation trial is available."
        : "The offering lacks a stable correspondence. Similarity is not correspondence. Reconsider what was surrendered at the threshold, where sleepers pray, and beneath the gaze of the ice. Submitted specimens have returned to the recovery cycle.",
    });
    if (accepted) s.stage = "puzzle";
  } else if (action === "puzzle") {
    if (s.stage !== "puzzle") throw new ProtocolError("An accepted offering is required before the trial.");
    const req = ["arrival", "variance", "mismatch", "review"];
    const sub = data.order;
    if (!Array.isArray(sub) || sub.length !== req.length || !sub.every((v, i) => v === req[i])) {
      throw new ProtocolError("The sequence contradicts the mission record. Consult the timeline.");
    }
    s.stage = "code";
    s.code = generateCode();
    s.codeExpires = Math.floor(Date.now() / 1000) + 86400;
    s.transmissions.push({
      title: "RESONANCE // Clearance pending",
      body: "Evidence and witness account accepted. Enter this clearance code at the checkpoint within 24 hours: " + s.code,
    });
  } else if (action === "code") {
    if (s.stage !== "code" || Math.floor(Date.now() / 1000) > (s.codeExpires || 0) ||
        !timingSafeEqual(String(data.code || "").trim().toUpperCase(), s.code || "")) {
      throw new ProtocolError("Clearance code unrecognised or expired.");
    }
    s.level = 2;
    s.stage = "resonance";
    delete s.code;
    s.journal.push({
      level: s.level,
      title: "RESONANCE granted",
      body: "Decks 5 and 4 are open. Establish each wormhole anchor by travelling there. Archive Access now holds four Greater Hall records. Study them before the next offering.",
      items: [],
    });
  } else if (action === "channel") {
    const purpose = data.purpose;
    const message = String(data.message || "").trim();
    if (!["feedback", "extras", "lore", "forget"].includes(purpose)) {
      throw new ProtocolError("Choose a channel protocol.");
    }
    if (purpose === "forget") {
      s.active = false; s.inventory = []; s.journal = []; s.email = ""; s.transmissions = [];
      delete s.assessment; delete s.completion; delete s.completedAt; delete s.prologueGrantedAt; delete s.authenticated; delete s.hints; delete s.hintTexts; delete s.code; delete s.codeExpires;
    } else {
      s.journal.push({
        level: s.level,
        title: "Direct Channel // " + purpose,
        body: message || "Supplementary records requested. Preview record retained; no transmission was sent.",
        items: [],
      });
    }
  } else {
    throw new ProtocolError("Unknown protocol.");
  }
  return s;
}

function migrateSession(s) {
  if (s.progressionVersion === 2) {
    if(s.legacyFirst && s.stage==='code' && (!s.code || Math.floor(Date.now()/1000)>(s.codeExpires||0))){s.stage='puzzle';delete s.code;delete s.codeExpires;}
    return s;
  }
  const oldLevel = Number(s.level) || 1;
  const map = n => n >= 2 ? Math.min(n + 1, 6) : 1;
  // Preserve every deck already earned by the old combined 5/4 grant.
  s.level = map(oldLevel);
  s.journal ||= []; s.inventory ||= []; s.visited ||= [6]; s.transmissions ||= [];
  s.inventory=[...new Set([...s.inventory,...s.journal.filter(entry=>entry.title==='Evidence accepted').flatMap(entry=>entry.items||[])])];
  let cursor = 1;
  for (const entry of s.journal) {
    if (entry.title === 'RESONANCE granted') cursor = 2;
    if (entry.title === 'CLEARANCE granted') cursor = 3;
    const protocol = /^aegis-protocol-(\d+)$/.exec(entry.id || '');
    entry.level = map(entry.level || (protocol ? Number(protocol[1]) : cursor));
    if (protocol) entry.id = 'aegis-protocol-' + entry.level;
  }
  s.legacyFirst = oldLevel === 1 && ['puzzle','code'].includes(s.stage);
  if (!s.legacyFirst) s.stage = s.level === 6 ? 'puzzle' : 'hunt';
  else if(s.stage==='code'&&(!s.code||Math.floor(Date.now()/1000)>(s.codeExpires||0))){s.stage='puzzle';delete s.code;delete s.codeExpires;}
  s.runId ||= generateToken();
  s.progressionVersion = 2;
  return s;
}
function retainDirective(s, rooms) {
  const assessment = publicAssessment(s, rooms);
  if (!assessment) return;
  if(s.legacyFirst){assessment.title=PROTOCOL_RECORDS[1][0];assessment.task=PROTOCOL_RECORDS[1][1];assessment.offering=[];}
  const body = s.legacyFirst ? PROTOCOL_RECORDS[1][1] : directive(assessment);
  const id = 'aegis-protocol-' + s.level;
  const existing = s.journal.find(entry => entry.id === id);
  if (existing) Object.assign(existing, {title:assessment.title+' // AEGIS directive',body,level:s.level,protocol:true});
  else s.journal.push({id,level:s.level,protocol:true,title:assessment.title+' // AEGIS directive',body,items:[]});
}
function directive(assessment) {
  const offering = assessment.offering.length
    ? 'Authenticate '+assessment.offering.length+' distinct specimens. '+assessment.offering.map(i=>i.name+' ('+i.locations.join('; ')+')').join('. ')+'. Copies of the same specimen count equally; select only one copy of each type. Evidence remains in your manifest after submission.'
    : 'No further offering is required.';
  return offering+' Approach the '+(assessment.checkpoint===1?'Witness Key terminal':'AEGIS checkpoint')+' in the Deck '+assessment.checkpoint+' corridor. '+assessment.task;
}
function processAction(s, action, data, rooms) {
  if (!s.active) throw new ProtocolError('Your imprint has been forgotten. Station access is revoked.');
  if (s.legacyFirst && ['submit','puzzle','code'].includes(action)) {
    const updated = processLegacyAction(s,action,data,rooms);
    if (action === 'code') {updated.level=3;updated.legacyFirst=false;updated.stage='hunt';updated.journal.at(-1).level=3;retainDirective(updated,rooms);}
    return updated;
  }
  const def = ASSESSMENTS[s.level];
  if (action === 'intro' || action === 'retain_protocol') {
    if (action === 'intro') s.intro=true;
    retainDirective(s,rooms);
  } else if (action === 'move' || action === 'collect' || action === 'channel') {
    return processLegacyAction(s,action,data,rooms);
  } else if (action === 'submit' || action === 'puzzle' || action === 'hint') {
    if (!def || s.stage === 'complete') throw new ProtocolError('This investigation is complete. Your descent record remains available.');
    if (s.scene !== 'd'+def.checkpoint+'_corridor') throw new ProtocolError('Approach the AEGIS terminal in the Deck '+def.checkpoint+' corridor.');
    if (action === 'submit') {
      if (s.stage !== 'hunt' || !def.offering.length) throw new ProtocolError('This assessment is not accepting another offering.');
      const ids=data.ids;
      if (!Array.isArray(ids) || ids.length!==def.offering.length || new Set(ids).size!==ids.length || ids.some(id=>!s.inventory.includes(id))) throw new ProtocolError('Select exactly '+def.offering.length+' distinct specimens held in your manifest. Your evidence has been preserved.');
      const byId=new Map(Object.values(rooms).flatMap(r=>r.items).map(i=>[i.id,i]));
      const specimens=ids.map(id=>byId.get(id)?.specimenId);
      const missing=def.offering.filter(spec=>!specimens.includes(spec));
      if (missing.length || new Set(specimens).size!==def.offering.length) {
        const names=publicAssessment(s,rooms).offering.filter(i=>missing.includes(i.specimenId)).map(i=>i.name);
        throw new ProtocolError('Check the requested specimens: '+(names.join(', ')||'choose one copy of each distinct type')+'. Look-alikes do not substitute. Your evidence has been preserved.');
      }
      s.authenticated=[...new Set([...(s.authenticated||[]),...specimens])];
      s.stage='puzzle';
      s.journal.push({level:s.level,title:def.title+' // Evidence authenticated',body:'The requested evidence is authenticated. Open this checkpoint to consult the recovered records and reconstruct what happened. Evidence remains available for later investigations.',items:ids});
    } else if (action === 'hint') {
      if (s.stage!=='puzzle') throw new ProtocolError('Authenticate the requested offering before consulting puzzle hints.');
      const n=data.number;
      if (!Number.isInteger(n)||n<1||n>3) throw new ProtocolError('Choose hint 1, 2 or 3.');
      s.hints ||= {};s.hintTexts ||= {};
      s.hints[s.level]=Math.max(s.hints[s.level]||0,n);
      s.hintTexts[s.level]=def.hints.slice(0,s.hints[s.level]);
      if(n===3)s.assisted=true;
    } else {
      if(s.stage!=='puzzle')throw new ProtocolError('Authenticate the requested offering before submitting a reconstruction.');
      const error=validatePuzzle(def,data.answer);if(error)throw new ProtocolError(error);
      const completedLevel=s.level;
      const reconstruction=def.network ? data.answer.route.join(' → ') : def.fields.map(field=>field.label+': '+(field.type==='text'?data.answer[field.id]:field.options.find(option=>option.id===data.answer[field.id])?.label||data.answer[field.id])).join('\n');
      s.journal.push({level:completedLevel,title:def.title+' // Reconstruction retained',body:def.result+'\n\nRetained reconstruction\n'+reconstruction,items:[]});
      s.completedAssessments=[...new Set([...(s.completedAssessments||[]),completedLevel])];
      s.level++;
      s.stage=s.level===6?'puzzle':s.level===7?'complete':'hunt';
      if(s.level===5)s.prologueGrantedAt ||= new Date().toISOString();
      if(s.level===7){s.completedAt ||= new Date().toISOString();s.journal.push({level:7,title:'Vault Theta // Descent authorised',body:'Your witness declaration and completion time are retained. The descent can be replayed without creating another finish. Chapter 1 teaser entitlement is retained.',items:[]});}
      else {
        s.journal.push({level:s.level,title:def.name+' // Access authorised',body:def.result,items:[]});
        if(s.level<6)retainDirective(s,rooms);
      }
      s.transmissions.push({title:def.title+' // Record retained',body:def.result});
    }
  } else if (action === 'code') {
    throw new ProtocolError('A clearance code is not required here. Complete the current checkpoint assessment.');
  } else throw new ProtocolError('Unknown protocol.');
  return s;
}
function publicView(s) {
  if (!s) return { active: false, level: 0 };
  if(s.active && s.journal.some(entry=>entry.id==='aegis-protocol-'+s.level))retainDirective(s,ROOMS_CACHE||{});
  const {code,codeExpires,email,...rest}=s;
  return {...rest,assessment:s.active?publicAssessment(s,ROOMS_CACHE||{}):null,minDeck:minimumDeck(s.level)};
}
async function recordCompletion(s,env) {
  if(!s.completedAt || s.completion)return;
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s.email.trim().toLowerCase()));
  const key='completion:'+Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
  const candidate={runId:s.runId,completedAt:s.completedAt,email:s.email,assisted:Boolean(s.assisted)};
  await env.SESSIONS.put('finish-run:'+(s.runId||generateToken()),JSON.stringify(candidate));
  const existing=await env.SESSIONS.get(key);
  if(existing){const {email,...retained}=JSON.parse(existing);s.completion=retained;}
  else {
    s.completion={id:generateToken(),completedAt:s.completedAt,recognition:s.assisted?'Accord Witness':'Unassisted Witness',teaser:true,finishOrderStatus:'Pending verification'};
    // KV is eventually consistent: do not assign a first/next-three prize here.
    // Keep this independent record without session TTL for manual finish-order verification.
    await env.SESSIONS.put(key,JSON.stringify({...s.completion,email:s.email}));
  }
}
async function handleRewards(request,env) {
 const session=await getSession(env,request);
 if(!session?.active)return jsonResponse({error:'Observer not detected.'},401);
 const url=value=>typeof value==='string' && (/^https:\/\//.test(value)||(/^\/(?!\/)/.test(value))) ? value : null;
 return jsonResponse({prologue:session.level>=5?{entitled:true,url:url(env.PROLOGUE_URL)}:null,teaser:session.completedAt?{entitled:true,url:url(env.CHAPTER_ONE_TEASER_URL)}:null,descent:session.completedAt?{authorised:true,url:url(env.DESCENT_VIDEO_URL)}:null,completion:session.completion||null});
}

async function handleRegister(request, env) {
  if (!checkOrigin(request)) return jsonResponse({ error: "Cross-origin requests rejected." }, 403);
  try {
    const size = parseInt(request.headers.get("Content-Length") || "0");
    if (size < 1 || size > 16384) throw new ProtocolError("Request size invalid.");
    const data = await request.json();
    const existing = await getSession(env, request);
    if (existing && existing.active) {await loadRooms(env);return jsonResponse(publicView(existing));}
    if (data.consent !== true) throw new ProtocolError("Permission to receive transmissions is required.");
    const email = String(data.email || "").trim();
    const { token, session } = createSession(email);
    await loadRooms(env);
    await saveSession(env, token, session);
    return jsonResponse(publicView(session), 200, token);
  } catch (e) {
    return jsonResponse({ error: e.message || "Request size invalid." }, 400);
  }
}

async function handleAction(request, env) {
  if (!checkOrigin(request)) return jsonResponse({ error: "Cross-origin requests rejected." }, 403);
  try {
    const size = parseInt(request.headers.get("Content-Length") || "0");
    if (size < 1 || size > 16384) throw new ProtocolError("Request size invalid.");
    const data = await request.json();
    const token = getToken(request);
    const session = await getSession(env, request);
    if (!session) return jsonResponse({ error: "Observer not detected." }, 401);
    const rooms = await loadRooms(env);
    const updated = processAction(session, data.action, data, rooms);
    if(updated.completedAt)await recordCompletion(updated,env);
    await saveSession(env, token, updated);
    return jsonResponse(publicView(updated));
  } catch (e) {
    return jsonResponse({ error: e.message || "Request size invalid." }, 400);
  }
}

async function handleState(request, env) {
  const session = await getSession(env, request);
  if(session?.active)await loadRooms(env);
  return jsonResponse(publicView(session));
}

async function handleRooms(request, env) {
  const session = await getSession(env, request);
  if (!session || !session.active) return jsonResponse({ error: "Observer not detected." }, 401);
  const rooms = await loadRooms(env);
  return jsonResponse(rooms);
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = decodeURIComponent(url.pathname);
  const method = request.method;

  if (
    path.startsWith("/data/") || path.startsWith("/lib/") || path === "/lib" || path.startsWith("/.") ||
    path === "/server.py" || path.startsWith("/tests/") || path === "/README.md"
  ) {
    return new Response("Not Found", { status: 404 });
  }

  if (path === "/api/register" && method === "POST") return handleRegister(request, env);
  if (path === "/api/action" && method === "POST") return handleAction(request, env);
  if (path === "/api/rewards" && method === "GET") return handleRewards(request,env);
  if (path === "/api/state" && method === "GET") return handleState(request, env);
  if (path === "/api/rooms" && method === "GET") return handleRooms(request, env);

  if (path === "/archive" || path.startsWith("/archive/")) {
    const match = /^\/archive\/hall-(\d+)(?:\.html)?\/?$/.exec(path);
    if (match) {
      const required = HALL_RECORD_LEVELS[match[1]];
      if (required === undefined) return new Response("Study record unavailable.", {status: 404});
      if (required > 0) {
        const session = await getSession(env, request);
        if (!session?.active || session.level < required) {
          return new Response("This Hall record remains sealed by AEGIS. Return to Archive Access to consult the released records.", {status: 403});
        }
      }
    }
    return next();
  }

  if (path.startsWith("/oblivian/")) {
    const session = await getSession(env, request);
    if (!session || !session.active || session.level < 2) {
      return Response.redirect(new URL("/aegis/submit.html?return=archive", request.url), 303);
    }
    if (path.startsWith("/oblivian/hall-")) {
      const hallFile = path.split("/").pop();
      const allowedHalls = HALLS.slice(0, (session.level - 1) * 4);
      if (!allowedHalls.includes(hallFile)) {
        return new Response("Archive record remains sealed.", { status: 403 });
      }
    }
  }

  return next();
}
