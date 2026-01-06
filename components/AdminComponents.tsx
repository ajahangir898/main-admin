
import React, { useState, useEffect, useRef } from 'react';
import {
	LayoutDashboard, ShoppingBag, Box, Settings, Sliders,
	FileText, Star, Users, Image as ImageIcon, DollarSign,
	Shield, LogOut, Bell, Menu, X, Globe, LogOut as LogOutIcon, ChevronDown, ChevronRight,
	Layers, Boxes, MessageCircle, Loader2, Check, Target, ExternalLink, CheckCheck, Trash2, AlertCircle, Package, Clock, Headphones, Store, Figma
} from 'lucide-react';
import { StatCardProps, User, Tenant } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification as AppNotification } from '../backend/src/services/NotificationService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import CacheMonitor from './CacheMonitor';

// Check if we're on tenant subdomain with /admin path (not admin.* or superadmin.* subdomain)
const isOnTenantAdminPath = typeof window !== 'undefined' && 
	(window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) &&
	!window.location.hostname.startsWith('admin.') &&
	!window.location.hostname.startsWith('superadmin.');

// Permission checking types
type PermissionMap = Record<string, string[]>;

interface AdminSidebarProps {
	activePage?: string;
	onNavigate?: (page: string) => void;
	logo?: string | null;
	isOpen?: boolean;
	onClose?: () => void;
	userRole?: User['role'];
	permissions?: PermissionMap;
}

