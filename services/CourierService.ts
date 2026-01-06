import { CourierConfig, Order } from '../types';

// Use backend proxy to avoid CORS issues
const getApiBaseUrl = () => {
  // In production, use the same origin (for proxy routing)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  // Fallback for local development
  return import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5001';
};

const sanitizePhone = (value?: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('88') && digits.length > 11) return digits.slice(2);
  if (!digits.startsWith('0') && digits.length === 10) return `0${digits}`;
  return digits;
};

const normalizeInvoice = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '').slice(-20) || `INV-${Date.now()}`;

const buildSteadfastPayload = (order: Order, config: CourierConfig) => {
  const payload: Record<string, unknown> = {
    invoice: normalizeInvoice(order.id),
    recipient_name: order.customer,
    recipient_phone: sanitizePhone(order.phone),
    recipient_address: order.location,
    recipient_city: order.division || 'Dhaka',
    cod_amount: Math.round(order.amount),
    note: config.instruction || `Delivery type: ${order.deliveryType || 'Regular'}`,
    delivery_type: order.deliveryType === 'Express' ? 'express' : 'regular',
    item_weight: 1,
    requested_delivery_time: order.deliveryType === 'Express' ? 'asap' : undefined,
    product_id: order.productId ? String(order.productId) : undefined,
    product_description: order.productName,
    customer_email: order.email,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, val]) => val !== undefined && val !== null));
};

export interface CourierSyncResult {
  trackingId: string;
  reference?: string;
  payload: Record<string, unknown>;
  response: any;
}

export interface FraudCheckResult {
  status: string;
  riskScore?: number;
  remarks?: string;
  raw: any;
}

export class CourierService {
  static async sendToSteadfast(order: Order, config: CourierConfig): Promise<CourierSyncResult> {
    if (!config.apiKey || !config.secretKey) {
      throw new Error('Steadfast credentials are missing. Update Courier Settings and try again.');
    }
    if (!order.phone) {
      throw new Error('Customer phone number is missing for this order.');
    }

    const orderData = buildSteadfastPayload(order, config);

    try {
      // Use backend proxy to avoid CORS
      const response = await fetch(`${getApiBaseUrl()}/api/courier/steadfast/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          apiKey: config.apiKey.trim(),
          secretKey: config.secretKey.trim(),
          orderData
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error || data?.message || 'Steadfast API request failed.';
        throw new Error(message);
      }

      const trackingId = data?.tracking_code || data?.consignment?.tracking_code || data?.consignment_id || data?.invoice;
      if (!trackingId) {
        throw new Error('Steadfast response did not include a tracking ID.');
      }

      return {
        trackingId,
        reference: data?.consignment_id || data?.consignment?.consignment_id || data?.invoice,
        payload: orderData,
        response: data
      };
    } catch (error) {
      if (import.meta?.env?.DEV) {
        console.error('Failed to sync with Steadfast', error);
      }
      throw error instanceof Error ? error : new Error('Unexpected error while contacting Steadfast.');
    }
  }

  static async checkFraudRisk(order: Order, config: CourierConfig): Promise<FraudCheckResult> {
    if (!config.apiKey || !config.secretKey) {
      throw new Error('Steadfast credentials are missing. Update Courier Settings and try again.');
    }
    if (!order.phone) {
      throw new Error('Customer phone number is required to run a fraud check.');
    }

    try {
      // Use backend proxy to avoid CORS
      const response = await fetch(`${getApiBaseUrl()}/api/courier/steadfast/fraud-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          apiKey: config.apiKey.trim(),
          secretKey: config.secretKey.trim(),
          phone: order.phone
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error || data?.message || 'Fraud check failed.';
        throw new Error(message);
      }

      // Parse response from backend proxy
      const deliveryCount = data?.delivery_count || 0;
      const cancelCount = data?.cancel_count || 0;
      const totalOrders = deliveryCount + cancelCount;
      
      // Calculate risk score
      let riskScore = 0;
      if (totalOrders > 0) {
        riskScore = Math.round((cancelCount / totalOrders) * 100);
      }

      return {
        status: data?.status || 'Unknown',
        riskScore,
        remarks: `Delivered: ${deliveryCount}, Cancelled: ${cancelCount}${data?.message ? ` - ${data.message}` : ''}`,
        raw: data?.raw || data,
      };
    } catch (error) {
      if (import.meta?.env?.DEV) {
        console.error('Failed to run Steadfast fraud check', error);
      }
      throw error instanceof Error ? error : new Error('Unexpected error during Steadfast fraud check.');
    }
  }
}

