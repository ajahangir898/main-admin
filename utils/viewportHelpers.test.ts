import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getViewportWidth,
  getViewportHeight,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  isLargeDesktopViewport,
  initViewportTracking,
  cleanupViewportTracking,
} from './viewportHelpers';

describe('viewportHelpers', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Initialize viewport tracking
    initViewportTracking();
  });

  afterEach(() => {
    cleanupViewportTracking();
  });

  it('should return cached viewport width', () => {
    expect(getViewportWidth()).toBe(1024);
  });

  it('should return cached viewport height', () => {
    expect(getViewportHeight()).toBe(768);
  });

  it('should identify mobile viewport correctly', () => {
    // Set to mobile size
    (window as any).innerWidth = 375;
    initViewportTracking();
    
    // Need to wait for RAF to complete
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(isMobileViewport()).toBe(true);
        expect(isTabletViewport()).toBe(false);
        expect(isDesktopViewport()).toBe(false);
        resolve();
      });
    });
  });

  it('should identify tablet viewport correctly', () => {
    // Set to tablet size
    (window as any).innerWidth = 800;
    initViewportTracking();
    
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(isMobileViewport()).toBe(false);
        expect(isTabletViewport()).toBe(true);
        expect(isDesktopViewport()).toBe(false);
        resolve();
      });
    });
  });

  it('should identify desktop viewport correctly', () => {
    // Clean up first, then set to desktop size
    cleanupViewportTracking();
    (window as any).innerWidth = 1024;
    initViewportTracking();
    
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(isDesktopViewport()).toBe(true);
        expect(isLargeDesktopViewport()).toBe(false);
        resolve();
      });
    });
  });

  it('should identify large desktop viewport correctly', () => {
    // Set to large desktop size
    (window as any).innerWidth = 1920;
    initViewportTracking();
    
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(isLargeDesktopViewport()).toBe(true);
        expect(isDesktopViewport()).toBe(true);
        resolve();
      });
    });
  });

  it('should cache viewport dimensions to prevent forced reflows', () => {
    // Clean up first, then set to known size
    cleanupViewportTracking();
    (window as any).innerWidth = 1024;
    initViewportTracking();
    
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        // This test ensures that repeated calls don't trigger layout recalculation
        const width1 = getViewportWidth();
        const width2 = getViewportWidth();
        const width3 = getViewportWidth();
        
        expect(width1).toBe(width2);
        expect(width2).toBe(width3);
        expect(width1).toBe(1024);
        resolve();
      });
    });
  });
});
