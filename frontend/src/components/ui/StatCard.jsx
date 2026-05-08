import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Gradient definitions as inline styles — avoids Tailwind v4 @apply conflicts
const GRADIENTS = {
  blue:   { bg: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)', shadow: '0 4px 20px rgba(37,99,235,0.35)',   sub: 'rgba(255,255,255,0.75)' },
  purple: { bg: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)', shadow: '0 4px 20px rgba(124,58,237,0.35)',  sub: 'rgba(255,255,255,0.75)' },
  green:  { bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', shadow: '0 4px 20px rgba(16,185,129,0.30)',  sub: 'rgba(255,255,255,0.75)' },
  amber:  { bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', shadow: '0 4px 20px rgba(245,158,11,0.30)',  sub: 'rgba(255,255,255,0.75)' },
  rose:   { bg: 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)', shadow: '0 4px 20px rgba(244,63,94,0.30)',   sub: 'rgba(255,255,255,0.75)' },
  cyan:   { bg: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)', shadow: '0 4px 20px rgba(6,182,212,0.30)',   sub: 'rgba(255,255,255,0.75)' },
};

export default function StatCard({ label, value, change, changeLabel, icon: Icon, variant, index = 0 }) {
  const g = GRADIENTS[variant];
  const isColored = !!g;
  const isPositive = Number(change) > 0;

  const cardStyle = isColored
    ? { background: g.bg, boxShadow: g.shadow, border: 'none' }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      style={cardStyle}
      className={`rounded-2xl p-5 transition-all duration-200 ${
        isColored
          ? ''
          : 'bg-white border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: isColored ? g.sub : '#94A3B8', fontFamily: 'Inter, sans-serif' }}
          >
            {label}
          </p>
          <p
            className="text-[26px] font-bold tracking-tight leading-none"
            style={{ color: isColored ? '#ffffff' : '#0F172A', fontFamily: 'Sora, sans-serif' }}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={isColored
              ? { background: 'rgba(255,255,255,0.2)' }
              : { background: '#F8FAFC', border: '1px solid #E2E8F0' }
            }
          >
            <Icon size={18} style={{ color: isColored ? '#ffffff' : '#2563EB' }} />
          </div>
        )}
      </div>

      {(change !== undefined || changeLabel) && (
        <div
          className="mt-4 pt-3 flex items-center gap-1.5"
          style={{ borderTop: isColored ? '1px solid rgba(255,255,255,0.2)' : '1px solid #F8FAFC' }}
        >
          {change !== undefined && (
            <>
              {isPositive
                ? <TrendingUp size={12} style={{ color: isColored ? g.sub : '#10B981' }} />
                : <TrendingDown size={12} style={{ color: isColored ? g.sub : '#EF4444' }} />
              }
              <span
                className="text-xs font-semibold"
                style={{ color: isColored ? g.sub : isPositive ? '#059669' : '#EF4444', fontFamily: 'Inter, sans-serif' }}
              >
                {isPositive ? '+' : ''}{Number(change).toFixed(1)}%
              </span>
            </>
          )}
          {changeLabel && (
            <span
              className="text-xs"
              style={{ color: isColored ? g.sub : '#94A3B8', fontFamily: 'Inter, sans-serif' }}
            >
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
