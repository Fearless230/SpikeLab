/* toolkit-plus.js: four more courtside tools, added to the Toolkit tabs (#tools/arm, #tools/serve, #tools/react, #tools/mind).
   - Arm load: count attack swings and serves, see this week against your usual, and a daily shoulder check.
     Overhead athletes who ramp their swing count fast are more likely to get a sore shoulder, so it warns on spikes.
   - Serve targets: call a zone, serve, tap where it landed. Accuracy by zone and serve type, heat map, history.
   - Reaction: a tap test for reaction time, and "Read and go", random cues for footwork drills with a phone on the floor.
   - Mindset: a pre-serve routine to rehearse, a 10-second reset after errors, and a short post-match reflection.
   Everything is saved in the player's own data and works offline. */
(function(){
"use strict";
const VB=window.VB,S=()=>VB.state,esc=VB.esc,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
if(!VB.tools||!VB.tools.add)return;
const V5=VB.v5,ic=V5.ic,toast=V5.toast,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const obj=(k,def)=>{const s=S();if(!s[k]||typeof s[k]!=="object")s[k]=def();return s[k];};
const panel=()=>$("#tpanel");
const isTab=id=>VB.tools.tab===id;
let ac=null;function tone(f,d,v){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=ac||new A();if(ac.state==="suspended")ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.type="square";o.frequency.value=f;g.gain.setValueAtTime(v||.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d+.02);}catch(e){}}
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}};
const spark=(v,w,h)=>V5.spark?V5.spark(v,w||220,h||44):"";

/* ======================= arm load ======================= */
const arm=()=>{const a=obj("arm",()=>({days:{},pain:{}}));a.days=a.days||{};a.pain=a.pain||{};return a;};
const dayTot=d=>d?(d.att||0)+(d.srv||0)+(d.oth||0):0;
function sumDays(from,n){const A=arm().days;let t=0;for(let i=0;i<n;i++)t+=dayTot(A[VB.addDays(from,-i)]);return t;}
/* d7: swings in the last 7 days; usual: weekly average over the 4 weeks before that */
VB.armLoad=function(){const t=VB.today(),A=arm().days,d7=sumDays(t,7),prev=sumDays(VB.addDays(t,-7),28),usual=prev/4;
  const days=Object.keys(A).filter(k=>dayTot(A[k])>0).sort(),hist=days.length?VB.daysBetween(days[0],t):0;
  return {d7,usual:Math.round(usual),ratio:hist>=14&&usual>0?d7/usual:null,today:dayTot(A[t]),hist};};
