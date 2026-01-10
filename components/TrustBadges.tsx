import React from 'react';
import { Shield, Truck, RotateCcw, CreditCard, Check } from 'lucide-react';

interface TrustBadgeProps {
  variant?: 'default' | 'compact';
}

export const TrustBadges: React.FC<TrustBadgeProps> = ({ variant = 'default' }) => {
  const badges = [
    { icon: Shield, text: '100% Secure Payment', color: '#10b981' },
    { icon: Truck, text: 'Free Delivery', color: '#3b82f6' },
    { icon: RotateCcw, text: '7 Days Return', color: '#f59e0b' },
    { icon: CreditCard, text: 'Cash on Delivery', color: '#8b5cf6' },
  ];

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {badges.map((badge, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
            style={{ background: `${badge.color}15`, color: badge.color }}
          >
            <badge.icon size={14} />
            <span className="font-medium">{badge.text}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="enhanced-trust-badges">
      {badges.map((badge, index) => (
        <div key={index} className="enhanced-trust-badge">
          <div className="enhanced-trust-badge-icon" style={{ color: badge.color }}>
            <badge.icon size={20} />
          </div>
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
};

interface ShippingCalculatorProps {
  onCalculate?: (zipCode: string) => void;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({ onCalculate }) => {
  const [zipCode, setZipCode] = React.useState('');
  const [result, setResult] = React.useState<{ cost: number; days: string } | null>(null);

  const handleCalculate = () => {
    // Simple mock calculation - replace with actual logic
    const mockResult = {
      cost: zipCode.length > 4 ? 50 : 100,
      days: '2-3 business days'
    };
    setResult(mockResult);
    onCalculate?.(zipCode);
  };

  return (
    <div className="enhanced-shipping-calculator">
      <h4>Check Delivery Time & Cost</h4>
      <div className="enhanced-shipping-input-group">
        <input
          type="text"
          className="enhanced-shipping-input"
          placeholder="Enter your ZIP code"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
        />
        <button
          className="enhanced-shipping-calculate-btn"
          onClick={handleCalculate}
        >
          Calculate
        </button>
      </div>
      {result && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <Check size={16} />
            <span className="font-medium">
              ৳{result.cost} • Delivery in {result.days}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default { TrustBadges, ShippingCalculator };
