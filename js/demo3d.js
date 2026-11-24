/* demo3d.js: exercise demos on the 3D player.
   The 2D demos (exmotion.js) are keyframed joint positions in a side or front view. Here the same motion drives the
   rigged athlete: each limb bone is aimed at its target joint through the bone's rest frame (so knees and elbows bend
   the right way), the trunk bends in three spine segments, and front-view clips get depth back from foreshortening.
   One hidden WebGL canvas renders every demo; frames are copied into the visible 2D canvases. */
(function(){
"use strict";
const VB=window.VB;if(!VB||!VB.GL||!VB.Athlete||!VB.exMotion)return;
const G=VB.GL,A=VB.Athlete,BI=A.BI,SEG=A.SEG,PIC={tr:.5,ua:.29,fa:.27,th:.44,sh:.43};
/* ---------- small vector / rotation helpers ---------- */
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sc=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(a[0],a[1],a[2]),nrm=a=>{const l=len(a)||1;return [a[0]/l,a[1]/l,a[2]/l];};
function frame(u,n){u=nrm(u);n=nrm(sub(n,sc(u,dot(n,u))));const w=cross(u,n);return [u,n,w];}           // columns
function mulFT(F,S){/* F (columns) times S transposed (S given as rows from the export: S[r][c]) */const o=[[0,0,0],[0,0,0],[0,0,0]];
  for(let r=0;r<3;r++)for(let c=0;c<3;c++){let v=0;for(let k=0;k<3;k++)v+=F[k][r]*S[c][k];o[r][c]=v;}return o;}
function m2q(M){const t=M[0][0]+M[1][1]+M[2][2];let w,x,y,z;
  if(t>0){const s=Math.sqrt(t+1)*2;w=.25*s;x=(M[2][1]-M[1][2])/s;y=(M[0][2]-M[2][0])/s;z=(M[1][0]-M[0][1])/s;}
  else if(M[0][0]>M[1][1]&&M[0][0]>M[2][2]){const s=Math.sqrt(1+M[0][0]-M[1][1]-M[2][2])*2;w=(M[2][1]-M[1][2])/s;x=.25*s;y=(M[0][1]+M[1][0])/s;z=(M[0][2]+M[2][0])/s;}
  else if(M[1][1]>M[2][2]){const s=Math.sqrt(1+M[1][1]-M[0][0]-M[2][2])*2;w=(M[0][2]-M[2][0])/s;x=(M[0][1]+M[1][0])/s;y=.25*s;z=(M[1][2]+M[2][1])/s;}
  else{const s=Math.sqrt(1+M[2][2]-M[0][0]-M[1][1])*2;w=(M[1][0]-M[0][1])/s;x=(M[0][2]+M[2][0])/s;y=(M[1][2]+M[2][1])/s;z=.25*s;}
  const l=Math.hypot(w,x,y,z);return [w/l,x/l,y/l,z/l];}
function qfromTo(a,b){a=nrm(a);b=nrm(b);const d=dot(a,b);if(d<-.9999){return [0,0,0,1];}const c=cross(a,b),q=[1+d,c[0],c[1],c[2]],l=Math.hypot(...q);return q.map(v=>v/l);}
function qslerp(q,k){/* from identity to q by fraction k */const w=Math.max(-1,Math.min(1,q[0])),ang=Math.acos(w)*2,s=Math.sin(ang/2);if(s<1e-6)return [1,0,0,0];const a=ang*k,ss=Math.sin(a/2)/s;return [Math.cos(a/2),q[1]*ss,q[2]*ss,q[3]*ss];}
const qax=(ax,a)=>{const s=Math.sin(a/2);return [Math.cos(a/2),ax[0]*s,ax[1]*s,ax[2]*s];};
/* ---------- the shared renderer ---------- */
let R=null,cv=null,scene=null,ath=null,lookKey="",ball=null,held=[],propsNode=null,propsFor=null,kLen=1,heads=null;
const live=new Set();
function ensure(){if(R)return true;cv=document.createElement("canvas");try{R=G.renderer(cv,{alpha:true,preserve:true});}catch(e){R=null;}if(!R)return false;R.setSize(360,360,1);
  scene={root:new G.Node(),clear:[0,0,0,0],light:{sky:"#c9c6ef",gnd:"#3a2f55",d1:[.4,1,.7],c1:"#ffffff",d2:[-.6,.4,-.5],c2:"#8a86c8",rim:"#9b8cff"},shadow:{dir:[.3,1,.25],opacity:.25},exposure:1.05};
  const fl=new G.Node(G.ring(0,1.6,48),G.mat({color:"#e7e4f4",unlit:true}));fl.rot=[-Math.PI/2,0,0];fl.pos=[0,.001,0];scene.root.add(fl);
  ball=new G.Node(A.ballGeo(),A.ballMat());ball.visible=false;scene.root.add(ball);return true;}
function lookOpts(){const p=(VB.state&&VB.state.profile)||{},base=VB.lookOpts?VB.lookOpts(p.look||{}):{};
  return Object.assign({},base,{number:p.number==null?"":p.number,lefty:false,height:1.9,jersey:(VB.myAccent&&VB.myAccent())||base.jersey||"#ec3b52"});}
function athlete(){const o=lookOpts(),key=JSON.stringify(o);if(ath&&key===lookKey)return ath;if(ath)scene.root.remove?scene.root.remove(ath.root):(scene.root.children=scene.root.children.filter(c=>c!==ath.root));
  ath=A.build(o);ath.root.scl=[1,1,1];lookKey=key;scene.root.add(ath.root);heads=ath.heads;   // skeleton units = scene units, so props and floor match the player
  const hp=i=>[heads[i*3],heads[i*3+1],heads[i*3+2]];kLen=(len(sub(hp(BI["shin.R"]),hp(BI["thigh.R"])))+len(sub(hp(BI["foot.R"]),hp(BI["shin.R"]))))*(A.kxzOf?A.kxzOf(ath):(A.KXZ||1))/(PIC.th+PIC.sh);return ath;}
// the skeleton scales the pelvis path by the leg proportions; demos place the pelvis in real units, so undo that
const placeW=(Wq,root)=>A.applyWorld(ath,Wq,root.map(v=>v/(A.kxzOf?A.kxzOf(ath):(A.KXZ||1))));
/* ---------- props ---------- */
function buildProps(def,front){if(propsNode&&propsFor===def)return;if(propsNode)scene.root.children=scene.root.children.filter(c=>c!==propsNode);propsNode=new G.Node();propsFor=def;
  held.forEach(h=>scene.root.children=scene.root.children.filter(c=>c!==h.n));held=[];
  const M=G.mat({color:"#b9b4dc",rough:.7}),M2=G.mat({color:"#8e89b8",rough:.6}),k=kLen;
  const place=(g,x,y,mat,sx,sy,sz)=>{const n=new G.Node(g,mat||M);n.pos=front?[0,y,x]:[x,y,0];if(sx)n.scl=front?[sz,sy,sx]:[sx,sy,sz];propsNode.add(n);return n;};
  (def.p||[]).forEach(pr=>{const x=(pr.x||0)*k,w=(pr.w||.4)*k,h=(pr.h||.45)*k;
    if(pr.k==="wall")place(G.box(1,1,1),x+.03,1.2,M,.06,2.4,2.2);
    else if(pr.k==="chair"){place(G.box(1,1,1),x+w/2,h-.025,M,w,.05,.44);const bx=pr.back===1||pr.back===true?x+w:x;place(G.box(1,1,1),bx,h+.22,M2,.04,.44,.44);
      [[x+.03,.15],[x+w-.03,.15],[x+.03,-.15],[x+w-.03,-.15]].forEach(([lx,lz])=>{const n=new G.Node(G.box(.03,h,.03),M2);n.pos=front?[lz,h/2,lx]:[lx,h/2,lz];propsNode.add(n);});}
    else if(["box","bench","step","wedge"].includes(pr.k))place(G.box(1,1,1),x+w/2,h/2,M,w,h,pr.k==="bench"?.36:.5);
    else if(pr.k==="post")place(G.box(1,1,1),x,1.1,M2,.08,2.2,.08);
    else if(["db","dbe","kb","kbu","plate"].includes(pr.k)){["R","L"].forEach(S=>{const g=pr.k==="plate"?G.cyl(.16,.16,.035,24):pr.k.startsWith("kb")?G.sphere(.09,16,12):G.merge([[G.cyl(.018,.018,.26,10),G.T(0,0,0,Math.PI/2,0,0)],[G.cyl(.05,.05,.07,16),G.T(0,0,.11,Math.PI/2,0,0)],[G.cyl(.05,.05,.07,16),G.T(0,0,-.11,Math.PI/2,0,0)]]);
        const n=new G.Node(g,G.mat({color:"#2a2740",rough:.5}));scene.root.add(n);held.push({n,S,k:pr.k});});}});
  scene.root.add(propsNode);}
/* ---------- retarget a 2D frame onto the skeleton ---------- */
function retarget(J,v,P){const k=kLen,front=v==="front",hp=i=>[heads[i*3],heads[i*3+1],heads[i*3+2]];
  const hz=Math.abs(hp(BI["thigh.R"])[2]),sz=Math.abs(hp(BI["upperarm.R"])[2]);
  const to3=(p,z)=>front?[0,p[1]*k,p[0]*k]:[p[0]*k,p[1]*k,z||0];
  const T={};const side=(n,S)=>S==="R"?n:-n;
  if(!front){["N","F"].forEach(K=>{const S=K==="N"?"R":"L",s=S==="R"?1:-1;T["hip"+S]=to3(J.hip,s*hz);T["knee"+S]=to3(J["k"+K],s*hz);T["ank"+S]=to3(J["a"+K],s*hz);
      T["heel"+S]=to3(J["heel"+K],s*hz);T["toe"+S]=to3(J["toe"+K],s*hz);T["sh"+S]=to3(J.sh,s*sz);T["el"+S]=to3(J["e"+K],s*(sz+.02));T["hand"+S]=to3(J["h"+K],s*(sz-.01));});}
  else{/* front view: lateral comes from the drawing, depth from how short each segment looks */
    const dep=(a,b,L)=>{const d2=Math.hypot(b[0]-a[0],b[1]-a[1]);return Math.sqrt(Math.max(0,L*L-d2*d2))*k;};
    ["N","F"].forEach(K=>{const S=K==="N"?"R":"L";const hip=to3(J["hip"+K]),kn=to3(J["k"+K]),an=to3(J["a"+K]),sh=to3(J["sh"+K]),el=to3(J["e"+K]),hd=to3(J["h"+K]);
      const kd=dep(J["hip"+K],J["k"+K],PIC.th),ad=dep(J["k"+K],J["a"+K],PIC.sh);kn[0]=kd;an[0]=kd-ad;
      const ed=dep(J["sh"+K],J["e"+K],PIC.ua),hdd=dep(J["e"+K],J["h"+K],PIC.fa);el[0]=ed;hd[0]=ed+hdd;
      T["hip"+S]=hip;T["knee"+S]=kn;T["ank"+S]=an;T["heel"+S]=add(an,[-.05,-.06,0]);T["toe"+S]=add(an,[.16,-.06,0]);T["sh"+S]=sh;T["el"+S]=el;T["hand"+S]=hd;});}
  const hipMid=front?to3(J.hip):to3(J.hip,0),shMid=to3(J.sh,0);
  const Wq=new Float32Array(BI&&A.BONES.length*4),setQ=(name,q)=>{Wq.set(q,BI[name]*4);};
  // trunk: three spine segments share the bend
  const trunk=sub(shMid,hipMid),qT=qfromTo([0,1,0],trunk);
  setQ("hips",qslerp(qT,.35));setQ("spine1",qslerp(qT,.55));setQ("spine2",qslerp(qT,.78));setQ("chest",qT);
  const headDir=sub(to3(J.head,0),shMid),qH=qfromTo([0,1,0],headDir);setQ("neck",qslerp(qH,.6));setQ("head",qH);setQ("jaw",qH);
  // legs
  ["R","L"].forEach(S=>{const u=sub(T["knee"+S],T["hip"+S]),s=sub(T["ank"+S],T["knee"+S]);let n=cross(nrm(u),nrm(s));if(len(n)<.08)n=cross(nrm(u),[-1,0,0]);if(len(n)<.08)n=[0,0,-1];
    setQ("thigh."+S,m2q(mulFT(frame(u,n),SEG["thigh."+S])));setQ("shin."+S,m2q(mulFT(frame(s,n),SEG["shin."+S])));
    const f=sub(T["toe"+S],T["heel"+S]),qf=front?[1,0,0,0]:qax([0,0,1],Math.atan2(f[1],f[0]));setQ("foot."+S,qf);setQ("toe."+S,qf);});
  // arms: the shoulder blade lifts as the arm goes overhead
  const qC=Wq.slice(BI.chest*4,BI.chest*4+4);
  ["R","L"].forEach(S=>{const s=S==="R"?1:-1,u=sub(T["el"+S],T["sh"+S]),f=sub(T["hand"+S],T["el"+S]);let n=cross(nrm(u),nrm(f));
    if(len(n)<.08){n=cross(nrm(u),[1,0,0]);if(len(n)<.08)n=[0,0,1];}
    const Mu=mulFT(frame(u,n),SEG["upperarm."+S]),Mf=mulFT(frame(f,n),SEG["forearm."+S]),qu=m2q(Mu),qf=m2q(Mf);
    const elev=Math.acos(Math.max(-1,Math.min(1,-nrm(u)[1])))*180/Math.PI,ce=.26*Math.max(0,elev-45)*Math.PI/180;
    const qcl=A.qmul(qC,qax([1,0,0],-s*ce),[0,0,0,0]);setQ("clavicle."+S,qcl);setQ("upperarm."+S,qu);setQ("forearm."+S,qf);setQ("forearmTwist."+S,qf);
    ["hand","thumb1","thumb2","fingers1","fingers2"].forEach(b=>setQ(b+"."+S,qf));});
  return {Wq,root:hipMid,T};}
/* bounding box of the player over the whole loop, in the camera's horizontal axis: [min h, min y, -, max h, max y, -] */
function frameBox(c,def,front){const ax=front?2:0,bb=[9,9,0,-9,-9,0];
  for(let i=0;i<24;i++){const fr=c.at(i/24*c.T),J=fr.J,{Wq,root}=retarget(J,c.v,fr.P);let W=placeW(Wq,root);
    const ay=Math.min(W.p[BI["foot.R"]*3+1],W.p[BI["foot.L"]*3+1]),want=Math.min(J.aN[1],J.aF[1])*kLen+(heads[BI["foot.R"]*3+1]-.07*kLen);root[1]+=want-ay;W=placeW(Wq,root);
    for(let b=0;b<W.p.length/3;b++){const x=W.p[b*3+ax],y=W.p[b*3+1];bb[0]=Math.min(bb[0],x-.12);bb[3]=Math.max(bb[3],x+.12);bb[1]=Math.min(bb[1],y-.02);bb[4]=Math.max(bb[4],y+(A.BONES[b]==="head"?.3:.08));}}
  bb[1]=Math.min(bb[1],0);(def.p||[]).forEach(pr=>{if(pr.x==null)return;const x=pr.x*kLen,wd=(pr.w||.1)*kLen;bb[0]=Math.min(bb[0],x-.05);bb[3]=Math.max(bb[3],x+wd+.05);if(pr.y!=null)bb[4]=Math.max(bb[4],pr.y*kLen+.1);});
  return bb;}
/* ---------- drawing loop ---------- */
let raf=0,t0=performance.now();
function draw(){raf=0;let any=false;const now=performance.now();
  live.forEach(m=>{if(!m.el.isConnected){live.delete(m);return;}if(!m.vis||document.hidden)return;any=true;
    const def=(window.VB_EXMO||{})[m.id];if(!def)return;const c=VB.exMotion.compile(m.id,def),fr=c.at((now-t0)/1000),J=fr.J,front=c.v==="front";
    athlete();buildProps(def,front);const {Wq,root}=retarget(J,c.v,fr.P);
    let W=placeW(Wq,root);
    // feet on the ground: shift so the lower ankle sits where the drawing puts it (adjusted for the shoe)
    const ay=Math.min(W.p[BI["foot.R"]*3+1],W.p[BI["foot.L"]*3+1]),want=Math.min(J.aN[1],J.aF[1])*kLen+(heads[BI["foot.R"]*3+1]-.07*kLen);
    root[1]+=want-ay;W=placeW(Wq,root);
    if(fr.P.b){ball.visible=true;ball.pos=front?[0,fr.P.b[1]*kLen,fr.P.b[0]*kLen]:[fr.P.b[0]*kLen,fr.P.b[1]*kLen,0];}else ball.visible=false;
    held.forEach(h=>{const b=BI["hand."+h.S];h.n.pos=[W.p[b*3]+(front?.04:.03),W.p[b*3+1]-.06,W.p[b*3+2]];});
    // camera from the near side (side view) or from the front, framed on the drawing's own box
    // camera: framed on the whole 3D player through the loop (head, hands and feet included) and the props, with a margin
    const w=m.el.width,h=m.el.height;if(!m.bb&&!def.focus)m.bb=frameBox(c,def,front);
    if(def.focus){const bx=c.box,cx=bx[0]*kLen,cy=Math.min(1.25,(bx[1]+bx[3]/2)*kLen),size=Math.min(2.1,Math.max(.95,bx[2])*kLen),d=size*1.95+.55;
      const cam=front?{fov:32,pos:[d,cy+.25,cx],target:[0,cy,cx]}:{fov:32,pos:[cx+d*.18,cy+.3,d],target:[cx,cy,0]};if(cv.width!==w||cv.height!==h)R.setSize(w,h,1);R.render(scene,cam);const g=m.el.getContext("2d");g.clearRect(0,0,w,h);g.drawImage(cv,0,0,w,h);return;}
    const bx=c.box,travel=bx[2]*kLen>1.9,bb=m.bb,hz=front?2:0,cx=travel?(m.cx=m.cx==null?root[front?2:0]:m.cx+(root[front?2:0]-m.cx)*.12):(bb[0]+bb[3])/2,cy=(bb[1]+bb[4])/2;
    const tanV=Math.tan(16*Math.PI/180),asp=w/Math.max(1,h),hh=(bb[4]-bb[1])/2*1.12+.05,hw=(travel?.9:(bb[3]-bb[0])/2)*1.12+.05,d=Math.max(hh/tanV,hw/(tanV*asp))+.35;
    const cam=front?{fov:32,pos:[d,cy+.18,cx],target:[0,cy,cx]}:{fov:32,pos:[cx+d*.12,cy+.2,d],target:[cx,cy,0]};if(cv.width!==w||cv.height!==h)R.setSize(w,h,1);R.render(scene,cam);
    const g=m.el.getContext("2d");g.clearRect(0,0,w,h);g.drawImage(cv,0,0,w,h);});
  if(any)raf=requestAnimationFrame(draw);}
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{const m=e.target._d3;if(m){m.vis=e.isIntersecting;if(m.vis&&!raf)raf=requestAnimationFrame(draw);}})):null;
function attach(el,id){if(!ensure())return false;const m={el,id,vis:!io};el._d3=m;live.add(m);if(io)io.observe(el);if(!raf)raf=requestAnimationFrame(draw);return true;}
VB.demo3d={attach,html:(id,px)=>(window.VB_EXMO||{})[id]?`<canvas class="demo3d" data-demo3d="${id}" width="${px*2}" height="${px*2}" style="width:${px}px;height:${px}px"></canvas>`:"",
  /* a demo block with a 3D / diagram switch; the diagram keeps the coral working-muscle highlight */
  block(id,px){const ok=!!R||ensure();return `<div class="demoswap" data-mode="${ok?"3d":"2d"}">${ok?VB.demo3d.html(id,px):""}${VB.exMotion.html(id,"big",px)}${ok?`<div class="dsw" role="group" aria-label="Demo view"><button type="button" data-dmode="3d" aria-pressed="true">3D player</button><button type="button" data-dmode="2d" aria-pressed="false">Diagram</button></div>`:""}</div>`;},
  scan(root){(root||document).querySelectorAll("canvas[data-demo3d]").forEach(c=>{if(!c._d3)attach(c,c.dataset.demo3d);});},retarget};
document.addEventListener("click",e=>{const b=e.target.closest("[data-dmode]");if(!b)return;const w=b.closest(".demoswap");w.dataset.mode=b.dataset.dmode;w.querySelectorAll("[data-dmode]").forEach(x=>x.setAttribute("aria-pressed",x===b));});
let pend=0;new MutationObserver(()=>{if(pend)return;pend=requestAnimationFrame(()=>{pend=0;VB.demo3d.scan();});}).observe(document.body,{childList:true,subtree:true});
})();