let armUndo=[];
function renderArm(){const P=panel();if(!P)return;const a=arm(),t=VB.today(),d=a.days[t]||{},L=VB.armLoad(),pain=a.pain[t];
  const weeks=[];for(let i=7;i>=0;i--){const end=VB.addDays(t,-7*i);weeks.push([end,sumDays(end,7)]);}const mx=Math.max(1,...weeks.map(w=>w[1]));
  const r=L.ratio,adv=r==null?(L.hist<14?"Log two weeks of practices and this compares each week with your usual.":"Not enough recent history yet.")
    :r>1.3?`<b class="warnc">Big jump: ${Math.round((r-1)*100)}% more swings than usual.</b> Build up gradually: hold here for a week, or cut serving reps and add a rest day for the arm.`
    :r<.6?"Much lighter than usual. If you are coming back from a break, add swings a little at a time (about 10 to 20% a week)."
    :"In your normal range. Good for the shoulder.";
  const recentPain=[0,1,2].map(i=>a.pain[VB.addDays(t,-i)]).filter(v=>v!=null);
  const painAdv=pain==null?"How does your hitting shoulder feel today?":pain>=4?`<b class="warnc">Pain of ${pain}/10: skip hitting and serving today.</b> If it is still there in a few days, or it hurts at night, see a physiotherapist or doctor.`
    :pain>=1&&recentPain.length>=2&&recentPain.every(v=>v>=1)?"A niggle for a few days running: lower your swing count this week and do the Bulletproof shoulder arm-care program."
    :pain>=1?"A little sore: keep the arm-care warm-up before you hit and watch it tomorrow.":"No pain. Keep up the arm care.";
  P.innerHTML=`<div class="cgrid"><div class="v5card"><div class="kicker">${ic("arm")} Today · ${L.today} swings</div><h3>Count your swings</h3>
      <p class="small muted">Tap during practice or enter totals after. Swings at the ball count: attacks, serves, hard down-balls and throws.</p>
      <div class="mbtns armbtns">${[["att","Attack swing"],["srv","Serve"],["oth","Other overhead"]].map(([k,l])=>`<button type="button" class="mtap" data-arm="${k}" data-n="1"><b>${d[k]||0}</b><span>${l}</span></button>`).join("")}</div>
      <div class="row">${[["att","+10 attacks"],["srv","+10 serves"]].map(([k,l])=>`<button type="button" class="btn sm" data-arm="${k}" data-n="10">${l}</button>`).join("")}<button type="button" class="btn sm" id="armUndo" ${armUndo.length?"":"disabled"}>Undo</button></div></div>
    <div class="v5card"><div class="kicker">This week</div><h3>${L.d7} swings</h3>
      <div class="mkpis sm"><div><b>${L.d7}</b><span>Last 7 days</span></div><div><b>${L.usual||"–"}</b><span>Usual week</span></div><div><b>${r==null?"–":Math.round(r*100)+"%"}</b><span>Of usual</span></div></div>
      <p class="small">${adv}</p>
      <div class="armweeks" role="img" aria-label="Swings per week for the last 8 weeks">${weeks.map(([e,v],i)=>`<div class="aw ${i===weeks.length-1?"now":""}"><i style="height:${Math.round(v/mx*100)}%"></i><span>${v||""}</span><small>${i===weeks.length-1?"Now":VB.shortDate(VB.addDays(e,-6))}</small></div>`).join("")}</div></div>
    <div class="v5card"><div class="kicker">Shoulder check</div><h3>Pain today</h3>
      <div class="painrow" role="group" aria-label="Shoulder pain from 0 to 10">${Array.from({length:11},(_,i)=>`<button type="button" class="pbtn ${i>=4?"hi":i>=1?"mid":""}" data-pain="${i}" aria-pressed="${pain===i}">${i}</button>`).join("")}</div>
      <p class="small">${painAdv}</p>
      <div class="row"><a class="btn sm" href="#plan">${ic("heart")} Arm-care programs</a></div>
      <p class="small muted">This is a training guide, not medical advice.</p></div></div>`;}
document.addEventListener("click",e=>{if(!isTab("arm"))return;const b=e.target.closest("[data-arm],#armUndo,[data-pain]");if(!b)return;const a=arm(),t=VB.today();
  if(b.dataset.arm){const k=b.dataset.arm,n=+b.dataset.n||1;a.days[t]=a.days[t]||{};a.days[t][k]=(a.days[t][k]||0)+n;armUndo.push([t,k,n]);buzz(10);}
  else if(b.id==="armUndo"){const u=armUndo.pop();if(u&&a.days[u[0]])a.days[u[0]][u[1]]=Math.max(0,(a.days[u[0]][u[1]]||0)-u[2]);}
  else if(b.dataset.pain!=null){const v=+b.dataset.pain;if(a.pain[t]===v)delete a.pain[t];else a.pain[t]=v;if(v>=4)toast("Noted. Rest the arm from hitting today.");}
  VB.save();renderArm();});

/* ======================= serve targets ======================= */
const TYPES=[["float","Float"],["topspin","Topspin"],["jfloat","Jump float"],["jspin","Jump spin"],["under","Underhand"]];
const ERRS=[["net","Net"],["long","Long"],["wide","Wide"]];
/* the opponent's court seen from behind your baseline: deep row 1 6 5, front row 2 3 4 */
const ZONES={1:[0,0],6:[1,0],5:[2,0],2:[0,1],3:[1,1],4:[2,1]};
const sv=()=>{const o=obj("serve",()=>({sessions:[]}));o.sessions=o.sessions||[];if(!o.live)o.live={type:"float",aim:null,random:false,reps:[]};return o;};
function serveStats(reps){const n=reps.length,inn=reps.filter(r=>ZONES[r[1]]).length,on=reps.filter(r=>r[0]&&r[0]===r[1]).length,aimed=reps.filter(r=>r[0]).length,err={};
  reps.forEach(r=>{if(!ZONES[r[1]])err[r[1]]=(err[r[1]]||0)+1;});const byZ={};reps.forEach(r=>{if(!r[0])return;const z=byZ[r[0]]=byZ[r[0]]||{n:0,on:0};z.n++;if(r[0]===r[1])z.on++;});
  const land={};reps.forEach(r=>{if(ZONES[r[1]])land[r[1]]=(land[r[1]]||0)+1;});return {n,inn,on,aimed,err,byZ,land,inP:n?inn/n:null,onP:aimed?on/aimed:null};}
