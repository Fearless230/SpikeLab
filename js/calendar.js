/* calendar.js: the calendar on Progress (#calCard) and the "Coming up" card (#seasonCard).
   Month grid, week timetable and list; a day panel to see what happened or what is planned and to add or edit events.
   Games (matches, tournaments, tryouts) drive the plan's tapering; team practices count as training days.
   Also shows sessions, match-tracker results, jump tests, Squad events, program phases and the jump-goal date. */
(function(){
"use strict";
const VB=window.VB,S=()=>VB.state,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s)),esc=VB.esc,C=()=>VB.cal;
const toast=m=>(VB.v5&&VB.v5.toast?VB.v5.toast(m):VB.toast?VB.toast(m):0);
const DOW=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],JS2MON=d=>(d+6)%7;
const ymOf=ds=>ds.slice(0,7),firstOf=ym=>ym+"-01",addMonths=(ym,n)=>{let [y,m]=ym.split("-").map(Number);m+=n;while(m>12){m-=12;y++;}while(m<1){m+=12;y--;}return y+"-"+String(m).padStart(2,"0");};
const dObj=ds=>new Date(ds+"T12:00:00"),longDate=ds=>dObj(ds).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}),monthName=ym=>dObj(firstOf(ym)).toLocaleDateString(undefined,{month:"long",year:"numeric"});
const CS={view:"month",ym:null,sel:null,wk:null,edit:null,draft:null};
const KCOL={match:"var(--coral,#ff6b7d)",tournament:"#ff8a3d",tryout:"#9d86ff",practice:"#45c8ff",other:"#8a86b0"};

/* ---------- everything that falls on a day ---------- */
function squadMeets(){const out=[],o=(S().social||{});(o.meets||[]).forEach(m=>out.push(Object.assign({host:"me",mine:true},m)));
  try{const d=VB.squad&&VB.squad.data&&VB.squad.data();if(d&&d.players){const me=d.uid;Object.entries(d.players).forEach(([id,p])=>{if(id===me)return;((p&&p.meets)||[]).forEach(m=>{if(m&&(m.inv||[]).includes(me))out.push(Object.assign({host:id,by:d.nameOf?d.nameOf(id):"A friend"},m));});});}}catch(e){}
  return out.filter(m=>m&&m.date);}
function progMarks(){const out={};try{const ap=VB.activeProgram(),d=ap.def,st=ap.start;if(!d||!st)return out;
    (d.phases||[]).forEach(f=>{const ds=VB.addDays(st,(f.from-1)*7);(out[ds]=out[ds]||[]).push("Phase: "+f.name);});
    if(d.weeks){const end=VB.addDays(st,d.weeks*7-1);(out[end]=out[end]||[]).push("Last day of "+d.name);}
    (out[st]=out[st]||[]).push("Started "+d.name);}catch(e){}
  const g=S().goal;if(g&&g.date)(out[g.date]=out[g.date]||[]).push("Jump goal date");return out;}
function dayData(ds,cache){const c=C(),ev=c.events().filter(e=>e.date<=ds&&c.endOf(e)>=ds).sort(c.byWhen),ses=(S().sessions||[]).filter(s=>!s.ex&&s.date===ds),
    mt=(S().matches||[]).filter(m=>m.date===ds),tests=(S().tests||[]).filter(t=>t.kind==="vert"&&!t.ex&&t.date===ds),sq=(cache.sq||[]).filter(m=>m.date===ds),pm=cache.pm[ds]||[];
  return {ev,ses,mt,tests,sq,pm,plan:c.planFor(ds)};}
const cacheNow=()=>({sq:squadMeets(),pm:progMarks()});
const won=m=>{let a=0,b=0;(m.sets||[]).forEach(s=>{if(s[0]>s[1])a++;else if(s[1]>s[0])b++;});return [a,b];};

