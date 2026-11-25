/*
 * Galore shared kit for the 2026-11-18 texture directions.
 * Every direction loads ../shared/prices.js then ../shared/galore-kit.js.
 * It provides: the ring-O wordmark, belief analysis on real 1-year prices,
 * creator/politician lookups, and the waitlist gate. Design is up to each site.
 *
 * Production copy for trygalore.com: join() is replaced by the live /api/waitlist flow in site.js.
 */
(function () {
  const KEY = 'galore.waitlist.v1';
  const KIT_SRC = (document.currentScript && document.currentScript.src) || '';
  const P = window.GALORE_PRICES || {};

  /* ---------- wordmark (Instrument Serif, ring O) ---------- */
  const RING_SVG =
    '<svg class="gk-o" viewBox="0 0 80 88" aria-hidden="true" focusable="false">' +
    '<ellipse cx="39" cy="44" rx="31" ry="36" fill="none" stroke="currentColor" stroke-width="7.5"/>' +
    '<ellipse cx="42" cy="46" rx="22" ry="27" fill="none" stroke="currentColor" stroke-width="6.5" opacity=".88"/>' +
    '<ellipse cx="45" cy="48" rx="14" ry="18" fill="none" stroke="currentColor" stroke-width="5.8" opacity=".7"/>' +
    '<ellipse cx="48" cy="50" rx="7" ry="9" fill="none" stroke="currentColor" stroke-width="5" opacity=".55"/></svg>';
  const WORDMARK =
    '<span class="gk-wordmark" aria-label="Galore"><span>gal</span>' + RING_SVG + '<span>re</span></span>';
  function injectWordmarkStyles() {
    if (document.getElementById('gk-style')) return;
    const s = document.createElement('style');
    s.id = 'gk-style';
    const base = KIT_SRC;
    s.textContent =
      "@font-face{font-family:'Instrument Serif';src:url('" + new URL('InstrumentSerif-Regular.ttf', base || location.href) + "') format('truetype');font-display:swap}" +
      ".gk-wordmark{font-family:'Instrument Serif',serif;letter-spacing:-.09em;display:inline-flex;align-items:baseline;line-height:1;white-space:nowrap}" +
      ".gk-o{width:.79em;height:.95em;margin:0 .02em 0 .01em;transform:translateY(.16em);overflow:visible}";
    document.head.appendChild(s);
  }
  function mountWordmarks() {
    injectWordmarkStyles();
    document.querySelectorAll('[data-galore-wordmark]').forEach(el => { el.innerHTML = WORDMARK; });
  }

  /* ---------- belief themes (tickers all have real prices in prices.js) ---------- */
  const THEMES = [
    { k: /\b(plumb|electric|trades\b|tradespeople|skilled trade|blue.?collar|white.?collar|automat)/i, belief: 'AI automates office work and pushes demand to skilled trades', h: [['PWR', 'buy', 'Grid and electrical contractors'], ['MAS', 'buy', 'Plumbing and home products'], ['HD', 'buy', 'Where the trades buy supplies'], ['LOW', 'buy', 'Pro and DIY supplies']] },
    { k: /\b(ai|chip|semi|gpu|nvidia|compute)\b/i, belief: 'AI demand keeps the chip makers busy for years', h: [['AMD', 'buy', 'Data-center GPUs and CPUs'], ['TSM', 'buy', 'Makes most advanced chips'], ['AVGO', 'buy', 'Custom AI chips and networking'], ['NVDA', 'buy', 'Leading AI accelerators']] },
    { k: /\b(gold|silver|inflation|dollar|debase)/i, belief: 'Inflation sticks around and hard assets win', h: [['NEM', 'buy', 'Largest gold miner'], ['WPM', 'buy', 'Precious-metals streaming'], ['GLD', 'buy', 'Physical gold'], ['SLV', 'buy', 'Physical silver']] },
    { k: /\b(weight|ozempic|glp|obesity|wegovy)/i, belief: 'Weight-loss drugs become as common as statins', h: [['LLY', 'buy', 'Mounjaro and Zepbound'], ['NVO', 'buy', 'Ozempic and Wegovy'], ['PEP', 'short', 'Snack demand could shrink'], ['KO', 'buy', 'Diet and zero-sugar lines hold up']] },
    { k: /\b(nuclear|uranium|power|energy|data.?cent)/i, belief: 'AI data centers need nuclear power', h: [['CEG', 'buy', 'Largest US nuclear fleet'], ['VST', 'buy', 'Nuclear and gas generation'], ['CCJ', 'buy', 'Uranium supply'], ['OKLO', 'buy', 'Small modular reactors']] },
    { k: /\b(recession|consumer|cheap|discount|tariff)/i, belief: 'Shoppers trade down when money gets tight', h: [['COST', 'buy', 'Bulk value'], ['WMT', 'buy', 'Everyday low prices'], ['TGT', 'short', 'More discretionary mix'], ['KO', 'buy', 'Staples hold up']] },
    { k: /\b(war|defen[cs]e|military|nato)/i, belief: 'Defense budgets keep rising', h: [['LMT', 'buy', 'F-35 and missiles'], ['RTX', 'buy', 'Missiles and engines'], ['NOC', 'buy', 'Bombers and space'], ['ITA', 'buy', 'Defense ETF']] },
    { k: /\b(cyber|hack|security|breach)/i, belief: 'Every company spends more on cybersecurity', h: [['CRWD', 'buy', 'Endpoint security'], ['PANW', 'buy', 'Network security'], ['NET', 'buy', 'Edge security'], ['PLTR', 'buy', 'Government data platforms']] },
    { k: /\b(ev|tesla|electric car|robotaxi|self.?driv)/i, belief: 'Robotaxis replace ride-hailing drivers', h: [['TSLA', 'buy', 'Robotaxi bet'], ['GOOGL', 'buy', 'Waymo'], ['UBER', 'short', 'Driver network loses its edge'], ['RIVN', 'buy', 'EV maker']] },
  ];
  const FALLBACK = { belief: null, h: [['SPY', 'buy', 'The broad US market'], ['QQQ', 'buy', 'Large US tech'], ['MSFT', 'buy', 'Software and cloud'], ['AAPL', 'buy', 'Consumer devices']] };

  function backtest(holdings) {
    const legs = holdings.filter(h => P[h.t]);
    const n = Math.min(...legs.map(h => P[h.t].w.length));
    const series = [];
    for (let i = 0; i < n; i++) {
      let v = 0;
      legs.forEach(h => {
        const x = P[h.t].w[i];
        v += h.side === 'short' ? Math.max(0, 200 - x) : x; // short leg: gains when price falls, floor at 0
      });
      series.push(+(v / legs.length).toFixed(2));
    }
    return { start: 100, final: series[series.length - 1], pct: +(series[series.length - 1] - 100).toFixed(1), series };
  }

  /** Analyze a typed belief. Returns a Promise so designs can animate the wait. */
  function analyze(text) {
    const q = String(text || '').trim();
    const theme = THEMES.find(t => t.k.test(q)) || FALLBACK;
    const holdings = theme.h.map(([t, side, why]) => ({ t, side, why, r1y: P[t] ? (side === 'short' ? -P[t].r1y : P[t].r1y) : null }));
    const result = {
      input: q,
      belief: theme.belief || ('Your belief: ' + q.replace(/\.$/, '')),
      matched: !!theme.belief,
      holdings,
      backtest: backtest(holdings),
      steps: ['Reading your belief', 'Finding companies that fit', 'Checking filings and listings', 'Pricing the past year'],
      note: 'Past year, $100 split equally, before fees. Paper results, not a promise.',
    };
    return new Promise(r => setTimeout(() => r(result), 2200));
  }

  /* ---------- people lookups: preview only, full page lives in the dashboard ---------- */
  const PEOPLE = [
    { kind: 'politician', name: 'Nancy Pelosi', role: 'Former Speaker of the House', slug: 'nancy-pelosi' },
    { kind: 'investor', name: 'Warren Buffett', role: 'Berkshire Hathaway chairman emeritus', slug: 'warren-buffett' },
    { kind: 'investor', name: 'Cathie Wood', role: 'ARK Invest founder and CEO', slug: 'cathie-wood' },
    { kind: 'investor', name: 'Bill Ackman', role: 'Pershing Square CEO', slug: 'bill-ackman' },
    { kind: 'investor', name: 'David Tepper', role: 'Appaloosa founder, Carolina Panthers owner', slug: 'david-tepper' },
    { kind: 'creator', name: 'Jeremy Lefebvre', role: '954K YouTube subscribers', slug: 'jeremy-lefebvre' },
    { kind: 'creator', name: 'Jim Cramer', role: '2.5M X followers', slug: 'jim-cramer' },
    { kind: 'creator', name: 'Stas Serfes', role: '134K TikTok followers', slug: 'stas-serfes' },
    { kind: 'creator', name: 'Any finance creator', role: 'Paste their TikTok, YouTube or X link', slug: '' },
  ];
  function searchPeople(q) {
    const s = String(q || '').toLowerCase().trim();
    if (!s) return PEOPLE.filter(p => p.kind === 'politician' || p.kind === 'investor').slice(0, 5);
    return PEOPLE.filter(p => p.name.toLowerCase().includes(s));
  }
  function dashboardUrl(kind, slug) {
    const base = 'https://app.trygalore.com/';
    if (kind === 'politician') return base + '#politicians' + (slug ? '/' + slug : '');
    if (kind === 'creator') return base + '#creators' + (slug ? '/' + slug : '');
    if (kind === 'link') return base + '#link';
    return base + '#home';
  }
  function isLink(q) { return /^(https?:\/\/)?(www\.)?(tiktok|youtube|youtu\.be|x\.com|twitter|instagram|reddit)/i.test(String(q).trim()); }

  /* ---------- waitlist gate ---------- */
  function isJoined() { try { return !!JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return false; } }
  /* production: signup runs through POST /api/waitlist in /landing/ripple/site.js; nothing here stores an email */
  function join() { return Promise.reject(new Error('Signup runs through /api/waitlist.')); }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }

  const SAMPLES = [
    'AI will make plumbers rich',
    'Weight-loss drugs are the next statins',
    'Data centers will run on nuclear',
    'Gold keeps going up while inflation sticks',
    'Every company will pay for cybersecurity',
    'Shoppers trade down in a recession',
  ];

  window.Galore = { WORDMARK, mountWordmarks, analyze, searchPeople, dashboardUrl, isLink, isJoined, join, reset, SAMPLES, prices: P };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountWordmarks); else mountWordmarks();
})();

