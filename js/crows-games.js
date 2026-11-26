/* crows-games.js: the Crow's Nest mini-games (v9: rebuilt as real-time action games, inspired by The Spike).
   Three side-view games run on the kit in crows-court.js, with a real ball, jointed athletes and buffered controls:
   Dig Defence  : you are the libero. Move, read the hitter and bump (or dive) the attack up to your setter; your team
                  turns good digs into kills. Tips, roll shots, balls off your own block to chase, spikes going out to leave.
   Freak Quick  : approach, jump and swing at the set. Aim sharp, through the middle or deep, tip or roll it, against a
                  live block and defenders who move to your shot. Kills charge a Power Spike that nothing can stop.
   Jump Serve   : pick your spot, toss, jump and hit a jump spin; or hold and release a jump float that wobbles. Two
                  passers move to the ball: find the short corner, the seam or the end line.
   Two run from other angles, with the same controls and feel:
   Block Party  : behind your blocker. Shuffle along the net, read the setter, hold to jump higher and close on the hitter.
   Setter's Vision: from above. Get under the pass, call your hitter as late as you dare (their middle reads early calls)
                  and find the one with the fewest blockers. */
(function(){
"use strict";
const VB=window.VB,A=VB.crowArcade;if(!A||!A.court)return;
const {clamp,lerp,ease,rand,pick,damp}=A.M,D=A.draw,C=A.court;
const acc=()=>A.K.col(),accRgb=()=>A.K.rgb(),me=()=>A.K.ME();
const TAU=Math.PI*2;
/* run the simulation in small steps so fast balls can't skip through a platform or a block */
const sub=(dt,f)=>{const n=Math.max(1,Math.ceil(dt/.008)),h=dt/n;for(let i=0;i<n;i++)f(h);};
/* a scripted spiker (theirs in Dig Defence, our hitter after your dig): runs from x0, jumps so the swing meets the ball at tc */
const JV=5.6,JT=JV/C.PG;
function script(p,o,at){const tj=o.tc-JT,ta=tj-.5,land=tj+2*JT,f=o.f;p.f=f;
  const runX=t=>t<=ta?o.x0:t>=tj?o.xt:lerp(o.x0,o.xt,ease.inOut((t-ta)/(tj-ta)));
  if(at<tj){p.air=false;p.y=0;p.x=runX(at);p.vx=(runX(at+.02)-runX(at))/.02;
    C.pose(p,at>tj-.13?"load":"ready",at>tj-.13?28:14);return;}
  if(at<land){const t=at-tj;p.air=true;p.y=Math.max(0,JV*t-.5*C.PG*t*t);p.x=o.xt+f*.5*t;p.vx=0;
    if(at<o.tc-.17)C.pose(p,"rise",18);else if(at<o.tc)C.pose(p,o.tip?"tip":"cock",30);else if(at<o.tc+.16)C.pose(p,o.tip?"tip":"swing",40);else C.pose(p,"follow",14);return;}
  p.air=false;p.y=0;const back=Math.min(1,(at-land)/1.2);p.x=lerp(o.xt+f*.5*2*JT,o.x0,ease.inOut(Math.max(0,back-.3)/.7));p.vx=back>.3&&back<1?-f*2:0;C.pose(p,"ready",12);}
/* where a scripted spiker's hand meets the ball */
const hitSpot=(o)=>[o.xt+o.f*(.5*JT+.33),0];
/* can a defender on their side (facing our way) play a ball at x: a platform in front, a dive along the floor */
const canPlay=(p,x)=>p.dive>0?x>=Math.min(p.x,p.x+p.f*1.5)-.25&&x<=Math.max(p.x,p.x+p.f*1.5)+.25:x>=p.x-1.0&&x<=p.x+.32;

/* =====================================================================================================
   DIG DEFENCE
   ===================================================================================================== */
(function(){
  const W=960,H=560,cam=C.camera({x:-2.1,s:54,fy:448,W,H});
  const MAP={ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"," ":"recv",x:"recv",k:"recv",j:"recv",z:"recv",ArrowUp:"recv",w:"recv",
    c:"dive",l:"dive",Shift:"dive",ArrowDown:"dive",s:"dive",f:"focus",v:"focus"};
  const WAVES=["Spikes. Get behind the ball","Tips: sprint forward and dive","Roll shots and balls off your block (chase those!)","Spikes going out: leave them","The tempo picks up","Read the hitter: no landing marks"];
  const BLKX=-.42,SETX=-1.0;
  function start(S,X){S.pad=C.pad(MAP);S.lives=3;S.maxLives=5;S.wave=0;S.combo=0;S.bestCombo=0;S.digs=0;S.perfects=0;S.drops=0;S.shanks=0;S.leaves=0;S.saves=0;S.pancakes=0;S.kills=0;
    S.stamina=1;S.focus=0;S.focusT=0;S.hype=0;S.ch=X.challenge;S.ball=C.ball();S.ball.y=-5;
    S.me=C.athlete(C.ours({me:true,num:me().num||"",x:-6.2,f:1}));S.me.st="move";S.me.rec=-1;S.me.dive=0;S.me.down=0;S.me.goal=null;
    S.tm={b1:C.athlete(C.ours({x:BLKX,num:"1",f:1})),b2:C.athlete(C.ours({x:BLKX-.26,num:"3",f:1,dim:.35})),set:C.athlete(C.ours({x:-2.2,num:"5",f:1}))};
    S.tm.b1.goal=BLKX;S.tm.b2.goal=BLKX-.26;S.tm.set.goal=-2.2;
    S.op={pass:C.athlete(C.theirs({x:5.8,f:-1,num:"6"})),set:C.athlete(C.theirs({x:.72,f:-1,num:"9"})),oh:C.athlete(C.theirs({x:4.3,f:-1,num:"11"})),mb:C.athlete(C.theirs({x:2.4,f:-1,num:"2",dim:.2})),pipe:C.athlete(C.theirs({x:6.6,f:-1,num:"8",dim:.25}))};
    S.phase="gap";S.gt=.9;nextWave(S,X);}
  function nextWave(S,X){S.wave++;S.left=5+S.wave;S.waveDrops=0;S.boss=S.wave%5===0;S.brk=0;
    S.banner={t:0,txt:S.boss?`WAVE ${S.wave}: THE ACE`:`WAVE ${S.wave}`,sub:S.boss?"Fakes and full speed. Stay patient.":WAVES[Math.min(WAVES.length-1,S.wave-1)]};if(S.wave>1)X.K.sfx("whistle");}
  /* the next attack: which hitter, what kind, and what our block does to it */
  function plan(S,X,from){S.left--;const w=S.wave,ch=S.ch&&S.ch.rule,k=X.mod.k*(1+Math.min(.45,(w-1)*.045))*(S.boss?1.08:1);
    const hk=pick(w>=3?["oh","oh","mb","pipe"]:w>=2?["oh","oh","mb"]:["oh","mb","oh"]);
    let types=[["spike",5]];if(w>=2||ch==="tips")types.push(["tip",2]);if(w>=3)types.push(["roll",1.4],["tool",1.4],["touch",.9]);if(w>=4)types.push(["long",1.3],["stuff",.4]);if(S.boss)types.push(["feint",3]);
    if(ch==="tips")types=[["tip",3],["spike",1]];
    let tot=types.reduce((a,b)=>a+b[1],0),r=Math.random()*tot,type="spike";for(const [t,wt] of types){if((r-=wt)<=0){type=t;break;}}
    if(hk==="mb"&&(type==="roll"))type="spike";
    const T2={mb:.46,oh:1.02,pipe:.92}[hk]/k,tP=.62/k,cp={mb:[.62,3.0],oh:[1.05,3.02],pipe:[3.45,2.95]}[hk],x0={mb:2.4,oh:4.3,pipe:6.6}[hk];
    const o={x0,xt:cp[0]+(.5*JT+.33),tc:tP+T2,f:-1,tip:type==="tip"||type==="feint"};
    const reveal=ch==="read"||w>=6||X.mod.win<1?2:X.mod.win>1?0:1;
    /* when our blockers jump: on time for the balls they'll touch, a beat late for the rest, not at all on some quicks */
    const est=(cp[0]-BLKX)/(14.5*X.mod.k),willBlock=["tool","touch","stuff"].includes(type);
    const blkAt=willBlock?tP+T2+est-.26+.03:(hk==="mb"&&Math.random()<.5)?99:tP+T2+est-.03;
    S.att={hk,type,k,tP,T2,tc:tP+T2,cp,o,at:0,set:false,hit:false,crossed:false,reveal,blk:null,touched:false,out:false,feint:type==="feint",blkAt};
    S.op.set.f=-1;S.phase="pass";const fx=from?from[0]:5.4,fy=from?from[1]:.9;S.op.pass.x=fx+.45;S.op.pass.dig=0;
    if(!from){S.ball=C.ball();}Object.assign(S.ball,{x:fx,y:fy,live:false,netDone:false,heat:0,dip:0});const v=C.throwT([fx,fy],[.72+.12,2.62],tP);S.ball.vx=v[0];S.ball.vy=v[1];S.ball.spin=-4;
    S.tm.b1.goal=BLKX;S.tm.b2.goal=BLKX-.26;S.tm.set.goal=-2.2;}
  /* the attack leaves the hitter's hand */
  function attack(S,X){const a=S.att,b=S.ball,F=X.F,[cx,cy]=[b.x,b.y],w=S.wave,k=a.k;let type=a.type;if(a.feint){type="tip";F.pop(cam.X(cx),cam.Y(cy)-50,"FAKE!",{col:"#ffb3a1",size:30});}
    let v=(13.2+Math.min(4.5,w*.42)+rand(0,2.6))*X.mod.k*(S.boss?1.06:1),tx;
    if(type==="tip"){tx=rand(-3.1,-1.05);const vv=C.throwT([cx,cy],[tx,C.BR],.92/Math.sqrt(k));b.vx=vv[0];b.vy=vv[1];v=Math.hypot(vv[0],vv[1]);b.spin=3;}
    else if(type==="roll"){tx=rand(-7.6,-4.4);const vv=C.throwT([cx,cy],[tx,C.BR],1.08/Math.sqrt(k));b.vx=vv[0];b.vy=vv[1];v=Math.hypot(vv[0],vv[1]);b.spin=-8;}
    else{tx=type==="long"?rand(-10.6,-9.35):rand(-8.5,-3.2);if(type==="long")v*=1.06;const g=C.G+4;let vv=C.solve([cx,cy],[tx,C.BR],v,false,g);if(!vv)vv=C.throwT([cx,cy],[tx,C.BR],Math.abs(tx-cx)/(v*.92),g);b.dip=4;b.vx=vv[0];b.vy=vv[1];b.spin=-22;b.heat=v>16?1:v>14.5?.6:.2;}
    b.live=true;b.netDone=false;b.t=0;a.v=v;a.hit=true;a.out=type==="long";a.type=type;a.tx=tx;
    /* our block: will it get a hand on this one? */
    const tX=C.timeToX(b,BLKX),yX=tX!=null?C.at(b,tX)[1]:0;a.tX=tX;a.yX=yX;
    a.blk=(["tool","touch","stuff"].includes(a.type)&&yX>C.NET+.05&&yX<3.05)?a.type:null;
    if(type!=="tip"&&type!=="roll"){C.speedPop(X,cam,cx,cy,v);X.K.sfx("kill");F.hit(.25+Math.min(.4,(v-13)*.05));F.freeze(.03);}else X.K.sfx("set");
    S.hype=Math.max(S.hype,.3);}
  /* where your platform is and what it can reach right now */
  function zone(S){const m=S.me;if(m.dive>0){const t=m.diveT,d=m.f;if(t<.04||t>.5)return null;return {x0:Math.min(m.x+d*.15,m.x+d*1.55),x1:Math.max(m.x+d*.15,m.x+d*1.55),y0:.02,y1:.85,c:m.x+d*1.0,dive:true};}
    if(m.rec<0)return null;const c=m.x+.42;return {x0:c-.6,x1:c+.6,y0:.18,y1:1.75,c,dive:false};}
  function contact(S,X,z,dd){const b=S.ball,a=S.att,m=S.me,F=X.F,bx=b.x,by=b.y,sx=cam.X(bx),sy=cam.Y(by);m.near=null;
    /* touching a spike that was going out gives them the point */
    if(a&&a.out&&!a.touched&&!a.blk){S.combo=0;b.dip=0;b.vx=-2;b.vy=3;b.live=false;S.phase="dead";S.gt=.9;F.pop(sx,sy-40,"IT WAS OUT!",{col:"#ff6b6b",size:32,sub:"Spikes going long: let them go"});X.K.sfx("miss");S.lives--;S.drops++;S.waveDrops++;loseCheck(S,X);return;}
    const off=(dd==null?Math.abs(bx-z.c):dd)/(z.dive?.75:.6),age=z.dive?0:m.rec,timed=!z.dive&&age<=.32;
    let q=1-off*.6-Math.max(0,(a?a.v:12)-15.5)*.035-(1-S.stamina)*.15-(timed?0:.12);if(z.dive)q=Math.min(.68,q);
    const off2=a&&a.blk==="tool",pancake=z.dive&&by<.35;
    let gr=q>=.8&&timed?"perfect":q>=.55?"good":q>=.28?"ok":"shank";if(off2&&gr==="shank")gr="ok";
    S.digs++;m.rec=-1;m.recCool=.15;
    if(gr==="shank"){S.shanks++;S.combo=0;S.stamina=Math.max(0,S.stamina-.05);const vx=rand(-5,4),vy=rand(2,5);b.dip=0;b.vx=vx;b.vy=vy;b.spin=12;b.live=false;S.phase="dead";S.gt=1.1;
      F.pop(sx,sy-40,"SHANKED",{col:"#ffb3a1",size:30,sub:z.dive?"Off your arms":"Get your body behind the ball"});X.K.sfx("miss");if(!z.dive){C.pose(m,"dig",30);m.poseT=.3;}return;}
    S.combo++;S.bestCombo=Math.max(S.bestCombo,S.combo);const mult=1+Math.min(2,Math.floor(S.combo/8)*.5);
    let pts=gr==="perfect"?3:gr==="good"?2:1,tags=[];if(a&&a.v>16.2&&!z.dive){pts+=1;tags.push("heavy hit");}if(pancake){pts+=2;S.pancakes++;tags.push("pancake");}if(off2){pts+=3;S.saves++;tags.push("off the block");}if(a&&a.feint&&gr!=="ok"){pts+=2;tags.push("read the fake");}
    S.score+=pts*mult;S.stamina=clamp(S.stamina-(a&&a.v>15?.035:.02)+(gr==="perfect"?.03:0),0,1);
    if(gr==="perfect"){S.perfects++;S.focus=Math.min(1,S.focus+.2);F.freeze(.06);F.ring(sx,sy,accRgb(),70,8);F.flashOn(.25,accRgb());}
    const name=pancake?"PANCAKE!":off2?"WHAT A SAVE!":gr==="perfect"?"PERFECT":gr==="good"?"NICE DIG":"DUG IT";
    F.pop(sx,sy-48,`${name} +${Math.round(pts*mult)}`,{col:gr==="perfect"||off2||pancake?acc():"#fff",size:gr==="perfect"||pancake||off2?38:28,sub:[mult>1?`×${mult} combo`:"",...tags].filter(Boolean).join(" · ")});
    F.burst(sx,sy,gr==="perfect"?24:12,{col:[acc(),"#fff","#ffd9a8"],speed:360,up:120,size:5});X.K.sfx(gr==="perfect"?"perfect":"dig");F.hit(.18);
    if(!z.dive){C.pose(m,"dig",40);m.poseT=.3;}
    /* the ball goes up to our setter; the worse the dig, the further off it goes */
    const err=gr==="perfect"?rand(-.15,.15):gr==="good"?rand(-.7,.5):rand(-2.2,.4),tx=clamp(SETX+err,-5,-.25),ty=gr==="ok"?2.1:2.6,T=gr==="perfect"?1.05:gr==="good"?.95:.85;
    const vv=C.throwT([bx,by],[tx,ty],T);b.dip=0;b.vx=vv[0];b.vy=vv[1];b.spin=6;b.heat=0;b.live=false;b.netDone=true;
    S.phase="dug";S.dug={gr,t:0,T,tx,ty,set:false,hit:false,pts};
    if(S.combo%10===0){S.score+=5;F.pop(W/2,H*.42,"ROLLING THUNDER!",{col:acc(),size:60,life:1.3,sub:"+5"});F.hit(.7);F.flashOn(.5,accRgb());X.K.sfx("thunder");S.hype=1;}}
  function loseCheck(S,X){if(S.lives<=0){S.endT=.9;}}
  function control(S,X,dt){const P=S.pad,m=S.me;C.tick(P,dt);
    if(C.take(P,"focus",.3))focus(S,X);
    m.recCool=Math.max(0,(m.recCool||0)-dt);
    if(m.down>0){m.down-=dt;m.vx=damp(m.vx,0,8,dt);m.rot=damp(m.rot,0,7,dt);if(m.down<=0){m.rot=0;C.pose(m,"ready",12);}return;}
    if(m.dive>0){m.diveT+=dt;m.vx=damp(m.vx,0,3.2,dt);m.rot=damp(m.rot,1.3,18,dt);if(m.diveT>.55){m.dive=0;m.down=.4;C.pose(m,"low",8);}return;}
    if(m.poseT>0){m.poseT-=dt;}
    let dir=C.dir(P);if(!dir&&m.goal!=null){const d=m.goal-m.x;dir=Math.abs(d)<.12?0:Math.sign(d);if(!dir)m.goal=null;}else if(dir)m.goal=null;
    if(C.take(P,"dive",.15)){const d=dir||(S.ball&&S.ball.live&&S.ball.x<m.x?-1:1);m.dive=1;m.diveT=0;m.rec=-1;m.f=d;m.vx=d*(7.8+S.stamina*1.2);S.stamina=Math.max(0,S.stamina-.07);C.pose(m,"dive",22);X.K.sfx("whoosh");return;}
    if(m.recCool<=0&&C.take(P,"recv",.14)){m.rec=0;C.pose(m,"platform",30);}
    if(m.rec>=0){m.rec+=dt;if(m.rec>.55){m.rec=-1;C.pose(m,"ready",14);}}
    const max=(m.rec>=0?2.4:6.1)*(.72+.28*S.stamina)*(dir<0?.86:1);C.run(m,dir,dt,{max,acc:42});if(!dir)m.vx=damp(m.vx,0,14,dt);m.f=1;
    if(m.rec<0&&!(m.poseT>0)&&m.pose!=="ready")C.pose(m,"ready",14);}
  function focus(S,X){if(S.focus<1||S.focusT>0)return;S.focus=0;S.focusT=3.6;X.F.slowmo(.5,3.6);X.F.flashOn(.4,accRgb());X.K.sfx("thunder");X.F.pop(W/2,H*.42,"LIBERO FOCUS",{col:acc(),size:50,sub:"Everything slows down"});}
  function step(S,X,dt){const b=S.ball,a=S.att,F=X.F;
    control(S,X,dt);C.physics(S.me,dt,{min:-11.6,max:-.55});
    const ev=C.stepBall(b,dt);
    /* their side */
    if(a){a.at+=dt;const o=a.o;["oh","mb","pipe"].forEach(k=>{const p=S.op[k];if(k===a.hk)script(p,o,a.at);
        else if(k==="mb"&&a.hk!=="mb"&&S.wave>=3){script(p,{x0:2.4,xt:1.15,tc:a.tP+.5/a.k,f:-1},a.at);p.decoy=true;}/* the quick hitter runs as a decoy */
        else{p.air=false;p.y=0;p.vx=0;C.pose(p,"ready",10);}});
      const st=S.op.set;st.x=.72;if(!a.set&&a.at>=a.tP-.25)C.pose(st,"set",20);
      if(!a.set&&a.at>=a.tP){a.set=true;const v=C.throwT([b.x,b.y],a.cp,a.T2);b.vx=v[0];b.vy=v[1];b.spin=2;X.K.sfx("set");C.pose(st,"setgo",30);S.phase="set";}
      if(a.set&&a.at>a.tP+.3)C.pose(st,"ready",8);
      if(a.set&&!a.hit&&a.at>=a.tc){b.x=a.cp[0];b.y=a.cp[1];attack(S,X);S.phase="attack";}
      const pa=S.op.pass;C.pose(pa,a.at<.18?"dig":"ready",a.at<.18?40:10);}
    /* our block jumps (a block jump: 4.4 m/s, about half a second in the air) */
    if(a&&a.blkAt<90){const t=a.at-a.blkAt;[S.tm.b1,S.tm.b2].forEach((p,i)=>{if(p.scripted)return;const tt=t-i*.03,air=2*4.4/C.PG;if(tt>=0&&tt<air){p.air=true;p.y=Math.max(0,4.4*tt-.5*C.PG*tt*tt);C.pose(p,"block",30);}else if(tt>=air&&p.air){p.air=false;p.y=0;C.pose(p,"ready",10);}});}
    if(S.phase==="attack"&&a.blk&&!a.crossed&&b.x<=BLKX){a.crossed=true;a.touched=true;b.dip=0;const sx=cam.X(b.x),sy=cam.Y(b.y);F.burst(sx,sy,14,{col:["#fff",acc()],speed:300,size:4});X.K.sfx("block");F.hit(.3);
      if(a.blk==="tool"){b.vx=-rand(3.6,5.6);b.vy=rand(4.6,6.8);b.spin=14;F.pop(sx,sy-36,"OFF THE BLOCK!",{col:"#ffd34d",size:28,sub:"Chase it down!"});}
      else if(a.blk==="touch"){b.vx=-rand(1.4,2.8);b.vy=rand(2.6,3.8);b.spin=6;b.heat=0;F.pop(sx,sy-36,"TOUCH!",{col:"#9be7a4",size:28,sub:"Your block slowed it down"});}
      else{b.vx=rand(2,3.6);b.vy=-1;b.spin=-8;b.heat=0;b.netDone=true;F.pop(sx,sy-36,"STUFF BLOCK!",{col:acc(),size:36,sub:"Your middle got it. +1"});S.score+=1;S.hype=1;X.K.sfx("thunder");F.hit(.6);}
      b.heat=a.blk==="tool"?.3:0;}
    /* the ball is played at its closest moment to the middle of your platform, not the instant it comes into reach */
    if(S.phase==="attack"&&b.x<0){const z=zone(S),m=S.me;if(z&&b.x>=z.x0&&b.x<=z.x1&&b.y>=z.y0&&b.y<=z.y1){const d=Math.hypot(b.x-z.c,(b.y-(z.dive?.3:.85))*.8);
        if(m.near&&d>m.near.d+.004)contact(S,X,m.near.z,m.near.d);else m.near={d,z};}
      else if(m.near){contact(S,X,m.near.z,m.near.d);}}
    if(S.phase!=="attack")S.me.near=null;
    ev.forEach(e=>{if(e.k==="floor"&&S.phase==="attack"){const sx=cam.X(e.x);C.dust(X,cam,e.x,12);
        if(a.blk==="stuff"&&e.x>0){S.phase="dead";S.gt=.8;}
        else if(e.x>0){S.phase="dead";S.gt=.6;}
        else if(e.x<-C.HALF&&!a.touched){S.leaves++;S.score+=1;F.pop(sx,cam.DY(.5)-40,"GOOD LEAVE +1",{col:"#9be7a4",size:28,sub:"That was going out"});X.K.sfx("tick");S.phase="dead";S.gt=.7;}
        else{S.lives--;S.drops++;S.waveDrops++;S.combo=0;S.stamina=Math.max(0,S.stamina-.1);F.hit(.55);F.flashOn(.3,"255,60,60");X.K.sfx("drop");
          F.pop(sx,cam.DY(.5)-40,e.x<-C.HALF?"OFF THE BLOCK: OUT":"DROP!",{col:"#ff5a5a",size:34,sub:a.blk==="tool"?"Balls off your own block are live: chase them":a.type==="tip"?"Tips: sprint in and dive (C)":""});S.phase="dead";S.gt=1;loseCheck(S,X);}}
      if(e.k==="floor"&&(S.phase==="dug"||S.phase==="counter"))C.dust(X,cam,e.x,6);
      if(e.k==="net"){X.K.sfx("block");if(S.phase==="attack"&&b.x>0){S.score+=1;F.pop(cam.X(.5),cam.Y(2.9)-30,"INTO THE NET +1",{col:"#9be7a4",size:26,sub:"Their error"});S.phase="dead";S.gt=.8;}}});
    /* our counter-attack after a dig */
    if(S.phase==="dug"||S.phase==="counter")counter(S,X,dt);
    /* our players walk to where they're needed */
    const tm=S.tm;[["set",tm.set.goal,6],["b1",tm.b1.goal,4],["b2",tm.b2.goal,4]].forEach(([k,gx,v])=>{const p=tm[k];if(p.air||p.scripted)return;C.goTo(p,gx,v,dt);p.x+=p.vx*dt;if(Math.abs(p.vx)<.2&&p.pose!=="block")C.pose(p,"ready",10);});}
  function counter(S,X,dt){const d=S.dug,b=S.ball,tm=S.tm,F=X.F;d.t+=dt;
    if(!d.set){/* setter runs under it */const tt=C.timeToY(b,2.45),gx=tt!=null?b.x+b.vx*tt:b.x;tm.set.goal=clamp(gx-.18,-6,-.35);
      if(d.t>.25&&d.gr!=="ok"){tm.b1.goal=-3.4;}
      if(b.vy<0&&b.y<=2.6&&Math.abs(tm.set.x+.18-b.x)<.6){d.set=true;S.phase="counter";C.pose(tm.set,"setgo",30);X.K.sfx("set");
        const good=d.gr!=="ok"&&tm.b1.x<-2.2;d.kill=good&&(d.gr==="perfect"||Math.random()<.45);d.att=good;
        if(d.att){const cpx=-.78,T=.82;d.tc=T;d.at=0;d.o={x0:tm.b1.x,xt:cpx-(.5*JT+.33),tc:T,f:1};const v=C.throwT([b.x,b.y],[cpx,3.0],T);b.vx=v[0];b.vy=v[1];tm.b1.scripted=true;}
        else{/* a free ball over */const v=C.throwT([b.x,b.y],[rand(3,7),C.BR],1.2);b.vx=v[0];b.vy=v[1];d.free=true;}}
      else if(b.y<.4&&b.vy<0){/* nobody got to it */S.phase="dead";S.gt=.7;}}
    else if(d.att&&!d.hit){d.at+=dt;script(tm.b1,d.o,d.at);if(d.at>=d.tc){d.hit=true;const v=(d.kill?17.5:15)*X.mod.k,vv=C.solve([b.x,b.y],[d.kill?rand(3,7.8):rand(4.5,7),C.BR],v,false,C.G+4)||[v*.9,-2];b.dip=4;b.vx=vv[0];b.vy=vv[1];b.spin=-20;b.heat=d.kill?1:.4;b.live=true;b.netDone=true;
        C.speedPop(X,cam,b.x,b.y,v,acc());X.K.sfx("kill");F.hit(.35);}}
    else if(d.att&&d.hit){d.at+=dt;script(tm.b1,d.o,d.at);
      /* not a kill: their libero digs it and the rally goes on */
      if(!d.kill&&!d.done&&b.x>2&&b.vy<0&&b.y<.95){d.done=true;tm.b1.scripted=false;tm.b1.goal=BLKX;X.K.sfx("dig");X.F.pop(cam.X(b.x),cam.Y(b.y)-40,"DUG! RALLY ON",{col:"#c9c3d4",size:24});
        if(S.left>0){S.att=null;plan(S,X,[b.x,b.y]);}else{S.phase="dead";S.gt=.5;}}}
    if(d.set&&b.y<=C.BR+.02&&b.x>0&&!d.done){d.done=true;tm.b1.scripted=false;tm.b1.goal=BLKX;
      if(d.kill){S.kills++;S.score+=1;S.hype=1;F.pop(cam.X(b.x),cam.DY(.5)-50,"KILL! +1",{col:acc(),size:32,sub:"Your dig, their floor"});X.K.sfx("coin");}
      S.phase="dead";S.gt=.55;}
    if(d.set&&d.free&&b.y<=C.BR+.02&&!d.done){d.done=true;S.phase="dead";S.gt=.5;}}
  function update(S,dt,X,raw){
    S.hype=Math.max(0,S.hype-raw*.5);if(S.focusT>0)S.focusT-=raw;if(S.banner){S.banner.t+=raw;if(S.banner.t>2.4)S.banner=null;}
    if(S.endT!=null){S.endT-=raw;if(S.endT<=0){X.finish();return;}}
    sub(dt,h=>step(S,X,h));
    [S.me,...Object.values(S.tm),...Object.values(S.op)].forEach(p=>C.animate(p,dt));
    if(S.phase==="dead"||S.phase==="gap"){S.gt-=dt;if(S.gt<=0&&S.endT==null){
        if(S.phase==="dead")S.att=null;
        if(S.left<=0){/* wave cleared */const clean=!S.waveDrops;S.score+=S.wave*2;X.F.pop(W/2,H*.38,`WAVE ${S.wave} CLEARED`,{size:52,col:"#fff",life:1.6,sub:clean&&S.lives<S.maxLives?"Clean wave: +1 life":`+${S.wave*2} bonus`});
          if(clean&&S.lives<S.maxLives)S.lives++;X.K.sfx("unlock");S.hype=.8;S.stamina=Math.min(1,S.stamina+.35);
          if(S.ch&&S.ch.rule==="waves"&&S.wave>=S.ch.n){X.finish();return;}nextWave(S,X);S.phase="gap";S.gt=1.6;return;}
        plan(S,X);}}
    if(S.ch&&S.ch.rule==="score"&&S.score>=S.ch.n)X.finish();}
  function draw(g,S,X){C.drawGym(g,cam,acc(),S?S.hype:0,X.F.t);
    if(!S){C.drawNet(g,cam);return;}
    const a=S.att,b=S.ball;
    /* landing read: where the attack will come down (Rookie: at once; Varsity: once it crosses the net) */
    if(a&&a.hit&&S.phase==="attack"&&b.live&&a.reveal<2&&(a.reveal===0||b.x<0)){const L=C.land(b);if(L&&L.x<0){const out=L.x<-C.HALF;const x=cam.X(L.x),y=cam.DY(.5);g.save();g.strokeStyle=out?"rgba(255,90,90,.85)":`rgba(${accRgb()},.85)`;g.lineWidth=3;g.setLineDash(out?[6,5]:[]);g.beginPath();g.ellipse(x,y,22,7,0,0,TAU);g.stroke();g.restore();if(out&&!a.touched&&!a.blk)D.text(g,"OUT",x,y-12,16,"#ff8a8a","center",800,true);}}
    Object.values(S.op).forEach(p=>C.drawAthlete(g,cam,p));
    C.drawNet(g,cam,S.phase==="attack"&&a&&a.crossed?2:0);
    [S.tm.b2,S.tm.set,S.tm.b1].forEach(p=>C.drawAthlete(g,cam,p));C.drawAthlete(g,cam,S.me);
    if(b.y>-1){C.drawShadow(g,cam,b.x,b.y);C.drawBall(g,cam,b,acc());}
    /* reach guide: your platform while you're in stance */
    const z=zone(S);if(z&&!z.dive){g.strokeStyle=`rgba(${accRgb()},.35)`;g.lineWidth=2;g.beginPath();g.moveTo(cam.X(z.x0),cam.Y(.8));g.lineTo(cam.X(z.x1),cam.Y(.8));g.stroke();}
    if(S.focusT>0){const v=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.7);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,`rgba(${accRgb()},.28)`);g.fillStyle=v;g.fillRect(0,0,W,H);}
    if(S.stamina<.3){g.fillStyle=`rgba(120,0,0,${(.3-S.stamina)*.5})`;g.fillRect(0,0,W,H);}}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.combo,lives:S.lives,maxLives:S.maxLives,tag:`WAVE ${S.wave}${S.boss?" · THE ACE":""} · ${X.mod.label.toUpperCase()}`});
    const y=S.combo>1?132:94;D.glass(g,14,y,170,52,.5);D.meter(g,24,y+19,150,7,S.stamina,S.stamina<.3?"#ff5a5a":"#9be7a4","STAMINA");D.meter(g,24,y+42,150,7,S.focus,acc(),S.focus>=1?"FOCUS READY (F)":"LIBERO FOCUS");
    if(S.banner){const k=S.banner.t,al=k<.3?k/.3:k>1.9?1-(k-1.9)/.5:1;g.globalAlpha=clamp(al,0,1);D.glass(g,W/2-240,H*.17,480,76,.75);D.text(g,S.banner.txt,W/2,H*.17+40,34,"#fff","center",800,true);D.small(g,S.banner.sub,W/2,H*.17+63,14,"rgba(255,255,255,.85)","center");g.globalAlpha=1;}
    C.layout(S.pad,W,H,[S.focus>=1&&S.focusT<=0?{a:"focus",label:"FOCUS",sub:"F",hot:true,lift:1.6}:null,{a:"dive",label:"DIVE",sub:"C / Shift"},{a:"recv",label:"BUMP",sub:"Space / X",big:true}]);C.drawPad(g,S.pad,X.F.t);}
  /* autoplay for tests: get behind the ball, bump in time, leave balls going out */
  function bot(S,X){const P=S.pad,m=S.me,b=S.ball,a=S.att;P.h.left=P.h.right=false;let tx=-6;
    const n=A.botNoise||0;if(a&&!a.bn)a.bn={dx:rand(-.4,.4)*n,dt:rand(-.1,.1)*n,react:rand(.08,.2)*n,read:Math.random()<.85-.3*n};
    if(S.phase==="attack"&&b.live&&b.x<1.5&&a&&a.hit&&a.at-a.tc>a.bn.react){const tt=C.timeToY(b,.9);const gx=tt!=null?b.x+b.vx*tt:b.x;const goingOut=a.out&&!a.touched&&!a.blk&&a.bn.read;
      tx=goingOut?-6:gx-.42+a.bn.dx;const d=tx-m.x;if(Math.abs(d)>.12)(d<0?P.h.left=true:P.h.right=true);
      if(!goingOut&&tt!=null&&tt<.2+a.bn.dt&&Math.abs(d)<.6&&m.rec<0&&m.dive<=0)P.p.recv=0;
      if(!goingOut&&tt!=null&&tt<.4&&Math.abs(d)>1.4&&Math.abs(d)<2.6&&m.dive<=0&&m.down<=0){P.h[d<0?"left":"right"]=true;P.p.dive=0;}}
    else{const d=-6-m.x;if(Math.abs(d)>.3)(d<0?P.h.left=true:P.h.right=true);}}
  A.add("dig",C.wire({title:"Dig Defence",tag:"Read it. Get behind it. Don't let it touch the floor.",unit:"points",W,H,aria:"Move with the arrow keys, bump with space, dive with C. On a touch screen use the buttons.",
    controls:"<b>← →</b> move · <b>Space</b> bump · <b>C</b> or <b>Shift</b> dive · <b>F</b> focus · touch: the buttons, or tap the floor to run there",
    desc:"You're the libero. Their hitters attack over your block. Move under the ball and <b>bump</b> it up to your setter, <b>dive</b> for tips, chase balls off your own block, and leave the spikes that are going out.",
    how:["Move with ← → (or A D). Press <b>Space</b> to bump: your arms come out for a moment. The ball has to land on your platform: be <b>behind</b> it, not under it.",
      "A <b>Perfect</b> dig is centred on your platform with your arms out just in time (+3). A good dig +2, a scramble +1. Off-centre or very late and you <b>shank</b> it.",
      "<b>Dive</b> (C or Shift) throws you along the floor in the direction you're moving: it reaches short tips and far balls. A dive right at the floor is a <b>pancake</b> (+2). You need a moment to get up.",
      "Your block sometimes gets a hand on it: a <b>touch</b> slows the ball down, a ball <b>off the block</b> is still live, even past the end line: chase it (+3). A spike going <b>out</b> is a free point if you leave it (+1); touch it and it's theirs.",
      "Your team turns good digs into counter-attack kills (+1). Every 8 in a row raises your multiplier (up to ×3), every 10 is a Rolling Thunder bonus.",
      "Hard hits and dives cost <b>stamina</b>; tired defenders move slower. Perfect digs charge <b>Libero Focus</b> (F): slow motion for a few seconds. A wave with no drops gives a life back (up to 5).",
      "Rookie shows where the ball will land at once, Varsity once it crosses the net, National never: read the hitter and the shadow. Every 5th wave is <b>the Ace</b>, who fakes spikes into tips."],
    daily:[{text:"Survive 6 waves",rule:"waves",n:6,f:45,ok:(S)=>S.wave>=6&&S.lives>0},{text:"Score 60 points in a tips-only match",rule:"tips",n:60,f:45,ok:S=>S.score>=60},{text:"Score 80 with no landing marks",rule:"read",n:80,f:50,ok:S=>S.score>=80},
      {text:"Reach 40 points on National",mode:"national",rule:"score",n:40,f:60,ok:S=>S.score>=40}],
    bestOf:c=>c.best.dig,saveBest:(c,v)=>{if(v>c.best.dig)c.best.dig=v;},
    start,update,draw,hud,bot,
    tap(S,x,y){if(y>cam.FY0-30){const [wx]=cam.inv(x,y);S.me.goal=clamp(wx-.42,-11.5,-.6);}else{S.pad.p.recv=0;}},
    result(S){const sc=Math.round(S.score),acc2=S.digs?Math.round(S.perfects/S.digs*100):0;return {best:sc,head:`${sc} points`,sub:`Wave ${S.wave} reached`,fe:Math.floor(sc/4)+S.wave*3,
      stats:[["Digs",S.digs],["Perfect",`${acc2}%`],["Best combo",S.bestCombo],["Saves",S.saves],["Good leaves",S.leaves],["Drops",S.drops]],
      tip:S.shanks>S.perfects?"Shanks come from being under the ball or late. Get behind it and bump a moment before it arrives.":S.drops>2&&S.pancakes<1?"Tips land short: run in and dive (C) before they hit the floor.":S.leaves<1&&S.wave>=4?"Some spikes go long. If the ball will land past the end line, step away and let it go.":"",
      count:[["digWaves",S.wave],["perfectDigs",S.perfects],["leaves",S.leaves],["saves",S.saves],["pancakes",S.pancakes]],legacy:c=>{c.digs+=S.digs;c.stats=c.stats||{};c.stats.bestWave=Math.max(c.stats.bestWave||0,S.wave);}};}}));
})();