/* ---------- month ---------- */
function monthHTML(cache){const t=VB.today(),start=VB.weekStart(firstOf(CS.ym)),cells=[];
  const lastDay=VB.addDays(firstOf(addMonths(CS.ym,1)),-1),last=VB.addDays(VB.weekStart(lastDay),6);
  for(let i=0;i<42;i++){const ds=VB.addDays(start,i);if(ds>last)break;const D=dayData(ds,cache),inM=ymOf(ds)===CS.ym,fut=ds>=t;
    const evs=D.ev.map(e=>`<span class="cev" style="--kc:${KCOL[e.kind]||KCOL.match}">${e.time?`<em>${esc(e.time)}</em> `:""}${esc(e.name||C().KINDS[e.kind]||"Match")}</span>`).concat(D.sq.map(m=>`<span class="cev sq">${m.time?`<em>${esc(m.time)}</em> `:""}${esc(m.title||m.kind||"Squad")}</span>`));
    const dots=[D.ses.length?`<i class="cd done" title="Trained"></i>`:fut&&["train","practice"].includes(D.plan.k)?`<i class="cd plan" title="Planned training"></i>`:"",D.tests.length?`<i class="cd test" title="Jump test"></i>`:"",D.mt.length?`<i class="cd res" title="Match result"></i>`:"",D.pm.length?`<i class="cd prog" title="${esc(D.pm.join(", "))}"></i>`:""].join("");
    cells.push(`<button type="button" class="cday ${inM?"":"out"} ${ds===t?"today":""} ${ds===CS.sel?"sel":""} ${fut?"p-"+D.plan.k:""}" data-cday="${ds}" aria-label="${esc(longDate(ds))}${D.ev.length?", "+D.ev.length+" event"+(D.ev.length>1?"s":""):""}${D.ses.length?", trained":""}">
      <b>${+ds.slice(8)}</b><span class="cevs">${evs.slice(0,2).join("")}${evs.length>2?`<span class="cmore">+${evs.length-2}</span>`:""}</span><span class="cdots">${dots}</span></button>`);}
  return `<div class="cgridm" role="group" aria-label="Month"><div class="cdow">${DOW.map(d=>`<span>${d}</span>`).join("")}</div><div class="cdays">${cells.join("")}</div></div>
   <div class="ckey small muted"><span><i class="cd done"></i>Trained</span><span><i class="cd plan"></i>Training day</span><span><i class="sw p-light"></i>Light (day before a game)</span><span><i class="sw p-recovery"></i>Recovery</span><span><i class="sw p-game"></i>Game</span><span><i class="cd test"></i>Jump test</span><span><i class="cd res"></i>Result</span><span><i class="cd prog"></i>Program</span></div>`;}

/* ---------- week timetable ---------- */
function weekHTML(cache){const t=VB.today(),r=S().reminder||{},time=r.time||"17:00",tdays=C().trainDays();
  const rows=DOW.map((d,i)=>{const ds=VB.addDays(CS.wk,i),D=dayData(ds,cache),past=ds<t,p=D.plan;
    const what=[];
    D.ev.forEach(e=>what.push(`<div class="tline" style="--kc:${KCOL[e.kind]||KCOL.match}"><b>${e.time?esc(e.time):"All day"}</b><span>${esc(C().KINDS[e.kind]||"Match")}${e.name?": "+esc(e.name):""}${e.place?` <small>· ${esc(e.place)}</small>`:""}</span><button type="button" class="btn sm" data-cedit="${e.id}">Edit</button></div>`));
    D.sq.forEach(m=>what.push(`<div class="tline sq"><b>${m.time?esc(m.time):"Time TBC"}</b><span>${esc(m.title||m.kind||"Squad event")}${m.place?` <small>· ${esc(m.place)}</small>`:""} <small>· ${m.mine?"you host":"from "+esc(m.by||"a friend")}</small></span><a class="btn sm" href="#squad">Squad</a></div>`));
    if(!past&&["train","light","recovery"].includes(p.k))what.push(`<div class="tline tr"><b>${esc(time)}</b><span>${p.k==="train"?"Your session":p.k==="light"?"Short, sharp session":"Recovery session"} <small>· ${esc(p.note)}</small></span>${ds===t?`<a class="btn sm primary" href="#today">Start</a>`:""}</div>`);
    D.ses.forEach(s=>what.push(`<div class="tline ok"><b>Done</b><span>${esc(cap(s.type||"Session"))} · ${s.mins||0} min${s.rpe?` · effort ${s.rpe}`:""}${s.jumps!=null?` · ${s.jumps} jumps`:""}</span></div>`));
    D.mt.forEach(m=>{const w=won(m);what.push(`<div class="tline ok"><b>Result</b><span>${w[0]}-${w[1]} vs ${esc(m.opp||"opponent")}</span></div>`);});
    D.tests.forEach(x=>what.push(`<div class="tline ok"><b>Test</b><span>Vertical ${esc(VB.lenOut(x.cm))} ${VB.lu()}</span></div>`));
    D.pm.forEach(x=>what.push(`<div class="tline pg"><b>Program</b><span>${esc(x)}</span></div>`));
    if(!what.length)what.push(`<div class="tline rest"><span class="muted">${past?"Nothing logged":"Rest"}</span></div>`);
    return `<div class="trow ${ds===t?"today":""} ${past?"past":""}"><button type="button" class="tday" data-cday="${ds}"><b>${d}</b><span>${+ds.slice(8)} ${dObj(ds).toLocaleDateString(undefined,{month:"short"})}</span><i class="tbadge p-${past?(D.ses.length?"done":D.ev.some(e=>C().TAPER.has(e.kind))?"game":"rest"):p.k}">${past?(D.ses.length?"Trained":D.ev.some(e=>C().TAPER.has(e.kind))?esc(p.label):["train","practice"].includes(p.k)?"Missed":"Rest"):esc(p.label)}</i></button><div class="twhat">${what.join("")}</div></div>`;}).join("");
  return `<div class="ttable">${rows}</div>
   <div class="tdays"><span class="small"><b>Training days</b></span>${[1,2,3,4,5,6,0].map(d=>`<button type="button" class="chip" data-ctd="${d}" aria-pressed="${tdays.includes(d)}">${DOW[JS2MON(d)]}</button>`).join("")}
    <label class="small">at <input type="time" id="ctime" value="${esc(time)}"></label><button type="button" class="btn sm" data-cics="train">Add training days to my calendar</button></div>
   <p class="small muted">Training days set the plan: on other days the app suggests rest. The same days are used by Training reminders in Profile.</p>`;}

