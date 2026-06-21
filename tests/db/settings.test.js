import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import * as dbSettings from '../../src/db/settings';
import { buildSetting } from '../helpers/factories';

describe('settings db', () => {
  beforeEach(async () => {
    await resetDB();
    await initDB();
  });

  it('set overwrites an existing key', async () => {
    await dbSettings.set('theme', '"dark"');
    await dbSettings.set('theme', '"light"');
    const val = await dbSettings.get('theme');
    expect(val).toBe('"light"');
  });

  it('get returns undefined for missing keys', async () => {
    const val = await dbSettings.get('nonexistent');
    expect(val).toBeUndefined();
  });

  it('getAll returns all settings', async () => {
    await dbSettings.set('a', '1');
    await dbSettings.set('b', '2');
    const all = await dbSettings.getAll();
    expect(all).toHaveLength(2);
  });
});
