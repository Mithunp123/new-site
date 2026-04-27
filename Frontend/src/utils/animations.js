import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const initScrollAnimations = () => {
  let ctx = gsap.context(() => {
    try {
      const fadeUps = document.querySelectorAll('.fade-up');
      fadeUps.forEach((elem) => {
        gsap.fromTo(elem, 
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: elem,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      });
    } catch (e) {
      console.error('GSAP Animation Error:', e);
      const fadeUps = document.querySelectorAll('.fade-up');
      fadeUps.forEach(elem => {
        elem.style.opacity = '1';
        elem.style.transform = 'translateY(0)';
      });
    }
  });
  
  return () => ctx.revert();
};
