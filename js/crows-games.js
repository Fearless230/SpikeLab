/* crows-games.js: the Crow's Nest mini-games, on the engine in crows-arcade.js.
   Dig Defence  : read and dig waves of attacks (spikes, tips, roll shots, block deflections that may fly out, fakes)
   Freak Quick  : time the swing to the set and pick the shot (line, cross or tip) against a live block
   Jump Serve   : toss, power and aim a spin or float serve at live passers; seams and target zones score aces
   Block Party  : read the setter, shuffle along the net and time the jump to stuff the hitter (with decoys)
   Setter's Vision: read the pass and the block and choose the open hitter (or dump) before the time runs out */
(function(){
"use strict";
const VB=window.VB,A=VB.crowArcade;if(!A)return;
const {clamp,lerp,ease,rand,pick,damp}=A.M,D=A.draw;
const acc=()=>A.K.col(),accRgb=()=>A.K.rgb();
const TAU=Math.PI*2;
/* modes give k (speed), win (timing window) and fe (feathers) */

/* =====================================================================================================
   DIG DEFENCE
   ===================================================================================================== */
(function(){
  const W=960,H=560,K={ty:206,by:548,tl:262,tr:698,bl:56,br:904};
  const cp=(u,v)=>{const y=K.ty+(K.by-K.ty)*v,l=K.tl+(K.bl-K.tl)*v,r=K.tr+(K.br-K.tr)*v;return [l+(r-l)*u,y,.55+.75*v];};
  const ZONE={4:[0,0],3:[1,0],2:[2,0],5:[0,1],6:[1,1],1:[2,1]};
  const zoneAt=(u,v)=>{if(u<0||u>1||v>1)return null;const col=clamp(Math.floor(u*3),0,2),row=v<1/3?0:1;return +Object.keys(ZONE).find(z=>ZONE[z][0]===col&&ZONE[z][1]===row);};
  const WAVES=["Spikes","Tips join in","Roll shots: the ring drifts","Block deflections: some fly out. Let them go!","Two at once","Read the hitter: rings appear late"];
  let back=null,floor=null,net=null;
  function makeFloor(){const c=document.createElement("canvas"),dpr=Math.min(2,devicePixelRatio||1);c.width=W*dpr;c.height=H*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);
    const fl=g.createLinearGradient(0,K.ty,0,H);fl.addColorStop(0,"#5a2a0d");fl.addColorStop(.5,"#a54c14");fl.addColorStop(1,"#d06a22");g.fillStyle=fl;
    g.beginPath();g.moveTo(K.tl-70,K.ty);g.lineTo(K.tr+70,K.ty);g.lineTo(W+120,H);g.lineTo(-120,H);g.closePath();g.fill();
    /* planks */
    g.save();g.clip();for(let i=-12;i<26;i++){const a=cp(i/14,0),b=cp(i/14,1.05);g.strokeStyle=`rgba(0,0,0,${.06+(i%3===0?.05:0)})`;g.lineWidth=1.2;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    const sh=g.createRadialGradient(W/2,H*.95,40,W/2,H*.95,W*.7);sh.addColorStop(0,"rgba(255,220,170,.22)");sh.addColorStop(1,"rgba(0,0,0,.25)");g.fillStyle=sh;g.fillRect(0,0,W,H);g.restore();
    /* lines */
    g.strokeStyle="#f4efe6";g.lineWidth=4;g.beginPath();[cp(0,0),cp(1,0),cp(1,1),cp(0,1)].forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();
    const m1=cp(0,1/3),m2=cp(1,1/3);g.lineWidth=3;g.beginPath();g.moveTo(m1[0],m1[1]);g.lineTo(m2[0],m2[1]);g.stroke();
    g.font="800 30px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillStyle="rgba(255,255,255,.1)";Object.entries(ZONE).forEach(([z,[cc,r]])=>{const p=cp((cc+.5)/3,r===0?.17:.66);g.fillText(z,p[0],p[1]);});
    return c;}
  function makeNet(){const c=document.createElement("canvas"),dpr=Math.min(2,devicePixelRatio||1);c.width=W*dpr;c.height=H*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);
    const nt=K.ty-104;g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.moveTo(K.tl-44,K.ty);g.lineTo(K.tr+44,K.ty);g.lineTo(K.tr+60,K.ty+16);g.lineTo(K.tl-60,K.ty+16);g.closePath();g.fill();
    g.fillStyle="rgba(255,255,255,.05)";g.fillRect(K.tl-44,nt,K.tr-K.tl+88,98);g.strokeStyle="rgba(255,255,255,.2)";g.lineWidth=1;
    for(let x=K.tl-44;x<=K.tr+44;x+=11){g.beginPath();g.moveTo(x,nt);g.lineTo(x,nt+98);g.stroke();}for(let y=nt;y<=nt+98;y+=11){g.beginPath();g.moveTo(K.tl-44,y);g.lineTo(K.tr+44,y);g.stroke();}
    g.fillStyle="#f4efe6";g.fillRect(K.tl-44,nt-5,K.tr-K.tl+88,9);g.fillStyle="#2a2730";g.fillRect(K.tl-58,nt-12,11,124);g.fillRect(K.tr+47,nt-12,11,124);
    for(let k=0;k<7;k++){g.fillStyle=k%2?"#f4efe6":"#e0442b";g.fillRect(K.tl-44,nt-60+k*8,4,8);g.fillRect(K.tr+40,nt-60+k*8,4,8);}
    return c;}
  const T0=1.3;
  function start(S,X){S.lives=3;S.maxLives=5;S.wave=0;S.balls=[];S.combo=0;S.bestCombo=0;S.digs=0;S.perfects=0;S.drops=0;S.shanks=0;S.leaves=0;S.stamina=1;S.focus=0;S.focusT=0;S.hype=0;
    S.me={x:W/2,y:H-40,tx:W/2,ty:H-40,dive:0};S.hitters=[{x:W*.38,t:9,arm:0},{x:W*.62,t:9,arm:0}];S.ch=X.challenge;nextWave(S,X);}
  function nextWave(S,X){S.wave++;S.left=6+S.wave;S.next=1.4;S.waveDrops=0;S.boss=S.wave%5===0;S.banner={t:0,txt:S.boss?`WAVE ${S.wave}: THE ACE`:`WAVE ${S.wave}`,sub:S.boss?"Fakes and full speed. Stay patient.":WAVES[Math.min(WAVES.length-1,S.wave-1)]};
    if(S.wave>1)X.K.sfx("whistle");}
  function spawn(S,X){const m=X.mod,w=S.wave,ch=S.ch&&S.ch.rule;
    const types=["spike"];if(w>=2||ch==="tips")types.push("tip");if(w>=3)types.push("roll");if(w>=4)types.push("tool");if(S.boss)types.push("fake","fake");
    let type=ch==="tips"?pick(["tip","tip","spike"]):pick(types);
    const tip=type==="tip"||type==="fake",zone=tip?pick([4,3,2]):pick([1,2,3,4,5,6]),[col,row]=ZONE[zone];
    const u=(col+.15+Math.random()*.7)/3,v=tip?(.05+Math.random()*.24):row===0?(.12+Math.random()*.2):(.38+Math.random()*.55);
    const speed=m.k*(1+Math.min(.65,(w-1)*.055))*(S.boss?1.12:1),T=Math.max(.5,T0/speed)*(type==="tip"?1.5:type==="roll"?1.3:type==="fake"?1.45:1);
    const hi=pick(S.hitters);hi.t=0;hi.arm=u<.5?-1:1;
    const b={type,u,v,L:cp(u,v),x0:hi.x,T,t:-.38,dug:false,trail:[],rot:0,id:Math.random(),reveal:(w>=6||ch==="read")?.36:0,hitter:hi,wob:Math.random()*6};
    if(type==="fake"){b.fakeU=clamp(u+rand(-.3,.3),.05,.95);b.fakeV=.55+Math.random()*.35;}
    if(type==="tool"){/* the block deflection: after 45% of the flight the ball changes direction; a third of them fly out */
      const out=Math.random()<.36;b.toU=out?pick([rand(-.28,-.06),rand(1.06,1.28)]):clamp(u+rand(-.45,.45),.04,.96);b.toV=out&&Math.random()<.4?rand(1.07,1.2):clamp(v+rand(-.1,.35),.1,.97);b.out=out||b.toV>1.02;}
    S.balls.push(b);}
  /* where the ring is at progress p (ball's landing spot as the defender can read it) */
  function target(b,p){if(b.type==="tool"&&p>=.45)return [b.toU,b.toV];if(b.type==="fake"&&p<.32)return [b.fakeU,b.fakeV];
    if(b.type==="roll"){const k=ease.inOut(clamp(p/.75,0,1));return [b.u+(1-k)*.22*Math.sin(b.wob),b.v-(1-k)*.14];}return [b.u,b.v];}
  const ringR=(S,b,p)=>{const L=cp(...target(b,p));return (80-46*p)*L[2]*(b.type==="tip"||b.type==="fake"?.82:1)*(.72+.28*S.stamina)*(S.focusT>0?1.15:1);};
  function ballPos(b,p){const [tu,tv]=target(b,1),L=cp(tu,tv),sx=b.x0,sy=K.ty-138;let e=b.type==="tip"||b.type==="fake"?p:Math.pow(p,1.12);
    /* the deflected ball leaves the block at 45% on a new line */
    if(b.type==="tool"&&p>=.45){const P0=cp(b.u,b.v),m=[sx+(P0[0]-sx)*.45,sy+(P0[1]-sy)*.45],k=(p-.45)/.55;return [m[0]+(L[0]-m[0])*k,m[1]+(L[1]-m[1])*k-Math.sin(Math.PI*k)*70,.75+(L[2]-.75)*k];}
    const arc=b.type==="tip"||b.type==="fake"?135:b.type==="roll"?70:18,x=sx+(L[0]-sx)*e,y=sy+(L[1]-sy)*e-Math.sin(Math.PI*p)*arc;return [x,y,.7+(L[2]-.7)*p];}
  function grade(S,b,p,X){const w=X.mod.win,pLo=1-.2*w,pHi=1-.055*w;return p<.42?"shank":p<pLo?"good":p<=pHi?"perfect":"clutch";}
  function tap(S,X,x,y,zone){let best=null;S.balls.forEach(b=>{if(b.dug||b.t<0||b.gone)return;const p=b.t/b.T;if(b.reveal&&p<b.reveal)return;const L=cp(...target(b,p)),r=ringR(S,b,p)+18,dx=(x-L[0])/r,dy=(y-L[1])/(r*.5);
      const hit=zone!=null?zoneAt(...target(b,p))===zone:dx*dx+dy*dy<=1.35;if(hit&&(!best||b.T-b.t<best.T-best.t))best=b;});
    if(!best){if(zone==null){S.me.tx=x;S.me.ty=clamp(y,K.ty+40,H-30);}return;}
    const p=best.t/best.T,L=cp(...target(best,p));S.me.tx=L[0];S.me.ty=L[1]+30;S.me.dive=Math.hypot(S.me.x-L[0],S.me.y-L[1])>220?1:0;
    if(best.type==="tool"&&best.out&&p>=.45){/* touching a ball that was going out gives the point away */
      best.dug=true;best.dt=0;best.from=ballPos(best,p);S.combo=0;S.stamina=Math.max(0,S.stamina-.08);X.F.pop(L[0],L[1]-40,"IT WAS OUT!",{col:"#ff6b6b",sub:"Let deflections that leave the court go"});X.K.sfx("miss");return;}
    const gr=grade(S,best,p,X);best.dug=true;best.dt=0;best.from=ballPos(best,p);S.digs++;
    if(gr==="shank"){S.shanks++;S.combo=0;S.stamina=Math.max(0,S.stamina-.06);best.shank=true;X.F.pop(L[0],L[1]-40,"SHANKED",{col:"#ffb3a1",size:28,sub:"Too early: wait for it"});X.K.sfx("miss");return;}
    S.combo++;S.bestCombo=Math.max(S.bestCombo,S.combo);const mult=1+Math.min(2,Math.floor(S.combo/8)*.5);
    let pts=gr==="perfect"?3:gr==="clutch"?2:1;if(best.type==="fake"&&gr!=="good")pts+=2;
    S.score+=pts*mult;S.stamina=clamp(S.stamina-.04+(gr==="perfect"?.035:0),0,1);
    if(gr==="perfect"){S.perfects++;S.focus=Math.min(1,S.focus+.2);X.F.freeze(.045);X.F.ring(L[0],L[1],accRgb(),ringR(S,best,p)+30,8);}
    const name=gr==="perfect"?(best.type==="tip"?"PANCAKE!":"PERFECT"):gr==="clutch"?"CLUTCH":"DIG";
    X.F.pop(L[0],L[1]-46,`${name} +${Math.round(pts*mult)}`,{col:gr==="perfect"?acc():"#fff",size:gr==="perfect"?36:28,sub:mult>1?`×${mult} combo`:""});
    X.F.burst(L[0],L[1],gr==="perfect"?26:14,{col:[acc(),"#fff","#ffd9a8"],speed:380,up:120,size:5});X.K.sfx(gr==="perfect"?"perfect":"dig");
    if(S.combo%10===0){S.score+=5;X.F.pop(W/2,H*.42,"ROLLING THUNDER!",{col:acc(),size:60,life:1.3,sub:"+5"});X.F.hit(.7);X.F.flashOn(.5,accRgb());X.K.sfx("thunder");S.hype=1;}}
  function update(S,dt,X,raw){const F=X.F;
    S.hype=Math.max(0,S.hype-raw*.4);S.me.x=damp(S.me.x,S.me.tx,S.me.dive?9:12,raw);S.me.y=damp(S.me.y,S.me.ty,S.me.dive?9:12,raw);S.me.dive=Math.max(0,S.me.dive-raw*1.6);
    S.me.tx=damp(S.me.tx,W/2,.6,raw);S.me.ty=damp(S.me.ty,H-60,.6,raw);
    S.hitters.forEach(h=>h.t+=dt);if(S.focusT>0){S.focusT-=raw;if(S.focusT<=0)F.slow=1;}
    if(S.banner){S.banner.t+=raw;if(S.banner.t>2.2)S.banner=null;}
    if(S.brk>0){S.brk-=dt;S.stamina=Math.min(1,S.stamina+dt*.25);if(S.brk<=0)nextWave(S,X);}
    else{S.next-=dt;if(S.next<=0&&S.left>0){spawn(S,X);S.left--;if(S.wave>=5&&S.left>0&&Math.random()<.3+S.wave*.02){spawn(S,X);S.left--;}
        S.next=Math.max(.36,(1.25-S.wave*.07)/X.mod.k)*(S.boss?.9:1)+Math.random()*.25;}
      if(S.left<=0&&!S.balls.length){/* wave cleared */const clean=!S.waveDrops;S.brk=1.8;S.score+=S.wave*2;F.pop(W/2,H*.38,`WAVE ${S.wave} CLEARED`,{size:52,col:"#fff",life:1.6,sub:clean&&S.lives<S.maxLives?"Clean wave: +1 life":`+${S.wave*2} bonus`});
        if(clean&&S.lives<S.maxLives)S.lives++;X.K.sfx("unlock");S.hype=.8;if(S.ch&&S.ch.rule==="waves"&&S.wave>=S.ch.n){X.finish();return;}}}
    S.balls.forEach(b=>{if(b.dug){b.dt+=dt;b.rot+=dt*14;return;}b.t+=dt;b.rot+=dt*(b.type==="tip"?4:10);const p=b.t/b.T;if(b.t>0){const q=ballPos(b,Math.min(1,p));b.trail.push(q);if(b.trail.length>9)b.trail.shift();}
      if(b.t>=b.T){b.gone=true;const L=cp(...target(b,1));
        if(b.type==="tool"&&b.out){S.leaves++;S.score+=1;F.pop(L[0],L[1]-30,"GOOD LEAVE +1",{col:"#9be7a4",size:26});X.K.sfx("tick");}
        else{S.lives--;S.drops++;S.waveDrops++;S.combo=0;S.stamina=Math.max(0,S.stamina-.12);F.hit(.55);F.flashOn(.35,"255,60,60");X.K.sfx("drop");F.pop(L[0],L[1]-30,"DROP!",{col:"#ff5a5a",size:34});F.burst(L[0],L[1],10,{col:"#f6f3ea",speed:200,up:60,size:4});
          if(S.lives<=0){X.finish();}}}});
    S.balls=S.balls.filter(b=>!(b.gone)&&!(b.dug&&b.dt>.6));
    if(S.ch&&S.ch.rule==="score"&&S.score>=S.ch.n)X.finish();}
  function draw(g,S,X){if(!back){back=D.arena(W,H,K.ty-40,acc());floor=makeFloor();net=makeNet();}g.drawImage(back,0,0,W,H);D.crowd(g,W,K.ty-40,X.F.t,S?S.hype:0,acc());g.drawImage(floor,0,0,W,H);
    if(!S){g.drawImage(net,0,0,W,H);return;}
    /* opposing hitters at the net */
    /* the hitter jumps as the attack starts and swings through when the ball leaves the hand (0.38 s later) */
    S.hitters.forEach(h=>{const up=h.t<.7?Math.sin(clamp(h.t/.7,0,1)*Math.PI)*34:0,sw=clamp((h.t-.34)/.1,0,1),a2=h.t>2?.25:lerp(Math.PI*.95,.35,sw),a1=h.t>2?.2:lerp(Math.PI*.8,.4,sw);
      D.player(g,{x:h.x,y:K.ty-6-up,s:.82,col:"#2b2b38",col2:"#15151c",num:"",a1,a2,e2:h.t<.34?-.5:0,skin:"#c08a68",lean:h.arm*.08*sw});});
    g.drawImage(net,0,0,W,H);
    /* your defender */
    const me=S.me;D.shadow(g,me.x,me.y+4,34,.4);D.player(g,{x:me.x,y:me.y,s:1.15,col:acc(),num:A.K.ME().num||"",crouch:.8,lean:me.dive?(me.tx<me.x?-.7:.7)*me.dive:0,a1:.45,a2:-.45,e1:-.15,e2:.15});
    /* balls */
    S.balls.forEach(b=>{if(b.dug){const k=Math.min(1,b.dt/.6),dx=b.shank?(b.from[0]<W/2?-300:300):0,x=b.from[0]+(W/2+dx-b.from[0])*k,y=b.from[1]+((b.shank?260:70)-b.from[1])*k-Math.sin(Math.PI*k)*(b.shank?60:150);D.ball(g,x,y,17*b.from[2]*(1-.45*k),b.rot,acc(),1-k*.5);return;}
      if(b.t<0)return;const p=b.t/b.T,[tu,tv]=target(b,p),L=cp(tu,tv),r=ringR(S,b,p),hidden=b.reveal&&p<b.reveal,X2=grade(S,b,p,X);
      if(hidden){/* read cue: a faint cone from the hitter toward the side he's swinging at */const h=b.hitter,dir=b.u<.5?-1:1;g.fillStyle=`rgba(255,255,255,${.05+.05*Math.sin(X.F.t*12)})`;g.beginPath();g.moveTo(h.x,K.ty);g.lineTo(h.x+dir*260-60,H);g.lineTo(h.x+dir*260+60,H);g.closePath();g.fill();}
      else{const out=b.type==="tool"&&b.out&&p>=.45,perfect=X2==="perfect"||X2==="clutch";
        g.save();if(out)g.setLineDash([10,8]);g.strokeStyle=out?"rgba(255,90,90,.9)":perfect?acc():"rgba(255,255,255,.88)";g.lineWidth=perfect?5:3;g.beginPath();g.ellipse(L[0],L[1],r,r*.5,0,0,TAU);g.stroke();
        g.fillStyle=out?"rgba(255,60,60,.12)":perfect?`rgba(${accRgb()},.2)`:"rgba(255,255,255,.07)";g.fill();g.restore();
        g.strokeStyle="rgba(255,255,255,.35)";g.lineWidth=2;g.beginPath();g.ellipse(L[0],L[1],r*(1-p)*.9+6,(r*(1-p)*.9+6)*.5,0,0,TAU);g.stroke();
        if(out){D.text(g,"OUT? LEAVE IT",L[0],L[1]-r*.5-12,20,"#ff8a8a","center",800,true);}
        else if(b.type==="tip"||(b.type==="fake"&&p>=.32)){D.text(g,"TIP!",L[0],L[1]-r*.5-12,20,acc(),"center",800,true);}}
      const q=ballPos(b,Math.min(1,p)),gl=cp(lerp(.5,tu,p),lerp(-.02,tv,p));D.shadow(g,gl[0],gl[1],12*gl[2]*(.4+p*.6),.35*p+.1);D.trail(g,b.trail,"255,255,255");D.ball(g,q[0],q[1],17*q[2],b.rot,acc());});
    /* focus vignette */
    if(S.focusT>0){const v=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.7);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,`rgba(${accRgb()},.28)`);g.fillStyle=v;g.fillRect(0,0,W,H);}
    if(S.stamina<.3){g.fillStyle=`rgba(120,0,0,${(.3-S.stamina)*.5})`;g.fillRect(0,0,W,H);}}
  function hud(g,S,X){if(!S.on&&!S.lives)return;D.hud(g,W,S,{combo:S.combo,lives:S.lives,maxLives:S.maxLives,tag:`WAVE ${S.wave}${S.boss?" · THE ACE":""} · ${X.mod.label.toUpperCase()}`});
    D.glass(g,14,H-66,200,52);D.meter(g,26,H-48,176,8,S.stamina,S.stamina<.3?"#ff5a5a":"#9be7a4","STAMINA");D.meter(g,26,H-24,176,8,S.focus,acc(),S.focus>=1?"FOCUS READY (F)":"LIBERO FOCUS");
    if(S.focus>=1&&S.focusT<=0){D.glass(g,W-178,H-64,164,48,.7);D.text(g,"FOCUS",W-96,H-32,26,acc(),"center",800,true);}
    if(S.banner){const k=S.banner.t,a=k<.3?k/.3:k>1.8?1-(k-1.8)/.4:1;g.globalAlpha=clamp(a,0,1);D.glass(g,W/2-230,H*.2,460,78,.75);D.text(g,S.banner.txt,W/2,H*.2+42,34,"#fff","center",800,true);D.small(g,S.banner.sub,W/2,H*.2+66,14,"rgba(255,255,255,.8)","center");g.globalAlpha=1;}}
  function focus(S,X){if(S.focus<1||S.focusT>0)return;S.focus=0;S.focusT=4;X.F.slowmo(.45,4);X.F.flashOn(.4,accRgb());X.K.sfx("thunder");X.F.pop(W/2,H*.45,"LIBERO FOCUS",{col:acc(),size:50,sub:"Everything slows down"});}
  A.add("dig",{title:"Dig Defence",tag:"Waves of attacks. Don't let it touch the floor.",unit:"points",W,H,aria:"Tap the rings, or press zone numbers 1 to 6. F for focus.",
    desc:"Waves of attacks come over the net. Tap the ring before the ball lands. The later you tap, the better, until it's too late. Read the block deflections: if it's flying out, <b>let it go</b>.",
    how:["Tap a ring (or press its zone number, 1 to 6) to dig. <b>Perfect</b> is the last moment before it lands (+3), <b>Clutch</b> is just after (+2), early is a plain dig (+1). Tap too early and you <b>shank</b> it: no points and the combo resets.",
      "Every 8 in a row raises your combo multiplier (up to ×3). Every 10 in a row is a Rolling Thunder bonus.",
      "New waves bring tips (short and slow), roll shots (the ring drifts as you read it), block deflections that change direction (red dashed ring: it's going out, don't touch it), double attacks and, from wave 6, late rings: read the hitter's arm.",
      "Every 5th wave is <b>the Ace</b>: fakes that look like spikes and turn into tips.","<b>Stamina</b> drops as you dig and when you drop a ball; tired defenders have smaller rings. It recovers between waves.",
      "Perfect digs charge <b>Libero Focus</b>. Press F (or tap FOCUS) to slow everything down for 4 seconds.","A wave with no drops gives you a life back (up to 5)."],
    daily:[{text:"Survive 6 waves",rule:"waves",n:6,f:45,ok:(S)=>S.wave>=6&&S.lives>0},{text:"Score 60 points in a tips-only match",rule:"tips",n:60,f:45,ok:S=>S.score>=60},{text:"Score 80 with late rings from the start",rule:"read",n:80,f:50,ok:S=>S.score>=80},
      {text:"Reach 40 points on National",mode:"national",rule:"score",n:40,f:60,ok:S=>S.score>=40}],
    bestOf:c=>c.best.dig,saveBest:(c,v)=>{if(v>c.best.dig)c.best.dig=v;},
    start,update,draw,hud,
    down(S,x,y){const X=A.cur;if(S.focus>=1&&x>W-180&&y>H-70){focus(S,X);return;}tap(S,X,x,y);},
    key(S,k){const X=A.cur;if(/^[1-6]$/.test(k)){tap(S,X,0,0,+k);return;}if(k==="f"||k==="F")focus(S,X);else return false;},
    result(S){const sc=Math.round(S.score),acc2=S.digs?Math.round(S.perfects/S.digs*100):0;return {best:sc,head:`${sc} points`,sub:`Wave ${S.wave} reached`,fe:Math.floor(sc/4)+S.wave*3,
      stats:[["Digs",S.digs],["Perfect",`${acc2}%`],["Best combo",S.bestCombo],["Good leaves",S.leaves],["Drops",S.drops],["Shanks",S.shanks]],
      tip:S.shanks>S.perfects?"You're tapping early. Wait until the ring turns your colour.":S.drops>2&&S.leaves<1?"Watch for the red dashed rings: deflections going out are free points if you leave them.":"",
      count:[["digWaves",S.wave],["perfectDigs",S.perfects],["leaves",S.leaves]],legacy:c=>{c.digs+=S.digs;c.stats=c.stats||{};c.stats.bestWave=Math.max(c.stats.bestWave||0,S.wave);}};}});
})();

