import { Router } from 'express';
import { z } from 'zod';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { BillingTransaction } from '../models/BillingTransaction';
import { Invoice } from '../models/Invoice';
import { TrialSettings } from '../models/TrialSettings';
import type { SubscriptionPlanPayload, BillingTransactionPayload, InvoicePayload, RefundPayload } from '../types/subscription';

const subscriptionPlanSchema = z.object({
  name: z.enum(['basic', 'pro', 'enterprise']),
  displayName: z.string().min(2),
  description: z.string().min(10),
  price: z.number().min(0),
  billingCycle: z.enum(['monthly', 'yearly']),
  currency: z.string().default('BDT'),
  features: z.object({
    maxProducts: z.union([z.number(), z.literal('unlimited')]),
    maxOrders: z.union([z.number(), z.literal('unlimited')]),
    maxUsers: z.union([z.number(), z.literal('unlimited')]),
    maxStorageGB: z.union([z.number(), z.literal('unlimited')]),
    customDomain: z.boolean(),
    analyticsAccess: z.boolean(),
    prioritySupport: z.boolean(),
    apiAccess: z.boolean(),
    whiteLabel: z.boolean(),
    multiCurrency: z.boolean(),
    advancedReports: z.boolean()
  }),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  stripePriceId: z.string().optional()
});

const billingTransactionSchema = z.object({
  tenantId: z.string(),
  tenantName: z.string(),
  planName: z.string(),
  amount: z.number().min(0),
  currency: z.string().default('BDT'),
  paymentMethod: z.enum(['card', 'bank_transfer', 'bkash', 'nagad', 'rocket', 'other']),
  billingPeriodStart: z.string().transform(val => new Date(val)),
  billingPeriodEnd: z.string().transform(val => new Date(val)),
  transactionId: z.string().optional(),
  invoiceId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const invoiceSchema = z.object({
  tenantId: z.string(),
  tenantName: z.string(),
  tenantEmail: z.string().email(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })),
  taxRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().transform(val => new Date(val)),
  notes: z.string().optional()
});

const refundSchema = z.object({
  reason: z.string().min(5),
  refundedBy: z.string()
});

const trialSettingsSchema = z.object({
  defaultTrialDays: z.number().min(1).max(365).optional(),
  autoExpireTrials: z.boolean().optional(),
  sendExpirationAlerts: z.boolean().optional(),
  alertDaysBeforeExpiry: z.array(z.number()).optional(),
  allowTrialExtension: z.boolean().optional(),
  maxTrialExtensionDays: z.number().min(0).max(30).optional(),
  requirePaymentMethod: z.boolean().optional(),
  autoConvertToFreePlan: z.boolean().optional(),
  freePlanName: z.string().optional()
});

export const subscriptionsRouter = Router();

// ========== SUBSCRIPTION PLANS ==========

