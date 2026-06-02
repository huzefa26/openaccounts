import { useState, useRef, useEffect } from 'react';
import Badge from './Badge';
import { getAccountColor } from '../../constants/accountColors';

export default function CategorySelect({ value, onChange, options, placeholder }) {
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

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-surface border border-border rounded-md hover:border-border-strong transition-colors duration-base w-full text-left"
      >
        {selected ? (
          <span className="flex items-center gap-1.5 flex-1 min-w-0">
            <Badge type={selected.type} />
            <span className="truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="flex-1 text-text-disabled">{placeholder || 'Select...'}</span>
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
          className={`text-text-tertiary flex-shrink-0 transition-transform duration-base ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-surface border border-border rounded-md shadow-pop z-50">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-tertiary">No categories</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex items-center gap-1.5 w-full px-3 py-2 text-sm text-left transition-colors duration-base hover:bg-accent-light ${
                    isSelected ? 'bg-accent-light font-medium' : ''
                  }`}
                >
                  <Badge type={opt.type} />
                  <span className={`truncate ${getAccountColor(opt.type)}`}>{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
