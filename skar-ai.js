(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const promptLibrary = {
    onboarding: {
      prompt: 'Customer onboarding takes 18 days. Security review owns 11 of them, requests often arrive incomplete, and one director approves every exception.',
      state: 'BOTTLENECK IDENTIFIED', title: 'Security review is the limiting step.',
      summary: 'The delay is not spread evenly across onboarding. A single approval queue absorbs most elapsed time and receives avoidable rework from incomplete submissions.',
      findings: ['61% of total cycle time sits inside security review.', 'Incomplete intake creates a second pass through the same constrained queue.', 'One exception approver makes capacity fragile even when reviewer capacity is available.'],
      sources: ['Onboarding timestamps', 'Security review queue', 'Exception log'], evidence: 'High · 3 signals agree', control: 'Security operations lead', action: 'Pilot a complete-intake gate for 10 cases'
    },
    production: {
      prompt: 'Orders are arriving on time, but finished units keep missing ship dates. Inspection has a two-day queue and rework returns to the front of the line.',
      state: 'BOTTLENECK IDENTIFIED', title: 'Final inspection is constraining throughput.',
      summary: 'Upstream output is creating inventory faster than inspection can release it. Rework then competes with first-pass units for the same limited capacity.',
      findings: ['Work-in-process accumulates immediately before final inspection.', 'Inspection capacity is below the arrival rate during peak production.', 'Rework has no separate priority rule and amplifies the queue.'],
      sources: ['Production schedule', 'Inspection queue', 'Rework history'], evidence: 'High · flow pattern confirmed', control: 'Quality manager', action: 'Separate rework and first-pass queues for one week'
    },
    sales: {
      prompt: 'Qualified opportunities stall after the technical demo. Sales waits several days for solution engineering, and discovery notes are inconsistent.',
      state: 'LIKELY BOTTLENECK', title: 'The sales-to-engineering handoff is limiting conversion.',
      summary: 'Demand is present, but incomplete discovery and a shared specialist queue delay the next customer step at the highest-intent point in the process.',
      findings: ['Wait time begins immediately after the demo handoff.', 'Incomplete discovery increases clarification work for solution engineering.', 'The shared specialist pool has no prioritization based on deal readiness.'],
      sources: ['CRM stage history', 'Demo notes', 'Specialist calendar'], evidence: 'Medium-high · one data gap', control: 'Revenue operations', action: 'Test a readiness score on the next 15 demos'
    },
    support: {
      prompt: 'Support volume is stable, but resolution time keeps rising. Tier 1 closes simple issues while escalations wait for a small group of product experts.',
      state: 'BOTTLENECK IDENTIFIED', title: 'Expert escalation capacity is the constraint.',
      summary: 'The backlog is concentrated in complex escalations, not general ticket volume. Expert knowledge is scarce and repeatedly consumed by similar issues.',
      findings: ['Escalated tickets account for most open-ticket age.', 'A small expert group is assigned across multiple product areas.', 'Recurring escalation types are not converted into reusable resolution paths.'],
      sources: ['Ticket aging', 'Escalation roster', 'Issue taxonomy'], evidence: 'High · backlog concentrated', control: 'Support director', action: 'Create a guided resolution for the top escalation type'
    }
  };

  const fallbackScenario = (input) => {
    const normalized = input.toLowerCase();
    const hasApproval = /approv|sign.?off|director|manager|review/.test(normalized);
    const hasQueue = /wait|queue|backlog|delay|days|weeks|late|slow|stall/.test(normalized);
    const hasRework = /rework|incomplete|error|repeat|return|redo|clarif/.test(normalized);
    const constraint = hasApproval ? 'The approval handoff is the likely constraint.' : hasQueue ? 'The longest waiting queue is the likely constraint.' : hasRework ? 'Rework is consuming the system’s effective capacity.' : 'The limiting step needs one more flow signal.';
    return {
      state: hasApproval || hasQueue || hasRework ? 'LIKELY BOTTLENECK' : 'MORE FLOW DATA NEEDED',
      title: constraint,
      summary: hasApproval || hasQueue || hasRework
        ? 'The description points to a concentrated constraint rather than a system-wide capacity problem. Confirm it with timestamps before changing the broader process.'
        : 'SKAR AI can diagnose the constraint once the process includes an entry point, a delayed outcome, and the step where work waits or returns.',
      findings: [
        hasQueue ? 'Waiting time appears concentrated at one handoff or queue.' : 'Add the longest wait or queue in the process.',
        hasRework ? 'Rework is sending demand back through already limited capacity.' : 'Add whether work is returned, repeated, or arrives incomplete.',
        hasApproval ? 'Decision rights are concentrated with a single approval role.' : 'Add who owns the final release or approval.'
      ],
      sources: ['Your process description', 'Heuristic constraint scan'],
      evidence: hasApproval || hasQueue || hasRework ? 'Medium · needs timestamps' : 'Low · description incomplete',
      control: 'Process owner',
      action: hasApproval || hasQueue || hasRework ? 'Measure arrival rate and wait time for 10 cases' : 'Add queue, owner, and cycle-time detail'
    };
  };

  const chooseScenario = (input) => {
    const normalized = input.toLowerCase();
    if (/onboard|security review|implementation/.test(normalized)) return promptLibrary.onboarding;
    if (/production|inspection|manufactur|ship|rework/.test(normalized)) return promptLibrary.production;
    if (/sales|demo|opportunit|solution engineer|conversion/.test(normalized)) return promptLibrary.sales;
    if (/support|ticket|escalat|resolution/.test(normalized)) return promptLibrary.support;
    return null;
  };

  const requestModelScenario = async (prompt) => {
    const endpoint = String(window.SKAR_AI_ENDPOINT || document.querySelector('meta[name="skar-ai-endpoint"]')?.content || '').trim();
    if (!endpoint) return null;
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!result.ok) throw new Error(`SKAR AI endpoint returned ${result.status}`);
    const data = await result.json();
    if (!data || typeof data.title !== 'string' || typeof data.summary !== 'string') throw new Error('Invalid SKAR AI response');
    return {
      state: typeof data.state === 'string' ? data.state : 'ANSWER READY',
      title: data.title,
      summary: data.summary,
      findings: Array.isArray(data.findings) ? data.findings.slice(0, 5).map(String) : [],
      sources: Array.isArray(data.sources) ? data.sources.slice(0, 6).map(String) : ['SKAR AI secure endpoint'],
      evidence: typeof data.evidence === 'string' ? data.evidence : 'Model response',
      control: typeof data.control === 'string' ? data.control : 'Human review',
      action: typeof data.action === 'string' ? data.action : 'Review the answer'
    };
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

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const prompt = input.value.trim();
      if (!prompt) {
        input.focus();
        return;
      }

      window.clearTimeout(timer);
      shell.dataset.demoState = 'thinking';
      response.setAttribute('aria-busy', 'true');
      stateLabel.textContent = 'MAPPING THE FLOW';
      submit.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Working…';
      shell.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

      let scenario = chooseScenario(prompt);
      try {
        scenario = scenario || await requestModelScenario(prompt) || fallbackScenario(prompt);
      } catch (error) {
        scenario = {
          ...fallbackScenario(prompt),
          state: 'SECURE MODEL UNAVAILABLE',
          title: 'The secure diagnostic model could not be reached.',
          summary: 'The request was not sent again and no browser credential was exposed. Use a guided bottleneck scan while the secure endpoint is unavailable.',
          evidence: 'Endpoint connection failed',
          action: 'Use a guided scan'
        };
      }
      populateResponse(prompt, scenario);

      timer = window.setTimeout(() => {
        shell.dataset.demoState = 'ready';
        response.setAttribute('aria-busy', 'false');
        stateLabel.textContent = scenario.state || 'BRIEF READY · HUMAN REVIEW REQUIRED';
        submit.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Run scan';
      }, reducedMotion ? 80 : 850);
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
