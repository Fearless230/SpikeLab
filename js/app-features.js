/* app-features.js: features added on top of the core app (loaded last).
   Privacy and data · age rules · navigation · guided sessions · season calendar · jump load and soreness · milestones ·
   coach tools · install and reminders · theme and language. Each block is independent and only touches the DOM it owns. */
(function(){
"use strict";
const VB=window.VB,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s)),esc=VB.esc;
const S=()=>VB.state;
const toast=m=>{const t=$("#toast"),tm=$("#toastMsg");if(t&&tm){tm.textContent=m;$("#toastUndo")&&($("#toastUndo").hidden=true);t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,5000);}};
VB.v3={toast};

/* small event hub: runs after every save, debounced, so features can refresh their own views */
const hooks=[];VB.v3.onSave=f=>hooks.push(f);
const _save=VB.save;let saveT=0;VB.save=function(){_save.apply(this,arguments);clearTimeout(saveT);saveT=setTimeout(()=>hooks.forEach(f=>{try{f();}catch(e){console.error(e);}}),60);};
const routeHooks=[];VB.v3.onRoute=f=>routeHooks.push(f);
const view=()=>(location.hash||"#today").slice(1).split("/")[0]||"today";
window.addEventListener("hashchange",()=>routeHooks.forEach(f=>{try{f(view());}catch(e){console.error("v3 route hook",e&&e.stack);}}));

/* ================= navigation: Train is active for Skills, Programs and Body ================= */
function navState(v){document.querySelectorAll("#nav a[data-group]").forEach(a=>{if(a.dataset.group.split(" ").includes(v))a.setAttribute("aria-current","page");});}
VB.v3.onRoute(navState);setTimeout(()=>navState(view()),50);

/* ================= Programs: one panel at a time, with picks for this player first ================= */
let ptab="foryou";
function recommend(){const p=S().profile||{},out=[],add=(id,why)=>{if(!out.some(x=>x.id===id)){const d=VB.PREBUILT.find(x=>x.id===id);if(d)out.push({id,why,d});}};
  const pp=VB.PREBUILT.find(x=>x.position&&x.pos===p.pos);if(pp)add(pp.id,"Built for your position: four phases over 16 weeks.");
  const lim=p.limits||[],goals=p.goals||[];
  if(lim.includes("shoulder"))add("armor","You flagged your shoulder: rotator cuff and scapular control first.");
  if(lim.includes("knee")||lim.includes("ankle"))add("knees","You flagged your knee or ankle: tendon loading and landings.");
  const G={jump:["vert8","Your goal is to jump higher."],block:["vert8","Blocking higher starts with your vertical."],power:["power","Your goal is to hit harder."],serve:["power","A tougher serve comes from arm speed and core power."],
    pass:["defense","Your goal is cleaner passing."],defense:["defense","Your goal is faster defence."],endurance:["preseason","Your goal is to last five sets."],prevent:["knees","Your goal is to stay injury free."]};
  goals.forEach(g=>G[g]&&add(G[g][0],G[g][1]));
  if((p.mins||60)<=30||p.tier==="none")add("quick","Short on time or equipment: bodyweight sessions you can do anywhere.");
  if(VB.v3.inSeason&&VB.v3.inSeason())add("inseason","You have matches coming up: keep strength without heavy legs.");
  add("auto","Not sure? Let the plan balance everything for you.");
  return out.slice(0,4);}
function renderReco(){const host=$("#recoHost");if(!host)return;const cur=VB.activeProgram().def.id;
  host.innerHTML=recommend().map(r=>`<div class="pcard ${r.id===cur?"on":""}"><div class="stat">${esc(r.d.tag||"")}</div><h4>${esc(r.d.name.split(":")[0])}</h4><p class="small">${esc(r.d.desc||"")}</p><p class="small why"><b>Why:</b> ${esc(r.why)}</p>
    <div class="foot">${r.id===cur?`<span class="pill on">Active</span>`:`<button type="button" class="btn sm primary" data-start="${r.id}">Start this program</button>`}<button type="button" class="btn sm" data-ptab-go="${r.d.position?"position":"ready"}">More like this</button></div></div>`).join("");}
