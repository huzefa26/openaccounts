import { useState, useRef, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';

const TYPE_ORDER = ['asset', 'liability', 'income', 'expense', 'equity'];
const TYPE_LABELS = { asset: 'Assets', liability: 'Liabilities', income: 'Income', expense: 'Expenses', equity: 'Equity' };

export default function CategorySelect({ value, onChange, placeholder = 'Select category', categories = [] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = categories.find((c) => c.id === value);

  const grouped = useMemo(() => {
    const visible = categories.filter((c) => !c.is_system);
    const groups = {};

    for (const type of TYPE_ORDER) {
      const typeCategories = visible.filter((c) => c.type === type);
      if (typeCategories.length === 0) continue;

      const childrenMap = {};
      const roots = [];

      for (const cat of typeCategories) {
        if (cat.parent_id) {
          if (!childrenMap[cat.parent_id]) childrenMap[cat.parent_id] = [];
          childrenMap[cat.parent_id].push(cat);
        } else {
          roots.push(cat);
        }
      }

      const items = [];
      function traverse(nodes, depth, parentName) {
        nodes.sort((a, b) => a.name.localeCompare(b.name));
        for (const node of nodes) {
          items.push({
            id: node.id,
            name: node.name,
            depth,
            value: parentName ? `${node.name} ${parentName}` : node.name,
          });
          const children = childrenMap[node.id];
          if (children) traverse(children, depth + 1, node.name);
        }
      }

      traverse(roots, 0, null);
      groups[type] = items;
    }
    return groups;
  }, [categories]);

  function handleSelect(id) {
    onChange(id);
    setOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  }

  return (
    <div ref={ref} className="relative" data-categoryselect>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-surface border border-border rounded-md hover:border-border-strong transition-colors duration-base w-full text-left"
      >
        <span className={`flex-1 truncate ${selected ? 'text-text-primary' : 'text-text-disabled'}`}>
          {selected ? selected.name : placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-tertiary transition-transform duration-base flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-surface border border-border rounded-md shadow-pop z-50">
          <Command shouldFilter={true} loop>
            <div className="flex items-center gap-2 px-3 border-b border-border">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary flex-shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search categories..."
                className="flex-1 px-0 py-2 text-sm bg-transparent outline-none placeholder:text-text-tertiary"
                autoFocus
              />
            </div>

            <Command.List className="py-1">
              <Command.Empty className="px-3 py-2 text-sm text-text-tertiary">
                No categories found.
              </Command.Empty>

              {TYPE_ORDER.map((type) => {
                const group = grouped[type];
                if (!group || group.length === 0) return null;

                return (
                  <Command.Group
                    key={type}
                    heading={TYPE_LABELS[type]}
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-text-secondary [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {group.map((cat) => (
                      <Command.Item
                        key={cat.id}
                        value={cat.value}
                        onSelect={() => handleSelect(cat.id)}
                        className={`flex items-center px-3 py-1.5 text-sm cursor-pointer aria-selected:bg-accent-light transition-colors duration-base ${
                          cat.depth === 0 ? 'text-text-primary' : 'text-text-secondary pl-6'
                        }`}
                      >
                        {cat.name}
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
