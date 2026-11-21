/* v5-tools.js: the Toolkit view (#tools). Six courtside tools, all offline:
   interval timer · match stat tracker · rotation viewer (switches, receive formations, overlap quiz) · plays library · calculators · rules, signals, quiz and glossary.
   Sub-tabs live in the hash (#tools/timer) so the Home quick actions can deep-link. */
(function(){
"use strict";
const VB=window.VB,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s)),esc=VB.esc;
const S=()=>VB.state,V5=VB.v5,ic=V5.ic,toast=V5.toast;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TABS=[["timer","Interval timer","timer"],["match","Match tracker","board"],["rotations","Rotations","rotate"],["plays","Plays","play"],["calc","Calculators","calc"],["rules","Rules and terms","book"]];
let tab="timer";

function show(sub){if(TABS.some(t=>t[0]===sub))tab=sub;render();}
function render(){const root=$("#toolsRoot");if(!root)return;
  root.innerHTML=`<div class="ttabs" role="tablist" aria-label="Tools">${TABS.map(([id,l,i])=>`<button type="button" role="tab" data-ttab="${id}" aria-selected="${id===tab}">${ic(i)}<span>${esc(l)}</span></button>`).join("")}</div><div id="tpanel" class="tpanel"></div>`;
  if(tab!=="rotations"){autoStop();RS.sig="";}if(tab!=="plays"){PS.playing=false;cancelAnimationFrame(PS.raf);}
  ({timer:renderTimer,match:renderMatch,rotations:renderRot,plays:renderPlays,calc:renderCalc,rules:renderRules})[tab]();}
document.addEventListener("click",e=>{const b=e.target.closest("[data-ttab]");if(!b)return;tab=b.dataset.ttab;try{history.replaceState(null,"","#tools/"+tab);}catch(_){}render();});
VB.tools={show,render};
// the first route ran before this file loaded
setTimeout(()=>{const h=(location.hash||"").slice(1).split("/");if(h[0]==="tools"&&S().profile)show(h[1]||"");},0);

/* ---------- sound ---------- */
let ac=null;function tone(f,d,v){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=ac||new A();if(ac.state==="suspended")ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.type="square";o.frequency.value=f;g.gain.setValueAtTime(v||.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d+.02);}catch(e){}}
const blip=()=>tone(660,.12),horn=()=>{tone(990,.45,.16);try{navigator.vibrate&&navigator.vibrate([200,80,200]);}catch(e){}};

/* ================= interval timer ================= */
const PRESETS=[
 {id:"tabata",name:"Tabata",sub:"20 s on, 10 s off × 8",mode:"interval",work:20,rest:10,rounds:8},
 {id:"plyo",name:"Plyo sets",sub:"10 s on, 50 s rest × 6",mode:"interval",work:10,rest:50,rounds:6},
 {id:"shuffle",name:"Shuffle sprints",sub:"15 s on, 45 s rest × 6",mode:"interval",work:15,rest:45,rounds:6},
 {id:"core",name:"Core circuit",sub:"40 s on, 20 s off × 8",mode:"interval",work:40,rest:20,rounds:8},
 {id:"plank",name:"Plank holds",sub:"30 s on, 30 s off × 4",mode:"interval",work:30,rest:30,rounds:4},
 {id:"emom10",name:"EMOM 10",sub:"Every minute on the minute",mode:"emom",minutes:10},
 {id:"serve",name:"Serving blocks",sub:"3 min on, 1 min off × 5",mode:"interval",work:180,rest:60,rounds:5},
 {id:"watch",name:"Stopwatch",sub:"Count up, with laps",mode:"stopwatch"}];
const T={cfg:Object.assign({},PRESETS[0]),segs:[],i:0,segStart:0,paused:0,running:false,started:false,laps:[],swStart:0,swAcc:0,iv:0,lastBeep:-1};
function buildSegs(c){const s=[{ph:"prep",d:10,r:0}];
  if(c.mode==="interval"){for(let r=1;r<=c.rounds;r++){s.push({ph:"work",d:c.work,r});if(r<c.rounds&&c.rest>0)s.push({ph:"rest",d:c.rest,r});}}
  else if(c.mode==="emom"){for(let r=1;r<=c.minutes;r++)s.push({ph:"work",d:60,r});}return s;}
const fmt=sec=>{sec=Math.max(0,sec);const m=Math.floor(sec/60),s=Math.floor(sec%60);return (m<10?"0":"")+m+":"+(s<10?"0":"")+s;};
const fmtMs=ms=>{const s=ms/1000;return fmt(s)+"."+Math.floor((ms%1000)/100);};
const totalOf=c=>c.mode==="interval"?c.rounds*c.work+(c.rounds-1)*c.rest:c.mode==="emom"?c.minutes*60:0;
function tState(){const now=performance.now();
  if(T.cfg.mode==="stopwatch"){const el=T.swAcc+(T.running?now-T.swStart:0);return {sw:true,el};}
  if(!T.started)return {ph:"ready",left:totalOf(T.cfg),segLeft:T.cfg.mode==="emom"?60:T.cfg.work,frac:0,r:0};
  const seg=T.segs[T.i];if(!seg)return {ph:"done",left:0,segLeft:0,frac:1,r:T.cfg.rounds||T.cfg.minutes};
  const el=((T.running?now:T.paused)-T.segStart)/1000,segLeft=seg.d-el;let rest=segLeft;for(let k=T.i+1;k<T.segs.length;k++)rest+=T.segs[k].d;
  return {ph:seg.ph,left:rest,segLeft,frac:clamp(el/seg.d,0,1),r:seg.r};}
function tick(){if(!T.running)return;const now=performance.now();
  if(T.cfg.mode!=="stopwatch"){const seg=T.segs[T.i];if(!seg){stop(true);return;}const el=(now-T.segStart)/1000,left=Math.ceil(seg.d-el);
    if(left<=3&&left>=1&&left!==T.lastBeep){T.lastBeep=left;blip();}
    if(el>=seg.d){T.i++;T.segStart+=seg.d*1000;T.lastBeep=-1;if(T.i>=T.segs.length){stop(true);return;}horn();}}
  paint();}
function start(){if(T.cfg.mode==="stopwatch"){if(!T.running){T.swStart=performance.now();T.running=true;}}
  else if(!T.started){T.segs=buildSegs(T.cfg);T.i=0;T.segStart=performance.now();T.started=true;T.running=true;blip();}
  else if(!T.running){T.segStart+=performance.now()-T.paused;T.running=true;}
  clearInterval(T.iv);T.iv=setInterval(tick,100);wake(true);paint();}
function pause(){if(!T.running)return;if(T.cfg.mode==="stopwatch")T.swAcc+=performance.now()-T.swStart;else T.paused=performance.now();T.running=false;clearInterval(T.iv);wake(false);paint();}
function stop(done){clearInterval(T.iv);T.running=false;wake(false);if(done){T.i=T.segs.length;horn();setTimeout(horn,500);toast("Timer done. Nice work.");}paint();}
function reset(){clearInterval(T.iv);T.running=false;T.started=false;T.i=0;T.laps=[];T.swAcc=0;T.lastBeep=-1;wake(false);paint();}
function skip(){if(!T.started||T.cfg.mode==="stopwatch")return;const now=performance.now();T.i++;T.segStart=T.running?now:T.paused;T.lastBeep=-1;if(T.i>=T.segs.length)stop(true);else{horn();paint();}}
let lock=null;async function wake(on){try{if(on&&"wakeLock" in navigator&&!lock)lock=await navigator.wakeLock.request("screen");else if(!on&&lock){await lock.release();lock=null;}}catch(e){}}
const PHC={prep:"#ffc145",work:"var(--gold)",rest:"#9d86ff",done:"#4fd394",ready:"var(--muted)"};
const PHL={prep:"Get ready",work:"Work",rest:"Rest",done:"Done",ready:"Ready"};
function paint(){const st=tState(),big=$("#tbig"),pill=$("#tpill");
  const onTools=V5.view()==="tools"&&tab==="timer";
  if(pill){const active=T.running||(T.started&&st.ph!=="done")||(T.cfg.mode==="stopwatch"&&(T.running||T.swAcc));pill.hidden=onTools||!active;
    if(!pill.hidden)pill.innerHTML=`<i style="background:${st.sw?"var(--gold)":PHC[st.ph]}"></i><b>${st.sw?fmt(st.el/1000):fmt(Math.ceil(st.segLeft))}</b><span>${st.sw?"Stopwatch":PHL[st.ph]+(st.r?" · "+st.r:"")}</span>`;}
  if(!big)return;
  const btn=$("#tgo");if(btn)btn.innerHTML=T.running?"Pause":(T.started||T.swAcc?"Resume":"Start");
  if(st.sw){big.style.setProperty("--pc","var(--gold)");$("#tnum").textContent=fmtMs(st.el);$("#tph").textContent=T.running?"Running":"Stopwatch";$("#tsub").textContent=T.laps.length?T.laps.length+" laps":"Tap Lap to split";
    const arc=$("#tarc");arc.style.strokeDashoffset=String(1-((st.el/1000)%60)/60);$("#tlaps").innerHTML=T.laps.map((l,i)=>`<li><span>Lap ${i+1}</span><b>${fmtMs(l.split)}</b><small>${fmtMs(l.total)}</small></li>`).reverse().join("");return;}
  big.style.setProperty("--pc",PHC[st.ph]);big.dataset.ph=st.ph;
  $("#tnum").textContent=st.ph==="ready"?fmt(T.cfg.mode==="emom"?60:T.cfg.work):fmt(Math.ceil(st.segLeft));
  $("#tph").textContent=PHL[st.ph];
  const n=T.cfg.mode==="emom"?T.cfg.minutes:T.cfg.rounds;$("#tsub").textContent=st.ph==="done"?"All "+n+" rounds complete":st.ph==="ready"?n+" rounds · "+fmt(totalOf(T.cfg))+" total":(st.r?"Round "+st.r+" of "+n+" · ":"")+fmt(Math.ceil(st.left))+" left";
  $("#tarc").style.strokeDashoffset=String(st.ph==="ready"?0:st.frac);
  const segs=$("#trounds");if(segs)segs.innerHTML=Array.from({length:n},(_,k)=>`<i class="${st.r>k+1||st.ph==="done"?"d":st.r===k+1?"c":""}"></i>`).join("");}
