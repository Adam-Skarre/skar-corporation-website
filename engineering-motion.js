/* Play visible motion studies automatically; respect reduced-motion preferences. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.engineering-page .eng-motion-frame video:not([data-loop-blend-secondary])').forEach(video => {
    let visible = false;
    const blendFrame = video.closest('.eng-loop-blend');
    const secondary = blendFrame?.querySelector('[data-loop-blend-secondary]');
    let blendStarted = false;
    let animationFrame = 0;

    const monitorBlend = () => {
      cancelAnimationFrame(animationFrame);
      if (!secondary || video.paused || !video.duration) return;
      const overlap = Math.min(.8, video.duration * .12);
      if (!blendStarted && video.currentTime >= video.duration - overlap) {
        blendStarted = true;
        secondary.currentTime = 0;
        secondary.play().then(() => secondary.classList.add('is-blending')).catch(() => {});
      }
      animationFrame = requestAnimationFrame(monitorBlend);
    };

    const finishBlend = () => {
      if (!secondary) return;
      video.currentTime = secondary.currentTime;
      video.play().catch(() => {});
      secondary.classList.remove('is-blending');
      window.setTimeout(() => {
        secondary.pause();
        secondary.currentTime = 0;
        blendStarted = false;
        monitorBlend();
      }, 850);
    };

    if (secondary) video.addEventListener('ended', finishBlend);
    const update = () => {
      if (visible && !document.hidden && !preference.matches) {
        video.play().then(monitorBlend).catch(() => {});
      } else {
        video.pause();
        secondary?.pause();
        cancelAnimationFrame(animationFrame);
      }
    };
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }, { threshold: 0.15 }).observe(video);
    preference.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
  });
})();
