import { useState } from 'react';
import Input from '../ui/Input';
import MultiSelect from '../ui/MultiSelect';

const TYPE_OPTIONS = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'equity', label: 'Equity' },
];

export default function FilterBar({ filters, categories, currencies, onFilterChange, onClear }) {
  const [open, setOpen] = useState(false);

  function handle(key, value) {
    onFilterChange(key, value);
  }

  const hasActiveFilters = Object.values(filters).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== null && v !== undefined;
  });

  return (
    <div className="border border-border rounded-md bg-surface">
      <div className="flex items-center justify-between px-4 py-2.5 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-base"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="12" y1="18" x2="12" y2="18" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="text-xs font-medium text-text-on-accent bg-accent px-1.5 py-0.5 rounded-full leading-none">
              !
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors duration-base"
          >
            Clear
          </button>
        )}
      </div>

      <div className={`px-4 pb-4 pt-2 ${open || 'hidden'} md:block`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Input
              label="Date from"
              name="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handle('dateFrom', e.target.value)}
            />
          </div>
          <div className="w-40">
            <Input
              label="Date to"
              name="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handle('dateTo', e.target.value)}
            />
          </div>
          <div className="w-32">
            <Input
              label="Amount min"
              name="amountMin"
              type="number"
              value={filters.amountMin}
              onChange={(e) => handle('amountMin', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="w-32">
            <Input
              label="Amount max"
              name="amountMax"
              type="number"
              value={filters.amountMax}
              onChange={(e) => handle('amountMax', e.target.value)}
              placeholder="99999"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mt-3">
          <div className="w-52">
            <MultiSelect
              label="Category"
              options={categories
                .filter((c) => !c.is_system)
                .map((c) => ({ value: c.id, label: c.name, type: c.type }))}
              selected={filters.categoryIds}
              onChange={(values) => handle('categoryIds', values)}
              placeholder="All categories"
            />
          </div>
          <div className="w-40">
            <MultiSelect
              label="Type"
              options={TYPE_OPTIONS}
              selected={filters.typeIds}
              onChange={(values) => handle('typeIds', values)}
              placeholder="All types"
            />
          </div>
          <div className="w-40">
            <MultiSelect
              label="Currency"
              options={currencies.map((c) => ({ value: c.code, label: c.code }))}
              selected={filters.currencyCodes}
              onChange={(values) => handle('currencyCodes', values)}
              placeholder="All currencies"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <Input
              label="Description"
              name="description"
              value={filters.description}
              onChange={(e) => handle('description', e.target.value)}
              placeholder="Search description..."
            />
          </div>
          <div className="hidden md:block pt-1.5">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClear}
                className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-base whitespace-nowrap"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
