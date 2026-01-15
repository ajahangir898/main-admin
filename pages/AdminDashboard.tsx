import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  PackageCheck,
  ArchiveRestore,
  LayoutGrid,
  TrendingUp,
  Download,
  Wallet,
  Calendar,
  ChevronDown,
  Eye,
  Users,
  MoreHorizontal,
  Globe,
  Wifi,
  Settings,
  Filter,
  ExternalLink,
  Play,
  AlertCircle,
  Star,
  Package,
  MessageCircle,
  Search,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import { Order, Product } from '../types';
import { useVisitorStats } from '../hooks/useVisitorStats';

// Chart default data types
type RevenueDataPoint = { name: string; sales: number; costs: number };
type ProfitDataPoint = { name: string; value: number };
type CategoryDataPoint = { name: string; value: number; color: string };

const ALLOWED_REVENUE_STATUSES: Array<Order['status']> = ['Pending', 'Confirmed', 'On Hold', 'Processing', 'Shipped', 'Sent to Courier', 'Delivered'];

const CATEGORY_COLORS = [
  { bg: '#3B82F6', label: 'ABC' },
  { bg: '#10B981', label: 'NBC' },
  { bg: '#F97316', label: 'CBS' },
  { bg: '#06B6D4', label: 'CNN' },
  { bg: '#8B5CF6', label: 'AOL' },
  { bg: '#EC4899', label: 'MSN' },
];

const parseOrderDate = (dateString?: string) => {
  if (!dateString) return null;
  const direct = Date.parse(dateString);
  if (!Number.isNaN(direct)) return new Date(direct);
  const sanitized = Date.parse(dateString.replace(/,/g, ''));
  return Number.isNaN(sanitized) ? null : new Date(sanitized);
};

const buildMonthlyRevenueData = (orders: Order[]) => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  const labels = ['Dec 1', 'Dec 8', 'Dec 15', 'Dec 22', 'Dec 29'];

  return labels.map((name, index) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (index * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    let sales = 0;
    orders.forEach(order => {
      if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
      const orderDate = parseOrderDate(order.date);
      if (!orderDate || orderDate < weekStart || orderDate > weekEnd) return;
      sales += order.amount;
    });

    const costs = Math.round(sales * 0.6);

    return { name, sales, costs };
  });
};

const buildCategoryBreakdown = (orders: Order[], products: Product[]): CategoryDataPoint[] => {
  if (!orders.length) return [];

  const productById = new Map(products.map((product) => [product.id, product]));
  const productByName = new Map(products.map((product) => [product.name.toLowerCase(), product]));
  const totals: Record<string, number> = {};

  orders.forEach((order) => {
    if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
    const matchedProduct =
      (order.productId && productById.get(order.productId)) ||
      (order.productName ? productByName.get(order.productName.toLowerCase()) : undefined);
    const category = matchedProduct?.category || 'Other';
    totals[category] = (totals[category] || 0) + order.amount;
  });

  const dataset = Object.entries(totals)
    .map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length].bg
    }))
    .sort((a, b) => b.value - a.value);

  return dataset;
};

