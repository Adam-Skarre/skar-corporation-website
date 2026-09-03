(() => {
  const video = document.querySelector('.modeling-film video');
  if (!video) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  const update = () => {
    if (visible && !document.hidden && !reduced.matches) video.play().catch(() => {});
    else video.pause();
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, {threshold: .1});
  observer.observe(video);
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
})();
