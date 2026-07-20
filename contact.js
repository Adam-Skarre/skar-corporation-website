(function () {
  const form = document.querySelector('#skar-contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const storageKey = 'skar-contact-inquiry';

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
    localStorage.setItem(storageKey, JSON.stringify(getValues()));
    status.textContent = 'Inquiry saved on this device. Online delivery will be enabled when SKAR’s business email is active.';
    form.querySelector('.contact-submit').classList.add('saved');
  });
})();
