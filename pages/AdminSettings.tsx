import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Lock, CheckCircle, AlertCircle, Facebook, Settings, 
  Camera, Shield, Clock3, UserCircle, Phone, Mail, MapPin, Loader2, AtSign, ArrowRight, Code, FolderOpen,
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

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjxwYXRoIGQ9Ik00IDIwYzAtNCA0LTggOC04czggNCA4IDgiLz48L3N2Zz4=';
const formatRole = (role?: User['role']) => 
  ({ super_admin: 'Super Admin', tenant_admin: 'Tenant Admin', admin: 'Admin', staff: 'Staff', customer: 'Customer' }[role || 'admin'] || 'Admin');

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A';

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

// Input field component
const Field: React.FC<{ label: string; icon: React.ReactNode; value: string; onChange?: (v: string) => void; readOnly?: boolean; type?: string; placeholder?: string; textarea?: boolean }> =
({ label, icon, value, onChange, readOnly, type = 'text', placeholder, textarea }) => (
  <div className="space-y-1.5 sm:space-y-2">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-2.5 sm:top-3 text-gray-400">{icon}</span>
      {textarea ? (
        <textarea className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm h-20 resize-none" value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} className={`w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 text-sm ${readOnly ? 'bg-gray-50 text-gray-500' : 'focus:border-purple-500 focus:ring-2 focus:ring-purple-100'}`} value={value} onChange={e => onChange?.(e.target.value)} readOnly={readOnly} placeholder={placeholder} />
      )}
    </div>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const shopLogoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', address: '' });
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [shopLogo, setShopLogo] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'avatar' | 'shopLogo' | null>(null);
  const [shopLogoLoading, setShopLogoLoading] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', username: user.username || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
      setAvatar(user.image || DEFAULT_AVATAR);
    }
  }, [user]);

  useEffect(() => {
    if (logo) setShopLogo(logo);
  }, [logo]);

  const showStatus = (type: 'success' | 'error', msg: string) => { setStatus({ type, msg }); setTimeout(() => setStatus(null), 4000); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !onUpdateProfile) return showStatus('error', 'No active session');
    setSaving(true);
    onUpdateProfile({ ...user, ...form, image: avatar, updatedAt: new Date().toISOString() });
    showStatus('success', 'Profile updated');
    setSaving(false);
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

  const openGallery = (target: 'avatar' | 'shopLogo') => {
    setGalleryTarget(target);
    setIsGalleryOpen(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (galleryTarget === 'avatar') {
      setAvatar(imageUrl);
      showStatus('success', 'Photo selected - save to apply');
    } else if (galleryTarget === 'shopLogo') {
      setShopLogo(imageUrl);
      if (onUpdateLogo) {
        onUpdateLogo(imageUrl);
        showStatus('success', 'Shop logo updated!');
      }
    }
    setIsGalleryOpen(false);
    setGalleryTarget(null);
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

  // Render General Settings content
  const renderGeneralSettings = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr] gap-4 sm:gap-6">
        {/* Profile Card - Left side */}
        <div className="space-y-4 sm:space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3 sm:mb-4">
                <img src={avatar} alt="Avatar" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover border-2 border-gray-100 bg-gray-50" />
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <button onClick={() => openGallery('avatar')} className="bg-white border border-gray-200 text-gray-600 rounded-full p-1.5 sm:p-2 shadow-sm hover:scale-105 transition" title="Choose from Gallery">
                    <FolderOpen size={12} className="sm:hidden" />
                    <FolderOpen size={14} className="hidden sm:block" />
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="bg-white border border-gray-200 text-gray-600 rounded-full p-1.5 sm:p-2 shadow-sm hover:scale-105 transition" title="Upload new">
                    {avatarLoading ? <Loader2 size={12} className="animate-spin sm:hidden" /> : <Camera size={12} className="sm:hidden" />}
                    {avatarLoading ? <Loader2 size={14} className="animate-spin hidden sm:block" /> : <Camera size={14} className="hidden sm:block" />}
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{formatRole(user?.role)}</p>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">{form.name || 'Admin'}</h3>
              <p className="text-gray-500 text-xs sm:text-sm truncate max-w-full">{form.email}</p>
              <div className="mt-2 sm:mt-3 flex flex-wrap justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                <span className="bg-gray-100 text-gray-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1"><Shield size={10} className="sm:hidden" /><Shield size={12} className="hidden sm:block" /> {user?.roleId ? 'Custom' : 'Full'}</span>
                <span className="bg-gray-100 text-gray-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1"><Clock3 size={10} className="sm:hidden" /><Clock3 size={12} className="hidden sm:block" /> {formatDate(user?.updatedAt)}</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm border-t border-gray-100 pt-4 sm:pt-5">
              <div><p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Username</p><p className="font-medium text-gray-800 truncate">{form.username ? `@${form.username}` : 'Not set'}</p></div>
              <div><p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Phone</p><p className="font-medium text-gray-800 truncate">{form.phone || 'Not set'}</p></div>
            </div>
            <button onClick={() => setPwModal(true)} className="mt-4 sm:mt-5 w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-100 transition text-xs sm:text-sm font-medium text-gray-700">
              <span className="flex items-center gap-2"><Lock size={12} className="sm:hidden" /><Lock size={14} className="hidden sm:block" /> Change Password</span>
              <ArrowRight size={12} className="sm:hidden" /><ArrowRight size={14} className="hidden sm:block" />
            </button>
          </div>

          {/* Shop Logo Card */}
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
          </div>
        </div>

        {/* Profile Form - Right side */}
        <form onSubmit={handleSave} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Profile Details</h3>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
          </div>

          {status && <Banner type={status.type} message={status.msg} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Full Name" icon={<UserCircle size={16} />} value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <Field label="Username" icon={<AtSign size={16} />} value={form.username} onChange={v => setForm({ ...form, username: v.toLowerCase().replace(/\s/g, '') })} placeholder="john.doe" />
            <Field label="Email" icon={<Mail size={16} />} value={form.email} readOnly />
            <Field label="Phone" icon={<Phone size={16} />} value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+880 1XXX-XXXXXX" />
            <div className="sm:col-span-2">
              <Field label="Address" icon={<MapPin size={16} />} value={form.address} onChange={v => setForm({ ...form, address: v })} textarea placeholder="Street, City, Postal Code" />
            </div>
          </div>

          <div className="flex flex-col xs:flex-row justify-end gap-2 sm:gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { if (user) { setForm({ name: user.name || '', username: user.username || '', email: user.email || '', phone: user.phone || '', address: user.address || '' }); setAvatar(user.image || DEFAULT_AVATAR); } }} className="px-4 sm:px-5 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm order-2 xs:order-1">Reset</button>
            <button type="submit" disabled={saving} className="px-4 sm:px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:from-[#2BAEE8] hover:to-[#1A7FE8] shadow-lg shadow-purple-200 flex items-center justify-center gap-2 text-sm order-1 xs:order-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* System Settings */}
      <section className="mt-4 sm:mt-6">
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

      {/* Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
            <div className="p-4 sm:p-5 border-b flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 text-sm sm:text-base">Change Password</h4>
                <p className="text-xs sm:text-sm text-gray-500">Use a strong, unique password</p>
              </div>
              <button onClick={() => setPwModal(false)} className="text-gray-400 hover:text-gray-600 text-xl p-1">×</button>
            </div>
            <form onSubmit={handlePassword} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              {pwStatus && <Banner type={pwStatus.type} message={pwStatus.msg} />}
              <div className="space-y-2 sm:space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Current Password</label><input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} /></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">New Password</label><input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} placeholder="Min 6 characters" /></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Confirm Password</label><input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
              </div>
              <div className="flex flex-col-reverse xs:flex-row justify-end gap-2 sm:gap-3 pt-2">
                <button type="button" onClick={() => setPwModal(false)} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-sm">Save</button>
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
        title={galleryTarget === 'avatar' ? 'Select Profile Photo' : 'Select Shop Logo'}
      />
    </div>
  );
};

export default AdminSettings;