function setPtab(t){ptab=t;$$("[data-ptab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.ptab===t));$$(".ppanel").forEach(p=>p.hidden=p.dataset.panel!==t);if(t==="foryou")renderReco();}
document.addEventListener("click",e=>{const b=e.target.closest("[data-ptab],[data-ptab-go]");if(!b)return;setPtab(b.dataset.ptab||b.dataset.ptabGo);const tb=$(".ptabs");if(tb&&b.dataset.ptabGo)tb.scrollIntoView({behavior:"smooth",block:"start"});});
VB.v3.onRoute(v=>{if(v==="plan")setPtab(ptab);});VB.v3.onSave(()=>{if(view()==="plan")renderReco();});
/* editing a custom program (Edit button) opens the builder panel */
document.addEventListener("click",e=>{if(e.target.closest("[data-edit]"))setTimeout(()=>setPtab("build"),0);},true);

/* ================= Skills: the key point of each phase first, the rest on demand ================= */
document.addEventListener("click",e=>{const b=e.target.closest("[data-allcues]");if(!b)return;const box=b.closest(".phases"),open=box.dataset.open!=="true";box.dataset.open=open;b.setAttribute("aria-expanded",open);b.textContent=open?"Show only the key points":"Show all coaching points";});

/* ================= guided session: one item at a time, set counter, rest timer, screen kept awake ================= */
const REST={Prep:20,Skills:0,Power:90,Strength:75,"Arm care and core":45};
let G=null;
function gItems(){const t=VB.ensureToday();return t.plan.items;}
function gOpen(start){const items=gItems();if(!items.length)return;const t=VB.ensureToday();
  const first=start!=null?start:Math.max(0,items.findIndex(i=>!t.done[i.key]));
  G={i:first<0?0:first,set:0,phase:"work",t0:Date.now(),rest:0,timer:null,end:0,feel:"right",lock:null};
  let el=$("#gmode");if(!el){el=document.createElement("div");el.id="gmode";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","Guided session");document.body.appendChild(el);
    el.addEventListener("click",gClick);el.addEventListener("input",e=>{if(e.target.dataset.g==="load")G.load=e.target.value;if(e.target.dataset.g==="suc")G.suc=e.target.value;});}
  el.hidden=false;document.body.classList.add("gopen");wake(true);gRender();}
async function wake(on){try{if(on&&"wakeLock" in navigator){G.lock=await navigator.wakeLock.request("screen");}else if(!on&&G&&G.lock){await G.lock.release();G.lock=null;}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(G&&!document.hidden&&!$("#gmode").hidden)wake(true);});
function gClose(){if(!G)return;clearInterval(G.timer);wake(false);$("#gmode").hidden=true;document.body.classList.remove("gopen");G=null;window.dispatchEvent(new HashChangeEvent("hashchange"));}
function beep(){try{navigator.vibrate&&navigator.vibrate([180,80,180]);const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=gClose.ac||(gClose.ac=new A()),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.setValueAtTime(.18,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.35);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.36);}catch(e){}}
const fmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");};
function countdown(sec,phase,then){clearInterval(G.timer);G.phase=phase;G.end=Date.now()+sec*1000;G.total=sec;G.said=null;VB.v3.cue&&VB.v3.cue("start",{sec,phase});
  G.timer=setInterval(()=>{const left=(G.end-Date.now())/1000,el=$("#gclock");{const c=Math.ceil(left);if(c>0&&c<=3&&G.said!==c){G.said=c;VB.v3.cue&&VB.v3.cue("count",{n:c,phase:G.phase});}}if(el)el.textContent=fmt(left);const ring=$("#gring");if(ring)ring.style.setProperty("--p",Math.max(0,left/G.total));
    if(left<=0){clearInterval(G.timer);beep();VB.v3.cue&&VB.v3.cue("end",{phase:G.phase});then();}},250);gRender();}
function itemInfo(it){if(it.k==="ex"){const e=VB.exMap()[it.id];return {name:e?e.name:it.id,dose:it.sets+" × "+it.reps+(e&&e.unit==="s"?" s":e&&e.unit==="m"?" m":""),e,hold:e&&e.unit==="s",load:e&&e.loadable&&e.tier!=="none"};}
  const d=VB.drMap()[it.id];return {name:d?d.name:it.id,dose:d?d.minutes+" min · level "+d.level:"",d};}
function howFor(it){const src=document.querySelector(`#todayMain .item[data-key="${CSS.escape(it.key)}"] details`);return src?src.innerHTML.replace(/<summary>.*?<\/summary>/,""):"";}
function markDone(it){const t=VB.ensureToday();
  if(it.k==="ex")t.done[it.key]={sets:G.set,reps:it.reps,load:G.load!=null&&G.load!==""?VB.wIn(+G.load):(it.load!=null?it.load:null),feel:G.feel};
  else{const d=VB.drMap()[it.id],v=G.suc==null||G.suc===""?0:+G.suc;t.done[it.key]={suc:Math.min(v,d.score.attempts),att:d.score.attempts};}
  VB.save();}
function gNext(){const items=gItems();G.set=0;G.load=null;G.suc=null;G.feel="right";clearInterval(G.timer);G.phase="work";
  const t=VB.ensureToday(),n=items.findIndex((x,k)=>k>G.i&&!t.done[x.key]);G.i=n<0?items.length:n;gRender();}
function gRender(){const el=$("#gmode");if(!el||!G)return;const items=gItems(),t=VB.ensureToday();
  if(G.i>=items.length){const mins=Math.max(5,Math.round((Date.now()-G.t0)/60000)),nd=Object.keys(t.done).length;
    el.innerHTML=`<div class="gtop"><button type="button" class="gx" data-g="close" aria-label="Close">✕</button><span>Session complete</span><span></span></div>
     <div class="gbody"><div class="stat">${nd} of ${items.length} done · ${mins} min</div><h2>Nice work</h2><p>How hard was that overall?</p>
     <div class="rpe" role="group" aria-label="Effort from 1 to 10">${[...Array(10)].map((_,k)=>`<button type="button" data-g="rpe" data-v="${k+1}" aria-pressed="${(G.rpe||6)===k+1}">${k+1}</button>`).join("")}</div>
     <p class="small muted">1 is very easy, 10 is everything you had.</p>
     <label class="f">Jumps you did today (optional)<input type="number" id="gjumps" min="0" max="1000" inputmode="numeric" placeholder="Count every jump, including drills"></label>
     <label class="f">Notes<textarea id="gnotes" rows="2" placeholder="What clicked, what to fix"></textarea></label>
     <button type="button" class="btn primary gbig" data-g="save">Save session and adapt my plan</button>
     <button type="button" class="btn sm" data-g="close">Not yet, keep the session open</button></div>`;G.mins=mins;return;}
  const it=items[G.i],I=itemInfo(it),done=!!t.done[it.key],mo=I.e&&VB.exMotion&&VB.exMotion.has(I.e.id)?(VB.demo3d?VB.demo3d.block(I.e.id,200):VB.exMotion.html(I.e.id,"big",200)):"";
  const sets=it.sets||0,rest=REST[it.block]!=null?REST[it.block]:45,how=howFor(it);
  let ctl="";
  if(G.phase==="rest")ctl=`<div class="gring" id="gring" style="--p:1"><span class="stat">Rest</span><b id="gclock">${fmt(G.total)}</b><span class="small">Next: set ${G.set+1} of ${sets}</span></div>
      <div class="row gctl"><button type="button" class="btn" data-g="more">+15 s</button><button type="button" class="btn primary" data-g="skiprest">Skip rest</button></div>`;
  else if(G.phase==="hold"||G.phase==="drill")ctl=`<div class="gring" id="gring" style="--p:1"><span class="stat">${G.phase==="hold"?"Hold":"Drill"}</span><b id="gclock">${fmt(G.total)}</b><span class="small">${G.phase==="hold"?"Set "+(G.set+1)+" of "+sets:"Keep score as you go"}</span></div>
      <div class="row gctl"><button type="button" class="btn" data-g="stop">Stop early</button></div>`;
  else if(it.k==="ex"&&G.set<sets)ctl=`<div class="gsets" aria-label="Sets">${[...Array(sets)].map((_,k)=>`<i class="${k<G.set?"on":""}"></i>`).join("")}</div>
      ${I.load?`<label class="f gload">Load (${VB.wu()})<input type="number" min="0" step="0.5" data-g="load" value="${G.load!=null?G.load:it.load!=null?VB.wOut(it.load):""}" inputmode="decimal"></label>`:""}
      <button type="button" class="btn primary gbig" data-g="${I.hold?"hold":"set"}">${I.hold?"Start "+it.reps+" s hold · set "+(G.set+1):"Done set "+(G.set+1)+" of "+sets}</button>`;
  else if(it.k==="ex")ctl=`<p>How did ${esc(I.name)} feel?</p><div class="seg gfeel" role="group">${[["easy","Easy"],["right","Right"],["hard","Hard"]].map(([k,l])=>`<button type="button" data-g="feel" data-v="${k}">${l}</button>`).join("")}</div>
      <p class="small muted">Easy moves you up a step sooner. Hard keeps the next session at this level.</p>`;
  else{const d=I.d;ctl=`<p class="small">${esc(d.score.label)} · standard ${d.score.target} of ${d.score.attempts}</p>
      <button type="button" class="btn gbig" data-g="drill">Start ${d.minutes} min timer</button>
      <label class="f gload">Your score<span class="stepper"><button type="button" data-g="dec" aria-label="One less">−</button><input type="number" min="0" max="${d.score.attempts}" data-g="suc" value="${G.suc!=null?G.suc:""}" placeholder="0" inputmode="numeric"><button type="button" data-g="inc" aria-label="One more">+</button></span> / ${d.score.attempts}</label>
      <button type="button" class="btn primary gbig" data-g="score">Save score and continue</button>`;}
  el.innerHTML=`<div class="gtop"><button type="button" class="gx" data-g="close" aria-label="Close guided session">✕</button><span>${G.i+1} of ${items.length} · ${esc(it.block)}</span><span class="small" id="gel"></span></div>
    <div class="gprog"><i style="width:${(G.i/items.length)*100}%"></i></div>
    <div class="gbody"><div class="stat">${esc(it.why||"")}</div><h2>${esc(I.name)}</h2><div class="gdose">${esc(I.dose)}${done?" · done":""}</div>
      ${mo?`<div class="gmo">${mo}</div>`:""}${ctl}
      ${how?`<details class="ghow"><summary>How to do it</summary>${how}</details>`:""}
      <div class="row gnav"><button type="button" class="btn sm" data-g="prev" ${G.i===0?"disabled":""}>Back</button><button type="button" class="btn sm" data-g="skip">Skip this one</button></div></div>`;
  el.scrollTop=0;}
setInterval(()=>{const e=$("#gel");if(e&&G)e.textContent=fmt((Date.now()-G.t0)/1000);},1000);
function gClick(e){const b=e.target.closest("[data-g]");if(!b||!G)return;const g=b.dataset.g,items=gItems(),it=items[G.i];
  if(g==="close")return gClose();
  if(g==="prev"){clearInterval(G.timer);G.i=Math.max(0,G.i-1);G.set=0;G.phase="work";return gRender();}
  if(g==="skip")return gNext();
  if(g==="set"){G.set++;const sets=it.sets||0,rest=REST[it.block]!=null?REST[it.block]:45;if(G.set<sets&&rest>0)return countdown(rest,"rest",()=>{G.phase="work";gRender();});return gRender();}
  if(g==="hold")return countdown(it.reps,"hold",()=>{G.set++;const sets=it.sets||0,rest=REST[it.block]!=null?REST[it.block]:45;if(G.set<sets&&rest>0)countdown(rest,"rest",()=>{G.phase="work";gRender();});else{G.phase="work";gRender();}});
  if(g==="stop"){clearInterval(G.timer);if(G.phase==="hold")G.set++;G.phase="work";return gRender();}
  if(g==="more"){G.end+=15000;G.total+=15;return;}
  if(g==="skiprest"){clearInterval(G.timer);G.phase="work";return gRender();}
  if(g==="feel"){G.feel=b.dataset.v;markDone(it);return gNext();}
  if(g==="drill"){const d=VB.drMap()[it.id];return countdown(d.minutes*60,"drill",()=>{G.phase="work";gRender();});}
  if(g==="inc"||g==="dec"){const inp=$("[data-g=suc]",$("#gmode")),d=VB.drMap()[it.id],v=Math.max(0,Math.min(d.score.attempts,(+inp.value||0)+(g==="inc"?1:-1)));inp.value=v;G.suc=v;return;}
  if(g==="score"){markDone(it);return gNext();}
  if(g==="rpe"){G.rpe=+b.dataset.v;$$("[data-g=rpe]",$("#gmode")).forEach(x=>x.setAttribute("aria-pressed",x===b));return;}
  if(g==="save"){const j=$("#gjumps").value,n=$("#gnotes").value;G.jumps=j;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    setTimeout(()=>{const f=$("#finForm");if(!f){gClose();return;}$("#fin-mins").value=G.mins;$("#fin-rpe").value=G.rpe||6;$("#fin-notes").value=n;const jf=$("#fin-jumps");if(jf)jf.value=j;
      const mins=G.mins;gClose();f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event("submit",{cancelable:true}));
      if(VB.v3.install&&S().sessions.filter(s=>!s.ex).length===1)setTimeout(()=>{if(VB.v3.install())0;},1500);},120);}}
VB.v3.guided=gOpen;VB.v3.gState=()=>G;VB.v3.gItems=()=>gItems();VB.v3.gInfo=it=>itemInfo(it);VB.v3.gRender=()=>gRender();
/* entry points: the hero button and a button at the top of the session list */
document.addEventListener("click",e=>{const a=e.target.closest("#heroGo,[data-guided]");if(!a)return;e.preventDefault();gOpen();},true);
function guidedButton(){const m=$("#todayMain");if(!m||$("#gStart",m))return;const b=document.createElement("div");b.className="card gstartcard";b.id="gStart";
  b.innerHTML=`<div><div class="kicker">Guided mode</div><p class="small muted">One exercise at a time with a set counter, rest timer and the screen kept awake.</p></div><button type="button" class="btn primary" data-guided>Start guided session</button>`;m.insertBefore(b,m.firstChild);}
