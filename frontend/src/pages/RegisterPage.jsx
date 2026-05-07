import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mail, Eye, EyeOff, ArrowRight, User, Phone, MapPin,
  Video, Globe, Camera, Zap, Music, Smartphone, Heart,
  Utensils, Check, Briefcase, Sparkles
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
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

  // Allow signing up with Google directly from the register page
  // We store the google user in local state instead of navigating to avoid losing userType selection
  const [googleUserState, setGoogleUserState] = useState(googleUser);

  const signUpWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const gUser = await res.json();
        const gData = { name: gUser.name, email: gUser.email, picture: gUser.picture };
        // Store in local state and pre-fill form — no navigation needed
        setGoogleUserState(gData);
        setFormData((prev) => ({
          ...prev,
          name: gUser.name || prev.name,
          email: gUser.email || prev.email,
        }));
        // Jump straight to step 3 since we have their identity
        setStep(3);
      } catch {
        setError('Failed to get Google account info. Please try again.');
      }
    },
    onError: () => setError('Google sign-up failed. Please try again.'),
  });

  // Use local state for googleUser so it works both when redirected from login
  // AND when user clicks "Continue with Google" directly on this page
  const activeGoogleUser = googleUserState;

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

  // When signing up via Google, step 2 (Account Details) is skipped entirely
  // because name + email are already known and no password is needed.
  const handleNext = () => {
    setError('');
    if (step === 3 && !isBrand) {
      if (!formData.instagram_url && !formData.youtube_url) {
        setError('Please add at least one social media URL to continue.');
        return;
      }
    }
    if (step < 4) {
      // Skip step 2 for Google sign-up users
      const nextStep = activeGoogleUser && step === 1 ? 3 : step + 1;
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      // Skip step 2 when going back for Google sign-up users
      const prevStep = activeGoogleUser && step === 3 ? 1 : step - 1;
      setStep(prevStep);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isBrand) {
        const res = await brandRegister({
          name: formData.name,
          email: formData.email,
          password: activeGoogleUser ? 'GOOGLE_AUTH_USER' : formData.password,
          phone: formData.phone,
          isGoogleSignUp: !!activeGoogleUser,
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
          password: activeGoogleUser ? 'GOOGLE_AUTH_USER' : formData.password,
          phone: formData.phone,
          isGoogleSignUp: !!activeGoogleUser,
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

  // For Google sign-up, step 2 is skipped so we map visual steps differently:
  // actual steps shown: 1 → 3 → 4  (step 2 is auto-completed)
  const progressPercent = activeGoogleUser
    ? step === 1 ? 0 : step === 3 ? 66 : 100
    : ((step - 1) / (steps.length - 1)) * 100;

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
        {/* Top navigation: back arrow (left) + close X (right) */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'color 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>

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
                // For Google sign-up: step 2 is auto-completed, treat it as always done
                const isCompleted = activeGoogleUser
                  ? (s.id < step || s.id === 2)
                  : step > s.id;
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

                  {/* Google identity banner — shown when coming from Google OAuth */}
                  {activeGoogleUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1a1a1a', border: '1px solid #2563EB', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
                      {activeGoogleUser.picture ? (
                        <img
                          src={activeGoogleUser.picture}
                          alt={activeGoogleUser.name}
                          referrerPolicy="no-referrer"
                          style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                          {activeGoogleUser.name?.[0]?.toUpperCase() || 'G'}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>
                          {activeGoogleUser.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {activeGoogleUser.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(37,99,235,0.15)', borderRadius: '8px', padding: '4px 8px', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: '600' }}>Google</span>
                      </div>
                    </div>
                  )}
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

                  {/* Google sign-up option — only shown when NOT already coming from Google OAuth */}
                  {!activeGoogleUser && (
                    <>
                      <div className="divider" style={{ margin: '16px 0' }}>or</div>
                      <button
                        className="social-btn"
                        onClick={() => signUpWithGoogle()}
                        style={{ width: '100%' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* STEP 2 - Account Details */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                    Account Details
                  </h2>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Create your Gradix account</p>

                  {activeGoogleUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                      {activeGoogleUser.picture && (
                        <img
                          src={activeGoogleUser.picture}
                          alt={activeGoogleUser.name}
                          referrerPolicy="no-referrer"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Signing up with Google</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{activeGoogleUser.email}</div>
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
                        readOnly={!!activeGoogleUser?.email}
                        style={{
                          paddingLeft: '48px',
                          background: activeGoogleUser?.email ? '#111' : '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '12px',
                          color: activeGoogleUser?.email ? '#888' : '#fff',
                          fontSize: '14px',
                          width: '100%',
                          padding: '14px 16px 14px 48px',
                          outline: 'none',
                          cursor: activeGoogleUser?.email ? 'not-allowed' : 'text',
                        }}
                      />
                    </div>
                    {!activeGoogleUser && (
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
                      disabled={!formData.name || (!activeGoogleUser && !formData.password) || !formData.email}
                      style={{ marginBottom: 0, opacity: (!formData.name || (!activeGoogleUser && !formData.password) || !formData.email) ? 0.5 : 1 }}
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
