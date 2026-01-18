import React, { useState, useEffect } from 'react';
import {
  Store, Globe, FileText, Truck, CreditCard, Search, MessageSquare,
  Users, Link2, Settings, ArrowRight, ExternalLink, CheckCircle, AlertCircle,
  Palette, Shield, Bell, Smartphone, BarChart3, Mail, Loader2, Facebook, Code, Package
} from 'lucide-react';
import { DataService } from '../services/DataService';
import { getAuthHeader } from '../services/authService';
import { Order, ChatMessage } from '../types';

interface ManageShopProps {
  onNavigate: (section: string) => void;
  tenantId: string;
  websiteConfig: any;
  tenantSubdomain?: string;
}

interface QuickStat {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

interface ShopCard {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  section?: string;
  isExternal?: boolean;
  status?: 'active' | 'pending' | 'inactive';
}

const AdminManageShop: React.FC<ManageShopProps> = ({ onNavigate, tenantId, websiteConfig, tenantSubdomain }) => {
  const [quickStats, setQuickStats] = useState<QuickStat[]>([
    { label: 'Store Visits', value: '0', change: '0%', icon: <BarChart3 size={18} /> },
    { label: 'Total Orders', value: '0', change: '0%', icon: <Store size={18} /> },
    { label: 'Customers', value: '0', change: '0%', icon: <Users size={18} /> },
    { label: 'Messages', value: '0', change: '0%', icon: <Mail size={18} /> }
  ]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch real statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!tenantId) return;
      
      setIsLoadingStats(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const now = new Date();
        const currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        const previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 7-14 days ago
        const previousPeriodEnd = currentPeriodStart;

        // Fetch all data in parallel
        const [visitorStatsResponse, orders, chatMessages] = await Promise.all([
          fetch(`${API_BASE_URL}/api/visitors/${tenantId}/stats?period=30d`, {
            headers: {
              ...getAuthHeader(),
              'Content-Type': 'application/json',
            },
          }).then(res => res.ok ? res.json() : { totalPageViews: 0, dailyStats: [] }),
          DataService.getOrders(tenantId),
          DataService.getChatMessages(tenantId),
        ]);

        // Calculate page views for current period (last 7 days) and previous period (7-14 days ago)
        const dailyStats = visitorStatsResponse.dailyStats || [];
        const currentPageViews = visitorStatsResponse.totalPageViews || 0;
        
        // Calculate previous period page views from daily stats
        const previousPeriodStartDate = new Date(previousPeriodStart);
        previousPeriodStartDate.setHours(0, 0, 0, 0);
        const previousPeriodEndDate = new Date(previousPeriodEnd);
        previousPeriodEndDate.setHours(0, 0, 0, 0);
        
        let previousPageViews = 0;
        dailyStats.forEach((day: { date: string; views: number }) => {
          const dayDate = new Date(day.date);
          if (dayDate >= previousPeriodStartDate && dayDate < previousPeriodEndDate) {
            previousPageViews += day.views || 0;
          }
        });
        
        const pageViewsChange = previousPageViews > 0 
          ? ((currentPageViews - previousPageViews) / previousPageViews * 100).toFixed(0)
          : currentPageViews > 0 ? '100' : '0';

        // Helper function to safely parse order dates
        const parseOrderDate = (dateStr: string): Date | null => {
          if (!dateStr) return null;
          const parsed = new Date(dateStr);
          return isNaN(parsed.getTime()) ? null : parsed;
        };

        // Orders stats
        const currentOrders = orders.filter(order => {
          const orderDate = parseOrderDate(order.date);
          return orderDate && orderDate >= currentPeriodStart;
        });
        const previousOrders = orders.filter(order => {
          const orderDate = parseOrderDate(order.date);
          return orderDate && orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
        });
        const totalOrders = orders.length;
        const ordersChange = previousOrders.length > 0
          ? (((currentOrders.length - previousOrders.length) / previousOrders.length) * 100).toFixed(0)
          : currentOrders.length > 0 ? '100' : '0';

        // Customers stats (unique customers from orders)
        const uniqueCustomers = new Set<string>();
        orders.forEach(order => {
          if (order.email) uniqueCustomers.add(order.email);
          else if (order.phone) uniqueCustomers.add(order.phone);
          else if (order.customer) uniqueCustomers.add(order.customer);
        });
        
        const currentCustomers = new Set<string>();
        currentOrders.forEach(order => {
          if (order.email) currentCustomers.add(order.email);
          else if (order.phone) currentCustomers.add(order.phone);
          else if (order.customer) currentCustomers.add(order.customer);
        });
        
        const previousCustomers = new Set<string>();
        previousOrders.forEach(order => {
          if (order.email) previousCustomers.add(order.email);
          else if (order.phone) previousCustomers.add(order.phone);
          else if (order.customer) previousCustomers.add(order.customer);
        });
        
        const totalCustomers = uniqueCustomers.size;
        const customersChange = previousCustomers.size > 0
          ? (((currentCustomers.size - previousCustomers.size) / previousCustomers.size) * 100).toFixed(0)
          : currentCustomers.size > 0 ? '100' : '0';

        // Messages stats
        const currentMessages = chatMessages.filter(msg => {
          const msgDate = new Date(msg.timestamp || 0);
          return msgDate >= currentPeriodStart;
        });
        const previousMessages = chatMessages.filter(msg => {
          const msgDate = new Date(msg.timestamp || 0);
          return msgDate >= previousPeriodStart && msgDate < previousPeriodEnd;
        });
        const totalMessages = chatMessages.length;
        const messagesChange = previousMessages.length > 0
          ? (((currentMessages.length - previousMessages.length) / previousMessages.length) * 100).toFixed(0)
          : currentMessages.length > 0 ? '100' : '0';

        // Format numbers with commas
        const formatNumber = (num: number) => {
          return num.toLocaleString('en-US');
        };

        // Update stats
        setQuickStats([
          {
            label: 'Store Visits',
            value: formatNumber(currentPageViews),
            change: `${parseFloat(pageViewsChange) >= 0 ? '+' : ''}${pageViewsChange}%`,
            icon: <BarChart3 size={18} />
          },
          {
            label: 'Total Orders',
            value: formatNumber(totalOrders),
            change: `${parseFloat(ordersChange) >= 0 ? '+' : ''}${ordersChange}%`,
            icon: <Store size={18} />
          },
          {
            label: 'Customers',
            value: formatNumber(totalCustomers),
            change: `${parseFloat(customersChange) >= 0 ? '+' : ''}${customersChange}%`,
            icon: <Users size={18} />
          },
          {
            label: 'Messages',
            value: formatNumber(totalMessages),
            change: `${parseFloat(messagesChange) >= 0 ? '+' : ''}${messagesChange}%`,
            icon: <Mail size={18} />
          }
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default values on error
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [tenantId]);

  const shopCards: ShopCard[] = [
    {
      id: 'shop-settings',
      title: 'Shop Settings',
      titleBn: 'শপ সেটিংস',
      description: 'Configure your store name, logo, contact info and business details',
      descriptionBn: 'আপনার স্টোরের নাম, লোগো, যোগাযোগের তথ্য এবং ব্যবসার বিবরণ কনফিগার করুন',
      icon: <Store size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      section: 'settings',
      status: 'active'
    },
    {
      id: 'domain',
      title: 'Shop Domain',
      titleBn: 'শপ ডোমেইন',
      description: 'Manage your store domain, SSL and custom URL settings',
      descriptionBn: 'আপনার স্টোরের ডোমেইন, SSL এবং কাস্টম URL সেটিংস পরিচালনা করুন',
      icon: <Globe size={24} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      section: 'settings',
      status: 'active'
    },
    {
      id: 'policies',
      title: 'Shop Policy',
      titleBn: 'শপ পলিসি',
      description: 'Set up your privacy policy, terms of service and return policy',
      descriptionBn: 'আপনার প্রাইভেসি পলিসি, সেবার শর্তাবলী এবং রিটার্ন পলিসি সেট আপ করুন',
      icon: <FileText size={24} />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      section: 'settings',
      status: 'pending'
    },
    {
      id: 'delivery-options',
      title: 'Delivery Options',
      titleBn: 'ডেলিভারি অপশন',
      description: 'Configure delivery charges, methods and shipping zones for your store',
      descriptionBn: 'আপনার স্টোরের জন্য ডেলিভারি চার্জ, পদ্ধতি এবং শিপিং জোন কনফিগার করুন',
      icon: <Truck size={24} />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      section: 'settings_delivery',
      status: 'active'
    },
    {
      id: 'courier-integration',
      title: 'Courier Integration',
      titleBn: 'কুরিয়ার ইন্টিগ্রেশন',
      description: 'Connect Steadfast, Pathao and other courier services for automated shipping',
      descriptionBn: 'স্বয়ংক্রিয় শিপিংয়ের জন্য স্টেডফাস্ট, পাঠাও এবং অন্যান্য কুরিয়ার সার্ভিস সংযুক্ত করুন',
      icon: <Package size={24} />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      section: 'settings_courier',
      status: 'active'
    },
    {
      id: 'facebook-pixel',
      title: 'Facebook Pixel',
      titleBn: 'ফেসবুক পিক্সেল',
      description: 'Track conversions, optimize ads and build audiences with Meta Pixel',
      descriptionBn: 'মেটা পিক্সেল দিয়ে কনভার্সন ট্র্যাক করুন, অ্যাড অপ্টিমাইজ করুন এবং অডিয়েন্স তৈরি করুন',
      icon: <Facebook size={24} />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      section: 'settings_facebook_pixel',
      status: 'active'
    },
    {
      id: 'gtm',
      title: 'Google Tag Manager',
      titleBn: 'গুগল ট্যাগ ম্যানেজার',
      description: 'Manage all marketing tags and analytics without editing code',
      descriptionBn: 'কোড এডিট ছাড়াই সব মার্কেটিং ট্যাগ এবং অ্যানালিটিক্স পরিচালনা করুন',
      icon: <Code size={24} />,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      section: 'settings_gtm',
      status: 'active'
    },
    {
      id: 'payment',
      title: 'Payment Gateway',
      titleBn: 'পেমেন্ট গেটওয়ে',
      description: 'Set up bKash, Nagad, card payments and cash on delivery options',
      descriptionBn: 'বিকাশ, নগদ, কার্ড পেমেন্ট এবং ক্যাশ অন ডেলিভারি সেট আপ করুন',
      icon: <CreditCard size={24} />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      section: 'settings',
      status: 'active'
    },
    {
      id: 'seo',
      title: 'SEO & Marketing',
      titleBn: 'SEO এবং মার্কেটিং',
      description: 'Optimize for search engines, add meta tags and analytics',
      descriptionBn: 'সার্চ ইঞ্জিনের জন্য অপ্টিমাইজ করুন, মেটা ট্যাগ এবং অ্যানালিটিক্স যোগ করুন',
      icon: <Search size={24} />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      section: 'settings',
      status: 'pending'
    },
    {
      id: 'sms',
      title: 'SMS Support',
      titleBn: 'SMS সাপোর্ট',
      description: 'Configure SMS notifications for orders and customer updates',
      descriptionBn: 'অর্ডার এবং কাস্টমার আপডেটের জন্য SMS নোটিফিকেশন কনফিগার করুন',
      icon: <Smartphone size={24} />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      section: 'settings',
      status: 'inactive'
    },
    {
      id: 'chat',
      title: 'Chat Support',
      titleBn: 'চ্যাট সাপোর্ট',
      description: 'Enable live chat, WhatsApp integration and messenger support',
      descriptionBn: 'লাইভ চ্যাট, হোয়াটসঅ্যাপ ইন্টিগ্রেশন এবং মেসেঞ্জার সাপোর্ট সক্রিয় করুন',
      icon: <MessageSquare size={24} />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      section: 'settings',
      status: 'active'
    },
    {
      id: 'social',
      title: 'Social Links',
      titleBn: 'সোশ্যাল লিংক',
      description: 'Connect your Facebook, Instagram, YouTube and other social accounts',
      descriptionBn: 'আপনার ফেসবুক, ইনস্টাগ্রাম, ইউটিউব এবং অন্যান্য সোশ্যাল অ্যাকাউন্ট সংযুক্ত করুন',
      icon: <Link2 size={24} />,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      section: 'settings',
      status: 'active'
    }
  ];


  const getStatusBadge = (status?: 'active' | 'pending' | 'inactive') => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            <CheckCircle size={12} /> Active
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
            <AlertCircle size={12} /> Setup
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg sm:rounded-xl text-white flex-shrink-0">
              <Settings size={20} className="sm:hidden" />
              <Settings size={28} className="hidden sm:block" />
            </div>
            <span className="truncate">Manage Shop</span>
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm truncate">শপ ম্যানেজ করুন - Configure and manage your store</p>
        </div>
        <button
          onClick={() => window.open(`https://${tenantSubdomain || websiteConfig?.domain || 'store'}.systemnextit.com`, '_blank')}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium shadow-sm text-sm w-full sm:w-auto"
        >
          <ExternalLink size={16} className="sm:hidden" />
          <ExternalLink size={18} className="hidden sm:block" />
          Visit Store
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {quickStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-400 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">{stat.icon}</span>
              {isLoadingStats ? (
                <Loader2 size={14} className="animate-spin text-gray-400" />
              ) : (
                <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                  stat.change.startsWith('+') || parseFloat(stat.change) > 0
                    ? 'text-green-600 bg-green-50'
                    : parseFloat(stat.change) < 0
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-600 bg-gray-50'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            {isLoadingStats ? (
              <div className="flex items-center gap-2">
                <Loader2 size={20} className="animate-spin text-gray-400" />
                <p className="text-xs sm:text-sm text-gray-400">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] sm:text-sm text-gray-500 truncate">{stat.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Shop Configuration Cards */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <Palette size={18} className="text-purple-500 sm:hidden" />
          <Palette size={20} className="text-purple-500 hidden sm:block" />
          Shop Configuration
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {shopCards.map((card) => (
            <div
              key={card.id}
              onClick={() => card.section && onNavigate(card.section)}
              className="group bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 border border-gray-400 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${card.bgColor} ${card.color} group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(card.icon as React.ReactElement, { size: 20 })}
                </div>
                {getStatusBadge(card.status)}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-purple-600 transition truncate">
                {card.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-2 truncate">{card.titleBn}</p>
              <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{card.description}</p>
              <div className="flex items-center gap-1 text-purple-600 text-xs sm:text-sm font-medium mt-2 sm:mt-3 opacity-0 group-hover:opacity-100 transition">
                Configure <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Security */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-blue-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg text-white">
              <Shield size={18} className="sm:hidden" />
              <Shield size={20} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Security Settings</h3>
              <p className="text-xs sm:text-sm text-gray-500">সিকিউরিটি সেটিংস</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            Manage passwords, 2FA authentication, and access controls.
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage Security <ArrowRight size={14} />
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-amber-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-amber-500 rounded-lg text-white">
              <Bell size={18} className="sm:hidden" />
              <Bell size={20} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Notifications</h3>
              <p className="text-xs sm:text-sm text-gray-500">নোটিফিকেশন</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            Configure email, push, and SMS notifications for orders.
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs sm:text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Manage Notifications <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-xl font-bold mb-1">Need Help Setting Up?</h3>
            <p className="text-purple-100 text-xs sm:text-sm">সাহায্য প্রয়োজন? আমাদের সাপোর্ট টিম সবসময় আপনার পাশে আছে।</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition text-xs sm:text-sm">
              Watch Tutorial
            </button>
            <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400 transition border border-purple-400 text-xs sm:text-sm">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManageShop;
