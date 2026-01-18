import React, { useState, useEffect } from 'react';
import { Star, Send, User, CheckCircle, X, ThumbsUp, MessageCircle, Award } from 'lucide-react';
import { DataService } from '../../services/DataService';
import toast from 'react-hot-toast';

interface Review {
  id: number;
  productId: number;
  rating: number;
  comment: string;
  headline?: string;
  userName: string;
  isVerifiedPurchase?: boolean;
  status: 'pending' | 'published' | 'rejected';
  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
}

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

  // Responsive star sizes using CSS classes for different breakpoints
  const renderStars = (currentRating: number, onRate?: (r: number) => void, onHover?: (r: number) => void, size: 'sm' | 'md' | 'lg' = 'md') => {
    const displayRating = onHover && hoverRating > 0 ? hoverRating : currentRating;
    // Responsive size classes: mobile first, then desktop override
    const sizeClasses = { 
      sm: 'w-3 h-3 sm:w-3.5 sm:h-3.5', 
      md: 'w-4 h-4 sm:w-5 sm:h-5', 
      lg: 'w-6 h-6 sm:w-8 sm:h-8' 
    };

    return (
      <div className="flex gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate?.(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
            onTouchStart={() => onRate?.(star)}
            className={`transition-all duration-200 touch-manipulation p-0.5 sm:p-1 ${onRate ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
            disabled={!onRate}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`${sizeClasses[size]} transition-colors ${star <= displayRating
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
                }`}
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

  const ratingCounts = {
    5: publishedReviews.filter(r => r.rating === 5).length,
    4: publishedReviews.filter(r => r.rating === 4).length,
    3: publishedReviews.filter(r => r.rating === 3).length,
    2: publishedReviews.filter(r => r.rating === 2).length,
    1: publishedReviews.filter(r => r.rating === 1).length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Rating Summary - Responsive for all devices */}
      {publishedReviews.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-100">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Average Rating - Centered on mobile, left-aligned on larger screens */}
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">{averageRating}</div>
              <div className="mt-1 sm:mt-2 flex justify-center sm:justify-start">{renderStars(parseFloat(averageRating), undefined, undefined, 'md')}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{publishedReviews.length} review{publishedReviews.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Rating Breakdown - Full width on all devices */}
            <div className="flex-1 space-y-1.5 sm:space-y-2 w-full">
              {[5, 4, 3, 2, 1].map((num) => {
                const count = ratingCounts[num as keyof typeof ratingCounts];
                const percentage = publishedReviews.length > 0 ? (count / publishedReviews.length) * 100 : 0;
                return (
                  <div key={num} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 w-3 flex-shrink-0">{num}</span>
                    <Star size={12} className="fill-amber-400 text-amber-400 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                    <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden min-w-0">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 w-6 sm:w-8 text-right flex-shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form - Responsive with improved mobile UX */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-lg space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Share Your Experience</h3>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close review form"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Rating Selection - Larger touch targets on mobile */}
          <div className="text-center py-3 sm:py-4 bg-gray-50 rounded-lg sm:rounded-xl">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Rate this product</p>
            <div className="flex justify-center">
              {renderStars(rating, setRating, setHoverRating, 'lg')}
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-700 mt-2">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </p>
          </div>

          {/* Headline - Mobile optimized input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Review Title (optional)
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Summarize your experience..."
              maxLength={100}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[16px] sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all touch-manipulation"
            />
          </div>

          {/* Comment - Mobile optimized textarea */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product... What did you like? Would you recommend it?"
              rows={4}
              minLength={10}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[16px] sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all touch-manipulation"
            />
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
          </div>

          {/* Submit Button - Full width with proper touch target */}
          <button
            type="submit"
            disabled={submitting || comment.length < 10}
            className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] touch-manipulation min-h-[48px]"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                Submit Review
              </>
            )}
          </button>
        </form>
      )}

      {/* Reviews List - Responsive layout */}
      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : publishedReviews.length === 0 ? (
        <div className="text-center py-10 sm:py-16 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner">
            <Star size={32} className="text-gray-400 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">No reviews yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-sm mx-auto leading-relaxed">
            Be the first to share your thoughts about this product and help others make informed decisions.
          </p>
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
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-500 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl hover:bg-emerald-600 transition-all shadow-lg active:scale-[0.98] touch-manipulation min-h-[44px]"
            >
              <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {publishedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar - Responsive sizing */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0 shadow-md">
                  {review.userName?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header - Mobile optimized layout */}
                  <div className="flex flex-col xs:flex-row xs:flex-wrap items-start xs:items-center gap-1 xs:gap-2 mb-1.5 sm:mb-2">
                    <span className="font-bold text-sm sm:text-base text-gray-900 truncate max-w-full">{review.userName}</span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        <CheckCircle size={10} className="sm:w-3 sm:h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Rating & Date - Responsive layout */}
                  <div className="flex flex-col xs:flex-row xs:flex-wrap items-start xs:items-center gap-1.5 xs:gap-3 mb-2 sm:mb-3">
                    {renderStars(review.rating, undefined, undefined, 'sm')}
                    <span className="text-[11px] sm:text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Headline */}
                  {review.headline && (
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">{review.headline}</h4>
                  )}

                  {/* Comment - Responsive text */}
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed line-clamp-4 sm:line-clamp-none">{review.comment}</p>

                  {/* Store Reply - Responsive layout */}
                  {review.reply && (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl border-l-4 border-emerald-500">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Award size={12} className="sm:w-[14px] sm:h-[14px]" />
                        </div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                          Response from {review.repliedBy || 'Store'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 ml-7 sm:ml-8 leading-relaxed">{review.reply}</p>
                      {review.repliedAt && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 ml-7 sm:ml-8">
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
          
          {/* Write Review Button - Shown at bottom of reviews list on mobile */}
          {!showReviewForm && (
            <div className="pt-2 sm:pt-4">
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please login to write a review');
                    onLoginClick();
                    return;
                  }
                  setShowReviewForm(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg active:scale-[0.98] touch-manipulation min-h-[44px]"
              >
                <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                Write a Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
