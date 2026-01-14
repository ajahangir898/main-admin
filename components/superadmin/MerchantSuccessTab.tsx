import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Activity, Users,
  DollarSign, ShoppingCart, Clock, CheckCircle2, XCircle,
  Filter, Search, Eye, Phone, Mail, MessageSquare, Calendar,
  ChevronRight, AlertCircle, UserX, RefreshCw, Bell, Target,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { MerchantHealth, MerchantAlert, AtRiskMerchant } from './types';
import { Tenant } from '../../types';

interface MerchantSuccessTabProps {
  merchantHealth: MerchantHealth[];
  atRiskMerchants: AtRiskMerchant[];
  tenants: Tenant[];
  onAcknowledgeAlert: (merchantId: string, alertId: string) => Promise<void>;
  onContactMerchant: (merchantId: string, method: 'email' | 'phone' | 'message') => Promise<void>;
  onScheduleFollowUp: (merchantId: string, date: string) => Promise<void>;
  onUpdateMerchantStatus: (merchantId: string, status: AtRiskMerchant['status']) => Promise<void>;
  onAddNote: (merchantId: string, note: string) => Promise<void>;
}

const riskLevelConfig = {
  healthy: { label: 'Healthy', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  at_risk: { label: 'At Risk', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle }
};

const alertTypeConfig = {
  no_login: { label: 'No Login', icon: UserX, color: 'text-orange-600 bg-orange-50' },
  sales_drop: { label: 'Sales Drop', icon: TrendingDown, color: 'text-red-600 bg-red-50' },
  no_orders: { label: 'No Orders', icon: ShoppingCart, color: 'text-amber-600 bg-amber-50' },
  subscription_expiring: { label: 'Subscription Expiring', icon: Clock, color: 'text-purple-600 bg-purple-50' },
  high_refund_rate: { label: 'High Refunds', icon: RefreshCw, color: 'text-red-600 bg-red-50' },
  low_inventory: { label: 'Low Inventory', icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' }
};

const MerchantSuccessTab: React.FC<MerchantSuccessTabProps> = ({
  merchantHealth,
  atRiskMerchants,
  onAcknowledgeAlert,
  onContactMerchant,
  onScheduleFollowUp,
  onUpdateMerchantStatus,
  onAddNote
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'at-risk' | 'alerts'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantHealth | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [noteText, setNoteText] = useState('');

  // Calculate stats
  const stats = {
    total: merchantHealth.length,
    healthy: merchantHealth.filter(m => m.riskLevel === 'healthy').length,
    atRisk: merchantHealth.filter(m => m.riskLevel === 'at_risk').length,
    critical: merchantHealth.filter(m => m.riskLevel === 'critical').length,
    avgHealthScore: Math.round(merchantHealth.reduce((acc, m) => acc + m.healthScore, 0) / merchantHealth.length) || 0,
    totalAlerts: merchantHealth.reduce((acc, m) => acc + m.alerts.filter(a => !a.acknowledged).length, 0)
  };

  // Filter merchants
  const filteredMerchants = merchantHealth.filter(merchant => {
    const matchesSearch = 
      merchant.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.tenantSubdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'all' || merchant.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  // Get all unacknowledged alerts
  const allAlerts = merchantHealth.flatMap(m => 
    m.alerts.filter(a => !a.acknowledged).map(a => ({ ...a, merchant: m }))
  ).sort((a, b) => (a.severity === 'critical' ? -1 : 1));

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getSalesTrendIcon = (trend: MerchantHealth['salesTrend']) => {
    switch (trend) {
      case 'growing': return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'declining': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-slate-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-7 h-7 text-emerald-500" />
            Merchant Success
          </h2>
          <p className="text-slate-600 mt-1">Monitor merchant health and identify at-risk accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('at-risk')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeView === 'at-risk'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            At Risk
            {stats.atRisk + stats.critical > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.atRisk + stats.critical}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeView === 'alerts'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Alerts
            {stats.totalAlerts > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {stats.totalAlerts}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Healthy</p>
              <p className="text-xl font-bold text-green-600">{stats.healthy}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600">At Risk</p>
              <p className="text-xl font-bold text-amber-600">{stats.atRisk}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600">Critical</p>
              <p className="text-xl font-bold text-red-600">{stats.critical}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Score</p>
              <p className={`text-xl font-bold ${getHealthScoreColor(stats.avgHealthScore)}`}>{stats.avgHealthScore}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Open Alerts</p>
              <p className="text-xl font-bold text-amber-600">{stats.totalAlerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Left Panel - Merchant List */}
        <div className="flex-1">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search merchants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Risk Levels</option>
              <option value="healthy">Healthy</option>
              <option value="at_risk">At Risk</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* View Content */}
          {activeView === 'alerts' ? (
            /* Alerts View */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Active Alerts ({allAlerts.length})</h3>
              </div>
              {allAlerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">All Clear!</h3>
                  <p className="text-slate-500">No active alerts at the moment</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {allAlerts.map((alert, idx) => {
                    const config = alertTypeConfig[alert.type];
                    return (
                      <div key={`${alert.merchant.tenantId}-${alert.id}-${idx}`} className="p-4 hover:bg-slate-50">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <config.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                alert.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {alert.severity}
                              </span>
                              <span className="text-xs text-slate-500">{alert.triggeredAt}</span>
                            </div>
                            <p className="font-medium text-slate-800">{alert.message}</p>
                            <p className="text-sm text-slate-500 mt-1">
                              {alert.merchant.tenantName} ({alert.merchant.tenantSubdomain})
                            </p>
                          </div>
                          <button
                            onClick={() => onAcknowledgeAlert(alert.merchant.tenantId, alert.id)}
                            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Merchant Health List */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {filteredMerchants.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No merchants found</h3>
                  <p className="text-slate-500">No merchants match your search criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Merchant</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Health</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Last Login</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Sales Trend</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Alerts</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMerchants.map(merchant => {
                        const risk = riskLevelConfig[merchant.riskLevel];
                        const RiskIcon = risk.icon;
                        const unacknowledgedAlerts = merchant.alerts.filter(a => !a.acknowledged).length;

                        return (
                          <tr
                            key={merchant.tenantId}
                            className={`hover:bg-slate-50 cursor-pointer ${
                              selectedMerchant?.tenantId === merchant.tenantId ? 'bg-emerald-50' : ''
                            }`}
                            onClick={() => setSelectedMerchant(merchant)}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-800">{merchant.tenantName}</p>
                                <p className="text-xs text-slate-500">{merchant.tenantSubdomain} • {merchant.plan}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getHealthScoreBg(merchant.healthScore)}`}
                                    style={{ width: `${merchant.healthScore}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-semibold ${getHealthScoreColor(merchant.healthScore)}`}>
                                  {merchant.healthScore}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${risk.color}`}>
                                <RiskIcon className="w-3 h-3" />
                                {risk.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm">
                                <p className={`${merchant.daysSinceLastLogin > 7 ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                  {merchant.daysSinceLastLogin === 0 ? 'Today' : `${merchant.daysSinceLastLogin}d ago`}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getSalesTrendIcon(merchant.salesTrend)}
                                <span className={`text-sm ${
                                  merchant.salesChangePercent > 0 ? 'text-green-600' :
                                  merchant.salesChangePercent < 0 ? 'text-red-600' : 'text-slate-500'
                                }`}>
                                  {merchant.salesChangePercent > 0 ? '+' : ''}{merchant.salesChangePercent}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {unacknowledgedAlerts > 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                  {unacknowledgedAlerts}
                                </span>
                              ) : (
                                <span className="text-green-500">
                                  <CheckCircle2 className="w-5 h-5 mx-auto" />
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Merchant Detail */}
        {selectedMerchant && activeView !== 'alerts' && (
          <div className="w-[380px] bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* Merchant Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{selectedMerchant.tenantName}</h3>
                  <p className="text-sm text-slate-500">{selectedMerchant.tenantSubdomain}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full border ${riskLevelConfig[selectedMerchant.riskLevel].color}`}>
                  {riskLevelConfig[selectedMerchant.riskLevel].label}
                </span>
              </div>

              {/* Health Score */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Health Score</span>
                  <span className={`text-2xl font-bold ${getHealthScoreColor(selectedMerchant.healthScore)}`}>
                    {selectedMerchant.healthScore}/100
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getHealthScoreBg(selectedMerchant.healthScore)} transition-all`}
                    style={{ width: `${selectedMerchant.healthScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 border-b border-slate-200 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  This Month
                </div>
                <p className="font-bold text-slate-800">৳{selectedMerchant.currentMonthRevenue.toLocaleString()}</p>
                <p className={`text-xs ${selectedMerchant.salesChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedMerchant.salesChangePercent >= 0 ? '+' : ''}{selectedMerchant.salesChangePercent}% vs last month
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <ShoppingCart className="w-3 h-3" />
                  Orders (30d)
                </div>
                <p className="font-bold text-slate-800">{selectedMerchant.totalOrders30Days}</p>
                <p className="text-xs text-slate-500">
                  vs {selectedMerchant.totalOrdersPrevious30Days} prev
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  Last Login
                </div>
                <p className={`font-bold ${selectedMerchant.daysSinceLastLogin > 7 ? 'text-red-600' : 'text-slate-800'}`}>
                  {selectedMerchant.daysSinceLastLogin === 0 ? 'Today' : `${selectedMerchant.daysSinceLastLogin} days ago`}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <BarChart3 className="w-3 h-3" />
                  Products
                </div>
                <p className="font-bold text-slate-800">{selectedMerchant.activeProducts}</p>
                <p className="text-xs text-slate-500">active</p>
              </div>
            </div>

            {/* Active Alerts */}
            {selectedMerchant.alerts.filter(a => !a.acknowledged).length > 0 && (
              <div className="p-4 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Active Alerts</h4>
                <div className="space-y-2">
                  {selectedMerchant.alerts.filter(a => !a.acknowledged).map(alert => {
                    const config = alertTypeConfig[alert.type];
                    return (
                      <div key={alert.id} className={`flex items-start gap-2 p-2 rounded-lg ${config.color}`}>
                        <config.icon className="w-4 h-4 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs opacity-75">{alert.triggeredAt}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledgeAlert(selectedMerchant.tenantId, alert.id);
                          }}
                          className="text-xs underline hover:no-underline"
                        >
                          Ack
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 border-b border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onContactMerchant(selectedMerchant.tenantId, 'email')}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => onContactMerchant(selectedMerchant.tenantId, 'phone')}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button
                  onClick={() => onContactMerchant(selectedMerchant.tenantId, 'message')}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>
            </div>

            {/* Schedule Follow-up */}
            <div className="p-4 border-b border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Schedule Follow-up</h4>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={() => {
                    if (followUpDate) {
                      onScheduleFollowUp(selectedMerchant.tenantId, followUpDate);
                      setFollowUpDate('');
                    }
                  }}
                  disabled={!followUpDate}
                  className="px-3 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] disabled:opacity-50 text-sm"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add Note */}
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Add Note</h4>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add internal notes about this merchant..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
              <button
                onClick={() => {
                  if (noteText.trim()) {
                    onAddNote(selectedMerchant.tenantId, noteText);
                    setNoteText('');
                  }
                }}
                disabled={!noteText.trim()}
                className="mt-2 w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 text-sm"
              >
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantSuccessTab;
