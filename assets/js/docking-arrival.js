/* Arrival choreography is independent of archive/session requests. */
(()=>{
 'use strict';
 const body=document.body, image=document.querySelector('.dock-image');
 const pad=document.querySelector('.datapad'), boot=document.querySelector('#pad-boot');
 const menu=document.querySelector('#pad-menu'), skip=document.querySelector('#skip-arrival');
 const status=document.querySelector('#arrival-status'), enter=document.querySelector('#enter-station');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const padParts=[...document.querySelectorAll('#pad-menu > :not(.pad-records), .pad-records a, .pad-utilities, .pad-footnote')];
 const textParts=[...document.querySelectorAll('.dock-label > *, .dock-entry > :not(button):not(#status)')];
 const gated=[pad,enter];let finished=false, cancelled=false, pulseEpoch=0;
 const pulsing=new Set();
 let resolveWait;const wait=ms=>new Promise(resolve=>{resolveWait=resolve;setTimeout(resolve,ms)});
 function gate(el,value){el.inert=value;if(value)el.setAttribute('data-arrival-gated','');else el.removeAttribute('data-arrival-gated')}
 function reveal(el){el.classList.add('arrival-visible')}
 function pulse(elements){
  const epoch=pulseEpoch||(pulseEpoch=document.timeline.currentTime);
  elements.forEach(el=>{
   if(reduced.matches||pulsing.has(el)||el.matches('[aria-disabled="true"], :disabled'))return;
   pulsing.add(el);
   const animation=el.animate([
    {boxShadow:'0 0 4px 0 rgba(140,219,221,.12), inset 0 0 0 rgba(140,219,221,0)',borderColor:'rgba(140,219,221,.35)'},
    {boxShadow:'0 0 13px 1px rgba(140,219,221,.38), 0 0 25px 2px rgba(140,219,221,.15), inset 0 0 8px rgba(140,219,221,.07)',borderColor:'rgba(174,237,237,.95)'},
    {boxShadow:'0 0 4px 0 rgba(140,219,221,.12), inset 0 0 0 rgba(140,219,221,0)',borderColor:'rgba(140,219,221,.35)'}
   ],{duration:2800,iterations:Infinity,easing:'ease-in-out'});
   animation.startTime=epoch;
  });
 }
 function finish(){
  if(finished)return;finished=true;clearTimeout(window.dockArrivalFallback);
  body.classList.remove('arrival-loading');body.classList.add('arrival-complete');
  boot.hidden=true;menu.hidden=false;skip.hidden=true;gated.forEach(el=>gate(el,false));
  [...padParts,...textParts,pad,enter,image,document.querySelector('#status')].forEach(reveal);
  pulse([...document.querySelectorAll('.pad-records a[href]'),enter]);status.textContent='Arrival complete. Datapad functions and Enter Kepler III are available.';
 }
 function skipSequence(){cancelled=true;if(resolveWait)resolveWait();finish()}
 skip.hidden=false;skip.addEventListener('click',()=>{skipSequence();enter.focus({preventScroll:true})});
 gated.forEach(el=>gate(el,true));menu.hidden=true;document.querySelector('#status').classList.add('arrival-step');
 [...padParts,...textParts].forEach(el=>el.classList.add('arrival-step'));
 async function run(){
  if(reduced.matches){finish();return}
  // Wait for a decoded backdrop, but never strand the interface on a missing asset.
  await Promise.race([image.decode?image.decode().catch(()=>{}):Promise.resolve(),wait(2000)]);
  if(cancelled)return;body.classList.add('arrival-background');reveal(image);
  await wait(1300);if(cancelled)return;
  reveal(pad);boot.hidden=false;status.textContent='Daedalus Memory Archive is starting.';
  const lines=['> MEMORY OS / COLD START','> Checking archive integrity… OK','> Mounting mission records… OK','> Loading crew manifest… OK','> Establishing Jovian uplink… OK','> AEGIS clearance interface… READY'];
  for(let i=0;i<lines.length;i++){
   document.querySelector('#pad-boot-lines').textContent=lines.slice(0,i+1).join('\n');
   // Deliberate read time, archive-loading hold, then a final ready-screen hold.
   const delay=i===lines.length-1?2500:i===2?2800:i===0?900:650;
   await wait(delay);if(cancelled)return;
  }
  boot.hidden=true;menu.hidden=false;
  for(const el of padParts){reveal(el);await wait(110);if(cancelled)return}
  gate(pad,false);pulse([...document.querySelectorAll('.pad-records a[href]')]);
  status.textContent='Datapad online. Loading primary docking station briefing.';
  await wait(350);if(cancelled)return;
  for(const el of textParts){reveal(el);await wait(el.tagName==='H1'?450:260);if(cancelled)return}
  await wait(400);if(!cancelled)finish();
 }
 reduced.addEventListener('change',()=>{if(reduced.matches)skipSequence()});
 // Allow the paced boot to finish before the page's emergency timeout intervenes.
 clearTimeout(window.dockArrivalFallback);
 window.dockArrivalFallback=setTimeout(finish,30000);
 // Any animation API failure restores the complete, usable page.
 run().catch(finish);
})();
