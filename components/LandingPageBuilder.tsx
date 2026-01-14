import React, { useState, useMemo, useEffect } from 'react';
import { Product, LandingPage } from '../types';
import { 
  Sparkles, Check, ChevronRight, ChevronLeft, Copy, ExternalLink, 
  Globe, Eye, Smartphone, Monitor, X, Play, Star, MessageCircle,
  HelpCircle, ShoppingBag, Gift, CheckCircle, Loader2, Image as ImageIcon
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

const randomId = () => crypto?.randomUUID ? crypto.randomUUID() : `lp-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Color themes
const COLOR_THEMES = [
  { id: 'pink', name: 'Pink', color: '#EC4899', bgColor: '#FDF2F8' },
  { id: 'purple', name: 'Purple', color: '#8B5CF6', bgColor: '#F5F3FF' },
  { id: 'blue', name: 'Blue', color: '#3B82F6', bgColor: '#EFF6FF' },
  { id: 'teal', name: 'Teal', color: '#14B8A6', bgColor: '#F0FDFA' },
  { id: 'orange', name: 'Orange', color: '#F97316', bgColor: '#FFF7ED' },
  { id: 'red', name: 'Red', color: '#EF4444', bgColor: '#FEF2F2' },
];

// Section options
const SECTION_OPTIONS = [
  { id: 'features', label: 'সুবিধা সমূহ', icon: Gift, default: true },
  { id: 'reviews', label: 'কাস্টমার রিভিউ', icon: Star, default: true },
  { id: 'faq', label: 'প্রশ্ন উত্তর (FAQ)', icon: HelpCircle, default: true },
  { id: 'video', label: 'ইউটিউব ভিডিও', icon: Play, default: true },
  { id: 'whyBuy', label: 'কেন কিনবেন', icon: ShoppingBag, default: true },
];

interface LandingPageBuilderProps {
  products: Product[];
  tenantId?: string;
  tenantSubdomain?: string;
  onSave: (page: LandingPage) => Promise<void> | void;
  onCancel?: () => void;
}

// Product Card Component
const ProductCard: React.FC<{
  product: Product;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ product, isSelected, onSelect }) => (
  <div
    onClick={onSelect}
    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
      isSelected 
        ? 'border-purple-500 bg-purple-50 shadow-md' 
        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
    }`}
  >
    {isSelected && (
      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
        <Check size={14} className="text-white" />
      </div>
    )}
    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {product.image ? (
        <img 
          src={normalizeImageUrl(product.image)} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon size={20} className="text-gray-400" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-gray-900 truncate text-sm">{product.name}</h4>
      <p className="text-purple-600 font-semibold text-sm">৳{formatCurrency(product.price)}</p>
    </div>
  </div>
);

// Color Theme Selector
const ColorThemeSelector: React.FC<{
  selected: string;
  onSelect: (id: string) => void;
}> = ({ selected, onSelect }) => (
  <div className="flex flex-wrap gap-3">
    {COLOR_THEMES.map(theme => (
      <button
        key={theme.id}
        onClick={() => onSelect(theme.id)}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[70px] ${
          selected === theme.id 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div 
          className={`w-8 h-8 rounded-full ${selected === theme.id ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
          style={{ backgroundColor: theme.color }}
        />
        <span className="text-xs font-medium text-gray-600">{theme.name}</span>
      </button>
    ))}
  </div>
);

// Live Preview Component
const LivePreview: React.FC<{
  product?: Product;
  config: {
    headerTitle: string;
    offerText: string;
    colorTheme: string;
    sections: string[];
    videoUrl: string;
  };
  storeName?: string;
  previewMode: 'mobile' | 'desktop';
}> = ({ product, config, storeName, previewMode }) => {
  const theme = COLOR_THEMES.find(t => t.id === config.colorTheme) || COLOR_THEMES[0];
  
  if (!product) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <div className="text-center text-gray-400">
          <ImageIcon size={48} className="mx-auto mb-3" />
          <p>প্রোডাক্ট সিলেক্ট করুন</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`${previewMode === 'mobile' ? 'max-w-[320px]' : 'max-w-full'} mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200`}
      style={{ backgroundColor: theme.bgColor }}
    >
      {/* Header */}
      <div className="text-center py-2 text-xs font-medium" style={{ backgroundColor: theme.color, color: 'white' }}>
        {config.headerTitle || 'ঢাকার মধ্যে ডেলিভারি একদম ফ্রি, আজই অর্ডার করুন'}
      </div>
      
      {/* Store Name */}
      <div className="text-center py-3">
        <h1 className="text-lg font-bold text-gray-800">{storeName || 'STORE'}<span style={{ color: theme.color }}>SHOP</span></h1>
      </div>
      
      {/* Product Image */}
      <div className="px-4">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <img 
            src={normalizeImageUrl(product.image)} 
            alt={product.name}
            className="w-full h-40 object-contain rounded-lg"
          />
        </div>
      </div>
      
      {/* Product Info */}
      <div className="px-4 py-3 text-center">
        <h2 className="font-bold text-gray-900 text-sm">{product.name}</h2>
        <p className="text-lg font-bold mt-1" style={{ color: theme.color }}>
          {config.offerText || `অফার মূল্য ${formatCurrency(product.price)} টাকা মাত্র`}
        </p>
      </div>
      
      {/* CTA Button */}
      <div className="px-4 pb-4">
        <button 
          className="w-full py-3 rounded-full text-white font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.color }}
        >
          Place Order <ChevronRight size={18} />
        </button>
      </div>
      
      {/* Features */}
      {config.sections.includes('whyBuy') && (
        <div className="px-4 pb-3 space-y-2">
          {['আমরা শুধু সেল করলে কেন সুযোগ সেল করি না', 'পন্য সঠিক আমাদের সুনির্দিষ্ট নিশ্চিতকরণের', 'পন্য হাতে পাওয়ার ৭ দিনের মধ্যে ইজি রিটার্ন সুবিধা'].map((text, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Reviews */}
      {config.sections.includes('reviews') && (
        <div className="px-4 pb-4">
          <p className="text-center text-sm font-semibold mb-2" style={{ color: theme.color }}>আমাদের কাস্টমার রিভিউ</p>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div>
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-xs text-gray-600">রাতে অর্ডার করে সকালে উঠে দেখি কুরিয়ার একদম সামনে দাড়িয়ে!</p>
                <p className="text-xs text-gray-500 mt-1">KayaCyyy</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Video Preview */}
      {config.sections.includes('video') && config.videoUrl && (
        <div className="px-4 pb-4">
          <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
            <Play size={40} className="text-white opacity-80" />
          </div>
        </div>
      )}
    </div>
  );
};

// Success Modal
const SuccessModal: React.FC<{
  pageUrl: string;
  onClose: () => void;
  onCreateNew: () => void;
  onViewPage: () => void;
}> = ({ pageUrl, onClose, onCreateNew, onViewPage }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">🎉 পেজ পাবলিশ হয়েছে!</h2>
        <p className="text-gray-500 mb-6">আপনার ল্যান্ডিং পেজ এখন লাইভ</p>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">পেজ লিংক</p>
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-2">
            <input 
              type="text" 
              value={pageUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none px-2 truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                copied ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <Copy size={14} />
              {copied ? 'কপি হয়েছে!' : 'কপি'}
            </button>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onViewPage}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600"
          >
            <ExternalLink size={18} />
            পেজ দেখুন
          </button>
          <button
            onClick={onCreateNew}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
          >
            নতুন পেজ
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Builder Component
export const LandingPageBuilder: React.FC<LandingPageBuilderProps> = ({
  products,
  tenantId,
  tenantSubdomain,
  onSave,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPageUrl, setCreatedPageUrl] = useState('');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  
  // Step 2 config
  const [config, setConfig] = useState({
    headerTitle: 'ঢাকার মধ্যে ডেলিভারি একদম ফ্রি, আজই অর্ডার করুন',
    offerText: '',
    colorTheme: 'pink',
    sections: ['features', 'reviews', 'faq', 'video', 'whyBuy'],
    videoUrl: ''
  });
  
  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );
  
  // Update offer text when product changes
  useEffect(() => {
    if (selectedProduct && !config.offerText) {
      setConfig(prev => ({
        ...prev,
        offerText: `অফার মূল্য ${formatCurrency(selectedProduct.price)} টাকা মাত্র`
      }));
    }
  }, [selectedProduct]);
  
  const handleSectionToggle = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };
  
  const handleCreate = async () => {
    if (!selectedProduct) return;
    
    setIsSaving(true);
    const theme = COLOR_THEMES.find(t => t.id === config.colorTheme) || COLOR_THEMES[0];
    const now = new Date().toISOString();
    const slug = toSlug(selectedProduct.name);
    
    const page: LandingPage = {
      id: randomId(),
      name: `${selectedProduct.name} Landing`,
      mode: 'ready',
      productId: selectedProduct.id,
      templateId: config.colorTheme,
      status: 'published',
      urlSlug: slug,
      tenantId,
      customConfig: {
        headerTitle: config.headerTitle,
        offerText: config.offerText,
        colorTheme: config.colorTheme,
        primaryColor: theme.color,
        backgroundColor: theme.bgColor,
        sections: config.sections,
        videoUrl: config.videoUrl
      },
      seo: {
        metaTitle: `${selectedProduct.name} | Buy Now`,
        metaDescription: selectedProduct.description?.slice(0, 150) || 'Instant landing experience',
        canonicalUrl: `https://${tenantSubdomain}.systemnextit.com/p/${slug}`,
        keywords: ['landing page', selectedProduct.name]
      },
      blocks: [
        {
          id: randomId(),
          type: 'hero',
          title: selectedProduct.name,
          subtitle: config.offerText,
          description: selectedProduct.description,
          mediaUrl: selectedProduct.galleryImages?.[0] || selectedProduct.image,
          ctaLabel: 'অর্ডার করুন',
          style: { background: theme.bgColor, accentColor: theme.color }
        }
      ],
      style: {
        primaryColor: theme.color,
        accentColor: theme.color,
        background: theme.bgColor,
        buttonShape: 'pill',
        fontFamily: 'Inter, sans-serif'
      },
      onePageCheckout: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    };
    
    try {
      await onSave(page);
      const pageUrl = `https://${tenantSubdomain}.systemnextit.com/p/${slug}`;
      setCreatedPageUrl(pageUrl);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating landing page:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCreateNew = () => {
    setShowSuccess(false);
    setSelectedProductId(null);
    setCurrentStep(1);
    setConfig({
      headerTitle: 'ঢাকার মধ্যে ডেলিভারি একদম ফ্রি, আজই অর্ডার করুন',
      offerText: '',
      colorTheme: 'pink',
      sections: ['features', 'reviews', 'faq', 'video', 'whyBuy'],
      videoUrl: ''
    });
  };
  
  const canProceed = currentStep === 1 ? !!selectedProductId : true;
  
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                currentStep > step 
                  ? 'bg-green-500 text-white' 
                  : currentStep === step 
                    ? 'bg-purple-600 text-white ring-4 ring-purple-200' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? <Check size={16} /> : step}
              </div>
            </div>
            {index < 2 && (
              <div className={`flex-1 h-1 rounded-full transition-all ${
                currentStep > step ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Step Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Form */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">প্রোডাক্ট সিলেক্ট করুন</h3>
                  <p className="text-sm text-gray-500">কোন প্রোডাক্টের জন্য ল্যান্ডিং পেজ তৈরি করতে চান?</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProductId === product.id}
                    onSelect={() => setSelectedProductId(product.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Header Settings */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">T</span> হেডার সেটিংস
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">শিরোনাম টেক্সট</label>
                    <input
                      type="text"
                      value={config.headerTitle}
                      onChange={(e) => setConfig(prev => ({ ...prev, headerTitle: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      placeholder="ঢাকার মধ্যে ডেলিভারি একদম ফ্রি..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">অফার টেক্সট</label>
                    <input
                      type="text"
                      value={config.offerText}
                      onChange={(e) => setConfig(prev => ({ ...prev, offerText: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      placeholder="অফার মূল্য ১০ টাকা মাত্র"
                    />
                  </div>
                </div>
              </div>
              
              {/* Color Theme */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                  রঙ থিম
                </h3>
                <ColorThemeSelector 
                  selected={config.colorTheme}
                  onSelect={(id) => setConfig(prev => ({ ...prev, colorTheme: id }))}
                />
              </div>
              
              {/* Sections */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-purple-600">☰</span> সেকশন সমূহ
                </h3>
                <div className="space-y-3">
                  {SECTION_OPTIONS.map(section => (
                    <label key={section.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.sections.includes(section.id)}
                        onChange={() => handleSectionToggle(section.id)}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <section.icon size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-700">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* YouTube Video */}
              {config.sections.includes('video') && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Play size={18} className="text-red-500" /> ইউটিউব ভিডিও
                  </h3>
                  <input
                    type="text"
                    value={config.videoUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {config.videoUrl && (
                    <div className="mt-3 bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
                      <Play size={40} className="text-white opacity-80" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right Panel - Preview */}
        <div className="lg:sticky lg:top-4">
          <div className="bg-gray-100 rounded-2xl p-4">
            {/* Preview Toggle */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  previewMode === 'mobile' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Smartphone size={16} /> মোবাইল
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  previewMode === 'desktop' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Monitor size={16} /> ডেস্কটপ
              </button>
            </div>
            
            {/* Preview Content */}
            <div className="min-h-[500px]">
              <LivePreview 
                product={selectedProduct}
                config={config}
                storeName={tenantSubdomain?.toUpperCase()}
                previewMode={previewMode}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onCancel?.()}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ChevronLeft size={20} />
          {currentStep > 1 ? 'পেছনে যান' : 'বাতিল'}
        </button>
        
        {currentStep < 2 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
              canProceed
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            পরবর্তী ধাপ <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isSaving || !selectedProduct}
            className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                তৈরি হচ্ছে...
              </>
            ) : (
              <>
                <Eye size={20} />
                প্রিভিউ দেখুন →
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          pageUrl={createdPageUrl}
          onClose={() => setShowSuccess(false)}
          onCreateNew={handleCreateNew}
          onViewPage={() => window.open(createdPageUrl, '_blank')}
        />
      )}
    </div>
  );
};

export default LandingPageBuilder;