/* =====================================================================================================
   FREAK QUICK
   ===================================================================================================== */
(function(){
  const W=960,H=560,FLOOR=440,NETX=640,NETTOP=228,SETTER=[548,312];
  const TYPES={quick:{label:"QUICK",D:.4,apex:150,hit:[620,190],pts:3,blk:[0,1],close:.55},slide:{label:"SLIDE",D:.58,apex:140,hit:[616,196],pts:2,blk:[1,1],close:.75},
    high:{label:"HIGH OUTSIDE",D:.95,apex:40,hit:[606,200],pts:1,blk:[2,3],close:1.2},pipe:{label:"PIPE",D:.82,apex:70,hit:[470,190],pts:2,blk:[1,2],close:.95}};
  let back=null;
  function start(S,X){S.power=0;S.pws=0;S.lives=3;S.streak=0;S.best=0;S.kills=0;S.tools=0;S.tips=0;S.stuffed=0;S.eyes=!!(document.getElementById("qkEyes")||{}).checked||(X.challenge&&X.challenge.rule==="eyes");S.rally=0;newRally(S,X);}
  function newRally(S,X){S.rally++;const r=Math.random(),pass=r<.55?"A":r<.85?"B":"C",c=X.challenge&&X.challenge.rule;
    let type=pass==="C"?"high":pick(pass==="A"?["quick","quick","slide","high","pipe"]:["slide","high","pipe","high"]);if(c==="quick")type="quick";
    const T=TYPES[type],k=X.mod.k*(1+Math.min(.35,S.streak*.02));S.pass=pass;S.type=type;S.T=T;S.D=T.D/k*(pass==="C"?1.15:1);S.phase="pass";S.pt=0;S.shot=null;S.res=null;S.swingT=-1;
    S.w=Math.max(.06,(.18-S.streak*.006)*X.mod.win);
    /* the block: how many come, which lane the outside blocker takes, whether the middle closes in time, where the tip defender is */
    const nb=pass==="C"?Math.min(3,T.blk[1]+1):Math.round(lerp(T.blk[0],T.blk[1],Math.random()));
    S.block={n:nb,line:nb>=1&&Math.random()<.6,cross:nb>=2||(nb===1&&Math.random()<.4),closeAt:T.close/k,tipUp:Math.random()<(nb>=2?.35:.6),up:false};
    if(nb===1&&S.block.line&&S.block.cross)S.block.cross=false;if(nb>=1&&!S.block.line&&!S.block.cross)S.block.line=true;
    S.ball=null;S.trail=[];}
  const setPos=(S,s)=>{const T=S.T,from=S.pass==="C"?[SETTER[0]-150,SETTER[1]+40]:SETTER;if(s<=1){const x=lerp(from[0],T.hit[0],s),y=(1-s)*(1-s)*from[1]+2*(1-s)*s*T.apex+s*s*T.hit[1];return [x,y];}const k=s-1;return [T.hit[0]+k*110,T.hit[1]+k*k*300+k*40];};
  /* is the lane covered at the moment of contact (the middle may still be closing) */
  const covered=(S,shot,tc)=>{const B=S.block;if(shot==="line")return B.line;if(shot==="cross")return B.cross&&(B.n>=2?tc>=B.closeAt*.55:true);return false;};
  function swing(S,X,shot){if(S.phase==="pass"){miss(S,X,"Too early!","Wait for the set");return;}if(S.phase!=="set")return;const s=S.st/S.D,err=s-1;S.swingT=0;S.shot=shot;
    if(Math.abs(err)>S.w){miss(S,X,err<0?"Early!":"Late!",err<0?"Let the ball come to your hand":"Swing sooner");return;}
    const perfect=Math.abs(err)<=S.w*.4,tc=S.st,F=X.F,hit=S.T.hit,pw=S.power>=1&&shot!=="tip"&&covered(S,shot,tc);let blocked=covered(S,shot,tc),txt,pts=0,sub="",bust=false;
    /* a charged Power Spike goes straight through the block */
    if(pw){bust=blocked;blocked=false;S.power=0;S.pws++;X.K.sfx("power");F.hit(1);F.freeze(.12);F.slowmo(.3,.35);F.flashOn(.7,"255,211,77");F.ring(hit[0],hit[1],"255,211,77",160,10);}
    if(shot==="tip"){if(S.block.n>=2&&!S.block.tipUp){txt="TIP KILL";pts=2;S.tips++;sub="Behind a full block";}else if(S.block.tipUp){txt="DUG";sub="Their defender was up for the tip";}else{txt="TIP";pts=1;sub="No block to beat: swing next time";}}
    else if(blocked){if(perfect){txt="TOOLED!";pts=2;S.tools++;sub="Off the hands and out";}else{txt="STUFFED";pts=-1;S.stuffed++;sub=`${shot==="line"?"Line":"Cross"} was blocked`;}}
    else if(pw){txt=bust?"BLOCK BUSTED!":"POWER SPIKE!";pts=S.T.pts+(perfect?1:0)+2;sub=bust?"Straight through their hands":"Nobody could touch that";}
    else{txt=perfect?"PERFECT KILL":"KILL";pts=S.T.pts+(perfect?1:0);sub=`${shot==="line"?"Line":"Cross"} was open`;}
    if(pts>0&&!pw){const was=S.power<1;S.power=Math.min(1,S.power+(perfect?.34:.22)*((S._f&&S._f.perk.power)||1));if(was&&S.power>=1){F.pop(W/2,H*.5,"POWER SPIKE READY",{col:"#ffd34d",size:36,sub:"Your next blocked swing goes straight through"});X.K.sfx("coin");}}
    else if(pts<0)S.power=Math.max(0,S.power-.3);
    if(pts>0&&S.eyes)pts*=2;
    if(pts<0){S.lives--;S.streak=0;F.hit(.5);F.flashOn(.3,"255,60,60");X.K.sfx("block");}else if(pts===0){S.streak=0;X.K.sfx("dig");}else{S.streak++;S.kills++;S.best=Math.max(S.best,S.streak);const mult=1+Math.min(1.5,Math.floor(S.streak/5)*.5);S.score+=pts*mult;
      F.hit(perfect?.6:.35);F.freeze(perfect?.06:.03);X.K.sfx("kill");if(perfect)F.flashOn(.35,accRgb());F.burst(hit[0]+10,hit[1],perfect?30:16,{col:[acc(),"#fff"],speed:520,dir:shot==="tip"?-.2:.35,spread:.9,size:5,shape:"spark"});}
    S.res={txt,pts,sub,shot,blocked,perfect};S.phase="result";S.rt=0;F.pop(hit[0]+30,hit[1]-60,txt+(pts>0?` +${Math.round(pts*(1+Math.min(1.5,Math.floor(S.streak/5)*.5)))}`:""),{col:pts>1?acc():pts>0?"#fff":"#ff6b6b",size:pts>1?44:32,sub});
    if(S.lives<=0)setTimeout(()=>X.finish(),800);}
  function miss(S,X,txt,sub){S.phase="result";S.rt=0;S.res={txt,pts:-1,miss:true};S.lives--;S.streak=0;X.K.sfx("miss");X.F.pop(S.T.hit[0],S.T.hit[1]-50,txt,{col:"#ff6b6b",size:34,sub});if(S.lives<=0)setTimeout(()=>X.finish(),800);}
  function update(S,dt,X){if(S.phase==="pass"){S.pt+=dt;if(S.pt>=.75){S.phase="set";S.st=0;X.K.sfx("set");}}
    else if(S.phase==="set"){S.st+=dt;if(S.st/S.D>1+S.w+.18)miss(S,X,"Missed it!","Swing as the ball reaches your hand");}
    else if(S.phase==="result"){S.rt+=dt;if(S.swingT>=0)S.swingT+=dt;if(S.rt>1.05&&S.on&&S.lives>0)newRally(S,X);}
    if(S.phase==="set"&&S.st>=S.block.closeAt*.35)S.block.up=true;
    if(X.challenge&&X.challenge.rule==="streak"&&S.best>=X.challenge.n)X.finish();}
  function draw(g,S,X){if(!back)back=D.arena(W,H,FLOOR-140,acc());g.drawImage(back,0,0,W,H);D.crowd(g,W,FLOOR-140,X.F.t,S&&S.res&&S.res.pts>0?.9:.1,acc());
    const fl=g.createLinearGradient(0,FLOOR,0,H);fl.addColorStop(0,"#b25516");fl.addColorStop(1,"#6b300b");g.fillStyle=fl;g.fillRect(0,FLOOR,W,H-FLOOR);
    for(let x=-40;x<W;x+=70){g.fillStyle="rgba(0,0,0,.07)";g.fillRect(x,FLOOR,2,H-FLOOR);}g.fillStyle="#f4efe6";g.fillRect(0,FLOOR,W,3);g.fillRect(NETX-300,FLOOR,5,8);D.small(g,"3 M",NETX-298,FLOOR+24,11);
    /* opponent court tint */g.fillStyle="rgba(0,0,0,.18)";g.fillRect(NETX,FLOOR,W-NETX,H-FLOOR);
    /* net */g.fillStyle="#2a2730";g.fillRect(NETX-4,NETTOP-14,8,FLOOR-NETTOP+14);g.fillStyle="rgba(255,255,255,.1)";g.fillRect(NETX-6,NETTOP,12,96);g.fillStyle="#f4efe6";g.fillRect(NETX-7,NETTOP-5,14,8);
    for(let k=0;k<6;k++){g.fillStyle=k%2?"#f4efe6":"#e0442b";g.fillRect(NETX-2,NETTOP-60+k*9,4,9);}
    if(!S){D.player(g,{x:SETTER[0]-10,y:FLOOR,s:1.25,col:"#1c1a22",num:"5",a1:Math.PI*.9,a2:Math.PI*.95,e1:-.4,e2:-.4,numCol:acc()});D.player(g,{x:420,y:FLOOR,s:1.25,col:acc(),num:A.K.ME().num||"",crouch:.4});return;}
    const s=S.phase==="set"?S.st/S.D:S.phase==="result"?1+S.rt*1.2:0;
    /* blockers (side view: stacked with depth) */
    const B=S.block,up=S.phase==="set"?clamp((S.st-B.closeAt*.4)/.35,0,1):S.phase==="result"?clamp(1-S.rt*1.4+.6,0,1):0;
    for(let i=0;i<B.n;i++){const jump=Math.sin(up*Math.PI*.5)*58,dx=NETX+22+i*20;D.player(g,{x:dx,y:FLOOR-jump,s:1.18-i*.07,col:"#2f3140",col2:"#1a1b24",flip:true,a1:Math.PI*(.85+up*.12),a2:Math.PI*(.85+up*.15),e1:0,e2:0,num:""});}
    /* setter */const sx=S.pass==="C"?SETTER[0]-160:SETTER[0]-10,setArm=S.phase==="pass"?Math.PI*.95:Math.PI*.8;D.player(g,{x:sx,y:FLOOR-(S.type==="quick"&&S.phase==="set"?14:0),s:1.25,col:"#1c1a22",num:"5",a1:setArm,a2:setArm,e1:-.5,e2:-.5,numCol:acc()});
    /* you: approach, jump and swing */
    const T=S.T,hit=T.hit,startX=S.type==="pipe"?300:380;let hx=startX,hy=FLOOR,a2=-.3,a1=.3,cr=0,lean=0;
    if(S.phase==="pass"){const k=clamp(S.pt/.75,0,1);hx=lerp(startX,startX+40,k);cr=k*.5;a1=a2=-.5-k*.5;}
    else{const k=S.phase==="set"?clamp(s,0,1.2):1;const run=S.type==="high"?clamp((k-.35)/.65,0,1):S.type==="quick"?clamp(k*2.2,0,1):clamp(k*1.4,0,1);
      hx=lerp(startX+40,hit[0]-20,ease.inOut(clamp(run*1.25,0,1)));const air=S.type==="high"?clamp((k-.62)/.38,0,1):S.type==="quick"?clamp((k-.05)/.5,0,1):clamp((k-.35)/.55,0,1);
      hy=FLOOR-Math.sin(clamp(air,0,1)*Math.PI*.5)*108;cr=air<=0?.6*run:0;a1=lerp(-.6,Math.PI*.85,air);a2=lerp(-.8,Math.PI*.95,air);lean=-air*.15;
      if(S.swingT>=0){const w=clamp(S.swingT/.14,0,1);a2=lerp(Math.PI*.95,Math.PI*.15,w);lean=w*.25;}
      if(S.phase==="result"){const fall=clamp(S.rt/.5,0,1);hy=FLOOR-108*(1-fall*fall)*(S.res&&S.res.miss?.6:1);}}
    D.shadow(g,hx,FLOOR+4,30,.35);D.player(g,{x:hx,y:hy,s:1.25,col:acc(),num:A.K.ME().num||"",a1,a2,e1:a2>2?-.2:0,e2:a2>2?-.25:0,crouch:cr,lean});
    /* the ball */
    let bp=null,vis=true;if(S.phase==="pass"){const k=clamp(S.pt/.75,0,1),from=S.pass==="C"?[SETTER[0]-150,SETTER[1]+40]:SETTER;bp=[lerp(40,from[0],k),lerp(380,from[1],k)-Math.sin(Math.PI*k)*200];}
    else if(S.phase==="set"){bp=setPos(S,s);if(S.eyes&&s>.2&&s<1.04)vis=false;}
    else if(S.phase==="result"&&S.res){const k=clamp(S.rt/.38,0,1),r=S.res;if(r.miss)bp=setPos(S,1+S.rt*1.2);
      else if(r.shot==="tip")bp=[lerp(hit[0]+6,NETX+90,k),lerp(hit[1],FLOOR-10,k*k)-Math.sin(Math.PI*k)*40];
      else if(r.blocked&&!r.perfect)bp=[lerp(hit[0]+6,NETX-120,k),lerp(hit[1],FLOOR-10,k*k)];
      else{bp=[lerp(hit[0]+6,r.blocked?W+60:NETX+260+(r.shot==="cross"?60:0),k),lerp(hit[1],r.blocked?60:FLOOR-12,r.blocked?k:k*k)];}}
    if(bp){S.trail.push([bp[0],bp[1],9]);if(S.trail.length>10)S.trail.shift();if(vis){D.trail(g,S.trail,S.phase==="result"?accRgb():"255,255,255");D.ball(g,bp[0],bp[1],12,X.F.t*12,acc());}}
    if(S.phase==="set"&&!S.eyes&&X.mod.win>=1){g.strokeStyle=`rgba(${accRgb()},.55)`;g.setLineDash([6,6]);g.lineWidth=2;g.beginPath();g.arc(hit[0],hit[1],24,0,TAU);g.stroke();g.setLineDash([]);}
    /* shot buttons */
    const lab=[["◀ LINE","line"],["TIP ▲","tip"],["CROSS ▶","cross"]];lab.forEach(([t,k],i)=>{const x=20+i*(W-40)/3,w=(W-40)/3-10,on=S.res&&S.res.shot===k;D.glass(g,x,H-58,w,46,on?.85:.5);if(on){g.strokeStyle=acc();g.lineWidth=2;D.round(g,x,H-58,w,46,10);g.stroke();}
      D.text(g,t,x+w/2,H-27,24,on?acc():"rgba(255,255,255,.9)","center",800,true);});}
  /* a map of the other court seen from above: lanes, the block and the tip defender */
  function minimap(g,S){const x0=W-238,y0=94,w=220,h=120;D.glass(g,x0,y0,w,h+28,.7);D.small(g,"THEIR COURT",x0+10,y0+18,11);const cy=y0+26;
    g.strokeStyle="rgba(255,255,255,.4)";g.lineWidth=1.5;g.strokeRect(x0+10,cy,w-20,h-10);g.fillStyle="#f4efe6";g.fillRect(x0+10,cy,w-20,3);
    const B=S.block,lineCol=B.line?"rgba(255,90,90,.35)":"rgba(120,230,140,.25)",crossCol=B.cross?"rgba(255,90,90,.35)":"rgba(120,230,140,.25)";
    g.fillStyle=lineCol;g.fillRect(x0+10,cy+3,(w-20)*.3,h-13);g.fillStyle=crossCol;g.beginPath();g.moveTo(x0+10+(w-20)*.35,cy+3);g.lineTo(x0+w-10,cy+3);g.lineTo(x0+w-10,cy+h-10);g.lineTo(x0+10+(w-20)*.6,cy+h-10);g.closePath();g.fill();
    D.small(g,"LINE",x0+16,cy+h-16,10,"rgba(255,255,255,.75)");D.small(g,"CROSS",x0+w-16,cy+h-16,10,"rgba(255,255,255,.75)","right");
    const bx=k=>x0+10+(w-20)*k;g.fillStyle="#e7e9ff";if(B.line){g.beginPath();g.arc(bx(.14),cy+9,6,0,TAU);g.fill();}if(B.cross){const k=S.phase==="set"?clamp(S.st/(B.closeAt*.55),0,1):1;g.beginPath();g.arc(bx(lerp(.8,.42,k)),cy+9,6,0,TAU);g.fill();}
    if(B.n>=3){g.beginPath();g.arc(bx(.28),cy+9,6,0,TAU);g.fill();}
    g.fillStyle=B.tipUp?"#ffd27a":"rgba(255,210,122,.25)";g.beginPath();g.arc(bx(.5),cy+(B.tipUp?40:85),5,0,TAU);g.fill();D.small(g,B.tipUp?"tip cover":"deep",bx(.5)+8,cy+(B.tipUp?44:89),9,"rgba(255,220,150,.8)");}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`${S.pass} PASS · ${S.T.label}${S.eyes?" · EYES CLOSED":""}`});
    {const y=S.streak>1?134:96,full=S.power>=1;D.glass(g,14,y,170,30,.5);D.meter(g,24,y+17,150,7,S.power,full?"#ffd34d":acc());D.small(g,full?"⚡ POWER SPIKE READY":"POWER",24,y+12,10,full?"#ffd34d":"rgba(255,255,255,.7)");
      if(full){g.globalAlpha=.4+.4*Math.sin(X.F.t*12);g.strokeStyle="#ffd34d";g.lineWidth=2;D.round(g,14,y,170,30,10);g.stroke();g.globalAlpha=1;}}if(S.phase!=="pass"||S.pt>.3)minimap(g,S);}
  const shotAt=(x)=>x<W/3?"line":x<W*2/3?"tip":"cross";
  A.add("quick",{title:"Freak Quick",tag:"Time the swing. Pick the open lane.",unit:"best streak",W,H,extra:`<label class="small eyes"><input type="checkbox" id="qkEyes"> Eyes closed: the ball vanishes during the set (double points)</label>`,aria:"Tap Line, Tip or Cross on time, or use the arrow keys.",
    desc:"Read the pass, the set and the block on their side. Swing on time <b>and</b> hit where the block isn't: line, cross, or tip over a full block.",
    how:["The setter sends a <b>quick</b>, <b>slide</b>, <b>high outside</b> or <b>pipe</b>. A C pass means a high ball and a bigger block.","Swing as the ball reaches your hand: tap <b>Line</b>, <b>Tip</b> or <b>Cross</b> (or press ← ↑ →; space hits cross). Off time is an error.",
      "Look at the map of their court: red lanes are blocked, green are open. Faster sets beat the block: on a quick the middle is often still closing on the cross.","Hitting into the block gets you <b>stuffed</b> (an error), unless your timing is perfect: then you <b>tool</b> it off the hands for a point.",
      "Tip over a full (2 or 3 man) block when their defender is deep. If their tip defender is up, the tip is dug.","Kills fill your <b>Power</b> meter (perfect timing fills it faster). When it's full, the next time you hit into a block it becomes a <b>Power Spike</b>: straight through their hands for +2. It waits until you need it.","Kills: quick 3, slide or pipe 2, high 1, +1 for perfect timing. Every 5 in a row raises your multiplier. Eyes closed (the ball vanishes during the set) doubles points."],
    daily:[{text:"Get a streak of 8",rule:"streak",n:8,f:45,ok:S=>S.best>=8},{text:"Score 40 points with eyes closed",rule:"eyes",n:40,f:55,ok:S=>S.score>=40},{text:"Quick sets only: streak of 6",rule:"quick",n:6,f:45,ok:S=>S.best>=6}],
    bestOf:c=>c.best.quick,saveBest:(c,v)=>{if(v>c.best.quick)c.best.quick=v;},
    start,update,draw,hud,
    down(S,x,y){const X=A.cur;swing(S,X,y>H-80?shotAt(x):"cross");},
    key(S,k){const X=A.cur;const m={ArrowLeft:"line",a:"line",ArrowUp:"tip",w:"tip",ArrowRight:"cross",d:"cross"," ":"cross",Enter:"cross"}[k];if(m)swing(S,X,m);else return false;},
    result(S){const sc=Math.round(S.score);return {best:S.best,head:`${sc} points`,sub:`Best streak ${S.best}`,fe:Math.floor(sc/2)+S.best,
      stats:[["Kills",S.kills],["Best streak",S.best],["Power spikes",S.pws],["Tooled",S.tools],["Tip kills",S.tips],["Stuffed",S.stuffed]],
      tip:S.stuffed>=2?"Check the map before you swing: red lanes are blocked.":"",count:[["kills",S.kills],["tools",S.tools],["tipKills",S.tips],["powerSpikes",S.pws]],legacy:c=>{c.stats=c.stats||{};c.stats.quickScore=Math.max(c.stats.quickScore||0,sc);}};}});
})();

