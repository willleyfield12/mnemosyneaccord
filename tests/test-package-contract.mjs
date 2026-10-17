import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const rooms=JSON.parse(await readFile(path.join(root,'data/station.json'),'utf8'));
for(const room of Object.values(rooms)){await access(path.join(root,room.image));for(const item of room.items)await access(path.join(root,item.image));}
for(const name of ['walkthrough','station-checkpoints','protocol','hall-gallery','deck-review','station-journal']){
 const filename=path.join(root,'assets/js',name+'.js');const source=await readFile(filename,'utf8');
 for(const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(match[1].startsWith('.'))await access(path.resolve(path.dirname(filename),match[1].split('?')[0]));}
}
const html=await readFile(path.join(root,'kepler-iii/index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="(\/(?:assets\/js|css)\/[^"?]+)(?:\?[^" ]*)?"/g))await access(path.join(root,match[1]));
const gallery=await readFile(path.join(root,'assets/js/hall-gallery.js'),'utf8');assert(!gallery.includes('Tier'));assert(!gallery.includes('6 of 8'));for(let n=1;n<=12;n++){const record=await readFile(path.join(root,'archive','hall-'+n+'.html'),'utf8');assert(!record.includes('<dd>Record unavailable.</dd>'));}
assert(html.includes('walkthrough.js?v=progression-12'));assert(html.includes('story-rewards'));assert.equal((gallery.match(/\["[A-Z][^"]+", "hall/g)||[]).length,12);
console.log('Passed: checkpoint imports, station scripts/styles, all room/specimen images, twelve populated Hall records and reader-facing archive wording.');
