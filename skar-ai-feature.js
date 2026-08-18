(() => {
  'use strict';
  const card = document.querySelector('[data-skar-ai-feature]');
  if (!card) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const question = card.querySelector('[data-demo-question]');
  const answer = card.querySelector('[data-demo-answer]');
  const processing = card.querySelector('[data-demo-processing]');
  const signal = card.querySelector('[data-demo-signal]');
  const evidence = card.querySelector('[data-demo-evidence]');
  const step = card.querySelector('[data-demo-step]');
  const meter = card.querySelector('[data-demo-meter]');
  const toggle = card.querySelector('[data-demo-toggle]');
  const metricA = card.querySelector('[data-demo-metric-a]');
  const metricB = card.querySelector('[data-demo-metric-b]');
  const metricC = card.querySelector('[data-demo-metric-c]');
  const sceneButtons = [...card.querySelectorAll('[data-demo-scene]')];
  const scenes = [
    {
      question: 'Our quotes take nine days. Where is the time actually going?',
      processing: 'Tracing elapsed time across each handoff',
      complete: 'Handoff pattern identified',
      answer: 'Most of the delay is waiting, not active work. Technical review is the first constraint to measure.',
      signal: 'Technical review queue',
      evidence: 'Review timestamps',
      metrics: ['1.4 days', '7.6 days', '72%'],
      step: '01 / FIND THE WAIT',
      meter: '42%'
    },
    {
      question: 'How much of the nine-day cycle is controlled by technical review?',
      processing: 'Comparing touch time with queue time',
      complete: 'Constraint sized from the sample',
      answer: 'Technical review waits 3.8 days—42% of the total lead time. One week of timestamps will confirm the pattern.',
      signal: '3.8 days waiting',
      evidence: 'One week of quotes',
      metrics: ['1.4 days', '3.8 days', '84%'],
      step: '02 / SIZE THE CONSTRAINT',
      meter: '68%'
    },
    {
      question: 'What is the smallest change we can test without disrupting delivery?',
      processing: 'Testing the smallest measurable intervention',
      complete: 'Recommended action prepared',
      answer: 'Pilot two review windows each day for two weeks. Track median quote time and completion within 48 hours.',
      signal: 'Twice-daily review window',
      evidence: 'Two-week comparison',
      metrics: ['2 windows', '14 days', 'High'],
      step: '03 / TEST THE ACTION',
      meter: '88%'
    }
  ];
  let index = 0;
  let playing = !reducedMotion;
  let timers = [];
  let typingTimer;

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
    clearInterval(typingTimer);
  };

  const typeAnswer = (text, done) => {
    answer.textContent = '';
    card.classList.add('has-answer');
    let position = 0;
    const chunk = Math.max(1, Math.ceil(text.length / 48));
    typingTimer = setInterval(() => {
      position = Math.min(text.length, position + chunk);
      answer.textContent = text.slice(0, position);
      if (position === text.length) {
        clearInterval(typingTimer);
        done();
      }
    }, 34);
  };

  const show = next => {
    clearTimers();
    index = next % scenes.length;
    const scene = scenes[index];
    card.classList.remove('has-answer', 'has-evidence', 'is-complete');
    question.textContent = scene.question;
    processing.textContent = scene.processing;
    answer.textContent = '';
    signal.textContent = scene.signal;
    evidence.textContent = scene.evidence;
    metricA.textContent = scene.metrics[0];
    metricB.textContent = scene.metrics[1];
    metricC.textContent = scene.metrics[2];
    step.textContent = scene.step;
    meter.style.width = '0%';
    sceneButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('active', buttonIndex === index);
      button.setAttribute('aria-current', buttonIndex === index ? 'step' : 'false');
    });

    if (reducedMotion) {
      processing.textContent = scene.complete;
      answer.textContent = scene.answer;
      meter.style.width = scene.meter;
      card.classList.add('has-answer', 'has-evidence', 'is-complete');
      return;
    }

    timers.push(setTimeout(() => {
      if (!playing) return;
      typeAnswer(scene.answer, () => {
        if (!playing) return;
        processing.textContent = scene.complete;
        card.classList.add('is-complete');
        timers.push(setTimeout(() => {
          if (!playing) return;
          card.classList.add('has-evidence');
          meter.style.width = scene.meter;
          timers.push(setTimeout(() => show(index + 1), 2600));
        }, 320));
      });
    }, 620));
  };

  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Ⅱ' : '▶';
    toggle.setAttribute('aria-label', playing ? 'Pause demonstration' : 'Play demonstration');
    clearTimers();
    if (playing) show(index);
  });
  sceneButtons.forEach(button => {
    button.addEventListener('click', () => {
      playing = true;
      toggle.textContent = 'Ⅱ';
      toggle.setAttribute('aria-label', 'Pause demonstration');
      show(Number(button.dataset.demoScene));
    });
  });
  if (reducedMotion) toggle.hidden = true;
  show(0);
  addEventListener('pagehide', clearTimers, { once: true });
})();