/* ---------- list ---------- */
function listHTML(){const c=C(),t=VB.today(),all=c.events().slice().sort(c.byWhen),up=all.filter(e=>c.endOf(e)>=t),past=all.filter(e=>c.endOf(e)<t).reverse().slice(0,12);
  const row=e=>{const res=(S().matches||[]).find(m=>m.date===e.date),w=res?won(res):null;
    return `<div class="lrow" style="--kc:${KCOL[e.kind]||KCOL.match}"><div class="evdate"><b>${+e.date.slice(8)}</b><span>${dObj(e.date).toLocaleDateString(undefined,{month:"short"})}</span></div>
     <div class="lbody"><b>${esc(c.KINDS[e.kind]||"Match")}${e.name?": "+esc(e.name):""}</b><span class="small muted">${esc(dObj(e.date).toLocaleDateString(undefined,{weekday:"long"}))}${c.endOf(e)!==e.date?" to "+esc(VB.shortDate(c.endOf(e))):""}${e.time?" · "+esc(e.time):""}${e.place?" · "+esc(e.place):""}${e.date>=t?" · "+inDays(e.date):""}</span>${w?`<span class="small">Result: ${w[0]}-${w[1]}</span>`:""}</div>
     <div class="row"><button type="button" class="btn sm" data-cedit="${e.id}">Edit</button><button type="button" class="btn sm" data-cics="${e.id}" aria-label="Add to my calendar">.ics</button></div></div>`;};
  return `<div class="kicker">Coming up · ${up.length}</div>${up.length?up.map(row).join(""):`<p class="small muted">Nothing planned. Add your games and team practices.</p>`}
   ${past.length?`<div class="kicker" style="margin-top:14px">Recent</div>${past.map(row).join("")}`:""}`;}
const cap=x=>String(x).charAt(0).toUpperCase()+String(x).slice(1);
const inDays=ds=>{const d=VB.daysBetween(VB.today(),ds);return d<=0?"today":d===1?"tomorrow":"in "+d+" days";};

