export default function BalanceIndicator({ balances, animating, onAnimEnd }) {
  const codes = Object.keys(balances);
  if (codes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 px-1">
      {codes.map((code) => {
        const { credits, debits } = balances[code];
        const balanced = credits === debits;
        const isAnimating = animating.has(code);

        const lineAnimClass = isAnimating && balanced ? 'animate-pulse-once' : '';
        const symbolAnimClass = isAnimating && balanced ? 'animate-fade-cross' : '';

        return (
          <div
            key={code}
            onAnimationEnd={() => onAnimEnd(code)}
            className={`flex items-center gap-1.5 text-sm ${lineAnimClass}`}
          >
            <span className="text-text-secondary">Credits</span>
            <span className="font-numeric text-text-primary">{credits.toFixed(2)}</span>
            <span className={`font-numeric text-base leading-none ${symbolAnimClass} ${balanced ? 'text-income' : 'text-expense'}`}>
              {balanced ? '=' : '\u2260'}
            </span>
            <span className="text-text-secondary">Debits</span>
            <span className="font-numeric text-text-primary">{debits.toFixed(2)}</span>
            <span className="text-xs font-numeric text-text-tertiary">{code}</span>
          </div>
        );
      })}
    </div>
  );
}
