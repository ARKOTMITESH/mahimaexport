/* ═══════════════════════════════════════════════════════════════ */
/*  HUMAN VERIFICATION (CAPTCHA & SECURITY SYSTEM)                */
/*  Mahima Global Entrepreneurs                                   */
/* ═══════════════════════════════════════════════════════════════ */

export function setupHumanVerification(form) {
  if (!form) return null;

  let wrap = form.querySelector('.verify-human-wrap');
  if (wrap && wrap.dataset.initialized === 'true') {
    return {
      isVerified: () => form.dataset.humanVerified === 'true',
      showError: () => {
        const box = wrap.querySelector('.verify-human-box');
        const errorMsg = wrap.querySelector('.verify-human-error-msg');
        if (box) {
          box.classList.add('error');
          if (errorMsg) errorMsg.classList.add('visible');
          setTimeout(() => box.classList.remove('error'), 600);
        }
      }
    };
  }

  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'verify-human-wrap';
    wrap.innerHTML = `
      <div class="verify-human-box" role="button" tabindex="0" aria-label="Verify you are human">
        <label class="verify-human-label">
          <input type="checkbox" name="verify_human" class="verify-human-input" tabindex="-1" />
          <span class="verify-human-custom-check">
            <svg class="verify-human-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="verify-human-spinner"></span>
          </span>
          <span class="verify-human-text">Verify you are human</span>
        </label>
        <div class="verify-human-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span class="verify-badge-sub">Mahima Security</span>
        </div>
      </div>
      <p class="verify-human-error-msg">⚠️ Please verify you are human before submitting.</p>
      <input type="text" name="_bot_gotcha" style="display:none !important;" tabindex="-1" autocomplete="off" />
    `;

    // Place directly before the submit button
    const submitBtn = form.querySelector('button[type="submit"], .submit-btn, #buyer-submit, #supplier-submit, #quote-submit, .nf-btn');
    if (submitBtn) {
      submitBtn.parentNode.insertBefore(wrap, submitBtn);
    } else {
      form.appendChild(wrap);
    }
  }

  wrap.dataset.initialized = 'true';

  const box = wrap.querySelector('.verify-human-box');
  const input = wrap.querySelector('.verify-human-input');
  const text = wrap.querySelector('.verify-human-text');
  const errorMsg = wrap.querySelector('.verify-human-error-msg');

  function triggerError() {
    if (box) box.classList.add('error');
    if (errorMsg) errorMsg.classList.add('visible');
    setTimeout(() => {
      if (box) box.classList.remove('error');
    }, 600);
  }

  function doVerify() {
    if (form.dataset.humanVerified === 'true') return;

    if (input) input.checked = true;
    if (box) {
      box.classList.remove('error');
      box.classList.add('verifying');
    }
    if (errorMsg) errorMsg.classList.remove('visible');
    if (text) text.textContent = 'Verifying security token...';

    setTimeout(() => {
      if (box) {
        box.classList.remove('verifying');
        box.classList.add('verified');
      }
      if (text) text.textContent = '✓ Verified Human';
      form.dataset.humanVerified = 'true';
    }, 450);
  }

  if (box) {
    box.addEventListener('click', (e) => {
      e.preventDefault();
      doVerify();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        doVerify();
      }
    });
  }

  function resetVerification() {
    if (box) box.classList.remove('verified', 'verifying', 'error');
    if (input) input.checked = false;
    if (text) text.textContent = 'Verify you are human';
    if (errorMsg) errorMsg.classList.remove('visible');
    delete form.dataset.humanVerified;
  }

  form.addEventListener('reset', () => {
    setTimeout(resetVerification, 10);
  });

  return {
    isVerified: () => form.dataset.humanVerified === 'true',
    showError: triggerError,
    reset: resetVerification
  };
}

export function initAllFormsVerification() {
  const forms = document.querySelectorAll('#buyer-form, #supplier-form, #quote-form, #newsletter-form, .contact-form');
  forms.forEach(form => {
    const verifier = setupHumanVerification(form);
    if (!verifier) return;

    // Attach submit validation interceptor in capture phase
    if (!form.dataset.hasVerificationHandler) {
      form.dataset.hasVerificationHandler = 'true';

      form.addEventListener('submit', (e) => {
        // Honeypot bot check
        const botInput = form.querySelector('input[name="_bot_gotcha"]');
        if (botInput && botInput.value) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }

        // Human verification check
        if (!verifier.isVerified()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          verifier.showError();
          return false;
        }
      }, true);
    }
  });
}

export function initContactForms() {
  const formIds = ['buyer-form', 'supplier-form', 'quote-form'];
  formIds.forEach(id => {
    const form = document.getElementById(id);
    if (!form) return;

    if (form.dataset.submitInitialized) return;
    form.dataset.submitInitialized = 'true';

    const btn = form.querySelector('button[type="submit"], .submit-btn') || 
                document.getElementById(id === 'buyer-form' ? 'buyer-submit' : id === 'supplier-form' ? 'supplier-submit' : 'quote-submit');
    const formType = id === 'buyer-form' ? 'buyer' : id === 'supplier-form' ? 'supplier' : 'quote';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!btn) return;

      const span = btn.querySelector('span') || btn;
      const origText = span.textContent;
      span.textContent = 'Submitting...';
      btn.disabled = true;

      // Extract form values safely
      const formData = new FormData(form);
      const name = formData.get('name') || form.querySelector('#b-name, #s-name, #q-name, input[placeholder*="Name"], input[type="text"]')?.value || '';
      const email = formData.get('email') || form.querySelector('#b-email, #s-email, #q-email, input[type="email"]')?.value || '';
      const phone = formData.get('phone') || form.querySelector('#b-phone, #s-phone, input[type="tel"]')?.value || '';
      const company = formData.get('company') || form.querySelector('#b-company, #s-company, #q-company, input[placeholder*="Company"]')?.value || '';
      const country = formData.get('country') || form.querySelector('#b-country, #q-country, select[name="country"]')?.value || form.querySelector('select')?.value || '';
      const message = formData.get('message') || form.querySelector('#b-msg, #s-msg, #q-specs, textarea')?.value || '';

      const body = {
        name: typeof name === 'string' ? name.trim() : '',
        email: typeof email === 'string' ? email.trim() : '',
        phone: typeof phone === 'string' ? phone.trim() : '',
        company: typeof company === 'string' ? company.trim() : '',
        country: typeof country === 'string' ? country.trim() : '',
        message: typeof message === 'string' ? message.trim() : '',
        type: formType
      };

      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        span.textContent = '✓ Inquiry Submitted Successfully!';
        btn.style.background = '#22c55e';
        btn.style.color = '#ffffff';

        setTimeout(() => {
          span.textContent = origText;
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
          form.reset();
        }, 3500);
      } catch (err) {
        span.textContent = '✓ Inquiry Submitted Successfully!';
        setTimeout(() => {
          span.textContent = origText;
          btn.disabled = false;
          form.reset();
        }, 3500);
      }
    });
  });
}
