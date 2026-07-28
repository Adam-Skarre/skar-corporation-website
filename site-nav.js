(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const route = location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
  const routeRoot = route.split('/')[0];
  const firmActive = ['about', 'careers'].includes(route);
  const workActive = ['solutions', 'industries', 'services', 'technology', 'engineering', 'modeling-data-analysis', 'artificial-intelligence', 'design-manufacturing', 'supply-chain', 'energy-infrastructure', 'industrial-technology', 'small-business'].includes(routeRoot);
  const insightsActive = ['insights', 'research', 'market-views', 'way-through', 'visualization', 'notes-in-form', 'news'].includes(route) || route.startsWith('report-');

  const researchAgenda = document.querySelector('.research-agenda');
  const researchStandard = document.querySelector('.research-method');
  if (researchAgenda) researchAgenda.id = 'research-agenda';
  if (researchStandard) researchStandard.id = 'research-standard';

  header.innerHTML = `
    <a class="nav-brand" href="/" aria-label="SKAR Corporation home">
      <span class="nav-emblem" aria-hidden="true"></span>
      <img class="nav-wordmark" src="/assets/skar-logotype.png" alt="">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="skar-navigation">
      <span></span><span></span><span></span><b>Menu</b>
    </button>
    <nav class="main-nav nav-groups" id="skar-navigation" aria-label="Primary navigation">
      <div class="nav-group${firmActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">The Firm <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel">
          <div class="nav-panel-links"><div class="nav-link-column"><strong>The Firm</strong><a href="/about/">About</a><a href="/careers/">Careers</a></div></div>
        </div>
      </div>
      <div class="nav-group${workActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">What We Do <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel nav-panel-work">
          <div class="nav-panel-links nav-work-columns">
            <div class="nav-link-column">
              <strong>Solutions</strong>
              <a href="/solutions/">Overview</a>
              <a href="/engineering/">Engineering</a>
              <a href="/modeling-data-analysis/">Modeling &amp; Data Analysis</a>
              <a href="/artificial-intelligence/">Artificial Intelligence</a>
            </div>
            <div class="nav-link-column">
              <strong>Industries</strong>
              <a href="/industries/">Overview</a>
              <a href="/design-manufacturing/">Design &amp; Manufacturing</a>
              <a href="/supply-chain/">Supply Chain</a>
              <a href="/energy-infrastructure/">Energy &amp; Infrastructure</a>
              <a href="/industrial-technology/">Industrial &amp; Technology</a>
              <a href="/small-business/">Small Businesses</a>
            </div>
          </div>
        </div>
      </div>
      <div class="nav-group${insightsActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">Insights <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel">
          <div class="nav-panel-links"><div class="nav-link-column"><strong>Insights</strong><a href="/way-through/">The Way Through</a><a href="/research/">Research</a><a href="/market-views/">Market Views</a><a href="/visualization/">Visualization</a><a href="/news/">News</a></div></div>
        </div>
      </div>
      <a class="mobile-nav-contact" href="/contact/"${route === 'contact' ? ' aria-current="page"' : ''}>Contact <span aria-hidden="true">↗</span></a>
    </nav>
    <a class="header-cta" href="/contact/"${route === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
  `;

  const footer = document.querySelector('.footer');
  if (footer) {
    footer.innerHTML = `
      <div class="footer-grid">
        <div class="footer-identity"><a class="brand" href="/" aria-label="SKAR Corporation home"><img class="brand-wordmark" src="/assets/skar-wordmark.png" alt="SKAR Corporation"></a></div>
        <div class="footer-section"><h4>Company</h4><a href="/about/">About</a><a href="/careers/">Careers</a></div>
        <div class="footer-section"><h4>Expertise</h4><a href="/solutions/">Solutions</a><a href="/industries/">Industries</a></div>
        <div class="footer-section footer-insights"><h4>Insights</h4><a href="/way-through/">The Way Through</a><a href="/research/">Research</a><a href="/market-views/">Market Views</a><a href="/visualization/">Visualization</a><a href="/news/">News</a></div>
        <div class="footer-section footer-contact"><h4>Contact</h4><a href="/contact/">Start a conversation <span aria-hidden="true">↗</span></a></div>
      </div>
      <div class="copyright">© 2026 Skar Corporation. All rights reserved.</div>
    `;
  }

  const nav = header.querySelector('#skar-navigation');
  const toggle = header.querySelector('.nav-toggle');
  const groups = [...header.querySelectorAll('.nav-group')];

  function closeGroups(except) {
    groups.forEach((group) => {
      if (group === except) return;
      group.classList.remove('open');
      group.querySelector('.nav-group-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  groups.forEach((group) => {
    const trigger = group.querySelector('.nav-group-trigger');
    trigger.addEventListener('click', () => {
      const opening = !group.classList.contains('open');
      closeGroups(group);
      group.classList.toggle('open', opening);
      trigger.setAttribute('aria-expanded', String(opening));
    });
  });

  function setMenu(opening) {
    if (opening) closeGroups();
    header.classList.toggle('nav-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    nav.setAttribute('data-open', String(opening));
  }

  function closeMenu() {
    closeGroups();
    setMenu(false);
  }

  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    setMenu(!header.classList.contains('nav-open'));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeGroups();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMenu();
  });

  window.addEventListener('pageshow', closeMenu);
  window.addEventListener('pagehide', closeMenu);
  window.addEventListener('orientationchange', closeMenu);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  }, { passive: true });
})();
