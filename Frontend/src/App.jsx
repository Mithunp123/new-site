import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MetricsSection from './components/MetricsSection';
import ProblemSolution from './components/ProblemSolution';
import DualProp from './components/DualProp';
import BentoGrid from './components/BentoGrid';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import { initScrollAnimations } from './utils/animations';

function App() {
  useEffect(() => {
    const cleanup = initScrollAnimations();
    
    // Refresh ScrollTrigger after a short delay to account for any layout shifts
    const timer = setTimeout(() => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    }, 500);

    return () => {
      cleanup();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative w-full bg-[var(--color-bg)]">
      <Navbar />
      <main>
        <Hero />
        <MetricsSection />
        <ProblemSolution />
        <DualProp />
        <BentoGrid />
        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
