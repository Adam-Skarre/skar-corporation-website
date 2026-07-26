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
        else if (this.kind === 'market') this.drawMarket(t);
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
      const scale = Math.min(w, h) * .29;
      this.glow(cx, cy, Math.min(w, h) * .54);
      ctx.globalCompositeOperation = 'lighter';

      const golden = Math.PI * (3 - Math.sqrt(5));
      // No.055's upper chamber is a compact ovoid, not a mirrored lower lobe.
      const upperCount = w < 520 ? 7200 : 11800;
      for (let i = 0; i < upperCount; i++) {
        const s = (i + .5) / upperCount;
        const vertical = -1 + s * 2;
        const theta = i * golden;
        const envelope = Math.pow(Math.sin(Math.PI * s), .48);
        const scallop =
          .055 * Math.sin(theta * 5 + s * 15 - t * 6) +
          .025 * Math.sin(theta * 12 - s * 27 + t * 8);
        const radius = (.055 + envelope * .76) * (1 + scallop);
        const x = Math.cos(theta) * radius * 1.12;
        const z = Math.sin(theta) * radius * .86;
        const y = -.68 + vertical * .52 +
          .035 * Math.sin(theta * 5 + s * 21 - t * 7) * envelope;
        const point = this.rotateProject(
          x, y, z,
          -.07 + .035 * Math.sin(t * 2),
          -.22 + t * .2,
          scale, cx, cy
        );
        const depth = Math.max(0, Math.min(1, (point[2] + 1.05) / 2.1));
        const latitudeBand = .5 + .5 * Math.sin(s * 78 + theta * 3 - t * 10);
        const vein = Math.pow(.5 + .5 * Math.sin(theta * 13 + s * 25 + t * 4), 9);
        const alpha = .055 + depth * .35 + latitudeBand * .09 + vein * .18;
        const warm = Math.pow(.5 + .5 * Math.sin(theta * 3 - s * 19 + t * 3), 8);
        const red = Math.round(108 + warm * 116);
        const green = Math.round(181 + warm * 47);
        const blue = Math.round(232 - warm * 59);
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        const size = (.38 + depth * .82 + vein * .4) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // The lower chamber opens downward into a broad, two-lobed canopy.
      const lowerCount = w < 520 ? 9800 : 16600;
      for (let i = 0; i < lowerCount; i++) {
        const s = (i + .5) / lowerCount;
        const theta = i * golden * 1.07;
        const flare = Math.pow(Math.sin(s * Math.PI * .72), .58);
        const twinLobe = 1 + .17 * Math.cos(theta * 2) +
          .055 * Math.sin(theta * 5 - s * 18 - t * 5);
        const radius = (.06 + flare * 1.04) * twinLobe;
        const x = Math.cos(theta) * radius * 1.18;
        const z = Math.sin(theta) * radius * .76;
        const y = -.1 + s * 1.28 +
          .12 * Math.cos(theta * 2) * flare +
          .035 * Math.sin(theta * 7 + s * 25 - t * 7);
        const point = this.rotateProject(
          x, y, z,
          -.07 + .035 * Math.sin(t * 2),
          -.22 + t * .2,
          scale, cx, cy
        );
        const depth = Math.max(0, Math.min(1, (point[2] + 1.05) / 2.1));
        const filament = Math.pow(.5 + .5 * Math.sin(theta * 10 + s * 42 - t * 9), 7);
        const warm = Math.pow(.5 + .5 * Math.sin(theta * 3 - s * 16 + t * 3), 9);
        ctx.fillStyle = `rgba(${126 + filament * 58 + warm * 42},${185 + filament * 43 + warm * 22},${226 + filament * 24 - warm * 38},${.045 + depth * .28 + filament * .2})`;
        const size = (.36 + depth * .7 + filament * .34) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // A narrow, turbulent stem makes the transition feel continuous.
      const neckCount = w < 520 ? 2600 : 4800;
      for (let i = 0; i < neckCount; i++) {
        const s = (i + .5) / neckCount;
        const theta = i * golden * 1.23 + t * 2;
        const radius = .045 + .06 * Math.sin(s * Math.PI) +
          .018 * Math.sin(theta * 5 + s * 23 - t * 8);
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius * .8;
        const y = -.17 + s * .28;
        const point = this.rotateProject(x, y, z, -.07, -.22 + t * .2, scale, cx, cy);
        const pulse = .5 + .5 * Math.sin(s * 48 - t * 12);
        ctx.fillStyle = `rgba(${168 + pulse * 62},${206 + pulse * 30},${232 - pulse * 21},${.17 + pulse * .34})`;
        const size = (.48 + pulse * .72) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // Long trajectories sweep from the upper ovoid through the stem and canopy.
      ctx.lineWidth = Math.max(.55, this.dpr * .55);
      for (let path = 0; path < 5; path++) {
        ctx.beginPath();
        const phase = path / 5 * TAU + t * (.28 + path * .025);
        for (let step = 0; step <= 150; step++) {
          const s = step / 150;
          const y = -1.18 + s * 2.36;
          const upper = s < .46;
          const local = upper ? s / .46 : (s - .46) / .54;
          const envelope = upper
            ? .055 + Math.pow(Math.sin(local * Math.PI), .52) * .72
            : .055 + Math.pow(Math.sin(local * Math.PI * .72), .58) * 1.02;
          const angle = phase + s * (8.2 + path * .35);
          const x = Math.cos(angle) * envelope * 1.16;
          const z = Math.sin(angle) * envelope * .78;
          const point = this.rotateProject(x, y, z, -.07, -.22 + t * .2, scale, cx, cy);
          if (step === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        }
        ctx.strokeStyle = `rgba(177,219,239,${.04 + path * .012})`;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    drawMarket(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const horizon = h * .08;
      this.glow(w * .5, h * .47, Math.min(w, h) * .7);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = Math.max(.38, this.dpr * .42);

      const columns = w < 520 ? 94 : 148;
      const rows = w < 520 ? 72 : 108;
      const points = Array.from({ length: columns }, () => []);
      const wave = (u, v) =>
        Math.sin(u * 13 + v * 8 - t * 10) * .4 +
        Math.sin(u * 31 - v * 15 + t * 7) * .26 +
        Math.cos(u * 67 + v * 29 - t * 5) * .18 +
        Math.sin(u * 113 - v * 43 + t * 3) * .08 +
        Math.sin((u + v) * 6 + t * 2) * .08;

      for (let column = 0; column < columns; column++) {
        const u = column / (columns - 1);
        ctx.beginPath();
        for (let row = 0; row < rows; row++) {
          const v = row / (rows - 1);
          const depth = Math.pow(v, 1.38);
          const field = wave(u, v);
          const macro = Math.sin(u * 8 - t * 4 + depth * 7) * .58 +
            Math.sin(u * 21 + depth * 3 + t * 3) * .26;
          const foreground = Math.pow(depth, 5) *
            (Math.sin(u * 9 - t * 3) * .55 + Math.sin(u * 27 + t * 5) * .2);
          const px = u * w +
            field * w * (.001 + depth * .008) +
            macro * w * depth * .004;
          const py = horizon + depth * h * .84 +
            field * h * (.009 + depth * .066) +
            macro * h * (.004 + depth * .026) +
            foreground * h * .075;
          points[column].push([px, py]);
          if (row === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const shimmer = .5 + .5 * Math.sin(u * 19 - t * 5);
        ctx.strokeStyle = `rgba(${144 + shimmer * 43},${188 + shimmer * 38},${216 + shimmer * 27},${.1 + shimmer * .19})`;
        ctx.stroke();
      }

      // Diagonal stitches form a continuous triangular surface without chart axes.
      for (let row = 1; row < rows - 1; row += 2) {
        const v = row / (rows - 1);
        ctx.beginPath();
        for (let column = 0; column < columns - 1; column += 2) {
          const a = points[column][row];
          const b = points[column + 1][row + 1];
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
        ctx.strokeStyle = `rgba(160,207,230,${.018 + v * .075})`;
        ctx.stroke();
      }

      // A few brighter contour seams move through the otherwise uniform field.
      for (let seam = 0; seam < 5; seam++) {
        const column = Math.floor(((seam * .193 + t * .035) % 1) * (columns - 1));
        ctx.beginPath();
        points[column].forEach((point, row) => {
          if (row === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.strokeStyle = 'rgba(207,232,242,.22)';
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
