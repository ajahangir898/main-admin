import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  Star, 
  Search, 
  MessageSquare, 
  Ban, 
  ChevronDown, 
  MoreVertical, 
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { Order, Product } from '../types';
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
  avatar?: string;
  status: 'Active' | 'Blocked';
  serialNumber: number;
}

interface AdminCustomersReviewProps {
  orders: Order[];
  products?: Product[];
}

const AdminCustomersReview: React.FC<AdminCustomersReviewProps> = ({ orders, products = [] }) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [customerSortBy, setCustomerSortBy] = useState('Newest');
  const [reviewSortBy, setReviewSortBy] = useState('Newest');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [tagFilter, setTagFilter] = useState('10 Tags');
  const [categorySearch, setCategorySearch] = useState('');

  // Sample reviews data
  const [reviews] = useState<ReviewItem[]>([
    {
      id: '1',
      customer: 'Imam Hoshen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 5,
      headline: 'Great product!',
      message: 'Amazing quality',
      product: 'Product 1',
      date: '2024-01-15',
      status: 'published'
    },
    {
      id: '2',
      customer: 'Imam Hoshen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 5,
      headline: 'Excellent!',
      message: 'Very satisfied',
      product: 'Product 2',
      date: '2024-01-14',
      status: 'published'
    },
    {
      id: '3',
      customer: 'Imam Hoshen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 3,
      headline: 'Good',
      message: 'Decent product',
      product: 'Product 3',
      date: '2024-01-13',
      status: 'pending'
    },
    {
      id: '4',
      customer: 'Imam Hoshen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 1,
      headline: 'Not satisfied',
      message: 'Could be better',
      product: 'Product 4',
      date: '2024-01-12',
      status: 'flagged'
    }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Extract unique customers from orders
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerInfo>();
    let serialCounter = 100;
    
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
          name: order.customerName || order.name || 'Imam Hoshen Ornob',
          phone: phone,
          email: order.customerEmail || order.email || 'ornob423@gmail.com',
          address: order.customerAddress || order.address || '',
          totalOrders: 1,
          totalSpent: orderTotal,
          lastOrderDate: orderDate,
          firstOrderDate: orderDate,
          avgOrderValue: orderTotal,
          orders: [order],
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          status: 'Active',
          serialNumber: serialCounter++
        });
      }
    });
    
    // If no orders, add sample data
    if (customerMap.size === 0) {
      for (let i = 0; i < 4; i++) {
        customerMap.set(`sample-${i}`, {
          id: `sample-${i}`,
          name: 'Imam Hoshen Ornob',
          phone: '01612-654654',
          email: 'ornob423@gmail.com',
          address: '',
          totalOrders: 1,
          totalSpent: 0,
          lastOrderDate: new Date().toISOString(),
          firstOrderDate: new Date().toISOString(),
          avgOrderValue: 0,
          orders: [],
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          status: 'Active',
          serialNumber: 100
        });
      }
    }
    
    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Customer stats
  const customerStats = useMemo(() => {
    const totalCustomers = customers.length || 45;
    const totalReviews = reviews.length || 45;
    const repeatCustomers = customers.filter(c => c.totalOrders > 1).length || 45;
    const blockedCustomers = customers.filter(c => c.status === 'Blocked').length || 45;
    
    return { totalCustomers, totalReviews, repeatCustomers, blockedCustomers };
  }, [customers, reviews]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews;
  }, [reviews]);

  const handleSelectAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAllReviews = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id));
    }
  };

  const handleSelectReview = (id: string) => {
    setSelectedReviews(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const getRatingBadgeStyle = (rating: number) => {
    if (rating >= 4) return 'bg-emerald-100 text-emerald-600';
    if (rating >= 3) return 'bg-orange-100 text-orange-600';
    return 'bg-red-100 text-red-600';
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F8F9FB] min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          <span className="text-gray-800">Customers</span>{' '}
          <span className="text-cyan-500">Review</span>
        </h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Category */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search Category"
              className="pl-10 pr-20 py-2.5 w-56 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 text-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-white text-gray-600 text-sm font-medium border-l border-gray-200 hover:text-gray-800">
              Search
            </button>
          </div>
          
          {/* All Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-100 cursor-pointer"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Tags Dropdown */}
          <div className="relative">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-100 cursor-pointer"
            >
              <option>10 Tags</option>
              <option>5 Tags</option>
              <option>20 Tags</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Add Customer Button */}
          <button className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition shadow-sm">
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600">Customer</p>
                <p className="mt-2 text-4xl font-bold text-gray-800">{customerStats.totalCustomers}</p>
                <p className="text-xs text-gray-400 mt-1">Total user</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Users size={24} className="text-cyan-500" />
              </div>
            </div>
          </div>

          {/* Review Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Review</p>
                <p className="mt-2 text-4xl font-bold text-gray-800">{customerStats.totalReviews}</p>
                <p className="text-xs text-gray-400 mt-1">Consumers review</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star size={24} className="text-amber-500 fill-amber-500" />
              </div>
            </div>
          </div>

          {/* Recurring Customers Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recurring customers</p>
                <p className="mt-2 text-4xl font-bold text-gray-800">{customerStats.repeatCustomers}</p>
                <p className="text-xs text-gray-400 mt-1">Repeat customers</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center">
                <MessageSquare size={24} className="text-cyan-500" />
              </div>
            </div>
          </div>

          {/* Blocked Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blocked</p>
                <p className="mt-2 text-4xl font-bold text-gray-800">{customerStats.blockedCustomers}</p>
                <p className="text-xs text-gray-400 mt-1">Blocked users</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Ban size={24} className="text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Customers Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search Customers"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 text-sm"
                />
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Search
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by</span>
                <div className="relative">
                  <select
                    value={customerSortBy}
                    onChange={(e) => setCustomerSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option>Newest</option>
                    <option>Oldest</option>
                    <option>Name</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <SlidersHorizontal size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cyan-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={handleSelectAllCustomers}
                      className="w-4 h-4 rounded border-white/30 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">SI</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Image</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Contact</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Users size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-medium">No customers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-600">{customer.serialNumber}</td>
                      <td className="px-3 py-3">
                        <img 
                          src={customer.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'} 
                          alt={customer.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-800">{customer.name}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <p className="text-gray-700">{customer.phone}</p>
                        <p className="text-xs text-gray-400">{customer.email}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                          <MoreVertical size={18} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Review</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by</span>
                  <div className="relative">
                    <select
                      value={reviewSortBy}
                      onChange={(e) => setReviewSortBy(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                    >
                      <option>Newest</option>
                      <option>Oldest</option>
                      <option>Rating</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  <SlidersHorizontal size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cyan-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0}
                      onChange={handleSelectAllReviews}
                      className="w-4 h-4 rounded border-white/30 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">SI</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Image</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Star</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <Star size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-medium">No reviews found</p>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review, index) => (
                    <tr key={review.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => handleSelectReview(review.id)}
                          className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-600">{100 + index}</td>
                      <td className="px-3 py-3">
                        <img 
                          src={review.avatar} 
                          alt={review.customer}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-800">{review.customer}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRatingBadgeStyle(review.rating)}`}>
                          {review.rating}
                          <Star size={12} className="fill-current" />
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                          <MoreVertical size={18} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomersReview;
