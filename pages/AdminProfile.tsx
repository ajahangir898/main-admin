import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, Mail, Phone, MapPin, Camera, Save, RotateCcw, Lock, 
  CheckCircle, AlertCircle, FolderOpen, Loader2, AtSign, Shield, Clock, ArrowRight
} from 'lucide-react';
import { User, Tenant } from '../types';
import { convertFileToWebP } from '../services/imageUtils';
import { GalleryPicker } from '../components/GalleryPicker';

interface AdminProfileProps {
  user?: User | null;
  onUpdateProfile?: (updatedUser: User) => void;
  activeTenant?: Tenant | null;
}

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjxwYXRoIGQ9Ik00IDIwYzAtNCA0LTggOC04czggNCA4IDgiLz48L3N2Zz4=';

const formatRole = (role?: User['role']) => 
  ({ super_admin: 'Super Admin', tenant_admin: 'Tenant Admin', admin: 'Admin', staff: 'Staff', customer: 'Customer' }[role || 'admin'] || 'Admin');

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A';

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

const AdminProfile: React.FC<AdminProfileProps> = ({ user, onUpdateProfile, activeTenant }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', address: '' });
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', username: user.username || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
      setAvatar(user.image || DEFAULT_AVATAR);
    }
  }, [user]);

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

  const handleGallerySelect = (imageUrl: string) => {
    setAvatar(imageUrl);
    showStatus('success', 'Photo selected - save to apply');
    setIsGalleryOpen(false);
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

  const handleReset = () => {
    if (user) {
      setForm({ name: user.name || '', username: user.username || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
      setAvatar(user.image || DEFAULT_AVATAR);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Details</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your personal information and settings</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            type="button" 
            onClick={handleReset} 
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            type="submit" 
            form="profile-form"
            disabled={saving} 
            className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 shadow-lg shadow-purple-200 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <form id="profile-form" onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {status && <Banner type={status.type} message={status.msg} />}

          {/* Profile Avatar Section */}
          <div className="flex flex-col items-center pb-5 sm:pb-6 border-b border-gray-100">
            <div className="relative mb-4">
              <img src={avatar} alt="Profile" className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-gray-100 bg-gray-50 shadow-md" />
              <div className="absolute -bottom-2 -right-2 flex gap-1.5">
                <button 
                  type="button"
                  onClick={() => setIsGalleryOpen(true)} 
                  className="bg-white border border-gray-200 text-gray-600 rounded-full p-2 shadow-md hover:scale-105 transition" 
                  title="Choose from Gallery"
                >
                  <FolderOpen size={16} />
                </button>
                <button 
                  type="button"
                  onClick={() => fileRef.current?.click()} 
                  className="bg-purple-600 text-white rounded-full p-2 shadow-md hover:bg-purple-700 hover:scale-105 transition" 
                  title="Upload new"
                >
                  {avatarLoading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">{formatRole(user?.role)}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{form.name || 'Admin'}</h3>
            <p className="text-gray-500 text-sm">{form.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Shield size={12} /> {user?.roleId ? 'Custom Role' : 'Full Access'}
              </span>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock size={12} /> Since {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Full Name" icon={<UserIcon size={16} />} value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="John Doe" />
            <Field label="Username" icon={<AtSign size={16} />} value={form.username} onChange={v => setForm({ ...form, username: v.toLowerCase().replace(/\s/g, '') })} placeholder="johndoe" />
            <Field label="Phone" icon={<Phone size={16} />} value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+880 1XXX-XXXXXX" />
            <Field label="Email" icon={<Mail size={16} />} value={form.email} readOnly />
            <div className="sm:col-span-2">
              <Field label="Address" icon={<MapPin size={16} />} value={form.address} onChange={v => setForm({ ...form, address: v })} textarea placeholder="Street, City, Postal Code, Country" />
            </div>
          </div>
        </form>

        {/* Change Password Section */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
          <button 
            onClick={() => setPwModal(true)} 
            className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <Lock size={18} className="text-gray-500" /> 
              Change Password
            </span>
            <ArrowRight size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
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
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Current Password</label>
                  <input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">New Password</label>
                  <input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Confirm Password</label>
                  <input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col-reverse xs:flex-row justify-end gap-2 sm:gap-3 pt-2">
                <button type="button" onClick={() => setPwModal(false)} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Picker */}
      <GalleryPicker
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
        title="Select Profile Photo"
      />
    </div>
  );
};

export default AdminProfile;
