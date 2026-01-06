import { getDatabase } from '../db/mongo';
import type { TenantDataDocument } from '../types/tenantData';
import { getCached, setCachedWithTTL, invalidateTenantCache } from './redisCache';

const collectionName = 'tenant_data';

// Generate cache key for bootstrap data
const getBootstrapCacheKey = (tenantId: string, keys: string[]) => 
  `bootstrap:${tenantId}:${keys.sort().join(',')}`;

// Invalidate cache when data is updated (now uses Redis)
export const invalidateBootstrapCache = async (tenantId: string): Promise<void> => {
  await invalidateTenantCache(tenantId);
};

export const getTenantData = async <T = unknown>(tenantId: string, key: string): Promise<T | null> => {
  const db = await getDatabase();
  const document = await db
    .collection<TenantDataDocument<T>>(collectionName)
    .findOne({ tenantId, key });
  return document?.data ?? null;
};

// Batch fetch multiple keys in ONE database query (much faster than parallel individual queries)
export const getTenantDataBatch = async <T extends Record<string, unknown>>(
  tenantId: string, 
  keys: string[]
): Promise<T> => {
  // Check Redis cache first for super fast response
  const cacheKey = getBootstrapCacheKey(tenantId, keys);
  const cached = await getCached<T>(cacheKey);
  if (cached) {
    console.log(`[Redis] Cache hit for ${tenantId} (${keys.length} keys)`);
    return cached;
  }
  
  console.log(`[DB] Fetching ${keys.length} keys for ${tenantId} from MongoDB...`);
  const startTime = Date.now();
  
  const db = await getDatabase();
  const documents = await db
    .collection<TenantDataDocument<unknown>>(collectionName)
    .find({ tenantId, key: { $in: keys } })
    .toArray();
  
  // Build result object from documents
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    const doc = documents.find(d => d.key === key);
    result[key] = doc?.data ?? null;
  }
  
  console.log(`[DB] Fetched ${keys.length} keys in ${Date.now() - startTime}ms`);
  
  // Cache the result in Redis with longer TTL for bootstrap data (1 hour)
  await setCachedWithTTL(cacheKey, result, 'long');
  
  return result as T;
};

export const setTenantData = async <T = unknown>(tenantId: string, key: string, data: T): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db
    .collection<TenantDataDocument<T>>(collectionName)
    .updateOne(
      { tenantId, key },
      {
        $set: {
          tenantId,  // CRITICAL: Always set tenantId to ensure tenant isolation
          key,       // Also set key to prevent any inconsistencies
          data,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now  // Only set createdAt on insert
        }
      },
      { upsert: true }
    );
  
  // Invalidate Redis cache when data is updated
  await invalidateBootstrapCache(tenantId);
};
