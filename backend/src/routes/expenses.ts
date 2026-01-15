import { Router } from 'express';
import { getDatabase } from '../db/mongo';
import { ObjectId } from 'mongodb';
import { createAuditLog } from './auditLogs';

export const expensesRouter = Router();

// List with filters and pagination
expensesRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');

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
expensesRouter.get('/summary', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');

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
expensesRouter.post('/', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const payload = req.body;

    const required = ['name','category','amount','date','status'];
    for (const k of required) {
      if (!(k in payload)) {
        return res.status(400).json({ error: `Missing field: ${k}` });
      }
    }

    const doc = {
      name: String(payload.name),
      category: String(payload.category),
      amount: Number(payload.amount),
      date: String(payload.date),
      status: String(payload.status),
      note: payload.note ? String(payload.note) : undefined,
      imageUrl: payload.imageUrl ? String(payload.imageUrl) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await col.insertOne(doc as any);
    
    // Create audit log for expense creation
    const user = (req as any).user;
    await createAuditLog({
      tenantId: user?.tenantId || 'unknown',
      userId: user?._id || user?.id || 'system',
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action: 'Expense Created',
      actionType: 'create',
      resourceType: 'expense',
      resourceId: String(result.insertedId),
      resourceName: doc.name,
      details: `Expense "${doc.name}" created - ৳${doc.amount} (${doc.category})`,
      metadata: { amount: doc.amount, category: doc.category },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });
    res.status(201).json({ id: String(result.insertedId), ...doc });
  } catch (e) {
    next(e);
  }
});

// Update
expensesRouter.put('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const { id } = req.params;
    const payload = req.body || {};

    const updates: any = { ...payload, updatedAt: new Date().toISOString() };

    await col.updateOne({ _id: new (require('mongodb').ObjectId)(id) }, { $set: updates });
    const doc = await col.findOne({ _id: new (require('mongodb').ObjectId)(id) });
    res.json({ id, ...doc, _id: undefined });
  } catch (e) {
    next(e);
  }
});

// Delete
expensesRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expenses');
    const { id } = req.params;

    await col.deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ===== CATEGORIES =====

// List categories
expensesRouter.get('/categories/list', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const items = await col.find({}).sort({ name: 1 }).toArray();
    res.json({ items: items.map(i => ({ id: String(i._id), ...i, _id: undefined })) });
  } catch (e) {
    next(e);
  }
});

// Create category
expensesRouter.post('/categories/create', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const doc = { name: String(name).trim(), createdAt: new Date().toISOString() };
    const result = await col.insertOne(doc as any);
    res.status(201).json({ id: String(result.insertedId), ...doc });
    
  } catch (e) {
    next(e);
  }
});

// Update category
expensesRouter.put('/categories/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const oid = new ObjectId(id);
    await col.updateOne({ _id: oid }, { $set: { name: String(name).trim() } });
    const doc = await col.findOne({ _id: oid });
    res.json({ id: String(doc?._id), ...doc, _id: undefined });
  } catch (e) {
    next(e);
  }
});

// Delete category
expensesRouter.delete('/categories/:id', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const col = db.collection('expense_categories');
    const { id } = req.params;

    await col.deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