/* =====================================================================================================
   FREAK QUICK
   ===================================================================================================== */
(function(){
  const W=960,H=560,cam=C.camera({x:1.7,s:52,fy:448,W,H});
  const MAP={ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"," ":"jump",z:"jump",j:"jump",ArrowUp:"up",w:"up",ArrowDown:"down",s:"down",x:"tip",c:"tip",k:"tip",l:"tip",Shift:"tip"};
  const SETS={quick:{label:"QUICK",cp:[-.45,3.0],T:.42,pts:3,call:"Quick! Jump before the set"},shoot:{label:"SHOOT",cp:[-.62,3.0],T:.72,pts:2,call:"Shoot set: fast and flat"},
    high:{label:"HIGH BALL",cp:[-.88,3.0],T:1.25,pts:1,call:"High ball: big approach"},pipe:{label:"PIPE",cp:[-3.55,2.95],T:.95,pts:2,call:"Pipe: jump behind the 3 m line"}};
  const MJV=5.6,MJT=MJV/C.PG,R=.52,DIP=5;
  const FORMS=[{n:"Deep",d:[5.2,8.0]},{n:"Spread",d:[3.4,7.6]},{n:"Up and back",d:[2.2,6.6]},{n:"Middle",d:[4.4,6.4]},{n:"Tip cover",d:[1.7,5.4,8.2]}];
  function start(S,X){S.pad=C.pad(MAP);S.power=0;S.pws=0;S.lives=3;S.streak=0;S.best=0;S.kills=0;S.tools=0;S.tips=0;S.stuffed=0;S.dug=0;S.errors=0;S.rally=0;S.hype=0;
    S.eyes=!!(document.getElementById("qkEyes")||{}).checked||(X.challenge&&X.challenge.rule==="eyes");
    S.me=C.athlete(C.ours({me:true,num:me().num||"",x:-4.4,f:1}));S.setter=C.athlete(C.ours({x:-.6,num:"9",f:1}));S.lib=C.athlete(C.ours({x:-7,num:"L",f:1,dim:.35,col:"#1b1a20",numCol:acc()}));
    S.ball=C.ball();S.blk=[0,1,2].map(i=>Object.assign(C.athlete(C.theirs({x:.36+i*.16,f:-1,num:["2","11","4"][i],dim:i*.22})),{jt:99}));S.def=[0,1,2].map(i=>C.athlete(C.theirs(Object.assign({x:4+i*2,f:-1,num:["1","6","L"][i]},i===2?{col:"#1f3b73",col2:"#16294f",numCol:"#e8ecf2"}:{}))));
    newRally(S,X);}
  function newRally(S,X){S.rally++;const c=X.challenge&&X.challenge.rule,r=Math.random(),pass=c==="quick"?"A":r<.55?"A":r<.85?"B":"C";
    let type=pass==="C"?"high":pick(pass==="A"?["quick","quick","shoot","high","pipe"]:["shoot","high","pipe","high"]);if(c==="quick")type="quick";
    const k=X.mod.k*(1+Math.min(.3,S.streak*.012)),T=SETS[type];S.pass=pass;S.type=type;S.T=T;S.k=k;
    S.setX=pass==="A"?-.6:pass==="B"?-1.6:-2.9;S.tPass=.85/Math.sqrt(k);S.tSet=S.tPass;S.dur=T.T/k*(pass==="C"?1.12:1);S.tCP=S.tSet+S.dur;
    S.cp=type==="pipe"?T.cp.slice():[T.cp[0]+(pass==="C"?-.3:0),T.cp[1]];
    S.rt=0;S.phase="pass";S.sw=null;S.res=null;S.hit=false;S.set=false;S.end=0;S.jumpX=null;
    /* the pass from our libero to the setter */
    const b=S.ball=C.ball();b.x=-6.6;b.y=.8;const v=C.throwT([b.x,b.y],[S.setX+.12,2.55],S.tPass);b.vx=v[0];b.vy=v[1];b.spin=-3;
    const sx=type==="pipe"?-6.2:-4.4;if(Math.abs(S.me.x-sx)>.25)S.me.x=sx;S.me.vx=0;S.me.air=false;S.me.y=0;S.me.f=1;C.pose(S.me,"ready",12);S.me.swung=false;
    /* their block: how many, when they jump (timed to the set, not to you: swing off-tempo and you can beat it) */
    const nb=type==="quick"?1:type==="high"?(pass==="C"?3:pick([2,2,2,3])):pick([1,1,2]),commit=type==="quick"&&pass==="A"&&Math.random()<.25+.1*(X.mod.k-1);
    S.nb=nb;S.commit=commit;
    S.blk.forEach((p,i)=>{p.x=.36+i*.16;p.y=0;p.air=false;p.vy=0;p.done=false;C.pose(p,"ready",10);p.jt=99;p.hide=i>=nb;
      if(i<nb){const jitter=rand(-.13,.13)/k;if(type==="quick")p.jt=commit?S.tSet+.15/k:S.tSet+(.36+rand(0,.14))/k;else if(type==="shoot")p.jt=S.tCP-.2+rand(0,.12)/k;else p.jt=S.tCP-.3+jitter+(type==="pipe"?.04:0);}});
    /* their defence for this rally */
    let f=pick(FORMS);if(nb>=2&&Math.random()<.4)f=FORMS[4];S.form=f;S.def.forEach((p,i)=>{p.hide=i>=f.d.length;p.home=f.d[i]||8;p.x=p.home+rand(-.3,.3);p.y=0;p.air=false;p.rot=0;p.dive=0;C.pose(p,"ready",10);p.go=null;});
    S.called=X.mod.win>1;S.ghost=X.mod.win>=1;}
  /* your swing: the hitting hand sweeps; contact is the closest moment to the ball during the swing */
  function cpOf(S){const m=S.me;return [m.x+m.f*.42,C.hipY(m)+1.1];}
  function hit(S,X,d){const m=S.me,b=S.ball,F=X.F,sw=S.sw,q=clamp(1-d/R,0,1),hx=b.x,hy=b.y;S.hit=true;S.phase="attack";b.held=false;b.live=true;b.netDone=false;b.t=0;
    const aim=sw.aim,tip=sw.kind==="tip";let pw=S.power>=1&&!tip,txt="";
    if(S.type==="pipe"&&S.jumpX!=null&&S.jumpX>-3){fault(S,X,"BACK-ROW FAULT","Pipe hitters take off behind the 3 m line");return;}
    let v,tx;
    if(tip){if(aim>0){tx=rand(6.4,8.4);const vv=C.throwT([hx,hy],[tx,C.BR],1.05);b.vx=vv[0];b.vy=vv[1];v=Math.hypot(...vv);txt="roll";}
      else{tx=rand(.9,2.1)+(1-q)*rand(-.4,.6);const vv=C.throwT([hx,hy],[tx,C.BR],.78);b.vx=vv[0];b.vy=vv[1];v=Math.hypot(...vv);txt="tip";}b.spin=4;b.heat=0;}
    else{v=(14.4+4.4*q+clamp((hy-2.9)*4,-1.2,1.4))*(pw?1.28:1);if(pw)v=Math.max(v,21);
      /* sharp means as steep as clears the net from where you hit it: a higher contact, closer to the net, hits sharper */
      const lo=clearX(hx,hy,v),base=aim<0?lo+rand(0,.5):aim>0?Math.max(lo+3,rand(7.6,8.4)):Math.max(lo+1.6,rand(4.6,5.4));tx=base+(1-q)*rand(-1.6,1.4)+(aim>0?(1-q)*1.1:0);
      const g=C.G+DIP;let vv=C.solve([hx,hy],[tx,C.BR],v,false,g);if(!vv)vv=C.throwT([hx,hy],[tx,C.BR],Math.abs(tx-hx)/(v*.85),g);b.dip=DIP;b.vx=vv[0];b.vy=vv[1];b.spin=-24;b.heat=pw?1.4:v>17?1:v>15.5?.6:.25;txt="spike";}
    S.shot={kind:txt,q,v,pw,aim,perfect:q>=.78};S.contactT=S.rt;
    C.pose(m,tip?"tip":"swing",45);X.K.sfx(tip?"set":"kill");
    if(!tip){C.speedPop(X,cam,hx,hy,v,pw?"#ffd34d":q>=.78?acc():"#fff");F.hit(pw?1:.3+q*.3);F.freeze(pw?.12:q>=.78?.06:.03);
      if(pw){S.power=0;S.pws++;X.K.sfx("power");F.slowmo(.3,.35);F.flashOn(.7,"255,211,77");F.ring(cam.X(hx),cam.Y(hy),"255,211,77",160,10);F.pop(cam.X(hx),cam.Y(hy)-80,"POWER SPIKE!",{col:"#ffd34d",size:46});}
      else if(q>=.78){F.flashOn(.25,accRgb());F.burst(cam.X(hx),cam.Y(hy),18,{col:[acc(),"#fff"],speed:420,size:4,shape:"spark",dir:.3,spread:1});}}
    /* defenders read the shot after a beat */
    const L=C.land(b);S.def.forEach(p=>{if(p.hide)return;p.react=(tip?.12:.2)/Math.sqrt(S.k)+rand(0,.06);p.go=L?L.x+.42:p.home;});
    const near=S.def.filter(p=>!p.hide).sort((a,c)=>Math.abs(a.go-a.x)-Math.abs(c.go-c.x));S.def.forEach(p=>{if(p.hide)return;if(p!==near[0])p.go=lerp(p.home,p.go,.25);});}
  /* the shortest landing spot that still clears the tape by a little */
  const clearX=(hx,hy,v)=>Math.min(8,Math.max(1.2,C.clearX([hx,hy],v,C.G+DIP,.16)));
  function fault(S,X,txt,sub){if(S.res)return;S.res={err:true};S.lives--;S.errors++;S.streak=0;S.phase="end";S.end=1.1;X.K.sfx("miss");X.F.hit(.3);X.F.flashOn(.25,"255,60,60");
    X.F.pop(W/2,H*.34,txt,{col:"#ff6b6b",size:40,sub});S.power=Math.max(0,S.power-.2);if(S.lives<=0)S.endT=.9;}
  function kill(S,X,txt,pts,sub,x){if(S.res)return;const F=X.F;S.res={pts};S.streak++;S.kills++;S.best=Math.max(S.best,S.streak);const mult=1+Math.min(1.5,Math.floor(S.streak/5)*.5);let add=pts*mult*(S.eyes?2:1);S.score+=add;
    if(!S.shot.pw){const was=S.power<1;S.power=Math.min(1,S.power+(S.shot.perfect?.34:.22)*((S._f&&S._f.perk.power)||1));if(was&&S.power>=1){F.pop(W/2,H*.52,"POWER SPIKE READY",{col:"#ffd34d",size:34,sub:"Your next spike goes through anything"});X.K.sfx("coin");}}
    S.hype=1;F.pop(cam.X(x),cam.DY(.5)-70,`${txt} +${Math.round(add)}`,{col:pts>=4?acc():"#fff",size:pts>=4?44:34,sub:[sub,mult>1?`×${mult}`:"",S.eyes?"eyes closed ×2":""].filter(Boolean).join(" · ")});
    C.dust(X,cam,x,18,[acc(),"#fff","#e9c9a0"]);F.hit(.45);S.phase="end";S.end=1.15;C.pose(S.me,"celebrate",10);}
  /* a dug ball isn't an error: no point, but your streak survives */
  function noPoint(S,X,txt,sub,x){if(S.res)return;S.res={pts:0};S.phase="end";S.end=1.1;X.K.sfx("dig");X.F.pop(cam.X(x),cam.DY(.5)-70,txt,{col:"#cfc8bd",size:32,sub});S.power=Math.max(0,S.power-.1);}
  function control(S,X,dt){const P=S.pad,m=S.me;C.tick(P,dt);const dir=C.dir(P);
    if(m.poseT>0)m.poseT-=dt;
    if(!m.air&&S.phase==="end"){/* walk back for the next ball */if(S.end<.8){C.goTo(m,S.type==="pipe"?-6:-4.4,4.5,dt,1);m.f=1;if(m.pose!=="celebrate"||S.end<.5)C.pose(m,"ready",10);}else m.vx=damp(m.vx,0,10,dt);return;}
    if(!m.air){C.run(m,dir,dt,{max:6.4,acc:40});if(!dir)m.vx=damp(m.vx,0,12,dt);m.f=1;
      if(!S.hit&&C.take(P,"jump",.15)){C.jump(m,MJV,.55);S.jumpX=m.x;C.pose(m,"rise",24);X.K.sfx("jump");}
      else if(!S.sw&&!(m.poseT>0))C.pose(m,"ready",14);}
    else{C.run(m,dir,dt,{max:6.4,airAcc:3});
      if(!S.sw&&!m.swung&&!S.hit){const k=C.take(P,"jump",.1)?"spike":C.take(P,"tip",.1)?"tip":null;if(k){m.swung=true;S.sw={kind:k,t:0,aim:P.h.up?1:P.h.down?-1:0,min:9};C.pose(m,k==="tip"?"tip":"cock",38);}}}
    if(S.sw){const sw=S.sw;sw.t+=dt;if(sw.kind==="spike"&&sw.t>.05&&m.pose==="cock")C.pose(m,"swing",40);if(!sw.aim)sw.aim=P.h.up?1:P.h.down?-1:0;
      if(!S.hit&&S.set&&sw.t<=.17){const [cx,cy]=cpOf(S),d=Math.hypot(S.ball.x-cx,S.ball.y-cy);
        if(d<R){if(d>sw.min+.003)hit(S,X,sw.min);else sw.min=d;}else if(sw.min<R)hit(S,X,sw.min);
        if(!S.hit&&sw.t>.16&&sw.min<R)hit(S,X,sw.min);}
      if(sw.t>.22&&!S.hit){S.sw=null;C.pose(m,"follow",12);X.F.pop(cam.X(m.x),cam.Y(3.4),"WHIFF",{col:"#ffb3a1",size:24});}
      else if(sw.t>.3)S.sw=null;}}
  function step(S,X,dt){const b=S.ball,F=X.F;S.rt+=dt;control(S,X,dt);
    if(C.physics(S.me,dt,{min:-7.2,max:-.2})){C.pose(S.me,"low",14);S.me.poseT=.18;C.dust(X,cam,S.me.x,6);S.sw=null;}
    C.pose(S.lib,S.rt<.22?"dig":"ready",S.rt<.22?40:10);
    /* setter: moves to the pass and sets */
    const st=S.setter;if(!S.set){C.goTo(st,S.setX,5.5,dt,1);st.x+=st.vx*dt;C.pose(st,S.rt>S.tPass-.3?"set":"ready",18);}
    if(!S.set&&S.rt>=S.tSet){S.set=true;S.phase="set";const v=C.throwT([b.x,b.y],S.cp,S.dur);b.vx=v[0];b.vy=v[1];b.spin=2;X.K.sfx("set");C.pose(st,"setgo",30);S.called=true;}
    if(S.set&&S.rt>S.tSet+.35)C.pose(st,"ready",8);
    const ev=C.stepBall(b,dt);
    /* missed it altogether */
    if(S.set&&!S.hit&&!S.res&&S.rt>S.tCP+.25&&b.y<2){fault(S,X,"MISSED IT","Jump so you're at the top as the ball arrives");}
    /* their block */
    S.blk.forEach(p=>{if(p.hide)return;const t=S.rt-p.jt;if(t>=0&&!p.done){if(!p.air&&t<.05){p.air=true;p.vy=4.35;C.pose(p,"block",30);}}
      if(p.air){p.vy-=C.PG*dt;p.y+=p.vy*dt;if(p.y<=0){p.y=0;p.air=false;p.done=true;C.pose(p,"ready",10);}}else if(S.commit&&!S.set&&S.rt>S.tPass-.45)C.pose(p,"load",8);});
    if(S.phase==="attack"&&!S.blocked&&b.vx>0&&b.x>=.22&&b.x-b.vx*dt<.22){const sh=S.shot;
      for(const p of S.blk){if(p.hide||!p.air)continue;const top=C.joint(p,"h2")[1]+.07;if(b.y<=top&&b.y>=C.NET-.05){S.blocked=true;b.dip=0;const tips=b.y>top-(sh.aim>0?.3:.18),sx=cam.X(b.x),sy=cam.Y(b.y);
          F.burst(sx,sy,16,{col:["#fff",sh.pw?"#ffd34d":acc()],speed:340,size:4});X.K.sfx("block");F.hit(.45);
          if(sh.pw){S.bust=true;b.vx*=.82;F.pop(sx,sy-40,"BLOCK BUSTED!",{col:"#ffd34d",size:38});S.blk.forEach(o=>{if(o.air)C.pose(o,"slump",20);});}
          else if(tips&&sh.v>15.2&&sh.kind==="spike"&&Math.random()<.45+.5*sh.q){S.tool=true;b.vx=rand(3.6,5.2);b.vy=rand(5.2,7);b.spin=20;b.heat=.2;b.netDone=true;F.pop(sx,sy-40,"TOOLED!",{col:acc(),size:34,sub:"Off the hands and out"});}
          else if(Math.random()<(S.nb>=2?.75:.4)){S.stuff=true;b.vx=-rand(2.2,3.6);b.vy=-rand(.4,1.8);b.netDone=true;b.heat=0;F.pop(sx,sy-40,"STUFFED",{col:"#ff6b6b",size:38});F.flashOn(.3,"255,60,60");}
          else{S.soft=true;b.vx=rand(.8,1.8);b.vy=rand(2.6,3.6);b.heat=0;b.netDone=true;F.pop(sx,sy-40,"SOFT BLOCK",{col:"#cfc8bd",size:28,sub:"Their defence will play it"});}
          break;}}}
    /* defenders */
    S.def.forEach(p=>{if(p.hide)return;if(p.dive>0){p.dive+=dt;p.vx=damp(p.vx,0,3,dt);p.x+=p.vx*dt;p.rot=damp(p.rot,1.3,16,dt);if(p.dive>.9){p.dive=0;p.rot=0;C.pose(p,"ready",8);}return;}
      if(S.phase==="attack"&&p.go!=null&&S.rt-S.contactT>p.react){C.goTo(p,p.go,(S.shot&&S.shot.kind!=="spike"?4.6:2.8)*Math.sqrt(S.k),dt,-1);p.x+=p.vx*dt;C.pose(p,"ready",12);
        /* dive if the ball is about to land just out of reach */
        if(!S.res&&!S.tool&&!S.stuff&&b.x>0&&b.vy<0){const tl=C.timeToY(b,.35),lx=tl!=null?b.x+b.vx*tl:b.x,gap=lx-(p.x-.42);if(tl!=null&&tl<.24&&Math.abs(gap)>.5&&Math.abs(gap)<1.35&&p===nearest(S,lx)){p.dive=.01;p.f=gap<0?-1:1;p.vx=Math.sign(gap)*7;C.pose(p,"dive",22);}}}
      else if(S.phase!=="attack"){p.vx=0;}});
    /* a defender gets to it */
    if(S.phase==="attack"&&!S.res&&b.x>.3&&b.vy<0&&b.y<1.4&&!S.tool&&!S.stuff){for(const p of S.def){if(p.hide)continue;
        if(canPlay(p,b.x)&&b.y>.08){const hot=S.shot.pw||S.bust||(S.shot.kind==="spike"&&S.shot.v>(p.dive>0?16:17.6)*Math.sqrt(S.k));
          b.dip=0;if(hot){S.hotX=b.x;b.vx=rand(-3,4);b.vy=rand(3,6);b.spin=30;F.pop(cam.X(b.x),cam.Y(b.y)-40,"TOO HOT!",{col:"#ffd34d",size:34,sub:"Straight off their arms"});F.hit(.4);X.K.sfx("block");S.through=true;b.netDone=true;}
          else{S.dug++;b.vx=rand(-1.5,1);b.vy=rand(4,5.5);b.spin=8;b.netDone=true;C.pose(p,"dig",40);noPoint(S,X,"DUG",S.shot.kind==="tip"?"They were up for the tip. Streak kept":"Hit where they aren't. Streak kept",b.x);}break;}}}
    ev.forEach(e=>{if(e.k==="net"&&S.phase==="attack"&&!S.res){fault(S,X,"INTO THE NET",S.shot&&S.shot.aim<0?"Too sharp from there: jump higher or aim deeper":"Contact the ball higher");}
      if(e.k==="floor"&&!S.res){const x=e.x,sh=S.shot||{};
        if(S.stuff||x<0){S.stuffed++;fault(S,X,"STUFFED","Look at their block before you swing: tip or go over it");}
        else if(S.tool){S.tools++;kill(S,X,"TOOLED!",S.T.pts+2,"Off the block",Math.min(x,9.6));}
        else if(S.through){kill(S,X,sh.pw?"POWER SPIKE!":"KILL!",S.T.pts+(sh.pw?2:1)+(S.bust?1:0),sh.pw?"Nothing stops that":"Too hot to handle",Math.min(S.hotX||x,9));}
        else if(x>C.HALF){fault(S,X,"OUT!","Long: aim a little shorter or hit with more topspin (jump earlier)");}
        else{let pts=sh.kind==="tip"||sh.kind==="roll"?2:S.T.pts+(sh.perfect?1:0)+(sh.v>17.4?1:0)+(sh.pw?2:0)+(S.bust?1:0),txt=sh.pw?"POWER SPIKE!":sh.kind==="tip"?"TIP KILL":sh.kind==="roll"?"ROLL SHOT":sh.perfect?"PERFECT KILL":"KILL";
          if(sh.kind==="tip"||sh.kind==="roll")S.tips++;kill(S,X,txt,pts,sh.kind==="spike"?`${C.kmh(sh.v)} km/h`:"Into the gap",x);}}});}
  const nearest=(S,x)=>S.def.filter(p=>!p.hide).sort((a,c)=>Math.abs(a.x-.42-x)-Math.abs(c.x-.42-x))[0];
  function update(S,dt,X,raw){S.hype=Math.max(0,S.hype-raw*.6);if(S.endT!=null){S.endT-=raw;if(S.endT<=0){X.finish();return;}}
    sub(dt,h=>step(S,X,h));[S.me,S.setter,S.lib,...S.blk,...S.def].forEach(p=>C.animate(p,dt));
    if(S.phase==="end"&&S.endT==null){S.end-=dt;if(S.end<=0){S.blocked=S.tool=S.stuff=S.soft=S.through=S.bust=false;S.shot=null;newRally(S,X);}}
    if(X.challenge&&X.challenge.rule==="streak"&&S.best>=X.challenge.n)X.finish();}
  function draw(g,S,X){C.drawGym(g,cam,acc(),S?S.hype:0,X.F.t);if(!S){C.drawNet(g,cam);return;}
    const b=S.ball;
    /* Rookie: their defenders' reach on the floor, so you can see the gaps */
    if(X.mod.win>1&&S.phase!=="end")S.def.forEach(p=>{if(p.hide)return;C.floorZone(g,cam,p.x-.42-.62,p.x-.42+.62,"120,200,255",.1);});
    [...S.def].reverse().forEach(p=>{if(!p.hide)C.drawAthlete(g,cam,p);});
    [...S.blk].reverse().forEach(p=>{if(!p.hide)C.drawAthlete(g,cam,p);});
    C.drawNet(g,cam,S.blocked?3:0);
    C.drawAthlete(g,cam,S.lib);C.drawAthlete(g,cam,S.setter);C.drawAthlete(g,cam,S.me);
    /* where to meet the ball */
    if(S.ghost&&S.set&&!S.hit&&S.phase==="set"){const x=cam.X(S.cp[0]),y=cam.Y(S.cp[1]),k=clamp((S.rt-S.tSet)/S.dur,0,1);g.save();g.strokeStyle=`rgba(${accRgb()},${.35+.4*k})`;g.setLineDash([6,6]);g.lineWidth=2;g.beginPath();g.arc(x,y,R*cam.s*(1.25-.35*k),0,TAU);g.stroke();g.restore();}
    if(S.type==="pipe"&&!S.hit){const x=cam.DX(-3,.5);g.strokeStyle="rgba(255,90,90,.55)";g.lineWidth=3;g.beginPath();g.moveTo(cam.DX(-3,.1),cam.DY(.1));g.lineTo(cam.DX(-3,.9),cam.DY(.9));g.stroke();}
    const k=S.set&&!S.hit?(S.rt-S.tSet)/S.dur:0,hide=S.eyes&&S.set&&!S.hit&&k>.15&&k<1.02;
    const fade=S.tool&&S.hit?clamp(1-(S.rt-S.contactT-.15)/.9,0,1):1;
    C.drawShadow(g,cam,b.x,b.y);C.drawBall(g,cam,b,acc(),{alpha:hide?0:fade,scale:S.tool?.6+.4*fade:1});
    if(hide){const x=cam.X(b.x),y=cam.Y(b.y);g.fillStyle="rgba(255,255,255,.12)";g.beginPath();g.arc(x,y,4,0,TAU);g.fill();}
    /* the setter's call */
    if(S.called&&!S.hit&&S.phase!=="end"){D.text(g,S.T.label+"!",W/2,96,34,acc(),"center",800,true);D.small(g,S.T.call,W/2,116,13,"rgba(255,255,255,.8)","center");}}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`${S.pass} PASS · ${S.T.label}${S.eyes?" · EYES CLOSED":""}`});
    {const y=S.streak>1?132:94,full=S.power>=1;D.glass(g,14,y,170,30,.5);D.meter(g,24,y+17,150,7,S.power,full?"#ffd34d":acc());D.small(g,full?"⚡ POWER SPIKE READY":"POWER",24,y+12,10,full?"#ffd34d":"rgba(255,255,255,.7)");
      if(full){g.globalAlpha=.4+.4*Math.sin(X.F.t*12);g.strokeStyle="#ffd34d";g.lineWidth=2;D.round(g,14,y,170,30,10);g.stroke();g.globalAlpha=1;}}
    const blk=S.nb+(S.nb===1?" blocker":" blockers")+(S.commit?" · their middle is committing":"");D.small(g,`Their block: ${blk} · defence: ${S.form.n.toLowerCase()}`,W/2,56,12,"rgba(255,255,255,.8)","center");
    const air=S.me.air&&!S.me.swung;
    C.layout(S.pad,W,H,air?[{a:"tip",label:"TIP",sub:"X / C"},{a:"jump",also:["down"],label:"SHARP",sub:"↓ + Space",lift:.9},{a:"jump",label:"SPIKE",sub:"Space",big:true},{a:"jump",also:["up"],label:"DEEP",sub:"↑ + Space",lift:.9}]
      :[{a:"tip",label:"TIP",sub:"X / C",dim:true},{a:"jump",label:"JUMP",sub:"Space / Z",big:true,hot:S.phase==="set"&&!S.me.air}]);C.drawPad(g,S.pad,X.F.t);}
  function bot(S,X){const P=S.pad,m=S.me;P.h.left=P.h.right=P.h.up=P.h.down=false;if(S.phase==="end"||S.hit)return;const n=A.botNoise||0;if(S.bn==null||S.bnR!==S.rally){S.bnR=S.rally;S.bn={t:rand(-.08,.08)*n,x:rand(-.25,.25)*n,s:rand(-.05,.05)*n};}
    const tTake=S.tCP-MJT+.03+S.bn.t,xTake=S.cp[0]-.42+S.bn.x;const d=xTake-m.x;
    if(!m.air){if(Math.abs(d)>.08)(d<0?P.h.left=true:P.h.right=true);if(S.rt>=tTake&&Math.abs(d)<.5)P.p.jump=0;}
    else if(!m.swung&&S.rt>=S.tCP-.07+S.bn.s){/* aim at the open zone */const zones=[2.3,5.0,8.0],ds=S.def.filter(p=>!p.hide).map(p=>p.x-.42);let bi=1,bd=-1;zones.forEach((z,i)=>{const dd=Math.min(...ds.map(x=>Math.abs(x-z)));if(dd>bd){bd=dd;bi=i;}});
      /* a reading hitter: over a big block go deep (or tip), past a small one find the gap */
      if(S.nb>=2&&Math.random()<.85){if(Math.random()<.35){P.p.tip=0;if(Math.random()<.5)P.h.up=true;}else{P.p.jump=0;P.h.up=true;}}else{P.p.jump=0;if(bi===0)P.h.down=true;if(bi===2)P.h.up=true;}}}
  A.add("quick",C.wire({title:"Freak Quick",tag:"Approach. Jump. Swing. Find the gap.",unit:"best streak",W,H,extra:`<label class="small eyes"><input type="checkbox" id="qkEyes"> Eyes closed: the ball vanishes during the set (double points)</label>`,
    aria:"Move with the arrow keys, space to jump and again to spike, up or down to aim, X to tip.",
    controls:"<b>← →</b> approach · <b>Space</b> jump, <b>Space</b> again to spike · hold <b>↑</b> deep or <b>↓</b> sharp · <b>X</b> tip (<b>↑ X</b> roll shot)",
    desc:"You're the attacker. Read the set, time your approach and jump, and swing as the ball reaches your hand. Aim <b>sharp</b>, <b>middle</b> or <b>deep</b> past their block and defence, or tip it. Kills charge a <b>Power Spike</b>.",
    how:["Move with ← → (A D). Press <b>Space</b> (or Z) to jump, then <b>Space again</b> in the air to swing. The ball has to be at your hand: be at the top of your jump as it arrives, with the ball just in front of you.",
      "The setter calls the set: a <b>quick</b> (jump before the ball is even set), a fast <b>shoot</b>, a <b>high ball</b> or a <b>pipe</b> from behind the 3 m line. The dashed ring shows where to meet it (not on National).",
      "Hold <b>↓</b> to hit sharp (short, steep), nothing for the middle, <b>↑</b> to hit deep. A higher contact can hit steeper; low contact sharp goes into the net, and deep with a poor contact goes long.",
      "Their block jumps on the setter's tempo. A late block can't stop a fast sharp ball. Hit into a block and you're <b>stuffed</b>, unless you catch the top of their hands: then you <b>tool</b> it out (+2). <b>X</b> tips over the block, <b>↑ X</b> rolls it deep.",
      "Their defenders move to your shot. A ball that lands is a kill; one they reach is <b>dug</b> (no point, but your streak survives) unless it's too hot to handle. Errors (stuffed, net, out, a miss) cost a life and the streak.",
      "Kills fill your <b>Power</b> meter. Full, your next spike is a <b>Power Spike</b>: through the block, too hot to dig. Kills: quick 3, shoot or pipe 2, high 1, +1 perfect contact, +1 over 108 km/h. Every 5 in a row raises your multiplier; eyes closed doubles it."],
    daily:[{text:"Get a streak of 8",rule:"streak",n:8,f:45,ok:S=>S.best>=8},{text:"Score 40 points with eyes closed",rule:"eyes",n:40,f:55,ok:S=>S.score>=40},{text:"Quick sets only: streak of 6",rule:"quick",n:6,f:45,ok:S=>S.best>=6}],
    bestOf:c=>c.best.quick,saveBest:(c,v)=>{if(v>c.best.quick)c.best.quick=v;},
    start,update,draw,hud,bot,
    tap(S,x,y){if(!S.me.air)S.pad.p.jump=0;else S.pad.p.jump=0;},
    result(S){const sc=Math.round(S.score);return {best:S.best,head:`${sc} points`,sub:`Best streak ${S.best}`,fe:Math.floor(sc/2)+S.best,
      stats:[["Kills",S.kills],["Best streak",S.best],["Power spikes",S.pws],["Tooled",S.tools],["Tips and rolls",S.tips],["Stuffed",S.stuffed]],
      tip:S.stuffed>=2?"Watch their block: when it's up in time, tip (X), roll (↑ X) or aim deep over it.":S.dug>S.kills?"Their defence is reading you: look where they stand and aim sharp, middle or deep at the gap.":S.errors>2?"Jump a little earlier, so the ball meets you at the top of your jump.":"",
      count:[["kills",S.kills],["tools",S.tools],["tipKills",S.tips],["powerSpikes",S.pws]],legacy:c=>{c.stats=c.stats||{};c.stats.quickScore=Math.max(c.stats.quickScore||0,sc);}};}}));
})();

