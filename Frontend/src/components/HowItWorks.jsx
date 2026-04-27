import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Handshake, PlayCircle, BadgeCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks = () => {
  const lineRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(lineRef.current,
        { width: '0%' },
        {
          width: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: '#timeline-container',
            start: 'top center',
            end: 'bottom center',
            scrub: 1
          }
        }
      );
    });
    return () => ctx.revert();
  }, []);

  const steps = [
    {
      icon: <Handshake size={32} className="text-[var(--color-blue)]" />,
      title: "Deal Locked",
      desc: "Brand deposits funds into secure escrow. Creator starts work with peace of mind."
    },
    {
      icon: <PlayCircle size={32} className="text-[var(--color-blue)]" />,
      title: "Content Goes Live",
      desc: "Creator delivers content. Brand reviews and approves via the platform."
    },
    {
      icon: <BadgeCheck size={32} className="text-[var(--color-blue)]" />,
      title: "Payout Released",
      desc: "Funds instantly transfer to the creator's account. Zero delays, zero fees."
    }
  ];

  return (
    <section className="py-24 bg-[var(--color-bg-alt)]">
      <div className="container mx-auto px-6 md:px-12 text-center mb-20 fade-up">
        <h2 className="text-4xl md:text-5xl text-[var(--color-navy)] mb-4">
          The Gradix Escrow Guarantee.
        </h2>
        <p className="text-xl text-[var(--color-text)]/70 max-w-2xl mx-auto">
          Three simple steps to secure every single collaboration.
        </p>
      </div>

      <div id="timeline-container" className="container mx-auto px-6 md:px-12 max-w-5xl relative">
        {/* Animated Connector Line */}
        <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 bg-white border border-[var(--color-border)] rounded-full overflow-hidden z-0">
          <div ref={lineRef} className="h-full bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-accent)] w-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.2, type: 'spring', bounce: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-8 relative border-4 border-[var(--color-bg-alt)]">
                {step.icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--color-navy)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-navy)] mb-4">{step.title}</h3>
              <p className="text-[var(--color-text)]/80 text-lg leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
