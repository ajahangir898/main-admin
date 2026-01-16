import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface VisitorStats {
  totalVisitors: number;
  periodVisitors: number;
  todayVisitors: number;
  totalPageViews: number;
  onlineNow: number;
  dailyStats: { date: string; views: number; visitors: number }[];
  topPages: { page: string; views: number }[];
  devices: { device: string; count: number }[];
}

interface UseVisitorStatsOptions {
  tenantId?: string;
  period?: '24h' | '7d' | '30d' | 'all';
  refreshInterval?: number; // in milliseconds
}

export const useVisitorStats = (options: UseVisitorStatsOptions = {}) => {
  const { tenantId, period = '7d', refreshInterval = 30000 } = options;
  
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    periodVisitors: 0,
    todayVisitors: 0,
    totalPageViews: 0,
    onlineNow: 0,
    dailyStats: [],
    topPages: [],
    devices: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      // Fetch main stats
      const statsRes = await fetch(`${API_BASE}/api/visitors/${tenantId}/stats?period=${period}`);
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      
      // Fetch online count
      const onlineRes = await fetch(`${API_BASE}/api/visitors/${tenantId}/online`);
      if (!onlineRes.ok) throw new Error('Failed to fetch online count');
      const onlineData = await onlineRes.json();
      
      setStats({
        ...statsData,
        onlineNow: onlineData.online || 0
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching visitor stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, period]);

  useEffect(() => {
    fetchStats();
    
    // Set up polling for online visitors
    const interval = setInterval(fetchStats, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, isLoading, error, refresh: fetchStats };
};

// Track page view (for storefront)
// Throttle tracking to prevent excessive API calls
const lastPageViewTrack = new Map<string, number>();
const PAGE_VIEW_THROTTLE_MS = 5000; // Only track same page once per 5 seconds

export const trackPageView = async (tenantId: string, page: string) => {
  if (!tenantId) return;
  
  // Throttle to prevent excessive tracking
  const throttleKey = `${tenantId}:${page}`;
  const lastTrack = lastPageViewTrack.get(throttleKey) || 0;
  const now = Date.now();
  if (now - lastTrack < PAGE_VIEW_THROTTLE_MS) {
    return; // Skip - already tracked recently
  }
  lastPageViewTrack.set(throttleKey, now);
  
  // Get or create visitor ID
  let visitorId = localStorage.getItem('_vid');
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('_vid', visitorId);
  }
  
  // Detect device
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    device = 'Mobile';
  }
  
  // Detect browser
  let browser = 'Other';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  try {
    await fetch(`${API_BASE}/api/visitors/${tenantId}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        page,
        referrer: document.referrer,
        userAgent: ua,
        device,
        browser
      })
    });
  } catch (err) {
    console.warn('Failed to track page view:', err);
  }
};

export default useVisitorStats;