/* =====================================================================================================
   JUMP SERVE
   ===================================================================================================== */
(function(){
  const W=960,H=560,NETY=300,cp=(u,v)=>{const y=NETY-205*v,hw=290-135*v;return [480+(u-.5)*2*hw,y,1-.55*v];};
  const ZONE={2:[0,0],3:[1,0],4:[2,0],1:[0,1],6:[1,1],5:[2,1]};
  const zoneOf=(u,v)=>{const col=clamp(Math.floor(u*3),0,2),row=v<1/3?0:1;return +Object.keys(ZONE).find(z=>ZONE[z][0]===col&&ZONE[z][1]===row);};
  let back=null;
  function start(S,X){S.lives=3;S.aces=0;S.serves=0;S.streak=0;S.bestStreak=0;S.seams=0;S.kind="spin";S.errors=0;S.tough=0;newServe(S,X);}
  function newServe(S,X){S.serves++;S.phase="toss";S.pt=0;S.tossV=0;S.tdir=1;S.pw=0;S.pdir=1;S.aim=Math.random();S.adir=Math.random()<.5?1:-1;S.ball=null;
    S.target=pick([1,2,3,4,5,6]);S.pressure=S.serves%6===0;
    const base=[[.2,.62],[.5,.72],[.8,.62]].map(([u,v])=>[clamp(u+rand(-.1,.1),.1,.9),clamp(v+rand(-.12,.12),.4,.9)]);if(Math.random()<.4)base.push([rand(.3,.7),rand(.25,.4)]);
    S.rec=base.map(([u,v])=>({u,v,hu:u,hv:v,dive:0}));S.tq=null;S.res=null;}
  const reach=(S,X)=>(.16+(X.mod.k-1)*.12)*(S.kind==="float"?.82:1);
  function press(S,X){if(S.phase==="toss"){S.tq=1-Math.abs(S.tossV-.5)*2;S.phase="power";X.K.sfx("tick");
      const w=Math.max(.1,(.24-S.score*.003)*X.mod.win*(S.kind==="float"?1.2:1)*(.6+.55*S.tq));S.lo=.6-w/2+rand(-.06,.06);S.hi=S.lo+w;if(S.tq<.35)X.F.pop(480,H-200,"BAD TOSS",{col:"#ffb3a1",size:26,sub:"Smaller power window"});return;}
    if(S.phase==="power"){S.lock=S.pw;S.phase="aim";X.K.sfx("tick");return;}
    if(S.phase!=="aim")return;let u=S.aim*1.24-.12;const p=S.lock;let res,v;
    if(p<S.lo){res="net";v=-.04;}else if(p>S.hi){res="long";v=1.14+rand(0,.06);}else{v=.06+(p-S.lo)/(S.hi-S.lo)*.92;if(S.kind==="float"){u+=rand(-.07,.07);v+=rand(-.05,.05);}res=u<0||u>1?"wide":"in";}
    S.ball={u,v,res,t:0,dur:S.kind==="spin"?.62:.85,wob:Math.random()*6};S.phase="fly";X.K.sfx("whoosh");X.F.hit(.2);}
  function land(S,X){const b=S.ball,F=X.F,L=cp(b.u,b.v);S.phase="result";S.rt=0;
    if(b.res!=="in"){S.lives--;S.streak=0;S.errors++;X.K.sfx("miss");F.pop(480,b.res==="net"?NETY-70:150,b.res==="net"?"INTO THE NET":b.res==="long"?"LONG!":"WIDE!",{col:"#ff6b6b",size:36});if(S.lives<=0)setTimeout(()=>X.finish(),800);return;}
    /* nearest passer, after they react */
    let best=null,bd=9;S.rec.forEach(r=>{const d=Math.hypot(r.hu-b.u,(r.hv-b.v)*1.3);if(d<bd){bd=d;best=r;}});const R=reach(S,X),mult=S.pressure?2:1;
    const z=zoneOf(b.u,b.v),onTarget=z===S.target;
    if(bd>R){let pts=3;let txt="ACE!";const ds=S.rec.map(r=>Math.hypot(r.hu-b.u,(r.hv-b.v)*1.3)).sort((a,c)=>a-c);if(ds.length>1&&ds[1]-ds[0]<.08){pts+=1;txt="SEAM ACE!";S.seams++;}
      if(onTarget){pts*=2;txt+=" ON TARGET";}S.aces++;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);S.score+=pts*mult;F.hit(.6);F.freeze(.05);F.flashOn(.3,accRgb());X.K.sfx("kill");
      F.burst(L[0],L[1],28,{col:[acc(),"#fff"],speed:360,up:180,size:5});F.ring(L[0],L[1],accRgb(),70,6);F.pop(L[0],L[1]-40,`${txt} +${pts*mult}`,{col:acc(),size:40,sub:S.pressure?"Set point: double":""});if(best)best.dive=1;}
    else if(bd>R*.65){S.tough++;S.score+=1*mult;S.streak=0;X.K.sfx("dig");F.pop(L[0],L[1]-30,`TOUGH SERVE +${mult}`,{col:"#fff",size:28,sub:"Pulled them off the court"});if(best)best.dive=.6;}
    else{S.streak=0;X.K.sfx("dig");F.pop(L[0],L[1]-30,"PASSED",{col:"#cfc8bd",size:26,sub:"Aim for the gaps between passers"});}}
  function update(S,dt,X){const sp=(1.05+S.score*.012)*X.mod.k;S.pt+=dt;
    if(S.phase==="toss"){S.tossV+=S.tdir*dt*1.5*X.mod.k;if(S.tossV>1){S.tossV=1;S.tdir=-1;}if(S.tossV<0){S.tossV=0;S.tdir=1;}}
    else if(S.phase==="power"){S.pw+=S.pdir*dt*sp;if(S.pw>1){S.pw=1;S.pdir=-1;}if(S.pw<0){S.pw=0;S.pdir=1;}}
    else if(S.phase==="aim"){S.aim+=S.adir*dt*(.7+S.score*.01)*X.mod.k;if(S.aim>1){S.aim=1;S.adir=-1;}if(S.aim<0){S.aim=0;S.adir=1;}}
    else if(S.phase==="fly"){S.ball.t+=dt;const k=S.ball.t/S.ball.dur;/* passers read the serve and move */S.rec.forEach(r=>{const d=Math.hypot(r.u-S.ball.u,r.v-S.ball.v),m=(S.kind==="float"?.18:.28)*X.mod.k;if(d<.32){r.hu=damp(r.hu,S.ball.u,m*6,dt);r.hv=damp(r.hv,S.ball.v,m*6,dt);}});if(k>=1)land(S,X);}
    else if(S.phase==="result"){S.rt+=dt;S.rec.forEach(r=>r.dive=Math.max(0,r.dive-dt));if(S.rt>1.1&&S.on&&S.lives>0)newServe(S,X);}
    if(X.challenge&&X.challenge.rule==="aces"&&S.aces>=X.challenge.n)X.finish();}
  function draw(g,S,X){if(!back)back=D.arena(W,H,NETY-170,acc());g.drawImage(back,0,0,W,H);D.crowd(g,W,NETY-170,X.F.t,S&&S.res?.5:.15,acc());
    const fl=g.createLinearGradient(0,NETY-210,0,H);fl.addColorStop(0,"#4a220b");fl.addColorStop(1,"#b45a1c");g.fillStyle=fl;const a=cp(-.3,1.12),b2=cp(1.3,1.12);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b2[0],b2[1]);g.lineTo(W+80,H);g.lineTo(-80,H);g.closePath();g.fill();
    if(S){const [col,row]=ZONE[S.target],u0=col/3,u1=(col+1)/3,v0=row?1/3:0,v1=row?1:1/3,q=[cp(u0,v0),cp(u1,v0),cp(u1,v1),cp(u0,v1)];g.fillStyle=`rgba(${accRgb()},${.2+.1*Math.sin(X.F.t*5)})`;g.beginPath();q.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();}
    g.strokeStyle="#f4efe6";g.lineWidth=3;g.beginPath();[cp(0,0),cp(1,0),cp(1,1),cp(0,1)].forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();
    const m1=cp(0,1/3),m2=cp(1,1/3);g.lineWidth=2;g.beginPath();g.moveTo(m1[0],m1[1]);g.lineTo(m2[0],m2[1]);g.stroke();
    g.font="800 28px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";Object.entries(ZONE).forEach(([z,[cc,rr]])=>{const p=cp((cc+.5)/3,rr?.66:.17);g.fillStyle=S&&+z===S.target?"#fff":"rgba(255,255,255,.13)";g.fillText(z,p[0],p[1]);});
    /* passers, far side, sorted back to front */
    if(S){[...S.rec].sort((p,q)=>q.hv-p.hv).forEach(r=>{const P=cp(r.hu,r.hv),s=P[2]*.95;D.shadow(g,P[0],P[1]+2,22*s,.35);if(X.mod.win>=1){g.strokeStyle="rgba(255,255,255,.12)";g.lineWidth=1;const rr=reach(S,X)*290*2*P[2];g.beginPath();g.ellipse(P[0],P[1],rr*.5,rr*.22,0,0,TAU);g.stroke();}
      D.player(g,{x:P[0],y:P[1],s,col:"#2f3140",col2:"#1a1b24",crouch:.7,lean:r.dive?(r.hu<.5?-1:1)*r.dive*.9:0,a1:-1.2,a2:-1.2,num:""});});}
    /* net */
    g.fillStyle="rgba(0,0,0,.3)";g.fillRect(130,NETY,700,14);g.fillStyle="rgba(255,255,255,.05)";g.fillRect(140,NETY-84,680,84);g.strokeStyle="rgba(255,255,255,.18)";g.lineWidth=1;for(let x=140;x<=820;x+=11){g.beginPath();g.moveTo(x,NETY-84);g.lineTo(x,NETY);g.stroke();}for(let y=NETY-84;y<=NETY;y+=11){g.beginPath();g.moveTo(140,y);g.lineTo(820,y);g.stroke();}
    g.fillStyle="#f4efe6";g.fillRect(140,NETY-88,680,8);g.fillStyle="#2a2730";g.fillRect(126,NETY-100,11,176);g.fillRect(823,NETY-100,11,176);for(let k=0;k<6;k++){g.fillStyle=k%2?"#f4efe6":"#e0442b";g.fillRect(180,NETY-134+k*8,4,8);g.fillRect(776,NETY-134+k*8,4,8);}
    /* our end line */g.fillStyle="#f4efe6";g.fillRect(0,H-58,W,4);
    if(!S)return;
    /* the server: toss, approach and swing */
    const ph=S.phase,sx=480,sy=H-20;let a2=-.4,lean=0,jump=0;if(ph==="power"||ph==="aim"){a2=Math.PI*.9;jump=ph==="aim"?30:12;}if(ph==="fly"||ph==="result"){const k=clamp((ph==="fly"?S.ball.t:.4+S.rt)/.25,0,1);a2=lerp(Math.PI*.9,Math.PI*.1,k);jump=30*(1-k);lean=.2*k;}
    D.shadow(g,sx,sy+2,40,.4);D.player(g,{x:sx,y:sy-jump,s:1.5,col:acc(),num:A.K.ME().num||"",a1:ph==="toss"?Math.PI*.8:.2,a2,lean,flip:true});
    /* ball */
    if(S.ball){const b=S.ball,k=clamp(b.t/b.dur,0,1),L=cp(b.u,b.v),st=[sx+14,H-170],wob=S.kind==="float"?Math.sin(b.t*22+b.wob)*10*Math.sin(Math.PI*k):0,x=st[0]+(L[0]-st[0])*k+wob,y=st[1]+(L[1]-st[1])*k-Math.sin(Math.PI*k)*(b.res==="net"?50:150),s=1.15-(1.15-L[2]*.7)*k;
      D.shadow(g,st[0]+(L[0]-st[0])*k,(H-56)+(L[1]-(H-56))*k,12*s,.35);S.trail=S.trail||[];S.trail.push([x,y,10*s]);if(S.trail.length>9)S.trail.shift();D.trail(g,S.trail,accRgb());D.ball(g,x,y,14*s,X.F.t*(S.kind==="spin"?22:1),acc());}
    else{S.trail=[];const tossY=ph==="toss"?H-190-Math.abs(Math.sin(X.F.t*3))*12:H-250;D.ball(g,sx+14,tossY,14,X.F.t*2,acc());}
    /* meters */
    if(ph==="toss"){const x=W/2-110,y=H-120;D.glass(g,x-14,y-30,248,58,.7);D.small(g,"TOSS: tap when the marker is centred",x,y-12,12);D.round(g,x,y,220,12,6);g.fillStyle="rgba(255,255,255,.12)";g.fill();g.fillStyle=`rgba(${accRgb()},.5)`;g.fillRect(x+88,y,44,12);g.fillStyle="#fff";g.fillRect(x+S.tossV*220-3,y-4,6,20);}
    if(ph==="power"||ph==="aim"){const bx=44,by=150,bh=300,bw=28;D.glass(g,bx-12,by-12,bw+24,bh+46,.55);D.round(g,bx,by,bw,bh,6);g.fillStyle="rgba(255,255,255,.12)";g.fill();g.fillStyle=`rgba(${accRgb()},.6)`;g.fillRect(bx,by+bh*(1-S.hi),bw,bh*(S.hi-S.lo));
      const pv=ph==="power"?S.pw:S.lock;g.fillStyle="#fff";g.fillRect(bx-6,by+bh*(1-pv)-3,bw+12,6);D.small(g,"POWER",bx+bw/2,by+bh+22,12,"rgba(255,255,255,.75)","center");
      if(ph==="aim"){const u=S.aim*1.24-.12,v=.06+clamp((S.lock-S.lo)/(S.hi-S.lo),0,1)*.92,L=cp(u,clamp(v,-.05,1.15));g.strokeStyle="#fff";g.lineWidth=3;g.setLineDash([8,8]);g.beginPath();g.moveTo(sx,H-170);g.lineTo(L[0],L[1]);g.stroke();g.setLineDash([]);g.beginPath();g.arc(L[0],L[1],8,0,TAU);g.fillStyle="#fff";g.fill();}
      D.text(g,ph==="power"?"TAP TO LOCK POWER":"TAP TO LOCK AIM",W/2,H-92,26,acc(),"center",800,true);}
    if(S.pressure&&ph!=="result"){D.text(g,"SET POINT · DOUBLE POINTS",W/2,40,26,"#fff","center",800,true);}}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`TARGET ZONE ${S.target} · ${X.mod.label.toUpperCase()}`});
    const x=14,y=H-60;["spin","float"].forEach((k,i)=>{const on=S.kind===k;D.glass(g,x+i*118,y,110,44,on?.85:.45);if(on){g.strokeStyle=acc();g.lineWidth=2;D.round(g,x+i*118,y,110,44,10);g.stroke();}D.text(g,k==="spin"?"JUMP SPIN":"JUMP FLOAT",x+i*118+55,y+28,20,on?acc():"rgba(255,255,255,.8)","center",800,true);});
    if(S.phase==="toss")D.small(g,"S switches serve",x+2,y-8,11);}
  A.add("serve",{title:"Jump Serve",tag:"Toss, power, aim. Find the gap.",unit:"points",W,H,aria:"Tap or press space three times: toss, power, aim. S switches serve type.",
    desc:"Three taps: <b>toss</b>, <b>power</b>, <b>aim</b>. Their passers read your serve and move. Land it where they can't reach: in a gap, a seam between two passers, or the lit target zone.",
    how:["Choose <b>Jump Spin</b> (fast, the passers have less time) or <b>Jump Float</b> (a wider power window and it wobbles, so the passers misjudge it, but so might you). Tap the chips or press S before the toss.",
      "Tap 1: toss when the marker is centred. A good toss widens your power window.","Tap 2: power. Inside the band it lands in the court (more power lands deeper); below it hits the net, above it flies long.","Tap 3: aim. Out wide is an error.",
      "Ace (nobody reaches it): 3. Seam ace (between two passers): 4. On the lit target zone: double. A tough serve that pulls a passer off the court: 1. Every 6th serve is set point: double points.","On Rookie and Varsity you can see each passer's reach. Three errors and it's over."],
    daily:[{text:"Hit 6 aces",rule:"aces",n:6,f:45,ok:S=>S.aces>=6},{text:"Score 30 points",rule:"score",n:30,f:45,ok:S=>S.score>=30},{text:"4 aces on National",mode:"national",rule:"aces",n:4,f:60,ok:S=>S.aces>=4}],
    bestOf:c=>c.best.serve,saveBest:(c,v)=>{if(v>c.best.serve)c.best.serve=v;},
    start,update,draw,hud,
    down(S,x,y){const X=A.cur;if(S.phase==="toss"&&y>H-64&&x<250){S.kind=x<132?"spin":"float";X.K.sfx("tick");return;}press(S,X);},
    key(S,k){const X=A.cur;if((k==="s"||k==="S")&&S.phase==="toss"){S.kind=S.kind==="spin"?"float":"spin";X.K.sfx("tick");return;}if(k===" "||k==="Enter")press(S,X);else return false;},
    result(S){const sc=Math.round(S.score);return {best:sc,head:`${sc} points`,sub:`${S.aces} aces from ${S.serves} serves`,fe:Math.floor(sc/2)+S.aces*2,
      stats:[["Aces",S.aces],["Seam aces",S.seams],["Tough serves",S.tough],["Best ace run",S.bestStreak],["Errors",S.errors],["Serves",S.serves]],
      tip:S.errors>=3&&S.aces<2?"Watch the power band: it moves a little every serve.":"",count:[["seams",S.seams]],legacy:c=>{c.aces+=S.aces;}};}});
})();

