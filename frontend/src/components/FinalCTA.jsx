import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const FinalCTA = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Canvas particles animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        vx: Math.random() * 0.5 - 0.25,
        vy: Math.random() * -0.5 - 0.1,
        opacity: Math.random() * 0.5 + 0.1
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 107, 255, ${p.opacity})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // GSAP parallax on hover
    const handleMouseMove = (e) => {
      if(!containerRef.current) return;
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 20;
      const yPos = (clientY / window.innerHeight - 0.5) * 20;

      gsap.to('.cta-bg-panel', {
        x: xPos,
        y: yPos,
        duration: 1,
        ease: "power2.out",
        stagger: 0.05
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative py-20 bg-[var(--color-navy)] overflow-hidden flex items-center justify-center w-full">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-50"></canvas>
      
      {/* Background panels (blurred version of hero) */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-20 z-0 pointer-events-none">
        <div className="cta-bg-panel absolute w-64 h-96 bg-gradient-to-tr from-[var(--color-blue)] to-[var(--color-accent)] rounded-3xl blur-3xl mix-blend-screen" style={{ transform: 'rotate(-15deg) translate(-20%, -10%)' }}></div>
        <div className="cta-bg-panel absolute w-80 h-80 bg-gradient-to-bl from-[var(--color-blue-light)] to-transparent rounded-full blur-3xl mix-blend-screen" style={{ transform: 'translate(40%, 20%)' }}></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-[80px] leading-tight text-white mb-8"
        >
          Ready to Scale <br className="hidden md:block"/> Your Influence?
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-white/70 max-w-2xl mx-auto mb-12"
        >
          Join hundreds of creators and brands already doing business securely.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <button className="px-8 py-4 bg-[var(--color-blue)] text-white font-bold rounded hover:bg-[var(--color-blue-light)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(26,107,255,0.4)]">
            Create Free Account
          </button>
          <button className="px-8 py-4 bg-white text-[var(--color-navy)] font-bold rounded hover:bg-gray-100 transition-all hover:scale-105">
            Talk to Sales
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
