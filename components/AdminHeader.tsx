import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminHeader } from './AdminComponents';
import type { Tenant } from '../types';
import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, ShoppingBag, Box, Settings, Sliders, FolderOpen,
    FileText, Star, Users, Ticket, Image as ImageIcon, FilePlus, DollarSign,
    Shield, LifeBuoy, BookOpen, LogOut, Bell, Menu, X, Globe, User as UserIcon, LogOut as LogOutIcon, ChevronDown, ChevronRight,
    Layers, Tag, Boxes, MessageCircle, Loader2, Check, Target, ExternalLink
} from 'lucide-react';
import { StatCardProps, User } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../backend/src/services/NotificationService';
// ...existing code...

// Mock the useNotifications hook
vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    isLoading: false,
    error: null,
    isConnected: true,
    refresh: vi.fn(),
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    createNotification: vi.fn(),
    cleanupOldNotifications: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { tenantId: 'tenant-1' },
    isAuthenticated: true,
  }),
}));

let mockNotifications: any[] = [];
let mockUnreadCount = 0;
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();

const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Alpha Gadgets',
    plan: 'growth',
    status: 'active',
    subdomain: 'alpha.example.com',
    contactEmail: 'owner@alpha.com',
    contactName: 'Alex Alpha',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    onboardingCompleted: true,
  },
  {
    id: 'tenant-2',
    name: 'Beta Store',
    plan: 'enterprise',
    status: 'trialing',
    subdomain: 'beta.example.com',
    contactEmail: 'hello@beta.com',
    contactName: 'Bianca Beta',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-02T00:00:00.000Z',
    onboardingCompleted: true,
  }
];

const baseProps = {
  onSwitchView: () => void 0,
  onLogout: () => void 0,
  onMenuClick: () => void 0,
};

beforeEach(() => {
  mockNotifications = [];
  mockUnreadCount = 0;
  mockMarkAsRead.mockClear();
  mockMarkAllAsRead.mockClear();
});

describe('AdminHeader tenant selector', () => {
  test('renders plan and status metadata for the active tenant', () => {
    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );

    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('shows spinner while a tenant change is in progress', () => {
    const { container } = render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
        isTenantSwitching
      />
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('invokes onTenantChange when a different tenant is selected', async () => {
    const onTenantChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={onTenantChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /tenant/i }));
    await user.click(screen.getByRole('button', { name: /beta store/i }));

    expect(onTenantChange).toHaveBeenCalledTimes(1);
    expect(onTenantChange).toHaveBeenCalledWith('tenant-2');
  });

  test('mobile select path triggers tenant change callback', async () => {
    const onTenantChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={onTenantChange}
      />
    );

    const select = screen.getByLabelText(/tenant/i) as HTMLSelectElement;
    await user.selectOptions(select, 'tenant-2');

    expect(onTenantChange).toHaveBeenCalledWith('tenant-2');
  });
});

describe('AdminHeader notifications', () => {
  test('renders notification bell button', () => {
    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /notification/i })).toBeInTheDocument();
  });

  test('shows unread count badge when there are unread notifications', () => {
    mockUnreadCount = 5;

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('shows 99+ when unread count exceeds 99', () => {
    mockUnreadCount = 150;

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('opens notification dropdown when bell is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /notification/i }));

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  test('shows empty state when there are no notifications', async () => {
    const user = userEvent.setup();
    mockNotifications = [];

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );
await user.click(screen.getByRole('button', { name: /notification/i }));

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  test('displays notifications in the dropdown', async () => {
    const user = userEvent.setup();
    mockNotifications = [
      {
        _id: 'notif-1',
        tenantId: 'tenant-1',
        type: 'order',
        title: 'New Order Received',
        message: 'Order #12345 has been placed',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'notif-2',
        tenantId: 'tenant-1',
        type: 'review',
        title: 'New Review',
        message: 'A customer left a 5-star review',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    mockUnreadCount = 1;

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /notification/i }));

    expect(screen.getByText('New Order Received')).toBeInTheDocument();
    expect(screen.getByText('Order #12345 has been placed')).toBeInTheDocument();
    expect(screen.getByText('New Review')).toBeInTheDocument();
  });

  test('calls markAllAsRead when "Mark all as read" is clicked', async () => {
    const user = userEvent.setup();
    mockNotifications = [
      {
        _id: 'notif-1',
        tenantId: 'tenant-1',
        type: 'order',
        title: 'New Order',
        message: 'New order received',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    mockUnreadCount = 1;

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /notification/i }));
    await user.click(screen.getByText('Mark all as read'));

    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  test('calls markAsRead and onNotificationClick when a notification is clicked', async () => {
    const user = userEvent.setup();
    const onNotificationClick = vi.fn();
    mockNotifications = [
      {
        _id: 'notif-1',
        tenantId: 'tenant-1',
        type: 'order',
        title: 'New Order',
        message: 'New order received',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    mockUnreadCount = 1;

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
        onNotificationClick={onNotificationClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /notification/i }));
    await user.click(screen.getByText('New Order'));

    expect(mockMarkAsRead).toHaveBeenCalledWith(['notif-1']);
    expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
  });

  test('does not call markAsRead for already read notifications', async () => {
    const user = userEvent.setup();
    const onNotificationClick = vi.fn();
    mockNotifications = [
      {
        _id: 'notif-1',
        tenantId: 'tenant-1',
        type: 'order',
        title: 'Old Order',
        message: 'Already read notification',
        isRead: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(
      <AdminHeader
        {...baseProps}
        tenants={mockTenants}
        activeTenantId={mockTenants[0].id}
        onTenantChange={() => {}}
        onNotificationClick={onNotificationClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /notification/i }));
    await user.click(screen.getByText('Old Order'));

    expect(mockMarkAsRead).not.toHaveBeenCalled();
    expect(onNotificationClick).toHaveBeenCalled();
  });
});