new MutationObserver(()=>guidedButton()).observe(document.body,{childList:true,subtree:true});

/* ================= season calendar, tapering, soreness, jump load, milestones ================= */
const season=()=>{const s=S();if(!s.season)s.season={events:[]};return s.season;};
const sore=()=>{const s=S();if(!s.soreness)s.soreness={};return s.soreness;};
const KINDS={match:"Match",tournament:"Tournament",tryout:"Tryout",practice:"Team practice",other:"Other"};
const TAPER=new Set(["match","tournament","tryout"]);   // only these change the training plan around them
const endOf=e=>e.end&&e.end>e.date?e.end:e.date;        // tournaments can run over several days
const byWhen=(a,b)=>(a.date+(a.time||""))<(b.date+(b.time||""))?-1:(a.date+(a.time||""))>(b.date+(b.time||""))?1:0;
const games=()=>season().events.filter(e=>TAPER.has(e.kind||"match"));
const gameOn=ds=>games().filter(e=>e.date<=ds&&endOf(e)>=ds).sort(byWhen)[0]||null;
function upcoming(){const t=VB.today();return season().events.filter(e=>endOf(e)>=t).sort(byWhen);}
function daysTo(){const t=VB.today(),g=games().filter(e=>endOf(e)>=t).sort(byWhen)[0];return g?{d:Math.max(0,VB.daysBetween(t,g.date)),e:g}:null;}
function daysSince(){const t=VB.today(),past=games().map(endOf).filter(d=>d<t).sort().pop();return past?VB.daysBetween(past,t):null;}
/* training days: the days picked in Training reminders, or a sensible spread of the profile's days per week */
const SPREAD={1:[3],2:[2,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6],6:[1,2,3,4,5,6],7:[0,1,2,3,4,5,6]};
function trainDays(){const r=S().reminder;if(r&&(r.custom||r.on||(r.days&&r.days.join()!=="1,3,5")))return r.days.slice();const n=clampN((S().profile||{}).days||3,1,7);return SPREAD[n];}
const clampN=(v,a,b)=>Math.max(a,Math.min(b,Math.round(v)));
/* what a day holds for the plan: game, light day before, recovery day after, training day or rest */
function planFor(ds){const g=gameOn(ds);if(g)return {k:"game",label:(KINDS[g.kind]||"Match")+" day",note:"Activation and arm care only before you play.",e:g};
  const nx=games().filter(e=>e.date>ds).sort(byWhen)[0],dn=nx?VB.daysBetween(ds,nx.date):null,pe=games().map(endOf).filter(d=>d<ds).sort().pop(),dp=pe?VB.daysBetween(pe,ds):null;
  const dow=new Date(ds+"T12:00:00").getDay(),planned=trainDays().includes(dow),pr=season().events.find(e=>e.kind==="practice"&&e.date<=ds&&endOf(e)>=ds);
  if(dn===1)return {k:"light",label:"Light",note:"Game tomorrow: short and sharp, no heavy lifting."};
  if(dp===1)return {k:"recovery",label:"Recovery",note:"The day after a game: mobility, arm care and light skills."};
  if(pr)return {k:"practice",label:"Team practice",note:"Counts as a training day.",e:pr};
  if(planned)return {k:"train",label:"Training",note:dn===2?"Game in two days: strength volume trimmed a little.":"Full session."};
  return {k:"rest",label:"Rest",note:"Rest day. A walk or mobility is fine."};}
/* calendar files (.ics): escaped text, folded lines, local times */
const icsEsc=x=>String(x==null?"":x).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
const icsFold=l=>{let out="",s=l;while(s.length>73){out+=s.slice(0,73)+"\r\n ";s=s.slice(73);}return out+s;};
const icsDT=(ds,tm)=>ds.replace(/-/g,"")+(tm?"T"+tm.replace(":","")+"00":"");
const icsStamp=()=>{const n=new Date(),p=x=>String(x).padStart(2,"0");return n.getUTCFullYear()+p(n.getUTCMonth()+1)+p(n.getUTCDate())+"T"+p(n.getUTCHours())+p(n.getUTCMinutes())+p(n.getUTCSeconds())+"Z";};
function icsEvent(e){const kind=KINDS[e.kind]||"Match",L=["BEGIN:VEVENT","UID:"+e.id+"@volleyball-training-journey","DTSTAMP:"+icsStamp()];
  if(e.time){const [h,m]=e.time.split(":").map(Number),mins=h*60+m+(e.dur||120),dd=Math.floor(mins/1440),et=String(Math.floor(mins%1440/60)).padStart(2,"0")+":"+String(mins%60).padStart(2,"0");
    L.push("DTSTART:"+icsDT(e.date,e.time),"DTEND:"+icsDT(VB.addDays(endOf(e),dd),et));}
  else L.push("DTSTART;VALUE=DATE:"+icsDT(e.date),"DTEND;VALUE=DATE:"+icsDT(VB.addDays(endOf(e),1)));
  L.push("SUMMARY:"+icsEsc(kind+(e.name?": "+e.name:"")));if(e.place)L.push("LOCATION:"+icsEsc(e.place));
  L.push("DESCRIPTION:"+icsEsc((e.note?e.note+"\n":"")+(TAPER.has(e.kind||"match")?"The day before: sleep, hydrate, light session only.":"")));
  if(TAPER.has(e.kind||"match"))L.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+icsEsc(kind+" tomorrow"),e.time?"TRIGGER:-P1D":"TRIGGER:-PT6H","END:VALARM");
  L.push("END:VEVENT");return L;}
