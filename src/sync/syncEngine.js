import * as dbCategories from '../db/categories';
import * as dbTransactions from '../db/transactions';
import * as dbTransactionLines from '../db/transactionLines';
import * as dbCurrencies from '../db/currencies';
import * as dbSettings from '../db/settings';
import { dbPromise } from '../db/index';
import { findFile, readFile, createFile, updateFile } from './googleDrive';

const STORE_CONFIG = [
  { name: 'categories', keyPath: 'id', local: () => dbCategories.getAll() },
  { name: 'transactions', keyPath: 'id', local: () => dbTransactions.getAll() },
  { name: 'transaction_lines', keyPath: 'id', local: () => dbTransactionLines.getAll() },
  { name: 'currencies', keyPath: 'code', local: () => dbCurrencies.getAll() },
  { name: 'settings', keyPath: 'key', local: () => dbSettings.getAll() },
];

function getKey(record, keyPath) {
  return record[keyPath];
}

function mergeStore(localRecords, remoteRecords, keyPath, lastSyncedAt) {
  const map = new Map();

  for (const r of localRecords) {
    map.set(getKey(r, keyPath), r);
  }

  if (remoteRecords) {
    for (const r of remoteRecords) {
      const key = getKey(r, keyPath);
      const local = map.get(key);

      if (local) {
        if (r.updated_at > local.updated_at) {
          map.set(key, r);
        }
      } else if (lastSyncedAt && r.updated_at > lastSyncedAt) {
        map.set(key, r);
      }
    }
  }

  return Array.from(map.values());
}

async function readAllLocal() {
  const result = {};
  for (const cfg of STORE_CONFIG) {
    result[cfg.name] = await cfg.local();
  }
  return result;
}

async function applyMerged(merged) {
  const db = await dbPromise;

  for (const cfg of STORE_CONFIG) {
    const records = merged[cfg.name];
    const tx = db.transaction(cfg.name, 'readwrite');
    const store = tx.objectStore(cfg.name);

    for (const record of records) {
      await store.put(record);
    }

    await tx.done;
  }
}

function buildSnapshot(data) {
  return {
    version: 2,
    exported_at: new Date().toISOString(),
    categories: data.categories,
    transactions: data.transactions,
    transaction_lines: data.transaction_lines,
    currencies: data.currencies,
    settings: data.settings,
  };
}

export async function sync(lastSyncedAt) {
  const remoteFile = await findFile();

  const remoteData = remoteFile ? await readFile(remoteFile.id) : null;
  const localData = await readAllLocal();

  const merged = {};
  for (const cfg of STORE_CONFIG) {
    merged[cfg.name] = mergeStore(localData[cfg.name], remoteData?.[cfg.name], cfg.keyPath, lastSyncedAt);
  }

  const snapshot = buildSnapshot(merged);

  if (remoteFile) {
    await updateFile(remoteFile.id, snapshot);
  } else {
    await createFile(snapshot);
  }

  await applyMerged(merged);

  const now = new Date().toISOString();
  await dbSettings.set('last_synced_at', now);

  return { lastSynced: now };
}
