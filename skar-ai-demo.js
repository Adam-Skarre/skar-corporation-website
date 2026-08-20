(() => {
  'use strict';
  const app = document.querySelector('[data-ai-app]');
  if (!app) return;

  const storageKey = 'skar-ai-workspaces-v5';
  const endpoint = String(window.SKAR_AI_ENDPOINT || document.querySelector('meta[name="skar-ai-endpoint"]')?.content || '').trim();
  const list = app.querySelector('[data-thread-list]');
  const conversation = app.querySelector('[data-conversation]');
  const form = app.querySelector('[data-composer]');
  const input = app.querySelector('[data-input]');
  const counter = app.querySelector('[data-count]');
  const send = app.querySelector('[data-send]');
  const modeSelect = app.querySelector('[data-mode]');
  const status = app.querySelector('[data-ai-status]');
  const fileInput = app.querySelector('[data-file-input]');
  const attachmentTray = app.querySelector('[data-attachment-tray]');
  const briefPane = app.querySelector('[data-brief-pane]');
  const briefTitle = app.querySelector('[data-brief-title]');
  const briefEmpty = app.querySelector('[data-brief-empty]');
  const briefContent = app.querySelector('[data-brief-content]');
  const briefState = app.querySelector('[data-brief-state]');
  const copyBrief = app.querySelector('[data-copy-brief]');
  const exportBrief = app.querySelector('[data-export-brief]');
  const panelToggle = app.querySelector('[data-panel-toggle]');
  const modeNames = { decision: 'Decision brief', plan: 'Action plan', compare: 'Options comparison', evidence: 'Evidence review' };
  let threads = [];
  let activeId = null;
  let thinking = false;
  let attachments = [];

  try { threads = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { threads = []; }
  if (!Array.isArray(threads)) threads = [];
  threads = threads.filter(thread => thread && Array.isArray(thread.messages));

  const active = () => threads.find(thread => thread.id === activeId);
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(threads.slice(0, 30))); } catch (_) {}
  };
  const makeTitle = text => text.replace(/\s+/g, ' ').trim().split(' ').slice(0, 7).join(' ') || 'Untitled workspace';
  const setStatus = (label, state = 'ready') => {
    status.className = `ai-status is-${state}`;
    status.querySelector('b').textContent = label;
  };

  const guidedResponse = (prompt, mode) => {
    const lower = prompt.toLowerCase();
    if (mode === 'compare') return `# Options comparison\n\n## Decision frame\nThe options should be compared against the outcome, constraints, reversibility, total operating cost, implementation time, and consequence of failure—not feature count alone.\n\n## Current evidence\n- The request names options but does not yet provide weighted decision criteria.\n- Cost, adoption effort, and operational ownership should be evaluated on the same time horizon.\n\n## Assumptions to test\n- The current workflow cannot meet the desired outcome with a smaller process change.\n- Each option can integrate with the systems and controls that matter.\n\n## Recommended next action\nDefine three to five weighted criteria, score each option with cited evidence, and test the highest-impact uncertain assumption before committing.\n\n## One question\nWhat outcome must the selected option improve, and what tradeoff is unacceptable?`;
    if (mode === 'plan') return `# Action plan\n\n## Objective\nTurn the stated goal into a bounded operating test with one accountable owner and a measurable result.\n\n## Work sequence\n1. Establish the current baseline and define the operating boundary.\n2. Name the owner, contributors, approval point, and review cadence.\n3. Run the smallest reversible intervention that can produce useful evidence.\n4. Compare the result with the baseline and decide whether to stop, revise, or scale.\n\n## Risks and dependencies\n- An unclear baseline can make activity look like improvement.\n- Shared ownership can delay decisions and obscure accountability.\n- A test that changes several variables at once will be difficult to interpret.\n\n## Success signal\nUse one primary outcome, one guardrail, and one leading indicator.\n\n## One question\nWho can own this plan through a complete decision cycle?`;
    if (mode === 'evidence') return `# Evidence review\n\n## What the material supports\nThe current description suggests a real operating concern, but it does not yet establish causation or the size of the opportunity.\n\n## Facts and observations\n- The stated outcome and elapsed time can be treated as observations if they come from recorded cases.\n- Explanations for why the outcome occurs remain hypotheses until timestamps, records, or direct observations support them.\n\n## Gaps and contradictions\n- The comparison period and sample size are not stated.\n- Ownership, exceptions, and rework are not yet visible.\n\n## Verification plan\nReview 10–20 representative cases, preserve source dates, separate touch time from wait time, and document exceptions before drawing a firm conclusion.\n\n## One question\nWhich claim in this decision would be most costly if it were wrong?`;

    let conclusion = 'The decision is not yet tied to a clearly observed constraint.';
    let evidence = 'Record the start, finish, waiting time, owner, and reason for delay for 10–20 recent cases.';
    let action = 'Choose one repeated decision cycle, establish a baseline, and test one reversible change for two weeks.';
    if (/quote|proposal|estimate|bid/.test(lower)) {
      conclusion = 'Elapsed time is likely accumulating between preparation and technical review rather than in drafting.';
      evidence = 'Timestamp request received, drafting started, draft completed, review requested, review completed, and quote sent.';
      action = 'Pilot two scheduled review windows each day and route complete quotes to the next window for two weeks.';
    } else if (/rework|defect|scrap|fabrication|manufactur/.test(lower)) {
      conclusion = 'Repeat work may be consuming effective capacity, but the point of origin still needs to be separated from the point of detection.';
      evidence = 'Classify the next 20 rework events by origin, detection point, hours lost, material lost, and handoff.';
      action = 'Target the largest repeatable cause with one upstream release check.';
    } else if (/capacity|bottleneck|queue|throughput|delay/.test(lower)) {
      conclusion = 'The longest visible queue is the leading constraint candidate, but blocked time and incomplete work could be driving it.';
      evidence = 'Measure arrival rate, touch time, queue time, utilization, blocked time, and rework at each major step.';
      action = 'Protect the suspected constraint from incomplete work and test a smaller release batch for one operating cycle.';
    }
    return `# Working decision brief\n\n## Working conclusion\n${conclusion}\n\n## Evidence to collect\n- ${evidence}\n\n## Assumptions\n- The described cases are representative of normal work.\n- The observed delay is concentrated rather than evenly distributed.\n\n## Recommended next action\n- ${action}\n\n## Success signal\nCompare median cycle time, completion rate, and rework against the current baseline.\n\n## One question\nWhat part of this process has the clearest timestamps or ownership data?`;
  };

  const serviceMessages = messages => messages.map(message => {
    let text = message.text;
    if (message.role === 'user' && Array.isArray(message.attachments) && message.attachments.length) {
      const context = message.attachments.map(file => `--- ${file.name} ---\n${file.content}`).join('\n\n');
      text += `\n\nAttached reference material:\n${context}`;
    }
    return { role: message.role, text };
  });

  const requestResponse = async (messages, mode) => {
    if (!endpoint) return { text: guidedResponse(messages.at(-1)?.text || '', mode), source: 'guided' };
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, messages: serviceMessages(messages) })
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.answer !== 'string' || !payload.answer.trim()) throw new Error(payload.error || 'Service unavailable');
      return { text: payload.answer.trim(), source: 'live' };
    } catch (_) {
      return { text: guidedResponse(messages.at(-1)?.text || '', mode), source: 'guided' };
    }
  };

  const appendRichText = (container, value) => {
    let listNode = null;
    let listType = '';
    value.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) { listNode = null; listType = ''; return; }
      if (line.startsWith('# ')) {
        const heading = document.createElement('h2'); heading.textContent = line.slice(2); container.append(heading); listNode = null;
      } else if (line.startsWith('## ')) {
        const heading = document.createElement('h3'); heading.textContent = line.slice(3); container.append(heading); listNode = null;
      } else if (/^\d+\.\s/.test(line)) {
        if (!listNode || listType !== 'ol') { listNode = document.createElement('ol'); listType = 'ol'; container.append(listNode); }
        const item = document.createElement('li'); item.textContent = line.replace(/^\d+\.\s/, ''); listNode.append(item);
      } else if (line.startsWith('- ')) {
        if (!listNode || listType !== 'ul') { listNode = document.createElement('ul'); listType = 'ul'; container.append(listNode); }
        const item = document.createElement('li'); item.textContent = line.slice(2); listNode.append(item);
      } else {
        const paragraph = document.createElement('p'); paragraph.textContent = line; container.append(paragraph); listNode = null; listType = '';
      }
    });
  };

  const messageNode = message => {
    const node = document.createElement('article');
    node.className = `ai-message ${message.role}`;
    const avatar = document.createElement('div'); avatar.className = 'ai-avatar'; avatar.textContent = message.role === 'user' ? 'Y' : 'S';
    const body = document.createElement('div'); body.className = 'ai-message-body';
    if (message.role === 'assistant') {
      const meta = document.createElement('div'); meta.className = 'ai-answer-meta';
      const label = document.createElement('span'); label.textContent = message.source === 'live' ? 'Secure AI analysis' : 'Guided local analysis';
      const actions = document.createElement('div');
      const open = document.createElement('button'); open.type = 'button'; open.textContent = 'Open brief';
      open.addEventListener('click', () => { showArtifact(message); app.classList.add('brief-open'); panelToggle.setAttribute('aria-expanded', 'true'); });
      const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy';
      copy.addEventListener('click', () => copyText(message.text, copy));
      actions.append(open, copy); meta.append(label, actions); body.append(meta); appendRichText(body, message.text);
    } else {
      const text = document.createElement('p'); text.textContent = message.text; body.append(text);
      if (Array.isArray(message.attachments) && message.attachments.length) {
        const files = document.createElement('div'); files.className = 'ai-message-files';
        message.attachments.forEach(file => { const chip = document.createElement('span'); chip.textContent = file.name; files.append(chip); });
        body.append(files);
      }
    }
    node.append(avatar, body);
    return node;
  };

  const copyText = async (text, button) => {
    try {
      await navigator.clipboard.writeText(text);
      const original = button.textContent; button.textContent = 'Copied';
      setTimeout(() => { button.textContent = original; }, 1400);
    } catch (_) { button.textContent = 'Unavailable'; }
  };

  const latestAnswer = thread => [...(thread?.messages || [])].reverse().find(message => message.role === 'assistant');
  const showArtifact = message => {
    const thread = active();
    briefTitle.textContent = modeNames[thread?.mode || modeSelect.value] || 'Working brief';
    briefContent.replaceChildren();
    if (!message) {
      briefEmpty.hidden = false; briefContent.hidden = true; briefState.textContent = 'Waiting for analysis'; copyBrief.disabled = true; exportBrief.disabled = true; return;
    }
    briefEmpty.hidden = true; briefContent.hidden = false; appendRichText(briefContent, message.text);
    briefState.textContent = message.source === 'live' ? 'Prepared by secure SKAR AI · Human review required' : 'Prepared in guided mode · Human review required';
    copyBrief.disabled = false; exportBrief.disabled = false;
  };

  const renderThreads = () => {
    list.replaceChildren(...threads.map(thread => {
      const row = document.createElement('div'); row.className = `ai-thread${thread.id === activeId ? ' is-active' : ''}`;
      const open = document.createElement('button');
      const marker = document.createElement('i'); marker.textContent = (modeNames[thread.mode] || 'Decision').charAt(0);
      const label = document.createElement('span'); label.textContent = thread.title; open.title = thread.title; open.append(marker, label);
      open.addEventListener('click', () => { activeId = thread.id; modeSelect.value = thread.mode || 'decision'; render(); closeSidebar(); });
      const remove = document.createElement('button'); remove.className = 'ai-thread-delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `Delete ${thread.title}`);
      remove.addEventListener('click', event => { event.stopPropagation(); threads = threads.filter(item => item.id !== thread.id); if (activeId === thread.id) activeId = threads[0]?.id || null; save(); render(); });
      row.append(open, remove); return row;
    }));
  };

  const renderConversation = () => {
    const thread = active();
    app.classList.toggle('has-thread', Boolean(thread));
    if (!thread) { conversation.replaceChildren(); showArtifact(null); return; }
    conversation.replaceChildren(...thread.messages.map(messageNode));
    if (thinking) {
      const node = document.createElement('article'); node.className = 'ai-message assistant';
      const avatar = document.createElement('div'); avatar.className = 'ai-avatar'; avatar.textContent = 'S';
      const body = document.createElement('div'); body.className = 'ai-message-body';
      const meta = document.createElement('div'); meta.className = 'ai-answer-meta'; meta.innerHTML = '<span>Structuring the work</span>';
      const progress = document.createElement('div'); progress.className = 'ai-thinking'; progress.innerHTML = '<i></i><i></i><i></i><b>Reviewing context, evidence, and constraints</b>';
      body.append(meta, progress); node.append(avatar, body); conversation.append(node);
    }
    showArtifact(latestAnswer(thread));
    requestAnimationFrame(() => { conversation.scrollTop = conversation.scrollHeight; });
  };

  const renderAttachments = () => {
    attachmentTray.replaceChildren(...attachments.map((file, index) => {
      const chip = document.createElement('span'); chip.textContent = file.name;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.addEventListener('click', () => { attachments.splice(index, 1); renderAttachments(); });
      chip.append(remove); return chip;
    }));
    attachmentTray.classList.toggle('has-files', Boolean(attachments.length));
  };

  const render = () => { renderThreads(); renderConversation(); };
  const updateInput = () => {
    input.style.height = 'auto'; input.style.height = `${Math.min(190, input.scrollHeight)}px`;
    counter.textContent = `${input.value.length} / 6000`; send.disabled = thinking || !input.value.trim();
  };
  const closeSidebar = () => app.classList.remove('sidebar-open');

  const submit = async prompt => {
    if (!prompt || thinking) return;
    let thread = active();
    if (!thread) {
      thread = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, title: makeTitle(prompt), mode: modeSelect.value, messages: [] };
      threads.unshift(thread); activeId = thread.id;
    }
    thread.mode = modeSelect.value;
    thread.messages.push({ role: 'user', text: prompt, attachments: attachments.map(file => ({ ...file })) });
    if (thread.messages.filter(item => item.role === 'user').length === 1) thread.title = makeTitle(prompt);
    attachments = []; renderAttachments(); input.value = ''; thinking = true; updateInput(); save(); render();
    const result = await requestResponse(thread.messages, thread.mode);
    const current = active(); if (current) current.messages.push({ role: 'assistant', text: result.text, source: result.source });
    thinking = false; setStatus(result.source === 'live' ? 'Secure AI online' : 'Guided mode', result.source); save(); render(); updateInput(); input.focus();
    if (innerWidth <= 980) panelToggle.hidden = false;
  };

  const readFiles = async files => {
    const incoming = [...files].slice(0, Math.max(0, 3 - attachments.length));
    for (const file of incoming) {
      if (file.size > 50000) { setStatus(`${file.name} is over 50 KB`, 'error'); continue; }
      try {
        const content = (await file.text()).slice(0, 12000);
        const total = attachments.reduce((sum, item) => sum + item.content.length, 0);
        if (total + content.length > 18000) { setStatus('Attached text is over the 18,000 character limit', 'error'); break; }
        attachments.push({ name: file.name, content });
      } catch (_) { setStatus(`Could not read ${file.name}`, 'error'); }
    }
    fileInput.value = ''; renderAttachments(); input.focus();
  };

  const checkService = async () => {
    if (!endpoint) { setStatus('Guided mode', 'guided'); return; }
    try {
      const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error();
      setStatus('Secure AI online', 'live');
    } catch (_) { setStatus('Guided mode available', 'guided'); }
  };

  form.addEventListener('submit', event => { event.preventDefault(); submit(input.value.trim()); });
  input.addEventListener('input', updateInput);
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  fileInput.addEventListener('change', () => readFiles(fileInput.files));
  modeSelect.addEventListener('change', () => { const thread = active(); if (thread && !thread.messages.length) thread.mode = modeSelect.value; briefTitle.textContent = modeNames[modeSelect.value]; });
  app.querySelectorAll('[data-starter]').forEach(button => button.addEventListener('click', () => { if (button.dataset.modeStarter) modeSelect.value = button.dataset.modeStarter; submit(button.dataset.starter); }));
  app.querySelector('[data-new-thread]').addEventListener('click', () => { activeId = null; thinking = false; attachments = []; renderAttachments(); render(); closeSidebar(); updateInput(); input.focus(); });
  app.querySelector('[data-sidebar-open]').addEventListener('click', () => app.classList.add('sidebar-open'));
  app.querySelector('[data-sidebar-close]').addEventListener('click', closeSidebar);
  app.querySelector('[data-scrim]').addEventListener('click', closeSidebar);
  panelToggle.addEventListener('click', () => { const open = app.classList.toggle('brief-open'); panelToggle.setAttribute('aria-expanded', String(open)); });
  app.querySelector('[data-panel-close]').addEventListener('click', () => { app.classList.remove('brief-open'); panelToggle.setAttribute('aria-expanded', 'false'); });
  copyBrief.addEventListener('click', () => { const message = latestAnswer(active()); if (message) copyText(message.text, copyBrief); });
  exportBrief.addEventListener('click', () => {
    const thread = active(); const message = latestAnswer(thread); if (!message) return;
    const header = `# ${thread.title}\n\n${modeNames[thread.mode] || 'SKAR AI brief'} · ${new Date().toLocaleDateString()}\n\n`;
    const blob = new Blob([header + message.text + '\n\n---\nPrepared with SKAR AI. Human review required.\n'], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${thread.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'skar-ai-brief'}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  if (threads[0]) { activeId = threads[0].id; modeSelect.value = threads[0].mode || 'decision'; }
  render(); renderAttachments(); updateInput(); checkService();
})();
