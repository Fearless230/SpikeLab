/* v5-tools.js: the Toolkit view (#tools). Five courtside tools, all offline:
   interval timer · match stat tracker · rotation viewer · calculators · rules and glossary.
   Sub-tabs live in the hash (#tools/timer) so the Home quick actions can deep-link. */
(function(){
"use strict";
const VB=window.VB,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s)),esc=VB.esc;
const S=()=>VB.state,V5=VB.v5,ic=V5.ic,toast=V5.toast;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TABS=[["timer","Interval timer","timer"],["match","Match tracker","board"],["rotations","Rotations","rotate"],["calc","Calculators","calc"],["rules","Rules and terms","book"]];
let tab="timer";

function show(sub){if(TABS.some(t=>t[0]===sub))tab=sub;render();}
function render(){const root=$("#toolsRoot");if(!root)return;
  root.innerHTML=`<div class="ttabs" role="tablist" aria-label="Tools">${TABS.map(([id,l,i])=>`<button type="button" role="tab" data-ttab="${id}" aria-selected="${id===tab}">${ic(i)}<span>${esc(l)}</span></button>`).join("")}</div><div id="tpanel" class="tpanel"></div>`;
  ({timer:renderTimer,match:renderMatch,rotations:renderRot,calc:renderCalc,rules:renderRules})[tab]();}
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
// zone centres on a half court seen from behind the end line: net at the top
const ZP={1:[250,265],2:[250,95],3:[150,95],4:[50,95],5:[50,265],6:[150,265]};
const ROLE={S:["Setter","#ffc145"],S2:["Setter 2","#ffc145"],OH1:["Outside 1","var(--gold)"],OH2:["Outside 2","var(--gold)"],MB1:["Middle 1","#45c8ff"],MB2:["Middle 2","#45c8ff"],OPP:["Opposite","#9d86ff"],L:["Libero","#4fd394"]};
const SYS={"5-1":{lineup:["S","OH1","MB1","OPP","OH2","MB2"],note:"One setter runs the offence in all six rotations. When the setter is in the front row there are only two front-row hitters, so a back-row attack (often the opposite or an outside from zone 1 or 6) matters most in those three rotations."},
  "6-2":{lineup:["S","OH1","MB1","S2","OH2","MB2"],note:"Two setters opposite each other. Whoever is in the back row sets, and the front-row setter hits on the right side, so there are always three front-row attackers."},
  "4-2":{lineup:["S","OH1","MB1","S2","OH2","MB2"],note:"Two setters opposite each other. Whoever is in the front row sets from the right front, so there are only two front-row hitters, but the setter can always attack or dump the second ball. Common in younger teams."}};
let RS={sys:"5-1",rot:0,after:false,lib:true};
function lineupFor(sys,rot){const base=SYS[sys].lineup,z={};for(let k=0;k<6;k++)z[k+1]=base[(k+rot)%6];return z;} // rot 0: setter in zone 1; each rotation moves everyone one zone clockwise
function setterOf(sys,z){const front=[2,3,4],ss=Object.entries(z).filter(([_,r])=>r==="S"||r==="S2");if(sys==="5-1")return ss[0][1];
  const fr=ss.find(([k])=>front.includes(+k)),bk=ss.find(([k])=>!front.includes(+k));return sys==="6-2"?bk[1]:fr[1];}
function baseZone(sys,zones,setter){const out={},front=[2,3,4];
  for(const [zs,r] of Object.entries(zones)){const zn=+zs,isFront=front.includes(zn),kind=r.replace(/\d/,"");
    if(isFront){out[r]=r===setter?2:kind==="OH"?4:kind==="MB"?3:2;}
    else{out[r]=r===setter?1:(kind==="S"||kind==="OPP")?1:kind==="OH"?6:5;}}
  return out;}
