import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, IUser } from '../models/User';
import { Role } from '../models/Role';
import { Permission, RESOURCES, ACTIONS, ResourceType, ActionType } from '../models/Permission';
import { env } from '../config/env';
import { 
  authenticateToken, 
  requireRole, 
  requirePermission,
  getUserPermissions,
  JWTPayload 
} from '../middleware/auth';
import { getTenantById, getTenantBySubdomain } from '../services/tenantsService';
import { createAuditLog } from './auditLogs';

export const authRouter = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  subdomain: z.string().nullish() // For tenant-scoped login (accepts null, undefined, or string)
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  tenantId: z.string().optional(),
  role: z.enum(['customer', 'admin', 'tenant_admin', 'super_admin', 'staff']).optional()
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
  username: z.string().optional(),
  role: z.enum(['customer', 'admin', 'tenant_admin', 'super_admin', 'staff']).optional(),
  roleId: z.string().optional(),
  tenantId: z.string().optional(),
  isActive: z.boolean().optional()
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  username: z.string().optional(),
  role: z.enum(['customer', 'admin', 'tenant_admin', 'super_admin', 'staff']).optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional()
});

const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  tenantId: z.string().optional(),
  permissions: z.array(z.object({
    resource: z.string(),
    actions: z.array(z.enum(['read', 'write', 'edit', 'delete']))
  })).optional()
});

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  permissions: z.array(z.object({
    resource: z.string(),
    actions: z.array(z.enum(['read', 'write', 'edit', 'delete']))
  })).optional()
});

// Generate JWT token
const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    roleId: user.roleId?.toString(),
    tenantId: user.tenantId
  };

  const signOptions = { 
    expiresIn: '7d' as any
  };

  return jwt.sign(payload, env.jwtSecret, signOptions);
};

// Helper to get tenant details
const getTenantDetails = async (tenantId?: string) => {
  if (!tenantId) return null;
  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) return null;
    return {
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      status: tenant.status
    };
  } catch {
    return null;
  }
};

// ==================== AUTH ROUTES ====================

/**
 * POST /api/auth/login
 * Login with email and password
 * Supports tenant-scoped login via subdomain parameter
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, subdomain } = loginSchema.parse(req.body);
    
    // Also check header for subdomain (backup method)
    const subdomainHeader = req.headers['x-tenant-subdomain'] as string | undefined;
    let tenantSubdomain = subdomain || subdomainHeader;
    
    // Exclude special subdomains that are not tenant subdomains
    const specialSubdomains = ['www', 'admin', 'superadmin', 'api', 'static'];
    if (tenantSubdomain && specialSubdomains.includes(tenantSubdomain.toLowerCase())) {
      tenantSubdomain = undefined;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found. Please sign up first.',
        code: 'USER_NOT_FOUND'
      });
    }

    // If logging in from a subdomain, verify user belongs to that tenant
    if (tenantSubdomain) {
      const tenant = await getTenantBySubdomain(tenantSubdomain);
      if (!tenant) {
        return res.status(401).json({
          error: 'Invalid tenant',
          code: 'TENANT_NOT_FOUND'
        });
      }
      
      // Super admins can login anywhere
      if (user.role !== 'super_admin') {
        // Check if user belongs to this tenant
        if (!user.tenantId || user.tenantId !== tenant._id?.toString()) {
          console.log(`[auth] Login denied: User ${user.email} (tenantId: ${user.tenantId}) tried to access tenant ${tenant._id} (${tenantSubdomain})`);
          return res.status(401).json({
            error: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          });
        }
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account is deactivated. Please contact administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Get user permissions
    const permissions = await getUserPermissions(user._id.toString(), user.roleId?.toString());

    // Get role details if assigned
    let roleDetails = null;
    if (user.roleId) {
      roleDetails = await Role.findById(user.roleId).select('-__v');
    }

    // Get tenant details if assigned
    const tenantDetails = await getTenantDetails(user.tenantId);
    // Log successful login
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: 'User Login',
      actionType: 'login',
      resourceType: 'user',
      resourceId: user._id.toString(),
      resourceName: user.name,
      details: `${user.name} (${user.email}) logged in successfully`,
      metadata: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        image: user.image,
        role: user.role,
        roleId: user.roleId,
        roleDetails,
        tenantId: user.tenantId,
        tenantDetails,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      permissions
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Register a new user (customer registration - public)
 */
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'This email is already registered. Please login instead.',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create user (default role is customer for public registration)
    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      phone: data.phone,
      tenantId: data.tenantId,
      role: 'customer', // Force customer role for public registration
      isActive: true
    });

    await user.save();

    // Generate token
    const token = generateToken(user);
    const permissions = await getUserPermissions(user._id.toString());

    // Get tenant details if assigned
    const tenantDetails = await getTenantDetails(user.tenantId);
    // Log successful login
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: 'User Login',
      actionType: 'login',
      resourceType: 'user',
      resourceId: user._id.toString(),
      resourceName: user.name,
      details: `${user.name} (${user.email}) logged in successfully`,
      metadata: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantDetails
      },
      permissions
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
authRouter.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const permissions = await getUserPermissions(user._id.toString(), user.roleId?.toString());

    let roleDetails = null;
    if (user.roleId) {
      roleDetails = await Role.findById(user.roleId).select('-__v');
    }

    // Get tenant details if assigned
    const tenantDetails = await getTenantDetails(user.tenantId);
    // Log successful login
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: 'User Login',
      actionType: 'login',
      resourceType: 'user',
      resourceId: user._id.toString(),
      resourceName: user.name,
      details: `${user.name} (${user.email}) logged in successfully`,
      metadata: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        username: user.username,
        image: user.image,
        role: user.role,
        roleId: user.roleId,
        roleDetails,
        tenantId: user.tenantId,
        tenantDetails,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      permissions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/permissions
 * Get current user's permissions
 */
