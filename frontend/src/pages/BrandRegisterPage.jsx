import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Phone, Building2, Eye, EyeOff, Loader, CheckCircle2, TrendingUp, Users, Target } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';

const FEATURES = [
  {
    icon: Users,
    title: 'Verified Creator Network',
    desc: '10,000+ verified creators across every niche and platform',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time ROI Tracking',
    desc: 'Track spend, revenue, and campaign performance live',
  },
  {
    icon: Target,
    title: 'Smart Matching',
    desc: 'AI-powered creator recommendations based on your brand goals',
  },
];

const STATS = [
  { label: 'Avg Campaign ROI', value: '4.2x' },
  { label: 'Verified Creators', value: '10K+' },
  { label: 'Brands Onboarded', value: '500+' },
];

export default function BrandRegisterPage() {
  const navigate = useNavigate();
  const { registerBrand, loading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    isGoogleSignUp: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleGoogleButtonClick = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await response.json();
        setFormData(prev => ({
          ...prev,
          name: googleUser.name || prev.name,
          email: googleUser.email || prev.email,
          isGoogleSignUp: true,
        }));
        setLocalError('');
      } catch (err) {
        setLocalError('Failed to process Google sign-in. Please try again.');
      }
    },
    onError: () => setLocalError('Failed to process Google sign-in. Please try again.'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (formData.isGoogleSignUp) {
      try {
        await registerBrand({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password, isGoogleSignUp: true });
        navigate('/brand/dashboard');
      } catch (err) {
        setLocalError(err.response?.data?.error || 'Registration failed');
      }
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      setLocalError('Name, email, and password are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      await registerBrand({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password });
      navigate('/brand/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0F172A] flex-col relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#2563EB]/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2563EB]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.5)]">
              <span className="text-white font-bold text-base">G</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Gradix</span>
          </div>

          {/* Headline */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Grow with the<br />
              <span className="text-[#2563EB]">right creators</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Connect with verified influencers, track ROI in real-time, and scale your brand with data-driven campaigns.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5 mb-12">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/20 flex items-center justify-center flex-shrink-0">
                  <f.icon size={18} className="text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-auto">
            {STATS.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-lg font-bold text-slate-900">Gradix</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your brand account</h2>
            <p className="text-sm text-slate-500">Start connecting with verified creators today</p>
          </div>

          {/* Error */}
          {(error || localError) && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error || localError}</p>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleButtonClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700 mb-5 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-slate-400 font-medium">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Brand Name */}
            <div>
              <label className="input-label">Brand Name *</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Brand Name"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email Address *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="hello@yourbrand.com"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="input-label">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 90000 00000"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password fields — only for email sign-up */}
            {!formData.isGoogleSignUp && (
              <>
                <div>
                  <label className="input-label">Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      className="input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="input-label">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      className="input pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Terms */}
            <p className="text-xs text-slate-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-[#2563EB] hover:underline font-medium">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[#2563EB] hover:underline font-medium">Privacy Policy</a>
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/brand/login" className="text-[#2563EB] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to home
            </Link>
          </div>

          <p className="text-center text-slate-300 text-xs mt-8">© 2024 Gradix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