function renderRot(){const z0=lineupFor(RS.sys,RS.rot),setter=setterOf(RS.sys,z0),z={...z0};
  const libFor=RS.lib?Object.keys(z).find(k=>[1,5,6].includes(+k)&&/^MB/.test(z[k])):null;if(libFor)z[libFor]="L";
  const base=baseZone(RS.sys,z0,setter),sZone=+Object.keys(z0).find(k=>z0[k]===setter),front=[4,3,2].map(k=>z[k]),hitters=front.filter(r=>r!==setter&&r!=="L").length;
  const pos=r=>{const zone=RS.after?(r==="L"?5:base[r]):+Object.keys(z).find(k=>z[k]===r);return ZP[zone];};
  const arrows=RS.after?Object.values(z).map(r=>{const p=pos(r),o=ZP[+Object.keys(z).find(k=>z[k]===r)];if(o[0]===p[0]&&o[1]===p[1])return "";
      const mx=(o[0]+p[0])/2,my=(o[1]+p[1])/2,dx=p[0]-o[0],dy=p[1]-o[1],len=Math.hypot(dx,dy)||1,bend=40,cx=mx-dy/len*bend,cy=my+dx/len*bend*-1;
      // start and end just outside the circles so the arrow stays visible
      const s0=[o[0]+(cx-o[0])/Math.hypot(cx-o[0],cy-o[1])*27,o[1]+(cy-o[1])/Math.hypot(cx-o[0],cy-o[1])*27],e0=[p[0]+(cx-p[0])/Math.hypot(cx-p[0],cy-p[1])*30,p[1]+(cy-p[1])/Math.hypot(cx-p[0],cy-p[1])*30];
      return `<path d="M${s0[0].toFixed(1)} ${s0[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${e0[0].toFixed(1)} ${e0[1].toFixed(1)}" class="rarr" fill="none" marker-end="url(#rah)"/><circle cx="${o[0]}" cy="${o[1]}" r="25" class="rghost"/>`;}).join(""):"";
  const dots=arrows+Object.values(z).map(r=>{const p=pos(r),[nm,col]=ROLE[r],isSet=r===setter;
    return `
      <g class="rp" style="transform:translate(${p[0]}px,${p[1]}px)"><circle r="25" fill="${col}" ${isSet?'stroke="#fff" stroke-width="3"':""}/><text y="5" text-anchor="middle">${r.replace(/(\d)/,"$1")}</text><text class="rn" y="42" text-anchor="middle">${esc(nm)}${isSet?" · sets":""}</text></g>`;}).join("");
  const zl=[1,2,3,4,5,6].map(k=>`<text class="zl" x="${ZP[k][0]+30}" y="${ZP[k][1]-26}">${k}</text>`).join("");
  $("#tpanel").innerHTML=`<div class="rgrid"><div class="v5card"><div class="row rtop"><div class="seg" role="group" aria-label="System">${Object.keys(SYS).map(s=>`<button type="button" data-rsys="${s}" aria-pressed="${RS.sys===s}">${s}</button>`).join("")}</div>
      <div class="seg" role="group" aria-label="Moment"><button type="button" data-raft="0" aria-pressed="${!RS.after}">At the serve</button><button type="button" data-raft="1" aria-pressed="${RS.after}">Base after the serve</button></div>
      <label class="rlib"><input type="checkbox" id="rlib" ${RS.lib?"checked":""}> Libero in for the back-row middle</label></div>
    <div class="rnav">${[0,1,2,3,4,5].map(r=>{const zz=lineupFor(RS.sys,r),ss=setterOf(RS.sys,zz),sz=Object.keys(zz).find(k=>zz[k]===ss);return `<button type="button" data-rrot="${r}" aria-pressed="${RS.rot===r}"><b>${r+1}</b><small>Setter in ${sz}</small></button>`;}).join("")}</div>
    <svg class="rcourt" viewBox="-10 -30 320 360" role="img" aria-label="Rotation ${RS.rot+1}, ${RS.after?"base positions after the serve":"positions at the serve"}">
      <defs><marker id="rah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
      <rect x="0" y="0" width="300" height="320" class="rfl"/><line x1="0" y1="110" x2="300" y2="110" class="r3m"/><rect x="-6" y="-8" width="312" height="8" class="rnet"/><text x="150" y="-14" text-anchor="middle" class="rlab">NET</text><text x="150" y="350" text-anchor="middle" class="rlab">END LINE · zone 1 serves</text>${zl}${dots}</svg></div>
    <div class="stack"><div class="v5card"><div class="kicker">Rotation ${RS.rot+1} · ${esc(RS.sys)}</div><h3>Setter in zone ${sZone}</h3>
      <ul class="rfacts"><li><b>${hitters}</b> front-row attacker${hitters===1?"":"s"}: ${front.filter(r=>r!==setter&&r!=="L").map(r=>ROLE[r][0]).join(", ")}</li><li><b>${esc(ROLE[z[1]]?ROLE[z[1]][0]:z[1])}</b> serves when your team is serving</li><li>Setter: <b>${esc(ROLE[setter][0])}</b>, ${[2,3,4].includes(sZone)?"front row (may attack or dump the second ball)":"back row (may not attack above the net in front of the 3 m line)"}</li>${libFor?`<li>Libero is in for <b>${esc(ROLE[z0[libFor]][0])}</b> in zone ${libFor}</li>`:""}</ul>
      <p class="small muted">${esc(SYS[RS.sys].note)}</p></div>
     <div class="v5card"><div class="kicker">Overlap rule</div><p class="small">At the moment of the serve, each front-row player must be closer to the net than the back-row player directly behind them (4 ahead of 5, 3 ahead of 6, 2 ahead of 1). Side to side, the players in each row must stay in order: 4 left of 3, 3 left of 2, and 5 left of 6, 6 left of 1. Only the feet count. Once the ball is served, everyone can move to their base.</p>
      <p class="small muted">Base positions shown are a common arrangement: front row outside left, middle in the middle, setter or opposite on the right; back row libero left back, outside middle back, setter or opposite right back. Many teams vary the back-row spots, so follow your coach's system.</p></div></div></div>`;}
