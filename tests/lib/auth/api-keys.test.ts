import { describe, it, expect, vi } from 'vitest';
import { generateApiKey, hashApiKey, verifyApiKey, maskApiKey, isValidApiKeyFormat } from '@/lib/auth/api-keys';

describe('API Key Utilities', () => {
  describe('generateApiKey', () => {
    it('should generate an API key with mc_ prefix', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^mc_/);
      expect(key.length).toBeGreaterThan(10);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });

    it('should generate keys with correct format', () => {
      const key = generateApiKey();
      // Format: mc_<32 chars>
      expect(key).toMatch(/^mc_[A-Za-z0-9_-]{32}$/);
    });
  });

  describe('hashApiKey', () => {
    it('should hash an API key', async () => {
      const key = generateApiKey();
      const hash = await hashApiKey(key);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(key);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for different keys', async () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      const hash1 = await hashApiKey(key1);
      const hash2 = await hashApiKey(key2);
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for same key (bcrypt uses salt)', async () => {
      const key = generateApiKey();
      const hash1 = await hashApiKey(key);
      const hash2 = await hashApiKey(key);
      // Bcrypt uses salt, so hashes will be different, but both should verify
      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      const verify1 = await verifyApiKey(key, hash1);
      const verify2 = await verifyApiKey(key, hash2);
      expect(verify1).toBe(true);
      expect(verify2).toBe(true);
    });
  });

  describe('verifyApiKey', () => {
    it('should verify a correct API key', async () => {
      const key = generateApiKey();
      const hash = await hashApiKey(key);
      const isValid = await verifyApiKey(key, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect API key', async () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      const hash = await hashApiKey(key1);
      const isValid = await verifyApiKey(key2, hash);
      expect(isValid).toBe(false);
    });

    it('should reject empty key', async () => {
      const hash = await hashApiKey(generateApiKey());
      const isValid = await verifyApiKey('', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('maskApiKey', () => {
    it('should mask a long API key', () => {
      const key = 'mc_abcdefghijklmnopqrstuvwxyz123456';
      const masked = maskApiKey(key);
      // Format: first 8 chars + asterisks + last 4 chars
      expect(masked).toMatch(/^mc_[a-z0-9_-]{1,}\*+[a-z0-9]{4}$/);
      expect(masked).not.toContain('klmnopqrstuvwxyz');
      expect(masked.startsWith('mc_abcde')).toBe(true);
      expect(masked.endsWith('3456')).toBe(true);
    });

    it('should show prefix and suffix for long keys', () => {
      const key = 'mc_123456789012345678901234567890';
      const masked = maskApiKey(key);
      expect(masked.startsWith('mc_')).toBe(true);
      expect(masked.endsWith('7890')).toBe(true);
    });

    it('should return default mask for short keys', () => {
      const key = 'mc_short';
      const masked = maskApiKey(key);
      expect(masked).toBe('mc_****');
    });
  });

  describe('isValidApiKeyFormat', () => {
    it('should validate correct API key format', () => {
      const key = generateApiKey();
      expect(isValidApiKeyFormat(key)).toBe(true);
    });

    it('should reject keys without mc_ prefix', () => {
      expect(isValidApiKeyFormat('invalid_key_123')).toBe(false);
      expect(isValidApiKeyFormat('key_12345678901234567890')).toBe(false);
    });

    it('should reject keys that are too short', () => {
      expect(isValidApiKeyFormat('mc_short')).toBe(false);
      expect(isValidApiKeyFormat('mc_')).toBe(false);
    });

    it('should accept valid format keys', () => {
      expect(isValidApiKeyFormat('mc_123456789012345678901234567890')).toBe(true);
    });
  });
});

