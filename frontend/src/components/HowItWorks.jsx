import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
  ['01', 'Match', 'Verified creators and brands enter the same opportunity graph.'],
  ['02', 'Scope', 'The brief, deliverables, usage rights, and milestones become one agreement.'],
  ['03', 'Secure', 'The budget is placed into escrow before production begins.'],
  ['04', 'Release', 'Approval unlocks payout and closes the campaign record.'],
];

const HowItWorks = () => {
  const { scrollYProgress } = useScroll();
  const lineScale = useTransform(scrollYProgress, [0.48, 0.72], [0, 1]);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-white py-24 md:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,107,255,.05)_1px,transparent_1px),linear-gradient(rgba(26,107,255,.045)_1px,transparent_1px)] [background-size:92px_92px]" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="mb-16 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mb-7 block text-xs font-semibold uppercase tracking-[0.34em] text-[#1A6BFF]">
              How it moves
            </span>
            <h2 className="font-['Playfair_Display'] text-[52px] leading-[0.98] text-[#0A1628] sm:text-[74px] lg:text-[92px]">
              One flow from match to money.
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl self-end text-xl leading-9 text-[#5A6480]"
          >
            The motion is deliberate: each stage reveals as a continuation of the previous
            one, like a deal moving through a verified system.
          </motion.p>
        </div>

        <div className="relative">
          <div className="absolute left-[28px] top-0 hidden h-full w-px bg-[#DCE6FF] md:block" />
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute left-[28px] top-0 hidden h-full w-px origin-top bg-[#1A6BFF] md:block"
          />
          {steps.map(([number, title, text], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 42 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.72, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-7 border-t border-[#DCE6FF] py-9 last:border-b md:grid-cols-[72px_0.65fr_1fr]"
            >
              <div className="font-['Playfair_Display'] text-5xl leading-none text-[#1A6BFF]">{number}</div>
              <h3 className="text-3xl font-semibold text-[#0A1628] md:text-5xl">{title}</h3>
              <p className="max-w-xl text-lg leading-8 text-[#5A6480]">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
