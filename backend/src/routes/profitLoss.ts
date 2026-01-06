import { Router } from 'express';
import { getDatabase } from '../db/mongo';

export const profitLossRouter = Router();

// Get profit/loss summary
profitLossRouter.get('/summary', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { from, to, tenantId } = req.query as any;

    // Build date filter
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.date = {};
      if (from) dateFilter.date.$gte = from;
      if (to) dateFilter.date.$lte = to;
    }

    // Get orders
    const ordersCol = db.collection('orders');
    const orderFilter: any = { ...dateFilter };
    if (tenantId) orderFilter.tenantId = tenantId;
    
    const orders = await ordersCol.find({
      ...orderFilter,
      status: { $in: ['Pending', 'Confirmed', 'Shipped', 'Delivered'] }
    }).toArray();

    // Get expenses
    const expensesCol = db.collection('expenses');
    const expenseFilter: any = { ...dateFilter };
    if (tenantId) expenseFilter.tenantId = tenantId;
    expenseFilter.status = 'Published';
    
    const expenses = await expensesCol.find(expenseFilter).toArray();

    // Get incomes (if collection exists)
    let incomes: any[] = [];
    try {
      const incomesCol = db.collection('incomes');
      const incomeFilter: any = { ...dateFilter };
      if (tenantId) incomeFilter.tenantId = tenantId;
      incomeFilter.status = 'Published';
      incomes = await incomesCol.find(incomeFilter).toArray();
    } catch (e) {
      // Incomes collection may not exist
    }

    // Get products for cost calculation
    const productsCol = db.collection('products');
    const products = await productsCol.find({}).toArray();
    const productMap = new Map(products.map((p: any) => [p.id?.toString(), p]));

    // Calculate selling price (order amount minus delivery)
    const sellingPrice = orders.reduce(
      (sum, o: any) => sum + ((o.amount || 0) - (o.deliveryCharge || 0)),
      0
    );

    // Calculate purchase price (cost of goods)
    let purchasePrice = 0;
    orders.forEach((order: any) => {
      const product = order.productId ? productMap.get(order.productId.toString()) : null;
      const quantity = order.quantity || 1;
      if (product) {
        // Use costPrice if available, else estimate as 60% of price
        const costPerUnit = (product as any).costPrice || 
          ((product as any).originalPrice ? (product as any).originalPrice * 0.6 : (product as any).price * 0.6);
        purchasePrice += costPerUnit * quantity;
      } else {
        // Estimate cost as 60% of selling price for this order
        purchasePrice += ((order.amount || 0) - (order.deliveryCharge || 0)) * 0.6;
      }
    });

    // Calculate delivery charges collected
    const deliveryPrice = orders.reduce((sum, o: any) => sum + (o.deliveryCharge || 0), 0);

    // Profit from sale
    const profitFromSale = sellingPrice - purchasePrice;

    // Other expenses
    const otherExpense = expenses.reduce((sum, e: any) => sum + (e.amount || 0), 0);

    // Other income
    const otherIncome = incomes.reduce((sum, i: any) => sum + (i.amount || 0), 0);

    // Total profit/loss
    const totalProfitLoss = profitFromSale + otherIncome - otherExpense;

    res.json({
      profitFromSale: {
        sellingPrice,
        purchasePrice,
        deliveryPrice,
        profit: profitFromSale,
      },
      otherIncome,
      otherExpense,
      totalProfitLoss,
      orderCount: orders.length,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    });
  } catch (e) {
    next(e);
  }
});

// Get detailed transactions
profitLossRouter.get('/details', async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { from, to, type, tenantId, page = 1, pageSize = 20 } = req.query as any;
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);

    // Build date filter
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.date = {};
      if (from) dateFilter.date.$gte = from;
      if (to) dateFilter.date.$lte = to;
    }

    const items: any[] = [];

    // Get sales if requested or no type filter
    if (!type || type === 'sale') {
      const ordersCol = db.collection('orders');
      const orderFilter: any = { ...dateFilter };
      if (tenantId) orderFilter.tenantId = tenantId;
      orderFilter.status = { $in: ['Pending', 'Confirmed', 'Shipped', 'Delivered'] };
      
      const orders = await ordersCol.find(orderFilter).toArray();
      orders.forEach((o: any) => {
        items.push({
          id: o._id?.toString() || o.id,
          date: o.date,
          type: 'sale',
          description: `Order #${o.id || o._id} - ${o.productName || 'Product'}`,
          amount: (o.amount || 0) - (o.deliveryCharge || 0),
          category: 'Sales',
        });
      });
    }

    // Get expenses if requested or no type filter
    if (!type || type === 'expense') {
      const expensesCol = db.collection('expenses');
      const expenseFilter: any = { ...dateFilter };
      if (tenantId) expenseFilter.tenantId = tenantId;
      expenseFilter.status = 'Published';
      
      const expenses = await expensesCol.find(expenseFilter).toArray();
      expenses.forEach((e: any) => {
        items.push({
          id: e._id?.toString() || e.id,
          date: e.date,
          type: 'expense',
          description: e.name || 'Expense',
          amount: e.amount || 0,
          category: e.category,
        });
      });
    }

    // Get incomes if requested or no type filter
    if (!type || type === 'income') {
      try {
        const incomesCol = db.collection('incomes');
        const incomeFilter: any = { ...dateFilter };
        if (tenantId) incomeFilter.tenantId = tenantId;
        incomeFilter.status = 'Published';
        
        const incomes = await incomesCol.find(incomeFilter).toArray();
        incomes.forEach((i: any) => {
          items.push({
            id: i._id?.toString() || i.id,
            date: i.date,
            type: 'income',
            description: i.name || 'Income',
            amount: i.amount || 0,
            category: i.category,
          });
        });
      } catch (e) {
        // Incomes collection may not exist
      }
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate
    const total = items.length;
    const paged = items.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    res.json({ items: paged, total });
  } catch (e) {
    next(e);
  }
});

export default profitLossRouter;
