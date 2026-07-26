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
      this.mobile = matchMedia('(max-width: 760px)').matches;
      const dpr = Math.min(devicePixelRatio || 1, this.mobile ? 2 : 1.5);
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
      const frameInterval = reducedMotion ? 1000 : (this.mobile ? 42 : 30);
      if (!document.hidden && this.visible && active && (now - this.last > frameInterval)) {
        this.last = now;
        const t = reducedMotion ? 1.25 : (now - this.start) * 0.00022;
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.kind === 'torus') this.drawTorus(t);
        else if (this.kind === 'sphere') this.drawSphere(t);
        else if (this.kind === 'research') this.drawResearch(t);
        else if (this.kind === 'market') this.drawMarket(t);
        else if (this.kind === 'terrain') this.drawTerrain(t);
        else if (this.kind === 'wings') this.drawWings(t);
        else if (this.kind === 'piece') this.drawPiece(t);
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

      const rings = this.mobile ? 180 : 330;
      const sides = this.mobile ? 20 : 34;
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
      const cx = w * (this.mobile ? .5 : .53), cy = h * .49;
      const scale = Math.min(w, h) * (this.mobile ? .42 : .38);
      this.glow(cx, cy, Math.min(w, h) * .5);
      ctx.globalCompositeOperation = 'lighter';

      const count = this.mobile ? 10400 : 17800;
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
      const contours = this.mobile ? 36 : 48;
      const contourPoints = this.mobile ? 124 : 156;
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
      const cx = w * .52, cy = h * .5;
      const scale = Math.min(w, h) * .38;
      this.glow(cx, cy, Math.min(w, h) * .58);
      ctx.globalCompositeOperation = 'lighter';

      const crownCount = this.mobile ? 7600 : 22000;
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < crownCount; i++) {
        const radial = Math.sqrt((i + .5) / crownCount);
        const theta = i * golden;
        const scallop =
          .06 * Math.sin(theta * 5 - t * 7) +
          .032 * Math.sin(theta * 11 + radial * 19 + t * 5) +
          .016 * Math.cos(theta * 23 - radial * 31 - t * 4);
        const shell = 1 + scallop * (.42 + radial);
        const x = Math.cos(theta) * radial * 1.48 * shell;
        const z = Math.sin(theta) * radial * 1.12 * shell;
        const dome = Math.pow(Math.max(0, 1 - radial * radial), .52);
        const y = .58 * dome - .27 * radial * radial +
          .045 * Math.sin(theta * 7 + radial * 24 - t * 8) +
          .022 * Math.cos(theta * 19 - t * 5);
        const point = this.rotateProject(
          x, y, z,
          -.24 + .055 * Math.sin(t * 2),
          -.28 + t * .22,
          scale, cx, cy
        );
        const depth = Math.max(0, Math.min(1, (point[2] + 1.3) / 2.6));
        const ring = .5 + .5 * Math.sin(radial * 86 + theta * 3 - t * 11);
        const fineRing = .5 + .5 * Math.sin(radial * 147 - theta * 5 + t * 7);
        const vein = Math.pow(.5 + .5 * Math.sin(theta * 13 + radial * 18 + t * 4), 9);
        const alpha = .05 + depth * .34 + ring * .1 + fineRing * .045 + vein * .17;
        const warm = Math.pow(.5 + .5 * Math.sin(theta * 3 - radial * 14 + t * 3), 8);
        const red = Math.round(108 + warm * 116);
        const green = Math.round(181 + warm * 49);
        const blue = Math.round(232 - warm * 61);
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        const size = (.36 + depth * .82 + vein * .4 + fineRing * .12) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // A denser folded underside preserves the floating crown silhouette.
      const folds = this.mobile ? 4000 : 11800;
      for (let i = 0; i < folds; i++) {
        const radial = Math.sqrt((i + .5) / folds);
        const theta = i * golden * 1.07;
        const lobe = .73 + .18 * Math.sin(theta * 5 + t * 4) +
          .075 * Math.sin(theta * 10 - radial * 17) +
          .035 * Math.cos(theta * 20 + radial * 29 - t * 6);
        const x = Math.cos(theta) * radial * 1.32 * lobe;
        const z = Math.sin(theta) * radial * 1.02 * lobe;
        const hollow = Math.pow(1 - radial, 1.28);
        const y = -.2 - hollow * (.4 + .14 * Math.sin(theta * 5 - t * 6)) +
          .045 * Math.sin(radial * 31 + theta * 4 + t * 7);
        const point = this.rotateProject(
          x, y, z,
          -.24 + .055 * Math.sin(t * 2),
          -.28 + t * .22,
          scale, cx, cy
        );
        const depth = Math.max(0, Math.min(1, (point[2] + 1.25) / 2.5));
        const filament = Math.pow(.5 + .5 * Math.sin(theta * 10 + radial * 39 - t * 8), 7);
        ctx.fillStyle = `rgba(${136 + filament * 74},${188 + filament * 46},${220 + filament * 27},${.04 + depth * .28 + filament * .21})`;
        const size = (.36 + depth * .73 + filament * .34) * this.dpr;
        ctx.fillRect(point[0], point[1], size, size);
      }

      // Fine trajectories add analytical depth without changing the form.
      ctx.lineWidth = Math.max(.5, this.dpr * .52);
      const pathCount = this.mobile ? 5 : 7;
      for (let path = 0; path < pathCount; path++) {
        ctx.beginPath();
        const phase = path / pathCount * TAU + t * (.3 + path * .025);
        const pathSteps = this.mobile ? 108 : 150;
        for (let step = 0; step <= pathSteps; step++) {
          const u = step / pathSteps * TAU;
          const radius = 1.04 + .1 * Math.sin(u * 3 + phase);
          const x = Math.cos(u) * radius * 1.36;
          const y = .01 + .36 * Math.sin(u * (1 + path % 2) + phase);
          const z = Math.sin(u) * radius * .91;
          const point = this.rotateProject(x, y, z, -.24, -.28 + t * .22, scale, cx, cy);
          if (step === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        }
        ctx.strokeStyle = `rgba(177,219,239,${.032 + path * .01})`;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    drawMarket(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cy = h * .5;
      this.glow(w * .5, cy, Math.max(w, h) * .62);
      ctx.globalCompositeOperation = 'lighter';
      const strands = this.mobile ? 17 : 27;
      const samples = this.mobile ? 180 : 300;
      const pulseU = (t * .2) % 1;
      const pulseDistance = u => {
        const distance = Math.abs(u - pulseU);
        return Math.min(distance, 1 - distance);
      };
      const pulseAt = u => Math.exp(-(pulseDistance(u) ** 2) / .0048);
      const signalPoint = (u, phase, depth = 0) => {
        const broad =
          Math.sin(u * TAU * 4.35 - t * 1.75 + phase) +
          .42 * Math.sin(u * TAU * 2.05 + t * .72 - phase * .55) +
          .18 * Math.sin(u * TAU * 8.4 - t * 2.6 + phase * .28);
        const breathing = .84 + .16 * Math.sin(u * TAU * 1.5 - t * .7);
        const pulse = pulseAt(u);
        const amplitude = h * .155 * breathing * (1 + pulse * .52);
        const fineSignal =
          Math.sin(u * TAU * 12.2 + t * 1.15 - phase * .65) * h * .009;
        return [
          u * w,
          cy + broad * amplitude + fineSignal + depth * h * .045
        ];
      };

      // A quiet horizon gives the signal a center without making it a graph.
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.lineWidth = Math.max(.32, this.dpr * .36);
      ctx.strokeStyle = 'rgba(118,178,210,.075)';
      ctx.stroke();

      const ribbons = [];
      for (let strand = 0; strand < strands; strand++) {
        const z = strands === 1 ? 0 : strand / (strands - 1) * 2 - 1;
        const phase = z * 1.08;
        const depth = 1 - Math.abs(z) * .5;
        const points = [];
        ctx.beginPath();
        for (let sample = 0; sample <= samples; sample++) {
          const u = sample / samples;
          const point = signalPoint(u, phase, z);
          points.push(point);
          if (sample === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);

          if (sample % (this.mobile ? 6 : 5) === strand % 4) {
            const shimmer = .5 + .5 * Math.sin(sample * .16 + strand * .71 - t * 7);
            const pulse = pulseAt(u);
            const size = (.3 + depth * .42 + shimmer * .22 + pulse * .55) * this.dpr;
            ctx.fillStyle = `rgba(${103 + depth * 54 + pulse * 55},${170 + depth * 42 + pulse * 37},${217 + depth * 23 + pulse * 19},${.035 + depth * .1 + shimmer * .045 + pulse * .16})`;
            ctx.fillRect(point[0], point[1], size, size);
          }
        }
        ribbons.push({ points, depth });
        const shimmer = .5 + .5 * Math.sin(strand * .42 - t * 1.7);
        ctx.lineWidth = Math.max(.34, this.dpr * (.33 + depth * .21));
        ctx.strokeStyle = `rgba(${101 + shimmer * 34},${170 + shimmer * 32},${219 + shimmer * 20},${.065 + depth * .14})`;
        ctx.stroke();
      }

      // The traveling energy front briefly revives every trace it crosses.
      const pulseWidth = w * (this.mobile ? .105 : .082);
      const pulseX = pulseU * w;
      const pulseGlow = ctx.createRadialGradient(pulseX, cy, 0, pulseX, cy, pulseWidth * 1.65);
      pulseGlow.addColorStop(0, 'rgba(91,224,230,.16)');
      pulseGlow.addColorStop(.45, 'rgba(67,190,216,.07)');
      pulseGlow.addColorStop(1, 'rgba(33,116,166,0)');
      ctx.fillStyle = pulseGlow;
      ctx.fillRect(pulseX - pulseWidth * 1.8, 0, pulseWidth * 3.6, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(pulseX - pulseWidth, 0, pulseWidth * 2, h);
      ctx.clip();
      ctx.shadowBlur = (this.mobile ? 8 : 12) * this.dpr;
      ctx.shadowColor = 'rgba(73,221,230,.7)';
      ribbons.forEach(({ points, depth }) => {
        ctx.beginPath();
        points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.lineWidth = Math.max(.75, this.dpr * (.58 + depth * .36));
        ctx.strokeStyle = `rgba(119,222,231,${.13 + depth * .2})`;
        ctx.stroke();
      });
      ctx.restore();

      // A luminous primary signal anchors the layered ribbon.
      const primary = [];
      for (let sample = 0; sample <= samples; sample++) {
        const u = sample / samples;
        primary.push(signalPoint(u, 0, 0));
      }
      ctx.beginPath();
      primary.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
      });
      ctx.lineWidth = Math.max(1, this.dpr * 1.08);
      ctx.strokeStyle = 'rgba(139,225,232,.58)';
      ctx.shadowBlur = 9 * this.dpr;
      ctx.shadowColor = 'rgba(67,216,226,.62)';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Beads and a small flare make the pulse legible even on a phone.
      const beadCount = this.mobile ? 76 : 126;
      for (let bead = 0; bead < beadCount; bead++) {
        const u = bead / (beadCount - 1);
        const point = signalPoint(u, 0, 0);
        const pulse = pulseAt(u);
        const size = (.62 + pulse * 2.35) * this.dpr;
        ctx.fillStyle = `rgba(${169 + pulse * 73},${222 + pulse * 31},${231 - pulse * 20},${.25 + pulse * .68})`;
        ctx.fillRect(point[0] - size / 2, point[1] - size / 2, size, size);
      }
      const flare = signalPoint(pulseU, 0, 0);
      const flareRadius = (this.mobile ? 11 : 15) * this.dpr;
      const flareGlow = ctx.createRadialGradient(flare[0], flare[1], 0, flare[0], flare[1], flareRadius);
      flareGlow.addColorStop(0, 'rgba(224,255,255,.94)');
      flareGlow.addColorStop(.18, 'rgba(130,235,239,.72)');
      flareGlow.addColorStop(1, 'rgba(76,193,220,0)');
      ctx.fillStyle = flareGlow;
      ctx.fillRect(flare[0] - flareRadius, flare[1] - flareRadius, flareRadius * 2, flareRadius * 2);
      ctx.globalCompositeOperation = 'source-over';
    }

    drawTerrain(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .5;
      const count = this.mobile ? 9000 : 26000;
      const pathX = v => .015 - .38 * v +
        .065 * Math.sin(v * 8.4 - .4) +
        .028 * Math.sin(v * 19 + .7);
      const heightAt = (u, v) => {
        const peak = (x, z, width, depth, height) =>
          Math.exp(-((u - x) ** 2 / width + (v - z) ** 2 / depth)) * height;
        const mountains =
          peak(-.58, .34, .11, .17, 1.08) +
          peak(.48, .27, .075, .13, 1.34) +
          peak(.79, .54, .12, .18, .82) +
          peak(-.82, .67, .16, .2, .62) +
          peak(.05, .08, .19, .055, .42);
        const ridge =
          .17 * Math.sin(u * 8.8 + v * 2.5) +
          .08 * Math.sin(u * 19 - v * 8) +
          .035 * Math.cos(u * 43 + v * 17);
        const pass = Math.exp(-((u - pathX(v)) ** 2) / (.026 + v * .016)) *
          (.46 + .48 * Math.sin(v * Math.PI));
        return Math.max(-.12, mountains + ridge * (.35 + mountains * .42) - pass);
      };

      this.glow(w * .55, h * .44, Math.min(w, h) * .76);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < count; i++) {
        const v = (i * .61803398875) % 1;
        const u = ((i * .75487766625) % 1) * 2 - 1;
        const jitter = Math.sin(i * 91.733) * .008;
        const elevation = heightAt(u, v);
        const perspective = .54 + v * .72;
        const px = cx + (u + jitter) * w * .48 * perspective +
          Math.sin(v * 7 + t * 1.4) * w * .003;
        const py = h * .19 + v * h * .72 -
          elevation * h * .255 * perspective;
        if (py < h * .04 || py > h * .98) continue;

        const routeDistance = Math.abs(u - pathX(v));
        const ridgeLight = Math.pow(.5 + .5 * Math.sin(
          elevation * 31 + u * 22 - v * 17 - t * 5
        ), 8);
        const strata = .5 + .5 * Math.sin(elevation * 48 + v * 65 + u * 9);
        const trailGlow = Math.exp(-routeDistance * 28);
        const depth = .28 + v * .72;
        const warm = Math.pow(.5 + .5 * Math.sin(u * 7 - v * 11 + t * 2.2), 12);
        const alpha = .045 + depth * .25 + ridgeLight * .24 +
          strata * .055 + trailGlow * .17;
        const red = Math.round(91 + depth * 48 + warm * 72 + trailGlow * 36);
        const green = Math.round(157 + depth * 47 + warm * 48 + trailGlow * 32);
        const blue = Math.round(215 + depth * 27 - warm * 27);
        ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        const size = (.38 + depth * .86 + ridgeLight * .48 + trailGlow * .3) * this.dpr;
        ctx.fillRect(px, py, size, size);
      }

      // Multiple sparse ridgelines give the particle mass a legible mountain silhouette.
      const ridgeCount = this.mobile ? 8 : 13;
      const ridgeSteps = this.mobile ? 120 : 190;
      ctx.lineWidth = Math.max(.4, this.dpr * .44);
      for (let ridge = 0; ridge < ridgeCount; ridge++) {
        const v = .08 + ridge / (ridgeCount - 1) * .82;
        ctx.beginPath();
        for (let step = 0; step <= ridgeSteps; step++) {
          const u = -1 + step / ridgeSteps * 2;
          const elevation = heightAt(u, v);
          const perspective = .54 + v * .72;
          const px = cx + u * w * .48 * perspective;
          const py = h * .19 + v * h * .72 - elevation * h * .255 * perspective;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const shimmer = .5 + .5 * Math.sin(ridge * .9 - t * 5);
        ctx.strokeStyle = `rgba(166,215,238,${.025 + shimmer * .055})`;
        ctx.stroke();
      }

      // The way through is a beaded light stream sitting directly on the pass.
      const routeSteps = this.mobile ? 150 : 240;
      const routePoints = [];
      for (let step = 0; step <= routeSteps; step++) {
        const v = 1 - step / routeSteps * .94;
        const u = pathX(v);
        const elevation = heightAt(u, v) + .06;
        const perspective = .54 + v * .72;
        routePoints.push([
          cx + u * w * .48 * perspective,
          h * .19 + v * h * .72 - elevation * h * .255 * perspective
        ]);
      }

      ctx.beginPath();
      routePoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
      });
      ctx.lineWidth = Math.max(1.2, this.dpr * 1.35);
      ctx.strokeStyle = 'rgba(184,222,241,.22)';
      ctx.shadowBlur = 10 * this.dpr;
      ctx.shadowColor = 'rgba(91,176,226,.55)';
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (let step = 0; step <= routeSteps; step++) {
        const [px, py] = routePoints[step];
        const pulsePosition = (t * .34) % 1;
        const progress = step / routeSteps;
        const pulse = Math.exp(-((progress - pulsePosition) ** 2) / .0035);
        const baseAlpha = .5 + .28 * Math.sin(step * .31 - t * 8) ** 2;

        ctx.fillStyle = `rgba(${214 + pulse * 30},${221 + pulse * 23},${190 + pulse * 65},${baseAlpha + pulse * .5})`;
        const size = (1.35 + pulse * 2.6) * this.dpr;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);

        if (step % (this.mobile ? 7 : 9) === 0) {
          const halo = (2.4 + pulse * 4) * this.dpr;
          ctx.fillStyle = `rgba(122,194,231,${.14 + pulse * .26})`;
          ctx.fillRect(px - halo / 2, py - halo / 2, halo, halo);
        }
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
      const count = this.mobile ? 16000 : 40000;
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

    drawPiece(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .39, cy = h * .5;
      const unit = Math.min(w * .17, h * .235);
      const gap = unit * .17;
      const pitch = unit + gap;
      const cycle = (t / 1.1) % 1;
      const smooth = value => {
        const clamped = Math.max(0, Math.min(1, value));
        return clamped * clamped * (3 - 2 * clamped);
      };
      const arrive = smooth((cycle - .15) / .33);
      const depart = smooth((cycle - .72) / .28);
      const installed = Math.max(0, Math.min(1, arrive - depart));
      const completion = smooth((installed - .62) / .28);
      const pulse = completion * (.52 + .48 * Math.sin((cycle - .46) * 23) ** 2);

      this.glow(cx, cy, Math.min(w, h) * (.42 + pulse * .13));
      ctx.globalCompositeOperation = 'lighter';

      const pointsPerTile = this.mobile ? 230 : 390;
      const drawTile = (column, row, tileInstalled, moving = false) => {
        let tx = cx + (column - 1) * pitch;
        let ty = cy + (row - 1) * pitch;
        let rotation = 0;

        if (moving) {
          tx += (1 - installed) * unit * 3.18;
          ty += Math.sin((1 - installed) * Math.PI) * unit * .08;
          rotation = (1 - installed) * .15;
        }

        const cos = Math.cos(rotation), sin = Math.sin(rotation);
        const localPulse = tileInstalled ? pulse : 0;
        const expansion = 1 + localPulse * .045;

        for (let i = 0; i < pointsPerTile; i++) {
          const seed = i * 12.9898 + column * 71.17 + row * 119.41;
          const randomA = Math.sin(seed) * 43758.5453 % 1;
          const randomB = Math.sin(seed * 1.713 + 4.2) * 24634.6345 % 1;
          const a = Math.abs(randomA);
          const b = Math.abs(randomB);
          const edgePoint = i % 5 === 0;
          let lx, ly;

          if (edgePoint) {
            const edge = i % 4;
            const travel = (i * .61803398875) % 1 - .5;
            lx = edge < 2 ? travel : (edge === 2 ? -.5 : .5);
            ly = edge >= 2 ? travel : (edge === 0 ? -.5 : .5);
          } else {
            lx = a - .5;
            ly = b - .5;
          }

          const contour = Math.sin(lx * 19 + ly * 13 - t * 8 + column * 2.1) * unit * .012;
          lx = lx * unit * expansion + contour;
          ly = ly * unit * expansion + contour * .42;
          const px = tx + lx * cos - ly * sin;
          const py = ty + lx * sin + ly * cos;
          const wave = .5 + .5 * Math.sin(i * .071 + t * 12 + column * 1.7 - row);
          const centerEnergy = 1 - Math.min(1, Math.hypot(lx, ly) / (unit * .7));
          const alpha = .15 + wave * .26 + localPulse * (.24 + centerEnergy * .32);
          const warm = .5 + .5 * Math.sin(seed * .09 + t * 5);
          ctx.fillStyle = `rgba(${132 + warm * 74},${194 + warm * 37},${229 - warm * 24},${alpha})`;
          const size = (.52 + wave * .64 + localPulse * .38) * this.dpr;
          ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }

        ctx.strokeStyle = `rgba(158,207,246,${.16 + localPulse * .46})`;
        ctx.lineWidth = Math.max(.7, this.dpr * (.5 + localPulse * .28));
        ctx.shadowBlur = localPulse * 18 * this.dpr;
        ctx.shadowColor = 'rgba(93,178,238,.75)';
        ctx.strokeRect(tx - unit * expansion / 2, ty - unit * expansion / 2, unit * expansion, unit * expansion);
        ctx.shadowBlur = 0;
      };

      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          if (column === 1 && row === 1) continue;
          drawTile(column, row, true);
        }
      }

      if (installed < .96) {
        ctx.setLineDash([3 * this.dpr, 5 * this.dpr]);
        ctx.strokeStyle = `rgba(155,207,247,${.38 * (1 - installed)})`;
        ctx.lineWidth = this.dpr;
        ctx.strokeRect(cx - unit / 2, cy - unit / 2, unit, unit);
        ctx.setLineDash([]);
      }
      drawTile(1, 1, true, true);

      if (completion > .05) {
        for (let ring = 0; ring < 3; ring++) {
          const progress = ((cycle * 3.8 + ring / 3) % 1);
          ctx.strokeStyle = `rgba(115,194,239,${completion * (1 - progress) * .25})`;
          ctx.lineWidth = Math.max(.7, this.dpr * .65);
          ctx.beginPath();
          ctx.arc(cx, cy, unit * (1.35 + progress * 2.25), 0, TAU);
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    drawFlow(t) {
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      const cx = w * .52, cy = h * .5;
      const scale = Math.min(w, h) / 400;
      this.glow(cx, cy, Math.min(w, h) * .5);
      ctx.globalCompositeOperation = 'lighter';

      const gridStep = this.mobile ? 3 : 2;
      for (let gy = 99; gy < 300; gy += gridStep) {
        for (let gx = 99; gx < 300; gx += gridStep) {
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