authRouter.get('/permissions', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await getUserPermissions(req.userId!, req.user?.roleId?.toString());
    res.json({ permissions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
authRouter.post('/refresh', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
authRouter.get('/admin/users', 
  authenticateToken, 
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, role, search, page = 1, limit = 50 } = req.query;

      const filter: any = {};

      // Tenant admins can only see users in their tenant
      if (req.user?.role === 'tenant_admin') {
        filter.tenantId = req.user.tenantId;
      } else if (tenantId) {
        filter.tenantId = tenantId;
      }

      // Filter by role if specified
      if (role) {
        filter.role = role;
      }

      // Search by name or email
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .populate('roleId', 'name description')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 }),
        User.countDocuments(filter)
      ]);

      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
authRouter.post('/admin/users',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createUserSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await User.findOne({ email: data.email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ 
          error: 'Email already registered',
          code: 'EMAIL_EXISTS'
        });
      }

      // Tenant admins can only create users in their tenant
      let tenantId = data.tenantId;
      if (req.user?.role === 'tenant_admin') {
        tenantId = req.user.tenantId;
      }

      // Only super_admin can create super_admin or tenant_admin users
      if ((data.role === 'super_admin' || data.role === 'tenant_admin') && req.user?.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Only super admin can create admin-level users',
          code: 'PERMISSION_DENIED'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const user = new User({
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        phone: data.phone,
        address: data.address,
        username: data.username,
        role: data.role || 'staff',
        roleId: data.roleId && data.roleId.length === 24 ? data.roleId : undefined,
        tenantId,
        isActive: data.isActive !== false
      });

      await user.save();

      const userResponse = await User.findById(user._id)
        .select('-password')
        .populate('roleId', 'name description');

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }
);

/**
 * PUT /api/admin/users/:id
 * Update a user (admin only)
 */
