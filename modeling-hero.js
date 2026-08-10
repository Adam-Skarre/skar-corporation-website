(() => {
  const section = document.querySelector('[data-modeling-network-study]');
  const canvas = document.querySelector('[data-modeling-network]');
  if (!section || !canvas) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const pointer = { x: .72, y: .48, active: false };
  let width = 1;
  let height = 1;
  let ratio = 1;
  let nodes = [];
  let connections = [];
  let projected = [];
  let rotationX = -.12;
  let rotationY = .25;
  let targetRotationX = rotationX;
  let targetRotationY = rotationY;
  let autoRotation = 0;
  let frame = 0;
  let visible = true;
  let pulse = { index: 0, start: -1 };
  let lastAutomaticPulse = 0;

  const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);

  function buildNetwork() {
    const sphereCount = width < 720 ? 108 : 156;
    const coreCount = width < 720 ? 28 : 40;
    const nextNodes = [];

    for (let index = 0; index < sphereCount; index += 1) {
      const normalizedY = 1 - (index / (sphereCount - 1)) * 2;
      const radial = Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY));
      const theta = goldenAngle * index;
      const deformation = .9 + Math.sin(index * 1.73) * .1;
      nextNodes.push({
        x: Math.cos(theta) * radial * 2.25 * deformation,
        y: normalizedY * 2.35,
        z: Math.sin(theta) * radial * 2.25 * deformation,
        size: .72 + (index % 7) * .09,
        kind: 'field'
      });
    }

    for (let index = 0; index < coreCount; index += 1) {
      const progress = index / Math.max(1, coreCount - 1);
      const theta = progress * Math.PI * 6.2;
      nextNodes.push({
        x: Math.cos(theta) * (.5 + progress * .28),
        y: -1.8 + progress * 3.6,
        z: Math.sin(theta) * (.5 + progress * .28),
        size: 1.05 + (index % 4) * .13,
        kind: 'core'
      });
    }

    const connectionKeys = new Set();
    const nextConnections = [];
    nextNodes.forEach((node, index) => {
      const candidates = nextNodes
        .map((candidate, candidateIndex) => ({ candidateIndex, distance: index === candidateIndex ? Infinity : distance(node, candidate) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, node.kind === 'core' ? 4 : 3);
      candidates.forEach(({ candidateIndex, distance: nodeDistance }) => {
        if (nodeDistance > (node.kind === 'core' ? 1.25 : .82)) return;
        const key = index < candidateIndex ? `${index}-${candidateIndex}` : `${candidateIndex}-${index}`;
        if (connectionKeys.has(key)) return;
        connectionKeys.add(key);
        nextConnections.push([index, candidateIndex]);
      });
    });

    for (let index = sphereCount; index < nextNodes.length - 1; index += 1) {
      const key = `${index}-${index + 1}`;
      if (!connectionKeys.has(key)) nextConnections.push([index, index + 1]);
    }

    nodes = nextNodes;
    connections = nextConnections;
    pulse.index = sphereCount + Math.floor(coreCount * .52);
  }

  function resizeNetwork() {
    const bounds = section.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildNetwork();
    drawNetwork(0);
  }

  function rotateNode(node, angleX, angleY) {
    const cosineY = Math.cos(angleY);
    const sineY = Math.sin(angleY);
    const rotatedX = node.x * cosineY - node.z * sineY;
    const rotatedZ = node.x * sineY + node.z * cosineY;
    const cosineX = Math.cos(angleX);
    const sineX = Math.sin(angleX);
    return {
      x: rotatedX,
      y: node.y * cosineX - rotatedZ * sineX,
      z: node.y * sineX + rotatedZ * cosineX
    };
  }

  function pulseStrength(node, time) {
    if (pulse.start < 0) return 0;
    const age = Math.max(0, (time - pulse.start) * .001);
    if (age > 5.5) return 0;
    const source = nodes[pulse.index];
    const wave = age * 1.3;
    const separation = distance(node, source);
    return Math.exp(-Math.pow((separation - wave) / .23, 2)) * Math.max(0, 1 - age / 5.5);
  }

  function drawNetwork(time) {
    if (pulse.start < 0) pulse.start = time + 450;
    if (!reducedMotion && time - lastAutomaticPulse > 8200 && time - pulse.start > 5200) {
      pulse = { index: Math.floor(Math.random() * nodes.length), start: time };
      lastAutomaticPulse = time;
    }

    if (!reducedMotion) {
      autoRotation += .00038;
      rotationX += (targetRotationX - rotationX) * .035;
      rotationY += (targetRotationY - rotationY) * .035;
    }

    context.clearRect(0, 0, width, height);
    const mobile = width < 900;
    const centerX = width * (mobile ? .5 : .74);
    const centerY = height * (mobile ? .31 : .5);
    const scale = Math.min(width, height) * (mobile ? .16 : .19);
    const angleY = rotationY + autoRotation;

    projected = nodes.map((node) => {
      const rotated = rotateNode(node, rotationX, angleY);
      const perspective = 7 / (7 - rotated.z);
      return {
        x: centerX + rotated.x * scale * perspective,
        y: centerY + rotated.y * scale * perspective,
        z: rotated.z,
        depth: Math.max(0, Math.min(1, (rotated.z + 2.8) / 5.6)),
        radius: node.size * (.7 + perspective * .55),
        pulse: pulseStrength(node, time),
        kind: node.kind
      };
    });

    connections.forEach(([firstIndex, secondIndex]) => {
      const first = projected[firstIndex];
      const second = projected[secondIndex];
      const pulseLevel = Math.max(first.pulse, second.pulse);
      const depth = (first.depth + second.depth) * .5;
      context.beginPath();
      context.moveTo(first.x, first.y);
      context.lineTo(second.x, second.y);
      context.lineWidth = .45 + depth * .55 + pulseLevel * 1.1;
      context.strokeStyle = pulseLevel > .08
        ? `rgba(205, 211, 255, ${.22 + pulseLevel * .72})`
        : `rgba(112, 128, 213, ${.045 + depth * .19})`;
      context.stroke();
    });

    [...projected]
      .sort((a, b) => a.z - b.z)
      .forEach((point) => {
        const pointAlpha = .24 + point.depth * .66;
        const pointRadius = point.radius + point.pulse * 3.6;
        const glowRadius = pointRadius * (4.2 + point.pulse * 2.8);
        const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowRadius);
        const red = point.pulse > .08 ? 210 : point.kind === 'core' ? 165 : 131;
        const green = point.pulse > .08 ? 217 : point.kind === 'core' ? 178 : 149;
        const blue = 255;
        glow.addColorStop(0, `rgba(${red},${green},${blue},${Math.min(1, pointAlpha + point.pulse * .5)})`);
        glow.addColorStop(.2, `rgba(${red},${green},${blue},${.24 + point.pulse * .28})`);
        glow.addColorStop(1, `rgba(${red},${green},${blue},0)`);
        context.beginPath();
        context.fillStyle = glow;
        context.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.fillStyle = `rgba(238,241,255,${Math.min(1, pointAlpha + point.pulse * .7)})`;
        context.arc(point.x, point.y, Math.max(.55, pointRadius), 0, Math.PI * 2);
        context.fill();
      });

    if (pulse.start >= 0) {
      const age = Math.max(0, (time - pulse.start) * .001);
      const source = projected[pulse.index];
      if (source && age < 2.4) {
        context.beginPath();
        context.strokeStyle = `rgba(166,178,255,${Math.max(0, .6 - age * .24)})`;
        context.lineWidth = 1;
        context.arc(source.x, source.y, 10 + age * 72, 0, Math.PI * 2);
        context.stroke();
      }
    }
  }

  function animateNetwork(time) {
    if (visible) drawNetwork(time);
    frame = requestAnimationFrame(animateNetwork);
  }

  section.addEventListener('pointermove', (event) => {
    if (reducedMotion) return;
    const bounds = section.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width;
    pointer.y = (event.clientY - bounds.top) / bounds.height;
    pointer.active = true;
    targetRotationY = .25 + (pointer.x - .5) * .5;
    targetRotationX = -.12 + (pointer.y - .5) * .32;
  }, { passive: true });

  section.addEventListener('pointerleave', () => {
    pointer.active = false;
    targetRotationX = -.12;
    targetRotationY = .25;
  }, { passive: true });

  section.addEventListener('click', (event) => {
    if (event.target.closest('a') || !projected.length) return;
    const bounds = canvas.getBoundingClientRect();
    const clickX = event.clientX - bounds.left;
    const clickY = event.clientY - bounds.top;
    let closestIndex = 0;
    let closestDistance = Infinity;
    projected.forEach((point, index) => {
      const pointDistance = Math.hypot(point.x - clickX, point.y - clickY);
      if (pointDistance < closestDistance) {
        closestDistance = pointDistance;
        closestIndex = index;
      }
    });
    pulse = { index: closestIndex, start: performance.now() };
    if (reducedMotion) drawNetwork(performance.now());
  });

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resizeNetwork) : null;
  if (resizeObserver) resizeObserver.observe(section);
  else window.addEventListener('resize', resizeNetwork, { passive: true });

  const visibilityObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .02 })
    : null;
  if (visibilityObserver) visibilityObserver.observe(section);

  resizeNetwork();
  if (!reducedMotion) frame = requestAnimationFrame(animateNetwork);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
})();
