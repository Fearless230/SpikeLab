/* crows-arcade.js: the Crow's Nest arcade engine.
   Every mini-game runs on this: a sharp (high-DPI) canvas, smooth camera shake, slow motion and hit-stop, particles,
   score pop-ups with easing, a lit arena backdrop with a moving crowd, a spinning ball with a motion trail, a common HUD,
   three difficulty modes, pause (P, Esc, or leaving the tab), a daily challenge and a results screen.
   The games themselves live in crows-games.js and register with VB.crowArcade.add(). crows.js passes in the Nest's
   helpers (progress, feathers, sound, badges) as K. */
(function(){
"use strict";
const VB=window.VB,esc=VB.esc,$=(s,r=document)=>r.querySelector(s);
const A=VB.crowArcade={games:{},order:[]};

/* ---------- maths ---------- */
const M=A.M={
  clamp:(v,a,b)=>v<a?a:v>b?b:v,lerp:(a,b,t)=>a+(b-a)*t,
  ease:{out:t=>1-Math.pow(1-t,3),inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,back:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
    elastic:t=>t===0||t===1?t:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2*Math.PI/3)+1},
  rand:(a,b)=>a+Math.random()*(b-a),pick:a=>a[Math.floor(Math.random()*a.length)],
  /* seeded random for the daily challenge */
  seeded(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};},
  damp:(cur,target,rate,dt)=>cur+(target-cur)*(1-Math.exp(-rate*dt))
};
const {clamp,lerp,ease}=M;

/* ---------- difficulty ---------- */
A.MODES={rookie:{label:"Rookie",k:.78,win:1.35,fe:.6,note:"Slower, wider timing windows"},varsity:{label:"Varsity",k:1,win:1,fe:1,note:"The real thing"},
  national:{label:"National",k:1.22,win:.72,fe:1.6,note:"Faster, tighter, trickier. ×1.6 feathers"}};

/* ---------- stage: a canvas drawn in fixed logical units at the screen's pixel density ---------- */
function stage(cv,W,H){let dpr=Math.min(2.5,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);const g=cv.getContext("2d");
  return {g,W,H,dpr,full:dpr,res(d){d=Math.min(d,this.full);if(d===dpr)return;dpr=d;this.dpr=d;cv.width=Math.round(W*d);cv.height=Math.round(H*d);},begin(){g.setTransform(dpr,0,0,dpr,0,0);},pt(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];}};}
A.stage=stage;

/* ---------- effects: particles, pop-ups, shake, flash, slow motion ---------- */
function fx(){const F={parts:[],pops:[],rings:[],shake:0,flash:0,flashCol:"255,255,255",slow:1,slowT:0,stop:0,t:0};
  F.burst=(x,y,n,o)=>{o=o||{};for(let i=0;i<n;i++){const a=o.dir!=null?o.dir+(Math.random()-.5)*(o.spread||1.2):Math.random()*Math.PI*2,sp=(o.speed||320)*(.35+Math.random()*.75);
      F.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(o.up||0),t:0,life:(o.life||.7)*(.6+Math.random()*.6),size:(o.size||4)*(.6+Math.random()*.8),col:Array.isArray(o.col)?M.pick(o.col):o.col||"#fff",g:o.g==null?700:o.g,drag:o.drag||1.6,shape:o.shape||"sq",rot:Math.random()*6,vr:(Math.random()-.5)*12});}};
  F.ring=(x,y,col,r,w)=>F.rings.push({x,y,col:col||"255,255,255",t:0,r:r||60,w:w||6});
  F.pop=(x,y,txt,o)=>{o=o||{};F.pops.push({x,y,txt,t:0,col:o.col||"#fff",size:o.size||30,life:o.life||1,sub:o.sub||"",big:!!o.big});};
  F.hit=(power)=>{F.shake=Math.min(1,F.shake+power);};
  F.flashOn=(a,col)=>{F.flash=Math.max(F.flash,a);if(col)F.flashCol=col;};
  F.slowmo=(k,dur)=>{F.slow=k;F.slowT=dur;};
  F.freeze=d=>{F.stop=Math.max(F.stop,d);};
  /* returns the game time step after hit-stop and slow motion */
  F.step=dt=>{F.t+=dt;F.shake=Math.max(0,F.shake-dt*2.2);F.flash=Math.max(0,F.flash-dt*3);
    F.parts.forEach(p=>{p.t+=dt;p.vx*=Math.exp(-p.drag*dt);p.vy=p.vy*Math.exp(-p.drag*dt)+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;});F.parts=F.parts.filter(p=>p.t<p.life);
    F.pops.forEach(p=>p.t+=dt);F.pops=F.pops.filter(p=>p.t<p.life);F.rings.forEach(r=>r.t+=dt);F.rings=F.rings.filter(r=>r.t<.5);
    if(F.stop>0){F.stop-=dt;return 0;}if(F.slowT>0){F.slowT-=dt;if(F.slowT<=0)F.slow=1;}return dt*F.slow;};
  F.offset=()=>{const s=F.shake*F.shake*14;return [Math.sin(F.t*71)*s+Math.sin(F.t*31)*s*.5,Math.cos(F.t*59)*s+Math.sin(F.t*23)*s*.4];};
  F.draw=(g,W,H)=>{
    F.rings.forEach(r=>{const k=r.t/.5;g.strokeStyle=`rgba(${r.col},${(1-k)*.9})`;g.lineWidth=r.w*(1-k);g.beginPath();g.ellipse(r.x,r.y,r.r*ease.out(k),r.r*ease.out(k)*.5,0,0,7);g.stroke();});
    F.parts.forEach(p=>{const a=1-p.t/p.life;g.globalAlpha=Math.max(0,a);g.fillStyle=p.col;
      if(p.shape==="spark"){g.strokeStyle=p.col;g.lineWidth=p.size*.6;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*.03,p.y-p.vy*.03);g.stroke();}
      else if(p.shape==="circ"){g.beginPath();g.arc(p.x,p.y,p.size*(.4+.6*a),0,7);g.fill();}
      else if(p.shape==="feather"&&A.K){A.K.featherAt(g,p.x,p.y,p.size*4,p.rot,p.col);}
      else{g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillRect(-p.size/2,-p.size/2,p.size,p.size);g.restore();}});
    g.globalAlpha=1;
    F.pops.forEach(p=>{const k=p.t/p.life,s=p.t<.18?ease.back(p.t/.18):1,a=k<.7?1:1-(k-.7)/.3;g.save();g.font=`italic 800 ${p.size}px 'Barlow Condensed',sans-serif`;
      /* keep the text on screen */const hw=Math.max(g.measureText(p.txt).width,p.sub?p.sub.length*p.size*.2:0)/2+10,px=W>2*hw?clamp(p.x,hw,W-hw):W/2,py=clamp(p.y,p.size,H-p.size);
      g.translate(px,py-ease.out(k)*36);g.scale(s,s);g.globalAlpha=Math.max(0,a);
      g.textAlign="center";g.textBaseline="middle";g.lineWidth=Math.max(3,p.size/8);g.strokeStyle="rgba(10,8,12,.85)";g.strokeText(p.txt,0,0);g.fillStyle=p.col;g.fillText(p.txt,0,0);
      if(p.sub){g.font=`700 ${Math.round(p.size*.42)}px 'Barlow',sans-serif`;g.lineWidth=3;g.strokeText(p.sub,0,p.size*.72);g.fillStyle="rgba(255,255,255,.9)";g.fillText(p.sub,0,p.size*.72);}g.restore();});
    if(F.flash>0){g.fillStyle=`rgba(${F.flashCol},${F.flash*.5})`;g.fillRect(0,0,W,H);}};
  return F;}
