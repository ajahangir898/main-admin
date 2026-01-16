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
  { bg: '#2196F3', label: 'ABC' },
  { bg: '#42A5F5', label: 'NBC' },
  { bg: '#64B5F6', label: 'CBS' },
  { bg: '#90CAF9', label: 'CNN' },
  { bg: '#BBDEFB', label: 'AOL' },
  { bg: '#E3F2FD', label: 'MSN' },
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

  // Best selling products
  const bestSellingProducts = useMemo(() => {
    const productSales: Record<string, { product: Product; orders: number; revenue: number }> = {};

    orders.forEach((order) => {
      if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;

      const matchedProduct = products.find(
        (p) =>
          (order.productId && p.id === order.productId) ||
          (order.productName && p.name.toLowerCase() === order.productName.toLowerCase())
      );

      if (matchedProduct) {
        if (!productSales[matchedProduct.id]) {
          productSales[matchedProduct.id] = {
            product: matchedProduct,
            orders: 0,
            revenue: 0,
          };
        }
        productSales[matchedProduct.id].orders += 1;
        productSales[matchedProduct.id].revenue += order.amount;
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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Order Analytics Section */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Order Analytics</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Products on Hands */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{products.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Products on Hands</p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3v18M3 12h18" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{totalOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Orders</p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12h6M9 16h6" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 sm:p-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Language</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage('Eng')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${language === 'Eng' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Eng
                </button>
                <button
                  onClick={() => setLanguage('বাংলা')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${language === 'বাংলা' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Date Display - Modern Calendar Card */}
            <div className="bg-[#f5f5f5] rounded-2xl overflow-hidden relative p-4 sm:p-5">
              {/* Date at top-left */}
              <p className="text-2xl sm:text-3xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>{currentDate}</p>
              {/* Blue curved wave with day */}
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute bottom-0 right-0 w-[70%] h-[55%]">
                <path 
                  d="M100,60 L100,20 Q70,0 40,25 Q10,50 0,35 L0,60 Z" 
                  fill="url(#blueGradient)"
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-3 right-4">
                <p className="text-white font-bold text-xl sm:text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{currentDay}</p>
              </div>
            </div>

            {/* Important Notification */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 sm:p-5 col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Important Notification</p>
              <div className="h-20 sm:h-24 bg-white rounded-xl border border-gray-100"></div>
              <div className="flex justify-center items-center gap-1.5 mt-4">
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-6 h-2 rounded-full bg-blue-500"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
            {/* Reserved Price */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Reserved Price</p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{lowStockProducts}</p>
                  <p className="text-xs text-gray-500 mt-1">Low Stock</p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* To be Reviewed */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{toBeReviewed}</p>
                  <p className="text-xs text-gray-500 mt-1">To be Reviewed</p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Visitor Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Online Now */}
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-blue-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Online Now</p>
                <p className="text-xs text-gray-500">Active visitors on site</p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg">
                <p className="text-lg sm:text-xl font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.onlineNow || 35}</p>
              </div>
            </div>
          </div>

          {/* Today Visitors */}
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-orange-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Today visitors</p>
                <p className="text-xs text-gray-500">Last 7 days: {visitorStats?.periodVisitors || 4}</p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg">
                <p className="text-lg sm:text-xl font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.todayVisitors || 35}</p>
              </div>
            </div>
          </div>

          {/* Total Visitors */}
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Total visitors</p>
                <p className="text-xs text-gray-500">{visitorStats?.totalPageViews || 15} page view</p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                <p className="text-lg sm:text-xl font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.totalVisitors || 35}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Row */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Order</h3>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 min-w-[500px] sm:min-w-0">
              {/* Today */}
              <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                </div>
                <span className="text-xs text-gray-500 flex-1">Today</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{todayOrders}</span>
              </div>

              {/* Courier */}
              <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <span className="text-xs text-gray-500 flex-1">Courier</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{courierOrders}</span>
              </div>

              {/* Confirmed */}
              <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <span className="text-xs text-gray-500 flex-1">Confirmed</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{confirmedOrders}</span>
              </div>

              {/* Pending */}
              <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                </div>
                <span className="text-xs text-gray-500 flex-1">Pending</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{pendingOrders}</span>
              </div>

              {/* Cancelled */}
              <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
                <span className="text-xs text-gray-500 flex-1">Cancelled</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{cancelledOrders}</span>
              </div>

              {/* Returns */}
              <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <ArchiveRestore className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <span className="text-xs text-gray-500 flex-1">Returns</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{returnsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue & Costs */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Revenue & Costs</h3>

            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-blue-500"></span>
                <span className="text-xs text-blue-500 font-medium">Net Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-red-400"></span>
                <span className="text-xs text-red-400 font-medium">Costs</span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-44 relative">
              <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Y-axis labels */}
                <text x="0" y="15" className="text-[9px] fill-gray-400">$80K</text>
                <text x="0" y="42" className="text-[9px] fill-gray-400">$60K</text>
                <text x="0" y="69" className="text-[9px] fill-gray-400">$40K</text>
                <text x="0" y="96" className="text-[9px] fill-gray-400">$20K</text>
                <text x="0" y="123" className="text-[9px] fill-gray-400">$0</text>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="28" y1={12 + i * 27} x2="295" y2={12 + i * 27} stroke="#E5E7EB" strokeWidth="0.5" />
                ))}

                {/* Sales Area */}
                <path
                  d="M28,95 Q80,55 150,75 T270,35 L270,120 L28,120 Z"
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
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Profit</h3>

            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-0.5 bg-blue-500"></span>
              <span className="text-xs text-blue-500 font-medium">Profit</span>
            </div>

            {/* Area Chart */}
            <div className="h-44 relative">
              <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="profitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Y-axis labels */}
                <text x="0" y="15" className="text-[9px] fill-gray-400">$80K</text>
                <text x="0" y="42" className="text-[9px] fill-gray-400">$60K</text>
                <text x="0" y="69" className="text-[9px] fill-gray-400">$40K</text>
                <text x="0" y="96" className="text-[9px] fill-gray-400">$20K</text>
                <text x="0" y="123" className="text-[9px] fill-gray-400">$0</text>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="28" y1={12 + i * 27} x2="295" y2={12 + i * 27} stroke="#E5E7EB" strokeWidth="0.5" />
                ))}

                {/* Profit Area */}
                <path
                  d="M28,100 Q80,70 150,50 T270,30 L270,120 L28,120 Z"
                  fill="url(#profitGradient)"
                />
                <path
                  d="M28,100 Q80,70 150,50 T270,30"
                  fill="none"
                  stroke="#3B82F6"
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
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Sale by Category</h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {CATEGORY_COLORS.map((cat, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.bg }}></span>
                  <span className="text-xs text-gray-500">{cat.label}</span>
                </div>
              ))}
            </div>

            {/* Semi-Donut Chart */}
            <div className="flex justify-center">
              <div className="relative w-72 h-40">
                <svg viewBox="0 0 400 220" className="w-full h-full">
                  <defs>
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  {(() => {
                    const data = [
                      { value: 15, label: 'ABC', color: '#2196F3' },
                      { value: 15, label: 'NBC', color: '#42A5F5' },
                      { value: 20, label: 'CBS', color: '#64B5F6' },
                      { value: 12, label: 'CNN', color: '#90CAF9' },
                      { value: 13, label: 'AOL', color: '#BBDEFB' },
                      { value: 25, label: 'MSN', color: '#E3F2FD' },
                    ];
                    const total = data.reduce((sum, d) => sum + d.value, 0);
                    const centerX = 200;
                    const centerY = 180;
                    const outerRadius = 160;
                    const innerRadius = 80;

                    let cumulativeAngle = 180;

                    return data.map((item, index) => {
                      const angle = (item.value / total) * 180;
                      const startAngle = cumulativeAngle;
                      const endAngle = startAngle - angle;
                      cumulativeAngle = endAngle;

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;

                      const x1 = centerX + outerRadius * Math.cos(startRad);
                      const y1 = centerY - outerRadius * Math.sin(startRad);
                      const x2 = centerX + outerRadius * Math.cos(endRad);
                      const y2 = centerY - outerRadius * Math.sin(endRad);

                      const x3 = centerX + innerRadius * Math.cos(endRad);
                      const y3 = centerY - innerRadius * Math.sin(endRad);
                      const x4 = centerX + innerRadius * Math.cos(startRad);
                      const y4 = centerY - innerRadius * Math.sin(startRad);

                      const largeArc = angle > 90 ? 1 : 0;

                      const midAngle = (startAngle + endAngle) / 2;
                      const midRad = (midAngle * Math.PI) / 180;
                      const labelRadius = (outerRadius + innerRadius) / 2;
                      const labelX = centerX + labelRadius * Math.cos(midRad);
                      const labelY = centerY - labelRadius * Math.sin(midRad);

                      return (
                        <g key={index}>
                          <path
                            d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`}
                            fill={item.color}
                            filter="url(#dropShadow)"
                            className="transition-all duration-300 hover:opacity-80"
                          />
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-sm font-medium fill-white"
                            style={{ fontSize: '14px' }}
                          >
                            {item.value}%
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Best Selling & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Best Selling Product Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Best selling product</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-white bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg text-xs font-medium hover:opacity-90 transition">
                Filter
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100 min-w-[400px]">
                <div>PRODUCT</div>
                <div>TOTAL ORDER</div>
                <div>STATUS</div>
                <div>PRICE</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-50">
                {(bestSellingProducts.length > 0 ? bestSellingProducts : products.slice(0, 4).map(p => ({ product: p, orders: Math.floor(Math.random() * 500) + 50, revenue: p.price || 0 }))).map((item, index) => (
                  <div key={item.product.id} className="grid grid-cols-4 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition min-w-[400px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
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
                    <div className="text-sm text-gray-600">{item.orders}</div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-sm ${(item.product.stock || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${(item.product.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {(item.product.stock || 0) > 0 ? 'Stock' : 'Stock out'}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">${(item.product.price || 999).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Button */}
            <div className="p-4 flex justify-end border-t border-gray-100">
              <button className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Details
              </button>
            </div>
          </div>

          {/* Top Products Sidebar */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Top Products</h3>
              <button className="text-xs text-blue-500 hover:text-blue-600 font-medium">All product</button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100">
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
            <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
              {topProducts.map((product, index) => (
                <div key={product.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
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
                    <p className="text-xs text-gray-400 mt-0.5">Item: #FXZ-{4567 + index}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${(product.price || 99).toFixed(2)}</p>
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
