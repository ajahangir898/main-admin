/**
 * Frontend Redis Cache Service
 * Provides client-side caching with Redis-inspired API
 * Uses localStorage for persistence and in-memory for performance
 */

interface CacheItem<T> {
  data: T;
  expires: number;
  created: number;
}

// Cache configuration - optimized for ULTRA FAST loading (30 days cache)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const TTL = {
  MEMORY_MS: 24 * 60 * 60 * 1000,           // 24 hours in-memory cache (session-level)
  STORAGE_MS: THIRTY_DAYS_MS,               // 30 days localStorage cache (persistent)
  API_DATA_MS: THIRTY_DAYS_MS,              // 30 days for API responses
  USER_DATA_MS: THIRTY_DAYS_MS,             // 30 days for user data
  TENANT_DATA_MS: THIRTY_DAYS_MS,           // 30 days for tenant data (instant reload)
  BOOTSTRAP_MS: THIRTY_DAYS_MS,             // 30 days for bootstrap data
  PRODUCTS_MS: THIRTY_DAYS_MS,              // 30 days for products
  CATEGORIES_MS: THIRTY_DAYS_MS,            // 30 days for categories
  WEBSITE_CONFIG_MS: THIRTY_DAYS_MS,        // 30 days for website config
};

// L1: In-memory cache (fastest)
const memoryCache = new Map<string, CacheItem<unknown>>();

// L2: localStorage cache (persistent)
const STORAGE_PREFIX = 'redis_cache_';

// Cleanup expired entries
const cleanup = () => {
  const now = Date.now();
  
  // Cleanup memory cache
  for (const [key, item] of memoryCache.entries()) {
    if (item.expires < now) {
      memoryCache.delete(key);
    }
  }
  
  // Cleanup localStorage cache
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}') as CacheItem<unknown>;
        if (item.expires && item.expires < now) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    }
  }
};

// Run cleanup every 2 minutes
setInterval(cleanup, 60 * 60 * 1000); // Run cleanup every hour (since cache is 30 days)

/**
 * Get cached data with fallback chain: memory → localStorage → null
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const now = Date.now();
  
  // L1: Check memory cache
  const memItem = memoryCache.get(key);
  if (memItem && memItem.expires > now) {
    return memItem.data as T;
  }
  memoryCache.delete(key);
  
  // L2: Check localStorage
  try {
    const storageKey = STORAGE_PREFIX + key;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const item = JSON.parse(stored) as CacheItem<T>;
      if (item.expires > now) {
        // Warm memory cache
        memoryCache.set(key, {
          data: item.data,
          expires: now + TTL.MEMORY_MS,
          created: now
        });
        return item.data;
      }
      localStorage.removeItem(storageKey);
    }
  } catch (e) {
    console.warn('[Cache] Error reading from localStorage:', e);
  }
  
  return null;
}

/**
 * Set cached data in both memory and localStorage
 */
export async function setCached<T>(
  key: string, 
  data: T, 
  ttlMs: number = TTL.API_DATA_MS
): Promise<void> {
  const now = Date.now();
  const expires = now + ttlMs;
  
  const item: CacheItem<T> = {
    data,
    expires,
    created: now
  };
  
  // L1: Set in memory
  memoryCache.set(key, item);
  
  // L2: Set in localStorage (fire and forget)
  try {
    const storageKey = STORAGE_PREFIX + key;
    localStorage.setItem(storageKey, JSON.stringify(item));
  } catch (e) {
    console.warn('[Cache] Error writing to localStorage:', e);
  }
}

/**
 * Delete cached data from both layers
 */
export async function deleteCached(key: string): Promise<void> {
  memoryCache.delete(key);
  
  try {
    const storageKey = STORAGE_PREFIX + key;
    localStorage.removeItem(storageKey);
  } catch (e) {
    console.warn('[Cache] Error deleting from localStorage:', e);
  }
}

/**
 * Clear all cache for a tenant
 */
