/* ═══════════════════════════════════════════════════════════════ */
/*  LUXURY MULTI-LANGUAGE TRANSLATION SYSTEM                      */
/*  Mahima Global Entrepreneurs International Trade Corridors     */
/* ═══════════════════════════════════════════════════════════════ */

export const supportedLanguages = [
  // Global & Americas
  { code: 'en', name: 'English', flag: '🇬🇧', label: 'English', region: 'Global' },
  { code: 'es', name: 'Español', flag: '🇪🇸', label: 'Spanish (Spain & Americas)', region: 'Americas / Europe' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', label: 'Portuguese (Brazil & Portugal)', region: 'Americas / Europe' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', label: 'French (France & Africa)', region: 'Europe / Africa' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: 'German (Germany, DACH)', region: 'Europe' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', label: 'Italian', region: 'Europe' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', label: 'Dutch (Rotterdam Hub)', region: 'Europe' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', label: 'Polish', region: 'Europe' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', label: 'Greek (Maritime Fleet)', region: 'Europe' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', label: 'Turkish (Eurasia Corridor)', region: 'Eurasia' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', label: 'Russian', region: 'Eurasia' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', label: 'Ukrainian', region: 'Eurasia' },

  // Middle East & Africa
  { code: 'ar', name: 'العربية', flag: '🇦🇪', label: 'Arabic (GCC & MENA)', region: 'Middle East' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', label: 'Persian (Farsi)', region: 'Middle East' },
  { code: 'iw', name: 'עברית', flag: '🇮🇱', label: 'Hebrew', region: 'Middle East' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', label: 'Swahili (East Africa)', region: 'Africa' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦', label: 'Afrikaans (South Africa)', region: 'Africa' },

  // East & Southeast Asia
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', label: 'Chinese (Simplified)', region: 'East Asia' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼', label: 'Chinese (Traditional)', region: 'East Asia' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', label: 'Japanese', region: 'East Asia' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', label: 'Korean', region: 'East Asia' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', label: 'Vietnamese', region: 'Southeast Asia' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', label: 'Indonesian', region: 'Southeast Asia' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', label: 'Thai', region: 'Southeast Asia' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', label: 'Malay (Malaysia & Singapore)', region: 'Southeast Asia' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭', label: 'Tagalog (Philippines)', region: 'Southeast Asia' },

  // South Asia
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', label: 'Hindi', region: 'South Asia' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳', label: 'Telugu', region: 'South Asia' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', label: 'Tamil', region: 'South Asia' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', label: 'Bengali (India & Bangladesh)', region: 'South Asia' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳', label: 'Gujarati', region: 'South Asia' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳', label: 'Marathi', region: 'South Asia' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', label: 'Urdu', region: 'South Asia' }
];

export function getSavedLanguage() {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (match) {
    const val = decodeURIComponent(match[1]).replace(/^\/en\//, '').replace(/^\//, '');
    if (val) return val;
  }
  return localStorage.getItem('mge_user_lang') || 'en';
}

export function setLanguage(langCode) {
  localStorage.setItem('mge_user_lang', langCode);
  
  const hostname = window.location.hostname;
  const cookieVal = `/en/${langCode}`;
  
  document.cookie = `googtrans=${cookieVal}; path=/;`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
  if (hostname.split('.').length > 1) {
    document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`;
  }

  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
  } else {
    window.location.reload();
  }
}

export function initLanguageSwitcher() {
  if (!document.getElementById('google_translate_element')) {
    const gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.style.display = 'none';
    document.body.appendChild(gtDiv);
  }

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

  const currentLangCode = getSavedLanguage();
  const currentLang = supportedLanguages.find(l => l.code === currentLangCode) || supportedLanguages[0];

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
          <span>Global Trade Languages (${supportedLanguages.length})</span>
        </div>
        <div class="lang-search-wrap">
          <input type="text" class="lang-search-input" id="lang-search" placeholder="Search language or country..." />
        </div>
        <div class="lang-list" id="lang-list-container">
          ${supportedLanguages.map(lang => `
            <button class="lang-option ${lang.code === currentLangCode ? 'active' : ''}" data-code="${lang.code}" data-search="${(lang.name + ' ' + lang.label + ' ' + lang.region).toLowerCase()}">
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

    const ctaBtn = navInner.querySelector('.nav-cta, #nav-cta-btn');
    if (ctaBtn) {
      navInner.insertBefore(switcher, ctaBtn);
    } else if (navLinks) {
      navInner.appendChild(switcher);
    }

    const btn = switcher.querySelector('#lang-btn');
    const dropdown = switcher.querySelector('#lang-dropdown');
    const searchInput = switcher.querySelector('#lang-search');
    const listContainer = switcher.querySelector('#lang-list-container');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      btn.classList.toggle('active');
      if (isOpen && searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    });

    if (searchInput) {
      searchInput.addEventListener('click', (e) => e.stopPropagation());
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const options = listContainer.querySelectorAll('.lang-option');
        options.forEach(opt => {
          const searchData = opt.dataset.search || '';
          if (!query || searchData.includes(query)) {
            opt.style.display = 'flex';
          } else {
            opt.style.display = 'none';
          }
        });
      });
    }

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

  const mobInner = document.querySelector('.mobile-menu-inner, .mobile-menu');
  if (mobInner && !document.querySelector('.mobile-lang-section')) {
    const mobLang = document.createElement('div');
    mobLang.className = 'mobile-lang-section';
    mobLang.innerHTML = `
      <div class="mob-lang-title">🌐 International Languages (${supportedLanguages.length})</div>
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