/* =====================================================================================================
   BLOCK PARTY (new)
   ===================================================================================================== */
(function(){
  const W=960,H=560,NETY=318,cp=(u,v)=>{const y=NETY-200*v,hw=300-120*v;return [480+(u-.5)*2*hw,y,1-.5*v];};
  const LANES={out:{u:.13,label:"OUTSIDE",T:1.05},mid:{u:.5,label:"QUICK",T:.5},opp:{u:.87,label:"OPPOSITE",T:.85},pipe:{u:.5,label:"PIPE",T:.95,back:true}};
  let back=null;
  function start(S,X){S.lives=3;S.stuffs=0;S.touches=0;S.missed=0;S.streak=0;S.bestStreak=0;S.rally=0;S.me={u:.5,vu:0,jumpT:-1,hold:0};S.keys={};newRally(S,X);}
  function newRally(S,X){S.rally++;const lv=S.rally;const opts=["out","out","mid","opp"];if(lv>6)opts.push("pipe");const to=X.challenge&&X.challenge.rule==="quick"?"mid":pick(opts);
    S.to=to;S.decoy=lv>3&&to!=="mid"&&Math.random()<.5;S.phase="pass";S.t=0;S.setT=0;S.res=null;S.tell=Math.random()<(X.mod.win>=1?.8:.55);
    const k=X.mod.k*(1+Math.min(.3,lv*.012));S.T=LANES[to].T/k;S.hitters={out:{t:-1},mid:{t:-1},opp:{t:-1},pipe:{t:-1}};S.me.jumpT=-1;}
  const AIR=.62;
  function jump(S,X){if(S.me.jumpT>=0||S.phase==="result")return;S.me.jumpT=0;X.K.sfx("tick");}
  function resolve(S,X){const L=LANES[S.to],d=Math.abs(S.me.u-L.u),j=S.me.jumpT,F=X.F,P=cp(L.u,.05),w=X.mod.win;
    const ph=j<0?-1:j/AIR,inAir=ph>=.12&&ph<=.62,peak=ph>=.24&&ph<=.46,full=d<.075*Math.sqrt(w),part=d<.15*Math.sqrt(w);
    let txt,pts=0,sub="";if(L.back&&inAir&&part){txt="TOUCH";pts=1;sub="Back-row attack: dig it out";}
    else if(full&&peak){txt="STUFF BLOCK!";pts=3;S.stuffs++;sub="Monster block";}else if((full&&inAir)||(part&&peak)){txt="TOUCH";pts=1;S.touches++;sub="Soft block: your defence can play it";}
    else{txt=j<0?"NO JUMP":!inAir?(ph<.12?"TOO LATE":"TOO EARLY"):"WRONG SPOT";sub=j<0?"Jump as the hitter jumps":!inAir?(ph<.12?"Jump sooner":"You came down before the hit"):`The set went ${L.label.toLowerCase()}`;}
    if(pts>0){S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);const mult=1+Math.min(1.5,Math.floor(S.streak/4)*.5);S.score+=pts*mult;X.K.sfx(pts>=3?"block":"dig");
      if(pts>=3){F.hit(.8);F.freeze(.08);F.flashOn(.35,accRgb());F.burst(P[0],P[1]-60,34,{col:[acc(),"#fff"],speed:520,up:220,size:6,shape:"spark"});F.ring(P[0],P[1],accRgb(),90,8);}}
    else{S.lives--;S.streak=0;S.missed++;F.hit(.4);X.K.sfx("drop");}
    S.res={txt,pts,sub};F.pop(P[0],P[1]-130,txt+(pts?` +${pts}`:""),{col:pts>=3?acc():pts?"#fff":"#ff6b6b",size:pts>=3?48:32,sub});S.phase="result";S.t=0;if(S.lives<=0)setTimeout(()=>X.finish(),850);}
  function update(S,dt,X,raw){const me=S.me,sp=(1.65*X.mod.k)*(me.jumpT>=0?.15:1);
    let dir=(S.keys.ArrowRight||S.keys.d?1:0)-(S.keys.ArrowLeft||S.keys.a?1:0);if(me.target!=null&&!dir){const d=me.target-me.u;dir=Math.abs(d)<.01?0:Math.sign(d)*Math.min(1,Math.abs(d)*8);}
    me.vu=damp(me.vu,dir*sp,14,dt);me.u=clamp(me.u+me.vu*dt,.05,.95);if(me.target!=null&&Math.abs(me.target-me.u)<.01)me.target=null;
    if(me.jumpT>=0){me.jumpT+=dt;if(me.jumpT>AIR+.25)me.jumpT=-1;}
    S.t+=0;if(S.phase==="pass"){S.pt=(S.pt||0)+dt;if(S.pt>.85){S.phase="set";S.setT=0;S.pt=0;X.K.sfx("set");
        /* the quick hitter always runs: a decoy jumps even when the ball goes elsewhere */if(S.to==="mid"||S.decoy)S.hitters.mid.t=0;}}
    else if(S.phase==="set"){S.setT+=dt;const L=LANES[S.to];Object.entries(S.hitters).forEach(([k,h])=>{if(h.t>=0)h.t+=dt;});const hk=S.hitters[S.to];if(hk.t<0&&S.setT>S.T-.48)hk.t=0;
      if(S.setT>=S.T)resolve(S,X);}
    else if(S.phase==="result"){S.t+=dt;if(S.t>1.15&&S.on&&S.lives>0)newRally(S,X);}
    if(X.challenge&&X.challenge.rule==="stuffs"&&S.stuffs>=X.challenge.n)X.finish();}
  function draw(g,S,X){if(!back)back=D.arena(W,H,NETY-170,acc());g.drawImage(back,0,0,W,H);D.crowd(g,W,NETY-170,X.F.t,S&&S.res&&S.res.pts>=3?1:.15,acc());
    const fl=g.createLinearGradient(0,NETY-210,0,H);fl.addColorStop(0,"#4a220b");fl.addColorStop(1,"#c0611f");g.fillStyle=fl;const a=cp(-.3,1.1),b2=cp(1.3,1.1);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b2[0],b2[1]);g.lineTo(W+80,H);g.lineTo(-80,H);g.closePath();g.fill();
    g.strokeStyle="#f4efe6";g.lineWidth=3;g.beginPath();[cp(0,0),cp(1,0),cp(1,1),cp(0,1)].forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();const m1=cp(0,1/3),m2=cp(1,1/3);g.lineWidth=2;g.beginPath();g.moveTo(m1[0],m1[1]);g.lineTo(m2[0],m2[1]);g.stroke();
    /* opponents: passer, setter, hitters */
    const setter=cp(.62,.06),pass=cp(.45,.75);
    const people=[];if(S){const tellBack=S.phase==="pass"&&S.tell&&S.to==="opp"&&S.pt>.4,tellQuick=S.phase==="pass"&&S.tell&&S.to==="mid"&&S.pt>.45;
      people.push({P:setter,o:{col:"#2f3140",col2:"#1a1b24",a1:Math.PI*.92,a2:Math.PI*.92,e1:-.4,e2:-.4,lean:tellBack?.28:tellQuick?-.1:0,num:"S"}});
      Object.entries(LANES).forEach(([k,L])=>{if(k==="pipe"&&S.rally<=6)return;const h=S.hitters[k],base=cp(L.u,L.back?.45:.35),hit=cp(L.u,L.back?.36:.08);let P=base,up=0,a2=-.4;
        if(h.t>=0){const run=clamp(h.t/.32,0,1);P=[lerp(base[0],hit[0],ease.inOut(run)),lerp(base[1],hit[1],ease.inOut(run)),lerp(base[2],hit[2],run)];const air=clamp((h.t-.3)/.4,0,1);up=Math.sin(Math.min(1,air)*Math.PI)*46;a2=lerp(-.5,Math.PI*.95,clamp((h.t-.25)/.15,0,1));}
        people.push({P,up,o:{col:"#2f3140",col2:"#1a1b24",a1:.4,a2,num:"",crouch:h.t<0?.4:0}});});
      people.push({P:pass,o:{col:"#2f3140",col2:"#1a1b24",crouch:.8,a1:-1.2,a2:-1.2,num:""}});}
    people.sort((p,q)=>p.P[1]-q.P[1]).forEach(p=>{D.shadow(g,p.P[0],p.P[1]+2,20*p.P[2],.35);D.player(g,Object.assign({x:p.P[0],y:p.P[1]-(p.up||0),s:p.P[2]*1.05},p.o));});
    /* the ball */
    if(S){let bp=null;if(S.phase==="pass"){const k=clamp(S.pt/.85,0,1),A0=cp(.45,1.3),B=[setter[0],setter[1]-70];bp=[lerp(A0[0],B[0],k),lerp(A0[1],B[1],k)-Math.sin(Math.PI*k)*120,lerp(.9,.8,k)];}
      else if(S.phase==="set"){const k=clamp(S.setT/S.T,0,1),L=LANES[S.to],E=cp(L.u,L.back?.36:.08),B=[setter[0],setter[1]-70];bp=[lerp(B[0],E[0],k),lerp(B[1],E[1]-80,k)-Math.sin(Math.PI*k)*(S.to==="mid"?30:110),1];}
      else if(S.res){const k=clamp(S.t/.4,0,1),L=LANES[S.to],E=cp(L.u,.08);bp=S.res.pts>=3?[E[0],lerp(E[1]-90,E[1]-10,k*k),1]:[lerp(E[0],W/2+(L.u-.5)*400,k),lerp(E[1]-90,H-30,k),1+k*.6];}
      if(bp)D.ball(g,bp[0],bp[1],13*bp[2],X.F.t*10,acc());}
    /* the net (in front of the opponents) */
    g.fillStyle="rgba(255,255,255,.06)";g.fillRect(150,NETY-96,660,96);g.strokeStyle="rgba(255,255,255,.2)";g.lineWidth=1;for(let x=150;x<=810;x+=11){g.beginPath();g.moveTo(x,NETY-96);g.lineTo(x,NETY);g.stroke();}for(let y=NETY-96;y<=NETY;y+=11){g.beginPath();g.moveTo(150,y);g.lineTo(810,y);g.stroke();}
    g.fillStyle="#f4efe6";g.fillRect(150,NETY-100,660,8);g.fillStyle="#2a2730";g.fillRect(136,NETY-112,11,200);g.fillRect(813,NETY-112,11,200);
    if(!S)return;
    /* you: seen from behind, hands rise above the tape when you jump */
    const me=S.me,x=480+(me.u-.5)*2*300,j=me.jumpT>=0?Math.sin(clamp(me.jumpT/AIR,0,1)*Math.PI):0,y=H-12-j*120;
    D.shadow(g,x,H-8,46,.45);D.player(g,{x,y,s:2.05,col:acc(),num:A.K.ME().num||"",a1:-Math.PI*(.78+j*.18),a2:Math.PI*(.78+j*.18),e1:.35*(1-j),e2:-.35*(1-j),crouch:j?0:.35});
    if(j>.25){g.fillStyle=`rgba(${accRgb()},.25)`;g.beginPath();g.ellipse(x,NETY-104,62,10,0,0,TAU);g.fill();}
    /* lane markers along the bottom */
    Object.entries(LANES).forEach(([k,L])=>{if(k==="pipe")return;const lx=480+(L.u-.5)*600;g.fillStyle="rgba(255,255,255,.1)";g.fillRect(lx-1,H-30,2,22);});}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`RALLY ${S.rally} · ${X.mod.label.toUpperCase()}`});
    if(S.phase==="pass"&&S.tell&&X.mod.win>=1&&S.pt>.5){D.small(g,S.to==="opp"?"The setter is arching back…":S.to==="mid"?"The setter's hands are low and quick…":"Watch the setter's hands",W/2,90,14,"rgba(255,255,255,.85)","center");}
    D.glass(g,W-170,H-64,156,50,.6);D.text(g,"JUMP",W-92,H-30,28,acc(),"center",800,true);D.small(g,"tap here or space",W-92,H-16,10,"rgba(255,255,255,.6)","center");}
  A.add("block",{title:"Block Party",tag:"Read the setter. Close the net. Stuff it.",unit:"points",W,H,isNew:true,aria:"Tap below the net to move, tap JUMP or press space to jump. Arrow keys move.",
    desc:"You're the middle blocker. Read where the setter is going, shuffle along the net and jump with the hitter. Watch out for the quick hitter: from rally 4 he's a <b>decoy</b> on some sets.",
    how:["Move: tap anywhere on the floor below the net (or hold ← →). Jump: tap <b>JUMP</b>, tap above the net, or press space.","The setter gives clues: arching back means a back set to the opposite; low, fast hands mean the quick. The ball's flight tells you the rest.",
      "Your hands are above the net for the middle of the jump. Be in front of the hitter at the moment of the hit with your hands at their highest for a <b>stuff block</b> (+3).","Close enough or not quite at the peak: a <b>touch</b> (+1), which your defence can play. Wrong spot, no jump or a jump at the wrong moment: they score, you lose a life.",
      "The quick hitter always runs. Jump with him only if the ball goes to him. You can't move much once you're in the air.","Every 4 in a row raises your multiplier. From rally 7 the pipe (back-row attack) joins in."],
    daily:[{text:"Get 5 stuff blocks",rule:"stuffs",n:5,f:50,ok:S=>S.stuffs>=5},{text:"Score 30 points",rule:"score",n:30,f:45,ok:S=>S.score>=30},{text:"Quicks only: 4 stuffs",rule:"quick",n:4,f:50,ok:S=>S.stuffs>=4}],
    bestOf:c=>c.best.block||0,saveBest:(c,v)=>{if(v>(c.best.block||0))c.best.block=v;},
    start,update,draw,hud,
    down(S,x,y){const X=A.cur;if((x>W-172&&y>H-66)||y<NETY-100){jump(S,X);return;}S.me.target=clamp((x-480)/600+.5,.05,.95);},
    key(S,k){const X=A.cur;if(k===" "||k==="ArrowUp"||k==="w"){jump(S,X);return;}if(["ArrowLeft","ArrowRight","a","d"].includes(k)){S.keys[k]=true;S.me.target=null;return;}return false;},
    keyUp(S,k){S.keys[k]=false;},
    result(S){const sc=Math.round(S.score);return {best:sc,head:`${sc} points`,sub:`${S.stuffs} stuff blocks`,fe:Math.floor(sc/2)+S.stuffs*2,
      stats:[["Stuffs",S.stuffs],["Touches",S.touches],["Best run",S.bestStreak],["Missed",S.missed],["Rallies",S.rally]],
      tip:S.missed>S.stuffs?"Don't jump with the quick hitter unless the ball goes to him.":"",count:[["stuffs",S.stuffs],["touches",S.touches]]};}});
})();

