"""Local review server. No emails are sent and no external subscriptions are created."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from http.cookies import SimpleCookie
import json, secrets, threading, time, argparse, re, urllib.parse
ROOT=Path(__file__).resolve().parent
ROOMS=json.loads((ROOT/'data/station.json').read_text())
LEVELS={1:'ORIENTATION',2:'RESONANCE',3:'CLEARANCE',4:'SANCTUARY',5:'ACCORD'}
REQUIRED={'citrus_oil','rosemary_tincture','jasmine_oil'}
HALLS=['hall-WakingDreams.html','hall-dividedmirror.html','hall-answeringworld.html','hall-livingaxis.html','hall-returningvoice.html','hall-openmind.html','hall-sharedheart.html','hall-livingscripture.html','hall-unbrokenseed.html','hall-rememberedhours.html','hall-secondform.html','hall-enduringself.html']
LOCK=threading.RLock()
class ProtocolError(Exception): pass
PROTOCOL_RECORDS={1: ('ORIENTATION // Follow the traces.', 'The station admits you to Decks 6, 7, and 8. Three traces survive where testimony fails: the sun concealed in a rind at the threshold; remembrance keeping vigil where sleepers pray; a pale bloom whose night watches the ice. Bring what each has surrendered, not merely what resembles it. Present three correspondences at the sealed Deck 5 checkpoint. Offered objects leave your manifest; your testimony remains. Rejected evidence may be recovered again. Consult the Mission Timeline when the trial is granted.'), 2: ('RESONANCE // Protocol retained.', 'Decks 5 and 4 are authorised. Use adjacent stairwells to establish new anchors. Four Greater Hall records await you under Archive Access.'), 3: ('CLEARANCE // The record has widened.', 'Deck 3 is authorised: Main Engineering and Solar Array Control. Eight Hall records await you under Archive Access.')}
class Protocol:
 def __init__(self): self.sessions={}
 def register(self,email):
  if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email) or len(email)>254: raise ProtocolError('A valid transmission address is required.')
  token=secrets.token_urlsafe(32)
  s={'active':True,'email':email,'level':1,'scene':'d6_docking','visited':[6],'inventory':[], 'journal':[], 'stage':'hunt','intro':False,'transmissions':[{'title':'ORIENTATION // Observer detected','body':'Your imprint is retained. Enter Kepler III through the Primary Docking Port.'}]}
  self.sessions[token]=s
  return token,s
 def allowed(self,s,deck): return s['active'] and deck >= {1:6,2:4,3:3,4:2,5:1}[s['level']] and deck<=8
 def action(self,s,action,data):
  if not s['active']: raise ProtocolError('Your imprint has been forgotten. Station access is revoked.')
  if action in ('intro','retain_protocol'):
   if action=='intro': s['intro']=True
   level=min(s['level'],3)
   title,body=PROTOCOL_RECORDS[level]
   key='aegis-protocol-'+str(level)
   if not any(entry.get('id')==key for entry in s['journal']):
    s['journal'].append({'id':key,'protocol':True,'title':title,'body':body,'items':[]})
  elif action=='move':
   target=data.get('scene',''); deck=int(target.split('_')[0][1:]) if re.fullmatch(r'd[1-8]_corridor',target) else ROOMS.get(target,{}).get('deck',0)
   current=int(s['scene'].split('_')[0][1:])
   if not self.allowed(s,deck): raise ProtocolError('This deck remains sealed by AEGIS.')
   if deck!=current:
    if not s['scene'].endswith('_corridor'): raise ProtocolError('Return to the deck corridor before changing decks.')
    wormhole=data.get('mode')=='wormhole' and s['level']>=2 and deck in s['visited']
    if not wormhole and (abs(deck-current)!=1 or not target.endswith('_corridor')): raise ProtocolError('Only an adjacent deck can be reached by the stairwell.')
   elif s['scene']!=target and not s['scene'].endswith('_corridor') and not target.endswith('_corridor'):
    raise ProtocolError('Return to the corridor before entering another room.')
   s['scene']=target
   if deck not in s['visited']: s['visited'].append(deck)
  elif action=='collect':
   room=ROOMS.get(s['scene']); item=next((i for i in room['items'] if i['id']==data.get('id')),None) if room else None
   if not item: raise ProtocolError('Evidence must be recovered from your current room.')
   if item['id'] not in s['inventory']: s['inventory'].append(item['id'])
  elif action=='submit':
   if s['level']!=1 or s['stage']!='hunt': raise ProtocolError('This assessment is not accepting another offering.')
   if s['scene']!='d6_corridor': raise ProtocolError('Approach the Deck 5 checkpoint from the Deck 6 corridor.')
   ids=data.get('ids',[])
   if not isinstance(ids,list) or not ids or len(set(ids))!=len(ids) or any(i not in s['inventory'] for i in ids): raise ProtocolError('Choose evidence currently held in your manifest.')
   accepted=set(ids)==REQUIRED
   s['inventory']=[i for i in s['inventory'] if i not in ids]
   s['journal'].append({'title':'Evidence accepted' if accepted else 'Evidence rejected','items':ids,'body':'Three traces align. The elevation trial is available.' if accepted else 'The offering lacks a stable correspondence. Similarity is not correspondence. Reconsider what was surrendered at the threshold, where sleepers pray, and beneath the gaze of the ice. Submitted specimens have returned to the recovery cycle.'})
   if accepted: s['stage']='puzzle'
  elif action=='puzzle':
   if s['stage']!='puzzle': raise ProtocolError('An accepted offering is required before the trial.')
   if data.get('order')!=['arrival','variance','mismatch','review']: raise ProtocolError('The sequence contradicts the mission record. Consult the timeline.')
   s['stage']='code'; s['code']=secrets.token_hex(3).upper(); s['codeExpires']=time.time()+86400
   s['transmissions'].append({'title':'RESONANCE // Clearance pending','body':'Evidence and witness account accepted. Enter this clearance code at the checkpoint within 24 hours: '+s['code']})
  elif action=='code':
   if s['stage']!='code' or time.time()>s.get('codeExpires',0) or not secrets.compare_digest(str(data.get('code','')).strip().upper(),s.get('code','')): raise ProtocolError('Clearance code unrecognised or expired.')
   s['level']=2; s['stage']='resonance'; s.pop('code',None)
   s['journal'].append({'title':'RESONANCE granted','body':'Decks 5 and 4 are open. Establish each wormhole anchor by travelling there. Archive Access now holds four Greater Hall records. Study them before the next offering.','items':[]})
  elif action=='channel':
   purpose=data.get('purpose'); message=str(data.get('message','')).strip()
   if purpose not in ['feedback','extras','lore','forget']: raise ProtocolError('Choose a channel protocol.')
   if purpose=='forget':
    s['active']=False; s['inventory']=[]; s['journal']=[]; s['email']=''; s['transmissions']=[]
   else:
    s['journal'].append({'title':'Direct Channel // '+purpose,'body':message or 'Supplementary records requested. Preview record retained; no transmission was sent.','items':[]})
  else: raise ProtocolError('Unknown protocol.')
  return s
 def public(self,s): return {k:v for k,v in s.items() if k not in ['code','codeExpires','email']}
PROTOCOL=Protocol()
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
 def session(self):
  try:
   cookie=SimpleCookie(self.headers.get('Cookie','')); return PROTOCOL.sessions.get(cookie['aegis'].value)
  except (KeyError,ValueError): return None
 def send_json(self,value,status=200,cookie=None):
  b=json.dumps(value).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Cache-Control','no-store')
  if cookie:self.send_header('Set-Cookie','aegis='+cookie+'; HttpOnly; SameSite=Strict; Path=/')
  self.end_headers(); self.wfile.write(b)
 def do_GET(self):
  path=urllib.parse.unquote(urllib.parse.urlsplit(self.path).path); s=self.session()
  if path=='/api/rooms':
   if not s or not s['active']: return self.send_json({'error':'Observer not detected.'},401)
   return self.send_json(ROOMS)
  if path=='/api/state': return self.send_json(PROTOCOL.public(s) if s else {'active':False,'level':0})
  if path.startswith(('/archive/','/oblivian/')):
   if not s or not s['active'] or s['level']<2:
    self.send_response(303);self.send_header('Location','/aegis/submit.html?return=archive');self.end_headers();return
   if path.startswith('/oblivian/hall-') and path.split('/')[-1] not in HALLS[:(s['level']-1)*4]: return self.send_error(403,'Archive record remains sealed.')
  if path.startswith(('/data/','.runtime/','/.')) or path=='/server.py' or path.startswith('/tests/') or path=='/README.md': return self.send_error(404)
  return super().do_GET()
 def do_POST(self):
  if self.path not in ['/api/register','/api/action']: return self.send_error(404)
  origin=self.headers.get('Origin')
  if origin and urllib.parse.urlsplit(origin).netloc!=self.headers.get('Host'):return self.send_json({'error':'Cross-origin requests rejected.'},403)
  try:
   size=int(self.headers.get('Content-Length','0'))
   if size<1 or size>16384:raise ProtocolError('Request size invalid.')
   data=json.loads(self.rfile.read(size))
   with LOCK:
    if self.path=='/api/register':
     current=self.session()
     if current and current['active']: return self.send_json(PROTOCOL.public(current))
     if data.get('consent') is not True: raise ProtocolError('Permission to receive transmissions is required.')
     token,s=PROTOCOL.register(str(data.get('email','')).strip());return self.send_json(PROTOCOL.public(s),cookie=token)
    s=self.session()
    if not s: return self.send_json({'error':'Observer not detected.'},401)
    return self.send_json(PROTOCOL.public(PROTOCOL.action(s,data.get('action'),data)))
  except (ProtocolError,ValueError,TypeError,KeyError) as e:return self.send_json({'error':str(e)},400)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);args=parser.parse_args()
 print('Local review: http://127.0.0.1:'+str(args.port),flush=True)
 ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
