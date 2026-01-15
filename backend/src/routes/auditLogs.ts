import { Router, Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// Helper function to create audit log
export async function createAuditLog(data: {
  tenantId?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  actionType?: 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'login' | 'logout' | 'export' | 'import' | 'other';
  resourceType: 'tenant' | 'user' | 'subscription' | 'order' | 'product' | 'category' | 'settings' | 'notification' | 'support_ticket' | 'gallery' | 'carousel' | 'popup' | 'campaign' | 'expense' | 'income' | 'due' | 'review' | 'inventory' | 'other';
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'warning';
}) {
  try {
    const log = new AuditLog({
      ...data,
      actionType: data.actionType || 'other',
      status: data.status || 'success',
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// GET /api/audit-logs - List audit logs (admin or super_admin)
router.get('/', authenticate, authorizeRoles(['super_admin', 'admin', 'tenant_admin']), async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      tenantId,
      userId,
      resourceType,
      actionType,
      action,
      status,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    
    // Tenant admins can only see their own tenant's logs
    const user = (req as any).user;
    if (user.role === 'tenant_admin' || user.role === 'admin') {
      // Get tenantId from user or query
      const userTenantId = user.tenantId || tenantId;
      if (userTenantId) {
        filter.tenantId = userTenantId;
      }
    } else if (tenantId) {
      // Super admin can filter by tenant
      filter.tenantId = tenantId;
    }
    
    if (userId) filter.userId = userId;
    if (resourceType && resourceType !== 'all') filter.resourceType = resourceType;
    if (actionType && actionType !== 'all') filter.actionType = actionType;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }

    // Get logs with pagination
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message,
    });
  }
});

// GET /api/audit-logs/stats - Get audit log statistics
router.get('/stats', authenticate, authorizeRoles(['super_admin', 'admin', 'tenant_admin']), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, tenantId } = req.query;

    const filter: any = {};
    
    // Tenant admins can only see their own tenant's stats
    const user = (req as any).user;
    if (user.role === 'tenant_admin' || user.role === 'admin') {
      const userTenantId = user.tenantId || tenantId;
      if (userTenantId) {
        filter.tenantId = userTenantId;
      }
    } else if (tenantId) {
      filter.tenantId = tenantId;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }

    const [
      totalLogs,
      actionTypeBreakdown,
      resourceBreakdown,
      statusBreakdown,
      topUsers,
    ] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$actionType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$resourceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: { userId: '$userId', userName: '$userName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        actionTypeBreakdown: actionTypeBreakdown.map(item => ({ actionType: item._id, count: item.count })),
        resourceBreakdown: resourceBreakdown.map(item => ({ resourceType: item._id, count: item.count })),
        statusBreakdown: statusBreakdown.map(item => ({ status: item._id, count: item.count })),
        topUsers: topUsers.map(item => ({ 
          userId: item._id.userId, 
          userName: item._id.userName, 
          count: item.count 
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log statistics',
      error: error.message,
    });
  }
});

// POST /api/audit-logs - Create a new audit log entry
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      action,
      actionType,
      resourceType,
      resourceId,
      resourceName,
      details,
      metadata,
      status,
    } = req.body;

    const log = await createAuditLog({
      tenantId: user.tenantId || req.body.tenantId,
      userId: user._id || user.id,
      userName: user.name,
      userRole: user.role,
      action,
      actionType: actionType || 'other',
      resourceType,
      resourceId,
      resourceName,
      details,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: status || 'success',
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create audit log',
      error: error.message,
    });
  }
});

// GET /api/audit-logs/:id - Get specific audit log
router.get('/:id', authenticate, authorizeRoles(['super_admin', 'admin', 'tenant_admin']), async (req: Request, res: Response) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
    }

    // Check tenant access
    const user = (req as any).user;
    if ((user.role === 'tenant_admin' || user.role === 'admin') && log.tenantId !== user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message,
    });
  }
});

export default router;
