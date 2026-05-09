import { motion } from 'framer-motion';

// 7-step flow: Request Sent → Accepted → Escrow Locked → Content Uploaded → Brand Approves → Live → Closed
const STEPS = [
  'Request Sent',
  'Accepted',
  'Escrow Locked',
  'Content Uploaded',
  'Brand Approves',
  'Live',
  'Closed',
];

// Map DB status → step index (0-based)
const STATUS_TO_STEP = {
  'request_sent':        0,
  'negotiating':         0,
  'creator_accepted':    1,
  'agreement_locked':    2,
  'content_uploaded':    3,
  'brand_approved':      4,
  'posted_live':         5,
  'analytics_collected': 5,
  'escrow_released':     5,
  'campaign_closed':     6,
};

export default function ProgressStepper({ currentStep = 0, status = null }) {
  // If a DB status string is passed, use the mapping; otherwise use the raw step number
  const step = status ? (STATUS_TO_STEP[status] ?? 0) : currentStep;

  return (
    <div className="flex items-center w-full px-2">
      {STEPS.map((label, i) => {
        const isDone    = i < step;
        const isCurrent = i === step;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  isDone    ? 'bg-[#2563EB] border-[#2563EB] text-white' :
                  isCurrent ? 'bg-white border-[#2563EB] text-[#2563EB] shadow-lg shadow-blue-600/20' :
                  'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <span>{i + 1}</span>
              </motion.div>
              <span className={`text-[10px] mt-1.5 font-medium text-center w-16 leading-tight ${
                isDone || isCurrent ? 'text-[#2563EB]' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-18px] ${isDone ? 'bg-[#2563EB]' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
