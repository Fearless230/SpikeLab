/* crows-iq.js: Volleyball IQ 2.0, the Crow's Nest quiz (v10).
   Modes: Career (12 levels, stars, lifelines), Daily 5 (the same five for everyone today, one go), Lightning (60 s),
   Survival (three strikes, hardest first), Ref's Whistle (make the call) and Mistake review (the ones you missed come
   back until you get them right twice). Every answer feeds topic mastery. Questions: the original bank in crows.js and
   crows-data.js, plus the ones below. t = topic, d = difficulty 1 to 3; the first answer is right (answers are shuffled). */
(function(){
"use strict";
const VB=window.VB,IQ=VB.crowIQ={};
const MORE=[
  /* the referee's calls */
  {t:"ref",d:2,q:"A blocker brushes the net between the antennae while blocking. What's the call?",a:["Net fault: point to the attackers","Play on: blockers may touch the net","Replay the rally","Point to the blockers"],e:"Touching the net between the antennae while playing the ball is a fault, blockers included."},
  {t:"ref",d:2,q:"A spike clips a blocker's fingertips and lands out. What's the call?",a:["Point to the attacking team","Point to the blocking team","Replay","Out, so point to whoever didn't hit it"],e:"The block touched it last. Off the block and out is the attackers' point: a touchout."},
  {t:"ref",d:2,q:"A back-row player takes off in front of the attack line and spikes a ball that's completely above the net. The call?",a:["Fault: illegal back-row attack","Legal","Legal if they land behind the line","Legal in the fifth set only"],e:"Back-row players can attack above the net only if they take off from behind the attack line."},
  {t:"ref",d:3,q:"Your front-row setter jumps and tips the second ball over, completely above the net. The call?",a:["Legal: a front-row player may attack on two","Fault: setters can't attack","Fault: only on the third touch","Legal only if it's a set"],e:"Any front-row player can attack on any touch. A back-row setter couldn't, from above the net."},
  {t:"ref",d:2,q:"A player's whole foot lands in the opponents' court, past the centre line. The call?",a:["Fault","Legal, as long as they didn't touch an opponent","Legal on a block","Only a fault if the ball is in play on that side"],e:"Part of the foot must stay on or above the centre line. A whole foot across is a fault."},
  {t:"ref",d:2,q:"Their spike deflects off your blocker. Your team then passes, sets and attacks. The call?",a:["Legal: the block touch doesn't count","Four hits","Legal only if a different player passes","Fault: the blocker touched twice"],e:"A block touch isn't one of your three. You still get three more."},
  {t:"ref",d:2,q:"The ball touches the gym ceiling above your court and comes back down. The call?",a:["Out: point to the other team","Play on","Replay","Point to the team that didn't touch it last"],e:"A ball that touches the ceiling or any object is out."},
  {t:"ref",d:1,q:"A serve hits the antenna. The call?",a:["Service fault: point to the receivers","Let: serve again","In if it drops into the court","Point to the server"],e:"The antennae are part of the net's boundary. Touching one is out."},
  {t:"ref",d:2,q:"A player lets the ball come to rest in their hands before pushing it over. The call?",a:["Catch (held ball): point to the other team","Legal on the second touch","Legal if it's one motion","Replay"],e:"The ball must be hit, not caught or thrown."},
  {t:"ref",d:3,q:"The serving team's front row waves their arms and shuffles side to side to hide the server. The call?",a:["Screening fault: point to the receivers","Legal: it's their court","A warning only","Replay"],e:"Screening the server from the receivers is a fault."},
  {t:"ref",d:3,q:"The ball crosses outside the antenna into the opponents' free zone. Can your team chase it back?",a:["Yes, back through the space outside the antenna, within your three touches","No, it's out at once","Yes, back under the net","Only the libero can"],e:"You can play it back as long as it returns outside the antennae on the same side and you still have a touch."},
  {t:"ref",d:2,q:"A pass deflects off a teammate's shoulder and goes over the net. How many contacts was that?",a:["Two, and it's legal","One","Two, and it's a fault","Three"],e:"Every touch by a player counts, but two is still within the three allowed."},
  {t:"ref",d:3,q:"Two blockers touch the ball one after the other in a single block. How many team touches is that?",a:["None: block touches don't count","One","Two","It's a double contact"],e:"Several blockers can touch the ball in one block action; it doesn't count as a team touch."},
  /* setting */
  {t:"set",d:1,q:"What's a setter dump?",a:["The setter attacks the second ball over instead of setting","A set that falls short","A bad pass to the setter","A set to the back row"],e:"Front-row setters tip or swing the second ball when the block is waiting for a set."},
  {t:"set",d:2,q:"Where should a setter's hands meet the ball?",a:["Above the forehead, fingers and thumbs making a window","At chest height, palms flat","Beside the shoulder","Below the chin"],e:"High and in front of the forehead gives the cleanest, most hidden set."},
  {t:"set",d:2,q:"Why do setters try to look the same on every set?",a:["So the blockers can't read where it's going","It's a rule","It makes the ball spin less","To save energy"],e:"Disguise: if the front set and the back set look identical, the middle blocker has to guess."},
  {t:"set",d:1,q:"What's a back set?",a:["A set behind the setter, usually to the right side","A set to the back row","A set that goes backwards over the net","A second set in the same rally"],e:"The setter faces the left antenna and sets over their head to the opposite or right side hitter."},
  {t:"set",d:2,q:"The pass is bad and pulls the setter off the net. What's usually the safest set?",a:["A high ball to the outside","A quick to the middle","A back-row pipe","A dump"],e:"Out of system, a high ball gives the hitter time to adjust."},
  {t:"set",d:2,q:"What does 'tempo' describe?",a:["When the hitter starts the approach compared with the set","How hard the setter pushes the ball","The number of sets in a rally","The speed of the serve"],e:"First tempo: the hitter is in the air as the ball is set. Third tempo: a high ball the hitter approaches after."},
  {t:"set",d:2,q:"What's a 'shoot' set?",a:["A fast, flat set out toward the antenna","A set straight up","A set to the libero","A set that's spiked by the setter"],e:"It gets the hitter to the pin before the outside blocker can close."},
  {t:"set",d:3,q:"Who usually sets when the setter takes the first touch?",a:["The libero or the right side, with a high ball","Nobody: the team must send it over","The middle blocker, with a quick","The setter again"],e:"A player can't touch twice in a row. Someone else sets, usually high to the outside."},
  {t:"set",d:1,q:"Which player touches the ball most in a match?",a:["The setter","The libero","The middle blocker","The server"],e:"The setter takes nearly every second ball, so they run the offence."},
  /* serving */
  {t:"srv",d:2,q:"What makes a jump serve dip into the court?",a:["Topspin","Backspin","No spin at all","The net"],e:"Topspin pulls the ball down, so a hard serve can still land in."},
  {t:"srv",d:1,q:"Can you serve underhand?",a:["Yes, any serve hit with one hand or arm is legal","No, only overhand","Only in the fifth set","Only juniors can"],e:"Any technique works as long as it's one hand or arm, after the toss or release."},
  {t:"srv",d:2,q:"The passers stand deep. Which serve is most likely to score?",a:["A short serve in front of them","A deep serve to the end line","A serve at the libero","A high lob"],e:"Serve where they aren't: short when they're deep, deep when they creep in."},
  {t:"srv",d:2,q:"Which is usually faster: a jump spin serve or a jump float?",a:["The jump spin","The jump float","They're the same","A standing float"],e:"The jump spin is the power serve. The float wins with movement, not speed."},
  {t:"srv",d:3,q:"Why is serving at the seam between two passers effective?",a:["Both may hesitate about who takes it","It's always out","It's the shortest distance","The libero can't play it"],e:"Doubt costs time. A call and a quick decision beat the seam."},
  {t:"srv",d:2,q:"What's a 'tough serve'?",a:["One that forces a bad pass even if it isn't an ace","A serve that hits the net","Any jump serve","A serve after a time-out"],e:"Most serves aren't aces. Making their setter run out of system is a win too."},
  /* positions and rotations */
  {t:"pos",d:1,q:"Which way do players rotate?",a:["Clockwise","Anticlockwise","Front to back","Whichever way the coach wants"],e:"After a side-out, everyone moves one zone clockwise and zone 2 goes back to serve from zone 1."},
  {t:"pos",d:1,q:"Which zone is left front?",a:["4","2","3","5"],e:"Front row: 4 (left), 3 (middle), 2 (right). Back row: 5, 6, 1."},
  {t:"pos",d:1,q:"Which zone is middle back?",a:["6","3","5","1"],e:"Zone 6 sits between 5 and 1, behind the middle."},
  {t:"pos",d:2,q:"Which players does the libero usually replace in the back row?",a:["The middle blockers","The setter","The opposite","The outside hitters"],e:"Middles are tall blockers; the libero takes their back-row rotations to pass and dig."},
  {t:"pos",d:1,q:"How many front-row players can block?",a:["Three","Two","One","All six"],e:"Only the three front-row players can block. Back-row players and the libero can't."},
  {t:"pos",d:2,q:"Where does the opposite usually attack from?",a:["The right side, zone 2","The middle","The left, zone 4","Only the back row"],e:"The opposite plays across from the setter and hits from the right."},
  {t:"pos",d:3,q:"When can players leave their rotation spots?",a:["Once the ball is served","Never","Only when serving","At any time before the serve"],e:"Overlap rules apply only at the moment of the serve. After that, everyone switches to their playing spots."},
  /* tactics */
  {t:"tac",d:2,q:"Their best hitter is in the front row. What's a smart serve?",a:["Serve at them so they have to pass first","Serve to the libero","Serve easy so they don't get angry","Serve out on purpose"],e:"A hitter who passes has to recover before attacking, and might pass badly."},
  {t:"tac",d:2,q:"Their block is tall and always on time. Your best options?",a:["Off the hands, tips and roll shots","Hit as hard as you can into the middle","Always set the middle","Always free ball"],e:"Use the block: aim at the top of the outside hand, or put the ball where nobody is."},
  {t:"tac",d:2,q:"Your team gets a free ball. What does the front row do?",a:["Back off the net to get ready to attack","Jump to block","Run to the end line","Stay right at the net"],e:"Free ball means a clean attack: hitters transition back to make an approach."},
  {t:"tac",d:1,q:"What's 'cover' when your teammate attacks?",a:["Crouching around the hitter to dig a ball blocked back","Hiding behind the block","A defensive formation on serve","The coach's notes"],e:"Blocked balls come back fast and low. Cover saves rallies."},
  {t:"tac",d:2,q:"What's a joust?",a:["Two opposing players pushing the ball at the same time above the net","A serve that hits the tape","Two blockers touching the ball","A long rally"],e:"If it stays on your side after a joust, you get three more touches."},
  {t:"tac",d:2,q:"What does 'out of system' mean?",a:["The setter can't take the second ball, so someone else sets","The ball went out","The team used all its time-outs","A rotation fault"],e:"Out of system, simple and high wins: no fancy combinations."},
  {t:"tac",d:3,q:"Why do teams often serve at zone 1 when the opposing setter starts there?",a:["The setter has further to run to set from the net","Zone 1 is the weakest spot by rule","It's always out","The libero can't reach it"],e:"Make the setter's job harder: a setter penetrating from right back has the longest route."},
  /* defence and attack extras */
  {t:"def",d:2,q:"What do diggers watch to read a hitter?",a:["Their approach angle, shoulders and arm swing","Only the ball","The setter's feet","The referee"],e:"The body tells you the shot before the ball does."},
  {t:"def",d:1,q:"What's a sprawl?",a:["Stretching low to one side to dig a ball","A jump serve","A two-handed block","A set from the floor"],e:"Get low, extend, play the ball, roll out."},
  {t:"att",d:2,q:"What's a 'high hands' shot?",a:["Hitting off the top of the block so it goes out","A very high set","A tip over the block","A block with straight arms"],e:"Aim at the top of the outside blocker's hands and the ball flies out off them."},
  {t:"att",d:3,q:"Which hitter usually runs a slide?",a:["The middle, behind the setter","The libero","The opposite, from the back row","The setter"],e:"The middle runs along the net and takes off from one foot, like a layup."},
  {t:"att",d:1,q:"Where should your eyes be just before you spike?",a:["On the ball, then a glance at the block","On the floor","On the setter's feet","On the crowd"],e:"Track the ball into your hand; good hitters also see the block in their last steps."}
];
const TOPICS={rules:"Rules",ref:"Referee calls",att:"Attack",def:"Defence",set:"Setting",srv:"Serving",pos:"Positions",tac:"Tactics"};
const LEVELS=["Rookie","Bench","Starter","Regular","Captain","Ace","Libero mind","Setter's eye","Coach's pet","Assistant","Coach","Legend"];
let K=null,run=null;
const $=s=>document.querySelector(s),esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const hashS=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
const shuffle=(a,r)=>{a=a.slice();r=r||Math.random;for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const seeded=s=>{let x=s>>>0||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%1e9)/1e9;};};
/* the whole bank, each with an id and a topic */
function bank(){if(IQ._bank)return IQ._bank;const base=(IQ.base||[]).map(q=>Object.assign({},q,{t:q.t||(q.f==="att"?"att":q.f==="def"?"def":"rules")}));
  IQ._bank=base.concat(MORE.map(q=>Object.assign({},q))).map(q=>Object.assign(q,{id:hashS(q.q),d:q.d||2}));return IQ._bank;}
function st(){const c=K.C();c.iq=c.iq&&typeof c.iq==="object"?c.iq:{};const s=c.iq;s.lvl=s.lvl|0;s.stars=s.stars||{};s.xp=s.xp|0;s.topics=s.topics||{};s.miss=s.miss||{};s.daily=s.daily||{};s.seen=s.seen||{};return s;}
const prep=(q,r)=>{const o=shuffle(q.a.map((t,i)=>({t,ok:i===0})),r);return Object.assign({},q,{opts:o});};
/* six questions for a career level: harder as you climb, with a topic each level leans on */
function levelSet(n){const B=bank(),T=Object.keys(TOPICS),focus=T[n%T.length],dmax=n<3?1:n<8?2:3,dmin=n<5?1:n<9?1:2,pool=B.filter(q=>q.d>=dmin&&q.d<=dmax),f=shuffle(pool.filter(q=>q.t===focus)).slice(0,3);
  return {focus,qs:shuffle(f.concat(shuffle(pool.filter(q=>!f.includes(q))).slice(0,6-f.length)))};}
function dailySet(){const d=K.today(),r=seeded(parseInt(hashS("daily"+d),36));return shuffle(bank(),r).slice(0,5).map(q=>prep(q,r));}
IQ.mount=(P,kit,base)=>{K=kit;IQ.base=base||IQ.base;IQ._bank=null;menu(P);return {stop(){stopRun();P.onclick=null;window.removeEventListener("keydown",onKey);}};};
function stopRun(){if(run&&run.timer)clearInterval(run.timer);run=null;}
function mastery(s,t){const m=s.topics[t]||{n:0,ok:0};return {n:m.n,pct:m.n?Math.round(m.ok/m.n*100):0,lv:m.n<4?0:Math.min(5,Math.floor((m.ok/m.n)*5*Math.min(1,m.n/20)+.0001))};}
function menu(P){stopRun();const s=st(),c=K.C(),today=K.today(),dd=s.daily[today],missN=Object.keys(s.miss).length,B=bank();
  P.innerHTML=`<div class="iq"><div class="iq-hero"><div><div class="kicker">Volleyball IQ</div><h3>Know the game</h3><p class="small muted">${B.length} questions on the rules, the referee's calls, attack, defence, setting, serving, positions and tactics.</p></div>
      <div class="iq-lv"><b>${LEVELS[Math.min(s.lvl,LEVELS.length-1)]}</b><span>Career level ${Math.min(s.lvl+1,12)} of 12 · ${s.xp} XP</span><i style="--k:${Math.min(1,s.lvl/12)}"></i></div></div>
    <div class="iq-modes">
      <button type="button" class="iq-m big" data-iq="career"><span class="kicker">Career</span><b>${s.lvl>=12?"Every level cleared":"Level "+(s.lvl+1)+": "+LEVELS[s.lvl]}</b><span>Six questions a level, get four right to move up. Two lifelines each: 50:50 and skip.</span></button>
      <button type="button" class="iq-m ${dd!=null?"done":""}" data-iq="daily" ${dd!=null?"disabled":""}><span class="kicker">Daily 5 · ${streak(s)} day streak</span><b>${dd!=null?`Done today: ${dd}/5`:"Today's five"}</b><span>The same five questions for everyone today. One go.</span></button>
      <button type="button" class="iq-m" data-iq="ref"><span class="kicker">Ref's Whistle</span><b>Make the call</b><span>Eight situations. You're the referee.</span></button>
      <button type="button" class="iq-m" data-iq="lightning"><span class="kicker">Lightning · best ${c.best.lightning|0}</span><b>60 seconds</b><span>As many as you can. Every 5 in a row adds 5 seconds; a miss costs 3.</span></button>
      <button type="button" class="iq-m" data-iq="survival"><span class="kicker">Survival · best ${c.best.expert|0}</span><b>Three strikes</b><span>Hardest first. Keep going until your third mistake.</span></button>
      <button type="button" class="iq-m" data-iq="review" ${missN?"":"disabled"}><span class="kicker">Mistake review</span><b>${missN?missN+" to fix":"Nothing to fix"}</b><span>Questions you missed come back until you get them right twice.</span></button></div>
    <div class="iq-mast"><div class="kicker">Topic mastery</div><div class="iq-tg">${Object.entries(TOPICS).map(([t,l])=>{const m=mastery(s,t);return `<div class="iq-t"><span>${l}</span><span class="iq-dots">${[0,1,2,3,4].map(i=>`<i class="${i<m.lv?"on":""}"></i>`).join("")}</span><small>${m.n?m.pct+"% of "+m.n:"not tried"}</small></div>`;}).join("")}</div></div>
    ${s.lvl>0?`<div class="iq-path">${LEVELS.map((l,i)=>`<span class="${i<s.lvl?"won":i===s.lvl?"next":""}" title="${esc(l)}">${i<s.lvl?"★".repeat(s.stars[i]||1):i+1}</span>`).join("")}</div>`:""}</div>`;
  P.onclick=e=>{const b=e.target.closest("[data-iq],[data-iqo],[data-iqx]");if(!b||!P.contains(b))return;
    if(b.dataset.iq){if(b.dataset.iq==="menu"){menu(P);return;}start(P,b.dataset.iq);return;}
    if(b.dataset.iqo!=null){pick(P,+b.dataset.iqo);return;}
    const x=b.dataset.iqx;if(x==="next")next(P);else if(x==="fifty")fifty(P);else if(x==="skip")skip(P);else if(x==="again")start(P,IQ._last?IQ._last.mode:"career");};
  window.removeEventListener("keydown",onKey);window.addEventListener("keydown",onKey);IQ._P=P;}
function streak(s){let n=0;const d=new Date();if(s.daily[K.today()]==null)d.setDate(d.getDate()-1);for(;;){const k=VB.iso?VB.iso(d):d.toISOString().slice(0,10);if(s.daily[k]!=null){n++;d.setDate(d.getDate()-1);}else break;}return n;}
function start(P,mode){stopRun();const s=st(),B=bank();let qs,title,lvl=null;
  if(mode==="career"){lvl=Math.min(s.lvl,11);const L=levelSet(lvl);qs=L.qs.map(q=>prep(q));title=`Career · Level ${lvl+1}: ${LEVELS[lvl]} · ${TOPICS[L.focus]} focus`;}
  else if(mode==="daily"){if(s.daily[K.today()]!=null){menu(P);return;}qs=dailySet();title="Daily 5";}
  else if(mode==="ref"){qs=shuffle(B.filter(q=>q.t==="ref")).slice(0,8).map(q=>prep(q));title="Ref's Whistle";}
  else if(mode==="survival"){qs=shuffle(B.filter(q=>q.d>=3)).concat(shuffle(B.filter(q=>q.d===2)),shuffle(B.filter(q=>q.d===1))).map(q=>prep(q));title="Survival";}
  else if(mode==="review"){const ids=Object.keys(s.miss);qs=shuffle(B.filter(q=>ids.includes(q.id))).slice(0,8).map(q=>prep(q));if(!qs.length){menu(P);return;}title="Mistake review";}
  else{qs=shuffle(B).map(q=>prep(q));title="Lightning";}
  run={mode,qs,i:0,right:0,picked:null,strikes:0,streak:0,best:0,left:60,title,lvl,fifty:mode==="career",skip:mode==="career",missed:[],xp:0,hidden:[]};
  if(mode==="lightning"){run.timer=setInterval(()=>{if(!run)return;run.left-=.1;const el=document.getElementById("iqClock");if(el){el.textContent=Math.max(0,run.left).toFixed(1);el.parentElement.style.setProperty("--k",Math.max(0,run.left/60));}if(run.left<=0){clearInterval(run.timer);run.timer=null;end(P);}},100);}
  draw(P);}
function draw(P){if(!run)return;const r=run,m=r.mode;if(r.i>=r.qs.length||(m==="survival"&&r.strikes>=3)){end(P);return;}
  const q=r.qs[r.i],pk=r.picked,ok=pk!=null&&q.opts[pk].ok,lit=m==="lightning",total=m==="survival"||lit?"":` of ${r.qs.length}`;
  const head=lit?`<span class="qclock" style="--k:${r.left/60}"><b id="iqClock">${r.left.toFixed(1)}</b>s</span> · streak ${r.streak}`:m==="survival"?`Question ${r.i+1} · ${"✕".repeat(r.strikes)}${"○".repeat(3-r.strikes)}`:`Question ${r.i+1}${total}`;
  P.innerHTML=`<div class="iq iq-run ${m}"><div class="iq-top"><span class="kicker">${esc(r.title)}</span><span class="stat">${r.right} right${r.streak>=3?` · 🔥 ${r.streak}`:""}</span></div>
    ${!lit&&m!=="survival"?`<div class="qbar"><i style="width:${r.i/r.qs.length*100}%"></i></div>`:""}
    <div class="iq-card"><div class="iq-meta"><span>${head}</span><span class="iq-chip t-${q.t}">${TOPICS[q.t]||"Rules"}</span><span class="iq-d">${"●".repeat(q.d)}${"○".repeat(3-q.d)}</span></div>
      <h3>${esc(q.q)}</h3><div class="qopts">${q.opts.map((o,i)=>{const cls=pk==null?(r.hidden.includes(i)?"gone":""):o.ok?"ok":pk===i?"bad":"dim";return `<button type="button" class="qo ${cls}" data-iqo="${i}" ${pk!=null||r.hidden.includes(i)?"disabled":""}><kbd>${i+1}</kbd>${esc(o.t)}</button>`;}).join("")}</div>
      ${pk==null&&(r.fifty||r.skip)?`<div class="iq-life">${r.fifty?`<button type="button" class="btn sm" data-iqx="fifty">50:50 <kbd>H</kbd></button>`:""}${r.skip?`<button type="button" class="btn sm" data-iqx="skip">Skip <kbd>S</kbd></button>`:""}</div>`:""}
      ${pk!=null&&!lit?`<div class="iq-exp ${ok?"ok":"bad"}" role="status"><b>${ok?"Right!":"Not quite."}</b> ${ok?"":`The answer: <b>${esc(q.opts.find(o=>o.ok).t)}</b>. `}${esc(q.e)}</div><button class="btn primary" type="button" data-iqx="next">${r.i+1<r.qs.length&&!(m==="survival"&&r.strikes>=3)?"Next question":"See my score"} <kbd>Enter</kbd></button>`:""}</div></div>`;
  const n=P.querySelector('[data-iqx="next"]');if(n)n.focus({preventScroll:true});}
function pick(P,i){const r=run;if(!r||r.picked!=null)return;const q=r.qs[r.i];if(!q||!q.opts[i]||r.hidden.includes(i))return;r.picked=i;const ok=q.opts[i].ok,s=st();
  const tm=s.topics[q.t]=s.topics[q.t]||{n:0,ok:0};tm.n++;if(ok)tm.ok++;
  if(ok){r.right++;r.streak++;r.best=Math.max(r.best,r.streak);r.xp+=q.d*5+(r.streak>=3?2:0);if(r.mode==="lightning"&&r.streak%5===0)r.left+=5;
    if(s.miss[q.id]!=null){s.miss[q.id]++;if(s.miss[q.id]>=2||r.mode==="review"&&s.miss[q.id]>=2)delete s.miss[q.id];}}
  else{r.streak=0;r.strikes++;r.missed.push(q);s.miss[q.id]=0;if(r.mode==="lightning")r.left=Math.max(0,r.left-3);}
  K.sfx(ok?"perfect":"miss");K.save();draw(P);
  if(r.mode==="lightning")setTimeout(()=>{if(run===r&&r.picked!=null){r.i++;r.picked=null;r.hidden=[];draw(P);}},ok?320:700);}
function next(P){if(!run)return;run.i++;run.picked=null;run.hidden=[];draw(P);}
function fifty(P){const r=run;if(!r||!r.fifty||r.picked!=null)return;const q=r.qs[r.i],wrong=q.opts.map((o,i)=>o.ok?-1:i).filter(i=>i>=0);r.hidden=shuffle(wrong).slice(0,2);r.fifty=false;K.sfx("tick");draw(P);}
function skip(P){const r=run;if(!r||!r.skip||r.picked!=null)return;const used=new Set(r.qs.map(q=>q.id)),q=r.qs[r.i],alt=shuffle(bank().filter(x=>!used.has(x.id)&&Math.abs(x.d-q.d)<=1))[0];if(alt)r.qs[r.i]=prep(alt);r.skip=false;r.hidden=[];K.sfx("whoosh");draw(P);}
function end(P){const r=run,s=st(),c=K.C(),m=r.mode;if(!r)return;if(r.timer)clearInterval(r.timer);let fe=0,head=`${r.right}${m==="lightning"||m==="survival"?" right":" / "+r.qs.length}`,msg="",nb=false;
  if(m==="career"){const n=r.right,pass=n>=4,stars=n>=6?3:n>=5?2:n>=4?1:0;fe=n*5+(pass?15:0);
    if(pass){s.stars[r.lvl]=Math.max(s.stars[r.lvl]|0,stars);if(r.lvl===s.lvl&&s.lvl<12){s.lvl++;fe+=20;msg=`Level ${r.lvl+1} cleared! ${s.lvl<12?"Next: "+LEVELS[s.lvl]:"Every level is yours."}`;}else msg="Level cleared again.";if(n>=6){s.perfect=(s.perfect|0)+1;c.best.quiz=Math.max(c.best.quiz|0,10);}}
    else msg="Four right moves you up. Read the coach's notes and go again.";head=`${n} / 6 ${"★".repeat(stars)}`;}
  else if(m==="daily"){fe=r.right*8+(r.right===5?15:0);s.daily[K.today()]=r.right;c.dailyN=(c.dailyN|0)+1;msg=`Daily streak: ${streak(s)} day${streak(s)===1?"":"s"}. New five tomorrow.`;}
  else if(m==="lightning"){fe=r.right*3+r.best*2;if(r.right>(c.best.lightning|0)){c.best.lightning=r.right;nb=true;}msg=`Best streak ${r.best} · ${r.i} answered`;}
  else if(m==="survival"){fe=r.right*6;if(r.right>(c.best.expert|0)){c.best.expert=r.right;nb=true;}msg=r.right>=12?"A true rules expert.":"The hard ones are hard. Read the notes and try again.";}
  else if(m==="ref"){fe=r.right*5;msg=r.right>=7?"You could run a match.":"Referees train for years. Go again.";}
  else{fe=r.right*4;msg=`${Object.keys(s.miss).length} left to fix.`;}
  s.xp+=r.xp;K.award(fe);c.games++;K.save();K.checkBadges();K.refreshStats();
  P.innerHTML=`<div class="iq iq-done"><div class="kicker">Volleyball IQ · ${esc(r.title)}</div><h3>${head}</h3><p>${esc(msg)}${nb?" · new best":""}</p><p class="spk-fe">+${fe} feathers · +${r.xp} XP</p>
    ${r.missed.length?`<details class="qreview" open><summary>Review ${r.missed.length} you missed</summary><ul>${r.missed.map(x=>`<li><b>${esc(x.q)}</b><span>${esc(x.a[0])}. ${esc(x.e)}</span></li>`).join("")}</ul></details>`:""}
    <div class="row">${m==="daily"?"":`<button class="btn primary" type="button" data-iqx="again">${m==="career"&&r.right>=4&&s.lvl<12?"Next level":"Play again"}</button>`}<button class="btn" type="button" data-iq="menu">All modes</button></div></div>`;
  IQ._last=run;run=null;
  K.sfx(r.right>=(m==="career"?4:5)?"unlock":"tick");}
function onKey(e){const P=IQ._P;if(!P||!document.body.contains(P)||!run)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(/^[1-4]$/.test(e.key)&&run.picked==null){e.preventDefault();pick(P,+e.key-1);}
  else if(e.key==="Enter"&&run.picked!=null&&run.mode!=="lightning"){e.preventDefault();next(P);}
  else if((e.key==="h"||e.key==="H")&&run.picked==null){fifty(P);}else if((e.key==="s"||e.key==="S")&&run.picked==null){skip(P);}}
IQ.bank=()=>bank();
})();
