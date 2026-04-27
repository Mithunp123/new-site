import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
        <a href="/" className="flex items-center gap-1">
          <span className={`text-2xl font-bold tracking-widest font-heading ${scrolled ? 'text-[var(--color-navy)]' : 'text-white'}`}>GRADIX</span>
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] mb-3"></span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#creators" className={`text-sm font-medium hover:text-[var(--color-blue)] transition-colors ${scrolled ? 'text-[var(--color-text)]' : 'text-white/90'}`}>Creators</a>
          <a href="#brands" className={`text-sm font-medium hover:text-[var(--color-blue)] transition-colors ${scrolled ? 'text-[var(--color-text)]' : 'text-white/90'}`}>Brands</a>
          <a href="#pricing" className={`text-sm font-medium hover:text-[var(--color-blue)] transition-colors ${scrolled ? 'text-[var(--color-text)]' : 'text-white/90'}`}>Pricing</a>
          <a href="#about" className={`text-sm font-medium hover:text-[var(--color-blue)] transition-colors ${scrolled ? 'text-[var(--color-text)]' : 'text-white/90'}`}>About</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="#login" className={`text-sm font-medium hover:opacity-70 transition-opacity ${scrolled ? 'text-[var(--color-navy)]' : 'text-white'}`}>Log In</a>
          <a href="#get-started" className="px-5 py-2.5 bg-[var(--color-blue)] text-white text-sm font-semibold rounded hover:bg-[var(--color-blue-light)] transition-colors">Get Started</a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X color={scrolled ? '#000' : '#fff'} /> : <Menu color={scrolled ? '#000' : '#fff'} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-lg py-6 flex flex-col items-center gap-6 md:hidden"
          >
            <a href="#creators" className="text-lg text-[var(--color-text)] font-medium" onClick={() => setMobileMenuOpen(false)}>Creators</a>
            <a href="#brands" className="text-lg text-[var(--color-text)] font-medium" onClick={() => setMobileMenuOpen(false)}>Brands</a>
            <a href="#pricing" className="text-lg text-[var(--color-text)] font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#about" className="text-lg text-[var(--color-text)] font-medium" onClick={() => setMobileMenuOpen(false)}>About</a>
            <div className="flex flex-col items-center gap-4 w-full px-6 mt-4">
              <a href="#login" className="w-full text-center py-3 border border-[var(--color-border)] rounded text-[var(--color-navy)] font-medium" onClick={() => setMobileMenuOpen(false)}>Log In</a>
              <a href="#get-started" className="w-full text-center py-3 bg-[var(--color-blue)] text-white rounded font-medium" onClick={() => setMobileMenuOpen(false)}>Get Started</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
