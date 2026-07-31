(() => {
  const consoleElement = document.querySelector('[data-insights-console]');
  if (!consoleElement) return;

  const lenses = {
    research: {
      label: 'Research question',
      title: 'What does the evidence support—and where does it stop?',
      description: 'We separate observed conditions, assumptions, analytical interpretation, and unresolved uncertainty so a recommendation can be examined rather than merely accepted.',
      linkText: 'Open the research library',
      href: '/research/',
      readout: 'Evidence integrity',
      nodes: ['evidence', 'assumptions']
    },
    models: {
      label: 'Model question',
      title: 'Which structure governs the behavior we can observe?',
      description: 'Computational studies expose geometry, dynamics, stability, and sensitivity—making it possible to test how a system responds before acting inside the real one.',
      linkText: 'Explore computational visualization',
      href: '/visualization/',
      readout: 'Governing behavior',
      nodes: ['constraints', 'scenarios']
    },
    markets: {
      label: 'Market question',
      title: 'Which external changes alter the decision inside the organization?',
      description: 'We connect movements in technology, capital, energy, demand, and capacity to concrete exposure, timing, and strategic options for operators and decision-makers.',
      linkText: 'Open Market Views',
      href: '/market-views/',
      readout: 'External exposure',
      nodes: ['evidence', 'consequences']
    },
    practice: {
      label: 'Practice question',
      title: 'How do people move forward when the evidence is incomplete?',
      description: 'Experience reveals how judgment, accountability, and real constraints shape decisions that cannot be resolved by analysis alone.',
      linkText: 'Discover The Way Through',
      href: '/way-through/',
      readout: 'Judgment in context',
      nodes: ['judgment', 'consequences']
    }
  };

  const tabs = [...consoleElement.querySelectorAll('[data-lens]')];
  const panel = consoleElement.querySelector('#insights-panel');
  const label = consoleElement.querySelector('[data-lens-label]');
  const title = consoleElement.querySelector('[data-lens-title]');
  const description = consoleElement.querySelector('[data-lens-description]');
  const link = consoleElement.querySelector('[data-lens-link]');
  const readout = consoleElement.querySelector('[data-map-readout]');
  const nodes = [...consoleElement.querySelectorAll('[data-node]')];

  function activate(key, focusPanel = false) {
    const lens = lenses[key];
    if (!lens) return;

    tabs.forEach((tab) => {
      const active = tab.dataset.lens === key;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) panel.setAttribute('aria-labelledby', tab.id);
    });

    label.textContent = lens.label;
    title.textContent = lens.title;
    description.textContent = lens.description;
    link.firstChild.textContent = `${lens.linkText} `;
    link.href = lens.href;
    readout.textContent = lens.readout;
    nodes.forEach((node) => node.classList.toggle('is-emphasized', lens.nodes.includes(node.dataset.node)));
    if (focusPanel) panel.focus({ preventScroll: true });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.lens));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = index;
      if (event.key === 'ArrowLeft') targetIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') targetIndex = (index + 1) % tabs.length;
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = tabs.length - 1;
      tabs[targetIndex].focus();
      activate(tabs[targetIndex].dataset.lens);
    });
  });

  const hero = document.querySelector('.insights-overview-hero');
  const engraving = document.querySelector('.insights-engraving');
  if (hero && engraving && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      engraving.style.setProperty('--insights-x', `${x * 7}px`);
      engraving.style.setProperty('--insights-y', `${y * 5}px`);
    });
  }
})();
