/**
 * CDN Configuration
 * 
 * This module provides centralized CDN configuration for static assets and images.
 * Supports multiple CDN providers: Cloudflare, CloudFront (AWS), BunnyCDN, or custom.
 * 
 * Usage:
 * 1. Set VITE_CDN_ENABLED=true in your .env file
 * 2. Set VITE_CDN_BASE_URL to your CDN URL (e.g., https://cdn.yourdomain.com)
 * 3. Optionally configure provider-specific settings
 */

export type CDNProvider = 'cloudflare' | 'cloudfront' | 'bunnycdn' | 'custom' | 'none';

export interface CDNConfig {
  enabled: boolean;
  provider: CDNProvider;
  baseUrl: string;
  imageBaseUrl: string;
  staticBaseUrl: string;
  
  // Image transformation settings (provider-specific)
  imageTransformation: {
    enabled: boolean;
    quality: number;
    format: 'auto' | 'webp' | 'avif' | 'original';
    fit: 'cover' | 'contain' | 'scale-down' | 'crop';
  };
  
  // Cache settings
  cache: {
    defaultMaxAge: number;
    imageMaxAge: number;
    staticMaxAge: number;
  };
}

// Default CDN configuration
const defaultConfig: CDNConfig = {
  enabled: false,
  provider: 'none',
  baseUrl: '',
  imageBaseUrl: '',
  staticBaseUrl: '',
  imageTransformation: {
    enabled: false,
    quality: 95,
    format: 'auto',
    fit: 'cover',
  },
  cache: {
    defaultMaxAge: 86400, // 1 day
    imageMaxAge: 31536000, // 1 year
    staticMaxAge: 31536000, // 1 year
  },
};

/**
 * Get CDN configuration from environment variables
 */
export function getCDNConfig(): CDNConfig {
  const enabled = import.meta.env.VITE_CDN_ENABLED === 'true';
  const provider = (import.meta.env.VITE_CDN_PROVIDER as CDNProvider) || 'none';
  const baseUrl = import.meta.env.VITE_CDN_BASE_URL || '';
  
  if (!enabled || !baseUrl) {
    return defaultConfig;
  }
  
  return {
    enabled,
    provider,
    baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
    imageBaseUrl: import.meta.env.VITE_CDN_IMAGE_URL || baseUrl,
    staticBaseUrl: import.meta.env.VITE_CDN_STATIC_URL || baseUrl,
    imageTransformation: {
      enabled: import.meta.env.VITE_CDN_IMAGE_TRANSFORM === 'true',
      quality: parseInt(import.meta.env.VITE_CDN_IMAGE_QUALITY || '80', 10),
      format: (import.meta.env.VITE_CDN_IMAGE_FORMAT as CDNConfig['imageTransformation']['format']) || 'auto',
      fit: (import.meta.env.VITE_CDN_IMAGE_FIT as CDNConfig['imageTransformation']['fit']) || 'cover',
    },
    cache: {
      defaultMaxAge: parseInt(import.meta.env.VITE_CDN_CACHE_DEFAULT || '86400', 10),
      imageMaxAge: parseInt(import.meta.env.VITE_CDN_CACHE_IMAGES || '31536000', 10),
      staticMaxAge: parseInt(import.meta.env.VITE_CDN_CACHE_STATIC || '31536000', 10),
    },
  };
}

// Cache the config to avoid repeated env lookups
let cachedConfig: CDNConfig | null = null;

/**
 * Get cached CDN configuration
 */
export function getConfig(): CDNConfig {
  if (!cachedConfig) {
    cachedConfig = getCDNConfig();
  }
  return cachedConfig;
}

/**
 * Transform image URL options based on CDN provider
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop';
}

/**
 * Generate CDN URL for an image with optional transformations
 * 
 * @param imagePath - The original image path (can be relative or absolute URL)
 * @param options - Image transformation options
 * @returns The CDN URL with transformation parameters
 */
