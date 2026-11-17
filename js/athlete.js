/* athlete.js: sculpted volleyball player for the gl.js engine, with foot-locked leg IK and technique clips
   (4-step spike approach, block, jump set, dig, jump serve). Clip space: +x toward the net, +y up, +z the player's right. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const G=VB.GL,{M4,V3,Node}=G,rad=d=>d*Math.PI/180,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sm=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},lerp=(a,b,t)=>a+(b-a)*t;
const L1=.47,L2=.46,FOOT=[.15,-.075,0],HIPW=.095;
/* ---------- mesh ---------- */
function subdiv(prof,k){if(prof.length<3)return prof;const out=[];for(let i=0;i<prof.length-1;i++){const p0=prof[Math.max(0,i-1)],p1=prof[i],p2=prof[i+1],p3=prof[Math.min(prof.length-1,i+2)];
  for(let j=0;j<k;j++){const t=j/k,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}out.push(prof[prof.length-1]);return out;}
/* lathe with optional front/back fullness and muscle bellies. mus: [{y,h,a,w,k}] = centre height, half-height, angle (deg, 0 = front, 90 = +z), angular half-width (deg), radial gain.
   Bellies are smooth (cosine falloff on both axes), then normals are rebuilt from the surface so the light reads every muscle edge. */
function lathe(prof,seg,sx,sz,front,back,mus){if(prof.length>1&&prof[0][1]>prof[prof.length-1][1])prof=prof.slice().reverse();const SEG=Math.max(seg||22,mus?34:26),g=G.lathe(subdiv(prof,mus?4:3),SEG,sx,sz);
  if(front||back||mus){for(let i=0;i<g.p.length;i+=3){const X=g.p[i]/(sx||1),Z=g.p[i+2]/(sz||1),r=Math.hypot(X,Z)||1,ca=X/r,ang=Math.atan2(Z,X)*180/Math.PI;const k=1+(front||0)*Math.max(0,ca)*Math.max(0,ca)+(back||0)*Math.max(0,-ca)*Math.max(0,-ca);let mk=0;
    if(mus)for(const m of mus){let da=Math.abs(((ang-m.a)%360+540)%360-180)/m.w,dy=Math.abs(g.p[i+1]-m.y)/m.h;if(da<1&&dy<1){const fa=.5+.5*Math.cos(da*Math.PI),fy=.5+.5*Math.cos(dy*Math.PI);mk+=m.k*fa*fy;}}
    g.p[i]*=k+mk;g.p[i+2]*=1+mk;}
    if(mus)renorm(g,SEG);}
  return g;}
function renorm(g,seg){const P=g.p,N=new Float32Array(P.length),I=g.i;for(let t=0;t<I.length;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3,ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    for(const v of [a,b,c]){N[v]+=nx;N[v+1]+=ny;N[v+2]+=nz;}}
  const row=seg+1;for(let v=0;v<N.length/3;v+=row){const a=v*3,b=(v+seg)*3;for(let q=0;q<3;q++){const m=N[a+q]+N[b+q];N[a+q]=N[b+q]=m;}}
  for(let i=0;i<N.length;i+=3){const old=[g.n[i],g.n[i+1],g.n[i+2]];let l=Math.hypot(N[i],N[i+1],N[i+2]);if(l<1e-9){N[i]=old[0];N[i+1]=old[1];N[i+2]=old[2];continue;}
    let x=N[i]/l,y=N[i+1]/l,z=N[i+2]/l;if(x*old[0]+y*old[1]+z*old[2]<0){x=-x;y=-y;z=-z;}N[i]=x;N[i+1]=y;N[i+2]=z;}
  g.n=N;}
const ell=(r,sx,sy,sz)=>[G.sphere(r,20,14),sx,sy,sz];
function E(x,y,z,sx,sy,sz,rx,ry,rz){return G.T(x,y,z,rx,ry,rz,sx,sy,sz);}
function numberTex(n,col,out){return G.canvasTex(128,128,(g,w,h)=>{g.font="800 96px 'Barlow Condensed','Arial Narrow',sans-serif";g.textAlign="center";g.textBaseline="middle";g.lineJoin="round";g.lineWidth=10;g.strokeStyle=out;g.strokeText(n,64,70);g.fillStyle=col;g.fillText(n,64,70);});}
function build(o){o=Object.assign({jersey:"#ec3b52",accent:"#ffffff",shorts:"#17144d",skin:"#c98d68",hair:"#2b1d16",shoe:"#f4f2ee",sole:"#17144d",number:7,lefty:false,height:1.9,band:null,style:"short",build:"athletic",beard:"none",headband:"white",sleeve:"none",sleeveColor:"#17144d",pads:"black",socks:"crew",cut:"short"},o||{});
  const BK={lean:.9,athletic:1,power:1.12}[o.build]||1,DF=1.35*({lean:1.15,athletic:1,power:.9}[o.build]||1),BL={lean:.95,athletic:1,power:1.06}[o.build]||1,mix=(a,b,t)=>{const A=G.hex(a),B=G.hex(b);return A.map((v,i)=>v+(B[i]-v)*t);};
  const bandCol={white:"#ffffff",black:"#1a1a22",team:o.jersey}[o.headband]||o.band||"#ffffff";
  const M=(c,r,extra)=>G.mat(Object.assign({color:c,rough:r==null?.6:r},extra||{}));
  const mt={skin:M(o.skin,.5,{wrap:.45,rim:.45}),jersey:M(o.jersey,.85,{sheen:.5,rim:.35,wrap:.15}),accent:M(o.accent,.7,{rim:.3}),shorts:M(o.shorts,.82,{sheen:.45,rim:.35,wrap:.15}),hair:M(o.hair,.75,{sheen:.35,rim:.4}),shoe:M(o.shoe,.45),sole:M(o.sole,.7),pad:M(o.pads==="white"?"#f1f0f5":"#1d1b29",.85),eye:M("#1a1214",.25),white:M("#f3efe8",.35),lip:M(mix(o.skin,"#7a3a35",.45),.6),sock:M("#f2f2f5",.9),band:M(bandCol,.7),beard:M(o.beard==="stubble"?mix(o.skin,o.hair,.55):o.hair,.95,{polyOffset:o.beard==="stubble"}),sleeve:M(o.sleeveColor||"#17144d",.75),brow:M(mix(o.hair,"#000000",.2),.9)};
  const root=new Node(),body=new Node();root.add(body);const meshes=[];
  /* one smooth skin: every part is bound to its bone, and the ends of each limb blend into the next bone so knees, elbows,
     shoulders and hips bend as one surface instead of as separate pieces */
  const bones=[body],SK={};
  const J=(parent,x,y,z)=>{const n=new Node();n.pos=[x,y,z];parent.add(n);n.userData.bi=bones.length;bones.push(n);return n;};
  const restOf=n=>{let m=M4.id();const chain=[];let q=n;while(q&&q!==body){chain.unshift(q);q=q.parent;}chain.forEach(c=>{m=M4.mul(m,c.local());});return m;};
  const part=(joint,list,bl)=>{bl=bl||{};const R=restOf(joint),bi=joint===body?0:joint.userData.bi;
    list.forEach(([mk,g,mx])=>{const lg=G.merge([[g,mx]]),nv=lg.p.length/3;if(bl.bulk&&bl.bulk!==1){for(let v=0;v<nv;v++){lg.p[v*3]*=bl.bulk;lg.p[v*3+2]*=bl.bulk;}}const jj=new Float32Array(nv*2),ww=new Float32Array(nv);
      for(let v=0;v<nv;v++){const y=lg.p[v*3+1],sd=bl.up?y:-y;let w=1,o=bi;
        if(bl.p){const t=sm((sd+bl.pb)/(2*bl.pb));if(t<w){w=t;o=bl.p.userData.bi||0;}}
        if(bl.c){const d=bl.L-sd,t=sm((d+bl.cb)/(2*bl.cb));if(t<w){w=t;o=bl.c.userData.bi;}}
        jj[v*2]=bi;jj[v*2+1]=o;ww[v]=w;}
      const bg=G.merge([[lg,R]]);bg.j=jj;bg.w=ww;(SK[mk]=SK[mk]||[]).push([bg,null]);});};
  const skinCache={fid:-1,out:new Float32Array(24*16)};
  const finishSkin=()=>{bones.forEach(b=>{b.userData.restInv=M4.inv(restOf(b));});
    Object.keys(SK).forEach(k=>{const n=new Node(G.merge(SK[k]),mt[k]);n.castShadow=true;n.userData.athlete=root;
      n.skin={compute(node,fid){if(skinCache.fid===fid)return skinCache.out;skinCache.fid=fid;const inv=M4.inv(node.world),tmp=new Float32Array(16);bones.forEach((b,i)=>{M4.mul(b.world,b.userData.restInv,tmp);M4.mul(inv,tmp,tmp);skinCache.out.set(tmp,i*16);});return skinCache.out;}};
      body.add(n);meshes.push(n);});};
  /* skeleton nodes */
  const pelvis=J(body,0,.98,0);pelvis.order="YZX";
  const abd=J(pelvis,0,.1,0);abd.order="YZX";const chest=J(abd,0,.2,0);chest.order="YZX";const neck=J(chest,0,.3,0);const head=J(neck,0,.075,0);head.order="YZX";
  const legs={},arms={};
  /* pelvis + shorts */
  part(pelvis,[["shorts",G.sphere(1,24,16),E(0,.0,0,.118,.13,.175)],["shorts",lathe([[.16,-.02],[.172,.06],[.16,.12],[.15,.13]],24,.74,1.12),null],["accent",G.torus(.152,.009,30,6),E(0,.125,0,.74,1,1.12,Math.PI/2)]],{bulk:(1+BK)/2});
  /* abdomen */
  part(abd,[["jersey",lathe([[.15,-.08],[.142,.02],[.138,.1],[.146,.2],[.15,.22]],26,.72,1.13,.06),null]],{p:pelvis,pb:.07,up:true,c:chest,cb:.07,L:.2,bulk:BK});
  /* chest: V taper, pecs, lats, traps */
  part(chest,[["jersey",lathe([[.148,-.03],[.156,.06],[.17,.15],[.173,.21],[.162,.252],[.128,.288],[.085,.308],[.055,.318]],28,.72,1.24,.09,.05),null],
    ["jersey",G.sphere(1,18,12),E(.035,.2,.085,.075,.07,.085)],["jersey",G.sphere(1,18,12),E(.035,.2,-.085,.075,.07,.085)],
    ["jersey",G.sphere(1,16,12),E(-.015,.262,.1,.055,.045,.08,.35,0,0)],["jersey",G.sphere(1,16,12),E(-.015,.262,-.1,.055,.045,.08,-.35,0,0)],
    ["accent",G.torus(.058,.011,24,6),E(.005,.3,0,1,1,1,Math.PI/2)]],{p:abd,pb:.07,up:true,bulk:BK});
  // numbers front and back
  const nt=numberTex(String(o.number),o.accent,"rgba(0,0,0,.35)");
  [[.126,Math.PI/2,.15,.12],[-.128,-Math.PI/2,.2,.12]].forEach(([x,ry,s,y])=>{const q=new Node(G.quad(s,s),G.mat({map:nt,transparent:true,depthWrite:false,rough:.8,polyOffset:true}));q.pos=[x,y,0];q.rot=[0,ry,0];q.userData.athlete=root;chest.add(q);});
  /* neck + head */
  part(neck,[["skin",G.cyl(.05,.047,.12,16),E(0,-.04,0)],["skin",G.sphere(1,12,8),E(.02,.0,0,.03,.05,.05)]],{p:chest,pb:.04,up:true,c:head,cb:.03,L:.075});
  part(head,[["skin",G.sphere(1,26,20),E(.005,.1,0,.102,.118,.08)],["skin",G.sphere(1,18,12),E(.045,.045,0,.06,.05,.058)],["skin",G.sphere(1,10,8),E(.098,.095,0,.018,.026,.014)],
    ["skin",G.sphere(1,10,8),E(.0,.095,.079,.014,.028,.01)],["skin",G.sphere(1,10,8),E(.0,.095,-.079,.014,.028,.01)],["brow",G.sphere(1,10,6),E(.093,.123,.032,.012,.0065,.027,0,0,.12)],["brow",G.sphere(1,10,6),E(.093,.123,-.032,.012,.0065,.027,0,0,.12)],
    ["white",G.sphere(1,12,8),E(.084,.105,.03,.011,.0095,.016)],["white",G.sphere(1,12,8),E(.084,.105,-.03,.011,.0095,.016)],["eye",G.sphere(1,10,8),E(.093,.105,.03,.004,.0068,.0068)],["eye",G.sphere(1,10,8),E(.093,.105,-.03,.004,.0068,.0068)],
    ["skin",G.sphere(1,10,8),E(.104,.083,0,.013,.012,.016)],...beardParts(o.beard),["lip",G.sphere(1,10,6),E(.086,.045,0,.01,.006,.024)],
    ...hairParts(o.style)]);
  function beardParts(b){const out=[];if(b==="none"||!b)return out;
    if(b==="beard"||b==="stubble"){const sc=b==="beard"?1.045:1.026;out.push(["beard",G.sphere(1,22,16),E(.044,.044,0,.06*sc,.051*sc,.058*sc)]);if(b==="beard")out.push(["beard",G.sphere(1,16,12),E(.07,.02,0,.032,.026,.04)]);}
    if(b==="moustache"||b==="beard"||b==="goatee")out.push(["beard",G.sphere(1,12,8),E(.095,.058,0,.01,.007,.028)]);
    if(b==="goatee")out.push(["beard",G.sphere(1,12,8),E(.088,.025,0,.018,.022,.022)]);return out;}
  function hairParts(st){const cap=(sc,tilt,cov)=>["hair",G.merge([[G.lathe(Array.from({length:14},(_,i)=>{const a=(cov||1.9)*(1-i/13);return [Math.sin(a),Math.cos(a)];}),26),M4.rz(tilt)]]),E(.005,.1,0,.1025*sc,.118*sc,.08*sc)];
    const band=["band",G.torus(.1,.012,28,6),E(.0,.142,0,1.06,.86,1,Math.PI/2,0,.3)],out=[];
    if(st==="bald")return out;if(st==="buzz"){out.push(cap(1.035,.5,1.85));return out;}
    out.push(cap(1.06,.62));
    if(st==="bun"){out.push(["hair",G.sphere(1,16,12),E(-.085,.2,0,.05,.05,.05)]);}
    if(st==="ponytail"){out.push(["hair",G.sphere(1,12,10),E(-.105,.17,0,.03,.03,.03)]);out.push(["hair",G.sphere(1,14,12),E(-.135,.08,0,.035,.1,.04,0,0,-.35)]);out.push(["hair",G.sphere(1,12,10),E(-.15,-.02,0,.026,.06,.03,0,0,-.2)]);}
    if(st==="curly"){for(let k=0;k<26;k++){const a=k/26*Math.PI*2,y=.16+.05*Math.sin(k*2.3),r=.098;out.push(["hair",G.sphere(.03,8,6),E(Math.cos(a)*r*1.0-.008,y+.02*Math.cos(k*1.7),Math.sin(a)*r*.84)]);}out.push(["hair",G.sphere(1,14,10),E(-.01,.2,0,.09,.05,.075)]);}
    if(st==="long"){out.push(["hair",G.sphere(1,16,12),E(-.06,.06,0,.06,.15,.085)]);}
    if(st!=="buzz"&&o.headband!=="none")out.push(band);return out;}
  /* arms */
  [-1,1].forEach(s=>{const sh=J(chest,0,.255,s*(.185*(1+(BK-1)*.7)));const sleeveOn=o.sleeve==="both"||(o.sleeve==="hit"&&((s>0)!==!!o.lefty));sh.order="ZXY";const el=J(sh,0,-.31,0);const hd=J(el,0,-.27,0);
    part(sh,[...(o.cut==="sleeveless"?[["skin",G.sphere(1,20,16),E(.0,-.045,-s*.004,.054,.088,.054)],["accent",G.torus(.05,.005,18,5),E(0,.01,-s*.01,1,1,1,Math.PI/2,0,s*.6)]]:[["jersey",G.sphere(1,18,14),E(.0,-.03,-s*.01,.05,.075,.052)],["jersey",lathe([[.052,-.02],[.055,-.07],[.054,-.12],[.0535,-.125]],18),E(0,0,0)],["accent",G.torus(.0535,.0035,18,5),E(0,-.123,0,1,1,1,Math.PI/2)]]),
      [sleeveOn?"sleeve":"skin",lathe([[.056,-.06],[.054,-.13],[.05,-.2],[.044,-.27],[.041,-.31],[.04,-.33]],16,1.02,.94,.18,0,sleeveOn?null:[{y:-.19,h:.09,a:0,w:62,k:.1*DF},{y:-.13,h:.1,a:180-25*s,w:55,k:.08*DF},{y:-.15,h:.08,a:180+50*s,w:40,k:.06*DF},{y:-.25,h:.05,a:90*s,w:40,k:.035*DF}]),null]],{p:chest,pb:.07,c:el,cb:.05,L:.31,bulk:BK});
    part(el,[[sleeveOn?"sleeve":"skin",lathe([[.04,.025],[.041,0],[.046,-.06],[.04,-.15],[.031,-.24],[.026,-.27],[.025,-.285]],16,1,.88,0,0,sleeveOn?null:[{y:-.06,h:.08,a:35*s,w:55,k:.1*DF},{y:-.08,h:.09,a:-70*s,w:60,k:.07*DF},{y:-.05,h:.06,a:170,w:45,k:.04*DF}]),null],...(sleeveOn?[["skin",lathe([[.027,-.236],[.026,-.27],[.025,-.285]],16,1.04,.92),null]]:[])],{p:sh,pb:.05,c:hd,cb:.03,L:.27,bulk:(1+BK)/2});
    const fing=[];[-1.5,-.5,.5,1.5].forEach((k,i)=>{const L=[.07,.08,.077,.064][i];fing.push(["skin",lathe([[0,-L],[.006,-L*.96],[.0088,-L*.86],[.0098,-L*.6],[.0105,-L*.25],[.011,0],[.0108,.012]],10,1,.95),E(.004,-.088,k*.0185,1,1,1,0,0,.1)]);});
    part(hd,[["skin",G.sphere(1,14,10),E(.0,-.05,0,.024,.058,.042)],...fing,["skin",lathe([[0,-.058],[.008,-.054],[.0105,-.045],[.0118,-.02],[.0125,0],[.012,.01]],10),E(.014,-.028,s*.034,1,1,1,-s*.5,0,.45)]],{p:el,pb:.025});
    arms[s>0?"R":"L"]={sh,el,hd,s};});
  /* legs */
  [-1,1].forEach(s=>{const hip=J(pelvis,0,0,s*HIPW);const kn=J(hip,0,-L1,0);const an=J(kn,0,-L2,0);
    part(hip,[["shorts",lathe([[.108,.04],[.106,-.06],[.102,-.18],[.1,-.21]],20,1.02,.98),null],["accent",G.torus(.099,.0045,24,5),E(0,-.205,0,1.02,1,.98,Math.PI/2)],
      ["skin",lathe([[.088,-.15],[.085,-.22],[.077,-.32],[.064,-.41],[.054,-.47],[.053,-.49]],18,1.05,.96,.12,0,[{y:-.29,h:.13,a:0,w:45,k:.06*DF},{y:-.3,h:.13,a:62*s,w:45,k:.07*DF},{y:-.425,h:.055,a:-42*s,w:38,k:.11*DF},{y:-.3,h:.12,a:180,w:55,k:.05*DF},{y:-.23,h:.08,a:-110*s,w:35,k:.03*DF}]),null]],{p:pelvis,pb:.07,c:kn,cb:.06,L:.47,bulk:BK*BL});
    part(kn,[...(o.pads==="none"?[]:[["pad",lathe([[.05,-.075],[.059,-.05],[.064,-.01],[.063,.03],[.058,.065],[.054,.08]],26,1.02,.96,.32),E(0,0,0)]]),
      ["skin",lathe([[.053,.03],[.052,-.02],[.055,-.09],[.05,-.17],[.038,-.29],[.031,-.38]],18,1,.92,0,.32,[{y:-.13,h:.085,a:180+42*s,w:42,k:.13*DF},{y:-.1,h:.075,a:180-40*s,w:38,k:.09*DF},{y:-.12,h:.11,a:22*s,w:28,k:.05*DF}]),null],...(o.socks==="none"?[]:[["sock",lathe(o.socks==="high"?[[.049,-.12],[.046,-.17],[.04,-.27],[.033,-.38],[.032,-.46],[.031,-.48]]:[[.034,-.3],[.033,-.38],[.032,-.46],[.031,-.48]],16,1.02,.94,0,.3),null]])],{p:hip,pb:.06,c:an,cb:.04,L:.46,bulk:(1+BK*BL)/2});
    part(an,[["shoe",G.sphere(1,20,12),E(.055,-.035,0,.135,.05,.056)],["shoe",G.sphere(1,14,10),E(-.02,-.02,0,.06,.06,.05)],["sole",G.sphere(1,24,10),E(.058,-.072,0,.152,.02,.06)],["sole",G.sphere(1,14,8),E(-.03,-.068,0,.06,.022,.052)],
      ["accent",G.box(.12,.014,.002),E(.06,-.035,s*.057,1,1,1,0,0,-.25)]],{p:kn,pb:.03});
    legs[s>0?"R":"L"]={hip,kn,an,s};});
  finishSkin();
  root.scl=[o.height/1.9,o.height/1.9,o.height/1.9];
  // mouth: opens with effort (exhale on the swing, breathing hard after landing)
  const mouth=new Node(G.sphere(1,14,10),M("#3a1416",.9,{wrap:.2}));mouth.pos=[.098,.04,0];mouth.scl=[.006,.0005,.017];mouth.visible=false;mouth.userData.athlete=root;head.add(mouth);
  const teeth=new Node(G.sphere(1,12,6),M("#efe9e0",.5));teeth.pos=[.1045,.047,0];teeth.scl=[.0035,.0024,.013];teeth.visible=false;teeth.userData.athlete=root;head.add(teeth);
  const ath={root,body,pelvis,abd,chest,neck,head,arms,legs,meshes,opts:o,mats:mt,lefty:!!o.lefty,shW:.185*(1+(BK-1)*.7),mouth,teeth};
  return ath;}
/* ---------- pose application ---------- */
function rotOnly(m){const r=new Float32Array(m);r[12]=r[13]=r[14]=0;return r;}
function tr(m){return new Float32Array([m[0],m[4],m[8],0,m[1],m[5],m[9],0,m[2],m[6],m[10],0,0,0,0,1]);}
function frame(x,y,z,p){return new Float32Array([x[0],x[1],x[2],0,y[0],y[1],y[2],0,z[0],z[1],z[2],0,p[0],p[1],p[2],1]);}
function apply(a,P){
  a.pelvis.pos=[P.x,P.y,P.z];a.pelvis.rot=[rad(P.side||0),rad(P.yaw||0),rad(-(P.lean||0))];
  a.abd.rot=[rad((P.side||0)*.5),rad((P.twist||0)*.4),rad(-(P.crunch||0)*.5+(P.arch||0)*.5)];
  a.chest.rot=[rad((P.side||0)*.5),rad((P.twist||0)*.6),rad(-(P.crunch||0)*.5+(P.arch||0)*.5)];
  a.neck.rot=[0,0,rad(-(P.hp||0)*.35)];a.head.rot=[0,rad(P.hy||0),rad(-(P.hp||0)*.65)];
  ["L","R"].forEach(k=>{const A=a.arms[k],s=A.s,v=P.arm[k];let m=M4.mul(M4.ry(rad(-s*v[1])),M4.mul(M4.rz(rad(v[0])),M4.ry(rad(s*(v[2]||0)))));m[12]=0;m[13]=.255+.03*sm((v[0]-90)/80);m[14]=s*((a.shW||.185)-.012*sm((v[0]-90)/80));A.sh.matrix=m;A.el.rot=[0,0,rad(v[3])];A.hd.rot=[0,0,rad(v[4]||0)];});
  // legs by IK in clip space
  {const Q=reach(Object.assign({},P,{x:a.pelvis.pos[0],y:a.pelvis.pos[1],z:a.pelvis.pos[2]}));a.pelvis.pos=[Q.x,Q.y,Q.z];}
  const pm=a.pelvis.local(),pr=rotOnly(pm),pinv=tr(pr);
  ["L","R"].forEach(k=>{const Lg=a.legs[k],s=Lg.s,f=P.foot[k],Fw=M4.mul(M4.ry(rad(f.yaw||0)),M4.rz(rad(-(f.pitch||0)))),off=M4.xf(Fw,FOOT,0);
    const A=[f.x-off[0],f.y-off[1],f.z-off[2]],H=M4.xf(pm,[0,0,s*HIPW]);let D=M4.xf(pinv,V3.sub(A,H),0);
    let d=V3.len(D);const dir=V3.norm(D);d=clamp(d,.12,L1+L2-.002);
    const a1=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),a2=Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1));
    let pole=M4.xf(pinv,[Math.cos(rad(f.yaw||0)),0,-Math.sin(rad(f.yaw||0))],0);pole=V3.add(pole,[0,0,s*(f.knee!=null?f.knee:.12)]);
    let kf=V3.sub(pole,V3.sc(dir,V3.dot(pole,dir)));if(V3.len(kf)<1e-4)kf=[1,0,0];kf=V3.norm(kf);
    const t=V3.add(V3.sc(dir,Math.cos(a1)),V3.sc(kf,Math.sin(a1))),y=V3.sc(t,-1);let x=V3.sub(kf,V3.sc(y,V3.dot(kf,y)));x=V3.norm(x);const z=V3.cross(x,y);
    Lg.hip.matrix=frame(x,y,z,[0,0,s*HIPW]);Lg.kn.rot=[0,0,-(Math.PI-a2)];
    const S=M4.mul(pr,M4.mul(rotOnly(Lg.hip.matrix),M4.rz(-(Math.PI-a2)))),loc=M4.mul(tr(S),Fw);loc[13]=-L2;Lg.an.matrix=loc;});
}
/* pelvis correction shared by baking and posing: drop (then shift) the pelvis so every foot target is reachable */
const RM=(L1+L2)*.985;
function pelvisM(P){let m=M4.id();m[12]=P.x;m[13]=P.y;m[14]=P.z;return M4.mul(m,M4.mul(M4.ry(rad(P.yaw||0)),M4.mul(M4.rz(rad(-(P.lean||0))),M4.rx(rad(P.side||0)))));}
function ankleT(f){const Fw=M4.mul(M4.ry(rad(f.yaw||0)),M4.rz(rad(-(f.pitch||0)))),off=M4.xf(Fw,FOOT,0);return [f.x-off[0],f.y-off[1],f.z-off[2]];}
function reach(P,mg){const RM2=RM-(mg||0);for(let it=0;it<3;it++){const m=pelvisM(P);let fixed=false;
  [["L",-1],["R",1]].forEach(([k,s])=>{const f=P.foot[k],H=M4.xf(m,[0,0,s*HIPW]);let A=ankleT(f),dd=V3.len(V3.sub(A,H));if(dd<=RM2)return;
      const hx=A[0]-H[0],hz=A[2]-H[2],hd=Math.hypot(hx,hz),d=dd;fixed=true;
    if(hd<RM2*.97){const top=A[1]+Math.sqrt(RM2*RM2-hd*hd);P.y-=Math.max(0,H[1]-top);}
    else{const sh=(hd-RM2*.96)/hd;P.x+=hx*sh;P.z+=hz*sh;const top=A[1]+Math.sqrt(RM2*RM2-Math.pow(RM2*.96,2));P.y-=Math.max(0,H[1]-top);}});
  if(!fixed)break;}return P;}
