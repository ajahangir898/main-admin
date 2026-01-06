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
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {isProfitable ? (
              <TrendingUp className="w-7 h-7 text-emerald-500" />
            ) : (
              <TrendingDown className="w-7 h-7 text-red-500" />
            )}
            Profit / Loss Report
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your business performance and financial health
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition border border-emerald-200"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-200"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
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
                className="px-3 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-500" />
                  Profit From Sale
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Selling Price</p>
                      <p className="text-xs text-gray-400">Total revenue from sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(summary.profitFromSale.sellingPrice)}
                    </p>
                    <button className="text-xs text-emerald-600 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Purchase Price</p>
                      <p className="text-xs text-gray-400">Cost of goods sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(summary.profitFromSale.purchasePrice)}
                    </p>
                    <button className="text-xs text-emerald-600 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Delivery Price</p>
                      <p className="text-xs text-gray-400">Shipping charges collected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(summary.profitFromSale.deliveryPrice)}
                    </p>
                    <button className="text-xs text-emerald-600 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Income Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-green-500" />
                  Other Income
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Gross Income</p>
                      <p className="text-xs text-gray-400">Income from other sources</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(summary.otherIncome)}
                    </p>
                    <button className="text-xs text-emerald-600 hover:underline flex items-center gap-1 ml-auto">
                      See Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Expense Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-red-500" />
                  Other Expense
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Expense</p>
                      <p className="text-xs text-gray-400">Operating & misc expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(summary.otherExpense)}
                    </p>
                    <button className="text-xs text-emerald-600 hover:underline flex items-center gap-1 ml-auto">
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
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
              }`}
            >
              <div className="p-6 text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    isProfitable ? 'bg-emerald-200' : 'bg-red-200'
                  }`}
                >
                  {isProfitable ? (
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2">TOTAL PROFIT / LOSS</p>
                <p
                  className={`text-3xl font-bold ${
                    isProfitable ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {isProfitable ? '+' : '-'}
                  {formatCurrency(summary.totalProfitLoss)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDate(new Date(dateRange.from))} - {formatDate(new Date(dateRange.to))}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Orders</span>
                  <span className="text-gray-900 font-semibold">{summary.orderCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Expenses</span>
                  <span className="text-gray-900 font-semibold">{summary.expenseCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Other Income</span>
                  <span className="text-gray-900 font-semibold">{summary.incomeCount}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Gross Margin</span>
                  <span
                    className={`font-semibold ${
                      summary.profitFromSale.sellingPrice > 0
                        ? summary.profitFromSale.profit >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {summary.profitFromSale.sellingPrice > 0
                      ? `${((summary.profitFromSale.profit / summary.profitFromSale.sellingPrice) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Net Margin</span>
                  <span
                    className={`font-semibold ${
                      summary.profitFromSale.sellingPrice > 0
                        ? summary.totalProfitLoss >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                        : 'text-gray-400'
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">
                Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">+ Sales Revenue</span>
                  <span className="text-gray-900">
                    {formatCurrency(summary.profitFromSale.sellingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600">- Cost of Goods</span>
                  <span className="text-gray-900">
                    {formatCurrency(summary.profitFromSale.purchasePrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">+ Other Income</span>
                  <span className="text-gray-900">{formatCurrency(summary.otherIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">- Other Expenses</span>
                  <span className="text-gray-900">{formatCurrency(summary.otherExpense)}</span>
                </div>
                <hr className="border-gray-100 my-2" />
                <div className="flex items-center justify-between font-semibold">
                  <span className={isProfitable ? 'text-emerald-600' : 'text-red-600'}>
                    = {isProfitable ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <span className={isProfitable ? 'text-emerald-600' : 'text-red-600'}>
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