function renderTimer(){const c=T.cfg,p=$("#tpanel");
  p.innerHTML=`<div class="tgrid"><div class="tclock v5card" id="tbig">
      <svg class="tring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="10"/><circle id="tarc" cx="100" cy="100" r="88" fill="none" stroke="var(--pc)" stroke-width="10" stroke-linecap="round" pathLength="1" stroke-dasharray="1" transform="rotate(-90 100 100)"/></svg>
      <div class="tread" aria-live="polite"><span id="tph" class="tph"></span><b id="tnum" class="tnum"></b><span id="tsub" class="tsub"></span></div>
      <div class="trounds" id="trounds"></div>
      <div class="row tbtns"><button type="button" class="btn primary" id="tgo">Start</button>${c.mode==="stopwatch"?`<button type="button" class="btn" id="tlap">Lap</button>`:`<button type="button" class="btn" id="tskip">Skip</button>`}<button type="button" class="btn" id="treset">Reset</button></div>
      ${c.mode==="stopwatch"?`<ol class="tlaps" id="tlaps"></ol>`:""}</div>
    <div class="stack"><div class="v5card"><div class="kicker">Presets</div><div class="tpre">${PRESETS.map(x=>`<button type="button" class="tp" data-tpre="${x.id}" aria-pressed="${c.id===x.id}"><b>${esc(x.name)}</b><small>${esc(x.sub)}</small></button>`).join("")}</div></div>
      <form class="v5card" id="tcustom"><div class="kicker">Custom</div>
       <div class="seg" role="group" aria-label="Mode"><button type="button" data-tmode="interval" aria-pressed="${c.mode==="interval"}">Intervals</button><button type="button" data-tmode="emom" aria-pressed="${c.mode==="emom"}">EMOM</button><button type="button" data-tmode="stopwatch" aria-pressed="${c.mode==="stopwatch"}">Stopwatch</button></div>
       ${c.mode==="interval"?`<div class="grid"><label class="f">Work (s)<input type="number" id="tw" min="5" max="1800" value="${c.work}"></label><label class="f">Rest (s)<input type="number" id="tr" min="0" max="1800" value="${c.rest}"></label><label class="f">Rounds<input type="number" id="tn" min="1" max="50" value="${c.rounds}"></label></div>`:
         c.mode==="emom"?`<div class="grid"><label class="f">Minutes<input type="number" id="tm" min="1" max="60" value="${c.minutes}"></label></div><p class="small muted">Do the set at the top of every minute; the rest of the minute is your rest.</p>`:`<p class="small muted">Counts up. Use Lap for each rep, rally or sprint.</p>`}
       ${c.mode==="stopwatch"?"":`<button type="submit" class="btn sm">Use these settings</button>`}
       <p class="small muted">10-second countdown to start, three short beeps before each change, a long beep and a buzz when it changes. The screen stays awake while it runs.</p></form></div></div>`;
  paint();}
document.addEventListener("click",e=>{const b=e.target.closest("#tgo,#tskip,#treset,#tlap,[data-tpre],[data-tmode],#tpill");if(!b)return;
  if(b.id==="tgo"){T.running?pause():start();}
  else if(b.id==="tskip")skip();else if(b.id==="treset")reset();
  else if(b.id==="tlap"){if(!T.running)return;const now=performance.now(),total=T.swAcc+(now-T.swStart),prev=T.laps.length?T.laps[T.laps.length-1].total:0;T.laps.push({total,split:total-prev});blip();paint();}
  else if(b.id==="tpill"){location.hash="#tools/timer";}
  else if(b.dataset.tpre){reset();T.cfg=Object.assign({},PRESETS.find(x=>x.id===b.dataset.tpre));renderTimer();}
  else if(b.dataset.tmode){reset();const m=b.dataset.tmode;T.cfg=m==="interval"?{id:"custom",mode:m,work:30,rest:30,rounds:6}:m==="emom"?{id:"custom",mode:m,minutes:10}:{id:"watch",mode:"stopwatch"};renderTimer();}});
document.addEventListener("submit",e=>{if(e.target.id!=="tcustom")return;e.preventDefault();reset();const n=id=>+($("#"+id)||{}).value||0;
  T.cfg=T.cfg.mode==="emom"?{id:"custom",mode:"emom",minutes:clamp(n("tm"),1,60)}:{id:"custom",mode:"interval",work:clamp(n("tw"),5,1800),rest:clamp(n("tr"),0,1800),rounds:clamp(n("tn"),1,50)};renderTimer();toast("Timer set.");});
// floating pill so a running timer stays visible on every screen
const pill=document.createElement("button");pill.type="button";pill.id="tpill";pill.className="tpill";pill.hidden=true;pill.setAttribute("aria-label","Open the running timer");document.body.appendChild(pill);
window.addEventListener("hashchange",()=>setTimeout(paint,500));

/* ================= match tracker ================= */
const STATS=[
 ["Attack",[["k","Kill","g"],["ae","Error","b"],["ta0","In play",""]]],
 ["Serve",[["sa","Ace","g"],["se","Error","b"],["sin","In",""]]],
 ["Serve receive",[["r3","3 perfect","g"],["r2","2 good",""],["r1","1 poor",""],["r0","0 aced","b"]]],
 ["Block",[["bs","Solo","g"],["ba","Assist","g"],["be","Error","b"]]],
 ["Defence",[["dg","Dig","g"],["de","Error","b"]]],
 ["Setting",[["as","Assist","g"],["bhe","Ball handling error","b"]]]];
const matches=()=>{const s=S();if(!Array.isArray(s.matches))s.matches=[];return s.matches;};
function live(){const s=S();if(!s.matchLive)s.matchLive={opp:"",date:VB.today(),sets:[[0,0]],stats:{},undo:[]};return s.matchLive;}
function derive(x){const g=k=>x[k]||0,ta=g("k")+g("ae")+g("ta0"),sv=g("sa")+g("se")+g("sin"),rc=g("r3")+g("r2")+g("r1")+g("r0");
  return {ta,hit:ta?(g("k")-g("ae"))/ta:null,kp:ta?g("k")/ta:null,serveIn:sv?(g("sa")+g("sin"))/sv:null,sv,aces:g("sa"),pass:rc?(3*g("r3")+2*g("r2")+g("r1"))/rc:null,rc,blocks:g("bs")+.5*g("ba"),digs:g("dg"),assists:g("as"),pts:g("k")+g("sa")+g("bs")+.5*g("ba"),errs:g("ae")+g("se")+g("be")+g("de")+g("bhe")+g("r0")};}
const pct3=v=>v==null?"--":(v<0?"-":"")+"."+String(Math.round(Math.abs(v)*1000)).padStart(3,"0");
const pct=v=>v==null?"--":Math.round(v*100)+"%";
const won=m=>{let a=0,b=0;(m.sets||[]).forEach(([u,t])=>{if(u>t)a++;else if(t>u)b++;});return [a,b];};
let mChart=null,delArm=null;
function renderMatch(){const L=live(),d=derive(L.stats),M=matches().slice().sort((a,b)=>a.date<b.date?-1:1),ev=((S().season||{}).events||[]).find(e=>e.date===L.date);
  const sw=won(L);
  $("#tpanel").innerHTML=`<div class="mgrid"><div class="stack">
    <div class="v5card mscore"><div class="mhead"><label class="f">Opponent<input id="mopp" value="${esc(L.opp||(ev&&ev.name)||"")}" placeholder="Team name" maxlength="40"></label><label class="f">Date<input id="mdate" type="date" value="${esc(L.date)}"></label></div>
      <div class="msets">${L.sets.map(([u,t],i)=>`<div class="mset"><span>Set ${i+1}</span><div class="mss"><button type="button" class="mb" data-ms="${i},0,-1" aria-label="Your score down">−</button><b>${u}</b><button type="button" class="mb" data-ms="${i},0,1" aria-label="Your score up">+</button></div><i>:</i><div class="mss them"><button type="button" class="mb" data-ms="${i},1,-1" aria-label="Their score down">−</button><b>${t}</b><button type="button" class="mb" data-ms="${i},1,1" aria-label="Their score up">+</button></div></div>`).join("")}
      <div class="row"><button type="button" class="btn sm" data-mset="add">Add a set</button>${L.sets.length>1?`<button type="button" class="btn sm" data-mset="del">Remove last set</button>`:""}<span class="msw">Sets ${sw[0]} : ${sw[1]}</span></div></div></div>
    <div class="v5card mpad"><div class="row" style="justify-content:space-between"><div class="kicker">Your stats · tap to count</div><button type="button" class="btn sm" id="mundo" ${L.undo.length?"":"disabled"}>Undo last tap</button></div>
      ${STATS.map(([grp,list])=>`<div class="mgrp"><span class="grp">${esc(grp)}</span><div class="mbtns">${list.map(([k,l,c])=>`<button type="button" class="mtap ${c}" data-mt="${k}"><b>${L.stats[k]||0}</b><span>${esc(l)}</span></button>`).join("")}</div></div>`).join("")}</div></div>
   <div class="stack"><div class="v5card mlive"><div class="kicker">Live numbers</div>
     <div class="mkpis"><div><b>${pct3(d.hit)}</b><span>Hitting %</span><small>${d.ta} attempts</small></div><div><b>${d.pass==null?"--":d.pass.toFixed(2)}</b><span>Pass rating</span><small>${d.rc} receptions</small></div><div><b>${pct(d.serveIn)}</b><span>Serves in</span><small>${d.aces} aces</small></div><div><b>${d.pts%1?d.pts.toFixed(1):d.pts}</b><span>Points</span><small>${d.blocks%1?d.blocks.toFixed(1):d.blocks} blocks · ${d.digs} digs</small></div></div>
     <p class="small muted">Hitting % = (kills − errors) ÷ attempts. Pass rating is the average on a 0 to 3 scale. Points = kills + aces + solo blocks + half of block assists.</p>
     <div class="row"><button type="button" class="btn primary" id="msave">${ic("check")} Save match</button><button type="button" class="btn sm" id="mclear">Clear</button></div></div>
    <div class="v5card"><div class="row" style="justify-content:space-between"><div class="kicker">Season · ${M.length} match${M.length===1?"":"es"}</div>${M.length?`<button type="button" class="btn sm" id="mcsv">Copy as CSV</button>`:""}</div>
     ${M.length?seasonHTML(M):`<p class="small muted">Saved matches build your season numbers and a hitting % trend here.</p>`}</div></div></div>`;
  if(M.length>1&&window.Chart){const cv=$("#mchart");if(cv){if(mChart)try{mChart.destroy();}catch(e){}const css=getComputedStyle(document.documentElement),ink=css.getPropertyValue("--muted").trim(),line=css.getPropertyValue("--line").trim(),gold=css.getPropertyValue("--gold").trim();
    mChart=new Chart(cv,{type:"line",data:{labels:M.map(m=>VB.shortDate(m.date)),datasets:[{label:"Hitting %",data:M.map(m=>{const v=derive(m.stats).hit;return v==null?null:Math.round(v*1000)/1000;}),borderColor:gold,backgroundColor:gold,tension:.3,spanGaps:true},{label:"Pass rating ÷ 10",data:M.map(m=>{const v=derive(m.stats).pass;return v==null?null:Math.round(v*100)/1000;}),borderColor:"#45c8ff",backgroundColor:"#45c8ff",tension:.3,spanGaps:true,borderDash:[5,4]}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:ink,boxWidth:12}}},scales:{y:{ticks:{color:ink},grid:{color:line}},x:{ticks:{color:ink},grid:{display:false}}}}});}}}
