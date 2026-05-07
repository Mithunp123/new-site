import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Upload, Download, X } from 'lucide-react';
import { getMyCampaigns, uploadContent } from '../api/creatorApi';
import Badge from '../components/ui/Badge';
import ProgressStepper from '../components/ui/ProgressStepper';
import { useCampaignSocket } from '../hooks/useCampaignSocket';

const pct = (step) => Math.round(((step + 1) / 9) * 100);

export default function MyCampaignsPage() {
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadUrl, setUploadUrl]     = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myCampaigns'],
    queryFn: () => getMyCampaigns({}).then(r => r.data.data),
  });

  const uploadMut = useMutation({
    mutationFn: ({ id, url }) => uploadContent(id, { content_url: url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      setUploadingId(null);
      setUploadUrl('');
    },
  });

  const campaigns  = data?.campaigns || [];
  const campaignIds = campaigns.map(c => c.campaign_id || c.id).filter(Boolean);
  useCampaignSocket(campaignIds);

  const safeBrand       = (c) => c.brand_name || c.brand || '—';
  const safeDeliverable = (c) => c.deliverable || c.content_type || '—';
  const safeAmount      = (c) => Number(c.campaign_amount ?? c.amount ?? 0).toLocaleString('en-IN');
  const safeEscrow      = (c) => c.escrow_status || c.escrow || 'pending';
  const safeStep        = (c) => c.progress_step ?? c.current_step ?? 0;
  const canUpload       = (c) => {
    const step = safeStep(c);
    return step === 2 || c.status === 'agreement_locked' || c.status === 'escrow_locked';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const d        = data || {};
  const featured = campaigns[0] || null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Campaigns</h1>
          <p className="page-subtitle">All your active, completed, and upcoming collaborations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-blue">{d.active_count ?? 0} Active</span>
          <span className="badge badge-gray">{d.completed_count ?? 0} Completed</span>
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="card p-16 text-center border-dashed">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-base font-semibold text-slate-700">No active campaigns yet</p>
          <p className="text-sm text-slate-400 mt-1">Once you accept a collaboration request, your campaigns will appear here.</p>
        </div>
      )}

      {/* Featured Campaign */}
      {featured && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-[#2563EB] text-sm">
                {safeBrand(featured)?.[0]?.toUpperCase() || 'B'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{safeBrand(featured)} — {featured.title}</p>
                <p className="text-sm text-slate-400">{safeDeliverable(featured)}</p>
              </div>
            </div>
            <Badge status={featured.status} />
          </div>

          <ProgressStepper currentStep={safeStep(featured)} />

          {/* Upload */}
          {canUpload(featured) && (
            <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload size={15} className="text-[#2563EB]" />
                <span className="text-sm font-semibold text-blue-800">Escrow Locked — Upload Your Content</span>
              </div>
              {uploadingId === featured.campaign_id ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste your content URL (YouTube, Instagram, etc.)"
                    value={uploadUrl}
                    onChange={e => setUploadUrl(e.target.value)}
                    className="input flex-1"
                  />
                  <button
                    onClick={() => uploadMut.mutate({ id: featured.campaign_id, url: uploadUrl })}
                    disabled={!uploadUrl || uploadMut.isPending}
                    className="btn-primary"
                  >
                    {uploadMut.isPending ? 'Uploading...' : 'Submit'}
                  </button>
                  <button onClick={() => setUploadingId(null)} className="btn-ghost">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setUploadingId(featured.campaign_id)} className="btn-primary">
                  Upload Content Link
                </button>
              )}
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100">
            {[
              { label: 'Brand',           value: safeBrand(featured) },
              { label: 'Deliverable',     value: safeDeliverable(featured) },
              { label: 'Amount',          value: `₹${safeAmount(featured)}` },
              { label: 'Escrow',          value: safeEscrow(featured).charAt(0).toUpperCase() + safeEscrow(featured).slice(1) },
              { label: 'Deadline',        value: featured.deadline ? new Date(featured.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Campaigns Table */}
      {campaigns.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="section-title">All Campaigns</h2>
            <button className="btn-ghost text-sm">
              <Download size={14} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Brand', 'Campaign', 'Deliverable', 'Amount', 'Escrow', 'Progress', 'Status', 'Action'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const step = safeStep(c);
                  return (
                    <motion.tr key={c.campaign_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-[#2563EB]">
                            {safeBrand(c)?.[0]?.toUpperCase() || 'B'}
                          </div>
                          <span className="font-medium text-slate-700">{safeBrand(c)}</span>
                        </div>
                      </td>
                      <td className="text-slate-600">{c.title || '—'}</td>
                      <td className="text-slate-500">{safeDeliverable(c)}</td>
                      <td className="font-semibold text-slate-900">₹{safeAmount(c)}</td>
                      <td><Badge status={safeEscrow(c)} /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${pct(step)}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{pct(step)}%</span>
                        </div>
                      </td>
                      <td><Badge status={c.status} /></td>
                      <td>
                        {canUpload(c) && (
                          <button onClick={() => setUploadingId(c.campaign_id)} className="text-xs text-[#2563EB] font-medium hover:underline flex items-center gap-1">
                            <Upload size={12} /> Upload
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inline upload for table rows */}
          {uploadingId && uploadingId !== featured?.campaign_id && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm font-semibold text-blue-800 mb-2">Upload content link</p>
              <div className="flex gap-2">
                <input type="url" placeholder="Paste your content URL" value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} className="input flex-1" />
                <button onClick={() => uploadMut.mutate({ id: uploadingId, url: uploadUrl })} disabled={!uploadUrl || uploadMut.isPending} className="btn-primary">
                  {uploadMut.isPending ? 'Uploading...' : 'Submit'}
                </button>
                <button onClick={() => { setUploadingId(null); setUploadUrl(''); }} className="btn-ghost"><X size={15} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
