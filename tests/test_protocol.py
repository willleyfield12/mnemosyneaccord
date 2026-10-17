import unittest,sys,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server import Protocol,ProtocolError,REQUIRED
class ProtocolTests(unittest.TestCase):
 def setUp(self): self.p=Protocol();_,self.s=self.p.register('reader@example.com')
 def move(self,scene,**data):return self.p.action(self.s,'move',{'scene':scene,**data})
 def collect(self,id):return self.p.action(self.s,'collect',{'id':id})
 def offering(self):
  self.collect('citrus_oil');self.move('d6_corridor');self.move('d7_corridor');self.move('d7_barracks');self.collect('rosemary_tincture');self.move('d7_corridor');self.move('d8_corridor');self.move('d8_cupola');self.collect('jasmine_oil');self.move('d8_corridor');self.move('d7_corridor');self.move('d6_corridor');return self.p.action(self.s,'submit',{'ids':list(REQUIRED)})
 def elevate(self):
  self.offering();self.p.action(self.s,'puzzle',{'order':['arrival','variance','mismatch','review']});return self.p.action(self.s,'code',{'code':self.s['code']})
 def test_sealed_deck(self):
  self.move('d6_corridor')
  with self.assertRaises(ProtocolError):self.move('d5_corridor')
 def test_no_deck_skipping(self):
  self.move('d6_corridor')
  with self.assertRaises(ProtocolError):self.move('d8_corridor')
 def test_no_room_teleport(self):
  with self.assertRaises(ProtocolError):self.move('d6_hydro')
 def test_no_remote_collection(self):
  with self.assertRaises(ProtocolError):self.collect('jasmine_oil')
 def test_failure_consumes_selected_only_and_can_recollect(self):
  self.collect('citrus_oil');self.collect('d6_docking_spec_min_01');self.move('d6_corridor');self.p.action(self.s,'submit',{'ids':['d6_docking_spec_min_01']});self.assertEqual(self.s['inventory'],['citrus_oil']);self.assertEqual(self.s['stage'],'hunt');self.assertEqual(len(self.s['journal']),1);self.move('d6_docking');self.collect('d6_docking_spec_min_01');self.assertEqual(len(self.s['inventory']),2)
 def test_requires_exact_combination_and_checkpoint(self):
  self.collect('citrus_oil')
  with self.assertRaises(ProtocolError):self.p.action(self.s,'submit',{'ids':['citrus_oil']})
 def test_offering_consumed_puzzle_pending(self):
  self.offering();self.assertEqual(self.s['inventory'],[]);self.assertEqual(self.s['stage'],'puzzle');self.assertEqual(self.s['level'],1)
 def test_no_code_before_puzzle_or_wrong_puzzle(self):
  with self.assertRaises(ProtocolError):self.p.action(self.s,'code',{'code':'fake'})
  self.offering()
  with self.assertRaises(ProtocolError):self.p.action(self.s,'puzzle',{'order':['review','mismatch','variance','arrival']})
  self.assertEqual(self.s['stage'],'puzzle')
 def test_code_is_per_session_expires_and_not_in_public_state(self):
  self.offering();self.p.action(self.s,'puzzle',{'order':['arrival','variance','mismatch','review']});self.assertNotIn('code',self.p.public(self.s));self.s['codeExpires']=time.time()-1
  with self.assertRaises(ProtocolError):self.p.action(self.s,'code',{'code':self.s['code']})
 def test_full_cycle_and_first_visit_before_wormhole(self):
  self.elevate();self.assertEqual(self.s['level'],2)
  with self.assertRaises(ProtocolError):self.move('d4_corridor',mode='wormhole')
  self.move('d5_corridor');self.move('d4_corridor');self.move('d8_corridor',mode='wormhole');self.move('d4_corridor',mode='wormhole');self.assertIn(4,self.s['visited'])
  with self.assertRaises(ProtocolError):self.move('d3_corridor')
 def test_forgetting_revokes_every_action(self):
  self.elevate();self.p.action(self.s,'channel',{'purpose':'forget'});self.assertFalse(self.s['active']);self.assertFalse(self.s['inventory']);self.assertEqual(self.s['email'],'')
  for action,data in [('move',{'scene':'d5_corridor'}),('collect',{'id':'citrus_oil'}),('code',{'code':'fake'})]:
   with self.assertRaises(ProtocolError):self.p.action(self.s,action,data)
 def test_invalid_registration(self):
  with self.assertRaises(ProtocolError):self.p.register('invalid')
if __name__=='__main__':unittest.main()