/* bake each clip's pelvis path once: reach-corrected, then smoothed so take-off, landing and every step flow without jerks */
function bake(clip){if(clip._bake)return clip._bake;const dt=1/120,n=Math.ceil(clip.dur/dt),X=new Float32Array(n),Y=new Float32Array(n),Z=new Float32Array(n),raw=[];
  for(let i=0;i<n;i++){const P=reach(sampleRaw(clip,i*dt),.015);raw.push(P);X[i]=P.x;Y[i]=P.y;Z[i]=P.z;}
  const blur=(A,sig)=>{const r=Math.ceil(sig*3/dt),w=[];let ws=0;for(let k=-r;k<=r;k++){const v=Math.exp(-.5*Math.pow(k*dt/sig,2));w.push(v);ws+=v;}const o=new Float32Array(n);
    for(let i=0;i<n;i++){let acc=0;for(let k=-r;k<=r;k++){acc+=A[((i+k)%n+n)%n]*w[k+r];}o[i]=acc/ws;}return o;};
  let x=blur(X,.04),y=blur(Y,.035),z=blur(Z,.04);
  const pass=mg=>{for(let i=0;i<n;i++){const P=Object.assign({},raw[i],{x:x[i],y:y[i],z:z[i]});reach(P,mg);x[i]=P.x;y[i]=P.y;z[i]=P.z;}};
  pass(.015);x=blur(x,.025);y=blur(y,.025);z=blur(z,.025);pass(.012);x=blur(x,.012);y=blur(y,.012);z=blur(z,.012);pass(.004);
  // trunk, head and arm angles get the same treatment: no snapping between keyframes
  const CH={};CHK.forEach(([k,get])=>{const A=new Float32Array(n);for(let i=0;i<n;i++)A[i]=get(raw[i]);CH[k]=blur(A,/^[lr]\d$/.test(k)?.022:.03);});
  return clip._bake={dt,n,x,y,z,CH};}
