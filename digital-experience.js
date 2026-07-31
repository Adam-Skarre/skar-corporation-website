(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;

  document.querySelectorAll('[data-pointer-light]').forEach((surface) => {
    surface.addEventListener('pointermove', (event) => {
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
      surface.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
    }, { passive: true });
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
      this.canvas.addEventListener('pointermove', (event) => {
        const bounds = this.canvas.getBoundingClientRect();
        this.pointer.x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
        this.pointer.y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
        this.pointer.active = true;
      }, { passive: true });
      this.canvas.addEventListener('pointerleave', () => { this.pointer.active = false; }, { passive: true });
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
        if (this.mode === 'flow') this.drawFlow(elapsed);
        if (this.mode === 'lattice') this.drawLattice(elapsed);
        if (this.mode === 'signal') this.drawSignal(elapsed);
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

    drawFlow(t) {
      const ctx = this.context;
      const bands = 52;
      const center = this.height * 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let band = 0; band < bands; band += 1) {
        const offset = (band - bands / 2) * 5.5;
        const color = band < bands * 0.34 ? '112,236,229' : band < bands * 0.68 ? '108,167,255' : '201,116,255';
        ctx.beginPath();
        for (let x = -20; x <= this.width + 20; x += 8) {
          const p = x / this.width;
          const envelope = Math.sin(Math.PI * clamp(p, 0, 1));
          const y = center + offset * (0.3 + envelope * 0.8) + Math.sin(p * TAU * 1.75 + t * 0.42 + band * 0.045) * this.height * 0.13 * envelope + Math.cos(p * TAU * 3.4 - t * 0.28) * 18;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${color},${0.035 + (1 - Math.abs(band - bands / 2) / (bands / 2)) * 0.075})`;
        ctx.lineWidth = band % 8 === 0 ? 1.25 : 0.58;
        ctx.stroke();
      }
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

    drawSignal(t) {
      const ctx = this.context;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(this.width * 0.62, this.height * 0.5, 0, this.width * 0.62, this.height * 0.5, this.width * 0.34);
      glow.addColorStop(0, 'rgba(255,113,184,.18)');
      glow.addColorStop(0.5, 'rgba(101,145,255,.08)');
      glow.addColorStop(1, 'rgba(2,17,31,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, this.width, this.height);
      for (let line = 0; line < 30; line += 1) {
        ctx.beginPath();
        for (let x = -10; x <= this.width + 10; x += 5) {
          const p = x / this.width;
          const pulse = Math.exp(-Math.pow((p - ((t * 0.055 + line * 0.027) % 1.4 - 0.2)) * 6, 2));
          const y = this.height * 0.5 + (line - 15) * 5.2 + Math.sin(p * TAU * 2.15 + line * 0.17 - t * 0.8) * (12 + pulse * 72);
          if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line % 3 === 0 ? 'rgba(255,129,192,.14)' : line % 3 === 1 ? 'rgba(113,243,229,.13)' : 'rgba(119,159,255,.12)';
        ctx.lineWidth = line % 7 === 0 ? 1.35 : 0.65;
        ctx.stroke();
      }
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

  if (reduceMotion) {
    document.querySelectorAll('.turtle-video').forEach((video) => {
      video.addEventListener('loadeddata', () => video.pause(), { once: true });
    });
  }
})();
