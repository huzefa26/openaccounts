import * as dbCategories from '../db/categories';
import * as dbTransactions from '../db/transactions';
import * as dbTransactionLines from '../db/transactionLines';
import * as dbCurrencies from '../db/currencies';
import * as dbSettings from '../db/settings';

export async function exportAllData() {
  const [categories, transactions, lines, currencies, settings] = await Promise.all([
    dbCategories.getAll(),
    dbTransactions.getAll(),
    dbTransactionLines.getAll(),
    dbCurrencies.getAll(),
    dbSettings.getAll(),
  ]);

  const payload = {
    version: 2,
    exported_at: new Date().toISOString(),
    categories,
    transactions,
    transaction_lines: lines,
    currencies,
    settings,
  };

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `openaccounts_export_${today}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