function courtSVG(L,st){const W=300,X=15,Y=15,CW=270,back=180,front=90,mx=Math.max(1,...Object.values(st.land));
  const cell=z=>{const [c,r]=ZONES[z],x=X+c*CW/3,y=r?Y+back:Y,h=r?front:back,heat=(st.land[z]||0)/mx,aim=L.aim===+z;
    return `<g class="sz ${aim?"aim":""}" data-sz="${z}" role="button" tabindex="0" aria-label="Zone ${z}${aim?", your target":""}${st.land[z]?", "+st.land[z]+" landed":""}"><rect x="${x}" y="${y}" width="${CW/3}" height="${h}" style="--heat:${heat.toFixed(2)}"/><text x="${x+CW/6}" y="${y+h/2+9}">${z}</text>${aim?`<circle cx="${x+CW/6}" cy="${y+h/2-22}" r="9" class="tgt"/>`:""}</g>`;};
  return `<svg viewBox="0 0 ${W} 330" class="scourt" aria-label="Opponent court, zones 1 to 6">${Object.keys(ZONES).map(cell).join("")}
    <line x1="${X}" y1="${Y+back}" x2="${X+CW}" y2="${Y+back}" class="al"/><line x1="${X-6}" y1="${Y+back+front}" x2="${X+CW+6}" y2="${Y+back+front}" class="net"/>
    <text x="${W/2}" y="${Y+back+front+16}" class="lbl">net</text><text x="${W/2}" y="322" class="lbl">you serve from the other baseline</text></svg>`;}
function pickRandom(){return +Object.keys(ZONES)[Math.floor(Math.random()*6)];}
function renderServe(){const P=panel();if(!P)return;const o=sv(),L=o.live,st=serveStats(L.reps);if(L.random&&!L.aim)L.aim=pickRandom();
  const H=o.sessions.slice(-12),trend=H.map(s=>Math.round((s.onP!=null?s.onP:s.inP||0)*100));
  P.innerHTML=`<div class="mgrid"><div class="stack"><div class="v5card"><div class="kicker">${ic("target")} Serve targets</div>
      <div class="seg" role="group" aria-label="Serve type">${TYPES.map(([k,l])=>`<button type="button" data-stype="${k}" aria-pressed="${L.type===k}">${l}</button>`).join("")}</div>
      <div class="seg" role="group" aria-label="Target"><button type="button" data-srand="0" aria-pressed="${!L.random}">I pick the target</button><button type="button" data-srand="1" aria-pressed="${!!L.random}">Random target each serve</button></div>
      <p class="small sstep" aria-live="polite">${L.aim?`<b>Target: zone ${L.aim}.</b> Serve, then tap where it landed (or an error below).`:"Tap the zone you are aiming for, then serve."}</p>
      ${courtSVG(L,st)}
      <div class="row">${ERRS.map(([k,l])=>`<button type="button" class="btn sm" data-serr="${k}" ${L.aim||!L.reps.length?"":""}>${l}</button>`).join("")}${L.aim&&!L.random?`<button type="button" class="btn sm" data-saim="0">Change target</button>`:""}<button type="button" class="btn sm" id="sUndo" ${L.reps.length?"":"disabled"}>Undo</button></div></div></div>
    <div class="stack"><div class="v5card"><div class="kicker">This session · ${st.n} serve${st.n===1?"":"s"}</div>
      <div class="mkpis"><div><b>${st.onP==null?"--":Math.round(st.onP*100)+"%"}</b><span>On target</span><small>${st.on} of ${st.aimed} aimed</small></div><div><b>${st.inP==null?"--":Math.round(st.inP*100)+"%"}</b><span>In play</span><small>${st.inn} of ${st.n}</small></div></div>
      ${st.n?`<p class="small">Errors: ${ERRS.map(([k,l])=>`${l} ${st.err[k]||0}`).join(" · ")}</p><div class="szacc">${Object.keys(ZONES).sort().map(z=>{const b=st.byZ[z];return `<span>Zone ${z}<b>${b?Math.round(b.on/b.n*100)+"%":"–"}</b><small>${b?b.on+"/"+b.n:""}</small></span>`;}).join("")}</div>`:`<p class="small muted">Aim for one zone for 10 serves, then move. Zones 1 and 5 (the deep corners) and the seam between two passers are the classic targets.</p>`}
      <div class="row"><button type="button" class="btn primary" id="sSave" ${st.n?"":"disabled"}>${ic("check")} Save session</button><button type="button" class="btn sm" id="sClear" ${st.n?"":"disabled"}>Clear</button></div></div>
    <div class="v5card"><div class="kicker">History · ${o.sessions.length} session${o.sessions.length===1?"":"s"}</div>
      ${H.length?`${trend.length>1?`<div class="sptrend">${spark(trend)}<small class="muted">On-target % per session</small></div>`:""}<div class="tblwrap"><table class="ctbl"><thead><tr><th>Date</th><th>Type</th><th>Serves</th><th>On target</th><th>In</th></tr></thead><tbody>${H.slice().reverse().map(s=>`<tr><td>${VB.shortDate(s.date)}</td><td>${esc((TYPES.find(t=>t[0]===s.type)||[0,s.type])[1])}</td><td>${s.n}</td><td>${s.onP==null?"–":Math.round(s.onP*100)+"%"}</td><td>${s.inP==null?"–":Math.round(s.inP*100)+"%"}</td></tr>`).join("")}</tbody></table></div>`:`<p class="small muted">Saved sessions show your accuracy trend by serve type.</p>`}</div></div></div>`;}
