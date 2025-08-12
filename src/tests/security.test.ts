// Testes básicos de segurança
import { sanitizeInput, sanitizeEmail, validateEmail, validatePassword } from '../utils/security';
import { rateLimiter } from '../utils/rateLimit';

describe('Security Utils', () => {
  test('sanitizeInput removes dangerous content', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
  });

  test('sanitizeEmail cleans email', () => {
    expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    expect(sanitizeEmail(' user@domain.com ')).toBe('user@domain.com');
  });

  test('validateEmail works correctly', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  test('validatePassword enforces rules', () => {
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });
});

describe('Rate Limiter', () => {
  test('allows requests within limit', () => {
    const key = 'test-user-1';
    expect(rateLimiter.isAllowed(key, 3)).toBe(true);
    expect(rateLimiter.isAllowed(key, 3)).toBe(true);
    expect(rateLimiter.isAllowed(key, 3)).toBe(true);
  });

  test('blocks requests over limit', () => {
    const key = 'test-user-2';
    rateLimiter.isAllowed(key, 2);
    rateLimiter.isAllowed(key, 2);
    expect(rateLimiter.isAllowed(key, 2)).toBe(false);
  });
});