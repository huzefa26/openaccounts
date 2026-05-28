import {
  DB_NAME,
  DB_VERSION,
  STORE_ACCOUNTS,
  STORE_TRANSACTIONS,
  STORE_CURRENCIES,
} from '../types/storage';
import { insertSeedAccounts } from './seed';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_ACCOUNTS)) {
        const store = db.createObjectStore(STORE_ACCOUNTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('parentId', 'parentId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        const store = db.createObjectStore(STORE_TRANSACTIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CURRENCIES)) {
        db.createObjectStore(STORE_CURRENCIES, { keyPath: 'code' });
      }

      if (event.oldVersion === 0) {
        const tx = request.transaction;
        if (tx) insertSeedAccounts(tx);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function closeDB(db: IDBDatabase): void {
  db.close();
}
