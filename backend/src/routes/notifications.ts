import { Router } from 'express';
import { z } from 'zod';
import { Notification } from '../models/Notification';

export const notificationsRouter = Router();

// Get notifications for a tenant
notificationsRouter.get('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { unreadOnly, limit = '50' } = req.query;
    
    const query: any = { tenantId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10));
    
    const unreadCount = await Notification.countDocuments({ tenantId, isRead: false });
    
    res.json({ data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// Create a notification (called when order is placed)
notificationsRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      tenantId: z.string().min(1),
      type: z.enum(['order', 'review', 'customer', 'inventory', 'system']),
      title: z.string().min(1),
      message: z.string().min(1),
      data: z.record(z.any()).optional()
    });
    
    const payload = schema.parse(req.body);
    const notification = await Notification.create(payload);
    
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${payload.tenantId}`).emit('new-notification', notification);
    }
    
    res.status(201).json({ data: notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Mark notification(s) as read
notificationsRouter.patch('/:tenantId/mark-read', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { notificationIds } = req.body;
    
    if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.updateMany(
        { tenantId, _id: { $in: notificationIds } },
        { isRead: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany({ tenantId }, { isRead: true });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete old notifications (cleanup)
notificationsRouter.delete('/:tenantId/cleanup', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      tenantId,
      isRead: true,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    next(error);
  }
});