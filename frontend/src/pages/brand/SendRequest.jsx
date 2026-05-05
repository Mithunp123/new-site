import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Send, Save, Info, CheckCircle, 
  Star, Briefcase, Zap, Users, TrendingUp, BarChart2 
} from 'lucide-react';
import api from '../../api/axios';
import { formatINR, getAvatarColor, getInitials } from '../../utils/format';

const SendRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const creator = location.state?.creator;

  useEffect(() => {
    if (!creator) {
      navigate('/brand/discover', { replace: true });
    }
  }, [creator, navigate]);

  const [formData, setFormData] = useState({
    creator_id: creator?.id || '',
    campaign_name: '',
    campaign_goal: 'Sales / Conversions',
    campaign_brief: '',
    platform: 'instagram',
    content_type: 'Reel (60-90s)',
    number_of_posts: '1 Reel + 2 Stories',
    start_date: '',
    end_date: '',
    respond_by: '',
    budget_offer: 0,
    tracking_link: '',
    deliverables_required: ''
  });

  const [fees, setFees] = useState({ fee: 0, total: 0 });

  useEffect(() => {
    const offer = Number(formData.budget_offer) || 0;
    const fee = offer * 0.08;
    setFees({ fee, total: offer + fee });
  }, [formData.budget_offer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/brand/collaboration/send-request', formData);
      navigate('/brand/requests');
    } catch (err) {
      console.error(err);
      alert('Error sending request');
    }
  };

  if (!creator) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 font-jakarta">Send Collaboration Request</h1>
          <p className="text-gray-500 font-medium">
            Sending to: <span className="text-blue-600 font-bold">{creator.name}</span> — {creator.display_name} · {creator.followers_count || creator.top_platform_stats?.followers_count ? 'Creator' : 'Creator'}
          </p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Discovery
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta">Campaign Brief</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup label="Campaign Name" name="campaign_name" value={formData.campaign_name} onChange={handleChange} placeholder="e.g. Summer Glow 2026" />
              <FormSelect 
                label="Campaign Goal" 
                name="campaign_goal" 
                value={formData.campaign_goal} 
                onChange={handleChange} 
                options={['Sales / Conversions', 'Brand Awareness', 'Engagement', 'Lead Generation', 'App Downloads', 'Website Traffic']} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider text-[10px]">Campaign Brief</label>
              <textarea 
                name="campaign_brief"
                value={formData.campaign_brief}
                onChange={handleChange}
                rows={5}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm outline-none resize-none"
                placeholder="Describe what content you need, key messages, hashtags, and any brand guidelines..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect label="Platform" name="platform" value={formData.platform} onChange={handleChange} options={['Instagram', 'YouTube', 'TikTok', 'Twitter']} />
              <FormSelect 
                label="Content Type" 
                name="content_type" 
                value={formData.content_type} 
                onChange={handleChange} 
                options={['Reel (60-90s)', 'Reel (30s)', 'Post', 'Story', 'YouTube Short', 'YouTube Long']} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormGroup label="Number of Posts" name="number_of_posts" value={formData.number_of_posts} onChange={handleChange} placeholder="1 Reel + 2 Stories" />
              <FormGroup label="Start Date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
              <FormGroup label="End Date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} />
              <FormGroup label="Respond By" name="respond_by" type="date" value={formData.respond_by} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormGroup label="Budget Offer (₹)" name="budget_offer" type="number" value={formData.budget_offer} onChange={handleChange} required />
                <p className="text-[10px] text-blue-600 font-bold ml-1">Funds will move to escrow upon acceptance</p>
              </div>
              <FormGroup label="Tracking Link (Optional)" name="tracking_link" value={formData.tracking_link} onChange={handleChange} placeholder="https://brand.com/campaign" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider text-[10px]">Deliverables Required</label>
              <textarea 
                name="deliverables_required"
                value={formData.deliverables_required}
                onChange={handleChange}
                rows={4}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm outline-none resize-none"
                placeholder="List specific deliverables with timeline..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                <Zap className="w-5 h-5 fill-white" />
                Send Collaboration Request
              </button>
              <button type="button" className="px-8 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all">
                <Save className="w-5 h-5" />
                Save as Draft
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Profile & Budget */}
        <div className="w-full lg:w-[350px] space-y-6">
          {/* Creator Mini Profile */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 font-jakarta">Creator Profile</h2>
            <div className="flex items-center gap-4">
              {creator.profile_photo ? (
                 <img src={creator.profile_photo} alt={creator.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: creator.avatar_color || getAvatarColor(creator.id) }}>
                  {creator.initials || getInitials(creator.name)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900">{creator.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{creator.display_name} · {creator.location}</p>
                {creator.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase mt-1">
                    <CheckCircle className="w-3 h-3 fill-green-600 text-white" />
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatMini label="Followers" value={creator.top_platform_stats?.followers_count || 'N/A'} icon={Users} />
              <StatMini label="Eng. Rate" value={`${(creator.top_platform_stats?.engagement_rate || 0).toFixed(1)}%`} icon={TrendingUp} />
              <StatMini label="Avg Views" value={creator.top_platform_stats?.avg_views || 'N/A'} icon={BarChart2} />
              <StatMini label="Rating" value={`5.0⭐`} icon={Star} />
            </div>

            {creator.categories && creator.categories.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Niches</p>
                <div className="flex flex-wrap gap-1.5">
                  {creator.categories.map((cat, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget Summary */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 font-jakarta">Budget Summary</h2>
            <div className="space-y-3">
              <BudgetRow label="Budget Offer" value={formatINR(formData.budget_offer)} />
              <BudgetRow label="Platform Fee (8%)" value={formatINR(fees.fee)} />
              <div className="h-px bg-gray-50 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total to Escrow</span>
                <span className="text-lg font-extrabold text-blue-600">{formatINR(fees.total)}</span>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
                Funds held in escrow until brand approves the posted content. Creator receives payment automatically.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const FormGroup = ({ label, name, type = 'text', value, onChange, placeholder, required }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider text-[10px]">{label}</label>
    <input 
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold outline-none"
    />
  </div>
);

const FormSelect = ({ label, name, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider text-[10px]">{label}</label>
    <select 
      name={name}
      value={value}
      onChange={onChange}
      className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold outline-none appearance-none cursor-pointer"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const StatMini = ({ label, value, icon: Icon }) => (
  <div className="p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
    <div className="flex items-center gap-1.5 mb-1 text-gray-400">
      <Icon className="w-3 h-3" />
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </div>
    <p className="text-sm font-bold text-gray-900">{value}</p>
  </div>
);

const BudgetRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="text-gray-900 font-bold">{value}</span>
  </div>
);

export default SendRequest;
