(() => {
  "use strict";

  const series = {
    rates: {
      kicker: "CAPITAL PRICING",
      title: "10-year Treasury yield",
      unit: "%",
      digits: 2,
      source: "https://fred.stlouisfed.org/series/DGS10",
      regime: "Restrictive",
      direction: "+12 bp over window",
      signal: "Long-duration capital remains expensive relative to the pre-2022 environment.",
      decision: "Re-test hurdle rates, phasing, financing sensitivity, and the value of preserving options before committing capital.",
      values: [
        ["2026-06-03",4.49],["2026-06-04",4.47],["2026-06-05",4.55],["2026-06-08",4.56],
        ["2026-06-09",4.53],["2026-06-10",4.55],["2026-06-11",4.45],["2026-06-12",4.48],
        ["2026-06-15",4.47],["2026-06-16",4.43],["2026-06-17",4.49],["2026-06-18",4.46],
        ["2026-06-22",4.51],["2026-06-23",4.50],["2026-06-24",4.41],["2026-06-25",4.40],
        ["2026-06-26",4.38],["2026-06-29",4.38],["2026-06-30",4.44],["2026-07-01",4.48],
        ["2026-07-02",4.49],["2026-07-06",4.48],["2026-07-07",4.55],["2026-07-08",4.56],
        ["2026-07-09",4.54],["2026-07-10",4.56],["2026-07-13",4.62],["2026-07-14",4.58],
        ["2026-07-15",4.55],["2026-07-16",4.57],["2026-07-17",4.55],["2026-07-20",4.60],
        ["2026-07-21",4.63],["2026-07-22",4.67],["2026-07-23",4.71],["2026-07-24",4.69],
        ["2026-07-27",4.65],["2026-07-28",4.61]
      ]
    },
    conditions: {
      kicker: "FINANCIAL CONDITIONS",
      title: "Chicago Fed NFCI",
      unit: "",
      digits: 3,
      source: "https://fred.stlouisfed.org/series/NFCI",
      regime: "Accommodative",
      direction: "Loosening over window",
      signal: "The index remains below zero, indicating financial conditions looser than their historical average, while direction still matters.",
      decision: "Do not treat available capital as durable capacity. Stress-test liquidity, refinancing windows, covenants, and supplier exposure under a tighter regime.",
      values: [
        ["2026-01-02",-0.545],["2026-01-09",-0.556],["2026-01-16",-0.562],["2026-01-23",-0.564],
        ["2026-01-30",-0.560],["2026-02-06",-0.552],["2026-02-13",-0.539],["2026-02-20",-0.522],
        ["2026-02-27",-0.503],["2026-03-06",-0.484],["2026-03-13",-0.468],["2026-03-20",-0.458],
        ["2026-03-27",-0.454],["2026-04-03",-0.459],["2026-04-10",-0.469],["2026-04-17",-0.480],
        ["2026-04-24",-0.489],["2026-05-01",-0.496],["2026-05-08",-0.500],["2026-05-15",-0.499],
        ["2026-05-22",-0.498],["2026-05-29",-0.495],["2026-06-05",-0.495],["2026-06-12",-0.497],
        ["2026-06-19",-0.502],["2026-06-26",-0.510],["2026-07-03",-0.522],["2026-07-10",-0.534],
        ["2026-07-17",-0.544],["2026-07-24",-0.554]
      ]
    },
    output: {
      kicker: "OPERATING CAPACITY",
      title: "U.S. industrial production",
      unit: "",
      digits: 1,
      source: "https://fred.stlouisfed.org/series/INDPRO",
      regime: "Gradual expansion",
      direction: "+3.4% over window",
      signal: "Aggregate industrial output has moved higher, but the index cannot reveal which plant, process, labor, or supplier constraints will govern delivery.",
      decision: "Connect demand forecasts to usable capacity, yield, maintenance, cycle time, and workforce constraints before translating growth into commitments.",
      values: [
        ["2024-11-01",99.2925],["2024-12-01",100.3273],["2025-01-01",100.0647],["2025-02-01",101.0993],
        ["2025-03-01",101.0404],["2025-04-01",101.1279],["2025-05-01",100.9655],["2025-06-01",101.4785],
        ["2025-07-01",101.8940],["2025-08-01",101.6247],["2025-09-01",101.6680],["2025-10-01",101.2195],
        ["2025-11-01",101.0344],["2025-12-01",101.4941],["2026-01-01",101.0388],["2026-02-01",101.9263],
        ["2026-03-01",101.6172],["2026-04-01",102.4196],["2026-05-01",102.5606],["2026-06-01",102.6395]
      ]
    },
    buildout: {
      kicker: "PHYSICAL INVESTMENT",
      title: "Manufacturing construction",
      unit: "B",
      divisor: 1000,
      digits: 1,
      source: "https://fred.stlouisfed.org/series/TLMFGCONS",
      regime: "Cooling buildout",
      direction: "−29.1% from window high",
      signal: "Manufacturing construction remains elevated in absolute terms, while the recent path shows how quickly a major investment cycle can decelerate.",
      decision: "Distinguish announced capacity from installed, qualified, staffed, and economically productive capacity; then model timing and bottleneck migration.",
      values: [
        ["2024-10-01",246526],["2024-11-01",250089],["2024-12-01",242048],["2025-01-01",237485],
        ["2025-02-01",237155],["2025-03-01",227339],["2025-04-01",227640],["2025-05-01",223805],
        ["2025-06-01",219564],["2025-07-01",215594],["2025-08-01",211142],["2025-09-01",205019],
        ["2025-10-01",202687],["2025-11-01",195150],["2025-12-01",181798],["2026-01-01",184187],
        ["2026-02-01",181879],["2026-03-01",179814],["2026-04-01",177206],["2026-05-01",174764]
      ]
    }
  };

  const formatDate = (value, compact = false) => {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("en-US", compact
      ? { month: "short", day: "numeric" }
      : { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };

  const formatValue = (config, value) => {
    const adjusted = config.divisor ? value / config.divisor : value;
    return `${adjusted.toFixed(config.digits)}${config.unit}`;
  };

  class MarketMonitor {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector("[data-market-chart]");
      this.ctx = this.canvas.getContext("2d");
      this.tooltip = root.querySelector("[data-market-tooltip]");
      this.active = "rates";
      this.pointer = null;
      this.onResize = () => this.draw();
      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(this.canvas);
      } else {
        window.addEventListener("resize", this.onResize, { passive: true });
      }
      this.tabs = [...root.querySelectorAll("[data-series]")];
      this.tabs.forEach((button, index) => {
        button.addEventListener("click", () => this.select(button.dataset.series, button));
        button.addEventListener("keydown", event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          let nextIndex = index;
          if (event.key === "ArrowLeft") nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
          if (event.key === "ArrowRight") nextIndex = (index + 1) % this.tabs.length;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = this.tabs.length - 1;
          const next = this.tabs[nextIndex];
          this.select(next.dataset.series, next);
          next.focus();
        });
      });
      this.canvas.addEventListener("pointermove", event => this.onPointer(event));
      this.canvas.addEventListener("pointerleave", () => {
        this.pointer = null;
        this.tooltip.hidden = true;
        this.draw();
      });
      this.select("rates", root.querySelector('[data-series="rates"]'));
    }

    select(key, button) {
      this.active = key;
      this.pointer = null;
      this.tooltip.hidden = true;
      this.tabs.forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.tabIndex = selected ? 0 : -1;
      });
      const config = series[key];
      const last = config.values[config.values.length - 1];
      const panel = this.root.querySelector("[role=tabpanel]");
      panel.setAttribute("aria-labelledby", button.id);
      this.root.querySelector("[data-market-kicker]").textContent = config.kicker;
      this.root.querySelector("[data-market-title]").textContent = config.title;
      this.root.querySelector("[data-market-value]").textContent = formatValue(config, last[1]);
      this.root.querySelector("[data-market-date]").textContent = formatDate(last[0]);
      this.root.querySelector("[data-market-start]").textContent = formatDate(config.values[0][0], true);
      this.root.querySelector("[data-market-end]").textContent = formatDate(last[0], true);
      this.root.querySelector("[data-market-signal]").textContent = config.signal;
      this.root.querySelector("[data-market-decision]").textContent = config.decision;
      this.root.querySelector("[data-market-regime]").textContent = config.regime;
      this.root.querySelector("[data-market-direction]").textContent = config.direction;
      this.root.querySelector("[data-market-source]").href = config.source;
      document.querySelectorAll("[data-series-jump]").forEach(item => item.classList.toggle("active", item.dataset.seriesJump === key));
      this.canvas.setAttribute("aria-label", `${config.title}, ${formatValue(config, last[1])} on ${formatDate(last[0])}`);
      this.draw();
    }

    size() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
      }
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width, height };
    }

    geometry() {
      const { width, height } = this.size();
      const padding = { left: 28, right: 28, top: 32, bottom: 28 };
      const values = series[this.active].values.map(item => item[1]);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const spread = Math.max(maxValue - minValue, Math.abs(maxValue) * 0.02, 0.05);
      const low = minValue - spread * 0.18;
      const high = maxValue + spread * 0.18;
      const points = values.map((value, index) => ({
        x: padding.left + (index / Math.max(1, values.length - 1)) * (width - padding.left - padding.right),
        y: padding.top + ((high - value) / (high - low)) * (height - padding.top - padding.bottom),
        value,
        index
      }));
      return { width, height, padding, points };
    }

    draw() {
      const { width, height, padding, points } = this.geometry();
      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i += 1) {
        const y = padding.top + (i / 4) * (height - padding.top - padding.bottom);
        ctx.strokeStyle = "rgba(120,166,211,.13)";
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, "rgba(92,164,246,.34)");
      gradient.addColorStop(1, "rgba(39,108,183,0)");
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else {
          const previous = points[index - 1];
          const mid = (previous.x + point.x) / 2;
          ctx.bezierCurveTo(mid, previous.y, mid, point.y, point.x, point.y);
        }
      });
      ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
      ctx.lineTo(points[0].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else {
          const previous = points[index - 1];
          const mid = (previous.x + point.x) / 2;
          ctx.bezierCurveTo(mid, previous.y, mid, point.y, point.x, point.y);
        }
      });
      ctx.strokeStyle = "#83b9f6";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(90,166,247,.45)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const target = this.pointer || points[points.length - 1];
      ctx.fillStyle = "#d7eaff";
      ctx.strokeStyle = "#3d82d2";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    onPointer(event) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const geometry = this.geometry();
      const point = geometry.points.reduce((best, current) =>
        Math.abs(current.x - x) < Math.abs(best.x - x) ? current : best);
      this.pointer = point;
      this.draw();
      const config = series[this.active];
      const value = config.values[point.index];
      this.tooltip.innerHTML = `<strong>${formatDate(value[0])}</strong><span>${config.title}<b>${formatValue(config, value[1])}</b></span>`;
      this.tooltip.hidden = false;
      const tipWidth = 224;
      this.tooltip.style.left = `${Math.min(Math.max(point.x - tipWidth / 2, 8), rect.width - tipWidth - 8)}px`;
      this.tooltip.style.top = `${Math.max(point.y - 76, 8)}px`;
    }
  }

  const agenticSteps = {
    observe: ["01 · OBSERVE", "More information enters the decision loop.", "Agents can continuously absorb prices, documents, news, constraints, and portfolio state. The advantage is coverage; the risk is common dependence on the same data and infrastructure."],
    interpret: ["02 · INTERPRET", "Models convert shared evidence into competing views.", "Different objectives, prompts, memory, and risk constraints can produce different conclusions. Model diversity matters only when the underlying reasoning and dependencies remain observable."],
    allocate: ["03 · ALLOCATE", "Recommendations become portfolio consequences.", "A forecast is no longer isolated analysis once it changes position size, timing, liquidity, or exposure. Limits must be expressed in the same system that makes the recommendation."],
    act: ["04 · ACT", "Speed compresses the time available for intervention.", "When agents move from advice to execution, escalation, throttling, rollback, and human authority must be designed before market conditions become unstable."],
    govern: ["05 · GOVERN", "Control must surround the entire loop.", "Effective governance connects data provenance, model behavior, permissions, monitoring, and post-decision evidence—not only a human approval at the final step."]
  };

  class AgenticSystem {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector("[data-agentic-canvas]");
      this.ctx = this.canvas.getContext("2d");
      this.nodes = [...root.querySelectorAll("[data-agentic-node]")];
      this.activeIndex = 0;
      this.phase = 0;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.nodes.forEach((node, index) => node.addEventListener("click", () => this.select(index)));
      this.onResize = () => this.draw();
      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(this.canvas);
      } else {
        window.addEventListener("resize", this.onResize, { passive: true });
      }
      this.select(0);
      if (!this.reducedMotion) this.animate();
      else this.draw();
    }

    select(index) {
      this.activeIndex = index;
      this.nodes.forEach((node, nodeIndex) => node.classList.toggle("active", nodeIndex === index));
      const step = agenticSteps[this.nodes[index].dataset.agenticNode];
      this.root.querySelector("[data-agentic-step]").textContent = step[0];
      this.root.querySelector("[data-agentic-title]").textContent = step[1];
      this.root.querySelector("[data-agentic-copy]").textContent = step[2];
      this.draw();
    }

    draw() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
      }
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const center = { x: width / 2, y: height / 2 };
      const positions = this.nodes.map(node => {
        const nodeRect = node.getBoundingClientRect();
        return {
          x: nodeRect.left - rect.left + nodeRect.width / 2,
          y: nodeRect.top - rect.top + nodeRect.height / 2
        };
      });
      positions.forEach((position, index) => {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        const bend = index % 2 === 0 ? 22 : -22;
        ctx.quadraticCurveTo((center.x + position.x) / 2 + bend, (center.y + position.y) / 2 - bend, position.x, position.y);
        ctx.strokeStyle = index === this.activeIndex ? "rgba(126,188,255,.72)" : "rgba(91,139,185,.2)";
        ctx.lineWidth = index === this.activeIndex ? 1.6 : 1;
        ctx.stroke();
        const progress = (this.phase + index * 0.17) % 1;
        const x = center.x + (position.x - center.x) * progress;
        const y = center.y + (position.y - center.y) * progress;
        ctx.fillStyle = index === this.activeIndex ? "#b9dcff" : "rgba(101,157,211,.35)";
        ctx.beginPath();
        ctx.arc(x, y, index === this.activeIndex ? 3.2 : 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    animate() {
      this.phase = (this.phase + 0.0024) % 1;
      this.draw();
      requestAnimationFrame(() => this.animate());
    }
  }

  const transmissionContent = {
    capital: {
      label: "CAPITAL → COMMITMENT",
      title: "Higher financing cost narrows the margin for timing error.",
      copy: "Projects with long payback periods become more sensitive to delay, utilization, and refinancing assumptions. Preserve stage gates before scope becomes irreversible.",
      meter: "78%",
      strength: "Transmission strength · elevated"
    },
    demand: {
      label: "DEMAND → MIX",
      title: "Aggregate growth can hide the segment that actually carries margin.",
      copy: "Separate volume, mix, geography, and customer concentration before expanding. A strong headline can still produce a weak operating plan when demand lands in the wrong place.",
      meter: "64%",
      strength: "Transmission strength · moderate"
    },
    capacity: {
      label: "CAPACITY → DELIVERY",
      title: "Installed assets do not automatically become usable throughput.",
      copy: "Labor, qualification, yield, maintenance, energy, and supplier readiness determine how much announced capacity becomes dependable output and when it arrives.",
      meter: "86%",
      strength: "Transmission strength · high"
    },
    control: {
      label: "AUTONOMY → AUTHORITY",
      title: "Faster action increases the value of explicit control boundaries.",
      copy: "Automated recommendations need observable inputs, position limits, escalation paths, and rollback authority before they can safely become automated decisions.",
      meter: "91%",
      strength: "Transmission strength · critical"
    }
  };

  class TransmissionMap {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector("[data-transmission-canvas]");
      this.ctx = this.canvas.getContext("2d");
      this.nodes = [...root.querySelectorAll("[data-transmission]")];
      this.activeIndex = 0;
      this.phase = 0;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.nodes.forEach((node, index) => node.addEventListener("click", () => this.select(index)));
      this.onResize = () => this.draw();
      if ("ResizeObserver" in window) new ResizeObserver(this.onResize).observe(this.canvas);
      else window.addEventListener("resize", this.onResize, { passive: true });
      this.select(0);
      if (!this.reducedMotion) this.animate();
    }

    select(index) {
      this.activeIndex = index;
      this.nodes.forEach((node, nodeIndex) => node.classList.toggle("active", nodeIndex === index));
      const item = transmissionContent[this.nodes[index].dataset.transmission];
      this.root.querySelector("[data-transmission-label]").textContent = item.label;
      this.root.querySelector("[data-transmission-title]").textContent = item.title;
      this.root.querySelector("[data-transmission-copy]").textContent = item.copy;
      this.root.querySelector("[data-transmission-meter]").style.setProperty("--meter", item.meter);
      this.root.querySelector("[data-transmission-strength]").textContent = item.strength;
      this.draw();
    }

    draw() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
      }
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const startX = width < 900 ? width * .5 : width * .27;
      const endX = width < 900 ? width * .5 : width * .72;
      const centerY = width < 900 ? height * .57 : height * .5;
      for (let line = 0; line < 18; line += 1) {
        const offset = (line - 8.5) * 12;
        ctx.beginPath();
        ctx.moveTo(startX, centerY + offset * .35);
        ctx.bezierCurveTo(width * .43, centerY - 150 + offset, width * .56, centerY + 150 + offset, endX, centerY + offset * .25);
        ctx.strokeStyle = line === 9 ? "rgba(58,123,186,.55)" : `rgba(65,120,167,${.07 + (line % 4) * .018})`;
        ctx.lineWidth = line === 9 ? 1.6 : 1;
        ctx.stroke();
      }
      for (let i = 0; i < 6; i += 1) {
        const progress = (this.phase + i * .17) % 1;
        const x = startX + (endX - startX) * progress;
        const y = centerY + Math.sin(progress * Math.PI * 2 + this.activeIndex) * (42 + this.activeIndex * 9);
        ctx.fillStyle = i === 0 ? "#4a91d2" : "rgba(86,148,202,.44)";
        ctx.beginPath();
        ctx.arc(x, y, i === 0 ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animate() {
      this.phase = (this.phase + .0018) % 1;
      this.draw();
      requestAnimationFrame(() => this.animate());
    }
  }

  const decisionContent = {
    capital: {
      signal: "Cost of long-duration capital remains elevated.",
      evidence: "10-year Treasury · current rate and direction",
      exposure: "Delay and utilization now carry more economic weight.",
      detail: "Financing sensitivity · payback period · scope",
      question: "Which tranche can earn the right to unlock the next?",
      trigger: "Change the view when utilization and financing remain inside the gate."
    },
    demand: {
      signal: "Aggregate demand is holding, but mix and timing remain uneven.",
      evidence: "Orders · backlog conversion · customer concentration",
      exposure: "Headline growth can land in the wrong product, region, or margin pool.",
      detail: "Volume · mix · timing · contribution margin",
      question: "Which demand is dependable enough to plan capacity against?",
      trigger: "Change the view when mix, cancellation, or backlog conversion breaks range."
    },
    capacity: {
      signal: "Physical investment is not converting to productive output at one speed.",
      evidence: "Construction · industrial production · operating constraints",
      exposure: "Installed assets can remain unavailable, unqualified, or uneconomic.",
      detail: "Labor · energy · yield · maintenance · suppliers",
      question: "What constraint governs usable throughput in the next planning window?",
      trigger: "Change the view when the governing constraint moves or reserve capacity clears."
    },
    ai: {
      signal: "AI compresses the time between evidence, recommendation, and action.",
      evidence: "Model use · decision latency · exception rate · authority",
      exposure: "A faster workflow can amplify weak data, common assumptions, or unclear ownership.",
      detail: "Provenance · evaluation · permissions · review · rollback",
      question: "Where should AI assist, recommend, or act under a defined limit?",
      trigger: "Change the view only after workflow-level evaluation proves readiness."
    }
  };

  class DecisionLens {
    constructor(root) {
      this.root = root;
      this.tabs = [...root.querySelectorAll("[data-decision-key]")];
      this.tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => this.select(tab));
        tab.addEventListener("keydown", event => {
          let nextIndex = null;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % this.tabs.length;
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = this.tabs.length - 1;
          if (nextIndex === null) return;
          event.preventDefault();
          this.tabs[nextIndex].focus();
          this.select(this.tabs[nextIndex]);
        });
      });
      this.select(this.tabs[0]);
    }

    select(tab) {
      const item = decisionContent[tab.dataset.decisionKey];
      this.tabs.forEach(candidate => {
        const selected = candidate === tab;
        candidate.classList.toggle("active", selected);
        candidate.setAttribute("aria-selected", selected ? "true" : "false");
        candidate.tabIndex = selected ? 0 : -1;
      });
      Object.entries(item).forEach(([key, value]) => {
        const target = this.root.querySelector(`[data-decision-${key}]`);
        if (target) target.textContent = value;
      });
    }
  }

  class ScenarioLab {
    constructor(root) {
      this.root = root;
      this.inputs = [...root.querySelectorAll("[data-scenario-input]")];
      this.profile = root.querySelector("[data-scenario-profile]");
      this.ghost = root.querySelector("[data-scenario-ghost]");
      this.map = root.querySelector("[data-scenario-map]");
      this.points = [...root.querySelectorAll("[data-scenario-point]")];
      this.currentProfile = null;
      this.currentScore = null;
      this.animationFrame = null;
      this.inputs.forEach(input => input.addEventListener("input", () => this.update()));
      root.querySelector("[data-scenario-reset]").addEventListener("click", () => {
        const defaults = { rates: 25, demand: 2, capacity: -3, automation: 45 };
        this.inputs.forEach(input => { input.value = defaults[input.dataset.scenarioInput]; });
        this.update();
      });
      this.update();
    }

    formatContribution(value) {
      const rounded = Math.round(value);
      return `${rounded >= 0 ? "+" : "−"}${Math.abs(rounded)} pts`;
    }

    animateProfile(targetProfile, targetScore) {
      if (!this.profile || !this.map) return;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      const fromProfile = this.currentProfile || targetProfile;
      const fromScore = this.currentScore ?? targetScore;
      const start = performance.now();
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 620;
      const draw = now => {
        const raw = duration ? Math.min(1, (now - start) / duration) : 1;
        const eased = 1 - Math.pow(1 - raw, 3);
        const frame = targetProfile.map((point, index) => ({
          x: fromProfile[index].x + (point.x - fromProfile[index].x) * eased,
          y: fromProfile[index].y + (point.y - fromProfile[index].y) * eased
        }));
        const pointString = frame.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
        this.profile.setAttribute("points", pointString);
        this.ghost.setAttribute("points", pointString);
        this.points.forEach((point, index) => {
          point.setAttribute("cx", frame[index].x.toFixed(1));
          point.setAttribute("cy", frame[index].y.toFixed(1));
        });
        const frameScore = fromScore + (targetScore - fromScore) * eased;
        this.root.querySelector("[data-scenario-score]").textContent = Math.round(frameScore);
        this.currentProfile = frame;
        this.currentScore = frameScore;
        if (raw < 1) this.animationFrame = requestAnimationFrame(draw);
        else {
          this.animationFrame = null;
        }
      };
      this.animationFrame = requestAnimationFrame(draw);
    }

    update() {
      const values = Object.fromEntries(this.inputs.map(input => [input.dataset.scenarioInput, Number(input.value)]));
      this.root.querySelector('[data-scenario-output="rates"]').textContent = `${values.rates >= 0 ? "+" : "−"}${Math.abs(values.rates)} bp`;
      this.root.querySelector('[data-scenario-output="demand"]').textContent = `${values.demand >= 0 ? "+" : "−"}${Math.abs(values.demand)}%`;
      this.root.querySelector('[data-scenario-output="capacity"]').textContent = `${values.capacity >= 0 ? "+" : "−"}${Math.abs(values.capacity)}%`;
      this.root.querySelector('[data-scenario-output="automation"]').textContent = `${values.automation}%`;
      const contributions = {
        capital: values.rates * .13,
        demand: -values.demand * 1.8,
        automation: values.automation * .18,
        capacity: -values.capacity * 1.5
      };
      const delta = Object.values(contributions).reduce((sum, value) => sum + value, 0);
      const score = Math.max(0, Math.min(100, Math.round(48 + delta)));
      const pressure = {
        capital: Math.max(0, Math.min(1, (values.rates + 100) / 250)),
        demand: Math.max(0, Math.min(1, (10 - values.demand) / 18)),
        automation: Math.max(0, Math.min(1, values.automation / 100)),
        capacity: Math.max(0, Math.min(1, (12 - values.capacity) / 24))
      };
      const radius = 120;
      const profile = [
        { x: 170, y: 170 - pressure.capital * radius },
        { x: 170 + pressure.demand * radius, y: 170 },
        { x: 170, y: 170 + pressure.automation * radius },
        { x: 170 - pressure.capacity * radius, y: 170 }
      ];
      const strongestDriver = Object.entries(pressure).sort((a, b) => b[1] - a[1])[0][0];
      const driverLabels = { capital: "CAPITAL", demand: "DEMAND", automation: "AUTOMATION", capacity: "CAPACITY" };
      let posture = "Advance with gates.";
      let copy = "The environment supports movement if evidence gates remain attached to each major commitment.";
      if (score >= 72) { posture = "Protect the downside."; copy = "Compounding pressures make irreversible scope fragile. Reduce exposure, preserve liquidity, and define explicit stop conditions."; }
      else if (score >= 55) { posture = "Stage the commitment."; copy = "Demand supports movement, but capital and capacity conditions make a fully irreversible commitment fragile."; }
      else if (score < 35) { posture = "Use the window."; copy = "Pressure is contained. Accelerate the highest conviction moves while retaining observable thresholds for reversal."; }
      Object.entries(contributions).forEach(([key, value]) => {
        this.root.querySelector(`[data-scenario-factor="${key}"]`).textContent = this.formatContribution(value);
      });
      Object.entries(pressure).forEach(([key, value]) => {
        const bar = this.root.querySelector(`[data-scenario-bar="${key}"]`);
        if (bar) bar.style.width = `${Math.max(6, value * 100)}%`;
      });
      this.root.querySelector("[data-scenario-driver]").textContent = `HIGHEST STRESS · ${driverLabels[strongestDriver]}`;
      this.root.querySelector("[data-scenario-delta]").textContent = `${delta >= 0 ? "+" : "−"}${Math.abs(Math.round(delta))}`;
      this.root.querySelector("[data-scenario-score]").textContent = score;
      this.map.style.setProperty("--pressure", score / 100);
      this.map.setAttribute("aria-label", `Composite decision pressure: ${score} out of 100. Highest-stress dimension: ${driverLabels[strongestDriver].toLowerCase()}.`);
      this.animateProfile(profile, score);
      this.root.querySelector("[data-scenario-posture]").textContent = posture;
      this.root.querySelector("[data-scenario-copy]").textContent = copy;
      this.root.querySelector("[data-scenario-capital]").textContent = score > 68 ? "Preserve liquidity" : score > 48 ? "Preserve options" : "Fund priority moves";
      this.root.querySelector("[data-scenario-operations]").textContent = values.capacity < 0 ? "Protect throughput" : "Convert capacity";
      this.root.querySelector("[data-scenario-control]").textContent = values.automation > 65 ? "Tight human gate" : values.automation > 30 ? "Human gate required" : "Monitor and review";
    }
  }

  const revealSections = document.querySelectorAll(".mv3-edition,.mv3-brief__grid,.mv3-section-head,.mv3-monitor,.mv3-decision__shell,.mv3-scenario__shell,.mv3-ai__intro,.mv3-ai__stages,.mv3-reading__grid");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }), { threshold: .12, rootMargin: "0px 0px -6%" });
    revealSections.forEach(section => { section.classList.add("market-reveal"); revealObserver.observe(section); });
  }

  document.querySelectorAll("[data-series-jump]").forEach(button => button.addEventListener("click", () => {
    const tab = document.querySelector(`[data-series="${button.dataset.seriesJump}"]`);
    if (tab) tab.click();
  }));

  document.querySelectorAll("[data-market-monitor]").forEach(root => new MarketMonitor(root));
  document.querySelectorAll("[data-decision-lens]").forEach(root => new DecisionLens(root));
  document.querySelectorAll("[data-agentic-system]").forEach(root => new AgenticSystem(root));
  document.querySelectorAll("[data-transmission-map]").forEach(root => new TransmissionMap(root));
  document.querySelectorAll("[data-scenario-lab]").forEach(root => new ScenarioLab(root));
})();
