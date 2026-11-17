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
  function size(){if(!cv||!host)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;if(r.width!==W||r.height!==H){W=r.width;H=r.height;R.setSize(W,H,Math.min(window.devicePixelRatio||1,1.6));}}
  function build(){if(!R)return;const prof=(VB.state&&VB.state.profile)||{},lefty=prof.hand==="left";
    scene=VB.Arena.scene({});arena=VB.Arena.build({accent:color});scene.root=new G.Node();scene.root.add(arena.root);
    shot=SHOTS[key]||SHOTS.any;actors=[];
    main=VB.Athlete.player({...VB.lookOpts(prof.look),clip:shot.clip,jersey:color,accent:"#ffffff",number:prof.number!=null?prof.number:7,lefty,height:Math.max(1.6,Math.min(2.1,(prof.height||190)/100)),trailColor:color});
    main.root.pos=shot.at.slice();scene.root.add(main.root);actors.push({p:main,sync:null});
    const opp={jersey:"#f2f1fa",accent:"#5b2bff",shorts:"#5b2bff",skin:"#8d5a3f",hair:"#140d0a",ball:false};
    if(shot.block){const b=VB.Athlete.player(Object.assign({},opp,{clip:"block",number:12}));b.root.pos=[0,0,-2.6-.95];b.root.rot=[0,Math.PI,0];scene.root.add(b.root);
      actors.push({p:b,sync:t=>{const tb=t-.42;return tb<0||tb>3.7?0:tb;}});
      const b2=VB.Athlete.player(Object.assign({},opp,{clip:"block",number:4,skin:"#e0b090",hair:"#5a3a1c"}));b2.root.pos=[0,0,-2.6+.15];b2.root.rot=[0,Math.PI,0];scene.root.add(b2.root);
      actors.push({p:b2,sync:t=>{const tb=t-.47;return tb<0||tb>3.7?0:Math.min(tb,3.7);}});}
    if(shot.setter){const s=VB.Athlete.player({clip:"set",jersey:color,accent:"#ffffff",number:3,ball:false,skin:"#e3b48f",hair:"#6b4423"});s.root.pos=[.17,0,-2.6+3.55];scene.root.add(s.root);
      actors.push({p:s,sync:t=>{const ts=t+.65;return ts>3.9?3.9:ts;}});}
    if(shot.hitter){const h=VB.Athlete.player(Object.assign({},opp,{clip:"spike",number:10}));h.root.pos=[0,0,-.0];h.root.rot=[0,Math.PI,0];scene.root.add(h.root);actors.push({p:h,sync:t=>{const th=t+.42;return th%4.6;}});}
    if(shot.hitterLeft){const h=VB.Athlete.player({clip:"spike",jersey:color,accent:"#ffffff",number:11,ball:false,skin:"#7a4b33",hair:"#0f0a08"});h.root.pos=[.1,0,1.2-4.4];scene.root.add(h.root);actors.push({p:h,sync:t=>{const th=t+.7;return th%4.6;}});}
    time=0;}
  function warp(t){const c=main.clip.contact;if(c==null)return 1;const d=Math.min(Math.abs(t-c),Math.abs(t-c-main.clip.dur),Math.abs(t-c+main.clip.dur));return 1-.8*Math.exp(-Math.pow(d/.13,2));}
  function render(dt){if(!R||!scene)return;size();time+=dt;const k=VB.reduced?0:warp(main.t);
    if(!VB.reduced){main.update(dt*k);}else main.update(0);
    actors.forEach(a=>{if(a.sync){a.p.t=a.sync(main.t);a.p.update(0);}});
    arena.update(time);
    ptr[0]+=(ptrT[0]-ptr[0])*.05;ptr[1]+=(ptrT[1]-ptr[1])*.05;
    const land=W>=H*1.05,P=main.a.pelvis.pos,rt=main.root.pos,base=[rt[0]+P[0],0,rt[2]+P[2]],c=shot.cam(time),push=(1-k)*.5;
        cam.target=[base[0]+shot.look[0],Math.max(.8,shot.look[1]+(P[1]-.9)*.9),base[2]+shot.look[2]];
    const far=land?1:1.45;cam.pos=[base[0]+c[0]*far*(1-push*.25)+ptr[0]*.5,c[1]*(land?1:1.15)+ptr[1]*-.3+(P[1]-.9)*.5,base[2]+c[2]*far*(1-push*.25)];if(shot.maxX!=null)cam.pos[0]=Math.min(cam.pos[0],shot.maxX);
    cam.fov=land?34:50;cam.shift=land?-.32:0;cam.shiftY=land?0:-.32;
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
    debug(t){if(!scene)return;main.t=t;actors.forEach(a=>a.p.snap&&a.p.snap());render(0);},
    label(){return main?main.label:"";}
  };
})();
})();
