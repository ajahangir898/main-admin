// MobileDrawer - Mobile navigation drawer (Redesigned)
import React, { useEffect } from 'react';
import { X, Grid, ChevronRight, ChevronDown, Gift, Heart, HelpCircle, Sparkles } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';

type CatalogGroup = {
  key: string;
  label: string;
  items: string[];
};

type DrawerLinkItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  action?: () => void;
  color?: string;
};

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logo?: string | null;
  logoKey: string;
  catalogGroups: CatalogGroup[];
  activeCatalogSection: string;
  isCatalogDropdownOpen: boolean;
  onCatalogDropdownToggle: () => void;
  onCatalogSectionToggle: (key: string) => void;
  onCatalogItemClick: (item: string) => void;
  onTrackOrder?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  logo,
  logoKey,
  catalogGroups,
  activeCatalogSection,
  isCatalogDropdownOpen,
  onCatalogDropdownToggle,
  onCatalogSectionToggle,
  onCatalogItemClick,
  onTrackOrder,
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const mobileDrawerLinks: DrawerLinkItem[] = [
    { key: 'campaign', label: 'Campaign', icon: Sparkles, color: 'text-amber-500 bg-amber-50' },
    { key: 'recommend', label: 'Recommend', icon: Heart, action: onTrackOrder, color: 'text-rose-500 bg-rose-50' },
    { key: 'faqs', label: 'FAQs', icon: HelpCircle, color: 'text-blue-500 bg-blue-50' },
  ];

  const handleDrawerNavClick = (action?: () => void) => {
    onClose();
    setTimeout(() => action?.(), 150);
  };

  return (
    <>
      {/* Overlay with smooth fade */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-all duration-300 ease-out md:hidden z-[98] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={onClose} 
      />
      
      {/* Drawer with smooth slide */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[99] w-[85%] max-w-[320px] bg-gradient-to-b from-white to-gray-50 shadow-2xl md:hidden flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            {logo ? (
              <img 
                key={logoKey} 
                src={normalizeImageUrl(logo)} 
                alt="Store Logo" 
                width={130}
                height={36}
                className="h-9 object-contain" 
              />
            ) : (
              <span className="text-xl font-black tracking-tight text-gray-900">
                GADGET<span className="text-theme-primary">SHOB</span>
              </span>
            )}
          </div>
          <button 
            type="button" 
            className="p-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all duration-200" 
            onClick={onClose}
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Catalog Section */}
          <div className="p-4">
            <button 
              type="button" 
              className={`flex w-full items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-gray-800 transition-all duration-200 ${isCatalogDropdownOpen ? 'bg-theme-primary/10 text-theme-primary' : 'bg-white shadow-sm border border-gray-100 hover:border-gray-200'}`}
              onClick={onCatalogDropdownToggle}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isCatalogDropdownOpen ? 'bg-theme-primary/20' : 'bg-gray-100'}`}>
                  <Grid size={18} className={isCatalogDropdownOpen ? 'text-theme-primary' : 'text-gray-600'} />
                </div>
                <span className="text-[15px]">Browse Catalog</span>
              </div>
              <ChevronDown 
                className={`transition-transform duration-300 ${isCatalogDropdownOpen ? 'rotate-180 text-theme-primary' : 'text-gray-400'}`} 
                size={20} 
              />
            </button>
            
            {/* Catalog Dropdown Content */}
            <div 
              className={`mt-2 rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 ease-out ${isCatalogDropdownOpen ? 'max-h-[400px] opacity-100 shadow-sm' : 'max-h-0 opacity-0 border-transparent'}`}
            >
              <div className="divide-y divide-gray-50">
                {catalogGroups.map((group, idx) => (
                  <div key={group.key} className={idx === 0 ? '' : ''}>
                    <button 
                      type="button" 
                      className={`flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeCatalogSection === group.key ? 'text-theme-primary bg-theme-primary/5' : 'text-gray-700 hover:bg-gray-50'}`} 
                      onClick={() => onCatalogSectionToggle(group.key)}
                    >
                      <span>{group.label}</span>
                      <ChevronRight 
                        size={16} 
                        className={`transition-transform duration-200 ${activeCatalogSection === group.key ? 'rotate-90 text-theme-primary' : 'text-gray-400'}`} 
                      />
                    </button>
                    
                    {/* Sub-items with smooth animation */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-out ${activeCatalogSection === group.key ? 'max-h-48' : 'max-h-0'}`}
                    >
                      <div className="px-4 pb-3 pt-1 space-y-1">
                        {group.items.map((item) => (
                          <button 
                            key={item}
                            type="button" 
                            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-theme-primary hover:bg-theme-primary/5 rounded-lg transition-colors duration-150" 
                            onClick={() => onCatalogItemClick(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Quick Links</p>
            <div className="space-y-2">
              {mobileDrawerLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={item.key} 
                    type="button" 
                    className="w-full flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3.5 text-left font-medium text-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all duration-200" 
                    onClick={() => handleDrawerNavClick(item.action)}
                  >
                    <div className={`p-2 rounded-xl ${item.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[15px]">{item.label}</span>
                    <ChevronRight size={16} className="ml-auto text-gray-300" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Gift size={14} />
            <span>Free shipping on orders over ৳500</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileDrawer;