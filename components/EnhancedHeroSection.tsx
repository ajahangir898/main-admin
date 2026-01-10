import React from 'react';
import { ShoppingBag, Shield, Truck, Star, ArrowRight, Play } from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface EnhancedHeroSectionProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  ctaPrimaryText?: string;
  ctaSecondaryText?: string;
  imageUrl?: string;
  features?: string[];
  onCtaPrimaryClick?: () => void;
  onCtaSecondaryClick?: () => void;
  accentColor?: string;
  floatingBadge?: {
    icon: React.ReactNode;
    text: string;
    subtext: string;
  };
}

export const EnhancedHeroSection: React.FC<EnhancedHeroSectionProps> = ({
  title = 'Discover Amazing Products at Unbeatable Prices',
  subtitle = 'Shop the latest trends with confidence. Quality products, fast delivery, and exceptional customer service.',
  badgeText = '🎉 New Arrivals Available',
  ctaPrimaryText = 'Shop Now',
  ctaSecondaryText = 'View Catalog',
  imageUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
  features = ['Free Shipping', '24/7 Support', '100% Secure'],
  onCtaPrimaryClick,
  onCtaSecondaryClick,
  accentColor,
  floatingBadge
}) => {
  const [isPulse, setIsPulse] = React.useState(true);

  React.useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty('--store-accent-color', accentColor);
    }
  }, [accentColor]);

  const defaultFloatingBadge = floatingBadge || {
    icon: <Star size={20} fill="currentColor" />,
    text: '4.9/5',
    subtext: '5000+ Reviews'
  };

  return (
    <div className="enhanced-hero-section">
      <div className="enhanced-hero-content">
        {/* Text Content */}
        <div className="enhanced-hero-text">
          {badgeText && (
            <div className="enhanced-hero-badge">
              {badgeText}
            </div>
          )}

          <h1 className="enhanced-hero-title">{title}</h1>
          
          <p className="enhanced-hero-subtitle">{subtitle}</p>

          <div className="enhanced-hero-features">
            {features.map((feature, index) => (
              <div key={index} className="enhanced-hero-feature">
                <Shield className="enhanced-hero-feature-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="enhanced-hero-cta">
            <button
              className={`enhanced-hero-cta-primary ${isPulse ? 'pulse' : ''}`}
              onClick={() => {
                setIsPulse(false);
                onCtaPrimaryClick?.();
              }}
              onMouseEnter={() => setIsPulse(false)}
            >
              <ShoppingBag size={20} />
              {ctaPrimaryText}
              <ArrowRight size={20} />
            </button>
            
            <button
              className="enhanced-hero-cta-secondary"
              onClick={onCtaSecondaryClick}
            >
              {ctaSecondaryText}
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="enhanced-hero-image">
          <img
            src={normalizeImageUrl(imageUrl)}
            alt="Hero"
            loading="eager"
          />
          
          <div className="enhanced-hero-floating-badge">
            <div style={{ color: accentColor || '#8b5cf6' }}>
              {defaultFloatingBadge.icon}
            </div>
            <div>
              <div className="font-bold text-lg">{defaultFloatingBadge.text}</div>
              <div className="text-xs text-gray-500">{defaultFloatingBadge.subtext}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHeroSection;
