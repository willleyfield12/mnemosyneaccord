import {createCheckpoints} from './station-checkpoints.js?v=progression-12';
import {partitionJournal} from './station-journal.js?v=progression-12';
import {itemPlacements} from './item-placements.js?v=progression-12';
import {remoteSpecimens} from './remote-specimens.js?v=all44-placement';
import {itemIdentities} from './item-identities.js?v=all44-placement';
import {hatchPositions} from './hatch-positions.js?v=outer-frame';
import {surfaces} from './room-surfaces.js?v=all44-placement';
import {readState,request,action,syncNav,status,element} from './protocol.js?v=progression-12';
const $=s=>document.querySelector(s);let state,rooms={},selectedItem=null,closeScene=null;const checked=new Set();
function ensureJournalControls(){
 const journal=$('#journal');if(!journal)return;
 if(!$('#journal-entries')){const folder=element('details');folder.id='journal-entries';folder.className='journal-disclosure';const summary=element('summary','ENTRIES ');const count=element('span','0');count.id='journal-count';summary.append(count);journal.before(folder);folder.append(summary,journal);}
 if(!$('#journal-archive-folder')){const folder=element('details');folder.id='journal-archive-folder';folder.className='journal-disclosure';folder.hidden=true;const summary=element('summary','ARCHIVE ');const count=element('span','0');count.id='journal-archive-count';summary.append(count);const list=element('div');list.id='journal-archive';list.className='journal';folder.append(summary,list);$('#journal-entries').after(folder);}
}
ensureJournalControls();
const allItems=()=>Object.values(rooms).flatMap(r=>r.items);const currentDeck=()=>Number(state.scene.split('_')[0].slice(1));
async function change(name,data){try{const updated=await action(name,data);
 if(name==='intro'||name==='retain_protocol'){
  const key='aegis-protocol-'+updated.level;
  if(!updated.journal?.some(entry=>entry.id===key))throw new Error('The protocol could not be confirmed in your journal. Please try again. If this continues, reload the page before retaining it again.');
 }
 state=updated;status('');render();return true;}catch(e){status(e.message);if($('#aegis').open){let error=$('#aegis-error');if(!error){error=element('p','','error');error.id='aegis-error';error.setAttribute('role','status');$('#aegis-copy').append(error)}error.textContent=e.message;}return false;}}
function button(label,fn,disabled=false){const b=element('button',label);b.type='button';b.disabled=disabled;b.onclick=async()=>{b.disabled=true;try{await fn()}catch(e){status(e.message)}finally{b.disabled=disabled}};return b;}
function showAegis(title,content,controls=[]){$('#aegis-title').textContent=title;$('#aegis-copy').replaceChildren();if(typeof content==='string')$('#aegis-copy').append(element('p',content));else $('#aegis-copy').append(content);$('#aegis-actions').replaceChildren(...controls);if(!$('#aegis').open)$('#aegis').showModal();}

