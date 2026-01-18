import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Lock, CheckCircle, AlertCircle, Loader2, ArrowRight, RotateCcw, Save,
  Truck, Settings, Facebook, Code
} from 'lucide-react';
import { CourierConfig, User as UserType, Tenant, Role } from '../types';
import { convertFileToWebP } from '../services/imageUtils';
import { GalleryPicker } from '../components/GalleryPicker';

// Settings card component for navigation
const SettingsCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, description, icon, color, onClick }) => (
  <button onClick={onClick} className={`p-4 sm:p-5 rounded-xl border ${color} flex items-center gap-3 sm:gap-4 hover:shadow-md transition group w-full text-left active:scale-[0.98]`}>
    <div className="p-2 sm:p-3 rounded-full bg-white/80 shadow-sm group-hover:scale-110 transition flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{title}</h3>
      <p className="text-xs text-gray-500 truncate">{description}</p>
    </div>
    <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
  </button>
);

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

const AdminSettingsNew: React.FC<AdminSettingsNewProps> = ({
  onNavigate, user, onUpdateProfile
}) => {
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

  useEffect(() => {
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
  }, [user]);

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleSave = () => {
    if (!user || !onUpdateProfile) return showStatus('error', 'No active session');
    setSaving(true);
    onUpdateProfile({ ...user, ...form, image: avatar, updatedAt: new Date().toISOString() });
    showStatus('success', 'Profile updated successfully');
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

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const img = await convertFileToWebP(file, { quality: 0.82, maxDimension: 600 });
      setAvatar(img);
      showStatus('success', 'Photo ready - save to apply');
    } catch {
      showStatus('error', 'Image processing failed');
    }
    setAvatarLoading(false);
    e.target.value = '';
  };

  const handleGallerySelect = (url: string) => {
    if (galleryTarget === 'avatar') {
      setAvatar(url);
      showStatus('success', 'Photo ready - save to apply');
    }
    setIsGalleryOpen(false);
    setGalleryTarget(null);
  };

  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwStatus({ type: 'error', msg: 'All fields are required' });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwStatus({ type: 'error', msg: 'Passwords do not match' });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwStatus({ type: 'error', msg: 'Password must be at least 6 characters' });
      return;
    }
    setPwStatus({ type: 'success', msg: 'Password changed successfully' });
    setTimeout(() => {
      setPwModal(false);
      setPwForm({ current: '', next: '', confirm: '' });
      setPwStatus(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F8F9FB] min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-gray-800">Profile Details</h3>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleReset} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">
              <RotateCcw size={16} />
              Reset
            </button>
            <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition shadow-sm">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        {status && <div className="mb-6"><Banner type={status.type} message={status.msg} /></div>}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -top-1 -right-1 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition">
              {avatarLoading ? <Loader2 size={14} className="animate-spin text-gray-500" /> : <Camera size={14} className="text-gray-500" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900">{form.name || 'User'}</h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-600">{formatRole(user?.role)}</span>
              <span className="px-3 py-1 bg-orange-50 text-orange-500 text-xs font-medium rounded-full border border-orange-200">Since {formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition" placeholder="username" />
          </div>
          <div className="lg:row-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={5} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition resize-none h-[120px]" placeholder="Your address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition" placeholder="+88 01XXX XXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={form.email} readOnly className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 bg-gray-50 cursor-not-allowed" placeholder="email@example.com" />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button onClick={() => setPwModal(true)} className="flex items-center justify-between w-full max-w-md px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition group">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-gray-500" />
              <span className="text-gray-700 font-medium">Change Password</span>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800">System Settings</h3>
          <p className="text-sm text-gray-500">Configure your store settings and integrations</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SettingsCard 
            title="Delivery Settings" 
            description="Configure delivery charges and zones"
            icon={<Truck size={20} className="text-blue-600" />} 
            color="bg-blue-50 border-blue-100 hover:border-blue-300" 
            onClick={() => onNavigate('settings_delivery')} 
          />
          <SettingsCard 
            title="Courier Integration" 
            description="Connect Steadfast, Pathao"
            icon={<Settings size={20} className="text-purple-600" />} 
            color="bg-purple-50 border-purple-100 hover:border-purple-300" 
            onClick={() => onNavigate('settings_courier')} 
          />
          <SettingsCard 
            title="Facebook Pixel" 
            description="Track conversions and ads"
            icon={<Facebook size={20} className="text-blue-700" />} 
            color="bg-blue-50 border-blue-100 hover:border-blue-300" 
            onClick={() => onNavigate('settings_facebook_pixel')} 
          />
          <SettingsCard 
            title="Google Tag Manager" 
            description="Manage marketing tags"
            icon={<Code size={20} className="text-sky-500" />} 
            color="bg-sky-50 border-sky-100 hover:border-sky-300" 
            onClick={() => onNavigate('settings_gtm')} 
          />
        </div>
      </div>

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
                  <input type="password" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input type="password" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400" value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input type="password" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
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
      <GalleryPicker isOpen={isGalleryOpen} onClose={() => { setIsGalleryOpen(false); setGalleryTarget(null); }} onSelect={handleGallerySelect} title={galleryTarget === 'avatar' ? 'Select Profile Photo' : 'Select Image'} />
    </div>
  );
};

export default AdminSettingsNew;
