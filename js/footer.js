/* Shared footer: auto year + dynamic site info (brand, contact, socials) — used on every public page */
(function () {
  'use strict';
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* auto-updating © year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* brand / contact / socials from Settings */
  fetch('/api/site-info').then(function (r) { return r.ok ? r.json() : null; }).then(function (info) {
    if (!info || !info.site) return;
    var s = info.site;
    if (s.brandName) $$('[data-brand]').forEach(function (el) { el.textContent = s.brandName; });
    var c = s.contact || {};
    if (c.email) $$('[data-contact="email"]').forEach(function (el) { el.textContent = c.email; el.href = 'mailto:' + c.email; });
    if (c.phone) $$('[data-contact="phone"]').forEach(function (el) { el.textContent = c.phone; el.href = 'tel:' + c.phone.replace(/\s/g, ''); });
    if (c.address) $$('[data-contact="address"]').forEach(function (el) { el.textContent = c.address; });
    var soc = s.social || {};
    $$('[data-soc]').forEach(function (a) {
      var url = soc[a.getAttribute('data-soc')];
      if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
      else a.style.display = 'none';
    });
  }).catch(function () {});

  /* auth-aware CTA: logged in -> "Go to Dashboard" (/admin/), else "Get Started" (/admin/login.html) */
  var ARROW = ' <svg class="ic"><use href="img/icons.svg#arrow-right"/></svg>';
  fetch('/api/me').then(function (r) {
    if (!r.ok) return; /* stay on Get Started */
    $$('[data-auth-btn]').forEach(function (a) {
      a.innerHTML = 'Go to Dashboard' + ARROW;
      a.setAttribute('href', '/admin/');
    });
  }).catch(function () {});
})();
