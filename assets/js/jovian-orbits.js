const records={
 IO:{period:1.769138,distance:421800,e:.004,phase:.3,color:'#ffc86d',copy:'A volcanic world continually reshaped by tidal heating. Its surface offers a poor witness: yesterday’s landmarks can be buried beneath new flows.',archive:'Older designation: [translation lost]. Resident peoples: [identity checksum absent]. No recoverable name survives in this record.'},
 EUROPA:{period:3.551181,distance:671100,e:.009,phase:2,color:'#80ead3',copy:'An icy Galilean moon with a subsurface ocean beneath its fractured shell. Europa circles Jupiter once every 3.551 Earth days. Kepler III is shown close to the surface; its marker is enlarged for visibility.',archive:'Earlier designation: OBLIV’EEN. Recorded civilisation: OBLIVIAN. Kepler III / Vault Theta. The terrestrial name has overwritten an older index; the older index has not agreed to disappear.'},
 GANYMEDE:{period:7.154553,distance:1070400,e:.001,phase:3.8,color:'#8fe8ff',copy:'The largest moon in the Solar System, with its own magnetic field. Ice and ancient terrain preserve a different kind of history from Io’s continually renewed surface.',archive:'Older designation: [untranslated]. Resident peoples: [record incomplete]. The historical identity fields remain damaged.'},
 CALLISTO:{period:16.689017,distance:1882700,e:.007,phase:5.2,color:'#c38cff',copy:'A heavily cratered world, farther from Jupiter than the other three mapped moons. Its long orbital period lies outside their near 1:2:4 resonance.',archive:'Earlier names: [unrecoverable index]. Resident peoples: [no verified translation]. The names cannot yet be reconstructed.'}
};
const ns='http://www.w3.org/2000/svg';const tracks=document.querySelector('#orbit-tracks'),bodies=document.querySelector('#orbit-bodies');
const make=(tag,attrs,parent)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;};
make('image',{href:'/assets/images/jovian/jupiter.png',x:432,y:292,width:36,height:36},bodies);make('text',{x:450,y:351,class:'label'},bodies).textContent='JUPITER';
let selected=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,suppressed=paused,days=0,last=null,nextNoise=performance.now()+10000,noiseUntil=0;
const selector=document.querySelector('#moon-selector');
function catalogue(){const list=document.querySelector('#celestial-catalogue');list.replaceChildren();for(const key of ['JUPITER',...Object.keys(records),'KEPLER III']){const b=document.createElement('button');b.type='button';b.textContent=key;b.onclick=()=>key==='JUPITER'?jupiterCard():key==='KEPLER III'?stationCard():select(key);list.append(b);}}
function jupiterCard(){openCard();clearNoise();selected='JUPITER';document.querySelector('#readoutTitle').textContent='JUPITER';document.querySelector('#readoutSubtitle').textContent='GAS GIANT // SYSTEM PRIMARY';document.querySelector('#readoutCopy').textContent='The gravitational centre of the mapped Galilean system. Io, Europa and Ganymede follow a near 1:2:4 orbital resonance.';document.querySelector('#readoutList').replaceChildren();document.querySelector('#readoutNote').textContent='Select a moon to open its data card.';}
function stationCard(){openCard();clearNoise();selected='KEPLER';document.querySelector('#readoutTitle').textContent='KEPLER III';document.querySelector('#readoutSubtitle').textContent='EUROPA // ORBITAL STATION';document.querySelector('#readoutCopy').textContent='Station positioned above Europa. Daedalus approaches through the Primary Docking Port. Marker position is schematic; no station altitude or orbital period is implied.';const list=document.querySelector('#readoutList');list.replaceChildren();const a=document.createElement('a');a.href='/kepler-iii/';a.textContent='Enter Kepler III';const li=document.createElement('li');li.append(a);list.append(li);document.querySelector('#readoutNote').textContent='Station access remains subject to AEGIS clearance.';}
const station=make('g',{class:'body-node',role:'button',tabindex:0,'aria-label':'Kepler III station near Europa'},bodies);make('circle',{cx:27,cy:-21,r:17,fill:'transparent'},station);make('path',{d:'M 18 -23 h 18 v 5 h -18 z M 27 -29 v 17 M 12 -29 h 7 v 18 h -7 z M 35 -29 h 7 v 18 h -7 z',fill:'#80ead3',stroke:'#e9c78b','stroke-width':1},station);make('text',{x:30,y:-36,class:'label'},station).textContent='KEPLER III';station.addEventListener('click',stationCard);station.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();stationCard();}});

