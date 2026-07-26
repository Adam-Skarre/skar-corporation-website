(() => {
  const TAU = Math.PI * 2;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  class MathArt {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.kind = canvas.dataset.mathArt;
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
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.width = width;
      this.height = height;
      this.dpr = dpr;
    }

    frame(now) {
      const slide = this.canvas.closest('.story-slide');
      const active = !slide || slide.classList.contains('active');
      if (this.visible && active && (now - this.last > (reducedMotion ? 1000 : 30))) {
        this.last = now;
        const t = reducedMotion ? 1.25 : (now - this.start) * 0.00022;
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.kind === 'torus') this.drawTorus(t);
        else if (this.kind === 'sphere') this.drawSphere(t);
        else if (this.kind === 'research') this.drawResearch(t);
        else if (this.kind === 'wings') this.drawWings(t);
        else this.drawFlow(t);
      }
      requestAnimationFrame(this.frame);
    }

    rotateProject(x, y, z, ax, ay, scale, cx, cy) {
      const cY = Math.cos(ay), sY = Math.sin(ay);
      const x1 = x * cY + z * sY;
      const z1 = -x * sY + z * cY;
      const cX = Math.cos(ax), sX = Math.sin(ax);
      const y1 = y * cX - z1 * sX;
      const z2 = y * sX + z1 * cX;
      const perspective = 4.8 / (5.3 - z2);
      return [cx + x1 * scale * perspective, cy + y1 * scale * perspective, z2, perspective];
    }

    glow(cx, cy, radius) {
      const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(29, 104, 138, .11)');
      gradient.addColorStop(.48, 'rgba(11, 61, 89, .055)');
      gradient.addColorStop(1, 'rgba(2, 13, 24, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTorus(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .52, cy = h * .5;
      const scale = Math.min(w, h) * .235;
      this.glow(cx, cy, Math.min(w, h) * .48);
      ctx.globalCompositeOperation = 'lighter';

      const rings = w < 520 ? 240 : 330;
      const sides = w < 520 ? 24 : 34;
      for (let i = 0; i < rings; i++) {
        const u = i / rings * TAU;
        const p = 3, q = 8;
        const cu = Math.cos(p * u), su = Math.sin(p * u);
        const cq = Math.cos(q * u), sq = Math.sin(q * u);
        const radius = 1.45 + .58 * cq;
        const bx = radius * cu;
        const by = radius * su;
        const bz = .58 * sq;

        const radialX = cu * cq;
        const radialY = su * cq;
        const radialZ = sq;
        const binormalX = -su;
        const binormalY = cu;
        const stripe = .5 + .5 * Math.sin(u * 24 - t * 10);

        for (let j = 0; j < sides; j++) {
          const v = j / sides * TAU + Math.sin(u * 8 - t * 4) * .13;
          const tube = .115 + .045 * Math.sin(u * 16 + v * 3 - t * 7);
          const cv = Math.cos(v), sv = Math.sin(v);
          const x = bx + tube * (radialX * cv + binormalX * sv);
          const y = by + tube * (radialY * cv + binormalY * sv);
          const z = bz + tube * radialZ * cv;
          const point = this.rotateProject(x, y, z, -.7 + .08 * Math.sin(t), -.75 + t * .55, scale, cx, cy);
          const depth = Math.max(0, Math.min(1, (point[2] + 2.2) / 4.4));
          const warm = .5 + .5 * Math.sin(u * 3 - t * 5 + v);
          const alpha = (.15 + depth * .54) * (.72 + stripe * .28);
          const red = Math.round(100 + warm * 105);
          const green = Math.round(188 + warm * 48);
          const blue = Math.round(210 - warm * 92);
          ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
          const size = (.55 + depth * 1.05) * this.dpr;
          ctx.fillRect(point[0], point[1], size, size);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    drawSphere(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .53, cy = h * .49;
      const scale = Math.min(w, h) * .38;
      this.glow(cx, cy, Math.min(w, h) * .5);
      ctx.globalCompositeOperation = 'lighter';

      const count = w < 520 ? 9800 : 17800;
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y0 = 1 - (i / (count - 1)) * 2;
        const latitudeRadius = Math.sqrt(Math.max(0, 1 - y0 * y0));
        const theta = golden * i;
        const longitude = Math.atan2(Math.sin(theta), Math.cos(theta));
        const latitude = Math.asin(y0);
        const slowPulse = .5 + .5 * Math.sin(latitude * 5 - t * 4);
        const harmonic =
          .052 * Math.sin(longitude * 9 + latitude * 13 - t * 9) +
          .034 * Math.sin(longitude * 17 - latitude * 7 + t * 5) +
          .022 * Math.cos(latitude * 31 + longitude * 3 + t * 3) +
          .012 * Math.sin(longitude * 29 + latitude * 43 - t * 12);
        const sonicBand = .5 + .5 * Math.sin(latitude * 52 + longitude * 5 - t * 11);
        const fineBand = .5 + .5 * Math.sin(latitude * 93 - longitude * 2 + t * 7);
        const radius = 1 + harmonic * (.52 + sonicBand * .58) + .012 * slowPulse;
        let x = Math.cos(theta) * latitudeRadius * radius;
        let y = y0 * radius;
        let z = Math.sin(theta) * latitudeRadius * radius;

        const twist = .22 * Math.sin(latitude * 6 + t * 3) +
          .035 * Math.sin(longitude * 8 - t * 5);
        const ct = Math.cos(twist), st = Math.sin(twist);
        const tx = x * ct - z * st;
        z = x * st + z * ct;
        x = tx;

        const point = this.rotateProject(x, y, z, -.22 + .08 * Math.sin(t * 2), t * .42, scale, cx, cy);
        const depth = Math.max(0, Math.min(1, (point[2] + 1.2) / 2.4));
        const rim = Math.pow(Math.max(0, 1 - Math.abs(point[2])), 3);
        const highlight = Math.pow(sonicBand, 5) * .72 + Math.pow(fineBand, 9) * .28;
        const alpha = .055 + depth * .38 + highlight * .24 + rim * .08;
        const warm = .5 + .5 * Math.sin(longitude * 2 + latitude * 5 - t * 4 + harmonic * 18);
        const red = Math.round(94 + warm * 92 + highlight * 22);
        const green = Math.round(171 + warm * 60 + highlight * 18);
        const blue = Math.round(231 - warm * 74);
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        const size = (.38 + depth * .82 + highlight * .38) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // Resonant contour lines make the surface read like a living acoustic field.
      const contours = w < 520 ? 34 : 48;
      const contourPoints = w < 520 ? 112 : 156;
      for (let ring = 1; ring < contours; ring++) {
        const latitude = -Math.PI / 2 + ring / contours * Math.PI;
        const pulse = .012 + .026 * (.5 + .5 * Math.sin(ring * .72 - t * 10));
        for (let j = 0; j < contourPoints; j++) {
          const longitude = j / contourPoints * TAU;
          const resonance =
            pulse * Math.sin(longitude * 8 + ring * .44 - t * 8) +
            .012 * Math.cos(longitude * 19 - ring * .31 + t * 5);
          const radius = 1.012 + resonance;
          const latRadius = Math.cos(latitude);
          const x = Math.cos(longitude) * latRadius * radius;
          const y = Math.sin(latitude) * radius;
          const z = Math.sin(longitude) * latRadius * radius;
          const point = this.rotateProject(x, y, z, -.22 + .08 * Math.sin(t * 2), t * .42, scale, cx, cy);
          const depth = Math.max(0, Math.min(1, (point[2] + 1.15) / 2.3));
          const crest = .5 + .5 * Math.sin(ring * .8 - t * 9);
          ctx.fillStyle = `rgba(184,226,236,${.035 + depth * (.1 + crest * .13)})`;
          const size = (.42 + depth * .68 + crest * .2) * this.dpr;
          ctx.fillRect(point[0], point[1], size, size);
        }
      }

      // Three quiet outward echoes reinforce the sonic motif without changing scale.
      ctx.lineWidth = Math.max(.6, this.dpr * .65);
      for (let echo = 0; echo < 3; echo++) {
        const phase = (t * 1.8 + echo / 3) % 1;
        const radius = scale * (1.01 + phase * .18);
        ctx.strokeStyle = `rgba(119,196,224,${(1 - phase) * .075})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * (.94 - phase * .04), 0, 0, TAU);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    drawResearch(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .53, cy = h * .49;
      const scale = Math.min(w, h) * .31;
      this.glow(cx, cy, Math.min(w, h) * .54);
      ctx.globalCompositeOperation = 'lighter';

      const crownCount = w < 520 ? 9200 : 15800;
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < crownCount; i++) {
        const radial = Math.sqrt((i + .5) / crownCount);
        const theta = i * golden;
        const scallop = .045 * Math.sin(theta * 5 - t * 7) +
          .026 * Math.sin(theta * 11 + radial * 18 + t * 5);
        const shell = 1 + scallop * (.35 + radial);
        const x = Math.cos(theta) * radial * 1.38 * shell;
        const z = Math.sin(theta) * radial * 1.08 * shell;
        const dome = Math.pow(Math.max(0, 1 - radial * radial), .55);
        const y = .5 * dome - .22 * radial * radial +
          .035 * Math.sin(theta * 7 + radial * 23 - t * 8) +
          .018 * Math.cos(theta * 19 - t * 5);

        const point = this.rotateProject(
          x, y, z,
          -.24 + .055 * Math.sin(t * 2),
          -.28 + t * .22,
          scale, cx, cy
        );
        const depth = Math.max(0, Math.min(1, (point[2] + 1.25) / 2.5));
        const ring = .5 + .5 * Math.sin(radial * 72 + theta * 3 - t * 10);
        const vein = Math.pow(.5 + .5 * Math.sin(theta * 13 + radial * 17 + t * 4), 8);
        const alpha = .07 + depth * .36 + ring * .1 + vein * .16;
        const warm = Math.pow(.5 + .5 * Math.sin(theta * 3 - radial * 13 + t * 3), 7);
        const red = Math.round(116 + warm * 108);
        const green = Math.round(185 + warm * 43);
        const blue = Math.round(231 - warm * 56);
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        const size = (.4 + depth * .86 + vein * .34) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // A folded underside gives the cloud the suspended, organic No.055 silhouette.
      const folds = w < 520 ? 4200 : 7600;
      for (let i = 0; i < folds; i++) {
        const radial = Math.sqrt((i + .5) / folds);
        const theta = i * golden * 1.07;
        const lobe = .72 + .16 * Math.sin(theta * 5 + t * 4) +
          .07 * Math.sin(theta * 10 - radial * 15);
        const x = Math.cos(theta) * radial * 1.22 * lobe;
        const z = Math.sin(theta) * radial * .96 * lobe;
        const hollow = Math.pow(1 - radial, 1.35);
        const y = -.2 - hollow * (.34 + .12 * Math.sin(theta * 5 - t * 6)) +
          .035 * Math.sin(radial * 28 + theta * 4 + t * 7);
        const point = this.rotateProject(
          x, y, z,
          -.24 + .055 * Math.sin(t * 2),
          -.28 + t * .22,
          scale, cx, cy
        );
        const depth = Math.max(0, Math.min(1, (point[2] + 1.2) / 2.4));
        const filament = Math.pow(.5 + .5 * Math.sin(theta * 10 + radial * 34 - t * 8), 6);
        ctx.fillStyle = `rgba(${142 + filament * 66},${191 + filament * 43},${220 + filament * 25},${.045 + depth * .29 + filament * .18})`;
        const size = (.38 + depth * .74 + filament * .3) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // Sparse analytical trajectories cut through the softer particle body.
      ctx.lineWidth = Math.max(.55, this.dpr * .55);
      for (let path = 0; path < 4; path++) {
        ctx.beginPath();
        const phase = path / 4 * TAU + t * (.35 + path * .035);
        for (let step = 0; step <= 120; step++) {
          const u = step / 120 * TAU;
          const radius = 1.02 + .08 * Math.sin(u * 3 + phase);
          const x = Math.cos(u) * radius * 1.25;
          const y = .02 + .32 * Math.sin(u * (1 + path % 2) + phase);
          const z = Math.sin(u) * radius * .84;
          const point = this.rotateProject(x, y, z, -.24, -.28 + t * .22, scale, cx, cy);
          if (step === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        }
        ctx.strokeStyle = `rgba(177,219,239,${.045 + path * .012})`;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    drawWings(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .53, cy = h * .5;
      const scale = Math.min(w, h) / 400;
      this.glow(cx, cy, Math.min(w, h) * .48);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(171, 220, 238, .29)';

      let x = 1, y = 1;
      const count = w < 520 ? 24000 : 40000;
      for (let i = 0; i < count; i++) {
        const a = .003, b = .06, u = -.8;
        const f = value => u * value + 2 * (1 - u) * value * value / (1 + value * value);
        const oldX = x;
        const next = y + (1 - b * y * y) * a * y + f(oldX);
        const c = t * 4.9 - Math.hypot(x, y) / 4;
        const px = y * (5 * Math.sin(c) + 11) + 205;
        const py = x * (2 * Math.cos(c) + 7) + 9 * Math.sin(y / 4 + t * 4.9) + 185;
        x = next;
        y = f(next) - oldX;

        const sx = cx + (px - 205) * scale * .92;
        const sy = cy + (py - 195) * scale * .92;
        const shimmer = .35 + .65 * Math.sin(i * .013 + t * 13) ** 2;
        const size = (.48 + shimmer * .54) * this.dpr;
        ctx.globalAlpha = .24 + shimmer * .28;
        ctx.fillRect(sx, sy, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    drawFlow(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .52, cy = h * .5;
      const scale = Math.min(w, h) / 400;
      this.glow(cx, cy, Math.min(w, h) * .5);
      ctx.globalCompositeOperation = 'lighter';

      for (let gy = 99; gy < 300; gy += 2) {
        for (let gx = 99; gx < 300; gx += 2) {
          const k = gx / 8 - 25;
          const e = gy / 8 - 25;
          const d = Math.cos(Math.hypot(k, e) / 3) * e / 5;
          const q = gx / 4 + k / Math.cos(gy / 9) * Math.sin(d * 9 - t * 7) + 25;
          const c = d - t * .875;
          const px = q * Math.sin(c) + 200;
          const py = (q * 2 + gx + gy / 2 + d * 90) / 4 * Math.cos(c) + 200;
          const sx = cx + (px - 200) * scale * 1.12;
          const sy = cy + (py - 200) * scale * 1.12;
          const radial = Math.min(1, Math.hypot(k, e) / 35);
          const pulse = .5 + .5 * Math.sin(d * 5 + t * 9);
          ctx.fillStyle = `rgba(${125 + pulse * 75},${194 + pulse * 42},${225 - pulse * 45},${.12 + radial * .34})`;
          const size = (.5 + pulse * .7) * this.dpr;
          ctx.fillRect(sx, sy, size, size);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  document.querySelectorAll('[data-math-art]').forEach(canvas => new MathArt(canvas));
})();
