import {
  isReservedUsername,
  isValidUsernameFormat,
  toUsernameSeed,
} from './username-policy';

describe('username-policy', () => {
  describe('isValidUsernameFormat', () => {
    it('accepts lowercase letters, numbers, and underscores', () => {
      expect(isValidUsernameFormat('abc')).toBe(true);
      expect(isValidUsernameFormat('abc_123')).toBe(true);
      expect(isValidUsernameFormat('a'.repeat(30))).toBe(true);
    });

    it('rejects usernames shorter than 3 characters', () => {
      expect(isValidUsernameFormat('ab')).toBe(false);
    });

    it('rejects usernames longer than 30 characters', () => {
      expect(isValidUsernameFormat('a'.repeat(31))).toBe(false);
    });

    it('rejects uppercase letters', () => {
      expect(isValidUsernameFormat('Abc123')).toBe(false);
    });

    it('rejects a leading underscore', () => {
      expect(isValidUsernameFormat('_abc')).toBe(false);
    });

    it('rejects a trailing underscore', () => {
      expect(isValidUsernameFormat('abc_')).toBe(false);
    });

    it('rejects consecutive underscores', () => {
      expect(isValidUsernameFormat('ab__c')).toBe(false);
    });

    it('rejects characters outside [a-z0-9_]', () => {
      expect(isValidUsernameFormat('ab c')).toBe(false);
      expect(isValidUsernameFormat('ab-c')).toBe(false);
      expect(isValidUsernameFormat('ab.c')).toBe(false);
      expect(isValidUsernameFormat('abc😀')).toBe(false);
    });
  });

  describe('isReservedUsername', () => {
    it('rejects reserved names case-insensitively', () => {
      expect(isReservedUsername('admin')).toBe(true);
      expect(isReservedUsername('Admin')).toBe(true);
      expect(isReservedUsername('ADMIN')).toBe(true);
      expect(isReservedUsername('settings')).toBe(true);
    });

    it('allows names that are not reserved', () => {
      expect(isReservedUsername('notreserved')).toBe(false);
    });
  });

  describe('toUsernameSeed', () => {
    it('lowercases and strips characters outside [a-z0-9_]', () => {
      expect(toUsernameSeed('AbC-123_XYZ')).toBe('abc123_xyz');
    });

    it('truncates to 20 characters', () => {
      const raw = 'a'.repeat(40);
      expect(toUsernameSeed(raw)).toBe('a'.repeat(20));
    });

    it('falls back to "user" when nothing valid remains', () => {
      expect(toUsernameSeed('---***')).toBe('user');
    });
  });
});