function addRep(hit){const o=sv(),L=o.live;L.reps.push([L.aim||null,hit,L.type]);buzz(10);if(L.random)L.aim=pickRandom();VB.save();renderServe();}
function serveClick(e){if(!isTab("serve"))return;const z=e.target.closest("[data-sz]"),b=e.target.closest("[data-stype],[data-srand],[data-serr],[data-saim],#sUndo,#sSave,#sClear");const o=sv(),L=o.live;
  if(z){const v=+z.dataset.sz;if(!L.aim){L.aim=v;VB.save();renderServe();}else addRep(v);return;}
  if(!b)return;
  if(b.dataset.stype){L.type=b.dataset.stype;}
  else if(b.dataset.srand!=null){L.random=b.dataset.srand==="1";L.aim=L.random?pickRandom():null;}
  else if(b.dataset.serr){if(!L.aim&&!L.random){toast("Pick a target zone first.");return;}addRep(b.dataset.serr);return;}
  else if(b.dataset.saim!=null){L.aim=null;}
  else if(b.id==="sUndo"){L.reps.pop();}
  else if(b.id==="sClear"){L.reps=[];L.aim=L.random?pickRandom():null;}
  else if(b.id==="sSave"){const st=serveStats(L.reps),types={};L.reps.forEach(r=>types[r[2]]=(types[r[2]]||0)+1);const main=Object.keys(types).sort((a,b)=>types[b]-types[a])[0]||L.type;
    o.sessions.push({id:VB.uid(),date:VB.today(),type:main,n:st.n,on:st.on,aimed:st.aimed,inn:st.inn,onP:st.onP,inP:st.inP,err:st.err,byZ:st.byZ});o.sessions=o.sessions.slice(-200);L.reps=[];L.aim=L.random?pickRandom():null;
    VB.log&&VB.log("Serve targets: "+st.n+" serves, "+(st.onP==null?"":Math.round(st.onP*100)+"% on target, ")+Math.round((st.inP||0)*100)+"% in.","info");toast("Serve session saved.");}
  VB.save();renderServe();}
document.addEventListener("click",serveClick);
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.closest&&e.target.closest("[data-sz]")){e.preventDefault();serveClick(e);}});

