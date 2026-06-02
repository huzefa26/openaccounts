import useBalance from '../../hooks/useBalance';
import Badge from '../ui/Badge';
import { getAccountColor } from '../../constants/accountColors';

export default function CategoryRow({ category, children, onEdit, onDelete, depth = 0 }) {
  const balance = useBalance(category.id);
  const indent = depth * 24;

  const balanceDisplay = Object.keys(balance).length > 0
    ? Object.entries(balance)
        .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`)
        .join(', ')
    : '—';

  return (
    <>
      <tr
        className={`group border-b border-border hover:bg-accent-light/40 transition-colors duration-base ${
          depth === 0 ? 'bg-surface' : ''
        }`}
      >
        <td className="py-3 pr-4 text-sm whitespace-nowrap" style={{ paddingLeft: `${16 + indent}px` }}>
          <span className={`inline-flex items-center gap-2 ${depth > 0 ? 'text-text-secondary' : 'font-medium text-text-primary'}`}>
            <Badge type={category.type} />
            {category.name}
          </span>
        </td>
        <td className="py-3 px-4 text-sm font-numeric text-right text-text-secondary whitespace-nowrap">
          {category.opening_balance ? category.opening_balance.toLocaleString() : '—'}
        </td>
        <td className="py-3 px-4 text-sm font-numeric text-right text-text-tertiary whitespace-nowrap">
          {balanceDisplay}
        </td>
        <td className="py-3 px-2 text-right whitespace-nowrap">
          {!category.is_system && (
            <button
              onClick={() => onEdit(category)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-text-primary hover:bg-accent-light transition-colors duration-base"
              aria-label={`Edit ${category.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </td>
        <td className="py-3 pl-2 text-right whitespace-nowrap">
          {!category.is_system && (
            <button
              onClick={() => onDelete(category)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-expense hover:bg-expense-bg transition-colors duration-base"
              aria-label={`Delete ${category.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </td>
      </tr>
      {children}
    </>
  );
}
