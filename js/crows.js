/* crows.js: the secret Crow's Nest.
   A secret code on the Profile page unlocks a personal edition for one player: a black-and-colour site skin, kits, volleyballs,
   ball effects, titles and backgrounds, and the #nest page: a welcome-back boot screen, three mini-games (Dig Defence,
   Freak Quick, Jump Serve), a volleyball quiz, a daily training camp, a season road against invented rival teams, a skill
   chart, a weekly goal, badges and a feather shop. Each code belongs to one person (PEOPLE below) with their own colours,
   lines, focus and progress. Progress lives in VB.state.crow, so it saves to the device and the account like everything else. */
(function(){
"use strict";
const VB=window.VB,esc=VB.esc,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

/* ---------- the people. Edit names, notes and lines here. Codes are stored as hashes: make a new one with VB.crow.hash("newcode") in the console ---------- */
const PEOPLE={
  augustin:{code:"5b9dynvfu4",name:"Augustin Dias",edition:"Guardian edition",big:"KARASUNO",focus:"def",
    tag:"Guardian of the back row",
    note:"Augustin, this page is just for you. Every ball you chase down and refuse to let hit the floor is what a guardian does. Keep diving, keep shouting, keep flying. From your biggest fan.",
    col:{a:"#ff7a1a",b:"#ffb21a",rgb:"255,122,26",dark:"#b84a06",btn:"#c24e08",btnInk:"#ffffff",bg:"#2a1608"},
    start:{kit:"crow",ball:"crow",fx:"feathers",title:"crow",bg:"crowgym"},
    boot:[["Reflexes","online"],["Platform","locked and level"],["Rolling Thunder","charged"]],
    hello:"Welcome back to the Crow's Nest. All systems are ready.",
    lines:["The rally isn't over until the ball touches the floor. So don't let it.","Height is a number on a chart. Heart doesn't fit on a chart.","Every great spike starts with someone who refused to let the ball drop.",
      "Read. Move. Dig. Shout. Repeat.","Be loud. A libero's voice is part of the defence.","Fall down seven times, dig the eighth.","Crows fly together. Lift your teammates up.","Sore legs today, highlight reel tomorrow.",
      "Get low, stay low, stay hungry.","You can't control the serve. You can control your first step.","The back row is where the brave ones play.","When the ball comes at you hard, smile. That's your ball."]},
  theodore:{code:"12fvo54ipfb",name:"Theodore Dias",edition:"Fearless edition",big:"FEARLESS",focus:"att",
    tag:"Fearless from the attack line",
    note:"Theodore, this one is yours. Fearless doesn't mean never missing. It means wanting the next ball anyway. Call for it, jump for it, swing for it. From your biggest fan.",
    col:{a:"#ffc21a",b:"#ff7a1a",rgb:"255,194,26",dark:"#8a5d00",btn:"#ffc21a",btnInk:"#121115",bg:"#2a2006"},
    start:{kit:"fearless",ball:"thunder",fx:"thunder",title:"fearless",bg:"sky"},
    boot:[["Approach","locked in"],["Jump","loaded"],["Fear","not found"]],
    hello:"Fearless mode is online. Let's fly.",
    lines:["Fear is just the net looking taller than it is.","Swing like the block isn't there. Then find the gap.","Every big hitter missed a thousand spikes first.","Call for the ball. Loud. Every time.",
      "Jump like the ceiling is the limit, not the net.","A fearless hitter wants the ball when the score is tied.","Land soft, swing hard.","Missed it? Next ball. Fearless means you go again.",
      "Three steps, big arms, explode.","The block is a wall until you learn where the doors are.","Hit the ball where they aren't.","Confidence is built one good rep at a time."]}
};
let ORANGE="#ff7a1a";

const hash=str=>{let h1=0xdeadbeef^7,h2=0x41c6ce57^7;for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);};
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const today=()=>VB.today?VB.today():new Date().toISOString().slice(0,10);
const reduced=()=>!!VB.reduced||matchMedia("(prefers-reduced-motion: reduce)").matches;
const weekKey=()=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return VB.iso?VB.iso(d):d.toISOString().slice(0,10);};

/* ---------- state: G() is shared (who is unlocked, colours, sound), C() is the current person's progress ---------- */
function G(){const st=VB.state;if(!st.crow||typeof st.crow!=="object")st.crow={};const g=st.crow;
  if(!g.people||typeof g.people!=="object"){g.people={};
    /* v8.3 kept one person's progress at the top level: move it under Augustin */
    if(g.owned||g.badges){const old={};["owned","best","camp","badges","bought","feathers","earned","digs","thunder","games","title","rtDay","rtN","unlockedAt"].forEach(k=>{if(g[k]!==undefined){old[k]=g[k];delete g[k];}});g.people.augustin=old;if(g.on&&!g.who)g.who="augustin";}}
  if(g.skin===undefined)g.skin=true;if(g.who&&!PEOPLE[g.who])g.who=null;return g;}
const on=()=>{const g=VB.state&&VB.state.crow;return !!(g&&g.on&&(g.who?PEOPLE[g.who]:g.owned));};
const who=()=>G().who||"augustin";
const ME=()=>PEOPLE[who()];
function C(){const g=G(),id=who();if(!g.people[id]||typeof g.people[id]!=="object")g.people[id]={};const c=g.people[id];
  if(!c.owned||typeof c.owned!=="object")c.owned={};["ball","fx","title","bg"].forEach(k=>{if(!Array.isArray(c.owned[k]))c.owned[k]=[];});
  if(!c.best||typeof c.best!=="object")c.best={};["dig","quick","quiz","serve"].forEach(k=>{c.best[k]=+c.best[k]||0;});
  if(!c.camp||typeof c.camp!=="object")c.camp={};["badges","bought","road"].forEach(k=>{if(!Array.isArray(c[k]))c[k]=[];});
  ["feathers","earned","digs","thunder","games","aces"].forEach(k=>{c[k]=+c[k]||0;});if(!c.goal||typeof c.goal!=="object")c.goal={};return c;}
const save=()=>{VB.save&&VB.save();};

/* ---------- rewards ---------- */
const TITLES={crow:"Crow of Karasuno",fearless:"Fearless",guardian:"Guardian Deity",thunder:"Rolling Thunder",quick:"Freak Quick",brain:"Volleyball Brain",ace:"Karasuno Ace",server:"Service Ace",
  giant:"Little Giant",allround:"All-Rounder",champ:"National Champion",goat:"The GOAT"};
const BGS={crowgym:"Crow gym",orange:"Orange court",sky:"Night sky court"};
const QN=8;
const campDays=c=>Object.values(c.camp).filter(a=>Array.isArray(a)&&a.length>=3).length;
/* skill chart, each 0 to 100 */
const SKILLS=[["Receive",c=>c.best.dig/60],["Attack",c=>c.best.quick/15],["Serve",c=>c.best.serve/30],["Volleyball IQ",c=>c.best.quiz/QN],["Grit",c=>campDays(c)/10],["Energy",c=>(c.thunder+c.games)/40]];
const skills=c=>SKILLS.map(([,f])=>Math.round(Math.max(0,Math.min(1,f(c)))*100));
const BADGES=[
  {id:"welcome",name:"Welcome to Karasuno",desc:"Enter your secret code",have:()=>1,n:1,f:50,r:p=>[["ball",p.start.ball],["fx",p.start.fx],["title",p.start.title],["bg",p.start.bg]]},
  {id:"digs",name:"Nice receive!",desc:"Dig 25 balls in Dig Defence",have:c=>c.digs,n:25,f:20,r:()=>[]},
  {id:"guardian",name:"Guardian Deity",desc:"Score 30 in one game of Dig Defence",have:c=>c.best.dig,n:30,f:40,r:()=>[["title","guardian"]]},
  {id:"wall",name:"Not on my floor",desc:"Score 60 in one game of Dig Defence",have:c=>c.best.dig,n:60,f:60,r:()=>[["ball","sunset"]]},
  {id:"quick5",name:"First tempo",desc:"Hit a streak of 5 in Freak Quick",have:c=>c.best.quick,n:5,f:20,r:()=>[]},
  {id:"quick",name:"Freak Quick",desc:"Hit a streak of 10 in Freak Quick",have:c=>c.best.quick,n:10,f:50,r:()=>[["title","quick"],["fx","thunder"]]},
  {id:"serve",name:"Service Ace",desc:"Score 20 in one game of Jump Serve",have:c=>c.best.serve,n:20,f:40,r:()=>[["title","server"],["ball","ace"]]},
  {id:"aces",name:"Ace machine",desc:"Hit 50 aces in Jump Serve",have:c=>c.aces,n:50,f:50,r:()=>[]},
  {id:"thunder",name:"Rolling Thunder",desc:"Press the big hype button 10 times",have:c=>c.thunder,n:10,f:30,r:()=>[["title","thunder"]]},
  {id:"brain",name:"Volleyball Brain",desc:`Get all ${QN} right in Volleyball IQ`,have:c=>c.best.quiz>=QN?1:0,n:1,f:50,r:()=>[["title","brain"]]},
  {id:"camp3",name:"Training camp",desc:"Finish the daily camp on 3 days",have:c=>campDays(c),n:3,f:60,r:()=>[["bg","orange"]]},
  {id:"camp7",name:"Karasuno Ace",desc:"Finish the daily camp on 7 days",have:c=>campDays(c),n:7,f:100,r:()=>[["title","ace"]]},
  {id:"goal",name:"Promise kept",desc:"Finish a weekly goal",have:c=>c.goalsDone||0,n:1,f:30,r:()=>[]},
  {id:"allround",name:"All-Rounder",desc:"Reach 50 in every skill on your skill chart",have:c=>Math.min(...skills(c)),n:50,f:80,r:()=>[["title","allround"]]},
  {id:"champ",name:"National Champion",desc:"Win every match on the season road",have:c=>c.road.length,n:10,f:150,r:()=>[["title","champ"]]}
];
const SHOP=[
  {id:"giant",name:"Little Giant",kind:"Title",cost:150,r:["title","giant"]},
  {id:"crowball",name:"Crow",kind:"Volleyball",cost:200,r:["ball","crow"]},
  {id:"thunderball",name:"Rolling thunder",kind:"Volleyball",cost:200,r:["ball","thunder"]},
  {id:"feathers",name:"Crow feathers",kind:"Ball effect",cost:220,r:["fx","feathers"]},
  {id:"crowgym",name:"Crow gym",kind:"Background",cost:250,r:["bg","crowgym"]},
  {id:"sky",name:"Night sky court",kind:"Background",cost:250,r:["bg","sky"]},
  {id:"fearless",name:"Fearless",kind:"Title",cost:300,r:["title","fearless"]},
  {id:"crowtitle",name:"Crow of Karasuno",kind:"Title",cost:300,r:["title","crow"]},
  {id:"goat",name:"The GOAT",kind:"Title",cost:400,r:["title","goat"]}
];
/* the season road: invented rival teams, one match at a time */
const ROAD=[
  {opp:"Riverside Owls",kind:"Practice match",need:"Play any mini-game",ok:c=>c.games>=1,f:20},
  {opp:"Granite Hill Rams",kind:"Practice match",need:"Score 15 in Dig Defence",ok:c=>c.best.dig>=15,f:25},
  {opp:"Lakeside Herons",kind:"League",need:"Get 5 right in Volleyball IQ",ok:c=>c.best.quiz>=5,f:25},
  {opp:"Northgate Wolves",kind:"League",need:"Hit a streak of 5 in Freak Quick",ok:c=>c.best.quick>=5,f:30},
  {opp:"Harbor Sharks",kind:"League",need:"Score 10 in Jump Serve",ok:c=>c.best.serve>=10,f:30},
  {opp:"Ironwood Bears",kind:"Cup, round 1",need:"Finish the daily camp on 2 days",ok:c=>campDays(c)>=2,f:40},
  {opp:"Summit Falcons",kind:"Cup quarter-final",need:"Earn 6 badges",ok:c=>c.badges.length>=6,f:40},
  {opp:"Cedar Point Lynx",kind:"Cup semi-final",need:"Score 40 in Dig Defence and 20 in Jump Serve",ok:c=>c.best.dig>=40&&c.best.serve>=20,f:50},
  {opp:"Thunder Bay Eagles",kind:"Cup final",need:"Hit a streak of 12 in Freak Quick",ok:c=>c.best.quick>=12,f:60},
  {opp:"The Kings of the Court",kind:"Nationals final",need:"Reach 60 in every skill on your skill chart",ok:c=>Math.min(...skills(c))>=60,f:100}
];
function give(c,[t,id]){if(t&&id&&!c.owned[t].includes(id))c.owned[t].push(id);}
function checkRoad(c,fresh){let i=c.road.length;while(i<ROAD.length&&ROAD[i].ok(c)){c.road.push(i);c.feathers+=ROAD[i].f;c.earned+=ROAD[i].f;fresh.push({name:`Win vs ${ROAD[i].opp}`,f:ROAD[i].f,rr:[]});i++;}}
function checkBadges(quiet){if(!on())return [];const c=C(),p=ME(),fresh=[];checkRoad(c,fresh);
  BADGES.forEach(b=>{if(!c.badges.includes(b.id)&&b.have(c)>=b.n){c.badges.push(b.id);c.feathers+=b.f;c.earned+=b.f;const rr=b.r(p);rr.forEach(r=>give(c,r));fresh.push({name:b.name,f:b.f,rr});}});
  checkRoad(c,fresh);
  if(fresh.length){save();if(!quiet){fresh.forEach((b,i)=>setTimeout(()=>badgeToast(b),i*1700));sfx("unlock");}}
  return fresh;}
