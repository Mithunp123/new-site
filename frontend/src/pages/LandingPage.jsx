import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProblemSolution from '../components/ProblemSolution';
import HowItWorks from '../components/HowItWorks';
import MetricsSection from '../components/MetricsSection';
import DualPropSection from '../components/DualPropSection';
import BentoGrid from '../components/BentoGrid';
import FAQ from '../components/FAQ';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import MagicRings from '../components/MagicRings';

import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[var(--color-navy)] min-h-screen text-white overflow-x-hidden">
      <Navbar onLoginClick={() => navigate('/login')} />

      <main>
        <Hero onRegisterClick={() => navigate('/register')} />
        <div className="relative">
          <MagicRings />
          <ProblemSolution />
        </div>
        <HowItWorks />
        <MetricsSection />
        <DualPropSection />
        <BentoGrid />
        <FAQ />
        <FinalCTA onRegisterClick={() => navigate('/register')} />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
