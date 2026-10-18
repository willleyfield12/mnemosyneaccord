import {Soundscape} from './soundscape-engine.js?v=deck-sound-1';
// Embedded records share their parent station's soundscape.
if(window.self===window.top) install();
function install(){
 const slot=document.querySelector('[data-scene-audio]');if(!slot)return;
 slot.classList.add('scene-audio');slot.setAttribute('aria-label','Background sound');
 slot.innerHTML='<button type="button" class="scene-sound-toggle" aria-label="Turn background sound on" aria-pressed="false"><span aria-hidden="true">◌</span> Sound: off</button><label class="scene-volume">Level <input type="range" aria-label="Background sound level" min="0" max="100" value="18"></label><span class="scene-sound-status" role="status"></span>';
 const button=slot.querySelector('button'),range=slot.querySelector('input'),status=slot.querySelector('[role=status]');let engine,enabled=false,busy=false,wanted=true,scene='d6_docking',hiddenPause=false;
 try{wanted=localStorage.getItem('arg-scene-sound')!=='off';const saved=localStorage.getItem('arg-audio-volume');if(saved!==null)range.value=saved}catch{}
 function save(key,value){try{localStorage.setItem(key,value)}catch{}}
 function paint(){button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Mute background sound':'Turn background sound on');button.innerHTML='<span aria-hidden="true">'+(enabled?'◉':'◌')+'</span> Sound: '+(enabled?'on':'off')}
 async function start(){if(busy||enabled||document.hidden)return;busy=true;try{if(!engine){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();engine=new Soundscape(new Audio());engine.setScene(scene)}engine.setVolume(Number(range.value)/100);enabled=await engine.start();status.textContent=enabled?'':'Select Sound to start audio.';}catch(error){console.warn('Scene audio could not start:',error);status.textContent='Sound unavailable.'}finally{busy=false;paint()}}
 async function stop(){wanted=false;hiddenPause=false;save('arg-scene-sound','off');enabled=false;paint();if(engine)await engine.pause()}
 button.addEventListener('click',()=>{if(busy)return;if(enabled){stop();return}wanted=true;save('arg-scene-sound','on');start()});
 range.addEventListener('input',()=>{save('arg-audio-volume',range.value);engine?.setVolume(Number(range.value)/100)});
 // Use the visitor's ordinary navigation gesture; no separate enable overlay.
 const gesture=e=>{if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;if(e.target.closest?.('.scene-audio')||document.querySelector('#boot:not([hidden])'))return;if(wanted&&!enabled)start()};
 document.addEventListener('click',gesture);document.addEventListener('keydown',gesture);
 const room=document.querySelector('#room-title'),deck=document.querySelector('#deck-title');
 function locationChanged(){if(room&&deck){const text=room.textContent.toLowerCase();const number=/\d+/.exec(deck.textContent)?.[0]||6;const words=text.replace(/[^a-z0-9]+/g,'_');scene='d'+number+'_'+words;engine?.setScene(scene)}}
 if(room){const observer=new MutationObserver(locationChanged);observer.observe(room,{childList:true,subtree:true});locationChanged()}
 // Exact scene IDs avoid relying on labels when the game renders a new room.
 document.addEventListener('station-scene',e=>{scene=e.detail.scene;engine?.setScene(scene)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenPause=enabled;enabled=false;engine?.pause();paint()}else if(hiddenPause&&wanted){hiddenPause=false;start()}});
 window.addEventListener('pagehide',event=>{enabled=false;paint();if(event.persisted){engine?.pause();return}document.removeEventListener('click',gesture);document.removeEventListener('keydown',gesture);engine?.dispose()});
 paint();
}
