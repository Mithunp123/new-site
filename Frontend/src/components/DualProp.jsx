import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const DualProp = () => {
  const cardsRef = useRef([]);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(cardsRef.current, 
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsRef.current[0],
            start: 'top 80%',
          }
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12 text-center mb-16 fade-up">
        <h2 className="text-4xl md:text-5xl text-[var(--color-navy)] mb-4">
          Engineered for Both Sides of the Lens.
        </h2>
        <p className="text-xl text-[var(--color-text)]/80 max-w-2xl mx-auto">
          Stop worrying about the logistics. Focus on what you do best.
        </p>
      </div>

      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Creator Card */}
          <div 
            ref={el => cardsRef.current[0] = el}
            className="flex-1 min-h-[600px] bg-[var(--color-navy)] rounded-3xl p-10 md:p-14 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(26,107,255,0.3)]"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-blue)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-semibold tracking-wider uppercase mb-8">
                For Creators
              </div>
              <h3 className="text-4xl md:text-5xl text-white mb-8">Your Digital Office</h3>
              
              <ul className="space-y-6">
                {['Invoice tracking & automated follow-ups', 'Escrow protection before you post', 'Professional profile & media kit hosting', 'Real-time analytics dashboard'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-white/80 text-lg">
                    <CheckCircle2 className="text-[var(--color-blue-light)] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative z-10 mt-12">
              <button className="px-8 py-4 bg-white text-[var(--color-navy)] font-bold rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto">
                Join as Creator
              </button>
            </div>
          </div>

          {/* Brand Card */}
          <div 
            ref={el => cardsRef.current[1] = el}
            className="flex-1 min-h-[600px] bg-white border-2 border-[var(--color-border)] rounded-3xl p-10 md:p-14 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(26,107,255,0.15)] hover:border-[var(--color-blue)]/30"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-bl from-[var(--color-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-navy)]/5 text-[var(--color-navy)] text-sm font-semibold tracking-wider uppercase mb-8">
                For Brands
              </div>
              <h3 className="text-4xl md:text-5xl text-[var(--color-navy)] mb-8">Your ROI Command Center</h3>
              
              <ul className="space-y-6">
                {['AI-driven creator discovery', 'End-to-end campaign management', 'Automated escrow payment milestones', 'Real-time ROI & conversion reports'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-[var(--color-text)] text-lg">
                    <CheckCircle2 className="text-[var(--color-blue)] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative z-10 mt-12">
              <button className="px-8 py-4 bg-[var(--color-navy)] text-white font-bold rounded-lg hover:bg-[var(--color-blue)] transition-colors w-full sm:w-auto">
                Join as Brand
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DualProp;
