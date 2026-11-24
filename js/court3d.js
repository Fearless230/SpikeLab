/* court3d.js: technique scenes on the arena court (gl.js). Every player is a full athlete running its technique clip:
   the 4-step spike follows the approach marks, blockers jump, setters jump set, passers move and dig, servers jump serve. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
VB.reduced=!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
const G=VB.GL,{Node,M4}=G;
VB.court=(function(){
  let R=null,cv=null,stage=null,cb={},inited=false,ok=false,scene=null,arena=null,group=null,zoneG=null,cam={fov:40,pos:[-12,7,8],target:[-2,1,0],near:.1,far:140},orbit=null;
  let ballFx=null,fxT=0,cur=null,curOpts={},seq=[],total=3,tAnim=0,playing=!VB.reduced,slow=false,last=0,netH=2.43,people=[],picked=null,ring=null,ball=null,showZones=false,phaseLabel="",W=0,H=0;
  const ACC=()=>(getComputedStyle(document.documentElement).getPropertyValue("--gold").trim()||"#ec3b52");
  function label(text,round,color){const c=G.canvasTex(round?128:512,round?128:96,(g,w,h)=>{if(round){g.fillStyle=color||"#fff";g.beginPath();g.arc(64,64,58,0,7);g.fill();g.fillStyle="#17144d";g.font="800 76px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(text,64,70);}
      else{g.font="700 46px 'Barlow Condensed','Arial Narrow',sans-serif";const tw=Math.min(500,g.measureText(text).width+40);g.fillStyle="rgba(23,20,77,.92)";g.fillRect(256-tw/2,14,tw,68);g.fillStyle=color||"#ec3b52";g.fillRect(256-tw/2,14,6,68);g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";g.fillText(text,256,50,480);}});
    const n=new Node(G.quad(round?.5:2.6,round?.5:.49),G.mat({map:c,unlit:true,transparent:true,depthTest:false,depthWrite:false,fog:false}));n.billboard=true;n.renderOrder=10;return n;}
  const at=(p,t)=>[p.a[0]+(p.b[0]-p.a[0])*t,p.a[1]+(p.b[1]-p.a[1])*t+4*(p.arc||0)*t*(1-t),p.a[2]+(p.b[2]-p.a[2])*t];
  function fail(){const d=document.createElement("div");d.className="fallback";d.textContent="The 3D court could not start in this browser. The coaching notes beside it cover the same points.";stage.appendChild(d);}
  function size(){if(!ok)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||(w===W&&h===H))return;W=w;H=h;R.setSize(w,h,Math.min(window.devicePixelRatio||1,1.75));}
  function init(){inited=true;cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";
    try{R=G.renderer(cv,{});}catch(e){R=null;}if(!R){fail();return;}stage.insertBefore(cv,stage.firstChild);
    scene=VB.Arena.scene({fogN:26,fogF:60,sky:[.5,.5,.68],c1:[1,.96,.92]});scene.root=new Node();
    arena=VB.Arena.build({accent:ACC(),netH,dust:false});scene.root.add(arena.root);
    zoneG=new Node();zoneG.visible=false;scene.root.add(zoneG);
    [[4,-1.5,-3],[3,-1.5,0],[2,-1.5,3],[5,-6,-3],[6,-6,0],[1,-6,3]].forEach(z=>{const s=label(String(z[0]),true,"#7fb7e6");s.pos=[z[1],.35,z[2]];s.scl=[1.4,1.4,1];zoneG.add(s);});
    group=new Node();scene.root.add(group);
    const LK=VB.locker?VB.locker():{ball:"classic",fx:"trail"};ball=new Node(VB.Athlete.ballGeo(),VB.Athlete.ballMatKind?VB.Athlete.ballMatKind(LK.ball,ACC()):VB.Athlete.ballMat());ball.castShadow=true;scene.root.add(ball);ballFx=VB.BallFX?VB.BallFX(scene.root,LK.fx,ACC()):null;
    ring=new Node(G.ring(.46,.53,40),G.mat({color:"#ffffff",unlit:true,transparent:true,depthWrite:false}));ring.visible=false;scene.root.add(ring);
    orbit=G.orbit(cv,cam,{min:2.5,max:40,maxPolar:Math.PI/2-.04});
    let down=null;
    const hit=e=>{if(!cam.vp)return null;const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let best=null,bd=1e9;
      people.forEach(p=>{const A=p.player.a;[A.pelvis,A.chest,A.head,A.legs.L.kn,A.legs.R.kn,A.arms.L.el,A.arms.R.el].forEach(j=>{const w=j.worldPos(),q=R.project(w,cam);if(q[2]>1)return;const x=(q[0]+1)/2*r.width,y=(1-q[1])/2*r.height,d=Math.hypot(x-mx,y-my);if(d<bd){bd=d;best=p;}});});
      return bd<Math.max(26,r.width*.025)?best:null;};
    cv.addEventListener("pointerdown",e=>{down=[e.clientX,e.clientY];});
    cv.addEventListener("pointerup",e=>{if(!down)return;const mv=Math.hypot(e.clientX-down[0],e.clientY-down[1]);down=null;if(mv>6)return;select(hit(e));});
    cv.addEventListener("pointermove",e=>{if(e.pointerType==="touch"||down)return;cv.style.cursor=hit(e)?"pointer":"grab";});
    new ResizeObserver(size).observe(stage);ok=true;size();if(cur)build(cur,curOpts);}
  function select(p){picked=p||null;ring.visible=!!p;cb.onPick&&cb.onPick(p?p.info:null);}
  const pelvisWorld=p=>{const r=p.player.root,P=p.player.a.pelvis.pos,c=Math.cos(r.rot[1]),s=Math.sin(r.rot[1]);return [r.pos[0]+c*P[0]+s*P[2],0,r.pos[2]-s*P[0]+c*P[2]];};
  function view(name){if(!ok)return;const me=people.find(p=>p.info.me),mp=me?pelvisWorld(me):[-6,0,0],mx=mp[0],mz=mp[2];
    const V={scene:[cur&&cur.cam||[-12,7,8],cur&&cur.look||[-2,1,0]],behind:[[Math.min(-8,mx-6.5),3.2,mz*.6],[0,1.6,mz*.3]],side:[[0,6.5,-15],[0,1,0]],top:[[-.01,24,.01],[0,0,0]],net:[[.4,2.2,-7.5],[0,2.1,0]],eye:[[mx-.3,1.75,mz],[mx+6,1.9,mz*.5]]}[name];if(!V)return;
    cam.pos=V[0].slice();cam.target=V[1].slice();orbit.sync();}
  /* which clip a scene player runs, and where its clip contact must land */
  function clipFor(p,s){const pose=p.pose==="up"?"block":p.pose;if(s&&s.wall!==undefined)return {up:"block",block:"block",set:"set",swing:"float",platform:"dig"}[pose]||"ready";if(p.me&&curOpts.tech&&VB.Athlete.byTech[curOpts.tech]){const c=VB.Athlete.byTech[curOpts.tech];if(c!=="set"||pose==="set")return c;}
    if(pose==="swing")return p.x<-7.5||p.x>7.5?"serve":"spike";
    return {block:"block",platform:"dig",set:"set",ready:"ready"}[pose]||"ready";}
  function place(pl,p,name,s){const clip=VB.Athlete.CLIPS[name],tc=clip.contact!=null?clip.contact:0;let yaw;
    if(p.opp)yaw=Math.PI;else if(name==="set"||name==="dump")yaw=(p.face!=null?p.face:Math.PI/2)-Math.PI/2;
    else if(p.me&&s.steps&&s.steps.length>1&&/^(spike|pipe|slide|sprawl|jumpfloat|serve|quick|shoot|tip|roll|cut|sidedive)$/.test(name)){const st=s.steps.slice().sort((a,b)=>a.n-b.n),a=st[0],A=v=>Math.atan2(-v[1],v[0]),P0=VB.Athlete.sample(clip,0,pl.a.lefty),P1=VB.Athlete.sample(clip,tc,pl.a.lefty);
      yaw=A([p.x-a.x,p.z-a.z])-A([P1.x-P0.x,P1.z-P0.z]);}
    else yaw=p.face||0;
    const P=VB.Athlete.sample(clip,tc,pl.a.lefty,pl.a),k=pl.root.scl[0]||1,c=Math.cos(yaw),sn=Math.sin(yaw),ox=(c*P.x+sn*P.z)*k,oz=(-sn*P.x+c*P.z)*k;
    pl.root.rot=[0,yaw,0];pl.root.pos=[p.x-ox,0,p.z-oz];}
  function build(s,opts){cur=s;curOpts=opts||{};if(!ok)return;
    group.clear();people=[];select(null);const acc=ACC(),prof=(VB.state&&VB.state.profile)||{};
    // off-court drills: the net goes away and, when the drill uses one, a wall stands where the net was
    if(arena.netG)arena.netG.visible=s.wall===undefined;
    if(s.wall){const wm=G.mat({color:"#d8d3e8",rough:.85,wrap:.2}),w=new Node(G.box(.3,4,8),wm);w.pos=[.15,2,0];w.castShadow=true;group.add(w);
      const tape=new Node(G.box(.02,.05,8),G.mat({color:"#ec3b52",unlit:true}));tape.pos=[-.005,2.43,0];group.add(tape);}
    (s.zones||[]).forEach(z=>{const m=new Node(G.plane(z.w,z.d),G.mat({color:"#ec3b52",transparent:true,opacity:.42,depthWrite:false,unlit:true}));m.pos=[z.x,.014,z.z];group.add(m);
      const e=new Node(G.ring(0,0,4),G.mat({color:"#fff"}));const fr=[[z.w,.04,0,z.d/2],[z.w,.04,0,-z.d/2],[.04,z.d,z.w/2,0],[.04,z.d,-z.w/2,0]];fr.forEach(([w,d,x,zz])=>{const b=new Node(G.plane(w,d),G.mat({color:"#ffffff",unlit:true}));b.pos=[z.x+x,.018,z.z+zz];group.add(b);});
      if(z.label){const sp=label(String(z.label));sp.pos=[z.x,.6,z.z];group.add(sp);}});
    (s.steps||[]).forEach(st=>{const d=new Node(G.ring(0,.2,28),G.mat({color:"#ffffff",unlit:true}));d.pos=[st.x,.016,st.z];group.add(d);
      const fp=new Node(G.ring(.22,.27,28),G.mat({color:acc,unlit:true}));fp.pos=[st.x,.017,st.z];group.add(fp);const sp=label(String(st.n),true);sp.pos=[st.x,.45,st.z];group.add(sp);});
    (s.players||[]).forEach((p,i)=>{const name=clipFor(p,s),tone=[["#c98d68","#2b1d16"],["#8d5a3f","#140d0a"],["#e3b48f","#6b4423"],["#6f4530","#0f0a08"],["#f0c8a0","#b07a3a"]][i%5];
      const pl=VB.Athlete.player({clip:name,ball:false,lefty:!!(p.me&&curOpts.lefty),jersey:p.me?acc:p.opp?"#f2f1fa":"#5b2bff",accent:p.opp?"#5b2bff":"#ffffff",shorts:p.opp?"#5b2bff":"#17144d",
        ...(p.me?VB.lookOpts(prof.look):{skin:tone[0],hair:tone[1],style:["short","buzz","bun","curly","ponytail"][i%5],beard:["none","stubble","none","goatee","none"][i%5],build:["athletic","lean","power","athletic","lean"][i%5],sleeve:i%3===0?"hit":"none"}),number:p.me?(prof.number!=null?prof.number:7):((Math.abs(Math.round(p.x*3+p.z*5))%17)+1),height:p.me?Math.max(1.6,Math.min(2.1,(prof.height||190)/100)):1.9});
      place(pl,p,name,s);
      // nobody touches the net: players step back from it, blockers' hands go over the tape at the block
      const blk=name==="block"&&p.pose!=="up";if(s.wall===undefined&&Math.abs(pl.root.pos[0])<4.5){VB.Athlete.keepOffNet(pl,{net:netH||2.43,blocker:blk});if(blk)pl.blockBall=VB.Athlete.blockerArms(pl,{net:netH||2.43});}
      group.add(pl.root);
      const base=new Node(G.ring(.36,.43,36),G.mat({color:p.me?acc:"#ffffff",unlit:true,transparent:true,opacity:p.me?.9:0,depthWrite:false}));base.pos=[p.x,.02,p.z];group.add(base);
      people.push({player:pl,clip:name,info:{label:p.label||(p.me?"You":p.opp?"Opponent or feeder":"Teammate"),note:p.note||"",me:!!p.me,opp:!!p.opp},home:p,ta:null,base});});
    seq=[];
    // the ball meets the hands: a path that ends or starts at a player is pinned to that player's hand at the moment of contact
    const handW=pp=>{if(pp.player.blockBall)return pp.player.blockBall();const c=VB.Athlete.CLIPS[pp.clip];if(!c||c.contact==null)return null;const l=VB.Athlete.handAt(pp.player.a,c,c.contact,c.hand||"R"),r=pp.player.root,k=r.scl[0]||1,cy=Math.cos(r.rot[1]),sy=Math.sin(r.rot[1]);
      return [r.pos[0]+(cy*l[0]+sy*l[2])*k,l[1]*k,r.pos[2]+(-sy*l[0]+cy*l[2])*k];};
    const paths=(s.paths||[]).map(p=>Object.assign({},p,{a:p.a.slice(),b:p.b.slice()}));
    people.forEach(pp=>{pp.hw=handW(pp);});
    paths.forEach(p=>{const near=v=>{let best=null,bd=2.2;people.forEach(pp=>{if(!pp.hw)return;const d=Math.hypot(v[0]-pp.home.x,v[2]-pp.home.z);if(d<bd){bd=d;best=pp;}});return best;};
      // a ball that ends low next to a digger goes into their platform instead of the floor beside them
      const qb=near(p.b);if(qb&&(p.b[1]>.3||/^(dig|sprawl|collapse|sidedive|tomahawk)$/.test(qb.clip))){p.b=qb.hw.slice();qb.pinned=true;p.bPin=qb;}
      const q2=near(p.a);if(q2){p.a=q2.hw.slice();q2.pinned=true;p.aPin=q2;}});
    paths.forEach(p=>{const pts=[];for(let i=0;i<=40;i++)pts.push(at(p,i/40));
      group.add(new Node(G.tube(pts,p.alt?.018:.03,8),G.mat({color:p.alt?"#b9a8ff":"#ffffff",unlit:true,transparent:true,opacity:p.alt?.45:.85,depthWrite:false})));
      if(p.b[1]<.3){const end=new Node(G.ring(.12,.2,24),G.mat({color:p.alt?"#b9a8ff":"#ffffff",unlit:true}));end.pos=[p.b[0],.02,p.b[2]];group.add(end);}
      if(p.label){const sp=label(String(p.label));const m=at(p,.5);sp.pos=[m[0],m[1]+.45,m[2]];sp.scl=[.8,.8,1];group.add(sp);}
      if(p.seq){let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]);seq.push({p,dur:Math.max(.25,len/(p.fast?17:8.5))});}});
    let t=0;seq.forEach(x=>{x.t0=t;t+=x.dur;});
    // each player's contact lines up with the moment the ball arrives at them
    people.forEach(pp=>{const h=pp.home;let best=null;
      seq.forEach(x=>{if(x.p.bPin===pp&&(!best||!best.pin||x.t0+x.dur<best.t))best={pin:true,t:x.t0+x.dur};if(x.p.aPin===pp&&(!best||!best.pin||x.t0<best.t))best={pin:true,t:x.t0};});
      if(!best)seq.forEach(x=>{const d=Math.hypot(x.p.b[0]-h.x,x.p.b[2]-h.z);if(d<2.2&&(!best||d<best.d))best={d,t:x.t0+x.dur};
        const d2=Math.hypot(x.p.a[0]-h.x,x.p.a[2]-h.z);if(d2<2.2&&(!best||d2<best.d))best={d:d2,t:x.t0};});pp.ta=best?best.t:null;});
    let lead=0;people.forEach(pp=>{if(pp.ta==null)return;const c=VB.Athlete.CLIPS[pp.clip],tc=c.contact!=null?c.contact:c.dur*.4;lead=Math.max(lead,tc-pp.ta);});
    if(lead>0){seq.forEach(x=>x.t0+=lead);people.forEach(pp=>{if(pp.ta!=null)pp.ta+=lead;});}
    leadIn=lead;let tEnd=t+lead+1.6;people.forEach(pp=>{if(pp.ta==null)return;const c=VB.Athlete.CLIPS[pp.clip],tc=c.contact!=null?c.contact:c.dur*.4;tEnd=Math.max(tEnd,pp.ta-tc+c.dur);});
    const me=people.find(p=>p.info.me),meClip=me?VB.Athlete.CLIPS[me.clip]:null;
    total=Math.max(meClip?meClip.dur:3.2,tEnd);
    tAnim=0;animate();view("scene");}
  let leadIn=0;
  function animate(){const scT=tAnim;let lab="";
    if(seq.length){let t=scT-leadIn,done=false;if(t<0)t=0;for(const x of seq){if(t<=x.dur){ball.pos=at(x.p,t/x.dur);done=true;break;}t-=x.dur;}if(!done)ball.pos=at(seq[seq.length-1].p,1);ball.visible=true;ball.rot=[scT*7,scT*3,0];}else ball.visible=false;
    people.forEach(pp=>{const c=VB.Athlete.CLIPS[pp.clip],tc=c.contact!=null?c.contact:c.dur*.4;let tt;
      if(pp.ta!=null){tt=scT-pp.ta+tc;if(tt<0)tt=0;if(tt>c.dur-.001)tt=c.dur-.001;}else tt=(scT*(c.dur/total))%c.dur;
      if(ball&&ball.visible){const r=pp.player.root,c=Math.cos(r.rot[1]),sn=Math.sin(r.rot[1]),k=1/(r.scl[0]||1),dx=ball.pos[0]-r.pos[0],dz=ball.pos[2]-r.pos[2];pp.player.look([(c*dx-sn*dz)*k,ball.pos[1]*k,(sn*dx+c*dz)*k]);}else pp.player.look(null);
      pp.player.t=tt;pp.player.update(0);if(pp.info.me)lab=pp.player.label;});
    phaseLabel=lab;
    if(picked){const w=pelvisWorld(picked);ring.pos=[w[0],.03,w[2]];}}
  return {
    init(el,callbacks){stage=el;cb=callbacks||{};},
    show(){if(!inited)init();size();},
    select(s,opts){build(s,opts);},
    setNet(h){if(!h||h===netH)return;netH=h;if(ok)arena.setNet(h);},
    view,resetCam(){view("scene");},
    toggle(){playing=!playing;return playing;},playing:()=>playing,
    toggleSlow(){slow=!slow;return slow;},
    toggleZones(){showZones=!showZones;if(zoneG)zoneG.visible=showZones;return showZones;},
    frac(){return total?tAnim/total:0;},
    seek(f){playing=false;tAnim=f*total;if(ok){people.forEach(p=>p.player.snap&&p.player.snap());animate();}},
    phase:()=>phaseLabel,
    // test hook: every player's joints in world space, the ball, and the clip times at scene time t
    inspect(t){if(!ok)return null;tAnim=t;people.forEach(p=>p.player.snap&&p.player.snap());animate();
      return {netH,total,lead:leadIn,ball:ball&&ball.visible?ball.pos.slice():null,net:arena.netG?arena.netG.visible:false,
        players:people.map(pp=>{const Wp=pp.player.a.W.p,pts=[];for(let b=0;b<Wp.length/3;b++)pts.push(VB.Athlete.toWorld(pp.player,[Wp[b*3],Wp[b*3+1],Wp[b*3+2]]));const rr=pp.player.a.reach?pp.player.a.reach(pp.player.t):null;return {clip:pp.clip,ta:pp.ta,pinned:!!pp.pinned,hw:pp.hw,t:pp.player.t,me:pp.info.me,pts,reach:rr&&{k:rr.k,L:rr.L&&VB.Athlete.toWorld(pp.player,rr.L),R:rr.R&&VB.Athlete.toWorld(pp.player,rr.R)}};})};},_dbg:()=>({seqs:seq.map(x=>({t0:x.t0,dur:x.dur,a:x.p.a.map(v=>+v.toFixed(2)),b:x.p.b.map(v=>+v.toFixed(2))})),people:people.map(p=>({clip:p.clip,ta:p.ta,hw:p.hw&&p.hw.map(v=>+v.toFixed(2)),home:[p.home.x,p.home.z]})),hands:people.map(p=>p.hw&&p.hw.map(v=>+v.toFixed(2))),ta:people.map(p=>p.ta),vis:ball&&ball.visible,pos:ball&&ball.pos,scl:ball&&ball.scl,cam:cam.pos,seq:seq.length,total,t:tAnim,par:!!(ball&&ball.parent)}),
    frame(now){if(!ok)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;size();
      if(playing){const prev=tAnim;tAnim=(tAnim+dt*(slow?.3:1))%total;animate();if(ballFx){let hit=false;let acc2=0;for(const x of seq){acc2+=x.dur;if(prev-leadIn<acc2&&tAnim-leadIn>=acc2)hit=true;}ballFx.update(dt*(slow?.3:1),ball.visible?ball.pos:null,hit);}}
      if(picked&&ring.visible){const k=1+Math.sin(now/260)*.06;ring.scl=[k,k,k];}
      arena.update(now/1000);orbit.update();R.render(scene,cam);}
  };
})();
})();
