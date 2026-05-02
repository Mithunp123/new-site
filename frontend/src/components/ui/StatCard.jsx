import { motion } from 'framer-motion';

export default function StatCard({ label, value, change, changeLabel, icon: Icon, variant = 'white', index = 0 }) {
  const isBlue = variant === 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative rounded-2xl p-6 overflow-hidden card-hover ${isBlue
          ? 'gradient-blue text-white shadow-lg shadow-blue-600/20'
          : 'bg-white border border-slate-100 shadow-sm'
        }`}
    >
      {Icon && (
        <div className={`absolute top-4 right-4 p-2 rounded-xl ${isBlue ? 'bg-white/20' : 'bg-blue-50'}`}>
          <Icon size={20} className={isBlue ? 'text-white' : 'text-blue-600'} />
        </div>
      )}
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isBlue ? 'text-blue-100' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className={`text-3xl font-extrabold tracking-tight font-heading ${isBlue ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </p>
      {(change !== undefined || changeLabel) && (
        <p className={`text-xs font-medium mt-2 ${isBlue ? 'text-blue-100' :
            change > 0 ? 'text-green-600' :
              change < 0 ? 'text-red-500' :
                'text-amber-600'
          }`}>
          {change !== undefined && change > 0 && '↑'}{change !== undefined && change < 0 && '↓'}
          {change !== undefined && ` ${Math.abs(change)}%`}
          {changeLabel && ` ${changeLabel}`}
        </p>
      )}
    </motion.div>
  );
}
