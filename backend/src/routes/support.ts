import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SupportTicket, TicketType, TicketStatus } from '../models/SupportTicket';
import { authenticateToken } from '../middleware/auth';
import mongoose from 'mongoose';

export const supportRouter = Router();

// Validation schemas
const createTicketSchema = z.object({
  type: z.enum(['issue', 'feedback', 'feature']),
  title: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  images: z.array(z.string()).max(3).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
});

const updateTicketSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string().email()
  }).optional().nullable()
});

const addCommentSchema = z.object({
  message: z.string().min(1, 'Comment message is required')
});

// GET /api/support - List tickets (with filters)
supportRouter.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId || user.tenantId;
    
    // For super_admin, can see all tickets or filter by tenantId query param
    const filterTenantId = user.role === 'super_admin' 
      ? (req.query.tenantId as string || undefined)
      : tenantId;

    const { type, status, page = '1', limit = '20' } = req.query;

    const query: any = {};
    
    if (filterTenantId) {
      query.tenantId = filterTenantId;
    }
    
    if (type && ['issue', 'feedback', 'feature'].includes(type as string)) {
      query.type = type;
    }
    
    if (status && ['pending', 'in-progress', 'resolved', 'closed'].includes(status as string)) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SupportTicket.countDocuments(query)
    ]);

    res.json({
      data: tickets.map(t => ({
        id: t._id.toString(),
        ...t,
        _id: undefined
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/support/stats - Get ticket statistics
supportRouter.get('/stats', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId || user.tenantId;
    
    const filterTenantId = user.role === 'super_admin' 
      ? (req.query.tenantId as string || undefined)
      : tenantId;

    const matchQuery: any = {};
    if (filterTenantId) {
      matchQuery.tenantId = filterTenantId;
    }

    const [statusStats, typeStats, totalCount] = await Promise.all([
      SupportTicket.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      SupportTicket.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      SupportTicket.countDocuments(matchQuery)
    ]);

    res.json({
      data: {
        total: totalCount,
        byStatus: statusStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {} as Record<string, number>),
        byType: typeStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/support/:id - Get single ticket
supportRouter.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId || user.tenantId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await SupportTicket.findById(id).lean();
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access - super_admin can see all, others only their tenant's tickets
    if (user.role !== 'super_admin' && ticket.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      data: {
        id: ticket._id.toString(),
        ...ticket,
        _id: undefined
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/support - Create new ticket
supportRouter.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const userId = req.userId || user._id?.toString();
    const email = user.email;
    const tenantId = req.tenantId || user.tenantId;
    
    // Get user's name from the request or user object
    const userName = req.body.userName || user.name || email.split('@')[0];

    const validatedData = createTicketSchema.parse(req.body);

    // Use provided tenantId for super_admin, otherwise use user's tenantId
    const ticketTenantId = user.role === 'super_admin' && req.body.tenantId 
      ? req.body.tenantId 
      : (tenantId || 'global');

    const ticket = new SupportTicket({
      tenantId: ticketTenantId,
      type: validatedData.type,
      title: validatedData.title || getDefaultTitle(validatedData.type),
      description: validatedData.description,
      images: validatedData.images || [],
      priority: validatedData.priority || 'medium',
      submittedBy: {
        userId,
        name: userName,
        email
      }
    });

    await ticket.save();

    res.status(201).json({
      message: 'Support ticket created successfully',
      data: {
        id: ticket._id.toString(),
        ...ticket.toObject(),
        _id: undefined
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// PATCH /api/support/:id - Update ticket
supportRouter.patch('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId || user.tenantId;
    const role = user.role;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await SupportTicket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access - super_admin can update all, admin/tenant_admin only their tenant's tickets
    if (role !== 'super_admin' && ticket.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const validatedData = updateTicketSchema.parse(req.body);

    // Update fields
    if (validatedData.status !== undefined) {
      ticket.status = validatedData.status;
      if (validatedData.status === 'resolved') {
        ticket.resolvedAt = new Date();
      }
    }
    
    if (validatedData.priority !== undefined) {
      ticket.priority = validatedData.priority;
    }
    
    if (validatedData.assignedTo !== undefined) {
      if (validatedData.assignedTo === null) {
        ticket.assignedTo = undefined;
      } else {
        ticket.assignedTo = {
          userId: validatedData.assignedTo.userId,
          name: validatedData.assignedTo.name,
          email: validatedData.assignedTo.email
        };
      }
    }

    await ticket.save();

    res.json({
      message: 'Ticket updated successfully',
      data: {
        id: ticket._id.toString(),
        ...ticket.toObject(),
        _id: undefined
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// POST /api/support/:id/comments - Add comment to ticket
supportRouter.post('/:id/comments', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const userId = req.userId || user._id?.toString();
    const tenantId = req.tenantId || user.tenantId;
    const email = user.email;
    const role = user.role;
    const { id } = req.params;
    const userName = user.name || email.split('@')[0];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await SupportTicket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access
    if (role !== 'super_admin' && ticket.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const validatedData = addCommentSchema.parse(req.body);

    const comment = {
      id: new mongoose.Types.ObjectId().toString(),
      userId,
      userName,
      message: validatedData.message,
      createdAt: new Date()
    };

    ticket.comments.push(comment);
    await ticket.save();

    res.status(201).json({
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// DELETE /api/support/:id - Delete ticket (admin only)
supportRouter.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId || user.tenantId;
    const role = user.role;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await SupportTicket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only super_admin can delete any ticket, others can delete their own tenant's tickets
    if (role !== 'super_admin' && ticket.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await SupportTicket.deleteOne({ _id: id });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate default titles
function getDefaultTitle(type: TicketType): string {
  switch (type) {
    case 'issue':
      return 'Website Issue Report';
    case 'feedback':
      return 'Website Feedback';
    case 'feature':
      return 'Feature Request';
    default:
      return 'Support Ticket';
  }
}

export default supportRouter;