/* ---------- day panel and the event form ---------- */
function formHTML(){const c=C(),e=CS.edit?c.events().find(x=>x.id===CS.edit):null,f=CS.draft||e||{date:CS.sel||VB.today(),kind:"match"};
  return `<form class="cform" id="calForm" novalidate><div class="kicker">${e?"Edit event":"Add an event"}</div>
   <div class="grid"><label class="f">Type<select id="cf-kind">${Object.entries(c.KINDS).map(([k,l])=>`<option value="${k}" ${f.kind===k?"selected":""}>${esc(l)}</option>`).join("")}</select></label>
    <label class="f">Name or opponent<input id="cf-name" maxlength="40" value="${esc(f.name||"")}" placeholder="Optional"></label>
    <label class="f">Date<input type="date" id="cf-date" value="${esc(f.date)}" required></label>
    <label class="f cf-end" ${f.kind==="tournament"?"":"hidden"}>Last day<input type="date" id="cf-end" value="${esc(f.end||"")}" min="${esc(f.date)}"></label>
    <label class="f">Start time<input type="time" id="cf-time" value="${esc(f.time||"")}"></label>
    <label class="f">Place<input id="cf-place" maxlength="60" value="${esc(f.place||"")}" placeholder="Gym or address"></label>
    <label class="f cf-wide">Note<input id="cf-note" maxlength="120" value="${esc(f.note||"")}" placeholder="Bring both jerseys, warm-up at 9:15…"></label></div>
   <p class="small muted cf-hint">${c.TAPER.has(f.kind)?"The plan goes lighter the day before, keeps the day itself to activation, and makes the day after a recovery day.":f.kind==="practice"?"Team practices count as training days. The plan does not taper around them.":"Shown on the calendar only."}</p>
   <div class="row"><button type="submit" class="btn sm primary">${e?"Save changes":"Add"}</button>${e?`<button type="button" class="btn sm" data-cdel="${e.id}">Delete</button><button type="button" class="btn sm" data-cics="${e.id}">Add to my calendar</button>`:""}${e||CS.draft?`<button type="button" class="btn sm" data-ccancel>Cancel</button>`:""}</div></form>`;}
function dayPanel(cache){const ds=CS.sel;if(!ds)return `<div class="cpanel">${formHTML()}</div>`;const D=dayData(ds,cache),t=VB.today(),p=D.plan,c=C();
  const items=[];
  D.ev.forEach(e=>items.push(`<li style="--kc:${KCOL[e.kind]||KCOL.match}"><b>${esc(c.KINDS[e.kind]||"Match")}${e.name?": "+esc(e.name):""}</b><span class="small muted">${e.time?esc(e.time):"All day"}${c.endOf(e)!==e.date?" · until "+esc(VB.shortDate(c.endOf(e))):""}${e.place?" · "+esc(e.place):""}</span>${e.note?`<span class="small">${esc(e.note)}</span>`:""}<span class="row"><button type="button" class="btn sm" data-cedit="${e.id}">Edit</button><button type="button" class="btn sm" data-cics="${e.id}">.ics</button></span></li>`));
  D.sq.forEach(m=>items.push(`<li class="sq"><b>${esc(m.title||m.kind||"Squad event")}</b><span class="small muted">${m.time?esc(m.time):"Time to be set"}${m.place?" · "+esc(m.place):""} · ${m.mine?"you host":"from "+esc(m.by||"a friend")}</span><a class="small" href="#squad">Open in Squad</a></li>`));
  D.ses.forEach(s=>items.push(`<li class="ok"><b>Trained</b><span class="small muted">${esc(cap(s.type||"Session"))} · ${s.mins||0} min${s.rpe?" · effort "+s.rpe:""}${s.jumps!=null?" · "+s.jumps+" jumps":""}</span></li>`));
  D.mt.forEach(m=>{const w=won(m);items.push(`<li class="ok"><b>Match result: ${w[0]}-${w[1]}</b><span class="small muted">vs ${esc(m.opp||"opponent")} · ${(m.sets||[]).map(x=>x.join("-")).join(", ")}</span></li>`);});
  D.tests.forEach(x=>items.push(`<li class="ok"><b>Jump test</b><span class="small muted">${esc(VB.lenOut(x.cm))} ${VB.lu()}</span></li>`));
  D.pm.forEach(x=>items.push(`<li class="pg"><b>${esc(x)}</b></li>`));
  const planLine=ds>=t?`<div class="cplan p-${p.k}"><b>${ds===t?"Today":"Plan"}: ${esc(p.label)}</b><span class="small">${esc(p.note)}</span>${ds===t?`<a class="btn sm primary" href="#today">Go to today's session</a>`:""}</div>`:"";
  return `<div class="cpanel"><div class="row" style="justify-content:space-between;align-items:baseline"><h4>${esc(longDate(ds))}</h4><button type="button" class="btn sm" data-cclose aria-label="Close the day">✕</button></div>
   ${planLine}<ul class="citems">${items.join("")||`<li class="muted small">${ds<t?"Nothing logged this day.":"Nothing planned yet."}</li>`}</ul>${formHTML()}</div>`;}

