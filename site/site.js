(() => {
  const storageKey = 'galore_site_analytics_v1';
  const banner = document.querySelector('[data-site-preferences]');
  const preferencesLinks = document.querySelectorAll('[data-site-cookie-settings]');
  const media = window.matchMedia('(max-width: 760px)');
  const sticky = document.querySelector('[data-site-sticky-cta]');
  const mainCta = document.querySelector('.hero [data-join]');
  let choice;
  let lastTrigger;
  let analyticsScript;
  const analyticsDisabled = document.currentScript?.hasAttribute('data-disable-analytics');

  try { choice = localStorage.getItem(storageKey); } catch {}

  function updateAnalytics() {
    if (analyticsDisabled || choice !== 'allow') return;
    if (analyticsScript) return;

    window.va = window.va || ((...args) => {
      (window.vaq = window.vaq || []).push(args);
    });
    window.va('beforeSend', event => {
      if (choice !== 'allow') return null;
      try {
        const url = new URL(event.url, location.origin);
        url.search = '';
        url.hash = '';
        if (/^\/(i|r|p|h|n)\//.test(url.pathname)) url.pathname = '/shared';
        return { ...event, url: url.href };
      } catch { return null; }
    });

    analyticsScript = document.createElement('script');
    analyticsScript.src = '/_vercel/insights/script.js';
    analyticsScript.defer = true;
    analyticsScript.onerror = () => {
      analyticsScript.remove();
      analyticsScript = null;
    };
    document.head.append(analyticsScript);
  }

  function showPreferences(trigger) {
    if (!banner) return;
    lastTrigger = trigger;
    banner.hidden = false;
    if (trigger) banner.querySelector('button')?.focus();
  }

  function saveChoice(value) {
    choice = value;
    try { localStorage.setItem(storageKey, value); } catch {}
    banner.hidden = true;
    updateAnalytics();
    if (lastTrigger?.isConnected) lastTrigger.focus();
  }

  for (const link of preferencesLinks) {
    link.addEventListener('click', event => {
      event.preventDefault();
      showPreferences(link);
    });
  }
  banner?.addEventListener('click', event => {
    const button = event.target.closest('[data-site-analytics-choice]');
    if (button) saveChoice(button.dataset.siteAnalyticsChoice);
  });
  banner?.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !lastTrigger) return;
    banner.hidden = true;
    lastTrigger.focus();
  });
  if (choice !== 'allow' && choice !== 'deny') showPreferences();
  updateAnalytics();

  // Keep the existing waitlist dialog as the entry point for both CTAs.
  if (sticky && mainCta) {
    sticky.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (typeof document.querySelector('#s6-signup')?.showModal !== 'function') return;
      event.preventDefault();
      sticky.hidden = true;
      mainCta.click();
      document.querySelector('#s6-signup').addEventListener('close', () => {
        sticky.hidden = !media.matches;
        if (!sticky.hidden) sticky.focus({ preventScroll: true });
      }, { once: true });
    });
    const footer = document.querySelector('footer');
    let mainVisible = true;
    let footerVisible = false;
    const sync = () => {
      sticky.hidden = !media.matches || mainVisible || footerVisible || !!document.querySelector('#s6-signup[open]');
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.target === mainCta) mainVisible = entry.isIntersecting;
          if (entry.target === footer) footerVisible = entry.isIntersecting;
        }
        sync();
      });
      observer.observe(mainCta);
      if (footer) observer.observe(footer);
    } else {
      const measure = () => {
        const box = mainCta.getBoundingClientRect();
        mainVisible = box.bottom > 0 && box.top < innerHeight;
        footerVisible = !!footer && footer.getBoundingClientRect().top < innerHeight;
        sync();
      };
      window.addEventListener('scroll', measure, { passive: true });
      window.addEventListener('resize', measure);
      measure();
    }
    media.addEventListener('change', sync);
  }
})();

