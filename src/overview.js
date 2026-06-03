import './style.css';
import { products } from './products-data.js';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  // Read query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const id = parseInt(urlParams.get('id'));
  
  // Find product, fallback to Vetiver (ID 0)
  const product = products.find(p => p.id === id) || products[0];

  // Populate basic text content
  document.getElementById('prod-name').textContent = product.name;
  document.getElementById('prod-tagline').textContent = product.tagline;
  document.getElementById('prod-desc').textContent = product.desc;
  document.getElementById('view-more-btn').href = `product-details.html?id=${product.id}`;

  // Populate Specs Table
  const specsTable = document.getElementById('specs-table');
  specsTable.innerHTML = '';
  Object.entries(product.specs).forEach(([key, val]) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td class="spec-label">${key}</td><td class="spec-val">${val}</td>`;
    specsTable.appendChild(row);
  });

  // Populate Product Image / Backdrop
  const bgEl = document.getElementById('prod-backdrop');
  if (bgEl) {
    if (product.id === 0) {
      bgEl.style.backgroundImage = `linear-gradient(135deg, rgba(16, 24, 8, 0.85), rgba(4, 8, 2, 0.95)), url('${product.image}')`;
    } else if (product.id === 3) {
      bgEl.style.backgroundImage = `linear-gradient(135deg, rgba(36, 10, 4, 0.85), rgba(12, 3, 0, 0.95)), url('${product.image}')`;
    } else {
      bgEl.style.backgroundImage = `linear-gradient(135deg, rgba(20, 20, 20, 0.85), rgba(8, 8, 8, 0.98))`;
    }
  }

  // Large illustration card
  const picEl = document.getElementById('prod-pic');
  if (picEl) {
    picEl.textContent = product.icon;
  }

  // Simple animations
  gsap.fromTo('.overview-card', 
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
  );

  // Setup Custom Cursor for this subpage
  initCursor();
});

function initCursor() {
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-follower');
  if (!dot || !ring) return;

  let mx=0, my=0, fx=0, fy=0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(dot, { x: mx, y: my, duration: .08, ease: 'none' });
  });

  (function follow() {
    fx += (mx - fx) * .11;
    fy += (my - fy) * .11;
    gsap.set(ring, { x: fx, y: fy });
    requestAnimationFrame(follow);
  })();

  const interactives = 'a,button,.btn';
  document.querySelectorAll(interactives).forEach(el => {
    el.addEventListener('mouseenter', () => { dot.classList.add('hover'); ring.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
  });
}
