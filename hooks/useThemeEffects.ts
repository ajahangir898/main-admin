/**
 * useThemeEffects - Theme application and persistence extracted from App.tsx
 */

import { useEffect, useRef } from 'react';
import type { ThemeConfig, WebsiteConfig } from '../types';
import { DataService, isKeyFromSocket, clearSocketFlag } from '../services/DataService';
import { hexToRgb } from '../utils/appHelpers';

interface UseThemeEffectsOptions {
  themeConfig: ThemeConfig | null;
  websiteConfig?: WebsiteConfig;
  activeTenantId: string;
  isLoading: boolean;
  currentView: string;
  isTenantSwitching?: boolean;
}

export function useThemeEffects({
  themeConfig,
  websiteConfig,
  activeTenantId,
  isLoading,
  currentView,
  isTenantSwitching = false,
}: UseThemeEffectsOptions) {
  const themeLoadedRef = useRef(false);
  const lastSavedThemeRef = useRef<string>('');
  const websiteConfigLoadedRef = useRef(false);
  const lastSavedWebsiteConfigRef = useRef<string>('');

  // Reset on tenant change
  useEffect(() => {
    websiteConfigLoadedRef.current = false;
    themeLoadedRef.current = false;
    lastSavedThemeRef.current = '';
    lastSavedWebsiteConfigRef.current = '';
  }, [activeTenantId]);

  // Apply theme colors to CSS variables
  useEffect(() => { 
    if(!themeConfig || !activeTenantId) return;
    const root = document.documentElement;

    console.log('[useThemeEffects] Applying theme colors:', {
      primaryColor: themeConfig.primaryColor,
      secondaryColor: themeConfig.secondaryColor,
      tertiaryColor: themeConfig.tertiaryColor
    });

    // Store theme colors - apply for ALL views (store needs these too)
    root.style.setProperty('--color-primary-rgb', hexToRgb(themeConfig.primaryColor));
    root.style.setProperty('--color-secondary-rgb', hexToRgb(themeConfig.secondaryColor));
    root.style.setProperty('--color-tertiary-rgb', hexToRgb(themeConfig.tertiaryColor));
    root.style.setProperty('--color-font-rgb', hexToRgb(themeConfig.fontColor));
    root.style.setProperty('--color-hover-rgb', hexToRgb(themeConfig.hoverColor));
    root.style.setProperty('--color-surface-rgb', hexToRgb(themeConfig.surfaceColor));

    console.log('[useThemeEffects] CSS variables set:', {
      primary: root.style.getPropertyValue('--color-primary-rgb'),
      secondary: root.style.getPropertyValue('--color-secondary-rgb'),
      tertiary: root.style.getPropertyValue('--color-tertiary-rgb')
    });

    // Admin-only theme tokens - only apply when admin shell is active
    const isAdminView = currentView === 'admin' || currentView === 'admin-login';
    if (!isAdminView) {
      ['--admin-bg','--admin-bg-input','--admin-border-rgb','--admin-focus-rgb']
        .forEach((key) => root.style.removeProperty(key));
      root.classList.remove('dark');
    } else {
      if (themeConfig.adminBgColor) {
        root.style.setProperty('--admin-bg', hexToRgb(themeConfig.adminBgColor));
      }
      if (themeConfig.adminInputBgColor) {
        root.style.setProperty('--admin-bg-input', hexToRgb(themeConfig.adminInputBgColor));
      }
      if (themeConfig.adminBorderColor) {
        root.style.setProperty('--admin-border-rgb', hexToRgb(themeConfig.adminBorderColor));
      }
      if (themeConfig.adminFocusColor) {
        root.style.setProperty('--admin-focus-rgb', hexToRgb(themeConfig.adminFocusColor));
      }
      
      if (themeConfig.darkMode) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    
    // Track when theme is loaded (saves are handled by App.tsx)
    if(!isLoading && !isTenantSwitching && !themeLoadedRef.current) {
      themeLoadedRef.current = true;
      lastSavedThemeRef.current = JSON.stringify(themeConfig);
    }
  }, [themeConfig, isLoading, isTenantSwitching, activeTenantId, currentView]);

  // Website config - only handle favicon (saves are handled by App.tsx)
  useEffect(() => { 
    if(!isLoading && !isTenantSwitching && websiteConfig && activeTenantId) {
      if (!websiteConfigLoadedRef.current) {
        websiteConfigLoadedRef.current = true;
        lastSavedWebsiteConfigRef.current = JSON.stringify(websiteConfig);
      }
      
      // Apply favicon
      if (websiteConfig.favicon) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = websiteConfig.favicon;
      }
    }
  }, [websiteConfig, isLoading, isTenantSwitching, activeTenantId]);

  return {
    websiteConfigLoadedRef,
  };
}