// A short navigation briefing appears once per entry, independently of clearance progress.
let navigationBriefed=false;
function offerNavigationTour(){
 const welcome=$('#station-welcome');if(!welcome)return;
 // Returning readers can reopen the guide through Navigation help without another prompt.
 try{if(sessionStorage.getItem('aegis-tour-choice-v1'))return;}catch(e){}
 welcome.hidden=false;
 function dismiss(){welcome.hidden=true;try{sessionStorage.setItem('aegis-tour-choice-v1','chosen');}catch(e){}}
 $('#take-navigation-tour').onclick=()=>{dismiss();navigationBriefing();};
 $('#explore-station').onclick=()=>{dismiss();$('#doors button')?.focus({preventScroll:true});};
}
function navigationBriefing(){
 const tour=document.createElement('dialog');tour.className='aegis-tour';tour.setAttribute('aria-labelledby','tour-heading');
 const spotlight=element('div',undefined,'tour-spotlight');spotlight.setAttribute('aria-hidden','true');
 const panel=element('section',undefined,'tour-panel');
 const label=element('p','AEGIS // NAVIGATION PROTOCOL','eyebrow'),heading=element('h2');heading.id='tour-heading';
 const copy=element('p');copy.id='tour-copy';tour.setAttribute('aria-describedby','tour-copy');
 const counter=element('p',undefined,'kicker');counter.setAttribute('aria-live','polite');
 const controls=element('div',undefined,'actions');let step=0,positionFrame;
 const steps=[
  ['#room-title','Retain your position.','You are at the Primary Docking Port on Deck 6. These headings identify your current room and deck.'],
  ['#spots .spot, #scene-copy','Examine what remains.','Select a visible specimen to inspect it. Register to manifest keeps it as evidence. STEP CLOSER provides a nearer view.'],
  ['#doors','Enter the corridor.','Begin with Proceed to Deck 6. From a corridor, select a compartment hatch to enter a room. Return to the corridor before changing decks.'],
  ['#transit','Follow the stairwell.','Station transit moves you between adjacent decks while you are in a corridor. Dimmed controls are unavailable here or sealed by clearance. Exploration begins on Decks 6, 7 and 8; AEGIS authorises further access as your investigation progresses.'],
  ['#open-travelling-pad','Consult Daedalus.','OPEN DATAPAD gives you the Mission Log, Crew Records and transmissions. Close the Datapad to resume from the same station position.'],
  ['#manifest','Retain the evidence.','Your manifest holds collected specimens; your journal records discoveries below it. AEGIS protocol names the evidence and rooms for your current investigation. The current investigation control identifies the checkpoint.']
 ];
 function finish(){cancelAnimationFrame(positionFrame);window.removeEventListener('resize',schedulePosition);window.removeEventListener('scroll',schedulePosition,true);tour.close();tour.remove();$('#navigation-help').focus({preventScroll:true});}
 const back=button('Back',()=>{step--;paint();}),next=button('Next',()=>{if(step===steps.length-1)finish();else{step++;paint();}}),skip=button('Skip tour',finish);
 controls.append(back,next,skip);panel.append(label,counter,heading,copy,controls);tour.append(spotlight,panel);document.body.append(tour);
 function target(){return document.querySelector(steps[step][0]);}
 function position(){
  const el=target();if(!el)return;const r=el.getBoundingClientRect(),pad=9;
  spotlight.style.left=Math.max(4,r.left-pad)+'px';spotlight.style.top=Math.max(4,r.top-pad)+'px';
  spotlight.style.width=Math.min(innerWidth-8,r.width+pad*2)+'px';spotlight.style.height=Math.min(innerHeight-8,r.height+pad*2)+'px';
  // Place the briefing on the opposite half of the viewport from the highlighted control.
  const atTop=r.top+r.height/2>innerHeight/2;
  panel.style.top=atTop?'16px':'auto';panel.style.bottom=atTop?'auto':'16px';
 }
 function schedulePosition(){cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(position);}
 function paint(){const [,title,text]=steps[step];heading.textContent=title;copy.textContent=text;counter.textContent='STEP '+(step+1)+' / '+steps.length;back.disabled=step===0;next.textContent=step===steps.length-1?'Begin exploration':'Next';const el=target();if(el)el.scrollIntoView({block:'center',behavior:'instant'});position();next.focus({preventScroll:true});}
 tour.addEventListener('cancel',e=>{e.preventDefault();finish();});
 tour.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();next.click();}else if(e.key==='ArrowLeft'&&step>0){e.preventDefault();back.click();}});
 window.addEventListener('resize',schedulePosition);window.addEventListener('scroll',schedulePosition,true);
 tour.showModal();paint();
}
$('#navigation-help').onclick=navigationBriefing;

