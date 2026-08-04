(() => {
  const canvas = document.querySelector('[data-about-mountain]');
  if (!canvas) return;

  const hero = canvas.closest('.page-hero-about');
  const context = canvas.getContext('2d', { alpha: true });
  if (!hero || !context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let particles = [];
  let frame = 0;
  let visible = true;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  function randomFactory(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function ridge(normalizedX) {
    const gaussian = (center, spread, heightFactor) => {
      const distance = (normalizedX - center) / spread;
      return Math.exp(-(distance * distance)) * heightFactor;
    };
    return height * (
      0.79
      - gaussian(0.49, 0.085, 0.19)
      - gaussian(0.64, 0.07, 0.31)
      - gaussian(0.76, 0.055, 0.23)
      - gaussian(0.87, 0.08, 0.29)
      - gaussian(0.98, 0.09, 0.17)
    );
  }

  function buildParticles() {
    const random = randomFactory(20260803);
    const count = Math.max(430, Math.min(1350, Math.round(width * height / 830)));
    particles = Array.from({ length: count }, () => {
      const normalizedX = 0.36 + random() * 0.7;
      const top = ridge(normalizedX);
      const depth = Math.pow(random(), 1.55);
      return {
        x: normalizedX * width,
        y: top + (height - top + 18) * depth,
        depth,
        radius: 0.45 + random() * 1.15,
        phase: random() * Math.PI * 2,
        speed: 0.28 + random() * 0.55
      };
    });
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildParticles();
    if (reducedMotion) draw(0);
  }

  function drawContours(time) {
    context.save();
    context.lineWidth = 0.8;
    context.setLineDash([2, 9]);
    context.lineDashOffset = reducedMotion ? 0 : -(time * 0.013);
    for (let contour = 0; contour < 3; contour += 1) {
      context.beginPath();
      for (let x = width * 0.38; x <= width * 1.02; x += 7) {
        const normalizedX = x / width;
        const y = ridge(normalizedX) + contour * 31 + Math.sin(normalizedX * 28 + contour) * 3;
        if (x === width * 0.38) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = `rgba(151, 204, 252, ${0.2 - contour * 0.045})`;
      context.stroke();
    }
    context.restore();
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.045;
    drawContours(time);

    particles.forEach((particle, index) => {
      const shimmer = reducedMotion ? 0.72 : 0.62 + Math.sin(time * 0.001 * particle.speed + particle.phase) * 0.28;
      const ridgeWeight = 1 - particle.depth;
      const alpha = Math.max(0.08, (0.16 + ridgeWeight * 0.58) * shimmer);
      const parallax = 0.25 + ridgeWeight * 0.75;
      const x = particle.x + pointerX * parallax;
      const y = particle.y + pointerY * parallax;
      context.beginPath();
      context.arc(x, y, particle.radius * (0.75 + shimmer * 0.35), 0, Math.PI * 2);
      context.fillStyle = index % 17 === 0
        ? `rgba(222, 240, 255, ${Math.min(0.9, alpha * 1.5)})`
        : `rgba(126, 186, 239, ${alpha})`;
      context.fill();
    });
  }

  function animate(time) {
    if (visible) draw(time);
    frame = window.requestAnimationFrame(animate);
  }

  if (!reducedMotion) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 11;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 7;
    });
    hero.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
    });
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 })
    : null;
  if (observer) observer.observe(hero);

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(hero);
  else window.addEventListener('resize', resize, { passive: true });

  resize();
  if (!reducedMotion) frame = window.requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
})();