function seasonHTML(M){const tot={};M.forEach(m=>Object.entries(m.stats||{}).forEach(([k,v])=>tot[k]=(tot[k]||0)+v));const d=derive(tot);let w=0,l=0;M.forEach(m=>{const s=won(m);if(s[0]>s[1])w++;else if(s[1]>s[0])l++;});
  return `<div class="mkpis sm"><div><b>${w}–${l}</b><span>Record</span></div><div><b>${pct3(d.hit)}</b><span>Hitting %</span></div><div><b>${d.pass==null?"--":d.pass.toFixed(2)}</b><span>Pass</span></div><div><b>${(tot.k||0)}</b><span>Kills</span></div><div><b>${tot.sa||0}</b><span>Aces</span></div><div><b>${d.blocks%1?d.blocks.toFixed(1):d.blocks}</b><span>Blocks</span></div></div>
   ${M.length>1?`<div class="chartbox" style="height:190px"><canvas id="mchart"></canvas></div>`:""}
   <ul class="mlist">${M.slice().reverse().map(m=>{const s=won(m),x=derive(m.stats);return `<li><div><b>${s[0]>s[1]?"W":s[1]>s[0]?"L":"–"} ${s[0]}–${s[1]}</b> vs ${esc(m.opp||"Opponent")}<small>${VB.shortDate(m.date)} · ${(m.sets||[]).map(z=>z.join("-")).join(", ")}</small></div><div class="mlst"><span>${pct3(x.hit)} hit</span><span>${x.pass==null?"--":x.pass.toFixed(2)} pass</span><span>${x.pts%1?x.pts.toFixed(1):x.pts} pts</span></div><button type="button" class="btn sm" data-mdel="${m.id}">${delArm===m.id?"Confirm delete":"Delete"}</button></li>`;}).join("")}</ul>`;}
