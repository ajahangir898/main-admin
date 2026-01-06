import React from 'react';
import { 
  Building2, DollarSign, ShoppingCart, Users, PieChart,
  Plus, Filter, UserPlus, Download, RefreshCw, Mail, Shield,
  Eye, Edit, ExternalLink, Crown, Rocket
} from 'lucide-react';
import StatsCard from './StatsCard';
import ServerMetric from './ServerMetric';
import QuickActionButton from './QuickActionButton';
import { SystemStats, TenantStats, Activity } from './types';
import { formatCurrency, getPlanBadge, getStatusBadge } from './utils';

interface OverviewTabProps {
  systemStats: SystemStats;
  topTenants: TenantStats[];
  recentActivities: Activity[];
  onViewAllTenants: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  systemStats,
  topTenants,
  recentActivities,
  onViewAllTenants
}) => {
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        <StatsCard
          title="Total Tenants"
          value={systemStats.totalTenants}
          change={12}
          changeType="increase"
          icon={Building2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          subtitle={`${systemStats.activeTenants} active`}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(systemStats.monthlyRevenue)}
          change={8.5}
          changeType="increase"
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          subtitle="vs last month"
        />
        <StatsCard
          title="Total Orders"
          value={systemStats.totalOrders.toLocaleString()}
          change={15}
          changeType="increase"
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtitle="All tenants"
        />
        <StatsCard
          title="Active Users"
          value={systemStats.totalUsers.toLocaleString()}
          change={-2.3}
          changeType="decrease"
          icon={Users}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          subtitle="Last 7 days"
        />
      </div>

      {/* Pie Chart & Server Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Subscription Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Subscription Distribution</h3>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* SVG Pie Chart */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Enterprise - 35% */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray="87.96 251.33"
                  strokeDashoffset="0"
                  className="transition-all duration-500"
                />
                {/* Growth - 45% */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#14b8a6"
                  strokeWidth="20"
                  strokeDasharray="113.1 251.33"
                  strokeDashoffset="-87.96"
                  className="transition-all duration-500"
                />
                {/* Starter - 20% */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#334155"
                  strokeWidth="20"
                  strokeDasharray="50.27 251.33"
                  strokeDashoffset="-201.06"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">{systemStats.totalTenants}</span>
                <span className="text-xs text-slate-500">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-row sm:flex-col gap-3 sm:gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Enterprise</p>
                  <p className="text-xs text-slate-500">35% (55)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Growth</p>
                  <p className="text-xs text-slate-500">45% (70)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Starter</p>
                  <p className="text-xs text-slate-500">20% (31)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Server Status</h3>
            <span className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">All Systems Operational</span>
              <span className="sm:hidden">Online</span>
            </span>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <ServerMetric label="CPU Usage" value={systemStats.serverLoad} color="violet" />
            <ServerMetric label="Memory" value={systemStats.memoryUsage} color="blue" />
            <ServerMetric label="Disk Space" value={systemStats.diskUsage} color="emerald" />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs sm:text-sm text-slate-600">Uptime</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">{systemStats.uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4 sm:mb-6 text-sm sm:text-base">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <QuickActionButton icon={Plus} label="Add Tenant" color="violet" />
            <QuickActionButton icon={UserPlus} label="Add User" color="blue" />
            <QuickActionButton icon={Download} label="Export" color="emerald" />
            <QuickActionButton icon={RefreshCw} label="Cache" color="amber" />
            <QuickActionButton icon={Mail} label="Broadcast" color="pink" />
            <QuickActionButton icon={Shield} label="Security" color="red" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Recent Activity</h3>
            <button className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All</button>
          </div>
          <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                  activity.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                  activity.type === 'upgrade' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  <activity.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-700 truncate">{activity.message}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Tenants Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Top Performing Tenants</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Based on revenue and orders</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 sm:gap-2">
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Filter
              </button>
              <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 sm:gap-2">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Tenant</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Tenants - Desktop Table / Mobile Cards */}
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full hidden md:table">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Revenue</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Users</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Last Active</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0">
                        {tenant.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm lg:text-base truncate">{tenant.name}</p>
                        <p className="text-xs lg:text-sm text-slate-500 truncate">{tenant.subdomain}.systemnextit.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                      {tenant.plan === 'enterprise' && <Crown className="w-3 h-3" />}
                      {tenant.plan === 'growth' && <Rocket className="w-3 h-3" />}
                      <span className="hidden lg:inline">{tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}</span>
                      <span className="lg:hidden">{tenant.plan.charAt(0).toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' : tenant.status === 'trialing' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      <span className="hidden lg:inline">{tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}</span>
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className="text-xs lg:text-sm font-medium text-slate-900">{tenant.totalOrders.toLocaleString()}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(tenant.totalRevenue)}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{tenant.activeUsers}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 hidden xl:table-cell">
                    <span className="text-sm text-slate-500">{tenant.lastActivity}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                    <div className="flex items-center justify-end gap-1 lg:gap-2">
                      <button className="p-1.5 lg:p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <button className="p-1.5 lg:p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <Edit className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <button className="p-1.5 lg:p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <ExternalLink className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-slate-200">
            {topTenants.map((tenant) => (
              <div key={tenant.id} className="p-4 hover:bg-slate-50 transition-colors">
                {/* Tenant Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{tenant.name}</p>
                      <p className="text-xs text-slate-500 truncate">{tenant.subdomain}.systemnextit.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Plan</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                      {tenant.plan === 'enterprise' && <Crown className="w-3 h-3" />}
                      {tenant.plan === 'growth' && <Rocket className="w-3 h-3" />}
                      {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' : tenant.status === 'trialing' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Orders</p>
                    <p className="text-sm font-semibold text-slate-900">{tenant.totalOrders.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Revenue</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(tenant.totalRevenue)}</p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{tenant.activeUsers} users</span>
                  </div>
                  <span className="text-xs text-slate-400">{tenant.lastActivity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-slate-500">Showing {topTenants.length} of {systemStats.totalTenants} tenants</p>
          <button 
            onClick={onViewAllTenants}
            className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            View All Tenants →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
