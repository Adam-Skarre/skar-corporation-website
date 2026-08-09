(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let setOrbState = () => {};

  const orbCanvas = document.querySelector('[data-skar-ai-orb]');
  const orbStage = orbCanvas?.closest('.skar-ai-orb-stage');
  const orbStatus = document.querySelector('[data-orb-status]');
  if (orbCanvas && orbStage) {
    const context = orbCanvas.getContext('2d', { alpha: true });
    if (context) {
      let width = 1;
      let height = 1;
      let ratio = 1;
      let frame = 0;
      let visible = true;
      let state = 'idle';
      let pointerX = 0.5;
      let pointerY = 0.5;
      let targetX = pointerX;
      let targetY = pointerY;
      const particles = [];
      const particleCount = 960;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let index = 0; index < particleCount; index += 1) {
        const normalized = index / (particleCount - 1);
        const y = 1 - normalized * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = goldenAngle * index;
        particles.push({
          x: Math.cos(theta) * radius,
          y,
          z: Math.sin(theta) * radius,
          size: 0.55 + ((index * 17) % 13) / 13,
          phase: ((index * 29) % 101) / 101 * Math.PI * 2
        });
      }

      setOrbState = (nextState) => {
        state = nextState;
        orbStage.dataset.state = nextState;
        if (orbStatus) orbStatus.textContent = nextState === 'thinking' ? 'SKAR AI / REASONING' : nextState === 'ready' ? 'SKAR AI / RESPONSE READY' : 'SKAR AI / READY';
      };

      function resizeOrb() {
        const bounds = orbStage.getBoundingClientRect();
        width = Math.max(1, Math.round(bounds.width));
        height = Math.max(1, Math.round(bounds.height));
        ratio = Math.min(window.devicePixelRatio || 1, 1.8);
        orbCanvas.width = Math.round(width * ratio);
        orbCanvas.height = Math.round(height * ratio);
        orbCanvas.style.width = `${width}px`;
        orbCanvas.style.height = `${height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawOrb(0);
      }

      function drawRibbon(time, radius, tilt, color, alpha) {
        context.save();
        context.translate(width / 2, height / 2);
        context.rotate(tilt + Math.sin(time * 0.00018) * 0.08);
        context.scale(1, 0.35 + Math.sin(time * 0.00022 + tilt) * 0.035);
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.strokeStyle = color.replace('ALPHA', alpha);
        context.lineWidth = 1;
        context.setLineDash([2, 8]);
        context.lineDashOffset = reducedMotion ? 0 : -time * 0.012;
        context.stroke();
        context.restore();
      }

      function drawOrb(time) {
        const speed = state === 'thinking' ? 0.00105 : state === 'ready' ? 0.00055 : 0.00032;
        const pulse = reducedMotion ? 0 : Math.sin(time * (state === 'thinking' ? 0.004 : 0.0014)) * 0.04;
        pointerX += (targetX - pointerX) * 0.045;
        pointerY += (targetY - pointerY) * 0.045;
        context.clearRect(0, 0, width, height);
        const centerX = width * (0.5 + (pointerX - 0.5) * 0.035);
        const centerY = height * (0.5 + (pointerY - 0.5) * 0.035);
        const radius = Math.min(width, height) * (0.275 + pulse);

        const glow = context.createRadialGradient(centerX, centerY, radius * 0.05, centerX, centerY, radius * 1.52);
        glow.addColorStop(0, state === 'thinking' ? 'rgba(106,235,218,.3)' : 'rgba(107,178,246,.3)');
        glow.addColorStop(.36, 'rgba(78,137,222,.16)');
        glow.addColorStop(.72, 'rgba(114,92,215,.07)');
        glow.addColorStop(1, 'rgba(4,17,31,0)');
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);

        drawRibbon(time, radius * 1.23, -0.38, 'rgba(112,186,242,ALPHA)', .2);
        drawRibbon(time, radius * 1.06, 0.58, 'rgba(111,232,216,ALPHA)', .16);
        drawRibbon(time, radius * 1.38, 1.12, 'rgba(172,139,247,ALPHA)', .12);

        const rotationY = time * speed + (pointerX - 0.5) * 0.65;
        const rotationX = -0.18 + (pointerY - 0.5) * 0.36;
        const sinY = Math.sin(rotationY);
        const cosY = Math.cos(rotationY);
        const sinX = Math.sin(rotationX);
        const cosX = Math.cos(rotationX);
        const projected = [];

        particles.forEach((particle) => {
          const rotatedX = particle.x * cosY - particle.z * sinY;
          const rotatedZ = particle.x * sinY + particle.z * cosY;
          const rotatedY = particle.y * cosX - rotatedZ * sinX;
          const depth = particle.y * sinX + rotatedZ * cosX;
          projected.push({ particle, x: rotatedX, y: rotatedY, z: depth });
        });
        projected.sort((a, b) => a.z - b.z);

        context.globalCompositeOperation = 'lighter';
        projected.forEach(({ particle, x, y, z }) => {
          const depth = (z + 1) / 2;
          const turbulence = reducedMotion ? 0 : Math.sin(time * 0.0018 + particle.phase) * (state === 'thinking' ? 4.5 : 1.7);
          const screenX = centerX + x * radius + turbulence * y;
          const screenY = centerY + y * radius + turbulence * x * 0.45;
          const size = particle.size * (0.55 + depth * 1.55) * (state === 'thinking' ? 1.15 : 1);
          const cyanWeight = clamp((x + y + 1.4) / 2.8, 0, 1);
          const red = Math.round(111 + cyanWeight * 24);
          const green = Math.round(156 + cyanWeight * 76);
          const blue = Math.round(236 - cyanWeight * 12);
          context.fillStyle = `rgba(${red},${green},${blue},${0.17 + depth * 0.7})`;
          context.beginPath();
          context.arc(screenX, screenY, size, 0, Math.PI * 2);
          context.fill();
        });

        const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * .34);
        core.addColorStop(0, state === 'thinking' ? 'rgba(151,255,235,.55)' : 'rgba(166,215,255,.48)');
        core.addColorStop(.28, 'rgba(100,178,240,.2)');
        core.addColorStop(1, 'rgba(73,130,210,0)');
        context.fillStyle = core;
        context.beginPath();
        context.arc(centerX, centerY, radius * .35, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
      }

      function animateOrb(time) {
        if (visible) drawOrb(time);
        frame = window.requestAnimationFrame(animateOrb);
      }

      orbStage.addEventListener('pointermove', (event) => {
        if (reducedMotion) return;
        const bounds = orbStage.getBoundingClientRect();
        targetX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
        targetY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
      }, { passive: true });
      orbStage.addEventListener('pointerleave', () => { targetX = 0.5; targetY = 0.5; });
      const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .02 }) : null;
      if (observer) observer.observe(orbStage);
      const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resizeOrb) : null;
      if (resizeObserver) resizeObserver.observe(orbStage);
      else window.addEventListener('resize', resizeOrb, { passive: true });
      resizeOrb();
      if (!reducedMotion) frame = window.requestAnimationFrame(animateOrb);
      window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
    }
  }

  const promptLibrary = {
    operations: {
      prompt: 'Summarize the operating risks in a proposed capacity expansion and identify what requires human approval.',
      answer: 'Stage the commitment—and preserve an exit path.',
      findings: ['Demand supports phased capacity, not a single irreversible release.', 'Supplier lead time is the material constraint; the forecast is secondary.', 'Capital release and dependency concentration require named-owner approval.'],
      evidence: '4 operating sources', control: 'Capital gate required', action: 'Review phased option'
    },
    research: {
      prompt: 'Build an evidence brief on the forces changing industrial automation and separate facts from assumptions.',
      answer: 'The direction is clear. The rate of adoption is not.',
      findings: ['Primary evidence supports continued investment in connected operations.', 'Labor availability and integration capacity constrain the adoption curve.', 'Scenario ranges should remain visible instead of collapsing into one forecast.'],
      evidence: '6 source classes', control: 'Citations retained', action: 'Compare scenarios'
    },
    client: {
      prompt: 'Prepare a renewal brief using account history, usage, service events, and commercial terms.',
      answer: 'Renewal is supportable—with two issues resolved first.',
      findings: ['Usage expansion indicates durable value in the core workflow.', 'Two open service events create avoidable renewal friction.', 'The pricing exception sits outside the approved commercial boundary.'],
      evidence: '4 account systems', control: 'Pricing approval', action: 'Resolve service risk'
    },
    diligence: {
      prompt: 'Review this opportunity for diligence risks, missing evidence, and assumptions that could change the decision.',
      answer: 'The opportunity is plausible. Three assumptions carry the case.',
      findings: ['The demand case depends on customer concentration remaining stable.', 'Margin expansion is not supported without the modeled operating change.', 'The downside case lacks evidence for recovery timing and liquidity needs.'],
      evidence: '5 diligence files', control: 'Investment committee', action: 'Test downside case'
    }
  };

  function chooseScenario(input) {
    const normalized = input.toLowerCase();
    if (/capacity|supplier|operation|production|constraint|expansion/.test(normalized)) return promptLibrary.operations;
    if (/research|evidence|source|industry|market|trend/.test(normalized)) return promptLibrary.research;
    if (/client|renewal|customer|account|service|pricing/.test(normalized)) return promptLibrary.client;
    if (/diligence|investment|risk|deal|acquisition|finance/.test(normalized)) return promptLibrary.diligence;
    return {
      answer: 'Frame the decision before optimizing the answer.',
      findings: ['Define the decision owner and the commitment this analysis may influence.', 'Identify which evidence is approved, current, and material to the outcome.', 'Test the assumption most likely to change the recommendation.'],
      evidence: 'Context required', control: 'Owner not yet named', action: 'Define decision boundary'
    };
  }

  const demo = document.querySelector('[data-skar-ai-demo]');
  if (demo) {
    const form = demo.querySelector('[data-skar-ai-form]');
    const input = demo.querySelector('[data-skar-ai-input]');
    const submit = demo.querySelector('[data-ai-submit]');
    const response = demo.querySelector('[data-ai-response]');
    const stateLabel = demo.querySelector('[data-ai-state]');
    const question = demo.querySelector('[data-ai-question]');
    const answer = demo.querySelector('[data-ai-answer]');
    const findings = demo.querySelector('[data-ai-findings]');
    const evidence = demo.querySelector('[data-ai-evidence]');
    const control = demo.querySelector('[data-ai-control]');
    const action = demo.querySelector('[data-ai-action]');
    const count = demo.querySelector('[data-ai-count]');
    const runsLabel = demo.querySelector('[data-demo-runs]');
    let runs = 3;
    let timer = 0;

    const updateCount = () => { count.textContent = String(input.value.length); };
    input.addEventListener('input', updateCount);
    demo.querySelectorAll('[data-ai-prompt]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = promptLibrary[button.dataset.aiPrompt].prompt;
        updateCount();
        input.focus();
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const prompt = input.value.trim();
      if (!prompt || runs <= 0) {
        if (!prompt) input.focus();
        return;
      }
      window.clearTimeout(timer);
      const scenario = chooseScenario(prompt);
      response.dataset.state = 'thinking';
      stateLabel.textContent = 'RETRIEVING CONTEXT / TESTING ASSUMPTIONS';
      question.textContent = prompt;
      setOrbState('thinking');
      submit.disabled = true;
      submit.firstChild.textContent = 'Working… ';

      timer = window.setTimeout(() => {
        runs -= 1;
        response.dataset.state = 'ready';
        stateLabel.textContent = 'RESPONSE READY / HUMAN REVIEW REQUIRED';
        answer.textContent = scenario.answer;
        findings.innerHTML = scenario.findings.map((finding, index) => `<li><span>0${index + 1}</span>${finding}</li>`).join('');
        evidence.textContent = scenario.evidence;
        control.textContent = scenario.control;
        action.textContent = scenario.action;
        runsLabel.textContent = `${String(runs).padStart(2, '0')} ${runs === 1 ? 'RUN' : 'RUNS'} AVAILABLE`;
        setOrbState('ready');
        if (runs > 0) {
          submit.disabled = false;
          submit.firstChild.textContent = 'Run another brief ';
        } else {
          submit.disabled = true;
          submit.firstChild.textContent = 'Preview complete ';
        }
      }, reducedMotion ? 80 : 1150);
    });
  }

  const stackContent = {
    context: { index: '01 / CONTEXT', title: 'Know what the system is allowed to know.', copy: 'Connect only approved information, preserve source-level access, and retain the provenance required to examine an answer.', boundary: 'Source permissions', evidence: 'Citations retained' },
    intelligence: { index: '02 / INTELLIGENCE', title: 'Choose capability around the work.', copy: 'Use the model, retrieval pattern, prompt structure, and memory behavior that fit the task—without locking the operating system to one provider.', boundary: 'Task-specific behavior', evidence: 'Model evaluations' },
    tools: { index: '03 / TOOLS', title: 'Give intelligence a bounded way to work.', copy: 'Search, calculate, draft, and update through explicit tools whose inputs, outputs, permissions, and failure states can be observed.', boundary: 'Approved tool actions', evidence: 'Execution trace' },
    control: { index: '04 / CONTROL', title: 'Surround every workflow with proof and recovery.', copy: 'Evaluate representative work and edge conditions, enforce policy, monitor exceptions, and maintain a tested path to stop or recover the system.', boundary: 'Release thresholds', evidence: 'Logs + test suites' },
    authority: { index: '05 / AUTHORITY', title: 'Keep consequential judgment with people.', copy: 'Name who sets the objective, who reviews exceptions, and who owns the commitment. Automation expands only when the action is safely bounded.', boundary: 'Decision rights', evidence: 'Approval record' }
  };
  const stack = document.querySelector('[data-ai-stack]');
  if (stack) {
    const buttons = [...stack.querySelectorAll('[data-stack]')];
    const index = stack.querySelector('[data-stack-index]');
    const title = stack.querySelector('[data-stack-title]');
    const copy = stack.querySelector('[data-stack-copy]');
    const boundary = stack.querySelector('[data-stack-boundary]');
    const evidence = stack.querySelector('[data-stack-evidence]');
    buttons.forEach((button) => button.addEventListener('click', () => {
      const item = stackContent[button.dataset.stack];
      buttons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      index.textContent = item.index;
      title.textContent = item.title;
      copy.textContent = item.copy;
      boundary.textContent = item.boundary;
      evidence.textContent = item.evidence;
    }));
  }

  const revealItems = document.querySelectorAll('.skar-ai-intro>*,.skar-ai-demo-head>*,.skar-ai-work-grid>*,.skar-ai-system>*,.skar-ai-proof-grid>*,.skar-ai-edition-grid>*,.skar-ai-roadmap-list>article');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('skar-ai-motion');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }
})();
