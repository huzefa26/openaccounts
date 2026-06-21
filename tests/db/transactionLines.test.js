import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import * as dbLines from '../../src/db/transactionLines';
import { buildLine } from '../helpers/factories';

describe('transactionLines db', () => {
  beforeEach(async () => {
    await resetDB();
    await initDB();
  });

  it('creates a line with generated id and timestamps', async () => {
    const line = await dbLines.create(buildLine({ amount: 50 }));
    expect(line.id).toBeDefined();
    expect(line.created_at).toBeDefined();
    expect(line.amount).toBe(50);
  });

  it('getByTransactionId returns only matching lines', async () => {
    const txId = 'tx_group_1';
    await dbLines.create(buildLine({ transaction_id: txId, amount: 10 }));
    await dbLines.create(buildLine({ transaction_id: txId, amount: 20 }));
    await dbLines.create(buildLine({ transaction_id: 'tx_other', amount: 99 }));

    const lines = await dbLines.getByTransactionId(txId);
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.transaction_id === txId)).toBe(true);
  });

  it('deleteByTransactionId removes only matching lines', async () => {
    const txId = 'tx_delete';
    await dbLines.create(buildLine({ transaction_id: txId }));
    await dbLines.create(buildLine({ transaction_id: txId }));
    await dbLines.create(buildLine({ transaction_id: 'tx_keep' }));

    await dbLines.deleteByTransactionId(txId);

    const remaining = await dbLines.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].transaction_id).toBe('tx_keep');
  });
});
