import React from 'react';
import { 
  LayoutDashboard, Users, Building2, ShoppingCart, CreditCard,
  BarChart3, Server, Database, Shield, Settings, ChevronDown, Crown,
  Bell, Palette, MessageCircle, Globe, Megaphone, LifeBuoy, Target, Activity, ListChecks, Video
} from 'lucide-react';
import NavItem from './NavItem';
import { TabType } from './types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  totalTenants: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  totalTenants
}) => {
  return (
    <aside className={`${sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'} bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-40`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        {sidebarOpen && (
          <div className="ml-3">
            <h1 className="font-bold text-lg">Super Admin</h1>
            <p className="text-xs text-slate-400">SystemNext IT</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <NavItem 
          icon={LayoutDashboard} 
          label="Overview" 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Building2} 
          label="Tenants" 
          active={activeTab === 'tenants'} 
          onClick={() => setActiveTab('tenants')} 
          collapsed={!sidebarOpen} 
          badge={totalTenants} 
        />
        <NavItem 
          icon={Users} 
          label="All Users" 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={ShoppingCart} 
          label="All Orders" 
          active={activeTab === 'orders'} 
          onClick={() => setActiveTab('orders')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={CreditCard} 
          label="Subscriptions" 
          active={activeTab === 'subscriptions'} 
          onClick={() => setActiveTab('subscriptions')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={BarChart3} 
          label="Analytics" 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={ListChecks} 
          label="Bulk Operations" 
          active={activeTab === 'bulk-operations'} 
          onClick={() => setActiveTab('bulk-operations')} 
          collapsed={!sidebarOpen} 
        />

        <div className="pt-4 pb-2">
          {sidebarOpen && <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuration</p>}
        </div>

        <NavItem 
          icon={Palette} 
          label="Theme Config" 
          active={activeTab === 'theme-config'} 
          onClick={() => setActiveTab('theme-config')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={MessageCircle} 
          label="Chat Config" 
          active={activeTab === 'chat-config'} 
          onClick={() => setActiveTab('chat-config')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Globe} 
          label="Website Config" 
          active={activeTab === 'website-config'} 
          onClick={() => setActiveTab('website-config')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Bell} 
          label="Notifications" 
          active={activeTab === 'notifications'} 
          onClick={() => setActiveTab('notifications')} 
          collapsed={!sidebarOpen} 
        />

        <div className="pt-4 pb-2">
          {sidebarOpen && <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Communication & CRM</p>}
        </div>

        <NavItem 
          icon={Megaphone} 
          label="Announcements" 
          active={activeTab === 'announcements'} 
          onClick={() => setActiveTab('announcements')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={LifeBuoy} 
          label="Support Tickets" 
          active={activeTab === 'support-tickets'} 
          onClick={() => setActiveTab('support-tickets')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Target} 
          label="Merchant Success" 
          active={activeTab === 'merchant-success'} 
          onClick={() => setActiveTab('merchant-success')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Video} 
          label="Tutorials" 
          active={activeTab === 'tutorials'} 
          onClick={() => setActiveTab('tutorials')} 
          collapsed={!sidebarOpen} 
        />
        
        <div className="pt-4 pb-2">
          {sidebarOpen && <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</p>}
        </div>
        
        <NavItem 
          icon={Activity} 
          label="System Health" 
          active={activeTab === 'system-health'} 
          onClick={() => setActiveTab('system-health')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Shield} 
          label="Audit Logs" 
          active={activeTab === 'audit-logs'} 
          onClick={() => setActiveTab('audit-logs')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Server} 
          label="Server Status" 
          active={activeTab === 'server'} 
          onClick={() => setActiveTab('server')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Database} 
          label="Database" 
          active={activeTab === 'database'} 
          onClick={() => setActiveTab('database')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Shield} 
          label="Security" 
          active={activeTab === 'security'} 
          onClick={() => setActiveTab('security')} 
          collapsed={!sidebarOpen} 
        />
        <NavItem 
          icon={Settings} 
          label="Settings" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          collapsed={!sidebarOpen} 
        />
      </nav>

      {/* Collapse Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="h-12 border-t border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        <ChevronDown className={`w-5 h-5 transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'} transition-transform`} />
      </button>
    </aside>
  );
};

export default Sidebar;
