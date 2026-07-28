(() => {
  const TAU = Math.PI * 2;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fract = value => value - Math.floor(value);
  const hash = value => fract(Math.sin(value * 91.3458) * 47453.5453);

  class CapabilityArt {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.mode = canvas.dataset.capabilityArt;
      this.visible = true;
      this.last = 0;
      this.start = performance.now();
      this.resize = this.resize.bind(this);
      this.frame = this.frame.bind(this);

      new ResizeObserver(this.resize).observe(canvas);
      new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
      }, { rootMargin: '160px' }).observe(canvas);

      this.resize();
      requestAnimationFrame(this.frame);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.mobile = innerWidth < 760;
      const dpr = Math.min(devicePixelRatio || 1, this.mobile ? 2.4 : 1.85);
      this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = rect.width;
      this.h = rect.height;
      this.dpr = dpr;
    }

    frame(now) {
      const interval = reduceMotion ? 1000 : (this.mobile ? 42 : 30);
      if (this.visible && !document.hidden && now - this.last >= interval) {
        this.last = now;
        const t = reduceMotion ? 2.4 : (now - this.start) * 0.0003;
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.save();
        this.ctx.translate(this.w / 2, this.h / 2);
        const scale = Math.min(this.w, this.h) / 520;
        this.ctx.scale(scale, scale);
        this.prepare();
        this.draw(t);
        this.finish();
        this.ctx.restore();
      }
      requestAnimationFrame(this.frame);
    }

    prepare() {
      const glow = this.ctx.createRadialGradient(8, -5, 0, 8, -5, 250);
      glow.addColorStop(0, 'rgba(45,143,204,.105)');
      glow.addColorStop(.46, 'rgba(25,97,161,.055)');
      glow.addColorStop(1, 'rgba(3,27,48,0)');
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(-270, -270, 540, 540);
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }

    finish() {
      this.ctx.globalCompositeOperation = 'source-over';
      const vignette = this.ctx.createRadialGradient(0, 0, 110, 0, 0, 285);
      vignette.addColorStop(0, 'rgba(2,25,45,0)');
      vignette.addColorStop(1, 'rgba(2,25,45,.10)');
      this.ctx.fillStyle = vignette;
      this.ctx.fillRect(-270, -270, 540, 540);
    }

    color(alpha = .4, warm = 0) {
      const value = Math.min(1, alpha * 2.85 + .03);
      if (warm > .6) return `rgba(236,232,173,${value})`;
      if (warm > .15) return `rgba(181,235,223,${value})`;
      return `rgba(172,224,255,${value})`;
    }

    stroke(alpha = .3, width = .65, warm = 0) {
      this.ctx.strokeStyle = this.color(alpha, warm);
      this.ctx.lineWidth = width * 1.12;
    }

    point(x, y, size = .72, alpha = .45, warm = 0) {
      this.ctx.fillStyle = this.color(alpha, warm);
      if (size <= 1) {
        this.ctx.fillRect(x, y, size, size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, TAU);
        this.ctx.fill();
      }
    }

    line(points, alpha = .25, width = .55, warm = 0, close = false) {
      if (!points.length) return;
      this.stroke(alpha, width, warm);
      this.ctx.beginPath();
      points.forEach(([x, y], index) => {
        if (index) this.ctx.lineTo(x, y);
        else this.ctx.moveTo(x, y);
      });
      if (close) this.ctx.closePath();
      this.ctx.stroke();
    }

    curve(p0, p1, p2, p3, alpha = .2, width = .55, warm = 0) {
      this.stroke(alpha, width, warm);
      this.ctx.beginPath();
      this.ctx.moveTo(p0[0], p0[1]);
      this.ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
      this.ctx.stroke();
    }

    project(x, y, z, yaw = .5, pitch = .65) {
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const rx = x * cy - z * sy;
      const rz = x * sy + z * cy;
      return [rx, y * cp - rz * sp];
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
      const blades = 11;
      const ribbons = this.mobile ? 9 : 14;
      const steps = this.mobile ? 38 : 52;
      const rotation = t * .42;

      this.ctx.save();
      this.ctx.rotate(-.08);
      this.ctx.scale(1, .82);

      for (let blade = 0; blade < blades; blade++) {
        const base = blade / blades * TAU + rotation;
        for (let ribbon = 0; ribbon < ribbons; ribbon++) {
          const edge = ribbon / (ribbons - 1) - .5;
          const path = [];
          for (let step = 0; step <= steps; step++) {
            const u = step / steps;
            const r = 34 + 181 * u;
            const sweep = .23 + 1.04 * Math.pow(u, 1.58);
            const thickness = (18 + 25 * Math.sin(u * Math.PI)) * edge;
            const angle = base + sweep + edge * .16 * (1 - u);
            const x = Math.cos(angle) * (r + thickness);
            const y = Math.sin(angle) * (r + thickness);
            path.push([x, y]);
            if ((step + ribbon) % 4 === 0) {
              const highlight = hash(blade * 77 + ribbon * 19 + step) > .8;
              this.point(x, y, highlight ? 1.15 : .62, highlight ? .54 : .2, highlight ? .85 : .15);
            }
          }
          this.line(path, .07 + .18 * (1 - Math.abs(edge)), .42, ribbon % 5 === 0 ? .65 : 0);
        }
      }

      for (let ring = 0; ring < 9; ring++) {
        const radius = 26 + ring * 20.2;
        this.stroke(.09 + ring * .006, .45);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, radius, radius, 0, 0, TAU);
        this.ctx.stroke();
      }

      for (let i = 0; i < 120; i++) {
        const angle = i / 120 * TAU + rotation * .6;
        const radius = 17 + 15 * hash(i * 9);
        this.point(Math.cos(angle) * radius, Math.sin(angle) * radius, .75, .34, i % 11 === 0 ? .8 : 0);
      }
      this.ctx.restore();
    }

    modeling(t) {
      const rows = this.mobile ? 25 : 38;
      const columns = this.mobile ? 62 : 92;
      const surface = (x, z) => {
        const peakA = 72 * Math.exp(-((x + 55) ** 2 + (z - 12) ** 2 * 1.3) / 7600);
        const peakB = 53 * Math.exp(-((x - 105) ** 2 + (z + 35) ** 2) / 4800);
        const basin = -38 * Math.exp(-((x - 8) ** 2 + (z - 82) ** 2) / 3100);
        const wave = 13 * Math.sin(x * .033 + t * 2.2) * Math.cos(z * .045 - t);
        return peakA + peakB + basin + wave;
      };

      this.ctx.save();
      this.ctx.translate(0, 20);
      for (let row = 0; row < rows; row++) {
        const z = -185 + row / (rows - 1) * 370;
        const path = [];
        for (let column = 0; column < columns; column++) {
          const x = -228 + column / (columns - 1) * 456;
          const y = surface(x, z);
          const px = x + z * .34;
          const py = z * .44 - y;
          path.push([px, py]);
          if ((column + row) % 3 === 0) {
            const h = hash(row * 131 + column * 17);
            this.point(px, py, h > .94 ? 1.18 : .58, h > .94 ? .52 : .16, h > .94 ? .85 : .1);
          }
        }
        this.line(path, row % 5 === 0 ? .22 : .065, row % 5 === 0 ? .6 : .35);
      }

      const samples = this.mobile ? 1700 : 3200;
      for (let i = 0; i < samples; i++) {
        const x = (hash(i * 2.17) - .5) * 430;
        const z = (hash(i * 4.63 + 10) - .5) * 330;
        const y = surface(x, z) + (hash(i * 8.9) - .5) * 9;
        const px = x + z * .34;
        const py = z * .44 - y;
        const bright = hash(i * 13.7) > .978;
        this.point(px, py, bright ? 1.2 : .56, bright ? .58 : .105, bright ? .9 : 0);
      }

      for (let route = 0; route < 7; route++) {
        const offset = (route - 3) * 12;
        const points = [];
        for (let step = 0; step <= 70; step++) {
          const u = step / 70;
          const x = -212 + u * 424;
          const z = offset + Math.sin(u * TAU * 1.6 + route) * 36;
          points.push([x + z * .34, z * .44 - surface(x, z) - 8]);
        }
        this.line(points, route === 3 ? .48 : .105, route === 3 ? 1.05 : .45, route === 3 ? .8 : 0);
      }
      this.ctx.restore();
    }

    ai(t) {
      const ribbons = this.mobile ? 34 : 58;
      const steps = this.mobile ? 82 : 126;
      for (let ribbon = 0; ribbon < ribbons; ribbon++) {
        const offset = ribbon / (ribbons - 1) - .5;
        const path = [];
        for (let step = 0; step <= steps; step++) {
          const u = step / steps * TAU;
          const phase = t * .75 + offset * 1.3;
          const radius = 118 + 46 * Math.sin(3 * u + phase) + offset * 62;
          const x = Math.sin(u * 2 + phase * .18) * radius * .98;
          const y = Math.sin(u * 3 - phase * .27) * (82 + 38 * Math.cos(u * 2)) + offset * 58 * Math.cos(u);
          const twist = 24 * Math.sin(u * 7 + phase + offset * 8);
          path.push([x + twist * offset, y]);
          if ((step + ribbon) % 7 === 0) {
            const bright = hash(ribbon * 83 + step * 11) > .87;
            this.point(x + twist * offset, y, bright ? 1.05 : .56, bright ? .46 : .12, bright ? .7 : 0);
          }
        }
        this.line(path, .045 + .13 * (1 - Math.abs(offset)), .38);
      }

      for (let pulse = 0; pulse < 22; pulse++) {
        const u = (pulse / 22 * TAU + t * 1.65) % TAU;
        const radius = 118 + 46 * Math.sin(3 * u + t * .75);
        const x = Math.sin(u * 2 + t * .13) * radius;
        const y = Math.sin(u * 3 - t * .2) * (82 + 38 * Math.cos(u * 2));
        this.point(x, y, pulse % 6 === 0 ? 2.2 : 1.15, pulse % 6 === 0 ? .82 : .48, .8);
      }
    }

    manufacturing(t) {
      const sections = this.mobile ? 31 : 45;
      const pointsPerSection = this.mobile ? 18 : 28;
      const yaw = .16;
      const pitch = .72;
      const surfacePoints = this.mobile ? 1500 : 2850;

      // A point-built aircraft volume: the drafting sections below define the
      // geometry, while this field gives it the density and depth of the site's
      // other computational studies.
      for (let i = 0; i < surfacePoints; i++) {
        const selector = hash(i * 11.73);
        let x;
        let y;
        let z;
        if (selector < .54) {
          const u = hash(i * 7.19 + 4);
          const angle = hash(i * 13.07 + 9) * TAU;
          x = -205 + u * 410;
          const radius = 6 + 24 * Math.pow(Math.sin(u * Math.PI), .58);
          y = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
        } else {
          const tail = selector > .88;
          const sign = hash(i * 3.41 + 2) > .5 ? 1 : -1;
          const v = hash(i * 5.87 + 5);
          const chordU = hash(i * 17.31 + 1);
          const span = sign * v * (tail ? 94 : 190);
          const root = tail ? -148 : -25;
          const sweep = root - v * (tail ? 22 : 66);
          const chord = (tail ? 52 : 112) * (1 - v * .74);
          x = sweep + (chordU - .4) * chord;
          y = span;
          z = (tail ? 12 : -2) + Math.sin(chordU * Math.PI) * (tail ? 6 : 12) * (1 - v);
        }
        const p = this.project(x, y, z, yaw, pitch);
        const glint = hash(i * 29.7 + Math.floor(t * 4)) > .988;
        this.point(p[0], p[1], glint ? 1.18 : .52, glint ? .54 : .105, glint ? .78 : 0);
      }

      for (let section = 0; section < sections; section++) {
        const u = section / (sections - 1);
        const x = -205 + u * 410;
        const radius = 6 + 24 * Math.pow(Math.sin(u * Math.PI), .58);
        const ring = [];
        for (let point = 0; point <= pointsPerSection; point++) {
          const angle = point / pointsPerSection * TAU;
          const y = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const projected = this.project(x, y, z, yaw, pitch);
          ring.push(projected);
          if (point < pointsPerSection && (point + section) % 2 === 0) {
            this.point(projected[0], projected[1], .58, .2, point % 9 === 0 ? .75 : 0);
          }
        }
        this.line(ring, section % 4 === 0 ? .19 : .045, section % 4 === 0 ? .54 : .3);
      }

      const wing = (sign, tail = false) => {
        const spanRows = tail ? 9 : (this.mobile ? 16 : 24);
        for (let row = 0; row < spanRows; row++) {
          const v = row / (spanRows - 1);
          const span = sign * v * (tail ? 94 : 190);
          const root = tail ? -148 : -25;
          const sweep = root - v * (tail ? 22 : 66);
          const chord = (tail ? 52 : 112) * (1 - v * .74);
          const path = [];
          for (let step = 0; step <= 22; step++) {
            const u = step / 22;
            const x = sweep + (u - .4) * chord;
            const y = span;
            const z = (tail ? 12 : -2) + Math.sin(u * Math.PI) * (tail ? 6 : 12) * (1 - v);
            const p = this.project(x, y, z, yaw, pitch);
            path.push(p);
            if (step % 3 === 0) this.point(p[0], p[1], .6, .18, step === 12 ? .65 : 0);
          }
          this.line(path, row % 4 === 0 ? .18 : .04, .34);
        }
      };
      wing(1); wing(-1); wing(1, true); wing(-1, true);

      const scan = -220 + ((t * 125) % 440);
      this.stroke(.27, .62, .7);
      this.ctx.beginPath();
      this.ctx.moveTo(scan, -165);
      this.ctx.lineTo(scan, 165);
      this.ctx.stroke();
      for (let i = 0; i < 22; i++) {
        const y = -154 + i * 14.6;
        const alpha = .12 + .5 * Math.exp(-Math.abs((i / 21 - .5) * 4));
        this.point(scan, y, .72, alpha, .8);
      }
    }

    supply(t) {
      const streams = this.mobile ? 18 : 28;
      const particles = this.mobile ? 1900 : 3550;
      for (let stream = 0; stream < streams; stream++) {
        const lane = stream / (streams - 1) - .5;
        const path = [];
        for (let step = 0; step <= 72; step++) {
          const u = step / 72;
          const x = -248 + u * 496;
          const blendA = Math.exp(-((x + 94) ** 2) / 4600);
          const blendB = Math.exp(-((x - 72) ** 2) / 4300);
          const envelope = 292 * (1 - .79 * blendA - .74 * blendB);
          const y = lane * envelope +
            Math.sin(stream * .72 + t * .23) * 26 * blendA -
            Math.cos(stream * .57 - t * .18) * 31 * blendB +
            Math.sin(u * TAU * 2.2 + stream * .3) * 5;
          path.push([x, y]);
        }
        this.line(path, .025 + .075 * (1 - Math.abs(lane)), .3);
      }

      for (let i = 0; i < particles; i++) {
        const lane = hash(i * 5.31 + 2) - .5;
        const speed = .012 + hash(i * 17.7) * .014;
        const u = (hash(i * 8.19 + 4) + t * speed) % 1;
        const x = -252 + u * 504;
        const blendA = Math.exp(-((x + 94) ** 2) / 4600);
        const blendB = Math.exp(-((x - 72) ** 2) / 4300);
        const envelope = 294 * (1 - .8 * blendA - .75 * blendB);
        const noise = (hash(i * 31.1) - .5) * (12 + 18 * (1 - blendA - blendB));
        const y = lane * envelope +
          Math.sin(i * .72 + t * .23) * 26 * blendA -
          Math.cos(i * .57 - t * .18) * 31 * blendB +
          Math.sin(u * TAU * 2.2 + i * .03) * 5 + noise;
        const nearHub = Math.max(blendA, blendB);
        const glint = hash(i * 23.9 + Math.floor(t * 5)) > .991;
        this.point(x, y, glint ? 1.45 : .58, glint ? .7 : .13 + nearHub * .1, glint ? .9 : nearHub * .2);
      }

      for (let pulse = 0; pulse < 24; pulse++) {
        const lane = pulse / 23 - .5;
        const u = (t * .092 + pulse * .071) % 1;
        const x = -252 + u * 504;
        const blendA = Math.exp(-((x + 94) ** 2) / 4600);
        const blendB = Math.exp(-((x - 72) ** 2) / 4300);
        const y = lane * 294 * (1 - .8 * blendA - .75 * blendB) +
          Math.sin(pulse * .72 + t * .23) * 26 * blendA -
          Math.cos(pulse * .57 - t * .18) * 31 * blendB;
        this.point(x, y, pulse % 6 === 0 ? 2 : .9, pulse % 6 === 0 ? .76 : .38, .82);
      }

      [[-94, 0], [72, 0]].forEach(([cx, cy], hub) => {
        for (let i = 0; i < (this.mobile ? 120 : 210); i++) {
          const angle = hash(i * 9.2 + hub * 4) * TAU + t * (hub ? -.12 : .14);
          const radius = 8 + Math.pow(hash(i * 3.1 + 7), .62) * 46;
          this.point(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * .68,
            i % 53 === 0 ? 1.25 : .48, i % 53 === 0 ? .58 : .11, i % 53 === 0 ? .75 : .12);
        }
      });
    }

    energy(t) {
      const fieldLines = this.mobile ? 16 : 24;
      const steps = this.mobile ? 72 : 104;
      const particles = this.mobile ? 2200 : 4200;
      for (let field = 0; field < fieldLines; field++) {
        const v = field / fieldLines * TAU;
        const path = [];
        for (let step = 0; step <= steps; step++) {
          const u = step / steps * TAU;
          const major = 112 + 27 * Math.sin(3 * v + t);
          const minor = 44 + 13 * Math.cos(v * 2 - t * .8);
          const x = (major + minor * Math.cos(u)) * Math.cos(v + u * .18);
          const z = (major + minor * Math.cos(u)) * Math.sin(v + u * .18);
          const y = minor * Math.sin(u) + 18 * Math.sin(v * 4 + t * 2);
          const p = this.project(x, y, z, t * .1 + .28, .68);
          path.push(p);
        }
        this.line(path, .025 + .065 * Math.pow(Math.sin(v), 2), .31);
      }

      for (let i = 0; i < particles; i++) {
        const v = hash(i * 5.37 + 2) * TAU;
        const u = (hash(i * 11.13 + 8) * TAU + t * (.13 + hash(i * 7.7) * .08)) % TAU;
        const major = 112 + 27 * Math.sin(3 * v + t);
        const minor = 44 + 13 * Math.cos(v * 2 - t * .8);
        const p = this.project(
          (major + minor * Math.cos(u)) * Math.cos(v + u * .18),
          minor * Math.sin(u) + 18 * Math.sin(v * 4 + t * 2),
          (major + minor * Math.cos(u)) * Math.sin(v + u * .18),
          t * .1 + .28,
          .68
        );
        const edge = .65 + .35 * Math.sin(u) ** 2;
        const glint = hash(i * 31.7 + Math.floor(t * 4)) > .991;
        this.point(p[0], p[1], glint ? 1.42 : .58, glint ? .69 : .12 + edge * .07, glint ? .9 : edge * .045);
      }

      for (let pulse = 0; pulse < 18; pulse++) {
        const v = pulse / 18 * TAU;
        const u = (t * 1.45 + pulse * .83) % TAU;
        const major = 112 + 27 * Math.sin(3 * v + t);
        const minor = 44 + 13 * Math.cos(v * 2 - t * .8);
        const p = this.project(
          (major + minor * Math.cos(u)) * Math.cos(v + u * .18),
          minor * Math.sin(u) + 18 * Math.sin(v * 4 + t * 2),
          (major + minor * Math.cos(u)) * Math.sin(v + u * .18),
          t * .1 + .28,
          .68
        );
        this.point(p[0], p[1], pulse % 5 === 0 ? 2.15 : .95, pulse % 5 === 0 ? .82 : .42, .85);
      }
    }

    industrial(t) {
      const blades = 11;
      const ribbons = this.mobile ? 7 : 12;
      const particles = this.mobile ? 2400 : 4550;
      const yaw = .28 + t * .09;
      const pitch = .73;

      for (let blade = 0; blade < blades; blade++) {
        for (let ribbon = 0; ribbon < ribbons; ribbon++) {
          const offset = ribbon / (ribbons - 1) - .5;
          const path = [];
          for (let step = 0; step <= 58; step++) {
            const u = step / 58;
            const angle = blade / blades * TAU + t * .16 + .18 + 1.14 * Math.pow(u, 1.48) + offset * .15;
            const radius = 28 + 190 * u + offset * (14 + 30 * Math.sin(u * Math.PI));
            const z = offset * 32 * Math.sin(u * Math.PI) + 8 * Math.sin(u * TAU + blade);
            path.push(this.project(Math.cos(angle) * radius, Math.sin(angle) * radius, z, yaw, pitch));
          }
          this.line(path, .025 + .085 * (1 - Math.abs(offset)), .3, ribbon === Math.floor(ribbons / 2) ? .2 : 0);
        }
      }

      for (let i = 0; i < particles; i++) {
        const blade = Math.floor(hash(i * 3.71) * blades);
        const u = Math.pow(hash(i * 7.33 + 2), .8);
        const offset = hash(i * 13.17 + 7) - .5;
        const angle = blade / blades * TAU + t * .16 + .18 + 1.14 * Math.pow(u, 1.48) + offset * .15;
        const radius = 28 + 190 * u + offset * (14 + 30 * Math.sin(u * Math.PI));
        const z = offset * 32 * Math.sin(u * Math.PI) + 8 * Math.sin(u * TAU + blade);
        const p = this.project(Math.cos(angle) * radius, Math.sin(angle) * radius, z, yaw, pitch);
        const leading = Math.abs(offset) > .43;
        const glint = hash(i * 29.8 + Math.floor(t * 5)) > .992;
        this.point(p[0], p[1], glint ? 1.4 : .5, glint ? .68 : leading ? .16 : .09, glint ? .86 : leading ? .22 : 0);
      }

      const hubPoints = this.mobile ? 260 : 460;
      for (let i = 0; i < hubPoints; i++) {
        const angle = hash(i * 6.2) * TAU + t * .16;
        const radius = 8 + Math.sqrt(hash(i * 4.2 + 3)) * 31;
        const z = (hash(i * 9.8 + 6) - .5) * 26;
        const p = this.project(Math.cos(angle) * radius, Math.sin(angle) * radius, z, yaw, pitch);
        this.point(p[0], p[1], i % 71 === 0 ? 1.45 : .54, i % 71 === 0 ? .68 : .16, i % 71 === 0 ? .86 : .12);
      }
    }

    smallBusiness(t) {
      const loops = [
        { x: -92, y: -45, rx: 118, ry: 83, phase: .2 },
        { x: 78, y: -38, rx: 105, ry: 75, phase: 2.3 },
        { x: 0, y: 92, rx: 138, ry: 72, phase: 4.1 }
      ];
      const ribbons = this.mobile ? 8 : 13;
      const particles = this.mobile ? 2000 : 3700;

      loops.forEach((loop, loopIndex) => {
        for (let ribbon = 0; ribbon < ribbons; ribbon++) {
          const offset = ribbon / (ribbons - 1) - .5;
          const path = [];
          for (let step = 0; step <= 92; step++) {
            const u = step / 92 * TAU;
            const cadence = 1 + .1 * Math.sin(u * 5 + t * 2 + loopIndex);
            const x = loop.x + Math.cos(u + loop.phase) * (loop.rx + offset * 32) * cadence;
            const y = loop.y + Math.sin(u + loop.phase) * (loop.ry + offset * 24) +
              9 * Math.sin(u * 3 - t + loopIndex);
            path.push([x, y]);
            if ((step + ribbon) % 10 === 0) this.point(x, y, .62, .145, loopIndex === 1 ? .52 : 0);
          }
          this.line(path, .02 + .065 * (1 - Math.abs(offset)), .3);
        }
      });

      for (let i = 0; i < particles; i++) {
        const loopIndex = Math.floor(hash(i * 3.91) * loops.length);
        const loop = loops[loopIndex];
        const u = hash(i * 7.13 + 2) * TAU + t * (.07 + hash(i * 11.8) * .04);
        const offset = hash(i * 19.4 + 8) - .5;
        const cadence = 1 + .1 * Math.sin(u * 5 + t * 2 + loopIndex);
        const x = loop.x + Math.cos(u + loop.phase) * (loop.rx + offset * 36) * cadence;
        const y = loop.y + Math.sin(u + loop.phase) * (loop.ry + offset * 28) +
          9 * Math.sin(u * 3 - t + loopIndex);
        const glint = hash(i * 31.3 + Math.floor(t * 4)) > .992;
        this.point(x, y, glint ? 1.42 : .58, glint ? .68 : .13 + .045 * (1 - Math.abs(offset)), glint ? .88 : loopIndex === 1 ? .16 : .025);
      }

      const transfers = [
        [[-198, -66], [-115, -16], [-60, 48], [0, 24]],
        [[0, 24], [52, -6], [126, -22], [178, -72]],
        [[-108, 125], [-58, 95], [42, 91], [113, 124]]
      ];
      transfers.forEach((route, index) => {
        this.curve(route[0], route[1], route[2], route[3], .2, .58, index === 1 ? .65 : 0);
        for (let pulse = 0; pulse < 7; pulse++) {
          const u = (t * .38 + pulse / 7 + index * .13) % 1;
          const omt = 1 - u;
          const x = omt ** 3 * route[0][0] + 3 * omt ** 2 * u * route[1][0] + 3 * omt * u ** 2 * route[2][0] + u ** 3 * route[3][0];
          const y = omt ** 3 * route[0][1] + 3 * omt ** 2 * u * route[1][1] + 3 * omt * u ** 2 * route[2][1] + u ** 3 * route[3][1];
          this.point(x, y, pulse === 0 ? 1.8 : .76, pulse === 0 ? .7 : .32, pulse === 0 ? .82 : 0);
        }
      });
    }
  }

  document.querySelectorAll('[data-capability-art]').forEach(canvas => new CapabilityArt(canvas));
})();
