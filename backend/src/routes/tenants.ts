import { Router } from 'express';
import { z } from 'zod';
import { 
  createTenant, 
  deleteTenant, 
  listTenants, 
  getTenantById, 
  getTenantBySubdomain,
  updateTenantStatus,
  updateTenant,
  getTenantUsers,
  getTenantStats
} from '../services/tenantsService';
import type { CreateTenantPayload } from '../types/tenant';

const createTenantSchema = z.object({
  name: z.string().min(2),
  subdomain: z.string().min(2),
  contactEmail: z.string().email(),
  contactName: z.string().optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional()
});

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactName: z.string().optional(),
  customDomain: z.string().optional().nullable(),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional(),
  branding: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['trialing', 'active', 'suspended', 'archived'])
});

export const tenantsRouter = Router();

// GET /api/tenants - List all tenants
tenantsRouter.get('/', 
  async (_req, res, next) => {
    try {
      const tenants = await listTenants();
      res.json({ data: tenants });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/resolve/:subdomain - Resolve tenant by subdomain (public)
tenantsRouter.get('/resolve/:subdomain', async (req, res, next) => {
  try {
    const tenant = await getTenantBySubdomain(req.params.subdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    // Only return public info
    res.json({ 
      data: {
        id: String(tenant._id),
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        branding: tenant.branding
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/:id - Get tenant by ID
tenantsRouter.get('/:id', 
  async (req, res, next) => {
    try {
      const tenant = await getTenantById(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      res.json({ data: tenant });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/:id/users - Get tenant users
tenantsRouter.get('/:id/users',
  async (req, res, next) => {
    try {
      const users = await getTenantUsers(req.params.id);
      res.json({ data: users });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants/:id/stats - Get tenant statistics
tenantsRouter.get('/:id/stats',
  async (req, res, next) => {
    try {
      const stats = await getTenantStats(req.params.id);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tenants - Create new tenant
tenantsRouter.post('/', 
  async (req, res, next) => {
    try {
      const payload = createTenantSchema.parse(req.body) as CreateTenantPayload;
      const tenant = await createTenant(payload);
      res.status(201).json({ 
        data: tenant,
        message: `Tenant "${tenant.name}" created successfully with admin user ${tenant.adminEmail}`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
);

// PUT /api/tenants/:id - Update tenant
tenantsRouter.put('/:id',
  async (req, res, next) => {
    try {
      const updates = updateTenantSchema.parse(req.body);
      const tenant = await updateTenant(req.params.id, updates);
      res.json({ data: tenant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  }
);

// PATCH /api/tenants/:id/status - Update tenant status
tenantsRouter.patch('/:id/status', 
  async (req, res, next) => {
    try {
      const { status } = updateStatusSchema.parse(req.body);
      await updateTenantStatus(req.params.id, status);
      res.json({ data: { id: req.params.id, status } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  }
);

// DELETE /api/tenants/:id - Delete tenant
tenantsRouter.delete('/:id', 
  async (req, res, next) => {
    try {
      await deleteTenant(req.params.id);
      res.json({ data: { id: req.params.id }, message: 'Tenant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);