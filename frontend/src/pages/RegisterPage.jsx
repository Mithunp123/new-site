import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Apple, Mail, Eye, EyeOff, ArrowRight, User, Phone, MapPin, 
  Send, Video, Globe, Camera, Zap, Music, 
  Smartphone, Heart, Coffee, Utensils
} from 'lucide-react';
import '../components/LoginPage.css'; 
import creatorBg from '../assets/login-bg-v2.png';
import brandBg from '../assets/brand-bg-v2.png';
import { registerUser, updateProfile } from '../api/creatorApi';
import useAuthStore from '../store/authStore';

const RegisterPage = () => {
  const location = useLocation();
  const googleUser = location.state?.googleUser;
  const initialUserType = location.state?.userType || 'creator';

  const [step, setStep] = useState(googleUser ? 2 : 1);
  const [userType, setUserType] = useState(initialUserType); // 'creator' or 'brand'
  const [loading, setLoading] = useState(false);
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
    instagram: '',
    youtube: '',
    twitter: '',
    website: ''
  });

  useEffect(() => {
    if (googleUser) {
      setFormData(prev => ({
        ...prev,
        name: googleUser.name,
        email: googleUser.email
      }));
    }
  }, [googleUser]);

  const isBrand = userType === 'brand';

  const handleNext = () => {
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
      // First register the user
      const { data } = await registerUser({
        name: formData.name,
        email: formData.email,
        password: googleUser ? 'GOOGLE_AUTH_USER' : formData.password, // Dummy password for social users
        phone: formData.phone,
        location: formData.location,
        role: userType,
        google_id: googleUser?.googleId
      });

      // Then update profile with extra wizard data
      await updateProfile({
        category: formData.category,
        social_links: JSON.stringify({
          instagram: formData.instagram,
          youtube: formData.youtube,
          twitter: formData.twitter,
          website: formData.website
        })
      });

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setStep(2); // Go back to basics if it failed
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'fashion', label: 'Fashion', icon: Camera },
    { id: 'tech', label: 'Technology', icon: Smartphone },
    { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
    { id: 'gaming', label: 'Gaming', icon: Zap },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'travel', label: 'Travel', icon: Globe },
    { id: 'business', label: 'Business', icon: Coffee },
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="wizard-step"
          >
            <div className="user-toggle-container mb-8">
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
            <h2>Join as a {isBrand ? 'Brand' : 'Creator'}</h2>
            <p className="step-description">Choose how you want to use Gradix.</p>
            
            <div className="social-login mt-8">
              <button className="social-btn" onClick={() => setStep(2)}>
                <Apple size={20} />
                Sign up with Apple
              </button>
              <button className="social-btn" onClick={() => setStep(2)}>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>
            </div>
            <div className="divider">or</div>
            <button className="submit-btn outline-btn" onClick={() => setStep(2)}>
              Continue with Email
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="wizard-step"
          >
            <h2>Create Account</h2>
            <p className="step-description">Enter your details to get started.</p>
            <div className="input-group mt-6">
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              {!googleUser && (
                <div className="input-wrapper">
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              )}
            </div>
            <div className="wizard-actions">
              <button className="back-btn" onClick={handleBack}>Back</button>
              <button className="submit-btn" onClick={handleNext}>Next Step</button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="wizard-step"
          >
            <h2>Profile Details</h2>
            <p className="step-description">Tell us more about yourself.</p>
            <div className="input-group mt-6">
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="with-icon"
                />
              </div>
              <div className="input-wrapper">
                <MapPin size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Location (e.g. New York, USA)" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="with-icon"
                />
              </div>
              <div className="social-inputs grid grid-cols-2 gap-4">
                <div className="input-wrapper">
                  <Camera size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="Instagram" 
                    value={formData.instagram}
                    onChange={e => setFormData({...formData, instagram: e.target.value})}
                    className="with-icon"
                  />
                </div>
                <div className="input-wrapper">
                  <Video size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="YouTube" 
                    value={formData.youtube}
                    onChange={e => setFormData({...formData, youtube: e.target.value})}
                    className="with-icon"
                  />
                </div>
              </div>
            </div>
            <div className="wizard-actions">
              <button className="back-btn" onClick={handleBack}>Back</button>
              <button className="submit-btn" onClick={handleNext}>Next Step</button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="wizard-step"
          >
            <h2>Choose Category</h2>
            <p className="step-description">Select your primary niche.</p>
            <div className="category-grid mt-6">
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  className={`category-item ${formData.category === cat.id ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, category: cat.id})}
                >
                  <cat.icon size={20} />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="wizard-actions mt-8">
              <button className="back-btn" onClick={handleBack}>Back</button>
              <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating Account...' : 'Complete Signup'}
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`login-container ${isBrand ? 'reversed brand-theme' : ''}`}>
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

      <div className="login-right">
        <button className="close-btn" onClick={() => navigate('/')}>
          <X size={24} />
        </button>

        <div className="login-form-container">
          <div className="wizard-progress mb-10">
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>
            <div className="progress-steps">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`step-dot ${s <= step ? 'active' : ''}`}></div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {step === 1 && (
            <p className="signup-text mt-8">
              Already have an account? <Link to="/login"><span>Sign in</span></Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
