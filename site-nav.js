(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const file = (location.pathname.split('/').pop() || 'skar.html').toLowerCase();
  const firmActive = ['about.html', 'careers.html'].includes(file);
  const workActive = ['solutions.html', 'industries.html', 'services.html', 'technology.html'].includes(file);
  const insightsActive = file === 'insights.html' || file.startsWith('report-');

  const researchAgenda = document.querySelector('.research-agenda');
  const researchStandard = document.querySelector('.research-method');
  if (researchAgenda) researchAgenda.id = 'research-agenda';
  if (researchStandard) researchStandard.id = 'research-standard';

  header.innerHTML = `
    <a class="nav-brand" href="skar.html" aria-label="SKAR Corporation home">
      <span class="nav-emblem" aria-hidden="true"></span>
      <img class="nav-wordmark" src="assets/skar-logotype.png" alt="">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="skar-navigation">
      <span></span><span></span><span></span><b>Menu</b>
    </button>
    <nav class="main-nav nav-groups" id="skar-navigation" aria-label="Primary navigation">
      <div class="nav-group${firmActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">The Firm <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel">
          <div class="nav-panel-links"><div class="nav-link-column"><strong>The Firm</strong><a href="about.html">About</a><a href="careers.html">Careers</a></div></div>
        </div>
      </div>
      <div class="nav-group${workActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">What We Do <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel">
          <div class="nav-panel-links"><div class="nav-link-column"><strong>What We Do</strong><a href="solutions.html">Solutions</a><a href="industries.html">Industries</a></div></div>
        </div>
      </div>
      <div class="nav-group${insightsActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">Insights &amp; Research <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel">
          <div class="nav-panel-links"><div class="nav-link-column"><strong>Insights &amp; Research</strong><a href="insights.html">Overview</a><a href="insights.html#research-library">Research Library</a><a href="insights.html#research-standard">Research Standard</a></div></div>
        </div>
      </div>
      <a class="mobile-nav-contact" href="contact.html">Contact <span aria-hidden="true">↗</span></a>
    </nav>
    <a class="header-cta" href="contact.html"${file === 'contact.html' ? ' aria-current="page"' : ''}>Contact</a>
  `;

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

  toggle.addEventListener('click', () => {
    const opening = !header.classList.contains('nav-open');
    if (opening) closeGroups();
    header.classList.toggle('nav-open', opening);
    document.documentElement.classList.toggle('menu-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    nav.setAttribute('data-open', String(opening));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      document.documentElement.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeGroups();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeGroups();
    header.classList.remove('nav-open');
    document.documentElement.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
})();
