/* ui.js: views, forms, charts, routing. */
(function(){
"use strict";
const VB=window.VB,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],esc=VB.esc;
const MI=window.VB_MUSCLE_INFO||{},CH=window.VB_CHAINS||{},EXS=window.VB_EXERCISES||[],DRS=window.VB_DRILLS||[],TECHS=window.VB_TECHS||[];
const T=Object.fromEntries(TECHS.map(t=>[t.id,t]));
const XD=window.VB_EX_DETAIL||{},MM=window.VB_MUSCLE_MORE||{},PG=window.VB_PROGRAMS||{},GD=window.VB_GUIDE||{};
const S=()=>VB.state;
VB.ui={};VB.ui.readItem=(el,it)=>readItem(el,it);
const THEMES={
 outside:{c:"#ec3b52",rgb:"236,59,82",ink:"#ffffff",t:["Own","the pin"],line:"Pass it. Hit it. Carry the rotation."},
 opposite:{c:"#f5a524",rgb:"245,165,36",ink:"#17144d",t:["Bring","the heat"],line:"Right side. Big swings. Bigger blocks."},
 middle:{c:"#20c4b4",rgb:"32,196,180",ink:"#17144d",t:["Rule","the net"],line:"First to the ball. First off the floor."},
 setter:{c:"#8a5cff",rgb:"138,92,255",ink:"#ffffff",t:["Run","the show"],line:"Every second ball is yours. Make it perfect."},
 libero:{c:"#ff5fa2",rgb:"255,95,162",ink:"#ffffff",t:["Nothing","drops"],line:"Read it. Reach it. Keep it alive."},
 any:{c:"#ec3b52",rgb:"236,59,82",ink:"#ffffff",t:["Earn","every point"],line:"Learn every skill. Find your place on the court."}};
VB.THEMES=THEMES;
const theme=()=>THEMES[(VB.state.profile&&VB.state.profile.pos)||"any"]||THEMES.any;

/* ---------- toast ---------- */
let toastT=0,undoFn=null;
function toast(msg,undo){$("#toastMsg").textContent=msg;undoFn=undo||null;$("#toastUndo").hidden=!undo;$("#toast").hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{$("#toast").hidden=true;},5000);}
$("#toastUndo").onclick=()=>{if(undoFn)undoFn();$("#toast").hidden=true;};
VB.onSync=s=>{const el=$("#sync");el.dataset.s=s;el.textContent=s==="cloud"?"Saved to your account":s==="device"?"Saved in this browser":"Loading";};

/* ---------- routing ---------- */
const VIEWS=["today","body","skills","film","plan","squad","progress","profile","tools"];
let pendingScan=null;
let view="today";
function route(){let h=location.hash.replace("#","");
  if(/^p-/.test(h)){pendingScan=VB.decId(h.slice(2));h=S().profile?"squad":"";try{history.replaceState(null,"","#"+h);}catch(e){}if(VB.net!==undefined)setTimeout(openPending,50);}
  VB.subview=h.split("/")[1]||"";h=h.split("/")[0];
  if(!S().profile){view="start";}else view=VIEWS.includes(h)?h:"today";
  ["start",...VIEWS].forEach(v=>{$("#v-"+v).hidden=v!==view;});
  $("#nav").hidden=!S().profile;
  $$("#nav a,#pbtn").forEach(a=>{if(a.dataset.v===view)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});$("#pbtn").hidden=!S().profile;
  if(view==="squad")VB.squad.refresh();
  placeForm();
  if(view==="today"){renderToday();countUp($("#heroStrip"));}
  if(view==="plan")renderPlan();
  if(view==="today"||view==="start"){VB.hero.mount($(view==="today"?"#heroToday":"#heroStart"));VB.hero.set(view==="start"?"any":((S().profile&&S().profile.pos)||"any"),theme().c);}
  if(view==="body"){renderBody();VB.body.show();}
  if(view==="skills"){renderSkills();VB.court.show();}
  if(view==="film")VB.film.refresh();
  if(view==="progress")renderProgress();
  if(view==="profile"){renderReach();VB.profile.render();}
  if(view==="tools"&&VB.tools)VB.tools.show(VB.subview);
  window.scrollTo(0,0);}
const WNAME={today:["Game","Day"],body:["Build","Your Body"],skills:["Learn","Skills"],film:["Film","Room"],plan:["Your","Programs"],squad:["Your","Squad"],progress:["Track","Progress"],profile:["Player","Card"],tools:["Your","Toolkit"],start:["Start","Journey"]};
const RM=matchMedia("(prefers-reduced-motion: reduce)");let wipeT=0,wiping=false;
function reveal(){const v=$("#v-"+view);if(!v)return;let i=0;
  $$(".wrap>h2,.wrap>.kicker,.card,.tile,.pcard,.board,.chips,.cols>*",v).forEach(el=>{if(el.closest(".modal")||el.classList.contains("in"))return;el.classList.add("rv");el.style.setProperty("--i",Math.min(i++,8));io?io.observe(el):el.classList.add("in");});}
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{rootMargin:"0px 0px -6% 0px"}):null;
function go(){const h=location.hash.replace("#",""),w=$("#wipe");
  if(RM.matches||!w||/^p-/.test(h)||!S().profile){route();reveal();return;}
  const hv=h.split("/")[0],n=WNAME[VIEWS.includes(hv)?hv:"today"]||["",""];$("#wO").textContent=n[0];$("#wS").textContent=n[1];
  clearTimeout(wipeT);w.classList.remove("go");void w.offsetWidth;w.classList.add("go");wiping=true;
  wipeT=setTimeout(()=>{route();reveal();wipeT=setTimeout(()=>{w.classList.remove("go");wiping=false;},460);},400);}
window.addEventListener("hashchange",go);window.addEventListener("hashchange",()=>{try{VB.checkUnlocks&&VB.checkUnlocks();}catch(e){}});
VB.ui.reveal=reveal;
/* outline words drift with scroll */
let dq=0;addEventListener("scroll",()=>{if(dq||RM.matches)return;dq=requestAnimationFrame(()=>{dq=0;const H=innerHeight;$$("#v-"+view+" h2 .o, #v-"+view+" .ptbig").forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom<0||r.top>H)return;const k=(r.top+r.height/2-H/2)/H;el.style.transform=`translateX(${(k*-60).toFixed(1)}px)`;});});},{passive:true});

/* ---------- profile form / wizard ---------- */
const form=$("#pform");let wizStep=0,formUnits="metric";
function optGroup(el,name,items){el.innerHTML=items.map(([v,b,s])=>`<label class="opt"><input type="radio" name="${name}" value="${v}" id="${name}-${v}"><div><b>${b}</b><small>${s||""}</small></div></label>`).join("");}
function chipGroup(el,items,name){el.innerHTML=items.map(([v,l])=>`<label class="chip"><input type="checkbox" name="${name}" value="${v}" id="${name}-${v}"><span>${l}</span></label>`).join("");}
optGroup($("#p-tier"),"tier",Object.entries(VB.TIER_INFO).map(([k,v])=>[k,v.name,v.sub]));
optGroup($("#p-partner"),"partner",Object.entries(VB.PLAYERS_INFO).map(([k,v])=>[k,v,""]));
chipGroup($("#p-goals"),VB.GOALS,"goal");chipGroup($("#p-limits"),VB.LIMITS,"limit");
const checked=n=>$$(`input[name="${n}"]:checked`).map(i=>i.value);
const radio=(n,v)=>{if(v===undefined){const c=$(`input[name="${n}"]:checked`);return c?c.value:null;}const el=$(`input[name="${n}"][value="${v}"]`);if(el)el.checked=true;};
function unitLabels(u){const i=u==="imperial";$$(".u-l").forEach(e=>e.textContent=i?"in":"cm");$$(".u-w").forEach(e=>e.textContent=i?"lb":"kg");$("#hm").hidden=i;$("#hi").hidden=!i;}
$("#p-units").onchange=e=>{const u=e.target.value;if(u===formUnits)return;const toI=u==="imperial";
  const cm=toI?+$("#p-height-cm").value:((+$("#p-height-ft").value||0)*12+(+$("#p-height-in").value||0))*2.54;
  if(cm){if(toI){const inch=cm/2.54;$("#p-height-ft").value=Math.floor(inch/12);$("#p-height-in").value=Math.round((inch%12)*2)/2;}else $("#p-height-cm").value=Math.round(cm);}
  const w=$("#p-weight");if(w.value)w.value=Math.round((toI?w.value*2.2046:w.value/2.2046)*10)/10;
  ["p-reach","p-jump"].forEach(id=>{const f=$("#"+id);if(f.value)f.value=Math.round((toI?f.value/2.54:f.value*2.54)*10)/10;});
  formUnits=u;$$(".u-l,.u-w").length&&unitLabels(u);};
function fillProfile(){const p=S().profile;formUnits=p?p.units||"metric":"metric";$("#p-units").value=formUnits;unitLabels(formUnits);
  if(!p){radio("tier","none");radio("partner","solo");return;}
  $("#p-name").value=p.name||"";$("#p-number").value=p.number==null?"":p.number;$("#p-age").value=p.age||"";
  if(p.units==="imperial"){const inch=p.height/2.54;$("#p-height-ft").value=Math.floor(inch/12);$("#p-height-in").value=Math.round((inch%12)*2)/2;}else $("#p-height-cm").value=Math.round(p.height);
  $("#p-weight").value=VB.wOut(p.weight);$("#p-hand").value=p.hand||"right";$("#p-exp").value=p.exp;$("#p-years").value=p.years==null?"":p.years;$("#p-pos").value=p.pos;$("#p-net").value=String(p.net||2.43);
  $("#p-reach").value=p.reach==null?"":VB.lenOut(p.reach);$("#p-jump").value=p.jump==null?"":VB.lenOut(p.jump);$("#p-days").value=p.days;$("#p-mins").value=p.mins;
  radio("tier",p.tier||"none");radio("partner",p.partner||"solo");{const lk=p.look||{};radio("lskin",lk.skin||"#c98d68");radio("lhair",lk.hair||"#2b1d16");radio("lstyle",lk.style||"short");}lookPreview();
  [["goal",p.goals],["limit",p.limits]].forEach(([n,a])=>$$(`input[name="${n}"]`).forEach(i=>i.checked=(a||[]).includes(i.value)));}
function readProfile(){const u=$("#p-units").value,i=u==="imperial",num=id=>{const v=$("#"+id).value;return v===""?null:+v;};
  const h=i?((+$("#p-height-ft").value||0)*12+(+$("#p-height-in").value||0))*2.54:+$("#p-height-cm").value,w=num("p-weight"),r=num("p-reach"),j=num("p-jump");
  return {name:$("#p-name").value.trim().slice(0,40),number:num("p-number"),age:num("p-age"),units:u,height:h||null,weight:w==null?null:(i?w/2.2046:w),hand:$("#p-hand").value,exp:$("#p-exp").value,years:num("p-years"),
    pos:$("#p-pos").value,net:+$("#p-net").value,reach:r==null?null:(i?r*2.54:r),jump:j==null?null:(i?j*2.54:j),days:+$("#p-days").value,mins:+$("#p-mins").value,
    tier:radio("tier")||"none",partner:radio("partner")||"solo",goals:checked("goal"),limits:checked("limit"),look:Object.assign({},(S().profile||{}).look||{},{skin:radio("lskin")||"#c98d68",hair:radio("lhair")||"#2b1d16",style:radio("lstyle")||"short"})};}
