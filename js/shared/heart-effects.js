// Shared heart animations and touch/click guidance for Overlay and Full Dictionary.
(() => {
  'use strict';
  if (globalThis.LHN_HEART_EFFECTS) return;
  const HEART = 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z';
  const HAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-4 0"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';
  const css = `
.kp-heart-beat{animation:kp-heart-beat .5s ease!important}
@keyframes kp-heart-beat{0%{transform:scale(1)}30%{transform:scale(1.22)}55%{transform:scale(.94)}100%{transform:scale(1)}}
.kp-heart-big{position:absolute;width:144px;height:144px;margin:-72px 0 0 -72px;pointer-events:none;z-index:30;animation:kp-heart-pop 1s ease-out forwards}
.kp-heart-big svg{display:block;width:100%;height:100%;filter:drop-shadow(0 6px 14px rgba(255,45,85,.45))}
@keyframes kp-heart-pop{0%{transform:scale(.2) rotate(var(--r));opacity:0}15%{transform:scale(1.15) rotate(var(--r));opacity:1}30%{transform:scale(.95) rotate(var(--r))}70%{opacity:1}100%{transform:translateY(-110px) scale(1.25) rotate(var(--r));opacity:0}}
.kp-heart-burst{position:absolute;width:0;height:0;pointer-events:none;z-index:70}
.kp-heart-burst i{position:absolute;left:-5px;top:-5px;width:10px;height:10px;color:#f43f5e;animation:kp-heart-fly .75s ease-out forwards}
.kp-heart-burst i svg{display:block;width:10px;height:10px;fill:currentColor}
.kp-heart-burst b{position:absolute;left:-24px;top:-24px;width:48px;height:48px;border:2px solid #f43f5e;border-radius:50%;animation:kp-heart-ring .6s ease-out forwards}
.kp-heart-burst b+b{animation-delay:.12s;opacity:0}
@keyframes kp-heart-fly{0%{transform:translate(0,0) scale(.6);opacity:1}100%{transform:translate(var(--x),var(--y)) scale(1);opacity:0}}
@keyframes kp-heart-ring{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.7);opacity:0}}
.kp-heart-guide{position:absolute;width:136px;height:136px;margin:-68px 0 0 -68px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.38);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 8px 26px rgba(0,0,0,.3);color:#fff;pointer-events:none;z-index:31}
.kp-heart-guide svg{display:block;width:64px;height:64px;transform-origin:50% 75%}
@media (prefers-reduced-motion:reduce){.kp-heart-big{animation:none;opacity:1}.kp-heart-beat,.kp-heart-burst *{animation:none!important}}
`;
  let serial = 0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function beat(button) { if (!button || reduced()) return; button.classList.remove('kp-heart-beat'); void button.offsetWidth; button.classList.add('kp-heart-beat'); }
  function big(container, x, y) {
    const h=document.createElement('div'), id=`kpHeartGradient${++serial}`; h.className='kp-heart-big'; h.setAttribute('aria-hidden','true');
    h.style.left=`${x}px`; h.style.top=`${y}px`; h.style.setProperty('--r',`${(Math.random()*50-25).toFixed(1)}deg`);
    h.innerHTML=`<svg viewBox="0 0 24 24"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b95"/><stop offset="1" stop-color="#ff2d55"/></linearGradient></defs><path d="${HEART}" fill="url(#${id})"/></svg>`;
    container.append(h); setTimeout(() => h.remove(),1000); return h;
  }
  function burst(container,x,y) {
    if (reduced()) return;
    const b=document.createElement('span'); b.className='kp-heart-burst'; b.style.left=`${x}px`; b.style.top=`${y}px`;
    b.innerHTML='<b></b><b></b>'+Array.from({length:10},(_,i)=>{const a=i/10*Math.PI*2,r=34+(i%3)*8;return `<i style="--x:${(Math.cos(a)*r).toFixed(1)}px;--y:${(Math.sin(a)*r).toFixed(1)}px"><svg viewBox="0 0 24 24"><path d="${HEART}"/></svg></i>`}).join('');
    container.append(b); setTimeout(()=>b.remove(),900);
  }
  // The guide is visual only. The owner cancels it on interaction or close.
  function guide(container,x,y,onDone) {
    if (reduced()) return () => {};
    const g=document.createElement('div');g.className='kp-heart-guide';g.setAttribute('aria-hidden','true');g.style.left=`${x}px`;g.style.top=`${y}px`;g.innerHTML=HAND;container.append(g);
    const taps=Array.from({length:10},(_,i)=>500+i*220),dur=taps[9]+1420,anims=[],timers=[],hearts=[];
    anims.push(g.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none',offset:.1},{opacity:1,transform:'none',offset:.8},{opacity:0,transform:'none'}],{duration:dur,easing:'ease-out'}));
    const kf=[{transform:'none',offset:0}];taps.forEach(t=>kf.push({transform:'none',offset:(t-60)/dur},{transform:'scale(.8)',offset:t/dur},{transform:'none',offset:(t+80)/dur}));kf.push({transform:'none',offset:1});anims.push(g.querySelector('svg').animate(kf,{duration:dur}));
    taps.forEach((t,i)=>{if(i)timers.push(setTimeout(()=>hearts.push(big(container,x+(Math.random()*24-12),y-20+(Math.random()*16-8))),t))});
    let stopped=false;const stop=()=>{if(stopped)return;stopped=true;timers.forEach(clearTimeout);anims.forEach(a=>a.cancel());g.remove();hearts.forEach(h=>h.remove());onDone?.()};anims[0].onfinish=stop;return stop;
  }
  globalThis.LHN_HEART_EFFECTS=Object.freeze({css,beat,big,burst,guide});
})();
