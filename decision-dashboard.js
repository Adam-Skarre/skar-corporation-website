(() => {
  const root = document.querySelector("[data-decision-lab]");
  if (!root) return;

  const one = (selector) => root.querySelector(selector);
  const all = (selector) => [...root.querySelectorAll(selector)];
  const canvas = one("[data-decision-chart]");
  const context = canvas.getContext("2d");
  const tooltip = one("[data-chart-tooltip]");
  const sourceLabel = one("[data-source-label]");
  const scenarioName = one("[data-scenario-name]");
  const dashboardTitle = one("[data-dashboard-title]");
  const dashboardStatus = one("[data-dashboard-status]");
  const statusShell = dashboardStatus.closest(".lab-status");
  const dashboardMessage = one("[data-dashboard-message]");
  const horizonSelect = one("[data-horizon]");
  const controls = Object.fromEntries(all("[data-control]").map((input) => [input.dataset.control, input]));
  const outputs = Object.fromEntries(all("[data-output]").map((output) => [output.dataset.output, output]));
  const presetButtons = all("[data-preset]");
  const chartButtons = all("[data-chart-view]");
  const tableBody = one("[data-table-body]");
  const driverList = one("[data-driver-list]");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
  const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const presets = {
    base: { name: "Base operating plan", demand: 0, capacity: 0, price: 0 },
    growth: { name: "Growth acceleration", demand: 15, capacity: 5, price: 0 },
    shock: { name: "Capacity disruption", demand: 5, capacity: -12, price: 0 },
    pricing: { name: "Price realization", demand: 0, capacity: 0, price: 6 }
  };

  let data = createDemoData();
  let state = { demand: 0, capacity: 0, price: 0, horizon: 26, view: "volume", hoverIndex: -1 };
  let latestModel = null;
  let sourceName = "SKAR demonstration · 52 weeks";

  function createDemoData() {
    const start = new Date("2026-01-05T12:00:00");
    return Array.from({ length: 52 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index * 7);
      const seasonal = Math.sin(index * Math.PI / 6) * 62 + Math.sin(index * 0.87) * 24;
      const demand = 865 + index * 4.7 + seasonal;
      const maintenance = index === 18 || index === 19 || index === 38 ? 115 : 0;
      const capacity = 1045 + Math.sin(index * 0.31) * 26 - maintenance;
      const efficiency = 0.935 + Math.sin(index * 0.53) * 0.018;
      const throughput = Math.min(demand, capacity) * efficiency;
      return {
        date: date.toISOString().slice(0, 10),
        demand,
        capacity,
        throughput,
        price: 145 + Math.sin(index * 0.22) * 2.4,
        variableCost: 79 + Math.sin(index * 0.41) * 2.8,
        fixedCost: 18000
      };
    });
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function modelScenario(source, scenario, horizon) {
    const selected = source.slice(0, Math.min(horizon, source.length));
    let backlog = 0;
    const rows = selected.map((row, index) => {
      const demand = row.demand * (1 + scenario.demand / 100);
      const capacity = row.capacity * (1 + scenario.capacity / 100);
      const price = row.price * (1 + scenario.price / 100);
      const baseLimit = Math.max(1, Math.min(row.demand, row.capacity));
      const efficiency = clamp(row.throughput / baseLimit, 0.72, 0.995);
      const availableWork = demand + backlog;
      const throughput = Math.min(availableWork, capacity) * efficiency;
      backlog = Math.max(0, availableWork - throughput);
      const revenue = throughput * price;
      const variableCost = throughput * row.variableCost;
      const contribution = revenue - variableCost - row.fixedCost;
      const service = clamp(throughput / Math.max(1, demand), 0, 1);
      const utilization = clamp(throughput / Math.max(1, capacity), 0, 1.2);
      return { ...row, index, demand, capacity, throughput, price, revenue, variableCost, contribution, service, utilization, backlog };
    });
    const total = (key) => rows.reduce((sum, row) => sum + row[key], 0);
    const revenue = total("revenue");
    const contribution = total("contribution");
    const demand = total("demand");
    const throughput = total("throughput");
    const service = clamp(throughput / Math.max(1, demand), 0, 1);
    const highUtilization = rows.filter((row) => row.utilization > 0.92).length / Math.max(1, rows.length);
    const missedService = rows.filter((row) => row.service < 0.95).length / Math.max(1, rows.length);
    const endingBacklog = rows.at(-1)?.backlog || 0;
    const backlogPressure = clamp(endingBacklog / Math.max(1, rows.at(-1)?.demand || 1), 0, 1);
    const risk = clamp((highUtilization * 0.45 + missedService * 0.35 + backlogPressure * 0.2) * 100, 0, 100);
    const averageVariableCost = total("variableCost") / Math.max(1, throughput);
    return {
      rows,
      revenue,
      margin: contribution / Math.max(1, revenue),
      service,
      risk,
      endingBacklog,
      workingCapital: endingBacklog * averageVariableCost,
      peakUtilization: Math.max(...rows.map((row) => row.utilization), 0),
      averageUtilization: rows.reduce((sum, row) => sum + row.utilization, 0) / Math.max(1, rows.length),
      variableCostIntensity: total("variableCost") / Math.max(1, revenue)
    };
  }

  function signed(value, suffix = "%", digits = 1) {
    if (!Number.isFinite(value) || Math.abs(value) < 0.05) return `0${suffix}`;
    return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}${suffix}`;
  }

  function setDelta(key, text, favorable) {
    const element = one(`[data-delta="${key}"]`);
    element.textContent = text;
    element.classList.toggle("positive", favorable);
    element.classList.toggle("negative", !favorable);
  }

  function updateKpis(current, baseline) {
    one('[data-kpi="revenue"]').textContent = currency.format(current.revenue);
    one('[data-kpi="margin"]').textContent = `${(current.margin * 100).toFixed(1)}%`;
    one('[data-kpi="service"]').textContent = `${(current.service * 100).toFixed(1)}%`;
    one('[data-kpi="risk"]').textContent = `${current.risk.toFixed(0)}%`;

    const revenueDelta = (current.revenue / Math.max(1, baseline.revenue) - 1) * 100;
    const marginDelta = (current.margin - baseline.margin) * 100;
    const serviceDelta = (current.service - baseline.service) * 100;
    const riskDelta = current.risk - baseline.risk;
    setDelta("revenue", `${signed(revenueDelta)} vs base`, revenueDelta >= 0);
    setDelta("margin", `${signed(marginDelta, " pts")} vs base`, marginDelta >= 0);
    setDelta("service", `${signed(serviceDelta, " pts")} vs base`, serviceDelta >= 0);
    setDelta("risk", `${signed(riskDelta, " pts")} vs base`, riskDelta <= 0);
  }

  function recommendation(model) {
    if (model.service < 0.9 && model.peakUtilization > 0.94) {
      return {
        tag: "Constraint action",
        status: "Capacity constraint",
        title: "Debottleneck before accepting the full demand case.",
        copy: "The modeled demand creates sustained utilization above the operating envelope, growing backlog and weakening service. Test targeted capacity, schedule, and process-yield actions before committing to the revenue plan.",
        level: "critical"
      };
    }
    if (model.risk > 42 || model.endingBacklog > 500) {
      return {
        tag: "Stage intervention",
        status: "Exposure increasing",
        title: "Create an option-preserving capacity plan.",
        copy: "The scenario remains economically attractive, but constraint exposure is concentrated in a small number of periods. Define trigger points for overtime, alternate routing, or incremental capacity.",
        level: "watch"
      };
    }
    if (model.margin < 0.22) {
      return {
        tag: "Unit economics",
        status: "Margin pressure",
        title: "Restore contribution before pursuing volume.",
        copy: "Revenue is not converting into sufficient contribution. Test price realization, input-cost reduction, mix, and avoidable fixed-cost commitments before scaling the operating plan.",
        level: "watch"
      };
    }
    if (state.price > 0 && model.service >= 0.96) {
      return {
        tag: "Commercial case",
        status: "Pricing leverage",
        title: "The pricing scenario improves value without stressing service.",
        copy: "Operating capacity remains balanced while contribution expands. Validate customer elasticity and mix effects, then sequence the commercial change with clear retention measures.",
        level: "good"
      };
    }
    return {
      tag: "Monitor",
      status: "Within operating range",
      title: "The operating plan remains balanced.",
      copy: "Demand, capacity, service, and contribution remain aligned over the selected horizon. Preserve the current operating envelope and monitor the periods approaching peak utilization.",
      level: "good"
    };
  }

  function updateDecisionBrief(model) {
    const result = recommendation(model);
    one("[data-recommendation-tag]").textContent = result.tag;
    one("[data-recommendation-title]").textContent = result.title;
    one("[data-recommendation-copy]").textContent = result.copy;
    one('[data-brief="backlog"]').textContent = `${whole.format(model.endingBacklog)} units`;
    one('[data-brief="working-capital"]').textContent = currency.format(model.workingCapital);
    one('[data-brief="peak-utilization"]').textContent = `${(model.peakUtilization * 100).toFixed(1)}%`;
    dashboardStatus.textContent = result.status;
    statusShell.dataset.level = result.level;
  }

  function updateDrivers(model) {
    const finalDemand = model.rows.at(-1)?.demand || 1;
    const finalCapacity = model.rows.at(-1)?.capacity || 1;
    const gap = (finalDemand / finalCapacity - 1) * 100;
    const drivers = [
      { label: "Capacity utilization", value: model.averageUtilization * 100, display: `${(model.averageUtilization * 100).toFixed(1)}%` },
      { label: "Demand–capacity gap", value: clamp(Math.abs(gap) * 4, 4, 100), display: signed(gap) },
      { label: "Price realization", value: clamp(38 + state.price * 4, 4, 100), display: signed(state.price, "%", 0) },
      { label: "Variable-cost intensity", value: model.variableCostIntensity * 100, display: `${(model.variableCostIntensity * 100).toFixed(1)}%` }
    ];
    driverList.innerHTML = drivers.map((driver) => `<div><span><b>${driver.label}</b><em>${driver.display}</em></span><i><u style="width:${clamp(driver.value, 0, 100)}%"></u></i></div>`).join("");
  }

  function updateTable(rows) {
    tableBody.innerHTML = rows.slice(-8).map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${whole.format(row.demand)}</td><td>${whole.format(row.capacity)}</td><td>${whole.format(row.throughput)}</td><td>${(row.service * 100).toFixed(1)}%</td><td>${currency.format(row.revenue)}</td></tr>`).join("");
  }

  function chartSeries(model) {
    const definitions = {
      volume: {
        title: "Demand, throughput & capacity",
        unit: "",
        series: [
          { name: "Demand", color: "#8bbcff", values: model.rows.map((row) => row.demand) },
          { name: "Throughput", color: "#f4f8fb", values: model.rows.map((row) => row.throughput) },
          { name: "Capacity", color: "#4ed0b8", values: model.rows.map((row) => row.capacity) }
        ]
      },
      economics: {
        title: "Revenue & contribution",
        unit: "$k",
        series: [
          { name: "Revenue", color: "#8bbcff", values: model.rows.map((row) => row.revenue / 1000) },
          { name: "Contribution", color: "#4ed0b8", values: model.rows.map((row) => row.contribution / 1000) }
        ]
      },
      service: {
        title: "Service & capacity utilization",
        unit: "%",
        series: [
          { name: "Service", color: "#f4f8fb", values: model.rows.map((row) => row.service * 100) },
          { name: "Utilization", color: "#8bbcff", values: model.rows.map((row) => row.utilization * 100) },
          { name: "Operating threshold", color: "#e8a45b", dashed: true, values: model.rows.map(() => 92) }
        ]
      },
      backlog: {
        title: "Backlog accumulation",
        unit: "",
        series: [{ name: "Backlog", color: "#e8a45b", values: model.rows.map((row) => row.backlog) }]
      }
    };
    return definitions[state.view];
  }

  function drawChart(model, hoverIndex = state.hoverIndex) {
    if (!model || !model.rows.length) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(260, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const chart = chartSeries(model);
    const pad = { left: 58, right: 22, top: 24, bottom: 40 };
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const values = chart.series.flatMap((series) => series.values).filter(Number.isFinite);
    let minimum = Math.min(...values);
    let maximum = Math.max(...values);
    if (state.view === "backlog") minimum = 0;
    if (state.view === "service") {
      minimum = Math.min(80, minimum);
      maximum = Math.max(100, maximum);
    }
    const range = Math.max(1, maximum - minimum);
    minimum -= range * 0.12;
    maximum += range * 0.12;
    if (state.view === "backlog") minimum = 0;

    const x = (index) => pad.left + (index / Math.max(1, model.rows.length - 1)) * plotWidth;
    const y = (value) => pad.top + ((maximum - value) / Math.max(1, maximum - minimum)) * plotHeight;

    context.font = "11px Arial";
    context.fillStyle = "#7991a5";
    context.strokeStyle = "rgba(143,174,198,.17)";
    context.lineWidth = 1;
    for (let line = 0; line <= 4; line += 1) {
      const yy = pad.top + (line / 4) * plotHeight;
      context.beginPath();
      context.moveTo(pad.left, yy);
      context.lineTo(width - pad.right, yy);
      context.stroke();
      const value = maximum - (line / 4) * (maximum - minimum);
      const label = chart.unit === "$k" ? `$${value.toFixed(0)}k` : `${value.toFixed(0)}${chart.unit}`;
      context.fillText(label, 4, yy + 4);
    }

    const labels = Math.min(5, model.rows.length);
    for (let tick = 0; tick < labels; tick += 1) {
      const index = Math.round((tick / Math.max(1, labels - 1)) * (model.rows.length - 1));
      const xx = x(index);
      context.fillStyle = "#7991a5";
      context.textAlign = tick === 0 ? "left" : tick === labels - 1 ? "right" : "center";
      context.fillText(model.rows[index].date.slice(5), xx, height - 12);
    }
    context.textAlign = "left";

    chart.series.forEach((series, seriesIndex) => {
      if (seriesIndex === 0 && !series.dashed) {
        const gradient = context.createLinearGradient(0, pad.top, 0, height - pad.bottom);
        gradient.addColorStop(0, `${series.color}38`);
        gradient.addColorStop(1, `${series.color}00`);
        context.beginPath();
        series.values.forEach((value, index) => {
          if (index === 0) context.moveTo(x(index), y(value));
          else context.lineTo(x(index), y(value));
        });
        context.lineTo(x(series.values.length - 1), height - pad.bottom);
        context.lineTo(x(0), height - pad.bottom);
        context.closePath();
        context.fillStyle = gradient;
        context.fill();
      }
      context.beginPath();
      series.values.forEach((value, index) => {
        if (index === 0) context.moveTo(x(index), y(value));
        else context.lineTo(x(index), y(value));
      });
      context.strokeStyle = series.color;
      context.lineWidth = seriesIndex === 0 ? 2.6 : 2;
      context.setLineDash(series.dashed ? [6, 7] : []);
      context.stroke();
      context.setLineDash([]);
    });

    if (hoverIndex >= 0 && hoverIndex < model.rows.length) {
      const xx = x(hoverIndex);
      context.strokeStyle = "rgba(255,255,255,.38)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(xx, pad.top);
      context.lineTo(xx, height - pad.bottom);
      context.stroke();
      chart.series.forEach((series) => {
        context.beginPath();
        context.arc(xx, y(series.values[hoverIndex]), 4, 0, Math.PI * 2);
        context.fillStyle = series.color;
        context.fill();
        context.strokeStyle = "#071f34";
        context.lineWidth = 2;
        context.stroke();
      });
    }

    one("[data-chart-title]").textContent = chart.title;
    one("[data-chart-legend]").innerHTML = chart.series.map((series) => `<span><i style="background:${series.color}"></i>${series.name}</span>`).join("");
    canvas.setAttribute("aria-label", `${chart.title} over ${model.rows.length} periods`);
  }

  function updateTooltip(event) {
    if (!latestModel) return;
    const rect = canvas.getBoundingClientRect();
    const left = 58;
    const right = 22;
    const relative = clamp((event.clientX - rect.left - left) / Math.max(1, rect.width - left - right), 0, 1);
    state.hoverIndex = Math.round(relative * Math.max(0, latestModel.rows.length - 1));
    const chart = chartSeries(latestModel);
    const row = latestModel.rows[state.hoverIndex];
    const values = chart.series.map((series) => {
      const value = series.values[state.hoverIndex];
      const formatted = chart.unit === "$k" ? `$${value.toFixed(1)}k` : `${whole.format(value)}${chart.unit}`;
      return `<span><i style="background:${series.color}"></i>${series.name}<b>${formatted}</b></span>`;
    }).join("");
    tooltip.innerHTML = `<strong>${escapeHtml(row.date)}</strong>${values}`;
    tooltip.hidden = false;
    const tooltipWidth = 210;
    const x = clamp(event.clientX - rect.left + 14, 8, rect.width - tooltipWidth - 8);
    const y = clamp(event.clientY - rect.top - 24, 8, rect.height - 150);
    tooltip.style.transform = `translate(${x}px,${y}px)`;
    drawChart(latestModel);
  }

  function render() {
    state.horizon = Number(horizonSelect.value);
    const current = modelScenario(data, state, state.horizon);
    const baseline = modelScenario(data, { demand: 0, capacity: 0, price: 0 }, state.horizon);
    latestModel = current;
    sourceLabel.textContent = sourceName;
    dashboardTitle.textContent = `${scenarioName.textContent} · ${current.rows.length}-week outlook`;
    Object.entries(controls).forEach(([key, input]) => {
      outputs[key].textContent = signed(Number(input.value), "%", 0);
    });
    updateKpis(current, baseline);
    updateDecisionBrief(current);
    updateDrivers(current);
    updateTable(current.rows);
    drawChart(current);
  }

  function applyPreset(key) {
    const preset = presets[key];
    Object.keys(controls).forEach((control) => {
      controls[control].value = preset[control];
      state[control] = preset[control];
    });
    scenarioName.textContent = preset.name;
    presetButtons.forEach((button) => button.classList.toggle("active", button.dataset.preset === key));
    state.hoverIndex = -1;
    tooltip.hidden = true;
    render();
  }

  function parseCsvLine(line) {
    const values = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else {
        value += character;
      }
    }
    values.push(value.trim());
    return values;
  }

  function parseCsv(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter((line) => line.trim());
    if (lines.length < 3) throw new Error("The file needs a header and at least two data rows.");
    const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/[\s-]+/g, "_"));
    const indexOf = (...names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0);
    const columns = {
      date: indexOf("date", "period", "week"),
      demand: indexOf("demand", "orders", "volume"),
      capacity: indexOf("capacity", "available_capacity"),
      throughput: indexOf("throughput", "output", "units"),
      price: indexOf("price", "unit_price", "revenue_per_unit"),
      variableCost: indexOf("variable_cost", "unit_cost", "cost_per_unit")
    };
    if (columns.demand === undefined || columns.capacity === undefined) throw new Error("The CSV must include demand and capacity columns.");
    const rows = lines.slice(1).map((line, rowIndex) => {
      const cells = parseCsvLine(line);
      const number = (column, fallback) => {
        if (column === undefined) return fallback;
        const parsed = Number(String(cells[column] || "").replace(/[$,%\s]/g, ""));
        return Number.isFinite(parsed) ? parsed : fallback;
      };
      const demand = number(columns.demand, 0);
      const capacity = number(columns.capacity, demand);
      if (demand <= 0 || capacity <= 0) return null;
      const throughput = number(columns.throughput, Math.min(demand, capacity) * 0.94);
      return {
        date: columns.date === undefined ? `Period ${rowIndex + 1}` : cells[columns.date] || `Period ${rowIndex + 1}`,
        demand,
        capacity,
        throughput,
        price: number(columns.price, 145),
        variableCost: number(columns.variableCost, 79),
        fixedCost: 18000
      };
    }).filter(Boolean);
    if (rows.length < 2) throw new Error("No valid demand and capacity rows were found.");
    return rows;
  }

  function exportScenario() {
    if (!latestModel) return;
    const header = "date,demand,capacity,throughput,service,revenue,contribution,backlog";
    const rows = latestModel.rows.map((row) => [
      row.date,
      row.demand.toFixed(2),
      row.capacity.toFixed(2),
      row.throughput.toFixed(2),
      (row.service * 100).toFixed(2),
      row.revenue.toFixed(2),
      row.contribution.toFixed(2),
      row.backlog.toFixed(2)
    ].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "skar-operating-scenario.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    dashboardMessage.textContent = "Scenario exported. The file includes the modeled operating and financial series for the selected horizon.";
  }

  presetButtons.forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.preset)));
  Object.entries(controls).forEach(([key, input]) => input.addEventListener("input", () => {
    state[key] = Number(input.value);
    scenarioName.textContent = "Custom operating case";
    presetButtons.forEach((button) => button.classList.remove("active"));
    render();
  }));
  chartButtons.forEach((button) => button.addEventListener("click", () => {
    state.view = button.dataset.chartView;
    state.hoverIndex = -1;
    tooltip.hidden = true;
    chartButtons.forEach((item) => item.classList.toggle("active", item === button));
    drawChart(latestModel);
  }));
  horizonSelect.addEventListener("change", render);
  one("[data-reset-dashboard]").addEventListener("click", () => {
    data = createDemoData();
    sourceName = "SKAR demonstration · 52 weeks";
    horizonSelect.value = "26";
    dashboardMessage.textContent = "Demonstration data restored. Change the scenario controls or import a CSV to evaluate another operating case.";
    applyPreset("base");
  });
  one("[data-export-dashboard]").addEventListener("click", exportScenario);
  one("[data-csv-input]").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      data = parseCsv(await file.text());
      sourceName = `${file.name} · ${data.length} periods`;
      horizonSelect.value = String(data.length >= 52 ? 52 : data.length >= 26 ? 26 : 13);
      dashboardMessage.textContent = `${file.name} loaded successfully. Scenario calculations are running locally in this browser.`;
      applyPreset("base");
    } catch (error) {
      dashboardMessage.textContent = `The dataset could not be loaded: ${error.message}`;
      event.target.value = "";
    }
  });
  canvas.addEventListener("mousemove", updateTooltip);
  canvas.addEventListener("mouseleave", () => {
    state.hoverIndex = -1;
    tooltip.hidden = true;
    drawChart(latestModel);
  });
  if ("ResizeObserver" in window) new ResizeObserver(() => drawChart(latestModel)).observe(canvas.parentElement);
  else window.addEventListener("resize", () => drawChart(latestModel));

  applyPreset("base");
})();
