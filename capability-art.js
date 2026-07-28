(() => {
  const TAU = Math.PI * 2;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  class CapabilityArt {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.mode = canvas.dataset.capabilityArt;
      this.visible = true;
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
      const dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 2.25 : 2);
      this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = rect.width;
      this.h = rect.height;
      this.dpr = dpr;
    }

    frame(now) {
      if (this.visible) {
        const t = reduceMotion ? 1.8 : (now - this.start) * 0.00032;
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.save();
        this.ctx.translate(this.w / 2, this.h / 2);
        this.ctx.scale(Math.min(this.w, this.h) / 520, Math.min(this.w, this.h) / 520);
        this.draw(t);
        this.ctx.restore();
      }
      requestAnimationFrame(this.frame);
    }

    stroke(alpha = .36, width = .72) {
      this.ctx.strokeStyle = `rgba(151,207,255,${alpha})`;
      this.ctx.lineWidth = width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }

    point(x, y, size = 1, alpha = .65) {
      this.ctx.fillStyle = `rgba(185,224,255,${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, TAU);
      this.ctx.fill();
    }

    line(points, close = false, alpha = .34, width = .7) {
      this.stroke(alpha, width);
      this.ctx.beginPath();
      points.forEach(([x, y], i) => i ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y));
      if (close) this.ctx.closePath();
      this.ctx.stroke();
    }

    project(x, y, z, tilt = .58) {
      const c = Math.cos(tilt), s = Math.sin(tilt);
      return [x + z * .45, y * c - z * s];
    }

    draw(t) {
      const drawings = {
        engineering: () => this.turbine(t),
        modeling: () => this.terrain(t),
        ai: () => this.neural(t),
        manufacturing: () => this.airframe(t),
        supply: () => this.network(t),
        energy: () => this.grid(t),
        industrial: () => this.assembly(t),
        small: () => this.operatingSystem(t)
      };
      (drawings[this.mode] || drawings.engineering)();
    }

    turbine(t) {
      this.ctx.rotate(t * .28);
      for (let ring = 0; ring < 8; ring++) {
        const r = 38 + ring * 18;
        this.stroke(.12 + ring * .018);
        this.ctx.beginPath(); this.ctx.arc(0, 0, r, 0, TAU); this.ctx.stroke();
      }
      for (let blade = 0; blade < 11; blade++) {
        const a = blade / 11 * TAU;
        const pts = [];
        for (let j = 0; j <= 28; j++) {
          const u = j / 28, r = 42 + u * 164;
          const bend = .58 * u * u;
          pts.push([Math.cos(a + bend) * r, Math.sin(a + bend) * r * .72]);
        }
        this.line(pts, false, .48, 1);
        for (let j = 3; j < pts.length; j += 3) this.point(pts[j][0], pts[j][1], 1.2, .7);
      }
      this.stroke(.8, 1.2);
      this.ctx.beginPath(); this.ctx.arc(0, 0, 31, 0, TAU); this.ctx.stroke();
      this.point(0, 0, 4, .95);
    }

    terrain(t) {
      this.ctx.rotate(-.11);
      for (let row = -17; row <= 17; row++) {
        const pts = [];
        for (let col = -42; col <= 42; col++) {
          const x = col * 6;
          const z = Math.sin(col * .19 + t * 2.1) * 22 + Math.cos(row * .31 - t) * 12;
          const peak = 68 * Math.exp(-(col * col + row * row * 2.2) / 580);
          pts.push([x, row * 7 + z - peak]);
        }
        this.line(pts, false, row % 4 === 0 ? .48 : .19, row % 4 === 0 ? 1 : .55);
      }
      for (let i = 0; i < 70; i++) {
        const x = -245 + i * 7, y = -128 + Math.sin(i * .36 + t * 3) * 15;
        this.point(x, y, i % 8 === 0 ? 2 : .8, i % 8 === 0 ? .9 : .35);
      }
    }

    neural(t) {
      const nodes = [];
      for (let ring = 0; ring < 5; ring++) {
        const count = 7 + ring * 5;
        for (let i = 0; i < count; i++) {
          const a = i / count * TAU + ring * .41 + t * (ring % 2 ? -.12 : .1);
          const r = 42 + ring * 39;
          nodes.push([Math.cos(a) * r, Math.sin(a) * r * .72, ring, i]);
        }
      }
      nodes.forEach((n, i) => {
        if (i % 3) return;
        const target = nodes[(i * 7 + 19) % nodes.length];
        if (Math.abs(n[2] - target[2]) <= 2) this.line([n, target], false, .12, .5);
      });
      nodes.forEach((n, i) => {
        const pulse = .5 + .5 * Math.sin(t * 6 - i * .21);
        this.point(n[0], n[1], 1.1 + pulse * 1.5, .35 + pulse * .58);
      });
      this.stroke(.33);
      this.ctx.beginPath(); this.ctx.arc(0, 0, 210, 0, TAU); this.ctx.stroke();
    }

    airframe(t) {
      const body = [[-226,8],[-150,-12],[-56,-17],[18,-20],[166,-9],[228,3],[166,11],[18,17],[-56,16],[-150,12]];
      this.line(body, true, .65, 1.15);
      this.line([[-20,-18],[-91,-139],[-43,-146],[72,-16]], true, .58, 1);
      this.line([[-20,17],[-91,139],[-43,146],[72,16]], true, .58, 1);
      this.line([[-150,-11],[-193,-67],[-166,-70],[-118,-12]], true, .5);
      this.line([[-150,11],[-193,67],[-166,70],[-118,12]], true, .5);
      for (let x = -192; x < 190; x += 14) {
        const breadth = 16 * (1 - Math.abs(x) / 240);
        this.line([[x,-breadth],[x,breadth]], false, .18);
      }
      const scan = -210 + ((t * 120) % 420);
      this.stroke(.7, 1.4); this.ctx.beginPath(); this.ctx.moveTo(scan,-154); this.ctx.lineTo(scan,154); this.ctx.stroke();
      for (let i = 0; i < 45; i++) {
        const x = -215 + (i * 37 % 430), y = Math.sin(i * 4.3) * (18 + (i % 7) * 15);
        this.point(x, y, .8, .35);
      }
    }

    network(t) {
      const hubs = [[-210,-88],[-190,94],[-74,-32],[-8,108],[45,-112],[111,28],[205,-68],[210,106]];
      const links = [[0,2],[1,2],[2,3],[2,4],[3,5],[4,5],[5,6],[5,7],[3,7],[0,4]];
      links.forEach(([a,b], index) => {
        const p = hubs[a], q = hubs[b];
        this.line([p,q], false, .34, .8);
        for (let k = 0; k < 3; k++) {
          const u = (t * .8 + k / 3 + index * .13) % 1;
          this.point(p[0] + (q[0]-p[0])*u, p[1] + (q[1]-p[1])*u, 2, .9);
        }
      });
      hubs.forEach((p,i) => {
        this.stroke(.55, .9); this.ctx.beginPath(); this.ctx.arc(p[0],p[1],12 + (i%3)*4,0,TAU); this.ctx.stroke();
        this.point(p[0],p[1],3,.95);
      });
      for (let r = 1; r < 5; r++) {
        this.stroke(.08); this.ctx.beginPath(); this.ctx.arc(0,0,r*53,0,TAU); this.ctx.stroke();
      }
    }

    grid(t) {
      this.ctx.rotate(-.18);
      for (let y = -190; y <= 190; y += 22) {
        const pts = [];
        for (let x = -250; x <= 250; x += 8) {
          const d = Math.hypot(x, y);
          const wave = Math.sin(d * .045 - t * 4) * 13 * Math.exp(-d / 310);
          pts.push([x, y + wave]);
        }
        this.line(pts, false, y % 44 === 0 ? .42 : .18, y % 44 === 0 ? .9 : .5);
      }
      for (let x = -242; x <= 242; x += 44) this.line([[x,-198],[x,198]], false, .09);
      [[-130,-65],[0,0],[145,72]].forEach((p,i) => {
        const pulse = 18 + 8 * Math.sin(t*5+i*2);
        this.stroke(.52); this.ctx.beginPath(); this.ctx.arc(p[0],p[1],pulse,0,TAU); this.ctx.stroke();
        this.point(p[0],p[1],3,.95);
      });
    }

    assembly(t) {
      this.ctx.rotate(t * .16);
      for (let layer = -3; layer <= 3; layer++) {
        const z = layer * 32;
        const sides = 8;
        const pts = [];
        for (let i = 0; i < sides; i++) {
          const a = i / sides * TAU + layer * .15;
          pts.push(this.project(Math.cos(a)*(150-Math.abs(layer)*11), Math.sin(a)*(150-Math.abs(layer)*11), z));
        }
        this.line(pts, true, .28 + (3-Math.abs(layer))*.06);
        if (layer < 3) {
          pts.forEach((p,i) => {
            const a = i / sides * TAU + (layer+1)*.15;
            this.line([p,this.project(Math.cos(a)*(150-Math.abs(layer+1)*11),Math.sin(a)*(150-Math.abs(layer+1)*11),(layer+1)*32)],false,.19);
          });
        }
      }
      for (let r = 35; r < 115; r += 26) {
        this.stroke(.45); this.ctx.beginPath(); this.ctx.arc(0,0,r,0,TAU); this.ctx.stroke();
      }
      for (let i=0;i<12;i++) {
        const a=i/12*TAU-t*.5; this.point(Math.cos(a)*95,Math.sin(a)*95,1.8,.8);
      }
    }

    operatingSystem(t) {
      const cells = [];
      for (let y=-2;y<=2;y++) for (let x=-2;x<=2;x++) cells.push([x*76,y*76]);
      cells.forEach((p,i) => {
        const s = i === 12 ? 48 + Math.sin(t*4)*4 : 38;
        this.stroke(i===12?.75:.28,i===12?1.3:.7);
        this.ctx.strokeRect(p[0]-s/2,p[1]-s/2,s,s);
        if (i !== 12) this.line([p,[0,0]],false,.11,.5);
      });
      const route = [[-152,152],[-76,76],[0,76],[0,0],[76,0],[152,-76]];
      this.line(route,false,.7,1.5);
      const segment = Math.floor((t*1.4)% (route.length-1));
      const u = (t*1.4)%1, a=route[segment], b=route[segment+1];
      this.point(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,3,.95);
    }
  }

  document.querySelectorAll('[data-capability-art]').forEach(canvas => new CapabilityArt(canvas));
})();
