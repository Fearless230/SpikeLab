/* locker.js: unlockable volleyballs and ball effects, achievements that unlock them, and the character locker UI.
   The chosen ball and effect appear in every 3D animation (home arena, Skills court, player card, locker preview). */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const G=VB.GL,{Node}=G;
const esc=s=>VB.esc?VB.esc(s):String(s);

/* ---------- ball designs ---------- */
function panels(g,w,h,cols,line){// three wavy panel bands like a match ball, repeated on the sphere
  cols.forEach((c,i)=>{g.fillStyle=c;g.beginPath();const y0=i*h/3;for(let x=0;x<=w;x+=4)g.lineTo(x,y0+Math.sin(x/w*Math.PI*4)*h/9);for(let x=w;x>=0;x-=4)g.lineTo(x,y0+h/3+Math.sin(x/w*Math.PI*4)*h/9);g.closePath();g.fill();});
  g.strokeStyle=line||"rgba(0,0,0,.3)";g.lineWidth=2.5;for(let i=0;i<7;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+Math.sin(x/w*Math.PI*4)*h/9);g.stroke();}}
const BALLS={
  classic:{name:"Classic",draw:(g,w,h)=>{g.fillStyle="#f6f3ea";g.fillRect(0,0,w,h);panels(g,w,h,["#f5c518","#1f4fae","#f6f3ea"]);},mat:{rough:.45}},
  pro:{name:"Pro match",draw:(g,w,h)=>{g.fillStyle="#1d48c9";g.fillRect(0,0,w,h);panels(g,w,h,["#ffd400","#1d48c9","#ffd400"],"rgba(0,0,40,.35)");},mat:{rough:.35}},
  beach:{name:"Beach",draw:(g,w,h)=>{g.fillStyle="#fff7ec";g.fillRect(0,0,w,h);panels(g,w,h,["#ff9b6a","#2cc3b5","#fff7ec"],"rgba(80,40,0,.25)");},mat:{rough:.6}},
  team:{name:"Team colours",draw:(g,w,h,acc)=>{g.fillStyle="#ffffff";g.fillRect(0,0,w,h);panels(g,w,h,[acc,"#17144d","#ffffff"]);},mat:{rough:.4}},
  neon:{name:"Neon",draw:(g,w,h)=>{g.fillStyle="#12102a";g.fillRect(0,0,w,h);panels(g,w,h,["#39ff88","#12102a","#ff2fa8"],"rgba(255,255,255,.35)");},mat:{rough:.3,emissive:[.08,.12,.1]}},
  galaxy:{name:"Galaxy",draw:(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,"#140a3a");gr.addColorStop(.5,"#3b1a8f");gr.addColorStop(1,"#0a2a5a");g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(let i=0;i<260;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.9})`;const r=Math.random()*1.8;g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,7);g.fill();}g.strokeStyle="rgba(180,160,255,.35)";g.lineWidth=2;for(let i=0;i<7;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+Math.sin(x/w*Math.PI*4)*h/9);g.stroke();}},mat:{rough:.25,emissive:[.06,.04,.12]}},
  fire:{name:"Fireball",draw:(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#ffe14d");gr.addColorStop(.45,"#ff7a1a");gr.addColorStop(1,"#c41818");g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle="rgba(255,240,150,.55)";for(let i=0;i<18;i++){const x=Math.random()*w;g.beginPath();g.moveTo(x-14,h);g.quadraticCurveTo(x+10,h*.5,x,h*(.1+Math.random()*.3));g.quadraticCurveTo(x+4,h*.6,x+16,h);g.fill();}
    g.strokeStyle="rgba(90,10,0,.35)";g.lineWidth=2.5;for(let i=0;i<7;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+Math.sin(x/w*Math.PI*4)*h/9);g.stroke();}},mat:{rough:.4,emissive:[.22,.07,0]}},
  ice:{name:"Ice",draw:(g,w,h)=>{g.fillStyle="#eafcff";g.fillRect(0,0,w,h);panels(g,w,h,["#bff3ff","#eafcff","#7fd9ff"],"rgba(0,90,140,.3)");for(let i=0;i<80;i++){g.fillStyle="rgba(255,255,255,.9)";g.fillRect(Math.random()*w,Math.random()*h,2,2);}},mat:{rough:.15,metal:.25}},
  retro:{name:"Retro",draw:(g,w,h)=>{g.fillStyle="#f7f4ec";g.fillRect(0,0,w,h);panels(g,w,h,["#d8262f","#f7f4ec","#1f8a4c"],"rgba(40,20,0,.3)");},mat:{rough:.5}},
  /* the next three only appear once the secret code has been entered (see crows.js) */
  crow:{name:"Crow",secret:true,draw:(g,w,h)=>{g.fillStyle="#121115";g.fillRect(0,0,w,h);panels(g,w,h,["#ff7a1a","#121115","#f4f1ea"],"rgba(255,122,26,.45)");},mat:{rough:.35}},
  sunset:{name:"Sunset spike",secret:true,draw:(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#ffd27a");gr.addColorStop(.5,"#ff7a1a");gr.addColorStop(1,"#3a1200");g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.strokeStyle="rgba(18,17,21,.75)";g.lineWidth=7;for(let i=0;i<7;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+Math.sin(x/w*Math.PI*4)*h/9);g.stroke();}},mat:{rough:.3,emissive:[.12,.05,0]}},
  thunder:{name:"Rolling thunder",secret:true,draw:(g,w,h)=>{g.fillStyle="#141317";g.fillRect(0,0,w,h);g.strokeStyle="#ffb21a";g.lineWidth=9;g.lineJoin="miter";
    for(let r=0;r<3;r++){g.beginPath();const y0=h*(.2+r*.3);for(let x=0;x<=w;x+=32)g.lineTo(x,y0+((x/32)%2?-h*.08:h*.08));g.stroke();}
    g.strokeStyle="rgba(255,255,255,.25)";g.lineWidth=2;for(let i=0;i<7;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+Math.sin(x/w*Math.PI*4)*h/9);g.stroke();}},mat:{rough:.3,emissive:[.1,.06,0]}},
  ace:{name:"Ace",secret:true,draw:(g,w,h)=>{g.fillStyle="#f7f4ec";g.fillRect(0,0,w,h);g.fillStyle="#ffc21a";for(let i=0;i<5;i++){const x=i*w/5+20;g.beginPath();g.moveTo(x,10);g.lineTo(x+34,10);g.lineTo(x+14,h*.48);g.lineTo(x+40,h*.48);g.lineTo(x-6,h-10);g.lineTo(x+8,h*.56);g.lineTo(x-16,h*.56);g.closePath();g.fill();}
    g.strokeStyle="rgba(18,17,21,.55)";g.lineWidth=2.5;for(let i=0;i<7;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+Math.sin(x/w*Math.PI*4)*h/9);g.stroke();}},mat:{rough:.32,emissive:[.06,.05,0]}},
  gold:{name:"Gold",draw:(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,"#b8860b");gr.addColorStop(.5,"#ffe08a");gr.addColorStop(1,"#c9971c");g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle="rgba(80,50,0,.5)";g.lineWidth=3;for(let i=0;i<7;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+Math.sin(x/w*Math.PI*4)*h/9);g.stroke();}},mat:{rough:.28,metal:.85}}
};
const FX={
  none:{name:"No effect"},trail:{name:"Team trail"},comet:{name:"Comet tail"},sparkle:{name:"Sparkles"},flame:{name:"Flame"},lightning:{name:"Lightning"},rainbow:{name:"Rainbow"},shockwave:{name:"Shockwave"},confetti:{name:"Confetti"},
  feathers:{name:"Crow feathers",secret:true},thunder:{name:"Rolling thunder",secret:true}
};
const texCache={};
function ballTex(kind,acc){const k=kind+"|"+(kind==="team"?acc:"");if(texCache[k])return texCache[k];const B=BALLS[kind]||BALLS.classic;return texCache[k]=G.canvasTex(512,256,(g,w,h)=>B.draw(g,w,h,acc||"#ec3b52"));}
function ballMat(kind,acc){const B=BALLS[kind]||BALLS.classic;return G.mat(Object.assign({map:ballTex(kind,acc)},B.mat||{}));}
/* 2D swatch for the locker grid */
function swatch(kind,acc,size){const c=document.createElement("canvas");c.width=c.height=size||72;const g=c.getContext("2d"),t=ballTex(kind,acc).img,r=c.width/2;
  g.save();g.beginPath();g.arc(r,r,r-2,0,7);g.clip();g.drawImage(t,0,0,t.width/2,t.height,0,0,c.width,c.height);const sh=g.createRadialGradient(r*.7,r*.6,r*.1,r,r,r);sh.addColorStop(0,"rgba(255,255,255,.35)");sh.addColorStop(.6,"rgba(255,255,255,0)");sh.addColorStop(1,"rgba(0,0,0,.35)");g.fillStyle=sh;g.fillRect(0,0,c.width,c.height);g.restore();return c.toDataURL();}

/* ---------- ball effects (shared by every 3D view) ---------- */
VB.BallFX=function(parent,kind,color){kind=FX[kind]?kind:"none";const col=G.hex(color||"#ec3b52"),ghosts=[],parts=[],trail=[];let ring=null,flash=null,lastPos=null,clock=0;
  const nG={trail:6,comet:14,flame:9,lightning:8,rainbow:10,shockwave:6,sparkle:3,feathers:7,thunder:10,confetti:3}[kind]||0,nP={flame:26,sparkle:30,lightning:16,comet:10,feathers:28,thunder:22,confetti:36}[kind]||0;
  /* feathers are dark, so they are drawn normally rather than added like light */
  const gm=(c,o,solid)=>G.mat({color:c,unlit:true,transparent:true,opacity:o,depthWrite:false,additive:!solid,fog:false});
  for(let i=0;i<nG;i++){const n=new Node(VB.Athlete.ballGeo(),gm(col,.2));n.visible=false;parent.add(n);ghosts.push(n);}
  const pg=G.sphere(.022,6,4);for(let i=0;i<nP;i++){const n=new Node(pg,gm([1,1,1],0,kind==="feathers"||kind==="confetti"));n.visible=false;n.userData={life:0};parent.add(n);parts.push(n);}
  if(kind==="shockwave"||kind==="thunder"){ring=new Node(G.ring(.85,1,48),gm(col,0));ring.visible=false;ring.mat.double=true;parent.add(ring);flash=new Node(G.sphere(.3,16,12),gm([1,1,1],0));flash.visible=false;parent.add(flash);}
  const hue=h=>{const f=(n,k=(n+h*12)%12)=>.5-.5*Math.max(-1,Math.min(k-3,9-k,1));return [f(0),f(8),f(4)];};
  const spawn=(p,v,c,life,sz)=>{const n=parts.find(q=>q.userData.life<=0);if(!n)return;n.visible=true;n.pos=p.slice();n.userData={life,max:life,v};n.mat.color=c;n.scl=[sz,sz,sz];};
  return {kind,update(dt,pos,contact){clock+=dt;
      if(pos){trail.push(pos.slice());if(trail.length>40)trail.shift();}else trail.length=0;
      const speed=pos&&lastPos?Math.hypot(pos[0]-lastPos[0],pos[1]-lastPos[1],pos[2]-lastPos[2])/(dt||1/60):0;lastPos=pos?pos.slice():null;
      ghosts.forEach((n,i)=>{const step=kind==="comet"?2:kind==="flame"?2:3,q=trail[trail.length-2-i*step];n.visible=!!(q&&pos&&speed>.8);if(!n.visible)return;n.pos=q.slice();const k=1-i/nG;
        if(kind==="trail"){n.mat.opacity=.22*k;n.scl=[k,k,k];}
        else if(kind==="comet"){n.mat.color=[.6+.4*k,.8+.2*k,1];n.mat.opacity=.3*k;const s=.5+.6*k;n.scl=[s,s,s];}
        else if(kind==="flame"){n.mat.color=[1,.35+.5*k,.08*k];n.mat.opacity=.32*k;const s=(.7+.5*(1-k))*(1+.15*Math.sin(clock*40+i));n.scl=[s,s,s];}
        else if(kind==="lightning"){n.mat.color=[.55,.9,1];n.mat.opacity=.35*k;const j=.06*(1-k);n.pos=[q[0]+(Math.random()-.5)*j*3,q[1]+(Math.random()-.5)*j*3,q[2]+(Math.random()-.5)*j*3];n.scl=[.5*k+.2,.5*k+.2,.5*k+.2];}
        else if(kind==="rainbow"){n.mat.color=hue((i/nG+clock*.3)%1);n.mat.opacity=.3*k;n.scl=[.9*k+.1,.9*k+.1,.9*k+.1];}
        else if(kind==="feathers"){n.mat.color=[1,.48,.1];n.mat.opacity=.24*k;n.scl=[.8*k+.15,.8*k+.15,.8*k+.15];}
        else if(kind==="thunder"){n.mat.color=i%2?[1,.62,.12]:[1,.9,.55];n.mat.opacity=.34*k;const j=.07*(1-k);n.pos=[q[0]+(Math.random()-.5)*j*3,q[1]+(Math.random()-.5)*j*3,q[2]+(Math.random()-.5)*j*3];n.scl=[.55*k+.2,.55*k+.2,.55*k+.2];}
        else{n.mat.color=col;n.mat.opacity=.2*k;n.scl=[k,k,k];}});
      if(pos&&speed>.8){const r=()=>(Math.random()-.5);
        if(kind==="flame"&&Math.random()<.9)spawn([pos[0]+r()*.12,pos[1]+r()*.12,pos[2]+r()*.12],[r()*.3,.6+Math.random()*.6,r()*.3],[1,.5+Math.random()*.4,.1],.45,1+Math.random());
        if(kind==="sparkle"){for(let k=0;k<2;k++)spawn([pos[0]+r()*.2,pos[1]+r()*.2,pos[2]+r()*.2],[r()*.8,r()*.8,r()*.8],Math.random()<.5?[1,.95,.6]:[1,1,1],.4,.6+Math.random()*.8);}
        if(kind==="lightning"&&Math.random()<.5)spawn([pos[0]+r()*.25,pos[1]+r()*.25,pos[2]+r()*.25],[r()*2,r()*2,r()*2],[.7,.95,1],.18,.7);
        if(kind==="feathers"&&Math.random()<.45){const sz=1.4+Math.random()*1.4;spawn([pos[0]+r()*.2,pos[1]+r()*.2,pos[2]+r()*.2],[r()*.5,-.15-Math.random()*.35,r()*.5],Math.random()<.8?[.07,.06,.09]:[1,.48,.1],1.1,sz);}
        if(kind==="thunder"&&Math.random()<.7)spawn([pos[0]+r()*.3,pos[1]+r()*.3,pos[2]+r()*.3],[r()*2.4,r()*2.4,r()*2.4],Math.random()<.6?[1,.6,.1]:[1,.95,.7],.2,.8);
        if(kind==="confetti"){const c=[[1,.3,.4],[1,.85,.2],[.3,.8,1],[.5,1,.5],[.8,.5,1]][Math.floor(Math.random()*5)];spawn([pos[0]+r()*.15,pos[1]+r()*.15,pos[2]+r()*.15],[r()*1.2,.3+Math.random()*.6,r()*1.2],c,.8,.9);}
        if(kind==="comet"&&Math.random()<.5)spawn([pos[0]+r()*.1,pos[1]+r()*.1,pos[2]+r()*.1],[r()*.2,r()*.2,r()*.2],[.8,.9,1],.6,.8);}
      parts.forEach(n=>{const u=n.userData;if(u.life<=0){n.visible=false;return;}u.life-=dt;const k=Math.max(0,u.life/u.max);if(kind==="feathers"){u.v[0]+=Math.sin(clock*7+u.max*9)*dt*1.4;n.scl=[n.scl[0],n.scl[0]*.35,n.scl[0]];}if(kind==="confetti")u.v[1]-=dt*1.6;n.pos=[n.pos[0]+u.v[0]*dt,n.pos[1]+u.v[1]*dt,n.pos[2]+u.v[2]*dt];n.mat.opacity=.8*k;if(u.life<=0)n.visible=false;});
      if(ring){if(contact&&pos){ring.userData={t:0,p:pos.slice()};}const u=ring.userData;if(u&&u.t!=null&&u.t<.5){u.t+=dt;const k=u.t/.5,s=.2+k*1.6;ring.visible=true;ring.pos=u.p;ring.rot=[Math.PI/2,0,0];ring.scl=[s,s,s];ring.mat.opacity=.7*(1-k);
          flash.visible=u.t<.18;flash.pos=u.p;const f=1+u.t*5;flash.scl=[f,f,f];flash.mat.opacity=.6*(1-u.t/.18);}else{ring.visible=false;flash.visible=false;}}}};};

/* ---------- achievements ---------- */
function stats(){const st=VB.state||{},so=st.social||{},ses=(st.sessions||[]).filter(s=>!s.ex),lv=Object.values(st.drill||{}).map(d=>d&&d.lvl||1),cur=VB.streak?VB.streak():0;
  st.bestStreak=Math.max(st.bestStreak||0,cur);
  return {sessions:ses.length,streak:st.bestStreak,film:(st.film||[]).length,fixed:Object.values(st.faults||{}).filter(f=>f&&f.fixed).length,tests:(st.tests||[]).filter(t=>t.kind==="vert").length,
    drill:lv.length?Math.max(...lv):1,friends:(so.friends||[]).length,teams:(so.teams||[]).length,events:(so.meets||[]).length,minutes:ses.reduce((a,s)=>a+(s.mins||0),0)};}
const ACH=[
  {id:"first",name:"First session",desc:"Finish one session",k:"sessions",n:1,r:["fx","trail"]},
  {id:"three",name:"Warmed up",desc:"Finish 3 sessions",k:"sessions",n:3,r:["ball","pro"]},
  {id:"eight",name:"Regular",desc:"Finish 8 sessions",k:"sessions",n:8,r:["ball","beach"]},
  {id:"fifteen",name:"On fire",desc:"Finish 15 sessions",k:"sessions",n:15,r:["ball","fire"]},
  {id:"twenty",name:"Twenty strong",desc:"Finish 20 sessions",k:"sessions",n:20,r:["fx","comet"]},
  {id:"streak2",name:"Two-week streak",desc:"Hit your weekly target 2 weeks in a row",k:"streak",n:2,r:["ball","neon"]},
  {id:"streak3",name:"Three-week streak",desc:"Hit your weekly target 3 weeks in a row",k:"streak",n:3,r:["fx","flame"]},
  {id:"streak4",name:"Month of work",desc:"Hit your weekly target 4 weeks in a row",k:"streak",n:4,r:["ball","gold"]},
  {id:"film3",name:"Camera ready",desc:"Analyse 3 clips on Film",k:"film",n:3,r:["ball","galaxy"]},
  {id:"film5",name:"Film room",desc:"Analyse 5 clips on Film",k:"film",n:5,r:["fx","shockwave"]},
  {id:"fixed2",name:"Fault fixer",desc:"Fix 2 faults that film found",k:"fixed",n:2,r:["ball","ice"]},
  {id:"tests2",name:"Measured",desc:"Log your vertical jump twice",k:"tests",n:2,r:["fx","lightning"]},
  {id:"level3",name:"Level up",desc:"Raise any drill to level 3",k:"drill",n:3,r:["fx","sparkle"]},
  {id:"team",name:"Captain",desc:"Create a team in Squad",k:"teams",n:1,r:["ball","team"]},
  {id:"event",name:"Organiser",desc:"Plan an event with friends",k:"events",n:1,r:["fx","rainbow"]},
  {id:"thirty",name:"Thirty club",desc:"Finish 30 sessions",k:"sessions",n:30,r:["ball","retro"]},
  {id:"hours10",name:"Ten hours",desc:"Train for 10 hours in total",k:"minutes",n:600,r:["fx","confetti"]}
];
function unlocked(){const S=stats(),out={ball:new Set(["classic"]),fx:new Set(["none"])};ACH.forEach(a=>{if(S[a.k]>=a.n)out[a.r[0]].add(a.r[1]);});
  /* items from the secret Crow's Nest (crows.js) */
  const x=VB.crow&&VB.crow.on()?VB.crow.owned():null;if(x){(x.ball||[]).forEach(id=>BALLS[id]&&out.ball.add(id));(x.fx||[]).forEach(id=>FX[id]&&out.fx.add(id));}return out;}
VB.locker=function(){const st=VB.state||{};st.locker=st.locker||{ball:"classic",fx:"trail"};const U=unlocked(),L=st.locker;
  return {ball:U.ball.has(L.ball)?L.ball:"classic",fx:U.fx.has(L.fx)?L.fx:(U.fx.has("trail")?"trail":"none")};};
VB.checkUnlocks=function(){const st=VB.state;if(!st||!st.profile)return;const U=unlocked(),seen=new Set(st.unlockSeen||[]),fresh=[];
  ACH.forEach(a=>{if(stats()[a.k]>=a.n&&!seen.has(a.id)){fresh.push(a);seen.add(a.id);}});st.unlockSeen=[...seen];
  if(fresh.length){fresh.forEach(a=>{const it=a.r[0]==="ball"?BALLS[a.r[1]].name+" ball":FX[a.r[1]].name+" effect";VB.log&&VB.log("Unlocked: "+it+" for "+a.name.toLowerCase()+". Equip it in your Locker.","up");});
    VB.ui&&VB.ui.toast&&VB.ui.toast("Unlocked: "+fresh.map(a=>a.r[0]==="ball"?BALLS[a.r[1]].name+" ball":FX[a.r[1]].name).join(", ")+". Open your Locker on the Profile page.");}
  if(fresh.length)VB.save&&VB.save();};

/* ---------- locker UI on the profile page ---------- */
const LOOKS=[["art","Art style",[["real","Realistic"],["anime","Anime"]]],["frame","Body",[["male","Broad frame"],["female","Narrow frame"]]],["build","Build",[["lean","Lean"],["athletic","Athletic"],["power","Power"]]],["beard","Facial hair",[["none","None"],["stubble","Stubble"],["moustache","Moustache"],["goatee","Goatee"],["beard","Beard"]]],
  ["headband","Headband",[["white","White"],["black","Black"],["orange","Orange"],["team","Team colour"],["none","None"]]],["cut","Jersey",[["short","Short sleeves"],["sleeveless","Sleeveless"]]],["pattern","Jersey design",[["plain","Plain"],["band","Chest band"],["sash","Sash"],["bolt","Lightning"],["chevron","Chevrons"],["stripes","Pinstripes"],["fade","Fade"]]],
  ["shortsColor","Shorts",[["","Kit"],["#17144d","Navy"],["#141317","Black"],["#f4f1ea","White"],["#ff7a1a","Orange"]]],
  ["sleeve","Arm sleeve",[["none","None"],["hit","Hitting arm"],["both","Both arms"]]],["sleeveColor","Sleeve colour",[["#17144d","Navy"],["#ffffff","White"],["#111111","Black"],["#ec3b52","Coral"],["#ff7a1a","Orange"]]],
  ["pads","Knee pads",[["black","Black"],["white","White"],["orange","Orange"],["none","None"]]],["socks","Socks",[["crew","Crew"],["high","High"],["none","None"]]],
  ["sockColor","Sock colour",[["#f2f2f5","White"],["#1d1b29","Black"],["#17144d","Navy"],["#ff7a1a","Orange"]]],
  ["shoe","Shoes",[["#f4f2ee","White"],["#111111","Black"],["#ec3b52","Coral"],["#39ff88","Volt"],["#5b2bff","Violet"],["#ff7a1a","Orange"],["#d8b25a","Gold"]]]];
/* the kit row only shows after the secret code (crows.js) */
const KITS=["kit","Kit",[["club","Card colour"],["crow","Crow black"],["guardian","Guardian orange"],["fearless","Fearless white"]]];
const COLKEYS=new Set(["shoe","sleeveColor","sockColor","shortsColor"]);
/* looks can come from other players' cards, so colours are checked and words are kept to known values */
const hexOk=v=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v);
VB.lookOpts=function(look){const l=look&&typeof look==="object"?look:{},c=(v,d)=>hexOk(v)?v:d,w=(v,d)=>typeof v==="string"&&/^[a-z]{2,12}$/.test(v)?v:d;
  return {skin:c(l.skin,"#c98d68"),hair:c(l.hair,"#2b1d16"),style:w(l.style,"short"),build:w(l.build,"athletic"),beard:w(l.beard,"none"),headband:w(l.headband,"white"),cut:w(l.cut,"short"),sleeve:w(l.sleeve,"none"),sleeveColor:c(l.sleeveColor,"#17144d"),pads:w(l.pads,"black"),socks:w(l.socks,"crew"),sockColor:c(l.sockColor,"#f2f2f5"),shoe:c(l.shoe,"#f4f2ee"),frame:w(l.frame,"male"),kit:w(l.kit,"club"),pattern:w(l.pattern,"plain"),shortsColor:c(l.shortsColor,""),art:l.art==="anime"?"anime":"real"};};
let LR=null,LP=null,LC=null;
function preview(){const ph=document.getElementById("lockPrev");if(!ph)return;try{if(!LR){LC=document.createElement("canvas");LR=VB.GL.renderer(LC,{alpha:true});if(!LR)return;}}catch(e){return;}ph.appendChild(LC);const cv=ph;
  const r=cv.getBoundingClientRect();LR.setSize(Math.max(200,r.width),Math.max(260,r.height),Math.min(2,window.devicePixelRatio||1));
  const p=VB.state.profile||{},L=VB.locker(),acc=VB.myAccent?VB.myAccent():"#ec3b52",clip=VB.Athlete.forPos[p.pos]||"spike",root=new Node();
  const pl=VB.Athlete.player(Object.assign({clip,jersey:acc,accent:"#ffffff",number:p.number!=null?p.number:7,lefty:p.hand==="left",ballKind:L.ball,fx:L.fx,fxColor:acc},VB.lookOpts(p.look)));root.add(pl.root);
  const floor=new Node(G.ring(0,1.6,48),G.mat({color:document.documentElement.dataset.skin==="crow"?"#3a1d0a":"#241c78",unlit:true}));root.add(floor);
  LP={pl,root,yaw:LP?LP.yaw:-.8,last:0,scene:{root,clear:[0,0,0,0],light:{sky:[.75,.72,.95],gnd:[.15,.1,.3],d1:[.4,1,.7],c1:[1,.96,.92],d2:[-.6,.3,-.6],c2:[.5,.35,1],rim:[.7,.5,1]},shadow:{dir:[.35,1,.45],opacity:.35}},cam:{fov:34,pos:[0,0,0],target:[0,1,0],near:.1,far:60}};}
VB.lockerFrame=function(now){if(!LP||!LR||!LC||!LC.isConnected)return;const dt=Math.min(.05,(now-LP.last)/1000||0);LP.last=now;LP.pl.update(dt);LP.yaw+=dt*.18;
  const P=LP.pl.a.pelvis.pos,r=4.6;LP.cam.target=[P[0],Math.max(1,P[1])+.2,P[2]];LP.cam.pos=[P[0]+Math.sin(LP.yaw)*r,1.6+Math.max(0,P[1]-.9)*.6,P[2]+Math.cos(LP.yaw)*r];LP.root.children[1].pos=[P[0],.01,P[2]];LR.render(LP.scene,LP.cam);};
VB.renderLocker=function(){const host=document.getElementById("lockerHost");if(!host||!VB.state.profile)return;const p=VB.state.profile,look=VB.lookOpts(p.look),L=VB.locker(),U=unlocked(),S=stats(),acc=VB.myAccent?VB.myAccent():"#ec3b52";
  const crowOn=!!(VB.crow&&VB.crow.on());
  const need=(type,id)=>ACH.find(a=>a.r[0]===type&&a.r[1]===id)||(crowOn&&VB.crow.need(type,id));
  const shown=(type,o)=>Object.entries(o).filter(([id,b])=>!b.secret||crowOn);
  const item=(type,id,name)=>{const own=U[type].has(id),a=need(type,id),on=L[type]===id,pr=a&&a.n?Math.min(1,(a.have!=null?a.have:S[a.k])/a.n):1;
    return `<button type="button" class="litem ${own?"":"locked"}" data-lk="${type}:${id}" aria-pressed="${on}" ${own?"":"aria-disabled=\"true\""}>
      ${type==="ball"?`<img src="${swatch(id,acc)}" alt="">`:`<span class="fxic fx-${id}"></span>`}<b>${esc(name)}</b>
      ${own?(on?`<small class="eq">Equipped</small>`:`<small>Tap to equip</small>`):`<small>${esc(a?a.desc:"")}</small>${a&&a.n?`<span class="lbar"><i style="width:${Math.round(pr*100)}%"></i></span><small class="num">${Math.min(a.have!=null?a.have:S[a.k],a.n)} / ${a.n}</small>`:""}`}</button>`;};
  host.innerHTML=`<div class="locker"><div class="lhead"><div><span class="stat">Locker</span><h2><span class="o">Your</span><span>player &amp; ball</span></h2><p class="muted">Dress your player and pick the ball and effect that fly in every 3D scene. New balls and effects unlock as you train: sessions, streaks, film, drill levels and your squad.</p></div>
    <div class="lstats"><div><b class="num">${S.sessions}</b><span>Sessions</span></div><div><b class="num">${S.streak}</b><span>Best streak</span></div><div><b class="num">${ACH.filter(a=>S[a.k]>=a.n).length}/${ACH.length}</b><span>Achievements</span></div></div></div>
    <div class="lgrid"><div class="lprev"><div id="lockPrev" class="lpc" role="img" aria-label="Your player with your ball and effect"></div><span class="small">${esc(BALLS[L.ball].name)} ball · ${esc(FX[L.fx].name)}</span></div>
      <div class="stack"><div class="card"><div class="kicker">Customise your player</div><p class="small muted">Skin, hair colour and hairstyle are in Your details. Everything here shows on the home screen, the Skills court, your card and your team.</p>
        ${(crowOn?[KITS,...LOOKS]:LOOKS).map(([k,l,opts])=>`<div class="lrow"><span class="lk">${l}</span><div class="lopts">${opts.map(([v,t])=>`<button type="button" class="lopt ${(COLKEYS.has(k)&&v)?"col":""}" data-look="${k}:${v}" aria-pressed="${look[k]===v}" ${(COLKEYS.has(k)&&v)?`style="--c:${v}" title="${t}"`:""}>${(COLKEYS.has(k)&&v)?`<i></i><span class="vh">${t}</span>`:t}</button>`).join("")}</div></div>`).join("")}</div></div></div>
    <div class="card"><div class="kicker">Volleyballs</div><div class="litems">${shown("ball",BALLS).map(([id,b])=>item("ball",id,b.name)).join("")}</div></div>
    <div class="card"><div class="kicker">Ball effects</div><div class="litems">${shown("fx",FX).map(([id,b])=>item("fx",id,b.name)).join("")}</div></div></div>`;
  preview();};
document.addEventListener("click",e=>{const b=e.target.closest("[data-lk],[data-look]");if(!b||!b.closest("#lockerHost"))return;const st=VB.state;
  if(b.dataset.lk){if(b.getAttribute("aria-disabled")==="true")return;const [t,id]=b.dataset.lk.split(":");st.locker=Object.assign(VB.locker(),{[t]:id});VB.save();VB.renderLocker();VB.hero&&VB.hero.refresh&&VB.hero.refresh();return;}
  if(b.dataset.look){const i=b.dataset.look.indexOf(":"),k=b.dataset.look.slice(0,i),v=b.dataset.look.slice(i+1);st.profile.look=Object.assign({},st.profile.look||{},{[k]:v});VB.save();VB.renderLocker();VB.hero&&VB.hero.refresh&&VB.hero.refresh();VB.squad&&VB.squad.changed&&VB.squad.changed();}});
VB.BALLS=BALLS;VB.FX=FX;VB.ACH=ACH;VB.achStats=stats;
VB.Athlete.ballMatKind=ballMat;
})();
