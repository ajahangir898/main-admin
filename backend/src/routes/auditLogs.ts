import { Router, Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

// Helper function to create audit log
export async function createAuditLog(data: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: 'tenant' | 'user' | 'subscription' | 'order' | 'product' | 'settings' | 'notification' | 'support_ticket' | 'other';
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
      status: data.status || 'success',
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// GET /api/audit-logs - List audit logs (super_admin only)
router.get('/', authenticate, authorizeRoles(['super_admin']), async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      resourceType,
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
    if (userId) filter.userId = userId;
    if (resourceType) filter.resourceType = resourceType;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
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

// GET /api/audit-logs/stats - Get audit log statistics (super_admin only)
router.get('/stats', authenticate, authorizeRoles(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const [
      totalLogs,
      actionBreakdown,
      resourceBreakdown,
      statusBreakdown,
      topUsers,
    ] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
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
        actionBreakdown: actionBreakdown.map(item => ({ action: item._id, count: item.count })),
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

// GET /api/audit-logs/:id - Get specific audit log (super_admin only)
router.get('/:id', authenticate, authorizeRoles(['super_admin']), async (req: Request, res: Response) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found',
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
