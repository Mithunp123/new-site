import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "How does escrow work on Gradix?",
    a: "When a brand and creator agree to terms, the brand deposits the full campaign budget into a secure Gradix escrow account. The funds are held there until the creator delivers the agreed-upon content. Once approved, funds are automatically released to the creator."
  },
  {
    q: "What are the platform fees?",
    a: "Gradix charges a flat 5% fee on transactions, split between the brand (3%) and the creator (2%). This covers escrow management, contract generation, and instant payouts. There are no monthly subscription fees to join."
  },
  {
    q: "How fast are payouts processed?",
    a: "Payouts are processed instantly upon brand approval. Depending on your connected payout method (Stripe, Bank Transfer, PayPal), funds typically arrive in your account within 24 hours."
  },
  {
    q: "Is my data and payment info secure?",
    a: "Absolutely. We use bank-level encryption and partner with industry-leading payment processors like Stripe. We never store your raw banking details on our servers."
  },
  {
    q: "Can I use Gradix as both a brand and a creator?",
    a: "Yes! You can manage both brand campaigns and creator collaborations from a single account using our unified dashboard."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="text-center mb-16 fade-up">
          <h2 className="text-4xl md:text-5xl text-[var(--color-navy)]">
            Frequently Asked Questions.
          </h2>
        </div>

        <div className="space-y-4 fade-up">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[var(--color-blue)] shadow-md' : 'border-[var(--color-border)] hover:border-gray-300'}`}
              >
                <button
                  className="w-full px-8 py-6 text-left flex justify-between items-center bg-white"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                >
                  <span className={`text-lg md:text-xl font-bold transition-colors ${isOpen ? 'text-[var(--color-blue)]' : 'text-[var(--color-navy)]'}`}>
                    {faq.q}
                  </span>
                  <ChevronDown 
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--color-blue)]' : 'text-gray-400'}`} 
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-8 pb-6 text-[var(--color-text)]/80 text-lg leading-relaxed relative">
                        <div className="absolute left-0 top-0 bottom-6 w-1 bg-[var(--color-blue)]"></div>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
