import { openDB } from 'idb';

const DB_NAME = 'openaccounts_db';
const DB_VERSION = 2;

function createDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('categories')) {
        const store = db.createObjectStore('categories', { keyPath: 'id' });
        store.createIndex('type', 'type');
      }

      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('transaction_lines')) {
        const store = db.createObjectStore('transaction_lines', { keyPath: 'id' });
        store.createIndex('transaction_id', 'transaction_id');
      }

      if (!db.objectStoreNames.contains('currencies')) {
        db.createObjectStore('currencies', { keyPath: 'code' });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

let dbPromise = createDB();

export async function resetDB() {
  const db = await dbPromise;
  db.close();
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
  dbPromise = null;
}

export async function initDB() {
  if (!dbPromise) {
    dbPromise = createDB();
  }
  return dbPromise;
}

export { dbPromise };
