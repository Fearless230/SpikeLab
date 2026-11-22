/* film.js: movement analysis in the browser. No video leaves the device and no AI service is called.
   1. Automatic: an on-device pose model finds the joints on every frame of the trimmed clip (film-pose.js), and the
      paths are cleaned and smoothed like lab motion data. Any dot can still be dragged and the analysis re-run.
   2. By hand (fallback when the model can't load): the athlete places joint markers once and they are followed through
      the clip by block matching (zero-mean SSD), a classical computer-vision method.
   4. Phases (dip, take-off, peak, landing, contact) are found from the joint paths.
   5. Joint angles at each phase are scored against ideal-form ranges taken from coaching guidance,
      and every miss is turned into feedback, a timeline comment, an ideal-form overlay and corrective work. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const $=(s,r=document)=>r.querySelector(s),esc=s=>VB.esc(s);
const SIDE=["head","shoulder","elbow","wrist","hip","knee","ankle","toe"];
const FRONT=["head","l_shoulder","r_shoulder","l_hip","r_hip","l_knee","r_knee","l_ankle","r_ankle"];
const LABEL={head:"Head",shoulder:"Shoulder",elbow:"Elbow",wrist:"Wrist",hip:"Hip",knee:"Knee",ankle:"Ankle",toe:"Toe",l_shoulder:"L shoulder",r_shoulder:"R shoulder",l_hip:"L hip",r_hip:"R hip",l_knee:"L knee",r_knee:"R knee",l_ankle:"L ankle",r_ankle:"R ankle"};
const BONES={side:[["head","shoulder"],["shoulder","elbow"],["elbow","wrist"],["shoulder","hip"],["hip","knee"],["knee","ankle"],["ankle","toe"]],
  front:[["l_shoulder","r_shoulder"],["l_shoulder","l_hip"],["r_shoulder","r_hip"],["l_hip","r_hip"],["l_hip","l_knee"],["l_knee","l_ankle"],["r_hip","r_knee"],["r_knee","r_ankle"]]};
const VIEWS={jump:["side","front"],squat:["side","front"],spike:["side"],pass:["side"],set:["side"],serve:["side"],block:["side"]};
const PH={dip:"Load",takeoff:"Take-off",peak:"Peak",landing:"Landing",absorb:"Absorb",contact:"Contact",catch:"Catch",release:"Release",bottom:"Bottom",load:"Load"};
/* ideal segment angles in degrees, side view. a thigh tilt from hip to knee (forward +), b shank tilt from knee to ankle (forward +),
   c trunk lean from vertical (forward +), d upper arm and e forearm measured from straight up (forward +, hanging down = 180) */
const IDEAL={
 jump:{dip:{a:55,b:-30,c:40,d:-140,e:-145},takeoff:{a:5,b:-10,c:10,d:25,e:20},peak:{a:0,b:0,c:0,d:10,e:5},absorb:{a:50,b:-30,c:35,d:70,e:80}},
 spike:{dip:{a:45,b:-25,c:35,d:-140,e:-150},contact:{a:15,b:5,c:5,d:15,e:15},absorb:{a:50,b:-30,c:35,d:70,e:80}},
 pass:{contact:{a:50,b:-30,c:35,d:130,e:130}},
 set:{catch:{a:30,b:-20,c:5,d:40,e:-25},release:{a:15,b:-15,c:5,d:25,e:15}},
 serve:{contact:{a:0,b:0,c:5,d:15,e:15}},
 block:{load:{a:30,b:-20,c:15,d:10,e:10},peak:{a:0,b:0,c:5,d:25,e:25},absorb:{a:50,b:-30,c:30,d:20,e:20}},
 squat:{bottom:{a:75,b:-35,c:40,d:90,e:90}}};
const SRC="Ranges follow common coaching guidance for each skill (for example USA Volleyball and strength-coach teaching points). Treat them as targets, not medical limits.";

