
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Product, User, WebsiteConfig, ProductVariantSelection, DeliveryConfig, Order } from '../types';

// Lazy load heavy layout components from individual files
const StoreHeader = lazy(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

// Skeleton loaders removed for faster initial render
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  Headphones,
  Lock,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface CheckoutProps {
  product: Product;
  quantity: number;
  variant: ProductVariantSelection;
  onBack: () => void;
  onConfirmOrder: (formData: any) => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  deliveryConfigs?: DeliveryConfig[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onImageSearchClick?: () => void;
  onOpenChat?: () => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  productCatalog?: Product[];
  orders?: Order[];
}

type CheckoutFormState = {
  fullName: string;
  phone: string;
  division: string;
  email: string;
  address: string;
  productDescription?: string;
  cardName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
};

const StoreCheckout = ({ 
  product, 
  quantity, 
  variant,
  onBack, 
  onConfirmOrder,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo,
  websiteConfig,
  deliveryConfigs,
  searchValue,
  onSearchChange,
  onImageSearchClick,
  onOpenChat,
  cart,
  onToggleCart,
  onCheckoutFromCart,
  productCatalog,
  orders = []
}: CheckoutProps) => {
  const [formData, setFormData] = useState<CheckoutFormState>({
    fullName: '',
    phone: '',
    division: '',
    email: '',
    address: '',
    productDescription: ''
  });
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'Regular' | 'Express' | 'Free'>('Regular');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [alertState, setAlertState] = useState<{ type: 'error' | 'success' | null; message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (deliveryConfigs && deliveryConfigs.length) {
      const firstEnabled = deliveryConfigs.find(c => c.isEnabled) || deliveryConfigs[0];
      if (firstEnabled) {
        setSelectedDeliveryType(firstEnabled.type);
      }
    }
  }, [deliveryConfigs]);

  // Pre-fill if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || ''
      }));
    }
  }, [user]);

  const subTotal = product.price * quantity;
  const discount = product.originalPrice ? (product.originalPrice - product.price) * quantity : 0;
  const activeConfig = deliveryConfigs?.find(c => c.type === selectedDeliveryType) || (deliveryConfigs && deliveryConfigs[0]);
  const computedDeliveryCharge = useMemo(() => {
    if (!activeConfig || !activeConfig.isEnabled) return 0;
    if (activeConfig.freeThreshold > 0 && subTotal >= activeConfig.freeThreshold) return 0;
    const division = formData.division || activeConfig.division;
    const isInside = division ? division === activeConfig.division : true;
    return isInside ? activeConfig.insideCharge : activeConfig.outsideCharge;
  }, [activeConfig, formData.division, subTotal]);
  const grandTotal = subTotal + computedDeliveryCharge;
  const formattedProductPrice = formatCurrency(product.price);
  const formattedProductOriginalPrice = formatCurrency(product.originalPrice, null);

  const progressSteps = useMemo(() => [
    { key: 'cart', label: 'Cart' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' }
  ], []);

  const validateField = useCallback((field: string, value: string) => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Please enter at least 3 characters';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^\+?\d{9,15}$/.test(value.trim())) return 'Enter a valid phone number';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(value.trim())) return 'Enter a valid email address';
        return '';
      case 'division':
        return value ? '' : 'Select a division';
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 10) return 'Provide a bit more detail';
        return '';
      case 'cardName':
        return value.trim() ? '' : 'Name on card is required';
      case 'cardNumber':
        if (!value.trim()) return 'Card number is required';
        if (!/^\d{16}$/.test(value.replace(/\s/g, ''))) return 'Enter a 16-digit card number';
        return '';
      case 'expiry':
        if (!value.trim()) return 'Expiry is required';
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value.trim())) return 'Use MM/YY format';
        return '';
      case 'cvv':
        if (!value.trim()) return 'CVV is required';
        if (!/^\d{3,4}$/.test(value.trim())) return 'Enter a valid CVV';
        return '';
      default:
        return '';
    }
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const message = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: message }));
  };

  const validateForm = () => {
    const fieldsToValidate = ['fullName', 'phone', 'email', 'division', 'address'];
    const messages: Record<string, string> = {};
    fieldsToValidate.forEach(field => {
      const value = (formData as Record<string, string>)[field] || '';
      messages[field] = validateField(field, value);
    });
    setFormErrors(prev => ({ ...prev, ...messages }));
    setTouchedFields(prev => ({ ...prev, ...fieldsToValidate.reduce((acc, key) => ({ ...acc, [key]: true }), {}) }));
    const hasErrors = Object.values(messages).some(Boolean);
    if (hasErrors) {
      setAlertState({ type: 'error', message: 'Please fix the highlighted fields before placing your order.' });
    }
    return !hasErrors;
  };

  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoStatus({ type: 'error', message: 'Enter a promo code first.' });
      return;
    }
    if (promoCode.trim().toLowerCase() === 'save10') {
      setPromoStatus({ type: 'success', message: 'Promo code applied! Discount will reflect at payment.' });
    } else {
      setPromoStatus({ type: 'error', message: 'Invalid promo code. Try another one.' });
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      setShowConfirmationModal(false);
      return;
    }

    onConfirmOrder({
      ...formData,
      amount: grandTotal,
      productName: product.name,
      quantity,
      variant,
      deliveryType: selectedDeliveryType,
      deliveryCharge: computedDeliveryCharge
    });
    setAlertState({ type: 'success', message: 'Order details captured successfully.' });
    setShowConfirmationModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <Suspense fallback={null}>
        <StoreHeader 
          onHomeClick={onBack}
          onImageSearchClick={onImageSearchClick}
          onTrackOrder={() => setIsTrackOrderOpen(true)}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          logo={logo}
          websiteConfig={websiteConfig}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          productCatalog={productCatalog}
        />
      </Suspense>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 top-16 z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Checkout</p>
              <h1 className="text-2xl font-bold text-gray-900">Complete your purchase</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setShowOfferModal(true)}
              >
                <Gift size={16} /> View offers
              </button>
              <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                <ShieldCheck size={18} /> 100% secure checkout
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col md:flex-row gap-4">
            {progressSteps.map((step, index) => {
              const active = index <= 2;
              const isCompleted = index < 2;
              return (
                <div key={step.key} className="flex-1 flex items-center gap-2 md:gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                      isCompleted 
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-md' 
                        : active 
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50 shadow-sm' 
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Step {index + 1}</p>
                    <p className={`text-sm font-semibold transition ${active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  </div>
                  {index < progressSteps.length - 1 && (
                    <div className={`hidden md:block flex-1 h-1 rounded-full transition ${isCompleted ? 'bg-emerald-500' : active ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8 shadow-lg">
          <div className="flex-1 space-y-8">
            {isLoading && (
              <div className="space-y-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
            )}
            {!isLoading && (
              <>
                {deliveryConfigs && deliveryConfigs.length > 0 && (
              <div className="store-card p-6 rounded-3xl border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Delivery Options</h2>
                  <span className="text-xs text-gray-500">Choose the best speed for you</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deliveryConfigs.map(config => {
                    const isActive = selectedDeliveryType === config.type;
                    return (
                      <button
                        key={config.type}
                        type="button"
                        onClick={() => setSelectedDeliveryType(config.type)}
                        className={`rounded-2xl border p-4 text-left transition flex flex-col gap-1 transform hover:scale-105 ${
                          isActive ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-gray-200 bg-white hover:shadow-lg'
                        } ${!config.isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={!config.isEnabled}
                      >
                        <p className="font-bold text-gray-800 flex items-center gap-2">
                          {config.type} Delivery
                          {isActive && <CheckCircle2 size={16} className="text-emerald-500" />}
                        </p>
                        <p className="text-xs text-gray-500">Inside city: ৳ {config.insideCharge}</p>
                        <p className="text-xs text-gray-500">Outside city: ৳ {config.outsideCharge}</p>
                        {config.freeThreshold > 0 && (
                          <p className="text-xs text-emerald-600 mt-1">Free over ৳ {config.freeThreshold}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
                {activeConfig && (
                  <p className="text-xs text-gray-500 mt-4">{activeConfig.note}</p>
                )}
              </div>
            )}

            <div className="store-card p-6 rounded-3xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Step 1</p>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Auto-fill</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">Full Name <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.fullName && touchedFields.fullName ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-emerald-500'}`} size={18} />
                    <input
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl transition-all duration-200 focus:outline-none text-gray-800 placeholder:text-gray-400 ${
                        formErrors.fullName && touchedFields.fullName 
                          ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100' 
                          : 'border-gray-200 bg-white hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
                      }`}
                      value={formData.fullName}
                      onChange={e => updateField('fullName', e.target.value)}
                      aria-invalid={!!(formErrors.fullName && touchedFields.fullName)}
                      aria-describedby={formErrors.fullName && touchedFields.fullName ? 'fullName-error' : undefined}
                    />
                  </div>
                  {formErrors.fullName && touchedFields.fullName && (
                    <p id="fullName-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle size={14} /> {formErrors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">Phone Number <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.phone && touchedFields.phone ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-emerald-500'}`} size={18} />
                    <input
                      type="tel"
                      placeholder="+880 1XXX-XXXXXX"
                      autoComplete="tel"
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl transition-all duration-200 focus:outline-none text-gray-800 placeholder:text-gray-400 ${
                        formErrors.phone && touchedFields.phone 
                          ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100' 
                          : 'border-gray-200 bg-white hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
                      }`}
                      value={formData.phone}
                      onChange={e => updateField('phone', e.target.value)}
                      aria-invalid={!!(formErrors.phone && touchedFields.phone)}
                      aria-describedby={formErrors.phone && touchedFields.phone ? 'phone-error' : undefined}
                    />
                  </div>
                  {formErrors.phone && touchedFields.phone && (
                    <p id="phone-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle size={14} /> {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">Email Address <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.email && touchedFields.email ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-emerald-500'}`} size={18} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl transition-all duration-200 focus:outline-none text-gray-800 placeholder:text-gray-400 ${
                        formErrors.email && touchedFields.email 
                          ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100' 
                          : 'border-gray-200 bg-white hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
                      }`}
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                      aria-invalid={!!(formErrors.email && touchedFields.email)}
                      aria-describedby={formErrors.email && touchedFields.email ? 'email-error' : undefined}
                    />
                  </div>
                  {formErrors.email && touchedFields.email && (
                    <p id="email-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle size={14} /> {formErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">Division/Region <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${formErrors.division && touchedFields.division ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-emerald-500'}`} size={18} />
                    <select
                      className={`w-full pl-12 pr-10 py-3.5 border-2 rounded-2xl transition-all duration-200 focus:outline-none appearance-none cursor-pointer ${
                        formErrors.division && touchedFields.division 
                          ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100' 
                          : 'border-gray-200 bg-white hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
                      } text-gray-800`}
                      value={formData.division}
                      onChange={e => updateField('division', e.target.value)}
                      aria-invalid={!!(formErrors.division && touchedFields.division)}
                      aria-describedby={formErrors.division && touchedFields.division ? 'division-error' : undefined}
                  >
                    <option value="">Select Division</option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                    </select>
                  </div>
                  {formErrors.division && touchedFields.division && (
                    <p id="division-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle size={14} /> {formErrors.division}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5">Delivery Address <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <MapPin className={`absolute left-4 top-4 pointer-events-none transition-colors duration-200 ${formErrors.address && touchedFields.address ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-emerald-500'}`} size={18} />
                  <textarea
                    placeholder="House #, Road #, Area, City - Please provide detailed address for smooth delivery"
                    autoComplete="street-address"
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl transition-all duration-200 focus:outline-none min-h-[120px] resize-none text-gray-800 placeholder:text-gray-400 ${
                      formErrors.address && touchedFields.address 
                        ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
                    }`}
                    value={formData.address}
                    onChange={e => updateField('address', e.target.value)}
                    aria-invalid={!!(formErrors.address && touchedFields.address)}
                    aria-describedby={formErrors.address && touchedFields.address ? 'address-error' : undefined}
                  ></textarea>
                </div>
                {formErrors.address && touchedFields.address && (
                  <p id="address-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle size={14} /> {formErrors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5">Special Instructions <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea
                  placeholder="Add any special requests, customization details, or instructions for your order..."
                  className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white rounded-2xl transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 hover:border-gray-300 resize-none min-h-[100px] text-gray-800 placeholder:text-gray-400"
                  value={formData.productDescription || ''}
                  onChange={e => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, productDescription: value }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Gift size={12} /> Let us know about any specific requirements</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Step 2</p>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 font-bold"><ShieldCheck size={14} /> Secure Payment</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 rounded-2xl p-4 flex flex-col gap-2 transition-colors text-left">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <CheckCircle2 size={16} /> Cash on Delivery
                  </div>
                  <p className="text-xs text-gray-500">Pay when the order arrives.</p>
                  <Banknote size={40} className="text-emerald-500" />
                </button>
                <div className="border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
                  
                  <div className="grid grid-cols-1 gap-3">
                   
                 
                    <div className="grid grid-cols-2 gap-3">
                   
                   
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>

          <div className="w-full lg:w-96">
            <div className="store-card p-6 rounded-3xl top-24 border border-gray-100 shadow-xl shadow-emerald-50/50">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Order Items ({quantity} Items)</h2>

              <div className="flex gap-3 mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded border border-gray-200 p-1 flex-shrink-0">
                  <img 
                    src={normalizeImageUrl(product.galleryImages?.[0] || product.image)} 
                    alt={product.name} 
                    className="w-full h-full object-contain mix-blend-multiply" 
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 pr-4">{product.name}</h3>
                    <button className="text-gray-400 hover:text-red-500" type="button">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Variant: <span className="font-semibold text-gray-700">{variant.color} / {variant.size}</span></p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 rounded px-2 py-0.5 text-xs bg-gray-50">
                      <span className="px-2">{quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">৳ {formattedProductPrice}</span>
                      {formattedProductOriginalPrice && (
                        <span className="text-xs text-gray-400 line-through">৳ {formattedProductOriginalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Selected Variant:</span>
                  <span className="font-medium text-gray-800">{variant.color} / {variant.size}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sub Total:</span>
                  <span className="font-medium">৳ {subTotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span className="font-medium text-rose-500">-৳ {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge ({selectedDeliveryType}):</span>
                  <span className="font-medium">৳ {computedDeliveryCharge}</span>
                </div>
                <div className="flex justify-between text-gray-800 text-lg font-bold border-t border-dashed border-gray-200 pt-3 mt-2">
                  <span>Total:</span>
                  <span>৳ {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Have a promo code?</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all duration-200 text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={applyPromoCode}
                      className="px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Apply
                    </button>
                  </div>
                  {promoStatus.message && (
                    <p className={`text-xs font-semibold ${promoStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {promoStatus.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  className="w-full btn-order rounded-2xl py-4 text-base tracking-wide bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                >
                  Confirm Order • ৳{grandTotal.toLocaleString()}
                </button>
                <button
                  onClick={onBack}
                  className="w-full rounded-2xl border-2 border-theme-primary/30 text-theme-primary font-semibold py-3.5 text-sm hover:bg-theme-primary/10 hover:border-theme-primary flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <ArrowLeft size={16} /> Continue Shopping
                </button>
              </div>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-theme-primary" />
                  <span className="font-semibold text-gray-700">Money-back guarantee within 7 days.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Headphones size={20} className="text-indigo-500" />
                  <span className="text-gray-600">Need help? <a className="text-indigo-600 font-semibold" href="tel:+8801615332701">Call support</a></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
              onClick={() => setShowOfferModal(false)}
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <Gift size={32} className="text-emerald-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Exclusive</p>
                <h3 className="text-xl font-bold text-gray-900">Limited-time discounts</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>✅ Use code <span className="font-semibold">SAVE10</span> for 10% off accessories.</li>
              <li>✅ Free express delivery on orders above ৳5,000.</li>
              <li>✅ Members earn double loyalty points today.</li>
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-gray-900 text-white font-semibold py-3 text-sm"
              onClick={() => setShowOfferModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Order placed successfully!</h3>
            <p className="text-sm text-gray-600 mb-6">We sent a confirmation email with the next steps. Sit tight while we prepare your delivery.</p>
            <button
              type="button"
              className="w-full rounded-full bg-gray-900 text-white font-semibold py-3 text-sm"
              onClick={() => setShowConfirmationModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {alertState.type && (
        <div className="fixed bottom-6 right-6 z-40">
          <div
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl border text-sm font-semibold max-w-sm ${
              alertState.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {alertState.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <div className="flex-1">{alertState.message}</div>
            <button
              type="button"
              className="text-xs uppercase tracking-wide"
              onClick={() => setAlertState({ type: null, message: '' })}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} />
      </Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreCheckout;
