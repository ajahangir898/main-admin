import React, { useMemo, useState } from 'react';
import { Product, LandingPage, LandingPageBlock, LandingPageTemplate, LandingPageStyle, LandingPageSEO } from '../types';

// Empty landing page templates - users create their own
const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [];
import { Sparkles, Eye, Copy, CheckCircle, Edit3, Trash2, Layout, Plus, PenSquare, Layers, Palette, Globe, Zap, Quote, HelpCircle, Image as ImageIcon, Phone, ShoppingBag, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const randomId = () => (crypto?.randomUUID ? crypto.randomUUID() : `lp-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`);
const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface LandingPagePanelProps {
  products: Product[];
  landingPages: LandingPage[];
  onCreateLandingPage: (page: LandingPage) => void;
  onUpdateLandingPage: (page: LandingPage) => void;
  onTogglePublish: (pageId: string, status: LandingPage['status']) => void;
  onPreview: (page: LandingPage) => void;
}

interface ReadyLandingFormProps {
  products: Product[];
  templates: LandingPageTemplate[];
  onCreate: (page: LandingPage) => void;
}

interface CustomLandingEditorProps {
  onSave: (page: LandingPage) => void;
}

interface LandingPageListProps {
  landingPages: LandingPage[];
  onPreview: (page: LandingPage) => void;
  onTogglePublish: (pageId: string, status: LandingPage['status']) => void;
}

interface OnePageCheckoutProps {
  product: Product;
  accentColor?: string;
  buttonShape?: LandingPageStyle['buttonShape'];
  onSubmit: (payload: LandingCheckoutPayload) => Promise<void> | void;
}

export interface LandingCheckoutPayload {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  quantity: number;
}

const TemplateBadge: React.FC<{ template: LandingPageTemplate; isActive: boolean; onSelect: () => void; }> = ({ template, isActive, onSelect }) => (
  <button
    onClick={onSelect}
    className={`border rounded-2xl p-4 flex flex-col gap-2 text-left transition shadow-sm ${isActive ? 'border-purple-500 shadow-lg bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}
  >
    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
      <Sparkles size={16} className="text-purple-500" />
      {template.name}
    </div>
    <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>
    <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
      <span>{template.heroLayout} hero</span>
      <span className="w-1 h-1 rounded-full bg-gray-300" />
      <span>{template.buttonShape} buttons</span>
    </div>
  </button>
);

const TemplatePreviewCard: React.FC<{ product?: Product; template?: LandingPageTemplate; }> = ({ product, template }) => {
  if (!product || !template) {
    return (
      <div className="h-64 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
        <ImageIcon size={32} />
        <p className="text-sm mt-2">Select a product & template to preview</p>
      </div>
    );
  }

  const formattedPrice = formatCurrency(product.price);
  const formattedOriginalPrice = formatCurrency(product.originalPrice, null);

  return (
    <div className="rounded-2xl border border-gray-100 shadow-lg overflow-hidden bg-white">
      <div className="p-6 bg-gradient-to-br from-purple-50 via-white to-white">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-purple-500 uppercase tracking-widest">
          <Sparkles size={14} /> Ready Landing Preview
        </span>
        <h3 className="text-2xl font-black text-gray-900 mt-3">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-900">৳ {formattedPrice}</span>
          {formattedOriginalPrice && (
            <span className="text-sm line-through text-gray-400">৳ {formattedOriginalPrice}</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200">{template.heroLayout} hero</span>
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200">{template.featuresLayout} story</span>
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200">Checkout embed</span>
        </div>
      </div>
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
        <span>Auto SEO + One Page Checkout</span>
        <Zap size={16} className="text-orange-400" />
      </div>
    </div>
  );
};

export const ReadyLandingForm: React.FC<ReadyLandingFormProps> = ({ products, templates, onCreate }) => {
  const [productId, setProductId] = useState<number | ''>('');
  const [templateId, setTemplateId] = useState<string>('focus-split');
  const [autoPublish, setAutoPublish] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProduct = useMemo(() => products.find(p => p.id === productId), [products, productId]);
  const selectedTemplate = useMemo(() => templates.find(t => t.id === templateId), [templates, templateId]);

  const handleGenerate = async () => {
    if (!selectedProduct || !selectedTemplate) return;
    setIsSaving(true);
    const now = new Date().toISOString();
    const readyPage: LandingPage = {
      id: randomId(),
      name: `${selectedProduct.name} Landing`,
      mode: 'ready',
      productId: selectedProduct.id,
      templateId: selectedTemplate.id,
      status: autoPublish ? 'published' : 'draft',
      urlSlug: `${toSlug(selectedProduct.name)}-${selectedTemplate.id}`,
      seo: {
        metaTitle: `${selectedProduct.name} | Buy Now`,
        metaDescription: selectedProduct.description?.slice(0, 150) || 'Instant landing experience',
        canonicalUrl: `https://admin.systemnextit.com/${toSlug(selectedProduct.name)}-${selectedTemplate.id}`,
        keywords: ['landing page', 'flash sale', selectedProduct.name]
      },
      blocks: [
        {
          id: randomId(),
          type: 'hero',
          title: selectedProduct.name,
          subtitle: selectedProduct.tag || 'Instant delivery',
          description: selectedProduct.description,
          mediaUrl: selectedProduct.galleryImages?.[0] || selectedProduct.image,
          ctaLabel: 'Order in one page',
          style: { background: '#f4f0ff', accentColor: selectedTemplate.accentColor, layout: selectedTemplate.heroLayout === 'split' ? 'split' : 'stacked' }
        },
        {
          id: randomId(),
          type: 'features',
          title: 'Why shoppers love it',
          items: [
            { id: randomId(), title: 'Fast COD', description: 'Cash on delivery nationwide' },
            { id: randomId(), title: 'Warranty', description: 'Official service coverage' },
            { id: randomId(), title: 'Verified', description: 'QC checked before dispatch' }
          ],
          style: { background: '#ffffff', accentColor: selectedTemplate.accentColor }
        },
        {
          id: randomId(),
          type: 'reviews',
          title: 'What buyers say',
          items: [
            { id: randomId(), title: 'Rafi', description: 'Super fast delivery, authentic product!' },
            { id: randomId(), title: 'Nova', description: 'Loved the packaging and support.' }
          ]
        }
      ],
      style: {
        primaryColor: selectedTemplate.accentColor,
        accentColor: selectedTemplate.accentColor,
        background: '#fdfbff',
        buttonShape: selectedTemplate.buttonShape,
        fontFamily: 'Inter, sans-serif'
      },
      onePageCheckout: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: autoPublish ? now : undefined
    };

    await Promise.resolve(onCreate(readyPage));
    setIsSaving(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
              className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="">Select product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Template</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.map(template => (
                <TemplateBadge
                  key={template.id}
                  template={template}
                  isActive={template.id === templateId}
                  onSelect={() => setTemplateId(template.id)}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Publish immediately after creation
          </label>

          <button
            onClick={handleGenerate}
            disabled={!selectedProduct || isSaving}
            className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${selectedProduct ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate Landing Page
          </button>
        </div>
      </div>

      <TemplatePreviewCard product={selectedProduct} template={selectedTemplate} />
    </div>
  );
};

const defaultBlocks: LandingPageBlock[] = [
  {
    id: randomId(),
    type: 'hero',
    title: 'Tell a bold story',
    subtitle: 'Custom landing hero',
    description: 'Mix hero copy, imagery, and CTAs. Everything is editable, responsive, and SEO conscious.',
    ctaLabel: 'Shop now',
    style: { background: '#0f172a', textColor: '#ffffff', layout: 'split' }
  },
  {
    id: randomId(),
    type: 'features',
    title: 'Show benefits',
    items: [
      { id: randomId(), title: 'Feature #1', description: 'Explain why it matters.' },
      { id: randomId(), title: 'Feature #2', description: 'Keep it short and bold.' },
    ],
    style: { background: '#ffffff' }
  }
];

export const CustomLandingEditor: React.FC<CustomLandingEditorProps> = ({ onSave }) => {
  const [pageName, setPageName] = useState('Campaign Landing');
  const [blocks, setBlocks] = useState<LandingPageBlock[]>(defaultBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState(blocks[0]?.id || '');
  const [style, setStyle] = useState<LandingPageStyle>({ primaryColor: '#7c3aed', accentColor: '#f97316', background: '#f5f3ff', buttonShape: 'pill', fontFamily: 'Space Grotesk, sans-serif' });
  const [seo, setSeo] = useState<LandingPageSEO>({ metaTitle: 'Campaign Landing', metaDescription: 'Custom landing page crafted in the editor.', canonicalUrl: 'https://admin.systemnextit.com/campaign-landing' });
  const [includeCheckout, setIncludeCheckout] = useState(true);
  const selectedBlock = blocks.find(block => block.id === selectedBlockId) || blocks[0];

  const updateBlock = (updated: LandingPageBlock) => {
    setBlocks(prev => prev.map(block => block.id === updated.id ? updated : block));
  };

  const handleAddBlock = (type: LandingPageBlock['type']) => {
    const newBlock: LandingPageBlock = {
      id: randomId(),
      type,
      title: type === 'hero' ? 'New hero section' : `New ${type}`,
      description: 'Click to edit content and styling.',
      style: { background: '#ffffff' }
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(prev => {
      const next = prev.filter(block => block.id !== id);
      if (selectedBlockId === id) {
        setSelectedBlockId(next[0]?.id || '');
      }
      return next;
    });
  };

  const handleSave = (publish: boolean) => {
    const now = new Date().toISOString();
    const landing: LandingPage = {
      id: randomId(),
      name: pageName,
      mode: 'custom',
      status: publish ? 'published' : 'draft',
      urlSlug: toSlug(pageName),
      seo,
      blocks,
      style,
      onePageCheckout: includeCheckout,
      createdAt: now,
      updatedAt: now,
      publishedAt: publish ? now : undefined
    };
    onSave(landing);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-400 tracking-widest">Blocks</p>
              <h3 className="text-lg font-bold text-gray-800">Structure</h3>
            </div>
            <button onClick={() => handleAddBlock('hero')} className="px-3 py-2 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 flex items-center gap-1"><Plus size={14} /> Block</button>
          </div>
          <div className="mt-4 space-y-3">
            {blocks.map(block => (
              <div key={block.id} className={`p-3 rounded-2xl border text-sm flex items-center justify-between ${block.id === selectedBlockId ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <div>
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    {block.type === 'hero' && <Layout size={14} />} 
                    {block.type === 'features' && <Layers size={14} />} 
                    {block.type === 'reviews' && <Quote size={14} />} 
                    {block.type === 'faq' && <HelpCircle size={14} />} 
                    {block.type === 'cta' && <Sparkles size={14} />} 
                    {block.title}
                  </p>
                  <p className="text-xs text-gray-400">{block.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedBlockId(block.id)} className="p-1 text-gray-500 hover:text-purple-600"><PenSquare size={14} /></button>
                  <button onClick={() => handleRemoveBlock(block.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-widest">
            <Palette size={14} /> Style
          </div>
          <input value={style.primaryColor} onChange={(e) => setStyle(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="#7c3aed" />
          <select value={style.buttonShape} onChange={(e) => setStyle(prev => ({ ...prev, buttonShape: e.target.value as LandingPageStyle['buttonShape'] }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="pill">Pill buttons</option>
            <option value="rounded">Rounded</option>
            <option value="square">Square</option>
          </select>
          <label className="flex items-center gap-3 text-sm text-gray-600">
            <input type="checkbox" checked={includeCheckout} onChange={(e) => setIncludeCheckout(e.target.checked)} className="w-4 h-4 border-gray-300 rounded" />
            Include one-page checkout
          </label>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-widest">
            <Globe size={14} /> SEO
          </div>
          <input value={seo.metaTitle} onChange={(e) => setSeo(prev => ({ ...prev, metaTitle: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Meta title" />
          <textarea value={seo.metaDescription} onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[80px]" placeholder="Meta description"></textarea>
          <input value={seo.canonicalUrl} onChange={(e) => setSeo(prev => ({ ...prev, canonicalUrl: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Canonical URL" />
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <input value={pageName} onChange={(e) => setPageName(e.target.value)} className="w-full text-2xl font-bold text-gray-900 border-none focus:ring-0" />
          {selectedBlock && (
            <div className="mt-4 space-y-3">
              <textarea value={selectedBlock.title || ''} onChange={(e) => updateBlock({ ...selectedBlock, title: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Heading" />
              <textarea value={selectedBlock.description || ''} onChange={(e) => updateBlock({ ...selectedBlock, description: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[120px]" placeholder="Body copy"></textarea>
              {selectedBlock.type === 'hero' && (
                <input value={selectedBlock.mediaUrl || ''} onChange={(e) => updateBlock({ ...selectedBlock, mediaUrl: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Image URL" />
              )}
            </div>
          )}
          <div className="mt-4 bg-gray-50 rounded-2xl p-4 text-xs text-gray-500">
            Live preview updates in real-time. Blocks are responsive and inherit your style settings.
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Live Preview</p>
          <h3 className="text-3xl font-black mt-2">{pageName}</h3>
          <p className="text-white/80 text-sm mt-2">{seo.metaDescription}</p>
          <div className="mt-6 space-y-3">
            {blocks.map(block => (
              <div key={block.id} className="p-3 rounded-2xl bg-white/5">
                <p className="text-xs uppercase text-white/50">{block.type}</p>
                <p className="font-semibold">{block.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleSave(false)} className="flex-1 min-w-[180px] py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold flex items-center justify-center gap-2">
            <Edit3 size={16} /> Save Draft
          </button>
          <button onClick={() => handleSave(true)} className="flex-1 min-w-[180px] py-3 rounded-xl bg-green-500 text-white font-semibold flex items-center justify-center gap-2">
            <Sparkles size={16} /> Publish
          </button>
        </div>
      </div>
    </div>
  );
};

const LandingPageCard: React.FC<{ page: LandingPage; onPreview: () => void; onTogglePublish: () => void; }> = ({ page, onPreview, onTogglePublish }) => {
  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-gray-400 tracking-widest">{page.mode} builder</p>
          <h3 className="text-lg font-bold text-gray-900">{page.name}</h3>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${page.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
          {page.status}
        </span>
      </div>
      <p className="text-sm text-gray-500">/{page.urlSlug}</p>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Globe size={14} /> {page.seo.canonicalUrl}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onPreview} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-purple-50 text-purple-600">
          <Eye size={16} /> Preview
        </button>
        <button onClick={onTogglePublish} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700">
          {page.status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
        <button onClick={() => navigator.clipboard?.writeText(page.seo.canonicalUrl)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 flex items-center gap-2">
          <Copy size={14} /> Copy URL
        </button>
      </div>
    </div>
  );
};

const LandingPageList: React.FC<LandingPageListProps> = ({ landingPages, onPreview, onTogglePublish }) => (
  <div className="space-y-3">
    {landingPages.map(page => (
      <LandingPageCard
        key={page.id}
        page={page}
        onPreview={() => onPreview(page)}
        onTogglePublish={() => onTogglePublish(page.id, page.status === 'published' ? 'draft' : 'published')}
      />
    ))}
    {!landingPages.length && (
      <div className="border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400">
        Create your first landing page to see it listed here.
      </div>
    )}
  </div>
);

export const LandingPagePanel: React.FC<LandingPagePanelProps> = ({ products, landingPages, onCreateLandingPage, onUpdateLandingPage, onTogglePublish, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'ready' | 'custom'>('ready');
  const templates = LANDING_PAGE_TEMPLATES;

  const handleSaveCustom = (page: LandingPage) => {
    onUpdateLandingPage(page);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap">
          {['ready', 'custom'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'ready' | 'custom')}
              className={`flex-1 min-w-[140px] px-6 py-4 text-sm font-semibold border-b-2 ${activeTab === tab ? 'text-purple-600 border-purple-500 bg-purple-50' : 'text-gray-500 border-transparent'}`}
            >
              {tab === 'ready' ? 'Ready Landing Page' : 'Customizable Landing Page'}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'ready' ? (
            <ReadyLandingForm products={products} templates={templates} onCreate={onCreateLandingPage} />
          ) : (
            <CustomLandingEditor onSave={handleSaveCustom} />
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">Landing Pages</h3>
          <span className="text-xs font-semibold text-gray-400">{landingPages.length} total</span>
        </div>
        <LandingPageList landingPages={landingPages} onPreview={onPreview} onTogglePublish={onTogglePublish} />
      </div>
    </div>
  );
};

export const OnePageCheckout: React.FC<OnePageCheckoutProps> = ({ product, accentColor = '#7c3aed', buttonShape = 'pill', onSubmit }) => {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '' });
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const total = product.price * quantity;
  const buttonRadius = buttonShape === 'pill' ? '9999px' : buttonShape === 'rounded' ? '12px' : '4px';

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone || !form.address) return;
    setIsSubmitting(true);
    await Promise.resolve(onSubmit({ fullName: form.fullName, phone: form.phone, email: form.email, address: form.address, quantity }));
    setIsSubmitting(false);
    setIsConfirmed(true);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-5 w-full max-w-lg">
      <div className="flex items-center gap-3">
        <ShoppingBag size={24} className="text-gray-800" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Instant Checkout</p>
          <h3 className="text-xl font-black text-gray-900">{product.name}</h3>
        </div>
      </div>

      <div className="grid gap-3">
        <input value={form.fullName} onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))} className="border border-gray-200 rounded-2xl px-4 py-3 text-sm" placeholder="Full name*" />
        <input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} className="border border-gray-200 rounded-2xl px-4 py-3 text-sm" placeholder="Phone*" />
        <input value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className="border border-gray-200 rounded-2xl px-4 py-3 text-sm" placeholder="Email" />
        <textarea value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} className="border border-gray-200 rounded-2xl px-4 py-3 text-sm min-h-[100px]" placeholder="Shipping address*" />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Quantity</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border border-gray-200">-</button>
          <span className="font-semibold text-gray-900">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full border border-gray-200">+</button>
        </div>
      </div>

      <div className="border border-dashed border-gray-200 rounded-2xl p-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-900">৳ {total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-400 text-xs mt-1">
          <span>Delivery</span>
          <span>Calculated on call</span>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={isSubmitting} style={{ backgroundColor: accentColor, borderRadius: buttonRadius }} className={`w-full text-white py-3 font-semibold flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70' : ''}`}>
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />} Confirm Order
      </button>

      {isConfirmed && (
        <div className="border border-green-200 bg-green-50 rounded-2xl p-4 text-sm text-green-700 flex items-center gap-3">
          <CheckCircle size={18} /> Order submitted! Our team will confirm shortly.
        </div>
      )}
    </div>
  );
};
