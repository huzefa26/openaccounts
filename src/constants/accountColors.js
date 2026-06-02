const COLORS = {
  asset: {
    light: 'bg-teal-500/10 text-teal-700',
    dark: 'dark:text-teal-400',
  },
  liability: {
    light: 'bg-rose-500/10 text-rose-700',
    dark: 'dark:text-rose-400',
  },
  income: {
    light: 'bg-emerald-500/10 text-emerald-700',
    dark: 'dark:text-emerald-400',
  },
  expense: {
    light: 'bg-amber-500/10 text-amber-700',
    dark: 'dark:text-amber-400',
  },
  equity: {
    light: 'bg-violet-500/10 text-violet-700',
    dark: 'dark:text-violet-400',
  },
};

export const ACCOUNT_COLORS = Object.fromEntries(
  Object.entries(COLORS).map(([type, c]) => [type, c.light]),
);

export const ACCOUNT_COLORS_DARK = Object.fromEntries(
  Object.entries(COLORS).map(([type, c]) => [type, c.dark]),
);

export function getAccountColor(type) {
  const c = COLORS[type];
  if (!c) return '';
  return `${c.light} ${c.dark}`.trim();
}
