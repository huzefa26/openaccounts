import { openDB } from 'idb';

const DB_NAME = 'openaccounts_db';
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
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

export async function initDB() {
  return dbPromise;
}

export { dbPromise };
