import { useEffect } from 'react';
import type { FacebookPixelConfig } from '../types';

export function useFacebookPixel(cfg: FacebookPixelConfig) {
  useEffect(() => {
    const remove = () => { ['facebook-pixel-script', 'facebook-pixel-noscript'].forEach(id => document.getElementById(id)?.remove()); };
    if (!cfg?.isEnabled || !cfg.pixelId) { remove(); return; }
    remove();
    const pixelId = cfg.pixelId.trim(), testId = cfg.enableTestEvent ? `TEST_${Date.now()}` : null;
    const load = () => {
      if (typeof (window as any).fbq === 'function') { (window as any).fbq('init', pixelId, undefined, testId ? { eventID: testId } : undefined); (window as any).fbq('track', 'PageView'); return; }
      const s = Object.assign(document.createElement('script'), { id: 'facebook-pixel-script', async: true, defer: true, src: 'https://connect.facebook.net/en_US/fbevents.js' });
      s.onload = () => { if (typeof (window as any).fbq === 'function') { (window as any).fbq('init', pixelId, undefined, testId ? { eventID: testId } : undefined); (window as any).fbq('track', 'PageView'); } };
      document.head.appendChild(s);
      const ns = document.createElement('noscript'); ns.id = 'facebook-pixel-noscript'; ns.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1${cfg.enableTestEvent ? '&cd[event_source_url]=test' : ''}" />`;
      document.body.appendChild(ns);
    };
    'requestIdleCallback' in window ? (window as any).requestIdleCallback(load, { timeout: 1200 }) : setTimeout(load, 1200);
    return remove;
  }, [cfg]);
}
