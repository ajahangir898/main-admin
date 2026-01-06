/**
 * CDN Configuration Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock import.meta.env
const mockEnv = {
  VITE_CDN_ENABLED: 'false',
  VITE_CDN_PROVIDER: 'none',
  VITE_CDN_BASE_URL: '',
  VITE_CDN_IMAGE_URL: '',
  VITE_CDN_STATIC_URL: '',
  VITE_CDN_IMAGE_TRANSFORM: 'false',
  VITE_CDN_IMAGE_QUALITY: '80',
  VITE_CDN_IMAGE_FORMAT: 'auto',
  VITE_CDN_IMAGE_FIT: 'cover',
  VITE_API_BASE_URL: 'https://api.example.com',
};

vi.mock('../config/cdnConfig', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    getCDNConfig: () => ({
      enabled: mockEnv.VITE_CDN_ENABLED === 'true',
      provider: mockEnv.VITE_CDN_PROVIDER as any,
      baseUrl: mockEnv.VITE_CDN_BASE_URL,
      imageBaseUrl: mockEnv.VITE_CDN_IMAGE_URL || mockEnv.VITE_CDN_BASE_URL,
      staticBaseUrl: mockEnv.VITE_CDN_STATIC_URL || mockEnv.VITE_CDN_BASE_URL,
      imageTransformation: {
        enabled: mockEnv.VITE_CDN_IMAGE_TRANSFORM === 'true',
        quality: parseInt(mockEnv.VITE_CDN_IMAGE_QUALITY, 10),
        format: mockEnv.VITE_CDN_IMAGE_FORMAT as any,
        fit: mockEnv.VITE_CDN_IMAGE_FIT as any,
      },
      cache: {
        defaultMaxAge: 86400,
        imageMaxAge: 31536000,
        staticMaxAge: 31536000,
      },
    }),
    getConfig: () => ({
      enabled: mockEnv.VITE_CDN_ENABLED === 'true',
      provider: mockEnv.VITE_CDN_PROVIDER as any,
      baseUrl: mockEnv.VITE_CDN_BASE_URL,
      imageBaseUrl: mockEnv.VITE_CDN_IMAGE_URL || mockEnv.VITE_CDN_BASE_URL,
      staticBaseUrl: mockEnv.VITE_CDN_STATIC_URL || mockEnv.VITE_CDN_BASE_URL,
      imageTransformation: {
        enabled: mockEnv.VITE_CDN_IMAGE_TRANSFORM === 'true',
        quality: parseInt(mockEnv.VITE_CDN_IMAGE_QUALITY, 10),
        format: mockEnv.VITE_CDN_IMAGE_FORMAT as any,
        fit: mockEnv.VITE_CDN_IMAGE_FIT as any,
      },
      cache: {
        defaultMaxAge: 86400,
        imageMaxAge: 31536000,
        staticMaxAge: 31536000,
      },
    }),
    isCDNEnabled: () => mockEnv.VITE_CDN_ENABLED === 'true',
    getCDNProvider: () => mockEnv.VITE_CDN_PROVIDER,
  };
});

describe('CDN Configuration', () => {
  beforeEach(() => {
    // Reset mock env to defaults
    mockEnv.VITE_CDN_ENABLED = 'false';
    mockEnv.VITE_CDN_PROVIDER = 'none';
    mockEnv.VITE_CDN_BASE_URL = '';
    mockEnv.VITE_CDN_IMAGE_URL = '';
    mockEnv.VITE_CDN_STATIC_URL = '';
    mockEnv.VITE_CDN_IMAGE_TRANSFORM = 'false';
  });

  describe('when CDN is disabled', () => {
    it('should return original image URL', async () => {
      const { getCDNImageUrl, isCDNEnabled } = await import('../config/cdnConfig');
      
      expect(isCDNEnabled()).toBe(false);
      
      const imageUrl = '/uploads/images/product.jpg';
      const result = getCDNImageUrl(imageUrl);
      
      // When CDN is disabled, should return original URL
      expect(result).toBe(imageUrl);
    });

    it('should return original static URL', async () => {
      const { getCDNStaticUrl, isCDNEnabled } = await import('../config/cdnConfig');
      
      expect(isCDNEnabled()).toBe(false);
      
      const staticUrl = '/assets/script.js';
      const result = getCDNStaticUrl(staticUrl);
      
      // When CDN is disabled, should return original URL
      expect(result).toBe(staticUrl);
    });
  });

  describe('when CDN is enabled with Cloudflare', () => {
    beforeEach(() => {
      mockEnv.VITE_CDN_ENABLED = 'true';
      mockEnv.VITE_CDN_PROVIDER = 'cloudflare';
      mockEnv.VITE_CDN_BASE_URL = 'https://cdn.example.com';
      mockEnv.VITE_CDN_IMAGE_TRANSFORM = 'true';
    });

    it('should report CDN as enabled', async () => {
      const { isCDNEnabled, getCDNProvider } = await import('../config/cdnConfig');
      
      expect(isCDNEnabled()).toBe(true);
      expect(getCDNProvider()).toBe('cloudflare');
    });
  });

  describe('URL transformations', () => {
    it('should handle empty URLs gracefully', async () => {
      const { getCDNImageUrl, getCDNStaticUrl } = await import('../config/cdnConfig');
      
      expect(getCDNImageUrl('')).toBe('');
      expect(getCDNStaticUrl('')).toBe('');
    });
  });

  describe('Configuration types', () => {
    it('should export correct types', async () => {
      const { getConfig } = await import('../config/cdnConfig');
      
      const config = getConfig();
      
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.provider).toBe('string');
      expect(typeof config.baseUrl).toBe('string');
      expect(typeof config.imageTransformation.quality).toBe('number');
    });
  });
});