/* =====================================================================================================
   JUMP SERVE
   ===================================================================================================== */
(function(){
  const W=960,H=560,cam=C.camera({x:-1.6,s:44,fy:448,W,H});
  const MAP={ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"," ":"serve",z:"serve",j:"serve",x:"serve",ArrowUp:"up",w:"up",ArrowDown:"down",s:"kind",t:"kind",Tab:"kind"};
  const MJV=5.6,MJT=MJV/C.PG,R=.52,ZN=[[0,4.2,"SHORT"],[4.2,6.6,"MIDDLE"],[6.6,9,"DEEP"]],DIP=7;
  function start(S,X){S.pad=C.pad(MAP);S.lives=3;S.aces=0;S.serves=0;S.streak=0;S.bestStreak=0;S.seams=0;S.kind="spin";S.errors=0;S.tough=0;S.hype=0;S.aim=.62;S.fastest=0;
    S.home=-11.2;S.me=C.athlete(C.ours({me:true,num:me().num||"",x:S.home,f:1}));S.ball=C.ball();
    S.mates=[C.athlete(C.ours({x:-1.1,num:"1",f:1,dim:.3})),C.athlete(C.ours({x:-4.2,num:"5",f:1,dim:.3})),C.athlete(C.ours({x:-6.6,num:"L",f:1,dim:.4,col:"#1b1a20",numCol:acc()}))];
    S.rec=[0,1].map(i=>C.athlete(C.theirs(Object.assign({x:3+i*4,f:-1,num:["7","L"][i]},i?{col:"#1f3b73",col2:"#16294f",numCol:"#e8ecf2"}:{}))));
    S.opset=C.athlete(C.theirs({x:.6,f:-1,num:"9",dim:.3}));newServe(S,X);}
  function newServe(S,X){S.serves++;S.phase="ready";S.pt=0;S.res=null;S.sw=null;S.hit=false;S.jumpX=null;S.held=false;
    const b=S.ball=C.ball();b.held=true;S.me.air=false;S.me.y=0;S.me.vx=0;S.me.swung=false;C.pose(S.me,"stand",10);if(Math.abs(S.me.x-S.home)>.3)S.me.x=S.home;
    S.target=X.challenge&&X.challenge.rule==="target"?2:Math.floor(Math.random()*3);S.pressure=S.serves%6===0;
    const fr=rand(2.4,3.9),bk=rand(6,7.7);S.rec.forEach((p,i)=>{p.home=i?bk:fr;p.x=p.home;p.y=0;p.vx=0;p.rot=0;p.dive=0;p.go=null;C.pose(p,"ready",10);});}
  const tx=a=>lerp(3.3,8.75,a);
  /* the fastest serve that lands at t from p: deep serves are fast, short ones have to be slower */
  const speedFor=(p,t,spin,q)=>C.maxV(p,t,spin?C.G+DIP:C.G,8.5,spin?15.5+7.5*q:12.5+6.5*q,.12+.12*q)||8.5;
  function holdBall(S){const b=S.ball,m=S.me;if(!b.held)return;const h=C.joint(m,"h1");b.x=h[0]+.1;b.y=h[1]+.12;b.vx=b.vy=0;b.trail=[];}
  function toss(S,X){const b=S.ball,m=S.me;b.held=false;b.t=0;b.trail=[];S.phase="toss";S.pt=0;X.K.sfx("whoosh");
    if(S.kind==="spin"){b.x=m.x+.3;b.y=1.95;b.vx=1.32;b.vy=6.6;b.spin=6;C.pose(m,"toss",22);}
    else{b.x=m.x+.36;b.y=1.95;b.vx=.45;b.vy=4.4;b.spin=.5;C.pose(m,"toss",22);S.held=true;}}
  function cpOf(m){return [m.x+m.f*.42,C.hipY(m)+1.1];}
  function strike(S,X,d){const m=S.me,b=S.ball,F=X.F,q=clamp(1-d/R,0,1),hx=b.x,hy=b.y;S.hit=true;S.phase="fly";b.live=true;b.netDone=false;b.t=0;b.held=false;
    if(S.jumpX!=null&&S.jumpX>-C.HALF){fault(S,X,"FOOT FAULT","Take off behind the end line: start further back");b.vx=1;b.vy=1;b.live=false;return;}
    const spin=S.kind==="spin",g=spin?C.G+DIP:C.G,aimT=tx(S.aim),v=speedFor([hx,hy],aimT,spin,q)*(1+clamp((hy-2.95)*.08,-.06,.06))*(1+(1-q)*rand(-.12,.1)),t=aimT+(1-q)*rand(-1.8,1.6);
    let vv=C.solve([hx,hy],[t,C.BR],v,false,g);if(!vv)vv=C.throwT([hx,hy],[t,C.BR],Math.abs(t-hx)/(v*.85),g);b.dip=spin?DIP:0;b.vx=vv[0];b.vy=vv[1];b.spin=spin?-26:0;b.heat=spin?(v>19.5?1:.55):0;
    if(!spin){b.float=1+.3*q;b.wob=rand(0,6);}
    S.shot={q,v,spin};S.fastest=Math.max(S.fastest,C.kmh(v));C.pose(m,"swing",45);X.K.sfx(spin?"kill":"set");C.speedPop(X,cam,hx,hy,v,q>.8?acc():"#fff");F.hit(spin?.25+q*.3:.15);if(q>.8)F.freeze(.05);
    /* the passers read it: a float fools them at first */
    const L=C.land(b);const lx=L?L.x:t;const sharp=1+Math.min(.35,S.serves*.012);S.sharp=sharp;S.rec.forEach(p=>{p.react=(spin?.26:.2)/Math.sqrt(X.mod.k)/sharp+rand(0,.06);p.go=(spin?lx:lx+rand(-1.3,1.3))+.42;p.fooled=!spin;});
    const near=[...S.rec].sort((a,c)=>Math.abs(a.go-a.x)-Math.abs(c.go-c.x));near[1].go=lerp(near[1].home,near[1].go,.2);S.lx=lx;}
  function fault(S,X,txt,sub){if(S.res)return;S.res={err:true};S.lives--;S.errors++;S.streak=0;S.phase="end";S.end=1.2;X.K.sfx("miss");X.F.hit(.3);X.F.flashOn(.25,"255,60,60");X.F.pop(W/2,H*.32,txt,{col:"#ff6b6b",size:40,sub});if(S.lives<=0)S.endT=.9;}
  function ace(S,X,x){const F=X.F,p=S.rec,ds=p.map(r=>Math.abs(r.x-.42-x)).sort((a,c)=>a-c),between=x>Math.min(p[0].x,p[1].x)-.42&&x<Math.max(p[0].x,p[1].x)-.42;
    let pts=3,txt="ACE!";const sub=[];if(between&&ds[1]<1.9){pts++;txt="SEAM ACE!";S.seams++;}
    const z=ZN.findIndex(([a,c])=>x>=a&&x<c);if(z===S.target){pts*=2;sub.push(ZN[z][2]+" target ×2");}if(S.pressure){pts*=2;sub.push("set point ×2");}
    S.aces++;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);S.score+=pts;S.res={pts};S.hype=1;F.hit(.6);F.flashOn(.3,accRgb());X.K.sfx("kill");C.dust(X,cam,x,22,[acc(),"#fff","#e9c9a0"]);
    F.pop(cam.X(x),cam.DY(.5)-70,`${txt} +${pts}`,{col:acc(),size:44,sub:sub.join(" · ")});S.phase="end";S.end=1.3;C.pose(S.me,"celebrate",10);}
  function control(S,X,dt){const P=S.pad,m=S.me;C.tick(P,dt);const dir=C.dir(P);
    if(C.take(P,"kind",.2)&&S.phase==="ready"){S.kind=S.kind==="spin"?"float":"spin";X.K.sfx("tick");}
    if(S.phase==="ready"){C.run(m,dir,dt,{max:2.6,acc:20});if(!dir)m.vx=damp(m.vx,0,12,dt);m.f=1;if(P.h.up)S.aim=clamp(S.aim+dt*.75,0,1);if(P.h.down)S.aim=clamp(S.aim-dt*.75,0,1);
      S.home=m.x;C.pose(m,Math.abs(m.vx)>.3?"ready":"stand",10);if(C.take(P,"serve",.12))toss(S,X);return;}
    if(!m.air&&(S.hit||S.phase==="end"))m.vx=damp(m.vx,0,9,dt);
    if(S.phase==="toss"&&S.kind==="spin"){S.pt+=dt;
      if(!m.air){/* the approach: two quick steps toward the ball */if(S.pt>.35){m.vx=damp(m.vx,2.4+dir*.9,10,dt);C.pose(m,"ready",12);}if(S.pt>.12&&C.take(P,"serve",.12)){C.jump(m,MJV,.55);S.jumpX=m.x;C.pose(m,"rise",24);X.K.sfx("jump");}}
      else if(!m.swung&&C.take(P,"serve",.1)){m.swung=true;S.sw={t:0,min:9};C.pose(m,"cock",40);}}
    if(S.phase==="toss"&&S.kind==="float"){S.pt+=dt;if(!m.air&&S.pt>.18){C.jump(m,4.3,.4);S.jumpX=m.x;m.vx=.6;C.pose(m,"cock",14);}
      if(S.held&&!P.h.serve&&S.pt>.08){S.held=false;if(!m.swung){m.swung=true;S.sw={t:0,min:9};C.pose(m,"swing",40);}}}
    if(S.sw&&!S.hit){const sw=S.sw;sw.t+=dt;if(S.kind==="spin"&&sw.t>.05)C.pose(m,"swing",40);const [cx,cy]=cpOf(m),d=Math.hypot(S.ball.x-cx,S.ball.y-cy);
      if(sw.t<=.17){if(d<R){if(d>sw.min+.003)strike(S,X,sw.min);else sw.min=d;}else if(sw.min<R)strike(S,X,sw.min);if(!S.hit&&sw.t>.16&&sw.min<R)strike(S,X,sw.min);}
      if(!S.hit&&sw.t>.2){S.sw=null;fault(S,X,"WHIFF",S.kind==="float"?"Let go of the button as the ball reaches your hand":"Swing as the ball reaches your hand: jump a little later");}}
    if(S.phase==="toss"&&!S.hit&&S.ball.y<.8&&S.ball.vy<0)fault(S,X,"DROPPED THE TOSS",S.kind==="spin"?"Tap again to jump, and again to hit":"Hold the button, let go to hit");}
  function step(S,X,dt){const b=S.ball,F=X.F;control(S,X,dt);if(C.physics(S.me,dt,{min:-12.4,max:-1})){C.pose(S.me,"low",12);C.dust(X,cam,S.me.x,6);}
    holdBall(S);const ev=C.stepBall(b,dt);
    S.rec.forEach(p=>{if(p.dive>0){p.dive+=dt;p.vx=damp(p.vx,0,3,dt);p.x+=p.vx*dt;p.rot=damp(p.rot,1.3,16,dt);if(p.dive>.95){p.dive=0;p.rot=0;C.pose(p,"ready",8);}return;}
      if(S.phase==="fly"&&p.go!=null&&b.t>p.react){/* a float wobbles: they find the real line late */if(p.fooled&&b.t>p.react+.25){p.fooled=false;p.go=lerp(p.go,S.lx+.42,.8);}
        C.goTo(p,p.go,4.1*Math.sqrt(X.mod.k)*(S.sharp||1),dt,-1);p.x+=p.vx*dt;
        if(!S.res&&b.x>0&&b.vy<0){const tl=C.timeToY(b,.35),lx=tl!=null?b.x+b.vx*tl:b.x,gap=lx-(p.x-.42);if(tl!=null&&tl<.24&&Math.abs(gap)>.5&&Math.abs(gap)<1.5){p.dive=.01;p.f=gap<0?-1:1;p.vx=Math.sign(gap)*6.5;C.pose(p,"dive",22);}}}
      else if(S.phase!=="fly"){C.goTo(p,p.home,2,dt,-1);p.x+=p.vx*dt;}});
    if(S.phase==="fly"&&!S.res&&b.x>.3&&b.vy<0&&b.y<1.3){for(const p of S.rec){if(canPlay(p,b.x)&&b.y>.08){
        const hard=S.shot.spin&&S.shot.v>19.8,fl=!S.shot.spin&&Math.abs(b.x-(p.x-.42))>.35;b.netDone=true;b.dip=0;b.float=0;
        if(hard||fl||p.dive>0){const pts=(p.dive>0?1:2)*(S.pressure?2:1);S.tough++;S.score+=pts;S.streak=0;b.vx=rand(-2,5);b.vy=rand(3,5);b.spin=20;b.live=false;S.res={pts};S.phase="end";S.end=1.1;
          X.K.sfx("dig");F.pop(cam.X(b.x),cam.Y(b.y)-50,`TOUGH SERVE +${pts}`,{col:"#fff",size:32,sub:hard?"Too hot to pass":fl?"The float fooled them":"They had to dive"});}
        else{b.vx=rand(-2.5,-1.2);b.vy=rand(4.5,5.5);b.live=false;S.res={pts:0};S.streak=0;S.phase="end";S.end=1;C.pose(p,"dig",40);X.K.sfx("dig");F.pop(cam.X(b.x),cam.Y(b.y)-50,"PASSED",{col:"#cfc8bd",size:28,sub:"Find the gap between them, or the corners"});}
        break;}}}
    ev.forEach(e=>{if(S.phase!=="fly"||S.res)return;if(e.k==="net")fault(S,X,"INTO THE NET","Contact higher, or aim deeper");
      if(e.k==="floor"){if(e.x<=0)fault(S,X,"INTO THE NET","Contact higher, or aim deeper");else if(e.x>C.HALF)fault(S,X,"LONG!","Aim shorter or contact the ball cleaner");else ace(S,X,e.x);}});
    if(S.phase==="toss"||S.phase==="fly"){[S.mates[0],S.mates[1]].forEach(p=>C.pose(p,"ready",8));}}
  function update(S,dt,X,raw){S.hype=Math.max(0,S.hype-raw*.6);if(S.endT!=null){S.endT-=raw;if(S.endT<=0){X.finish();return;}}
    sub(dt,h=>step(S,X,h));[S.me,...S.mates,...S.rec,S.opset].forEach(p=>C.animate(p,dt));
    if(S.phase==="end"&&S.endT==null){S.end-=dt;if(S.end<.8&&!S.me.air){C.goTo(S.me,S.home,6,dt,1);C.pose(S.me,"ready",10);}if(S.end<=0)newServe(S,X);}
    if(X.challenge&&X.challenge.rule==="aces"&&S.aces>=X.challenge.n)X.finish();}
  function draw(g,S,X){C.drawGym(g,cam,acc(),S?S.hype:0,X.F.t);if(!S){C.drawNet(g,cam);return;}
    const b=S.ball;const [z0,z1]=ZN[S.target];C.floorZone(g,cam,z0,z1,accRgb(),.16+.08*Math.sin(X.F.t*5));
    D.small(g,ZN[S.target][2]+" TARGET",cam.DX((z0+z1)/2,.05),cam.DY(.05)-6,11,acc(),"center");
    /* passers' reach on Rookie and Varsity */
    if(X.mod.win>=1&&S.phase!=="end")S.rec.forEach(p=>C.floorZone(g,cam,p.x-.42-.56,p.x-.42+.56,"120,200,255",.1));
    /* the serving line, and your aim */
    g.strokeStyle="rgba(255,255,255,.18)";g.setLineDash([4,6]);g.beginPath();g.moveTo(cam.DX(-C.HALF,.5),cam.DY(.1));g.lineTo(cam.DX(-C.HALF,.5),cam.DY(.9));g.stroke();g.setLineDash([]);
    if(S.phase==="ready"||(S.phase==="toss"&&!S.hit)){const sp=S.kind==="spin",p0=[S.home+(sp?2.1:.75),sp?3.0:2.7],t=tx(S.aim),key=[S.kind,S.aim.toFixed(3),S.home.toFixed(2)].join();
      if(S.pv!==key){S.pv=key;const gg=sp?C.G+DIP:C.G,v=speedFor(p0,t,sp,1);S.pvv=[C.solve(p0,[t,C.BR],v,false,gg)||C.throwT(p0,[t,C.BR],1,gg),gg,v];}
      const [vv,gg,pvv]=S.pvv,show=X.mod.win>1?1:X.mod.win>=1?.55:.22;g.fillStyle="rgba(255,255,255,.75)";const T=(t-p0[0])/vv[0];for(let i=1;i<=24*show;i++){const tt=T*i/24,x=p0[0]+vv[0]*tt,y=p0[1]+vv[1]*tt-.5*gg*tt*tt;g.globalAlpha=.85-i/30;g.beginPath();g.arc(cam.X(x),cam.Y(y),2.6,0,TAU);g.fill();}g.globalAlpha=1;
      if(S.phase==="ready")D.small(g,`${C.kmh(pvv)} km/h at best`,cam.X(p0[0])+10,cam.Y(p0[1])-18,11,"rgba(255,255,255,.7)");
      if(show===1){const x=cam.X(t),y=cam.DY(.5);g.strokeStyle="#fff";g.lineWidth=2;g.beginPath();g.ellipse(x,y,16,5,0,0,TAU);g.stroke();}}
    S.rec.slice().reverse().forEach(p=>C.drawAthlete(g,cam,p));C.drawAthlete(g,cam,S.opset);C.drawNet(g,cam);S.mates.forEach(p=>C.drawAthlete(g,cam,p));C.drawAthlete(g,cam,S.me);
    if(!b.held)C.drawShadow(g,cam,b.x,b.y);C.drawBall(g,cam,b,acc());
    if(S.pressure&&S.phase!=="end")D.text(g,"SET POINT · DOUBLE POINTS",W/2,92,24,"#fff","center",800,true);}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`${S.kind==="spin"?"JUMP SPIN":"JUMP FLOAT"} · ${X.mod.label.toUpperCase()}`});
    if(S.phase==="ready"){D.small(g,S.kind==="spin"?"Tap: toss · tap: jump · tap: hit":"Hold: toss and jump · let go: hit",W/2,62,13,"rgba(255,255,255,.85)","center");}
    const rd=S.phase==="ready",sp=S.kind==="spin";
    C.layout(S.pad,W,H,[{a:"kind",label:sp?"SPIN":"FLOAT",sub:"S",dim:!rd},{a:"up",label:"▲",sub:"↑ aim",lift:.95,dim:!rd},{a:"down",label:"▼",sub:"↓ aim",dim:!rd},{a:"serve",label:rd?"SERVE":S.me.air?(sp?"HIT":"LET GO"):(sp?"JUMP":"HOLD"),sub:"Space",big:true,hot:S.phase==="toss"&&!S.hit}]);C.drawPad(g,S.pad,X.F.t);}
  function bot(S,X){const P=S.pad,m=S.me,b=S.ball;P.h.left=P.h.right=P.h.up=P.h.down=false;
    if(S.phase==="ready"){if(S.kind!=="spin"&&Math.random()<.5){P.p.kind=0;return;}let best=.5,bd=-1;for(let a=0;a<=1;a+=.05){const x=tx(a),d=Math.min(...S.rec.map(p=>Math.abs(p.x-.42-x)));if(d>bd){bd=d;best=a;}}
      best=clamp(best+(S.bn?S.bn.a:0),0,1);if(Math.abs(S.aim-best)>.03)(S.aim<best?P.h.up=true:P.h.down=true);else P.p.serve=0;return;}
    const n=A.botNoise||0;if(S.bnS!==S.serves){S.bnS=S.serves;S.bn={t:rand(-.08,.08)*n,a:rand(-.12,.12)*n};}
    if(S.phase==="toss"&&S.kind==="spin"){if(!m.air){const t=C.timeToY(b,3.0);if(t!=null&&t<MJT+.02+S.bn.t)P.p.serve=0;}
      else if(!m.swung){const [cx,cy]=cpOf(m);if(Math.hypot(b.x-cx,b.y-cy)<.75)P.p.serve=0;}}
    if(S.phase==="toss"&&S.kind==="float"){P.h.serve=S.pt<.5;}}
  A.add("serve",C.wire({title:"Jump Serve",tag:"Toss. Jump. Hit. Find the gap.",unit:"points",W,H,aria:"Arrow keys to move and aim, space to toss, jump and hit, S to switch serve.",
    controls:"<b>← →</b> starting spot · <b>↑ ↓</b> aim · <b>Space</b> toss, jump, hit (float: hold, then let go) · <b>S</b> spin or float",
    desc:"Pick your spot and your aim, then <b>toss</b>, <b>jump</b> and <b>hit</b> a jump spin, or hold and let go for a jump float that wobbles. Their two passers move to your serve: land it where they can't get to it.",
    how:["Before the toss: ← → picks your starting spot (you take off from behind the end line: start too close and it's a <b>foot fault</b>). ↑ ↓ aims short or deep: the dotted line shows the flight (all of it on Rookie, part of it on Varsity, just the start on National).",
      "<b>Jump spin</b> (tap, tap, tap): toss, you take two steps, tap to jump, tap to hit as the ball reaches your hand. Clean contact is fast and goes where you aimed; a poor one sprays. Contact too low and it goes into the net.",
      "<b>Jump float</b> (S to switch): hold Space to toss and jump, let go as the ball reaches your hand. It's slower, but it wobbles: the passers misjudge it at first.",
      "Ace (lands untouched): 3. Between the two passers: <b>seam ace</b>, 4. On the lit target zone: double. A serve they can only pass by diving, or too hot to handle: <b>tough serve</b>, 1 or 2. Every 6th serve is set point: double points.",
      "Three errors (net, long, foot fault, a dropped toss or a whiff) and it's over."],
    daily:[{text:"Hit 6 aces",rule:"aces",n:6,f:45,ok:S=>S.aces>=6},{text:"Score 30 points",rule:"score",n:30,f:45,ok:S=>S.score>=30},{text:"4 aces on National",mode:"national",rule:"aces",n:4,f:60,ok:S=>S.aces>=4}],
    bestOf:c=>c.best.serve,saveBest:(c,v)=>{if(v>c.best.serve)c.best.serve=v;},
    start,update,draw,hud,bot,
    tap(S,x,y){if(S.kind==="spin"||S.phase!=="ready")S.pad.p.serve=0;},
    result(S){const sc=Math.round(S.score);return {best:sc,head:`${sc} points`,sub:`${S.aces} aces from ${S.serves} serves`,fe:Math.floor(sc/2)+S.aces*2,
      stats:[["Aces",S.aces],["Seam aces",S.seams],["Tough serves",S.tough],["Best ace run",S.bestStreak],["Fastest",`${S.fastest} km/h`],["Errors",S.errors]],
      tip:S.errors>=3&&S.aces<2?"Jump a little later: hit the ball at the top of your jump, just in front of you.":S.aces<S.tough?"Aim for the gap: the short corner in front of the first passer, the seam between them, or deep behind the second.":"",count:[["seams",S.seams]],legacy:c=>{c.aces+=S.aces;}};}}));
})();

