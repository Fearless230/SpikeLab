/* crows.js: the secret Crow's Nest.
   A secret code on the Profile page unlocks a personal edition for one player: a black-and-colour site skin, kits, volleyballs,
   ball effects, titles and backgrounds, and the #nest page: a welcome-back boot screen, five arcade games on the engine in
   crows-arcade.js (Dig Defence, Freak Quick, Jump Serve, Block Party, Setter's Vision: three difficulties, a daily
   challenge), a volleyball quiz with three modes, a daily training camp with a challenge drill, a two-part season road
   against invented rival teams, a skill chart, a weekly goal, badges and a feather shop. Extra quiz questions and camp
   drills live in crows-data.js. Each code belongs to one person (PEOPLE below) with their own colours,
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
    hello:"Welcome back to the Crow's Nest. All systems are ready.",hype:["Rolling","Thunder!!"],num:"4",job:"a guardian",
    lines:["The rally isn't over until the ball touches the floor. So don't let it.","Height is a number on a chart. Heart doesn't fit on a chart.","Every great spike starts with someone who refused to let the ball drop.",
      "Read. Move. Dig. Shout. Repeat.","Be loud. A libero's voice is part of the defence.","Fall down seven times, dig the eighth.","Crows fly together. Lift your teammates up.","Sore legs today, highlight reel tomorrow.",
      "Get low, stay low, stay hungry.","You can't control the serve. You can control your first step.","The back row is where the brave ones play.","When the ball comes at you hard, smile. That's your ball."]},
  theodore:{code:"12fvo54ipfb",name:"Theodore Dias",edition:"Fearless edition",big:"FEARLESS",focus:"att",
    tag:"Fearless from the attack line",
    note:"Theodore, this one is yours. Fearless doesn't mean never missing. It means wanting the next ball anyway. Call for it, jump for it, swing for it. From your biggest fan.",
    col:{a:"#ffc21a",b:"#ff7a1a",rgb:"255,194,26",dark:"#8a5d00",btn:"#ffc21a",btnInk:"#121115",bg:"#2a2006"},
    start:{kit:"fearless",ball:"thunder",fx:"thunder",title:"fearless",bg:"sky"},
    boot:[["Approach","locked in"],["Jump","loaded"],["Fear","not found"]],
    hello:"Fearless mode is online. Let's fly.",hype:["Fearless","Spike!!"],num:"10",job:"a fearless hitter",
    lines:["Fear is just the net looking taller than it is.","Swing like the block isn't there. Then find the gap.","Every big hitter missed a thousand spikes first.","Call for the ball. Loud. Every time.",
      "Jump like the ceiling is the limit, not the net.","A fearless hitter wants the ball when the score is tied.","Land soft, swing hard.","Missed it? Next ball. Fearless means you go again.",
      "Three steps, big arms, explode.","The block is a wall until you learn where the doors are.","Hit the ball where they aren't.","Confidence is built one good rep at a time."]},
  lucille:{code:"1juvd7hsap7",name:"Lucille Yong Thevenot",edition:"Spark edition",big:"SPARK",focus:"mix",
    tag:"The spark that lights up the court",
    note:"Lucille, this page is just for you. Every great team needs someone who brings the energy when it matters most, and that's you. Keep shining, keep flying. From someone cheering for you.",
    col:{a:"#ff7a1a",b:"#ffb21a",rgb:"255,122,26",dark:"#b84a06",btn:"#c24e08",btnInk:"#ffffff",bg:"#2a1608"},
    start:{kit:"guardian",ball:"sunset",fx:"feathers",title:"spark",bg:"orange"},
    boot:[["Energy","maximum"],["Smile","switched on"],["Team spirit","overflowing"]],
    hello:"The spark is back in the Crow's Nest. Let's light it up.",hype:["Spark","Mode!!"],num:"7",job:"the team's spark",
    lines:["Energy is contagious. Be the one who starts it.","Every point is a new chance to shine.","Celebrate the small wins: they turn into big ones.","Talk, cheer, repeat. Loud teams win more.",
      "The ball doesn't know how tall you are. It only knows how hard you try.","Shake off the miss. The next ball is yours.","Bring the fire, keep it kind.","A great touch starts with happy feet.",
      "Practice like it's a final, play like it's practice.","Your best is enough. Your best gets better.","Lift the team when the score is tight.","Fly high, land soft, go again."]},
  laura:{code:"vn2h1qoh5w",name:"Laura Farmer",edition:"Captain edition",big:"CAPTAIN",focus:"mix",
    tag:"Leads from the front",
    note:"Laura, this page is just for you. Captains aren't the loudest or the tallest: they're the ones everyone looks to when it gets hard. Keep leading, keep flying. From someone cheering for you.",
    col:{a:"#ff7a1a",b:"#ffb21a",rgb:"255,122,26",dark:"#b84a06",btn:"#c24e08",btnInk:"#ffffff",bg:"#2a1608"},
    start:{kit:"crow",ball:"crow",fx:"thunder",title:"captain",bg:"crowgym"},
    boot:[["Leadership","online"],["Game plan","loaded"],["Calm under pressure","confirmed"]],
    hello:"Captain on deck. The Crow's Nest is ready for your orders.",hype:["Captain's","Call!!"],num:"1",job:"a captain",
    lines:["A captain's first job is to make everyone else better.","Calm voice, clear calls, fast feet.","When the team is down, be the first one to clap.","Lead by doing the boring things brilliantly.",
      "Win the next point. Then the next one.","Pressure is a privilege.","Know the rotation, know the plan, know your people.","The scoreboard follows the effort.",
      "Say the name, make the call, own the ball.","Great teams aren't built on one big play, but on a thousand small ones.","Stay steady. The team takes its temperature from you.","Fly together, land together."]}
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
  if(!c.best||typeof c.best!=="object")c.best={};["dig","quick","quiz","serve","block","setter","lightning","expert"].forEach(k=>{c.best[k]=+c.best[k]||0;});
  if(!c.stats||typeof c.stats!=="object")c.stats={};if(!c.chal||typeof c.chal!=="object")c.chal={};if(!c.daily||typeof c.daily!=="object")c.daily={};
  if(!c.camp||typeof c.camp!=="object")c.camp={};["badges","bought","road"].forEach(k=>{if(!Array.isArray(c[k]))c[k]=[];});
  ["feathers","earned","digs","thunder","games","aces","dailyN"].forEach(k=>{c[k]=+c[k]||0;});if(!c.goal||typeof c.goal!=="object")c.goal={};return c;}
const save=()=>{VB.save&&VB.save();};

/* ---------- rewards ---------- */
const TITLES={crow:"Crow of Karasuno",fearless:"Fearless",spark:"The Spark",captain:"Captain",guardian:"Guardian Deity",thunder:"Rolling Thunder",quick:"Freak Quick",brain:"Volleyball Brain",ace:"Karasuno Ace",server:"Service Ace",
  giant:"Little Giant",allround:"All-Rounder",champ:"National Champion",goat:"The GOAT",
  wall:"Monster Block",setter:"Setter Genius",lightning:"Lightning Brain",libero:"Libero Focus",tool:"Block Tooler",seam:"Seam Hunter",daily:"Daily Grinder",
  legend:"World Club Legend",storm:"Eye of the Storm",iron:"Iron Platform",maestro:"The Maestro",rocket:"Rocket Arm",commander:"Floor General"};
const BGS={crowgym:"Crow gym",orange:"Orange court",sky:"Night sky court",storm:"Storm court",nationals:"Nationals arena"};
const QN=10;
const arcadeNational=c=>{const A=VB.crowArcade;return A?A.order.filter(id=>c.bestM&&c.bestM[id]&&c.bestM[id].national>0).length:0;};
const st=(c,k)=>+(c.stats&&c.stats[k])||0;
const campDays=c=>Object.values(c.camp).filter(a=>Array.isArray(a)&&a.length>=3).length;
/* skill chart, each 0 to 100 */
const SKILLS=[["Receive",c=>c.best.dig/400],["Attack",c=>c.best.quick/24],["Serve",c=>c.best.serve/120],["Block",c=>c.best.block/160],["Setting",c=>c.best.setter/260],
  ["Volleyball IQ",c=>Math.max(c.best.quiz/QN,c.best.lightning/20,c.best.expert/15)],["Grit",c=>(campDays(c)+Object.keys(c.chal||{}).length)/24],["Energy",c=>(c.thunder+c.games)/120]];
const skills=c=>SKILLS.map(([,f])=>Math.round(Math.max(0,Math.min(1,f(c)))*100));
/* ---------- the player card: six attributes from the Haikyuu stat chart, graded E to S ----------
   XP comes from everything you have done (lifetime), so grades only go up, slowly. Each grade is capped until you earn
   enough stars (1 to 3 per game and mode) and season wins: a stat can't pass the cap however much XP it has. */
const ATTRS=[
  ["power","Power","Kills, aces, tooled blocks and big serves",c=>st(c,"kills")*3+c.aces*4+st(c,"tools")*3+c.best.serve*2+st(c,"quickScore")+st(c,"powerSpikes")*6],
  ["jump","Jump","Stuff blocks, touches and your best block and attack games",c=>st(c,"stuffs")*5+st(c,"touches")*2+c.best.block*2+c.best.quick*5],
  ["speed","Speed","Digs, perfect digs and the Lightning quiz",c=>c.digs+st(c,"perfectDigs")*2+c.best.dig+c.best.lightning*8],
  ["tech","Technique","Perfect digs, tools, tip kills, seam aces and good leaves",c=>st(c,"perfectDigs")*2+st(c,"tools")*4+st(c,"tipKills")*4+st(c,"seams")*4+st(c,"leaves")*3],
  ["sense","Game sense","Setter reads, dumps, the quiz and Setter's Vision",c=>st(c,"reads")*5+st(c,"dumps")*4+c.best.setter*2+c.best.quiz*15+c.best.expert*10],
  ["stam","Stamina","Games played, camp days, challenge drills, daily challenges and Zones",c=>c.games*6+campDays(c)*40+Object.keys(c.chal||{}).length*30+c.dailyN*25+st(c,"zones")*5]];
const GRADES=["E","D","C","B","A","S"],GXP=[0,120,400,1000,2200,4500],RANKS=["Benchwarmer","Rookie","Starter","Regular","Ace","Monster"];
const starTotal=c=>VB.crowArcade?VB.crowArcade.starTotal(c):0,starMax=()=>VB.crowArcade?VB.crowArcade.starMax():40;
/* what it takes to lift each grade cap: [grade index, stars, season wins] */
const CAPS=[[2,4,0],[3,12,3],[4,24,7],[5,36,11]];
const gradeCap=c=>{const s=starTotal(c),w=c.road.length;let g=1;for(const [gi,ns,nw] of CAPS){if(s>=ns&&w>=nw)g=gi;else break;}return g;};
function attrs(c){const cap=gradeCap(c);return ATTRS.map(([k,l,how,f])=>{const xp=Math.max(0,Math.round(f(c)));let raw=0;while(raw<5&&xp>=GXP[raw+1])raw++;const g=Math.min(raw,cap),capped=raw>cap;
  const lo=GXP[g],hi=GXP[g+1],prog=g>=5?1:capped?1:(xp-lo)/(hi-lo);return {k,l,how,xp,g,raw,capped,prog:Math.max(0,Math.min(1,prog)),next:g>=5?null:hi};});}
const level=c=>{const t=attrs(c).reduce((a,b)=>a+b.xp,0);const lv=Math.floor(Math.sqrt(t/30))+1,lo=Math.pow(lv-1,2)*30,hi=Math.pow(lv,2)*30;return {lv,t,prog:(t-lo)/(hi-lo),need:hi-t};};
const overall=c=>{const a=attrs(c);return Math.round(a.reduce((x,y)=>x+y.g+y.prog*.999,0)/a.length*10)/10;};
function perks(){if(!on())return {win:1,dur:1,fill:1,power:1};const a=Object.fromEntries(attrs(C()).map(x=>[x.k,x.g]));
  return {win:1+.03*a.tech,dur:1+.08*a.stam,fill:1+.05*a.sense,power:1+.1*a.power};}