function icsDoc(lines){return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Volleyball Training Journey//EN","CALSCALE:GREGORIAN",...lines,"END:VCALENDAR"].map(icsFold).join("\r\n")+"\r\n";}
VB.cal={KINDS,TAPER,endOf,byWhen,events:()=>season().events,games,gameOn,upcoming,daysTo,daysSince,trainDays,planFor,icsEvent,icsDoc,icsEsc,
  save(){VB.invalidatePlan();VB.save();},download:(n,t)=>download(n,t,"text/calendar")};
VB.v3.inSeason=()=>{const n=daysTo();return !!(n&&n.d<=21);};
const REGIONS=[["shoulder","Shoulder"],["upperback","Upper back"],["lowerback","Lower back"],["hip","Hips"],["quad","Front of thigh"],["ham","Back of thigh"],["knee","Knee"],["achilles","Calf or Achilles"],["ankle","Ankle"],["wrist","Wrist or fingers"]];
const LEVELS=["None","A little","Sore","Painful"];
function soreToday(){const t=VB.today(),y=VB.addDays(t,-1),m=sore();return m[t]||m[y]||{};}
/* plan adjustments: around matches, and around soreness */
const _build=VB.buildSession;
VB.buildSession=function(feel){const plan=_build.apply(this,arguments);try{adjust(plan);}catch(e){console.error(e);}return plan;};
function adjust(plan){const n=daysTo(),since=daysSince(),sr=soreToday(),drop=new Set(),notes=[];
  const isJumpDrill=i=>i.k==="drill"&&["attack","block"].includes(i.skill),isHitDrill=i=>i.k==="drill"&&["attack","serve"].includes(i.skill);
  if(n&&n.d===0){plan.items.forEach(i=>{if(!["Prep","Arm care and core"].includes(i.block))drop.add(i.key);});notes.push(`${KINDS[n.e.kind]||"Match"} day: activation and arm care only, so your legs are fresh for the game.`);}
  else if(n&&n.d===1){plan.items.forEach(i=>{if(i.block==="Strength")drop.add(i.key);});let pw=0;plan.items.forEach(i=>{if(i.block==="Power"){if(pw++>=1)drop.add(i.key);else i.sets=Math.min(i.sets||2,2);}});notes.push(`${KINDS[n.e.kind]||"Match"} tomorrow: short and sharp. No heavy lifting, one power exercise, skills at game speed.`);}
  else if(n&&n.d===2){plan.items.forEach(i=>{if(i.block==="Strength"&&i.sets>2)i.sets--;});notes.push(`${KINDS[n.e.kind]||"Match"} in two days: strength volume trimmed a little.`);}
  if(since===1&&!(n&&n.d<=1)){plan.items.forEach(i=>{if(["Power","Strength"].includes(i.block))drop.add(i.key);});notes.push("The day after a game: recovery work only. Mobility, arm care and light skills.");}
  const legs=Math.max(sr.knee||0,sr.achilles||0,sr.ankle||0),sh=Math.max(sr.shoulder||0,sr.wrist||0),back=sr.lowerback||0;
  if(legs>=2){plan.items.forEach(i=>{if(i.block==="Power"||isJumpDrill(i))drop.add(i.key);});notes.push("Sore knee, calf or ankle: no jumping today. Tendons need 48 hours after a hard jump day.");}
  if(sh>=2){plan.items.forEach(i=>{if(isHitDrill(i))drop.add(i.key);});notes.push("Sore shoulder or wrist: no hitting or serving today. Arm care stays in.");}
  if(back>=2){plan.items.forEach(i=>{if(i.block==="Strength"&&i.load!=null)drop.add(i.key);});notes.push("Sore lower back: no loaded lifts today.");}
  if(Math.max(legs,sh,back,...Object.values(sr))>=3)notes.push("Painful, sharp or getting worse? Rest it and see a physiotherapist or doctor.");
  if(!drop.size&&!notes.length)return;
  plan.items=plan.items.filter(i=>!drop.has(i.key));plan.notes=[...notes,...(plan.notes||[])];plan.est=plan.items.reduce((a,i)=>a+(i.min||0),0)+5;}
/* soreness check-in on Today */
function soreCard(){const side=$("#todaySide");if(!side||$("#soreCard",side))return;const c=document.createElement("div");c.className="card";c.id="soreCard";side.insertBefore(c,side.firstChild);renderSore();}
function renderSore(){const c=$("#soreCard");if(!c)return;const m=sore()[VB.today()]||{},n=daysTo();
  c.innerHTML=`${n?`<div class="nextev"><span class="stat">Next ${esc((KINDS[n.e.kind]||"match").toLowerCase())}</span><b>${n.d===0?"Today":n.d===1?"Tomorrow":"In "+n.d+" days"}</b><span class="small">${esc(n.e.name||"")} · ${VB.shortDate(n.e.date)}</span></div>`:""}
    <div class="kicker">Anything sore today?</div><p class="small muted">Tap to change: none, a little, sore, painful. The session adjusts.</p>
    <div class="sorechips">${REGIONS.map(([k,l])=>`<button type="button" class="sorechip" data-sore="${k}" data-l="${m[k]||0}" aria-label="${l}: ${LEVELS[m[k]||0]}">${l}<i>${LEVELS[m[k]||0]}</i></button>`).join("")}</div>`;}
document.addEventListener("click",e=>{const b=e.target.closest("[data-sore]");if(!b)return;const t=VB.today(),m=sore();m[t]=m[t]||{};const k=b.dataset.sore,v=((m[t][k]||0)+1)%4;
  if(v)m[t][k]=v;else delete m[t][k];VB.invalidatePlan();VB.save();renderSore();window.dispatchEvent(new HashChangeEvent("hashchange"));});
/* jumps: counted on the finish form (pre-filled with an estimate), stored on the session */
function jumpEstimate(){const t=S().today;if(!t)return 0;let n=0;t.plan.items.forEach(i=>{const d=t.done[i.key];if(!d)return;if(i.k==="ex"&&i.block==="Power")n+=(d.sets||0)*(d.reps||0);
  if(i.k==="drill"&&["attack","block"].includes(i.skill))n+=Math.round((i.min||6)*3);if(i.k==="drill"&&i.skill==="serve")n+=Math.round((i.min||6)*1.5);});return n;}
function jumpField(){const f=$("#finForm");if(!f||$("#fin-jumps",f))return;const g=$(".grid",f);if(!g)return;const l=document.createElement("label");l.className="f";
  l.innerHTML=`<span>Jumps today</span><input id="fin-jumps" type="number" min="0" max="1500" inputmode="numeric" placeholder="Estimate">`;g.appendChild(l);}
document.addEventListener("focusin",e=>{if(e.target.id==="fin-jumps"&&e.target.value===""){const v=jumpEstimate();if(v)e.target.placeholder="About "+v;}});
const _finish=VB.finishSession;VB.finishSession=function(o){const j=$("#fin-jumps"),val=j&&j.value!==""?Math.max(0,Math.round(+j.value)):jumpEstimate();const r=_finish.apply(this,arguments);
  const ss=S().sessions,last=ss[ss.length-1];if(last&&last.date===VB.today()&&last.jumps==null){last.jumps=val;VB.save();}return r;};
function jumpWeeks(){const m={};S().sessions.forEach(s=>{if(s.jumps==null)return;const w=VB.weekStart(s.date);m[w]=(m[w]||0)+s.jumps;});return m;}
function renderJumps(){const c=$("#jumpCard");if(!c)return;const m=jumpWeeks(),t=VB.today();let wk=VB.weekStart(t);const rows=[];for(let i=7;i>=0;i--){const k=VB.addDays(wk,-7*i);rows.push([k,m[k]||0]);}
  let a=0,c28=0;S().sessions.forEach(s=>{if(s.jumps==null)return;const d=VB.daysBetween(s.date,t);if(d>=0&&d<7)a+=s.jumps;if(d>=0&&d<28)c28+=s.jumps;});const firstJ=S().sessions.filter(s=>s.jumps!=null).reduce((m,s)=>s.date<m?s.date:m,t),hist=VB.daysBetween(firstJ,t)>=21,ratio=c28&&hist?a/(c28/4):null,max=Math.max(1,...rows.map(r=>r[1]));
  c.innerHTML=`<div class="kicker">Jump load</div><h3>${a}<small> jumps in 7 days</small></h3>
   <div class="jbars">${rows.map(([k,v])=>`<div><i style="height:${Math.round(v/max*100)}%"></i><span title="Week of ${esc(VB.shortDate(k))}">${+k.slice(8)}</span></div>`).join("")}</div>
   <p class="small ${ratio>1.3?"warn":"muted"}">${c28&&!hist?"Keep logging jumps. After three weeks the plan compares each week with your average and warns you about sudden jumps in volume.":!c28?"Count your jumps when you finish a session and they show up here. Too many jumps too soon is the main cause of jumper's knee.":ratio>1.3?`This week is ${Math.round(ratio*100)}% of your 4-week average. Jump volume rising faster than 30% a week raises the risk of knee and Achilles pain, so the plan will ease off.`:"Steady. Keep weekly jumps within about 30% of your recent average."}</p>`;}
/* season calendar */
function renderSeason(){if(VB.calUI){VB.calUI.render();return;}const c=$("#seasonCard");if(!c)return;const up=upcoming();
  c.innerHTML=`<div class="kicker">Season calendar</div><p class="small muted">Add your games. The plan goes lighter the day before, keeps match day to activation, and makes the day after a recovery day.</p>
   <div class="evlist">${up.length?up.slice(0,6).map(e=>`<div class="ev"><b>${VB.shortDate(e.date)}</b><span>${esc(KINDS[e.kind]||"Match")}${e.name?" · "+esc(e.name):""}</span><button type="button" class="btn sm" data-evdel="${e.id}" aria-label="Remove">✕</button></div>`).join(""):`<p class="small">No games yet.</p>`}</div>
   <form class="grid evform" id="evForm" novalidate><label class="f">Date<input type="date" id="ev-date" required min="${VB.today()}"></label><label class="f">Type<select id="ev-kind"><option value="match">Match</option><option value="tournament">Tournament</option><option value="tryout">Tryout</option></select></label>
   <label class="f">Name or opponent<input id="ev-name" maxlength="40" placeholder="Optional"></label><div class="row"><button class="btn sm primary" type="submit">Add</button>${up.length?`<button class="btn sm" type="button" id="evIcs">Add all to my calendar</button>`:""}</div></form>`;}
document.addEventListener("submit",e=>{if(e.target.id!=="evForm")return;e.preventDefault();const d=$("#ev-date").value;if(!d)return toast("Pick a date first.");
  season().events.push({id:VB.uid(),date:d,kind:$("#ev-kind").value,name:$("#ev-name").value.trim()});VB.invalidatePlan();VB.save();renderSeason();toast("Added. Your sessions around it are adjusted.");});
document.addEventListener("click",e=>{const b=e.target.closest("[data-evdel],#evIcs");if(!b)return;
  if(b.dataset.evdel){season().events=season().events.filter(x=>x.id!==b.dataset.evdel);VB.invalidatePlan();VB.save();renderSeason();return;}
  download("volleyball-season.ics",icsDoc(upcoming().flatMap(icsEvent)),"text/calendar");});
/* milestones */
const BADGES=[["s1","First session","Logged your first session",s=>s.n>=1],["s10","Ten down","10 sessions",s=>s.n>=10],["s25","Regular","25 sessions",s=>s.n>=25],["s50","Committed","50 sessions",s=>s.n>=50],["s100","Century","100 sessions",s=>s.n>=100],
  ["w2","On a roll","2-week streak",s=>s.streak>=2],["w4","Month strong","4-week streak",s=>s.streak>=4],["w8","Habit","8-week streak",s=>s.streak>=8],["w12","Season ready","12-week streak",s=>s.streak>=12],
  ["t1","Baseline","First jump test",s=>s.tests>=1],["j5","Higher","+5 cm on your first jump",s=>s.gain>=5],["j10","Flying","+10 cm on your first jump",s=>s.gain>=10],
  ["f1","On film","First clip analysed",s=>s.film>=1],["fx","Fixed it","First technique fault fixed",s=>s.fixed>=1],["lv","Level up","A drill moved up a level",s=>s.lvl>=2],
  ["p1","Finisher","Finished a program",s=>s.finished],["g1","Game face","Added a game to your season",s=>s.events>=1],["jl","Thousand","1,000 jumps logged",s=>s.jumps>=1000]];
function bstats(){const st=S(),T=st.tests.filter(t=>t.kind==="vert"&&!t.ex).sort((a,b)=>a.date<b.date?-1:1),lv=Object.values(st.drill||{}).map(v=>v&&v.lvl||1);
  return {n:st.sessions.filter(s=>!s.ex).length,streak:VB.streak(),tests:T.length,gain:T.length>1?Math.max(...T.map(t=>t.cm))-T[0].cm:0,film:(st.film||[]).length,fixed:Object.values(st.faults||{}).filter(f=>f&&!f.open).length,
    lvl:lv.length?Math.max(...lv):1,finished:!!(VB.activeProgram()||{}).finished,events:season().events.length,jumps:st.sessions.reduce((a,s)=>a+(s.jumps||0),0)};}
function checkBadges(quiet){const st=S();if(!st.badges)st.badges={};const s=bstats(),fresh=[];BADGES.forEach(([id,name,,ok])=>{if(!st.badges[id]&&ok(s)){st.badges[id]=VB.today();fresh.push(name);}});
  if(fresh.length&&!quiet)toast("Milestone: "+fresh.join(", ")+"!");return fresh.length;}
function renderBadges(){const c=$("#badgeCard");if(!c)return;const got=S().badges||{};const n=Object.keys(got).length;
  c.innerHTML=`<div class="kicker">Milestones</div><h3>${n}<small> of ${BADGES.length}</small></h3><div class="badges">${BADGES.map(([id,name,desc])=>`<div class="badge ${got[id]?"on":""}" data-b="${id}" title="${esc(desc)}"><b>${esc(name)}</b><span>${esc(desc)}</span></div>`).join("")}</div>`;}
let badgeInit=false;VB.v3.onSave(()=>{if(!S().profile)return;const quiet=!badgeInit;badgeInit=true;if(checkBadges(quiet))_save.call(VB);if(view()==="progress"){renderBadges();renderJumps();}renderSore();});
VB.v3.onRoute(v=>{if(v==="progress"){checkBadges(true);renderSeason();renderJumps();renderBadges();}});
new MutationObserver(()=>{soreCard();jumpField();}).observe(document.body,{childList:true,subtree:true});
/* the 2-minute jump test in onboarding */
document.addEventListener("input",e=>{if(e.target.id!=="p-touch"&&e.target.id!=="p-reach")return;const r=+$("#p-reach").value,t=+$("#p-touch").value,o=$("#touchOut");if(!o)return;
  if(r&&t&&t>r){const j=Math.round((t-r)*2)/2;$("#p-jump").value=j;o.textContent="Your vertical jump: "+j+" "+VB.lu()+". It is filled in above.";}else o.textContent=t&&r?"The jump touch should be higher than your standing reach.":"";});
setTimeout(()=>{if(view()==="progress"){renderSeason();renderJumps();renderBadges();}},100);

/* ================= coach tools: assignments for a team, completion and training at a glance ================= */
let cSel=null,cOpen=false;
function sq(){return VB.squad&&VB.squad.data?VB.squad.data():null;}
const DRL=()=>window.VB_DRILLS||[];
function myCoachTeams(d){return d.teams.filter(x=>x.owner===d.uid);}
function assignmentsForMe(d){const out=[];d.teams.forEach(x=>{if(x.owner===d.uid)return;(x.t.assign||[]).forEach(a=>out.push({a,team:x.t,owner:x.owner}));});return out.sort((p,q)=>p.a.due<q.a.due?-1:1);}
const aKey=(owner,a)=>owner+":"+a.id;
/* weekly team summary at the top of coach tools */
function teamSummary(d,T,mem){if(!mem.length)return "";const st=mem.map(id=>((d.players[id]||{}).stats)||{}),act=st.filter(s=>(s.sess28||0)>0).length,
    avg=st.reduce((t,s)=>t+(s.sess28||0),0)/mem.length/4,streak=st.filter(s=>(s.streak||0)>=2).length,A=(T.assign||[]).filter(a=>a.due>=VB.addDays(VB.today(),-7));
  let done=0,tot=0;A.forEach(a=>mem.forEach(id=>{tot++;if(((d.players[id]||{}).adone||{})[aKey(d.uid,a)])done++;}));
  const quiet=mem.filter((id,i)=>!(st[i].sess28>0)).map(id=>d.nameOf(id));
  return `<div class="tsum"><div><b>${act}/${mem.length}</b><span>trained in the last 4 weeks</span></div><div><b>${avg.toFixed(1)}</b><span>sessions a week, per player</span></div>
    <div><b>${streak}</b><span>on a 2+ week streak</span></div><div><b>${tot?Math.round(done/tot*100)+"%":"–"}</b><span>of this week's assignments done</span></div></div>
    ${quiet.length?`<p class="small muted">Not training lately: ${quiet.slice(0,5).map(esc).join(", ")}${quiet.length>5?" and "+(quiet.length-5)+" more":""}. A short message often helps.</p>`:""}`;}
function renderCoach(){const host=$("#coachHost");if(!host)return;const d=sq();if(!d||d.status!=="on"||!d.joined){host.innerHTML="";return;}
  const mine=myCoachTeams(d),todo=assignmentsForMe(d),done=d.soc.adone||{};let html="";
  if(todo.length){html+=`<div class="card coachin"><div class="kicker">From your coach</div>${todo.slice(0,6).map(({a,team,owner})=>{const k=aKey(owner,a),ok=!!done[k];
      return `<div class="asg ${ok?"ok":""}"><div><b>${esc(a.title)}</b><span class="small muted">${esc(team.name||"Team")} · due ${VB.shortDate(a.due)}</span>${a.note?`<p class="small">${esc(a.note)}</p>`:""}
        ${(a.drills||[]).length?`<p class="small">Drills: ${a.drills.map(id=>{const r=DRL().find(x=>x.id===id);return r?esc(r.name):"";}).filter(Boolean).join(" · ")}</p>`:""}</div>
        <button type="button" class="btn sm ${ok?"":"primary"}" data-adone="${esc(k)}">${ok?"Done ✓":"Mark done"}</button></div>`;}).join("")}</div>`;}
  if(mine.length){if(!cSel||!mine.some(x=>x.t.id===cSel))cSel=mine[0].t.id;const T=mine.find(x=>x.t.id===cSel).t,mem=d.membersOf(T).filter(id=>id!==d.uid);
    const rows=mem.map(id=>{const c=d.players[id]||{},s=c.stats||{},ad=c.adone||{},last=(T.assign||[]).slice(-3);
      return `<tr><td><b>${esc(d.nameOf(id))}</b><span class="small muted">${esc((VB.POS[c.pos]||VB.POS.any).label)}</span></td><td>${s.sess28!=null?s.sess28:"–"}</td><td>${s.streak!=null?s.streak:"–"}</td><td>${s.vert!=null?Math.round(VB.lenOut(s.vert))+" "+VB.lu():"–"}</td>
        <td>${last.map(a=>`<span class="adot ${ad[aKey(d.uid,a)]?"on":""}" title="${esc(a.title)}"></span>`).join("")||"–"}</td>${VB.readyCells?VB.readyCells(c):""}</tr>`;}).join("");
    html+=`<div class="card coach"><div class="row" style="justify-content:space-between"><div><div class="kicker">Coach tools</div><h3>${esc(T.name||"Team")}</h3></div>
      ${mine.length>1?`<select id="coachTeam" class="btn sm" aria-label="Team">${mine.map(x=>`<option value="${esc(x.t.id)}" ${x.t.id===cSel?"selected":""}>${esc(x.t.name||"Team")}</option>`).join("")}</select>`:""}</div>
      ${teamSummary(d,T,mem)}
      <label class="small"><input type="checkbox" id="coachRole" ${T.coach?"checked":""}> I coach this team${T.coach?"":" (tick to stay off the lineup)"}</label>
      ${mem.length?`<div class="tblwrap"><table class="ctbl"><thead><tr><th>Player</th><th>Sessions 28 d</th><th>Streak</th><th>Vertical</th><th>Last 3 assignments</th>${VB.readyCells?"<th>Readiness today</th><th>Load</th><th>Swings 7 d</th>":""}</tr></thead><tbody>${rows}</tbody></table></div>`:`<p class="small muted">Add players to this team in the Teams tab below to see their training here.</p>`}
      ${VB.readyCells?`<p class="small muted">Readiness, load and swings show only for players who turned on "Share readiness with my coaches" in Squad.</p>`:""}${VB.teamStatsHTML?VB.teamStatsHTML(d.uid+":"+T.id,[d.uid,...mem],d):""}
      <div class="asglist">${(T.assign||[]).slice().reverse().slice(0,5).map(a=>{const n=mem.filter(id=>((d.players[id]||{}).adone||{})[aKey(d.uid,a)]).length;return `<div class="asg"><div><b>${esc(a.title)}</b><span class="small muted">due ${VB.shortDate(a.due)} · ${n} of ${mem.length} done</span></div><button type="button" class="btn sm" data-adel="${esc(a.id)}" aria-label="Remove assignment">✕</button></div>`;}).join("")}</div>
      <button type="button" class="btn sm primary" id="coachNew" aria-expanded="${cOpen}">${cOpen?"Cancel":"Assign a session"}</button>
      ${cOpen?`<form class="grid cform" id="coachForm" novalidate><label class="f">Title<input id="ca-title" maxlength="60" required placeholder="Serve receive homework"></label><label class="f">Due<input id="ca-due" type="date" value="${VB.addDays(VB.today(),3)}" min="${VB.today()}"></label>
        <label class="f">Drills (up to 4)<select id="ca-drills" multiple size="6">${DRL().slice().sort((p,q)=>p.skill<q.skill?-1:p.skill>q.skill?1:p.level-q.level).map(r=>`<option value="${esc(r.id)}">${esc((VB.SKILLS[r.skill]||r.skill)+": "+r.name+" · L"+r.level)}</option>`).join("")}</select></label>
        <label class="f">Note<textarea id="ca-note" rows="2" maxlength="300" placeholder="What to focus on"></textarea></label><div class="row"><button class="btn sm primary" type="submit">Send to the team</button></div></form>`:""}</div>`;}
  if(VB.memberTeamStats)html+=VB.memberTeamStats(d);
  host.innerHTML=html;}
document.addEventListener("click",e=>{const b=e.target.closest("[data-adone],[data-adel],#coachNew");if(!b)return;const d=sq();if(!d)return;
  if(b.id==="coachNew"){cOpen=!cOpen;return renderCoach();}
  if(b.dataset.adone){const o=d.soc;o.adone=o.adone||{};if(o.adone[b.dataset.adone])delete o.adone[b.dataset.adone];else o.adone[b.dataset.adone]=VB.today();VB.squad.commit(o.adone[b.dataset.adone]?"Marked done. Your coach can see it.":"");renderCoach();renderCoachToday();return;}
  if(b.dataset.adel){const T=d.soc.teams.find(t=>t.id===cSel);if(T){T.assign=(T.assign||[]).filter(a=>a.id!==b.dataset.adel);VB.squad.commit("Assignment removed.");renderCoach();}}});
document.addEventListener("change",e=>{if(e.target.id==="coachTeam"){cSel=e.target.value;renderCoach();}
  if(e.target.id==="coachRole"){const d=sq(),T=d&&d.soc.teams.find(t=>t.id===cSel);if(T){T.coach=e.target.checked;
    if(T.coach&&T.slots)Object.keys(T.slots).forEach(k=>{if(T.slots[k]===d.uid)delete T.slots[k];});T.subs=(T.subs||[]).filter(x=>x!==d.uid);VB.squad.commit(T.coach?"You are the coach: you are off the lineup.":"");renderCoach();}}});
document.addEventListener("submit",e=>{if(e.target.id!=="coachForm")return;e.preventDefault();const d=sq(),T=d&&d.soc.teams.find(t=>t.id===cSel);if(!T)return;const title=$("#ca-title").value.trim();if(!title){toast("Give the assignment a title.");return;}
  const drills=Array.from($("#ca-drills").selectedOptions).map(o=>o.value).slice(0,4);T.assign=(T.assign||[]).concat([{id:VB.uid(),title,due:$("#ca-due").value||VB.addDays(VB.today(),3),drills,note:$("#ca-note").value.trim().slice(0,300),at:Date.now()}]).slice(-20);
  cOpen=false;VB.squad.commit("Sent to "+(T.name||"the team")+".");renderCoach();});
/* players see open assignments on Today too */
function renderCoachToday(){const side=$("#todaySide");if(!side)return;let c=$("#coachToday",side);const d=sq();const open=d&&d.status==="on"?assignmentsForMe(d).filter(({a,owner})=>!(d.soc.adone||{})[aKey(owner,a)]):[];
  if(!open.length){if(c)c.remove();return;}if(!c){c=document.createElement("div");c.className="card coachin";c.id="coachToday";side.insertBefore(c,side.firstChild);}
  c.innerHTML=`<div class="kicker">From your coach</div>${open.slice(0,3).map(({a})=>`<p><b>${esc(a.title)}</b><br><span class="small muted">Due ${VB.shortDate(a.due)}</span></p>`).join("")}<a class="btn sm" href="#squad">Open in Squad</a>`;}
new MutationObserver(()=>{if(view()==="squad"&&$("#squadRoot")&&!$("#coachHost").dataset.t){$("#coachHost").dataset.t=1;setTimeout(()=>{delete $("#coachHost").dataset.t;renderCoach();},200);}}).observe(document.getElementById("squadRoot")||document.body,{childList:true});
VB.v3.onRoute(v=>{if(v==="squad")renderCoach();if(v==="today")setTimeout(renderCoachToday,100);});

/* ================= Film: your movement next to the 3D reference, synced phase to phase ================= */
const FCLIP={spike:"spike",serve:"serve",set:"set",block:"block",pass:"dig"};
let FC=null;
function angle(a,b,c){const v1=[a[0]-b[0],a[1]-b[1]],v2=[c[0]-b[0],c[1]-b[1]],m=Math.hypot(...v1)*Math.hypot(...v2);return m?Math.acos(Math.max(-1,Math.min(1,(v1[0]*v2[0]+v1[1]*v2[1])/m)))*180/Math.PI:null;}
function anglesOf(J){/* J in a y-up side view: hip, knee, ankle, shoulder, elbow, wrist */const o={};
  if(J.hip&&J.knee&&J.ankle)o.knee=angle(J.hip,J.knee,J.ankle);if(J.shoulder&&J.hip&&J.knee)o.hip=angle(J.shoulder,J.hip,J.knee);
  if(J.shoulder&&J.hip)o.trunk=Math.abs(Math.atan2(J.shoulder[0]-J.hip[0],J.shoulder[1]-J.hip[1])*180/Math.PI);
  if(J.hip&&J.shoulder&&J.elbow)o.shoulder=angle(J.hip,J.shoulder,J.elbow);if(J.shoulder&&J.elbow&&J.wrist)o.elbow=angle(J.shoulder,J.elbow,J.wrist);return o;}
const ANG=[["knee","Knee"],["hip","Hip"],["trunk","Trunk lean"],["shoulder","Arm raise"],["elbow","Elbow"]];
function userJ(d,i){const p=d.P[i]||{},f=d.facing<0?-1:1,o={};["hip","knee","ankle","shoulder","elbow","wrist","head","toe"].forEach(k=>{if(p[k])o[k]=[p[k][0]*f,-p[k][1]];});return o;}
function refJ(pl,t){const A=VB.Athlete,W=A.fk(A.pose(pl.clip,t,pl.a.lefty),pl.a.heads),S=pl.a.lefty?"L":"R",g=b=>{const i=A.BI[b];return [W.p[i*3],W.p[i*3+1]];};
  return {hip:g("thigh."+S),knee:g("shin."+S),ankle:g("foot."+S),shoulder:g("upperarm."+S),elbow:g("forearm."+S),wrist:g("hand."+S)};}
function timeMap(d,clip){const ph=d.res.ph||{},T=d.times,pts=[];const add=(k,ct)=>{if(ph[k]!=null&&ct!=null&&ct>=0)pts.push([T[ph[k]],ct]);};
  add("takeoff",clip.tTO);add("contact",clip.contact);add("peak",clip.contact!=null?clip.contact:(clip.tTO!=null&&clip.tLand!=null?(clip.tTO+clip.tLand)/2:null));add("landing",clip.tLand);
  pts.sort((a,b)=>a[0]-b[0]);const P2=pts.filter((p,i)=>!i||p[1]>pts[i-1][1]);if(!P2.length)P2.push([T[Math.floor(T.length/2)],clip.contact||clip.dur/2]);
  return u=>{if(P2.length===1)return P2[0][1]+(u-P2[0][0]);let i=0;while(i<P2.length-2&&u>P2[i+1][0])i++;const a=P2[i],b=P2[i+1],k=(b[1]-a[1])/((b[0]-a[0])||1);return a[1]+(u-a[0])*k;};}
function filmCompare(){const host=$("#fResults");if(!host||!VB.film||!VB.film.data)return;const d=VB.film.data();let card=$("#fCompare");
  if(!d||!FCLIP[d.move]||d.view!=="side"){if(card)card.remove();if(FC){cancelAnimationFrame(FC.raf);FC=null;}return;}
  if(card&&FC&&FC.key===d.move+d.times.length)return;
  if(!card){card=document.createElement("div");card.className="card fcmp";card.id="fCompare";host.appendChild(card);}
  const clip=VB.Athlete.CLIPS[FCLIP[d.move]],ph=d.res.ph||{},phases=Object.keys(ph).filter(k=>ph[k]!=null).sort((a,b)=>ph[a]-ph[b]);
  card.innerHTML=`<div class="kicker">Compare with the reference</div><p class="small muted">Your tracked joints on the left, the reference technique on the right, lined up at your ${phases.map(k=>({takeoff:"take-off",contact:"contact",landing:"landing",peak:"peak",dip:"load"}[k]||k)).join(", ")}.</p>
    <div class="fcrow"><canvas id="fcYou" width="560" height="560" aria-label="Your movement"></canvas><canvas id="fcRef" width="560" height="560" aria-label="Reference movement"></canvas></div>
    <div class="row fcctl"><button type="button" class="btn sm primary" id="fcPlay">Pause</button><span class="seg" role="group" aria-label="Speed">${[1,.5,.25].map(s=>`<button type="button" data-fcs="${s}" aria-pressed="${s===.5}">${s===1?"1×":s===.5?"½×":"¼×"}</button>`).join("")}</span>
      <input type="range" id="fcT" min="0" max="1000" value="0" aria-label="Time"></div>
    <div class="row">${phases.map(k=>`<button type="button" class="btn sm" data-fcp="${k}">${esc(({dip:"Load",takeoff:"Take-off",peak:"Peak",landing:"Landing",contact:"Contact",absorb:"Absorb",catch:"Catch",release:"Release"}[k])||k)}</button>`).join("")}</div>
    <div class="tblwrap"><table class="ctbl fctbl"><thead><tr><th>Joint angle</th>${phases.map(k=>`<th>${esc(({dip:"Load",takeoff:"Take-off",peak:"Peak",landing:"Landing",contact:"Contact"}[k])||k)}</th>`).join("")}</tr></thead><tbody id="fcTbl"></tbody></table></div>
    <p class="small muted">Angles are measured side-on in 2D, so treat differences under about 10° as noise.</p>`;
  const G=VB.GL,cv=$("#fcRef"),R=G.renderer(cv,{alpha:true});if(!R){card.querySelector(".fcrow").innerHTML="<p class='small'>3D is not available in this browser.</p>";return;}
  R.setSize(280,280,2);const scene={root:new G.Node(),clear:[0,0,0,0],light:{sky:"#c9c6ef",gnd:"#3a2f55",d1:[.4,1,.7],c1:"#ffffff",d2:[-.6,.4,-.5],c2:"#8a86c8",rim:"#9b8cff"},shadow:{dir:[.3,1,.25],opacity:.25}};
  const p=S().profile||{},look=Object.assign({},VB.lookOpts?VB.lookOpts(p.look||{}):{},{clip:FCLIP[d.move],natural:false,lefty:p.hand==="left",number:p.number==null?"":p.number,trail:false});
  const pl=VB.Athlete.player(look);scene.root.add(pl.root);
  const T=d.times,t0=T[0],t1=T[T.length-1],map=timeMap(d,clip);
  // reference angles at the user's phases
  const rows=ANG.map(([k,l])=>`<tr><td>${l}</td>${phases.map(ph_=>{const u=anglesOf(userJ(d,ph[ph_]))[k],r=anglesOf(refJ(pl,Math.max(0,Math.min(clip.dur-.01,map(T[ph[ph_]])))))[k];
      if(u==null||r==null)return "<td>–</td>";const diff=Math.round(u-r);return `<td><b>${Math.round(u)}°</b> <span class="small muted">ref ${Math.round(r)}°</span>${Math.abs(diff)>12?` <span class="pill hot">${diff>0?"+":""}${diff}°</span>`:""}</td>`;}).join("")}</tr>`).join("");
  $("#fcTbl").innerHTML=rows;
  FC={key:d.move+d.times.length,u:t0,speed:.5,play:true,raf:0,last:performance.now()};
  const you=$("#fcYou"),g=you.getContext("2d");
  // frame the user's skeleton on the whole clip
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;d.P.forEach((_,i)=>{const J=userJ(d,i);Object.values(J).forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);});});
  const span=Math.max(x1-x0,y1-y0)*1.15||1,cx=(x0+x1)/2,cy=(y0+y1)/2,W=you.width,H=you.height,px=q=>[(q[0]-cx)/span*W+W/2,H/2-(q[1]-cy)/span*H];
  function drawYou(u){let i=0;while(i<T.length-1&&T[i+1]<=u)i++;const j=Math.min(T.length-1,i+1),a=(u-T[i])/((T[j]-T[i])||1),A=userJ(d,i),B=userJ(d,j),J={};
    Object.keys(A).forEach(k=>{if(B[k])J[k]=[A[k][0]+(B[k][0]-A[k][0])*a,A[k][1]+(B[k][1]-A[k][1])*a];});
    g.clearRect(0,0,W,H);g.fillStyle="#f4f2fb";g.fillRect(0,0,W,H);g.lineCap="round";g.lineWidth=14;g.strokeStyle="#17144d";
    [["head","shoulder"],["shoulder","elbow"],["elbow","wrist"],["shoulder","hip"],["hip","knee"],["knee","ankle"],["ankle","toe"]].forEach(([p1,p2])=>{if(!J[p1]||!J[p2])return;const P1=px(J[p1]),P2=px(J[p2]);g.beginPath();g.moveTo(...P1);g.lineTo(...P2);g.stroke();});
    if(J.head){const h=px(J.head);g.fillStyle="#17144d";g.beginPath();g.arc(h[0],h[1],22,0,7);g.fill();}
    g.fillStyle="#cf2840";g.font="600 22px sans-serif";g.fillText("You",16,32);}
  function loop(now){const dt=Math.min(.1,(now-FC.last)/1000);FC.last=now;if(FC.play){FC.u+=dt*FC.speed;if(FC.u>t1)FC.u=t0;}
    const ct=Math.max(0,Math.min(clip.dur-.01,map(FC.u)));pl.t=ct;pl.snap&&pl.snap();pl.update(0);const P0=pl.a.pelvis.pos;
    R.render(scene,{fov:30,pos:[P0[0]+.2,1.35,5.4],target:[P0[0],Math.max(1,P0[1]),0]});drawYou(FC.u);
    const sl=$("#fcT");if(sl&&document.activeElement!==sl)sl.value=Math.round((FC.u-t0)/((t1-t0)||1)*1000);
    if($("#fCompare"))FC.raf=requestAnimationFrame(loop);}
  FC.raf=requestAnimationFrame(loop);
  card.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.id==="fcPlay"){FC.play=!FC.play;b.textContent=FC.play?"Pause":"Play";}
    if(b.dataset.fcs){FC.speed=+b.dataset.fcs;card.querySelectorAll("[data-fcs]").forEach(x=>x.setAttribute("aria-pressed",x===b));}
    if(b.dataset.fcp){FC.u=T[ph[b.dataset.fcp]];FC.play=false;$("#fcPlay").textContent="Play";}});
  $("#fcT").addEventListener("input",e=>{FC.u=t0+(+e.target.value/1000)*(t1-t0);FC.play=false;$("#fcPlay").textContent="Play";});}
