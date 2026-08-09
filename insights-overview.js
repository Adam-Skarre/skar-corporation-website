(() => {
  const directoryTopics = {
    all: {
      kicker: 'Featured insight · Industry 4.0',
      title: 'The next operating system of industry.',
      description: 'How industrial systems are becoming observable, computational, and increasingly adaptive.',
      href: '/report-industry-4-0/',
      linkText: 'Read the report'
    },
    research: {
      kicker: 'Independent research',
      title: 'The next operating system of industry.',
      description: 'A detailed examination of connected operations, digital twins, intelligent automation, and the transition now reshaping industrial work.',
      href: '/report-industry-4-0/',
      linkText: 'Read the report'
    },
    models: {
      kicker: 'Decision intelligence',
      title: 'Turn information into a decision.',
      description: 'Prioritized evidence, traceable assumptions, and human approval brought together in one observable AI workflow.',
      href: '/artificial-intelligence/',
      linkText: 'Explore applied AI'
    },
    markets: {
      kicker: 'Markets and strategy',
      title: 'Translate external change into internal choices.',
      description: 'Signals in capital, technology, energy, and industrial capacity interpreted through the decisions they affect.',
      href: '/market-views/',
      linkText: 'Open Market Views'
    },
    energy: {
      kicker: 'Energy and infrastructure',
      title: 'Planning for load growth.',
      description: 'A scenario-based decision framework for rapidly rising data-center electricity demand and long-horizon infrastructure commitments.',
      href: '/report-data-center-demand/',
      linkText: 'Read the analysis'
    },
    practice: {
      kicker: 'Leadership and practice',
      title: 'The Way Through.',
      description: 'How engineers, operators, builders, and founders identify the real constraint, weigh imperfect options, and find a practical path forward.',
      href: '/way-through/',
      linkText: 'Discover the series'
    }
  };

  const topicSelect = document.querySelector('[data-insights-topic]');
  const directoryFeature = document.querySelector('.insights-directory-feature');
  if (topicSelect && directoryFeature) {
    const kicker = directoryFeature.querySelector('[data-directory-kicker]');
    const title = directoryFeature.querySelector('[data-directory-title]');
    const description = directoryFeature.querySelector('[data-directory-description]');
    const link = directoryFeature.querySelector('[data-directory-link]');

    topicSelect.addEventListener('change', () => {
      const topic = directoryTopics[topicSelect.value] || directoryTopics.all;
      kicker.textContent = topic.kicker;
      title.textContent = topic.title;
      description.textContent = topic.description;
      link.firstChild.textContent = `${topic.linkText} `;
      link.href = topic.href;
      directoryFeature.classList.remove('is-changing');
      requestAnimationFrame(() => directoryFeature.classList.add('is-changing'));
    });
  }

  const birdCanvas = document.querySelector('[data-insights-bird]');
  const birdStage = document.querySelector('[data-insights-bird-stage]');
  if (birdCanvas && birdStage) {
    const context = birdCanvas.getContext('2d', { alpha: true });
    if (context) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      let width = 1;
      let height = 1;
      let ratio = 1;
      let points = [];
      let pointerX = 0.5;
      let pointerY = 0.36;
      let targetX = pointerX;
      let targetY = pointerY;
      let activity = reducedMotion ? 0.12 : 0;
      let activityTarget = activity;
      let lastTime = 0;
      let visible = true;
      let frame = 0;

      function birdPath() {
        const path = new Path2D();
        const cx = width * 0.5;
        const top = height * 0.12;
        const span = width * 0.46;
        const shoulder = height * 0.38;
        const lowerWing = height * 0.49;

        path.moveTo(cx, shoulder);
        path.bezierCurveTo(cx - span * 0.35, top + height * 0.02, cx - span * 0.72, top - height * 0.01, cx - span, top + height * 0.05);
        path.bezierCurveTo(cx - span * 0.72, top + height * 0.15, cx - span * 0.62, shoulder - height * 0.01, cx - span * 0.82, lowerWing);
        path.bezierCurveTo(cx - span * 0.5, lowerWing - height * 0.01, cx - span * 0.25, lowerWing + height * 0.03, cx - width * 0.075, shoulder + height * 0.04);
        path.bezierCurveTo(cx - width * 0.075, height * 0.28, cx - width * 0.04, height * 0.24, cx, height * 0.24);
        path.bezierCurveTo(cx + width * 0.04, height * 0.24, cx + width * 0.075, height * 0.28, cx + width * 0.075, shoulder + height * 0.04);
        path.bezierCurveTo(cx + span * 0.25, lowerWing + height * 0.03, cx + span * 0.5, lowerWing - height * 0.01, cx + span * 0.82, lowerWing);
        path.bezierCurveTo(cx + span * 0.62, shoulder - height * 0.01, cx + span * 0.72, top + height * 0.15, cx + span, top + height * 0.05);
        path.bezierCurveTo(cx + span * 0.72, top - height * 0.01, cx + span * 0.35, top + height * 0.02, cx, shoulder);
        path.closePath();

        path.moveTo(cx - width * 0.07, height * 0.31);
        path.bezierCurveTo(cx - width * 0.075, height * 0.47, cx - width * 0.045, height * 0.59, cx, height * 0.68);
        path.bezierCurveTo(cx + width * 0.045, height * 0.59, cx + width * 0.075, height * 0.47, cx + width * 0.07, height * 0.31);
        path.closePath();
        return path;
      }

      function hash(column, row) {
        const value = Math.sin(column * 127.1 + row * 311.7) * 43758.5453123;
        return value - Math.floor(value);
      }

      function buildPoints() {
        const path = birdPath();
        const spacing = width < 700 ? 8 : clamp(width / 88, 8, 12);
        const next = [];
        let column = 0;
        for (let x = spacing; x < width - spacing; x += spacing) {
          let row = 0;
          for (let y = height * 0.07; y < height * 0.7; y += spacing) {
            if (context.isPointInPath(path, x, y)) {
              const noise = hash(column, row);
              next.push({ x, y, noise, phase: noise * Math.PI * 2, size: spacing * (0.34 + noise * 0.16) });
            }
            row += 1;
          }
          column += 1;
        }
        points = next;
      }

      function resize() {
        const bounds = birdStage.getBoundingClientRect();
        width = Math.max(1, Math.round(bounds.width));
        height = Math.max(1, Math.round(bounds.height));
        ratio = Math.min(window.devicePixelRatio || 1, 1.65);
        birdCanvas.width = Math.round(width * ratio);
        birdCanvas.height = Math.round(height * ratio);
        birdCanvas.style.width = `${width}px`;
        birdCanvas.style.height = `${height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        buildPoints();
        draw(0);
      }

      function drawContours(time) {
        context.save();
        context.strokeStyle = `rgba(241, 248, 255, ${0.2 + activity * 0.16})`;
        context.lineWidth = 1;
        context.setLineDash([2, 8]);
        context.lineDashOffset = reducedMotion ? 0 : -time * 0.012;
        for (let line = 0; line < 3; line += 1) {
          context.beginPath();
          for (let x = -10; x <= width + 10; x += 8) {
            const y = height * (0.34 + line * 0.075) + Math.sin(x * 0.018 + time * 0.0003 + line) * (8 + line * 3);
            if (x === -10) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.stroke();
        }
        context.restore();
      }

      function draw(time) {
        const delta = Math.min(32, Math.max(0, time - lastTime || 16));
        lastTime = time;
        activity += (activityTarget - activity) * Math.min(1, delta * 0.009);
        pointerX += (targetX - pointerX) * Math.min(1, delta * 0.012);
        pointerY += (targetY - pointerY) * Math.min(1, delta * 0.012);
        context.clearRect(0, 0, width, height);
        drawContours(time);

        const cursorX = pointerX * width;
        const cursorY = pointerY * height;
        const radius = Math.max(95, Math.min(width, height) * 0.24);
        points.forEach((point) => {
          const dx = point.x - cursorX;
          const dy = point.y - cursorY;
          const distance = Math.hypot(dx, dy);
          const local = clamp(1 - distance / radius, 0, 1);
          const falloff = local * local * (3 - 2 * local) * activity;
          const directionX = distance ? dx / distance : 0;
          const directionY = distance ? dy / distance : 0;
          const wave = reducedMotion ? 0 : Math.sin(time * 0.002 + point.phase);
          const push = falloff * (18 + point.noise * 24);
          const x = point.x + directionX * push + wave * activity * 2.4;
          const y = point.y + directionY * push * 0.78 + Math.cos(time * 0.0014 + point.phase) * activity * 2;
          const alpha = clamp(0.56 + point.noise * 0.36 + falloff * 0.18, 0, 1);
          const size = point.size * (1 + activity * 0.25 + falloff * 0.9);
          context.fillStyle = point.noise > 0.92
            ? `rgba(255, 255, 255, ${alpha})`
            : `rgba(239, 247, 255, ${alpha * 0.94})`;
          if (activity > 0.08) {
            context.fillRect(Math.round(x / 2) * 2 - size / 2, Math.round(y / 2) * 2 - size / 2, size, size);
          } else {
            context.beginPath();
            context.arc(x, y, size * 0.48, 0, Math.PI * 2);
            context.fill();
          }
        });
      }

      function animate(time) {
        if (visible) draw(time);
        frame = window.requestAnimationFrame(animate);
      }

      function updatePointer(event) {
        if (reducedMotion) return;
        const bounds = birdStage.getBoundingClientRect();
        targetX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
        targetY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
        activityTarget = targetY < 0.72 ? 1 : 0.22;
      }

      birdStage.addEventListener('pointermove', updatePointer, { passive: true });
      birdStage.addEventListener('pointerenter', updatePointer, { passive: true });
      birdStage.addEventListener('pointerleave', () => {
        if (reducedMotion) return;
        activityTarget = 0;
        targetX = 0.5;
        targetY = 0.36;
      });

      const visibilityObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 })
        : null;
      if (visibilityObserver) visibilityObserver.observe(birdStage);
      const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
      if (resizeObserver) resizeObserver.observe(birdStage);
      else window.addEventListener('resize', resize, { passive: true });
      resize();
      if (!reducedMotion) frame = window.requestAnimationFrame(animate);
      window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
    }
  }

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
  const coreState = consoleElement.querySelector('[data-map-core]');
  const systemMap = consoleElement.querySelector('[data-system-map]');
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
    coreState.textContent = lens.readout;
    consoleElement.dataset.activeLens = key;
    nodes.forEach((node) => node.classList.toggle('is-emphasized', lens.nodes.includes(node.dataset.node)));
    systemMap.classList.remove('is-reframing');
    requestAnimationFrame(() => systemMap.classList.add('is-reframing'));
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
