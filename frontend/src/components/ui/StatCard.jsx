import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, change, changeLabel, icon: Icon, variant = 'white', index = 0 }) {
  const isBlue = variant === 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative rounded-3xl p-6 overflow-hidden transition-all duration-300 group ${
        isBlue
          ? 'gradient-blue text-white shadow-xl shadow-blue-600/20'
          : 'bg-white border border-slate-100/50 shadow-sm hover:shadow-premium hover:border-slate-200/60'
      }`}
    >
      {/* Background Decoration */}
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 ${isBlue ? 'text-white' : 'text-brand-blue'}`}>
        {Icon && <Icon size={120} />}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-2xl ${isBlue ? 'bg-white/10 text-white' : 'bg-brand-blue/5 text-brand-blue'}`}>
            {Icon && <Icon size={20} strokeWidth={2.5} />}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              isBlue ? 'bg-white/10 text-white' : 
              change > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isBlue ? 'text-blue-100/80' : 'text-slate-400'}`}>
          {label}
        </p>
        
        <div className="flex items-baseline gap-1">
          <h3 className={`text-3xl font-black font-heading tracking-tight ${isBlue ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </h3>
        </div>

        {changeLabel && (
          <p className={`text-[10px] font-bold mt-2 ${isBlue ? 'text-blue-100/60' : 'text-slate-400'}`}>
            {changeLabel}
          </p>
        )}
      </div>
    </motion.div>
  );
}
