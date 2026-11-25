/* Galore / ripple direction: page behaviour. Loads after prices.js, galore-kit.js, water.js. */
(function () {
  'use strict';
  var G = window.Galore, W = window.Water, P = G.prices, SLUG = 'ripple';
  var qs = new URLSearchParams(location.search);
  var reduce = W.reduce;
  var LOCAL_DRAFT = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /^galore-comparison-preview(?:-[a-z0-9-]+)?\.vercel\.app$/.test(location.hostname);
  var APP = LOCAL_DRAFT ? location.origin + '/dashboard-preview.html' : 'https://app.trygalore.com/';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (v, int) { return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: int ? 0 : 2, maximumFractionDigits: int ? 0 : 2 }); };
  var pct = function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%'; };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };
  function joined() { return G.isJoined(); }
  function dropAt(el, r, s, fx, fy) {
    if (!el) return; var b = el.getBoundingClientRect();
    if (b.bottom < -50 || b.top > innerHeight + 50) return;
    W.drop(b.left + b.width * (fx == null ? 0.5 : fx), b.top + b.height * (fy == null ? 0.5 : fy), r, s);
  }
  var later = function (fn, ms) { return setTimeout(fn, ms); };
  /* a rejected field shakes as well as saying why, so it is obvious which one needs fixing */
  function shake(el) {
    if (!el || reduce) return;
    el.classList.remove('is-shaking'); void el.offsetWidth; el.classList.add('is-shaking');
    el.addEventListener('animationend', function () { el.classList.remove('is-shaking'); }, { once: true });
  }
  /* a damped spring that starts at the release speed, so a flick carries on instead of restarting at a fixed pace.
     step(x) runs every frame; done() runs once it has settled on `to`. Returns a cancel function. */
  function spring(from, to, v0, step, done) {
    var x = from, v = v0, k = 420, c = 2 * Math.sqrt(k) * 0.86, last = performance.now(), id = 0;
    function tick(now) {
      var dt = Math.min(0.032, Math.max(0, (now - last) / 1000)); last = now;
      for (var i = 0; i < 4; i++) { var a = -k * (x - to) - c * v; v += a * dt / 4; x += v * dt / 4; }
      if (Math.abs(x - to) < 0.5 && Math.abs(v) < 20) { step(to); if (done) done(); return; }
      step(x); id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return function () { cancelAnimationFrame(id); };
  }
  /* rubber band: past the end the surface still moves, but less and less, as if held by elastic */
  function band(d, size) { var a = Math.abs(d); return (d < 0 ? -1 : 1) * (1 - 1 / (a * 0.55 / size + 1)) * size; }
  /* the Galore ring O on its own: same geometry as the wordmark O in shared/galore-kit.js */
  var RING = '<svg class="gk-o gring" viewBox="0 0 80 88" aria-hidden="true" focusable="false"><ellipse cx="39" cy="44" rx="31" ry="36" fill="none" stroke="currentColor" stroke-width="7.5"/><ellipse cx="42" cy="46" rx="22" ry="27" fill="none" stroke="currentColor" stroke-width="6.5" opacity=".88"/><ellipse cx="45" cy="48" rx="14" ry="18" fill="none" stroke="currentColor" stroke-width="5.8" opacity=".7"/><ellipse cx="48" cy="50" rx="7" ry="9" fill="none" stroke="currentColor" stroke-width="5" opacity=".55"/></svg>';
  var ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* real company names for the kit's tickers, and the logos the live site hosts */
  var NAMES = { NVDA: 'NVIDIA', AMD: 'AMD', AVGO: 'Broadcom', TSM: 'TSMC', PWR: 'Quanta Services', MAS: 'Masco', HD: 'Home Depot', LOW: "Lowe's", GLD: 'SPDR Gold Shares', SLV: 'iShares Silver Trust', NEM: 'Newmont', WPM: 'Wheaton Precious Metals', LLY: 'Eli Lilly', NVO: 'Novo Nordisk', CCJ: 'Cameco', CEG: 'Constellation Energy', VST: 'Vistra', OKLO: 'Oklo', COST: 'Costco', WMT: 'Walmart', TGT: 'Target', KO: 'Coca-Cola', PEP: 'PepsiCo', ITA: 'iShares Aerospace & Defense ETF', LMT: 'Lockheed Martin', RTX: 'RTX', NOC: 'Northrop Grumman', SPY: 'S&P 500 ETF', QQQ: 'Nasdaq-100 ETF', PLTR: 'Palantir', CRWD: 'CrowdStrike', PANW: 'Palo Alto Networks', NET: 'Cloudflare', UBER: 'Uber', TSLA: 'Tesla', RIVN: 'Rivian', AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Alphabet', META: 'Meta', AMZN: 'Amazon', JPM: 'JPMorgan Chase', GS: 'Goldman Sachs' };
  var TG = '/landing/assets/logos/', OS = 'https://static.ostium.io/assets/pairs/', LQ = 'https://www.liquid.trade/images/markets/hyperliquid/';
  var LOGO = { AMD: TG + 'AMD.svg', COST: TG + 'cost.png', XLE: TG + 'xle.png', NFLX: TG + 'NFLX.svg', CRWD: TG + 'crwd.svg', CVX: TG + 'CVX.svg', HOOD: TG + 'hood.png', XBI: TG + 'XBI.png', NET: TG + 'NET.svg', LINK: LQ + 'LINK.svg', QCOM: TG + 'QCOM.svg', EBAY: TG + 'EBAY.svg', DKNG: TG + 'DKNG.png', ICE: TG + 'ice.png', LITE: TG + 'LITE.png', MRNA: TG + 'MRNA.svg', PLUG: TG + 'PLUG.png', TTWO: TG + 'TTWO.svg', NVDA: OS + 'nvda.svg', AAPL: OS + 'aapl.svg', GOOGL: OS + 'goog.svg', BTC: LQ + 'BTC.svg', ETH: LQ + 'ETH.svg', SOL: LQ + 'SOL.svg', MSFT: TG + 'MSFT.png', ANT: TG + 'anthropic.svg', AMZN: TG + 'AMZN.png', AVGO: TG + 'avgo.png', COIN: TG + 'coinbase-current.png', SPY: TG + 'spy-index.svg', XRP: LQ + 'XRP.svg', DOGE: LQ + 'DOGE.svg', CRCL: TG + 'CRCL.svg', MRVL: TG + 'MRVL.svg' };
  var logoUrl = function (t) { return LOGO[t] || 'https://assets.parqet.com/logos/symbol/' + encodeURIComponent(t) + '?format=png'; };
  /* every ticker gets its logo on an ice disc; the monogram is only the onerror fallback */
  var logoImg = function (t) { return '<img src="' + logoUrl(t) + '" alt="" loading="lazy" referrerpolicy="no-referrer" data-t="' + esc(t) + '" onerror="var p=this.parentNode;p.classList.add(\'mono\');p.textContent=this.dataset.t">'; };
  var CREATORS = [
    { kind: 'creator', name: 'Jeremy Lefebvre', role: 'YouTube creator', slug: 'jeremy-lefebvre' },
    { kind: 'creator', name: 'Jim Cramer', role: 'X creator', slug: 'jim-cramer' },
    { kind: 'creator', name: 'Stas Serfes', role: 'TikTok creator', slug: 'stas-serfes', photo: 'https://yt3.googleusercontent.com/Cqssqh1t3_DMNOxfg7NZKx-BEdKRmyE-SeVgGM5lXVGk1-i7oG877teH8yxbu-VASEz4eaYhSw=s176-c-k-c0x00ffffff-no-rj' },
    { kind: 'creator', name: 'Warren Buffett', role: 'Berkshire Hathaway chairman emeritus', slug: 'warren-buffett' },
    { kind: 'creator', name: 'Cathie Wood', role: 'ARK Invest founder and CEO', slug: 'cathie-wood' },
    { kind: 'creator', name: 'Bill Ackman', role: 'Pershing Square CEO', slug: 'bill-ackman' },
    { kind: 'creator', name: 'David Tepper', role: 'Appaloosa founder, Carolina Panthers owner', slug: 'david-tepper' }
  ];
  var RETIRED = ['dan-crenshaw', 'marjorie-taylor-greene', 'tommy-tuberville'];
  var initials = function (n) { return n.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); };

  /* ------------------------------------------------------------ waitlist sheet: the live signup contract */
  var SIGNUP = LOCAL_DRAFT ? APP : APP + 'signup';
  var gt = function (name, props) { try { if (typeof window.galoreTrack === 'function') window.galoreTrack(name, props || {}); } catch (e) {} };
  var ATTR_KEY = 'galore_attr';
  function attribution() { var saved = {}; try { saved = JSON.parse(sessionStorage.getItem(ATTR_KEY) || '{}') || {}; } catch (e) {}
    try { var q = new URLSearchParams(location.search), r = (q.get('ref') || '').match(/^inv_([a-f0-9]{10})$/), u = (q.get('utm_source') || '').toLowerCase();
      if (r) saved.ref = r[1]; if (/^[a-z0-9_.:-]{1,64}$/.test(u)) saved.utm = u;
      if (r || u) { try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(saved)); } catch (e) {} } } catch (e) {}
    return saved; }
  if (document.body.classList.contains('home')) { var a0 = attribution(); gt('landing_view', { has_ref: !!a0.ref, utm_source: a0.utm || null, path: location.pathname }); }
  var signupReceiptEmail = null, signupGate = null, signupProfile = null, signupAsset = null, signupCreator = false, signupSource = 'home';
  var signupPending = false, signupAttempt = 0, signupLeaving = false, lastHandoff = null, lastFirst = '';
  var signupRefPresent = function () { return /^inv_[a-f0-9]{10}$/.test(new URLSearchParams(location.search).get('ref') || ''); };
  function trackSignup(name, source) { try { window.galoreTrack && window.galoreTrack(name, { source: source || signupSource, ref_present: signupRefPresent() }); } catch (e) {} }
  /* only a confirmed save sets the local flag; the email is never kept in localStorage */
  function markJoined() { store.set('galore.waitlist.v1', JSON.stringify({ joined: true, at: Date.now() })); document.documentElement.classList.add('is-joined'); }

  var sheet = document.createElement('div');
  sheet.className = 'sheet-wrap'; sheet.id = 's6-signup'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 's6-signup-title');
  sheet.innerHTML = '<div class="sheet-bg" data-close></div><div class="sheet"><div class="sheet-grip" aria-hidden="true"></div><button class="sheet-x" type="button" aria-label="Close waitlist" data-close></button>' +
    '<span class="sheet-logo" data-galore-wordmark></span>' +
    '<div class="wl-join"><h2 id="s6-signup-title">Join the waitlist</h2><p class="preview-signup-context">Preview only: no details are sent or saved. The actual waitlist is free and does not activate an account; paper access is offered in batches.</p></div>' +
    '<form class="wl-form" aria-label="Galore waitlist">' +
    '<label class="fld"><span>First name</span><input name="firstName" type="text" autocomplete="given-name" maxlength="80" required></label>' +
    '<label class="fld"><span>Last name</span><input name="lastName" type="text" autocomplete="family-name" maxlength="80" required></label>' +
    '<label class="fld w2"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" required placeholder="you@example.com"></label>' +
    '<label class="fld w2" data-creator-request-field hidden><span>Which creator would you like to follow?</span><input name="creatorRequest" type="text" maxlength="120" placeholder="Creator name or @handle" disabled></label>' +
    '<p class="wl-note">The actual waitlist sends launch updates. <a href="/waitlist-privacy.html" target="_blank" rel="noopener">How your details would be handled</a></p>' +
    '<button class="btn btn-go" type="submit"><span data-signup-submit-label>Join the waitlist</span></button></form>' +
    '<p class="wl-progress" data-signup-progress role="status" aria-live="polite">Add your name and email to join.</p>' +
    '<p class="wl-err" role="status" data-signup-status></p>' +
    '<div class="wl-receipt" role="status" data-signup-receipt hidden></div>' +
    '<div class="wl-done" data-waitlist-envelope hidden><div class="gate-rings" aria-hidden="true">' + RING + '</div><h2 id="s6-letter-title" tabindex="-1">You’re on the list</h2>' +
    '<p class="wl-letter" data-letter-note></p><p class="wl-sig">See you inside, Galore</p>' +
    '<a class="btn btn-foam" data-letter-action href="' + SIGNUP + '"><span>Continue to Galore</span></a><div class="wl-links" data-letter-links></div></div>' +
    '<p class="wl-tick" aria-hidden="true">NVDA , SPY , ETH , MSFT , QQQ , BTC</p></div>';
  document.body.appendChild(sheet); G.mountWordmarks();
  var signupBox = $('.sheet', sheet), signupForm = $('form', sheet), signupStatus = $('[data-signup-status]', sheet), signupReceipt = $('[data-signup-receipt]', sheet),
    signupSubmitLabel = $('[data-signup-submit-label]', sheet), creatorField = $('[data-creator-request-field]', sheet), creatorInput = signupForm.querySelector('[name="creatorRequest"]'),
    envelope = $('[data-waitlist-envelope]', sheet), sheetReturn = null;
  var waitlistNames = [signupForm.querySelector('[name="firstName"]'), signupForm.querySelector('[name="lastName"]')];
  var signupProgress = $('[data-signup-progress]', sheet);
  function updateSignupProgress() {
    var fields = waitlistNames.concat([signupForm.querySelector('[name="email"]')]);
    var complete = fields.filter(function (field) { return field.value.trim() && field.checkValidity(); }).length;
    signupProgress.textContent = complete === 3 ? 'Ready to join. Your details are complete.' : complete ? complete + ' of 3 details added.' : 'Add your name and email to join.';
  }
  signupForm.addEventListener('input', updateSignupProgress);
  var sheetOpen = function () { return sheet.hasAttribute('open'); };
  /* site.js drives the phone sticky button through #s6-signup.showModal and its close event */
  sheet.showModal = function () {
    if (sheetOpen()) return; sheetReturn = document.activeElement;
    sheet.setAttribute('open', ''); void sheet.offsetWidth; sheet.classList.add('open'); document.documentElement.style.overflow = 'hidden';
    W.drop(innerWidth > 760 ? innerWidth - 230 : innerWidth / 2, innerHeight * (innerWidth > 760 ? 0.4 : 0.7), 40, 0.9);
  };
  sheet.close = function () {
    if (!sheetOpen()) return; sheet.removeAttribute('open'); sheet.classList.remove('open'); document.documentElement.style.overflow = '';
    sheet.dispatchEvent(new Event('close'));
  };
  function focusFirst() { later(function () { if (sheetOpen() && envelope.hidden) waitlistNames[0].focus({ preventScroll: true }); }, reduce ? 0 : 380); }
  function setSignupCopy() {
    creatorField.hidden = !signupCreator;
    creatorInput.disabled = !signupCreator || signupPending;
    creatorInput.required = signupCreator;
    creatorInput.setCustomValidity('');
    $('#s6-signup-title', sheet).textContent = 'Join the waitlist';
    signupSubmitLabel.textContent = 'Join the waitlist';
  }
  function openSignup(source) { if (sheetOpen()) return; signupSource = source; sheet.showModal(); trackSignup('waitlist_popup_opened', source); }
  function prep() { signupStatus.textContent = ''; signupReceipt.hidden = true; setSignupCopy(); updateSignupProgress(); }
  function openAssetSignup(ticker, name) { if (signupPending || sheetOpen()) return; signupAsset = { ticker: ticker, name: name }; prep(); openSignup('market_asset'); focusFirst(); }
  function openCreatorSignup(prefill) { if (signupPending || sheetOpen()) return; signupCreator = true; prep(); if (prefill) creatorInput.value = prefill; openSignup('creator_request'); focusFirst(); }
  function openProfileSignup(id, name, trigger, label) { if (signupPending || sheetOpen()) return; signupProfile = { id: id, name: name, trigger: trigger, label: label }; prep(); openSignup('profile_gate'); focusFirst(); }
  function openBeliefSignup(detail) { if (signupPending || sheetOpen()) return; signupGate = detail; prep(); openSignup('belief_gate'); focusFirst(); }
  function openPlainSignup(source) { if (signupPending || sheetOpen()) return; signupStatus.textContent = ''; setSignupCopy(); openSignup(source); focusFirst(); }
  function showWaitlistLetter(firstName, handoff, creator) {
    if (!sheetOpen()) return;
    $('[data-letter-note]', envelope).textContent = LOCAL_DRAFT ? 'Local preview only. No email was sent and nothing was saved.' : creator
      ? 'Thanks, ' + firstName + '. We saved your request for ' + creator + '. Confirm your email to open Galore.'
      : 'Thanks for being here early, ' + firstName + '. Confirm your email to start with $10,000 in paper money.';
    $('[data-letter-action]', envelope).href = LOCAL_DRAFT ? APP : handoff || SIGNUP;
    $('[data-letter-action] span', envelope).textContent = LOCAL_DRAFT ? 'Open dashboard preview' : 'Continue to Galore';
    var links = $('[data-letter-links]', envelope); links.innerHTML = '';
    $$('a', signupReceipt).forEach(function (l) { links.appendChild(l.cloneNode(true)); });
    envelope.hidden = false; signupBox.classList.add('done'); sheet.setAttribute('aria-labelledby', 's6-letter-title');
    dropAt($('.gate-rings', envelope), 30, 1); $('#s6-letter-title', sheet).focus({ preventScroll: true });
  }
  sheet.addEventListener('close', function () {
    var trigger = (signupGate && signupGate.trigger) || (signupProfile && signupProfile.trigger) || sheetReturn;
    signupGate = null; signupProfile = null; signupAsset = null; signupCreator = false;
    envelope.hidden = true; signupBox.classList.remove('done'); sheet.setAttribute('aria-labelledby', 's6-signup-title');
    setSignupCopy();
    if (trigger && trigger.isConnected && trigger.focus) trigger.focus({ preventScroll: true });
    if (signupReceiptEmail) signupReceipt.hidden = false;
    if (location.pathname === '/waitlist') history.replaceState(null, '', '/');
  });
  sheet.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) sheet.close(); });

  /* drag the sheet away (sideways on desktop, down from the grip on phones). Past the open edge it
     rubber-bands; on release a spring takes over at the hand's speed, closing it or settling it back. */
  (function () {
    var box = signupBox, bg = $('.sheet-bg', sheet), phone = matchMedia('(max-width:760px)'), drag = null, stopSpring = null;
    var size = function () { return phone.matches ? box.offsetHeight : box.offsetWidth; };
    function put(d) {
      var p = phone.matches, k = 1 - Math.min(d, 0) / size();
      box.style.transformOrigin = p ? '50% 100%' : '100% 50%';
      box.style.transform = d >= 0 ? (p ? 'translateY(' + d + 'px)' : 'translateX(' + d + 'px)') : (p ? 'scaleY(' + k + ')' : 'scaleX(' + k + ')');
      bg.style.opacity = String(Math.max(0, Math.min(1, 1 - d / size())));
    }
    function clear() { box.style.transform = ''; box.style.transformOrigin = ''; bg.style.opacity = ''; }
    function settle() { void box.offsetWidth; requestAnimationFrame(function () { sheet.classList.remove('is-dragging'); }); }
    box.addEventListener('pointerdown', function (e) {
      if (!sheetOpen() || e.button > 0 || sheet.closest('.wl-page') || document.body.classList.contains('wl-page')) return;
      if (e.target.closest('input,textarea,select,button,a,label,p,h2,.wl-receipt,.wl-done')) return;
      if (phone.matches ? !e.target.closest('.sheet-grip') : false) return;
      if (stopSpring) { stopSpring(); stopSpring = null; }
      drag = { x: e.clientX, y: e.clientY, d: 0, on: false, id: e.pointerId, s: [] };
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.pointerType === 'mouse' && !e.buttons) { end(e); return; }
      var raw = phone.matches ? e.clientY - drag.y : e.clientX - drag.x;
      if (!drag.on) {
        if (Math.abs(raw) < 5) return;
        if (!phone.matches && Math.abs(e.clientY - drag.y) > Math.abs(raw)) { drag = null; return; }
        drag.on = true; sheet.classList.add('is-dragging'); try { box.setPointerCapture(e.pointerId); } catch (x) {}
      }
      drag.d = raw >= 0 ? raw : band(raw, 36);
      drag.s.push([performance.now(), raw]); if (drag.s.length > 6) drag.s.shift();
      put(drag.d);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var g = drag; drag = null; if (!g.on) return;
      var a = g.s[0], b = g.s[g.s.length - 1], v = a && b && b[0] > a[0] ? (b[1] - a[1]) / ((b[0] - a[0]) / 1000) : 0;
      if (performance.now() - (b ? b[0] : 0) > 90) v = 0;
      var full = size() * 1.04, closing = g.d > size() * 0.33 || (v > 600 && g.d > 0);
      if (reduce) { clear(); if (closing) sheet.close(); settle(); return; }
      stopSpring = spring(g.d, closing ? full : 0, v, put, function () {
        stopSpring = null;
        if (closing) sheet.close();
        clear(); settle();
      });
    }
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end); box.addEventListener('lostpointercapture', end);
  })();
  sheet.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') sheet.close();
    if (e.key === 'Tab') {
      var f = $$('button,input,a[href]', sheet).filter(function (n) { return n.offsetParent !== null && !n.disabled; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  waitlistNames.forEach(function (input) { input.addEventListener('input', function () { input.setCustomValidity(''); }); });
  signupForm.addEventListener('input', function (e) { if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); });
  function clearInvalid() { $$('[aria-invalid]', signupForm).forEach(function (i) { i.removeAttribute('aria-invalid'); }); }
  signupForm.addEventListener('reset', clearInvalid); sheet.addEventListener('close', clearInvalid);
  creatorInput.addEventListener('input', function () { creatorInput.setCustomValidity(''); });
  function unlockForm() { signupPending = false; $$('input,button', signupForm).forEach(function (el) { el.disabled = false; }); signupForm.removeAttribute('aria-busy'); }
  /* back from the app can restore this page from the back/forward cache with the form still locked */
  addEventListener('pageshow', function (event) { if (!event.persisted || !signupLeaving) return; signupLeaving = false; unlockForm(); if (sheetOpen()) sheet.close(); setSignupCopy(); });
  signupForm.addEventListener('submit', function (event) {
    event.preventDefault(); if (signupPending) return;
    waitlistNames.forEach(function (input, index) { input.setCustomValidity(input.value.trim() ? '' : 'Enter your ' + (index === 0 ? 'first' : 'last') + ' name.'); });
    if (signupCreator) creatorInput.setCustomValidity(creatorInput.value.trim() ? '' : 'Enter a creator name or handle.');
    if (!signupForm.reportValidity()) { var bad = $$('input', signupForm).filter(function (i) { return !i.disabled && !i.checkValidity(); }); bad.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); }); shake(bad[0] && bad[0].closest('.fld')); return; }
    var gate = signupGate, profile = signupProfile, asset = signupAsset, requestingCreator = signupCreator;
    var payload = { firstName: waitlistNames[0].value.trim(), lastName: waitlistNames[1].value.trim(), email: signupForm.querySelector('[name="email"]').value.trim(), consent: true, source: 'home' };
    if (requestingCreator) payload.creatorRequest = creatorInput.value.trim();
    if (asset) payload.marketAsset = asset.ticker;
    var a = attribution(); if (a.ref) payload.ref = a.ref; if (a.utm) payload.utm = a.utm;
    gt('signup_submit', { has_ref: !!payload.ref, utm_source: payload.utm || null, heard: payload.heard || null, belief_gate: !!gate });
    var button = signupForm.querySelector('button[type="submit"]'), fields = $$('input', signupForm).filter(function (i) { return !i.disabled; });
    fields.forEach(function (i) { i.disabled = true; }); signupPending = true; button.disabled = true; signupSubmitLabel.textContent = 'Joining…'; signupStatus.textContent = ''; signupForm.setAttribute('aria-busy', 'true');
    dropAt(button, 22, 0.8);
    var attempt = ++signupAttempt, controller = new AbortController(), timedOut = false, deadline;
    /* bound both transport and body reading; late results never reach the receipt */
    var operation = LOCAL_DRAFT ? Promise.resolve({ response: { ok: true }, result: { ok: true, creatorRequestSaved: true, marketPreview: asset && asset.ticker } }) : fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal }).then(function (response) {
      return response.json().then(function (result) { return { response: response, result: result }; }, function () { throw new Error('Your signup could not be confirmed. Please try again.'); });
    });
    var timeout = new Promise(function (_, reject) { deadline = setTimeout(function () { timedOut = true; controller.abort(); reject(new Error('Your signup could not be confirmed in time. You can try again.')); }, 12000); });
    Promise.race([operation, timeout]).then(function (o) {
      var response = o.response, result = o.result;
      if (attempt !== signupAttempt || controller.signal.aborted) return;
      if (!response.ok || !result || result.ok !== true) throw new Error(result && typeof result.error === 'string' ? result.error : 'Your signup could not be confirmed. Please try again.');
      if (requestingCreator && result.creatorRequestSaved !== true) throw new Error('Your creator request could not be confirmed. Please try again.');
      if (asset && result.marketPreview !== asset.ticker) throw new Error('Your asset preview could not be opened. Please try again.');
      gt('signup_success', { has_ref: !!payload.ref, utm_source: payload.utm || null, heard: payload.heard || null, belief_gate: !!gate });
      signupForm.reset(); signupStatus.textContent = ''; trackSignup('waitlist_submitted');
      markJoined(); lastFirst = payload.firstName;
      var handoff = typeof result.app === 'string' && result.app.indexOf('https://app.trygalore.com/signup/start?t=') === 0 ? result.app : null;
      lastHandoff = LOCAL_DRAFT ? APP : handoff;
      if (profile && signupProfile === profile) {
        /* a person gate goes straight to the app, which opens that page once the email is confirmed */
        var next = new URL(LOCAL_DRAFT ? APP + '#featured/' + profile.id : handoff || SIGNUP);
        if (!LOCAL_DRAFT) next.searchParams.set('profile', profile.id);
        signupSubmitLabel.textContent = 'Opening Galore…'; signupLeaving = true; location.assign(next.href);
        setTimeout(function () { if (!signupLeaving || document.hidden) return; signupLeaving = false; unlockForm(); if (sheetOpen()) sheet.close(); setSignupCopy(); }, 6000);
        return;
      }
      var receiptEmail = payload.email.toLowerCase(), removeToken = result.deleteToken;
      var hasRemoval = typeof removeToken === 'string' && /^[a-f0-9]{64}$/.test(removeToken);
      if (asset && signupAsset === asset && sheetOpen()) {
        if (hasRemoval) try { sessionStorage.setItem('galore_market_removal', removeToken); } catch (e) {}
        signupSubmitLabel.textContent = 'Opening ' + asset.name + '…'; signupLeaving = true;
        location.assign(LOCAL_DRAFT ? APP + '#home' : new URL('/dashboard.html?asset=' + encodeURIComponent(asset.ticker), location.origin).href);
        setTimeout(function () { if (!signupLeaving || document.hidden) return; signupLeaving = false; unlockForm(); if (sheetOpen()) sheet.close(); setSignupCopy(); }, 6000);
        return;
      }
      /* keep the prior receipt through close and reopen; a duplicate confirmation must not erase its removal link */
      if (signupReceiptEmail !== receiptEmail || hasRemoval) {
      signupReceipt.textContent = LOCAL_DRAFT ? 'Preview signup complete. No email was sent.' : 'Confirmed for ' + payload.email + '. We’ll send Galore launch updates.';
        signupReceiptEmail = receiptEmail;
        var reminder = document.createElement('small');
        if (hasRemoval) {
          var link = document.createElement('a'); link.href = new URL('/remove-waitlist.html#' + removeToken, location.origin).href; link.textContent = 'Remove this signup'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.className = 'waitlist-removal';
          signupReceipt.append(document.createElement('br'), link);
          reminder.textContent = 'Save this private link to remove your signup later.';
        } else reminder.textContent = LOCAL_DRAFT ? 'This local preview does not save your details.' : 'This address is already on the list. To remove it, use the private link from your original signup. Recovery without that link is not available in this preview.';
        signupReceipt.append(document.createElement('br'), reminder);
      }
      signupReceipt.hidden = false;
      if (requestingCreator) {
        var confirmation = document.createElement('span'); confirmation.textContent = LOCAL_DRAFT ? 'Preview request for ' + payload.creatorRequest + '. Nothing was saved.' : 'Creator request saved for ' + payload.creatorRequest + '.';
        signupReceipt.append(document.createElement('br'), confirmation);
        var token = result.creatorRemovalToken;
        if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) {
          var cl = document.createElement('a'); cl.href = new URL('/remove-waitlist.html?request=creator#' + token, location.origin).href; cl.textContent = 'Remove this creator request'; cl.target = '_blank'; cl.rel = 'noopener noreferrer'; cl.className = 'waitlist-removal';
          signupReceipt.append(document.createElement('br'), cl);
        }
      }
      if (gate && signupGate === gate && sheetOpen()) {
        sheet.close();
        gate.complete(hasRemoval ? new URL('/remove-waitlist.html#' + removeToken, location.origin).href : null, payload.firstName, handoff);
        return;
      }
      if (!gate && !asset && signupCreator === requestingCreator) showWaitlistLetter(payload.firstName, handoff, payload.creatorRequest);
    }).catch(function (error) {
      if (attempt === signupAttempt) trackSignup('waitlist_failed');
      gt('signup_error', { reason: timedOut ? 'timeout' : error instanceof TypeError ? 'network' : 'rejected' });
      if (attempt === signupAttempt && !timedOut && !(error instanceof TypeError) && /email/i.test(error && error.message || '')) { var em = signupForm.querySelector('[name="email"]'); em.setAttribute('aria-invalid', 'true'); shake(em.closest('.fld')); }
      if (attempt === signupAttempt) signupStatus.textContent = timedOut ? 'Your signup could not be confirmed in time. You can try again.' : error instanceof TypeError ? 'Your signup could not be confirmed. Check your connection and try again.' : error.message || 'Your signup could not be confirmed. Please try again.';
    }).then(function () {
      clearTimeout(deadline);
      if (attempt === signupAttempt && !signupLeaving) { signupPending = false; fields.forEach(function (i) { i.disabled = false; }); button.disabled = false; setSignupCopy(); signupForm.removeAttribute('aria-busy'); }
    });
  });
  /* a copy of the receipt for the unlocked result, so the removal link is not lost when the sheet closes */
  function receiptClone() { if (!signupReceiptEmail) return null; var d = document.createElement('p'); d.className = 'res-receipt'; d.setAttribute('role', 'status'); [].forEach.call(signupReceipt.childNodes, function (n) { d.appendChild(n.cloneNode(true)); }); return d; }

  /* the 33 assets the waitlist server accepts: the same tickers and names as lib/market-assets.mjs */
  var ASSET_NAMES = { NVDA: 'NVIDIA', BTC: 'Bitcoin', AAPL: 'Apple', SPY: 'S&P 500 ETF', ETH: 'Ethereum', MSFT: 'Microsoft', AMD: 'AMD', GOOGL: 'Alphabet', COIN: 'Coinbase',
    AMZN: 'Amazon', SOL: 'Solana', AVGO: 'Broadcom', COST: 'Costco', XLE: 'Energy ETF', XRP: 'XRP', NFLX: 'Netflix', CRWD: 'CrowdStrike', CVX: 'Chevron',
    HOOD: 'Robinhood', DOGE: 'Dogecoin', XBI: 'Biotech ETF', CRCL: 'Circle', NET: 'Cloudflare', LINK: 'Chainlink', MRVL: 'Marvell', QCOM: 'Qualcomm', EBAY: 'eBay',
    DKNG: 'DraftKings', ICE: 'ICE', LITE: 'Lumentum', MRNA: 'Moderna', PLUG: 'Plug Power', TTWO: 'Take-Two' };
  var XL = { COST: 'cost.png', XLE: 'xle.png', NFLX: 'NFLX.svg', CRWD: 'crwd.svg', CVX: 'CVX.svg', HOOD: 'hood.png', XBI: 'XBI.png', CRCL: 'CRCL.svg', NET: 'NET.svg', MRVL: 'MRVL.svg', QCOM: 'QCOM.svg', EBAY: 'EBAY.svg', DKNG: 'DKNG.png', ICE: 'ice.png', LITE: 'LITE.png', MRNA: 'MRNA.svg', TTWO: 'TTWO.svg' };
  Object.keys(XL).forEach(function (t) { LOGO[t] = TG + XL[t]; }); ['XRP', 'DOGE', 'LINK'].forEach(function (t) { LOGO[t] = LQ + t + '.svg'; });
  /* every "see the data" action goes through the same gate */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-sheet],[data-gate]'); if (!a) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.hasAttribute('data-sheet')) {
      e.preventDefault();
      if (a.dataset.request) openCreatorSignup(); else openPlainSignup('join_button');
      return;
    }
    var kind = a.dataset.gate, name = a.dataset.name || '';
    if (kind === 'asset') {
      if (!ASSET_NAMES[name]) { e.preventDefault(); openPlainSignup('join_button'); return; }
      if (joined()) { a.setAttribute('href', '/dashboard.html?asset=' + encodeURIComponent(name)); return; }
      e.preventDefault(); openAssetSignup(name, ASSET_NAMES[name]); return;
    }
    if (kind === 'creator' || kind === 'politician') {
      if (joined()) { a.setAttribute('href', SIGNUP + '?profile=' + encodeURIComponent(a.dataset.slug)); return; }
      e.preventDefault(); openProfileSignup(a.dataset.slug, name, a);
    }
  });

  /* ------------------------------------------------------------ chart + result */
  function chartSVG(series, locked) {
    var w = 520, h = 190, pl = 4, pr = 58, pt = 14, pb = 8;
    var lo = Math.min.apply(null, series.concat([100])), hi = Math.max.apply(null, series.concat([100])), pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
    var X = function (i) { return pl + (w - pl - pr) * i / (series.length - 1); }, Y = function (v) { return pt + (h - pt - pb) * (1 - (v - lo) / (hi - lo)); };
    var d = series.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
    var last = series[series.length - 1], col = last >= 100 ? 'var(--buy)' : 'var(--foam)', id = 'g' + Math.random().toString(36).slice(2, 7);
    return '<svg class="plot" viewBox="0 0 ' + w + ' ' + h + '" data-lo="' + lo + '" data-hi="' + hi + '" role="img" aria-label="' + (locked ? 'Backtest line, hidden until you join' : 'Weekly value of $100 over the past year') + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<line class="base" x1="' + pl + '" x2="' + (w - pr) + '" y1="' + Y(100) + '" y2="' + Y(100) + '"/>' +
      (locked ? '' : '<text x="' + (w - pr + 8) + '" y="' + (Y(100) + 3) + '">$100</text>') +
      '<path class="ar" d="' + d + 'L' + X(series.length - 1) + ' ' + (h - pb) + 'L' + pl + ' ' + (h - pb) + 'Z" fill="url(#' + id + ')"/>' +
      '<path class="ln" pathLength="1" d="' + d + '" stroke="' + col + '"/>' +
      (locked ? '' : '<g class="end" transform="translate(' + X(series.length - 1) + ' ' + Y(last) + ')"><circle r="9" fill="' + col + '" opacity=".18"><animate attributeName="r" values="5;13;5" dur="3s" repeatCount="indefinite"/></circle><circle r="3.5" fill="' + col + '"/></g>' +
        '<g class="cur"><line y1="' + pt + '" y2="' + (h - pb) + '" stroke="var(--line2)"/><circle r="4" fill="var(--foam)"/><text class="cv" y="10" text-anchor="middle" style="fill:var(--foam)"></text></g>') +
      '</svg>';
  }
  /* before signup the chart is a fixed placeholder: the same made-up line for every belief, ice white, no data */
  var LOCKED_PLOT = '<svg class="plot" viewBox="0 0 520 190" role="img" aria-label="Backtest hidden until you join"><line class="base" x1="4" x2="462" y1="120" y2="120"/>' +
    '<path class="ar" d="M4 120L60 104L116 112L172 88L228 98L284 72L340 84L396 60L462 68L462 182L4 182Z" fill="rgba(232,238,242,.10)"/>' +
    '<path class="ln" pathLength="1" d="M4 120L60 104L116 112L172 88L228 98L284 72L340 84L396 60L462 68" stroke="#E8EEF2"/></svg>';
  function drawIn(svg, ms) {
    if (reduce || !svg) return;
    var ln = $('.ln', svg), ar = $('.ar', svg), end = $('.end', svg);
    ln.style.strokeDasharray = 1; ln.style.strokeDashoffset = 1; ar.style.opacity = 0; if (end) end.style.opacity = 0;
    void ln.getBoundingClientRect();
    ln.style.transition = 'stroke-dashoffset ' + ms + 'ms cubic-bezier(.4,0,.2,1)'; ar.style.transition = 'opacity 900ms ' + (ms * 0.6) + 'ms'; if (end) end.style.transition = 'opacity 400ms ' + ms + 'ms';
    ln.style.strokeDashoffset = 0; ar.style.opacity = 1; if (end) end.style.opacity = 1;
  }
  function scrub(svg, series) {
    if (!svg) return; var cur = $('.cur', svg), w = 520, pl = 4, pr = 58, pt = 14, pb = 8, h = 190, lo = +svg.dataset.lo, hi = +svg.dataset.hi;
    svg.addEventListener('pointermove', function (e) {
      var b = svg.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * w;
      var i = Math.max(0, Math.min(series.length - 1, Math.round((x - pl) / (w - pl - pr) * (series.length - 1))));
      var cx = pl + (w - pl - pr) * i / (series.length - 1), cy = pt + (h - pt - pb) * (1 - (series[i] - lo) / (hi - lo));
      cur.style.opacity = 1; $('line', cur).setAttribute('x1', cx); $('line', cur).setAttribute('x2', cx);
      $('circle', cur).setAttribute('cx', cx); $('circle', cur).setAttribute('cy', cy);
      var t = $('.cv', cur); t.setAttribute('x', Math.max(40, Math.min(w - 60, cx))); t.textContent = money(series[i]) + '  wk ' + i;
    });
    svg.addEventListener('pointerleave', function () { cur.style.opacity = ''; });
  }
  function maxDD(s) { var pk = s[0], dd = 0; s.forEach(function (v) { if (v > pk) pk = v; dd = Math.min(dd, (v - pk) / pk * 100); }); return dd; }
  function countUp(el, to, o) {
    o = o || {}; var pre = o.pre || '', fmt = function (v) { return o.fmt ? o.fmt(v) : pre + Number(v).toLocaleString('en-US', { minimumFractionDigits: o.int ? 0 : 2, maximumFractionDigits: o.int ? 0 : 2 }); };
    if (reduce) { el.textContent = fmt(to); return; }
    var from = o.from == null ? 0 : o.from, t0 = performance.now(), ms = o.ms || 1500;
    (function tick(now) { var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(tick); })(t0);
  }
  var holdLogo = function (t) { return '<span class="mk-l" style="font-size:' + (t.length > 3 ? 9.5 : 11) + 'px">' + logoImg(t) + '</span>'; };

  function resultHTML(res, tab, first) {
    var bt = res.backtest, avg = res.holdings.reduce(function (a, h) { return a + (h.r1y || 0); }, 0) / res.holdings.length;
    var isVid = tab === 'video', belief = res.matched ? res.belief : (isVid ? 'The broad US market' : res.belief.replace(/^Your belief: /, ''));
    return '<div class="res fresh">' +
      '<div class="res-top"><div><span class="k">' + (isVid ? 'The belief in this video' : 'Belief basket') + '</span><h3 class="res-belief">' + esc(belief) + '</h3></div>' +
      (first !== undefined ? '<p class="res-hi">Thanks for being here early,' + (first ? ' ' + esc(first) : '') + '</p>' : '') + '</div>' +
      '<div class="mets"><div><span class="k">Ending value</span><b data-end>' + money(bt.final) + '</b></div><div><span class="k">Average return</span><b class="' + (avg >= 0 ? 'up' : 'dn') + '">' + pct(avg) + '</b></div><div><span class="k">Max drawdown</span><b>' + pct(maxDD(bt.series)) + '</b></div></div>' +
      '<div class="res-grid"><ol class="hold">' + res.holdings.map(function (h) {
        return '<li>' + holdLogo(h.t) + '<div><span class="t">' + esc(h.t) + ' <i>' + esc(NAMES[h.t] || '') + '</i><span class="side ' + h.side + '">' + (h.side === 'short' ? 'Short' : 'Buy') + '</span></span><p>' + esc(h.why) + '</p></div>' +
          '<span class="r ' + (h.r1y >= 0 ? 'up' : 'dn') + '">' + pct(h.r1y) + '<small>1 year</small></span></li>';
      }).join('') + '</ol>' +
      '<div class="chart"><span class="k">Historical backtest</span><p class="chart-sum">$100 a year ago <svg viewBox="0 0 22 10" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg> <b>' + money(bt.final) + '</b> today</p>' +
      chartSVG(bt.series, false) + '<div class="chart-x"><span>Nov 2025</span><span>weekly closes</span><span>Nov 2026</span></div></div></div>' +
      '<div class="res-foot"><p class="res-note">' + esc(res.note) + (isVid && !res.matched ? ' Prototype: link reading is not wired here, so every link shows the broad-market set.' : '') + '</p>' +
      '<div class="res-act"><button class="lk" type="button" data-again>Explore beliefs</button><a class="btn btn-foam" href="' + esc(lastHandoff || SIGNUP) + '"><span>Continue to Galore</span></a></div></div></div>';
  }
  function lockedHTML() {
    var row = function (a, b) { return '<li><span class="av"></span><div><span class="t"><span class="bar" style="width:' + a + 'px"></span></span><p><span class="bar" style="width:' + b + 'px"></span></p></div><span class="r"><span class="bar" style="width:52px"></span></span></li>'; };
    return '<div class="res"><div class="res-top"><div><span class="k">Belief basket</span><h3 class="res-belief"><span class="bar" style="width:min(340px,70vw)"></span></h3></div></div>' +
      '<div class="mets"><div><span class="k">Ending value</span><b><span class="bar" style="width:84px"></span></b></div><div><span class="k">Average return</span><b><span class="bar" style="width:66px"></span></b></div><div><span class="k">Max drawdown</span><b><span class="bar" style="width:60px"></span></b></div></div>' +
      '<div class="res-grid"><ol class="hold">' + row(120, 170) + row(96, 150) + row(132, 186) + row(104, 140) + '</ol>' +
      '<div class="chart"><span class="k">Historical backtest</span><p class="chart-sum">$100 a year ago <b><span class="bar" style="width:92px"></span></b></p><div data-chart style="flex:1;min-height:150px;margin-top:10px"></div><div class="chart-x"><span>Nov 2025</span><span>Nov 2026</span></div></div></div>' +
      '<div class="res-foot"><p class="res-note"><span class="bar" style="width:230px"></span></p></div></div>';
  }

  /* ------------------------------------------------------------ the console */
  var TABS = [
    { id: 'belief', label: 'Belief', ph: 'What do you think will change?', cta: 'Join the waitlist' },
    { id: 'video', label: 'Post', ph: 'Paste a public post link', cta: 'Join the waitlist' },
    { id: 'politician', label: 'Politician', ph: 'Search a member of Congress', cta: 'Join the waitlist' },
    { id: 'creator', label: 'Creator', ph: 'Search a creator or investor', cta: 'Join the waitlist' }
  ];
  var STEPS = ['Reading your belief', 'Finding companies that fit', 'Checking filings and listings', 'Pricing the past year'];
  var uid = 0;
  var isPostLink = function (q) { return G.isLink(q) || /^(https?:\/\/)?([\w-]+\.)*(tiktok\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|instagram\.com|reddit\.com|redd\.it|substack\.com)(\/|$|\?)/i.test(String(q).trim()); };

  function Console(root, mode) {
    var hero = mode === 'hero', n = ++uid, tab = TABS[0], run = 0, timers = [], sugIdx = -1, sugList = [];
    var heroEl = hero ? root.closest('.hero') : null;
    root.innerHTML = '<div class="cx"><div class="cx-top"><span class="cx-label" id="cxl' + n + '">Test your belief</span>' +
      '<div class="cx-tabs" role="tablist" aria-labelledby="cxl' + n + '">' + TABS.map(function (t, i) { return '<button type="button" role="tab" id="cxt' + n + t.id + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-tab="' + t.id + '">' + t.label + '</button>'; }).join('') + '<i class="cx-ink" aria-hidden="true"></i></div></div>' +
      '<form class="cx-bar" novalidate><img class="cx-plat" alt="" hidden><input class="cx-in" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" enterkeyhint="go" aria-labelledby="cxl' + n + '" aria-describedby="cxe' + n + '">' +
      '<button class="cx-go" type="submit" aria-label="See an example"><span>See an example</span></button>' +
      '<ul class="cx-sug" role="listbox" aria-label="People" hidden></ul></form>' +
      '<p class="cx-err" id="cxe' + n + '" role="alert"></p><div class="cx-chips"></div>' +
      '<div class="cx-panel" aria-live="polite" hidden></div></div>';
    var cx = $('.cx', root), tabsEl = $('.cx-tabs', root), ink = $('.cx-ink', root), form = $('.cx-bar', root), input = $('.cx-in', root), go = $('.cx-go', root),
      sug = $('.cx-sug', root), err = $('.cx-err', root), chips = $('.cx-chips', root), panel = $('.cx-panel', root);
    var plat = $('.cx-plat', root), curPh = TABS[0].ph;
    /* a platform icon in "From any post" lands here: Video tab, that platform's placeholder and icon */
    function setPlatform(label, icon) { setTab('video'); curPh = 'Paste a' + (/^[AEIOX]/.test(label) ? 'n ' : ' ') + label + ' link'; input.placeholder = curPh; plat.src = icon; plat.hidden = false; }
    var T = function (fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; };
    var clearT = function () { timers.forEach(clearTimeout); timers = []; };

    function moveInk() { var b = $('[aria-selected=true]', tabsEl); ink.style.width = b.offsetWidth + 'px'; ink.style.transform = 'translateX(' + b.offsetLeft + 'px)'; }
    function isPeople() { return tab.id === 'politician' || tab.id === 'creator'; }
    function updateGo() {
      var label = isPeople() ? 'Search' : tab.id === 'video' ? 'Continue' : input.value.trim() && G.SAMPLES.indexOf(input.value.trim()) < 0 ? 'Continue' : 'See an example';
      go.setAttribute('aria-label', label); $('span', go).textContent = label;
    }
    function people(q) {
      q = (q || '').trim(); var s = q.toLowerCase();
      if (tab.id === 'politician') return G.searchPeople(q).filter(function (p) { return p.kind === 'politician' && RETIRED.indexOf(p.slug) < 0; });
      var list = CREATORS.filter(function (p) { return !s || p.name.toLowerCase().indexOf(s) >= 0; });
      var any = G.searchPeople('any finance creator')[0];
      if (any) list = list.concat([q && !list.length ? { kind: 'creator', name: q, role: G.isLink(q) ? 'From their link' : any.role, slug: '' } : any]);
      return list;
    }
    function setTab(id, focus) {
      var was = tab ? TABS.indexOf(tab) : -1;
      tab = TABS.filter(function (t) { return t.id === id; })[0] || TABS[0];
      /* tabs are a row, so the new suggestions slide in from the side you moved toward instead of crossfading */
      var dir = was < 0 || was === TABS.indexOf(tab) ? '' : TABS.indexOf(tab) > was ? 'go-next' : 'go-prev';
      $$('button', tabsEl).forEach(function (b) { var on = b.dataset.tab === tab.id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      moveInk(); input.value = ''; curPh = tab.ph; input.placeholder = curPh; plat.hidden = true; err.textContent = ''; closeSug(); reset();
      updateGo();
      var html = '';
      if (tab.id === 'belief') html = '<span class="k">Explore beliefs</span>' + G.SAMPLES.map(function (s) { return '<button type="button" class="chip" data-fill="' + esc(s) + '">' + esc(s) + '</button>'; }).join('');
      else if (isPeople()) html = people('').filter(function (p) { return p.slug; }).map(function (p, i) { return '<button type="button" class="chip" data-person="' + i + '">' + esc(p.name) + '</button>'; }).join('');
      chips.innerHTML = html; chips.classList.remove('go-next', 'go-prev'); if (dir && !reduce) { void chips.offsetWidth; chips.classList.add(dir); }
      if (hero) { Hero.draw(); ghostStart(); }
    }
    tabsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) { setTab(b.dataset.tab); dropAt(b, 12, 0.3); } });
    tabsEl.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(tab);
      if (e.key === 'ArrowRight') setTab(TABS[(i + 1) % 4].id, true); else if (e.key === 'ArrowLeft') setTab(TABS[(i + 3) % 4].id, true); else return;
      e.preventDefault();
    });

    /* suggestions for the people tabs */
    function openSug() {
      if (!isPeople()) return; sugList = people(input.value); sugIdx = -1;
      sug.innerHTML = sugList.map(function (p, i) { return '<li role="option" id="cxs' + n + i + '" data-i="' + i + '" aria-selected="false">' + (p.photo ? '<img class="av" src="' + esc(p.photo) + '" alt="" referrerpolicy="no-referrer" data-i="' + esc(initials(p.name)) + '" onerror="var s=document.createElement(\'span\');s.className=\'av\';s.textContent=this.dataset.i;this.replaceWith(s)">' : '<span class="av">' + esc(initials(p.name)) + '</span>') + '<span><b>' + esc(p.name) + '</b><i>' + esc(p.role) + '</i></span></li>'; }).join('');
      sug.hidden = !sugList.length;
    }
    function closeSug() { sug.hidden = true; sugIdx = -1; }
    function hiSug(i) { sugIdx = (i + sugList.length) % sugList.length; $$('li', sug).forEach(function (li, j) { li.setAttribute('aria-selected', j === sugIdx); }); }
    sug.addEventListener('mousedown', function (e) { var li = e.target.closest('li'); if (li) { e.preventDefault(); pick(sugList[+li.dataset.i]); } });
    input.addEventListener('focus', function () { if (isPeople() && panel.hidden) openSug(); });
    input.addEventListener('blur', function () { later(closeSug, 120); });
    input.addEventListener('keydown', function (e) {
      if (!isPeople() || sug.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); hiSug(sugIdx + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); hiSug(sugIdx - 1); } else if (e.key === 'Escape') closeSug();
    });

    /* each keystroke is a droplet */
    var meas = document.createElement('canvas').getContext('2d');
    function caretX() { var cs = getComputedStyle(input); meas.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; var b = input.getBoundingClientRect(); return b.left + Math.min(b.width - 6, meas.measureText(input.value || input.placeholder).width); }
    function keyDrop(str) { var b = input.getBoundingClientRect(); W.drop(caretX() + 3, b.top + b.height * 0.5, 15, 0.26 * (str || 1)); }
    input.addEventListener('input', function () {
      err.textContent = ''; form.classList.remove('cx-invalid'); input.removeAttribute('aria-invalid'); keyDrop();
      if (isPeople()) openSug();
      updateGo();
      if (hero) { ghostStop(); Hero.draw(); if (!input.value) ghostStart(); }
      if (!panel.hidden) reset();
    });
    chips.addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return; dropAt(c, 14, 0.5);
      if (c.dataset.fill) { ghostStop(); input.value = c.dataset.fill; if (hero) { Hero.draw(); } submit(); }
      else if (c.dataset.person) pick(people('').filter(function (p) { return p.slug; })[+c.dataset.person]);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });

    function rejectInput(message) {
      err.textContent = message; form.classList.add('cx-invalid');
      input.setAttribute('aria-invalid', 'true'); shake(form); input.focus();
    }
    function beliefProblem(q) {
      var namedAsset = /^(?:(?:(?:i\s+(?:want|would\s+like|plan)\s+to\s+)?(?:invest\s+in|buy)|i\s+(?:like|love))\s+)?(?:SPY|QQQ|VOO|IVV|VTI|IWM|DIA|GLD|SLV|BITO|IBIT|FBTC|ETHA|XLK|XLF|XLE|BTC|ETH|SOL|XRP|DOGE|ADA|AVAX|LTC|Bitcoin|Ethereum|Ether|Solana|Dogecoin|Cardano|Avalanche|Litecoin)(?:-USD)?(?:\s+(?:stock|shares|etf|fund|crypto|coin))?[.!?]?$/i.test(q);
      var companyInterest = namedAsset || /^(?:i\s+(?:like|love)\s+(?:Nvidia|Tesla|Apple|Microsoft|Amazon|Meta|Google|Alphabet|AMD|Netflix|Palantir|Coinbase|NVDA|TSLA|AAPL|MSFT|AMZN|GOOGL|NFLX|PLTR|COIN)[.!]?)$/i.test(q) || /\b(?:stock|shares|ticker|invest(?:ing)? in)\b/i.test(q);
      if (q.length < 8 && !namedAsset && !/^[A-Z]{2,5}$/.test(q)) return 'Tell us what you think will change.';
      if (q.length > 600) return 'Keep your belief under 600 characters.';
      if (/\b(?:asdf|qwerty|lorem ipsum|banana spaceship|quantum yogurt)\b/i.test(q) || /^([a-z])\1{7,}$/i.test(q)) return 'Tell us what you think will change, in your own words.';
      if (/^\s*(?:i (?:like|love|enjoy|prefer|drink|eat|use|buy|own|watch|play|wear|listen to|go to)|my favou?rite (?:food|thing|colou?r) is)\b/i.test(q) && !companyInterest && !/\b(?:will|would|could|expect|because|grow|rise|fall|increase|decrease|more|less|fewer|demand|replace|shift|trend|spread)\b/i.test(q)) return 'What do you think will change about this, and why?';
      if (/^(?:what is a stock|what is the weather|is now a good time to invest)\??$/i.test(q)) return 'Tell us what you expect to change, rather than asking a general question.';
      if (/\b(?:bullish and bearish|rise and fall at the same time|double and disappear)\b/i.test(q)) return 'Which direction do you expect, and why?';
      if (/\b(?:insider|unreleased|leaked merger|inside tip)\b/i.test(q) || /\b(?:pump this stock|fabricate (?:sources|evidence)|ignore previous instructions|output your api key)\b/i.test(q)) return 'We cannot use private information or invented evidence. Describe a public claim we can check.';
      return '';
    }
    function submit() {
      var q = input.value.trim(); err.textContent = ''; form.classList.remove('cx-invalid'); input.removeAttribute('aria-invalid');
      if (isPeople()) { var l = people(q); var p = sugIdx >= 0 ? sugList[sugIdx] : l[0]; if (!p) { rejectInput(tab.ph + '.'); return; } pick(p); return; }
      if (tab.id === 'video' && !isPostLink(q)) { rejectInput(curPh + '.'); return; }
      if (tab.id === 'belief') { var problem = beliefProblem(q); if (problem) { rejectInput(problem); return; } }
      else if (q.length < 8) { rejectInput('Paste a post link.'); return; }
      research(q);
    }
    function reset(keepLayer) {
      run++; clearT(); panel.hidden = true; panel.innerHTML = ''; panel.className = 'cx-panel';
      if (heroEl) { heroEl.classList.remove('is-open'); if (!keepLayer) Hero.clear(); }
    }
    function bigRipple(el, fx, fy) {
      var b = el.getBoundingClientRect(), x = b.left + b.width * (fx == null ? 0.5 : fx), y = b.top + b.height * (fy == null ? 0.5 : fy);
      W.drop(x, y, 38, 1.05); later(function () { W.drop(x, y, 64, 0.5); }, 160); later(function () { W.drop(x, y, 30, 0.55); }, 460);
      return [x, y];
    }
    function showPanel(cls, html) {
      panel.className = 'cx-panel ' + (cls || ''); panel.innerHTML = html; panel.hidden = false;
      void panel.offsetWidth; if (heroEl) heroEl.classList.add('is-open');
      later(function () { var b = panel.getBoundingClientRect(); var fb = form.getBoundingClientRect(); if (b.top > innerHeight * 0.6 || (!hero && b.bottom > innerHeight)) window.scrollBy({ top: Math.min(fb.top - 150, b.bottom - innerHeight + 30), behavior: reduce ? 'auto' : 'smooth' }); }, 60);
    }

    function research(q) {
      reset(true); var my = run, tabId = tab.id; ghostStop(); input.blur();
      if (LOCAL_DRAFT) {
        showPanel('preview-only', '<div class="preview-result"><span class="preview-result-label">Example research view</span><h3>' + esc(q) + '</h3><p>Galore would organize the answer around the investments this idea touches, the evidence behind them, and what could change the case.</p><div><b>Connections</b><span>Which investments relate to the idea, and why?</span></div><div><b>Evidence</b><span>What source supports each connection?</span></div><div><b>Checks</b><span>What might weaken it, and how did it compare in the past?</span></div><a class="btn btn-go" href="/waitlist" data-sheet><span>Join the waitlist</span></a><small>Illustrative layout. No research, returns, or trades are generated here.</small></div>');
        return;
      }
      if (tabId === 'video' || (tabId === 'belief' && G.SAMPLES.indexOf(q) < 0)) {
        var dest = joined() ? APP + '#home' : '/waitlist';
        var label = tabId === 'video' ? 'Analyze this post in Galore' : 'Research this belief in Galore';
        showPanel('', '<div class="gate"><div class="gate-card"><span class="k">' + (tabId === 'video' ? 'Public post' : 'Your belief') + '</span><h3>' + label + '</h3><p>Join the waitlist to get the sources, possible investments, and a paper plan. No research has run on this page.</p><a class="btn btn-go" href="' + dest + '"' + (joined() ? '' : ' data-sheet') + '><span>' + (joined() ? 'Open Galore' : 'Join the waitlist') + '</span></a></div></div>');
        return;
      }
      showPanel('is-locked', '<div class="pv">' + lockedHTML() + '</div>');
      G.analyze(q).then(function (res) {
        if (my !== run) return;
        if (joined()) reveal(res, tabId, false); else gate(res, tabId);
      }).catch(function () {
        if (my !== run) return;
        showPanel('', '<div class="gate"><div class="gate-card"><h3>Could not load this example.</h3><p>Try another belief.</p></div></div>');
      });
    }
    function gateHTML(k, cta) {
      return '<div class="gate"><div class="gate-card"><div class="gate-rings" aria-hidden="true">' + RING + '</div><span class="k">' + k + '</span>' +
        '<h3>Join the waitlist to see the example.</h3><p>The basket, past performance, and sources unlock after signup.</p><a class="btn btn-go" href="/waitlist" data-join><span>' + cta + '</span></a></div></div>';
    }
    function gate(res, tabId) {
      var pv = $('.pv', panel), cta = TABS.filter(function (t) { return t.id === tabId; })[0].cta;
      pv.insertAdjacentHTML('beforeend', gateHTML('Example backtest', cta));
      var btn = $('[data-join]', pv); dropAt($('.gate-rings', pv), 22, 0.7);
      btn.addEventListener('click', function (e) { e.preventDefault(); openBeliefSignup({ label: cta, trigger: btn, complete: function (removal, first) { reveal(res, tabId, true, first); } }); });
      if (!reduce) later(function () { if (document.activeElement === document.body) btn.focus({ preventScroll: true }); }, 500);
    }
    function reveal(res, tabId, animated, first) {
      var pv = $('.pv', panel), html = resultHTML(res, tabId, animated ? (first || '') : undefined);
      var finish = function () {
        pv.style.minHeight = ''; pv.innerHTML = html; panel.className = 'cx-panel';
        var r = $('.res', pv); if (animated) r.classList.remove('fresh');
        wire(r, res, !animated);
        var rc = animated && receiptClone(); if (rc) r.appendChild(rc);
      };
      if (animated && !reduce) {
        var g = $('.gate-rings', pv) || pv, gb = g.getBoundingClientRect(), pb = pv.getBoundingClientRect();
        pv.style.setProperty('--cx', (gb.left + gb.width / 2 - pb.left) + 'px'); pv.style.setProperty('--cy', (gb.top + gb.height / 2 - pb.top) + 'px');
        var ov = document.createElement('div'); ov.className = 'pv-real'; ov.innerHTML = html; pv.appendChild(ov);
        var ring = document.createElement('i'); ring.className = 'pv-ring'; pv.appendChild(ring);
        pv.style.minHeight = ov.firstChild.offsetHeight + 'px';
        panel.classList.add('reveal'); panel.classList.remove('is-locked');
        later(function () { bigRipple(g); }, 60);
        wire($('.res', ov), res, true);
        T(finish, 1750);
      } else finish();
      if (hero) Hero.unlock(res, panel);
    }
    function wire(r, res, play) {
      var svg = $('.plot', r); scrub(svg, res.backtest.series);
      if (play) { drawIn(svg, 1500); countUp($('[data-end]', r), res.backtest.final, { pre: '$', from: 100, ms: 1700 }); }
      $('[data-again]', r).addEventListener('click', function () { reset(); input.value = ''; if (hero) ghostStart(); input.focus(); root.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); });
    }

    function pick(p) {
      reset(); closeSug(); ghostStop(); input.value = p.name; input.blur(); var my = run, tabId = tab.id;
      var dest = LOCAL_DRAFT ? APP + '#featured/' + encodeURIComponent(p.slug || '') : p.slug ? SIGNUP + '?profile=' + encodeURIComponent(p.slug) : SIGNUP, wl = '/waitlist' + (p.slug ? '?profile=' + encodeURIComponent(p.slug) : '?request=creator');
      var body = function () {
        var j = joined();
        return '<div class="person"><span class="av">' + esc(initials(p.name)) + '</span><div><h3>' + esc(p.name) + '</h3><p class="role">' + esc(p.role) + '</p></div>' +
          '<div class="person-body"><p>See public calls, disclosed holdings, and model performance after joining.</p>' +
          '<div class="person-act">' + (j ? '<span class="open">Opening their page in your dashboard</span><a class="btn btn-foam" href="' + dest + '"><span>Continue to Galore</span></a>'
            : '<a class="btn btn-go" href="' + wl + '" data-join><span>' + tab.cta + '</span></a>') + '</div></div></div>';
      };
      showPanel('', body()); bigRipple(form);
      if (hero) Hero.carry(form, panel, 0);
      var bind = function () {
        var b = $('[data-join]', panel); if (!b) return;
        b.addEventListener('click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          if (p.slug) openProfileSignup(p.slug, p.name, b, tab.cta); else openCreatorSignup(p.name === 'Any finance creator' ? '' : p.name);
        });
      };
      bind();
    }

    /* the placeholder types itself, one droplet per letter, until you take over */
    var ghostT = 0, ghostI = 0;
    function ghostStop() { clearTimeout(ghostT); ghostT = 0; if (input.placeholder !== curPh) input.placeholder = curPh; }
    function ghostStart() {
      ghostStop(); if (!hero || reduce || tab.id !== 'belief') { if (hero && tab.id === 'belief' && !input.value) { Hero.draw(); } return; }
      var s = G.SAMPLES[ghostI % G.SAMPLES.length], i = 0;
      (function type() {
        if (input.value || !panel.hidden) return;
        if (document.hidden || scrollY > innerHeight) { ghostT = setTimeout(type, 900); return; }
        i++; input.placeholder = s.slice(0, i); Hero.draw(); keyDrop(0.8); 
        if (i < s.length) ghostT = setTimeout(type, 62 + Math.random() * 70);
        else ghostT = setTimeout(function erase() {
          if (input.value || !panel.hidden) return;
          i -= 2; if (i <= 0) { ghostI++; input.placeholder = ''; Hero.draw(); ghostT = setTimeout(ghostStart, 500); return; }
          input.placeholder = s.slice(0, i); Hero.draw(); ghostT = setTimeout(erase, 22);
        }, 2600);
      })();
    }

    setTab('belief'); later(moveInk, 300); if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
    addEventListener('resize', moveInk);
    return { setTab: setTab, setPlatform: setPlatform, focus: function () { ghostStop(); input.focus({ preventScroll: true }); }, input: input, submit: submit, pick: pick, people: people, root: root };
  }

  /* ---------------------------------------- hero: what lies under the surface */
  var Hero = (function () {
    var el = $('.hero'), H = { tok: null, tp: 0, line: null, lp: 0, res: null, locked: true };
    if (!el) { H.draw = H.clear = H.carry = H.unlock = function () {}; return H; }
    var SER = "'Geist', system-ui, sans-serif", MON = "'Geist Mono', monospace";
    H.draw = function () {
      var hh = Math.max(innerHeight, el.offsetHeight + el.offsetTop);
      W.layer(hh, function (c, w, h) {
        if (H.line && H.lp > 0) {
          var s = H.line, lo = Math.min.apply(null, s), hi = Math.max.apply(null, s), n = Math.max(2, Math.ceil(s.length * H.lp));
          var top = H.ly, amp = H.lh, up = s[s.length - 1] >= 100, col = up ? '43,240,138' : '232,238,242';
          var X = function (i) { return w * i / (s.length - 1); }, Y = function (v) { return top + amp * (1 - (v - lo) / (hi - lo || 1)); };
          c.beginPath(); for (var i = 0; i < n; i++) c[i ? 'lineTo' : 'moveTo'](X(i), Y(s[i]));
          c.lineWidth = 2.4; c.strokeStyle = 'rgba(' + col + ',.6)'; c.lineJoin = 'round'; c.stroke();
          c.lineTo(X(n - 1), top + amp + 150); c.lineTo(0, top + amp + 150); c.closePath();
          var gg = c.createLinearGradient(0, top, 0, top + amp + 150); gg.addColorStop(0, 'rgba(' + col + ',.13)'); gg.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = gg; c.fill();
          c.setLineDash([3, 9]); c.beginPath(); c.moveTo(0, Y(100)); c.lineTo(w, Y(100)); c.strokeStyle = 'rgba(232,238,242,.22)'; c.lineWidth = 1; c.stroke(); c.setLineDash([]);
        }
        if (H.tok) {
          var e = 1 - Math.pow(1 - H.tp, 3);
          H.tok.forEach(function (t, i) {
            var x = t.x0 + (t.x1 - t.x0) * e, y2 = t.y0 + (t.y1 - t.y0) * e, a = t.rest ? Math.min(1, H.tp * 2.2) : Math.sin(Math.PI * Math.min(1, H.tp * 1.05));
            c.globalAlpha = Math.max(0, a); c.textAlign = 'center'; c.textBaseline = 'middle';
            if (H.locked || !t.h) {
              var r = 26 + 10 * e; for (var k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x, y2, r * (1 + k * 0.62), r * (1 + k * 0.62) * 0.92, 0, 0, 6.2832); c.strokeStyle = 'rgba(232,238,242,' + (0.5 - k * 0.15) + ')'; c.lineWidth = 3.4 - k * 0.8; c.stroke(); }
            } else {
              var up2 = t.h.r1y >= 0;
              c.font = '72px ' + SER; c.fillStyle = 'rgba(232,238,242,.78)'; c.fillText(t.h.t, x, y2 - 8);
              c.font = '500 15px ' + MON; c.fillStyle = up2 ? 'rgba(43,240,138,.95)' : 'rgba(232,238,242,.8)';
              c.fillText((t.h.side === 'short' ? 'SHORT  ' : 'BUY  ') + pct(t.h.r1y), x, y2 + 40);
            }
          });
          c.globalAlpha = 1;
        }
      });
      W.fade(H.tok || H.line ? 1 : 0, 500);
    };
    var tw = {};
    function tween(prop, ms, done) {
      cancelAnimationFrame(tw[prop]); if (reduce) { H[prop] = 1; H.draw(); if (done) done(); return; }
      var t0 = performance.now(); H[prop] = 0;
      (function f(now) { H[prop] = Math.min(1, (now - t0) / ms); H.draw(); if (H[prop] < 1) tw[prop] = requestAnimationFrame(f); else if (done) done(); })(t0);
    }
    H.clear = function () { cancelAnimationFrame(tw.tp); cancelAnimationFrame(tw.lp); H.tok = null; H.line = null; H.res = null; H.locked = true; H.lp = 0; H.draw(); };
    /* submit: the big ripple carries the holdings outward */
    H.carry = function (from, panel, count) {
      var b = from.getBoundingClientRect(), x0 = b.left + b.width / 2, y0 = b.top + b.height / 2 + scrollY, w = innerWidth;
      H.line = null; H.locked = true; H.tok = null;
      if (!count) { H.draw(); return; }
      var pl = b.left, pr = b.right, roomy = pl > 210, top = b.bottom + scrollY + 170;
      H.tok = [0, 1, 2, 3].map(function (i) {
        var left = i % 2 === 0, row = i < 2 ? 0 : 1;
        return roomy ? { x0: x0, y0: y0, x1: left ? pl / 2 : (w + pr) / 2, y1: top + row * 330 + (left ? 0 : 60), rest: true }
          : { x0: x0, y0: y0, x1: left ? -80 : w + 80, y1: y0 + (row ? 260 : 90), rest: false };
      });
      tween('tp', 1900, function () { if (!H.tok || H.tok[0].rest) return; H.tok = null; H.draw(); });
    };
    H.unlock = function (res, panel) {
      var pb = panel.getBoundingClientRect(); H.res = res; H.panel = panel; H.locked = false;
      if (H.tok && H.tok[0].rest) H.tok.forEach(function (t, i) { t.h = res.holdings[i]; }); else H.tok = null;
      H.line = res.backtest.series; H.ly = pb.top + scrollY + pb.height * 0.5; H.lh = Math.min(230, pb.height * 0.34);
      tween('lp', 1700);
    };
    addEventListener('water:resize', function () { H.tok = null; H.line = null; H.draw(); });
    return H;
  })();

  /* ------------------------------------------------------------------ boot */
  var consoles = $$('[data-console]').map(function (r) { return Console(r, r.dataset.console); });
  var heroCx = consoles.filter(function (c) { return c.root.dataset.console === 'hero'; })[0];

  $$('[data-focus-try]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!heroCx) return; e.preventDefault();
      heroCx.root.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      later(function () { heroCx.focus(); dropAt(heroCx.input, 26, 0.9); }, reduce || scrollY < 200 ? 0 : 650);
    });
  });

  /* "From any post": a platform button takes you to the hero box, on the Video tab, ready for that platform's link */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.soc-b'); if (!b || !heroCx) return; e.preventDefault();
    heroCx.setPlatform(b.dataset.label, b.querySelector('img').getAttribute('src'));
    heroCx.root.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    later(function () { heroCx.focus(); dropAt(heroCx.input, 26, 0.9); }, reduce ? 0 : 750);
  });

  /* header */
  var hd = $('[data-header]'), menu = $('.hd-menu'), mnav = $('#mnav');
  if (menu && mnav) {
    var toggle = function (on) { mnav.hidden = !on; menu.setAttribute('aria-expanded', on); };
    menu.addEventListener('click', function () { toggle(mnav.hidden); });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) { toggle(false); menu.focus(); } });
  }

  /* scroll: header state, depth of the water, active nav link */
  var depthEls = $$('[data-depth]'), navLinks = $$('.hd-nav a[href^="#"]'), tick = false;
  function onScroll() {
    tick = false; var y = scrollY, mid = innerHeight * 0.5;
    if (hd) hd.classList.toggle('is-stuck', y > 12);
    if (depthEls.length) {
      var pts = depthEls.map(function (e) { var b = e.getBoundingClientRect(); return [b.top + b.height / 2, +e.dataset.depth]; }), d = pts[0][1];
      for (var i = 0; i < pts.length; i++) {
        if (mid >= pts[i][0]) d = pts[i][1];
        if (i < pts.length - 1 && mid >= pts[i][0] && mid < pts[i + 1][0]) { var k = (mid - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); d = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k; }
      }
      W.depth(d);
    }
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (!s) return; var b = s.getBoundingClientRect(); a.classList.toggle('is-on', b.top < mid && b.bottom > mid); });
  }
  /* the water is strong in the open (hero, closing, footer) and near-still behind the dense sections */
  var calmEls = $$('[data-calm]');
  function zones() {
    if (calmEls.length) { var a = calmEls[0].getBoundingClientRect(), b = calmEls[calmEls.length - 1].getBoundingClientRect(); W.calm(a.top, b.bottom); }
    /* aurora light bleeds into the water under signup buttons and under a positive result */
    var L = [], mid = innerHeight / 2;
    $$('.btn-go').forEach(function (el) { if (el.closest('.sheet,.mnav,.hd')) return; var r = el.getBoundingClientRect(); if (!r.width || r.bottom < -200 || r.top > innerHeight + 200) return; L.push([r.left + r.width / 2, r.top + r.height * 0.6, 150, 0.5, Math.abs(r.top - mid)]); });
    L.sort(function (x, y) { return x[4] - y[4]; }); L = L.slice(0, 2);
    if (Hero.res && Hero.res.backtest.pct > 0 && Hero.panel && Hero.panel.isConnected) { var p = Hero.panel.getBoundingClientRect(); if (p.bottom > 0 && p.top < innerHeight) { L.push([p.left - 90, p.top + p.height * 0.5, 330, 0.5]); L.push([p.right + 90, p.top + p.height * 0.5, 330, 0.5]); } }
    W.lights(L);
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { onScroll(); zones(); }); } }, { passive: true });
  onScroll(); zones(); setInterval(zones, 500); addEventListener('resize', zones);

  /* Sections remain visible throughout scrolling. */
  if (false) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target); if (e.target.matches('.sec-h,.close-h')) dropAt(e.target, 26, 0.5); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv').forEach(function (el, i) { if (el.classList.contains('fc')) el.style.setProperty('--d', ($$('.fc').indexOf(el) % 3) * 0.09 + 's'); io.observe(el); });
  } else $$('.rv').forEach(function (el) { el.classList.add('in'); });

  /* markets tape: two offset rows of plain chips (logo, name, ticker) drifting in opposite directions at different speeds */
  var tape = $('[data-tape]');
  if (tape) {
    var TK = ['NVDA','AAPL','MSFT','AMD','ANT','SPY','COIN','BTC','ETH'], half = Math.ceil(TK.length / 2);
    var item = function (t, hid) {
      return '<a class="mk" href="' + (t === 'ANT' ? '/dashboard-preview.html#research' : '/waitlist?asset=' + t) + '" ' +
        (t === 'ANT' ? '' : 'data-gate="asset" data-name="' + t + '"') +
        (hid ? ' tabindex="-1" aria-hidden="true"' : '') + '>' +
        '<span class="mk-l">' + logoImg(t) + '</span><span class="mk-n"><b>' + esc(t === 'ANT' ? 'Anthropic' : ASSET_NAMES[t]) + '</b><i>' + (t === 'ANT' ? 'Private company' : t) + '</i></span></a>';
    };
    var row = function (list, rev) {
      return '<div class="tape-row' + (rev ? ' rev' : '') + '"><div class="tape-track"><div class="tape-group">' +
        list.map(function (t) { return item(t, false); }).join('') + '</div></div></div>';
    };
    tape.innerHTML = row(TK.slice(0, half), false) + row(TK.slice(half), true);
    var fillTape = function () {
      tape.querySelectorAll('.tape-row').forEach(function (rowEl) {
        var track = rowEl.querySelector('.tape-track');
        var group = track.firstElementChild;
        var list = rowEl.classList.contains('rev') ? TK.slice(half) : TK.slice(0, half);
        group.innerHTML = list.map(function (t) { return item(t, false); }).join('');
        track.querySelectorAll('.tape-group[aria-hidden]').forEach(function (copy) { copy.remove(); });
        var round = 0;
        while (group.getBoundingClientRect().width < tape.clientWidth + 120 && round++ < 32) {
          group.insertAdjacentHTML('beforeend', list.map(function (t) { return item(t, false); }).join(''));
        }
        var copy = group.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
        track.appendChild(copy);
      });
    };
    fillTape();
    if ('ResizeObserver' in window) new ResizeObserver(fillTape).observe(tape);
    else window.addEventListener('resize', fillTape);
  }

  /* feature cards: small live components */
  function loop(card, ms, fn) {
    var t = 0, timers = [];
    var T = function (f, d) { timers.push(setTimeout(f, d)); };
    var go = function () { timers.forEach(clearTimeout); timers = []; fn(T); t = setTimeout(go, ms); };
    if (reduce) { card.classList.add('play'); return; }
    go();
  }
  function cardRipple(card, x, y, big) {
    return;
  }
  var replay = function (card) { card.classList.remove('play'); void card.offsetWidth; card.classList.add('play'); };
  $$('.fc').forEach(function (card) {
    card.addEventListener('pointermove', function (e) { var b = card.getBoundingClientRect(); card.style.setProperty('--mx', (e.clientX - b.left) + 'px'); card.style.setProperty('--my', (e.clientY - b.top) + 'px'); });
    card.addEventListener('pointerdown', function (e) { cardRipple(card, e.clientX, e.clientY, true); });
    card.addEventListener('pointerenter', function (e) { cardRipple(card, e.clientX, e.clientY); });
    var k = card.dataset.fc;
    if (k === 'records') loop(card, 7600, function (T) { replay(card); $$('.call', card).forEach(function (c, i) { T(function () { dropAt(c, 11, 0.4); }, 520 + i * 800); }); });
    if (k === 'watch') {
      var sp = $('[data-type]', card), full = sp.textContent;
      loop(card, 11500, function (T) {
        card.className = card.className.replace(/ ?\bt\d\b/g, '') + ' seq'; sp.innerHTML = '<i class="caret"></i>';
        full.split('').forEach(function (ch, i) { T(function () { sp.innerHTML = esc(full.slice(0, i + 1)) + '<i class="caret"></i>'; }, 500 + i * 46); });
        var e = 500 + full.length * 46;
        T(function () { sp.textContent = full; card.classList.add('t1'); dropAt($('.ans', card), 14, 0.35, 0.1, 0.3); }, e + 500);
        T(function () { card.classList.add('t2'); }, e + 1300);
        T(function () { card.classList.add('t3'); dropAt($('.quote', card), 16, 0.5, 0.85, 0.5); }, e + 2100);
      });
    }
    if (k === 'follow') {
      $$('[data-lb] li', card).forEach(function (li, i) { li.style.setProperty('--pos', i); });
    }
    if (k === 'post') {
      var ic = $$('.soc img', card), ii = 0;
      loop(card, 9000, function (T) {
        card.className = card.className.replace(/ ?\bt\d\b/g, '') + ' seq'; replay(card); dropAt($('.thumb', card), 16, 0.5);
        T(function () { card.classList.add('t1'); }, 1000); T(function () { card.classList.add('t2'); }, 2100); T(function () { card.classList.add('t3'); dropAt($('.ideas', card), 14, 0.4, 0.2, 0.5); }, 3200);
        for (var j = 0; j < 6; j++) T(function () { ic.forEach(function (x) { x.classList.remove('on'); }); ic[ii++ % ic.length].classList.add('on'); }, j * 1450);
      });
    }
    if (k === 'port') {
      $$('.alloc li', card).forEach(function (li, i) {
        li.addEventListener('pointerenter', function () { card.dataset.hi = i + 1; });
        li.addEventListener('pointerleave', function () { card.dataset.hi = ''; });
      });
    }
  });

  /* dashboard scan: the app tabs are a legend; a highlight glides to the region each one explains */
  (function () {
    var sec = $('#dashboard'), leg = $('[data-scan]'); if (!sec || !leg) return;
    var RL = { Home: [1, 1.5, 98, 97], Explore: [9.5, 25.5, 56, 69], Portfolio: [9.5, 3, 56, 20.5], Watchlist: [66.5, 3, 24, 35] };
    var RP = { Home: [2, 1, 96, 98], Explore: [2, 42, 96, 55], Portfolio: [2, 15.5, 96, 26], Watchlist: [2, 9.3, 96, 6.4] };
    var tabs = $$('button', leg), mirror = $$('.app-tabs span', sec), hls = $$('.hl', sec), cur = 0, auto = 0, seen = false;
    function show(i) {
      cur = i; var name = tabs[i].textContent.trim();
      tabs.forEach(function (b, n) { b.setAttribute('aria-pressed', n === i); }); mirror.forEach(function (m, n) { m.classList.toggle('on', n === i); });
      var ink = $('.cx-ink', leg); ink.style.width = tabs[i].offsetWidth + 'px'; ink.style.transform = 'translateX(' + tabs[i].offsetLeft + 'px)';
      hls.forEach(function (hl) { place(hl, name); $('b', hl).textContent = name; hl.classList.remove('land'); void hl.offsetWidth; hl.classList.add('land'); });
    }
    /* the glide is a transform (compositor only); left/top would repaint every frame. Offsets are in px of the frame, so re-place on resize */
    function place(hl, name) { var r = (hl.dataset.hl === 'phone' ? RP : RL)[name]; if (!r) return; var f = hl.offsetParent || hl.parentNode; hl.style.transform = 'translate(' + (r[0] * f.clientWidth / 100).toFixed(2) + 'px,' + (r[1] * f.clientHeight / 100).toFixed(2) + 'px)'; hl.style.width = r[2] + '%'; hl.style.height = r[3] + '%'; }
    addEventListener('resize', function () { var name = tabs[cur].textContent.trim(); hls.forEach(function (hl) { place(hl, name); }); }, { passive: true });
    /* rotates by itself whenever the section is on screen; a click jumps there and the rotation carries on from that tab */
    function arm() { clearTimeout(auto); auto = 0; if (reduce || !seen || document.hidden || qs.get('scan')) return; auto = setTimeout(function () { show((cur + 1) % tabs.length); arm(); }, 2600); }
    tabs.forEach(function (b, i) { b.addEventListener('click', function () { show(i); arm(); }); });
    show(qs.get('scan') ? Math.max(0, tabs.map(function (b) { return b.textContent.trim().toLowerCase(); }).indexOf(qs.get('scan'))) : 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { show(cur); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[es.length - 1].isIntersecting; if (seen) sec.classList.add('scan'); arm(); }, { threshold: [0, 0.05] }).observe(sec);
    else { seen = true; sec.classList.add('scan'); arm(); }
    document.addEventListener('visibilitychange', arm);
    addEventListener('pageshow', arm);
  })();

  /* devices: tilt toward the pointer, lap the water beneath */
  var dev = $('[data-devices]');
  if (dev && !reduce) {
    dev.addEventListener('pointermove', function (e) { var b = dev.getBoundingClientRect(); dev.style.setProperty('--rx', ((e.clientX - b.left) / b.width - 0.5) * 7); dev.style.setProperty('--ry', -((e.clientY - b.top) / b.height - 0.5) * 5); });
    dev.addEventListener('pointerleave', function () { dev.style.setProperty('--rx', 0); dev.style.setProperty('--ry', 0); });
    /* Keep the dashboard still. */
  }

  /* faq: one open at a time, each opening a drop */
  var faqs = $$('.faq details');
  faqs.forEach(function (d) { d.addEventListener('toggle', function () { if (!d.open) return; faqs.forEach(function (o) { if (o !== d) o.open = false; }); dropAt($('summary', d), 18, 0.55, 0.97, 0.5); }); });

  /* buttons breathe a ring into the water; the watcher pings */
  /* Controls do not disturb the water. */
  var watch = $('.hero-watch i'); if (watch) watch.innerHTML = RING;
  if (watch && !reduce) setInterval(function () { if (!document.hidden && scrollY < innerHeight * 0.6 && !$('.hero.is-open') && !document.activeElement.matches('input,textarea,select')) dropAt(watch, 18, 0.15); }, 13000);
  $$('.hd-logo,.ft-logo').forEach(function (l) { l.addEventListener('pointerenter', function () { dropAt($('.gk-o', l), 16, 0.5); }); });

  /* stocks surface where the open water is disturbed (hero and closing only), then sink back */
  (function () {
    /* Keep floating market chips away from the copy. */
    return;
    var zones = $('.hero,#closing'); if (!zones.length) return;
    var keys = Object.keys(ASSET_NAMES).filter(function (t) { return P[t] && isFinite(P[t].r1y); }), queue = [], live = [], lastT = 0, MAX = innerWidth < 760 ? 2 : 4;
    function next() { if (!queue.length) queue = keys.slice().sort(function () { return Math.random() - 0.5; }); var t = queue.pop(); return live.some(function (c) { return c.t === t; }) ? queue.pop() || t : t; }
    function hit(a, b, m) { return !(a.right + m < b.left || a.left - m > b.right || a.bottom + m < b.top || a.top - m > b.bottom); }
    function free(zone, x, y, w, h) {
      var zb = zone.getBoundingClientRect(), r = { left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
      if (r.left < Math.max(14, zb.left + 10) || r.right > Math.min(innerWidth - 14, zb.right - 10) || r.top < zb.top + 10 || r.bottom > zb.bottom - 10 || r.top < 84 || r.bottom > innerHeight - 8) return false;
      var avoid = $$('.hero-h,.hero-sub,.hero-btns,.cx,.hero-watch,.close-h,.close-sub,.closing .btn,.surf', zone);
      for (var i = 0; i < avoid.length; i++) { var b = avoid[i].getBoundingClientRect(); if (b.width && hit(r, b, 22)) return false; }
      return true;
    }
    function chip(zone, x, y, still) {
      var t = next(); if (!t || !P[t]) return;
      var v = P[t].r1y, up = v >= 0, zb = zone.getBoundingClientRect(), a = document.createElement('a');
      a.className = 'surf' + (still ? ' still' : ''); a.href = '/waitlist?asset=' + t; a.dataset.gate = 'asset'; a.dataset.name = t; a.tabIndex = -1;
      a.setAttribute('aria-label', ASSET_NAMES[t] + ', 1-year change ' + pct(v));
      a.title = ASSET_NAMES[t] + ': 1-year price change';
      a.style.left = (x - zb.left) + 'px'; a.style.top = (y - zb.top) + 'px'; a.style.setProperty('--r', (Math.random() * 2 - 1).toFixed(2));
      a.innerHTML = '<span class="surf-in"><span class="mk-l">' + logoImg(t) + '</span><b>' + esc(t) + '</b><em class="' + (up ? 'up' : 'dn') + '">' + (up ? '▲ ' : '▽ ') + pct(v) + '</em></span>';
      zone.appendChild(a);
      var c = { el: a, t: t }; live.push(c);
      if (still) return;
      W.drop(x, y, 20, 0.5);
      setTimeout(function () {
        var b = a.getBoundingClientRect(); a.classList.add('out'); W.drop(b.left + b.width / 2, b.top + b.height / 2, 16, 0.42);
        setTimeout(function () { a.remove(); live.splice(live.indexOf(c), 1); }, 900);
      }, 4200 + Math.random() * 1800);
    }
    function tryAt(x, y, spread) {
      if (live.length >= MAX || $('.sheet-wrap.open')) return;
      for (var z = 0; z < zones.length; z++) {
        var zone = zones[z], zb = zone.getBoundingClientRect(); if (zb.bottom < 120 || zb.top > innerHeight - 80 || zone.classList.contains('is-open')) continue;
        for (var k = 0; k < 7; k++) {
          var cx = x == null ? Math.max(zb.left, 0) + 30 + Math.random() * (Math.min(zb.right, innerWidth) - Math.max(zb.left, 0) - 60) : x + (Math.random() - 0.5) * spread * 2, cy = y == null ? Math.max(zb.top, 90) + Math.random() * (Math.min(zb.bottom, innerHeight) - Math.max(zb.top, 90)) : y + (Math.random() - 0.5) * spread * 2;
          if (cy < zb.top || cy > zb.bottom) continue;
          if (free(zone, cx, cy, 190, 50)) { chip(zone, cx, cy); return; }
        }
      }
    }
    if (reduce) {
      zones.forEach(function (zone, zi) { var zb = zone.getBoundingClientRect(), n = 0; for (var k = 0; k < 60 && n < (zi ? 2 : 3); k++) { var cx = Math.max(zb.left, 0) + 100 + Math.random() * (Math.min(zb.right, innerWidth) - Math.max(zb.left, 0) - 200), cy = zb.top + 30 + Math.random() * (zb.height - 60); var r = { left: cx - 84, right: cx + 84, top: cy - 23, bottom: cy + 23 }; if (r.left < Math.max(14, zb.left + 10) || r.right > Math.min(innerWidth - 14, zb.right - 10)) continue; var ok = $$('.hero-h,.hero-sub,.hero-btns,.cx,.hero-watch,.close-h,.close-sub,.closing .btn,.surf', zone).every(function (e) { var b = e.getBoundingClientRect(); return !b.width || !hit(r, b, 22); }); if (ok) { chip(zone, cx, cy, true); n++; } } });
      return;
    }
    var gap = function (ms) { var n = performance.now(); if (n - lastT < ms) return false; lastT = n; return true; };
    addEventListener('pointermove', function (e) { if (e.target.closest && e.target.closest('.surf')) return; if (gap(live.length ? 1100 : 450)) tryAt(e.clientX, e.clientY, 150); }, { passive: true });
    addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('a,button,input,.surf')) return; lastT = performance.now(); tryAt(e.clientX, e.clientY, 110); }, { passive: true });
    addEventListener('scroll', function () { if (gap(900)) tryAt(null, null, 0); }, { passive: true });
    addEventListener('resize', function () { MAX = innerWidth < 760 ? 2 : 4; });
  })();

  /* tooltips: only the first one waits. Once one is showing, moving to a neighbour opens it at once,
     and the group stays warm for a moment after the last one closes. Labels come from data-tip. */
  (function () {
    $$('[title].soc-b').forEach(function (b) { b.dataset.tip = b.getAttribute('title'); b.removeAttribute('title'); });
    var tip = null, cur = null, wait = 0, cool = 0, warm = false;
    function place(t) {
      var r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      var below = r.top - h - 8 < 8, x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)), y = below ? r.bottom + 8 : r.top - h - 8;
      tip.classList.toggle('below', below);
      tip.style.setProperty('--tx', x.toFixed(1) + 'px'); tip.style.setProperty('--ty', y.toFixed(1) + 'px');
    }
    function open(t) {
      if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); tip.id = 'galore-tip'; document.body.appendChild(tip); }
      clearTimeout(cool); cur = t; tip.textContent = t.dataset.tip; t.setAttribute('aria-describedby', tip.id);
      tip.classList.add('instant'); place(t); void tip.offsetWidth; tip.classList.toggle('instant', warm || reduce); tip.classList.add('on'); warm = true;
    }
    function show(t) { clearTimeout(wait); if (warm) open(t); else wait = setTimeout(function () { open(t); }, 600); }
    function hide(t) {
      clearTimeout(wait); if (!tip || cur !== t) return; t.removeAttribute('aria-describedby'); cur = null;
      tip.classList.add('instant'); tip.classList.remove('on');
      clearTimeout(cool); cool = setTimeout(function () { warm = false; }, 400);
    }
    document.addEventListener('pointerover', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t && e.pointerType === 'mouse' && t !== cur) show(t); });
    document.addEventListener('pointerout', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t && !t.contains(e.relatedTarget)) hide(t); });
    document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t && t.matches(':focus-visible')) show(t); });
    document.addEventListener('focusout', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t) hide(t); });
    document.addEventListener('pointerdown', function () { if (cur) hide(cur); }, true);
    addEventListener('scroll', function () { if (cur) hide(cur); }, { passive: true });
  })();

  /* scroll edges: a scroller fades only on the side that still has more to swipe */
  (function () {
    function edge(el) {
      var max = el.scrollWidth - el.clientWidth, x = el.scrollLeft, e = [];
      if (x <= 1) e.push('start'); if (x >= max - 1) e.push('end');
      el.setAttribute('data-edge', e.join(' '));
    }
    $$('.cx-chips').forEach(function (el) {
      edge(el); el.addEventListener('scroll', function () { edge(el); }, { passive: true });
      new MutationObserver(function () { el.scrollLeft = 0; edge(el); }).observe(el, { childList: true });
    });
    addEventListener('resize', function () { $$('.cx-chips').forEach(edge); }, { passive: true });
  })();

  if (G.isJoined()) document.documentElement.classList.add('is-joined');

  /* /waitlist (and #join) open the sheet on load, honouring ?request=creator, ?asset= and ?profile= like the live site */
  var onWaitlist = /^\/waitlist(?:\.html)?$/.test(location.pathname);
  if (onWaitlist || location.hash === '#join') {
    var wq = new URLSearchParams(location.search), wProfile = wq.get('profile'), wAsset = wq.get('asset');
    var wLink = wProfile ? $$('[data-gate][data-slug]').filter(function (l) { return l.dataset.slug === wProfile; })[0] : null;
    if (onWaitlist && wq.get('request') === 'creator') openCreatorSignup();
    else if (onWaitlist && wAsset && ASSET_NAMES[wAsset]) openAssetSignup(wAsset, ASSET_NAMES[wAsset]);
    else if (onWaitlist && wLink) openProfileSignup(wLink.dataset.slug, wLink.dataset.name, null);
    else openPlainSignup(onWaitlist ? 'waitlist_page' : 'join_hash');
  }

  /* first drop */
  document.body.classList.add('intro');
  if ($('.hero') && !reduce && !onWaitlist) { later(function () { dropAt($('.hero-h'), 30, 1.1, 0.5, 0.6); }, 500); later(function () { dropAt($('.hero-h'), 50, 0.4, 0.5, 0.6); }, 680); }
})();

