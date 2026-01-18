import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Filter, Edit3, Printer, ShieldAlert, ShieldCheck, X, Package2, MapPin, Mail, Truck, AlertTriangle, CheckCircle2, Send, Loader2, MoreVertical, Download, Trash2, Phone, MessageCircle, ExternalLink, FileText, Plus, TrendingUp, Eye, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Order, CourierConfig } from '../types';
import { CourierService, FraudCheckResult } from '../services/CourierService';
import { MetricsSkeleton, TableSkeleton } from '../components/SkeletonLoaders';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface AdminOrdersProps {
  orders: Order[];
  courierConfig: CourierConfig;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
}

type StatusFilter = 'all' | Order['status'];

// New clean status colors for the redesigned UI
const STATUS_COLORS: Record<Order['status'], string> = {
  Pending: 'text-orange-600 bg-orange-50 border border-orange-200',
  Confirmed: 'text-blue-600 bg-blue-50 border border-blue-200',
  'On Hold': 'text-amber-600 bg-amber-50 border border-amber-200',
  Processing: 'text-cyan-600 bg-cyan-50 border border-cyan-200',
  Shipped: 'text-indigo-600 bg-indigo-50 border border-indigo-200',
  'Sent to Courier': 'text-purple-600 bg-purple-50 border border-purple-200',
  Delivered: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
  Cancelled: 'text-red-600 bg-red-50 border border-red-200',
  Return: 'text-yellow-600 bg-yellow-50 border border-yellow-200',
  Refund: 'text-pink-600 bg-pink-50 border border-pink-200',
  'Returned Receive': 'text-slate-600 bg-slate-50 border border-slate-200'
};

const STATUSES: Order['status'][] = ['Pending', 'Confirmed', 'On Hold', 'Processing', 'Shipped', 'Sent to Courier', 'Delivered', 'Cancelled', 'Return', 'Refund', 'Returned Receive'];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(value);

