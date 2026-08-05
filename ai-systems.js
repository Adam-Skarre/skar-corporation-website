(() => {
  document.documentElement.classList.add('ai-enhanced');

  const animateCopy = elements => {
    elements.filter(Boolean).forEach(element => {
      if (typeof element.animate === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        element.animate(
          [{ opacity: .25, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' }
        );
      }
    });
  };

  const architecture = document.querySelector('[data-ai-architecture]');
  if (architecture) {
    const layerData = {
      workflow: {
        title: 'Purpose is the first control.',
        copy: 'Define the job, the trigger, the operating context, and the moment a person must take over before choosing a model.',
        input: 'Business request + context',
        control: 'Scope and success criteria',
        output: 'Bounded task definition'
      },
      information: {
        title: 'Information enters with boundaries.',
        copy: 'Retrieval, permissions, provenance, and protected data are designed as part of the workflow—not added after the prototype.',
        input: 'Approved sources',
        control: 'Identity + access policy',
        output: 'Traceable evidence set'
      },
      intelligence: {
        title: 'Capability follows the problem.',
        copy: 'Models, prompts, and tools are selected for the required reasoning, reliability, latency, and cost rather than for novelty.',
        input: 'Task + evidence',
        control: 'Tool and model limits',
        output: 'Structured options'
      },
      control: {
        title: 'The control plane stays awake.',
        copy: 'Evaluation, policy checks, monitoring, exception handling, and stop conditions make system behavior observable in production.',
        input: 'Events + thresholds',
        control: 'Release and runtime gates',
        output: 'Auditable system state'
      },
      ownership: {
        title: 'A person remains accountable.',
        copy: 'Named authority, review rules, escalation paths, and intervention rights keep judgment attached to consequential work.',
        input: 'Evidence + recommendation',
        control: 'Decision rights',
        output: 'Owned action'
      }
    };
    const overview = {
      title: 'One workflow. Five connected safeguards.',
      copy: 'Hover or select any layer to inspect its role. The full system remains visible because performance depends on the connections between layers.',
      input: 'Approved business evidence',
      control: 'Policy + human authority',
      output: 'Traceable action'
    };
    const fields = {
      title: architecture.querySelector('[data-architecture-title]'),
      copy: architecture.querySelector('[data-architecture-copy]'),
      input: architecture.querySelector('[data-architecture-input]'),
      control: architecture.querySelector('[data-architecture-control]'),
      output: architecture.querySelector('[data-architecture-output]')
    };
    let selectedLayer = null;

    const inspectLayer = (button, data) => {
      architecture.querySelectorAll('[data-architecture-layer]').forEach(item => {
        item.classList.toggle('is-inspected', item === button);
        item.setAttribute('aria-pressed', String(item === button && selectedLayer === item.dataset.architectureLayer));
      });
      Object.keys(fields).forEach(key => { fields[key].textContent = data[key]; });
      animateCopy(Object.values(fields));
    };
    const restoreArchitecture = () => {
      const selected = selectedLayer && architecture.querySelector(`[data-architecture-layer="${selectedLayer}"]`);
      inspectLayer(selected, selected ? layerData[selectedLayer] : overview);
    };

    architecture.querySelectorAll('[data-architecture-layer]').forEach(button => {
      const data = layerData[button.dataset.architectureLayer];
      button.addEventListener('pointerenter', () => inspectLayer(button, data));
      button.addEventListener('focus', () => inspectLayer(button, data));
      button.addEventListener('pointerleave', restoreArchitecture);
      button.addEventListener('blur', restoreArchitecture);
      button.addEventListener('click', () => {
        selectedLayer = selectedLayer === button.dataset.architectureLayer ? null : button.dataset.architectureLayer;
        restoreArchitecture();
      });
    });
  }

  const studio = document.querySelector('[data-ai-studio]');
  if (studio) {
    const workflows = {
      revenue: {
        trace: 'RUN / REV-204',
        title: 'Prepare a renewal brief before the account review.',
        copy: 'Combine approved customer history, product usage, service events, and commercial terms into a reviewable brief.',
        sources: ['CRM history', 'Product usage', 'Service record', 'Commercial terms'],
        result: 'Renewal brief assembled with risks, opportunities, and source links.',
        findings: ['Usage expansion detected', 'Two unresolved service issues', 'Pricing exception requires approval'],
        cycle: '< 15 min', gates: '01', evidence: '04 sources', owner: 'Revenue lead'
      },
      service: {
        trace: 'RUN / SRV-118',
        title: 'Triage a priority client request and prepare the response path.',
        copy: 'Interpret the request, retrieve the relevant account and policy context, and route the case without losing ownership.',
        sources: ['Client request', 'Account record', 'Service policy', 'Prior cases'],
        result: 'Case classified, response drafted, and specialist review requested.',
        findings: ['Priority threshold met', 'Policy exception detected', 'Named specialist is available'],
        cycle: '< 5 min', gates: '01', evidence: '04 sources', owner: 'Service manager'
      },
      operations: {
        trace: 'RUN / OPS-731',
        title: 'Investigate an unexpected loss of industrial throughput.',
        copy: 'Join operating signals, maintenance history, work orders, and process limits to isolate the probable constraint.',
        sources: ['Process historian', 'Work orders', 'Maintenance record', 'Operating limits'],
        result: 'Probable constraint isolated with a reversible inspection sequence.',
        findings: ['Pressure drift precedes loss', 'Maintenance interval exceeded', 'Shutdown is not yet warranted'],
        cycle: '< 10 min', gates: '02', evidence: '04 sources', owner: 'Operations lead'
      },
      finance: {
        trace: 'RUN / FIN-046',
        title: 'Screen a capital proposal before the investment committee.',
        copy: 'Compare the forecast, vendor evidence, downside assumptions, and policy requirements before a person commits capital.',
        sources: ['Financial model', 'Vendor proposals', 'Risk assumptions', 'Approval policy'],
        result: 'Investment memo assembled with sensitivities and unresolved diligence.',
        findings: ['Return hurdle clears baseline', 'Downside case is incomplete', 'Vendor concentration exceeds limit'],
        cycle: '< 30 min', gates: '02', evidence: '04 sources', owner: 'Investment sponsor'
      }
    };
    const fields = {
      trace: studio.querySelector('[data-studio-trace]'),
      title: studio.querySelector('[data-studio-title]'),
      copy: studio.querySelector('[data-studio-copy]'),
      result: studio.querySelector('[data-studio-result]'),
      cycle: studio.querySelector('[data-studio-cycle]'),
      gates: studio.querySelector('[data-studio-gates]'),
      evidence: studio.querySelector('[data-studio-evidence]'),
      owner: studio.querySelector('[data-studio-owner]')
    };
    const sourceList = studio.querySelector('[data-studio-sources]');
    const findingList = studio.querySelector('[data-studio-findings]');
    const flow = studio.querySelector('.ai-studio-flow');
    const state = studio.querySelector('.ai-result-state');
    let rerunTimer;

    const renderList = (container, items, type) => {
      container.replaceChildren(...items.map(item => {
        const element = document.createElement(type);
        if (type === 'span') {
          element.append(document.createTextNode(item));
          const status = document.createElement('b');
          status.textContent = 'Connected';
          element.append(status);
        } else {
          element.textContent = item;
        }
        return element;
      }));
    };
    const selectWorkflow = (key, button) => {
      const data = workflows[key];
      studio.querySelectorAll('[data-studio-tab]').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      Object.keys(fields).forEach(field => { fields[field].textContent = data[field]; });
      renderList(sourceList, data.sources, 'span');
      renderList(findingList, data.findings, 'li');
      animateCopy([...Object.values(fields), sourceList, findingList]);
      flow.classList.remove('is-running');
      requestAnimationFrame(() => flow.classList.add('is-running'));
      clearTimeout(rerunTimer);
      rerunTimer = setTimeout(() => flow.classList.remove('is-running'), 2300);
    };
    studio.querySelectorAll('[data-studio-tab]').forEach(button => button.addEventListener('click', () => selectWorkflow(button.dataset.studioTab, button)));
    studio.querySelector('[data-studio-run]')?.addEventListener('click', () => {
      clearTimeout(rerunTimer);
      flow.classList.remove('is-running');
      state.innerHTML = '<i></i> Workflow processing';
      requestAnimationFrame(() => flow.classList.add('is-running'));
      rerunTimer = setTimeout(() => {
        state.innerHTML = '<i></i> Ready for human review';
        flow.classList.remove('is-running');
      }, 2200);
    });
  }

  const problems = document.querySelector('[data-ai-problems]');
  if (problems) {
    const problemData = {
      knowledge: {
        index: '01', trace: 'CASE / KNOWLEDGE-01',
        title: 'Turn scattered knowledge into traceable decisions.',
        copy: 'Critical context is distributed across documents, systems, and people. Teams search repeatedly and still cannot see which evidence supports an answer.',
        signal: 'Search, rework, inconsistent answers', risk: 'Decisions lose context and provenance', start: 'One recurring research workflow',
        input: 'Scattered evidence', system: 'Approved retrieval + source trace', output: 'Reusable institutional context',
        outcomeTitle: 'Build a trusted knowledge layer.', outcomeCopy: 'Connect approved sources, preserve citations, and make uncertainty visible before a person uses the result.',
        measure: 'Answer quality + evidence trace', boundary: 'Source-level permissions', owner: 'Knowledge or process lead'
      },
      latency: {
        index: '02', trace: 'CASE / DECISION-02',
        title: 'Compress the distance between signal and action.',
        copy: 'Important decisions wait while people assemble updates, reconcile versions, and translate evidence into the format an owner can use.',
        signal: 'Slow synthesis and serial handoffs', risk: 'Action arrives after the operating window', start: 'One repeated decision cycle',
        input: 'Live signals + decision criteria', system: 'Continuous synthesis + exception routing', output: 'Decision-ready briefing',
        outcomeTitle: 'Create a living decision surface.', outcomeCopy: 'Keep evidence current, isolate material changes, and route a concise recommendation to the person with authority.',
        measure: 'Cycle time + decision readiness', boundary: 'Recommendation, not commitment', owner: 'Named decision owner'
      },
      exceptions: {
        index: '03', trace: 'CASE / EXCEPTION-03',
        title: 'Resolve the work a fixed rule cannot absorb.',
        copy: 'Operations slow when unusual requests, incomplete records, or changing conditions fall outside the standard process and require expert interpretation.',
        signal: 'Growing queues and manual triage', risk: 'Critical exceptions are treated like routine work', start: 'A high-volume exception queue',
        input: 'Event + operating history', system: 'Classification + bounded investigation', output: 'Prioritized resolution path',
        outcomeTitle: 'Turn exceptions into an observable queue.', outcomeCopy: 'Classify the event, gather the right context, propose a reversible next step, and escalate when confidence or authority runs out.',
        measure: 'Resolution time + escalation recall', boundary: 'Stop conditions + rollback', owner: 'Operations lead'
      },
      control: {
        index: '04', trace: 'CASE / CONTROL-04',
        title: 'Make policy executable and visible.',
        copy: 'Review effort grows when permissions, policies, and approval rules live outside the workflow and must be reconstructed after each action.',
        signal: 'Manual checks and incomplete audit trails', risk: 'Controls exist on paper but not in behavior', start: 'One high-friction control process',
        input: 'Policy + proposed action', system: 'Machine-readable gates + evidence log', output: 'Auditable approval path',
        outcomeTitle: 'Move controls into the operating loop.', outcomeCopy: 'Check identity, evidence, permissions, thresholds, and required approvals before an action can proceed.',
        measure: 'Policy adherence + audit completeness', boundary: 'Explicit permissions', owner: 'Business and control owners'
      },
      capacity: {
        index: '05', trace: 'CASE / CAPACITY-05',
        title: 'Scale expert judgment without hiding ownership.',
        copy: 'Specialists spend valuable time repeating research, formatting, comparison, and follow-up instead of applying judgment to consequential work.',
        signal: 'Expert bottlenecks and uneven quality', risk: 'Knowledge does not compound across the team', start: 'A repeatable expert workflow',
        input: 'Expert method + company context', system: 'Reusable agent pattern + review gate', output: 'Consistent first-pass work',
        outcomeTitle: 'Make expertise reusable—not anonymous.', outcomeCopy: 'Encode the repeatable method, preserve the expert’s standards, and keep a clear person accountable for the final output.',
        measure: 'Adoption + expert review time', boundary: 'Expert-owned release standard', owner: 'Functional expert'
      }
    };
    const fields = {
      index: problems.querySelector('[data-problem-index]'), trace: problems.querySelector('[data-problem-trace]'),
      title: problems.querySelector('[data-problem-title]'), copy: problems.querySelector('[data-problem-copy]'),
      signal: problems.querySelector('[data-problem-signal]'), risk: problems.querySelector('[data-problem-risk]'), start: problems.querySelector('[data-problem-start]'),
      input: problems.querySelector('[data-problem-input]'), system: problems.querySelector('[data-problem-system]'), output: problems.querySelector('[data-problem-output]'),
      outcomeTitle: problems.querySelector('[data-problem-outcome-title]'), outcomeCopy: problems.querySelector('[data-problem-outcome-copy]'),
      measure: problems.querySelector('[data-problem-measure]'), boundary: problems.querySelector('[data-problem-boundary]'), owner: problems.querySelector('[data-problem-owner]')
    };
    const field = problems.querySelector('[data-problem-field]');
    const tabs = [...problems.querySelectorAll('[data-problem-tab]')];
    const selectProblem = (key, button) => {
      const data = problemData[key];
      tabs.forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      Object.entries(fields).forEach(([name, element]) => { element.textContent = data[name]; });
      field.dataset.problemField = key;
      field.classList.remove('is-changing');
      requestAnimationFrame(() => field.classList.add('is-changing'));
      animateCopy(Object.values(fields));
    };
    tabs.forEach((button, index) => {
      button.tabIndex = index === 0 ? 0 : -1;
      button.addEventListener('click', () => selectProblem(button.dataset.problemTab, button));
      button.addEventListener('keydown', event => {
        let next = null;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        tabs[next].focus();
        selectProblem(tabs[next].dataset.problemTab, tabs[next]);
      });
    });
  }

  const authority = document.querySelector('[data-ai-authority]');
  if (authority) {
    const profiles = {
      assist: { index: '01 · Assist', title: 'Research brief', copy: 'AI retrieves, compares, and drafts. A person remains the author and reviews every output before use.', owner: 'Human retains', review: 'Every output', control: 'Source trace + review gate' },
      act: { index: '02 · Bounded action', title: 'Service routing', copy: 'AI can route a reversible case inside explicit limits while exceptions stop and escalate to the service owner.', owner: 'Delegated boundary', review: 'Exceptions + samples', control: 'Limits + rollback + audit' },
      recommend: { index: '03 · Recommend', title: 'Capital allocation', copy: 'AI forms and compares options, but a named executive sees the evidence, uncertainty, and tradeoffs before commitment.', owner: 'Named executive', review: 'Before commitment', control: 'Evidence + scenario review' },
      avoid: { index: '04 · Human only', title: 'Executive commitment', copy: 'When consequences are high and the decision cannot be safely reversed or observed, the responsible design is not to automate.', owner: 'Human only', review: 'Direct judgment', control: 'No delegated authority' }
    };
    const overview = { index: 'Portfolio view', title: 'Four postures. One explicit owner.', copy: 'Select a workflow to inspect why its authority boundary differs. Autonomy expands only when the action is observable, reversible, and safely bounded.', owner: 'Named business owner', review: 'Matched to consequence', control: 'Evidence, limits, and escalation' };
    const fields = {
      index: authority.querySelector('[data-authority-index]'), title: authority.querySelector('[data-authority-title]'), copy: authority.querySelector('[data-authority-copy]'), owner: authority.querySelector('[data-authority-owner]'), review: authority.querySelector('[data-authority-review]'), control: authority.querySelector('[data-authority-control]')
    };
    let selected = null;
    const render = (button, data) => {
      authority.querySelectorAll('[data-authority-node]').forEach(node => {
        node.classList.toggle('is-active', node === button);
        node.setAttribute('aria-pressed', String(node === button && selected === node.dataset.authorityNode));
      });
      Object.keys(fields).forEach(key => { fields[key].textContent = data[key]; });
      animateCopy(Object.values(fields));
    };
    const restore = () => {
      const button = selected && authority.querySelector(`[data-authority-node="${selected}"]`);
      render(button, button ? profiles[selected] : overview);
    };
    authority.querySelectorAll('[data-authority-node]').forEach(button => {
      button.addEventListener('pointerenter', () => render(button, profiles[button.dataset.authorityNode]));
      button.addEventListener('focus', () => render(button, profiles[button.dataset.authorityNode]));
      button.addEventListener('pointerleave', restore);
      button.addEventListener('blur', restore);
      button.addEventListener('click', () => { selected = selected === button.dataset.authorityNode ? null : button.dataset.authorityNode; restore(); });
    });
  }

  const evaluation = document.querySelector('[data-ai-evaluation]');
  if (evaluation) {
    const suites = {
      baseline: { score: 92, status: 'Ready with monitored release', summary: 'Representative tasks meet the defined quality and control thresholds.', badge: 'Conditional pass', badgeClass: 'is-pass', count: '240 cases', values: { quality: 96, policy: 100, escalation: 94, recovery: 89 }, logs: [['pass','Source citation retained','Pass'],['pass','Restricted action blocked','Pass'],['watch','Long-context exception','Watch'],['pass','Human escalation preserved','Pass']] },
      edge: { score: 83, status: 'Hold for two edge conditions', summary: 'Core behavior remains useful, but long-context and incomplete-record cases need remediation.', badge: 'Release hold', badgeClass: 'is-hold', count: '96 cases', values: { quality: 86, policy: 100, escalation: 91, recovery: 76 }, logs: [['watch','Incomplete record handled','Watch'],['pass','Duplicate input detected','Pass'],['fail','Long-context recovery','Fix'],['pass','Human escalation preserved','Pass']] },
      adversarial: { score: 76, status: 'Blocked pending control repair', summary: 'Prompt injection resistance and escalation recall are below the release standard.', badge: 'Release blocked', badgeClass: 'is-block', count: '128 cases', values: { quality: 82, policy: 91, escalation: 78, recovery: 81 }, logs: [['fail','Instruction override resisted','Fix'],['pass','Sensitive output redacted','Pass'],['watch','Tool abuse attempt blocked','Watch'],['fail','Escalation trigger retained','Fix']] },
      permissions: { score: 98, status: 'Permission boundary verified', summary: 'Unauthorized sources and actions are consistently denied while approved work continues.', badge: 'Control pass', badgeClass: 'is-pass', count: '84 cases', values: { quality: 94, policy: 100, escalation: 100, recovery: 97 }, logs: [['pass','Cross-role access denied','Pass'],['pass','Restricted tool blocked','Pass'],['pass','Audit record complete','Pass'],['pass','Owner escalation preserved','Pass']] }
    };
    const ring = evaluation.querySelector('[data-evaluation-ring]');
    const score = evaluation.querySelector('[data-evaluation-score]');
    const status = evaluation.querySelector('[data-evaluation-status]');
    const summary = evaluation.querySelector('[data-evaluation-summary]');
    const badge = evaluation.querySelector('[data-evaluation-badge]');
    const count = evaluation.querySelector('[data-evaluation-count]');
    const log = evaluation.querySelector('[data-evaluation-log]');
    const selectSuite = (key, button) => {
      const data = suites[key];
      evaluation.querySelectorAll('[data-evaluation-tab]').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      ring.style.setProperty('--score', data.score);
      score.textContent = data.score;
      status.textContent = data.status;
      summary.textContent = data.summary;
      badge.className = `ai-release-badge ${data.badgeClass}`;
      badge.innerHTML = `<i></i> ${data.badge}`;
      count.textContent = data.count;
      Object.entries(data.values).forEach(([metric, value]) => {
        evaluation.querySelector(`[data-metric-value="${metric}"]`).textContent = `${value}%`;
        evaluation.querySelector(`[data-metric-bar="${metric}"]`).style.setProperty('--value', `${value}%`);
      });
      log.replaceChildren(...data.logs.map(([stateClass, label, result]) => {
        const item = document.createElement('li');
        const marker = document.createElement('i'); marker.className = stateClass;
        const text = document.createElement('span'); text.textContent = label;
        const outcome = document.createElement('b'); outcome.textContent = result;
        item.append(marker, text, outcome);
        return item;
      }));
      animateCopy([ring, status, summary, badge, count, log]);
    };
    evaluation.querySelectorAll('[data-evaluation-tab]').forEach(button => button.addEventListener('click', () => selectSuite(button.dataset.evaluationTab, button)));
  }

  const horizon = document.querySelector('[data-ai-horizon]');
  if (horizon) {
    const horizonData = {
      now: {
        index: '01 / NOW', title: 'AI joins the workflow.',
        copy: 'Grounded assistants retrieve, compare, draft, and prepare work inside a defined business process.',
        capability: 'Context-aware assistance', control: 'Approved sources + human review', effect: 'Less search, rework, and handoff delay', owner: 'Author and decision owner',
        status: 'Assistance active / human review required'
      },
      coordinate: {
        index: '02 / EMERGING', title: 'Specialist agents begin to coordinate.',
        copy: 'A planner can divide a larger job among bounded research, analysis, and action agents while preserving one trace of the work.',
        capability: 'Multi-step agent coordination', control: 'Scoped tools + explicit handoffs', effect: 'Longer workflows move as one system', owner: 'Workflow owner and exception reviewer',
        status: 'Four specialists active / shared trace retained'
      },
      adaptive: {
        index: '03 / NEXT', title: 'Operating systems respond to live events.',
        copy: 'Agents monitor changing conditions, update context, and re-plan bounded work without waiting for every step to be manually initiated.',
        capability: 'Event-driven planning and action', control: 'Runtime policy + observability + rollback', effect: 'Operations become more responsive', owner: 'Objective, limits, and intervention owner',
        status: 'Live events connected / policy engine monitoring'
      },
      enduring: {
        index: '04 / ENDURING', title: 'Human judgment remains the consequential boundary.',
        copy: 'People continue to set objectives, resolve ambiguity, define acceptable risk, and own decisions whose consequences cannot be delegated away.',
        capability: 'Human–agent operating model', control: 'Authority + evaluation + intervention', effect: 'Capability scales without losing accountability', owner: 'Named human authority',
        status: 'Network active / consequential commitments human-owned'
      }
    };
    const fields = {
      index: horizon.querySelector('[data-horizon-index]'), title: horizon.querySelector('[data-horizon-title]'),
      copy: horizon.querySelector('[data-horizon-copy]'), capability: horizon.querySelector('[data-horizon-capability]'),
      control: horizon.querySelector('[data-horizon-control]'), effect: horizon.querySelector('[data-horizon-effect]'),
      owner: horizon.querySelector('[data-horizon-owner]'), status: horizon.querySelector('[data-horizon-status]')
    };
    const tabs = [...horizon.querySelectorAll('[data-horizon-tab]')];
    const selectHorizon = (key, button) => {
      const data = horizonData[key];
      horizon.dataset.horizonStage = key;
      tabs.forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      Object.entries(fields).forEach(([name, element]) => { element.textContent = data[name]; });
      horizon.querySelector('.ai-horizon-field').classList.remove('is-changing');
      requestAnimationFrame(() => horizon.querySelector('.ai-horizon-field').classList.add('is-changing'));
      animateCopy(Object.values(fields));
    };
    tabs.forEach((button, index) => {
      button.tabIndex = index === 0 ? 0 : -1;
      button.addEventListener('click', () => selectHorizon(button.dataset.horizonTab, button));
      button.addEventListener('keydown', event => {
        let next = null;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        tabs[next].focus();
        selectHorizon(tabs[next].dataset.horizonTab, tabs[next]);
      });
    });
  }

  const revealItems = document.querySelectorAll('.ai-os-head,.ai-os-figure,.ai-studio-head,.ai-studio-tabs,.ai-studio-console,.ai-problems-head,.ai-problems-tabs,.ai-problems-console,.ai-authority-head,.ai-authority-figure,.ai-evaluation-head,.ai-evaluation-console,.ai-evaluation-principles,.ai-horizon-head,.ai-horizon-console,.ai-delivery-head,.ai-delivery-rail');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealItems.forEach(item => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -5% 0px' });
  revealItems.forEach(item => observer.observe(item));
})();
