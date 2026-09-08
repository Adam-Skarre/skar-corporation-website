(function () {
  const form = document.querySelector('#skar-contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const storageKey = 'skar-contact-inquiry';
  const submit = form.querySelector('.contact-submit');
  let sending = false;
  const quoteType = 'Request a quote';
  const inquiryTypes = ['Request a quote', 'Consulting and strategy', 'Engineering and systems', 'Technology and operations', 'Data and decision support', 'Research and collaboration', 'Careers', 'General inquiry'];
  const inquiry = form.elements.namedItem('inquiryType');

  function getValues() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(getValues()));
      return true;
    } catch (_) {
      return false;
    }
  }

  function updateInquiry() {
    const isQuote = inquiry.value === quoteType;
    form.querySelector('.contact-form-kicker').textContent = isQuote ? 'Request a quote' : inquiry.value;
    form.querySelector('.contact-form-heading h2').textContent = isQuote ? 'Tell us about your project.' : 'How can we help?';
    form.querySelector('.message-label').textContent = isQuote ? 'What would you like a quote for? *' : 'Your message *';
    form.querySelector('.contact-submit').innerHTML = `${isQuote ? 'Submit quote request' : 'Send inquiry'} <span aria-hidden="true">→</span>`;
    form.elements.namedItem('message').placeholder = isQuote
      ? 'Tell us what you need and your ideal timeline. It’s okay if you’re still working out the details.'
      : 'Tell us what you’d like to discuss.';
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object') {
      const restored = {
        fullName: saved.fullName || `${saved.firstName || ''} ${saved.lastName || ''}`.trim(),
        email: saved.email,
        company: saved.company,
        industry: saved.industry,
        message: saved.message
      };
      Object.entries(restored).forEach(([name, value]) => {
        if (typeof value === 'string') form.elements.namedItem(name).value = value;
      });
      inquiry.value = inquiryTypes.includes(saved.inquiryType) ? saved.inquiryType : quoteType;
      status.textContent = 'Your saved inquiry has been restored on this device.';
    }
  } catch (_) {
    // The form remains usable when browser storage is unavailable.
  }

  // A quote link takes precedence over a previous inquiry's selected type.
  if (new URLSearchParams(window.location.search).get('inquiry') === 'quote') inquiry.value = quoteType;
  updateInquiry();
  form.addEventListener('change', updateInquiry);
  form.addEventListener('input', () => {
    status.textContent = saveDraft() ? 'Draft saved on this device.' : '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = 'Please complete the required fields.';
      return;
    }
    saveDraft();
    const data = new FormData(form);
    const isQuote = data.get('inquiryType') === quoteType;
    data.set('subject', `${data.get('inquiryType')} — ${data.get('company') || data.get('fullName')}`);
    sending = true;
    const controls = Array.from(form.querySelectorAll('input, select, textarea, button'));
    const disabledStates = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Submitting…';
    status.textContent = 'Submitting your inquiry…';
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: data, headers: {Accept: 'application/json'}
      });
      if (!response.ok) {
        status.textContent = response.status === 429
          ? 'Submissions are temporarily unavailable. Please try again later or email contact@skartech.com. Your entries have been retained.'
          : 'Your inquiry could not be submitted. Please review your details and try again, or email contact@skartech.com. Your entries have been retained.';
        return;
      }
      form.reset();
      try { localStorage.removeItem(storageKey); } catch (_) {}
      status.textContent = isQuote
        ? 'Thank you. Your quote request has been received. We will contact you at the email address provided.'
        : 'Thank you. Your inquiry has been received. We will contact you at the email address provided.';
    } catch (_) {
      status.textContent = 'We could not confirm submission. Please check your connection and try again, or email contact@skartech.com. Your entries have been retained.';
    } finally {
      sending = false;
      controls.forEach((control, index) => { control.disabled = disabledStates[index]; });
      form.removeAttribute('aria-busy');
      updateInquiry();
    }
  });
})();
