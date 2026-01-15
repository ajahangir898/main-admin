import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
  notificationService,
  Notification,
  NotificationResponse,
} from '../backend/src/services/NotificationService';
import { AuthContext } from '../context/AuthContext';

// Safe hook that doesn't throw when used outside AuthProvider
const useAuthSafe = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null, isAuthenticated: false };
  }
  return context;
};

export interface UseNotificationsOptions {
  /** Auto-connect to WebSocket on mount (default: true) */
  autoConnect?: boolean;
  /** Only fetch unread notifications (default: false) */
  unreadOnly?: boolean;
  /** Maximum number of notifications to fetch (default: 50) */
  limit?: number;
  /** Auto-fetch notifications on mount (default: true) */
  autoFetch?: boolean;
  /** Polling interval in ms (0 to disable, default: 0) */
  pollingInterval?: number;
  /** Override tenant ID (if not provided, uses user.tenantId from auth context) */
  tenantId?: string;
}

export interface UseNotificationsReturn {
  /** List of notifications */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** WebSocket connection status */
  isConnected: boolean;
  /** Refresh notifications from server */
  refresh: () => Promise<void>;
  /** Mark specific notifications as read */
  markAsRead: (notificationIds?: string[]) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Create a new notification */
  createNotification: (notification: {
    type: Notification['type'];
    title: string;
    message: string;
    data?: Record<string, any>;
  }) => Promise<Notification | null>;
  /** Cleanup old notifications */
  cleanupOldNotifications: () => Promise<number>;
  /** Manually connect to WebSocket */
  connect: () => void;
  /** Manually disconnect from WebSocket */
  disconnect: () => void;
  /** Clear error state */
  clearError: () => void;
}

export const useNotifications = (
  options: UseNotificationsOptions = {}
): UseNotificationsReturn => {
  const {
    autoConnect = true,
    unreadOnly = false,
    limit = 50,
    autoFetch = true,
    pollingInterval = 0,
    tenantId: tenantIdOverride,
  } = options;

  const { user, isAuthenticated } = useAuthSafe();
  // Use override tenantId if provided, otherwise fall back to user's tenantId
  const tenantId = tenantIdOverride || user?.tenantId;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tenantIdRef = useRef(tenantId);
  const unreadOnlyRef = useRef(unreadOnly);
  const limitRef = useRef(limit);

  // Keep refs in sync
  useEffect(() => {
    tenantIdRef.current = tenantId;
    unreadOnlyRef.current = unreadOnly;
    limitRef.current = limit;
  }, [tenantId, unreadOnly, limit]);
  const mountedRef = useRef(true);

  // Fetch notifications from API
  const refresh = useCallback(async () => {
    const currentTenantId = tenantIdRef.current;
    if (!currentTenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response: NotificationResponse =
        await notificationService.getNotifications(currentTenantId, {
          unreadOnly: unreadOnlyRef.current,
          limit: limitRef.current,
        });

      if (mountedRef.current) {
        setNotifications(response.data);
        setUnreadCount(response.unreadCount);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(
    async (notificationIds?: string[]) => {
      const currentTenantId = tenantIdRef.current;
      if (!currentTenantId) return;

      try {
        await notificationService.markAsRead(currentTenantId, notificationIds);

        if (mountedRef.current) {
          // Update local state
          setNotifications((prev) =>
            prev.map((n) =>
              !notificationIds || notificationIds.includes(n._id)
                ? { ...n, isRead: true }
                : n
            )
          );

          // Recalculate unread count
          if (notificationIds) {
            setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
          } else {
            setUnreadCount(0);
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to mark as read');
        }
      }
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    await markAsRead();
  }, []);

  // Create a new notification
  const createNotification = useCallback(
    async (notification: {
      type: Notification['type'];
      title: string;
      message: string;
      data?: Record<string, any>;
    }): Promise<Notification | null> => {
      const currentTenantId = tenantIdRef.current;
      if (!currentTenantId) return null;

      try {
        const newNotification = await notificationService.createNotification(
          currentTenantId,
          notification
        );
        return newNotification;
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to create notification');
        }
        return null;
      }
    },
    []
  );

  // Cleanup old notifications
  const cleanupOldNotifications = useCallback(async (): Promise<number> => {
    if (!tenantId) return 0;

    try {
      const deletedCount = await notificationService.cleanupOldNotifications(tenantId);
      // Refresh notifications after cleanup
      await refresh();
      return deletedCount;
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to cleanup notifications');
      }
      return 0;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const currentTenantId = tenantIdRef.current;
    if (!currentTenantId) return;
    notificationService.connect(currentTenantId);
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    notificationService.disconnect();
    setIsConnected(false);
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant notification tone (two-tone chime)
      oscillator.frequency.setValueAtTime(830, audioContext.currentTime); // First tone
      oscillator.frequency.setValueAtTime(1046, audioContext.currentTime + 0.1); // Second tone (higher)
      
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.warn('Could not play notification sound:', err);
    }
  }, []);

  // Handle new notification from WebSocket
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification: Notification) => {
      if (mountedRef.current) {
        setNotifications((prev) => [notification, ...prev]);
        if (!notification.isRead) {
          setUnreadCount((prev) => prev + 1);
          // Play sound for new unread notifications
          playNotificationSound();
        }
      }
    });

    return unsubscribe;
  }, [playNotificationSound]);

  // Check if we should be active (either authenticated or has tenantId override)
  const shouldBeActive = tenantId && (isAuthenticated || tenantIdOverride);

  // Auto-connect to WebSocket
  useEffect(() => {
    if (autoConnect && shouldBeActive && tenantId) {
      connect();

      // Check connection status periodically
      const checkConnection = setInterval(() => {
        if (mountedRef.current) {
          setIsConnected(notificationService.isConnected());
        }
      }, 1000);

      return () => {
        clearInterval(checkConnection);
      };
    }
  }, [autoConnect, shouldBeActive, tenantId]);

  // Auto-fetch notifications
  useEffect(() => {
    if (autoFetch && shouldBeActive && tenantId) {
      refresh();
    }
  }, [autoFetch, shouldBeActive, tenantId]);

  // Setup polling if enabled
  useEffect(() => {
    if (pollingInterval > 0 && shouldBeActive && tenantId) {
      pollingRef.current = setInterval(refresh, pollingInterval);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [pollingInterval, shouldBeActive, tenantId]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, disconnect]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    refresh,
    markAsRead,
    markAllAsRead,
    createNotification,
    cleanupOldNotifications,
    connect,
    disconnect,
    clearError,
  };
};

export default useNotifications;