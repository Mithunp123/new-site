import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Send, Save, Info, CheckCircle, 
  Star, Briefcase, Zap, Users, TrendingUp, 
  BarChart2, Calendar, Layout, 
  Link as LinkIcon, IndianRupee, ChevronRight,
  Globe, Sparkles, MapPin
} from 'lucide-react';
import api from '../../api/axios';
import { formatINR, formatCount, getAvatarColor, getInitials } from '../../utils/format';

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
    campaign_name: `Summer Glow — ${creator?.name || ''}`,
    campaign_goal: 'Sales / Conversions',
    campaign_brief: `Create a 60-90 second reel showcasing Nykaa's new Summer Glow Serum. Focus on application routine, glow results, and summer skincare benefits. Use #NykaaGlow and include our tracking link in bio for 30 days.`,
    platform: 'Instagram',
    content_type: 'Reel (60-90s)',
    number_of_posts: '1 Reel + 2 Stories',
    start_date: '2026-03-20',
    end_date: '2026-04-20',
    respond_by: '2026-03-15',
    budget_offer: 22000,
    tracking_link: 'https://nykaa.com/track/summer2026',
    deliverables_required: `1. 1 Instagram Reel (60-90 sec) - posted between Mar 20-30\n2. 2 Instagram Stories with swipe-up link\n3. Tracking link in bio for 30 days after posting`
  });

  const [fees, setFees] = useState({ fee: 0, total: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const offer = Number(formData.budget_offer) || 0;
    const fee = Math.round(offer * 0.08);
    setFees({ fee, total: offer + fee });
  }, [formData.budget_offer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/brand/collaboration/send-request', formData);
      navigate('/brand/requests');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!creator) return null;

  return (
    <div className="min-h-screen bg-[#F4F6FB] p-6 lg:p-10 font-jakarta">
      {/* Header Section */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-[32px] font-black text-[#0F172A] mb-1">Send Collaboration Request</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
             Sending to: <span className="text-blue-600 font-bold underline cursor-pointer">{creator.name}</span>
             <span className="text-slate-300"> — </span>
             <span>@{creator.display_name || 'creator'}</span>
             <span className="text-slate-300"> · </span>
             <span>{formatCount(Number(creator.top_platform_stats?.followers_count || 0))} followers</span>
             <span className="text-slate-300"> · </span>
             <span>{Number(creator.top_platform_stats?.engagement_rate || 0).toFixed(1)}% ER</span>
          </div>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Form Column */}
        <div className="flex-1 w-full space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-8">Campaign Brief</h2>
            
            <div className="space-y-8">
              {/* Row 1: Name & Goal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Campaign Name">
                  <input 
                    name="campaign_name"
                    value={formData.campaign_name}
                    onChange={handleChange}
                    placeholder="e.g. Summer Glow — Priya Sharma"
                    className="img-input"
                  />
                </FormGroup>
                <FormGroup label="Campaign Goal">
                  <div className="relative">
                    <select 
                      name="campaign_goal"
                      value={formData.campaign_goal}
                      onChange={handleChange}
                      className="img-input appearance-none pr-10"
                    >
                      {['Sales / Conversions', 'Brand Awareness', 'Engagement', 'Lead Generation', 'App Downloads', 'Website Traffic'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                  </div>
                </FormGroup>
              </div>

              {/* Row 2: Brief */}
              <FormGroup label="Campaign Brief">
                <textarea 
                  name="campaign_brief"
                  value={formData.campaign_brief}
                  onChange={handleChange}
                  rows={4}
                  className="img-input py-4 min-h-[100px] resize-none"
                  placeholder="Describe your requirements..."
                />
              </FormGroup>

              {/* Row 3: Platform & Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Platform">
                  <div className="relative">
                    <select 
                      name="platform"
                      value={formData.platform}
                      onChange={handleChange}
                      className="img-input appearance-none pr-10"
                    >
                      {['Instagram', 'YouTube', 'TikTok', 'Twitter'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                  </div>
                </FormGroup>
                <FormGroup label="Content Type">
                  <div className="relative">
                    <select 
                      name="content_type"
                      value={formData.content_type}
                      onChange={handleChange}
                      className="img-input appearance-none pr-10"
                    >
                      {['Reel (60-90s)', 'Reel (30s)', 'Post', 'Story', 'YouTube Short', 'YouTube Long'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                  </div>
                </FormGroup>
              </div>

              {/* Row 4: Posts & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormGroup label="Number of Posts">
                  <input name="number_of_posts" value={formData.number_of_posts} onChange={handleChange} className="img-input" />
                </FormGroup>
                <FormGroup label="Start Date">
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="img-input px-4" />
                </FormGroup>
                <FormGroup label="End Date">
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="img-input px-4" />
                </FormGroup>
              </div>

              {/* Row 5: Budget & Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormGroup label="Budget Offer (₹)">
                    <input type="number" name="budget_offer" value={formData.budget_offer} onChange={handleChange} className="img-input" />
                  </FormGroup>
                  <p className="text-[10px] text-slate-400 font-bold ml-1">Funds will move to escrow upon acceptance</p>
                </div>
                <FormGroup label="Tracking Link (Optional)">
                  <input name="tracking_link" value={formData.tracking_link} onChange={handleChange} className="img-input" placeholder="https://..." />
                </FormGroup>
              </div>

              {/* Row 6: Deliverables */}
              <FormGroup label="Deliverables Required">
                <textarea 
                  name="deliverables_required"
                  value={formData.deliverables_required}
                  onChange={handleChange}
                  rows={4}
                  className="img-input py-4 min-h-[100px] resize-none"
                />
              </FormGroup>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 fill-white" />
                  )}
                  Send Collaboration Request
                </button>
                <button type="button" className="bg-slate-100 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 transition-all">
                  Save as Draft
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-[380px] space-y-6 shrink-0">
          {/* Card 1: Creator Profile */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Creator Profile</h2>
            
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100 shrink-0">
                {creator.initials || getInitials(creator.name)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 leading-tight mb-0.5">{creator.name}</h3>
                <p className="text-xs text-slate-400 font-medium mb-1">@{creator.display_name} · {creator.location || 'Mumbai'}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase">
                  <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" /> Verified
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <MiniStat label="Followers" value={formatCount(Number(creator.top_platform_stats?.followers_count || 0))} />
              <MiniStat label="Eng. Rate" value={`${Number(creator.top_platform_stats?.engagement_rate || 0).toFixed(1)}%`} />
              <MiniStat label="Avg Views" value={formatCount(Number(creator.top_platform_stats?.avg_views || 0))} />
              <MiniStat label="Rating" value="4.8" icon={<Star className="w-3 h-3 fill-amber-400 text-amber-400" />} />
            </div>

            {/* Niches */}
            <div className="space-y-3 mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niches</p>
              <div className="flex flex-wrap gap-2">
                {creator.categories?.map((cat, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">
                    {cat}
                  </span>
                )) || ['Fashion', 'Beauty', 'Lifestyle'].map(c => <span key={c} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">{c}</span>)}
              </div>
            </div>

            {/* Past Brands */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Past Brands</p>
              <div className="flex flex-wrap gap-2">
                {['Swiggy', 'boAt', 'Myntra'].map(brand => (
                  <span key={brand} className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-bold">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Budget Summary */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Budget Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Budget Offer</span>
                <span className="text-blue-600 font-bold">{formatINR(formData.budget_offer)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Platform Fee (8%)</span>
                <span className="text-slate-900 font-bold">{formatINR(fees.fee)}</span>
              </div>
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Total to Escrow</span>
                <span className="text-lg font-black text-blue-600">{formatINR(fees.total)}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl flex gap-3 border border-blue-50">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                Funds held in escrow until brand approves the posted content. Creator receives payment automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .img-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-weight: 500;
          font-size: 14px;
          color: #0F172A;
          transition: all 0.2s;
          outline: none;
        }
        .img-input:focus {
          background-color: white;
          border-color: #2563EB;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.05);
        }
        .img-input::placeholder {
          color: #94A3B8;
        }
      ` }} />
    </div>
  );
};

const FormGroup = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>
    {children}
  </div>
);

const MiniStat = ({ label, value, icon }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all text-center">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{label}</p>
    <div className="flex items-center justify-center gap-1.5">
      <p className="text-sm font-black text-slate-900">{value}</p>
      {icon}
    </div>
  </div>
);

export default SendRequest;
