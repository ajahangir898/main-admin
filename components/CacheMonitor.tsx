/**
 * Redis Cache Monitoring Component
 * Shows cache performance statistics for debugging
 */

import React, { useState, useEffect } from 'react';
import { getCacheStats } from '../services/RedisService';
import { Database, Clock, Zap, TrendingUp } from 'lucide-react';

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
  };
}

export const CacheMonitor: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [clientStats, setClientStats] = useState<CacheStats>({ memoryEntries: 0, storageEntries: 0, totalSize: 0 });
  const [serverHealth, setServerHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
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
    }
  };

  useEffect(() => {
    // Update client stats
    const updateClientStats = () => {
      const stats = getCacheStats();
      setClientStats(stats);
    };

    // Initial fetch
    updateClientStats();
    fetchHealth();

    // Update every 5 seconds
    const interval = setInterval(() => {
      updateClientStats();
      fetchHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'connected':
      case 'ok':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database size={20} />
          Cache Monitor
        </h3>
        {error && (
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
            {error}
          </span>
        )}
      </div>

      {/* Server Health */}
      {serverHealth && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(serverHealth.services.mongodb)}`}>
              <Database size={12} />
              MongoDB: {serverHealth.services.mongodb}
            </div>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(serverHealth.services.redis)}`}>
              <Zap size={12} />
              Redis: {serverHealth.services.redis}
            </div>
          </div>
        </div>
      )}

      {/* Cache Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{clientStats.memoryEntries}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Clock size={10} />
            Memory Cache
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{clientStats.storageEntries}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Database size={10} />
            Storage Cache
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{formatBytes(clientStats.totalSize)}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <TrendingUp size={10} />
            Total Size
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {serverHealth?.cache.memoryEntries || 0}
          </div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Zap size={10} />
            Server Cache
          </div>
        </div>
      </div>

      {/* Cache Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
              });
            }
            localStorage.clear();
            window.location.reload();
          }}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
        >
          Clear All Cache
        </button>
        <button
          onClick={fetchHealth}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default CacheMonitor;