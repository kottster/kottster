import { describe, it, expect } from '@jest/globals';
import { getPageKeyFromPathname } from '../../lib/utils/getPageKeyFromPathname';

describe('getPageKeyFromPathname', () => {
  it('extracts page key from basic pathname', () => {
    expect(getPageKeyFromPathname('/dashboard/home')).toBe('dashboard');
  });

  it('extracts page key from pathname with base path removed', () => {
    expect(getPageKeyFromPathname('/admin/users/', '/admin/')).toBe('users');
    expect(getPageKeyFromPathname('/admin/users/', '/admin')).toBe('users');
    expect(getPageKeyFromPathname('/admin/users/', 'admin/')).toBe('users');
  });

  it('handles trailing slash', () => {
    expect(getPageKeyFromPathname('/table/users/')).toBe('table');
  });

  it('returns undefined for special pages', () => {
    expect(getPageKeyFromPathname('/-/data-sources')).toBeUndefined();
  });

  it('handles root path', () => {
    expect(getPageKeyFromPathname('/')).toBe('');
  });

  it('handles single segment', () => {
    expect(getPageKeyFromPathname('/dashboard')).toBe('dashboard');
  });
});