// Helper to check if user can access a resource
const canAccess = (resource: string, userRole?: User['role'], permissions?: PermissionMap): boolean => {
	// Super admin can access everything
	if (userRole === 'super_admin') return true;
	
	// Admin can access everything except tenants
	if (userRole === 'admin' && resource !== 'tenants') return true;
	
	// Check custom role permissions
	if (permissions && permissions[resource]) {
		return permissions[resource].includes('read');
	}
	
	// Default: staff without custom role can only see dashboard
	if (userRole === 'staff') {
		return resource === 'dashboard';
	}
	
	// Tenant admin can see everything except tenants
	if (userRole === 'tenant_admin' && resource !== 'tenants') return true;
	
	return false;
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePage, onNavigate, logo, isOpen, onClose, userRole, permissions }) => {
	const [isCatalogOpen, setIsCatalogOpen] = useState(false);

	// Main Menu items
	const mainMenuItems = [
		{ id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', resource: 'dashboard' },
		{ id: 'orders', icon: <ShoppingBag size={18} />, label: 'Orders', resource: 'orders' },
		{ id: 'products', icon: <Box size={18} />, label: 'Products', resource: 'products' },
		{ id: 'inventory', icon: <Boxes size={18} />, label: 'Inventory', resource: 'inventory' },
		{ id: 'customers_reviews', icon: <Users size={18} />, label: 'Customers & review', resource: 'customers' },
	];

	// Configuration items
	const configItems = [
		{ id: 'customization', icon: <Sliders size={18} />, label: 'Customization', resource: 'customization' },
		{ id: 'landing_pages', icon: <FileText size={18} />, label: 'Landing Page', resource: 'landing_pages' },
		{ id: 'popups', icon: <Layers size={18} />, label: 'Popups', resource: 'landing_pages' },
		{ id: 'gallery', icon: <ImageIcon size={18} />, label: 'Gallery', resource: 'gallery' },
		{ id: 'business_report_expense', icon: <FileText size={18} />, label: 'Business Report', resource: 'business_report' },
	];

	// System items
	const systemItems = [
		{ id: 'settings', icon: <Settings size={18} />, label: 'Settings', resource: 'settings' },
		{ id: 'admin', icon: <Shield size={18} />, label: 'Admin Control', resource: 'admin_control' },
		{ id: 'billing', icon: <DollarSign size={18} />, label: 'Billing & Subscription', resource: 'settings' },
		{ id: 'support', icon: <Headphones size={18} />, label: 'Support', resource: 'settings' },
		{ id: 'tutorial', icon: <FileText size={18} />, label: 'Tutorial', resource: 'settings' },
	];

	const catalogItems = [
		{ id: 'catalog_categories', label: 'Categories' },
		{ id: 'catalog_subcategories', label: 'Sub Categories' },
		{ id: 'catalog_childcategories', label: 'Child Categories' },
		{ id: 'catalog_brands', label: 'Brand' },
		{ id: 'catalog_tags', label: 'Tags' },
	];

	// Filter menu items based on permissions
	const filteredMainMenuItems = mainMenuItems.filter(item => canAccess(item.resource, userRole, permissions));
	const filteredConfigItems = configItems.filter(item => canAccess(item.resource, userRole, permissions));
	const filteredSystemItems = systemItems.filter(item => canAccess(item.resource, userRole, permissions));

	// Check if user can see catalog
	const canSeeCatalog = canAccess('catalog', userRole, permissions);

	// Active style for menu items
	const getMenuItemStyle = (itemId: string, isActive: boolean) => {
		if (isActive) {
			return {
				background: '#CCFBF1',
				color: '#0D9488',
			};
		}
		return {
			color: '#6B7280',
		};
	};

	const isItemActive = (itemId: string) => {
		if (itemId === 'business_report_expense' && activePage?.startsWith('business_report_')) return true;
		if (itemId === 'customization' && ['carousel', 'banner', 'popup', 'website_info', 'chat_settings', 'theme_view', 'theme_colors'].includes(activePage || '')) return true;
		return activePage === itemId;
	};

	const SidebarContent = () => (
		<>
			{/* Sidebar Header */}
			<div className="p-5 border-b flex items-center justify-between bg-white" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
				{logo ? (
					<img src={normalizeImageUrl(logo)} alt="Admin Logo" className="h-8 md:h-10 object-contain" />
				) : (
					<h2 className="text-xl font-bold tracking-tight">
						<span className="text-gray-900">Your</span>
						<span className="text-sky-500">Shop</span>
					</h2>
				)}
				<button onClick={onClose} className="lg:hidden p-2 rounded-lg transition hover:bg-gray-100 text-gray-500">
					<X size={20} />
				</button>
			</div>

			{/* Sidebar Menu */}
			<div className="p-4 space-y-1 flex-1 overflow-y-auto scrollbar-hide bg-white">
				{/* Main Menu Section */}
				<div className="text-[11px] font-medium uppercase tracking-wider mb-3 px-3 text-gray-400">Main Menu</div>
				
				{filteredMainMenuItems.map((item) => (
					<div
						key={item.id}
						onClick={() => { onNavigate && onNavigate(item.id); onClose && onClose(); }}
						className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium hover:bg-gray-50`}
						style={getMenuItemStyle(item.id, isItemActive(item.id))}
					>
						{item.icon}
						<span>{item.label}</span>
					</div>
				))}

				{/* Catalog with Dropdown */}
				{canSeeCatalog && (
					<div>
						<div
							onClick={() => setIsCatalogOpen(!isCatalogOpen)}
							className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium hover:bg-gray-50`}
							style={getMenuItemStyle('catalog', activePage?.startsWith('catalog_') || false)}
						>
							<div className="flex items-center gap-3">
								<Layers size={18} />
								<span>Catalog</span>
							</div>
							<ChevronDown size={16} className={`transition-transform duration-200 ${isCatalogOpen ? 'rotate-180' : ''}`} />
						</div>

						{isCatalogOpen && (
							<div className="ml-9 mt-1 space-y-0.5">
								{catalogItems.map(item => (
									<div
										key={item.id}
										onClick={() => { onNavigate && onNavigate(item.id); onClose && onClose(); }}
										className={`py-2 px-3 rounded-lg text-sm cursor-pointer transition hover:bg-gray-50`}
										style={{
										color: activePage === item.id ? '#0D9488' : '#6B7280',
											fontWeight: activePage === item.id ? 500 : 400,
										}}
									>
										{item.label}
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Configuration Section */}
				{filteredConfigItems.length > 0 && (
					<>
						<div className="text-[11px] font-medium uppercase tracking-wider mb-3 px-3 mt-6 text-gray-400">Configuration</div>
						
						{filteredConfigItems.map((item) => (
							<div
								key={item.id}
								onClick={() => { onNavigate && onNavigate(item.id); onClose && onClose(); }}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium hover:bg-gray-50`}
								style={getMenuItemStyle(item.id, isItemActive(item.id))}
							>
								{item.icon}
								<span>{item.label}</span>
							</div>
						))}
					</>
				)}

				{/* System Section */}
				{filteredSystemItems.length > 0 && (
					<>
						<div className="text-[11px] font-medium uppercase tracking-wider mb-3 px-3 mt-6 text-gray-400">System</div>
						
						{filteredSystemItems.map((item) => (
							<div
								key={item.id}
								onClick={() => { onNavigate && onNavigate(item.id); onClose && onClose(); }}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium hover:bg-gray-50`}
								style={getMenuItemStyle(item.id, isItemActive(item.id))}
							>
								{item.icon}
								<span>{item.label}</span>
							</div>
						))}
					</>
				)}

				{/* Back to Store */}
				<div className="mt-6 pt-4 border-t border-gray-100"> 
					{isOnTenantAdminPath && (
						<a
							href="/"
							className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition text-sm text-teal-600 hover:bg-teal-50 font-medium"
						>
							<Store size={18} />
							<span>Back to Store</span>
						</a>
					)}
				</div>
			</div>
		</>
	);

	return (
		<>
			{/* Desktop Sidebar */}
			<div className="hidden lg:flex w-64 h-screen flex-col sticky top-0 scrollbar-hide bg-white shadow-sm" style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}>
				<SidebarContent />
			</div>

			{/* Mobile Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
					onClick={onClose}
				></div>
			)}

			{/* Mobile Sidebar */}
			<div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col p-0 bg-white shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
				<SidebarContent />
			</div>
		</>
	);
};

export const AdminHeader: React.FC<{ 
	onSwitchView: () => void, 
	user?: User | null, 
	onLogout?: () => void, 
	logo?: string | null,
	onMenuClick?: () => void,
	tenants?: Tenant[],
	activeTenantId?: string,
	onTenantChange?: (tenantId: string) => void,
	isTenantSwitching?: boolean,
	onOpenChatCenter?: () => void,
	hasUnreadChat?: boolean,
	showCacheMonitor?: boolean
}> = ({ onSwitchView, user, onLogout, logo, onMenuClick, tenants, activeTenantId, onTenantChange, isTenantSwitching, onOpenChatCenter, hasUnreadChat, showCacheMonitor = false }) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const tenantMenuRef = useRef<HTMLDivElement | null>(null);
	const notificationRef = useRef<HTMLDivElement | null>(null);
	const prevUnreadCountRef = useRef<number>(-1); // Start with -1 to skip initial load
	const hasUserInteracted = useRef<boolean>(false);

	// Track user interaction to enable audio
	useEffect(() => {
		const enableAudio = () => {
			hasUserInteracted.current = true;
		};
		window.addEventListener('click', enableAudio, { once: true });
		window.addEventListener('keydown', enableAudio, { once: true });
		return () => {
			window.removeEventListener('click', enableAudio);
			window.removeEventListener('keydown', enableAudio);
		};
	}, []);

	// Notification hook - use activeTenantId from props with polling fallback
	const notificationResult = useNotifications({ 
		autoFetch: !!activeTenantId, 
		autoConnect: !!activeTenantId,
		limit: 20,
		tenantId: activeTenantId,
		pollingInterval: 15000, // Poll every 15 seconds as fallback for WebSocket
	});
	
	const notifications = activeTenantId ? notificationResult.notifications : [];
	const unreadCount = activeTenantId ? notificationResult.unreadCount : 0;
	const notificationsLoading = activeTenantId ? notificationResult.isLoading : false;
	const markAsRead = notificationResult.markAsRead;
	const markAllAsRead = notificationResult.markAllAsRead;
	const refreshNotifications = notificationResult.refresh;

	// Play sound when unread count increases (skip initial load)
	useEffect(() => {
		// Skip initial load (-1) and when count stays same or decreases
		if (prevUnreadCountRef.current >= 0 && unreadCount > prevUnreadCountRef.current) {
			console.log(`[Notification] New notifications! ${prevUnreadCountRef.current} -> ${unreadCount}`);
			// Play notification sound
			if (hasUserInteracted.current) {
				try {
					const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
					const audioContext = new AudioContextClass();
					if (audioContext.state === 'suspended') {
						void audioContext.resume();
					}
					const oscillator = audioContext.createOscillator();
					const gainNode = audioContext.createGain();
					oscillator.connect(gainNode);
					gainNode.connect(audioContext.destination);
					oscillator.type = 'sine';
					oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
					oscillator.frequency.setValueAtTime(1174.66, audioContext.currentTime + 0.15);
					gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 0.4);
					console.log('[Notification] Sound played!');
				} catch (err) {
					console.warn('[Notification] Could not play sound:', err);
				}
			} else {
				console.log('[Notification] Skipping sound - no user interaction yet');
			}
		}
		prevUnreadCountRef.current = unreadCount;
	}, [unreadCount]);

	const mobileSelectId = 'tenant-mobile-select';
	const tenantOptions = tenants ?? [];
	const selectedTenant = tenantOptions.find((tenant) => tenant.id === activeTenantId);
	const canSwitchTenant = tenantOptions.length > 0 && typeof onTenantChange === 'function';

	useEffect(() => {
		if (!isTenantMenuOpen) return;
		const handleClickOutside = (event: MouseEvent) => {
			if (tenantMenuRef.current && !tenantMenuRef.current.contains(event.target as Node)) {
				setIsTenantMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isTenantMenuOpen]);

	// Close notification dropdown on outside click
	useEffect(() => {
		if (!isNotificationOpen) return;
		const handleClickOutside = (event: MouseEvent) => {
			if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
				setIsNotificationOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isNotificationOpen]);

	// Get notification icon based on type
	const getNotificationIcon = (type: AppNotification['type']) => {
		switch (type) {
			case 'order':
				return <ShoppingBag size={16} className="text-emerald-400" />;
			case 'review':
				return <Star size={16} className="text-amber-400" />;
			case 'customer':
				return <Users size={16} className="text-blue-400" />;
			case 'inventory':
				return <Package size={16} className="text-orange-400" />;
			case 'system':
				return <AlertCircle size={16} className="text-red-400" />;
			default:
				return <Bell size={16} className="text-slate-400" />;
		}
	};

	// Format time ago
	const formatTimeAgo = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	// Handle notification click
	const handleNotificationClick = async (notification: AppNotification) => {
		if (!notification.isRead) {
			await markAsRead([notification._id]);
		}
		
		// Navigate based on notification type
		if (notification.type === 'order' && notification.data?.orderId) {
			// Close notification dropdown
			setIsNotificationOpen(false);
			// Navigate to orders page with the order ID
			// Dispatch custom event for navigation
			window.dispatchEvent(new CustomEvent('navigate-to-order', { 
				detail: { 
					orderId: notification.data.orderId,
					tenantId: notification.data?.tenantId || activeTenantId
				} 
			}));
		}
	};

	// Handle mark all as read
	const handleMarkAllAsRead = async () => {
		await markAllAsRead();
	};

	const formatLabel = (value?: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

	const getStatusClasses = (status?: Tenant['status']) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-700 border border-green-200';
			case 'trialing':
				return 'bg-amber-100 text-amber-700 border border-amber-200';
			case 'suspended':
				return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
			case 'inactive':
			default:
				return 'bg-gray-100 text-gray-600 border border-gray-200';
		}
	};

	const getPlanClasses = (plan?: Tenant['plan']) => {
		switch (plan) {
			case 'growth':
				return 'bg-purple-100 text-purple-700 border border-purple-200';
			case 'enterprise':
				return 'bg-blue-100 text-blue-700 border border-blue-200';
			case 'starter':
			default:
				return 'bg-gray-100 text-gray-600 border border-gray-200';
		}
	};

	const handleTenantSelect = (tenantId: string) => {
		setIsTenantMenuOpen(false);
		if (tenantId !== activeTenantId) {
			onTenantChange?.(tenantId);
		}
	};

	const renderTenantSummary = () => (
		<div className="text-left">
			<p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Tenant</p>
			<p className="text-sm font-semibold truncate max-w-[200px] text-gray-900">
				{selectedTenant?.name || 'Select tenant'}
			</p>
			{selectedTenant && (
				<div className="flex items-center gap-2 mt-1">
					<span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getPlanClasses(selectedTenant.plan)}`}>
						{formatLabel(selectedTenant.plan)}
					</span>
					<span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusClasses(selectedTenant.status)}`}>
						{formatLabel(selectedTenant.status)}
					</span>
				</div>
			)}
		</div>
	);

	return (
		<header className="h-16 flex items-center justify-between gap-4 px-4 md:px-6 sticky top-0 z-30 bg-white shadow-sm" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
			<div className="flex items-center gap-3 md:gap-4">
				{/* Mobile Menu Button */}
				<button
					onClick={onMenuClick}
					className="md:hidden p-2 -ml-2 rounded-lg transition flex-shrink-0 text-gray-600 hover:bg-gray-100"
					aria-label="Open menu"
				>
					<Menu size={20} />
				</button>

				{/* Logo/Brand - Visible on mobile only */}
				<div className="flex items-center gap-2 md:hidden flex-shrink-0">
					{/* logo */}
				</div>

				{/* Desktop Elements */}
				{selectedTenant?.subdomain ? (
    <a 
        href={`${window.location.protocol}//${selectedTenant.subdomain}.${import.meta.env.VITE_PRIMARY_DOMAIN || window.location.hostname.split('.').slice(-2).join('.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition flex-shrink-0 text-white hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #16a34a 100%)', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)' }}
    >
        <Globe size={14} />
        Go to Website
        <ExternalLink size={12} />
    </a>
) : (
    <button 
        onClick={onSwitchView} 
        className="hidden md:flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition flex-shrink-0 text-white hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #16a34a 100%)', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)' }}
    >
        <Globe size={14} />
        Go to Website
    </button>
)}

				{/* Tenant Switcher - Desktop */}
				{canSwitchTenant && (
					<div className="relative hidden sm:block flex-shrink-0" ref={tenantMenuRef}>
						<button
							type="button"
							onClick={() => setIsTenantMenuOpen((prev) => !prev)}
							disabled={isTenantSwitching}
							className="group flex items-center justify-between gap-4 rounded-xl px-4 py-2 transition w-72 bg-gray-50 border border-gray-200 hover:border-gray-300"
							style={{ 
								cursor: isTenantSwitching ? 'wait' : 'pointer'
							}}
							aria-haspopup="listbox"
							aria-expanded={isTenantMenuOpen}
						>
							{renderTenantSummary()}
							<div className="flex items-center gap-2 text-gray-500">
								{isTenantSwitching && <Loader2 size={18} className="animate-spin text-green-600" />}
								<ChevronDown size={16} className="transition" />
							</div>
						</button>
						{isTenantMenuOpen && (
							<div className="absolute right-0 top-full mt-2 w-[20rem] rounded-xl z-40 p-2 bg-white border border-gray-200 shadow-xl">
								{tenantOptions.map((tenant) => (
									<button
										key={tenant.id}
										type="button"
										onClick={() => handleTenantSelect(tenant.id)}
										disabled={isTenantSwitching}
										className={`w-full text-left rounded-lg px-3 py-2.5 transition flex items-start justify-between gap-3 ${tenant.id === activeTenantId ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50 border border-transparent'}`}
									>
										<div>
											<p className="text-sm font-semibold text-gray-900">{tenant.name}</p>
											<div className="flex items-center gap-2 mt-1">
												<span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getPlanClasses(tenant.plan)}`}>
													{formatLabel(tenant.plan)}
												</span>
												<span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusClasses(tenant.status)}`}>
													{formatLabel(tenant.status)}
												</span>
											</div>
											<p className="text-xs mt-1 text-gray-500">{tenant?.subdomain || 'N/A'}</p>
										</div>
										{tenant.id === activeTenantId && <Check size={16} className="text-green-600" />}
									</button>
								))}
								{!tenantOptions.length && (
									<p className="text-sm px-3 py-2 text-gray-500">No tenants available</p>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
				{canSwitchTenant && (
					<div className="sm:hidden w-full max-w-[140px]">
						<label htmlFor={mobileSelectId} className="text-[9px] uppercase font-semibold tracking-wider block mb-1" style={{ color: 'var(--admin-accent-light, #6ee7b7)' }}>Tenant</label>
						<div className="relative">
							<select
								id={mobileSelectId}
								value={selectedTenant?.id || ''}
								onChange={(event) => handleTenantSelect(event.target.value)}
								disabled={isTenantSwitching}
								className="appearance-none rounded-lg text-[10px] font-semibold px-2 py-1 shadow-sm focus:outline-none w-full pr-6 bg-white border border-gray-200 text-gray-700"
							>
								<option value="" disabled>Select tenant</option>
								{tenantOptions.map((tenant) => (
									<option key={tenant.id} value={tenant.id}>
										{tenant.name} • {formatLabel(tenant.plan)} ({formatLabel(tenant.status)})
									</option>
								))}
							</select>
							{isTenantSwitching ? (
								<Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-green-600" />
							) : (
								<ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
							)}
						</div>
					</div>
				)}
				<div className="text-[10px] font-bold px-2.5 py-1 rounded-full hidden lg:block flex-shrink-0 bg-gradient-to-r from-red-500 to-green-500 text-white shadow-sm">
					Admin
				</div>
				<div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
					{onOpenChatCenter && (
						<button
							onClick={onOpenChatCenter}
							type="button"
							className={`relative p-2 rounded-lg transition flex-shrink-0 ${hasUnreadChat ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
							aria-label="Open customer chat"
						>
							<MessageCircle size={18} className="md:w-5 md:h-5" />
							{hasUnreadChat && (
								<span className="absolute -top-1 -right-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shadow bg-pink-500 text-white">
									New
								</span>
							)}
						</button>
					)}
					{/* Notification Bell with Dropdown */}
					<div className="relative flex-shrink-0" ref={notificationRef}>
						<button 
							onClick={() => setIsNotificationOpen(!isNotificationOpen)}
							className={`relative p-2 rounded-lg transition ${isNotificationOpen ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-100'}`}
							aria-label="Notifications"
						>
							<Bell size={18} className="md:w-5 md:h-5" />
							{unreadCount > 0 && (
								<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 bg-red-500 text-white border-2 border-white">
									{unreadCount > 99 ? '99+' : unreadCount}
								</span>
							)}
						</button>

						{/* Notification Dropdown */}
						{isNotificationOpen && (
							<div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl z-50 overflow-hidden bg-white border border-gray-200 shadow-xl">
								{/* Header */}
								<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
									<div className="flex items-center gap-2">
										<Bell size={18} className="text-green-600" />
										<span className="font-semibold text-gray-900">Notifications</span>
										{unreadCount > 0 && (
											<span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
												{unreadCount} new
											</span>
										)}
									</div>
									{unreadCount > 0 && (
										<button
											onClick={handleMarkAllAsRead}
											className="flex items-center gap-1 text-xs transition text-green-600 hover:text-green-700"
										>
											<CheckCheck size={14} />
											Mark all read
										</button>
									)}
								</div>

								{/* Notification List */}
								<div className="max-h-[400px] overflow-y-auto">
									{notificationsLoading ? (
										<div className="flex items-center justify-center py-8">
											<Loader2 size={24} className="animate-spin text-green-600" />
										</div>
									) : notifications.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-10 px-4 text-center">
											<div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-gray-100">
												<Bell size={28} className="text-gray-400" />
											</div>
											<p className="text-sm text-gray-600">No notifications yet</p>
											<p className="text-xs mt-1 text-gray-400">We'll notify you when something arrives</p>
										</div>
									) : (
										<div>
											{notifications.map((notification) => (
												<div
													key={notification._id}
													onClick={() => handleNotificationClick(notification)}
													className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition hover:bg-gray-50 ${!notification.isRead ? 'bg-green-50 border-l-2 border-green-500' : ''}`}
												>
													<div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 bg-gray-100">
														{getNotificationIcon(notification.type)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-start justify-between gap-2">
															<p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-500'}`}>
																{notification.title}
															</p>
															{!notification.isRead && (
																<span className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 bg-green-500"></span>
															)}
														</div>
														<p className="text-xs mt-0.5 line-clamp-2 text-gray-500">
															{notification.message}
														</p>
														<div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
															<Clock size={10} />
															{formatTimeAgo(notification.createdAt)}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Footer */}
								{notifications.length > 0 && (
									<div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
										<button 
											onClick={refreshNotifications}
											className="w-full text-center text-xs font-medium transition text-green-600 hover:text-green-700"
										>
											Refresh notifications
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="relative flex-shrink-0">
						<div
							className="flex items-center gap-2 cursor-pointer"
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						>
							<div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-green-400 flex-shrink-0 shadow-sm">
									{logo ? (
					<img src={normalizeImageUrl(logo)} alt="Admin Logo" className="h-8 md:h-10 object-contain" />
				) : (
					<h2 className="text-xl font-bold tracking-tight">
						<span className="text-gray-900">Your</span>
						<span className="text-red-600">Shop</span>
					</h2>
				)}
							
							</div>
						</div>

						{isDropdownOpen && (
							<div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
								<div className="p-4 border-b border-gray-100">
									{selectedTenant?.subdomain && (
										<a 
											href={`${window.location.protocol}//${selectedTenant.subdomain}.${import.meta.env.VITE_PRIMARY_DOMAIN || window.location.hostname.split('.').slice(-2).join('.')}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600 w-full p-2 rounded-lg hover:bg-gray-50 transition mb-1"
										>
											<ExternalLink size={14} /> Go to Website
										</a>
									)}
									<button
										onClick={onLogout}
										className="flex items-center gap-3 text-sm text-gray-700 hover:text-red-600 w-full p-2 rounded-lg hover:bg-gray-50 transition"
									>
										<LogOutIcon size={18} /> Logout
									</button>
								</div>
								<div className="bg-gray-50 p-4 text-center">
									<p className="text-xs text-gray-500 mb-1">(Login as {user?.username || 'admin'})</p>
									{logo ? (
										<img src={normalizeImageUrl(logo)} alt="Brand" className="h-6 mx-auto object-contain opacity-70" />
									) : (
										<div className="flex items-center justify-center gap-1 opacity-70">
											<div className="w-4 h-4 rounded-full border-2 border-green-500"></div>
											<span className="text-[10px] font-bold text-gray-600 tracking-widest uppercase">Overseas Products</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export const DashboardStatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => {
	const getCardStyle = (color: string) => {
		switch(color) {
			case 'pink':
				return 'bg-gradient-to-r from-pink-200 via-pink-100 to-pink-50';
			case 'orange':
				return 'bg-gradient-to-r from-orange-200 via-orange-100 to-orange-50';
			case 'green':
				return 'bg-gradient-to-r from-green-200 via-green-100 to-green-50';
			case 'purple':
				return 'bg-gradient-to-r from-purple-200 via-purple-100 to-purple-50';
			case 'lavender':
				return 'bg-gradient-to-r from-violet-200 via-violet-100 to-violet-50';
			case 'cyan':
				return 'bg-gradient-to-r from-cyan-200 via-cyan-100 to-cyan-50';
			case 'red':
				return 'bg-gradient-to-r from-red-200 via-red-100 to-red-50';
			case 'blue':
				return 'bg-gradient-to-r from-blue-200 via-blue-100 to-blue-50';
			case 'beige':
				return 'bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-50';
			case 'gray':
				return 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-50';
			default:
				return 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-50';
		}
	};

	const getIconStyle = (color: string) => {
		switch(color) {
			case 'pink':
				return 'border-pink-500 text-pink-500 bg-white';
			case 'orange':
				return 'border-orange-500 text-orange-500 bg-white';
			case 'green':
				return 'border-green-500 text-green-500 bg-white';
			case 'purple':
				return 'border-purple-500 text-purple-500 bg-white';
			case 'lavender':
				return 'border-violet-500 text-violet-500 bg-white';
			case 'cyan':
				return 'border-cyan-500 text-cyan-500 bg-white';
			case 'red':
				return 'border-red-500 text-red-500 bg-white';
			case 'blue':
				return 'border-blue-500 text-blue-500 bg-white';
			case 'beige':
				return 'border-amber-600 text-amber-600 bg-white';
			case 'gray':
				return 'border-gray-500 text-gray-500 bg-white';
			default:
				return 'border-gray-500 text-gray-500 bg-white';
		}
	};

	const getValueColor = (color: string) => {
		switch(color) {
			case 'pink':
			case 'red':
				return 'text-red-500';
			case 'orange':
				return 'text-orange-500';
			case 'green':
				return 'text-green-600';
			case 'purple':
				return 'text-purple-600';
			case 'lavender':
				return 'text-violet-600';
			case 'cyan':
			case 'blue':
				return 'text-blue-600';
			case 'beige':
				return 'text-amber-700';
			default:
				return 'text-gray-700';
		}
	};

	// Check if value is a currency (contains ৳ or starts with number)
	const isCurrency = typeof value === 'string' && (value.includes('৳') || value.includes('BDT'));
	const displayValue = isCurrency ? value : (typeof value === 'number' ? value : value);

	return (
		<div className={`p-4 rounded-2xl ${getCardStyle(colorClass)} relative overflow-hidden min-h-[120px]`}>
			{/* Icon */}
			<div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getIconStyle(colorClass)} shadow-sm`}>
				<div className="[&>svg]:w-5 [&>svg]:h-5">
					{icon}
				</div>
			</div>
			
			{/* Content */}
			<div className="mt-3">
				<p className="text-xs text-gray-600 font-medium">{title}</p>
				<div className="flex items-center gap-2 mt-1">
					<span className={`text-2xl font-bold ${getValueColor(colorClass)}`}>
						{isCurrency ? displayValue : `৳${displayValue}`}
					</span>
					{/* Trend line */}
					<svg width="40" height="16" viewBox="0 0 40 16" className={getValueColor(colorClass)}>
						<path d="M0 12 L8 8 L16 10 L24 4 L32 6 L40 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</div>
			</div>
		</div>
	);
};