function award(n){if(n<=0)return;const c=C();c.feathers+=n;c.earned+=n;}
const owned=()=>{const c=C();return {ball:c.owned.ball,fx:c.owned.fx,title:c.owned.title,bg:c.owned.bg};};
function need(type,id){const c=C(),p=ME();const b=BADGES.find(x=>x.r(p).some(r=>r[0]===type&&r[1]===id));
  if(b)return {desc:b.desc+" (Crow's Nest)",n:b.n,have:Math.min(b.have(c),b.n)};
  const s=SHOP.find(x=>x.r[0]===type&&x.r[1]===id);if(s)return {desc:`Buy it in the Crow's Nest shop for ${s.cost} feathers`,n:s.cost,have:Math.min(c.feathers,s.cost)};return null;}
const titleText=()=>{if(!on())return "";const c=C();return c.title&&c.owned.title.includes(c.title)?TITLES[c.title]||"":"";};
const accent=()=>on()?ME().col.a:null;

/* ---------- sound ---------- */
let AC=null,noiseBuf=null;
function sfx(kind){if(!on()||G().mute)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();}catch(e){return;}
  const t=AC.currentTime,out=AC.createGain();out.gain.value=.22;out.connect(AC.destination);
  const tone=(f,d,type,at,vol,f2)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t+(at||0));if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+(at||0)+d);
    g.gain.setValueAtTime(0,t+(at||0));g.gain.linearRampToValueAtTime(vol||1,t+(at||0)+.008);g.gain.exponentialRampToValueAtTime(.001,t+(at||0)+d);o.connect(g);g.connect(out);o.start(t+(at||0));o.stop(t+(at||0)+d+.05);};
  const noise=(d,at,vol,lp)=>{if(!noiseBuf){noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=noiseBuf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
    const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();s.buffer=noiseBuf;f.type="lowpass";f.frequency.value=lp||2000;g.gain.setValueAtTime(vol||1,t+(at||0));g.gain.exponentialRampToValueAtTime(.001,t+(at||0)+d);s.connect(f);f.connect(g);g.connect(out);s.start(t+(at||0));s.stop(t+(at||0)+d+.05);};
  if(kind==="dig"){tone(180,.12,"sine",0,1,80);noise(.06,0,.6,1800);}
  else if(kind==="perfect"){tone(180,.12,"sine",0,1,80);tone(880,.12,"triangle",.04,.5);tone(1320,.18,"triangle",.1,.45);}
  else if(kind==="drop"){tone(140,.35,"sawtooth",0,.35,60);}
  else if(kind==="kill"){noise(.25,0,1,3500);tone(90,.3,"sine",0,1,40);}
  else if(kind==="miss"){tone(300,.18,"square",0,.25,200);}
  else if(kind==="thunder"){noise(.9,0,1,900);tone(70,1,"sawtooth",0,.6,35);tone(523,.15,"triangle",.05,.4);tone(784,.25,"triangle",.15,.4);}
  else if(kind==="unlock"){[523,659,784,1047].forEach((f,i)=>tone(f,.3,"triangle",i*.09,.55));}
  else if(kind==="coin"){tone(988,.08,"square",0,.25);tone(1319,.18,"square",.07,.25);}
  else if(kind==="whoosh"){noise(.35,0,.6,1200);}
  else if(kind==="tick"){tone(660,.05,"triangle",0,.3);}}

/* ---------- crow silhouette (an original simple bird shape) ---------- */
const CROW_PATH="M2 26 C10 21 19 19 27 21 C31 13 40 5 54 2 C47 9 43 15 42 21 C48 20 55 22 62 25 C56 26 51 27 47 29 L55 34 C48 34 42 33 37 31 C31 36 22 38 13 36 C16 33 18 31 19 29 C13 29 7 28 2 26 Z";
const crowSvg=(cls)=>`<svg class="${cls||"crowic"}" viewBox="0 0 64 40" aria-hidden="true"><path d="${CROW_PATH}" fill="currentColor"/></svg>`;
function crowAt(g,x,y,s,flip,col){g.save();g.translate(x,y);g.scale(flip?-s:s,s);g.translate(-32,-20);g.fillStyle=col;g.fill(new Path2D(CROW_PATH));g.restore();}
function featherAt(g,x,y,len,rot,col){g.save();g.translate(x,y);g.rotate(rot);g.fillStyle=col;g.beginPath();g.moveTo(0,-len/2);g.bezierCurveTo(len*.28,-len*.25,len*.22,len*.25,0,len/2);g.bezierCurveTo(-len*.18,len*.2,-len*.24,-len*.2,0,-len/2);g.fill();
  g.strokeStyle="rgba(255,255,255,.18)";g.lineWidth=1;g.beginPath();g.moveTo(0,-len/2);g.lineTo(0,len/2+3);g.stroke();g.restore();}
const rgbA=a=>`rgba(${ME().col.rgb},${a})`;

/* ---------- generated backgrounds for the profile and card ---------- */
VB.genBgExtra=VB.genBgExtra||{};
const floorLines=(g,W,H,style,lw,cx)=>{const P=(x,z)=>{const d=1+z*.9;return [W*(cx||.5)+x*W*.55/d,H*.6+z*H*.38/d*1.4];};g.strokeStyle=style;g.lineWidth=lw;
  const L=(a,b)=>{const p=P(...a),q=P(...b);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();};L([-1,0],[1,0]);L([-1,0],[-1.25,1.2]);L([1,0],[1.25,1.2]);L([-1.08,.4],[1.08,.4]);};
VB.genBgExtra.crowgym=function(g,W,H){const A=on()?ME().col.a:"#ff7a1a",bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#050406");bg.addColorStop(.6,"#141013");bg.addColorStop(1,"#2a160b");g.fillStyle=bg;g.fillRect(0,0,W,H);
  [.2,.5,.8].forEach(x=>{const r=g.createRadialGradient(W*x,0,0,W*x,0,W*.35);r.addColorStop(0,"rgba(255,150,60,.35)");r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,W,H);});
  const bx=W*.36,bw=W*.28;g.fillStyle="#0c0b0e";g.fillRect(bx,H*.08,bw,H*.3);g.strokeStyle=A;g.lineWidth=6;g.strokeRect(bx+8,H*.08+8,bw-16,H*.3-16);
  g.fillStyle=A;g.font="italic 800 110px 'Barlow Condensed','Arial Narrow',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("FLY",bx+bw/2,H*.235);
  g.strokeStyle="rgba(255,255,255,.25)";g.lineWidth=2;g.beginPath();g.moveTo(bx,H*.08);g.lineTo(bx-30,0);g.moveTo(bx+bw,H*.08);g.lineTo(bx+bw+30,0);g.stroke();
  floorLines(g,W,H,"rgba(255,122,26,.85)",5);
  for(let i=0;i<9;i++)crowAt(g,W*(.05+Math.random()*.9),H*(.08+Math.random()*.45),.6+Math.random()*1.3,Math.random()<.5,`rgba(${Math.random()<.25?"255,122,26":"0,0,0"},${.55+Math.random()*.4})`);
  for(let i=0;i<26;i++)featherAt(g,Math.random()*W,Math.random()*H,10+Math.random()*22,Math.random()*6,Math.random()<.3?"rgba(255,122,26,.75)":"rgba(0,0,0,.8)");};
VB.genBgExtra.orange=function(g,W,H){g.fillStyle="#b6531a";g.fillRect(0,0,W,H);for(let y=0;y<H;y+=22){let x=-Math.random()*140;while(x<W){const L=110+Math.random()*170,v=Math.random()*26-13;g.fillStyle=`rgb(${230+v},${118+v*.7},${40+v*.4})`;g.fillRect(x,y,L-2,21);x+=L;}}
  g.fillStyle="rgba(20,10,4,.35)";g.fillRect(0,0,W,H);floorLines(g,W,H,"#121115",9,.55);
  for(let i=0;i<5;i++)crowAt(g,W*(.08+i*.2),H*(.12+(i%2)*.1),.9,i%2===0,"rgba(18,17,21,.75)");};
VB.genBgExtra.sky=function(g,W,H){const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#03040b");bg.addColorStop(.55,"#101633");bg.addColorStop(1,"#2a2006");g.fillStyle=bg;g.fillRect(0,0,W,H);
  for(let i=0;i<220;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.8})`;const r=Math.random()*1.6;g.beginPath();g.arc(Math.random()*W,Math.random()*H*.6,r,0,7);g.fill();}
  /* lightning */
  const bolt=(x,y,len,w)=>{g.save();g.strokeStyle="#fff3c4";g.shadowColor="#ffc21a";g.shadowBlur=24;g.lineWidth=w;g.beginPath();g.moveTo(x,y);let cx=x,cy=y;while(cy<y+len){cx+=(Math.random()-.5)*60;cy+=20+Math.random()*30;g.lineTo(cx,cy);}g.stroke();g.restore();};
  bolt(W*.18,0,H*.45,4);bolt(W*.83,0,H*.38,3);
  const moon=g.createRadialGradient(W*.66,H*.2,0,W*.66,H*.2,90);moon.addColorStop(0,"rgba(255,232,170,.95)");moon.addColorStop(.35,"rgba(255,194,26,.4)");moon.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=moon;g.fillRect(0,0,W,H);
  floorLines(g,W,H,"rgba(255,194,26,.85)",5);for(let i=0;i<4;i++)crowAt(g,W*(.1+i*.24),H*(.1+(i%2)*.12),.8,i%2===1,"rgba(0,0,0,.7)");};

/* ---------- site skin: colour variables set from the current person ---------- */
function applySkin(){const want=on()&&G().skin!==false,R=document.documentElement;R.dataset.skin=want?"crow":"";
  if(on()){const c=ME().col;ORANGE=c.a;[["--cra",c.a],["--crb",c.b],["--cra-rgb",c.rgb],["--crd",c.dark],["--crbtn",c.btn],["--crbtn-ink",c.btnInk],["--crbg",c.bg]].forEach(([k,v])=>R.style.setProperty(k,v));R.dataset.crow=who();}
  const m=$('meta[name="theme-color"]');if(m)m.setAttribute("content",want?"#0b0a0c":"#0b0a0f");navLink();}
function navLink(){const has=on();[["#nav","navNest"],["#menu nav","menuNest"]].forEach(([sel,id])=>{const host=$(sel);if(!host)return;let a=$("#"+id);
  if(has&&!a){a=document.createElement("a");a.id=id;a.href="#nest";a.dataset.v="nest";a.className="nestlink";a.innerHTML=`${crowSvg("nicon")}<span>Crow's Nest</span>`;host.appendChild(a);}
  else if(!has&&a)a.remove();});}

/* ---------- profile: the secret code card ---------- */
const WRONG=["Blocked! That's not the code.","Out of bounds. Try again.","Net touch! Not quite.","Four hits! Nope.","Shanked it. Try once more.","The ref says no."];
let wrongN=0;
const codeForm=(ph)=>`<form class="row ccform" id="ccForm" autocomplete="off"><input class="in" id="ccIn" type="text" autocapitalize="off" spellcheck="false" placeholder="${ph}" aria-label="Secret code" maxlength="40"><button class="btn primary" type="submit">Unlock</button></form><p class="small ccmsg" id="ccMsg" role="status" aria-live="polite"></p>`;
function renderCodeCard(){const host=$("#crowCode");if(!host||!VB.state.profile)return;
  if(!on()){host.className="card crowcode";host.innerHTML=`<div class="kicker">Secret code</div><p class="small muted">Got a code from someone? Type it here to unlock something.</p>${codeForm("Enter a code")}`;return;}
  const c=C(),p=ME();host.className="card crowcode on";host.innerHTML=`<div class="cchead">${crowSvg("ccbird")}<div><div class="kicker">${esc(p.edition)} · ${esc(p.name)}</div><b class="cctitle">${esc(titleText()||p.tag)}</b></div></div>
    <p class="small">${c.feathers} feathers · ${c.badges.length}/${BADGES.length} badges · season ${c.road.length}/${ROAD.length}</p>
    <div class="row"><a class="btn primary" href="#nest">Enter the Crow's Nest</a><button class="btn sm" type="button" data-crow-skin>${G().skin!==false?"Use the original colours":"Use the secret colours"}</button></div>
    <details class="ccmore"><summary class="small">Have a different code?</summary>${codeForm("Another code")}</details>`;}
