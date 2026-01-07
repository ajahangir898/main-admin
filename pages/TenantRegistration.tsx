/**
 * TenantRegistration.tsx - Public Tenant Registration Page
 * 
 * Allows new users to register and create their own shop with:
 * - 14-day free trial
 * - Shop name and subdomain selection
 * - Real-time subdomain availability check
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Store, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  CreditCard,
  Hexagon,
  Eye,
  EyeOff
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// Types
interface FormData {
  shopName: string;
  subdomain: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  shopName?: string;
  subdomain?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

type SubdomainStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const FEATURES = [
  { icon: Store, title: 'নিজের অনলাইন শপ', desc: 'মিনিটেই আপনার শপ তৈরি' },
  { icon: Shield, title: 'সিকিউর পেমেন্ট', desc: 'SSL সার্টিফিকেট ফ্রি' },
  { icon: Clock, title: '১৪ দিন ফ্রি ট্রায়াল', desc: 'কোনো কার্ড লাগবে না' },
  { icon: CreditCard, title: 'সব পেমেন্ট মেথড', desc: 'বিকাশ, নগদ, কার্ড সাপোর্ট' },
];

const RESERVED_SUBDOMAINS = ['www', 'admin', 'superadmin', 'api', 'app', 'mail', 'smtp', 'ftp', 'cpanel', 'webmail', 'ns1', 'ns2'];

export default function TenantRegistration() {
  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    subdomain: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Shop Info, 2: Account Info
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [createdSubdomain, setCreatedSubdomain] = useState('');

  // Auto-generate subdomain from shop name
  useEffect(() => {
    if (formData.shopName && !formData.subdomain) {
      const generated = formData.shopName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 30);
      setFormData(prev => ({ ...prev, subdomain: generated }));
    }
  }, [formData.shopName]);

  // Check subdomain availability with debounce
  useEffect(() => {
    const subdomain = formData.subdomain.toLowerCase().trim();
    
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus('idle');
      return;
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      setSubdomainStatus('invalid');
      return;
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 2) {
      setSubdomainStatus('invalid');
      return;
    }

    setSubdomainStatus('checking');
    
    const checkAvailability = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tenants/check-subdomain/${subdomain}`);
        const data = await response.json();
        setSubdomainStatus(data.available ? 'available' : 'taken');
      } catch (error) {
        console.error('Subdomain check failed:', error);
        setSubdomainStatus('idle');
      }
    }, 500);

    return () => clearTimeout(checkAvailability);
  }, [formData.subdomain]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'subdomain') {
      // Only allow lowercase letters, numbers, and hyphens
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
      setFormData(prev => ({ ...prev, [name]: sanitized }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'শপের নাম দিন';
    } else if (formData.shopName.length < 3) {
      newErrors.shopName = 'শপের নাম কমপক্ষে ৩ অক্ষর হতে হবে';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'সাবডোমেইন দিন';
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = 'সাবডোমেইন কমপক্ষে ৩ অক্ষর হতে হবে';
    } else if (subdomainStatus === 'taken') {
      newErrors.subdomain = 'এই সাবডোমেইন ইতোমধ্যে নেওয়া হয়েছে';
    } else if (subdomainStatus === 'invalid') {
      newErrors.subdomain = 'সাবডোমেইন শুধু ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিয়ে হবে';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'আপনার নাম দিন';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'ইমেইল দিন';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'সঠিক ইমেইল দিন';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'ফোন নম্বর দিন';
    } else if (!/^(\+?880)?0?1[3-9]\d{8}$/.test(formData.phone.replace(/\s|-/g, ''))) {
      newErrors.phone = 'সঠিক বাংলাদেশি ফোন নম্বর দিন';
    }

    if (!formData.password) {
      newErrors.password = 'পাসওয়ার্ড দিন';
    } else if (formData.password.length < 6) {
      newErrors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1() && subdomainStatus === 'available') {
      setStep(2);
    } else if (subdomainStatus !== 'available') {
      toast.error('অনুগ্রহ করে একটি available সাবডোমেইন বাছাই করুন');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.shopName.trim(),
          subdomain: formData.subdomain.toLowerCase().trim(),
          contactName: formData.ownerName.trim(),
          contactEmail: formData.email.trim().toLowerCase(),
          adminEmail: formData.email.trim().toLowerCase(),
          adminPassword: formData.password,
          phone: formData.phone.trim(),
          plan: 'starter'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setCreatedSubdomain(formData.subdomain);
      setRegistrationSuccess(true);
      toast.success('🎉 অভিনন্দন! আপনার শপ তৈরি হয়েছে!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubdomainIcon = () => {
    switch (subdomainStatus) {
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'available':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'taken':
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Globe className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSubdomainMessage = () => {
    switch (subdomainStatus) {
      case 'checking':
        return <span className="text-blue-600">চেক করা হচ্ছে...</span>;
      case 'available':
        return <span className="text-green-600">✓ এই সাবডোমেইন available!</span>;
      case 'taken':
        return <span className="text-red-600">✗ এই সাবডোমেইন নেওয়া হয়েছে</span>;
      case 'invalid':
        return <span className="text-red-600">✗ সাবডোমেইন শুধু a-z, 0-9, - দিয়ে হবে</span>;
      default:
        return null;
    }
  };

  // Success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Helmet>
          <title>রেজিস্ট্রেশন সফল! - SystemNext IT</title>
        </Helmet>
        
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">🎉 অভিনন্দন!</h1>
          <p className="text-slate-600 mb-6">আপনার শপ সফলভাবে তৈরি হয়েছে</p>
          
          <div className="bg-indigo-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">আপনার শপের ঠিকানা:</p>
            <a 
              href={`https://${createdSubdomain}.systemnextit.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-indigo-600 hover:text-indigo-700"
            >
              {createdSubdomain}.systemnextit.com
            </a>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <Clock className="w-4 h-4 inline mr-1" />
              <strong>১৪ দিন ফ্রি ট্রায়াল</strong> শুরু হয়েছে!
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={`https://${createdSubdomain}.systemnextit.com/admin`}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              এডমিন প্যানেলে যান <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href={`https://${createdSubdomain}.systemnextit.com`}
              className="w-full bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:bg-slate-200 transition-colors block"
            >
              শপ দেখুন
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Helmet>
        <title>ফ্রি শপ তৈরি করুন - SystemNext IT</title>
        <meta name="description" content="১৪ দিন ফ্রি ট্রায়াল দিয়ে আপনার নিজের অনলাইন শপ তৈরি করুন। কোনো ক্রেডিট কার্ড লাগবে না।" />
      </Helmet>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Hexagon className="text-white" size={24} fill="white" />
            </div>
            <span className="text-xl font-bold text-slate-900">SystemNext IT</span>
          </a>
          <a 
            href="/" 
            className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            হোমপেজে ফিরুন
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Features */}
          <div className="lg:sticky lg:top-24">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4" />
                ১৪ দিন ফ্রি ট্রায়াল
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                আজই আপনার <span className="text-indigo-600">অনলাইন শপ</span> শুরু করুন
              </h1>
              <p className="text-lg text-slate-600">
                কোনো টেকনিক্যাল জ্ঞান ছাড়াই মিনিটেই নিজের ই-কমার্স শপ তৈরি করুন। 
                সব ফিচার ১৪ দিন ফ্রিতে ব্যবহার করুন।
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map((feature, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                    <feature.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl">
              <p className="text-sm text-slate-600">
                <strong>১০০০+</strong> ব্যবসায়ী ইতোমধ্যে SystemNext IT ব্যবহার করছেন
              </p>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                  1
                </div>
                <span className="font-medium">শপ তথ্য</span>
              </div>
              <div className="flex-1 h-1 bg-slate-200 rounded">
                <div className={`h-full bg-indigo-600 rounded transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                  2
                </div>
                <span className="font-medium">একাউন্ট</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Shop Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      শপের নাম *
                    </label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleInputChange}
                        placeholder="যেমন: Fashion Hub BD"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.shopName ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                      />
                    </div>
                    {errors.shopName && (
                      <p className="text-red-500 text-sm mt-1">{errors.shopName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      সাবডোমেইন (আপনার শপের ঠিকানা) *
                    </label>
                    <div className="relative">
                      {getSubdomainIcon()}
                      <input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleInputChange}
                        placeholder="yourshop"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.subdomain || subdomainStatus === 'taken' || subdomainStatus === 'invalid' ? 'border-red-300 bg-red-50' : subdomainStatus === 'available' ? 'border-green-300 bg-green-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                        style={{ paddingLeft: '3rem' }}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {getSubdomainIcon()}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {formData.subdomain && <span className="font-medium text-indigo-600">{formData.subdomain}.systemnextit.com</span>}
                      </p>
                      {getSubdomainMessage()}
                    </div>
                    {errors.subdomain && (
                      <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={subdomainStatus === 'checking'}
                    className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    পরবর্তী ধাপ <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Step 2: Account Info */}
              {step === 2 && (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 mb-2"
                  >
                    ← পিছনে যান
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      আপনার নাম *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        placeholder="আপনার পুরো নাম"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.ownerName ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      />
                    </div>
                    {errors.ownerName && (
                      <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ইমেইল *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ফোন নম্বর *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="01XXXXXXXXX"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      পাসওয়ার্ড *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        className={`w-full pl-12 pr-12 py-3 rounded-xl border ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      পাসওয়ার্ড নিশ্চিত করুন *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="আবার পাসওয়ার্ড দিন"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        তৈরি হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        ফ্রি শপ তৈরি করুন
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    রেজিস্ট্রেশন করে আপনি আমাদের{' '}
                    <a href="/terms" className="text-indigo-600 hover:underline">শর্তাবলী</a> ও{' '}
                    <a href="/privacy" className="text-indigo-600 hover:underline">প্রাইভেসি পলিসি</a> মেনে নিচ্ছেন।
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