/* ---------- card: next game and what's coming ---------- */
function comingHTML(){const c=C(),n=c.daysTo(),up=c.upcoming().slice(0,5),t=VB.today(),tm=VB.addDays(t,1),pt=c.planFor(t),pm=c.planFor(tm);
  return `<div class="kicker">Coming up</div>
   ${n?`<div class="nextev"><span class="stat">Next ${esc((c.KINDS[n.e.kind]||"match").toLowerCase())}</span><b>${n.d===0?"Today":n.d===1?"Tomorrow":"In "+n.d+" days"}</b><span class="small">${esc(n.e.name||"")}${n.e.time?" · "+esc(n.e.time):""} · ${esc(VB.shortDate(n.e.date))}${n.e.place?" · "+esc(n.e.place):""}</span></div>`:""}
   <div class="cnext"><div class="cplan p-${pt.k}"><b>Today: ${esc(pt.label)}</b><span class="small">${esc(pt.note)}</span></div><div class="cplan p-${pm.k}"><b>Tomorrow: ${esc(pm.label)}</b><span class="small">${esc(pm.note)}</span></div></div>
   <div class="evlist">${up.length?up.map(e=>`<div class="ev" style="border-left-color:${KCOL[e.kind]||KCOL.match}"><b>${esc(VB.shortDate(e.date))}</b><span>${esc(c.KINDS[e.kind]||"Match")}${e.name?" · "+esc(e.name):""}${e.time?" · "+esc(e.time):""}</span><button type="button" class="btn sm" data-cedit="${e.id}">Edit</button></div>`).join(""):`<p class="small">No games yet.</p>`}</div>
   <div class="row"><button type="button" class="btn sm primary" data-copen="add">Add a game or practice</button>${c.games().some(e=>c.endOf(e)>=t)?`<button type="button" class="btn sm" data-cics="all">Add all games to my calendar</button>`:""}</div>`;}

function render(){const card=$("#calCard"),sc=$("#seasonCard");if(!S().profile)return;if(sc)sc.innerHTML=comingHTML();if(!card)return;
  if(!CS.ym)CS.ym=ymOf(VB.today());if(!CS.wk)CS.wk=VB.weekStart(VB.today());const cache=cacheNow();
  const title=CS.view==="month"?monthName(CS.ym):CS.view==="week"?`${VB.shortDate(CS.wk)} – ${VB.shortDate(VB.addDays(CS.wk,6))}`:"All events";
  card.innerHTML=`<div class="chead"><div><div class="kicker">Calendar</div><h3>${esc(title)}</h3></div>
    <div class="row cnav">${CS.view!=="list"?`<button type="button" class="btn sm" data-cstep="-1" aria-label="Previous">◀</button><button type="button" class="btn sm" data-ctoday>Today</button><button type="button" class="btn sm" data-cstep="1" aria-label="Next">▶</button>`:""}
     <div class="seg" role="group" aria-label="Calendar view">${[["month","Month"],["week","Week"],["list","List"]].map(([k,l])=>`<button type="button" data-cview="${k}" aria-pressed="${CS.view===k}">${l}</button>`).join("")}</div></div></div>
   <div class="cbody ${CS.view} ${CS.view==="month"||CS.sel||CS.edit||CS.draft?"":"nopanel"}"><div class="cmain">${CS.view==="month"?monthHTML(cache):CS.view==="week"?weekHTML(cache):listHTML()}</div>${CS.view==="month"||CS.sel||CS.edit||CS.draft?dayPanel(cache):""}</div>`;}

/* ---------- events ---------- */
function readForm(){const v=id=>{const el=$("#"+id);return el?el.value.trim():"";},kind=v("cf-kind")||"match",date=v("cf-date"),end=kind==="tournament"?v("cf-end"):"";
  return {kind,name:v("cf-name").slice(0,40),date,end:end&&end>date?end:"",time:/^\d\d:\d\d$/.test(v("cf-time"))?v("cf-time"):"",place:v("cf-place").slice(0,60),note:v("cf-note").slice(0,120)};}
