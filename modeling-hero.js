(() => {
  const canvas = document.querySelector('[data-modeling-particles]');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const context = canvas.getContext('2d');
  const pointer = { x: .5, y: .5, active: false };
  let width = 0;
  let height = 0;
  let ratio = 1;
  let particles = [];
  let frame = 0;
  let visible = true;

  const makeParticle = (initial = false) => ({
    x: Math.random() * width,
    y: initial ? Math.random() * height : height + 8,
    radius: .35 + Math.random() * 1.45,
    speed: .08 + Math.random() * .24,
    drift: (Math.random() - .5) * .12,
    phase: Math.random() * Math.PI * 2,
    warmth: Math.random() > .34
  });

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width < 700 ? 38 : 65;
    particles = Array.from({ length: count }, () => makeParticle(true));
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      const influence = pointer.active ? (pointer.x - .5) * (index % 3 + 1) * .05 : 0;
      particle.y -= particle.speed;
      particle.x += particle.drift + influence;
      particle.phase += .009;
      if (particle.y < -10 || particle.x < -15 || particle.x > width + 15) particles[index] = makeParticle(false);

      const alpha = .18 + (Math.sin(particle.phase + time * .00035) + 1) * .12;
      const glow = particle.radius * 5.5;
      const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glow);
      const color = particle.warmth ? '255,35,91' : '255,255,255';
      gradient.addColorStop(0, `rgba(${color},${alpha})`);
      gradient.addColorStop(.25, `rgba(${color},${alpha * .46})`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(particle.x, particle.y, glow, 0, Math.PI * 2);
      context.fill();
    });
    if (visible) frame = requestAnimationFrame(draw);
  };

  const hero = canvas.closest('.modeling-motion-hero');
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width;
    pointer.y = (event.clientY - bounds.top) / bounds.height;
    pointer.active = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    const nextVisible = entry.isIntersecting;
    if (nextVisible && !visible) {
      visible = true;
      frame = requestAnimationFrame(draw);
    } else if (!nextVisible && visible) {
      visible = false;
      cancelAnimationFrame(frame);
    }
  }, { threshold: .02 }).observe(hero);

  resize();
  frame = requestAnimationFrame(draw);
})();
