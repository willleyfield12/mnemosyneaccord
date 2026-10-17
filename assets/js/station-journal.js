// Pure journal grouping; the server remains authoritative for clearance and saved data.
export function partitionJournal(journal = [], currentLevel = 1) {
 let cursor = 1;
 const grants = {'RESONANCE granted': 2, 'CLEARANCE granted': 3, 'SANCTUARY granted': 4, 'ACCORD granted': 5};
 const records = journal.map((entry, index) => {
  if (grants[entry.title]) cursor = grants[entry.title];
  const protocolLevel = /^aegis-protocol-([1-7])$/.exec(entry.id || '');
  const level = Number.isInteger(entry.level) && entry.level >= 1 && entry.level <= 7
   ? entry.level : protocolLevel ? Number(protocolLevel[1]) : cursor;
  cursor = Math.max(cursor, level);
  return {...entry, level, entryKey: entry.id || 'journal-' + index};
 });
 return {current: records.filter(entry => entry.level >= currentLevel), past: records.filter(entry => entry.level < currentLevel)};
}
