import React, { useEffect, useRef, useState } from 'react';
import './DualPropSection.css';

const PARTICLE_COUNT = 55;
const CONNECT_DIST = 90;

function createParticle(w, h) {
  const colors = ['26,107,255', '0,212,255'];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1 + Math.random() * 2,
    dx: (Math.random() - 0.5) * 0.4,
    dy: (Math.random() - 0.5) * 0.4,
    alpha: 0.04 + Math.random() * 0.18,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

const DualPropSection = () => {
  const canvasRef = useRef(null);
  const gridRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const [active, setActive] = useState(false);

  /* ── Canvas animation ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const section = canvas.parentElement;
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
      // Re-init particles on resize
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas.width, canvas.height)
      );
    };

    resize();

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      // Move & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(26,107,255,${0.04 * (1 - dist / CONNECT_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ── Intersection Observer ── */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  const creatorFeatures = [
    'Invoice tracking & automated follow-ups',
    'Escrow protection before you post',
    'Professional profile & media kit hosting',
    'Real-time analytics dashboard',
  ];

  const brandFeatures = [
    'AI-driven creator discovery engine',
    'End-to-end campaign management',
    'Automated escrow payment milestones',
    'Real-time ROI & conversion reports',
  ];

  const cardClass = (variant) =>
    `dp-card dp-card--${variant}${active ? ' in' : ''}`;

  return (
    <section className="dp">
      <canvas ref={canvasRef} id="dpbg" />

      {/* Header */}
      <div className="dp-header">
        <div className="dp-eyebrow-row">
          <span className="dp-eyebrow-line" />
          <span className="dp-eyebrow-text">Dual Value Proposition</span>
          <span className="dp-eyebrow-line" />
        </div>
        <h2 className="dp-headline">
          Engineered for <em>Both Sides</em>
          <br />
          of the Lens.
        </h2>
        <p className="dp-subtitle">
          Stop worrying about the logistics. Focus on what you do best.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="dp-grid" ref={gridRef}>
        {/* ─── Creator Card ─── */}
        <div className={cardClass('creator')}>
          <div className="dp-orb dp-orb--creator-1" />
          <div className="dp-orb dp-orb--creator-2" />

          <span className="dp-tag dp-tag--creator">FOR CREATORS</span>
          <h3 className="dp-card-title">Your Digital Office.</h3>
          <p className="dp-card-subtitle">
            Everything you need to manage, grow &amp; get paid.
          </p>
          <div className="dp-divider dp-divider--creator" />

          <div className="dp-stats">
            <div className="dp-stat">
              <span className="dp-stat-num">10k+</span>
              <span className="dp-stat-label">CREATORS</span>
            </div>
            <div className="dp-stat-sep" />
            <div className="dp-stat">
              <span className="dp-stat-num">0%</span>
              <span className="dp-stat-label">DEFAULTS</span>
            </div>
            <div className="dp-stat-sep" />
            <div className="dp-stat">
              <span className="dp-stat-num">24hr</span>
              <span className="dp-stat-label">PAYOUTS</span>
            </div>
          </div>

          <ul className="dp-features">
            {creatorFeatures.map((text, i) => (
              <li key={i} className="dp-feature-item">
                <span className="dp-check dp-check--creator">✓</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <button className="dp-btn dp-btn--creator">
            Join as Creator
            <span className="dp-btn-arrow">→</span>
          </button>
        </div>

        {/* ─── Brand Card ─── */}
        <div className={cardClass('brand')}>
          <div className="dp-orb dp-orb--brand" />

          <span className="dp-tag dp-tag--brand">FOR BRANDS</span>
          <h3 className="dp-card-title">Your ROI Command Center.</h3>
          <p className="dp-card-subtitle">
            Scale influencer marketing with zero guesswork.
          </p>
          <div className="dp-divider dp-divider--brand" />

          <div className="dp-stats">
            <div className="dp-stat">
              <span className="dp-stat-num">100+</span>
              <span className="dp-stat-label">BRANDS</span>
            </div>
            <div className="dp-stat-sep" />
            <div className="dp-stat">
              <span className="dp-stat-num">3x</span>
              <span className="dp-stat-label">AVG ROI</span>
            </div>
            <div className="dp-stat-sep" />
            <div className="dp-stat">
              <span className="dp-stat-num">48hr</span>
              <span className="dp-stat-label">LAUNCH</span>
            </div>
          </div>

          <ul className="dp-features">
            {brandFeatures.map((text, i) => (
              <li key={i} className="dp-feature-item">
                <span className="dp-check dp-check--brand">✓</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <button className="dp-btn dp-btn--brand">
            Join as Brand
            <span className="dp-btn-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DualPropSection;
