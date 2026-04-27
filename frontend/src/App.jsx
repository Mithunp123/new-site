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
      <main className="w-full overflow-x-hidden">
        <section className="snap-start w-full h-screen">
          <Hero />
        </section>
        <section className="snap-start w-full min-h-screen flex items-center justify-center">
          <MetricsSection />
        </section>
        <section className="snap-start w-full min-h-screen flex items-center justify-center">
          <ProblemSolution />
        </section>
        <section className="snap-start w-full min-h-screen flex items-center justify-center">
          <DualProp />
        </section>
        <section className="snap-start w-full min-h-screen flex items-center justify-center">
          <BentoGrid />
        </section>
        <section className="snap-start w-full min-h-screen flex items-center justify-center">
          <HowItWorks />
        </section>
        <section className="snap-start w-full min-h-screen flex items-center justify-center">
          <FAQ />
        </section>
        <section className="snap-start w-full min-h-screen flex items-center justify-center bg-[var(--color-bg-alt)]">
          <FinalCTA />
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default App;
