import {readState,element} from './protocol.js?v=progression-12';
const entries=document.querySelector('#aegis-mission-entries');
function render(state){
 entries.replaceChildren();
 const add=(title,body)=>{const card=element('article',undefined,'record');card.append(element('h3',title),element('p',body));entries.append(card);};
 if(!state.active){add('No observer record','The public mission archive remains available. AEGIS retains instructions here once your arrival is detected.');return;}
 add('ORIENTATION // Arrival detected','Decks 6, 7, and 8 are authorised. Begin at the Primary Docking Port.');
 if(state.intro){
 add('First offering // Retained correspondence',"Three traces survive where testimony fails: the sun concealed in a rind at the threshold; remembrance keeping vigil where sleepers pray; a pale bloom whose night watches the ice. Bring what each has surrendered, not merely what resembles it.");
 add('Deck 5 // Submission protocol','Present three correspondences at the sealed checkpoint, approached from the Deck 6 corridor. Selected specimens leave your manifest even if rejected; they can be recovered again. Your testimony remains.');
 }
 for(const entry of state.journal||[]){if(['Evidence accepted','Evidence rejected','RESONANCE granted'].includes(entry.title))add(entry.title,entry.title==='Evidence rejected'?'The offering lacks a stable correspondence. Similarity is not correspondence. Reconsider what was surrendered at the threshold, where sleepers pray, and beneath the gaze of the ice. Submitted specimens have returned to the recovery cycle.':entry.body);}
 if(state.stage==='puzzle')add('Elevation trial // Awaiting witness account','The offering has been accepted. Consult the Mission Timeline, then return to the checkpoint to reconstruct the sequence.');
 if(state.stage==='code')add('Clearance pending // Transmission issued','Your witness account is accepted. Retrieve the clearance transmission through Submit and enter its code at the checkpoint.');
 if(state.level>=3){add('CLEARANCE // Deck 3 directive','Main Engineering and Solar Array Control are authorised. Eight Greater Hall records are released under Archive Access.');for(const entry of state.journal||[])if(entry.title.startsWith('CLEARANCE'))add(entry.title,entry.body);}
 if(state.level===2)add('RESONANCE // Current directive','Decks 5 and 4 are authorised. Travel to each through adjacent stairwells before using its wormhole anchor. Four Greater Hall records await you under Archive Access.');
}
async function refresh(){try{render(await readState());}catch{entries.replaceChildren(element('p','The retained instruction channel is unavailable. Public mission records remain accessible.'));}}
refresh();window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
