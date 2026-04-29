import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#07111F] py-24 text-white md:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:92px_92px]" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[70vw] max-h-[760px] w-[70vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[46vw] max-h-[520px] w-[46vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1A6BFF]/28"
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-8">
        <motion.span
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 block text-xs font-semibold uppercase tracking-[0.34em] text-[#8DB5FF]"
        >
          Start building trust
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl font-['Playfair_Display'] text-[42px] leading-[1.1] sm:text-[64px] lg:text-[82px]"
        >
          Connect creators and brands with the confidence to move.
        </motion.h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1fr]">
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="max-w-xl text-xl leading-9 text-white/62"
          >
            Gradix gives both sides the structure to discover, agree, deliver, approve,
            and pay without losing trust between steps.
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.15, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-px origin-left self-center bg-gradient-to-r from-[#1A6BFF] via-[#00D4FF] to-transparent"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, delay: 0.25 }}
          className="mt-12 flex flex-col gap-4 sm:flex-row"
        >
          <button className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-[#07111F] transition hover:-translate-y-1">
            Create Free Account <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
          <button className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/18 px-8 py-4 font-semibold text-white transition hover:-translate-y-1 hover:border-[#00D4FF]">
            Talk to Sales <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
