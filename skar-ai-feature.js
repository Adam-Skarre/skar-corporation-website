(() => {
  'use strict';
  const card = document.querySelector('[data-skar-ai-feature]');
  if (!card) return;
  const toggle = card.querySelector('[data-demo-toggle]');
  const replay = card.querySelector('[data-demo-replay]');
  const label = card.querySelector('[data-demo-step]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phases = ['question', 'thinking', 'answer', 'research'];
  const labels = ['Start with a business question', 'Considering the tradeoffs', 'A practical starting point', 'Explore the supporting research'];
  const durations = [1800, 3000, 2400, 12000];
  let paused = false, timer, phase = reduced.matches ? 3 : 0, visible = false;
  function render() {
    card.dataset.phase = phases[phase];
    label.textContent = labels[phase];
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play demonstration' : 'Pause demonstration');
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || !visible || document.hidden) return;
    if (reduced.matches && phase === 3) return;
    timer = setTimeout(() => { phase = (phase + 1) % phases.length; render(); schedule(); }, durations[phase]);
  }
  toggle.addEventListener('click', () => { paused = !paused; render(); schedule(); });
  replay.addEventListener('click', () => { phase = 0; paused = false; render(); schedule(); });
  reduced.addEventListener('change', () => { phase = reduced.matches ? 3 : 0; render(); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  addEventListener('pagehide', () => clearTimeout(timer));
  addEventListener('pageshow', schedule);
  render();
  // Start when the visitor reaches the demo, rather than while it is offscreen.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; schedule();
    }, { threshold: 0.2 });
    observer.observe(card);
  } else { visible = true; schedule(); }
})();
