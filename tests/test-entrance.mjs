import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../assets/js/arrival.js',import.meta.url),'utf8');
async function scenario({reduced=false,src='/assets/video/docking.mp4',blocked=false,failed=false}={}){
 const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,paused:true,events:{},addEventListener(e,fn){(this.events[e]??=[]).push(fn)},async play(){if(blocked)throw Error();this.paused=false;this.events.playing?.forEach(f=>f())},pause(){this.paused=true}});return nodes.get(id)};
 const timers=[],classes=new Set(),nav=[];
 const context={document:{querySelector:el,body:{classList:{add:c=>classes.add(c)}}},Image:class{},matchMedia:()=>({matches:reduced,addEventListener(){}}),setTimeout:(fn)=>{timers.push(fn);return timers.length},clearTimeout(){},location:{replace:p=>nav.push(p)},window:{addEventListener(){}},sessionStorage:{setItem(){}},AbortController,fetch:async()=>{if(failed)throw Error();return{ok:true,json:async()=>({src})}}};
 vm.createContext(context);const module=new vm.SourceTextModule(source,{context});await module.link(()=>{});await module.evaluate();
 return {el,timers,classes,nav,click:id=>el(id).events.click.forEach(f=>f({preventDefault(){}}))};
}
let s=await scenario();assert.equal(s.el('#arrival-video').paused,false);s.el('#arrival-video').events.ended[0]();s.timers.at(-1)();assert.deepEqual(s.nav,['/station/']);
s=await scenario({reduced:true});assert.equal(s.el('#arrival-video').paused,true);assert.equal(s.el('#play').hidden,false);
s=await scenario({blocked:true});assert.equal(s.el('#play').textContent,'Play docking sequence');
s=await scenario({src:null});assert.equal(s.el('#preview-note').hidden,false);s.click('#skip');s.timers.at(-1)();assert.deepEqual(s.nav,['/station/']);
s=await scenario({failed:true});assert.equal(s.el('#preview-note').hidden,false);
s=await scenario();s.click('#play');assert.equal(s.el('#arrival-video').paused,true);s.click('#play');assert.equal(s.el('#arrival-video').paused,false);
assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/href="arrival\/"/);
console.log('Entrance checks passed: landing route, playback end, skip, reduced motion, autoplay rejection, missing configuration, pause/resume.');
