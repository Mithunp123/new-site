import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ArrowDown } from 'lucide-react';

const panels = [
  { img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80", x: -20, y: -10, rotation: -15, scale: 1.1 },
  { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80", x: 25, y: -25, rotation: 10, scale: 1 },
  { img: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80", x: -35, y: 30, rotation: 12, scale: 0.9 },
  { img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80", x: 40, y: 20, rotation: -8, scale: 1.2 },
  { img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80", x: -10, y: -45, rotation: 5, scale: 0.8 },
  { img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80", x: 15, y: 45, rotation: -12, scale: 1 },
];

const Hero = () => {
  const containerRef = useRef(null);
  const panelsRef = useRef([]);

  useEffect(() => {
    // Continuous rotation for panels
    panelsRef.current.forEach((panel, i) => {
      const speed = 0.01 + Math.random() * 0.02;
      const direction = i % 2 === 0 ? 1 : -1;
      
      gsap.to(panel, {
        rotation: `+=${360 * direction}`,
        duration: 20 / speed,
        repeat: -1,
        ease: "none"
      });
    });

    // Mouse parallax
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 40;
      const yPos = (clientY / window.innerHeight - 0.5) * 40;

      gsap.to(panelsRef.current, {
        x: xPos,
        y: yPos,
        duration: 1,
        ease: "power2.out",
        stagger: 0.02
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[var(--color-navy)] flex items-center justify-center" ref={containerRef}>
      {/* Background Animated Panels */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-40">
        <div className="relative w-full max-w-5xl aspect-square">
          {panels.map((p, i) => (
            <div
              key={i}
              ref={el => panelsRef.current[i] = el}
              className="absolute w-64 h-96 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-110"
              style={{
                top: `calc(50% + ${p.y}%)`,
                left: `calc(50% + ${p.x}%)`,
                transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/80 to-transparent z-10 mix-blend-multiply" />
              <img src={p.img} alt="background" className="w-full h-full object-cover blur-[2px]" />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[var(--color-navy)]/70 backdrop-blur-[2px] z-10" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 md:px-12 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-[var(--color-accent)] font-bold tracking-[0.3em] text-sm uppercase mb-6">
            Gradix Platform
          </p>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-[96px] leading-[1.1] text-white max-w-5xl mb-8"
        >
          The Trust Layer for <br className="hidden md:block"/> Influencer Marketing.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg md:text-xl text-white/80 max-w-3xl mb-12 font-body"
        >
          Connecting verified D2C brands with professional creators through secure escrow payments and data-driven discovery.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button className="px-8 py-4 bg-[var(--color-blue)] text-white font-semibold rounded hover:bg-[var(--color-blue-light)] transition-all hover:-translate-y-1">
            Create Free Account
          </button>
          <button className="px-8 py-4 border border-white/30 text-white font-semibold rounded hover:bg-white/10 transition-all hover:-translate-y-1">
            Watch Demo
          </button>
        </motion.div>
      </div>

      {/* Bottom Left: Scroll Indicator */}
      <div className="absolute bottom-8 left-8 md:left-12 z-20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center animate-bounce">
          <ArrowDown className="text-white" size={16} />
        </div>
        <span className="text-white/60 text-sm font-medium uppercase tracking-widest hidden md:block">Scroll</span>
      </div>

      {/* Bottom Right: Floating Badge */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 right-8 md:right-12 z-20 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-xl shadow-2xl"
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