document.addEventListener("submit",e=>{if(e.target.id!=="calForm")return;e.preventDefault();const f=readForm();if(!f.date){toast("Pick a date first.");return;}
  const list=C().events();if(CS.edit){const ev=list.find(x=>x.id===CS.edit);if(ev){Object.keys(f).forEach(k=>{if(f[k])ev[k]=f[k];else delete ev[k];});ev.kind=f.kind;}}
  else list.push(Object.assign({id:VB.uid()},Object.fromEntries(Object.entries(f).filter(([,v])=>v))));
  const was=!!CS.edit;CS.edit=null;CS.draft=null;CS.sel=f.date;CS.ym=ymOf(f.date);C().save();render();
  toast(was?"Saved.":C().TAPER.has(f.kind)?"Added. Your sessions around it are adjusted.":"Added to your calendar.");});
document.addEventListener("change",e=>{if(e.target.id==="cf-kind"||e.target.id==="cf-date"){CS.draft=Object.assign({},readForm());if(CS.edit)CS.draft.id=CS.edit;render();}
  if(e.target.id==="ctime"){const r=S().reminder=S().reminder||{days:C().trainDays(),time:"17:00",on:false};r.time=e.target.value||"17:00";r.custom=true;VB.save();render();}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-cday],[data-cview],[data-cstep],[data-ctoday],[data-cedit],[data-cdel],[data-ccancel],[data-cclose],[data-copen],[data-cics],[data-ctd]");if(!b)return;
  const d=b.dataset;
  if(d.cday!=null){CS.sel=CS.sel===d.cday&&CS.view==="month"?null:d.cday;CS.edit=null;CS.draft=null;if(CS.view!=="month"){CS.view="month";CS.ym=ymOf(d.cday);}render();const p=$(".cpanel");if(p&&window.innerWidth<900)p.scrollIntoView({behavior:"smooth",block:"nearest"});return;}
  if(d.cview){CS.view=d.cview;render();return;}
  if(d.cstep){const n=+d.cstep;if(CS.view==="month")CS.ym=addMonths(CS.ym,n);else CS.wk=VB.addDays(CS.wk,7*n);render();return;}
  if(d.ctoday!=null){CS.ym=ymOf(VB.today());CS.wk=VB.weekStart(VB.today());CS.sel=VB.today();render();return;}
  if(d.cedit){const ev=C().events().find(x=>x.id===d.cedit);if(!ev)return;CS.edit=ev.id;CS.draft=null;CS.sel=ev.date;CS.ym=ymOf(ev.date);if(CS.view==="list")CS.view="month";render();scrollCal();return;}
  if(d.cdel){const ev=C().events().find(x=>x.id===d.cdel);if(!ev)return;if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="Tap again to delete";setTimeout(()=>{if(b.isConnected){b.dataset.armed="";b.textContent="Delete";}},3500);return;}
    S().season.events=C().events().filter(x=>x.id!==d.cdel);CS.edit=null;CS.draft=null;C().save();render();toast("Deleted.");return;}
  if(d.ccancel!=null){CS.edit=null;CS.draft=null;render();return;}
  if(d.cclose!=null){CS.sel=null;CS.edit=null;CS.draft=null;render();return;}
  if(d.copen){CS.view="month";CS.sel=VB.today();CS.ym=ymOf(VB.today());CS.edit=null;CS.draft=null;render();scrollCal();const n=$("#cf-name");if(n)n.focus({preventScroll:true});return;}
  if(d.ctd!=null){const r=S().reminder=S().reminder||{days:C().trainDays(),time:"17:00",on:false},x=+d.ctd;if(!r.custom)r.days=C().trainDays();r.days=r.days.includes(x)?r.days.filter(y=>y!==x):[...r.days,x].sort();r.custom=true;VB.invalidatePlan();VB.save();render();return;}
  if(d.cics){const c=C();if(d.cics==="train"){if(!C().trainDays().length){toast("Pick at least one training day first.");return;}const r=S().reminder=S().reminder||{days:c.trainDays(),time:"17:00",on:false};if(!r.custom){r.days=c.trainDays();r.custom=true;}c.download("volleyball-training.ics",c.icsReminders());return;}
    const evs=d.cics==="all"?c.games().filter(x=>c.endOf(x)>=VB.today()).sort(c.byWhen):c.events().filter(x=>x.id===d.cics);if(!evs.length)return;
    c.download(d.cics==="all"?"volleyball-season.ics":"volleyball-"+evs[0].date+".ics",c.icsDoc(evs.flatMap(c.icsEvent)));toast("Open the downloaded file to add it to your phone's calendar.");}});
