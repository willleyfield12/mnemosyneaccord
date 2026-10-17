// Authoritative assessment definitions. Answers and worked hints stay in the Worker bundle.
const choice = (id,label) => ({id,label});
const field = (id,label,options) => ({id,label,options:options.map(([id,label])=>choice(id,label))});
const sequence = (events) => events.map((_,i)=>field('position'+i,'Position '+(i+1),events));
export const ASSESSMENTS = {
 1: {
  title:'The Interrupted Shift', name:'ORIENTATION', checkpoint:6, unlock:5,
  offering:['SPEC-ESS-01','SPEC-BOT-01','SPEC-MIN-01','SPEC-BOT-11'],
  task:'Restore the four events in the order supported by the recovered shift records. Choose each event once. Keep the records open while arranging your draft.',
  records:[['Door record D-17','The service door opened before the technician entered. The technician was the only arrival during this interval.'],['Service log S-04','The technician entered before restarting the terminal.'],['Crew message C-09','The message was transmitted from that terminal after its restart completed.']],
  fields:sequence([['door','Service door opens'],['arrival','Technician enters'],['restart','Terminal restarts'],['message','Crew message is sent']]),
  solution:{position0:'door',position1:'arrival',position2:'restart',position3:'message'},
  hints:['Compare D-17 with S-04; finish with C-09.','The door precedes arrival; arrival precedes the restart. A message from an unpowered terminal is impossible.','Service door opens → technician enters → terminal restarts → crew message is sent.'],
  result:'The shift reconstruction is retained. Deck 5 medical and laboratory compartments are authorised.'
 },
 2: {
  title:'The Divided Witness',name:'RESONANCE',checkpoint:5,unlock:4,
  offering:['SPEC-MIN-02','SPEC-ESS-03','SPEC-BOT-03','SPEC-BOT-04'],
  task:'Choose the reconstruction that supports both witness accounts, then identify the record that resolves the apparent discrepancy. All times are on the same station day.',
  records:[['Witness A','I entered the laboratory at 14:12 by its wall clock.'],['Witness B','I watched its only entrance continuously from 14:10 through 14:15 station time. Nobody entered during that interval.'],['Maintenance M-12','The laboratory wall clock was six minutes fast throughout this shift. The entrance camera uses station time.'],['Door record D-22','There was one entry at 14:06 station time and no entry between 14:10 and 14:15. No other entrance was open.']],
  fields:[field('account','Supported reconstruction',[['liar','Witness B must be lying.'],['after','The entry was at 14:18 station time.'],['offset','The entry was at 14:06 station time, before B began watching.'],['side','An unrecorded side entrance explains it.']]),field('record','Record establishing the clock correction',[['door','Door record D-22'],['maintenance','Maintenance M-12'],['a','Witness A'],['b','Witness B']])],
  solution:{account:'offset',record:'maintenance'},
  hints:['Read Maintenance M-12 before comparing the two accounts.','A clock that is fast displays a later time. Subtract six minutes from the wall-clock report.','14:12 minus six minutes is 14:06. Choose that reconstruction and Maintenance M-12.'],
  result:'Both accounts are retained with the clock correction. Deck 4 command compartments are authorised.'
 },
 3: {
  title:'The Broken Relay',name:'CLEARANCE',checkpoint:4,unlock:3,
  offering:['SPEC-BOT-05','SPEC-MIN-05','SPEC-ESS-01','SPEC-MIN-07'],
  task:'Build a route from S to T through the medical relay M. Use the displayed connections, avoid corrupted X, and never revisit a node. Every route meeting these rules is accepted. Select nodes in order; Undo and Clear change only your draft.',
  records:[['Practice network','Practice links: P–Q, Q–R. To reach R from P while visiting Q, the route is P → Q → R. P → R is invalid because that link is absent. This example is not your assessed network.'],['Assessed connections','Undirected links: S–A, S–B, A–M, A–C, B–M, B–X, M–C, M–D, C–T, D–T, X–T. No other links exist.'],['Relay status','S = source; T = archive destination; M = required medical relay; X = corrupted. A, B, C and D are healthy.']],
  network:{nodes:['S','A','B','M','C','D','X','T'],edges:[['S','A'],['S','B'],['A','M'],['A','C'],['B','M'],['B','X'],['M','C'],['M','D'],['C','T'],['D','T'],['X','T']]},
  hints:['A valid route must include M. The apparently short S–A–C–T route omits it.','Start S–A–M or S–B–M. From M, a healthy connection can take you toward T.','One valid route is S → A → M → D → T. Other routes satisfying every displayed rule also work.'],
  result:'The medical relay has restored the archive transmission. Deck 3 Engineering and Solar Array Control are authorised.'
 },
 4: {
  title:'The Erasure Order',name:'SANCTUARY',checkpoint:3,unlock:2,
  offering:['SPEC-ESS-08','SPEC-ESS-10','SPEC-ESS-04'],
  task:'Challenge the proposed deletion using an unsupported assumption, corroborating evidence and the applicable retention rule. Establish why review must continue; you do not need to prove innocence.',
  records:[['Deletion order E-31','The witness gave a time inconsistent with the archive clock. Therefore the account was fabricated and must be deleted.'],['Witness statement','I recall a medical transfer before the relay resumed. I cannot verify the clock I saw.'],['Door audit D-31','The archive clock correction for this interval remains under review. The door audit independently confirms a medical transfer.'],['Medical receipt R-31','A separately signed receipt confirms the medical transfer. It does not authenticate the witness’s stated time.'],['Retention policy RP-4','Retain inconsistent testimony with an uncertainty marker while review remains outstanding. Deletion requires independent evidence of fabrication; a discrepancy alone is insufficient.']],
  fields:[field('assumption','Unsupported assumption',[['fabrication','A timing discrepancy proves fabrication.'],['innocent','The witness has already been proved innocent.'],['transfer','No transfer could occur on this station.']]),field('evidence','Evidence supporting continued review',[['audit','Door audit D-31'],['receipt','Medical receipt R-31'],['order','Deletion order E-31 alone']]),field('rule','Applicable retention rule',[['delete','Delete every inconsistent account.'],['retain','RP-4: retain with uncertainty while review is outstanding.'],['acquit','Clear the witness of all wrongdoing.']])],
  solution:{assumption:'fabrication',evidence:['audit','receipt'],rule:'retain'},
  hints:['RP-4 distinguishes an unresolved discrepancy from independent proof of fabrication.','Either the independent transfer audit or signed receipt supports continued review. Neither proves the exact time or innocence.','Challenge “a timing discrepancy proves fabrication”; cite D-31 or R-31; apply RP-4 retention with uncertainty.'],
  result:'RESERVATION_NOT_ACQUITTAL. The witness account is preserved with an uncertainty marker. Deck 2 is authorised. Prologue entitlement recorded.'
 },
 5: {
  title:'The Missing Interval',name:'ACCORD',checkpoint:2,unlock:1,
  offering:['SPEC-MIN-09','SPEC-BOT-08','SPEC-ESS-09','SPEC-BOT-09','SPEC-MIN-08','SPEC-ESS-11'],
  task:'Reconstruct the five events in station-time order, then locate the erased copy operation. Correct the two local clocks using the calibration record. The route is one continuous transfer by one carrier; do not assume a second carrier or a hidden stop.',
  records:[['Transfer map TM-5','For this transfer, the only authorised route is Comms (Deck 4) ↔ Med-Bay (Deck 5) ↔ Systems (Deck 4) ↔ Engineering (Deck 3) ↔ Brig (Deck 2). Each displayed leg takes exactly five minutes. The carrier made no stops or detours. These are authorised transfer links, not instructions for present-day stairwell navigation.'],['Clock calibration CC-5','Med-Bay local time is four minutes fast; Engineering local time is four minutes slow. All other listed clocks use station time.'],['Surviving records SR-5','Receive packet: Comms, 19:00 station time. Stabilise packet: Med-Bay, 19:09 local time. Restore relay: Engineering, 19:11 local time. Seal retained record: Brig, 19:20 station time.'],['Missing record MR-5','The packet was copied exactly once at the intervening authorised station between stabilisation and relay restoration. The operation took no additional travel time. The restored copy preserves a collective witness declaration; the account must be retained even when its original carrier is gone.']],
  fields:[...sequence([['receive','Receive packet'],['stabilise','Stabilise packet'],['copy','Copy retained record'],['restore','Restore relay'],['seal','Seal retained record']]),field('room','Location of the erased copy operation',[['medbay','Med-Bay, Deck 5'],['systems','Systems, Deck 4'],['engineering','Engineering, Deck 3'],['comms','Comms, Deck 4']]),field('time','Station time of the erased copy operation',[['1906','19:06'],['1910','19:10'],['1914','19:14'],['1915','19:15']]),field('support','Records supporting the location and time',[['map-clock','TM-5 transfer map and CC-5 clock calibration, read with SR-5 and MR-5'],['wall','Uncorrected wall clocks alone'],['guess','The deletion order alone']])],
  solution:{position0:'receive',position1:'stabilise',position2:'copy',position3:'restore',position4:'seal',room:'systems',time:'1910',support:'map-clock'},
  hints:['Correct Med-Bay and Engineering to station time, then use the five-minute transfer legs.','The surviving times are 19:00, 19:05, 19:15 and 19:20. The continuous route leaves one intervening location and time.','Order: receive → stabilise → copy → restore → seal. The copy was at Systems, Deck 4, at 19:10. Cite TM-5 and CC-5 with SR-5 and MR-5.'],
  result:'The missing interval is restored. Deck 1 and the Witness Key terminal are authorised. No further offering is required.'
 },
 6: {
  title:'The Witness Key',name:'WITNESS',checkpoint:1,unlock:1,offering:[],
  task:'Read the four-glyph declaration ⊙ ∥ ◇ ∞ using the restored context and the paired examples. Enter the four English words in order. Spaces, underscores and letter case do not affect the reading. No further offering is required.',
  records:[['Restored context','The speaker is the collective, rather than a single individual. Its action is to bear witness. The object is whatever persists after its original carrier is gone.'],['Paired examples K-1','○ ∥ = I witness. ⊙ ∥ = We witness. Changing only the first glyph changes only the speaker.'],['Paired examples K-2','◇ ≈ = What changes. ◇ ∞ = What endures. Changing only the second glyph changes only the predicate.'],['Inscription K-3','⊙ ∥ ◇ ∞. Read left to right. Each glyph represents one word using the same mapping as the examples.']],
  fields:[{id:'declaration',label:'Your four-word declaration',type:'text'}],
  solution:{declaration:'WE WITNESS WHAT ENDURES'},
  hints:['Compare pairs that differ by one glyph; retain the same word for every unchanged glyph.','K-1 establishes the collective speaker and action. K-2 establishes the object and its persistence.','⊙ = WE; ∥ = WITNESS; ◇ = WHAT; ∞ = ENDURES. Enter WE WITNESS WHAT ENDURES.'],
  result:'The declaration is retained. Vault Theta descent is authorised. Completion and Chapter 1 teaser entitlement are recorded.'
 }
};
export const minimumDeck = level => ({1:6,2:5,3:4,4:3,5:2,6:1,7:1})[level] ?? 6;
export function validatePuzzle(def, answer) {
 if (!answer || typeof answer!=='object' || Array.isArray(answer)) return 'Enter your reconstruction before submitting.';
 if(def.network){
  const route=answer.route;
  if(!Array.isArray(route)||route.length<2||route.some(n=>!def.network.nodes.includes(n)))return 'Choose a route using the displayed nodes.';
  if(route[0]!=='S'||route.at(-1)!=='T')return 'The route must begin at S and finish at T.';
  if(route.includes('X'))return 'X is corrupted. Choose a healthy route.';
  if(new Set(route).size!==route.length)return 'Do not revisit a node.';
  if(!route.includes('M'))return 'The route must pass through medical relay M.';
  for(let i=1;i<route.length;i++)if(!def.network.edges.some(([a,b])=>(a===route[i-1]&&b===route[i])||(b===route[i-1]&&a===route[i])))return 'There is no displayed connection from '+route[i-1]+' to '+route[i]+'.';
  return null;
 }
 for(const [key,value] of Object.entries(def.solution)){
  if(key==='declaration'){
   if(typeof answer[key]!=='string'||answer[key].trim().replace(/[_\s]+/g,' ').toUpperCase()!==value)return 'The declaration does not match the paired glyph examples. Check each unchanged glyph against its unchanged word.';
  }else if(!(Array.isArray(value)?value.includes(answer[key]):answer[key]===value)){
   if(def.title==='The Interrupted Shift')return 'The order conflicts with a before/after relationship in D-17, S-04 or C-09. Your draft is retained.';
   if(def.title==='The Divided Witness')return 'Account for the fast wall clock and cite the record that establishes its offset.';
   if(def.title==='The Erasure Order')return 'Your challenge must identify the unsupported fabrication assumption, independent corroboration and RP-4 retention rule.';
   return 'Check the corrected times, the five-minute transfer legs and the intervening Systems operation. Your draft is retained.';
  }
 }
 return null;
}
export function publicAssessment(s,rooms){
 const def=ASSESSMENTS[s.level];if(!def)return null;
 const items=Object.entries(rooms).flatMap(([room,r])=>r.items.map(i=>({...i,room,roomName:r.name,deck:r.deck})));
 return {title:def.title,name:def.name,checkpoint:def.checkpoint,unlock:def.unlock,task:def.task,records:def.records,fields:def.fields,network:def.network,
  offering:def.offering.map(specimenId=>{
   const copies=items.filter(i=>i.specimenId===specimenId && i.deck>=minimumDeck(s.level));
   return {specimenId,name:copies[0]?.name||specimenId,locations:copies.map(i=>'Deck '+i.deck+' — '+i.roomName),ids:copies.map(i=>i.id)};
  }),hintCount:s.hints?.[s.level]||0,hintText:s.hintTexts?.[s.level]||null};
}
