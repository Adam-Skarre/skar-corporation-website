(() => {
  'use strict';
  const card = document.querySelector('[data-skar-ai-feature]');
  if (!card) return;
  const toggle = card.querySelector('[data-demo-toggle]');
  const label = card.querySelector('[data-demo-step]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 540px)');
  let paused = false, timer, phase = 0;
  const phases = ['question', 'answer', 'research'];
  const labels = ['Start with a question', 'Find a useful starting point', 'Explore another perspective'];
  function render() {
    card.dataset.phase = phases[phase];
    label.textContent = labels[phase];
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || reduced.matches || mobile.matches || document.hidden) return;
    timer = setTimeout(() => { phase = (phase + 1) % 3; render(); schedule(); }, phase === 2 ? 10000 : 2600);
  }
  function update() {
    clearTimeout(timer);
    phase = 2; render();
    toggle.hidden = reduced.matches || mobile.matches;
    schedule();
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play demonstration' : 'Pause demonstration');
    if (paused) { clearTimeout(timer); phase = 2; render(); } else schedule();
  });
  reduced.addEventListener('change', update);
  mobile.addEventListener('change', update);
  document.addEventListener('visibilitychange', schedule);
  addEventListener('pagehide', () => clearTimeout(timer));
  addEventListener('pageshow', schedule);
  update();
})();
