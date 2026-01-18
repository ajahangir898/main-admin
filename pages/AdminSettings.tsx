import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, CheckCircle, AlertCircle, Facebook, Settings, 
  Camera, Loader2, Code, FolderOpen, ArrowRight,
  DollarSign
} from 'lucide-react';
import { CourierConfig, User, Tenant, Role } from '../types';
import { convertFileToWebP } from '../services/imageUtils';
import { GalleryPicker } from '../components/GalleryPicker';
import AdminControl from './AdminControlNew';
import AdminBilling from './AdminBilling';

interface AdminSettingsProps {
  courierConfig: CourierConfig;
  onUpdateCourierConfig: (config: CourierConfig) => void;
  onNavigate: (page: string) => void;
  user?: User | null;
  onUpdateProfile?: (updatedUser: User) => void;
  activeTenant?: Tenant | null;
  logo?: string | null;
  onUpdateLogo?: (logo: string | null) => void;
  // Props for Admin Control
  users?: User[];
  roles?: Role[];
  onAddUser?: (user: Omit<User, '_id' | 'id'>) => Promise<void>;
  onUpdateUser?: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onAddRole?: (role: Omit<Role, '_id' | 'id'>) => Promise<void>;
  onUpdateRole?: (roleId: string, updates: Partial<Role>) => Promise<void>;
  onDeleteRole?: (roleId: string) => Promise<void>;
  onUpdateUserRole?: (userEmail: string, roleId: string) => Promise<void>;
  userPermissions?: Record<string, string[]>;
  // Props for Billing
  onUpgrade?: () => void;
}

// Settings card for navigation
const SettingsCard: React.FC<{ title: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, icon, color, onClick }) => (
  <button onClick={onClick} className={`p-3 sm:p-5 rounded-lg sm:rounded-xl border ${color} flex items-center gap-3 sm:gap-4 hover:shadow-md transition group w-full text-left active:scale-[0.98]`}>
    <div className="p-2 sm:p-3 rounded-full bg-white/80 shadow-sm group-hover:scale-110 transition flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{title}</h3>
      <span className="text-xs text-gray-500 flex items-center gap-1">Manage <ArrowRight size={12} /></span>
    </div>
  </button>
);

