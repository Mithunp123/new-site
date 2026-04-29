import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Search, CheckCircle, Users, TrendingUp } from 'lucide-react';

const steps = [
  {
    title: "Brand Discovery",
    description: "Brands identify their perfect creator matches using our deep opportunity graph and niche-specific verification.",
    image: "/images/brand.png",
    icon: Search
  },
  {
    title: "Creator Verification",
    description: "We verify audience authenticity and historical performance, ensuring brands connect with real, high-impact creators.",
    image: "/images/creator.png",
    icon: CheckCircle
  },
  {
    title: "Seamless Collaboration",
    description: "Both parties enter a unified workflow where briefs, milestones, and deliverables are perfectly synced.",
    image: "/images/collab.png",
    icon: Users
  },
  {
    title: "Safe & Scalable Growth",
    description: "Automated escrow and instant payouts foster long-term trust, allowing both parties to scale their impact together.",
    image: "/images/success.png",
    icon: TrendingUp
  }
];

const StepNode = ({ icon: Icon, progress, threshold }) => {
  // Determine if the node is active based on scroll progress
  // We use a small buffer to make it feel responsive
  const isActive = useTransform(progress, (p) => p >= threshold);
  
  // Create animated values for color and glow
  const color = useTransform(
    progress,
    [threshold - 0.05, threshold],
    ["#1e293b", "#F97316"] // slate-800 to orange-500
  );
  
  const glowOpacity = useTransform(
    progress,
    [threshold - 0.05, threshold],
    [0, 0.6]
  );

  return (
    <div className="relative z-10 mb-8">
      <div className="relative grid place-items-center">
        <span className="absolute h-14 w-14 rounded-full bg-white dark:bg-[#050505]"></span>
        <span className="absolute h-14 w-14 rounded-full ring-[6px] ring-neutral-100 dark:ring-neutral-900/50"></span>
        
        {/* Glow effect triggered when line reaches the point */}
        <motion.span 
          style={{ 
            opacity: glowOpacity,
            scale: isActive ? [1, 1.4, 1] : 1
          }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute h-12 w-12 rounded-full bg-orange-500 blur-md" 
        />
        
        <motion.span 
          style={{ backgroundColor: color }}
          className="relative grid place-items-center h-12 w-12 rounded-full text-white shadow-xl"
        >
          <Icon className="h-5 w-5" />
        </motion.span>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineGrowth = useTransform(scrollYProgress, [0, 0.9], [0, 1]);
  const pathHeight = useSpring(lineGrowth, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section 
      ref={containerRef}
      className="relative w-full flex items-start py-16 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#07111F] overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto w-full flex flex-col items-center">
        {/* Header Section */}
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs tracking-[0.2em] text-neutral-500 dark:text-neutral-500 uppercase"
        >
          Connecting Brands & Creators
        </motion.p>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-3xl sm:text-5xl md:text-6xl font-medium text-neutral-900 dark:text-white text-center tracking-tight leading-[1.05] max-w-2xl"
        >
          A unified bridge for high-impact partnerships
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-5 max-w-md text-center text-base text-neutral-600 dark:text-neutral-400"
        >
          From the first match to the final payout, we automate the trust so you can focus on the growth.
        </motion.p>

        <div className="relative mt-20 sm:mt-28 w-full">
          {/* Central Vertical Line (Background - Dashed) */}
          <div 
            aria-hidden="true" 
            className="absolute left-1/2 -translate-x-1/2 w-px border-l border-dashed border-neutral-300 dark:border-neutral-800 z-0" 
            style={{ top: '24px', bottom: '24px' }}
          />
          
          {/* Active Growing Line (Solid White) */}
          <motion.div 
            aria-hidden="true" 
            className="absolute left-1/2 -translate-x-1/2 w-px bg-neutral-900 dark:bg-white z-0" 
            style={{ top: '24px', height: 'calc(100% - 48px)', scaleY: pathHeight, originY: 0 }}
          />

          <div className="flex flex-col gap-16 sm:gap-32">
            {steps.map((step, index) => {
              const isEven = index % 2 === 1;
              // Thresholds relative to lineGrowth (0 to 1)
              const threshold = index / (steps.length - 1);

              return (
                <div key={index} className="relative flex flex-col items-center">
                  {/* Node Section */}
                  <StepNode 
                    icon={step.icon} 
                    progress={lineGrowth} 
                    threshold={threshold} 
                  />

                  {/* Card Section */}
                  <div className={`w-full flex ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                    <motion.article 
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full md:w-[44%] rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] overflow-hidden ${isEven ? 'md:ml-auto' : 'md:mr-auto'}`}
                    >
                      <div className="p-5 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                      <div className="px-2 pb-2">
                        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative group">
                          <img 
                            alt={step.title} 
                            loading="lazy" 
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            src={step.image} 
                          />
                        </div>
                      </div>
                    </motion.article>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
