import { useState, useMemo } from 'react';

function formatAmount(amount) {
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function catName(categories, id) {
  return categories.find((c) => c.id === id)?.name || id.slice(0, 8);
}

export default function LedgerTable({
  transactions,
  lines,
  categories,
  onEdit,
  onDelete,
  page,
  totalPages,
  onPageChange,
  totalItems,
}) {
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  const linesByTx = useMemo(() => {
    const map = {};
    for (const line of lines) {
      if (!map[line.transaction_id]) map[line.transaction_id] = [];
      map[line.transaction_id].push(line);
    }
    return map;
  }, [lines]);

  function toggleNote(id) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (transactions.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-sm text-text-tertiary">
        No transactions found.
      </div>
    );
  }

  const startItem = (page - 1) * 20 + 1;
  const endItem = Math.min(page * 20, totalItems);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg">
            <th scope="col" className="py-2.5 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-24">Date</th>
            <th scope="col" className="py-2.5 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
            <th scope="col" className="py-2.5 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-32">Notes</th>
            <th scope="col" className="py-2.5 px-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-48">From (credits)</th>
            <th scope="col" className="py-2.5 px-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-48">To (debits)</th>
            <th scope="col" className="py-2.5 px-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const txLines = linesByTx[tx.id] || [];
            const credits = txLines.filter((l) => l.entry_type === 'credit');
            const debits = txLines.filter((l) => l.entry_type === 'debit');
            const noteExpanded = expandedNotes.has(tx.id);
            const isDeleting = deletingId === tx.id;

            return (
              <tr key={tx.id} className={`border-b border-border ${isDeleting ? 'bg-expense-bg' : 'hover:bg-accent-light/40'} transition-colors duration-base`}>
                <td className="py-2.5 px-3 text-sm font-numeric text-text-primary whitespace-nowrap">{tx.date}</td>
                <td className="py-2.5 px-3 text-sm text-text-primary">{tx.description}</td>
                <td className="py-2.5 px-3 text-sm text-text-tertiary">
                  {tx.notes ? (
                    <button
                      type="button"
                      onClick={() => toggleNote(tx.id)}
                      className="text-left leading-snug hover:text-text-primary transition-colors duration-base"
                    >
                      <span className={noteExpanded ? '' : 'line-clamp-1'}>{tx.notes}</span>
                    </button>
                  ) : (
                    <span className="text-text-disabled">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-sm font-numeric text-right">
                  {credits.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {credits.map((l) => (
                        <div key={l.id} className="flex items-center justify-end gap-2">
                          <span className="text-xs text-text-secondary truncate max-w-[100px]" title={catName(categories, l.category_id)}>
                            {catName(categories, l.category_id)}
                          </span>
                          <span className="text-xs text-text-tertiary w-8 text-right">{l.currency}</span>
                          <span className="text-income w-24 text-right">{formatAmount(l.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-text-disabled">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-sm font-numeric text-right">
                  {debits.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {debits.map((l) => (
                        <div key={l.id} className="flex items-center justify-end gap-2">
                          <span className="text-xs text-text-secondary truncate max-w-[100px]" title={catName(categories, l.category_id)}>
                            {catName(categories, l.category_id)}
                          </span>
                          <span className="text-xs text-text-tertiary w-8 text-right">{l.currency}</span>
                          <span className="text-expense w-24 text-right">{formatAmount(l.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-text-disabled">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(tx, txLines)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-text-primary hover:bg-accent-light transition-colors duration-base"
                      aria-label={`Edit transaction ${tx.description}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => { isDeleting ? setDeletingId(null) : setDeletingId(tx.id); }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-expense hover:bg-expense-bg transition-colors duration-base"
                      aria-label={`Delete transaction ${tx.description}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg text-sm">
          <span className="text-text-secondary">
            Showing {startItem}–{endItem} of {totalItems}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-light rounded-md transition-colors duration-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="text-sm text-text-secondary font-numeric">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-light rounded-md transition-colors duration-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="px-4 py-3 border-t border-border bg-expense-bg">
          <p className="text-sm text-text-primary mb-2">
            Delete this transaction? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onDelete(deletingId); setDeletingId(null); }}
              className="px-3 py-1.5 text-sm font-medium bg-expense text-white rounded-md hover:opacity-90 transition-colors duration-base"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface rounded-md transition-colors duration-base"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
