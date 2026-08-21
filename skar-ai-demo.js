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
  const resultQuestion = app.querySelector('[data-result-question]');
  const resultAnswer = app.querySelector('[data-result-answer]');
  const resultArticles = app.querySelector('[data-result-articles]');
  let thinkingTimer = 0;

  const articles = [
    { title: 'Before the Dashboard', type: 'Manufacturing systems', href: '/report-manufacturing-readiness/', keys: /manufactur|factory|dashboard|readiness|digital|data|operations?/ },
    { title: 'AI Adoption Gap', type: 'Business technology', href: '/report-ai-adoption/', keys: /\bai\b|artificial intelligence|adoption|workflow|automation|technology/ },
    { title: 'The Next Operating System of Industry', type: 'Industry 4.0', href: '/report-industry-4-0/', keys: /industry|manufactur|connected|automation|sensor|factory|operating system/ },
    { title: 'Planning for Load Growth', type: 'Energy & infrastructure', href: '/report-data-center-demand/', keys: /energy|electric|power|grid|load|data.?center|infrastructure/ }
  ];

  const guidedAnswer = question => {
    const lower = question.toLowerCase();
    if (/manufactur|factory|dashboard|industry/.test(lower)) return '# Start with the operating decision, not the interface.\n\nBefore selecting an AI platform or dashboard, define the decision the system must improve, identify its accountable owner, and verify that the underlying operational data is consistent enough to support it.\n\n## A practical sequence\n- Map the current workflow and the point where judgment is required.\n- Confirm source definitions, timestamps, exceptions, and ownership.\n- Test one bounded use case before expanding the technology layer.\n\nA dashboard can make activity visible, but it cannot repair an undefined process or unreliable source record.';
    if (/energy|electric|power|grid|load|data.?center|infrastructure/.test(lower)) return '# Treat the forecast as a range of operating scenarios.\n\nInfrastructure decisions should separate committed demand from announced or speculative demand, then test the system against multiple timing and utilization cases.\n\n## What to establish first\n- Which loads are contracted, under construction, or still proposed.\n- The location, timing, duration, and flexibility of each demand source.\n- The transmission, generation, permitting, and interconnection constraints that control delivery.\n\nThe useful output is not one precise forecast. It is a decision that remains defensible across the scenarios that matter.';
    if (/\bai\b|artificial intelligence|adoption|workflow|automation/.test(lower)) return '# Verify workflow readiness before scaling the tool.\n\nAI adoption creates value when it is attached to a specific decision, supported by approved information, and governed by someone accountable for the result. Access to a model alone does not establish those conditions.\n\n## Questions to resolve\n- Which task or decision is being improved?\n- What evidence may the system use, and who maintains it?\n- Where must a person review, approve, or override the output?\n- How will the organization detect whether the change actually helped?\n\nBegin with one reversible use case whose quality and operating effect can be observed.';
    return '# Frame the decision before searching for the solution.\n\nState the outcome that matters, the boundary of the system, the evidence already available, and the consequence of being wrong. That separates a consequential decision from a broad topic.\n\n## A useful next step\n- Write the decision in one sentence.\n- Name the owner and the deadline.\n- Separate observations from assumptions.\n- Identify the smallest missing fact that could change the direction.\n\nThat structure makes the next analysis more focused and easier to verify.';
  };

  const appendText = (container, value) => {
    container.replaceChildren();
    let list = null;
    value.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) { list = null; return; }
      if (line.startsWith('# ')) {
        const h2 = document.createElement('h2'); h2.textContent = line.slice(2); container.append(h2); list = null;
      } else if (line.startsWith('## ')) {
        const h3 = document.createElement('h3'); h3.textContent = line.slice(3); container.append(h3); list = null;
      } else if (line.startsWith('- ')) {
        if (!list) { list = document.createElement('ul'); container.append(list); }
        const item = document.createElement('li'); item.textContent = line.slice(2); list.append(item);
      } else {
        const paragraph = document.createElement('p'); paragraph.textContent = line; container.append(paragraph); list = null;
      }
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

  const requestAnswer = async question => {
    if (!endpoint) return guidedAnswer(question);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'evidence', messages: [{ role: 'user', text: question }] })
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.answer !== 'string' || !payload.answer.trim()) throw new Error('Unavailable');
      return payload.answer.trim();
    } catch (_) {
      return guidedAnswer(question);
    }
  };

  const showThinking = () => {
    askView.hidden = true; resultView.hidden = true; thinkingView.hidden = false;
    const labels = ['Reviewing the question', 'Clarifying the decision', 'Connecting relevant research'];
    let index = 0;
    thinkingLabel.textContent = labels[0];
    clearInterval(thinkingTimer);
    thinkingTimer = setInterval(() => { index = (index + 1) % labels.length; thinkingLabel.textContent = labels[index]; }, 720);
  };

  const showResult = (question, answer) => {
    clearInterval(thinkingTimer);
    resultQuestion.textContent = question;
    appendText(resultAnswer, answer);
    showArticles(question);
    thinkingView.hidden = true; resultView.hidden = false;
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const ask = async question => {
    const clean = question.replace(/\s+/g, ' ').trim();
    if (clean.length < 12) { input.focus(); return; }
    submit.disabled = true;
    showThinking();
    const started = Date.now();
    const answer = await requestAnswer(clean);
    const remaining = Math.max(0, 1450 - (Date.now() - started));
    setTimeout(() => { showResult(clean, answer); submit.disabled = false; }, remaining);
  };

  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  input.addEventListener('input', () => { count.textContent = `${input.value.length} / 700`; });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  app.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.prompt; input.dispatchEvent(new Event('input')); input.focus();
  }));
  app.querySelector('[data-ask-again]').addEventListener('click', () => {
    resultView.hidden = true; thinkingView.hidden = true; askView.hidden = false; input.value = ''; input.dispatchEvent(new Event('input')); input.focus(); scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