new MutationObserver(()=>{if(view()==="film")setTimeout(filmCompare,0);}).observe(document.getElementById("v-film")||document.body,{childList:true,subtree:false});
document.addEventListener("click",e=>{if(view()==="film"&&!e.target.closest("#fCompare"))setTimeout(filmCompare,300);});

/* ================= theme ================= */
function applyTheme(){let t="system";try{t=localStorage.getItem("vbj-theme")||"system";}catch(e){}const eff=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;
  document.documentElement.dataset.theme=eff;const m=$('meta[name="theme-color"]');if(m)m.content=eff==="dark"?"#0e0c22":"#17144d";
  $$("[data-theme-set]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.themeSet===t));}
/* language: the interface is translated by i18n.js at load, so switching reloads the page */
function langUI(){const l=VB.lang||"en";$$("[data-lang-set]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.langSet===l));
  const n=document.getElementById("langNote");if(n)n.textContent=l==="fr"?"L'interface est en français. Les consignes des exercices et des ateliers restent en anglais pour l'instant.":"French translates the interface. Exercise and drill instructions stay in English for now.";}
document.addEventListener("click",e=>{const b=e.target.closest("[data-lang-set]");if(!b||b.dataset.langSet===(VB.lang||"en"))return;try{localStorage.setItem("vbj-lang",b.dataset.langSet);}catch(_){}location.reload();});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",langUI);else langUI();
document.addEventListener("click",e=>{const b=e.target.closest("[data-theme-set]");if(!b)return;try{localStorage.setItem("vbj-theme",b.dataset.themeSet);}catch(_){}applyTheme();});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme);setTimeout(applyTheme,0);

/* ================= privacy and your data ================= */
const priv=()=>{const s=S();if(!s.privacy||typeof s.privacy!=="object")s.privacy={cardVis:"friends"};return s.privacy;};
function renderPrivacy(){const card=$("#privCard");if(!card)return;const minor=VB.minor(),child=VB.child(),age=VB.ageOf();
  $$("input[name=cardvis]",card).forEach(r=>{r.checked=(minor?"friends":priv().cardVis||"friends")===r.value;r.disabled=minor&&r.value==="public";});
  $("#visNote").textContent=child?"Squad is off for players under 12, so your card is not shared at all.":minor?"Players under 18 are only visible to friends and teammates, and can only be found by someone who types their exact email.":age==null?"Add your age in Your details to unlock the right sharing options.":"Friends and teammates is the default. Public lets anyone with an account see your card and stats.";
  const signed=!!(VB.backend&&VB.backend.session);$("#delAcctRow").hidden=!signed;
  if(child&&signed)$("#delNote").textContent="This account belongs to a player under 12, so cloud saving and Squad are switched off. A parent or guardian can delete the account here.";}
document.addEventListener("change",e=>{if(e.target.name==="cardvis"){priv().cardVis=e.target.value;VB.save();toast(e.target.value==="public"?"Your card is visible to anyone with an account.":"Your card is visible to friends and teammates only.");}
  if(e.target.id==="p-age"){ageNote();}});
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type||"application/json"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
VB.v3.download=download;
document.addEventListener("click",async e=>{const t=e.target.closest("button");if(!t)return;
  if(t.id==="dataOut"){const out={app:"volleyball-training-journey",version:2,exportedAt:new Date().toISOString(),state:S(),media:VB.media||null};
    download("volleyball-journey-"+VB.today()+".json",JSON.stringify(out,null,1));toast("Your data is downloading as a file.");}
  if(t.id==="dataIn")$("#dataFile").click();
  if(t.id==="delAcct"){const y=$("#delAcctYes");y.hidden=!y.hidden;t.textContent=y.hidden?"Delete my account":"Cancel";}
  if(t.id==="delAcctYes"){t.disabled=true;$("#delNote").textContent="Deleting your account…";
    try{await VB.backend.deleteAccount();$("#delNote").textContent="Your account and all its data are deleted.";setTimeout(()=>location.reload(),1200);}
    catch(err){t.disabled=false;$("#delNote").textContent="Could not delete the account: "+(err.message||err)+". Check your connection and try again.";}}});
document.addEventListener("change",e=>{if(e.target.id!=="dataFile")return;const f=e.target.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d||d.app!=="volleyball-training-journey"||!d.state||!d.state.profile)throw new Error("not a Volleyball Training Journey file");
      d.state.updatedAt=Date.now();localStorage.setItem("vb-journey-v2",JSON.stringify(d.state));toast("Restored. Reloading…");setTimeout(()=>location.reload(),700);}
    catch(err){toast("That file could not be restored: "+err.message+".");}};rd.readAsText(f);e.target.value="";});
