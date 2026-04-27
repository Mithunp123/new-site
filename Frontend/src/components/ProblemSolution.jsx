import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileWarning, Ghost, Unlock, FileCheck, Users, Lock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const ProblemSolution = () => {
  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
          end: 'center center',
          scrub: 1,
        }
      });

      tl.fromTo(leftPanelRef.current, { x: '-100%', opacity: 0 }, { x: '0%', opacity: 1 }, 0)
        .fromTo(rightPanelRef.current, { x: '100%', opacity: 0 }, { x: '0%', opacity: 1 }, 0);
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 bg-[var(--color-bg-alt)] overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 mb-16 text-center fade-up">
        <h2 className="text-4xl md:text-5xl text-[var(--color-navy)] mb-4 max-w-4xl mx-auto">
          End the Era of Unpaid Invoices and Ghosted Campaigns.
        </h2>
        <p className="text-lg md:text-xl text-[var(--color-text)]/70 max-w-2xl mx-auto">
          We are fixing the broken creator economy with absolute transparency, secure workflows, and guaranteed payments.
        </p>
      </div>

      <div ref={containerRef} className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl min-h-[500px]">
          {/* Left Panel - The Problem */}
          <div ref={leftPanelRef} className="flex-1 bg-[var(--color-navy)] p-12 md:p-16 flex flex-col justify-center border-r border-white/10">
            <h3 className="text-3xl text-white mb-10 font-heading">The Old Way</h3>
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <FileWarning className="text-red-400" size={28} />
                </div>
                <div>
                  <h4 className="text-xl text-white mb-2">Chasing Payments</h4>
                  <p className="text-white/60">Net-30 turns into Net-90. Endless follow-up emails for invoices that should have been paid weeks ago.</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Ghost className="text-red-400" size={28} />
                </div>
                <div>
                  <h4 className="text-xl text-white mb-2">Ghosted Campaigns</h4>
                  <p className="text-white/60">Creators deliver content but brands disappear, leaving them uncompensated and frustrated.</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Unlock className="text-red-400" size={28} />
                </div>
                <div>
                  <h4 className="text-xl text-white mb-2">Zero Security</h4>
                  <p className="text-white/60">Handshake deals in DMs offer no legal protection or guaranteed funds for either party.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - The Solution */}
          <div ref={rightPanelRef} className="flex-1 bg-white p-12 md:p-16 flex flex-col justify-center">
            <h3 className="text-3xl text-[var(--color-navy)] mb-10 font-heading">The Gradix Way</h3>
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="text-green-500" size={28} />
                </div>
                <div>
                  <h4 className="text-xl text-[var(--color-navy)] mb-2 font-bold">Guaranteed Payouts</h4>
                  <p className="text-[var(--color-text)]">Funds are locked in escrow upfront. When the work is approved, payment is instant.</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="text-green-500" size={28} />
                </div>
                <div>
                  <h4 className="text-xl text-[var(--color-navy)] mb-2 font-bold">Verified Partners</h4>
                  <p className="text-[var(--color-text)]">Work only with vetted brands and creators. Reputation scores keep everyone accountable.</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="text-green-500" size={28} />
                </div>
                <div>
                  <h4 className="text-xl text-[var(--color-navy)] mb-2 font-bold">Ironclad Contracts</h4>
                  <p className="text-[var(--color-text)]">Automated digital agreements bind the escrow terms, ensuring total security.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