const exportOrdersToCsv = (orders: Order[]) => {
  if (typeof window === 'undefined' || !orders.length) return;
  const header = ['Order ID', 'Customer', 'Amount', 'Status', 'Date'];
  const rows = orders.map((order) => [order.id, order.customer, order.amount, order.status, order.date]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `dashboard-orders-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  tenantId?: string;
  user?: { name?: string; avatar?: string } | null;
  onManageBalance?: () => void;
  onExportData?: (orders: Order[]) => void;
  onCreatePayment?: () => void;
  onSearch?: (query: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  tenantId,
  user,
  onManageBalance,
  onExportData,
  onCreatePayment,
  onSearch
}) => {
  const [language, setLanguage] = useState<'Eng' | 'বাংলা'>('Eng');
  const [searchQuery, setSearchQuery] = useState('');

  // Visitor stats
  const { stats: visitorStats, isLoading: visitorLoading } = useVisitorStats({
    tenantId,
    period: '7d',
    refreshInterval: 30000
  });

  // Calculate stats
  const totalOrders = orders.length;
  const today = new Date().toDateString();
  const todayOrders = useMemo(
    () => orders.filter((order) => {
      const parsed = parseOrderDate(order.date);
      return parsed && parsed.toDateString() === today;
    }).length,
    [orders, today]
  );

  const courierOrders = useMemo(() => orders.filter((order) => Boolean(order.courierProvider)).length, [orders]);
  const confirmedOrders = useMemo(() => orders.filter((order) => order.status === 'Confirmed').length, [orders]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'Pending').length, [orders]);
  const cancelledOrders = useMemo(() => orders.filter((order) => order.status === 'Cancelled').length, [orders]);
  const returnsCount = useMemo(() => orders.filter((order) => order.status === 'Returned').length, [orders]);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.amount, 0), [orders]);
  const lowStockProducts = useMemo(() => products.filter(p => (p.stock || 0) < 10).length, [products]);
  const toBeReviewed = useMemo(() => orders.filter(o => o.status === 'Pending').length, [orders]);

  // Chart data
  const revenueData = useMemo(() => buildMonthlyRevenueData(orders), [orders]);
  const categoryData = useMemo(() => buildCategoryBreakdown(orders, products), [orders, products]);

  // Profit data
  const profitData = useMemo(() => {
    return revenueData.map(item => ({
      name: item.name,
      value: item.sales - item.costs
    }));
  }, [revenueData]);

  const totalProfit = useMemo(() => profitData.reduce((sum, item) => sum + item.value, 0), [profitData]);

  // Best selling products
  const bestSellingProducts = useMemo(() => {
    const productSales: Record<string, { product: Product; orders: number; revenue: number }> = {};

    orders.forEach(order => {
      if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
      const product = products.find(p => p.id === order.productId);
      if (product) {
        if (!productSales[product.id]) {
          productSales[product.id] = { product, orders: 0, revenue: 0 };
        }
        productSales[product.id].orders++;
        productSales[product.id].revenue += order.amount;
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  }, [orders, products]);

  // Top products for sidebar
  const topProducts = useMemo(() => products.slice(0, 5), [products]);

  const handleExport = useCallback(() => {
    if (onExportData) return onExportData(orders);
    exportOrdersToCsv(orders);
  }, [orders, onExportData]);

  // Get current day info
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace('/', '/');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Welcome back, {user?.name || 'Yuvraj'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Monitor your business analytics and statistics.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Website - hidden on mobile, visible on larger screens */}
            <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition">
              <Globe className="w-4 h-4" />
              View Website
            </button>

            {/* Tutorials Button - hidden on mobile */}
            <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition">
              <Play className="w-4 h-4" />
              Tutorials
            </button>

            {/* Search Bar - full width on mobile */}
            <div className="relative flex-1 sm:flex-none order-last sm:order-none w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 lg:w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="p-2 hover:bg-gray-50 rounded-lg transition">
                <Moon className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition">
                <MessageCircle className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition">
                <Bell className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* User */}
            <div className="flex items-center gap-2 ml-1 sm:ml-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-gray-400">Admin</p>
                <p className="text-sm font-medium text-gray-700">{user?.name || 'Yuvraj'}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                    user?.name?.charAt(0) || 'Y'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Order Analytics Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Order Analytics</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Products on Hands */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{products.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Products on Hands</p>
                </div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{totalOrders}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Orders</p>
                </div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4">
              <p className="text-xs text-gray-600 mb-2">Language</p>
              <div className="flex items-center gap-1 bg-white/0 border border-white rounded-full p-1">
                <button
                  onClick={() => setLanguage('Eng')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition ${language === 'Eng' ? 'bg-white text-gray-900' : 'text-gray-600'}`}
                >
                  Eng
                </button>
                <button
                  onClick={() => setLanguage('বাংলা')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs transition ${language === 'বাংলা' ? 'bg-white text-gray-900' : 'text-gray-600'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Date Display */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4 flex flex-col">
              <p className="text-sm sm:text-base font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{currentDate}</p>
              <div className="mt-auto">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg text-center">
                  <p className="text-white font-medium text-xl sm:text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{currentDay}</p>
                </div>
              </div>
            </div>

            {/* Important Notification */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4 col-span-2">
              <p className="text-xs text-gray-600 mb-2">Important Notification</p>
              <div className="h-16 sm:h-20 bg-white rounded-lg"></div>
              <div className="flex justify-center gap-1.5 mt-2 sm:mt-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="w-4 h-2 rounded-full bg-blue-500"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
            {/* Reserved Price */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-1">Reserved Price</p>
                </div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white flex items-center justify-center">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{lowStockProducts}</p>
                  <p className="text-xs text-gray-600 mt-1">Low Stock</p>
                </div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                </div>
              </div>
            </div>

            {/* To be Reviewed */}
            <div className="bg-[#f2f2f2] rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{toBeReviewed}</p>
                  <p className="text-xs text-gray-600 mt-1">To be Reviewed</p>
                </div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white flex items-center justify-center">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Quick Action Placeholder - hidden on mobile */}
            <div className="hidden md:block bg-[#f2f2f2] rounded-lg p-3 sm:p-4 opacity-0">
              {/* Empty placeholder for alignment */}
            </div>
          </div>
        </div>

        {/* Visitor Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Online Now */}
          <div className="rounded-lg p-3 sm:p-4 overflow-hidden relative shadow-sm" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%), linear-gradient(90deg, #88c9ff 0%, #88c9ff 100%)' }}>
            <div className="absolute right-0 top-[-40px] w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-blue-400/20"></div>
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <Wifi className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-blue-500 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>Online Now</p>
                <p className="text-xs text-gray-600 truncate">Active visitors on site</p>
              </div>
              <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.onlineNow || 35}</p>
            </div>
          </div>

          {/* Today Visitors */}
          <div className="rounded-lg p-3 sm:p-4 overflow-hidden relative shadow-sm" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%), linear-gradient(90deg, #ffc388 0%, #ffc388 100%)' }}>
            <div className="absolute right-0 top-[-40px] w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-orange-400/20"></div>
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-orange-500 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>Today visitors</p>
                <p className="text-xs text-gray-600 truncate">Last 7 days: {visitorStats?.periodVisitors || 4}</p>
              </div>
              <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.todayVisitors || 35}</p>
            </div>
          </div>

          {/* Total Visitors */}
          <div className="rounded-lg p-3 sm:p-4 overflow-hidden relative shadow-sm" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%), linear-gradient(90deg, #a288ff 0%, #a288ff 100%)' }}>
            <div className="absolute right-0 top-[-40px] w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-purple-400/20"></div>
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-purple-600 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>Total visitors</p>
                <p className="text-xs text-gray-600 truncate">{visitorStats?.totalPageViews || 15} page view</p>
              </div>
              <p className="text-xl sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.totalVisitors || 35}</p>
            </div>
          </div>
        </div>

        {/* Order Status Row */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Order</h3>
          {/* Scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 min-w-[500px] sm:min-w-0">
              {/* Today */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#ffd9f4] flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                </div>
                <span className="text-xs text-gray-600 flex-1 truncate">Today</span>
                <span className="text-lg sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{todayOrders}</span>
              </div>

              {/* Courier */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#ffedd5] flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <span className="text-xs text-gray-600 flex-1 truncate">Courier</span>
                <span className="text-lg sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{courierOrders}</span>
              </div>

              {/* Confirmed */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <span className="text-xs text-gray-600 flex-1 truncate">Confirmed</span>
                <span className="text-lg sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{confirmedOrders}</span>
              </div>

              {/* Pending */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#fef3c6] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                </div>
                <span className="text-xs text-gray-600 flex-1 truncate">Pending</span>
                <span className="text-lg sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{pendingOrders}</span>
              </div>

              {/* Canceled */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#fee2e1] flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
                <span className="text-xs text-gray-600 flex-1 truncate">Canceled</span>
                <span className="text-lg sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{cancelledOrders}</span>
              </div>

              {/* Returns */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#dbeaff] flex items-center justify-center flex-shrink-0">
                  <ArchiveRestore className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <span className="text-xs text-gray-600 flex-1 truncate">Returns</span>
                <span className="text-lg sm:text-2xl font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{returnsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Revenue & Costs */}
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 sm:mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Revenue & Costs</h3>

            <div className="flex items-center gap-4 sm:gap-6 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-blue-500"></span>
                <span className="text-xs text-gray-600">Net Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-red-400"></span>
                <span className="text-xs text-gray-600">Costs</span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-40 relative">
              <svg className="w-full h-full" viewBox="0 0 300 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Y-axis labels */}
                <text x="0" y="12" className="text-[8px] fill-gray-400">$80K</text>
                <text x="0" y="40" className="text-[8px] fill-gray-400">$60K</text>
                <text x="0" y="68" className="text-[8px] fill-gray-400">$40K</text>
                <text x="0" y="96" className="text-[8px] fill-gray-400">$20K</text>
                <text x="0" y="124" className="text-[8px] fill-gray-400">$0</text>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="28" y1={10 + i * 28} x2="295" y2={10 + i * 28} stroke="#E5E7EB" strokeWidth="0.5" />
                ))}

                {/* Sales Area */}
                <path
                  d="M28,95 Q80,55 150,75 T270,35 L270,122 L28,122 Z"
                  fill="url(#salesGradient)"
                />
                <path
                  d="M28,95 Q80,55 150,75 T270,35"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Costs Line */}
                <path
                  d="M28,105 Q80,85 150,90 T270,65"
                  fill="none"
                  stroke="#F87171"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-7 right-0 flex justify-between text-[10px] text-gray-400">
                <span>Dec 1</span>
                <span>Dec 8</span>
                <span>Dec 15</span>
                <span>Dec 22</span>
                <span>Dec 29</span>
              </div>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Profit</h3>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-0.5 bg-green-500"></span>
              <span className="text-xs text-gray-600">Profit</span>
            </div>

            {/* Area Chart with gradient */}
            <div className="h-40 relative">
              <svg className="w-full h-full" viewBox="0 0 300 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="profitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Y-axis labels */}
                <text x="0" y="12" className="text-[8px] fill-gray-400">$80K</text>
                <text x="0" y="40" className="text-[8px] fill-gray-400">$60K</text>
                <text x="0" y="68" className="text-[8px] fill-gray-400">$40K</text>
                <text x="0" y="96" className="text-[8px] fill-gray-400">$20K</text>
                <text x="0" y="124" className="text-[8px] fill-gray-400">$0</text>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="28" y1={10 + i * 28} x2="295" y2={10 + i * 28} stroke="#E5E7EB" strokeWidth="0.5" />
                ))}

                {/* Profit Area */}
                <path
                  d="M28,100 Q80,70 150,50 T270,30 L270,122 L28,122 Z"
                  fill="url(#profitGradient)"
                />
                <path
                  d="M28,100 Q80,70 150,50 T270,30"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-7 right-0 flex justify-between text-[10px] text-gray-400">
                <span>Dec 1</span>
                <span>Dec 8</span>
                <span>Dec 15</span>
                <span>Dec 22</span>
                <span>Dec 29</span>
              </div>
            </div>
          </div>

          {/* Sale by Category */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Sale by Category</h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {CATEGORY_COLORS.map((cat, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.bg }}></span>
                  <span className="text-xs text-gray-500">{cat.label}</span>
                </div>
              ))}
            </div>

            {/* Semi-Donut Chart */}
            <div className="flex justify-center">
              <div className="relative w-52 h-28 overflow-hidden">
                <svg viewBox="0 0 200 100" className="w-full h-full">
                  {/* Semi-circles (donut arcs) */}
                  {(() => {
                    const data = categoryData.length > 0 ? categoryData.slice(0, 6) : [
                      { value: 25 }, { value: 15 }, { value: 15 }, { value: 20 }, { value: 12 }, { value: 13 }
                    ];
                    const total = data.reduce((sum, d) => sum + d.value, 0);
                    let cumulativeAngle = 180;

                    return data.map((item, index) => {
                      const angle = (item.value / total) * 180;
                      const startAngle = cumulativeAngle;
                      const endAngle = startAngle - angle;
                      cumulativeAngle = endAngle;

                      const radius = 80 - index * 12;
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;

                      const x1 = 100 + radius * Math.cos(startRad);
                      const y1 = 95 - radius * Math.sin(startRad);
                      const x2 = 100 + radius * Math.cos(endRad);
                      const y2 = 95 - radius * Math.sin(endRad);

                      const largeArc = angle > 180 ? 1 : 0;

                      return (
                        <path
                          key={index}
                          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`}
                          fill="none"
                          stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length].bg}
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Percentage labels */}
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <div className="grid grid-cols-6 gap-2 text-[10px] text-gray-600 font-medium">
                    {(categoryData.length > 0 ? categoryData.slice(0, 6) : [
                      { value: 25 }, { value: 15 }, { value: 15 }, { value: 20 }, { value: 12 }, { value: 13 }
                    ]).map((item, index) => {
                      const total = categoryData.length > 0 ? categoryData.reduce((s, d) => s + d.value, 0) : 100;
                      const percent = Math.round((item.value / total) * 100);
                      return <span key={index}>{percent}%</span>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Selling & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Best Selling Product Table */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Best selling product</h3>
              <button className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                Filter
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table - Scrollable on mobile */}
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100 min-w-[400px]">
                <div>Product</div>
                <div>Total Order</div>
                <div>Status</div>
                <div>Price</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-50">
                {(bestSellingProducts.length > 0 ? bestSellingProducts : products.slice(0, 4).map(p => ({ product: p, orders: Math.floor(Math.random() * 500) + 50, revenue: p.price || 0 }))).map((item, index) => (
                  <div key={item.product.id} className="grid grid-cols-4 gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 items-center hover:bg-gray-50 transition min-w-[400px]">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {item.product.image ? (
                          <img src={normalizeImageUrl(item.product.image)} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.product.name}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">{item.orders}</div>
                    <div>
                      <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm ${(item.product.stock || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${(item.product.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="hidden sm:inline">{(item.product.stock || 0) > 0 ? 'Stock' : 'Stock out'}</span>
                        <span className="sm:hidden">{(item.product.stock || 0) > 0 ? 'In' : 'Out'}</span>
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900">${(item.product.price || 999).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Button */}
            <div className="p-3 sm:p-4 flex justify-end border-t border-gray-100">
              <button className="px-4 sm:px-6 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg text-xs font-medium hover:bg-[#14B8A6] transition">
                Details
              </button>
            </div>
          </div>

          {/* Top Products Sidebar */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Top Products</h3>
              <button className="text-xs text-blue-500 hover:text-blue-600 font-medium">All product</button>
            </div>

            {/* Search */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Product List */}
            <div className="divide-y divide-gray-50 max-h-[280px] sm:max-h-[360px] overflow-y-auto">
              {topProducts.map((product, index) => (
                <div key={product.id} className="px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 hover:bg-gray-50 transition">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={normalizeImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Item: #FXZ-{4567 + index}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">${(product.price || 99).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No products yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
