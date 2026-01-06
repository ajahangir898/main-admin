import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Filter, Edit3, Printer, ShieldAlert, ShieldCheck, X, Package2, MapPin, Mail, Truck, AlertTriangle, CheckCircle2, Send, Loader2, MoreVertical, Download, Trash2, Phone, MessageCircle, ExternalLink, FileText, Plus, TrendingUp, Eye, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
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
  }), [orders]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Order List</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium text-sm">
            <Plus size={18} />
            Add Order
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
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

      {/* Stats Cards */}
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Total Orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{metrics.total.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Package2 size={24} className="text-blue-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp size={12} />
                +14.4%
              </span>
              <span className="text-xs text-gray-500">Last 7 days</span>
            </div>
          </div>

          {/* GMV */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">GMV</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(metrics.revenue)}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <span className="text-emerald-500 font-bold text-lg">৳</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp size={12} />
                +20%
              </span>
              <span className="text-xs text-gray-500">Last 7 days</span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{metrics.pending}</p>
                <p className="mt-1 text-xs text-gray-400">Need confirmation</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={22} className="text-orange-500" />
              </div>
            </div>
            <button 
              onClick={() => setStatusFilter('Pending')}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Eye size={14} />
              View
            </button>
          </div>

          {/* AVG Order */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">AVG Order</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(metrics.average)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <TrendingUp size={22} className="text-purple-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp size={12} />
                +5%
              </span>
              <span className="text-xs text-gray-500">Per customer spend</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              statusFilter === 'all' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All order ({tabCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('Delivered')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              statusFilter === 'Delivered' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({tabCounts.completed})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              statusFilter === 'Pending' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({tabCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('Cancelled')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              statusFilter === 'Cancelled' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cancelled ({tabCounts.cancelled})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search order report"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <button className="p-2.5 border border-gray-300 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order Id</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer Info</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedOrders.length ? (
                  paginatedOrders.map((order, index) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const rowNumber = (currentPage - 1) * ordersPerPage + index + 1;
                    const isPaid = order.paymentMethod === 'bKash' || order.paymentMethod === 'Nagad' || order.paymentMethod === 'Card';
                    
                    return (
                    <tr 
                      key={order.id} 
                      ref={(el) => { if (el) orderRowRefs.current.set(order.id, el); }}
                      className={`transition hover:bg-gray-50 ${
                        highlightedOrderId === order.id 
                          ? 'bg-blue-50 ring-2 ring-blue-300' 
                          : isSelected
                          ? 'bg-blue-50/50'
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4 text-gray-600 font-medium">{rowNumber}</td>
                      
                      {/* Order ID */}
                      <td className="px-4 py-4">
                        <span className="text-gray-900 font-medium">#{order.id.slice(-6)}</span>
                      </td>
                      
                      {/* SKU */}
                      <td className="px-4 py-4 text-gray-600">
                        {order.sku || `SKU-${order.id.slice(-4)}`}
                      </td>
                      
                      {/* Product */}
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-gray-900 font-medium">{order.customer}</p>
                          <p className="text-gray-500 text-xs">{order.phone || 'No phone'}</p>
                        </div>
                      </td>
                      
                      {/* Date */}
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4">
                        <span className="text-gray-900 font-semibold">{formatCurrency(order.amount)}</span>
                      </td>
                      
                      {/* Payment */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                          <span className={`text-sm ${isPaid ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Selection Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-4 border border-gray-200">
          <span className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
            {selectedOrderIds.length} Items selected
          </span>
          
          <button
            onClick={clearSelection}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <X size={14} /> Clear
          </button>
          
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <Download size={14} /> Export
          </button>
          
          <button
            onClick={handleMultiplePrint}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <Printer size={14} /> Print
          </button>
          
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Change Status
          </button>
          
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Select Courier Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Select Your Courier</h3>
            
            <div className="space-y-3">
              {COURIERS.map((courier) => (
                <button
                  key={courier.id}
                  onClick={() => handleAssignCourier(courier.id, courier.name)}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {courier.logo ? (
                      <img src={courier.logo} alt={courier.name} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : null}
                    <Truck size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-800">{courier.name}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-500 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCourierModal(false);
                  setCourierModalOrderId(null);
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Change Order Status</h3>
            
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusChange(status)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition ${STATUS_COLORS[status]} hover:opacity-80`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && draftOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Order #{selectedOrder.id.slice(-6)}</p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">Order Details</h2>
                <p className="text-sm text-gray-500">Edit order information or print invoice.</p>
              </div>
              <button onClick={closeOrderModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Customer Name</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.customer}
                      onChange={(event) => handleDraftChange('customer', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Phone</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.phone || ''}
                      onChange={(event) => handleDraftChange('phone', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Email</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.email || ''}
                      onChange={(event) => handleDraftChange('email', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Division</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.division || ''}
                      onChange={(event) => handleDraftChange('division', event.target.value)}
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm">
                  <span className="text-gray-600 font-medium">Delivery Address</span>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    value={draftOrder.location}
                    onChange={(event) => handleDraftChange('location', event.target.value)}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Amount</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.amount}
                      onChange={(event) => handleDraftChange('amount', Number(event.target.value))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Delivery Charge</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.deliveryCharge || 0}
                      onChange={(event) => handleDraftChange('deliveryCharge', Number(event.target.value))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Status</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Delivery Type</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.deliveryType || 'Regular'}
                      onChange={(event) => handleDraftChange('deliveryType', event.target.value as Order['deliveryType'])}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Express">Express</option>
                      <option value="Free">Free</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Tracking ID</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={draftOrder.trackingId || ''}
                      onChange={(event) => handleDraftChange('trackingId', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-600 font-medium">Courier Provider</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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

              <div className="space-y-4">
                {/* Order Snapshot Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Package2 size={16} className="text-blue-500" />
                    <span>Order Snapshot</span>
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {draftOrder.productName || 'Custom request'}</div>
                    <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-gray-400" /> Qty: {draftOrder.quantity || 1}</div>
                    {draftOrder.variant && (
                      <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-gray-400" /> {draftOrder.variant.color} / {draftOrder.variant.size}</div>
                    )}
                    <div className="flex items-center gap-2"><Truck size={14} className="text-gray-400" /> Courier ID: {getCourierId(draftOrder) || 'Pending'}</div>
                  </div>
                </div>

                {/* Fraud Check Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Fraud Check</p>
                      <p className="text-xs text-gray-500">Powered by Steadfast API</p>
                    </div>
                    {fraudBadge && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                        fraudBadge.color.includes('emerald') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        fraudBadge.color.includes('amber') ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {fraudBadge.icon}
                        {fraudBadge.label}
                      </span>
                    )}
                  </div>
                  {fraudResult && (
                    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
                  >
                    {isFraudChecking ? 'Checking...' : 'Run Fraud Check'}
                  </button>
                </div>

                {/* Quick Actions Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Quick Actions</p>
                  <div className="mt-3 space-y-2">
                    {/* Send to Steadfast Button */}
                    {draftOrder.courierProvider === 'Steadfast' && draftOrder.trackingId ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-600">
                        <CheckCircle2 size={16} /> Sent to Steadfast
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendToSteadfast(draftOrder)}
                        disabled={isSendingToSteadfast || !courierConfig.apiKey || !courierConfig.secretKey}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                        title={!courierConfig.apiKey || !courierConfig.secretKey ? 'Configure Steadfast API in Courier Settings' : 'Send order to Steadfast'}
                      >
                        {isSendingToSteadfast ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <Send size={16} /> Send to Steadfast
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintInvoice(draftOrder)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Printer size={16} /> Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
              <button
                onClick={closeOrderModal}
                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="rounded-lg bg-blue-500 hover:bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
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
