// API progression and save migration are exercised by test-complete-progression.mjs.
// These checks cover the journal/HTML contract and optional welcome separately.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {partitionJournal} from '../assets/js/station-journal.js';
const html=await readFile(new URL('../kepler-iii/index.html',import.meta.url),'utf8');
const js=await readFile(new URL('../assets/js/walkthrough.js',import.meta.url),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const refs=new Set([...js.matchAll(/\$\('#([\w-]+)'\)/g)].map(m=>m[1]));
assert.deepEqual([...refs].filter(id=>!ids.has(id)),['aegis-error']);
assert(js.includes('navigationBriefed=true;offerNavigationTour();'));assert(!js.includes('navigationBriefed=true;navigationBriefing();'));
assert(html.includes('TAKE THE TOUR'));assert(html.includes('EXPLORE ON MY OWN'));
assert(html.includes('checkpoint-access'));assert(html.includes('station-checkpoints.css?v=progression-12'));
const journal=[{level:1,title:'Old investigation'},{level:6,title:'Final puzzle'},{level:7,title:'Descent'}];
const copy=structuredClone(journal);let grouped=partitionJournal(journal,7);assert.equal(grouped.past.length,2);assert.equal(grouped.current.length,1);assert.deepEqual(journal,copy);
grouped=partitionJournal([{id:'aegis-protocol-6',title:'Final retained record'},{level:7,title:'Completion'}],7);assert.equal(grouped.past[0].level,6);
console.log('Passed: optional welcome, journal controls, completion archive grouping and station page/control contract.');
