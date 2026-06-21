import { describe, it, expect } from 'vitest';
import { isInsufficientScopeError } from '../../src/sync/googleDrive';

describe('isInsufficientScopeError', () => {
  it('returns true for error with INSUFFICIENT_SCOPE code', () => {
    const err = new Error('test');
    err.code = 'INSUFFICIENT_SCOPE';
    expect(isInsufficientScopeError(err)).toBe(true);
  });

  it('returns false for error with other code', () => {
    const err = new Error('test');
    err.code = 'NOT_FOUND';
    expect(isInsufficientScopeError(err)).toBe(false);
  });

  it('returns false for error without code', () => {
    expect(isInsufficientScopeError(new Error('test'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isInsufficientScopeError(null)).toBe(false);
  });

  it('returns false for plain object', () => {
    expect(isInsufficientScopeError({})).toBe(false);
  });
});
