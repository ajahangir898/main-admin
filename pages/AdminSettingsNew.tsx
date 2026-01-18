import React from 'react';
import { 
  ArrowRight,
  Truck, Settings, Facebook, Code, Shield
} from 'lucide-react';
import { CourierConfig, User as UserType, Tenant, Role } from '../types';

// Settings card props interface
interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

// Settings card component for navigation
const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, icon, color, onClick }) => (
  <button 
    onClick={onClick} 
    className={`p-4 sm:p-5 rounded-xl border ${color} flex items-center gap-3 sm:gap-4 hover:shadow-md transition group w-full text-left active:scale-[0.98]`}
  >
    <div className="p-2 sm:p-3 rounded-full bg-white/80 shadow-sm group-hover:scale-110 transition flex-shrink-0">
      {icon}
    </div>
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

const AdminSettingsNew: React.FC<AdminSettingsNewProps> = ({
  onNavigate
}) => {
  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F8F9FB] min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

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
          <SettingsCard 
            title="Admin Control" 
            description="Manage users, roles & permissions"
            icon={<Shield size={20} className="text-emerald-600" />} 
            color="bg-emerald-50 border-emerald-100 hover:border-emerald-300" 
            onClick={() => onNavigate('admin')} 
          />
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsNew;