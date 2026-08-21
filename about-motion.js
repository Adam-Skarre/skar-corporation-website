(() => {
  const canvas = document.querySelector('[data-about-mountain]');
  const stage = document.querySelector('[data-about-mountain-stage]');
  const hero = document.querySelector('[data-about-hero]');
  if (!canvas || !stage || !hero) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let points = [];
  let frame = 0;
  let visible = true;
  let activity = reducedMotion ? 0.18 : 0;
  let activityTarget = reducedMotion ? 0.18 : 0;
  let pointerX = 0.72;
  let pointerY = 0.52;
  let pointerTargetX = pointerX;
  let pointerTargetY = pointerY;
  let lastTime = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const gaussian = (x, center, spread, amplitude) => {
    const distance = (x - center) / spread;
    return Math.exp(-(distance * distance)) * amplitude;
  };

  function ridge(normalizedX) {
    const rollingBase = 0.875 + Math.sin(normalizedX * 14.5) * 0.008;
    return rollingBase
      - gaussian(normalizedX, 0.23, 0.075, 0.105)
      - gaussian(normalizedX, 0.365, 0.054, 0.19)
      - gaussian(normalizedX, 0.585, 0.115, 0.31)
      - gaussian(normalizedX, 0.69, 0.073, 0.255)
      - gaussian(normalizedX, 0.805, 0.098, 0.29)
      - gaussian(normalizedX, 0.955, 0.13, 0.19);
  }

  function hash(column, row) {
    const value = Math.sin(column * 127.1 + row * 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }

  function buildPoints() {
    const mobile = width < 700;
    const spacing = mobile ? 8.5 : clamp(width / 178, 8.2, 12.2);
    const startY = height * (mobile ? 0.29 : 0.22);
    const bottom = height + spacing;
    const next = [];
    let column = 0;

    for (let x = -spacing; x <= width + spacing; x += spacing) {
      const normalizedX = x / width;
      const ridgeY = ridge(normalizedX) * height;
      let row = 0;
      for (let y = Math.max(startY, ridgeY); y <= bottom; y += spacing) {
        const depth = clamp((y - ridgeY) / Math.max(1, bottom - ridgeY), 0, 1);
        const noise = hash(column, row);
        const edge = Math.exp(-depth * 3.6);
        next.push({
          x,
          y,
          normalizedX,
          depth,
          edge,
          noise,
          phase: noise * Math.PI * 2,
          size: spacing * (0.22 + edge * 0.16 + noise * 0.07)
        });
        row += 1;
      }
      column += 1;
    }
    points = next;
  }

  function resize() {
    const bounds = stage.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.65);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildPoints();
    if (reducedMotion) draw(0);
  }

  function drawContour(time, offset, alpha, dash) {
    context.save();
    context.beginPath();
    for (let x = -8; x <= width + 8; x += 6) {
      const normalizedX = x / width;
      const ripple = reducedMotion ? 0 : Math.sin(normalizedX * 18 + time * 0.00032 + offset) * activity * 3.2;
      const y = ridge(normalizedX) * height + offset + ripple;
      if (x === -8) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = `rgba(244, 250, 255, ${alpha})`;
    context.lineWidth = 1;
    context.setLineDash(dash);
    context.lineDashOffset = reducedMotion ? 0 : -time * 0.012;
    context.stroke();
    context.restore();
  }

  function drawSignal(time) {
    const baseline = height * 0.56;
    context.save();
    context.beginPath();
    for (let x = width * 0.06; x <= width * 0.94; x += 8) {
      const normalized = (x - width * 0.06) / (width * 0.88);
      const envelope = Math.sin(normalized * Math.PI);
      const y = baseline
        - Math.sin(normalized * 17.5 + time * 0.00022) * height * 0.042 * envelope
        - Math.sin(normalized * 42) * height * 0.009;
      if (x === width * 0.06) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = `rgba(247, 251, 255, ${0.13 + activity * 0.16})`;
    context.lineWidth = 1.15;
    context.stroke();
    context.restore();
  }

  function draw(time) {
    const delta = Math.min(32, Math.max(0, time - lastTime || 16));
    lastTime = time;
    activity += (activityTarget - activity) * Math.min(1, delta * 0.0085);
    pointerX += (pointerTargetX - pointerX) * Math.min(1, delta * 0.011);
    pointerY += (pointerTargetY - pointerY) * Math.min(1, delta * 0.011);

    context.clearRect(0, 0, width, height);
    drawSignal(time);
    drawContour(time, 0, 0.52, [2, 7]);
    drawContour(time, 20, 0.22, [1, 9]);
    drawContour(time, 42, 0.13, [1, 11]);

    const cursorX = pointerX * width;
    const cursorY = pointerY * height;
    const influenceRadius = Math.max(105, Math.min(width, height) * 0.28);

    points.forEach((point) => {
      const dx = point.x - cursorX;
      const dy = point.y - cursorY;
      const distance = Math.hypot(dx, dy);
      const local = clamp(1 - distance / influenceRadius, 0, 1);
      const falloff = local * local * (3 - 2 * local) * activity;
      const directionX = distance > 0 ? dx / distance : 0;
      const directionY = distance > 0 ? dy / distance : 0;
      const wave = reducedMotion ? 0 : Math.sin(time * 0.002 + point.phase + point.normalizedX * 19);
      const strata = reducedMotion ? 0 : Math.sin(time * 0.0012 + point.y * 0.033 + point.phase);
      const push = falloff * (11 + point.edge * 18);
      const driftX = activity * (wave * 2.2 + strata * point.edge * 2.8);
      const driftY = activity * (strata * 1.5 - point.edge * 2.2);
      const x = point.x + directionX * push + driftX;
      const y = point.y + directionY * push * 0.72 + driftY;
      const shimmer = reducedMotion ? 0.78 : 0.69 + Math.sin(time * 0.0011 + point.phase) * 0.16;
      const alpha = clamp((0.42 + point.edge * 0.5) * shimmer + falloff * 0.24, 0.24, 1);
      const size = point.size * (1 + activity * 0.38 + falloff * 0.62);

      context.fillStyle = point.noise > 0.94
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(241, 248, 255, ${alpha * 0.93})`;

      if (activity > 0.08) {
        const quantizedX = Math.round(x / 2) * 2;
        const quantizedY = Math.round(y / 2) * 2;
        context.fillRect(quantizedX - size / 2, quantizedY - size / 2, size, size);
      } else {
        context.beginPath();
        context.arc(x, y, size * 0.47, 0, Math.PI * 2);
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
    // The Insights card scales and translates this canvas for its cropped
    // mountain composition. Map the pointer against that transformed canvas,
    // not the untransformed card, so the disturbance stays under the cursor.
    const bounds = canvas.getBoundingClientRect();
    const normalizedX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const normalizedY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    pointerTargetX = normalizedX;
    pointerTargetY = normalizedY;
    const mountainTop = ridge(normalizedX);
    activityTarget = normalizedY >= mountainTop - 0.08 ? 1 : 0;
    hero.classList.toggle('is-mountain-active', activityTarget > 0.5);
  }

  stage.addEventListener('pointermove', updatePointer, { passive: true });
  stage.addEventListener('pointerenter', updatePointer, { passive: true });
  stage.addEventListener('pointerdown', (event) => {
    updatePointer(event);
    activityTarget = reducedMotion ? 0.18 : 1;
    hero.classList.add('is-mountain-active');
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    if (reducedMotion) return;
    activityTarget = 0;
    pointerTargetX = 0.72;
    pointerTargetY = 0.52;
    hero.classList.remove('is-mountain-active');
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 })
    : null;
  if (observer) observer.observe(hero);

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(stage);
  else window.addEventListener('resize', resize, { passive: true });

  resize();
  if (!reducedMotion) frame = window.requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
})();
