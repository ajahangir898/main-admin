import React, { useState, useEffect } from 'react';
import { Product, LandingPage } from '../types';
import { LandingPagePanel } from '../components/LandingPageComponents';
import { MonitorSmartphone } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#12043a] via-[#4f1cb8] to-[#2eb8ff] text-white shadow-2xl">
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_55%)]" aria-hidden />
        <div className="relative p-6 md:p-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.6em] text-white/60">
              <span>Landing Engine</span>
              <span className="h-px w-10 bg-white/30" />
              <span>Realtime Preview</span>
              <span className="h-px w-10 bg-white/30" />
              <span>SEO Ready</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              Launch persuasive one-page funnels without touching code
            </h1>
            <p className="text-lg text-white/85 max-w-3xl">
              Curate story-driven product drops, optimize for each audience segment, and keep every tenant isolated with their own
              branded experience. Our dual-mode builder combines opinionated presets with a block-based editor so marketers can
              iterate in minutes instead of sprint cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/15 border border-white/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-3">
                <MonitorSmartphone size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest">Dual Builder</p>
                <p className="font-semibold">Ready + Customizable</p>
              </div>
            </div>
            <div className="bg-white/15 border border-white/20 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-widest text-white/70">Realtime KPIs</p>
              <p className="text-2xl font-bold">+38%</p>
              <p className="text-sm text-white/80">Average lift in checkout conversions after personalized drops.</p>
            </div>
            <div className="bg-white/15 border border-white/20 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-widest text-white/70">Isolation Ready</p>
              <p className="text-sm text-white/85">
                Every tenant ships to its own datastore, so campaigns and assets never bleed between brands.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-6 py-3 bg-white text-[#1f235b] font-semibold rounded-2xl shadow-lg shadow-black/20 hover:-translate-y-0.5 transition"
            >
              Create Landing Page
            </button>
            <button
              type="button"
              className="px-6 py-3 border border-white/50 text-white font-semibold rounded-2xl hover:bg-white/10 transition"
            >
              Preview Templates
            </button>
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
      />
    </div>
  );
};

export default AdminLandingPage;