document.addEventListener("click",e=>{const b=e.target.closest("[data-rsys],[data-raft],[data-rrot]");if(!b)return;if(b.dataset.rsys)RS.sys=b.dataset.rsys;if(b.dataset.raft)RS.after=b.dataset.raft==="1";if(b.dataset.rrot)RS.rot=+b.dataset.rrot;renderRot();});
document.addEventListener("change",e=>{if(e.target.id==="rlib"){RS.lib=e.target.checked;renderRot();}});
document.addEventListener("keydown",e=>{if(V5.view()!=="tools"||tab!=="rotations"||e.target.closest("input,textarea,select"))return;if(e.key==="ArrowRight"){RS.rot=(RS.rot+1)%6;renderRot();}if(e.key==="ArrowLeft"){RS.rot=(RS.rot+5)%6;renderRot();}});

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
let q="";
function renderRules(){const R=window.VB_RULES||[],G=window.VB_GLOSSARY||[],m=s=>!q||s.toLowerCase().includes(q.toLowerCase());
  const rs=R.filter(r=>m(r.t+" "+r.b)),gs=G.filter(g=>m(g[0]+" "+g[1]));
  const was=document.activeElement&&document.activeElement.id==="rq";
  $("#tpanel").innerHTML=`<div class="v5card rsearch"><label class="f">Search the rules and terms<input id="rq" type="search" value="${esc(q)}" placeholder="Try libero, overlap, pipe, net" autocomplete="off"></label><span class="small muted">${rs.length} rules · ${gs.length} terms</span></div>
   <div class="rlgrid"><div class="stack"><div class="kicker">Rules in plain words</div>${rs.map((r,i)=>`<details class="v5card rule" ${q||i<2?"open":""}><summary>${esc(r.t)}</summary><p>${esc(r.b)}</p></details>`).join("")||`<p class="small muted">No rule matches.</p>`}
     <p class="small muted">Summarised from the FIVB indoor rules that most federations follow. School, college and recreational leagues change some details; check your league's rulebook for anything that decides a match.</p></div>
    <div class="stack"><div class="kicker">Glossary</div><dl class="gloss">${gs.map(g=>`<div><dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd></div>`).join("")||`<p class="small muted">No term matches.</p>`}</dl></div></div>`;
  if(was){const i=$("#rq");i.focus();i.setSelectionRange(i.value.length,i.value.length);}}
document.addEventListener("input",e=>{if(e.target.id==="rq"){q=e.target.value;renderRules();}});
})();
