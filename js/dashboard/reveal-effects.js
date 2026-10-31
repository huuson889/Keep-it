/* Shared Dashboard reveal orchestration. View modules provide targets, CSS classes and feature-specific callbacks. */
(()=>{
 const prefersReducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const resolveStart=(startAt,target,now,index)=>{
  const value=typeof startAt==='function'?startAt(target,now,index):startAt;
  return Number.isFinite(Number(value))?Number(value):0;
 };
 function createScope(){
  let cycle=0;
  const observers=new Set(),timers=new Set(),frames=new Set(),targetTimers=new Map(),sequenceEnds=new Map();
  function cancel(){
   cycle++;
   for(const observer of observers)observer.disconnect();
   observers.clear();
   for(const timer of timers)clearTimeout(timer);
   timers.clear();targetTimers.clear();
   for(const frame of frames)cancelAnimationFrame(frame);
   frames.clear();sequenceEnds.clear();
  }
  function schedule(delay,callback,active=()=>true,target=null){
   if(target&&targetTimers.has(target))return targetTimers.get(target);
   const generation=cycle;
   const timer=window.setTimeout(()=>{
    timers.delete(timer);if(target)targetTimers.delete(target);
    if(generation!==cycle||!active())return;
    callback();
   },Math.max(0,Number(delay)||0));
   timers.add(timer);if(target)targetTimers.set(target,timer);return timer;
  }
  function frame(callback,active=()=>true){
   const generation=cycle;
   if(!window.requestAnimationFrame)return schedule(0,callback,active);
   const id=window.requestAnimationFrame(()=>{
    frames.delete(id);
    if(generation!==cycle||!active())return;
    callback();
   });
   frames.add(id);return id;
  }
  function nextAt(key,target,index,now,lead,startAt,step){
   const revealAt=Math.max(now+Math.max(0,Number(lead)||0),resolveStart(startAt,target,now,index),sequenceEnds.get(key)||0);
   sequenceEnds.set(key,revealAt+Math.max(0,Number(step)||0));
   return revealAt;
  }
  function sequence(targets,{key='default',step=80,lead=0,startAt=0,onTarget=()=>{}}={}){
   [...targets].forEach((target,index)=>{
    const now=performance.now(),revealAt=nextAt(key,target,index,now,lead,startAt,step);
    onTarget(target,Math.max(0,revealAt-now),index,revealAt);
   });
  }
  function observe({root=null,targets=[],threshold=.12,rootMargin='0px',key=root||Symbol('reveal'),step=80,lead=100,startAt=0,isEligible=()=>true,onTarget=()=>{}}={}){
   const generation=cycle,observed=new Set();
   let order=new Map(),disposed=false,observer=null;
   const eligible=target=>isEligible(target,order.get(target)??0);
   const deliver=target=>{
    if(disposed||generation!==cycle||!observed.has(target)||!eligible(target))return;
    const index=order.get(target)??0,now=performance.now(),revealAt=nextAt(key,target,index,now,lead,startAt,step);
    observed.delete(target);observer?.unobserve(target);
    onTarget(target,Math.max(0,revealAt-now),index,revealAt);
   };
   if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{
     entries.filter(entry=>entry.isIntersecting&&observed.has(entry.target)&&eligible(entry.target))
      .sort((a,b)=>(order.get(a.target)??0)-(order.get(b.target)??0))
      .forEach(entry=>deliver(entry.target));
    },{root,threshold,rootMargin});
    observers.add(observer);
   }
   function update(nextTargets){
    if(disposed||generation!==cycle)return;
    const list=[...nextTargets],current=new Set(list);order=new Map(list.map((target,index)=>[target,index]));
    for(const target of observed)if(!current.has(target)){observer?.unobserve(target);observed.delete(target)}
    list.forEach(target=>{
     if(observed.has(target)||!eligible(target))return;
     observed.add(target);
     if(observer)observer.observe(target);else deliver(target);
    });
   }
   function disconnect(){
    if(disposed)return;disposed=true;observer?.disconnect();if(observer)observers.delete(observer);observed.clear();
   }
   const handle={observe:update,disconnect};
   update(targets);return handle;
  }
  return {cancel,schedule,frame,sequence,observe,hasScheduled:target=>targetTimers.has(target),get cycle(){return cycle}};
 }
 globalThis.KeepitDashboardReveal=Object.freeze({createScope,prefersReducedMotion});
})();
