(() => {
  const app = document.querySelector('[data-ai-app]');
  if (!app) return;
  const storageKey = 'skar-ai-threads-v4';
  const list = app.querySelector('[data-thread-list]');
  const conversation = app.querySelector('[data-conversation]');
  const form = app.querySelector('[data-composer]');
  const input = app.querySelector('[data-input]');
  const counter = app.querySelector('[data-count]');
  const send = app.querySelector('[data-send]');
  const status = app.querySelector('[data-ai-status]');
  let threads = [], activeId = null, thinking = false;

  try { threads = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { threads = []; }
  if (!Array.isArray(threads)) threads = [];
  const active = () => threads.find(thread => thread.id === activeId);
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(threads.slice(0, 24))); } catch (_) {} };
  const makeTitle = text => text.replace(/\s+/g, ' ').trim().split(' ').slice(0, 7).join(' ') || 'New conversation';
  const setStatus = (label, mode = 'ready') => {
    if (!status) return;
    status.className = `ai-status is-${mode}`;
    status.querySelector('b').textContent = label;
  };

  const guidedResponse = prompt => {
    const lower = prompt.toLowerCase();
    let constraint = 'The decision is not yet tied to a clearly observed constraint.';
    let evidence = 'Record the start time, finish time, wait time, owner, and reason for delay for 10–20 recent cases.';
    let action = 'Choose one repeated decision cycle, establish a baseline, and test one reversible change for two weeks.';
    let measure = 'Track median cycle time, completion rate, and the share of cases requiring rework.';
    if (/quote|proposal|estimate|bid/.test(lower)) {
      constraint = 'Elapsed time is likely accumulating between preparation and review, not in the actual drafting work.';
      evidence = 'Timestamp request received, work started, draft completed, review requested, review completed, and quote sent.';
      action = 'Pilot two scheduled review windows each day and route complete quotes to the next window for two weeks.';
      measure = 'Compare median quote time, review wait time, and completion within 48 hours against the current baseline.';
    } else if (/rework|defect|scrap|fabrication|manufactur/.test(lower)) {
      constraint = 'Repeat work may be masking whether the primary loss begins in requirements, setup, execution, or inspection.';
      evidence = 'Classify the next 20 rework events by origin, detection point, hours lost, material lost, and responsible handoff.';
      action = 'Target the largest repeatable cause with one upstream check before work is released.';
      measure = 'Track first-pass yield, rework hours per job, and recurrence of the targeted cause.';
    } else if (/capacity|bottleneck|queue|throughput/.test(lower)) {
      constraint = 'The slowest resource may not be the true constraint if work is waiting for information, approval, or batching.';
      evidence = 'Measure arrival rate, active work time, queue time, utilization, and blocked time at each major step.';
      action = 'Protect the suspected constraint from incomplete work and test a smaller release batch for one operating cycle.';
      measure = 'Track throughput, queue age, blocked minutes, and work-in-process before and after the test.';
    } else if (/measure|prove|metric|success/.test(lower)) {
      constraint = 'A change cannot be evaluated until the operating outcome and comparison window are explicit.';
      evidence = 'Capture a baseline across enough normal cycles to show both the typical result and its variation.';
      action = 'Name one primary outcome, one guardrail, and one leading indicator before launching the change.';
      measure = 'Use the primary outcome for value, the guardrail for unintended harm, and the leading indicator for adoption.';
    } else if (/choose|compare|option|decision|invest/.test(lower)) {
      constraint = 'The options may be competing on features before the decision criteria and acceptable tradeoffs are explicit.';
      evidence = 'List the must-have outcome, constraints, reversible assumptions, cost range, timing, and failure consequence for each option.';
      action = 'Score the options against three to five weighted criteria, then test the most uncertain high-impact assumption.';
      measure = 'Track the evidence gained, downside reduced, and whether the ranking changes after the test.';
    }
    return `## Working diagnosis\n${constraint}\n\n## Evidence to collect\n- ${evidence}\n\n## Recommended next action\n- ${action}\n\n## Success signal\n- ${measure}\n\n## One question\nWhat part of this process currently has the clearest timestamps or ownership data?`;
  };

  const requestResponse = async messages => {
    const endpoint = String(window.SKAR_AI_ENDPOINT || document.querySelector('meta[name="skar-ai-endpoint"]')?.content || '').trim();
    if (!endpoint) return { text: guidedResponse(messages.at(-1)?.text || ''), mode: 'guided' };
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
      const payload = await response.json();
      if (!response.ok || typeof payload.answer !== 'string' || !payload.answer.trim()) throw new Error('Service unavailable');
      return { text: payload.answer.trim(), mode: 'live' };
    } catch (_) {
      return { text: guidedResponse(messages.at(-1)?.text || ''), mode: 'guided' };
    }
  };

  const renderRichText = (container, value) => {
    let bullets = null;
    value.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) { bullets = null; return; }
      if (line.startsWith('## ')) {
        const heading = document.createElement('h3'); heading.textContent = line.slice(3); container.append(heading); bullets = null;
      } else if (line.startsWith('- ')) {
        if (!bullets) { bullets = document.createElement('ul'); container.append(bullets); }
        const item = document.createElement('li'); item.textContent = line.slice(2); bullets.append(item);
      } else {
        const paragraph = document.createElement('p'); paragraph.className = 'ai-message-text'; paragraph.textContent = line; container.append(paragraph); bullets = null;
      }
    });
  };

  const messageNode = message => {
    const node = document.createElement('article'); node.className = `ai-message ${message.role}`;
    const avatar = document.createElement('div'); avatar.className = 'ai-avatar'; avatar.textContent = message.role === 'user' ? 'Y' : 'S';
    const body = document.createElement('div'); body.className = 'ai-message-body';
    if (message.role === 'assistant') {
      const meta = document.createElement('div'); meta.className = 'ai-answer-meta';
      const label = document.createElement('span'); label.textContent = message.mode === 'live' ? 'Live AI analysis' : 'Guided analysis';
      const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(message.text); copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1500); }
        catch (_) { copy.textContent = 'Unavailable'; }
      });
      meta.append(label, copy); body.append(meta); renderRichText(body, message.text);
    } else {
      const text = document.createElement('p'); text.className = 'ai-message-text'; text.textContent = message.text; body.append(text);
    }
    node.append(avatar, body); return node;
  };

  const renderThreads = () => {
    list.replaceChildren(...threads.map(thread => {
      const row = document.createElement('div'); row.className = `ai-thread${thread.id === activeId ? ' is-active' : ''}`;
      const open = document.createElement('button'); open.textContent = thread.title; open.title = thread.title;
      open.addEventListener('click', () => { activeId = thread.id; render(); closeSidebar(); });
      const remove = document.createElement('button'); remove.className = 'ai-thread-delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `Delete ${thread.title}`);
      remove.addEventListener('click', event => { event.stopPropagation(); threads = threads.filter(item => item.id !== thread.id); if (activeId === thread.id) activeId = threads[0]?.id || null; save(); render(); });
      row.append(open, remove); return row;
    }));
  };

  const renderConversation = () => {
    const thread = active(); app.classList.toggle('has-thread', Boolean(thread));
    if (!thread) { conversation.replaceChildren(); return; }
    conversation.replaceChildren(...thread.messages.map(messageNode));
    if (thinking) {
      const node = document.createElement('article'); node.className = 'ai-message assistant';
      node.innerHTML = '<div class="ai-avatar">S</div><div class="ai-message-body"><div class="ai-answer-meta"><span>Analyzing the decision</span></div><div class="ai-thinking" aria-label="SKAR AI is thinking"><i></i><i></i><i></i></div></div>';
      conversation.append(node);
    }
    requestAnimationFrame(() => { conversation.scrollTop = conversation.scrollHeight; });
  };
  const render = () => { renderThreads(); renderConversation(); };
  const updateInput = () => {
    input.style.height = 'auto'; input.style.height = `${Math.min(170, input.scrollHeight)}px`;
    counter.textContent = `${input.value.length} / 4000`; send.disabled = thinking || !input.value.trim();
  };
  const closeSidebar = () => app.classList.remove('sidebar-open');
  const submit = async prompt => {
    if (!prompt || thinking) return;
    let thread = active();
    if (!thread) { thread = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, title: makeTitle(prompt), messages: [] }; threads.unshift(thread); activeId = thread.id; }
    thread.messages.push({ role: 'user', text: prompt });
    if (thread.messages.filter(item => item.role === 'user').length === 1) thread.title = makeTitle(prompt);
    input.value = ''; thinking = true; updateInput(); save(); render();
    const result = await requestResponse(thread.messages);
    const current = active(); if (current) current.messages.push({ role: 'assistant', text: result.text, mode: result.mode });
    thinking = false; setStatus(result.mode === 'live' ? 'Live AI' : 'Guided mode', result.mode); save(); render(); updateInput(); input.focus();
  };

  form.addEventListener('submit', event => { event.preventDefault(); submit(input.value.trim()); });
  input.addEventListener('input', updateInput);
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  app.querySelectorAll('[data-starter]').forEach(button => button.addEventListener('click', () => submit(button.dataset.starter)));
  app.querySelector('[data-new-thread]').addEventListener('click', () => { activeId = null; thinking = false; render(); closeSidebar(); updateInput(); input.focus(); });
  app.querySelector('[data-sidebar-open]').addEventListener('click', () => app.classList.add('sidebar-open'));
  app.querySelector('[data-sidebar-close]').addEventListener('click', closeSidebar);
  app.querySelector('[data-scrim]').addEventListener('click', closeSidebar);
  setStatus('Ready', 'ready'); render(); updateInput();
})();
