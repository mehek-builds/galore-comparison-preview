(() => {
  const choices = {
    vrt: {name:'Vertiv · VRT',link:'Power and cooling for data centers',check:'Equipment orders and data center spending, with dated sources.',risk:'More efficient chips could reduce power needed per unit of compute.'},
    ceg: {name:'Constellation Energy · CEG',link:'Electricity generation for a growing grid',check:'Contract announcements, generation capacity and customer demand, with dated sources.',risk:'Grid upgrades or a different power mix could shift demand.'},
    etf: {name:'Utilities funds · ETF example',link:'A broader way to follow electricity demand',check:'Fund holdings, fees and the share tied to the original idea.',risk:'A broad fund may include businesses unrelated to data centers.'}
  };
  const buttons = [...document.querySelectorAll('[data-connection]')];
  const detail = document.querySelector('.research-detail');
  buttons.forEach((button,index) => {
    button.addEventListener('click', () => {
      buttons.forEach(b => { b.setAttribute('aria-selected',String(b===button)); b.tabIndex=b===button?0:-1; });
      detail.setAttribute('aria-labelledby',button.id);
      const item=choices[button.dataset.connection];
      for(const [selector,value] of Object.entries({'[data-research-name]':item.name,'[data-research-link]':item.link,'[data-research-check]':item.check,'[data-research-risk]':item.risk})) detail.querySelector(selector).textContent=value;
      detail.classList.remove('is-switching');void detail.offsetWidth;detail.classList.add('is-switching');
    });
    button.tabIndex=index===0?0:-1;
    button.addEventListener('keydown',event => {
      if(event.key!=='ArrowRight' && event.key!=='ArrowLeft')return;
      event.preventDefault();
      const next=(index+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length;
      buttons[next].click();buttons[next].focus();
    });
  });
  const range=document.querySelector('#portfolio-range');
  const ring=document.querySelector('[data-portfolio-ring]');
  const amount=document.querySelector('[data-allocation-amount]');
  const remaining=document.querySelector('[data-remaining-cash]');
  const percent=document.querySelector('[data-allocation-percent]');
  const review=document.querySelector('[data-paper-review]');
  const feedback=document.querySelector('[data-paper-feedback]');
  if(!range)return;
  const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  function update(){
    const value=Number(range.value);
    ring.style.setProperty('--allocation',value/100+'%');
    amount.textContent=money.format(value);
    remaining.textContent=money.format(10000-value);
    percent.textContent=value/100+'%';
    review.textContent='Review paper order';
    feedback.textContent='Illustrative only. No order is placed.';
  }
  range.addEventListener('input',update);
  review.addEventListener('click',()=>{
    review.textContent='Review ready';
    feedback.textContent=money.format(Number(range.value))+' simulated order prepared for your approval. Nothing was placed.';
  });
  update();
})();