VB.film=(function(){
  let root,video,canvas,ctx,move="jump",view="side",url=null,meta=null,clip=[0,0];
  let F=[],AW=0,AH=0,fps=30,bbox=null,P=null,anchors={},facing=1,mode="idle",res=null,drag=null,dirty=false,busy=false,ghostOn=true,comments=[],recId=null,curFile=null,poseMode=false,modelKind="full",P0=null,feet=null,nativeFps=30,slowmo=1,poseConf=null,lastRun=null,pauseOn=true,lastPause=-1,lastT=0,dense=null,air={off:null,on:null};
  const S=()=>VB.state;
  const joints=()=>view==="front"?FRONT:SIDE;
  /* ---------- small math ---------- */
  const d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const ang=(a,b,c)=>{if(!a||!b||!c)return null;const v1=[a[0]-b[0],a[1]-b[1]],v2=[c[0]-b[0],c[1]-b[1]],m=Math.hypot(...v1)*Math.hypot(...v2);return m?Math.acos(Math.max(-1,Math.min(1,(v1[0]*v2[0]+v1[1]*v2[1])/m)))*180/Math.PI:null;};
  const median=a=>{const s=a.filter(v=>isFinite(v)).sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null;};
  const R=v=>Math.round(v);
  /* ---------- sampling ---------- */
  const seek=t=>new Promise(r=>{if(Math.abs(video.currentTime-t)<.002&&video.readyState>=2){r();return;}let done=false;const fin=()=>{if(done)return;done=true;video.removeEventListener("seeked",fin);r();};video.addEventListener("seeked",fin);video.currentTime=t;setTimeout(fin,2000);});
  async function sample(onP){const len=clip[1]-clip[0];fps=len<=4?30:Math.max(12,Math.floor(120/len));const n=Math.max(8,Math.min(150,Math.round(len*fps)+1));fps=(n-1)/len;
    const long=360,sc=long/Math.max(meta.w,meta.h);AW=Math.round(meta.w*sc);AH=Math.round(meta.h*sc);const c=document.createElement("canvas");c.width=AW;c.height=AH;const g=c.getContext("2d",{willReadFrequently:true});F=[];
    for(let i=0;i<n;i++){const t=clip[0]+len*i/(n-1);await seek(t);g.drawImage(video,0,0,AW,AH);const d=g.getImageData(0,0,AW,AH).data,gr=new Uint8Array(AW*AH);for(let j=0,k=0;j<d.length;j+=4,k++)gr[k]=(d[j]*77+d[j+1]*150+d[j+2]*29)>>8;F.push({t,g:gr});onP&&onP((i+1)/n);}
    // motion box and movement trail
    const cnt=new Uint16Array(AW*AH);dense=[];for(let i=1;i<F.length;i++){const a=F[i-1].g,b=F[i].g;let sx=0,sy=0,m=0;for(let k=0;k<a.length;k++){if(Math.abs(a[k]-b[k])>22){cnt[k]++;sx+=k%AW;sy+=(k/AW)|0;m++;}}dense.push({t:F[i].t,x:m>12?sx/m/AW:null,y:m>12?sy/m/AH:null});}
    const xs=[],ys=[];for(let k=0;k<cnt.length;k++)if(cnt[k]>=2){xs.push(k%AW);ys.push((k/AW)|0);}
    if(xs.length>40){xs.sort((a,b)=>a-b);ys.sort((a,b)=>a-b);const q=(a,p)=>a[Math.floor(p*(a.length-1))];bbox=[q(xs,.04),q(ys,.03),q(xs,.96),q(ys,.985)];}else bbox=[AW*.35,AH*.1,AW*.65,AH*.92];
    if(bbox[3]-bbox[1]<AH*.3){const cy=(bbox[1]+bbox[3])/2;bbox[1]=Math.max(0,cy-AH*.35);bbox[3]=Math.min(AH,cy+AH*.35);}}
  function estimate(){const [x0,y0,x1,y1]=bbox,cx=(x0+x1)/2,H=Math.min(y1-y0,AH*.95),top=y1-H,f=facing,p={};
    if(view==="front"){Object.assign(p,{head:[cx,top+.06*H],l_shoulder:[cx+.11*H,top+.19*H],r_shoulder:[cx-.11*H,top+.19*H],l_hip:[cx+.08*H,top+.5*H],r_hip:[cx-.08*H,top+.5*H],l_knee:[cx+.075*H,top+.72*H],r_knee:[cx-.075*H,top+.72*H],l_ankle:[cx+.07*H,top+.95*H],r_ankle:[cx-.07*H,top+.95*H]});}
    else Object.assign(p,{head:[cx,top+.06*H],shoulder:[cx,top+.18*H],elbow:[cx+f*.02*H,top+.34*H],wrist:[cx+f*.05*H,top+.48*H],hip:[cx,top+.5*H],knee:[cx+f*.03*H,top+.72*H],ankle:[cx,top+.95*H],toe:[cx+f*.08*H,top+.975*H]});
    for(const k in p){p[k][0]=Math.max(4,Math.min(AW-4,p[k][0]));p[k][1]=Math.max(4,Math.min(AH-4,p[k][1]));}return p;}
  /* ---------- tracking: zero-mean SSD block matching with a velocity prediction ---------- */
  function patch(G,p){const r=6,w=AW,h=AH,px=Math.max(r,Math.min(w-r-1,R(p[0]))),py=Math.max(r,Math.min(h-r-1,R(p[1]))),n=(2*r+1)*(2*r+1),T=new Float32Array(n);let tm=0,k=0;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const v=G[(py+dy)*w+px+dx];T[k++]=v;tm+=v;}tm/=n;for(k=0;k<n;k++)T[k]-=tm;return T;}
  function match(T1,T2,B,pred,Rr){const r=6,w=AW,h=AH,n=(2*r+1)*(2*r+1);
    const score=(cx,cy)=>{if(cx<r||cy<r||cx>w-r-1||cy>h-r-1)return Infinity;let bm=0;for(let dy=-r;dy<=r;dy++){const o=(cy+dy)*w+cx;for(let dx=-r;dx<=r;dx++)bm+=B[o+dx];}bm/=n;let s1=0,s2=0,i=0;
      for(let dy=-r;dy<=r;dy++){const o=(cy+dy)*w+cx;for(let dx=-r;dx<=r;dx++){const v=B[o+dx]-bm,e1=v-T1[i],e2=v-T2[i];s1+=e1*e1;s2+=e2*e2;i++;}}
      const dd=(cx-pred[0])**2+(cy-pred[1])**2;return .55*s1+.45*s2+dd*n*.6;};
    let best=Infinity,bx=R(pred[0]),by=R(pred[1]);const cx0=bx,cy0=by;
    for(let dy=-Rr;dy<=Rr;dy+=2)for(let dx=-Rr;dx<=Rr;dx+=2){const s=score(cx0+dx,cy0+dy);if(s<best){best=s;bx=cx0+dx;by=cy0+dy;}}
    const fx=bx,fy=by;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const s=score(fx+dx,fy+dy);if(s<best){best=s;bx=fx+dx;by=fy+dy;}}
    const sx0=score(bx-1,by),sx1=score(bx+1,by),sy0=score(bx,by-1),sy1=score(bx,by+1);let ox=0,oy=0;const den=sx0-2*best+sx1,deny=sy0-2*best+sy1;if(isFinite(den)&&den>0)ox=Math.max(-.5,Math.min(.5,(sx0-sx1)/(2*den)));if(isFinite(deny)&&deny>0)oy=Math.max(-.5,Math.min(.5,(sy0-sy1)/(2*deny)));
    return {p:[bx+ox,by+oy],c:best/n};}
  /* keep bone lengths close to those marked by the athlete; the less certain end of a bone gives way */
  function constrain(cur,conf,ref){const B=BONES[view];for(let it=0;it<3;it++)B.forEach(([a,b])=>{const pa=cur[a],pb=cur[b],L0=ref[a+"|"+b];if(!pa||!pb||!L0)return;const L=d2(pa,pb);if(!L)return;const lo=L0*.8,hi=L0*1.15;if(L>=lo&&L<=hi)return;
      const tgt=L<lo?lo:hi,ca=conf[a]||1,cb=conf[b]||1,wa=ca/(ca+cb),dx=(pb[0]-pa[0])/L,dy=(pb[1]-pa[1])/L,dl=L-tgt;cur[a]=[pa[0]+dx*dl*wa,pa[1]+dy*dl*wa];cur[b]=[pb[0]-dx*dl*(1-wa),pb[1]-dy*dl*(1-wa)];});}
  /* torso, head and arms: rotate a strip sampled along the limb around its parent joint (a rotation-tolerant limb template) */
  const ARC={hip:"knee",shoulder:"hip",head:"shoulder",elbow:"shoulder",wrist:"elbow"};
  const US=[.3,.4,.5,.6,.7,.8,.9,1],VS=[-9,-5,-2,0,2,5,9];
  function strip(G,par,t,len){const out=new Float32Array(US.length*VS.length),c=Math.cos(t),sn=Math.sin(t);let k=0,m=0;
    for(const u of US)for(const v of VS){let x=par[0]+c*u*len-sn*v,y=par[1]+sn*u*len+c*v;x=Math.max(0,Math.min(AW-2,x));y=Math.max(0,Math.min(AH-2,y));const x0=x|0,y0=y|0,fx=x-x0,fy=y-y0,o=y0*AW+x0;
      const val=G[o]*(1-fx)*(1-fy)+G[o+1]*fx*(1-fy)+G[o+AW]*(1-fx)*fy+G[o+AW+1]*fx*fy;out[k++]=val;m+=val;}m/=out.length;for(k=0;k<out.length;k++)out[k]-=m;return out;}
  function stripMatch(S1,S2,B,par,len,th,span){let best=Infinity,bt=th,bk=1;const n=S1.length;
    for(let da=-span;da<=span;da+=2)for(const k of [.9,1,1.08]){const t=th+da*Math.PI/180,q=strip(B,par,t,len*k);let s1=0,s2=0;for(let i=0;i<n;i++){const e1=q[i]-S1[i],e2=q[i]-S2[i];s1+=e1*e1;s2+=e2*e2;}
      const sc=(.6*s1+.4*s2)/n+Math.abs(da)*.6+Math.abs(1-k)*60;if(sc<best){best=sc;bt=t;bk=k;}}
    return {t:bt,k:bk,c:best};}
  function trackFrom(i0,dir,stopAt){const J=joints(),side=view==="side";let cur=Object.assign({},P[i0]),vel={},ref={},tA={},sA={},om={};const ang2=(c,p)=>Math.atan2(c[1]-p[1],c[0]-p[0]);
    const reset=(G)=>{J.forEach(j=>{vel[j]=[0,0];om[j]=0;if(cur[j])tA[j]=patch(G,cur[j]);if(side&&ARC[j]&&cur[j]&&cur[ARC[j]])sA[j]=strip(G,cur[ARC[j]],ang2(cur[j],cur[ARC[j]]),d2(cur[j],cur[ARC[j]]));});};
    BONES[view].forEach(([a,b])=>{if(cur[a]&&cur[b])ref[a+"|"+b]=d2(cur[a],cur[b]);});reset(F[i0].g);
    for(let i=i0+dir;i>=0&&i<F.length;i+=dir){if(stopAt!=null&&(dir>0?i>=stopAt:i<=stopAt))break;if(anchors[i]){cur=Object.assign({},anchors[i]);P[i]=cur;reset(F[i].g);continue;}
      const A=F[i-dir].g,Bg=F[i].g,next={},conf={};
      J.forEach(j=>{if(side&&ARC[j])return;const p=cur[j];if(!p)return;const pred=[p[0]+vel[j][0]*.7,p[1]+vel[j][1]*.7],Rr=Math.min(30,9+R(Math.hypot(vel[j][0],vel[j][1])*1.5));const m=match(patch(A,p),tA[j],Bg,pred,Rr);next[j]=m.p;conf[j]=m.c+1;});
      constrain(next,conf,ref);
      if(side)["hip","shoulder","head","elbow","wrist"].forEach(j=>{const pj=ARC[j],p=cur[j],pp=cur[pj],np=next[pj];if(!p||!pp||!np)return;const len=d2(p,pp)*.3+(ref[pj+"|"+j]||ref[j+"|"+pj]||d2(p,pp))*.7,th0=ang2(p,pp),th=th0+om[j]*.8,
          span=j==="hip"||j==="shoulder"||j==="head"?20:Math.min(100,45+Math.abs(om[j])*180/Math.PI*1.4);const m=stripMatch(strip(A,pp,th0,d2(p,pp)),sA[j],Bg,np,len,th,span);
        next[j]=[np[0]+Math.cos(m.t)*len*m.k,np[1]+Math.sin(m.t)*len*m.k];let d=m.t-th0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;om[j]=d;});
      J.forEach(j=>{if(next[j]&&cur[j])vel[j]=[next[j][0]-cur[j][0],next[j][1]-cur[j][1]];});cur=next;P[i]=cur;}}
  function smooth(){const J=joints(),Q=P.map(o=>Object.assign({},o));for(let i=1;i<P.length-1;i++){if(anchors[i])continue;J.forEach(j=>{const a=P[i-1][j],b=P[i][j],c=P[i+1][j];if(a&&b&&c)Q[i][j]=[(a[0]+2*b[0]+c[0])/4,(a[1]+2*b[1]+c[1])/4];});}P=Q;}
  function trackAll(){const ks=Object.keys(anchors).map(Number).sort((a,b)=>a-b);if(!ks.length)return;P=new Array(F.length).fill(null);
    ks.forEach(k=>{P[k]=Object.assign({},anchors[k]);});trackFrom(ks[0],-1,null);ks.forEach((k,i)=>trackFrom(k,1,ks[i+1]!=null?ks[i+1]:null));
    if(view==="side")try{solveArms(ks);}catch(e){}smooth();}
  /* Arms: whole-clip search instead of frame-by-frame guessing. For every frame and every arm angle (5 degree steps) we score
     how well the limb matches its look in your marked frames and whether it sits on moving foreground (camera is still, so the
     median frame is the empty background). A shortest-path pass then picks the smoothest sequence of angles that fits the evidence,
     so a fast swing across the body cannot pull the arm off course for the rest of the clip. Marked frames are fixed points. */
  function background(){const n=F.length,step=Math.max(1,Math.floor(n/25)),idx=[];for(let i=0;i<n;i+=step)idx.push(i);const N=AW*AH,bg=new Uint8Array(N),tmp=new Uint8Array(idx.length);
    for(let q=0;q<N;q++){for(let k=0;k<idx.length;k++)tmp[k]=F[idx[k]].g[q];tmp.sort();bg[q]=tmp[tmp.length>>1];}return bg;}
  function solveArms(ks){const NB=72,DEG=Math.PI/180,bg=background(),ang=(c,p)=>Math.atan2(c[1]-p[1],c[0]-p[0]);
    // pixels already explained by the torso and legs do not count as arm evidence (score them neutral)
    const segD=(p,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1],l2=vx*vx+vy*vy||1;let t=((p[0]-a[0])*vx+(p[1]-a[1])*vy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*vx,p[1]-a[1]-t*vy);};
    const body=i=>{const o=P[i];if(!o)return [];const out=[];const add=(a,b,k)=>{if(o[a]&&o[b])out.push([o[a],o[b],d2(o[a],o[b])*k]);};add("shoulder","hip",.3);add("hip","knee",.24);add("knee","ankle",.17);add("head","shoulder",.0);if(o.head)out.push([o.head,o.head,(o.shoulder?d2(o.head,o.shoulder):20)*.45]);return out;};
    let curBody=[];
    const fgAlong=(G,o,t,len)=>{let f=0,n=0;const c=Math.cos(t),sn=Math.sin(t);for(let u=.3;u<=1.001;u+=.1){const x=Math.round(o[0]+c*u*len),y=Math.round(o[1]+sn*u*len);n++;if(x<0||y<0||x>=AW||y>=AH)continue;
      if(curBody.some(([a,b,r])=>segD([x,y],a,b)<r)){f+=.5;continue;}const q=y*AW+x;if(Math.abs(G[q]-bg[q])>16)f++;}return f/n;};
    // joint search over (upper-arm angle, forearm angle), 10 degree steps, both limbs scored together
    const NA=36,ST=10*DEG,refs=ks.filter(k=>anchors[k].shoulder&&anchors[k].elbow&&anchors[k].wrist).map(k=>{const A=anchors[k],L1=d2(A.elbow,A.shoulder),L2=d2(A.wrist,A.elbow),t1=ang(A.elbow,A.shoulder),t2=ang(A.wrist,A.elbow);
      return {k,L1,L2,t1,t2,S1:strip(F[k].g,A.shoulder,t1,L1),S2:strip(F[k].g,A.elbow,t2,L2)};});
    if(!refs.length)return;const L1=refs.reduce((a,r)=>a+r.L1,0)/refs.length,L2=refs.reduce((a,r)=>a+r.L2,0)/refs.length,n=F.length;
    const app=(q,key)=>{let best=Infinity;refs.forEach(r=>{const S=r[key];let e=0;for(let k=0;k<q.length;k++){const d=q[k]-S[k];e+=d*d;}e/=q.length;if(e<best)best=e;});return Math.min(best,2500)/400;};
    const bin=t=>((Math.round(t/ST)%NA)+NA)%NA;
    const unary=i=>{const o=P[i]&&P[i].shoulder,U=new Float32Array(NA*NA);const fix=refs.find(r=>r.k===i);
      if(fix){U.fill(1e6);U[bin(fix.t1)*NA+bin(fix.t2)]=0;return U;}if(!o)return U;curBody=body(i);const G=F[i].g;
      for(let a=0;a<NA;a++){const t1=a*ST,e=[o[0]+Math.cos(t1)*L1,o[1]+Math.sin(t1)*L1],c1=app(strip(G,o,t1,L1),"S1")+(1-fgAlong(G,o,t1,L1))*14;
        for(let b=0;b<NA;b++){const t2=b*ST;let rel=Math.abs(((t2-t1)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);U[a*NA+b]=c1+app(strip(G,e,t2,L2),"S2")+(1-fgAlong(G,e,t2,L2))*12+(rel>160*DEG?6:0);}}return U;};
    const W=k=>{const d=Math.min(k,NA-k)*10;return d<=20?d*.03:.6+Math.pow((d-20)/18,2);},Wt=[];for(let k=0;k<NA;k++)Wt.push(W(k));
    let C=unary(0);const back=[null];
    for(let i=1;i<n;i++){const T=new Float32Array(NA*NA),ba=new Int16Array(NA*NA),M=new Float32Array(NA*NA),bb=new Int16Array(NA*NA);
      // min over previous b for each (a,b'), then over previous a for each (a',b')
      for(let a=0;a<NA;a++)for(let b=0;b<NA;b++){let m=Infinity,mb=0;for(let q=0;q<NA;q++){const v=C[a*NA+q]+Wt[Math.abs(q-b)];if(v<m){m=v;mb=q;}}M[a*NA+b]=m;bb[a*NA+b]=mb;}
      for(let b=0;b<NA;b++)for(let a=0;a<NA;a++){let m=Infinity,ma=0;for(let q=0;q<NA;q++){const v=M[q*NA+b]+Wt[Math.abs(q-a)];if(v<m){m=v;ma=q;}}T[a*NA+b]=m;ba[a*NA+b]=ma*NA+bb[ma*NA+b];}
      const U=unary(i);for(let k=0;k<NA*NA;k++)T[k]+=U[k];C=T;back.push(ba);}
    let st=0,m=Infinity;C.forEach((v,k)=>{if(v<m){m=v;st=k;}});const path=new Array(n);for(let i=n-1;i>=0;i--){path[i]=st;if(i>0)st=back[i][st];}
    for(let i=0;i<n;i++){if(anchors[i]||!P[i]||!P[i].shoulder)continue;const o=P[i].shoulder,a=Math.floor(path[i]/NA),b=path[i]%NA;curBody=body(i);const G=F[i].g;
      // refine each angle within its 10 degree cell
      let t1=a*ST,bc=Infinity;for(let d=-4;d<=4;d+=2){const t=a*ST+d*DEG,c=app(strip(G,o,t,L1),"S1")+(1-fgAlong(G,o,t,L1))*14;if(c<bc){bc=c;t1=t;}}
      const e=[o[0]+Math.cos(t1)*L1,o[1]+Math.sin(t1)*L1];let t2=b*ST;bc=Infinity;for(let d=-4;d<=4;d+=2){const t=b*ST+d*DEG,c=app(strip(G,e,t,L2),"S2")+(1-fgAlong(G,e,t,L2))*12;if(c<bc){bc=c;t2=t;}}
      P[i].elbow=e;P[i].wrist=[e[0]+Math.cos(t2)*L2,e[1]+Math.sin(t2)*L2];}}
  /* ---------- analysis ---------- */
  function analyse(){const J=joints(),N=F.length,g=(i,j)=>P[i]&&P[i][j],ys=j=>P.map(o=>o&&o[j]?o[j][1]:NaN),xs=j=>P.map(o=>o&&o[j]?o[j][0]:NaN);
    const side=view==="side",hipY=side?ys("hip"):P.map(o=>(o.l_hip[1]+o.r_hip[1])/2),hipX=side?xs("hip"):P.map(o=>(o.l_hip[0]+o.r_hip[0])/2);
    let footY=side?P.map(o=>Math.max(o.ankle[1],o.toe[1]*.6+o.ankle[1]*.4)):P.map(o=>(o.l_ankle[1]+o.r_ankle[1])/2);
    /* with the pose model: the lowest point of either foot (heel or toes, near or far leg), from the unsmoothed track */
    if(poseMode&&feet){const ks=Object.keys(feet).filter(k=>/heel|toe/.test(k));const lo=footY.map((v,i)=>{let m=-Infinity;ks.forEach(k=>{const y=feet[k].y[i];if(isFinite(y)&&y>m)m=y;});return isFinite(m)?m:v;});footY=lo;}
    const headY=ys("head"),early=Math.max(3,Math.floor(N*.2)),ankY=side?ys("ankle"):footY;
    facing=side?(median(P.slice(0,early).map(o=>o.toe[0]-o.ankle[0]))>=0?1:-1):1;
    // body size in pixels from the tallest early posture
    let bodyPx=0,stand=0;for(let i=0;i<Math.max(early,Math.floor(N*.4));i++){const v=ankY[i]-headY[i];if(v>bodyPx){bodyPx=v;stand=i;}}bodyPx=bodyPx/.9||AH*.7;
    /* pose model: stature from segment lengths, which do not change with posture (thigh + shank = 0.491 and trunk = 0.288 of height) */
    if(poseMode&&side){const seg=(a,b)=>median(P.map(o=>o&&o[a]&&o[b]?d2(o[a],o[b]):NaN)),leg=seg("hip","knee")+seg("knee","ankle"),tr=seg("shoulder","hip");
      const est=[leg/.491,leg/.491,tr/.288].filter(v=>isFinite(v)&&v>AH*.08);if(est.length)bodyPx=est.reduce((a,b)=>a+b,0)/est.length;}
    const H=(S().profile&&S().profile.height)||178,cmPx=H/bodyPx;
    // airborne frames: feet clearly above their early ground line
    let ground=median(footY.slice(0,early)),thr=.03*bodyPx;
    /* pose model: the floor is where the feet spend most of the clip (robust to clips that start mid-approach), and the
       take-off threshold adapts to how steady the feet look while standing */
    if(poseMode){const srt=footY.filter(v=>isFinite(v)).sort((a,b)=>a-b),hi=srt.slice(Math.floor(srt.length*.55));ground=hi.length?hi[hi.length>>1]:ground;
      const st=footY.filter(v=>Math.abs(v-ground)<.03*bodyPx),mad=st.length>4?median(st.map(v=>Math.abs(v-ground)))*1.4826:0;thr=Math.max(.018*bodyPx,3.5*mad,1.5);}
    const air=footY.map(v=>v<ground-thr);let best=[-1,-1],run=-1;
    for(let i=0;i<=N;i++){if(i<N&&air[i]){if(run<0)run=i;}else if(run>=0){if(i-run>best[1]-best[0])best=[run,i];run=-1;}}
    /* pose model: judge take-off and landing against the floor level just before and just after the jump, because the
       feet sit lower or higher in the picture whenever the athlete steps toward or away from the camera */
    let gA=ground,gB=ground;
    if(poseMode){best=[-1,-1];const W=Math.max(4,R(fps*.8)),lift=Math.max(4*thr,.05*bodyPx),win=(i0,i1)=>{const v=footY.slice(Math.max(0,i0),Math.min(N,i1+1)).filter(x=>isFinite(x)).sort((a,b)=>b-a);return v.length?v.slice(0,Math.max(1,Math.ceil(v.length*.25)))[Math.floor(Math.max(1,Math.ceil(v.length*.25))/2)]:NaN;};
      const order=[...hipY.keys()].filter(i=>isFinite(hipY[i])&&isFinite(footY[i])).sort((a,b)=>hipY[a]-hipY[b]);
      for(const i of order.slice(0,Math.max(5,R(N*.25)))){const pre=win(i-W,i),post=win(i,i+W);if(!(footY[i]<Math.min(pre,post)-lift))continue;
        let a=i;while(a>0&&footY[a-1]<pre-thr)a--;let b=i;while(b<N&&footY[b]<post-thr)b++;
        if(a>0&&b<N){best=[a,b];gA=pre;gB=post;break;}}}
    const ph={};let flight=null,tTO=null,tLand=null;
    if(best[0]>0&&best[1]<N&&best[1]-best[0]>=2){const a=best[0],b=best[1];// sub-frame crossing times
      const cross=(i0,i1,G0)=>{const y0=footY[i0],y1=footY[i1],tg=(G0!=null?G0:ground)-thr;const u=y1===y0?.5:Math.max(0,Math.min(1,(tg-y0)/(y1-y0)));return F[i0].t+(F[i1].t-F[i0].t)*u;};
      const tOff=cross(a-1,a,gA),tOn=b<N?cross(b-1,b,gB):F[N-1].t,tm=Math.max(0,tOn-tOff)/slowmo,thrM=thr*cmPx/100;tTO=tOff;tLand=tOn;
      /* the feet spend a moment below the threshold at each end: correct for it with the take-off speed implied by the flight */
      flight=(tm+Math.sqrt(tm*tm+16*thrM/9.81))/2;
      /* pose model: the feet leave and meet the floor fast, so extend the foot's own path back to the floor line instead
         (the correction above assumes the feet move like the body's centre, which overestimates for clear foot tracks) */
      if(poseMode){const hit=(i0,i1,G0,lo,hi)=>{const y0=footY[i0],y1=footY[i1],t0=F[i0].t,t1=F[i1].t;if(!isFinite(y0)||!isFinite(y1)||y1===y0)return null;const t=t0+(G0-y0)*(t1-t0)/(y1-y0);return Math.max(lo,Math.min(hi,t));};
        const off=a+1<N?hit(a,a+1,gA,F[a-1].t,F[a].t):null,on=b-2>=0&&b<N?hit(b-2,b-1,gB,F[b-1].t,F[b].t):null;
        if(off!=null&&on!=null&&on>off){const f2=(on-off)/slowmo;
          /* the threshold method runs slightly long and the straight-line extension slightly short; on test clips with known
             answers the truth sits between them, so the two are averaged */
          if(f2>=.12&&f2<=1){flight=flight!=null?(flight+f2)/2:f2;tTO=(tTO+off)/2;tLand=(tLand+on)/2;}}}if(!(flight>=.12&&flight<=1.0))flight=null;
      ph.takeoff=a;ph.landing=Math.min(N-1,b);let pk=a;for(let i=a;i<b;i++)if(hipY[i]<hipY[pk])pk=i;ph.peak=pk;
      let dp=Math.max(0,a-1);for(let i=0;i<a;i++)if(hipY[i]>hipY[dp])dp=i;ph.dip=dp;
      let ab=ph.landing;for(let i=ph.landing;i<Math.min(N,ph.landing+Math.round(fps*.7));i++)if(hipY[i]>hipY[ab])ab=i;ph.absorb=ab;}
    const hiW=()=>{let k=0;for(let i=0;i<N;i++)if(g(i,"wrist")&&g(i,"wrist")[1]<g(k,"wrist")[1])k=i;return k;};
    if(move==="spike"||move==="serve"){ph.contact=side?hiW():Math.floor(N/2);}
    if(move==="block"){ph.load=ph.dip!=null?ph.dip:0;delete ph.dip;}
    if(move==="set"){const r=hiW();ph.release=r;let c=Math.max(0,r-Math.round(fps*.45));for(let i=c;i<=r;i++){const e=ang(g(i,"shoulder"),g(i,"elbow"),g(i,"wrist")),ec=ang(g(c,"shoulder"),g(c,"elbow"),g(c,"wrist"));if(e!=null&&ec!=null&&e<ec)c=i;}ph.catch=c;}
    if(move==="pass"){let k=Math.floor(N/2),bs=-1;for(let i=0;i<N;i++){const sh=g(i,"shoulder"),w=g(i,"wrist");if(!sh||!w)continue;const e=ang(sh,g(i,"elbow"),w)||0,below=w[1]>sh[1]?1:0,fw=(w[0]-sh[0])*facing>0?1:0,s=e*below*(.6+.4*fw);if(s>bs){bs=s;k=i;}}ph.contact=k;}
    if(move==="squat"){let k=0;for(let i=0;i<N;i++)if(hipY[i]>hipY[k])k=i;ph.bottom=k;}
    if(move==="jump"&&ph.dip==null){let k=0;for(let i=0;i<N;i++)if(hipY[i]>hipY[k])k=i;ph.dip=k;}
    if(VB.MOVES[move].airborne&&!flight&&ph.dip==null){let k=0;for(let i=0;i<N;i++)if(hipY[i]>hipY[k])k=i;ph[move==="block"?"load":"dip"]=k;}
    // measures
    const knee=i=>side?ang(g(i,"hip"),g(i,"knee"),g(i,"ankle")):Math.min(ang(g(i,"l_hip"),g(i,"l_knee"),g(i,"l_ankle"))||180,ang(g(i,"r_hip"),g(i,"r_knee"),g(i,"r_ankle"))||180);
    const elbow=i=>ang(g(i,"shoulder"),g(i,"elbow"),g(i,"wrist")),hipA=i=>ang(g(i,"shoulder"),g(i,"hip"),g(i,"knee"));
    const trunk=i=>{const s=g(i,"shoulder"),h=g(i,"hip");return s&&h?Math.atan2((s[0]-h[0])*facing,h[1]-s[1])*180/Math.PI:null;};
    const fwd=(i,a,b)=>{const p=g(i,a),q=g(i,b);return p&&q?(p[0]-q[0])*facing/bodyPx:null;};
    const up=(i,a,b)=>{const p=g(i,a),q=g(i,b);return p&&q?(q[1]-p[1])/bodyPx:null;};
    const C=[];const add=(id,phase,label,val,lo,hi,tol,unit,fault,cue,joint,fmt)=>{if(phase==null||val==null||!isFinite(val))return;let sc=val>=lo&&val<=hi?1:Math.max(0,1-(val<lo?lo-val:val-hi)/tol);
      C.push({id,phase,label,val,lo,hi,unit,fault:sc<.85?(typeof fault==="function"?fault(val):fault):null,cue:typeof cue==="function"?cue(val):cue,score:sc,joint,fmt});};
    const flag=(id,phase,label,ok,fault,cue,joint)=>{if(phase==null||ok==null)return;C.push({id,phase,label,val:ok?1:0,bool:true,fault:ok?null:fault,cue,score:ok?1:0,joint});};
    const drift=(a,b)=>a!=null&&b!=null&&isFinite(hipX[a])&&isFinite(hipX[b])?Math.abs(hipX[b]-hipX[a])*cmPx:null;
    const softLand=()=>{if(ph.landing==null)return;let mn=180;for(let i=ph.landing;i<Math.min(N,ph.landing+Math.round(fps*.6));i++){const k=knee(i);if(k!=null&&k<mn)mn=k;}add("land","absorb","Soft landing, knee bend",mn,85,135,35,"°","stiff_landing",v=>v>135?"Land toe to heel and sink into a quarter squat so the muscles take the impact.":"Good absorption.","knee");};
    if(move==="jump"&&side){add("dipk","dip","Countermovement depth, knee angle",knee(ph.dip),90,120,30,"°",v=>v<90?"deep_dip":"shallow_dip",v=>v>120?"Load deeper: drop to roughly a quarter to half squat before you jump.":v<90?"Shorten the dip. A quick, shallower load returns more energy.":"Good depth.","knee");
      add("hinge","dip","Hip hinge, trunk lean",trunk(ph.dip),25,50,25,"°",v=>v>50?"forward_lean":"shallow_dip",v=>v<25?"Hinge at the hips and let the chest come forward as you load.":v>50?"Keep the chest prouder; you are folding too far forward.":"Good hinge.","shoulder");
      flag("armsback","dip","Arms swing back on the load",fwd(ph.dip,"wrist","hip")!=null?fwd(ph.dip,"wrist","hip")<0:null,"no_arm_swing","Throw both arms back past your hips as you load.","wrist");
      flag("armsup",ph.takeoff!=null?"takeoff":null,"Arms drive up through take-off",ph.takeoff!=null?Math.min(...[ph.takeoff,ph.peak].filter(i=>i!=null).map(i=>-(up(i,"wrist","shoulder")||0)))<0:null,"no_arm_swing","Drive both arms up hard; your hands should pass your head as you leave the floor.","wrist");
      add("ext","takeoff","Full extension at take-off, knee",knee(ph.takeoff),160,180,25,"°","incomplete_extension","Finish tall: hips, knees and ankles straight before your toes leave the floor.","knee");
      add("hipext","takeoff","Full extension at take-off, hip",hipA(ph.takeoff),160,185,25,"°","incomplete_extension","Push the hips through at take-off.","hip");
      softLand();add("drift","landing","Land where you took off",drift(ph.takeoff,ph.landing),0,25,40," cm","forward_drift","Jump up, not out: plant heels first and stay over your base.","hip");}
    if((move==="jump"||move==="squat")&&!side){const val=i=>{const o=P[i];if(!o)return null;const kw=Math.abs(o.l_knee[0]-o.r_knee[0]),aw=Math.abs(o.l_ankle[0]-o.r_ankle[0]);return aw>2?kw/aw:null;};
      const k0=move==="squat"?ph.bottom:ph.dip;add("valgus",move==="squat"?"bottom":"dip","Knees track over toes, knee to ankle width",val(k0),.9,1.4,.3,"×","knee_valgus","Push your knees out over your little toes.","l_knee",v=>v.toFixed(2));
      if(ph.absorb!=null)add("valgus2","absorb","Knees stay out on landing",val(ph.absorb),.9,1.4,.3,"×","knee_valgus","Land with knees pushed out, never collapsing inward.","l_knee",v=>v.toFixed(2));
      if(move==="jump"){const o=P[ph.dip];if(o)add("even","dip","Even hips, left to right",Math.abs(o.l_hip[1]-o.r_hip[1])*cmPx,0,3,6," cm",null,"Share the load evenly between both legs.","l_hip");}}
    if(move==="spike"){const plant=ph.dip;if(plant!=null){const v=(a,b)=>{const i0=Math.max(0,a),i1=Math.max(0,b);return isFinite(hipX[i0])&&isFinite(hipX[i1])?Math.abs(hipX[i1]-hipX[i0])*cmPx/((i1-i0)/fps||1):null;};
        const late=v(plant-R(fps*.25),plant),earlier=v(plant-R(fps*.6),plant-R(fps*.25));if(late!=null&&earlier!=null&&earlier>20)add("accel","dip","Approach speeds up into the plant",late/earlier,1,3,.5,"×","slow_last_steps","Accelerate: make the last two steps the fastest, with a long penultimate step.","hip",x=>x.toFixed(2));}
      add("plant","dip","Plant depth, knee angle",knee(plant),100,135,30,"°",v=>v<100?"deep_dip":"shallow_dip",v=>v>135?"Sit lower on the plant so the legs can load.":"Good plant.","knee");
      flag("armsback","dip","Both arms swing back on the plant",fwd(plant,"wrist","hip")!=null?fwd(plant,"wrist","hip")<0:null,"no_arm_swing","Swing both arms back on the last step, then up through the jump.","wrist");
      if(ph.takeoff!=null&&ph.contact!=null&&ph.contact>ph.takeoff){let mx=-1;for(let i=ph.takeoff;i<=ph.contact;i++){const u=up(i,"elbow","shoulder");if(u!=null&&u>mx)mx=u;}flag("elbow","contact","Hitting elbow draws back high",mx>-.01,"low_elbow","Draw the elbow back level with or above your ear before you swing.","elbow");}
      add("reach","contact","Full reach at contact, elbow angle",elbow(ph.contact),155,180,30,"°","bent_arm_contact","Reach to full extension and meet the ball as high as you can.","elbow");
      add("front","contact","Contact in front of your head",fwd(ph.contact,"wrist","head")!=null?fwd(ph.contact,"wrist","head")*100:null,2,25,10,"% body height","contact_behind","Stay behind the ball so contact is in front of the hitting shoulder.","wrist",x=>x.toFixed(0));
      softLand();add("drift","landing","Forward travel take-off to landing",drift(ph.takeoff,ph.landing),0,90,60," cm","forward_drift","Convert speed into height: plant heels first and jump up.","hip");}
    if(move==="pass"){const c=ph.contact;add("base","contact","Low base, knee angle",knee(c),100,145,30,"°","upright_posture",v=>v>145?"Sit lower: knees bent, hips back, before the ball arrives.":"Good base.","knee");
      add("lean","contact","Shoulders forward, trunk lean",trunk(c),20,45,20,"°","weight_back",v=>v<20?"Lean in: shoulders ahead of your knees.":"Good posture.","shoulder");
      add("arms","contact","Straight arms, elbow angle",elbow(c),160,180,30,"°","bent_elbows_platform","Lock the elbows and press the wrists down to make one flat platform.","elbow");
      const sh=g(c,"shoulder"),w=g(c,"wrist");if(sh&&w){const a=Math.atan2((w[1]-sh[1]),Math.abs(w[0]-sh[0]))*180/Math.PI;add("platform","contact","Platform angle below the shoulders",a,25,60,25,"°","swinging_platform",v=>v<25?"Keep the platform below shoulder height and lift with the legs, not the arms.":"Good platform angle.","wrist");}
      add("over","contact","Weight over the toes",fwd(c,"shoulder","ankle")!=null?fwd(c,"shoulder","ankle")*100:null,4,30,10,"% body height","weight_back","Get onto the balls of your feet with the shoulders over the toes.","ankle",x=>x.toFixed(0));}
    if(move==="set"){const c=ph.catch,r=ph.release;flag("high","catch","Hands above the forehead at contact",g(c,"wrist")&&g(c,"head")?g(c,"wrist")[1]<g(c,"head")[1]+.02*bodyPx:null,"low_set_contact","Take the ball above the hairline with the hands up early.","wrist");
      add("load","catch","Elbows bent to receive",elbow(c),60,115,30,"°",null,"Let the ball come into soft, bent elbows.","elbow");
      add("release","release","Arms extend through the release",elbow(r),150,180,30,"°",null,"Finish long with both arms toward the target.","elbow");
      const kd=knee(r)!=null&&knee(c)!=null?knee(r)-knee(c):null;add("legs","release","Leg drive, knee extension during the set",kd,10,60,15,"°","no_leg_drive_set","Extend legs and arms together.","knee");}
    if(move==="serve"){const c=ph.contact;add("reach","contact","Full reach at contact, elbow angle",elbow(c),155,180,30,"°","bent_arm_contact","Contact with a long arm, high in front of the hitting shoulder.","elbow");
      add("front","contact","Contact in front of your head",fwd(c,"wrist","head")!=null?fwd(c,"wrist","head")*100:null,2,25,10,"% body height","contact_behind","Toss in front of the hitting shoulder so you hit through the ball.","wrist",x=>x.toFixed(0));
      let mx=-1;for(let i=Math.max(0,c-R(fps*.5));i<c;i++){const u=up(i,"elbow","shoulder");if(u!=null&&u>mx)mx=u;}flag("elbow","contact","Elbow high before the swing",mx>-.01,"low_elbow","Draw the elbow back high, level with your ear.","elbow");}
    if(move==="block"){const L=ph.load;let mn=1;for(let i=0;i<=(ph.takeoff!=null?ph.takeoff:L||0);i++){const u=up(i,"wrist","shoulder");if(u!=null&&u<mn)mn=u;}
      flag("hands","load","Hands stay above the shoulders",mn>-.01,"block_arm_drop","Keep hands up at head height and jump from there; no arm swing.","wrist");
      const pk=ph.peak;add("press","peak","Hands press over the net",fwd(pk,"wrist","shoulder")!=null?fwd(pk,"wrist","shoulder")*100:null,5,30,10,"% body height","no_penetration","Press the hands across the net and shrug the shoulders to your ears.","wrist",x=>x.toFixed(0));
      add("arms","peak","Long arms at the peak, elbow angle",elbow(pk),155,180,30,"°","no_penetration","Lock the arms long and firm at the top.","elbow");
      softLand();add("drift","landing","Land where you took off",drift(ph.takeoff,ph.landing),0,20,30," cm","forward_drift","Jump straight up so you do not drift into the net.","hip");}
    if(move==="squat"&&side){const b=ph.bottom;add("depth","bottom","Depth, knee angle",knee(b),60,95,30,"°","shallow_depth","Lower until your thighs are at least parallel, with control.","knee");
      add("chest","bottom","Chest up, trunk lean",trunk(b),10,45,20,"°","forward_lean","Brace and keep the chest up.","shoulder");
      const ar=isFinite(ankY[b])&&isFinite(ankY[stand])?(ankY[stand]-ankY[b])/bodyPx*100:null;add("heels","bottom","Heels stay down, ankle rise",ar,-1,1.5,2,"% body height","heels_lift","Keep the whole foot down. Work on ankle mobility.","ankle",x=>x.toFixed(1));}
    let jumpFlight=flight?Math.round(122.6*flight*flight*10)/10:null,hipRise=ph.takeoff!=null&&ph.peak!=null?Math.round((hipY[ph.takeoff]-hipY[ph.peak])*cmPx*10)/10:null;
    // physical limits: nobody jumps more than about 1.3 m, and a body that is not found well gives a wrong scale
    const ok=v=>v!=null&&isFinite(v)&&v>=3&&v<=130;if(!ok(jumpFlight))jumpFlight=null;if(!ok(hipRise))hipRise=null;
    const scaleOk=bodyPx>AH*.15&&bodyPx<AH*1.05;if(!scaleOk)hipRise=null;
    let jumpSure=false,jumpNote="";
    if(jumpFlight!=null&&hipRise!=null){const d=Math.abs(jumpFlight-hipRise);jumpSure=d<=Math.max(10,.35*jumpFlight);if(!jumpSure)jumpNote="Air time and hip rise disagree, so this height was not saved. Film side-on with your whole body and the floor in frame.";}
    else if(jumpFlight!=null){jumpSure=true;}
    else if(hipRise!=null){jumpNote="No clean take-off and landing were found, so only the hip rise is shown and it was not saved as your vertical.";}
    else if(move==="jump")jumpNote="No believable jump height was found in this clip. Check that your feet and the floor are visible for the whole jump.";
    const score=C.length?Math.round(C.reduce((a,c)=>a+c.score,0)/C.length*100):null;
    /* speeds, in real metres per second (slow motion corrected); only from the pose model's smoothed paths */
    let approach=null,handSpeed=null;
    if(poseMode&&side&&scaleOk){const spd=(j,i0,i1)=>{const a=g(i0,j),b=g(i1,j);return a&&b&&i1>i0?Math.hypot(b[0]-a[0],b[1]-a[1])*cmPx/100/((F[i1].t-F[i0].t)/slowmo):null;};
      if(ph.takeoff!=null&&(move==="spike"||move==="serve")){const i1=Math.max(0,ph.takeoff-1),i0=Math.max(0,i1-Math.max(2,R(fps*.3)));const a=g(i0,"hip"),b=g(i1,"hip");
        if(a&&b){const v=Math.abs(b[0]-a[0])*cmPx/100/((F[i1].t-F[i0].t)/slowmo);if(v>.3&&v<9)approach=Math.round(v*10)/10;}}
      if(ph.contact!=null&&(move==="spike"||move==="serve")){let mx=0;const w=Math.max(2,R(fps*.12));for(let i=Math.max(1,ph.contact-w);i<=Math.min(N-1,ph.contact+w);i++){const v=spd("wrist",i-1,i);if(v!=null&&v>mx)mx=v;}if(mx>1&&mx<40)handSpeed=Math.round(mx*10)/10;}}
    return {checks:C,ph,flight,jumpFlight,hipRise,jumpSure,jumpNote,score,bodyPx,cmPx,facing,stand,tTO,tLand,approach,handSpeed,slowmo,auto:poseMode,diag:{ground,thr,footY,hipY,best}};}
  /* ---------- ideal-form ghost ---------- */
  function ghost(i,key){const o=P[i],id=IDEAL[move]&&IDEAL[move][key];if(!o||!id||view!=="side")return null;const s=res&&res.stand!=null?P[res.stand]:P[0],L=(a,b)=>d2(s[a],s[b]),f=res?res.facing:facing,rd=Math.PI/180,hip=o.hip;
    const dn=(p,deg,len)=>[p[0]+Math.sin(deg*rd)*f*len,p[1]+Math.cos(deg*rd)*len],upv=(p,deg,len)=>[p[0]+Math.sin(deg*rd)*f*len,p[1]-Math.cos(deg*rd)*len];
    const knee=dn(hip,id.a,L("hip","knee")),ankle=dn(knee,id.b,L("knee","ankle")),toe=[ankle[0]+f*L("ankle","toe"),ankle[1]],sh=upv(hip,id.c,L("hip","shoulder")),head=upv(sh,id.c,L("shoulder","head")),el=upv(sh,id.d,L("shoulder","elbow")),wr=upv(el,id.e,L("elbow","wrist"));
    return {head,shoulder:sh,elbow:el,wrist:wr,hip,knee,ankle,toe};}
  /* ---------- overlay ---------- */
  const frameAt=t=>{if(!F.length)return -1;let k=Math.round((t-clip[0])/((clip[1]-clip[0])||1)*(F.length-1));return Math.max(0,Math.min(F.length-1,k));};
  function ptsAt(t){if(!P||!F.length)return null;const x=(t-clip[0])/((clip[1]-clip[0])||1)*(F.length-1);if(x<=0)return P[0];if(x>=F.length-1)return P[F.length-1];const i=Math.floor(x),u=x-i,a=P[i],b=P[i+1];if(!a||!b)return a||b;const o={};joints().forEach(j=>{if(a[j]&&b[j])o[j]=[a[j][0]+(b[j][0]-a[j][0])*u,a[j][1]+(b[j][1]-a[j][1])*u];});return o;}
  function drawSkel(o,w,h,style,lw,dots,dash){if(!o)return;const sx=w/AW,sy=h/AH;ctx.save();ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=style;ctx.lineWidth=lw;if(dash)ctx.setLineDash(dash);
    BONES[view].forEach(([a,b])=>{if(o[a]&&o[b]){ctx.beginPath();ctx.moveTo(o[a][0]*sx,o[a][1]*sy);ctx.lineTo(o[b][0]*sx,o[b][1]*sy);ctx.stroke();}});
    if(view==="front"&&o.head&&o.l_shoulder&&o.r_shoulder){ctx.beginPath();ctx.moveTo(o.head[0]*sx,o.head[1]*sy);ctx.lineTo((o.l_shoulder[0]+o.r_shoulder[0])/2*sx,(o.l_shoulder[1]+o.r_shoulder[1])/2*sy);ctx.stroke();}
    ctx.setLineDash([]);if(dots)joints().forEach(j=>{if(!o[j])return;ctx.beginPath();ctx.arc(o[j][0]*sx,o[j][1]*sy,dots,0,7);ctx.fillStyle="#fff";ctx.fill();ctx.lineWidth=2;ctx.strokeStyle="#17144d";ctx.stroke();});ctx.restore();}
  function draw(){if(!ctx||!meta)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==R(w*dpr)||canvas.height!==R(h*dpr)){canvas.width=R(w*dpr);canvas.height=R(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);paint(w,h,video.currentTime);graph();}
  function paint(w,h,t){
    if(dense){ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=1.5;ctx.setLineDash([4,5]);ctx.beginPath();let on=false;dense.forEach(d=>{if(d.x==null||d.t>t)return;if(!on){ctx.moveTo(d.x*w,d.y*h);on=true;}else ctx.lineTo(d.x*w,d.y*h);});ctx.stroke();ctx.setLineDash([]);}
    if(mode==="mark"){const k=frameAt(t),o=anchors[k]||P&&P[k];drawSkel(o,w,h,"rgba(236,59,82,.95)",3,7);ctx.font="700 11px Barlow, sans-serif";ctx.textBaseline="middle";if(o)joints().forEach(j=>{if(!o[j])return;const x=o[j][0]*w/AW+10,y=o[j][1]*h/AH;ctx.fillStyle="rgba(23,20,77,.85)";const tw=ctx.measureText(LABEL[j]).width;ctx.fillRect(x-3,y-8,tw+6,16);ctx.fillStyle="#fff";ctx.fillText(LABEL[j],x,y);});return;}
    if(!P)return;const side=view==="side",sx=w/AW,sy=h/AH,hand="wrist";
    // trails of hip and hand
    const trail=(j,col)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();let on=false;for(let i=0;i<P.length;i++){if(F[i].t>t+.01)break;const p=P[i][j];if(!p)continue;if(!on){ctx.moveTo(p[0]*sx,p[1]*sy);on=true;}else ctx.lineTo(p[0]*sx,p[1]*sy);}ctx.stroke();};
    if(side){trail("hip","rgba(91,43,255,.9)");trail(hand,"rgba(236,59,82,.9)");}else trail("l_hip","rgba(91,43,255,.9)");
    const o=ptsAt(t);
    // ideal ghost near a scored phase
    if(ghostOn&&res&&side){let gk=null,gi=null,bd=1e9;for(const k in res.ph){const i=res.ph[k];if(i==null||!IDEAL[move]||!IDEAL[move][k])continue;const dt=Math.abs(F[i].t-t);if(dt<bd){bd=dt;gk=k;gi=i;}}
      if(gk&&bd<.12){const gh=ghost(frameAt(t),gk);drawSkel(gh,w,h,"rgba(32,196,180,.95)",3,0,[7,6]);if(gh){ctx.font="700 12px Barlow, sans-serif";ctx.fillStyle="#20c4b4";ctx.fillText("Ideal "+(PH[gk]||gk).toLowerCase(),gh.head[0]*sx+10,gh.head[1]*sy-12);}}}
    drawSkel(o,w,h,"#ffffff",3.2,4.5);
    if(o&&side){ctx.font="600 12px Barlow, sans-serif";ctx.textBaseline="middle";[["knee",ang(o.hip,o.knee,o.ankle)],["elbow",ang(o.shoulder,o.elbow,o.wrist)],["hip",ang(o.shoulder,o.hip,o.knee)]].forEach(([j,a])=>{if(a==null||!o[j])return;const tx=R(a)+"°",x=o[j][0]*sx+10,y=o[j][1]*sy;ctx.fillStyle="rgba(23,20,77,.85)";ctx.fillRect(x-3,y-9,ctx.measureText(tx).width+6,18);ctx.fillStyle="#fff";ctx.fillText(tx,x,y);});}
    compareGhost(w,h,t);measureDraw(w,h);callouts(w,h,t,o);}
  function wrap(text,maxW){const words=text.split(" "),lines=[];let l="";words.forEach(wd=>{const tr=l?l+" "+wd:wd;if(ctx.measureText(tr).width>maxW&&l){lines.push(l);l=wd;}else l=tr;});if(l)lines.push(l);return lines.slice(0,5);}
  function callouts(w,h,t,o){const near=comments.filter(c=>Math.abs(c.t-t)<(video.paused?.05:.25));if(!near.length)return;const c=near[0],j=c.joint&&o&&o[c.joint]?[o[c.joint][0]/AW,o[c.joint][1]/AH]:null;
    ctx.font="600 13px Barlow, sans-serif";ctx.textBaseline="top";const maxW=Math.min(240,w*.5),lines=wrap((c.kind==="me"?"You: ":"")+c.text,maxW),bw=Math.min(maxW,Math.max(...lines.map(l=>ctx.measureText(l).width)))+20,bh=lines.length*17+14;
    const ax=j?j[0]*w:w*.5,ay=j?j[1]*h:h*.2;let bx=ax>w/2?ax-bw-46:ax+46,by=Math.max(8,Math.min(h-bh-8,ay-bh/2));bx=Math.max(8,Math.min(w-bw-8,bx));const col=c.kind==="good"?"#1d9a62":c.kind==="me"?"#5b2bff":"#ec3b52";
    if(j){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx<ax?bx+bw:bx,by+bh/2);ctx.stroke();ctx.beginPath();ctx.arc(ax,ay,11,0,7);ctx.stroke();}
    ctx.fillStyle="rgba(23,20,77,.94)";ctx.fillRect(bx,by,bw,bh);ctx.fillStyle=col;ctx.fillRect(bx,by,4,bh);ctx.fillStyle="#fff";lines.forEach((l,i)=>ctx.fillText(l,bx+12,by+8+i*17));}
  function tick(){if(!meta||video.paused){lastT=video?video.currentTime:0;return;}const t=video.currentTime;if(pauseOn&&mode==="done"){const i=comments.findIndex((c,k)=>k!==lastPause&&c.t>lastT-.001&&c.t<=t+.02);if(i>=0){lastPause=i;video.pause();video.currentTime=comments[i].t;markActive(i);}}lastT=t;}
  /* ---------- dragging joints ---------- */
  function hit(e){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*AW,y=(e.clientY-r.top)/r.height*AH,k=frameAt(video.currentTime),o=mode==="mark"?(anchors[k]||P&&P[k]):P&&P[k];if(!o)return null;let best=null,bd=22*AW/r.width;
    joints().forEach(j=>{if(!o[j])return;const d=Math.hypot(o[j][0]-x,o[j][1]-y);if(d<bd){bd=d;best=j;}});return best?{j:best,k}:null;}
  function bindDrag(){canvas.addEventListener("pointerdown",e=>{if(toolPoint(e)){e.preventDefault();return;}if(mode!=="mark"&&mode!=="done")return;const h=hit(e);if(!h)return;e.preventDefault();video.pause();const k=h.k;if(!anchors[k])anchors[k]=JSON.parse(JSON.stringify((P&&P[k])||anchors[k]));drag={j:h.j,k};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener("pointermove",e=>{if(!drag){if(mode==="mark"||mode==="done")canvas.style.cursor=hit(e)?"grab":"default";return;}const r=canvas.getBoundingClientRect();anchors[drag.k][drag.j]=[Math.max(0,Math.min(AW,(e.clientX-r.left)/r.width*AW)),Math.max(0,Math.min(AH,(e.clientY-r.top)/r.height*AH))];if(P)P[drag.k]=anchors[drag.k];if(mode==="done"){dirty=true;$("#fRetrack",root).hidden=false;}});
    const end=()=>{drag=null;};canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);}
  /* ---------- flow ---------- */
  function setStatus(t){$("#fStatus",root).textContent=t||"";}
  function setStep(n){root.querySelectorAll(".fstep").forEach((el,i)=>{el.classList.toggle("on",i===n);el.classList.toggle("done",i<n);});}
  /* ---------- automatic joints (MediaPipe pose model, runs in this browser; the video never leaves the device) ---------- */
  /* the same self-hosted model as the automatic analysis (film-pose.js), used here only to place the first dots */
  function landmarker(){return VB.filmPose.loadImage("full");}
  function toJoints(L){const pt=i=>L[i]&&(L[i].visibility==null||L[i].visibility>.35)?[L[i].x*AW,L[i].y*AH]:null,o={};
    if(view==="front"){const m={head:0,l_shoulder:11,r_shoulder:12,l_hip:23,r_hip:24,l_knee:25,r_knee:26,l_ankle:27,r_ankle:28};for(const j in m)o[j]=pt(m[j]);
      if(o.head){const e=pt(7)||pt(8);if(e)o.head=[o.head[0],Math.min(o.head[1],e[1])-.25*Math.abs(o.head[1]-(o.l_shoulder||o.head)[1])];}}
    else{// the side nearer the camera: the one the model sees better
      const vis=i=>L[i]?L[i].visibility||0:0,l=vis(11)+vis(13)+vis(23)+vis(25),r=vis(12)+vis(14)+vis(24)+vis(26),b=l>=r?0:1;
      const m={shoulder:11+b,elbow:13+b,wrist:15+b,hip:23+b,knee:25+b,ankle:27+b,toe:31+b};for(const j in m)o[j]=pt(m[j]);
      const ear=pt(7+b)||pt(0);if(ear&&o.shoulder){const d=o.shoulder[1]-ear[1];o.head=[ear[0],ear[1]-.35*d];}
      if(o.toe&&o.ankle)facing=o.toe[0]>=o.ankle[0]?1:-1;}
    const need=joints().filter(j=>!o[j]);return need.length?null:o;}
  async function autoPose(k0){try{const lm=await Promise.race([landmarker(),new Promise((_,rej)=>setTimeout(()=>rej(new Error("slow")),20000))]);
      const cv=document.createElement("canvas");cv.width=AW;cv.height=AH;const g=cv.getContext("2d");const t0=video.currentTime;
      const ks=[k0,...[.15,.4,.65,.9].map(f=>Math.round(f*(F.length-1)))].filter((v,i,a)=>a.indexOf(v)===i);let n=0;
      for(const k of ks){await seekTo(F[k].t);g.drawImage(video,0,0,AW,AH);const r=lm.detect(cv),L=r&&r.landmarks&&r.landmarks[0];if(!L)continue;const o=toJoints(L);if(o){anchors[k]=o;n++;}}
      await seekTo(t0);if(!anchors[k0]||!n){if(n)return n;return 0;}return n;}catch(e){return 0;}}
  function seekTo(t){return new Promise(r=>{if(Math.abs(video.currentTime-t)<1e-3)return r();const f=()=>{video.removeEventListener("seeked",f);r();};video.addEventListener("seeked",f);video.currentTime=t;setTimeout(f,1500);});}
  async function startMark(){if(busy||!meta)return;busy=true;video.pause();$("#fError",root).hidden=true;try{setStatus("Reading the clip");await sample(p=>setStatus("Reading the clip, "+R(p*100)+"%"));
      facing=1;const k=frameAt(video.currentTime);anchors={};anchors[k]=estimate();P=null;res=null;
      // automatic joint placement: an on-device pose model places the dots on this frame and a few others; the dots
      // stay draggable, and if the model can't load (offline, old browser) you place them by hand as before
      setStatus("Finding your joints automatically");const auto=await autoPose(k);
      mode="mark";canvas.style.pointerEvents="auto";setStep(1);setStatus(auto?"Dots placed automatically on "+auto+" frames. Check them and drag any that are off.":"");renderMarkUI();
      const note=$("#fMark b",root);if(note)note.textContent=auto?"Check the dots.":"Drag each dot onto your body.";
    }catch(e){err("This clip could not be read. Try recording it again as an MP4.");}finally{busy=false;}}
  function renderMarkUI(){const box=$("#fMark",root);box.hidden=mode!=="mark";$("#fRun",root).hidden=mode!=="mark";}
  /* every frame needs every joint for the analysis: hold the nearest known position where the model lost one */
  function complete(pts){const J=joints(),out=pts.map(o=>Object.assign({},o));for(const j of J){let seen=false;for(let i=0;i<out.length;i++){if(out[i][j]){seen=true;continue;}}if(!seen)return null;
      let last=null;for(let i=0;i<out.length;i++){if(out[i][j])last=out[i][j];else if(last)out[i][j]=last.slice();}last=null;for(let i=out.length-1;i>=0;i--){if(out[i][j])last=out[i][j];else if(last)out[i][j]=last.slice();}}return out;}
  /* a dragged dot moves that joint on its own frame and blends the fix into nearby frames */
  function applyEdits(){P=P0.map(o=>{const c={};for(const k in o)c[k]=o[k].slice();return c;});const W=Math.max(2,R(fps*.15));
    Object.keys(anchors).map(Number).forEach(k=>{const A=anchors[k];joints().forEach(j=>{if(!A[j]||!P0[k][j])return;const dx=A[j][0]-P0[k][j][0],dy=A[j][1]-P0[k][j][1];if(Math.hypot(dx,dy)<.5)return;
      for(let i=Math.max(0,k-W);i<=Math.min(P.length-1,k+W);i++){const w=i===k?1:Math.cos(Math.PI/2*Math.abs(i-k)/(W+1))**2;P[i][j]=[P[i][j][0]+dx*w,P[i][j][1]+dy*w];}});});}
  async function autoRun(){if(busy||!meta)return;busy=true;video.pause();$("#fError",root).hidden=true;$("#fAnalyse",root).hidden=true;$("#fGo",root).hidden=true;setStep(1);
    try{setStatus("Loading the body tracker (first time only, about 10 MB)");const sc=640/Math.max(meta.w,meta.h);AW=R(meta.w*sc);AH=R(meta.h*sc);
      await VB.filmPose.load(modelKind);if(!nativeFps){setStatus("Reading the frame rate");nativeFps=await VB.filmPose.fps(video);}
      const len=clip[1]-clip[0],target=Math.min(nativeFps,len<=2.5?120:60);
      const r=await VB.filmPose.track(video,{t0:clip[0],t1:clip[1],fps:target,maxFrames:300,AW,AH,view,kind:modelKind},p=>setStatus("Tracking your body, "+R(p*100)+"%"));
      const full=r.pts&&complete(r.pts);
      if(!full){err("No person was found clearly enough in this clip. Film with your whole body in frame and good light, or place the dots by hand.");$("#fGo",root).hidden=false;$("#fAnalyse",root).hidden=false;setStep(0);return;}
      F=r.frames;fps=r.fps;feet=r.feet;poseConf=r.conf?r.conf.reduce((a,b)=>a+b,0)/r.conf.length:null;P=full;P0=full.map(o=>{const c={};for(const k in o)c[k]=o[k].slice();return c;});anchors={};poseMode=true;dense=null;bbox=null;
      if(view==="side"){const m=median(P.map(o=>o.toe&&o.ankle?o.toe[0]-o.ankle[0]:NaN));facing=m!=null&&m<0?-1:1;}
      setStatus("Scoring your form");await new Promise(r=>setTimeout(r,10));await finish();
      if(poseConf!=null&&poseConf<.55)setStatus("The tracker was unsure in parts of this clip. Check the dots and drag any that are off, then press Re-analyse.");}
    catch(e){console.warn(e);poseMode=false;err("The automatic tracker could not start on this device. Place the dots by hand instead; it takes a minute.");$("#fGo",root).hidden=false;setStep(0);setStatus("");}
    finally{busy=false;}}
  async function finish(){res=analyse();mode="done";dirty=false;$("#fRetrack",root).hidden=true;canvas.style.pointerEvents="auto";setStep(2);makeComments();await thumbs();save();render();if(!/unsure/.test($("#fStatus",root).textContent))setStatus("");renderMarkUI();}
  async function run(){if(busy)return;busy=true;try{setStatus(poseMode?"Applying your fixes":"Following your joints through the clip");await new Promise(r=>setTimeout(r,30));if(poseMode)applyEdits();else trackAll();setStatus("Scoring your form");await new Promise(r=>setTimeout(r,10));
      res=analyse();mode="done";dirty=false;$("#fRetrack",root).hidden=true;canvas.style.pointerEvents="auto";setStep(2);makeComments();await thumbs();save();render();setStatus("");renderMarkUI();}
    catch(e){console.error(e);err("The analysis could not finish. Check that the dots sit on your joints, then try again.");}finally{busy=false;}}
  function err(t){const el=$("#fError",root);el.hidden=false;el.textContent=t;setStatus("");}
  function makeComments(){const mine=comments.filter(c=>c.kind==="me");const out=[];const J=view==="side";res.checks.forEach(c=>{const i=res.ph[c.phase];if(i==null)return;const t=F[i].t,good=c.score>=.85;
      const v=c.bool?"":(c.fmt?c.fmt(c.val):R(c.val))+(c.unit||"");const range=c.bool?"":` (ideal ${c.fmt?c.fmt(c.lo):c.lo}–${c.fmt?c.fmt(c.hi):c.hi}${c.unit||""})`;
      out.push({t,joint:J?c.joint:(c.joint||null),kind:good?"good":"fix",text:good?`${c.label}: ${v||"yes"}. Keep it.`:`${c.label}: ${v||"not yet"}${range}. ${c.cue}`});});
    comments=mine.concat(out).sort((a,b)=>a.t-b.t);lastPause=-1;}
  async function thumbs(){res.thumbs={};const cv=document.createElement("canvas"),W=160,Hh=R(160*meta.h/meta.w);cv.width=W;cv.height=Hh;const g=cv.getContext("2d");const keep=ctx,keepC=canvas;
    for(const k in res.ph){const i=res.ph[k];if(i==null)continue;await seek(F[i].t);g.drawImage(video,0,0,W,Hh);ctx=g;const tmp={clientWidth:W,clientHeight:Hh};drawSkelTo(g,P[i],W,Hh);const gh=ghost(i,k);if(gh){ctx=g;drawSkelTo(g,gh,W,Hh,"rgba(32,196,180,.95)",[5,4]);}res.thumbs[k]=cv.toDataURL("image/jpeg",.75);}
    ctx=keep;await seek(clip[0]);}
  function drawSkelTo(g,o,w,h,style,dash){if(!o)return;const sx=w/AW,sy=h/AH;g.save();g.lineCap="round";g.strokeStyle=style||"#fff";g.lineWidth=2;if(dash)g.setLineDash(dash);BONES[view].forEach(([a,b])=>{if(o[a]&&o[b]){g.beginPath();g.moveTo(o[a][0]*sx,o[a][1]*sy);g.lineTo(o[b][0]*sx,o[b][1]*sy);g.stroke();}});g.restore();}
  let lastTest=null;
  /* a compact copy of the tracked body (about 20 frames a second, side view) so a later clip can be compared with it */
  function packPose(){if(view!=="side"||!P||!F.length)return null;const len=F[F.length-1].t-F[0].t,step=Math.max(1,Math.round(fps/20)),idx=[];for(let i=0;i<F.length;i+=step)idx.push(i);
    const sc=1000/Math.max(AW,AH),ph={};for(const k in res.ph)if(res.ph[k]!=null)ph[k]=Math.round((F[res.ph[k]].t-F[0].t)*1000)/1000;
    return {v:1,dt:Math.round(step/fps*10000)/10000,len:Math.round(len*1000)/1000,ar:Math.round(AW/AH*1000)/1000,facing:res.facing,body:Math.round(res.bodyPx*sc),ph,
      f:idx.map(i=>SIDE.map(j=>P[i]&&P[i][j]?[R(P[i][j][0]*sc),R(P[i][j][1]*sc)]:null))};}
  function save(){const Sx=S();let keepClip=false,id=VB.uid();
    if(recId){const i=Sx.film.findIndex(r=>r.id===recId&&!r.notesOnly);if(i>=0){keepClip=!!Sx.film[i].clip;id=recId;Sx.film.splice(i,1);}}
    if(lastTest){const k=Sx.tests.indexOf(lastTest);if(k>=0)Sx.tests.splice(k,1);lastTest=null;}
    const rec={id,date:VB.today(),move,view,quality:res.auto?"auto":"ok",clip:keepClip||undefined,pose:res.auto?packPose():undefined,approach:res.approach||undefined,handSpeed:res.handSpeed||undefined,score:res.score,metrics:res.checks.map(c=>({label:c.label,value:c.bool?(c.val?"Yes":"No"):(c.fmt?c.fmt(c.val):R(c.val)),unit:c.unit||"",ok:c.score>=.85})),
      faults:res.checks.filter(c=>c.fault&&c.score<.85).map(c=>({id:c.fault,sev:Math.round((1-c.score)*100)/100,src:"measured",evidence:c.label})),jump:res.jumpSure?res.jumpFlight:null,comments:comments.map(c=>({t:Math.round((c.t-clip[0])*100)/100,kind:c.kind,text:c.text}))};
    const seen={};rec.faults=rec.faults.filter(f=>{if(seen[f.id])return false;seen[f.id]=1;return true;});recId=rec.id;VB.recordFilm(rec);Sx.film.forEach((r,i)=>{if(i>=12&&r.pose)delete r.pose;});
    if(move==="jump"&&res.jumpSure&&res.jumpFlight&&VB.addTest(res.jumpFlight,"film"))lastTest=Sx.tests[Sx.tests.length-1];VB.save();VB.ui&&VB.ui.refresh&&VB.ui.refresh("film");}
  /* ---------- results ---------- */
  function grade(s){return s>=90?"Elite form":s>=75?"Solid form":s>=55?"Building":"Needs work";}
  function bar(c){if(c.bool)return `<span class="pill ${c.score>=.85?"ok":"hot"}">${c.val?"Yes":"Not yet"}</span>`;const lo=Math.min(c.lo,c.val),hi=Math.max(c.hi,c.val),pad=(hi-lo)*.25||1,a=lo-pad,b=hi+pad,pc=v=>((v-a)/(b-a)*100).toFixed(1);
    return `<div class="rbar" aria-hidden="true"><i class="band" style="left:${pc(c.lo)}%;width:${(pc(c.hi)-pc(c.lo)).toFixed(1)}%"></i><i class="you ${c.score>=.85?"ok":c.score>=.5?"mid":"bad"}" style="left:${pc(c.val)}%"></i></div>`;}
  function render(){const out=$("#fResults",root);renderComments();if(!res){out.innerHTML="";return;}const C=res.checks,fixes=C.filter(c=>c.score<.85).sort((a,b)=>a.score-b.score);
    const phases=Object.keys(res.ph).filter(k=>res.ph[k]!=null).sort((a,b)=>res.ph[a]-res.ph[b]);
    $("#fStrip",root).innerHTML=phases.map(k=>`<button type="button" class="thumb" data-seek="${F[res.ph[k]].t}" aria-label="Go to ${PH[k]||k}">${res.thumbs&&res.thumbs[k]?`<img src="${res.thumbs[k]}" alt="">`:""}<span>${PH[k]||k} · ${(F[res.ph[k]].t-clip[0]).toFixed(2)} s</span></button>`).join("");
    const fv=c=>c.bool?(c.val?"Yes":"No"):(c.fmt?c.fmt(c.val):R(c.val))+(c.unit||""),fr=c=>c.bool?"":(c.fmt?c.fmt(c.lo):c.lo)+"–"+(c.fmt?c.fmt(c.hi):c.hi)+(c.unit||"");
    out.innerHTML=`<div class="card fscore"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="kicker">Form score · ${esc(VB.MOVES[move].name)} · ${view} view</div><div class="bignum"><i data-count="${res.score||0}">${res.score!=null?res.score:"–"}</i><small>/100</small></div><b class="gradeline">${res.score!=null?grade(res.score):"Not enough data"}</b></div>
       ${res.jumpNote?`<p class="note" style="flex-basis:100%">${esc(res.jumpNote)}</p>`:""}<div class="fmetrics">${res.jumpFlight?`<div class="metric good"><b>${VB.lenOut(res.jumpFlight)} ${VB.lu()}</b><span>Jump height, from air time</span><span class="small muted">${(res.flight*1000).toFixed(0)} ms in the air</span></div>`:""}${res.hipRise?`<div class="metric"><b>${VB.lenOut(res.hipRise)} ${VB.lu()}</b><span>Hip rise, take-off to peak</span></div>`:""}${res.approach?`<div class="metric"><b>${res.approach} m/s</b><span>Approach speed into take-off</span></div>`:""}${res.handSpeed?`<div class="metric"><b>${res.handSpeed} m/s</b><span>Peak hand speed at contact</span><span class="small muted">${R(res.handSpeed*3.6)} km/h</span></div>`:""}<div class="metric"><b>${C.filter(c=>c.score>=.85).length}/${C.length}</b><span>Checkpoints on target</span></div></div>
       ${res.auto?`<p class="small muted" style="flex-basis:100%">Tracked automatically on ${F.length} frames (${R(fps)} per second${res.slowmo>1?", slow motion ×"+res.slowmo:""})${poseConf!=null?`, tracking confidence ${R(poseConf*100)}%`:""}.${res.tTO!=null?` Take-off at ${(res.tTO-clip[0]).toFixed(3)} s, landing at ${(res.tLand-clip[0]).toFixed(3)} s.`:""}</p>`:""}</div>
       ${(()=>{const q=quality();return q.length?`<ul class="fquality">${q.map(([k,t])=>`<li class="${k}"><i aria-hidden="true">${k==="ok"?"✓":k==="info"?"i":"!"}</i>${esc(t)}</li>`).join("")}</ul>`:"";})()}
       <label class="small row" style="gap:6px"><input type="checkbox" id="fGhost" ${ghostOn?"checked":""}> Show the ideal-form outline at each key moment</label>
       ${(()=>{const o=view==="side"?cmpOptions():[];return o.length?`<label class="small row" style="gap:6px">Compare with<select id="fCmp" class="btn sm"><option value="">No earlier clip</option>${o.slice(0,10).map(r=>`<option value="${esc(r.id)}" ${cmp&&cmp.id===r.id?"selected":""}>${VB.shortDate(r.date)} · ${r.score!=null?r.score+"/100":""}${r.jump?" · "+VB.lenOut(r.jump)+" "+VB.lu():""}</option>`).join("")}</select></label>${cmp?`<p class="small muted">The purple outline is your ${VB.shortDate(cmp.date)} clip, lined up at the same moment and scaled to your size. Then: ${cmp.score!=null?cmp.score+"/100":"–"}${cmp.jump?", "+VB.lenOut(cmp.jump)+" "+VB.lu():""}. Now: ${res.score!=null?res.score+"/100":"–"}${res.jumpSure&&res.jumpFlight?", "+VB.lenOut(res.jumpFlight)+" "+VB.lu():""}.</p>`:""}`:"";})()}
       <div class="row"><button type="button" class="btn sm" id="fExport">Download video with feedback</button><span class="small muted">Half speed, with the skeleton, angles and comments, to send to a coach.</span></div>
       <p class="small muted">${SRC} Angles are measured in the picture, so a side-on, hip-height camera gives the truest numbers.</p></div>
     <div class="card"><div class="kicker">${fixes.length?"Fix first":"Every checkpoint on target"}</div>
       ${C.map(c=>`<div class="chk ${c.score>=.85?"ok":c.score>=.5?"mid":"bad"}"><div class="row" style="justify-content:space-between"><b>${esc(c.label)}</b><span class="pill">${esc(PH[c.phase]||c.phase)}</span></div>
         <div class="row small" style="justify-content:space-between"><span>Yours <b>${fv(c)}</b></span>${c.bool?"":`<span class="muted">Ideal ${fr(c)}</span>`}</div>${bar(c)}${c.score<.85?`<p class="small">${esc(c.cue)}</p>`:""}</div>`).join("")||`<p class="muted small">No checkpoints could be measured. Make sure the dots follow your joints.</p>`}
     </div>
     ${fixes.length?`<div class="card"><div class="kicker">Corrective work, added to your plan</div>${[...new Set(fixes.map(c=>c.fault).filter(Boolean))].slice(0,3).map(id=>{const f=VB.FAULTS[id],cr=VB.correctives(id);return `<div class="fault"><b>${esc(f.name)}</b><p class="small">${esc(f.fix)}</p>${cr.drills.length?`<div class="small"><span class="grp">Drills</span> ${cr.drills.map(d=>`<button type="button" class="linkbtn" data-drill="${d.id}">${esc(d.name)}</button>`).join(" · ")}</div>`:""}${cr.exs.length?`<div class="small"><span class="grp">Exercises</span> ${cr.exs.map(x=>esc(x.name)).join(" · ")}</div>`:""}</div>`;}).join("")}
       <p class="note small">Each session now opens with a Fix block for these until a new clip of this movement comes back on target.</p></div>`:""}`;
    VB.ui&&VB.ui.countUp&&VB.ui.countUp(out);hist();}
  function markActive(i){root.querySelectorAll("#fComments .cmt").forEach((el,k)=>el.classList.toggle("on",k===i));}
  function renderComments(){const box=$("#fComments",root),bar=$("#fMarks",root);if(!box)return;const len=Math.max(.01,clip[1]-clip[0]);
    bar.innerHTML=comments.map((c,i)=>`<button type="button" class="mark ${c.kind}" style="left:${Math.max(0,Math.min(100,(c.t-clip[0])/len*100))}%" data-cmt="${i}" aria-label="Comment at ${(c.t-clip[0]).toFixed(2)} seconds"></button>`).join("");
    box.innerHTML=comments.length?comments.map((c,i)=>`<div class="cmt ${c.kind}"><button type="button" class="pill" data-cmt="${i}">${(c.t-clip[0]).toFixed(2)} s</button><div><span class="grp">${c.kind==="me"?"Your note":c.kind==="good"?"Keep":"Fix"}</span><p class="small">${esc(c.text)}</p></div>${c.kind==="me"?`<button type="button" class="linkbtn small" data-delc="${i}">Remove</button>`:""}</div>`).join(""):`<p class="small muted">Feedback is pinned here after the analysis. You can also pause anywhere and add your own note.</p>`;}
  function saveNotes(){const Sx=S(),list=comments.map(c=>({t:Math.round((c.t-clip[0])*100)/100,kind:c.kind,text:c.text}));let rec=Sx.film.find(r=>r.id===recId);if(!rec){rec={id:VB.uid(),date:VB.today(),move,view,quality:"notes",metrics:[],faults:[],jump:null,comments:list,notesOnly:true};recId=rec.id;Sx.film.unshift(rec);}else rec.comments=list;VB.save();hist();}
  /* ---------- shell ---------- */
  function shell(){root.innerHTML=`
   <div class="cols">
    <div class="stack">
      <div class="card"><div class="kicker">1 · What are you filming?</div>
        <div class="chips" id="fMoves">${Object.entries(VB.MOVES).map(([k,m])=>`<button type="button" class="chip" data-move="${k}" aria-pressed="${k===move}">${m.name}</button>`).join("")}</div>
        <div class="row" id="fViewRow"></div><p class="small muted" id="fTip"></p></div>
      <div class="card"><div class="kicker">2 · Record or choose a clip</div>
        <div class="row"><label class="btn primary filebtn">Record with camera<input type="file" id="fCam" accept="video/*" capture="environment"></label><label class="btn filebtn">Choose a video<input type="file" id="fFile" accept="video/*"></label></div>
        <ul class="plain small muted"><li>Prop the phone still at hip height, 4 to 6 metres away, side-on unless the tip says front.</li><li>One repetition, under 6 seconds, whole body and the floor in frame, good light. 60 fps or slow motion gives the most precise jump height.</li><li>On a phone, Record with camera opens your camera straight away.</li></ul>
        <p class="small muted">Nothing leaves this device. A body tracker runs inside your browser to find your joints on every frame; the video is never uploaded.</p></div>
      <div class="card" id="fStageCard" hidden>
        <ol class="fsteps"><li class="fstep on">Trim</li><li class="fstep">Analyse</li><li class="fstep">Feedback</li></ol>
        <div class="vwrap" id="fWrap"><video id="fVideo" playsinline muted preload="auto"></video><canvas id="fCanvas"></canvas></div>
        <div class="marks" id="fMarks"></div><input type="range" id="fScrub" min="0" max="1000" value="0" aria-label="Scrub through the video">
        <div class="fgraph" hidden><div class="row" style="justify-content:space-between;gap:8px"><span class="seg sm" role="group" aria-label="Angles to show">${SER.map(([k,l,c])=>`<button type="button" data-gser="${k}" aria-pressed="${!!gShow[k]}" style="--c:${c}"><i class="gdot"></i>${l}</button>`).join("")}</span><span class="small num" id="fGraphNow" aria-live="off"></span></div>
          <canvas id="fGraph" aria-label="Joint angles through the clip. Click to jump to that moment."></canvas></div>
        <div class="row"><button type="button" class="btn sm" id="fPlay">Play</button><button type="button" class="btn sm" id="fBack" aria-label="Back one frame">◀ Frame</button><button type="button" class="btn sm" id="fFwd" aria-label="Forward one frame">Frame ▶</button>
          <select id="fSpeed" class="btn sm" aria-label="Playback speed"><option value="1">1×</option><option value="0.5">0.5×</option><option value="0.25" selected>0.25×</option></select><button type="button" class="btn sm" id="fMeasure" aria-pressed="false">Measure</button><span class="stat" id="fTime">0.00 s</span></div>
        <p class="small muted" id="fToolHint" hidden>Pause on a frame, then tap two points for a distance (after an analysis) and a third for the angle at the middle point. Tap again to start over. Esc or Measure to stop.</p>
        <div class="row"><label class="small row" style="gap:6px">Filmed in<select id="fSlow" class="btn sm" aria-describedby="fSlowHelp"><option value="1">Normal speed</option><option value="2">Slow motion ×2</option><option value="4">Slow motion ×4</option><option value="8">Slow motion ×8</option></select></label><span class="small muted" id="fSlowHelp">Pick slow motion if the clip plays slower than real life (for example 240 fps played back at 30), so jump height and speeds come out right.</span></div>
        <div class="row"><button type="button" class="btn sm" id="fIn">Start clip here</button><button type="button" class="btn sm" id="fOut">End clip here</button><span class="small muted" id="fClip"></span></div>
        <div class="note small" id="fMark" hidden><b>Drag each dot onto your body.</b> Use a frame where you are clearly visible. Head, shoulder, elbow, wrist, hip, knee, ankle and toe, on the side nearest the camera. <div class="row" style="margin-top:8px"><button type="button" class="btn sm" id="fFlip">Flip facing</button><button type="button" class="btn sm" id="fReset">Reset dots</button></div></div>
        <div class="row"><button type="button" class="btn primary" id="fAnalyse">Analyse my movement</button><button type="button" class="btn sm" id="fGo">Place dots by hand</button><button type="button" class="btn primary" id="fRun" hidden>Track and give feedback</button><button type="button" class="btn sm" id="fRetrack" hidden>Re-analyse with my fixes</button><span class="small" id="fStatus" role="status" aria-live="polite"></span></div>
        <p class="err" id="fError" role="alert" hidden></p>
        <div id="fStrip" class="strip"></div>
        <div class="cbox"><div class="row" style="justify-content:space-between"><div class="kicker">Comments on this clip</div><label class="small muted row" style="gap:6px"><input type="checkbox" id="fPauseOn" checked> Pause at each comment</label></div>
          <div id="fComments"></div>
          <div class="row"><input class="in" id="fNote" maxlength="160" placeholder="Pause, then type your own note for this moment" style="flex:1;min-width:180px" aria-label="Your note"><button type="button" class="btn sm" id="fAddNote">Add at this moment</button></div></div>
        <div class="legend"><span><i style="background:#fff"></i>You</span><span><i style="background:#20c4b4"></i>Ideal form</span><span><i style="background:#5b2bff"></i>Hip path</span><span><i style="background:#ec3b52"></i>Hand path</span></div>
      </div>
    </div>
    <div class="stack">
      <div id="fResults" class="stack"></div>
      <details class="card" id="fAir" hidden><summary class="kicker">Check the air time by hand</summary><p class="small muted">The analysis times your flight automatically. To check it, step frame by frame (arrow keys work) and mark the last frame your toes touch and the first frame they land.</p>
        <div class="row"><button type="button" class="btn sm" id="fOff">Mark take-off</button><button type="button" class="btn sm" id="fOn">Mark landing</button></div><div id="fAirOut" class="small"></div></details>
      <div class="card"><div class="kicker">Film history</div><div id="fHist"></div></div>
    </div>
   </div>`;
    video=$("#fVideo",root);canvas=$("#fCanvas",root);ctx=canvas.getContext("2d");canvas.style.pointerEvents="none";bindDrag();
    root.addEventListener("click",onClick);
    ["fCam","fFile"].forEach(id=>$("#"+id,root).addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)load(f);e.target.value="";}));
    $("#fSpeed",root).addEventListener("change",e=>{video.playbackRate=+e.target.value;});
    $("#fPauseOn",root).addEventListener("change",e=>{pauseOn=e.target.checked;});
    $("#fSlow",root).addEventListener("change",async e=>{slowmo=+e.target.value||1;if(mode==="done"&&res&&!busy){busy=true;try{await finish();}finally{busy=false;}}});
    $("#fNote",root).addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("#fAddNote",root).click();}});
    root.addEventListener("change",e=>{if(e.target.id==="fGhost")ghostOn=e.target.checked;if(e.target.id==="fCmp"){cmp=S().film.find(r=>r.id===e.target.value)||null;render();}});
    $("#fGraph",root).addEventListener("click",e=>{if(!P||!F.length)return;const r=e.currentTarget.getBoundingClientRect(),u=Math.max(0,Math.min(1,(e.clientX-r.left-28)/(r.width-36)));video.pause();video.currentTime=F[Math.round(u*(F.length-1))].t;});
    $("#fScrub",root).addEventListener("input",e=>{if(meta){video.pause();video.currentTime=clip[0]+(clip[1]-clip[0])*e.target.value/1000;}});
    video.addEventListener("timeupdate",()=>{if(!meta)return;if(video.currentTime>=clip[1]-.01&&!video.paused){video.pause();video.currentTime=clip[0];}$("#fTime",root).textContent=(video.currentTime-clip[0]).toFixed(2)+" s";$("#fScrub",root).value=R((video.currentTime-clip[0])/Math.max(.01,clip[1]-clip[0])*1000);});
    video.addEventListener("play",()=>{lastT=video.currentTime+.03;$("#fPlay",root).textContent="Pause";});video.addEventListener("pause",()=>$("#fPlay",root).textContent="Play");
    setMove(move);hist();}
  function setMove(m){move=m;if(!VIEWS[m].includes(view))view=VIEWS[m][0];root.querySelectorAll("[data-move]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.move===m));
    $("#fViewRow",root).innerHTML=VIEWS[m].length>1?`<span class="small muted">Camera</span><span class="seg">${VIEWS[m].map(v=>`<button type="button" data-view="${v}" aria-pressed="${v===view}">${v==="side"?"Side-on":"Front-on"}</button>`).join("")}</span><span class="small muted">${view==="front"?"Front-on checks knee tracking and balance.":"Side-on checks depth, extension, arm swing and jump height."}</span>`:"";
    $("#fTip",root).textContent="How to film it: "+VB.MOVES[m].tip;$("#fAir",root).hidden=!(meta&&VB.MOVES[m].airborne);}
  function resetAnalysis(){cmp=null;tool=null;tpts=[];gCache=null;F=[];P=null;P0=null;feet=null;poseMode=false;poseConf=null;anchors={};res=null;mode="idle";const ab=$("#fAnalyse",root),gb=$("#fGo",root);if(ab)ab.hidden=false;if(gb)gb.hidden=false;dirty=false;canvas.style.pointerEvents="none";comments=comments.filter(c=>c.kind==="me");setStep(0);renderMarkUI();$("#fResults",root).innerHTML="";$("#fStrip",root).innerHTML="";$("#fRetrack",root).hidden=true;renderComments();}
  function load(file){curFile=file;nativeFps=0;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);dense=null;air={off:null,on:null};comments=[];recId=null;$("#fError",root).hidden=true;
    video.src=url;video.onloadedmetadata=()=>{meta={w:video.videoWidth||640,h:video.videoHeight||360,d:isFinite(video.duration)?video.duration:10};clip=[0,meta.d];resetAnalysis();
      $("#fWrap",root).style.setProperty("--ar",meta.w/meta.h);$("#fStageCard",root).hidden=false;video.playbackRate=+$("#fSpeed",root).value;video.currentTime=.01;clipLabel();setMove(move);airOut();
      $("#fStageCard",root).scrollIntoView({behavior:VB.reduced?"auto":"smooth",block:"nearest"});};
    video.onerror=()=>{$("#fStageCard",root).hidden=false;err("This video format could not be opened here. Try recording again, or export the clip as MP4.");};}
  function clipLabel(){const len=clip[1]-clip[0];$("#fClip",root).textContent="Clip: "+len.toFixed(1)+" s"+(len>6?". Trim to the one repetition for sharper results.":"");}
  function airOut(){const el=$("#fAirOut",root);if(air.off==null&&air.on==null){el.innerHTML="";return;}
    if(air.off!=null&&air.on!=null&&air.on>air.off&&air.on-air.off>1.0){el.innerHTML=`<p class="note">That is more than one second in the air, which no one can do. Mark the last frame with your toes on the floor, then the first frame they touch again.</p>`;}
    else if(air.off!=null&&air.on!=null&&air.on>air.off){const t=air.on-air.off,h=122.6*t*t;el.innerHTML=`<div class="rec"><b class="num">${VB.lenOut(h)} ${VB.lu()}</b><span>Air time ${t.toFixed(3)} s</span></div><div class="row" style="margin-top:8px"><button type="button" class="btn sm primary" id="fSaveAir" data-cm="${h.toFixed(1)}">Save as my vertical</button></div>`;}
    else el.textContent=(air.off!=null?"Take-off at "+(air.off-clip[0]).toFixed(2)+" s. ":"")+(air.on!=null?"Landing at "+(air.on-clip[0]).toFixed(2)+" s. ":"")+(air.off!=null&&air.on!=null?"Landing must be after take-off.":"Now mark the other one.");}
  function onClick(e){const b=e.target.closest("button");if(!b)return;
    if(b.dataset.move){setMove(b.dataset.move);if(mode!=="idle")resetAnalysis();return;}
    if(b.dataset.view){view=b.dataset.view;setMove(move);if(mode!=="idle")resetAnalysis();return;}
    if(b.dataset.seek){video.pause();video.currentTime=+b.dataset.seek;return;}
    if(b.dataset.cmt!=null){const i=+b.dataset.cmt;video.pause();video.currentTime=comments[i].t;lastPause=i;markActive(i);return;}
    if(b.dataset.delc!=null){comments.splice(+b.dataset.delc,1);renderComments();saveNotes();return;}
    if(b.dataset.drill){VB.ui.openDrill(b.dataset.drill);return;}
    if(b.dataset.gser){gShow[b.dataset.gser]=!gShow[b.dataset.gser];b.setAttribute("aria-pressed",String(gShow[b.dataset.gser]));return;}
    if(b.id==="fMeasure"){if(meta)setTool("measure");return;}
    if(b.id==="fExport"){exportVideo(b);return;}
    switch(b.id){
      case "fPlay":if(video.paused){if(video.currentTime>=clip[1]-.05)video.currentTime=clip[0];video.play().catch(()=>{});}else video.pause();break;
      case "fBack":video.pause();video.currentTime=Math.max(clip[0],video.currentTime-1/(nativeFps||30));break;
      case "fFwd":video.pause();video.currentTime=Math.min(clip[1],video.currentTime+1/(nativeFps||30));break;
      case "fAnalyse":autoRun();break;
      case "fIn":if(video.currentTime<clip[1]-.3){clip[0]=video.currentTime;clipLabel();if(mode!=="idle")resetAnalysis();}break;
      case "fOut":if(video.currentTime>clip[0]+.3){clip[1]=video.currentTime;clipLabel();if(mode!=="idle")resetAnalysis();}break;
      case "fGo":startMark();break;
      case "fRun":run();break;
      case "fRetrack":run();break;
      case "fFlip":{facing=-facing;const k=frameAt(video.currentTime);anchors={};anchors[k]=estimate();break;}
      case "fReset":{const k=frameAt(video.currentTime);anchors={};anchors[k]=estimate();break;}
      case "fOff":air.off=video.currentTime;airOut();break;
      case "fOn":air.on=video.currentTime;airOut();break;
      case "fSaveAir":VB.addTest(+b.dataset.cm,"film-airtime");VB.log("Vertical from air time saved: "+VB.lenOut(+b.dataset.cm)+" "+VB.lu()+".","info");VB.save();b.textContent="Saved";b.disabled=true;VB.ui.refresh("film");break;
      case "fAddNote":{const inp=$("#fNote",root),tx=inp.value.trim();if(!tx||!meta)break;video.pause();comments.push({t:video.currentTime,joint:null,kind:"me",text:tx.slice(0,160)});comments.sort((a,b)=>a.t-b.t);inp.value="";renderComments();saveNotes();break;}
    }
    if(b.id==="fGo"||b.id==="fRun"||b.id==="fRetrack"){$("#fGo",root).hidden=true;$("#fAnalyse",root).hidden=true;}}
  function hist(){const H=S().film,el=$("#fHist",root);if(!el)return;const CL=VB.clips&&VB.clips.supported;
    const clipCell=r=>!CL?"":r.clip?`<button type="button" class="btn sm" data-fplay="${esc(r.id)}">Watch</button> <button type="button" class="linkbtn small" data-fdel="${esc(r.id)}">Delete clip</button>`:(r.id===recId&&curFile?`<button type="button" class="btn sm" data-fkeep="${esc(r.id)}">Keep clip</button>`:`<span class="small muted">–</span>`);
    el.innerHTML=H.length?`<div class="tablewrap"><table><thead><tr><th>Date</th><th>Movement</th><th class="r">Score</th><th class="r">Jump</th><th>Faults</th>${CL?"<th>Clip</th>":""}</tr></thead><tbody>${H.slice(0,12).map(r=>`<tr><td>${VB.shortDate(r.date)}</td><td>${VB.MOVES[r.move]?VB.MOVES[r.move].name:esc(r.move)}</td><td class="r num">${r.score!=null?r.score:"–"}</td><td class="r num">${r.jump?VB.lenOut(r.jump)+" "+VB.lu():"–"}</td><td style="white-space:normal">${r.faults&&r.faults.length?r.faults.map(f=>VB.FAULTS[f.id]?VB.FAULTS[f.id].name:esc(f.id)).join(", "):(r.notesOnly?"Notes only":"On target")}</td>${CL?`<td>${clipCell(r)}</td>`:""}</tr>`).join("")}</tbody></table></div>${CL?`<p class="small muted" id="fStore">Clips you keep stay on this device only, never in the cloud.</p>`:""}`:`<p class="small muted">Analysed clips are listed here with their score and what was found, so you can watch faults disappear. Videos stay on your device, and only if you tap Keep clip.</p>`;
    if(CL&&H.length)VB.clips.usage().then(u=>{const e=$("#fStore",root);if(e&&u.n)e.textContent=`${u.n} clip${u.n===1?"":"s"} kept on this device${u.used!=null?" · "+Math.round(u.used/1048576)+" MB used":""}. They never leave this device.`;});}
  const esc=VB.esc;
  {document.addEventListener("click",async e=>{const b=e.target.closest("[data-fkeep],[data-fplay],[data-fdel]");if(!b||!root||!root.contains(b))return;const id=b.dataset.fkeep||b.dataset.fplay||b.dataset.fdel,rec=S().film.find(r=>r.id===id);if(!rec)return;
    try{if(b.dataset.fkeep){if(!curFile)return;b.disabled=true;await VB.clips.put(id,curFile);rec.clip=true;VB.save();VB.ui.toast("Clip kept on this device.");}
      else if(b.dataset.fplay){const blob=await VB.clips.get(id);if(!blob){rec.clip=false;VB.save();VB.ui.toast("That clip is no longer on this device.");}else{if(VB.MOVES[rec.move])move=rec.move;load(blob);const v=$("#fVideo",root);v&&v.scrollIntoView({behavior:"smooth",block:"center"});}}
      else if(b.dataset.fdel){await VB.clips.del(id);rec.clip=false;VB.save();VB.ui.toast("Clip deleted.");}}
    catch(err){VB.ui.toast(err&&err.message&&/Up to/.test(err.message)?err.message:"This device could not store the clip. It may be out of space.");}
    hist();});}
  /* ================= extra tools: quality, angle graph, compare, measure, export ================= */
  const SER=[["knee","Knee","#ec3b52",o=>ang(o.hip,o.knee,o.ankle)],["hip","Hip","#5b2bff",o=>ang(o.shoulder,o.hip,o.knee)],["elbow","Elbow","#20a090",o=>ang(o.shoulder,o.elbow,o.wrist)]];
  let gShow={knee:true,hip:true,elbow:false},gCache=null,cmp=null,tool=null,tpts=[];
  /* what the clip itself does to accuracy, checked after every analysis */
  function quality(){const out=[];if(!res||!P)return out;const N=P.length,side=view==="side";
    const inFrame=P.filter(o=>o.head&&o.head[1]>AH*.01&&(side?o.toe:o.l_ankle)&&(side?o.toe[1]:Math.max(o.l_ankle[1],o.r_ankle[1]))<AH*.99).length/N;
    out.push(inFrame>=.9?["ok","Whole body in frame"]:["warn","Your head or feet leave the frame in "+R((1-inFrame)*100)+"% of the clip. Step back or tilt the phone so the floor and your head both show."]);
    const size=res.bodyPx/AH;out.push(size>=.28?["ok","You fill "+R(Math.min(1,size)*100)+"% of the frame height"]:["warn","You only fill "+R(size*100)+"% of the frame height. Move the phone closer for sharper joints."]);
    if(poseMode){const f=nativeFps||fps;out.push(f>=50||slowmo>1?["ok","Frame rate "+R(f*slowmo)+" per second"]:f>=28?["info","Filmed at "+R(f)+" fps. 60 fps or slow motion times your jump about twice as precisely."]:["warn","Only "+R(f)+" fps. Film at 30 fps or more."]);
      if(poseConf!=null)out.push(poseConf>=.7?["ok","Tracking confidence "+R(poseConf*100)+"%"]:["warn","Tracking confidence "+R(poseConf*100)+"%. Better light and a plain background help; check the dots."]);}
    return out;}
  /* joint angles through the clip, with the phases and a playhead; click to jump there */
  function graph(){const cv=$("#fGraph",root);if(!cv)return;const box=cv.parentElement;box.hidden=!(P&&mode==="done"&&view==="side");if(box.hidden)return;
    const w=cv.clientWidth,h=cv.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);if(!w)return;if(cv.width!==R(w*dpr)){cv.width=R(w*dpr);cv.height=R(h*dpr);}const g=cv.getContext("2d");g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
    if(!gCache||gCache.P!==P){gCache={P,v:SER.map(([k,,,f])=>P.map(o=>o?f(o):null))};}
    const css=getComputedStyle(document.documentElement),ink=css.getPropertyValue("--muted").trim()||"#888",line=css.getPropertyValue("--line").trim()||"#ccc";
    const pad=[28,8,8,16],X=i=>pad[0]+(w-pad[0]-pad[1])*i/Math.max(1,P.length-1),Y=a=>pad[2]+(h-pad[2]-pad[3])*(1-(a-30)/150);
    g.font="10px sans-serif";g.fillStyle=ink;g.strokeStyle=line;g.lineWidth=1;[60,90,120,150,180].forEach(a=>{g.beginPath();g.moveTo(pad[0],Y(a));g.lineTo(w-pad[1],Y(a));g.stroke();g.fillText(a+"°",2,Y(a)+3);});
    if(res){let lastX=-1e9;Object.keys(res.ph).filter(k=>res.ph[k]!=null).sort((a,b)=>res.ph[a]-res.ph[b]).forEach(k=>{const i=res.ph[k],x=X(i);g.strokeStyle="rgba(127,120,200,.5)";g.setLineDash([3,3]);g.beginPath();g.moveTo(x,pad[2]);g.lineTo(x,h-pad[3]);g.stroke();g.setLineDash([]);
      const lab=PH[k]||k,tw=g.measureText(lab).width;if(x+2>=lastX+6){g.fillStyle=ink;g.fillText(lab,Math.min(x+2,w-tw-2),h-4);lastX=x+2+tw;}});}
    SER.forEach(([k,,col],si)=>{if(!gShow[k])return;g.strokeStyle=col;g.lineWidth=2;g.beginPath();let on=false;gCache.v[si].forEach((a,i)=>{if(a==null)return;on?g.lineTo(X(i),Y(Math.max(30,Math.min(180,a)))):g.moveTo(X(i),Y(Math.max(30,Math.min(180,a))));on=true;});g.stroke();});
    const k=frameAt(video.currentTime);if(k>=0){g.strokeStyle="#17144d";g.lineWidth=2;g.beginPath();g.moveTo(X(k),pad[2]);g.lineTo(X(k),h-pad[3]);g.stroke();
      const lab=SER.filter(([kk])=>gShow[kk]).map(([kk,l],si)=>{const a=gCache.v[SER.findIndex(x=>x[0]===kk)][k];return a!=null?l+" "+R(a)+"°":"";}).filter(Boolean).join("  ");const ro=$("#fGraphNow",root);if(ro&&ro.textContent!==lab)ro.textContent=lab;}}
  /* an earlier analysis of the same movement, drawn as a purple outline lined up at the same moment */
  const CMPKEYS=["takeoff","contact","catch","load","dip","bottom"];
  function cmpOptions(){return S().film.filter(r=>r.pose&&r.move===move&&r.id!==recId&&r.view===view);}
  function compareGhost(w,h,t){if(!cmp||!res||!P||view!=="side")return;const pose=cmp.pose,key=CMPKEYS.find(k=>res.ph[k]!=null&&pose.ph[k]!=null);if(!key)return;
    const iCur=res.ph[key],tCur=F[iCur].t,tp=pose.ph[key]+(t-tCur);if(tp<-.05||tp>pose.len+.05)return;const fr=pose.f[Math.max(0,Math.min(pose.f.length-1,R(tp/pose.dt)))],ref=pose.f[Math.max(0,Math.min(pose.f.length-1,R(pose.ph[key]/pose.dt)))];
    const hi=SIDE.indexOf("hip");if(!fr||!ref||!ref[hi]||!P[iCur].hip)return;const k=res.bodyPx/pose.body,mir=pose.facing!==res.facing?-1:1,o={};
    SIDE.forEach((j,n)=>{const p=fr[n];if(!p)return;o[j]=[P[iCur].hip[0]+(p[0]-ref[hi][0])*k*mir,P[iCur].hip[1]+(p[1]-ref[hi][1])*k];});
    drawSkel(o,w,h,"rgba(140,90,255,.95)",3,0,[2,5]);if(o.head){ctx.font="700 12px Barlow, sans-serif";ctx.fillStyle="#8c5aff";ctx.fillText(VB.shortDate(cmp.date),o.head[0]*w/AW+10,o.head[1]*h/AH-12);}}
  /* tap two points for a distance (once the clip is measured) and a third for the angle at the middle point */
  function measureDraw(w,h){if(tool!=="measure"||!tpts.length)return;const sx=w/AW,sy=h/AH;ctx.save();ctx.strokeStyle="#ffd400";ctx.fillStyle="#ffd400";ctx.lineWidth=2.5;ctx.beginPath();tpts.forEach((p,i)=>{i?ctx.lineTo(p[0]*sx,p[1]*sy):ctx.moveTo(p[0]*sx,p[1]*sy);});ctx.stroke();
    tpts.forEach(p=>{ctx.beginPath();ctx.arc(p[0]*sx,p[1]*sy,5,0,7);ctx.fill();});ctx.font="700 14px Barlow, sans-serif";ctx.textBaseline="bottom";let txt="";
    if(tpts.length>=2&&res&&res.cmPx){const a=tpts[tpts.length-2],b=tpts[tpts.length-1];txt=VB.lenOut(d2(a,b)*res.cmPx)+" "+VB.lu();}
    if(tpts.length===3){const a=ang(tpts[0],tpts[1],tpts[2]);if(a!=null)txt=R(a)+"°";}
    if(txt){const p=tpts[tpts.length===3?1:tpts.length-1],x=p[0]*sx+10,y=p[1]*sy-8;ctx.fillStyle="rgba(23,20,77,.9)";ctx.fillRect(x-4,y-18,ctx.measureText(txt).width+8,22);ctx.fillStyle="#ffd400";ctx.fillText(txt,x,y);}ctx.restore();}
  function setTool(t){tool=tool===t?null:t;tpts=[];const b=$("#fMeasure",root);if(b){b.setAttribute("aria-pressed",String(tool==="measure"));}canvas.style.pointerEvents=tool||mode==="mark"||mode==="done"?"auto":"none";canvas.style.cursor=tool?"crosshair":"default";
    const hint=$("#fToolHint",root);if(hint)hint.hidden=tool!=="measure";if(tool)video.pause();}
  function toolPoint(e){if(tool!=="measure")return false;const r=canvas.getBoundingClientRect();const p=[(e.clientX-r.left)/r.width*AW,(e.clientY-r.top)/r.height*AH];if(!AW){AW=meta.w;AH=meta.h;}if(tpts.length>=3)tpts=[];tpts.push(p);video.pause();return true;}
  /* a copy of the clip with the skeleton, angles and feedback burned in, at half speed, to send to a coach */
  async function exportVideo(btn){if(!res||!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){VB.ui.toast("This browser can't record video. Try Chrome, Edge or Safari 15 or newer.");return;}
    const types=["video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9","video/webm"],type=types.find(x=>MediaRecorder.isTypeSupported(x));if(!type){VB.ui.toast("This browser can't record video.");return;}
    const sc=Math.min(1,1280/Math.max(meta.w,meta.h)),W=R(meta.w*sc/2)*2,H=R(meta.h*sc/2)*2,cv=document.createElement("canvas");cv.width=W;cv.height=H;const g=cv.getContext("2d"),st=cv.captureStream(30),rec=new MediaRecorder(st,{mimeType:type,videoBitsPerSecond:5e6}),chunks=[];
    rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};const done=new Promise(r=>rec.onstop=r);
    const keep=ctx,rate=video.playbackRate,wasPause=pauseOn;pauseOn=false;btn.disabled=true;const lab=btn.textContent;btn.textContent="Recording… 0%";
    await seek(clip[0]);video.playbackRate=.5;rec.start(200);let stop=false;
    const head=()=>{g.fillStyle="rgba(23,20,77,.88)";g.fillRect(0,0,W,34);g.fillStyle="#fff";g.font="700 16px Barlow, sans-serif";g.textBaseline="middle";
      g.fillText(`${VB.MOVES[move].name}  ·  form ${res.score!=null?res.score:"–"}/100${res.jumpFlight?"  ·  jump "+VB.lenOut(res.jumpFlight)+" "+VB.lu():""}${res.approach?"  ·  approach "+res.approach+" m/s":""}`,12,17);g.font="600 12px Barlow, sans-serif";g.textAlign="right";g.fillText("Volleyball Training Journey · ½ speed",W-12,17);g.textAlign="left";};
    const paintFrame=()=>{g.drawImage(video,0,0,W,H);ctx=g;try{paint(W,H,video.currentTime);}finally{ctx=keep;}head();btn.textContent="Recording… "+R((video.currentTime-clip[0])/(clip[1]-clip[0])*100)+"%";};
    const loop=()=>{if(stop)return;paintFrame();if(video.currentTime>=clip[1]-.02||video.ended){stop=true;return;}if("requestVideoFrameCallback" in video)video.requestVideoFrameCallback(loop);else requestAnimationFrame(loop);};
    video.play().catch(()=>{});loop();await new Promise(r=>{const c=()=>{if(stop||video.currentTime>=clip[1]-.02||video.ended){stop=true;r();}else setTimeout(c,50);};c();});
    paintFrame();await new Promise(r=>setTimeout(r,400));video.pause();rec.stop();await done;video.playbackRate=rate;pauseOn=wasPause;
    const blob=new Blob(chunks,{type:type.split(";")[0]}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`volleyball-${move}-${VB.today()}.${type.includes("mp4")?"mp4":"webm"}`;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);btn.disabled=false;btn.textContent=lab;VB.ui.toast("Video saved to your downloads.");await seek(clip[0]);}
  /* keyboard: space plays, arrows step a frame (shift: 10), [ and ] set the clip start and end */
  document.addEventListener("keydown",e=>{if(!root||!meta||!root.offsetParent)return;const tg=e.target;if(tg&&(tg.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)))return;if(e.metaKey||e.ctrlKey||e.altKey)return;
    const step=(e.shiftKey?10:1)/(nativeFps||30);let hit=true;
    if(e.key===" "){$("#fPlay",root).click();}else if(e.key==="ArrowLeft"||e.key===","){video.pause();video.currentTime=Math.max(clip[0],video.currentTime-step);}else if(e.key==="ArrowRight"||e.key==="."){video.pause();video.currentTime=Math.min(clip[1],video.currentTime+step);}
    else if(e.key==="["){$("#fIn",root).click();}else if(e.key==="]"){$("#fOut",root).click();}else if(e.key==="Escape"&&tool){setTool(null);}else hit=false;if(hit)e.preventDefault();});
  return {init(el){root=el;shell();},frame(){tick();draw();},refresh(){if(root)hist();},
    /* read-only snapshot for the reference comparison in app-features.js */
    data(){return res&&P?{move,view,P,res,times:F.map(x=>x.t),facing,AW,AH}:null;},
    _debug:{get tpts(){return tpts;},get tool(){return tool;},tools:()=>({strip,stripMatch,ang:(c,p)=>Math.atan2(c[1]-p[1],c[0]-p[0])}),set(pts,k){anchors={};anchors[k||0]=pts;},get res(){return res;},get F(){return F;},get P(){return P;},run,startMark,get AW(){return AW;},get AH(){return AH;}}};
})();
})();
