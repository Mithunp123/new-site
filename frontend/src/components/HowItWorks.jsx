import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Search, CheckCircle, Users, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: "01",
    title: "Brand Discovery",
    description: "Brands identify their perfect creator matches using our deep opportunity graph and niche-specific verification.",
    image: "/images/brand.png",
    icon: Search,
    color: "#3B82F6" // Blue
  },
  {
    number: "02",
    title: "Creator Verification",
    description: "We verify audience authenticity and historical performance, ensuring brands connect with real, high-impact creators.",
    image: "/images/creator.png",
    icon: CheckCircle,
    color: "#A855F7" // Purple
  },
  {
    number: "03",
    title: "Seamless Collaboration",
    description: "Both parties enter a unified workflow where briefs, milestones, and deliverables are perfectly synced.",
    image: "/images/collab.png",
    icon: Users,
    color: "#06B6D4" // Cyan
  },
  {
    number: "04",
    title: "Safe & Scalable Growth",
    description: "Automated escrow and instant payouts foster long-term trust, allowing both parties to scale their impact together.",
    image: "/images/success.png",
    icon: TrendingUp,
    color: "#F97316" // Orange
  }
];

const StepNode = ({ icon: Icon, progress, threshold }) => {
  const isActive = useTransform(progress, (p) => p >= threshold);

  const color = useTransform(
    progress,
    [threshold - 0.05, threshold],
    ["#1e293b", "#F97316"]
  );

  const glowOpacity = useTransform(
    progress,
    [threshold - 0.05, threshold],
    [0, 0.6]
  );

  return (
    <div className="relative z-10 mb-8">
      <div className="relative grid place-items-center">
        <span className="absolute h-14 w-14 rounded-full bg-white dark:bg-[#07111F]"></span>
        <span className="absolute h-14 w-14 rounded-full ring-[6px] ring-neutral-100 dark:ring-neutral-900/50"></span>

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
      className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#07111F] overflow-hidden"
    >


      <div className="relative max-w-[1200px] mx-auto w-full flex flex-col items-center z-10">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs tracking-[0.34em] text-[#8DB5FF] font-semibold uppercase mb-8"
        >
          Start building trust
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl md:text-6xl font-medium text-white text-center tracking-tight leading-[1.05] max-w-2xl mb-24"
        >
          A unified bridge for high-impact partnerships
        </motion.h2>

        <div className="relative w-full">
          {/* Central Line - Solid Active Part only, no dashed background */}
          <motion.div
            style={{ scaleY: pathHeight, originY: 0 }}
            className="absolute left-1/2 -translate-x-1/2 w-px bg-white z-0 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            style={{ top: '24px', height: 'calc(100% - 48px)', scaleY: pathHeight, originY: 0 }}
          />

          <div className="flex flex-col gap-32">
            {steps.map((step, index) => {
              const isEven = index % 2 === 1;
              const threshold = index / (steps.length - 1);

              return (
                <div key={index} className="relative flex flex-col items-center perspective-2000">
                  <StepNode icon={step.icon} progress={lineGrowth} threshold={threshold} />

                  <div className={`w-full grid md:grid-cols-2 gap-12 items-center`}>
                    {/* Content Side */}
                    <div className={`${isEven ? 'md:order-2' : 'md:order-1'}`}>
                      <motion.article
                        initial={{
                          opacity: 0,
                          rotateY: isEven ? -45 : 45,
                          x: isEven ? 100 : -100,
                          z: -100
                        }}
                        whileInView={{
                          opacity: 1,
                          rotateY: 0,
                          x: 0,
                          z: 0
                        }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{
                          duration: 1.2,
                          ease: [0.16, 1, 0.3, 1],
                          delay: 0.1
                        }}
                        className="relative rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden group"
                      >
                        <div className="p-6 sm:p-8">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-4xl font-bold opacity-20 text-white font-mono">{step.number}</span>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white">{step.title}</h3>
                          </div>
                          <p className="text-neutral-400 leading-relaxed text-sm sm:text-base">
                            {step.description}
                          </p>
                        </div>
                        <div className="px-3 pb-3">
                          <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-900 relative">
                            <img alt={step.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" src={step.image} />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/80 via-transparent to-transparent" />
                          </div>
                        </div>
                      </motion.article>
                    </div>

                    {/* Decorative Side (Fills Empty Space) */}
                    <div className={`${isEven ? 'md:order-1' : 'md:order-2'} hidden md:flex items-center justify-center`}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="relative w-full h-full flex items-center justify-center"
                      >
                        {/* Large Ghost Number */}
                        <span className="absolute text-[15rem] font-bold text-white/[0.03] select-none pointer-events-none font-mono">
                          {step.number}
                        </span>
                      </motion.div>
                    </div>
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
