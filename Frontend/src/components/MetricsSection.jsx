import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

const CountUp = ({ start, end, duration, formatValue }) => {
  const [value, setValue] = useState(start);
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "0px 0px -50px 0px" });

  useEffect(() => {
    if (!inView) return;

    let startTime = null;
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = start + (end - start) * easedProgress;
      
      setValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setValue(end);
      }
    };

    requestAnimationFrame(animateCount);
  }, [inView, start, end, duration]);

  return <span ref={nodeRef}>{formatValue ? formatValue(Math.round(value)) : Math.round(value)}</span>;
};

const MetricsSection = () => {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "0px 0px -100px 0px" });

  const gridBackground = {
    backgroundImage: `
      linear-gradient(to right, rgba(26,107,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(26,107,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px'
  };

  const cardsData = [
    {
      label: "Payment\nDefaults",
      start: 18,
      end: 0,
      duration: 1200,
      suffix: "%",
      accentOn: "0",
      desc: "Every payout secured in escrow before work begins."
    },
    {
      label: "Payout\nSpeed",
      start: 72,
      end: 24,
      duration: 1400,
      suffix: "-Hour",
      accentOn: "24",
      desc: "Instant release the moment a brand approves content.",
      accentColor: "#0A1628" // default is #1A6BFF, this one is different based on prompt
    },
    {
      label: "Verified\nBrands",
      start: 0,
      end: 100,
      duration: 1600,
      suffix: "+",
      accentOn: "100",
      desc: "KYC-verified D2C brands across every major category."
    },
    {
      label: "Active\nCreators",
      start: 0,
      end: 10,
      duration: 1800,
      suffix: "k+",
      accentOn: "10",
      desc: "Creators earning consistently with zero payment risk."
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative w-full bg-[#FFFFFF] py-24 overflow-hidden" 
      style={gridBackground}
    >
      {/* Soft Radial Glow Orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#1A6BFF] rounded-full blur-[150px] opacity-[0.07] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#00D4FF] rounded-full blur-[150px] opacity-[0.07] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* TOP SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <div className="inline-block border border-[rgba(26,107,255,0.3)] rounded-[20px] px-[14px] py-[6px] mb-[18px]">
              <span className="text-[11px] tracking-[0.32em] uppercase text-[#1A6BFF] font-medium">
                Platform Metrics
              </span>
            </div>
            <h2 className="font-['Playfair_Display'] text-[54px] font-normal text-[#0A1628] leading-[1.1]">
              Built for Scale.<br/>
              Backed by <span className="italic text-[#1A6BFF]">Trust.</span>
            </h2>
          </div>
          <p className="max-w-[220px] text-left md:text-right text-[13px] text-[#8A96B0] leading-[1.7] pb-2">
            Real numbers from live campaigns running on Gradix today.
          </p>
        </div>

        {/* STATS CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
          {cardsData.map((card, idx) => {
            return (
              <div
                key={idx}
                className={`
                  relative overflow-hidden group
                  transition-all duration-300 ease-out
                  bg-[#F8FAFF] border border-[#E0E8FF] rounded-[24px]
                  hover:bg-[#EEF4FF] hover:-translate-y-1 hover:border-[#1A6BFF]
                  hover:shadow-[0_4px_20px_rgba(26,107,255,0.1)] hover:z-10
                `}
              >
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 + idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="relative p-[40px_32px_36px] h-full flex flex-col"
                >
                  {/* Top-right corner bracket */}
                  <div className="absolute top-[32px] right-[32px] w-[26px] h-[26px] border-t-[2px] border-r-[2px] border-[#C8D8FF] opacity-50 group-hover:border-[#1A6BFF] transition-colors duration-300" />

                  <div className="relative z-10 flex flex-col h-full min-h-[260px]">
                    <h3 className="text-[11px] tracking-[0.24em] uppercase text-[#8A96B0] mb-8 whitespace-pre-line leading-[1.6]">
                      {card.label}
                    </h3>
                    
                    <div className="font-['Playfair_Display'] text-[56px] font-normal leading-[1] mb-5 tracking-tight flex flex-col items-start">
                      <div className="flex items-baseline">
                        <span 
                          className="transition-colors duration-300" 
                          style={{ color: card.accentColor || '#1A6BFF' }}
                        >
                          <CountUp 
                            start={card.start} 
                            end={card.end} 
                            duration={card.duration} 
                          />
                        </span>
                        {card.suffix !== '-Hour' && (
                          <span className="text-[#0A1628]">{card.suffix}</span>
                        )}
                        {card.suffix === '-Hour' && (
                          <span className="text-[#0A1628]">-</span>
                        )}
                      </div>
                      {card.suffix === '-Hour' && (
                        <span className="text-[#0A1628]">Hour</span>
                      )}
                    </div>

                    <p className="text-[13px] text-[#5A6480] leading-[1.6]">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>

                {/* Blue-to-cyan gradient bar on hover */}
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#1A6BFF] to-[#00D4FF] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out z-20" />
              </div>
            );
          })}
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A6BFF] animate-pulse shadow-[0_0_8px_rgba(26,107,255,0.6)]" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#8A96B0] font-medium">Live Data</span>
          </div>
          
          <div className="flex-grow h-[2px] bg-[#E0E8FF] rounded-[2px] overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={inView ? { width: '78%' } : { width: '0%' }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
              className="h-full bg-[#1A6BFF]"
            />
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A6BFF] animate-pulse shadow-[0_0_8px_rgba(26,107,255,0.6)]" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#8A96B0] font-medium">Updated Now</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MetricsSection;
