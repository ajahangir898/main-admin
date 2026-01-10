import React, { memo } from 'react';
import { Mail, Phone, Gift, Users, Heart, Truck, UserPlus, Bell } from 'lucide-react';
import type { WebsiteConfig, User as UserType } from '../../../types';

interface TopBarProps {
  websiteConfig?: WebsiteConfig;
  user?: UserType | null;
  onWishlistClick?: () => void;
  onTrackOrderClick?: () => void;
  onLoginClick?: () => void;
  wishlistCount?: number;
}

export const TopBar = memo<TopBarProps>(({
  websiteConfig,
  user,
  onWishlistClick,
  onTrackOrderClick,
  onLoginClick,
  wishlistCount = 0
}) => {
  const email = websiteConfig?.emails?.[0];
  const phone = websiteConfig?.phones?.[0];

  return (
    <div className="hidden md:block bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 text-sm">
          {/* Left side - Contact info */}
          <div className="flex items-center gap-6 text-gray-600">
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-theme-primary transition-colors">
                <Mail size={14} />
                <span>{email}</span>
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-theme-primary transition-colors">
                <Phone size={14} />
                <span>{phone}</span>
              </a>
            )}
          </div>

          {/* Right side - Utility links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-theme-primary hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Gift size={14} />
              <span>Daily Reward</span>
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-theme-primary hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Users size={14} />
              <span>Community</span>
            </button>
            <button
              onClick={onWishlistClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-theme-primary hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Heart size={14} />
              <span>My Wishlist ({wishlistCount})</span>
            </button>
            <button
              onClick={onTrackOrderClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-theme-primary hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Truck size={14} />
              <span>Track Order</span>
            </button>
            {!user && (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-theme-primary hover:bg-gray-50 rounded-lg transition-colors"
              >
                <UserPlus size={14} />
                <span>Seller Registration</span>
              </button>
            )}
            <button
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-theme-primary hover:bg-gray-50 rounded-lg transition-colors relative"
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

TopBar.displayName = 'TopBar';
export default TopBar;