/* ======================= reaction ======================= */
const rx=()=>{const o=obj("react",()=>({tests:[]}));o.tests=o.tests||[];return o;};
const RT={mode:"tap",state:"idle",trials:[],t0:0,timer:0,drill:null,cfg:{cue:"dir",n:20,gap:"rand",beep:true}};
function stopAll(){clearTimeout(RT.timer);RT.timer=0;if(RT.drill){RT.drill.stop=true;RT.drill=null;}RT.state="idle";}
const CUES={dir:[["←","Left"],["→","Right"],["↑","Forward"],["↓","Back"]],zone:[["1","Zone 1"],["2","Zone 2"],["3","Zone 3"],["4","Zone 4"],["5","Zone 5"],["6","Zone 6"]],
  col:[["","Red","#e5384f"],["","Blue","#3b6cff"],["","Yellow","#f5c400"],["","Green","#1fb36b"]]};
function renderReact(){const P=panel();if(!P)return;const o=rx(),best=o.tests.length?Math.min(...o.tests.map(t=>t.best)):null,last=o.tests.slice(-10);
  const done=RT.trials.filter(x=>x>0),avg=done.length?Math.round(done.reduce((a,b)=>a+b,0)/done.length):null;
  P.innerHTML=`<div class="seg" role="group" aria-label="Mode" style="margin-bottom:14px"><button type="button" data-rmode="tap" aria-pressed="${RT.mode==="tap"}">Reaction test</button><button type="button" data-rmode="drill" aria-pressed="${RT.mode==="drill"}">Read and go drill</button></div>
   ${RT.mode==="tap"?`<div class="mgrid"><div class="v5card"><div class="kicker">${ic("bolt")} Reaction test · 5 tries</div>
      <button type="button" class="rstage ${RT.state}" id="rStage" aria-live="assertive">${RT.state==="idle"?`<b>Tap to start</b><span>Wait for green, then tap as fast as you can</span>`:RT.state==="wait"?`<b>Wait…</b><span>Tap when it turns green</span>`:RT.state==="go"?`<b>TAP!</b>`:RT.state==="early"?`<b>Too soon</b><span>Tap to try again</span>`:`<b>${RT.trials[RT.trials.length-1]} ms</b><span>${RT.trials.length<5?"Tap for the next one":"Done. Tap to start a new round"}</span>`}</button>
      <div class="rtries">${[0,1,2,3,4].map(i=>`<span>${RT.trials[i]!=null?RT.trials[i]+" ms":"–"}</span>`).join("")}</div></div>
     <div class="v5card"><div class="kicker">Your times</div><div class="mkpis"><div><b>${avg!=null?avg:"--"}</b><span>This round</span><small>average, ms</small></div><div><b>${best!=null?best:"--"}</b><span>Best ever</span><small>ms</small></div></div>
      ${last.length>1?`<div class="sptrend">${spark(last.map(t=>-t.avg))}<small class="muted">Average per round (higher is faster)</small></div>`:""}
      <p class="small muted">Most people land between 200 and 300 ms on a phone screen. Reading the setter and hitter earlier matters more than raw speed, so pair this with the Read and go drill.</p></div></div>`
   :`<div class="mgrid"><div class="v5card"><div class="kicker">${ic("eye")} Read and go</div>
      <p class="small muted">Prop the phone up where you can see it. When a cue shows, move: shuffle to that side, sprint to that zone, or the cone of that colour, then back to base.</p>
      <div class="grid"><label class="f">Cues<select id="rcue">${[["dir","Directions"],["zone","Court zones"],["col","Colours"]].map(([k,l])=>`<option value="${k}" ${RT.cfg.cue===k?"selected":""}>${l}</option>`).join("")}</select></label>
       <label class="f">How many<select id="rn">${[10,20,30,40].map(n=>`<option ${RT.cfg.n===n?"selected":""}>${n}</option>`).join("")}</select></label>
       <label class="f">Gap<select id="rgap"><option value="rand" ${RT.cfg.gap==="rand"?"selected":""}>Random 2 to 4 s</option><option value="2" ${RT.cfg.gap==="2"?"selected":""}>2 s</option><option value="3" ${RT.cfg.gap==="3"?"selected":""}>3 s</option><option value="5" ${RT.cfg.gap==="5"?"selected":""}>5 s</option></select></label></div>
      <label class="small"><input type="checkbox" id="rbeep" ${RT.cfg.beep?"checked":""}> Beep with each cue</label>
      <div class="row"><button type="button" class="btn primary" id="rGo">${RT.drill?"Stop":ic("play")+" Start"}</button></div></div>
     <div class="v5card"><div class="dstage" id="dStage" aria-live="assertive"><span class="muted">Cues appear here</span></div></div></div>`}`;}
