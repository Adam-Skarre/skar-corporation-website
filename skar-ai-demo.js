(() => {
  'use strict';
  const app = document.querySelector('[data-ai-app]');
  if (!app) return;

  const endpoint = String(document.querySelector('meta[name="skar-ai-endpoint"]')?.content || '').trim();
  const askView = app.querySelector('[data-ask-view]');
  const thinkingView = app.querySelector('[data-thinking-view]');
  const resultView = app.querySelector('[data-result-view]');
  const form = app.querySelector('[data-ask-form]');
  const input = app.querySelector('[data-ask-input]');
  const submit = app.querySelector('[data-ask-submit]');
  const count = app.querySelector('[data-count]');
  const thinkingLabel = app.querySelector('[data-thinking-label]');
  const conversation = app.querySelector('[data-conversation]');
  const inlineThinking = app.querySelector('[data-inline-thinking]');
  const followupForm = app.querySelector('[data-followup-form]');
  const followupInput = app.querySelector('[data-followup-input]');
  const followupSubmit = app.querySelector('[data-followup-submit]');
  const followupCount = app.querySelector('[data-followup-count]');
  const errorBox = app.querySelector('[data-ask-error]');
  const resultArticles = app.querySelector('[data-result-articles]');
  let thinkingTimer = 0;
  let busy = false;
  let messages = [];

  const articles = [
    { title: 'Before the Dashboard', type: 'Manufacturing systems', href: '/report-manufacturing-readiness/', keys: /manufactur|factory|dashboard|readiness|digital|data|operations?/ },
    { title: 'AI Adoption Gap', type: 'Business technology', href: '/report-ai-adoption/', keys: /\bai\b|artificial intelligence|adoption|workflow|automation|technology/ },
    { title: 'The Next Operating System of Industry', type: 'Industry 4.0', href: '/report-industry-4-0/', keys: /industry|manufactur|connected|automation|sensor|factory|operating system/ },
    { title: 'Planning for Load Growth', type: 'Energy & infrastructure', href: '/report-data-center-demand/', keys: /energy|electric|power|grid|load|data.?center|infrastructure/ }
  ];

  const appendMarkdown = (container, value) => {
    container.replaceChildren();
    let list = null;
    value.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) { list = null; return; }
      if (line.startsWith('### ')) {
        const h4 = document.createElement('h4'); h4.textContent = line.slice(4); container.append(h4); list = null;
      } else if (line.startsWith('## ')) {
        const h3 = document.createElement('h3'); h3.textContent = line.slice(3); container.append(h3); list = null;
      } else if (line.startsWith('# ')) {
        const h2 = document.createElement('h2'); h2.textContent = line.slice(2); container.append(h2); list = null;
      } else if (/^[-*] /.test(line)) {
        if (!list || list.tagName !== 'UL') { list = document.createElement('ul'); container.append(list); }
        const item = document.createElement('li'); item.textContent = line.slice(2); list.append(item);
      } else if (/^\d+\. /.test(line)) {
        if (!list || list.tagName !== 'OL') { list = document.createElement('ol'); container.append(list); }
        const item = document.createElement('li'); item.textContent = line.replace(/^\d+\. /, ''); list.append(item);
      } else {
        const paragraph = document.createElement('p'); paragraph.textContent = line.replace(/\*\*/g, ''); container.append(paragraph); list = null;
      }
    });
  };

  const renderConversation = () => {
    conversation.replaceChildren();
    messages.forEach(message => {
      const turn = document.createElement('section');
      turn.className = `ask-turn ask-turn-${message.role}`;
      const label = document.createElement('span');
      label.textContent = message.role === 'user' ? 'YOU' : 'SKAR AI';
      const body = document.createElement('div');
      if (message.role === 'assistant') appendMarkdown(body, message.text);
      else { const paragraph = document.createElement('p'); paragraph.textContent = message.text; body.append(paragraph); }
      turn.append(label, body);
      conversation.append(turn);
    });
  };

  const relevantArticles = question => {
    const matches = articles.filter(article => article.keys.test(question.toLowerCase()));
    return [...matches, ...articles.filter(article => !matches.includes(article))].slice(0, 3);
  };

  const showArticles = question => {
    resultArticles.replaceChildren();
    relevantArticles(question).forEach(article => {
      const link = document.createElement('a'); link.href = article.href;
      const type = document.createElement('span'); type.textContent = article.type;
      const title = document.createElement('strong'); title.textContent = article.title;
      const arrow = document.createElement('i'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '→';
      link.append(type, title, arrow); resultArticles.append(link);
    });
  };

  const requestAnswer = async () => {
    if (!endpoint) throw new Error('The live AI endpoint has not been configured.');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'conversation', messages })
    });
    let payload = {};
    try { payload = await response.json(); } catch (_) { /* use the service error below */ }
    if (!response.ok || typeof payload.answer !== 'string' || !payload.answer.trim()) {
      throw new Error(typeof payload.error === 'string' ? payload.error : 'SKAR AI could not complete that response.');
    }
    return payload.answer.trim();
  };

  const showThinking = () => {
    askView.hidden = true; resultView.hidden = true; thinkingView.hidden = false;
    const labels = ['Reading your question', 'Reasoning through the context', 'Preparing a useful answer'];
    let index = 0;
    thinkingLabel.textContent = labels[0];
    clearInterval(thinkingTimer);
    thinkingTimer = setInterval(() => { index = (index + 1) % labels.length; thinkingLabel.textContent = labels[index]; }, 720);
  };

  const showResult = latestQuestion => {
    clearInterval(thinkingTimer);
    renderConversation();
    showArticles(latestQuestion);
    thinkingView.hidden = true;
    askView.hidden = true;
    resultView.hidden = false;
  };

  const showError = message => {
    errorBox.textContent = `${message} The live model must be connected before SKAR AI can answer; no canned response has been substituted.`;
    errorBox.hidden = false;
  };

  const setBusy = value => {
    busy = value;
    submit.disabled = value;
    followupSubmit.disabled = value;
    followupInput.disabled = value;
    inlineThinking.hidden = !value;
  };

  const ask = async (question, firstTurn = false) => {
    const clean = question.replace(/\s+/g, ' ').trim();
    if (!clean || busy) return;
    errorBox.hidden = true;
    messages.push({ role: 'user', text: clean });
    showArticles(clean);
    if (firstTurn) showThinking();
    else { renderConversation(); inlineThinking.hidden = false; }
    setBusy(true);
    try {
      const answer = await requestAnswer();
      messages.push({ role: 'assistant', text: answer });
      showResult(clean);
      followupInput.value = '';
      followupCount.textContent = '0 / 1400';
      followupInput.focus({ preventScroll: true });
    } catch (error) {
      if (firstTurn) showResult(clean);
      else renderConversation();
      showError(error instanceof Error ? error.message : 'SKAR AI is temporarily unavailable.');
    } finally {
      setBusy(false);
    }
  };

  const updateCount = (field, target) => { target.textContent = `${field.value.length} / 1400`; };
  const submitOnEnter = (field, targetForm) => field.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); targetForm.requestSubmit(); }
  });

  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value, true); });
  followupForm.addEventListener('submit', event => { event.preventDefault(); ask(followupInput.value); });
  input.addEventListener('input', () => updateCount(input, count));
  followupInput.addEventListener('input', () => updateCount(followupInput, followupCount));
  submitOnEnter(input, form);
  submitOnEnter(followupInput, followupForm);

  app.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.prompt; input.dispatchEvent(new Event('input')); input.focus();
  }));

  app.querySelector('[data-ask-again]').addEventListener('click', () => {
    messages = [];
    conversation.replaceChildren();
    errorBox.hidden = true;
    resultView.hidden = true;
    thinkingView.hidden = true;
    askView.hidden = false;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
})();