const CHK=["yaw","lean","side","twist","crunch","arch","hp","hy"].map(k=>[k,P=>P[k]||0,(P,v)=>{P[k]=v;}]).concat(["L","R"].flatMap(sd=>[0,1,2,3,4].map(i=>[(sd==="L"?"l":"r")+i,P=>P.arm[sd][i]||0,(P,v)=>{P.arm[sd][i]=v;}])));
/* ---------- clip sampling ---------- */
function track(keys,t){if(typeof keys==="function")return keys(t);if(typeof keys==="number")return keys;const n=keys.length;if(t<=keys[0][0])return keys[0][1];if(t>=keys[n-1][0])return keys[n-1][1];
  let i=0;while(i<n-2&&t>keys[i+1][0])i++;const [t0,v0]=keys[i],[t1,v1]=keys[i+1],u=(t-t0)/((t1-t0)||1);
  // monotone-ish cubic: tangents from neighbours, clamped so holds stay holds
  const m=(j)=>{if(j<=0||j>=n-1)return 0;const a=keys[j-1],b=keys[j],c=keys[j+1],d0=(b[1]-a[1])/((b[0]-a[0])||1),d1=(c[1]-b[1])/((c[0]-b[0])||1);if(d0*d1<=0)return 0;return 2/(1/d0+1/d1);};
  const h=t1-t0,m0=m(i)*h,m1=m(i+1)*h,u2=u*u,u3=u2*u;return (2*u3-3*u2+1)*v0+(u3-2*u2+u)*m0+(-2*u3+3*u2)*v1+(u3-u2)*m1;}
function footAt(plants,t,pel,lift){/* plants: [{t0,t1,x,z,yaw,air:[[s,dx,dy,dz,pitch]],h}] sorted, covering the loop */
  for(let i=0;i<plants.length;i++){const p=plants[i];if(t>=p.t0&&t<=p.t1){const heel=p.roll===false?0:sm((t-(p.t1-.13))/.13)*(p.toe||32);const strike=p.heel?(1-sm((t-p.t0)/.08))*-18:0;
      return {x:p.x,y:0,z:p.z,yaw:p.yaw||0,pitch:p.pitchFix!=null?p.pitchFix:heel+strike,knee:p.knee,peel:heel>0||(t>p.t1-.2&&p.roll!==false)};}}
  for(let i=0;i<plants.length-1;i++){const a=plants[i],b=plants[i+1];if(t>a.t1&&t<b.t0){const s=(t-a.t1)/(b.t0-a.t1);
      if(a.air){const pa=pel(a.t1),pb=pel(b.t0),A0=[a.x-pa.x,0-pa.y,a.z-pa.z],B0=[b.x-pb.x,0-pb.y,b.z-pb.z],ks=[[0,...A0,a.toe||32],...a.air,[1,...B0,b.heel?-10:0]],pc=pel(t);
        let j=0;while(j<ks.length-2&&s>ks[j+1][0])j++;const k0=ks[j],k1=ks[j+1],u=sm((s-k0[0])/((k1[0]-k0[0])||1));
        return {x:pc.x+lerp(k0[1],k1[1],u),y:Math.max(0,pc.y+lerp(k0[2],k1[2],u)),z:pc.z+lerp(k0[3],k1[3],u),yaw:lerp(a.yaw||0,b.yaw||0,u),pitch:lerp(k0[4],k1[4],u),knee:.15};}
      const u=sm(s),h=(a.h!=null?a.h:.11)*Math.sin(Math.PI*Math.min(1,s*1.05));
      return {x:lerp(a.x,b.x,u),y:h,z:lerp(a.z,b.z,u),yaw:lerp(a.yaw||0,b.yaw||0,u),pitch:lerp(a.toe||32,b.heel?-15:0,sm(s*1.3)),knee:a.knee};}}
  const p=plants[t<plants[0].t0?0:plants.length-1];return {x:p.x,y:0,z:p.z,yaw:p.yaw||0,pitch:0};}
function sample(clip,t,lefty){t=((t%clip.dur)+clip.dur)%clip.dur;const P=sampleRaw(clip,t),B=bake(clip),u=t/B.dt,i0=Math.floor(u)%B.n,i1=(i0+1)%B.n,f=u-Math.floor(u);
  P.x=B.x[i0]+(B.x[i1]-B.x[i0])*f;P.y=B.y[i0]+(B.y[i1]-B.y[i0])*f;P.z=B.z[i0]+(B.z[i1]-B.z[i0])*f;
  CHK.forEach(([k,,set])=>{const A=B.CH[k];set(P,A[i0]+(A[i1]-A[i0])*f);});return mirror(P,lefty);}
function sampleRaw(clip,t){const C=clip.ch,g=k=>C[k]==null?0:track(C[k],t);
  const pel=tt=>({x:track(C.x,tt),y:track(C.y,tt),z:C.z==null?0:track(C.z,tt)});
  const P={x:g("x"),y:g("y"),z:g("z"),yaw:g("yaw"),lean:g("lean"),side:g("side"),twist:g("twist"),crunch:g("crunch"),arch:g("arch"),hp:g("hp"),hy:g("hy"),
    arm:{L:[g("lf"),g("la"),g("lt"),g("le"),g("lw")],R:[g("rf"),g("ra"),g("rt"),g("re"),g("rw")]},foot:{L:footAt(clip.feet.L,t,pel),R:footAt(clip.feet.R,t,pel)},t};
  let lab="";(clip.labels||[]).forEach(l=>{if(t>=l[0])lab=l[1];});P.label=lab;
  return P;}
function mirror(P,lefty){
  if(lefty){P.z=-P.z;P.yaw=-P.yaw;P.side=-P.side;P.twist=-P.twist;P.hy=-P.hy;const al=P.arm.L;P.arm.L=P.arm.R.map((v,i)=>i===2?-v:v);P.arm.R=al.map((v,i)=>i===2?-v:v);
    const fl=P.foot.L;P.foot.L=Object.assign({},P.foot.R,{z:-P.foot.R.z,yaw:-(P.foot.R.yaw||0)});P.foot.R=Object.assign({},fl,{z:-fl.z,yaw:-(fl.yaw||0)});}
  return P;}