/* ---------- program timeline with real dates (Train > Programs) ---------- */
function progTimeline(){let ap;try{ap=VB.activeProgram();}catch(e){return "";}const d=ap.def,st=ap.start,t=VB.today(),c=C();if(!st)return "";
  const wk=ap.week,ws=VB.addDays(st,(wk-1)*7),we=VB.addDays(ws,6),thisWeek=`<p class="small"><b>${ap.finished?"Finished":"This is week "+wk}</b>${ap.finished?"":` · ${esc(VB.shortDate(ws))} to ${esc(VB.shortDate(we))}`} · started ${esc(VB.shortDate(st))}</p>`;
  if(!d.weeks)return `<div class="ptime">${thisWeek}<p class="small muted">Ongoing: the plan keeps adapting with no end date. Games on your calendar still shape each week.</p></div>`;
  const days=d.weeks*7,end=VB.addDays(st,days-1),pct=ds=>Math.max(0,Math.min(100,VB.daysBetween(st,ds)/days*100));
  const fromOutline=(d.outline||[]).map(x=>{const m=/^Weeks? (\d+)(?: (?:to|-|–) (\d+))?:\s*(.+)$/i.exec(x);return m?{name:cap(m[3].replace(/\s+(with|then)\b.*$/i,"").replace(/[\s.,;:]+$/,"")),full:m[3],from:+m[1],to:+(m[2]||m[1])}:null;}).filter(Boolean);
  const phases=d.phases||(fromOutline.length&&fromOutline[0].from===1?fromOutline:[{name:"Program",from:1,to:d.weeks}]);
  const ticks=Array.from({length:d.weeks},(_,i)=>`<span class="${i+1===wk&&!ap.finished?"on":""}">W${i+1}</span>`).join("");
  const segs=phases.map((f,i)=>{const a=VB.addDays(st,(f.from-1)*7),b=VB.addDays(st,f.to*7-1),on=t>=a&&t<=b;
    return `<div class="pseg ${on?"on":""} ${t>b?"past":""}" style="flex:${f.to-f.from+1}" title="${esc(f.full||f.focus||f.name)}"><b>${esc(f.name)}</b><span>${esc(VB.shortDate(a))} – ${esc(VB.shortDate(b))}</span></div>`;}).join("");
  const gm=c.games().filter(e=>c.endOf(e)>=st&&e.date<=end).map(e=>`<i class="pgame" style="left:${pct(e.date)}%" title="${esc((c.KINDS[e.kind]||"Match")+(e.name?": "+e.name:"")+" · "+VB.shortDate(e.date))}"></i>`).join("");
  const now=t>=st&&t<=end?`<i class="pnow" style="left:${pct(t)}%"><span>Today</span></i>`:"";
  return `<div class="ptime">${thisWeek}<div class="ptrack">${segs}${gm}${now}</div><div class="pticks">${ticks}</div>
    <div class="row small muted" style="justify-content:space-between"><span>${esc(longDate(st))}</span><span>${t>end?"Ended":"Ends"} ${esc(longDate(end))}</span></div>
    ${gm?`<p class="small muted"><i class="pgame inl"></i> games on your calendar: the plan tapers around them inside the program.</p>`:""}</div>`;}
function scrollCal(){const c=$("#calCard");if(c)c.scrollIntoView({behavior:VB.reduced?"auto":"smooth",block:"start"});}
VB.calUI={render,progTimeline};
document.addEventListener("click",e=>{const a=e.target.closest("[data-calgo]");if(!a)return;const ds=a.dataset.calgo;CS.view="month";CS.sel=ds;CS.ym=ymOf(ds);CS.edit=null;CS.draft=null;setTimeout(()=>{render();scrollCal();},150);});
if(VB.v3&&VB.v3.onRoute)VB.v3.onRoute(v=>{if(v==="progress")render();});
if(VB.v3&&VB.v3.onSave)VB.v3.onSave(()=>{if(((location.hash.replace("#","")||"today").split("/")[0])==="progress")render();});
setTimeout(()=>{if((location.hash.replace("#","")||"today").split("/")[0]==="progress")render();},120);
})();
