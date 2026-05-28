import type { Account } from '../types/storage';

const TYPE_LABELS: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  income: 'Income',
  expense: 'Expenses',
};

const TYPE_ORDER = ['asset', 'liability', 'equity', 'income', 'expense'];

export function AccountsPage(accounts: Account[]): string {
  const groups: Record<string, Account[]> = {};
  for (const a of accounts) {
    (groups[a.type] ??= []).push(a);
  }

  return `
    <section>
      <header>
        <h1>OpenAccounts</h1>
        <p>Chart of Accounts</p>
      </header>
      ${TYPE_ORDER
        .filter((t) => groups[t])
        .map(
          (t) => `
            <section>
              <h2>${TYPE_LABELS[t]}</h2>
              <ul>
                ${groups[t].map((a) => `<li>${a.name}</li>`).join('')}
              </ul>
            </section>`,
        )
        .join('')}
    </section>`;
}
