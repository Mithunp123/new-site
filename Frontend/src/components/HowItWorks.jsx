import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, Zap, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <UserCheck size={32} className="text-[var(--color-blue)]" />,
      number: "01",
      title: "Verified Onboarding",
      desc: "Both creators and brands undergo a strict verification process to ensure authenticity and quality on the platform.",
      color: "bg-blue-50"
    },
    {
      icon: <ShieldCheck size={32} className="text-[var(--color-blue)]" />,
      number: "02",
      title: "Secure Escrow",
      desc: "Once a deal is made, funds are deposited into our secure escrow vault, guaranteeing payment for creators upon delivery.",
      color: "bg-indigo-50"
    },
    {
      icon: <Zap size={32} className="text-[var(--color-blue)]" />,
      number: "03",
      title: "Instant Release",
      desc: "Upon content approval, funds are instantly released to the creator. No more chasing invoices or delayed payouts.",
      color: "bg-cyan-50"
    }
  ];

  return (
    <section className="relative py-24 bg-white overflow-hidden w-full">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[var(--color-blue)]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[var(--color-accent)]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-6 md:px-12 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[var(--color-blue)] font-bold tracking-[0.2em] text-xs uppercase mb-4 block">Process</span>
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] text-[var(--color-navy)] mb-6">
              Simplifying Trust in Every Collaboration.
            </h2>
            <p className="text-lg text-[var(--color-text)]/70">
              A streamlined, three-step workflow designed to protect your interests and let you focus on what you do best.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="relative group p-10 bg-white border border-[var(--color-border)] rounded-[32px] hover:border-[var(--color-blue)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(26,107,255,0.08)]"
            >
              {/* Step Number Background */}
              <div className="absolute top-8 right-8 text-8xl font-black text-slate-50 select-none group-hover:text-blue-50/50 transition-colors duration-300">
                {step.number}
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-[var(--color-navy)] mb-4">
                  {step.title}
                </h3>
                
                <p className="text-[var(--color-text)]/70 leading-relaxed mb-8 flex-grow">
                  {step.desc}
                </p>

                <div className="flex items-center text-[var(--color-blue)] font-bold text-sm gap-2 group/btn cursor-pointer">
                  Learn More 
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

