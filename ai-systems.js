(() => {
  const frontier = document.querySelector('[data-ai-frontier]');
  if (!frontier) return;
  document.documentElement.classList.add('ai-enhanced');

  const postures = {
    assist: {
      index: '01 · ASSIST',
      title: 'Increase the quality of human work.',
      copy: 'Use AI to retrieve, organize, compare, and draft while a person remains the clear author of the decision.',
      authority: 'Human retains',
      review: 'Every output',
      fit: 'Research and synthesis'
    },
    act: {
      index: '02 · CONSTRAINED ACTION',
      title: 'Automate the reversible and observable.',
      copy: 'Allow the system to take narrow actions inside explicit limits, with complete logs, stop conditions, and fast recovery.',
      authority: 'Delegated boundary',
      review: 'Exceptions and samples',
      fit: 'Routine operational tasks'
    },
    decide: {
      index: '03 · RECOMMEND',
      title: 'Support the decision without hiding it.',
      copy: 'Use AI to form and compare options, while a named owner sees the evidence, uncertainty, and tradeoffs before committing.',
      authority: 'Named decision owner',
      review: 'Before commitment',
      fit: 'Planning and allocation'
    },
    avoid: {
      index: '04 · DO NOT AUTOMATE',
      title: 'Preserve judgment where control is weak.',
      copy: 'When consequences are high and behavior cannot be inspected or reversed, the responsible design decision may be not to automate.',
      authority: 'Human only',
      review: 'Not applicable',
      fit: 'Irreversible high-stakes work'
    }
  };

  const fields = {
    index: frontier.querySelector('[data-ai-detail-index]'),
    title: frontier.querySelector('[data-ai-detail-title]'),
    copy: frontier.querySelector('[data-ai-detail-copy]'),
    authority: frontier.querySelector('[data-ai-detail-authority]'),
    review: frontier.querySelector('[data-ai-detail-review]'),
    fit: frontier.querySelector('[data-ai-detail-fit]')
  };

  frontier.querySelectorAll('[data-posture]').forEach(button => {
    button.addEventListener('click', () => {
      const posture = postures[button.dataset.posture];
      if (!posture) return;

      frontier.querySelectorAll('[data-posture]').forEach(item => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });

      Object.keys(fields).forEach(key => {
        if (typeof fields[key].animate === 'function') {
          fields[key].animate(
            [{ opacity: .2, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }],
            { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' }
          );
        }
        fields[key].textContent = posture[key];
      });
    });
  });

  const revealItems = document.querySelectorAll('.ai-frontier-head,.ai-frontier-shell,.ai-runtime-head,.ai-trace,.ai-assurance-head,.ai-assurance-grid article,.ai-engagements-head,.ai-engagement-grid article');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealItems.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

  revealItems.forEach(item => observer.observe(item));
})();
