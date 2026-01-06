import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  PauseCircle,
  XCircle,
  PackageCheck,
  ArchiveRestore,
  LayoutGrid,
  TrendingUp,
  CreditCard,
  Download,
  Plus,
  Search,
  ArrowUpRight,
  Wallet,
  BarChart3,
  Calendar,
  ChevronDown,
  DollarSign,
  Eye,
  Users,
  UserCheck,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Globe,
  Wifi
} from 'lucide-react';
// Chart default data types
type RevenueDataPoint = { name: string; value: number };
type CategoryDataPoint = { name: string; value: number };
const DEFAULT_REVENUE_DATA: RevenueDataPoint[] = [];
const DEFAULT_CATEGORY_DATA: CategoryDataPoint[] = [];
import { Order, Product } from '../types';
import { DashboardStatCard } from '@/components/AdminComponents';
import { useVisitorStats } from '../hooks/useVisitorStats';

// Modern Stat Card Component
interface ModernStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

const ModernStatCard: React.FC<ModernStatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeLabel = 'than last week',
  icon, 
  gradient,
  iconBg 
}) => {
  const isPositive = change && change >= 0;
  
  return (
    <div className={`relative p-3 sm:p-5 rounded-2xl ${gradient} overflow-hidden min-h-[100px] sm:min-h-[140px]`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${iconBg} flex items-center justify-center`}>
            <div className="text-white [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
              {icon}
            </div>
          </div>
          <button className="p-1 hover:bg-white/20 rounded-lg transition hidden sm:block">
            <MoreHorizontal className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        <div className="mt-2 sm:mt-4">
          <p className="text-white/80 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-white text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{value}</p>
        </div>
        
        {change !== undefined && (
          <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-3">
            <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
              isPositive ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            }`}>
              {isPositive ? <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              {Math.abs(change)}%
            </span>
            <span className="text-white/60 text-[10px] sm:text-xs hidden sm:inline">{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

type RevenueRange = 'Yearly' | 'Monthly' | 'Last Week';

const PIE_COLORS = [
  '#22d3ee', // cyan
  '#a3e635', // lime
  '#8b5cf6', // violet
  '#f97316', // orange
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
];

const COLORS = [
  'rgb(var(--color-primary-rgb))',
  'rgba(var(--color-secondary-rgb), 0.9)',
  'rgba(var(--color-primary-rgb), 0.75)',
  'rgba(var(--color-secondary-rgb), 0.6)'
];

const ALLOWED_REVENUE_STATUSES: Array<Order['status']> = ['Pending', 'Confirmed', 'On Hold', 'Processing', 'Shipped', 'Sent to Courier', 'Delivered'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0
  }).format(Math.round(value || 0));

const parseOrderDate = (dateString?: string) => {
  if (!dateString) return null;
  const direct = Date.parse(dateString);
  if (!Number.isNaN(direct)) return new Date(direct);
  const sanitized = Date.parse(dateString.replace(/,/g, ''));
  return Number.isNaN(sanitized) ? null : new Date(sanitized);
};

const buildWeeklyRevenueData = (orders: Order[], endDateOverride?: Date | null) => {
  const endDate = endDateOverride ? new Date(endDateOverride) : new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    return {
      key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`,
      name: current.toLocaleDateString('en-US', { weekday: 'short' }),
      value: 0
    };
  });

  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  orders.forEach((order) => {
    if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
    const orderDate = parseOrderDate(order.date);
    if (!orderDate || orderDate < startDate || orderDate > endDate) return;
    const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}`;
    const targetIndex = bucketIndex.get(key);
    if (targetIndex === undefined) return;
    buckets[targetIndex].value += order.amount;
  });

  return buckets.map(({ key, ...rest }) => rest);
};

const buildMonthlyRevenueData = (orders: Order[], endDateOverride?: Date | null) => {
  const endDate = endDateOverride ? new Date(endDateOverride) : new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 30 }, (_, index) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    return {
      key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`,
      name: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 0
    };
  });

  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  orders.forEach((order) => {
    if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
    const orderDate = parseOrderDate(order.date);
    if (!orderDate || orderDate < startDate || orderDate > endDate) return;
    const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}`;
    const targetIndex = bucketIndex.get(key);
    if (targetIndex === undefined) return;
    buckets[targetIndex].value += order.amount;
  });

  return buckets.map(({ key, ...rest }) => rest);
};

