/* exmotion.js: small looping motion demos for every exercise.
   A flat athlete pictogram (side or front view) driven by keyframed poses and two-bone IK, timed like motion graphics:
   slow eased lowering, sharp ease-out on explosive phases, holds on isometrics, a dotted trail on the moving part,
   and the working muscles lit in coral. Poses live in exmotion-data.js (VB_EXMO). */
(function(){
const VB=window.VB=window.VB||{};
const D=Math.PI/180,dir=a=>[Math.cos(a*D),Math.sin(a*D)],add=(p,v,k)=>[p[0]+v[0]*(k==null?1:k),p[1]+v[1]*(k==null?1:k)],
  lerp=(a,b,u)=>a+(b-a)*u,lp2=(a,b,u)=>[lerp(a[0],b[0],u),lerp(a[1],b[1],u)],
  rot=(v,a)=>{const c=Math.cos(a*D),s=Math.sin(a*D);return [v[0]*c-v[1]*s,v[0]*s+v[1]*c];};
const S={tr:.5,ua:.29,fa:.27,th:.44,sh:.43};
const EZ={io:u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2,o:u=>1-Math.pow(1-u,3),i:u=>u*u*u,l:u=>u,s:u=>u*u*(3-2*u),
  bk:u=>{const c=1.5;return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2);}};
function ik(r,t,l1,l2,s){const dx=t[0]-r[0],dy=t[1]-r[1],d0=Math.hypot(dx,dy)||1e-4,ux=dx/d0,uy=dy/d0,d=Math.min(d0,(l1+l2)*.999);
  const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  return [[r[0]+ux*a-uy*h*s,r[1]+uy*a+ux*h*s],[r[0]+ux*d,r[1]+uy*d]];}
const norm=s=>Array.isArray(s)?{t:[s[0],s[1]],s:s[2]}:s;
/* limb resolution: returns {j,e,fd}. Spec kinds: target {t,s,f,toe,heel}, absolute {a,k}, trunk-relative {r,k},
   forearm rotation seen end-on {rot,a1,pl,sd}, straight limb sweeping toward the viewer {sw,ax,bx}, explicit {j,e}. */
function limb(root,sp,l1,l2,ds,T,leg){sp=norm(sp);
  if(sp.j)return {j:sp.j,e:sp.e,fd:sp.f};
  if(sp.t){let tg=sp.t,fd=null;
    if(leg&&(sp.toe||sp.heel)){fd=sp.f||0;const off=sp.toe?[.16,-.065]:[-.05,-.065],o=rot(off,fd);tg=[tg[0]-o[0],tg[1]-o[1]];}
    const [j,e]=ik(root,tg,l1,l2,sp.s||ds);return {j,e,fd,fo:fd==null?(sp.f||0):null};}
  if(sp.a||sp.r){const a1=sp.a?sp.a[0]:T+sp.r[0],a2=sp.a?sp.a[1]:a1+sp.r[1],k=sp.k||[1,1],j=add(root,dir(a1),l1*k[0]),e=add(j,dir(a2),l2*k[1]);return {j,e,fo:sp.f||0};}
  if(sp.rot!=null){const j=add(root,dir(sp.a1),l1*(sp.k1==null?1:sp.k1)),e=sp.pl==="v"?add(j,[0,l2*Math.sin(sp.rot*D)]):add(j,[l2*Math.cos(sp.rot*D)*(sp.sd||1),-.015]);return {j,e};}
  if(sp.sw!=null){const L=l1+l2,v=add(add([0,0],dir(sp.ax),L*Math.sin(sp.sw*D)),dir(sp.bx==null?sp.ax:sp.bx),sp.bx==null?0:L*Math.cos(sp.sw*D)*(sp.bk==null?1:sp.bk));return {j:add(root,v,.5),e:add(root,v)};}
  return {j:root,e:root};}
function solve(P,v){const J={},td=dir(P.t);J.hip=P.h;J.sh=add(P.h,td,S.tr);J.nk=add(J.sh,td,.06);
  const fw=dir(P.t-90);J.head=add(add(J.sh,dir(P.t+(P.n||0)),.165),fw,v==="front"?0:.012);J.fw=fw;J.T=P.t;
  if(v==="front"){const rv=dir(P.t-90),w=(P.w==null?1:P.w)*.17;J.hipN=add(P.h,rv,.085);J.hipF=add(P.h,rv,-.085);J.shN=add(J.sh,rv,w);J.shF=add(J.sh,rv,-w);}
  else{J.hipN=J.hipF=P.h;J.shN=J.shF=J.sh;}
  ["N","F"].forEach(k=>{const lo=k.toLowerCase(),fr=v==="front";
    const L=limb(J["hip"+k],P["l"+lo]||[J["hip"+k][0],.07],S.th,S.sh,fr&&k==="F"?-1:1,P.t,true);J["k"+k]=L.j;J["a"+k]=L.e;
    if(fr){const sx=k==="N"?1:-1,fa=(P["f"+lo]||0)*sx;J["heel"+k]=add(L.e,rot([-.035*sx,-.06],fa));J["toe"+k]=add(L.e,rot([.05*sx,-.06],fa));}
    else{const fd=L.fd!=null?L.fd:Math.atan2(L.e[1]-L.j[1],L.e[0]-L.j[0])/D+90+(L.fo||0)+(P["f"+lo]||0);J["heel"+k]=add(L.e,rot([-.05,-.065],fd));J["toe"+k]=add(L.e,rot([.16,-.065],fd));}
    const A=limb(J["sh"+k],P["a"+lo]||{r:[180,6]},S.ua,S.fa,fr?(k==="F"?-1:1):-1,P.t,false);J["e"+k]=A.j;J["h"+k]=A.e;});
  return J;}
/* keyframe mixing: numbers and points lerp, limb specs of one kind blend in their own space, mixed kinds blend joint positions */
const LIMBS=["ln","lf","an","af"];
function mixSpec(A,B,u,JA,JB,key){A=norm(A);B=norm(B);
  if(A.t&&B.t&&!!A.toe===!!B.toe&&!!A.heel===!!B.heel)return {t:lp2(A.t,B.t,u),s:u<.5?A.s:B.s,f:lerp(A.f||0,B.f||0,u),toe:A.toe,heel:A.heel};
  if(A.a&&B.a)return {a:lp2(A.a,B.a,u),k:lp2(A.k||[1,1],B.k||[1,1],u),f:lerp(A.f||0,B.f||0,u)};
  if(A.r&&B.r)return {r:lp2(A.r,B.r,u),k:lp2(A.k||[1,1],B.k||[1,1],u),f:lerp(A.f||0,B.f||0,u)};
  if(A.rot!=null&&B.rot!=null)return {rot:lerp(A.rot,B.rot,u),a1:lerp(A.a1,B.a1,u),k1:lerp(A.k1==null?1:A.k1,B.k1==null?1:B.k1,u),pl:A.pl,sd:A.sd};
  if(A.sw!=null&&B.sw!=null)return {sw:lerp(A.sw,B.sw,u),ax:lerp(A.ax,B.ax,u),bx:A.bx==null?null:lerp(A.bx,B.bx==null?A.bx:B.bx,u),bk:A.bk};
  const g=(J,k)=>{const m={ln:["kN","aN"],lf:["kF","aF"],an:["eN","hN"],af:["eF","hF"]}[k];return [J[m[0]],J[m[1]]];},a=g(JA,key),b=g(JB,key);
  return {j:lp2(a[0],b[0],u),e:lp2(a[1],b[1],u)};}
function mix(A,B,u,JA,JB){const o={};for(const k in A){const a=A[k],b=B[k];
  if(LIMBS.includes(k)){o[k]=b==null?a:mixSpec(a,b,u,JA,JB,k);continue;}
  if(typeof a==="number")o[k]=typeof b==="number"?lerp(a,b,u):a;
  else if(Array.isArray(a)&&a.length===2&&typeof a[0]==="number")o[k]=Array.isArray(b)?lp2(a,b,u):a;else o[k]=a;}
  for(const k in B)if(!(k in o))o[k]=B[k];return o;}
/* compile a definition: frames [[dur,ease,delta],...] each delta extends the previous pose; the loop returns to frame 0 */
const focus0=d=>!!(d.focus||d.air);
function compile(id,def){if(def._c)return def._c;const K=[];let prev=null;
  def.k.forEach(f=>{const p=Object.assign({o:1},prev||{},f[2]);K.push({d:f[0],e:f[1]||"io",p});prev=p;});
  const JS=K.map(k=>solve(k.p,def.v));let T=0;K.forEach(k=>{k.t0=T;T+=k.d;});
  const c={K,JS,T,v:def.v||"side"};
  c.at=function(time){let t=((time%T)+T)%T,i=K.length-1;for(let q=0;q<K.length;q++){if(t<K[q].t0+K[q].d){i=q;break;}}
    const a=K[i],j=(i+1)%K.length,u=EZ[a.e]((t-a.t0)/a.d),P=mix(a.p,K[j].p,u,JS[i],JS[j]);return {P,J:solve(P,c.v)};};
  // framing: every joint over the loop plus props
  let x0=1e9,x1=-1e9,y0=focus0(def)?1e9:0,y1=-1e9;const focus=def.focus||(def.air?[""]:null);
  for(let s=0;s<48;s++){const {J,P}=c.at(s/48*T);for(const k in J){if(k==="fw"||k==="T")continue;if(focus&&!focus.some(f=>k.indexOf(f)===0))continue;const p=J[k];x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]+(k==="head"?.11:0));if(focus)y0=Math.min(y0,p[1]);}
    if(P.b&&!focus){x0=Math.min(x0,P.b[0]-.12);x1=Math.max(x1,P.b[0]+.12);y1=Math.max(y1,P.b[1]+.12);}}
  if(!def.focus)(def.p||[]).forEach(pr=>{if(pr.x!=null&&pr.w!=null){x0=Math.min(x0,pr.x-.05);x1=Math.max(x1,pr.x+pr.w+.05);}if(pr.k==="wall"){x0=Math.min(x0,pr.x-.1);x1=Math.max(x1,pr.x+.1);}if(pr.y!=null)y1=Math.max(y1,pr.y+.1);});
  if(focus)y0-=.12;
  const w=x1-x0,h=y1-y0,need=Math.max(.9,h,w);c.box=[(x0+x1)/2,y0,need,h];
  // trail: the end of the body that travels furthest
  let best=null,bl=0;["hN","hF","aN","aF","hip","head","kN","kF"].forEach(k=>{let L=0,pp=null;for(let s=0;s<=40;s++){const p=c.at(s/40*T).J[k];if(pp)L+=Math.hypot(p[0]-pp[0],p[1]-pp[1]);pp=p;}if(L>bl){bl=L;best=k;}});
  c.trail=def.tr===false?null:(def.tr||best);if(c.trail){c.path=[];for(let s=0;s<=60;s++)c.path.push(c.at(s/60*T).J[c.trail]);}
  def._c=c;return c;}
