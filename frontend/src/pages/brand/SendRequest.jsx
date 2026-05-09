import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Send, Info, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { formatINR, formatCount, getInitials } from '../../utils/format';

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
    content_type: 'Reel (60-90s)',
    number_of_posts: '1',
    start_date: '',
    end_date: '',
    respond_by: '',
    budget_offer: '',
    tracking_link: '',
    deliverables_required: '',
  });

  const [fees, setFees] = useState({ fee: 0, total: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch full creator profile from API
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
    : (typeof nicheDetails.worked_with_brands === 'string'
        ? JSON.parse(nicheDetails.worked_with_brands || '[]')
        : []);
  const categories = Array.isArray(nicheDetails.categories)
    ? nicheDetails.categories
    : (typeof nicheDetails.categories === 'string'
        ? JSON.parse(nicheDetails.categories || '[]')
        : (creatorFromState?.categories || []));

  const instagram = socialProfiles.find(p => p.platform === 'instagram');
  const youtube   = socialProfiles.find(p => p.platform === 'youtube');

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
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/brand/collaboration/send-request', formData);
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
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Send Collaboration Request</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Sending to:
            <span className="text-[#7C3AED] font-semibold">{creator.name}</span>
            {instagram && (
              <>
                <span className="text-slate-300">·</span>
                <span>{formatCount(Number(instagram.followers_count || 0))} IG followers</span>
              </>
            )}
            {youtube && (
              <>
                <span className="text-slate-300">·</span>
                <span>{formatCount(Number(youtube.followers_count || 0))} YT subscribers</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Main Form */}
        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Campaign Brief</h2>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
            )}

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
              <textarea name="campaign_brief" value={formData.campaign_brief} onChange={handleChange} required rows={4} placeholder="Describe your requirements, tone, hashtags, etc." className="form-input py-3 resize-none min-h-[100px]" />
            </FormGroup>

            {/* Platform & Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormGroup label="Platform">
                <select name="platform" value={formData.platform} onChange={handleChange} className="form-input">
                  {['Instagram', 'YouTube', 'TikTok', 'Twitter'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Content Type">
                <select name="content_type" value={formData.content_type} onChange={handleChange} className="form-input">
                  {['Reel (60-90s)', 'Reel (30s)', 'Post', 'Story', 'YouTube Short', 'YouTube Long'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormGroup>
            </div>

            {/* Posts & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormGroup label="Number of Posts">
                <input name="number_of_posts" value={formData.number_of_posts} onChange={handleChange} required placeholder="e.g. 1" className="form-input" />
              </FormGroup>
              <FormGroup label="Start Date">
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="form-input" />
              </FormGroup>
              <FormGroup label="End Date">
                <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className="form-input" />
              </FormGroup>
            </div>

            {/* Respond By */}
            <FormGroup label="Respond By (deadline for creator to accept)">
              <input type="date" name="respond_by" value={formData.respond_by} onChange={handleChange} required className="form-input" />
            </FormGroup>

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

            {/* Deliverables */}
            <FormGroup label="Deliverables Required">
              <textarea name="deliverables_required" value={formData.deliverables_required} onChange={handleChange} required rows={4} placeholder="List what you need: e.g. 1 Reel, 2 Stories, tracking link in bio for 30 days" className="form-input py-3 resize-none min-h-[100px]" />
            </FormGroup>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-purple-200 disabled:opacity-60">
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Collaboration Request
              </button>
              <button type="button" onClick={() => navigate(-1)} className="bg-slate-100 text-slate-600 font-semibold py-3 px-6 rounded-xl hover:bg-slate-200 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[360px] space-y-5 shrink-0">

          {/* Creator Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Creator Profile</h2>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {creator.profile_photo ? (
                  <img src={creator.profile_photo} alt={creator.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  getInitials(creator.name)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{creator.name}</h3>
                  {creator.is_verified && (
                    <CheckCircle2 size={14} className="text-[#7C3AED]" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {creator.display_name ? `@${creator.display_name}` : ''}
                  {creator.location ? ` · ${creator.location}` : ''}
                </p>
              </div>
            </div>

            {/* Instagram stats */}
            {instagram && (
              <div className="mb-4 p-4 rounded-xl bg-pink-50 border border-pink-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white bg-gradient-to-br from-pink-500 to-purple-600 px-2 py-0.5 rounded">IG</span>
                  <span className="text-xs font-bold text-pink-700">Instagram</span>
                  {instagram.profile_url && (
                    <a href={instagram.profile_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-pink-500 hover:underline">View Profile</a>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatCount(Number(instagram.followers_count || 0))}</p>
                    <p className="text-[10px] text-slate-400">Followers</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600">{Number(instagram.engagement_rate || 0).toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400">Eng. Rate</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatCount(Number(instagram.avg_views || 0))}</p>
                    <p className="text-[10px] text-slate-400">Avg Views</p>
                  </div>
                </div>
              </div>
            )}

            {/* YouTube stats */}
            {youtube && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded">YT</span>
                  <span className="text-xs font-bold text-red-700">YouTube</span>
                  {youtube.profile_url && (
                    <a href={youtube.profile_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-red-500 hover:underline">View Channel</a>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatCount(Number(youtube.followers_count || 0))}</p>
                    <p className="text-[10px] text-slate-400">Subscribers</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600">{Number(youtube.engagement_rate || 0).toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400">Eng. Rate</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatCount(Number(youtube.avg_views || 0))}</p>
                    <p className="text-[10px] text-slate-400">Avg Views</p>
                  </div>
                </div>
              </div>
            )}

            {/* If no social profiles loaded yet, show from state */}
            {!instagram && !youtube && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MiniStat label="Followers" value={formatCount(Number(creatorFromState?.top_platform_stats?.followers_count || 0))} />
                <MiniStat label="Eng. Rate" value={`${Number(creatorFromState?.top_platform_stats?.engagement_rate || 0).toFixed(1)}%`} />
              </div>
            )}

            {/* Niches */}
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

            {/* Past brands */}
            {workedWithBrands.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Past Brands</p>
                <div className="flex flex-wrap gap-1.5">
                  {workedWithBrands.slice(0, 5).map((brand, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-semibold">{brand}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Budget Summary</h2>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Budget Offer</span>
                <span className="font-semibold text-[#7C3AED]">{formData.budget_offer ? formatINR(formData.budget_offer) : '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Platform Fee (8%)</span>
                <span className="font-semibold text-slate-900">{fees.fee ? formatINR(fees.fee) : '—'}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-slate-900">Total to Escrow</span>
                <span className="text-base font-bold text-[#7C3AED]">{fees.total ? formatINR(fees.total) : '—'}</span>
              </div>
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
        .form-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #0F172A;
          outline: none;
          transition: all 0.15s;
        }
        .form-input:focus {
          background: white;
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
        }
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
