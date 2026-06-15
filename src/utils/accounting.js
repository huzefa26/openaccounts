import useTransactionStore from '../store/transactionStore';
import useCategoryStore from '../store/categoryStore';
import { dbPromise } from '../db/index';

const OB_DEBIT_TYPES = ['asset', 'expense'];
const OB_CREDIT_TYPES = ['liability', 'equity', 'income'];

export async function handleOpeningBalance(category, newBalance, defaultCurrency) {
  const currency = defaultCurrency?.code || '';

  const transactions = useTransactionStore.getState().transactions;
  const existingTx = transactions.find(
    (t) => t.is_opening_balance && t.opening_balance_category_id === category.id,
  );

  if (newBalance === 0) {
    if (existingTx) {
      await useTransactionStore.getState().deleteTransaction(existingTx.id, { notify: false });
    }
    return;
  }

  const categories = useCategoryStore.getState().categories;
  let obe = categories.find(
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
    const categoryStore = useCategoryStore.getState();
    categoryStore.invalidateCache();
    await categoryStore.fetchAll();
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
    await useTransactionStore.getState().updateTransaction(existingTx.id, {
      transaction: {
        date: today,
        description: `Opening balance: ${category.name}`,
      },
      lines,
    }, { notify: false });
  } else {
    await useTransactionStore.getState().createTransaction({
      transaction: {
        date: today,
        description: `Opening balance: ${category.name}`,
        notes: '',
        is_opening_balance: true,
        opening_balance_category_id: category.id,
      },
      lines,
    }, { notify: false });
  }
}
