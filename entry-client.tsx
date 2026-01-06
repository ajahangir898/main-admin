import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';

// Prefetch bootstrap data BEFORE React loads - critical for fast initial render
// This runs in parallel with module loading, so data is ready when React needs it
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Get tenant scope from subdomain or cached value
const getTenantScope = (): string => {
  if (typeof window === 'undefined') return 'public';
  const hostname = window.location.hostname;
  // Skip for admin/superadmin subdomains
  if (hostname.startsWith('admin.') || hostname.startsWith('superadmin.')) return '';
  // Extract subdomain
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    const subdomain = parts[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    // Check cached tenant ID for this subdomain
    try {
      const cached = localStorage.getItem(`tenant_id_${subdomain}`);
      if (cached) return cached;
    } catch {}
    return ''; // Will be resolved by App.tsx
  }
  // Check active tenant from localStorage
  try {
    const stored = localStorage.getItem('activeTenant');
    if (stored) return stored;
    const session = localStorage.getItem('user_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed?.tenantId || parsed?.tenant?.id || 'public';
    }
  } catch {}
  return 'public';
};

// Start prefetching bootstrap data immediately (before React loads)
const tenantScope = getTenantScope();
const prefetchPromise = tenantScope ? 
  fetch(`${API_BASE}/api/tenant-data/${tenantScope}/bootstrap`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  }).then(r => r.ok ? r.json() : null).catch(() => null) : 
  Promise.resolve(null);

// Store for DataService to use
if (typeof window !== 'undefined' && tenantScope) {
  (window as any).__PREFETCHED_BOOTSTRAP__ = prefetchPromise;
}

const container = document.getElementById('root')!;

// Load CSS and App in PARALLEL (not sequential) for faster startup
// CSS is non-blocking, React can render while CSS loads
const cssPromise = import('./styles/tailwind.css');
const appPromise = import('./App');

// Start rendering as soon as App loads - don't wait for CSS
appPromise.then(({ default: App }) => {
  // Render immediately - CSS will apply when ready
  if (container.hasChildNodes()) {
    hydrateRoot(container, <App />);
  } else {
    createRoot(container).render(<App />);
  }
  
  // Remove skeleton after React has rendered first frame
  requestAnimationFrame(() => {
    const initialLoader = document.getElementById('initial-loader');
    if (initialLoader) {
      initialLoader.style.opacity = '0';
      initialLoader.style.transition = 'opacity 150ms ease-out';
      setTimeout(() => initialLoader.remove(), 150);
    }
  });
});

// Ensure CSS is loaded (for error handling)
cssPromise.catch(e => console.warn('CSS load failed:', e));
