(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;

  document.querySelectorAll('[data-pointer-light]').forEach((surface) => {
    if (reduceMotion) return;
    surface.addEventListener('pointermove', (event) => {
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
      surface.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
    }, { passive: true });
  });

  document.querySelectorAll('[data-lumora]').forEach((hero) => {
    const scenes = Array.from(hero.querySelectorAll('[data-lumora-scene-media]'));
    const controls = Array.from(hero.querySelectorAll('[data-lumora-scene]'));
    let activeScene = 0;
    let transitionToken = 0;
    let isOnScreen = true;

    const getVideo = (scene) => scene instanceof HTMLVideoElement ? scene : scene.querySelector('video');
    const pauseInactiveScenes = () => {
      scenes.forEach((scene, sceneIndex) => {
        const video = getVideo(scene);
        if (video && sceneIndex !== activeScene) video.pause();
      });
    };

    const updateControls = (index) => {
      controls.forEach((control, controlIndex) => {
        const isActive = controlIndex === index;
        control.classList.toggle('is-active', isActive);
        control.setAttribute('aria-pressed', String(isActive));
      });
    };

    const commitScene = (index, immediate) => {
      activeScene = index;
      hero.classList.toggle('is-switching', !immediate);
      scenes.forEach((scene, sceneIndex) => scene.classList.toggle('is-active', sceneIndex === activeScene));
      updateControls(activeScene);
      window.setTimeout(() => {
        hero.classList.remove('is-switching');
        pauseInactiveScenes();
      }, immediate ? 0 : 650);
    };

    const showScene = (index, options = {}) => {
      const targetIndex = (index + scenes.length) % scenes.length;
      const video = getVideo(scenes[targetIndex]);
      if (!video) return;

      const token = ++transitionToken;
      video.preload = 'auto';
      if (options.restart && video.readyState > 0) {
        try { video.currentTime = 0; } catch (error) {}
      }

      let revealed = false;
      const reveal = () => {
        if (revealed || token !== transitionToken) return;
        revealed = true;
        commitScene(targetIndex, Boolean(options.immediate));
      };

      if (options.immediate || targetIndex === activeScene || video.readyState >= 2) reveal();
      const playback = video.play();
      if (playback && typeof playback.then === 'function') {
        playback.then(reveal).catch(() => {});
      }
    };

    controls.forEach((control, index) => {
      control.addEventListener('click', () => showScene(index));
    });

    scenes.forEach((scene, index) => {
      const video = getVideo(scene);
      if (!video) return;
      video.muted = true;
      video.playsInline = true;
      if (index !== 0) video.pause();
    });

    const visibilityObserver = new IntersectionObserver((entries) => {
      isOnScreen = entries[0].isIntersecting;
      const video = getVideo(scenes[activeScene]);
      if (!video) return;
      if (!isOnScreen || document.hidden) video.pause();
      else {
        const playback = video.play();
        if (playback && typeof playback.catch === 'function') playback.catch(() => {});
      }
    }, { rootMargin: '120px' });
    visibilityObserver.observe(hero);

    document.addEventListener('visibilitychange', () => {
      const video = getVideo(scenes[activeScene]);
      if (!video) return;
      if (document.hidden) video.pause();
      else if (isOnScreen) {
        const playback = video.play();
        if (playback && typeof playback.catch === 'function') playback.catch(() => {});
      }
    });

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) showScene(0, { immediate: true, restart: true });
    });
    window.addEventListener('pagehide', () => scenes.forEach((scene) => {
      const video = getVideo(scene);
      if (video) video.pause();
    }));

    showScene(0, { immediate: true });
  });

  class DigitalField {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d', { alpha: true });
      this.mode = canvas.dataset.digitalArt;
      this.width = 0;
      this.height = 0;
      this.pixelRatio = 1;
      this.running = true;
      this.start = performance.now();
      this.pointer = { x: 0.5, y: 0.5, active: false };
      this.nodes = [];
      this.particles = [];
      this.frame = this.frame.bind(this);
      this.resize = this.resize.bind(this);
      this.seed();
      this.bind();
      this.resize();
      requestAnimationFrame(this.frame);
    }

    seed() {
      const count = this.mode === 'lattice' ? 58 : this.mode === 'software' ? 44 : 84;
      this.nodes = Array.from({ length: count }, (_, index) => ({
        index,
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        phase: Math.random() * TAU,
        speed: 0.35 + Math.random() * 0.9,
        size: 0.45 + Math.random() * 1.45
      }));
      this.particles = Array.from({ length: 150 }, (_, index) => ({
        index,
        phase: Math.random() * TAU,
        lane: Math.random(),
        speed: 0.2 + Math.random() * 0.75,
        size: 0.45 + Math.random() * 1.3
      }));
    }

    bind() {
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(this.canvas);
      this.visibility = new IntersectionObserver((entries) => {
        this.running = entries[0].isIntersecting;
      }, { rootMargin: '160px' });
      this.visibility.observe(this.canvas);
      if (!reduceMotion) {
        this.canvas.addEventListener('pointermove', (event) => {
          const bounds = this.canvas.getBoundingClientRect();
          this.pointer.x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
          this.pointer.y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
          this.pointer.active = true;
        }, { passive: true });
        this.canvas.addEventListener('pointerleave', () => { this.pointer.active = false; }, { passive: true });
      }
    }

    resize() {
      const bounds = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, bounds.width);
      this.height = Math.max(1, bounds.height);
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * this.pixelRatio);
      this.canvas.height = Math.round(this.height * this.pixelRatio);
      this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    }

    frame(now) {
      if (this.running) {
        const elapsed = reduceMotion ? 2.4 : (now - this.start) / 1000;
        this.context.clearRect(0, 0, this.width, this.height);
        if (this.mode === 'interface') this.drawInterface(elapsed);
        if (this.mode === 'lattice') this.drawLattice(elapsed);
        if (this.mode === 'software') this.drawSoftware(elapsed);
      }
      requestAnimationFrame(this.frame);
    }

    gradient(colors, x0 = 0, y0 = 0, x1 = this.width, y1 = this.height) {
      const gradient = this.context.createLinearGradient(x0, y0, x1, y1);
      colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color));
      return gradient;
    }

    drawInterface(t) {
      const ctx = this.context;
      const cx = this.width * (0.5 + (this.pointer.active ? (this.pointer.x - 0.5) * 0.05 : 0));
      const cy = this.height * (0.5 + (this.pointer.active ? (this.pointer.y - 0.5) * 0.05 : 0));
      const scale = Math.min(this.width, this.height) * 0.34;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.035);

      for (let strand = 0; strand < 92; strand += 1) {
        const phase = strand / 92 * TAU;
        const hueShift = Math.sin(phase + t * 0.3);
        ctx.beginPath();
        for (let step = 0; step <= 170; step += 1) {
          const u = step / 170 * TAU;
          const radius = 0.48 + 0.18 * Math.sin(u * 3 + phase * 2 + t * 0.7);
          const warp = 0.25 * Math.sin(u * 2 - t * 0.55 + phase);
          const x = scale * (Math.cos(u + phase * 0.08) * (radius + warp) + 0.24 * Math.cos(u * 2 + phase));
          const y = scale * (Math.sin(u * 1.5 + phase * 0.12) * (0.5 + radius * 0.5) + 0.12 * Math.sin(u * 4 - t));
          if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${lerp(186, 286, (hueShift + 1) / 2)}, 92%, 76%, ${0.025 + strand / 92 * 0.045})`;
        ctx.lineWidth = strand % 9 === 0 ? 1.1 : 0.55;
        ctx.stroke();
      }

      for (let index = 0; index < 72; index += 1) {
        const phase = index / 72 * TAU + t * (0.08 + (index % 4) * 0.004);
        const radius = scale * (0.22 + 0.72 * ((index * 17) % 71) / 71);
        const x = Math.cos(phase * 1.3) * radius + Math.sin(phase * 4) * scale * 0.08;
        const y = Math.sin(phase) * radius * 0.62;
        ctx.fillStyle = index % 3 === 0 ? 'rgba(111,246,231,.68)' : index % 3 === 1 ? 'rgba(116,167,255,.62)' : 'rgba(229,127,255,.56)';
        ctx.beginPath();
        ctx.arc(x, y, index % 11 === 0 ? 2.2 : 1.05, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawBloom(t) {
      const ctx = this.context;
      const scale = Math.min(this.width, this.height) * 0.5;
      const centerX = this.width * 0.5;
      const centerY = this.height * 0.42;
      const rotation = t * 0.16 + (this.pointer.active ? (this.pointer.x - 0.5) * 0.38 : 0);
      const tilt = 1.03 + (this.pointer.active ? (this.pointer.y - 0.5) * 0.14 : 0);
      const cosRotation = Math.cos(rotation);
      const sinRotation = Math.sin(rotation);
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);
      const evolution = (Math.sin(t * 0.32 - Math.PI / 2) + 1) * 0.5;
      const opening = lerp(0.88, 1, evolution);
      const droop = lerp(0.075, 0.275, evolution);
      const focal = scale * 3.9;
      const foldCount = 10;

      ctx.save();
      ctx.strokeStyle = 'rgba(142,80,27,.92)';
      ctx.lineWidth = Math.max(6, scale * 0.022);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + scale * 0.03);
      ctx.bezierCurveTo(centerX + scale * 0.025, centerY + scale * 0.32, centerX - scale * 0.08, centerY + scale * 0.72, centerX - scale * 0.055, this.height + 20);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(237,151,58,.22)';
      ctx.lineWidth = Math.max(1.5, scale * 0.004);
      ctx.stroke();

      const renderedPaths = [];
      this.bloomPaths.forEach((path) => {
        for (let fold = 0; fold < foldCount; fold += 1) {
          const foldAngle = fold / foldCount * TAU;
          let depthTotal = 0;
          const points = path.points.map((point) => {
            const angle = foldAngle + point.lateral * lerp(0.72, 1.05, evolution);
            const radius = scale * (0.045 + point.reach * 0.75 * opening + point.radialWarp);
            const worldX = Math.cos(angle) * radius;
            const worldZ = Math.sin(angle) * radius;
            const worldY = scale * (-0.065 + droop * Math.pow(point.reach, 1.72) + point.lift * lerp(0.62, 1, evolution));
            const rotatedX = worldX * cosRotation - worldZ * sinRotation;
            const rotatedZ = worldX * sinRotation + worldZ * cosRotation;
            const tiltedY = worldY * cosTilt - rotatedZ * sinTilt;
            const depth = worldY * sinTilt + rotatedZ * cosTilt;
            const perspective = focal / (focal + depth);
            depthTotal += depth;
            return {
              x: centerX + rotatedX * perspective,
              y: centerY + tiltedY * perspective,
              depth,
              reach: point.reach,
              phase: point.phase,
              perspective
            };
          });
          renderedPaths.push({
            points,
            pathIndex: path.pathIndex,
            fold,
            depth: depthTotal / points.length
          });
        }
      });
      renderedPaths.sort((a, b) => b.depth - a.depth);

      ctx.globalCompositeOperation = 'lighter';
      renderedPaths.forEach((path) => {
        const warm = path.pathIndex % 3;
        ctx.strokeStyle = warm === 0 ? 'rgba(255,73,55,.13)' : warm === 1 ? 'rgba(255,113,75,.115)' : 'rgba(255,159,112,.1)';
        ctx.lineWidth = path.pathIndex % 5 === 0 ? 0.9 : 0.48;
        ctx.beginPath();
        path.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();

        for (let index = 2; index < path.points.length; index += 3) {
          const point = path.points[index];
          const fringe = clamp((point.reach - 0.68) / 0.32, 0, 1);
          const shimmer = 0.78 + Math.sin(t * 0.85 + point.phase + path.fold) * 0.14;
          ctx.fillStyle = fringe > 0.18
            ? `rgba(${lerp(255,190,fringe)},${lerp(119,188,fringe)},${lerp(82,242,fringe)},${(0.18 + fringe * 0.34) * shimmer})`
            : `rgba(255,${74 + warm * 20},${54 + warm * 12},${0.2 * shimmer})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, (0.48 + fringe * 0.82) * point.perspective, 0, TAU);
          ctx.fill();
        }
      });

      const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 0.12);
      core.addColorStop(0, 'rgba(255,218,165,.82)');
      core.addColorStop(0.32, 'rgba(255,101,64,.48)');
      core.addColorStop(1, 'rgba(194,31,48,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(centerX, centerY, scale * 0.12, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawLattice(t) {
      const ctx = this.context;
      const points = this.nodes.map((node) => {
        const angle = node.phase + t * node.speed * 0.08;
        const pull = this.pointer.active ? 1 - Math.min(1, Math.hypot(node.x - this.pointer.x, node.y - this.pointer.y) * 2.2) : 0;
        return {
          x: (node.x + Math.cos(angle) * 0.018 + (this.pointer.x - node.x) * pull * 0.025) * this.width,
          y: (node.y + Math.sin(angle * 1.4) * 0.018 + (this.pointer.y - node.y) * pull * 0.025) * this.height,
          size: node.size
        };
      });
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      points.forEach((point, index) => {
        for (let other = index + 1; other < points.length; other += 1) {
          const target = points[other];
          const distance = Math.hypot(point.x - target.x, point.y - target.y);
          if (distance < Math.min(this.width, this.height) * 0.18) {
            ctx.strokeStyle = `rgba(105,196,255,${(1 - distance / (Math.min(this.width, this.height) * 0.18)) * 0.13})`;
            ctx.lineWidth = 0.55;
            ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(target.x, target.y); ctx.stroke();
          }
        }
        ctx.fillStyle = index % 6 === 0 ? 'rgba(123,245,225,.8)' : 'rgba(135,174,255,.56)';
        ctx.beginPath(); ctx.arc(point.x, point.y, point.size, 0, TAU); ctx.fill();
      });
      ctx.restore();
    }

    drawSoftware(t) {
      const ctx = this.context;
      const cx = this.width * 0.5;
      const cy = this.height * 0.5;
      const radius = Math.min(this.width, this.height) * 0.36;
      const rings = [0.24, 0.45, 0.68, 0.92];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      rings.forEach((ring, ringIndex) => {
        ctx.strokeStyle = `rgba(${ringIndex % 2 ? '111,181,255' : '104,240,226'},${0.12 + ringIndex * 0.025})`;
        ctx.lineWidth = ringIndex === 0 ? 1.4 : 0.75;
        ctx.beginPath(); ctx.ellipse(cx, cy, radius * ring, radius * ring * (0.62 + ringIndex * 0.035), t * 0.018 * (ringIndex % 2 ? -1 : 1), 0, TAU); ctx.stroke();
      });
      const mapped = this.nodes.map((node, index) => {
        const ring = rings[index % rings.length];
        const angle = node.phase + t * 0.05 * (index % 2 ? -1 : 1);
        return {
          x: cx + Math.cos(angle) * radius * ring,
          y: cy + Math.sin(angle) * radius * ring * 0.68,
          ring: index % rings.length,
          size: node.size
        };
      });
      mapped.forEach((point, index) => {
        const partner = mapped[(index * 7 + 11) % mapped.length];
        if (point.ring !== partner.ring && index % 2 === 0) {
          ctx.strokeStyle = 'rgba(105,170,244,.055)';
          ctx.lineWidth = 0.55;
          ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(partner.x, partner.y); ctx.stroke();
        }
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.1 + index);
        ctx.fillStyle = index % 5 === 0 ? `rgba(113,245,229,${0.48 + pulse * 0.4})` : `rgba(123,168,255,${0.32 + pulse * 0.3})`;
        ctx.beginPath(); ctx.arc(point.x, point.y, point.size + pulse, 0, TAU); ctx.fill();
      });
      for (let index = 0; index < 22; index += 1) {
        const p = (t * (0.025 + (index % 4) * 0.004) + index / 22) % 1;
        const angle = p * TAU + (index % 2 ? Math.PI : 0);
        const ring = rings[index % rings.length];
        const x = cx + Math.cos(angle) * radius * ring;
        const y = cy + Math.sin(angle) * radius * ring * 0.68;
        ctx.fillStyle = index % 2 ? 'rgba(255,127,211,.75)' : 'rgba(115,246,231,.8)';
        ctx.beginPath(); ctx.arc(x, y, index % 5 === 0 ? 2.7 : 1.25, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  document.querySelectorAll('canvas[data-digital-art]').forEach((canvas) => new DigitalField(canvas));
})();
