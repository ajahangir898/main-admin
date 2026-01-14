import React, { useState, useEffect } from 'react';
import { OfferLandingPage } from '../components/OfferLandingPage';
import { getOfferPageBySlug, incrementOfferPageOrders, OfferPageResponse } from '../services/DataService';
import { useTenant } from '../hooks/useTenant';
import { Loader2, AlertCircle, Gift } from 'lucide-react';

interface PublicOfferPageProps {
  websiteConfig?: {
    websiteName?: string;
    whatsappNumber?: string;
    phones?: string[];
  };
}

const PublicOfferPage: React.FC<PublicOfferPageProps> = ({ websiteConfig }) => {
  const { activeTenantId, tenants } = useTenant();
  const [offerPage, setOfferPage] = useState<OfferPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get slug from URL
  const getSlugFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/^\/offer\/(.+)/);
    return match ? match[1] : null;
  };
  
  const slug = getSlugFromUrl();
  
  // Get tenant subdomain
  const tenantSubdomain = tenants.find(t => t.id === activeTenantId)?.subdomain;
  
  // Fetch offer page data
  useEffect(() => {
    const fetchOfferPage = async () => {
      if (!slug || !activeTenantId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const page = await getOfferPageBySlug(slug, activeTenantId, true);
        setOfferPage(page);
      } catch (err) {
        console.error('[PublicOfferPage] Error fetching offer page:', err);
        setError('Offer page not found');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOfferPage();
  }, [slug, activeTenantId]);
  
  // Handle order submission
  const handleOrder = async (data: {
    name: string;
    phone: string;
    address: string;
    quantity: number;
    offerPageId: string;
  }) => {
    try {
      // Increment order count
      await incrementOfferPageOrders(data.offerPageId);
      
      // Create order
      const orderData = {
        customer: data.name,
        phone: data.phone,
        location: data.address,
        quantity: data.quantity,
        productName: offerPage?.productTitle,
        productId: offerPage?.productId,
        source: 'landing_page',
        landingPageId: data.offerPageId,
        status: 'Pending'
      };
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
    } catch (err) {
      console.error('[PublicOfferPage] Order submission error:', err);
      throw err;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gift className="text-white" size={32} />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading offer...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !offerPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Offer Not Found</h1>
          <p className="text-gray-500 mb-6">
            The offer you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <OfferLandingPage
      offerPage={offerPage as any}
      onOrder={handleOrder}
      tenantSubdomain={tenantSubdomain}
      websiteConfig={websiteConfig}
    />
  );
};

export default PublicOfferPage;