A.fx=fx;

/* ---------- drawing helpers ---------- */
const D=A.draw={};
/* a volleyball: shaded sphere with three panel seams that spin, a rim light and the person's colour on one panel */
D.ball=(g,x,y,r,rot,col,alpha)=>{g.save();g.globalAlpha=alpha==null?1:alpha;g.translate(x,y);
  const sh=g.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r);sh.addColorStop(0,"#ffffff");sh.addColorStop(.55,"#f1ece1");sh.addColorStop(1,"#b9b1a2");g.fillStyle=sh;g.beginPath();g.arc(0,0,r,0,7);g.fill();
  g.save();g.beginPath();g.arc(0,0,r,0,7);g.clip();g.rotate(rot||0);
  g.fillStyle=col||"#ff7a1a";g.globalAlpha*=.92;g.beginPath();g.moveTo(-r*1.2,-r*.15);g.quadraticCurveTo(0,r*.35,r*1.2,-r*.15);g.lineTo(r*1.2,-r*.55);g.quadraticCurveTo(0,-r*.05,-r*1.2,-r*.55);g.closePath();g.fill();
  g.fillStyle="#1d1a22";g.beginPath();g.moveTo(-r*.1,-r*1.2);g.quadraticCurveTo(r*.45,0,-r*.1,r*1.2);g.lineTo(r*.25,r*1.2);g.quadraticCurveTo(r*.8,0,r*.25,-r*1.2);g.closePath();g.fill();
  g.strokeStyle="rgba(40,30,30,.35)";g.lineWidth=Math.max(1,r*.07);g.beginPath();g.moveTo(-r*1.2,r*.45);g.quadraticCurveTo(0,r*.85,r*1.2,r*.45);g.stroke();g.restore();
  const rim=g.createRadialGradient(r*.3,r*.35,r*.6,0,0,r*1.02);rim.addColorStop(0,"rgba(0,0,0,0)");rim.addColorStop(1,"rgba(0,0,0,.28)");g.fillStyle=rim;g.beginPath();g.arc(0,0,r,0,7);g.fill();
  g.restore();};
