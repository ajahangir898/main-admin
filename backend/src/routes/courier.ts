import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

const STEADFAST_BASE_URL = 'https://portal.steadfast.com.bd/api/v1';

// Test API credentials
router.post('/steadfast/test-credentials', async (req: Request, res: Response) => {
  try {
    const { apiKey, secretKey } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API Key and Secret Key are required' });
    }

    // Test by calling the balance endpoint
    const response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey.trim(),
        'Secret-Key': secretKey.trim(),
      },
    });

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        valid: false,
        error: 'Steadfast API returned an error. Your credentials may be invalid or your account may need activation.',
        status: response.status
      });
    }

    if (response.ok && data) {
      return res.json({
        valid: true,
        balance: data.current_balance || data.balance,
        message: 'API credentials are valid!'
      });
    }

    return res.json({
      valid: false,
      error: data?.message || 'Failed to verify credentials',
      details: data
    });
  } catch (error) {
    console.error('[Courier] Test credentials error:', error);
    res.status(500).json({ valid: false, error: 'Failed to connect to Steadfast API' });
  }
});

// Proxy: Send order to Steadfast
router.post('/steadfast/create-order', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKey, secretKey, orderData } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API Key and Secret Key are required' });
    }

    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    console.log('[Courier] Sending to Steadfast with keys:', apiKey.substring(0, 8) + '...');
    console.log('[Courier] Order data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey.trim(),
        'Secret-Key': secretKey.trim(),
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    console.log('[Courier] Steadfast response status:', response.status);
    console.log('[Courier] Steadfast response:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // Steadfast returned HTML or non-JSON response
      console.error('[Courier] Failed to parse Steadfast response as JSON');
      
      // Check if it's an authentication error
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({
          error: 'Invalid Steadfast API credentials. Please check your API Key and Secret Key.',
        });
      }
      
      return res.status(502).json({
        error: 'Steadfast API returned an error. This could be due to invalid credentials, server issues, or invalid order data.',
        status: response.status,
        hint: 'Please verify your API Key and Secret Key in Courier Settings are correct.'
      });
    }

    if (!response.ok) {
      // Check for specific error messages from Steadfast
      const errorMessage = data?.message || data?.errors?.[0] || data?.error || 'Steadfast API request failed';
      return res.status(response.status).json({
        error: errorMessage,
        details: data
      });
    }

    // Success response
    console.log('[Courier] Steadfast success:', JSON.stringify(data));
    res.json(data);
  } catch (error) {
    console.error('[Courier] Steadfast create order error:', error);
    res.status(500).json({ error: 'Failed to connect to Steadfast API' });
  }
});

// Proxy: Check fraud status by phone
router.post('/steadfast/fraud-check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKey, secretKey, phone } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API Key and Secret Key are required' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Sanitize phone number
    let sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.startsWith('88') && sanitizedPhone.length > 11) {
      sanitizedPhone = sanitizedPhone.slice(2);
    }
    if (!sanitizedPhone.startsWith('0') && sanitizedPhone.length === 10) {
      sanitizedPhone = `0${sanitizedPhone}`;
    }

    console.log('[Courier] Checking fraud for phone:', sanitizedPhone);

    // Try the status_by_phone endpoint
    const response = await fetch(`${STEADFAST_BASE_URL}/status_by_phone/${sanitizedPhone}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
    });

    const responseText = await response.text();
    console.log('[Courier] Steadfast fraud check response status:', response.status);
    console.log('[Courier] Steadfast fraud check response:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If can't parse, return default response
      return res.json({
        status: 'New Customer',
        delivery_count: 0,
        cancel_count: 0,
        message: 'No previous order history found'
      });
    }

    if (!response.ok) {
      // If endpoint fails, return a default "no data" response
      return res.json({
        status: 'No History',
        delivery_count: 0,
        cancel_count: 0,
        message: 'No previous order history found for this phone number'
      });
    }

    // Parse the response - Steadfast returns order history
    let deliveryCount = 0;
    let cancelCount = 0;
    let fraudStatus = 'Unknown';

    if (Array.isArray(data)) {
      // If it returns an array of orders
      data.forEach((order: any) => {
        const status = (order.delivery_status || '').toLowerCase();
        if (status === 'delivered') deliveryCount++;
        if (status === 'cancelled' || status === 'partial_delivered' || status === 'returned') cancelCount++;
      });
      
      const total = deliveryCount + cancelCount;
      if (total === 0) {
        fraudStatus = 'New Customer';
      } else if (cancelCount === 0) {
        fraudStatus = 'Safe';
      } else if (total > 0 && cancelCount / total > 0.5) {
        fraudStatus = 'High Risk';
      } else if (total > 0 && cancelCount / total > 0.25) {
        fraudStatus = 'Medium Risk';
      } else {
        fraudStatus = 'Low Risk';
      }
    } else if (data && typeof data === 'object') {
      // Single response object
      deliveryCount = data.delivery_count || data.total_delivered || 0;
      cancelCount = data.cancel_count || data.total_cancelled || 0;
      fraudStatus = data.fraud_status || data.status || 'Unknown';
    }

    res.json({
      status: fraudStatus,
      delivery_count: deliveryCount,
      cancel_count: cancelCount,
      raw: data
    });
  } catch (error) {
    console.error('[Courier] Steadfast fraud check error:', error);
    // Return a graceful response instead of error
    res.json({
      status: 'Check Failed',
      delivery_count: 0,
      cancel_count: 0,
      message: 'Unable to verify customer history'
    });
  }
});

// Proxy: Check order status by consignment ID
router.post('/steadfast/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKey, secretKey, consignmentId, trackingCode, invoice } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API Key and Secret Key are required' });
    }

    let endpoint = '';
    if (consignmentId) {
      endpoint = `${STEADFAST_BASE_URL}/status_by_cid/${consignmentId}`;
    } else if (trackingCode) {
      endpoint = `${STEADFAST_BASE_URL}/status_by_trackingcode/${trackingCode}`;
    } else if (invoice) {
      endpoint = `${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`;
    } else {
      return res.status(400).json({ error: 'consignmentId, trackingCode, or invoice is required' });
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
      },
    });

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(502).json({
        error: 'Steadfast API returned an invalid response',
        details: responseText.substring(0, 200)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || 'Steadfast API request failed',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('[Courier] Steadfast status check error:', error);
    res.status(500).json({ error: 'Failed to connect to Steadfast API' });
  }
});

export const courierRouter = router;
