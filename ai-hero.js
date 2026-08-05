(() => {
  const hero = document.querySelector('[data-ai-hero]');
  if (!hero) return;

  const video = hero.querySelector('[data-ai-hero-video]');
  const toggle = hero.querySelector('[data-ai-hero-toggle]');
  if (!video || !toggle) return;

  const label = toggle.querySelector('span');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const updateToggle = () => {
    const paused = video.paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.classList.toggle('is-paused', paused);
    if (label) label.textContent = paused ? 'Play motion' : 'Pause motion';
  };

  const requestPlayback = () => {
    if (reducedMotion.matches) {
      video.pause();
      updateToggle();
      return;
    }
    video.play().then(updateToggle).catch(updateToggle);
  };

  video.playbackRate = 0.82;
  toggle.addEventListener('click', () => {
    if (video.paused) video.play().then(updateToggle).catch(updateToggle);
    else {
      video.pause();
      updateToggle();
    }
  });
  video.addEventListener('play', updateToggle);
  video.addEventListener('pause', updateToggle);
  window.addEventListener('pageshow', requestPlayback);
  reducedMotion.addEventListener?.('change', requestPlayback);
  requestPlayback();
})();
