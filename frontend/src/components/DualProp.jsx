import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle2, ArrowRight } from 'lucide-react';

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
          duration: 1,
          stagger: 0.3,
          ease: 'power4.out',
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
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--color-blue-light)]/10 rounded-full blur-[100px] mix-blend-multiply animate-float pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--color-accent)]/10 rounded-full blur-[120px] mix-blend-multiply animate-float-delayed pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[var(--color-blue)]/5 to-transparent rounded-full blur-[150px] animate-float-slow pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 text-center mb-20 relative z-10 fade-up">
        <h2 className="text-4xl md:text-6xl text-[var(--color-navy)] mb-6 font-medium tracking-tight">
          Engineered for Both Sides of the Lens.
        </h2>
        <p className="text-xl md:text-2xl text-[var(--color-text)]/70 max-w-2xl mx-auto font-light">
          Stop worrying about the logistics. Focus on what you do best.
        </p>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-7xl mx-auto">
          
          {/* Creator Card */}
          <div 
            ref={el => cardsRef.current[0] = el}
            className="flex-1 min-h-[600px] rounded-[2.5rem] p-10 md:p-14 flex flex-col justify-between relative overflow-hidden group transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(26,107,255,0.2)] bg-gradient-to-br from-[#0A1628] via-[#0D1F3A] to-[#0A1628] border border-white/10"
          >
            {/* Inner glowing accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-accent)] opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-[50%] -right-[50%] w-[100%] h-[100%] bg-[var(--color-blue)]/20 blur-[100px] rounded-full group-hover:bg-[var(--color-blue)]/30 transition-colors duration-700 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/90 text-sm font-semibold tracking-wide uppercase mb-10 group-hover:bg-white/10 transition-colors">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]"></span>
                For Creators
              </div>
              <h3 className="text-4xl md:text-5xl text-white mb-10 font-medium leading-tight">Your Digital<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Office</span></h3>
              
              <ul className="space-y-6">
                {['Invoice tracking & automated follow-ups', 'Escrow protection before you post', 'Professional profile & media kit hosting', 'Real-time analytics dashboard'].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-white/80 text-lg group-hover:text-white transition-colors duration-300">
                    <CheckCircle2 className="text-[var(--color-accent)] flex-shrink-0 w-6 h-6 mt-0.5 drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative z-10 mt-14">
              <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-[var(--color-navy)] font-bold rounded-xl hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Join as Creator
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Brand Card */}
          <div 
            ref={el => cardsRef.current[1] = el}
            className="flex-1 min-h-[600px] rounded-[2.5rem] p-10 md:p-14 flex flex-col justify-between relative overflow-hidden group transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-gradient-to-br from-white to-[#F8FAFF] border border-[var(--color-border)] hover:border-[var(--color-blue)]/30"
          >
            {/* Inner glowing accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-blue)] opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -bottom-[50%] -left-[50%] w-[100%] h-[100%] bg-[var(--color-blue)]/5 blur-[100px] rounded-full group-hover:bg-[var(--color-blue)]/10 transition-colors duration-700 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-navy)]/5 border border-[var(--color-navy)]/10 text-[var(--color-navy)] text-sm font-semibold tracking-wide uppercase mb-10 group-hover:bg-[var(--color-navy)]/10 transition-colors">
                <span className="w-2 h-2 rounded-full bg-[var(--color-blue)] shadow-[0_0_10px_var(--color-blue)]"></span>
                For Brands
              </div>
              <h3 className="text-4xl md:text-5xl text-[var(--color-navy)] mb-10 font-medium leading-tight">Your ROI<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Command Center</span></h3>
              
              <ul className="space-y-6">
                {['AI-driven creator discovery', 'End-to-end campaign management', 'Automated escrow payment milestones', 'Real-time ROI & conversion reports'].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-[var(--color-text)]/80 text-lg group-hover:text-[var(--color-text)] transition-colors duration-300">
                    <CheckCircle2 className="text-[var(--color-blue)] flex-shrink-0 w-6 h-6 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative z-10 mt-14">
              <button className="flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-navy)] text-white font-bold rounded-xl hover:bg-[var(--color-blue)] hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto shadow-[0_10px_30px_rgba(10,22,40,0.2)] hover:shadow-[0_10px_40px_rgba(26,107,255,0.4)]">
                Join as Brand
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DualProp;
