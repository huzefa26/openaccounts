export const STORE_NAMES = [
  'categories',
  'transactions',
  'transaction_lines',
  'currencies',
  'settings',
];

export function buildSnapshot(data) {
  const snapshot = { version: 2, exported_at: new Date().toISOString() };
  for (const name of STORE_NAMES) {
    snapshot[name] = data[name];
  }
  return snapshot;
}

export async function populateFromSnapshot(db, data) {
  for (const storeName of STORE_NAMES) {
    const records = data[storeName];
    if (!records || records.length === 0) continue;

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    for (const record of records) {
      await store.put(record);
    }
    await tx.done;
  }
}