/* =====================================================================================================
   BLOCK PARTY (seen from behind your blocker)
   ===================================================================================================== */
(function(){
  const W=960,H=560,NETY=318,cp=(u,v)=>{const y=NETY-200*v,hw=300-120*v;return [480+(u-.5)*2*hw,y,1-.5*v];};
  /* a point on their side (u across, v deep, h metres up) on screen */
  const sp=(u,v,h)=>{const P=cp(u,v);return [P[0],P[1]-h*58*P[2],P[2]];};
  const LANES={out:{u:.12,label:"OUTSIDE",T:1.05},mid:{u:.5,label:"QUICK",T:.48},opp:{u:.88,label:"OPPOSITE",T:.88},pipe:{u:.5,label:"PIPE",T:.95,back:true},dump:{u:.62,label:"DUMP",T:.32}};
  const MAP={ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"," ":"jump",z:"jump",j:"jump",ArrowUp:"jump",w:"jump",k:"jump",x:"jump"};
  const REACH=2.3,BW=.07;let back=null;
  function start(S,X){S.pad=C.pad(MAP);S.lives=3;S.stuffs=0;S.touches=0;S.missed=0;S.streak=0;S.bestStreak=0;S.rally=0;S.hype=0;S.digs=0;
    S.me={u:.5,vu:0,y:0,vy:0,air:false,goal:null,land:0};newRally(S,X);}
  function newRally(S,X){S.rally++;const lv=S.rally,c=X.challenge&&X.challenge.rule;const opts=["out","out","mid","opp","opp"];if(lv>6)opts.push("pipe");if(lv>8&&Math.random()<.14)opts.push("dump","dump");
    const to=c==="quick"?"mid":pick(opts);S.to=to;S.decoy=lv>3&&to!=="mid";S.jumpSet=lv>8&&Math.random()<.45||to==="dump";
    const k=X.mod.k*(1+Math.min(.3,lv*.012));S.k=k;S.tP=.8/Math.sqrt(k);S.T=LANES[to].T/k;S.tC=S.tP+S.T;S.rt0=0;S.phase="pass";S.res=null;S.ball={u:.45,v:.8,h:.8,vis:true};
    S.tell=Math.random()<(X.mod.win>=1?.8:.55);S.hit={};["out","mid","opp","pipe"].forEach(k2=>S.hit[k2]={t:-9});S.setterJump=S.jumpSet?S.tP-.3:99;S.flight=null;}
  /* your hands above the tape (metres) */
  const over=S=>S.me.air?REACH+S.me.y-C.NET:-1;
  function resolve(S,X){const L=LANES[S.to],m=S.me,d=Math.abs(m.u-L.u),ov=over(S),falling=m.vy<-1.6,F=X.F,P=sp(L.u,L.back?.36:.06,3.1);
    let txt,pts=0,sub="",kind;const need=L.back?.46:.38;
    if(m.air&&ov>.08&&d<=BW*.85){if(falling&&ov<.3){kind="tip";txt="TIPPED OVER YOU";sub="You jumped early: they waited and tipped";}
      else if(ov>=need){kind="stuff";txt=S.to==="dump"?"STUFFED THE DUMP!":"STUFF BLOCK!";pts=3;sub=L.back?"Even the pipe":"Monster block";}
      else{kind="touch";txt="TOUCH";pts=1;sub="Soft block: your defence plays it. Hold jump to reach higher";}}
    else if(m.air&&ov>.08&&d<=BW*1.7){if(ov>=need&&d<=BW*1.25){kind="touch";txt="TOUCH";pts=1;sub="Half on: close the gap for a stuff";}else{kind="tool";txt="TOOLED";sub="They hit off your outside hand: get right in front";}}
    else{kind="kill";txt=!m.air?(d<BW*1.5?"NO JUMP":"WRONG SPOT"):ov<=.08?(m.vy>0?"TOO LATE":"TOO EARLY"):"WRONG SPOT";sub=txt==="WRONG SPOT"?`The set went ${L.label.toLowerCase()}`:txt==="NO JUMP"?"Jump as the hitter jumps":txt==="TOO LATE"?"Jump a little sooner":"You came down before the hit";}
    const shot=X.mod.win>1?.35:.25;if((kind==="kill"||kind==="tool")&&Math.random()<shot){kind="dug";pts=0;txt="DUG BY YOUR LIBERO";sub="Lucky! "+sub;}
    S.res={txt,pts,sub,kind,P,lane:L};S.phase="result";S.rt=0;
    if(pts>0){S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);const mult=1+Math.min(1.5,Math.floor(S.streak/4)*.5),add=pts*mult;S.score+=add;S.res.add=add;
      if(kind==="stuff"){S.stuffs++;X.K.sfx("block");F.hit(.9);F.freeze(.09);F.slowmo(.4,.3);F.flashOn(.35,accRgb());F.burst(P[0],P[1]+40,36,{col:[acc(),"#fff"],speed:540,up:220,size:6,shape:"spark"});F.ring(P[0],P[1]+40,accRgb(),100,8);S.hype=1;}
      else{S.touches++;X.K.sfx("dig");F.hit(.3);}}
    else if(kind==="dug"){S.streak=0;S.digs++;X.K.sfx("dig");}
    else{S.lives--;S.streak=0;S.missed++;F.hit(.4);F.flashOn(.25,"255,60,60");X.K.sfx("drop");if(S.lives<=0)S.endT=1;}
    F.pop(P[0],P[1]-70,txt+(S.res.add?` +${Math.round(S.res.add)}`:""),{col:pts>=3?acc():pts?"#fff":kind==="dug"?"#cfc8bd":"#ff6b6b",size:pts>=3?48:32,sub});
    /* where the ball goes */
    const side=m.u<L.u?1:-1;S.flight={kind,from:[L.u,L.back?.36:.06,3.1],t:0,side};}
  function step(S,X,dt){const P=S.pad,m=S.me;C.tick(P,dt);S.rt0+=dt;
    /* you: shuffle, then a jump that goes higher the longer you hold */
    let dir=C.dir(P);if(!dir&&m.goal!=null){const dd=m.goal-m.u;dir=Math.abs(dd)<.01?0:clamp(dd*10,-1,1);if(!dir)m.goal=null;}else if(dir)m.goal=null;
    const max=.76*Math.sqrt(X.mod.k);if(!m.air){m.vu=damp(m.vu,dir*max,12,dt);}else m.vu=damp(m.vu,0,6,dt);m.u=clamp(m.u+m.vu*dt,.05,.95);
    if(m.land>0)m.land-=dt;
    if(!m.air&&m.land<=0&&C.take(P,"jump",.14)&&S.phase!=="result"){m.air=true;m.vy=3.9;X.K.sfx("jump");}
    if(m.air){m.vy-=(P.h.jump&&m.vy>0?9.4:17)*dt;m.y+=m.vy*dt;if(m.y<=0){m.y=0;m.air=false;m.land=.12;X.K.sfx("thud");}}
    if(S.phase==="pass"&&S.rt0>=S.tP){S.phase="set";X.K.sfx("set");if(S.to==="mid"||S.decoy)S.hit.mid.t=0;}
    if(S.phase==="set"){Object.values(S.hit).forEach(h=>{if(h.t>-9)h.t+=dt;});const hk=S.hit[S.to];if(hk&&hk.t<=-9&&S.rt0>S.tC-.5)hk.t=0;if(S.rt0>=S.tC)resolve(S,X);}
    else if(S.phase==="result"){S.rt+=dt;Object.values(S.hit).forEach(h=>{if(h.t>-9)h.t+=dt;});if(S.flight)S.flight.t+=dt;if(S.rt>1.2&&S.endT==null)newRally(S,X);}
    if(X.challenge&&X.challenge.rule==="stuffs"&&S.stuffs>=X.challenge.n)X.finish();}
  function update(S,dt,X,raw){S.hype=Math.max(0,S.hype-raw*.5);if(S.endT!=null){S.endT-=raw;if(S.endT<=0){X.finish();return;}}sub(dt,h=>step(S,X,h));}
  /* the ball: pass, set, then wherever the attack went */
  function ballPos(S){const tp=S.tP,setter=[.62,.06,2.45];
    if(S.phase==="pass"){const k=clamp(S.rt0/tp,0,1);return [lerp(.45,setter[0],k),lerp(.75,setter[1],k),lerp(.8,setter[2],k)+Math.sin(Math.PI*k)*2.2];}
    const L=LANES[S.to],E=[L.u,L.back?.36:.06,3.1];
    if(S.phase==="set"){const k=clamp((S.rt0-tp)/S.T,0,1),arc=S.to==="mid"?.5:S.to==="dump"?.25:2.4;return [lerp(setter[0],E[0],k),lerp(setter[1],E[1],k),lerp(setter[2],E[2],k)+Math.sin(Math.PI*k)*arc];}
    const f=S.flight;if(!f)return E;const k=clamp(f.t/.45,0,1);
    if(f.kind==="stuff")return [E[0],lerp(E[1],.22,k),Math.max(.1,E[2]-k*k*3.2)];
    if(f.kind==="touch"||f.kind==="dug")return [lerp(E[0],.5,k),lerp(E[1],-.35,k),E[2]+Math.sin(Math.PI*k)*1.6];
    if(f.kind==="tool")return [E[0]+f.side*k*.9,lerp(E[1],-.6,k),E[2]+k*1.2];
    if(f.kind==="tip")return [lerp(E[0],S.me.u,k),lerp(E[1],-.25,k),E[2]+Math.sin(Math.PI*k)*.8-k*1.6];
    return [lerp(E[0],E[0]+f.side*.25,k),lerp(E[1],-.9,k),lerp(E[2],.1,k)];}
  /* our side (v < 0) projects toward the camera */
  const spAny=(u,v,h)=>{if(v>=0)return sp(u,v,h);const k=-v,y=lerp(NETY,H+40,k),hw=lerp(300,520,k),s=lerp(1,1.9,k);return [480+(u-.5)*2*hw,y-h*58*s,s];};
  function draw(g,S,X){if(!back)back=D.arena(W,H,NETY-170,acc());g.drawImage(back,0,0,W,H);D.crowd(g,W,NETY-170,X.F.t,S?S.hype:0,acc());
    const fl=g.createLinearGradient(0,NETY-210,0,H);fl.addColorStop(0,"#4a220b");fl.addColorStop(1,"#c0611f");g.fillStyle=fl;const a=cp(-.3,1.1),b2=cp(1.3,1.1);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b2[0],b2[1]);g.lineTo(W+80,H);g.lineTo(-80,H);g.closePath();g.fill();
    g.strokeStyle="#f4efe6";g.lineWidth=3;g.beginPath();[cp(0,0),cp(1,0),cp(1,1),cp(0,1)].forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();const m1=cp(0,1/3),m2=cp(1,1/3);g.lineWidth=2;g.beginPath();g.moveTo(m1[0],m1[1]);g.lineTo(m2[0],m2[1]);g.stroke();
    if(!S){return;}
    /* their team: passer, setter, hitters (each runs in, jumps and swings) */
    const people=[],setterP=cp(.62,.06),sj=S.rt0>S.setterJump&&S.rt0<S.setterJump+.6?Math.sin(clamp((S.rt0-S.setterJump)/.6,0,1)*Math.PI)*46:0;
    const tellBack=S.phase==="pass"&&S.tell&&S.to==="opp"&&S.rt0>S.tP*.5,tellQuick=S.phase==="pass"&&S.tell&&S.to==="mid"&&S.rt0>S.tP*.55,oneHand=S.to==="dump"&&S.rt0>S.tP-.25;
    people.push({P:setterP,up:sj,o:{col:"#e8ecf2",col2:"#b9c3d2",numCol:"#1f3b73",a1:oneHand?.3:Math.PI*.92,a2:Math.PI*.92,e1:-.4,e2:-.4,lean:tellBack?.28:tellQuick?-.1:0,num:"9",skin:"#c99673"}});
    Object.entries(LANES).forEach(([k,L])=>{if(k==="dump"||(k==="pipe"&&S.rally<=6))return;const h=S.hit[k],base=cp(L.u,L.back?.46:.34),hp=cp(L.u,L.back?.36:.08);let P=base,up=0,a2=-.4;
      if(h.t>-9){const run=clamp(h.t/.3,0,1);P=[lerp(base[0],hp[0],ease.inOut(run)),lerp(base[1],hp[1],ease.inOut(run)),lerp(base[2],hp[2],run)];const air=clamp((h.t-.28)/.62,0,1);up=Math.sin(air*Math.PI)*52;a2=lerp(-.5,Math.PI*.95,clamp((h.t-.22)/.15,0,1));if(h.t>.5)a2=lerp(Math.PI*.95,.4,clamp((h.t-.5)/.1,0,1));}
      people.push({P,up,o:{col:"#e8ecf2",col2:"#b9c3d2",numCol:"#1f3b73",a1:.4,a2,num:{out:"11",mid:"2",opp:"4",pipe:"8"}[k],crouch:h.t<=-9?.4:0,skin:"#c99673"}});});
    people.push({P:cp(.45,.75),o:{col:"#1f3b73",col2:"#16294f",numCol:"#e8ecf2",crouch:.8,a1:-1.2,a2:-1.2,num:"L",skin:"#c99673"}});
    people.sort((p,q)=>p.P[1]-q.P[1]).forEach(p=>{D.shadow(g,p.P[0],p.P[1]+2,20*p.P[2],.35);D.player(g,Object.assign({x:p.P[0],y:p.P[1]-(p.up||0),s:p.P[2]*1.05},p.o));});
    /* the ball on their side: drawn before the net */
    const bp=ballPos(S),onTheirs=bp[1]>=0,B=spAny(bp[0],bp[1],bp[2]),Fl=spAny(bp[0],bp[1],0);
    const drawB=()=>{D.shadow(g,Fl[0],Fl[1],12*B[2],.35);D.ball(g,B[0],B[1],12.5*B[2],X.F.t*10,acc());};if(onTheirs)drawB();
    /* the net */
    g.fillStyle="rgba(255,255,255,.06)";g.fillRect(150,NETY-96,660,96);g.strokeStyle="rgba(255,255,255,.2)";g.lineWidth=1;for(let x=150;x<=810;x+=11){g.beginPath();g.moveTo(x,NETY-96);g.lineTo(x,NETY);g.stroke();}for(let y=NETY-96;y<=NETY;y+=11){g.beginPath();g.moveTo(150,y);g.lineTo(810,y);g.stroke();}
    g.fillStyle="#f4efe6";g.fillRect(150,NETY-100,660,8);g.fillStyle="#2a2730";g.fillRect(136,NETY-112,11,200);g.fillRect(813,NETY-112,11,200);for(let k=0;k<6;k++){g.fillStyle=k%2?"#f4efe6":"#e0442b";g.fillRect(150,NETY-150+k*9,4,9);g.fillRect(806,NETY-150+k*9,4,9);}
    /* you: from behind, hands up over the tape when you're high enough */
    const m=S.me,x=480+(m.u-.5)*600,lift=m.y*150,ov=over(S),y=H-14-lift;
    if(ov>0){const hw=BW*600,a=clamp(ov/.5,0,1);g.fillStyle=`rgba(${accRgb()},${.12+.22*a})`;D.round(g,x-hw,NETY-104-ov*90,hw*2,ov*90+8,8);g.fill();}
    D.shadow(g,x,H-8,52,.45);const j=clamp(m.y/.7,0,1);D.player(g,{x,y,s:2.05,col:acc(),num:me().num||"",a1:-Math.PI*(.78+j*.2),a2:Math.PI*(.78+j*.2),e1:.35*(1-j),e2:-.35*(1-j),crouch:m.air?0:m.land>0?.6:.35});
    /* the jump meter: how high your hands are */
    if(m.air){const bx=x+70,by=H-150;D.glass(g,bx,by,16,110,.6);g.fillStyle=ov>=.38?acc():ov>.08?"#fff":"rgba(255,255,255,.3)";const k=clamp((ov+.1)/.7,0,1);g.fillRect(bx+3,by+107-k*104,10,k*104);g.fillStyle="rgba(255,255,255,.5)";g.fillRect(bx-2,by+107-(.48/.7)*104,20,2);}
    if(!onTheirs)drawB();
    /* lane marks */
    ["out","mid","opp"].forEach(k=>{const lx=480+(LANES[k].u-.5)*600;g.fillStyle="rgba(255,255,255,.12)";g.fillRect(lx-1,H-30,2,22);});}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`RALLY ${S.rally} · ${X.mod.label.toUpperCase()}`});
    if(S.phase==="pass"&&X.mod.win>=1&&S.rt0>S.tP*.45){const t=S.to==="dump"?"The setter is jumping… one hand?":S.tell&&S.to==="opp"?"The setter is arching back…":S.tell&&S.to==="mid"?"Low, quick hands…":S.jumpSet?"A jump set…":"";if(t)D.small(g,t,W/2,92,14,"rgba(255,255,255,.88)","center");}
    C.layout(S.pad,W,H,[{a:"jump",label:"JUMP",sub:"hold: higher",big:true,hot:S.phase==="set"}]);C.drawPad(g,S.pad,X.F.t);}
  function bot(S,X){const P=S.pad,m=S.me;P.h.left=P.h.right=false;if(S.phase==="result")return;const n=A.botNoise||0;if(S.bnR!==S.rally){S.bnR=S.rally;S.bn={r:rand(.05,.25)*n,t:rand(-.1,.1)*n,h:Math.random()<.25*n};}
    const L=S.phase==="set"&&S.rt0-S.tP>S.bn.r?LANES[S.to]:LANES.mid;const d=L.u-m.u;if(Math.abs(d)>.015&&!m.air)(d<0?P.h.left=true:P.h.right=true);
    if(S.phase==="set"&&!m.air&&S.rt0>=S.tC-.42+S.bn.t&&S.rt0<S.tC-.2+S.bn.t){P.p.jump=0;P.h.jump=!S.bn.h;}if(m.air&&m.vy<0)P.h.jump=false;}
  A.add("block",C.wire({title:"Block Party",tag:"Read the setter. Close the net. Stuff it.",unit:"points",W,H,aria:"Arrow keys move along the net, space jumps (hold for higher).",
    controls:"<b>← →</b> shuffle along the net · <b>Space</b> jump, <b>hold</b> to jump higher · touch: tap the floor to move, JUMP to jump",
    desc:"You're the middle blocker. Read where the setter is going, shuffle along the net and jump with the hitter. <b>Hold</b> jump to get your hands higher over the tape. From rally 4 the quick hitter is a <b>decoy</b> on some sets.",
    how:["Move with ← → (or tap the floor under the net). Jump with <b>Space</b>: a tap is a short hop, <b>holding</b> it takes your hands much higher over the tape. You can't move once you're in the air.",
      "Be in front of the hitter's arm when he hits, with your hands well over the tape: <b>stuff block</b> (+3). A low block or half in front of him is a <b>touch</b> (+1) your defence can play.",
      "Half-on with your hands low and he <b>tools</b> it off your outside hand. Jump too early and he waits and <b>tips</b> over you. Wrong spot, no jump or too late: they score and you lose a life (sometimes your libero saves you).",
      "Read the setter: arching back means a back set to the opposite; low, quick hands mean the quick. From rally 7 the pipe (back row) joins in, and later the setter can <b>dump</b> it on two: watch for one hand.",
      "The quick hitter always runs: only jump with him if the ball goes to him. Every 4 in a row raises your multiplier."],
    daily:[{text:"Get 5 stuff blocks",rule:"stuffs",n:5,f:50,ok:S=>S.stuffs>=5},{text:"Score 30 points",rule:"score",n:30,f:45,ok:S=>S.score>=30},{text:"Quicks only: 4 stuffs",rule:"quick",n:4,f:50,ok:S=>S.stuffs>=4}],
    bestOf:c=>c.best.block||0,saveBest:(c,v)=>{if(v>(c.best.block||0))c.best.block=v;},
    start,update,draw,hud,bot,
    tap(S,x,y){if(y<NETY){S.pad.p.jump=0;return;}S.me.goal=clamp((x-480)/600+.5,.05,.95);},
    result(S){const sc=Math.round(S.score);return {best:sc,head:`${sc} points`,sub:`${S.stuffs} stuff blocks`,fe:Math.floor(sc/2)+S.stuffs*2,
      stats:[["Stuffs",S.stuffs],["Touches",S.touches],["Best run",S.bestStreak],["Missed",S.missed],["Rallies",S.rally]],
      tip:S.touches>S.stuffs*2?"Hold jump longer to get your hands higher over the tape: touches become stuffs.":S.missed>S.stuffs?"Don't jump with the quick hitter unless the ball goes to him. Watch the setter's hands.":"",count:[["stuffs",S.stuffs],["touches",S.touches]]};}}));
})();

