import IORedis from 'ioredis';

// Singleton Redis client
let redis: IORedis | null = null;
let redisReady = false;

const getRedis = (): IORedis | null => {
  if (redis && redisReady) return redis;
  
  // Check for Upstash (cloud) first, then local Redis
  const localUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  
  // Skip if explicitly disabled
  if (process.env.REDIS_DISABLED === 'true') return null;
  
  if (!redis) {
    try {
      redis = new IORedis(localUrl, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        retryStrategy: (times) => {
          if (times > 5) {
            console.warn('[Redis] Max retries reached, giving up');
            return null;
          }
          const delay = Math.min(times * 200, 2000);
          console.log(`[Redis] Retrying connection in ${delay}ms (attempt ${times})`);
          return delay;
        },
        enableReadyCheck: true,
        lazyConnect: false,
      });
      
      redis.on('ready', () => {
        redisReady = true;
        console.log('[Redis] ✓ Connected to local Redis');
      });
      
      redis.on('connect', () => {
        console.log('[Redis] Socket connected');
      });
      
      redis.on('error', (err) => {
        if (redisReady) {
          console.warn('[Redis] Connection error:', err.message);
        }
        redisReady = false;
      });
      
      redis.on('close', () => {
        console.log('[Redis] Connection closed');
        redisReady = false;
      });
      
      redis.on('reconnecting', () => {
        console.log('[Redis] Reconnecting...');
      });
      
    } catch (err) {
      console.warn('[Redis] Failed to initialize:', err);
      return null;
    }
  }
  
  return redis;
};

// Check if Redis is actually connected
const isRedisReady = (): boolean => redisReady;

// Cache configuration - optimized for fast store loading
const TTL = {
  MEMORY_MS: 2 * 60 * 1000,   // 2 min L1 (in-memory) - increased for faster repeat loads
  REDIS_SEC: 15 * 60,         // 15 min L2 (Redis) - increased for better cache hits
  SHORT: 5 * 60,              // 5 min for dynamic data
  MEDIUM: 30 * 60,            // 30 min for API responses
  LONG: 2 * 60 * 60,          // 2 hours for static data
  BOOTSTRAP: 60 * 60,         // 1 hour for bootstrap data (products/theme/website)
};

// Cache key generators for consistency
export const CacheKeys = {
  // Tenant data
  tenantBootstrap: (tenantId: string, keys: string[]) => 
    `bootstrap:${tenantId}:${keys.sort().join(',')}`,
  tenantProducts: (tenantId: string) => `tenant:${tenantId}:products`,
  tenantOrders: (tenantId: string, page: number = 1) => `tenant:${tenantId}:orders:${page}`,
  tenantAnalytics: (tenantId: string, period: string) => `tenant:${tenantId}:analytics:${period}`,
  
  // User data
  userAuth: (userId: string) => `user:${userId}:auth`,
  userPermissions: (userId: string, tenantId: string) => `user:${userId}:permissions:${tenantId}`,
  
  // API responses
  apiResponse: (endpoint: string, params: string = '') => `api:${endpoint}:${params}`,
  
  // Chat data
  chatMessages: (tenantId: string, limit: number = 50) => `chat:${tenantId}:messages:${limit}`,
  
  // System data
  tenantList: () => 'system:tenants:active',
  visitorStats: (date: string) => `stats:visitors:${date}`,
};

// L1: In-memory cache (instant, no network)
const L1 = new Map<string, { data: unknown; expires: number }>();

// Cleanup expired L1 entries every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of L1) {
    if (entry.expires < now) L1.delete(key);
  }
}, 30000);

/**
 * GET: L1 memory → L2 Redis → null
 */
export async function getCached<T>(key: string): Promise<T | null> {
  // L1: Check memory (instant)
  const l1 = L1.get(key);
  if (l1 && l1.expires > Date.now()) {
    return l1.data as T;
  }
  L1.delete(key);

  // L2: Check Redis
  const client = getRedis();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    if (raw !== null) {
      const data = JSON.parse(raw) as T;
      // Warm L1 cache
      L1.set(key, { data, expires: Date.now() + TTL.MEMORY_MS });
      return data;
    }
  } catch (e) {
    console.error('[Redis] GET error:', e);
  }
  
  return null;
}

/**
 * SET: Write to both L1 and L2
 */
export async function setCached<T>(key: string, data: T): Promise<void> {
  // L1: Always set memory
  L1.set(key, { data, expires: Date.now() + TTL.MEMORY_MS });

  // L2: Set Redis (fire and forget for speed)
  const client = getRedis();
  if (client) {
    client.set(key, JSON.stringify(data), 'EX', TTL.REDIS_SEC).catch(e => console.error('[Redis] SET error:', e));
  }
}

