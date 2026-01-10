import React, { useState } from 'react';
import { CheckCircle, Copy, Share2, Download, Package } from 'lucide-react';

interface OrderSuccessProps {
  orderId: string;
  orderTotal: number;
  customerName: string;
  estimatedDelivery?: string;
  referralCode?: string;
  onContinueShopping?: () => void;
  onTrackOrder?: (orderId: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessProps> = ({
  orderId,
  orderTotal,
  customerName,
  estimatedDelivery = '5-7 business days',
  referralCode,
  onContinueShopping,
  onTrackOrder
}) => {
  const [copied, setCopied] = useState(false);
  const generatedReferralCode = referralCode || `REF${orderId.slice(-6).toUpperCase()}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join me on this amazing store!',
      text: `Use my referral code ${generatedReferralCode} and get 10% off your first order!`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="enhanced-success-container">
        {/* Success Icon */}
        <div className="enhanced-success-icon">
          <CheckCircle size={48} />
        </div>

        {/* Success Message */}
        <h1 className="enhanced-success-title">Order Confirmed!</h1>
        <p className="enhanced-success-subtitle">
          Thank you for your purchase, {customerName}! Your order has been received.
        </p>

        {/* Order ID */}
        <div className="enhanced-success-order-id">
          <div className="text-sm text-gray-500 mb-1">Order Number</div>
          <strong>#{orderId}</strong>
        </div>

        {/* Order Details */}
        <div className="w-full bg-gray-50 rounded-xl p-6 mb-6 text-left">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Order Total</div>
              <div className="font-bold text-lg">৳{orderTotal.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Estimated Delivery</div>
              <div className="font-semibold">{estimatedDelivery}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mb-8">
          <button
            onClick={() => onTrackOrder?.(orderId)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            <Package size={20} />
            Track Order
          </button>
          <button
            onClick={onContinueShopping}
            className="flex-1 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>

        {/* Refer a Friend Widget */}
        <div className="enhanced-refer-widget">
          <h3 className="enhanced-refer-widget h3">🎁 Get ৳500 Credit!</h3>
          <p>Share your referral code with friends and earn ৳500 for each friend who makes their first purchase.</p>
          
          <div className="enhanced-refer-code">
            <input
              type="text"
              value={generatedReferralCode}
              readOnly
              className="enhanced-refer-code input"
            />
            <button
              onClick={handleCopyCode}
              className="enhanced-refer-copy-btn"
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="mt-4 flex items-center justify-center gap-2 w-full max-w-xs mx-auto px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            <Share2 size={20} />
            Share with Friends
          </button>

          <div className="mt-6 text-xs text-gray-500 text-center">
            Your friends get 10% off • You get ৳500 credit • Win-win! 🎉
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
          📧 A confirmation email has been sent to your registered email address with order details.
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
