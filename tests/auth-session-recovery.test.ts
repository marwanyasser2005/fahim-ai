import { describe, expect, it } from 'vitest';
import { isExpiredJwtError, isSessionExpiring } from '../src/lib/supabase/client';

describe('Supabase session recovery', () => {
  it('recognizes expired JWT responses without misclassifying unrelated authorization failures', () => {
    expect(isExpiredJwtError({ status: 401, message: 'JWT expired' })).toBe(true);
    expect(isExpiredJwtError({ code: 'PGRST303', message: 'Token expired' })).toBe(true);
    expect(isExpiredJwtError({ status: 401, message: 'permission denied for table profiles' })).toBe(false);
  });

  it('refreshes before expiry using a safety window', () => {
    const now = Date.parse('2026-08-14T12:00:00.000Z');
    expect(isSessionExpiring({ expires_at: now / 1000 + 60 }, now)).toBe(true);
    expect(isSessionExpiring({ expires_at: now / 1000 + 600 }, now)).toBe(false);
    expect(isSessionExpiring({ expires_at: undefined }, now)).toBe(true);
  });
});
