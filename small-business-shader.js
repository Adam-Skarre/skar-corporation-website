(() => {
  const canvas = document.querySelector('[data-small-business-shader]');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let visible = true;

  const palette = [
    [78, 143, 231],
    [64, 183, 218],
    [101, 205, 176],
    [157, 218, 177]
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function mix(a, b, amount) {
    return a + (b - a) * amount;
  }

  function colorAt(amount, alpha) {
    const scaled = Math.max(0, Math.min(.999, amount)) * (palette.length - 1);
    const index = Math.floor(scaled);
    const blend = scaled - index;
    const a = palette[index];
    const b = palette[Math.min(index + 1, palette.length - 1)];
    return `rgba(${Math.round(mix(a[0], b[0], blend))},${Math.round(mix(a[1], b[1], blend))},${Math.round(mix(a[2], b[2], blend))},${alpha})`;
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    const mobile = width < 520;
    const cx = width * .52;
    const cy = height * .5;
    const radius = Math.min(width, height) * (mobile ? .31 : .36);
    const rotation = reduceMotion ? .35 : time * .000045;
    const count = mobile ? 5200 : 9200;
    const golden = Math.PI * (3 - Math.sqrt(5));

    const glow = ctx.createRadialGradient(cx, cy, radius * .08, cx, cy, radius * 1.25);
    glow.addColorStop(0, 'rgba(67, 173, 214, .13)');
    glow.addColorStop(.5, 'rgba(73, 139, 218, .07)');
    glow.addColorStop(1, 'rgba(53, 198, 166, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.3, 0, TAU);
    ctx.fill();

    for (let i = 0; i < count; i += 1) {
      const y0 = 1 - (i / (count - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y0 * y0));
      const angle = i * golden + rotation;

      // A compact, dependable operating core: ordered layers with subtle live variation.
      const band = Math.sin(angle * 5 + y0 * 7 - rotation * 9) * .035;
      const breathe = 1 + Math.sin(time * .00032 + y0 * 3) * .018;
      const x0 = Math.cos(angle) * ring * (1 + band) * breathe;
      const z0 = Math.sin(angle) * ring;

      const tilt = -.18;
      const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
      const perspective = 1 + z1 * .12;
      const x = cx + x0 * radius * perspective;
      const y = cy + y1 * radius * .92 * perspective;

      const depth = (z1 + 1) * .5;
      const edge = Math.pow(ring, .45);
      const alpha = (.16 + depth * .56) * (.72 + edge * .28);
      const size = (mobile ? .55 : .72) + depth * (mobile ? .72 : .95);

      ctx.fillStyle = colorAt(.12 + depth * .78, alpha);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
    }

    // Quiet structural orbits echo the Industries header without turning into a diagram.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-.18);
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.strokeStyle = `rgba(${74 + ring * 12}, ${151 + ring * 18}, ${210 - ring * 5}, ${.16 - ring * .035})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8 + ring * 2]);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1.05 + ring * .075), radius * (.38 + ring * .04), rotation * (ring % 2 ? -2 : 2), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    if (!reduceMotion && visible) frame = requestAnimationFrame(draw);
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !reduceMotion && !frame) frame = requestAnimationFrame(draw);
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: .05 });

  new ResizeObserver(() => {
    resize();
    if (reduceMotion) draw(0);
  }).observe(canvas);

  resize();
  observer.observe(canvas);
  if (reduceMotion) draw(0);
  else frame = requestAnimationFrame(draw);
})();
