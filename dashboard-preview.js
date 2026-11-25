(() => {
  'use strict';
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];
  const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => '$' + Number(n).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  let current = 'home', belief = 'AI will need much more electricity.';
  let saved = [], orders = [];
  try { saved = JSON.parse(sessionStorage.getItem('galore_preview_saved') || '[]'); orders = JSON.parse(sessionStorage.getItem('galore_preview_orders') || '[]'); } catch {}
  if (!Array.isArray(saved)) saved = [];
  if (!Array.isArray(orders)) orders = [];
  const examples = [
    {match:/electric|power|energy|data.?center|\bai\b/i, connections:[['Power equipment','More data centers can need transformers, wiring and grid upgrades.'],['Energy producers','Additional computing may increase demand for generation capacity.'],['Broad funds','A diversified fund could spread exposure across several companies.']]},
    {match:/travel|luxury|bag/i, connections:[['Travel platforms','Changes in leisure spending could affect booking activity.'],['Hospitality','Hotel demand may change if younger consumers spend more on trips.'],['Consumer funds','A broader fund could include several parts of the spending shift.']]},
    {match:/cyber|security/i, connections:[['Security software','More security spending can affect providers of protective software.'],['Infrastructure','Companies may invest in network and identity protection.'],['Technology funds','A wider approach may spread exposure across providers.']]}
  ];
  function persist() { try { sessionStorage.setItem('galore_preview_saved', JSON.stringify(saved)); sessionStorage.setItem('galore_preview_orders', JSON.stringify(orders)); } catch {} }
  function view(name) {
    if (name === 'research' && !belief) belief = 'AI will need much more electricity.';
    if (!$('[data-page="' + name + '"]')) return;
    current = name;
    $$('.view').forEach(el => el.hidden = el.dataset.page !== name);
    $$('[data-view]').forEach(el => {
      if (el.dataset.view === name) el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
    $('#location-label').textContent = name.charAt(0).toUpperCase() + name.slice(1);
    if (name === 'research') renderResearch();
    if (name === 'watchlist') renderSaved();
    if (name === 'portfolio') renderOrders();
    if (name === 'people') renderPeople();
    history.replaceState(null, '', '#' + name);
    $('#content').scrollIntoView({block:'start',behavior:'instant'});
  }
  function renderResearch() {
    $('#research-belief').textContent = belief;
    const example = examples.find(item => item.match.test(belief));
    const connections = example ? example.connections : [
      ['Possible companies','A real result would explain which businesses connect to your idea.'],
      ['Broader funds','A real result would distinguish direct and diversified exposure.'],
      ['Open questions','A real result would cite evidence and explain where the idea might fail.']
    ];
    $('#connection-list').innerHTML = connections.map(([name, why]) => '<div class="connection"><b>' + escape(name) + '</b><p>' + escape(why) + '</p></div>').join('');
    $('#save-belief').textContent = saved.includes(belief) ? 'Saved to watchlist' : 'Save to watchlist';
  }
  function renderSaved() {
    $('#saved-beliefs').innerHTML = saved.length ? saved.map((item,i) => '<div><span>' + escape(item) + '</span><button data-remove="' + i + '" aria-label="Remove ' + escape(item) + ' from watchlist">Remove</button></div>').join('') : '<div class="empty">No saved ideas yet. <button data-view="explore">Explore an example</button></div>';
  }
  function renderOrders() {
    const total = orders.reduce((sum, item) => sum + item.amount, 0);
    $('#cash-remaining').textContent = money(Math.max(0, 10000 - total));
    $('#order-count').textContent = String(orders.length);
    $('#orders').innerHTML = orders.length ? orders.map((item,i) => '<div><span><b>' + escape(item.category) + '</b><small>Simulated order ' + (i+1) + ' · no execution</small></span><b>' + money(item.amount) + '</b></div>').join('') : '<div class="empty">No practice orders. Your sample paper cash is untouched.</div>';
  }
  const groups = {
    creators: [['Creator example','A creator profile would show dated public calls, source posts, exits and losses.'],['Request someone','Suggest a creator you want to follow after joining the waitlist.']],
    politicians: [['Congress profile example','A public disclosure would show the filing source, reported range and transaction date.'],['Disclosure timing','A filing date can be later than a transaction. It is not a live trade signal.']],
    investors: [['Investor profile example','A sourced portfolio view would distinguish disclosed holdings from estimates.'],['Record coverage','Missing or unverified trades would be shown as unknown, without inferred returns.']]
  };
  function renderPeople(group='creators') {
    $$('[data-people]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.people===group)));
    $('#people-content').innerHTML = groups[group].map(([title, description]) => '<div class="person-row"><div class="avatar" aria-hidden="true">' + escape(title.charAt(0)) + '</div><div><b>' + escape(title) + '</b><p>' + escape(description) + '</p></div><button data-open="access">Get access</button></div>').join('');
  }
  function research(q) {
    const error = $('#belief-error');
    q = String(q || '').trim();
    if (q.length < 9 || /^\s+$/.test(q) || /^(asdf|hello|test|123|buy|\$?[A-Z]{2,5})[.!]?$/i.test(q)) {
      error.textContent = 'Write what you think will change, for example: AI will need more electricity.';
      $('#belief-input').setAttribute('aria-invalid','true');
      $('#belief-input').focus(); return;
    }
    error.textContent = ''; $('#belief-input').removeAttribute('aria-invalid');
    belief = q; view('research');
  }
  $('#belief-form').addEventListener('submit',e => { e.preventDefault(); research($('#belief-input').value); });
  $('#save-belief').addEventListener('click',() => {
    if (!saved.includes(belief)) { saved.push(belief); persist(); }
    $('#save-belief').textContent = 'Saved to watchlist';
  });
  $('#clear-preview').addEventListener('click',() => {
    saved=[];orders=[];persist();$('#clear-preview').textContent='Sample choices cleared';
  });
  const dialog = $('#modal'), content = $('#modal-content');
  $('.modal-close').addEventListener('click',() => dialog.close());
  dialog.addEventListener('click',e => { if (e.target === dialog) dialog.close(); });
  function open(type) {
    if (type === 'access') content.innerHTML = '<p class="eyebrow">Access preview</p><h2 id="modal-title">Join the waitlist</h2><p>This example shows the signup step. Submitting it does not send or save your information. Joining the actual waitlist does not immediately activate a paper account; access is offered in batches.</p>' + (current === 'research' ? '<p class="access-context">Your idea stays with you: <b>' + escape(belief) + '</b></p>' : current === 'people' ? '<p class="access-context">After access: continue exploring people and their sourced public records.</p>' : '') + '<form id="access-form" novalidate><label for="first">First name</label><input id="first" autocomplete="given-name" required><label for="last">Last name</label><input id="last" autocomplete="family-name" required><label for="email">Email</label><input id="email" type="email" autocomplete="email" required><p class="error" id="access-error" role="alert"></p><button class="primary" type="submit">Preview signup</button></form><p class="fine">An invitation would explain email confirmation and paper account access before any setup.</p><button type="button" class="text-button" data-invite>Already have an invitation? Preview sign-in</button>';
    if (type === 'brokerage') content.innerHTML = '<p class="eyebrow">Connection states</p><h2 id="modal-title">Brokerage connection</h2><p>Sandbox testing and a future live connection are separate states. Neither is active in this preview.</p><ol><li>See the brokerage and connection permissions.</li><li>Confirm whether an account is approved for live trading.</li><li>Review an order before any execution.</li></ol><p>Current status: unavailable. No brokerage sign-in or order is requested.</p>';
    if (type === 'ai') content.innerHTML = '<p class="eyebrow">AI connections</p><h2 id="modal-title">Connect an assistant</h2><p>After access, you would choose an assistant, review what it can read or propose, then approve each practice trade. A real connection would offer copyable install instructions and a way to revoke its token.</p><p>No connection or token is created in this walkthrough.</p>';
    if (type === 'order') {
      const remaining = Math.max(0,10000-orders.reduce((sum,item)=>sum+item.amount,0));
      content.innerHTML = '<p class="eyebrow">Simulated paper order</p><h2 id="modal-title">Practice an order</h2><p>This walkthrough uses categories in place of live securities or quotes. You can see the review step without placing a real order.</p><form id="order-form" novalidate><label for="category">Example category</label><select id="category"><option>Power equipment</option><option>Energy producers</option><option>Broad funds</option><option>Travel platforms</option><option>Security software</option></select><label for="amount">Paper amount in USD</label><input id="amount" type="number" min="1" max="' + remaining + '" step="1" value="' + Math.min(1000,remaining) + '"><p class="error" id="order-error" role="alert"></p><button class="primary" type="submit">Review simulated order</button></form><p class="fine">Sample cash available: ' + money(remaining) + '.</p>';
    }
    if (!dialog.open) dialog.showModal();
    $('.modal-close').focus();
  }
  content.addEventListener('submit',e => {
    if (e.target.id === 'access-form') {
      e.preventDefault();
      const first=$('#first').value.trim(), last=$('#last').value.trim(), email=$('#email').value.trim();
      if (!first || !last || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#access-error').textContent='Enter your first name, last name and a valid email to see the next step.'; return; }
      content.innerHTML='<p class="eyebrow">Preview only</p><h2 id="modal-title">This is the next step.</h2><p>In the actual signup, you would get confirmation about your waitlist status. Paper access is offered in batches. No details from this walkthrough were submitted or saved.</p><button class="primary" type="button" data-close>Back to preview</button>';
    }
    if (e.target.id === 'order-form') {
      e.preventDefault();
      const amount=Number($('#amount').value), remaining=10000-orders.reduce((sum,item)=>sum+item.amount,0);
      if (!Number.isFinite(amount) || amount < 1 || amount > remaining) { $('#order-error').textContent='Choose an amount between $1 and '+money(remaining)+'.';return; }
      const category=$('#category').value;
      content.innerHTML='<p class="eyebrow">Review your practice order</p><h2 id="modal-title">'+escape(category)+'</h2><p>Amount: '+money(amount)+' in simulated cash. This is a category example, not a priced security or brokerage order.</p><button class="primary" type="button" data-confirm-order data-category="'+escape(category)+'" data-amount="'+amount+'">Confirm simulated order</button><p class="fine">You are in control of every practice order.</p>';
    }
  });
  content.addEventListener('click',e => {
    if (e.target.closest('[data-close]')) dialog.close();
    if (e.target.closest('[data-invite]')) content.innerHTML='<p class="eyebrow">Invited members</p><h2 id="modal-title">Sign in with an email link</h2><p>Waitlisted visitors cannot sign in until an account invitation arrives. This walkthrough does not email a link or open a real account.</p><label for="invite-email">Email address</label><input id="invite-email" type="email" placeholder="you@example.com"><button class="primary" type="button" data-signin-preview>Preview sign-in state</button><button class="text-button" type="button" data-access-back>Back to waitlist</button>';
    if (e.target.closest('[data-signin-preview]')) content.innerHTML='<p class="eyebrow">Illustrative state</p><h2 id="modal-title">Check your email</h2><p>If this were an active invited account, a sign-in link would be sent. No link was sent from this preview.</p><button class="primary" type="button" data-close>Back to dashboard</button>';
    if (e.target.closest('[data-access-back]')) open('access');
    const confirm=e.target.closest('[data-confirm-order]');
    if (confirm) {
      const amount=Number(confirm.dataset.amount);
      if (amount > 0 && amount <= 10000-orders.reduce((sum,item)=>sum+item.amount,0)) {orders.push({category:confirm.dataset.category,amount});persist();}
      content.innerHTML='<p class="eyebrow">Practice order complete</p><h2 id="modal-title">Added to your sample portfolio.</h2><p>No live trade or brokerage order was made.</p><button class="primary" type="button" data-close>View portfolio</button>';
      renderOrders();view('portfolio');
    }
  });
  document.addEventListener('click',e => {
    const nav=e.target.closest('[data-view]'), sample=e.target.closest('[data-belief]'), opener=e.target.closest('[data-open]'), person=e.target.closest('[data-people]'), remove=e.target.closest('[data-remove]');
    if (nav) { view(nav.dataset.view); return; }
    if (sample) { $('#belief-input').value=sample.dataset.belief;research(sample.dataset.belief);return; }
    if (opener) { open(opener.dataset.open);return; }
    if (person) { renderPeople(person.dataset.people);return; }
    if (remove) { saved.splice(Number(remove.dataset.remove),1);persist();renderSaved(); }
  });
  const initial=location.hash.slice(1);
  view($('[data-page="'+initial+'"]') ? initial : 'home');
})();
