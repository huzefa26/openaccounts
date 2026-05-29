import { StorageService } from '../lib/storage';
import { Router } from './router';
import type { PageResult } from './router';
import type { Transaction, Account } from '../types/storage';
import { AccountsPage } from './pages/accounts';
import { LedgerHtml } from './pages/ledger';
import { TransactionFormHtml, mountTransactionForm } from './components/transaction-form';

export class App {
  private storage: StorageService;
  private router: Router;

  constructor(container: HTMLElement, storage: StorageService) {
    this.storage = storage;
    this.router = new Router(container, {
      home: () => this.homePage(),
      ledger: () => this.ledgerPage(),
      accounts: () => this.accountsPage(),
      profile: () => this.profilePage(),
    });
  }

  start(): void {
    this.router.start();
  }

  private async homePage(): Promise<PageResult> {
    const accounts = await this.storage.getAllAccounts();
    const transactions = await this.storage.getAllTransactions();
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));

    return {
      html: `
        <style>
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); margin: var(--space-4) 0; }
        </style>
        <h2>Home</h2>
        ${TransactionFormHtml(accounts)}
        <div class="stats-grid">
          <article class="card"><h3>Today</h3><p class="text-light">$0.00</p></article>
          <article class="card"><h3>This Month</h3><p class="text-light">$0.00</p></article>
          <article class="card"><h3>Avg / Day</h3><p class="text-light">$0.00</p></article>
        </div>
        <section>
          <header class="hstack justify-between items-center">
            <h3>Recent Entries</h3>
            <a href="#ledger" class="button outline small">View full ledger &rarr;</a>
          </header>
          ${RecentEntriesHtml(transactions, accountMap)}
        </section>`,
      mount: (el) => {
        mountTransactionForm(el, accounts, async (data) => {
          await this.storage.createTransaction({
            date: data.date,
            description: data.description,
            splits: data.splits.map((s) => ({ ...s, currency: '' })),
          });
          // Re-render the home page to show updated ledger
          const result = await this.homePage();
          el.innerHTML = result.html;
          result.mount?.(el);
        });
      },
    };
  }

  private async ledgerPage(): Promise<PageResult> {
    const accounts = await this.storage.getAllAccounts();
    const transactions = await this.storage.getAllTransactions();
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));
    return {
      html: `<h2>Ledger</h2>${LedgerHtml(transactions, accountMap)}`,
    };
  }

  private async accountsPage(): Promise<PageResult> {
    const accounts = await this.storage.getAllAccounts();
    return { html: AccountsPage(accounts) };
  }

  private async profilePage(): Promise<PageResult> {
    return {
      html: `<section><h2>Profile</h2><p>Coming soon.</p></section>`,
    };
  }
}

function RecentEntriesHtml(
  transactions: Transaction[],
  _accountMap: Map<number, Account>,
): string {
  if (transactions.length === 0) return '<p class="text-light">No entries yet.</p>';

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 5);

  return `
    <div class="table">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${recent
            .map(
              (tx) => `
            <tr>
              <td>${esc(tx.date)}</td>
              <td>${esc(tx.description)}</td>
              <td>${tx.splits.reduce((s, x) => s + x.amount, 0).toFixed(2)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function esc(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}
