import { Router, Request } from 'express';
import { z } from 'zod';
import { getTenantData, setTenantData } from '../services/tenantDataService';
import { Server as SocketIOServer } from 'socket.io';
import { Notification } from '../models/Notification';

export const ordersRouter = Router();

// Order schema for validation
const orderSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  customer: z.string(),
  location: z.string().optional(),
  amount: z.number(),
  date: z.string(),
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']).default('Pending'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  division: z.string().optional(),
  variant: z.object({
    color: z.string(),
    size: z.string()
  }).optional(),
  productId: z.number().optional(),
  productName: z.string().optional(),
  quantity: z.number().default(1),
  deliveryType: z.string().optional(),
  deliveryCharge: z.number().optional(),
  trackingId: z.string().optional(),
  courierProvider: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(['store', 'landing_page', 'admin']).optional(),
  landingPageId: z.string().optional()
});

type Order = z.infer<typeof orderSchema>;

// Helper to emit Socket.IO events
const emitOrderUpdate = (req: Request, tenantId: string, event: string, data: unknown) => {
  const io = req.app.get('io') as SocketIOServer | undefined;
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, { tenantId, data, timestamp: Date.now() });
    io.emit('order-update-global', { tenantId, event, timestamp: Date.now() });
    console.log(`[Socket.IO] Emitted ${event} for tenant ${tenantId}`);
  }
};

// Get all orders for a tenant
ordersRouter.get('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    
    const orders = await getTenantData<Order[]>(tenantId, 'orders');
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({ data: orders || [] });
  } catch (error) {
    console.error('[Orders] Error fetching orders:', error);
    next(error);
  }
});

// Create a new order
ordersRouter.post('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    
    const orderData = orderSchema.parse({
      ...req.body,
      tenantId,
      id: req.body.id || `#${Math.floor(1000 + Math.random() * 9000)}`,
      date: req.body.date || new Date().toISOString()
    });
    
    // Get existing orders
    const existingOrders = await getTenantData<Order[]>(tenantId, 'orders') || [];
    
    // Add new order at the beginning
    const updatedOrders = [orderData, ...existingOrders];
    
    // Save orders
    await setTenantData(tenantId, 'orders', updatedOrders);
    
    // Emit real-time update
    emitOrderUpdate(req, tenantId, 'new-order', orderData);
    
    // Create notification for admin
    try {
      const notification = await Notification.create({
        tenantId,
        type: 'order',
        title: `নতুন অর্ডার ${orderData.id}`,
        message: `${orderData.customer} থেকে ৳${orderData.amount.toLocaleString()} টাকার অর্ডার এসেছে`,
        data: {
          orderId: orderData.id,
          customerName: orderData.customer,
          amount: orderData.amount,
          productName: orderData.productName,
          phone: orderData.phone
        }
      });
      
      // Emit socket event for real-time notification with sound trigger
      const io = req.app.get('io') as SocketIOServer | undefined;
      if (io) {
        io.to(`tenant:${tenantId}`).emit('new-notification', notification);
        console.log(`[Notification] Sent new order notification to tenant ${tenantId}`);
      }
    } catch (notifError) {
      console.warn('[Orders] Failed to create notification:', notifError);
    }
    
    console.log(`[Orders] New order ${orderData.id} created for tenant ${tenantId}`);
    res.status(201).json({ data: orderData, success: true });
  } catch (error) {
    console.error('[Orders] Error creating order:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// Update an order
ordersRouter.put('/:tenantId/:orderId', async (req, res, next) => {
  try {
    const { tenantId, orderId } = req.params;
    if (!tenantId || !orderId) {
      return res.status(400).json({ error: 'tenantId and orderId are required' });
    }
    
    // Get existing orders
    const existingOrders = await getTenantData<Order[]>(tenantId, 'orders') || [];
    
    // Find and update the order
    const orderIndex = existingOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedOrder = { ...existingOrders[orderIndex], ...req.body };
    existingOrders[orderIndex] = updatedOrder;
    
    // Save orders
    await setTenantData(tenantId, 'orders', existingOrders);
    
    // Emit real-time update
    emitOrderUpdate(req, tenantId, 'order-updated', updatedOrder);
    
    console.log(`[Orders] Order ${orderId} updated for tenant ${tenantId}`);
    res.json({ data: updatedOrder, success: true });
  } catch (error) {
    console.error('[Orders] Error updating order:', error);
    next(error);
  }
});

// Delete an order
ordersRouter.delete('/:tenantId/:orderId', async (req, res, next) => {
  try {
    const { tenantId, orderId } = req.params;
    if (!tenantId || !orderId) {
      return res.status(400).json({ error: 'tenantId and orderId are required' });
    }
    
    // Get existing orders
    const existingOrders = await getTenantData<Order[]>(tenantId, 'orders') || [];
    
    // Filter out the order to delete
    const updatedOrders = existingOrders.filter(o => o.id !== orderId);
    
    if (updatedOrders.length === existingOrders.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Save orders
    await setTenantData(tenantId, 'orders', updatedOrders);
    
    // Emit real-time update
    emitOrderUpdate(req, tenantId, 'order-deleted', { orderId });
    
    console.log(`[Orders] Order ${orderId} deleted for tenant ${tenantId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Orders] Error deleting order:', error);
    next(error);
  }
});