// GET /api/subscriptions/plans - List all subscription plans
subscriptionsRouter.get('/plans', async (_req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.json({ data: plans });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/plans/active - List active subscription plans
subscriptionsRouter.get('/plans/active', async (_req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    res.json({ data: plans });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/plans/:id - Get plan by ID
subscriptionsRouter.get('/plans/:id', async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }
    res.json({ data: plan });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/plans - Create new subscription plan
subscriptionsRouter.post('/plans', async (req, res, next) => {
  try {
    const payload = subscriptionPlanSchema.parse(req.body) as SubscriptionPlanPayload;
    const plan = new SubscriptionPlan(payload);
    await plan.save();
    res.status(201).json({ data: plan, message: 'Subscription plan created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'A plan with this name already exists' });
    }
    next(error);
  }
});

// PUT /api/subscriptions/plans/:id - Update subscription plan
subscriptionsRouter.put('/plans/:id', async (req, res, next) => {
  try {
    const payload = subscriptionPlanSchema.partial().parse(req.body);
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }
    res.json({ data: plan, message: 'Subscription plan updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// DELETE /api/subscriptions/plans/:id - Delete subscription plan
subscriptionsRouter.delete('/plans/:id', async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }
    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ========== BILLING TRANSACTIONS ==========

// GET /api/subscriptions/transactions - List all billing transactions
subscriptionsRouter.get('/transactions', async (req, res, next) => {
  try {
    const { status, tenantId, limit = '50', skip = '0' } = req.query;
    const query: any = {};
    
    if (status) query.status = status;
    if (tenantId) query.tenantId = tenantId;
    
    const transactions = await BillingTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string));
      
    const total = await BillingTransaction.countDocuments(query);
    
    res.json({ 
      data: transactions,
      pagination: {
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/transactions/:id - Get transaction by ID
subscriptionsRouter.get('/transactions/:id', async (req, res, next) => {
  try {
    const transaction = await BillingTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ data: transaction });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/transactions - Create new transaction
subscriptionsRouter.post('/transactions', async (req, res, next) => {
  try {
    const payload = billingTransactionSchema.parse(req.body) as BillingTransactionPayload;
    const transaction = new BillingTransaction({
      ...payload,
      status: 'pending'
    });
    await transaction.save();
    res.status(201).json({ data: transaction, message: 'Transaction created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// PATCH /api/subscriptions/transactions/:id/complete - Mark transaction as completed
subscriptionsRouter.patch('/transactions/:id/complete', async (req, res, next) => {
  try {
    const transaction = await BillingTransaction.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ data: transaction, message: 'Transaction marked as completed' });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/transactions/:id/refund - Refund a transaction
subscriptionsRouter.post('/transactions/:id/refund', async (req, res, next) => {
  try {
    const { reason, refundedBy } = refundSchema.parse(req.body) as RefundPayload;
    
    const transaction = await BillingTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.status === 'refunded') {
      return res.status(400).json({ error: 'Transaction is already refunded' });
    }
    
    if (transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed transactions can be refunded' });
    }
    
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.refundReason = reason;
    transaction.refundedBy = refundedBy;
    
    await transaction.save();
    
    res.json({ data: transaction, message: 'Transaction refunded successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// ========== INVOICES ==========

// GET /api/subscriptions/invoices - List all invoices
subscriptionsRouter.get('/invoices', async (req, res, next) => {
  try {
    const { status, tenantId, limit = '50', skip = '0' } = req.query;
    const query: any = {};
    
    if (status) query.status = status;
    if (tenantId) query.tenantId = tenantId;
    
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string));
      
    const total = await Invoice.countDocuments(query);
    
    res.json({ 
      data: invoices,
      pagination: {
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/invoices/:id - Get invoice by ID
subscriptionsRouter.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ data: invoice });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/invoices - Create new invoice
subscriptionsRouter.post('/invoices', async (req, res, next) => {
  try {
    const payload = invoiceSchema.parse(req.body) as InvoicePayload;
    
    // Generate invoice number
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    
    // Calculate amounts
    const subtotal = payload.lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    const taxRate = payload.taxRate || 0;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;
    
    const lineItems = payload.lineItems.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice
    }));
    
    const invoice = new Invoice({
      invoiceNumber,
      tenantId: payload.tenantId,
      tenantName: payload.tenantName,
      tenantEmail: payload.tenantEmail,
      billingAddress: payload.billingAddress,
      lineItems,
      subtotal,
      tax,
      taxRate,
      total,
      currency: 'BDT',
      status: 'draft',
      dueDate: payload.dueDate,
      notes: payload.notes
    });
    
    await invoice.save();
    res.status(201).json({ data: invoice, message: 'Invoice created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// PATCH /api/subscriptions/invoices/:id/status - Update invoice status
subscriptionsRouter.patch('/invoices/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    }).parse(req.body);
    
    const updateData: any = { status };
    
    if (status === 'paid') {
      updateData.paidDate = new Date();
    }
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ data: invoice, message: `Invoice status updated to ${status}` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// ========== TRIAL SETTINGS ==========

// GET /api/subscriptions/trial-settings - Get trial settings
subscriptionsRouter.get('/trial-settings', async (_req, res, next) => {
  try {
    let settings = await TrialSettings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = new TrialSettings({
        defaultTrialDays: 14,
        autoExpireTrials: true,
        sendExpirationAlerts: true,
        alertDaysBeforeExpiry: [7, 3, 1],
        allowTrialExtension: false,
        maxTrialExtensionDays: 7,
        requirePaymentMethod: false,
        autoConvertToFreePlan: false
      });
      await settings.save();
    }
    
    res.json({ data: settings });
  } catch (error) {
    next(error);
  }
});

// PUT /api/subscriptions/trial-settings - Update trial settings
subscriptionsRouter.put('/trial-settings', async (req, res, next) => {
  try {
    const payload = trialSettingsSchema.parse(req.body);
    
    let settings = await TrialSettings.findOne();
    
    if (!settings) {
      settings = new TrialSettings(payload);
    } else {
      Object.assign(settings, payload);
    }
    
    await settings.save();
    res.json({ data: settings, message: 'Trial settings updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

// GET /api/subscriptions/stats - Get subscription statistics
subscriptionsRouter.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalTransactions,
      completedTransactions,
      totalRevenue,
      monthlyRevenue,
      totalInvoices,
      paidInvoices,
      overdueInvoices
    ] = await Promise.all([
      BillingTransaction.countDocuments(),
      BillingTransaction.countDocuments({ status: 'completed' }),
      BillingTransaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      BillingTransaction.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { 
              $gte: new Date(new Date().setDate(new Date().getDate() - 30)) 
            }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'paid' }),
      Invoice.countDocuments({ status: 'overdue' })
    ]);
    
    res.json({
      data: {
        transactions: {
          total: totalTransactions,
          completed: completedTransactions
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          monthly: monthlyRevenue[0]?.total || 0
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          overdue: overdueInvoices
        }
      }
    });
  } catch (error) {
    next(error);
  }
});
