import { describe, test, expect, beforeEach, vi } from 'vitest';

const loadHelper = async (cdnEnabled: boolean) => {
  vi.doMock('../config/cdnConfig', () => ({
    isCDNEnabled: () => cdnEnabled,
    getCDNImageUrl: (path: string) => {
      if (!cdnEnabled) return path;
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path.replace('https://systemnextit.com', 'https://images.systemnextit.com');
      const normalized = path.startsWith('/') ? path : `/${path}`;
      return `https://images.systemnextit.com${normalized}`;
    }
  }));

  const mod = await import('./imageUrlHelper');
  return mod;
};

describe('imageUrlHelper', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetModules();
    vi.unmock('../config/cdnConfig');
  });

  describe('normalizeImageUrl', () => {
    test('returns empty string for null or undefined', async () => {
      const { normalizeImageUrl } = await loadHelper(false);
      expect(normalizeImageUrl(null)).toBe('');
      expect(normalizeImageUrl(undefined)).toBe('');
      expect(normalizeImageUrl('')).toBe('');
    });

    test('returns data URIs as-is', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const { normalizeImageUrl } = await loadHelper(false);
      expect(normalizeImageUrl(dataUrl)).toBe(dataUrl);
    });

    test('trims and normalizes base64 data URIs with whitespace', async () => {
      const messy = "  'data:image/webp;base64,QUJD\nREVG\t'  ";
      const { normalizeImageUrl } = await loadHelper(false);
      expect(normalizeImageUrl(messy)).toBe('data:image/webp;base64,QUJDREVG');
    });

    test('handles relative URLs starting with /uploads', async () => {
      const relativeUrl = '/uploads/images/carousel/tenant1/image.webp';
      const { normalizeImageUrl } = await loadHelper(false);
      const result = normalizeImageUrl(relativeUrl);
      expect(result).toContain('/uploads/images/carousel/tenant1/image.webp');
    });

    test('handles relative URLs without leading slash', async () => {
      const relativeUrl = 'uploads/images/test.jpg';
      const { normalizeImageUrl } = await loadHelper(false);
      const result = normalizeImageUrl(relativeUrl);
      expect(result).toContain('/uploads/images/test.jpg');
    });

    test('returns systemnextit.com URLs as-is', async () => {
      const url = 'https://systemnextit.com/uploads/images/test.jpg';
      const { normalizeImageUrl } = await loadHelper(false);
      expect(normalizeImageUrl(url)).toBe(url);
    });

    test('returns full URLs with http/https as-is', async () => {
      const url = 'https://example.com/image.jpg';
      const { normalizeImageUrl } = await loadHelper(false);
      expect(normalizeImageUrl(url)).toBe(url);
    });

    test('converts cdn.systemnextit.com to production URL when CDN is disabled', async () => {
      const { normalizeImageUrl } = await loadHelper(false);
      const cdnUrl = 'https://cdn.systemnextit.com/uploads/images/test.jpg';
      const result = normalizeImageUrl(cdnUrl);
      expect(result).toBe('https://systemnextit.com/uploads/images/test.jpg');
    });

    test('keeps CDN URLs and CDN-ifies upload URLs when CDN is enabled', async () => {
      const { normalizeImageUrl } = await loadHelper(true);
      const cdnUrl = 'https://cdn.systemnextit.com/uploads/images/test.jpg';
      expect(normalizeImageUrl(cdnUrl)).toBe(cdnUrl);

      const originUrl = 'https://systemnextit.com/uploads/images/test.jpg';
      expect(normalizeImageUrl(originUrl)).toBe('https://images.systemnextit.com/uploads/images/test.jpg');
      expect(normalizeImageUrl('/uploads/images/test.jpg')).toBe('https://images.systemnextit.com/uploads/images/test.jpg');
    });
  });

  describe('getOptimizedImageUrl', () => {
    test('returns empty string for null or undefined', async () => {
      const { getOptimizedImageUrl } = await loadHelper(false);
      expect(getOptimizedImageUrl(null)).toBe('');
      expect(getOptimizedImageUrl(undefined)).toBe('');
    });

    test('returns data URIs as-is', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const { getOptimizedImageUrl } = await loadHelper(false);
      expect(getOptimizedImageUrl(dataUrl)).toBe(dataUrl);
    });

    test('adds optimization params for systemnextit.com URLs', async () => {
      const url = 'https://systemnextit.com/uploads/images/test.jpg';
      const { getOptimizedImageUrl } = await loadHelper(false);
      const result = getOptimizedImageUrl(url, 'medium');
      expect(result).toContain('w=400');
      expect(result).toContain('q=75');
    });

    test('uses correct size presets', async () => {
      const url = 'https://systemnextit.com/uploads/images/test.jpg';
      const { getOptimizedImageUrl } = await loadHelper(false);
      
      const thumb = getOptimizedImageUrl(url, 'thumb');
      expect(thumb).toContain('w=100');
      expect(thumb).toContain('q=60');
      
      const small = getOptimizedImageUrl(url, 'small');
      expect(small).toContain('w=200');
      expect(small).toContain('q=70');
      
      const large = getOptimizedImageUrl(url, 'large');
      expect(large).toContain('w=800');
      expect(large).toContain('q=80');
    });

    test('returns external URLs as-is', async () => {
      const externalUrl = 'https://example.com/image.jpg';
      const { getOptimizedImageUrl } = await loadHelper(false);
      const result = getOptimizedImageUrl(externalUrl);
      expect(result).toBe(externalUrl);
    });
  });
});
