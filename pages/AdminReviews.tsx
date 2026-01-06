import React, { useMemo, useState, useEffect } from 'react';
import { MessageCircle, Star, Filter, Flag, CheckCircle, Send, Edit3 } from 'lucide-react';

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

const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: 'R-98211',
    customer: 'Anika Rahman',
    avatar: 'https://i.pravatar.cc/120?img=32',
    rating: 5,
    headline: 'Lightning fast delivery',
    message: 'Ordered at night and had the phone within 36 hours. Packaging was premium and seal was intact.',
    product: 'iPhone 14 Pro Max 1TB',
    date: 'Dec 01, 2025',
    status: 'published',
    reply: 'Thanks Anika! Glad the express courier met expectations.',
  },
  {
    id: 'R-98202',
    customer: 'Fahim Reza',
    avatar: 'https://i.pravatar.cc/120?img=15',
    rating: 3,
    headline: 'Good product, slow courier',
    message: 'Gadget works perfectly but delivery partner rescheduled twice. Please fix courier coordination.',
    product: 'Logitech G Pro X Headset',
    date: 'Nov 29, 2025',
    status: 'pending',
  },
  {
    id: 'R-98144',
    customer: 'Sadia Tanjin',
    avatar: 'https://i.pravatar.cc/120?img=8',
    rating: 2,
    headline: 'Box slightly damaged',
    message: 'Device ok but retail box arrived dented. Need better bubble-wrap next time.',
    product: 'Xiaomi Smart Air Purifier 4',
    date: 'Nov 25, 2025',
    status: 'flagged',
  },
  {
    id: 'R-98092',
    customer: 'Mahin Khan',
    avatar: 'https://i.pravatar.cc/120?img=21',
    rating: 4,
    headline: 'Reliable as always',
    message: '3rd purchase from this store. Appreciate the free strap and quick response from support.',
    product: 'Apple Watch Ultra 2',
    date: 'Nov 22, 2025',
    status: 'published',
  },
];

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>(SAMPLE_REVIEWS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ReviewStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(SAMPLE_REVIEWS[0]?.id || null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const published = reviews.filter((r) => r.status === 'published').length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const flagged = reviews.filter((r) => r.status === 'flagged').length;
    const avgRating = reviews.length
      ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    return { published, pending, flagged, avgRating };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesFilter = filter === 'all' || review.status === filter;
      if (!matchesFilter) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        review.customer.toLowerCase().includes(query) ||
        review.product.toLowerCase().includes(query) ||
        review.message.toLowerCase().includes(query)
      );
    });
  }, [reviews, search, filter]);

  const selectedReview = reviews.find((review) => review.id === selectedId) || filteredReviews[0] || null;

  const handleStatusChange = (id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((review) => (review.id === id ? { ...review, status } : review)));
  };

  const handleRatingAdjust = (id: string, value: number) => {
    setReviews((prev) => prev.map((review) => (review.id === id ? { ...review, rating: value } : review)));
  };

  const handleSaveReply = () => {
    if (!selectedReview) return;
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    setReviews((prev) => prev.map((review) => (review.id === selectedReview.id ? { ...review, reply: trimmed, status: 'published' } : review)));
    setReplyDraft('');
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
          <p className="text-xs uppercase text-gray-400">Published</p>
          <p className="text-3xl font-black text-gray-900">{stats.published}</p>
          <p className="text-xs text-gray-500 mt-1">Live on storefront</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase text-gray-400">Pending</p>
          <p className="text-3xl font-black text-amber-500">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Waiting for moderation</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase text-gray-400">Flagged</p>
          <p className="text-3xl font-black text-rose-500">{stats.flagged}</p>
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
              {['all', 'published', 'pending', 'flagged'].map((item) => (
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
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className={`cursor-pointer hover:bg-gray-50 ${selectedReview?.id === review.id ? 'bg-violet-50/60' : ''}`} onClick={() => { setSelectedId(review.id); setReplyDraft(review.reply || ''); }}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{review.customer}</div>
                        <div className="text-xs text-gray-400">{review.date}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{review.product}</td>
                      <td className="px-4 py-3">
                        <StarRow value={review.rating} interactive onChange={(value) => handleRatingAdjust(review.id, value)} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            review.status === 'published'
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
                            onClick={(event) => { event.stopPropagation(); handleStatusChange(review.id, 'published'); }}
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                          >
                            <CheckCircle size={12} className="inline mr-1" /> Publish
                          </button>
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); handleStatusChange(review.id, 'flagged'); }}
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100"
                          >
                            <Flag size={12} className="inline mr-1" /> Flag
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReviews.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-500">No reviews match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-white to-violet-50/30 shadow-sm">
            {selectedReview ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src={selectedReview.avatar} alt={selectedReview.customer} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-gray-900">{selectedReview.customer}</p>
                    <p className="text-xs text-gray-400">{selectedReview.product}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{selectedReview.headline}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedReview.message}</p>
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
                      onClick={() => selectedReview && handleStatusChange(selectedReview.id, 'pending')}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600"
                    >
                      Mark pending
                    </button>
                  </div>
                  {selectedReview.reply && !replyDraft && (
                    <div className="p-3 text-xs rounded-xl bg-white/80 border border-gray-100 text-gray-600 flex items-start gap-2">
                      <Edit3 size={12} className="mt-0.5 text-violet-500" />
                      <span>{selectedReview.reply}</span>
                    </div>
                  )}
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