function drillRun(){const cfg=RT.cfg,list=CUES[cfg.cue],D={stop:false,i:0};RT.drill=D;renderReact();const st=()=>$("#dStage");
  const show=(html,bg)=>{const el=st();if(!el)return;el.innerHTML=html;el.style.background=bg||"";};
  const step=k=>{if(D.stop||!isTab("react"))return;if(k>0){show(`<b class="cnt">${k}</b>`);tone(520,.1);RT.timer=setTimeout(()=>step(k-1),800);return;}next();};
  const next=()=>{if(D.stop)return;if(D.i>=cfg.n){show(`<b>Done</b><span>${cfg.n} cues</span>`);RT.drill=null;const b=$("#rGo");if(b)b.innerHTML=ic("play")+" Start";tone(990,.4,.16);return;}
    const c=list[Math.floor(Math.random()*list.length)];D.i++;show(cfg.cue==="col"?`<b>${c[1]}</b>`:`<b class="${cfg.cue==="dir"?"arrow":""}">${c[0]}</b><span>${c[1]}</span>`,c[2]);
    if(cfg.beep)tone(cfg.cue==="dir"&&c[1]==="Left"?440:cfg.cue==="dir"&&c[1]==="Right"?880:660,.15,.16);buzz(40);
    RT.timer=setTimeout(()=>{if(D.stop)return;show(`<span class="muted">${D.i} of ${cfg.n}</span>`);const g=cfg.gap==="rand"?2000+Math.random()*2000:+cfg.gap*1000;RT.timer=setTimeout(next,Math.max(400,g-1100));},1100);};
  step(3);}
document.addEventListener("click",e=>{if(!isTab("react"))return;const b=e.target.closest("[data-rmode],#rStage,#rGo");if(!b)return;
  if(b.dataset.rmode){stopAll();RT.mode=b.dataset.rmode;RT.trials=[];renderReact();return;}
  if(b.id==="rGo"){if(RT.drill){stopAll();renderReact();return;}RT.cfg={cue:$("#rcue").value,n:+$("#rn").value,gap:$("#rgap").value,beep:$("#rbeep").checked};drillRun();return;}
  if(b.id==="rStage"){const s=RT.state;
    if(s==="wait"){clearTimeout(RT.timer);RT.state="early";buzz([60,40,60]);return renderReact();}
    if(s==="go"){const ms=Math.round(performance.now()-RT.t0);RT.trials.push(ms);RT.state="shown";
      if(RT.trials.length===5){const o=rx(),v=RT.trials;o.tests.push({date:VB.today(),avg:Math.round(v.reduce((a,b)=>a+b,0)/5),best:Math.min(...v)});o.tests=o.tests.slice(-100);VB.save();}
      return renderReact();}
    if(s==="shown"&&RT.trials.length>=5)RT.trials=[];
    RT.state="wait";renderReact();RT.timer=setTimeout(()=>{if(RT.state!=="wait"||!isTab("react"))return;RT.state="go";RT.t0=performance.now();renderReact();},1200+Math.random()*2300);}});
/* the stage reacts on pointerdown for honest timing */
document.addEventListener("pointerdown",e=>{if(!isTab("react")||RT.state!=="go")return;const s=e.target.closest("#rStage");if(!s)return;e.preventDefault();s.click();});

