import React, { useMemo, useState, useEffect } from 'react';
import { MessageCircle, Star, Filter, Flag, CheckCircle, Send, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../services/authService';

type ReviewStatus = 'approved' | 'pending' | 'rejected';

type ReviewItem = {
  _id: string;
  productId: number;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  headline?: string;
  comment: string;
  verified: boolean;
  helpful: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

// Get API URL
const getApiUrl = (): string => {
  if (typeof window === 'undefined') return 'https://systemnextit.com/api';
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    return 'http://localhost:5001/api';
  }
  const parts = hostname.split('.');
  const mainDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  return `${protocol}//${mainDomain}/api`;
};

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ReviewStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const API_URL = getApiUrl();
        const statusParam = filter !== 'all' ? `&status=${filter}` : '';
        const response = await fetch(
          `${API_URL}/reviews/admin/all?page=${currentPage}&limit=50${statusParam}`,
          {
            headers: getAuthHeader()
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setTotalPages(data.pagination?.pages || 1);
          if (data.reviews?.length > 0 && !selectedId) {
            setSelectedId(data.reviews[0]._id);
          }
        } else {
          toast.error('Failed to load reviews');
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Error loading reviews');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [filter, currentPage]);

  const stats = useMemo(() => {
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;
    const avgRating = reviews.length
      ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    return { approved, pending, rejected, avgRating };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesFilter = filter === 'all' || review.status === filter;
      if (!matchesFilter) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        review.userName.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query) ||
        (review.headline && review.headline.toLowerCase().includes(query))
      );
    });
  }, [reviews, search, filter]);

  const selectedReview = reviews.find((review) => review._id === selectedId) || filteredReviews[0] || null;

  const handleStatusChange = async (id: string, status: ReviewStatus) => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setReviews((prev) => prev.map((review) => (review._id === id ? { ...review, status } : review)));
        toast.success(`Review ${status}`);
      } else {
        toast.error('Failed to update review status');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Error updating review');
    }
  };

  const handleRatingAdjust = async (id: string, value: number) => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ rating: value })
      });

      if (response.ok) {
        setReviews((prev) => prev.map((review) => (review._id === id ? { ...review, rating: value } : review)));
        toast.success('Rating updated');
      } else {
        toast.error('Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Error updating rating');
    }
  };

  const handleSaveReply = () => {
    if (!selectedReview) return;
    const trimmed = replyDraft.trim();
    if (!trimmed) {
      toast.error('Please enter a reply');
      return;
    }
    // Auto-approve when replying
    handleStatusChange(selectedReview._id, 'approved');
    toast.success('Reply saved and review approved');
    setReplyDraft('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const StarRow = ({ value, interactive, onChange }: { value: number; interactive?: boolean; onChange?: (next: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          className={`p-0.5 ${interactive ? 'hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onChange?.(index)}
        >
          <Star size={16} className={index <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>
          <p className="text-sm text-gray-500">Monitor sentiment, respond faster, and keep your store voice consistent.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <MessageCircle size={16} className="text-violet-500" />
          <span className="font-semibold text-gray-600">Public rating {stats.avgRating}/5</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase text-gray-400">Approved</p>
          <p className="text-3xl font-black text-gray-900">{stats.approved}</p>
          <p className="text-xs text-gray-500 mt-1">Live on storefront</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase text-gray-400">Pending</p>
          <p className="text-3xl font-black text-amber-500">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Waiting for moderation</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase text-gray-400">Rejected</p>
          <p className="text-3xl font-black text-rose-500">{stats.rejected}</p>
          <p className="text-xs text-gray-500 mt-1">Need attention</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase text-gray-400">Average rating</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{stats.avgRating}</span>
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Based on {reviews.length} submissions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search name, product or keyword"
                className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              {['all', 'approved', 'pending', 'rejected'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item as 'all' | ReviewStatus)}
                  className={`px-4 py-2 rounded-xl border transition ${filter === item ? 'bg-violet-600 text-white border-violet-600' : 'text-gray-600 border-gray-200 hover:border-gray-300'}`}
                >
                  {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <Loader2 className="inline-block animate-spin text-violet-500" size={24} />
                        <p className="text-sm text-gray-500 mt-2">Loading reviews...</p>
                      </td>
                    </tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-500">No reviews match the current filters.</td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr key={review._id} className={`cursor-pointer hover:bg-gray-50 ${selectedReview?._id === review._id ? 'bg-violet-50/60' : ''}`} onClick={() => { setSelectedId(review._id); setReplyDraft(''); }}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{review.userName}</div>
                          <div className="text-xs text-gray-400">{formatDate(review.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">Product #{review.productId}</td>
                        <td className="px-4 py-3">
                          <StarRow value={review.rating} interactive onChange={(value) => handleRatingAdjust(review._id, value)} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              review.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : review.status === 'pending'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}
                          >
                            {review.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); handleStatusChange(review._id, 'approved'); }}
                              className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                            >
                              <CheckCircle size={12} className="inline mr-1" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); handleStatusChange(review._id, 'rejected'); }}
                              className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100"
                            >
                              <Flag size={12} className="inline mr-1" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-white to-violet-50/30 shadow-sm">
            {selectedReview ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedReview.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedReview.userName}</p>
                    <p className="text-xs text-gray-400">Product #{selectedReview.productId}</p>
                  </div>
                </div>
                <div>
                  {selectedReview.headline && (
                    <h4 className="font-semibold text-gray-800">{selectedReview.headline}</h4>
                  )}
                  <p className="text-sm text-gray-600 mt-1">{selectedReview.comment}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400 mb-1">Current rating</p>
                  <StarRow value={selectedReview.rating} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase text-gray-400">Reply</p>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl text-sm p-3 h-28 focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                    placeholder="Write a personalized reply to this customer"
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveReply}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-violet-200 hover:bg-violet-700"
                    >
                      <Send size={14} /> Send reply
                    </button>
                    <button
                      type="button"
                      onClick={() => selectedReview && handleStatusChange(selectedReview._id, 'pending')}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600"
                    >
                      Mark pending
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-10">Select a review to manage replies.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
