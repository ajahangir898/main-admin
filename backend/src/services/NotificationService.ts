import { io, Socket } from 'socket.io-client';

export interface Notification {
  _id: string;
  tenantId: string;
  type: 'order' | 'review' | 'customer' | 'inventory' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  data: Notification[];
  unreadCount: number;
}

type NotificationCallback = (notification: Notification) => void;

// Get the API base URL - works in both browser (Vite) and Node.js environments
const getApiBaseUrl = (): string => {
  // Node.js environment
  if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }
  if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  // Browser environment - use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side fallback - use PORT env var
  const port = process.env?.PORT || '3000';
  return `http://0.0.0.0:${port}`;
};

class NotificationService {
  private socket: Socket | null = null;
  private listeners: Set<NotificationCallback> = new Set();
  private tenantId: string | null = null;
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  // Connect to Socket.IO server and join tenant room
  connect(tenantId: string): void {
    if (this.socket?.connected && this.tenantId === tenantId) {
      return; // Already connected to the same tenant
    }

    // Disconnect from previous connection if exists
    this.disconnect();

    this.tenantId = tenantId;
    this.socket = io(this.apiBaseUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'], // Start with polling, then upgrade to websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[NotificationService] Connected to server');
      this.socket?.emit('join-tenant', tenantId);
    });

    this.socket.on('new-notification', (notification: Notification) => {
      console.log('[NotificationService] New notification:', notification);
      this.listeners.forEach((callback) => callback(notification));
    });

    this.socket.on('disconnect', () => {
      console.log('[NotificationService] Disconnected from server');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('[NotificationService] Connection error:', error);
    });
  }

  // Disconnect from Socket.IO server
  disconnect(): void {
    if (this.socket) {
      if (this.tenantId) {
        this.socket.emit('leave-tenant', this.tenantId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.tenantId = null;
    }
  }

  // Subscribe to new notifications
  subscribe(callback: NotificationCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Fetch notifications from API
  async getNotifications(
    tenantId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const url = `${this.apiBaseUrl}/api/notifications/${tenantId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }

  // Mark notifications as read
  async markAsRead(tenantId: string, notificationIds?: string[]): Promise<void> {
    const response = await fetch(
      `${this.apiBaseUrl}/api/notifications/${tenantId}/mark-read`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationIds }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }
  }

  // Create a notification (useful for testing or internal notifications)
  async createNotification(
    tenantId: string,
    notification: {
      type: Notification['type'];
      title: string;
      message: string;
      data?: Record<string, any>;
    }
  ): Promise<Notification> {
    const response = await fetch(`${this.apiBaseUrl}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ tenantId, ...notification }),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    const result = await response.json();
    return result.data;
  }

  // Cleanup old notifications
  async cleanupOldNotifications(tenantId: string): Promise<number> {
    const response = await fetch(
      `${this.apiBaseUrl}/api/notifications/${tenantId}/cleanup`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to cleanup notifications');
    }

    const result = await response.json();
    return result.deleted;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;