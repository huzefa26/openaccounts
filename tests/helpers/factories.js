export function buildCategory(overrides = {}) {
  return {
    id: 'cat_' + crypto.randomUUID(),
    name: 'Test Category',
    type: 'expense',
    parent_id: null,
    description: '',
    opening_balance: 0,
    is_system: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildTransaction(overrides = {}) {
  return {
    id: 'tx_' + crypto.randomUUID(),
    date: '2026-06-15',
    description: 'Test transaction',
    notes: '',
    is_opening_balance: false,
    opening_balance_category_id: null,
    created_at: '2026-06-15T12:00:00.000Z',
    updated_at: '2026-06-15T12:00:00.000Z',
    ...overrides,
  };
}

export function buildLine(overrides = {}) {
  return {
    id: 'line_' + crypto.randomUUID(),
    transaction_id: 'tx_' + crypto.randomUUID(),
    category_id: 'cat_' + crypto.randomUUID(),
    entry_type: 'debit',
    amount: 100,
    currency: 'USD',
    created_at: '2026-06-15T12:00:00.000Z',
    updated_at: '2026-06-15T12:00:00.000Z',
    ...overrides,
  };
}

export function buildCurrency(overrides = {}) {
  return {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    is_default: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildSetting(overrides = {}) {
  return {
    key: 'theme',
    value: JSON.stringify('light'),
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function nowISO() {
  return new Date().toISOString();
}
