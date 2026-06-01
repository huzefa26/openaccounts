export default function Button({ children, variant = 'primary', disabled, onClick, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-base disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent text-text-on-accent hover:bg-accent-hover',
    ghost: 'bg-transparent text-text-secondary hover:bg-accent-light hover:text-text-primary',
    danger: 'bg-expense text-white hover:opacity-90',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
