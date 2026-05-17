import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Info, CheckCircle2, Package, Film, Image, FileText, Video, Layout, ShoppingBag, BookOpen, Megaphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { formatINR, formatCount, getInitials } from '../../utils/format';
import verificationBadge from '../../assets/Verification Badge.gif';

// All content type options a brand might request in a campaign
const CONTENT_TYPES = [
  { id: 'ig_reel', label: 'Instagram Reel', icon: Film, platform: 'Instagram' },
  { id: 'ig_story', label: 'Instagram Story', icon: Layout, platform: 'Instagram' },
  { id: 'ig_post', label: 'Instagram Post', icon: Image, platform: 'Instagram' },
  { id: 'ig_carousel', label: 'Carousel Post', icon: Layout, platform: 'Instagram' },
  { id: 'yt_short', label: 'YouTube Short', icon: Video, platform: 'YouTube' },
  { id: 'yt_video', label: 'YouTube Video', icon: Video, platform: 'YouTube' },
];

const SendRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const creatorFromState = location.state?.creator;

  useEffect(() => {
    if (!creatorFromState) navigate('/brand/discover', { replace: true });
  }, [creatorFromState, navigate]);

  const [formData, setFormData] = useState({
    creator_id: creatorFromState?.id || '',
    campaign_name: '',
    campaign_goal: 'Sales / Conversions',
    campaign_brief: '',
    platform: 'Instagram',
    start_date: '',
    end_date: '',
    respond_by: '',
    budget_offer: '',
    tracking_link: '',
    deliverables_required: '',
  });

  // Multi-content-type state: { content_type_id: quantity }
  const [selectedTypes, setSelectedTypes] = useState({});
  const [fees, setFees] = useState({ fee: 0, total: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: creatorData } = useQuery({
    queryKey: ['creator-profile-send', creatorFromState?.id],
    queryFn: async () => {
      const res = await api.get(`/api/brand/creator/${creatorFromState.id}`);
      return res.data.data;
    },
    enabled: !!creatorFromState?.id,
    staleTime: 60000,
  });

  const creator = creatorData?.creator || creatorFromState || {};
  const socialProfiles = creatorData?.social_profiles || [];
  const nicheDetails = creatorData?.niche_details || {};
  const workedWithBrands = Array.isArray(nicheDetails.worked_with_brands)
    ? nicheDetails.worked_with_brands
    : (typeof nicheDetails.worked_with_brands === 'string' ? JSON.parse(nicheDetails.worked_with_brands || '[]') : []);
  const categories = Array.isArray(nicheDetails.categories)
    ? nicheDetails.categories
    : (typeof nicheDetails.categories === 'string' ? JSON.parse(nicheDetails.categories || '[]') : (creatorFromState?.categories || []));

  const instagram = socialProfiles.find(p => p.platform === 'instagram');
  const youtube = socialProfiles.find(p => p.platform === 'youtube');

  useEffect(() => {
    const offer = Number(formData.budget_offer) || 0;
    const fee = Math.round(offer * 0.08);
    setFees({ fee, total: offer + fee });
  }, [formData.budget_offer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleContentType = (typeId) => {
    setSelectedTypes(prev => {
      if (prev[typeId]) {
        const next = { ...prev };
        delete next[typeId];
        return next;
      }
      return { ...prev, [typeId]: 1 };
    });
  };

  const updateQuantity = (typeId, qty) => {
    if (qty <= 0) {
      setSelectedTypes(prev => {
        const next = { ...prev };
        delete next[typeId];
        return next;
      });
    } else {
      setSelectedTypes(prev => ({ ...prev, [typeId]: Number(qty) }));
    }
  };

  const totalDeliverables = Object.values(selectedTypes).reduce((s, q) => s + q, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(selectedTypes).length === 0) {
      setError('Please select at least one content type');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setError('');
    setSubmitting(true);
    setShowConfirm(false);
    try {
      // Build content_types array and summary
      const contentTypesArr = Object.entries(selectedTypes).map(([id, qty]) => {
        const ct = CONTENT_TYPES.find(t => t.id === id);
        return { id, label: ct?.label || id, quantity: qty, platform: ct?.platform || 'General' };
      });
      const contentTypeSummary = contentTypesArr.map(ct => `${ct.quantity}x ${ct.label}`).join(', ');

      await api.post('/api/brand/collaboration/send-request', {
        ...formData,
        content_type: contentTypeSummary,
        content_types: contentTypesArr,
        number_of_posts: totalDeliverables,
      });
      navigate('/brand/requests');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error sending request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!creatorFromState) return null;

  return (
    <div className="min-h-screen bg-[#F4F6FB] p-6 lg:p-10">
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Request</h3>
            <p className="text-sm text-slate-500 mb-5">You are about to send a collaboration request to <strong>{creator.name}</strong>.</p>
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Campaign</span><span className="font-semibold">{formData.campaign_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="font-bold text-[#7C3AED]">{formatINR(formData.budget_offer)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Platform Fee</span><span>{formatINR(fees.fee)}</span></div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between font-bold"><span>Total to Escrow</span><span className="text-[#7C3AED]">{formatINR(fees.total)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Deliverables</span><span>{totalDeliverables} items</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmSubmit} disabled={submitting} className="flex-1 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl transition-all disabled:opacity-60">
                {submitting ? 'Sending...' : 'Confirm & Send'}
              </button>
              <button onClick={() => setShowConfirm(false)} className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Send Collaboration Request</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Sending to:
            <span className="text-[#7C3AED] font-semibold flex items-center gap-1">
              {creator.name}
              {creator.is_verified && <img src={verificationBadge} alt="Verified" className="w-4 h-4" />}
            </span>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Form */}
        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Campaign Brief</h2>
            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>}

            {/* Name & Goal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormGroup label="Campaign Name">
                <input name="campaign_name" value={formData.campaign_name} onChange={handleChange} required placeholder="e.g. Summer Glow Campaign" className="form-input" />
              </FormGroup>
              <FormGroup label="Campaign Goal">
                <select name="campaign_goal" value={formData.campaign_goal} onChange={handleChange} className="form-input">
                  {['Sales / Conversions', 'Brand Awareness', 'Engagement', 'Lead Generation', 'App Downloads', 'Website Traffic'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </FormGroup>
            </div>

            {/* Brief */}
            <FormGroup label="Campaign Brief">
              <textarea name="campaign_brief" value={formData.campaign_brief} onChange={handleChange} required rows={4} placeholder="Describe requirements, tone, hashtags, dos/don'ts..." className="form-input py-3 resize-none min-h-[100px]" />
            </FormGroup>

            {/* Platform */}
            <FormGroup label="Primary Platform">
              <select name="platform" value={formData.platform} onChange={handleChange} className="form-input">
                {['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Multiple'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormGroup>

            {/* Content Types - Multi-select with checkboxes */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-3 block">Content Deliverables *</label>
              <p className="text-[11px] text-slate-400 mb-3">Select all content types you need and specify quantities</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {CONTENT_TYPES.map(ct => {
                  const isSelected = !!selectedTypes[ct.id];
                  const Icon = ct.icon;
                  return (
                    <div
                      key={ct.id}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#7C3AED] bg-purple-50/50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                      onClick={() => toggleContentType(ct.id)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-[#7C3AED]' : 'text-slate-700'}`}>{ct.label}</p>
                        <p className="text-[10px] text-slate-400">{ct.platform}</p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button type="button" onClick={() => updateQuantity(ct.id, (selectedTypes[ct.id] || 1) - 1)} className="w-6 h-6 rounded bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center hover:bg-purple-200">−</button>
                          <span className="w-6 text-center text-xs font-bold text-[#7C3AED]">{selectedTypes[ct.id]}</span>
                          <button type="button" onClick={() => updateQuantity(ct.id, (selectedTypes[ct.id] || 1) + 1)} className="w-6 h-6 rounded bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center hover:bg-purple-200">+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {Object.keys(selectedTypes).length > 0 && (
                <p className="text-[11px] text-[#7C3AED] font-semibold mt-2">
                  {totalDeliverables} deliverable{totalDeliverables !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormGroup label="Start Date">
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="form-input" />
              </FormGroup>
              <FormGroup label="End Date">
                <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className="form-input" />
              </FormGroup>
              <FormGroup label="Respond By">
                <input type="date" name="respond_by" value={formData.respond_by} onChange={handleChange} required className="form-input" />
              </FormGroup>
            </div>

            {/* Budget & Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FormGroup label="Budget Offer (₹)">
                  <input type="number" name="budget_offer" value={formData.budget_offer} onChange={handleChange} required min="1" placeholder="e.g. 15000" className="form-input" />
                </FormGroup>
                <p className="text-[11px] text-slate-400 mt-1 ml-1">Funds move to escrow upon acceptance</p>
              </div>
              <FormGroup label="Tracking Link (Optional)">
                <input name="tracking_link" value={formData.tracking_link} onChange={handleChange} placeholder="https://..." className="form-input" />
              </FormGroup>
            </div>

            {/* Deliverables Description */}
            <FormGroup label="Additional Requirements / Notes">
              <textarea name="deliverables_required" value={formData.deliverables_required} onChange={handleChange} rows={3} placeholder="Any special instructions, brand guidelines, hashtags to include, etc." className="form-input py-3 resize-none min-h-[80px]" />
            </FormGroup>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-purple-200 disabled:opacity-60">
                <Send className="w-4 h-4" /> Review & Send Request
              </button>
              <button type="button" onClick={() => navigate(-1)} className="bg-slate-100 text-slate-600 font-semibold py-3 px-6 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[360px] space-y-5 shrink-0">
          {/* Creator Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Creator Profile</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-14 h-14 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {creator.profile_photo ? (
                  <img src={creator.profile_photo} alt={creator.name} className="w-full h-full rounded-2xl object-cover" />
                ) : getInitials(creator.name)}
                {creator.is_verified && (
                  <img src={verificationBadge} alt="Verified" className="absolute -bottom-1 -right-1 w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{creator.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {creator.display_name ? `@${creator.display_name}` : ''}
                  {creator.location ? ` · ${creator.location}` : ''}
                </p>
              </div>
            </div>

            {instagram && (
              <div className="mb-4 p-4 rounded-xl bg-pink-50 border border-pink-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white bg-gradient-to-br from-pink-500 to-purple-600 px-2 py-0.5 rounded">IG</span>
                  <span className="text-xs font-bold text-pink-700">Instagram</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-sm font-bold text-slate-900">{formatCount(Number(instagram.followers_count || 0))}</p><p className="text-[10px] text-slate-400">Followers</p></div>
                  <div><p className="text-sm font-bold text-emerald-600">{Number(instagram.engagement_rate || 0).toFixed(1)}%</p><p className="text-[10px] text-slate-400">Eng. Rate</p></div>
                  <div><p className="text-sm font-bold text-slate-900">{formatCount(Number(instagram.avg_views || 0))}</p><p className="text-[10px] text-slate-400">Avg Views</p></div>
                </div>
              </div>
            )}

            {youtube && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded">YT</span>
                  <span className="text-xs font-bold text-red-700">YouTube</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-sm font-bold text-slate-900">{formatCount(Number(youtube.followers_count || 0))}</p><p className="text-[10px] text-slate-400">Subscribers</p></div>
                  <div><p className="text-sm font-bold text-emerald-600">{Number(youtube.engagement_rate || 0).toFixed(1)}%</p><p className="text-[10px] text-slate-400">Eng. Rate</p></div>
                  <div><p className="text-sm font-bold text-slate-900">{formatCount(Number(youtube.avg_views || 0))}</p><p className="text-[10px] text-slate-400">Avg Views</p></div>
                </div>
              </div>
            )}

            {!instagram && !youtube && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MiniStat label="Followers" value={formatCount(Number(creatorFromState?.top_platform_stats?.followers_count || 0))} />
                <MiniStat label="Eng. Rate" value={`${Number(creatorFromState?.top_platform_stats?.engagement_rate || 0).toFixed(1)}%`} />
              </div>
            )}

            {categories.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Niches</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.slice(0, 4).map((cat, i) => (
                    <span key={i} className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] rounded-lg text-[10px] font-semibold">{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Budget Summary</h2>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Budget Offer</span><span className="font-semibold text-[#7C3AED]">{formData.budget_offer ? formatINR(formData.budget_offer) : '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Platform Fee (8%)</span><span className="font-semibold text-slate-900">{fees.fee ? formatINR(fees.fee) : '—'}</span></div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between"><span className="text-sm font-bold text-slate-900">Total to Escrow</span><span className="text-base font-bold text-[#7C3AED]">{fees.total ? formatINR(fees.total) : '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total Deliverables</span><span className="font-semibold text-slate-900">{totalDeliverables || '—'}</span></div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl flex gap-2.5 border border-purple-100">
              <Info className="w-4 h-4 text-[#7C3AED] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Funds held in escrow until brand approves the posted content. Creator receives payment automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-input { width: 100%; height: 44px; padding: 0 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; font-size: 14px; font-weight: 500; color: #0F172A; outline: none; transition: all 0.15s; }
        .form-input:focus { background: white; border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
        .form-input::placeholder { color: #94A3B8; }
        textarea.form-input { height: auto; }
        select.form-input { cursor: pointer; }
      ` }} />
    </div>
  );
};

const FormGroup = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500">{label}</label>
    {children}
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-900">{value}</p>
  </div>
);

export default SendRequest;
