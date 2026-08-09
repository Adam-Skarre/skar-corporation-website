(() => {
  const lifecycle = document.querySelector('[data-eng-lifecycle]');
  if (!lifecycle) return;

  const stages = {
    frame: {
      index: '01 / FRAME',
      title: 'Define the decision before defining the work.',
      copy: 'Clarify the objective, operating context, decision owner, critical unknowns, and the evidence needed to move forward.',
      output: 'Technical decision brief',
      gate: 'Is the problem bounded well enough to engineer?',
      label: '01',
      status: 'DECISION BOUNDARY'
    },
    architect: {
      index: '02 / ARCHITECT',
      title: 'Shape functions and interfaces before details harden.',
      copy: 'Translate intent into a system structure, define functional allocation, expose interface ownership, and compare architectures against the governing measures.',
      output: 'System architecture baseline',
      gate: 'Does the structure satisfy the critical needs and constraints?',
      label: '02',
      status: 'FUNCTIONAL BASELINE'
    },
    analyze: {
      index: '03 / ANALYZE',
      title: 'Make behavior, margin, and uncertainty visible.',
      copy: 'Use calculations, models, simulation, and sensitivity studies to find the variables that govern performance and the conditions most likely to change the decision.',
      output: 'Performance and trade study',
      gate: 'Are the margins credible across the operating envelope?',
      label: '03',
      status: 'MODEL CORRELATION'
    },
    verify: {
      index: '04 / VERIFY',
      title: 'Connect every critical claim to evidence.',
      copy: 'Plan analysis, inspection, demonstration, and test as one verification system—with representative conditions, clear pass criteria, and disciplined anomaly closure.',
      output: 'Verification evidence set',
      gate: 'Is there sufficient evidence to release the next commitment?',
      label: '04',
      status: 'EVIDENCE CLOSURE'
    },
    deliver: {
      index: '05 / DELIVER',
      title: 'Engineer the path from design intent to repeatable output.',
      copy: 'Resolve producibility, process capability, supply constraints, quality controls, integration sequence, and operational readiness before scale amplifies the gaps.',
      output: 'Industrialization and release plan',
      gate: 'Can the system be built, integrated, and operated consistently?',
      label: '05',
      status: 'RELEASE READINESS'
    },
    learn: {
      index: '06 / LEARN',
      title: 'Turn operating evidence into a better technical basis.',
      copy: 'Capture field performance, maintenance demand, anomalies, configuration changes, and user feedback so the system—and the decisions around it—continue to improve.',
      output: 'In-service learning loop',
      gate: 'What has changed, and which assumption or requirement does it affect?',
      label: '06',
      status: 'OPERATIONAL FEEDBACK'
    }
  };

  const shell = lifecycle.querySelector('.eng-lifecycle-shell');
  const buttons = [...lifecycle.querySelectorAll('[data-eng-stage]')];
  const index = lifecycle.querySelector('[data-eng-index]');
  const title = lifecycle.querySelector('[data-eng-title]');
  const copy = lifecycle.querySelector('[data-eng-copy]');
  const output = lifecycle.querySelector('[data-eng-output]');
  const gate = lifecycle.querySelector('[data-eng-gate]');
  const graphicLabel = lifecycle.querySelector('[data-eng-graphic-label]');
  const graphicStatus = lifecycle.querySelector('[data-eng-graphic-status]');

  buttons.forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.engStage;
    const stage = stages[key];
    shell.dataset.stage = key;
    buttons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('is-active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    index.textContent = stage.index;
    title.textContent = stage.title;
    copy.textContent = stage.copy;
    output.textContent = stage.output;
    gate.textContent = stage.gate;
    graphicLabel.textContent = stage.label;
    graphicStatus.textContent = stage.status;
  }));
})();
