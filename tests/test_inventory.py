import json,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class InventoryTests(unittest.TestCase):
 def test_agreed_distribution_and_source_copy(self):
  rooms=json.loads((ROOT/'data/station.json').read_text());source=json.loads((ROOT/'audit/source-inventory.json').read_text());specs={re.search(r'SPEC-[A-Z]+-\d+',s['item_and_id']).group():s for s in source};items=[i for r in rooms.values() for i in r['items']]
  self.assertEqual(len(items),66);self.assertEqual(len({i['id'] for i in items}),66);self.assertEqual({i['specimenId'] for i in items},set(specs));self.assertEqual(len({i['image'] for i in items}),44)
  for r in rooms.values():
   self.assertGreaterEqual(len(r['items']),3 if r['deck']==3 else 2)
   for i in r['items']:
    self.assertEqual(i['desc'],specs[i['specimenId']]['tooltip']);self.assertTrue((ROOT/i['image'].lstrip('/')).is_file());self.assertTrue(0<i['x']<100 and 0<i['y']<100)
  for spec,s in specs.items():
   match=re.search(r'Resonant Tier (\d)',s['status'])
   if match:
    tier=int(match.group(1));available=[1 if r['deck']>=6 else 2 if r['deck']>=4 else 3 if r['deck']==3 else 4 if r['deck']==2 else 5 for r in rooms.values() if any(i['specimenId']==spec for i in r['items'])];self.assertLessEqual(min(available),tier,s['item_and_id'])
if __name__=='__main__':unittest.main()
