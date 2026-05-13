import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLiveMetrics } from '../../api/brandApi';
import {
  ExternalLink, AlertTriangle, Eye, ThumbsUp, MessageCircle,
  Share2, Bookmark, Clock, TrendingUp, BarChart2,
  Calendar, User, Film, MousePointer, Tv, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCount, formatINR } from '../../utils/format';
import useAuthStore from '../../store/authStore';
import instagramGif from '../../assets/instagram icon.gif';
import youtubeGif from '../../assets/Youtube Logo Effect.gif';

/* ─── Premium Light Background ────────────────────────────────────────────── */
function LightBackground() {
  return (
    <>
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none transform -translate-x-1/2 translate-y-1/2" />
    </>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */
export default function BrandMetrics() {
  const userId = useAuthStore(state => state.user?.id);

  const { data: metrics, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['brand-live-metrics', userId],
    queryFn: () => getLiveMetrics().then(r => r.data.data),
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-8 w-48 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-16 text-center border-dashed">
        <BarChart2 size={36} className="text-slate-200 mx-auto mb-4" />
        <p className="text-base font-semibold text-slate-700">Failed to load metrics</p>
        <p className="text-sm text-slate-400 mt-1 mb-4">Check your API keys or try again.</p>
        <button onClick={() => refetch()} className="btn-primary mx-auto">Retry</button>
      </div>
    );
  }

  // Flatten: one card per submission (not per campaign)
  const cards = [];
  (metrics || []).forEach(camp => {
    if (camp.submissions && camp.submissions.length > 0) {
      camp.submissions.forEach(sub => {
        cards.push({ camp, sub });
      });
    } else {
      // Campaign has no submissions yet — show a placeholder card
      cards.push({ camp, sub: null });
    }
  });

  // Separate campaigns with submissions from those without
  const activeCards = cards.filter(c => c.sub !== null);
  const pendingCards = cards.filter(c => c.sub === null);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Metrics</h1>
          <p className="page-subtitle">Live performance data for your campaigns</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="card p-16 text-center border-dashed">
          <BarChart2 size={36} className="text-slate-200 mx-auto mb-4" />
          <p className="text-base font-semibold text-slate-700">No metrics yet</p>
          <p className="text-sm text-slate-400 mt-1">Metrics appear after a creator submits content for a campaign.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active metric cards — campaigns with content submissions */}
          {activeCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeCards.map(({ camp, sub }, i) => (
                <MetricCard key={`${camp.campaign_id}-${i}`} camp={camp} sub={sub} index={i} />
              ))}
            </div>
          )}

          {/* Pending campaigns — content not yet submitted */}
          {pendingCards.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Awaiting Content</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {pendingCards.map(({ camp }, i) => (
                  <PendingCard key={`pending-${camp.campaign_id}`} camp={camp} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Pending campaign card (no submissions yet) ───────────────────────────── */
function PendingCard({ camp, index }) {
  const statusLabel = {
    content_uploaded:   'In Review',
    revision_requested: 'Revision Requested',
    brand_approved:     'Approved',
  }[camp.status] || camp.status;

  const statusColor = {
    content_uploaded:   'bg-amber-50 text-amber-700 border-amber-200/60',
    revision_requested: 'bg-red-50 text-red-700 border-red-200/60',
    brand_approved:     'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  }[camp.status] || 'bg-slate-50 text-slate-600 border-slate-200/60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="relative rounded-[20px] overflow-hidden border border-[#7C3AED]/40 bg-white transition-all duration-300 hover:border-[#7C3AED] hover:bg-purple-50 hover:shadow-[0_8px_32px_rgba(124,58,237,0.15)] group"
      style={{ minHeight: '200px' }}
    >
      <LightBackground />
      <div className="relative z-10 flex flex-col h-full p-6" style={{ minHeight: '200px' }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">{camp.title}</h3>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        {camp.creator_name && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4 font-medium">
            <User size={12} className="text-slate-400" /> {camp.creator_name}
          </p>
        )}
        <div className="flex-1 flex items-center justify-center border-t border-black/5 mt-2">
          <p className="text-xs text-slate-400 text-center font-medium max-w-[80%] leading-relaxed group-hover:text-purple-600/80 transition-colors">
            {camp.status === 'content_uploaded'
              ? 'Content submitted. Metrics will appear once live.'
              : camp.status === 'revision_requested'
              ? 'Waiting for creator to re-upload corrected content.'
              : 'No content submitted yet.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Single metric card ───────────────────────────────────────────────────── */
function MetricCard({ camp, sub, index }) {
  const isYouTube   = (sub?.platform || '').toLowerCase() === 'youtube';
  const isInstagram = (sub?.platform || '').toLowerCase() === 'instagram';
  const hasError    = !!sub?.stats?.error;

  const rows = sub?.stats && !hasError ? buildRows(sub.stats, isYouTube, isInstagram) : [];

  const theme = isYouTube ? 'youtube' : isInstagram ? 'instagram' : 'default';

  const t = {
    youtube: {
      card: 'border-red-500/20 bg-[#FEF2F2] shadow-[0_4px_24px_rgba(239,68,68,0.05)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.12)] hover:-translate-y-1',
      textHighlight: 'text-red-700',
      textNormal: 'text-red-950',
      textMuted: 'text-red-900/60',
      iconHighlight: 'text-red-500',
      iconMuted: 'text-red-400',
      innerBox: 'bg-white/60 border-red-200/50',
      button: 'bg-white border-red-500 text-red-600 hover:bg-red-500 hover:text-white',
      borderDivider: 'border-red-500/15'
    },
    instagram: {
      card: 'border-[#7C3AED]/20 bg-[#FAF5FF] shadow-[0_4px_24px_rgba(124,58,237,0.05)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.12)] hover:-translate-y-1',
      textHighlight: 'text-[#7C3AED]',
      textNormal: 'text-purple-950',
      textMuted: 'text-purple-900/60',
      iconHighlight: 'text-[#7C3AED]',
      iconMuted: 'text-purple-400',
      innerBox: 'bg-white/60 border-purple-200/50',
      button: 'bg-white border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white',
      borderDivider: 'border-[#7C3AED]/15'
    },
    default: {
      card: 'border-slate-200 bg-slate-50/40 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1',
      textHighlight: 'text-slate-900',
      textNormal: 'text-slate-900',
      textMuted: 'text-slate-500',
      iconHighlight: 'text-slate-500',
      iconMuted: 'text-slate-400',
      innerBox: 'bg-white/60 border-slate-200/50',
      button: 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100',
      borderDivider: 'border-slate-200/50'
    }
  }[theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className={`relative rounded-[20px] overflow-hidden border transition-all duration-300 flex flex-col ${t.card}`}
    >
      {/* Card content */}
      <div className="relative z-10 flex flex-col h-full p-6">

        {/* Campaign name + status */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className={`text-[15px] font-bold leading-snug line-clamp-2 ${t.textNormal}`}>{camp.title}</h3>
            <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              camp.status === 'campaign_closed'     ? 'bg-white/80 text-slate-600 border-slate-200/60' :
              camp.status === 'content_uploaded'    ? 'bg-white/80 text-amber-700 border-amber-200/60' :
              camp.status === 'revision_requested'  ? 'bg-white/80 text-red-700 border-red-200/60' :
              camp.status === 'brand_approved'      ? 'bg-white/80 text-blue-700 border-blue-200/60' :
              'bg-white/80 text-emerald-700 border-emerald-200/60'
            }`}>
              {camp.status === 'campaign_closed'    ? 'Closed' :
               camp.status === 'content_uploaded'   ? 'In Review' :
               camp.status === 'revision_requested' ? 'Revision' :
               camp.status === 'brand_approved'     ? 'Approved' :
               'Live'}
            </span>
          </div>
          {camp.creator_name && (
            <p className={`text-xs flex items-center gap-1.5 font-medium ${t.textMuted}`}>
              <User size={12} className={t.iconMuted} /> {camp.creator_name}
            </p>
          )}
        </div>

        {/* Platform badge */}
        {sub && (
          <div className="flex items-center gap-2 mb-5">
            {isYouTube ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-white/80 border border-red-200/60 px-3 py-1.5 rounded-full shadow-sm">
                <img src={youtubeGif} alt="" className="w-4 h-4 object-contain" />
                YouTube
              </span>
            ) : isInstagram ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] bg-white/80 border border-purple-200/60 px-3 py-1.5 rounded-full shadow-sm">
                <img src={instagramGif} alt="" className="w-4 h-4 object-contain" />
                Instagram
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium px-3 py-1.5 bg-white/80 rounded-full border border-slate-200/60 shadow-sm">{sub.platform}</span>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Video info (YouTube thumbnail + title) */}
          {isYouTube && sub?.stats?.video_title && (
            <div className={`flex items-center gap-3 mb-5 p-3 rounded-xl border ${t.innerBox}`}>
              {sub.stats.thumbnail && (
                <img src={sub.stats.thumbnail} alt="" className="w-14 h-10 object-cover rounded flex-shrink-0 shadow-sm" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-bold line-clamp-2 leading-tight ${t.textNormal}`}>{sub.stats.video_title}</p>
                <div className={`flex flex-wrap gap-2 mt-1 text-[11px] font-medium ${t.textMuted}`}>
                  {sub.stats.channel_name && <span>{sub.stats.channel_name}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Instagram caption */}
          {isInstagram && sub?.stats?.caption && (
            <div className={`mb-5 p-3.5 rounded-xl border ${t.innerBox}`}>
              <p className={`text-[12px] line-clamp-3 leading-relaxed ${t.textNormal}`}>{sub.stats.caption}</p>
              {sub.stats.post_date && (
                <p className={`text-[10px] mt-2 flex items-center gap-1 font-medium ${t.textMuted}`}>
                  <Calendar size={10} />{sub.stats.post_date}
                </p>
              )}
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="flex items-start gap-2.5 bg-white/80 border border-amber-200/60 rounded-xl p-3.5 mb-5 shadow-sm">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">{sub.stats.error}</p>
            </div>
          )}

          {/* Stat Grid */}
          {rows.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 mb-2 mt-1">
              {rows.map((row, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>
                    <row.icon size={12} className={row.highlight ? t.iconHighlight : t.iconMuted} />
                    {row.label}
                  </div>
                  <span className={`text-[15px] font-extrabold ${row.highlight ? t.textHighlight : t.textNormal}`}>
                    {row.value || '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* View post button */}
        {sub?.content_url && (
          <div className={`mt-6 pt-4 border-t ${t.borderDivider}`}>
            <a
              href={sub.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-2.5 text-[12px] font-bold rounded-xl transition-colors shadow-sm ${t.button}`}
            >
              <ExternalLink size={14} />
              View {isYouTube ? 'YouTube' : isInstagram ? 'Instagram' : ''} Post
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Build stat rows from API response ────────────────────────────────────── */
function buildRows(stats, isYouTube, isInstagram) {
  if (isYouTube) {
    const rows = [
      { icon: Eye,           label: 'Views',           value: formatCount(stats.views),    highlight: false },
      { icon: ThumbsUp,      label: 'Likes',           value: formatCount(stats.likes),    highlight: false },
      { icon: MessageCircle, label: 'Comments',        value: formatCount(stats.comments), highlight: false },
      { icon: TrendingUp,    label: 'Eng. Rate',       value: stats.engagement_rate ? `${stats.engagement_rate}%` : null, highlight: true },
    ];
    if (stats.watch_time_minutes !== null && stats.watch_time_minutes !== undefined)
      rows.push({ icon: Clock,        label: 'Watch Time',  value: `${formatCount(stats.watch_time_minutes)}m`, highlight: false });
    if (stats.impressions !== null && stats.impressions !== undefined)
      rows.push({ icon: Eye,          label: 'Impressions', value: formatCount(stats.impressions), highlight: false });
    if (stats.ctr !== null && stats.ctr !== undefined)
      rows.push({ icon: MousePointer, label: 'CTR',         value: `${stats.ctr}%`, highlight: true });
    return rows;
  }
  if (isInstagram) {
    return [
      { icon: Eye,           label: 'Views',           value: formatCount(stats.views),    highlight: false },
      { icon: ThumbsUp,      label: 'Likes',           value: formatCount(stats.likes),    highlight: false },
      { icon: MessageCircle, label: 'Comments',        value: formatCount(stats.comments), highlight: false },
      { icon: Share2,        label: 'Shares',          value: formatCount(stats.shares),   highlight: false },
      { icon: Bookmark,      label: 'Saves',           value: formatCount(stats.saves),    highlight: false },
      { icon: TrendingUp,    label: 'Eng. Rate',       value: stats.engagement_rate ? `${stats.engagement_rate}%` : null, highlight: true },
    ];
  }
  return [];
}