/* live preview of your player while you choose the look */
let LP=null;function lookPreview(){const cv=$("#lookPrev");if(!cv||!VB.GL||!VB.Athlete)return;try{if(!LP){const R=VB.GL.renderer(cv,{alpha:true});if(!R)return;R.setSize(150,205,2);LP={R};}
  const lk={skin:radio("lskin")||"#c98d68",hair:radio("lhair")||"#2b1d16",style:radio("lstyle")||"short"},th=theme(),G=VB.GL,root=new G.Node(),pl=VB.Athlete.player({...VB.lookOpts(Object.assign({},(S().profile||{}).look,lk)),clip:"ready",ball:false,jersey:th.c,accent:"#ffffff",number:+$("#p-number").value||7,lefty:$("#p-hand").value==="left"});
  root.add(pl.root);LP.R.render({root,clear:[0,0,0,0],light:{sky:[.8,.78,1],gnd:[.15,.1,.3],d1:[.4,1,.8],c1:[1,.96,.92],d2:[-.6,.3,-.6],c2:[.5,.35,1],rim:[.7,.5,1]}},{fov:26,pos:[3.6,1.55,2.4],target:[0,1.02,0],near:.1,far:20});}catch(e){}}
form.addEventListener("change",e=>{if(/^(lskin|lhair|lstyle)$/.test(e.target.name)||e.target.id==="p-hand"||e.target.id==="p-number")lookPreview();});
function stepErrors(step,p){const m=[];
  if(step===0||step==null){if(p.age==null||p.age<8||p.age>90)m.push("age");if(!p.height||p.height<100||p.height>230)m.push("height");if(!p.weight)m.push("weight");}
  if(step===1||step==null){if(!p.exp)m.push("experience");if(!p.pos)m.push("position");if(p.jump!=null&&(p.jump<3||p.jump>130))m.push("vertical jump (between "+VB.lenOut(3)+" and "+VB.lenOut(130)+" "+VB.lu()+")");if(p.reach!=null&&(p.reach<140||p.reach>330))m.push("standing reach (between "+VB.lenOut(140)+" and "+VB.lenOut(330)+" "+VB.lu()+")");}return m;}
function wizShow(){const wiz=!S().profile;form.className="wiz "+(wiz?"steps":"all");
  $$("fieldset",form).forEach(f=>f.hidden=wiz&&+f.dataset.step!==wizStep);
  $("#wizDots").hidden=!wiz;$("#wizDots").innerHTML=[0,1,2,3].map(i=>`<i class="${i<=wizStep?"on":""}"></i>`).join("");
  $("#wizBack").hidden=!wiz||wizStep===0;$("#wizNext").hidden=!wiz||wizStep===3;$("#wizSave").hidden=wiz&&wizStep!==3;$("#wizSave").textContent=wiz?"Build my plan":"Save changes";}
function placeForm(){const host=S().profile?$("#profHost"):$("#wizHost");if(form.parentNode!==host){host.appendChild(form);form.hidden=false;fillProfile();}wizShow();}
$("#wizNext").onclick=()=>{const miss=stepErrors(wizStep,readProfile()),err=$("#perr");if(miss.length){err.textContent="Add your "+miss.join(" and ")+" to continue.";err.hidden=false;return;}err.hidden=true;wizStep++;wizShow();};
$("#wizBack").onclick=()=>{wizStep=Math.max(0,wizStep-1);$("#perr").hidden=true;wizShow();};

form.addEventListener("submit",e=>{e.preventDefault();const p=readProfile(),miss=stepErrors(null,p),err=$("#perr");
  if(miss.length){err.textContent="Add your "+miss.join(", ")+" so the plan can be built.";err.hidden=false;if(!S().profile){wizStep=miss.includes("height")||miss.includes("weight")?0:1;wizShow();}return;}
  err.hidden=true;const st=S(),first=!st.profile;st.profile=p;
  if(first){st.blockStart=VB.today();if(!st.muscles.length)st.muscles=VB.rankMuscles().slice(0,10).map(x=>x.id);
    if(p.jump!=null&&p.jump>=3&&p.jump<=130)st.tests.push({date:VB.today(),kind:"vert",cm:p.jump,src:"profile"});
    VB.log("Plan created for "+VB.POS[p.pos].label.toLowerCase()+", "+p.days+" sessions a week, equipment: "+VB.TIER_INFO[p.tier].name.toLowerCase()+".","info");}
  else VB.log("Profile updated. Your next session was rebuilt.","info");
  VB.invalidatePlan();VB.save();applyProfile();
  if(first){location.hash="#today";route();}else{toast("Profile saved.");renderReach();}});
function applyProfile(){const p=S().profile,th=theme(),rs=document.documentElement.style;rs.setProperty("--gold",th.c);rs.setProperty("--gold-rgb",th.rgb);rs.setProperty("--gold-ink",th.ink);if(VB.hero&&p)VB.hero.set(p.pos||"any",th.c);$("#pbtnLabel").textContent=p&&p.name?p.name.split(/\s+/)[0]+(p.number!=null?" · "+p.number:""):"Profile";VB.court.setNet(p?p.net:2.43);unitLabels(p?p.units:"metric");}
function renderReach(){const p=S().profile,rc=$("#reachCard");if(!p)return;const t=S().tests.filter(x=>x.kind==="vert").sort((a,b)=>a.date<b.date?-1:1),j=t.length?t[t.length-1].cm:p.jump;
  if(p.reach&&j){const touch=p.reach+j,diff=touch-p.net*100;rc.innerHTML=`<div class="kicker">Your reach against the net</div><div class="rec"><b class="num">${VB.lenOut(touch)} ${VB.lu()}</b><span>${VB.lenOut(Math.abs(diff))} ${VB.lu()} ${diff>=0?"above":"below"} a ${p.net.toFixed(2)} m net</span></div><p class="small muted">${diff>=20?"Enough to attack downward and press over on the block.":diff>=0?"You clear the tape. Every extra centimetre opens sharper angles.":"Until the jump comes up, win with tips, roll shots and tough serving."}</p>`;}
  else rc.innerHTML=`<div class="kicker">Your reach against the net</div><p class="small muted">Add your standing reach and a vertical jump to see how far above the tape you touch.</p>`;}
let resetArmed=false;
$("#resetAll").onclick=()=>{resetArmed=!resetArmed;$("#resetYes").hidden=!resetArmed;$("#resetAll").textContent=resetArmed?"Cancel":"Erase all my data";};
$("#resetYes").onclick=()=>{VB.reset();resetArmed=false;$("#resetYes").hidden=true;$("#resetAll").textContent="Erase all my data";wizStep=0;form.reset();applyProfile();location.hash="";route();};

/* ---------- today ---------- */
let lastChanges=null;const pend={};
const unitTxt=e=>(e.unit==="s"?" s":e.unit==="m"?" m":"")+(e.perSide?" each side":"");
function itemHTML(it,done){const d=done[it.key];
  if(it.k==="ex"){const e=VB.exMap()[it.id];if(!e)return"";const feel=d?d.feel:(pend[it.key]||"right"),load=e.loadable&&e.tier!=="none";
    const mo=VB.exMotion?VB.exMotion.html(e.id,"",84):"";
    return `<div class="item ${d?"done":""} ${mo?"hasmo":""}" data-key="${it.key}"><button type="button" class="check" data-act="toggle" aria-pressed="${!!d}" aria-label="Mark ${esc(e.name)} done">✓</button><div>
      <div class="iname">${esc(e.name)}<span class="dose">${it.sets} × ${it.reps}${unitTxt(e)}</span>${it.flag?'<span class="pill hot">Loads a flagged area</span>':""}</div>
      <div class="why">${esc(it.why)}</div>
      <div class="ins" data-ins><input type="number" min="0" max="10" value="${d?d.sets:it.sets}" data-f="sets" aria-label="Sets done"> sets × <input type="number" min="0" max="300" value="${d?d.reps:it.reps}" data-f="reps" aria-label="${e.unit==="s"?"Seconds":"Reps"} per set">${e.unit==="s"?" s":e.unit==="m"?" m":" reps"}
        ${load?`<input type="number" min="0" step="0.5" value="${d&&d.load!=null?VB.wOut(d.load):it.load!=null?VB.wOut(it.load):""}" data-f="load" aria-label="Load" placeholder="${VB.wu()}"> ${VB.wu()}`:""}
        <span class="seg" role="group" aria-label="How it felt">${[["easy","Easy"],["right","Right"],["hard","Hard"]].map(([k,l])=>`<button type="button" data-act="feel" data-v="${k}" aria-pressed="${feel===k}">${l}</button>`).join("")}</span></div>
      <details><summary>How to do it</summary>${exHow(e)}<p class="small muted">${esc(it.chainName)} · step ${e.step}${e.equip&&e.equip.length?" · needs "+esc(e.equip.join(", ")):" · no equipment"} · works ${e.primary.map(m=>MI[m]?MI[m].common.toLowerCase():m).join(", ")}</p></details></div>${mo?`<div class="mo" aria-hidden="false">${mo}<span class="molbl">${e.unit==="s"?"Hold":"Watch"}</span></div>`:""}</div>`;}
  const dr=VB.drMap()[it.id];if(!dr)return"";
  return `<div class="item ${d?"done":""}" data-key="${it.key}"><button type="button" class="check" data-act="toggle" aria-pressed="${!!d}" aria-label="Mark ${esc(dr.name)} done">✓</button><div>
    <div class="iname">${esc(dr.name)}<span class="dose">${dr.minutes} min · level ${dr.level}</span></div>
    <div class="why">${esc(it.why)}</div>
    <div class="ins" data-ins>Score <input type="number" min="0" max="${dr.score.attempts}" value="${d?d.suc:""}" data-f="suc" aria-label="Your score" placeholder="0"> / ${dr.score.attempts} <span>standard ${dr.score.target} · ${esc(dr.score.label)}</span></div>
    <details><summary>How to run it</summary><p class="small" style="margin-top:6px">${esc(dr.setup)}</p><ol class="steps small">${dr.run.map(r=>`<li>${esc(r)}</li>`).join("")}</ol><p class="small" style="margin-top:6px"><button type="button" class="linkbtn" data-drill="${dr.id}">Open the 3D diagram and coaching cues</button></p></details></div></div>`;}
function exHow(e){const d=XD[e.id],big=VB.exMotion&&VB.exMotion.has(e.id)?`<div class="mobig">${VB.demo3d?VB.demo3d.block(e.id,220):VB.exMotion.html(e.id,"big",220)}<p class="small muted">Coral marks the muscles doing the work. The dotted line traces the path of the moving part.</p></div>`:"";if(!d)return big+`<p class="small" style="margin-top:6px">${esc(e.cue)}</p>`;
  return `<div class="howto">${big}<p>${esc(d.setup)}</p><ol class="steps">${d.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
   <div class="g2"><div><div class="grp">Watch for</div><ul class="plain">${d.errors.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
   <div><div class="grp">You should feel</div><p>${esc(d.feel)}</p>${d.tempo?`<div class="grp" style="margin-top:8px">Tempo and rest</div><p>${esc(d.tempo)}</p>`:""}<div class="grp" style="margin-top:8px">On court</div><p>${esc(d.court)}</p></div></div></div>`;}
