import React, { useMemo, useState, useEffect } from 'react';
import { Users, MessageCircle, Star, Search, Mail, Phone, MapPin, ShoppingBag, Calendar, TrendingUp, Filter, Flag, CheckCircle, Send, Edit3, User } from 'lucide-react';
import { Order, Product } from '../types';
import { formatCurrency } from '../utils/format';
import { MetricsSkeleton } from '../components/SkeletonLoaders';

type ReviewStatus = 'published' | 'pending' | 'flagged';

type ReviewItem = {
  id: string;
  customer: string;
  avatar: string;
  rating: number;
  headline: string;
  message: string;
  product: string;
  date: string;
  status: ReviewStatus;
  reply?: string;
};

interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  firstOrderDate: string;
  avgOrderValue: number;
  orders: Order[];
}

interface AdminCustomersProps {
  orders: Order[];
  products?: Product[];
}

const AdminCustomers: React.FC<AdminCustomersProps> = ({ orders, products = [] }) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'reviews'>('customers');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  
  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | ReviewStatus>('all');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Extract unique customers from orders
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerInfo>();
    
    orders.forEach(order => {
      const phone = order.customerPhone || order.phone || '';
      if (!phone) return;
      
      const existing = customerMap.get(phone);
      const orderTotal = order.total || order.grandTotal || 0;
      const orderDate = order.createdAt || order.date || new Date().toISOString();
      
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += orderTotal;
        existing.orders.push(order);
        
        // Update last/first order dates
        if (new Date(orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = orderDate;
        }
        if (new Date(orderDate) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = orderDate;
        }
        existing.avgOrderValue = existing.totalSpent / existing.totalOrders;
      } else {
        customerMap.set(phone, {
          id: phone,
          name: order.customerName || order.name || 'Unknown',
          phone: phone,
          email: order.customerEmail || order.email || '',
          address: order.customerAddress || order.address || '',
          totalOrders: 1,
          totalSpent: orderTotal,
          lastOrderDate: orderDate,
          firstOrderDate: orderDate,
          avgOrderValue: orderTotal,
          orders: [order]
        });
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Customer stats
  const customerStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalRevenue / Math.max(orders.length, 1);
    const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    
    return { totalCustomers, totalRevenue, avgOrderValue, repeatCustomers, repeatRate };
  }, [customers, orders]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const query = search.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [customers, search]);

  // Review stats
  const reviewStats = useMemo(() => {
    const published = reviews.filter(r => r.status === 'published').length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const flagged = reviews.filter(r => r.status === 'flagged').length;
    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    return { published, pending, flagged, avgRating };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const matchesFilter = reviewFilter === 'all' || review.status === reviewFilter;
      if (!matchesFilter) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        review.customer.toLowerCase().includes(query) ||
        review.product.toLowerCase().includes(query) ||
        review.message.toLowerCase().includes(query)
      );
    });
  }, [reviews, search, reviewFilter]);

  const selectedReview = useMemo(() => 
    reviews.find(r => r.id === selectedReviewId) || null
  , [reviews, selectedReviewId]);

  const handlePublish = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'published' as ReviewStatus } : r));
  };

  const handleFlag = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'flagged' as ReviewStatus } : r));
  };

  const handleSendReply = () => {
    if (!selectedReviewId || !replyDraft.trim()) return;
    setReviews(prev => prev.map(r => r.id === selectedReviewId ? { ...r, reply: replyDraft.trim() } : r));
    setReplyDraft('');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-BD', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'flagged':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customers & Reviews</h2>
          <p className="text-sm text-gray-500">Manage customer relationships and product reviews</p>
        </div>
        
        {/* Tab Buttons */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'customers' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} />
            Customers
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'customers' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {customerStats.totalCustomers}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'reviews' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle size={16} />
            Reviews
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'reviews' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {reviews.length}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : activeTab === 'customers' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Total Customers</span>
              <Users size={18} className="text-indigo-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{customerStats.totalCustomers}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Total Revenue</span>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">৳ {formatCurrency(customerStats.totalRevenue)}</p>
            <p className="text-xs text-gray-400 mt-1">From all customers</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Avg Order Value</span>
              <ShoppingBag size={18} className="text-orange-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">৳ {formatCurrency(customerStats.avgOrderValue)}</p>
            <p className="text-xs text-gray-400 mt-1">Per order</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Repeat Customers</span>
              <Users size={18} className="text-purple-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{customerStats.repeatRate}%</p>
            <p className="text-xs text-gray-400 mt-1">{customerStats.repeatCustomers} returning</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Avg Rating</span>
              <Star size={18} className="text-yellow-500 fill-yellow-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{reviewStats.avgRating}</p>
            <p className="text-xs text-gray-400 mt-1">Out of 5 stars</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Published</span>
              <CheckCircle size={18} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{reviewStats.published}</p>
            <p className="text-xs text-gray-400 mt-1">Visible to all</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Pending</span>
              <MessageCircle size={18} className="text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{reviewStats.pending}</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
          </div>
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Flagged</span>
              <Flag size={18} className="text-rose-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-gray-800">{reviewStats.flagged}</p>
            <p className="text-xs text-gray-400 mt-1">Need attention</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'customers' ? 'Search by name, phone, or email...' : 'Search reviews...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 text-sm"
          />
        </div>
        {activeTab === 'reviews' && (
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as typeof reviewFilter)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All Reviews</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'customers' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <Users size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="font-medium">No customers found</p>
                        <p className="text-sm">Customers will appear here when orders are placed</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => (
                      <tr 
                        key={customer.id} 
                        onClick={() => setSelectedCustomer(customer)}
                        className={`hover:bg-gray-50 cursor-pointer transition ${
                          selectedCustomer?.id === customer.id ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{customer.name}</p>
                              <p className="text-xs text-gray-400">Since {formatDate(customer.firstOrderDate)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-700 flex items-center gap-1">
                              <Phone size={12} className="text-gray-400" />
                              {customer.phone}
                            </span>
                            {customer.email && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail size={10} />
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            customer.totalOrders > 1 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {customer.totalOrders}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                          ৳ {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 text-xs">
                          {formatDate(customer.lastOrderDate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Detail Panel */}
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm h-fit">
            {selectedCustomer ? (
              <div className="space-y-5">
                <div className="text-center pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl mb-3">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                </div>
                
                <div className="space-y-3">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-600">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{selectedCustomer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-600">Customer since {formatDate(selectedCustomer.firstOrderDate)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-gray-800">{selectedCustomer.totalOrders}</p>
                    <p className="text-xs text-gray-500">Total Orders</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-emerald-600">৳ {formatCurrency(selectedCustomer.totalSpent)}</p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Orders</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCustomer.orders.slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium text-gray-700">#{order.id}</p>
                          <p className="text-xs text-gray-400">{formatDate(order.createdAt || order.date || '')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">৳ {formatCurrency(order.total || order.grandTotal || 0)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <User size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Select a customer</p>
                <p className="text-sm">Click on a customer to see details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reviews Tab */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Reviews List */}
          <div className="xl:col-span-2 space-y-3">
            {filteredReviews.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="font-medium text-gray-600">No reviews yet</p>
                <p className="text-sm text-gray-400">Reviews will appear here when customers submit them</p>
              </div>
            ) : (
              filteredReviews.map(review => (
                <div
                  key={review.id}
                  onClick={() => setSelectedReviewId(review.id)}
                  className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition hover:shadow-md ${
                    selectedReviewId === review.id ? 'border-emerald-400 ring-1 ring-emerald-100' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={review.avatar} alt={review.customer} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-800">{review.customer}</p>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(review.status)}`}>
                        {review.status}
                      </span>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-700 mt-3">{review.headline}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{review.message}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">{review.product}</p>
                </div>
              ))
            )}
          </div>

          {/* Review Detail Panel */}
          <div className="bg-white border border-purple-400 rounded-2xl p-5 shadow-sm h-fit">
            {selectedReview ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src={selectedReview.avatar} alt={selectedReview.customer} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-gray-800">{selectedReview.customer}</p>
                    <p className="text-xs text-gray-400">{selectedReview.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                    />
                  ))}
                </div>

                <div>
                  <p className="font-semibold text-gray-700">{selectedReview.headline}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedReview.message}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Product</p>
                  <p className="font-medium text-gray-700">{selectedReview.product}</p>
                </div>

                {selectedReview.reply && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-600 uppercase font-semibold mb-1">Your Reply</p>
                    <p className="text-sm text-gray-700">{selectedReview.reply}</p>
                  </div>
                )}

                {!selectedReview.reply && (
                  <div className="pt-3 border-t border-gray-100">
                    <label className="text-xs text-gray-500 uppercase font-semibold">Reply to review</label>
                    <textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={3}
                      className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                      placeholder="Write a thoughtful reply..."
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyDraft.trim()}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} /> Send Reply
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  {selectedReview.status !== 'published' && (
                    <button
                      onClick={() => handlePublish(selectedReview.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-200"
                    >
                      <CheckCircle size={14} /> Publish
                    </button>
                  )}
                  {selectedReview.status !== 'flagged' && (
                    <button
                      onClick={() => handleFlag(selectedReview.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-200"
                    >
                      <Flag size={14} /> Flag
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <MessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Select a review</p>
                <p className="text-sm">Click on a review to see details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
