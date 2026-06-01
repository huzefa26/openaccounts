import { dbPromise } from './index';

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('transaction_lines');
}

export async function getById(id) {
  const db = await dbPromise;
  return db.get('transaction_lines', id);
}

export async function getByTransactionId(transactionId) {
  const db = await dbPromise;
  return db.getAllFromIndex('transaction_lines', 'transaction_id', transactionId);
}

export async function create(data) {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, created_at: now, updated_at: now };
  await db.add('transaction_lines', record);
  return record;
}

export async function update(id, data) {
  const db = await dbPromise;
  const existing = await db.get('transaction_lines', id);
  if (!existing) throw new Error('Transaction line not found');
  const updated = { ...existing, ...data, id, updated_at: new Date().toISOString() };
  await db.put('transaction_lines', updated);
  return updated;
}

export async function del(id) {
  const db = await dbPromise;
  await db.delete('transaction_lines', id);
}

export async function deleteByTransactionId(transactionId) {
  const db = await dbPromise;
  const lines = await getByTransactionId(transactionId);
  const tx = db.transaction('transaction_lines', 'readwrite');
  const store = tx.objectStore('transaction_lines');
  for (const line of lines) {
    await store.delete(line.id);
  }
  await tx.done;
}
