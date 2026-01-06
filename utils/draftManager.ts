import { Product } from '../types';

const DRAFT_STORAGE_KEY = 'product_drafts';

export interface DraftProduct extends Partial<Product> {
  draftId: string;
  lastSaved: string;
  isDraft: true;
}

/**
 * Get all draft products from localStorage
 */
export const getDrafts = (tenantId: string = 'default'): DraftProduct[] => {
  try {
    const stored = localStorage.getItem(`${DRAFT_STORAGE_KEY}_${tenantId}`);
    if (!stored) return [];
    return JSON.parse(stored) as DraftProduct[];
  } catch (error) {
    console.error('Failed to load drafts:', error);
    return [];
  }
};

/**
 * Save a draft product to localStorage
 */
export const saveDraft = (
  draft: Partial<Product>,
  draftId: string,
  tenantId: string = 'default'
): void => {
  try {
    const drafts = getDrafts(tenantId);
    const draftProduct: DraftProduct = {
      ...draft,
      draftId,
      lastSaved: new Date().toISOString(),
      isDraft: true,
    };

    // Find and update existing draft or add new one
    const existingIndex = drafts.findIndex(d => d.draftId === draftId);
    if (existingIndex >= 0) {
      drafts[existingIndex] = draftProduct;
    } else {
      drafts.push(draftProduct);
    }

    localStorage.setItem(`${DRAFT_STORAGE_KEY}_${tenantId}`, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
};

/**
 * Delete a draft product from localStorage
 */
export const deleteDraft = (draftId: string, tenantId: string = 'default'): void => {
  try {
    const drafts = getDrafts(tenantId);
    const filtered = drafts.filter(d => d.draftId !== draftId);
    localStorage.setItem(`${DRAFT_STORAGE_KEY}_${tenantId}`, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete draft:', error);
  }
};

/**
 * Clear all drafts for a tenant
 */
export const clearAllDrafts = (tenantId: string = 'default'): void => {
  try {
    localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${tenantId}`);
  } catch (error) {
    console.error('Failed to clear drafts:', error);
  }
};

/**
 * Generate a unique draft ID
 */
export const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};
