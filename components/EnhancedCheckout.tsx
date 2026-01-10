import React, { useState } from 'react';
import { Check, Package, Truck, Home } from 'lucide-react';
import { Product } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface CheckoutStep {
  number: number;
  label: string;
  icon: React.ReactNode;
}

interface EnhancedCheckoutProps {
  cartItems: Array<{
    product: Product;
    quantity: number;
  }>;
  onSubmit: (data: CheckoutFormData) => void;
  accentColor?: string;
}

export interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  paymentMethod: 'cod' | 'online';
  deliveryType: 'standard' | 'express';
}

const STEPS: CheckoutStep[] = [
  { number: 1, label: 'Cart', icon: <Package size={20} /> },
  { number: 2, label: 'Information', icon: <Home size={20} /> },
  { number: 3, label: 'Payment', icon: <Check size={20} /> },
];

export const EnhancedCheckout: React.FC<EnhancedCheckoutProps> = ({
  cartItems,
  onSubmit,
  accentColor = '#8b5cf6'
}) => {
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'cod',
    deliveryType: 'standard'
  });

  React.useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty('--store-accent-color', accentColor);
    }
  }, [accentColor]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryCharge = formData.deliveryType === 'express' ? 150 : 50;
  const total = subtotal + deliveryCharge;

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="enhanced-checkout-container">
      {/* Progress Steps */}
      <div className="enhanced-checkout-progress">
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className={`enhanced-checkout-progress-step ${
              currentStep >= step.number ? 'active' : ''
            } ${currentStep > step.number ? 'completed' : ''}`}
          >
            <div className="enhanced-checkout-progress-circle">
              {currentStep > step.number ? <Check size={20} /> : step.icon}
            </div>
            <span className="text-sm font-medium text-gray-600">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Main Checkout Grid */}
      <div className="enhanced-checkout-grid">
        {/* Form Section */}
        <form className="enhanced-checkout-form" onSubmit={handleSubmit}>
          {/* Contact Information */}
          <div className="enhanced-checkout-section">
            <h3>Contact Information</h3>
            
            <div className="enhanced-checkout-input-group">
              <label className="enhanced-checkout-label">Full Name *</label>
              <input
                type="text"
                className="enhanced-checkout-input"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="enhanced-checkout-input-group">
                <label className="enhanced-checkout-label">Email</label>
                <input
                  type="email"
                  className="enhanced-checkout-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="enhanced-checkout-input-group">
                <label className="enhanced-checkout-label">Phone *</label>
                <input
                  type="tel"
                  className="enhanced-checkout-input"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="enhanced-checkout-section">
            <h3>Shipping Address</h3>
            
            <div className="enhanced-checkout-input-group">
              <label className="enhanced-checkout-label">Address *</label>
              <textarea
                className="enhanced-checkout-input"
                rows={3}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="enhanced-checkout-input-group">
                <label className="enhanced-checkout-label">City *</label>
                <input
                  type="text"
                  className="enhanced-checkout-input"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>

              <div className="enhanced-checkout-input-group">
                <label className="enhanced-checkout-label">ZIP Code</label>
                <input
                  type="text"
                  className="enhanced-checkout-input"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="enhanced-checkout-section">
            <h3>Delivery Method</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <input
                  type="radio"
                  name="delivery"
                  value="standard"
                  checked={formData.deliveryType === 'standard'}
                  onChange={(e) => handleInputChange('deliveryType', e.target.value as any)}
                  className="w-4 h-4 text-purple-600"
                />
                <Truck size={20} className="text-gray-400" />
                <div className="flex-1">
                  <div className="font-semibold">Standard Delivery</div>
                  <div className="text-sm text-gray-500">5-7 business days</div>
                </div>
                <div className="font-bold">৳50</div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <input
                  type="radio"
                  name="delivery"
                  value="express"
                  checked={formData.deliveryType === 'express'}
                  onChange={(e) => handleInputChange('deliveryType', e.target.value as any)}
                  className="w-4 h-4 text-purple-600"
                />
                <Truck size={20} className="text-purple-600" />
                <div className="flex-1">
                  <div className="font-semibold">Express Delivery</div>
                  <div className="text-sm text-gray-500">2-3 business days</div>
                </div>
                <div className="font-bold">৳150</div>
              </label>
            </div>
          </div>

          {/* Payment Method */}
          <div className="enhanced-checkout-section">
            <h3>Payment Method</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-semibold">Cash on Delivery</div>
                  <div className="text-sm text-gray-500">Pay when you receive</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={formData.paymentMethod === 'online'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-semibold">Online Payment</div>
                  <div className="text-sm text-gray-500">Bkash, Nagad, Card</div>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Order Summary */}
        <div className="enhanced-checkout-summary">
          <h3>Order Summary</h3>

          {cartItems.map((item, index) => (
            <div key={index} className="enhanced-checkout-summary-item">
              <img
                src={normalizeImageUrl(item.product.galleryImages?.[0] || item.product.image)}
                alt={item.product.name}
                className="enhanced-checkout-summary-image"
              />
              <div className="enhanced-checkout-summary-details">
                <div className="enhanced-checkout-summary-name">{item.product.name}</div>
                <div className="enhanced-checkout-summary-price">
                  Qty: {item.quantity} × ৳{item.product.price.toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          <div className="enhanced-checkout-totals">
            <div className="enhanced-checkout-total-row">
              <span>Subtotal</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="enhanced-checkout-total-row">
              <span>Delivery</span>
              <span>৳{deliveryCharge}</span>
            </div>
            <div className="enhanced-checkout-total-row final">
              <span>Total</span>
              <span>৳{total.toLocaleString()}</span>
            </div>
          </div>

          <button type="submit" className="enhanced-checkout-submit" onClick={handleSubmit}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckout;