// Status banner component
const Banner: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => (
  <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium ${type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'} border`}>
    {type === 'success' ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
    <span className="truncate">{message}</span>
  </div>
);

// Tab types
type SettingsTab = 'general' | 'admin_control' | 'billing';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General Settings', icon: <Settings size={18} /> },
  { id: 'admin_control', label: 'Admin Control', icon: <Shield size={18} /> },
  { id: 'billing', label: 'Billing & Subscription', icon: <DollarSign size={18} /> },
];

const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  onNavigate, user, onUpdateProfile, activeTenant, logo, onUpdateLogo,
  users = [], roles = [], onAddUser, onUpdateUser, onDeleteUser,
  onAddRole, onUpdateRole, onDeleteRole, onUpdateUserRole, userPermissions = {},
  onUpgrade
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const shopLogoRef = useRef<HTMLInputElement>(null);
  const [shopLogo, setShopLogo] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'shopLogo' | null>(null);
  const [shopLogoLoading, setShopLogoLoading] = useState(false);

  useEffect(() => {
    if (logo) setShopLogo(logo);
  }, [logo]);

  const showStatus = (type: 'success' | 'error', msg: string) => { setStatus({ type, msg }); setTimeout(() => setStatus(null), 4000); };

  const handleShopLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShopLogoLoading(true);
    try {
      const img = await convertFileToWebP(file, { quality: 0.85, maxDimension: 400 });
      setShopLogo(img);
      if (onUpdateLogo) {
        onUpdateLogo(img);
        showStatus('success', 'Shop logo updated!');
      }
    } catch { showStatus('error', 'Image processing failed'); }
    setShopLogoLoading(false);
    e.target.value = '';
  };

  const openGallery = (target: 'shopLogo') => {
    setGalleryTarget(target);
    setIsGalleryOpen(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (galleryTarget === 'shopLogo') {
      setShopLogo(imageUrl);
      if (onUpdateLogo) {
        onUpdateLogo(imageUrl);
        showStatus('success', 'Shop logo updated!');
      }
    }
    setIsGalleryOpen(false);
    setGalleryTarget(null);
  };

  // Render General Settings content
  const renderGeneralSettings = () => (
    <>
      {/* Shop Logo Card */}
      <div className="max-w-md mx-auto mb-4 sm:mb-6">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Settings size={16} className="text-emerald-600 sm:hidden" />
            <Settings size={18} className="text-emerald-600 hidden sm:block" /> Shop Info
          </h4>
          <div className="flex flex-col items-center">
            <div className="relative mb-3 sm:mb-4">
              {shopLogo ? (
                <img src={shopLogo} alt="Shop Logo" className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg sm:rounded-xl object-contain border-2 border-gray-100 bg-gray-50 p-2" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                  <Camera size={28} className="text-gray-300 sm:hidden" />
                  <Camera size={32} className="text-gray-300 hidden sm:block" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <button onClick={() => openGallery('shopLogo')} className="bg-emerald-500 text-white rounded-full p-1.5 sm:p-2 shadow-sm hover:bg-emerald-600 hover:scale-105 transition" title="Choose from Gallery">
                  <FolderOpen size={12} className="sm:hidden" />
                  <FolderOpen size={14} className="hidden sm:block" />
                </button>
                <button onClick={() => shopLogoRef.current?.click()} className="bg-emerald-500 text-white rounded-full p-1.5 sm:p-2 shadow-sm hover:bg-emerald-600 hover:scale-105 transition" title="Upload new">
                  {shopLogoLoading ? <Loader2 size={12} className="animate-spin sm:hidden" /> : <Camera size={12} className="sm:hidden" />}
                  {shopLogoLoading ? <Loader2 size={14} className="animate-spin hidden sm:block" /> : <Camera size={14} className="hidden sm:block" />}
                </button>
              </div>
              <input ref={shopLogoRef} type="file" accept="image/*" className="hidden" onChange={handleShopLogo} />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-800">{activeTenant?.name || 'My Shop'}</p>
            {activeTenant?.subdomain && (
              <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-full">{activeTenant.subdomain}.systemnextit.com</p>
            )}
            {activeTenant?.plan && (
              <span className="mt-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-700 capitalize">
                {activeTenant.plan} Plan
              </span>
            )}
          </div>
          {status && <div className="mt-4"><Banner type={status.type} message={status.msg} /></div>}
        </div>
      </div>

      {/* System Settings */}
      <section>
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">System Settings</h3>
          <p className="text-xs sm:text-sm text-gray-500">Configure your store settings</p>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SettingsCard title="Delivery Charge" icon={<Truck size={20} className="text-blue-600" />} color="bg-blue-50 border-blue-100 hover:border-blue-300" onClick={() => onNavigate('settings_delivery')} />
          <SettingsCard title="Courier API" icon={<Settings size={20} className="text-purple-600" />} color="bg-purple-50 border-purple-100 hover:border-purple-300" onClick={() => onNavigate('settings_courier')} />
          <SettingsCard title="Facebook Pixel" icon={<Facebook size={20} className="text-blue-700" />} color="bg-blue-50 border-blue-100 hover:border-blue-300" onClick={() => onNavigate('settings_facebook_pixel')} />
          <SettingsCard title="Google Tag Manager" icon={<Code size={20} className="text-blue-500" />} color="bg-sky-50 border-sky-100 hover:border-sky-300" onClick={() => onNavigate('settings_gtm')} />
        </div>
      </section>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-xs sm:text-sm text-gray-500">Manage your profile, users, and subscription</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0.5 sm:gap-1 -mb-px min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 bg-purple-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] sm:min-h-[400px]">
        {activeTab === 'general' && renderGeneralSettings()}
        
        {activeTab === 'admin_control' && (
          <AdminControl
            users={users}
            roles={roles}
            onAddUser={onAddUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
            onAddRole={onAddRole || (async () => {})}
            onUpdateRole={onUpdateRole || (async () => {})}
            onDeleteRole={onDeleteRole || (async () => {})}
            onUpdateUserRole={onUpdateUserRole || (async () => {})}
            currentUser={user}
            tenantId={activeTenant?._id || activeTenant?.id}
            userPermissions={userPermissions}
          />
        )}
        
        {activeTab === 'billing' && (
          <AdminBilling
            tenant={activeTenant}
            onUpgrade={onUpgrade}
          />
        )}
      </div>

      {/* Gallery Picker */}
      <GalleryPicker
        isOpen={isGalleryOpen}
        onClose={() => { setIsGalleryOpen(false); setGalleryTarget(null); }}
        onSelect={handleGallerySelect}
        title="Select Shop Logo"
      />
    </div>
  );
};

export default AdminSettings;