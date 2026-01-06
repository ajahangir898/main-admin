import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowRight, 
  CheckCircle2, 
  MessageCircle, 
  Send, 
  Loader2, 
  X, 
  ChevronRight,
  Monitor,
  Smartphone,
  ShieldCheck,
  Star,
  Hexagon,
  Plus,
  Circle
} from 'lucide-react';

// --- Types ---
interface ThemeDemo {
  id: number;
  name: string;
  tagline: string;
  image: string;
  category: string;
}

// --- Mock Data for Themes (Reduced to 4 as requested) ---
const THEMES: ThemeDemo[] = [
  { 
    id: 1, 
    name: "SystemNext IT - Mac Pro", 
    tagline: "High-End Technology & Gadget Store", 
    image: "https://i.postimg.cc/G2PSZ70V/Gemini_Generated_Image_45zoxl45zoxl45zo.png", 
    category: "Technology" 
  },
  { 
    id: 2, 
    name: "Furniture Haven", 
    tagline: "Elegant Modern Living Furniture", 
    image: "https://i.postimg.cc/g0rpb6GF/Gemini-Generated-Image-vggxo4vggxo4vggx.png", 
    category: "Home Decor" 
  },
  { 
    id: 3, 
    name: "Fashion Hub Pro", 
    tagline: "Elevate Your Style Premium Theme", 
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80", 
    category: "Fashion" 
  },
  { 
    id: 4, 
    name: "Watch Galaxy Elite", 
    tagline: "Smart Wearables & Luxury Timepieces", 
    image: "https://i.postimg.cc/G2PSZ70V/Gemini_Generated_Image_45zoxl45zoxl45zo.png", 
    category: "Gadgets" 
  }
];

