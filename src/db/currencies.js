import { dbPromise } from './index';

async function maybeScheduleSync(suppressSync) {
  if (suppressSync) return;
  const { default: useSyncStore } = await import('../store/syncStore');
  useSyncStore.setState((s) => ({ pendingChangeCount: s.pendingChangeCount + 1 }));
  useSyncStore.getState().schedulePendingSync();
}

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('currencies');
}

export async function getDefault() {
  const db = await dbPromise;
  const all = await db.getAll('currencies');
  return all.find((c) => c.is_default) || null;
}

export async function create(data, { suppressSync = false } = {}) {
  const db = await dbPromise;
  const now = new Date().toISOString();
  const record = { ...data, created_at: now, updated_at: now };
  await db.add('currencies', record);
  await maybeScheduleSync(suppressSync);
  return record;
}

export async function update(code, data, { suppressSync = false } = {}) {
  const db = await dbPromise;
  const existing = await db.get('currencies', code);
  if (!existing) throw new Error('Currency not found');
  const updated = { ...existing, ...data, code, updated_at: new Date().toISOString() };
  await db.put('currencies', updated);
  await maybeScheduleSync(suppressSync);
  return updated;
}

export async function del(code, { suppressSync = false } = {}) {
  const db = await dbPromise;
  await db.delete('currencies', code);
  await maybeScheduleSync(suppressSync);
}
