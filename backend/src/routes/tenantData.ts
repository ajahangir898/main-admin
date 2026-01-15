import { Router, Request } from 'express';
import { z } from 'zod';
import { getTenantData, setTenantData, getTenantDataBatch } from '../services/tenantDataService';
import { getTenantBySubdomain } from '../services/tenantsService';
import { createAuditLog } from './auditLogs';
import { Server as SocketIOServer } from 'socket.io';

const paramsSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  key: z.string().min(1, 'key is required')
});

const updateSchema = z.object({
  data: z.any()
});

// Helper to check if a string looks like a MongoDB ObjectId
const isObjectIdLike = (str: string): boolean => /^[a-f\d]{24}$/i.test(str);

// Resolve tenant scope - if it's a slug, convert to tenant ID
const resolveTenantId = async (scope: string): Promise<string> => {
  // If it looks like a MongoDB ObjectId, use it directly
  if (isObjectIdLike(scope)) {
    return scope;
  }
  
  // If it's 'public', keep as-is for global data
  if (scope === 'public') {
    return scope;
  }
  
  // Otherwise, try to resolve as a subdomain/slug
  try {
    const tenant = await getTenantBySubdomain(scope);
    if (tenant?._id) {
      const tenantId = tenant._id.toString();
      console.log(`[TenantData] Resolved slug "${scope}" to tenant ID: ${tenantId}`);
      return tenantId;
    }
  } catch (e) {
    console.warn(`[TenantData] Failed to resolve slug "${scope}":`, e);
  }
  
  // Fallback to original scope
  return scope;
};

export const tenantDataRouter = Router();

// Helper to emit Socket.IO events
const emitDataUpdate = (req: Request, tenantId: string, key: string, data: unknown) => {
  const io = req.app.get('io') as SocketIOServer | undefined;
  if (io) {
    // Emit to tenant-specific room
    io.to(`tenant:${tenantId}`).emit('data-update', { tenantId, key, data, timestamp: Date.now() });
    
    // Emit specific event for chat messages for real-time chat
    if (key === 'chat_messages') {
      io.to(`tenant:${tenantId}`).emit('chat-update', { tenantId, data, timestamp: Date.now() });
      console.log(`[Socket.IO] Emitted chat-update for ${tenantId}`);
    }
    
    // Also emit globally for cross-tenant admins
    io.emit('data-update-global', { tenantId, key, timestamp: Date.now() });
    console.log(`[Socket.IO] Emitted data-update for ${tenantId}/${key}`);
  }
};

// Bootstrap endpoint - returns all critical data in ONE database query
tenantDataRouter.get('/:tenantId/bootstrap', async (req, res, next) => {
  try {
    const rawTenantId = req.params.tenantId;
    if (!rawTenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    
    // Resolve slug to tenant ID if needed
    const tenantId = await resolveTenantId(rawTenantId);
    
    // Fetch all critical data in ONE database query (not 3 parallel queries)
    const data = await getTenantDataBatch<{
      products: unknown;
      theme_config: unknown;
      website_config: unknown;
    }>(tenantId, ['products', 'theme_config', 'website_config']);
    
    // Allow short caching for bootstrap data (30 seconds)
    res.set({
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    });
    
    res.json({
      data: {
        products: data.products || [],
        theme_config: data.theme_config || null,
        website_config: data.website_config || null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Secondary data endpoint - returns all secondary data in ONE database query
tenantDataRouter.get('/:tenantId/secondary', async (req, res, next) => {
  try {
    const rawTenantId = req.params.tenantId;
    if (!rawTenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    
    // Resolve slug to tenant ID if needed
    const tenantId = await resolveTenantId(rawTenantId);
    
    // Fetch all secondary data in ONE database query (not 10 parallel queries)
    const data = await getTenantDataBatch<{
      orders: unknown;
      logo: unknown;
      delivery_config: unknown;
      chat_messages: unknown;
      landing_pages: unknown;
      categories: unknown;
      subcategories: unknown;
      childcategories: unknown;
      brands: unknown;
      tags: unknown;
    }>(tenantId, [
      'orders', 'logo', 'delivery_config', 'chat_messages', 'landing_pages',
      'categories', 'subcategories', 'childcategories', 'brands', 'tags'
    ]);
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    
    res.json({
      data: {
        orders: data.orders || [],
        logo: data.logo || null,
        delivery_config: data.delivery_config || [],
        chat_messages: data.chat_messages || [],
        landing_pages: data.landing_pages || [],
        categories: data.categories || [],
        subcategories: data.subcategories || [],
        childcategories: data.childcategories || [],
        brands: data.brands || [],
        tags: data.tags || []
      }
    });
  } catch (error) {
    next(error);
  }
});

tenantDataRouter.get('/:tenantId/:key', async (req, res, next) => {
  try {
    const { tenantId, key } = paramsSchema.parse(req.params);
    const data = await getTenantData(tenantId, key);
    
    // Prevent browser/CDN caching for dynamic tenant data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

tenantDataRouter.put('/:tenantId/:key', async (req, res, next) => {
  try {
    const { tenantId, key } = paramsSchema.parse(req.params);
    const payload = updateSchema.parse(req.body ?? {});
    await setTenantData(tenantId, key, payload.data);
    
    // Emit real-time update via Socket.IO
    emitDataUpdate(req, tenantId, key, payload.data);
    
    console.log(`[TenantData] Saved ${key} for tenant ${tenantId}`);
    
    // Create audit log for important data changes
    if (['products', 'categories', 'subcategories', 'childcategories', 'brands', 'tags'].includes(key)) {
      const user = (req as any).user;
      const dataArray = Array.isArray(payload.data) ? payload.data : [];
      await createAuditLog({
        tenantId,
        userId: user?._id || user?.id || 'system',
        userName: user?.name || 'System',
        userRole: user?.role || 'system',
        action: `${key.charAt(0).toUpperCase() + key.slice(1)} Updated`,
        actionType: 'update',
        resourceType: key === 'products' ? 'product' : key === 'categories' ? 'category' : 'other',
        resourceId: tenantId,
        resourceName: key,
        details: `${key} data updated (${dataArray.length} items)`,
        metadata: { key, itemCount: dataArray.length },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });
    }
    res.json({ data: { tenantId, key, success: true } });
  } catch (error) {
    console.error(`[TenantData] Error saving ${req.params.key} for ${req.params.tenantId}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});