/* ---------- clips ---------- */
const READY={lf:40,la:25,lt:0,le:62,lw:0,rf:40,ra:25,rt:0,re:62,rw:0};
const CLIPS={};
/* Outside hitter, right-handed 4-step approach (R-L-R-L), two-foot take-off, high contact, two-foot landing, transition off the net. */
CLIPS.spike=(function(){const dur=4.6,tTO=1.6,tLand=2.38,v0=3.45,g=9.81,y0=.93;
  const fly=t=>y0+v0*(t-tTO)-.5*g*(t-tTO)*(t-tTO);
  return {dur,contact:1.96,tTO,tLand,
  ch:{x:[[0,-3.72],[.35,-3.72],[.68,-3.42],[.98,-2.72],[1.3,-1.82],[1.46,-1.34],[1.6,-1.2],[tLand,-.62],[2.6,-.55],[2.9,-.75],[3.4,-1.75],[3.95,-3.0],[4.3,-3.6],[4.6,-3.72]],
    // deep, fast countermovement on the plant, then an explosive rise into the jump; deep two-foot absorb on landing
    y:t=>{if(t<tTO){return track([[0,.93],[.35,.92],[.7,.9],[1.0,.86],[1.3,.79],[1.44,.7],[1.5,.72],[1.55,.8],[tTO,y0]],t);}if(t<tLand)return fly(t);
      return track([[tLand,fly(tLand)],[2.48,.68],[2.56,.66],[2.8,.86],[3.05,.93],[3.6,.9],[4.0,.9],[4.6,.93]],t);},
    z:[[0,0],[2.9,0],[3.4,.15],[4.0,.05],[4.6,0]],
    // hips open on the bow and arrow, then lead the swing and rotate through
    yaw:[[0,0],[1.3,0],[1.46,-12],[1.6,-20],[1.84,-40],[1.94,-14],[2.04,12],[2.18,18],[tLand,4],[2.9,0],[3.3,-8],[4.0,0],[4.6,0]],
    lean:[[0,20],[.4,18],[1.0,24],[1.3,32],[1.44,46],[1.52,32],[tTO,8],[1.72,-6],[1.86,-14],[1.95,4],[2.06,26],[2.2,22],[tLand,30],[2.52,36],[2.8,16],[3.4,12],[4.2,18],[4.6,20]],
    arch:[[0,0],[1.66,0],[1.8,20],[1.88,26],[1.94,8],[2.0,0]],crunch:[[0,0],[1.92,0],[2.0,24],[2.1,34],[2.25,12],[2.42,4],[2.6,0]],
    twist:[[0,0],[1.55,0],[1.7,-16],[1.86,-38],[1.94,-6],[2.02,22],[2.14,30],[2.35,6],[2.6,0]],side:[[0,0],[1.84,-8],[1.96,6],[2.08,10],[2.3,0]],
    hp:[[0,8],[1.5,0],[1.8,-32],[1.96,-24],[2.12,6],[2.6,0],[4.6,8]],
    // arms: full swing back on the plant, violent drive up, bow and arrow, high contact, follow through across the body
    rf:[[0,35],[.7,48],[1.0,25],[1.3,-55],[1.44,-74],[1.52,-40],[1.6,80],[1.68,150],[1.8,116],[1.88,120],[1.96,174],[2.02,150],[2.12,62],[2.25,25],[2.5,22],[3.0,30],[4.6,35]],
    ra:[[0,25],[1.44,6],[1.6,10],[1.72,60],[1.82,112],[1.9,92],[1.96,20],[2.04,-8],[2.14,-34],[2.3,0],[4.6,25]],
    rt:[[0,0],[1.8,18],[1.9,26],[1.96,-4],[2.1,-24],[2.4,0]],
    re:[[0,62],[1.0,30],[1.3,12],[1.44,6],[1.6,30],[1.72,80],[1.82,126],[1.9,104],[1.96,4],[2.05,10],[2.2,36],[3.0,55],[4.6,62]],rw:[[0,0],[1.9,-30],[1.96,10],[2.02,45],[2.15,20],[2.35,0]],
    lf:[[0,35],[.7,22],[1.0,45],[1.3,-55],[1.44,-74],[1.52,-40],[1.6,96],[1.7,170],[1.84,165],[1.94,112],[2.04,30],[2.18,-15],[2.4,25],[3.0,30],[4.6,35]],la:[[0,25],[1.44,6],[1.7,8],[1.94,20],[2.06,-20],[2.25,15],[4.6,25]],
    le:[[0,62],[1.0,30],[1.3,12],[1.44,6],[1.6,15],[1.8,10],[1.94,40],[2.06,95],[2.25,60],[3.0,55],[4.6,62]]},
  feet:{R:[{t0:0,t1:.40,x:-3.55,z:.13,yaw:4},{t0:.68,t1:.92,x:-3.12,z:.15,yaw:2,h:.07},{t0:1.28,t1:tTO,x:-1.22,z:.2,yaw:-14,heel:true,toe:55,air:[[.12,.04,-.74,.08,45],[.33,-.24,-.56,.1,40],[.46,.12,-.62,.08,22],[.64,.2,-.7,.08,10],[.9,.1,-.86,.1,0]]},
      {t0:tLand,t1:2.95,x:-.58,z:.16,yaw:-4,heel:true},{t0:3.2,t1:3.42,x:-1.45,z:.3,yaw:-6},{t0:3.68,t1:3.9,x:-2.55,z:.2,yaw:-4},{t0:4.16,t1:4.6,x:-3.55,z:.13,yaw:4}],
    L:[{t0:0,t1:.6,x:-3.6,z:-.14,yaw:-4},{t0:.97,t1:1.22,x:-2.48,z:-.13,yaw:0,h:.1},{t0:1.44,t1:tTO,x:-1.1,z:-.14,yaw:-38,toe:55,air:[[.12,.08,-.75,-.06,45],[.33,-.16,-.58,-.08,40],[.46,.18,-.6,-.1,22],[.64,.24,-.7,-.12,10],[.9,.14,-.86,-.12,0]]},
      {t0:tLand+.02,t1:3.05,x:-.5,z:-.14,yaw:-10,heel:true},{t0:3.45,t1:3.66,x:-2.05,z:.0,yaw:-4},{t0:3.92,t1:4.14,x:-3.1,z:-.1,yaw:-4},{t0:4.36,t1:4.6,x:-3.6,z:-.14,yaw:-4}]},
  labels:[[0,"Ready: weight forward"],[.4,"Step 1 (right): direction"],[.68,"Step 2 (left): build speed"],[1.0,"Step 3 (right): long, fast, arms back"],[1.42,"Step 4 (left): close and plant"],[1.55,"Take-off: arms drive up"],[1.75,"Bow and arrow"],[1.91,"Contact: high and in front"],[2.04,"Follow through"],[2.32,"Two-foot landing"],[2.75,"Transition off the net"],[4.2,"Ready for the next ball"]],
  ball:(t,h)=>{const tc=1.98,setT=.95,S=[-.55,2.55,3.6],C=h.contact;
    if(t<setT){const u=t/setT,A=[-5.2,.8,1.4];return [lerp(A[0],S[0],u),lerp(A[1],S[1],u)+4*2.2*u*(1-u),lerp(A[2],S[2],u)];}
    if(t<tc){const u=(t-setT)/(tc-setT);return [lerp(S[0],C[0],u),lerp(S[1],C[1],u)+4*2.2*u*(1-u),lerp(S[2],C[2],u)];}
    const u=(t-tc)/.36,E=[5.4,.11,-.8];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.25*u*(1-u),lerp(C[2],E[2],u)];
    const v=(t-tc-.36);if(v<.9)return [E[0]+v*2.6,.11+Math.abs(Math.sin(v*5))*Math.exp(-v*2.5)*1.2,E[2]-v*.6];return null;}};})();
/* Middle blocker: read, shuffle right, load, press over the net, land, shuffle back. */
CLIPS.block=(function(){const dur=3.8,tTO=1.25,tLand=1.92,v0=3.2,g=9.81,y0=.92;const fly=t=>y0+v0*(t-tTO)-.5*g*(t-tTO)*(t-tTO);
  const UP={lf:115,la:8,le:95,rf:115,ra:8,re:95};
  return {dur,contact:1.56,tTO,tLand,hand:"both",
  ch:{x:-.48,z:[[0,0],[.5,0],[.78,.45],[1.0,.95],[tLand,.95],[2.5,.95],[2.85,.5],[3.2,0],[3.8,0]],
    y:t=>{if(t<tTO)return track([[0,.88],[.5,.88],[.8,.86],[1.02,.8],[1.12,.69],[1.18,.72],[tTO,y0]],t);if(t<tLand)return fly(t);return track([[tLand,fly(tLand)],[2.08,.74],[2.35,.88],[3.8,.88]],t);},
    yaw:0,lean:[[0,8],[1.1,14],[tTO,0],[1.5,-2],[1.62,6],[1.8,10],[2.08,16],[2.4,8],[3.8,8]],crunch:[[0,0],[1.5,0],[1.6,10],[1.8,0]],hp:[[0,-10],[1.0,-14],[1.5,-6],[2.0,-10],[3.8,-10]],hy:[[0,-15],[.5,10],[1.0,0]],
    lf:[[0,UP.lf],[1.0,110],[1.14,100],[1.3,150],[1.45,172],[1.6,168],[1.8,150],[2.08,110],[3.8,UP.lf]],la:[[0,20],[1.3,14],[1.45,12],[1.6,10],[2.08,18],[3.8,20]],le:[[0,UP.le],[1.0,90],[1.14,96],[1.3,40],[1.45,6],[1.6,8],[1.8,30],[2.08,80],[3.8,UP.le]],lw:[[0,0],[1.5,10],[1.6,-20],[1.8,0]],
    rf:[[0,UP.rf],[1.0,110],[1.14,100],[1.3,150],[1.45,172],[1.6,168],[1.8,150],[2.08,110],[3.8,UP.rf]],ra:[[0,20],[1.3,14],[1.45,12],[1.6,10],[2.08,18],[3.8,20]],re:[[0,UP.re],[1.0,90],[1.14,96],[1.3,40],[1.45,6],[1.6,8],[1.8,30],[2.08,80],[3.8,UP.re]],rw:[[0,0],[1.5,10],[1.6,-20],[1.8,0]]},
  feet:{R:[{t0:0,t1:.55,x:-.42,z:.17},{t0:.72,t1:.86,x:-.42,z:.72,h:.06,roll:false},{t0:1.0,t1:tTO,x:-.43,z:1.12,toe:50,air:[[.3,.03,-.8,.16,25],[.7,.03,-.8,.16,20]]},{t0:tLand,t1:2.6,x:-.42,z:1.12,heel:false},{t0:2.78,t1:2.95,x:-.42,z:.62,h:.05,roll:false},{t0:3.15,t1:3.8,x:-.42,z:.17}],
    L:[{t0:0,t1:.68,x:-.42,z:-.17},{t0:.84,t1:.98,x:-.42,z:.4,h:.06,roll:false},{t0:1.06,t1:tTO,x:-.43,z:.78,toe:50,air:[[.3,.03,-.8,-.16,25],[.7,.03,-.8,-.16,20]]},{t0:tLand+.01,t1:2.7,x:-.42,z:.78},{t0:2.95,t1:3.1,x:-.42,z:.3,h:.05,roll:false},{t0:3.25,t1:3.8,x:-.42,z:-.17}]},
  labels:[[0,"Ready: hands up at the net"],[.5,"Read the setter"],[.7,"Shuffle step"],[1.02,"Close and load"],[tTO,"Jump straight up"],[1.42,"Press over the net"],[1.56,"Seal: thumbs up, fingers spread"],[1.75,"Pull hands back"],[1.95,"Land on two feet"],[2.6,"Shuffle back to base"]],
  ball:(t,h)=>{const tc=1.56,C=h.contact,A=[3.2,3.1,1.6];if(t<.9)return null;if(t<tc){const u=(t-.9)/(tc-.9);return [lerp(A[0],C[0]+.12,u),lerp(A[1],C[1]+.06,u)+.25*u*(1-u),lerp(A[2],C[2],u)];}
    const v=t-tc;if(v<1.0)return [C[0]+.12+v*3.2,Math.max(.11,C[1]+v*.6-4.9*v*v),C[2]+v*.4];return null;}};})();
