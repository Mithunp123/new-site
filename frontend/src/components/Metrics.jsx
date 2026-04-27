import React, { useEffect, useRef, useState } from 'react';
import CountUpModule from 'react-countup';

// Handle ESM/CJS interop for react-countup
const CountUp = CountUpModule.default || CountUpModule;

const Metrics = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: 0, suffix: '%', label: 'Payment Defaults' },
    { value: 24, suffix: '-Hour', label: 'Payouts' },
    { value: 100, suffix: '+', label: 'Verified Brands' },
    { value: 10, suffix: 'k+', label: 'Active Creators' },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16 fade-up">
          <h2 className="text-4xl md:text-[64px] leading-tight text-[var(--color-navy)] mb-4">
            Built for Scale.<br/>Backed by Trust.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className="bg-white border border-[var(--color-blue)]/20 p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(26,107,255,0.1)] transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center fade-up"
            >
              <div className="text-5xl font-heading font-bold text-[var(--color-blue)] mb-2 flex items-center">
                {isVisible ? (
                  <CountUp end={stat.value} duration={2.5} separator="," />
                ) : '0'}
                <span>{stat.suffix}</span>
              </div>
              <p className="text-[var(--color-text)] font-medium text-lg">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Metrics;
