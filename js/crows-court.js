/* crows-court.js: the side-view volleyball kit behind the Crow's Nest games (v9, inspired by The Spike).
   Everything is in metres and seconds, with the net at x = 0 and our side on the left (x < 0):
   - a camera, a lit gym and a court seen from the side with a little depth, the net in perspective
   - a real ball: gravity, spin, the net and the floor, trajectory solving and landing prediction
   - athletes with a jointed skeleton and blended poses (ready, run, jump, spike, platform, dive, block, set, toss)
   - one input pad for keyboard and touch: held keys, buffered presses (a press counts for a moment, so early is fine),
     and on-screen buttons that work with several fingers at once
   The games in crows-games.js use it through VB.crowArcade.court. */
(function(){
"use strict";
const VB=window.VB,A=VB.crowArcade;if(!A)return;
const {clamp,lerp,damp}=A.M,D=A.draw,TAU=Math.PI*2;
const C=A.court={NET:2.43,HALF:9,G:9.81,BR:.11,BVIS:1.75};

/* ---------- camera: world metres to canvas units ---------- */
C.camera=o=>{const c={x:o.x||0,s:o.s||50,fy:o.fy||470,W:o.W||960,H:o.H||560};
  c.X=x=>c.W/2+(x-c.x)*c.s;c.Y=y=>c.fy-y*c.s;c.inv=(px,py)=>[(px-c.W/2)/c.s+c.x,(c.fy-py)/c.s];
  /* the floor strip has depth: d = 0 is the far sideline, 1 the near one; players stand at d = .5 */
  c.FY0=c.fy-40;c.FY1=c.fy+44;c.DY=d=>lerp(c.FY0,c.FY1,d);c.DX=(x,d)=>c.W/2+(c.X(x)-c.W/2)*(.93+.14*d);
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

/* ---------- the gym, the court and the net ---------- */
let backKey="",back=null,floorKey="",floor=null;
C.drawGym=(g,cam,acc,hype,t)=>{const W=cam.W,H=cam.H,k=W+"|"+H+"|"+acc+"|"+cam.fy;
  if(k!==backKey){backKey=k;back=D.arena(W,H,cam.FY0-6,acc);}
  g.drawImage(back,0,0,W,H);D.crowd(g,W,cam.FY0-6,t,hype||0,acc);
  /* dim the crowd so the ball always reads against it */
  const dim=g.createLinearGradient(0,0,0,cam.FY0);dim.addColorStop(0,"rgba(6,5,9,.35)");dim.addColorStop(.6,"rgba(6,5,9,.5)");dim.addColorStop(1,"rgba(6,5,9,.62)");g.fillStyle=dim;g.fillRect(0,0,W,cam.FY0);
  /* a moving camera paints the floor live; a still one keeps it cached */
  if(cam.live){paintFloor(g,cam);return;}
  const fk=k+"|"+cam.x+"|"+cam.s;if(fk!==floorKey){floorKey=fk;floor=makeFloor(cam);}g.drawImage(floor,0,0,W,H);};
function makeFloor(cam){const c=document.createElement("canvas"),dpr=Math.min(2,devicePixelRatio||1),W=cam.W,H=cam.H;c.width=W*dpr;c.height=H*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);paintFloor(g,cam);return c;}
function paintFloor(g,cam){const W=cam.W,H=cam.H;g.save();
  /* free zone, then the court */
  const fz=g.createLinearGradient(0,cam.FY0,0,H);fz.addColorStop(0,"#3c1a08");fz.addColorStop(1,"#5d2a0c");g.fillStyle=fz;g.fillRect(0,cam.FY0,W,H-cam.FY0);
  const q=(x0,x1,d0,d1)=>{g.beginPath();g.moveTo(cam.DX(x0,d0),cam.DY(d0));g.lineTo(cam.DX(x1,d0),cam.DY(d0));g.lineTo(cam.DX(x1,d1),cam.DY(d1));g.lineTo(cam.DX(x0,d1),cam.DY(d1));g.closePath();};
  const fl=g.createLinearGradient(0,cam.FY0,0,cam.FY1);fl.addColorStop(0,"#8a3f12");fl.addColorStop(1,"#c8661f");g.fillStyle=fl;q(-9,9,.1,.9);g.fill();
  /* the attack zones a shade darker */
  g.fillStyle="rgba(0,0,0,.08)";q(-3,3,.1,.9);g.fill();
  /* planks */
  g.save();q(-14,14,0,1.2);g.clip();for(let i=0;i<14;i++){const d=i/13;g.strokeStyle=`rgba(0,0,0,${.07+(i%3===0?.05:0)})`;g.lineWidth=1;g.beginPath();g.moveTo(0,cam.DY(d));g.lineTo(W,cam.DY(d));g.stroke();}
  for(let x=-14;x<=14;x+=1.4){g.strokeStyle="rgba(0,0,0,.05)";g.beginPath();g.moveTo(cam.DX(x,0),cam.DY(0));g.lineTo(cam.DX(x,1.2),cam.DY(1.2));g.stroke();}
  const sh=g.createRadialGradient(W/2,cam.FY1,30,W/2,cam.FY1,W*.6);sh.addColorStop(0,"rgba(255,220,170,.16)");sh.addColorStop(1,"rgba(0,0,0,.22)");g.fillStyle=sh;g.fillRect(0,cam.FY0,W,H);g.restore();
  /* lines */
  g.strokeStyle="#f4efe6";g.lineWidth=3;q(-9,9,.1,.9);g.stroke();g.lineWidth=2.2;
  [-3,3,0].forEach(x=>{g.beginPath();g.moveTo(cam.DX(x,.1),cam.DY(.1));g.lineTo(cam.DX(x,.9),cam.DY(.9));g.stroke();});
  g.font="700 11px 'Barlow',sans-serif";g.fillStyle="rgba(255,255,255,.3)";g.textAlign="center";[[-3,"3 m"],[3,"3 m"]].forEach(([x,t])=>g.fillText(t,cam.DX(x,1),cam.DY(1)+2));
  /* a fade at the bottom so the buttons read */
  const bt=g.createLinearGradient(0,cam.FY1,0,H);bt.addColorStop(0,"rgba(8,6,10,0)");bt.addColorStop(1,"rgba(8,6,10,.55)");g.fillStyle=bt;g.fillRect(0,cam.FY1,W,H-cam.FY1);
  g.restore();}
/* a lit stripe on the floor between x0 and x1 (target zones, landing marks) */
C.floorZone=(g,cam,x0,x1,col,a)=>{g.fillStyle=`rgba(${col},${a})`;g.beginPath();g.moveTo(cam.DX(x0,.1),cam.DY(.1));g.lineTo(cam.DX(x1,.1),cam.DY(.1));g.lineTo(cam.DX(x1,.9),cam.DY(.9));g.lineTo(cam.DX(x0,.9),cam.DY(.9));g.closePath();g.fill();};
/* the net: posts at both sidelines, the mesh, the white tape and the antennas, in perspective */
C.drawNet=(g,cam,shake)=>{const top=d=>[cam.DX(0,d)+(shake||0)*Math.sin(d*9),cam.DY(d)-C.NET*cam.s],bot=d=>[cam.DX(0,d),cam.DY(d)-(C.NET-.95)*cam.s];
  const a=top(.06),b=top(.94),c=bot(.94),d=bot(.06);
  g.fillStyle="#2a2730";[.02,.98].forEach(dd=>{const x=cam.DX(0,dd),y=cam.DY(dd);g.fillRect(x-3,y-(C.NET+.25)*cam.s,6,(C.NET+.25)*cam.s);});
  g.fillStyle="rgba(240,240,255,.06)";g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.lineTo(d[0],d[1]);g.closePath();g.fill();
  g.strokeStyle="rgba(255,255,255,.2)";g.lineWidth=1;for(let i=0;i<=9;i++){const k=i/9,p=[lerp(a[0],d[0],k),lerp(a[1],d[1],k)],q=[lerp(b[0],c[0],k),lerp(b[1],c[1],k)];g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();}
  for(let i=0;i<=16;i++){const k=i/16,p=[lerp(a[0],b[0],k),lerp(a[1],b[1],k)],q=[lerp(d[0],c[0],k),lerp(d[1],c[1],k)];g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();}
  g.strokeStyle="#f4efe6";g.lineWidth=5;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();
  [.1,.9].forEach(dd=>{const p=top(dd);for(let k=0;k<6;k++){g.fillStyle=k%2?"#f4efe6":"#e0442b";g.fillRect(p[0]-2,p[1]-(k+1)*.13*cam.s,4,.13*cam.s);}});};

/* ---------- the ball on screen: shadow on the floor, a trail that heats up with speed, a glow so it reads ---------- */
C.drawShadow=(g,cam,x,y)=>{const k=clamp(1-y/9,.25,1);D.shadow(g,cam.X(x),cam.DY(.5)+2,(.2+.12*k)*cam.s*.9,.18+.32*k);};
C.drawBall=(g,cam,b,acc,o)=>{o=o||{};const r=C.BR*C.BVIS*cam.s*(o.scale||1),x=cam.X(b.x),y=cam.Y(b.y);
  if(o.alpha===0)return;const heat=clamp(b.heat,0,1.4);
  if(b.trail.length>1&&!o.noTrail){const col=heat>1?"255,190,60":heat>.45?"255,140,40":"255,255,255";D.trail(g,b.trail.map(([tx,ty])=>[cam.X(tx),cam.Y(ty),r*(.7+heat*.5)]),col);}
  if(heat>.45){g.save();g.globalCompositeOperation="lighter";const gl=g.createRadialGradient(x,y,r*.4,x,y,r*(2.4+heat));gl.addColorStop(0,`rgba(255,${heat>1?200:150},60,${.35*Math.min(1,heat)})`);gl.addColorStop(1,"rgba(255,120,20,0)");g.fillStyle=gl;g.beginPath();g.arc(x,y,r*(2.4+heat),0,TAU);g.fill();g.restore();}
  g.save();g.strokeStyle="rgba(0,0,0,.55)";g.lineWidth=2;g.beginPath();g.arc(x,y,r+1,0,TAU);g.stroke();g.restore();
  D.ball(g,x,y,r,b.rot,acc,o.alpha);};

/* ---------- athletes: a jointed figure seen from the side, with poses that blend into each other ----------
   Angles are absolute, in radians from straight down, positive toward the way the player faces (π is straight up).
   1 is the far limb (drawn behind, darker), 2 the near one. */
const SEG={th:.5,sh:.5,tor:.6,ua:.34,fa:.34};
const P=C.POSES={
  stand:{tor:.05,hd:0,u1:.12,f1:.3,u2:-.1,f2:.25,t1:.06,s1:.02,t2:-.06,s2:-.04},
  ready:{tor:.42,hd:-.3,u1:.8,f1:1.2,u2:.65,f2:1.1,t1:.7,s1:-.32,t2:.28,s2:-.42},
  low:{tor:.62,hd:-.45,u1:.95,f1:1.25,u2:.85,f2:1.2,t1:1.05,s1:-.25,t2:.55,s2:-.55},
  platform:{tor:.55,hd:-.5,u1:.95,f1:1.15,u2:.95,f2:1.15,t1:.95,s1:-.3,t2:.45,s2:-.5},
  dig:{tor:.4,hd:-.55,u1:1.35,f1:1.45,u2:1.35,f2:1.45,t1:.8,s1:-.4,t2:.25,s2:-.5},
  dive:{tor:.12,hd:-.9,u1:2.75,f1:2.8,u2:2.7,f2:2.75,t1:-.1,s1:-.35,t2:.08,s2:-.12},
  load:{tor:.6,hd:-.2,u1:-.9,f1:-.6,u2:-1,f2:-.7,t1:1.0,s1:-.6,t2:.8,s2:-.65},
  rise:{tor:-.08,hd:.2,u1:2.75,f1:2.95,u2:2.45,f2:2.6,t1:-.15,s1:-.6,t2:.25,s2:-.25},
  cock:{tor:-.3,hd:.35,u1:2.55,f1:2.95,u2:2.6,f2:4.1,t1:-.35,s1:-.9,t2:.15,s2:-.5},
  swing:{tor:.38,hd:-.1,u1:.6,f1:.5,u2:2.75,f2:2.7,t1:.3,s1:-.3,t2:.55,s2:.1},
  follow:{tor:.55,hd:-.25,u1:.4,f1:.6,u2:.75,f2:.55,t1:.45,s1:-.25,t2:.6,s2:.15},
  tip:{tor:.05,hd:.3,u1:1.0,f1:.8,u2:2.9,f2:3.05,t1:.05,s1:-.4,t2:.2,s2:-.1},
  block:{tor:.02,hd:.15,u1:2.95,f1:2.95,u2:3.0,f2:3.0,t1:.02,s1:-.08,t2:-.02,s2:-.1},
  press:{tor:.12,hd:.1,u1:2.62,f1:2.5,u2:2.68,f2:2.55,t1:-.08,s1:-.2,t2:-.12,s2:-.22},
  set:{tor:-.02,hd:.35,u1:2.35,f1:3.35,u2:2.3,f2:3.3,t1:.2,s1:-.1,t2:-.05,s2:-.15},
  setgo:{tor:-.12,hd:.4,u1:2.95,f1:3.05,u2:2.9,f2:3.0,t1:.05,s1:0,t2:-.1,s2:-.05},
  toss:{tor:.0,hd:.4,u1:2.9,f1:2.95,u2:.3,f2:.6,t1:.1,s1:-.05,t2:-.1,s2:-.1},
  celebrate:{tor:-.1,hd:.4,u1:2.8,f1:3.1,u2:2.9,f2:3.3,t1:.05,s1:-.05,t2:-.08,s2:-.1},
  slump:{tor:.5,hd:-.7,u1:.1,f1:.05,u2:.05,f2:0,t1:.25,s1:-.2,t2:.1,s2:-.15}};
const KEYS=Object.keys(P.stand);
C.athlete=o=>{const p={x:o.x||0,y:0,vx:0,vy:0,f:o.f||1,air:false,rot:0,run:0,ph:0,pose:"ready",rate:16,cur:Object.assign({},P[o.pose||"ready"]),
  col:o.col||"#ff7a1a",col2:o.col2||null,num:o.num==null?"":String(o.num),numCol:o.numCol||"#141217",shorts:o.shorts||"#141217",skin:o.skin||"#d9a27e",hair:o.hair||"#141217",shoe:o.shoe||"#f4efe6",
  me:!!o.me,label:o.label||"",scale:o.scale||1,alpha:1,dim:o.dim||0};p.lift=0;return p;};
C.pose=(p,name,rate)=>{if(P[name]){p.pose=name;p.rate=rate||16;}};
/* blend toward the pose; while running on the floor, a run cycle drives the legs and arms */
C.animate=(p,dt)=>{const t=P[p.pose],r=1-Math.exp(-p.rate*dt),q=p.cur;
  const sp=Math.abs(p.vx),running=!p.air&&sp>.6&&(p.pose==="ready"||p.pose==="stand"||p.pose==="low");
  p.run=damp(p.run,running?Math.min(1,sp/5):0,10,dt);p.ph+=dt*(4+sp*1.6);
  KEYS.forEach(k=>{q[k]+= (t[k]-q[k])*r;});
  if(p.run>.02){const s=Math.sin(p.ph),c=Math.cos(p.ph),k=p.run,dir=Math.sign(p.vx)*p.f;/* running backwards shuffles */
    const amp=dir>=0?1:.45;q.tor=lerp(q.tor,.32*amp,k);
    q.t1=lerp(q.t1,.15+s*.75*amp,k);q.s1=lerp(q.s1,.15+s*.75*amp-(.35+.55*Math.max(0,c))*amp,k);q.t2=lerp(q.t2,.15-s*.75*amp,k);q.s2=lerp(q.s2,.15-s*.75*amp-(.35+.55*Math.max(0,-c))*amp,k);
    q.u1=lerp(q.u1,-s*.9*amp,k);q.f1=lerp(q.f1,-s*.9*amp+1.3,k);q.u2=lerp(q.u2,s*.9*amp,k);q.f2=lerp(q.f2,s*.9*amp+1.3,k);}};
/* forward kinematics: local points (metres, y down) with the hip at 0,0, facing +x */
function fk(p){const q=p.cur,L=SEG,s=Math.sin,c=Math.cos;
  const k1=[L.th*s(q.t1),L.th*c(q.t1)],f1=[k1[0]+L.sh*s(q.s1),k1[1]+L.sh*c(q.s1)],k2=[L.th*s(q.t2),L.th*c(q.t2)],f2=[k2[0]+L.sh*s(q.s2),k2[1]+L.sh*c(q.s2)];
  const nk=[L.tor*s(q.tor),-L.tor*c(q.tor)],so=[L.tor*.88*s(q.tor),-L.tor*.88*c(q.tor)],ha=q.tor*.6+q.hd,hd=[nk[0]+.15*s(ha),nk[1]-.15*c(ha)];
  const e1=[so[0]+L.ua*s(q.u1),so[1]+L.ua*c(q.u1)],h1=[e1[0]+L.fa*s(q.f1),e1[1]+L.fa*c(q.f1)],e2=[so[0]+L.ua*s(q.u2),so[1]+L.ua*c(q.u2)],h2=[e2[0]+L.fa*s(q.f2),e2[1]+L.fa*c(q.f2)];
  const pts={k1,f1,k2,f2,nk,so,hd,e1,h1,e2,h2};
  if(p.rot){const cr=Math.cos(p.rot),sr=Math.sin(p.rot);Object.keys(pts).forEach(k=>{const [x,y]=pts[k];pts[k]=[x*cr-y*sr,x*sr+y*cr];});}
  /* height of the hip above the lowest supporting point */
  let low=Math.max(pts.f1[1],pts.f2[1]);if(p.rot>.5)low=Math.max(low,pts.h1[1],pts.h2[1],pts.hd[1]+.12,pts.k1[1]+.06,pts.k2[1]+.06);
  pts.hipH=low+.05;return pts;}
C.fk=fk;
/* a point of the skeleton in world metres */
C.joint=(p,name)=>{const s=fk(p),[lx,ly]=s[name],sc=p.scale;return [p.x+p.f*lx*sc,p.y+(s.hipH-ly)*sc];};
C.hipY=p=>p.y+fk(p).hipH*p.scale;
C.drawAthlete=(g,cam,p,t)=>{const s=fk(p),sc=cam.s*p.scale,X=cam.X(p.x),Y=cam.Y(p.y+s.hipH*p.scale);
  /* shadow and the "you" marker under the feet */
  const fy=cam.DY(.5);D.shadow(g,X,fy+2,.42*sc,clamp(.5-p.y*.25,.12,.5));
  if(p.me){g.save();g.strokeStyle=A.K.col();g.globalAlpha=.75;g.lineWidth=2.5;g.beginPath();g.ellipse(X,fy+3,.46*sc,.13*sc,0,0,TAU);g.stroke();g.restore();}
  g.save();g.globalAlpha=p.alpha;g.translate(X,Y);g.scale(sc*p.f,sc);g.lineCap="round";g.lineJoin="round";
  const skin=p.skin,dark=shade(skin,-.22),lw=(w,col)=>{g.lineWidth=w;g.strokeStyle=col;};
  const limb=(a,b,c,w1,w2,col)=>{lw(w1,col);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();lw(w2,col);g.beginPath();g.moveTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.stroke();};
  const shoe=(f,k,col)=>{const a=Math.atan2(f[1]-k[1],f[0]-k[0])-Math.PI/2;g.save();g.translate(f[0],f[1]);g.rotate(p.rot?a*.3:0);g.fillStyle=col;D.round(g,-.07,-.05,.24,.1,.04);g.fill();g.fillStyle="rgba(0,0,0,.25)";g.fillRect(-.07,.035,.24,.025);g.restore();};
  const pad=(k,col)=>{g.fillStyle=col;g.beginPath();g.arc(k[0],k[1],.068,0,TAU);g.fill();};
  const O=[0,0];
  /* far arm and leg */
  limb(s.so,s.e1,s.h1,.115,.095,dark);limb(O,s.k1,s.f1,.17,.13,dark);pad(s.k1,"#0e0d11");lw(.1,"#e9e4da");g.beginPath();const sk1=[lerp(s.k1[0],s.f1[0],.78),lerp(s.k1[1],s.f1[1],.78)];g.moveTo(sk1[0],sk1[1]);g.lineTo(s.f1[0],s.f1[1]);g.stroke();shoe(s.f1,s.k1,shade(p.shoe,-.15));
  /* torso: shorts then jersey */
  const tdir=[s.nk[0],s.nk[1]],len=Math.hypot(tdir[0],tdir[1])||1,nx=-tdir[1]/len,ny=tdir[0]/len;
  const q4=(a,b,w1,w2)=>{g.beginPath();g.moveTo(a[0]+nx*w1,a[1]+ny*w1);g.lineTo(b[0]+nx*w2,b[1]+ny*w2);g.lineTo(b[0]-nx*w2,b[1]-ny*w2);g.lineTo(a[0]-nx*w1,a[1]-ny*w1);g.closePath();};
  g.fillStyle=p.shorts;g.beginPath();g.moveTo(-.16,-.06);g.lineTo(.16,-.06);g.lineTo(.2+s.k2[0]*.3,.22);g.lineTo(-.18+s.k1[0]*.3,.22);g.closePath();g.fill();
  const jg=g.createLinearGradient(0,s.nk[1],0,0);jg.addColorStop(0,p.col);jg.addColorStop(1,p.col2||shade(p.col,-.2));g.fillStyle=jg;q4([0,.02],[s.nk[0]*.96,s.nk[1]*.96],.19,.215);g.fill();
  if(p.num){g.save();g.translate(s.nk[0]*.5,s.nk[1]*.5);g.rotate(Math.atan2(tdir[0],-tdir[1]));g.scale(p.f,1);g.fillStyle=p.numCol;g.font="800 .24px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(p.num,0,0);g.restore();}
  /* near leg */
  limb(O,s.k2,s.f2,.175,.135,skin);pad(s.k2,"#16141a");lw(.105,"#f4efe6");g.beginPath();const sk2=[lerp(s.k2[0],s.f2[0],.78),lerp(s.k2[1],s.f2[1],.78)];g.moveTo(sk2[0],sk2[1]);g.lineTo(s.f2[0],s.f2[1]);g.stroke();shoe(s.f2,s.k2,p.shoe);
  /* head */
  g.fillStyle=skin;g.beginPath();g.arc(s.hd[0],s.hd[1],.128,0,TAU);g.fill();
  g.fillStyle=p.hair;g.beginPath();const ha=Math.atan2(s.hd[1]-s.nk[1],s.hd[0]-s.nk[0]);g.arc(s.hd[0],s.hd[1],.136,ha-Math.PI*.95,ha+Math.PI*.45);g.lineTo(s.hd[0],s.hd[1]);g.closePath();g.fill();
  g.fillStyle="#141217";g.beginPath();g.arc(s.hd[0]+Math.cos(ha+1.25)*.075,s.hd[1]+Math.sin(ha+1.25)*.075,.018,0,TAU);g.fill();
  /* near arm last, so it shows over the body */
  limb(s.so,s.e2,s.h2,.12,.1,skin);g.fillStyle=skin;g.beginPath();g.arc(s.h2[0],s.h2[1],.055,0,TAU);g.fill();
  if(p.dim){g.globalCompositeOperation="source-atop";g.fillStyle=`rgba(10,10,18,${p.dim})`;g.fillRect(-2,-3,4,4);}
  g.restore();
  if(p.label){D.small(g,p.label,X,Y-(SEG.tor+.5)*sc-6,11,"rgba(255,255,255,.75)","center");}};
function shade(hex,k){const m=/^#?([0-9a-f]{6})$/i.exec(hex||"");if(!m)return hex;const n=parseInt(m[1],16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=x=>clamp(Math.round(k<0?x*(1+k):x+(255-x)*k),0,255);return `rgb(${f(r)},${f(g)},${f(b)})`;}
C.shade=shade;
/* the two kits */
C.ours=(o)=>Object.assign({col:A.K.col(),numCol:"#141217",shorts:"#141217",hair:"#141217"},o||{});
C.theirs=(o)=>Object.assign({col:"#e8ecf2",col2:"#b9c3d2",numCol:"#1f3b73",shorts:"#1f3b73",hair:"#2a1d14",skin:"#c99673",shoe:"#20283a"},o||{});

/* ---------- player physics ---------- */
C.PG=17;/* athletes fall faster than the ball: snappy jumps */
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
