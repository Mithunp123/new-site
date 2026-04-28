import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, HandCoins, ShieldCheck } from 'lucide-react';
import creatorImage from '../assets/images/Frame-32.png';
import brandImage from '../assets/images/Frame-35.png';

const lines = [
  {
    icon: BadgeCheck,
    title: 'Verified before discovery',
    text: 'Brands and creators enter the marketplace with profile signals that make matching easier to trust.',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow before production',
    text: 'Campaign funds are secured before creators begin work, removing the uncertainty from paid collaboration.',
  },
  {
    icon: HandCoins,
    title: 'Payout after approval',
    text: 'Milestone approvals trigger a clear payout path, so both sides know exactly where the campaign stands.',
  },
];

const ProblemSolution = () => {
  const { scrollYProgress } = useScroll();
  const firstY = useTransform(scrollYProgress, [0.18, 0.42], [80, -40]);
  const secondY = useTransform(scrollYProgress, [0.18, 0.42], [-40, 70]);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#07111F] py-24 text-white md:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:92px_92px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative z-10 mx-auto grid max-w-[1280px] gap-14 px-6 sm:px-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-7 block text-xs font-semibold uppercase tracking-[0.34em] text-[#8DB5FF]"
          >
            The collaboration layer
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="font-['Playfair_Display'] text-[52px] leading-[0.98] sm:text-[74px] lg:text-[92px]"
          >
            Creators and brands need one shared source of truth.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="mt-8 max-w-2xl text-lg leading-8 text-white/62"
          >
            Gradix replaces scattered DMs, invoice chasing, and unclear approvals with a
            structured flow for matching, funding, delivery, and payout.
          </motion.p>

          <div className="mt-12 border-t border-white/14">
            {lines.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.65, delay: index * 0.08 }}
                className="group grid gap-5 border-b border-white/14 py-7 sm:grid-cols-[72px_1fr_32px]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/18 text-[#8DB5FF] transition group-hover:border-[#00D4FF] group-hover:text-[#00D4FF]">
                  <item.icon size={21} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-white/56">{item.text}</p>
                </div>
                <ArrowUpRight className="hidden text-white/28 transition group-hover:text-[#00D4FF] sm:block" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[620px]">
          <motion.div
            style={{ y: firstY }}
            initial={{ opacity: 0, clipPath: 'inset(22% 0% 22% 0%)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-0 w-[72%] overflow-hidden rounded-[2px]"
          >
            <img src={creatorImage} alt="Creator workspace" className="h-[380px] w-full object-cover" />
          </motion.div>
          <motion.div
            style={{ y: secondY }}
            initial={{ opacity: 0, clipPath: 'inset(22% 0% 22% 0%)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 1, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 right-0 w-[72%] overflow-hidden rounded-[2px]"
          >
            <img src={brandImage} alt="Brand campaign dashboard" className="h-[380px] w-full object-cover" />
          </motion.div>
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-14 h-[520px] w-px origin-top bg-gradient-to-b from-transparent via-[#00D4FF] to-transparent"
          />
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
