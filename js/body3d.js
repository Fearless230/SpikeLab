/* body3d.js: labelled anatomy figure (gl.js), 34 selectable muscles, skeleton layer, skin-to-bone slider, activation playback. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const G=VB.GL,{Node,M4}=G;
function b64(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;}
let _geo=null;
function normals(p,ix){const n=new Float32Array(p.length);for(let k=0;k<ix.length;k+=3){const a=ix[k]*3,b=ix[k+1]*3,c=ix[k+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  [a,b,c].forEach(q=>{n[q]+=nx;n[q+1]+=ny;n[q+2]+=nz;});}for(let i=0;i<n.length;i+=3){const l=Math.hypot(n[i],n[i+1],n[i+2])||1;n[i]/=l;n[i+1]/=l;n[i+2]/=l;}return n;}
VB.bodyGeo=function(){if(_geo)return _geo;const D=window.VB_BODY,sc=1/D.scale;
  const make=(o,mirror)=>{const q=new Int16Array(b64(o.p)),pos=new Float32Array(q.length);for(let i=0;i<q.length;i++)pos[i]=q[i]*sc;
    let idx=o.w===4?new Uint32Array(b64(o.i)):new Uint16Array(b64(o.i));
    if(mirror){for(let i=0;i<pos.length;i+=3)pos[i]=-pos[i];idx=idx.slice();for(let i=0;i<idx.length;i+=3){const t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t;}}
    let col=null;if(o.s){const s=new Uint8Array(b64(o.s));col=new Float32Array(s.length*3);for(let i=0;i<s.length;i++){const v=s[i]/255;col[i*3]=col[i*3+1]=col[i*3+2]=v;}}
    const g=G.geo(pos,normals(pos,idx),idx,null,col);G.bounds(g);return g;};
  _geo={skin:make(D.skin),muscles:{}};for(const id in D.m){const o=D.m[id];_geo.muscles[id]=o.c?[make(o)]:[make(o),make(o,true)];}return _geo;};
VB.heroFigure=function(){return null;};
VB.body=(function(){
  let R=null,cv=null,ok=false,inited=false,stage,tip,labelLayer,cb={},scene=null,cam={fov:32,pos:[1.4,1.15,4.4],target:[0,.93,0],near:.05,far:40},orbit=null,W=0,H=0;
  const meshes=[],mats={},anchors={},labels={};let hover=null,active=null,colorFn=null,labelMode="key",skel=null,skinMat=null,skinN=null,xr=0,anim=null,phaseCb=null;
  const LOW=[0x5a,0x52,0xb0],HIGH=[0xec,0x3b,0x52];
  const accC=()=>G.hex((getComputedStyle(document.documentElement).getPropertyValue("--gold").trim())||"#ec3b52");
  function heat(p){const t=Math.max(0,Math.min(1,(p-1)/4));return LOW.map((l,i)=>(l+(HIGH[i]-l)*Math.pow(t,1.3))/255);}
  function paint(){for(const id in mats){const s=colorFn?colorFn(id):{p:3,sel:false},m=mats[id],h=hover===id||active===id;
    if(s.sel){let a=accC();if(Math.abs(a[0]-.925)<.02&&Math.abs(a[1]-.23)<.02)a=[1,.82,.29];if(h)a=a.map(v=>Math.min(1,v+.08));m.color=a;m.emissive=a.map(v=>v*.18);}
    else{m.color=heat(s.p);m.emissive=h?[.33,.12,.11]:[0,0,0];}}}
  function fail(){const d=document.createElement("div");d.className="fallback";d.textContent="The 3D model could not start in this browser. Use the ranked muscle list to make your selection.";stage.appendChild(d);}
  function size(){if(!ok)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||(w===W&&h===H))return;W=w;H=h;R.setSize(w,h,Math.min(window.devicePixelRatio||1,2));}
  function init(){inited=true;if(!window.VB_BODY){fail();return;}
    cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";try{R=G.renderer(cv,{alpha:true});}catch(e){R=null;}if(!R){fail();return;}
    stage.insertBefore(cv,stage.firstChild);
    scene={root:new Node(),clear:[0,0,0,0],light:{sky:[.86,.85,1],gnd:[.1,.08,.3],d1:[.4,1,.6],c1:[.85,.84,.9],d2:[-.6,.4,-.6],c2:[.5,.38,.95],rim:[.55,.4,1]}};
    const disc=new Node(G.ring(0,.72,72),G.mat({color:"#1d1760",unlit:true}));scene.root.add(disc);
    const rg=new Node(G.ring(.72,.745,72),G.mat({color:"#ec3b52",unlit:true,transparent:true,opacity:.75}));rg.pos=[0,.002,0];scene.root.add(rg);
    const Gm=VB.bodyGeo();skinMat=G.mat({color:"#3a3392",rough:.6,transparent:true,opacity:1});skinN=new Node(Gm.skin,skinMat);scene.root.add(skinN);
    for(const id in Gm.muscles){const mat=G.mat({color:"#8a3a36",rough:.42,vcolor:true,polyOffset:true});mats[id]=mat;anchors[id]=[];
      Gm.muscles[id].forEach(g=>{const m=new Node(g,mat);m.userData.id=id;m.userData.c=G.bounds(g).c;scene.root.add(m);meshes.push(m);anchors[id].push(m);});}
    skel=buildSkeleton();skel.visible=false;scene.root.add(skel);
    orbit=G.orbit(cv,cam,{min:1.6,max:7,maxPolar:Math.PI-.2,minPolar:.2});
    let down=null,moveQ=null;const pickList=meshes.concat([skinN]);
    const pick=e=>{const r=cv.getBoundingClientRect(),h=R.pick(xr>.62?meshes:pickList,(e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1,cam);return h&&h.node.userData.id?h.node.userData.id:null;};
    cv.addEventListener("pointermove",ev=>{if(ev.pointerType==="touch"||down)return;const first=!moveQ;moveQ=ev;if(first)requestAnimationFrame(()=>{const e=moveQ;moveQ=null;const id=pick(e);api.setHover(id);cb.onHover&&cb.onHover(id);
      if(id){const r=stage.getBoundingClientRect(),mi=(window.VB_MUSCLE_INFO||{})[id]||{};tip.textContent=(mi.name||id)+(mi.common?" · "+mi.common:"");tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px";tip.hidden=false;cv.style.cursor="pointer";}
      else{tip.hidden=true;cv.style.cursor="grab";}});});
    cv.addEventListener("pointerleave",()=>{api.setHover(null);tip.hidden=true;});
    cv.addEventListener("pointerdown",e=>{down=[e.clientX,e.clientY];});
    cv.addEventListener("pointerup",e=>{if(!down)return;const moved=Math.hypot(e.clientX-down[0],e.clientY-down[1]);down=null;if(moved>6)return;const id=pick(e);if(id&&cb.onPick)cb.onPick(id);});
    const mi=window.VB_MUSCLE_INFO||{};
    for(const id in anchors){const d=document.createElement("div");d.className="mlabel";d.textContent=(mi[id]&&mi[id].name)||id;d.hidden=true;labelLayer.appendChild(d);labels[id]=d;}
    new ResizeObserver(size).observe(stage);ok=true;size();paint();}
  function buildSkeleton(){const g=new Node(),bone=G.mat({color:"#f3ead6",rough:.55,emissive:[.08,.07,.05]}),V=(x,y,z)=>[x,y,z||0];
    const parts=[];const cap=(a,b,r)=>{const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],L=Math.hypot(...d),u=d.map(v=>v/L),ax=[u[2],0,-u[0]],al=Math.hypot(...ax),ang=Math.acos(Math.max(-1,Math.min(1,u[1])));
      let m=M4.id();m[12]=a[0];m[13]=a[1];m[14]=a[2];if(al>1e-6){const k=ax.map(v=>v/al),c=Math.cos(ang),s=Math.sin(ang),t=1-c,[x,y,z]=k;const r=new Float32Array([t*x*x+c,t*x*y+s*z,t*x*z-s*y,0,t*x*y-s*z,t*y*y+c,t*y*z+s*x,0,t*x*z+s*y,t*y*z-s*x,t*z*z+c,0,0,0,0,1]);m=M4.mul(m,r);}else if(u[1]<0){m=M4.mul(m,M4.rx(Math.PI));}
      parts.push([G.cyl(r,r*.8,L,12),m]);[a,b].forEach(q=>parts.push([G.sphere(r*1.45,10,8),G.T(q[0],q[1],q[2])]));};
    const ell=(x,y,z,sx,sy,sz,rx)=>parts.push([G.sphere(1,20,14),G.T(x,y,z,rx||0,0,0,sx,sy,sz)]);
    ell(0,1.69,.005,.075,.095,.09);ell(0,1.6,.035,.05,.03,.055,.3);
    for(let i=0;i<24;i++){const y=.98+i*.024,z=-.07-.025*Math.sin((i/23)*Math.PI)*(i<12?1:-.4);parts.push([G.box(.03,.017,.03),G.T(0,y,z+.02)]);}
    for(let i=0;i<9;i++){const y=1.42-i*.036,w=.07+.055*Math.sin(Math.min(1,(i+1)/6)*Math.PI/2);parts.push([G.torus(1,.06,28,6,Math.PI*1.7),G.T(0,y,-.005,Math.PI/2-.25,0,-Math.PI/2-Math.PI*.85,w*1.08,w*.85,w)]);}
    parts.push([G.box(.03,.17,.012),G.T(0,1.33,.085,-.12)]);parts.push([G.torus(.1,.028,30,10),G.T(0,.94,0,1.25,0,0,1.25,1,.9)]);
    [-1,1].forEach(s=>{const X=v=>v*s;cap(V(X(.02),1.48,.05),V(X(.18),1.47,.01),.011);parts.push([G.sphere(1,10,6),G.T(X(.11),1.39,-.085,0,0,0,.06,.07,.015)]);
      cap(V(X(.2),1.44,0),V(X(.26),1.17,-.01),.018);cap(V(X(.26),1.17,-.01),V(X(.31),.89,.02),.013);cap(V(X(.27),1.17,0),V(X(.33),.9,0),.011);
      ell(X(.33),.82,.02,.025,.055,.045);cap(V(X(.09),.92,0),V(X(.11),.5,.01),.022);ell(X(.11),.5,.045,.025,.028,.012);
      cap(V(X(.11),.48,0),V(X(.11),.09,-.01),.017);cap(V(X(.135),.47,-.01),V(X(.13),.1,-.01),.008);ell(X(.11),.04,.05,.04,.025,.1);});
    g.add(new Node(G.merge(parts),bone));return g;}
  const ACTS={
    jump:[["Arm swing back, hips hinge",[ "post_delt","lats","triceps","erectors","glute_max","biceps_fem","medial_hams"]],["Countermovement: load the legs",["glute_max","rectus_fem","vastus_lat","vmo","erectors","glute_med"]],["Triple extension: hips, knees, ankles",["glute_max","vastus_lat","vmo","rectus_fem","gastroc","soleus","biceps_fem","adductors"]],["Arms drive up",["ant_delt","pec_major","upper_traps","serratus","gastroc","soleus"]],["Landing: absorb",["vastus_lat","vmo","glute_max","glute_med","tib_ant","gastroc","rectus_abs","tva"]]],
    spike:[["Approach: drive steps",["glute_max","rectus_fem","vastus_lat","gastroc","hip_flexors"]],["Plant and jump",["glute_max","vastus_lat","vmo","gastroc","soleus","post_delt","lats"]],["Bow and arrow: trunk and shoulder cocked",["infraspinatus","supraspinatus","post_delt","rectus_abs","obliques","erectors"]],["Arm swing: trunk to hand",["rectus_abs","obliques","lats","pec_major","subscapularis","ant_delt","serratus","triceps","forearm_flex"]],["Decelerate the arm",["post_delt","infraspinatus","rhomboids","lower_traps","biceps"]],["Landing: absorb",["vastus_lat","vmo","glute_max","tib_ant","rectus_abs"]]],
    block:[["Load at the net",["glute_max","vastus_lat","vmo","adductors"]],["Jump and press over",["upper_traps","mid_delt","ant_delt","serratus","triceps","gastroc","soleus","glute_max"]],["Seal the net, hands strong",["pec_major","forearm_flex","forearm_ext","rectus_abs","lats"]],["Land on two feet",["vastus_lat","vmo","glute_med","tib_ant","peroneals"]]],
    pass:[["Low and wide stance",["vastus_lat","vmo","glute_max","adductors","glute_med"]],["Shrug the platform forward",["ant_delt","serratus","pec_major","biceps","forearm_flex"]],["Lock the trunk",["rectus_abs","tva","obliques","erectors"]],["Lift with the legs, angle to target",["vastus_lat","glute_max","gastroc","tib_ant"]]]};
  function animFrame(now){if(!anim)return;const A=ACTS[anim.k],T=1.15,t=(now-anim.t0)/1000,i=Math.floor(t/T);
    if(i>=A.length){api.stop();return;}
    const f=(t-i*T)/T,amp=Math.sin(Math.min(1,f*1.6)*Math.PI*.5)*(f>.8?1-(f-.8)/.2*.6:1);
    if(anim.i!==i){anim.i=i;phaseCb&&phaseCb(anim.k,i,A[i][0],A.length);}
    const on=new Set(A[i][1]),prev=i?new Set(A[i-1][1]):new Set(),hot=[1,.82,.29],warm=[.925,.23,.32],dim=[.29,.25,.56],mix=(a,b,k)=>a.map((v,j)=>v+(b[j]-v)*k);
    for(const id in mats){const m=mats[id];if(on.has(id)){m.color=mix(warm,hot,amp);m.emissive=hot.map(v=>v*.45*amp);}
      else if(prev.has(id)){m.color=mix(dim,warm,Math.max(0,1-f*2.5));m.emissive=[0,0,0];}else{m.color=dim;m.emissive=[0,0,0];}}}
  function applyX(){if(!ok)return;const v=xr;skinMat.opacity=Math.max(0,1-v*1.6);skinMat.depthWrite=v<.3;skinN.visible=v<.62;
    for(const id in mats){const m=mats[id];m.transparent=v>0;m.opacity=v<.5?1-v*.9:Math.max(0,.55-(v-.5)*1.1);m.depthWrite=v<.5;}
    meshes.forEach(m=>m.visible=v<.98);skel.visible=v>.2;}
  function placeLabels(){if(!ok||!cam.vp)return;const w=stage.clientWidth,h=stage.clientHeight,placed=[];
    const list=Object.keys(anchors).map(id=>({id,s:colorFn?colorFn(id):{p:3,sel:false}})).filter(o=>labelMode==="all"||o.id===hover||o.id===active||(labelMode==="key"&&(o.s.sel||o.s.p>=4)))
      .sort((a,b)=>(b.id===active||b.id===hover?9:b.s.p)-(a.id===active||a.id===hover?9:a.s.p));
    const show=new Set(),cd=[cam.pos[0],0,cam.pos[2]],cl=Math.hypot(cd[0],cd[2])||1;
    list.forEach(o=>{let best=null,bd=-1;anchors[o.id].forEach(m=>{const c=m.userData.c;let nx=c[0],nz=c[2];const l=Math.hypot(nx,nz);if(l<1e-6){nx=0;nz=1;}else{nx/=l;nz/=l;}const d=(nx*cd[0]+nz*cd[2])/cl;if(d>bd){bd=d;best=m;}});
      if(!best||bd<.15||!best.visible)return;const p=R.project(best.userData.c,cam),x=(p[0]+1)/2*w,y=(1-p[1])/2*h;if(x<40||x>w-40||y<50||y>h-20)return;
      if(placed.some(q=>Math.abs(q[1]-y)<15&&Math.abs(q[0]-x)<110))return;placed.push([x,y]);show.add(o.id);const el=labels[o.id];el.style.left=x+"px";el.style.top=y+"px";el.classList.toggle("on",o.s.sel||o.id===active);});
    for(const id in labels)labels[id].hidden=!show.has(id);
    /* keep labels inside the stage: a label that would run past the right edge points left instead */
    show.forEach(id=>{const el=labels[id];el.classList.remove("flip");const x=parseFloat(el.style.left);if(x+10+el.offsetWidth>w-4)el.classList.add("flip");});}
  const api={
    init(el,callbacks){stage=el;cb=callbacks||{};tip=el.querySelector(".tip");labelLayer=el.querySelector(".labels");},
    show(){if(!inited){if(window.VB_BODY)init();else{inited=true;const ld=document.createElement("div");ld.className="fallback loading";ld.setAttribute("role","status");ld.textContent="Loading the 3D anatomy model…";stage.appendChild(ld);
        /* the anatomy mesh is large (about 1.9 MB), so it is only downloaded the first time Body opens */
        const sc=document.createElement("script");sc.src="js/body-mesh.js";sc.onload=()=>{ld.remove();inited=false;init();size();};sc.onerror=()=>{ld.remove();fail();};document.head.appendChild(sc);}}size();},
    setColors(fn){colorFn=fn;if(ok&&!anim)paint();},
    repaint(){if(ok&&!anim)paint();},
    setHover(id){if(hover===id)return;hover=id;if(ok&&!anim)paint();},
    setActive(id){active=id;if(ok&&!anim)paint();},
    setLabels(mode){labelMode=mode;},
    view(name){if(!ok)return;const p={front:[0,1.05,4.6],back:[0,1.05,-4.6],side:[4.6,1.05,0],quarter:[1.4,1.15,4.4]}[name]||[0,1.05,4.6];cam.pos=p.slice();cam.target=[0,.93,0];orbit.sync();},
    focus(id){if(!ok||!anchors[id])return;const c=anchors[id][0].userData.c,back=c[2]<-.02,side=Math.abs(c[2])<=.02&&Math.abs(c[0])>.12,y=Math.max(.5,Math.min(1.5,c[1]));
      cam.pos=[side?3.4:(c[0]>.02?(back?-1.1:1.1):0),y+.15,side?.6:(back?-3.4:3.4)];cam.target=[0,y,0];orbit.sync();},
    xray(v){xr=Math.max(0,Math.min(1,v));applyX();},
    play(k,cbk){if(!ok||!ACTS[k])return false;phaseCb=cbk||null;anim={k,t0:performance.now(),i:-1};return true;},
    stop(){const was=anim;anim=null;if(ok)paint();if(was&&phaseCb)phaseCb(null);},
    acts:()=>Object.keys(ACTS),
    frame(){if(!ok)return;size();animFrame(performance.now());orbit.update();R.render(scene,cam);placeLabels();}
  };
  return api;
})();
})();
