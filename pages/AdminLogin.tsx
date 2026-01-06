import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, LogIn, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authService from '../services/authService';
import { User } from '../types';

// Check if we're on the superadmin subdomain
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  (window.location.hostname === 'superadmin.systemnextit.com' || 
   window.location.hostname.startsWith('superadmin.'));

interface AdminLoginProps {
  onLoginSuccess?: (user: User) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      
      // Check if user has admin/staff privileges
      const user = result.user;
      
      // On superadmin subdomain, only allow super_admin login
      if (isSuperAdminSubdomain) {
        if (!user || user.role !== 'super_admin') {
          setError('Access denied. Only Super Admin can login here.');
          authService.logout();
          setIsLoading(false);
          return;
        }
      } else {
        // On regular admin subdomain, allow admin/staff/tenant_admin
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'tenant_admin' && user.role !== 'staff')) {
          setError('Access denied. This login is for admin and staff users only.');
          authService.logout();
          setIsLoading(false);
          return;
        }
      }

      toast.success('Login successful!');
      
      // Call parent callback to navigate to admin
      if (onLoginSuccess) {
        onLoginSuccess(user as User);
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a1410] p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-gradient-to-br from-[#0f0f1a]/90 to-[#0a1410]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-0 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-6 ${
              isSuperAdminSubdomain 
                ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-purple-900/50' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-900/50'
            }`}>
              <Shield className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isSuperAdminSubdomain ? 'Super Admin Portal' : 'Admin Portal'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isSuperAdminSubdomain 
                ? 'Sign in with super admin credentials' 
                : 'Sign in to access the admin dashboard'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm animate-shake">
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-slate-500 transition"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-slate-500 transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/30 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                />
                Remember me
              </label>
              <a
                href="#"
                className="text-emerald-400 hover:text-emerald-300 transition"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition shadow-lg shadow-emerald-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-slate-500">New to the platform?</span>
              </div>
            </div>

            {/* Register Link - Removed since onRegister is not available */}
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 pt-2">
            <div className="pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Customer?{' '}
                <a
                  href="/"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition"
                >
                  Visit Store
                </a>
              </p>
            </div>
            <p className="text-xs text-slate-600 text-center mt-4">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Admin Panel v2.0 • © {new Date().getFullYear()} SystemNextIT
        </p>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
