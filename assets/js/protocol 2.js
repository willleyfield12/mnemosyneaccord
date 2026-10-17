import {deckReviewRequest} from './deck-review.js?v=remote-specimens';
export const levels = ['Undetected','ORIENTATION','RESONANCE','CLEARANCE','SANCTUARY','ACCORD'];
export async function request(path,data){if(new URLSearchParams(location.search).get("review")==="deck5"&&["/api/state","/api/rooms","/api/action"].includes(path))return deckReviewRequest(path,data);const res=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const value=await res.json();if(!res.ok)throw new Error(value.error||'The channel is unavailable.');return value;}
export const readState=()=>request('/api/state');
export const action=(name,data={})=>request('/api/action',{action:name,...data});
export function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
export function status(message){const box=document.querySelector('#status');if(box)box.textContent=message;}
export function syncNav(s){document.querySelectorAll('[data-archive]').forEach(a=>{const allowed=s.active&&s.level>=2;a.setAttribute('aria-disabled',String(!allowed));if(allowed)a.href='/archive/';else a.removeAttribute('href');});const label=document.querySelector('#clearance');if(label)label.textContent=s.active?'LEVEL '+s.level+' // '+levels[s.level]:'OBSERVER UNDETECTED';}
export function transmissions(s,container){container.replaceChildren();for(const t of (s.transmissions||[])){const card=element('article',undefined,'record');card.append(element('h3',t.title),element('p',t.body));container.append(card);}}