/* ======================= mindset ======================= */
const DEF_ROUTINE=["Pick your target zone","Bounce the ball 3 times","Breathe in for 4, out for 6","Say your cue word: \"smooth\"","Toss and serve"];
const mind=()=>{const m=obj("mind",()=>({}));if(!Array.isArray(m.routine))m.routine=DEF_ROUTINE.slice();if(!Array.isArray(m.journal))m.journal=[];return m;};
const RATE=[["focus","Focus"],["conf","Confidence"],["talk","Communication"],["effort","Effort"],["fun","Enjoyment"]];
const MS={rehearse:null,reset:null,editing:false};
function stopMind(){[MS.rehearse,MS.reset].forEach(x=>{if(x){x.stop=true;clearTimeout(x.t);}});MS.rehearse=MS.reset=null;}
function renderMind(){const P=panel();if(!P)return;const m=mind(),J=m.journal.slice(-8).reverse(),lastM=(S().matches||[]).slice(-1)[0];
  const avg=k=>{const v=m.journal.slice(-6).map(j=>j.r&&j.r[k]).filter(x=>x);return v.length?(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):"–";};
  P.innerHTML=`<div class="cgrid"><div class="v5card"><div class="kicker">${ic("mind")} Pre-serve routine</div><h3>Same steps, every serve</h3>
      <p class="small muted">A fixed routine calms nerves and makes the toss repeatable. Rehearse it here until it is automatic.</p>
      ${MS.editing?`<ol class="rlist edit">${m.routine.map((s,i)=>`<li><input class="in" data-rstep="${i}" value="${esc(s)}" maxlength="60" aria-label="Step ${i+1}"><button type="button" class="x" data-rdel="${i}" aria-label="Remove step ${i+1}">×</button></li>`).join("")}</ol>
        <div class="row">${m.routine.length<8?`<button type="button" class="btn sm" id="rAdd">Add a step</button>`:""}<button type="button" class="btn sm" id="rReset">Back to the default</button><button type="button" class="btn sm primary" id="rEdit">Done</button></div>`
      :`<ol class="rlist" id="rList">${m.routine.map((s,i)=>`<li data-ri="${i}">${esc(s)}</li>`).join("")}</ol><div class="row"><button type="button" class="btn primary" id="rPlay">${MS.rehearse?"Stop":ic("play")+" Rehearse"}</button><button type="button" class="btn sm" id="rEdit">Edit steps</button></div>`}</div>
    <div class="v5card"><div class="kicker">After an error</div><h3>10-second reset</h3>
      <p class="small muted">Mistakes happen every rally. Flush it before the next ball: one slow breath, a physical cue, then a focus word.</p>
      <div class="breath ${MS.reset?"on":""}" id="bStage" aria-live="polite"><i></i><b>${MS.reset?"":"Ready"}</b></div>
      <div class="row"><button type="button" class="btn primary" id="bGo">${MS.reset?"Stop":"Start the reset"}</button></div></div>
    <div class="v5card"><div class="kicker">Post-match reflection</div><h3>Two minutes after the game</h3>
      <form id="jForm" class="stack" style="gap:10px"><label class="f">Match<input id="jOpp" maxlength="40" value="${esc(lastM&&lastM.date===VB.today()?("vs "+(lastM.opp||"opponent")):"")}" placeholder="vs Riverside"></label>
        <div class="jrates">${RATE.map(([k,l])=>`<div class="jr"><span>${l}</span><div class="seg sm" role="group" aria-label="${l}, 1 to 5">${[1,2,3,4,5].map(n=>`<button type="button" data-jr="${k}" data-v="${n}" aria-pressed="false">${n}</button>`).join("")}</div></div>`).join("")}</div>
        <label class="f">Three things that went well<input id="jW1" maxlength="80" placeholder="Called the ball early"><input id="jW2" maxlength="80"><input id="jW3" maxlength="80"></label>
        <label class="f">One thing to work on<input id="jFix" maxlength="80" placeholder="Toss drifting right under pressure"></label>
        <div class="row"><button class="btn primary" type="submit">${ic("check")} Save reflection</button></div></form></div>
    <div class="v5card"><div class="kicker">Your reflections · ${m.journal.length}</div>
      ${m.journal.length?`<div class="mkpis sm">${RATE.slice(0,3).map(([k,l])=>`<div><b>${avg(k)}</b><span>${l}</span><small>last 6, of 5</small></div>`).join("")}</div>
        <ul class="jlist">${J.map(j=>`<li><b>${VB.shortDate(j.date)}${j.opp?" · "+esc(j.opp):""}</b>${j.well&&j.well.length?`<span class="small">✓ ${j.well.map(esc).join(" · ")}</span>`:""}${j.fix?`<span class="small warnc">→ ${esc(j.fix)}</span>`:""}</li>`).join("")}</ul>
        ${(()=>{const fx=m.journal.slice(-6).map(j=>j.fix).filter(Boolean);return fx.length?`<p class="small muted">Working on lately: ${fx.slice(-3).map(esc).join("; ")}. Bring one of these to your next session.</p>`:"";})()}`
      :`<p class="small muted">Saved reflections show your focus and confidence over the season, and keep the things to work on in front of you.</p>`}</div></div>`;}