document.addEventListener("click",async e=>{const b=e.target.closest("[data-mt],[data-ms],[data-mset],#mundo,#msave,#mclear,[data-mdel],#mcsv");if(!b)return;const L=live();
  if(b.dataset.mt){const k=b.dataset.mt;L.stats[k]=(L.stats[k]||0)+1;L.undo.push(k);if(L.undo.length>200)L.undo.shift();try{navigator.vibrate&&navigator.vibrate(12);}catch(_){}VB.save();renderMatch();const nb=$(`[data-mt="${k}"]`);nb&&nb.classList.add("pop");return;}
  if(b.id==="mundo"){const k=L.undo.pop();if(k&&L.stats[k])L.stats[k]--;VB.save();renderMatch();return;}
  if(b.dataset.ms){const [i,side,dv]=b.dataset.ms.split(",").map(Number);L.sets[i][side]=clamp(L.sets[i][side]+dv,0,99);VB.save();renderMatch();return;}
  if(b.dataset.mset){if(b.dataset.mset==="add"&&L.sets.length<5)L.sets.push([0,0]);else if(b.dataset.mset==="del"&&L.sets.length>1)L.sets.pop();VB.save();renderMatch();return;}
  if(b.id==="mclear"){S().matchLive=null;VB.save();renderMatch();toast("Cleared.");return;}
  if(b.id==="msave"){const n=Object.values(L.stats).reduce((a,v)=>a+v,0);if(!n&&!L.sets.some(s=>s[0]||s[1]))return toast("Tap a few stats or enter the score first.");
    const opp=($("#mopp").value||"").trim().slice(0,40),date=$("#mdate").value||VB.today(),m={id:VB.uid(),date,opp,sets:L.sets.filter(s=>s[0]||s[1]),stats:Object.assign({},L.stats)};
    matches().push(m);S().matchLive=null;const d=derive(m.stats),s=won(m);VB.log("Match saved vs "+(opp||"opponent")+": "+s[0]+"–"+s[1]+(d.ta?", hitting "+pct3(d.hit):"")+(d.rc?", pass "+d.pass.toFixed(2):"")+".","info");
    // a match counts as training load too
    if(!VB.state.sessions.some(x=>x.date===date&&x.type==="match"))VB.state.sessions.push({id:VB.uid(),date,type:"match",mins:90,rpe:7,items:[],notes:"Match vs "+(opp||"opponent")});VB.invalidatePlan();
    VB.save();renderMatch();toast("Match saved and logged as 90 minutes of training. +80 XP");return;}
  if(b.dataset.mdel){const id=b.dataset.mdel;if(delArm!==id){delArm=id;renderMatch();setTimeout(()=>{if(delArm===id){delArm=null;if(tab==="match")renderMatch();}},4000);return;}
    S().matches=matches().filter(m=>m.id!==id);delArm=null;VB.save();renderMatch();return;}
  if(b.id==="mcsv"){const keys=STATS.flatMap(g=>g[1].map(x=>x[0])),rows=[["date","opponent","sets",...keys,"hitting_pct","pass_rating"]];matches().forEach(m=>{const d=derive(m.stats);rows.push([m.date,'"'+(m.opp||"").replace(/"/g,"'")+'"',(m.sets||[]).map(z=>z.join("-")).join(" "),...keys.map(k=>m.stats[k]||0),d.hit==null?"":d.hit.toFixed(3),d.pass==null?"":d.pass.toFixed(2)]);});
    try{await navigator.clipboard.writeText(rows.map(r=>r.join(",")).join("\n"));toast("Copied. Paste it into a spreadsheet.");}catch(_){toast("Copying was blocked by the browser.");}}});
document.addEventListener("change",e=>{if(e.target.id==="mopp"||e.target.id==="mdate"){const L=live();L.opp=$("#mopp").value.trim().slice(0,40);L.date=$("#mdate").value||VB.today();VB.save();}});

/* ================= rotations ================= */
// half court seen from behind our end line, net at the top: 300 x 330 = 9 m x 9 m; 3 m line at y = 110
const ZP={1:[250,262],2:[250,72],3:[150,72],4:[50,72],5:[50,262],6:[150,262]};
const ROLE={S:["Setter","#ffc145"],S2:["Setter 2","#ffc145"],OH1:["Outside 1","var(--gold)"],OH2:["Outside 2","var(--gold)"],MB1:["Middle 1","#45c8ff"],MB2:["Middle 2","#45c8ff"],OPP:["Opposite","#9d86ff"],L:["Libero","#4fd394"]};
const SYS={"5-1":{lineup:["S","OH1","MB1","OPP","OH2","MB2"],note:"One setter runs the offence in all six rotations. When the setter is in the front row there are only two front-row hitters, so a back-row attack (often the opposite or an outside from zone 1 or 6) matters most in those three rotations."},
  "6-2":{lineup:["S","OH1","MB1","S2","OH2","MB2"],note:"Two setters opposite each other. Whoever is in the back row sets, and the front-row setter hits on the right side, so there are always three front-row attackers."},
  "4-2":{lineup:["S","OH1","MB1","S2","OH2","MB2"],note:"Two setters opposite each other. Whoever is in the front row sets from the right front, so there are only two front-row hitters, but the setter can always attack or dump the second ball. Common in younger teams."}};
const FB=[[4,5],[3,6],[2,1]],LR=[[4,3],[3,2],[5,6],[6,1]],FRONT=[2,3,4],BENCH=[-38,218],SERVER_Y=356;
const ZNAME={1:"right back",2:"right front",3:"middle front",4:"left front",5:"left back",6:"middle back"};
let RS={sys:"5-1",rot:0,mom:"receive",after:false,lib:true,rules:"fivb",pairs:false,auto:0,quiz:null,sig:""};
const kindOf=r=>r.replace(/\d/,"");
function lineupFor(sys,rot){const base=SYS[sys].lineup,z={};for(let k=0;k<6;k++)z[k+1]=base[(k+rot)%6];return z;} // rot 0: setter in zone 1; each rotation moves everyone one zone clockwise
function setterOf(sys,z){const ss=Object.entries(z).filter(([_,r])=>r==="S"||r==="S2");if(sys==="5-1")return ss[0][1];
  const fr=ss.find(([k])=>FRONT.includes(+k)),bk=ss.find(([k])=>!FRONT.includes(+k));return sys==="6-2"?bk[1]:fr[1];}
const zoneIn=(z,r)=>+Object.keys(z).find(k=>z[k]===r);
/* who is on court: the libero replaces the back-row middle, except when that middle is the server (FIVB: the libero may not serve) */
function court(st){const z0=lineupFor(st.sys,st.rot),setter=setterOf(st.sys,z0),z={...z0};let libFor=null,out=null,libServeNote=false;
  if(st.lib){const k=Object.keys(z0).find(k=>!FRONT.includes(+k)&&/^MB/.test(z0[k]));
    if(k&&!(st.mom==="serve"&&+k===1)){libFor=+k;z[k]="L";out=z0[k];}else{out="L";if(k)libServeNote=true;}}
  return {z0,z,setter,libFor,out,libServeNote};}
/* base positions after the switch: front row outside left, middle centre, setter or opposite right; back row setter or opposite right, outside middle, libero or middle left */
function baseSpots(z,setter){const o={};for(const [k,r] of Object.entries(z)){const kd=kindOf(r),fr=FRONT.includes(+k);
    o[r]=fr?(kd==="OH"?[55,46]:kd==="MB"?[150,46]:[245,46]):((kd==="S"||kd==="OPP")?[245,240]:kd==="OH"?[150,276]:[55,240]);}return o;}
/* receive: three passers (both outsides and the libero, or the back-row middle), front-row non-passers hide at the net,
   the back-row setter starts as close to the target as the overlap rule lets them, then everything is made legal */
function passersOf(z){const zn=r=>zoneIn(z,r),hasL=Object.values(z).includes("L");
  const p=Object.values(z).filter(r=>kindOf(r)==="OH"||r==="L"||(!hasL&&kindOf(r)==="MB"&&!FRONT.includes(zn(r))));
  const lat={4:0,5:0,3:1,6:1,2:2,1:2};return p.sort((a,b)=>lat[zn(a)]-lat[zn(b)]||(FRONT.includes(zn(a))?-1:1));}
function receiveSpots(z,setter){const o={},zn=r=>zoneIn(z,r),passers=passersOf(z);
  const slots=[[62,232],[150,244],[238,232]];passers.slice(0,3).forEach((r,i)=>o[r]=slots[i].slice());
  for(const r of Object.values(z)){if(o[r])continue;const k=zn(r),fr=FRONT.includes(k);
    if(r===setter)o[r]=fr?[{2:232,3:186,4:96}[k],40]:[224,58];
    else if(fr)o[r]=[{4:70,3:150,2:232}[k],42];
    else o[r]=[{5:34,6:150,1:268}[k],304];}
  // passers hold their lanes; the players hiding or releasing give way to them
  const w=Object.fromEntries(Object.values(z).map(r=>[r,passers.includes(r)?.12:1]));
  return legalize(o,z,w);}
function legalize(o,z,w,m=16,D=50){const P=k=>o[z[k]],W=k=>w?w[z[k]]:1,rs=Object.values(z),cl=p=>{p[0]=clamp(p[0],18,282);p[1]=clamp(p[1],26,318);};
  const push=(A,B,ax,v,wa,wb)=>{A[ax]-=v*wa/(wa+wb);B[ax]+=v*wb/(wa+wb);};
  const order=()=>{for(const [f,b] of FB){const v=P(f)[1]+m-P(b)[1];if(v>0)push(P(f),P(b),1,v,W(f),W(b));}for(const [l,r] of LR){const v=P(l)[0]+m-P(r)[0];if(v>0)push(P(l),P(r),0,v,W(l),W(r));}rs.forEach(r=>cl(o[r]));};
  for(let it=0;it<80;it++){for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=o[rs[i]],b=o[rs[j]],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;
      if(d<D){const wa=w?w[rs[i]]:1,wb=w?w[rs[j]]:1,k=(D-d)/d/(wa+wb);a[0]-=dx*k*wa;a[1]-=dy*k*wa;b[0]+=dx*k*wb;b[1]+=dy*k*wb;}}order();}
  for(let it=0;it<40;it++)order();return o;}
function serveSpots(z,setter,rules){const o=rules==="fivb"?baseSpots(z,setter):Object.fromEntries(Object.entries(z).map(([k,r])=>[r,ZP[k].slice()]));o[z[1]]=[ZP[1][0],SERVER_Y];return o;}
/* overlap check (receiving team, and the serving team under rules that still require it): positions stand in for the feet */
function overlapFaults(o,z,skipServer){const f=[];for(const [a,b] of FB){if(skipServer&&b===1)continue;if(!(o[z[a]][1]<o[z[b]][1]))f.push({a,b,k:"fb"});}
  for(const [a,b] of LR){if(skipServer&&(a===1||b===1))continue;if(!(o[z[a]][0]<o[z[b]][0]))f.push({a,b,k:"lr"});}return f;}
function faultText(F,z){const n=k=>`${ROLE[z[k]][0]} (zone ${k})`;return F.k==="fb"?`${n(F.b)} is level with or closer to the net than ${n(F.a)}, who must be in front of them.`:`${n(F.a)} must be to the left of ${n(F.b)}.`;}
function spotsNow(st,c){const s=c.setter;if(st.after)return baseSpots(c.z,s);return st.mom==="serve"?serveSpots(c.z,s,st.rules):receiveSpots(c.z,s);}
function courtShell(id,inner){return `<svg class="rcourt" id="${id}" viewBox="-74 -34 414 418" role="img">
  <defs><marker id="rah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
  <rect x="-66" y="140" width="56" height="190" rx="6" class="rbench"/><text x="-38" y="134" text-anchor="middle" class="rlab rsm">LIBERO ZONE</text>
  <rect x="0" y="0" width="300" height="330" class="rfl"/><line x1="0" y1="110" x2="300" y2="110" class="r3m"/><rect x="-6" y="-8" width="312" height="8" class="rnet"/>
  <text x="150" y="-14" text-anchor="middle" class="rlab">NET</text><text x="150" y="380" text-anchor="middle" class="rlab">SERVICE ZONE</text>
  ${[1,2,3,4,5,6].map(k=>`<text class="zl" x="${ZP[k][0]+32}" y="${ZP[k][1]-28}">${k}</text>`).join("")}${inner}</svg>`;}
const nodeInner=(r,extra)=>{const [nm,col]=ROLE[r];return `<circle r="22" fill="${col}"/><text y="5" text-anchor="middle">${r}</text><text class="rn" y="36" text-anchor="middle">${esc(nm)}</text>${extra||""}`;};
const zBadge=k=>`<g class="rzb"${k?"":' style="display:none"'}><circle cx="17" cy="-17" r="9"/><text class="rz" x="17" y="-13.5" text-anchor="middle">${k||""}</text></g>`;
const nodeSVG=(r,extra)=>`<g class="rp" data-r="${r}">${nodeInner(r,extra)}</g>`;
function renderRot(){if(RS.quiz){renderQuiz();return;}const sig=RS.sys;
  if(!$("#rotv")||RS.sig!==sig){RS.sig=sig;const roles=[...new Set([...SYS[RS.sys].lineup,"L"])];
    $("#tpanel").innerHTML=`<div class="rgrid" id="rotv"><div class="v5card"><div class="row rtop"><div class="seg" role="group" aria-label="System">${Object.keys(SYS).map(s=>`<button type="button" data-rsys="${s}">${s}</button>`).join("")}</div>
       <div class="seg" role="group" aria-label="Moment"><button type="button" data-rmom="receive">We receive</button><button type="button" data-rmom="serve">We serve</button></div>
       <button type="button" class="btn sm primary" id="rswitch"></button></div>
      <div class="row rtop"><label class="rlib"><input type="checkbox" id="rlib"> Libero in for the back-row middle</label><label class="rlib"><input type="checkbox" id="rpairs"> Show the overlap pairs</label>
       <label class="rlib">Rules <select id="rrules"><option value="fivb">FIVB 2025-28</option><option value="order">Serving team in order (USA, school)</option></select></label></div>
      <div class="rnav">${[0,1,2,3,4,5].map(r=>`<button type="button" data-rrot="${r}"><b>${r+1}</b><small></small></button>`).join("")}</div>
      ${courtShell("rsvg",`<g id="rlines"></g><g id="rarrows"></g>${roles.map(r=>nodeSVG(r,zBadge(""))).join("")}`)}
      <div class="row rplay"><button type="button" class="btn sm" data-rstep="-1" aria-label="Previous rotation">◀ Rotate back</button><button type="button" class="btn sm" data-rstep="1">Rotate ▶</button>
       <button type="button" class="btn sm" id="rauto"></button><button type="button" class="btn sm" id="rquiz">Quiz: spot the overlap</button></div></div>
     <div class="stack" id="rside"></div></div>`;}
  paintRot();}
function paintRot(){const c=court(RS),pos=spotsNow(RS,c),z=c.z,setter=c.setter,sZone=zoneIn(c.z0,setter),front=[4,3,2].map(k=>z[k]),hitters=front.filter(r=>r!==setter&&r!=="L").length;
  $$("[data-rsys]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.rsys===RS.sys));$$("[data-rmom]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.rmom===RS.mom));
  $$("[data-rrot]").forEach(b=>{const r=+b.dataset.rrot,zz=lineupFor(RS.sys,r);b.setAttribute("aria-pressed",r===RS.rot);b.querySelector("small").textContent="Setter in "+zoneIn(zz,setterOf(RS.sys,zz));});
  $("#rlib").checked=RS.lib;$("#rpairs").checked=RS.pairs;$("#rrules").value=RS.rules;
  $("#rswitch").textContent=RS.after?(RS.mom==="serve"?"◀ Back to the serve":"◀ Back to receive"):"Play the switch ▶";
  $("#rauto").textContent=RS.auto?"■ Stop":"▶ Walk through all six";
  $("#rsvg").setAttribute("aria-label",`Rotation ${RS.rot+1}, ${RS.sys}, ${RS.after?"base positions after the switch":RS.mom==="serve"?"positions when we serve":"serve-receive formation"}`);
  // players: on court, or waiting in the libero zone
  $$("#rsvg .rp").forEach(g=>{const r=g.dataset.r,on=Object.values(z).includes(r),p=on?pos[r]:BENCH,zk=on?zoneIn(z,r):null;
    g.style.transform=`translate(${p[0]}px,${p[1]}px)`;g.classList.toggle("off",!on);g.style.display=r==="L"&&!RS.lib?"none":"";
    g.classList.toggle("setter",r===setter);const zb=g.querySelector(".rzb");zb.style.display=on&&!RS.after?"":"none";zb.querySelector("text").textContent=zk||"";});
  // arrows for the switch, from the formation to base
  const from=RS.mom==="serve"?serveSpots(z,setter,RS.rules):receiveSpots(z,setter);
  $("#rarrows").innerHTML=RS.after?Object.values(z).map(r=>{const o=from[r],p=pos[r];if(Math.hypot(o[0]-p[0],o[1]-p[1])<30)return "";
    const mx=(o[0]+p[0])/2,my=(o[1]+p[1])/2,dx=p[0]-o[0],dy=p[1]-o[1],len=Math.hypot(dx,dy),cx=mx-dy/len*28,cy=my+dx/len*28,u=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
    const s0=u(o,[cx,cy],24/Math.hypot(cx-o[0],cy-o[1])),e0=u(p,[cx,cy],27/Math.hypot(cx-p[0],cy-p[1]));
    return `<circle cx="${o[0]}" cy="${o[1]}" r="22" class="rghost"/><path d="M${s0[0].toFixed(1)} ${s0[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${e0[0].toFixed(1)} ${e0[1].toFixed(1)}" class="rarr" fill="none" marker-end="url(#rah)"/>`;}).join(""):"";
  // overlap pairs: who must be in front of / beside whom (only meaningful at the serve)
  const checkServe=RS.mom==="serve"&&RS.rules!=="fivb",checked=!RS.after&&(RS.mom==="receive"||checkServe),F=checked?overlapFaults(pos,z,RS.mom==="serve"):[];
  $("#rlines").innerHTML=RS.pairs&&checked?[...FB.map(p=>[...p,"fb"]),...LR.map(p=>[...p,"lr"])].filter(([a,b])=>!(RS.mom==="serve"&&(a===1||b===1))).map(([a,b,k])=>{const A=pos[z[a]],B=pos[z[b]],bad=F.some(f=>f.a===a&&f.b===b);
    return `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="rpair ${k} ${bad?"bad":""}"/>`;}).join(""):"";
  // side panel
  const role=r=>ROLE[r][0],passers=RS.mom==="receive"&&!RS.after?passersOf(z):[];
  const fromName=r=>{const k=zoneIn(z,r);return ZNAME[k];},baseName=p=>{const x=p[0]<100?"left":p[0]<200?"middle":"right";return (p[1]<120?(x==="middle"?"middle front":x+" front"):(x==="middle"?"middle back":x+" back"));};
  const moves=Object.values(z).map(r=>{const b=baseSpots(z,setter)[r],to=baseName(b),fr=fromName(r);return fr===to?null:`<li><b>${esc(role(r))}</b>: ${fr} → ${to}</li>`;}).filter(Boolean);
  const relNote={1:"hides behind the right-front player and steps to the target as the server hits the ball. The shortest release.",6:"starts behind the middle-front player and runs straight up to the target.",5:"stacks behind the left-front player and has the longest run, along the net to the right. Often the hardest rotation to pass in."}[sZone];
  const ruleServe=RS.rules==="fivb"?"Under the FIVB 2025-28 rules your team may stand anywhere when you serve, so players start in their base spots and only the server has to come in.":"Under rules that keep the serving team in order (USA Volleyball, most school rules), players stand in their rotation zones at the serve and switch as soon as the ball is hit.";
  $("#rside").innerHTML=`<div class="v5card"><div class="kicker">Rotation ${RS.rot+1} · ${esc(RS.sys)} · ${RS.after?"after the switch":RS.mom==="serve"?"we serve":"we receive"}</div><h3>Setter in zone ${sZone}</h3>
    <ul class="rfacts"><li><b>${hitters}</b> front-row attacker${hitters===1?"":"s"}: ${front.filter(r=>r!==setter&&r!=="L").map(role).join(", ")}</li>
     <li><b>${esc(role(setter))}</b> is in the ${FRONT.includes(sZone)?"front row: may attack or dump the second ball":"back row: may not attack a ball above the net from in front of the 3 m line"}</li>
     ${RS.mom==="serve"?`<li><b>${esc(role(z[1]))}</b> serves from zone 1</li>`:`<li>If you win the rally you rotate, and <b>${esc(role(c.z0[2]))}</b> moves to zone 1 to serve</li>`}
     ${c.libFor?`<li>Libero is in for <b>${esc(role(c.z0[c.libFor]))}</b> (zone ${c.libFor})</li>`:RS.lib?`<li>Libero is off: ${c.libServeNote?`the middle in zone 1 serves (under FIVB rules the libero cannot serve; USA, NCAA and US high-school rules let the libero serve in one rotation)`:"both middles are in the front row"}</li>`:""}
     ${passers.length?`<li>Passing: ${passers.map(role).join(", ")}</li>`:""}</ul>
    ${!RS.after&&RS.mom==="receive"&&!FRONT.includes(sZone)?`<p class="small">The setter ${relNote}</p>`:""}
    ${!RS.after&&RS.mom==="serve"?`<p class="small">${ruleServe}</p>`:""}
    ${checked?`<p class="small rcheck ${F.length?"bad":"ok"}">${F.length?"Overlap: "+F.map(f=>faultText(f,z)).join(" "):RS.mom==="receive"?"Checked: this formation is legal. Every player is in front of, behind, left or right of the right teammates.":"Checked: in rotational order."}</p>`:""}
    <p class="small muted">${esc(SYS[RS.sys].note)}</p></div>
   <div class="v5card"><div class="kicker">The switch</div>${moves.length?`<ul class="rfacts">${moves.join("")}</ul>`:`<p class="small">Everyone is already in their base spot.</p>`}
    <p class="small muted">Base positions shown are a common arrangement: front row outside left, middle in the middle, setter or opposite right; back row setter or opposite right back, outside middle back, libero left back. Many teams vary the back row, so follow your coach's system.</p></div>
   <div class="v5card"><div class="kicker">Overlap rule</div><p class="small">At the moment of the serve, each front-row player of the receiving team must be closer to the net than the back-row player directly behind them (4 ahead of 5, 3 ahead of 6, 2 ahead of 1). Side to side, the players in each row must stay in order: 4 left of 3, 3 left of 2, and 5 left of 6, 6 left of 1. Only the feet count, and diagonal players have no rule between them. Turn on "Show the overlap pairs" to see the pairs.</p></div>`;}
function rotStep(d){RS.rot=(RS.rot+d+6)%6;RS.after=false;paintRot();}
function autoStop(){if(RS.auto){clearTimeout(RS.auto);RS.auto=0;}}
function autoRun(){autoStop();let phase=0;const go=()=>{if(tab!=="rotations"||RS.quiz||!$("#rotv")){RS.auto=0;return;}
    if(phase%2===0){RS.after=true;}else{RS.rot=(RS.rot+1)%6;RS.after=false;}phase++;paintRot();RS.auto=setTimeout(go,phase%2?2200:2600);};
  RS.after=false;paintRot();RS.auto=setTimeout(go,1800);paintRot();}
document.addEventListener("click",e=>{const b=e.target.closest("[data-rsys],[data-rmom],[data-rrot],[data-rstep],#rswitch,#rauto,#rquiz");if(!b||!$("#rotv"))return;
  if(b.id==="rauto"){if(RS.auto){autoStop();paintRot();}else autoRun();return;}
  autoStop();
  if(b.dataset.rsys){RS.sys=b.dataset.rsys;RS.after=false;renderRot();return;}
  if(b.dataset.rmom){RS.mom=b.dataset.rmom;RS.after=false;}
  if(b.dataset.rrot){RS.rot=+b.dataset.rrot;RS.after=false;}
  if(b.dataset.rstep){rotStep(+b.dataset.rstep);return;}
  if(b.id==="rswitch")RS.after=!RS.after;
  if(b.id==="rquiz"){RS.quiz={n:0,score:0};newQuiz();renderRot();return;}
  paintRot();});
document.addEventListener("change",e=>{if(!$("#rotv"))return;if(e.target.id==="rlib"){RS.lib=e.target.checked;paintRot();}if(e.target.id==="rpairs"){RS.pairs=e.target.checked;paintRot();}if(e.target.id==="rrules"){RS.rules=e.target.value;paintRot();}});
document.addEventListener("keydown",e=>{if(V5.view()!=="tools"||tab!=="rotations"||RS.quiz||e.target.closest("input,textarea,select"))return;if(e.key==="ArrowRight"){autoStop();rotStep(1);}if(e.key==="ArrowLeft"){autoStop();rotStep(-1);}if(e.key===" "&&!e.target.closest("button")){e.preventDefault();autoStop();RS.after=!RS.after;paintRot();}});

VB.tools.rot={court,receiveSpots,serveSpots,baseSpots,overlapFaults}; // used by the headless checks
/* ---------- quiz: is this receive formation legal? ---------- */
function newQuiz(){const Q=RS.quiz,sys=Object.keys(SYS)[Math.floor(Math.random()*3)],rot=Math.floor(Math.random()*6),lib=Math.random()<.75,st={sys,rot,lib,mom:"receive"},c=court(st),pos=receiveSpots(c.z,c.setter);
  let fault=null;if(Math.random()<.6){const all=[...FB.map(p=>[...p,"fb"]),...LR.map(p=>[...p,"lr"])],[a,b,k]=all[Math.floor(Math.random()*all.length)],A=pos[c.z[a]],B=pos[c.z[b]],ax=k==="fb"?1:0;
    const t=A[ax];A[ax]=B[ax];B[ax]=t;if(Math.abs(A[ax]-B[ax])<16){A[ax]+=k==="fb"?16:12;}fault={a,b,k};}
  Object.assign(Q,{st,c,pos,answered:null,faults:overlapFaults(pos,c.z)});}
function renderQuiz(){const Q=RS.quiz,{c,pos}=Q,z=c.z,F=Q.faults,legal=!F.length,ans=Q.answered;
  const marks=ans!=null?F.map(f=>{const A=pos[z[f.a]],B=pos[z[f.b]];return `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="rpair bad"/><circle cx="${A[0]}" cy="${A[1]}" r="28" class="rbad"/><circle cx="${B[0]}" cy="${B[1]}" r="28" class="rbad"/>`;}).join(""):"";
  const nodes=Object.values(z).map(r=>`<g class="rp" style="transform:translate(${pos[r][0]}px,${pos[r][1]}px)">${nodeInner(r,zBadge(zoneIn(z,r)))}</g>`).join("");
  const right=ans!=null&&(ans===legal);
  $("#tpanel").innerHTML=`<div class="rgrid"><div class="v5card"><div class="row rtop"><b>Spot the overlap</b><span class="small muted">${esc(Q.st.sys)} · rotation ${Q.st.rot+1} · receiving serve</span></div>
    ${courtShell("rqsvg",`<g>${marks}</g>${nodes}`)}
    <div class="row rplay">${ans==null?`<button type="button" class="btn primary" data-qa="1">Legal</button><button type="button" class="btn primary" data-qa="0">Overlap fault</button>`:`<button type="button" class="btn primary" id="qnext">Next formation</button>`}<button type="button" class="btn sm" id="qexit">Back to the viewer</button></div></div>
   <div class="stack"><div class="v5card"><div class="kicker">Score</div><h3>${Q.score} / ${Q.n}</h3><p class="small">The ball is about to be served. Is the receiving team in a legal formation? The small number on each player is their rotation zone: that, not where they stand, decides who they must stay in front of or beside.</p></div>
    ${ans!=null?`<div class="v5card ${right?"qok":"qbad"}"><div class="kicker">${right?"Correct":"Not quite"}</div><p>${legal?"Legal: every front-row player is ahead of the player behind them, and each row is in left-to-right order.":F.map(f=>esc(faultText(f,z))).join("<br>")}</p></div>`:""}
    <div class="v5card"><div class="kicker">The pairs to check</div><p class="small">Front and back: 4 ahead of 5, 3 ahead of 6, 2 ahead of 1. Side to side: 4 left of 3, 3 left of 2, 5 left of 6, 6 left of 1. Nothing else matters.</p></div></div></div>`;}
document.addEventListener("click",e=>{const b=e.target.closest("[data-qa],#qnext,#qexit");if(!b||!RS.quiz)return;const Q=RS.quiz;
  if(b.dataset.qa!=null&&Q.answered==null){Q.answered=b.dataset.qa==="1";Q.n++;if(Q.answered===!Q.faults.length)Q.score++;renderQuiz();return;}
  if(b.id==="qnext"){newQuiz();renderQuiz();return;}
  if(b.id==="qexit"){RS.quiz=null;RS.sig="";renderRot();}});

/* ================= plays ================= */
const PCOL={S:"#ffc145",OH:"var(--gold)",OH2:"var(--gold)",MB:"#45c8ff",OPP:"#9d86ff",L:"#4fd394"};
const PNAME={S:"Setter",OH:"Outside",OH2:"Outside (back row)",MB:"Middle",OPP:"Opposite",L:"Libero"};
const OPTQ={offence:"Choose the set",receive:"Choose the serve",serve:"Choose the target",defence:"Choose their attack",cover:"What happens"};
let PS={id:null,cat:"all",t:0,playing:false,speed:1,loop:false,opt:0,raf:0,last:0,who:null};
const smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
function along(pts,u){if(pts.length<2)return pts[0];const L=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);L.push(d);tot+=d;}
  let s=u*tot;for(let i=0;i<L.length;i++){if(s<=L[i]||i===L.length-1){const k=L[i]?Math.min(1,s/L[i]):1;return [pts[i][0]+(pts[i+1][0]-pts[i][0])*k,pts[i][1]+(pts[i+1][1]-pts[i][1])*k];}s-=L[i];}return pts[pts.length-1];}
const posAt=(p,t)=>p.path&&p.t?along(p.path,smooth((t-p.t[0])/((p.t[1]-p.t[0])||1))):p.at;
const playOf=()=>(window.VB_PLAYS||[]).find(p=>p.id===PS.id)||(window.VB_PLAYS||[])[0];
const optOf=pl=>(pl.options||[])[PS.opt]||null;
const ballsOf=pl=>{const o=optOf(pl);return [...(pl.ball||[]),...(o?o.ball:[])];};
function ballAt(pl,t){const B=ballsOf(pl);if(!B.length||t<B[0].t[0])return null;let s=B[0];for(const x of B)if(t>=x.t[0])s=x;
  const u=clamp((t-s.t[0])/((s.t[1]-s.t[0])||1),0,1),h=(s.h||0)*4*u*(1-u);return {p:[s.a[0]+(s.b[0]-s.a[0])*u,s.a[1]+(s.b[1]-s.a[1])*u],h};}
function beatsOf(pl){const o=optOf(pl),B=(pl.beats||[]).map(b=>({t:b[0],text:b[1]}));if(o&&o.say&&o.ball[0])B.push({t:o.ball[0].t[0],text:o.say,opt:true});return B.sort((a,b)=>a.t-b.t);}
const beatNow=(pl,t)=>{let c=null;beatsOf(pl).forEach(b=>{if(t>=b.t-1e-6)c=b;});return c;};
const actOf=(pl,p)=>{const o=optOf(pl);if(o&&o.hitter===p.r)return pl.cat==="defence"||pl.cat==="receive"?(p.act==="block"?"block":"dig"):p.act==="serve"?"serve":"hit";return p.act==="hit"&&o&&o.hitter!==p.r?"decoy":p.act;};
function playSVG(pl){const o=optOf(pl),ar=(a,b,cls)=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${cls}" marker-end="url(#pah)"/>`;
  const routes=(pl.players||[]).filter(p=>p.path&&p.path.length>1).map(p=>{const a=actOf(pl,p),e=p.path[p.path.length-1];
    return `<polyline points="${p.path.map(q=>q.join(",")).join(" ")}" class="proute ${a} ${o&&o.hitter===p.r?"chosen":""}" marker-end="url(#pah)"/>${p.label?`<text x="${e[0]}" y="${e[1]+(e[1]<40?34:-18)}" text-anchor="middle" class="plab ${o&&o.hitter===p.r?"on":""}">${esc(p.label)}</text>`:""}`;}).join("");
  const oroutes=(pl.opp||[]).filter(p=>p.path).map(p=>`<polyline points="${p.path.map(q=>q.join(",")).join(" ")}" class="proute opp"/>`).join("");
  // the chosen option is drawn bright; the other options are faint so you can see the choice
  const others=(pl.options||[]).filter((x,i)=>i!==PS.opt).map(x=>x.ball[0]?ar(x.ball[0].a,x.ball[0].b,"pball alt"):"").join("");
  const balls=ballsOf(pl).map(s=>ar(s.a,s.b,"pball")+(s.label?`<text x="${(s.a[0]+s.b[0])/2+8}" y="${(s.a[1]+s.b[1])/2-6}" class="plab b">${esc(s.label)}</text>`:"")).join("");
  const zones=(pl.zones||[]).map(z=>`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" class="pzone"/><text x="${z.x+z.w/2}" y="${z.y+z.h-7}" text-anchor="middle" class="plab">${esc(z.label)}</text>`).join("");
  const shadow=pl.shadow?`<polygon points="${pl.shadow.map(q=>q.join(",")).join(" ")}" class="pshadow"/>`:"";
  const opp=(pl.opp||[]).map((p,i)=>`<g class="pp opp" data-o="${i}"><circle r="12"/>${p.label?`<text y="-17" text-anchor="middle" class="plab">${esc(p.label)}</text>`:""}</g>`).join("");
  const me=(pl.players||[]).map((p,i)=>`<g class="pp me ${o&&o.hitter===p.r?"chosen":""} ${PS.who===i?"who":""}" data-p="${i}" tabindex="0" role="button" aria-label="${esc(PNAME[p.r]||p.r)}: ${esc(p.job||VB_PLAY_JOB[actOf(pl,p)]||"")}"><circle r="13" fill="${PCOL[p.r]||"#ccc"}"/><text y="4" text-anchor="middle">${p.r==="OH2"?"OH":p.r}</text></g>`).join("");
  return `<svg class="pcourt" id="psvg" viewBox="-34 -${pl.cat==="serve"?310:150} 368 ${pl.cat==="serve"?650:470}" role="img" aria-label="${esc(pl.name)}: animated diagram">
   <defs><marker id="pah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
   <rect x="0" y="-${pl.cat==="serve"?300:150}" width="300" height="${pl.cat==="serve"?300:150}" class="pfl opp"/><rect x="0" y="0" width="300" height="300" class="pfl"/>
   <line x1="0" y1="100" x2="300" y2="100" class="p3m"/><line x1="0" y1="-100" x2="300" y2="-100" class="p3m"/>
   <rect x="-8" y="-3" width="316" height="6" class="pnet"/><rect x="-3" y="-10" width="5" height="20" class="pant"/><rect x="298" y="-10" width="5" height="20" class="pant"/>
   <text x="150" y="${pl.cat==="serve"?345:316}" text-anchor="middle" class="rlab">${pl.cat==="serve"?"":"OUR END LINE"}</text><text x="150" y="-${pl.cat==="serve"?290:136}" text-anchor="middle" class="rlab">OPPONENT</text>
   ${zones}${shadow}${oroutes}${routes}${others}${balls}${opp}${me}<g id="pball"><ellipse class="pbsh" rx="6" ry="3"/><circle class="pb" r="7"/></g></svg>`;}
function paintPlay(){const pl=playOf(),t=PS.t,svg=$("#psvg");if(!pl||!svg)return;
  $$(".pp[data-p]",svg).forEach(g=>{const p=pl.players[+g.dataset.p],q=posAt(p,t);g.setAttribute("transform",`translate(${q[0]},${q[1]})`);});
  $$(".pp[data-o]",svg).forEach(g=>{const p=pl.opp[+g.dataset.o],q=posAt(p,t);g.setAttribute("transform",`translate(${q[0]},${q[1]})`);});
  const b=ballAt(pl,t),bg=$("#pball",svg);if(!b)bg.style.display="none";else{bg.style.display="";$(".pbsh",bg).setAttribute("cx",b.p[0]);$(".pbsh",bg).setAttribute("cy",b.p[1]);const c=$(".pb",bg);c.setAttribute("cx",b.p[0]);c.setAttribute("cy",b.p[1]-b.h*.25);c.setAttribute("r",(6+b.h/22).toFixed(1));}
  const r=$("#pscrub");if(r&&document.activeElement!==r)r.value=Math.round(t*1000);const pb=$("#pplay");if(pb)pb.textContent=PS.playing?"❚❚ Pause":t>=1?"↻ Replay":"▶ Play";
  const bn=beatNow(pl,t),cap=$("#pcap");if(cap){const txt=bn?bn.text:"Press play.";if(cap.dataset.txt!==txt){cap.dataset.txt=txt;cap.textContent=txt;cap.classList.toggle("opt",!!(bn&&bn.opt));cap.classList.remove("in");void cap.offsetWidth;cap.classList.add("in");}}
  $$(".pticks button").forEach(x=>x.classList.toggle("past",+x.dataset.pt<=t+1e-6));}
function loopPlay(now){if(!PS.playing)return;const dt=PS.last?(now-PS.last)/1000:0;PS.last=now;PS.t=Math.min(1,PS.t+dt*PS.speed/4.8);paintPlay();
  if(PS.t>=1){if(PS.loop){PS.t=0;}else{PS.playing=false;paintPlay();return;}}PS.raf=requestAnimationFrame(loopPlay);}
function startPlay(){if(PS.t>=1)PS.t=0;PS.playing=true;PS.last=0;cancelAnimationFrame(PS.raf);PS.raf=requestAnimationFrame(loopPlay);}
function stopPlay(){PS.playing=false;cancelAnimationFrame(PS.raf);}
function jumpBeat(d){const pl=playOf(),B=[0,...beatsOf(pl).map(b=>b.t),1].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);stopPlay();
  if(d>0){const n=B.find(x=>x>PS.t+.005);PS.t=n==null?1:n;}else{const p=B.filter(x=>x<PS.t-.005).pop();PS.t=p==null?0:p;}paintPlay();}
function whoHTML(pl){if(PS.who==null||!pl.players[PS.who])return `<span class="muted">Tap a player to see their job.</span>`;const p=pl.players[PS.who],a=actOf(pl,p);
  return `<i style="background:${PCOL[p.r]}"></i><b>${esc(PNAME[p.r]||p.r)}</b> · ${esc(p.job&&(a===p.act||!VB_PLAY_JOB[a])?p.job:(VB_PLAY_JOB[a]||""))}`;}
function renderPlays(){const P=window.VB_PLAYS||[],C=window.VB_PLAY_CATS||[];if(!PS.id&&P.length)PS.id=P[0].id;const pl=playOf();if(!pl){$("#tpanel").innerHTML=`<p class="muted">No plays.</p>`;return;}
  const list=P.filter(p=>PS.cat==="all"||p.cat===PS.cat),O=pl.options||[],B=beatsOf(pl);if(PS.opt>=O.length)PS.opt=0;
  $("#tpanel").innerHTML=`<div class="chips pcats">${[["all","All"],...C].map(([k,l])=>`<button type="button" class="chip" data-pcat="${k}" aria-pressed="${PS.cat===k}">${esc(l)}${k==="all"?"":` <small>${P.filter(p=>p.cat===k).length}</small>`}</button>`).join("")}</div>
   <div class="plgrid"><div class="plist">${list.map(p=>`<button type="button" class="pitem" data-play="${p.id}" aria-pressed="${p.id===pl.id}"><span class="kicker">${esc((C.find(c=>c[0]===p.cat)||["",""])[1])}</span><b>${esc(p.name)}</b><small>${esc(p.sys)}${p.options?` · ${p.options.length} options`:""}</small></button>`).join("")}</div>
    <div class="v5card pstage">${O.length?`<div class="popts"><span class="small"><b>${esc(OPTQ[pl.cat]||"Options")}</b></span>${O.map((o,i)=>`<button type="button" class="chip" data-popt="${i}" aria-pressed="${i===PS.opt}">${esc(o.label)}</button>`).join("")}</div>`:""}
     <p class="pcap" id="pcap" aria-live="polite"></p>${playSVG(pl)}
     <div class="pscrubw"><input type="range" id="pscrub" min="0" max="1000" value="${Math.round(PS.t*1000)}" aria-label="Scrub through the play"><div class="pticks">${B.map(b=>`<button type="button" data-pt="${b.t}" style="left:${(b.t*100).toFixed(1)}%" title="${esc(b.text)}" aria-label="Jump to: ${esc(b.text)}"></button>`).join("")}</div></div>
     <div class="row rplay"><button type="button" class="btn sm" data-pbeat="-1" aria-label="Previous moment">⏮</button><button type="button" class="btn sm primary" id="pplay">▶ Play</button><button type="button" class="btn sm" data-pbeat="1" aria-label="Next moment">⏭</button>
      <div class="seg" role="group" aria-label="Speed">${[[.5,"½×"],[1,"1×"],[1.5,"1½×"]].map(([v,l])=>`<button type="button" data-pspeed="${v}" aria-pressed="${PS.speed===v}">${l}</button>`).join("")}</div><label class="rlib"><input type="checkbox" id="ploop" ${PS.loop?"checked":""}> Loop</label></div>
     <p class="pwho small" id="pwho">${whoHTML(pl)}</p>
     <div class="plegend">${[...new Set(pl.players.map(p=>p.r))].map(r=>`<span><i style="background:${PCOL[r]}"></i>${esc(PNAME[r]||r)}</span>`).join("")}<span><i class="o"></i>Opponent</span><span><i class="b"></i>Ball</span>${O.length>1?`<span><i class="a"></i>Other options</span>`:""}</div></div>
    <div class="stack"><div class="v5card"><div class="kicker">${esc(pl.sys)}</div><h3>${esc(pl.name)}</h3><p>${esc(pl.sum)}</p><p class="small"><b>When:</b> ${esc(pl.when)}</p></div>
     <div class="v5card"><div class="kicker">How it runs</div><ol class="steps">${pl.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>${pl.tip?`<p class="small muted">${esc(pl.tip)}</p>`:""}</div>
     ${O.length?`<div class="v5card"><div class="kicker">${esc(OPTQ[pl.cat]||"Options")}</div><ul class="popl">${O.map((o,i)=>`<li class="${i===PS.opt?"on":""}"><button type="button" class="linkbtn" data-popt="${i}">${esc(o.label)}</button>${o.say?`<span class="small muted">${esc(o.say)}</span>`:""}</li>`).join("")}</ul></div>`:""}
     ${pl.cat==="offence"?`<details class="v5card rule"><summary>Set calls</summary><dl class="gloss">${(window.VB_SET_CALLS||[]).map(c=>`<div><dt>${esc(c[0])}</dt><dd>${esc(c[1])}</dd></div>`).join("")}</dl><p class="small muted">Numbers and names vary from team to team. Agree your calls with your setter.</p></details>`:""}</div></div>`;
  paintPlay();}
document.addEventListener("click",e=>{const b=e.target.closest("[data-pcat],[data-play],#pplay,[data-popt],[data-pbeat],[data-pspeed],[data-pt],#psvg .pp.me");if(!b)return;
  if(b.dataset.pcat){PS.cat=b.dataset.pcat;const l=(window.VB_PLAYS||[]).filter(p=>PS.cat==="all"||p.cat===PS.cat);if(l.length&&!l.some(p=>p.id===PS.id))PS.id=l[0].id;PS.t=0;PS.opt=0;PS.who=null;stopPlay();renderPlays();return;}
  if(b.dataset.play){PS.id=b.dataset.play;PS.t=0;PS.opt=0;PS.who=null;stopPlay();renderPlays();startPlay();return;}
  if(b.dataset.popt!=null){PS.opt=+b.dataset.popt;PS.t=0;stopPlay();renderPlays();startPlay();return;}
  if(b.dataset.pbeat){jumpBeat(+b.dataset.pbeat);return;}
  if(b.dataset.pspeed){PS.speed=+b.dataset.pspeed;$$("[data-pspeed]").forEach(x=>x.setAttribute("aria-pressed",+x.dataset.pspeed===PS.speed));return;}
  if(b.dataset.pt!=null){stopPlay();PS.t=+b.dataset.pt;paintPlay();return;}
  if(b.dataset.p!=null){PS.who=PS.who===+b.dataset.p?null:+b.dataset.p;$$("#psvg .pp.me").forEach(g=>g.classList.toggle("who",+g.dataset.p===PS.who));$("#pwho").innerHTML=whoHTML(playOf());return;}
  if(b.id==="pplay"){if(PS.playing){stopPlay();paintPlay();}else startPlay();}});
document.addEventListener("input",e=>{if(e.target.id==="pscrub"){stopPlay();PS.t=+e.target.value/1000;paintPlay();}});
document.addEventListener("change",e=>{if(e.target.id==="ploop")PS.loop=e.target.checked;});
document.addEventListener("keydown",e=>{if(V5.view()!=="tools"||tab!=="plays"||e.target.closest("input,textarea,select"))return;
  if(e.key===" "&&!e.target.closest("button")){e.preventDefault();if(PS.playing){stopPlay();paintPlay();}else startPlay();}
  if(e.key==="ArrowRight"){e.preventDefault();jumpBeat(1);}if(e.key==="ArrowLeft"){e.preventDefault();jumpBeat(-1);}
  if((e.key==="Enter")&&e.target.closest("#psvg .pp.me"))e.target.closest("#psvg .pp.me").dispatchEvent(new MouseEvent("click",{bubbles:true}));});

/* ================= calculators ================= */
function renderCalc(){const p=S().profile||{},u=VB.lu(),L=v=>v==null?"":VB.lenOut(v),T=(S().tests||[]).filter(t=>t.kind==="vert"&&!t.ex).sort((a,b)=>a.date<b.date?-1:1),vj=T.length?T[T.length-1].cm:p.jump;
  const ls=VB.loadStats(),recent=(S().sessions||[]).filter(s=>!s.ex&&s.mins&&s.rpe).slice(-10),avg=recent.length?Math.round(recent.reduce((a,s)=>a+s.mins*s.rpe,0)/recent.length):null;
  $("#tpanel").innerHTML=`<div class="cgrid">
   <form class="v5card calc" data-calc="touch"><div class="kicker">Touch and net clearance</div><h3>How high do you reach?</h3>
     <div class="grid"><label class="f">Standing reach (${u})<input type="number" step="0.5" name="reach" value="${L(p.reach)}"></label><label class="f">Vertical jump (${u})<input type="number" step="0.5" name="vj" value="${L(vj)}"></label>
     <label class="f">Net<select name="net">${[["2.43","Men's 2.43 m"],["2.24","Women's 2.24 m"],["2.35","Boys' youth 2.35 m"],["2.13","Youth 2.13 m"]].map(([v,l])=>`<option value="${v}" ${String(p.net)===v?"selected":""}>${l}</option>`).join("")}</select></label>
     <label class="f">Goal above the net (${u})<input type="number" step="1" name="goal" value="${VB.imp()?12:30}"></label></div><output class="cout"></output></form>
   <form class="v5card calc" data-calc="hang"><div class="kicker">Jump from air time</div><h3>Measure a jump with your phone</h3>
     <p class="small muted">Film a jump in slow motion and count the time from the toes leaving the floor to the toes touching down.</p>
     <div class="grid"><label class="f">Air time (ms)<input type="number" name="ms" value="560" min="100" max="1200"></label></div><output class="cout"></output></form>
   <form class="v5card calc" data-calc="hit"><div class="kicker">Hitting percentage</div><h3>Attack efficiency</h3>
     <div class="grid"><label class="f">Kills<input type="number" name="k" value="12" min="0"></label><label class="f">Errors<input type="number" name="e" value="4" min="0"></label><label class="f">Total attempts<input type="number" name="ta" value="30" min="0"></label></div><output class="cout"></output></form>
   <form class="v5card calc" data-calc="pass"><div class="kicker">Pass rating</div><h3>Serve receive, 0 to 3</h3>
     <div class="grid four"><label class="f">3s<input type="number" name="r3" value="8" min="0"></label><label class="f">2s<input type="number" name="r2" value="7" min="0"></label><label class="f">1s<input type="number" name="r1" value="3" min="0"></label><label class="f">0s<input type="number" name="r0" value="2" min="0"></label></div><output class="cout"></output></form>
   <form class="v5card calc" data-calc="load" data-avg="${avg||""}" data-acwr="${ls.acwr==null?"":ls.acwr}"><div class="kicker">Session load</div><h3>Minutes × effort</h3>
     <div class="grid"><label class="f">Minutes<input type="number" name="m" value="${p.mins||60}" min="1"></label><label class="f">Effort, 1 to 10<input type="number" name="r" value="7" min="1" max="10"></label></div><output class="cout"></output></form>
   <form class="v5card calc" data-calc="conv"><div class="kicker">Units</div><h3>Convert</h3>
     <div class="grid"><label class="f">Value<input type="number" step="any" name="v" value="100"></label><label class="f">From<select name="f"><option value="cm">cm → in</option><option value="in">in → cm</option><option value="kg">kg → lb</option><option value="lb">lb → kg</option><option value="m">m → ft and in</option></select></label></div><output class="cout"></output></form></div>`;
  $$("#tpanel form.calc").forEach(calc);}
function calc(f){const g=n=>{const el=f.elements[n];return el?parseFloat(el.value):NaN;},out=$(".cout",f),u=VB.lu(),Lo=cm=>VB.lenOut(cm)+" "+u,ok=v=>isFinite(v);let h="";
  switch(f.dataset.calc){
   case"touch":{const r=VB.lenIn(g("reach")),v=VB.lenIn(g("vj")),net=g("net")*100,goal=VB.lenIn(g("goal"));if(!ok(r)||!ok(v)){h="Enter your reach and jump.";break;}
     const touch=r+v,over=touch-net,need=Math.max(0,net+goal-r);
     h=`<div class="big"><b>${Lo(touch)}</b><span>touch height</span></div><div class="big ${over>=0?"good":"bad"}"><b>${over>=0?"+":""}${Lo(over)}</b><span>${over>=0?"above":"below"} the net</span></div>
       <p>To get your hand ${Lo(goal)} above the net you need a <b>${Lo(need)}</b> vertical${need>v?`, <b>${Lo(need-v)}</b> more than now`:": you already have it"}.${over<0?"":" A blocker's hands need about 15 to 20 cm above the net to press over it."}</p>`;break;}
   case"hang":{const t=g("ms")/1000;if(!ok(t)||t<=0){h="Enter the air time.";break;}const cm=9.81*t*t/8*100;h=`<div class="big"><b>${Lo(cm)}</b><span>jump height</span></div><p class="small muted">Height = g × t² ÷ 8. Bending the knees or hips before landing adds air time, so land with straight legs for an honest number.</p><button type="button" class="btn sm" data-savejump="${cm.toFixed(1)}">Save as today's jump test</button>`;break;}
   case"hit":{const k=g("k")||0,e=g("e")||0,ta=g("ta")||0;if(ta<k+e){h="Attempts must be at least kills + errors.";break;}const v=ta?(k-e)/ta:0;h=`<div class="big ${v>=.3?"good":v<.1?"bad":""}"><b>${pct3(v)}</b><span>hitting %</span></div><p>${v>=.3?"Excellent: .300 or better is a strong number at almost any level.":v>=.2?"Good: solid, efficient attacking.":v>=.1?"Okay: cut the errors before adding power.":"Needs work: more errors than kills relative to swings. Aim high and deep, and use shots."} Kill rate ${ta?Math.round(k/ta*100):0}%.</p>`;break;}
   case"pass":{const a=[g("r3"),g("r2"),g("r1"),g("r0")].map(x=>x||0),n=a.reduce((x,y)=>x+y,0);if(!n){h="Enter some receptions.";break;}const v=(3*a[0]+2*a[1]+a[2])/n;
     h=`<div class="big ${v>=2.2?"good":v<1.8?"bad":""}"><b>${v.toFixed(2)}</b><span>pass rating</span></div><p>${v>=2.4?"Elite: the setter can run everything.":v>=2.2?"Strong: in-system most of the time.":v>=1.8?"Average: the offence is often predictable.":"Under pressure: the setter is running down too many passes."} ${Math.round((a[0]+a[1])/n*100)}% of passes were in-system (2 or 3). Aced ${Math.round(a[3]/n*100)}%.</p>`;break;}
   case"load":{const m=g("m"),r=g("r");if(!ok(m)||!ok(r)){h="Enter minutes and effort.";break;}const l=Math.round(m*clamp(r,1,10)),avg=+f.dataset.avg||0,ac=f.dataset.acwr?+f.dataset.acwr:null;
     h=`<div class="big"><b>${l}</b><span>load units</span></div><p>${avg?`Your average session is about ${avg}, so this is <b>${Math.round(l/avg*100)}%</b> of a normal session. `:""}${ac!=null?`Your last 7 days are ${Math.round(ac*100)}% of your 4-week average${ac>1.4?": high, so keep this one easy.":ac<.8?": you have room for more.":": in the safe range."}`:"Log a few weeks of sessions to see how this compares with your usual week."}</p>`;break;}
   case"conv":{const v=g("v"),k=f.elements.f.value;if(!ok(v)){h="Enter a number.";break;}const r={cm:[v/2.54,"in"],in:[v*2.54,"cm"],kg:[v*2.2046,"lb"],lb:[v/2.2046,"kg"]}[k];
     if(r)h=`<div class="big"><b>${Math.round(r[0]*10)/10} ${r[1]}</b><span>${v} ${k}</span></div>`;else{const inch=v*39.3701,ft=Math.floor(inch/12),i=Math.round((inch-ft*12)*10)/10;h=`<div class="big"><b>${ft} ft ${i} in</b><span>${v} m</span></div>`;}break;}}
  out.innerHTML=h;}
document.addEventListener("input",e=>{const f=e.target.closest("form.calc");if(f)calc(f);});
document.addEventListener("submit",e=>{if(e.target.matches("form.calc"))e.preventDefault();});
document.addEventListener("click",e=>{const b=e.target.closest("[data-savejump]");if(!b)return;if(VB.addTest(+b.dataset.savejump,"film-airtime")){VB.save();toast("Saved as today's jump test. +50 XP");}});

/* ================= rules and glossary ================= */
let q="",rsec="rules",rcat="all";const RQ={i:0,score:0,ans:null,order:null};
const RSECS=[["rules","Rules"],["new","What changed"],["signals","Referee signals"],["myths","Myth or rule?"],["quiz","Quiz"],["formats","Indoor, beach, sitting"],["gloss","Glossary"]];
const TAGS={new:"New in 2025",test:"Being tested","2025":"2025 rules"};
function renderRules(){const R=window.VB_RULES||[],G=window.VB_GLOSSARY||[],CAT=window.VB_RULE_CATS||[],m=s=>!q||s.toLowerCase().includes(q.toLowerCase());
  const was=document.activeElement&&document.activeElement.id==="rq";
  const rs=R.filter(r=>(q||rcat==="all"||r.c===rcat)&&m(r.t+" "+r.b)),gs=G.filter(g=>m(g[0]+" "+g[1])),sg=(window.VB_SIGNALS||[]).filter(s=>m(s.join(" "))),my=(window.VB_MYTHS||[]).filter(x=>m(x[0]+" "+x[2]));
  const ruleCard=(r,i)=>`<details class="v5card rule" ${q||i<2?"open":""}><summary>${esc(r.t)}${r.tag?` <span class="rtag ${r.tag}">${TAGS[r.tag]||r.tag}</span>`:""}</summary><p>${esc(r.b)}</p></details>`;
  const glossHTML=list=>`<dl class="gloss">${list.map(g=>`<div><dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd></div>`).join("")||`<p class="small muted">No term matches.</p>`}</dl>`;
  const sigHTML=list=>`<div class="sgrid">${list.map(s=>`<div class="v5card sig"><b>${esc(s[0])}</b><p class="small">${esc(s[1])}</p><span class="small muted">${esc(s[2])}</span></div>`).join("")||`<p class="small muted">No signal matches.</p>`}</div>`;
  const mythHTML=list=>`<div class="sgrid">${list.map(x=>`<details class="v5card myth"><summary><span class="small muted">Myth or rule?</span><b>${esc(x[0])}</b></summary><span class="rtag ${x[1]===true?"ok":x[1]===false?"myth":"test"}">${x[1]===true?"Rule":x[1]===false?"Myth":"Depends on the rules"}</span><p class="small">${esc(x[2])}</p></details>`).join("")||`<p class="small muted">No myth matches.</p>`}</div>`;
  let body="";
  if(q){body=`<div class="rlgrid"><div class="stack"><div class="kicker">Rules · ${rs.length}</div>${rs.map(ruleCard).join("")||`<p class="small muted">No rule matches.</p>`}${my.length?`<div class="kicker">Myths · ${my.length}</div>${mythHTML(my)}`:""}</div>
     <div class="stack"><div class="kicker">Terms · ${gs.length}</div>${glossHTML(gs)}${sg.length?`<div class="kicker">Signals · ${sg.length}</div>${sigHTML(sg)}`:""}</div></div>`;}
  else if(rsec==="rules"){body=`<div class="chips rcats">${[["all","All"],...CAT].map(([k,l])=>`<button type="button" class="chip" data-rcat="${k}" aria-pressed="${rcat===k}">${esc(l)}</button>`).join("")}</div>
     <div class="rcols">${rcat==="all"?CAT.map(([k,l])=>{const g=rs.filter(r=>r.c===k);return g.length?`<div class="rgroup"><div class="kicker">${esc(l)}</div>${g.map((r,i)=>ruleCard(r,k==="match"?i:9)).join("")}</div>`:"";}).join(""):rs.map(ruleCard).join("")}</div>
     <p class="small muted">Summarised from the FIVB Official Volleyball Rules 2025-2028, with the main USA Volleyball, college and school differences noted. Leagues change details: check your league's rulebook for anything that decides a match.</p>`;}
  else if(rsec==="new"){body=`<div class="sgrid">${(window.VB_RULE_CHANGES||[]).map(c=>`<div class="v5card sig"><b>${esc(c[0])}</b><p class="small">${esc(c[1])}</p></div>`).join("")}</div><p class="small muted">The FIVB rules for 2025-2028 apply to international play and most national federations that follow FIVB, including Volleyball Canada and U SPORTS. National and school rule sets adopt changes on their own timetable.</p>`;}
  else if(rsec==="signals")body=`<p class="small muted">The first referee's official hand signals, in words. The referee usually shows which team serves next, then the fault, then the player at fault if needed.</p>`+sigHTML(sg);
  else if(rsec==="myths")body=`<p class="small muted">Tap a card to see the answer.</p>`+mythHTML(my);
  else if(rsec==="formats"){const F=window.VB_FORMATS;body=`<div class="v5card tscroll"><table class="ftab"><thead><tr><th></th>${F.cols.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${F.rows.map(r=>`<tr><th>${esc(r[0])}</th>${r.slice(1).map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;}
  else if(rsec==="gloss")body=glossHTML(gs);
  else if(rsec==="quiz")body=quizHTML();
  $("#tpanel").innerHTML=`<div class="v5card rsearch"><label class="f">Search the rules, terms and signals<input id="rq" type="search" value="${esc(q)}" placeholder="Try libero, overlap, pipe, net, screening" autocomplete="off"></label><span class="small muted">${R.length} rules · ${G.length} terms · ${(window.VB_SIGNALS||[]).length} signals</span></div>
   ${q?"":`<div class="chips rsecs">${RSECS.map(([k,l])=>`<button type="button" class="chip" data-rsec="${k}" aria-pressed="${rsec===k}">${esc(l)}</button>`).join("")}</div>`}${body}`;
  if(was){const i=$("#rq");i.focus();i.setSelectionRange(i.value.length,i.value.length);}}
function quizHTML(){const Q=window.VB_RULE_QUIZ||[];if(!RQ.order)RQ.order=Q.map((_,i)=>i).sort(()=>Math.random()-.5);
  if(RQ.i>=Q.length)return `<div class="v5card rquiz"><div class="kicker">Done</div><h3>${RQ.score} / ${Q.length}</h3><p>${RQ.score>=Q.length-2?"Referee material.":RQ.score>=Q.length/2?"Solid. Read the rules you missed and try again.":"Worth a read through the Rules tab, then try again."}</p><button type="button" class="btn primary" id="rqagain">Try again</button></div>`;
  const x=Q[RQ.order[RQ.i]],a=RQ.ans;
  return `<div class="v5card rquiz"><div class="kicker">Question ${RQ.i+1} of ${Q.length} · score ${RQ.score}</div><h3>${esc(x.q)}</h3>
   <div class="row">${x.o.map((o,i)=>`<button type="button" class="btn ${a==null?"":i===x.a?"good":i===a?"bad":""}" data-rqa="${i}" ${a!=null?"disabled":""}>${esc(o)}</button>`).join("")}</div>
   ${a!=null?`<p class="${a===x.a?"qok":"qbad"}"><b>${a===x.a?"Right.":"Not quite."}</b> ${esc(x.why)}</p><button type="button" class="btn primary" id="rqnext">Next</button>`:""}</div>`;}
document.addEventListener("input",e=>{if(e.target.id==="rq"){q=e.target.value;renderRules();}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-rsec],[data-rcat],[data-rqa],#rqnext,#rqagain");if(!b)return;const Q=window.VB_RULE_QUIZ||[];
  if(b.dataset.rsec){rsec=b.dataset.rsec;renderRules();return;}
  if(b.dataset.rcat){rcat=b.dataset.rcat;renderRules();return;}
  if(b.dataset.rqa!=null&&RQ.ans==null){RQ.ans=+b.dataset.rqa;if(RQ.ans===Q[RQ.order[RQ.i]].a)RQ.score++;renderRules();return;}
  if(b.id==="rqnext"){RQ.i++;RQ.ans=null;renderRules();return;}
  if(b.id==="rqagain"){Object.assign(RQ,{i:0,score:0,ans:null,order:null});renderRules();}});
})();
