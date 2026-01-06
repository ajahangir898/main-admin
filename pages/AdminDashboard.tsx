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
  Search,
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
  Moon,
  MessageCircle,
  Bell
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
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'Eng' | 'বাংলা'>('Eng');

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
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Welcome back, {user?.name || 'Admin'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monitor your business analytics and statistics.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Website Button */}
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition">
              <Globe className="w-4 h-4" />
              View Website
            </button>
            
            {/* Tutorials Button */}
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition">
              <Play className="w-4 h-4" />
              Tutorials
            </button>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-48 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            
            {/* Icons */}
            <button className="p-2 hover:bg-gray-50 rounded-lg transition">
              <Moon className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-50 rounded-lg transition">
              <MessageCircle className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-50 rounded-lg transition relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Avatar */}
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'A'
                )}
              </div>
              <div className="text-right hidden lg:block">
                <p className="text-xs text-gray-400">Admin</p>
                <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Order Analytics Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Analytics</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Products on Hands */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  <p className="text-sm text-gray-500 mt-1">Products on Hands</p>
                </div>
                <button className="p-1.5 hover:bg-gray-200 rounded-lg transition">
                  <Settings className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-[#F8FAFC] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Orders</p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Package className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-[#F8FAFC] rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">Language</p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setLanguage('Eng')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${language === 'Eng' ? 'bg-[#3B82F6] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                >
                  Eng
                </button>
                <button 
                  onClick={() => setLanguage('বাংলা')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${language === 'বাংলা' ? 'bg-[#3B82F6] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Date Display */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-500">{currentDate}</p>
                <div className="mt-1 px-4 py-1.5 bg-[#2DD4BF] rounded-lg">
                  <p className="text-white font-semibold">{currentDay}</p>
                </div>
              </div>
            </div>

            {/* Important Notification */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Important Notification</p>
                  <div className="flex gap-1 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {/* Reserved Price */}
            <div className="bg-[#F8FAFC] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Reserved Price</p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Wallet className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-[#F8FAFC] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{lowStockProducts}</p>
                  <p className="text-sm text-gray-500 mt-1">Low Stock</p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Package className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>

            {/* To be Reviewed */}
            <div className="bg-[#F8FAFC] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{toBeReviewed}</p>
                  <p className="text-sm text-gray-500 mt-1">To be Reviewed</p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Star className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visitor Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Online Now */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">Online Now</p>
                <p className="text-white/60 text-xs">Active visitors on site</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {visitorStats?.onlineNow || 0}
            </div>
          </div>

          {/* Today Visitors */}
          <div className="bg-gradient-to-r from-[#065F46] to-[#10B981] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">Today visitors</p>
                <p className="text-white/60 text-xs">Last 7 days: {visitorStats?.periodVisitors || 0}</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {visitorStats?.todayVisitors || 0}
            </div>
          </div>

          {/* Total Visitors */}
          <div className="bg-gradient-to-r from-[#0E7490] to-[#06B6D4] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">Total visitors</p>
                <p className="text-white/60 text-xs">{visitorStats?.totalPageViews || 0} page view</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {visitorStats?.totalVisitors || 0}
            </div>
          </div>
        </div>

        {/* Order Status Row */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Today */}
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-pink-100 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-xl font-bold text-gray-900">{todayOrders}</p>
              </div>
            </div>

            {/* Courier */}
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-orange-100 rounded-xl">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Courier</p>
                <p className="text-xl font-bold text-gray-900">{courierOrders}</p>
              </div>
            </div>

            {/* Confirmed */}
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-green-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Confirmed</p>
                <p className="text-xl font-bold text-gray-900">{confirmedOrders}</p>
              </div>
            </div>

            {/* Pending */}
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>

            {/* Cancelled */}
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="text-xl font-bold text-gray-900">{cancelledOrders}</p>
              </div>
            </div>

            {/* Returns */}
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <ArchiveRestore className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Returns</p>
                <p className="text-xl font-bold text-gray-900">{returnsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Costs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Costs</h3>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                <span className="text-sm text-gray-600">Net Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F87171]"></span>
                <span className="text-sm text-gray-600">Costs</span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-52 relative mt-4">
              <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Y-axis labels */}
                <text x="0" y="15" className="text-[8px] fill-gray-400">$80K</text>
                <text x="0" y="45" className="text-[8px] fill-gray-400">$60K</text>
                <text x="0" y="75" className="text-[8px] fill-gray-400">$40K</text>
                <text x="0" y="105" className="text-[8px] fill-gray-400">$20K</text>
                <text x="0" y="135" className="text-[8px] fill-gray-400">$0</text>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="28" y1={12 + i * 30} x2="295" y2={12 + i * 30} stroke="#E5E7EB" strokeWidth="0.5" />
                ))}

                {/* Sales Area */}
                <path
                  d="M28,105 Q80,65 150,85 T270,45 L270,132 L28,132 Z"
                  fill="url(#salesGradient)"
                />
                <path
                  d="M28,105 Q80,65 150,85 T270,45"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Costs Line */}
                <path
                  d="M28,115 Q80,95 150,100 T270,75"
                  fill="none"
                  stroke="#F87171"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-7 right-0 flex justify-between text-[10px] text-gray-400 pr-1">
                <span>Dec 1</span>
                <span>Dec 8</span>
                <span>Dec 15</span>
                <span>Dec 22</span>
                <span>Dec 29</span>
              </div>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Profit</h3>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-[#22C55E]"></span>
              <span className="text-sm text-gray-600">Profit</span>
            </div>

            {/* Bar Chart */}
            <div className="h-52 relative mt-4">
              <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                {/* Y-axis labels */}
                <text x="0" y="15" className="text-[8px] fill-gray-400">$80K</text>
                <text x="0" y="45" className="text-[8px] fill-gray-400">$60K</text>
                <text x="0" y="75" className="text-[8px] fill-gray-400">$40K</text>
                <text x="0" y="105" className="text-[8px] fill-gray-400">$20K</text>
                <text x="0" y="135" className="text-[8px] fill-gray-400">$0</text>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="28" y1={12 + i * 30} x2="295" y2={12 + i * 30} stroke="#E5E7EB" strokeWidth="0.5" />
                ))}

                {/* Bars */}
                {revenueData.map((item, index) => {
                  const maxValue = Math.max(...revenueData.map(d => d.sales - d.costs), 1) || 80000;
                  const profit = (item.sales - item.costs) || (Math.random() * 60000 + 20000);
                  const barHeight = Math.max((profit / maxValue) * 100, 15);
                  const x = 38 + index * 54;
                  return (
                    <rect
                      key={index}
                      x={x}
                      y={132 - barHeight}
                      width="32"
                      height={barHeight}
                      fill="#22C55E"
                      rx="4"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-7 right-0 flex justify-between text-[10px] text-gray-400 pr-1">
                <span>Dec 1</span>
                <span>Dec 8</span>
                <span>Dec 15</span>
                <span>Dec 22</span>
                <span>Dec 29</span>
              </div>
            </div>
          </div>

          {/* Sale by Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sale by Category</h3>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {CATEGORY_COLORS.map((cat, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.bg }}></span>
                  <span className="text-xs text-gray-500">{cat.label}</span>
                </div>
              ))}
            </div>

            {/* Donut Chart */}
            <div className="flex justify-center">
              <div className="relative w-44 h-44">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {categoryData.length > 0 ? (
                    (() => {
                      const total = categoryData.reduce((sum, d) => sum + d.value, 0);
                      let cumulativePercent = 0;
                      return categoryData.slice(0, 6).map((item, index) => {
                        const percent = (item.value / total) * 100;
                        const dashArray = `${percent} ${100 - percent}`;
                        const dashOffset = -cumulativePercent;
                        cumulativePercent += percent;
                        return (
                          <circle
                            key={item.name}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length].bg}
                            strokeWidth="14"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            pathLength="100"
                          />
                        );
                      });
                    })()
                  ) : (
                    // Default donut when no data
                    <>
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="14" strokeDasharray="27 73" strokeDashoffset="0" pathLength="100" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray="15 85" strokeDashoffset="-27" pathLength="100" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#F97316" strokeWidth="14" strokeDasharray="8 92" strokeDashoffset="-42" pathLength="100" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="14" strokeDasharray="25 75" strokeDashoffset="-50" pathLength="100" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="15 85" strokeDashoffset="-75" pathLength="100" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="14" strokeDasharray="10 90" strokeDashoffset="-90" pathLength="100" />
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* Percentage labels */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {(categoryData.length > 0 ? categoryData.slice(0, 6) : [
                { name: 'ABC', value: 27 },
                { name: 'NBC', value: 15 },
                { name: 'CBS', value: 8 },
                { name: 'CNN', value: 25 },
                { name: 'AOL', value: 15 },
                { name: 'MSN', value: 10 },
              ]).map((item, index) => {
                const total = categoryData.length > 0 ? categoryData.reduce((s, d) => s + d.value, 0) : 100;
                const percent = categoryData.length > 0 ? Math.round((item.value / total) * 100) : item.value;
                return (
                  <div key={index} className="text-xs text-gray-600 font-medium">
                    {percent}%
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Best Selling & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Best Selling Product Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Best selling product</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#2DD4BF] text-white rounded-lg text-sm font-medium hover:bg-[#14B8A6] transition">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-[#F8FAFC] text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <div>PRODUCT</div>
              <div className="text-center">TOTAL ORDER</div>
              <div className="text-center">STATUS</div>
              <div className="text-right">PRICE</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-50">
              {(bestSellingProducts.length > 0 ? bestSellingProducts : products.slice(0, 4).map(p => ({ product: p, orders: Math.floor(Math.random() * 500) + 50, revenue: p.price || 0 }))).map((item, index) => (
                <div key={item.product.id} className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.product.image ? (
                        <img src={normalizeImageUrl(item.product.image)} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{item.product.name}</span>
                  </div>
                  <div className="text-center text-sm text-gray-600">{item.orders}</div>
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1.5 text-sm ${(item.product.stock || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${(item.product.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {(item.product.stock || 0) > 0 ? 'Stock' : 'Stock out'}
                    </span>
                  </div>
                  <div className="text-right text-sm font-semibold text-gray-900">${(item.product.price || 999).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Details Button */}
            <div className="p-4 flex justify-center border-t border-gray-100">
              <button className="px-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Details
              </button>
            </div>
          </div>

          {/* Top Products Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">All product</button>
            </div>

            {/* Search */}
            <div className="px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Product List */}
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {topProducts.map((product, index) => (
                <div key={product.id} className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 transition">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={normalizeImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">Item: #FXZ-{4567 + index}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(product.price || 99).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
