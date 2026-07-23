(function () {
  const form = document.querySelector('#skar-contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const storageKey = 'skar-contact-inquiry';
  const contactAddress = 'contact@skarcorporation.com';

  function getValues() {
    return Object.fromEntries(new FormData(form).entries());
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) {
      Object.entries(saved).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (field.type === 'checkbox') field.checked = value === 'on';
        else field.value = value;
      });
      status.textContent = 'Your saved inquiry has been restored on this device.';
    }
  } catch (_) {
    localStorage.removeItem(storageKey);
  }

  form.addEventListener('input', () => {
    localStorage.setItem(storageKey, JSON.stringify(getValues()));
    status.textContent = 'Draft saved on this device.';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = 'Please complete the required fields.';
      return;
    }
    const values = getValues();
    localStorage.setItem(storageKey, JSON.stringify(values));

    const name = `${values.firstName || ''} ${values.lastName || ''}`.trim();
    const subject = `${values.inquiryType || 'General inquiry'} — ${values.company || name}`;
    const body = [
      'SKAR Corporation inquiry',
      '',
      `Name: ${name}`,
      `Email: ${values.email || ''}`,
      `Company: ${values.company || 'Not provided'}`,
      `Job title: ${values.jobTitle || 'Not provided'}`,
      `Inquiry type: ${values.inquiryType || ''}`,
      '',
      'How can SKAR help?',
      values.message || ''
    ].join('\n');

    status.textContent = `Opening a new email to ${contactAddress}. Review it, then select Send.`;
    form.querySelector('.contact-submit').classList.add('saved');
    window.location.href = `mailto:${contactAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