/* age note in onboarding and Your details */
function ageNote(){const el=$("#ageNote"),i=$("#p-age");if(!el||!i)return;const a=i.value===""?null:+i.value;
  el.hidden=a==null||a>=18;el.textContent=a!=null&&a<12?"Under 12: ask a parent or guardian to set this up with you. Everything is saved on this device only, and Squad is switched off.":a!=null&&a<18?"Under 18: your player card is only visible to friends and teammates.":"";}
VB.v3.onSave(()=>{renderPrivacy();ageNote();if(VB.backend&&VB.backend.saveProfileRow)VB.backend.saveProfileRow();});
let lastBracket=null;VB.v3.onSave(()=>{const br=VB.child()?"child":VB.minor()?"minor":"adult";if(lastBracket&&br!==lastBracket&&VB.squad&&VB.squad.refresh)VB.squad.refresh();lastBracket=br;});
VB.v3.onRoute(v=>{if(v==="profile")renderPrivacy();});
setTimeout(()=>{renderPrivacy();ageNote();},0);

/* ================= install, offline and reminders ================= */
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
const DAYS=[["1","Mon"],["2","Tue"],["3","Wed"],["4","Thu"],["5","Fri"],["6","Sat"],["0","Sun"]];
const rem=()=>{const s=S();if(!s.reminder)s.reminder={days:[1,3,5],time:"17:00",on:false};return s.reminder;};
function renderRem(){const host=$("#remDays");if(!host)return;const r=rem();
  host.innerHTML=DAYS.map(([v,l])=>`<button type="button" class="sbtn" data-day="${v}" aria-pressed="${r.days.includes(+v)}">${l}</button>`).join("");$("#remTime").value=r.time;
  const can="Notification" in window&&"serviceWorker" in navigator&&/^https?:$/.test(location.protocol);$("#remPush").hidden=!can;$("#remPush").textContent=r.on?"Turn off notifications":"Turn on notifications";}
