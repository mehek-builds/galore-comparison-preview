(()=>{
  const tabs=[...document.querySelectorAll('.story-tabs [role="tab"]')];
  if(!tabs.length)return;
  function choose(index,focus){
    tabs.forEach((tab,i)=>{
      const active=i===index;
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
      const panel=document.getElementById(tab.getAttribute('aria-controls'));
      panel.hidden=!active;
      if(active && !matchMedia('(prefers-reduced-motion: reduce)').matches){
        panel.classList.remove('is-entering');void panel.offsetWidth;panel.classList.add('is-entering');
      }
    });
    if(focus)tabs[index].focus();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>choose(index,false));
    tab.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();choose(next,true);
    });
  });
})();
