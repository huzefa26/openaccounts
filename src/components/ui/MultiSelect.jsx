import { useState, useRef, useEffect } from 'react';
import Badge from './Badge';

export default function MultiSelect({ label, options, selected = [], onChange, placeholder = 'All' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(value) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  }

  const selectedCount = selected.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-surface border border-border rounded-md hover:border-border-strong transition-colors duration-base w-full text-left"
      >
        <span className="flex-1 text-text-primary truncate">{label}</span>
        {selectedCount > 0 && (
          <span className="text-xs font-medium text-text-on-accent bg-accent px-1.5 py-0.5 rounded-full leading-none">
            {selectedCount}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-tertiary transition-transform duration-base ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-surface border border-border rounded-md shadow-pop z-50">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-tertiary">No options</div>
          ) : (
            options.map((opt) => {
              const isChecked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors duration-base hover:bg-accent-light ${
                    isChecked ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(opt.value)}
                    className="accent-accent w-4 h-4 rounded border-border"
                  />
                  <span className="flex items-center gap-1.5 truncate">
                    {opt.type && <Badge type={opt.type} />}
                    <span className="truncate">{opt.label}</span>
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
