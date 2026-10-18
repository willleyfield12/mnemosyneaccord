// Checkpoint presentation only; the Cloudflare service validates every grant.
export function createCheckpoints({getState,change,show,button,element,close,request,navigate=path=>window.location.assign(path)}) {
 const draftKey=()=> 'aegis-draft-v2-'+(getState().runId||'retained')+'-'+getState().level;
 const readDraft=()=>{try{return JSON.parse(sessionStorage.getItem(draftKey())||'{}')}catch{return {}}};
 const saveDraft=answer=>{try{sessionStorage.setItem(draftKey(),JSON.stringify(answer))}catch{}};
 function records(def,container) {
  const evidence=element('section',undefined,'checkpoint-records');evidence.setAttribute('aria-label','Recovered assessment records');
  evidence.append(element('h3','Recovered records'));
  for(const [title,text] of def.records){const article=element('article',undefined,'record');article.append(element('h4',title),element('p',text));evidence.append(article);}
  container.append(evidence);
 }
 function shuffled(options){const arr=[...options];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
 async function rewards(){
  if(getState().stage==='complete'){navigate('/vault-theta/');return;}
  const content=element('div');content.append(element('p','Retrieving retained entitlements…'));show(getState().stage==='complete'?'Vault Theta // Descent and rewards':'Daedalus // Retained story rewards',content,[button('Return to station',close)]);
  try {
   const result=await request('/api/rewards');content.replaceChildren();
   if(result.completion){content.append(element('p',result.completion.recognition+' · completed '+new Date(result.completion.completedAt).toLocaleString()),element('p','Finishing-order prizes: '+result.completion.finishOrderStatus+'. Replaying the descent does not record another finish.'));}
   for(const [key,label] of [['prologue','Prologue'],['teaser','Chapter 1 teaser']])if(result[key]){
    if(result[key].url){const a=element('a','Open '+label,'button');a.href=result[key].url;a.target='_blank';a.rel='noopener';content.append(a);}
    else content.append(element('p',label+' entitlement retained. The file has not yet been attached to this terminal.'));
   }
   if(result.descent?.url){const video=element('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=result.descent.url;video.setAttribute('aria-label','Drop-pod descent to Vault Theta');content.append(video);content.append(button('Begin descent',async()=>{try{await video.play()}catch{content.append(element('p','Playback did not start. Use the video controls or open the descent file.'));}}));const link=element('a','Open descent file','button');link.href=result.descent.url;link.target='_blank';link.rel='noopener';content.append(link);}
   else if(result.descent) content.append(element('p','Vault Theta descent authorised. The descent video has not yet been attached to this terminal. Your completion is recorded.'));
  }catch(error){content.replaceChildren(element('p',error.message,'error'));}
 }
 let approaching=false;
 async function approachWitnessKey(){
  if(approaching)return;
  const state=getState();
  if(state.level!==6||state.stage==='complete'||state.assessment?.checkpoint!==1)return;
  approaching=true;
  try{
   // Use the normal movement endpoint: each stairwell step retains server clearance checks.
   let current=getState();
   if(!current.scene.endsWith('_corridor')){
    const deck=Number(/^d(\d+)_/.exec(current.scene)?.[1]);
    if(!deck||!await change('move',{scene:'d'+deck+'_corridor'}))return;
   }
   while(getState().scene!=='d1_corridor'){
    const deck=Number(/^d(\d+)_/.exec(getState().scene)?.[1]);
    if(!deck||deck<=1||!await change('move',{scene:'d'+(deck-1)+'_corridor'}))return;
   }
   open();
  }finally{approaching=false;}
 }
 const witnessRoute=()=>button('Proceed to Deck 1 — Witness Key',approachWitnessKey);
 function protocol(){
  const state=getState(),def=state.assessment;
  if(!def){rewards();return;}
  const content=element('div');content.append(element('p',def.task));
  if(def.offering.length){content.append(element('p','Authenticate '+def.offering.length+' distinct specimens. Evidence is retained for later use; copies share an identity and cannot replace a different specimen.'));const list=element('ul');for(const item of def.offering){const entry=element('li');entry.append(element('strong',item.name),element('p',item.locations.join('; ')));list.append(entry);}content.append(list);}
  else content.append(element('p','No further offering or AEGIS protocol is required. Proceed to the Witness Key terminal.'));
  content.append(element('p','Terminal location: Deck '+def.checkpoint+' corridor.'));
  const controls=[button('Return to exploration',close)];
  if(state.level===6)controls.unshift(witnessRoute());
  if(state.level<6)controls.unshift(button('Retain protocol',async()=>{if(await change('retain_protocol')){close();document.querySelector('#journal-entries').open=true;document.querySelector('#journal-entries').scrollIntoView({block:'nearest'});}}));
  show(def.title+' // Current investigation',content,controls);
 }
 function open(){
  const state=getState(),def=state.assessment;
  if(state.stage==='complete'){rewards();return;}
  if(!def)return;
  if(state.scene!=='d'+def.checkpoint+'_corridor'){show('AEGIS // Terminal location','Approach the terminal in the Deck '+def.checkpoint+' corridor to submit evidence or a reconstruction.',[...(state.level===6?[witnessRoute()]:[]),button('Consult current directive',protocol),button('Return to exploration',close)]);return;}
  const content=element('div');content.className='checkpoint-terminal';
  if(state.stage==='hunt'){
   content.append(element('p','Select one copy of each requested specimen below. Your manifest and authenticated evidence are preserved on every attempt.'));
   const form=element('form');const selected=new Set();
   for(const item of def.offering){const label=element('label',undefined,'offering-choice'),select=element('select');select.required=true;select.setAttribute('aria-label','Select '+item.name);select.append(new Option('Choose '+item.name,''));
    const held=item.ids.filter(id=>state.inventory.includes(id));
    for(const id of held)select.append(new Option(item.name+' · '+item.locations[item.ids.indexOf(id)],id));
    label.append(element('strong',item.name),element('p',item.locations.join('; ')),select);
    if(!held.length)label.append(element('p','Not yet in your manifest. Recover it from one of the rooms listed above.','muted'));
    form.append(label);selected.add(select);
   }
   const err=element('p','','error');err.setAttribute('role','status');
   const submit=element('button','Authenticate selected evidence');submit.type='submit';
   form.append(err,submit);form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{if(await change('submit',{ids:[...selected].map(select=>select.value)}))open();}finally{submit.disabled=false;}};
   content.append(form);show(def.title+' // Evidence authentication',content,[button('Return to exploration',close)]);return;
  }
  content.append(element('p',def.task));records(def,content);
  const form=element('form'),answer=readDraft();form.className='checkpoint-answer';
  if(def.network){
   const route=Array.isArray(answer.route)?answer.route:[];answer.route=route;
   const output=element('p');output.setAttribute('aria-live','polite');
   const nodes=element('div',undefined,'actions');
   const paint=()=>{output.textContent='Draft route: '+(route.join(' → ')||'No nodes selected.');saveDraft(answer);};
   for(const node of def.network.nodes)nodes.append(button(node+(node==='M'?' · medical':node==='X'?' · corrupted':''),()=>{route.push(node);paint();}));
   form.append(output,nodes,button('Undo last node',()=>{route.pop();paint();}),button('Clear draft route',()=>{route.length=0;paint();}));paint();
  } else for(const field of def.fields){
   const label=element('label',field.label);let input;
   if(field.type==='text'){input=element('input');input.type='text';input.maxLength=120;input.autocomplete='off';input.spellcheck=false;}
   else{input=element('select');input.append(new Option('Choose an answer',''));for(const option of shuffled(field.options))input.append(new Option(option.label,option.id));}
   input.name=field.id;input.setAttribute('aria-label',field.label);input.required=true;input.value=answer[field.id]||'';input.oninput=()=>{answer[field.id]=input.value;saveDraft(answer);};label.append(input);form.append(label);
  }
  const error=element('p','','error');error.setAttribute('role','status');const submit=element('button','Submit reconstruction');submit.type='submit';
  form.append(error,submit);form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;const oldKey=draftKey();try{if(await change('puzzle',{answer})){try{sessionStorage.removeItem(oldKey)}catch{}const updated=getState();if(updated.stage==='complete'){navigate('/vault-theta/?descent=1');return;}show('AEGIS // Access authorised',updated.transmissions.at(-1).body,[updated.level===6?witnessRoute():button('Consult next investigation',protocol),button('Return to exploration',close)]);}}finally{submit.disabled=false;}};
  content.append(form);
  const hints=element('section',undefined,'checkpoint-hints');hints.append(element('h3','Optional assistance'),element('p','Hints 1 and 2 preserve Unassisted Witness recognition. Revealing the worked solution marks this run as assisted; all story rewards remain available.'));
  const hintText=element('div');for(const [i,text] of (def.hintText||[]).entries())hintText.append(element('p','Hint '+(i+1)+': '+text));hints.append(hintText);
  for(let number=1;number<=3;number++)hints.append(button(number===3?'Reveal worked solution — marks this run assisted':'Reveal hint '+number,async()=>{
   if(await change('hint',{number})){hintText.replaceChildren();for(const [i,text] of (getState().assessment.hintText||[]).entries())hintText.append(element('p','Hint '+(i+1)+': '+text));}
  }));content.append(hints);
  show(def.title+' // Reconstruction',content,[button('Save draft and return',()=>{saveDraft(answer);close();})]);
 }
 return {open,protocol,rewards};
}
