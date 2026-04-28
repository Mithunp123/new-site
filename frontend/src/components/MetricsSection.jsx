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
      radial-gradient(circle at 3% 0%, rgba(26,107,255,0.08), transparent 30%),
      radial-gradient(circle at 92% 92%, rgba(0,212,255,0.11), transparent 28%),
      linear-gradient(to right, rgba(26,107,255,0.055) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(26,107,255,0.055) 1px, transparent 1px)
    `,
    backgroundSize: 'auto, auto, 96px 96px, 96px 96px'
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
      className="relative flex min-h-[100svh] w-full items-center bg-[#FFFFFF] py-20 md:py-28 overflow-hidden" 
      style={gridBackground}
    >
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative z-10">
        
        {/* TOP SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-10">
          <div>
            <div className="inline-block border border-[rgba(26,107,255,0.34)] rounded-full px-6 py-2.5 mb-7 bg-white/40">
              <span className="text-[12px] tracking-[0.42em] uppercase text-[#1A6BFF] font-medium">
                Platform Metrics
              </span>
            </div>
            <h2 className="font-['Playfair_Display'] text-[48px] sm:text-[62px] lg:text-[76px] font-normal text-[#0A1628] leading-[0.98] tracking-[-0.01em]">
              Built for Scale.<br/>
              <span className="italic text-[#1A6BFF]">Backed by Trust.</span>
            </h2>
          </div>
          <p className="max-w-[330px] text-left md:text-center text-[17px] md:text-[20px] text-[#8A96B0] leading-[1.8] pb-6">
            Real numbers from live campaigns running on Gradix today.
          </p>
        </div>

        {/* STATS CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-2 w-full">
          {cardsData.map((card, idx) => {
            return (
              <div
                key={idx}
                className={`
                  relative overflow-hidden group
                  transition-all duration-300 ease-out
                  bg-[#F8FAFF] border border-[#DCE6FF]
                  rounded-[24px] lg:rounded-[4px]
                  ${idx === 0 ? 'lg:rounded-l-[26px]' : ''}
                  ${idx === cardsData.length - 1 ? 'lg:rounded-r-[26px]' : ''}
                  hover:bg-[#EEF4FF] hover:-translate-y-1 hover:border-[#1A6BFF]
                  hover:shadow-[0_4px_20px_rgba(26,107,255,0.1)] hover:z-10
                `}
              >
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 + idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="relative p-[36px_30px_40px] md:p-[48px_44px_52px] h-full flex flex-col"
                >
                  {/* Top-right corner bracket */}
                  <div className="absolute top-[34px] right-[34px] md:top-[38px] md:right-[38px] w-[28px] h-[28px] md:w-[34px] md:h-[34px] border-t-[2px] border-r-[2px] border-[#C8D8FF] opacity-80 group-hover:border-[#1A6BFF] transition-colors duration-300" />

                  <div className="relative z-10 flex flex-col h-full min-h-[280px] md:min-h-[350px]">
                    <h3 className="text-[13px] md:text-[16px] tracking-[0.3em] md:tracking-[0.34em] uppercase text-[#8A96B0] mb-10 md:mb-12 whitespace-pre-line leading-[1.25] md:leading-[1.2]">
                      {card.label}
                    </h3>
                    
                    <div className="font-['Playfair_Display'] text-[68px] sm:text-[76px] lg:text-[82px] font-normal leading-[1] mb-6 tracking-tight flex flex-col items-start">
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

                    <p className="text-[15px] md:text-[18px] text-[#5A6480] leading-[1.65]">
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
        <div className="mt-12 md:mt-16 flex flex-row items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-2 md:gap-4 whitespace-nowrap">
            <span className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-[#1A6BFF] animate-pulse shadow-[0_0_8px_rgba(26,107,255,0.6)]" />
            <span className="text-[10px] sm:text-[12px] md:text-[18px] tracking-[0.18em] md:tracking-[0.22em] uppercase text-[#8A96B0] font-medium">Live Data</span>
          </div>
          
          <div className="flex-grow h-[2px] bg-[#E0E8FF] rounded-[2px] overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={inView ? { width: '78%' } : { width: '0%' }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
              className="h-full bg-gradient-to-r from-[#1A6BFF] to-[#00D4FF]"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4 whitespace-nowrap">
            <span className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-[#1A6BFF] animate-pulse shadow-[0_0_8px_rgba(26,107,255,0.6)]" />
            <span className="text-[10px] sm:text-[12px] md:text-[18px] tracking-[0.18em] md:tracking-[0.22em] uppercase text-[#8A96B0] font-medium">Updated Now</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MetricsSection;