D.shadow=(g,x,y,rx,a)=>{const gr=g.createRadialGradient(x,y,0,x,y,rx);gr.addColorStop(0,`rgba(0,0,0,${a==null?.45:a})`);gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,rx*.38,0,0,7);g.fill();};
/* a motion trail behind a moving object (an array of [x,y,r]) */
D.trail=(g,pts,col)=>{for(let i=1;i<pts.length;i++){const a=i/pts.length,p=pts[i-1],q=pts[i];g.strokeStyle=`rgba(${col||"255,255,255"},${a*.35})`;g.lineWidth=q[2]*2*a;g.lineCap="round";g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();}};
D.round=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
D.glass=(g,x,y,w,h,a)=>{D.round(g,x,y,w,h,10);g.fillStyle=`rgba(12,10,14,${a==null?.62:a})`;g.fill();g.strokeStyle="rgba(255,255,255,.12)";g.lineWidth=1;g.stroke();};
D.text=(g,t,x,y,size,col,align,weight,italic)=>{g.font=`${italic?"italic ":""}${weight||800} ${size}px 'Barlow Condensed',sans-serif`;g.textAlign=align||"left";g.textBaseline="alphabetic";g.fillStyle=col||"#fff";g.fillText(t,x,y);};
/* small labels grow on narrow screens (the canvas is scaled down to fit a phone) */
A.ui=1;
D.small=(g,t,x,y,size,col,align)=>{g.font=`700 ${Math.round((size||13)*A.ui)}px 'Barlow',sans-serif`;g.textAlign=align||"left";g.textBaseline="alphabetic";g.fillStyle=col||"rgba(255,255,255,.72)";g.fillText(t,x,y);};
/* a simple athlete figure: legs, shorts, jersey with a number, arms from two angles, head with hair */
D.player=(g,o)=>{const {x,y}=o,s=o.s||1,col=o.col||"#ff7a1a",skin=o.skin||"#d9a27e",ink="#141217";g.save();g.translate(x,y);g.scale(o.flip?-s:s,s);g.lineCap="round";g.lineJoin="round";
  const cr=o.crouch||0,lean=o.lean||0;
  /* legs */
  g.strokeStyle=skin;g.lineWidth=9;const kx=6+cr*10;g.beginPath();g.moveTo(-7,-46+cr*10);g.lineTo(-kx-2,-22+cr*4);g.lineTo(-9,-2);g.moveTo(7,-46+cr*10);g.lineTo(kx+2,-22+cr*4);g.lineTo(9,-2);g.stroke();
  g.fillStyle="#f3f0ea";g.fillRect(-15,-6,13,7);g.fillRect(2,-6,13,7);g.fillStyle=ink;g.fillRect(-16,-1,15,4);g.fillRect(1,-1,15,4);
  g.fillStyle=ink;g.fillRect(-15,-28+cr*5,10,9);g.fillRect(5,-28+cr*5,10,9);/* knee pads */
  g.save();g.translate(0,-46+cr*10);g.rotate(lean);
  g.fillStyle=o.shorts||"#141217";g.beginPath();g.moveTo(-14,0);g.lineTo(14,0);g.lineTo(16,14);g.lineTo(-16,14);g.closePath();g.fill();
  const jg=g.createLinearGradient(-15,-52,15,0);jg.addColorStop(0,col);jg.addColorStop(1,o.col2||col);g.fillStyle=jg;g.beginPath();g.moveTo(-16,-50);g.lineTo(16,-50);g.lineTo(13,2);g.lineTo(-13,2);g.closePath();g.fill();
  if(o.num!=null){g.fillStyle=o.numCol||ink;g.font="800 17px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(o.num,0,-26);}
  /* arms: angles in radians from straight down, for the back and front arm */
  const arm=(ang,el,front)=>{g.strokeStyle=front?skin:"#b88664";g.lineWidth=7;g.beginPath();const sx=front?12:-12,sy=-44,ex=sx+Math.sin(ang)*17,ey=sy+Math.cos(ang)*17,a2=ang+(el||0);g.moveTo(sx,sy);g.lineTo(ex,ey);g.lineTo(ex+Math.sin(a2)*16,ey+Math.cos(a2)*16);g.stroke();};
  arm(o.a1==null?.25:o.a1,o.e1,false);
  g.fillStyle=skin;g.beginPath();g.arc(0,-62,11,0,7);g.fill();g.fillStyle=o.hair||ink;g.beginPath();g.arc(0,-65,11.5,Math.PI*.95,Math.PI*2.05);g.fill();
  arm(o.a2==null?-.25:o.a2,o.e2,true);g.restore();g.restore();};

/* ---------- the arena backdrop: dark gym, ceiling lights, banners and a crowd that sways; static parts cached ---------- */
D.arena=(W,H,horizon,acc)=>{const c=document.createElement("canvas"),dpr=Math.min(2,window.devicePixelRatio||1);c.width=W*dpr;c.height=H*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);
  const bg=g.createLinearGradient(0,0,0,horizon);bg.addColorStop(0,"#050407");bg.addColorStop(1,"#17121a");g.fillStyle=bg;g.fillRect(0,0,W,H);
  /* light cones */
  for(let i=0;i<5;i++){const x=W*(.1+i*.2),gr=g.createLinearGradient(x,0,x,horizon);gr.addColorStop(0,"rgba(255,236,200,.16)");gr.addColorStop(1,"rgba(255,236,200,0)");g.fillStyle=gr;g.beginPath();g.moveTo(x-12,0);g.lineTo(x+12,0);g.lineTo(x+90,horizon);g.lineTo(x-90,horizon);g.closePath();g.fill();
    g.fillStyle="rgba(255,244,220,.9)";g.fillRect(x-14,2,28,4);}
  /* stands */
  const st=g.createLinearGradient(0,horizon*.35,0,horizon);st.addColorStop(0,"#0d0b10");st.addColorStop(1,"#1d1720");g.fillStyle=st;g.fillRect(0,horizon*.42,W,horizon*.58);
  /* banners */
  const ban=(x,w,txt)=>{g.fillStyle="#0b0a0d";g.fillRect(x,horizon*.2,w,horizon*.17);g.strokeStyle=acc;g.lineWidth=3;g.strokeRect(x+4,horizon*.2+4,w-8,horizon*.17-8);g.fillStyle=acc;g.font=`italic 800 ${Math.round(horizon*.11)}px 'Barlow Condensed',sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(txt,x+w/2,horizon*.285);};
  ban(W*.06,W*.2,"FLY");ban(W*.74,W*.2,"CROW'S NEST");if(A.K)A.K.crowAt(g,W*.5,horizon*.27,1.6,false,acc);
  return c;};
/* crowd heads drawn live so they bob with the rally */
D.crowd=(g,W,horizon,t,hype,acc)=>{const rows=3;for(let r=0;r<rows;r++){const y0=horizon*(.5+r*.16),n=34+r*4,sz=5+r*1.6;for(let i=0;i<n;i++){const seed=Math.sin(i*12.9898+r*78.233)*43758.5453,f=seed-Math.floor(seed);
      const x=(i+.5)/n*W+(f-.5)*8,b=Math.max(0,Math.sin(t*(4+f*3)+f*9))*(1.5+hype*6);g.fillStyle=f<.12?acc:`rgba(${40+f*40|0},${34+f*30|0},${44+f*40|0},1)`;
      g.beginPath();g.arc(x,y0-b,sz,0,7);g.fill();g.fillRect(x-sz*1.1,y0-b+sz*.6,sz*2.2,sz*2.4);if(hype>.4&&f>.8){g.fillRect(x+sz*.8,y0-b-sz*2.6,2,sz*2);}}}};

/* ---------- common HUD ---------- */
D.hud=(g,W,S,o)=>{o=o||{};const f=S._f,zn=f&&f.zoneT>0;D.glass(g,14,12,o.w||170,o.h||74);if(zn){g.strokeStyle="#ffd34d";g.lineWidth=2;D.round(g,14,12,o.w||170,o.h||74,10);g.stroke();}
  {const v=f?f.disp:S.score,b=f?f.bump:0;g.save();g.translate(28,54);g.scale(1+b*.28,1+b*.28);D.text(g,String(Math.round(v)),0,0,44,zn?"#ffd34d":b>.05?`rgb(255,${255-b*80|0},${255-b*200|0})`:"#fff","left",800);g.restore();}D.small(g,o.label||"POINTS",30,76,12);
  if(o.combo>1){const k=Math.min(1,(o.combo%10)/10);D.glass(g,14,92,170,34,.5);D.text(g,o.combo+" IN A ROW",26,116,22,A.K.col(),"left",800,true);g.fillStyle="rgba(255,255,255,.12)";g.fillRect(24,121,150,3);g.fillStyle=A.K.col();g.fillRect(24,121,150*k,3);}
  if(o.lives!=null){for(let i=0;i<(o.maxLives||3);i++){D.ball(g,W-30-i*34,34,12,i*1.3,A.K.col(),i<o.lives?1:.18);}}
  if(o.tag){g.font=`700 ${Math.round(13*A.ui)}px 'Barlow',sans-serif`;const w=g.measureText(o.tag).width+22,h=14+13*A.ui;D.glass(g,W-14-w,56,w,h,.5);D.small(g,o.tag,W-25,56+h-8,13,"rgba(255,255,255,.85)","right");}};
D.meter=(g,x,y,w,h,v,col,label)=>{D.round(g,x,y,w,h,h/2);g.fillStyle="rgba(255,255,255,.1)";g.fill();if(v>0){D.round(g,x,y,Math.max(h,w*clamp(v,0,1)),h,h/2);g.fillStyle=col;g.fill();}if(label)D.small(g,label,x,y-5,11);};

/* ---------- daily challenge: one game a day with a twist and a target ---------- */
A.daily=()=>{const K=A.K,d=K.today(),r=M.seeded(parseInt(K.hash("arcade"+d+K.who()),36)%2147483647),ids=A.order.filter(id=>A.games[id].daily);if(!ids.length)return null;
  const id=ids[Math.floor(r()*ids.length)],G=A.games[id],ch=G.daily[Math.floor(r()*G.daily.length)];return {id,day:d,title:G.title,...ch};};

/* ---------- the fun layer, shared by every game ----------
   What makes short arcade games moreish, applied the same way to all of them:
   - juice: a rolling score that punches on every point, rising chimes as a streak grows, callouts at streak milestones
   - a "Zone" (fever) meter that fills with points; full, every point counts double for a few seconds
   - losing a streak is felt (and drains the Zone a little), so streaks matter
   - 1 to 3 stars per game and mode (Rookie tops out at 2), with near-miss lines on the results ("4 more for ★★★")
   - missions per game that step up each time you clear one, so every run has a short-term goal
   - instant retry (R), a READY / GO! beat at the start
   - your player card grades give small perks (The Spike-style stats): wider timing, longer and faster Zones */
const STARS={dig:[80,220,450],quick:[5,12,25],serve:[30,80,160],block:[40,110,220],setter:[60,160,320]};
const ZFILL={dig:70,quick:32,serve:26,block:38,setter:55};
const MILES={5:["NICE!","5 in a row"],10:["ON FIRE!","10 in a row"],15:["MONSTER!","15 in a row"],20:["UNSTOPPABLE!","20 in a row"],30:["LEGENDARY!","30 in a row"],40:["GOD MODE","40 in a row"]};
A.STARS=STARS;
A.starsFor=(id,mk,v)=>{const t=STARS[id]||[1e9,1e9,1e9];let n=t.filter(x=>v>=x).length;if(mk==="rookie")n=Math.min(2,n);return n;};
A.starTotal=c=>{let n=0;const s=c.stars||{};Object.values(s).forEach(m=>Object.values(m||{}).forEach(v=>n+=+v||0));return n;};
A.starMax=()=>Object.keys(STARS).length*8;
const comboOf=S=>+(S.combo!=null?S.combo:S.streak!=null?S.streak:0)||0;
/* missions: three tracks per game (score, streak, Zones), each with a tier that rises when cleared */
A.missions=(c,id)=>{c.miss=c.miss&&typeof c.miss==="object"?c.miss:{};const m=c.miss[id]=c.miss[id]||{s:0,c:0,z:0},t=STARS[id]||[50];
  return [{k:"s",t:m.s,n:Math.round(t[0]*(.5+.4*m.s)),text:n=>`Score ${n} in one game`,v:S=>S.score},
    {k:"c",t:m.c,n:4+3*m.c,text:n=>`Reach ${n} in a row`,v:S=>S._f?S._f.maxCombo:0},
    {k:"z",t:m.z,n:1+m.z,text:n=>n===1?"Get into the Zone":`Get into the Zone ${n} times in one game`,v:S=>S._f?S._f.zones:0}].map(x=>({...x,f:20+Math.min(10,x.t)*8,label:x.text(x.n)}));};
function funStart(S,id,perk){S._f={disp:0,bump:0,zone:0,zoneT:0,zones:0,last:0,lastCombo:0,maxCombo:0,lives:S.lives,ready:0,perk,done:{},id};}
function funStep(S,gdt,dt,ctx,G){const f=S._f;if(!f)return;const F=ctx.F,K=ctx.K,W=ctx.st.W,H=ctx.st.H;f.ready+=dt;
  let d=S.score-f.last;
  if(d>0){if(f.zoneT>0){S.score+=d;F.pop(W/2,H*.2,"×2",{col:"#ffd34d",size:26,life:.6});}
    else{f.zone=Math.min(1,f.zone+d/(ZFILL[f.id]||40)*f.perk.fill);if(f.zone>=1){f.zone=0;f.zoneT=6*f.perk.dur;f.zones++;F.slowmo(.35,.4);F.flashOn(.6,"255,211,77");F.hit(.5);
      F.pop(W/2,H*.4,"IN THE ZONE",{col:"#ffd34d",size:62,life:1.5,sub:"Every point counts double",big:true});F.burst(W/2,H*.4,40,{col:["#ffd34d","#fff",K.col()],speed:600,size:5,shape:"spark",g:0});K.sfx("zone");}}
    f.bump=1;}
  f.last=S.score;f.disp=f.disp+(S.score-f.disp)*(1-Math.exp(-14*dt));if(Math.abs(S.score-f.disp)<.5)f.disp=S.score;f.bump=Math.max(0,f.bump-dt*4);
  const c=comboOf(S);
  if(c>f.lastCombo){K.sfx("chime",c);f.maxCombo=Math.max(f.maxCombo,c);const m=MILES[c];if(m&&!(f.id==="dig"&&c===10)){F.pop(W/2,H*.3,m[0],{col:K.col(),size:52,life:1.1,sub:m[1]});F.hit(.35);if(c>=10)F.slowmo(.5,.25);K.sfx("perfect");}}
  else if(c<f.lastCombo&&c===0&&f.lastCombo>=5){F.pop(W/2,H*.3,"STREAK LOST",{col:"#9a94a6",size:34,life:1,sub:`${f.lastCombo} in a row`});f.zone=Math.max(0,f.zone-.25);}
  f.lastCombo=c;
  if(S.lives!=null&&f.lives!=null&&S.lives<f.lives)f.zone=Math.max(0,f.zone-.15);f.lives=S.lives;
  if(f.zoneT>0){f.zoneT-=gdt;if(f.zoneT<=0){f.zoneT=0;F.pop(W/2,H*.2,"ZONE OVER",{col:"#c9c3d4",size:24,life:.8});}}
  /* missions cleared mid-run */
  const c0=K.C();A.missions(c0,f.id).forEach(m=>{if(!f.done[m.k]&&m.v(S)>=m.n){f.done[m.k]=m;F.pop(W/2,H*.62,"MISSION ✓",{col:"#7dffa8",size:30,life:1.4,sub:m.label});K.sfx("coin");}});}
function funDraw(g,S,ctx){const f=S._f;if(!f)return;const W=ctx.st.W,H=ctx.st.H,K=ctx.K;
  /* the Zone meter, top centre */
  const w=240,x=W/2-w/2,y=16,zn=f.zoneT>0,v=zn?f.zoneT/(6*f.perk.dur):f.zone;
  D.glass(g,x-8,y-6,w+16,30,.55);D.round(g,x,y+11,w,8,4);g.fillStyle="rgba(255,255,255,.12)";g.fill();
  if(v>0){D.round(g,x,y+11,Math.max(8,w*v),8,4);const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,zn?"#ffb100":K.col());gr.addColorStop(1,zn?"#fff2b0":"#ffd34d");g.fillStyle=gr;g.fill();}
  if(!zn&&f.zone>.85){g.globalAlpha=.5+.5*Math.sin(ctx.F.t*14);g.strokeStyle="#ffd34d";g.lineWidth=2;D.round(g,x-2,y+9,w+4,12,6);g.stroke();g.globalAlpha=1;}
  D.small(g,zn?`IN THE ZONE ×2 · ${f.zoneT.toFixed(1)}s`:"ZONE",W/2,y+6,10,zn?"#ffd34d":"rgba(255,255,255,.7)","center");
  /* a golden frame while in the Zone */
  if(zn){const p=.55+.45*Math.sin(ctx.F.t*8);const vg=g.createRadialGradient(W/2,H/2,H*.42,W/2,H/2,W*.62);vg.addColorStop(0,"rgba(255,200,40,0)");vg.addColorStop(1,`rgba(255,190,30,${.28*p})`);g.fillStyle=vg;g.fillRect(0,0,W,H);}
  /* READY / GO! */
  if(f.ready<1){const r=f.ready,t=r<.55?"READY":"GO!",k=r<.55?r/.55:(r-.55)/.45,a=r<.55?Math.min(1,k*3):1-k,s=r<.55?1:1+k*.6;
    g.save();g.globalAlpha=Math.max(0,a);g.translate(W/2,H*.46);g.scale(s,s);g.font="italic 900 84px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";
    g.lineWidth=8;g.strokeStyle="rgba(10,8,12,.85)";g.strokeText(t,0,0);g.fillStyle=r<.55?"#fff":K.col();g.fillText(t,0,0);g.restore();}}
A.funStep=funStep;A.funDraw=funDraw;

/* ---------- mounting a game in the Nest panel ---------- */
const fsOk=()=>!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
A.add=(id,def)=>{A.games[id]=def;if(!A.order.includes(id))A.order.push(id);};
A.mount=(P,id,K)=>{A.K=K;const G=A.games[id];if(!G)return null;const c=K.C();c.mode=c.mode&&typeof c.mode==="object"?c.mode:{};const mode=A.MODES[c.mode[id]]?c.mode[id]:"varsity";
  const bm=(c.bestM&&c.bestM[id])||{},dl=A.daily(),isDaily=dl&&dl.id===id,dDone=c.daily&&c.daily[dl&&dl.day];
  P.innerHTML=`<div class="ngame arc" data-game="${id}"><div class="ngh"><div><div class="kicker">Mini-game${G.isNew?' · <span class="newtag">New</span>':""}</div><h3>${esc(G.title)}</h3><p class="small muted">${G.desc}</p></div>
      <div class="ngbest">Best <b>${G.bestOf(c)}</b><small>${esc(G.unit||"")}</small></div></div>
    <div class="arcbar"><div class="seg modes" role="group" aria-label="Difficulty">${Object.entries(A.MODES).map(([k,m])=>`<button type="button" data-amode="${k}" aria-pressed="${k===mode}" title="${esc(m.note)}">${m.label}${bm[k]?` <small>${bm[k]}</small>`:""}</button>`).join("")}</div>
      ${isDaily?`<div class="adaily ${dDone?"done":""}"><b>${dDone?"✓ Daily challenge done":"Daily challenge"}</b><span>${esc(dl.text)} · +${dl.f} feathers</span><button type="button" class="btn sm ${dDone?"":"primary"}" data-adaily ${dDone?"disabled":""}>${dDone?"Done today":"Play it"}</button></div>`:""}
      ${G.extra||""}<button type="button" class="btn sm ghost" data-apause aria-pressed="false">Pause</button>${fsOk()?`<button type="button" class="btn sm ghost" data-afull>Full screen</button>`:""}</div>
    <p class="arcrot">Turn your phone sideways (or tap Full screen) for a bigger court.</p>
    <div class="gstage"><canvas id="arcCv" aria-label="${esc(G.title)} game. ${esc(G.aria||"")}"></canvas><div class="gover" id="arcOver"></div></div>
    <details class="archow"><summary>How to play and score</summary><ul>${G.how.map(h=>`<li>${h}</li>`).join("")}</ul></details></div>`;
  const cv=$("#arcCv",P),st=stage(cv,G.W||960,G.H||560),F=fx();let S=null,mod=A.MODES[mode],runMod=mod,challenge=null,paused=false,startedAt=0,finishedAt=0;
  const over=$("#arcOver",P);
  const menu=(res)=>{over.hidden=false;over.classList.toggle("res",!!res);
    const mk0=Object.keys(A.MODES).find(k=>A.MODES[k]===mod),c0=K.C(),sn=((c0.stars||{})[id]||{})[mk0]||0,stx=n=>`<span class="ostars" aria-label="${n} of 3 stars">${[0,1,2].map(i=>`<i class="${i<n?"on":""}${mk0==="rookie"&&i===2?" cap":""}">★</i>`).join("")}</span>`;
    const ms=A.missions(c0,id),mhtml=done=>`<ul class="omiss">${ms.map(m=>`<li class="${done&&done[m.k]?"ok":""}"><span>${done&&done[m.k]?"✓":"○"}</span>${esc(m.label)}<small>+${m.f}</small></li>`).join("")}</ul>`;
    if(!res){const th=STARS[id]||[];over.innerHTML=`<b>${esc(G.title)}</b><span>${esc(G.tag||"")}</span><div class="omode">${mod.label}${challenge?" · Daily challenge":""} ${stx(sn)}</div>
      <div class="othr">${th.map((t,i)=>`<span class="${i<sn?"on":""}">${"★".repeat(i+1)} ${t}</span>`).join("")}${mk0==="rookie"?"<em>Rookie tops out at ★★</em>":""}</div>
      ${G.controls?`<div class="octl">${G.controls}</div>`:""}<div class="omt">Missions</div>${mhtml()}<button class="btn primary" type="button" data-ago>Start</button><small class="muted">Enter starts · P pauses · R restarts</small>`;return;}
    const ns=res.stars||0,th=STARS[id]||[],nx=th[ns],near=ns<3&&nx!=null&&!(mk0==="rookie"&&ns>=2)?`${Math.max(1,Math.ceil(nx-res.val))} more for ${"★".repeat(ns+1)}`:"",nb2=!res.newBest&&res.prev>0&&res.val>=res.prev*.85&&res.val<res.prev?`Just ${Math.ceil(res.prev-res.val)} off your best`:"";
    over.innerHTML=`<div class="ostars big" aria-label="${ns} of 3 stars">${[0,1,2].map(i=>`<i class="${i<ns?"on":""}" style="animation-delay:${.25+i*.28}s">★</i>`).join("")}</div><b>${esc(res.head)}</b><span>${res.newBest?"New best! ":""}${esc(res.sub||"")}</span>
      ${near||nb2?`<div class="onear">${esc([nb2,near].filter(Boolean).join(" · "))}</div>`:""}<div class="ostats">${res.stats.map(([k,v])=>`<div><b>${esc(String(v))}</b><small>${esc(k)}</small></div>`).join("")}</div>
      ${res.mdone&&res.mdone.length?`<div class="omt">Missions cleared</div><ul class="omiss">${res.mdone.map(m=>`<li class="ok"><span>✓</span>${esc(m.label)}<small>+${m.f}</small></li>`).join("")}</ul>`:""}
      ${res.tip?`<p class="otip">${esc(res.tip)}</p>`:""}<div class="ofe">+${res.fe} feathers${res.daily?` · daily challenge ${res.daily==="won"?"complete: +"+challenge.f:"missed ("+esc(challenge.text)+")"}`:""}</div><button class="btn primary" type="button" data-ago>Play again</button><small class="muted">Space or R plays again</small>`;
    return;
};
  const start=()=>{paused=false;over.hidden=true;F.parts.length=0;F.pops.length=0;F.rings.length=0;F.shake=0;F.flash=0;F.slow=1;F.slowT=0;F.stop=0;
    const perk=K.perks?K.perks():{win:1,dur:1,fill:1,power:1};runMod=Object.assign({},mod,{win:mod.win*perk.win});
    S={on:true,t:0,score:0,mode:runMod,id,challenge};A.cur=ctx;G.start(S,ctx);funStart(S,id,perk);startedAt=performance.now();cv.focus({preventScroll:true});K.sfx("tick");};
  /* the game calls this when it ends */
  const finish=()=>{if(!S||!S.on)return;S.on=false;finishedAt=performance.now();if(G.release)G.release(S);const r=G.result(S),c=K.C();c.games++;
    let fe=Math.round(r.fe*mod.fe);const prev=G.bestOf(c)||0;c.bestM=c.bestM||{};c.bestM[id]=c.bestM[id]||{};const mk=Object.keys(A.MODES).find(k=>A.MODES[k]===mod);
    const nb=r.best>(G.bestOf(c)||0);G.saveBest(c,r.best);if(r.best>(c.bestM[id][mk]||0))c.bestM[id][mk]=r.best;
    (r.count||[]).forEach(([k,n])=>{c.stats=c.stats||{};c.stats[k]=(c.stats[k]||0)+n;});if(r.legacy)r.legacy(c);
    const f=S._f||{done:{},zones:0};c.stats=c.stats||{};c.stats.zones=(c.stats.zones||0)+f.zones;
    const ns=A.starsFor(id,mk,r.best);c.stars=c.stars&&typeof c.stars==="object"?c.stars:{};c.stars[id]=c.stars[id]||{};if(ns>(c.stars[id][mk]||0))c.stars[id][mk]=ns;
    A.missions(c,id);const mdone=Object.values(f.done);mdone.forEach(m=>{c.miss[id][m.k]=(c.miss[id][m.k]||0)+1;fe+=m.f;});
    let daily=null;if(challenge){const ok=challenge.ok(S,r);daily=ok?"won":"lost";if(ok){c.daily=c.daily||{};c.daily[challenge.day]=true;c.dailyN=(c.dailyN||0)+1;fe+=challenge.f;}}
    K.award(fe);K.save();menu({head:r.head,sub:r.sub,stats:f.zones?r.stats.concat([["Zones",f.zones]]):r.stats,tip:r.tip,fe,newBest:nb,daily,stars:ns,val:r.best,prev,mdone});if(ns>=3)K.sfx("thunder");
    if(nb||daily==="won")K.sfx("unlock");K.checkBadges();K.refreshStats();const be=$(".ngbest b",P);if(be)be.textContent=G.bestOf(K.C());challenge=null;};
  menu(null);
  const togglePause=(v)=>{if(!S||!S.on)return;paused=v==null?!paused:v;if(G.release)G.release(S);const b=$("[data-apause]",P);if(b){b.setAttribute("aria-pressed",paused);b.textContent=paused?"Resume":"Pause";}
    if(paused){over.hidden=false;over.classList.remove("res");over.innerHTML=`<b>Paused</b><span>Take a breath.</span><button class="btn primary" type="button" data-aresume>Resume</button>`;}else over.hidden=true;};
  const onClick=e=>{const b=e.target.closest("button");if(!b||!P.contains(b))return;
    if(b.hasAttribute("data-ago")){start();return;}if(b.hasAttribute("data-afull")){toggleFull();return;}if(b.hasAttribute("data-aresume")){togglePause(false);cv.focus({preventScroll:true});return;}if(b.hasAttribute("data-apause")){togglePause();return;}
    if(b.dataset.amode){if(S&&S.on)return;c.mode[id]=b.dataset.amode;K.save();mod=A.MODES[b.dataset.amode];P.querySelectorAll("[data-amode]").forEach(x=>x.setAttribute("aria-pressed",x===b));menu(null);return;}
    if(b.hasAttribute("data-adaily")){const d=A.daily();if(!d)return;const mk=d.mode||"varsity";mod=A.MODES[mk];P.querySelectorAll("[data-amode]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.amode===mk));challenge=d;start();}};
  const down=e=>{if(!S||!S.on||paused)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(err){}const [x,y]=st.pt(e);G.down&&G.down(S,x,y,e);};
  const move=e=>{if(!S||!S.on||paused)return;const [x,y]=st.pt(e);G.move&&G.move(S,x,y,e);};
  const up=e=>{if(!S||!S.on)return;const [x,y]=st.pt(e);G.up&&G.up(S,x,y,e);};
  const key=e=>{if(!K.isNest()||!document.contains(cv))return;const k=e.key;
    if((k==="p"||k==="P"||k==="Escape")&&S&&S.on){e.preventDefault();togglePause();return;}
    if((k==="r"||k==="R")&&!e.ctrlKey&&!e.metaKey&&(document.activeElement===cv||document.activeElement===document.body)&&!paused){e.preventDefault();if(S&&S.on)S.on=false;start();return;}
    if(!S||!S.on){if((k===" "||k==="Enter")&&(document.activeElement===cv||document.activeElement===document.body)){e.preventDefault();/* a moment to see the results before a held key restarts */if(performance.now()-finishedAt>1300)start();}return;}
    if(paused)return;if(G.key&&G.key(S,k,e)!==false&&(k===" "||k.startsWith("Arrow")))e.preventDefault();};
  const keyUp=e=>{if(S&&S.on&&!paused&&G.keyUp)G.keyUp(S,e.key,e);};
  const vis=()=>{if(document.hidden)togglePause(true);};const blur=()=>togglePause(true);
  cv.tabIndex=0;cv.addEventListener("pointerdown",down);cv.addEventListener("pointermove",move);cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);cv.addEventListener("contextmenu",e=>e.preventDefault());P.addEventListener("click",onClick);
  window.addEventListener("keydown",key);window.addEventListener("keyup",keyUp);document.addEventListener("visibilitychange",vis);window.addEventListener("blur",blur);
  /* full screen (sideways on phones, where it's supported) */
  const gs=$(".gstage",P),toggleFull=()=>{const d=document,el=d.fullscreenElement||d.webkitFullscreenElement;
    if(el){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;}const rq=gs.requestFullscreen||gs.webkitRequestFullscreen;if(!rq)return;
    Promise.resolve(rq.call(gs)).then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock("landscape").catch(()=>{});}catch(e){}cv.focus({preventScroll:true});}).catch(()=>{});};
  const ctx={st,F,K,get mod(){return S&&S.on?runMod:mod;},get challenge(){return challenge;},finish};A.cur=ctx;
  A.state=()=>S;/* for tests and debugging */
  G.init&&G.init(ctx);
  const update=dt=>{A.cur=ctx;const cw=cv.clientWidth||st.W;A.ui=clamp(560/cw,1,1.6);st.begin();const g=st.g;let gdt=0;if(S&&S.on&&!paused){gdt=F.step(dt);S.t+=gdt;if(A.autoplay&&G.bot)G.bot(S,ctx,gdt,dt);G.update(S,gdt,ctx,dt);if(S.on)funStep(S,gdt,dt,ctx,G);}else F.step(paused?0:dt);
    const [ox,oy]=K.reduced()?[0,0]:F.offset();g.save();g.translate(ox,oy);G.draw(g,S,ctx,dt);F.draw(g,st.W,st.H);g.restore();if(S&&G.hud)G.hud(g,S,ctx);if(S&&S.on)funDraw(g,S,ctx);};
  update(0);
  return {update,stop(){window.removeEventListener("keydown",key);window.removeEventListener("keyup",keyUp);document.removeEventListener("visibilitychange",vis);window.removeEventListener("blur",blur);P.removeEventListener("click",onClick);if(S)S.on=false;}};};
})();
