/* crows-court.js: the side-view volleyball kit behind the Crow's Nest games (v9, inspired by The Spike).
   Everything is in metres and seconds, with the net at x = 0 and our side on the left (x < 0):
   - a camera, a lit gym and a court seen from the side with a little depth, the net in perspective
   - a real ball: gravity, spin, the net and the floor, trajectory solving and landing prediction
   - athletes with a jointed skeleton and blended poses (ready, run, jump, spike, platform, dive, block, set, toss)
   - one input pad for keyboard and touch: held keys, buffered presses (a press counts for a moment, so early is fine),
     and on-screen buttons that work with several fingers at once
   Crow Spike (crows-spike.js) uses it through VB.crowArcade.court. */
(function(){
"use strict";
const VB=window.VB,A=VB.crowArcade;if(!A)return;
const {clamp,lerp,damp}=A.M,D=A.draw,TAU=Math.PI*2;
const C=A.court={NET:2.43,HALF:9,G:9.81,BR:.11,BVIS:1.75};

/* ---------- camera: world metres to canvas units ---------- */
C.camera=o=>{const c={x:o.x||0,s:o.s||50,fy:o.fy||470,W:o.W||960,H:o.H||560};
  c.X=x=>c.W/2+(x-c.x)*c.s;c.Y=y=>c.fy-y*c.s;c.inv=(px,py)=>[(px-c.W/2)/c.s+c.x,(c.fy-py)/c.s];
  /* the floor strip has depth: d = 0 is the far sideline, 1 the near one; players stand at d = .5 */
  c.upd=()=>{const k=c.s/55;c.FY0=c.fy-40*k;c.FY1=c.fy+44*k;};c.upd();c.DY=d=>lerp(c.FY0,c.FY1,d);c.DX=(x,d)=>c.W/2+(c.X(x)-c.W/2)*(.93+.14*d);
  return c;};

/* ---------- maths for the ball ---------- */
/* dip: extra downward pull from topspin (a jump serve or a spike dives; a float has none) */
C.ball=()=>({x:0,y:0,vx:0,vy:0,rot:0,spin:0,trail:[],live:false,heat:0,wob:0,float:0,t:0,held:false,dip:0});
C.gOf=b=>C.G+(b.dip||0);
C.at=(b,t)=>{const g=C.gOf(b);return [b.x+b.vx*t,b.y+b.vy*t-.5*g*t*t];};
/* time until the ball comes down to height h (or null if it never gets there) */
C.timeToY=(b,h)=>{const a=.5*C.gOf(b),bb=-b.vy,c=h-b.y,d=bb*bb-4*a*c;if(d<0)return null;const t=(-bb+Math.sqrt(d))/(2*a);return t>=0?t:null;};
C.land=b=>{const t=C.timeToY(b,C.BR);return t==null?null:{t,x:b.x+b.vx*t};};
C.timeToX=(b,x)=>{if(Math.abs(b.vx)<1e-4)return null;const t=(x-b.x)/b.vx;return t>=0?t:null;};
/* velocity that takes a ball from p to q in exactly T seconds */
C.throwT=(p,q,T,g)=>[(q[0]-p[0])/T,(q[1]-p[1])/T+.5*(g||C.G)*T];
/* velocity at a given speed from p that passes through q; the flatter of the two arcs unless high is asked for */
C.solve=(p,q,v,high,g)=>{g=g||C.G;const dx=q[0]-p[0],dy=q[1]-p[1],ax=Math.abs(dx),v2=v*v,disc=v2*v2-g*(g*ax*ax+2*dy*v2);if(disc<0||ax<1e-3)return null;
  const th=Math.atan((v2+(high?1:-1)*Math.sqrt(disc))/(g*ax));return [Math.sign(dx)*v*Math.cos(th),v*Math.sin(th)];};
/* height at the net of a ball hit from p with velocity vv */
C.netY=(p,vv,g)=>{const t=-p[0]/vv[0];if(!(t>0))return 99;return p[1]+vv[1]*t-.5*(g||C.G)*t*t;};
/* from our side: the shortest landing spot a ball hit at speed v can reach and still clear the tape by a margin */
C.clearX=(p,v,g,m)=>{for(let tx=.6;tx<9.8;tx+=.1){const vv=C.solve(p,[tx,C.BR],v,false,g);if(vv&&C.netY(p,vv,g)>=C.NET+(m==null?.15:m))return tx;}return 99;};
/* the fastest ball (between vmin and vmax) that lands at tx and still clears the net */
C.maxV=(p,tx,g,vmin,vmax,m)=>{for(let v=vmax;v>=vmin;v-=.25){if(C.clearX(p,v,g,m)<=tx+.05)return v;}return null;};
/* the arcade's speed readout: game metres per second shown as a broadcast-style km/h */
C.kmh=v=>Math.round(v*3.6*1.72);

/* one physics step: gravity, the float serve's wobble, the net (bounce back or roll over the tape) and the floor.
   Returns events: {k:"net"}, {k:"tape"}, {k:"floor",x} */
C.stepBall=(b,dt)=>{const ev=[];if(b.held)return ev;const n=Math.max(1,Math.ceil(dt/.004)),h=dt/n;
  for(let i=0;i<n;i++){const px=b.x,py=b.y;b.t+=h;
    if(b.float>0){b.vy+=Math.sin(b.t*b.float*7+b.wob)*b.float*2.4*h;}
    b.vy-=(C.G+(b.dip||0))*h;b.x+=b.vx*h;b.y+=b.vy*h;b.rot+=b.spin*h;
    if(b.live&&!b.netDone&&(px<0)!==(b.x<0)){const k=px/(px-b.x),yc=py+(b.y-py)*k;
      if(yc<C.NET+C.BR*.7){if(yc>C.NET-C.BR*1.2&&Math.random()<.5){/* clips the tape: dribbles over */b.vx*=.35;b.vy=Math.abs(b.vy)*.25+1;b.netDone=true;ev.push({k:"tape"});}
        else{b.x=px>0?.12:-.12;b.vx*=-.18;b.vy=Math.min(b.vy,0)*.3;b.netDone=true;ev.push({k:"net"});}}}
    if(b.y<=C.BR&&b.vy<0){b.y=C.BR;if(b.live){b.live=false;ev.push({k:"floor",x:b.x});}b.vy=-b.vy*.42;b.vx*=.62;b.spin*=.5;if(Math.abs(b.vy)<.6)b.vy=0;}}
  b.trail.push([b.x,b.y]);if(b.trail.length>12)b.trail.shift();
  b.heat=Math.max(0,b.heat-dt*.6);return ev;};

/* ---------- the arena: a deep backdrop with parallax, a live crowd, LED boards, a glossy floor ---------- */
const BW=1700,BH=780,HZ=600;
C.Q={crowd:1,shafts:1,cel:1,refl:1,ghost:1,gloss:1,vig:1,led:1,bg:1,floor:1};
let back=null,backKey="",vig=null,vigKey="",bgc=null;const BGS=.7;
function makeBack(acc){const c=document.createElement("canvas"),dpr=.75;c.width=BW*dpr;c.height=BH*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);
  const bg=g.createLinearGradient(0,0,0,HZ);bg.addColorStop(0,"#040306");bg.addColorStop(.55,"#100c14");bg.addColorStop(1,"#1c1520");g.fillStyle=bg;g.fillRect(0,0,BW,BH);
  /* roof trusses */
  g.strokeStyle="rgba(120,110,140,.13)";g.lineWidth=3;[40,92].forEach(y=>{g.beginPath();g.moveTo(0,y);g.lineTo(BW,y);g.stroke();});
  g.lineWidth=1.5;for(let x=0;x<BW;x+=52){g.beginPath();g.moveTo(x,40);g.lineTo(x+26,92);g.lineTo(x+52,40);g.stroke();}
  /* the jumbotron with the crow */
  g.fillStyle="#08070a";D.round(g,BW/2-150,110,300,120,8);g.fill();g.strokeStyle="rgba(255,255,255,.1)";g.lineWidth=2;g.stroke();
  const sg=g.createLinearGradient(0,118,0,222);sg.addColorStop(0,"rgba(255,255,255,.05)");sg.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=sg;g.fillRect(BW/2-142,118,284,104);
  if(A.K)A.K.crowAt(g,BW/2,170,1.5,false,acc);
  /* banners hanging from the roof */
  const ban=(x,w,txt,col,ink)=>{g.fillStyle=col;g.beginPath();g.moveTo(x,120);g.lineTo(x+w,120);g.lineTo(x+w,218);g.lineTo(x+w/2,236);g.lineTo(x,218);g.closePath();g.fill();
    g.fillStyle=ink;g.font="italic 800 34px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(txt,x+w/2,168);g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x,120,w,6);};
  ban(140,150,"CAW!",acc,"#141217");ban(360,150,"FLY HIGH","#141217",acc);ban(BW-290,150,"NO FEAR","#141217","#f4efe6");ban(BW-510,150,"SPIKE IT","#e8e3da","#141217");
  /* the stands: tiers with a lit rail */
  const st=g.createLinearGradient(0,HZ*.4,0,HZ);st.addColorStop(0,"#0b090e");st.addColorStop(1,"#211a25");g.fillStyle=st;g.fillRect(0,HZ*.42,BW,HZ*.58);
  for(let i=0;i<7;i++){const y=HZ*(.44+i*.08);g.fillStyle="rgba(255,255,255,.035)";g.fillRect(0,y,BW,2);}
  g.fillStyle=acc;g.globalAlpha=.55;g.fillRect(0,HZ*.42-3,BW,3);g.globalAlpha=1;
  /* the wall under the stands */
  g.fillStyle="#120e15";g.fillRect(0,HZ-6,BW,BH-HZ+6);return c;}
/* light shafts from the roof, drawn over the crowd */
function shafts(g,t,hype){g.save();g.globalCompositeOperation="lighter";for(let i=0;i<7;i++){const x=BW*(.08+i*.14),sw=Math.sin(t*.4+i)*14,a=.07+.03*Math.sin(t*1.3+i*2)+hype*.05;
    const gr=g.createLinearGradient(x,0,x+sw,HZ);gr.addColorStop(0,`rgba(255,238,205,${a*2})`);gr.addColorStop(1,"rgba(255,238,205,0)");g.fillStyle=gr;g.beginPath();g.moveTo(x-10,0);g.lineTo(x+10,0);g.lineTo(x+sw+110,HZ);g.lineTo(x+sw-110,HZ);g.closePath();g.fill();
    g.fillStyle="rgba(255,248,230,.95)";g.fillRect(x-16,2,32,5);}g.restore();}
/* the crowd: six rows that bob, cheer with their arms up on big points, wave flags and flash phones */
const CROWD=[];(function(){for(let r=0;r<6;r++){const y=HZ*(.5+r*.075),sz=4.6+r*.85,n=Math.floor(BW/(sz*2.9));for(let i=0;i<n;i++){const h=Math.sin(i*12.9898+r*78.233)*43758.5453,f=h-Math.floor(h);
  CROWD.push({x:(i+.5)/n*BW+(f-.5)*sz,y,sz,f,r,shirt:f<.1?2:0,flag:f>.988});}}})();
function crowd(g,t,hype,acc,col2){const pal=["#1a161e","#211c26","#28222d","#1e1a23"];
  CROWD.forEach(c=>{const fan=c.x<BW/2?acc:col2,jump=hype>.15&&c.f>.35?Math.abs(Math.sin(t*(7+c.f*4)+c.f*20))*hype*c.sz*1.4:0,bob=Math.max(0,Math.sin(t*(3+c.f*3)+c.f*9))*1.6+jump;
    const x=c.x,y=c.y-bob,s=c.sz;g.globalAlpha=c.shirt===2?.5:1;g.fillStyle=c.shirt===2?fan:pal[(c.f*40|0)%4];D.round(g,x-s*1.05,y+s*.7,s*2.1,s*2.6,s*.6);g.fill();g.globalAlpha=1;
    g.fillStyle=c.shirt===2?"#4a3c3a":"#2e2630";g.beginPath();g.arc(x,y,s*.78,0,TAU);g.fill();
    if(hype>.35&&c.f>.55){g.strokeStyle=g.fillStyle;g.lineWidth=s*.45;g.lineCap="round";const w=Math.sin(t*12+c.f*30)*.4;g.beginPath();g.moveTo(x-s*.8,y+s);g.lineTo(x-s*1.3+w*s,y-s*1.3);g.moveTo(x+s*.8,y+s);g.lineTo(x+s*1.3-w*s,y-s*1.3);g.stroke();}
    if(c.flag){const w=Math.sin(t*5+c.f*9);g.strokeStyle="#8a8090";g.lineWidth=1.5;g.beginPath();g.moveTo(x+s,y+s);g.lineTo(x+s,y-s*3.6);g.stroke();g.fillStyle=fan;g.beginPath();g.moveTo(x+s,y-s*3.6);g.quadraticCurveTo(x+s*2.6,y-s*(3.4+w*.4),x+s*4,y-s*3.3+w*s*.6);g.lineTo(x+s*4,y-s*1.9+w*s*.6);g.quadraticCurveTo(x+s*2.6,y-s*(2+w*.4),x+s,y-s*2.1);g.closePath();g.fill();}
    if(c.f<.05&&Math.sin(t*3+c.f*700)>.97-hype*.1){g.fillStyle="rgba(255,255,255,.9)";g.fillRect(x-1.5,y-s*1.6,3,3);}});}
C.drawGym=(g,cam,acc,hype,t,o)=>{o=o||{};const W=cam.W,H=cam.H;if(backKey!==acc){backKey=acc;back=makeBack(acc);}
  /* the stands are drawn small into their own canvas and scaled up: cheap, and the softness reads as depth of field */
  if(!bgc||bgc.width!==Math.round(W*BGS)){bgc=document.createElement("canvas");bgc.width=Math.round(W*BGS);bgc.height=Math.round(H*BGS);}
  const bx=bgc.getContext("2d"),fy0=Math.min(cam.FY0+2,H);bx.setTransform(BGS,0,0,BGS,0,0);bx.fillStyle="#040306";bx.fillRect(0,0,W,fy0);
  /* the far background moves less than the court (parallax) and zooms a little with the camera */
  const z=1+(cam.s/64-1)*.3;bx.save();bx.translate(W/2,cam.FY0);bx.scale(z,z);bx.translate(-BW/2-cam.x*16,-HZ);
  bx.drawImage(back,0,0,BW,BH);if(C.Q.crowd)crowd(bx,t,hype||0,acc,o.col2||"#e8ecf2");if(C.Q.shafts)shafts(bx,t,hype||0);bx.restore();
  /* dim the stands so the ball always reads */
  const dim=bx.createLinearGradient(0,0,0,cam.FY0);dim.addColorStop(0,"rgba(6,5,9,.3)");dim.addColorStop(.6,"rgba(6,5,9,.5)");dim.addColorStop(1,"rgba(6,5,9,.62)");bx.fillStyle=dim;bx.fillRect(0,0,W,cam.FY0);
  if(C.Q.bg)g.drawImage(bgc,0,0,bgc.width,Math.round(fy0*BGS),0,0,W,Math.round(fy0*BGS)/BGS);
  /* the LED board along the far sideline, scrolling */
  if(C.Q.led){const by=cam.FY0-15*cam.s/55,bh=12*cam.s/55;g.fillStyle="#07060a";g.fillRect(0,by,W,bh+2);g.save();g.beginPath();g.rect(0,by,W,bh);g.clip();
  g.font=`italic 800 ${Math.round(bh*.85)}px 'Barlow Condensed',sans-serif`;g.textBaseline="middle";g.fillStyle=acc;g.globalAlpha=.7;const msg=o.led||"CROW SPIKE  ·  FLY HIGH  ·  ",mw=g.measureText(msg).width||300,off=((-cam.x*cam.s*.93+t*60)%mw+mw)%mw;
  for(let x=-mw+off;x<W+mw;x+=mw)g.fillText(msg,x,by+bh/2+1);g.fillStyle="rgba(0,0,0,.35)";for(let x=0;x<W;x+=3)g.fillRect(x,by,1,bh);g.restore();}
  if(C.Q.floor)paintFloor(g,cam);};
function paintFloor(g,cam){const W=cam.W,H=cam.H;g.save();
  const fz=g.createLinearGradient(0,cam.FY0,0,H);fz.addColorStop(0,"#3a1907");fz.addColorStop(1,"#5a280b");g.fillStyle=fz;g.fillRect(0,cam.FY0,W,H-cam.FY0);
  const q=(x0,x1,d0,d1)=>{g.beginPath();g.moveTo(cam.DX(x0,d0),cam.DY(d0));g.lineTo(cam.DX(x1,d0),cam.DY(d0));g.lineTo(cam.DX(x1,d1),cam.DY(d1));g.lineTo(cam.DX(x0,d1),cam.DY(d1));g.closePath();};
  const fl=g.createLinearGradient(0,cam.FY0,0,cam.FY1);fl.addColorStop(0,"#8a3f12");fl.addColorStop(1,"#cf6c22");g.fillStyle=fl;q(-9,9,.1,.9);g.fill();
  g.fillStyle="rgba(0,0,0,.09)";q(-3,3,.1,.9);g.fill();
  /* planks */
  g.save();q(-14,14,0,1.3);g.clip();for(let i=0;i<16;i++){const d=i/15*1.2;g.strokeStyle=`rgba(0,0,0,${.06+(i%3===0?.05:0)})`;g.lineWidth=1;g.beginPath();g.moveTo(0,cam.DY(d));g.lineTo(W,cam.DY(d));g.stroke();}
  for(let x=-14;x<=14;x+=1.2){g.strokeStyle="rgba(0,0,0,.05)";g.beginPath();g.moveTo(cam.DX(x,0),cam.DY(0));g.lineTo(cam.DX(x,1.3),cam.DY(1.3));g.stroke();}
  /* gloss: the roof lights reflected in the varnish */
  if(C.Q.gloss){g.globalCompositeOperation="lighter";for(let i=-3;i<=3;i++){const x=cam.X(i*4.2)+(cam.x*cam.s)*.55,gr=g.createLinearGradient(0,cam.FY0,0,cam.FY1+30);gr.addColorStop(0,"rgba(255,225,180,.055)");gr.addColorStop(1,"rgba(255,225,180,0)");g.fillStyle=gr;g.beginPath();g.ellipse(x,(cam.FY0+cam.FY1)/2,26*cam.s/55,(cam.FY1-cam.FY0)*.6,0,0,TAU);g.fill();}
  g.globalCompositeOperation="source-over";}
  const sh=g.createRadialGradient(W/2,cam.FY1,30,W/2,cam.FY1,W*.65);sh.addColorStop(0,"rgba(255,220,170,.12)");sh.addColorStop(1,"rgba(0,0,0,.25)");g.fillStyle=sh;g.fillRect(0,cam.FY0,W,H);g.restore();
  /* lines */
  g.strokeStyle="#f4efe6";g.lineWidth=3*Math.min(1.4,cam.s/55);q(-9,9,.1,.9);g.stroke();g.lineWidth=2.2*Math.min(1.4,cam.s/55);
  [-3,3,0].forEach(x=>{g.beginPath();g.moveTo(cam.DX(x,.1),cam.DY(.1));g.lineTo(cam.DX(x,.9),cam.DY(.9));g.stroke();});
  g.restore();}
C.paintFloor=paintFloor;
/* the bottom fade and the vignette, over everything but the HUD */
C.drawVignette=(g,cam)=>{if(!C.Q.vig)return;const W=cam.W,H=cam.H,k=W+"|"+H;if(vigKey!==k){vigKey=k;vig=document.createElement("canvas");vig.width=W;vig.height=H;const v=vig.getContext("2d"),gr=v.createRadialGradient(W/2,H*.55,H*.35,W/2,H*.55,W*.75);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(1,"rgba(0,0,0,.55)");v.fillStyle=gr;v.fillRect(0,0,W,H);
    const bt=v.createLinearGradient(0,H*.82,0,H);bt.addColorStop(0,"rgba(8,6,10,0)");bt.addColorStop(1,"rgba(8,6,10,.5)");v.fillStyle=bt;v.fillRect(0,H*.82,W,H*.18);}
  g.drawImage(vig,0,0,W,H);};
/* a lit stripe on the floor between x0 and x1 (target zones, landing marks) */
C.floorZone=(g,cam,x0,x1,col,a)=>{g.fillStyle=`rgba(${col},${a})`;g.beginPath();g.moveTo(cam.DX(x0,.1),cam.DY(.1));g.lineTo(cam.DX(x1,.1),cam.DY(.1));g.lineTo(cam.DX(x1,.9),cam.DY(.9));g.lineTo(cam.DX(x0,.9),cam.DY(.9));g.closePath();g.fill();};
/* the net: posts, a mesh that bulges and ripples where the ball hits it, the tape and the antennas.
   rip: {a: strength 0..1, y: height of the hit in metres, t: time since, dir: which way it was pushed} */
C.drawNet=(g,cam,shake,rip)=>{const sc=cam.s,bulge=(h,d)=>{let o=(shake||0)*Math.sin(d*9+h*3);if(rip&&rip.a>0){const k=Math.exp(-Math.pow((h-rip.y)/.55,2))*Math.exp(-Math.pow((d-.5)/.3,2));o+=rip.dir*rip.a*k*.32*sc*Math.cos(rip.t*26)*Math.exp(-rip.t*4);}return o;};
  const P=(h,d)=>[cam.DX(0,d)+bulge(h,d),cam.DY(d)-h*sc];
  g.fillStyle="#2a2730";[.02,.98].forEach(dd=>{const x=cam.DX(0,dd),y=cam.DY(dd);g.fillRect(x-3.5,y-(C.NET+.25)*sc,7,(C.NET+.25)*sc);g.fillStyle="#3a3640";g.fillRect(x-6,y-6,12,6);g.fillStyle="#2a2730";});
  const top=C.NET,bot=C.NET-.95,NH=9,ND=16;
  g.fillStyle="rgba(240,240,255,.06)";g.beginPath();[[top,.06],[top,.94],[bot,.94],[bot,.06]].forEach(([h,d],i)=>{const p=P(h,d);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();g.fill();
  g.strokeStyle="rgba(255,255,255,.22)";g.lineWidth=1;
  for(let i=0;i<=NH;i++){const h=lerp(top,bot,i/NH);g.beginPath();for(let j=0;j<=6;j++){const p=P(h,lerp(.06,.94,j/6));j?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.stroke();}
  for(let i=0;i<=ND;i++){const d=lerp(.06,.94,i/ND);g.beginPath();for(let j=0;j<=NH;j++){const p=P(lerp(top,bot,j/NH),d);j?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.stroke();}
  g.strokeStyle="#1a1820";g.lineWidth=2;g.beginPath();[.06,.94].forEach((d,i)=>{const p=P(bot,d);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.stroke();
  g.strokeStyle="#f4efe6";g.lineWidth=5*Math.min(1.3,sc/55);g.beginPath();for(let j=0;j<=6;j++){const p=P(top,lerp(.06,.94,j/6));j?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.stroke();
  [.1,.9].forEach(dd=>{const p=P(top,dd),wb=(rip&&rip.a>0?bulge(top+.4,dd):0);for(let k=0;k<6;k++){g.fillStyle=k%2?"#f4efe6":"#e0442b";g.fillRect(p[0]-2+wb*(k/6),p[1]-(k+1)*.13*sc,4,.13*sc);}});};

/* ---------- the ball on screen: stretches with speed, squashes on every contact, a trail that heats up, a glow ---------- */
C.drawShadow=(g,cam,x,y)=>{const k=clamp(1-y/9,.25,1);D.shadow(g,cam.X(x),cam.DY(.5)+2,(.2+.12*k)*cam.s*.9,.18+.32*k);};
/* call once a frame: notices a hit (a sudden change of velocity) and starts the squash */
C.ballFx=(b,dt)=>{if(b.pv){const dx=b.vx-b.pv[0],dy=b.vy-b.pv[1],dv=Math.hypot(dx,dy);if(dv>3.2+C.G*dt*1.5){b.sq=Math.min(1,dv/16);b.sqa=Math.atan2(-dy,dx);b.sqt=0;}}
  b.pv=[b.vx,b.vy];if(b.sq>0){b.sqt=(b.sqt||0)+dt;if(b.sqt>.5)b.sq=0;}};
C.drawBall=(g,cam,b,acc,o)=>{o=o||{};const r=C.BR*C.BVIS*cam.s*(o.scale||1),x=cam.X(b.x),y=cam.Y(b.y);
  if(o.alpha===0)return;const heat=clamp(b.heat,0,1.4),sp=b.held?0:Math.hypot(b.vx,b.vy);
  if(b.trail.length>1&&!o.noTrail){const col=heat>1?"255,190,60":heat>.45?"255,140,40":"255,255,255";D.trail(g,b.trail.map(([tx,ty])=>[cam.X(tx),cam.Y(ty),r*(.7+heat*.5)]),col);}
  if(heat>.45){g.save();g.globalCompositeOperation="lighter";const gl=g.createRadialGradient(x,y,r*.4,x,y,r*(2.4+heat));gl.addColorStop(0,`rgba(255,${heat>1?200:150},60,${.35*Math.min(1,heat)})`);gl.addColorStop(1,"rgba(255,120,20,0)");g.fillStyle=gl;g.beginPath();g.arc(x,y,r*(2.4+heat),0,TAU);g.fill();g.restore();}
  /* deform: stretch along the flight, squash against the last hit (a damped wobble) */
  g.save();g.translate(x,y);
  const st=1+Math.min(.28,sp/75);let sq=0;if(b.sq>0){const k=b.sqt||0;sq=b.sq*.42*Math.exp(-k*11)*Math.cos(k*48);}
  if(sq){g.rotate(b.sqa);g.scale(1-sq,1+sq*.7);g.rotate(-b.sqa);}
  if(sp>2){const a=Math.atan2(-b.vy,b.vx);g.rotate(a);g.scale(st,1/Math.sqrt(st));g.rotate(-a);}
  g.strokeStyle="rgba(0,0,0,.55)";g.lineWidth=2;g.beginPath();g.arc(0,0,r+1,0,TAU);g.stroke();
  D.ball(g,0,0,r,b.rot,acc,o.alpha);g.restore();};

/* ---------- athletes: a jointed, cel-shaded figure seen from the side ----------
   Angles are absolute, in radians from straight down, positive toward the way the player faces (π is straight up).
   1 is the far limb (drawn behind, darker), 2 the near one.
   Poses blend with springs (so moves overshoot and settle), the head follows the ball, bodies squash on landing
   and stretch on take-off, fast moves leave afterimages and a hard arm swing leaves a smear. */
const SEG={th:.5,sh:.5,tor:.6,ua:.34,fa:.34};
const P=C.POSES={
  stand:{tor:.05,hd:0,u1:.12,f1:.3,u2:-.1,f2:.25,t1:.06,s1:.02,t2:-.06,s2:-.04},
  ready:{tor:.42,hd:-.3,u1:.8,f1:1.2,u2:.65,f2:1.1,t1:.7,s1:-.32,t2:.28,s2:-.42},
  low:{tor:.62,hd:-.45,u1:.95,f1:1.25,u2:.85,f2:1.2,t1:1.05,s1:-.25,t2:.55,s2:-.55},
  land:{tor:.7,hd:-.35,u1:.55,f1:1.0,u2:.4,f2:.9,t1:1.25,s1:-.45,t2:.85,s2:-.7},
  platform:{tor:.55,hd:-.5,u1:.95,f1:1.15,u2:.95,f2:1.15,t1:.95,s1:-.3,t2:.45,s2:-.5},
  dig:{tor:.4,hd:-.55,u1:1.35,f1:1.45,u2:1.35,f2:1.45,t1:.8,s1:-.4,t2:.25,s2:-.5},
  dive:{tor:.12,hd:-.9,u1:2.75,f1:2.8,u2:2.7,f2:2.75,t1:-.1,s1:-.35,t2:.08,s2:-.12},
  load:{tor:.6,hd:-.2,u1:-.9,f1:-.6,u2:-1,f2:-.7,t1:1.0,s1:-.6,t2:.8,s2:-.65},
  rise:{tor:-.1,hd:.2,u1:2.75,f1:2.95,u2:2.5,f2:2.7,t1:.05,s1:-.95,t2:.45,s2:-.55},
  cock:{tor:-.42,hd:.4,u1:2.45,f1:2.85,u2:2.75,f2:4.3,t1:-.3,s1:-1.45,t2:.05,s2:-1.15},
  swing:{tor:.45,hd:-.15,u1:.45,f1:.4,u2:2.6,f2:2.55,t1:.55,s1:-.25,t2:.8,s2:-.05},
  follow:{tor:.62,hd:-.3,u1:.35,f1:.6,u2:.55,f2:.3,t1:.55,s1:-.45,t2:.75,s2:-.25},
  tip:{tor:.05,hd:.3,u1:1.0,f1:.8,u2:2.9,f2:3.05,t1:.05,s1:-.4,t2:.2,s2:-.1},
  block:{tor:.02,hd:.15,u1:2.95,f1:2.95,u2:3.0,f2:3.0,t1:.02,s1:-.08,t2:-.02,s2:-.1},
  press:{tor:.12,hd:.1,u1:2.62,f1:2.5,u2:2.68,f2:2.55,t1:-.08,s1:-.2,t2:-.12,s2:-.22},
  set:{tor:-.02,hd:.35,u1:2.35,f1:3.35,u2:2.3,f2:3.3,t1:.2,s1:-.1,t2:-.05,s2:-.15},
  setgo:{tor:-.12,hd:.4,u1:2.95,f1:3.05,u2:2.9,f2:3.0,t1:.05,s1:0,t2:-.1,s2:-.05},
  toss:{tor:.0,hd:.4,u1:2.9,f1:2.95,u2:.3,f2:.6,t1:.1,s1:-.05,t2:-.1,s2:-.1},
  celebrate:{tor:-.1,hd:.4,u1:2.8,f1:3.1,u2:2.9,f2:3.3,t1:.05,s1:-.05,t2:-.08,s2:-.1},
  fist:{tor:.08,hd:.25,u1:.5,f1:1.6,u2:2.5,f2:3.9,t1:.35,s1:-.2,t2:-.1,s2:-.15},
  roar:{tor:-.2,hd:.55,u1:1.9,f1:2.6,u2:1.7,f2:2.3,t1:.4,s1:-.3,t2:-.15,s2:-.25},
  slump:{tor:.5,hd:-.7,u1:.1,f1:.05,u2:.05,f2:0,t1:.25,s1:-.2,t2:.1,s2:-.15},
  hands:{tor:.55,hd:-.2,u1:-.15,f1:.3,u2:-.1,f2:.35,t1:.35,s1:-.3,t2:.2,s2:-.35}};
const KEYS=Object.keys(P.stand);
let SEEDN=0;
C.athlete=o=>{const seed=o.seed!=null?o.seed:((SEEDN++*0.6180339)%1);const p={x:o.x||0,y:0,vx:0,vy:0,f:o.f||1,air:false,rot:0,run:0,ph:0,pose:"ready",rate:16,cur:Object.assign({},P[o.pose||"ready"]),vel:{},
  col:o.col||"#ff7a1a",col2:o.col2||null,num:o.num==null?"":String(o.num),numCol:o.numCol||"#141217",shorts:o.shorts||"#141217",skin:o.skin||"#d9a27e",hair:o.hair||"#141217",shoe:o.shoe||"#f4efe6",
  me:!!o.me,label:o.label||"",scale:o.scale||1,alpha:1,dim:o.dim||0,seed,style:o.style!=null?o.style:Math.floor(seed*5),band:o.band||null,
  t:seed*9,sq:0,sqv:0,hdL:0,lookW:0,look:null,gaze:[1,0],hl:0,hlv:0,ghosts:[],gT:0,hh:[],smear:0,bob:0,wasAir:false,lvy:0,step:false,glow:0,_hip:.95,fx:false};p.lift=0;return p;};
C.pose=(p,name,rate)=>{if(P[name]){p.pose=name;p.rate=rate||16;}};
C.animate=(p,dt)=>{if(!(dt>0))return;const t=P[p.pose],q=p.cur,v=p.vel;p.t+=dt;
  /* springs toward the pose: quick moves overshoot a little and settle (follow-through) */
  const w=Math.min(55,p.rate*.95),z=w>24?.58:.8,n=Math.max(1,Math.ceil(w*dt/.22)),h=dt/n;
  for(let i=0;i<n;i++)for(const k of KEYS){const vv=(v[k]||0)+(w*w*(t[k]-q[k])-2*z*w*(v[k]||0))*h;v[k]=vv;q[k]+=vv*h;}
  /* running: a sprint with arm pump and lean, or a shuffle when backing up */
  const sp=Math.abs(p.vx),running=!p.air&&sp>.6&&(p.pose==="ready"||p.pose==="stand"||p.pose==="low");
  p.run=damp(p.run,running?Math.min(1,sp/5):0,10,dt);const pph=p.ph;p.ph+=dt*(4+sp*1.7);
  p.step=p.run>.45&&Math.floor(p.ph/Math.PI)!==Math.floor(pph/Math.PI);
  if(p.run>.02){const s=Math.sin(p.ph),c=Math.cos(p.ph),k=p.run,dir=Math.sign(p.vx)*p.f,amp=dir>=0?1:.45,sprint=dir>=0?clamp((sp-3.5)/3,0,1):0;
    KEYS.forEach(kk=>{v[kk]=(v[kk]||0)*(1-k*.5);});
    q.tor=lerp(q.tor,.3*amp+.18*sprint,k);q.hd=lerp(q.hd,-.15-.1*sprint,k);
    q.t1=lerp(q.t1,.15+s*(.75+.25*sprint)*amp,k);q.s1=lerp(q.s1,.15+s*.75*amp-(.35+(.55+.5*sprint)*Math.max(0,c))*amp,k);q.t2=lerp(q.t2,.15-s*(.75+.25*sprint)*amp,k);q.s2=lerp(q.s2,.15-s*.75*amp-(.35+(.55+.5*sprint)*Math.max(0,-c))*amp,k);
    q.u1=lerp(q.u1,-s*(.9+.5*sprint)*amp,k);q.f1=lerp(q.f1,-s*.9*amp+1.4+.3*sprint,k);q.u2=lerp(q.u2,s*(.9+.5*sprint)*amp,k);q.f2=lerp(q.f2,s*.9*amp+1.4+.3*sprint,k);}
  p.bob=p.run>.02&&!p.air?Math.abs(Math.sin(p.ph))*.06*p.run:0;
  /* idle life: breathing, and a bounce on the toes in the ready stance (applied on top, never stored) */
  const idle=!p.air&&p.run<.3&&!p.rot&&(p.pose==="ready"||p.pose==="stand"||p.pose==="low"),ik=idle?1-p.run/.3:0;
  p.off=ik?{tor:Math.sin(p.t*2.3+p.seed*9)*.02*ik,t1:p.pose==="stand"?0:Math.sin(p.t*6.4+p.seed*5)*.035*ik,s1:p.pose==="stand"?0:-Math.sin(p.t*6.4+p.seed*5)*.06*ik}:null;if(p.off){p.off.t2=p.off.t1;p.off.s2=p.off.s1;}
  /* squash on landing, stretch on take-off */
  if(p.air&&!p.wasAir)p.sqv-=4.2;if(!p.air&&p.wasAir)p.sqv+=clamp(-p.lvy*.75,1.5,7);p.wasAir=p.air;p.lvy=p.vy;
  p.sqv+=(-280*p.sq-15*p.sqv)*dt;p.sq=clamp(p.sq+p.sqv*dt,-.2,.24);
  /* the head and eyes follow the ball */
  if(p.look){const nx=.6*Math.sin(q.tor),ny=-.6*Math.cos(q.tor),lx=(p.look[0]-p.x)*p.f-nx,ly=-(p.look[1]-(p.y+p._hip))-ny,L=Math.hypot(lx,ly)||1;
    p.gaze=[lx/L,ly/L];const el=Math.atan2(-ly,Math.abs(lx));p.hdL=damp(p.hdL,clamp(-el*.55,-.75,.6),12,dt);}
  p.lookW=damp(p.lookW,p.look&&p.rot<.3&&p.pose!=="dive"?1:0,8,dt);
  /* hair lags behind the head */
  const tgt=clamp(-p.vy*.05-p.vx*p.f*.04,-.7,.7);p.hlv+=(160*(tgt-p.hl)-9*p.hlv)*dt;p.hl+=p.hlv*dt;
  /* afterimages for big athletic moves; a smear behind a hard arm swing */
  const big=p.fx&&((p.air&&/rise|cock|swing|follow|tip|set|setgo/.test(p.pose))||p.rot>.35)||p.glow>.05;
  p.gT-=dt;if(big&&p.gT<=0){p.gT=.04;p.ghosts.push({x:p.x,y:p.y,f:p.f,rot:p.rot,scale:p.scale,cur:Object.assign({},q),hdL:p.hdL,lookW:p.lookW,sq:p.sq,bob:p.bob,age:0});if(p.ghosts.length>6)p.ghosts.shift();}
  p.ghosts.forEach(g=>g.age+=dt);while(p.ghosts.length&&p.ghosts[0].age>.24)p.ghosts.shift();
  const s=fk(p);p._hip=s.hipH;const sc=p.scale,hw=[p.x+p.f*s.h2[0]*sc,p.y+(s.hipH-s.h2[1])*sc],so=[p.x+p.f*s.so[0]*sc,p.y+(s.hipH-s.so[1])*sc];
  const ew=[p.x+p.f*s.e2[0]*sc,p.y+(s.hipH-s.e2[1])*sc];p.eh=p.eh||[];p.eh.push(ew);if(p.eh.length>6)p.eh.shift();p.hh.push(hw);if(p.hh.length>6)p.hh.shift();p.soW=so;const hv=p.hh.length>1?Math.hypot(hw[0]-p.hh[p.hh.length-2][0],hw[1]-p.hh[p.hh.length-2][1])/dt:0;
  p.smear=damp(p.smear,hv>8&&/cock|swing|follow|toss/.test(p.pose)?1:0,hv>8?40:12,dt);};
/* forward kinematics: local points (metres, y down) with the hip at 0,0, facing +x */
function fk(p){const c0=p.cur,o=p.off,L=SEG,s=Math.sin,c=Math.cos,q=o?{}:c0;if(o)KEYS.forEach(k=>q[k]=c0[k]+(o[k]||0));
  const k1=[L.th*s(q.t1),L.th*c(q.t1)],f1=[k1[0]+L.sh*s(q.s1),k1[1]+L.sh*c(q.s1)],k2=[L.th*s(q.t2),L.th*c(q.t2)],f2=[k2[0]+L.sh*s(q.s2),k2[1]+L.sh*c(q.s2)];
  const hd0=lerp(q.hd,p.hdL||0,(p.lookW||0)*.75),nk=[L.tor*s(q.tor),-L.tor*c(q.tor)],so=[L.tor*.88*s(q.tor),-L.tor*.88*c(q.tor)],ha=q.tor*.6+hd0,hd=[nk[0]+.16*s(ha),nk[1]-.16*c(ha)];
  const e1=[so[0]+L.ua*s(q.u1),so[1]+L.ua*c(q.u1)],h1=[e1[0]+L.fa*s(q.f1),e1[1]+L.fa*c(q.f1)],e2=[so[0]+L.ua*s(q.u2),so[1]+L.ua*c(q.u2)],h2=[e2[0]+L.fa*s(q.f2),e2[1]+L.fa*c(q.f2)];
  const pts={k1,f1,k2,f2,nk,so,hd,e1,h1,e2,h2};
  if(p.rot){const cr=Math.cos(p.rot),sr=Math.sin(p.rot);Object.keys(pts).forEach(k=>{const [x,y]=pts[k];pts[k]=[x*cr-y*sr,x*sr+y*cr];});}
  pts.ha=ha+(p.rot||0);
  let low=Math.max(pts.f1[1],pts.f2[1]);if(p.rot>.5)low=Math.max(low,pts.h1[1],pts.h2[1],pts.hd[1]+.12,pts.k1[1]+.06,pts.k2[1]+.06);
  pts.hipH=p.air&&!(p.rot>.5)?Math.max(low+.05,.97):low+.05;return pts;}
C.fk=fk;
C.joint=(p,name)=>{const s=fk(p),[lx,ly]=s[name],sc=p.scale;return [p.x+p.f*lx*sc,p.y+(s.hipH-ly)*sc];};
C.hipY=p=>p.y+fk(p).hipH*p.scale;
const INK="rgba(9,8,12,.9)";
const L2=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k)];
/* the body itself. o.flat: one colour, no detail (afterimages, impact frames, glows) */
function body(g,cam,p,o){const s=fk(p),sc=cam.s*p.scale,X=cam.X(p.x),Yf=cam.Y(p.y),sq=p.sq||0,flat=o.flat;
  g.save();g.globalAlpha=(o.alpha==null?1:o.alpha)*(p.alpha==null?1:p.alpha);g.translate(X,Yf);g.scale(sc*p.f*(1+.5*sq),sc*(1-sq));g.translate(0,-(s.hipH+(p.bob||0)));
  g.lineCap="round";g.lineJoin="round";g.lineWidth=.03;g.strokeStyle=INK;
  const cap=(a,b,ra,rb,nb)=>{const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1e-4,an=Math.atan2(dy,dx),nx=-dy/L,ny=dx/L;if(!nb)g.beginPath();g.moveTo(a[0]+nx*ra,a[1]+ny*ra);g.lineTo(b[0]+nx*rb,b[1]+ny*rb);g.arc(b[0],b[1],rb,an+Math.PI/2,an-Math.PI/2,true);g.lineTo(a[0]-nx*ra,a[1]-ny*ra);g.arc(a[0],a[1],ra,an-Math.PI/2,an+Math.PI/2,true);g.closePath();};
  /* fill, then a cel shadow on the back-lower edge (the part minus itself moved toward the light), then the ink outline */
  const part=(mk,col,shd)=>{mk(0,0);if(flat){g.fillStyle=flat;g.fill();return;}g.fillStyle=col;g.fill();
    if(shd&&C.Q.cel){g.save();g.clip();mk(.05,-.045,true);g.fillStyle=shd;g.fill("evenodd");g.restore();mk(0,0);}g.stroke();};
  const C2=(a,b,ra,rb)=>(dx,dy,inv)=>{if(inv){g.beginPath();g.rect(-3,-4,6,8);}cap([a[0]+dx,a[1]+dy],[b[0]+dx,b[1]+dy],ra,rb,inv);};
  const skin=p.skin,skinF=shade(skin,-.2),sh=c=>shade(c,-.32),jer=p.col,jerF=shade(jer,-.22),sho=p.shorts,shoF=shade(sho,-.15);
  const O=[0,0];
  const arm=(so,e,h,far)=>{const sk=far?skinF:skin;part(C2(so,e,.07,.058),sk,sh(sk));part(C2(e,h,.058,.045),sk,sh(sk));
    const d=[h[0]-e[0],h[1]-e[1]],dl=Math.hypot(d[0],d[1])||1;part(C2(h,[h[0]+d[0]/dl*.065,h[1]+d[1]/dl*.065],.044,.052),sk,null);
    const j=far?jerF:jer;part(C2(so,L2(so,e,.45),.08,.072),j,sh(j));};
  const leg=(k,f,far)=>{const sk=far?skinF:skin,sl=far?shoF:sho;
    part(C2(O,k,.105,.072),sk,sh(sk));part(C2(k,f,.068,.045),sk,sh(sk));
    part(C2(O,L2(O,k,.5),.118,.108),sl,sh(sl));
    if(!flat){part(C2(L2(k,f,.66),L2(k,f,.97),.05,.047),far?"#cfc9bf":"#f4efe6",null);part(C2(L2(k,f,-.06),L2(k,f,.2),.074,.07),far?"#0c0b0f":"#1a181e",null);}
    /* the shoe, flat along the floor (tilts with a dive) */
    g.save();g.translate(f[0],f[1]);g.rotate((p.rot||0)*.4);D.round(g,-.08,-.055,.27,.1,.045);g.fillStyle=flat||(far?shade(p.shoe,-.18):p.shoe);g.fill();if(!flat){g.stroke();g.fillStyle="rgba(0,0,0,.35)";g.fillRect(-.07,.025,.25,.02);g.fillStyle=p.col;g.fillRect(.02,-.04,.08,.03);}g.restore();};
  /* far side */
  arm(s.so,s.e1,s.h1,true);leg(s.k1,s.f1,true);
  /* torso: hips, a shaped jersey with a side seam, the number */
  const u=[s.nk[0],s.nk[1]],ul=Math.hypot(u[0],u[1])||1;u[0]/=ul;u[1]/=ul;const v=[-u[1],u[0]];
  const at=(d,w)=>[u[0]*d+v[0]*w,u[1]*d+v[1]*w];
  const torso=(dx,dy,inv)=>{const pts=[at(-.02,-.15),at(.24,-.135),at(.46,-.16),at(.58,-.13),at(.6,.0),at(.57,.14),at(.45,.19),at(.24,.14),at(-.02,.155)];
    g.beginPath();if(inv)g.rect(-3,-4,6,8);pts.forEach((pt,i)=>{const x=pt[0]+dx,y=pt[1]+dy;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();};
  part(C2([0,.04],[0,.06],.16,.16),sho,sh(sho));
  part(torso,jer,sh(jer));
  if(!flat){g.save();torso(0,0);g.clip();g.strokeStyle=p.col2||shade(jer,.35);g.globalAlpha*=.8;g.lineWidth=.04;const a=at(0,-.02),b=at(.6,-.02);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();
      g.fillStyle=shade(jer,-.35);g.globalAlpha=.35;g.beginPath();g.moveTo(at(-.03,-.2)[0],at(-.03,-.2)[1]);g.lineTo(at(-.03,.2)[0],at(-.03,.2)[1]);g.lineTo(at(.06,.2)[0],at(.06,.2)[1]);g.lineTo(at(.06,-.2)[0],at(.06,-.2)[1]);g.fill();g.restore();
    if(p.num){g.save();const c=at(.32,.05);g.translate(c[0],c[1]);g.rotate(Math.atan2(u[0],-u[1]));g.scale(p.f,1);g.fillStyle=p.numCol;g.font="800 .22px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(p.num,0,0);g.restore();}}
  /* near leg */
  leg(s.k2,s.f2,false);
  /* neck and head */
  part(C2(s.nk,L2(s.nk,s.hd,.55),.055,.052),skin,null);
  const ha=s.ha;g.save();g.translate(s.hd[0],s.hd[1]);g.rotate(ha);
  const R=.15,hair=flat||p.hair,hl=p.hl||0;
  /* hair behind the head (ponytail, spikes) */
  if(p.style===3){g.fillStyle=hair;const sw=hl*.6;cap([-.11,-.07],[-.24+Math.sin(sw)*.08,.05+Math.cos(sw)*.12],.05,.035);g.fill();if(!flat)g.stroke();}
  if(p.style===0){g.fillStyle=hair;g.beginPath();const sp=[[-.16,.03],[-.27,-.02+hl*.05],[-.16,-.07],[-.25,-.17+hl*.06],[-.1,-.13],[-.1,-.27+hl*.05],[0,-.16],[.06,-.27+hl*.04],[.07,-.15],[.18,-.2+hl*.03],[.12,-.08]];sp.forEach((pt,i)=>i?g.lineTo(pt[0],pt[1]):g.moveTo(pt[0],pt[1]));g.closePath();g.fill();if(!flat)g.stroke();}
  /* the face */
  g.beginPath();g.arc(0,0,R,0,TAU);g.fillStyle=flat||skin;g.fill();
  if(!flat){g.beginPath();g.moveTo(R*.55,R*.55);g.quadraticCurveTo(R*1.05,R*.6,R*.92,R*.2);g.lineTo(R*.8,R*.5);g.closePath();g.fillStyle=skin;g.fill();
    g.save();g.beginPath();g.arc(0,0,R,0,TAU);g.clip();g.fillStyle=sh(skin);g.beginPath();g.arc(-R*.35,R*.3,R*.9,0,TAU);g.globalAlpha*=.45;g.fill();g.restore();
    g.beginPath();g.arc(0,0,R,0,TAU);g.stroke();
    /* nose, ear, eye that looks at the ball, brow, mouth */
    g.fillStyle=skin;g.beginPath();g.moveTo(R*.95,-R*.12);g.lineTo(R*1.2,R*.12);g.lineTo(R*.95,R*.2);g.fill();g.stroke();
    g.fillStyle=sh(skin);g.beginPath();g.ellipse(-R*.15,R*.05,R*.18,R*.24,0,0,TAU);g.fill();
    const gz=p.gaze||[1,0],gx=clamp(gz[0],0,1),gy=clamp(gz[1],-.9,.9);/* gaze is in the body frame; undo the head tilt */
    const ca=Math.cos(-ha),sa=Math.sin(-ha),ex=gx*ca-gy*sa,ey=gx*sa+gy*ca;
    g.fillStyle="#fff";g.beginPath();g.ellipse(R*.58,-R*.12,R*.2,R*.16,0,0,TAU);g.fill();
    g.fillStyle="#141217";g.beginPath();g.arc(R*.6+clamp(ex,-.4,1)*R*.09,-R*.12+clamp(ey,-1,1)*R*.07,R*.1,0,TAU);g.fill();
    const fierce=/cock|swing|block|press|rise|dive|roar/.test(p.pose);g.strokeStyle="#141217";g.lineWidth=.025;g.beginPath();g.moveTo(R*.35,fierce?-R*.42:-R*.38);g.lineTo(R*.85,fierce?-R*.28:-R*.36);g.stroke();
    g.lineWidth=.018;g.beginPath();if(/celebrate|roar|fist/.test(p.pose)){g.arc(R*.72,R*.42,R*.16,0,Math.PI);}else{g.moveTo(R*.6,R*.48);g.lineTo(R*.85,R*.45);}g.stroke();g.lineWidth=.03;g.strokeStyle=INK;}
  /* hair on top */
  g.fillStyle=hair;g.beginPath();
  if(p.style===4){g.arc(0,0,R*1.04,Math.PI*.82,Math.PI*1.86);g.lineTo(R*.2,-R*.62);}
  else if(p.style===2){g.arc(0,0,R*1.1,Math.PI*.8,Math.PI*1.9);g.lineTo(R*1.18,-R*.12+hl*.03);g.lineTo(R*.55,-R*.42);g.lineTo(R*.25,-R*.5);}
  else{g.arc(0,0,R*1.1,Math.PI*.8,Math.PI*1.9);g.lineTo(R*.75,-R*.36);g.lineTo(R*.55,-R*.5);g.lineTo(R*.3,-R*.4);}
  g.lineTo(-R*.25,-R*.05);g.lineTo(-R*.55,R*.55);g.closePath();g.fill();if(!flat)g.stroke();
  if(!flat&&p.style!==4){g.fillStyle="rgba(255,255,255,.14)";g.beginPath();g.ellipse(-R*.15,-R*.82,R*.4,R*.12,-.25,0,TAU);g.fill();}
  if(p.band&&!flat){g.fillStyle=p.band;g.beginPath();g.moveTo(-R*1.02,-R*.38);g.lineTo(R*1.0,-R*.48);g.lineTo(R*1.0,-R*.3);g.lineTo(-R*1.02,-R*.2);g.closePath();g.fill();g.stroke();
    g.beginPath();g.moveTo(-R*1.0,-R*.3);g.lineTo(-R*1.5,-R*(.15-hl*.5));g.lineTo(-R*1.45,-R*(0-hl*.5));g.closePath();g.fill();}
  g.restore();
  /* near arm last, so it shows over the body */
  arm(s.so,s.e2,s.h2,false);
  if(p.dim&&!flat){g.globalCompositeOperation="source-atop";g.fillStyle=`rgba(10,10,18,${p.dim})`;g.fillRect(-3,-4,6,8);}
  g.restore();return s;}
C.drawAthlete=(g,cam,p,o)=>{o=o||{};
  if(o.refl){body(g,cam,p,{alpha:o.alpha==null?.14:o.alpha});return;}
  if(o.flat){body(g,cam,p,o);return;}
  /* shadow and the "you" marker under the feet */
  const sc=cam.s*p.scale,X=cam.X(p.x),fy=cam.DY(.5);D.shadow(g,X,fy+2,.46*sc*(1+(p.sq||0)*.5),clamp(.55-p.y*.22,.12,.55));
  if(p.me){g.save();g.strokeStyle=A.K.col();g.globalAlpha=.75;g.lineWidth=2.5;g.beginPath();g.ellipse(X,fy+3,.5*sc,.14*sc,0,0,TAU);g.stroke();g.restore();}
  /* a special: a burning aura */
  if(p.glow>.05){g.save();g.shadowColor=p.glowCol||"#ffd34d";g.shadowBlur=24;body(g,cam,p,{flat:p.glowCol||"#ffd34d",alpha:.55*p.glow});g.restore();}
  /* afterimages, oldest first */
  const tint=p.ghostCol||p.col;if(C.Q.ghost)p.ghosts.forEach(gh=>{const k=1-gh.age/.24;body(g,cam,Object.assign({},p,gh,{alpha:1,off:null}),{flat:tint,alpha:.28*k*k});});
  const s=body(g,cam,p,{});
  /* the smear behind a fast arm */
  /* a swoosh between where the hand and the elbow have been */
  if(p.smear>.05&&p.hh.length>=3&&p.eh&&p.eh.length===p.hh.length){g.save();g.globalCompositeOperation="lighter";const gr=g.createLinearGradient(cam.X(p.hh[0][0]),cam.Y(p.hh[0][1]),cam.X(p.hh[p.hh.length-1][0]),cam.Y(p.hh[p.hh.length-1][1]));gr.addColorStop(0,"rgba(255,255,255,0)");gr.addColorStop(1,`rgba(255,250,235,${.45*p.smear})`);g.fillStyle=gr;
    g.beginPath();p.hh.forEach((h,i)=>i?g.lineTo(cam.X(h[0]),cam.Y(h[1])):g.moveTo(cam.X(h[0]),cam.Y(h[1])));for(let i=p.eh.length-1;i>=0;i--){const e=p.eh[i],h=p.hh[i];g.lineTo(cam.X(lerp(h[0],e[0],.6)),cam.Y(lerp(h[1],e[1],.6)));}g.closePath();g.fill();g.restore();}
  if(p.label){const Y=cam.Y(p.y+s.hipH*p.scale);D.small(g,p.label,X,Y-(SEG.tor+.55)*sc-6,11,"rgba(255,255,255,.75)","center");}};
function shade(hex,k){const m=/^#?([0-9a-f]{6})$/i.exec(hex||"");if(!m)return hex;const n=parseInt(m[1],16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=x=>clamp(Math.round(k<0?x*(1+k):x+(255-x)*k),0,255);return `rgb(${f(r)},${f(g)},${f(b)})`;}
C.shade=shade;
/* the two kits */
C.ours=(o)=>Object.assign({col:A.K.col(),numCol:"#141217",shorts:"#141217",hair:"#141217"},o||{});
C.theirs=(o)=>Object.assign({col:"#e8ecf2",col2:"#b9c3d2",numCol:"#1f3b73",shorts:"#1f3b73",hair:"#2a1d14",skin:"#c99673",shoe:"#20283a"},o||{});

/* ---------- player physics ---------- */
C.PG=15.5;/* athletes fall faster than the ball: snappy jumps */
/* run toward a target speed with acceleration; in the air there is only a little control */
C.run=(p,dir,dt,o)=>{o=o||{};const max=o.max||6,acc=p.air?(o.airAcc||4):(o.acc||38);const tv=dir*max;p.vx+=clamp(tv-p.vx,-acc*dt,acc*dt);if(dir)p.f=o.face||p.f;};
C.jump=(p,v,carry)=>{if(p.air)return false;p.air=true;p.vy=v;p.vx*=carry==null?.6:carry;return true;};
/* integrate; returns true on the frame the player lands */
C.physics=(p,dt,o)=>{o=o||{};p.x+=p.vx*dt;if(o.min!=null)p.x=Math.max(o.min,p.x);if(o.max!=null)p.x=Math.min(o.max,p.x);
  if(p.air){p.vy-=(o.g||C.PG)*(o.hold&&p.vy>0?.55:1)*dt;p.y+=p.vy*dt;if(p.y<=0){p.y=0;p.vy=0;p.air=false;return true;}}
  else if(!o.keep)p.vx*=Math.exp(-(o.fric||0)*dt);return false;};
/* a simple AI mover: go to x at up to v m/s, face f */
C.goTo=(p,x,v,dt,face)=>{const d=x-p.x;p.vx=Math.abs(d)<.03?0:clamp(d*8,-v,v);if(face)p.f=face;};

/* ---------- input: one pad for keys and touch ----------
   map: key -> action. Held actions are in pad.h, fresh presses in pad.p (with their age, so a press a moment early still counts). */
C.pad=map=>({h:{},p:{},map,btns:[],ptr:new Map(),touch:matchMedia&&matchMedia("(pointer: coarse)").matches,tap:null});
const norm=k=>k&&k.length===1?k.toLowerCase():k;
C.keyDown=(P,k,e)=>{const a=P.map[norm(k)];if(!a)return false;(Array.isArray(a)?a:[a]).forEach(x=>{if(!(e&&e.repeat))P.p[x]=0;P.h[x]=true;});return true;};
C.keyUp=(P,k)=>{const a=P.map[norm(k)];if(!a)return;(Array.isArray(a)?a:[a]).forEach(x=>{P.h[x]=false;});};
/* use a press if it happened within the last `win` seconds */
C.take=(P,a,win)=>{const t=P.p[a];if(t!=null&&t<=(win==null?.12:win)){delete P.p[a];return true;}return false;};
C.tick=(P,dt)=>{Object.keys(P.p).forEach(k=>{P.p[k]+=dt;if(P.p[k]>.5)delete P.p[k];});};
C.release=P=>{P.h={};P.p={};P.ptr.clear();};
C.dir=P=>(P.h.right?1:0)-(P.h.left?1:0);
/* on-screen buttons: the game lays them out every frame in P.btns: {a, x, y, r, label, sub, also} */
const hitBtn=(P,x,y)=>{let best=null,bd=1e9;P.btns.forEach(b=>{if(b.off)return;const d=Math.hypot(x-b.x,y-b.y);if(d<b.r*1.15&&d<bd){bd=d;best=b;}});return best;};
const press=(P,b,on)=>{[b.a].concat(b.also||[]).forEach(a=>{if(on){P.p[a]=0;P.h[a]=true;}else P.h[a]=false;});};
C.ptrDown=(P,x,y,e)=>{if(e&&e.pointerType==="touch")P.touch=true;const b=hitBtn(P,x,y);if(!b)return false;press(P,b,true);P.ptr.set(e?e.pointerId:0,b);return true;};
C.ptrMove=(P,x,y,e)=>{const id=e?e.pointerId:0,cur=P.ptr.get(id);if(!cur||!cur.slide)return;const b=hitBtn(P,x,y);if(b&&b!==cur&&b.slide){press(P,cur,false);press(P,b,true);P.ptr.set(id,b);}};
C.ptrUp=(P,e)=>{const id=e?e.pointerId:0,b=P.ptr.get(id);if(b){P.ptr.delete(id);/* keep a button held while another finger still holds it */if(![...P.ptr.values()].includes(b))press(P,b,false);return true;}return false;};
C.drawPad=(g,P,t)=>{const a0=P.touch?.82:.5;P.btns.forEach(b=>{if(b.off)return;const on=[b.a].concat(b.also||[]).every(a=>P.h[a]),r=b.r*(on?.94:1);
  g.save();g.globalAlpha=b.dim?a0*.45:a0;g.fillStyle=on?`rgba(${A.K.rgb()},.55)`:b.hot?`rgba(${A.K.rgb()},.28)`:"rgba(14,12,18,.62)";g.beginPath();g.arc(b.x,b.y,r,0,TAU);g.fill();
  g.lineWidth=b.hot?3:2;g.strokeStyle=b.hot?A.K.col():"rgba(255,255,255,.28)";if(b.hot&&!on){g.globalAlpha*=.6+.4*Math.sin(t*9);}g.stroke();g.globalAlpha=b.dim?a0*.5:Math.min(1,a0+.15);
  D.text(g,b.label,b.x,b.y+(b.sub?2:Math.round(b.r*.2)),Math.round(Math.min(b.r*.62,(b.fs||22))*Math.min(1.25,A.ui)),on||b.hot?"#fff":"rgba(255,255,255,.92)","center",800,true);
  if(b.sub&&!P.touch)D.small(g,b.sub,b.x,b.y+b.r*.62,9,"rgba(255,255,255,.55)","center");g.restore();});};
/* a standard layout: move buttons bottom left, actions bottom right (bigger on phones) */
C.layout=(P,W,H,acts,o)=>{o=o||{};const u=Math.min(1.5,A.ui),R=34*u,base=H-12;P.btns=[];
  if(o.move!==false){const y=base-R;P.btns.push({a:"left",x:18+R,y,r:R,label:"◀",slide:true,fs:30});P.btns.push({a:"right",x:18+R*3.3,y,r:R,label:"▶",slide:true,fs:30});}
  let x=W-16;for(let i=acts.length-1;i>=0;i--){const b=acts[i];if(!b)continue;const r=(b.big?1.2:.9)*R;x-=r;P.btns.push(Object.assign({x,y:base-r-(b.lift||0)*R,r},b));x-=r+10;}
  return P.btns;};
/* wire a game definition to the pad: pointer and key events go to the pad first */
C.wire=def=>{
  def.down=(S,x,y,e)=>{if(!S.pad)return;if(!C.ptrDown(S.pad,x,y,e)&&def.tap)def.tap(S,x,y,e);};
  def.move=(S,x,y,e)=>{if(S.pad)C.ptrMove(S.pad,x,y,e);if(def.drag)def.drag(S,x,y,e);};
  def.up=(S,x,y,e)=>{if(S.pad)C.ptrUp(S.pad,e);};
  def.key=(S,k,e)=>{if(!S.pad)return false;const ok=C.keyDown(S.pad,k,e);if(def.onKey)def.onKey(S,norm(k),e);return ok?true:false;};
  def.keyUp=(S,k)=>{if(S.pad)C.keyUp(S.pad,k);};
  def.release=S=>{if(S&&S.pad)C.release(S.pad);};
  return def;};

/* ---------- juice helpers ---------- */
/* a spike-speed readout: the number punches in at the contact point */
C.speedPop=(X,cam,x,y,v,col)=>{X.F.pop(cam.X(x),cam.Y(y)-78,`${C.kmh(v)} km/h`,{col:col||"#fff",size:v>17?40:30,life:1.1});};
C.dust=(X,cam,x,n,col)=>{X.F.burst(cam.X(x),cam.DY(.5),n||10,{col:col||["#f6f3ea","#e9c9a0"],speed:180,up:120,size:4,dir:-Math.PI/2,spread:2.2,g:500});};
/* text on the canvas that wraps at a width */
C.say=(g,txt,x,y,size,col)=>{D.text(g,txt,x,y,size,col||"#fff","center",800,true);};
})();
