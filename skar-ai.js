(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const promptLibrary = {
    operations: {
      prompt: 'Where is the proposed capacity expansion most exposed, and what requires human approval?',
      title: 'Stage the commitment—and preserve an exit path.',
      summary: 'The demand signal supports phased capacity. Supplier concentration and the timing of capital release make a single irreversible commitment unnecessarily exposed.',
      findings: [
        'Demand supports a staged release, with the second tranche tied to confirmed utilization.',
        'Supplier lead time is the material constraint; the demand forecast is not the limiting factor.',
        'Capital release and dependency concentration require named-owner approval before execution.'
      ],
      sources: ['Capacity plan · Q4', 'Supplier register', 'Demand forecast', 'Capital policy'],
      evidence: '4 approved operating sources',
      control: 'Capital gate · Operations lead',
      action: 'Review the phased option'
    },
    research: {
      prompt: 'What forces are changing industrial automation, and which conclusions are facts versus assumptions?',
      title: 'The direction is clear. The adoption curve is not.',
      summary: 'Connected operations, labor constraints, and falling deployment friction support continued adoption. Integration capacity remains the main source of uncertainty.',
      findings: [
        'Primary evidence supports continued investment in connected and increasingly adaptive operations.',
        'Labor availability and systems integration capacity constrain the rate of adoption.',
        'Scenario ranges should remain visible instead of collapsing into one confident forecast.'
      ],
      sources: ['Industry survey', 'Capital tracker', 'Labor outlook', 'Deployment benchmarks'],
      evidence: '6 reviewed source classes',
      control: 'Citations retained',
      action: 'Compare adoption scenarios'
    },
    client: {
      prompt: 'What could put this client renewal at risk, based on account history, usage, and service events?',
      title: 'Renewal is supportable—with two issues resolved first.',
      summary: 'Core usage is durable and adoption is broadening. Two open service events and an out-of-policy pricing request create avoidable renewal risk.',
      findings: [
        'Usage expansion indicates durable value in the customer’s primary workflow.',
        'Two unresolved reliability events are the strongest source of renewal friction.',
        'The proposed pricing exception sits outside the approved commercial boundary.'
      ],
      sources: ['CRM history', 'Product usage', 'Service events', 'Commercial terms'],
      evidence: '4 connected account systems',
      control: 'Pricing approval · Account lead',
      action: 'Resolve service risk first'
    },
    diligence: {
      prompt: 'Which assumptions carry this investment case, and what evidence would change the recommendation?',
      title: 'The opportunity is plausible. Three assumptions carry the case.',
      summary: 'The base case depends on stable customer concentration, a specific operating change, and an unproven recovery timeline in the downside scenario.',
      findings: [
        'The demand case depends on customer concentration remaining stable through the investment period.',
        'Margin expansion is not supported without the modeled operating change being delivered on time.',
        'The downside case lacks evidence for both recovery timing and interim liquidity needs.'
      ],
      sources: ['Investment memo', 'Customer cohort', 'Operating model', 'Downside case'],
      evidence: '5 diligence files',
      control: 'Investment committee',
      action: 'Test the downside case'
    }
  };

  const fallbackScenario = {
    title: 'Frame the decision before optimizing the answer.',
    summary: 'The question is useful, but the decision owner, evidence boundary, and commitment it may influence need to be explicit before the analysis can be relied upon.',
    findings: [
      'Name the decision owner and the commitment this analysis is intended to support.',
      'Identify which evidence is approved, current, and material to the outcome.',
      'Test the assumption most likely to change the recommendation.'
    ],
    sources: ['Decision brief required', 'Approved sources required'],
    evidence: 'Context required',
    control: 'Owner not yet named',
    action: 'Define the decision boundary'
  };

  const chooseScenario = (input) => {
    const normalized = input.toLowerCase();
    if (/capacity|supplier|operation|production|constraint|expansion/.test(normalized)) return promptLibrary.operations;
    if (/research|evidence|source|industry|market|trend|automation/.test(normalized)) return promptLibrary.research;
    if (/client|renewal|customer|account|service|pricing/.test(normalized)) return promptLibrary.client;
    if (/diligence|investment|risk|deal|acquisition|finance|assumption/.test(normalized)) return promptLibrary.diligence;
    return fallbackScenario;
  };

  const demo = document.querySelector('[data-skar-ai-demo]');
  if (demo) {
    const shell = demo.querySelector('.sai-answer-shell');
    const form = demo.querySelector('[data-skar-ai-form]');
    const input = demo.querySelector('[data-skar-ai-input]');
    const submit = demo.querySelector('[data-ai-submit]');
    const submitLabel = submit?.querySelector('span');
    const response = demo.querySelector('[data-ai-response]');
    const stateLabel = demo.querySelector('[data-ai-state]');
    const question = demo.querySelector('[data-ai-question]');
    const answer = demo.querySelector('[data-ai-answer]');
    const summary = demo.querySelector('[data-ai-summary]');
    const findings = demo.querySelector('[data-ai-findings]');
    const sources = demo.querySelector('[data-ai-sources]');
    const evidence = demo.querySelector('[data-ai-evidence]');
    const control = demo.querySelector('[data-ai-control]');
    const action = demo.querySelector('[data-ai-action]');
    const count = demo.querySelector('[data-ai-count]');
    const reset = demo.querySelector('[data-ai-reset]');
    let timer = 0;

    const updateCount = () => { if (count) count.textContent = String(input.value.length); };
    const populateResponse = (prompt, scenario) => {
      question.textContent = prompt;
      answer.textContent = scenario.title;
      summary.textContent = scenario.summary;
      findings.replaceChildren(...scenario.findings.map((finding, index) => {
        const item = document.createElement('li');
        const number = document.createElement('span');
        number.textContent = String(index + 1).padStart(2, '0');
        item.append(number, document.createTextNode(finding));
        return item;
      }));
      sources.replaceChildren(...scenario.sources.map((source) => {
        const chip = document.createElement('span');
        chip.textContent = source;
        return chip;
      }));
      evidence.textContent = scenario.evidence;
      control.textContent = scenario.control;
      action.textContent = scenario.action;
    };

    input.addEventListener('input', updateCount);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    demo.querySelectorAll('[data-ai-prompt]').forEach((button) => {
      button.addEventListener('click', () => {
        const scenario = promptLibrary[button.dataset.aiPrompt];
        input.value = scenario.prompt;
        updateCount();
        input.focus();
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const prompt = input.value.trim();
      if (!prompt) {
        input.focus();
        return;
      }

      window.clearTimeout(timer);
      const scenario = chooseScenario(prompt);
      populateResponse(prompt, scenario);
      shell.dataset.demoState = 'thinking';
      response.setAttribute('aria-busy', 'true');
      stateLabel.textContent = 'REVIEWING APPROVED CONTEXT';
      submit.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Working…';
      shell.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

      timer = window.setTimeout(() => {
        shell.dataset.demoState = 'ready';
        response.setAttribute('aria-busy', 'false');
        stateLabel.textContent = 'BRIEF READY · HUMAN REVIEW REQUIRED';
        submit.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Ask SKAR AI';
      }, reducedMotion ? 80 : 1050);
    });

    reset.addEventListener('click', () => {
      window.clearTimeout(timer);
      shell.dataset.demoState = 'idle';
      response.setAttribute('aria-busy', 'false');
      input.value = '';
      updateCount();
      window.setTimeout(() => input.focus(), 40);
    });
  }

  const stackContent = {
    context: {
      index: '01 / CONTEXT',
      title: 'Know what the system is allowed to know.',
      copy: 'Connect only approved information, preserve source-level access, and retain the provenance required to examine an answer.',
      boundary: 'Source permissions', evidence: 'Citations retained'
    },
    intelligence: {
      index: '02 / INTELLIGENCE',
      title: 'Choose capability around the work.',
      copy: 'Use the model, retrieval pattern, prompt structure, and memory behavior that fit the task without tying the operating system to one provider.',
      boundary: 'Task-specific behavior', evidence: 'Model evaluations'
    },
    tools: {
      index: '03 / TOOLS',
      title: 'Give intelligence a bounded way to work.',
      copy: 'Search, calculate, draft, and update through explicit tools whose inputs, outputs, permissions, and failure states can be observed.',
      boundary: 'Approved tool actions', evidence: 'Execution trace'
    },
    control: {
      index: '04 / CONTROL',
      title: 'Surround every workflow with proof and recovery.',
      copy: 'Evaluate representative work and edge conditions, enforce policy, monitor exceptions, and maintain a tested path to stop or recover the system.',
      boundary: 'Release thresholds', evidence: 'Logs and test suites'
    },
    authority: {
      index: '05 / AUTHORITY',
      title: 'Keep consequential judgment with people.',
      copy: 'Name who sets the objective, reviews exceptions, and owns the commitment. Automation expands only when the action is safely bounded.',
      boundary: 'Decision rights', evidence: 'Approval record'
    }
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
})();
