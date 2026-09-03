(() => {
  'use strict';
  const card = document.querySelector('[data-skar-ai-feature]');
  if (!card) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const answer = card.querySelector('[data-demo-answer]');
  const toggle = card.querySelector('[data-demo-toggle]');
  const finalAnswer = answer.textContent.trim();
  let timers = [];
  let typingTimer = 0;
  let playing = !reducedMotion;

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
    clearInterval(typingTimer);
  };

  const run = () => {
    clearTimers();
    card.classList.remove('has-answer', 'has-articles');
    card.classList.add('is-thinking');
    answer.textContent = finalAnswer;
    if (!playing) return;
    timers.push(setTimeout(() => {
      card.classList.remove('is-thinking');
      card.classList.add('has-answer');
      answer.textContent = '';
      let position = 0;
      typingTimer = setInterval(() => {
        position = Math.min(finalAnswer.length, position + 4);
        answer.textContent = finalAnswer.slice(0, position);
        if (position === finalAnswer.length) {
          clearInterval(typingTimer);
          card.classList.add('has-articles');
          timers.push(setTimeout(run, 6500));
        }
      }, 42);
    }, 2600));
  };

  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Ⅱ' : '▶';
    toggle.setAttribute('aria-label', playing ? 'Pause demonstration' : 'Play demonstration');
    clearTimers();
    if (playing) run();
  });

  if (reducedMotion) {
    card.classList.add('has-answer', 'has-articles');
    toggle.hidden = true;
  } else {
    run();
  }

  addEventListener('pagehide', clearTimers, { once: true });
})();
