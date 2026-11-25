(() => {
  const frame = document.querySelector('[data-motion-demo]');
  if (!frame) return;
  const tabs = [...frame.querySelectorAll('[data-motion-step]')];
  const scenes = [...frame.querySelectorAll('[data-scene]')];
  const typing = frame.querySelector('[data-motion-typing]');
  const toggle = frame.querySelector('[data-motion-toggle]');
  const replay = frame.querySelector('[data-motion-replay]');
  const approve = frame.querySelector('[data-motion-approve]');
  const orderStatus = frame.querySelector('[data-motion-order-status]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const phrase = 'AI will need much more electricity.';
  const length = 3900;
  let current = 0, paused = reduce.matches, visible = false, timer = null, typingTimer = null;
  const clear = () => { clearTimeout(timer); clearInterval(typingTimer); timer = typingTimer = null; };
  const syncToggle = () => {
    toggle.hidden = reduce.matches;
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Play walkthrough' : 'Pause walkthrough');
    frame.classList.toggle('is-paused', paused);
  };
  function write() {
    typing.textContent = '';
    let n = 0;
    typingTimer = setInterval(() => {
      n++;
      typing.textContent = phrase.slice(0,n);
      if (n >= phrase.length) { clearInterval(typingTimer); typingTimer = null; }
    }, 69);
  }
  function select(index, focus = false) {
    clear();
    current = index;
    scenes.forEach((scene, i) => {
      const on = i === index;
      scene.hidden = !on;
      scene.classList.toggle('is-current',on);
      if (on && !reduce.matches) { scene.classList.remove('is-current'); void scene.offsetWidth; scene.classList.add('is-current'); }
    });
    tabs.forEach((tab,i) => {
      tab.setAttribute('aria-selected',String(i===index));
      tab.tabIndex = i===index ? 0 : -1;
    });
    const progress = tabs[index].firstElementChild;
    progress.replaceWith(progress.cloneNode(true));
    if (focus) tabs[index].focus();
    if (index===0) {
      if (reduce.matches || paused) typing.textContent = phrase;
      else write();
    }
    if (!paused && visible && !document.hidden && !reduce.matches) timer = setTimeout(() => select((index+1)%scenes.length),length);
  }
  tabs.forEach((tab,i) => {
    tab.addEventListener('click',() => select(i,true));
    tab.addEventListener('keydown',event => {
      let next=i;
      if(event.key==='ArrowRight') next=(i+1)%tabs.length;
      else if(event.key==='ArrowLeft') next=(i-1+tabs.length)%tabs.length;
      else if(event.key==='Home') next=0;
      else if(event.key==='End') next=tabs.length-1;
      else return;
      event.preventDefault();select(next,true);
    });
  });
  toggle.addEventListener('click',() => {
    paused = !paused;
    syncToggle();
    if (paused) { clear(); if (current===0) typing.textContent=phrase; }
    else select(current);
  });
  replay.addEventListener('click',() => select(0));
  approve.addEventListener('click',() => {
    approve.textContent = 'Approved in demo';
    approve.disabled = true;
    approve.closest('.motion-ticket').classList.add('is-approved');
    orderStatus.textContent = 'Sample paper order confirmed. No live order was sent.';
  });
  function start(isVisible) {
    visible=isVisible;
    if (!visible) { clear(); return; }
    if (current===0 && !paused) select(0);
    else if (current===0) typing.textContent=phrase;
    else if (!paused) select(current);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => start(entries[0].isIntersecting),{threshold:0.18}).observe(frame);
  } else start(true);
  document.addEventListener('visibilitychange',() => {
    if(document.hidden) clear();
    else if(visible && !paused) select(current);
  });
  reduce.addEventListener?.('change',event => {
    paused=event.matches;
    syncToggle();
    select(current);
  });
  syncToggle();
  if (paused) typing.textContent=phrase;
})();
