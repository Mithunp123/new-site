import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Phone, Building2, Eye, EyeOff, Loader } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';

export default function BrandRegisterPage() {
  const navigate = useNavigate();
  const { registerBrand, loading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    isGoogleSignUp: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleGoogleButtonClick = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const googleUser = await response.json();

        setFormData(prev => ({
          ...prev,
          name: googleUser.name || prev.name,
          email: googleUser.email || prev.email,
          isGoogleSignUp: true
        }));
        setLocalError('');
      } catch (err) {
        setLocalError('Failed to process Google sign-in. Please try again.');
        console.error('Google sign-in error:', err);
      }
    },
    onError: () => setLocalError('Failed to process Google sign-in. Please try again.')
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

    // Google sign-up doesn't require password validation
    if (formData.isGoogleSignUp) {
      try {
        await registerBrand({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          isGoogleSignUp: true
        });
        navigate('/brand/dashboard');
      } catch (err) {
        setLocalError(err.response?.data?.error || 'Registration failed');
      }
      return;
    }

    // Validation
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
      await registerBrand({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      navigate('/brand/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gradix</h1>
            <p className="text-slate-600">Create your brand account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {(error || localError) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error || localError}</p>
              </div>
            )}

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or continue with email</span>
              </div>
            </div>

            {/* Brand Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Brand Name"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="hello@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 90000 00000"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password Fields - Only shown for email sign-up */}
            {!formData.isGoogleSignUp && (
              <>
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
              </>
            )}

            {/* Terms */}
            <p className="text-xs text-slate-600 mt-4">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-sm text-slate-500">Already have an account?</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Sign In Link */}
          <Link
            to="/brand/login"
            className="block text-center py-2.5 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Sign In
          </Link>

          {/* Back Link */}
          <Link
            to="/"
            className="block text-center mt-4 text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to home
          </Link>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-slate-400 text-sm mt-8">
          © 2024 Gradix. All rights reserved.
        </p>
      </div>
    </div>
  );
}