const jRates={};
function rehearse(){const m=mind(),R={stop:false,i:0};MS.rehearse=R;renderMind();
  const go=()=>{if(R.stop||!isTab("mind"))return;$$("#rList li").forEach((li,i)=>li.classList.toggle("on",i===R.i));if(R.i>=m.routine.length){MS.rehearse=null;renderMind();toast("Routine done. Run it again before every serve.");return;}
    const s=m.routine[R.i],ms=/breath|inhale|exhale/i.test(s)?10000:/bounce/i.test(s)?3500:2500;tone(620,.08);R.i++;R.t=setTimeout(go,ms);};go();}
function breathReset(){const B={stop:false};MS.reset=B;renderMind();const el=()=>$("#bStage");
  const seq=[["Breathe in",4000,"in"],["Breathe out slowly",6000,"out"],["Wipe it: brush your shorts or clap once",2500,""],["Next ball",2000,"go"]];let k=0;
  const go=()=>{if(B.stop||!isTab("mind"))return;const e=el();if(k>=seq.length){MS.reset=null;renderMind();return;}const [t,ms,cls]=seq[k++];if(e){e.className="breath on "+cls;e.querySelector("b").textContent=t;}B.t=setTimeout(go,ms);};go();}
document.addEventListener("click",e=>{if(!isTab("mind"))return;const b=e.target.closest("#rPlay,#rEdit,#rAdd,#rReset,[data-rdel],#bGo,[data-jr]");if(!b)return;const m=mind();
  if(b.id==="rPlay"){if(MS.rehearse){stopMind();renderMind();}else rehearse();return;}
  if(b.id==="rEdit"){stopMind();MS.editing=!MS.editing;m.routine=m.routine.map(s=>s.trim()).filter(Boolean);if(!m.routine.length)m.routine=DEF_ROUTINE.slice();VB.save();renderMind();return;}
  if(b.id==="rAdd"){m.routine.push("New step");VB.save();renderMind();const ins=$$("[data-rstep]");ins.length&&ins[ins.length-1].select();return;}
  if(b.id==="rReset"){m.routine=DEF_ROUTINE.slice();VB.save();renderMind();return;}
  if(b.dataset.rdel!=null){m.routine.splice(+b.dataset.rdel,1);VB.save();renderMind();return;}
  if(b.id==="bGo"){if(MS.reset){stopMind();renderMind();}else breathReset();return;}
  if(b.dataset.jr){jRates[b.dataset.jr]=+b.dataset.v;$$(`[data-jr="${b.dataset.jr}"]`).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));}});
document.addEventListener("input",e=>{if(!isTab("mind")||e.target.dataset.rstep==null)return;mind().routine[+e.target.dataset.rstep]=e.target.value.slice(0,60);VB.save();});
document.addEventListener("submit",e=>{if(e.target.id!=="jForm")return;e.preventDefault();const m=mind(),v=id=>($("#"+id).value||"").trim();
  const well=["jW1","jW2","jW3"].map(v).filter(Boolean),fix=v("jFix");if(!well.length&&!fix&&!Object.keys(jRates).length){toast("Rate the match or write one line first.");return;}
  m.journal.push({id:VB.uid(),date:VB.today(),opp:v("jOpp").slice(0,40),r:Object.assign({},jRates),well,fix});m.journal=m.journal.slice(-200);Object.keys(jRates).forEach(k=>delete jRates[k]);
  VB.save();renderMind();toast("Reflection saved.");});

/* leaving the Toolkit stops running drills and timers */
window.addEventListener("hashchange",()=>{if(!(location.hash||"").startsWith("#tools")){stopAll();stopMind();}});
/* ---------- register the tools ---------- */
VB.tools.add("arm","Arm load","arm",renderArm);
VB.tools.add("serve","Serve targets","target",renderServe);
VB.tools.add("react","Reaction","bolt",renderReact,stopAll);
VB.tools.add("mind","Mindset","mind",renderMind,stopMind);
setTimeout(()=>{const h=(location.hash||"").slice(1).split("/");if(h[0]==="tools"&&["arm","serve","react","mind"].includes(h[1])&&S().profile)VB.tools.show(h[1]);},0);
})();
