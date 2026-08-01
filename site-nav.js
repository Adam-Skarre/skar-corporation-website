(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const fileRoot = location.protocol === 'file:' ? new URL('../', location.href) : null;
  const logicalPath = fileRoot && location.pathname.includes('/site/')
    ? location.pathname.split('/site/').pop()
    : location.pathname;
  const route = logicalPath
    .replace(/index\.html$/i, '')
    .replace(/^\/|\/$/g, '')
    .toLowerCase();
  const routeRoot = route.split('/')[0];
  const firmActive = ['about', 'careers'].includes(route);
  const workActive = ['solutions', 'industries', 'services', 'technology', 'engineering', 'modeling-data-analysis', 'artificial-intelligence', 'web-design', 'design-manufacturing', 'supply-chain', 'energy-infrastructure', 'industrial-technology', 'software', 'small-business'].includes(routeRoot);
  const insightsActive = ['insights', 'research', 'market-views', 'way-through', 'visualization', 'notes-in-form', 'news'].includes(route) || route.startsWith('report-');
  const mobileQuery = window.matchMedia('(max-width: 900px)');

  function localizeMarkup(container) {
    if (!fileRoot) return;
    container.querySelectorAll('[href^="/"],[src^="/"]').forEach((element) => {
      const attribute = element.hasAttribute('href') ? 'href' : 'src';
      const value = element.getAttribute(attribute);
      let localPath = value.replace(/^\//, '');
      if (attribute === 'href') {
        if (!localPath) localPath = 'index.html';
        else if (localPath.endsWith('/')) localPath += 'index.html';
      }
      element.setAttribute(attribute, new URL(localPath, fileRoot).href);
    });
  }

  const groups = [
    {
      label: 'The Firm',
      active: firmActive,
      columns: [
        {
          label: 'The Firm',
          links: [
            ['About', '/about/'],
            ['Careers', '/careers/']
          ]
        }
      ]
    },
    {
      label: 'What We Do',
      active: workActive,
      work: true,
      columns: [
        {
          label: 'Solutions',
          links: [
            ['Overview', '/solutions/'],
            ['Engineering', '/engineering/'],
            ['Modeling & Data Analysis', '/modeling-data-analysis/'],
            ['Artificial Intelligence', '/artificial-intelligence/'],
            ['Web Design', '/web-design/']
          ]
        },
        {
          label: 'Industries',
          links: [
            ['Overview', '/industries/'],
            ['Design & Manufacturing', '/design-manufacturing/'],
            ['Supply Chain', '/supply-chain/', 'nav-sublink'],
            ['Energy & Infrastructure', '/energy-infrastructure/'],
            ['Industrial & Technology', '/industrial-technology/'],
            ['Software', '/software/'],
            ['Small Businesses', '/small-business/']
          ]
        }
      ]
    },
    {
      label: 'Insights',
      active: insightsActive,
      columns: [
        {
          label: 'Insights',
          links: [
            ['Overview', '/insights/'],
            ['The Way Through', '/way-through/'],
            ['Research', '/research/'],
            ['Market Views', '/market-views/'],
            ['Visualization', '/visualization/'],
            ['News', '/news/']
          ]
        }
      ]
    }
  ];

  const researchAgenda = document.querySelector('.research-agenda');
  const researchStandard = document.querySelector('.research-method');
  const utility = document.querySelector('.utility');
  if (researchAgenda) researchAgenda.id = 'research-agenda';
  if (researchStandard) researchStandard.id = 'research-standard';
  if (utility) utility.remove();

  function columnMarkup(column) {
    return `
      <div class="nav-link-column">
        <strong>${column.label}</strong>
        ${column.links.map(([label, href, itemClass]) => `<a${itemClass ? ` class="${itemClass}"` : ''} href="${href}">${itemClass ? '<span aria-hidden="true">↳</span>' : ''}${label}</a>`).join('')}
      </div>
    `;
  }

  function desktopGroupMarkup(group, index) {
    return `
      <div class="nav-group${group.active ? ' active' : ''}">
        <button class="nav-group-trigger" type="button" aria-expanded="false" aria-controls="desktop-nav-panel-${index}">
          ${group.label} <span aria-hidden="true">⌄</span>
        </button>
        <div class="nav-panel${group.work ? ' nav-panel-work' : ''}" id="desktop-nav-panel-${index}">
          <div class="nav-panel-links${group.work ? ' nav-work-columns' : ''}">
            ${group.columns.map(columnMarkup).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function mobileGroupMarkup(group, index) {
    return `
      <section class="mobile-nav-group${group.active ? ' active' : ''}">
        <button class="mobile-nav-trigger" type="button" aria-expanded="false" aria-controls="mobile-nav-panel-${index}">
          <span>${group.label}</span><span class="mobile-nav-chevron" aria-hidden="true"></span>
        </button>
        <div class="mobile-nav-panel${group.work ? ' nav-panel-work' : ''}" id="mobile-nav-panel-${index}">
          <div class="mobile-nav-panel-inner">
            ${group.columns.map(columnMarkup).join('')}
          </div>
        </div>
      </section>
    `;
  }

  header.innerHTML = `
    <a class="nav-brand" href="/" aria-label="SKAR Corporation home">
      <span class="nav-emblem" aria-hidden="true"></span>
      <img class="nav-wordmark" src="/assets/skar-logotype.png" alt="">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="skar-mobile-navigation" aria-label="Open navigation">
      <span></span><span></span><span></span><b>Menu</b>
    </button>
    <nav class="main-nav nav-groups" id="skar-navigation" aria-label="Primary navigation">
      ${groups.map(desktopGroupMarkup).join('')}
    </nav>
    <a class="header-cta" href="/contact/"${route === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
  `;
  localizeMarkup(header);

  const mobileLayer = document.createElement('div');
  mobileLayer.className = 'mobile-nav-layer';
  mobileLayer.id = 'skar-mobile-navigation';
  mobileLayer.hidden = true;
  mobileLayer.setAttribute('aria-hidden', 'true');
  mobileLayer.innerHTML = `
    <div class="mobile-nav-shell" role="dialog" aria-modal="true" aria-label="Site navigation">
      <div class="mobile-nav-head">
        <a class="mobile-nav-brand" href="/" aria-label="SKAR Corporation home">
          <img src="/assets/skar-logotype.png" alt="">
        </a>
        <button class="mobile-nav-close" type="button" aria-label="Close navigation"><span aria-hidden="true"></span></button>
      </div>
      <div class="mobile-nav-scroll">
        <nav class="mobile-nav-content" aria-label="Mobile navigation">
          ${groups.map(mobileGroupMarkup).join('')}
          <a class="mobile-nav-contact" href="/contact/"${route === 'contact' ? ' aria-current="page"' : ''}>
            <span class="mobile-nav-contact-label">Contact</span>
          </a>
        </nav>
      </div>
    </div>
  `;
  localizeMarkup(mobileLayer);
  document.body.appendChild(mobileLayer);

  const footer = document.querySelector('.footer');
  if (footer) {
    footer.innerHTML = `
      <div class="footer-grid">
        <div class="footer-identity">
          <a class="brand" href="/" aria-label="SKAR Corporation home"><img class="brand-wordmark" src="/assets/skar-wordmark.png" alt="SKAR Corporation"></a>
          <p>Knowledge. Vision. Engineering.</p>
        </div>
        <div class="footer-section"><h4>Company</h4><a href="/about/">About</a><a href="/careers/">Careers</a></div>
        <div class="footer-section"><h4>Expertise</h4><a href="/solutions/">Solutions</a><a href="/industries/">Industries</a></div>
        <div class="footer-section footer-insights"><h4>Insights</h4><a href="/way-through/">The Way Through</a><a href="/research/">Research</a><a href="/market-views/">Market Views</a><a href="/visualization/">Visualization</a><a href="/news/">News</a></div>
        <div class="footer-section footer-contact"><h4>Contact</h4><a href="/contact/">Start a conversation <span aria-hidden="true">↗</span></a></div>
      </div>
      <div class="footer-bottom">
        <div class="copyright">© 2026 SKAR Corporation. All rights reserved.</div>
        <div class="footer-follow" aria-label="Follow SKAR">
          <span>Follow SKAR</span>
          <a href="https://x.com/Skarcorporation" target="_blank" rel="noopener noreferrer" aria-label="Follow SKAR on X"><b class="footer-social-x" aria-hidden="true">X</b></a>
          <a href="https://www.linkedin.com/company/skar-corp" target="_blank" rel="noopener noreferrer" aria-label="Follow SKAR on LinkedIn"><b class="footer-social-linkedin" aria-hidden="true">in</b></a>
        </div>
      </div>
    `;
    localizeMarkup(footer);
  }

  const desktopGroups = [...header.querySelectorAll('.nav-group')];
  const mobileGroups = [...mobileLayer.querySelectorAll('.mobile-nav-group')];
  const toggle = header.querySelector('.nav-toggle');
  const closeButton = mobileLayer.querySelector('.mobile-nav-close');
  let lockedScrollY = 0;
  let menuOpen = false;
  let lastScrollY = Math.max(0, window.scrollY);
  let scrollTicking = false;
  let bodyStyleSnapshot = null;

  function closeDesktopGroups(except) {
    desktopGroups.forEach((group) => {
      if (group === except) return;
      group.classList.remove('open');
      group.querySelector('.nav-group-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  desktopGroups.forEach((group) => {
    const trigger = group.querySelector('.nav-group-trigger');
    trigger.addEventListener('click', () => {
      const opening = !group.classList.contains('open');
      closeDesktopGroups(group);
      group.classList.toggle('open', opening);
      trigger.setAttribute('aria-expanded', String(opening));
    });
  });

  function closeMobileGroups(except) {
    mobileGroups.forEach((group) => {
      if (group === except) return;
      group.classList.remove('open');
      group.querySelector('.mobile-nav-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  mobileGroups.forEach((group) => {
    const trigger = group.querySelector('.mobile-nav-trigger');
    trigger.addEventListener('click', () => {
      const opening = !group.classList.contains('open');
      closeMobileGroups(group);
      group.classList.toggle('open', opening);
      trigger.setAttribute('aria-expanded', String(opening));
    });
  });

  function showHeader() {
    header.classList.remove('is-hidden');
  }

  function lockPage() {
    lockedScrollY = Math.max(0, window.scrollY);
    bodyStyleSnapshot = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width
    };
    document.documentElement.classList.add('mobile-nav-open');
    document.body.classList.add('mobile-nav-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unlockPage() {
    if (!bodyStyleSnapshot) return;
    document.documentElement.classList.remove('mobile-nav-open');
    document.body.classList.remove('mobile-nav-open');
    document.body.style.position = bodyStyleSnapshot.position;
    document.body.style.top = bodyStyleSnapshot.top;
    document.body.style.left = bodyStyleSnapshot.left;
    document.body.style.right = bodyStyleSnapshot.right;
    document.body.style.width = bodyStyleSnapshot.width;
    bodyStyleSnapshot = null;
    window.scrollTo(0, lockedScrollY);
    lastScrollY = lockedScrollY;
  }

  function openMenu() {
    if (!mobileQuery.matches || menuOpen) return;
    closeDesktopGroups();
    closeMobileGroups();
    showHeader();
    menuOpen = true;
    lockPage();
    mobileLayer.hidden = false;
    mobileLayer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => mobileLayer.classList.add('is-open'));
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    closeButton.focus({ preventScroll: true });
  }

  function closeMenu(options) {
    const restoreFocus = Boolean(options && options.restoreFocus);
    if (!menuOpen) {
      closeMobileGroups();
      return;
    }
    menuOpen = false;
    mobileLayer.classList.remove('is-open');
    mobileLayer.setAttribute('aria-hidden', 'true');
    mobileLayer.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    closeMobileGroups();
    unlockPage();
    showHeader();
    if (restoreFocus && mobileQuery.matches) toggle.focus({ preventScroll: true });
  }

  function resetNavigation() {
    closeDesktopGroups();
    closeMenu();
    showHeader();
  }

  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    openMenu();
  });
  closeButton.addEventListener('click', () => closeMenu({ restoreFocus: true }));

  mobileLayer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeDesktopGroups();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (menuOpen) closeMenu({ restoreFocus: true });
      else closeDesktopGroups();
      return;
    }
    if (!menuOpen || event.key !== 'Tab') return;
    const focusable = [...mobileLayer.querySelectorAll('a[href], button:not([disabled])')].filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function updateHeaderFromScroll() {
    scrollTicking = false;
    if (!mobileQuery.matches || menuOpen) {
      lastScrollY = Math.max(0, window.scrollY);
      return;
    }
    const currentY = Math.max(0, window.scrollY);
    const delta = currentY - lastScrollY;
    if (currentY <= 8 || delta < -1) {
      showHeader();
    } else if (delta > 2 && currentY > header.offsetHeight + 12) {
      header.classList.add('is-hidden');
    }
    lastScrollY = currentY;
  }

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateHeaderFromScroll);
  }, { passive: true });

  window.addEventListener('pageshow', resetNavigation);
  window.addEventListener('pagehide', () => closeMenu());
  window.addEventListener('orientationchange', resetNavigation);
  window.addEventListener('resize', () => {
    if (!mobileQuery.matches) closeMenu();
    showHeader();
    lastScrollY = Math.max(0, window.scrollY);
  }, { passive: true });
})();
