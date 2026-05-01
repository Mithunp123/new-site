import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Apple, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import './LoginPage.css';
import creatorBg from '../assets/login-bg-v2.png';
import brandBg from '../assets/brand-bg-v2.png';
import { useGoogleLogin } from '@react-oauth/google';
import { loginUser, googleLogin as googleLoginApi } from '../api/creatorApi';
import useAuthStore from '../store/authStore';

const GoogleLoginSection = ({ onLoading, onError, userType }) => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = googleClientId && googleClientId !== 'your_google_client_id_here';

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      onLoading(true);
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await response.json();
        const { data } = await googleLoginApi({ credential: tokenResponse.access_token, isAccessToken: true });
        
        if (data.isNewUser) {
          navigate('/register', { state: { googleUser: data.user, userType } });
        } else {
          login(data.token, data.user);
          navigate('/dashboard');
        }
      } catch (err) {
        onError('Google login failed');
      } finally {
        onLoading(false);
      }
    },
    onError: () => onError('Google login failed'),
  });

  if (!isGoogleConfigured) return null;

  return (
    <button className="social-btn" onClick={() => handleGoogleLogin()}>
      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Sign in with Google
    </button>
  );
};

const LoginPage = ({ onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('creator'); // 'creator' or 'brand'
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const isBrand = userType === 'brand';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-container ${isBrand ? 'reversed brand-theme' : ''}`}>
      {/* Dynamic side with halftone background */}
      <div 
        className="login-left" 
        style={{ backgroundImage: `url(${isBrand ? brandBg : creatorBg})` }}
      >
        <div className="brand-logo">
          <div className="logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="white"/>
              <rect x="14" y="3" width="7" height="7" rx="2" fill="white" fillOpacity="0.5"/>
              <rect x="3" y="14" width="7" height="7" rx="2" fill="white" fillOpacity="0.5"/>
              <rect x="14" y="14" width="7" height="7" rx="2" fill="white"/>
            </svg>
          </div>
          <span className="brand-name">Gradix</span>
        </div>
        <div className="login-left-content">
          <h1>
            {isBrand 
              ? "Scale your brand with top-tier creators" 
              : "Your personal cloud & AI for growth"}
          </h1>
        </div>
      </div>

      {/* Form side */}
      <div className="login-right">
        <button className="close-btn" onClick={() => navigate('/')}>
          <X size={24} />
        </button>

        <div className="login-form-container">
          <div className="user-toggle-container">
            <button 
              className={`toggle-btn ${!isBrand ? 'active' : ''}`}
              onClick={() => setUserType('creator')}
            >
              Creator
            </button>
            <button 
              className={`toggle-btn ${isBrand ? 'active' : ''}`}
              onClick={() => setUserType('brand')}
            >
              Brand
            </button>
          </div>

          <h2>Sign in as {isBrand ? 'Brand' : 'Creator'}</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="social-login">
            <button className="social-btn" onClick={() => navigate('/register')}>
              <Apple size={20} />
              Sign in with Apple
            </button>
            
            <GoogleLoginSection 
              onLoading={setLoading} 
              onError={setError} 
              userType={userType} 
            />
          </div>

          <div className="divider">or</div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="input-wrapper">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                />
              </div>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                />
                <div 
                  className="password-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <a href="#" className="forgot-password">Forgot password?</a>
          <p className="signup-text">
            No account? <Link to="/register"><span>Sign up</span></Link>
          </p>

          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">DEMO ACCESS</p>
            <p className="text-xs text-slate-400"><strong>Email:</strong> priya@gmail.com</p>
            <p className="text-xs text-slate-400"><strong>Password:</strong> password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
