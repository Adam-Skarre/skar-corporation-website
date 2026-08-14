(() => {
  'use strict';
  const card = document.querySelector('[data-skar-ai-feature]');
  if (!card) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const answer = card.querySelector('[data-demo-answer]');
  const signal = card.querySelector('[data-demo-signal]');
  const step = card.querySelector('[data-demo-step]');
  const meter = card.querySelector('[data-demo-meter]');
  const toggle = card.querySelector('[data-demo-toggle]');
  const scenes = [
    ['Start with elapsed time, not touch time. How long does a quote wait for technical review?', 'Technical review queue', '01 / FIND THE WAIT', '42%'],
    ['If review waits 3.8 days, it explains 42% of the total lead time. Check one week of timestamps.', '3.8 days waiting', '02 / SIZE THE CONSTRAINT', '68%'],
    ['Test a twice-daily review window. Compare median quote time and the share completed within 48 hours.', 'Run a two-week test', '03 / DEFINE THE ACTION', '88%']
  ];
  let index = 0;
  let playing = !reducedMotion;
  let timer;

  const show = next => {
    index = next % scenes.length;
    card.classList.remove('is-changing');
    void card.offsetWidth;
    card.classList.add('is-changing');
    [answer.textContent, signal.textContent, step.textContent, meter.style.width] = scenes[index];
  };
  const schedule = () => {
    clearInterval(timer);
    if (playing) timer = setInterval(() => show(index + 1), 3900);
  };
  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Ⅱ' : '▶';
    toggle.setAttribute('aria-label', playing ? 'Pause demonstration' : 'Play demonstration');
    schedule();
  });
  show(0);
  schedule();
  addEventListener('pagehide', () => clearInterval(timer), { once: true });
})();