/* ---------- drawing ---------- */
const PAL={ink:"#17144d",far:"#a7a3cf",hot:"#ec3b52",prop:"#cbc7e0",prop2:"#8e89b8",ground:"#dcd9ea",skin:"#17144d",ball:"#f2c230"};
const SEGW={trunk:.17,ua:.08,fa:.068,th:.115,sh:.085,ft:.055};
const MUS={ant_delt:"ua",mid_delt:"ua",post_delt:"ua",supraspinatus:"ua",infraspinatus:"ua",subscapularis:"ua",serratus:"chest",pec_major:"chest",biceps:"ua",triceps:"ua",forearm_flex:"fa",forearm_ext:"fa",
  upper_traps:"upper",lower_traps:"back",rhomboids:"back",lats:"back",erectors:"low",rectus_abs:"core",obliques:"core",tva:"core",glute_max:"glute",glute_med:"glute",hip_flexors:"hipf",adductors:"th",
  rectus_fem:"th",vastus_lat:"th",vmo:"th",biceps_fem:"th",medial_hams:"th",gastroc:"sh",soleus:"sh",tib_ant:"sh",peroneals:"sh",foot:"ft"};
function render(ctx,c,def,time,W,H,hot,opts){opts=opts||{};const {P,J}=c.at(time),[cx,y0,need]=c.box,pad=.14,sc=Math.min(W,H)*(1-pad*2)/need;
  const ox=W/2-cx*sc,oy=H-H*pad*.7+y0*sc,X=p=>[ox+p[0]*sc,oy-p[1]*sc];
  ctx.clearRect(0,0,W,H);ctx.save();ctx.globalAlpha=P.o==null?1:Math.max(0,Math.min(1,P.o));ctx.lineCap="round";ctx.lineJoin="round";
  const line=(a,b,w,col,al)=>{const A=X(a),B=X(b);ctx.strokeStyle=col;ctx.globalAlpha=(al==null?1:al)*(P.o==null?1:P.o);ctx.lineWidth=Math.max(1,w*sc);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();ctx.globalAlpha=P.o==null?1:P.o;};
  const dot=(p,r,col,fill)=>{const A=X(p);ctx.beginPath();ctx.arc(A[0],A[1],Math.max(1,r*sc),0,Math.PI*2);if(fill!==false){ctx.fillStyle=col;ctx.fill();}else{ctx.strokeStyle=col;ctx.lineWidth=Math.max(1,.02*sc);ctx.stroke();}};
  const rect=(x,y,w,h,col,rr)=>{const A=X([x,y+h]);ctx.fillStyle=col;const R=Math.min(rr==null?.03*sc:rr*sc,w*sc/2,h*sc/2);ctx.beginPath();if(ctx.roundRect)ctx.roundRect(A[0],A[1],w*sc,h*sc,R);else ctx.rect(A[0],A[1],w*sc,h*sc);ctx.fill();};
  const pt=v=>typeof v==="string"?(v==="b"?P.b:J[v]):v;
  // ground + contact shadow
  if(!def.air){const g0=X([cx-need*.62,0]),g1=X([cx+need*.62,0]);ctx.strokeStyle=PAL.ground;ctx.lineWidth=Math.max(1,.018*sc);ctx.beginPath();ctx.moveTo(g0[0],g0[1]);ctx.lineTo(g1[0],g1[1]);ctx.stroke();
  const lift=Math.max(0,Math.min(J.aN[1],J.aF[1])-.08),sh=X([J.hip[0],0]);ctx.fillStyle="rgba(23,20,77,"+(.13/(1+lift*4))+")";ctx.beginPath();ctx.ellipse(sh[0],sh[1]+.005*sc,(.32+lift*.2)*sc,.035*sc,0,0,Math.PI*2);ctx.fill();}
  // props behind the body
  const props=def.p||[];props.forEach(pr=>drawProp(pr,true));
  // trail
  if(c.path&&!opts.still){ctx.save();ctx.setLineDash([.018*sc,.03*sc]);ctx.strokeStyle=PAL.hot;ctx.globalAlpha=.32*(P.o==null?1:P.o);ctx.lineWidth=Math.max(1,.014*sc);ctx.beginPath();c.path.forEach((p,i)=>{const A=X(p);i?ctx.lineTo(A[0],A[1]):ctx.moveTo(A[0],A[1]);});ctx.stroke();ctx.restore();}
  const front=c.v==="front";
  function limbs(k,col,al){line(J["sh"+k],J["e"+k],SEGW.ua,col,al);line(J["e"+k],J["h"+k],SEGW.fa,col,al);dot(J["h"+k],.038,col);}
  function legs(k,col,al){line(J["hip"+k],J["k"+k],SEGW.th,col,al);line(J["k"+k],J["a"+k],SEGW.sh,col,al);line(J["heel"+k],J["toe"+k],SEGW.ft,col,al);}
  const farCol=front?PAL.ink:PAL.far;
  if(!front){legs("F",farCol);limbs("F",farCol);}
  // trunk + head
  if(front){line(J.hipN,J.hipF,.17,PAL.ink);line(J.shN,J.shF,.13,PAL.ink);line(J.hip,add(J.sh,dir(J.T),-.04),.25,PAL.ink);}
  else line(J.hip,J.sh,SEGW.trunk,PAL.ink);
  line(J.sh,J.nk,.07,PAL.ink);dot(J.head,.1,PAL.ink);
  if(!front){const e=add(J.head,J.fw,.075);dot(add(e,dir(J.T),.015),.016,"#fff");}
  if(front){legs("F",farCol);limbs("F",farCol);}
  legs("N",PAL.ink);
  // working muscles
  const H2=new Set(hot||[]);const seg=(a,b,f0,f1,w,al)=>line(lp2(a,b,f0),lp2(a,b,f1),w,PAL.hot,al);
  ["N","F"].forEach(k=>{const al=k==="F"&&!front?.55:1;if(H2.has("th"))seg(J["hip"+k],J["k"+k],.18,.88,SEGW.th*.62,al);if(H2.has("hipf"))seg(J["hip"+k],J["k"+k],.05,.4,SEGW.th*.62,al);
    if(H2.has("sh"))seg(J["k"+k],J["a"+k],.15,.62,SEGW.sh*.66,al);if(H2.has("ft"))line(J["heel"+k],J["toe"+k],SEGW.ft*.6,PAL.hot,al);});
  if(H2.has("glute")){const g=add(J.hip,J.fw,front?0:-.045);dot(g,.075,PAL.hot);}
  const tw=front?.14:SEGW.trunk*.55;if(H2.has("core"))seg(J.hip,J.sh,.12,.58,tw);if(H2.has("chest"))seg(J.hip,J.sh,.58,.9,tw);if(H2.has("back"))seg(J.hip,J.sh,.4,.9,tw);if(H2.has("upper"))seg(J.hip,J.sh,.82,1,tw);if(H2.has("low"))seg(J.hip,J.sh,.08,.45,tw);
  limbs("N",PAL.ink);
  ["N","F"].forEach(k=>{const al=k==="F"&&!front?.55:1;if(H2.has("ua"))seg(J["sh"+k],J["e"+k],.12,.85,SEGW.ua*.62,al);if(H2.has("fa"))seg(J["e"+k],J["h"+k],.12,.8,SEGW.fa*.62,al);});
  props.forEach(pr=>drawProp(pr,false));
  // hold ring for timed holds
  if(def.hold){const fr=((time%c.T)+c.T)%c.T/c.T,R=Math.min(W,H)*.075,cxr=W-R-6,cyr=R+6;ctx.globalAlpha=1;ctx.lineWidth=Math.max(2,R*.28);ctx.strokeStyle=PAL.ground;ctx.beginPath();ctx.arc(cxr,cyr,R,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=PAL.hot;ctx.beginPath();ctx.arc(cxr,cyr,R,-Math.PI/2,-Math.PI/2+fr*Math.PI*2);ctx.stroke();}
  ctx.restore();
  function drawProp(pr,back){const isBack=["wall","box","bench","chair","wedge","pbar","sled","cone","step","post"].includes(pr.k);if(isBack!==back)return;
    if(pr.show&&!(P[pr.show]>.5))return;
    const at=pr.at==null?null:(Array.isArray(pr.at)&&typeof pr.at[0]==="string"?pr.at:[pr.at]);
    const each=f=>(at||[]).forEach(a=>{const p=pt(a);if(p)f(add(p,pr.off||[0,0]));});
    switch(pr.k){
      case "wall":rect(pr.x-(pr.side===-1?0:.1),0,.1,pr.h||2.3,PAL.prop,0);break;
      case "box":case "step":case "bench":rect(pr.x,0,pr.w,pr.h,PAL.prop,.02);if(pr.k==="bench"){rect(pr.x-.03,pr.h-.06,pr.w+.06,.06,PAL.prop2,.02);}break;
      case "chair":{rect(pr.x,pr.h-.05,pr.w,.05,PAL.prop2,.01);line([pr.x+.03,0],[pr.x+.03,pr.h-.05],.03,PAL.prop2);line([pr.x+pr.w-.03,0],[pr.x+pr.w-.03,pr.h-.05],.03,PAL.prop2);
        if(pr.back!==0){const bx=pr.back===1?pr.x+pr.w-.02:pr.x+.02;line([bx,pr.h],[bx,pr.h+.45],.04,PAL.prop2);}break;}
      case "wedge":{const A=X([pr.x,0]),B=X([pr.x+pr.w,0]),C=X(pr.hi==="L"?[pr.x,pr.h]:[pr.x+pr.w,pr.h]);ctx.fillStyle=PAL.prop;ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.lineTo(C[0],C[1]);ctx.fill();break;}
      case "post":line([pr.x,0],[pr.x,pr.y||1.4],.05,PAL.prop2);break;
      case "pbar":{line([pr.x-.35,pr.y],[pr.x-.35,pr.y+.2],.03,PAL.prop2);line([pr.x+.35,pr.y],[pr.x+.35,pr.y+.2],.03,PAL.prop2);dot([pr.x,pr.y],.035,PAL.prop2);if(pr.rack){line([pr.x+.05,0],[pr.x+.05,pr.y+.1],.04,PAL.prop);}break;}
      case "cone":{const A=X([pr.x-.07,0]),B=X([pr.x+.07,0]),C=X([pr.x,.2]);ctx.fillStyle=PAL.hot;ctx.globalAlpha=.75;ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.lineTo(C[0],C[1]);ctx.fill();ctx.globalAlpha=1;break;}
      case "sled":{rect(pr.x,0,.4,.22,PAL.prop2,.03);const a=[pr.x+(pr.dir===-1?0:.4),.15];line(a,J.hip,.012,PAL.prop2);break;}
      case "db":each(p=>{line(add(p,[-.06,0]),add(p,[.06,0]),.025,PAL.prop2);dot(add(p,[-.06,0]),.045,PAL.prop2);dot(add(p,[.06,0]),.045,PAL.prop2);});break;
      case "dbe":each(p=>{dot(p,.06,PAL.prop2);dot(p,.03,PAL.prop);});break;
      case "kb":each(p=>{dot(add(p,[0,-.1]),.085,PAL.prop2);const A=X(add(p,[0,-.04]));ctx.strokeStyle=PAL.prop2;ctx.lineWidth=Math.max(1,.022*sc);ctx.beginPath();ctx.arc(A[0],A[1],.045*sc,Math.PI,0);ctx.stroke();});break;
      case "kbu":each(p=>{dot(add(p,[0,.12]),.085,PAL.prop2);line(p,add(p,[0,.05]),.03,PAL.prop2);});break;
      case "plate":each(p=>{const r=pr.r||.22;ctx.globalAlpha=.85;dot(p,r,PAL.prop);ctx.globalAlpha=1;dot(p,r,PAL.prop2,false);dot(p,.035,PAL.prop2);if(pr.spin){const a=-(P.x||0)/r/D,A=X(p),q=add(p,dir(a),r*.8),Q=X(q);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(Q[0],Q[1]);ctx.stroke();}});break;
      case "ball":{const p=pr.at?pt(pr.at):P.b;if(!p)break;if(pr.show==null&&P.bo!=null&&P.bo<.05)break;const q=add(p,pr.off||[0,0]),r=pr.r||.105;ctx.globalAlpha=P.bo==null?1:P.bo;dot(q,r,pr.c||PAL.ball);const A=X(q);ctx.strokeStyle="#17144d";ctx.lineWidth=Math.max(1,.012*sc);ctx.beginPath();ctx.arc(A[0],A[1],r*sc,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(A[0]-r*sc*.9,A[1],r*sc*.95,-.7,.7);ctx.stroke();ctx.globalAlpha=1;break;}
      case "band":{const a=pt(pr.a),b=pt(pr.b);if(!a||!b)break;ctx.save();ctx.strokeStyle=pr.c||PAL.hot;ctx.globalAlpha=.75;ctx.lineWidth=Math.max(1,.016*sc);const A=X(add(a,pr.ao||[0,0])),B=X(add(b,pr.bo||[0,0]));ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();ctx.restore();break;}
      case "towel":{const a=pt(pr.a),b=pt(pr.b);if(!a||!b)break;line(add(a,pr.ao||[0,0]),add(b,pr.bo||[0,0]),.035,"#f0b6a8");break;}
      case "mat":rect(pr.x,0,pr.w,.025,"#efe6f5",.01);break;
      case "rope":{const hN=J.hN,c0=[J.hip[0],.95],R=.98,ang=(P.x||0),apex=add(c0,dir(ang),R),A=X(hN),C=X(apex),M=X(add(apex,dir(ang),.25));ctx.strokeStyle=PAL.prop2;ctx.lineWidth=Math.max(1,.014*sc);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.quadraticCurveTo(M[0],M[1],C[0],C[1]);ctx.quadraticCurveTo(M[0],M[1],A[0],A[1]);ctx.stroke();break;}
      case "line":{const a=pt(pr.a),b=pt(pr.b);line(a,b,pr.w||.04,pr.c||PAL.prop2);break;}
      case "loop":{const a=pt(pr.at[0]),b=pt(pr.at[1]);ctx.save();ctx.strokeStyle=PAL.hot;ctx.globalAlpha=.8;ctx.lineWidth=Math.max(1.5,.025*sc);const A=X(a),B=X(b);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();ctx.restore();break;}
    }}
}
/* ---------- mounting: one animation loop for every visible demo ---------- */
const live=new Set();let raf=0,t0=performance.now();const RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{const m=e.target._exmo;if(m)m.vis=e.isIntersecting;}),{rootMargin:"60px"}):null;
function hotFor(id){const e=VB.exMap&&VB.exMap()[id];if(!e)return [];return [...new Set((e.primary||[]).map(m=>MUS[m]).filter(Boolean))];}
function mount(cv){if(cv._exmo)return;const id=cv.dataset.exmo,def=(window.VB_EXMO||{})[id];if(!def)return;const c=compile(id,def),dpr=Math.min(2,window.devicePixelRatio||1),r=cv.getBoundingClientRect(),W=r.width?Math.round(r.width*dpr):cv.width,H=r.height?Math.round(r.height*dpr):cv.height;
  cv.width=W;cv.height=H;const ctx=cv.getContext("2d");const m={cv,ctx,c,def,W,H,hot:hotFor(id),vis:!io,off:Math.random()*0};cv._exmo=m;live.add(m);if(io)io.observe(cv);
  const e=VB.exMap&&VB.exMap()[id];cv.setAttribute("role","img");cv.setAttribute("aria-label",(e?e.name:id)+": looping demo of the movement");
  if(RM){render(ctx,c,def,c.K[Math.min(1,c.K.length-1)].t0,W,H,m.hot,{still:true});}else{render(ctx,c,def,0,W,H,m.hot);kick();}}
