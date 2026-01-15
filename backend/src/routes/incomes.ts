import { Router } from 'express';
import { getDatabase } from '../db/mongo';
import { ObjectId } from 'mongodb';
import { createAuditLog } from './auditLogs';

export const incomesRouter = Router();

// List with filters and pagination
incomesRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');

    const { query, status, category, from, to } = req.query as any;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (query) filter.name = { $regex: String(query), $options: 'i' };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const total = await col.countDocuments(filter);
    const items = await col.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

// Summary
incomesRouter.get('/summary', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');

    const { from, to } = req.query as any;
    const filter: any = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const items = await col.find(filter).toArray();
    const totalAmount = items.reduce((sum, i: any) => sum + Number(i.amount || 0), 0);
    const categories = new Set(items.map((i: any) => i.category)).size;
    const totalTransactions = items.length;

    res.json({ totalAmount, categories, totalTransactions });
  } catch (e) {
    next(e);
  }
});

// Create
incomesRouter.post('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const payload = req.body;
    const result = await col.insertOne({
      ...payload,
      createdAt: new Date().toISOString(),
    });
    
    // Create audit log for income creation
    const user = (req as any).user;
    await createAuditLog({
      tenantId: payload.tenantId,
      userId: user?._id || user?.id || 'system',
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action: 'Income Created',
      actionType: 'create',
      resourceType: 'income',
      resourceId: result.insertedId.toString(),
      resourceName: payload.name || 'Income',
      details: `Income "${payload.name || 'Income'}" created - ৳${payload.amount}`,
      metadata: { amount: payload.amount, source: payload.source },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });
    res.status(201).json({ ...payload, id: result.insertedId.toString() });
  } catch (e) {
    next(e);
  }
});

// Update
incomesRouter.put('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const { id } = req.params;
    const payload = req.body;
    
    let filter: any;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id };
    }

    await col.updateOne(filter, {
      $set: {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    });
    res.json({ ...payload, id });
  } catch (e) {
    next(e);
  }
});

// Delete
incomesRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('incomes');
    const { id } = req.params;
    
    let filter: any;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { id };
    }

    await col.deleteOne(filter);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default incomesRouter;
