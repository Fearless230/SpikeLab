/* hero.js: the home screen arena in real 3D (gl.js). Your position's technique plays on a loop with bullet time at contact:
   outside = 4-step spike against a block, opposite = jump serve, middle = block, setter = jump set, libero = dig. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const G=VB.GL;
/* per position: athlete root placement, extras, camera path around the athlete (relative to its pelvis) */
const SHOTS={
  outside:{clip:"spike",at:[0,0,-2.6],cam:t=>[-2.5+Math.sin(t*.12)*.3,1.15,1.7+Math.sin(t*.09)*.3],look:[1.2,1.65,-.5],maxX:-.8,block:true,setter:true},
  any:{clip:"spike",at:[0,0,-2.6],cam:t=>[-2.5+Math.sin(t*.12)*.3,1.15,1.7+Math.sin(t*.09)*.3],look:[1.2,1.65,-.5],maxX:-.8,block:true,setter:true},
  opposite:{clip:"serve",at:[0,0,2.2],cam:t=>[-2.6+Math.sin(t*.1)*.3,1.2,1.9+Math.sin(t*.13)*.3],look:[2.5,1.6,-.7]},
  middle:{clip:"block",at:[0,0,0],cam:t=>[-3.2+Math.sin(t*.1)*.4,1.5,2.3+Math.sin(t*.12)*.5],look:[.2,1.5,.4],hitter:true},
  setter:{clip:"set",at:[0,0,1.2],cam:t=>[1.6+Math.sin(t*.1)*.3,1.1,-3.4+Math.sin(t*.12)*.4],look:[0,1.45,0],hitterLeft:true},
  libero:{clip:"dig",at:[0,0,-.6],cam:t=>[-2.6+Math.sin(t*.1)*.3,.7,2.6+Math.sin(t*.12)*.4],look:[.4,.85,.2]}
};
VB.hero=(function(){
  let sigLast="",host=null,cv=null,R=null,scene=null,arena=null,cam={fov:34,pos:[4,1.5,2],target:[0,1.2,0],near:.1,far:120},key=null,color="#ec3b52",actors=[],main=null,shot=null,time=0,last=0,visible=true,failed=false,ptr=[0,0],ptrT=[0,0],W=0,H=0;
  let T=0,rally=null;
  function size(){if(!cv||!host)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;if(r.width!==W||r.height!==H){W=r.width;H=r.height;R.setSize(W,H,Math.min(window.devicePixelRatio||1,1.6));}}
  /* ---- the rally: every player plays their clip once per loop, timed so the ball goes hand to hand ---- */
  const A=()=>VB.Athlete,NET=2.43,BR=.105,g=9.81;
  const toWorld=(p,pt)=>{const r=p.root,s=r.scl[0],c=Math.cos(r.rot[1]||0),sn=Math.sin(r.rot[1]||0),x=pt[0]*s,z=pt[2]*s;return [r.pos[0]+c*x+sn*z,r.pos[1]+pt[1]*s,r.pos[2]-sn*x+c*z];};
  const toLocal=(p,w)=>{const r=p.root,s=r.scl[0],c=Math.cos(r.rot[1]||0),sn=Math.sin(r.rot[1]||0),x=w[0]-r.pos[0],z=w[2]-r.pos[2];return [(c*x-sn*z)/s,(w[1]-r.pos[1])/s,(sn*x+c*z)/s];};
  const ballAt=(act,which)=>toWorld(act.p,A().handAt(act.p.a,act.p.clip,act.p.clip.contact,which));
  // keep every player off the net: shift them back until no joint below the tape reaches the centre line
  const clearNet=(act,blocker)=>A().keepOffNet(act.p,{net:NET,blocker,snap:blocker}),blockReach=(act,tC)=>A().blockerArms(act.p,{net:NET,tC});
  const flight=(P0,P1,t0,t1)=>{const d=t1-t0,v=[(P1[0]-P0[0])/d,(P1[1]-P0[1])/d+.5*g*d,(P1[2]-P0[2])/d];return t=>{const u=t-t0;return [P0[0]+v[0]*u,P0[1]+v[1]*u-.5*g*u*u,P0[2]+v[2]*u];};};
  function bounces(P,t0,vel,n){const segs=[];let p=[P[0],BR,P[2]],t=t0,vy=Math.abs(vel[1])*.55,vx=vel[0]*.7,vz=vel[2]*.7;
    for(let i=0;i<n;i++){const d=2*vy/g,a=p.slice(),vv=[vx,vy,vz],ts=t;segs.push([ts,ts+d,u=>{const k=u-ts;return [a[0]+vv[0]*k,BR+vv[1]*k-.5*g*k*k,a[2]+vv[2]*k];}]);p=[a[0]+vx*d,BR,a[2]+vz*d];t+=d;vy*=.55;vx*=.8;vz*=.8;}return segs;}
  function makeRally(){const per=rally.period,segs=[];const ev=rally.events(segs);rally.segs=segs;rally.ev=ev;}
  function ballWorld(t){for(const [t0,t1,f] of rally.segs)if(t>=t0&&t<t1)return f(t);return null;}
  function build(){if(!R)return;const prof=(VB.state&&VB.state.profile)||{},lefty=prof.hand==="left";
    scene=VB.Arena.scene({});arena=VB.Arena.build({accent:color,netH:NET});scene.root=new G.Node();scene.root.add(arena.root);
    shot=SHOTS[key]||SHOTS.any;actors=[];
    const mk=(o,at,rot)=>{const p=VB.Athlete.player(o);p.root.pos=at.slice();p.root.rot=[0,rot||0,0];scene.root.add(p.root);return p;};
    main=mk({...VB.lookOpts(prof.look),clip:shot.clip,jersey:color,accent:"#ffffff",number:prof.number!=null?prof.number:7,lefty,height:Math.max(1.6,Math.min(2.1,(prof.height||190)/100)),trailColor:color,
      ballFn:()=>{const w=rally&&ballWorld(T);return w?toLocal(main,w):null;}},shot.at);
    const M={p:main,off:0};actors.push(M);
    const opp={jersey:"#f2f1fa",accent:"#5b2bff",shorts:"#5b2bff",skin:"#8d5a3f",hair:"#140d0a",ball:false},mate=o=>Object.assign({jersey:color,accent:"#ffffff",ball:false},o);
    const add=(o,at,rot,over)=>{const x={p:mk(o,at,rot),off:0};actors.push(x);clearNet(x,over);return x;};
    clearNet(M,shot.clip==="block");
    const C=x=>x.p.clip.contact;
    if(shot.clip==="spike"){
      const S=add(mate({clip:"set",number:3,skin:"#e3b48f",hair:"#6b4423"}),[-.5,0,.95]);
      const B1=add(Object.assign({},opp,{clip:"block",number:12}),[.4,0,-3.4],Math.PI,true),B2=add(Object.assign({},opp,{clip:"block",number:4,skin:"#e0b090",hair:"#5a3a1c"}),[.4,0,-2.4],Math.PI,true);
      const tHit=2.9,tSet=tHit-1.05;M.off=tHit-C(M);S.off=tSet-C(S);B1.off=B2.off=tHit+.04-C(B1);blockReach(B1,C(B1));blockReach(B2,C(B2));
      rally={period:Math.max(M.off+M.p.clip.dur,6),events(segs){const pS=ballAt(S,"both"),pH=ballAt(M,"R"),from=[-7,1.2,1.6],land=[7.6,BR,.9];
        segs.push([tSet-1.15,tSet,flight(from,pS,tSet-1.15,tSet)]);segs.push([tSet,tHit,flight(pS,pH,tSet,tHit)]);
        const f=flight(pH,land,tHit,tHit+.48);segs.push([tHit,tHit+.48,f]);const v=[(land[0]-pH[0])/.48,-(f(tHit+.48)[1]-f(tHit+.47)[1])/.01,(land[2]-pH[2])/.48];segs.push(...bounces(land,tHit+.48,[v[0]*.5,v[1],v[2]*.5],3));}};}
    else if(shot.clip==="block"){
      const Hh=add(Object.assign({},opp,{clip:"spike",number:9}),[.6,0,-.4],Math.PI);
      const tHit=2.7;Hh.off=tHit-C(Hh);M.off=tHit+.07-C(M);
      const blk=blockReach(M,C(M));
      rally={period:Math.max(Hh.off+Hh.p.clip.dur,M.off+M.p.clip.dur,6),events(segs){const pH=ballAt(Hh,"R"),pB=blk(),from=[7,1.4,1.2];
        segs.push([tHit-1.0,tHit,flight(from,pH,tHit-1.0,tHit)]);const tB=tHit+.07;segs.push([tHit,tB,flight(pH,pB,tHit,tB)]);
        // the rebound pops up off the hands (so it clears the tape) and drops on the hitter's side
        const land=[2.2,BR,pB[2]+.5];segs.push([tB,tB+.95,flight(pB,land,tB,tB+.95)]);segs.push(...bounces(land,tB+.95,[2,-5,.4],3));}};}
    else if(shot.clip==="set"){
      const Hh=add(mate({clip:"spike",number:11,skin:"#7a4b33",hair:"#0f0a08"}),[-.4,0,1.2-4.4]);
      const tSet=1.95,tHit=tSet+1.05;M.off=tSet-C(M);Hh.off=tHit-C(Hh);
      rally={period:Math.max(Hh.off+Hh.p.clip.dur,M.off+M.p.clip.dur,6),events(segs){const pS=ballAt(M,"both"),pH=ballAt(Hh,"R"),from=[-7,1.2,.4],land=[7.6,BR,-1.6];
        segs.push([tSet-1.15,tSet,flight(from,pS,tSet-1.15,tSet)]);segs.push([tSet,tHit,flight(pS,pH,tSet,tHit)]);segs.push([tHit,tHit+.5,flight(pH,land,tHit,tHit+.5)]);segs.push(...bounces(land,tHit+.5,[5,-6,.3],3));}};}
    else{ // serve, dig: one player; the clip's own ball path already meets the hand
      M.off=.4;rally=null;main.root.pos=shot.at.slice();}
    if(rally)makeRally();
    T=0;time=0;}
  function clipT(x){const c=x.p.clip;return Math.max(0,Math.min(c.dur-1e-3,T-x.off));}
  function warp(t){const c=main.clip.contact;if(c==null)return 1;const d=Math.min(Math.abs(t-c),Math.abs(t-c-main.clip.dur),Math.abs(t-c+main.clip.dur));return 1-.8*Math.exp(-Math.pow(d/.13,2));}
  function render(dt){if(!R||!scene)return;size();time+=dt;const k=VB.reduced?0:warp(main.t);
    if(rally){if(!VB.reduced)T=(T+dt*k)%rally.period;
      actors.forEach(x=>{const tt=clipT(x),d=tt-x.p.t;if(d>0&&d<.2){x.p.t=tt-d;x.p.update(d);}else{x.p.t=tt;x.p.update(0);}});}
    else{if(!VB.reduced){main.update(dt*k);}else main.update(0);}
    arena.update(time);
    ptr[0]+=(ptrT[0]-ptr[0])*.05;ptr[1]+=(ptrT[1]-ptr[1])*.05;
    const land=W>=H*1.05,P=main.a.pelvis.pos,rt=main.root.pos,base=[rt[0]+P[0],0,rt[2]+P[2]],c=shot.cam(time),push=(1-k)*.5;
        cam.target=[base[0]+shot.look[0],Math.max(.8,shot.look[1]+(P[1]-.9)*.9),base[2]+shot.look[2]];
    // framing: pulled back so the whole upper body reads, and pushed to the right (desktop) or the top (phone) so it
    // sits beside the headline instead of on it
    const far=land?1.55:1.8;cam.pos=[base[0]+c[0]*far*(1-push*.25)+ptr[0]*.5,c[1]*(land?1:1.15)+ptr[1]*-.3+(P[1]-.9)*.5,base[2]+c[2]*far*(1-push*.25)];if(shot.maxX!=null)cam.pos[0]=Math.min(cam.pos[0],shot.maxX);
    cam.fov=land?34:50;cam.shift=land?-.56:0;cam.shiftY=land?0:-.42;
    R.render(scene,cam);}
  return {
    mount(el){if(failed)return;if(!cv){cv=document.createElement("canvas");cv.className="herocv";cv.setAttribute("aria-hidden","true");try{R=G.renderer(cv,{alpha:false});}catch(e){R=null;}if(!R){failed=true;return;}
        if(window.IntersectionObserver)new IntersectionObserver(es=>{visible=es.some(e=>e.isIntersecting);}).observe(cv);
        window.addEventListener("pointermove",e=>{if(!host)return;const r=host.getBoundingClientRect();ptrT=[Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))];},{passive:true});
        new ResizeObserver(()=>size()).observe(document.body);}
      if(host!==el){host=el;el.prepend(cv);W=H=0;size();}},
    set(k,c){const nk=SHOTS[k]?k:"any",pr=(VB.state&&VB.state.profile)||{},sig=nk+"|"+(c||color)+"|"+JSON.stringify([pr.look,pr.number,pr.hand,pr.height,VB.locker&&VB.locker()]);if(sig===sigLast&&scene)return;sigLast=sig;key=nk;color=c||color;build();},
    frame(now){if(!R||!visible||!scene)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;render(dt);},
    refresh(){if(key)this.set(key,color);},
    debug(t){if(!scene)return;if(rally){T=t;actors.forEach(x=>{x.p.snap&&x.p.snap();x.p.t=clipT(x);x.p.update(0);});render(0);return;}main.t=t;actors.forEach(a=>a.p.snap&&a.p.snap());render(0);},
    // test hook: world joints of every player and the ball at rally time t
    inspect(t){if(!scene)return null;if(rally){T=t;actors.forEach(x=>{x.p.snap&&x.p.snap();x.p.t=clipT(x);x.p.update(0);});}else{main.t=t;main.update(0);}const out={why:actors.map(x=>x.why),T:t,period:rally?rally.period:main.clip.dur,actors:actors.map(x=>{const Wp=x.p.a.W.p,pts=[];for(let b=0;b<Wp.length/3;b++)pts.push(toWorld(x.p,[Wp[b*3],Wp[b*3+1],Wp[b*3+2]]));return {clip:x.p.clip.name,t:x.p.t,pts};})};
      const bn=main.ball;out.ball=bn&&bn.visible?toWorld(main,bn.pos):null;return out;},
    label(){return main?main.label:"";}
  };
})();
})();