function kick(){if(!raf&&!RM)raf=requestAnimationFrame(loop);}
function loop(now){raf=0;const t=(now-t0)/1000;let any=false;live.forEach(m=>{if(!m.cv.isConnected){live.delete(m);if(io)io.unobserve(m.cv);return;}any=true;if(m.vis&&!document.hidden)render(m.ctx,m.c,m.def,t*(m.speed||1),m.W,m.H,m.hot);});if(any)kick();}
VB.exMotion={has:id=>!!(window.VB_EXMO||{})[id],html:(id,cls,px)=>{px=px||84;return (window.VB_EXMO||{})[id]?`<canvas class="exmo ${cls||""}" data-exmo="${id}" width="${px*2}" height="${px*2}" style="width:${px}px;height:${px}px"></canvas>`:"";},
  scan(root){(root||document).querySelectorAll("canvas[data-exmo]").forEach(mount);},render,compile,PAL};
// demos mount themselves whenever the app renders a list that contains them
let pend=0;const later=()=>{if(pend)return;pend=requestAnimationFrame(()=>{pend=0;VB.exMotion.scan();});};
if(window.MutationObserver){const go=()=>{new MutationObserver(later).observe(document.body,{childList:true,subtree:true});later();};if(document.body)go();else document.addEventListener("DOMContentLoaded",go);}
})();
