import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  ['How does escrow work on Gradix?', 'The brand deposits the campaign budget before production begins. Gradix holds the funds through delivery and releases payout when the agreed milestone is approved.'],
  ['What are the platform fees?', 'Gradix uses a transaction-based model for escrow, workflow, contract, and payout infrastructure. Teams can start without a complex subscription motion.'],
  ['How fast are payouts processed?', 'Approved work moves into payout immediately. Arrival time depends on the connected payout method, but the creator no longer has to chase an invoice manually.'],
  ['Is payment and campaign data secure?', 'Gradix is structured around verified profiles, protected payment flows, and shared campaign records so both sides can work with confidence.'],
  ['Can one account be both brand and creator?', 'Yes. A single account can support both modes, which is useful for agencies, founder-led brands, and creators who also run product collaborations.'],
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#F7FAFF] py-24 md:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,107,255,.055)_1px,transparent_1px),linear-gradient(rgba(26,107,255,.045)_1px,transparent_1px)] [background-size:88px_88px]" />
      <div className="relative z-10 mx-auto grid max-w-[1180px] gap-12 px-6 sm:px-8 lg:grid-cols-[0.72fr_1.28fr]">
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="mb-7 block text-xs font-semibold uppercase tracking-[0.34em] text-[#1A6BFF]">
            Questions
          </span>
          <h2 className="font-['Playfair_Display'] text-[52px] leading-[0.98] text-[#0A1628] sm:text-[74px]">
            Clear terms make better collaborations.
          </h2>
        </motion.div>

        <div className="border-t border-[#C9D7F5]">
          {faqs.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={question}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: index * 0.06 }}
                className="border-b border-[#C9D7F5]"
              >
                <button
                  className="flex w-full items-center justify-between gap-8 py-7 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span className={`text-2xl font-semibold transition-colors md:text-3xl ${isOpen ? 'text-[#1A6BFF]' : 'text-[#0A1628]'}`}>
                    {question}
                  </span>
                  <ChevronDown className={`shrink-0 text-[#1A6BFF] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: 'easeOut' }}
                    >
                      <p className="max-w-3xl pb-8 text-lg leading-8 text-[#5A6480]">{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
