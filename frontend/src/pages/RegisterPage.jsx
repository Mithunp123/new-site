import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mail, Eye, EyeOff, ArrowRight, User, Phone, MapPin,
  Video, Globe, Camera, Zap, Music, Smartphone, Heart,
  Utensils, Check, Briefcase, Sparkles
} from 'lucide-react';
import creatorBg from '../assets/login-bg-v2.png';
import brandBg from '../assets/brand-bg-v2.png';
import { registerUser, updateProfile } from '../api/creatorApi';
import { brandRegister, setBrandDetails } from '../api/brandApi';
import useAuthStore from '../store/authStore';
import '../components/LoginPage.css';

const categories = [
  { id: 'fashion', label: 'Fashion', icon: Camera },
  { id: 'tech', label: 'Tech', icon: Smartphone },
  { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
  { id: 'gaming', label: 'Gaming', icon: Zap },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'food', label: 'Food', icon: Utensils },
];

const steps = [
  { id: 1, title: 'Role', sub: 'Who are you?' },
  { id: 2, title: 'Account', sub: 'Sign up details' },
  { id: 3, title: 'Profile', sub: 'Tell us more' },
  { id: 4, title: 'Finish', sub: 'Setup complete' },
];

function extractInstagramUsername(url) {
  if (!url) return null;
  const clean = url.trim().replace(/\/$/, '');
  const match = clean.match(/instagram\.com\/([^/?#]+)/i);
  if (match) return match[1];
  if (!clean.includes('/') && !clean.includes('.')) return clean;
  return null;
}

function extractYouTubeIdentifier(url) {
  if (!url) return null;
  const clean = url.trim().replace(/\/$/, '');
  const channelMatch = clean.match(/youtube\.com\/channel\/(UC[\w-]+)/i);
  if (channelMatch) return { type: 'channel_id', id: channelMatch[1] };
  const handleMatch = clean.match(/youtube\.com\/@([\w-]+)/i);
  if (handleMatch) return { type: 'handle', id: handleMatch[1] };
  const userMatch = clean.match(/youtube\.com\/user\/([\w-]+)/i);
  if (userMatch) return { type: 'username', id: userMatch[1] };
  if (!clean.includes('/') && !clean.includes('.')) return { type: 'handle', id: clean };
  return null;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuthStore();

  const googleUser = location.state?.googleUser || null;
  const initialUserType = location.state?.userType || 'creator';

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(initialUserType);
  const [loading, setLoading] = useState(false);
  const [isAutoFetchEnabled, setIsAutoFetchEnabled] = useState(false);
  const [fetchingIG, setFetchingIG] = useState(false);
  const [fetchingYT, setFetchingYT] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: googleUser?.name || '',
    email: googleUser?.email || '',
    password: '',
    phone: '',
    location: '',
    category: '',
    instagram_url: '',
    instagram_followers: '',
    instagram_avg_views: '',
    instagram_er: '',
    instagram_verified: false,
    youtube_url: '',
    youtube_subscribers: '',
    youtube_avg_views: '',
    youtube_er: '',
    twitter: '',
    website: '',
    target_audience: '',
    campaign_goal: '',
    budget_range: '',
    expected_budget: '',
  });

  const isBrand = userType === 'brand';

  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const fetchIGStats = useCallback(async () => {
    const username = extractInstagramUsername(formData.instagram_url);
    if (!username) return;
    setFetchingIG(true);
    try {
      const res = await fetch(`http://localhost:3000/api/social/instagram?username=${username}`);
      const data = await res.json();
      if (data && data.data) {
        const d = data.data;
        setFormData((prev) => ({
          ...prev,
          instagram_followers: d.followers || prev.instagram_followers,
          instagram_avg_views: d.avg_views || prev.instagram_avg_views,
          instagram_er: d.engagement_rate || prev.instagram_er,
          instagram_verified: d.verified || prev.instagram_verified,
        }));
      }
    } catch {
      // silently fail
    } finally {
      setFetchingIG(false);
    }
  }, [formData.instagram_url]);

  const fetchYTStats = useCallback(async () => {
    const result = extractYouTubeIdentifier(formData.youtube_url);
    if (!result) return;
    setFetchingYT(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/social/youtube?type=${result.type}&identifier=${result.id}`
      );
      const data = await res.json();
      if (data && data.data) {
        const d = data.data;
        setFormData((prev) => ({
          ...prev,
          youtube_subscribers: d.subscribers || prev.youtube_subscribers,
          youtube_avg_views: d.avg_views || prev.youtube_avg_views,
          youtube_er: d.engagement_rate || prev.youtube_er,
        }));
      }
    } catch {
      // silently fail
    } finally {
      setFetchingYT(false);
    }
  }, [formData.youtube_url]);

  // Debounced Instagram auto-fetch
  useEffect(() => {
    if (!isAutoFetchEnabled || !formData.instagram_url) return;
    const timer = setTimeout(() => {
      fetchIGStats();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.instagram_url, isAutoFetchEnabled, fetchIGStats]);

  // Debounced YouTube auto-fetch
  useEffect(() => {
    if (!isAutoFetchEnabled || !formData.youtube_url) return;
    const timer = setTimeout(() => {
      fetchYTStats();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.youtube_url, isAutoFetchEnabled, fetchYTStats]);

  const handleNext = () => {
    setError('');
    if (step === 3 && !isBrand) {
      if (!formData.instagram_url && !formData.youtube_url) {
        setError('Please add at least one social media URL to continue.');
        return;
      }
    }
    if (step < 4) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isBrand) {
        const res = await brandRegister({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        });
        const { token, brand } = res.data.data;
        setSession(token, { ...brand, role: 'brand' });
        await setBrandDetails({
          website: formData.website,
          target_audience: formData.target_audience,
          campaign_goal: formData.campaign_goal,
          budget_range: formData.budget_range,
          category: formData.category,
        });
        navigate('/brand/dashboard');
      } else {
        const res = await registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        });
        const { token, creator } = res.data.data;
        setSession(token, { ...creator, role: 'creator' });
        await updateProfile({
          location: formData.location,
          category: formData.category,
          instagram_url: formData.instagram_url,
          instagram_followers: formData.instagram_followers,
          instagram_avg_views: formData.instagram_avg_views,
          instagram_er: formData.instagram_er,
          instagram_verified: formData.instagram_verified,
          youtube_url: formData.youtube_url,
          youtube_subscribers: formData.youtube_subscribers,
          youtube_avg_views: formData.youtube_avg_views,
          youtube_er: formData.youtube_er,
          twitter: formData.twitter,
          expected_budget: formData.expected_budget,
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="login-container">
      {/* LEFT PANEL */}
      <div
        className="login-left"
        style={{ backgroundImage: `url(${isBrand ? brandBg : creatorBg})` }}
      >
        <div className="brand-logo">
          <div className="logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="white" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="white" />
            </svg>
          </div>
          <span className="brand-name">Gradix</span>
        </div>
        <div className="login-left-content">
          <h1>Start your premium journey</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={12} />
              </div>
              Connect with top brands and creators
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={12} />
              </div>
              AI-powered matching and analytics
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <button className="close-btn" onClick={() => navigate('/')}>
          <X size={24} />
        </button>

        <div className="login-form-container" style={{ maxWidth: '420px', width: '100%' }}>
          {/* PROGRESS INDICATOR */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', marginBottom: '16px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: '#2563EB',
                  borderRadius: '2px',
                  transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {steps.map((s) => {
                const isCompleted = step > s.id;
                const isCurrent = step === s.id;
                return (
                  <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        background: isCompleted ? '#2563EB' : isCurrent ? 'transparent' : '#1a1a1a',
                        border: isCurrent ? '2px solid #2563EB' : isCompleted ? '2px solid #2563EB' : '2px solid #333',
                        color: isCompleted ? '#fff' : isCurrent ? '#2563EB' : '#666',
                      }}
                    >
                      {isCompleted ? <Check size={12} /> : s.id}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: isCurrent ? '#fff' : '#666', textAlign: 'center' }}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP CONTENT */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* STEP 1 - Role Selection */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                    Choose your path
                  </h2>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px' }}>Select the role that best describes you</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                    {/* Creator Card */}
                    <div
                      onClick={() => setUserType('creator')}
                      style={{
                        background: userType === 'creator' ? 'rgba(37,99,235,0.08)' : '#1a1a1a',
                        border: `1px solid ${userType === 'creator' ? '#2563EB' : '#333'}`,
                        borderRadius: '16px',
                        padding: '20px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => { if (userType !== 'creator') e.currentTarget.style.borderColor = '#555'; }}
                      onMouseLeave={(e) => { if (userType !== 'creator') e.currentTarget.style.borderColor = '#333'; }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: userType === 'creator' ? 'rgba(37,99,235,0.15)' : '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={20} color={userType === 'creator' ? '#2563EB' : '#888'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#fff', marginBottom: '3px' }}>I'm a Creator</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Grow your audience and monetize your content</div>
                      </div>
                      {userType === 'creator' && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} color="#fff" />
                        </div>
                      )}
                    </div>

                    {/* Brand Card */}
                    <div
                      onClick={() => setUserType('brand')}
                      style={{
                        background: userType === 'brand' ? 'rgba(37,99,235,0.08)' : '#1a1a1a',
                        border: `1px solid ${userType === 'brand' ? '#2563EB' : '#333'}`,
                        borderRadius: '16px',
                        padding: '20px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => { if (userType !== 'brand') e.currentTarget.style.borderColor = '#555'; }}
                      onMouseLeave={(e) => { if (userType !== 'brand') e.currentTarget.style.borderColor = '#333'; }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: userType === 'brand' ? 'rgba(37,99,235,0.15)' : '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Briefcase size={20} color={userType === 'brand' ? '#2563EB' : '#888'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#fff', marginBottom: '3px' }}>I'm a Brand</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Find creators and run impactful campaigns</div>
                      </div>
                      {userType === 'brand' && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} color="#fff" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="submit-btn" onClick={handleNext} style={{ marginBottom: 0 }}>
                    Continue <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </button>
                </div>
              )}

              {/* STEP 2 - Account Details */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                    Account Details
                  </h2>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Create your Gradix account</p>

                  {googleUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                      {googleUser.picture && (
                        <img src={googleUser.picture} alt="Google" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      )}
                      <div>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Signing up with Google</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{googleUser.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="input-group">
                    <div className="input-wrapper">
                      <User size={16} className="input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                      <input
                        className="with-icon"
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        style={{ paddingLeft: '48px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 16px 14px 48px', outline: 'none' }}
                      />
                    </div>
                    <div className="input-wrapper">
                      <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        readOnly={!!googleUser?.email}
                        style={{
                          paddingLeft: '48px',
                          background: googleUser?.email ? '#111' : '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '12px',
                          color: googleUser?.email ? '#888' : '#fff',
                          fontSize: '14px',
                          width: '100%',
                          padding: '14px 16px 14px 48px',
                          outline: 'none',
                          cursor: googleUser?.email ? 'not-allowed' : 'text',
                        }}
                      />
                    </div>
                    {!googleUser && (
                      <div className="input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 48px 14px 16px', outline: 'none' }}
                        />
                        <div
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', cursor: 'pointer' }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="wizard-actions">
                    <button className="back-btn" onClick={handleBack}>Back</button>
                    <button
                      className="submit-btn"
                      onClick={handleNext}
                      disabled={!formData.name || (!googleUser && !formData.password) || !formData.email}
                      style={{ marginBottom: 0, opacity: (!formData.name || (!googleUser && !formData.password) || !formData.email) ? 0.5 : 1 }}
                    >
                      Continue <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 - Profile */}
              {step === 3 && (
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                    Personalize Profile
                  </h2>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                    {isBrand ? 'Tell us about your brand' : 'Add your social presence'}
                  </p>

                  <div className="input-group">
                    <div className="input-wrapper">
                      <Phone size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        style={{ paddingLeft: '48px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 16px 14px 48px', outline: 'none' }}
                      />
                    </div>
                    {!isBrand && (
                      <div className="input-wrapper">
                        <MapPin size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                        <input
                          type="text"
                          placeholder="Location (city, country)"
                          value={formData.location}
                          onChange={(e) => updateField('location', e.target.value)}
                          style={{ paddingLeft: '48px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 16px 14px 48px', outline: 'none' }}
                        />
                      </div>
                    )}
                  </div>

                  {isBrand ? (
                    /* Brand: website */
                    <div className="input-group">
                      <div className="input-wrapper">
                        <Globe size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                        <input
                          type="url"
                          placeholder="Brand website URL"
                          value={formData.website}
                          onChange={(e) => updateField('website', e.target.value)}
                          style={{ paddingLeft: '48px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 16px 14px 48px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Creator: Instagram + YouTube */
                    <div>
                      {/* Auto-fetch toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: '#888' }}>Auto-fetch social stats</span>
                        <button
                          onClick={() => setIsAutoFetchEnabled(!isAutoFetchEnabled)}
                          style={{
                            background: isAutoFetchEnabled ? 'rgba(37,99,235,0.15)' : '#1a1a1a',
                            border: `1px solid ${isAutoFetchEnabled ? '#2563EB' : '#333'}`,
                            borderRadius: '20px',
                            padding: '5px 14px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: isAutoFetchEnabled ? '#2563EB' : '#666',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isAutoFetchEnabled ? 'Auto-Fetch ON' : 'Auto-Fetch OFF'}
                        </button>
                      </div>

                      {/* Instagram Section */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Instagram Stats</span>
                          {fetchingIG && (
                            <span style={{ fontSize: '11px', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <svg style={{ animation: 'spin 1s linear infinite', width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                              </svg>
                              Fetching...
                            </span>
                          )}
                        </div>
                        <div className="input-group" style={{ marginBottom: '8px' }}>
                          <div className="input-wrapper">
                            <Camera size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                            <input
                              type="url"
                              placeholder="Instagram profile URL"
                              value={formData.instagram_url}
                              onChange={(e) => updateField('instagram_url', e.target.value)}
                              style={{ paddingLeft: '48px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 16px 14px 48px', outline: 'none' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <input
                              type="number"
                              placeholder="Followers"
                              value={formData.instagram_followers}
                              onChange={(e) => updateField('instagram_followers', e.target.value)}
                              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '12px 14px', outline: 'none', width: '100%' }}
                            />
                            <input
                              type="number"
                              placeholder="Avg Views"
                              value={formData.instagram_avg_views}
                              onChange={(e) => updateField('instagram_avg_views', e.target.value)}
                              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '12px 14px', outline: 'none', width: '100%' }}
                            />
                            <input
                              type="number"
                              placeholder="Engagement Rate %"
                              value={formData.instagram_er}
                              onChange={(e) => updateField('instagram_er', e.target.value)}
                              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '12px 14px', outline: 'none', width: '100%' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '12px 14px' }}>
                              <input
                                type="checkbox"
                                checked={formData.instagram_verified}
                                onChange={(e) => updateField('instagram_verified', e.target.checked)}
                                style={{ accentColor: '#2563EB', width: '14px', height: '14px' }}
                              />
                              <span style={{ fontSize: '13px', color: '#fff' }}>Verified</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid #333', margin: '16px 0' }} />

                      {/* YouTube Section */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>YouTube Stats</span>
                          {fetchingYT && (
                            <span style={{ fontSize: '11px', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <svg style={{ animation: 'spin 1s linear infinite', width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                              </svg>
                              Fetching...
                            </span>
                          )}
                        </div>
                        <div className="input-group">
                          <div className="input-wrapper">
                            <Video size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                            <input
                              type="url"
                              placeholder="YouTube channel URL"
                              value={formData.youtube_url}
                              onChange={(e) => updateField('youtube_url', e.target.value)}
                              style={{ paddingLeft: '48px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 16px 14px 48px', outline: 'none' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <input
                              type="number"
                              placeholder="Subscribers"
                              value={formData.youtube_subscribers}
                              onChange={(e) => updateField('youtube_subscribers', e.target.value)}
                              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '12px 14px', outline: 'none', width: '100%' }}
                            />
                            <input
                              type="number"
                              placeholder="Avg Views"
                              value={formData.youtube_avg_views}
                              onChange={(e) => updateField('youtube_avg_views', e.target.value)}
                              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '12px 14px', outline: 'none', width: '100%' }}
                            />
                            <input
                              type="number"
                              placeholder="Engagement Rate %"
                              value={formData.youtube_er}
                              onChange={(e) => updateField('youtube_er', e.target.value)}
                              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '12px 14px', outline: 'none', width: '100%', gridColumn: 'span 2' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Twitter */}
                      <div style={{ marginTop: '12px' }}>
                        <div className="input-wrapper">
                          <Globe size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                          <input
                            type="url"
                            placeholder="Twitter / X profile URL (optional)"
                            value={formData.twitter}
                            onChange={(e) => updateField('twitter', e.target.value)}
                            style={{ paddingLeft: '48px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', width: '100%', padding: '14px 16px 14px 48px', outline: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{error}</p>
                  )}

                  <div className="wizard-actions" style={{ marginTop: '24px' }}>
                    <button className="back-btn" onClick={handleBack}>Back</button>
                    <button className="submit-btn" onClick={handleNext} style={{ marginBottom: 0 }}>
                      Continue <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 - Final Details */}
              {step === 4 && (
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                    Final Details
                  </h2>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Almost there — just a few more things</p>

                  {/* Budget input */}
                  {!isBrand ? (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>Expected budget per campaign</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '16px', fontWeight: '600', pointerEvents: 'none' }}>₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 50000"
                          value={formData.expected_budget}
                          onChange={(e) => updateField('expected_budget', e.target.value)}
                          style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '500', width: '100%', padding: '14px 16px 14px 36px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>Campaign budget range</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '16px', fontWeight: '600', pointerEvents: 'none' }}>₹</span>
                        <input
                          type="text"
                          placeholder="e.g. 1,00,000 - 5,00,000"
                          value={formData.budget_range}
                          onChange={(e) => updateField('budget_range', e.target.value)}
                          style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '500', width: '100%', padding: '14px 16px 14px 36px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Brand extra fields */}
                  {isBrand && (
                    <div className="input-group" style={{ marginBottom: '20px' }}>
                      <input
                        type="text"
                        placeholder="Target audience (e.g. 18-25 urban youth)"
                        value={formData.target_audience}
                        onChange={(e) => updateField('target_audience', e.target.value)}
                        style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '14px 16px', outline: 'none', width: '100%' }}
                      />
                      <input
                        type="text"
                        placeholder="Campaign goal (e.g. brand awareness)"
                        value={formData.campaign_goal}
                        onChange={(e) => updateField('campaign_goal', e.target.value)}
                        style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '14px 16px', outline: 'none', width: '100%' }}
                      />
                    </div>
                  )}

                  {/* Category grid */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '12px' }}>Pick your primary niche</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {categories.map(({ id, label, icon: Icon }) => {
                        const isActive = formData.category === id;
                        return (
                          <div
                            key={id}
                            onClick={() => updateField('category', id)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '16px 8px',
                              background: isActive ? 'rgba(37,99,235,0.08)' : '#1a1a1a',
                              border: `1px solid ${isActive ? '#2563EB' : '#333'}`,
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#555'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#333'; }}
                          >
                            <Icon size={20} color={isActive ? '#2563EB' : '#666'} />
                            <span style={{ fontSize: '12px', fontWeight: '500', color: isActive ? '#fff' : '#666' }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Terms */}
                  <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginBottom: '20px', lineHeight: '1.6' }}>
                    By signing up you agree to our{' '}
                    <span style={{ color: '#888', cursor: 'pointer' }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: '#888', cursor: 'pointer' }}>Privacy Policy</span>
                  </p>

                  {error && (
                    <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>
                  )}

                  <div className="wizard-actions">
                    <button className="back-btn" onClick={handleBack} disabled={loading}>Back</button>
                    <button
                      className="submit-btn"
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{ marginBottom: 0, opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                          </svg>
                          Creating account...
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Complete Signup <Check size={16} />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <p className="signup-text" style={{ marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login"><span>Sign in</span></Link>
        </p>
      </div>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