export function getCDNImageUrl(imagePath: string, options?: ImageTransformOptions): string {
  if (!imagePath) return '';
  
  const config = getConfig();
  
  // If CDN is not enabled, return original path
  if (!config.enabled) {
    return imagePath;
  }
  
  // Handle already fully qualified URLs
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Check if it's from our origin and should be CDN-ified
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    if (apiBaseUrl && imagePath.startsWith(apiBaseUrl)) {
      // Replace origin with CDN URL
      imagePath = imagePath.replace(apiBaseUrl, '');
    } else {
      // External URL, return as-is
      return imagePath;
    }
  }
  
  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Build the CDN URL based on provider
  const baseUrl = config.imageBaseUrl || config.baseUrl;
  
  // Add transformation parameters if enabled
  if (config.imageTransformation.enabled && options) {
    return buildTransformUrl(config.provider, baseUrl, normalizedPath, options);
  }
  
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Build transformation URL based on CDN provider
 */
function buildTransformUrl(
  provider: CDNProvider,
  baseUrl: string,
  path: string,
  options: ImageTransformOptions
): string {
  switch (provider) {
    case 'cloudflare':
      return buildCloudflareUrl(baseUrl, path, options);
    case 'cloudfront':
      return buildCloudFrontUrl(baseUrl, path, options);
    case 'bunnycdn':
      return buildBunnyCDNUrl(baseUrl, path, options);
    default:
      return buildGenericUrl(baseUrl, path, options);
  }
}

/**
 * Cloudflare Image Resizing URL format
 * https://developers.cloudflare.com/images/image-resizing/url-format/
 */
function buildCloudflareUrl(baseUrl: string, path: string, options: ImageTransformOptions): string {
  const params: string[] = [];
  
  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.quality) params.push(`quality=${options.quality}`);
  if (options.format && options.format !== 'auto') params.push(`format=${options.format}`);
  if (options.fit) params.push(`fit=${options.fit}`);
  
  if (params.length === 0) {
    return `${baseUrl}${path}`;
  }
  
  // Cloudflare format: /cdn-cgi/image/width=400,quality=80/path/to/image.jpg
  return `${baseUrl}/cdn-cgi/image/${params.join(',')}${path}`;
}

/**
 * CloudFront with Lambda@Edge or Image Handler URL format
 * https://aws.amazon.com/solutions/implementations/serverless-image-handler/
 */
function buildCloudFrontUrl(baseUrl: string, path: string, options: ImageTransformOptions): string {
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format && options.format !== 'auto') params.append('fm', options.format);
  if (options.fit) params.append('fit', options.fit);
  
  const queryString = params.toString();
  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * BunnyCDN Image Processing URL format
 * https://docs.bunny.net/docs/stream-image-processing
 */
function buildBunnyCDNUrl(baseUrl: string, path: string, options: ImageTransformOptions): string {
  const params = new URLSearchParams();
  
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format && options.format !== 'auto') params.append('format', options.format);
  
  const queryString = params.toString();
  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Generic CDN URL with query parameters (works with most CDNs)
 */
function buildGenericUrl(baseUrl: string, path: string, options: ImageTransformOptions): string {
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format && options.format !== 'auto') params.append('f', options.format);
  if (options.fit) params.append('fit', options.fit);
  
  const queryString = params.toString();
  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Get CDN URL for static assets (JS, CSS, fonts)
 */
export function getCDNStaticUrl(assetPath: string): string {
  if (!assetPath) return '';
  
  const config = getConfig();
  
  if (!config.enabled) {
    return assetPath;
  }
  
  // Handle already fully qualified URLs
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${config.staticBaseUrl || config.baseUrl}${normalizedPath}`;
}

/**
 * Check if CDN is properly configured
 */
export function isCDNEnabled(): boolean {
  return getConfig().enabled;
}

/**
 * Get the CDN provider name
 */
export function getCDNProvider(): CDNProvider {
  return getConfig().provider;
}

export default {
  getConfig,
  getCDNImageUrl,
  getCDNStaticUrl,
  isCDNEnabled,
  getCDNProvider,
};