/* =====================================================================================================
   SETTER'S VISION (new)
   ===================================================================================================== */
(function(){
  const W=960,H=560,NET=250,CX0=200,CX1=760;const X_=u=>lerp(CX0,CX1,u);
  const HIT={L:{u:.1,label:"Outside",key:"1",t:1.0,front:true},M:{u:.45,label:"Quick",key:"2",t:.45,front:true},R:{u:.92,label:"Opposite",key:"3",t:.85,front:true},P:{u:.5,label:"Pipe",key:"4",t:.9,front:false}};
  /* blockers react to the set (0.25 s) and then slide at about 0.4 court widths per second */
  const SPEED=.4,REACT=.25;
  const FORMS={base:{n:"Base",p:[.9,.48,.1]},bunch:{n:"Bunched",p:[.7,.5,.3]},overL:{n:"Loaded on your outside",p:[.55,.25,.08]},overR:{n:"Loaded on your opposite",p:[.92,.75,.48]}};
  function start(S,X){S.lives=3;S.streak=0;S.bestStreak=0;S.reads=0;S.dumps=0;S.wrong=0;S.rally=0;newRally(S,X);}
  function newRally(S,X){S.rally++;const r=Math.random(),q=r<.5?"A":r<.82?"B":"C";S.pass=q;S.front=Math.random()<.5;S.phase="pass";S.t=0;S.pick=null;S.res=null;
    const k=X.mod.k*(1+Math.min(.4,S.rally*.015));S.window=Math.max(.75,(1.7-S.rally*.02)/k);S.k=k;
    /* their three blockers: left (in front of our opposite), middle, right (in front of our outside); they shift while the pass comes in */
    const mbCommit=q!=="C"&&Math.random()<.3,f=pick(["base","base","bunch","overL","overR"]),P=FORMS[f].p;S.form=FORMS[f].n;
    S.B=[{u:.9,to:P[0],id:"LB"},{u:.48,to:mbCommit?.45:P[1],commit:mbCommit,id:"MB"},{u:.1,to:P[2],id:"RB"}];
    S.B.forEach(b=>b.to=clamp(b.to+rand(-.03,.03),.04,.96));
    S.passTo=q==="A"?[.62,NET+30]:q==="B"?[.55,NET+85]:[rand(.3,.45),NET+165];}
  /* options for this pass */
  const legal=(S,k)=>k==="D"?S.pass==="A"&&S.front:S.pass==="A"?true:S.pass==="B"?k!=="M":k==="L"||k==="R";
  /* how many blockers get in front of a hitter by the time of the hit */
  function blockersOn(S,k){if(k==="D"){const su=S.passTo[0];return S.B.filter(b=>Math.abs(b.u-su)<.1&&!b.commit).length;}
    const H_=HIT[k],tt=H_.t/S.k*(S.pass==="C"?1.2:1)+(S.pass==="B"?.1:0),reachD=Math.max(0,tt-REACT)*SPEED*S.k+.06+(H_.front?0:.02);
    return S.B.filter(b=>{if(b.commit&&k!=="M")return false;return Math.abs(b.to-H_.u)<=reachD;}).length;}
  function choose(S,X,k){if(S.phase!=="decide")return;const F=X.F;S.pick=k;S.phase="set";S.t=0;
    if(!legal(S,k)){S.lives--;S.streak=0;S.wrong++;S.res={txt:"CAN'T RUN THAT",pts:0,sub:k==="D"?"Dump only from a perfect pass with the setter in the front row":k==="M"?"No quick off a "+S.pass+" pass":"Off a C pass, set high to the outside or opposite"};X.K.sfx("miss");F.pop(W/2,NET-80,S.res.txt,{col:"#ff6b6b",size:34,sub:S.res.sub});if(S.lives<=0)setTimeout(()=>X.finish(),850);return;}
    const n=blockersOn(S,k);let pts,txt,sub;
    if(k==="D"){if(n===0){pts=4;txt="SETTER DUMP!";sub="Nobody was home";S.dumps++;}else{pts=-1;txt="DUMP BLOCKED";sub="Their blocker was right there";}}
    /* scored against the best option this pass offered: a single block is right when nobody was free */
    else{const opts=["L","M","R","P"].filter(o=>legal(S,o)),bestN=Math.min(...opts.map(o=>blockersOn(S,o)));
      if(n===0){pts=3;txt="1 ON 0!";sub="Perfect read: no block";}else if(n===1&&bestN>=1){pts=2;txt="SINGLE BLOCK";sub="The best option on this pass";}
      else if(n===1){pts=1;txt="SINGLE BLOCK";sub="Someone was free: look again";}else{pts=0;txt=n===2?"INTO A DOUBLE":"TRIPLE BLOCK";sub="There was a better hitter";}}
    S.res={txt,pts,sub,n};
    if(pts>0){S.streak++;S.bestStreak=Math.max(S.streak,S.bestStreak);if(pts>=3)S.reads++;const speed=1+Math.max(0,S.window-S.dt)/S.window*.3,mult=1+Math.min(1,Math.floor(S.streak/6)*.25),add=Math.round(pts*mult*speed);S.score+=add;S.res.add=add;X.K.sfx(pts>=3?"kill":"dig");if(pts>=3){F.flashOn(.25,accRgb());F.hit(.35);}}
    else if(pts<0){S.lives--;S.streak=0;X.K.sfx("block");F.hit(.4);}else{S.streak=0;X.K.sfx("miss");}
    F.pop(W/2,NET-80,txt+(S.res.add?` +${S.res.add}`:""),{col:pts>=3?acc():pts>0?"#fff":"#ff6b6b",size:pts>=3?46:32,sub});if(S.lives<=0)setTimeout(()=>X.finish(),850);}
  function update(S,dt,X){S.t+=dt;S.B.forEach(b=>{b.u=damp(b.u,b.to,4,dt);});
    if(S.phase==="pass"&&S.t>=.8){S.phase="decide";S.t=0;S.dt=0;X.K.sfx("set");}
    else if(S.phase==="decide"){S.dt=S.t;if(S.t>S.window){S.phase="set";S.t=0;S.pick=null;S.lives--;S.streak=0;S.res={txt:"TOO SLOW",pts:0,sub:"Decide before the window runs out"};X.K.sfx("miss");X.F.pop(W/2,NET-80,"TOO SLOW",{col:"#ff6b6b",size:34});if(S.lives<=0)setTimeout(()=>X.finish(),850);}}
    else if(S.phase==="set"&&S.t>1.3&&S.on&&S.lives>0)newRally(S,X);
    if(X.challenge&&X.challenge.rule==="reads"&&S.reads>=X.challenge.n)X.finish();}
  function draw(g,S,X){const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#0b0a0d");bg.addColorStop(1,"#1b1416");g.fillStyle=bg;g.fillRect(0,0,W,H);
    /* top-down court */
    const top=40,bot=H-30,fl=g.createLinearGradient(0,top,0,bot);fl.addColorStop(0,"#6a3010");fl.addColorStop(1,"#b85a1c");g.fillStyle=fl;g.fillRect(CX0-40,top,CX1-CX0+80,bot-top);
    g.strokeStyle="#f4efe6";g.lineWidth=3;g.strokeRect(CX0,top+10,CX1-CX0,bot-top-20);g.lineWidth=2;g.beginPath();g.moveTo(CX0,NET-70);g.lineTo(CX1,NET-70);g.moveTo(CX0,NET+70);g.lineTo(CX1,NET+70);g.stroke();
    g.fillStyle="#f4efe6";g.fillRect(CX0-40,NET-3,CX1-CX0+80,6);g.fillStyle="#2a2730";g.fillRect(CX0-50,NET-8,10,16);g.fillRect(CX1+40,NET-8,10,16);
    D.small(g,"THEIR SIDE",CX0+6,top+28,11,"rgba(255,255,255,.55)");D.small(g,"YOUR SIDE",CX0+6,bot-16,11,"rgba(255,255,255,.55)");
    if(!S)return;
    /* their blockers */
    S.B.forEach(b=>{const x=X_(b.u),y=NET-22,up=S.phase==="set"&&S.pick&&S.pick!=="D"&&Math.abs(b.u-HIT[S.pick].u)<.25?1:0;g.fillStyle=b.commit&&S.phase!=="pass"?"#ff9a7a":"#e7e9ff";g.beginPath();g.arc(x,y,13,0,TAU);g.fill();g.fillStyle="#1a1b24";g.font="800 11px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(b.id,x,y);
      g.strokeStyle="rgba(231,233,255,.5)";g.lineWidth=4;g.beginPath();g.moveTo(x-16,NET-4);g.lineTo(x+16,NET-4);g.stroke();if(b.commit&&S.phase!=="pass")D.small(g,"committed",x,y-20,10,"#ffb39d","center");if(up){g.strokeStyle=acc();g.lineWidth=5;g.beginPath();g.moveTo(x-18,NET-2);g.lineTo(x+18,NET-2);g.stroke();}});
    /* your hitters */
    Object.entries(HIT).forEach(([k,h])=>{const x=X_(h.u),y=h.front?NET+110:NET+210,ok=legal(S,k),pick=S.pick===k;const n=S.phase!=="pass"&&X.mod.win>1?blockersOn(S,k):null;
      g.globalAlpha=ok||S.phase==="pass"?1:.35;g.fillStyle=pick?acc():"#20202a";g.strokeStyle=ok?acc():"#555";g.lineWidth=3;g.beginPath();g.arc(x,y,26,0,TAU);g.fill();g.stroke();
      D.text(g,h.key,x,y+9,26,pick?"#141217":"#fff","center",800);D.small(g,h.label.toUpperCase(),x,y+44,12,"rgba(255,255,255,.85)","center");if(n!=null)D.small(g,`${n} blocker${n===1?"":"s"}`,x,y+58,11,n===0?"#9be7a4":"#ffb39d","center");
      /* approach arrow */g.strokeStyle="rgba(255,255,255,.18)";g.lineWidth=2;g.beginPath();g.moveTo(x,y-30);g.lineTo(x,NET+12);g.stroke();g.globalAlpha=1;});
    /* setter and the ball */
    const sp=[X_(S.passTo[0]),S.passTo[1]];g.fillStyle=S.front?acc():"#c8c0b6";g.beginPath();g.arc(sp[0],sp[1],14,0,TAU);g.fill();D.small(g,S.front?"SETTER (front row)":"SETTER (back row)",sp[0],sp[1]+30,11,"rgba(255,255,255,.75)","center");
    if(S.pass==="A"&&S.front){g.strokeStyle=legal(S,"D")?`rgba(${accRgb()},.6)`:"#555";g.setLineDash([4,4]);g.beginPath();g.arc(sp[0],sp[1],22,0,TAU);g.stroke();g.setLineDash([]);D.small(g,"D = dump",sp[0]+28,sp[1]-14,11,acc());}
    let bp;if(S.phase==="pass"){const k=clamp(S.t/.8,0,1);bp=[lerp(X_(.5),sp[0],k),lerp(bot-20,sp[1],k)-Math.sin(Math.PI*k)*30,1+Math.sin(Math.PI*k)*.6];}
    else if(S.phase==="decide")bp=[sp[0],sp[1]-6,1];else if(S.pick&&S.pick!=="D"){const k=clamp(S.t/.45,0,1),h=HIT[S.pick],tx=X_(h.u),ty=NET+12;bp=[lerp(sp[0],tx,k),lerp(sp[1],ty,k),1+Math.sin(Math.PI*k)*.8];}else bp=[sp[0],sp[1]-6,1];
    D.shadow(g,bp[0],bp[1]+10,10,.3);D.ball(g,bp[0],bp[1]-(bp[2]-1)*30,11*bp[2],X.F.t*8,acc());
    /* decision timer */
    if(S.phase==="decide"){const k=1-S.t/S.window;D.meter(g,CX0,16,CX1-CX0,8,k,k<.3?"#ff6b6b":acc());}}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`${S.pass} PASS · RALLY ${S.rally}`});
    D.glass(g,W-188,96,174,120,.6);if(S.phase!=="pass"&&X.mod.win>1)D.small(g,"Block: "+S.form,W-176,232,11,"rgba(255,255,255,.7)");D.small(g,"THIS PASS",W-176,116,11);const opts=S.pass==="A"?"Everything":S.pass==="B"?"No quick":"High: 1 or 3 only";D.text(g,opts,W-176,142,20,"#fff","left",800,true);
    D.small(g,"Pick the hitter with",W-176,170,11);D.small(g,"the fewest blockers.",W-176,186,11);D.small(g,"Keys 1-4, D to dump",W-176,206,11,acc());}
  A.add("setter",{title:"Setter's Vision",tag:"Read the pass, read the block, find the open hitter.",unit:"points",W,H,isNew:true,aria:"Tap a hitter, or press 1 to 4 (D to dump).",
    desc:"You're the setter. The pass decides your options, their blockers shift and sometimes commit. Find the hitter with the fewest blockers before your time runs out.",
    how:["<b>A pass</b> (on target): every option, and a dump if you're front row. <b>B pass</b>: no quick. <b>C pass</b> (far off the net): only a high ball to the outside (1) or opposite (3).",
      "Their middle blocker may <b>commit</b> to your quick (jumping with it): then the outsides are wide open. Blockers also <b>bunch</b> or <b>stack</b> to one side: set the other way.",
      "Fast sets beat the block: a quick or a pipe reaches the hitter before blockers can slide over; a high outside gives them time.","1 on 0: +3. A single block when nobody was free: +2 (+1 if someone was free). Into a double or triple: 0 and your streak resets. A setter dump with nobody in front: +4.",
      "Deciding early gives up to ×1.3 points; every 6 in a row adds ×0.25 (up to ×2). An illegal option or running out of time costs a life. On Rookie you see how many blockers each hitter faces."],
    daily:[{text:"Make 8 perfect reads (1 on 0)",rule:"reads",n:8,f:50,ok:S=>S.reads>=8},{text:"Score 40 points",rule:"score",n:40,f:45,ok:S=>S.score>=40}],
    bestOf:c=>c.best.setter||0,saveBest:(c,v)=>{if(v>(c.best.setter||0))c.best.setter=v;},
    start,update,draw,hud,
    down(S,x,y){const X=A.cur;if(S.phase!=="decide")return;const sp=[X_(S.passTo[0]),S.passTo[1]];if(Math.hypot(x-sp[0],y-sp[1])<30){choose(S,X,"D");return;}
      let best=null,bd=60;Object.entries(HIT).forEach(([k,h])=>{const d=Math.hypot(x-X_(h.u),y-(h.front?NET+110:NET+210));if(d<bd){bd=d;best=k;}});if(best)choose(S,X,best);},
    key(S,k){const X=A.cur;const m={"1":"L","2":"M","3":"R","4":"P",d:"D",D:"D"}[k];if(m)choose(S,X,m);else return false;},
    result(S){const sc=Math.round(S.score);return {best:sc,head:`${sc} points`,sub:`${S.reads} perfect reads`,fe:Math.floor(sc/2)+S.reads*2,
      stats:[["Perfect reads",S.reads],["Dumps",S.dumps],["Best run",S.bestStreak],["Illegal calls",S.wrong],["Rallies",S.rally]],
      tip:S.wrong?"Check the pass first: B means no quick, C means outside or opposite only.":"",count:[["reads",S.reads],["dumps",S.dumps]]};}});
})();
})();
