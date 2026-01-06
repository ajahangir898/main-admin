import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Permission, ResourceType, ActionType } from '../models/Permission';
import { env } from '../config/env';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      userRole?: string;
      tenantId?: string;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  roleId?: string;
  tenantId?: string;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const secret = env.jwtSecret || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Optionally fetch full user from DB for fresh data
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.tenantId = decoded.tenantId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    next(error);
  }
};

// Backward-compatible aliases
// Some routes expect `authenticate` / `authorizeRoles` naming.
export const authenticate = authenticateToken;

export const authorizeRoles = (roles: string[]) => requireRole(...roles);

/**
 * Optional authentication - doesn't fail if no token, just doesn't set user
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const secret = env.jwtSecret || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(token, secret) as JWTPayload;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.tenantId = decoded.tenantId;
      }
    }
    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
};

/**
 * Check if user has specific role(s)
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Super admin bypasses all role checks
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient role permissions',
        code: 'ROLE_FORBIDDEN',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user has permission for specific resource and action
 * This is the granular RBAC check
 */
export const requirePermission = (resource: ResourceType, action: ActionType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Admin has all permissions except tenant management
      if (req.user.role === 'admin' && resource !== 'tenants') {
        return next();
      }

      // Check role-based permissions
      if (req.user.roleId) {
        const permission = await Permission.findOne({
          roleId: req.user.roleId,
          resource,
          actions: action
        });

        if (permission) {
          return next();
        }
      }

      return res.status(403).json({ 
        error: `Permission denied: ${action} on ${resource}`,
        code: 'PERMISSION_DENIED',
        resource,
        action
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check multiple permissions (OR logic - any permission passes)
 */
export const requireAnyPermission = (permissions: Array<{ resource: ResourceType; action: ActionType }>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Super admin bypasses all checks
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Admin has most permissions
      if (req.user.role === 'admin') {
        const hasTenantCheck = permissions.some(p => p.resource === 'tenants');
        if (!hasTenantCheck) {
          return next();
        }
      }

      // Check role-based permissions
      if (req.user.roleId) {
        for (const perm of permissions) {
          const permission = await Permission.findOne({
            roleId: req.user.roleId,
            resource: perm.resource,
            actions: perm.action
          });

          if (permission) {
            return next();
          }
        }
      }

      return res.status(403).json({ 
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        requiredAny: permissions
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Get user's full permissions object
 */
export const getUserPermissions = async (userId: string, roleId?: string): Promise<Record<string, string[]>> => {
  const user = await User.findById(userId);
  
  if (!user) {
    return {};
  }

  // Super admin has all permissions
  if (user.role === 'super_admin') {
    const allResources: ResourceType[] = [
      'dashboard', 'orders', 'products', 'customers', 'inventory',
      'catalog', 'landing_pages', 'gallery', 'reviews', 'daily_target',
      'business_report', 'expenses', 'income', 'due_book', 'profit_loss',
      'notes', 'customization', 'settings', 'admin_control', 'tenants'
    ];
    const allActions = ['read', 'write', 'edit', 'delete'];
    const permissions: Record<string, string[]> = {};
    allResources.forEach(resource => {
      permissions[resource] = allActions;
    });
    return permissions;
  }

  // Admin has all permissions except tenants
  if (user.role === 'admin') {
    const adminResources: ResourceType[] = [
      'dashboard', 'orders', 'products', 'customers', 'inventory',
      'catalog', 'landing_pages', 'gallery', 'reviews', 'daily_target',
      'business_report', 'expenses', 'income', 'due_book', 'profit_loss',
      'notes', 'customization', 'settings', 'admin_control'
    ];
    const allActions = ['read', 'write', 'edit', 'delete'];
    const permissions: Record<string, string[]> = {};
    adminResources.forEach(resource => {
      permissions[resource] = allActions;
    });
    return permissions;
  }

  // Get role-based permissions
  const effectiveRoleId = roleId || user.roleId;
  if (!effectiveRoleId) {
    // Default staff permissions - read only dashboard
    return {
      dashboard: ['read']
    };
  }

  const rolePermissions = await Permission.find({ roleId: effectiveRoleId });
  const permissions: Record<string, string[]> = {};
  
  rolePermissions.forEach(perm => {
    permissions[perm.resource] = perm.actions;
  });

  return permissions;
};
