import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getMyCampaigns, uploadContent } from '../api/creatorApi';
import Badge from '../components/ui/Badge';
import ProgressStepper from '../components/ui/ProgressStepper';
import { useCampaignSocket } from '../hooks/useCampaignSocket';

export default function MyCampaignsPage() {
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myCampaigns'],
    queryFn: () => getMyCampaigns({}).then(r => r.data.data)
  });

  const uploadMut = useMutation({
    mutationFn: ({ id, url }) => uploadContent(id, { content_url: url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      setUploadingId(null);
      setUploadUrl('');
    }
  });

  // Derive campaign IDs for WebSocket — safe before data loads (empty array = no-op)
  const campaigns = data?.campaigns || [];
  const campaignIds = campaigns.map(c => c.campaign_id || c.id).filter(Boolean);
  useCampaignSocket(campaignIds);

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-white rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-white rounded-2xl animate-pulse"></div>
      </motion.div>
    );
  }

  const d = data || {};
  const featured = campaigns.length > 0 ? campaigns[0] : null;

  const progressPct = (step) => Math.round(((step + 1) / 9) * 100);

  // Safe field helpers
  const safeAmount = (c) => {
    const val = c.campaign_amount ?? c.amount ?? c.offer_amount ?? 0;
    return Number(val).toLocaleString('en-IN');
  };
  const safeBrand = (c) => c.brand_name || c.brand || '—';
  const safeDeliverable = (c) => c.deliverable || c.content_type || '—';
  const safeEscrow = (c) => c.escrow_status || c.escrow || 'pending';
  const safeStep = (c) => c.progress_step ?? c.current_step ?? 0;

  // Determine if creator can upload content (escrow must be locked)
  const canUpload = (c) => {
    const step = safeStep(c);
    const status = c.status;
    return step === 2 || status === 'agreement_locked' || status === 'escrow_locked';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">My Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">All your active, completed, and upcoming collaborations</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{d.active_count ?? 0} Active</span>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">{d.completed_count ?? 0} Completed</span>
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No active campaigns yet</h3>
          <p className="text-slate-500 text-sm">Once you accept a collaboration request, your campaigns will appear here.</p>
        </div>
      )}

      {/* Featured Campaign Progress */}
      {featured && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 font-heading">
                {safeBrand(featured)?.[0]?.toUpperCase() || 'B'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-heading">{safeBrand(featured)} — {featured.title}</h3>
                <p className="text-xs text-slate-500">{safeDeliverable(featured)}</p>
              </div>
            </div>
            <Badge status={featured.status} />
          </div>

          <ProgressStepper currentStep={safeStep(featured)} />

          {/* Upload Content Action — shown when escrow is locked */}
          {canUpload(featured) && (
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-blue-800">Escrow Locked — Upload Your Content</span>
              </div>
              {uploadingId === featured.campaign_id ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste your content URL (YouTube, Instagram, etc.)"
                    value={uploadUrl}
                    onChange={e => setUploadUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    onClick={() => uploadMut.mutate({ id: featured.campaign_id, url: uploadUrl })}
                    disabled={!uploadUrl || uploadMut.isPending}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadMut.isPending ? 'Uploading...' : 'Submit'}
                  </button>
                  <button onClick={() => setUploadingId(null)} className="px-3 py-2 text-slate-500 text-sm">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setUploadingId(featured.campaign_id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                >
                  Upload Content Link
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100">
            {[
              { label: 'Brand', value: safeBrand(featured) },
              { label: 'Deliverable', value: safeDeliverable(featured) },
              { label: 'Campaign Amount', value: `₹${safeAmount(featured)}` },
              { label: 'Escrow Status', value: (() => { const s = safeEscrow(featured); return s.charAt(0).toUpperCase() + s.slice(1); })() },
              { label: 'Deadline', value: featured.deadline ? new Date(featured.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-slate-800 font-heading">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Campaigns Table */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-base font-bold font-heading text-slate-900">All Campaigns</h2>
            <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              <Download size={14} /> Export
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                {['Brand', 'Campaign', 'Deliverable', 'Amount', 'Escrow', 'Progress', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => {
                const step = safeStep(c);
                return (
                  <motion.tr key={c.campaign_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
                          {safeBrand(c)?.[0]?.toUpperCase() || 'B'}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{safeBrand(c)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{c.title || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{safeDeliverable(c)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 font-heading">₹{safeAmount(c)}</td>
                    <td className="px-5 py-3.5"><Badge status={safeEscrow(c)} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPct(step)}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{progressPct(step)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Badge status={c.status} /></td>
                    <td className="px-5 py-3.5">
                      {canUpload(c) && (
                        <button
                          onClick={() => setUploadingId(c.campaign_id)}
                          className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Upload size={12} /> Upload
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {/* Inline upload form for table rows */}
          {uploadingId && uploadingId !== featured?.campaign_id && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm font-bold text-blue-800 mb-2">Upload content for campaign</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste your content URL"
                  value={uploadUrl}
                  onChange={e => setUploadUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  onClick={() => uploadMut.mutate({ id: uploadingId, url: uploadUrl })}
                  disabled={!uploadUrl || uploadMut.isPending}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadMut.isPending ? 'Uploading...' : 'Submit'}
                </button>
                <button onClick={() => { setUploadingId(null); setUploadUrl(''); }} className="px-3 py-2 text-slate-500 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