/* Setter: release from base, square to the left pin, jump set at the peak, land, back to base. Faces -z. */
CLIPS.set=(function(){const dur=3.9,tTO=1.36,tLand=1.92,v0=2.4,g=9.81,y0=.93;const fly=t=>y0+v0*(t-tTO)-.5*g*(t-tTO)*(t-tTO);
  return {dur,contact:1.6,tTO,tLand,hand:"both",
  ch:{x:[[0,-1.9],[.3,-1.9],[.65,-1.35],[.95,-.85],[1.2,-.72],[2.75,-.72],[3.3,-1.4],[3.9,-1.9]],z:[[0,.6],[.3,.6],[.95,.15],[1.2,.05],[2.5,.05],[3.3,.45],[3.9,.6]],
    y:t=>{if(t<tTO)return track([[0,.9],[.3,.9],[.7,.92],[1.05,.88],[1.2,.76],[1.28,.79],[tTO,y0]],t);if(t<tLand)return fly(t);return track([[tLand,fly(tLand)],[2.05,.8],[2.3,.92],[3.9,.9]],t);},
    yaw:[[0,0],[.5,10],[.95,60],[1.2,88],[2.6,88],[3.3,40],[3.9,0]],lean:[[0,16],[.6,14],[1.0,10],[1.22,14],[tTO,0],[1.6,-6],[1.75,0],[2.05,12],[2.4,8],[3.9,16]],arch:[[0,0],[1.5,0],[1.62,10],[1.78,0]],
    hp:[[0,0],[1.0,-15],[1.45,-38],[1.6,-40],[1.8,-10],[2.3,0]],hy:[[0,-30],[.6,-50],[1.0,-40],[1.2,0]],
    lf:[[0,40],[.6,30],[1.0,95],[1.2,120],[1.45,140],[1.55,138],[1.6,150],[1.72,168],[1.9,120],[2.2,50],[3.9,40]],la:[[0,25],[1.2,38],[1.55,42],[1.72,22],[2.2,25],[3.9,25]],lt:0,
    le:[[0,62],[.6,70],[1.0,110],[1.45,108],[1.55,110],[1.6,90],[1.72,20],[1.9,20],[2.2,60],[3.9,62]],lw:[[0,0],[1.4,-50],[1.6,-50],[1.72,10],[1.9,0]],
    rf:[[0,40],[.6,50],[1.0,95],[1.2,120],[1.45,140],[1.55,138],[1.6,150],[1.72,168],[1.9,120],[2.2,50],[3.9,40]],ra:[[0,25],[1.2,38],[1.55,42],[1.72,22],[2.2,25],[3.9,25]],rt:0,
    re:[[0,62],[.6,70],[1.0,110],[1.45,108],[1.55,110],[1.6,90],[1.72,20],[1.9,20],[2.2,60],[3.9,62]],rw:[[0,0],[1.4,-50],[1.6,-50],[1.72,10],[1.9,0]]},
  feet:{R:[{t0:0,t1:.35,x:-1.85,z:.78,yaw:0},{t0:.62,t1:.82,x:-1.15,z:.42,yaw:40},{t0:1.12,t1:tTO,x:-.62,z:.18,yaw:88,toe:45,air:[[.4,.06,-.72,.12,25]]},{t0:tLand,t1:2.75,x:-.62,z:.16,yaw:88},{t0:3.05,t1:3.3,x:-1.3,z:.55,yaw:40},{t0:3.6,t1:3.9,x:-1.85,z:.78,yaw:0}],
    L:[{t0:0,t1:.55,x:-1.95,z:.44,yaw:0},{t0:.85,t1:1.05,x:-.92,z:.1,yaw:70},{t0:1.2,t1:tTO,x:-.85,z:-.12,yaw:88,toe:45,air:[[.4,-.06,-.72,-.1,25]]},{t0:tLand+.02,t1:2.9,x:-.86,z:-.12,yaw:88},{t0:3.2,t1:3.45,x:-1.5,z:.3,yaw:30},{t0:3.68,t1:3.9,x:-1.95,z:.44,yaw:0}]},
  labels:[[0,"Base: read the pass"],[.35,"Release to target"],[.95,"Square to the left pin"],[1.2,"Hands up early, load"],[tTO,"Jump set"],[1.5,"Ball above the forehead"],[1.62,"Extend through the ball"],[1.95,"Land balanced"],[2.7,"Back to base"]],
  ball:(t,h)=>{const tc=1.6,C=h.contact,A=[-6,1.0,1.2];if(t<.2)return null;if(t<tc){const u=(t-.2)/(tc-.2);return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+4*2.6*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.25,E=[-.8,2.4,-4.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*1.6*u*(1-u),lerp(C[2],E[2],u)];return null;}};})();
/* Libero: split step, read, shuffle right, platform, angle to target, recover. */
CLIPS.dig=(function(){const dur=3.4;
  return {dur,contact:1.32,hand:"platform",
  ch:{x:-6.2,z:[[0,0],[.85,0],[1.12,.55],[1.32,.62],[2.3,.62],[2.9,0],[3.4,0]],
    y:[[0,.82],[.6,.82],[.72,.9],[.82,.76],[1.12,.66],[1.32,.62],[1.45,.68],[1.8,.8],[3.4,.82]],yaw:[[0,0],[1.1,-6],[1.5,-10],[2.3,0],[3.4,0]],
    lean:[[0,30],[.7,24],[.82,32],[1.15,36],[1.32,30],[1.5,24],[2.0,28],[3.4,30]],side:[[0,0],[1.1,6],[1.32,8],[1.6,0]],hp:[[0,-12],[1.32,-6],[1.6,-20],[2.0,-10],[3.4,-12]],
    lf:[[0,38],[.82,42],[1.05,62],[1.2,68],[1.32,66],[1.5,72],[1.9,40],[3.4,38]],la:[[0,25],[1.05,-16],[1.2,-19],[1.5,-19],[1.9,20],[3.4,25]],lt:0,le:[[0,60],[1.05,10],[1.2,0],[1.5,0],[1.9,55],[3.4,60]],
    rf:[[0,38],[.82,42],[1.05,62],[1.2,68],[1.32,66],[1.5,72],[1.9,40],[3.4,38]],ra:[[0,25],[1.05,-16],[1.2,-19],[1.5,-19],[1.9,20],[3.4,25]],rt:0,re:[[0,60],[1.05,10],[1.2,0],[1.5,0],[1.9,55],[3.4,60]]},
  feet:{R:[{t0:0,t1:.72,x:-6.15,z:.3,yaw:6,roll:false},{t0:.8,t1:.9,x:-6.15,z:.34,yaw:6,h:.04,roll:false},{t0:1.1,t1:2.35,x:-6.1,z:.98,yaw:4,h:.06,roll:false},{t0:2.75,t1:3.4,x:-6.15,z:.3,yaw:6,roll:false}],
    L:[{t0:0,t1:.72,x:-6.25,z:-.3,yaw:-6,roll:false},{t0:.8,t1:1.0,x:-6.25,z:-.34,yaw:-6,h:.04,roll:false},{t0:1.16,t1:2.5,x:-6.28,z:.3,yaw:-4,h:.06,roll:false},{t0:2.9,t1:3.4,x:-6.25,z:-.3,yaw:-6,roll:false}]},
  labels:[[0,"Low ready, weight on the toes"],[.7,"Split step as the hitter swings"],[.9,"Read and move"],[1.12,"Stop, platform out early"],[1.32,"Contact: arms still, legs lift"],[1.5,"Angle to the setter"],[2.0,"Recover to base"]],
  ball:(t,h)=>{const tc=1.32,C=h.contact,A=[.2,3.0,-1.2];if(t<.88)return null;if(t<tc){const u=(t-.88)/(tc-.88);return [lerp(A[0],C[0],u),lerp(A[1],C[1],u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.3,E=[-.9,2.6,.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*3.4*u*(1-u),lerp(C[2],E[2],u)];return null;}};})();
/* Opposite: jump serve. Toss with the hitting hand, 3-step approach (L-R-L), broad jump into the court, contact, land, walk back. */
CLIPS.serve=(function(){const dur=5.0,tTO=1.62,tLand=2.42,v0=3.0,g=9.81,y0=.9;const fly=t=>y0+v0*(t-tTO)-.5*g*(t-tTO)*(t-tTO);
  return {dur,contact:2.0,tTO,tLand,
  ch:{x:[[0,-12.6],[.55,-12.6],[.95,-12.2],[1.25,-11.55],[1.5,-10.75],[tTO,-10.55],[tLand,-9.55],[2.65,-9.45],[3.0,-9.6],[4.2,-12.2],[4.7,-12.6],[5.0,-12.6]],
    y:t=>{if(t<tTO)return track([[0,.93],[.5,.93],[.9,.9],[1.25,.86],[1.48,.76],[tTO,y0]],t);if(t<tLand)return fly(t);return track([[tLand,fly(tLand)],[2.56,.76],[2.85,.9],[3.2,.93],[5.0,.93]],t);},
    yaw:[[0,0],[1.5,-10],[1.8,-30],[2.0,-8],[2.2,8],[tLand,0],[3.1,0],[3.3,180],[4.3,180],[4.6,0],[5.0,0]],
    lean:[[0,6],[.6,4],[1.0,20],[1.45,36],[tTO,8],[1.85,-8],[2.0,-2],[2.15,22],[2.5,28],[2.9,10],[3.3,4],[5.0,6]],
    arch:[[0,0],[1.75,0],[1.88,18],[1.98,6],[2.06,0]],crunch:[[0,0],[1.96,0],[2.04,24],[2.14,34],[2.3,12],[2.45,4],[2.6,0]],twist:[[0,0],[1.65,0],[1.74,-16],[1.88,-38],[1.98,-6],[2.06,22],[2.18,30],[2.4,6],[2.6,0]],hp:[[0,0],[.5,-35],[.9,-30],[1.4,-20],[1.85,-30],[2.0,-22],[2.2,6],[2.6,0]],
    rf:[[0,60],[.3,95],[.5,175],[.62,160],[1.0,40],[1.3,-50],[1.5,-60],[1.62,95],[1.72,140],[1.84,105],[1.9,112],[2.0,172],[2.08,120],[2.3,30],[2.6,22],[3.0,30],[4.6,40],[5.0,60]],
    ra:[[0,30],[.5,10],[1.0,20],[1.5,8],[1.74,50],[1.84,100],[1.92,70],[2.0,18],[2.15,-12],[2.4,10],[5.0,30]],rt:[[0,0],[2.0,0],[2.18,-25],[2.4,0]],
    re:[[0,80],[.3,40],[.5,8],[1.0,30],[1.3,12],[1.5,10],[1.62,40],[1.74,80],[1.84,118],[1.92,80],[2.0,6],[2.12,18],[2.3,40],[3.0,55],[5.0,80]],rw:[[0,30],[.45,40],[.55,-10],[1.0,0],[1.94,-20],[2.0,30],[2.12,40],[2.35,0],[5.0,30]],
    lf:[[0,45],[.5,60],[1.0,30],[1.3,-50],[1.5,-60],[1.62,100],[1.74,165],[1.86,160],[1.98,120],[2.08,40],[2.28,-10],[2.6,25],[3.0,30],[5.0,45]],la:[[0,25],[1.5,8],[1.74,10],[1.98,25],[2.12,-15],[2.35,20],[5.0,25]],
    le:[[0,50],[1.0,30],[1.3,12],[1.5,10],[1.62,20],[1.84,12],[1.98,30],[2.12,70],[2.35,60],[3.0,55],[5.0,50]]},
  feet:{L:[{t0:0,t1:.85,x:-12.5,z:-.15},{t0:1.1,t1:1.32,x:-11.75,z:-.13,h:.1},{t0:1.5,t1:tTO,x:-10.45,z:-.13,yaw:-36,toe:55,air:[[.3,.22,-.64,-.03,30],[.6,.14,-.6,-.06,25],[.85,.14,-.82,-.1,8]]},
      {t0:tLand+.02,t1:3.05,x:-9.4,z:-.14,yaw:-8,heel:true},{t0:3.3,t1:3.5,x:-10.0,z:-.14,yaw:180},{t0:3.7,t1:3.9,x:-10.9,z:-.14,yaw:180},{t0:4.1,t1:4.3,x:-11.8,z:-.14,yaw:180},{t0:4.55,t1:5.0,x:-12.5,z:-.15,yaw:0}],
    R:[{t0:0,t1:.98,x:-12.62,z:.15},{t0:1.3,t1:tTO,x:-10.6,z:.2,yaw:-14,heel:true,toe:55,air:[[.3,.12,-.62,.06,30],[.6,.05,-.55,.07,25],[.85,.08,-.82,.05,8]]},
      {t0:tLand,t1:2.95,x:-9.5,z:.16,yaw:-4,heel:true},{t0:3.2,t1:3.42,x:-9.7,z:.14,yaw:90},{t0:3.55,t1:3.75,x:-10.45,z:.14,yaw:180},{t0:3.95,t1:4.15,x:-11.35,z:.14,yaw:180},{t0:4.35,t1:4.55,x:-12.2,z:.14,yaw:180},{t0:4.75,t1:5.0,x:-12.62,z:.15,yaw:0}]},
  labels:[[0,"Behind the end line, ball in the hitting hand"],[.45,"Toss: high and into the court"],[.9,"Step 1 (left)"],[1.3,"Step 2 (right): long"],[1.5,"Step 3 (left): plant"],[tTO,"Take-off"],[1.78,"Bow and arrow"],[1.96,"Contact: on top of the ball"],[2.1,"Follow through"],[2.42,"Land inside the court"],[3.1,"Back to the line"]],
  ball:(t,h)=>{const tc=2.0,C=h.contact;if(t<.5){const hp=h.hand(t);return hp;}if(t<tc){const A=h.hand(.5),u=(t-.5)/(tc-.5);return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+4*2.0*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/.95,E=[6.5,.11,.5];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*.9*u*(1-u),lerp(C[2],E[2],u)];const v=t-tc-.95;if(v<.7)return [E[0]+v*2,.11+Math.abs(Math.sin(v*5))*Math.exp(-v*3),E[2]];return null;}};})();
/* Back-row attack (pipe): the spike approach started 2.3 m deeper, take-off behind the 3 m line, broad jump forward over it. */
CLIPS.pipe=(function(){const S=CLIPS.spike,dx=-2.3,br=.55,tTO=S.tTO,tLand=S.tLand,c={};
  const shiftX=t=>{const base=track(S.ch.x,t)+dx;if(t<=tTO)return base;if(t<tLand)return base+br*(t-tTO)/(tLand-tTO);if(t<2.95)return base+br;return base+br*(1-sm((t-2.95)/1.2));};
  Object.keys(S.ch).forEach(k=>{c[k]=S.ch[k];});c.x=shiftX;
  const mv=(pl,i0,extra)=>pl.map((p,i)=>Object.assign({},p,{x:p.x+dx+(i>=i0?(extra(i,p)):0)}));
  const feet={R:mv(S.feet.R,3,(i,p)=>i===3?br:i===4?br*.6:i===5?br*.25:0),L:mv(S.feet.L,3,(i,p)=>i===3?br:i===4?br*.5:i===5?br*.15:0)};
  const labels=S.labels.map(l=>l[1]==="Take-off: arms drive up"?[l[0],"Take-off behind the 3 m line"]:l[1]==="Two-foot landing"?[l[0],"Land past the line: that is legal"]:l);
  return {dur:S.dur,contact:S.contact,tTO,tLand,ch:c,feet,labels,
    ball:(t,h)=>{const tc=S.contact,setT=.95,St=[-.55,2.55,3.6],C=h.contact;
      if(t<setT){const u=t/setT,A=[-6.4,.8,1.6];return [lerp(A[0],St[0],u),lerp(A[1],St[1],u)+4*2.0*u*(1-u),lerp(A[2],St[2],u)];}
      if(t<tc){const u=(t-setT)/(tc-setT);return [lerp(St[0],C[0],u),lerp(St[1],C[1],u)+4*1.6*u*(1-u),lerp(St[2],C[2],u)];}
      const u=(t-tc)/.5,E=[7.4,.11,-1.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.5*u*(1-u),lerp(C[2],E[2],u)];return null;}};})();
/* Slide (right-handed middle): run along the net, plant the left foot, one-foot take-off driving the right knee, drift and hit. */
CLIPS.slide=(function(){const dur=4.2,tTO=1.36,tLand=2.0,v0=3.0,g=9.81,y0=.95;const fly=t=>y0+v0*(t-tTO)-.5*g*(t-tTO)*(t-tTO);
  return {dur,contact:1.68,tTO,tLand,
  ch:{x:[[0,-2.5],[.4,-2.45],[.75,-2.05],[1.05,-1.55],[1.25,-1.15],[tTO,-1.0],[tLand,-.82],[2.3,-.85],[3.0,-1.6],[3.7,-2.35],[4.2,-2.5]],
    z:[[0,-.9],[.4,-.85],[.75,-.25],[1.05,.6],[1.25,1.35],[tTO,1.62],[tLand,2.75],[2.3,2.9],[3.0,1.6],[3.7,-.4],[4.2,-.9]],
    y:t=>{if(t<tTO)return track([[0,.93],[.4,.92],[.8,.9],[1.1,.85],[1.25,.8],[tTO,y0]],t);if(t<tLand)return fly(t);return track([[tLand,fly(tLand)],[2.15,.78],[2.4,.9],[4.2,.93]],t);},
    yaw:[[0,0],[.5,-35],[1.0,-70],[1.25,-78],[tTO,-70],[1.55,-55],[1.68,-30],[1.85,-20],[tLand,-25],[2.5,-20],[3.0,160],[3.7,180],[4.0,40],[4.2,0]],
    lean:[[0,18],[.8,22],[1.2,26],[tTO,8],[1.5,-8],[1.68,-2],[1.82,20],[2.1,24],[2.5,10],[4.2,18]],side:[[0,0],[1.1,8],[1.3,14],[tTO,10],[1.6,-4],[1.9,0]],
    arch:[[0,0],[1.48,0],[1.58,14],[1.68,4],[1.75,0]],crunch:[[0,0],[1.68,0],[1.82,20],[2.05,0]],twist:[[0,0],[1.4,0],[1.58,-28],[1.68,8],[1.82,24],[2.1,0]],hp:[[0,0],[1.2,-15],[1.55,-30],[1.68,-22],[1.9,5],[2.4,0]],hy:[[0,0],[.6,40],[1.2,50],[1.6,20],[1.8,0]],
    rf:[[0,35],[.6,40],[1.0,-30],[1.22,-45],[tTO,110],[1.48,140],[1.56,112],[1.62,118],[1.68,172],[1.78,110],[1.95,30],[2.3,25],[4.2,35]],ra:[[0,25],[1.22,8],[1.4,30],[1.5,70],[1.56,112],[1.62,80],[1.68,18],[1.8,-12],[2.1,15],[4.2,25]],
    re:[[0,62],[1.0,25],[1.22,12],[tTO,40],[1.48,85],[1.56,118],[1.62,80],[1.68,6],[1.8,20],[2.2,45],[4.2,62]],rt:[[0,0],[1.68,0],[1.82,-25],[2.1,0]],rw:[[0,0],[1.62,-20],[1.68,30],[1.8,40],[2.0,0]],
    lf:[[0,35],[.6,30],[1.0,-30],[1.22,-45],[tTO,130],[1.5,160],[1.62,120],[1.75,40],[1.95,-10],[2.3,25],[4.2,35]],la:[[0,25],[1.22,8],[1.5,15],[1.75,-15],[2.1,20],[4.2,25]],le:[[0,62],[1.0,25],[1.22,12],[tTO,20],[1.6,25],[1.8,70],[2.2,50],[4.2,62]]},
  feet:{L:[{t0:0,t1:.55,x:-2.48,z:-1.05,yaw:0},{t0:.82,t1:1.0,x:-1.85,z:.15,yaw:-60,h:.1},{t0:1.18,t1:tTO,x:-1.02,z:1.55,yaw:-70,toe:42,air:[[.3,.08,-.78,-.1,30],[.65,.06,-.8,-.12,25]]},{t0:tLand,t1:2.6,x:-.85,z:2.62,yaw:-25,heel:true},{t0:2.85,t1:3.05,x:-1.35,z:2.0,yaw:150},{t0:3.3,t1:3.5,x:-2.0,z:.8,yaw:180},{t0:3.72,t1:3.9,x:-2.42,z:-.55,yaw:60},{t0:4.08,t1:4.2,x:-2.48,z:-1.05,yaw:0}],
    R:[{t0:0,t1:.42,x:-2.52,z:-.75,yaw:0},{t0:.62,t1:.8,x:-2.25,z:-.45,yaw:-40,h:.08},{t0:.98,t1:1.16,x:-1.45,z:.75,yaw:-75,h:.12},{t0:1.3,t1:1.3,x:-1.1,z:1.62,yaw:-70},{t0:1.31,t1:1.31,x:-1.1,z:1.62,yaw:-70,air:[[.2,.25,-.5,.15,10],[.5,.3,-.42,.12,10],[.85,.12,-.75,.12,8]]},{t0:tLand+.03,t1:2.65,x:-.8,z:2.98,yaw:-25,heel:true},{t0:2.95,t1:3.15,x:-1.6,z:1.6,yaw:160},{t0:3.45,t1:3.65,x:-2.2,z:.35,yaw:180},{t0:3.9,t1:4.2,x:-2.52,z:-.75,yaw:0}]},
  labels:[[0,"Start inside the court, read the pass"],[.45,"Run parallel to the net"],[1.0,"Curve: shoulders open to the court"],[1.2,"Plant off the left foot"],[tTO,"One-foot take-off, right knee drives up"],[1.5,"Drift along the net"],[1.66,"Contact: high, in front of the hitting shoulder"],[1.82,"Follow through across the body"],[2.0,"Land on both feet, away from the net"],[2.6,"Cover, then back to base"]],
  ball:(t,h)=>{const tc=1.68,C=h.contact,S=[-.75,2.4,.3];if(t<.75)return null;if(t<1.0){const u=(t-.75)/.25,A=[-5.5,.9,-1];return [lerp(A[0],S[0],u),lerp(A[1],S[1],u)+.6*u,lerp(A[2],S[2],u)];}
    if(t<tc){const u=(t-1.0)/(tc-1.0);return [lerp(S[0],C[0],u),lerp(S[1],C[1],u)+4*.5*u*(1-u),lerp(S[2],C[2],u)];}
    const u=(t-tc)/.42,E=[6.4,.11,3.4];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.3*u*(1-u),lerp(C[2],E[2],u)];return null;}};})();
/* Standing float serve: stance with the left foot forward, low toss, high elbow, step and punch through the centre of the ball, no follow-through. */
CLIPS.float=(function(){const dur=3.8;
  return {dur,contact:1.42,hand:"R",
  ch:{x:[[0,-10.0],[.8,-10.0],[1.15,-9.86],[1.42,-9.72],[1.7,-9.62],[2.4,-9.4],[3.2,-9.95],[3.8,-10.0]],z:.02,y:[[0,.95],[.8,.95],[1.1,.92],[1.42,.95],[1.8,.95],[3.8,.95]],
    yaw:[[0,-28],[.9,-30],[1.2,-22],[1.42,-6],[1.7,-2],[2.4,0],[2.8,180],[3.4,180],[3.8,-28]],lean:[[0,6],[1.1,2],[1.42,8],[1.8,10],[2.4,6],[3.8,6]],twist:[[0,0],[1.1,-22],[1.42,6],[1.7,4],[2.2,0]],hp:[[0,-10],[.7,-45],[1.2,-45],[1.42,-28],[1.8,-5],[2.4,0],[3.8,-10]],
    lf:[[0,62],[.6,62],[.82,115],[.95,118],[1.1,80],[1.42,40],[1.8,30],[2.4,35],[3.8,62]],la:[[0,0],[.82,10],[1.1,15],[1.42,25],[3.8,0]],le:[[0,70],[.6,70],[.82,10],[1.1,30],[1.42,60],[1.8,55],[3.8,70]],
    rf:[[0,62],[.5,62],[.8,95],[1.05,112],[1.25,120],[1.42,165],[1.6,160],[1.75,150],[2.1,40],[3.8,62]],ra:[[0,15],[.8,70],[1.05,105],[1.25,95],[1.42,30],[1.75,30],[2.1,20],[3.8,15]],
    re:[[0,70],[.5,60],[.8,100],[1.05,120],[1.25,110],[1.42,4],[1.75,6],[2.1,40],[3.8,70]],rw:[[0,0],[1.38,-25],[1.42,-25],[1.75,-25],[2.0,0]]},
  feet:{L:[{t0:0,t1:1.1,x:-9.75,z:-.12,yaw:-20,roll:false},{t0:1.3,t1:2.0,x:-9.42,z:-.1,yaw:-10,roll:false,h:.06},{t0:2.25,t1:2.6,x:-9.3,z:-.12,yaw:0},{t0:2.95,t1:3.15,x:-9.8,z:-.12,yaw:180},{t0:3.45,t1:3.8,x:-9.75,z:-.12,yaw:-20}],
    R:[{t0:0,t1:1.36,x:-10.15,z:.2,yaw:-35,roll:false},{t0:1.66,t1:2.4,x:-9.62,z:.16,yaw:-10},{t0:2.7,t1:2.9,x:-9.55,z:.16,yaw:180},{t0:3.2,t1:3.8,x:-10.15,z:.2,yaw:-35,roll:false}]},
  labels:[[0,"Stance: left foot forward, ball held in front of the hitting shoulder"],[.75,"Low toss, about one ball above your reach"],[.95,"Elbow back and high, eyes on the ball"],[1.15,"Step toward the target"],[1.38,"Contact: firm hand, middle of the ball"],[1.55,"Stop the hand: no follow-through, no spin"],[2.0,"Walk into the court to your base"]],
  ball:(t,h)=>{const C=h.contact,L=h.left(.8);if(t<.8)return h.left(t);if(t<1.42){const u=(t-.8)/.62;return [lerp(L[0],C[0],u),lerp(L[1],C[1],u)+4*.55*u*(1-u),lerp(L[2],C[2],u)];}
    const u=(t-1.42)/1.25,E=[6.4,.11,-1.2];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*1.1*u*(1-u),lerp(C[2],E[2],u)+.16*Math.sin(u*14)];return null;}};})();
/* Libero sprawl and pancake: read the tip, two quick steps, extend low, slide the hand flat under the ball, get up. */
CLIPS.sprawl=(function(){const dur=4.0;
  return {dur,contact:1.42,hand:"pancake",
  ch:{x:[[0,-5.6],[.65,-5.6],[.85,-5.45],[1.05,-5.1],[1.25,-4.75],[1.42,-4.35],[1.7,-4.15],[2.3,-4.2],[2.9,-4.6],[3.5,-5.4],[4.0,-5.6]],z:0,
    y:[[0,.78],[.65,.78],[.72,.86],[.85,.72],[1.05,.62],[1.2,.45],[1.33,.24],[1.42,.2],[1.7,.18],[2.0,.22],[2.3,.42],[2.6,.75],[2.9,.88],[4.0,.78]],
    lean:[[0,32],[.85,34],[1.05,48],[1.2,66],[1.33,80],[1.42,84],[1.7,86],[2.0,80],[2.3,55],[2.6,30],[3.0,18],[4.0,32]],hp:[[0,-14],[1.1,-40],[1.42,-70],[1.8,-70],[2.3,-30],[2.8,-5],[4.0,-14]],side:[[0,0],[1.2,-6],[1.5,-8],[2.0,0]],
    rf:[[0,40],[.85,45],[1.05,90],[1.25,150],[1.42,175],[1.7,172],[2.0,120],[2.3,60],[2.8,38],[4.0,40]],ra:[[0,25],[1.2,10],[1.42,6],[1.8,8],[2.3,20],[4.0,25]],re:[[0,60],[1.05,20],[1.3,4],[1.7,4],[2.0,40],[2.6,60],[4.0,60]],rw:[[0,0],[1.3,-50],[1.42,-60],[1.7,-55],[2.0,0]],
    lf:[[0,40],[.85,45],[1.1,70],[1.3,110],[1.42,120],[1.8,110],[2.0,60],[2.3,30],[4.0,40]],la:[[0,25],[1.2,40],[1.42,55],[1.8,55],[2.1,25],[4.0,25]],le:[[0,60],[1.1,40],[1.42,30],[1.8,50],[2.1,80],[2.4,60],[4.0,60]],lw:[[0,0],[1.4,-60],[1.9,-60],[2.1,0]]},
  feet:{L:[{t0:0,t1:.7,x:-5.6,z:-.3,yaw:-6,roll:false},{t0:.78,t1:.86,x:-5.6,z:-.32,yaw:-6,h:.04,roll:false},{t0:1.0,t1:1.12,x:-5.2,z:-.25,yaw:-4,toe:50,air:[[.25,-.55,-.55,-.15,60],[.5,-.8,-.08,-.16,95],[.7,-.72,.08,-.18,100],[.9,-.85,-.12,-.16,95]]},
      {t0:2.3,t1:2.75,x:-4.95,z:-.25,yaw:-4},{t0:3.0,t1:3.2,x:-5.15,z:-.3,yaw:-4,h:.06},{t0:3.45,t1:4.0,x:-5.6,z:-.3,yaw:-6,roll:false}],
    R:[{t0:0,t1:.7,x:-5.6,z:.3,yaw:6,roll:false},{t0:.8,t1:.95,x:-5.6,z:.32,yaw:6,h:.04,roll:false},{t0:1.08,t1:1.2,x:-4.85,z:.2,yaw:4,toe:50,air:[[.25,-.7,-.4,.15,70],[.5,-.85,-.05,.16,95],[.7,-.78,.12,.18,100],[.9,-.9,-.1,.16,95]]},
      {t0:2.4,t1:2.85,x:-4.6,z:.25,yaw:4},{t0:3.1,t1:3.3,x:-5.0,z:.3,yaw:6,h:.06},{t0:3.55,t1:4.0,x:-5.6,z:.3,yaw:6,roll:false}]},
  labels:[[0,"Low base, weight forward"],[.72,"Split step as the attacker swings"],[.85,"Read the tip: go early"],[1.05,"Push step, stay low"],[1.25,"Extend: chest toward the floor"],[1.38,"Pancake: hand flat, palm down, under the ball"],[1.6,"Slide on the chest and thighs, chin up"],[2.1,"Hands under the shoulders, push up"],[2.7,"Back on your feet, next ball"]],
  ball:(t,h)=>{const tc=1.42,C=h.contact;if(t<.75)return null;if(t<tc){const u=(t-.75)/(tc-.75),A=[-.3,3.1,-.4];return [lerp(A[0],C[0]+.02,u),lerp(A[1],C[1]+.13,u)+.6*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.1,E=[-1.4,2.4,1.2],S=[C[0],C[1]+.13,C[2]];if(u<=1)return [lerp(S[0],E[0],u),lerp(S[1],E[1],u)+4*1.6*u*(1-u),lerp(S[2],E[2],u)];return null;}};})();
/* Jump float: three steps (L-R-L), low toss off the left hand, small jump, flat punch, no follow-through. */
CLIPS.jumpfloat=(function(){const dur=4.4,tTO=1.6,tLand=2.15,v0=2.2,g=9.81,y0=.92;const fly=t=>y0+v0*(t-tTO)-.5*g*(t-tTO)*(t-tTO);
  return {dur,contact:1.84,tTO,tLand,
  ch:{x:[[0,-12.1],[.6,-12.1],[1.0,-11.6],[1.3,-10.95],[1.5,-10.45],[tTO,-10.32],[tLand,-9.75],[2.4,-9.65],[2.8,-9.6],[3.7,-11.7],[4.4,-12.1]],z:.0,
    y:t=>{if(t<tTO)return track([[0,.95],[.6,.95],[1.0,.92],[1.3,.88],[1.5,.8],[tTO,y0]],t);if(t<tLand)return fly(t);return track([[tLand,fly(tLand)],[2.3,.82],[2.5,.93],[4.4,.95]],t);},
    yaw:[[0,0],[1.3,-6],[1.6,-22],[1.84,-8],[2.2,0],[2.9,0],[3.1,180],[4.0,180],[4.3,0],[4.4,0]],lean:[[0,6],[1.0,14],[1.5,24],[tTO,6],[1.84,4],[2.2,14],[2.6,8],[4.4,6]],twist:[[0,0],[1.6,-10],[1.76,-24],[1.84,6],[2.0,4],[2.3,0]],hp:[[0,-10],[.7,-35],[1.6,-30],[1.84,-25],[2.2,0]],
    lf:[[0,62],[.55,62],[.75,118],[.9,115],[1.2,30],[1.5,-20],[tTO,90],[1.75,110],[1.84,70],[2.1,35],[4.4,62]],la:[[0,0],[.75,10],[1.6,15],[1.84,25],[4.4,0]],le:[[0,70],[.55,70],[.75,10],[1.2,30],[tTO,30],[1.84,60],[4.4,70]],
    rf:[[0,62],[.6,62],[1.2,30],[1.5,-30],[tTO,100],[1.72,118],[1.84,168],[2.1,160],[2.4,60],[4.4,62]],ra:[[0,15],[1.5,10],[tTO,40],[1.72,100],[1.84,25],[2.1,25],[2.4,20],[4.4,15]],
    re:[[0,70],[1.2,30],[1.5,15],[tTO,70],[1.72,118],[1.84,4],[2.1,6],[2.4,40],[4.4,70]],rw:[[0,0],[1.8,-25],[2.1,-25],[2.3,0]]},
  feet:{L:[{t0:0,t1:.85,x:-11.95,z:-.13},{t0:1.15,t1:1.35,x:-10.95,z:-.12,h:.1},{t0:1.5,t1:tTO,x:-10.2,z:-.13,yaw:-30,toe:36,air:[[.5,.08,-.75,-.08,25]]},{t0:tLand+.02,t1:2.85,x:-9.6,z:-.14,yaw:-6,heel:true},{t0:3.15,t1:3.35,x:-10.4,z:-.14,yaw:180},{t0:3.65,t1:3.85,x:-11.4,z:-.14,yaw:180},{t0:4.15,t1:4.4,x:-11.95,z:-.13}],
    R:[{t0:0,t1:.9,x:-12.2,z:.14},{t0:1.3,t1:tTO,x:-10.45,z:.18,yaw:-12,heel:true,toe:36,air:[[.5,.02,-.75,.1,25]]},{t0:tLand,t1:2.75,x:-9.75,z:.16,yaw:-4,heel:true},{t0:3.0,t1:3.2,x:-9.95,z:.15,yaw:90},{t0:3.4,t1:3.6,x:-10.9,z:.15,yaw:180},{t0:3.9,t1:4.1,x:-11.9,z:.15,yaw:180},{t0:4.25,t1:4.4,x:-12.2,z:.14}]},
  labels:[[0,"Behind the line, ball in the left hand"],[.6,"Low toss in front of the hitting shoulder"],[1.0,"Step 1 (left), step 2 (right)"],[1.45,"Step 3 (left), small jump"],[1.72,"Elbow high"],[1.82,"Flat punch through the centre"],[1.95,"Hand stops: no spin"],[2.15,"Land inside the court"],[2.9,"Back to serve again"]],
  ball:(t,h)=>{const C=h.contact,L=h.left(.72);if(t<.72)return h.left(t);if(t<1.84){const u=(t-.72)/1.12;return [lerp(L[0],C[0],u),lerp(L[1],C[1],u)+4*1.15*u*(1-u),lerp(L[2],C[2],u)];}
    const u=(t-1.84)/1.2,E=[7.4,.11,-2.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*.9*u*(1-u),lerp(C[2],E[2],u)+.18*Math.sin(u*12)];return null;}};})();
CLIPS.ready=(function(){return {dur:2.4,contact:null,ch:Object.assign({x:0,y:[[0,.86],[.6,.84],[1.2,.86],[1.5,.92],[1.62,.8],[1.9,.86],[2.4,.86]],lean:[[0,26],[1.2,28],[1.5,22],[1.7,30],[2.4,26]],hp:-10},
    Object.fromEntries(Object.entries(READY).map(([k,v])=>[k,v]))),
  feet:{L:[{t0:0,t1:1.48,x:.02,z:-.3,yaw:-6,roll:false},{t0:1.6,t1:2.4,x:.02,z:-.3,yaw:-6,roll:false,h:.04}],R:[{t0:0,t1:1.48,x:.02,z:.3,yaw:6,roll:false},{t0:1.6,t1:2.4,x:.02,z:.3,yaw:6,roll:false,h:.04}]},labels:[[0,"Ready"],[1.48,"Split step"]],ball:()=>null};})();
/* natural layer on top of a clip: eyes on the ball, hips and arms counter-rotating when stepping, breathing */
function natural(P,clock,look){const rad2=180/Math.PI,yaw=(P.yaw||0)/rad2,c=Math.cos(yaw),s=Math.sin(yaw);
  const fx=f=>f.x*c-f.z*s,fL=P.foot.L,fR=P.foot.R,grounded=fL.y<.05||fR.y<.05;
  if(grounded&&P.y<1.05){const dx=fx(fR)-fx(fL),k=Math.max(-1,Math.min(1,dx/.6));
    P.yaw+=k*9;P.twist=(P.twist||0)-k*11;
    ["L","R"].forEach(side=>{const a=P.arm[side],free=1-sm((Math.abs(a[0]-15)-45)/30),sg=side==="L"?1:-1;if(free>0){a[0]+=sg*k*26*free;a[3]+=Math.abs(k)*14*free;}});}
  const br=Math.sin(clock*1.8);P.arch=(P.arch||0)+br*.9;P.y+=br*.004;P.side=(P.side||0)+Math.sin(clock*.45)*.8;
  if(look){const hx=P.x,hz=P.z,hy=P.y+.72,dxw=look[0]-hx,dzw=look[2]-hz,dyw=look[1]-hy,dist=Math.hypot(dxw,dzw)||1e-3;
    const fwd=dxw*c-dzw*s,lat=dxw*s+dzw*c;let rel=Math.atan2(-lat,fwd)*rad2;rel-=(P.twist||0)*.8;const up=Math.atan2(dyw,dist)*rad2;
    const wantY=Math.max(-75,Math.min(75,rel)),wantP=Math.max(-65,Math.min(45,-up-((P.lean||0)+(P.crunch||0)*.5-(P.arch||0)*.5)*.85));
    const k=Math.abs(rel)>110?0:.85;P.hy=(P.hy||0)*(1-k)+wantY*k;P.hp=(P.hp||0)*(1-k)+wantP*k;}
  return P;}
/* hand position helper (clip space) used to aim the ball */
function handAt(a,clip,t,which){const P=sample(clip,t,a.lefty);apply(a,P);a.root.update(null);const inv=M4.inv(a.root.world),get=k=>{const h=a.arms[k].hd;const w=M4.xf(h.world,[0,-.09,0]);return M4.xf(inv,w);};
  if(which==="both"){const l=get("L"),r=get("R");return V3.add(V3.lerp(l,r,.5),[.04,.12,0]);}
  if(which==="platform"){const l=M4.xf(inv,M4.xf(a.arms.L.el.world,[0,-.17,0])),r=M4.xf(inv,M4.xf(a.arms.R.el.world,[0,-.17,0]));return V3.add(V3.lerp(l,r,.5),[.05,-.04,0]);}
  if(which==="pancake"){const k=a.lefty?"L":"R";return get(k);}
  const k=(which||"R")==="R"?(a.lefty?"L":"R"):(a.lefty?"R":"L");return V3.add(get(k),[.06,.09,0]);}
/* ---------- effort layer ----------
   Read each clip once to find where the body works: upward pelvis acceleration (leg drive), arm speed (the swing), and every landing.
   From that: a short effort envelope (mouth opens, trunk braces), a slow fatigue curve (faster, deeper breathing after a rep),
   and a damped spring at each landing (hips sink, trunk folds, arms and head lag) so the impact is felt, not just shown. */
function effortOf(clip){if(clip._eff)return clip._eff;const fps=60,n=Math.max(8,Math.round(clip.dur*fps)),dt=clip.dur/n,Y=[],AIR=[],ARM=[];
  for(let i=0;i<n;i++){const P=sample(clip,i*dt,false);Y.push(P.y);AIR.push(P.foot.L.y>.045&&P.foot.R.y>.045);ARM.push([P.arm.R[0],P.arm.R[3],P.arm.L[0]]);}
  const W=i=>((i%n)+n)%n,vy=[],drive=[],Ef=new Float32Array(n),F=new Float32Array(n),S=new Float32Array(n);
  for(let i=0;i<n;i++)vy[i]=(Y[W(i+1)]-Y[W(i-1)])/(2*dt);
  for(let i=0;i<n;i++){const ay=(vy[W(i+1)]-vy[W(i-1)])/(2*dt),a0=ARM[W(i+1)],a1=ARM[W(i-1)],w=Math.max(Math.abs(a0[0]-a1[0]),Math.abs(a0[1]-a1[1])*.7,Math.abs(a0[2]-a1[2])*.6)/(2*dt);
    drive[i]=Math.min(1,Math.max(0,(AIR[i]?0:ay)-4)/22+Math.max(0,w-260)/1300);}
  const kE=Math.exp(-dt/.28),kF=Math.exp(-dt/2.4);let e=0,f=0;
  for(let r=0;r<3;r++)for(let i=0;i<n;i++){e=Math.max(drive[i],e*kE);f=Math.max(e*.85,f*kF);if(r===2){Ef[i]=e;F[i]=f;}}
  for(let i=0;i<n;i++)if(AIR[W(i-1)]&&!AIR[i]){let v=0;for(let j=1;j<=4;j++)v=Math.max(v,-vy[W(i-j)]);v=Math.min(4.5,v);if(v<.4)continue;
    for(let j=0;j<Math.round(.75/dt);j++){const tau=j*dt,r=v*Math.exp(-5.5*tau)*Math.sin(10.5*tau);S[W(i+j)]+=r;}}
  return clip._eff={n,dt,E:Ef,F,S};}
function effort(P,a,clip,t,clock){const X=effortOf(clip),u=((t%clip.dur)+clip.dur)%clip.dur/X.dt,i0=Math.floor(u)%X.n,i1=(i0+1)%X.n,f=u-Math.floor(u),L=A=>A[i0]+(A[i1]-A[i0])*f;
  let sp=L(X.S);const e=L(X.E),fat=L(X.F),air=P.foot.L.y>.045&&P.foot.R.y>.045,
    // near ball contact the pose stays exactly as authored, so hand and ball still meet
    cd=clip.contact==null?9:Math.min(Math.abs(t-clip.contact),clip.dur-Math.abs(t-clip.contact)),free=Math.min(1,Math.max(0,(cd-.12)/.3));
  // landing spring: only ever sinks the hips (the legs fold more), so foot plants stay reachable
  sp*=free;const sink=Math.max(0,sp);P.y-=.017*sink;P.lean=(P.lean||0)+6.5*sp;P.crunch=(P.crunch||0)+5*Math.max(0,sp);P.hp=(P.hp||0)+11*sp;
  ["L","R"].forEach(k=>{const A=P.arm[k];A[0]-=9*sp*(A[0]>40?1:.4);A[3]+=6*Math.max(0,sp);});
  // breathing that follows the work: faster and deeper as fatigue builds; chest lifts, shoulders rise a little on the in-breath
  if(!air){const rate=1.7+3.1*fat,br=Math.sin(clock*rate),amp=fat*(1-Math.min(1,e*1.5))*free;P.arch=(P.arch||0)+br*2.4*amp;P.y+=br*.005*amp;P.hp=(P.hp||0)-br*2*amp;P.arm.L[0]+=br*2.5*amp;P.arm.R[0]+=br*2.5*amp;}
  // brace at peak effort: a touch more trunk tension into the hit
  if(!air)P.crunch=(P.crunch||0)+e*2.5*free;
  if(a.mouth){const open=Math.min(1,Math.max(e*1.1,fat*.55*(.6+.4*Math.sin(clock*(1.7+3.1*fat))))),sh=open>.08;a.mouth.visible=sh;a.teeth.visible=sh&&open>.3;a.mouth.scl=[.0085,.0006+.014*open,.017+.003*open];a.mouth.pos=[.1,.044-.006*open,0];a.teeth.pos=[.1045,.047+.0015*open,0];}
  P.effort=e;P.fatigue=fat;return P;}
/* ---------- player = athlete + clip + ball ---------- */
function player(o){const a=build(o),clipName=o.clip||"ready",clip=CLIPS[clipName]||CLIPS.ready;let t=o.t0||0;
  const LK=(VB.locker&&o.ballKind===undefined)?VB.locker():{ball:o.ballKind||"classic",fx:o.fx||"trail"},ballN=o.ball===false?null:new Node(VB.Athlete.ballGeo(),VB.Athlete.ballMatKind?VB.Athlete.ballMatKind(LK.ball,o.fxColor||o.jersey):VB.Athlete.ballMat());if(ballN){ballN.castShadow=true;a.root.add(ballN);}
  const fx=ballN&&o.trail!==false&&VB.BallFX?VB.BallFX(a.root,o.fx||LK.fx,o.fxColor||o.trailColor||o.jersey):null;let prevT=t;
  const hc={},hl={},h={contact:[0,2.8,0],hand:tt=>{const k=Math.round(tt*30);return hc[k]||(hc[k]=handAt(a,clip,k/30,"R"));},left:tt=>{const k=Math.round(tt*30);return hl[k]||(hl[k]=V3.add(handAt(a,clip,k/30,"L"),[.02,.05,0]));}};if(clip.contact!=null)h.contact=handAt(a,clip,clip.contact,clip.hand||"R");
  let label="";
  let clock=Math.random()*10,lookAt=null,lastP=null,lastT=null,from=null,bt=0,lastNow=0;
  // when the clip time jumps (looping with another player, scrubbing, a scene restart), blend from the old pose instead of snapping
  const lp=(A,B,k)=>{const L=(a,b)=>a+(b-a)*k,o={};for(const key in B){const v=B[key],u=A[key];o[key]=typeof v==="number"&&typeof u==="number"?L(u,v):v;}
    o.arm={L:B.arm.L.map((v,i)=>L(A.arm.L[i],v)),R:B.arm.R.map((v,i)=>L(A.arm.R[i],v))};o.foot={};["L","R"].forEach(f=>{const a=A.foot[f],b=B.foot[f];o.foot[f]=Object.assign({},b,{x:L(a.x,b.x),y:L(a.y,b.y),z:L(a.z,b.z),yaw:L(a.yaw||0,b.yaw||0),pitch:L(a.pitch||0,b.pitch||0)});});return o;};
  function update(dt){t=(t+dt)%clip.dur;clock+=dt||1/60;let b=clip.ball?clip.ball(t,h):null;if(b&&a.lefty&&!/^(serve|float|jumpfloat)$/.test(clipName))b=[b[0],b[1],-b[2]];
    const now=performance.now(),real=lastNow?Math.min(.1,(now-lastNow)/1000):0;lastNow=now;
    let P=sample(clip,t,a.lefty);if(o.natural!==false){natural(P,clock,lookAt||b);if(o.effort!==false)effort(P,a,clip,t,clock);}
    if(lastP&&lastT!=null){let d=Math.abs(t-lastT-(dt||0));d=Math.min(d,clip.dur-d);if(d>.08){from=lastP;bt=0;}}
    if(from){bt+=Math.max(dt||0,real);const k=sm(bt/.32);P=lp(from,P,k);if(k>=1)from=null;}
    lastP=P;lastT=t;apply(a,P);label=P.label;
    if(ballN){if(b){ballN.visible=true;ballN.pos=b;ballN.rot=[t*9,t*4,0];}else ballN.visible=false;
      if(fx){const c=clip.contact,hit=c!=null&&((prevT<=c&&t>c)||(prevT>t&&(t>c||prevT<=c)));fx.update(dt||0,b,hit);}prevT=t;
    }
    return P;}
  update(0);
  return {a,root:a.root,clip,update,look(v){lookAt=v;},snap(){from=null;lastP=null;lastT=null;},get t(){return t;},set t(v){t=v;},get label(){return label;},get frac(){return t/clip.dur;},ball:ballN};}
let _bg=null,_bt=null;
VB.Athlete={effortOf,build,apply,sample,CLIPS,player,handAt,
  ballGeo(){return _bg||(_bg=G.sphere(.105,28,20));},
  ballMat(){if(!_bt)_bt=G.canvasTex(256,128,(g,w,h)=>{g.fillStyle="#f6f3ea";g.fillRect(0,0,w,h);[["#f5c518",0],["#1f4fae",h/3]].forEach(([c,y0])=>{g.fillStyle=c;g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,y0+h/6+Math.sin(x/w*Math.PI*4)*h/7);for(let x=w;x>=0;x-=4)g.lineTo(x,y0+h/3+Math.sin(x/w*Math.PI*4)*h/7);g.fill();});g.strokeStyle="rgba(0,0,0,.28)";g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+h/12+Math.sin(x/w*Math.PI*4)*h/7);g.stroke();}});
    return G.mat({map:_bt,rough:.45});},
  forPos:{outside:"spike",opposite:"serve",middle:"block",setter:"set",libero:"dig",any:"spike"},byTech:{float:"float",jump_float:"jumpfloat",jumpserve:"serve",spike:"spike",tip_roll:"spike",slide:"slide",back_row_attack:"pipe",block:"block",swing_block:"block",dig:"dig",sprawl_pancake:"sprawl",jump_set:"set",set:"set",back_set:"set"}};
})();
