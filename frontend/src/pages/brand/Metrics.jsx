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

/* ─── Animated shader blob — single unified dark purple theme ──────────────── */
function ShaderBlob() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
      {/* Base dark */}
      <div className="absolute inset-0 bg-[#0d0d18]" />
      {/* Primary blob — purple */}
      <motion.div
        className="absolute rounded-full blur-3xl opacity-50"
        style={{
          width: '75%', height: '75%',
          background: 'radial-gradient(circle, #7C3AED99 0%, #7C3AED22 60%, transparent 100%)',
          top: '5%', left: '15%',
        }}
        animate={{ x: [0, 18, -10, 0], y: [0, -12, 8, 0], scale: [1, 1.07, 0.96, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary blob — indigo */}
      <motion.div
        className="absolute rounded-full blur-3xl opacity-30"
        style={{
          width: '55%', height: '55%',
          background: 'radial-gradient(circle, #4F46E5aa 0%, #4F46E522 60%, transparent 100%)',
          bottom: '0%', right: '0%',
        }}
        animate={{ x: [0, -12, 8, 0], y: [0, 8, -6, 0], scale: [1, 0.93, 1.05, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
      />
    </div>
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
      cards.push({ camp, sub: null });
    }
  });

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
          <p className="text-sm text-slate-400 mt-1">Metrics appear after a campaign goes live.</p>
        </div>
      ) : (
        /* 3–4 cards per row grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map(({ camp, sub }, i) => (
            <MetricCard key={`${camp.campaign_id}-${i}`} camp={camp} sub={sub} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Single metric card ───────────────────────────────────────────────────── */
function MetricCard({ camp, sub, index }) {
  const isYouTube   = (sub?.platform || '').toLowerCase() === 'youtube';
  const isInstagram = (sub?.platform || '').toLowerCase() === 'instagram';
  const hasError    = !!sub?.stats?.error;

  const rows = sub?.stats && !hasError ? buildRows(sub.stats, isYouTube, isInstagram) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden"
      style={{ minHeight: '380px' }}
    >
      {/* Shader blob background — unified dark purple */}
      <ShaderBlob />

      {/* Card content — sits above the blob */}
      <div className="relative z-10 flex flex-col h-full p-5" style={{ minHeight: '380px' }}>

        {/* Campaign name + status */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{camp.title}</h3>
            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              camp.status === 'campaign_closed'
                ? 'bg-white/10 text-white/60'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {camp.status === 'campaign_closed' ? 'Closed' : 'Live'}
            </span>
          </div>
          {camp.creator_name && (
            <p className="text-[11px] text-white/50 flex items-center gap-1">
              <User size={10} /> {camp.creator_name}
            </p>
          )}
        </div>

        {/* Platform badge — no "via..." text */}
        {sub && (
          <div className="flex items-center gap-2 mb-4">
            {isYouTube
              ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/80 bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg"><Tv size={11} /> YouTube</span>
              : isInstagram
              ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/80 bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg"><Film size={11} /> Instagram</span>
              : <span className="text-[11px] text-white/40">{sub.platform}</span>
            }
          </div>
        )}

        {/* Video info (YouTube thumbnail + title) */}
        {isYouTube && sub?.stats?.video_title && (
          <div className="flex items-start gap-3 mb-4 bg-white/5 rounded-xl p-3 border border-white/8">
            {sub.stats.thumbnail && (
              <img src={sub.stats.thumbnail} alt="" className="w-16 h-11 object-cover rounded-lg flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white/90 line-clamp-2 leading-tight">{sub.stats.video_title}</p>
              <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-white/40">
                {sub.stats.channel_name && <span>{sub.stats.channel_name}</span>}
                {sub.stats.duration && <span className="flex items-center gap-0.5"><Clock size={9} />{sub.stats.duration}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Instagram caption */}
        {isInstagram && sub?.stats?.caption && (
          <div className="mb-4 bg-white/5 rounded-xl p-3 border border-white/8">
            <p className="text-[11px] text-white/60 line-clamp-2">{sub.stats.caption}</p>
            {sub.stats.post_date && (
              <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1"><Calendar size={9} />{sub.stats.post_date}</p>
            )}
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 mb-4">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-[11px] text-amber-300">{sub.stats.error}</p>
          </div>
        )}

        {/* Stat rows — vertical linear list */}
        {rows.length > 0 && (
          <div className="flex-1 space-y-0 bg-white/5 rounded-xl border border-white/8 overflow-hidden">
            {rows.map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3.5 py-2.5 ${i < rows.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <row.icon size={12} className={row.highlight ? 'text-[#a78bfa]' : 'text-white/30'} />
                  <span className="text-[11px] text-white/50 font-medium">{row.label}</span>
                </div>
                <span className={`text-[13px] font-bold ${row.highlight ? 'text-[#a78bfa]' : 'text-white/90'}`}>
                  {row.value || '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View post button */}
        {sub?.content_url && (
          <a
            href={sub.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white/90 hover:bg-white text-slate-900 text-xs font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-white/10"
          >
            <ExternalLink size={12} />
            View {isYouTube ? 'YouTube' : isInstagram ? 'Instagram' : ''} Post
          </a>
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
      { icon: TrendingUp,    label: 'Engagement Rate', value: stats.engagement_rate ? `${stats.engagement_rate}%` : null, highlight: true },
    ];
    if (stats.watch_time_minutes !== null && stats.watch_time_minutes !== undefined)
      rows.push({ icon: Clock,        label: 'Watch Time',  value: `${formatCount(stats.watch_time_minutes)} min`, highlight: false });
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
      { icon: TrendingUp,    label: 'Engagement Rate', value: stats.engagement_rate ? `${stats.engagement_rate}%` : null, highlight: true },
    ];
  }
  return [];
}
