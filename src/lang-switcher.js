/* ═══════════════════════════════════════════════════════════════ */
/*  LUXURY MULTI-LANGUAGE TRANSLATION SYSTEM                      */
/*  Mahima Global Entrepreneurs International Trade Corridors     */
/* ═══════════════════════════════════════════════════════════════ */

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧', label: 'English' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', label: 'Hindi' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳', label: 'Telugu' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', label: 'Tamil' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪', label: 'Arabic' },
  { code: 'es', name: 'Español', flag: '🇪🇸', label: 'Spanish' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', label: 'French' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: 'German' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', label: 'Chinese' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', label: 'Japanese' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', label: 'Russian' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', label: 'Italian' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', label: 'Vietnamese' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', label: 'Indonesian' },
];

export function getSavedLanguage() {
  // Check cookie or localStorage
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (match) {
    const val = decodeURIComponent(match[1]).replace(/^\/en\//, '').replace(/^\//, '');
    if (val) return val;
  }
  return localStorage.getItem('mge_user_lang') || 'en';
}

export function setLanguage(langCode) {
  localStorage.setItem('mge_user_lang', langCode);
  
  // Set google translate cookie for current domain and root path
  const hostname = window.location.hostname;
  const cookieVal = `/en/${langCode}`;
  
  document.cookie = `googtrans=${cookieVal}; path=/;`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
  if (hostname.split('.').length > 1) {
    document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`;
  }

  // Trigger select change if google combo exists
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
  } else {
    window.location.reload();
  }
}

export function initLanguageSwitcher() {
  // 1. Inject hidden Google Translate container
  if (!document.getElementById('google_translate_element')) {
    const gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.style.display = 'none';
    document.body.appendChild(gtDiv);
  }

  // 2. Load Google Translate script if not loaded
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function () {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: supportedLanguages.map(l => l.code).join(','),
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      document.body.appendChild(s);
    }
  }

  // 3. Inject Language Switcher into Navbars (Desktop & Mobile)
  const currentLangCode = getSavedLanguage();
  const currentLang = supportedLanguages.find(l => l.code === currentLangCode) || supportedLanguages[0];

  // Desktop Navbar injection
  const navInner = document.querySelector('.nav-inner, .header-inner');
  const navLinks = document.querySelector('.nav-links, .main-nav');
  
  if (navInner && !document.querySelector('.lang-switcher-wrap')) {
    const switcher = document.createElement('div');
    switcher.className = 'lang-switcher-wrap';
    switcher.innerHTML = `
      <button class="lang-switcher-btn" id="lang-btn" aria-label="Select Language">
        <span class="lang-icon">🌐</span>
        <span class="lang-flag">${currentLang.flag}</span>
        <span class="lang-code">${currentLang.name}</span>
        <span class="lang-arrow">▾</span>
      </button>
      <div class="lang-dropdown" id="lang-dropdown">
        <div class="lang-dropdown-header">
          <span>Global Trade Languages</span>
        </div>
        <div class="lang-list">
          ${supportedLanguages.map(lang => `
            <button class="lang-option ${lang.code === currentLangCode ? 'active' : ''}" data-code="${lang.code}">
              <span class="opt-flag">${lang.flag}</span>
              <div class="opt-text">
                <span class="opt-name">${lang.name}</span>
                <span class="opt-label">${lang.label}</span>
              </div>
              ${lang.code === currentLangCode ? '<span class="opt-check">✓</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Place before CTA or at end of nav
    const ctaBtn = navInner.querySelector('.nav-cta, #nav-cta-btn');
    if (ctaBtn) {
      navInner.insertBefore(switcher, ctaBtn);
    } else if (navLinks) {
      navInner.appendChild(switcher);
    }

    // Toggle dropdown
    const btn = switcher.querySelector('#lang-btn');
    const dropdown = switcher.querySelector('#lang-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
      btn.classList.toggle('active');
    });

    // Option select
    dropdown.addEventListener('click', (e) => {
      const opt = e.target.closest('.lang-option');
      if (!opt) return;
      const code = opt.dataset.code;
      dropdown.classList.remove('open');
      btn.classList.remove('active');
      setLanguage(code);
    });

    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        dropdown.classList.remove('open');
        btn.classList.remove('active');
      }
    });
  }

  // Mobile Menu injection
  const mobInner = document.querySelector('.mobile-menu-inner, .mobile-menu');
  if (mobInner && !document.querySelector('.mobile-lang-section')) {
    const mobLang = document.createElement('div');
    mobLang.className = 'mobile-lang-section';
    mobLang.innerHTML = `
      <div class="mob-lang-title">🌐 Select Language</div>
      <div class="mob-lang-grid">
        ${supportedLanguages.map(lang => `
          <button class="mob-lang-btn ${lang.code === currentLangCode ? 'active' : ''}" data-code="${lang.code}">
            <span>${lang.flag}</span>
            <span>${lang.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    mobLang.addEventListener('click', (e) => {
      const b = e.target.closest('.mob-lang-btn');
      if (!b) return;
      setLanguage(b.dataset.code);
    });

    mobInner.appendChild(mobLang);
  }
}
