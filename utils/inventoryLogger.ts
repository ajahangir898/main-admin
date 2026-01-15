// Utility function to log inventory changes to the database

// Get API base URL from environment
const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL)
  : '';

interface InventoryChange {
  productId: string | number;
  productName: string;
  previousStock: number;
  newStock: number;
  tenantId?: string;
}

interface InventoryLogPayload {
  tenantId?: string;
  action: string;
  actionType: 'update';
  resourceType: 'inventory';
  resourceId: string;
  resourceName: string;
  details: string;
  metadata: {
    productId: string | number;
    productName: string;
    previousStock: number;
    newStock: number;
    stockChange: number;
  };
  status: 'success' | 'failure' | 'warning';
}

// Helper function to safely get token from localStorage (client-side only)
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('admin_auth_token');
  } catch {
    return null;
  }
};

/**
 * Log a single inventory change to the audit log database
 */
export async function logInventoryChange(change: InventoryChange): Promise<void> {
  const token = getStoredToken();
  if (!token) {
    console.warn('[InventoryLogger] No auth token available');
    return;
  }

  const stockChange = change.newStock - change.previousStock;
  const changeType = stockChange > 0 ? 'increased' : stockChange < 0 ? 'decreased' : 'unchanged';

  const payload: InventoryLogPayload = {
    tenantId: change.tenantId,
    action: 'Inventory Updated',
    actionType: 'update',
    resourceType: 'inventory',
    resourceId: String(change.productId),
    resourceName: change.productName,
    details: `Stock ${changeType} from ${change.previousStock} to ${change.newStock} (${stockChange >= 0 ? '+' : ''}${stockChange})`,
    metadata: {
      productId: change.productId,
      productName: change.productName,
      previousStock: change.previousStock,
      newStock: change.newStock,
      stockChange: stockChange,
    },
    status: 'success',
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('[InventoryLogger] Failed to log inventory change:', response.statusText);
    }
  } catch (error) {
    console.error('[InventoryLogger] Error logging inventory change:', error);
  }
}

/**
 * Compare products and log all inventory changes
 */
export async function logInventoryChanges(
  previousProducts: Array<{ id: string | number; name: string; stock?: number }>,
  newProducts: Array<{ id: string | number; name: string; stock?: number }>,
  tenantId?: string
): Promise<void> {
  const previousMap = new Map(previousProducts.map(p => [String(p.id), p]));
  const changes: InventoryChange[] = [];

  for (const newProduct of newProducts) {
    const prevProduct = previousMap.get(String(newProduct.id));
    const prevStock = prevProduct?.stock ?? 0;
    const newStock = newProduct.stock ?? 0;

    // Only log if stock actually changed
    if (prevProduct && prevStock !== newStock) {
      changes.push({
        productId: newProduct.id,
        productName: newProduct.name,
        previousStock: prevStock,
        newStock: newStock,
        tenantId,
      });
    }
  }

  // Log all changes in parallel
  if (changes.length > 0) {
    console.log(`[InventoryLogger] Logging ${changes.length} inventory changes`);
    await Promise.all(changes.map(change => logInventoryChange(change)));
  }
}

export default {
  logInventoryChange,
  logInventoryChanges,
};
