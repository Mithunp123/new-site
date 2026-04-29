import React from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, HandCoins, ShieldCheck, Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import creatorImage from '../assets/images/Frame-32.png';
import brandImage from '../assets/images/Frame-35.png';
import image33 from '../assets/images/Frame-33.png';
import image34 from '../assets/images/Frame-34.png';
import image36 from '../assets/images/Frame-36.png';
import image37 from '../assets/images/Frame-37.png';

const reelsImages = [
  creatorImage,
  brandImage,
  image33,
  image34,
  image36,
  image37,
];

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

const AutoSwappingReels = ({ images }) => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative h-full w-full">
      {/* Progress Bar Container */}
      <div className="absolute top-6 inset-x-6 z-20 flex gap-1.5">
        {images.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20 backdrop-blur-md">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ 
                width: i === index ? "100%" : i < index ? "100%" : "0%" 
              }}
              transition={{ 
                duration: i === index ? 3 : 0.4, 
                ease: "linear" 
              }}
              className="h-full bg-gradient-to-r from-white to-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          className="absolute inset-0"
        >
          <img 
            src={images[index]} 
            alt={`Reel ${index}`} 
            className="h-full w-full object-cover transition-transform duration-[3000ms] ease-linear group-hover:scale-110"
          />
        </motion.div>
      </AnimatePresence>

      {/* Action Icons - Redesigned to be more 'Pro' */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-6">
        {[
          { icon: Heart, count: '24.8K', active: true },
          { icon: MessageCircle, count: '1.2K' },
          { icon: Share2, count: 'Share' }
        ].map((action, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-xl backdrop-blur-xl transition-all hover:bg-white/20">
              <action.icon 
                size={22} 
                className={action.active ? "fill-red-500 text-red-500" : "text-white"} 
              />
            </div>
            <span className="text-[11px] font-semibold text-white/90 drop-shadow-md">{action.count}</span>
          </motion.div>
        ))}
        <motion.div whileHover={{ scale: 1.1 }} className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-white/40 bg-white/10 shadow-xl backdrop-blur-xl overflow-hidden">
          <div className="h-full w-full bg-gradient-to-br from-blue-400 to-purple-500" />
        </motion.div>
      </div>

      {/* Reel Info */}
      <div className="absolute bottom-8 left-6 right-16 z-20 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#00D4FF] to-blue-600 p-0.5">
            <div className="h-full w-full rounded-full border border-white/20 bg-black/40 backdrop-blur-sm" />
          </div>
          <span className="text-sm font-bold tracking-tight">@gradix_creator</span>
          <button className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors hover:bg-white/20">
            Follow
          </button>
        </div>
        <p className="text-sm font-medium leading-relaxed opacity-90 line-clamp-2">
          Launching our next campaign with Gradix. The escrow feature is a game changer! 🚀 #collaboration #creator
        </p>
      </div>
    </div>
  );
};

const ProblemSolution = () => {

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#07111F] py-24 text-white md:py-28">
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
            className="font-['Playfair_Display'] text-[38px] leading-[1.1] sm:text-[54px] lg:text-[64px]"
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

        <div className="relative flex min-h-[600px] items-center justify-center perspective-1000">
          <motion.div 
            initial={{ rotateY: 15, rotateX: 5 }}
            animate={{ rotateY: [15, 10, 15], rotateX: [5, 8, 5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-[560px] w-[280px] preserve-3d"
          >
            {/* Main Phone Mockup */}
            <div className="absolute inset-0 rounded-[40px] border-[6px] border-[#1A1A1A] bg-[#000] shadow-[0_0_0_2px_rgba(255,255,255,0.1),0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-24 rounded-b-xl bg-[#1A1A1A] z-30" />
              <AutoSwappingReels images={reelsImages} />
            </div>

            {/* Expansive Floating UI Elements */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute -right-32 top-12 z-40 w-56 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <BadgeCheck size={18} className="text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="h-2 w-20 rounded bg-white/20 mb-1" />
                  <div className="h-1.5 w-12 rounded bg-white/10" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-white/10" />
                <div className="h-2 w-2/3 rounded bg-white/10" />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute -left-36 bottom-20 z-40 w-64 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#8DB5FF] tracking-wider uppercase">Escrow Secured</span>
                <HandCoins size={16} className="text-[#8DB5FF]" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">$4,250.00</span>
                <span className="text-[10px] text-white/40 mb-1">USD</span>
              </div>
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full bg-[#00D4FF]/30" />
                ))}
              </div>
            </motion.div>

            {/* Depth Shadows/Glows */}
            <div className="absolute -inset-20 bg-blue-500/10 blur-[120px] -z-10 rounded-full" />
            <div className="absolute -inset-40 bg-purple-500/5 blur-[160px] -z-20 rounded-full" />
          </motion.div>

          {/* Decorative background lines to fill space */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <svg className="h-full w-full opacity-20" viewBox="0 0 800 800">
              <defs>
                <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity="0" />
                  <stop offset="50%" stopColor="#8DB5FF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="400" cy="400" r="300" stroke="url(#line-grad)" strokeWidth="0.5" fill="none" />
              <circle cx="400" cy="400" r="200" stroke="url(#line-grad)" strokeWidth="0.5" fill="none" />
              <line x1="0" y1="400" x2="800" y2="400" stroke="url(#line-grad)" strokeWidth="0.5" />
              <line x1="400" y1="0" x2="400" y2="800" stroke="url(#line-grad)" strokeWidth="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
