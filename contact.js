(function () {
  const form = document.querySelector('#skar-contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const storageKey = 'skar-contact-inquiry';
  const contactAddress = 'contact@skartech.com';
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
    form.querySelector('.contact-submit').innerHTML = `${isQuote ? 'Prepare quote email' : 'Prepare email'} <span aria-hidden="true">→</span>`;
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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = 'Please complete the required fields.';
      return;
    }
    const values = getValues();
    saveDraft();
    const name = (values.fullName || '').trim();
    const subject = `${values.inquiryType} — ${values.company || name}`;
    const body = [
      values.inquiryType === quoteType ? 'Skar Technologies quote request' : 'Skar Technologies inquiry',
      '',
      `Name: ${name}`,
      `Email: ${values.email || ''}`,
      `Company: ${values.company || 'Not provided'}`,
      `Inquiry type: ${values.inquiryType}`,
      `Industry: ${values.industry || 'Not provided'}`,
      '',
      values.inquiryType === quoteType ? 'Project details:' : 'Message:',
      values.message || ''
    ].join('\n');

    status.textContent = `Opening a new email to ${contactAddress}. Your request has not been sent yet. Review it and select Send in your email app.`;
    window.location.href = `mailto:${contactAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