function guideCard(g,open){if(!g)return"";return `<details class="card" ${open?"open":""}><summary>${esc(g.name)} · ${g.minutes} min</summary><ol class="steps small" style="margin-top:10px">${g.steps.map(x=>`<li><b>${esc(x.name)}.</b> ${esc(x.detail)}</li>`).join("")}</ol></details>`;}
function readItem(el,it){const g=f=>{const i=$(`[data-f="${f}"]`,el);return i&&i.value!==""?+i.value:null;};
  if(it.k==="ex"){const f=$('[data-act="feel"][aria-pressed="true"]',el);return {sets:g("sets")||0,reps:g("reps")||0,load:g("load")!=null?VB.wIn(g("load")):null,feel:f?f.dataset.v:"right"};}
  const dr=VB.drMap()[it.id],v=g("suc");return {suc:Math.min(v||0,dr.score.attempts),att:v==null?0:dr.score.attempts};}
function renderToday(){const st=S(),p=st.profile;if(!p)return;const t=VB.ensureToday(),ph=VB.phase(),n=st.sessions.filter(s=>!s.ex).length,plan=t.plan;
  const ap=VB.activeProgram();
  $("#todayStat").textContent=`${ap.def.name} · Week ${ap.week}${ap.def.weeks?" of "+ap.def.weeks:""} · Session ${n+1} · About ${plan.est} min`;
  const th=theme(),tests=st.tests.filter(x=>x.kind==="vert"&&!x.ex&&x.cm>=3&&x.cm<=130).sort((a,b)=>a.date<b.date?-1:1),lt=tests.length?tests[tests.length-1]:null,vj=lt?lt.cm:null,wkN=(VB.weekly()[VB.weekStart(VB.today())]||{n:0}).n;
  $("#heroRole").textContent=VB.POS[p.pos].label+(p.number!=null?" · No. "+p.number:"");
  $("#todayTitle").innerHTML=`<span class="l1"><i>${esc(th.t[0])}</i></span><span class="l2"><i>${esc(th.t[1])}</i></span>`;
  $("#heroLine").textContent=th.line;
  $("#todaySub").textContent=(p.name?p.name+", session ":"Session ")+(n+1)+" is ready: about "+plan.est+" minutes, "+plan.items.length+" items. "+ph.info.note;
  const cnt=v=>`<i data-count="${v}">${v}</i>`;
  $("#heroStrip").innerHTML=`<div><b>${cnt(wkN)}<small>/${p.days}</small></b><span>Sessions this week</span><span>Week ${ap.week}${ap.def.weeks?" of "+ap.def.weeks:""} of your program</span></div><div><b>${cnt(VB.streak())}<small> wk</small></b><span>Week streak</span><span>${VB.streak()?"Weeks at your target":"Hit "+p.days+" sessions to start one"}</span></div><div><b>${vj!=null?cnt(Math.round(VB.lenOut(vj))):"--"}<small> ${VB.lu()}</small></b><span>Vertical jump</span><span>${lt?({film:"From film",profile:"From your profile","film-airtime":"From air time"}[lt.src]||"Logged")+", "+VB.shortDate(lt.date):"Log a test to see it here"}</span></div><div><b>${cnt(plan.items.length)}<small> items</small></b><span>Today</span><span>About ${plan.est} min</span></div>`;
  $$("#feelSeg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.feel===plan.feel));
  const blocks=[...new Set(plan.items.map(i=>i.block))],nd=Object.keys(t.done).length;
  let html="";
  if(lastChanges)html+=`<div class="card" style="border-color:var(--good)"><div class="row" style="justify-content:space-between"><div class="kicker" style="color:var(--good)">Session saved · what changed for next time</div><button type="button" class="btn sm" data-act="dismiss">Dismiss</button></div>${lastChanges.length?lastChanges.map(logHTML).join(""):`<p class="small muted">No changes this time. Same targets next session.</p>`}</div>`;
  html+=plan.notes.map(x=>`<div class="note">${esc(x)}</div>`).join("");
  html+=guideCard(GD.warmup);
  html=`<div class="todaybar"><span><b id="tbN">${nd}</b> of ${plan.items.length} done</span><div class="meter"><i id="tbBar" style="width:${plan.items.length?nd/plan.items.length*100:0}%"></i></div><a class="linkbtn" href="#plan">${esc(ap.def.name)}</a></div>`+html;
  html+=blocks.map(b=>`<div class="block" data-b="${b}"><div class="kicker">${b}</div>${plan.items.filter(i=>i.block===b).map(i=>itemHTML(i,t.done)).join("")}</div>`).join("");
  html+=guideCard(GD.cooldown);
  html+=`<form class="card" id="finForm" novalidate><div class="kicker">Finish · ${nd} of ${plan.items.length} done</div>
    <div class="grid"><label class="f">Minutes trained<input id="fin-mins" type="number" min="5" max="400" value="${p.mins}" inputmode="numeric"></label>
    <label class="f">Effort, 1 easy to 10 max<input id="fin-rpe" type="number" min="1" max="10" value="6" inputmode="numeric"></label>
    <label class="f"><span>Vertical jump today (${VB.lu()})${ph.week===4?" · retest week":""}</span><input id="fin-jump" type="number" step="0.5" inputmode="decimal" placeholder="Optional"></label>
    <label class="f"><span>Body weight (${VB.wu()})</span><input id="fin-weight" type="number" step="0.1" inputmode="decimal" placeholder="Optional"></label></div>
    <label class="f">Notes<textarea id="fin-notes" rows="2" placeholder="What clicked, what to fix"></textarea></label>
    <p class="err" id="finErr" role="alert" hidden></p>
    <div class="row"><button class="btn primary" type="submit">Save session and adapt my plan</button><button class="btn sm" type="button" data-act="rebuild">Build a different session</button></div></form>`;
  $("#todayMain").innerHTML=html;
  // side
  const wk=VB.weekly()[VB.weekStart(VB.today())]||{n:0,mins:0},tmin=p.days*p.mins,ls=VB.loadStats(),open=VB.openFaults();
  $("#todaySide").innerHTML=`
   <div class="tile"><span class="stat">This week</span><span class="v num">${wk.n}<small> / ${p.days} sessions</small></span><span class="s num">${wk.mins} of ${tmin} min</span><div class="meter"><i style="width:${Math.min(100,wk.mins/tmin*100)}%"></i></div></div>
   ${ls.acwr!=null?`<div class="tile"><span class="stat">Training load</span><span class="v num">${Math.round(ls.acwr*100)}<small>% of your 4-week average</small></span><span class="s ${ls.acwr>1.4?"warn":""}">${ls.acwr>1.4?"High. Sessions are trimmed until it settles.":ls.acwr<.7?"Low. You have room to do more.":"In the safe range."}</span></div>`:""}
   <div class="card"><div class="kicker">Technique fixes in progress</div>${open.length?open.map(f=>`<div><b>${VB.FAULTS[f].name}</b><p class="small muted">${VB.FAULTS[f].fix}</p></div>`).join("")+`<p class="small muted">Film the movement again to check them off.</p>`:`<p class="small muted">None open. Film a spike, a pass or a jump and the plan will target what the camera finds.</p>`}<a class="btn sm" href="#film">Film a movement</a></div>
   <div class="card"><div class="kicker">Coach log</div>${st.coach.length?st.coach.slice(0,5).map(logHTML).join(""):`<p class="small muted">Changes to your plan appear here after each session.</p>`}<a class="btn sm" href="#progress">See all progress</a></div>`;
  if(VB.v5&&VB.v5.today)VB.v5.today();}
const ICON={up:"↑",down:"↓",hold:"=",fix:"✚",load:"!",info:"·"};
function logHTML(c){return `<div class="logline ${c.kind}"><i aria-hidden="true">${ICON[c.kind]||"·"}</i><div>${esc(c.msg)}<span class="d">${VB.shortDate(c.d)}</span></div></div>`;}
$("#heroGo").addEventListener("click",e=>{e.preventDefault();$("#todayMain").scrollIntoView({behavior:VB.reduced?"auto":"smooth",block:"start"});});
$("#feelSeg").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;VB.ensureToday(b.dataset.feel);renderToday();});
$("#todayMain").addEventListener("click",e=>{const b=e.target.closest("[data-act],[data-drill]");if(!b)return;const t=S().today;
  if(b.dataset.drill){VB.ui.openDrill(b.dataset.drill);return;}
  const act=b.dataset.act;
  if(act==="dismiss"){lastChanges=null;renderToday();return;}
  if(act==="rebuild"){const keep=t.plan.feel;S().today=null;VB.ensureToday(keep);renderToday();toast("New session built.");return;}
  const el=b.closest(".item");if(!el)return;const key=el.dataset.key,it=t.plan.items.find(i=>i.key===key);if(!it)return;
  if(act==="feel"){$$('[data-act="feel"]',el).forEach(x=>x.setAttribute("aria-pressed",x===b));pend[key]=b.dataset.v;if(t.done[key]){t.done[key]=readItem(el,it);VB.save();}return;}
  if(act==="toggle"){if(t.done[key])delete t.done[key];else t.done[key]=readItem(el,it);VB.save();
    el.classList.toggle("done",!!t.done[key]);b.setAttribute("aria-pressed",!!t.done[key]);const nn=Object.keys(t.done).length,k=$("#finForm .kicker");if(k)k.textContent=`Finish · ${nn} of ${t.plan.items.length} done`;const tb=$("#tbN");if(tb){tb.textContent=nn;$("#tbBar").style.width=(nn/t.plan.items.length*100)+"%";}
    if(t.done[key]&&it.k==="drill"){const i=$('[data-f="suc"]',el);if(i&&i.value==="")i.focus();}}});
$("#todayMain").addEventListener("change",e=>{const el=e.target.closest(".item");if(!el)return;const t=S().today,key=el.dataset.key,it=t.plan.items.find(i=>i.key===key);if(it&&t.done[key]){t.done[key]=readItem(el,it);VB.save();}});
$("#todayMain").addEventListener("submit",e=>{if(e.target.id!=="finForm")return;e.preventDefault();const t=S().today,err=$("#finErr"),mins=+$("#fin-mins").value,rpe=+$("#fin-rpe").value;
  let msg="";if(!Object.keys(t.done).length)msg="Tick at least one item you completed, then save.";else if(!mins||mins<5)msg="Enter how many minutes you trained, 5 or more.";else if(!(rpe>=1&&rpe<=10))msg="Effort goes from 1 to 10.";
  if(msg){err.textContent=msg;err.hidden=false;return;}
  const r=VB.finishSession({mins,rpe,jump:VB.lenIn($("#fin-jump").value),weight:VB.wIn($("#fin-weight").value),notes:$("#fin-notes").value.trim().slice(0,400)});
  lastChanges=r.changes;renderToday();window.scrollTo(0,0);});