const GCOL=["#7a7383","#4fb3a9","#6aa7ff","#b48cff","var(--cra)","#ffd34d"];
function hexCard(c){const a=attrs(c),n=6,R=118,cx=160,cy=150,pt=(i,r)=>[cx+Math.sin(i/n*Math.PI*2)*r,cy-Math.cos(i/n*Math.PI*2)*r],ring=k=>a.map((_,i)=>pt(i,R*k).join(",")).join(" ");
  const val=x=>(x.g+(x.g>=5?0:x.prog))/5.4+.07;
  return `<svg class="kc-hex" viewBox="0 0 320 300" role="img" aria-label="Player card: ${a.map(x=>x.l+" "+GRADES[x.g]).join(", ")}">
    <defs><radialGradient id="kchg" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="rgba(var(--cra-rgb),.55)"/><stop offset="1" stop-color="rgba(var(--cra-rgb),.18)"/></radialGradient></defs>
    ${[1,2,3,4,5].map(k=>`<polygon points="${ring(k/5.4+.07)}" fill="${k%2?"rgba(255,255,255,.025)":"none"}" stroke="rgba(255,255,255,${k===5?.28:.1})" stroke-width="${k===5?1.5:1}"/>`).join("")}
    ${a.map((_,i)=>{const [x,y]=pt(i,R*(5/5.4+.07));return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.1)"/>`;}).join("")}
    ${GRADES.slice(1).map((gl,k)=>{const [x,y]=pt(0,R*((k+1)/5.4+.07));return `<text class="kc-rl" x="${x+5}" y="${y+3}">${gl}</text>`;}).join("")}
    <polygon class="kc-poly" points="${a.map((x,i)=>pt(i,R*val(x)).join(",")).join(" ")}" fill="url(#kchg)" stroke="var(--cra)" stroke-width="2.5" stroke-linejoin="round"/>
    ${a.map((x,i)=>{const [px,py]=pt(i,R*val(x));return `<circle cx="${px}" cy="${py}" r="3.5" fill="#fff"/>`;}).join("")}
    ${a.map((x,i)=>{const [lx,ly]=pt(i,R+26);return `<g transform="translate(${lx},${ly})"><text class="kc-al" y="-9" text-anchor="middle">${esc(x.l.toUpperCase())}</text><rect x="-12" y="-3" width="24" height="20" rx="4" fill="${GCOL[x.g]}"/><text class="kc-ag" y="12" text-anchor="middle">${GRADES[x.g]}</text></g>`;}).join("")}</svg>`;}
function playerCard(P){const c=C(),p=ME(),pr=VB.state.profile||{},a=attrs(c),L=level(c),ov=overall(c),oi=Math.min(5,Math.floor(ov)),cap=gradeCap(c),sT=starTotal(c),pk=perks(),A=VB.crowArcade;
  const nextCap=CAPS.find(([gi])=>gi>cap);
  P.innerHTML=`<div class="kcard">
    <div class="kc-top"><div class="kc-id">${crestSvg("kc-crest")}<div><div class="kicker">Karasuno · Player card</div><h3>${esc(p.name)}</h3><span class="kc-pos">${esc((VB.POS[pr.pos]||VB.POS.any).label)}${pr.number!=null?" · No. "+esc(pr.number):""}</span></div></div>
      <div class="kc-rank"><div class="kc-big g${oi}">${GRADES[oi]}</div><div><b>${RANKS[oi]}</b><span>Overall ${ov.toFixed(1)} / 5</span></div></div></div>
    <div class="kc-lv"><div><b>LV ${L.lv}</b><span>${L.t.toLocaleString()} XP · ${L.need.toLocaleString()} to LV ${L.lv+1}</span></div><span class="kc-bar"><i style="width:${Math.round(L.prog*100)}%"></i></span>
      <div class="kc-st"><b>${sT}<small>/${starMax()}</small></b><span>★ stars</span></div><div class="kc-st"><b>${c.road.length}<small>/${ROAD.length}</small></b><span>Match wins</span></div></div>
    <div class="kc-main">${hexCard(c)}
      <div class="kc-rows">${a.map(x=>`<div class="kc-row ${x.capped?"capped":""}"><span class="kc-g" style="background:${GCOL[x.g]}">${GRADES[x.g]}</span><div><div class="kc-rh"><b>${esc(x.l)}</b><small>${x.g>=5?"Maxed":x.capped?"Capped at "+GRADES[cap]+" · "+x.xp.toLocaleString()+" XP waiting":x.xp.toLocaleString()+" / "+x.next.toLocaleString()+" XP to "+GRADES[x.g+1]}</small></div>
        <span class="kc-bar"><i style="width:${Math.round(x.prog*100)}%;background:${GCOL[Math.min(5,x.g+1)]}"></i></span><small class="muted">${esc(x.how)}</small></div></div>`).join("")}</div></div>
    <div class="kc-foot"><div class="card"><div class="kicker">Grade caps</div><p class="small muted">Like a real player, XP alone won't make you an ace. Every grade above D is locked until you earn stars in the arcade (1 to 3 per game and difficulty, Rookie tops out at 2) and win season matches.</p>
        <ol class="kc-caps">${CAPS.map(([gi,ns,nw])=>{const ok=sT>=ns&&c.road.length>=nw;return `<li class="${ok?"ok":gi===(nextCap&&nextCap[0])?"next":""}"><span class="kc-g" style="background:${GCOL[gi]}">${GRADES[gi]}</span><div><b>${ok?"Unlocked":"Locked"}</b><small>${ns} ★${nw?` and ${nw} match wins`:""}</small></div></li>`;}).join("")}</ol></div>
      <div class="card"><div class="kicker">Perks from your grades</div><ul class="kc-perks"><li><b>+${Math.round((pk.win-1)*100)}%</b> timing windows <small>Technique</small></li><li><b>+${Math.round((pk.dur-1)*100)}%</b> Zone length <small>Stamina</small></li><li><b>+${Math.round((pk.fill-1)*100)}%</b> Zone fill speed <small>Game sense</small></li><li><b>+${Math.round((pk.power-1)*100)}%</b> Power Spike charge <small>Power</small></li></ul>
        ${A?`<div class="kicker" style="margin-top:12px">Stars by game</div><table class="arec kc-stars"><thead><tr><th>Game</th>${Object.keys(A.MODES).map(m=>`<th>${A.MODES[m].label}</th>`).join("")}</tr></thead><tbody>${Object.keys(A.STARS).map(id=>{const G2=A.games[id];if(!G2)return "";const s2=(c.stars||{})[id]||{};return `<tr><td>${esc(G2.title)}</td>${Object.keys(A.MODES).map(m=>`<td class="st">${[0,1,2].map(i=>`<i class="${i<(s2[m]||0)?"on":""}${m==="rookie"&&i===2?" cap":""}">★</i>`).join("")}</td>`).join("")}</tr>`;}).join("")}</tbody></table>`:""}</div></div></div>`;}
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
  {id:"champ",name:"National Champion",desc:"Win the Nationals final on the season road",have:c=>c.road.length,n:10,f:150,r:()=>[["title","champ"]]},
  /* v8.8: the arcade, the quiz modes, the camp challenge and the second season */
  {id:"wave10",name:"Ten waves deep",desc:"Reach wave 10 in Dig Defence",have:c=>st(c,"bestWave"),n:10,f:80,r:()=>[["title","libero"]]},
  {id:"leaves",name:"Good eye",desc:"Leave 25 deflections that fly out in Dig Defence",have:c=>st(c,"leaves"),n:25,f:40,r:()=>[]},
  {id:"perfect100",name:"Iron platform",desc:"Make 100 perfect digs",have:c=>st(c,"perfectDigs"),n:100,f:70,r:()=>[["title","iron"]]},
  {id:"tool",name:"Tool time",desc:"Tool the block 15 times in Freak Quick",have:c=>st(c,"tools"),n:15,f:50,r:()=>[["title","tool"]]},
  {id:"quick20",name:"Too fast to block",desc:"Hit a streak of 20 in Freak Quick",have:c=>c.best.quick,n:20,f:90,r:()=>[["title","rocket"]]},
  {id:"seam",name:"Seam hunter",desc:"Hit 10 seam aces in Jump Serve",have:c=>st(c,"seams"),n:10,f:50,r:()=>[["title","seam"]]},
  {id:"serve40",name:"Service pressure",desc:"Score 40 in one game of Jump Serve",have:c=>c.best.serve,n:40,f:60,r:()=>[]},
  {id:"stuff10",name:"First stuffs",desc:"Get 10 stuff blocks in Block Party",have:c=>st(c,"stuffs"),n:10,f:40,r:()=>[]},
  {id:"wall",name:"Monster block",desc:"Score 40 in one game of Block Party",have:c=>c.best.block,n:40,f:80,r:()=>[["title","wall"]]},
  {id:"reads",name:"Setter's eyes",desc:"Make 30 perfect reads in Setter's Vision",have:c=>st(c,"reads"),n:30,f:50,r:()=>[["title","commander"]]},
  {id:"setter",name:"Setter Genius",desc:"Score 80 in one game of Setter's Vision",have:c=>c.best.setter,n:80,f:80,r:()=>[["title","setter"]]},
  {id:"dumps",name:"Sneaky setter",desc:"Land 5 setter dumps",have:c=>st(c,"dumps"),n:5,f:40,r:()=>[["title","maestro"]]},
  {id:"lightning",name:"Lightning Brain",desc:"Get 15 right in a Lightning round",have:c=>c.best.lightning,n:15,f:70,r:()=>[["title","lightning"]]},
  {id:"expert",name:"Rules expert",desc:"Get 12 right in Expert mode",have:c=>c.best.expert,n:12,f:80,r:()=>[]},
  {id:"national",name:"National level",desc:"Score on National difficulty in all five arcade games",have:arcadeNational,n:5,f:120,r:()=>[["bg","storm"]]},
  {id:"daily5",name:"Daily grinder",desc:"Complete 5 daily challenges",have:c=>c.dailyN,n:5,f:60,r:()=>[["title","daily"]]},
  {id:"chal5",name:"Above and beyond",desc:"Finish 5 camp challenge drills",have:c=>Object.keys(c.chal||{}).length,n:5,f:60,r:()=>[]},
  {id:"camp14",name:"Two weeks strong",desc:"Finish the daily camp on 14 days",have:c=>campDays(c),n:14,f:120,r:()=>[["title","storm"]]},
  {id:"world",name:"World Club Champion",desc:"Win the World Club Championship on the season road",have:c=>c.road.length,n:20,f:250,r:()=>[["title","legend"],["bg","nationals"]]}
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
  {id:"spark",name:"The Spark",kind:"Title",cost:300,r:["title","spark"]},
  {id:"captain",name:"Captain",kind:"Title",cost:300,r:["title","captain"]},
  {id:"goat",name:"The GOAT",kind:"Title",cost:400,r:["title","goat"]},
  {id:"stormbg",name:"Storm court",kind:"Background",cost:450,r:["bg","storm"]},
  {id:"natbg",name:"Nationals arena",kind:"Background",cost:600,r:["bg","nationals"]},
  {id:"tooltitle",name:"Block Tooler",kind:"Title",cost:350,r:["title","tool"]},
  {id:"rockettitle",name:"Rocket Arm",kind:"Title",cost:450,r:["title","rocket"]},
  {id:"maestrotitle",name:"The Maestro",kind:"Title",cost:450,r:["title","maestro"]},
  {id:"legendtitle",name:"World Club Legend",kind:"Title",cost:1500,r:["title","legend"]}
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
  {opp:"The Kings of the Court",kind:"Nationals final",need:"Reach 60 in every skill on your skill chart",ok:c=>Math.min(...skills(c))>=60,f:100},
  /* the second season: the World Club Championship */
  {opp:"Sendai Storm",kind:"World Club · pool",need:"Score 15 in Block Party",ok:c=>c.best.block>=15,f:60},
  {opp:"Lisbon Navigators",kind:"World Club · pool",need:"Score 30 in Setter's Vision",ok:c=>c.best.setter>=30,f:60},
  {opp:"Rio Sambas",kind:"World Club · pool",need:"Reach wave 6 in Dig Defence",ok:c=>st(c,"bestWave")>=6,f:60},
  {opp:"Ankara Wolves",kind:"World Club · pool",need:"Score 30 in Jump Serve",ok:c=>c.best.serve>=30,f:60},
  {opp:"Milano Lions",kind:"Round of 16",need:"Get 15 right in a Lightning round of Volleyball IQ",ok:c=>c.best.lightning>=15,f:70},
  {opp:"Krakow Hussars",kind:"Quarter-final",need:"Hit a streak of 15 in Freak Quick",ok:c=>c.best.quick>=15,f:80},
  {opp:"Shanghai Dragons",kind:"Semi-final",need:"Complete 5 daily challenges",ok:c=>c.dailyN>=5,f:90},
  {opp:"Belo Horizonte Hawks",kind:"World Club final",need:"Score 30 in Block Party and 60 in Setter's Vision",ok:c=>c.best.block>=30&&c.best.setter>=60,f:120},
  {opp:"The All-Stars",kind:"Exhibition",need:"Score on National difficulty in all five arcade games",ok:c=>arcadeNational(c)>=5,f:120},
  {opp:"Karasuno Legends",kind:"Legends match",need:"Reach 70 in every skill on your skill chart",ok:c=>Math.min(...skills(c))>=70,f:200}
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
function sfx(kind,arg){if(!on()||G().mute)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();}catch(e){return;}
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
  else if(kind==="tick"){tone(660,.05,"triangle",0,.3);}
  else if(kind==="set"){tone(520,.06,"sine",0,.35,600);noise(.04,0,.25,3000);}
  else if(kind==="block"){noise(.18,0,1,2200);tone(110,.25,"sine",0,1,50);tone(70,.3,"square",.02,.3,40);}
  else if(kind==="chime"){/* a pentatonic step up for every point in a streak, so a long streak climbs */const n=Math.max(0,(arg|0)-1),st=[0,2,4,7,9],semi=st[n%5]+12*Math.min(2,Math.floor(n/5)),f=523.25*Math.pow(2,semi/12)*(1+(Math.random()-.5)*.01);
    tone(f,.14,"triangle",0,.32);tone(f*2,.08,"sine",.01,.12);}
  else if(kind==="zone"){noise(.6,0,.6,1400);[392,523,659,784,1047].forEach((f,i)=>tone(f,.22,"square",i*.05,.18));tone(65,.9,"sawtooth",0,.5,130);}
  else if(kind==="power"){noise(.3,0,1,5000);tone(60,.4,"sawtooth",0,.8,30);tone(1200,.2,"square",0,.2,300);}
  else if(kind==="whistle"){tone(2350,.16,"sine",0,.4,2300);tone(2350,.3,"sine",.2,.45,2250);}}

/* ---------- crow silhouette (an original simple bird shape) ---------- */
/* the crow mark, traced from the chosen logo: a diving crow, talons out (100 units tall, faces left) */
const CROW_PATH="m 53.8,0.4 c -0.2,0.3 -0.7,0.7 -1,1 c -0.3,0.3 -0.8,0.9 -1.2,1.2 c -0.3,0.4 -1.4,1.4 -2.3,2.4 c -0.9,1 -1.8,1.9 -2,2.1 c -1.2,1.3 -3.7,3.9 -4.4,4.7 c -0.5,0.5 -1.1,1.2 -1.4,1.5 c -0.9,1 -1.2,1.2 -1.2,0.9 c 0,-0.1 0,-0.1 0.1,-0.1 c 0,0 0.2,-0.2 0.3,-0.5 c 0.1,-0.3 0.2,-0.6 0.3,-0.8 c 0.2,-0.5 0.4,-1.4 0.7,-3 c 0.1,-0.4 -0.1,-0.3 -0.8,0.4 c -0.3,0.3 -0.8,0.8 -1,1.1 c -0.5,0.5 -0.6,0.6 -1.8,2 c -0.4,0.4 -0.8,0.9 -0.9,1 c -0.1,0.1 -0.4,0.5 -0.7,0.9 c -0.3,0.3 -0.5,0.6 -0.5,0.6 c -0,0 -0.1,0.1 -0.1,0.1 c 0,0.1 -0.1,0.3 -0.3,0.5 c -0.2,0.2 -0.3,0.4 -0.3,0.5 c 0,0 -0.2,0.3 -0.4,0.7 c -0.2,0.3 -0.4,0.6 -0.4,0.6 c 0,0 -0.3,0.4 -0.6,0.9 c -0.3,0.5 -0.6,0.8 -0.6,0.9 c 0,0 -0.1,0.2 -0.3,0.4 c -0.1,0.2 -0.3,0.4 -0.3,0.4 c 0,0 -0.2,0.4 -0.5,0.8 c -0.3,0.4 -0.6,0.9 -0.7,1.1 c -0.1,0.2 -1.5,2.5 -2.2,3.6 c -0.1,0.1 -0.4,0.6 -0.7,1.1 c -0.7,1.1 -0.9,1.2 -0.8,0.1 c 0,-0.4 0.2,-1.1 0.3,-1.4 c 0.2,-0.5 0.2,-0.7 0,-0.7 c -0.2,0 -1.5,1.3 -2.3,2.1 c -0.3,0.3 -0.6,0.7 -0.7,0.8 c -0.3,0.4 -1.1,1.5 -1.1,1.6 c 0,0.1 -0,0.1 -0.1,0.1 c -0.1,0 -0.3,0.3 -0.9,1.6 c -0.6,1.2 -0.9,1.8 -1.1,2.4 c -0.1,0.3 -0.2,0.7 -0.3,0.8 c -0.1,0.2 -0.1,0.4 -0.1,0.5 c 0,0.1 -0,0.3 -0.1,0.3 c -0.1,0 -0.1,0.3 -0.2,0.6 c -0,0.3 -0.1,0.6 -0.2,0.7 c -0.1,0.3 -0.3,2.1 -0.3,2.3 c 0.7,1.8 0.6,12.9 -0.1,14 c -0.2,0.3 -0.3,0.3 -1.7,0.6 c -0.2,0.1 -0.6,0.2 -0.9,0.2 c -1.4,0.4 -3.8,1.1 -4.3,1.2 c -0.2,0 -0.7,0.2 -1.1,0.3 c -0.4,0.1 -0.9,0.3 -1.1,0.3 c -1.2,0.3 -3.2,1.9 -5.9,4.8 c -2.3,2.4 -2.3,2.4 -2.3,3.8 c -0.1,1.1 -0.1,1.2 -0.3,1.6 c -0.2,0.3 -0.3,0.6 -0.4,0.6 c -0.1,0.1 -0.2,0.3 -0.4,0.5 c -0.2,0.2 -0.3,0.4 -0.3,0.5 c 0,0.1 -0,0.2 -0.1,0.2 c -0.1,0 -1.3,2.5 -1.3,2.7 c 0,0.1 -0,0.2 -0.1,0.2 c -0.1,0 -0.1,0.2 -0.1,0.3 c -0,0.1 -0.2,0.7 -0.3,1.2 c -0.5,1.8 -0.4,3 0.5,5.9 c 0.3,0.8 0.4,0.9 0.8,0.3 c 0.2,-0.3 0.4,-0.5 0.4,-0.6 c 0.1,-0.1 0.5,-0.7 1.1,-1.5 c 0.6,-0.7 1.1,-1.4 1.1,-1.5 c 0.1,-0.1 0.4,-0.4 0.7,-0.9 c 0.3,-0.4 0.6,-0.8 0.7,-0.9 c 0.1,-0.1 0.2,-0.2 0.2,-0.2 c 0,-0.8 1.9,-1.9 4.2,-2.5 c 0.4,-0.1 2.1,-0.7 2.6,-0.9 c 0.2,-0.1 0.5,-0.2 0.8,-0.3 c 0.3,-0.1 0.5,-0.2 0.5,-0.2 c 0,-0.1 0.2,-0.1 0.3,-0.1 c 0.2,0 0.5,-0.1 0.8,-0.3 c 0.3,-0.1 0.6,-0.3 0.7,-0.3 c 0.1,0 0.5,-0.1 0.9,-0.3 c 1,-0.3 1.6,-0.3 2.4,0.2 c 0.1,0.1 0.2,0.1 0.3,0.1 c 0.2,0 1.2,0.4 1.9,0.7 c 0.2,0.1 0.4,0.2 0.5,0.2 c 0.1,0 2.3,1 3.4,1.6 c 0.7,0.4 1,0.5 2.4,1.3 c 2.4,1.3 3.1,1.8 3.1,2.3 c 0,0.1 0.1,0.3 0.1,0.5 c 0.6,1.2 0.7,1.6 0.1,1.8 c -1.4,0.4 -2.7,0.6 -5.4,0.6 c -2.9,0.1 -3.7,0.5 -5.2,2.7 c -0.1,0.2 -0.3,0.4 -0.3,0.4 c -0,0 -0.1,0.1 -0.1,0.2 c -0,0.1 -0.2,0.4 -0.4,0.6 c -0.4,0.5 -1.2,1.8 -1.2,1.8 c 0,0 -0.1,0.2 -0.3,0.5 c -0.2,0.3 -0.3,0.5 -0.3,0.6 c 0,0.1 -0.1,0.2 -0.1,0.3 c -0.4,0.5 -0.5,1.4 -0.2,2.1 c 0.4,0.7 0.4,0.8 0.5,0.2 c 0,-0.2 0.1,-0.4 0.2,-0.5 c 0.1,-0 0.1,-0.1 0.1,-0.3 c 0,-0.4 0.2,-0.4 0.6,0 c 0.4,0.4 0.8,0.6 0.6,0.2 c -0.2,-0.5 -0,-1.9 0.3,-1.9 c 0,0 0.2,-0.2 0.3,-0.5 c 0.2,-0.2 0.4,-0.6 0.6,-0.9 c 0.2,-0.2 0.5,-0.6 0.6,-0.8 c 0.1,-0.2 0.3,-0.5 0.4,-0.6 c 0.1,-0.1 0.3,-0.3 0.4,-0.5 c 0.2,-0.2 0.2,-0.2 1.1,0.6 c 1,0.9 1.4,1.1 1.9,0.9 c 0.6,-0.4 0.5,0.4 -0.1,1.5 c -0.4,0.7 0.2,0.4 0.6,-0.3 c 0.6,-0.9 0.8,-1.8 0.6,-2.3 c -0.1,-0.1 -0.2,-0.4 -0.3,-0.6 c -0.1,-0.3 -0.4,-0.8 -0.7,-1.2 c -0.3,-0.4 -0.5,-0.8 -0.5,-0.8 c 0,-0.3 1.3,-0.6 3.6,-0.8 c 0.6,-0.1 1.6,-0.1 2.1,-0.2 c 1,-0.1 1.4,-0.1 1.4,0.1 c 0.1,0.9 0.1,3.4 -0,3.9 c -0.1,0.2 -0.1,0.6 -0.2,0.8 c -0.1,0.2 -0.1,0.5 -0.2,0.6 c -0.2,0.5 0,0.6 0.5,0.2 c 0.2,-0.2 0.4,-0.3 0.5,-0.3 c 0.1,0 0.1,0.3 0,0.3 c -0.1,0 -0.3,0.4 -0.5,0.8 c -0.4,0.8 -0.5,0.9 -1.1,0.9 c -0.2,0 -0.5,0 -0.6,0.1 c -0.4,0.1 -1.7,0.4 -2.7,0.5 c -1,0.2 -1.5,0.2 -2.9,0.5 c -1.1,0.2 -1.6,0.3 -2.8,0.5 c -1.5,0.2 -2.9,0.5 -2.9,0.6 c -0,0 -0.1,0.1 -0.3,0.1 c -0.1,0 -0.4,0.1 -0.7,0.2 c -1.1,0.5 -1.7,0.8 -1.8,0.8 c -0.1,0 -2.2,1 -3,1.5 c -1.8,1 -3.3,2.3 -3.8,3.3 c -0.6,1.2 -0.7,3.1 -0.2,2.3 c 0.1,-0.2 0.2,-0.4 0.2,-0.5 c 0,-0.1 0.1,-0.3 0.2,-0.3 c 0.1,-0.1 0.2,-0.2 0.2,-0.2 c 0,-0.3 0.8,-0.9 1.1,-0.8 c 0.3,0.1 1.6,-0.4 2,-0.8 c 0.2,-0.2 0.5,-0.1 0.5,0 c 0,0.1 -0.1,0.2 -0.2,0.3 c -0.1,0.1 -0.2,0.3 -0.3,0.4 c -0,0.1 -0.1,0.3 -0.2,0.4 c -0.3,0.4 -0.7,1.7 -0.6,2.5 c 0,0.8 0.2,0.9 0.4,0.1 c 0.1,-0.3 0.2,-0.5 0.3,-0.5 c 0.1,-0 0.1,-0.1 0.1,-0.1 c 0,-0.1 0.6,-1 0.7,-1.1 c 0.1,-0 0.1,-0.2 0,-0.3 c -0.1,-0.3 -0.1,-0.3 0.6,-0.2 c 0.8,0.1 1.2,-0.1 1.5,-0.5 c 0.2,-0.3 1.5,-1.6 2,-2.1 c 0.1,-0.1 0.8,-0.8 1.4,-1.4 c 1.4,-1.4 1.2,-1.4 2.2,-0.6 c 1.2,0.9 2.3,1.6 3.2,2.1 c 0.4,0.2 1.8,0.3 2.1,0.1 c 0.7,-0.4 1.3,1.3 0.6,1.8 c -0.1,0.1 -0.2,0.2 -0.2,0.2 c 0,0.1 -0.1,0.2 -0.2,0.4 c -0.7,0.8 -0.7,0.7 -0.3,0.7 c 0.6,-0.1 1.7,-1 1.7,-1.3 c 0,-0.1 0.1,-0.2 0.1,-0.3 c 0.2,-0.2 0.2,-1.8 -0.1,-2.2 c -0.2,-0.3 -0.8,-0.9 -1.4,-1.2 c -0.1,-0.1 -0.4,-0.2 -0.6,-0.4 c -0.2,-0.1 -1.1,-0.6 -2,-1.1 c -1.9,-1 -1.9,-1 -0.8,-1.1 c 0.4,-0 1,-0.1 1.3,-0.2 c 0.3,-0.1 0.8,-0.2 1.2,-0.2 c 0.4,-0.1 1,-0.2 1.4,-0.3 c 0.4,-0.1 0.9,-0.2 1.2,-0.2 c 0.3,-0 0.9,-0.2 1.3,-0.3 c 0.4,-0.1 1,-0.2 1.1,-0.2 c 0.2,0 0.4,-0 0.5,-0.1 c 0.1,-0.1 0.4,-0.1 0.7,-0.2 c 0.3,-0.1 1,-0.2 1.5,-0.3 c 0.5,-0.1 1.1,-0.3 1.4,-0.3 c 0.3,-0 0.8,-0.2 1.3,-0.3 c 0.4,-0.1 1,-0.3 1.4,-0.3 c 0.3,-0.1 0.7,-0.2 0.8,-0.2 c 0.1,-0.1 0.4,-0.1 0.6,-0.1 c 0.4,-0.1 1.3,-0.3 1.4,-0.3 c 0,-0 0,-1.3 0,-2.8 c -0,-1.5 0,-2.8 0.1,-2.8 c 0.1,0 0.7,0.6 1.4,1.3 c 1.4,1.4 1.5,1.5 1.4,1 c -0,-0.2 -0.1,-0.6 -0.2,-0.9 c -0.1,-0.3 -0.1,-0.7 -0.2,-0.8 c -0.3,-0.6 0.2,-0.3 1.1,0.7 c 1.2,1.2 1.2,1.2 1.2,0.3 c 0,-0.9 0.3,-0.8 0.9,0.6 c 0.1,0.2 0.2,0.4 0.3,0.4 c 0.1,0.1 0.1,0.2 0.1,0.2 c 0,0.1 0.1,0.2 0.2,0.4 c 0.1,0.1 0.3,0.4 0.4,0.7 c 0.1,0.2 0.3,0.6 0.4,0.8 c 0.1,0.2 0.2,0.4 0.3,0.4 c 0,0 0.2,0.3 0.4,0.7 c 0.2,0.3 0.4,0.6 0.4,0.7 c 0,0 0.2,0.3 0.3,0.5 c 0.1,0.3 0.3,0.6 0.4,0.8 c 0.6,1 1.9,3.6 1.9,3.8 c 0,0 0.1,0.2 0.1,0.4 c 0.1,0.2 0.2,0.5 0.3,0.8 c 0.1,0.3 0.2,0.6 0.3,0.7 c 0,0.1 0.2,0.6 0.3,1.1 c 0.1,0.5 0.3,1 0.3,1.1 c 0.2,0.3 3.3,3.3 5.2,4.9 c 0.2,0.2 0.5,0.4 0.6,0.6 c 0.6,0.5 0.9,0.2 0.5,-0.4 c -0.3,-0.4 -0.7,-1.1 -0.9,-1.5 c -0.1,-0.1 -0.1,-0.3 -0.2,-0.3 c -0,-0 -0.1,-0.1 -0.1,-0.2 c -0,-0.1 -0.3,-0.5 -0.5,-1 c -0.2,-0.4 -0.8,-1.5 -1.2,-2.4 c -0.4,-0.9 -0.8,-1.6 -0.9,-1.7 c -0.2,-0.4 -0.7,-1.4 -0.7,-1.6 c -0,-0.1 -0.1,-0.2 -0.2,-0.2 c -0.1,0 -0.1,-0.1 -0.1,-0.1 c 0,-0.1 -0.1,-0.3 -0.3,-0.6 c -0.3,-0.6 -0.3,-0.8 -0.2,-0.8 c 0.1,0 0.1,0 0.1,0.1 c 0,0.2 1.8,2.7 2.8,3.8 c 2.3,2.7 4.3,4.7 6.7,6.6 c 0.8,0.6 2.6,0.8 1.9,0.2 c -0.2,-0.2 -2,-2.8 -2.2,-3.1 c -0,-0.1 -0.1,-0.2 -0.2,-0.3 c -0.3,-0.3 -0.4,-0.4 -0.4,-0.5 c 0,-0 -0.3,-0.5 -0.7,-1.1 c -0.4,-0.6 -0.8,-1.3 -1,-1.6 c -0.2,-0.3 -0.6,-1 -1,-1.5 c -1,-1.5 -0.9,-1.6 0.4,-0.3 c 1.6,1.5 4.9,4.2 6.2,5.1 c 0.3,0.2 0.5,0.4 0.6,0.5 c 0.2,0.2 3.1,2.1 3.2,2.1 c 0,0 0.2,0.1 0.3,0.2 c 0.2,0.2 0.6,0.3 0.6,0.1 c 0,-0 -0.2,-0.3 -0.4,-0.5 c -0.2,-0.2 -0.8,-0.9 -1.3,-1.4 c -0.5,-0.6 -0.9,-1.1 -1,-1.2 c -0.1,-0.1 -0.3,-0.4 -0.6,-0.7 c -0.2,-0.3 -0.6,-0.7 -0.8,-1 c -0.5,-0.6 -0.9,-1.1 -2,-2.4 c -0.5,-0.6 -1.2,-1.4 -1.4,-1.7 c -0.2,-0.3 -0.5,-0.6 -0.6,-0.7 c -0.1,-0.1 -0.3,-0.4 -0.6,-0.7 c -0.8,-1 -0.4,-0.7 1.2,0.6 c 1.3,1.1 2.9,2.3 3.5,2.8 c 0.3,0.2 0.8,0.6 1.2,0.9 c 0.4,0.3 1,0.7 1.2,0.9 c 0.2,0.2 0.6,0.4 0.8,0.6 c 0.2,0.2 0.8,0.6 1.4,1 c 0.5,0.4 1.2,0.8 1.4,0.9 c 0.2,0.2 0.4,0.3 0.5,0.3 c 0,0 0.2,0.1 0.3,0.2 c 0.7,0.5 1.5,0.8 1.5,0.7 c 0,-0 -0.9,-1 -2.1,-2.1 c -3,-2.9 -3,-3 -5.1,-4.9 c -2.8,-2.7 -3.1,-2.9 -3,-3 c 0.1,-0 0.2,0.1 0.4,0.2 c 0.1,0.1 0.3,0.2 0.3,0.2 c 0,0 0.7,0.4 1.5,1 c 0.8,0.5 1.9,1.2 2.5,1.6 c 0.6,0.3 1.1,0.6 1.2,0.7 c 0.2,0.2 3.1,1.5 3.3,1.6 c 0.5,0.2 0.1,-0.3 -1.9,-2 c -0.8,-0.7 -2,-1.8 -2.4,-2.2 c -0.1,-0.1 -0.3,-0.2 -0.4,-0.3 c -0.3,-0.2 -2,-1.8 -2.5,-2.2 c -0.7,-0.6 -2.8,-2.5 -3.6,-3.2 c -1.5,-1.3 -1.7,-1.4 -1.6,-1.5 c 0,-0 0.7,0.2 1.4,0.6 c 3.4,1.7 3.5,1.7 3.3,1.4 c -0.1,-0.1 -0.2,-0.2 -0.2,-0.2 c -0.1,0 -1,-0.6 -2.1,-1.3 c -1.1,-0.7 -2.3,-1.5 -2.6,-1.7 c -0.9,-0.6 -0.8,-0.6 0.6,-0.3 c 0.4,0.1 1,0.3 1.2,0.3 c 1,0.2 1.5,0.3 1.6,0.4 c 0.1,0 0.5,0.1 1,0.3 c 0.5,0.1 1.5,0.3 2.2,0.5 c 1.8,0.4 2,0.4 2.9,0.5 c 0.4,0.1 0.9,0.1 1.1,0.2 c 0.7,0.2 0.9,0 0.8,-0.7 c -0.1,-0.6 -0.3,-1.7 -0.5,-2.2 c -0.1,-0.1 -0.1,-0.4 -0.2,-0.6 c -0.1,-0.4 -0.3,-0.6 -0.6,-0.7 c -0.1,0 -0.4,-0 -0.6,-0 c -0.4,-0 -0.2,-0.2 0.2,-0.2 c 0.4,-0 0.2,-1.1 -0.3,-1.6 c -0,-0 -0.2,-0.2 -0.3,-0.5 c -0.4,-0.5 -0.8,-1 -1.6,-1.6 l -0.6,-0.5 l -2.7,0 c -1.6,0 -3,-0 -3.5,-0.1 c -1.1,-0.2 -0.8,-0.3 0.7,-0.3 c 0.6,-0 1.4,-0.1 1.7,-0.1 c 0.3,-0.1 0.8,-0.1 1.1,-0.2 c 1.3,-0.2 1.6,-0.5 0.9,-1 c -0.1,-0.1 -0.5,-0.3 -0.7,-0.5 c -2.3,-1.9 -2.5,-2.1 -3.1,-2.1 c -1.3,0 -5.9,-0.4 -6.2,-0.5 c -0.1,-0 0.2,-0.1 0.7,-0.3 c 1.5,-0.3 2.7,-0.7 3.3,-1.1 c 0.6,-0.4 0.6,-0.3 -0.9,-1 c -0.3,-0.2 -0.9,-0.4 -1.8,-0.8 c -1.7,-0.8 -2.2,-1 -2.4,-0.8 c -0.1,0.1 -0.3,0.1 -0.4,0.1 c -0.1,0 -0.3,0 -0.3,0.1 c -0.5,0.5 -3.8,0.3 -6.1,-0.5 c -0.8,-0.3 -0.6,-0.3 0.6,-0.3 c 1.1,0 2.1,-0.2 2.5,-0.6 c 0.1,-0 0.2,-0.1 0.2,-0.1 c 0.2,0 1.9,-0.8 1.9,-0.9 c 0,-0.1 0.1,-0.2 0.2,-0.3 c 1.1,-1.2 1.1,-1.2 0.2,-1.2 c -0.6,0 -0.8,-0.1 -1.4,-0.3 c -0.4,-0.2 -0.7,-0.3 -0.8,-0.3 c -0.1,0 -0.1,-0.2 0,-0.2 c 0.1,-0 0.4,-0.1 0.8,-0.2 c 0.4,-0.1 0.8,-0.2 1,-0.3 c 0.2,-0.1 0.6,-0.2 0.9,-0.2 c 0.3,-0.1 0.7,-0.2 0.8,-0.2 c 0.7,-0.3 2.4,-0.8 2.6,-0.8 c 0.1,0 0.2,-0 0.3,-0.1 c 0.1,-0.1 1,-0.4 1.3,-0.4 c 0.3,0 0.3,-0.3 -0.1,-0.4 c -0.2,-0 -0.5,-0.1 -0.7,-0.2 c -0.2,-0.1 -0.7,-0.2 -1.1,-0.2 c -1.1,-0.2 -1.1,-0.3 0.1,-0.5 c 1.2,-0.2 2.1,-0.4 2.9,-0.7 c 0.3,-0.1 0.7,-0.2 0.9,-0.3 c 0.5,-0.1 1.1,-1 1.1,-1.5 c 0,-0.4 0.1,-0.4 0.8,-0.5 c 0.8,-0.1 2.6,-0.4 3.6,-0.7 c 0.2,-0.1 0.6,-0.2 0.9,-0.2 c 0.3,-0.1 0.8,-0.2 1.1,-0.3 c 0.3,-0.1 0.8,-0.2 1.1,-0.3 c 0.3,-0.1 0.9,-0.2 1.4,-0.3 c 1.9,-0.5 2.4,-0.6 3.5,-0.8 c 0.6,-0.2 1.2,-0.3 1.4,-0.3 c 0.1,-0 0.3,-0.1 0.5,-0.2 c 0.2,-0.2 0.2,-0.2 -0.2,-0.1 c -0.4,0.1 -4.3,0.2 -5.8,0.2 c -1.4,0 -1.1,-0.2 0.6,-0.4 c 0.6,-0.1 1.2,-0.1 1.3,-0.2 c 0.1,-0 0.6,-0.1 1.2,-0.2 c 0.6,-0.1 1.3,-0.2 1.7,-0.3 c 0.4,-0.1 1.1,-0.2 1.5,-0.3 c 0.4,-0.1 1.4,-0.2 2,-0.4 c 0.7,-0.1 1.4,-0.3 1.7,-0.4 c 1.2,-0.2 1.5,-0.3 2.1,-0.4 c 0.4,-0.1 0.9,-0.2 1.2,-0.3 c 0.3,-0.1 0.7,-0.1 0.9,-0.2 c 0.2,-0.1 0.7,-0.2 1,-0.3 c 0.3,-0.1 0.8,-0.2 1,-0.3 c 0.2,-0.1 0.5,-0.2 0.7,-0.2 c 0.2,-0 0.6,-0.2 1,-0.3 c 0.6,-0.2 1.2,-0.3 1.9,-0.4 c 0.2,-0 0.4,-0.1 0.4,-0.2 c 0.1,-0.1 -0.8,-0.1 -1.8,0.1 c -0.3,0.1 -0.9,0.2 -1.4,0.2 c -0.4,0.1 -1.1,0.1 -1.4,0.2 c -0.3,0.1 -1.1,0.2 -1.7,0.3 c -0.6,0.1 -1.8,0.2 -2.6,0.4 c -0.8,0.1 -1.9,0.2 -2.5,0.3 c -0.6,0.1 -1.4,0.2 -1.9,0.2 c -0.4,0.1 -1.4,0.1 -2.2,0.2 c -0.7,0.1 -1.7,0.2 -2,0.2 c -1.3,0.2 -5.5,0.5 -5.3,0.3 c 0.1,-0.1 1.3,-0.4 2.9,-0.6 c 0.3,-0.1 0.7,-0.1 1,-0.2 c 0.2,-0.1 0.8,-0.2 1.3,-0.3 c 0.5,-0.1 1.1,-0.3 1.3,-0.3 c 0.5,-0.1 2,-0.5 2.5,-0.6 c 0.2,-0.1 0.6,-0.1 0.8,-0.2 c 0.2,-0.1 0.6,-0.1 0.8,-0.2 c 0.9,-0.2 1.3,-0.3 1.4,-0.4 c 0.1,-0.1 0.2,-0.1 0.3,-0.1 c 0.1,0 0.3,-0 0.5,-0.1 c 0.1,-0.1 0.6,-0.2 1.1,-0.4 c 0.5,-0.2 1.1,-0.3 1.3,-0.4 c 0.2,-0.1 0.5,-0.2 0.8,-0.3 c 0.2,-0.1 0.5,-0.2 0.5,-0.2 c 0.1,-0 0.3,-0.1 0.6,-0.2 c 0.9,-0.3 1.9,-0.7 2.7,-1.1 c 0.4,-0.2 1,-0.5 1.2,-0.6 c 1.1,-0.5 3,-2 2.7,-2.1 c -0.1,-0 -0.5,0.1 -0.9,0.3 c -1,0.4 -2.1,0.8 -2.2,0.8 c -0.1,0 -0.2,0 -0.3,0.1 c -0.2,0.1 -1.3,0.4 -2.5,0.7 c -0.2,0.1 -0.5,0.1 -0.7,0.2 c -0.2,0 -0.6,0.2 -1,0.3 c -0.4,0.1 -0.8,0.2 -0.9,0.3 c -0.1,0.1 -0.6,0.2 -1,0.3 c -0.4,0.1 -1.1,0.2 -1.4,0.3 c -0.3,0.1 -0.8,0.2 -1.1,0.2 c -0.8,0.1 -2.7,0.5 -2.8,0.6 c -0.1,0.1 -0.7,0.1 -0.7,-0 c 0,-0.1 0.2,-0.1 0.3,-0.2 c 0.2,-0 0.5,-0.2 0.7,-0.3 c 0.2,-0.1 0.5,-0.2 0.5,-0.2 c 0.2,0 3.6,-1.9 4.1,-2.2 c 0.1,-0.1 1.1,-0.7 2.1,-1.4 c 2.3,-1.5 3,-2.2 1.5,-1.4 c -0.2,0.1 -0.4,0.2 -0.4,0.2 c -0.1,0 -0.3,0.1 -0.5,0.2 c -0.2,0.1 -0.6,0.2 -0.8,0.3 c -0.2,0.1 -0.4,0.2 -0.6,0.2 c -0.5,0.2 -1.7,0.6 -2.8,1 c -0.6,0.2 -1.3,0.4 -1.4,0.4 c -0.2,0.1 -2.1,0.7 -3.2,1 c -0.1,0 -0.5,0.1 -0.8,0.2 c -0.3,0.1 -0.6,0.2 -0.8,0.2 c -0.3,0.1 -1.5,0.5 -2.7,0.8 c -0.5,0.1 -1.1,0.3 -1.3,0.3 c -0.3,0.1 -0.5,0.1 -1.5,0.4 c -0.9,0.2 -1.3,0.3 -1.5,0.4 c -0.3,0.1 -0.8,0.2 -0.8,0.1 c -0.1,-0.1 0.1,-0.2 0.8,-0.6 c 1.1,-0.6 1.9,-1.1 2,-1.2 c 0.1,-0.1 0.4,-0.3 0.7,-0.5 c 0.3,-0.2 0.8,-0.5 1.1,-0.7 c 0.3,-0.2 1,-0.6 1.5,-0.9 c 0.5,-0.3 1.3,-0.7 1.6,-1 c 0.3,-0.2 0.7,-0.4 0.7,-0.4 c 0,0 0.2,-0.1 0.4,-0.2 c 0.2,-0.1 0.4,-0.3 0.5,-0.3 c 2.4,-1.4 5.1,-4 5.1,-4.9 c 0,-0.1 0.1,-0.2 0.2,-0.2 c 0.4,-0.3 0.1,-0.6 -0.3,-0.3 c -0.3,0.2 -2.2,1.4 -2.8,1.7 c -0.2,0.1 -0.8,0.5 -1.4,0.8 c -0.6,0.3 -1.6,0.9 -2.2,1.2 c -1.1,0.6 -1.5,0.8 -2.9,1.6 c -1.9,1.1 -5.8,3 -8.9,4.6 c -1.3,0.6 -1.1,0.4 0.6,-0.8 c 0.6,-0.4 1.2,-0.9 1.4,-1.1 c 0.2,-0.2 0.4,-0.4 0.5,-0.5 c 1,-0.9 3.6,-4 3.6,-4.3 c 0,-0.1 0.1,-0.1 0.1,-0.1 c 0.1,0 0.2,-0.1 0.2,-0.3 c 0.1,-0.2 0.2,-0.4 0.3,-0.6 c 0.2,-0.3 0.5,-0.8 0.5,-0.8 c 0,-0.2 -0.9,0.5 -2,1.5 c -0.1,0.1 -0.3,0.2 -0.5,0.4 c -0.2,0.2 -0.5,0.4 -0.5,0.5 c -0.2,0.2 -1.7,1.4 -2.4,1.9 c -0.3,0.3 -0.8,0.6 -1.1,0.9 c -0.5,0.4 -2,1.5 -2.4,1.7 c -0.1,0.1 -0.3,0.2 -0.5,0.4 c -0.2,0.1 -0.4,0.3 -0.5,0.4 c -0.1,0.1 -0.5,0.3 -0.9,0.6 c -0.4,0.3 -0.8,0.5 -0.8,0.5 c -0.1,0 -1.1,0.7 -1.3,0.8 c -0.2,0.2 -1,0.6 -2.3,1.3 c -0.7,0.3 -1.3,0.7 -1.5,0.7 c -0.1,0.1 -0.6,0.3 -1.1,0.4 c -0.4,0.2 -0.9,0.4 -1,0.4 c -0.5,0.3 -1.8,0.7 -2.6,0.8 c -0.3,0.1 -0.8,0.2 -1.3,0.3 c -1.1,0.2 -2,0.2 -1.5,-0 c 0.2,-0.1 0.5,-0.2 0.8,-0.2 c 2,-0.3 5.5,-1.9 7.5,-3.6 c 1.6,-1.3 3.5,-3.6 4.1,-4.9 c 0.3,-0.7 0.2,-0.6 -1.1,0.7 c -1.2,1.2 -3.3,2.9 -4.2,3.5 c -0.2,0.2 -0.8,0.5 -1.2,0.8 c -0.4,0.3 -0.8,0.5 -0.8,0.5 c -0.1,0 -0.2,0.1 -0.4,0.2 c -0.4,0.3 -2.1,1.1 -2.8,1.4 c -0.6,0.2 -1,0.3 -0.6,0 c 0.9,-0.5 1.1,-0.6 1.5,-1 c 0.7,-0.7 0.8,-1 0.5,-2.4 c -0.2,-1.3 -0.2,-1.3 -0.6,-1.2 c -0.2,0 -0.6,0.1 -0.9,0.2 c -0.3,0.1 -1,0.2 -1.6,0.3 c -1.5,0.3 -1.9,0.2 -0.6,-0.2 c 0.3,-0.1 0.7,-0.3 1,-0.4 c 0.2,-0.1 1.1,-0.5 2,-1 c 0.9,-0.4 1.6,-0.8 1.7,-0.9 c 0.2,-0.3 0.4,-1.3 0.4,-1.9 c 0,-0.3 0.1,-0.9 0.2,-1.2 c 0.1,-0.3 0.1,-0.6 0.1,-0.7 c -0.1,-0.1 -0.7,0 -0.9,0.1 c -0.1,0.1 -0.2,0.1 -0.3,0 c -0.3,-0.1 -0.1,-0.2 0.9,-0.5 c 0.9,-0.3 1.2,-0.5 1.2,-0.8 c 0,-0.1 0.1,-0.6 0.3,-1 c 0.1,-0.4 0.3,-0.9 0.3,-1 c 0,-0.1 0.1,-0.3 0.1,-0.5 c 0,-0.1 0.1,-0.4 0.2,-0.5 c 0.1,-0.2 0.3,-0.5 0.5,-0.8 c 0.5,-0.8 0.5,-0.8 -0.6,-0.6 c -0.5,0.1 -0.6,0.1 -0.7,0 c -0.1,-0.1 -0.1,-0.1 0.1,-0.1 c 0.1,0 0.3,-0.1 0.5,-0.2 c 0.1,-0.1 0.3,-0.2 0.4,-0.2 c 0.3,0 0.8,-0.2 1.2,-0.4 c 0.2,-0.1 0.4,-0.1 0.5,-0.1 c 0.1,0 0.4,-0.1 0.6,-0.2 c 0.2,-0.1 0.5,-0.2 0.6,-0.2 c 0.1,0 0.3,-0.1 0.6,-0.3 c 0.2,-0.1 0.4,-0.3 0.5,-0.3 c 0.1,0 1.2,-0.6 1.8,-0.9 c 1.2,-0.7 2.5,-1.8 2.5,-2.1 c 0,-0.1 -0.5,-0.1 -1.6,0.1 c -1.6,0.3 -1.7,0.2 -0.6,-0.2 c 1.7,-0.7 3.6,-2.1 3.6,-2.5 c 0,-0.1 -1,-0.1 -1.3,0.1 c -0.1,0.1 -0.5,0.1 -0.9,0.2 c -1.1,0.1 -1.4,0.2 -1.8,0.3 c -0.7,0.2 -0.8,-0 -0.1,-0.3 c 3.1,-1.1 6,-3 7.5,-5 c 0.7,-1 0.5,-1.1 -0.8,-0.6 c -0.3,0.1 -0.8,0.3 -1.1,0.4 c -0.7,0.2 -1.8,0.6 -1.9,0.7 c -0.1,0 -0.2,0.1 -0.4,0.1 c -0.2,0 -0.5,0.2 -0.7,0.3 c -0.2,0.1 -0.5,0.2 -0.6,0.2 c -0.1,0 -0.2,0 -0.2,0.1 c -0.1,0.1 -1.1,0.4 -2.9,1.1 c -0.5,0.2 -1.1,0.4 -1.2,0.4 c -0.1,0 -0.4,0.1 -0.6,0.2 c -0.2,0.1 -0.6,0.2 -0.8,0.3 c -0.2,0.1 -0.5,0.2 -0.6,0.2 c -0.6,0.2 -1.1,0.4 -1.4,0.5 c -0.5,0.1 -0.7,0.2 -1.2,0.4 c -0.4,0.2 -0.6,0.1 -0.5,-0.1 c 0.1,-0.1 2.3,-1.6 4.5,-3.1 c 2.4,-1.6 3.1,-2.2 4.7,-3.5 c 2.2,-1.9 5.5,-5.9 6.3,-7.4 c 0,-0.1 0.3,-0.4 0.5,-0.8 c 0.3,-0.4 0.5,-0.7 0.5,-0.8 c 0,-0.1 -0.4,-0 -0.5,0.1 c -0.1,0.2 -0.8,0.6 -1.7,1.2 c -0.3,0.2 -0.8,0.5 -1.3,0.8 c -0.5,0.3 -1,0.6 -1.1,0.6 c -0.1,0.1 -0.4,0.2 -0.7,0.4 c -0.3,0.2 -0.6,0.4 -0.9,0.6 c -2,1.3 -2.8,1.8 -3.8,2.4 c -0.6,0.4 -1.2,0.7 -1.3,0.7 c -0.1,0 -0.1,0 -0.2,0.1 c -0,0.1 -0.6,0.5 -1.4,0.9 c -0.7,0.5 -1.7,1 -2,1.3 c -0.9,0.6 -1.7,1.1 -2.2,1.4 c -0.2,0.1 -0.5,0.3 -0.6,0.4 c -0.1,0.1 -0.3,0.2 -0.4,0.3 c -0.4,0.1 -0.2,-0.2 1.3,-1.8 c 0.2,-0.2 0.4,-0.4 0.5,-0.5 c 0.1,-0.1 0.4,-0.5 0.7,-0.8 c 0.5,-0.6 1,-1.1 2.3,-2.5 c 0.7,-0.8 2.3,-2.5 2.8,-3 c 0.7,-0.7 2.4,-4.1 2.7,-5.2 c 0,-0.2 0.2,-0.4 0.3,-0.6 c 0.1,-0.2 0.3,-0.6 0.4,-1 c 0.1,-0.4 0.3,-0.7 0.3,-0.9 c 0.7,-1.1 0.2,-1 -1.1,0.3 c -1.6,1.5 -3.1,2.9 -3.9,3.7 c -1.1,1 -3.4,3.1 -5.5,5.2 c -0.6,0.6 -1.3,1.2 -1.4,1.3 c -0.1,0.1 -0.9,0.8 -1.6,1.6 c -1.5,1.5 -2.3,1.9 -1.2,0.6 c 0.3,-0.4 0.6,-0.7 0.6,-0.8 c 0,-0.1 0.1,-0.2 0.2,-0.3 c 0.1,-0.1 0.3,-0.4 0.5,-0.6 c 0.1,-0.2 0.3,-0.4 0.3,-0.4 c 0.1,0 0.1,-0.1 0.2,-0.2 c 0.1,-0.4 0.9,-1.4 1,-1.4 c 0.1,0 0.1,-0.1 0.1,-0.2 c 0,-0.1 0.1,-0.3 0.3,-0.5 c 0.2,-0.2 0.3,-0.4 0.3,-0.5 c 0,-0.1 0.8,-1.1 0.9,-1.3 c 0.1,-0.1 1.4,-2 1.8,-2.7 c 0.6,-1 1.3,-2.7 1.5,-3.4 c 0,-0.2 0.1,-0.5 0.2,-0.6 c 0.1,-0.3 0.2,-1.9 0,-1.9 c -0.1,-0 -0.3,0.2 -0.5,0.4 z m -44,62.2 c 0.5,0.2 0.9,0.9 0.5,0.9 c -0.4,0 -2.1,1 -2.3,1.3 c -0,0.1 -0.2,0.1 -0.3,0.1 c -0.3,0 -0.3,-0.3 0.1,-0.8 c 0.2,-0.3 0.3,-0.5 0.3,-0.5 c 0,-0.6 1.1,-1.2 1.8,-1 z";
const crowSvg=(cls)=>`<svg class="${cls||"crowic"}" viewBox="-2 -2 97 104" aria-hidden="true"><path d="${CROW_PATH}" fill="currentColor"/></svg>`;
const perchSvg=crowSvg;
let crestN=0;
/* the Karasuno crest: ringed seal, perched crow, ribbon. Accent comes from currentColor */
const crestSvg=(cls,word)=>{const id="crst"+(++crestN),w=esc(word||"FLY");return `<svg class="${cls||"crest"}" viewBox="0 0 120 120" aria-hidden="true">
  <defs><path id="${id}t" d="M60 60 m-43 0 a43 43 0 1 1 86 0"/><path id="${id}b" d="M60 60 m-47 0 a47 47 0 0 0 94 0"/><radialGradient id="${id}g" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#2a2530"/><stop offset="1" stop-color="#0d0c10"/></radialGradient></defs>
  <circle cx="60" cy="60" r="57" fill="#0d0c10" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="51" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="1.6 2.4" opacity=".7"/>
  <circle cx="60" cy="60" r="36" fill="url(#${id}g)" stroke="currentColor" stroke-width="1.6"/>
  <text font-family="var(--display),Impact,sans-serif" font-size="10.5" font-weight="800" letter-spacing="3.2" fill="currentColor"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">KARASUNO</textPath></text>
  <text font-family="var(--display),Impact,sans-serif" font-size="6.4" font-weight="700" letter-spacing="2.2" fill="#f4efe6" opacity=".75"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">VOLLEYBALL CLUB</textPath></text>
  <g fill="currentColor"><path d="M15 60l-4 -2.6v5.2zM105 60l4 -2.6v5.2z"/></g>
  <g transform="translate(33.5 20) scale(.58)"><path d="${CROW_PATH}" fill="currentColor"/></g>
  <path d="M33 82h54l-5 6 5 6H33l5-6z" fill="currentColor"/><text x="60" y="91.6" text-anchor="middle" font-family="var(--display),Impact,sans-serif" font-size="8" font-weight="900" letter-spacing="2.4" fill="#0d0c10">${w}</text></svg>`;};
function crowAt(g,x,y,s,flip,col){g.save();g.translate(x,y);const k=s*.6;g.scale(flip?-k:k,k);g.translate(-46.5,-50);g.fillStyle=col;g.fill(new Path2D(CROW_PATH));g.restore();}
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
VB.genBgExtra.storm=function(g,W,H){const A=on()?ME().col.a:"#ff7a1a",bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#05060c");bg.addColorStop(.5,"#151a2b");bg.addColorStop(1,"#0b0a0c");g.fillStyle=bg;g.fillRect(0,0,W,H);
  /* clouds */for(let i=0;i<40;i++){const x=Math.random()*W,y=Math.random()*H*.45,r=60+Math.random()*140,c=g.createRadialGradient(x,y,0,x,y,r);c.addColorStop(0,"rgba(60,66,90,.55)");c.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=c;g.fillRect(x-r,y-r,r*2,r*2);}
  const bolt=(x,y,len,w,col)=>{g.save();g.strokeStyle=col;g.shadowColor=A;g.shadowBlur=30;g.lineWidth=w;g.beginPath();g.moveTo(x,y);let cx=x,cy=y;while(cy<y+len){cx+=(Math.random()-.5)*70;cy+=18+Math.random()*34;g.lineTo(cx,cy);if(Math.random()<.18){g.moveTo(cx,cy);g.lineTo(cx+(Math.random()-.5)*120,cy+60);g.moveTo(cx,cy);}}g.stroke();g.restore();};
  bolt(W*.3,0,H*.62,5,"#fff6d6");bolt(W*.72,0,H*.5,3,"#ffe3b0");
  /* rain */g.strokeStyle="rgba(180,200,255,.15)";g.lineWidth=1;for(let i=0;i<260;i++){const x=Math.random()*W,y=Math.random()*H;g.beginPath();g.moveTo(x,y);g.lineTo(x-6,y+22);g.stroke();}
  floorLines(g,W,H,A,5);for(let i=0;i<6;i++)crowAt(g,W*(.08+i*.17),H*(.12+(i%3)*.08),.7+(i%2)*.4,i%2===0,"rgba(0,0,0,.75)");};
VB.genBgExtra.nationals=function(g,W,H){const A=on()?ME().col.a:"#ff7a1a",bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#030305");bg.addColorStop(1,"#1a1216");g.fillStyle=bg;g.fillRect(0,0,W,H);
  /* tiers of seats with phone lights */for(let r=0;r<9;r++){const y=H*(.08+r*.055);g.fillStyle=`rgba(${30+r*4},${24+r*3},${32+r*4},1)`;g.fillRect(0,y,W,H*.05);for(let i=0;i<70;i++){if(Math.random()<.25){g.fillStyle=Math.random()<.2?A:"rgba(255,250,230,.8)";g.fillRect(Math.random()*W,y+Math.random()*H*.04,2,2);}}}
  /* spotlights */[.2,.5,.8].forEach((x,i)=>{const gr=g.createLinearGradient(W*x,0,W*.5,H*.75);gr.addColorStop(0,"rgba(255,240,210,.35)");gr.addColorStop(1,"rgba(255,240,210,0)");g.fillStyle=gr;g.beginPath();g.moveTo(W*x-10,0);g.lineTo(W*x+10,0);g.lineTo(W*.5+160,H*.78);g.lineTo(W*.5-160,H*.78);g.closePath();g.fill();});
  /* the court glows */const cf=g.createRadialGradient(W*.5,H*.78,10,W*.5,H*.78,W*.5);cf.addColorStop(0,"rgba(255,150,70,.45)");cf.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=cf;g.fillRect(0,0,W,H);floorLines(g,W,H,"#f4efe6",5);
  g.fillStyle=A;g.font="italic 800 64px 'Barlow Condensed','Arial Narrow',sans-serif";g.textAlign="center";g.fillText("NATIONALS",W*.5,H*.62);};

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
  const c=C(),p=ME();host.className="card crowcode on";host.innerHTML=`<div class="cchead">${crestSvg("ccbird")}<div><div class="kicker">${esc(p.edition)} · ${esc(p.name)}</div><b class="cctitle">${esc(titleText()||p.tag)}</b></div></div>
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
    <div class="ci-body"><div class="ci-k">Secret code accepted · ${esc(p.edition)}</div>${crestSvg("ci-crow","FLY HIGH")}<div class="ci-l1">Welcome to</div><div class="ci-l2">KARASUNO</div>
     <div class="ci-name">${parts.map(w=>`<span>${esc(w)}</span>`).join("")}</div>
     <p class="ci-sub">Secret colours · your own kit · new balls and effects · titles · 5 arcade games · two seasons to win</p>
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
      </svg>${crestSvg("cb-crow")}<div class="cb-pct" id="cbPct">0%</div></div>
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
  sfx("thunder");const ov=document.createElement("div");ov.className="rt";ov.setAttribute("aria-hidden","true");const hy=ME().hype||["Rolling","Thunder!!"];
  ov.innerHTML=`<svg class="rt-bolt" viewBox="0 0 400 120"><path d="M0 70 L120 40 L105 62 L260 22 L240 52 L400 10 L250 78 L268 56 L110 98 L128 74 Z"/></svg><div class="rt-t"><span>${esc(hy[0].toUpperCase())}</span><span>${esc(hy[1].toUpperCase())}</span></div>`;
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
function campToday(){const f=ME().focus,mine=CAMP.filter(q=>f==="mix"?q.f!=="all":q.f===f),all=CAMP.filter(q=>q.f==="all"),s=parseInt(hash("camp"+today()+who()),36);
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

/* extra questions and drills from crows-data.js; the original questions count as medium difficulty */
QUIZ.forEach(q=>{if(!q.d)q.d=2;});
if(VB.CROW_DATA){(VB.CROW_DATA.quiz||[]).forEach(q=>QUIZ.push(q));(VB.CROW_DATA.camp||[]).forEach(q=>CAMP.push(q));}
const CHALLENGE=(VB.CROW_DATA&&VB.CROW_DATA.challenge)||[];
const chalToday=()=>CHALLENGE.length?CHALLENGE[parseInt(hash("chal"+today()+who()),36)%CHALLENGE.length]:null;

/* ---------- the Nest page ---------- */
const TABS=[["card","Player card"],["dig","Dig Defence"],["quick","Freak Quick"],["serve","Jump Serve"],["block","Block Party"],["setter","Setter's Vision"],["iq","Volleyball IQ"],["camp","Training camp"],["season","Season"],["badges","Badges and shop"],["style","Style"]];
const ARCADE=["dig","quick","serve","block","setter"];
/* the Nest's helpers, handed to the arcade engine */
const KIT={C:()=>C(),G:()=>G(),ME:()=>ME(),who:()=>who(),save:()=>save(),award:n=>award(n),sfx:(k,a)=>sfx(k,a),perks:()=>perks(),checkBadges:()=>checkBadges(),refreshStats:()=>refreshStats(),
  crowAt:(...a)=>crowAt(...a),crestSvg:(c,w)=>crestSvg(c,w),perchSvg:c=>perchSvg(c),featherAt:(...a)=>featherAt(...a),isNest:()=>isNest(),reduced:()=>reduced(),today:()=>today(),hash:x=>hash(x),col:()=>ORANGE,rgb:()=>ME().col.rgb};
if(VB.crowArcade)VB.crowArcade.K=KIT;
let tab=null,loopOn=false,game=null,bgFx=null,quiz=null,skipBoot=false;
const isNest=()=>{const v=$("#v-nest");return v&&!v.hidden;};
function render(sub){const host=$("#v-nest");if(!host)return;if(!on()){location.hash="#profile";return;}
  const p=ME();if(sub&&TABS.some(t=>t[0]===sub))tab=sub;if(!tab)tab=p.focus==="att"?"quick":"dig";const c=C(),pr=VB.state.profile||{},parts=p.name.toUpperCase().split(/\s+/);
  stopGame();
  host.innerHTML=`<div class="nhero"><canvas class="nfx" aria-hidden="true"></canvas><div class="nbig" aria-hidden="true">${esc(p.big)}</div>
    <div class="wrap nhwrap"><div class="nkick">${perchSvg("nk")}<span>${esc(p.edition)} · Crow's Nest</span></div>
      <h1 class="nname">${parts.map(w=>`<span>${esc(w)}</span>`).join("")}</h1>
      <div class="ntitle"><b id="nTitle">${esc(titleText()||p.tag)}</b><span>${esc((VB.POS[pr.pos]||VB.POS.any).label)}${pr.number!=null?" · No. "+esc(pr.number):""}</span></div>
      <p class="nline">“${esc(p.lines[dayIdx(p.lines.length,who())])}”</p>
      <div class="nstats" id="nStats"></div>
      <div class="row nbtns"><button class="btn rtbtn" type="button" id="rtBtn"><span>${esc((p.hype||["Rolling","Thunder!!"]).join(" ").replace(/!!$/,"!"))}</span></button><button class="btn sm ghost" type="button" id="nMute" aria-pressed="${!!G().mute}">${G().mute?"Sound off":"Sound on"}</button><a class="btn sm ghost" href="#profile">Back to profile</a></div></div></div>
    <div class="wrap nwrap"><div class="nnote">${crowSvg("nnb")}<div><div class="kicker">A note for you</div><p>${esc(p.note)}</p></div></div>
      <div class="ntabs" role="tablist" aria-label="Crow's Nest">${TABS.map(([k,l])=>`<button type="button" role="tab" data-nt="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>
      <div id="nPanel" role="tabpanel"></div></div>`;
  refreshStats();panel();startLoop();if(!skipBoot)bootScreen();skipBoot=false;}
function refreshStats(){const el=$("#nStats");if(!el)return;const c=C(),nm=ROAD[c.road.length];
  el.innerHTML=`<div><b>${c.feathers}</b><span>Feathers</span></div><div><b>${c.badges.length}/${BADGES.length}</b><span>Badges</span></div><div><b>${c.road.length}/${ROAD.length}</b><span>Season</span></div><div class="nrank"><b>${GRADES[Math.min(5,Math.floor(overall(c)))]}</b><span>LV ${level(c).lv} · ${RANKS[Math.min(5,Math.floor(overall(c)))]}</span></div><div><b>${starTotal(c)}</b><span>★ Stars</span></div><div><b>${campDays(c)}</b><span>Camp days</span></div>${nm?`<div class="nnext"><b>vs ${esc(nm.opp)}</b><span>Next match · ${esc(nm.need)}</span></div>`:""}`;
  const t=$("#nTitle");if(t)t.textContent=titleText()||ME().tag;renderCodeCard();}
function gameHead(k,title,best,desc){return `<div class="ngh"><div><div class="kicker">Mini-game</div><h3>${title}</h3><p class="small muted">${desc}</p></div><div class="ngbest">Best <b>${best}</b></div></div>`;}
function campStreak(c){let n=0;const d=new Date();if(((c.camp[today()]||[]).length)<3)d.setDate(d.getDate()-1);for(;;){const k=VB.iso?VB.iso(d):d.toISOString().slice(0,10);if((c.camp[k]||[]).length>=3){n++;d.setDate(d.getDate()-1);}else break;}return n;}
function records(c){const A=VB.crowArcade;if(!A)return "";const ms=Object.keys(A.MODES);
  return `<div class="card"><div class="kicker">Arcade records</div><table class="arec"><thead><tr><th>Game</th>${ms.map(m=>`<th>${A.MODES[m].label}</th>`).join("")}<th>Best</th></tr></thead><tbody>${ARCADE.map(id=>{const G=A.games[id];if(!G)return "";const b=(c.bestM&&c.bestM[id])||{};
    return `<tr><td>${esc(G.title)}</td>${ms.map(m=>`<td>${b[m]||"–"}</td>`).join("")}<td><b>${G.bestOf(c)||0}</b></td></tr>`;}).join("")}</tbody></table>
    <p class="small muted">Daily challenges done: <b>${c.dailyN}</b>. Today's: ${(()=>{const d=A.daily();return d?`${esc(d.title)}, ${esc(d.text)}${c.daily[d.day]?" ✓":""}`:"none";})()}.</p></div>`;}
function radar(c){const v=skills(c),n=v.length,R=110,cx=150,cy=140,pt=(i,r)=>[cx+Math.sin(i/n*Math.PI*2)*r,cy-Math.cos(i/n*Math.PI*2)*r];
  const ring=k=>v.map((_,i)=>pt(i,R*k).join(",")).join(" ");
  return `<svg class="radar" viewBox="0 0 300 290" role="img" aria-label="Skill chart: ${SKILLS.map(([l],i)=>l+" "+v[i]).join(", ")}">
    ${[.25,.5,.75,1].map(k=>`<polygon points="${ring(k)}" fill="none" stroke="rgba(255,255,255,.12)"/>`).join("")}
    ${v.map((_,i)=>{const [x,y]=pt(i,R);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.1)"/>`;}).join("")}
    <polygon points="${v.map((s,i)=>pt(i,R*Math.max(.04,s/100)).join(",")).join(" ")}" fill="${rgbA(.35)}" stroke="var(--cra)" stroke-width="2.5"/>
    ${SKILLS.map(([l],i)=>{const [x,y]=pt(i,R+22);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${esc(l)} <tspan>${v[i]}</tspan></text>`;}).join("")}</svg>`;}
function panel(){const P=$("#nPanel");if(!P)return;stopGame();$$("[data-nt]").forEach(b=>b.setAttribute("aria-selected",b.dataset.nt===tab));const c=C(),p=ME();
  if(ARCADE.includes(tab)){game=VB.crowArcade?VB.crowArcade.mount(P,tab,KIT):null;}
  else if(tab==="card"){playerCard(P);}
  else if(tab==="iq"){quizMenu(P);}
  else if(tab==="camp"){const qs=campToday(),done=c.camp[today()]||[],days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=VB.iso?VB.iso(d):d.toISOString().slice(0,10);days.push([k,(c.camp[k]||[]).length]);}
    P.innerHTML=`<div class="ncamp"><div class="ngh"><div><div class="kicker">Today's camp · ${p.focus==="att"?"attack":p.focus==="mix"?"all-round":"defence"} focus</div><h3>Three jobs for ${esc(p.job||"a crow")}</h3><p class="small muted">New jobs every day: two for your focus, one for everyone. Tick each one when you've done it: 15 feathers each, and a 20 feather bonus for all three. Dives and sprawls go on a mat or grass, never a hard floor.</p></div></div>
      <div class="camprow">${qs.map(q=>{const d=done.includes(q.id);return `<button type="button" class="cq ${d?"done":""}" data-cq="${q.id}" aria-pressed="${d}"><span class="cqk">${d?"Done":"To do"}</span><b>${esc(q.t)}</b><span>${esc(q.d)}</span><small>${esc(q.x)}</small></button>`;}).join("")}</div>
      ${(()=>{const ch=chalToday();if(!ch)return "";const dn=!!(c.chal[today()]);return `<div class="cchal ${dn?"done":""}"><div><span class="kicker">Challenge drill · optional</span><b>${esc(ch.t)}</b><span>${esc(ch.d)}</span></div><button type="button" class="btn sm ${dn?"":"primary"}" data-cchal ${dn?"disabled":""}>${dn?"Done · +30":"I did it · +30"}</button></div>`;})()}
      <p class="small muted">Camp streak: <b>${campStreak(c)}</b> day${campStreak(c)===1?"":"s"} in a row · ${Object.keys(c.chal).length} challenge drill${Object.keys(c.chal).length===1?"":"s"} done.</p>
      <div class="cweek"><span class="stat">Last 14 days</span><div>${days.map(([k,n])=>`<i class="${n>=3?"full":n?"part":""}" title="${k}: ${n}/3"><span>${["S","M","T","W","T","F","S"][new Date(k+"T12:00").getDay()]}</span></i>`).join("")}</div></div></div>`;}
  else if(tab==="season"){const wk=weekKey(),g=c.goal.week===wk?c.goal:{};
    P.innerHTML=`<div class="nseason"><div class="stack" style="gap:16px"><div class="card"><div class="kicker">Skill chart</div><p class="small muted">Built from your best scores: Receive (Dig Defence), Attack (Freak Quick), Serve (Jump Serve), IQ (the quiz), Grit (camp days) and Energy (games played and big calls).</p>${radar(c)}</div>
      ${records(c)}<div class="card"><div class="kicker">This week's goal</div><p class="small muted">Write one thing you'll do this week. Tick it when it's done: 30 feathers.</p>
        ${g.done?`<p class="goaldone">✓ ${esc(g.text)}</p>`:`<form class="row" id="nGoalForm"><input class="in" id="nGoalIn" maxlength="120" placeholder="e.g. 100 wall passes in a row" value="${esc(g.text||"")}" aria-label="This week's goal" style="flex:1;min-width:0"><button class="btn sm" type="submit">Save</button></form>${g.text?`<div class="row"><button class="btn primary sm" type="button" id="nGoalDone">I did it</button></div>`:""}`}</div></div>
      <div class="road"><div class="kicker">Season road</div><h3>${c.road.length>=ROAD.length?"World champions!":c.road.length>=10?"The World Club Championship":"Win your way to Nationals"}</h3><ol>${ROAD.map((m,i)=>{const s2=i<c.road.length?"won":i===c.road.length?"next":"later";
        return `${i===10?`<li class="rsep"><span>Season 2 · World Club Championship${c.road.length<10?" · unlocks after Nationals":""}</span></li>`:""}<li class="rm ${s2} ${i>=10&&c.road.length<10?"locked":""}"><span class="rdot">${s2==="won"?"✓":i+1}</span><div><small>${esc(m.kind)}</small><b>vs ${esc(m.opp)}</b><span>${s2==="won"?"Won · +"+m.f+" feathers":esc(m.need)}</span></div></li>`;}).join("")}</ol></div></div>`;}
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
  if(b.hasAttribute("data-cchal")){const k=today();if(c.chal[k])return;c.chal[k]=(chalToday()||{}).id||1;award(30);sfx("unlock");save();checkBadges();refreshStats();panel();return;}
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

/* the arcade games themselves are in crows-games.js, on the engine in crows-arcade.js */

/* ---------- Volleyball IQ: Classic (10 questions with explanations), Lightning (60 seconds), Expert (hard, three strikes) ---------- */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const prep=q=>({...q,opts:shuffle(q.a.map((t,i)=>({t,ok:i===0})))});
const QMODES={classic:{label:"Classic",desc:`${QN} questions, about half on your focus, with the explanation after each one.`,best:c=>c.best.quiz,unit:`/ ${QN}`},
  lightning:{label:"Lightning",desc:"60 seconds. Answer as many as you can. Streaks of 5 add 5 seconds, wrong answers cost 3.",best:c=>c.best.lightning,unit:"right"},
  expert:{label:"Expert",desc:"Only medium and hard questions, hardest first. Keep going until your third mistake.",best:c=>c.best.expert,unit:"right"}};
function quizMenu(P){stopQuiz();const c=C();P.innerHTML=`<div class="nquiz menu"><div class="kicker">Volleyball IQ</div><h3>Pick a mode</h3><p class="small muted">${QUIZ.length} questions on rules, tactics and technique, easy to hard.</p>
  <div class="qmodes">${Object.entries(QMODES).map(([k,m])=>`<button type="button" class="qmode" data-qmode="${k}"><b>${m.label}</b><span>${esc(m.desc)}</span><small>Best: ${m.best(c)} ${esc(m.unit)}</small></button>`).join("")}</div></div>`;}
function stopQuiz(){if(quiz&&quiz.timer)clearInterval(quiz.timer);quiz=null;}
function quizStart(P,mode){stopQuiz();mode=mode||"classic";const f=ME().focus;let qs;
  if(mode==="classic"){const mine=shuffle(QUIZ.filter(q=>f==="mix"||q.f===f)).slice(0,Math.ceil(QN/2)),rest=shuffle(QUIZ.filter(q=>!mine.includes(q))).slice(0,QN-mine.length);qs=shuffle(mine.concat(rest));}
  else if(mode==="expert"){qs=shuffle(QUIZ.filter(q=>q.d>=3)).concat(shuffle(QUIZ.filter(q=>q.d===2)));}
  else qs=shuffle(QUIZ);
  quiz={mode,qs:qs.map(prep),i:0,right:0,picked:null,strikes:0,streak:0,best:0,left:60,t0:performance.now()};
  if(mode==="lightning"){quiz.timer=setInterval(()=>{if(!quiz)return;quiz.left-=.1;const el=$("#qzClock");if(el){el.textContent=Math.max(0,quiz.left).toFixed(1);el.parentElement.style.setProperty("--k",Math.max(0,quiz.left/60));}if(quiz.left<=0){clearInterval(quiz.timer);quiz.timer=null;quiz.done=true;quizRender();}},100);}
  game={stop:stopQuiz};quizRender(P);}
function quizEnd(P){const c=C(),q=quiz,m=q.mode;let fe,nb=false;
  if(m==="classic"){fe=q.right*5;if(q.right>c.best.quiz){c.best.quiz=q.right;nb=true;}}
  else if(m==="lightning"){fe=q.right*3+q.best*2;if(q.right>c.best.lightning){c.best.lightning=q.right;nb=true;}}
  else{fe=q.right*6;if(q.right>c.best.expert){c.best.expert=q.right;nb=true;}}
  award(fe);c.games++;save();checkBadges();refreshStats();const msg=m==="classic"?(q.right===q.qs.length?"Perfect. That's a Volleyball Brain.":q.right>=QN-2?"Sharp. A couple more and you've got them all.":"Good start. Every round picks new questions."):
    m==="lightning"?(q.right>=15?"Lightning fast.":"Speed comes with knowing the rules cold. Go again."):(q.right>=12?"A true rules expert.":"The hard ones are hard. Read the explanations and try again.");
  P.innerHTML=`<div class="nquiz done"><div class="kicker">Volleyball IQ · ${QMODES[m].label}</div><h3>${q.right}${m==="classic"?" / "+q.qs.length:" right"}</h3><p>${msg} +${fe} feathers${nb?" · new best":""}.</p>
    ${m==="lightning"?`<p class="small muted">Best streak ${q.best} · ${q.i} answered</p>`:""}${q.missed&&q.missed.length?`<details class="qreview"><summary>Review ${q.missed.length} you missed</summary><ul>${q.missed.map(x=>`<li><b>${esc(x.q)}</b><span>${esc(x.a[0])}. ${esc(x.e)}</span></li>`).join("")}</ul></details>`:""}
    <div class="row"><button class="btn primary" type="button" data-qmode="${m}">Play again</button><button class="btn" type="button" id="qzMenu">Other modes</button></div></div>`;if(quiz.timer)clearInterval(quiz.timer);quiz=null;}
function quizRender(P){P=P||$("#nPanel");const c=C();if(!P||!quiz)return;const m=quiz.mode;
  if(quiz.done||quiz.i>=quiz.qs.length||(m==="expert"&&quiz.strikes>=3)||(m==="lightning"&&quiz.left<=0)){quizEnd(P);return;}
  const q=quiz.qs[quiz.i],pk=quiz.picked,showExp=m!=="lightning";
  const head=m==="classic"?`Question ${quiz.i+1} of ${quiz.qs.length}`:m==="expert"?`Question ${quiz.i+1} · ${"✕".repeat(quiz.strikes)}${"○".repeat(3-quiz.strikes)}`:`<span class="qclock" style="--k:${quiz.left/60}"><b id="qzClock">${quiz.left.toFixed(1)}</b>s</span> · streak ${quiz.streak}`;
  P.innerHTML=`<div class="nquiz ${m}"><div class="row" style="justify-content:space-between"><span class="kicker">${head} · ${q.f==="att"?"attack":q.f==="def"?"defence":"the game"} · ${["","easy","medium","hard"][q.d]||""}</span><span class="stat">${quiz.right} right · best ${QMODES[m].best(c)}</span></div>
    ${m==="classic"?`<div class="qbar"><i style="width:${quiz.i/quiz.qs.length*100}%"></i></div>`:""}<h3>${esc(q.q)}</h3><div class="qopts">${q.opts.map((o,i)=>{const cls=pk==null?"":o.ok?"ok":pk===i?"bad":"";return `<button type="button" class="qo ${cls}" data-qo="${i}" ${pk!=null?"disabled":""}><kbd>${i+1}</kbd>${esc(o.t)}</button>`;}).join("")}</div>
    ${pk!=null&&showExp?`<p class="qexp" role="status">${q.opts[pk].ok?"<b>Right!</b> ":"<b>Not quite.</b> "}${esc(q.e)}</p><button class="btn primary" type="button" id="qzNext">${quiz.i+1<quiz.qs.length&&!(m==="expert"&&quiz.strikes>=3)?"Next question":"See my score"}</button>`:""}</div>`;}
function quizPick(i){if(!quiz||quiz.picked!=null)return;const q=quiz.qs[quiz.i];if(!q||!q.opts[i])return;quiz.picked=i;const ok=q.opts[i].ok;
  if(ok){quiz.right++;quiz.streak++;quiz.best=Math.max(quiz.best,quiz.streak);if(quiz.mode==="lightning"&&quiz.streak%5===0){quiz.left+=5;}}
  else{quiz.streak=0;quiz.strikes++;(quiz.missed=quiz.missed||[]).push(q);if(quiz.mode==="lightning")quiz.left=Math.max(0,quiz.left-3);}
  sfx(ok?"perfect":"miss");quizRender();
  if(quiz&&quiz.mode==="lightning"){setTimeout(()=>{if(quiz&&quiz.picked!=null){quiz.i++;quiz.picked=null;quizRender();}},ok?320:700);}else{const n=$("#qzNext");n&&n.focus();}}
document.addEventListener("click",e=>{if(!e.target.closest("#nPanel"))return;const b=e.target.closest("button");if(!b)return;
  if(b.dataset.qmode){quizStart($("#nPanel"),b.dataset.qmode);return;}
  if(b.id==="qzMenu"){quizMenu($("#nPanel"));return;}
  if(b.dataset.qo!=null&&quiz){quizPick(+b.dataset.qo);return;}
  if(b.id==="qzNext"&&quiz){quiz.i++;quiz.picked=null;quizRender();return;}});
document.addEventListener("keydown",e=>{if(!quiz||!isNest()||tab!=="iq")return;if(/^[1-4]$/.test(e.key)&&quiz.picked==null){e.preventDefault();quizPick(+e.key-1);}else if(e.key==="Enter"&&quiz.picked!=null&&quiz.mode!=="lightning"){const n=$("#qzNext");if(n){e.preventDefault();n.click();}}});

/* ---------- hooks ---------- */
window.addEventListener("hashchange",()=>{applySkin();if(!/^#nest/.test(location.hash))stopGame();if(/^#profile/.test(location.hash))setTimeout(renderCodeCard,450);});
function boot(){applySkin();renderCodeCard();if(on())checkBadges(true);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,0));else setTimeout(boot,0);
/* the cloud copy can replace the state after start-up: re-apply then */
setInterval(()=>{const want=on()&&G().skin!==false?"crow":"";if((document.documentElement.dataset.skin||"")!==want||(on()&&document.documentElement.dataset.crow!==who()))applySkin();},2000);

VB.crow={on,owned,need,hash,titleText,accent,render,renderCodeCard,applySkin,unlock,sfx,TITLES,PEOPLE};
})();