const buildYearlyRevenueData = (orders: Order[], endDateOverride?: Date | null) => {
  const endDate = endDateOverride ? new Date(endDateOverride) : new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setMonth(endDate.getMonth() - 11, 1);
  startDate.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 12 }, (_, index) => {
    const current = new Date(startDate);
    current.setMonth(startDate.getMonth() + index, 1);
    return {
      key: `${current.getFullYear()}-${current.getMonth()}`,
      name: current.toLocaleDateString('en-US', { month: 'short' }),
      value: 0
    };
  });

  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  orders.forEach((order) => {
    if (!ALLOWED_REVENUE_STATUSES.includes(order.status)) return;
    const orderDate = parseOrderDate(order.date);
    if (!orderDate || orderDate < startDate || orderDate > endDate) return;
    const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
    const targetIndex = bucketIndex.get(key);
    if (targetIndex === undefined) return;
    buckets[targetIndex].value += order.amount;
  });

  return buckets.map(({ key, ...rest }) => rest);
};

const buildCategoryBreakdown = (orders: Order[], products: Product[]) => {
  if (!orders.length) return DEFAULT_CATEGORY_DATA;

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
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return dataset.length ? dataset : DEFAULT_CATEGORY_DATA;
};

const buildAreaGeometry = (data: typeof DEFAULT_REVENUE_DATA, width = 720, height = 280) => {
  if (!data.length) {
    return {
      width,
      height,
      strokePath: '',
      fillPath: '',
      points: [] as Array<{ x: number; y: number; value: number; label: string }>
    };
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const paddingY = 24;

  const points = data.map((item, index) => {
    const normalizedY = height - paddingY - (item.value / maxValue) * (height - paddingY * 2);
    return {
      x: Math.round(index * stepX),
      y: Number.isFinite(normalizedY) ? normalizedY : height - paddingY,
      value: item.value,
      label: item.name
    };
  });

  const strokePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const fillPath = `${strokePath} L ${points[points.length - 1]?.x || width} ${height} L 0 ${height} Z`;

  return {
    width,
    height,
    strokePath,
    fillPath,
    points
  };
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
  onManageBalance?: () => void;
  onExportData?: (orders: Order[]) => void;
  onCreatePayment?: () => void;
  onSearch?: (query: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  tenantId,
  onManageBalance,
  onExportData,
  onCreatePayment,
  onSearch
}) => {
  const gradientId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Visitor stats
  const { stats: visitorStats, isLoading: visitorLoading } = useVisitorStats({ 
    tenantId, 
    period: '7d',
    refreshInterval: 30000 // refresh every 30 seconds
  });

  const [revenueRange, setRevenueRange] = useState<RevenueRange>('Last Week');

  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});
  const [dateDraft, setDateDraft] = useState<{ from: string; to: string }>(() => {
    const today = new Date();
    const yyyyMmDd = today.toISOString().split('T')[0];
    return { from: yyyyMmDd, to: yyyyMmDd };
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const headerControlsRef = useRef<HTMLDivElement | null>(null);

  const isDateFilterActive = Boolean(dateFilter.from && dateFilter.to);

  const effectiveEndDateForWeeklyChart = useMemo(() => {
    if (!dateFilter.to) return null;
    const parsed = Date.parse(dateFilter.to);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }, [dateFilter.to]);

  const dateFilteredOrders = useMemo(() => {
    if (!dateFilter.from && !dateFilter.to) return orders;

    const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
    const toDate = dateFilter.to ? new Date(dateFilter.to) : null;
    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    return orders.filter((order) => {
      const parsed = parseOrderDate(order.date);
      if (!parsed) return false;
      if (fromDate && parsed < fromDate) return false;
      if (toDate && parsed > toDate) return false;
      return true;
    });
  }, [orders, dateFilter.from, dateFilter.to]);

  const formatRangeLabel = useCallback((fromIso?: string, toIso?: string) => {
    if (!fromIso || !toIso) return '';
    const fromDate = new Date(fromIso);
    const toDate = new Date(toIso);
    const fromLabel = fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toLabel = toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fromLabel}-${toLabel}`;
  }, []);

  const applyDateDraft = useCallback(() => {
    const from = dateDraft.from;
    const to = dateDraft.to;
    if (!from || !to) return;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const normalizedFrom = fromDate <= toDate ? from : to;
    const normalizedTo = fromDate <= toDate ? to : from;
    setDateFilter({ from: normalizedFrom, to: normalizedTo });
    setIsDatePickerOpen(false);
    setIsQuickMenuOpen(false);
  }, [dateDraft.from, dateDraft.to]);

  const clearDateFilter = useCallback(() => {
    setDateFilter({});
    setIsDatePickerOpen(false);
    setIsQuickMenuOpen(false);
  }, []);

  const setTodayFilter = useCallback(() => {
    const today = new Date();
    const yyyyMmDd = today.toISOString().split('T')[0];
    setDateFilter({ from: yyyyMmDd, to: yyyyMmDd });
    setDateDraft({ from: yyyyMmDd, to: yyyyMmDd });
    setIsDatePickerOpen(false);
    setIsQuickMenuOpen(false);
  }, []);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const revenueData = useMemo(() => {
    if (revenueRange === 'Yearly') return buildYearlyRevenueData(dateFilteredOrders, effectiveEndDateForWeeklyChart);
    if (revenueRange === 'Monthly') return buildMonthlyRevenueData(dateFilteredOrders, effectiveEndDateForWeeklyChart);
    return buildWeeklyRevenueData(dateFilteredOrders, effectiveEndDateForWeeklyChart);
  }, [dateFilteredOrders, effectiveEndDateForWeeklyChart, revenueRange]);
  const revenueGeometry = useMemo(() => buildAreaGeometry(revenueData), [revenueData]);
  const categoryData = useMemo(() => buildCategoryBreakdown(dateFilteredOrders, products), [dateFilteredOrders, products]);

  const totalOrders = dateFilteredOrders.length;
  const today = new Date().toDateString();
  const todayOrders = useMemo(
    () =>
      dateFilteredOrders.filter((order) => {
        const parsed = parseOrderDate(order.date);
        return parsed && parsed.toDateString() === today;
      }).length,
    [dateFilteredOrders, today]
  );

  const courierOrders = useMemo(() => dateFilteredOrders.filter((order) => Boolean(order.courierProvider)).length, [dateFilteredOrders]);
  const confirmedOrders = useMemo(() => dateFilteredOrders.filter((order) => order.status === 'Confirmed').length, [dateFilteredOrders]);
  const pendingOrders = useMemo(() => dateFilteredOrders.filter((order) => order.status === 'Pending').length, [dateFilteredOrders]);
  const cancelledOrders = useMemo(() => dateFilteredOrders.filter((order) => order.status === 'Cancelled').length, [dateFilteredOrders]);
  const deliveredOrders = useMemo(() => dateFilteredOrders.filter((order) => order.status === 'Delivered').length, [dateFilteredOrders]);
  const shippedOrders = useMemo(() => dateFilteredOrders.filter((order) => order.status === 'Shipped').length, [dateFilteredOrders]);
  const returnsCount = Math.max(cancelledOrders, Math.round(totalOrders * 0.05));

  const totalRevenue = useMemo(() => dateFilteredOrders.reduce((sum, order) => sum + order.amount, 0), [dateFilteredOrders]);
  const deliveredRevenue = useMemo(
    () => dateFilteredOrders.filter((order) => order.status === 'Delivered').reduce((sum, order) => sum + order.amount, 0),
    [dateFilteredOrders]
  );
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const retentionRate = totalOrders ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const haystack = `${order.id} ${order.customer} ${order.status} ${order.location ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, searchQuery]);

  const filteredOrdersByDateAndSearch = useMemo(() => {
    if (!searchQuery.trim()) return dateFilteredOrders;
    const query = searchQuery.toLowerCase();
    return dateFilteredOrders.filter((order) => {
      const haystack = `${order.id} ${order.customer} ${order.status} ${order.location ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [dateFilteredOrders, searchQuery]);

  const visibleOrders = useMemo(() => filteredOrdersByDateAndSearch.slice(0, 8), [filteredOrdersByDateAndSearch]);

  const featuredProducts = useMemo(() => {
    if (!products.length) return [];
    return products.slice(0, 3);
  }, [products]);

  const pieGradient = useMemo(() => {
    const total = categoryData.reduce((sum, entry) => sum + entry.value, 0);
    if (!total) return 'rgba(255,255,255,0.08) 0% 100%';
    let cursor = 0;
    return categoryData
      .map((entry, index) => {
        const start = (cursor / total) * 100;
        cursor += entry.value;
        const end = (cursor / total) * 100;
        return `${COLORS[index % COLORS.length]} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
      })
      .join(', ');
  }, [categoryData]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setSearchQuery(nextValue);
      onSearch?.(nextValue);
    },
    [onSearch]
  );

  const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => event.preventDefault(), []);

  const handleManageBalance = useCallback(() => {
    if (onManageBalance) return onManageBalance();
    console.info('[AdminDashboard] Manage balance clicked');
  }, [onManageBalance]);

  const handleExport = useCallback(() => {
    if (onExportData) return onExportData(filteredOrders);
    exportOrdersToCsv(filteredOrders);
  }, [filteredOrders, onExportData]);

  const handleCreatePayment = useCallback(() => {
    if (onCreatePayment) return onCreatePayment();
    console.info('[AdminDashboard] New payment action triggered');
  }, [onCreatePayment]);

  // Product management handlers
  const handleUpdateProduct = useCallback((product: Product) => {
    console.info('[AdminDashboard] Update product:', product.id);
  }, []);

  const handleDeleteProduct = useCallback((productId: number) => {
    console.info('[AdminDashboard] Delete product:', productId);
  }, []);

  const handleBulkAction = useCallback((ids: number[], action: string) => {
    console.info(`[AdminDashboard] Bulk action "${action}" on products:`, ids);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (headerControlsRef.current && !headerControlsRef.current.contains(target)) {
        setIsDatePickerOpen(false);
        setIsQuickMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate additional metrics for the modern cards
  const weeklyChange = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const thisWeekOrders = orders.filter(o => {
      const d = parseOrderDate(o.date);
      return d && d >= weekAgo;
    }).length;
    
    const lastWeekOrders = orders.filter(o => {
      const d = parseOrderDate(o.date);
      return d && d >= twoWeeksAgo && d < weekAgo;
    }).length;
    
    if (lastWeekOrders === 0) return thisWeekOrders > 0 ? 100 : 0;
    return Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100);
  }, [orders]);

  // Device traffic data (simulated based on orders)
  const deviceTraffic = useMemo(() => {
    const total = dateFilteredOrders.length;
    if (total === 0) {
      // Show placeholder data when no orders
      return [
        { name: 'Desktop', value: 45, color: '#8b5cf6', percentage: 45 },
        { name: 'Mobile', value: 40, color: '#06b6d4', percentage: 40 },
        { name: 'Tablet', value: 15, color: '#f97316', percentage: 15 },
      ];
    }
    const desktop = Math.round(total * 0.45);
    const mobile = Math.round(total * 0.40);
    const tablet = Math.max(1, total - desktop - mobile);
    return [
      { name: 'Desktop', value: desktop, color: '#8b5cf6', percentage: Math.round((desktop / total) * 100) },
      { name: 'Mobile', value: mobile, color: '#06b6d4', percentage: Math.round((mobile / total) * 100) },
      { name: 'Tablet', value: tablet, color: '#f97316', percentage: Math.round((tablet / total) * 100) },
    ];
  }, [dateFilteredOrders]);

  // Location traffic data
  const locationTraffic = useMemo(() => {
    const locations: Record<string, number> = {};
    dateFilteredOrders.forEach(order => {
      const loc = order.location || 'Unknown';
      locations[loc] = (locations[loc] || 0) + 1;
    });
    return Object.entries(locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [dateFilteredOrders]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div ref={headerControlsRef} className="relative flex items-center gap-3">
          {isDateFilterActive ? (
            <>
              <button
                type="button"
                onClick={clearDateFilter}
                className="flex items-center gap-2 px-4 py-2.5 border border-red-200 rounded-xl text-sm font-medium text-red-500 bg-white hover:bg-red-50 transition shadow-sm"
              >
                <XCircle size={16} />
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateDraft({
                    from: dateFilter.from || dateDraft.from,
                    to: dateFilter.to || dateDraft.to,
                  });
                  setIsDatePickerOpen((prev) => !prev);
                  setIsQuickMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 border border-violet-200 rounded-xl text-sm font-medium text-violet-600 bg-white hover:bg-violet-50 transition shadow-sm"
              >
                <Calendar size={16} />
                {formatRangeLabel(dateFilter.from, dateFilter.to)}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDateDraft(() => {
                  const to = new Date();
                  const from = new Date();
                  from.setDate(from.getDate() - 6);
                  return {
                    from: from.toISOString().split('T')[0],
                    to: to.toISOString().split('T')[0],
                  };
                });
                setIsDatePickerOpen((prev) => !prev);
                setIsQuickMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm"
            >
              <Calendar size={16} />
              Filter by Date
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsQuickMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-sm font-medium text-white hover:from-violet-700 hover:to-purple-700 transition shadow-sm"
          >
            <ChevronDown size={16} />
            Quick Filter
          </button>

          {isQuickMenuOpen && (
            <div className="absolute right-0 top-14 z-20 w-48 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              <button
                type="button"
                onClick={setTodayFilter}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar size={14} className="text-gray-400" />
                Today
              </button>
              <button
                type="button"
                onClick={clearDateFilter}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
              >
                <XCircle size={14} />
                All Time
              </button>
            </div>
          )}

          {isDatePickerOpen && (
            <div className="absolute right-0 top-14 z-20 w-[340px] rounded-2xl border border-gray-200 bg-white shadow-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-gray-900">Select date range</div>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                  aria-label="Close"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">From</label>
                  <input
                    type="date"
                    value={dateDraft.from}
                    onChange={(e) => setDateDraft((prev) => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">To</label>
                  <input
                    type="date"
                    value={dateDraft.to}
                    onChange={(e) => setDateDraft((prev) => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyDateDraft}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transition"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Stats Cards - Row 1 (2x2 on mobile) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <ModernStatCard
          title="Total Orders"
          value={totalOrders.toLocaleString()}
          change={weeklyChange}
          icon={<ShoppingBag />}
          gradient="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"
          iconBg="bg-white/20"
        />
        <ModernStatCard
          title="Today Orders"
          value={todayOrders.toLocaleString()}
          change={todayOrders > 0 ? 12 : 0}
          icon={<Activity />}
          gradient="bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600"
          iconBg="bg-white/20"
        />
        <ModernStatCard
          title="Delivered"
          value={deliveredOrders.toLocaleString()}
          change={retentionRate}
          changeLabel="delivery rate"
          icon={<PackageCheck />}
          gradient="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
          iconBg="bg-white/20"
        />
        <ModernStatCard
          title="Total Revenue"
          value={`৳${totalRevenue.toLocaleString()}`}
          change={weeklyChange}
          icon={<Wallet />}
          gradient="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500"
          iconBg="bg-white/20"
        />
      </div>

      {/* Order Status Cards - Row 2 (Hidden on mobile, visible on tablet+) */}
      <div className="hidden sm:grid grid-cols-3 gap-4 lg:grid-cols-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Today</p>
              <p className="text-xl font-bold text-gray-900">{todayOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Courier</p>
              <p className="text-xl font-bold text-gray-900">{courierOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Confirmed</p>
              <p className="text-xl font-bold text-gray-900">{confirmedOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pendingOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Cancelled</p>
              <p className="text-xl font-bold text-gray-900">{cancelledOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <ArchiveRestore className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Returns</p>
              <p className="text-xl font-bold text-gray-900">{returnsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Revenue Overview Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">Track your revenue performance</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 text-xs sm:text-sm">
              {(['Last Week', 'Monthly', 'Yearly'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRevenueRange(tab)}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition ${
                    tab === revenueRange
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'Last Week' ? 'Week' : tab}
                </button>
              ))}
            </div>
          </div>
          
          {/* Area Chart */}
          <div className="h-48 sm:h-72 relative">
            <svg className="w-full h-full" viewBox="0 0 720 280" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`${gradientId}-area`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={56 * i + 24}
                  x2="720"
                  y2={56 * i + 24}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}
              {/* Area fill */}
              <path
                d={revenueGeometry.fillPath}
                fill={`url(#${gradientId}-area)`}
              />
              {/* Line */}
              <path
                d={revenueGeometry.strokePath}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points */}
              {revenueGeometry.points.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill="white"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    className="hover:r-8 transition-all cursor-pointer"
                  />
                </g>
              ))}
            </svg>
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 sm:px-2">
              {revenueData.map((item) => (
                <span key={item.name} className="text-[10px] sm:text-xs text-gray-400">{item.name}</span>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-violet-500"></div>
              <span className="text-xs sm:text-sm text-gray-600">Revenue</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900">৳{totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
              {/* <span className="text-xs sm:text-sm text-gray-600">Delivered</span> */}
              <span className="text-xs sm:text-sm font-semibold text-gray-900">৳{deliveredRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Device Traffic - Bar Chart Style for Mobile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Device Traffic</h3>
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Bar Chart Style */}
          <div className="flex items-end justify-center gap-4 sm:gap-8 h-36 sm:h-48 mb-6">
            {deviceTraffic.map((item) => {
              const maxVal = Math.max(...deviceTraffic.map(d => d.value), 1);
              const heightPercent = (item.value / maxVal) * 100;
              return (
                <div key={item.name} className="flex flex-col items-center gap-2">
                  <div className="h-28 sm:h-40 flex items-end">
                    <div 
                      className="w-10 sm:w-14 rounded-t-xl transition-all duration-500 shadow-sm"
                      style={{ 
                        height: `${Math.max(heightPercent, 15)}%`,
                        backgroundColor: item.color,
                        minHeight: '20px'
                      }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{item.name}</span>
                </div>
              );
            })}
          </div>
          
          {/* Center Total */}
          <div className="flex justify-center mb-4">
            <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{dateFilteredOrders.length}</span>
              <span className="text-xs text-gray-500 ml-1">Total</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="space-y-2 sm:space-y-3">
            {deviceTraffic.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {item.name === 'Desktop' && <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />}
                    {item.name === 'Mobile' && <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />}
                    {item.name === 'Tablet' && <Tablet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />}
                    <span className="text-xs sm:text-sm text-gray-600">{item.name}</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitor Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Total Visitors Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              {visitorLoading && (
                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              )}
            </div>
            <div className="mt-4">
              <p className="text-white/80 text-sm font-medium">Total Visitors</p>
              <p className="text-white text-3xl font-bold mt-1">
                {visitorStats?.totalVisitors?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-white/70 text-xs">
                {visitorStats?.totalPageViews?.toLocaleString() || '0'} page views
              </span>
            </div>
          </div>
        </div>

        {/* Today's Visitors Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-white/80 text-sm font-medium">Today's Visitors</p>
              <p className="text-white text-3xl font-bold mt-1">
                {visitorStats?.todayVisitors?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-white/70 text-xs">
                Last 7 days: {visitorStats?.periodVisitors?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Online Now Card */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-white text-xs font-medium">Live</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-white/80 text-sm font-medium">Online Now</p>
              <p className="text-white text-3xl font-bold mt-1">
                {visitorStats?.onlineNow?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-white/70 text-xs">
                Active visitors on site
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales by Category & Location Traffic */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Sales by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Sales by Category</h3>
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
          </div>
          
          {categoryData.length > 0 && categoryData[0].value > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Donut Chart */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = categoryData.reduce((sum, d) => sum + d.value, 0);
                    let cumulativePercent = 0;
                    return categoryData.slice(0, 5).map((item, index) => {
                      const percent = (item.value / total) * 100;
                      const dashArray = `${percent} ${100 - percent}`;
                      const dashOffset = -cumulativePercent;
                      cumulativePercent += percent;
                      return (
                        <circle
                          key={item.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={PIE_COLORS[index % PIE_COLORS.length]}
                          strokeWidth="16"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          pathLength="100"
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    ৳{categoryData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500">Total</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                {categoryData.slice(0, 5).map((item, index) => {
                  const total = categoryData.reduce((sum, d) => sum + d.value, 0);
                  const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{percent}%</span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          ৳{item.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-400">
              <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-50" />
              <span className="text-xs sm:text-sm">No category data yet</span>
            </div>
          )}
        </div>

        {/* Location Traffic */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Top Locations</h3>
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Location Bars */}
          <div className="space-y-3 sm:space-y-4">
            {locationTraffic.length > 0 ? locationTraffic.map((item, index) => {
              const maxValue = Math.max(...locationTraffic.map(d => d.value), 1);
              const percentage = (item.value / maxValue) * 100;
              const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">{item.name}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                  <div className="h-2 sm:h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: colors[index % colors.length]
                      }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-400">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-50" />
                <span className="text-xs sm:text-sm">No location data available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-5 flex items-center justify-between border-b border-gray-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Orders</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Latest {Math.min(visibleOrders.length, 5)} orders</p>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-violet-600 border border-violet-200 rounded-lg sm:rounded-xl hover:bg-violet-50 transition"
            >
              <Download size={12} className="sm:hidden" />
              <Download size={14} className="hidden sm:block" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {visibleOrders.slice(0, 5).map((order, index) => {
              const product = products.find(p => p.id === order.productId) || products[index % products.length];
              const statusColors: Record<string, string> = {
                'Pending': 'bg-amber-100 text-amber-700',
                'Confirmed': 'bg-blue-100 text-blue-700',
                'Delivered': 'bg-emerald-100 text-emerald-700',
                'Cancelled': 'bg-red-100 text-red-700',
                'Shipped': 'bg-violet-100 text-violet-700',
              };
              return (
                <div key={order.id} className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 hover:bg-gray-50/50 transition">
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {product?.image && (
                        <img src={normalizeImageUrl(product.image)} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">#{order.id}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{order.customer}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">৳{order.amount.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {!visibleOrders.length && (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-5 flex items-center justify-between border-b border-gray-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Top Products</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Best performing items</p>
            </div>
            <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-violet-600 border border-violet-200 rounded-lg sm:rounded-xl hover:bg-violet-50 transition">
              <BarChart3 size={12} className="sm:hidden" />
              <BarChart3 size={14} className="hidden sm:block" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {featuredProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 hover:bg-gray-50/50 transition">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 overflow-hidden">
                    <img src={normalizeImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-violet-600 to-purple-600 text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{product.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">৳{product.price?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg flex-shrink-0">
                  <span>{product.stock || 0}</span>
                  <span className="text-emerald-500 hidden sm:inline">in stock</span>
                </div>
              </div>
            ))}
            {!featuredProducts.length && (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <LayoutGrid className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm">No products yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;