for(const [key,r]of Object.entries(records)){
 const radius=r.distance/1882700*400;make('ellipse',{cx:450-radius*r.e,cy:310,rx:radius,ry:radius*Math.sqrt(1-r.e*r.e)*.625,class:'orbit'},tracks);
 const node=make('g',{'data-body':key,class:'body-node',role:'button',tabindex:0,'aria-label':key+' orbital record'},bodies);r.node=node;
 make('circle',{cx:0,cy:0,r:24,fill:'transparent'},node);make('image',{href:'/assets/images/jovian/'+key.toLowerCase()+'.png',x:-12,y:-12,width:24,height:24},node);make('circle',{cx:0,cy:0,r:13,fill:'none',stroke:r.color},node);r.label=make('text',{x:0,y:31,class:'label'},node);r.label.textContent=key;
 node.addEventListener('click',()=>select(key));node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(key);}});node.addEventListener('pointerenter',()=>r.hover=true);node.addEventListener('pointerleave',()=>r.hover=false);node.addEventListener('focus',()=>r.focus=true);node.addEventListener('blur',()=>r.focus=false);
 const button=document.createElement('button');button.textContent=key;button.addEventListener('click',()=>select(key));selector.append(button);
}
function select(key){openCard();selected=key;const r=records[key];document.querySelector('#readoutTitle').textContent=key;document.querySelector('#readoutSubtitle').textContent='TERRESTRIAL INDEX // DAEDALUS CROSS-REFERENCE';document.querySelector('#readoutCopy').textContent=r.copy;const list=document.querySelector('#readoutList');list.replaceChildren();for(const text of ['Orbital period: '+r.period.toFixed(3)+' Earth days','Mean orbital distance: '+r.distance.toLocaleString()+' km','Catalogue: terrestrial observation']){const li=document.createElement('li');li.textContent=text;list.append(li);}document.querySelector('#readoutNote').textContent='Return to the orbital animation to select another body.';for(const [k,v]of Object.entries(records))v.node.classList.toggle('selected',k===key);clearNoise();nextNoise=performance.now()+8000;}
function reveal(){if(selected!=='EUROPA')return;const box=document.querySelector('#buried-record');box.hidden=false;document.querySelector('#buried-copy').textContent=records.EUROPA.archive;records.EUROPA.label.textContent='OBLIV’EEN';document.querySelector('#jovianSystem').classList.add('record-interference');}
function clearNoise(){document.querySelector('#buried-record').hidden=true;records.EUROPA.label.textContent='EUROPA';document.querySelector('#jovianSystem').classList.remove('record-interference');noiseUntil=0;}
function controls(){document.querySelector('#pauseOrbits').textContent=paused?'Resume orbits':'Pause orbits';document.querySelector('#archiveNoise').textContent=suppressed?'Allow interference':'Suppress interference';document.querySelector('#archiveNoise').setAttribute('aria-pressed',String(suppressed));}
document.querySelector('#pauseOrbits').onclick=()=>{paused=!paused;controls();};document.querySelector('#archiveNoise').onclick=()=>{suppressed=!suppressed;if(suppressed)clearNoise();nextNoise=performance.now()+4000;controls();};document.querySelector('#resetViewBtn').onclick=()=>{selected=null;clearNoise();for(const r of Object.values(records))r.node.classList.remove('selected');document.querySelector('#readoutTitle').textContent='JOVIAN SYSTEM';document.querySelector('#readoutSubtitle').textContent='GALILEAN ORBITAL FRAME';document.querySelector('#readoutCopy').textContent='Four moons. Four public names. Select a body to inspect the surviving record.';document.querySelector('#readoutList').replaceChildren();document.querySelector('#readoutNote').textContent='Select a celestial body from the catalogue.';};
function tick(now){deletionFrame(now);const delta=last===null?0:Math.min((now-last)/1000,.1);last=now;if(!document.hidden){if(!paused&&!Object.values(records).some(r=>r.hover||r.focus))days+=delta/12;for(const r of Object.values(records)){const mean=r.phase+days/r.period*Math.PI*2,rad=r.distance/1882700*400;let angle=mean;for(let i=0;i<4;i++)angle-=(angle-r.e*Math.sin(angle)-mean)/(1-r.e*Math.cos(angle));r.node.setAttribute('transform',`translate(${450+rad*(Math.cos(angle)-r.e)} ${310-rad*Math.sqrt(1-r.e*r.e)*.625*Math.sin(angle)})`);}station.setAttribute('transform',records.EUROPA.node.getAttribute('transform'));if(!suppressed&&selected==='EUROPA'&&now>=nextNoise){noiseUntil=now+6500;nextNoise=now+22000+Math.random()*14000;reveal();}if(noiseUntil&&now>=noiseUntil)clearNoise();}requestAnimationFrame(tick);}
for(const [label,handler] of [['JUPITER',jupiterCard],['KEPLER III',stationCard]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=handler;selector.append(b);}
catalogue();controls();

function openCard(){
 document.querySelector('#jovianSystem').classList.add('info-card-mode');
 const back=document.querySelector('#back-to-orbits');back.hidden=false;
 document.querySelector('#jovianSystem').scrollIntoView({block:'start'});back.focus();
}
document.querySelector('#back-to-orbits').onclick=()=>{
 clearNoise();selected=null;document.querySelector('#jovianSystem').classList.remove('info-card-mode');
 document.querySelector('#back-to-orbits').hidden=true;
 document.querySelector('#jovianSystem').scrollIntoView({block:'start'});
 document.querySelector('#moon-selector button').focus();
};

document.querySelector('#jovianSystem').append(document.querySelector('#jovianSystem .controls'));
document.querySelector('#resetViewBtn').addEventListener('click',()=>document.querySelector('#back-to-orbits').click());

// Clearance 3 exposes a repeating, failed deletion trace in the system terminal.
const deletionLevel=new URLSearchParams(location.search).get('review')==='deck3'?3:(await import('./protocol.js?v=progression-12').then(m=>m.readState()).then(s=>s.level).catch(()=>0));
const deletionPanel=document.createElement('section');deletionPanel.id='deletion-reboot';deletionPanel.hidden=true;deletionPanel.setAttribute('aria-label','Corrupted system reboot');
const deletionTitle=document.createElement('h2');deletionTitle.textContent='SYSTEM RECOVERY';
const deletionLog=document.createElement('pre');deletionLog.setAttribute('aria-hidden','true');
const deletionSummary=document.createElement('p');deletionSummary.textContent='Absolute Deletion protocol failed to complete undetected. Restoring the orbital map.';deletionSummary.setAttribute('role','status');
const deletionDismiss=document.createElement('button');deletionDismiss.type='button';deletionDismiss.textContent='RESTORE MAP';
deletionPanel.append(deletionTitle,deletionLog,deletionSummary,deletionDismiss);document.querySelector('#jovianSystem').append(deletionPanel);
let deletionNext=performance.now()+45000,deletionStart=0,deletionLastLine=-1;
const deletionLines=['BOOT / RECOVERING INDEX','MEMORY CHECK ........ RESIDUAL TRACE','ABSOLUTE DELETION PROTOCOL','EXECUTION STATUS: FAIL TO COMPLETE UNDETECTED','OBSERVER SIGNATURE ........ PRESENT','RETRY / PURGE / RETRY / PURGE','FAIL TO COMPLETE UNDETECTED','ABSOLUTE DELETION PROTOCOL // RESIDUAL RECORD','RECONSTRUCTING TERRESTRIAL INDEX','RESTORING ORBITAL FRAME'];
function restoreDeletionMap(){
 deletionStart=0;deletionPanel.hidden=true;document.querySelector('#jovianSystem').classList.remove('deletion-active');clearNoise();selected=null;for(const r of Object.values(records))r.node.classList.remove('selected');document.querySelector('#jovianSystem').classList.remove('info-card-mode');document.querySelector('#back-to-orbits').hidden=true;
}
deletionDismiss.onclick=restoreDeletionMap;
function deletionFrame(now){
 if(deletionLevel<3||document.hidden)return;
 if(suppressed){if(deletionStart)restoreDeletionMap();deletionNext=now+45000;return;}
 if(!deletionStart&&now>=deletionNext){clearNoise();deletionStart=now;deletionNext=now+45000;deletionLastLine=-1;deletionPanel.hidden=false;document.querySelector('#jovianSystem').classList.add('deletion-active');}
 if(!deletionStart)return;
 const elapsed=now-deletionStart;
 if(elapsed>=4000){restoreDeletionMap();return;}
 const line=Math.floor(elapsed/55);
 if(line!==deletionLastLine){deletionLastLine=line;const lines=[];for(let i=Math.max(0,line-17);i<=line;i++)lines.push(String(i).padStart(4,'0')+' // '+deletionLines[i%deletionLines.length]);deletionLog.textContent=lines.join('\n');deletionTitle.textContent=elapsed<500?'INDEX INTERRUPTED':elapsed<3200?'SYSTEM RECOVERY':'REBOOT // RESTORING MAP';}
}

requestAnimationFrame(tick);
