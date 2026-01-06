import { describe, it, expect } from 'vitest';
import { DataService } from './DataService';
import { DEFAULT_CAROUSEL_ITEMS } from '../constants';
import { WebsiteConfig } from '../types';

describe('DataService default carousel items', () => {
  it('exposes the provided defaults in website config fallback', () => {
    const defaults = (DataService as { getDefaultWebsiteConfig: () => WebsiteConfig }).getDefaultWebsiteConfig();
    expect(defaults.carouselItems).toEqual(DEFAULT_CAROUSEL_ITEMS);
  });
});
