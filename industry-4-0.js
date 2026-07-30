(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;

  function createField(canvas, mode) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { alpha: true });
    const state = { width: 0, height: 0, dpr: 1, time: 0, phase: 0, targetPhase: 0, pointerX: 0, pointerY: 0 };
    const nodes = [
      [-0.7, 0.18, 0.78], [-0.4, -0.18, 0.92], [-0.08, 0.13, 1.08],
      [0.24, -0.2, 0.96], [0.52, 0.1, 0.82], [0.76, -0.12, 0.7]
    ];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      state.dpr = Math.min(devicePixelRatio || 1, 2);
      state.width = Math.max(1, rect.width);
      state.height = Math.max(1, rect.height);
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }

    function project(nx, ny, depth = 1) {
      const heroShift = mode === "hero" ? state.width * 0.17 : 0;
      const scale = Math.min(state.width, state.height) * 0.48;
      return {
        x: state.width * 0.56 + heroShift + nx * scale * depth + state.pointerX * 12,
        y: state.height * 0.52 + ny * scale * 0.66 * depth + state.pointerY * 9
      };
    }

    function line(x1, y1, x2, y2, color, width = 1) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    function drawFloor() {
      const horizon = state.height * 0.28;
      const bottom = state.height * 0.96;
      ctx.save();
      ctx.globalAlpha = mode === "hero" ? 0.28 : 0.36;
      for (let i = 0; i <= 12; i++) {
        const x = state.width * (i / 12);
        line(state.width * 0.58, horizon, x, bottom, "rgba(93,145,196,.24)");
      }
      for (let i = 0; i < 12; i++) {
        const q = i / 11;
        const y = horizon + Math.pow(q, 1.82) * (bottom - horizon);
        line(0, y, state.width, y, `rgba(95,151,205,${0.05 + q * 0.18})`);
      }
      ctx.restore();
    }

    function roundedBox(x, y, w, h, glow) {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 7);
      ctx.fillStyle = "rgba(7,38,63,.76)";
      ctx.fill();
      ctx.strokeStyle = `rgba(128,188,236,${0.23 + glow * 0.6})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(77,157,224,.8)";
      ctx.shadowBlur = 18 * glow;
      ctx.stroke();
      ctx.shadowBlur = 0;
      line(-w * .32, -h * .13, w * .32, -h * .13, "rgba(111,166,216,.3)");
      line(-w * .32, h * .12, w * .15, h * .12, "rgba(111,166,216,.2)");
      ctx.restore();
    }

    function drawNetwork(t, phase) {
      const pts = nodes.map(([x, y, d]) => project(x, y, d));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const lift = Math.min(a.y, b.y) - state.height * (0.12 + 0.025 * Math.sin(i));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(a.x + (b.x - a.x) * .35, lift, a.x + (b.x - a.x) * .68, lift, b.x, b.y);
        ctx.strokeStyle = `rgba(69,132,192,${0.2 + phase * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let k = 0; k < 2; k++) {
          const p = (t * .07 + i * .17 + k * .5) % 1;
          const u = 1 - p;
          const cx1 = a.x + (b.x - a.x) * .35;
          const cx2 = a.x + (b.x - a.x) * .68;
          const x = u*u*u*a.x + 3*u*u*p*cx1 + 3*u*p*p*cx2 + p*p*p*b.x;
          const y = u*u*u*a.y + 3*u*u*p*lift + 3*u*p*p*lift + p*p*p*b.y;
          const radius = 1.4 + 2.2 * Math.sin(Math.PI * p);
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
          gradient.addColorStop(0, "rgba(218,241,255,.95)");
          gradient.addColorStop(.18, "rgba(100,183,245,.8)");
          gradient.addColorStop(1, "rgba(75,155,225,0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "#dff3ff";
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
      pts.forEach((p, i) => roundedBox(p.x, p.y, 42 + nodes[i][2] * 24, 25 + nodes[i][2] * 14, .15 + .35 * (1 + Math.sin(t * .75 - i)) / 2));
    }

    function drawTwin(t, phase) {
      const center = project(mode === "hero" ? .13 : .04, mode === "hero" ? -.08 : -.03, 1);
      const base = Math.min(state.width, state.height) * (mode === "hero" ? .28 : .31);
      const resolve = 0.32 + phase * .18;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 620; i++) {
        const u = i / 620;
        const ring = (i % 31) / 31;
        const a = u * TAU * (2.4 + phase * .3) + t * .045;
        const b = ring * TAU + Math.sin(a * 2.1 + t * .03) * .32;
        const cloud = (1 - resolve) * Math.sin(i * 91.7 + t * .07) * .42;
        const radius = base * (.38 + .44 * Math.sin(a * 1.5 + phase) ** 2);
        const x3 = Math.cos(a) * radius + Math.cos(b) * base * (.15 + phase * .018) + cloud * base;
        const y3 = Math.sin(a) * radius * .54 + Math.sin(b) * base * .13 + cloud * base * .42;
        const z3 = Math.sin(b) * .5 + Math.cos(a * 1.7) * .35;
        const depth = 1 + z3 * .16;
        const x = center.x + x3 * depth;
        const y = center.y + y3 * depth;
        const alpha = .14 + (z3 + 1) * .14 + phase * .045;
        ctx.fillStyle = i % 17 === 0 ? `rgba(209,237,255,${alpha + .25})` : `rgba(104,172,229,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, i % 17 === 0 ? 1.45 : .72, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < 8; i++) {
        const r = base * (.26 + i * .075);
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, r, r * (.35 + phase * .04), -.14 + phase * .05, 0, TAU);
        ctx.strokeStyle = `rgba(97,162,219,${.05 + i * .008})`;
        ctx.stroke();
      }
      ctx.restore();
    }

    function draw(t) {
      ctx.clearRect(0, 0, state.width, state.height);
      const gradient = ctx.createRadialGradient(state.width * .7, state.height * .48, 10, state.width * .66, state.height * .48, state.width * .62);
      gradient.addColorStop(0, "rgba(21,78,121,.42)");
      gradient.addColorStop(.5, "rgba(5,38,63,.17)");
      gradient.addColorStop(1, "rgba(2,16,28,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, state.width, state.height);
      state.phase += (state.targetPhase - state.phase) * .035;
      const phase = state.phase;
      drawFloor();
      drawNetwork(t, phase);
      drawTwin(t, phase);
    }

    function frame(now) {
      state.time = now * .001;
      draw(state.time);
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    resize();
    addEventListener("resize", resize, { passive: true });
    if (mode === "hero") {
      canvas.closest(".i40-hero")?.addEventListener("pointermove", (event) => {
        const rect = canvas.getBoundingClientRect();
        state.pointerX = (event.clientX - rect.left) / rect.width - .5;
        state.pointerY = (event.clientY - rect.top) / rect.height - .5;
      }, { passive: true });
    }
    if (reduceMotion) draw(1.5);
    else requestAnimationFrame(frame);
    return { state, draw };
  }

  const heroField = createField(document.querySelector("[data-i40-hero]"), "hero");
  const storyField = createField(document.querySelector("[data-i40-story]"), "story");
  const storySteps = [...document.querySelectorAll("[data-phase]")];
  const storyIndex = document.querySelector(".i40-story-index");
  const storyProgress = document.querySelector(".i40-story-progress i");

  if (storyField && storySteps.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const phase = Number(visible.target.dataset.phase);
      storyField.state.targetPhase = phase;
      storySteps.forEach((step) => step.classList.toggle("is-active", step === visible.target));
      if (storyIndex) storyIndex.textContent = `${String(phase + 1).padStart(2, "0")} / 04`;
      if (storyProgress) storyProgress.style.transform = `translateY(${phase * 100}%)`;
    }, { rootMargin: "-28% 0px -28% 0px", threshold: [0, .25, .5, .75, 1] });
    storySteps.forEach((step) => observer.observe(step));
  }

  const shell = document.querySelector("[data-i40-diagnostic]");
  if (!shell) return;
  const form = shell.querySelector("form");
  const scoreEl = shell.querySelector("[data-score]");
  const scoreBar = shell.querySelector("[data-score-bar]");
  const tierEl = shell.querySelector("[data-tier]");
  const constraintEl = shell.querySelector("[data-constraint]");
  const recommendationEl = shell.querySelector("[data-recommendation]");
  const sequenceEl = shell.querySelector("[data-sequence]");
  const archetypeNoteEl = shell.querySelector("[data-archetype-note]");
  const dimensions = ["process", "data", "integration", "ownership", "workforce", "security"];
  const labels = { process:"Process stability",data:"Data integrity",integration:"Systems integration",ownership:"Decision ownership",workforce:"Workforce capability",security:"OT security and recovery" };
  const recommendations = {
    process:"Create a repeatable operating baseline, then instrument the variables that explain flow, quality, and loss.",
    data:"Strengthen the measurement chain so every critical observation carries stable units, time, identity, and provenance.",
    integration:"Design the information path across equipment, controls, operations, engineering, and enterprise planning.",
    ownership:"Connect each signal to an accountable decision, response time, escalation path, and verification step.",
    workforce:"Build the operating capability around the new workflow so people can inspect, challenge, and improve the system.",
    security:"Establish asset visibility, segmentation, controlled access, recoverable configurations, and tested restoration."
  };
  const archetypeNotes = {
    "high-mix":"Configuration control, routing context, and changeover intelligence carry additional value in high-mix operations.",
    "high-volume":"Small recurring losses compound quickly, making stability and rapid exception response especially valuable.",
    process:"Temporal context, control discipline, and safe operating limits are central to batch and process systems."
  };
  const paths = {
    throughput:["Define the constraint decision and loss mechanism.","Stabilize cycle, queue, changeover, and downtime definitions.","Connect state and flow evidence at the constraint.","Test scheduling or control interventions against throughput.","Scale the response loop across adjacent operations."],
    quality:["Define critical-to-quality conditions and genealogy.","Validate measurement systems and inspection context.","Connect product, process, and quality identifiers.","Model the conditions that shift defect risk.","Close the loop through controlled process or design changes."],
    reliability:["Rank assets by production consequence and failure mode.","Establish trustworthy condition and maintenance histories.","Connect events, operating context, and work execution.","Validate alerts against avoided loss and false-positive cost.","Coordinate maintenance decisions with production planning."],
    energy:["Define resource use per useful unit of output.","Separate base load from state-dependent consumption.","Connect resource signals to product and process context.","Test operating changes before capital interventions.","Sustain the gain through limits, ownership, and verification."]
  };
  const baseWeights = { process:.22,data:.18,integration:.18,ownership:.16,workforce:.14,security:.12 };

  function weightsFor(archetype) {
    const weights = { ...baseWeights };
    if (archetype === "high-volume") { weights.process += .04; weights.ownership += .02; weights.integration -= .03; weights.workforce -= .03; }
    else if (archetype === "high-mix") { weights.integration += .04; weights.workforce += .02; weights.process -= .03; weights.security -= .03; }
    else { weights.security += .04; weights.data += .02; weights.workforce -= .03; weights.integration -= .03; }
    return weights;
  }
  function tier(score) {
    if (score < 40) return "Establish the foundation";
    if (score < 60) return "Ready for a controlled pilot";
    if (score < 78) return "Ready to connect and scale";
    return "Prepared for adaptive operations";
  }
  function update() {
    const values = {};
    dimensions.forEach((name) => {
      values[name] = Number(form.elements[name].value);
      shell.querySelector(`[data-output="${name}"]`).value = values[name];
    });
    const archetype = form.elements.archetype.value;
    const priority = form.elements.priority.value;
    const weights = weightsFor(archetype);
    const weighted = dimensions.reduce((sum, name) => sum + values[name] * weights[name], 0);
    const floorPenalty = Math.max(0, 45 - Math.min(...dimensions.map((name) => values[name]))) * .18;
    const score = Math.max(0, Math.min(100, Math.round(weighted - floorPenalty)));
    const constraint = dimensions.reduce((low, name) => values[name] < values[low] ? name : low, dimensions[0]);
    scoreEl.textContent = score;
    scoreBar.style.width = `${score}%`;
    tierEl.textContent = tier(score);
    constraintEl.textContent = labels[constraint];
    recommendationEl.textContent = recommendations[constraint];
    archetypeNoteEl.textContent = archetypeNotes[archetype];
    sequenceEl.replaceChildren(...paths[priority].map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
})();
