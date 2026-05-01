import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const steps = [
  'Request Sent', 'Accepted', 'Escrow Locked', 'Content Uploaded',
  'Brand Approves', 'Posted Live', 'Metrics', 'Payment', 'Closed'
];

export default function ProgressStepper({ currentStep = 0 }) {
  return (
    <div className="flex items-center w-full px-2">
      {steps.map((step, i) => {
        const isDone = i < currentStep;
        const isCurrent = i === currentStep;
        const isPending = i > currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  isDone ? 'bg-green-500 border-green-500 text-white' :
                  isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' :
                  'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? <Check size={16} /> : <span>{i + 1}</span>}
              </motion.div>
              <span className={`text-[10px] mt-1.5 font-medium text-center w-16 leading-tight ${
                isDone ? 'text-green-600' :
                isCurrent ? 'text-blue-600' :
                'text-slate-400'
              }`}>
                {step}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-18px] ${isDone ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
