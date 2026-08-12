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
      this.transportParticles = null;
      this.transportFrame = 0;
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
      if (this.kind === 'transport') this.transportParticles = null;
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
        else if (this.kind === 'transport') this.drawTransport(t);
        else if (this.kind === 'torus-knot') this.drawTorusKnot(t);
        else if (this.kind === 'golden-bloom') this.drawGoldenBloom(t);
        else if (this.kind === 'molten-sphere') this.drawMoltenSphere(t);
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
      const fit = Math.min(w, h) / 400 * .92;
      const phase = t * 8.7;
      this.prepare(cx, cy, Math.min(w, h) * .54);

      const stride = this.mobile ? 2 : 1;
      const pointSize = Math.max(.56, this.dpr * .4);
      for (let i = 20000; i > 0; i -= stride) {
        const y = i / 470;
        const k = (1.5 + Math.atan(Math.cos(y % 12) * 8)) * Math.cos(i / 3);
        const e = y / 8 - 13;
        const d = Math.hypot(k, e);
        const q = 10 * Math.cos(d - phase) + y / 8 * k *
          (2 + Math.sin(d * 3 + y - phase * 2)) + 99;
        const c = d / 4 - phase / 8 + i % 6;
        const px = q * Math.cos(c) * fit;
        const py = q * Math.sin(c + i % 3 * 7 + 2.3) * fit;
        const shimmer = .35 + .65 * Math.sin(i * .053 + phase * 1.8) ** 2;
        ctx.fillStyle = `rgba(${184 + shimmer * 47},${216 + shimmer * 26},${230 + shimmer * 18},${.12 + shimmer * .5})`;
        const size = pointSize * (1 + shimmer * .5);
        ctx.fillRect(cx + px, cy + py, size, size);
      }
      this.finish();
    }

    drawConvergence(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .56, cy = h * .52;
      const radius = Math.min(w, h) * (this.mobile ? .3 : .32);
      this.prepare(cx, cy, radius * 1.72);

      const cycle = 3.05;
      const local = (t % cycle) / cycle;
      const settle = Math.max(0, Math.min(1, (local - .09) / .68));
      const eased = settle * settle * (3 - 2 * settle);
      const fade = local > .92 ? Math.max(0, (1 - local) / .08) : 1;
      const generation = Math.floor(t / cycle);
      const count = this.mobile ? 1250 : 2250;
      const hash = n => {
        const x = Math.sin(n * 91.345 + generation * 17.17) * 47453.5453;
        return x - Math.floor(x);
      };

      ctx.globalAlpha = fade;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * .97, 0, TAU);
      ctx.clip();

      const envelopeAlpha = (.035 + eased * .105) * fade;
      ctx.lineWidth = Math.max(.55, this.dpr * .48);
      for (let ring = 0; ring < 6; ring++) {
        const orbitX = radius * (.66 + ring * .045);
        const orbitY = radius * (.18 + ring * .055);
        ctx.beginPath();
        ctx.ellipse(cx, cy, orbitX, orbitY, t * .27 + ring * .47, 0, TAU);
        ctx.strokeStyle = `rgba(116,180,212,${envelopeAlpha * (1 - ring * .06)})`;
        ctx.stroke();
      }
      ctx.restore();

      for (let i = 0; i < count; i++) {
        const a = hash(i * 3 + 1);
        const b = hash(i * 3 + 2);
        const c = hash(i * 3 + 3);
        const phi = TAU * a;
        const z = 2 * b - 1;
        const shell = Math.sqrt(Math.max(0, 1 - z * z));
        const interior = c < .19 ? Math.cbrt(Math.max(.01, hash(i * 11 + 41))) : .84 + .14 * c;
        const depth = interior;
        const sx = shell * Math.cos(phi) * depth;
        const sy = z * depth;
        const sz = shell * Math.sin(phi) * depth;
        const rotation = t * .31;
        const rx = sx * Math.cos(rotation) - sz * Math.sin(rotation);
        const rz = sx * Math.sin(rotation) + sz * Math.cos(rotation);
        const perspective = .9 + .1 * (rz * .5 + .5);
        const surfaceRipple = 1 + .025 * Math.sin(phi * 7 + z * 5 - t * 2.2);
        const targetX = cx + rx * radius * .92 * perspective * surfaceRipple;
        const targetY = cy + (sy * .9 + rz * .075) * radius * perspective * surfaceRipple;

        const sourceX = w * (.1 + .8 * hash(i * 7 + 11));
        const fallSpeed = .82 + .72 * c;
        const sourceY = -h * (.18 + .66 * hash(i * 7 + 17)) + h * local * fallSpeed;
        const curve = Math.sin(Math.PI * eased);
        const bend = (hash(i * 13 + 31) - .5) * radius * .7 * curve;
        const drift = Math.sin(i * .73 + t * 3.1) * radius * .032 * (1 - eased);
        const px = sourceX + (targetX - sourceX) * eased + bend + drift;
        const py = sourceY + (targetY - sourceY) * eased - curve * radius * (.08 + .12 * c);
        const front = rz * .5 + .5;
        const bright = hash(i * 5 + 29) > .972;
        const alpha = (.14 + front * .48 + eased * .08) * fade;
        ctx.fillStyle = bright
          ? `rgba(239,243,213,${(.48 + front * .3) * fade})`
          : `rgba(${119 + front * 92},${176 + front * 55},${204 + front * 31},${alpha})`;
        const size = (bright ? 1.55 : .52 + front * .78) * this.dpr;
        ctx.fillRect(px, py, size, size);

        if (i % 137 === 0 && eased > .42) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.quadraticCurveTo(
            cx + Math.sin(phi * 2.7) * radius * .37,
            cy + Math.cos(phi * 2.1) * radius * .29,
            targetX,
            targetY
          );
          ctx.strokeStyle = `rgba(177,211,224,${.055 * eased * fade})`;
          ctx.lineWidth = Math.max(.45, this.dpr * .4);
          ctx.stroke();
        }
      }

      if (eased > .7) {
        const resolved = (eased - .7) / .3;
        const pulse = .5 + .5 * Math.sin(t * 3.4);
        ctx.beginPath();
        ctx.arc(cx, cy, radius * (.935 + pulse * .012), 0, TAU);
        ctx.strokeStyle = `rgba(156,211,229,${resolved * (.055 + pulse * .035) * fade})`;
        ctx.lineWidth = this.dpr * .7;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(147,183,208,.78)';
      ctx.font = `${Math.max(8, 9 * this.dpr)}px Inter, Arial, sans-serif`;
      ctx.letterSpacing = `${1.6 * this.dpr}px`;
      ctx.fillText(`SAMPLES  ${String(Math.round(count * eased)).padStart(4, '0')}`, w * .06, h * .1);
      ctx.fillText(`CONVERGENCE  ${(eased * 100).toFixed(1)}%`, w * .06, h * .88);
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

      // Sample each parity separately. Both studies encode their paired bodies
      // in i % 2; stepping through one parity on mobile hid the second body.
      const stride = this.mobile ? 4 : 2;
      const phase = t * 12;
      const pointSize = Math.max(.58, this.dpr * .42);
      for (let branch = 0; branch < 2; branch++) {
        for (let i = 20000 - branch; i > 0; i -= stride) {
          const y = i / 940;
          const k = (4 + Math.cos(y)) * Math.cos(i);
          const e = y / 6 - 13;
          const d = Math.hypot(k, e) - 3;
          const q = 3 * Math.sin(k * 2) + k / 16 * y *
            (e + 2 * Math.sin(e - d * 5 + phase)) + 99;
          const c = d / 1.2 - phase / 4 + branch * 3;
          const px = q * Math.sin(c) * Math.sin(c / 4 + e / 6 - 8) * fit;
          const py = (q * d / 9 * Math.cos(c) + d * 22 - 200) * fit;
          const angle = -.16;
          const x = cx + px * Math.cos(angle) - py * Math.sin(angle);
          const yy = cy + px * Math.sin(angle) + py * Math.cos(angle);
          const shimmer = .35 + .65 * Math.sin(i * .071 + t * 9) ** 2;
          ctx.fillStyle = `rgba(${188 + shimmer * 42},${218 + shimmer * 25},${230 + shimmer * 18},${.14 + shimmer * .5})`;
          ctx.fillRect(x, yy, pointSize * (1 + shimmer * .45), pointSize * (1 + shimmer * .45));
        }
      }
      this.finish();
    }

    drawMedusa(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const fit = Math.min(w, h) / 400 * .92;
      const phase = t * 10;
      this.prepare(cx, cy, Math.min(w, h) * .54);

      const stride = this.mobile ? 4 : 2;
      const pointSize = Math.max(.56, this.dpr * .4);
      for (let branch = 0; branch < 2; branch++) {
        const m = branch * 3;
        for (let i = 20000 - branch; i > 0; i -= stride) {
          const k = 9 * Math.cos(i / 61);
          const e = i / 652 - 13;
          const d = Math.hypot(k, e) ** 2 / 89 + 1;
          const q = 79 - e / 2 * Math.sin(k) + k / d *
            (6 + 5 * Math.sin(Math.sin(d * d + e / 9 - phase + m)));
          const c = d / 1.9 + Math.cos(phase - d * 3 + m) / 11 - phase / 16 + m;
          const px = q * Math.sin(c) * fit;
          const py = (q + 40) * Math.cos(c) * fit;
          const shimmer = .35 + .65 * Math.sin(i * .061 + phase * 2) ** 2;
          ctx.fillStyle = `rgba(${187 + shimmer * 45},${218 + shimmer * 25},${230 + shimmer * 18},${.13 + shimmer * .52})`;
          const size = pointSize * (1 + shimmer * .48);
          ctx.fillRect(cx + px, cy + py, size, size);
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

    hash(n) {
      const value = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
      return value - Math.floor(value);
    }

    resetTransportParticle(particle, index, initial = false) {
      const seed = index + particle.generation * 1973;
      particle.x = this.hash(seed * 3 + 1) * 2.2 - 1.1;
      particle.y = this.hash(seed * 3 + 2) * 1.9 - .95;
      particle.px = particle.x;
      particle.py = particle.y;
      particle.life = 170 + Math.floor(this.hash(seed * 7 + 11) * 230);
      particle.age = initial ? Math.floor(this.hash(seed * 5 + 7) * particle.life) : 0;
      particle.phase = this.hash(seed * 11 + 13) * TAU;
      particle.bright = this.hash(seed * 13 + 17) > .962;
    }

    transportVelocity(x, y, t) {
      const a = 2.2 * x + t * 1.15;
      const b = 1.7 * y - t * .72;
      const c = 3.1 * x - 2.6 * y + t * .46;
      return {
        x: .935 * Math.sin(a) * Math.cos(b) - .572 * Math.cos(c),
        y: -1.21 * Math.cos(a) * Math.sin(b) - .682 * Math.cos(c)
      };
    }

    drawTransport(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const count = this.mobile ? 920 : 1780;
      if (!this.transportParticles || this.transportParticles.length !== count) {
        this.transportParticles = Array.from({ length: count }, (_, index) => {
          const particle = { generation: 0 };
          this.resetTransportParticle(particle, index, true);
          return particle;
        });
      }

      this.transportFrame += 1;
      this.prepare(cx, cy, Math.min(w, h) * .58);
      const fieldScaleX = w * .43;
      const fieldScaleY = h * .43;
      const dt = reducedMotion ? 0 : .011;

      ctx.save();
      ctx.beginPath();
      ctx.rect(w * .045, h * .055, w * .91, h * .89);
      ctx.clip();

      for (let i = 0; i < count; i++) {
        const particle = this.transportParticles[i];
        particle.px = particle.x;
        particle.py = particle.y;
        const velocity = this.transportVelocity(particle.x, particle.y, t);
        const thermal = reducedMotion ? 0 : .0028;
        const noiseX = Math.sin(particle.phase + this.transportFrame * .71 + i * .013);
        const noiseY = Math.cos(particle.phase * 1.7 + this.transportFrame * .59 + i * .017);
        particle.x += velocity.x * dt + noiseX * thermal;
        particle.y += velocity.y * dt + noiseY * thermal;
        if (!reducedMotion) particle.age += 1;

        if (
          particle.age > particle.life ||
          particle.x < -1.18 || particle.x > 1.18 ||
          particle.y < -1.06 || particle.y > 1.06
        ) {
          particle.generation += 1;
          this.resetTransportParticle(particle, i);
        }

        const x0 = cx + particle.px * fieldScaleX;
        const y0 = cy + particle.py * fieldScaleY;
        const x1 = cx + particle.x * fieldScaleX;
        const y1 = cy + particle.y * fieldScaleY;
        const speed = Math.min(1, Math.hypot(velocity.x, velocity.y) / 1.7);
        const maturity = Math.min(1, particle.age / 28);
        const remaining = Math.min(1, (particle.life - particle.age) / 32);
        const alpha = maturity * remaining * (.12 + speed * .38);

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = particle.bright
          ? `rgba(230,242,225,${Math.min(.82, alpha * 1.8)})`
          : `rgba(${128 + speed * 72},${184 + speed * 45},${211 + speed * 28},${alpha})`;
        ctx.lineWidth = (particle.bright ? 1.15 : .48 + speed * .42) * this.dpr;
        ctx.stroke();

        if (particle.bright) {
          ctx.fillStyle = `rgba(235,246,231,${Math.min(.9, alpha * 2.1)})`;
          const size = (1.1 + speed * .9) * this.dpr;
          ctx.fillRect(x1 - size * .5, y1 - size * .5, size, size);
        }
      }

      ctx.globalAlpha = .16;
      ctx.lineWidth = Math.max(.5, this.dpr * .42);
      for (let row = 0; row < 8; row++) {
        ctx.beginPath();
        for (let column = 0; column <= 54; column++) {
          const x = -1.05 + column / 54 * 2.1;
          const y = -.78 + row / 7 * 1.56;
          const velocity = this.transportVelocity(x, y, t);
          const px = cx + x * fieldScaleX;
          const py = cy + y * fieldScaleY;
          if (column === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px + velocity.x * 5 * this.dpr, py + velocity.y * 5 * this.dpr);
        }
        ctx.strokeStyle = 'rgba(107,166,196,.18)';
        ctx.stroke();
      }
      ctx.restore();
      this.finish();
    }

    drawTorusKnot(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const scale = Math.min(w, h) * .195;
      const p = 3;
      const q = 8;
      const majorRadius = 1.7;
      const minorRadius = .74;
      const yaw = .52 + t * .42;
      const pitch = -.62 + Math.sin(t * .73) * .09;
      const roll = -.18 + Math.sin(t * .41) * .12;
      const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
      const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
      const cosRoll = Math.cos(roll), sinRoll = Math.sin(roll);
      const steps = this.mobile ? 420 : 680;
      const ribbons = this.mobile ? 8 : 13;
      this.prepare(cx, cy, Math.min(w, h) * .58);

      const rotate = (x, y, z) => {
        const x1 = x * cosYaw - z * sinYaw;
        const z1 = x * sinYaw + z * cosYaw;
        const y2 = y * cosPitch - z1 * sinPitch;
        const z2 = y * sinPitch + z1 * cosPitch;
        return {
          x: x1 * cosRoll - y2 * sinRoll,
          y: x1 * sinRoll + y2 * cosRoll,
          z: z2
        };
      };

      const points = [];
      for (let strip = 0; strip < ribbons; strip++) {
        const ribbonOffset = (strip / (ribbons - 1) - .5) * .36;
        for (let i = 0; i < steps; i++) {
          const phase = i / steps * TAU;
          const cp = Math.cos(p * phase);
          const sp = Math.sin(p * phase);
          const cq = Math.cos(q * phase);
          const sq = Math.sin(q * phase);
          const radius = majorRadius + minorRadius * cq;
          const centerX = radius * cp;
          const centerY = radius * sp;
          const centerZ = minorRadius * sq;
          const normalX = cq * cp;
          const normalY = cq * sp;
          const normalZ = sq;
          const binormalX = -sp;
          const binormalY = cp;
          const binormalZ = 0;
          const twist = phase * 5 + t * .8;
          const nx = normalX * Math.cos(twist) + binormalX * Math.sin(twist);
          const ny = normalY * Math.cos(twist) + binormalY * Math.sin(twist);
          const nz = normalZ * Math.cos(twist) + binormalZ * Math.sin(twist);
          const corrugation = 1 + .13 * Math.sin(phase * 24 - t * 3.2 + strip * .4);
          const rotated = rotate(
            centerX + nx * ribbonOffset * corrugation,
            centerY + ny * ribbonOffset * corrugation,
            centerZ + nz * ribbonOffset * corrugation
          );
          const perspective = 1 / (1.13 - rotated.z * .105);
          points.push({
            x: cx + rotated.x * scale * perspective,
            y: cy + rotated.y * scale * perspective,
            z: rotated.z,
            phase,
            strip
          });
        }
      }

      points.sort((a, b) => a.z - b.z);
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const depth = Math.max(0, Math.min(1, .5 + point.z / 5));
        const pulse = .5 + .5 * Math.sin(point.phase * 18 - t * 4 + point.strip * .42);
        const highlight = Math.sin(point.phase * 3 - t * 1.7) > .82;
        const red = highlight ? 212 + pulse * 31 : 132 + depth * 72;
        const green = highlight ? 226 + pulse * 22 : 186 + depth * 43;
        const blue = highlight ? 184 + pulse * 42 : 181 + depth * 51;
        const alpha = .14 + depth * .42 + (highlight ? .2 : 0);
        const size = (.46 + depth * .68 + pulse * .18) * this.dpr;
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        ctx.fillRect(point.x, point.y, size, size);
      }

      ctx.globalAlpha = .24;
      ctx.lineWidth = Math.max(.5, this.dpr * .45);
      for (let strip = 0; strip < ribbons; strip += 3) {
        ctx.beginPath();
        const stripPoints = points
          .filter(point => point.strip === strip)
          .sort((a, b) => a.phase - b.phase);
        stripPoints.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.strokeStyle = 'rgba(187,222,218,.24)';
        ctx.stroke();
      }
      this.finish();
    }

    drawGoldenBloom(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .55;
      const scale = Math.min(w, h) * .37;
      const petals = this.mobile ? 94 : 148;
      const strands = this.mobile ? 3 : 5;
      this.prepare(cx, cy, scale * 1.45);

      const halo = ctx.createRadialGradient(cx, cy, scale * .06, cx, cy, scale * 1.08);
      halo.addColorStop(0, 'rgba(255,187,54,.2)');
      halo.addColorStop(.46, 'rgba(205,112,20,.07)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      for (let p = 0; p < petals; p++) {
        const u = p / petals;
        const angle = p * 2.399963 + t * .24;
        const band = .18 + .82 * Math.sqrt(u);
        const lift = Math.sin(u * Math.PI) ** .7;
        const curl = .4 + .5 * Math.sin(p * 1.71 + t * 2.2);
        for (let strand = 0; strand < strands; strand++) {
          const offset = (strand / Math.max(1, strands - 1) - .5) * .055;
          ctx.beginPath();
          for (let i = 0; i <= 34; i++) {
            const s = i / 34;
            const open = Math.sin(s * Math.PI);
            const radial = (.1 + band * (.28 + s * .72)) * (1 + .075 * Math.sin(t * 2.6 + p * .23));
            const sweep = angle + (.48 + curl * .34) * s + offset * open * 5;
            const x = Math.cos(sweep) * radial;
            const y = Math.sin(sweep) * radial * .7 - lift * open * (.56 + .2 * u) + .13 * s;
            const px = cx + x * scale;
            const py = cy + y * scale;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          const shimmer = .5 + .5 * Math.sin(p * .43 + strand * 1.9 - t * 5.4);
          ctx.strokeStyle = `rgba(${202 + shimmer * 53},${104 + shimmer * 123},${18 + shimmer * 68},${.08 + shimmer * .34})`;
          ctx.lineWidth = Math.max(.52, this.dpr * (.38 + shimmer * .32));
          ctx.shadowColor = 'rgba(255,157,31,.28)';
          ctx.shadowBlur = shimmer * 5 * this.dpr;
          ctx.stroke();
        }
      }
      this.finish();
    }

    drawMoltenSphere(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5, cy = h * .5;
      const radius = Math.min(w, h) * .31;
      const count = this.mobile ? 4100 : 7200;
      this.prepare(cx, cy, radius * 1.7);

      const aura = ctx.createRadialGradient(cx, cy, radius * .42, cx, cy, radius * 1.55);
      aura.addColorStop(0, 'rgba(255,117,23,.2)');
      aura.addColorStop(.55, 'rgba(164,54,8,.055)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);

      const rotation = t * .58;
      for (let i = 0; i < count; i++) {
        const z = 1 - 2 * (i + .5) / count;
        const ring = Math.sqrt(Math.max(0, 1 - z * z));
        const phi = i * 2.399963 + rotation;
        const sx = Math.cos(phi) * ring;
        const sy = z;
        const sz = Math.sin(phi) * ring;
        if (sz < -.12) continue;
        const noise = Math.sin(sx * 19 + t * 2.7) * Math.sin(sy * 23 - t * 2.1) +
          .55 * Math.sin((sx + sy) * 43 + sz * 17 - t * 3.3);
        const fissure = Math.max(0, Math.abs(noise) - .67) / .88;
        const light = Math.max(0, .3 + sx * -.38 + sy * -.45 + sz * .76);
        const rim = Math.max(0, 1 - sz) ** 2;
        const heat = Math.min(1, light * .72 + fissure * 1.35 + .12 * Math.sin(i * .071 + t * 4));
        const perspective = .94 + sz * .07;
        const px = cx + sx * radius * perspective;
        const py = cy + sy * radius * perspective;
        const red = 90 + heat * 165;
        const green = 26 + heat * 112;
        const blue = 7 + heat * 26;
        const alpha = Math.max(.05, .22 + light * .56 - rim * .16);
        const size = (.48 + light * .82 + fissure * .9) * this.dpr;
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        ctx.fillRect(px, py, size, size);
      }

      const edge = ctx.createRadialGradient(cx - radius * .16, cy - radius * .2, radius * .1, cx, cy, radius * 1.03);
      edge.addColorStop(0, 'rgba(255,178,74,.055)');
      edge.addColorStop(.8, 'rgba(160,55,10,.035)');
      edge.addColorStop(1, 'rgba(0,0,0,.54)');
      ctx.fillStyle = edge;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.015, 0, TAU);
      ctx.fill();
      this.finish();
    }
  }

  document.querySelectorAll('[data-form-study]').forEach(canvas => new FormStudy(canvas));
})();
