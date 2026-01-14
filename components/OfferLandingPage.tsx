import React, { useState, useEffect } from 'react';
import {
  Clock,
  Gift,
  CheckCircle2,
  ShoppingCart,
  Phone,
  MapPin,
  User,
  Minus,
  Plus,
  Star,
  Shield,
  Truck,
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface OfferPageBenefit {
  id: string;
  text: string;
  icon?: string;
}

interface OfferPageData {
  _id: string;
  productTitle: string;
  productId?: string;
  searchQuery?: string;
  imageUrl: string;
  offerEndDate: string;
  description: string;
  productOfferInfo: string;
  paymentSectionTitle: string;
  benefits: OfferPageBenefit[];
  whyBuySection: string;
  urlSlug: string;
  status: 'draft' | 'published' | 'archived';
  views?: number;
  orders?: number;
  price?: number;
  originalPrice?: number;
}

interface OfferLandingPageProps {
  offerPage: OfferPageData;
  onOrder?: (data: {
    name: string;
    phone: string;
    address: string;
    quantity: number;
    offerPageId: string;
  }) => Promise<void>;
  tenantSubdomain?: string;
  websiteConfig?: {
    websiteName?: string;
    whatsappNumber?: string;
    phones?: string[];
  };
}

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return (
      <div className="bg-red-500 text-white py-3 px-6 rounded-xl text-center">
        <p className="font-bold text-lg">This offer has expired!</p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white text-gray-900 rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
        <span className="text-2xl sm:text-3xl font-bold">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-white text-xs sm:text-sm mt-2 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-red-600 to-pink-600 py-6 px-4 rounded-2xl">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="text-white" size={24} />
        <p className="text-white font-bold text-lg">Offer Ends In:</p>
      </div>
      <div className="flex justify-center gap-3 sm:gap-4">
        <TimeBlock value={timeLeft.days} label="Days" />
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <TimeBlock value={timeLeft.minutes} label="Minutes" />
        <TimeBlock value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
};

const OrderForm: React.FC<{
  offerPageId: string;
  productTitle: string;
  price?: number;
  originalPrice?: number;
  onSubmit: (data: { name: string; phone: string; address: string; quantity: number; offerPageId: string; }) => Promise<void>;
}> = ({ offerPageId, price, originalPrice, onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      setErrorMessage('Please fill in all fields');
      setSubmitStatus('error');
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      await onSubmit({ ...formData, quantity, offerPageId });
      setSubmitStatus('success');
      setFormData({ name: '', phone: '', address: '' });
      setQuantity(1);
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = price ? price * quantity : 0;
  const totalOriginalPrice = originalPrice ? originalPrice * quantity : 0;
  const savings = totalOriginalPrice - totalPrice;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-purple-500 transition-colors">
              <Minus size={18} />
            </button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-purple-500 transition-colors">
              <Plus size={18} />
            </button>
          </div>
          {price && (
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">৳{totalPrice.toLocaleString()}</p>
              {savings > 0 && <p className="text-sm text-green-600">Save ৳{savings.toLocaleString()}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors" />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors" />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
          <textarea placeholder="Delivery Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none" />
        </div>
      </div>
      {submitStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl">
          <CheckCircle2 size={20} />
          <p>Order placed successfully! We will contact you soon.</p>
        </div>
      )}
      {submitStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl">
          <AlertCircle size={20} />
          <p>{errorMessage}</p>
        </div>
      )}
      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
        {isSubmitting ? (<><Loader2 className="animate-spin" size={24} />Processing...</>) : (<><ShoppingCart size={24} />Order Now</>)}
      </button>
      <div className="flex items-center justify-center gap-6 pt-4">
        <div className="flex items-center gap-1 text-gray-500 text-sm"><Shield size={16} /><span>Secure</span></div>
        <div className="flex items-center gap-1 text-gray-500 text-sm"><Truck size={16} /><span>Fast Delivery</span></div>
        <div className="flex items-center gap-1 text-gray-500 text-sm"><CreditCard size={16} /><span>Cash on Delivery</span></div>
      </div>
    </form>
  );
};

export const OfferLandingPage: React.FC<OfferLandingPageProps> = ({ offerPage, onOrder, websiteConfig }) => {
  const handleOrder = async (data: { name: string; phone: string; address: string; quantity: number; offerPageId: string; }) => {
    if (onOrder) await onOrder(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative">
        <div className="w-full h-[350px] overflow-hidden">
          <img src={offerPage.imageUrl} alt={offerPage.productTitle} className="w-full h-full object-cover" style={{ maxWidth: '950px', margin: '0 auto', display: 'block' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">{offerPage.productTitle}</h1>
          {offerPage.description && <p className="text-white/90 text-lg max-w-2xl mx-auto">{offerPage.description}</p>}
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 -mt-6 relative z-10">
        <CountdownTimer endDate={offerPage.offerEndDate} />
      </section>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {offerPage.productOfferInfo && (
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Gift className="text-purple-600" />Special Offer Details</h2>
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: offerPage.productOfferInfo }} />
              </section>
            )}
            {offerPage.benefits && offerPage.benefits.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Star className="text-yellow-500" />Key Benefits</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {offerPage.benefits.map((benefit, index) => (
                    <div key={benefit.id || index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><CheckCircle2 className="text-white" size={18} /></div>
                      <p className="text-gray-700 font-medium">{benefit.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {offerPage.whyBuySection && (
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose This Product?</h2>
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: offerPage.whyBuySection }} />
              </section>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-4">
              {offerPage.paymentSectionTitle && <div className="mb-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: offerPage.paymentSectionTitle }} />}
              {!offerPage.paymentSectionTitle && <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Place Your Order Now</h3>}
              <OrderForm offerPageId={offerPage._id} productTitle={offerPage.productTitle} price={offerPage.price} originalPrice={offerPage.originalPrice} onSubmit={handleOrder} />
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} {websiteConfig?.websiteName || 'Store'}. All rights reserved.</p>
          {websiteConfig?.whatsappNumber && <p className="mt-2 text-gray-400">Contact: {websiteConfig.whatsappNumber}</p>}
        </div>
      </footer>
    </div>
  );
};

export default OfferLandingPage;