/* =====================================================================================================
   SETTER'S VISION (from above)
   ===================================================================================================== */
(function(){
  const W=960,H=560,PX=52,NET=258,CX=480,X_=u=>CX+(u-.5)*9*PX,Y_=d=>NET+d*PX,TY=d=>NET-d*PX;
  const MAP={ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right",ArrowUp:"up",w:"up",ArrowDown:"down",s:"down","1":"c1","2":"c2","3":"c3","4":"c4","5":"c5",q:"c5",e:"c5"};
  /* our hitters: where they hit (u across, distance off the net) and how long the set takes */
  const HIT={L:{u:.08,d:.6,from:3.4,label:"Outside",key:"1",t:1.0},M:{u:.46,d:.5,from:1.8,label:"Quick",key:"2",t:.45},R:{u:.93,d:.6,from:3.4,label:"Opposite",key:"3",t:.85},P:{u:.5,d:3.4,from:5.2,label:"Pipe",key:"4",t:.9},D:{label:"Dump",key:"5"}};
  const SPEED=.4,REACT=.25,FORMS={base:{n:"Base",p:[.9,.48,.1]},bunch:{n:"Bunched",p:[.7,.5,.3]},overL:{n:"Loaded on your outside",p:[.55,.25,.08]},overR:{n:"Loaded on your opposite",p:[.92,.75,.48]}};
  function start(S,X){S.pad=C.pad(MAP);S.lives=3;S.streak=0;S.bestStreak=0;S.reads=0;S.dumps=0;S.wrong=0;S.rally=0;S.disguised=0;S.jumpsets=0;S.me={u:.62,d:.35,vu:0,vd:0,still:0,goal:null};newRally(S,X);}
  function newRally(S,X){S.rally++;const r=Math.random(),pa=.5-Math.min(.2,S.rally*.006),q=r<pa?"A":r<pa+.32?"B":"C";S.pass=q;S.front=Math.random()<.5;S.phase="pass";S.rt0=0;S.call=null;S.callT=0;S.calls=0;S.res=null;S.anim=null;
    const k=X.mod.k*(1+Math.min(.6,S.rally*.02));S.k=k;S.Tp=1.2/Math.sqrt(k);
    /* where the pass comes down */
    S.L=q==="A"?[.62+rand(-.03,.03),.25+rand(-.05,.05)]:q==="B"?[.62+rand(-.16,.16),.9+rand(-.25,.3)]:[rand(.25,.8),2.2+rand(-.3,.5)];S.P0=[rand(.2,.8),5.1];
    const mbCommit=q!=="C"&&Math.random()<.3,f=pick(["base","base","bunch","overL","overR"]),P=FORMS[f].p;S.form=FORMS[f].n;
    S.B=[{u:.9,to:P[0],id:"LB"},{u:.48,to:mbCommit?.45:P[1],commit:mbCommit,id:"MB",base:mbCommit?.45:P[1]},{u:.1,to:P[2],id:"RB"}];S.B.forEach(b=>{b.to=clamp(b.to+rand(-.03,.03),.04,.96);b.u=lerp(b.u,b.to,.3);});
    S.readF=X.mod.win>1?.3:X.mod.win>=1?.55:.75;}
  const legal=(S,k,bump)=>k==="D"?S.pass==="A"&&S.front&&!bump:bump?k==="L"||k==="R":S.pass==="A"?true:S.pass==="B"?k!=="M":k==="L"||k==="R";
  /* how many blockers get in front of a hitter by the time of the hit */
  function blockersOn(S,k,tempo){if(k==="D"){const su=S.me.u;return S.B.filter(b=>Math.abs(b.u-su)<.1&&!b.commit).length;}
    const h=HIT[k],tt=h.t/S.k*tempo,reachD=Math.max(0,tt-REACT)*SPEED*S.k+.06+(h.d>2?.02:0);
    return S.B.filter(b=>{if(b.commit&&k!=="M")return false;return Math.abs(b.u-h.u)<=reachD;}).length;}
  function call(S,X,k){if(S.phase!=="pass")return;if(S.call!==k){S.call=k;S.callT=S.rt0;S.calls++;X.K.sfx("tick");}}
  /* the ball arrives: set it */
  function contact(S,X){const F=X.F,m=S.me,dist=Math.hypot((m.u-S.L[0])*9,m.d-S.L[1]);S.phase="set";S.rt0=0;
    if(dist>1.25){S.lives--;S.streak=0;S.res={txt:"DROPPED",pts:0,sub:"Get under the pass before it comes down"};X.K.sfx("drop");F.hit(.4);F.flashOn(.25,"255,60,60");pop(S,X);if(S.lives<=0)S.endT=.9;return;}
    const bump=dist>.55,jump=!bump&&m.still>=.25&&S.pass!=="C",late=S.call&&S.rt0>=0&&(S.Tp-S.callT)<=.45;let k=S.call,note=[];
    if(!k){k="L";note.push("No call: a slow ball to the outside");}
    if(!legal(S,k,bump)){if(bump&&k!=="D"){note.push("Bump set: only a high ball outside");k=Math.abs(m.u-HIT.L.u)<Math.abs(m.u-HIT.R.u)?"L":"R";}
      else{S.lives--;S.streak=0;S.wrong++;S.res={txt:"CAN'T RUN THAT",pts:0,sub:k==="D"?"Dump only from a perfect pass, front row, on two":k==="M"?"No quick off a "+S.pass+" pass":"Off a C pass, set high to the outside or opposite"};X.K.sfx("miss");pop(S,X);if(S.lives<=0)S.endT=.9;return;}}
    const tempo=(jump?.85:bump?1.25:1)*(S.call?1:1.2),n=blockersOn(S,k,tempo);let pts,txt,sub;
    if(jump){S.jumpsets++;note.push("Jump set");}if(late&&k!=="D"){note.push("Disguised");}
    if(k==="D"){if(n===0){pts=4;txt="SETTER DUMP!";sub="Nobody was home";S.dumps++;}else{pts=-1;txt="DUMP BLOCKED";sub="Their blocker was right there";}}
    else{const opts=["L","M","R","P"].filter(o=>legal(S,o,bump)),bestN=Math.min(...opts.map(o=>blockersOn(S,o,tempo)));
      if(n===0){pts=3;txt="1 ON 0!";sub="Perfect read: no block";}else if(n===1&&bestN>=1){pts=2;txt="SINGLE BLOCK";sub="The best option on this pass";}
      else if(n===1){pts=1;txt="SINGLE BLOCK";sub="Someone was free: look again";}else{pts=n>=3?-1:0;txt=n===2?"INTO A DOUBLE":"TRIPLE BLOCK";sub=n>=3?"Stuffed: that hitter had no chance":"There was a better hitter";}}
    S.res={txt,pts,sub:[sub,...note].join(" · "),n,k};S.anim={k,t:0,n};
    if(pts>0){S.streak++;S.bestStreak=Math.max(S.streak,S.bestStreak);if(pts>=3)S.reads++;if(late&&k!=="D"){S.disguised++;}const mult=1+Math.min(1,Math.floor(S.streak/6)*.25),add=Math.round((pts+(late&&k!=="D"?1:0)+(jump?1:0))*mult);S.score+=add;S.res.add=add;
      X.K.sfx(pts>=3?"kill":"dig");if(pts>=3){F.flashOn(.25,accRgb());F.hit(.35);}}
    else if(pts<0){S.lives--;S.streak=0;X.K.sfx("block");F.hit(.4);if(S.lives<=0)S.endT=.9;}else{S.streak=0;X.K.sfx("block");}
    pop(S,X);}
  function pop(S,X){const r=S.res;X.F.pop(W/2,NET-90,r.txt+(r.add?` +${r.add}`:""),{col:r.pts>=3?acc():r.pts>0?"#fff":"#ff6b6b",size:r.pts>=3?46:32,sub:r.sub});}
  function step(S,X,dt){const P=S.pad,m=S.me;C.tick(P,dt);S.rt0+=dt;
    ["c1","c2","c3","c4","c5"].forEach((c,i)=>{if(C.take(P,c,.3))call(S,X,["L","M","R","P","D"][i]);});
    /* move: arrow keys, or run to where you tapped */
    let du=(P.h.right?1:0)-(P.h.left?1:0),dd=(P.h.down?1:0)-(P.h.up?1:0);if(!du&&!dd&&m.goal){const gu=(m.goal[0]-m.u)*9,gd=m.goal[1]-m.d,L=Math.hypot(gu,gd);if(L<.08)m.goal=null;else{du=gu/L;dd=gd/L;}}else if(du||dd)m.goal=null;
    const L=Math.hypot(du,dd)||1,sp=4.6;m.vu=damp(m.vu,du/L*sp,14,dt);m.vd=damp(m.vd,dd/L*sp,14,dt);if(S.phase==="pass"){m.u=clamp(m.u+m.vu*dt/9,.05,.95);m.d=clamp(m.d+m.vd*dt,.1,4.2);}
    m.still=Math.hypot(m.vu,m.vd)<.6?m.still+dt:0;
    /* their blockers drift to their spots; the middle reads a call you make too early */
    S.B.forEach(b=>{if(b.id==="MB"&&!b.commit&&S.phase==="pass"){const held=S.call&&S.call!=="D"&&S.rt0-S.callT>.3;b.to=held?lerp(b.base,HIT[S.call].u,S.readF):b.base;b.reading=held;}b.u=damp(b.u,b.to,S.phase==="pass"?3:4,dt);});
    if(S.phase==="pass"&&S.rt0>=S.Tp)contact(S,X);
    else if(S.phase==="set"){if(S.anim)S.anim.t+=dt;if(S.rt0>1.5&&S.endT==null)newRally(S,X);}
    if(X.challenge&&X.challenge.rule==="reads"&&S.reads>=X.challenge.n)X.finish();}
  function update(S,dt,X,raw){if(S.endT!=null){S.endT-=raw;if(S.endT<=0){X.finish();return;}}sub(dt,h=>step(S,X,h));}
  const dot=(g,x,y,r,fill,stroke,lw)=>{g.fillStyle=fill;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||2;g.stroke();}};
  function draw(g,S,X){const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#0b0a0d");bg.addColorStop(1,"#1b1416");g.fillStyle=bg;g.fillRect(0,0,W,H);
    const x0=X_(0),x1=X_(1),top=TY(4),bot=Y_(5.8);const fl=g.createLinearGradient(0,top,0,bot);fl.addColorStop(0,"#6a3010");fl.addColorStop(1,"#b85a1c");g.fillStyle=fl;g.fillRect(x0-34,top,x1-x0+68,bot-top);
    g.fillStyle="rgba(0,0,0,.08)";g.fillRect(x0,TY(3),x1-x0,Y_(3)-TY(3));
    g.strokeStyle="#f4efe6";g.lineWidth=3;g.beginPath();g.moveTo(x0,top);g.lineTo(x0,bot);g.moveTo(x1,top);g.lineTo(x1,bot);g.stroke();g.lineWidth=2;g.beginPath();g.moveTo(x0,TY(3));g.lineTo(x1,TY(3));g.moveTo(x0,Y_(3));g.lineTo(x1,Y_(3));g.stroke();
    g.fillStyle="#f4efe6";g.fillRect(x0-34,NET-3,x1-x0+68,6);g.fillStyle="#2a2730";g.fillRect(x0-44,NET-8,10,16);g.fillRect(x1+34,NET-8,10,16);
    D.small(g,"THEIR SIDE",x0-30,top+14,11,"rgba(255,255,255,.5)");D.small(g,"YOUR SIDE",x0-30,bot-8,11,"rgba(255,255,255,.5)");
    if(!S)return;const m=S.me,an=S.anim;
    /* their blockers */
    S.B.forEach(b=>{const x=X_(b.u),y=NET-20,jumping=an&&an.k!=="D"&&Math.abs(b.u-HIT[an.k].u)<.25&&an.t>.3,r=jumping?17:14;
      dot(g,x,y,r,b.commit&&S.phase==="pass"&&S.rt0>S.Tp*.35?"#ff9a7a":"#e8ecf2");g.fillStyle="#1a1b24";g.font="800 11px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(b.id,x,y);
      g.strokeStyle="rgba(231,233,255,.5)";g.lineWidth=4;g.beginPath();g.moveTo(x-18,NET-4);g.lineTo(x+18,NET-4);g.stroke();
      if(b.commit&&S.phase==="pass"&&S.rt0>S.Tp*.35)D.small(g,"committed",x,y-22,10,"#ffb39d","center");else if(b.reading)D.small(g,"reading you",x,y-22,10,"#ffd34d","center");
      if(jumping){g.strokeStyle=acc();g.lineWidth=5;g.beginPath();g.moveTo(x-20,NET-2);g.lineTo(x+20,NET-2);g.stroke();}});
    /* your hitters: approach as the set goes */
    Object.entries(HIT).forEach(([k,h])=>{if(k==="D")return;const bump=S.phase==="pass"&&Math.hypot((m.u-S.L[0])*9,m.d-S.L[1])>.55&&S.rt0>S.Tp-.25,ok=legal(S,k,false),picked=S.call===k,go=an&&an.k===k;
      const dd=go?lerp(h.from,h.d,clamp(an.t/.45,0,1)):h.from,x=X_(h.u),y=Y_(Math.min(dd,5.4));const n=S.phase==="pass"&&X.mod.win>1?blockersOn(S,k,1):null;
      g.globalAlpha=ok?1:.35;dot(g,x,y,24,picked?acc():"#20202a",ok?acc():"#555",3);D.text(g,h.key,x,y+9,24,picked?"#141217":"#fff","center",800);D.small(g,h.label.toUpperCase(),x,y+40,12,"rgba(255,255,255,.85)","center");
      if(n!=null)D.small(g,`${n} blocker${n===1?"":"s"}`,x,y+54,11,n===0?"#9be7a4":"#ffb39d","center");g.globalAlpha=1;});
    /* the pass landing spot */
    if(S.phase==="pass"){const x=X_(S.L[0]),y=Y_(S.L[1]),k=clamp(S.rt0/S.Tp,0,1);g.strokeStyle=`rgba(255,255,255,${.25+.5*k})`;g.lineWidth=2;g.beginPath();g.arc(x,y,.55*PX,0,TAU);g.stroke();g.setLineDash([4,5]);g.beginPath();g.arc(x,y,1.25*PX,0,TAU);g.stroke();g.setLineDash([]);}
    /* you, the setter */
    const sx=X_(m.u),sy=Y_(m.d);dot(g,sx,sy,17,S.front?acc():"#c8c0b6","#fff",2);D.text(g,"S",sx,sy+7,20,"#141217","center",800);D.small(g,S.front?"you · front row":"you · back row",sx,sy+32,11,"rgba(255,255,255,.75)","center");
    if(S.pass==="A"&&S.front&&S.phase==="pass")D.small(g,"5 or Q: dump",sx,sy-26,11,acc(),"center");
    /* the ball: height shows as lift and size */
    let bu,bd,bh;if(S.phase==="pass"){const k=clamp(S.rt0/S.Tp,0,1);bu=lerp(S.P0[0],S.L[0],k);bd=lerp(S.P0[1],S.L[1],k);bh=lerp(1,2.3,k)+Math.sin(Math.PI*k)*3.2;}
    else if(an){const k=clamp(an.t/.55,0,1);if(an.k==="D"){bu=m.u;bd=lerp(m.d,-.4,k);bh=2.4-k*2;}else{const h=HIT[an.k];bu=lerp(m.u,h.u,k);bd=lerp(m.d,h.d,k);bh=2.4+Math.sin(Math.PI*k)*(an.k==="M"?.6:2.2);if(an.t>.55){const k2=clamp((an.t-.55)/.3,0,1);bd=lerp(h.d,an.n>=2?h.d+.3:-2.5,k2);bh=lerp(3,an.n>=2?.2:.1,k2);}}}
    else{bu=m.u;bd=m.d;bh=.3;}
    const bx=X_(bu),by=bd>=0?Y_(bd):TY(-bd);D.shadow(g,bx,by,10,.3);D.ball(g,bx,by-bh*12,9+bh*1.6,X.F.t*8,acc());
    /* time until the ball arrives: the ring around the landing spot runs down */
    if(S.phase==="pass"){const k=1-S.rt0/S.Tp,x=X_(S.L[0]),y=Y_(S.L[1]);g.strokeStyle=k<.3?"#ff6b6b":acc();g.lineWidth=4;g.beginPath();g.arc(x,y,.55*PX+6,-Math.PI/2,-Math.PI/2+TAU*k);g.stroke();}}
  function hud(g,S,X){D.hud(g,W,S,{combo:S.streak,lives:S.lives,tag:`${S.pass} PASS · RALLY ${S.rally}`});
    D.glass(g,W-196,96,182,150,.6);D.small(g,"THIS PASS",W-184,116,11);const opts=S.pass==="A"?"Everything":S.pass==="B"?"No quick":"High: 1 or 3 only";D.text(g,opts,W-184,142,20,"#fff","left",800,true);
    D.small(g,"Get under the ball. Call",W-184,166,11);D.small(g,"the hitter with the fewest",W-184,181,11);D.small(g,"blockers, as late as you dare.",W-184,196,11);D.small(g,"Keys 1-4 · 5 or Q dump",W-184,216,11,acc());if(X.mod.win>1)D.small(g,"Block: "+S.form,W-184,234,11,"rgba(255,255,255,.7)");
    C.layout(S.pad,W,H,[],{move:false});C.drawPad(g,S.pad,X.F.t);}
  function bot(S,X){const P=S.pad,m=S.me;P.h.left=P.h.right=P.h.up=P.h.down=false;if(S.phase!=="pass")return;m.goal=[S.L[0],S.L[1]];
    if(S.rt0>S.Tp-.3&&!S.botCalled){S.botCalled=true;const bump=Math.hypot((m.u-S.L[0])*9,m.d-S.L[1])>.55;let best="L",bn=9;if(Math.random()<.35*(A.botNoise||0)){P.p.c1=0;return;}["L","M","R","P","D"].forEach(k=>{if(!legal(S,k,bump))return;const n=blockersOn(S,k,1)-(k==="D"?.5:0);if(n<bn){bn=n;best=k;}});P.p["c"+(["L","M","R","P","D"].indexOf(best)+1)]=0;}
    if(S.rt0<.1)S.botCalled=false;}
  A.add("setter",C.wire({title:"Setter's Vision",tag:"Get under it. Read the block. Call it late.",unit:"points",W,H,aria:"Arrow keys move the setter, keys 1 to 4 call a hitter, 5 dumps. Or tap the court to move and tap a hitter to call.",
    controls:"<b>Arrows</b> or <b>WASD</b> move · <b>1 2 3 4</b> call a hitter · <b>5</b> or <b>Q</b> dump · touch: tap the court to run, tap a hitter to call",
    desc:"You're the setter. Run under the pass, read their block and call the hitter with the fewest blockers. Call too early and their middle <b>reads you</b> and moves across: the best setters decide late.",
    how:["Move with the arrow keys or WASD, or tap the court to run there. Be inside the small ring when the ball comes down for a clean set; inside the big ring is a <b>bump set</b> (only a high ball outside); further and you drop it.",
      "Call a hitter any time before the ball arrives: <b>1</b> outside, <b>2</b> quick, <b>3</b> opposite, <b>4</b> pipe (or tap them). You can change your mind. <b>No call</b> means a slow ball to the outside.",
      "<b>A pass</b>: everything, and a <b>dump</b> (5 or Q) if you're front row. <b>B pass</b>: no quick. <b>C pass</b>: only a high ball to the outside (1) or opposite (3).",
      "Their middle <b>reads</b> a call you hold too long and moves toward it. Call late (in the last half second) for a <b>Disguised</b> bonus, or fake one way and switch. A committed middle (red) jumps with your quick: the outsides are open.",
      "Get there early and stand still for a <b>jump set</b>: a faster set (+1) that beats the block. 1 on 0: +3. A single block when nobody was free: +2 (+1 if someone was). Into a double: 0. A dump with nobody in front: +4.",
      "Every 6 in a row adds ×0.25 (up to ×2). Dropping the pass, an illegal call or a blocked dump costs a life. On Rookie you see how many blockers each hitter faces."],
    daily:[{text:"Make 8 perfect reads (1 on 0)",rule:"reads",n:8,f:50,ok:S=>S.reads>=8},{text:"Score 40 points",rule:"score",n:40,f:45,ok:S=>S.score>=40}],
    bestOf:c=>c.best.setter||0,saveBest:(c,v)=>{if(v>(c.best.setter||0))c.best.setter=v;},
    start,update,draw,hud,bot,
    tap(S,x,y){let best=null,bd=40;Object.entries(HIT).forEach(([k,h])=>{if(k==="D")return;const d=Math.hypot(x-X_(h.u),y-Y_(h.from>5.4?5.4:h.from));if(d<bd){bd=d;best=k;}});
      if(best){call(S,A.cur,best);return;}if(S.pass==="A"&&S.front&&Math.hypot(x-X_(S.me.u),y-(Y_(S.me.d)-30))<26){call(S,A.cur,"D");return;}if(y>NET)S.me.goal=[clamp((x-CX)/(9*PX)+.5,.05,.95),clamp((y-NET)/PX,.1,4.2)];},
    result(S){const sc=Math.round(S.score);return {best:sc,head:`${sc} points`,sub:`${S.reads} perfect reads`,fe:Math.floor(sc/2)+S.reads*2,
      stats:[["Perfect reads",S.reads],["Disguised",S.disguised],["Jump sets",S.jumpsets],["Dumps",S.dumps],["Best run",S.bestStreak],["Illegal calls",S.wrong]],
      tip:S.wrong?"Check the pass first: B means no quick, C means outside or opposite only.":S.disguised<2?"Their middle reads early calls. Wait until the ball is almost in your hands, then call.":"",count:[["reads",S.reads],["dumps",S.dumps]]};}}));
})();
})();
