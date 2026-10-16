/* Business Automation — Admin Panel */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- theme ---------- */
  const root = document.documentElement, themeBtn = $('themeBtn');
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('ba-theme', t); } catch (e) {}
    if (themeBtn) themeBtn.innerHTML = '<svg class="ic"><use href="/img/icons.svg#' + (t === 'dark' ? 'moon' : 'sun') + '"/></svg>';
  }
  let saved = 'dark';
  try { saved = localStorage.getItem('ba-theme') || 'dark'; } catch (e) {}
  setTheme(saved);
  if (themeBtn) themeBtn.addEventListener('click', () =>
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* ---------- api helper ---------- */
  async function api(m, u, b, opts) {
    opts = opts || {};
    if (!opts.silent) showRipple(opts.label);
    try {
    const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    if (r.status === 401) { location.href = '/admin/login.html'; throw new Error('login'); }
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((j && j.error) || ('HTTP ' + r.status));
    return j;
    } finally {
      if (!opts.silent) hideRipple();
    }
  }
  function toast(m, err) {
    const t = $('toast'); t.textContent = m; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(t._h); t._h = setTimeout(() => t.className = 'toast', 2800);
  }

  /* ---------- ripple preloader ---------- */
  let rippleN = 1; // overlay is visible in HTML on boot
  let rippleHideT = null, rippleSafeT = null;
  function rippleLabel(t) { const l = $('rippleLabel'); if (l && t) l.textContent = t; }
  function showRipple(label) {
    rippleN++;
    clearTimeout(rippleHideT);
    const o = $('rippleOverlay'); if (!o) return;
    rippleLabel(label);
    o.classList.remove('gone');
    clearTimeout(rippleSafeT);
    rippleSafeT = setTimeout(() => { rippleN = 0; o.classList.add('gone'); }, 25000); // failsafe
  }
  function hideRipple() {
    rippleN = Math.max(0, rippleN - 1);
    if (rippleN) return;
    clearTimeout(rippleHideT);
    rippleHideT = setTimeout(() => { if (!rippleN) { const o = $('rippleOverlay'); if (o) o.classList.add('gone'); } }, 200);
  }

  /* ---------- sidebar / views ---------- */
  const sidebar = $('sidebar'), scrim = $('scrim');
  function closeSide() { sidebar.classList.remove('open'); scrim.classList.remove('open'); }
  $('hamb').addEventListener('click', () => { sidebar.classList.add('open'); scrim.classList.add('open'); });
  scrim.addEventListener('click', closeSide);
  function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const v = $('view-' + name); if (v) v.classList.add('active');
    document.querySelectorAll('.side-item[data-view]').forEach(b =>
      b.classList.toggle('active', b.dataset.view === name));
    closeSide();
    const rlabels = { dashboard: T('ड्यासबोर्ड लोड हुँदै…', 'Loading dashboard…'), comments: T('अटोमेसन लोड हुँदै…', 'Loading automation…'),
      users: T('प्रयोगकर्ता लोड हुँदै…', 'Loading users…'), settings: T('सेटिङ लोड हुँदै…', 'Loading settings…'),
      'signup-access': T('Signup सेटिङ लोड हुँदै…', 'Loading signup settings…'), smtp: T('इमेल सेटिङ लोड हुँदै…', 'Loading email settings…') };
    if (rlabels[name]) rippleLabel(rlabels[name]);
    if (name === 'settings') loadSettings();
    if (name === 'dashboard' || name === 'comments') refresh();
    if (name === 'users') loadUsers();
    if (name === 'signup-access') loadSignupAccess();
    if (name === 'smtp') loadSmtp();
  }
  document.querySelectorAll('.side-item[data-view]').forEach(b =>
    b.addEventListener('click', () => showView(b.dataset.view)));

  /* ---------- profile dropdown ---------- */
  const avatarBtn = $('avatarBtn'), drop = $('profileDrop');
  avatarBtn.addEventListener('click', e => { e.stopPropagation(); drop.classList.toggle('open'); });
  document.addEventListener('click', e => { if (!drop.contains(e.target)) drop.classList.remove('open'); });
  document.querySelectorAll('[data-goto]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); drop.classList.remove('open'); showView(a.dataset.goto);
  }));
  $('logoutBtn').addEventListener('click', async () => {
    showRipple(T('लगआउट हुँदै…', 'Logging out…'));
    try { await api('POST', '/api/logout', null, { silent: true }); } catch (e) {}
    location.href = '/admin/login.html'; // ripple stays up until the login page paints
  });

  /* ---------- auth / me ---------- */
  let ME = { username: 'admin', fullName: '', email: '', avatar: '', role: 'user' };
  function T(ne, en) { return ME.role === 'admin' ? ne : en; } // admin: Nepali, others: English
  function paintAvatar() {
    const init = (ME.fullName || ME.username || 'A').trim().charAt(0).toUpperCase();
    $('dropName').textContent = ME.fullName || ME.username || 'Admin';
    const dr = $('dropRole'); if (dr) dr.textContent = ME.role === 'admin' ? 'Administrator' : 'User';
    if (ME.avatar) {
      $('avatarBtn').innerHTML = '<img src="' + esc(ME.avatar) + '" alt="profile">';
    } else {
      $('avatarBtn').innerHTML = '<span id="avatarInit">' + esc(init) + '</span>';
    }
  }
  (async () => {
    try {
      const me = await api('GET', '/api/me', null, { silent: true });
      ME = me; paintAvatar();
      const ds = $('dashSub');
      if (ds) ds.textContent = me.role === 'admin'
        ? 'System-wide overview — all accounts, users & activity'
        : 'Your accounts, activity & stats at a glance';
      if (me.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.hidden = false);
        document.querySelectorAll('[data-ne]').forEach(el => { el.innerHTML = el.dataset.ne; });
        document.querySelectorAll('[data-ne-ph]').forEach(el => { el.placeholder = el.dataset.nePh; });
      }
      rippleLabel(T('ड्यासबोर्ड लोड हुँदै…', 'Loading dashboard…'));
      await refresh();
    } catch (e) { /* 401 already redirected to login */ }
    hideRipple(); // balances the boot-visible overlay
  })();

  /* ================= COMMENT AUTOMATION ================= */
  let pages = [];
  function ago(ts) {
    if (!ts) return 'never';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    return Math.floor(s / 3600) + 'h ago';
  }
  window.refresh = async function (silent) {
    const so = silent ? { silent: true } : undefined;
    try {
      const [pl, st] = await Promise.all([api('GET', '/api/pages', null, so), api('GET', '/api/status', null, so)]);
      pages = pl.pages;
      $('sPages').textContent = pages.length;
      $('sActive').textContent = pages.filter(p => p.enabled).length;
      let today = 0; for (const s of st.pages) today += s.repliesToday || 0;
      $('sToday').textContent = today;
      $('sPoll').textContent = ago(st.lastPoll);
      if (ME.role === 'admin') {
        try { const u = await api('GET', '/api/admin/users', null, so); $('sUsers').textContent = (u.users || []).length; }
        catch (e) { /* admin-only stat */ }
      }
      const g = $('grid'); g.innerHTML = '';
      $('empty').style.display = pages.length ? 'none' : 'block';
      for (const p of pages) {
        const s = st.pages.find(x => x.id === p.id) || {};
        const dot = s.lastError ? 'err' : (s.lastCheck ? 'ok' : '');
        const card = document.createElement('div');
        card.className = 'pcard' + (p.enabled ? '' : ' off');
        card.innerHTML =
          '<div class="ptop"><div class="pname"><span class="dot ' + dot + '"></span>' + esc(p.name) + '</div>' +
          '<label class="switch" title="On/Off"><input type="checkbox" ' + (p.enabled ? 'checked' : '') +
          ' onchange="togglePage(\'' + p.id + '\',this.checked)"><span class="slider"></span></label></div>' +
          '<div class="pmeta">ID: ' + esc(p.pageId) + '</div>' +
          '<div class="pmeta">Token: ' + esc(p.tokenMasked) + '</div>' +
          (s.lastError ? '<div class="pmeta alert">⚠ ' + esc(s.lastError) + '</div>' : '') +
          '<div class="pmsg">' + esc(p.replyMessage || '(default message)') + '</div>' +
          '<div class="prow"><span>Today <b>' + (s.repliesToday || 0) + '</b></span>' +
          '<span>This hour <b>' + (s.repliesThisHour || 0) + '</b></span>' +
          '<span>Last poll <b>' + ago(s.lastCheck) + '</b></span></div>' +
          '<div class="pactions"><button class="btn btn-ghost btn-sm" onclick="editPage(\'' + p.id + '\')"><svg class="ic"><use href="/img/icons.svg#edit"/></svg> Edit</button>' +
          '<button class="btn btn-danger btn-sm" onclick="delPage(\'' + p.id + '\',\'' + esc(p.name).replace(/'/g, "\\'") + '\')"><svg class="ic"><use href="/img/icons.svg#trash"/></svg> Delete</button></div>';
        g.appendChild(card);
      }
    } catch (e) { /* login redirect handled in api() */ }
  };
  window.openModal = function () {
    $('mtitle').textContent = 'Add Facebook Account/Page';
    for (const id of ['fId', 'fPageId', 'fToken', 'fName', 'fMsg']) $(id).value = '';
    $('tokenHint').textContent = T('Graph API Explorer बाट लिएको Account/Page token — verify गरेर मात्र save हुन्छ।', 'Account/Page token from Graph API Explorer — it is verified before saving.');
    $('mback').classList.add('open');
  };
  window.closeModal = function () { $('mback').classList.remove('open'); };
  $('insNameBtn').addEventListener('click', () => {
    const ta = $('fMsg'), ins = '{name}';
    const st = ta.selectionStart ?? ta.value.length, en = ta.selectionEnd ?? st;
    ta.value = ta.value.slice(0, st) + ins + ta.value.slice(en);
    const pos = st + ins.length;
    ta.focus(); ta.setSelectionRange(pos, pos);
  });
  window.editPage = function (id) {
    const p = pages.find(x => x.id === id); if (!p) return;
    $('mtitle').textContent = 'Edit — ' + p.name;
    $('fId').value = p.id; $('fPageId').value = p.pageId; $('fToken').value = '';
    $('fName').value = p.name; $('fMsg').value = p.replyMessage || '';
    $('tokenHint').textContent = T('खाली छोडे पुरानै token रहन्छ। नयाँ token भए हाल्नुस् (verify हुन्छ)।', 'Leave empty to keep the existing token. A new token will be verified.');
    $('mback').classList.add('open');
  };
  window.savePage = async function () {
    const btn = $('saveBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Verifying…';
    try {
      const id = $('fId').value;
      const body = { pageId: $('fPageId').value.trim(), name: $('fName').value.trim(), replyMessage: $('fMsg').value };
      const tok = $('fToken').value.trim(); if (tok) body.token = tok;
      if (id) { await api('PUT', '/api/pages/' + id, body, { label: T('एकाउन्ट सेभ हुँदै…', 'Saving account…') }); toast('Page updated'); }
      else { await api('POST', '/api/pages', body, { label: T('एकाउन्ट थपिँदै…', 'Adding account…') }); toast('Page added'); }
      closeModal(); refresh();
    } catch (e) { toast(e.message, true); }
    btn.disabled = false; btn.textContent = 'Save Page';
  };
  window.togglePage = async function (id, on) {
    try { await api('POST', '/api/pages/' + id + '/toggle', { enabled: on }, { label: T('अपडेट हुँदै…', 'Updating account…') }); toast(on ? 'Page ON' : 'Page OFF'); refresh(); }
    catch (e) { toast(e.message, true); refresh(); }
  };
  window.delPage = async function (id, name) {
    if (!confirm(T('Delete "' + name + '"? Bot ले अब यसमा reply गर्दैन।', 'Delete "' + name + '"? The bot will no longer reply on it.'))) return;
    try { await api('DELETE', '/api/pages/' + id, null, { label: T('मेटिँदै…', 'Deleting…') }); toast('Deleted'); refresh(); }
    catch (e) { toast(e.message, true); }
  };

  /* ================= SETTINGS ================= */
  let settingsLoaded = false, pendingAvatar = null;
  async function loadSettings() {
    try {
      const s = await api('GET', '/api/settings', null, { label: T('सेटिङ लोड हुँदै…', 'Loading settings…') });
      $('setUsername').value = s.profile.username || '';
      $('setFullName').value = s.profile.fullName || '';
      $('setEmail').value = s.profile.email || '';
      ME.username = s.profile.username || ME.username;
      ME.fullName = s.profile.fullName || ME.fullName;
      ME.email = s.profile.email || '';
      ME.avatar = s.profile.avatar || '';
      paintAvatar(); paintSettingsAvatar();
      const c = s.site.contact || {}, so = s.site.social || {}, ab = s.site.about || {};
      $('ctEmail').value = c.email || ''; $('ctPhone').value = c.phone || ''; $('ctAddr').value = c.address || '';
      $('soFb').value = so.facebook || ''; $('soIg').value = so.instagram || '';
      $('soYt').value = so.youtube || ''; $('soTk').value = so.tiktok || '';
      $('abTitle').value = ab.title || ''; $('abText').value = ab.text || '';
      // connected pages
      const pl = await api('GET', '/api/pages', null, { label: T('सेटिङ लोड हुँदै…', 'Loading settings…') });
      const box = $('connList');
      if (!pl.pages.length) { box.innerHTML = '<div style="color:var(--faint);font-size:14px">No pages connected yet — add one from Comment Automation.</div>'; }
      else box.innerHTML = pl.pages.map(p =>
        '<div class="conn-row"><div class="fb-ic"><svg class="ic"><use href="/img/icons.svg#facebook"/></svg></div><div class="info"><b>' + esc(p.name) + '</b>' +
        '<span>ID ' + esc(p.pageId) + ' · ' + esc(p.tokenMasked) + '</span></div>' +
        '<span class="st ' + (p.enabled ? 'on' : 'off') + '">' + (p.enabled ? '● ON' : '○ OFF') + '</span></div>'
      ).join('');
      settingsLoaded = true;
    } catch (e) { /* ignore */ }
  }
  function paintSettingsAvatar() {
    const prev = $('avatarPrev');
    if (ME.avatar) prev.innerHTML = '<img src="' + esc(ME.avatar) + '" alt="avatar">';
    else prev.innerHTML = '<span id="avatarPrevInit">' + esc((ME.username || 'A').charAt(0).toUpperCase()) + '</span>';
  }
  $('avatarFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast(T('Photo 4MB भन्दा सानो हुनुपर्छ', 'Photo must be smaller than 4MB'), true); e.target.value = ''; return; }
    const rd = new FileReader();
    rd.onload = () => { pendingAvatar = rd.result; ME.avatar = rd.result; paintAvatar(); paintSettingsAvatar(); toast(T('Photo selected — Save Profile थिच्नुहोस्', 'Photo selected — press Save Profile')); };
    rd.readAsDataURL(f);
  });
  window.saveProfile = async function () {
    const btn = $('saveProfileBtn'); btn.disabled = true;
    try {
      const me = await api('PUT', '/api/settings/profile',
        { username: $('setUsername').value.trim(), fullName: $('setFullName').value.trim(), avatar: pendingAvatar },
        { label: T('प्रोफाइल सेभ हुँदै…', 'Saving profile…') });
      ME.username = me.username; ME.fullName = me.fullName || ''; ME.avatar = me.avatar || '';
      pendingAvatar = null; paintAvatar(); paintSettingsAvatar();
      toast('Profile saved');
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };
  window.toggleEmailBox = function () {
    const b = $('emailOtpBox');
    b.style.display = b.style.display === 'none' ? 'block' : 'none';
  };
  window.sendEmailOtp = async function () {
    const btn = $('sendEmailOtpBtn'); btn.disabled = true;
    try {
      const email = $('newEmail').value.trim();
      if (!email) { toast(T('नयाँ email लेख्नुहोस्', 'Please enter the new email'), true); btn.disabled = false; return; }
      await api('POST', '/api/settings/email/request', { email }, { label: T('कोड पठाइँदै…', 'Sending code…') });
      toast(T('Code पठाइयो — नयाँ email check गर्नुहोस्', 'Code sent — check your new email'));
      $('emailCodeField').style.display = 'block';
      $('confirmEmailBtn').style.display = 'inline-block';
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };
  window.confirmEmail = async function () {
    const btn = $('confirmEmailBtn'); btn.disabled = true;
    try {
      const code = $('emailCode').value.trim();
      if (code.length !== 6) { toast(T('6-digit code हाल्नुहोस्', 'Please enter the 6-digit code'), true); btn.disabled = false; return; }
      const r = await api('POST', '/api/settings/email/confirm', { code }, { label: T('भेरिफाइ हुँदै…', 'Verifying…') });
      $('setEmail').value = r.email || ''; ME.email = r.email || '';
      $('emailOtpBox').style.display = 'none';
      $('emailCodeField').style.display = 'none';
      $('confirmEmailBtn').style.display = 'none';
      $('newEmail').value = ''; $('emailCode').value = '';
      toast('Email changed');
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };
  window.savePassword = async function () {
    const btn = $('savePwBtn'); btn.disabled = true;
    try {
      await api('PUT', '/api/settings/password', {
        current: $('pwCur').value, next: $('pwNew').value, confirm: $('pwNew2').value },
        { label: T('पासवर्ड अपडेट हुँदै…', 'Updating password…') });
      $('pwCur').value = $('pwNew').value = $('pwNew2').value = '';
      toast('Password changed');
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };
  window.saveSite = async function () {
    const btn = $('saveSiteBtn'); btn.disabled = true;
    try {
      await api('PUT', '/api/settings/site', {
        contact: { email: $('ctEmail').value.trim(), phone: $('ctPhone').value.trim(), address: $('ctAddr').value.trim() },
        social: { facebook: $('soFb').value.trim(), instagram: $('soIg').value.trim(), youtube: $('soYt').value.trim(), tiktok: $('soTk').value.trim() },
        about: { title: $('abTitle').value.trim(), text: $('abText').value.trim() }
      }, { label: T('सेभ हुँदै…', 'Saving…') });
      toast('Website content saved');
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };

  /* ================= ADMIN: USERS ================= */
  function fmtDate(ts) {
    if (!ts) return '–';
    try { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return '–'; }
  }
  window.loadUsers = async function () {
    const tb = $('usersBody');
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--faint)">Loading…</td></tr>';
    try {
      const j = await api('GET', '/api/admin/users', null, { label: T('प्रयोगकर्ता लोड हुँदै…', 'Loading users…') });
      if (!j.users.length) { tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--faint)">No users yet.</td></tr>'; return; }
      tb.innerHTML = j.users.map(u => {
        const isSelf = ME.username && u.username === ME.username;
        const roleBadge = '<span class="badge ' + u.role + '">' + (u.role === 'admin' ? 'Admin' : 'User') + '</span>';
        const stBadge = '<span class="badge ' + u.status + '">' +
          (u.status === 'active' ? 'Active' : u.status === 'pending' ? 'Pending' : 'Disabled') + '</span>';
        const roleSel = '<select class="mini-select" onchange="userRoleChange(\'' + u.id + '\',this.value)" ' + (isSelf ? 'disabled' : '') + '>' +
          '<option value="user"' + (u.role === 'user' ? ' selected' : '') + '>User</option>' +
          '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option></select>';
        const stBtn = u.status === 'active'
          ? '<button class="btn btn-ghost btn-sm" onclick="userStatusToggle(\'' + u.id + '\',\'disabled\')" ' + (isSelf ? 'disabled' : '') + '>Disable</button>'
          : (u.status === 'disabled'
            ? '<button class="btn btn-ghost btn-sm" onclick="userStatusToggle(\'' + u.id + '\',\'active\')">Enable</button>'
            : '<span style="font-size:12px;color:var(--faint)">—</span>');
        const delBtn = isSelf ? '' : '<button class="btn btn-danger btn-sm" onclick="userDelete(\'' + u.id + '\',\'' + esc(u.username).replace(/\'/g, "\\'") + '\')"><svg class="ic"><use href="/img/icons.svg#trash"/></svg></button>';
        return '<tr><td><b>' + esc(u.fullName || '–') + '</b></td><td>' + esc(u.username) + (isSelf ? ' <span class="badge user">you</span>' : '') +
          '</td><td>' + esc(u.email || '–') + '</td><td>' + roleBadge + '</td><td>' + stBadge + '</td><td>' + (u.pages || 0) +
          '</td><td>' + fmtDate(u.createdAt) + '</td>' +
          '<td><div class="row-actions">' + roleSel + stBtn + delBtn + '</div></td></tr>';
      }).join('');
    } catch (e) { tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--err)">' + esc(e.message) + '</td></tr>'; }
  };
  window.userRoleChange = async function (id, role) {
    try { await api('PUT', '/api/admin/users/' + id, { role }, { label: T('प्रयोगकर्ता अपडेट हुँदै…', 'Updating user…') }); toast(role === 'admin' ? 'Admin access दिइयो' : 'Normal user बनाइयो'); loadUsers(); }
    catch (e) { toast(e.message, true); loadUsers(); }
  };
  window.userStatusToggle = async function (id, status) {
    try { await api('PUT', '/api/admin/users/' + id, { status }, { label: T('प्रयोगकर्ता अपडेट हुँदै…', 'Updating user…') }); toast(status === 'active' ? 'Account enabled' : 'Account disabled'); loadUsers(); }
    catch (e) { toast(e.message, true); }
  };
  window.userDelete = async function (id, username) {
    if (!confirm('Delete user "' + username + '"? यो action undo हुँदैन।')) return;
    try {
      const r = await api('DELETE', '/api/admin/users/' + id, null, { label: T('प्रयोगकर्ता मेटिँदै…', 'Deleting user…') });
      toast('User deleted' + (r.pagesMoved ? ' (' + r.pagesMoved + ' pages moved to you)' : ''));
      loadUsers();
    } catch (e) { toast(e.message, true); }
  };

  /* ================= ADMIN: SIGNUP ACCESS ================= */
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'signupToggle') paintSignupLabel(); });
  window.loadSignupAccess = async function () {
    try {
      const j = await api('GET', '/api/admin/signup-access', null, { label: T('लोड हुँदै…', 'Loading…') });
      $('signupToggle').checked = !!j.signupEnabled;
      paintSignupLabel();
    } catch (e) { toast(e.message, true); }
  };
  function paintSignupLabel() {
    const on = $('signupToggle').checked;
    $('signupStateLabel').textContent = on ? 'Signup ON' : 'Signup OFF';
    $('signupStateLabel').style.color = on ? 'var(--ok)' : 'var(--warn)';
  }
  window.saveSignupAccess = async function () {
    const btn = $('saveSignupBtn'); btn.disabled = true;
    try {
      const j = await api('PUT', '/api/admin/signup-access', { signupEnabled: $('signupToggle').checked }, { label: T('अपडेट हुँदै…', 'Updating…') });
      paintSignupLabel();
      toast(j.signupEnabled ? 'Signup खोलियो' : 'Signup बन्द गरियो');
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };

  /* ================= ADMIN: GMAIL SMTP ================= */
  window.loadSmtp = async function () {
    try {
      const j = await api('GET', '/api/admin/smtp', null, { label: T('लोड हुँदै…', 'Loading…') });
      $('smtpUser').value = j.user || '';
      $('smtpPass').value = '';
      paintSmtpStatus(j.configured);
    } catch (e) { toast(e.message, true); }
  };
  function paintSmtpStatus(configured) {
    const el = $('smtpStatus');
    el.className = 'smtp-status' + (configured ? ' ok' : '');
    el.innerHTML = '<span class="dot"></span><span class="' + (configured ? 'st-ok' : 'st-no') + '">' +
      (configured ? 'Configured — OTP emails जान्छन्' : 'Not configured — पहिले Gmail + App Password save गर्नुहोस्') + '</span>';
  }
  window.saveSmtp = async function () {
    const btn = $('saveSmtpBtn'); btn.disabled = true;
    try {
      const j = await api('PUT', '/api/admin/smtp',
        { user: $('smtpUser').value.trim(), pass: $('smtpPass').value },
        { label: T('सेभ हुँदै…', 'Saving…') });
      $('smtpPass').value = '';
      paintSmtpStatus(j.configured);
      toast('SMTP saved');
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };
  window.testSmtp = async function () {
    const btn = $('testSmtpBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Sending…';
    try {
      const j = await api('POST', '/api/admin/smtp/test', null, { label: T('टेस्ट इमेल पठाइँदै…', 'Sending test email…') });
      toast('Test email पठाइयो → ' + j.to);
    } catch (e) { toast(e.message, true); }
    btn.disabled = false; btn.textContent = 'Send Test Email';
  };

  /* ---------- init ---------- */
  setInterval(() => { if ($('view-dashboard').classList.contains('active') || $('view-comments').classList.contains('active')) refresh(true); }, 30000);
})();
