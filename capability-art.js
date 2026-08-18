(() => {
  const TAU = Math.PI * 2;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fract = value => value - Math.floor(value);
  const hash = value => fract(Math.sin(value * 91.3458) * 47453.5453);
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));

  class CapabilityArt {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.mode = canvas.dataset.capabilityArt;
      this.visible = true;
      this.start = performance.now();
      this.last = 0;
      this.resize = this.resize.bind(this);
      this.frame = this.frame.bind(this);
      this.resize();

      new ResizeObserver(this.resize).observe(canvas);
      new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
      }, { rootMargin: '140px' }).observe(canvas);

      requestAnimationFrame(this.frame);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.mobile = matchMedia('(max-width: 760px)').matches;
      const dpr = Math.min(devicePixelRatio || 1, this.mobile ? 2 : 1.65);
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
      const interval = reducedMotion ? 1000 : (this.mobile ? 42 : 30);
      if (!document.hidden && this.visible && now - this.last > interval) {
        this.last = now;
        const t = reducedMotion ? 1.35 : (now - this.start) * .00024;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.prepare();
        this.draw(t);
        this.finish();
      }
      requestAnimationFrame(this.frame);
    }

    prepare() {
      const ctx = this.ctx;
      const cx = this.width * .5;
      const cy = this.height * .5;
      const radius = Math.min(this.width, this.height) * .55;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      glow.addColorStop(0, 'rgba(54,145,187,.15)');
      glow.addColorStop(.48, 'rgba(17,72,105,.065)');
      glow.addColorStop(1, 'rgba(3,15,27,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    finish() {
      const ctx = this.ctx;
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      const vignette = ctx.createRadialGradient(
        this.width * .5,
        this.height * .5,
        Math.min(this.width, this.height) * .22,
        this.width * .5,
        this.height * .5,
        Math.min(this.width, this.height) * .62
      );
      vignette.addColorStop(0, 'rgba(3,20,35,0)');
      vignette.addColorStop(1, 'rgba(3,20,35,.16)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    shimmer(index, t, speed = 8) {
      return .5 + .5 * Math.sin(index * .061 + t * speed) ** 2;
    }

    point(x, y, size, alpha, shimmer = .5, warmth = 0) {
      if (x < -4 || y < -4 || x > this.width + 4 || y > this.height + 4) return;
      const ctx = this.ctx;
      const red = Math.round(178 + shimmer * 56 + warmth * 10);
      const green = Math.round(211 + shimmer * 34 + warmth * 8);
      const blue = Math.round(230 + shimmer * 18 - warmth * 40);
      ctx.fillStyle = `rgba(${red},${green},${blue},${clamp(alpha)})`;
      ctx.fillRect(x, y, size, size);
    }

    line(points, alpha = .16, width = .65, warmth = 0) {
      if (points.length < 2) return;
      const ctx = this.ctx;
      ctx.beginPath();
      points.forEach(([x, y], index) => {
        if (index) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.strokeStyle = warmth
        ? `rgba(204,226,198,${alpha})`
        : `rgba(163,211,235,${alpha})`;
      ctx.lineWidth = Math.max(.55, width * this.dpr);
      ctx.stroke();
    }

    project(x, y, z, yaw, pitch, scale, cx = .5, cy = .5) {
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y1 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      const perspective = 4.7 / (5.2 - z2 * .0045);
      return [
        this.width * cx + x1 * scale * perspective,
        this.height * cy + y1 * scale * perspective,
        z2
      ];
    }

    draw(t) {
      const drawings = {
        engineering: () => this.engineering(t),
        modeling: () => this.modeling(t),
        ai: () => this.ai(t),
        manufacturing: () => this.manufacturing(t),
        supply: () => this.supply(t),
        energy: () => this.energy(t),
        industrial: () => this.industrial(t),
        small: () => this.smallBusiness(t)
      };
      (drawings[this.mode] || drawings.engineering)();
    }

    engineering(t) {
      const scale = Math.min(this.width, this.height) / 520;
      const yaw = 1.39 + Math.sin(t * .18) * .025;
      const pitch = .11 + Math.cos(t * .15) * .018;
      const cycle = reducedMotion ? .56 : (t * .2) % 1;
      const smooth = value => {
        const bounded = clamp(value);
        return bounded * bounded * (3 - 2 * bounded);
      };
      const seated = (arrivalDelay, departureDelay) => {
        const arrivalStart = .06 + arrivalDelay;
        const arrival = smooth((cycle - arrivalStart) / .22);
        const departureStart = .71 + departureDelay;
        const departure = smooth((cycle - departureStart) / .19);
        return arrival * (1 - departure);
      };

      const rearRingSeat = seated(0, .14);
      const shaftSeat = seated(.025, .115);
      const hubSeat = seated(.055, .09);
      const frontRingSeat = seated(.165, 0);
      const assemblyComplete = Math.min(rearRingSeat, shaftSeat, hubSeat, frontRingSeat);

      let turns = 0;
      if (cycle >= .34 && cycle < .45) {
        turns = .18 * smooth((cycle - .34) / .11);
      } else if (cycle >= .45 && cycle < .71) {
        turns = .18 + (cycle - .45) / .26 * 4.65;
      } else if (cycle >= .71) {
        turns = 4.83 + .42 * smooth((cycle - .71) / .16);
      }
      const rotorAngle = turns * TAU;
      const dimension = Math.min(this.width, this.height);
      const project = (x, y, z, seat = 1, offsetX = 0, offsetY = 0) => {
        const point = this.project(x, y, z, yaw, pitch, scale);
        return [
          point[0] + offsetX * dimension * (1 - seat),
          point[1] + offsetY * dimension * (1 - seat),
          point[2]
        ];
      };

      const ringPoint = (center, radius, angle, seat, offsetX, offsetY) => project(
        center,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        seat,
        offsetX,
        offsetY
      );
      const drawRing = (center, radius, seat, offsetX, offsetY, alpha, width, warmth = 0) => {
        const path = [];
        for (let step = 0; step <= 128; step++) {
          path.push(ringPoint(center, radius, step / 128 * TAU, seat, offsetX, offsetY));
        }
        this.line(path, alpha, width, warmth);
        const particles = this.mobile ? 115 : 210;
        for (let i = particles; i > 0; i--) {
          const angle = hash(i * 7.3 + center * .17 + radius) * TAU;
          const p = ringPoint(
            center,
            radius + (hash(i * 13.9) - .5) * 4.5,
            angle,
            seat,
            offsetX,
            offsetY
          );
          const light = this.shimmer(i + Math.round(radius * 11), t, 7);
          this.point(p[0], p[1], (.38 + light * .58) * this.dpr, .055 + light * .23, light, warmth);
        }
      };

      drawRing(25, 145, rearRingSeat, .27, .16, .17, .72, .25);
      drawRing(25, 132, rearRingSeat, .27, .16, .08, .42);
      for (let brace = 0; brace < 10; brace++) {
        const angle = brace / 10 * TAU + .08;
        const inner = ringPoint(25, 116, angle, rearRingSeat, .27, .16);
        const outer = ringPoint(25, 142, angle + .025, rearRingSeat, .27, .16);
        this.line([inner, outer], .095, .46, .18);
      }

      const shaftStart = project(-120, 0, 0, shaftSeat, -.05, .28);
      const shaftEnd = project(118, 0, 0, shaftSeat, -.05, .28);
      this.line([shaftStart, shaftEnd], .25, .95, .55);
      const shaftParticles = this.mobile ? 190 : 330;
      for (let i = shaftParticles; i > 0; i--) {
        const x = -118 + hash(i * 3.8) * 236;
        const angle = hash(i * 8.7) * TAU;
        const radius = 5 + hash(i * 13.1) * 8;
        const p = project(
          x,
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          shaftSeat,
          -.05,
          .28
        );
        const light = this.shimmer(i + 800, t, 7);
        this.point(p[0], p[1], (.4 + light * .5) * this.dpr, .05 + light * .2, light, .5);
      }

      const bladeSeats = [];
      for (let blade = 0; blade < 12; blade++) {
        const bladeSeat = seated(.065 + blade * .008, .025 + (11 - blade) * .004);
        bladeSeats.push(bladeSeat);
        const angle = blade / 12 * TAU + rotorAngle + (1 - bladeSeat) * (blade % 2 ? -.18 : .18);
        const radialShift = (1 - bladeSeat) * 102;
        const depthShift = (1 - bladeSeat) * (blade % 2 ? -34 : 34);
        const vertices = [
          [depthShift, Math.cos(angle) * (31 + radialShift), Math.sin(angle) * (31 + radialShift)],
          [depthShift, Math.cos(angle + .09) * (111 + radialShift), Math.sin(angle + .09) * (111 + radialShift)],
          [depthShift, Math.cos(angle + .33) * (95 + radialShift), Math.sin(angle + .33) * (95 + radialShift)],
          [depthShift, Math.cos(angle + .2) * (38 + radialShift), Math.sin(angle + .2) * (38 + radialShift)]
        ];
        const outline = vertices.map(point => project(...point));
        outline.push(outline[0]);
        this.line(outline, .14 + bladeSeat * .07, .58, .62);
        const bladeParticles = this.mobile ? 82 : 145;
        for (let i = bladeParticles; i > 0; i--) {
          const u = Math.sqrt(hash(i * 4.7 + blade * 17));
          const v = hash(i * 11.9 + blade * 7);
          const radial = 31 + u * 78 + radialShift;
          const sweep = angle + .1 + u * .22 + (v - .5) * .12;
          const p = project(
            depthShift + (hash(i * 19.1 + blade) - .5) * 5,
            Math.cos(sweep) * radial,
            Math.sin(sweep) * radial
          );
          const light = this.shimmer(i + blade * 180, t, 9);
          this.point(
            p[0],
            p[1],
            (.4 + light * .64) * this.dpr,
            .06 + light * (.2 + bladeSeat * .08),
            light,
            .68
          );
        }
      }

      drawRing(0, 34, hubSeat, 0, -.28, .26, .82, .8);
      const hubCount = this.mobile ? 620 : 1120;
      for (let i = hubCount; i > 0; i--) {
        const radial = Math.sqrt(hash(i * 5.1)) * 33;
        const angle = hash(i * 11.7 + 4) * TAU;
        const x = (hash(i * 17.4) - .5) * 38;
        const p = project(
          x,
          Math.cos(angle) * radial,
          Math.sin(angle) * radial,
          hubSeat,
          0,
          -.28
        );
        const light = this.shimmer(i + 4200, t, 8);
        this.point(p[0], p[1], (.42 + light * .6) * this.dpr, .06 + light * .26, light, .56);
      }

      drawRing(-25, 145, frontRingSeat, -.28, -.14, .22, .82, .34);
      drawRing(-25, 132, frontRingSeat, -.28, -.14, .1, .48);
      for (let brace = 0; brace < 10; brace++) {
        const angle = brace / 10 * TAU - .04;
        const inner = ringPoint(-25, 117, angle, frontRingSeat, -.28, -.14);
        const outer = ringPoint(-25, 142, angle - .025, frontRingSeat, -.28, -.14);
        this.line([inner, outer], .11, .5, .3);
      }

      const bladeAssembly = Math.min(...bladeSeats);
      const operating = Math.min(assemblyComplete, bladeAssembly);
      if (operating > .95 && cycle > .43 && cycle < .8) {
        for (let pulse = 0; pulse < 36; pulse++) {
          const angle = pulse / 36 * TAU + rotorAngle * .15;
          const radius = 151 + 5 * Math.sin(t * 7 + pulse * .7);
          const p = ringPoint(0, radius, angle, 1, 0, 0);
          const light = this.shimmer(pulse + 6800, t, 10);
          this.point(
            p[0],
            p[1],
            (pulse % 6 === 0 ? 1.45 : .65) * this.dpr,
            .08 + light * .28,
            light,
            .76
          );
        }
      }

      const seatMoments = [.28, .305, .33, .355, .38, .405, .43];
      seatMoments.forEach((moment, index) => {
        const elapsed = cycle - moment;
        if (elapsed < 0 || elapsed > .04) return;
        const fade = 1 - elapsed / .04;
        for (let particle = 0; particle < 28; particle++) {
          const angle = particle / 28 * TAU;
          const radius = 20 + elapsed * 560;
          const p = ringPoint(0, radius, angle, 1, 0, 0);
          this.point(
            p[0],
            p[1],
            (particle % 7 === 0 ? 1.5 : .7) * this.dpr,
            fade * (particle % 7 === 0 ? .58 : .2),
            .96,
            index > 3 ? .8 : .5
          );
        }
      });
    }

    modeling(t) {
      const count = this.mobile ? 4200 : 9200;
      const scale = Math.min(this.width, this.height) / 520;
      const cycle = (t * .18) % 1;
      const smooth = value => {
        const bounded = clamp(value);
        return bounded * bounded * (3 - 2 * bounded);
      };
      let resolution = 0;
      if (cycle >= .12 && cycle < .42) resolution = smooth((cycle - .12) / .3);
      else if (cycle >= .42 && cycle < .71) resolution = 1;
      else if (cycle >= .71 && cycle < .94) {
        resolution = 1 - smooth((cycle - .71) / .23);
      }
      const model = (x, z) => {
        const rise = 65 * Math.exp(-((x + 62) ** 2 + (z - 8) ** 2 * 1.2) / 6900);
        const shoulder = 38 * Math.exp(-((x - 105) ** 2 + (z + 52) ** 2) / 5400);
        const basin = -43 * Math.exp(-((x - 12) ** 2 + (z - 70) ** 2) / 3600);
        return rise + shoulder + basin + x * .045 +
          9 * Math.sin(x * .026) * Math.cos(z * .031);
      };
      const toScreen = (x, y, z) => [
        this.width * .5 + (x + z * .35) * scale,
        this.height * .53 + (z * .46 - y) * scale
      ];
      const datum = i => {
        const targetX = (hash(i * 2.17) - .5) * 390;
        const targetZ = (hash(i * 4.63 + 10) - .5) * 300;
        const targetY = model(targetX, targetZ);
        const delay = hash(i * 7.81 + 31) * .17;
        const pointResolution = smooth((resolution - delay) / (1 - delay));
        const drift = 1 - pointResolution;
        const rawX = targetX + (hash(i * 9.71 + 4) - .5) * 160 +
          Math.sin(t * .75 + i * .041) * 14 * drift;
        const rawZ = targetZ + (hash(i * 12.31 + 7) - .5) * 125 +
          Math.cos(t * .62 + i * .033) * 11 * drift;
        const rawY = (hash(i * 15.73 + 19) - .5) * 290 +
          Math.sin(t * .9 + i * .057) * 12 * drift;
        return {
          pointResolution,
          target: [targetX, targetY, targetZ],
          current: [
            rawX + (targetX - rawX) * pointResolution,
            rawY + (targetY - rawY) * pointResolution,
            rawZ + (targetZ - rawZ) * pointResolution
          ]
        };
      };

      const modelPresence = smooth(resolution);
      if (modelPresence > .01) {
        for (let row = 0; row < 18; row++) {
          const z = -150 + row / 17 * 300;
          const path = [];
          for (let step = 0; step <= 72; step++) {
            const x = -195 + step / 72 * 390;
            path.push(toScreen(x, model(x, z), z));
          }
          this.line(
            path,
            modelPresence * (row % 4 === 0 ? .14 : .045),
            row % 4 === 0 ? .52 : .3
          );
        }
        for (let column = 0; column < 15; column++) {
          const x = -195 + column / 14 * 390;
          const path = [];
          for (let step = 0; step <= 60; step++) {
            const z = -150 + step / 60 * 300;
            path.push(toScreen(x, model(x, z), z));
          }
          this.line(
            path,
            modelPresence * (column % 4 === 0 ? .12 : .035),
            column % 4 === 0 ? .48 : .28
          );
        }
      }

      const residualAlpha = Math.sin(resolution * Math.PI) * .2;
      if (residualAlpha > .01) {
        for (let sample = 0; sample < 24; sample++) {
          const observation = datum(83 + sample * 337);
          const from = toScreen(...observation.current);
          const to = toScreen(...observation.target);
          this.line([from, to], residualAlpha, .42, .35);
          this.point(to[0], to[1], 1.05 * this.dpr, residualAlpha * 1.8, .95, .45);
        }
      }

      for (let i = count; i > 0; i--) {
        const observation = datum(i);
        const [x, y] = toScreen(...observation.current);
        const light = this.shimmer(i, t, 7.5);
        const resolved = observation.pointResolution;
        this.point(
          x,
          y,
          (.36 + light * .52 + resolved * .13) * this.dpr,
          .045 + light * (.1 + resolved * .22) + resolved * .05,
          light,
          resolved * .38
        );
      }

      if (modelPresence > .02) {
        const fittedSignal = [];
        for (let step = 0; step <= 100; step++) {
          const u = step / 100;
          const x = -185 + u * 370;
          const z = Math.sin(u * TAU * 1.3) * 27;
          fittedSignal.push(toScreen(x, model(x, z) + 6, z));
        }
        this.line(fittedSignal, modelPresence * .62, 1.02, .85);
      }
    }

    ai(t) {
      const scale = Math.min(this.width, this.height) / 520;
      const phase = t * 1.35;
      const toScreen = (x, y) => [
        this.width * .5 + x * scale,
        this.height * .5 + y * scale
      ];
      const mix = (start, end, amount) => start + (end - start) * amount;
      const quadratic = (start, control, end, u) => {
        const v = 1 - u;
        return [
          v * v * start[0] + 2 * v * u * control[0] + u * u * end[0],
          v * v * start[1] + 2 * v * u * control[1] + u * u * end[1]
        ];
      };
      const layerSpecs = [
        { x: -205, count: 9, spread: 150 },
        { x: -116, count: 12, spread: 176 },
        { x: -27, count: 14, spread: 188 },
        { x: 62, count: 12, spread: 176 },
        { x: 148, count: 7, spread: 132 }
      ];
      const inferencePosition = (phase * .115) % 1;
      const circularDistance = (a, b) => {
        const distance = Math.abs(a - b) % 1;
        return Math.min(distance, 1 - distance);
      };
      const layerFocus = index =>
        Math.pow(clamp(1 - circularDistance(inferencePosition, index / layerSpecs.length) * 5), 2);
      const nodePosition = (layerIndex, nodeIndex) => {
        const spec = layerSpecs[layerIndex];
        const normalized = spec.count === 1 ? .5 : nodeIndex / (spec.count - 1);
        return [
          spec.x + Math.sin(phase * .24 + nodeIndex * .63 + layerIndex) * 2.4,
          (normalized - .5) * spec.spread +
            Math.sin(phase * .31 + nodeIndex * .79 + layerIndex * 1.7) * 3.2
        ];
      };

      // Token-like observations arrive as small feature vectors.
      for (let token = 0; token < layerSpecs[0].count; token++) {
        const destination = nodePosition(0, token);
        const progress = (phase * .18 + token * .127) % 1;
        const start = [-252, destination[1] + (hash(token * 7.1) - .5) * 22];
        const path = [toScreen(...start), toScreen(...destination)];
        this.line(path, .045 + Math.sin(progress * Math.PI) * .07, .44);
        const signal = [
          mix(start[0], destination[0], progress),
          mix(start[1], destination[1], progress)
        ];
        const signalPoint = toScreen(...signal);
        this.point(
          signalPoint[0],
          signalPoint[1],
          (1 + Math.sin(progress * Math.PI) * .8) * this.dpr,
          .28 + Math.sin(progress * Math.PI) * .52,
          .95,
          .25
        );
        for (let feature = 0; feature < 5; feature++) {
          const point = toScreen(
            start[0] - feature * 4.2,
            start[1] + (feature - 2) * 2.3
          );
          this.point(point[0], point[1], .72 * this.dpr, .12 + feature * .025, .72);
        }
      }

      // Weighted connections form the feed-forward inference path.
      for (let layer = 0; layer < layerSpecs.length - 1; layer++) {
        const sourceSpec = layerSpecs[layer];
        const targetSpec = layerSpecs[layer + 1];
        for (let target = 0; target < targetSpec.count; target++) {
          for (let branch = 0; branch < 3; branch++) {
            const source = Math.floor(
              hash((layer + 1) * 911 + target * 37 + branch * 101) * sourceSpec.count
            );
            const from = nodePosition(layer, source);
            const to = nodePosition(layer + 1, target);
            const weight = .24 + hash(layer * 73 + target * 19 + branch * 29) * .76;
            const focus = Math.max(layerFocus(layer), layerFocus(layer + 1));
            this.line(
              [toScreen(...from), toScreen(...to)],
              .025 + weight * .055 + focus * weight * .12,
              .34 + weight * .28,
              weight * .22
            );

            if ((target + branch) % 3 === 0) {
              const u = (phase * (.12 + weight * .035) + hash(target * 61 + branch * 17 + layer)) % 1;
              const pulse = [
                mix(from[0], to[0], u),
                mix(from[1], to[1], u)
              ];
              const screenPulse = toScreen(...pulse);
              const envelope = Math.sin(u * Math.PI);
              this.point(
                screenPulse[0],
                screenPulse[1],
                (.7 + envelope * 1.15) * this.dpr,
                .12 + envelope * (.28 + focus * .46),
                .98,
                .55 + weight * .35
              );
            }
          }
        }
      }

      // Three attention heads continually reweight relationships within the latent field.
      [1, 2, 3].forEach((layer, headIndex) => {
        const spec = layerSpecs[layer];
        const headPhase = (phase * .09 + headIndex * .31) % 1;
        const headCenter = Math.round(headPhase * (spec.count - 1));
        for (let offset = -2; offset <= 2; offset++) {
          const startIndex = (headCenter + offset + spec.count) % spec.count;
          const endIndex = (startIndex * (headIndex + 2) + 3 + headIndex) % spec.count;
          const start = nodePosition(layer, startIndex);
          const end = nodePosition(layer, endIndex);
          const control = [
            spec.x + (headIndex - 1) * 13,
            (start[1] + end[1]) * .5 + (offset % 2 ? 28 : -28)
          ];
          const path = [];
          for (let step = 0; step <= 28; step++) {
            path.push(toScreen(...quadratic(start, control, end, step / 28)));
          }
          const emphasis = offset === 0 ? 1 : .36;
          this.line(path, .035 + emphasis * .11, .38 + emphasis * .22, .38 + headIndex * .12);
          if (offset === 0) {
            const u = (phase * .2 + headIndex * .23) % 1;
            const marker = toScreen(...quadratic(start, control, end, u));
            this.point(marker[0], marker[1], 1.45 * this.dpr, .66, .98, .8);
          }
        }
      });

      // Latent layers are rendered as stable tensor planes with changing activations.
      layerSpecs.forEach((spec, layer) => {
        const focus = layerFocus(layer);
        const frame = [
          toScreen(spec.x - 15, -spec.spread * .57),
          toScreen(spec.x + 15, -spec.spread * .5),
          toScreen(spec.x + 15, spec.spread * .5),
          toScreen(spec.x - 15, spec.spread * .57),
          toScreen(spec.x - 15, -spec.spread * .57)
        ];
        this.line(frame, .055 + focus * .18, .5 + focus * .35, .18 + focus * .5);

        for (let node = 0; node < spec.count; node++) {
          const position = nodePosition(layer, node);
          const activation = clamp(
            .5 + .5 * Math.sin(phase * .62 - layer * 1.27 + node * .73)
          );
          const selected = Math.pow(activation, 5);
          const screen = toScreen(...position);

          for (let dimension = -2; dimension <= 2; dimension++) {
            const featurePoint = toScreen(
              position[0] + dimension * 3.2,
              position[1] + Math.sin(dimension * 1.7 + node) * 2
            );
            const light = this.shimmer(node * 13 + dimension + layer * 200, t, 7);
            this.point(
              featurePoint[0],
              featurePoint[1],
              (.42 + light * .42 + selected * .35) * this.dpr,
              .08 + light * .12 + selected * (.25 + focus * .25),
              light,
              focus * .52
            );
          }

          this.point(
            screen[0],
            screen[1],
            (.9 + selected * 1.45 + focus * .45) * this.dpr,
            .18 + selected * .5 + focus * .18,
            .98,
            .42 + focus * .42
          );
        }
      });

      // The final representation resolves into a changing confidence distribution.
      const outputAnchor = [222, 0];
      const outputNodes = [-70, -35, 0, 35, 70];
      const dominant = Math.floor((phase * .045) % outputNodes.length);
      outputNodes.forEach((y, index) => {
        const sourceIndex = Math.round(index / (outputNodes.length - 1) * (layerSpecs[4].count - 1));
        const source = nodePosition(4, sourceIndex);
        const confidence = index === dominant
          ? .76 + Math.sin(phase * .28) * .08
          : .08 + hash(index * 31 + dominant * 7) * .12;
        const end = [outputAnchor[0] - confidence * 24, y];
        const path = [toScreen(...source), toScreen(...end)];
        this.line(path, .04 + confidence * .34, .48 + confidence * .7, confidence);
        const barStart = toScreen(outputAnchor[0] - 3, y);
        const barEnd = toScreen(outputAnchor[0] - 3 - confidence * 48, y);
        this.line([barStart, barEnd], .12 + confidence * .68, 1.1 + confidence * 1.6, confidence);
        const endpoint = toScreen(...end);
        this.point(
          endpoint[0],
          endpoint[1],
          (1 + confidence * 1.8) * this.dpr,
          .22 + confidence * .68,
          .98,
          confidence
        );
      });

      const decision = toScreen(outputAnchor[0] - 3 - (.76 + Math.sin(phase * .28) * .08) * 48, outputNodes[dominant]);
      for (let ring = 0; ring < 3; ring++) {
        const radius = (7 + ring * 8 + (phase % 1) * 3) * scale;
        const path = [];
        for (let step = 0; step <= 42; step++) {
          const angle = step / 42 * TAU;
          path.push([
            decision[0] + Math.cos(angle) * radius,
            decision[1] + Math.sin(angle) * radius
          ]);
        }
        this.line(path, .23 - ring * .055, .48, .9);
      }
    }

    manufacturing(t) {
      const count = this.mobile ? 6200 : 16500;
      const span = Math.min(this.width, this.height);
      const phase = t * .7;
      const viewScale = span / 520;
      const cameraYaw = -.24;
      const cameraPitch = .1;
      const cosCameraYaw = Math.cos(cameraYaw);
      const sinCameraYaw = Math.sin(cameraYaw);
      const cosCameraPitch = Math.cos(cameraPitch);
      const sinCameraPitch = Math.sin(cameraPitch);
      const normalize = vector => {
        const length = Math.max(.0001, Math.hypot(vector[0], vector[1], vector[2]));
        return vector.map(value => value / length);
      };
      const cross = (a, b) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ];
      const pathAt = angle => {
        const radius = 184;
        return [
          Math.cos(angle) * radius,
          Math.sin(angle * 2 - .35) * 25 + Math.sin(angle + .45) * 9,
          Math.sin(angle) * radius
        ];
      };
      const tangentAt = angle => {
        const radius = 184;
        return [
          -Math.sin(angle) * radius,
          Math.cos(angle * 2 - .35) * 50 + Math.cos(angle + .45) * 9,
          Math.cos(angle) * radius
        ];
      };
      const frameAt = angle => {
        const center = pathAt(angle);
        const forward = normalize(tangentAt(angle));
        const unbankedRight = normalize(cross(forward, [0, 1, 0]));
        const unbankedUp = normalize(cross(unbankedRight, forward));
        const bank = -(.46 + .085 * (.5 + .5 * Math.sin(angle * 2 - .4)));
        const cosBank = Math.cos(bank);
        const sinBank = Math.sin(bank);
        const right = [
          unbankedRight[0] * cosBank + unbankedUp[0] * sinBank,
          unbankedRight[1] * cosBank + unbankedUp[1] * sinBank,
          unbankedRight[2] * cosBank + unbankedUp[2] * sinBank
        ];
        const up = [
          unbankedUp[0] * cosBank - unbankedRight[0] * sinBank,
          unbankedUp[1] * cosBank - unbankedRight[1] * sinBank,
          unbankedUp[2] * cosBank - unbankedRight[2] * sinBank
        ];
        return { center, forward, right, up };
      };
      const projectWorld = (x, y, z) => {
        const rotatedX = x * cosCameraYaw + z * sinCameraYaw;
        const rotatedZ = -x * sinCameraYaw + z * cosCameraYaw;
        const pitchedY = y * cosCameraPitch - rotatedZ * sinCameraPitch;
        const depth = y * sinCameraPitch + rotatedZ * cosCameraPitch;
        const perspective = 650 / (720 - depth);
        return [
          this.width * .5 + rotatedX * viewScale * perspective,
          this.height * .51 - pitchedY * viewScale * perspective,
          depth
        ];
      };
      const localToWorld = (frame, x, y, z, localScale = 1) => [
        frame.center[0] + (
          frame.forward[0] * x +
          frame.right[0] * y +
          frame.up[0] * z
        ) * localScale,
        frame.center[1] + (
          frame.forward[1] * x +
          frame.right[1] * y +
          frame.up[1] * z
        ) * localScale,
        frame.center[2] + (
          frame.forward[2] * x +
          frame.right[2] * y +
          frame.up[2] * z
        ) * localScale
      ];
      const flightFrame = frameAt(phase);
      const nearFactor = .5 + .5 * Math.sin(phase - cameraYaw);
      const aircraftScale = .39 + nearFactor * .055;
      const flightProject = (x, y, z) => {
        const world = localToWorld(flightFrame, x, y, z, aircraftScale);
        return projectWorld(...world);
      };

      const orbitPath = [];
      for (let step = 0; step <= 180; step++) {
        const angle = step / 180 * TAU;
        orbitPath.push(projectWorld(...pathAt(angle)));
      }
      this.line(orbitPath, .024, .3);

      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        const side = sideIndex ? 1 : -1;
        for (let trail = 1; trail <= 72; trail++) {
          const angle = phase - trail * .0145;
          const trailFrame = frameAt(angle);
          const trailScale = .39 + (.5 + .5 * Math.sin(angle - cameraYaw)) * .055;
          const world = localToWorld(trailFrame, -72, side * 142, -2, trailScale);
          const point = projectWorld(...world);
          const fade = (1 - trail / 73) ** 2;
          this.point(
            point[0],
            point[1],
            (.34 + fade * .66) * this.dpr,
            fade * .17,
            fade,
            .4
          );
          if (trail % 3 === 0 && trail < 63) {
            const nextAngle = phase - (trail + 1) * .0145;
            const nextFrame = frameAt(nextAngle);
            const nextScale = .39 + (.5 + .5 * Math.sin(nextAngle - cameraYaw)) * .055;
            const nextWorld = localToWorld(nextFrame, -72, side * 142, -2, nextScale);
            this.line([point, projectWorld(...nextWorld)], fade * .045, .35, .35);
          }
        }
      }

      for (let i = count; i > 0; i--) {
        const selector = hash(i * 11.73);
        let x;
        let y;
        let z;

        if (selector < .46) {
          const u = hash(i * 7.19 + 4);
          const angle = hash(i * 13.07 + 9) * TAU;
          x = -205 + u * 410;
          const radius = 5 + 25 * Math.pow(Math.sin(u * Math.PI), .58);
          y = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
        } else if (selector < .83) {
          const sign = hash(i * 3.41 + 2) > .5 ? 1 : -1;
          const spanU = Math.pow(hash(i * 5.87 + 5), .8);
          const chordU = hash(i * 17.31 + 1);
          y = sign * spanU * 198;
          const sweep = -20 - spanU * 70;
          const chord = 120 * (1 - spanU * .76);
          x = sweep + (chordU - .4) * chord;
          z = -3 + Math.sin(chordU * Math.PI) * 13 * (1 - spanU);
        } else if (selector < .96) {
          const sign = hash(i * 3.41 + 2) > .5 ? 1 : -1;
          const spanU = hash(i * 5.87 + 5);
          const chordU = hash(i * 17.31 + 1);
          y = sign * spanU * 96;
          const sweep = -148 - spanU * 24;
          const chord = 56 * (1 - spanU * .72);
          x = sweep + (chordU - .38) * chord;
          z = 10 + Math.sin(chordU * Math.PI) * 7 * (1 - spanU);
        } else {
          const height = Math.sqrt(hash(i * 5.1 + 3));
          const chordU = hash(i * 17.9 + 8);
          x = -145 - height * 36 + (chordU - .5) * 42 * (1 - height * .6);
          y = (hash(i * 9.2) - .5) * 5;
          z = 12 + height * 74;
        }

        const p = flightProject(x, y, z);
        const flow = .5 + .5 * Math.sin((x + y * .18) * .045 - t * 7 + i * .009);
        const depth = clamp((p[2] + 220) / 440);
        this.point(
          p[0],
          p[1],
          (.4 + flow * .62) * this.dpr,
          .07 + flow * .3 + depth * .08,
          flow,
          flow > .94 ? .75 : 0
        );
      }

      for (let section = 0; section < 34; section++) {
        const u = section / 33;
        const x = -202 + u * 404;
        const radius = 5 + 25 * Math.pow(Math.sin(u * Math.PI), .58);
        const ring = [];
        for (let step = 0; step <= 28; step++) {
          const angle = step / 28 * TAU;
          ring.push(flightProject(
            x,
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
          ));
        }
        this.line(ring, section % 5 === 0 ? .16 : .035, .4);
      }
    }

    supply(t) {
      const count = this.mobile ? 5000 : 13000;
      const scale = Math.min(this.width, this.height) / 520;
      const routes = [
        [[-250, -140], [-130, -142], [-72, -25], [238, -92]],
        [[-250, -66], [-122, -54], [-58, -5], [238, -36]],
        [[-250, 4], [-105, -18], [18, 20], [238, 14]],
        [[-250, 76], [-105, 85], [32, 42], [238, 70]],
        [[-250, 145], [-90, 132], [72, 88], [238, 126]]
      ];
      const bezier = (route, u) => {
        const omt = 1 - u;
        return [
          omt ** 3 * route[0][0] + 3 * omt ** 2 * u * route[1][0] +
            3 * omt * u ** 2 * route[2][0] + u ** 3 * route[3][0],
          omt ** 3 * route[0][1] + 3 * omt ** 2 * u * route[1][1] +
            3 * omt * u ** 2 * route[2][1] + u ** 3 * route[3][1]
        ];
      };

      routes.forEach((route, routeIndex) => {
        const path = [];
        for (let step = 0; step <= 100; step++) {
          const point = bezier(route, step / 100);
          path.push([
            this.width * .5 + point[0] * scale,
            this.height * .5 + point[1] * scale
          ]);
        }
        this.line(path, routeIndex === 2 ? .27 : .09, routeIndex === 2 ? .82 : .42);
      });

      for (let i = count; i > 0; i--) {
        const routeIndex = Math.floor(hash(i * 3.17) * routes.length);
        const speed = .12 + hash(i * 11.4) * .05;
        const u = (hash(i * 7.91 + 4) + t * speed) % 1;
        const point = bezier(routes[routeIndex], u);
        const spread = (hash(i * 17.3 + 8) - .5) * (16 + 42 * Math.sin(u * Math.PI));
        const x = this.width * .5 + point[0] * scale;
        const y = this.height * .5 + (point[1] + spread) * scale;
        const light = this.shimmer(i, t, 10);
        const fade = Math.sin(u * Math.PI) ** .35;
        this.point(
          x,
          y,
          (.4 + light * .62) * this.dpr,
          fade * (.07 + light * .37),
          light,
          routeIndex === 2 ? .55 : 0
        );
      }

      [-72, -4, 74].forEach((nodeX, nodeIndex) => {
        for (let i = 0; i < (this.mobile ? 110 : 190); i++) {
          const angle = hash(i * 8.3 + nodeIndex) * TAU + t * (nodeIndex % 2 ? -.16 : .13);
          const radius = 7 + Math.sqrt(hash(i * 4.1 + 5)) * (28 + nodeIndex * 3);
          const light = this.shimmer(i + nodeIndex * 200, t, 7);
          this.point(
            this.width * .5 + (nodeX + Math.cos(angle) * radius) * scale,
            this.height * .5 + (Math.sin(angle) * radius * .68) * scale,
            (.42 + light * .5) * this.dpr,
            .08 + light * .26,
            light
          );
        }
      });
    }

    energy(t) {
      const scale = Math.min(this.width, this.height) / 520;
      const toScreen = (x, y) => [
        this.width * .5 + x * scale,
        this.height * .5 + y * scale
      ];
      const sun = [142, -145];
      const sunRadius = 52;
      const sunPath = [];
      for (let step = 0; step <= 100; step++) {
        const angle = step / 100 * TAU;
        sunPath.push(toScreen(
          sun[0] + Math.cos(angle) * sunRadius,
          sun[1] + Math.sin(angle) * sunRadius
        ));
      }
      this.line(sunPath, .12, .52, .9);
      const sunCount = this.mobile ? 500 : 900;
      for (let i = sunCount; i > 0; i--) {
        const angle = hash(i * 5.1) * TAU;
        const radius = Math.sqrt(hash(i * 9.7 + 3)) * sunRadius;
        const light = this.shimmer(i, t, 4);
        const point = toScreen(
          sun[0] + Math.cos(angle) * radius,
          sun[1] + Math.sin(angle) * radius
        );
        this.point(
          point[0],
          point[1],
          (.38 + light * .48) * this.dpr,
          .018 + light * .085,
          light,
          .95
        );
      }

      const windY = (x, lane, seed = 0) =>
        -158 + lane * 34 +
        Math.sin(x * .018 + lane * .74 - t * 1.8 + seed) * 8;
      for (let lane = 0; lane < 7; lane++) {
        const path = [];
        for (let step = 0; step <= 100; step++) {
          const x = -270 + step / 100 * 540;
          path.push(toScreen(x, windY(x, lane)));
        }
        this.line(path, lane % 3 === 0 ? .075 : .025, lane % 3 === 0 ? .42 : .25);
      }

      const windCount = this.mobile ? 1000 : 1800;
      for (let i = windCount; i > 0; i--) {
        const lane = Math.floor(hash(i * 3.17) * 7);
        const speed = .085 + hash(i * 11.4) * .045;
        const u = (hash(i * 7.91 + 4) + t * speed) % 1;
        const x = -270 + u * 540;
        const y = windY(x, lane, i * .013) +
          (hash(i * 17.3 + 8) - .5) * 12;
        const point = toScreen(x, y);
        const light = this.shimmer(i, t, 10);
        const fade = Math.sin(u * Math.PI) ** .4;
        this.point(
          point[0],
          point[1],
          (.38 + light * .55) * this.dpr,
          fade * (.025 + light * .16),
          light,
          lane % 3 === 0 ? .28 : 0
        );
      }

      const waterY = x => 184 + Math.sin(x * .019 + .6) * 9 +
        Math.sin(x * .041 - t * .55) * 3;
      [-5, 0, 5].forEach((offset, index) => {
        const path = [];
        for (let step = 0; step <= 110; step++) {
          const x = -270 + step / 110 * 540;
          path.push(toScreen(x, waterY(x) + offset));
        }
        this.line(path, index === 1 ? .24 : .065, index === 1 ? .75 : .4);
      });
      const waterCount = this.mobile ? 750 : 1350;
      for (let i = waterCount; i > 0; i--) {
        const speed = .06 + hash(i * 7.4) * .04;
        const u = (hash(i * 3.8 + 1) + t * speed) % 1;
        const x = -270 + u * 540;
        const point = toScreen(
          x,
          waterY(x) + (hash(i * 12.7 + 5) - .5) * 12
        );
        const light = this.shimmer(i + 7000, t, 7);
        const fade = Math.sin(u * Math.PI) ** .34;
        this.point(
          point[0],
          point[1],
          (.42 + light * .65) * this.dpr,
          fade * (.09 + light * .33),
          light,
          0
        );
      }

      const roots = [];
      const growRoot = (x, y, length, angle, depth, id) => {
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        roots.push({ x, y, endX, endY, depth, id });
        if (depth <= 0) return;
        const spread = .28 + hash(id * 7.3) * .22;
        const nextLength = length * (.62 + hash(id * 3.9) * .08);
        growRoot(endX, endY, nextLength, angle - spread, depth - 1, id * 2 + 1);
        growRoot(endX, endY, nextLength * .94, angle + spread, depth - 1, id * 2 + 2);
      };
      growRoot(8, 105, 51, .78, 4, 5);
      growRoot(8, 105, 58, 1.52, 4, 9);
      growRoot(8, 105, 53, 2.34, 4, 13);

      roots.forEach((root) => {
        const start = toScreen(root.x, root.y);
        const end = toScreen(root.endX, root.endY);
        this.line([start, end], .055 + root.depth * .022, .35 + root.depth * .12, .72);
        const particleCount = this.mobile ? 9 : 16;
        for (let i = particleCount; i > 0; i--) {
          const u = hash(i * 5.8 + root.id * 2.1);
          const jitter = (hash(i * 9.4 + root.id) - .5) * (2 + root.depth);
          const dx = root.endX - root.x;
          const dy = root.endY - root.y;
          const length = Math.max(.001, Math.hypot(dx, dy));
          const point = toScreen(
            root.x + dx * u - dy / length * jitter,
            root.y + dy * u + dx / length * jitter
          );
          const light = this.shimmer(i + root.id * 19, t, 5);
          this.point(
            point[0],
            point[1],
            (.38 + light * .52) * this.dpr,
            .035 + light * .17,
            light,
            .72
          );
        }
        if (hash(root.id * 1.7) > .5) {
          const progress = (hash(root.id * 4.3) + t * .11) % 1;
          const point = toScreen(
            root.endX + (root.x - root.endX) * progress,
            root.endY + (root.y - root.endY) * progress
          );
          this.point(point[0], point[1], 1.45 * this.dpr, .58, .92, .78);
        }
      });

      const branches = [];
      const leaves = [];
      const growBranch = (x, y, length, angle, depth, id) => {
        const elevation = clamp((105 - y) / 280);
        const sway = Math.sin(t * 1.3 + id * .21) * elevation * 4.2;
        const endX = x + Math.cos(angle) * length + sway;
        const endY = y + Math.sin(angle) * length;
        branches.push({ x, y, endX, endY, angle, depth, id });
        if (depth <= 0) {
          leaves.push({ x: endX, y: endY, angle, id });
          return;
        }
        const spread = .34 + hash(id * 4.9) * .21;
        const lean = (hash(id * 7.1) - .5) * .14;
        const nextLength = length * (.68 + hash(id * 2.7) * .055);
        growBranch(endX, endY, nextLength, angle - spread + lean, depth - 1, id * 2 + 1);
        growBranch(endX, endY, nextLength * .96, angle + spread + lean, depth - 1, id * 2 + 2);
        if (depth === 4 && hash(id * 11.2) > .48) {
          growBranch(endX, endY, nextLength * .72, angle + lean * .35, depth - 2, id * 3 + 7);
        }
      };
      growBranch(8, 108, 86, -Math.PI * .5, 6, 3);

      branches.forEach((branch) => {
        const start = toScreen(branch.x, branch.y);
        const end = toScreen(branch.endX, branch.endY);
        this.line(
          [start, end],
          .075 + branch.depth * .026,
          .32 + branch.depth * .17,
          .68
        );
        const particleCount = this.mobile ? 8 + branch.depth * 2 : 13 + branch.depth * 3;
        for (let i = particleCount; i > 0; i--) {
          const u = hash(i * 5.13 + branch.id * 3.7);
          const dx = branch.endX - branch.x;
          const dy = branch.endY - branch.y;
          const length = Math.max(.001, Math.hypot(dx, dy));
          const jitter = (hash(i * 11.7 + branch.id) - .5) * (2.2 + branch.depth * .35);
          const point = toScreen(
            branch.x + dx * u - dy / length * jitter,
            branch.y + dy * u + dx / length * jitter
          );
          const light = this.shimmer(i + branch.id * 29, t, 6);
          this.point(
            point[0],
            point[1],
            (.4 + light * .58) * this.dpr,
            .045 + light * (.15 + branch.depth * .018),
            light,
            .68
          );
        }
        if (hash(branch.id * 2.4) > .66) {
          const progress = (hash(branch.id * 3.8) + t * .13) % 1;
          const point = toScreen(
            branch.x + (branch.endX - branch.x) * progress,
            branch.y + (branch.endY - branch.y) * progress
          );
          this.point(point[0], point[1], 1.55 * this.dpr, .64, .96, .82);
        }
      });

      leaves.forEach((leaf, leafIndex) => {
        const particleCount = this.mobile ? 22 : 38;
        const longX = Math.cos(leaf.angle);
        const longY = Math.sin(leaf.angle);
        const shortX = -longY;
        const shortY = longX;
        for (let i = particleCount; i > 0; i--) {
          const longitudinal = (hash(i * 5.8 + leaf.id) - .5) * 28;
          const envelope = Math.sin(clamp((longitudinal / 28 + .5)) * Math.PI);
          const lateral = (hash(i * 13.4 + leafIndex) - .5) * 12 * envelope;
          const point = toScreen(
            leaf.x + longX * longitudinal + shortX * lateral,
            leaf.y + longY * longitudinal + shortY * lateral
          );
          const light = this.shimmer(i + leafIndex * 41, t, 5.5);
          this.point(
            point[0],
            point[1],
            (.4 + light * .62) * this.dpr,
            .045 + light * .24,
            light,
            .86
          );
        }
      });

      const groundPath = [];
      for (let step = 0; step <= 100; step++) {
        const x = -230 + step / 100 * 460;
        groundPath.push(toScreen(x, 109 + Math.sin(x * .018) * 4));
      }
      this.line(groundPath, .12, .48, .78);
    }

    industrial(t) {
      const scale = Math.min(this.width, this.height) / 520;
      const toScreen = (x, y) => [
        this.width * .5 + x * scale,
        this.height * .5 + y * scale
      ];
      const shoulder = [-132, 64];
      const linkA = 145;
      const linkB = 138;
      const phase = t * .92;
      const target = [
        56 + Math.cos(phase) * 55,
        -24 + Math.sin(phase) * 45
      ];
      const dx = target[0] - shoulder[0];
      const dy = target[1] - shoulder[1];
      const distanceSquared = dx * dx + dy * dy;
      const elbowCos = clamp(
        (distanceSquared - linkA * linkA - linkB * linkB) / (2 * linkA * linkB),
        -1,
        1
      );
      const elbowAngle = Math.acos(elbowCos);
      const shoulderAngle = Math.atan2(dy, dx) -
        Math.atan2(linkB * Math.sin(elbowAngle), linkA + linkB * elbowCos);
      const elbow = [
        shoulder[0] + Math.cos(shoulderAngle) * linkA,
        shoulder[1] + Math.sin(shoulderAngle) * linkA
      ];
      const wrist = target;

      const trajectory = [];
      for (let step = 0; step <= 120; step++) {
        const angle = step / 120 * TAU;
        trajectory.push(toScreen(
          56 + Math.cos(angle) * 55,
          -24 + Math.sin(angle) * 45
        ));
      }
      this.line(trajectory, .11, .42);
      for (let trail = 1; trail <= 30; trail++) {
        const angle = phase - trail * .045;
        const fade = (1 - trail / 31) ** 2;
        const point = toScreen(
          56 + Math.cos(angle) * 55,
          -24 + Math.sin(angle) * 45
        );
        this.point(point[0], point[1], (.42 + fade * .65) * this.dpr, fade * .28, fade, .55);
      }

      const baseCount = this.mobile ? 760 : 2100;
      for (let i = baseCount; i > 0; i--) {
        const u = hash(i * 5.1);
        const v = hash(i * 11.3 + 4);
        const taper = 1 - u * .28;
        const x = -178 + v * 94 * taper + u * 10;
        const y = 102 + u * 86;
        const point = toScreen(x, y);
        const light = this.shimmer(i, t, 6);
        const edge = Math.min(v, 1 - v, u, 1 - u) < .06;
        this.point(
          point[0],
          point[1],
          (.42 + light * .48 + (edge ? .2 : 0)) * this.dpr,
          .075 + light * .22 + (edge ? .18 : 0),
          light,
          edge ? .3 : 0
        );
      }

      const drawLink = (start, end, width, count, seed) => {
        const vx = end[0] - start[0];
        const vy = end[1] - start[1];
        const length = Math.max(.001, Math.hypot(vx, vy));
        const nx = -vy / length;
        const ny = vx / length;
        for (let i = count; i > 0; i--) {
          const u = hash(i * 7.13 + seed);
          const across = hash(i * 13.4 + seed * 2.1) * 2 - 1;
          const taper = .82 + .18 * Math.sin(u * Math.PI);
          const x = start[0] + vx * u + nx * across * width * taper;
          const y = start[1] + vy * u + ny * across * width * taper;
          const point = toScreen(x, y);
          const light = this.shimmer(i + seed * 100, t, 8);
          const edge = Math.pow(Math.abs(across), 7);
          this.point(
            point[0],
            point[1],
            (.42 + light * .52 + edge * .18) * this.dpr,
            .07 + light * .27 + edge * .19,
            light,
            edge * .38
          );
        }

        const outline = [
          toScreen(start[0] + nx * width, start[1] + ny * width),
          toScreen(end[0] + nx * width * .82, end[1] + ny * width * .82),
          toScreen(end[0] - nx * width * .82, end[1] - ny * width * .82),
          toScreen(start[0] - nx * width, start[1] - ny * width),
          toScreen(start[0] + nx * width, start[1] + ny * width)
        ];
        this.line(outline, .16, .48);
      };

      drawLink(shoulder, elbow, 24, this.mobile ? 1450 : 3900, 17);
      drawLink(elbow, wrist, 19, this.mobile ? 1300 : 3500, 31);

      [shoulder, elbow, wrist].forEach((joint, jointIndex) => {
        const radius = jointIndex === 0 ? 25 : jointIndex === 1 ? 21 : 14;
        const jointCount = this.mobile ? 150 : 380;
        for (let i = jointCount; i > 0; i--) {
          const angle = hash(i * 7.7 + jointIndex * 4) * TAU;
          const radial = Math.sqrt(hash(i * 3.2 + 8)) * radius;
          const point = toScreen(
            joint[0] + Math.cos(angle) * radial,
            joint[1] + Math.sin(angle) * radial
          );
          const light = this.shimmer(i + jointIndex * 400, t, 7);
          const edge = radial / radius > .82;
          this.point(
            point[0],
            point[1],
            (.46 + light * .55 + (edge ? .18 : 0)) * this.dpr,
            .1 + light * .31 + (edge ? .16 : 0),
            light,
            edge ? .42 : 0
          );
        }
      });

      const toolAngle = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
      const tx = Math.cos(toolAngle);
      const ty = Math.sin(toolAngle);
      const nx = -ty;
      const ny = tx;
      const toolBase = [wrist[0] + tx * 8, wrist[1] + ty * 8];
      const toolTip = [wrist[0] + tx * 42, wrist[1] + ty * 42];
      this.line([toScreen(...toolBase), toScreen(...toolTip)], .48, .95, .7);
      this.line([
        toScreen(toolTip[0] + nx * 11, toolTip[1] + ny * 11),
        toScreen(toolTip[0] + tx * 17 + nx * 15, toolTip[1] + ty * 17 + ny * 15)
      ], .4, .82, .7);
      this.line([
        toScreen(toolTip[0] - nx * 11, toolTip[1] - ny * 11),
        toScreen(toolTip[0] + tx * 17 - nx * 15, toolTip[1] + ty * 17 - ny * 15)
      ], .4, .82, .7);

      for (let pulse = 0; pulse < 18; pulse++) {
        const progress = (pulse / 18 + t * .18) % 1;
        let x;
        let y;
        if (progress < .52) {
          const u = progress / .52;
          x = shoulder[0] + (elbow[0] - shoulder[0]) * u;
          y = shoulder[1] + (elbow[1] - shoulder[1]) * u;
        } else {
          const u = (progress - .52) / .48;
          x = elbow[0] + (wrist[0] - elbow[0]) * u;
          y = elbow[1] + (wrist[1] - elbow[1]) * u;
        }
        const point = toScreen(x, y);
        this.point(point[0], point[1], (pulse % 6 === 0 ? 1.7 : .82) * this.dpr, pulse % 6 === 0 ? .72 : .34, .9, .75);
      }
    }

    smallBusiness(t) {
      const scale = Math.min(this.width, this.height) / 520;
      const toScreen = (x, y) => [
        this.width * .5 + x * scale,
        this.height * .5 + y * scale
      ];
      const bob = Math.sin(t * 7.2) * 5;
      const roll = Math.sin(t * 5.1) * .025;
      const boatPoint = (x, y) => {
        const cos = Math.cos(roll);
        const sin = Math.sin(roll);
        return toScreen(x * cos - y * sin, y * cos + x * sin + bob);
      };

      // A working-water horizon gives the scene a grounded, local-business feel.
      for (let band = 0; band < 8; band++) {
        const wave = [];
        const baseY = 92 + band * 18;
        for (let step = 0; step <= 52; step++) {
          const x = -258 + step * 10;
          const y = baseY + Math.sin(step * .48 + t * (5.8 - band * .24) + band) * (4 + band * .7);
          wave.push(toScreen(x, y));
        }
        this.line(wave, .2 - band * .012, .62, band < 3 ? .55 : 0);
      }

      // Hull, deck, wheelhouse, and working mast.
      const hull = [
        [-142, 35], [137, 35], [111, 91], [72, 112],
        [-77, 112], [-119, 88], [-142, 35]
      ].map(([x, y]) => boatPoint(x, y));
      this.line(hull, .56, 1.18, .72);
      this.line([boatPoint(-122, 57), boatPoint(115, 57)], .22, .62, .5);
      this.line([boatPoint(-88, 34), boatPoint(-72, -35), boatPoint(28, -35), boatPoint(50, 34)], .48, .96, .52);
      this.line([boatPoint(-57, -35), boatPoint(-48, -76), boatPoint(12, -76), boatPoint(28, -35)], .42, .88, .56);
      this.line([boatPoint(-41, -67), boatPoint(-14, -67), boatPoint(-14, -44), boatPoint(-46, -44), boatPoint(-41, -67)], .23, .58);
      this.line([boatPoint(-5, -67), boatPoint(10, -67), boatPoint(22, -44), boatPoint(-5, -44), boatPoint(-5, -67)], .23, .58);
      this.line([boatPoint(-19, -77), boatPoint(-19, -161)], .48, .94, .7);
      this.line([boatPoint(-19, -145), boatPoint(75, -37)], .32, .7, .62);
      this.line([boatPoint(-19, -126), boatPoint(-83, -35)], .25, .64, .45);
      this.line([boatPoint(-37, -150), boatPoint(-1, -150)], .32, .7, .7);

      const boatCount = this.mobile ? 1900 : 3900;
      for (let i = boatCount; i > 0; i--) {
        const u = hash(i * 5.31);
        const v = hash(i * 9.77 + 3);
        let x;
        let y;
        let edge = false;
        if (i % 3) {
          x = -132 + u * 252;
          const hullTop = 38 + Math.abs(x) * .025;
          const hullBottom = 108 - Math.max(0, Math.abs(x) - 72) * .22;
          y = hullTop + v * Math.max(4, hullBottom - hullTop);
          edge = v < .035 || v > .965;
        } else {
          x = -76 + u * 118;
          y = -72 + v * 104;
          edge = u < .045 || u > .955 || v < .045 || v > .955;
        }
        const point = boatPoint(x, y);
        const light = this.shimmer(i + 18000, t, 6.5);
        this.point(point[0], point[1], (.4 + light * .62 + (edge ? .16 : 0)) * this.dpr, .055 + light * .23 + (edge ? .18 : 0), light, .68);
      }

      // A trawl line and opening net turn daily work into an operating-system metaphor.
      const netPulse = .5 + .5 * Math.sin(t * 2.8);
      const towStart = boatPoint(118, 27);
      const towEnd = toScreen(176, 72 + bob * .35);
      this.line([towStart, towEnd], .42, .9, .62);
      const netMouthTop = [176, 57 + bob * .35];
      const netMouthBottom = [176, 101 + bob * .35];
      const netTip = [248 + netPulse * 9, 82 + Math.sin(t * 3.5) * 4];
      this.line([toScreen(...netMouthTop), toScreen(...netTip), toScreen(...netMouthBottom), toScreen(...netMouthTop)], .48, .92, .7);
      for (let strand = 1; strand < 6; strand++) {
        const v = strand / 6;
        const startY = netMouthTop[1] + (netMouthBottom[1] - netMouthTop[1]) * v;
        this.line([toScreen(netMouthTop[0], startY), toScreen(netTip[0], netTip[1])], .14, .48, .48);
      }
      for (let cross = 1; cross < 5; cross++) {
        const u = cross / 5;
        const top = [netMouthTop[0] + (netTip[0] - netMouthTop[0]) * u, netMouthTop[1] + (netTip[1] - netMouthTop[1]) * u];
        const bottom = [netMouthBottom[0] + (netTip[0] - netMouthBottom[0]) * u, netMouthBottom[1] + (netTip[1] - netMouthBottom[1]) * u];
        this.line([toScreen(...top), toScreen(...bottom)], .12, .46, .42);
      }

      // Signals move from the work into the boat: customers, cash, capacity, and decisions.
      for (let signal = 0; signal < 24; signal++) {
        const progress = (signal / 24 + t * .13) % 1;
        const x = netTip[0] + (82 - netTip[0]) * progress;
        const y = netTip[1] + (18 - netTip[1]) * progress - Math.sin(progress * Math.PI) * 34;
        const point = toScreen(x, y);
        const major = signal % 6 === 0;
        this.point(point[0], point[1], (major ? 2.2 : .9) * this.dpr, major ? .82 : .4, .96, .82);
      }
    }

    smallBusinessDoorStudy(t) {
      const scale = Math.min(this.width, this.height) / 520;
      const toScreen = (x, y) => [
        this.width * .5 + x * scale,
        this.height * .5 + y * scale
      ];
      const cycle = (t * .18) % 1;
      const ease = value => value * value * (3 - 2 * value);
      let open = 0;
      if (cycle >= .15 && cycle < .34) open = ease((cycle - .15) / .19);
      else if (cycle >= .34 && cycle < .66) open = 1;
      else if (cycle >= .66 && cycle < .85) open = 1 - ease((cycle - .66) / .19);
      const doorAngle = open * 1.18;
      const hingeX = -102;
      const doorTop = -137;
      const doorWidth = 194;
      const doorHeight = 278;
      const doorPoint = (u, v) => {
        const depth = u * doorWidth * Math.sin(doorAngle);
        return [
          this.width * .5 + (hingeX + u * doorWidth * Math.cos(doorAngle) + depth * .31) * scale,
          this.height * .5 + (doorTop + v * doorHeight - depth * .055) * scale,
          depth
        ];
      };

      const frameLines = [
        [toScreen(-122, 158), toScreen(-122, -169), toScreen(116, -169), toScreen(116, 158)],
        [toScreen(-132, 158), toScreen(130, 158)],
        [toScreen(-112, -147), toScreen(104, -147)]
      ];
      frameLines.forEach((line, index) => this.line(line, index ? .16 : .28, index ? .58 : .86, .42));

      const frameParticles = this.mobile ? 800 : 2050;
      for (let i = frameParticles; i > 0; i--) {
        const side = Math.floor(hash(i * 3.7) * 3);
        const u = hash(i * 8.9 + 4);
        let x;
        let y;
        if (side === 0) {
          x = -122 + (hash(i * 13.7) - .5) * 13;
          y = 158 - u * 327;
        } else if (side === 1) {
          x = 116 + (hash(i * 13.7) - .5) * 13;
          y = 158 - u * 327;
        } else {
          x = -122 + u * 238;
          y = -169 + (hash(i * 13.7) - .5) * 13;
        }
        const point = toScreen(x, y);
        const light = this.shimmer(i + 4100, t, 5);
        this.point(point[0], point[1], (.4 + light * .5) * this.dpr, .045 + light * .2, light, .42);
      }

      const doorCount = this.mobile ? 1900 : 4700;
      for (let i = doorCount; i > 0; i--) {
        const u = hash(i * 5.13);
        const v = hash(i * 11.7 + 4);
        const edge = Math.min(u, 1 - u, v, 1 - v) < .035;
        const panel = (
          (v > .12 && v < .47 && u > .12 && u < .88) ||
          (v > .54 && v < .88 && u > .12 && u < .88)
        );
        const p = doorPoint(u, v);
        const light = this.shimmer(i + 6500, t, 7);
        this.point(
          p[0],
          p[1],
          (.4 + light * .56 + (edge ? .18 : 0)) * this.dpr,
          .045 + light * .18 + (edge ? .21 : 0) + (panel ? .035 : 0),
          light,
          panel ? .26 : 0
        );
      }

      const doorOutline = [
        doorPoint(0, 0),
        doorPoint(1, 0),
        doorPoint(1, 1),
        doorPoint(0, 1),
        doorPoint(0, 0)
      ];
      this.line(doorOutline, .31, .82, .35);
      [[.12, .12, .88, .12], [.88, .12, .88, .47], [.88, .47, .12, .47],
        [.12, .47, .12, .12], [.12, .54, .88, .54], [.88, .54, .88, .88],
        [.88, .88, .12, .88], [.12, .88, .12, .54]].forEach((line) => {
        this.line([doorPoint(line[0], line[1]), doorPoint(line[2], line[3])], .1, .42);
      });

      const handle = doorPoint(.83, .52);
      this.point(handle[0], handle[1], 3.1 * this.dpr, .86, 1, .9);
      for (let i = this.mobile ? 70 : 120; i > 0; i--) {
        const angle = hash(i * 7.7) * TAU;
        const radius = 2 + hash(i * 13.2) * 8;
        this.point(
          handle[0] + Math.cos(angle) * radius * this.dpr,
          handle[1] + Math.sin(angle) * radius * this.dpr,
          (.4 + hash(i * 2.7) * .5) * this.dpr,
          .12 + hash(i * 9.1) * .32,
          .9,
          .8
        );
      }

      const ringMotion = (moment, strength) => {
        const elapsed = cycle - moment;
        if (elapsed < 0) return 0;
        return strength * Math.exp(-elapsed * 15) * Math.sin(elapsed * TAU * 13);
      };
      const openingRing = ringMotion(.212, .48);
      const closingRing = ringMotion(.788, .3);
      const swing = openingRing + closingRing;
      const ringEnergy =
        (cycle >= .212 ? Math.exp(-(cycle - .212) * 15) : 0) +
        (cycle >= .788 ? .62 * Math.exp(-(cycle - .788) * 15) : 0);
      const pivot = [124, -190];
      const bellCenter = [
        pivot[0] + Math.sin(swing) * 28,
        pivot[1] + Math.cos(swing) * 28
      ];
      this.line([toScreen(98, -169), toScreen(...pivot)], .24, .62, .55);
      this.line([toScreen(...pivot), toScreen(...bellCenter)], .3, .75, .8);
      const rotateBell = (x, y) => [
        bellCenter[0] + x * Math.cos(swing) - y * Math.sin(swing),
        bellCenter[1] + x * Math.sin(swing) + y * Math.cos(swing)
      ];
      const bellShape = [
        [-11, -8], [-17, 4], [-20, 17], [-23, 20],
        [23, 20], [20, 17], [17, 4], [11, -8], [-11, -8]
      ].map(point => toScreen(...rotateBell(...point)));
      this.line(bellShape, .42, .92, .9);
      const bellCount = this.mobile ? 360 : 900;
      for (let i = bellCount; i > 0; i--) {
        const v = hash(i * 5.7);
        const width = 10 + v * 13;
        const local = rotateBell(
          (hash(i * 11.3 + 2) - .5) * width * 2,
          -7 + v * 27
        );
        const point = toScreen(...local);
        const light = this.shimmer(i + 9000, t, 8);
        this.point(point[0], point[1], (.42 + light * .64) * this.dpr, .065 + light * .28, light, .9);
      }
      const clapper = rotateBell(0, 27);
      const clapperPoint = toScreen(...clapper);
      this.point(clapperPoint[0], clapperPoint[1], 3 * this.dpr, .82, 1, .92);

      if (ringEnergy > .025) {
        for (const side of [-1, 1]) {
          for (let ring = 0; ring < 2; ring++) {
            const wave = [];
            for (let step = 0; step <= 18; step++) {
              const u = step / 18;
              const y = bellCenter[1] - 23 + u * 46;
              const x = bellCenter[0] + side *
                (31 + ring * 10 + Math.sin(u * Math.PI) * 6);
              wave.push(toScreen(x, y));
            }
            this.line(
              wave,
              Math.min(.34, ringEnergy * (.28 - ring * .08)),
              .76,
              .82
            );
          }
        }
      }
    }
  }

  document.querySelectorAll('[data-capability-art]').forEach(canvas => new CapabilityArt(canvas));
})();
