(() => {
  const TAU = Math.PI * 2;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  class FormStudy {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.kind = canvas.dataset.formStudy;
      this.visible = true;
      this.start = performance.now();
      this.last = 0;
      this.resize = this.resize.bind(this);
      this.frame = this.frame.bind(this);
      this.resize();
      new ResizeObserver(this.resize).observe(canvas);
      new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
      }, { rootMargin: '120px' }).observe(canvas);
      requestAnimationFrame(this.frame);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.mobile = matchMedia('(max-width: 760px)').matches;
      const dpr = Math.min(devicePixelRatio || 1, this.mobile ? 2 : 1.6);
      this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.dpr = dpr;
    }

    frame(now) {
      const interval = reducedMotion ? 1000 : (this.mobile ? 42 : 30);
      if (!document.hidden && this.visible && now - this.last > interval) {
        this.last = now;
        const t = reducedMotion ? 1.4 : (now - this.start) * .00024;
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.kind === 'figure') this.drawFigure(t);
        else if (this.kind === 'wreath') this.drawWreath(t);
        else if (this.kind === 'dialogue') this.drawDialogue(t);
        else if (this.kind === 'convergence') this.drawConvergence(t);
        else if (this.kind === 'chamber') this.drawChamber(t);
        else if (this.kind === 'migration') this.drawMigration(t);
        else if (this.kind === 'medusa') this.drawMedusa(t);
        else if (this.kind === 'infinite') this.drawInfinite(t);
      }
      requestAnimationFrame(this.frame);
    }

    prepare(cx, cy, radius) {
      const ctx = this.ctx;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      glow.addColorStop(0, 'rgba(54,145,187,.16)');
      glow.addColorStop(.5, 'rgba(17,72,105,.07)');
      glow.addColorStop(1, 'rgba(3,15,27,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    finish() {
      this.ctx.globalAlpha = 1;
      this.ctx.shadowBlur = 0;
      this.ctx.globalCompositeOperation = 'source-over';
    }

    drawFigure(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .53, cy = h * .5;
      const scale = Math.min(w, h) * .31;
      this.prepare(cx, cy, Math.min(w, h) * .5);

      const ribbons = this.mobile ? 46 : 74;
      const steps = this.mobile ? 88 : 132;
      for (let r = 0; r < ribbons; r++) {
        const v = (r / (ribbons - 1) - .5) * 2;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = i / steps * TAU;
          const body = .72 + .24 * Math.cos(u * 3 - t * 2.2);
          const fold = .22 * Math.sin(u * 5 + v * 3 - t * 4);
          const x = (body + v * .22 + fold) * Math.cos(u) + .18 * Math.sin(u * 2 + t);
          const y = (body * .9 + v * .15) * Math.sin(u) + .26 * Math.sin(u * 3 - t * 1.8);
          const twist = Math.sin(u * 4 + v * 4 - t * 3);
          const px = cx + (x + v * .2 * twist) * scale;
          const py = cy + (y + v * .17 * Math.cos(u * 3 - t)) * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const shimmer = .5 + .5 * Math.sin(r * .41 - t * 7);
        ctx.strokeStyle = `rgba(${154 + shimmer * 70},${207 + shimmer * 31},${229 - shimmer * 10},${.12 + shimmer * .25})`;
        ctx.lineWidth = Math.max(.65, this.dpr * (.48 + shimmer * .3));
        ctx.stroke();
      }

      for (let i = 0; i < 480; i++) {
        const u = i / 480 * TAU;
        const radius = .76 + .27 * Math.cos(u * 3 - t * 2.2);
        const px = cx + (radius * Math.cos(u) + .18 * Math.sin(u * 2 + t)) * scale;
        const py = cy + (radius * .9 * Math.sin(u) + .26 * Math.sin(u * 3 - t * 1.8)) * scale;
        const pulse = .5 + .5 * Math.sin(i * .19 + t * 11);
        ctx.fillStyle = `rgba(218,239,245,${.2 + pulse * .48})`;
        const size = (.55 + pulse * .8) * this.dpr;
        ctx.fillRect(px, py, size, size);
      }
      this.finish();
    }

    drawWreath(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const scale = Math.min(w, h) * .31;
      this.prepare(cx, cy, Math.min(w, h) * .48);

      const petals = 7;
      const threads = this.mobile ? 24 : 38;
      for (let p = 0; p < petals; p++) {
        const base = p / petals * TAU + t * .12;
        for (let thread = 0; thread < threads; thread++) {
          const offset = (thread / (threads - 1) - .5) * .28;
          ctx.beginPath();
          const steps = 72;
          for (let i = 0; i <= steps; i++) {
            const u = i / steps;
            const angle = base + u * .86 + offset * Math.sin(u * Math.PI);
            const leaf = Math.sin(u * Math.PI);
            const radius = .55 + u * .72 + leaf * (.14 + .09 * Math.sin(p * 2.1 - t * 3));
            const side = offset * leaf * 1.8;
            const px = cx + (Math.cos(angle) * radius - Math.sin(angle) * side) * scale;
            const py = cy + (Math.sin(angle) * radius + Math.cos(angle) * side) * scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          const alpha = .1 + .24 * Math.sin(thread * .29 + p + t * 5) ** 2;
          ctx.strokeStyle = `rgba(185,224,237,${alpha})`;
          ctx.lineWidth = Math.max(.6, this.dpr * .48);
          ctx.stroke();
        }
      }
      this.finish();
    }

    drawDialogue(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const scale = Math.min(w, h) * .34;
      this.prepare(cx, cy, Math.min(w, h) * .5);

      const sides = [-1, 1];
      sides.forEach((side, index) => {
        const threads = this.mobile ? 38 : 64;
        for (let r = 0; r < threads; r++) {
          const v = (r / (threads - 1) - .5) * 2;
          ctx.beginPath();
          const steps = 108;
          for (let i = 0; i <= steps; i++) {
            const u = i / steps * Math.PI * 1.55 - Math.PI * .78;
            const lobe = .62 + .2 * Math.cos(u * 3 - t * 2 + index);
            const x = side * (.42 + Math.abs(Math.cos(u)) * .36 + v * .16 * Math.sin(u * 2));
            const y = Math.sin(u) * lobe + v * .13 * Math.cos(u * 3 - t * 2.4);
            const px = cx + x * scale;
            const py = cy + y * scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          const signal = .5 + .5 * Math.sin(r * .25 - t * 6 + index * 2);
          ctx.strokeStyle = `rgba(${166 + signal * 60},${207 + signal * 35},${225 + signal * 20},${.1 + signal * .27})`;
          ctx.lineWidth = Math.max(.62, this.dpr * .5);
          ctx.stroke();
        }
      });

      for (let i = 0; i < 120; i++) {
        const progress = (i / 120 + t * .16) % 1;
        const x = cx + (progress - .5) * scale * .72;
        const y = cy + Math.sin(progress * TAU * 2 - t * 4) * scale * .035;
        ctx.fillStyle = `rgba(223,240,246,${Math.sin(progress * Math.PI) * .48})`;
        const size = (1 + Math.sin(progress * Math.PI) * 1.1) * this.dpr;
        ctx.fillRect(x, y, size, size);
      }
      this.finish();
    }

    drawConvergence(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .56, cy = h * .5;
      const radius = Math.min(w, h) * .31;
      this.prepare(cx, cy, Math.min(w, h) * .55);

      const cycle = 2.65;
      const local = (t % cycle) / cycle;
      const settle = Math.max(0, Math.min(1, (local - .06) / .7));
      const eased = 1 - Math.pow(1 - settle, 3);
      const fade = local > .9 ? Math.max(0, (1 - local) / .1) : 1;
      const generation = Math.floor(t / cycle);
      const count = this.mobile ? 1050 : 1900;
      const hash = n => {
        const x = Math.sin(n * 91.345 + generation * 17.17) * 47453.5453;
        return x - Math.floor(x);
      };

      ctx.globalAlpha = fade;
      ctx.strokeStyle = 'rgba(112,176,211,.13)';
      ctx.lineWidth = this.dpr * .55;
      for (let ring = 0; ring < 5; ring++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * (1.03 + ring * .035), radius * (.34 + ring * .075), t * .45 + ring * .31, 0, TAU);
        ctx.stroke();
      }

      for (let i = 0; i < count; i++) {
        const a = hash(i * 3 + 1);
        const b = hash(i * 3 + 2);
        const c = hash(i * 3 + 3);
        const phi = TAU * a;
        const z = 2 * b - 1;
        const shell = Math.sqrt(Math.max(0, 1 - z * z));
        const depth = .82 + .2 * c;
        const sx = shell * Math.cos(phi) * depth;
        const sy = z * depth;
        const sz = shell * Math.sin(phi) * depth;
        const rotation = t * .42;
        const rx = sx * Math.cos(rotation) - sz * Math.sin(rotation);
        const rz = sx * Math.sin(rotation) + sz * Math.cos(rotation);
        const targetX = cx + rx * radius * (1 + .09 * Math.sin(phi * 5 + t));
        const targetY = cy + sy * radius * .95 + rz * radius * .12;

        const sourceX = w * (.08 + .84 * hash(i * 7 + 11));
        const sourceY = -h * (.08 + .7 * hash(i * 7 + 17)) + h * local * (1.15 + .65 * c);
        const drift = Math.sin(i * .73 + t * 4) * radius * .045 * (1 - eased);
        const px = sourceX + (targetX - sourceX) * eased + drift;
        const py = sourceY + (targetY - sourceY) * eased;
        const probability = .22 + .72 * (rz * .5 + .5);
        const bright = hash(i * 5 + 29) > .965;
        ctx.fillStyle = bright ? `rgba(236,241,210,${.55 * fade})` : `rgba(${120 + probability * 95},${181 + probability * 47},${210 + probability * 25},${(.16 + probability * .48) * fade})`;
        const size = (bright ? 1.7 : .58 + probability * .72) * this.dpr;
        ctx.fillRect(px, py, size, size);

        if (i % 97 === 0 && eased > .55) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.quadraticCurveTo(cx + Math.sin(phi * 3) * radius * .45, cy + Math.cos(phi * 2) * radius * .35, targetX, targetY);
          ctx.strokeStyle = `rgba(177,211,224,${.08 * eased * fade})`;
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(147,183,208,.78)';
      ctx.font = `${Math.max(8, 9 * this.dpr)}px Inter, Arial, sans-serif`;
      ctx.letterSpacing = `${1.6 * this.dpr}px`;
      ctx.fillText(`SAMPLES  ${String(Math.round(count * eased)).padStart(4, '0')}`, w * .06, h * .1);
      ctx.fillText(`CONVERGENCE  ${(eased * 100).toFixed(1)}%`, w * .06, h * .9);
      this.finish();
    }

    drawChamber(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const scale = Math.min(w, h) * .38;
      this.prepare(cx, cy, Math.min(w, h) * .49);

      const sections = this.mobile ? 64 : 104;
      const rings = this.mobile ? 34 : 52;
      for (let ring = 0; ring < rings; ring++) {
        const v = ring / (rings - 1) * 2 - 1;
        const waist = .18 + .58 * Math.abs(v) ** .62;
        const crown = .11 * Math.cos(v * Math.PI * 3 - t * 2);
        ctx.beginPath();
        for (let i = 0; i <= sections; i++) {
          const u = i / sections * TAU;
          const radius = waist + crown * Math.sin(u * 4 + t * 2.2);
          const depth = .64 + .36 * Math.sin(u);
          const px = cx + Math.cos(u) * radius * scale;
          const py = cy + (v * .92 + Math.sin(u) * radius * .22) * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          if (i % 3 === 0) {
            const alpha = .08 + depth * .18;
            ctx.fillStyle = `rgba(194,226,238,${alpha})`;
            ctx.fillRect(px, py, this.dpr * .7, this.dpr * .7);
          }
        }
        const bright = .5 + .5 * Math.sin(ring * .32 - t * 5);
        ctx.strokeStyle = `rgba(179,219,234,${.09 + bright * .24})`;
        ctx.lineWidth = Math.max(.58, this.dpr * .47);
        ctx.stroke();
      }
      this.finish();
    }

    drawMigration(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const fit = Math.min(w, h) / 400;
      this.prepare(cx, cy, Math.min(w, h) * .54);

      const count = this.mobile ? 8200 : 13800;
      const pointSize = Math.max(.58, this.dpr * .42);
      for (let i = count; i > 0; i--) {
        const y = i / 940;
        const k = (4 + Math.cos(y)) * Math.cos(i);
        const e = y / 6 - 13;
        const d = Math.hypot(k, e) - 3;
        const q = 3 * Math.sin(k * 2) + k / 16 * y *
          (e + 2 * Math.sin(e - d * 5 + t * 4.2)) + 99;
        const c = d / 1.2 - t + (i % 2) * 3;
        const px = q * Math.sin(c) * Math.sin(c / 4 + e / 6 - 8) * fit;
        const py = (q * d / 9 * Math.cos(c) + d * 22 - 200) * fit;
        const angle = -.16;
        const x = cx + px * Math.cos(angle) - py * Math.sin(angle);
        const yy = cy + px * Math.sin(angle) + py * Math.cos(angle);
        const shimmer = .35 + .65 * Math.sin(i * .071 + t * 9) ** 2;
        ctx.fillStyle = `rgba(${188 + shimmer * 42},${218 + shimmer * 25},${230 + shimmer * 18},${.14 + shimmer * .5})`;
        ctx.fillRect(x, yy, pointSize * (1 + shimmer * .45), pointSize * (1 + shimmer * .45));
      }
      this.finish();
    }

    drawMedusa(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .43;
      const scale = Math.min(w, h) * .36;
      const pulse = .5 + .5 * Math.sin(t * 5);
      this.prepare(cx, cy, Math.min(w, h) * .54);

      const bellLayers = this.mobile ? 22 : 34;
      for (let layer = 0; layer < bellLayers; layer++) {
        const v = layer / (bellLayers - 1);
        const rx = scale * (.62 - v * .31) * (1 + pulse * .07);
        const ry = scale * (.54 - v * .25) * (1 - pulse * .08);
        const yOffset = v * scale * .12;
        ctx.beginPath();
        const steps = 80;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps * Math.PI;
          const ripple = Math.sin(u * 9 - t * 6 + layer * .23) * scale * .012 * (1 - v);
          const px = cx + Math.cos(u) * (rx + ripple);
          const py = cy + yOffset - Math.sin(u) * ry + Math.cos(u * 5 - t * 3) * scale * .012;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const light = .5 + .5 * Math.sin(layer * .42 - t * 7);
        ctx.strokeStyle = `rgba(${170 + light * 60},${211 + light * 31},${228 + light * 19},${.08 + light * .26})`;
        ctx.lineWidth = Math.max(.58, this.dpr * .46);
        ctx.stroke();
      }

      const tentacles = this.mobile ? 11 : 15;
      for (let strand = 0; strand < tentacles; strand++) {
        const n = strand / (tentacles - 1) * 2 - 1;
        ctx.beginPath();
        const steps = 74;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const narrowing = 1 - u * .42;
          const wave = Math.sin(u * 15 + n * 4 - t * 7) * scale * (.025 + u * .07);
          const curl = Math.sin(u * Math.PI) * n * scale * .14;
          const px = cx + n * scale * .42 * narrowing + wave + curl;
          const py = cy + scale * (.04 + u * 1.32) + Math.sin(u * 8 - t * 4) * scale * .018;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const light = .5 + .5 * Math.sin(strand * .67 + t * 6);
        ctx.strokeStyle = `rgba(185,222,235,${.1 + light * .3})`;
        ctx.lineWidth = Math.max(.62, this.dpr * (.45 + light * .12));
        ctx.stroke();
      }

      for (let side of [-1, 1]) {
        for (let arm = 0; arm < 7; arm++) {
          const a = arm / 6;
          ctx.beginPath();
          ctx.moveTo(cx + side * scale * .1, cy + scale * (.08 + a * .25));
          ctx.bezierCurveTo(
            cx + side * scale * (.35 + a * .08), cy + scale * (.15 + a * .14),
            cx + side * scale * (.72 + pulse * .06), cy + scale * (.28 + a * .21),
            cx + side * scale * (.58 + a * .2), cy + scale * (.55 + a * .17)
          );
          ctx.strokeStyle = `rgba(173,216,233,${.08 + (1 - a) * .2})`;
          ctx.stroke();
        }
      }
      this.finish();
    }

    drawInfinite(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const scale = Math.min(w, h) * .36;
      this.prepare(cx, cy, Math.min(w, h) * .54);

      const strands = this.mobile ? 28 : 44;
      for (let body = 0; body < 2; body++) {
        const phase = body * Math.PI;
        for (let strand = 0; strand < strands; strand++) {
          const offset = (strand / (strands - 1) - .5) * .42;
          ctx.beginPath();
          const steps = 128;
          for (let i = 0; i <= steps; i++) {
            const u = i / steps * TAU;
            const a = u + phase + t * .42;
            const baseX = Math.sin(a);
            const baseY = Math.sin(a * 2) * .78;
            const dx = Math.cos(a);
            const dy = 1.56 * Math.cos(a * 2);
            const length = Math.max(.001, Math.hypot(dx, dy));
            const nx = -dy / length;
            const ny = dx / length;
            const breathing = 1 + .12 * Math.sin(a * 3 - t * 4 + body);
            const weave = offset * breathing + .045 * Math.sin(a * 7 + strand * .19 - t * 5);
            const px = cx + (baseX * .93 + nx * weave) * scale;
            const py = cy + (baseY + ny * weave) * scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          const depth = .5 + .5 * Math.sin(strand * .23 + phase - t * 5);
          ctx.strokeStyle = `rgba(${163 + depth * 68},${207 + depth * 34},${225 + depth * 23},${.07 + depth * .28})`;
          ctx.lineWidth = Math.max(.58, this.dpr * (.43 + depth * .14));
          ctx.stroke();
        }
      }

      for (let i = 0; i < (this.mobile ? 220 : 360); i++) {
        const u = i / (this.mobile ? 220 : 360) * TAU + t * .42;
        const px = cx + Math.sin(u) * scale * .93;
        const py = cy + Math.sin(u * 2) * scale * .78;
        const front = .5 + .5 * Math.cos(u - t * 2);
        ctx.fillStyle = `rgba(225,239,241,${.12 + front * .52})`;
        const d = (.5 + front * .9) * this.dpr;
        ctx.fillRect(px, py, d, d);
      }
      this.finish();
    }
  }

  document.querySelectorAll('[data-form-study]').forEach(canvas => new FormStudy(canvas));
})();
