import { describe, it, expect, beforeAll } from 'vitest';
import { SubscriptionService } from '../services/SubscriptionService';

// Mock API base URL for testing
const mockApiUrl = 'http://localhost:5000';

describe('SubscriptionService', () => {
  describe('Plan Management', () => {
    it('should have getPlans method', () => {
      expect(SubscriptionService.getPlans).toBeDefined();
      expect(typeof SubscriptionService.getPlans).toBe('function');
    });

    it('should have createPlan method', () => {
      expect(SubscriptionService.createPlan).toBeDefined();
      expect(typeof SubscriptionService.createPlan).toBe('function');
    });

    it('should have updatePlan method', () => {
      expect(SubscriptionService.updatePlan).toBeDefined();
      expect(typeof SubscriptionService.updatePlan).toBe('function');
    });

    it('should have deletePlan method', () => {
      expect(SubscriptionService.deletePlan).toBeDefined();
      expect(typeof SubscriptionService.deletePlan).toBe('function');
    });
  });

  describe('Transaction Management', () => {
    it('should have getTransactions method', () => {
      expect(SubscriptionService.getTransactions).toBeDefined();
      expect(typeof SubscriptionService.getTransactions).toBe('function');
    });

    it('should have createTransaction method', () => {
      expect(SubscriptionService.createTransaction).toBeDefined();
      expect(typeof SubscriptionService.createTransaction).toBe('function');
    });

    it('should have refundTransaction method', () => {
      expect(SubscriptionService.refundTransaction).toBeDefined();
      expect(typeof SubscriptionService.refundTransaction).toBe('function');
    });
  });

  describe('Invoice Management', () => {
    it('should have getInvoices method', () => {
      expect(SubscriptionService.getInvoices).toBeDefined();
      expect(typeof SubscriptionService.getInvoices).toBe('function');
    });

    it('should have createInvoice method', () => {
      expect(SubscriptionService.createInvoice).toBeDefined();
      expect(typeof SubscriptionService.createInvoice).toBe('function');
    });

    it('should have updateInvoiceStatus method', () => {
      expect(SubscriptionService.updateInvoiceStatus).toBeDefined();
      expect(typeof SubscriptionService.updateInvoiceStatus).toBe('function');
    });
  });

  describe('Trial Management', () => {
    it('should have getTrialSettings method', () => {
      expect(SubscriptionService.getTrialSettings).toBeDefined();
      expect(typeof SubscriptionService.getTrialSettings).toBe('function');
    });

    it('should have updateTrialSettings method', () => {
      expect(SubscriptionService.updateTrialSettings).toBeDefined();
      expect(typeof SubscriptionService.updateTrialSettings).toBe('function');
    });
  });

  describe('Statistics', () => {
    it('should have getStats method', () => {
      expect(SubscriptionService.getStats).toBeDefined();
      expect(typeof SubscriptionService.getStats).toBe('function');
    });
  });
});
