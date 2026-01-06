import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getDrafts,
  saveDraft,
  deleteDraft,
  clearAllDrafts,
  generateDraftId,
  DraftProduct,
} from './draftManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as any;

describe('draftManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateDraftId', () => {
    test('generates unique draft IDs', () => {
      const id1 = generateDraftId();
      const id2 = generateDraftId();
      
      expect(id1).toMatch(/^draft_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^draft_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getDrafts', () => {
    test('returns empty array when no drafts exist', () => {
      const drafts = getDrafts('tenant1');
      expect(drafts).toEqual([]);
    });

    test('returns stored drafts for a tenant', () => {
      const mockDrafts: DraftProduct[] = [
        {
          draftId: 'draft_123',
          name: 'Test Product',
          price: 100,
          lastSaved: '2024-01-01T00:00:00.000Z',
          isDraft: true,
        },
      ];

      localStorage.setItem('product_drafts_tenant1', JSON.stringify(mockDrafts));

      const drafts = getDrafts('tenant1');
      expect(drafts).toEqual(mockDrafts);
    });

    test('returns empty array on parse error', () => {
      localStorage.setItem('product_drafts_tenant1', 'invalid json');
      const drafts = getDrafts('tenant1');
      expect(drafts).toEqual([]);
    });
  });

  describe('saveDraft', () => {
    test('creates a new draft', () => {
      const draftData = {
        name: 'New Product',
        price: 200,
        category: 'Electronics',
      };

      saveDraft(draftData, 'draft_456', 'tenant1');

      const drafts = getDrafts('tenant1');
      expect(drafts).toHaveLength(1);
      expect(drafts[0].draftId).toBe('draft_456');
      expect(drafts[0].name).toBe('New Product');
      expect(drafts[0].isDraft).toBe(true);
      expect(drafts[0].lastSaved).toBeDefined();
    });

    test('updates existing draft', () => {
      const draftData1 = {
        name: 'Product v1',
        price: 100,
      };

      const draftData2 = {
        name: 'Product v2',
        price: 150,
      };

      saveDraft(draftData1, 'draft_789', 'tenant1');
      saveDraft(draftData2, 'draft_789', 'tenant1');

      const drafts = getDrafts('tenant1');
      expect(drafts).toHaveLength(1);
      expect(drafts[0].name).toBe('Product v2');
      expect(drafts[0].price).toBe(150);
    });

    test('saves multiple drafts', () => {
      saveDraft({ name: 'Product 1' }, 'draft_1', 'tenant1');
      saveDraft({ name: 'Product 2' }, 'draft_2', 'tenant1');
      saveDraft({ name: 'Product 3' }, 'draft_3', 'tenant1');

      const drafts = getDrafts('tenant1');
      expect(drafts).toHaveLength(3);
    });
  });

  describe('deleteDraft', () => {
    test('deletes a specific draft', () => {
      saveDraft({ name: 'Product 1' }, 'draft_1', 'tenant1');
      saveDraft({ name: 'Product 2' }, 'draft_2', 'tenant1');

      deleteDraft('draft_1', 'tenant1');

      const drafts = getDrafts('tenant1');
      expect(drafts).toHaveLength(1);
      expect(drafts[0].draftId).toBe('draft_2');
    });

    test('does nothing if draft does not exist', () => {
      saveDraft({ name: 'Product 1' }, 'draft_1', 'tenant1');
      
      deleteDraft('nonexistent', 'tenant1');

      const drafts = getDrafts('tenant1');
      expect(drafts).toHaveLength(1);
    });
  });

  describe('clearAllDrafts', () => {
    test('removes all drafts for a tenant', () => {
      saveDraft({ name: 'Product 1' }, 'draft_1', 'tenant1');
      saveDraft({ name: 'Product 2' }, 'draft_2', 'tenant1');

      clearAllDrafts('tenant1');

      const drafts = getDrafts('tenant1');
      expect(drafts).toEqual([]);
    });

    test('does not affect other tenants', () => {
      saveDraft({ name: 'Tenant1 Product' }, 'draft_1', 'tenant1');
      saveDraft({ name: 'Tenant2 Product' }, 'draft_2', 'tenant2');

      clearAllDrafts('tenant1');

      const tenant1Drafts = getDrafts('tenant1');
      const tenant2Drafts = getDrafts('tenant2');

      expect(tenant1Drafts).toEqual([]);
      expect(tenant2Drafts).toHaveLength(1);
    });
  });
});
