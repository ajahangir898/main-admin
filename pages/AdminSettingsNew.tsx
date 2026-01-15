import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, MessageSquare, User, Layers, Camera, Lock, CheckCircle, 
  AlertCircle, Loader2, ArrowRight, RotateCcw, Save, Trash2, Plus, Link, Image
} from 'lucide-react';
import { CourierConfig, User as UserType, Tenant, Role } from '../types';
import { convertFileToWebP } from '../services/imageUtils';
import { GalleryPicker } from '../components/GalleryPicker';

interface AdminSettingsNewProps {
  courierConfig: CourierConfig;
  onUpdateCourierConfig: (config: CourierConfig) => void;
  onNavigate: (page: string) => void;
  user?: UserType | null;
  onUpdateProfile?: (updatedUser: UserType) => void;
  activeTenant?: Tenant | null;
  logo?: string | null;
  onUpdateLogo?: (logo: string | null) => void;
  users?: UserType[];
  roles?: Role[];
  onAddUser?: (user: Omit<UserType, '_id' | 'id'>) => Promise<void>;
  onUpdateUser?: (userId: string, updates: Partial<UserType>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onAddRole?: (role: Omit<Role, '_id' | 'id'>) => Promise<void>;
  onUpdateRole?: (roleId: string, updates: Partial<Role>) => Promise<void>;
  onDeleteRole?: (roleId: string) => Promise<void>;
  onUpdateUserRole?: (userEmail: string, roleId: string) => Promise<void>;
  userPermissions?: Record<string, string[]>;
  onUpgrade?: () => void;
}

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjxwYXRoIGQ9Ik00IDIwYzAtNCA0LTggOC04czggNCA4IDgiLz48L3N2Zz4=';

const DEFAULT_LOGO = 'https://via.placeholder.com/150x60?text=OVERSEAS+PRODUCTS';

type SettingsTab = 'website_info' | 'chat_settings' | 'profile_details' | 'popups';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'website_info', label: 'Website Information', icon: <Globe size={18} /> },
  { id: 'chat_settings', label: 'Chat Settings', icon: <MessageSquare size={18} /> },
  { id: 'profile_details', label: 'Profile Details', icon: <User size={18} /> },
  { id: 'popups', label: 'Popups', icon: <Layers size={18} /> },
];

const formatDate = (d?: string) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatRole = (role?: UserType['role']) => 
  ({ super_admin: 'Super Admin', tenant_admin: 'Owner', admin: 'Admin', staff: 'Staff', customer: 'Customer' }[role || 'admin'] || 'Owner');