authRouter.put('/admin/users/:id',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Tenant admins can only update users in their tenant
      if (req.user?.role === 'tenant_admin' && user.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Cannot update users from other tenants',
          code: 'PERMISSION_DENIED'
        });
      }

      // Only super_admin can change role to super_admin or tenant_admin
      if ((data.role === 'super_admin' || data.role === 'tenant_admin') && req.user?.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Only super admin can assign admin-level roles',
          code: 'PERMISSION_DENIED'
        });
      }

      // Prevent demoting yourself
      if (user._id.toString() === req.userId && data.role && data.role !== user.role) {
        return res.status(400).json({
          error: 'Cannot change your own role',
          code: 'SELF_ROLE_CHANGE'
        });
      }

      // Handle roleId - only update if valid ObjectId or unset if empty
      if (data.roleId !== undefined) {
        if (data.roleId && data.roleId.length === 24) {
          user.roleId = data.roleId as any;
        } else {
          user.roleId = undefined;
        }
        delete (data as any).roleId;
      }

      // Update fields
      Object.assign(user, data);
      await user.save();

      const userResponse = await User.findById(user._id)
        .select('-password')
        .populate('roleId', 'name description');

      res.json({
        message: 'User updated successfully',
        user: userResponse
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 */
authRouter.delete('/admin/users/:id',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Prevent self-deletion
      if (user._id.toString() === req.userId) {
        return res.status(400).json({
          error: 'Cannot delete your own account',
          code: 'SELF_DELETE'
        });
      }

      // Only super_admin can delete super_admin users
      if (user.role === 'super_admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Only super admin can delete super admin users',
          code: 'PERMISSION_DENIED'
        });
      }

      await User.findByIdAndDelete(id);

      res.json({
        message: 'User deleted successfully',
        data: { id }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/role
 * Update user's role assignment
 */
authRouter.patch('/admin/users/:id/role',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Validate role exists if roleId is provided
      if (roleId) {
        const role = await Role.findById(roleId);
        if (!role) {
          return res.status(404).json({
            error: 'Role not found',
            code: 'ROLE_NOT_FOUND'
          });
        }
      }

      user.roleId = roleId || undefined;
      await user.save();

      const userResponse = await User.findById(user._id)
        .select('-password')
        .populate('roleId', 'name description');

      res.json({
        message: 'User role updated successfully',
        data: userResponse
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== ROLE MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/roles
 * Get all roles
 */
authRouter.get('/admin/roles',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.query;

      const filter: any = {};
      
      // Tenant admins can only see their tenant's roles
      if (req.user?.role === 'tenant_admin') {
        filter.tenantId = req.user.tenantId;
      } else if (tenantId) {
        filter.tenantId = tenantId;
      }

      const roles = await Role.find(filter).sort({ createdAt: -1 });

      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await Permission.find({ roleId: role._id });
          return {
            ...role.toObject(),
            permissions: permissions.map(p => ({
              resource: p.resource,
              actions: p.actions
            }))
          };
        })
      );

      res.json({ data: rolesWithPermissions });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/roles
 * Create a new role
 */
authRouter.post('/admin/roles',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createRoleSchema.parse(req.body);

      // Tenant admins can only create roles in their tenant
      let tenantId = data.tenantId;
      if (req.user?.role === 'tenant_admin') {
        tenantId = req.user.tenantId;
      }

      // Check for duplicate role name in tenant
      const existingRole = await Role.findOne({ 
        name: data.name, 
        tenantId 
      });
      if (existingRole) {
        return res.status(409).json({
          error: 'Role name already exists',
          code: 'ROLE_EXISTS'
        });
      }

      const role = new Role({
        name: data.name,
        description: data.description || '',
        tenantId,
        isSystem: false
      });

      await role.save();

      // Create permissions for the role
      if (data.permissions && data.permissions.length > 0) {
        const permissionDocs = data.permissions.map(p => ({
          roleId: role._id,
          resource: p.resource as ResourceType,
          actions: p.actions as ActionType[],
          tenantId
        }));
        await Permission.insertMany(permissionDocs);
      }

      // Get permissions for response
      const permissions = await Permission.find({ roleId: role._id });

      res.status(201).json({
        message: 'Role created successfully',
        data: {
          ...role.toObject(),
          permissions: permissions.map(p => ({
            resource: p.resource,
            actions: p.actions
          }))
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }
);

/**
 * PUT /api/admin/roles/:id
 * Update a role
 */
authRouter.put('/admin/roles/:id',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateRoleSchema.parse(req.body);

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Prevent editing system roles
      if (role.isSystem) {
        return res.status(403).json({
          error: 'Cannot edit system roles',
          code: 'SYSTEM_ROLE'
        });
      }

      // Update role name/description
      if (data.name) role.name = data.name;
      if (data.description !== undefined) role.description = data.description;
      await role.save();

      // Update permissions if provided
      if (data.permissions) {
        // Delete existing permissions
        await Permission.deleteMany({ roleId: role._id });

        // Create new permissions
        if (data.permissions.length > 0) {
          const permissionDocs = data.permissions.map(p => ({
            roleId: role._id,
            resource: p.resource as ResourceType,
            actions: p.actions as ActionType[],
            tenantId: role.tenantId
          }));
          await Permission.insertMany(permissionDocs);
        }
      }

      // Get updated permissions
      const permissions = await Permission.find({ roleId: role._id });

      res.json({
        message: 'Role updated successfully',
        data: {
          ...role.toObject(),
          permissions: permissions.map(p => ({
            resource: p.resource,
            actions: p.actions
          }))
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/roles/:id
 * Delete a role
 */
authRouter.delete('/admin/roles/:id',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Prevent deleting system roles
      if (role.isSystem) {
        return res.status(403).json({
          error: 'Cannot delete system roles',
          code: 'SYSTEM_ROLE'
        });
      }

      // Check if any users are assigned this role
      const usersWithRole = await User.countDocuments({ roleId: id });
      if (usersWithRole > 0) {
        return res.status(400).json({
          error: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`,
          code: 'ROLE_IN_USE'
        });
      }

      // Delete permissions for this role
      await Permission.deleteMany({ roleId: id });

      // Delete the role
      await Role.findByIdAndDelete(id);

      res.json({
        message: 'Role deleted successfully',
        data: { id }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/resources
 * Get available resources and actions for permission configuration
 */
authRouter.get('/admin/resources',
  authenticateToken,
  requireRole('admin', 'super_admin', 'tenant_admin'),
  async (_req: Request, res: Response) => {
    res.json({
      resources: RESOURCES.map(resource => ({
        id: resource,
        name: resource.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        actions: ACTIONS
      })),
      actions: ACTIONS
    });
  }
);

export default authRouter;