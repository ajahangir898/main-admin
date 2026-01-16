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
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Dashboard Header - Mobile Responsive */}
        <div className="w-full bg-white rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Welcome Text */}
            <div className="flex-shrink-0">
              <div className="text-black text-base font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Welcome back, {user?.name || 'Admin'}</div>
              <div className="text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>Monitor your business analytics and statistics.</div>
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Website Button */}
              <a href={`/${tenantId || ''}`} target="_blank" rel="noopener noreferrer" className="h-8 px-3 bg-zinc-100 rounded-lg flex items-center cursor-pointer hover:bg-zinc-200 transition">
                <Globe className="w-4 h-4 text-black" />
                <span className="ml-2 text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>View Website</span>
              </a>
              
              {/* Tutorials Button */}
              <div className="h-8 px-3 bg-zinc-100 rounded-lg flex items-center cursor-pointer hover:bg-zinc-200 transition">
                <Play className="w-4 h-4 text-red-700" />
                <span className="ml-2 text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>Tutorials</span>
              </div>
              
              {/* Search Box */}
              <div className="w-full sm:w-48 md:w-64 h-8 bg-zinc-100 rounded-lg flex items-center px-2">
                <Search className="w-4 h-4 text-black flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                  className="flex-1 bg-transparent text-black text-xs font-normal outline-none ml-2"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>
            </div>
            
            {/* Right Side - Icons & Profile */}
            <div className="hidden lg:flex items-center gap-4">
              <Settings className="w-5 h-5 text-black cursor-pointer hover:opacity-70 transition" />
              <MessageCircle className="w-5 h-5 text-black cursor-pointer hover:opacity-70 transition" />
              <Bell className="w-5 h-5 text-black cursor-pointer hover:opacity-70 transition" />
              
              {/* Admin Profile */}
              <div className="flex items-center gap-2 ml-2">
                <div className="text-right">
                  <div className="text-black text-[9px] font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>Admin</div>
                  <div className="text-black text-sm font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>{user?.name || 'Admin'}</div>
                </div>
                {user?.avatar ? (
                  <img className="w-10 h-10 rounded-full object-cover" src={user.avatar} alt="Admin Avatar" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold">
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Analytics Section */}
        <div className="w-full bg-white rounded-lg p-6">
          <div className="text-black text-base font-semibold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Order Analytics</div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Products on Hands */}
            <div className="h-16 relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-4 bottom-2 text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Products on Hands</div>
              <div className="absolute left-4 top-2 text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{products.length}</div>
              <div className="w-11 h-11 absolute right-3 top-3 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/f6d089a7-832a-477b-8b1a-ecf65be958e3.webp" alt="Products" className="w-8 h-8 object-contain" />
              </div>
            </div>

            {/* Total Orders */}
            <div className="h-16 relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-4 bottom-2 text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Orders</div>
              <div className="absolute left-4 top-2 text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{totalOrders}</div>
              <div className="w-11 h-11 absolute right-3 top-3 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/bbc0c228-f29a-4500-ab70-dad18eacd48d.webp" alt="Total Orders" className="w-8 h-8 object-contain" />
              </div>
            </div>

            {/* Language */}
            <div className="h-16 relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-4 top-2 text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>Language</div>
              <div className="absolute left-4 top-8 w-24 h-6 rounded-3xl border border-white overflow-hidden flex items-center">
                <button
                  onClick={() => setLanguage('Eng')}
                  className={`h-4 px-2 mx-1 rounded-full text-xs transition ${language === 'Eng' ? 'bg-white text-black' : 'text-black'}`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >Eng</button>
                <button
                  onClick={() => setLanguage('বাংলা')}
                  className={`px-1 text-xs transition ${language === 'বাংলা' ? 'bg-white text-black rounded-full h-4' : 'text-black'}`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >বাংলা</button>
              </div>
            </div>

            {/* Date */}
            <div className="h-16 relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-0 bottom-100 w-80 h-80 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"></div>
              <div className="absolute left-3 top-2 text-black text-base font-medium z-10" style={{ fontFamily: 'Poppins, sans-serif' }}>{currentDate}</div>
              <div className="absolute right-4 bottom-2 text-white text-2xl font-medium z-10" style={{ fontFamily: 'Poppins, sans-serif' }}>{currentDay}</div>
            </div>

            {/* Important Notification - spans 2 rows */}
            <div className="h-16 md:row-span-2 md:h-auto relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-4 top-2 text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>Important Notification</div>
              <div className="hidden md:block absolute left-4 top-8 right-4 bottom-8 bg-white rounded-lg"></div>
              <div className="hidden md:flex absolute bottom-2 left-1/2 -translate-x-1/2 justify-center items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-4 h-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Reserved Price */}
            <div className="h-16 relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-4 bottom-2 text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Reserved Price</div>
              <div className="absolute left-4 top-2 text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{totalRevenue.toLocaleString()}</div>
              <div className="w-11 h-11 absolute right-3 top-3 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/653c0fcb-26a8-4941-b3a4-edd97eb7cac1.webp" alt="Reserved Price" className="w-8 h-8 object-contain" />
              </div>
            </div>

            {/* Low Stock */}
            <div className="h-16 relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-4 bottom-2 text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Low Stock</div>
              <div className="absolute left-4 top-2 text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{lowStockProducts}</div>
              <div className="w-11 h-11 absolute right-3 top-3 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/37d57dc7-b0ee-498f-9f0d-173fbab118fc.webp" alt="Low Stock" className="w-8 h-8 object-contain" />
              </div>
            </div>

            {/* To be Reviewed */}
            <div className="h-16 relative bg-zinc-100 rounded-lg overflow-hidden">
              <div className="absolute left-4 bottom-2 text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>To be Reviewed</div>
              <div className="absolute left-4 top-2 text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{toBeReviewed}</div>
              <div className="w-11 h-11 absolute right-3 top-3 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/5f8351b3-66f5-429f-81b0-6c2fe7dfe99e.webp" alt="To be Reviewed" className="w-8 h-8 object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Visitor Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Online Now */}
          <div className="h-16 relative bg-white/95 rounded-lg shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="w-48 h-48 left-[237px] top-[-83px] absolute bg-sky-500/20 rounded-full"></div>
            <div className="w-32 left-[70px] top-[14.5px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch text-sky-500 text-base font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Online Now</div>
              <div className="self-stretch text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>Active visitors on site</div>
            </div>
            <div className="w-9 h-9 left-[16px] top-[16px] absolute overflow-hidden flex items-center justify-center">
              <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/ef4c29da-1e5d-4201-8257-20c61ca4b02e.webp" alt="Online Now" className="w-8 h-8 object-contain" />
            </div>
            <div className="left-[310px] top-[17px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.onlineNow || 35}</div>
          </div>

          {/* Today Visitors */}
          <div className="h-16 relative bg-white/95 rounded-lg shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="w-48 h-48 left-[237px] top-[-83px] absolute bg-orange-500/25 rounded-full"></div>
            <div className="w-32 left-[70px] top-[14.5px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch text-orange-600 text-base font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Today visitors</div>
              <div className="self-stretch text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>Last 7 days: {visitorStats?.periodVisitors || 4}</div>
            </div>
            <div className="w-9 h-9 left-[16px] top-[16px] absolute overflow-hidden flex items-center justify-center">
              <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/418ad3f2-6edb-4352-8b4e-05f202ceeda1.webp" alt="Today Visitors" className="w-8 h-8 object-contain" />
            </div>
            <div className="left-[310px] top-[17px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.todayVisitors || 35}</div>
          </div>

          {/* Total Visitors */}
          <div className="h-16 relative bg-white/95 rounded-lg shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="w-48 h-48 left-[237px] top-[-83px] absolute bg-violet-700/20 rounded-full"></div>
            <div className="w-32 left-[70px] top-[14.5px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch text-violet-700 text-base font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Total visitors</div>
              <div className="self-stretch text-black text-xs font-normal" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.totalPageViews || 15} page view</div>
            </div>
            <div className="w-9 h-9 left-[16px] top-[16px] absolute overflow-hidden flex items-center justify-center">
              <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/2007a96f-3532-4f2b-ae57-80ac195233fa.webp" alt="Total Visitors" className="w-8 h-8 object-contain" />
            </div>
            <div className="left-[310px] top-[17px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{visitorStats?.totalVisitors || 35}</div>
          </div>
        </div>

        {/* Order Status Row */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Order</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Today */}
            <div className="h-12 relative bg-white rounded-lg shadow-[0px_2px_9.6px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-8 h-8 left-[8px] top-[8px] absolute bg-pink-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/1c12cf7d-7405-49a9-ae59-98c3f2a67b30.webp" alt="Today" className="w-6 h-6 object-contain" />
                </div>
              <div className="left-[46px] top-[15px] absolute text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Today</div>
              <div className="left-[140px] top-[6px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{todayOrders}</div>
              </div>

              {/* Courier */}
            <div className="h-12 relative bg-white rounded-lg shadow-[0px_2px_9.6px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-8 h-8 left-[8px] top-[8px] absolute bg-orange-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/598e5b78-d151-4943-a02b-9ffd96248d5f.webp" alt="Courier" className="w-6 h-6 object-contain" />
                </div>
              <div className="left-[46px] top-[15px] absolute text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Courier</div>
              <div className="left-[140px] top-[6px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{courierOrders}</div>
              </div>

              {/* Confirmed */}
            <div className="h-12 relative bg-white rounded-lg shadow-[0px_2px_9.6px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-8 h-8 left-[8px] top-[8px] absolute bg-green-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/15fc971c-c7b6-4eeb-9f7e-2b7d1e4f43d8.webp" alt="Confirmed" className="w-6 h-6 object-contain" />
                </div>
              <div className="left-[46px] top-[15px] absolute text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Confirmed</div>
              <div className="left-[140px] top-[6px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{confirmedOrders}</div>
              </div>

              {/* Pending */}
            <div className="h-12 relative bg-white rounded-lg shadow-[0px_2px_9.6px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-8 h-8 left-[8px] top-[8px] absolute bg-amber-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/311a5c20-581e-42d4-b3e8-4bafa23c3a4b.webp" alt="Pending" className="w-6 h-6 object-contain" />
                </div>
              <div className="left-[46px] top-[15px] absolute text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Pending</div>
              <div className="left-[140px] top-[6px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{pendingOrders}</div>
              </div>

              {/* Cancelled */}
            <div className="h-12 relative bg-white rounded-lg shadow-[0px_2px_9.6px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-8 h-8 left-[8px] top-[8px] absolute bg-red-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/cf924a55-6e93-4cf4-bc87-84be6e6d7d72.webp" alt="Cancelled" className="w-6 h-6 object-contain" />
                </div>
              <div className="left-[46px] top-[15px] absolute text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Canceled</div>
              <div className="left-[140px] top-[6px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{cancelledOrders}</div>
              </div>

              {/* Returns */}
            <div className="h-12 relative bg-white rounded-lg shadow-[0px_2px_9.6px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-8 h-8 left-[8px] top-[8px] absolute bg-blue-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/b2dc7881-ace0-44cc-ae4b-654e012ce4bc.webp" alt="Returns" className="w-6 h-6 object-contain" />
                </div>
              <div className="left-[46px] top-[15px] absolute text-black text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Returns</div>
              <div className="left-[140px] top-[6px] absolute text-black text-2xl font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{returnsCount}</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Best Selling Product Table - Figma Design */}
          <div className="lg:col-span-2 h-96 relative bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] overflow-hidden">
            {/* Header */}
            <div className="absolute left-5 top-5 right-5 inline-flex justify-between items-center">
              <div className="text-zinc-800 text-lg font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>Best selling product</div>
              <div className="px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex justify-center items-center gap-2 cursor-pointer hover:opacity-90 transition">
                <div className="text-white text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif' }}>Filter</div>
                <div className="w-5 h-5 relative">
                  <div className="w-4 h-[1.25px] left-[1.88px] top-[5.21px] absolute bg-white" />
                  <div className="w-3 h-[1.25px] left-[4.38px] top-[9.38px] absolute bg-white" />
                  <div className="w-1 h-[1.25px] left-[7.71px] top-[13.54px] absolute bg-white" />
                </div>
              </div>
            </div>

            {/* Details Button */}
            <div className="absolute right-5 bottom-2 h-8 px-3 py-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-sky-400 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-sky-50 transition">
              <div className="text-sky-400 text-base font-normal" style={{ fontFamily: 'Lato, sans-serif' }}>Details</div>
            </div>

            {/* Table Header */}
            <div className="absolute left-5 top-[72px] right-5 bg-blue-50 rounded-lg inline-flex justify-start items-center">
              <div className="w-60 self-stretch px-5 py-2 flex justify-start items-center gap-1">
                <div className="flex-1 text-neutral-500 text-xs font-medium uppercase" style={{ fontFamily: 'Public Sans, sans-serif' }}>Product</div>
              </div>
              <div className="flex-1 self-stretch pl-5 pr-2 py-2 flex justify-start items-center gap-1">
                <div className="flex-1 text-neutral-500 text-xs font-medium uppercase" style={{ fontFamily: 'Public Sans, sans-serif' }}>Total Order</div>
              </div>
              <div className="flex-1 self-stretch px-5 py-2 flex justify-start items-center gap-1">
                <div className="flex-1 text-neutral-500 text-xs font-medium uppercase" style={{ fontFamily: 'Public Sans, sans-serif' }}>Status</div>
              </div>
              <div className="flex-1 px-5 py-2 flex justify-start items-center gap-1">
                <div className="flex-1 text-neutral-500 text-xs font-medium uppercase" style={{ fontFamily: 'Public Sans, sans-serif' }}>Price</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="absolute left-5 top-[120px] right-5 bottom-14 overflow-y-auto">
              {(bestSellingProducts.length > 0 ? bestSellingProducts : products.slice(0, 4).map(p => ({ product: p, orders: Math.floor(Math.random() * 500) + 50, revenue: p.price || 0 }))).map((item, index) => (
                <div key={item.product.id} className="rounded-lg border-b inline-flex justify-start items-center w-full mb-2">
                  <div className="w-60 self-stretch pr-5 pb-2 flex justify-start items-center gap-2">
                    <div className="w-11 h-11 relative rounded-xl overflow-hidden">
                      {item.product.image ? (
                        <img className="w-11 h-11 object-cover" src={normalizeImageUrl(item.product.image)} alt={item.product.name} />
                      ) : (
                        <div className="w-11 h-11 bg-gray-200 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-teal-950 text-base font-bold truncate" style={{ fontFamily: 'Lato, sans-serif' }}>{item.product.name}</div>
                  </div>
                  <div className="flex-1 self-stretch pl-5 pr-2 pb-2 flex justify-start items-center gap-1">
                    <div className="flex-1 text-center text-zinc-800 text-base font-normal" style={{ fontFamily: 'Lato, sans-serif' }}>{item.orders}</div>
                  </div>
                  <div className="flex-1 self-stretch px-5 pb-2 flex justify-start items-center gap-1">
                    <div className="flex-1 flex justify-start items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${(item.product.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className={`flex-1 text-base font-normal ${(item.product.stock || 0) > 0 ? 'text-green-500' : 'text-red-500'}`} style={{ fontFamily: 'Public Sans, sans-serif' }}>
                        {(item.product.stock || 0) > 0 ? 'Stock' : 'Stock out'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 self-stretch px-5 pb-2 flex justify-start items-center gap-1">
                    <div className="text-right text-teal-950 text-base font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>${(item.product.price || 999).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products Sidebar - Figma Design */}
          <div className="h-96 pl-4 py-5 pr-2 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] inline-flex flex-col justify-start items-start gap-4 overflow-hidden">
            {/* Header & Search */}
            <div className="w-full pr-2 flex flex-col justify-start items-start gap-3">
              <div className="self-stretch inline-flex justify-start items-center gap-3">
                <div className="flex-1 text-zinc-800 text-lg font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>Top Products</div>
                <div className="text-sky-400 text-xs font-normal cursor-pointer hover:text-sky-500" style={{ fontFamily: 'Lato, sans-serif' }}>All product</div>
              </div>
              <div className="self-stretch p-2 bg-neutral-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 inline-flex justify-start items-center gap-1.5 overflow-hidden">
                <div className="flex justify-start items-center gap-2">
                  <Search className="w-5 h-5 text-neutral-500" />
                  <div className="text-neutral-500 text-sm font-normal" style={{ fontFamily: 'Lato, sans-serif' }}>Search</div>
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="w-full flex-1 flex flex-col justify-start items-start gap-4 overflow-y-auto pr-2">
              {topProducts.map((product, index) => (
                <div key={product.id} className="self-stretch pr-2 pb-2 border-b border-neutral-300 inline-flex justify-start items-center gap-4">
                  <div className="w-14 h-14 relative rounded-xl overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img className="w-14 h-14 object-cover" src={normalizeImageUrl(product.image)} alt={product.name} />
                    ) : (
                        <div className="w-14 h-14 bg-gray-200 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 inline-flex flex-col justify-center items-start gap-1 overflow-hidden">
                    <div className="self-stretch text-teal-950 text-base font-medium truncate" style={{ fontFamily: 'Lato, sans-serif' }}>{product.name}</div>
                    <div className="self-stretch h-6 relative">
                      <div className="text-neutral-400 text-xs font-normal" style={{ fontFamily: 'Lato, sans-serif' }}>Item: #FXZ-{4567 + index}</div>
                    </div>
                  </div>
                  <div className="text-right text-teal-950 text-base font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>${(product.price || 99).toFixed(2)}</div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="w-full py-8 text-center">
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