const Banner: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => (
  <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium ${
    type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
  } border`}>
    {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
    <span>{message}</span>
  </div>
);

// Logo Card Component
const LogoCard: React.FC<{
  title: string;
  logo: string | null;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ title, logo, onSelect, onDelete }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <p className="text-sm font-medium text-gray-700 mb-3 text-center">{title}</p>
    <div className="flex items-center justify-center h-16 mb-4">
      {logo ? (
        <img src={logo} alt={title} className="max-h-full max-w-full object-contain" />
      ) : (
        <div className="text-gray-300 flex items-center gap-2">
          <Image size={24} />
          <span className="text-sm">No image</span>
        </div>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={onSelect}
        className="flex-1 py-2 px-3 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition"
      >
        Select Image
      </button>
      <button
        onClick={onDelete}
        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);

// Add Button Component
const AddButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-3 px-4 border border-dashed border-gray-300 rounded-lg text-cyan-600 font-medium hover:bg-cyan-50 hover:border-cyan-300 transition flex items-center justify-center gap-2"
  >
    <Plus size={18} />
    {label}
  </button>
);

const AdminSettingsNew: React.FC<AdminSettingsNewProps> = ({ 
  onNavigate, user, onUpdateProfile, activeTenant, logo, onUpdateLogo
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('website_info');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', address: '' });
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<string | null>(null);
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Website Info State
  const [websiteConfig, setWebsiteConfig] = useState({
    primaryLogo: logo || null,
    headerLogo: null as string | null,
    footerLogo: null as string | null,
    favicon: null as string | null,
    brandingText: 'cdfdsds edsfdsdf rgrregtrh',
    footerUsefulLinksEnabled: true,
    showMobileHeaderCategory: false,
    showNewSlider: false,
    hideCopyrightSection: false,
    hideCopyrightText: false,
    poweredBySystemNextIT: false,
  });
  const [quickLinks, setQuickLinks] = useState<{ id: string; label: string; url: string }[]>([]);
  const [usefulLinks, setUsefulLinks] = useState<{ id: string; label: string; url: string }[]>([]);

  // Chat Settings State
  const [chatConfig, setChatConfig] = useState({
    enableLiveChat: true,
    whatsAppFallback: false,
    welcomeMessage: 'cdfdsds edsfdsdf rgrregtrh',
    offlineMessage: 'cdfdsds edsfdsdf rgrregtrh',
    supportHourFrom: '09:00 AM',
    supportHourTo: '09:00 PM',
  });

  useEffect(() => {
    if (user) {
      setForm({ 
        name: user.name || 'Imam Hoshen Ornob', 
        username: user.username || 'ornob423', 
        email: user.email || 'ornob423@gmail.com', 
        phone: user.phone || '+88 017XX XXXXXX', 
        address: user.address || 'Plot No. 23, Sector 7, Uttara Dhaka – 1230 BANGLADESH' 
      });
      setAvatar(user.image || DEFAULT_AVATAR);
    }
  }, [user]);

  useEffect(() => {
    if (logo) {
      setWebsiteConfig(prev => ({ ...prev, primaryLogo: logo }));
    }
  }, [logo]);

  const showStatus = (type: 'success' | 'error', msg: string) => { 
    setStatus({ type, msg }); 
    setTimeout(() => setStatus(null), 4000); 
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !onUpdateProfile) return showStatus('error', 'No active session');
    setSaving(true);
    onUpdateProfile({ ...user, ...form, image: avatar, updatedAt: new Date().toISOString() });
    showStatus('success', 'Profile updated successfully');
    setSaving(false);
  };

  const handleWebsiteSave = () => {
    setSaving(true);
    // Save website configuration
    if (onUpdateLogo && websiteConfig.primaryLogo) {
      onUpdateLogo(websiteConfig.primaryLogo);
    }
    showStatus('success', 'Website settings saved successfully');
    setSaving(false);
  };

  const handleReset = () => {
    if (user) {
      setForm({ 
        name: user.name || '', 
        username: user.username || '', 
        email: user.email || '', 
        phone: user.phone || '', 
        address: user.address || '' 
      });
      setAvatar(user.image || DEFAULT_AVATAR);
    }
  };

  const handleWebsiteReset = () => {
    setWebsiteConfig({
      primaryLogo: logo || null,
      headerLogo: null,
      footerLogo: null,
      favicon: null,
      brandingText: '',
      footerUsefulLinksEnabled: true,
      showMobileHeaderCategory: false,
      showNewSlider: false,
      hideCopyrightSection: false,
      hideCopyrightText: false,
      poweredBySystemNextIT: false,
    });
    setQuickLinks([]);
    setUsefulLinks([]);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const img = await convertFileToWebP(file, { quality: 0.82, maxDimension: 600 });
      setAvatar(img);
      showStatus('success', 'Photo ready - save to apply');
    } catch { showStatus('error', 'Image processing failed'); }
    setAvatarLoading(false);
    e.target.value = '';
  };

  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !onUpdateProfile) return setPwStatus({ type: 'error', msg: 'No session' });
    if (pwForm.next.length < 6) return setPwStatus({ type: 'error', msg: 'Min 6 characters' });
    if (pwForm.next !== pwForm.confirm) return setPwStatus({ type: 'error', msg: 'Passwords must match' });
    onUpdateProfile({ ...user, password: pwForm.next, updatedAt: new Date().toISOString() });
    setPwStatus({ type: 'success', msg: 'Password updated' });
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => { setPwStatus(null); setPwModal(false); }, 1500);
  };

  const openGalleryFor = (target: string) => {
    setGalleryTarget(target);
    setIsGalleryOpen(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (galleryTarget === 'avatar') {
      setAvatar(imageUrl);
      showStatus('success', 'Photo selected - save to apply');
    } else if (galleryTarget === 'primaryLogo') {
      setWebsiteConfig(prev => ({ ...prev, primaryLogo: imageUrl }));
    } else if (galleryTarget === 'headerLogo') {
      setWebsiteConfig(prev => ({ ...prev, headerLogo: imageUrl }));
    } else if (galleryTarget === 'footerLogo') {
      setWebsiteConfig(prev => ({ ...prev, footerLogo: imageUrl }));
    } else if (galleryTarget === 'favicon') {
      setWebsiteConfig(prev => ({ ...prev, favicon: imageUrl }));
    }
    setIsGalleryOpen(false);
    setGalleryTarget(null);
  };

  const addQuickLink = () => {
    setQuickLinks(prev => [...prev, { id: Date.now().toString(), label: '', url: '' }]);
  };

  const addUsefulLink = () => {
    setUsefulLinks(prev => [...prev, { id: Date.now().toString(), label: '', url: '' }]);
  };

  const renderWebsiteInfo = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Website Details</h3>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={handleWebsiteReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button 
            onClick={handleWebsiteSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition shadow-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {status && <Banner type={status.type} message={status.msg} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Logo Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LogoCard
              title="Primary Store Logo (Fallback)"
              logo={websiteConfig.primaryLogo || DEFAULT_LOGO}
              onSelect={() => openGalleryFor('primaryLogo')}
              onDelete={() => setWebsiteConfig(prev => ({ ...prev, primaryLogo: null }))}
            />
            <LogoCard
              title="Header Logo Override"
              logo={websiteConfig.headerLogo || DEFAULT_LOGO}
              onSelect={() => openGalleryFor('headerLogo')}
              onDelete={() => setWebsiteConfig(prev => ({ ...prev, headerLogo: null }))}
            />
            <LogoCard
              title="Footer Logo Override"
              logo={websiteConfig.footerLogo || DEFAULT_LOGO}
              onSelect={() => openGalleryFor('footerLogo')}
              onDelete={() => setWebsiteConfig(prev => ({ ...prev, footerLogo: null }))}
            />
            <LogoCard
              title="Favicon (32x32 px)"
              logo={websiteConfig.favicon || DEFAULT_LOGO}
              onSelect={() => openGalleryFor('favicon')}
              onDelete={() => setWebsiteConfig(prev => ({ ...prev, favicon: null }))}
            />
          </div>

          {/* Footer useful Links Toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-800">Footer useful Links</p>
              <p className="text-xs text-gray-400">Shown in the useful links column of Footer 3</p>
            </div>
            <button
              onClick={() => setWebsiteConfig(prev => ({ ...prev, footerUsefulLinksEnabled: !prev.footerUsefulLinksEnabled }))}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                websiteConfig.footerUsefulLinksEnabled ? 'bg-cyan-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  websiteConfig.footerUsefulLinksEnabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Branding Text */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Branding Text</label>
            <input
              type="text"
              value={websiteConfig.brandingText}
              onChange={(e) => setWebsiteConfig(prev => ({ ...prev, brandingText: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
              placeholder="Enter branding text..."
            />
          </div>
        </div>

        {/* Right Column - Add Buttons and Links */}
        <div className="space-y-4">
          {/* Add Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            <AddButton label="Add address" onClick={() => {}} />
            <AddButton label="Add email" onClick={() => {}} />
            <AddButton label="Add social link" onClick={() => {}} />
            <AddButton label="Add phone" onClick={() => {}} />
          </div>

          {/* Footer Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-800">Footer Quick Links</p>
                <p className="text-xs text-gray-400">Shown in the Quick Links column of Footer 3</p>
              </div>
              <button
                onClick={addQuickLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 text-white text-xs font-medium rounded-lg hover:bg-cyan-600 transition"
              >
                <Plus size={14} />
                Add Link
              </button>
            </div>
            {quickLinks.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No links yet.</p>
            ) : (
              <div className="space-y-2">
                {quickLinks.map(link => (
                  <div key={link.id} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      value={link.label}
                      onChange={(e) => setQuickLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))}
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      value={link.url}
                      onChange={(e) => setQuickLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Useful Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-800">Footer Useful Links</p>
                <p className="text-xs text-gray-400">Shown in the useful links column of Footer 3</p>
              </div>
              <button
                onClick={addUsefulLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 text-white text-xs font-medium rounded-lg hover:bg-cyan-600 transition"
              >
                <Plus size={14} />
                Add Link
              </button>
            </div>
            {usefulLinks.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No links yet.</p>
            ) : (
              <div className="space-y-2">
                {usefulLinks.map(link => (
                  <div key={link.id} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      value={link.label}
                      onChange={(e) => setUsefulLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))}
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      value={link.url}
                      onChange={(e) => setUsefulLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={websiteConfig.showMobileHeaderCategory}
                onChange={(e) => setWebsiteConfig(prev => ({ ...prev, showMobileHeaderCategory: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700">is show mobile header category menu</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={websiteConfig.showNewSlider}
                onChange={(e) => setWebsiteConfig(prev => ({ ...prev, showNewSlider: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700">is show new slider</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={websiteConfig.hideCopyrightSection}
                onChange={(e) => setWebsiteConfig(prev => ({ ...prev, hideCopyrightSection: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700">hide copyright section</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={websiteConfig.hideCopyrightText}
                onChange={(e) => setWebsiteConfig(prev => ({ ...prev, hideCopyrightText: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700">hide copyright text</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={websiteConfig.poweredBySystemNextIT}
                onChange={(e) => setWebsiteConfig(prev => ({ ...prev, poweredBySystemNextIT: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700">powered by System Next IT</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileDetails = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header with buttons */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-800">Profile Details</h3>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button 
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition shadow-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {status && <div className="mb-6"><Banner type={status.type} message={status.msg} /></div>}

      {/* Profile Avatar Section */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
            <img 
              src={avatar} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <button 
            onClick={() => fileRef.current?.click()}
            className="absolute -top-1 -right-1 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
          >
            {avatarLoading ? <Loader2 size={14} className="animate-spin text-gray-500" /> : <Camera size={14} className="text-gray-500" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>
        
        <div>
          <h4 className="text-xl font-bold text-gray-900">{form.name || 'Imam Hoshen Ornob'}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-gray-600">{formatRole(user?.role)}</span>
            <span className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full border border-orange-200">
              Since {formatDate(user?.createdAt || '2020-01-05')}
            </span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
            placeholder="Imam Hoshen Ornob"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
            placeholder="ornob423"
          />
        </div>

        {/* Address */}
        <div className="lg:row-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition resize-none h-[120px]"
            placeholder="Plot No. 23, Sector 7, Uttara Dhaka – 1230 BANGLADESH"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
            placeholder="+88 017XX XXXXXX"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={form.email}
            readOnly
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 bg-gray-50 cursor-not-allowed"
            placeholder="ornob423@gmail.com"
          />
        </div>
      </div>

      {/* Change Password Button */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <button 
          onClick={() => setPwModal(true)}
          className="flex items-center justify-between w-full max-w-md px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition group"
        >
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-gray-500" />
            <span className="text-gray-700 font-medium">Change Password</span>
          </div>
          <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  const renderChatSettings = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Chat settings</h3>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setChatConfig({
              enableLiveChat: true,
              whatsAppFallback: false,
              welcomeMessage: '',
              offlineMessage: '',
              supportHourFrom: '09:00 AM',
              supportHourTo: '09:00 PM',
            })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button 
            onClick={() => {
              setSaving(true);
              showStatus('success', 'Chat settings saved successfully');
              setSaving(false);
            }}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition shadow-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {status && <Banner type={status.type} message={status.msg} />}

      {/* Toggle Switches Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enable Live Chat */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <div>
            <p className="font-medium text-gray-800">Enable Live Chat</p>
            <p className="text-xs text-gray-400">Allow customers to chat with you</p>
          </div>
          <button
            onClick={() => setChatConfig(prev => ({ ...prev, enableLiveChat: !prev.enableLiveChat }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              chatConfig.enableLiveChat ? 'bg-cyan-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                chatConfig.enableLiveChat ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* WhatsApp Fallback */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <div>
            <p className="font-medium text-gray-800">WhatsApp  Fallback</p>
            <p className="text-xs text-gray-400">Redirect to WhatsApp when chat disabled</p>
          </div>
          <button
            onClick={() => setChatConfig(prev => ({ ...prev, whatsAppFallback: !prev.whatsAppFallback }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              chatConfig.whatsAppFallback ? 'bg-cyan-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                chatConfig.whatsAppFallback ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Welcome Message */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">Welcome Message</label>
          <input
            type="text"
            value={chatConfig.welcomeMessage}
            onChange={(e) => setChatConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
            placeholder="cdfdsds edsfdsdf rgrregtrh"
          />
        </div>

        {/* Support Hour From */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">Support Hour From</label>
          <input
            type="text"
            value={chatConfig.supportHourFrom}
            onChange={(e) => setChatConfig(prev => ({ ...prev, supportHourFrom: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
            placeholder="09:00 AM"
          />
        </div>

        {/* Offline Message */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">Offline Message</label>
          <input
            type="text"
            value={chatConfig.offlineMessage}
            onChange={(e) => setChatConfig(prev => ({ ...prev, offlineMessage: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
            placeholder="cdfdsds edsfdsdf rgrregtrh"
          />
        </div>

        {/* Support Hour To */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">Support Hour To</label>
          <input
            type="text"
            value={chatConfig.supportHourTo}
            onChange={(e) => setChatConfig(prev => ({ ...prev, supportHourTo: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition"
            placeholder="09:00 PM"
          />
        </div>
      </div>
    </div>
  );

  const renderPopups = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Popups</h3>
      <p className="text-gray-500">Popup management will be displayed here.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F8F9FB] min-h-screen">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl px-2">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'website_info' && renderWebsiteInfo()}
        {activeTab === 'chat_settings' && renderChatSettings()}
        {activeTab === 'profile_details' && renderProfileDetails()}
        {activeTab === 'popups' && renderPopups()}
      </div>

      {/* Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800">Change Password</h4>
                <p className="text-sm text-gray-500">Use a strong, unique password</p>
              </div>
              <button onClick={() => setPwModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handlePassword} className="p-5 space-y-4">
              {pwStatus && <Banner type={pwStatus.type} message={pwStatus.msg} />}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400" 
                    value={pwForm.current} 
                    onChange={e => setPwForm({ ...pwForm, current: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400" 
                    value={pwForm.next} 
                    onChange={e => setPwForm({ ...pwForm, next: e.target.value })} 
                    placeholder="Min 6 characters" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400" 
                    value={pwForm.confirm} 
                    onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setPwModal(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600">Save Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Picker */}
      <GalleryPicker
        isOpen={isGalleryOpen}
        onClose={() => { setIsGalleryOpen(false); setGalleryTarget(null); }}
        onSelect={handleGallerySelect}
        title={galleryTarget === 'avatar' ? 'Select Profile Photo' : 'Select Image'}
      />
    </div>
  );
};

export default AdminSettingsNew;
