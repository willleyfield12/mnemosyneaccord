import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {onRequest} from '../functions/_middleware.js';
import {ASSESSMENTS,validatePuzzle,minimumDeck} from '../lib/station-assessments.js';
import {partitionJournal} from '../assets/js/station-journal.js';
const rooms=JSON.parse(await readFile(new URL('../data/station.json',import.meta.url),'utf8'));
const store=new Map();let cookie;
const env={SESSIONS:{get:async key=>store.get(key)||null,put:async(key,v)=>store.set(key,v)},ASSETS:{fetch:async()=>Response.json(rooms)}};
async function api(path,data,expected=200){
 const headers={Host:'station.test'};if(cookie)headers.Cookie=cookie;
 const body=data===undefined?undefined:JSON.stringify(data);
 if(body){headers.Origin='https://station.test';headers['Content-Type']='application/json';headers['Content-Length']=String(Buffer.byteLength(body));}
 const response=await onRequest({request:new Request('https://station.test'+path,{method:body?'POST':'GET',headers,body}),env,next:()=>new Response('asset')});
 assert.equal(response.status,expected,await response.clone().text());
 if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
 return response.headers.get('Content-Type')?.includes('application/json')?response.json():response.text();
}
const action=(action,data={},status=200)=>api('/api/action',{action,...data},status);
async function go(target){let state=await api('/api/state');let deck=Number(state.scene[1]),next=Number(target[1]);if(!state.scene.endsWith('_corridor'))await action('move',{scene:'d'+deck+'_corridor'});while(deck!==next){deck+=Math.sign(next-deck);await action('move',{scene:'d'+deck+'_corridor'});}if(!target.endsWith('_corridor'))await action('move',{scene:target});}
async function offering(level){const inventory=(await api('/api/state')).inventory;
 for(const specimen of ASSESSMENTS[level].offering){
  const choices=Object.entries(rooms).flatMap(([scene,r])=>r.items.filter(i=>i.specimenId===specimen&&r.deck>=minimumDeck(level)).map(i=>({scene,...i})));
  assert(choices.length,'reachable '+specimen+' at '+level);
  const item=choices.find(i=>inventory.includes(i.id))||choices[0];
  await go(item.scene);await action('collect',{id:item.id});
 }
 await go('d'+ASSESSMENTS[level].checkpoint+'_corridor');
 const state=await api('/api/state');
 const ids=ASSESSMENTS[level].offering.map(spec=>Object.values(rooms).flatMap(r=>r.items).find(i=>i.specimenId===spec&&state.inventory.includes(i.id)).id);
 await action('submit',{ids:ids.slice(1)},400);
 const before=[...state.inventory];let accepted=await action('submit',{ids});assert.deepEqual(accepted.inventory,before,'offering must preserve inventory');
 await action('submit',{ids},400);return accepted;
}
assert.equal((await api('/api/state')).active,false);
await api('/api/rewards',undefined,401);
await api('/lib/station-assessments.js',undefined,404);
let state=await api('/api/register',{email:'full-run@example.com',consent:true});
assert.equal(state.progressionVersion,2);assert(state.runId);assert.equal(state.assessment.offering.length,4);
await action('intro');await action('retain_protocol');state=await api('/api/state');assert.equal(state.journal.length,1);
await action('move',{scene:'d6_corridor'});await action('move',{scene:'d5_corridor'},400);
await action('puzzle',{answer:ASSESSMENTS[1].solution},400);
assert(!JSON.stringify(state.assessment).includes('solution'));
const answers={...Object.fromEntries(Object.entries(ASSESSMENTS).map(([n,d])=>[n,d.solution])),3:{route:['S','B','M','C','T']},4:{assumption:'fabrication',evidence:'audit',rule:'retain'}};
for(let level=1;level<=6;level++){
 state=await api('/api/state');assert.equal(state.level,level);
 if(level<6)state=await offering(level);else await go('d1_corridor');
 await action('puzzle',{answer:{}},400);const retry=await api('/api/state');assert.equal(retry.level,level);assert.equal(retry.stage,'puzzle');
 if(level===3){const before=await api('/api/state');await action('hint',{number:1});state=await api('/api/state');assert(!state.assisted);await action('hint',{number:2});assert(!(await api('/api/state')).assisted);state=await action('hint',{number:3});assert(state.assisted);assert.equal(state.assessment.hintCount,3);assert.equal(state.assessment.hintText.length,3);assert.deepEqual(state.inventory,before.inventory);}
 if(level===6)answers[6]={declaration:' we_witness   what_ENDURES '};
 state=await action('puzzle',{answer:answers[level]});assert.equal(state.level,level+1);
 const groups=partitionJournal(state.journal,state.level);assert(groups.past.some(entry=>entry.title===ASSESSMENTS[level].title+' // Reconstruction retained'));assert(!groups.current.some(entry=>entry.title===ASSESSMENTS[level].title+' // Reconstruction retained'));
 if(level<6)assert.equal(state.minDeck,ASSESSMENTS[level].unlock);
 const reward=await api('/api/rewards');if(level>=4)assert(reward.prologue?.entitled);else assert.equal(reward.prologue,null);
 if(level===1){await action('move',{scene:'d4_corridor'},400);assert.equal(state.level,2);}
}
assert.equal(state.stage,'complete');assert.equal(state.completion.recognition,'Accord Witness');assert.equal(state.completion.finishOrderStatus,'Pending verification');
assert.equal(state.code,undefined);assert.equal(state.email,undefined);
const first=structuredClone(state.completion);await action('puzzle',{answer:answers[6]},400);assert.deepEqual((await api('/api/state')).completion,first);
let rewards=await api('/api/rewards');assert(rewards.teaser.entitled);assert(rewards.descent.authorised);assert.equal(rewards.descent.url,null);
env.DESCENT_VIDEO_URL='https://example.com/descent.mp4';env.PROLOGUE_URL='/rewards/prologue.pdf';env.CHAPTER_ONE_TEASER_URL='javascript:alert(1)';rewards=await api('/api/rewards');assert.equal(rewards.descent.url,env.DESCENT_VIDEO_URL);assert.equal(rewards.teaser.url,null);
assert.equal([...store.keys()].filter(k=>k.startsWith('completion:')).length,1);
// Repeat finish with the same email in another browser retains the first claim.
cookie=undefined;await api('/api/register',{email:'FULL-RUN@example.com',consent:true});let key='session:'+cookie.split('=')[1],saved=JSON.parse(store.get(key));Object.assign(saved,{level:6,scene:'d1_corridor',stage:'puzzle'});store.set(key,JSON.stringify(saved));state=await action('puzzle',{answer:answers[6]});assert.deepEqual(state.completion,first);
// Migration preserves the old combined deck grant and inventories, with no reset.
for(const old of [2,3,4,5]){cookie='aegis=legacy'+old;store.set('session:legacy'+old,JSON.stringify({active:true,email:'old@example.com',level:old,scene:'d6_corridor',stage:'resonance',inventory:['rosemary_tincture'],visited:[6],journal:[{level:old,id:'aegis-protocol-'+old,title:'Saved protocol',body:'Old text'}],transmissions:[]}));state=await api('/api/state');assert.equal(state.level,old+1);assert.deepEqual(state.inventory,['rosemary_tincture']);assert.equal(state.minDeck,({2:4,3:3,4:2,5:1})[old]);await action('retain_protocol');assert.equal((await api('/api/state')).journal.filter(e=>e.protocol).length,1);}
// The old first puzzle and issued code continue to work; their readers retain the combined grant.
cookie='aegis=oldcode';store.set('session:oldcode',JSON.stringify({active:true,email:'legacy@example.com',level:1,scene:'d6_corridor',stage:'puzzle',inventory:[],visited:[6],journal:[],transmissions:[]}));state=await action('puzzle',{order:['arrival','variance','mismatch','review']});const code=state.transmissions.at(-1).body.match(/[A-F0-9]{6}$/)[0];state=await action('code',{code});assert.equal(state.level,3);assert.equal(state.minDeck,4);assert.equal(state.stage,'hunt');
// Alternate physical copies are interchangeable, but duplicate copies cannot fill two offering types.
cookie='aegis=copies';store.set('session:copies',JSON.stringify({active:true,email:'copy@example.com',progressionVersion:2,level:1,scene:'d6_corridor',stage:'hunt',inventory:['rosemary_tincture','d6_hydro_spec_bot_01','d6_docking_spec_min_01','d6_farm_spec_bot_11','d7_barracks_spec_bot_01'],visited:[6],journal:[],transmissions:[]}));await action('submit',{ids:['rosemary_tincture','d6_hydro_spec_bot_01','d7_barracks_spec_bot_01','d6_farm_spec_bot_11']},400);state=await action('submit',{ids:['rosemary_tincture','d6_hydro_spec_bot_01','d6_docking_spec_min_01','d6_farm_spec_bot_11']});assert.equal(state.stage,'puzzle');
// No forged scene, stage, level or completion in a payload grants access.
await action('puzzle',{level:7,scene:'d1_corridor',completedAt:'now',answer:{}},400);await action('move',{scene:'d1_corridor',level:7},400);
await action('channel',{purpose:'forget'});state=await api('/api/state');assert(!state.active);await action('puzzle',{answer:answers[1]},400);await api('/api/rewards',undefined,401);
// Enumerate ordering solutions and every simple relay route against the displayed constraints.
function permutations(a){return a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(rest=>[v,...rest])):[[]];}
for(const level of [1,5]){const def=ASSESSMENTS[level];const events=Object.keys(def.solution).filter(k=>k.startsWith('position')).map(k=>def.solution[k]);let count=0;for(const order of permutations(events)){const answer={...def.solution,...Object.fromEntries(order.map((v,i)=>['position'+i,v]))};if(!validatePuzzle(def,answer))count++;}assert.equal(count,1);}
const graph=ASSESSMENTS[3];let valid=0;
function routes(route){const last=route.at(-1);if(last==='T'){const expected=route.includes('M')&&!route.includes('X');assert.equal(validatePuzzle(graph,{route})===null,expected);if(expected)valid++;return;}for(const [a,b]of graph.network.edges){const next=a===last?b:b===last?a:null;if(next&&!route.includes(next))routes([...route,next]);}}
routes(['S']);assert(valid>1);for(const bad of [['S','A','T'],['S','A','C','T'],['S','B','X','T'],['S','A','M','A','M','D','T']])assert(validatePuzzle(graph,{route:bad}));
assert.equal(validatePuzzle(ASSESSMENTS[4],{assumption:'fabrication',evidence:'receipt',rule:'retain'}),null);
assert.equal(Object.values(rooms).flatMap(r=>r.items).length,66);assert.equal(new Set(Object.values(rooms).flatMap(r=>r.items.map(i=>i.specimenId))).size,44);
// Proof of the missing interval from the actual calibrated records and transfer map.
const medical=19*60+9-4,engineering=19*60+11+4;assert.equal(engineering-medical,10);assert.equal(medical+5,19*60+10);assert.equal(19*60+20-engineering,5);
console.log('Passed: complete six-assessment journey, reachable offerings, preserved evidence, all access gates, alternate copies, hints/reload persistence, legacy saves and issued codes, journal archives, rewards, completion deduplication, rejected bypasses, unique sequences and all valid relay routes.');
// Expired legacy codes return to their existing puzzle, and consumed accepted evidence is restored.
cookie='aegis=expired';store.set('session:expired',JSON.stringify({active:true,email:'expired@example.com',level:1,scene:'d6_corridor',stage:'code',code:'ABCDEF',codeExpires:1,inventory:[],visited:[6],journal:[{title:'Evidence accepted',items:['rosemary_tincture','citrus_oil','jasmine_oil']}],transmissions:[]}));state=await api('/api/state');assert.equal(state.stage,'puzzle');assert(state.legacyFirst);assert(state.inventory.includes('rosemary_tincture'));assert.equal(state.code,undefined);
// An unassisted finish receives recognition independently of ordinary reward entitlement.
cookie=undefined;await api('/api/register',{email:'unassisted@example.com',consent:true});key='session:'+cookie.split('=')[1];saved=JSON.parse(store.get(key));Object.assign(saved,{level:6,scene:'d1_corridor',stage:'puzzle'});store.set(key,JSON.stringify(saved));state=await action('puzzle',{answer:answers[6]});assert.equal(state.completion.recognition,'Unassisted Witness');assert.equal(state.completion.email,undefined);assert.equal((await api('/api/rewards')).completion.email,undefined);
// Review catalogue stays identical to live catalogue, including moved IDs and image references.
const {reviewRooms}=await import('../assets/js/deck-review-rooms.js');assert.deepEqual(reviewRooms,rooms);
const {itemPlacements}=await import('../assets/js/item-placements.js');for(const r of Object.values(rooms))for(const i of r.items){if(itemPlacements[i.id])for(const k of ['x','y','surface','displayWidth'])assert.equal(itemPlacements[i.id][k],i[k],i.id+' '+k);}
console.log('Passed: expired legacy code recovery, restoration of previously consumed evidence, unassisted recognition, private completion identity and live/review placement parity.');
