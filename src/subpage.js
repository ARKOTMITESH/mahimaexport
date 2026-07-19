import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  // ── CUSTOM CURSOR SYSTEM ──
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-follower');
  
  if (dot && ring) {
    let mx = 0, my = 0, fx = 0, fy = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      gsap.to(dot, { x: mx, y: my, duration: 0.08, ease: 'none' });
    });

    (function follow() {
      fx += (mx - fx) * 0.11;
      fy += (my - fy) * 0.11;
      gsap.set(ring, { x: fx, y: fy });
      requestAnimationFrame(follow);
    })();

    const interactives = 'a, button, .btn, .bc-link';
    document.querySelectorAll(interactives).forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.classList.add('hover');
        ring.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        dot.classList.remove('hover');
        ring.classList.remove('hover');
      });
    });
  }

  // ── ENTRANCE TIMELINE ──
  gsap.fromTo('.overview-card, .details-card',
    { opacity: 0, y: 32 },
    { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }
  );
  
  gsap.from('.bc-link', {
    opacity: 0, x: -16, duration: 0.6, delay: 0.25, ease: 'power2.out'
  });

  gsap.from('.pc-icon, .sec-title, .sec-sub, p, table, .btn-primary, .details-split', {
    opacity: 0, y: 16, duration: 0.7, delay: 0.1, stagger: 0.06, ease: 'power2.out'
  });

  // ── SCROLL REVEAL FOR SUBPAGES ──
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  revealElements.forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1, x: 0, y: 0,
          duration: 0.75,
          delay: Math.min(i * 0.04, 0.3),
          ease: 'power3.out',
          onStart: () => el.classList.add('visible')
        });
      }
    });
  });

  // ── MOBILE MENU SYSTEM ──
  const ham  = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (ham && menu) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('open');
      menu.classList.toggle('open');
    });

    document.querySelectorAll('.mob-link').forEach(l => {
      l.addEventListener('click', () => {
        ham.classList.remove('open');
        menu.classList.remove('open');
      });
    });
  }

  // ── DYNAMIC 3D TILT & GLOW EFFECTS ──
  const cards = document.querySelectorAll('.prod-card, .why-card, .testi-card, .cert-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      
      gsap.to(card, { 
        rotateY: x * 10, 
        rotateX: -y * 10, 
        y: -5,
        duration: .35, 
        ease: 'power2.out', 
        transformPerspective: 800 
      });

      const borderGlow = card.querySelector('.pc-border-glow');
      if (borderGlow) {
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        borderGlow.style.background = `radial-gradient(circle 120px at ${mx}px ${my}px, rgba(212,175,55,0.4), transparent)`;
        borderGlow.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, { 
        rotateY: 0, 
        rotateX: 0, 
        y: 0,
        duration: .5, 
        ease: 'power2.out' 
      });

      const borderGlow = card.querySelector('.pc-border-glow');
      if (borderGlow) {
        borderGlow.style.background = '';
        borderGlow.style.opacity = '';
      }
    });
  });
});

