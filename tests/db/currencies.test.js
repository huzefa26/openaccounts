import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import * as dbCurrencies from '../../src/db/currencies';
import { buildCurrency } from '../helpers/factories';

describe('currencies db', () => {
  beforeEach(async () => {
    await resetDB();
    await initDB();
  });

  it('creates a currency keyed by code', async () => {
    const cur = await dbCurrencies.create(buildCurrency({ code: 'EUR', name: 'Euro' }));
    expect(cur.code).toBe('EUR');
    const all = await dbCurrencies.getAll();
    expect(all.find((c) => c.code === 'EUR').name).toBe('Euro');
  });

  it('setDefaultCurrency updates the default', async () => {
    const usd = await dbCurrencies.create(buildCurrency({ code: 'USD', is_default: true }));
    const eur = await dbCurrencies.create(buildCurrency({ code: 'EUR' }));

    await dbCurrencies.update('USD', { is_default: false });
    await dbCurrencies.update('EUR', { is_default: true });

    const all = await dbCurrencies.getAll();
    expect(all.find((c) => c.code === 'USD').is_default).toBe(false);
    expect(all.find((c) => c.code === 'EUR').is_default).toBe(true);
  });

  it('del removes a currency', async () => {
    await dbCurrencies.create(buildCurrency({ code: 'GBP' }));
    await dbCurrencies.del('GBP');
    const all = await dbCurrencies.getAll();
    expect(all.find((c) => c.code === 'GBP')).toBeUndefined();
  });
});
