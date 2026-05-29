import { StorageService } from '../lib/storage';
import { AccountsPage } from './accounts';
import {
  TransactionFormHtml,
  mountTransactionForm,
} from './transaction-form';

export async function App(
  el: HTMLElement,
  storage: StorageService,
): Promise<void> {
  const accounts = await storage.getAllAccounts();
  const transactions = await storage.getAllTransactions();

  el.innerHTML = `
    <header>
      <h1>OpenAccounts</h1>
    </header>
    ${TransactionFormHtml(accounts)}
    <section id="ledger-section">
      <h2>Ledger</h2>
      ${transactions.length === 0 ? '<p>No entries yet.</p>' : ''}
    </section>
    ${AccountsPage(accounts)}
  `;

  mountTransactionForm(el, accounts, async (data) => {
    await storage.createTransaction({
      date: data.date,
      description: data.description,
      splits: data.splits.map((s) => ({ ...s, currency: '' })),
    });
    const all = await storage.getAllTransactions();
    const ledgerSection = el.querySelector('#ledger-section')!;
    ledgerSection.innerHTML = `<h2>Ledger</h2><p>${all.length} transaction(s) saved.</p>`;
  });
}
