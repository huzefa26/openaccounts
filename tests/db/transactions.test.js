import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import * as dbTransactions from '../../src/db/transactions';
import { buildTransaction } from '../helpers/factories';

describe('transactions db', () => {
  beforeEach(async () => {
    await resetDB();
    await initDB();
  });

  it('creates a transaction with generated id and timestamps', async () => {
    const tx = await dbTransactions.create(buildTransaction({ description: 'Test' }));
    expect(tx.id).toBeDefined();
    expect(tx.created_at).toBeDefined();
    expect(tx.updated_at).toBeDefined();
    expect(tx.description).toBe('Test');
  });

  it('getById returns the transaction', async () => {
    const tx = await dbTransactions.create(buildTransaction({ description: 'Find me' }));
    const found = await dbTransactions.getById(tx.id);
    expect(found.description).toBe('Find me');
  });

  it('getAll returns all transactions', async () => {
    await dbTransactions.create(buildTransaction({ description: 'One' }));
    await dbTransactions.create(buildTransaction({ description: 'Two' }));
    const all = await dbTransactions.getAll();
    expect(all).toHaveLength(2);
  });

  it('update changes updated_at', async () => {
    const tx = await dbTransactions.create(buildTransaction());
    const before = tx.updated_at;
    await new Promise((r) => setTimeout(r, 10));
    const updated = await dbTransactions.update(tx.id, { description: 'Updated' });
    expect(updated.description).toBe('Updated');
    expect(updated.updated_at).not.toBe(before);
  });
});
