/* Business Automation — landing interactions */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---- theme ---- */
  const root = document.documentElement;
  const themeBtn = $('#themeBtn');
  function themeIcon(t) {
    return '<svg class="ic"><use href="img/icons.svg#' + (t === 'dark' ? 'moon' : 'sun') + '"/></svg>';
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('ba-theme', t); } catch (e) {}
    if (themeBtn) themeBtn.innerHTML = themeIcon(t);
  }
  let saved = 'dark';
  try { saved = localStorage.getItem('ba-theme') || 'dark'; } catch (e) {}
  setTheme(saved);
  if (themeBtn) themeBtn.addEventListener('click', () =>
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* ---- mobile menu ---- */
  const burger = $('#burger'), mMenu = $('#mobileMenu');
  function burgerIcon(open) {
    return '<svg class="ic"><use href="img/icons.svg#' + (open ? 'x' : 'menu') + '"/></svg>';
  }
  if (burger && mMenu) {
    burger.addEventListener('click', () => {
      const open = mMenu.classList.toggle('open');
      burger.innerHTML = burgerIcon(open);
    });
    $$('a', mMenu).forEach(a => a.addEventListener('click', () => {
      mMenu.classList.remove('open'); burger.innerHTML = burgerIcon(false);
    }));
  }

  /* ---- active nav link on scroll ---- */
  const links = $$('.nav-links a, .mobile-menu a');
  const secs = ['home', 'services', 'features', 'about'].map(id => document.getElementById(id)).filter(Boolean);
  function onScroll() {
    let cur = 'home';
    for (const s of secs) if (window.scrollY >= s.offsetTop - 120) cur = s.id;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$('.rv').forEach(el => io.observe(el));

  /* ---- animated counters ---- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    const suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1600;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * ease).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---- cookie consent ---- */
  const banner = $('#cookieBanner');
  let consent = null;
  try { consent = localStorage.getItem('ba-cookie-consent'); } catch (e) {}
  if (banner && !consent) setTimeout(() => banner.classList.add('show'), 1200);
  function decide(v) {
    try { localStorage.setItem('ba-cookie-consent', v); } catch (e) {}
    if (banner) banner.classList.remove('show');
  }
  const acc = $('#cookieAccept'), dec = $('#cookieDecline');
  if (acc) acc.addEventListener('click', () => decide('accepted'));
  if (dec) dec.addEventListener('click', () => decide('declined'));

  /* ---- dynamic about text (home page only; footer handled by footer.js) ---- */
  fetch('/api/site-info').then(r => r.ok ? r.json() : null).then(info => {
    if (!info || !info.site) return;
    const s = info.site;
    if (s.about && s.about.title) { const t = $('[data-about-title]'); if (t) t.textContent = s.about.title; }
    if (s.about && s.about.text) { const t = $('[data-about-text]'); if (t) t.textContent = s.about.text; }
  }).catch(() => {});
})();
