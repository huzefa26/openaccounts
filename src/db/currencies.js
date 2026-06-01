import { dbPromise } from './index';

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('currencies');
}

export async function getByCode(code) {
  const db = await dbPromise;
  return db.get('currencies', code);
}

export async function getDefault() {
  const db = await dbPromise;
  const all = await db.getAll('currencies');
  return all.find((c) => c.is_default) || null;
}

export async function create(data) {
  const db = await dbPromise;
  const now = new Date().toISOString();
  const record = { ...data, created_at: now, updated_at: now };
  await db.add('currencies', record);
  return record;
}

export async function update(code, data) {
  const db = await dbPromise;
  const existing = await db.get('currencies', code);
  if (!existing) throw new Error('Currency not found');
  const updated = { ...existing, ...data, code, updated_at: new Date().toISOString() };
  await db.put('currencies', updated);
  return updated;
}

export async function del(code) {
  const db = await dbPromise;
  await db.delete('currencies', code);
}
