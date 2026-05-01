import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MetricsSection from '../components/MetricsSection';
import ProblemSolution from '../components/ProblemSolution';
import DualPropSection from '../components/DualPropSection';
import BentoGrid from '../components/BentoGrid';
import HowItWorks from '../components/HowItWorks';
import FAQ from '../components/FAQ';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import MagicRings from '../components/MagicRings';
import { initScrollAnimations } from '../utils/animations';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

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
      <Navbar onLoginClick={() => navigate('/login')} />
      <main className="w-full overflow-x-hidden">
        <div className="snap-start w-full">
          <Hero onRegisterClick={() => navigate('/register')} />
        </div>
        <div className="snap-start w-full">
          <MetricsSection />
        </div>
        <div className="relative snap-start w-full">
          <div className="absolute inset-0 pointer-events-none z-0">
            <MagicRings opacity={0.4} />
          </div>
          <div className="relative z-10">
            <ProblemSolution />
          </div>
        </div>
        <div className="snap-start w-full">
          <DualPropSection />
        </div>
        <div className="snap-start w-full">
          <BentoGrid />
        </div>
        <div className="snap-start w-full">
          <HowItWorks />
        </div>
        <div className="snap-start w-full">
          <FAQ />
        </div>
        <div className="snap-start w-full bg-[var(--color-bg-alt)]">
          <FinalCTA onRegisterClick={() => navigate('/register')} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