function revealRetainedProtocol(){
 $('#aegis').close();$('#journal-entries').open=true;
 const record=[...$('#journal').querySelectorAll('details')].find(el=>el.dataset.protocol==='true');
 if(record)record.open=true;
 $('#journal-entries').scrollIntoView({block:'nearest',behavior:'instant'});
 status('AEGIS protocol retained in Personal Journal → ENTRIES.');
}
const checkpoints=createCheckpoints({getState:()=>state,change,show:showAegis,button,element,close:()=>$('#aegis').close(),request});
function protocol(proceed=false){if(state.progressionVersion===2&&!state.legacyFirst){if(state.stage==='complete')checkpoints.rewards();else if(state.level===6)checkpoints.open();else checkpoints.protocol();if(proceed)change('intro');return;}if(state.level>=3){showAegis('CLEARANCE // The record has widened.','Deck 3 is authorised: Main Engineering and Solar Array Control. Eight Hall records await you under Archive Access.',[button('Retain protocol',async()=>{if(await change('retain_protocol'))revealRetainedProtocol();})]);return;}if(state.level>=2){showAegis('RESONANCE // Protocol retained.','Decks 5 and 4 are authorised. Use adjacent stairwells to establish new anchors. Four Greater Hall records await you under Archive Access.',[button('Retain protocol',async()=>{if(await change('retain_protocol'))revealRetainedProtocol();})]);return;}showAegis('ORIENTATION // Follow the traces.','The station admits you to Decks 6, 7, and 8. Three traces survive where testimony fails: the sun concealed in a rind at the threshold; remembrance keeping vigil where sleepers pray; a pale bloom whose night watches the ice. Bring what each has surrendered, not merely what resembles it. Present three correspondences at the sealed Deck 5 checkpoint. Offered objects leave your manifest; your testimony remains. Rejected evidence may be recovered again. Consult the Mission Timeline when the trial is granted.',[button('Retain protocol',async()=>{if(await change('intro')){revealRetainedProtocol();if(proceed)await change('move',{scene:'d6_corridor'})}})]);}
function render(){
 for(const [id,item] of Object.entries(["deck5","deck3"].includes(new URLSearchParams(location.search).get("review"))?remoteSpecimens:{}))if(rooms[id]&&!rooms[id].items.some(i=>i.id===item.id))rooms[id].items.push(structuredClone(item));
 for(const room of Object.values(rooms))for(const item of room.items)if(itemIdentities[item.id])Object.assign(item,itemIdentities[item.id]);
 for(const room of Object.values(rooms))for(const item of room.items)if(itemPlacements[item.id])Object.assign(item,itemPlacements[item.id]);
 $('#corridor-hatches').replaceChildren();
 if(!state.active){
 $('#story-rewards').hidden=true;$('#checkpoint-access').disabled=true;syncNav(state);$('#deck-title').textContent='DECK 6 // ARRIVAL';$('#room-title').textContent='Primary Docking Port';$('#scene').style.backgroundImage='url("/assets/images/rooms/primary-docking-port.png")';$('#scene-copy').textContent='You have reached Kepler III. The station awaits your imprint.';$('#room-world').hidden=true;$('#scene').classList.remove('room-mode');$('#spots').replaceChildren();$('#transit').replaceChildren(element('p','Present yourself at the docking seal before entering the station.','muted'));$('#wormholes').replaceChildren();$('#wormhole-title').hidden=true;$('#manifest').replaceChildren(element('p','No observer manifest detected.','muted'));$('#manifest-count').textContent='0';$('#journal').replaceChildren();$('#journal-count').textContent='0';$('#journal-archive').replaceChildren();$('#journal-archive-count').textContent='0';$('#journal-archive-folder').hidden=true;$('#doors').replaceChildren(button('Proceed to Deck 6',()=>{showAegis('Submit or be forgotten.','The docking seal awaits your transmission address. Only a detected observer may continue.',[button('Permit detection',()=>location.href='/aegis/submit.html'),button('Return to Docking Port',()=>$('#aegis').close())]);}));return;
 }
 $('#story-rewards').hidden=state.level<5;$('#story-rewards').onclick=checkpoints.rewards;$('#checkpoint-access').disabled=false;$('#protocol-button').textContent=state.level===6?'Restored context':state.stage==='complete'?'Completion record':'AEGIS protocol';
 $('#aegis').oncancel=null;syncNav(state);const deck=currentDeck();const corridor=state.scene.endsWith('_corridor');const room=rooms[state.scene];
 if(!corridor&&!room){status('Station room data is not ready. Reload the page to reconnect.');return;}
 $('#deck-title').textContent='DECK '+deck;$('#room-title').textContent=corridor?(deck===4?'Command floor':'Deck '+deck+' access corridor'):room.name;
 $('#scene').style.backgroundImage=`url("${corridor?(deck===4?rooms.d4_bridge.image:'/assets/images/corridors/deck-'+deck+'.svg'):room.image}")`;
 $('#scene').style.backgroundSize=corridor&&deck!==4?'contain':'cover';
 $('#scene').classList.toggle('room-mode',!corridor);$('#scene').classList.toggle('command-floor',corridor&&deck===4);$('#room-world').hidden=corridor;
 if(!corridor){$('#room-world').style.setProperty('--room-zoom','1.10');$('#room-world').style.setProperty('--room-origin','0% 0%');$('#room-world').style.setProperty('--approach-y','0px');$('#room-art').style.backgroundImage=`url("${room.image}")`;$('#scene').style.backgroundImage='none';resetParallax();fitRoom();}else{$('#scene').style.minHeight='';resetParallax();}
 $('#scene-copy').textContent=corridor?(deck===4?'The command floor is open. Choose a station to inspect.':'Open pressure hatches lead to this deck’s compartments. The stairwell connects only the decks immediately above and below.'):'Inspect the specimens. A resemblance is not proof of resonance.';
 fitHatches();$('#doors').replaceChildren();if(corridor){for(const [id,r] of Object.entries(rooms).filter(([,r])=>r.deck===deck)){const door=button('',()=>change('move',{scene:id}));if(deck!==4&&hatchPositions[id]){door.className='corridor-hatch';door.setAttribute('aria-label','Enter '+r.name);door.title=r.name;for(const key of ['left','top','width','height'])door.style[key]=hatchPositions[id][key]+'%';const outline=document.createElementNS('http://www.w3.org/2000/svg','svg');outline.setAttribute('viewBox','0 0 100 100');outline.setAttribute('preserveAspectRatio','none');outline.setAttribute('aria-hidden','true');const edge=document.createElementNS('http://www.w3.org/2000/svg','polygon');edge.setAttribute('points',hatchPositions[id].outline);edge.setAttribute('vector-effect','non-scaling-stroke');outline.append(edge);door.append(outline,element('span',r.name));$('#corridor-hatches').append(door);continue;}door.className='room-door';door.setAttribute('aria-label',r.name);const view=element('img');view.src=deck===4?r.image:'/assets/images/corridors/previews/'+id+'.jpg';view.alt='View into '+r.name;door.append(view,element('span',r.name));$('#doors').append(door);}if(state.legacyFirst&&deck===6)$('#doors').append(button('Approach Deck 5 checkpoint',checkpoint));else if(state.assessment?.checkpoint===deck)$('#doors').append(button(deck===1?'Open Witness Key terminal':'Approach AEGIS checkpoint // '+state.assessment.title,checkpoints.open));if(deck===1&&state.stage==='complete')$('#doors').append(button('Vault Theta // Descent and rewards',checkpoints.rewards));}else $('#doors').append(button(state.scene==='d6_docking'?'Proceed to Deck 6':(deck===4?'Return to command floor':'Return to corridor'),async()=>{if(state.scene==='d6_docking'&&!state.intro){if(state.progressionVersion===2&&!state.legacyFirst){if(await change('intro'))await change('move',{scene:'d6_corridor'});}else protocol(true);return;}return change('move',{scene:'d'+deck+'_corridor'});}));
 if(!corridor){const remaining=room.items.filter(i=>!state.inventory.includes(i.id));if(closeScene===state.scene&&!remaining.length)closeScene=null;const closer=button(closeScene===state.scene?'STEP BACK':'STEP CLOSER',()=>{closeScene=closeScene===state.scene?null:state.scene;render();},!remaining.length);$('#doors').append(closer);focusCollectible();}else closeScene=null;
 $('#spots').replaceChildren();if(room&&!corridor)for(const item of room.items.filter(i=>!state.inventory.includes(i.id))){const b=button('',()=>inspect(item));b.className='spot';b.setAttribute('aria-label','Inspect '+item.name);b.style.width=(item.displayWidth||3)+'%';b.style.height='auto';b.style.aspectRatio='1';b.style.left=item.x+'%';b.style.top=item.y+'%';b.dataset.surface=item.surface||'recovered surface';b.title=item.name+' — '+(item.surface||'recovered surface');const img=element('img');img.src=item.image;img.alt=item.name;const lighting={d3_solar:[1.28,.9,1.02],d6_docking:[1.25,1.1],d5_medbay:[1.18,1.03,.82],d5_diag:[1.05,.9],d5_xenobio:[1.08,.88,.78],d5_pharma:[1.18,1.08,.8],d4_bridge:[1.1,.9],d4_comms:[1.08,.85],d4_reactor:[1.15,.88],d4_systems:[1.08,.87],d4_obs:[1.02,.85],d4_galley:[1.12,.9]};const itemIndex=room.items.indexOf(item);b.style.setProperty('--item-light',item.lighting??lighting[state.scene]?.[itemIndex]??1);img.style.filter='brightness(var(--item-light)) drop-shadow(0 3px 2px rgba(0,0,0,.55))';const pose=item.image.split('/').pop();const poses={'clear-quartz-point.png':[42,.62],'foxglove-blossom-spike.png':[68,.65],'dried-sage-smudge-bundle.png':[65,.7],'banded-onyx-slab.png':[8,.82],'amber-petal.png':[42,.6]};if(poses[pose]){img.style.transform='rotate('+poses[pose][0]+'deg) scaleY('+poses[pose][1]+')';img.style.transformOrigin='center';}if(item.rotation!==undefined){img.style.transform='translateY('+(item.poseOffset??(item.surfaceScale<.4?30:12))+'%) rotate('+item.rotation+'deg) scaleY('+(item.surfaceScale||1)+')';img.style.transformOrigin='center';}b.append(img);$('#spots').append(b);}
 $('#transit').replaceChildren();for(const next of [deck+1,deck-1].filter(d=>d>=1&&d<=8)){const allowed=next>=(state.minDeck??{1:6,2:4,3:3,4:2,5:1}[state.level]);$('#transit').append(button('Deck '+next+(allowed?'':' // sealed'),()=>change('move',{scene:'d'+next+'_corridor'}),!allowed||!corridor));}if(!corridor)$('#transit').append(element('p','Return to the corridor to use the stairwell.','muted'));
 $('#wormholes').replaceChildren();$('#wormhole-title').hidden=state.level<2;if(state.level>=2)for(const d of state.visited.filter(d=>d!==deck))$('#wormholes').append(button('Anchor // Deck '+d,()=>change('move',{scene:'d'+d+'_corridor',mode:'wormhole'}),!corridor));
 $('#manifest-count').textContent=state.inventory.length;$('#manifest').replaceChildren();for(const id of state.inventory){const item=allItems().find(i=>i.id===id);if(!item)continue;const wrap=element('div',undefined,'manifest-item');const label=element('label');const input=element('input');input.type='checkbox';input.checked=checked.has(id);input.onchange=()=>input.checked?checked.add(id):checked.delete(id);label.append(input,document.createTextNode(' '+item.name));wrap.append(label);$('#manifest').append(wrap);}if(!state.inventory.length)$('#manifest').append(element('p','No specimens retained.','muted'));
 const expanded=new Set([...$('#journal').querySelectorAll('details[open]')].map(el=>el.dataset.entryKey));
 const archiveExpanded=new Set([...$('#journal-archive').querySelectorAll('details[open]')].map(el=>el.dataset.entryKey));
 $('#journal').replaceChildren();$('#journal-archive').replaceChildren();
 const {current,past}=partitionJournal(state.journal,state.level);
 $('#journal-count').textContent=String(current.length);$('#journal-archive-count').textContent=String(past.length);$('#journal-archive-folder').hidden=past.length===0;
 function journalRecord(entry,openKeys){
  const record=element('details',undefined,'record journal-entry');record.dataset.entryKey=entry.entryKey;record.dataset.protocol=String(Boolean(entry.protocol));record.open=openKeys.has(entry.entryKey);
  record.append(element('summary',entry.title),element('p',entry.body));
  if(entry.items?.length)record.append(element('p',entry.items.map(id=>allItems().find(i=>i.id===id)?.name||id).join(', ')));
  return record;
 }
 for(const entry of [...current].reverse())$('#journal').append(journalRecord(entry,expanded));
 if(!current.length)$('#journal').append(element('p','No current entries. Earlier investigations are retained in ARCHIVE below.','muted'));
 const levelNames=['','ORIENTATION','RESONANCE','CLEARANCE','SANCTUARY','ACCORD'];
 for(const level of [...new Set(past.map(entry=>entry.level))].sort((a,b)=>b-a)){
  const group=element('details',undefined,'journal-level');group.dataset.entryKey='level-'+level;group.open=archiveExpanded.has(group.dataset.entryKey);
  const entries=past.filter(entry=>entry.level===level);group.append(element('summary',(state.progressionVersion===2?['','THE INTERRUPTED SHIFT','THE DIVIDED WITNESS','THE BROKEN RELAY','THE ERASURE ORDER','THE MISSING INTERVAL','THE WITNESS KEY','VAULT THETA'][level]:(levelNames[level]||'COMPLETED'))+' · '+entries.length));
  for(const entry of entries.reverse())group.append(journalRecord(entry,archiveExpanded));
  $('#journal-archive').append(group);
 }
 if(state.assessment)$('#scene-copy').textContent+=' Current investigation: '+state.assessment.title+'. AEGIS terminal: Deck '+state.assessment.checkpoint+' corridor.';
 $('#checkpoint-access').textContent=state.stage==='complete'?'Vault Theta // Descent and rewards':state.assessment?'Current investigation // '+state.assessment.title:'Current checkpoint';
 $('#checkpoint-access').onclick=()=>state.legacyFirst?checkpoint():state.stage==='complete'?checkpoints.rewards():checkpoints.open();
}
function focusCollectible(){
 const world=$('#room-world');world.classList.toggle('close-inspection',closeScene===state.scene);
 if(closeScene!==state.scene){world.style.setProperty('--approach-x',(-world.clientWidth*.05)+'px');world.style.setProperty('--approach-y',(-world.clientHeight*.05)+'px');return;}
 const item=rooms[state.scene].items.find(i=>!state.inventory.includes(i.id));if(!item)return;
 const zoom=1.85,width=world.clientWidth,height=world.clientHeight;
 const x=Math.max($('#scene').clientWidth-width*zoom,Math.min(0,$('#scene').clientWidth*.5-item.x/100*width*zoom));
 const y=$('#scene').clientHeight*.48-95-(item.y/100*height-(item.displayWidth||4)/100*width*.4)*zoom;
 world.style.setProperty('--room-origin','0% 0%');world.style.setProperty('--room-zoom',String(zoom));world.style.setProperty('--approach-x',x+'px');world.style.setProperty('--approach-y',y+'px');resetParallax();
 $('#scene-copy').textContent='Close inspection // '+item.name+'. Collect this specimen to bring the next one into view.';
}
function inspect(item){selectedItem=item;$('#item-name').textContent=item.name;$('#item-meta').textContent=item.meta;$('#item-description').textContent=item.desc+(item.surface?' Located on the '+item.surface+'.':'');$('#item-image').src=item.image;$('#item-image').alt=item.name;$('#inspection').showModal();}
$('#collect').onclick=async()=>{if(await change('collect',{id:selectedItem.id}))$('#inspection').close()};$('#close-inspection').onclick=()=>$('#inspection').close();$('#protocol-button').onclick=()=>state.active?protocol():$('#doors button').click();
function shuffleSequenceOptions(entries,random=Math.random){
 const shuffled=entries.map(entry=>[...entry]);
 for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 // Never present the authoring order, which is the solution to this trial.
 if(shuffled.length>1&&shuffled.every((entry,i)=>entry[0]===entries[i][0]))[shuffled[0],shuffled[1]]=[shuffled[1],shuffled[0]];
 return shuffled;
}
function checkpoint(){
 if(!state.legacyFirst){checkpoints.open();return;}
 if(state.stage==='hunt'){const content=element('div');content.append(element('p','The Deck 5 seal requires a coherent offering. Select three specimens that answer the retained correspondences. A convincing likeness is not necessarily evidence. Only selected specimens will be consumed, even if the offering is rejected.'));const list=element('p',[...checked].map(id=>allItems().find(i=>i.id===id)?.name).filter(Boolean).join(', ')||'No evidence selected.');content.append(list);showAegis('Evidence assessment',content,[button('Present selected evidence',async()=>{const ids=[...checked].filter(id=>state.inventory.includes(id));if(await change('submit',{ids})){checked.clear();$('#aegis').close();if(state.stage==='puzzle')checkpoint();}}),button('Withdraw',()=>$('#aegis').close())]);}
 else if(state.stage==='puzzle'){const form=element('form');form.append(element('p','Restore the mission sequence. Cause must precede its recorded consequence. The Mission Timeline retains the necessary testimony.'));const entries=[['arrival','Orbital cycle resumed'],['variance','First routing variance'],['mismatch','Mission record mismatch'],['review','Cognitive review']];const fields=[];for(let i=0;i<4;i++){const label=element('label','Position '+(i+1));const sel=element('select');sel.required=true;const empty=element('option','Choose event');empty.value='';sel.append(empty);for(const [value,text] of shuffleSequenceOptions(entries)){const o=element('option',text);o.value=value;sel.append(o);}label.append(sel);form.append(label);fields.push(sel);}const error=element('p','','error');error.setAttribute('role','status');form.append(error);const b=button('Submit witness sequence',()=>{});b.type='submit';form.append(b);form.onsubmit=async e=>{e.preventDefault();try{state=await action('puzzle',{order:fields.map(f=>f.value)});render();$('#aegis').close();checkpoint();}catch(err){error.textContent=err.message}};showAegis('Trial // Continuity of record',form,[button('Consult archive later',()=>$('#aegis').close())]);}
 else if(state.stage==='code'){const form=element('form');form.append(element('p','Your witness sequence is accepted. Retrieve the RESONANCE clearance code from the transmission inbox.'));const a=element('a','Open transmission inbox');a.href='/aegis/submit.html';form.append(a);const label=element('label','Clearance code');const input=element('input');input.autocomplete='one-time-code';input.required=true;label.append(input);form.append(label);const error=element('p','','error');error.setAttribute('role','status');form.append(error);const b=button('Verify clearance',()=>{});b.type='submit';form.append(b);form.onsubmit=async e=>{e.preventDefault();try{state=await action('code',{code:input.value});render();$('#aegis').close();checkpoint();}catch(err){error.textContent=err.message}};showAegis('Clearance pending',form,[button('Return to corridor',()=>$('#aegis').close())]);}
 else {showAegis('RESONANCE // You have been recognised.','Decks 5 and 4 are open. Reach each through the stairwell to establish its wormhole anchor. Four Greater Hall records are now available through Archive Access.',[button('Enter Deck 5',async()=>{if(await change('move',{scene:'d5_corridor'}))$('#aegis').close()}),button('Retain location',()=>$('#aegis').close()),button('Study archive',()=>location.href='/archive/')]);}
}
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const pointerPreference=matchMedia('(hover: hover) and (pointer: fine)');
function resetParallax(){const world=$('#room-world');world.style.setProperty('--camera-x','0px');world.style.setProperty('--camera-y','0px');world.style.setProperty('--depth-x','0px');world.style.setProperty('--depth-y','0px');}
function fitRoom(){if(!$('#room-world').hidden)$('#scene').style.minHeight=Math.max(560,$('#scene').clientWidth*941/1672+245)+'px';}
function fitHatches(){const scene=$('#scene');const width=Math.min(scene.clientWidth,scene.clientHeight*1.6);$('#corridor-hatches').style.width=width+'px';$('#corridor-hatches').style.height=(width/1.6)+'px';}
const resizeObserver=new ResizeObserver(()=>{fitRoom();fitHatches();if(state?.active&&closeScene===state.scene)focusCollectible();});resizeObserver.observe($('#scene'));
$('#scene').addEventListener('pointermove',event=>{if(!state?.active||closeScene===state.scene||state.scene.endsWith('_corridor')||motionPreference.matches||!pointerPreference.matches||event.pointerType!=='mouse'||$('#inspection').open||$('#aegis').open)return;const rect=$('#scene').getBoundingClientRect();const x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));const y=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));const world=$('#room-world');world.style.setProperty('--camera-x',(-x*24)+'px');world.style.setProperty('--camera-y',(-y*15)+'px');world.style.setProperty('--depth-x','0px');world.style.setProperty('--depth-y','0px');});
$('#scene').addEventListener('pointerleave',resetParallax);motionPreference.addEventListener('change',resetParallax);
async function arrival(){
 if(["deck5","deck3"].includes(new URLSearchParams(location.search).get("review"))){state=await readState();rooms=await (await import("./deck-review-rooms.js?v=progression-12")).reviewRooms;render();return;}
 state=await readState();
 if(state.active){
  rooms=await request('/api/rooms');for(const [id,anchors] of Object.entries(surfaces)){if(rooms[id])rooms[id].items.forEach((item,i)=>Object.assign(item,anchors[i]));}
  // Entry follows existing authorised transit to the docking port without resetting progress.
  if(state.scene!=='d6_docking'){
   if(!state.scene.endsWith('_corridor'))state=await action('move',{scene:'d'+currentDeck()+'_corridor'});
   while(currentDeck()!==6){const deck=currentDeck();state=await action('move',{scene:'d'+(deck+(deck<6?1:-1))+'_corridor'});}
   state=await action('move',{scene:'d6_docking'});
  }
 }
 render();
 if(state.active&&!navigationBriefed){navigationBriefed=true;offerNavigationTour();}
}
try{await arrival();}catch(e){status('The station connection is unavailable. '+e.message)}
async function refreshStation(){
 const next=await readState();
 if(next.active&&(!Object.keys(rooms).length||(!next.scene.endsWith('_corridor')&&!rooms[next.scene]))){
  if(['deck5','deck3'].includes(new URLSearchParams(location.search).get('review')))rooms=(await import('./deck-review-rooms.js?v=progression-12')).reviewRooms;
  else rooms=await request('/api/rooms');
  for(const [id,anchors] of Object.entries(surfaces))if(rooms[id])rooms[id].items.forEach((item,i)=>Object.assign(item,anchors[i]));
 }
 state=next;render();
}
window.addEventListener('pageshow',async e=>{if(e.persisted){try{await refreshStation()}catch(err){status('Station connection interrupted. '+err.message)}}});
document.addEventListener('visibilitychange',async()=>{if(!document.hidden){try{await refreshStation()}catch(e){status('Station connection interrupted. '+e.message)}}});
window.addEventListener('datapad-closed',()=>refreshStation().catch(e=>status('Station connection interrupted. '+e.message)));
