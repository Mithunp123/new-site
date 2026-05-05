import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Apple, Mail, Eye, EyeOff, ArrowRight, User, Phone, MapPin, 
  Send, Video, Globe, Camera, Zap, Music, 
  Smartphone, Heart, Coffee, Utensils, Check, Briefcase, Sparkles
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import creatorBg from '../assets/login-bg-v2.png';
import brandBg from '../assets/brand-bg-v2.png';
import { registerUser, updateProfile, googleLogin as googleLoginApi } from '../api/creatorApi';
import { brandRegister, setBrandDetails } from '../api/brandApi';
import useAuthStore from '../store/authStore';

const RegisterPage = () => {
  const location = useLocation();
  const googleUser = location.state?.googleUser;
  const initialUserType = location.state?.userType || 'creator';

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(initialUserType); // 'creator' or 'brand'
  const [loading, setLoading] = useState(false);
  const [isAutoFetchEnabled, setIsAutoFetchEnabled] = useState(true);
  const [fetchingIG, setFetchingIG] = useState(false);
  const [fetchingYT, setFetchingYT] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

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
    budget_range: ''
  });

  const isBrand = userType === 'brand';

  const extractInstagramUsername = (url) => {
    if (!url) return null;
    const match = url.match(/(?:(?:http|https):\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)/i);
    return match ? match[1] : url.trim(); // Fallback to raw input if regex fails (user might type username directly)
  };

  const extractYouTubeIdentifier = (url) => {
    if (!url) return { type: null, identifier: null };
    const channelMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i);
    if (channelMatch) return { type: 'channelId', identifier: channelMatch[1] };
    
    const userMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)/i);
    if (userMatch) return { type: 'username', identifier: userMatch[1] };
    
    const handleMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)/i);
    if (handleMatch) return { type: 'handle', identifier: handleMatch[1] };
    
    return { type: 'handle', identifier: url.trim().replace(/^@/, '') };
  };

  const fetchIGStats = async () => {
    if (!isAutoFetchEnabled || !formData.instagram_url) return;
    const username = extractInstagramUsername(formData.instagram_url);
    if (!username) return;

    setFetchingIG(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3000/api/social/instagram?username=${username}`);
      const data = await res.json();
      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          instagram_followers: data.data.followers || prev.instagram_followers,
          instagram_avg_views: data.data.avg_views || prev.instagram_avg_views,
          instagram_er: data.data.engagement_rate || prev.instagram_er,
          instagram_verified: data.data.is_verified || prev.instagram_verified
        }));
      } else {
        // Silent fail for auto-fetch, let user manual enter
        console.log('IG fetch failed:', data.message);
      }
    } catch (err) {
      console.log('IG fetch error:', err);
    } finally {
      setFetchingIG(false);
    }
  };

  const fetchYTStats = async () => {
    if (!isAutoFetchEnabled || !formData.youtube_url) return;
    const { type, identifier } = extractYouTubeIdentifier(formData.youtube_url);
    if (!identifier) return;

    setFetchingYT(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3000/api/social/youtube?type=${type}&identifier=${identifier}`);
      const data = await res.json();
      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          youtube_subscribers: data.data.subscribers || prev.youtube_subscribers,
          youtube_avg_views: data.data.avg_views || prev.youtube_avg_views,
          youtube_er: data.data.engagement_rate || prev.youtube_er
        }));
      } else {
        console.log('YT fetch failed:', data.message);
      }
    } catch (err) {
      console.log('YT fetch error:', err);
    } finally {
      setFetchingYT(false);
    }
  };

  // Debounce helpers for input changing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.instagram_url && isAutoFetchEnabled) fetchIGStats();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.instagram_url, isAutoFetchEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.youtube_url && isAutoFetchEnabled) fetchYTStats();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.youtube_url, isAutoFetchEnabled]);

  const handleNext = () => {
    if (step === 3 && !isBrand) {
      if (!formData.instagram_url && !formData.youtube_url) {
        setError('Please provide at least one social media profile (Instagram or YouTube) to continue.');
        return;
      }
    }
    setError('');
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) {
      handleNext();
      return;
    }

    setError('');
    setLoading(true);
    try {
      const registrationFn = isBrand ? brandRegister : registerUser;
      const { data } = await registrationFn({
        name: formData.name,
        email: formData.email,
        password: googleUser ? 'GOOGLE_AUTH_USER' : formData.password,
        phone: formData.phone,
        location: formData.location,
        role: userType
      });

      if (isBrand) {
        await setBrandDetails({
          brand_name: formData.name,
          website: formData.website,
          category: formData.category,
          target_audience: formData.target_audience,
          campaign_goal: formData.campaign_goal,
          budget_range: formData.budget_range
        });
      } else {
        if (!formData.instagram_url && !formData.youtube_url) {
          setError('At least one platform (Instagram or YouTube) is required');
          setLoading(false);
          setStep(3);
          return;
        }

        await updateProfile({
          location: formData.location,
          phone: formData.phone,
          category: formData.category,
          instagram_url: formData.instagram_url,
          instagram_followers: parseInt(formData.instagram_followers) || 0,
          instagram_avg_views: parseInt(formData.instagram_avg_views) || 0,
          instagram_er: parseFloat(formData.instagram_er) || 0,
          instagram_verified: formData.instagram_verified,
          youtube_url: formData.youtube_url,
          youtube_subscribers: parseInt(formData.youtube_subscribers) || 0,
          youtube_avg_views: parseInt(formData.youtube_avg_views) || 0,
          youtube_er: parseFloat(formData.youtube_er) || 0,
        });
      }

      login(data.token, data.user);
      navigate(isBrand ? '/brand/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-jakarta">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex w-1/3 relative overflow-hidden bg-[#0F172A]">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay" 
             style={{ backgroundImage: `url(${isBrand ? brandBg : creatorBg})`, backgroundSize: 'cover' }}></div>
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Gradix</span>
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-6">
              Start your <span className="text-[#2563EB]">premium</span> journey with us.
            </h1>
            <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
              Connect with top-tier partners and scale your influence using our AI-driven platform.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white/60">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Check size={20} />
              </div>
              <span className="font-bold">Verified Partners Only</span>
            </div>
            <div className="flex items-center gap-4 text-white/60">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Check size={20} />
              </div>
              <span className="font-bold">Secure Escrow Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Progress Indicator */}
          <div className="flex justify-between mb-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
            <div className="absolute top-1/2 left-0 h-0.5 bg-[#2563EB] -translate-y-1/2 z-0 transition-all duration-500" 
                 style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}></div>
            
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-4 ${
                  s.id < step ? 'bg-[#2563EB] border-blue-100 text-white' : 
                  s.id === step ? 'bg-white border-[#2563EB] text-[#2563EB] shadow-lg shadow-blue-100' : 
                  'bg-white border-gray-100 text-gray-400'
                }`}>
                  {s.id < step ? <Check size={18} /> : s.id}
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-xs font-black uppercase tracking-wider ${s.id === step ? 'text-gray-900' : 'text-gray-400'}`}>{s.title}</p>
                  <p className="text-[10px] text-gray-400 font-bold hidden sm:block">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-[32px] p-10 shadow-xl shadow-slate-200/50 border border-white">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Choose your path</h2>
                    <p className="text-gray-500 font-bold">Select the role that fits you best</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => setUserType('creator')}
                      className={`relative p-8 rounded-3xl text-left transition-all duration-300 border-2 ${
                        userType === 'creator' 
                        ? 'border-[#2563EB] bg-blue-50/50 shadow-xl shadow-blue-100' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center ${
                        userType === 'creator' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Sparkles size={28} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">I'm a Creator</h3>
                      <p className="text-sm text-gray-500 font-bold leading-relaxed">
                        I want to collaborate with brands and monetize my content.
                      </p>
                      {userType === 'creator' && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center text-white">
                          <Check size={14} />
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setUserType('brand')}
                      className={`relative p-8 rounded-3xl text-left transition-all duration-300 border-2 ${
                        userType === 'brand' 
                        ? 'border-[#2563EB] bg-blue-50/50 shadow-xl shadow-blue-100' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center ${
                        userType === 'brand' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Briefcase size={28} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">I'm a Brand</h3>
                      <p className="text-sm text-gray-500 font-bold leading-relaxed">
                        I want to find the perfect creators to scale my products.
                      </p>
                      {userType === 'brand' && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center text-white">
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  </div>

                  <button 
                    onClick={handleNext}
                    className="w-full py-4 bg-[#0F172A] text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 group"
                  >
                    Continue <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Account Details</h2>
                    <p className="text-gray-500 font-bold italic">Let's set up your access</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        placeholder="Email Address"
                        className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Eye className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        placeholder="Password"
                        className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={handleBack} className="flex-1 py-4 bg-white border border-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-50 transition-all">Back</button>
                    <button onClick={handleNext} className="flex-[2] py-4 bg-[#2563EB] text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">Next Step</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Personalize Profile</h2>
                    <p className="text-gray-500 font-bold italic">Tell us what you're into</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative col-span-2">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="tel" 
                        placeholder="Phone Number"
                        className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="relative col-span-2">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Location"
                        className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                    
                    {!isBrand ? (
                      <>
                        <div className="col-span-2 flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-900">Instagram Stats</p>
                          <label className="flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:bg-blue-100">
                            <input 
                              type="checkbox" 
                              checked={isAutoFetchEnabled} 
                              onChange={e => setIsAutoFetchEnabled(e.target.checked)} 
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
                            />
                            {isAutoFetchEnabled ? 'Auto-Fetch ON' : 'Manual Entry'}
                          </label>
                        </div>
                        <div className="col-span-2 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative col-span-2">
                              <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input type="text" placeholder="Instagram URL (e.g. instagram.com/username)" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} onBlur={() => {if(isAutoFetchEnabled && !formData.instagram_followers) fetchIGStats();}} className="w-full pl-12 pr-10 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100" />
                              {fetchingIG && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                            </div>
                            <input type="number" placeholder="Followers" value={formData.instagram_followers} onChange={e => setFormData({...formData, instagram_followers: e.target.value})} className={`w-full px-4 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100 ${isAutoFetchEnabled ? 'opacity-80 bg-blue-50/50' : ''}`} />
                            <input type="number" placeholder="Avg Views" value={formData.instagram_avg_views} onChange={e => setFormData({...formData, instagram_avg_views: e.target.value})} className={`w-full px-4 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100 ${isAutoFetchEnabled ? 'opacity-80 bg-blue-50/50' : ''}`} />
                            <input type="number" step="0.01" placeholder="Engagement Rate %" value={formData.instagram_er} onChange={e => setFormData({...formData, instagram_er: e.target.value})} className={`w-full px-4 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100 ${isAutoFetchEnabled ? 'opacity-80 bg-blue-50/50' : ''}`} />
                            <label className="flex items-center gap-2 px-4 py-3 bg-[#F8FAFC] rounded-2xl cursor-pointer">
                              <input type="checkbox" checked={formData.instagram_verified} onChange={e => setFormData({...formData, instagram_verified: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                              <span className="text-sm font-bold text-gray-900">Verified (Blue Tick)</span>
                            </label>
                          </div>
                          {isAutoFetchEnabled && (formData.instagram_followers || formData.instagram_avg_views) && (
                            <p className="text-[10px] text-blue-600 font-bold text-right">Data auto-fetched (approximate)</p>
                          )}
                        </div>

                        <div className="col-span-2 space-y-4 pt-4 border-t border-gray-100">
                          <p className="text-sm font-bold text-gray-900">YouTube Stats</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative col-span-2">
                              <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input type="text" placeholder="YouTube URL (e.g. youtube.com/@channel)" value={formData.youtube_url} onChange={e => setFormData({...formData, youtube_url: e.target.value})} onBlur={() => {if(isAutoFetchEnabled && !formData.youtube_subscribers) fetchYTStats();}} className="w-full pl-12 pr-10 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100" />
                              {fetchingYT && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>}
                            </div>
                            <input type="number" placeholder="Subscribers" value={formData.youtube_subscribers} onChange={e => setFormData({...formData, youtube_subscribers: e.target.value})} className={`w-full px-4 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100 ${isAutoFetchEnabled ? 'opacity-80 bg-red-50/50' : ''}`} />
                            <input type="number" placeholder="Avg Views" value={formData.youtube_avg_views} onChange={e => setFormData({...formData, youtube_avg_views: e.target.value})} className={`w-full px-4 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100 ${isAutoFetchEnabled ? 'opacity-80 bg-red-50/50' : ''}`} />
                            <input type="number" step="0.01" placeholder="Engagement Rate %" value={formData.youtube_er} onChange={e => setFormData({...formData, youtube_er: e.target.value})} className={`w-full px-4 py-3 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100 ${isAutoFetchEnabled ? 'opacity-80 bg-red-50/50' : ''}`} />
                          </div>
                          {isAutoFetchEnabled && (formData.youtube_subscribers || formData.youtube_avg_views) && (
                            <p className="text-[10px] text-red-600 font-bold text-right">Data auto-fetched (approximate)</p>
                          )}
                        </div>
                        {error && <p className="text-red-500 text-sm font-bold col-span-2 text-center">{error}</p>}
                      </>
                    ) : (
                      <div className="relative col-span-2">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Brand Website" className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border-none text-gray-900 font-bold rounded-2xl focus:ring-2 focus:ring-blue-100" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={handleBack} className="flex-1 py-4 bg-white border border-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-50 transition-all">Back</button>
                    <button onClick={handleNext} className="flex-[2] py-4 bg-[#2563EB] text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">Next Step</button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Final Details</h2>
                    <p className="text-gray-500 font-bold">Pick your primary niche</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {categories.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setFormData({...formData, category: cat.id})}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border-2 ${
                          formData.category === cat.id 
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' 
                          : 'border-gray-50 bg-[#F8FAFC] text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        <cat.icon size={24} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 space-y-4">
                    <p className="text-[11px] text-gray-400 text-center font-medium px-8">
                      By completing signup, you agree to our <span className="text-blue-600 font-bold">Terms of Service</span> and <span className="text-blue-600 font-bold">Privacy Policy</span>.
                    </p>
                    <div className="flex gap-4">
                      <button onClick={handleBack} className="flex-1 py-4 bg-white border border-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-50 transition-all">Back</button>
                      <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-[#2563EB] text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">
                        {loading ? 'Processing...' : 'Complete Signup'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 font-bold">
              Already have an account? <Link to="/login" className="text-[#2563EB] hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
