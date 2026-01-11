import React, { useState, useEffect } from 'react';
import { Star, Send, User, CheckCircle, X } from 'lucide-react';
import { Review } from '../../types';
import { DataService } from '../../services/DataService';
import toast from 'react-hot-toast';

interface ProductReviewsProps {
  productId: number;
  productName: string;
  tenantId: string;
  user: { name: string; email: string } | null;
  onLoginClick: () => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
  tenantId,
  user,
  onLoginClick
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, [productId, tenantId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await DataService.getProductReviews(productId, tenantId);
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to write a review');
      onLoginClick();
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const newReview = await DataService.submitReview({
        productId,
        rating,
        comment: comment.trim(),
        headline: headline.trim() || undefined
      }, tenantId);

      // Add to reviews list
      setReviews(prev => [newReview, ...prev]);
      
      // Reset form
      setRating(5);
      setHeadline('');
      setComment('');
      setShowReviewForm(false);
      
      toast.success('Review submitted successfully! 🎉');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, onRate?: (r: number) => void, onHover?: (r: number) => void) => {
    const displayRating = onHover && hoverRating > 0 ? hoverRating : currentRating;
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate?.(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
            className={`transition-colors ${onRate ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!onRate}
          >
            <Star
              size={onRate ? 24 : 16}
              className={`${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } ${onRate ? 'hover:scale-110 transition-transform' : ''}`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const publishedReviews = reviews.filter(r => r.status === 'published');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {publishedReviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {renderStars(parseFloat(averageRating))}
              <span className="text-base sm:text-lg font-semibold text-gray-900">{averageRating}</span>
              <span className="text-sm text-gray-500">({publishedReviews.length} {publishedReviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>
        
        {!showReviewForm && (
          <button
            onClick={() => {
              if (!user) {
                toast.error('Please login to write a review');
                onLoginClick();
                return;
              }
              setShowReviewForm(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Send size={18} />
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && user && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Write Your Review</h3>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                {renderStars(rating, setRating, setHoverRating)}
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Sum up your experience in a few words..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base"
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your detailed experience with this product. What did you like? What could be improved?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none text-sm sm:text-base"
                rows={5}
                required
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Minimum 10 characters
                </p>
                <p className="text-xs text-gray-500">
                  {comment.length}/500
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !comment.trim() || comment.trim().length < 10}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-base"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : publishedReviews.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={32} className="text-emerald-500" />
          </div>
          <p className="text-gray-700 font-medium mb-2">No reviews yet</p>
          <p className="text-sm text-gray-500">Be the first to share your thoughts about this product!</p>
          {!showReviewForm && !user && (
            <button
              onClick={onLoginClick}
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm underline"
            >
              Login to write a review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {publishedReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 shadow-md">
                  {review.userName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{review.userName}</span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle size={12} />
                        Verified
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-xs sm:text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {review.headline && (
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{review.headline}</h4>
                  )}
                  
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">{review.comment}</p>
                  
                  {review.reply && (
                    <div className="mt-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-emerald-50 rounded-lg border-l-4 border-emerald-500 shadow-sm">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
                        <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </span>
                        Response from {review.repliedBy || 'Store'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-700 ml-7">{review.reply}</p>
                      {review.repliedAt && (
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                          {new Date(review.repliedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
