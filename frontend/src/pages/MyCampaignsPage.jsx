import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Upload, Download, X } from 'lucide-react';
import { getMyCampaigns, uploadMultiContent, getSocialProfiles } from '../api/creatorApi';
import useAuthStore from '../store/authStore';
import Badge from '../components/ui/Badge';
import ProgressStepper from '../components/ui/ProgressStepper';
import LottieIcon from '../components/ui/LottieIcon';
import { useCampaignSocket } from '../hooks/useCampaignSocket';

// Progress % based on 7 steps
const pct = (status) => {
  const map = {
    'request_sent':        Math.round((1 / 7) * 100),
    'negotiating':         Math.round((1 / 7) * 100),
    'creator_accepted':    Math.round((2 / 7) * 100),
    'agreement_locked':    Math.round((3 / 7) * 100),
    'content_uploaded':    Math.round((4 / 7) * 100),
    'revision_requested':  Math.round((4 / 7) * 100),
    'brand_approved':      Math.round((5 / 7) * 100),
    'posted_live':         Math.round((6 / 7) * 100),
    'analytics_collected': Math.round((6 / 7) * 100),
    'escrow_released':     Math.round((6 / 7) * 100),
    'campaign_closed':     100,
  };
  return map[status] ?? 0;
};

export default function MyCampaignsPage() {
  const [uploadingId, setUploadingId]   = useState(null);
  const [platformUrls, setPlatformUrls] = useState({});
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ['myCampaigns', userId],
    queryFn: () => getMyCampaigns({}).then(r => r.data.data),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch creator's social profiles to know which platforms to show upload fields for
  const { data: socialProfiles } = useQuery({
    queryKey: ['socialProfiles', userId],
    queryFn: () => getSocialProfiles().then(r => r.data.data),
    enabled: !!userId,
    staleTime: 60000,
  });

  const connectedPlatforms = [
    ...(socialProfiles?.profiles || []).map(p => p.platform),
    socialProfiles?.accounts ? 'instagram' : null
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const uploadMut = useMutation({
    mutationFn: ({ id, urls }) => {
      const submissions = Object.entries(urls)
        .filter(([, url]) => url && url.trim())
        .map(([platform, content_url]) => ({ platform, content_url: content_url.trim() }));
      return uploadMultiContent(id, submissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      setUploadingId(null);
      setPlatformUrls({});
    },
  });

  const campaigns   = data?.campaigns || [];
  const campaignIds = campaigns.map(c => c.campaign_id || c.id).filter(Boolean);
  useCampaignSocket(campaignIds);

  const featured = campaigns[0] || null;

  const safeBrand       = (c) => c.brand_name || c.brand || '—';
  const safeDeliverable = (c) => c.deliverable || c.content_type || '—';
  const safeAmount      = (c) => Number(c.campaign_amount ?? c.amount ?? 0).toLocaleString('en-IN');
  const safeEscrow      = (c) => c.escrow_status || c.escrow || 'pending';

  // Can upload only when escrow is locked, or when brand requested a revision
  const canUpload = (c) =>
    c.status === 'agreement_locked' ||
    c.status === 'escrow_locked' ||
    c.status === 'revision_requested';

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const d = data || {};

  // Upload section — shows one input per connected platform
  const UploadSection = ({ campaignId }) => {
    const platforms = connectedPlatforms.length > 0 ? connectedPlatforms : ['youtube'];
    const hasAnyUrl = platforms.some(p => platformUrls[p]?.trim());

    return (
      <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload size={15} className="text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">Upload Your Content Links</span>
        </div>
        <div className="space-y-3 mb-3">
          {platforms.map(platform => (
            <div key={platform}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                {platform.charAt(0).toUpperCase() + platform.slice(1)} URL
              </label>
              <input
                type="url"
                placeholder={`Paste your ${platform} content URL`}
                value={platformUrls[platform] || ''}
                onChange={e => setPlatformUrls(prev => ({ ...prev, [platform]: e.target.value }))}
                className="input w-full"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => uploadMut.mutate({ id: campaignId, urls: platformUrls })}
            disabled={!hasAnyUrl || uploadMut.isPending}
            className="btn-primary"
          >
            {uploadMut.isPending ? 'Uploading...' : 'Submit Content'}
          </button>
          <button onClick={() => { setUploadingId(null); setPlatformUrls({}); }} className="btn-ghost">
            <X size={15} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Campaigns</h1>
          <p className="page-subtitle">All your active and upcoming collaborations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-blue">{d.active_count ?? 0} Active</span>
          <span className="badge badge-gray">{d.completed_count ?? 0} Completed</span>
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="card p-16 text-center border-dashed">
          <div className="flex justify-center mb-4">
            <LottieIcon name="target" size={36} />
          </div>
          <p className="text-base font-semibold text-slate-700">No active campaigns yet</p>
          <p className="text-sm text-slate-400 mt-1">Once you accept a collaboration request, your campaigns will appear here.</p>
        </div>
      )}

      {/* Featured Campaign */}
      {featured && (
        <div className="card p-6">
          {/* Campaign header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-sm">
                {safeBrand(featured)?.[0]?.toUpperCase() || 'B'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{safeBrand(featured)} — {featured.title}</p>
                <p className="text-sm text-slate-400">{safeDeliverable(featured)}</p>
              </div>
            </div>
            <Badge status={featured.status} />
          </div>

          {/* 7-step progress stepper — pass status directly */}
          {featured.status !== 'campaign_closed' && <ProgressStepper status={featured.status} />}

          {/* Upload content — only when escrow is locked or revision requested */}
          {canUpload(featured) && (
            uploadingId === (featured.campaign_id || featured.id)
              ? <UploadSection campaignId={featured.campaign_id || featured.id} />
              : (
                <div className="mt-5 space-y-3">
                  {/* Revision note banner — shown when brand requested corrections */}
                  {featured.status === 'revision_requested' && featured.brand_rejection_reason && (
                    <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-start gap-3">
                      <span className="text-orange-500 mt-0.5 flex-shrink-0">⚠</span>
                      <div>
                        <p className="text-sm font-semibold text-orange-800 mb-0.5">Brand requested corrections</p>
                        <p className="text-sm text-orange-700">{featured.brand_rejection_reason}</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setUploadingId(featured.campaign_id || featured.id)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Upload size={15} />
                    {featured.status === 'revision_requested' ? 'Re-upload Content' : 'Upload Content Links'}
                  </button>
                </div>
              )
          )}

          {/* Status info for non-upload states */}
          {!canUpload(featured) && featured.status !== 'campaign_closed' && (
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              <p className="text-sm text-slate-500">
                {featured.status === 'request_sent' || featured.status === 'negotiating'
                  ? 'Waiting for negotiation to complete and escrow to be locked.'
                  : featured.status === 'creator_accepted'
                  ? 'Waiting for brand to lock escrow before you can upload content.'
                  : featured.status === 'content_uploaded'
                  ? 'Content submitted. Waiting for brand review.'
                  : featured.status === 'brand_approved' || featured.status === 'posted_live'
                  ? 'Content approved and live! Payment will be released automatically.'
                  : featured.status === 'analytics_collected' || featured.status === 'escrow_released'
                  ? 'Payment released. Campaign closing.'
                  : ''}
              </p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100">
            {[
              { label: 'Brand',       value: safeBrand(featured) },
              { label: 'Deliverable', value: safeDeliverable(featured) },
              { label: 'Amount',      value: `₹${safeAmount(featured)}` },
              { label: 'Escrow',      value: safeEscrow(featured).charAt(0).toUpperCase() + safeEscrow(featured).slice(1) },
              { label: 'Deadline',    value: featured.deadline ? new Date(featured.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
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
            <button className="btn-ghost text-sm"><Download size={14} /> Export</button>
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
                  const cId = c.campaign_id || c.id;
                  return (
                    <motion.tr key={cId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
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
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct(c.status)}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{pct(c.status)}%</span>
                        </div>
                      </td>
                      <td><Badge status={c.status} /></td>
                      <td>
                        {canUpload(c) && (
                          <button
                            onClick={() => setUploadingId(cId)}
                            className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                          >
                            <Upload size={12} />
                            {c.status === 'revision_requested' ? 'Re-upload' : 'Upload'}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inline upload for table rows (non-featured) */}
          {uploadingId && uploadingId !== (featured?.campaign_id || featured?.id) && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm font-semibold text-blue-800 mb-3">Upload content links</p>
              <div className="space-y-2 mb-3">
                {(connectedPlatforms.length > 0 ? connectedPlatforms : ['youtube']).map(platform => (
                  <div key={platform}>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)} URL
                    </label>
                    <input
                      type="url"
                      placeholder={`Paste your ${platform} content URL`}
                      value={platformUrls[platform] || ''}
                      onChange={e => setPlatformUrls(prev => ({ ...prev, [platform]: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => uploadMut.mutate({ id: uploadingId, urls: platformUrls })}
                  disabled={uploadMut.isPending}
                  className="btn-primary"
                >
                  {uploadMut.isPending ? 'Uploading...' : 'Submit'}
                </button>
                <button onClick={() => { setUploadingId(null); setPlatformUrls({}); }} className="btn-ghost">
                  <X size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
