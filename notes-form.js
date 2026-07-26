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
        else this.drawChamber(t);
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
  }

  document.querySelectorAll('[data-form-study]').forEach(canvas => new FormStudy(canvas));
})();
