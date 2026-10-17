import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {onRequest} from '../functions/_middleware.js';
let session=null;const env={SESSIONS:{get:async()=>session?JSON.stringify(session):null}};
async function visit(path,level){session=level===undefined?null:{active:true,progressionVersion:2,level,journal:[]};const req=new Request('https://station.test'+path,{headers:{Cookie:'aegis=test'}});return onRequest({request:req,env,next:()=>new Response('asset',{status:200})});}
for(const level of [undefined,1]){
 assert.equal((await visit('/archive/',level)).status,200);
 for(const n of [1,2,3,5])for(const ext of ['.html',''])assert.equal((await visit('/archive/hall-'+n+ext,level)).status,200);
 for(const n of [4,6,7,8])assert.equal((await visit('/archive/hall-'+n+'.html',level)).status,403);
}
for(const n of [1,2,3,4,5,6])assert.equal((await visit('/archive/hall-'+n+'.html',2)).status,200);
for(const n of [7,8])assert.equal((await visit('/archive/hall-'+n+'.html',2)).status,403);
for(let n=1;n<=8;n++)assert.equal((await visit('/archive/hall-'+n+'.html',3)).status,200);
for(const n of [9,11]){assert.equal((await visit('/archive/hall-'+n+'.html',3)).status,403);assert.equal((await visit('/archive/hall-'+n+'.html',4)).status,200);}
for(const n of [10,12]){assert.equal((await visit('/archive/hall-'+n+'.html',4)).status,403);assert.equal((await visit('/archive/hall-'+n+'.html',5)).status,200);}
assert.equal((await visit('/archive/hall-99.html',5)).status,404);
assert.equal((await visit('/oblivian/hall-WakingDreams.html',1)).status,303);
assert.equal((await visit('/oblivian/hall-WakingDreams.html',2)).status,200);
assert.equal((await visit('/oblivian/hall-returningvoice.html',2)).status,403);
for(const n of [1,2,3,5]){const html=await readFile(new URL('../archive/hall-'+n+'.html',import.meta.url),'utf8');assert(!html.includes('<dd>Record unavailable.</dd>'));}
const html=await readFile(new URL('../kepler-iii/index.html',import.meta.url),'utf8');assert(html.includes('href="/archive/" data-archive aria-disabled="false"'));
console.log('Passed: four introductory records before registration and at first entry, six/eight progression gates, extensionless direct URLs, unknown-record handling, separate trial protection, populated introductory correspondences and visible Datapad link.');