document.addEventListener("submit",e=>{if(e.target.id!=="ccForm")return;e.preventDefault();const inp=$("#ccIn"),msg=$("#ccMsg"),v=norm(inp.value);if(!v)return;
  const h=hash(v),id=Object.keys(PEOPLE).find(k=>PEOPLE[k].code===h);if(id){unlock(id);return;}
  msg.textContent=WRONG[wrongN++%WRONG.length];inp.value="";const card=$("#crowCode");card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");});
document.addEventListener("click",e=>{if(e.target.closest("[data-crow-skin]")){const g=G();g.skin=g.skin===false;save();applySkin();renderCodeCard();if(isNest())render();}});

function unlock(id){const g=G();g.on=true;g.who=id;g.skin=true;const c=C(),p=ME(),first=!c.unlockedAt;c.unlockedAt=c.unlockedAt||Date.now();if(!c.title)c.title=p.start.title;
  /* dress the player in this person's kit and equip their ball and effect */
  const pr=VB.state.profile;if(pr)pr.look=Object.assign({},pr.look||{},{kit:p.start.kit});VB.state.locker=Object.assign({},VB.state.locker||{},{ball:p.start.ball,fx:p.start.fx});
  save();checkBadges(true);applySkin();if(first)intro();else location.hash="#nest";}

/* ---------- the unlock moment ---------- */
function intro(){let ov=$("#crowIntro");if(ov)ov.remove();const p=ME();ov=document.createElement("div");ov.id="crowIntro";ov.className="crowintro";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label","Secret unlocked");
  const parts=p.name.toUpperCase().split(/\s+/);
  ov.innerHTML=`<canvas class="ci-fx" aria-hidden="true"></canvas><div class="ci-slash s1"></div><div class="ci-slash s2"></div><div class="ci-slash s3"></div>
    <div class="ci-body"><div class="ci-k">Secret code accepted · ${esc(p.edition)}</div>${crowSvg("ci-crow")}<div class="ci-l1">Welcome to</div><div class="ci-l2">KARASUNO</div>
     <div class="ci-name">${parts.map(w=>`<span>${esc(w)}</span>`).join("")}</div>
     <p class="ci-sub">Secret colours · your own kit · new balls and effects · titles · 3 games · a season to win</p>
     <button class="btn ci-go" type="button" id="ciGo">Enter the Crow's Nest</button></div>`;
  document.body.appendChild(ov);document.body.classList.add("noscroll");sfx("thunder");setTimeout(()=>sfx("unlock"),900);
  const cv=$(".ci-fx",ov),g=cv.getContext("2d"),fs=[];let raf=0,last=performance.now();
  cv.width=innerWidth*Math.min(2,devicePixelRatio||1);cv.height=innerHeight*Math.min(2,devicePixelRatio||1);
  for(let i=0;i<70;i++)fs.push({x:Math.random(),y:-Math.random()*1.2,v:.08+Math.random()*.16,r:Math.random()*6,s:.6+Math.random()*1.4,o:Math.random()<.3,w:Math.random()*6});
  const tick=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;g.clearRect(0,0,cv.width,cv.height);const k=cv.width/1000;
    fs.forEach(f=>{f.y+=f.v*dt;f.r+=dt*(1+f.s);f.w+=dt*2;if(f.y>1.1){f.y=-.1;f.x=Math.random();}featherAt(g,(f.x+Math.sin(f.w)*.02)*cv.width,f.y*cv.height,26*f.s*k*1.4,Math.sin(f.r)*.9,f.o?rgbA(.9):"rgba(40,36,44,.9)");});
    if(!reduced())raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
  const close=()=>{cancelAnimationFrame(raf);skipBoot=true;ov.classList.add("out");document.body.classList.remove("noscroll");setTimeout(()=>ov.remove(),400);location.hash="#nest";};
  $("#ciGo").addEventListener("click",close);setTimeout(()=>{const b=$("#ciGo");b&&b.focus();},1600);
  ov.addEventListener("keydown",e=>{if(e.key==="Escape")close();});}

/* ---------- the welcome-back boot screen, every time the Nest opens ---------- */
function greeting(){const h=new Date().getHours();return h<5?"Late night session":h<12?"Good morning":h<18?"Good afternoon":"Good evening";}
function speak(text){if(G().mute||!("speechSynthesis" in window))return;try{const u=new SpeechSynthesisUtterance(text),vs=speechSynthesis.getVoices();
  const v=vs.find(x=>/en-GB/i.test(x.lang)&&/daniel|arthur|george|male/i.test(x.name))||vs.find(x=>/en-GB/i.test(x.lang))||vs.find(x=>/^en/i.test(x.lang));if(v)u.voice=v;u.rate=.98;u.pitch=.9;u.volume=.9;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
function bootScreen(){const old=$("#crowBoot");if(old)old.remove();const c=C(),p=ME(),pr=VB.state.profile||{},first=p.name.split(/\s+/)[0],done=(c.camp[today()]||[]).length;
  const now=new Date(),tm=now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),dt=now.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"});
  const nm=ROAD[c.road.length];
  const lines=[["Identity",p.name+" · confirmed"],["Edition",p.edition],["Position",(VB.POS[pr.pos]||VB.POS.any).label+(pr.number!=null?" · No. "+pr.number:"")],...p.boot,
    ["Feathers",String(c.feathers)],["Today's camp",`${done}/3 jobs`],["Next match",nm?nm.opp:"season won. Legend."]];
  const ov=document.createElement("div");ov.id="crowBoot";ov.className="cboot";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label",`Hello ${first}`);
  const ring=(r,w,dash,cls,col)=>`<circle class="${cls}" cx="200" cy="200" r="${r}" fill="none" stroke="${col||"var(--cra)"}" stroke-width="${w}" stroke-dasharray="${dash}"/>`;
  ov.innerHTML=`<div class="cb-grid"></div><div class="cb-scan"></div>
    <div class="cb-corner tl"><b>CROW SYSTEM</b><span>secure link · ${esc(p.edition)}</span></div><div class="cb-corner tr"><b>${esc(tm)}</b><span>${esc(dt)}</span></div>
    <div class="cb-corner bl"><span>Press any key or tap to skip</span></div><div class="cb-corner br"><span>Karasuno · Crow's Nest</span></div>
    <div class="cb-stage"><div class="cb-core"><svg class="cb-hud" viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="cbg" x1="0" x2="1"><stop offset="0" stop-color="${p.col.a}" stop-opacity="0"/><stop offset="1" stop-color="${p.col.a}" stop-opacity=".4"/></linearGradient></defs>
      <g class="cb-sweep"><path d="M200 200 L200 14 A186 186 0 0 1 331.5 68.5 Z" fill="url(#cbg)"/></g>
      ${ring(186,1,"2 6","r1",rgbA(.55))}${ring(170,6,"60 14 8 14","r2")}${ring(150,1.5,"300 40 20 40","r3","rgba(244,239,230,.6)")}
      ${ring(132,14,"4 3","r4",rgbA(.35))}${ring(112,2,"120 60","r5")}<circle class="r6" cx="200" cy="200" r="96" fill="${rgbA(.07)}" stroke="${rgbA(.8)}" stroke-width="1"/>
      </svg>${crowSvg("cb-crow")}<div class="cb-pct" id="cbPct">0%</div></div>
      <div class="cb-log" id="cbLog" aria-hidden="true"></div></div>
    <div class="cb-hello"><div class="cb-greet" id="cbGreet"></div><div class="cb-sub" id="cbSub"></div></div>`;
  document.body.appendChild(ov);document.body.classList.add("noscroll");
  const fast=reduced(),timers=[];const later=(f,ms)=>timers.push(setTimeout(f,fast?Math.min(ms,60):ms));
  let pct=0;const pt=setInterval(()=>{pct=Math.min(100,pct+(fast?100:2.4+Math.random()*3));const el=$("#cbPct");if(el)el.textContent=Math.round(pct)+"%";if(pct>=100)clearInterval(pt);},45);
  const log=$("#cbLog");lines.forEach(([k,v],i)=>later(()=>{const d=document.createElement("div");d.className="cbl";d.innerHTML=`<span>${esc(k)}</span><i></i><b>${esc(v)}</b>`;log.appendChild(d);sfx("tick");},400+i*190));
  const type=(el,txt,speed,done)=>{let i=0;const f=()=>{el.textContent=txt.slice(0,++i);if(i<txt.length)timers.push(setTimeout(f,fast?0:speed));else done&&done();};f();};
  later(()=>{ov.classList.add("hello");sfx("unlock");speak(`${greeting()}, ${first}. ${p.hello}`);
    type($("#cbGreet"),`Hello, ${first}.`,75,()=>type($("#cbSub"),`${greeting()}. ${p.hello}`,20));},2500);
  let closed=false;const onKey=e=>{e.preventDefault();close();};
  const close=()=>{if(closed)return;closed=true;timers.forEach(clearTimeout);clearInterval(pt);ov.classList.add("out");document.body.classList.remove("noscroll");
    document.removeEventListener("keydown",onKey,true);setTimeout(()=>ov.remove(),700);};
  later(()=>document.addEventListener("keydown",onKey,true),250);ov.addEventListener("click",close);
  later(close,6800);}

function badgeToast(b){const t=document.createElement("div");t.className="crowtoast";t.setAttribute("role","status");
  t.innerHTML=`${crowSvg("ctb")}<div><small>${/^Win vs/.test(b.name)?"Match won":"Badge unlocked"} · +${b.f} feathers</small><b>${esc(b.name)}</b>${b.rr&&b.rr.length?`<span>${b.rr.map(([k,id])=>esc(rewardName(k,id))).join(" · ")}</span>`:""}</div>`;
  document.body.appendChild(t);setTimeout(()=>t.classList.add("in"),20);setTimeout(()=>{t.classList.remove("in");setTimeout(()=>t.remove(),500);},4200);}
function rewardName(k,id){return k==="title"?`Title: ${TITLES[id]}`:k==="bg"?`Background: ${BGS[id]}`:k==="ball"?`${(VB.BALLS[id]||{}).name||id} ball`:`${(VB.FX[id]||{}).name||id} effect`;}

/* ---------- Rolling Thunder ---------- */
function rollingThunder(){const c=C();c.thunder++;const d=today();if(c.rtDay!==d){c.rtDay=d;c.rtN=0;}if(c.rtN<10){c.rtN++;award(1);}save();
  sfx("thunder");const ov=document.createElement("div");ov.className="rt";ov.setAttribute("aria-hidden","true");const fear=who()==="theodore";
  ov.innerHTML=`<svg class="rt-bolt" viewBox="0 0 400 120"><path d="M0 70 L120 40 L105 62 L260 22 L240 52 L400 10 L250 78 L268 56 L110 98 L128 74 Z"/></svg><div class="rt-t"><span>${fear?"FEARLESS":"ROLLING"}</span><span>${fear?"SPIKE!!":"THUNDER!!"}</span></div>`;
  document.body.appendChild(ov);if(!reduced()){document.body.classList.remove("rtshake");void document.body.offsetWidth;document.body.classList.add("rtshake");}
  setTimeout(()=>{ov.remove();document.body.classList.remove("rtshake");},1500);checkBadges();refreshStats();}

const dayIdx=(n,salt)=>parseInt(hash(today()+(salt||"")),36)%n;

/* ---------- training camp: shared drills plus each person's focus ---------- */
const CAMP=[
  {id:"wall50",f:"def",t:"Wall passing",d:"50 forearm passes against a wall. If it drops, start your count again.",x:"Flat platform, feet moving"},
  {id:"pancake",f:"def",t:"Pancake reaches",d:"On a mat or grass: 10 slow lunges, sliding one flat hand along the floor. 5 each side.",x:"Palm flat, eyes up"},
  {id:"shuffle",f:"def",t:"Shuffle and freeze",d:"3 rounds of 30 seconds: shuffle side to side in your ready stance and freeze low every 5 seconds.",x:"Low hips, feet never cross"},
  {id:"tossdig",f:"def",t:"Toss and dig",d:"With a partner: 25 tossed balls, dig each one high to the middle of the court.",x:"Angle the platform to the target"},
  {id:"sprawl",f:"def",t:"Sprawl to feet",d:"On a mat or grass: 8 slow sprawls. Step out, lower onto your hands and chest, push back up.",x:"Hands first, chin up"},
  {id:"eyes",f:"def",t:"Read the hitter",d:"Watch 5 minutes of a match and call where each attack goes before it lands.",x:"Watch the shoulder, then the hand"},
  {id:"reaction",f:"def",t:"Reaction drops",d:"A partner holds a ball at shoulder height and lets go. Catch it before it bounces twice. 15 tries.",x:"Fast first step"},
  {id:"approach",f:"att",t:"Approach footwork",d:"10 slow three-step approaches (left, right-left for right-handers), then 10 at full speed with a jump.",x:"Last two steps quick"},
  {id:"armswing",f:"att",t:"Arm swing",d:"20 slow-motion arm swings in front of a mirror, then 20 at speed. Elbow high, reach up.",x:"Bow and arrow, then snap"},
  {id:"wallspike",f:"att",t:"Wall spikes",d:"Stand 3 metres from a wall. Toss to yourself and spike down so it bounces up off the wall. 30 swings.",x:"Wrist snap over the top"},
  {id:"jumprope",f:"att",t:"Jump rope",d:"5 rounds of 45 seconds skipping rope, 15 seconds rest.",x:"On the balls of your feet"},
  {id:"softland",f:"att",t:"Soft landings",d:"10 jumps from standing: stick each landing quietly on two feet, knees over toes, hold for 2 seconds.",x:"Quiet feet = safe knees"},
  {id:"tossup",f:"att",t:"Serve toss",d:"20 serve tosses without hitting. Let the ball land: it should hit your front foot every time.",x:"Same toss, same spot"},
  {id:"juggle",f:"all",t:"Ball control",d:"Forearm passes to yourself only. Beat your record of touches in a row.",x:"Small, quiet touches"},
  {id:"plank",f:"all",t:"Core",d:"3 front planks of 30 seconds, then 2 side planks of 20 seconds each side.",x:"Straight line, breathe"},
  {id:"hops",f:"all",t:"Quick feet",d:"3 rounds of 20 seconds of fast line hops: forwards and back, then side to side.",x:"Light and quick"},
  {id:"overhead",f:"all",t:"Overhead pass",d:"30 overhead passes to yourself, then 20 against a wall.",x:"Diamond hands, soft fingers"},
  {id:"serve",f:"all",t:"Serve targets",d:"Pick a zone and serve 15 balls at it. Count how many land there.",x:"Same toss every time"},
  {id:"stretch",f:"all",t:"Recover like a pro",d:"10 minutes of easy stretching: hips, hamstrings, shoulders and wrists.",x:"No bouncing"},
  {id:"cheer",f:"all",t:"Team energy",d:"Teach someone one volleyball skill, or cheer a teammate on today.",x:"Good teams talk"},
  {id:"film",f:"all",t:"Film yourself",d:"Record one rep of your best skill on the Film page and look at it in slow motion.",x:"Side view, whole body in frame"}
];
function campToday(){const f=ME().focus,mine=CAMP.filter(q=>q.f===f),all=CAMP.filter(q=>q.f==="all"),s=parseInt(hash("camp"+today()+who()),36);
  const pick=(arr,k)=>arr[(s+k*7)%arr.length];const a=pick(mine,0),b=pick(mine,3)===a?mine[(mine.indexOf(a)+1)%mine.length]:pick(mine,3),c=pick(all,1);return [a,b,c];}

/* ---------- quiz: 8 per round, about half from the person's focus ---------- */
const QUIZ=[
  {f:"all",q:"How many players does each team have on the court in indoor volleyball?",a:["6","5","7","4"],e:"Six a side: three in the front row and three in the back row."},
  {f:"def",q:"How is the libero's jersey different?",a:["It is a different colour from the teammates'","It has no number","It is always white","It has long sleeves"],e:"The libero wears a contrasting colour so the referees can spot them."},
  {f:"def",q:"Can the libero block?",a:["No, never, not even an attempt","Yes, in the front row","Only in the fifth set","Only on a tip"],e:"Liberos can't block or try to block. Their job is defence and passing."},
  {f:"def",q:"Where can the libero play?",a:["Only in the back row","Anywhere","Only in zone 3","Only when serving"],e:"The libero replaces a back-row player and leaves before rotating to the front."},
  {f:"all",q:"How many touches can a team use to get the ball over? (A block touch doesn't count.)",a:["3","2","4","As many as it needs"],e:"Three contacts. A touch on the block is free."},
  {f:"all",q:"In a five-set match, the fifth set is played to…",a:["15 points, win by 2","25 points, win by 2","21 points","10 points"],e:"Sets 1 to 4 go to 25, the deciding set to 15. You always need to win by 2."},
  {f:"def",q:"What is a pancake?",a:["A dig where the ball bounces off a flat hand on the floor","A very high set","A serve that floats","A block with both hands"],e:"The hand slides flat on the floor and the ball pops up off the back of it."},
  {f:"def",q:"Do libero replacements count as substitutions?",a:["No","Yes, each one","Only the first","Only in the fifth set"],e:"Libero swaps are unlimited and don't use up the team's substitutions."},
  {f:"def",q:"A libero sets with their fingers from in front of the attack line. What can't a teammate do?",a:["Attack that ball while it is completely above the net","Pass it","Set it again","Touch it at all"],e:"The hitter can still attack it, but only if some of the ball is below the top of the net at contact."},
  {f:"all",q:"Which zone number is the server's position?",a:["1","6","4","2"],e:"Zone 1 is right back. Rotations move clockwise into it."},
  {f:"att",q:"What is a quick (first-tempo) attack?",a:["The hitter jumps before or as the setter sets, so the set is fast and low","A tip over the block","A serve that's hit hard","A back-row attack"],e:"Speed beats the block: the hitter is already in the air when the set arrives."},
  {f:"all",q:"With rally scoring, who scores the point?",a:["The team that wins the rally","Only the serving team","Only the receiving team","Nobody until the side-out"],e:"Every rally is a point, no matter who served."},
  {f:"def",q:"What do you call playing a hard-driven attack off the floor?",a:["A dig","A set","A block","A free ball"],e:"Diggers turn the opponent's best shot into your next attack."},
  {f:"def",q:"What does a good libero do with their voice?",a:["Call the serve and tell teammates who has it","Stay quiet so the setter can think","Only talk at time-outs","Argue with the ref"],e:"Talking is a skill: 'Mine!', 'Out!', 'Short!' and who's taking the ball."},
  {f:"def",q:"On the team's first contact, like a serve receive, what's allowed?",a:["The ball touching a player twice in a row in one action","Catching it briefly","Three touches by the same player","Kicking is not allowed"],e:"On the first contact, consecutive touches during one action are allowed. Feet are legal too."},
  {f:"att",q:"A back-row player wants to attack above the net. What must they do?",a:["Take off from behind the attack line","Wait for the fifth set","Use one hand only","Ask the referee"],e:"Back-row attackers jump from behind the 3-metre line. They can land in front of it."},
  {f:"att",q:"What is a 'line shot'?",a:["An attack hit straight down the sideline","A hit that touches the line","A serve to zone 1","A set along the net"],e:"Line goes straight, cross-court goes diagonal. Good hitters can do both."},
  {f:"att",q:"What does 'tooling the block' mean?",a:["Hitting the ball off the blockers' hands so it goes out","Tipping over the block","Blocking with one hand","Setting over the block"],e:"Aim for the outside hand of the block and wipe it off: the point is yours."},
  {f:"att",q:"What is a 'pipe'?",a:["A back-row attack from the middle of the court","A very low quick set","A serve that hits the net","A double block"],e:"The pipe comes from zone 6, behind the attack line."},
  {f:"att",q:"How high is the net for men's indoor volleyball?",a:["2.43 m","2.24 m","2.13 m","2.55 m"],e:"Men's nets are 2.43 m; women's are 2.24 m."},
  {f:"att",q:"Can you block or attack the other team's serve?",a:["No","Yes, if it's above the net","Only the libero can","Only in the fifth set"],e:"Blocking or attacking a serve completely above the net is a fault."},
  {f:"att",q:"When is touching the net a fault?",a:["When you touch it between the antennae while playing the ball","Any time, even with your hair","Only with your hands","Never"],e:"Contact between the antennae during the action of playing the ball is a fault."},
  {f:"all",q:"How long does the server have to serve after the referee's whistle?",a:["8 seconds","3 seconds","15 seconds","As long as they like"],e:"Eight seconds. A good routine fits easily inside it."},
  {f:"all",q:"What is an ace?",a:["A serve that wins the point directly","A perfect pass","A block that scores","The best player on the team"],e:"The receiving team can't keep it in play: point to the server."},
  {f:"att",q:"Under the net, can your foot cross the centre line?",a:["Yes, if part of that foot stays on or above the centre line","Never","Yes, as far as you like","Only after the rally"],e:"Your foot can go over, as long as part of it is still touching or above the line."},
  {f:"att",q:"What is a 'slide' attack?",a:["A one-foot take-off hit, usually by the middle behind the setter","A dive to save the ball","A set that rolls along the net","A serve that skids"],e:"Like a layup: run along the net, take off from one foot, swing."}
];

/* ---------- the Nest page ---------- */
const TABS=[["dig","Dig Defence"],["quick","Freak Quick"],["serve","Jump Serve"],["iq","Volleyball IQ"],["camp","Training camp"],["season","Season"],["badges","Badges and shop"],["style","Style"]];
let tab=null,loopOn=false,game=null,bgFx=null,quiz=null,skipBoot=false;
const isNest=()=>{const v=$("#v-nest");return v&&!v.hidden;};
function render(sub){const host=$("#v-nest");if(!host)return;if(!on()){location.hash="#profile";return;}
  const p=ME();if(sub&&TABS.some(t=>t[0]===sub))tab=sub;if(!tab)tab=p.focus==="att"?"quick":"dig";const c=C(),pr=VB.state.profile||{},parts=p.name.toUpperCase().split(/\s+/);
  stopGame();
  host.innerHTML=`<div class="nhero"><canvas class="nfx" aria-hidden="true"></canvas><div class="nbig" aria-hidden="true">${esc(p.big)}</div>
    <div class="wrap nhwrap"><div class="nkick">${crowSvg("nk")}<span>${esc(p.edition)} · Crow's Nest</span></div>
      <h1 class="nname">${parts.map(w=>`<span>${esc(w)}</span>`).join("")}</h1>
      <div class="ntitle"><b id="nTitle">${esc(titleText()||p.tag)}</b><span>${esc((VB.POS[pr.pos]||VB.POS.any).label)}${pr.number!=null?" · No. "+esc(pr.number):""}</span></div>
      <p class="nline">“${esc(p.lines[dayIdx(p.lines.length,who())])}”</p>
      <div class="nstats" id="nStats"></div>
      <div class="row nbtns"><button class="btn rtbtn" type="button" id="rtBtn"><span>${who()==="theodore"?"Fearless spike!":"Rolling Thunder!"}</span></button><button class="btn sm ghost" type="button" id="nMute" aria-pressed="${!!G().mute}">${G().mute?"Sound off":"Sound on"}</button><a class="btn sm ghost" href="#profile">Back to profile</a></div></div></div>
    <div class="wrap nwrap"><div class="nnote">${crowSvg("nnb")}<div><div class="kicker">A note for you</div><p>${esc(p.note)}</p></div></div>
      <div class="ntabs" role="tablist" aria-label="Crow's Nest">${TABS.map(([k,l])=>`<button type="button" role="tab" data-nt="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>
      <div id="nPanel" role="tabpanel"></div></div>`;
  refreshStats();panel();startLoop();if(!skipBoot)bootScreen();skipBoot=false;}
function refreshStats(){const el=$("#nStats");if(!el)return;const c=C(),nm=ROAD[c.road.length];
  el.innerHTML=`<div><b>${c.feathers}</b><span>Feathers</span></div><div><b>${c.badges.length}/${BADGES.length}</b><span>Badges</span></div><div><b>${c.road.length}/${ROAD.length}</b><span>Season</span></div><div><b>${Math.round(skills(c).reduce((a,b)=>a+b,0)/SKILLS.length)}</b><span>Overall</span></div><div><b>${campDays(c)}</b><span>Camp days</span></div>${nm?`<div class="nnext"><b>vs ${esc(nm.opp)}</b><span>Next match · ${esc(nm.need)}</span></div>`:""}`;
  const t=$("#nTitle");if(t)t.textContent=titleText()||ME().tag;renderCodeCard();}
function gameHead(k,title,best,desc){return `<div class="ngh"><div><div class="kicker">Mini-game</div><h3>${title}</h3><p class="small muted">${desc}</p></div><div class="ngbest">Best <b>${best}</b></div></div>`;}
function radar(c){const v=skills(c),n=v.length,R=110,cx=150,cy=140,pt=(i,r)=>[cx+Math.sin(i/n*Math.PI*2)*r,cy-Math.cos(i/n*Math.PI*2)*r];
  const ring=k=>v.map((_,i)=>pt(i,R*k).join(",")).join(" ");
  return `<svg class="radar" viewBox="0 0 300 290" role="img" aria-label="Skill chart: ${SKILLS.map(([l],i)=>l+" "+v[i]).join(", ")}">
    ${[.25,.5,.75,1].map(k=>`<polygon points="${ring(k)}" fill="none" stroke="rgba(255,255,255,.12)"/>`).join("")}
    ${v.map((_,i)=>{const [x,y]=pt(i,R);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.1)"/>`;}).join("")}
    <polygon points="${v.map((s,i)=>pt(i,R*Math.max(.04,s/100)).join(",")).join(" ")}" fill="${rgbA(.35)}" stroke="var(--cra)" stroke-width="2.5"/>
    ${SKILLS.map(([l],i)=>{const [x,y]=pt(i,R+22);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${esc(l)} <tspan>${v[i]}</tspan></text>`;}).join("")}</svg>`;}
function panel(){const P=$("#nPanel");if(!P)return;stopGame();$$("[data-nt]").forEach(b=>b.setAttribute("aria-selected",b.dataset.nt===tab));const c=C(),p=ME();
  if(tab==="dig"){P.innerHTML=`<div class="ngame">${gameHead("dig","Dig Defence",c.best.dig,"Spikes are coming. Tap the ring on the floor before the ball lands. Wait until the last moment for a <b>PERFECT</b> dig. Tips land short and slow. Every 10 in a row is a Rolling Thunder bonus. On a keyboard, press the zone number (1 to 6).")}
      <div class="gstage"><canvas id="digCv" width="900" height="560" aria-label="Dig Defence game. Tap the rings, or press zone numbers 1 to 6."></canvas><div class="gover" id="digOver"><b>Dig Defence</b><span>3 lives. Don't let it touch the floor.</span><button class="btn primary" type="button" id="digGo">Start</button></div></div></div>`;
    game=digGame($("#digCv"));}
  else if(tab==="quick"){P.innerHTML=`<div class="ngame">${gameHead("quick","Freak Quick",c.best.quick,"The setter sends it fast. Tap (or press space) right as the ball reaches your hand to hit a kill. The window gets smaller as your streak grows. Three misses and it's over.")}
      <label class="small eyes"><input type="checkbox" id="qkEyes"> Eyes closed: the ball disappears during the set. Trust your setter (double feathers).</label>
      <div class="gstage"><canvas id="qkCv" width="900" height="420" aria-label="Freak Quick game. Tap or press space to swing."></canvas><div class="gover" id="qkOver"><b>Freak Quick</b><span>Time your swing to the set.</span><button class="btn primary" type="button" id="qkGo">Start</button></div></div></div>`;
    game=quickGame($("#qkCv"));}
  else if(tab==="serve"){P.innerHTML=`<div class="ngame">${gameHead("serve","Jump Serve",c.best.serve,"A target zone lights up. Tap once to lock your <b>power</b> (inside the band, or it hits the net or flies long; less power lands shorter), then tap again to lock your <b>aim</b>. Hitting the target is an ace: 3 points. In the court: 1 point. Out or net: you lose a life. Space works too.")}
      <div class="gstage"><canvas id="svCv" width="900" height="560" aria-label="Jump Serve game. Tap or press space twice: power, then aim."></canvas><div class="gover" id="svOver"><b>Jump Serve</b><span>Find the zone. Ace it.</span><button class="btn primary" type="button" id="svGo">Start</button></div></div></div>`;
    game=serveGame($("#svCv"));}
  else if(tab==="iq"){quizStart(P);}
  else if(tab==="camp"){const qs=campToday(),done=c.camp[today()]||[],days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=VB.iso?VB.iso(d):d.toISOString().slice(0,10);days.push([k,(c.camp[k]||[]).length]);}
    P.innerHTML=`<div class="ncamp"><div class="ngh"><div><div class="kicker">Today's camp · ${p.focus==="att"?"attack":"defence"} focus</div><h3>Three jobs for ${p.focus==="att"?"a fearless hitter":"a guardian"}</h3><p class="small muted">New jobs every day: two for your position, one for everyone. Tick each one when you've done it: 15 feathers each, and a 20 feather bonus for all three. Dives and sprawls go on a mat or grass, never a hard floor.</p></div></div>
      <div class="camprow">${qs.map(q=>{const d=done.includes(q.id);return `<button type="button" class="cq ${d?"done":""}" data-cq="${q.id}" aria-pressed="${d}"><span class="cqk">${d?"Done":"To do"}</span><b>${esc(q.t)}</b><span>${esc(q.d)}</span><small>${esc(q.x)}</small></button>`;}).join("")}</div>
      <div class="cweek"><span class="stat">Last 14 days</span><div>${days.map(([k,n])=>`<i class="${n>=3?"full":n?"part":""}" title="${k}: ${n}/3"><span>${["S","M","T","W","T","F","S"][new Date(k+"T12:00").getDay()]}</span></i>`).join("")}</div></div></div>`;}
  else if(tab==="season"){const wk=weekKey(),g=c.goal.week===wk?c.goal:{};
    P.innerHTML=`<div class="nseason"><div class="stack" style="gap:16px"><div class="card"><div class="kicker">Skill chart</div><p class="small muted">Built from your best scores: Receive (Dig Defence), Attack (Freak Quick), Serve (Jump Serve), IQ (the quiz), Grit (camp days) and Energy (games played and big calls).</p>${radar(c)}</div>
      <div class="card"><div class="kicker">This week's goal</div><p class="small muted">Write one thing you'll do this week. Tick it when it's done: 30 feathers.</p>
        ${g.done?`<p class="goaldone">✓ ${esc(g.text)}</p>`:`<form class="row" id="nGoalForm"><input class="in" id="nGoalIn" maxlength="120" placeholder="e.g. 100 wall passes in a row" value="${esc(g.text||"")}" aria-label="This week's goal" style="flex:1;min-width:0"><button class="btn sm" type="submit">Save</button></form>${g.text?`<div class="row"><button class="btn primary sm" type="button" id="nGoalDone">I did it</button></div>`:""}`}</div></div>
      <div class="road"><div class="kicker">Season road</div><h3>${c.road.length>=ROAD.length?"Champions!":"Win your way to Nationals"}</h3><ol>${ROAD.map((m,i)=>{const st=i<c.road.length?"won":i===c.road.length?"next":"later";
        return `<li class="rm ${st}"><span class="rdot">${st==="won"?"✓":i+1}</span><div><small>${esc(m.kind)}</small><b>vs ${esc(m.opp)}</b><span>${st==="won"?"Won · +"+m.f+" feathers":esc(m.need)}</span></div></li>`;}).join("")}</ol></div></div>`;}
  else if(tab==="badges"){P.innerHTML=`<div class="nbadges">${BADGES.map(b=>{const got=c.badges.includes(b.id),h=Math.min(b.have(c),b.n),rr=b.r(p),rw=rr.length?rr.map(([k,id])=>rewardName(k,id)).join(" · "):"+"+b.f+" feathers";return `<div class="nb ${got?"got":""}">${crowSvg("nbc")}<b>${esc(b.name)}</b><span>${esc(b.desc)}</span>
        ${got?`<small class="nbr">${esc(rw)}</small>`:`<span class="lbar"><i style="width:${Math.round(h/b.n*100)}%"></i></span><small>${h} / ${b.n} · ${esc(rw)}</small>`}</div>`;}).join("")}</div>
      <div class="nshop"><div class="ngh"><div><div class="kicker">Feather shop</div><h3>Spend your feathers</h3><p class="small muted">You have <b>${c.feathers}</b> feathers (${c.earned} earned in total). Earn more in the games, the quiz, the camp, the season and with badges.</p></div></div>
       <div class="shoprow">${SHOP.map(s=>{const got=c.owned[s.r[0]].includes(s.r[1]);return `<div class="si ${got?"got":""}"><small>${esc(s.kind)}</small><b>${esc(s.name)}</b>${got?`<span class="pill ok">Yours</span>`:`<button type="button" class="btn sm ${c.feathers>=s.cost?"primary":""}" data-buy="${s.id}" ${c.feathers>=s.cost?"":"disabled"}>${s.cost} feathers</button>`}</div>`;}).join("")}</div></div>`;}
  else if(tab==="style"){const L=(VB.state.profile||{}).look||{},kit=L.kit||"club",pat=L.pattern||"plain",bgm=VB.media&&VB.media.bgMode;
    P.innerHTML=`<div class="nstyle"><div class="stack" style="gap:14px">
      <div class="card"><div class="kicker">One tap</div><h3>The full ${esc(p.edition.replace(/ edition$/,""))} look</h3><p class="small muted">Secret colours on the site, your kit, your card colour, your background, ball, effect and title.</p><div class="row"><button class="btn primary" type="button" id="fullLook">Put it all on</button></div></div>
      <div class="card"><div class="kicker">Site colours</div><div class="seg" role="group" aria-label="Site colours"><button type="button" data-skin-set="crow" aria-pressed="${G().skin!==false}">Secret colours</button><button type="button" data-skin-set="orig" aria-pressed="${G().skin===false}">Original</button></div></div>
      <div class="card"><div class="kicker">Kit</div><p class="small muted">Shows on your player everywhere: home, Skills, your card and your team.</p><div class="chips">${[["club","Card colour"],["crow","Crow black"],["guardian","Guardian orange"],["fearless","Fearless white"]].map(([k,l])=>`<button type="button" class="chip" data-kit="${k}" aria-pressed="${kit===k}">${l}</button>`).join("")}</div>
        <div class="kicker" style="margin-top:10px">Jersey design</div><div class="chips">${[["plain","Plain"],["band","Chest band"],["sash","Sash"],["bolt","Lightning"],["chevron","Chevrons"],["stripes","Pinstripes"],["fade","Fade"]].map(([k,l])=>`<button type="button" class="chip" data-pat="${k}" aria-pressed="${pat===k}">${l}</button>`).join("")}</div></div>
      <div class="card"><div class="kicker">Title</div><p class="small muted">Shows under your name on your profile and player card. Earn more with badges and the shop.</p><div class="chips"><button type="button" class="chip" data-title="" aria-pressed="${!c.title}">None</button>${Object.entries(TITLES).map(([k,l])=>{const own=c.owned.title.includes(k);return `<button type="button" class="chip ${own?"":"lockedchip"}" data-title="${k}" aria-pressed="${c.title===k}" ${own?"":"disabled"}>${own?"":"🔒 "}${esc(l)}</button>`;}).join("")}</div></div>
      <div class="card"><div class="kicker">Background and card colour</div><div class="chips">${Object.entries(BGS).map(([k,l])=>{const own=c.owned.bg.includes(k);return `<button type="button" class="chip" data-nbg="${k}" aria-pressed="${bgm===k}" ${own?"":"disabled"}>${own?"":"🔒 "}${esc(l)}</button>`;}).join("")}<button type="button" class="chip" data-orange aria-pressed="${VB.media&&VB.media.accent===p.col.a}">Secret colour card</button></div>
        <p class="small muted">Your Locker on the Profile page has every kit, design, ball and effect too.</p><div class="row"><a class="btn sm" href="#profile">Open my Locker</a></div></div></div>
      <div class="stack"><div class="cardhost" id="nCard"></div><p class="small muted" style="text-align:center">Your player card with your title.</p></div></div>`;
    if(VB.renderCard&&VB.myCard)try{VB.renderCard($("#nCard"),VB.myCard());}catch(e){}}}

document.addEventListener("click",e=>{if(!e.target.closest("#v-nest"))return;const b=e.target.closest("button,a");if(!b)return;const c=C(),g=G(),p=ME(),d=b.dataset;
  if(d.nt){tab=d.nt;try{history.replaceState(null,"","#nest/"+tab);}catch(err){}panel();return;}
  if(b.id==="rtBtn"){rollingThunder();return;}
  if(b.id==="nMute"){g.mute=!g.mute;save();b.setAttribute("aria-pressed",g.mute);b.textContent=g.mute?"Sound off":"Sound on";return;}
  if(d.cq){const k=today(),arr=c.camp[k]=Array.isArray(c.camp[k])?c.camp[k]:[];if(arr.includes(d.cq))return;arr.push(d.cq);award(15);sfx("coin");if(arr.length===3){award(20);sfx("unlock");}save();checkBadges();refreshStats();panel();return;}
  if(d.buy){const s=SHOP.find(x=>x.id===d.buy);if(!s||c.owned[s.r[0]].includes(s.r[1])||c.feathers<s.cost)return;c.feathers-=s.cost;c.bought.push(s.id);give(c,s.r);save();sfx("unlock");VB.ui&&VB.ui.toast(`${s.name} is yours.`);refreshStats();panel();return;}
  if(d.skinSet){g.skin=d.skinSet==="crow";save();applySkin();panel();renderCodeCard();return;}
  if(d.kit){setLook({kit:d.kit});panel();return;}
  if(d.pat){setLook({pattern:d.pat});panel();return;}
  if(b.id==="nGoalDone"){const wk=weekKey();if(c.goal.week===wk&&c.goal.text&&!c.goal.done){c.goal.done=true;c.goalsDone=(c.goalsDone||0)+1;award(30);sfx("unlock");save();checkBadges();refreshStats();panel();}return;}
  if(d.title!==undefined&&b.classList.contains("chip")){c.title=d.title||null;save();refreshStats();VB.profile&&VB.profile.render&&VB.profile.render();VB.squad&&VB.squad.changed&&VB.squad.changed();panel();return;}
  if(d.nbg){setBg(d.nbg);panel();return;}
  if(b.hasAttribute("data-orange")){VB.media.accent=VB.media.accent===p.col.a?null:p.col.a;if(VB.media.bgMode&&VB.media.bgMode!=="upload"&&VB.media.bgMode!=="photo")setBg(VB.media.bgMode);else VB.saveMedia&&VB.saveMedia();VB.profile&&VB.profile.render();panel();return;}
  if(b.id==="fullLook"){g.skin=true;c.title=c.owned.title.includes("goat")?"goat":(c.title||p.start.title);VB.state.locker=Object.assign({},VB.state.locker||{},{ball:p.start.ball,fx:p.start.fx});VB.media.accent=p.col.a;setLook({kit:p.start.kit});setBg(c.owned.bg.includes(p.start.bg)?p.start.bg:"crowgym");applySkin();sfx("unlock");VB.ui&&VB.ui.toast(`Full ${p.edition.replace(/ edition$/,"")} look on.`);refreshStats();panel();return;}});
document.addEventListener("submit",e=>{if(e.target.id!=="nGoalForm")return;e.preventDefault();const v=($("#nGoalIn").value||"").trim().slice(0,120);if(!v)return;const c=C();c.goal={week:weekKey(),text:v,done:false};save();VB.ui&&VB.ui.toast("Goal saved. You've got this.");panel();});
function setLook(o){const p=VB.state.profile;if(!p)return;p.look=Object.assign({},p.look||{},o);save();VB.hero&&VB.hero.refresh&&VB.hero.refresh();VB.squad&&VB.squad.changed&&VB.squad.changed();}
function setBg(mode){if(!VB.media||!VB.genBg)return;VB.media.bgMode=mode;try{const cv=VB.genBg(mode,VB.myAccent(),null);VB.media.bg=cv.toDataURL("image/jpeg",.74);}catch(e){}VB.saveMedia&&VB.saveMedia();VB.profile&&VB.profile.render&&VB.profile.render();}

/* ---------- shared game helpers ---------- */
function fitCanvas(cv){return e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height];};}
function startLoop(){if(loopOn)return;loopOn=true;let last=performance.now();
  const step=now=>{if(!isNest()){loopOn=false;stopGame();return;}const raw=(now-last)/1000;last=now;drawBgFx(Math.min(.05,raw));if(game&&game.update)game.update(Math.min(.1,raw));requestAnimationFrame(step);};requestAnimationFrame(step);}
function stopGame(){if(game&&game.stop)game.stop();game=null;}
function drawBgFx(dt){const cv=$(".nfx");if(!cv)return;const r=cv.getBoundingClientRect();if(!r.width)return;
  if(!bgFx||bgFx.cv!==cv){bgFx={cv,f:[]};for(let i=0;i<34;i++)bgFx.f.push({x:Math.random(),y:Math.random(),v:.02+Math.random()*.05,r:Math.random()*6,s:.5+Math.random(),o:Math.random()<.35,w:Math.random()*6});}
  const W=Math.round(r.width),H=Math.round(r.height);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}const g=cv.getContext("2d");g.clearRect(0,0,W,H);
  bgFx.f.forEach(f=>{if(!reduced()){f.y+=f.v*dt;f.r+=dt*f.s;f.w+=dt;}if(f.y>1.08){f.y=-.08;f.x=Math.random();}featherAt(g,(f.x+Math.sin(f.w)*.015)*W,f.y*H,22*f.s,Math.sin(f.r)*.9,f.o?rgbA(.55):"rgba(255,255,255,.08)");});}

/* ---------- Dig Defence ---------- */
function digGame(cv){const g=cv.getContext("2d"),W=cv.width,H=cv.height,pt=fitCanvas(cv),c=C();
  const K={ty:185,by:548,tl:215,tr:685,bl:40,br:860};
  const cp=(u,v)=>{const y=K.ty+(K.by-K.ty)*v,l=K.tl+(K.bl-K.tl)*v,r=K.tr+(K.br-K.tr)*v;return [l+(r-l)*u,y,.55+.75*v];};
  const ZONE={4:[0,0],3:[1,0],2:[2,0],5:[0,1],6:[1,1],1:[2,1]};
  let S=null;
  function reset(){S={on:true,score:0,combo:0,lives:3,balls:[],fx:[],pops:[],next:.8,t:0,shake:0,digs:0,over:false};}
  function spawn(){const tip=S.score>=8&&Math.random()<.22,zone=tip?[4,3,2][Math.floor(Math.random()*3)]:[1,2,3,4,5,6][Math.floor(Math.random()*6)],[col,row]=ZONE[zone];
    const u=(col+.18+Math.random()*.64)/3,v=row===0?(.06+Math.random()*.25):(.38+Math.random()*.55),L=cp(u,v),T=Math.max(.62,1.35-S.score*.011)*(tip?1.55:1);
    S.balls.push({zone,u,v,L,x0:K.tl+60+Math.random()*(K.tr-K.tl-120),T,t:-.35,tip,dug:false,dt:0});}
  function tap(x,y,zone){if(!S||!S.on)return;let best=null;
    S.balls.forEach(b=>{if(b.dug||b.t<0)return;const p=b.t/b.T,r=ringR(b,p)+16,dx=(x-b.L[0])/r,dy=(y-b.L[1])/(r*.5);const hit=zone!=null?b.zone===zone:dx*dx+dy*dy<=1.3;if(hit&&(!best||b.T-b.t<best.T-best.t))best=b;});
    if(!best){if(zone==null&&S.combo){S.combo=0;S.pops.push({t:0,x,y,txt:"Whiff",col:"#bbb"});}return;}
    const p=best.t/best.T,perfect=p>=.7;best.dug=true;best.dt=0;best.from=ballPos(best,p);S.digs++;S.combo++;
    let pts=perfect?3:1;if(S.combo%10===0){pts+=5;S.pops.push({t:0,x:W/2,y:H*.42,txt:"ROLLING THUNDER!",col:ORANGE,big:true});sfx("thunder");S.shake=.35;}
    S.score+=pts;S.pops.push({t:0,x:best.from[0],y:best.from[1]-30,txt:perfect?"PERFECT +3":"DIG +1",col:perfect?ORANGE:"#fff"});sfx(perfect?"perfect":"dig");
    for(let i=0;i<14;i++)S.fx.push({x:best.L[0],y:best.L[1],vx:(Math.random()-.5)*360,vy:-Math.random()*320,t:0,col:i%3?ORANGE:"#fff"});}
  const ringR=(b,p)=>(78-44*p)*b.L[2]*(b.tip?.8:1);
  const ballPos=(b,p)=>{const sx=b.x0,sy=K.ty-130,e=b.tip?p:Math.pow(p,1.15),x=sx+(b.L[0]-sx)*e,y=sy+(b.L[1]-sy)*e-(b.tip?Math.sin(Math.PI*p)*120:Math.sin(Math.PI*p)*18),s=.7+(b.L[2]-.7)*p;return [x,y,s];};
  function end(){S.on=false;S.over=true;const fe=Math.floor(S.score/2);award(fe);c.games++;c.digs+=S.digs;const nb=S.score>c.best.dig;if(nb)c.best.dig=S.score;save();
    const ov=$("#digOver");if(ov){ov.hidden=false;ov.innerHTML=`<b>${S.score} points</b><span>${nb?"New best! ":""}${S.digs} digs · +${fe} feathers</span><button class="btn primary" type="button" id="digGo">Play again</button>`;}
    checkBadges();refreshStats();const nbEl=$(".ngbest b");if(nbEl)nbEl.textContent=c.best.dig;}
  function court(){g.fillStyle="#0b0a0c";g.fillRect(0,0,W,H);const fl=g.createLinearGradient(0,K.ty,0,K.by);fl.addColorStop(0,"#7a3a12");fl.addColorStop(1,"#c8631f");
    g.fillStyle=fl;g.beginPath();g.moveTo(K.tl-40,K.ty);g.lineTo(K.tr+40,K.ty);g.lineTo(K.br+60,H);g.lineTo(K.bl-60,H);g.closePath();g.fill();
    g.globalAlpha=.12;g.strokeStyle="#000";for(let i=1;i<14;i++){const a=cp(i/14,0),b=cp(i/14,1.05);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}g.globalAlpha=1;
    g.strokeStyle="#f4efe6";g.lineWidth=4;g.beginPath();const a=cp(0,0),b=cp(1,0),d=cp(1,1),e=cp(0,1);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(d[0],d[1]);g.lineTo(e[0],e[1]);g.closePath();g.stroke();
    const m1=cp(0,.333),m2=cp(1,.333);g.lineWidth=3;g.beginPath();g.moveTo(m1[0],m1[1]);g.lineTo(m2[0],m2[1]);g.stroke();
    g.font="800 28px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillStyle="rgba(255,255,255,.14)";Object.entries(ZONE).forEach(([z,[cc,r]])=>{const p=cp((cc+.5)/3,r===0?.17:.66);g.fillText(z,p[0],p[1]);});
    /* net */
    g.fillStyle="rgba(255,255,255,.07)";g.fillRect(K.tl-40,K.ty-95,K.tr-K.tl+80,95);g.strokeStyle="rgba(255,255,255,.22)";g.lineWidth=1;for(let x=K.tl-40;x<=K.tr+40;x+=12){g.beginPath();g.moveTo(x,K.ty-95);g.lineTo(x,K.ty);g.stroke();}for(let y=K.ty-95;y<=K.ty;y+=12){g.beginPath();g.moveTo(K.tl-40,y);g.lineTo(K.tr+40,y);g.stroke();}
    g.fillStyle="#f4efe6";g.fillRect(K.tl-40,K.ty-100,K.tr-K.tl+80,9);g.fillStyle="#2a2730";g.fillRect(K.tl-52,K.ty-110,10,130);g.fillRect(K.tr+42,K.ty-110,10,130);
    for(let k=0;k<6;k++){g.fillStyle=k%2?"#f4efe6":ORANGE;g.fillRect(K.tl-40,K.ty-150+k*9,4,9);g.fillRect(K.tr+36,K.ty-150+k*9,4,9);}}
  function hitter(x,t){const up=Math.max(0,Math.sin(Math.min(1,(t+.35)/.5)*Math.PI))*24;g.save();g.translate(x,K.ty-104-up);g.fillStyle="#141217";
    g.beginPath();g.arc(0,-34,11,0,7);g.fill();g.beginPath();g.moveTo(-14,-22);g.lineTo(14,-22);g.lineTo(10,12);g.lineTo(-10,12);g.closePath();g.fill();g.lineWidth=7;g.strokeStyle="#141217";g.lineCap="round";
    const sw=t<0?-1.9:-.2;g.beginPath();g.moveTo(10,-18);g.lineTo(10+Math.cos(sw)*30,-18+Math.sin(sw)*30);g.stroke();g.beginPath();g.moveTo(-10,-18);g.lineTo(-24,0);g.stroke();g.restore();}
  function ball(x,y,s,a){const r=17*s;g.save();g.globalAlpha=a==null?1:a;g.fillStyle="#f6f3ea";g.beginPath();g.arc(x,y,r,0,7);g.fill();g.strokeStyle=ORANGE;g.lineWidth=Math.max(1.5,3*s);
    g.beginPath();g.arc(x,y,r*.95,-.6,1.6);g.stroke();g.strokeStyle="#141217";g.beginPath();g.arc(x,y,r*.95,2,3.9);g.stroke();g.beginPath();g.moveTo(x-r*.9,y-r*.2);g.quadraticCurveTo(x,y+r*.3,x+r*.9,y-r*.2);g.stroke();g.restore();}
  function draw(){g.save();if(S&&S.shake>0&&!reduced()){g.translate((Math.random()-.5)*14*S.shake/.35,(Math.random()-.5)*14*S.shake/.35);}court();
    if(S){S.balls.forEach(b=>{if(b.dug){const k=Math.min(1,b.dt/.55),x=b.from[0]+(W/2-b.from[0])*k,y=b.from[1]+(60-b.from[1])*k-Math.sin(Math.PI*k)*120;ball(x,y,b.from[2]*(1-.5*k),1-k*.6);return;}
        if(b.t<0){hitter(b.x0,b.t);return;}const p=b.t/b.T,r=ringR(b,p);if(p<.4)hitter(b.x0,b.t);
        g.strokeStyle=p>=.7?ORANGE:"rgba(255,255,255,.85)";g.lineWidth=p>=.7?5:3;g.beginPath();g.ellipse(b.L[0],b.L[1],r,r*.5,0,0,7);g.stroke();g.fillStyle=p>=.7?"rgba(255,122,26,.18)":"rgba(255,255,255,.08)";g.fill();
        g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(b.L[0],b.L[1],12*b.L[2]*p+4,5*b.L[2]*p+2,0,0,7);g.fill();if(b.tip){g.fillStyle=ORANGE;g.font="800 20px 'Barlow Condensed',sans-serif";g.fillText("TIP!",b.L[0],b.L[1]-r*.5-14);}
        const q=ballPos(b,p);ball(q[0],q[1],q[2]);});
      S.fx.forEach(f=>{g.globalAlpha=Math.max(0,1-f.t/.6);g.fillStyle=f.col;g.fillRect(f.x,f.y,5,5);});g.globalAlpha=1;
      S.pops.forEach(p=>{g.globalAlpha=Math.max(0,1-p.t/(p.big?1.2:.8));g.fillStyle=p.col;g.font=`italic 800 ${p.big?64:30}px 'Barlow Condensed',sans-serif`;g.textAlign="center";g.fillText(p.txt,p.x,p.y-p.t*40);});g.globalAlpha=1;
      g.textAlign="left";g.fillStyle="#fff";g.font="800 44px 'Barlow Condensed',sans-serif";g.fillText(S.score,24,48);g.font="600 16px 'Barlow',sans-serif";g.fillStyle="rgba(255,255,255,.7)";g.fillText("POINTS",26,74);
      if(S.combo>1){g.fillStyle=ORANGE;g.font="italic 800 30px 'Barlow Condensed',sans-serif";g.fillText(S.combo+" IN A ROW",24,108);}
      for(let i=0;i<3;i++){g.globalAlpha=i<S.lives?1:.2;ball(W-36-i*40,40,1.25);}g.globalAlpha=1;}
    g.restore();}
  function update(dt){if(!S){draw();return;}if(S.on){S.t+=dt;S.next-=dt;if(S.next<=0){spawn();if(S.score>=40&&Math.random()<.25)spawn();S.next=Math.max(.55,1.5-S.score*.015);}
      S.balls.forEach(b=>{if(b.dug){b.dt+=dt;return;}b.t+=dt;if(b.t>=b.T){b.gone=true;S.lives--;S.combo=0;S.shake=.25;sfx("drop");S.pops.push({t:0,x:b.L[0],y:b.L[1]-20,txt:"DROP!",col:"#ff4d4d"});}});
      S.balls=S.balls.filter(b=>!b.gone&&!(b.dug&&b.dt>.55));if(S.lives<=0)end();}
    S.shake=Math.max(0,S.shake-dt);S.fx.forEach(f=>{f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=700*dt;});S.fx=S.fx.filter(f=>f.t<.6);S.pops.forEach(p=>p.t+=dt);S.pops=S.pops.filter(p=>p.t<1.2);draw();}
  const down=e=>{if(!S||!S.on)return;e.preventDefault();const [x,y]=pt(e);tap(x,y);};
  const key=e=>{if(!S||!S.on){if((e.key===" "||e.key==="Enter")&&document.activeElement===cv){e.preventDefault();go();}return;}if(/^[1-6]$/.test(e.key)){e.preventDefault();tap(0,0,+e.key);}};
  function go(){reset();const ov=$("#digOver");if(ov)ov.hidden=true;cv.focus({preventScroll:true});sfx("tick");}
  cv.tabIndex=0;cv.addEventListener("pointerdown",down);window.addEventListener("keydown",key);
  const goBtn=e=>{if(e.target.id==="digGo")go();};document.addEventListener("click",goBtn);draw();
  return {update,stop(){window.removeEventListener("keydown",key);document.removeEventListener("click",goBtn);if(S&&S.on){S.on=false;}}};}

/* ---------- Freak Quick ---------- */
function quickGame(cv){const g=cv.getContext("2d"),W=cv.width,H=cv.height,c=C();
  const FLOOR=380,NETX=720,NETTOP=200,SET=[540,262],HIT=[652,150];
  let S=null;
  function reset(){S={on:true,kills:0,streak:0,best:0,lives:3,phase:"pass",t:0,eyes:!!($("#qkEyes")||{}).checked,pops:[],fx:[],shake:0,swing:-1};newRally();}
  function newRally(){const r=Math.random(),type=r<.55?"quick":r<.8?"high":"slide";S.type=type;S.D=type==="quick"?.36+Math.random()*.12:type==="high"?.85+Math.random()*.2:.55+Math.random()*.1;S.phase="pass";S.t=0;S.swing=-1;S.res=null;S.w=Math.max(.06,.17-S.streak*.009);}
  const lerp=(a,b,k)=>a+(b-a)*k;
  function setPos(s){const apex=S.type==="high"?40:S.type==="slide"?115:120;if(s<=1){const x=lerp(SET[0],HIT[0],s),y=(1-s)*(1-s)*SET[1]+2*(1-s)*s*apex+s*s*HIT[1];return [x,y];}
    const k=s-1;return [HIT[0]+k*90,HIT[1]+k*k*260+k*40];}
  function press(){if(!S||!S.on)return;if(S.phase==="pass"){miss("Too early!");return;}if(S.phase!=="set")return;const s=S.t/S.D,err=s-1;S.swing=0;
    if(Math.abs(err)<=S.w){const perfect=Math.abs(err)<=S.w*.45;S.phase="kill";S.t=0;S.kills++;S.streak++;S.best=Math.max(S.best,S.streak);const fe=(perfect?3:1)*(S.eyes?2:1);award(fe);
      S.pops.push({t:0,x:HIT[0]+40,y:HIT[1]-30,txt:perfect?"PERFECT KILL!":"KILL!",col:perfect?ORANGE:"#fff",big:perfect});sfx("kill");S.shake=.3;for(let i=0;i<18;i++)S.fx.push({x:HIT[0],y:HIT[1],vx:Math.random()*500,vy:(Math.random()-.3)*400,t:0});}
    else miss(err<0?"Early!":"Late!");}
  function miss(txt){S.phase="miss";S.t=0;S.lives--;S.streak=0;sfx("miss");S.pops.push({t:0,x:HIT[0],y:HIT[1]-40,txt,col:"#ff6b6b"});if(S.lives<=0)setTimeout(end,700);}
  function end(){if(!S||!S.on)return;S.on=false;const nb=S.best>c.best.quick;if(nb)c.best.quick=S.best;c.games++;save();const ov=$("#qkOver");
    if(ov){ov.hidden=false;ov.innerHTML=`<b>${S.kills} kills</b><span>${nb?"New best streak! ":""}Best streak ${S.best}</span><button class="btn primary" type="button" id="qkGo">Play again</button>`;}checkBadges();refreshStats();const be=$(".ngbest b");if(be)be.textContent=c.best.quick;}
  function person(x,y,col,num,arm,crouch){g.save();g.translate(x,y);g.lineCap="round";g.strokeStyle="#141217";g.lineWidth=8;
    g.beginPath();g.moveTo(-6,-40);g.lineTo(-12-crouch*6,-12);g.lineTo(-8,0);g.moveTo(6,-40);g.lineTo(10+crouch*6,-12);g.lineTo(8,0);g.stroke();
    g.fillStyle=col;g.beginPath();g.moveTo(-14,-92);g.lineTo(14,-92);g.lineTo(11,-40);g.lineTo(-11,-40);g.closePath();g.fill();g.fillStyle="#141217";g.fillRect(-12,-44,24,8);
    if(num){g.fillStyle=col===ORANGE?"#141217":ORANGE;g.font="800 18px 'Barlow Condensed',sans-serif";g.textAlign="center";g.fillText(num,0,-62);}
    g.fillStyle="#e0ac87";g.beginPath();g.arc(0,-106,12,0,7);g.fill();g.fillStyle="#141217";g.beginPath();g.arc(0,-110,12,Math.PI,0);g.fill();
    g.strokeStyle="#e0ac87";g.lineWidth=7;g.beginPath();g.moveTo(10,-86);g.lineTo(10+Math.cos(arm)*34,-86+Math.sin(arm)*34);g.stroke();g.beginPath();g.moveTo(-10,-86);g.lineTo(-26,-60);g.stroke();g.restore();}
  function vball(x,y,a){g.save();g.globalAlpha=a==null?1:a;g.fillStyle="#f6f3ea";g.beginPath();g.arc(x,y,11,0,7);g.fill();g.strokeStyle=ORANGE;g.lineWidth=2.5;g.beginPath();g.arc(x,y,10,-.6,1.6);g.stroke();g.strokeStyle="#141217";g.beginPath();g.arc(x,y,10,2,3.9);g.stroke();g.restore();}
  function draw(){g.save();if(S&&S.shake>0&&!reduced())g.translate((Math.random()-.5)*12,(Math.random()-.5)*12);
    const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#0b0a0c");sky.addColorStop(1,"#1e1512");g.fillStyle=sky;g.fillRect(0,0,W,H);
    const r=g.createRadialGradient(W*.6,0,0,W*.6,0,W*.6);r.addColorStop(0,"rgba(255,122,26,.25)");r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,W,H);
    g.fillStyle="#b9581b";g.fillRect(0,FLOOR,W,H-FLOOR);g.fillStyle="#f4efe6";g.fillRect(0,FLOOR,W,3);g.fillRect(NETX-300,FLOOR,4,6);
    g.fillStyle="#2a2730";g.fillRect(NETX-3,NETTOP-10,6,FLOOR-NETTOP+10);g.fillStyle="rgba(255,255,255,.12)";g.fillRect(NETX-5,NETTOP,10,90);g.fillStyle="#f4efe6";g.fillRect(NETX-6,NETTOP-4,12,8);
    g.fillStyle="rgba(255,255,255,.55)";g.font="700 14px 'Barlow',sans-serif";g.textAlign="center";g.fillText("SETTER",SET[0]-8,FLOOR+22);g.fillText("YOU",400,FLOOR+22);
    const s=S?S.t/(S.D||1):0;let hx=420,hy=FLOOR,arm=-2.2,cr=0;
    if(S){if(S.phase==="pass"){const k=Math.min(1,S.t/.7);hx=lerp(400,470,k);cr=k*.6;}
      else if(S.phase==="set"){const k=Math.min(1,s);hx=lerp(470,HIT[0]-14,Math.min(1,k*1.3));const air=S.type==="high"?Math.max(0,(k-.55)/.45):Math.min(1,k*1.6);hy=FLOOR-Math.sin(Math.min(1,air)*Math.PI*.5)*80;arm=-2.2+Math.min(1,air)*.6;}
      else{hx=HIT[0]-14;const k=Math.min(1,S.t/.6);hy=FLOOR-80*(1-k*k);arm=S.swing>=0?-.6+Math.min(1,S.t*6)*1.2:-1.6;}
      if(S.swing>=0&&S.phase==="set")arm=.4;}
    person(SET[0]-8,FLOOR,"#141217","5",-1.7,0);person(hx,hy,ORANGE,"10",arm,cr);
    if(S){let bp=null,vis=true;if(S.phase==="pass"){const k=Math.min(1,S.t/.7);bp=[lerp(60,SET[0],k),lerp(300,SET[1],k)-Math.sin(Math.PI*k)*170];}
      else if(S.phase==="set"){bp=setPos(s);if(S.eyes&&s>.22&&s<1.05)vis=false;}
      else if(S.phase==="kill"){const k=Math.min(1,S.t/.35);bp=[lerp(HIT[0]+4,860,k),lerp(HIT[1],FLOOR-10,k*k)];g.strokeStyle="rgba(255,122,26,.7)";g.lineWidth=8;g.beginPath();g.moveTo(HIT[0],HIT[1]);g.lineTo(bp[0],bp[1]);g.stroke();}
      else if(S.phase==="miss")bp=setPos(Math.min(2.2,1+S.t*1.4));
      if(bp&&vis)vball(bp[0],bp[1]);
      if(S.phase==="set"&&!S.eyes){g.strokeStyle="rgba(255,122,26,.5)";g.setLineDash([6,6]);g.lineWidth=2;g.beginPath();g.arc(HIT[0],HIT[1],22,0,7);g.stroke();g.setLineDash([]);}
      S.fx.forEach(f=>{g.globalAlpha=Math.max(0,1-f.t/.5);g.fillStyle=ORANGE;g.fillRect(f.x,f.y,5,5);});g.globalAlpha=1;
      S.pops.forEach(p=>{g.globalAlpha=Math.max(0,1-p.t);g.fillStyle=p.col;g.font=`italic 800 ${p.big?46:32}px 'Barlow Condensed',sans-serif`;g.textAlign="center";g.fillText(p.txt,p.x,p.y-p.t*30);});g.globalAlpha=1;
      g.textAlign="left";g.fillStyle="#fff";g.font="800 40px 'Barlow Condensed',sans-serif";g.fillText(S.kills,22,46);g.font="600 14px 'Barlow',sans-serif";g.fillStyle="rgba(255,255,255,.7)";g.fillText("KILLS",24,66);
      g.fillStyle=ORANGE;g.font="italic 800 26px 'Barlow Condensed',sans-serif";if(S.streak>1)g.fillText("STREAK "+S.streak,22,98);
      g.font="700 15px 'Barlow',sans-serif";g.fillStyle="rgba(255,255,255,.75)";g.textAlign="right";g.fillText((S.type==="quick"?"QUICK SET":S.type==="high"?"HIGH SET":"SLIDE SET")+(S.eyes?" · EYES CLOSED":""),W-20,30);
      for(let i=0;i<3;i++)vball(W-30-i*30,56,i<S.lives?1:.2);}
    g.restore();}
  function update(dt){if(S){if(S.on||S.phase==="miss"||S.phase==="kill"){S.t+=dt;
      if(S.phase==="pass"&&S.t>=.7){S.phase="set";S.t=0;sfx("tick");}
      else if(S.phase==="set"&&S.t/S.D>1+S.w+.15)miss("Missed it!");
      else if((S.phase==="kill"&&S.t>.9)||(S.phase==="miss"&&S.t>.9&&S.on))newRally();}
      S.shake=Math.max(0,S.shake-dt);S.fx.forEach(f=>{f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=600*dt;});S.fx=S.fx.filter(f=>f.t<.5);S.pops.forEach(p=>p.t+=dt);S.pops=S.pops.filter(p=>p.t<1);}
    draw();}
  const down=e=>{if(!S||!S.on)return;e.preventDefault();press();};
  const key=e=>{if(!isNest())return;if(e.key===" "||e.key==="Enter"){if(S&&S.on){e.preventDefault();press();}else if(document.activeElement===cv){e.preventDefault();go();}}};
  function go(){reset();const ov=$("#qkOver");if(ov)ov.hidden=true;cv.focus({preventScroll:true});}
  cv.tabIndex=0;cv.addEventListener("pointerdown",down);window.addEventListener("keydown",key);
  const goBtn=e=>{if(e.target.id==="qkGo")go();};document.addEventListener("click",goBtn);draw();
  return {update,stop(){window.removeEventListener("keydown",key);document.removeEventListener("click",goBtn);if(S)S.on=false;}};}

/* ---------- Jump Serve ---------- */
function serveGame(cv){const g=cv.getContext("2d"),W=cv.width,H=cv.height,c=C();
  /* the far court seen from behind the server: v=0 at the net, v=1 at the far end line */
  const NETY=300,cp=(u,v)=>{const y=NETY-205*v,hw=280-130*v;return [450+(u-.5)*2*hw,y,1-.55*v];};
  const ZONE={2:[0,0],3:[1,0],4:[2,0],1:[0,1],6:[1,1],5:[2,1]};/* the other team's zones as you look at them */
  let S=null;
  function reset(){S={on:true,score:0,aces:0,lives:3,streak:0,phase:"power",t:0,pw:0,pdir:1,aim:0,adir:1,target:0,ball:null,pops:[],fx:[],shake:0};newServe();}
  function newServe(){S.phase="power";S.t=0;S.pw=0;S.pdir=1;S.aim=Math.random();S.adir=Math.random()<.5?1:-1;S.ball=null;S.target=[1,2,3,4,5,6][Math.floor(Math.random()*6)];
    const w=Math.max(.14,.26-S.score*.004);S.lo=.6-w/2+(Math.random()-.5)*.1;S.hi=S.lo+w;}
  const zoneOf=(u,v)=>{const col=Math.min(2,Math.floor(u*3)),row=v<1/3?0:1;return +Object.keys(ZONE).find(z=>ZONE[z][0]===col&&ZONE[z][1]===row);};
  function press(){if(!S||!S.on)return;if(S.phase==="power"){S.lock=S.pw;S.phase="aim";sfx("tick");return;}
    if(S.phase!=="aim")return;const u=S.aim*1.2-.1,p=S.lock;let res,v;
    if(p<S.lo){res="net";v=-.05;}else if(p>S.hi){res="long";v=1.18;}else{v=.04+(p-S.lo)/(S.hi-S.lo)*.94;res=u<0||u>1?"wide":"in";}
    S.ball={u:Math.max(-.15,Math.min(1.15,u)),v,res,t:0};S.phase="fly";sfx("whoosh");}
  function land(){const b=S.ball;if(b.res==="in"){const z=zoneOf(b.u,b.v),ace=z===S.target;if(ace){S.score+=3;S.aces++;S.streak++;c.aces++;award(2);sfx("kill");S.shake=.3;
        S.pops.push({t:0,x:cp(b.u,b.v)[0],y:cp(b.u,b.v)[1]-30,txt:S.streak>2?`ACE! ×${S.streak}`:"ACE!",col:ORANGE,big:true});const L=cp(b.u,b.v);for(let i=0;i<18;i++)S.fx.push({x:L[0],y:L[1],vx:(Math.random()-.5)*400,vy:-Math.random()*300,t:0});}
      else{S.score+=1;S.streak=0;sfx("dig");S.pops.push({t:0,x:cp(b.u,b.v)[0],y:cp(b.u,b.v)[1]-30,txt:`In, zone ${z}`,col:"#fff"});}}
    else{S.lives--;S.streak=0;sfx("miss");S.pops.push({t:0,x:450,y:b.res==="net"?NETY-60:120,txt:b.res==="net"?"Into the net!":b.res==="long"?"Long!":"Wide!",col:"#ff6b6b"});if(S.lives<=0){setTimeout(end,700);}}
    S.phase="result";S.t=0;}
  function end(){if(!S||!S.on)return;S.on=false;c.games++;const nb=S.score>c.best.serve;if(nb)c.best.serve=S.score;award(Math.floor(S.score/2));save();const ov=$("#svOver");
    if(ov){ov.hidden=false;ov.innerHTML=`<b>${S.score} points</b><span>${nb?"New best! ":""}${S.aces} aces · +${Math.floor(S.score/2)+S.aces*2} feathers</span><button class="btn primary" type="button" id="svGo">Play again</button>`;}checkBadges();refreshStats();const be=$(".ngbest b");if(be)be.textContent=c.best.serve;}
  function draw(){g.save();if(S&&S.shake>0&&!reduced())g.translate((Math.random()-.5)*12,(Math.random()-.5)*12);
    g.fillStyle="#0b0a0c";g.fillRect(0,0,W,H);const r=g.createRadialGradient(450,40,0,450,40,500);r.addColorStop(0,rgbA(.22));r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,W,H);
    /* floor */
    g.fillStyle="#9c4a17";g.beginPath();const a=cp(-.25,1.15),b2=cp(1.25,1.15);g.moveTo(a[0],a[1]);g.lineTo(b2[0],b2[1]);g.lineTo(W+80,H);g.lineTo(-80,H);g.closePath();g.fill();
    const fl=g.createLinearGradient(0,90,0,H);fl.addColorStop(0,"rgba(0,0,0,.4)");fl.addColorStop(1,"rgba(255,140,60,.15)");g.fillStyle=fl;g.fill();
    /* target zone */
    if(S){const [col,row]=ZONE[S.target],u0=col/3,u1=(col+1)/3,v0=row?1/3:0,v1=row?1:1/3,q=[cp(u0,v0),cp(u1,v0),cp(u1,v1),cp(u0,v1)];g.fillStyle=rgbA(.28+.12*Math.sin(performance.now()/180));g.beginPath();q.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();}
    g.strokeStyle="#f4efe6";g.lineWidth=3;g.beginPath();[cp(0,0),cp(1,0),cp(1,1),cp(0,1)].forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();
    const m1=cp(0,1/3),m2=cp(1,1/3);g.lineWidth=2;g.beginPath();g.moveTo(m1[0],m1[1]);g.lineTo(m2[0],m2[1]);g.stroke();
    g.font="800 30px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";Object.entries(ZONE).forEach(([z,[cc,rr]])=>{const p=cp((cc+.5)/3,rr?.66:.17);g.fillStyle=S&&+z===S.target?"#fff":"rgba(255,255,255,.18)";g.fillText(z,p[0],p[1]);});
    /* net */
    g.fillStyle="rgba(255,255,255,.07)";g.fillRect(130,NETY-80,640,80);g.strokeStyle="rgba(255,255,255,.2)";g.lineWidth=1;for(let x=130;x<=770;x+=12){g.beginPath();g.moveTo(x,NETY-80);g.lineTo(x,NETY);g.stroke();}for(let y=NETY-80;y<=NETY;y+=12){g.beginPath();g.moveTo(130,y);g.lineTo(770,y);g.stroke();}
    g.fillStyle="#f4efe6";g.fillRect(130,NETY-84,640,8);g.fillStyle="#2a2730";g.fillRect(118,NETY-95,10,170);g.fillRect(772,NETY-95,10,170);
    for(let k=0;k<6;k++){g.fillStyle=k%2?"#f4efe6":ORANGE;g.fillRect(170,NETY-130+k*8,4,8);g.fillRect(726,NETY-130+k*8,4,8);}
    /* our end line and the server */
    g.fillStyle="#f4efe6";g.fillRect(0,H-58,W,4);
    if(S){const sx=450,sy=H-24,ph=S.phase;g.save();g.translate(sx,sy);g.fillStyle="#141217";g.beginPath();g.arc(0,-92,13,0,7);g.fill();g.fillStyle=ORANGE;g.fillRect(-16,-78,32,44);g.fillStyle="#141217";g.font="800 18px 'Barlow Condensed',sans-serif";g.fillText(who()==="theodore"?"10":"4",0,-56);
      g.strokeStyle="#141217";g.lineWidth=9;g.lineCap="round";g.beginPath();g.moveTo(-8,-34);g.lineTo(-12,0);g.moveTo(8,-34);g.lineTo(12,0);g.stroke();g.strokeStyle="#e0ac87";g.lineWidth=7;const sw=ph==="fly"||ph==="result"?-.4:-2.2;g.beginPath();g.moveTo(12,-72);g.lineTo(12+Math.cos(sw)*36,-72+Math.sin(sw)*36);g.stroke();g.restore();}
    /* ball */
    if(S&&S.ball){const b=S.ball,k=Math.min(1,b.t/.75),L=cp(b.u,b.v),x=450+(L[0]-450)*k,y=(H-150)+(L[1]-(H-150))*k-Math.sin(Math.PI*k)*(b.res==="net"?60:160),s=1.1-(1.1-L[2]*.7)*k;
      g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(450+(L[0]-450)*k,(H-60)+(L[1]-(H-60))*k,10*s,4*s,0,0,7);g.fill();
      g.fillStyle="#f6f3ea";g.beginPath();g.arc(x,y,14*s,0,7);g.fill();g.strokeStyle=ORANGE;g.lineWidth=3*s;g.beginPath();g.arc(x,y,13*s,-.6,1.6);g.stroke();g.strokeStyle="#141217";g.beginPath();g.arc(x,y,13*s,2,3.9);g.stroke();}
    else if(S&&S.on){g.fillStyle="#f6f3ea";g.beginPath();g.arc(470,H-150-Math.abs(Math.sin(performance.now()/300))*20,14,0,7);g.fill();}
    /* meters */
    if(S&&(S.phase==="power"||S.phase==="aim")){const bx=40,by=150,bh=300,bw=26;g.fillStyle="rgba(255,255,255,.12)";g.fillRect(bx,by,bw,bh);g.fillStyle=rgbA(.55);g.fillRect(bx,by+bh*(1-S.hi),bw,bh*(S.hi-S.lo));
      const pv=S.phase==="power"?S.pw:S.lock;g.fillStyle="#fff";g.fillRect(bx-6,by+bh*(1-pv)-3,bw+12,6);g.fillStyle="rgba(255,255,255,.75)";g.font="700 14px 'Barlow',sans-serif";g.textAlign="center";g.fillText("POWER",bx+bw/2,by+bh+20);
      if(S.phase==="aim"){const u=S.aim*1.2-.1,L=cp(u,.5);g.strokeStyle="#fff";g.lineWidth=3;g.setLineDash([8,8]);g.beginPath();g.moveTo(450,H-150);g.lineTo(L[0],L[1]);g.stroke();g.setLineDash([]);g.fillStyle="#fff";g.beginPath();g.arc(L[0],L[1],7,0,7);g.fill();}
      g.fillStyle=ORANGE;g.font="italic 800 26px 'Barlow Condensed',sans-serif";g.textAlign="center";g.fillText(S.phase==="power"?"TAP TO LOCK POWER":"TAP TO LOCK AIM",450,H-100+0);}
    if(S){S.fx.forEach(f=>{g.globalAlpha=Math.max(0,1-f.t/.6);g.fillStyle=ORANGE;g.fillRect(f.x,f.y,5,5);});g.globalAlpha=1;
      S.pops.forEach(p=>{g.globalAlpha=Math.max(0,1-p.t);g.fillStyle=p.col;g.font=`italic 800 ${p.big?52:32}px 'Barlow Condensed',sans-serif`;g.textAlign="center";g.fillText(p.txt,p.x,p.y-p.t*30);});g.globalAlpha=1;
      g.textAlign="left";g.fillStyle="#fff";g.font="800 42px 'Barlow Condensed',sans-serif";g.fillText(S.score,24,48);g.font="600 15px 'Barlow',sans-serif";g.fillStyle="rgba(255,255,255,.7)";g.fillText("POINTS · "+S.aces+" ACES",26,72);
      g.textAlign="right";g.fillStyle=ORANGE;g.font="italic 800 24px 'Barlow Condensed',sans-serif";g.fillText("TARGET: ZONE "+S.target,W-24,40);
      for(let i=0;i<3;i++){g.globalAlpha=i<S.lives?1:.2;g.fillStyle="#f6f3ea";g.beginPath();g.arc(W-36-i*32,70,11,0,7);g.fill();}g.globalAlpha=1;}
    g.restore();}
  function update(dt){if(S){S.t+=dt;const sp=1.1+S.score*.02;
      if(S.phase==="power"){S.pw+=S.pdir*dt*sp;if(S.pw>1){S.pw=1;S.pdir=-1;}if(S.pw<0){S.pw=0;S.pdir=1;}}
      else if(S.phase==="aim"){S.aim+=S.adir*dt*(.7+S.score*.012);if(S.aim>1){S.aim=1;S.adir=-1;}if(S.aim<0){S.aim=0;S.adir=1;}}
      else if(S.phase==="fly"){S.ball.t+=dt;if(S.ball.t>=.75)land();}
      else if(S.phase==="result"&&S.t>.9&&S.on&&S.lives>0)newServe();
      S.shake=Math.max(0,S.shake-dt);S.fx.forEach(f=>{f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=600*dt;});S.fx=S.fx.filter(f=>f.t<.6);S.pops.forEach(p=>p.t+=dt);S.pops=S.pops.filter(p=>p.t<1);}
    draw();}
  const down=e=>{if(!S||!S.on)return;e.preventDefault();press();};
  const key=e=>{if(!isNest())return;if(e.key===" "||e.key==="Enter"){if(S&&S.on){e.preventDefault();press();}else if(document.activeElement===cv){e.preventDefault();go();}}};
  function go(){reset();const ov=$("#svOver");if(ov)ov.hidden=true;cv.focus({preventScroll:true});}
  cv.tabIndex=0;cv.addEventListener("pointerdown",down);window.addEventListener("keydown",key);
  const goBtn=e=>{if(e.target.id==="svGo")go();};document.addEventListener("click",goBtn);draw();
  return {update,stop(){window.removeEventListener("keydown",key);document.removeEventListener("click",goBtn);if(S)S.on=false;}};}

/* ---------- Volleyball IQ ---------- */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function quizStart(P){const f=ME().focus,mine=shuffle(QUIZ.filter(q=>q.f===f)).slice(0,4),rest=shuffle(QUIZ.filter(q=>!mine.includes(q))).slice(0,QN-mine.length);
  quiz={qs:shuffle(mine.concat(rest)).map(q=>({...q,opts:shuffle(q.a.map((t,i)=>({t,ok:i===0})))})),i:0,right:0,picked:null};quizRender(P);}
function quizRender(P){P=P||$("#nPanel");const c=C();if(!P||!quiz)return;
  if(quiz.i>=quiz.qs.length){const fe=quiz.right*5;award(fe);c.games++;const nb=quiz.right>c.best.quiz;if(nb)c.best.quiz=quiz.right;save();checkBadges();refreshStats();
    P.innerHTML=`<div class="nquiz done"><div class="kicker">Volleyball IQ</div><h3>${quiz.right} / ${quiz.qs.length}</h3><p>${quiz.right===quiz.qs.length?"Perfect. That's a Volleyball Brain.":quiz.right>=6?"Sharp. A couple more and you've got them all.":"Good start. Every round picks new questions."} +${fe} feathers${nb?" · new best":""}.</p><button class="btn primary" type="button" id="qzAgain">Play again</button></div>`;quiz=null;return;}
  const q=quiz.qs[quiz.i];P.innerHTML=`<div class="nquiz"><div class="row" style="justify-content:space-between"><span class="kicker">Question ${quiz.i+1} of ${quiz.qs.length} · ${q.f==="att"?"attack":q.f==="def"?"defence":"the game"}</span><span class="stat">${quiz.right} right · best ${c.best.quiz}</span></div>
    <div class="qbar"><i style="width:${quiz.i/quiz.qs.length*100}%"></i></div><h3>${esc(q.q)}</h3><div class="qopts">${q.opts.map((o,i)=>{const pk=quiz.picked;const cls=pk==null?"":o.ok?"ok":pk===i?"bad":"";return `<button type="button" class="qo ${cls}" data-qo="${i}" ${pk!=null?"disabled":""}>${esc(o.t)}</button>`;}).join("")}</div>
    ${quiz.picked!=null?`<p class="qexp" role="status">${q.opts[quiz.picked].ok?"<b>Right!</b> ":"<b>Not quite.</b> "}${esc(q.e)}</p><button class="btn primary" type="button" id="qzNext">${quiz.i+1<quiz.qs.length?"Next question":"See my score"}</button>`:""}</div>`;}
document.addEventListener("click",e=>{if(!e.target.closest("#nPanel"))return;const b=e.target.closest("button");if(!b)return;
  if(b.dataset.qo!=null&&quiz&&quiz.picked==null){quiz.picked=+b.dataset.qo;const ok=quiz.qs[quiz.i].opts[quiz.picked].ok;if(ok)quiz.right++;sfx(ok?"perfect":"miss");quizRender();const n=$("#qzNext");n&&n.focus();return;}
  if(b.id==="qzNext"&&quiz){quiz.i++;quiz.picked=null;quizRender();return;}
  if(b.id==="qzAgain"){quizStart($("#nPanel"));}});

/* ---------- hooks ---------- */
window.addEventListener("hashchange",()=>{applySkin();if(!/^#nest/.test(location.hash))stopGame();if(/^#profile/.test(location.hash))setTimeout(renderCodeCard,450);});
function boot(){applySkin();renderCodeCard();if(on())checkBadges(true);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,0));else setTimeout(boot,0);
/* the cloud copy can replace the state after start-up: re-apply then */
setInterval(()=>{const want=on()&&G().skin!==false?"crow":"";if((document.documentElement.dataset.skin||"")!==want||(on()&&document.documentElement.dataset.crow!==who()))applySkin();},2000);

VB.crow={on,owned,need,hash,titleText,accent,render,renderCodeCard,applySkin,unlock,sfx,TITLES,PEOPLE};
})();
