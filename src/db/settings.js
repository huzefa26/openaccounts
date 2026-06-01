import { dbPromise } from './index';

export async function get(key) {
  const db = await dbPromise;
  const record = await db.get('settings', key);
  return record ? JSON.parse(record.value) : undefined;
}

export async function set(key, value) {
  const db = await dbPromise;
  const now = new Date().toISOString();
  await db.put('settings', { key, value: JSON.stringify(value), updated_at: now });
}

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('settings');
}

export async function del(key) {
  const db = await dbPromise;
  await db.delete('settings', key);
}
