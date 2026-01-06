import React, { useEffect } from 'react';
import { LandingPage, Product } from '../types';
import { OnePageCheckout, LandingCheckoutPayload } from '../components/LandingPageComponents';
import { ArrowLeft, Sparkles, Quote, HelpCircle, Star } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface LandingPagePreviewProps {
  page: LandingPage;
  product?: Product;
  onBack: () => void;
  onSubmitLandingOrder: (payload: LandingCheckoutPayload & { pageId: string; productId: number }) => Promise<void> | void;
}

const LandingHero: React.FC<{ page: LandingPage; product?: Product; }> = ({ page, product }) => {
  const hero = page.blocks.find(block => block.type === 'hero');
  const formattedPrice = product ? formatCurrency(product.price) : null;
  const formattedOriginalPrice = product ? formatCurrency(product.originalPrice, null) : null;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8 space-y-5">
      <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
        <Sparkles size={14} /> {page.mode === 'ready' ? 'Ready template' : 'Custom builder'}
      </span>
      <h1 className="text-4xl font-black leading-tight">{hero?.title || page.name}</h1>
      <p className="text-white/80 text-lg max-w-2xl">{hero?.description || page.seo.metaDescription}</p>
      {product && (
        <div className="flex items-center gap-6 text-white">
          <span className="text-3xl font-extrabold">৳ {formattedPrice}</span>
          {formattedOriginalPrice && <span className="text-white/60 line-through">৳ {formattedOriginalPrice}</span>}
        </div>
      )}
      {hero?.mediaUrl && (
        <img src={normalizeImageUrl(hero.mediaUrl)} alt={hero.title} className="rounded-2xl border border-white/10 shadow-2xl" />
      )}
    </div>
  );
};

const LandingSections: React.FC<{ page: LandingPage; }> = ({ page }) => {
  return (
    <div className="space-y-6">
      {page.blocks.filter(block => block.type !== 'hero').map(block => (
        <div key={block.id} className="rounded-3xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-400">
            {block.type === 'features' && <Sparkles size={14} />}
            {block.type === 'reviews' && <Quote size={14} />}
            {block.type === 'faq' && <HelpCircle size={14} />}
            {block.type === 'cta' && <Star size={14} />}
            {block.type}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-3">{block.title}</h3>
          <p className="text-gray-500 mt-1">{block.description}</p>
          {block.items && (
            <div className="mt-4 space-y-3">
              {block.items.map(item => (
                <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
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

    return () => {
      document.title = previousTitle;
      if (meta) meta.content = prevDescription;
      if (canonical) canonical.href = prevCanonical;
    };
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Back to admin
        </button>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <LandingHero page={page} product={product} />
            <LandingSections page={page} />
          </div>
          {product && page.onePageCheckout && (
            <div className="self-start sticky top-8">
              <OnePageCheckout
                product={product}
                accentColor={page.style?.primaryColor}
                buttonShape={page.style?.buttonShape}
                onSubmit={(payload) => onSubmitLandingOrder({ ...payload, pageId: page.id, productId: product.id })}
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
