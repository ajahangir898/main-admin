import { DueEntity, DueTransaction, CreateDueTransactionPayload, CreateEntityPayload } from '../types';

// Production API URL
const API_BASE = 'https://systemnextit.com/api';

class DueListService {
  // ============ ENTITY ENDPOINTS ============

  /**
   * Get all entities with optional type and search filters
   */
  async getEntities(type?: string, search?: string): Promise<DueEntity[]> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE}/entities${params.toString() ? `?${params}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch entities');
      return await response.json();
    } catch (error) {
      console.error('Error fetching entities:', error);
      throw error;
    }
  }

  /**
   * Get a single entity by ID
   */
  async getEntity(id: string): Promise<DueEntity> {
    try {
      const response = await fetch(`${API_BASE}/entities/${id}`);
      if (!response.ok) throw new Error('Failed to fetch entity');
      return await response.json();
    } catch (error) {
      console.error('Error fetching entity:', error);
      throw error;
    }
  }

  /**
   * Create a new entity (Customer, Supplier, or Employee)
   */
  async createEntity(payload: CreateEntityPayload): Promise<DueEntity> {
    try {
      const response = await fetch(`${API_BASE}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create entity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  }

  // ============ TRANSACTION ENDPOINTS ============

  /**
   * Get transactions with optional filters
   */
  async getTransactions(
    entityId?: string,
    from?: string,
    to?: string,
    status?: string
  ): Promise<DueTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (entityId) params.append('entityId', entityId);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (status) params.append('status', status);

      const response = await fetch(`${API_BASE}/transactions${params.toString() ? `?${params}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: string): Promise<DueTransaction> {
    try {
      const response = await fetch(`${API_BASE}/transactions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch transaction');
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(payload: CreateDueTransactionPayload): Promise<DueTransaction> {
    try {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status (Pending, Paid, Cancelled)
   */
  async updateTransactionStatus(id: string, status: string): Promise<DueTransaction> {
    try {
      const response = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update transaction');
      return await response.json();
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete transaction');
      return await response.json();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}

export const dueListService = new DueListService();