/**
 * DELETE: Clear from both L1 and L2
 */
export async function deleteCached(key: string): Promise<void> {
  L1.delete(key);
  const client = getRedis();
  if (client) {
    await client.del(key).catch(e => console.error('[Redis] DEL error:', e));
  }
}

/**
 * Invalidate all cache for a tenant (by pattern)
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  const pattern = `bootstrap:${tenantId}`;
  
  // Clear L1
  for (const key of L1.keys()) {
    if (key.startsWith(pattern)) L1.delete(key);
  }

  // Clear L2
  const client = getRedis();
  if (client) {
    try {
      const keys = await client.keys(`${pattern}*`);
      if (keys.length) await client.del(...keys);
    } catch (e) {
      console.error('[Redis] Invalidate error:', e);
    }
  }
}

/**
 * Cache with automatic TTL based on data type
 */
export async function setCachedWithTTL<T>(
  key: string, 
  data: T, 
  type: 'short' | 'medium' | 'long' = 'medium'
): Promise<void> {
  const ttlMap = {
    short: TTL.SHORT,
    medium: TTL.MEDIUM,
    long: TTL.LONG
  };
  
  // L1: Set in memory with shorter TTL
  L1.set(key, { data, expires: Date.now() + TTL.MEMORY_MS });
  
  // L2: Set in Redis with appropriate TTL
  const client = getRedis();
  if (client) {
    client.set(key, JSON.stringify(data), 'EX', ttlMap[type])
      .catch(e => console.error('[Redis] SET error:', e));
  }
}

/**
 * Cache API response with automatic key generation
 */
export async function cacheApiResponse<T>(
  endpoint: string,
  params: Record<string, unknown>,
  data: T,
  ttlType: 'short' | 'medium' | 'long' = 'medium'
): Promise<void> {
  const paramsStr = Object.keys(params).sort()
    .map(k => `${k}=${params[k]}`).join('&');
  const key = CacheKeys.apiResponse(endpoint, paramsStr);
  await setCachedWithTTL(key, data, ttlType);
}

/**
 * Get cached API response
 */
export async function getCachedApiResponse<T>(
  endpoint: string,
  params: Record<string, unknown>
): Promise<T | null> {
  const paramsStr = Object.keys(params).sort()
    .map(k => `${k}=${params[k]}`).join('&');
  const key = CacheKeys.apiResponse(endpoint, paramsStr);
  return getCached<T>(key);
}

/**
 * Bulk cache invalidation by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  // Clear L1 cache
  for (const key of L1.keys()) {
    if (key.includes(pattern)) {
      L1.delete(key);
    }
  }
  
  // Clear L2 cache
  const client = getRedis();
  if (client) {
    try {
      const keys = await client.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await client.del(...keys);
        console.log(`[Redis] Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (e) {
      console.error('[Redis] Pattern invalidation error:', e);
    }
  }
}

/**
 * Cache tenant product data with automatic invalidation
 */
export async function cacheTenantProducts<T>(
  tenantId: string, 
  products: T
): Promise<void> {
  const key = CacheKeys.tenantProducts(tenantId);
  await setCachedWithTTL(key, products, 'medium');
}

/**
 * Get cached tenant products
 */
export async function getCachedTenantProducts<T>(tenantId: string): Promise<T | null> {
  const key = CacheKeys.tenantProducts(tenantId);
  return getCached<T>(key);
}

/**
 * Cache user permissions
 */
export async function cacheUserPermissions<T>(
  userId: string,
  tenantId: string,
  permissions: T
): Promise<void> {
  const key = CacheKeys.userPermissions(userId, tenantId);
  await setCachedWithTTL(key, permissions, 'long');
}

/**
 * Get cached user permissions
 */
export async function getCachedUserPermissions<T>(
  userId: string,
  tenantId: string
): Promise<T | null> {
  const key = CacheKeys.userPermissions(userId, tenantId);
  return getCached<T>(key);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  memoryEntries: number;
  redisConnected: boolean;
} {
  return {
    memoryEntries: L1.size,
    redisConnected: isRedisReady()
  };
}

// Legacy export for compatibility
export const invalidateCache = invalidateTenantCache;

// Initialize Redis connection on module load
(async () => {
  const client = getRedis();
  if (client) {
    console.log('[Redis] Initializing connection...');
  }
})();

