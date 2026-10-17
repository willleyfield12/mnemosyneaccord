import {readState,syncNav,element} from './protocol.js?v=progression-12';
const state=await readState();syncNav(state);
const review=['deck5','deck3'].includes(new URLSearchParams(location.search).get('review'));
const halls=[["Waking Dreams", "hallofwakingdreams.png", 1, 0], ["Divided Mirror", "hallofthedividedmirror.png", 2, 0], ["Answering World", "halloftheansweringworld.png", 3, 0], ["Returning Voice", "hallofreturningvoice.png", 5, 0], ["Living Axis", "hallofthelivingaxis.png", 4, 2], ["Open Mind", "hallofopenmind.png", 6, 2], ["Shared Heart", "hallofsharedheart.png", 7, 3], ["Living Scripture", "halloflivingscripture.png", 8, 3],["Unbroken Seed", "hallofunbrokenseed.png", 9, 4],["Second Form", "hallofsecondform.png", 11, 4],["Remembered Hours", "hallofrememberedhours.png", 10, 5],["Enduring Self", "hallofenduringself.png", 12, 5]];
const list=document.querySelector('#hall-list'),detail=document.querySelector('#hall-detail');
const accessLevel=state.active?state.level:0;
document.querySelector('.preview-note').textContent='AEGIS has released these Hall records for study. Further records will become available as your investigation progresses.';
let trigger;
for(const [index,[name,file,number,required]] of halls.entries()){
 const unlocked=accessLevel>=required;
 const entry=element(unlocked?'button':'div',undefined,'hall-thumbnail-row'+(unlocked?'':' hall-record-locked'));
 if(unlocked)entry.type='button';else entry.setAttribute('aria-disabled','true');
 const image=element('img');image.src='/assets/images/halls/'+file;image.alt='Hall of '+name;
 const title=element('span');title.append(element('strong','Hall of '+name),element('small',unlocked?'Study record available':'SEALED — awaiting AEGIS authorisation'));
 entry.append(image,title);if(unlocked)entry.onclick=()=>openHall(index,entry);list.append(entry);
}
async function openHall(index,source){
 trigger=source;const [name,file]=halls[index];document.querySelector('#hall-detail-title').textContent='Hall of '+name;const image=document.querySelector('#hall-detail-image');image.src='/assets/images/halls/'+file;image.alt='Hall of '+name;
 const card=document.querySelector('#hall-fact-card');card.replaceChildren(element('p','Retrieving study record…'));
 document.querySelector('#archive-overview').hidden=true;detail.hidden=false;document.querySelector('#hall-back').focus();window.scrollTo(0,0);
 try{const response=await fetch((review?'/review/archive/':'/archive/')+'hall-'+halls[index][2]+'.html'+(review?'?review='+new URLSearchParams(location.search).get('review'):''));if(!response.ok)throw new Error();const doc=new DOMParser().parseFromString(await response.text(),'text/html');const panel=doc.querySelector('main .panel');if(!panel)throw new Error();card.replaceChildren();for(const node of panel.children){if(node.tagName==='A')continue;card.append(document.importNode(node,true));}}catch{card.replaceChildren(element('p','The study record could not be retrieved. Return to Archive Access and try again.'));}
}
document.querySelector('#hall-back').onclick=()=>{detail.hidden=true;document.querySelector('#archive-overview').hidden=false;trigger?.focus();};
