(() => {
  const canvas = document.querySelector('[data-about-sunrise]');
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 1;
  let height = 1;
  let ratio = 1;
  let visible = true;
  let frame = 0;

  function resize() {
    const bounds = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (reducedMotion) draw(0);
  }

  function draw(time) {
    const t = reducedMotion ? 9.5 : time * 0.00018;
    const horizon = height * 0.57;
    const sunX = width * (width < 720 ? 0.68 : 0.72);
    const sunRadius = Math.max(13, Math.min(width, height) * 0.034);
    const cycle = 0.5 + 0.5 * Math.sin(t * 0.32 - 0.7);
    const sunY = horizon + sunRadius * 0.36 - cycle * sunRadius * 0.72;

    const sky = context.createLinearGradient(0, 0, 0, horizon + 20);
    sky.addColorStop(0, '#020305');
    sky.addColorStop(0.62, '#050608');
    sky.addColorStop(0.9, '#16100c');
    sky.addColorStop(1, '#684121');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(sunX, horizon, 0, sunX, horizon, sunRadius * 7.5);
    glow.addColorStop(0, 'rgba(255,244,188,.95)');
    glow.addColorStop(0.1, 'rgba(255,170,58,.74)');
    glow.addColorStop(0.34, 'rgba(203,90,24,.24)');
    glow.addColorStop(1, 'rgba(30,13,7,0)');
    context.fillStyle = glow;
    context.fillRect(sunX - sunRadius * 8, horizon - sunRadius * 5, sunRadius * 16, sunRadius * 10);

    const sun = context.createRadialGradient(sunX - sunRadius * 0.2, sunY - sunRadius * 0.25, 1, sunX, sunY, sunRadius);
    sun.addColorStop(0, '#fffef1');
    sun.addColorStop(0.46, '#fff1a4');
    sun.addColorStop(0.78, '#ffb12f');
    sun.addColorStop(1, 'rgba(239,91,13,0)');
    context.fillStyle = sun;
    context.beginPath();
    context.arc(sunX, sunY, sunRadius * 1.22, 0, Math.PI * 2);
    context.fill();

    const water = context.createLinearGradient(0, horizon, 0, height);
    water.addColorStop(0, '#5d5141');
    water.addColorStop(0.09, '#363536');
    water.addColorStop(0.48, '#171719');
    water.addColorStop(1, '#080708');
    context.fillStyle = water;
    context.fillRect(0, horizon, width, height - horizon);

    const layers = width < 720 ? 54 : 76;
    for (let layer = 0; layer < layers; layer += 1) {
      const v = layer / Math.max(1, layers - 1);
      const baseY = horizon + Math.pow(v, 1.52) * (height - horizon + 10);
      const amplitude = 1.2 + v * v * height * 0.025;
      const frequency = 0.022 - v * 0.009;
      const phase = t * (2.1 + v * 1.9) + layer * 1.73;
      context.beginPath();
      for (let x = -8; x <= width + 8; x += 5) {
        const broad = Math.sin(x * frequency + phase) * amplitude;
        const fine = Math.sin(x * frequency * 2.7 - phase * 1.4 + layer) * amplitude * 0.34;
        const y = baseY + broad + fine;
        if (x === -8) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      const horizonLight = Math.pow(1 - v, 1.9);
      context.strokeStyle = `rgba(${118 + horizonLight * 92},${112 + horizonLight * 72},${106 + horizonLight * 38},${0.09 + horizonLight * 0.25})`;
      context.lineWidth = 0.65 + v * 1.05;
      context.stroke();
    }

    context.save();
    context.globalCompositeOperation = 'screen';
    const reflectionWidth = sunRadius * (1.25 + Math.pow((height - horizon) / Math.max(1, height), 0.5));
    for (let band = 0; band < 46; band += 1) {
      const v = band / 45;
      const y = horizon + 4 + Math.pow(v, 1.28) * (height - horizon - 10);
      const spread = reflectionWidth * (0.65 + v * 4.5);
      const offset = Math.sin(band * 2.37 + t * 5.2) * spread * 0.32;
      const segment = spread * (0.22 + 0.3 * (0.5 + 0.5 * Math.sin(band * 4.1 - t * 3)));
      const alpha = (1 - v) * 0.5 + 0.045;
      context.strokeStyle = `rgba(255,${186 + Math.round((1 - v) * 53)},${76 + Math.round((1 - v) * 92)},${alpha})`;
      context.lineWidth = 1 + (1 - v) * 1.35;
      context.beginPath();
      context.moveTo(sunX + offset - segment, y);
      context.lineTo(sunX + offset + segment, y + Math.sin(band + t) * 1.4);
      context.stroke();
    }
    context.restore();

    const vignette = context.createRadialGradient(width * 0.62, height * 0.56, Math.min(width, height) * 0.16, width * 0.52, height * 0.54, Math.max(width, height) * 0.76);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.58)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }

  function animate(time) {
    if (visible) draw(time);
    frame = window.requestAnimationFrame(animate);
  }

  const visibilityObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 })
    : null;
  if (visibilityObserver) visibilityObserver.observe(canvas);

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(canvas.parentElement);
  else window.addEventListener('resize', resize, { passive: true });

  resize();
  if (!reducedMotion) frame = window.requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
})();
