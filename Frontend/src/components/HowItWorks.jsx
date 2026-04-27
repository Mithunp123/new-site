import React from 'react';
import { motion } from 'framer-motion';
import { Handshake, PlayCircle, BadgeCheck } from 'lucide-react';
import processVideo from '../assets/videos/process.mp4';

const ScatterStars = () => (
  <div className="flex justify-center mb-6 relative w-16 h-12 mx-auto">
    <svg width="100%" height="100%" viewBox="0 0 60 40" fill="none" className="text-white">
      <path d="M 30,15 L 32,10 L 34,15 L 39,17 L 34,19 L 32,24 L 30,19 L 25,17 Z" fill="currentColor" />
      <path d="M 15,8 L 16.5,5 L 18,8 L 21,9.5 L 18,11 L 16.5,14 L 15,11 L 12,9.5 Z" fill="currentColor" opacity="0.7" className="scale-75 origin-center" />
      <path d="M 45,10 L 46.5,7 L 48,10 L 51,11.5 L 48,13 L 46.5,16 L 45,13 L 42,11.5 Z" fill="currentColor" opacity="0.6" className="scale-75 origin-center" />
      <path d="M 22,30 L 23,28 L 24,30 L 26,31 L 24,32 L 23,34 L 22,32 L 20,31 Z" fill="currentColor" opacity="0.8" className="scale-50 origin-center" />
      <path d="M 38,32 L 39,30 L 40,32 L 42,33 L 40,34 L 39,36 L 38,34 L 36,33 Z" fill="currentColor" opacity="0.5" className="scale-50 origin-center" />
    </svg>
  </div>
);

const HowItWorks = () => {
  const steps = [
    {
      icon: <Handshake size={32} className="text-[var(--color-blue)]" />,
      title: "Deal Locked",
      desc: "Brand deposits funds into secure escrow. Creator starts work with peace of mind.",
      active: true
    },
    {
      icon: <PlayCircle size={32} className="text-[var(--color-blue)]" />,
      title: "Content Goes Live",
      desc: "Creator delivers content. Brand reviews and approves via the platform.",
      active: false
    },
    {
      icon: <BadgeCheck size={32} className="text-[var(--color-blue)]" />,
      title: "Payout Released",
      desc: "Funds instantly transfer to the creator's account. Zero delays, zero fees.",
      active: false
    }
  ];

  return (
    <section className="py-24 overflow-hidden relative">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src={processVideo} type="video/mp4" />
      </video>

      <div className="container mx-auto px-6 md:px-12 text-center mb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ScatterStars />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            The Gradix Escrow Guarantee.
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-medium">
            Three simple steps to secure every single collaboration.
          </p>
        </motion.div>
      </div>

      <div id="timeline-container" className="container mx-auto px-6 md:px-12 max-w-5xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative z-10">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              
              {/* Connector Lines */}
              {i === 0 && (
                <>
                  {/* Intro Line */}
                  <div className="hidden md:block absolute w-[50%] right-[50%] top-2 h-12 z-[-1] opacity-30">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 0,0 Q 50,100 100,100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                  {/* Line from 1 to 2 */}
                  <div className="hidden md:block absolute w-full left-[50%] top-14 h-12 z-[-1] opacity-30">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 0,0 Q 50,100 100,0" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </>
              )}
              {i === 1 && (
                /* Line from 2 to 3 */
                <div className="hidden md:block absolute w-full left-[50%] top-2 h-12 z-[-1] opacity-30">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0,100 Q 50,0 100,100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              )}
              {i === 2 && (
                /* Outro Line */
                <div className="hidden md:block absolute w-[50%] left-[50%] top-14 h-12 z-[-1] opacity-30">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0,0 Q 50,100 100,100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              )}

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.2, type: 'spring' }}
                className="relative mb-8"
              >
                {/* Number Badge */}
                <div className="absolute -top-1 -left-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[var(--color-navy)] font-bold text-sm shadow-md z-20">
                  {i + 1}
                </div>

                {/* Circle */}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center relative z-10 bg-white transition-all duration-300 ${
                  step.active 
                    ? 'shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)]' 
                    : 'border-2 border-dashed border-white/30'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${step.active ? 'bg-[var(--color-blue)]/10' : ''}`}>
                    {step.icon}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.2 + 0.2 }}
              >
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed max-w-[240px] mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

