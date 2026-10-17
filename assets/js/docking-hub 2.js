import {readState,request,syncNav} from './protocol.js';
const enter=document.querySelector('#enter-station');
const detection=document.querySelector('#detection');
let observer;
function render(state){observer=state;syncNav(state);document.querySelector('#entry-note').textContent=state.active?'Your imprint is retained. Your clearance and discoveries travel with you.':'AEGIS will request a transmission address before admitting you.';document.querySelector('#entry-copy').textContent=state.active?'Proceed aboard, or review the datapad before continuing your investigation.':'Enter the station, or consult the datapad before you present yourself.';}
readState().then(render).catch(()=>{document.querySelector('#status').textContent='AEGIS connection unavailable. Research records remain accessible.';});
enter.addEventListener('click',async()=>{enter.disabled=true;try{render(await readState());if(observer.active){location.href='/kepler-iii/';return;}detection.showModal();}catch(e){document.querySelector('#status').textContent=e.message;}finally{enter.disabled=false;}});
document.querySelector('#research-first').addEventListener('click',()=>detection.close());
document.querySelector('#dock-registration').addEventListener('submit',async e=>{e.preventDefault();e.submitter.disabled=true;document.querySelector('#detection-status').textContent='';try{render(await request('/api/register',{email:document.querySelector('#dock-email').value,consent:document.querySelector('#dock-consent').checked}));location.href='/kepler-iii/';}catch(err){document.querySelector('#detection-status').textContent=err.message;}finally{e.submitter.disabled=false;}});
window.addEventListener('pageshow',e=>{if(e.persisted)readState().then(render).catch(()=>{});});

const pad=document.querySelector('.datapad');
const menu=document.querySelector('#pad-menu');
const record=document.querySelector('#terminal-record');
const frame=document.querySelector('#terminal-frame');
let recordIndex='/crew/';
let recordTrigger;
function closeRecord(){
 document.body.classList.remove('terminal-expanded');
 menu.hidden=false;record.hidden=true;
 if(recordTrigger)recordTrigger.focus();
}
document.querySelectorAll('.pad-records a').forEach(link=>link.addEventListener('click',e=>{
 e.preventDefault();recordTrigger=link;recordIndex=link.getAttribute('href');
 document.querySelector('#terminal-title').textContent=recordIndex==='/crew/'?'Crew manifest':link.querySelector('strong').textContent;
 menu.hidden=true;record.hidden=false;document.body.classList.add('terminal-expanded');
 frame.src=recordIndex;document.querySelector('#terminal-close').focus();
 pad.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}));
document.querySelector('#terminal-close').addEventListener('click',closeRecord);
document.querySelector('#terminal-index').addEventListener('click',()=>{frame.src=recordIndex;});
frame.addEventListener('load',()=>{
 const doc=frame.contentDocument;if(!doc)return;
 const style=doc.createElement('style');
 style.textContent='.site-nav,.site-footer{display:none!important}body{background:#07171d!important}.site-shell{width:100%!important;max-width:none!important;margin:0!important;padding:24px!important}.wrapper{min-height:0!important}';
 doc.head.append(style);
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')closeRecord();});
 doc.addEventListener('click',e=>{
  const link=e.target.closest('a[href]');if(!link)return;
  const url=new URL(link.href);
  if(url.origin!==location.origin)return;
  if(url.pathname==='/station/'){e.preventDefault();closeRecord();}
  else if(!/^\/(crew|mission|jovian-system)\//.test(url.pathname)){e.preventDefault();location.href=url.href;}
 });
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!record.hidden)closeRecord();});
