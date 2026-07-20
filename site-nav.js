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
          <div class="nav-panel-intro"><small>THE FIRM</small><strong>Judgment for complex terrain.</strong><p>Meet the practice, understand our principles, and learn how to work with SKAR.</p></div>
          <div class="nav-panel-links"><a href="about.html"><b>About SKAR</b><span>Our purpose, approach, and operating principles.</span></a><a href="careers.html"><b>Careers</b><span>Build relationships before roles.</span></a></div>
        </div>
      </div>
      <div class="nav-group${workActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">What We Do <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel">
          <div class="nav-panel-intro"><small>WHAT WE DO</small><strong>Focused support. Useful outcomes.</strong><p>Engineering analysis and business technology shaped around the decision at hand.</p></div>
          <div class="nav-panel-links"><a href="solutions.html"><b>Solutions</b><span>Decision support, modeling, workflows, and practical technology.</span></a><a href="industries.html"><b>Industries</b><span>Design, manufacturing, energy, infrastructure, and growing businesses.</span></a></div>
        </div>
      </div>
      <div class="nav-group${insightsActive ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false">Insights &amp; Research <span aria-hidden="true">⌄</span></button>
        <div class="nav-panel">
          <div class="nav-panel-intro"><small>INSIGHTS &amp; RESEARCH</small><strong>Evidence before assumption.</strong><p>Independent research that turns public data and technical evidence into useful direction.</p></div>
          <div class="nav-panel-links"><a href="insights.html"><b>Research Overview</b><span>Published briefs and current areas of investigation.</span></a><a href="insights.html#research-library"><b>Research Library</b><span>Independent technical reports grounded in public evidence.</span></a><a href="insights.html#research-standard"><b>Research Standard</b><span>How we frame, model, challenge, and communicate.</span></a></div>
        </div>
      </div>
    </nav>
    <a class="header-cta" href="https://adamskarre.com/contact.html">Contact</a>
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
    header.classList.toggle('nav-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    nav.setAttribute('data-open', String(opening));
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeGroups();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeGroups();
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
})();
