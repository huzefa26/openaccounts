import * as dbTransactions from '../db/transactions';
import * as dbLines from '../db/transactionLines';
import * as dbCategories from '../db/categories';
import { dbPromise } from '../db/index';

const OB_DEBIT_TYPES = ['asset', 'expense'];
const OB_CREDIT_TYPES = ['liability', 'equity', 'income'];

export async function handleOpeningBalance(category, newBalance, defaultCurrency) {
  const currency = defaultCurrency?.code || 'AED';

  const allTransactions = await dbTransactions.getAll();
  const existingTx = allTransactions.find(
    (t) => t.is_opening_balance && t.opening_balance_category_id === category.id,
  );

  if (newBalance === 0) {
    if (existingTx) {
      await dbLines.deleteByTransactionId(existingTx.id);
      await dbTransactions.del(existingTx.id);
    }
    return;
  }

  const equityCategories = await dbCategories.getAll();
  const obe = equityCategories.find(
    (c) => c.is_system && c.type === 'equity',
  );

  if (!obe) {
    const db = await dbPromise;
    const now = new Date().toISOString();
    obe = {
      id: 'base_opening_balance_equity',
      name: 'Opening Balance Equity',
      type: 'equity',
      parent_id: null,
      description: '',
      opening_balance: 0,
      is_system: true,
      created_at: now,
      updated_at: now,
    };
    await db.add('categories', obe);
  }

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const categoryIsDebit = OB_DEBIT_TYPES.includes(category.type);
  const categoryIsCredit = OB_CREDIT_TYPES.includes(category.type);

  const debitEntries = [];
  const creditEntries = [];

  if (categoryIsDebit) {
    debitEntries.push({ category_id: category.id, entry_type: 'debit', currency, amount: newBalance });
    creditEntries.push({ category_id: obe.id, entry_type: 'credit', currency, amount: newBalance });
  } else if (categoryIsCredit) {
    debitEntries.push({ category_id: obe.id, entry_type: 'debit', currency, amount: newBalance });
    creditEntries.push({ category_id: category.id, entry_type: 'credit', currency, amount: newBalance });
  }

  const lines = [...debitEntries, ...creditEntries];

  if (existingTx) {
    await dbLines.deleteByTransactionId(existingTx.id);
    await dbTransactions.update(existingTx.id, {
      date: today,
      description: `Opening balance: ${category.name}`,
      updated_at: now,
    });
    for (const line of lines) {
      await dbLines.create({ ...line, transaction_id: existingTx.id });
    }
  } else {
    const tx = await dbTransactions.create({
      date: today,
      description: `Opening balance: ${category.name}`,
      notes: '',
      is_opening_balance: true,
      opening_balance_category_id: category.id,
    });
    for (const line of lines) {
      await dbLines.create({ ...line, transaction_id: tx.id });
    }
  }
}
