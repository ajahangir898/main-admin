import React, { useEffect, useState } from 'react';
import { LandingPage, Product } from '../types';
import { OnePageCheckout, LandingCheckoutPayload } from '../components/LandingPageComponents';
import { ArrowLeft, Sparkles, Quote, HelpCircle, Star, Check, ChevronRight, Phone, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface LandingPagePreviewProps {
  page: LandingPage;
  product?: Product;
  onBack?: () => void;
  onSubmitLandingOrder: (payload: LandingCheckoutPayload & { pageId: string; productId: number }) => Promise<void> | void;
}

// Extract YouTube video ID
const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

// Ready Template Landing Page Preview - Mobile Optimized
const ReadyLandingPreview: React.FC<{ page: LandingPage; product?: Product; onSubmit: (payload: LandingCheckoutPayload) => void }> = ({ 
  page, product, onSubmit 
}) => {
  const config = page.customConfig || {};
  const videoId = getYouTubeId(config.videoUrl || '');
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const handleSubmit = async (payload: LandingCheckoutPayload) => {
    await onSubmit(payload);
    setOrderId(`LP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setOrderSubmitted(true);
  };
  
  if (orderSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: config.backgroundColor || '#fdf2f8' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">অর্ডার সফল হয়েছে!</h2>
          <p className="text-gray-600 mb-4">আপনার অর্ডারটি গ্রহণ করা হয়েছে। শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">অর্ডার নম্বর</p>
            <p className="text-lg font-bold text-gray-800">{orderId}</p>
          </div>
          <p className="text-sm text-gray-500">
            আপনার ফোন নম্বরে কল/SMS এর মাধ্যমে অর্ডার কনফার্ম করা হবে
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: config.backgroundColor || '#fdf2f8' }}>
      {/* Header Banner */}
      <div className="w-full py-2 px-4 text-center" style={{ backgroundColor: config.primaryColor || '#ec4899', color: 'white' }}>
        <p className="text-xs sm:text-sm font-semibold leading-tight">
          {config.headerText || 'বিশেষ অফার চলছে'}
        </p>
      </div>

      {/* Logo */}
      {config.showLogo && (
        <div className="flex justify-center py-4">
          {config.logoUrl ? (
            <img src={normalizeImageUrl(config.logoUrl)} alt="Logo" className="h-12 sm:h-16 object-contain" />
          ) : (
            <div className="font-bold text-xl sm:text-2xl">
              <span style={{ color: config.primaryColor || '#ec4899' }}>আমাদের</span>
              <span className="text-gray-800">স্টোর</span>
            </div>
          )}
        </div>
      )}

      {/* Product Hero Section */}
      {product && (
        <div className="max-w-4xl mx-auto px-4 pb-6">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mb-4">
            {config.productTitle || product.name}
          </h1>
          {config.heroImage && (
            <img 
              src={normalizeImageUrl(config.heroImage)} 
              alt={product.name} 
              className="w-full max-w-2xl mx-auto rounded-xl shadow-lg object-cover" 
            />
          )}
          <div className="text-center mt-4">
            <p className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: config.primaryColor || '#ec4899' }}>
              ৳{formatCurrency(product.price)}
            </p>
            {product.originalPrice && (
              <p className="text-lg text-gray-500 line-through">৳{formatCurrency(product.originalPrice)}</p>
            )}
            <p className="text-lg sm:text-xl font-semibold mt-2" style={{ color: config.primaryColor || '#ec4899' }}>
              {config.offerText || 'বিশেষ মূল্যে পাবেন'}
            </p>
          </div>
        </div>
      )}

      {/* Video Section */}
      {config.showVideo && videoId && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <h3 className="text-lg sm:text-2xl font-bold text-center mb-4" style={{ color: config.primaryColor || '#ec4899' }}>
            {config.videoTitle || 'ভিডিও দেখুন'}
          </h3>
          <div className="rounded-xl overflow-hidden shadow-lg aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Order Button */}
      <div className="max-w-2xl mx-auto px-4 pb-6">
        <a 
          href="#checkout"
          className="block w-full py-4 rounded-full text-white font-bold text-center text-lg shadow-lg hover:shadow-xl transition"
          style={{ backgroundColor: config.primaryColor || '#ec4899' }}
        >
          অর্ডার করুন <ArrowRight className="inline ml-2" size={20} />
        </a>
      </div>

      {/* Benefits Section */}
      {config.showBenefits && config.benefits?.length > 0 && (
        <div className="py-8 px-4" style={{ backgroundColor: config.secondaryColor || '#fce7f3' }}>
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-6" style={{ color: config.primaryColor || '#ec4899' }}>
              কেন আমাদের থেকে কিনবেন?
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {config.benefits.map((benefit: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm">
                  <Check size={20} style={{ color: config.primaryColor || '#ec4899' }} className="mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {config.showReviews && config.reviews?.length > 0 && (
        <div className="py-8 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-6" style={{ color: config.primaryColor || '#ec4899' }}>
              {config.reviewsTitle || 'কাস্টমার রিভিউ'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {config.reviews.map((review: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(review.rating || 5)].map((_, idx) => (
                        <Star key={idx} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{review.name}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Why Buy Section */}
      {config.showWhyBuy && (
        <div className="py-8 px-4" style={{ backgroundColor: config.secondaryColor || '#fce7f3' }}>
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: config.primaryColor || '#ec4899' }}>
              {config.whyBuyTitle || 'আমাদের কাছ থেকে প্রোডাক্ট কেন কিনবেন'}
            </h3>
            <p className="text-gray-700 text-sm sm:text-base max-w-2xl mx-auto">
              {config.whyBuyText}
            </p>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {config.showFAQ && config.faqs?.length > 0 && (
        <div className="py-8 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-6" style={{ color: config.primaryColor || '#ec4899' }}>
              {config.faqTitle || 'সাধারণ প্রশ্ন'}
            </h3>
            <div className="space-y-3">
              {config.faqs.map((faq: any, i: number) => (
                <details key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100 group">
                  <summary className="flex items-start gap-2 cursor-pointer font-semibold text-gray-800 text-sm sm:text-base">
                    <ChevronRight 
                      size={18} 
                      style={{ color: config.primaryColor || '#ec4899' }} 
                      className="mt-0.5 flex-shrink-0 group-open:rotate-90 transition-transform" 
                    />
                    {faq.question}
                  </summary>
                  <p className="text-gray-600 text-sm mt-3 ml-6">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Section */}
      {product && page.onePageCheckout && (
        <div id="checkout" className="py-8 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-6" style={{ color: config.primaryColor || '#ec4899' }}>
              অর্ডার করতে ফর্ম পূরণ করুন
            </h3>
            <OnePageCheckout
              product={product}
              accentColor={config.primaryColor || page.style?.primaryColor}
              buttonShape={page.style?.buttonShape}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 text-center" style={{ backgroundColor: config.secondaryColor || '#fce7f3' }}>
        <div className="max-w-4xl mx-auto">
          {config.showLogo && (
            <div className="font-bold text-lg sm:text-xl mb-4">
              <span style={{ color: config.primaryColor || '#ec4899' }}>আমাদের</span>
              <span className="text-gray-800">স্টোর</span>
            </div>
          )}
          {config.footerLinks?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-4">
              {config.footerLinks.map((link: any, i: number) => (
                <a key={i} href={link.url} className="hover:underline">
                  {link.label}
                </a>
              ))}
            </div>
          )}
          {config.socialLinks && (
            <div className="flex justify-center gap-4 mb-4">
              {config.socialLinks.facebook && (
                <a href={config.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                  Facebook
                </a>
              )}
              {config.socialLinks.instagram && (
                <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600">
                  Instagram
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500">© 2025 All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

const LandingPagePreview: React.FC<LandingPagePreviewProps> = ({ page, product, onBack, onSubmitLandingOrder }) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = page.seo.metaTitle;

    let meta = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const prevDescription = meta.content;
    meta.content = page.seo.metaDescription;

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.href;
    canonical.href = page.seo.canonicalUrl;
    
    // Add viewport meta for mobile responsiveness
    let viewport = document.querySelector("meta[name='viewport']") as HTMLMetaElement | null;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(viewport);
    }

    return () => {
      document.title = previousTitle;
      if (meta) meta.content = prevDescription;
      if (canonical) canonical.href = prevCanonical;
    };
  }, [page]);

  const handleSubmit = (payload: LandingCheckoutPayload) => {
    if (product) {
      onSubmitLandingOrder({ ...payload, pageId: page.id, productId: product.id });
    }
  };

  // Render Ready template mode
  if (page.mode === 'ready') {
    return (
      <div className="min-h-screen bg-white">
        {onBack && (
          <div className="bg-gray-900 text-white py-2 px-4">
            <button 
              onClick={onBack} 
              className="inline-flex items-center gap-2 text-sm font-semibold hover:text-gray-300"
            >
              <ArrowLeft size={16} /> Back to admin
            </button>
          </div>
        )}
        <ReadyLandingPreview page={page} product={product} onSubmit={handleSubmit} />
      </div>
    );
  }

  // Render Custom builder mode (fallback to old design)
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {onBack && (
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} /> Back to admin
          </button>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Custom builder preview - simplified for now */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.name}</h1>
              <p className="text-gray-600">{page.seo.metaDescription}</p>
              {product && (
                <div className="mt-6">
                  <img src={normalizeImageUrl(product.image)} alt={product.name} className="w-full rounded-lg" />
                  <h2 className="text-2xl font-bold mt-4">{product.name}</h2>
                  <p className="text-3xl font-bold text-blue-600 mt-2">৳{formatCurrency(product.price)}</p>
                </div>
              )}
            </div>
          </div>
          {product && page.onePageCheckout && (
            <div className="self-start sticky top-8">
              <OnePageCheckout
                product={product}
                accentColor={page.style?.primaryColor}
                buttonShape={page.style?.buttonShape}
                onSubmit={handleSubmit}
              />
            </div>
          )}
          {!product && (
            <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
              Link a product to see checkout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPagePreview;
