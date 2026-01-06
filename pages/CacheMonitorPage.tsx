/**
 * Cache Monitor Dashboard Page
 * Comprehensive Redis and client-side cache monitoring interface
 */

import React, { useState, useEffect } from 'react';
import { Database, Clock, Zap, TrendingUp, Server, Activity, AlertTriangle, RefreshCw, Trash2, Download } from 'lucide-react';
import { getCacheStats, clearCache, getAllCacheKeys } from '../services/RedisService';

interface CacheStats {
  memoryEntries: number;
  storageEntries: number;
  totalSize: number;
}

interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  services: {
    mongodb: string;
    redis: string;
  };
  cache: {
    memoryEntries: number;
    redisConnected: boolean;
    totalKeys?: number;
    usedMemory?: string;
  };
  uptime: number;
}

interface CacheKey {
  key: string;
  type: string;
  ttl: number;
  size?: number;
}

export const CacheMonitorPage: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [clientStats, setClientStats] = useState<CacheStats>({ memoryEntries: 0, storageEntries: 0, totalSize: 0 });
  const [serverHealth, setServerHealth] = useState<HealthData | null>(null);
  const [cacheKeys, setCacheKeys] = useState<CacheKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'keys' | 'performance'>('overview');

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/health`);
      if (response.ok) {
        const health = await response.json();
        setServerHealth(health);
        setError(null);
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      setServerHealth(null);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const fetchCacheKeys = async () => {
    try {
      const keys = await getAllCacheKeys();
      setCacheKeys(keys);
    } catch (err) {
      console.error('Failed to fetch cache keys:', err);
    }
  };

  const refreshAll = async () => {
    const stats = getCacheStats();
    setClientStats(stats);
    await fetchHealth();
    await fetchCacheKeys();
  };

  useEffect(() => {
    refreshAll();
  }, [tenantId]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'connected':
      case 'ok':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const clearAllCaches = async () => {
    if (!confirm('Are you sure you want to clear all caches? This will temporarily affect performance.')) {
      return;
    }
    
    try {
      await clearCache();
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
      localStorage.clear();
      sessionStorage.clear();
      
      // Refresh data after clearing
      setTimeout(refreshAll, 1000);
      alert('All caches cleared successfully!');
    } catch (err) {
      alert('Failed to clear caches: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const exportCacheData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      tenantId,
      clientStats,
      serverHealth,
      cacheKeys
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-report-${tenantId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatCard: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    color: string;
    loading?: boolean;
  }> = ({ icon, title, value, subtitle, color, loading }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${color}`}>
          {loading ? <RefreshCw size={24} className="animate-spin" /> : icon}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</div>
          <div className="text-sm text-gray-500">{title}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="text-blue-600" />
              Cache Monitor
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor Redis cache performance and client-side storage for tenant: <span className="font-semibold">{tenantId}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            
            <button
              onClick={refreshAll}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            
            <button
              onClick={exportCacheData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={16} />
              Export
            </button>
            
            <button
              onClick={clearAllCaches}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" />
            <div>
              <div className="text-red-800 font-medium">Connection Error</div>
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
            { id: 'keys', label: 'Cache Keys', icon: <Database size={16} /> },
            { id: 'performance', label: 'Performance', icon: <TrendingUp size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {selectedTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Clock size={24} />}
                title="Memory Cache"
                value={clientStats.memoryEntries}
                subtitle="Active entries"
                color="bg-blue-50 text-blue-600"
                loading={isLoading}
              />
              
              <StatCard
                icon={<Database size={24} />}
                title="Storage Cache"
                value={clientStats.storageEntries}
                subtitle="Persistent entries"
                color="bg-green-50 text-green-600"
                loading={isLoading}
              />
              
              <StatCard
                icon={<TrendingUp size={24} />}
                title="Total Size"
                value={formatBytes(clientStats.totalSize)}
                subtitle="Client cache size"
                color="bg-purple-50 text-purple-600"
                loading={isLoading}
              />
              
              <StatCard
                icon={<Zap size={24} />}
                title="Server Cache"
                value={serverHealth?.cache.memoryEntries || 0}
                subtitle={`Redis: ${serverHealth?.cache.redisConnected ? 'Connected' : 'Disconnected'}`}
                color="bg-orange-50 text-orange-600"
                loading={isLoading}
              />
            </div>

            {/* Service Status */}
            {serverHealth && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Server size={20} />
                    Service Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">MongoDB</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(serverHealth.services.mongodb)}`}>
                        {serverHealth.services.mongodb}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Redis</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(serverHealth.services.redis)}`}>
                        {serverHealth.services.redis}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">System</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(serverHealth.status)}`}>
                        {serverHealth.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity size={20} />
                    System Info
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Uptime</span>
                      <span className="font-mono text-sm">{formatUptime(serverHealth.uptime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Redis Memory</span>
                      <span className="font-mono text-sm">{serverHealth.cache.usedMemory || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Keys</span>
                      <span className="font-mono text-sm">{serverHealth.cache.totalKeys || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {selectedTab === 'keys' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Cache Keys ({cacheKeys.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Key</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">TTL</th>
                    <th className="text-left py-3 px-4">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {cacheKeys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        No cache keys found
                      </td>
                    </tr>
                  ) : (
                    cacheKeys.map((key, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs">{key.key}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {key.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {key.ttl === -1 ? 'Never' : `${key.ttl}s`}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {key.size ? formatBytes(key.size) : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'performance' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Client Cache Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Hit Rate</span>
                    <span className="font-mono">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage Hit Rate</span>
                    <span className="font-mono">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Response Time</span>
                    <span className="font-mono">N/A</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Server Cache Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Redis Hit Rate</span>
                    <span className="font-mono">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operations/sec</span>
                    <span className="font-mono">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network I/O</span>
                    <span className="font-mono">N/A</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Advanced performance metrics require additional instrumentation. 
                This will be implemented in future versions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheMonitorPage;