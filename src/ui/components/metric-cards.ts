import { formatAmount } from '../../lib/format';

export interface MetricTotals {
  netBalance: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  incomeTxCount: number;
  expenseTxCount: number;
}

export function MetricCardsHtml(totals: MetricTotals): string {
  const savings = totals.thisMonthIncome - totals.thisMonthExpenses;
  const savingsRate = totals.thisMonthIncome > 0
    ? (savings / totals.thisMonthIncome * 100).toFixed(1)
    : '0.0';

  const netClass = totals.netBalance >= 0 ? 'income' : 'expense';
  const savingsClass = savings >= 0 ? 'income' : 'expense';

  return `
    <div class="metrics-grid">
      <article class="metric-card">
        <span class="metric-label">Net Balance</span>
        <span class="metric-value ${netClass}">${formatAmount(Math.abs(totals.netBalance))}</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">This Month Income</span>
        <span class="metric-value income">${formatAmount(totals.thisMonthIncome)}</span>
        <span class="metric-sublabel">${totals.incomeTxCount} transaction${totals.incomeTxCount !== 1 ? 's' : ''}</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">This Month Expenses</span>
        <span class="metric-value expense">${formatAmount(totals.thisMonthExpenses)}</span>
        <span class="metric-sublabel">${totals.expenseTxCount} transaction${totals.expenseTxCount !== 1 ? 's' : ''}</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">Net Savings</span>
        <span class="metric-value ${savingsClass}">${formatAmount(Math.abs(savings))}</span>
        <span class="metric-sublabel">${savingsRate}% savings rate</span>
      </article>
    </div>`;
}
