import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '@/lib/security/encryption';

describe('Encryption Utilities', () => {
  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const plaintext = 'sensitive-data';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should produce different output for same input (due to salt)', () => {
      const plaintext = 'sensitive-data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Should be different due to random salt
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted string', () => {
      const plaintext = 'sensitive-data';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle special characters', () => {
      const plaintext = 'password!@#$%^&*()';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    it('should correctly encrypt and decrypt various strings', () => {
      const testCases = [
        'simple',
        'with spaces',
        'with-special-chars!@#',
        '1234567890',
        'very-long-string-that-might-cause-issues-if-not-handled-properly',
      ];

      testCases.forEach((plaintext) => {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      });
    });
  });
});

