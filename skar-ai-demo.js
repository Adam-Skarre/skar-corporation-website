(() => {
  const app = document.querySelector('[data-ai-app]'); if (!app) return;
  const key = 'skar-ai-threads-v3', list = app.querySelector('[data-thread-list]'), conversation = app.querySelector('[data-conversation]'), form = app.querySelector('[data-composer]'), input = app.querySelector('[data-input]'), counter = app.querySelector('[data-count]'), send = app.querySelector('[data-send]');
  let threads = [], activeId = null, thinking = false;
  try { threads = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { threads = []; }
  if (!Array.isArray(threads)) threads = [];
  const active = () => threads.find(thread => thread.id === activeId);
  const save = () => localStorage.setItem(key, JSON.stringify(threads.slice(0, 24)));
  const title = text => text.replace(/\s+/g, ' ').trim().split(' ').slice(0, 7).join(' ') || 'New conversation';
  const requestResponse = async messages => {
    const endpoint = String(window.SKAR_AI_ENDPOINT || document.querySelector('meta[name="skar-ai-endpoint"]')?.content || '').trim();
    if (!endpoint) throw new Error('SKAR AI endpoint is not configured');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `SKAR AI endpoint returned ${response.status}`);
    const text = payload.answer;
    if (typeof text !== 'string' || !text.trim()) throw new Error('SKAR AI returned an invalid response');
    return text.trim();
  };
  const messageNode = message => { const node = document.createElement('article'); node.className = `ai-message ${message.role}`; const avatar = document.createElement('div'); avatar.className = 'ai-avatar'; avatar.textContent = 'S'; const body = document.createElement('div'); body.className = 'ai-message-body'; const text = document.createElement('p'); text.className = 'ai-message-text'; text.textContent = message.text; body.append(text); if (message.error) { const retry = document.createElement('button'); retry.className = 'ai-retry'; retry.textContent = 'Try again'; retry.addEventListener('click', () => submit(message.prompt)); body.append(retry); } node.append(avatar, body); return node; };
  const renderThreads = () => { list.replaceChildren(...threads.map(thread => { const row = document.createElement('div'); row.className = `ai-thread${thread.id === activeId ? ' is-active' : ''}`; const open = document.createElement('button'); open.textContent = thread.title; open.title = thread.title; open.addEventListener('click', () => { activeId = thread.id; render(); closeSidebar(); }); const remove = document.createElement('button'); remove.className = 'ai-thread-delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `Delete ${thread.title}`); remove.addEventListener('click', event => { event.stopPropagation(); threads = threads.filter(item => item.id !== thread.id); if (activeId === thread.id) activeId = threads[0]?.id || null; save(); render(); }); row.append(open, remove); return row; })); };
  const renderConversation = () => { const thread = active(); app.classList.toggle('has-thread', Boolean(thread)); if (!thread) { conversation.replaceChildren(); return; } conversation.replaceChildren(...thread.messages.map(messageNode)); if (thinking) { const node = document.createElement('article'); node.className = 'ai-message assistant'; node.innerHTML = '<div class="ai-avatar">S</div><div class="ai-message-body"><p class="ai-message-role">SKAR AI</p><div class="ai-thinking" aria-label="SKAR AI is thinking"><i></i><i></i><i></i></div></div>'; conversation.append(node); } requestAnimationFrame(() => { conversation.scrollTop = conversation.scrollHeight; }); };
  const render = () => { renderThreads(); renderConversation(); };
  const updateInput = () => { input.style.height = 'auto'; input.style.height = `${Math.min(170, input.scrollHeight)}px`; counter.textContent = `${input.value.length} / 4000`; };
  const closeSidebar = () => app.classList.remove('sidebar-open');
  const submit = async prompt => { if (!prompt || thinking) return; let thread = active(); if (!thread) { thread = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, title: title(prompt), messages: [] }; threads.unshift(thread); activeId = thread.id; } thread.messages.push({ role: 'user', text: prompt }); if (thread.messages.filter(item => item.role === 'user').length === 1) thread.title = title(prompt); input.value = ''; updateInput(); thinking = true; send.disabled = true; save(); render(); try { const answer = await requestResponse(thread.messages.filter(message => !message.error)); const current = active(); if (current) current.messages.push({ role: 'assistant', text: answer }); } catch (error) { const current = active(); if (current) current.messages.push({ role: 'assistant', text: `SKAR AI is not available yet. ${error.message || 'The secure service could not be reached.'}`, error: true, prompt }); } finally { thinking = false; send.disabled = false; save(); render(); input.focus(); } };
  form.addEventListener('submit', event => { event.preventDefault(); submit(input.value.trim()); });
  input.addEventListener('input', updateInput); input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
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