export async function clearTenantCache(tenantId: string): Promise<void> {
  const pattern = `tenant:${tenantId}`;
  
  // Clear memory cache
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
  
  // Clear localStorage cache
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX) && key.includes(pattern)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Cache keys generator for consistency
 */
export const CacheKeys = {
  // Tenant data
  tenantBootstrap: (tenantId: string) => `tenant:${tenantId}:bootstrap`,
  tenantProducts: (tenantId: string) => `tenant:${tenantId}:products`,
  tenantOrders: (tenantId: string) => `tenant:${tenantId}:orders`,
  tenantConfig: (tenantId: string) => `tenant:${tenantId}:config`,
  tenantUsers: (tenantId: string) => `tenant:${tenantId}:users`,
  
  // User data
  userAuth: (userId: string) => `user:${userId}:auth`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  
  // API responses
  apiResponse: (endpoint: string, params?: string) => 
    `api:${endpoint}${params ? ':' + params : ''}`,
  
  // Chat data
  chatMessages: (tenantId: string) => `chat:${tenantId}:messages`,
  
  // Analytics
  analytics: (tenantId: string, period: string) => 
    `analytics:${tenantId}:${period}`,
  
  // Cart and session
  cart: (sessionId: string) => `cart:${sessionId}`,
  session: (sessionId: string) => `session:${sessionId}`,
};

/**
 * Cache with automatic TTL based on data type
 */
export async function setCachedByType<T>(
  key: string,
  data: T,
  type: 'api' | 'user' | 'tenant' | 'chat' | 'session' = 'api'
): Promise<void> {
  const ttlMap = {
    api: TTL.API_DATA_MS,
    user: TTL.USER_DATA_MS,
    tenant: TTL.TENANT_DATA_MS,
    chat: TTL.MEMORY_MS, // Chat data is very dynamic
    session: TTL.STORAGE_MS,
  };
  
  await setCached(key, data, ttlMap[type]);
}

/**
 * Get cache statistics
 */
// ...existing code...

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  memoryEntries: number;
  storageEntries: number;
  totalSize: number;
} {
  let storageEntries = 0;
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      storageEntries++;
      const value = localStorage.getItem(key) || '';
      totalSize += value.length;
    }
  }
  
  return {
    memoryEntries: memoryCache.size,
    storageEntries,
    totalSize
  };
}

/**
 * Get all cache keys with metadata
 */
export function getAllCacheKeys(): { key: string; type: string; ttl: number; size?: number }[] {
  const keys: { key: string; type: string; ttl: number; size?: number }[] = [];
  const now = Date.now();

  // Memory cache keys
  for (const [key, item] of memoryCache.entries()) {
    const ttlSeconds = Math.max(0, Math.floor((item.expires - now) / 1000));
    keys.push({
      key,
      type: 'memory',
      ttl: ttlSeconds,
    });
  }

  // localStorage cache keys
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (storageKey?.startsWith(STORAGE_PREFIX)) {
      try {
        const value = localStorage.getItem(storageKey) || '';
        const item = JSON.parse(value) as CacheItem<unknown>;
        const ttlSeconds = Math.max(0, Math.floor((item.expires - now) / 1000));
        const key = storageKey.replace(STORAGE_PREFIX, '');
        
        // Avoid duplicates (already in memory cache)
        if (!memoryCache.has(key)) {
          keys.push({
            key,
            type: 'storage',
            ttl: ttlSeconds,
            size: value.length,
          });
        } else {
          // Update existing entry with size
          const existing = keys.find(k => k.key === key);
          if (existing) {
            existing.size = value.length;
          }
        }
      } catch (e) {
        // Skip corrupted entries
      }
    }
  }

  return keys;
}

/**
 * Clear all cache data
 */
export async function clearCache(): Promise<void> {
  // Clear memory cache
  memoryCache.clear();
  
  // Clear localStorage cache
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}
  
// Export for debugging
export { memoryCache, cleanup };