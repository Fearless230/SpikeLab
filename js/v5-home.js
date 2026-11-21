/* v5-home.js: the Home (Today) redesign and the systems behind it.
   Readiness check-in · XP and player levels · daily challenge · broadcast-style HUD in the hero ·
   mission board (session ticket, quick actions, 12-week training map, tip of the day) · Progress additions.
   Loaded after v3.js and v4.js; uses their hooks and only touches the DOM it creates. */
(function(){
"use strict";
const VB=window.VB,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s)),esc=VB.esc;
const S=()=>VB.state;
const view=()=>(location.hash||"#today").slice(1).split("/")[0]||"today";
const toast=m=>(VB.v3&&VB.v3.toast?VB.v3.toast(m):VB.ui&&VB.ui.toast&&VB.ui.toast(m));
const RM=matchMedia("(prefers-reduced-motion: reduce)");
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
VB.v5=VB.v5||{};

/* ---------- small helpers shared with v5-tools.js ---------- */
const ICONS={
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
 board:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h18"/>',
 rotate:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
 film:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>',
 jump:'<circle cx="12" cy="4.5" r="2"/><path d="M8 21l2-6 2 2 2-2 2 6M6 10l6-2 6 2"/>',
 heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
 play:'<path d="M7 4v16l13-8z"/>',
 flame:'<path d="M12 22c4 0 7-2.8 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-5 5-5 8 0 4.2 3 7 7 7z"/>',
 star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'};
const ic=(n,cls)=>`<svg class="v5i ${cls||""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||""}</svg>`;
function spark(vals,w,h,opts){opts=opts||{};if(!vals||vals.length<2)return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="M0 ${h-2}H${w}" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 4"/></svg>`;
  const mn=Math.min(...vals),mx=Math.max(...vals),r=mx-mn||1,pts=vals.map((v,i)=>[i/(vals.length-1)*(w-4)+2,h-3-(v-mn)/r*(h-8)]);
  const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(""),last=pts[pts.length-1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}L${last[0]} ${h}L2 ${h}Z" fill="currentColor" fill-opacity=".14"/><path class="sl" pathLength="1" d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="3" fill="currentColor"/></svg>`;}
function ring(pct,size,stroke,cls){const r=(size-stroke)/2,c=2*Math.PI*r,off=c*(1-clamp(pct,0,1));
  return `<svg class="ring ${cls||""}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-width="${stroke}"/><circle class="rg" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" style="--c:${c.toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})"/></svg>`;}
function openModal(html,cls){const m=$("#modal");$("#mbody").innerHTML=html;m.className="modal "+(cls||"");m.hidden=false;document.body.classList.add("noscroll");setTimeout(()=>{const f=$("#mbody [data-autofocus]")||$("#modal .mclose");f&&f.focus();},30);return $("#mbody");}
const closeModal=()=>{if(VB.closeModal)VB.closeModal();else{$("#modal").hidden=true;document.body.classList.remove("noscroll");}};
Object.assign(VB.v5,{ic,spark,ring,openModal,closeModal,toast,view});

/* ================= readiness ================= */
const RQ=()=>window.VB_READY_Q||[];
const ready=()=>{const s=S();if(!s.ready||typeof s.ready!=="object")s.ready={};return s.ready;};
function readyScore(r){if(!r)return null;const q=RQ(),v={};q.forEach(x=>{const a=r[x.id];if(a==null)return;v[x.id]=x.opts?((x.opts.find(o=>o[0]===a)||[0,60])[1]):(a-1)/(x.scale-1)*100;});
  let s=(v.sleep??60)*.28+(v.quality??60)*.14+(v.energy??60)*.2+(v.legs??60)*.22+(v.stress??60)*.16;
  const ls=VB.loadStats();if(ls.acwr!=null&&ls.acwr>1.4)s-=8;
  return Math.round(clamp(s,0,100));}
const RLAB=s=>s==null?["No check-in","Tell the plan how you feel"]:s>=80?["Prime","Green light: push the main work"]:s>=65?["Ready","Train as planned"]:s>=50?["Steady","Normal session, keep quality high"]:["Recover","Lighter day: technique and recovery"];
const RCOL=s=>s==null?"#aeabd0":s>=80?"#4fd394":s>=65?"#9be15d":s>=50?"#ffc145":"#ff6b7d";
const feelFor=s=>s>=80?"fresh":s>=50?"normal":"beat";
VB.v5.readyToday=()=>{const r=ready()[VB.today()];return r?{...r,score:r.score??readyScore(r)}:null;};
function checkIn(){const cur=ready()[VB.today()]||{},q=RQ();
  const body=openModal(`<div class="v5ck"><div class="kicker">Readiness check-in · 20 seconds</div><h2 class="v5h">How ready are you today?</h2>
   <p class="small muted">Your answers set today's session: a high score keeps the full plan, a low one trims volume and swaps jumping for landing control.</p>
   <form id="v5ckf" class="v5ckf">${q.map(x=>`<fieldset class="v5q"><legend>${esc(x.label)}</legend><div class="v5opts" role="radiogroup">
     ${(x.opts?x.opts.map(o=>o[0]):Array.from({length:x.scale},(_,i)=>i+1)).map((o,i,arr)=>`<label class="v5o"><input type="radio" name="${x.id}" value="${o}" ${String(cur[x.id])===String(o)?"checked":""} ${i===0&&x.id==="sleep"?"data-autofocus":""}><span>${x.opts?esc(o)+" h":o}</span></label>`).join("")}</div>
     <div class="v5ends"><span>${esc(x.lo)}</span><span>${esc(x.hi)}</span></div></fieldset>`).join("")}
   <div class="v5ckout"><div class="v5ckring" id="v5ckRing"></div><div><b id="v5ckLab"></b><p class="small muted" id="v5ckSub"></p></div></div>
   <p class="err" id="v5ckErr" role="alert" hidden></p>
   <div class="row"><button class="btn primary" type="submit">Save and set today's session</button><button class="btn sm" type="button" data-close>Cancel</button></div></form></div>`,"v5modal");
  const f=$("#v5ckf",body),read=()=>{const r={};q.forEach(x=>{const el=f.querySelector(`input[name="${x.id}"]:checked`);if(el)r[x.id]=x.opts?el.value:+el.value;});return r;};
  const upd=()=>{const r=read(),n=Object.keys(r).length,s=n?readyScore(r):null,l=RLAB(s);$("#v5ckRing",body).innerHTML=`<div class="v5rr" style="color:${RCOL(s)}">${ring(s==null?0:s/100,74,7)}<b>${s==null?"--":s}</b></div>`;$("#v5ckLab",body).textContent=l[0];const ls=VB.loadStats();$("#v5ckSub",body).textContent=n<q.length?"Answer all "+q.length+" to save.":l[1]+(ls.acwr!=null&&ls.acwr>1.4?". Includes −8 because your last 7 days were "+Math.round(ls.acwr*100)+"% of your usual load.":".");};
  f.addEventListener("change",upd);upd();
  f.addEventListener("submit",e=>{e.preventDefault();const r=read();if(Object.keys(r).length<q.length){const er=$("#v5ckErr",body);er.textContent="Answer every question, it takes a few seconds.";er.hidden=false;return;}
    r.score=readyScore(r);r.at=Date.now();ready()[VB.today()]=r;const feel=feelFor(r.score);
    const prev=S().today&&S().today.plan.feel;VB.ensureToday(feel);if(prev&&prev!==feel)VB.log("Readiness "+r.score+": today's session set to "+({fresh:"fresh",normal:"normal",beat:"lighter"})[feel]+".","info");
    VB.save();closeModal();VB.ui.refresh&&VB.ui.refresh();toast("Readiness "+r.score+" · "+RLAB(r.score)[0]+". Today's session is set to match. +10 XP");});}
VB.v5.checkIn=checkIn;

/* ================= XP and levels ================= */
const LV=()=>window.VB_LEVELS||["Rookie"];
const cum=L=>250*L*(L+1)/2;
function xpInfo(){const st=S(),parts={Sessions:0,"Drill standards":0,Tests:0,Film:0,Matches:0,Challenges:0,"Check-ins":0,Badges:0},dm=VB.drMap();
  (st.sessions||[]).filter(s=>!s.ex).forEach(s=>{parts.Sessions+=100+Math.min(120,s.mins||0);(s.items||[]).forEach(it=>{if(it.k!=="drill"||!it.att)return;const d=dm[it.id],std=d&&d.score&&d.score.attempts?d.score.target/d.score.attempts:.7;if(it.suc/it.att>=std)parts["Drill standards"]+=20;});});
  parts.Tests=(st.tests||[]).filter(t=>t.kind==="vert"&&!t.ex).length*50;parts.Film=(st.film||[]).length*60;parts.Matches=(st.matches||[]).length*80;
  const CH=window.VB_CHALLENGES||[];Object.values(st.challenges||{}).forEach(id=>{const c=CH.find(x=>x.id===id);parts.Challenges+=c?c.xp:30;});
  parts["Check-ins"]=Object.keys(st.ready||{}).length*10;parts.Badges=Object.values(st.badges||{}).filter(Boolean).length*50;
  const xp=Object.values(parts).reduce((a,b)=>a+b,0);let L=Math.floor((Math.sqrt(1+8*xp/250)-1)/2);
  const lo=cum(L),hi=cum(L+1),names=LV();
  return {xp,parts,level:L+1,title:names[Math.min(L,names.length-1)],next:names[Math.min(L+1,names.length-1)],into:xp-lo,need:hi-lo,pct:(xp-lo)/(hi-lo)};}
VB.v5.xp=xpInfo;
let lastLevel=null;function levelWatch(){const x=xpInfo();if(lastLevel!=null&&x.level>lastLevel){toast("Level up! You are now level "+x.level+": "+x.title+".");VB.log("Level up: level "+x.level+", "+x.title+".","up");}lastLevel=x.level;}

/* ================= daily challenge ================= */
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function challengeFor(date){const lim=(S().profile&&S().profile.limits)||[],list=(window.VB_CHALLENGES||[]).filter(c=>!(c.avoid||[]).some(a=>lim.includes(a)));if(!list.length)return null;return list[hashStr("vb"+date)%list.length];}
const chDone=()=>{const s=S();if(!s.challenges||typeof s.challenges!=="object")s.challenges={};return s.challenges;};
function chStreak(){const d=chDone();let k=VB.today();if(!d[k])k=VB.addDays(k,-1);let n=0;while(d[k]){n++;k=VB.addDays(k,-1);}return n;}
VB.v5.challengeFor=challengeFor;

/* ================= data for the board ================= */
const vertTests=()=>(S().tests||[]).filter(t=>t.kind==="vert"&&!t.ex&&t.cm>=3&&t.cm<=130).sort((a,b)=>a.date<b.date?-1:1);
function dayLoad(){const m={};(S().sessions||[]).forEach(s=>{if(s.ex)return;const l=(s.mins||0)*(s.rpe||5);m[s.date]=(m[s.date]||0)+l;});return m;}
function nextEvent(){const t=VB.today();const ev=((S().season||{}).events||[]).filter(e=>e.date>=t).sort((a,b)=>a.date<b.date?-1:1)[0];return ev?{e:ev,d:VB.daysBetween(t,ev.date)}:null;}
const KIND={match:"Match",tournament:"Tournament",tryout:"Tryout"};
const BLOCKCOL={"Prep":"#9d86ff","Fix":"#ffc145","Skills":"var(--gold)","Power":"#ff8a3d","Strength":"#45c8ff","Arm care and core":"#4fd394"};

/* ---------- hero: chip row and HUD ---------- */
function greet(){const h=new Date().getHours();return h<5?"Late night":h<12?"Good morning":h<18?"Good afternoon":"Good evening";}
function heroChips(){const lead=$("#heroToday .lead");if(!lead)return;let row=$("#v5chips",lead);if(!row){row=document.createElement("div");row.id="v5chips";row.className="v5chips";lead.insertBefore(row,lead.firstChild);}
  const p=S().profile||{},n=nextEvent(),d=new Date();
  row.innerHTML=`<span class="v5chip live"><i class="dot"></i>${esc(d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}))} · ${esc(greet())}${p.name?", "+esc(p.name):""}</span>`+
   (n?`<span class="v5chip ev">${ic("trophy")}${n.d===0?esc(KIND[n.e.kind]||"Match")+" today":esc(KIND[n.e.kind]||"Match")+" in "+n.d+(n.d===1?" day":" days")}${n.e.name?" · "+esc(n.e.name):""}</span>`:"");}
function hud(){const host=$("#heroStrip");if(!host||!S().profile)return;const st=S(),p=st.profile,r=VB.v5.readyToday(),sc=r?r.score:null,lab=RLAB(sc);
  const wk=VB.weekly()[VB.weekStart(VB.today())]||{n:0,mins:0},T=vertTests(),vj=T.length?T[T.length-1].cm:null,first=T.length?T[0]:null,x=xpInfo(),strk=VB.streak(),cs=chStreak();
  const days=[];const ws=VB.weekStart(VB.today()),dl=dayLoad();for(let i=0;i<7;i++){const d=VB.addDays(ws,i);days.push(`<i class="${dl[d]?"on":""} ${d===VB.today()?"now":""}" title="${esc(VB.shortDate(d))}"></i>`);}
  const cnt=v=>`<i data-count="${v}">${v}</i>`,delta=vj!=null&&first&&T.length>1?Math.round(VB.lenOut(vj-first.cm)*10)/10:null;
  host.classList.add("v5hud");
  host.innerHTML=`<div class="h-ready" style="--rc:${RCOL(sc)}"><button type="button" class="h-ring" data-v5ready aria-label="Readiness check-in">${ring(sc==null?0:sc/100,78,7)}<b>${sc==null?"?":sc}</b></button>
     <span class="h-l">Readiness</span><span class="h-v">${esc(lab[0])}</span><button type="button" class="h-btn" data-v5ready>${r?"Update":"Check in"}</button></div>
   <div><span class="h-l">This week</span><b>${cnt(wk.n)}<small>/${p.days}</small></b><span class="h-dots" aria-hidden="true">${days.join("")}</span><span class="h-s">${wk.mins} of ${p.days*p.mins} min</span></div>
   <div><span class="h-l">Streak</span><b>${cnt(strk)}<small> wk</small></b><span class="h-s">${ic("flame","fl")} ${cs} day${cs===1?"":"s"} of challenges</span></div>
   <div class="h-vj"><span class="h-l">Vertical</span><b>${vj!=null?cnt(Math.round(VB.lenOut(vj))):"--"}<small> ${VB.lu()}</small></b>${spark(T.slice(-8).map(t=>t.cm),110,30)}<span class="h-s ${delta>0?"up":""}">${delta!=null?(delta>0?"+":"")+delta+" "+VB.lu()+" since "+VB.shortDate(first.date):"Log a jump test"}</span></div>
   <div class="h-lv"><span class="h-l">Level ${x.level}</span><b class="h-title">${esc(x.title)}</b><span class="h-xp"><i style="width:${(x.pct*100).toFixed(1)}%"></i></span><span class="h-s">${x.need-x.into} XP to ${esc(x.next)}</span></div>`;}

/* ---------- mission board ---------- */
function board(){const v=$("#v-today");if(!v||!S().profile)return;let el=$("#v5board");
  if(!el){el=document.createElement("div");el.id="v5board";el.className="wrap v5board";const anchor=$("#todayStat");anchor.parentNode.insertBefore(el,anchor);}
  const st=S(),t=st.today||VB.ensureToday(),plan=t.plan,ap=VB.activeProgram(),nd=Object.keys(t.done||{}).length,ni=plan.items.length;
  // session ticket
  const blocks=[...new Set(plan.items.map(i=>i.block))],bmin=b=>plan.items.filter(i=>i.block===b).reduce((a,i)=>a+(i.min||0),0),tot=blocks.reduce((a,b)=>a+bmin(b),0)||1;
  const exm=VB.exMap(),MI=window.VB_MUSCLE_INFO||{},reg={};plan.items.forEach(i=>{if(i.k!=="ex")return;const e=exm[i.id];(e&&e.primary||[]).forEach(m=>{const r=MI[m]&&MI[m].region;if(r)reg[r]=(reg[r]||0)+1;});});
  const regions=Object.entries(reg).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>e[0]),skills=[...new Set(plan.items.filter(i=>i.k==="drill").map(i=>VB.SKILLS[i.skill]).filter(Boolean))];
  const r=VB.v5.readyToday(),feelTxt={fresh:"Fresh: full volume",normal:"Normal volume",beat:"Lighter: about a third less"}[plan.feel]||"";
  const ticket=`<article class="v5card v5ticket"><div class="tk-top"><div><div class="kicker">Today's session · ${esc(ap.def.name)}</div>
     <h3 class="tk-h">Session ${st.sessions.filter(s=>!s.ex).length+1}<span>Week ${ap.week}${ap.def.weeks?" of "+ap.def.weeks:""}${ap.phase?" · "+esc(ap.phase.name||""):""}</span></h3></div>
     <div class="tk-min"><b>${plan.est}</b><span>min</span></div></div>
   <div class="tk-bar" role="img" aria-label="Time per block">${blocks.map(b=>`<i style="flex:${bmin(b)/tot};--bc:${BLOCKCOL[b]||"var(--gold)"}" title="${esc(b)}: ${bmin(b)} min"></i>`).join("")}</div>
   <ul class="tk-leg">${blocks.map(b=>`<li style="--bc:${BLOCKCOL[b]||"var(--gold)"}"><i></i>${esc(b)}<span>${plan.items.filter(i=>i.block===b).length} · ${bmin(b)} min</span></li>`).join("")}</ul>
   <div class="tk-tags">${regions.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}${skills.map(x=>`<span class="tag sk">${esc(x)}</span>`).join("")}<span class="tag fl">${esc(feelTxt)}${r?" · readiness "+r.score:""}</span></div>
   <div class="tk-prog"><span><b>${nd}</b> of ${ni} done</span><div class="meter"><i style="width:${ni?nd/ni*100:0}%"></i></div></div>
   <div class="row"><button type="button" class="btn primary" data-guided>${ic("play")} ${nd?"Continue guided session":"Start guided session"}</button><a class="btn sm" href="#today" data-v5scroll>See every item</a>${r?"":`<button type="button" class="btn sm" data-v5ready>${ic("heart")} Check in first</button>`}</div></article>`;
  // challenge
  const ch=challengeFor(VB.today()),done=chDone()[VB.today()],strk=chStreak();
  const chal=ch?`<article class="v5card v5chal ${done?"done":""}"><div class="kicker">${ic("bolt")} Daily challenge · ${esc(ch.kind)}</div>
     <h3>${esc(ch.name)}</h3><p>${esc(ch.target)}</p><p class="small muted">Tip: ${esc(ch.tip)}</p>
     <div class="ch-foot"><span class="xpb">+${ch.xp} XP</span><span class="small muted">${ic("flame","fl")} ${strk} day streak</span></div>
     <div class="row">${done?`<span class="ch-ok">${ic("check")} Done today</span><button type="button" class="btn sm" data-v5chundo>Undo</button>`:`<button type="button" class="btn primary sm" data-v5ch>${ic("check")} Mark done</button>`}${ch.link?`<a class="btn sm" href="${ch.link}">Open</a>`:""}</div></article>`:"";
  // quick actions
  const QA=[["play","Guided session","Step by step with timers","data-guided"],["heart","Readiness","20-second check-in","data-v5ready"],["timer","Interval timer","Tabata, EMOM, custom","href=\"#tools/timer\""],["board","Match tracker","Live stats, hitting %","href=\"#tools/match\""],
    ["rotate","Rotations","5-1, 6-2 and 4-2","href=\"#tools/rotations\""],["calc","Calculators","Touch, jump, ratings","href=\"#tools/calc\""],["film","Film a rep","Track your joints","href=\"#film\""],["book","Rules and terms","Look anything up","href=\"#tools/rules\""]];
  const qa=`<nav class="v5qa" aria-label="Quick actions">${QA.map(([i,t,s,a],k)=>`<${a.startsWith("href")?"a":"button type=\"button\""} class="qa" ${a} style="--k:${k}"><span class="qi">${ic(i)}</span><b>${esc(t)}</b><small>${esc(s)}</small></${a.startsWith("href")?"a":"button"}>`).join("")}</nav>`;
  // heat map
  const heat=heatmap(12,"v5heat");
  // tip
  const tips=window.VB_TIPS||[],tip=tips.length?tips[hashStr("tip"+VB.today())%tips.length]:null;
  const tipc=tip?`<article class="v5card v5tip"><div class="kicker">${ic("star")} Coach's tip · ${esc(tip[0])}</div><p class="tipq">${esc(tip[1])}</p><a class="small" href="#tools/rules">Rules and glossary</a></article>`:"";
  el.innerHTML=`<div class="v5grid"><div class="g-ticket">${ticket}</div><div class="g-chal">${chal}</div><div class="g-qa">${qa}</div><div class="g-heat"><article class="v5card"><div class="row" style="justify-content:space-between;align-items:baseline"><div class="kicker">Training map · last 12 weeks</div><a class="small" href="#progress">Full history</a></div>${heat}</article></div><div class="g-tip">${tipc}</div></div>`;}
function heatmap(weeks,cls){const dl=dayLoad(),ws=VB.weekStart(VB.today()),start=VB.addDays(ws,-(weeks-1)*7),vals=Object.values(dl),mx=Math.max(1,...vals),ready_=S().ready||{},ch=S().challenges||{};
  let cols="",total=0,act=0;for(let w=0;w<weeks;w++){let c="";for(let d=0;d<7;d++){const day=VB.addDays(start,w*7+d),l=dl[day]||0,fut=day>VB.today();if(l){act++;total+=l;}
      const lv=l?Math.min(4,1+Math.floor(l/mx*3.999)):0;c+=`<i class="l${lv} ${fut?"fut":""} ${day===VB.today()?"now":""} ${ch[day]?"ch":""}" title="${esc(VB.shortDate(day))}${l?" · load "+l:""}${ch[day]?" · challenge done":""}${ready_[day]?" · readiness "+(ready_[day].score??""):""}"></i>`;}
    cols+=`<div class="hc">${c}</div>`;}
  return `<div class="${cls} heat"><div class="hd" aria-hidden="true"><span>M</span><span></span><span>W</span><span></span><span>F</span><span></span><span>S</span></div><div class="hg" role="img" aria-label="${act} active days in the last ${weeks} weeks">${cols}</div></div>
   <div class="heatleg small muted"><span>${act} active days</span><span class="hl">Less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> More</span><span><i class="dotc"></i> challenge</span></div>`;}
VB.v5.heatmap=heatmap;

/* ---------- entry point, called at the end of renderToday ---------- */
VB.v5.today=function(){if(!S().profile)return;try{heroChips();hud();board();levelWatch();}catch(e){console.error("v5 today",e);}};
// the first render ran before this file loaded
setTimeout(()=>{if(view()==="today"&&!$("#v-today").hidden){VB.v5.today();VB.ui.countUp&&VB.ui.countUp($("#heroStrip"));}},0);

/* ---------- events ---------- */
document.addEventListener("click",e=>{const b=e.target.closest("[data-v5ready],[data-v5ch],[data-v5chundo],[data-v5scroll]");if(!b)return;
  if(b.matches("[data-v5ready]")){e.preventDefault();checkIn();return;}
  if(b.matches("[data-v5scroll]")){e.preventDefault();const m=$("#todayMain");m&&m.scrollIntoView({behavior:RM.matches?"auto":"smooth",block:"start"});return;}
  if(b.matches("[data-v5ch]")){const c=challengeFor(VB.today());if(!c)return;chDone()[VB.today()]=c.id;VB.log("Daily challenge done: "+c.name+".","up");VB.save();board();hud();toast("Challenge done. +"+c.xp+" XP");levelWatch();return;}
  if(b.matches("[data-v5chundo]")){delete chDone()[VB.today()];VB.save();board();hud();}});
if(VB.v3&&VB.v3.onSave)VB.v3.onSave(()=>{if(view()==="today"&&S().profile){try{hud();board();levelWatch();}catch(e){}}if(view()==="progress")progress();});

/* ================= Progress: training map, readiness trend, level breakdown ================= */
let rChart=null;
function progress(){const host=$("#v-progress .wrap.section");if(!host||!S().profile)return;let el=$("#v5prog");
  if(!el){el=document.createElement("div");el.id="v5prog";el.className="v5prog";const g=$(".v3grid",host)||$("#tiles",host);g.parentNode.insertBefore(el,g.nextSibling);}
  const x=xpInfo(),R=ready(),keys=Object.keys(R).sort().slice(-30);
  el.innerHTML=`<article class="card v5wide"><div class="row" style="justify-content:space-between;align-items:baseline"><h3>Training map</h3><span class="small muted">26 weeks · darker means more load (minutes × effort)</span></div>${heatmap(26,"v5heat big")}</article>
   <article class="card"><h3>Readiness trend</h3><p class="small muted">${keys.length?"Your last "+keys.length+" check-ins. Low scores two days running? Sleep and load are the first things to look at.":"Check in from the Home screen to start your trend."}</p>${keys.length?`<div class="chartbox"><canvas id="v5rc"></canvas></div>`:`<button type="button" class="btn sm primary" data-v5ready>Check in now</button>`}</article>
   <article class="card v5lv"><h3>Level ${x.level}: ${esc(x.title)}</h3><div class="lvbar"><i style="width:${(x.pct*100).toFixed(1)}%"></i></div><p class="small muted">${x.xp.toLocaleString()} XP total · ${x.need-x.into} to ${esc(x.next)}</p>
     <ul class="xpl">${Object.entries(x.parts).filter(p=>p[1]).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<li><span>${esc(k)}</span><b>${v.toLocaleString()}</b></li>`).join("")||"<li><span>Finish a session to earn XP</span></li>"}</ul>
     <p class="small muted">XP: session 100 + 1 per minute · drill standard met 20 · jump test 50 · film 60 · match 80 · challenges 20 to 60 · check-in 10 · badge 50.</p></article>`;
  const cv=$("#v5rc",el);if(window.Chart&&cv&&keys.length){if(rChart){try{rChart.destroy();}catch(e){}}const css=getComputedStyle(document.documentElement),ink=css.getPropertyValue("--muted").trim()||"#888",line=css.getPropertyValue("--line").trim()||"#333";
    rChart=new Chart(cv,{type:"line",data:{labels:keys.map(k=>VB.shortDate(k)),datasets:[{label:"Readiness",data:keys.map(k=>R[k].score??readyScore(R[k])),borderColor:"#4fd394",backgroundColor:"rgba(79,211,148,.15)",fill:true,tension:.35,pointRadius:3}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,ticks:{color:ink},grid:{color:line}},x:{ticks:{color:ink,maxRotation:0,autoSkip:true},grid:{display:false}}}}});}}
VB.v5.progress=progress;
if(VB.v3&&VB.v3.onRoute)VB.v3.onRoute(v=>{if(v==="progress")setTimeout(progress,30);});
new MutationObserver(()=>{if(view()==="progress"&&$("#seasonCard")&&!$("#v5prog"))progress();}).observe(document.body,{childList:true,subtree:true});
})();
