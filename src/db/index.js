import { openDB } from 'idb';
import { baseCoa } from '../constants/baseCoa';
import { baseCurrencies } from '../constants/baseCurrencies';

const DB_NAME = 'openaccounts_db';
const DB_VERSION = 1;

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

async function seed(db) {
  const setting = await db.get('settings', 'onboarding_complete');
  if (setting && JSON.parse(setting.value) === true) {
    return;
  }

  const now = new Date().toISOString();
  const nameToId = {};

  for (const cat of baseCoa) {
    nameToId[cat.name] = crypto.randomUUID();
  }

  const catTx = db.transaction('categories', 'readwrite');
  const catStore = catTx.objectStore('categories');

  for (const cat of baseCoa) {
    await catStore.add({
      id: nameToId[cat.name],
      name: cat.name,
      type: cat.type,
      parent_id: cat.parent ? nameToId[cat.parent] : null,
      description: '',
      opening_balance: 0,
      is_system: Boolean(cat.is_system),
      created_at: now,
      updated_at: now,
    });
  }

  await catTx.done;

  const defaultCurrency = baseCurrencies.find((c) => c.code === 'AED') || baseCurrencies[0];
  const curTx = db.transaction('currencies', 'readwrite');
  const curStore = curTx.objectStore('currencies');

  for (const currency of baseCurrencies) {
    await curStore.add({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      is_default: currency.code === defaultCurrency.code,
      created_at: now,
      updated_at: now,
    });
  }

  await curTx.done;

  const setTx = db.transaction('settings', 'readwrite');
  const setStore = setTx.objectStore('settings');
  await setStore.put({
    key: 'onboarding_complete',
    value: JSON.stringify(true),
    updated_at: now,
  });
  await setTx.done;
}

export async function initDB() {
  const db = await dbPromise;
  await seed(db);
  return db;
}

export { dbPromise };
