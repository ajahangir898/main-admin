import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Filter, Edit3, Printer, ShieldAlert, ShieldCheck, X, Package2, MapPin, Mail, Truck, AlertTriangle, CheckCircle2, Send, Loader2, MoreVertical, Download, Trash2, Phone, MessageCircle, ExternalLink, FileText } from 'lucide-react';
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

const STATUS_COLORS: Record<Order['status'], string> = {
  Pending: 'text-amber-300 bg-amber-500/15 border border-amber-500/40',
  Confirmed: 'text-sky-200 bg-sky-500/10 border border-sky-500/30',
  'On Hold': 'text-orange-300 bg-orange-500/15 border border-orange-500/40',
  Processing: 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/40',
  Shipped: 'text-indigo-200 bg-indigo-500/10 border border-indigo-500/30',
  'Sent to Courier': 'text-purple-300 bg-purple-500/15 border border-purple-500/40',
  Delivered: 'text-emerald-200 bg-emerald-500/10 border border-emerald-500/30',
  Cancelled: 'text-rose-200 bg-rose-500/10 border border-rose-500/30',
  Return: 'text-yellow-300 bg-yellow-500/15 border border-yellow-500/40',
  Refund: 'text-pink-300 bg-pink-500/15 border border-pink-500/40',
  'Returned Receive': 'text-slate-300 bg-slate-500/15 border border-slate-500/40'
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

  return (
    <div className="space-y-6">
      {/* Steadfast Configuration Warning */}
      {!isSteadfastConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">Steadfast API Not Configured</p>
            <p className="text-xs text-amber-200/70">Go to Courier Settings to add your API Key and Secret Key to enable order sending and fraud checks.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Operations</p>
          <h1 className="text-2xl font-bold text-white">Order Intelligence</h1>
          <p className="text-sm text-white/60">Monitor, edit, and clear every Steadfast-ready shipment.</p>
        </div>
        <div className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-white placeholder-white/40 focus:border-rose-400 focus:outline-none"
              placeholder="Search by customer, phone, or order ID"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-white focus:border-rose-400 focus:outline-none"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1f0b0f] to-[#12080b] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Total Orders</p>
            <p className="mt-2 text-3xl font-bold text-white">{metrics.total}</p>
            <p className="text-xs text-white/40">Across all time</p>
          </div>
          <div className="rounded-2xl border border-white/10 from-[#24090c] to-[#12080b] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">GMV</p>
            <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(metrics.revenue)}</p>
            <p className="text-xs text-white/40">Gross merchandise value</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a0c1c] to-[#0c0a12] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pending</p>
            <p className="mt-2 text-3xl font-bold text-white">{metrics.pending}</p>
            <p className="text-xs text-white/40">Need confirmation</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1612] to-[#06090c] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Avg Order</p>
            <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(metrics.average)}</p>
            <p className="text-xs text-white/40">Per customer spend</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-[#080509]/80 px-4 py-3 text-sm text-white/70">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Package2 size={16} className="text-rose-300" />
            <span>{filteredOrders.length} orders match current filters</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-emerald-300" />
            <span>{metrics.fulfilled} delivered so far</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0609]/80">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-white/50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3">Image</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Order ID</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Phone No</th>
                  <th className="px-3 py-3">Order From</th>
                  <th className="px-3 py-3">Order Date Time</th>
                  <th className="px-3 py-3">Payment Type</th>
                  <th className="px-3 py-3">Order Status</th>
                  <th className="px-3 py-3">Courier</th>
                  <th className="px-3 py-3">Reward Points</th>
                  <th className="px-3 py-3">Grand Total</th>
                  <th className="px-3 py-3">Note</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.length ? (
                  filteredOrders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const courierId = getCourierId(order);
                    
                    return (
                    <tr 
                      key={order.id} 
                      ref={(el) => { if (el) orderRowRefs.current.set(order.id, el); }}
                      className={`transition hover:bg-white/5 ${
                        highlightedOrderId === order.id 
                          ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50 animate-pulse' 
                          : isSelected
                          ? 'bg-purple-500/10'
                          : 'bg-white/0'
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
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>
                      
                      {/* Image */}
                      <td className="px-3 py-3">
                        <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden">
                          {order.productImage ? (
                            <img 
                              src={normalizeImageUrl(order.productImage)} 
                              alt={order.productName || 'Product'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                              <Package2 size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* SKU */}
                      <td className="px-3 py-3 text-white">
                        <p className="text-xs font-mono text-white/70 max-w-[150px] truncate" title={(order as any).sku || order.productName}>
                          {(order as any).sku || order.productName || '—'}
                        </p>
                      </td>
                      
                      {/* Order ID */}
                      <td className="px-3 py-3 text-white">
                        <p className="font-semibold text-sm">{order.id}</p>
                      </td>
                      
                      {/* Name */}
                      <td className="px-3 py-3 text-white">
                        <p className="font-medium text-sm">{order.customer}</p>
                      </td>
                      
                      {/* Phone No */}
                      <td className="px-3 py-3">
                        {order.phone ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-white text-sm">{order.phone}</span>
                            <div className="flex items-center gap-2">
                              <a 
                                href={`https://wa.me/${order.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-green-400 hover:text-green-300"
                                title="WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </a>
                              <a 
                                href={`tel:${order.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-400 hover:text-blue-300"
                                title="Call"
                              >
                                <Phone size={14} />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-white/40">—</span>
                        )}
                      </td>
                      
                      {/* Order From */}
                      <td className="px-3 py-3">
                        <span className="text-xs text-white/70">{(order as any).orderFrom || 'Website'}</span>
                      </td>
                      
                      {/* Order Date Time */}
                      <td className="px-3 py-3 text-white">
                        <p className="text-xs">{order.date}</p>
                      </td>
                      
                      {/* Payment Type */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            {(order as any).paymentType || 'COD'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (order as any).paymentStatus === 'Paid' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {(order as any).paymentStatus || 'Unpaid'}
                          </span>
                        </div>
                      </td>
                      
                      {/* Order Status */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      
                      {/* Courier */}
                      <td className="px-3 py-3">
                        {order.courierProvider && courierId ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-white/80">{order.courierProvider}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-white/50 font-mono">{courierId}</span>
                              <a
                                href={`#`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.success('Tracking link copied!');
                                }}
                                className="text-cyan-400 hover:text-cyan-300"
                                title="Tracking Link"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourierModalOrderId(order.id);
                              setShowCourierModal(true);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 underline"
                          >
                            Assign Courier
                          </button>
                        )}
                      </td>
                      
                      {/* Reward Points */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-white/50">{(order as any).rewardPoints || '—'}</span>
                      </td>
                      
                      {/* Grand Total */}
                      <td className="px-3 py-3">
                        <span className="font-semibold text-emerald-300">৳ {order.amount.toLocaleString()}</span>
                      </td>
                      
                      {/* Note */}
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success('Add note feature');
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
                        >
                          Add Note
                        </button>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="relative flex items-center justify-end" data-action-dropdown>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionDropdown(openActionDropdown === order.id ? null : order.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition"
                          >
                            <MoreVertical size={16} className="text-white/60" />
                          </button>
                          
                          {openActionDropdown === order.id && (
                            <div className="absolute right-0 top-8 w-40 bg-[#1a1015] rounded-lg shadow-xl border border-white/10 z-50 py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderModal(order);
                                  setOpenActionDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.success(`Viewing details for ${order.id}`);
                                  setOpenActionDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2"
                              >
                                <FileText size={12} /> Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintInvoice(order);
                                  setOpenActionDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Printer size={12} /> Print Invoice
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCourierModalOrderId(order.id);
                                  setShowCourierModal(true);
                                  setOpenActionDropdown(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Truck size={12} /> Assign Courier
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={15} className="px-6 py-20 text-center text-white/50">
                    No orders found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Floating Selection Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1a1015] text-white px-4 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4 border border-white/10">
          <span className="flex items-center gap-2 bg-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
            {selectedOrderIds.length} Items selected
          </span>
          
          <button
            onClick={clearSelection}
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition"
          >
            <X size={14} /> Clear Selection
          </button>
          
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <Download size={14} /> Download Excel
          </button>
          
          <button
            onClick={handleMultiplePrint}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <Printer size={14} /> Multiple print
          </button>
          
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Change Order Status
          </button>
          
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Select Courier Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 text-center mb-6">Select Your Courier</h3>
            
            <div className="space-y-3">
              {COURIERS.map((courier) => (
                <button
                  key={courier.id}
                  onClick={() => handleAssignCourier(courier.id, courier.name)}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition group"
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
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-green-500 group-hover:bg-green-500 flex items-center justify-center">
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
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCourierModal(false);
                  setCourierModalOrderId(null);
                }}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1015] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white text-center mb-6">Change Order Status</h3>
            
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusChange(status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${STATUS_COLORS[status]} hover:opacity-80`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && draftOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0507] p-6 text-white shadow-2xl shadow-rose-900/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-rose-300">Order #{selectedOrder.id}</p>
                <h2 className="text-2xl font-semibold">Customer Intelligence</h2>
                <p className="text-sm text-white/60">Edit the payload, trigger Steadfast fraud signals, or print a branded invoice.</p>
              </div>
              <button onClick={closeOrderModal} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:border-rose-400 hover:text-white" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Customer Name</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.customer}
                      onChange={(event) => handleDraftChange('customer', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Phone</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.phone || ''}
                      onChange={(event) => handleDraftChange('phone', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Email</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.email || ''}
                      onChange={(event) => handleDraftChange('email', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Division</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.division || ''}
                      onChange={(event) => handleDraftChange('division', event.target.value)}
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm">
                  <span className="text-white/60">Delivery Address</span>
                  <textarea
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                    value={draftOrder.location}
                    onChange={(event) => handleDraftChange('location', event.target.value)}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Amount</span>
                    <input
                      type="number"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.amount}
                      onChange={(event) => handleDraftChange('amount', Number(event.target.value))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Delivery Charge</span>
                    <input
                      type="number"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.deliveryCharge || 0}
                      onChange={(event) => handleDraftChange('deliveryCharge', Number(event.target.value))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Status</span>
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
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
                    <span className="text-white/60">Delivery Type</span>
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.deliveryType || 'Regular'}
                      onChange={(event) => handleDraftChange('deliveryType', event.target.value as Order['deliveryType'])}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Express">Express</option>
                      <option value="Free">Free</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Tracking ID</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
                      value={draftOrder.trackingId || ''}
                      onChange={(event) => handleDraftChange('trackingId', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-white/60">Courier Provider</span>
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white focus:border-rose-400 focus:outline-none"
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
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Package2 size={16} className="text-rose-300" />
                    <span>Order Snapshot</span>
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="flex items-center gap-2"><Mail size={14} className="text-white/40" /> {draftOrder.productName || 'Custom request'}</div>
                    <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-white/40" /> Qty: {draftOrder.quantity || 1}</div>
                    {draftOrder.variant && (
                      <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-white/40" /> {draftOrder.variant.color} / {draftOrder.variant.size}</div>
                    )}
                    <div className="flex items-center gap-2"><Truck size={14} className="text-white/40" /> Courier ID: {getCourierId(draftOrder) || 'Pending'}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Fraud Check</p>
                      <p className="text-xs text-white/50">Powered by Steadfast API</p>
                    </div>
                    {fraudBadge && (
                      <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold ${fraudBadge.color}`}>
                        {fraudBadge.icon}
                        {fraudBadge.label}
                      </span>
                    )}
                  </div>
                  {fraudResult && (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
                      <p>Status: <span className="font-semibold text-white">{fraudResult.status}</span></p>
                      {typeof fraudResult.riskScore === 'number' && (
                        <p>Risk Score: <span className="font-semibold text-white">{fraudResult.riskScore}</span></p>
                      )}
                      {fraudResult.remarks && (
                        <p>Remarks: <span className="text-white/80">{fraudResult.remarks}</span></p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleFraudCheck(draftOrder)}
                    disabled={isFraudChecking}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-400 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                  >
                    {isFraudChecking ? 'Checking...' : 'Run Fraud Check'}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Quick Actions</p>
                  <div className="mt-3 space-y-2">
                    {/* Send to Steadfast Button */}
                    {draftOrder.courierProvider === 'Steadfast' && draftOrder.trackingId ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-300">
                        <CheckCircle2 size={16} /> Sent to Steadfast
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendToSteadfast(draftOrder)}
                        disabled={isSendingToSteadfast || !courierConfig.apiKey || !courierConfig.secretKey}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-500 py-3 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-purple-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 py-3 text-sm font-semibold text-white transition hover:border-rose-400"
                    >
                      <Printer size={16} /> Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:justify-end">
              <button
                onClick={closeOrderModal}
                className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 px-8 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
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
