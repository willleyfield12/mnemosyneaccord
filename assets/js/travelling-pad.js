const reviewMode=['deck5','deck3'].includes(new URLSearchParams(location.search).get('review'));
function padRoute(path){if(reviewMode){if(path.startsWith('/archive/'))path=path.replace('/archive/','/review/archive/');return path+(path.includes('?')?'&':'?')+'review='+new URLSearchParams(location.search).get('review');}return path;}
const dialog=document.querySelector('#travelling-archive');
const frame=document.querySelector('#travelling-frame');
let trigger;
function openPad(path='/mission/',source){
 trigger=source||document.activeElement;
 document.querySelector('#retained-position').textContent='Position held: '+document.querySelector('#deck-title').textContent+' // '+document.querySelector('#room-title').textContent;
 loadPadPage(path);if(!dialog.open)dialog.showModal();
}
function closePad(){dialog.close();trigger?.focus();}
// Archive Access is a visible reference tab from first arrival.
const archiveTab=document.querySelector('.travelling-tabs [data-archive]');
if(archiveTab){archiveTab.href='/archive/';archiveTab.setAttribute('aria-disabled','false');}
document.querySelector('#open-travelling-pad').onclick=e=>openPad('/mission/',e.currentTarget);
// Journal entries expand in place; OPEN DATAPAD remains the archive launcher.
document.querySelector('#close-travelling-pad').onclick=closePad;
document.querySelectorAll('[data-pad-page]').forEach(b=>b.onclick=()=>loadPadPage(b.dataset.padPage));
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href);if(url.origin===location.origin&&/^\/(archive|mission|crew|jovian-system|aegis)\//.test(url.pathname)){e.preventDefault();openPad(url.pathname+url.search,a);}});
frame.addEventListener('load',()=>{
 const doc=frame.contentDocument;if(!doc)return;
 doc.documentElement.classList.add('archive-embedded');
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')closePad();});
 doc.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href);if(reviewMode&&url.origin===location.origin&&url.pathname.startsWith('/archive/')){e.preventDefault();loadPadPage(url.pathname);return;}if(url.origin===location.origin&&(url.pathname==='/station/'||url.pathname.startsWith('/kepler-iii/'))){e.preventDefault();closePad();}});
});
const locationLabel=document.querySelector('#pad-location');
new MutationObserver(()=>{locationLabel.textContent=document.querySelector('#deck-title').textContent+' // '+document.querySelector('#room-title').textContent;}).observe(document.querySelector('#room-title'),{childList:true,subtree:true});

dialog.addEventListener('close',()=>window.dispatchEvent(new Event('datapad-closed')));

function loadPadPage(path){
 const archive=path.startsWith('/archive/')||path.startsWith('/review/archive/');
 document.querySelectorAll('.travelling-tabs button,.travelling-tabs a').forEach(tab=>{
  const selected=tab.hasAttribute('data-archive')?archive:tab.dataset.padPage===path.split('?')[0];
  tab.classList.toggle('active',selected);
  if(selected)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
 });
 frame.src=padRoute(path);
}