/* ---------- body ---------- */
let action="overall",activeM=null,prevTier=null;
const colorFn=id=>({p:VB.musclePrio(id,action),sel:S().muscles.includes(id)});
function bars(p){const n=Math.round(p);return `<span class="bar5" aria-label="Priority ${n} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?"f":""}"></i>`).join("")}</span>`;}
function renderBody(){
  $("#actChips").innerHTML=VB.ACTIONS.map(([k,l])=>`<button type="button" class="chip" data-a="${k}" aria-pressed="${k===action}">${k==="overall"&&S().profile?"My position":l}</button>`).join("");
  const rank=VB.rankMuscles(action);if(!activeM)activeM=rank[0].id;
  let html="",cur=-1;rank.forEach(r=>{const t=VB.tierOf(r.p);if(t!==cur){cur=t;html+=`<div class="grp" style="margin:12px 8px 4px">${VB.TIER_NAMES[t]}</div>`;}const m=MI[r.id],sel=S().muscles.includes(r.id);
    html+=`<div class="mrow ${r.id===activeM?"active":""}" data-m="${r.id}"><button type="button" class="box" data-tog="${r.id}" aria-pressed="${sel}" aria-label="${sel?"Remove":"Add"} ${esc(m.name)} ${sel?"from":"to"} focus">✓</button><div class="nm">${esc(m.name)}<small>${esc(m.common)}</small></div>${bars(r.p)}</div>`;});
  $("#musList").innerHTML=html;$("#musCount").textContent=S().muscles.length+" in focus";
  VB.body.setColors(colorFn);VB.body.setActive(activeM);renderMuscle();}
function renderMuscle(){const m=MI[activeM];if(!m)return;const p=S().profile,ut=p?p.tier:"none";if(!prevTier)prevTier=ut;const sel=S().muscles.includes(activeM);
  const chains=(m.chains||[]).filter(c=>CH[c]);
  $("#musDetail").innerHTML=`<div class="row" style="justify-content:space-between"><div><div class="stat">${esc(m.region)} · ${esc(m.common)}</div><h2 style="font-size:1.6rem;margin-top:4px">${esc(m.name)}</h2></div>
    <button type="button" class="btn sm ${sel?"":"primary"}" data-tog="${activeM}">${sel?"Remove from focus":"Add to my focus"}</button></div>
   <p>${esc(m.vb)}</p>
   <div class="two"><div><div class="grp">What it does</div><p class="small">${esc(m.action)}</p></div><div><div class="grp">When it is weak</div><p class="small">${esc(m.weak)}</p></div></div>
   ${(()=>{const x=MM[activeM];if(!x)return"";return `<div class="two"><div><div class="grp">Starts at</div><p class="small">${esc(x.origin)}</p></div><div><div class="grp">Attaches to</div><p class="small">${esc(x.insertion)}</p></div></div>
     <div><div class="grp" style="margin-bottom:6px">Its job, skill by skill</div>${x.phases.map(ph=>`<div class="errrow"><span><span class="pill on">${esc(ph.skill)}</span> ${esc(ph.role)}</span></div>`).join("")}</div>
     <div class="two"><div><div class="grp">Check yourself</div><p class="small">${esc(x.selfTest)}</p></div><div><div class="grp">Keep it moving</div><p class="small">${esc(x.stretch)}</p></div></div>
     <div class="note"><b>${esc(x.injury.name)}.</b> ${esc(x.injury.signs)} <span class="muted">Prevention:</span> ${esc(x.injury.prevent)}</div>
     <div><div class="grp" style="margin-bottom:6px">Works with</div><div class="chips">${x.pairs.filter(id=>MI[id]).map(id=>`<button type="button" class="chip" data-go="${id}">${esc(MI[id].name)}</button>`).join("")}</div></div>`;})()}
   <div><div class="grp" style="margin-bottom:6px">Priority by action</div><div class="pgrid">${VB.ACTIONS.slice(1).map(([k,l])=>`<div>${l}${bars(m.priority[k]||1)}</div>`).join("")}</div></div>
   <div><div class="row" style="justify-content:space-between"><div class="grp">How to train it · equipment</div><div class="seg">${Object.entries(VB.TIER_INFO).map(([k,v])=>`<button type="button" data-pt="${k}" aria-pressed="${k===prevTier}">${v.name}</button>`).join("")}</div></div>
   ${chains.map(c=>{const list=EXS.filter(e=>e.chain===c&&VB.TIER[e.tier]<=VB.TIER[prevTier]).sort((a,b)=>a.step-b.step||VB.TIER[a.tier]-VB.TIER[b.tier]);const cs=p?VB.chainState(c):null;
     return `<div style="margin-top:12px"><b>${esc(CH[c].name)}</b> <span class="small muted">${esc(CH[c].why||"")}</span><div class="ladder">${list.map(e=>{const curr=cs&&cs.ex.id===e.id;return `<div class="rung ${curr?"cur":""}"><i>${e.step}</i><span>${esc(e.name)}${curr?' <span class="pill on">You are here</span>':""}</span><span class="small muted num">${e.sets} × ${e.reps[0]}–${e.reps[1]}${e.unit==="s"?" s":""}</span></div>`;}).join("")}</div></div>`;}).join("")}
   ${prevTier!==ut&&p?`<p class="small muted">Showing exercises for "${VB.TIER_INFO[prevTier].name}". Your plan uses "${VB.TIER_INFO[ut].name}". Change it in Profile.</p>`:""}</div>`;}
function toggleMuscle(id){const a=S().muscles,i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);VB.invalidatePlan();VB.save();renderBody();}
$("#actChips").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;action=b.dataset.a;activeM=null;renderBody();});
$("#musList").addEventListener("click",e=>{const tg=e.target.closest("[data-tog]");if(tg){toggleMuscle(tg.dataset.tog);return;}const r=e.target.closest(".mrow");if(r){activeM=r.dataset.m;VB.body.focus(activeM);renderBody();}});
$("#musList").addEventListener("mouseover",e=>{const r=e.target.closest(".mrow");VB.body.setHover(r?r.dataset.m:null);});
$("#musList").addEventListener("mouseleave",()=>VB.body.setHover(null));
$("#musDetail").addEventListener("click",e=>{const tg=e.target.closest("[data-tog]");if(tg){toggleMuscle(tg.dataset.tog);return;}const go=e.target.closest("[data-go]");if(go){activeM=go.dataset.go;VB.body.focus(activeM);renderBody();return;}const pt=e.target.closest("[data-pt]");if(pt){prevTier=pt.dataset.pt;renderMuscle();}});
$("#pickTop").onclick=()=>{const prev=S().muscles.slice();S().muscles=VB.rankMuscles(action).slice(0,10).map(x=>x.id);VB.invalidatePlan();VB.save();renderBody();toast("Top 10 selected.",()=>{S().muscles=prev;VB.save();renderBody();});};
$("#clearMus").onclick=()=>{const prev=S().muscles.slice();S().muscles=[];VB.invalidatePlan();VB.save();renderBody();toast("Focus cleared.",()=>{S().muscles=prev;VB.save();renderBody();});};
$("#xray").addEventListener("input",e=>VB.body.xray(e.target.value/100));
const bPhase=(k,i,label,n)=>{const el=$("#bPhase");$$("#bodyStage [data-bplay]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.bplay===k));if(!k){el.hidden=true;return;}el.hidden=false;$("b",el).textContent=String(i+1).padStart(2,"0");$("span",el).textContent=label;$("i",el).style.width=((i+1)/n*100)+"%";};
$("#bodyStage").addEventListener("click",e=>{const bp=e.target.closest("[data-bplay]");if(bp){if(bp.getAttribute("aria-pressed")==="true")VB.body.stop();else{VB.body.stop();VB.body.play(bp.dataset.bplay,bPhase);}return;}const v=e.target.closest("[data-bv]");if(v){VB.body.view(v.dataset.bv);return;}const l=e.target.closest("[data-lab]");if(l){VB.body.setLabels(l.dataset.lab);$$("#bodyStage [data-lab]").forEach(b=>b.setAttribute("aria-pressed",b===l));}});
VB.body.init($("#bodyStage"),{onPick:id=>{activeM=id;renderBody();const row=$(`.mrow[data-m="${id}"]`);if(row)row.scrollIntoView({block:"nearest"});},
  onHover:id=>{$$("#musList .mrow").forEach(r=>r.classList.toggle("hot",r.dataset.m===id));}});

/* ---------- skills ---------- */
let tab="tech",curTech="pass",curDrill=null,fSkill="all",fFit=true,fOff=false,fTech="all";
const SKILL_TECH={pass:"pass",set:"set",serve:"float",attack:"spike",block:"block",dig:"dig",transition:"spike",team:"receive"};
const STATUS=[["none","Not started"],["practising","Practising"],["ready","Game ready"]];
function drillList(){return DRS.filter(d=>(fSkill==="all"||d.skill===fSkill)&&(!fOff||d.offcourt)&&(!fFit||!S().profile||VB.drillFits(d))).sort((a,b)=>a.level-b.level||a.skill.localeCompare(b.skill));}
function renderSkills(){const lefty=S().profile&&S().profile.hand==="left";
  $("#skillStat").textContent=`${TECHS.length} techniques · ${DRS.length} drills · 4 levels`;
  $$("#skillTabs button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.tab===tab));
  const ff=$("#drillFilters");ff.hidden=false;
  if(tab==="tech"){const sk=[...new Set(TECHS.map(t=>t.skill))].filter(k=>VB.SKILLS[k]);
    ff.innerHTML=[["all","All"],...sk.map(k=>[k,VB.SKILLS[k]])].map(([k,l])=>`<button type="button" class="chip" data-ft="${k}" aria-pressed="${k===fTech}">${l}${k==="all"?"":` <small>${TECHS.filter(t=>t.skill===k).length}</small>`}</button>`).join("");}
  else ff.innerHTML=`<button type="button" class="chip offc" data-off="1" aria-pressed="${fOff}">Off court: a wall and a ball</button>`+[["all","All"],...Object.entries(VB.SKILLS)].map(([k,l])=>`<button type="button" class="chip" data-fs="${k}" aria-pressed="${k===fSkill}">${l}</button>`).join("")+(S().profile?`<button type="button" class="chip" data-fit="1" aria-pressed="${fFit}">Fits my setup</button>`:"");
  if(tab==="tech"){
    const shown=TECHS.filter(t=>fTech==="all"||t.skill===fTech);
    $("#gallery").innerHTML=shown.map(t=>{const st=S().tech[t.id]||"none";return `<button type="button" class="tcard" data-tech="${t.id}" aria-pressed="${t.id===curTech}"><div class="row" style="justify-content:space-between"><span class="pill">${t.kind} · ${t.level}</span>${st!=="none"?`<span class="pill ${st==="ready"?"ok":"on"}">${STATUS.find(s=>s[0]===st)[1]}</span>`:""}</div><div class="n">${esc(t.name)}</div><div class="s">${esc(t.sum)}</div></button>`;}).join("");
    const t=T[curTech]||TECHS[0],st=S().tech[t.id]||"none",sk=t.skill||VB.TECH_SKILL[t.id],drills=DRS.filter(d=>d.skill===sk&&(!S().profile||VB.drillFits(d))).slice(0,4);
    $("#skillDetail").innerHTML=`<div class="stat">${t.kind} · ${t.level} · ${VB.SKILLS[t.skill]||""}</div><h2>${esc(t.name)}</h2><p>${esc(t.sum)}</p>${t.why?`<p class="muted small">${esc(t.why)}</p>`:""}
     ${t.cues?`<div class="cues">${t.cues.map(c=>`<span>${esc(c)}</span>`).join("")}</div>`:""}
     <div class="stack phases" style="gap:12px" data-open="false">${(t.phases||[]).map((ph,i)=>`<div class="phase"><b>${i+1} · ${esc(ph.name)}</b>${ph.points.filter(x=>lefty||!/^Left-handers:/.test(x)).map((x,k)=>`<span class="small${k?" more":""}">${esc(x)}</span>`).join("")}</div>`).join("")}
     <button type="button" class="btn sm" data-allcues aria-expanded="false">Show all coaching points</button></div>
     <div><div class="grp">Common errors and the fix</div>${(t.errors||[]).map(x=>`<div class="errrow"><b>${esc(x.error)}</b><span class="small muted">${esc(x.why||"")}</span><i class="small">${esc(x.fix)}</i></div>`).join("")}</div>
     <div class="rec"><span class="grp">Objective</span><span>${esc(t.target)}</span></div>
     ${drills.length?`<div><div class="grp">Drills for this</div><p class="small">${drills.map(d=>`<button type="button" class="linkbtn" data-drill="${d.id}">${esc(d.name)}</button>`).join(" · ")}</p></div>`:""}
     <div><div class="grp" style="margin-bottom:6px">Where are you with this?</div><div class="row">${STATUS.map(x=>`<button type="button" class="btn sm" data-st="${x[0]}" aria-pressed="${st===x[0]}">${x[1]}</button>`).join("")}</div></div>
     <a class="btn sm" href="#film">Film this and get corrections</a>`;
    VB.court.select(t.scene,{lefty,tech:t.id});
  }else{
    const list=drillList();if(!curDrill||!list.some(d=>d.id===curDrill))curDrill=list.length?list[0].id:null;
    $("#gallery").innerHTML=list.length?list.map(d=>`<button type="button" class="tcard" data-dr="${d.id}" aria-pressed="${d.id===curDrill}"><div class="row" style="justify-content:space-between"><span class="pill">${VB.SKILLS[d.skill]} · L${d.level}</span>${S().queue.includes(d.id)?'<span class="pill on">Queued</span>':""}</div><div class="n">${esc(d.name)}</div><div class="s">${VB.PLAYERS_INFO[d.players]} · ${d.minutes} min</div></button>`).join(""):`<p class="muted">No drills match. Turn off "Fits my setup" to see everything.</p>`;
    const d=VB.drMap()[curDrill];
    if(!d){$("#skillDetail").innerHTML=`<p class="muted">Pick a drill.</p>`;return;}
    const hist=(VB.skillStats()[d.skill]||[]).filter(x=>x.id===d.id),best=hist.length?hist.reduce((a,x)=>x.pct>a.pct?x:a):null,q=S().queue.includes(d.id),lvl=S().profile?VB.skillLevel(d.skill).lvl:null;
    $("#skillDetail").innerHTML=`<div class="stat">${VB.SKILLS[d.skill]} · Level ${d.level} of 4 · ${VB.PLAYERS_INFO[d.players]} · ${d.minutes} min</div><h2>${esc(d.name)}</h2>
     ${lvl?`<p class="small muted">Your ${VB.SKILLS[d.skill].toLowerCase()} level is ${lvl}. ${d.level>lvl?"This drill is above it.":d.level<lvl?"This drill is below it, good for warm-up or fixes.":"This drill is at your level."}</p>`:""}
     <p>${esc(d.setup)}</p>
     ${d.offcourt?`<div><div class="grp">Off court · side view</div><div class="ocdgm">${d.scene&&d.scene.wall!==undefined?VB.diagramSVG(d.scene,{label:d.name}):""}</div><p class="small muted">${d.scene&&d.scene.wall===false?"No wall needed: any open space with room overhead.":"Any solid wall works: a garage, a gym wall, a schoolyard. Check the surface first: no windows nearby."}</p></div>`:""}
     <div><div class="grp">How it runs</div><ol class="steps">${d.run.map(r=>`<li>${esc(r)}</li>`).join("")}</ol></div>
     <div class="rec"><b class="num">${d.score.target} / ${d.score.attempts}</b><span>Standard: ${esc(d.score.label)}</span>${best?`<span class="small muted">Your best: ${best.pct}% on ${VB.shortDate(best.date)}</span>`:""}</div>
     <div><div class="grp">Coaching cues</div><ul class="plain">${d.coach.map(c=>`<li>${esc(c)}</li>`).join("")}</ul></div>
     <div class="two"><div><div class="grp">Make it harder</div><p class="small">${esc(d.progress)}</p></div><div><div class="grp">Make it easier</div><p class="small">${esc(d.regress)}</p></div></div>
     ${d.fixes&&d.fixes.length?`<div><div class="grp">Corrects</div><p class="small">${d.fixes.filter(f=>VB.FAULTS[f]).map(f=>VB.FAULTS[f].name).join(" · ")}</p></div>`:""}
     <p class="small muted">${esc(d.source||"")}${d.ref&&/^https:\/\//.test(d.ref)?` · <a href="${esc(d.ref)}" target="_blank" rel="noopener">Further reading</a>`:""}${d.scene?"":" · The court shows the base technique for this skill."}</p>
     <div class="row"><button type="button" class="btn ${q?"":"primary"}" data-queue="${d.id}">${q?"Remove from next session":"Add to my next session"}</button><button type="button" class="btn sm" data-sharedr="${d.id}">Share with friends</button></div>`;
    VB.court.select(d.scene||T[SKILL_TECH[d.skill]].scene,{lefty,tech:d.scene?null:SKILL_TECH[d.skill]});
  }}
$("#skillTabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b){tab=b.dataset.tab;renderSkills();}});
$("#drillFilters").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.ft){fTech=b.dataset.ft;const l=TECHS.filter(t=>fTech==="all"||t.skill===fTech);if(l.length&&!l.some(t=>t.id===curTech))curTech=l[0].id;}if(b.dataset.fs)fSkill=b.dataset.fs;if(b.dataset.fit)fFit=!fFit;if(b.dataset.off)fOff=!fOff;renderSkills();});
$("#gallery").addEventListener("click",e=>{const b=e.target.closest(".tcard");if(!b)return;if(b.dataset.tech)curTech=b.dataset.tech;if(b.dataset.dr)curDrill=b.dataset.dr;renderSkills();if(window.innerWidth<940)$("#skillDetail").scrollIntoView({behavior:VB.reduced?"auto":"smooth",block:"start"});});
$("#skillDetail").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.drill){VB.ui.openDrill(b.dataset.drill);return;}
  if(b.dataset.sharedr){VB.squad.share("drill",{id:b.dataset.sharedr});return;}
  if(b.dataset.st){S().tech[curTech]=b.dataset.st;VB.invalidatePlan();VB.save();renderSkills();return;}
  if(b.dataset.queue){const q=S().queue,i=q.indexOf(b.dataset.queue);if(i>=0)q.splice(i,1);else q.push(b.dataset.queue);VB.invalidatePlan();VB.save();renderSkills();toast(i>=0?"Removed from your next session.":"Added to your next session.");}});
VB.ui.openDrill=id=>{if(!VB.drMap()[id])return;tab="drill";fSkill="all";fFit=false;curDrill=id;if(view!=="skills")location.hash="#skills";else renderSkills();window.scrollTo(0,0);};
VB.court.init($("#courtStage"),{onPick:info=>{const el=$("#pInfo");if(!info){el.hidden=true;return;}el.hidden=false;el.innerHTML=`<span class="grp">${info.me?"You":info.opp?"Other side":"Your side"}</span><b>${esc(info.label)}</b>${info.note?`<span>${esc(info.note)}</span>`:""}`;}});
$("#cZones").onclick=e=>{e.currentTarget.setAttribute("aria-pressed",VB.court.toggleZones());};
$("#courtStage").addEventListener("click",e=>{const b=e.target.closest("[data-cv]");if(b)VB.court.view(b.dataset.cv);});
let scrubbing=false;$("#cScrub").addEventListener("input",e=>{scrubbing=true;VB.court.seek(e.target.value/1000);$("#cPlay").textContent="Play";});$("#cScrub").addEventListener("change",()=>{scrubbing=false;});
$("#cPlay").onclick=e=>{e.currentTarget.textContent=VB.court.toggle()?"Pause":"Play";};$("#cPlay").textContent=VB.court.playing()?"Pause":"Play";
$("#cSlow").onclick=e=>{e.currentTarget.setAttribute("aria-pressed",VB.court.toggleSlow());};


/* ---------- programs ---------- */
const PCOL={jump:"#f08a4b",hitting:"#e0483f",armcare:"#5cc98b",landing:"#7fb7e6",core:"#d8b25a",defense:"#b48be0",mobility:"#8fd3c8"};
function mixBar(w){const ks=Object.keys(w||{}).filter(k=>w[k]>0&&PCOL[k]),tot=ks.reduce((a,k)=>a+w[k],0);if(!ks.length)return `<div class="mixkey"><span>Balanced automatically from your profile</span></div>`;
  return `<div class="mix">${ks.map(k=>`<i style="width:${w[k]/tot*100}%;background:${PCOL[k]}"></i>`).join("")}</div><div class="mixkey">${ks.sort((a,b)=>w[b]-w[a]).map(k=>`<span><i style="background:${PCOL[k]}"></i>${VB.PROGRAMS[k]}</span>`).join("")}</div>`;}
let editing=null;
function blankCustom(){return {id:null,name:"",weeks:6,w:{},skill:.4,skills:[],blocks:{prep:true,skills:true,power:true,strength:true,care:true},chains:[],drills:[],mins:null};}
function renderPrograms(){const st=S(),ap=VB.activeProgram(),d=ap.def;
  $("#activeProg").innerHTML=`<div class="card progcard"><div class="stack" style="gap:10px"><div class="stat">Your program${d.custom?" · custom":""}</div><h3>${esc(d.name)}</h3><p class="muted">${esc(d.desc||"Your own mix of pillars, skills and pinned work.")}</p>${ap.phase?`<div><span class="pill on">Phase: ${esc(ap.phase.name)} · weeks ${ap.phase.from} to ${ap.phase.to}</span></div><p class="small">${esc(ap.phase.focus)}</p>`:""}
     ${d.weeks?`<div><div class="row" style="justify-content:space-between"><span class="stat">${ap.finished?"Complete":"Week "+ap.week+" of "+d.weeks}</span><span class="stat">${ap.pct}%</span></div><div class="meter"><i style="width:${ap.pct}%"></i></div></div>`:`<div class="stat">Ongoing · week ${ap.week}</div>`}${VB.calUI?VB.calUI.progTimeline():""}
     <div class="row"><a class="btn primary" href="#today">Go to today's session</a>${d.id!=="auto"?`<button type="button" class="btn sm" data-start="auto">Back to adaptive</button>`:""}</div></div>
     <div class="stack" style="gap:10px">${mixBar(d.w)}${d.outline?`<ul class="plain small">${d.outline.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}${ap.finished?`<div class="note">You have finished this program. Retest your vertical, film a skill, then start the next one below.</div>`:""}</div></div>`;
  renderPosProgs(ap);
  $("#prebuilt").innerHTML=VB.PREBUILT.filter(pr=>!pr.position).map(pr=>`<div class="pcard ${pr.id===d.id?"on":""}"><div class="stat">${esc(pr.tag)}</div><h4>${esc(pr.name)}</h4><p class="small">${esc(pr.desc)}</p>${mixBar(pr.w)}<p class="small muted"><b>Best for:</b> ${esc(pr.best)}</p>
     <div class="foot">${pr.id===d.id?`<span class="pill on">Active</span>`:`<button type="button" class="btn sm primary" data-start="${pr.id}">Start this program</button>`}${pr.skill!=null?`<span class="small muted">${Math.round(pr.skill*100)}% skills</span>`:""}</div></div>`).join("");
  $("#customList").innerHTML=st.customPrograms.length?st.customPrograms.map(pr=>`<div class="pcard ${pr.id===d.id?"on":""}"><div class="stat">Custom · ${pr.weeks?pr.weeks+" weeks":"ongoing"} · ${Math.round((pr.skill||0)*100)}% skills</div><h4>${esc(pr.name)}</h4>${mixBar(pr.w)}
     <p class="small muted">${(pr.chains||[]).length} pinned progressions · ${(pr.drills||[]).length} pinned drills</p>
     <div class="foot">${pr.id===d.id?`<span class="pill on">Active</span>`:`<button type="button" class="btn sm primary" data-start="${pr.id}">Start</button>`}<button type="button" class="btn sm" data-share="${pr.id}">Share</button><button type="button" class="btn sm" data-edit="${pr.id}">Edit</button><button type="button" class="btn sm" data-del="${pr.id}">Delete</button></div></div>`).join(""):`<div class="card"><div class="kicker">Your custom programs</div><p class="small muted">Nothing saved yet. Set the mix on the left and press Save. A custom program can be as simple as "more core, no jumping" or a full plan with pinned exercises and drills.</p></div>`;
  renderBuilder();}
let ppOpen=null;
function renderPosProgs(ap){const host=$("#posProgs");if(!host)return;const st=S(),p=st.profile||{},TH=VB.THEMES||{},list=VB.PREBUILT.filter(x=>x.position).sort((a,b)=>(b.pos===p.pos)-(a.pos===p.pos));
  const tier=VB.TIER[p.tier]||0,EX=window.VB_EXERCISES||[];
  const card=pr=>{const col=(TH[pr.pos]||{}).c||"#ec3b52",act=ap.def.id===pr.id,cur=act&&ap.phase;
    return `<div class="ppcard ${pr.pos===p.pos?"mine":""}" style="--pc:${col}"><div class="pphd" data-big="16"><div class="stat">${pr.pos===p.pos?"For your position · ":""}${esc(pr.tag)}</div><h4>${esc(pr.name.split(":")[0])}</h4></div>
      <div class="ppbody"><p class="small">${esc(pr.desc)}</p><div class="ptl">${pr.phases.map(f=>`<span class="${cur&&cur===f?"on":""}">${esc(f.name)}<small>Wk ${f.from}-${f.to}</small></span>`).join("")}</div>
      <div class="ppfoot row">${act?`<span class="pill on">Active · week ${ap.week}</span>`:`<button type="button" class="btn sm primary" data-start="${pr.id}">Start</button>`}<button type="button" class="btn sm" data-ppopen="${pr.id}" aria-expanded="${ppOpen===pr.id}">${ppOpen===pr.id?"Hide the plan":"See the plan"}</button></div></div></div>`;};
  const detail=pr=>{if(!pr)return "";const col=(TH[pr.pos]||{}).c||"#ec3b52";
    return `<div class="ppdet" style="--pc:${col}" id="ppdet"><div class="row" style="justify-content:space-between"><h3>${esc(pr.name)}</h3><span class="small muted">Sessions are built from the phase you are in. Drills that need more players or gear than you have are dimmed and skipped.</span></div>
      ${pr.phases.map((f,i)=>{const ex=[];f.train.forEach(k=>{const c=EX.filter(e=>e.kind===k&&(VB.TIER[e.tier]||0)<=tier).sort((a,b)=>Math.abs((a.step||1)-(i+1))-Math.abs((b.step||1)-(i+1)));if(c[0]&&!ex.includes(c[0]))ex.push(c[0]);if(c[1]&&ex.length<6&&!ex.includes(c[1]))ex.push(c[1]);});
        return `<div class="phase"><h5>Weeks ${f.from} to ${f.to} · ${esc(f.name)}</h5><p class="small">${esc(f.focus)}</p><p class="small muted"><b>Week shape:</b> ${esc(f.week)} · ${Math.round(f.skill*100)}% of each session on the ball · ${["no","light","full"][f.power]||"light"} jump and power work</p>
          ${mixBar(f.w)}<div class="grp">Physical training</div><div class="ex">${ex.slice(0,6).map(e=>`<span>${esc(e.name)} · ${e.sets}×${esc(String(e.reps))}${e.unit&&e.unit!=="reps"?" "+esc(e.unit):""}</span>`).join("")}</div>
          <div class="grp">Drills with diagrams</div><div class="dgrid">${f.drills.map(id=>{const d=VB.drMap()[id];if(!d)return "";const fit=VB.drillFits(d);return `<div class="dcell ${fit?"":"nofit"}">${VB.diagramSVG(VB.sceneFor(d),{accent:col,label:d.name})}<div class="dmeta"><b>${esc(d.name)}</b><span class="small muted">${VB.SKILLS[d.skill]} · level ${d.level} · ${esc(String(d.players))}${fit?"":" · needs more players or gear"}</span><div class="row"><button type="button" class="btn sm" data-drill="${id}">Open on the court</button></div></div></div>`;}).join("")}</div></div>`;}).join("")}</div>`;};
  host.innerHTML=`<div class="ppgrid">${list.map(card).join("")}${ppOpen?detail(list.find(x=>x.id===ppOpen)):""}</div>`;}
document.addEventListener("click",e=>{const dd=e.target.closest("#posProgs [data-drill]");if(dd){VB.ui.openDrill(dd.dataset.drill);return;}const b=e.target.closest("[data-ppopen]");if(!b)return;ppOpen=ppOpen===b.dataset.ppopen?null:b.dataset.ppopen;renderPosProgs(VB.activeProgram());const d=document.getElementById("ppdet");if(d)d.scrollIntoView({behavior:"smooth",block:"start"});});
function renderBuilder(){if(!editing)editing=blankCustom();const e=editing,lv=["Off","Low","Med","High"];
  const fits=DRS.filter(x=>VB.drillFits(x)).sort((a,b)=>a.skill.localeCompare(b.skill)||a.level-b.level);
  $("#builder").innerHTML=`<div class="kicker">${e.id?"Edit program":"New program"}</div>
   <div class="grid"><label class="f">Name<input id="b-name" maxlength="40" value="${esc(e.name)}" placeholder="e.g. Off-season legs and serve"></label>
     <label class="f">Length<select id="b-weeks">${[[0,"Ongoing"],[4,"4 weeks"],[6,"6 weeks"],[8,"8 weeks"],[12,"12 weeks"]].map(([v,l])=>`<option value="${v}" ${e.weeks===v?"selected":""}>${l}</option>`).join("")}</select></label>
     <label class="f">Session length<select id="b-mins">${[[0,"Use my profile"],[20,"20 min"],[30,"30 min"],[45,"45 min"],[60,"60 min"],[75,"75 min"],[90,"90 min"]].map(([v,l])=>`<option value="${v}" ${(e.mins||0)===v?"selected":""}>${l}</option>`).join("")}</select></label>
     <label class="f">Share of session on ball skills<select id="b-skill">${[[0,"None"],[.2,"Light, 20%"],[.4,"Balanced, 40%"],[.6,"Heavy, 60%"]].map(([v,l])=>`<option value="${v}" ${Math.abs((e.skill||0)-v)<.05?"selected":""}>${l}</option>`).join("")}</select></label></div>
   <div><div class="grp" style="margin-bottom:4px">Pillar emphasis</div>${Object.keys(VB.PROGRAMS).map(k=>{const v=Math.round((e.w[k]||0)*3);return `<div class="brow"><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${PCOL[k]};margin-right:8px"></i>${VB.PROGRAMS[k]}</span><span class="seg" role="group" aria-label="${VB.PROGRAMS[k]} emphasis">${lv.map((l,i)=>`<button type="button" data-w="${k}" data-v="${i}" aria-pressed="${v===i}">${l}</button>`).join("")}</span></div>`;}).join("")}</div>
   <div><div class="grp" style="margin-bottom:6px">Skills to drill (none ticked = your position's order)</div><div class="chips">${Object.entries(VB.SKILLS).map(([k,l])=>`<button type="button" class="chip" data-sk="${k}" aria-pressed="${e.skills.includes(k)}">${l}</button>`).join("")}</div></div>
   <div><div class="grp" style="margin-bottom:6px">Session blocks</div><div class="chips">${[["prep","Mobility prep"],["power","Jumps and power"],["strength","Strength"],["care","Arm care and core"]].map(([k,l])=>`<button type="button" class="chip" data-bl="${k}" aria-pressed="${e.blocks[k]!==false}">${l}</button>`).join("")}</div></div>
   <div><div class="grp" style="margin-bottom:6px">Pin progressions so they appear every session (up to 6)</div><div class="chips">${Object.keys(CH).filter(c=>CH[c].kind!=="mobility").map(c=>`<button type="button" class="chip" data-ch="${c}" aria-pressed="${e.chains.includes(c)}">${esc(CH[c].name)}</button>`).join("")}</div></div>
   <div><div class="grp" style="margin-bottom:6px">Pin drills (up to 4, two are used per session)</div>
     <div class="row"><select class="in" id="b-drill" style="flex:1;min-width:180px" aria-label="Drill to pin"><option value="">Choose a drill that fits your setup</option>${fits.map(x=>`<option value="${x.id}">${VB.SKILLS[x.skill]} · L${x.level} · ${esc(x.name)}</option>`).join("")}</select><button type="button" class="btn sm" id="b-addDrill">Pin drill</button></div>
     <div class="chips" style="margin-top:8px">${e.drills.map(id=>VB.drMap()[id]?`<button type="button" class="chip" data-undrill="${id}" aria-pressed="true" aria-label="Unpin ${esc(VB.drMap()[id].name)}">${esc(VB.drMap()[id].name)} ×</button>`:"").join("")}</div></div>
   <p class="err" id="b-err" role="alert" hidden></p>
   <div class="row"><button type="button" class="btn primary" id="b-save">${e.id?"Save changes":"Save and start"}</button>${e.id?`<button type="button" class="btn sm" id="b-new">Cancel edit</button>`:""}</div>`;}
function readBuilderFields(){const e=editing;if(!$("#b-name"))return;e.name=$("#b-name").value.trim();e.weeks=+$("#b-weeks").value;e.mins=+$("#b-mins").value||null;e.skill=+$("#b-skill").value;}
$("#builder").addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;const e=editing;readBuilderFields();
  const tog=(arr,v,max)=>{const i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else if(!max||arr.length<max)arr.push(v);else toast("That is the maximum. Remove one first.");};
  if(b.dataset.w){const v=+b.dataset.v;if(v)e.w[b.dataset.w]=v/3;else delete e.w[b.dataset.w];}
  else if(b.dataset.sk)tog(e.skills,b.dataset.sk);
  else if(b.dataset.bl)e.blocks[b.dataset.bl]=e.blocks[b.dataset.bl]===false;
  else if(b.dataset.ch)tog(e.chains,b.dataset.ch,6);
  else if(b.dataset.undrill)tog(e.drills,b.dataset.undrill);
  else if(b.id==="b-addDrill"){const v=$("#b-drill").value;if(v&&!e.drills.includes(v))tog(e.drills,v,4);}
  else if(b.id==="b-new"){editing=null;}
  else if(b.id==="b-save"){const err=$("#b-err");let msg="";if(!e.name)msg="Give the program a name.";else if(!Object.keys(e.w).length&&!e.chains.length&&!e.drills.length&&!e.skill)msg="Choose at least one pillar, a pinned item, or some skill time.";
    else if(e.blocks.strength===false&&e.blocks.power===false&&e.blocks.care===false&&e.blocks.prep===false&&!e.skill)msg="Every block is off and skills are at none, so sessions would be empty.";
    if(msg){err.textContent=msg;err.hidden=false;return;}
    const def=JSON.parse(JSON.stringify(e));def.blocks.skills=def.skill>0;def.tag=(def.weeks?def.weeks+" weeks":"Ongoing")+" · custom";if(!def.skills.length)delete def.skills;const isNew=!def.id,id=VB.saveCustom(def);
    if(isNew||(S().program&&S().program.id===id)){if(isNew)VB.startProgram(id);else{VB.invalidatePlan();VB.save();}}
    editing=null;renderPlan();toast(isNew?"Program saved and started. Today's session is rebuilt.":"Program updated.");$("#activeProg").scrollIntoView({behavior:VB.reduced?"auto":"smooth",block:"start"});return;}
  else return;
  renderBuilder();});
$("#v-plan").addEventListener("click",ev=>{const b=ev.target.closest("[data-start],[data-edit],[data-del],[data-share]");if(!b||b.closest("#builder"))return;
  if(b.dataset.share){const d=VB.programDef(b.dataset.share);if(d){const c=JSON.parse(JSON.stringify(d));delete c.id;VB.squad.share("program",c);}return;}
  if(b.dataset.start){VB.startProgram(b.dataset.start);renderPlan();toast("Program started. Today's session is rebuilt.");window.scrollTo(0,0);}
  else if(b.dataset.edit){const d=VB.programDef(b.dataset.edit);if(d){editing=Object.assign(blankCustom(),JSON.parse(JSON.stringify(d)));editing.skills=editing.skills||[];editing.blocks=Object.assign({prep:true,skills:true,power:true,strength:true,care:true},editing.blocks||{});renderBuilder();$("#builder").scrollIntoView({behavior:VB.reduced?"auto":"smooth",block:"start"});}}
  else if(b.dataset.del){const d=VB.programDef(b.dataset.del);VB.deleteCustom(b.dataset.del);renderPlan();toast("Program deleted.",d?()=>{VB.saveCustom(d);renderPlan();}:null);}});
function renderPlan(){const st=S(),p=st.profile;if(!p)return;renderPrograms();const ph=VB.phase(),from=VB.addDays(VB.today(),-28);
  $("#planStat").textContent=`${VB.PREBUILT.length} prebuilt programs · unlimited custom · 7 pillars`;
  const goalProg={jump:"jump",power:"hitting",serve:"hitting",pass:"defense",defense:"defense",block:"jump",prevent:"landing",endurance:"core"},mine=new Set((p.goals||[]).map(g=>goalProg[g]));
  $("#progGrid").innerHTML=Object.entries(PG).map(([k,g])=>{const chains=Object.keys(CH).filter(c=>(CH[c].programs||[]).includes(k));let sum=0,n=0;const rows=[];
    chains.forEach(c=>{const r=VB.chainState(c);if(!r)return;sum+=(r.cs.i+1)/r.steps.length;n++;if(r.cs.last)rows.push(`<div class="rung cur"><i>${r.cs.i+1}/${r.steps.length}</i><span>${esc(CH[c].name)}: ${esc(r.ex.name)}</span><span class="small muted num">${r.cs.reps}${r.ex.unit==="s"?" s":""}</span></div>`);});
    let sets=0;st.sessions.forEach(x=>{if(x.date>=from)(x.items||[]).forEach(it=>{if(it.k==="ex"&&chains.includes(it.chain))sets+=it.sets||0;});});
    const pct=n?Math.round(sum/n*100):0;
    return `<div class="card"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div><div class="stat">${mine.has(k)?"One of your goals · ":""}${chains.length} progressions · ${sets} sets in 28 days</div><h3 style="margin-top:6px">${esc(g.name)}</h3><p class="small muted">${esc(g.tagline)}</p></div><div class="ring" style="--p:${pct}" title="Average position on this program's progressions"><span>${pct}%</span></div></div>
      <p class="small">${esc(g.summary)}</p>
      <div class="wk">${g.phases.map((x,i)=>`<div class="${i+1===ph.week?"now":""}"><b>Week ${i+1} · ${esc(x.name)}</b>${esc(x.focus)}</div>`).join("")}</div>
      ${rows.length?`<div><div class="grp">Where you are</div><div class="ladder">${rows.join("")}</div></div>`:`<p class="small muted">No sessions logged in this program yet. It starts appearing in your day as the plan rotates.</p>`}
      <details><summary>Principles, test and common mistakes</summary><div class="howto"><ul class="plain">${g.principles.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
        <div class="rec"><span class="grp">Test · ${esc(g.test.name)}</span><span>${esc(g.test.how)}</span><span class="small muted">${esc(g.test.good)}${g.test.source?" Source: "+esc(g.test.source)+".":""}</span></div>
        <div><div class="grp">Avoid</div><ul class="plain">${g.mistakes.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div></details></div>`;}).join("");
  const v=GD.vertical,women=p.net<2.3;
  $("#guideA").innerHTML=guideCard(GD.warmup,true)+guideCard(GD.cooldown,true);
  $("#guideB").innerHTML=(v?`<div class="card"><h3>Vertical jump reference</h3><div class="tablewrap"><table><thead><tr><th>Level</th><th class="r">Men (cm)</th><th class="r">Women (cm)</th></tr></thead><tbody>${v.rows.map(r=>`<tr><td style="white-space:normal">${esc(r.level)}</td><td class="r num">${esc(r.men)}</td><td class="r num">${esc(r.women)}</td></tr>`).join("")}</tbody></table></div><p class="small muted">${esc(v.note)} ${esc(v.source||"")}</p></div>`:"")+
   (GD.loadRules?`<div class="card"><h3>Managing load</h3><ul class="plain small">${GD.loadRules.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:"")+
   (GD.recovery?`<div class="card"><h3>Recovery</h3><ul class="plain small">${GD.recovery.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:"");}

/* ---------- progress ---------- */
const charts={};
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function drawChart(key,emptyMsg,has,cfg){const cv=$("#ch"+key),em=$("#em"+key);if(charts[key]){charts[key].destroy();charts[key]=null;}
  if(!window.Chart||!has){cv.style.visibility="hidden";em.hidden=false;em.textContent=window.Chart?emptyMsg:"Charts could not load in this browser.";return;}
  cv.style.visibility="visible";em.hidden=true;charts[key]=new Chart(cv,cfg);}
function renderProgress(){const st=S(),p=st.profile;if(!p)return;
  const Ss=st.sessions.slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0),wk=VB.weekly(),cw=wk[VB.weekStart(VB.today())]||{mins:0,n:0},tmin=p.days*p.mins;
  const tests=st.tests.filter(t=>t.kind==="vert").sort((a,b)=>a.date<b.date?-1:1),j0=tests.length?tests[0].cm:null,j1=tests.length?tests[tests.length-1].cm:null,dj=tests.length>1?j1-j0:null;
  const ls=VB.loadStats(),ph=VB.phase(),sk=VB.streak(),totalMin=Ss.reduce((a,s)=>a+(s.mins||0),0),open=VB.openFaults().length,fixed=Object.values(st.faults).filter(f=>f&&!f.open).length;
  $("#tiles").innerHTML=[
   `<div class="tile"><span class="stat">This week</span><span class="v num">${cw.n}<small> / ${p.days}</small></span><span class="s num">${cw.mins} of ${tmin} min</span><div class="meter"><i style="width:${Math.min(100,cw.mins/tmin*100)}%"></i></div></div>`,
   `<div class="tile"><span class="stat">Week streak</span><span class="v num">${sk}</span><span class="s">${sk?"weeks in a row at your target":"Hit "+p.days+" sessions this week to start one"}</span></div>`,
   `<div class="tile"><span class="stat">Vertical jump</span><span class="v num">${j1!=null?VB.lenOut(j1):"–"}<small> ${j1!=null?VB.lu():""}</small></span><span class="s ${dj>0?"up":""} num">${dj!=null?(dj>=0?"+":"")+VB.lenOut(dj)+" "+VB.lu()+" since first test":"Test it in a session or on film"}</span></div>`,
   `<div class="tile"><span class="stat">Training load</span><span class="v num">${ls.acwr!=null?Math.round(ls.acwr*100):"–"}<small>${ls.acwr!=null?"%":""}</small></span><span class="s ${ls.acwr>1.4?"warn":""}">${ls.acwr==null?"Needs two weeks of sessions":ls.acwr>1.4?"Above your 4-week average. Easing off.":"of your 4-week average"}</span></div>`,
   `<div class="tile"><span class="stat">Program</span><span class="v num">${ph.week}<small> / 4 · ${ph.info.name}</small></span><span class="s">Block ${ph.block} · ${(totalMin/60).toFixed(1)} h trained in all</span></div>`,
   `<div class="tile"><span class="stat">Technique faults</span><span class="v num">${fixed}<small> fixed</small></span><span class="s ${open?"warn":""}">${open?open+" still open":"None open"}</span></div>`].join("");
  const recs=VB.records();
  $("#recs").innerHTML=recs.length?recs.map(r=>`<div class="rec"><b class="num">${r[0]}</b><span>${r[1]}</span><span class="small muted">${VB.shortDate(r[2])}</span></div>`).join(""):`<p class="muted small">Your bests appear here after your first saved session.</p>`;
  $("#coachLog").innerHTML=st.coach.length?st.coach.map(logHTML).join(""):`<p class="muted small">Nothing yet. Save a session and the plan's decisions are listed here.</p>`;
  const F=Object.entries(st.faults).filter(e=>e[1]);
  $("#faultList").innerHTML=F.length?F.map(([id,f])=>`<div class="fault"><div class="row" style="justify-content:space-between"><b>${VB.FAULTS[id]?VB.FAULTS[id].name:id}</b><span class="pill ${f.open?"hot":"ok"}">${f.open?"Open":"Fixed "+VB.shortDate(f.fixed||f.last)}</span></div><span class="small muted">Seen ${f.count} time${f.count>1?"s":""}, last on ${VB.shortDate(f.last)} in your ${VB.MOVES[f.move]?VB.MOVES[f.move].name.toLowerCase():"film"}</span></div>`).join(""):`<p class="muted small">Faults found on film are tracked here until a new clip comes back clean. <a href="#film">Film a movement</a></p>`;
  $("#stable").innerHTML=`<thead><tr><th>Date</th><th>Type</th><th class="r">Min</th><th class="r">Effort</th><th class="r">Exercises</th><th class="r">Drills</th><th></th></tr></thead><tbody>`+
   (Ss.length?Ss.slice().reverse().map(s=>{const ex=(s.items||[]).filter(i=>i.k==="ex").length,dr=(s.items||[]).filter(i=>i.k==="drill");
     return `<tr><td>${VB.shortDate(s.date)}${s.ex?' <span class="pill">Example</span>':""}</td><td>${{plan:"Planned session",match:"Match",practice:"Team practice",other:"Other",skills:"Skills",strength:"Strength",conditioning:"Conditioning"}[s.type]||s.type}</td><td class="r num">${s.mins||"–"}</td><td class="r num">${s.rpe??"–"}</td><td class="r num">${ex||"–"}</td><td class="r num">${dr.length?dr.map(d=>d.suc+"/"+d.att).join(", "):"–"}</td><td><button class="btn sm" data-del="${esc(s.id)}" aria-label="Delete session from ${VB.shortDate(s.date)}">Delete</button></td></tr>${s.notes?`<tr><td colspan="7" class="small muted" style="white-space:normal">${esc(s.notes)}</td></tr>`:""}`;}).join("")
   :`<tr><td colspan="7" class="muted" style="white-space:normal">No sessions yet. Finish today's session and it shows up here.</td></tr>`)+`</tbody>`;
  if(!$("#o-date").value)$("#o-date").value=VB.today();
  const sel=$("#accSkill"),ss=VB.skillStats(),keep=sel.value;sel.innerHTML=Object.entries(VB.SKILLS).map(([k,l])=>`<option value="${k}">${l}${ss[k]?" ("+ss[k].length+")":""}</option>`).join("");
  sel.value=keep&&VB.SKILLS[keep]?keep:(Object.keys(ss)[0]||"pass");
  renderCharts();}
function renderCharts(){if(view!=="progress"||!S().profile)return;const st=S(),p=st.profile;
  const ink=css("--ink"),muted=css("--muted"),line=css("--line"),gold=css("--gold"),cool=css("--cool"),hot=css("--hot"),bg=css("--bg");
  if(window.Chart){Chart.defaults.font.family="Barlow, system-ui, sans-serif";Chart.defaults.color=muted;Chart.defaults.animation=VB.reduced?false:{duration:400};}
  const axes=(yt,extra)=>({x:{grid:{display:false},ticks:{maxRotation:0,autoSkipPadding:12}},y:Object.assign({grid:{color:line},border:{display:false},title:{display:true,text:yt}},extra||{})});
  const base=(scales,legend)=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:!!legend,labels:{boxWidth:12,usePointStyle:true}},tooltip:{backgroundColor:ink,titleColor:bg,bodyColor:bg}},scales});
  const lineSet=(label,data)=>({label,data,borderColor:gold,backgroundColor:"rgba(216,178,90,.14)",fill:true,tension:.3,borderWidth:2.5,pointRadius:data.map((_,i)=>i===data.length-1?6:3),pointBackgroundColor:data.map((_,i)=>i===data.length-1?ink:gold),pointBorderColor:gold});
  const isJ=$("#growthMetric").value==="jump",G=(isJ?st.tests.filter(t=>t.kind==="vert"):st.weights).slice().sort((a,b)=>a.date<b.date?-1:1);
  drawChart("Growth",isJ?"Log two vertical jump tests, in a session or from film, to draw this line.":"Log your body weight in two sessions to draw this line.",G.length>=2,{type:"line",
    data:{labels:G.map(s=>VB.shortDate(s.date)),datasets:[lineSet(isJ?"Vertical jump":"Body weight",G.map(s=>isJ?VB.lenOut(s.cm):VB.wOut(s.kg)))]},options:base(axes(isJ?VB.lu():VB.wu(),{grace:"15%"}))});
  const wk=VB.weekly(),cw=VB.weekStart(VB.today()),weeks=[];for(let i=9;i>=0;i--)weeks.push(VB.addDays(cw,-7*i));const tmin=p.days*p.mins;
  drawChart("Week","Your weekly minutes show up here after your first session.",st.sessions.length>0,{type:"bar",
    data:{labels:weeks.map(VB.shortDate),datasets:[{type:"line",label:"Weekly target",data:weeks.map(()=>tmin),borderColor:ink,borderDash:[6,4],borderWidth:1.5,pointRadius:0},{label:"Minutes trained",data:weeks.map(w=>wk[w]?wk[w].mins:0),backgroundColor:gold,borderRadius:4,maxBarThickness:28}]},options:base(axes("minutes",{beginAtZero:true}),true)});
  const sk=$("#accSkill").value,A=(VB.skillStats()[sk]||[]);
  drawChart("Acc","Score "+(VB.SKILLS[sk]||"").toLowerCase()+" drills in two sessions to draw this line.",A.length>=2,{type:"line",
    data:{labels:A.map(s=>VB.shortDate(s.date)),datasets:[lineSet("Score",A.map(x=>x.pct))]},options:base(axes("% of attempts",{min:0,max:100}))});
  const lad=Object.entries(st.chain).filter(([c,cs])=>cs&&cs.last&&CH[c]).map(([c,cs])=>{const n=VB.chainSteps(c).length;return {name:CH[c].name,v:n?Math.round((cs.i+1)/n*100):0,i:cs.i+1,n};}).sort((a,b)=>b.v-a.v).slice(0,10);
  drawChart("Lad","Finish a session to see how far up each exercise progression you are.",lad.length>0,{type:"bar",
    data:{labels:lad.map(l=>l.name),datasets:[{label:"Progression",data:lad.map(l=>l.v),backgroundColor:cool,borderRadius:4,maxBarThickness:16}]},
    options:Object.assign(base({x:{min:0,max:100,grid:{color:line},border:{display:false},title:{display:true,text:"% of the way up the progression"}},y:{grid:{display:false}}}),{indexAxis:"y"})});
  const vol=VB.muscleVolume(28),ids=Object.keys(vol).filter(id=>MI[id]).sort((a,b)=>vol[b]-vol[a]).slice(0,12);
  drawChart("Mus","Finish a session to see which muscles your work is going to.",ids.length>0,{type:"bar",
    data:{labels:ids.map(id=>MI[id].common),datasets:[{label:"Sets",data:ids.map(id=>Math.round(vol[id])),backgroundColor:ids.map(id=>st.muscles.includes(id)?gold:hot),borderRadius:4,maxBarThickness:16}]},
    options:Object.assign(base({x:{beginAtZero:true,grid:{color:line},border:{display:false},ticks:{precision:0},title:{display:true,text:"sets (gold = your focus muscles)"}},y:{grid:{display:false}}}),{indexAxis:"y"})});}
$("#growthMetric").onchange=renderCharts;$("#accSkill").onchange=renderCharts;
$("#stable").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;const i=S().sessions.findIndex(s=>s.id===b.dataset.del);if(i<0)return;const [gone]=S().sessions.splice(i,1);VB.save();renderProgress();toast("Session deleted.",()=>{S().sessions.push(gone);VB.save();renderProgress();});});
$("#otherForm").addEventListener("submit",e=>{e.preventDefault();const err=$("#oerr"),date=$("#o-date").value,type=$("#o-type").value,mins=+$("#o-mins").value||0,rpe=$("#o-rpe").value?+$("#o-rpe").value:null,jump=VB.lenIn($("#o-jump").value),weight=VB.wIn($("#o-weight").value);
  let msg="";if(!date)msg="Choose a date.";else if(date>VB.today())msg="That date is in the future.";else if(type!=="test"&&mins<5)msg="Enter the minutes, 5 or more.";else if(type==="test"&&jump==null&&weight==null)msg="Enter a vertical jump or a body weight.";else if(jump!=null&&(jump<3||jump>130))msg="A vertical jump is between "+VB.lenOut(3)+" and "+VB.lenOut(130)+" "+VB.lu()+". Check the number and your units.";else if(rpe!=null&&(rpe<1||rpe>10))msg="Effort goes from 1 to 10.";
  if(msg){err.textContent=msg;err.hidden=false;return;}err.hidden=true;
  if(type!=="test")S().sessions.push({id:VB.uid(),date,type,mins,rpe:rpe||5,items:[],notes:""});
  if(jump!=null)VB.addTest(jump,"manual",date);if(weight!=null)S().weights.push({date,kg:weight});
  VB.invalidatePlan();VB.save();["o-mins","o-rpe","o-jump","o-weight"].forEach(id=>$("#"+id).value="");renderProgress();toast("Saved.");});
