/* week-gameday.js: Today week overview, weekly recap, game-day mode, shareable player card, coach shortcut and weekly team
   summary, spoken cues in guided mode, goal-based plans. Reuses VB.v3 hooks. */
(function(){
"use strict";
const VB=window.VB,S=()=>VB.state,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ic=n=>VB.icon?VB.icon(n):"";
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const view=()=>(location.hash.replace("#","")||"today").split("/")[0];
const sessions=()=>(S().sessions||[]).filter(s=>!s.ex);
const events=()=>((S().season||{}).events||[]);
const vertBest=(from,to)=>{let b=null;(S().tests||[]).forEach(t=>{if(t.kind==="vert"&&!t.ex&&t.date>=from&&t.date<=to&&(b==null||t.cm>b))b=t.cm;});return b;};

/* ---------- B5: Today, the week at a glance ---------- */
function weekCard(){const phone=matchMedia("(max-width:760px)").matches,host=phone?$("#todayMain"):$("#todaySide");if(!host||!S().profile)return;let el=$("#weekGlance");
  // phones: at the top of the session column (the side column comes after the session); desktop: top of the side column
  if(el&&el.parentElement!==host){el.remove();el=null;}
  if(!el){el=document.createElement("div");el.id="weekGlance";el.className="card weekglance";const gd=$("#gameDay");phone&&gd&&gd.parentElement===host?gd.after(el):host.prepend(el);}
  const today=VB.today(),ws=VB.weekStart(today),target=S().profile.days||3,plan=new Set(VB.cal?VB.cal.trainDays():((S().reminder||{}).days||[]));
  const done=new Set(sessions().filter(s=>s.date>=ws).map(s=>s.date)),n=sessions().filter(s=>s.date>=ws).length,pct=Math.min(100,Math.round(n/target*100));
  const cells=DAYS.map((d,i)=>{const ds=VB.addDays(ws,i),ev=VB.cal?VB.cal.gameOn(ds):events().find(e=>e.date===ds),dow=(i+1)%7,isT=ds===today,did=done.has(ds),planned=plan.has(dow);
    const st=ev?"game":did?"done":ds<today?(planned?"miss":"rest"):planned?"plan":"rest";
    return `<li class="wd ${st}${isT?" today":""}" title="${d}: ${ev?esc(ev.name||"Game"):st==="done"?"trained":st==="plan"?"planned":st==="miss"?"missed":"rest"}"><span>${d[0]}</span><i>${ev?ic("whistle"):did?ic("fit"):""}</i></li>`;}).join("");
  el.innerHTML=`<div class="wg-top"><div class="ring wg-ring" style="--p:${pct}"><b>${n}<small>/${target}</small></b></div>
    <div><div class="kicker">This week</div><h3>${n>=target?"Weekly target hit":`${target-n} session${target-n===1?"":"s"} to go`}</h3>
    <p class="small muted">${pct}% of your ${target} sessions${done.has(today)?" · trained today":""}</p></div></div><ol class="wstrip">${cells}</ol>
    <div class="wg-key small muted"><span><i class="k done"></i>Trained</span><span><i class="k plan"></i>Planned</span><span><i class="k game"></i>Game</span></div>`;}

/* ---------- B6: weekly recap (shown at the start of each week until dismissed) ---------- */
function recapCard(){const host=$("#todayMain");if(!host||!S().profile)return;let el=$("#recapCard");
  const today=VB.today(),ws=VB.weekStart(today),lw=VB.addDays(ws,-7),pw=VB.addDays(ws,-14),dow=(new Date(today+"T12:00:00").getDay()+6)%7;
  const seen=(S().ui||{}).recapSeen;const show=dow<=2&&seen!==ws&&sessions().some(s=>s.date>=lw&&s.date<ws);
  if(!show){if(el)el.remove();return;}
  const agg=(a,b)=>{const L=sessions().filter(s=>s.date>=a&&s.date<b);return {n:L.length,min:L.reduce((t,s)=>t+(s.mins||0),0),jumps:L.reduce((t,s)=>t+(s.jumps||0),0),vert:vertBest(a,VB.addDays(b,-1))};};
  const A=agg(lw,ws),B=agg(pw,lw),best=vertBest("0000",VB.addDays(lw,-1));
  const row=(label,a,b,unit)=>{const d=a-b,cls=d>0?"up":d<0?"down":"";return `<div class="rc-row"><span>${label}</span><b>${a}${unit||""}</b><em class="${cls}">${b==null||!isFinite(d)||(!a&&!b)?"":d>0?"+"+d:d<0?d:"same"}</em></div>`;};
  if(!el){el=document.createElement("div");el.id="recapCard";el.className="card recap";host.prepend(el);}
  el.innerHTML=`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="kicker">${ic("level")} Last week</div><h3>Your week in review</h3></div><button type="button" class="btn sm" data-recap-close>Got it</button></div>
    <div class="rc-grid">${row("Sessions",A.n,B.n)}${row("Minutes",A.min,B.min)}${row("Jumps",A.jumps,B.jumps)}${A.vert!=null?`<div class="rc-row"><span>Best jump</span><b>${A.vert} cm</b><em class="${best!=null&&A.vert>best?"up":""}">${best!=null&&A.vert>best?"New best":""}</em></div>`:""}</div>
    <p class="small muted">${A.n>B.n?"More sessions than the week before. Keep that rhythm.":A.n<B.n?"A lighter week than the one before. That's fine if it was planned.":"Same number of sessions as the week before."}</p>`;}
document.addEventListener("click",e=>{if(e.target.closest("[data-recap-close]")){const st=S();st.ui=st.ui||{};st.ui.recapSeen=VB.weekStart(VB.today());VB.save();const el=$("#recapCard");if(el)el.remove();}});

/* ---------- B8: game-day mode ---------- */
const GAMEDAY=[
  ["Eat and hydrate","2-3 h before: a normal meal you know sits well. Sip water through the morning.",0],
  ["Pulse raiser","5 min: easy jog, skips and side shuffles until you're warm.",300],
  ["Dynamic mobility","4 min: leg swings, hip openers, arm circles, thoracic rotations. Nothing held long.",240],
  ["Activation","3 min: glute bridges, band pull-aparts, external rotations. Light, just switching muscles on.",180],
  ["Speed and jumps","3 min: 3 quick approaches at 70%, then 3 at full speed. 2 pogo sets. Stop well before fatigue.",180],
  ["Ball touches","5 min: partner passing, then setting, then easy arm swings building to full hits.",300],
  ["Last word","Pick one focus for the first set (for example: early approach). Breathe out slowly before the first serve.",0]];
function gameDay(){const host=$("#todayMain");if(!host)return;let el=$("#gameDay");const ev=VB.cal?VB.cal.gameOn(VB.today()):events().find(e=>e.date===VB.today());
  if(!ev){if(el)el.remove();document.body.classList.remove("gameday");return;}
  document.body.classList.add("gameday");
  if(!el){el=document.createElement("div");el.id="gameDay";el.className="card gameday-card";host.prepend(el);}
  const kind=(VB.cal?VB.cal.KINDS:{})[ev.kind]||"Match",st=(S().ui||{}).gd||{},day=VB.today();const doneN=GAMEDAY.filter((_,i)=>st[day+i]).length;
  el.innerHTML=`<div class="kicker">${ic("whistle")} Game day</div><h3>${esc(kind)}${ev.name?": "+esc(ev.name):""} today${ev.time?" · "+esc(ev.time):""}</h3>${ev.place?`<p class="small">${esc(ev.place)}</p>`:""}
    <p class="small muted">Your session is cut to activation and arm care. Use this warm-up before you play: about 20 minutes, ${doneN} of ${GAMEDAY.length} done.</p>
    <ol class="gd-list">${GAMEDAY.map(([t,d,sec],i)=>`<li class="${st[day+i]?"ok":""}"><button type="button" data-gd="${i}" aria-pressed="${!!st[day+i]}" aria-label="Mark ${esc(t)} done">${st[day+i]?ic("fit"):i+1}</button><div><b>${esc(t)}</b>${sec?`<span class="small muted"> · ${Math.round(sec/60)} min</span>`:""}<p class="small">${esc(d)}</p></div></li>`).join("")}</ol>`;}
document.addEventListener("click",e=>{const b=e.target.closest("[data-gd]");if(!b)return;const ev=VB.cal?VB.cal.gameOn(VB.today()):events().find(x=>x.date===VB.today());if(!ev)return;const st=S();st.ui=st.ui||{};st.ui.gd=st.ui.gd||{};const k=VB.today()+b.dataset.gd;st.ui.gd[k]=!st.ui.gd[k];VB.save();gameDay();});

/* ---------- B7: share the player card as an image ---------- */
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
/* the player in their own look, in the attack pose at the top of the jump, drawn once into an offscreen canvas */
function figure(){try{const G=VB.GL,A=VB.Athlete;if(!G||!A)return null;const cv=document.createElement("canvas"),R=G.renderer(cv,{alpha:true,preserve:true});if(!R)return null;R.setSize(700,840,1);
    const scene={root:new G.Node(),clear:[0,0,0,0],light:{sky:"#c9c6ef",gnd:"#3a2f55",d1:[.4,1,.7],c1:"#ffffff",d2:[-.6,.4,-.5],c2:"#8a86c8",rim:"#ff8aa0"},exposure:1.05,inkScale:1.4};
    const p=S().profile||{},o=Object.assign({},VB.lookOpts?VB.lookOpts(p.look):{},{clip:"spike",number:p.number!=null?p.number:"",lefty:p.hand==="left",height:1.9,jersey:(VB.myAccent&&VB.myAccent())||"#ec3b52",accent:"#ffffff"});
    const pl=A.player(o);scene.root.add(pl.root);const c=A.CLIPS.spike;pl.update((c.contact||1.9)-.1);
    const W=pl.a.W.p,cx=W[0],cy=W[1];
    R.render(scene,{fov:30,pos:[cx-1.4,cy+.55,5.9],target:[cx+.15,cy+.62,0],near:.1,far:50});return cv;}catch(e){return null;}}
async function cardImage(){const p=S().profile||{},W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  const acc=(VB.myAccent&&VB.myAccent())||"#cf2840";
  const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#241f6b");bg.addColorStop(1,"#120f3a");g.fillStyle=bg;g.fillRect(0,0,W,H);
  // court lines
  g.strokeStyle="rgba(255,255,255,.07)";g.lineWidth=6;for(let i=0;i<6;i++){g.beginPath();g.moveTo(-200+i*260,H);g.lineTo(200+i*260,0);g.stroke();}
  g.fillStyle=acc;g.fillRect(0,0,W,16);
  // the 3D figure from the on-screen card, if drawn
  const fig=figure();if(fig){try{g.drawImage(fig,W-760,120,700,840);}catch(e){}}
  const pos=(VB.POS&&VB.POS[p.pos]&&VB.POS[p.pos].label)||"Player";
  g.fillStyle="rgba(255,255,255,.9)";g.font="800 210px Inter, Arial, sans-serif";g.textAlign="right";g.globalAlpha=.16;g.fillText(p.number!=null?String(p.number):"",W-60,330);g.globalAlpha=1;
  g.textAlign="left";g.fillStyle="#fff";const nm=(p.name||"Player").toUpperCase().slice(0,18);g.font=`800 ${nm.length>11?64:86}px Inter, Arial, sans-serif`;g.fillText(nm,70,990);
  g.fillStyle=acc;g.font="700 38px Inter, Arial, sans-serif";g.fillText(pos.toUpperCase()+(p.number!=null?"  ·  #"+p.number:""),72,1048);
  const st=[["Sessions",sessions().length],["Week streak",VB.streak?VB.streak():0],["Vertical",(()=>{const v=vertBest("0000","9999");return v!=null?v+" cm":"–";})()]];
  st.forEach(([l,v],i)=>{const x=70+i*320;rr(g,x,1100,290,170,22);g.fillStyle="rgba(255,255,255,.08)";g.fill();g.fillStyle="#fff";g.font="800 64px Inter, Arial, sans-serif";g.fillText(String(v),x+26,1190);g.fillStyle="rgba(255,255,255,.65)";g.font="600 28px Inter, Arial, sans-serif";g.fillText(l.toUpperCase(),x+26,1238);});
  g.fillStyle="rgba(255,255,255,.55)";g.font="600 26px Inter, Arial, sans-serif";g.fillText("VOLLEYBALL TRAINING JOURNEY",70,80);
  return new Promise(r=>c.toBlob(r,"image/png"));}
async function shareCard(){const btn=$("#cardShare");if(btn)btn.disabled=true;try{const blob=await cardImage();if(!blob)throw new Error("no image");
    const file=new File([blob],"my-player-card.png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"My player card"});}
    else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="my-player-card.png";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);VB.v3.toast("Player card saved as an image.");}
  }catch(e){if(e&&e.name!=="AbortError")VB.v3.toast("Couldn't make the image in this browser.");}finally{if(btn)btn.disabled=false;}}
function shareBtn(){const l=$("#cardLink");if(!l||$("#cardShare"))return;l.insertAdjacentHTML("afterend",`<button class="btn sm" id="cardShare" type="button">${ic("share")}Share as image</button>`);}
document.addEventListener("click",e=>{if(e.target.closest("#cardShare"))shareCard();});

/* ---------- render hooks ---------- */
function today(){if(view()!=="today")return;weekCard();recapCard();gameDay();}
VB.v3.onRoute(v=>{if(v==="today")setTimeout(today,0);if(v==="profile")shareBtn();});
VB.v3.onSave(()=>{if(view()==="today")today();});
new MutationObserver(()=>{if(view()==="today"&&$("#todaySide")&&!$("#weekGlance"))today();if(view()==="profile")shareBtn();if(view()==="progress"&&$("#seasonCard")&&!$("#goalCard")&&VB.v4)VB.v4.goalCard();if(view()==="today"&&VB.v4&&S().goal&&!$("#goalDue"))VB.v4.goalToday();}).observe(document.body,{childList:true,subtree:true});

/* ---------- C9: coach shortcut ---------- */
document.addEventListener("click",e=>{const a=e.target.closest("[data-coach-go]");if(!a)return;e.preventDefault();const m=$("#menu");if(m&&!m.hidden){const c=$("#menuClose");c&&c.click();}
  location.hash="#squad";const go=(n)=>{const h=$("#coachHost");if(h&&h.firstElementChild){h.scrollIntoView({behavior:"smooth",block:"start"});}else if(n>0)setTimeout(()=>go(n-1),250);else{const r=$("#squadRoot");r&&r.scrollIntoView({behavior:"smooth"});VB.v3.toast("Coach tools appear in Squad once you're signed in and have created a team.");}};setTimeout(()=>go(12),200);});

/* ---------- C11: spoken cues in guided mode ---------- */
const FR=()=>VB.lang==="fr";
const ui=()=>{const st=S();st.ui=st.ui||{};return st.ui;};
const voiceOn=()=>ui().voice!==false&&"speechSynthesis" in window;
function say(t){if(!voiceOn()||!t)return;try{const u=new SpeechSynthesisUtterance(t);u.lang=FR()?"fr-FR":"en-US";u.rate=1.05;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
VB.v3.cue=(ev,o)=>{const G=VB.v3.gState&&VB.v3.gState();if(!G)return;
  if(ev==="start"){const s=Math.round(o.sec);
    say(o.phase==="rest"?(FR()?`Repos, ${s} secondes`:`Rest ${s} seconds`):o.phase==="hold"?(FR()?`Tenez ${s} secondes`:`Hold for ${s} seconds`):o.phase==="drill"?(FR()?`Atelier, ${Math.round(s/60)} minutes. C'est parti`:`Drill, ${Math.round(s/60)} minutes. Go`):"");}
  else if(ev==="count")say(String(o.n));
  else if(ev==="end")say(o.phase==="rest"?(FR()?"Allez":"Go"):o.phase==="hold"?(FR()?"Relâchez":"Release"):(FR()?"Terminé":"Time"));};
// announce each new exercise as it comes up, and a mute button in the guided header
let lastAnn=null;
new MutationObserver(()=>{const el=$("#gmode");if(!el||el.hidden)return;const top=el.querySelector(".gtop");
  if(top&&!top.querySelector("[data-voice]")&&"speechSynthesis" in window){top.lastElementChild.insertAdjacentHTML("beforebegin",`<button type="button" class="gx gvoice" data-voice aria-pressed="${voiceOn()}" aria-label="${voiceOn()?"Mute spoken cues":"Turn on spoken cues"}" title="Spoken cues">${ic("speaker")}</button>`);}
  const G=VB.v3.gState&&VB.v3.gState();if(!G||!VB.v3.gItems)return;const items=VB.v3.gItems(),it=items[G.i];if(!it||G.phase!=="work"||G.set)return;const key=G.i+":"+it.id;if(key===lastAnn)return;lastAnn=key;
  const inf=VB.v3.gInfo(it);say(`${inf.name}. ${inf.dose.replace(/×/g,FR()?"fois":"by").replace(/ s\b/," seconds")}`);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
document.addEventListener("click",e=>{const b=e.target.closest("[data-voice]");if(!b)return;ui().voice=!voiceOn();VB.save();b.setAttribute("aria-pressed",voiceOn());b.setAttribute("aria-label",voiceOn()?"Mute spoken cues":"Turn on spoken cues");if(!voiceOn())try{speechSynthesis.cancel();}catch(_){}else say(FR()?"Consignes vocales activées":"Spoken cues on");});

/* ---------- C12: goal-based plan ---------- */
const vertNow=()=>{const T=(S().tests||[]).filter(t=>t.kind==="vert"&&!t.ex).sort((a,b)=>a.date<b.date?-1:1);return T.length?T[T.length-1]:null;};
function goalCard(){const host=$("#seasonCard");if(!host||!S().profile)return;let el=$("#goalCard");
  if(!el){el=document.createElement("div");el.id="goalCard";el.className="card goalcard";host.parentElement.insertBefore(el,host);}
  const g=S().goal,u=VB.lu(),now=vertNow();
  if(!g){el.innerHTML=`<div class="kicker">${ic("target")} Goal</div><h3>Set a jump goal</h3>
    <p class="small muted">Pick a target and a date. The plan leans into jump training, books a check-in test every three weeks and tells you if you're on track.</p>
    <form id="goalForm" class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end" novalidate>
      <label class="small">Add to my vertical (${u})<input type="number" id="gAdd" min="1" max="30" step="0.5" value="${u==="in"?3:8}" style="width:90px"></label>
      <label class="small">By<input type="date" id="gDate" value="${VB.addDays(VB.today(),112)}" min="${VB.addDays(VB.today(),21)}"></label>
      <button class="btn sm primary" type="submit">Set goal</button></form>
    ${now?"":`<p class="small muted">Log a vertical jump test first (in "Log a test" below) so the goal has a starting point.</p>`}<p class="small" id="gErr" role="alert"></p>`;return;}
  const start=g.start,cur=now&&now.date>=g.startDate?now.cm:start,tgt=start+g.add,days=VB.daysBetween(g.startDate,g.date),gone=Math.max(0,VB.daysBetween(g.startDate,VB.today())),
    frac=Math.min(1,gone/Math.max(1,days)),expect=start+g.add*frac,pct=Math.max(0,Math.min(100,Math.round((cur-start)/g.add*100))),left=VB.daysBetween(VB.today(),g.date);
  const status=cur>=tgt?"done":cur>=expect-.6?"on":"behind",next=nextCheck(g);
  const f=v=>Math.round(VB.lenOut(v)*10)/10;
  el.innerHTML=`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="kicker">${ic("target")} Goal</div><h3>+${f(g.add)} ${u} by ${VB.shortDate(g.date)}</h3></div><button type="button" class="btn sm" data-goal-clear>Change</button></div>
    <div class="gbar"><i style="width:${pct}%"></i><b style="left:${Math.round(frac*100)}%" title="Where you'd be if progress were even"></b></div>
    <div class="row small" style="justify-content:space-between"><span>Start ${f(start)} ${u}</span><span><b>Now ${f(cur)} ${u}</b></span><span>Target ${f(tgt)} ${u}</span></div>
    <p class="small gstat ${status}">${status==="done"?"Goal reached. Set a new one when you're ready.":status==="on"?`On track. ${left} days to go.`:`Behind the even pace by ${f(expect-cur)} ${u}. Keep jump sessions and sleep consistent; progress is rarely a straight line.`}</p>
    ${status!=="done"?`<p class="small muted">${next<=0?`<b>Check-in test due.</b> Measure your vertical (wall test or Film) and log it below.`:`Next check-in test in ${next} day${next===1?"":"s"}.`}</p>`:""}`;}
function nextCheck(g){const last=(S().tests||[]).filter(t=>t.kind==="vert"&&!t.ex&&t.date>=g.startDate).map(t=>t.date).sort().pop()||g.startDate;return VB.daysBetween(VB.today(),VB.addDays(last,21));}
document.addEventListener("submit",e=>{if(e.target.id!=="goalForm")return;e.preventDefault();const now=vertNow(),add=VB.lenIn($("#gAdd").value),date=$("#gDate").value,er=$("#gErr");
  if(!now){er.textContent="Log a vertical jump test first, so the goal has a starting point.";return;}
  if(!(add>0)||!date||date<=VB.addDays(VB.today(),13)){er.textContent="Choose a gain above zero and a date at least two weeks away.";return;}
  const weeks=VB.daysBetween(VB.today(),date)/7,rate=add/weeks;
  if(rate>1.6){er.textContent=`That's about ${(VB.lenOut(rate)).toFixed(1)} ${VB.lu()} a week, which is faster than training usually allows. Try a smaller gain or a later date.`;return;}
  const st=S();st.goal={kind:"vert",add,date,start:now.cm,startDate:VB.today()};const p=st.profile;p.goals=p.goals||[];if(!p.goals.includes("jump"))p.goals.unshift("jump");
  VB.invalidatePlan&&VB.invalidatePlan();VB.save();goalCard();VB.v3.toast("Goal set. Your plan now leans toward jump training.");});
document.addEventListener("click",e=>{if(e.target.closest("[data-goal-clear]")){delete S().goal;VB.save();goalCard();}});
// Today: a check-in reminder when a test is due
function goalToday(){const host=$("#todayMain");if(!host)return;let el=$("#goalDue");const g=S().goal;const due=g&&nextCheck(g)<=0&&VB.today()<=g.date;
  if(!due){if(el)el.remove();return;}if(!el){el=document.createElement("div");el.id="goalDue";el.className="card goaldue";host.prepend(el);}
  el.innerHTML=`<div class="kicker">${ic("target")} Goal check-in</div><p><b>Time to measure your vertical.</b> Three minutes with a wall and tape, or film a jump. It keeps your goal on track.</p><a class="btn sm primary" href="#progress" data-goto-test>Log my jump</a> <a class="btn sm" href="#film">Film a jump</a>`;}
document.addEventListener("click",e=>{if(e.target.closest("[data-goto-test]"))setTimeout(()=>{const f=$("#otherForm");f&&f.scrollIntoView({behavior:"smooth"});},400);});
VB.v3.onRoute(v=>{if(v==="progress")setTimeout(goalCard,0);if(v==="today")setTimeout(goalToday,0);});
VB.v3.onSave(()=>{if(view()==="progress")goalCard();if(view()==="today")goalToday();});
VB.v4={goalCard,goalToday,say,weekCard,recapCard,gameDay,cardImage,GAMEDAY};
})();
