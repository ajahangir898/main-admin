import React, { useState, useEffect } from 'react';
import { Product, LandingPage } from '../types';
import { LandingPagePanel } from '../components/LandingPageComponents';
import { Sparkles, Globe, Loader2 } from 'lucide-react';
import { useTenant } from '../hooks/useTenant';
import { DataService } from '../services/DataService';

interface AdminLandingPageProps {
  products: Product[];
  landingPages: LandingPage[];
  onCreateLandingPage: (page: LandingPage) => void;
  onUpdateLandingPage: (page: LandingPage) => void;
  onTogglePublish: (pageId: string, status: LandingPage['status']) => void;
  onPreviewLandingPage: (page: LandingPage) => void;
}

const AdminLandingPage: React.FC<AdminLandingPageProps> = ({
  products,
  landingPages,
  onCreateLandingPage,
  onUpdateLandingPage,
  onTogglePublish,
  onPreviewLandingPage
}) => {
  const { tenants, activeTenantId } = useTenant();
  const [subdomain, setSubdomain] = useState<string>('');
  const [isLoadingSubdomain, setIsLoadingSubdomain] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Try to get subdomain from tenants array first, otherwise fetch it
  useEffect(() => {
    // If we already have subdomain, don't do anything
    if (subdomain) {
      setIsLoadingSubdomain(false);
      return;
    }

    // Try from tenants array first
    const tenant = tenants.find(t => t.id === activeTenantId);
    if (tenant?.subdomain) {
      console.log('[AdminLandingPage] Got subdomain from tenants:', tenant.subdomain);
      setSubdomain(tenant.subdomain);
      setIsLoadingSubdomain(false);
      return;
    }

    // If no activeTenantId yet, wait
    if (!activeTenantId) {
      return;
    }

    // Only fetch once if tenants don't have the subdomain
    if (!fetchAttempted && tenants.length === 0) {
      setFetchAttempted(true);
      console.log('[AdminLandingPage] Fetching tenants from DataService...');
      DataService.listTenants().then(tenantList => {
        const foundTenant = tenantList.find(t => t.id === activeTenantId);
        if (foundTenant?.subdomain) {
          console.log('[AdminLandingPage] Got subdomain from fetch:', foundTenant.subdomain);
          setSubdomain(foundTenant.subdomain);
        } else {
          console.log('[AdminLandingPage] No subdomain found for tenant:', activeTenantId);
        }
        setIsLoadingSubdomain(false);
      }).catch((err) => {
        console.error('[AdminLandingPage] Error fetching tenants:', err);
        setIsLoadingSubdomain(false);
      });
    } else if (tenants.length > 0) {
      // Tenants loaded but this tenant not found
      console.log('[AdminLandingPage] Tenant not found in loaded tenants');
      setIsLoadingSubdomain(false);
    }
  }, [activeTenantId, tenants, subdomain, fetchAttempted]);

  // Show loading state while subdomain is loading
  if (isLoadingSubdomain && !subdomain) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={28} />
              ল্যান্ডিং পেজ বিল্ডার
            </h1>
            <p className="text-gray-500 mt-1">প্রোডাক্ট সিলেক্ট করে সুন্দর সেলস পেজ তৈরি করুন</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <p className="text-gray-500">লোড হচ্ছে...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no subdomain after loading, show error
  if (!subdomain) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={28} />
              ল্যান্ডিং পেজ বিল্ডার
            </h1>
            <p className="text-gray-500 mt-1">প্রোডাক্ট সিলেক্ট করে সুন্দর সেলস পেজ তৈরি করুন</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-gray-500">
            <p>স্টোর সাবডোমেইন লোড করতে সমস্যা হয়েছে।</p>
            <p className="text-sm mt-2">পেজ রিফ্রেশ করে আবার চেষ্টা করুন।</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-purple-500" size={28} />
            ল্যান্ডিং পেজ বিল্ডার
          </h1>
          <p className="text-gray-500 mt-1">প্রোডাক্ট সিলেক্ট করে সুন্দর সেলস পেজ তৈরি করুন</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
            <Globe size={14} />
            <span className="font-medium">{landingPages.length} পেজ</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium">{landingPages.filter(p => p.status === 'published').length} লাইভ</span>
          </div>
        </div>
      </div>

      <LandingPagePanel
        products={products}
        landingPages={landingPages}
        onCreateLandingPage={onCreateLandingPage}
        onUpdateLandingPage={onUpdateLandingPage}
        onTogglePublish={onTogglePublish}
        onPreview={onPreviewLandingPage}
        tenantId={activeTenantId}
        tenantSubdomain={subdomain}
      />
    </div>
  );
};

export default AdminLandingPage;