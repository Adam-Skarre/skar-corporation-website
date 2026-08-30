/* Play visible motion studies automatically; respect reduced-motion preferences. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.engineering-page .eng-motion-frame video').forEach(video => {
    let visible = false;
    const update = () => {
      if (visible && !document.hidden && !preference.matches) {
        video.play().catch(() => {});
      } else {
        video.pause();
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
