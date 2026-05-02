import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Apple, Eye, EyeOff, Loader } from 'lucide-react';
import useAuthStore from '../store/authStore';
import creatorBg from '../assets/login-bg-v2.png';
import brandBg from '../assets/brand-bg-v2.png';
import './LoginPage.css';

const LoginPage = () => {
  const [userType, setUserType] = useState('creator'); // 'creator' or 'brand'
  const [showPassword, setShowPassword] = useState(false);
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
      const { role } = await login(form);
      const isAdmin = role === 'admin' || role === 'super_admin' || role === 'moderator';
      if (isAdmin) navigate('/admin/dashboard');
      else if (role === 'brand') navigate('/brand/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-container ${isBrand ? 'brand-theme reversed' : ''}`}>
      <div className="login-left" style={{ 
        backgroundImage: `url(${isBrand ? brandBg : creatorBg})` 
      }}>
        <div className="brand-logo">
          <div className="logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="white"></rect>
              <rect x="14" y="3" width="7" height="7" rx="2" fill="white" fillOpacity="0.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="2" fill="white" fillOpacity="0.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="2" fill="white"></rect>
            </svg>
          </div>
          <span className="brand-name">Gradix</span>
        </div>
        <div className="login-left-content">
          <h1>{isBrand ? 'Scale your brand with top-tier creators' : 'Your personal cloud & AI for growth'}</h1>
        </div>
      </div>

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
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="social-login">
            <button className="social-btn">
              <Apple size={20} />
              Sign in with Apple
            </button>
            <button className="social-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Sign in with Google
            </button>
          </div>

          <div className="divider">or</div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="input-wrapper">
                <input 
                  placeholder="Email" 
                  required 
                  type="email" 
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>
              <div className="input-wrapper">
                <input 
                  placeholder="Password" 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                />
                <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={20} /> : 'Sign in'}
            </button>
          </form>

          <a href="#" className="forgot-password">Forgot password?</a>
          <p className="signup-text">No account? <Link to="/register"><span>Sign up</span></Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
