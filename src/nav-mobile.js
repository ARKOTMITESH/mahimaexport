/* ═══════════════════════════════════════════════════════════════ */
/*  MOBILE NAVIGATION & DRAWER CONTROLLER                         */
/*  Mahima Global Entrepreneurs                                   */
/* ═══════════════════════════════════════════════════════════════ */

export function initMobileNav() {
  const navbar = document.getElementById('navbar') || document.querySelector('.navbar');
  const ham    = document.getElementById('hamburger');
  const menu   = document.getElementById('mobile-menu');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  if (!menu) return;

  // 1. Ensure backdrop exists
  let backdrop = document.querySelector('.mobile-menu-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    document.body.appendChild(backdrop);
  }

  // 2. Ensure drawer header exists
  if (!menu.querySelector('.mobile-menu-header')) {
    const header = document.createElement('div');
    header.className = 'mobile-menu-header';
    header.innerHTML = `
      <div class="mobile-menu-brand">
        <img src="/images/logo-emblem.png" alt="Mahima Emblem" class="mob-brand-img" />
        <div class="mob-brand-text">
          <span class="mob-brand-title">MAHIMA GLOBAL</span>
          <span class="mob-brand-sub">ENTREPRENEURS</span>
        </div>
      </div>
      <button class="mobile-menu-close" id="mobile-menu-close" aria-label="Close Menu">✕</button>
    `;
    menu.insertBefore(header, menu.firstChild);
  }

  // 3. Highlight current active link based on pathname
  const currentPath = window.location.pathname.toLowerCase();
  const currentHash = window.location.hash.toLowerCase();
  const mobLinks = menu.querySelectorAll('.mob-link');

  mobLinks.forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    link.classList.remove('active');

    if (currentPath === '/' || currentPath === '/index.html' || currentPath === '') {
      if (href === '/index.html' || href === '/') link.classList.add('active');
    } else if (href.includes('#')) {
      const [linkPath, linkHash] = href.split('#');
      if (currentPath.endsWith(linkPath) && currentHash === '#' + linkHash) {
        link.classList.add('active');
      }
    } else if (href !== '/' && href !== '/index.html' && currentPath.endsWith(href)) {
      link.classList.add('active');
    }
  });

  // 4. Open / Close functions
  const openMenu = () => {
    if (ham) ham.classList.add('open');
    menu.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Mutual exclusivity: close language dropdown if open
    const langDropdown = document.getElementById('lang-dropdown');
    const langBtn = document.getElementById('lang-btn');
    if (langDropdown) langDropdown.classList.remove('open');
    if (langBtn) langBtn.classList.remove('active');
  };

  const closeMenu = () => {
    if (ham) ham.classList.remove('open');
    menu.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  // 5. Event listeners
  if (ham) {
    ham.onclick = (e) => {
      e.stopPropagation();
      if (menu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    };
  }

  const closeBtn = menu.querySelector('#mobile-menu-close');
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeMenu();
    };
  }

  backdrop.onclick = () => {
    closeMenu();
  };

  // Close menu on link click
  menu.querySelectorAll('.mob-link, .mobile-cta a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });
}