$("#copyCsv").onclick=async()=>{const rows=[["date","type","minutes","effort","items"]].concat(S().sessions.slice().sort((a,b)=>a.date<b.date?-1:1).map(s=>[s.date,s.type,s.mins,s.rpe??"",'"'+(s.items||[]).map(i=>i.k==="ex"?i.id+" "+i.sets+"x"+i.reps+(i.load?"@"+Math.round(i.load*10)/10+"kg":"")+" "+i.feel:(i.id||i.skill)+" "+i.suc+"/"+i.att).join("; ")+'"']));
  try{await navigator.clipboard.writeText(rows.map(r=>r.join(",")).join("\n"));toast("Session log copied. Paste it into a spreadsheet.");}catch(e){toast("Copying was blocked by the browser.");}};

/* ---------- boot ---------- */
VB.ui.toast=toast;
function countUp(root){if(VB.reduced)return;root.querySelectorAll("[data-count]").forEach(el=>{const to=parseFloat(el.dataset.count);if(!isFinite(to)||to===0)return;const dec=(String(el.dataset.count).split(".")[1]||"").length,t0=performance.now();
  const step=now=>{const k=Math.min(1,(now-t0)/900),e=1-Math.pow(1-k,3);el.textContent=(to*e).toFixed(dec);if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);});}
