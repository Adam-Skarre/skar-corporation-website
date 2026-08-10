const canvas = document.getElementById('skar-ai-tubes');

if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
    .then(({ default: TubesCursor }) => {
      const experience = TubesCursor(canvas, {
        bloom: {
          threshold: 0,
          strength: 1.12,
          radius: 0.45
        },
        tubes: {
          colors: ['#ff008a', '#8b5cf6', '#3b82f6', '#ffffff'],
          lights: {
            intensity: 50,
            colors: ['#ff008a', '#8b5cf6', '#3b82f6', '#ffffff']
          }
        },
        sleepRadiusX: 245,
        sleepRadiusY: 120,
        sleepTimeScale1: 0.32,
        sleepTimeScale2: 0.48
      });

      window.addEventListener('pagehide', () => experience.dispose(), { once: true });
    })
    .catch(() => {
      canvas.classList.add('is-unavailable');
    });
}
