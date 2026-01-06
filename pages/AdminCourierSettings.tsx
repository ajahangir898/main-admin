
import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Save, ArrowLeft, Truck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { CourierConfig } from '../types';
import toast from 'react-hot-toast';

interface AdminCourierSettingsProps {
  config: CourierConfig;
  onSave: (config: CourierConfig) => void;
  onBack: () => void;
}

// Get API base URL - use same origin in production
const getApiBaseUrl = () => {
  // In production, use the same origin (for proxy routing)
  if (typeof window !== 'undefined') {
    // Check if we're on a production domain
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  // Fallback for local development
  return import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5001';
};

const AdminCourierSettings: React.FC<AdminCourierSettingsProps> = ({ config, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'Steadfast' | 'Pathao'>('Steadfast');
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: '',
    instruction: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; balance?: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load initial config
  useEffect(() => {
    if (activeTab === 'Steadfast') {
      setFormData(prev => ({
        ...prev,
        apiKey: config.apiKey || '',
        secretKey: config.secretKey || '',
        instruction: config.instruction || ''
      }));
    }
  }, [config, activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    if (activeTab === 'Steadfast') {
      setIsSaving(true);
      setSaveSuccess(false);
      
      try {
        onSave({
          apiKey: formData.apiKey,
          secretKey: formData.secretKey,
          instruction: formData.instruction
        });
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setSaveSuccess(true);
        setShowSuccess(true);
        toast.success('Courier settings saved!');
        
        setTimeout(() => {
          setSaveSuccess(false);
          setShowSuccess(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to save:', error);
        toast.error('Failed to save settings');
      } finally {
        setIsSaving(false);
      }
    } else {
      toast('Pathao Courier integration coming soon!');
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey || !formData.secretKey) {
      setTestResult({ valid: false, message: 'Please enter both API Key and Secret Key' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/courier/steadfast/test-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          apiKey: formData.apiKey.trim(),
          secretKey: formData.secretKey.trim()
        })
      });

      const data = await response.json();
      
      if (data.valid) {
        setTestResult({
          valid: true,
          message: `Connection successful! Balance: ৳${data.balance || 0}`,
          balance: data.balance
        });
      } else {
        setTestResult({
          valid: false,
          message: data.error || 'Invalid credentials or account not activated'
        });
      }
    } catch (error) {
      setTestResult({
        valid: false,
        message: 'Failed to connect to Steadfast. Please check your credentials and try again.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition">
           <ArrowLeft size={20} className="text-gray-600"/>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Courier Configuration</h2>
          <p className="text-sm text-gray-500">Manage third-party logistics integrations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Steadfast', 'Pathao'].map((provider) => {
          const isActive = activeTab === provider;
          const isConfigured = provider === 'Steadfast' && config.apiKey && config.secretKey;

          return (
            <div 
              key={provider}
              onClick={() => setActiveTab(provider as any)}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between h-24
                ${isActive ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-200'}
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   {isConfigured ? (
                     <CheckCircle size={22} className="text-green-500 fill-green-100" />
                   ) : (
                     <Circle size={22} className="text-gray-300" />
                   )}
                   <div>
                       <span className={`font-bold block ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                         {provider} Courier
                       </span>
                   </div>
                </div>
              </div>
              
              {isActive && (
                <div className="text-xs text-purple-600 font-medium flex items-center gap-1 mt-2">
                   Show Setting Form <ChevronDown size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-top-2">
         <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Truck size={20} className="text-purple-600"/>
               <h3 className="font-bold text-gray-800 text-lg">{activeTab} Integration</h3>
            </div>
         </div>

         <form onSubmit={handleSave} className="p-8">
            
            {showSuccess && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 border border-green-100 mb-6 animate-in fade-in slide-in-from-top-1">
                 <CheckCircle size={18} /> Credentials saved successfully!
              </div>
            )}

            <div className="space-y-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Provider*</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50"
                    value={`${activeTab} Courier`}
                    disabled
                  >
                     <option>{activeTab} Courier</option>
                  </select>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Api Key</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    placeholder="Enter API Key"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-purple-600 mb-1">Secret Key</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition bg-purple-50/30"
                    placeholder="Enter Secret Key"
                    value={formData.secretKey}
                    onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instruction</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    placeholder="e.g. Handle fragile items with care"
                    value={formData.instruction}
                    onChange={(e) => setFormData({...formData, instruction: e.target.value})}
                  />
               </div>
            </div>

            <div className="pt-6 mt-6 flex flex-wrap gap-4">
               <button 
                 type="button"
                 onClick={handleTestConnection}
                 disabled={isTesting || !formData.apiKey || !formData.secretKey}
                 className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isTesting ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                 {isTesting ? 'Testing...' : 'Test Connection'}
               </button>
               <button 
                 type="submit"
                 disabled={isSaving}
                 className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg min-w-[160px] justify-center ${
                   saveSuccess 
                     ? 'bg-emerald-500 text-white shadow-emerald-200' 
                     : isSaving 
                       ? 'bg-purple-500 text-white shadow-purple-200 cursor-wait' 
                       : 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700'
                 }`}
               >
                 {saveSuccess ? (
                   <><CheckCircle2 size={18} className="animate-bounce" /> Saved!</>
                 ) : isSaving ? (
                   <><Loader2 size={18} className="animate-spin" /> Saving...</>
                 ) : (
                   <><Save size={18} /> Save Changes</>
                 )}
               </button>
            </div>

            {testResult && (
              <div className={`mt-4 px-4 py-3 rounded-lg flex items-center gap-2 ${testResult.valid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult.valid ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {testResult.message}
              </div>
            )}
         </form>
      </div>
    </div>
  );
};

export default AdminCourierSettings;
