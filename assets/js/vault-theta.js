clearTimeout(window.vaultLoadFallback);document.documentElement.classList.remove('descent-loading');
const $=selector=>document.querySelector(selector);
const video=$('#descent-video'),overlay=$('#descent'),final=$('#vault-final'),status=$('#vault-status');
const play=$('#descent-play'),sound=$('#video-sound'),replay=$('#replay-descent');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let journey=0,arrived=true,exitTimer;
function showVault(message='Vault Theta destinations are ready.',focus=true){
 if(arrived&&overlay.hidden)return;
 arrived=true;journey++;clearTimeout(exitTimer);final.inert=false;overlay.classList.add('departing');
 status.textContent=message;
 const finish=()=>{video.pause();overlay.hidden=true;overlay.classList.remove('departing');if(focus)$('#vault-title').focus({preventScroll:true})};
 if(reduced.matches)finish();else exitTimer=setTimeout(finish,850);
}
async function startDescent(){
 const current=++journey;arrived=false;clearTimeout(exitTimer);overlay.classList.remove('departing');overlay.hidden=false;final.inert=true;play.hidden=true;video.currentTime=0;video.muted=true;sound.setAttribute('aria-pressed','false');sound.textContent='Video sound: off';status.textContent='Drop-pod sequence. Destination: Vault Theta.';$('#skip-descent').focus({preventScroll:true});
 try{await video.play();if(current!==journey){video.pause();return}play.hidden=false;play.textContent='Pause descent'}catch{if(current!==journey)return;play.hidden=false;play.textContent='Play descent';status.textContent='The drop-pod sequence is ready. Play it or continue to Vault Theta.'}
}
play.addEventListener('click',async()=>{if(arrived)return;if(!video.paused){video.pause();return}try{await video.play()}catch{status.textContent='Playback could not start. You can continue to Vault Theta.'}});
sound.addEventListener('click',()=>{video.muted=!video.muted;sound.setAttribute('aria-pressed',String(!video.muted));sound.textContent='Video sound: '+(video.muted?'off':'on')});
video.addEventListener('playing',()=>{if(arrived){video.pause();return}play.hidden=false;play.textContent='Pause descent'});
video.addEventListener('pause',()=>{play.hidden=false;play.textContent='Resume descent'});
video.addEventListener('timeupdate',()=>{if(!arrived&&video.currentTime>=17.45)showVault('Arrived at Vault Theta. Datapad destinations are ready.')});
video.addEventListener('ended',()=>{if(!arrived)showVault('Arrived at Vault Theta. Datapad destinations are ready.')});
video.addEventListener('error',()=>{if(!arrived)showVault('The descent video is unavailable. Vault Theta destinations are ready.')});
$('#skip-descent').addEventListener('click',()=>showVault());replay.addEventListener('click',startDescent);
reduced.addEventListener('change',()=>{if(reduced.matches&&!arrived)showVault('Motion reduced. Vault Theta destinations are ready. You may replay the descent if you choose.')});
const dialog=$('#vault-destination');
const destinations={
 signed:['Order signed Book 1','The first verified finisher can order the signed edition of Book 1 here. Ordering will be available once finishing order and fulfilment are confirmed.'],
 prologue:['Access the PROLOGUE','The first ten verified finishers can access the PROLOGUE here. Access will be available once finishing order is confirmed and the record is released.'],
 teaser:['Chapter 1 teaser','Later arrivals can open the Chapter 1 teaser here once the record is released.'],
 fame:['Hall of Fame — Top Ten','The first ten verified finishers will be recorded on this board. No places have been published yet.'],
 forget:['FORGET — unsubscribe','Unsubscribe requests will be available here once the mailing-list service is connected. No unsubscribe request has been sent, and your station record has not been changed.'],
 remember:['REMEMBER — book review','Leave a review of Book 1 here once the review destination is available.']
};
document.querySelectorAll('[data-destination]').forEach(button=>button.addEventListener('click',()=>{const [title,copy]=destinations[button.dataset.destination];$('#destination-title').textContent=title;$('#destination-copy').textContent=copy;dialog.showModal()}));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!arrived)video.pause()});
window.addEventListener('pagehide',()=>{journey++;clearTimeout(exitTimer);video.pause()});
if(new URLSearchParams(location.search).get('descent')==='1'){
 if(reduced.matches)status.textContent='Motion reduced. Vault Theta destinations are ready. You may play the drop-pod sequence if you choose.';
 else startDescent();
}
