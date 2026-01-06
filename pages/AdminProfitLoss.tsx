import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Calendar,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Truck,
  CreditCard,
  PiggyBank,
  Receipt,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { ProfitLossService, ProfitLossSummary } from '../services/ProfitLossService';
import { ExpenseService } from '../services/ExpenseService';
import { Order, Product } from '../types';

interface AdminProfitLossProps {
  orders?: Order[];
  products?: Product[];
}

const formatCurrency = (amount: number) =>
  `৳${Math.abs(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const AdminProfitLoss: React.FC<AdminProfitLossProps> = ({ orders = [], products = [] }) => {
  // Date range state - default to last 30 days
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  });

  const [summary, setSummary] = useState<ProfitLossSummary>({
    profitFromSale: { sellingPrice: 0, purchasePrice: 0, deliveryPrice: 0, profit: 0 },
    otherIncome: 0,
    otherExpense: 0,
    totalProfitLoss: 0,
    orderCount: 0,
    expenseCount: 0,
    incomeCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return orders.filter((order) => {
      const orderDate = new Date(order.date);
      return orderDate >= fromDate && orderDate <= toDate;
    });
  }, [orders, dateRange]);

  // Calculate summary from local data
  const calculateLocalSummary = useCallback(async () => {
    try {
      // Get expenses for the date range
      const expenseRes = await ExpenseService.list({
        from: dateRange.from,
        to: dateRange.to,
        status: 'Published',
      });

      // Map products by ID for cost lookup
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Calculate profit from sales
      const validOrders = filteredOrders.filter((o) =>
        ['Delivered', 'Confirmed', 'Shipped', 'Pending'].includes(o.status)
      );

      // Calculate selling price (order amount minus delivery)
      const sellingPrice = validOrders.reduce(
        (sum, o) => sum + (o.amount - (o.deliveryCharge || 0)),
        0
      );

      // Calculate purchase price (sum of product costs)
      // For now, estimate as 60% of selling price if cost not available
      let purchasePrice = 0;
      validOrders.forEach((order) => {
        const product = order.productId ? productMap.get(order.productId) : null;
        const quantity = order.quantity || 1;
        if (product) {
          // Use originalPrice as cost if available, else estimate
          const costPerUnit = product.originalPrice
            ? product.originalPrice * 0.6
            : product.price * 0.6;
          purchasePrice += costPerUnit * quantity;
        } else {
          // Estimate cost as 60% of selling price
          purchasePrice += (order.amount - (order.deliveryCharge || 0)) * 0.6;
        }
      });

      // Calculate delivery charges
      const deliveryPrice = validOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

      // Profit from sale
      const profitFromSale = sellingPrice - purchasePrice;

      // Other expenses from expense service
      const otherExpense = expenseRes.items.reduce((sum, e) => sum + e.amount, 0);

      // TODO: Implement income tracking separately
      // For now, other income is 0 unless we have an income service
      const otherIncome = 0;

      // Total profit/loss
      const totalProfitLoss = profitFromSale + otherIncome - otherExpense;

      return {
        profitFromSale: {
          sellingPrice,
          purchasePrice,
          deliveryPrice,
          profit: profitFromSale,
        },
        otherIncome,
        otherExpense,
        totalProfitLoss,
        orderCount: validOrders.length,
        expenseCount: expenseRes.items.length,
        incomeCount: 0,
      };
    } catch (error) {
      console.error('Error calculating profit/loss:', error);
      // Return calculation from orders only
      return ProfitLossService.calculateFromData(
        filteredOrders.map((o) => ({
          amount: o.amount,
          deliveryCharge: o.deliveryCharge,
          status: o.status,
          productCost: 0,
        })),
        [],
        []
      );
    }
  }, [filteredOrders, products, dateRange]);

  // Fetch/calculate data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Try API first
      const apiSummary = await ProfitLossService.getSummary({
        from: dateRange.from,
        to: dateRange.to,
      });

      // If API returns data, use it
      if (apiSummary.orderCount > 0 || apiSummary.expenseCount > 0) {
        setSummary(apiSummary);
      } else {
        // Fall back to local calculation
        const localSummary = await calculateLocalSummary();
        setSummary(localSummary);
      }
    } catch (error) {
      // Fall back to local calculation
      const localSummary = await calculateLocalSummary();
      setSummary(localSummary);
    } finally {
      setLoading(false);
    }
  }, [dateRange, calculateLocalSummary]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleDownload = () => {
    ProfitLossService.downloadReport(summary, dateRange);
  };

  const handlePrint = () => {
    ProfitLossService.printReport(summary, dateRange);
  };

  const isProfitable = summary.totalProfitLoss >= 0;

  return (
    <div className="p-6 bg-[#0a0a0f] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {isProfitable ? (
              <TrendingUp className="w-7 h-7 text-emerald-500" />
            ) : (
              <TrendingDown className="w-7 h-7 text-red-500" />
            )}
            Profit / Loss Report
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your business performance and financial health
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition border border-emerald-500/30"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition border border-blue-500/30"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition border border-slate-600/50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-[#12121a] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="text-slate-500">—</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            {['7d', '30d', '90d', 'All'].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  const to = new Date();
                  const from = new Date();
                  if (preset === '7d') from.setDate(from.getDate() - 7);
                  else if (preset === '30d') from.setDate(from.getDate() - 30);
                  else if (preset === '90d') from.setDate(from.getDate() - 90);
                  else from.setFullYear(2020, 0, 1);
                  setDateRange({
                    from: from.toISOString().split('T')[0],
                    to: to.toISOString().split('T')[0],
                  });
                }}
                className="px-3 py-1 text-xs rounded-full border border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:text-white transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Summary Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profit From Sale Section */}
            <div className="bg-gradient-to-br from-[#12121a] to-[#0d0d14] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-emerald-500/5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-500" />
                  Profit From Sale
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Selling Price</p>
                      <p className="text-xs text-slate-500">Total revenue from sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(summary.profitFromSale.sellingPrice)}
                    </p>
                    <button className="text-xs text-emerald-400 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Purchase Price</p>
                      <p className="text-xs text-slate-500">Cost of goods sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(summary.profitFromSale.purchasePrice)}
                    </p>
                    <button className="text-xs text-emerald-400 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Delivery Price</p>
                      <p className="text-xs text-slate-500">Shipping charges collected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(summary.profitFromSale.deliveryPrice)}
                    </p>
                    <button className="text-xs text-emerald-400 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Income Section */}
            <div className="bg-gradient-to-br from-[#12121a] to-[#0d0d14] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-green-500/5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-green-500" />
                  Other Income
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Gross Income</p>
                      <p className="text-xs text-slate-500">Income from other sources</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(summary.otherIncome)}
                    </p>
                    <button className="text-xs text-emerald-400 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Expense Section */}
            <div className="bg-gradient-to-br from-[#12121a] to-[#0d0d14] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-red-500/5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-red-500" />
                  Other Expense
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Total Expense</p>
                      <p className="text-xs text-slate-500">Operating & misc expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-400">
                      {formatCurrency(summary.otherExpense)}
                    </p>
                    <button className="text-xs text-emerald-400 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Summary */}
          <div className="space-y-6">
            {/* Total Profit/Loss Card */}
            <div
              className={`rounded-xl border overflow-hidden ${
                isProfitable
                  ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border-emerald-500/30'
                  : 'bg-gradient-to-br from-red-900/30 to-red-950/50 border-red-500/30'
              }`}
            >
              <div className="p-6 text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    isProfitable ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}
                >
                  {isProfitable ? (
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-2">TOTAL PROFIT / LOSS</p>
                <p
                  className={`text-3xl font-bold ${
                    isProfitable ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isProfitable ? '+' : '-'}
                  {formatCurrency(summary.totalProfitLoss)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDate(new Date(dateRange.from))} - {formatDate(new Date(dateRange.to))}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-[#12121a] rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Orders</span>
                  <span className="text-white font-semibold">{summary.orderCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Expenses</span>
                  <span className="text-white font-semibold">{summary.expenseCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Other Income</span>
                  <span className="text-white font-semibold">{summary.incomeCount}</span>
                </div>
                <hr className="border-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Gross Margin</span>
                  <span
                    className={`font-semibold ${
                      summary.profitFromSale.sellingPrice > 0
                        ? summary.profitFromSale.profit >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {summary.profitFromSale.sellingPrice > 0
                      ? `${((summary.profitFromSale.profit / summary.profitFromSale.sellingPrice) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Net Margin</span>
                  <span
                    className={`font-semibold ${
                      summary.profitFromSale.sellingPrice > 0
                        ? summary.totalProfitLoss >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {summary.profitFromSale.sellingPrice > 0
                      ? `${((summary.totalProfitLoss / summary.profitFromSale.sellingPrice) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-[#12121a] rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-400">+ Sales Revenue</span>
                  <span className="text-white">
                    {formatCurrency(summary.profitFromSale.sellingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-400">- Cost of Goods</span>
                  <span className="text-white">
                    {formatCurrency(summary.profitFromSale.purchasePrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400">+ Other Income</span>
                  <span className="text-white">{formatCurrency(summary.otherIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-400">- Other Expenses</span>
                  <span className="text-white">{formatCurrency(summary.otherExpense)}</span>
                </div>
                <hr className="border-white/5 my-2" />
                <div className="flex items-center justify-between font-semibold">
                  <span className={isProfitable ? 'text-emerald-400' : 'text-red-400'}>
                    = {isProfitable ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <span className={isProfitable ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(summary.totalProfitLoss)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfitLoss;
