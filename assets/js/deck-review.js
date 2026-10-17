import {reviewRooms} from './deck-review-rooms.js?v=progression-12';
const deck3=new URLSearchParams(location.search).get('review')==='deck3';
let state={active:true,level:deck3?3:2,scene:deck3?'d3_corridor':'d5_corridor',visited:deck3?[3,4,5,6,7,8]:[6,7,8,5],inventory:[],journal:[{title:deck3?'CLEARANCE // Access retained':'RESONANCE // Access retained',body:'Station transit authorised. Your current clearance and released archive records are retained.',items:[]},...(deck3?[{title:'CLEARANCE // Retained directive',body:'Explore Main Engineering and Solar Array Control. Eight Hall records are released.',items:[]}]:[])],stage:deck3?'clearance':'resonance',intro:true,transmissions:[{title:'ORIENTATION // Imprint retained',body:'Arrival detected at the Primary Docking Port. Initial station access authorised.'},{title:'RESONANCE // Archive release',body:'Decks 5 and 4 authorised. The first four Greater Hall records are available under Archive Access.'},...(deck3?[{title:'CLEARANCE // Deck 3 authorised',body:'Your clearance extends to Main Engineering and Solar Array Control. Eight Greater Hall records are now available under Archive Access. Consult the newly released records before choosing your next correspondences.'}]:[])]};
export async function deckReviewRequest(path,data){
 if(path==='/api/rooms')return structuredClone(reviewRooms);
 if(path==='/api/action'){
  if(data.action==='move'){
   const target=data.scene,deck=Number(target.split('_')[0].slice(1));if(deck<(deck3?3:4)||deck>8)throw new Error('This deck is outside your review clearance.');
   state.scene=target;if(!state.visited.includes(deck))state.visited.push(deck);
  }else if(data.action==='collect'){
   const item=reviewRooms[state.scene]?.items.find(i=>i.id===data.id);if(!item)throw new Error('Inspect an item in this room first.');if(!state.inventory.includes(item.id))state.inventory.push(item.id);
  }else if(data.action!=='intro')throw new Error('This author review is for exploring rooms and collecting evidence.');
 }
 return structuredClone(state);
}
