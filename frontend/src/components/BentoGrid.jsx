import React, { useEffect, useRef } from 'react';
import { ShieldCheck, LineChart, Radar, Zap, Quote } from 'lucide-react';
import { gsap } from 'gsap';

const BentoGrid = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Hover animations handled via CSS group-hover, but we can add small GSAP tweaks if needed
  }, []);

  return (
    <section className="py-24 bg-[var(--color-bg-alt)]">
      <div className="container mx-auto px-6 md:px-12 text-center mb-16 fade-up">
        <h2 className="text-4xl md:text-5xl text-[var(--color-navy)] mb-4">
          A Complete Operating System for Modern Marketing.
        </h2>
      </div>

      <div ref={containerRef} className="container mx-auto px-6 md:px-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-6 auto-rows-[250px]">
          
          {/* Tile 1: LARGE (spans 2 cols, 2 rows) */}
          <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 border border-[var(--color-border)] hover:border-[var(--color-blue)]/50 hover:shadow-[0_10px_40px_rgba(26,107,255,0.1)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col fade-up">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <ShieldCheck className="text-[var(--color-blue)] w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-navy)] mb-4">Ironclad Escrow Security</h3>
            <p className="text-[var(--color-text)]/70 text-lg flex-1">
              Funds are verified and held securely before any content is created. Smart contracts automatically release payment only when agreed milestones are hit.
            </p>
            <div className="mt-8 h-32 w-full bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
               {/* Vault door animation representation */}
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center relative group-hover:border-[var(--color-blue)] transition-colors duration-700">
                    <div className="w-8 h-8 bg-slate-200 rounded-full group-hover:bg-[var(--color-blue)] transition-colors duration-700 delay-100"></div>
                 </div>
               </div>
            </div>
          </div>

          {/* Tile 2: MEDIUM */}
          <div className="md:col-span-2 md:row-span-1 bg-[var(--color-navy)] rounded-3xl p-8 border border-white/10 hover:shadow-[0_10px_40px_rgba(26,107,255,0.2)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between fade-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Real-Time ROI Tracking</h3>
                <p className="text-white/60">Live metrics mapped to your bottom line.</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <LineChart className="text-white w-6 h-6" />
              </div>
            </div>
            <div className="mt-6 h-16 w-full relative">
              {/* SVG Line chart drawn on hover */}
              <svg viewBox="0 0 200 50" className="w-full h-full stroke-[var(--color-accent)] fill-none stroke-2">
                <path d="M0,50 L40,30 L80,40 L120,15 L160,25 L200,5" className="[stroke-dasharray:300] [stroke-dashoffset:300] group-hover:[stroke-dashoffset:0] transition-all duration-1000 ease-out" />
              </svg>
            </div>
          </div>

          {/* Tile 3: MEDIUM */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 border border-[var(--color-border)] hover:border-[var(--color-blue)]/50 hover:shadow-[0_10px_40px_rgba(26,107,255,0.1)] transition-all duration-300 hover:-translate-y-1 group flex flex-col fade-up">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 relative">
              <Radar className="text-[var(--color-blue)] w-6 h-6 relative z-10" />
              <div className="absolute inset-0 bg-blue-200 rounded-xl animate-ping opacity-0 group-hover:opacity-30"></div>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-navy)] mb-2">Smart Discovery</h3>
            <p className="text-[var(--color-text)]/70 text-sm">Find creators perfectly matched to your audience DNA.</p>
          </div>

          {/* Tile 4: SMALL */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 border border-[var(--color-border)] hover:border-[var(--color-blue)]/50 hover:shadow-[0_10px_40px_rgba(26,107,255,0.1)] transition-all duration-300 hover:-translate-y-1 group flex flex-col fade-up">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4 overflow-hidden relative">
              <Zap className="text-yellow-500 w-6 h-6 relative z-10 group-hover:text-yellow-400" />
              <div className="absolute top-0 left-0 w-full h-full bg-yellow-200 opacity-0 group-hover:opacity-40 -translate-x-full group-hover:translate-x-full transition-all duration-500 skew-x-12"></div>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-navy)] mb-2">Instant Payouts</h3>
            <p className="text-[var(--color-text)]/70 text-sm">Zero delay once the milestone is hit.</p>
          </div>

          {/* Tile 5: TALL (spans 1 col, 2 rows, might adjust based on layout, here spans remaining space) */}
          <div className="md:col-span-4 lg:col-span-2 md:row-span-1 bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-navy)] rounded-3xl p-8 shadow-lg hover:shadow-[0_10px_40px_rgba(26,107,255,0.3)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden fade-up flex items-center">
            <Quote className="absolute right-4 top-4 w-24 h-24 text-white/10 rotate-12" />
            <div className="relative z-10">
              <p className="text-white/90 text-xl md:text-2xl font-heading italic mb-6">
                "Gradix completely changed how we run campaigns. We scaled from 10 to 150 creators a month because the financial risk was removed."
              </p>
              <div className="flex items-center gap-4">
                <img src="https://i.pravatar.cc/100?img=47" alt="User" className="w-12 h-12 rounded-full border-2 border-white/20" />
                <div>
                  <h4 className="text-white font-bold">Sarah Jenkins</h4>
                  <p className="text-white/60 text-sm">CMO, Lumina Cosmetics</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BentoGrid;
