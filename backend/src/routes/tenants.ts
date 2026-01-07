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
  phone: z.string().optional(),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional()
});

// Public registration schema (same as create but for self-registration)
const publicRegisterSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').max(30),
  contactEmail: z.string().email('Invalid email address'),
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional()
});

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
  'www', 'admin', 'superadmin', 'api', 'app', 'mail', 'smtp', 'ftp', 
  'cpanel', 'webmail', 'ns1', 'ns2', 'test', 'demo', 'staging', 'dev',
  'blog', 'shop', 'store', 'help', 'support', 'status', 'cdn', 'static',
  'images', 'assets', 'files', 'media', 'download', 'uploads'
];

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

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// GET /api/tenants/check-subdomain/:subdomain - Check if subdomain is available (PUBLIC)
tenantsRouter.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const subdomain = req.params.subdomain.toLowerCase().trim();
    
    // Validate subdomain format
    if (subdomain.length < 3) {
      return res.json({ available: false, reason: 'Subdomain must be at least 3 characters' });
    }
    
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 2) {
      return res.json({ available: false, reason: 'Invalid subdomain format' });
    }
    
    // Check reserved subdomains
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return res.json({ available: false, reason: 'This subdomain is reserved' });
    }
    
    // Check if subdomain exists
    const existing = await getTenantBySubdomain(subdomain);
    
    res.json({ 
      available: !existing,
      reason: existing ? 'Subdomain already in use' : null
    });
  } catch (error) {
    console.error('Subdomain check error:', error);
    res.status(500).json({ available: false, reason: 'Check failed' });
  }
});

// POST /api/tenants/register - Public tenant registration (14-day trial)
tenantsRouter.post('/register', async (req, res) => {
  try {
    const payload = publicRegisterSchema.parse(req.body);
    const subdomain = payload.subdomain.toLowerCase().trim();
    
    // Validate subdomain isn't reserved
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return res.status(400).json({ error: 'This subdomain is reserved and cannot be used' });
    }
    
    // Create tenant with trial status
    const tenantPayload: CreateTenantPayload = {
      name: payload.name.trim(),
      subdomain: subdomain,
      contactEmail: payload.contactEmail.trim().toLowerCase(),
      contactName: payload.contactName?.trim(),
      adminEmail: payload.adminEmail.trim().toLowerCase(),
      adminPassword: payload.adminPassword,
      plan: 'starter' // Default to starter plan for self-registration
    };
    
    const tenant = await createTenant(tenantPayload);
    
    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    
    res.status(201).json({ 
      success: true,
      data: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: 'trialing',
        trialEndsAt: trialEndDate.toISOString(),
        shopUrl: `https://${tenant.subdomain}.systemnextit.com`,
        adminUrl: `https://admin.systemnextit.com`
      },
      message: `🎉 Your shop "${tenant.name}" has been created! 14-day free trial started.`
    });
  } catch (error) {
    console.error('Public registration error:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return res.status(400).json({ error: firstError.message });
    }
    
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes('Subdomain already in use')) {
        return res.status(400).json({ error: 'এই সাবডোমেইন ইতোমধ্যে ব্যবহৃত হয়েছে। অন্য একটি বেছে নিন।' });
      }
      if (error.message.includes('Admin email already registered')) {
        return res.status(400).json({ error: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে।' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ==================== PROTECTED ROUTES ====================

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