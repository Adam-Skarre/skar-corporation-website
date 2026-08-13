(() => {
  const app = document.querySelector('[data-ai-app]'); if (!app) return;
  const key = 'skar-ai-demo-threads-v2', list = app.querySelector('[data-thread-list]'), conversation = app.querySelector('[data-conversation]'), form = app.querySelector('[data-composer]'), input = app.querySelector('[data-input]'), counter = app.querySelector('[data-count]'), send = app.querySelector('[data-send]');
  let threads = [], activeId = null, thinking = false;
  try { threads = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { threads = []; }
  if (!Array.isArray(threads)) threads = [];
  const active = () => threads.find(thread => thread.id === activeId);
  const save = () => localStorage.setItem(key, JSON.stringify(threads.slice(0, 24)));
  const title = text => text.replace(/\s+/g, ' ').trim().split(' ').slice(0, 7).join(' ') || 'New conversation';
  const diagnose = prompt => {
    const text = prompt.toLowerCase(), quote = /quote|proposal|estimate/.test(text), rework = /rework|redo|error|return|defect|fabrication/.test(text), approval = /approv|review|sign.?off|manager|director/.test(text), queue = /queue|wait|delay|days|late|slow|stall|backlog/.test(text), measure = /measure|prove|metric|worked|verify/.test(text);
    if (measure) return 'Start with one flow metric and one outcome metric.\n\nFlow: measure end-to-end lead time, wait time at the suspected constraint, and work-in-process immediately before it.\n\nOutcome: choose the result the process exists to produce—on-time delivery, first-pass yield, conversion, or resolution time.\n\nRecord a baseline, change one operating rule, and compare the next 10–20 cases. A change worked only if the system-level outcome improves without moving the queue somewhere else.';
    if (quote) return 'The nine-day total is probably not nine days of work. It is likely a short amount of active estimating surrounded by waiting at handoffs.\n\nLikely constraint: technical or commercial approval after the quote is drafted.\n\nSeparate elapsed time into request intake, active estimating, technical review, pricing approval, and customer-ready release. For the next 10 quotes, timestamp entry and exit at each step.\n\nNext action: identify the step with the longest median wait—not the longest touch time—and test a complete-intake gate before adding capacity.';
    if (rework) return 'Rework is acting like hidden demand: every returned unit consumes capacity twice and competes with first-pass work.\n\nLikely constraint: the inspection or correction loop, especially if returned work re-enters the front of a shared queue.\n\nTrack first-pass yield, hours spent on repeat work, and queue age by reason code. Then separate first-pass and rework priority for one controlled week.\n\nSuccess signal: higher throughput and shorter total lead time without a rise in escaped defects.';
    if (approval) return 'The description points to concentrated decision rights rather than broad capacity loss.\n\nLikely constraint: a review or approval queue owned by too few people.\n\nMeasure arrival rate, median wait, exception frequency, and the percentage of submissions returned incomplete. Then define which decisions can be pre-approved, delegated, or accepted by rule.\n\nNext action: pilot a complete-intake checklist and delegated threshold on the next 10 cases.';
    if (queue) return 'Waiting appears concentrated, but the delayed step needs to be named before changing the process.\n\nMap five timestamps: work enters, active work begins, active work ends, approval begins, and the outcome is released. The largest gap is your first constraint candidate.\n\nNext action: sample 10 recent cases and calculate wait time versus touch time at every handoff. Improve the step controlling total throughput, not the busiest-looking team.';
    return 'I can help find the constraint, but I need three pieces of operating context:\n\n1. What enters the process?\n2. Where does work wait, repeat, or require approval?\n3. Which outcome is late, expensive, or unreliable?\n\nAdd rough volumes and elapsed times if you have them. Estimates are enough for a first diagnostic.';
  };
  const requestResponse = async prompt => {
    const endpoint = String(window.SKAR_AI_ENDPOINT || document.querySelector('meta[name="skar-ai-endpoint"]')?.content || '').trim();
    if (!endpoint) return diagnose(prompt);
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, threadId: activeId }) });
    if (!response.ok) throw new Error(`SKAR AI endpoint returned ${response.status}`);
    const payload = await response.json();
    const text = payload.answer || payload.message || payload.output;
    if (typeof text !== 'string' || !text.trim()) throw new Error('SKAR AI returned an invalid response');
    return text.trim();
  };
  const messageNode = message => { const node = document.createElement('article'); node.className = `ai-message ${message.role}`; const avatar = document.createElement('div'); avatar.className = 'ai-avatar'; avatar.textContent = 'S'; const body = document.createElement('div'); body.className = 'ai-message-body'; const text = document.createElement('p'); text.className = 'ai-message-text'; text.textContent = message.text; body.append(text); if (message.error) { const retry = document.createElement('button'); retry.className = 'ai-retry'; retry.textContent = 'Try again'; retry.addEventListener('click', () => submit(message.prompt)); body.append(retry); } node.append(avatar, body); return node; };
  const renderThreads = () => { list.replaceChildren(...threads.map(thread => { const row = document.createElement('div'); row.className = `ai-thread${thread.id === activeId ? ' is-active' : ''}`; const open = document.createElement('button'); open.textContent = thread.title; open.title = thread.title; open.addEventListener('click', () => { activeId = thread.id; render(); closeSidebar(); }); const remove = document.createElement('button'); remove.className = 'ai-thread-delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `Delete ${thread.title}`); remove.addEventListener('click', event => { event.stopPropagation(); threads = threads.filter(item => item.id !== thread.id); if (activeId === thread.id) activeId = threads[0]?.id || null; save(); render(); }); row.append(open, remove); return row; })); };
  const renderConversation = () => { const thread = active(); app.classList.toggle('has-thread', Boolean(thread)); if (!thread) { conversation.replaceChildren(); return; } conversation.replaceChildren(...thread.messages.map(messageNode)); if (thinking) { const node = document.createElement('article'); node.className = 'ai-message assistant'; node.innerHTML = '<div class="ai-avatar">S</div><div class="ai-message-body"><p class="ai-message-role">SKAR AI</p><div class="ai-thinking" aria-label="SKAR AI is thinking"><i></i><i></i><i></i></div></div>'; conversation.append(node); } requestAnimationFrame(() => { conversation.scrollTop = conversation.scrollHeight; }); };
  const render = () => { renderThreads(); renderConversation(); };
  const updateInput = () => { input.style.height = 'auto'; input.style.height = `${Math.min(170, input.scrollHeight)}px`; counter.textContent = `${input.value.length} / 1600`; };
  const closeSidebar = () => app.classList.remove('sidebar-open');
  const submit = async prompt => { if (!prompt || thinking) return; let thread = active(); if (!thread) { thread = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, title: title(prompt), messages: [] }; threads.unshift(thread); activeId = thread.id; } thread.messages.push({ role: 'user', text: prompt }); if (thread.messages.filter(item => item.role === 'user').length === 1) thread.title = title(prompt); input.value = ''; updateInput(); thinking = true; send.disabled = true; save(); render(); try { const answer = await requestResponse(prompt); const current = active(); if (current) current.messages.push({ role: 'assistant', text: answer }); } catch (error) { const current = active(); if (current) current.messages.push({ role: 'assistant', text: 'I could not reach the SKAR AI service. Your message remains in this browser and was not sent again.', error: true, prompt }); } finally { thinking = false; send.disabled = false; save(); render(); input.focus(); } };
  form.addEventListener('submit', event => { event.preventDefault(); submit(input.value.trim()); });
  input.addEventListener('input', updateInput); input.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); form.requestSubmit(); } });
  app.querySelectorAll('[data-starter]').forEach(button => button.addEventListener('click', () => submit(button.dataset.starter)));
  app.querySelector('[data-new-thread]').addEventListener('click', () => { activeId = null; thinking = false; render(); closeSidebar(); input.focus(); });
  app.querySelector('[data-sidebar-open]').addEventListener('click', () => app.classList.add('sidebar-open')); app.querySelector('[data-sidebar-close]').addEventListener('click', closeSidebar); app.querySelector('[data-scrim]').addEventListener('click', closeSidebar);
  const authDialog = app.querySelector('[data-auth-dialog]');
  const authFeedback = app.querySelector('[data-auth-feedback]');
  app.querySelectorAll('[data-open-auth]').forEach(button => button.addEventListener('click', () => authDialog.showModal()));
  app.querySelector('[data-close-auth]').addEventListener('click', () => authDialog.close());
  app.querySelector('[data-continue-guest]').addEventListener('click', () => { authDialog.close(); input.focus(); });
  app.querySelector('[data-google-signin]').addEventListener('click', () => {
    const authUrl = String(window.SKAR_GOOGLE_AUTH_URL || document.querySelector('meta[name="skar-google-auth-url"]')?.content || '').trim();
    if (authUrl) { window.location.assign(authUrl); return; }
    authFeedback.hidden = false;
    authFeedback.textContent = 'Google sign-in is ready for connection. Add the approved Google OAuth URL to the site configuration to enable account access.';
  });
  authDialog.addEventListener('click', event => { if (event.target === authDialog) authDialog.close(); });
  render(); updateInput();
})();
