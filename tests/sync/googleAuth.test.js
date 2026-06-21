import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as googleAuth from '../../src/sync/googleAuth';

describe('googleAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getStoredSession', () => {
    it('returns null when no token is stored', () => {
      expect(googleAuth.getStoredSession()).toBeNull();
    });

    it('returns null when token is expired and clears storage', () => {
      localStorage.setItem('oa_access_token', 'expired_token');
      localStorage.setItem('oa_token_expiry', String(Date.now() - 1000));
      localStorage.setItem('oa_user_info', JSON.stringify({ email: 'test@test.com' }));

      const session = googleAuth.getStoredSession();
      expect(session).toBeNull();
      expect(localStorage.getItem('oa_access_token')).toBeNull();
    });

    it('returns session when all keys are present and non-expired', () => {
      const expiry = Date.now() + 3600000;
      localStorage.setItem('oa_access_token', 'valid_token');
      localStorage.setItem('oa_token_expiry', String(expiry));
      localStorage.setItem('oa_user_info', JSON.stringify({ email: 'test@test.com' }));

      const session = googleAuth.getStoredSession();
      expect(session).not.toBeNull();
      expect(session.accessToken).toBe('valid_token');
      expect(session.user.email).toBe('test@test.com');
    });
  });

  describe('isTokenExpired', () => {
    it('returns true for missing expiry', () => {
      expect(googleAuth.isTokenExpired()).toBe(true);
    });

    it('returns true when expiry is within 5 minutes', () => {
      localStorage.setItem('oa_token_expiry', String(Date.now() + 60000));
      expect(googleAuth.isTokenExpired()).toBe(true);
    });

    it('returns false when expiry is far enough ahead', () => {
      localStorage.setItem('oa_token_expiry', String(Date.now() + 600000));
      expect(googleAuth.isTokenExpired()).toBe(false);
    });
  });

  describe('clearStorage', () => {
    it('removes all three storage keys', () => {
      localStorage.setItem('oa_access_token', 'x');
      localStorage.setItem('oa_token_expiry', 'x');
      localStorage.setItem('oa_user_info', 'x');
      googleAuth.clearStorage();
      expect(localStorage.getItem('oa_access_token')).toBeNull();
      expect(localStorage.getItem('oa_token_expiry')).toBeNull();
      expect(localStorage.getItem('oa_user_info')).toBeNull();
    });
  });
});
