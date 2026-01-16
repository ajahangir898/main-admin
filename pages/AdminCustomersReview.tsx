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
  SlidersHorizontal,
  UserPlus,
  RefreshCw
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
    if (rating >= 4) return { bg: 'bg-sky-100', text: 'text-sky-400', starBg: 'bg-gradient-to-r from-sky-400 to-blue-500' };
    if (rating >= 3) return { bg: 'bg-red-200', text: 'text-orange-500', starBg: 'bg-orange-500' };
    return { bg: 'bg-rose-200', text: 'text-red-700', starBg: 'bg-red-700' };
  };

  return (
    <div className="space-y-6 animate-fade-in bg-stone-50 min-h-screen font-['Poppins']">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl font-bold text-teal-950 tracking-tight font-['Lato']">
          Customers  Review
        </h1>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Category */}
          <div className="relative w-72 h-8 bg-zinc-100 rounded-lg overflow-hidden">
            <div className="w-6 h-6 absolute left-2 top-1 flex items-center justify-center">
              <Search size={16} className="text-black" />
            </div>
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search Category"
              className="w-full h-full pl-11 pr-16 bg-transparent text-xs font-normal text-black placeholder:text-neutral-500 focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-xs font-normal text-black">Search</span>
          </div>
          
          {/* All Status Dropdown */}
          <div className="px-1.5 py-2 bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-transparent text-xs font-normal text-black focus:outline-none cursor-pointer pr-4"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
            <ChevronDown size={16} className="text-black -ml-2" />
          </div>
          
          {/* Tags Dropdown */}
          <div className="px-1.5 py-2 bg-zinc-100 rounded-lg flex items-center gap-2 cursor-pointer">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="appearance-none bg-transparent text-xs font-normal text-black focus:outline-none cursor-pointer pr-4"
            >
              <option>10 Tags</option>
              <option>5 Tags</option>
              <option>20 Tags</option>
            </select>
            <ChevronDown size={16} className="text-black -ml-2" />
          </div>
          
          {/* Add Customer Button */}
          <button className="w-36 h-12 pl-3 pr-4 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition">
            <UserPlus size={20} className="text-white" />
            <span className="text-white text-base font-bold font-['Lato']">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="flex flex-wrap gap-4">
          {/* Customer Card */}
          <div className="w-64 px-4 py-3.5 bg-sky-50 rounded-lg">
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-2">
                <span className="text-black text-base font-medium">Customer</span>
                <div className="flex flex-col">
                  <span className="text-black text-2xl font-medium">{customerStats.totalCustomers}</span>
                  <span className="text-neutral-400 text-xs font-medium">Total user</span>
                </div>
              </div>
              <div className="w-11 h-11 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Review Card */}
          <div className="w-64 px-4 py-3.5 bg-orange-50 rounded-lg">
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-2">
                <span className="text-black text-base font-medium">Review</span>
                <div className="flex flex-col">
                  <span className="text-black text-2xl font-medium">{customerStats.totalReviews}</span>
                  <span className="text-neutral-400 text-xs font-medium">Consumers review</span>
                </div>
              </div>
              <div className="w-11 h-11 bg-gradient-to-b from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <Star size={24} className="text-white" fill="white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Recurring Customers Card */}
          <div className="w-64 px-4 py-3.5 bg-green-50 rounded-lg">
            <div className="flex flex-col gap-2.5">
              <span className="text-black text-base font-medium">Recurring customers</span>
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-black text-2xl font-medium">{customerStats.repeatCustomers}</span>
                  <span className="text-neutral-400 text-xs font-medium">Repeat customers</span>
                </div>
                <div className="w-11 h-11 bg-green-900 rounded-lg flex items-center justify-center">
                  <RefreshCw size={24} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Card */}
          <div className="w-64 px-4 py-3.5 bg-rose-50 rounded-lg">
            <div className="flex flex-col gap-2.5">
              <span className="text-black text-base font-medium">Blocked</span>
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-black text-2xl font-medium">{customerStats.blockedCustomers}</span>
                  <span className="text-neutral-400 text-xs font-medium">Blocked users</span>
                </div>
                <div className="w-11 h-11 bg-red-700 rounded-lg flex items-center justify-center">
                  <Ban size={24} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tables Section */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Customers Table */}
        <div className="flex-1 bg-white overflow-hidden">
          {/* Table Header */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-10 mb-4">
            <div className="relative w-96 h-8 bg-zinc-100 rounded-lg overflow-hidden">
              <div className="w-6 h-6 absolute left-2 top-1 flex items-center justify-center">
                <Search size={16} className="text-black" />
              </div>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search Customers"
                className="w-full h-full pl-11 pr-16 bg-transparent text-xs font-normal text-black placeholder:text-neutral-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2 text-xs font-normal text-black">Search</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 text-xs font-normal">Sort by</span>
                <div className="px-1.5 py-2 bg-zinc-100 rounded-lg flex items-center gap-2">
                  <select
                    value={customerSortBy}
                    onChange={(e) => setCustomerSortBy(e.target.value)}
                    className="appearance-none bg-transparent text-xs font-normal text-black focus:outline-none cursor-pointer pr-4"
                  >
                    <option>Newest</option>
                    <option>Oldest</option>
                    <option>Name</option>
                  </select>
                  <ChevronDown size={16} className="text-black -ml-2" />
                </div>
              </div>
              <button className="w-8 h-8 p-2.5 bg-zinc-100 rounded flex items-center justify-center hover:bg-zinc-200 transition">
                <SlidersHorizontal size={20} className="text-black" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-b from-sky-400/25 to-blue-500/25 h-12">
                  <th className="px-5 py-3 text-left">
                    <div className="w-6 h-6 rounded border-2 border-slate-900/75 cursor-pointer" 
                      onClick={handleSelectAllCustomers}
                    />
                  </th>
                  <th className="px-3 py-3 text-center">
                    <span className="text-stone-900 text-base font-medium">Sl</span>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <span className="text-black text-base font-medium">Image</span>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <span className="text-black text-base font-medium">Name</span>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <span className="text-black text-base font-medium">Contact</span>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <span className="text-black text-base font-medium">Status</span>
                  </th>
                  <th className="px-3 py-3 text-center">
                    <span className="text-black text-base font-medium">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Users size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-medium">No customers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="h-16 border-b border-zinc-400/50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <div 
                          className={`w-6 h-6 rounded border-2 border-slate-900/75 cursor-pointer flex items-center justify-center ${selectedCustomers.includes(customer.id) ? 'bg-sky-400' : ''}`}
                          onClick={() => handleSelectCustomer(customer.id)}
                        >
                          {selectedCustomers.includes(customer.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-stone-900 text-xs font-normal">{customer.serialNumber}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg overflow-hidden">
                          <img 
                            src={customer.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}
                            alt={customer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-stone-900 text-xs font-normal">{customer.name}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="text-stone-900 text-xs font-normal">{customer.phone}</span>
                          <span className="text-stone-900 text-xs font-normal">{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-[30px] text-xs font-medium ${
                          customer.status === 'Active' 
                            ? 'bg-green-200 text-green-900' 
                            : 'bg-red-200 text-red-700'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition">
                          <MoreVertical size={18} className="text-black" />
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
        <div className="w-full xl:w-96 px-4 py-3.5 bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col gap-2.5 overflow-hidden">
          {/* Table Header */}
          <div className="flex justify-between items-start">
            <span className="text-black text-base font-medium">Review</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 text-xs font-normal">Sort by</span>
                <div className="px-1.5 py-2 bg-zinc-100 rounded-lg flex items-center gap-2">
                  <select
                    value={reviewSortBy}
                    onChange={(e) => setReviewSortBy(e.target.value)}
                    className="appearance-none bg-transparent text-xs font-normal text-black focus:outline-none cursor-pointer pr-4"
                  >
                    <option>Newest</option>
                    <option>Oldest</option>
                    <option>Rating</option>
                  </select>
                  <ChevronDown size={16} className="text-black -ml-2" />
                </div>
              </div>
              <button className="w-8 h-8 p-2.5 bg-zinc-100 rounded flex items-center justify-center hover:bg-zinc-200 transition">
                <SlidersHorizontal size={20} className="text-black" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-b from-sky-400/25 to-blue-500/25 h-12">
                  <th className="px-5 py-3 text-left">
                    <div className="w-6 h-6 rounded border-2 border-slate-900/75 cursor-pointer"
                      onClick={handleSelectAllReviews}
                    />
                  </th>
                  <th className="px-2 py-3 text-center">
                    <span className="text-stone-900 text-base font-medium">Sl</span>
                  </th>
                  <th className="px-2 py-3 text-left">
                    <span className="text-black text-base font-medium">Image</span>
                  </th>
                  <th className="px-2 py-3 text-left">
                    <span className="text-black text-base font-medium">Name</span>
                  </th>
                  <th className="px-2 py-3 text-left">
                    <span className="text-black text-base font-medium">Star</span>
                  </th>
                  <th className="px-2 py-3 text-center">
                    <span className="text-black text-base font-medium">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <Star size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-medium">No reviews found</p>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review, index) => {
                    const ratingStyle = getRatingBadgeStyle(review.rating);
                    return (
                      <tr key={review.id} className="h-16 border-b border-zinc-400/50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <div 
                            className={`w-6 h-6 rounded border-2 border-slate-900/75 cursor-pointer flex items-center justify-center ${selectedReviews.includes(review.id) ? 'bg-sky-400' : ''}`}
                            onClick={() => handleSelectReview(review.id)}
                          >
                            {selectedReviews.includes(review.id) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className="text-stone-900 text-xs font-normal">{100 + index}</span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg overflow-hidden">
                            <img 
                              src={review.avatar} 
                              alt={review.customer}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="text-stone-900 text-xs font-normal">{review.customer}</span>
                        </td>
                        <td className="px-2 py-3">
                          <div className={`w-16 px-2 py-0.5 ${ratingStyle.bg} rounded-[30px] flex items-center justify-center gap-0.5`}>
                            <span className={`${ratingStyle.text} text-xs font-medium`}>{review.rating}</span>
                            <div className="w-3.5 h-3.5 overflow-hidden">
                              <Star size={14} className={`${ratingStyle.starBg} rounded-sm`} fill="currentColor" />
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition">
                            <MoreVertical size={18} className="text-black" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
