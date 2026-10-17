const video=document.querySelector('#arrival-video');
const poster=document.querySelector('#arrival-poster');
const status=document.querySelector('#arrival-status');
const play=document.querySelector('#play');
const sound=document.querySelector('#sound');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let departed=false,timer;
function depart(){if(departed)return;departed=true;clearTimeout(timer);video.pause();document.body.classList.add('departing');setTimeout(()=>location.replace('/station/'),reducedMotion.matches?0:650);}
function preview(seconds){video.hidden=true;poster.hidden=false;sound.hidden=true;play.hidden=true;document.querySelector('#preview-note').hidden=false;status.textContent='Docking bay in view. Daedalus archive connection pending.';if(reducedMotion.matches){status.textContent='Docking bay in view. Continue when ready.';return;}timer=setTimeout(depart,Math.max(1,seconds)*1000);}
function playbackFailed(){video.hidden=true;poster.hidden=false;sound.hidden=true;play.hidden=false;play.textContent='Retry docking sequence';status.textContent='Visual link interrupted. Retry playback or continue to the archive.';}
async function startVideo(){play.hidden=true;status.textContent='Daedalus approaching the docking collar.';try{await video.play();}catch{play.hidden=false;play.textContent='Play docking sequence';status.textContent='Visual link ready. Start playback or continue to the archive.';}}
document.querySelector('#skip').addEventListener('click',e=>{e.preventDefault();depart();});
play.addEventListener('click',()=>{video.hidden=false;poster.hidden=true;startVideo();});
sound.addEventListener('click',()=>{video.muted=!video.muted;sound.setAttribute('aria-pressed',String(!video.muted));sound.textContent=video.muted?'Enable sound':'Mute sound';});
video.addEventListener('ended',()=>{status.textContent='Docking complete. Opening the docking-bay datapad.';depart();});
video.addEventListener('error',playbackFailed);
video.addEventListener('playing',()=>{video.hidden=false;poster.hidden=true;sound.hidden=false;});
try{
 const response=await fetch('/assets/video/arrival.json');if(!response.ok)throw new Error('No visual configuration');const config=await response.json();
 if(config.poster){poster.src=config.poster;video.poster=config.poster;}
 if(!config.src){preview(config.previewDurationSeconds||8);}else{
  video.src=config.src;video.hidden=false;poster.hidden=true;
  if(reducedMotion.matches){play.hidden=false;status.textContent='Docking sequence ready. Play when ready, or continue to the archive.';}else await startVideo();
 }
}catch{preview(8);}
window.addEventListener('pagehide',()=>{clearTimeout(timer);video.pause();});
