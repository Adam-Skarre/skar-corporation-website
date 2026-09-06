(() => {
  'use strict';
  const app = document.querySelector('[data-ai-app]');
  if (!app) return;
  const $ = key => app.querySelector(`[data-${key}]`);
  const endpoint = document.querySelector('meta[name="skar-ai-endpoint"]')?.content;
  const input = $('ask-input'), followup = $('followup-input');
  let messages = [], busy = false, controller = null, revision = 0, pending = false;
  const articles = [
    { title: 'Before the Dashboard', type: 'Manufacturing systems', href: '/report-manufacturing-readiness/', keys: /manufactur|factory|dashboard|readiness|digital|data|operations?/ },
    { title: 'AI Adoption Gap', type: 'Business technology', href: '/report-ai-adoption/', keys: /\bai\b|artificial intelligence|adoption|workflow|automation|technology/ },
    { title: 'The Next Operating System of Industry', type: 'Industry 4.0', href: '/report-industry-4-0/', keys: /industry|manufactur|connected|automation|sensor|factory|operating system/ },
    { title: 'Planning for Load Growth', type: 'Energy & infrastructure', href: '/report-data-center-demand/', keys: /energy|electric|power|grid|load|data.?center|infrastructure/ }
  ];


  // Model output is rendered with DOM text nodes, never interpreted as HTML.
  function inline(parent, text) {
    const tokens = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
    let start = 0;
    for (const match of text.matchAll(tokens)) {
      parent.append(document.createTextNode(text.slice(start, match.index)));
      const node = document.createElement(match[2] ? 'strong' : match[3] ? 'code' : 'a');
      node.textContent = match[2] || match[3] || match[4];
      if (match[5]) { node.href = match[5]; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
      parent.append(node); start = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(start)));
  }
  function markdown(parent, text) {
    let list = null, code = null;
    for (const line of text.split('\n')) {
      if (line.trim().startsWith('```')) {
        if (code) code = null;
        else { const pre = document.createElement('pre'); code = document.createElement('code'); pre.append(code); parent.append(pre); }
        list = null; continue;
      }
      if (code) { code.append(document.createTextNode(line + '\n')); continue; }
      if (!line.trim()) { list = null; continue; }
      const heading = line.match(/^#{1,6}\s+(.+)/);
      const bullet = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)/);
      if (bullet) {
        const kind = /^\s*\d/.test(line) ? 'ol' : 'ul';
        if (!list || list.tagName.toLowerCase() !== kind) { list = document.createElement(kind); parent.append(list); }
        const item = document.createElement('li'); inline(item, bullet[1]); list.append(item);
      } else {
        list = null;
        const node = document.createElement(heading ? 'h3' : 'p');
        inline(node, heading ? heading[1] : line); parent.append(node);
      }
    }
  }
  function render() {
    $('conversation').replaceChildren();
    messages.forEach(message => {
      const turn = document.createElement('section'); turn.className = `ask-turn ask-turn-${message.role}`;
      const label = document.createElement('span'); label.textContent = message.role === 'user' ? 'YOU' : 'SKAR AI';
      const body = document.createElement('div');
      if (message.role === 'assistant') markdown(body, message.text);
      else { const paragraph = document.createElement('p'); paragraph.textContent = message.text; body.append(paragraph); }
      turn.append(label, body);
      if (message.role === 'assistant') {
        const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'ask-copy'; copy.textContent = 'Copy answer';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(message.text); copy.textContent = 'Copied'; }
          catch { copy.textContent = 'Select the answer to copy'; }
        }); turn.append(copy);
      }
      $('conversation').append(turn);
    });
  }
  function showArticles(question) {
    const matches = articles.filter(article => article.keys.test(question.toLowerCase()));
    const selected = (matches.length ? matches : articles).slice(0,3);
    $('result-articles').replaceChildren();
    selected.forEach(article => {
      const link = document.createElement('a'); link.href = article.href;
      const type = document.createElement('span'); type.textContent = article.type;
      const title = document.createElement('strong'); title.textContent = article.title;
      const arrow = document.createElement('i'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true');
      link.append(type,title,arrow); $('result-articles').append(link);
    });
  }
  function updateInput(field, counter) {
    counter.textContent = `${field.value.length} / 1400`;
    field.style.height = 'auto'; field.style.height = `${Math.min(200,field.scrollHeight)}px`;
    $('ask-submit').disabled = busy || !input.value.trim();
    $('followup-submit').disabled = busy || !followup.value.trim();
  }
  function setBusy(value) {
    busy = value;
    $('inline-thinking').hidden = !value; $('stop').hidden = !value;
    followup.disabled = value;
    updateInput(input,$('count')); updateInput(followup,$('followup-count'));
  }
  async function ask(question, retry = false) {
    const clean = question.trim().slice(0,1400);
    if ((!clean && !retry) || busy) return;
    // A failed request can be retried without duplicating the user's turn.
    if (!retry) { if (pending) messages.pop(); messages.push({role:'user',text:clean}); }
    pending = true;
    const latest = messages[messages.length-1].text;
    $('ask-error').hidden = true; $('retry').hidden = true;
    $('ask-view').hidden = true; $('result-view').hidden = false;
    render(); showArticles(latest); setBusy(true);
    const current = ++revision;
    const request = new AbortController(); controller = request;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; request.abort(); }, 60000);
    try {
      if (!endpoint) throw new Error('unconfigured');
      const response = await fetch(endpoint, {
        method:'POST',headers:{'Content-Type':'application/json'},signal:request.signal,
        body:JSON.stringify({mode:'conversation',messages})
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.answer !== 'string' || !payload.answer.trim()) throw new Error('unavailable');
      if (current !== revision) return;
      messages.push({role:'assistant',text:payload.answer.trim()}); pending = false;
      render(); followup.value = '';
    } catch (error) {
      if (current !== revision) return;
      $('ask-error').textContent = timedOut ? 'This is taking longer than expected. Please try again.' : request.signal.aborted ? 'Response stopped. Try again or ask a different question.' : 'SKAR AI couldn’t connect right now. Your question is still here—please try again.';
      $('ask-error').hidden = false; $('retry').hidden = false;
    } finally {
      clearTimeout(timeout);
      if (current === revision) { controller = null; setBusy(false); followup.focus({preventScroll:true}); }
    }
  }
  $('ask-form').addEventListener('submit',event => { event.preventDefault(); ask(input.value); });
  $('followup-form').addEventListener('submit',event => { event.preventDefault(); ask(followup.value); });
  [[input,$('ask-form'),$('count')],[followup,$('followup-form'),$('followup-count')]].forEach(([field,form,counter]) => {
    field.addEventListener('input',() => updateInput(field,counter));
    field.addEventListener('keydown',event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
    });
  });
  app.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click',() => {
    input.value = button.dataset.prompt; updateInput(input,$('count')); input.focus();
  }));
  $('stop').addEventListener('click',() => controller?.abort());
  $('retry').addEventListener('click',() => ask('',true));
  $('ask-again').addEventListener('click',() => {
    ++revision; controller?.abort(); controller = null; messages = []; pending = false;
    render(); input.value = ''; followup.value = ''; setBusy(false);
    $('ask-error').hidden = true; $('retry').hidden = true;
    $('result-view').hidden = true; $('ask-view').hidden = false;
    input.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'auto'});
  });
  setBusy(false);
})();
