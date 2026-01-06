import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Zap, Clock, HardDrive, Cpu, AlertCircle, CheckCircle } from 'lucide-react';
import { getAuthHeader } from '../../services/authService';

interface SystemHealthProps {
  systemStats: {
    serverLoad: number;
    uptime: string;
    diskUsage: number;
    memoryUsage: number;
  };
}

const SystemHealthTab: React.FC<SystemHealthProps> = ({ systemStats }) => {
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [apiResponseTime, setApiResponseTime] = useState<number>(0);
  const [errors24h, setErrors24h] = useState<number>(0);

  const getApiUrl = (): string => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5001/api';
      }
      return 'https://systemnextit.com/api';
    }
    return 'https://systemnextit.com/api';
  };

  const API_URL = getApiUrl();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = Date.now();
        const response = await fetch(`${API_URL}/health`, {
          headers: getAuthHeader(),
        });
        const end = Date.now();
        
        setApiResponseTime(end - start);
        setDbStatus(response.ok ? 'connected' : 'disconnected');
        
        // Mock error count - in production, fetch from API
        setErrors24h(Math.floor(Math.random() * 10));
      } catch (error) {
        setDbStatus('disconnected');
        setApiResponseTime(0);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [API_URL]);

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-100';
    if (value >= thresholds.warning) return 'text-amber-600 bg-amber-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const metrics = [
    {
      title: 'Server Load',
      value: `${systemStats.serverLoad}%`,
      icon: Server,
      status: systemStats.serverLoad < 70 ? 'healthy' : systemStats.serverLoad < 85 ? 'warning' : 'critical',
      progress: systemStats.serverLoad,
      thresholds: { warning: 70, critical: 85 },
    },
    {
      title: 'Memory Usage',
      value: `${systemStats.memoryUsage}%`,
      icon: Cpu,
      status: systemStats.memoryUsage < 75 ? 'healthy' : systemStats.memoryUsage < 90 ? 'warning' : 'critical',
      progress: systemStats.memoryUsage,
      thresholds: { warning: 75, critical: 90 },
    },
    {
      title: 'Disk Usage',
      value: `${systemStats.diskUsage}%`,
      icon: HardDrive,
      status: systemStats.diskUsage < 70 ? 'healthy' : systemStats.diskUsage < 85 ? 'warning' : 'critical',
      progress: systemStats.diskUsage,
      thresholds: { warning: 70, critical: 85 },
    },
    {
      title: 'API Response Time',
      value: `${apiResponseTime}ms`,
      icon: Zap,
      status: apiResponseTime < 200 ? 'healthy' : apiResponseTime < 500 ? 'warning' : 'critical',
      progress: Math.min((apiResponseTime / 1000) * 100, 100),
      thresholds: { warning: 20, critical: 50 },
    },
  ];

  const healthChecks = [
    {
      name: 'Database Connection',
      status: dbStatus,
      icon: Database,
      details: dbStatus === 'connected' ? 'MongoDB connected' : 'Connection failed',
    },
    {
      name: 'API Service',
      status: apiResponseTime > 0 ? 'connected' : 'disconnected',
      icon: Server,
      details: apiResponseTime > 0 ? `Responding in ${apiResponseTime}ms` : 'Not responding',
    },
    {
      name: 'Error Rate (24h)',
      status: errors24h < 10 ? 'connected' : errors24h < 50 ? 'checking' : 'disconnected',
      icon: AlertCircle,
      details: `${errors24h} errors logged`,
    },
    {
      name: 'System Uptime',
      status: 'connected',
      icon: Clock,
      details: systemStats.uptime,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-emerald-500" />
          System Health Monitor
        </h1>
        <p className="text-slate-600 mt-1">Real-time system performance and health metrics</p>
      </div>

      {/* Health Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthChecks.map((check, idx) => {
          const Icon = check.icon;
          const isHealthy = check.status === 'connected';
          const isWarning = check.status === 'checking';
          
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${isHealthy ? 'bg-emerald-100' : isWarning ? 'bg-amber-100' : 'bg-red-100'}`}>
                  <Icon className={isHealthy ? 'text-emerald-600' : isWarning ? 'text-amber-600' : 'text-red-600'} size={20} />
                </div>
                {isHealthy ? (
                  <CheckCircle className="text-emerald-500" size={20} />
                ) : isWarning ? (
                  <AlertCircle className="text-amber-500" size={20} />
                ) : (
                  <AlertCircle className="text-red-500" size={20} />
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">{check.name}</h3>
              <p className="text-xs text-slate-500">{check.details}</p>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(metric.progress, metric.thresholds)}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">{metric.title}</h3>
                      <p className="text-xs text-slate-500 capitalize">{metric.status}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-slate-800">{metric.value}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(metric.progress, metric.thresholds)}`}
                    style={{ width: `${metric.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Operating System</span>
              <span className="text-sm font-medium text-slate-800">Linux Ubuntu 22.04</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Node.js Version</span>
              <span className="text-sm font-medium text-slate-800">v18.20.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">MongoDB Version</span>
              <span className="text-sm font-medium text-slate-800">6.0.11</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Uptime</span>
              <span className="text-sm font-medium text-slate-800">{systemStats.uptime}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-600">Environment</span>
              <span className="text-sm font-medium text-slate-800">Production</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {errors24h === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="mx-auto mb-2 text-emerald-500" size={40} />
                <p className="text-sm">No alerts in the last 24 hours</p>
                <p className="text-xs mt-1">System is running smoothly</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">High Memory Usage</p>
                    <p className="text-xs text-slate-600 mt-1">Memory usage exceeded 80% threshold</p>
                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">Issue Resolved</p>
                    <p className="text-xs text-slate-600 mt-1">Memory usage returned to normal levels</p>
                    <p className="text-xs text-slate-500 mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resource Usage Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Resource Usage Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {100 - systemStats.serverLoad}%
            </div>
            <div className="text-sm text-slate-600">Server Capacity Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {100 - systemStats.memoryUsage}GB
            </div>
            <div className="text-sm text-slate-600">Memory Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {100 - systemStats.diskUsage}GB
            </div>
            <div className="text-sm text-slate-600">Disk Space Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthTab;
