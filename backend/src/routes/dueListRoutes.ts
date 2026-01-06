import { Router, Request, Response } from 'express';
import { Entity, IEntity } from '../models/Entity';
import { Transaction, ITransaction } from '../models/Transaction';

const router = Router();

// ============ ENTITY ENDPOINTS ============

// GET all entities by type with optional search
router.get('/entities', async (req: Request, res: Response) => {
  try {
    const { type, search } = req.query;
    const filter: any = {};

    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const entities = await Entity.find(filter).sort({ createdAt: -1 });
    res.json(entities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching entities' });
  }
});

// GET single entity with summary
router.get('/entities/:id', async (req: Request, res: Response) => {
  try {
    const entity = await Entity.findById(req.params.id);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    res.json(entity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching entity' });
  }
});

// POST create new entity
router.post('/entities', async (req: Request, res: Response) => {
  try {
    const { name, phone, type } = req.body;

    // Validate required fields
    if (!name || !phone || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if entity already exists
    const existing = await Entity.findOne({ phone });
    if (existing) {
      return res.status(400).json({ error: 'Entity with this phone already exists' });
    }

    const entity = new Entity({
      name,
      phone,
      type,
      totalOwedToMe: 0,
      totalIOweThemNumber: 0,
    });

    await entity.save();
    res.status(201).json(entity);
  } catch (error) {
    res.status(500).json({ error: 'Error creating entity' });
  }
});

// ============ TRANSACTION ENDPOINTS ============

// GET transactions for an entity with date range filter
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { entityId, from, to, status } = req.query;
    const filter: any = {};

    if (entityId) filter.entityId = entityId;
    if (status) filter.status = status;

    if (from || to) {
      filter.transactionDate = {};
      if (from) filter.transactionDate.$gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = toDate;
      }
    }

    const transactions = await Transaction.find(filter)
      .sort({ transactionDate: -1 })
      .lean();

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// GET single transaction
router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transaction' });
  }
});

// POST create new transaction
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const { entityId, entityName, amount, direction, transactionDate, dueDate, notes } = req.body;

    // Validate required fields
    if (!entityId || !amount || !direction || !transactionDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify entity exists
    const entity = await Entity.findById(entityId);
    if (!entity) {
      return res.status(400).json({ error: 'Entity not found' });
    }

    const transaction = new Transaction({
      entityId,
      entityName,
      amount,
      direction,
      transactionDate: new Date(transactionDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
      status: 'Pending',
    });

    await transaction.save();

    // Update entity totals
    if (direction === 'INCOME') {
      entity.totalOwedToMe += amount;
    } else {
      entity.totalIOweThemNumber += amount;
    }
    await entity.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

// PATCH update transaction status
router.patch('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldStatus = transaction.status;
    const oldAmount = transaction.amount;
    const direction = transaction.direction;

    // Update entity totals based on status change
    const entity = await Entity.findById(transaction.entityId);
    if (entity) {
      // Reverse old amount
      if (oldStatus === 'Pending') {
        if (direction === 'INCOME') {
          entity.totalOwedToMe -= oldAmount;
        } else {
          entity.totalIOweThemNumber -= oldAmount;
        }
      }

      // Add new amount if not paid or cancelled
      if (status === 'Pending') {
        if (direction === 'INCOME') {
          entity.totalOwedToMe += oldAmount;
        } else {
          entity.totalIOweThemNumber += oldAmount;
        }
      }

      await entity.save();
    }

    transaction.status = status;
    await transaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

// DELETE transaction
router.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update entity totals
    const entity = await Entity.findById(transaction.entityId);
    if (entity && transaction.status === 'Pending') {
      if (transaction.direction === 'INCOME') {
        entity.totalOwedToMe -= transaction.amount;
      } else {
        entity.totalIOweThemNumber -= transaction.amount;
      }
      await entity.save();
    }

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting transaction' });
  }
});

export default router;
