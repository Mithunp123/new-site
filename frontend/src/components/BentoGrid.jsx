import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const focusAreas = [
  {
    title: 'Creator discovery',
    text: 'Find the right creator through audience, category, quality, and reliability signals.',
  },
  {
    title: 'Campaign operations',
    text: 'Keep briefs, deadlines, deliverables, approvals, and messages aligned in one flow.',
  },
  {
    title: 'Escrow protection',
    text: 'Secure the budget before work begins, then release payout through milestone approval.',
  },
  {
    title: 'Performance clarity',
    text: 'Give brands and creators the same campaign context after content goes live.',
  },
];

const BentoGrid = () => {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#F7FAFF] py-24 md:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,107,255,.06)_1px,transparent_1px),linear-gradient(rgba(26,107,255,.05)_1px,transparent_1px)] [background-size:88px_88px]" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mb-7 block text-xs font-semibold uppercase tracking-[0.34em] text-[#1A6BFF]">
              Platform focus
            </span>
            <h2 className="font-['Playfair_Display'] text-[52px] leading-[0.98] text-[#0A1628] sm:text-[74px] lg:text-[92px]">
              Built for the full creator commerce loop.
            </h2>
          </motion.div>

          <div className="border-t border-[#C9D7F5]">
            {focusAreas.map((area, index) => (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, x: 42 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-90px' }}
                transition={{ duration: 0.75, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group grid gap-6 border-b border-[#C9D7F5] py-9 md:grid-cols-[96px_1fr_36px]"
              >
                <div className="font-['Playfair_Display'] text-5xl leading-none text-[#1A6BFF]/28">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-3xl font-semibold text-[#0A1628] md:text-4xl">{area.title}</h3>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5A6480]">{area.text}</p>
                </div>
                <ArrowUpRight className="hidden self-start text-[#8A96B0] transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#1A6BFF] md:block" />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 h-px origin-left bg-gradient-to-r from-[#1A6BFF] via-[#00D4FF] to-transparent"
        />
      </div>
    </section>
  );
};

export default BentoGrid;
