/* No recordings, speech, or network requests. All textures are synthesized locally. */
export const profiles = {
 docking: {label:'Docking', hz:60, edge:.20, depth:.10, event:'none', gap:[18000,28000]},
 cryo: {label:'Cryo', hz:50, edge:.10, depth:.08, event:'pod', gap:[16000,30000]},
 command: {label:'Command', hz:72, edge:.16, depth:.07, event:'console', gap:[5000,13000]},
 engineering: {label:'Engineering', hz:48, edge:.28, depth:.20, event:'pipes', gap:[9000,18000]},
 brig: {label:'Containment', hz:55, edge:.19, depth:.15, event:'door', gap:[18000,34000]},
 medical: {label:'Medical', hz:66, edge:.10, depth:.07, event:'monitor', gap:[11000,23000]},
 habitat: {label:'Habitat', hz:60, edge:.09, depth:.08, event:'none', gap:[20000,30000]},
 biosphere: {label:'Biosphere', hz:54, edge:.13, depth:.11, event:'none', gap:[20000,30000]},
 machinery: {label:'Heavy machinery', hz:42, edge:.25, depth:.24, event:'machinery', gap:[12000,24000]},
 observation: {label:'Observation', hz:58, edge:.06, depth:.06, event:'none', gap:[20000,30000]}
};
export function profileForScene(scene='d6_docking') {
 if (/docking/.test(scene)) return 'docking';
 if (/cupola|observation|_obs\b/.test(scene)) return 'observation';
 if (/cryo|awake/.test(scene)) return 'cryo';
 if (/brig/.test(scene)) return 'brig';
 if (/engineering|reactor|heavy/.test(scene)) return 'engineering';
 if (/bridge|comms|systems|solar|diag/.test(scene)) return 'command';
 return ({1:'machinery',2:'brig',3:'engineering',4:'command',5:'medical',6:'biosphere',7:'habitat',8:'cryo'})[Number(/^d(\d+)/.exec(scene)?.[1])] || 'docking';
}
export class Soundscape {
 constructor(ctx,{random=Math.random,schedule=setTimeout,cancel=clearTimeout}={}) {
  this.ctx=ctx;this.random=random;this.schedule=(fn,ms)=>schedule(fn,ms);this.cancel=id=>cancel(id);this.sources=new Set();this.cleanups=new Set();this.playing=false;this.volume=.18;
  this.master=ctx.createGain();this.master.gain.value=0;
  const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-20;compressor.knee.value=18;compressor.ratio.value=3;this.master.connect(compressor).connect(ctx.destination);
  this.hum=ctx.createGain();this.hum.gain.value=.13;this.hum.connect(this.master);
  this.bands=[];
  // Mains buzz with rounded harmonics: fly-trap transformer, without continuous hiss.
  for(const [multiple,weight] of [[1,.55],[2,.26],[4,.08],[6,.035]]) {
   const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=60*multiple;g.gain.value=weight;o.connect(g).connect(this.hum);o.start();this.bands.push({o,g,multiple,weight});
  }
  this.lfo=ctx.createOscillator();this.lfo.frequency.value=.17;this.lfoGain=ctx.createGain();this.lfoGain.gain.value=.008;this.lfo.connect(this.lfoGain).connect(this.hum.gain);this.lfo.start();
  this.profile='docking';this.setScene('d6_docking');
 }
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));if(this.playing)this.master.gain.setTargetAtTime(this.volume*.65,this.ctx.currentTime,.12)}
 setScene(scene){const next=scene==='d6_docking'||scene==='arrival'||scene==='landing'?'docking':profileForScene(scene);if(next===this.profile&&this.scene===scene)return;this.scene=scene;this.profile=next;this.clearEffects();const p=profiles[next],t=this.ctx.currentTime;
  for(const b of this.bands){b.o.frequency.setTargetAtTime(p.hz*b.multiple,t,.7);b.g.gain.setTargetAtTime(b.weight*(b.multiple>1?1+p.edge:1),t,.7)}
  this.hum.gain.setTargetAtTime(.10+p.depth*.25,t,.7);if(this.playing)this.queue();
 }
 async start(){await this.ctx.resume();if(this.ctx.state!=='running')return false;this.playing=true;this.setVolume(this.volume);this.queue();return true}
 pause(){this.playing=false;this.clearEffects();this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.value=0;return this.ctx.suspend()}
 clearEffects(){this.cancel(this.timer);for(const s of this.sources){try{s.stop()}catch{}}this.sources.clear();for(const cleanup of [...this.cleanups])cleanup()}
 queue(){this.cancel(this.timer);if(!this.playing)return;const [min,max]=profiles[this.profile].gap;this.timer=this.schedule(()=>{if(!this.playing)return;this.effect();this.queue()},min+this.random()*(max-min))}
 voice(sources,duration,pan=0){const g=this.ctx.createGain(),p=this.ctx.createStereoPanner();p.pan.value=pan;g.connect(p).connect(this.master);let remaining=sources.length;
  const cleanup=()=>{g.disconnect();p.disconnect();this.cleanups.delete(cleanup)};this.cleanups.add(cleanup);
  for(const source of sources){this.sources.add(source);source.onended=()=>{source.disconnect();this.sources.delete(source);if(--remaining===0)cleanup()};source.stop(this.ctx.currentTime+duration+.1)}return g;
 }
 ping(freq,time,level=.08,duration=.13){const o=this.ctx.createOscillator();o.start(this.ctx.currentTime+time);const g=this.voice([o],time+duration,this.random()*.8-.4),t=this.ctx.currentTime+time;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g)}
 air(duration=2.6,cutoff=450,level=.09){const ctx=this.ctx,b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=b.getChannelData(0);let smooth=0;for(let i=0;i<data.length;i++){smooth=(smooth+.13*(this.random()*2-1))/1.13;data[i]=smooth}const s=ctx.createBufferSource(),filter=ctx.createBiquadFilter();s.buffer=b;s.start();const g=this.voice([s],duration,this.random()*1.2-.6),t=ctx.currentTime;filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,t);filter.frequency.exponentialRampToValueAtTime(100,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+.5);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(filter).connect(g);s.onended=(()=>{const end=s.onended;return()=>{filter.disconnect();end()}})()}
 metal(base=110,level=.07,delay=0){const partials=[1,1.47,2.19,3.31],t=this.ctx.currentTime+delay;for(const [i,multiple] of partials.entries()){const o=this.ctx.createOscillator();o.start(t);const g=this.voice([o],delay+1.6,this.random()*1.2-.6);o.frequency.value=base*multiple;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level/(i+1),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+1.5-i*.18);o.connect(g)}}
 effect(){switch(profiles[this.profile].event){
  case 'pod':this.air(3.2,480,.13);this.ping(190,2.8,.025,.45);break;
  case 'console':{const f=500+this.random()*260;this.ping(f,0,.055);this.ping(f*1.25,.18,.04);if(this.random()>.5)this.ping(f*.75,.4,.03);break}
  case 'pipes':this.metal(80+this.random()*65,.07);if(this.random()>.4)this.metal(95,.035,.38);this.air(3.4,240,.10);break;
  case 'door':this.air(2.1,300,.11);this.metal(65,.10,1.7);this.metal(125,.025,1.85);break;
  case 'monitor':this.ping(720,0,.025,.18);this.ping(580,.7,.018,.12);break;
  case 'machinery':this.metal(48,.045);this.ping(40,.3,.09,1.8);break;
 }}
 async dispose(){this.playing=false;this.clearEffects();for(const {o,g} of this.bands){o.stop();o.disconnect();g.disconnect()}this.lfo.stop();this.lfo.disconnect();this.lfoGain.disconnect();await this.ctx.close()}
}
