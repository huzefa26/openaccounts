import useBalance from '../../hooks/useBalance';

export default function CategoryCard({ category, depth, onEdit, onDelete }) {
  const balance = useBalance(category.id);
  const indent = depth * 20;

  const balanceDisplay = Object.keys(balance).length > 0
    ? Object.entries(balance)
        .map(([currency, amount]) => `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`)
        .join(', ')
    : '\u2014';

  return (
    <div className="flex items-start justify-between gap-2 px-4 py-3">
      <div className="flex-1 min-w-0" style={{ marginLeft: `${indent}px` }}>
        <p className={`text-sm ${depth === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
          {category.name}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {category.opening_balance ? (
            <span className="text-xs text-text-tertiary font-numeric">
              Opening: {Number(category.opening_balance).toLocaleString()}
            </span>
          ) : null}
          <span className="text-xs text-text-tertiary font-numeric">
            Balance: {balanceDisplay}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!category.is_system && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
