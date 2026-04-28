import React, { useEffect, useRef, useState } from 'react';
import './DualPropSection.css';

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js';

const loadThree = () =>
  new Promise((resolve, reject) => {
    if (window.THREE) {
      resolve(window.THREE);
      return;
    }

    const existing = document.querySelector(`script[src="${THREE_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.THREE), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = THREE_CDN;
    script.async = true;
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.head.appendChild(script);
  });

const initNeuralAnimation = (canvas, section) => {
  if (!canvas || !section) return () => {};

  let scene;
  let camera;
  let renderer;
  let pointGroups = [];
  let frameId;
  let time = 0;
  let isVisible = false;
  let observer;
  let disposed = false;

  const RADIUS = 3;
  const TUBE = 1;
  const RADIAL_SEGMENTS = 102;
  const TUBULAR_SEGMENTS = 180;
  const POINT_COLOR = '#1A6BFF';
  const POINT_SIZE = 0.065;
  const SIZE_ATTENUATION = 190;
  const FOV = 60;
  const CAMERA_Z = 15;
  const CLEAR_COLOR = 0xDADADA;
  const POS_Y = 2.6;
  const POS_Z = 13.5;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const degToRad = (deg) => (deg * Math.PI) / 180;
  const ROT_CONFIG = {
    centerX: 0,
    rangeX: degToRad(20),
    centerY: degToRad(90),
    rangeY: degToRad(20),
  };

  const setup = async () => {
    const THREE = await loadThree();
    if (disposed || !THREE) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
    camera.position.z = CAMERA_Z;

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(CLEAR_COLOR, 1);

    const createPointField = ({ color, x, y, z, scale = 1, rotationOffset = 0, travelX = 0, travelY = 0 }) => {
      const geometry = new THREE.TorusGeometry(RADIUS, TUBE, RADIAL_SEGMENTS, TUBULAR_SEGMENTS);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(color) },
          size: { value: POINT_SIZE },
          sizeAttenuation: { value: SIZE_ATTENUATION },
          opacity: { value: 0.95 },
        },
        vertexShader: `
          uniform float size;
          uniform float sizeAttenuation;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (sizeAttenuation / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float opacity;
          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = dot(center, center);
            if (dist > 0.25) discard;
            float softEdge = smoothstep(0.25, 0.05, dist);
            gl_FragColor = vec4(color, opacity * softEdge);
          }
        `,
        transparent: true,
        depthWrite: false,
      });

      const field = new THREE.Points(geometry, material);
      field.position.set(x, y, z);
      field.rotation.set(0, degToRad(90) + rotationOffset, 0);
      field.scale.setScalar(scale);
      field.userData = { baseX: x, baseY: y, travelX, travelY };
      scene.add(field);
      pointGroups.push(field);
    };

    createPointField({
      color: POINT_COLOR,
      x: -8.4,
      y: POS_Y,
      z: POS_Z,
      scale: 1.45,
      rotationOffset: -0.12,
      travelX: 16.2,
      travelY: -7.6,
    });

    const resize = () => {
      const width = section.offsetWidth || window.innerWidth;
      const height = section.offsetHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isVisible || !renderer || pointGroups.length === 0) return;

      if (!prefersReducedMotion) {
        time += 0.005;
        const sinTime = Math.sin(time);
        pointGroups.forEach((field) => {
          const crossProgress = (time * 0.12) % 1;
          field.rotation.set(
            ROT_CONFIG.centerX + ROT_CONFIG.rangeX * sinTime,
            ROT_CONFIG.centerY + ROT_CONFIG.rangeY * sinTime,
            -time
          );
          field.position.x = field.userData.baseX + field.userData.travelX * crossProgress;
          field.position.y = field.userData.baseY + field.userData.travelY * crossProgress + 0.22 * sinTime;
        });
      }

      renderer.render(scene, camera);
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(section);

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  };

  let removeResize = () => {};
  setup().then((cleanup) => {
    if (cleanup) removeResize = cleanup;
  });

  return () => {
    disposed = true;
    removeResize();
    observer?.disconnect();
    cancelAnimationFrame(frameId);
    pointGroups.forEach((field) => {
      field.geometry?.dispose();
      field.material?.dispose();
    });
    pointGroups = [];
    renderer?.dispose();
  };
};

const DualPropSection = () => {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const gridRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    return initNeuralAnimation(canvasRef.current, sectionRef.current);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

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

  const cardClass = (variant) => `dp-card dp-card--${variant}${active ? ' in' : ''}`;

  return (
    <section className="dp" ref={sectionRef}>
      <canvas ref={canvasRef} id="neural-canvas" className="dp-neural-canvas" />
      <div className="dp-neural-vignette" />

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

      <div className="dp-grid" ref={gridRef}>
        <div className={cardClass('creator')}>
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

        <div className={cardClass('brand')}>
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
