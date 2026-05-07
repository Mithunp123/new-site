import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, change, changeLabel, icon: Icon, variant, index = 0 }) {
  const isBlue = variant === 'blue';
  const isPositive = Number(change) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={`rounded-2xl p-5 border transition-all duration-200 ${
        isBlue
          ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)]'
          : 'bg-white border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${isBlue ? 'text-blue-100' : 'text-slate-400'}`}>
            {label}
          </p>
          <p className={`text-[26px] font-bold tracking-tight leading-none ${isBlue ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isBlue ? 'bg-white/15' : 'bg-slate-50 border border-slate-100'
          }`}>
            <Icon size={18} className={isBlue ? 'text-white' : 'text-[#2563EB]'} />
          </div>
        )}
      </div>

      {(change !== undefined || changeLabel) && (
        <div className={`mt-4 pt-3 border-t flex items-center gap-1.5 ${
          isBlue ? 'border-white/15' : 'border-slate-50'
        }`}>
          {change !== undefined && (
            <>
              {isPositive
                ? <TrendingUp size={12} className={isBlue ? 'text-blue-100' : 'text-emerald-500'} />
                : <TrendingDown size={12} className={isBlue ? 'text-blue-100' : 'text-red-400'} />
              }
              <span className={`text-xs font-semibold ${
                isBlue ? 'text-blue-100' : isPositive ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {isPositive ? '+' : ''}{Number(change).toFixed(1)}%
              </span>
            </>
          )}
          {changeLabel && (
            <span className={`text-xs ${isBlue ? 'text-blue-100/80' : 'text-slate-400'}`}>
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
