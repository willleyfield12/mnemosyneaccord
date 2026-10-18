const video=document.querySelector('#arrival-video');
const poster=document.querySelector('#arrival-poster');
const status=document.querySelector('#arrival-status');
const play=document.querySelector('#play');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const bay=new Image();bay.src='/assets/images/rooms/primary-docking-port.png';
let departed=false,timer,configured=false;
function depart(){if(departed)return;departed=true;clearTimeout(timer);video.pause();try{sessionStorage.setItem('arg-docking-handoff','1')}catch{}document.body.classList.add('departing');setTimeout(()=>location.replace('/station/'),reducedMotion.matches?0:650);}
function preview(){video.hidden=true;poster.hidden=false;play.hidden=true;document.querySelector('#preview-note').hidden=false;status.textContent='Docking bay in view. Continue when ready.';}
function playbackFailed(){if(departed)return;video.hidden=true;poster.hidden=false;play.hidden=false;play.textContent='Retry docking sequence';status.textContent='Visual link interrupted. Retry playback or continue to the Docking Bay.';}
async function startVideo(){if(departed)return;play.hidden=true;status.textContent='Daedalus approaching the docking collar.';try{await video.play();}catch{if(departed)return;play.hidden=false;play.textContent='Play docking sequence';status.textContent='Visual link ready. Start playback or continue to the Docking Bay.';}}
document.querySelector('#skip').addEventListener('click',e=>{e.preventDefault();depart();});
play.addEventListener('click',()=>{if(!configured)return;if(!video.paused){video.pause();play.textContent='Resume docking sequence';}else startVideo()});
video.addEventListener('ended',()=>{status.textContent='Docking complete. Opening the docking-bay datapad.';depart();});
video.addEventListener('error',playbackFailed);
video.addEventListener('playing',()=>{if(departed){video.pause();return}video.hidden=false;poster.hidden=true;play.hidden=false;play.textContent='Pause docking sequence';});
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){video.pause();play.hidden=!configured;play.textContent='Play docking sequence';}});
try{
 const controller=new AbortController();timer=setTimeout(()=>controller.abort(),4000);
 const response=await fetch('/assets/video/arrival.json',{signal:controller.signal});clearTimeout(timer);if(!response.ok)throw new Error('No visual configuration');const config=await response.json();
 if(!departed){if(config.src){configured=true;video.src=config.src;if(reducedMotion.matches){play.hidden=false;status.textContent='Docking sequence ready. Play when ready, or continue to the Docking Bay.';}else await startVideo();}else preview();}
}catch{if(!departed)preview();}
window.addEventListener('pagehide',()=>{departed=true;clearTimeout(timer);video.pause();});
