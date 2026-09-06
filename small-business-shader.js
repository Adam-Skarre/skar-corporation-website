(() => {
  'use strict';
  const canvas = document.querySelector('[data-small-business-shader]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const TAU = Math.PI * 2;
  const PHI = Math.PI * (3 - Math.sqrt(5));
  const palette = ['111,170,224', '139,202,225', '194,225,239'];
  let width = 1, height = 1, dpr = 1, points = [];
  let visible = true, raf = 0, last = 0, elapsed = 0;

  function hash(value) {
    const result = Math.sin(value * 91.73 + 17.19) * 43758.5453;
    return result - Math.floor(result);
  }

  function rotatePlane(x, y, z, tiltX, tiltY) {
    const cx = Math.cos(tiltX), sx = Math.sin(tiltX);
    const cy = Math.cos(tiltY), sy = Math.sin(tiltY);
    const y1 = y * cx - z * sx;
    const z1 = y * sx + z * cx;
    return { x: x * cy + z1 * sy, y: y1, z: -x * sy + z1 * cy };
  }

  function build() {
    points = [];
    const shellCount = mobile.matches ? 780 : 1450;
    const coreCount = mobile.matches ? 280 : 520;
    const ringCount = mobile.matches ? 70 : 120;
    for (let i = 0; i < shellCount; i++) {
      const y = 1 - 2 * (i + .5) / shellCount;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = i * PHI;
      const variation = .965 + .045 * Math.sin(angle * 3 + y * 8);
      points.push({
        x: Math.cos(angle) * ring * variation,
        y: y * variation,
        z: Math.sin(angle) * ring * variation,
        size: .48 + hash(i) * .5,
        tone: i % 3,
        alpha: .17 + hash(i + 9) * .28
      });
    }
    for (let i = 0; i < coreCount; i++) {
      const y = 1 - 2 * (i + .5) / coreCount;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = i * PHI + .7;
      const scale = .43 + hash(i + 31) * .055;
      points.push({
        x: Math.cos(angle) * ring * scale,
        y: y * scale,
        z: Math.sin(angle) * ring * scale,
        size: .55 + hash(i + 51) * .55,
        tone: (i + 1) % 3,
        alpha: .2 + hash(i + 71) * .32
      });
    }
    const tilts = [[.2, .45], [1.15, -.28], [-.72, .92], [.58, 1.38]];
    tilts.forEach(([tiltX, tiltY], orbit) => {
      for (let i = 0; i < ringCount; i++) {
        const angle = i / ringCount * TAU;
        const radius = .66 + orbit * .082;
        const point = rotatePlane(Math.cos(angle) * radius, Math.sin(angle) * radius, 0, tiltX, tiltY);
        points.push({
          ...point,
          size: .46 + (i % 17 === 0 ? .8 : 0),
          tone: orbit % 3,
          alpha: i % 17 === 0 ? .72 : .14
        });
      }
    });
  }

  function transform(point, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = point.x * cy + point.z * sy;
    const z1 = -point.x * sy + point.z * cy;
    return { x: x1, y: point.y * cp - z1 * sp, z: point.y * sp + z1 * cp };
  }

  function drawOrbit(tiltX, tiltY, radius, yaw, pitch, alpha) {
    ctx.beginPath();
    for (let i = 0; i <= 150; i++) {
      const angle = i / 150 * TAU;
      const plane = rotatePlane(Math.cos(angle) * radius, Math.sin(angle) * radius, 0, tiltX, tiltY);
      const point = transform(plane, yaw, pitch);
      const perspective = 1 / (1.16 - point.z * .105);
      const x = width * .52 + point.x * Math.min(width, height) * .34 * perspective;
      const y = height * .5 + point.y * Math.min(width, height) * .34 * perspective;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(116,177,222,${alpha})`;
    ctx.lineWidth = Math.max(.5, dpr * .45);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const centerX = width * .52, centerY = height * .5;
    const radius = Math.min(width, height) * .34;
    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.45);
    glow.addColorStop(0, 'rgba(52,137,191,.13)');
    glow.addColorStop(.46, 'rgba(28,91,139,.055)');
    glow.addColorStop(1, 'rgba(4,22,38,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const yaw = .55 + elapsed * .13;
    const pitch = -.18 + Math.sin(elapsed * .16) * .07;
    drawOrbit(.2, .45, .67, yaw, pitch, .14);
    drawOrbit(1.15, -.28, .75, yaw, pitch, .1);
    drawOrbit(-.72, .92, .83, yaw, pitch, .08);

    const projected = points.map((point, index) => {
      const moved = transform(point, yaw, pitch);
      const perspective = 1 / (1.16 - moved.z * .105);
      return {
        ...point,
        index,
        z: moved.z,
        x: centerX + moved.x * radius * perspective,
        y: centerY + moved.y * radius * perspective
      };
    }).sort((a, b) => a.z - b.z);

    for (const point of projected) {
      const depth = Math.max(0, Math.min(1, .5 + point.z * .46));
      const pulse = .84 + .16 * Math.sin(elapsed * .72 + point.index * .071);
      const alpha = point.alpha * (.45 + depth * .72) * pulse;
      const size = point.size * dpr * (.72 + depth * .48);
      ctx.fillStyle = `rgba(${palette[point.tone]},${alpha})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, TAU);
      ctx.fill();
    }

    for (let signal = 0; signal < 5; signal++) {
      const angle = elapsed * (.22 + signal * .013) + signal * TAU / 5;
      const plane = rotatePlane(Math.cos(angle) * .75, Math.sin(angle) * .75, 0, 1.15, -.28);
      const point = transform(plane, yaw, pitch);
      const perspective = 1 / (1.16 - point.z * .105);
      const x = centerX + point.x * radius * perspective;
      const y = centerY + point.y * radius * perspective;
      const signalRadius = (1.25 + .35 * Math.sin(elapsed * 1.2 + signal)) * dpr;
      ctx.fillStyle = 'rgba(218,240,248,.82)';
      ctx.shadowColor = 'rgba(105,188,229,.72)';
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, signalRadius, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, mobile.matches ? 1.35 : 1.7);
    width = canvas.width = Math.max(1, Math.round(bounds.width * dpr));
    height = canvas.height = Math.max(1, Math.round(bounds.height * dpr));
    draw();
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden || reducedMotion.matches) {
      last = 0;
      return;
    }
    if (!last || now - last >= 1000 / 30) {
      elapsed += last ? Math.min((now - last) / 1000, .08) : 0;
      last = now;
      draw();
    }
    raf = requestAnimationFrame(frame);
  }

  function schedule() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (visible && !document.hidden && !reducedMotion.matches) raf = requestAnimationFrame(frame);
  }

  build();
  resize();
  schedule();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }, { rootMargin: '100px' }).observe(canvas);
  }
  reducedMotion.addEventListener('change', () => { draw(); schedule(); });
  mobile.addEventListener('change', () => { build(); resize(); });
  document.addEventListener('visibilitychange', schedule);
  addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  addEventListener('pageshow', schedule);
})();
