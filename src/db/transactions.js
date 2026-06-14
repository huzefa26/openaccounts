import { dbPromise } from './index';

async function maybeScheduleSync(suppressSync) {
  if (suppressSync) return;
  const { default: useSyncStore } = await import('../store/syncStore');
  useSyncStore.setState((s) => ({ pendingChangeCount: s.pendingChangeCount + 1 }));
  useSyncStore.getState().schedulePendingSync();
}

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('transactions');
}

export async function getById(id) {
  const db = await dbPromise;
  return db.get('transactions', id);
}

export async function create(data, { suppressSync = false } = {}) {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, created_at: now, updated_at: now };
  await db.add('transactions', record);
  await maybeScheduleSync(suppressSync);
  return record;
}

export async function update(id, data, { suppressSync = false } = {}) {
  const db = await dbPromise;
  const existing = await db.get('transactions', id);
  if (!existing) throw new Error('Transaction not found');
  const updated = { ...existing, ...data, id, updated_at: new Date().toISOString() };
  await db.put('transactions', updated);
  await maybeScheduleSync(suppressSync);
  return updated;
}

export async function del(id, { suppressSync = false } = {}) {
  const db = await dbPromise;
  await db.delete('transactions', id);
  await maybeScheduleSync(suppressSync);
}