function icsReminders(){const r=rem(),BY={0:"SU",1:"MO",2:"TU",3:"WE",4:"TH",5:"FR",6:"SA"},t=VB.today();
  // DTSTART is itself an occurrence, so it must fall on one of the chosen days or the calendar shows an extra event
  let first=t;for(let i=0;i<7;i++){const ds=VB.addDays(t,i);if(r.days.includes(new Date(ds+"T12:00:00").getDay())){first=ds;break;}}
  const time=/^\d\d:\d\d$/.test(r.time)?r.time:"17:00",[h,m]=time.split(":").map(Number),e=String(Math.min(23,h+1)).padStart(2,"0")+":"+String(m).padStart(2,"0");
  return icsDoc(["BEGIN:VEVENT","UID:vbj-train-"+r.days.join("")+"@volleyball-training-journey","DTSTAMP:"+icsStamp(),"DTSTART:"+icsDT(first,time),"DTEND:"+icsDT(first,e),
    "RRULE:FREQ=WEEKLY;WKST=MO;BYDAY="+r.days.map(x=>BY[x]).join(","),"SUMMARY:Volleyball training","DESCRIPTION:"+icsEsc("Open Volleyball Training Journey for today's session: "+location.href.split("#")[0]+"#today"),
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Time to train","TRIGGER:-PT15M","END:VALARM","END:VEVENT"]);}
VB.cal.icsReminders=icsReminders;
async function savePushSettings(){if(!("caches" in window))return;const r=rem(),[h]=r.time.split(":").map(Number),c=await caches.open("vbj-settings");
  const done=S().sessions.some(x=>x.date===VB.today()&&!x.ex);await c.put("reminder",new Response(JSON.stringify({on:r.on,days:r.days,hour:h,lastDone:done?VB.today():null,text:"Your session is ready. About "+((S().today&&S().today.plan&&S().today.plan.est)||45)+" minutes."})));}
document.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.day!=null&&b.closest("#remDays")){const r=rem(),d=+b.dataset.day;r.days=r.days.includes(d)?r.days.filter(x=>x!==d):[...r.days,d].sort();r.custom=true;VB.save();VB.invalidatePlan&&VB.invalidatePlan();renderRem();savePushSettings();}
  if(b.id==="remIcs"){if(!rem().days.length){$("#remNote").textContent="Pick at least one day first.";return;}download("volleyball-training.ics",icsReminders(),"text/calendar");$("#remNote").textContent="Open the downloaded file to add a weekly training event with a reminder 15 minutes before.";}
  if(b.id==="remPush"){const r=rem();if(r.on){r.on=false;VB.save();savePushSettings();renderRem();$("#remNote").textContent="Notifications are off.";return;}
    const perm=await Notification.requestPermission();if(perm!=="granted"){$("#remNote").textContent="Notifications are blocked in your browser settings. Use Add to my calendar instead.";return;}
    r.on=true;VB.save();await savePushSettings();renderRem();const reg=await navigator.serviceWorker.ready;
    if(reg.periodicSync){try{await reg.periodicSync.register("vbj-reminder",{minInterval:6*3600*1000});$("#remNote").textContent="Notifications are on. Your phone checks a few times a day and reminds you on training days.";}
      catch(err){$("#remNote").textContent="Install the app to your home screen first (browser menu, then Install or Add to Home screen), then turn this on again. Or use Add to my calendar.";r.on=false;VB.save();renderRem();}}
    else{$("#remNote").textContent="Your browser can't schedule reminders while the app is closed. Use Add to my calendar for reliable reminders.";r.on=false;VB.save();renderRem();}}});