VB.ui.countUp=countUp;
/* slide-in menu */
const menu=$("#menu"),menuBtn=$("#menuBtn");
function openMenu(){menu.hidden=false;menuBtn.setAttribute("aria-expanded","true");$$("#menu a").forEach(a=>{if(a.dataset.v===view)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});setTimeout(()=>{const f=$("#menu a[aria-current]")||$("#menu a");f&&f.focus();},40);}
function closeMenu(){menu.hidden=true;menuBtn.setAttribute("aria-expanded","false");}
menuBtn.addEventListener("click",openMenu);$("#menuClose").addEventListener("click",()=>{closeMenu();menuBtn.focus();});
menu.addEventListener("click",e=>{if(e.target===menu||e.target.closest("#menu a"))closeMenu();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!menu.hidden){closeMenu();menuBtn.focus();}});
VB.squad.init($("#squadRoot"));
function openPending(){if(pendingScan&&VB.openPlayer){const id=pendingScan;pendingScan=null;VB.openPlayer(id);}}
VB.onNet=()=>{VB.squad.onNet();VB.loadMediaCloud&&VB.loadMediaCloud();openPending();};
VB.ui.refresh=()=>{if(view==="today")renderToday();if(view==="progress")renderProgress();};
VB.loadLocal();
$("#startStat").textContent=`${Object.keys(MI).length} muscles · ${EXS.length} exercises · ${DRS.length} drills · ${Object.keys(VB.FAULTS).length} faults tracked`;
const mq=[`<b>${Object.keys(MI).length}</b> muscles`,`<b>${EXS.length}</b> exercises`,`<b>${Object.keys(CH).length}</b> progressions`,`<b>${DRS.length}</b> drills`,`<b>${TECHS.length}</b> techniques`,`<b>${Object.keys(VB.FAULTS).length}</b> faults tracked on film`,`<b>7</b> programs`,`<b>3</b> equipment levels`].map(x=>`<span>${x}</span>`).join("<span>·</span>");
$$("[data-mq]").forEach(el=>el.innerHTML=mq+"<span>·</span>"+mq+"<span>·</span>");
VB.film.init($("#filmRoot"));
applyProfile();
if(S().profile){const pos=VB.POS[S().profile.pos];if(pos){const m={attack:"spike",pass:"pass",set:"set",block:"block",serve:"float",dig:"dig"}[pos.skills[0]];if(m&&T[m])curTech=m;}}
route();if(RM.matches)reveal();else setTimeout(reveal,1450);setTimeout(()=>{const l=$("#loader");l&&l.remove();},2800);
function loop(now){if(view==="body")VB.body.frame();else if(view==="skills"){VB.court.frame(now);if(!scrubbing&&VB.court.playing())$("#cScrub").value=Math.round(VB.court.frac()*1000);{const ph=$("#cPhase"),t=VB.court.phase();if(ph&&ph.textContent!==t)ph.textContent=t;}}else if(view==="film")VB.film.frame();else if(view==="squad"&&VB.team3d)VB.team3d.frame(now);else if(view==="profile"&&VB.lockerFrame)VB.lockerFrame(now);else if(view==="today"||view==="start")VB.hero.frame(now);
  if(view==="profile"||!$("#modal").hidden)VB.cardFrame(now);requestAnimationFrame(loop);}
requestAnimationFrame(loop);
VB.initCloud(()=>{applyProfile();form.parentNode&&form.parentNode.removeChild(form);document.body.appendChild(form);form.hidden=true;route();});
})();