function DecorShapes() {
  return (
    <>
      <Plus className="decor-shape top-20 left-[10%] text-indigo-400" size={24} />
      <Plus className="decor-shape top-40 right-[15%] text-purple-400" size={32} />
      <X className="decor-shape bottom-20 left-[5%] text-indigo-300" size={20} />
      <X className="decor-shape top-[30%] right-[10%] text-slate-400" size={28} />
      <Circle className="decor-shape top-[60%] left-[15%] text-indigo-200" size={16} />
      <div className="decor-shape top-20 right-[40%] grid grid-cols-4 gap-2 opacity-[0.05]">
        {[...Array(16)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-slate-900 rounded-full" />)}
      </div>
      <div className="decor-shape bottom-40 left-[30%] grid grid-cols-3 gap-1.5 opacity-[0.05]">
        {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-slate-900 rounded-full" />)}
      </div>
    </>
  );
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'আসসালামু আলাইকুম! আমি SystemNext IT AI অ্যাসিস্ট্যান্ট। আপনার ডিজিটাল ব্যবসার গ্রোথ নিয়ে কোনো সাহায্য প্রয়োজন?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput("");
    setIsLoading(true);

    // Static responses for common questions
    const staticResponses: Record<string, string> = {
      'price': 'আমাদের প্যাকেজ শুরু হয় ৫,০০০ টাকা থেকে। বিস্তারিত জানতে কল করুন: 01XXX-XXXXXX',
      'theme': 'আমাদের কাছে ৫০+ প্রিমিয়াম থিম আছে - Technology, Fashion, Furniture সব ক্যাটেগরিতে।',
      'support': 'আমরা ২৪/৭ সাপোর্ট দিই। যেকোনো সমস্যায় WhatsApp করুন।',
      'default': 'ধন্যবাদ আপনার মেসেজের জন্য! আমাদের টিম শীঘ্রই যোগাযোগ করবে।'
    };

    const getResponse = (msg: string): string => {
      const lower = msg.toLowerCase();
      if (lower.includes('price') || lower.includes('দাম')) return staticResponses.price;
      if (lower.includes('theme') || lower.includes('থিম')) return staticResponses.theme;
      if (lower.includes('support') || lower.includes('সাপোর্ট')) return staticResponses.support;
      return staticResponses.default;
    };

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: getResponse(userMessage) }]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen hero-gradient">
      <DecorShapes />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Hexagon className="text-white" size={28} fill="white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">SystemNext IT</span>
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mt-1">Digital Solutions</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">হোম</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">সার্ভিস</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">ডেমো</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">পোর্টফোলিও</a>
            <button className="bg-indigo-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95">সফটওয়্যার তৈরি করুন</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-44 pb-24 px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-8">
            <ShieldCheck size={18} />
            পেশাদার ই-কমার্স সলিউশন - SystemNext IT
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
            সফল ই-কমার্স ব্যবসার জন্য <br/> 
            আজই <span className="text-indigo-600">সিস্টেমনেক্সট</span> এ আসুন!
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            উন্নত প্রযুক্তি এবং অসাধারণ ইউজার এক্সপেরিয়েন্সের মাধ্যমে আপনার অনলাইন ব্যবসাকে নিয়ে যান এক অনন্য উচ্চতায়। আমাদের সলিউশন মানেই গ্যারান্টিড সাকসেস।
          </p>
          <div className="flex flex-col items-center gap-5">
            <button className="btn-gradient text-white px-10 py-5 rounded-2xl font-black text-xl flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-indigo-200 uppercase tracking-wide">
              আপনার প্ল্যাটফর্ম তৈরি করুন <ArrowRight size={24} />
            </button>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <CheckCircle2 size={18} className="text-green-500" />
                No Hidden Costs
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <CheckCircle2 size={18} className="text-green-500" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section Header */}
      <section className="py-20 px-4 bg-slate-50/50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            <span className="text-indigo-600">লাইভ ডেমো</span> — পার্থক্যটি দেখুন
          </h2>
          <p className="text-slate-500 font-medium">আমাদের ডিজাইন করা কিছু প্রিমিয়াম ই-কমার্স থিম</p>
        </div>

        {/* Themes Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {THEMES.map((theme) => (
            <div key={theme.id} className="demo-card group bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden flex flex-col h-full p-2">
              <div className="p-4 flex-1">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Hexagon className="text-white" size={16} fill="white" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">SYSTEMNEXT</span>
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-base font-black text-slate-900">{theme.name}</h3>
                  <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-wider mt-1">{theme.tagline}</p>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-100 mb-4 bg-slate-50 group-hover:shadow-2xl transition-all duration-500">
                  <img 
                    src={theme.image} 
                    alt={theme.name}
                    className="w-full aspect-[4/5] object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Pre-View Demo</button>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <div className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest text-center group-hover:border-indigo-600 group-hover:text-indigo-600 transition-colors">
                  Check Features
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Limited-Time Offer Section - EXACT MATCH TO IMAGE */}
      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto offer-box p-12 md:p-16 text-center card-shadow relative z-10 border-indigo-500">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-10 tracking-tight">Limited-Time Offer!</h2>
          <button className="bg-[#6366f1] text-white px-14 py-5 rounded-2xl font-black text-2xl uppercase tracking-[0.1em] hover:bg-indigo-700 hover:scale-105 transition-all shadow-2xl shadow-indigo-100 active:scale-95">
            SHOP NOW
          </button>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-50 rounded-tl-full -z-0 opacity-30" />
        <div className="absolute top-0 left-0 w-48 h-48 bg-purple-50 rounded-br-full -z-0 opacity-30" />
      </section>

      {/* Features Bar */}
      <div className="bg-slate-950 py-16 text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="w-full h-full hero-pattern"></div>
         </div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              <Monitor className="text-indigo-400" size={32} />
            </div>
            <h4 className="font-black uppercase tracking-widest text-xs">High Performance</h4>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              <Smartphone className="text-purple-400" size={32} />
            </div>
            <h4 className="font-black uppercase tracking-widest text-xs">Mobile First Design</h4>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="text-green-400" size={32} />
            </div>
            <h4 className="font-black uppercase tracking-widest text-xs">SEO Grounded</h4>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-orange-400" size={32} />
            </div>
            <h4 className="font-black uppercase tracking-widest text-xs">Bank Grade Security</h4>
          </div>
        </div>
      </div>

      {/* Floating AI Chat */}
      <div className="fixed bottom-8 right-8 z-[100]">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-110 active:scale-95 transition-all duration-300 group"
          >
            <MessageCircle size={36} className="group-hover:rotate-12 transition-transform" />
          </button>
        ) : (
          <div className="w-[380px] sm:w-[420px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <Hexagon size={24} fill="white" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">SystemNext Bot</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold opacity-80">ACTIVE NOW</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-100' 
                      : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
                    <Loader2 className="animate-spin text-indigo-600" size={20} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="আপনার ব্যবসা নিয়ে প্রশ্ন করুন..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 active:scale-95"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white py-16 px-4 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Hexagon className="text-white" size={24} fill="white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">SystemNext IT</span>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-2">
              © {new Date().getFullYear()} SystemNext IT Bangladesh
            </p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
              World Class E-Commerce & Software Infrastructure
            </p>
          </div>
          <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Career</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);