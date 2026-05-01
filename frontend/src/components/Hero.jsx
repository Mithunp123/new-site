import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

import imgFrame32 from '../assets/images/Frame-32.png';
import imgFrame33 from '../assets/images/Frame-33.png';
import imgFrame34 from '../assets/images/Frame-34.png';
import imgFrame35 from '../assets/images/Frame-35.png';
import imgFrame36 from '../assets/images/Frame-36.png';
import imgFrame37 from '../assets/images/Frame-37.png';
import imgScreenshot1 from '../assets/images/Screenshot-1.png';
import imgScreenshot2 from '../assets/images/Screenshot-2.png';
import imgScreenshot3 from '../assets/images/Screenshot-3.png';
import imgScreenshotCopy from '../assets/images/Screenshot-copy.png';
import imgScreenshot1Copy from '../assets/images/Screenshot-1-copy.png';
import imgScreenshotCopy2 from '../assets/images/Screenshot-copy-2.png';

const row1Images = [
  imgFrame32,
  imgFrame33,
  imgFrame34,
  imgFrame35,
];

const row2Images = [
  imgFrame36,
  imgFrame37,
  imgScreenshot1,
  imgScreenshot2,
];

const row3Images = [
  imgScreenshot3,
  imgScreenshotCopy,
  imgScreenshot1Copy,
  imgScreenshotCopy2,
];

const SlantedMarqueeRow = ({ images, direction = 'left', speed = 40 }) => {
  const duplicated = [...images, ...images, ...images];
  
  return (
    <div className="flex w-[200vw] sm:w-[300vw]">
      <motion.div
        animate={{
          x: direction === 'left' ? ['0%', '-33.333333%'] : ['-33.333333%', '0%']
        }}
        transition={{
          ease: 'linear',
          duration: speed,
          repeat: Infinity,
        }}
        className="flex w-max gap-4 md:gap-6 pr-4 md:pr-6"
      >
        {duplicated.map((src, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[200px] h-[355px] md:w-[320px] md:h-[568px] lg:w-[400px] lg:h-[711px] relative overflow-hidden rounded-md border-2 border-white/5 shadow-2xl group cursor-pointer"
          >
            <div className="absolute inset-0 bg-[var(--color-navy)]/30 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-multiply" />
            <img 
              src={src} 
              alt="marquee" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const Hero = ({ onRegisterClick }) => {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-[var(--color-navy)] flex items-center justify-center">
      
      {/* Background Slanted Marquee */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0 overflow-hidden">
        {/* The radial gradient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-blue)_0%,transparent_60%)] opacity-30 mix-blend-screen z-10 pointer-events-none" />
        
        {/* Slanted Tracks Container */}
        {/* w-[300vw] h-[300vh] ensures it completely covers the viewport even when rotated at -25deg */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250vw] h-[250vh] flex flex-col justify-center items-center gap-4 md:gap-6 -rotate-[25deg] origin-center opacity-60 will-change-transform"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <SlantedMarqueeRow images={row1Images} direction="left" speed={30} />
          <SlantedMarqueeRow images={row2Images} direction="right" speed={40} />
          <SlantedMarqueeRow images={row3Images} direction="left" speed={35} />
        </div>

        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)]/50 via-[var(--color-navy)]/30 to-[var(--color-navy)]/95 z-20 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-30 container mx-auto px-6 md:px-12 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-[var(--color-accent)] font-bold tracking-[0.3em] text-sm uppercase mb-6 drop-shadow-md">
            Gradix Platform
          </p>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-[96px] leading-[1.1] text-white max-w-5xl mb-8 drop-shadow-xl"
        >
          The Trust Layer for <br className="hidden md:block"/> Influencer Marketing.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg md:text-xl text-white/80 max-w-3xl mb-12 font-body drop-shadow-md"
        >
          Connecting verified D2C brands with professional creators through secure escrow payments and data-driven discovery.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button 
            onClick={onRegisterClick}
            className="px-8 py-4 bg-[var(--color-blue)] text-white font-semibold rounded hover:bg-[var(--color-blue-light)] transition-all hover:-translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
          >
            Create Free Account
          </button>

          <button className="px-8 py-4 border border-white/30 text-white font-semibold rounded backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.1)]">
            Watch Demo
          </button>
        </motion.div>
      </div>

      {/* Bottom Left: Scroll Indicator */}
      <div className="absolute bottom-8 left-8 md:left-12 z-30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center animate-bounce backdrop-blur-sm bg-white/5">
          <ArrowDown className="text-white" size={16} />
        </div>
        <span className="text-white/60 text-sm font-medium uppercase tracking-widest hidden md:block">Scroll</span>
      </div>

      {/* Bottom Right: Floating Badge */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 right-8 md:right-12 z-30 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-xl shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" className="w-8 h-8 rounded-full border-2 border-[var(--color-navy)]" />
            ))}
          </div>
          <div>
            <p className="text-white text-sm font-bold">10,000+</p>
            <p className="text-[var(--color-accent)] text-xs font-medium">Creators Active</p>
          </div>
        </div>
      </motion.div>

    </section>
  );
};

export default Hero;