document.addEventListener("change",e=>{if(e.target.id==="remTime"){rem().time=e.target.value||"17:00";rem().custom=true;VB.save();savePushSettings();}});
VB.v3.onSave(()=>{savePushSettings();});VB.v3.onRoute(v=>{if(v==="profile")renderRem();});setTimeout(renderRem,0);
/* install prompt: offered once the person has finished a session, never on first visit */
let installEvt=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;});
VB.v3.install=()=>{if(installEvt){installEvt.prompt();installEvt=null;return true;}return false;};
})();

/* ---------- motion polish: page enter animation and loading placeholders ---------- */
(function(){let lastV=null;const enter=()=>{const v=location.hash.replace("#","")||"today",el=document.getElementById("v-"+v);if(!el||v===lastV)return;lastV=v;
    el.classList.remove("v-enter");void el.offsetWidth;el.classList.add("v-enter");setTimeout(()=>el.classList.remove("v-enter"),700);};
  window.addEventListener("hashchange",()=>requestAnimationFrame(enter));
  // placeholders in 3D stages and chart areas until something is drawn
  const fill=()=>{document.querySelectorAll("#courtStage,#bodyStage,.demo3d,.chartbox").forEach(el=>{if(el.dataset.sk)return;const busy=!el.querySelector("canvas")||el.querySelector("canvas").width<10;
      if(busy){el.dataset.sk="1";if(getComputedStyle(el).position==="static")el.style.position="relative";el.insertAdjacentHTML("beforeend",'<div class="stage-loading" aria-hidden="true"><div class="skel"></div></div>');
        const t=setInterval(()=>{const c=el.querySelector("canvas");if(c&&c.width>10){clearInterval(t);const s=el.querySelector(".stage-loading");if(s)s.remove();}},250);setTimeout(()=>{clearInterval(t);const s=el.querySelector(".stage-loading");if(s)s.remove();},15000);}});};
  window.addEventListener("hashchange",()=>setTimeout(fill,30));if(document.readyState!=="loading")setTimeout(fill,30);else document.addEventListener("DOMContentLoaded",()=>setTimeout(fill,30));
})();