const getCourierId = (order: Order) => {
  if (order.trackingId) return order.trackingId;
  if (order.courierMeta) {
    return (
      (order.courierMeta.tracking_id as string) ||
      (order.courierMeta.trackingCode as string) ||
      (order.courierMeta.consignment_id as string) ||
      (order.courierMeta.invoice as string)
    );
  }
  return undefined;
};

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, courierConfig, onUpdateOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFraudChecking, setIsFraudChecking] = useState(false);
  const [isSendingToSteadfast, setIsSendingToSteadfast] = useState(false);
  const [fraudResult, setFraudResult] = useState<FraudCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const orderRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Multi-select state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [courierModalOrderId, setCourierModalOrderId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Available couriers
  const COURIERS = [
    { id: 'pathao', name: 'Pathao Courier', logo: '/icons/pathao.png' },
    { id: 'steadfast', name: 'Steadfast Courier', logo: '/icons/steadfast.png' },
    { id: 'redx', name: 'RedX Courier', logo: '/icons/redx.png' },
  ];

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionDropdown !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-action-dropdown]')) {
          setOpenActionDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionDropdown]);

  // Check for highlighted order from notification click
  useEffect(() => {
    const storedOrderId = window.sessionStorage.getItem('highlightOrderId');
    if (storedOrderId) {
      setHighlightedOrderId(storedOrderId);
      window.sessionStorage.removeItem('highlightOrderId');

      // Scroll to the order after a short delay
      setTimeout(() => {
        const orderRow = orderRowRefs.current.get(storedOrderId);
        if (orderRow) {
          orderRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedOrderId(null);
        }, 3000);
      }, 500);
    }
  }, [orders]);

  const metrics = useMemo(() => {
    const total = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const pending = orders.filter((order) => order.status === 'Pending').length;
    const fulfilled = orders.filter((order) => order.status === 'Delivered').length;
    const average = total ? revenue / total : 0;
    return { total, revenue, pending, fulfilled, average };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      if (!query) return matchesStatus;
      const haystack = `${order.id} ${order.customer} ${order.location} ${order.phone || ''}`.toLowerCase();
      return matchesStatus && haystack.includes(query);
    });
  }, [orders, searchTerm, statusFilter]);

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setDraftOrder({ ...order });
    setFraudResult(null);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setDraftOrder(null);
    setIsSaving(false);
    setIsFraudChecking(false);
    setFraudResult(null);
  };

  const handleDraftChange = <K extends keyof Order>(field: K, value: Order[K]) => {
    setDraftOrder((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder || !draftOrder) return;
    setIsSaving(true);
    try {
      const { id, ...updates } = draftOrder;
      onUpdateOrder(selectedOrder.id, updates);
      toast.success('Order updated');
      closeOrderModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update order';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Selection handlers
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const clearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedOrderIds.length} order(s)?`)) {
      // Implementation would call backend
      toast.success(`${selectedOrderIds.length} order(s) deleted`);
      setSelectedOrderIds([]);
    }
  };

  const handleBulkStatusChange = (newStatus: Order['status']) => {
    selectedOrderIds.forEach(orderId => {
      onUpdateOrder(orderId, { status: newStatus });
    });
    toast.success(`Updated ${selectedOrderIds.length} order(s) to ${newStatus}`);
    setSelectedOrderIds([]);
    setShowStatusModal(false);
  };

  const handleDownloadExcel = () => {
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    // Create CSV content
    const headers = ['Order ID', 'Customer', 'Phone', 'Location', 'Amount', 'Status', 'Date'];
    const rows = selectedOrders.map(o => [
      o.id, o.customer, o.phone || '', o.location, o.amount, o.status, o.date
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel file downloaded');
  };

  const handleMultiplePrint = () => {
    selectedOrderIds.forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (order) handlePrintInvoice(order);
    });
  };

  const handleAssignCourier = (courierId: string, courierName: string) => {
    if (courierModalOrderId) {
      // Single order assignment
      onUpdateOrder(courierModalOrderId, {
        courierProvider: courierName as Order['courierProvider'],
        status: 'Sent to Courier'
      });
      toast.success(`Courier assigned: ${courierName}`);
    } else {
      // Bulk assignment
      selectedOrderIds.forEach(orderId => {
        onUpdateOrder(orderId, {
          courierProvider: courierName as Order['courierProvider'],
          status: 'Sent to Courier'
        });
      });
      toast.success(`Courier assigned to ${selectedOrderIds.length} order(s)`);
      setSelectedOrderIds([]);
    }
    setShowCourierModal(false);
    setCourierModalOrderId(null);
  };

  const handleFraudCheck = async (order: Order) => {
    if (!courierConfig.apiKey || !courierConfig.secretKey) {
      toast.error('Please configure Steadfast API credentials in Courier Settings first.');
      return;
    }
    setIsFraudChecking(true);
    try {
      const result = await CourierService.checkFraudRisk(order, courierConfig);
      setFraudResult(result);
      toast.success('Fraud check completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fraud check failed';
      toast.error(message);
    } finally {
      setIsFraudChecking(false);
    }
  };

  const handleSendToSteadfast = async (order: Order) => {
    if (!courierConfig.apiKey || !courierConfig.secretKey) {
      toast.error('Please configure Steadfast API credentials in Courier Settings first.');
      return;
    }
    if (!order.phone) {
      toast.error('Customer phone number is required to send to Steadfast.');
      return;
    }
    if (order.courierProvider === 'Steadfast' && order.trackingId) {
      toast.error('This order has already been sent to Steadfast.');
      return;
    }

    setIsSendingToSteadfast(true);
    try {
      const result = await CourierService.sendToSteadfast(order, courierConfig);

      // Update the order with tracking info
      const updates: Partial<Order> = {
        trackingId: result.trackingId,
        courierProvider: 'Steadfast',
        courierMeta: result.response,
        status: 'Sent to Courier'
      };

      onUpdateOrder(order.id, updates);

      // Update draft order to reflect changes
      setDraftOrder(prev => prev ? { ...prev, ...updates } : prev);

      toast.success(`Order sent to Steadfast! Tracking ID: ${result.trackingId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send order to Steadfast';
      toast.error(message);
    } finally {
      setIsSendingToSteadfast(false);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    try {
      const courierId = getCourierId(order) || 'Pending assignment';
      const popup = window.open('', 'PRINT', 'width=900,height=700');
      if (!popup) {
        toast.error('Please allow popups to print the invoice.');
        return;
      }
      const itemLabel = order.productName ? `${order.productName}${order.variant ? ` (${order.variant.color} / ${order.variant.size})` : ''}` : 'Custom Order';
      const now = new Date().toLocaleString();
      popup.document.write(`<!doctype html>
<html>
<head>
<meta charSet="utf-8" />
<title>Invoice ${order.id}</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #0f172a; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { font-size: 24px; margin: 0; }
.section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
.section h2 { margin: 0 0 12px; font-size: 16px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.label { font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; letter-spacing: 0.05em; }
.value { font-size: 15px; font-weight: 600; color: #0f172a; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
th { text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; color: #64748b; }
footer { text-align: center; margin-top: 32px; font-size: 12px; color: #475569; }
</style>
</head>
<body>
<header>
  <div>
    <p style="text-transform: uppercase; letter-spacing: 0.2em; color: #ef4444; margin: 0;">Admin Console</p>
    <h1>Invoice ${order.id}</h1>
  </div>
  <div style="text-align: right;">
    <p class="label" style="margin:0;">Printed</p>
    <p class="value" style="margin:0;">${now}</p>
  </div>
</header>
<section class="section">
  <h2>Customer</h2>
  <div class="grid">
    <div><p class="label">Name</p><p class="value">${order.customer}</p></div>
    <div><p class="label">Phone</p><p class="value">${order.phone || 'Not Provided'}</p></div>
    <div><p class="label">Email</p><p class="value">${order.email || 'Not Provided'}</p></div>
    <div><p class="label">Division</p><p class="value">${order.division || 'N/A'}</p></div>
  </div>
  <div style="margin-top:12px;">
    <p class="label">Delivery Address</p>
    <p class="value">${order.location}</p>
  </div>
</section>
<section class="section">
  <h2>Courier</h2>
  <div class="grid">
    <div><p class="label">Provider</p><p class="value">${order.courierProvider || 'Not Assigned'}</p></div>
    <div><p class="label">Courier ID</p><p class="value">${courierId}</p></div>
    <div><p class="label">Delivery Type</p><p class="value">${order.deliveryType || 'Regular'}</p></div>
  </div>
</section>
<section class="section">
  <h2>Items</h2>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Charge</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${itemLabel}</td>
        <td>${order.quantity || 1}</td>
        <td>${order.deliveryCharge ? formatCurrency(order.deliveryCharge) : '-'}</td>
        <td>${formatCurrency(order.amount)}</td>
      </tr>
    </tbody>
  </table>
</section>
<section class="section" style="display:flex; justify-content:flex-end;">
  <div style="width: 260px;">
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span class="label">Subtotal</span>
      <span class="value">${formatCurrency(order.amount - (order.deliveryCharge || 0))}</span>
    </div>
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span class="label">Delivery</span>
      <span class="value">${order.deliveryCharge ? formatCurrency(order.deliveryCharge) : 'Included'}</span>
    </div>
    <div style="border-top:1px solid #e2e8f0; margin-top:12px; padding-top:8px; display:flex; justify-content:space-between;">
      <span class="label" style="letter-spacing:0.1em;">Total Due</span>
      <span class="value" style="font-size:18px;">${formatCurrency(order.amount)}</span>
    </div>
  </div>
</section>
<footer>Courier ID must be shared with the customer. Thank you for using the premium admin console.</footer>
</body>
</html>`);
      popup.document.close();
      popup.focus();
      popup.print();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to print invoice';
      toast.error(message);
    }
  };

  const fraudBadge = fraudResult ? (() => {
    const status = (fraudResult.status || '').toLowerCase();
    if (['pass', 'safe', 'low'].some((cue) => status.includes(cue))) {
      return { label: fraudResult.status, color: 'text-emerald-300', icon: <ShieldCheck size={18} /> };
    }
    if (['review', 'medium', 'warn'].some((cue) => status.includes(cue))) {
      return { label: fraudResult.status, color: 'text-amber-300', icon: <AlertTriangle size={18} /> };
    }
    return { label: fraudResult.status, color: 'text-rose-300', icon: <ShieldAlert size={18} /> };
  })() : null;

  const isSteadfastConfigured = !!(courierConfig.apiKey && courierConfig.secretKey);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: orders.length,
    completed: orders.filter(o => o.status === 'Delivered').length,
    pending: orders.filter(o => o.status === 'Pending').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
    returned: orders.filter(o => o.status === 'Return' || o.status === 'Returned Receive').length,
  }), [orders]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Order List</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">


          <button className="flex px-3 sm:px-4 py-1.5 sm:py-2 justify-center items-center gap-1 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white font-medium text-xs sm:text-sm transition-all hover:opacity-90 active:scale-95 shadow-md">
            {/* "rounded-[18px] bg-gradient-to-r from-[#38BDF8] to-[#1E90FF]" */}
            <Plus size={18} />

            <span> Add Order </span>
          </button>


          <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-xs sm:text-sm">
            <MoreHorizontal size={18} />
            More Action
          </button>
        </div>
      </div>

      {/* Steadfast Configuration Warning */}
      {!isSteadfastConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">Steadfast API Not Configured</p>
            <p className="text-xs text-amber-600">Go to Courier Settings to add your API Key and Secret Key to enable order sending and fraud checks.</p>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive Design */}
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Orders */}
          <div className="w-full p-3 sm:p-4 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] overflow-hidden">
            <div className="text-zinc-800 text-sm sm:text-lg font-bold mb-2 sm:mb-3" style={{ fontFamily: 'Lato, sans-serif' }}>Total Orders</div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2">
              <div className="text-teal-950 text-xl sm:text-3xl font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>{metrics.total.toLocaleString()}</div>
              <div className="flex items-center">
                <TrendingUp size={14} className="text-green-500 sm:w-4 sm:h-4" />
                <span className="text-green-500 text-xs sm:text-sm font-medium" style={{ fontFamily: 'Lato, sans-serif' }}> 14.4%</span>
              </div>
            </div>
            <div className="text-neutral-500 text-xs sm:text-sm font-normal mt-2" style={{ fontFamily: 'Lato, sans-serif' }}>Since last month</div>
          </div>

          {/* GMV */}
          <div className="w-full p-3 sm:p-4 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-zinc-800 text-sm sm:text-lg font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>GMV</div>
              <ChevronDown size={14} className="text-zinc-800 sm:w-4 sm:h-4" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2">
              <div className="text-teal-950 text-lg sm:text-3xl font-bold truncate" style={{ fontFamily: 'Lato, sans-serif' }}>{formatCurrency(metrics.revenue)}</div>
              <div className="flex items-center flex-shrink-0">
                <TrendingUp size={14} className="text-green-500 sm:w-4 sm:h-4" />
                <span className="text-green-500 text-xs sm:text-sm font-medium" style={{ fontFamily: 'Lato, sans-serif' }}> 8.2%</span>
              </div>
            </div>
            <div className="text-neutral-500 text-xs sm:text-sm font-normal mt-2" style={{ fontFamily: 'Lato, sans-serif' }}>Since last month</div>
          </div>

          {/* Pending */}
          <div className="w-full p-3 sm:p-4 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] overflow-hidden relative">
            <div className="text-zinc-800 text-sm sm:text-lg font-bold mb-2 sm:mb-3" style={{ fontFamily: 'Lato, sans-serif' }}>Pending</div>
            <div className="text-amber-600 text-xl sm:text-3xl font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>{metrics.pending.toLocaleString()}</div>
            <div className="text-neutral-500 text-xs sm:text-sm font-normal mt-2 pr-10 sm:pr-12" style={{ fontFamily: 'Lato, sans-serif' }}>Need confirmation</div>
            <button className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded text-white text-[10px] sm:text-xs font-semibold" style={{ fontFamily: 'Lato, sans-serif', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>View</button>
          </div>

          {/* AVG Order */}
          <div className="w-full p-3 sm:p-4 bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] overflow-hidden">
            <div className="text-zinc-800 text-sm sm:text-lg font-bold mb-2 sm:mb-3" style={{ fontFamily: 'Lato, sans-serif' }}>AVG Order</div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2">
              <div className="text-teal-950 text-lg sm:text-3xl font-bold truncate" style={{ fontFamily: 'Lato, sans-serif' }}>{formatCurrency(metrics.average)}</div>
              <div className="flex items-center flex-shrink-0">
                <TrendingUp size={14} className="text-red-500 rotate-180 sm:w-4 sm:h-4" />
                <span className="text-red-500 text-xs sm:text-sm font-medium" style={{ fontFamily: 'Lato, sans-serif' }}> 5%</span>
              </div>
            </div>
            <div className="text-neutral-500 text-xs sm:text-sm font-normal mt-2" style={{ fontFamily: 'Lato, sans-serif' }}>Per customer spend</div>
          </div>
        </div>
      )}


      {/* Filter Tabs & Table Container - Figma Design */}
      <div className="w-full bg-white rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] overflow-hidden p-3 sm:p-4 md:p-6">
        {/* Filter Tabs Row */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Tab Buttons - Horizontally Scrollable on Mobile */}
          <div className="overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            <div className="p-1 bg-gradient-to-r from-sky-400/10 to-blue-500/10 rounded-lg inline-flex sm:flex justify-start items-center gap-1 min-w-max sm:min-w-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 sm:px-3 py-1.5 rounded-md flex justify-center items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${statusFilter === 'all' ? 'bg-white shadow-sm' : ''}`}
              >
                <span className={`text-xs sm:text-sm md:text-base font-medium ${statusFilter === 'all' ? 'text-black' : 'text-neutral-600'}`} style={{ fontFamily: 'Lato, sans-serif' }}>All order</span>
                <span className="text-sky-400 text-xs sm:text-sm font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>({tabCounts.all})</span>
              </button>
              <button
                onClick={() => setStatusFilter('Delivered')}
                className={`px-2 sm:px-3 py-1.5 rounded-md flex justify-center items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${statusFilter === 'Delivered' ? 'bg-white shadow-sm' : ''}`}
              >
                <span className={`text-xs sm:text-sm md:text-base font-medium ${statusFilter === 'Delivered' ? 'text-black' : 'text-neutral-600'}`} style={{ fontFamily: 'Lato, sans-serif' }}>Completed</span>
                <span className="text-sky-400 text-xs sm:text-sm font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>({tabCounts.completed})</span>
              </button>
              <button
                onClick={() => setStatusFilter('Pending')}
                className={`px-2 sm:px-3 py-1.5 rounded-md flex justify-center items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${statusFilter === 'Pending' ? 'bg-white shadow-sm' : ''}`}
              >
                <span className={`text-xs sm:text-sm md:text-base font-medium ${statusFilter === 'Pending' ? 'text-black' : 'text-neutral-600'}`} style={{ fontFamily: 'Lato, sans-serif' }}>Pending</span>
                <span className="text-sky-400 text-xs sm:text-sm font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>({tabCounts.pending})</span>
              </button>
              <button
                onClick={() => setStatusFilter('Cancelled')}
                className={`px-2 sm:px-3 py-1.5 rounded-md flex justify-center items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${statusFilter === 'Cancelled' ? 'bg-white shadow-sm' : ''}`}
              >
                <span className={`text-xs sm:text-sm md:text-base font-medium ${statusFilter === 'Cancelled' ? 'text-black' : 'text-neutral-600'}`} style={{ fontFamily: 'Lato, sans-serif' }}>Canceled</span>
                <span className="text-sky-400 text-xs sm:text-sm font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>({tabCounts.cancelled})</span>
              </button>
              <button
                onClick={() => setStatusFilter('Return')}
                className={`px-2 sm:px-3 py-1.5 rounded-md flex justify-center items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${statusFilter === 'Return' ? 'bg-white shadow-sm' : ''}`}
              >
                <span className={`text-xs sm:text-sm md:text-base font-medium ${statusFilter === 'Return' ? 'text-black' : 'text-neutral-600'}`} style={{ fontFamily: 'Lato, sans-serif' }}>Returned</span>
                <span className="text-sky-400 text-xs sm:text-sm font-bold" style={{ fontFamily: 'Lato, sans-serif' }}>({tabCounts.returned})</span>
              </button>
            </div>
          </div>
          
          {/* Search & Actions */}
          <div className="flex flex-wrap justify-start items-center gap-2 sm:gap-3">
            <div className="w-full sm:w-64 h-9 sm:h-10 pl-3 pr-2 py-1.5 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-start items-center gap-1.5">
              <input
                type="text"
                placeholder="Search order report"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-neutral-500 text-xs sm:text-sm font-normal outline-none"
                style={{ fontFamily: 'Lato, sans-serif' }}
              />
              <Search size={18} className="text-neutral-600 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 sm:p-2.5 bg-white rounded border border-neutral-300 flex justify-center items-center hover:bg-gray-50 transition">
                <Filter size={18} className="text-neutral-600 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={() => handleDownloadExcel()}
                disabled={selectedOrderIds.length === 0}
                className="p-2 sm:p-2.5 bg-white rounded border border-neutral-300 flex justify-center items-center hover:bg-gray-50 transition disabled:opacity-50"
              >
                <Download size={18} className="text-neutral-600 sm:w-5 sm:h-5" />
              </button>
              <button className="p-2 sm:p-2.5 bg-white rounded border border-neutral-300 flex justify-center items-center hover:bg-gray-50 transition">
                <MoreHorizontal size={18} className="text-neutral-600 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

      {/* Orders Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <>
        {/* Mobile Card View - Hidden on lg screens */}
        <div className="lg:hidden space-y-3">
          {/* Mobile Select All */}
          {paginatedOrders.length > 0 && (
            <div className="flex items-center justify-between px-2 py-2 bg-gradient-to-r from-sky-400/10 to-blue-500/10 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-medium text-neutral-600">Select All</span>
              </label>
              <span className="text-xs text-neutral-500">{paginatedOrders.length} orders</span>
            </div>
          )}

          {paginatedOrders.length ? (
            paginatedOrders.map((order, index) => {
              const isSelected = selectedOrderIds.includes(order.id);
              const rowNumber = (currentPage - 1) * ordersPerPage + index + 1;
              const isPaid = order.paymentMethod === 'bKash' || order.paymentMethod === 'Nagad' || order.paymentMethod === 'Card';

              return (
                <div
                  key={order.id}
                  ref={(el) => { if (el) orderRowRefs.current.set(order.id, el); }}
                  className={`bg-white rounded-xl border p-3 sm:p-4 transition ${
                    highlightedOrderId === order.id
                      ? 'border-blue-300 ring-2 ring-blue-300 bg-blue-50'
                      : isSelected
                        ? 'border-blue-200 bg-blue-50/50'
                        : 'border-gray-200'
                  }`}
                >
                  {/* Top Row: Checkbox, Order ID, Status, Action */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleOrderSelection(order.id);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-gray-400">#{rowNumber}</span>
                      <span className="text-gray-900 font-semibold text-sm">#{order.id.slice(-6)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500"
                        onClick={() => openOrderModal(order)}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Product Row */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {order.productImage ? (
                        <img
                          src={normalizeImageUrl(order.productImage)}
                          alt={order.productName || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package2 size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium text-sm truncate">{order.productName || 'Custom Order'}</p>
                      <p className="text-gray-500 text-xs">SKU: {order.sku || `SKU-${order.id.slice(-4)}`}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-900 font-bold text-sm">{formatCurrency(order.amount)}</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className={`text-[10px] ${isPaid ? 'text-green-600' : 'text-gray-400'}`}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer & Date Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium text-xs sm:text-sm truncate">{order.customer}</p>
                      <p className="text-gray-500 text-[10px] sm:text-xs">{order.phone || 'No phone'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        {order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                      </span>
                      <button
                        onClick={() => openOrderModal(order)}
                        className="px-2 sm:px-3 py-1 bg-blue-500 text-white text-[10px] sm:text-xs font-medium rounded-full hover:bg-blue-600 transition"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Package2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No orders found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Desktop Table View - Hidden on mobile, shown on lg+ screens */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'Lato, sans-serif' }}>
            <thead>
              <tr className="h-10 bg-gradient-to-r from-sky-400/10 to-blue-500/10 rounded-md">
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">No.</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Order Id</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">SKU</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Product</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Customer Info</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Date</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Price</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Payment</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Status</th>
                <th className="px-3 py-2 text-left text-neutral-600 text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length ? (
                paginatedOrders.map((order, index) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const rowNumber = (currentPage - 1) * ordersPerPage + index + 1;
                  const isPaid = order.paymentMethod === 'bKash' || order.paymentMethod === 'Nagad' || order.paymentMethod === 'Card';

                  return (
                    <tr
                      key={order.id}
                      ref={(el) => { if (el) orderRowRefs.current.set(order.id, el); }}
                      className={`h-16 border-b border-zinc-300 transition hover:bg-gray-50 ${highlightedOrderId === order.id
                        ? 'bg-blue-50 ring-2 ring-blue-300'
                        : isSelected
                          ? 'bg-blue-50/50'
                          : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleOrderSelection(order.id);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Row Number */}
                      <td className="px-3 py-3 text-zinc-800 text-sm font-normal">{rowNumber}</td>

                      {/* Order ID */}
                      <td className="px-3 py-3">
                        <span className="text-gray-900 font-medium">#{order.id.slice(-6)}</span>
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-3 text-zinc-800 text-sm">
                        {order.sku || `SKU-${order.id.slice(-4)}`}
                      </td>

                      {/* Product */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {order.productImage ? (
                              <img
                                src={normalizeImageUrl(order.productImage)}
                                alt={order.productName || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package2 size={18} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-gray-900 font-medium truncate max-w-[150px]">
                            {order.productName || 'Custom Order'}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-gray-900 font-medium">{order.customer}</p>
                          <p className="text-gray-500 text-xs">{order.phone || 'No phone'}</p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs">
                            {order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                          <button
                            onClick={() => openOrderModal(order)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition"
                          >
                            Details
                          </button>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3">
                        <span className="text-black text-sm font-semibold">{formatCurrency(order.amount)}</span>
                      </td>

                      {/* Payment */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className={`text-sm ${isPaid ? 'text-black' : 'text-gray-500'}`}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3">
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700"
                          onClick={() => openOrderModal(order)}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                    <Package2 size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No orders found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 sm:py-4 mt-3 sm:mt-4 border-t border-gray-100">
              <p className="text-neutral-600 text-xs sm:text-sm font-normal order-2 sm:order-1" style={{ fontFamily: 'Lato, sans-serif' }}>
                Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex justify-center items-center gap-1 sm:gap-1.5 order-1 sm:order-2 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)] text-neutral-500 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-gray-50" style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  <span className="hidden sm:inline">Previous</span>
                  <ChevronLeft size={16} className="sm:hidden" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  const maxVisible = 5;
                  if (totalPages <= maxVisible) {
                    pageNum = i + 1;
                  } else if (currentPage <= Math.floor(maxVisible / 2) + 1) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - Math.floor(maxVisible / 2)) {
                    pageNum = totalPages - maxVisible + 1 + i;
                  } else {
                    pageNum = currentPage - Math.floor(maxVisible / 2) + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded text-xs sm:text-sm font-bold flex justify-center items-center transition ${currentPage === pageNum
                        ? 'bg-sky-100 text-blue-500'
                        : 'bg-white text-neutral-500 hover:bg-gray-50'
                        }`} style={{ fontFamily: 'Lato, sans-serif' }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-1 sm:px-2 text-gray-400 text-xs">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)] text-neutral-500 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-gray-50" style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} className="sm:hidden" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>

      {/* Floating Selection Bar - Mobile Optimized */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-white text-gray-800 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-xl z-50 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 border border-gray-200">
          <span className="flex items-center gap-1.5 sm:gap-2 bg-blue-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold">
            {selectedOrderIds.length} <span className="hidden xs:inline">Items</span> selected
          </span>

          <button
            onClick={clearSelection}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <X size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Clear</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1 sm:gap-1.5 bg-teal-500 hover:bg-teal-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <Download size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Export</span>
            </button>

            <button
              onClick={handleMultiplePrint}
              className="flex items-center gap-1 sm:gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <Printer size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Print</span>
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <span className="hidden sm:inline">Change</span> Status
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 sm:gap-1.5 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Select Courier Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-4 sm:mb-6">Select Your Courier</h3>

            <div className="space-y-2 sm:space-y-3">
              {COURIERS.map((courier) => (
                <button
                  key={courier.id}
                  onClick={() => handleAssignCourier(courier.id, courier.name)}
                  className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {courier.logo ? (
                      <img src={courier.logo} alt={courier.name} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : null}
                    <Truck size={18} className="text-gray-400 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{courier.name}</p>
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={10} className="text-white opacity-0 group-hover:opacity-100 sm:w-3 sm:h-3" />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowCourierModal(false);
                  setCourierModalOrderId(null);
                }}
                className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-4 sm:mb-6">Change Order Status</h3>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[50vh] overflow-y-auto">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusChange(status)}
                  className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${STATUS_COLORS[status]} hover:opacity-80`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex justify-center mt-4 sm:mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && draftOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[95vh] sm:max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl sm:rounded-2xl bg-white p-3 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wide">Order #{selectedOrder.id.slice(-6)}</p>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">Order Details</h2>
                <p className="text-xs sm:text-sm text-gray-500">Edit order information or print invoice.</p>
              </div>
              <button onClick={closeOrderModal} className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0" aria-label="Close modal">
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
              <div className="space-y-3 sm:space-y-4 lg:col-span-2">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Customer Name</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.customer}
                      onChange={(event) => handleDraftChange('customer', event.target.value)}
                    />
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Phone</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.phone || ''}
                      onChange={(event) => handleDraftChange('phone', event.target.value)}
                    />
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Email</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.email || ''}
                      onChange={(event) => handleDraftChange('email', event.target.value)}
                    />
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Division</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.division || ''}
                      onChange={(event) => handleDraftChange('division', event.target.value)}
                    />
                  </label>
                </div>

                <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <span className="text-gray-600 font-medium">Delivery Address</span>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    value={draftOrder.location}
                    onChange={(event) => handleDraftChange('location', event.target.value)}
                  />
                </label>

                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2">
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Amount</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.amount}
                      onChange={(event) => handleDraftChange('amount', Number(event.target.value))}
                    />
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Delivery Charge</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.deliveryCharge || 0}
                      onChange={(event) => handleDraftChange('deliveryCharge', Number(event.target.value))}
                    />
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Status</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.status}
                      onChange={(event) => handleDraftChange('status', event.target.value as Order['status'])}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Delivery Type</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.deliveryType || 'Regular'}
                      onChange={(event) => handleDraftChange('deliveryType', event.target.value as Order['deliveryType'])}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Express">Express</option>
                      <option value="Free">Free</option>
                    </select>
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Tracking ID</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.trackingId || ''}
                      onChange={(event) => handleDraftChange('trackingId', event.target.value)}
                    />
                  </label>
                  <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Courier Provider</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 sm:p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.courierProvider || ''}
                      onChange={(event) => handleDraftChange('courierProvider', (event.target.value || undefined) as Order['courierProvider'])}
                    >
                      <option value="">Not Assigned</option>
                      <option value="Steadfast">Steadfast</option>
                      <option value="Pathao">Pathao</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Order Snapshot Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium">
                    <Package2 size={14} className="text-blue-500 sm:w-4 sm:h-4" />
                    <span>Order Snapshot</span>
                  </div>
                  <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
                    <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5" /> <span className="truncate">{draftOrder.productName || 'Custom request'}</span></div>
                    <div className="flex items-center gap-2"><AlertTriangle size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5" /> Qty: {draftOrder.quantity || 1}</div>
                    {draftOrder.variant && (
                      <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5" /> {draftOrder.variant.color} / {draftOrder.variant.size}</div>
                    )}
                    <div className="flex items-center gap-2"><Truck size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5" /> <span className="truncate">ID: {getCourierId(draftOrder) || 'Pending'}</span></div>
                  </div>
                </div>

                {/* Fraud Check Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">Fraud Check</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Powered by Steadfast API</p>
                    </div>
                    {fraudBadge && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold flex-shrink-0 ${fraudBadge.color.includes('emerald') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        fraudBadge.color.includes('amber') ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                        {fraudBadge.icon}
                        {fraudBadge.label}
                      </span>
                    )}
                  </div>
                  {fraudResult && (
                    <div className="rounded-lg border border-gray-200 bg-white p-2 sm:p-3 text-[10px] sm:text-xs text-gray-600">
                      <p>Status: <span className="font-semibold text-gray-900">{fraudResult.status}</span></p>
                      {typeof fraudResult.riskScore === 'number' && (
                        <p>Risk Score: <span className="font-semibold text-gray-900">{fraudResult.riskScore}</span></p>
                      )}
                      {fraudResult.remarks && (
                        <p>Remarks: <span className="text-gray-700">{fraudResult.remarks}</span></p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleFraudCheck(draftOrder)}
                    disabled={isFraudChecking}
                    className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition disabled:opacity-60"
                  >
                    {isFraudChecking ? 'Checking...' : 'Run Fraud Check'}
                  </button>
                </div>

                {/* Quick Actions Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Quick Actions</p>
                  <div className="mt-2 sm:mt-3 space-y-2">
                    {/* Send to Steadfast Button */}
                    {draftOrder.courierProvider === 'Steadfast' && draftOrder.trackingId ? (
                      <div className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-emerald-600">
                        <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Sent to Steadfast
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendToSteadfast(draftOrder)}
                        disabled={isSendingToSteadfast || !courierConfig.apiKey || !courierConfig.secretKey}
                        className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                        title={!courierConfig.apiKey || !courierConfig.secretKey ? 'Configure Steadfast API in Courier Settings' : 'Send order to Steadfast'}
                      >
                        {isSendingToSteadfast ? (
                          <>
                            <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4" /> Sending...
                          </>
                        ) : (
                          <>
                            <Send size={14} className="sm:w-4 sm:h-4" /> Send to Steadfast
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintInvoice(draftOrder)}
                      className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-gray-300 bg-white py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Printer size={14} className="sm:w-4 sm:h-4" /> Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col-reverse gap-2 sm:gap-3 border-t border-gray-200 pt-3 sm:pt-4 sm:flex-row sm:justify-end">
              <button
                onClick={closeOrderModal}
                className="rounded-lg border border-gray-300 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="rounded-lg bg-blue-500 hover:bg-blue-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
