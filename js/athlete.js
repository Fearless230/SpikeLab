/* athlete.js: the 3D volleyball player. A rigged, skinned body built in Blender (tools/blender, CC0 MakeHuman base mesh)
   with clothing, hair and gear as separate pieces, and technique animations baked from Blender (js/player-data.js).
   Clip space: +x toward the net, +y up, +z the player's right. Animations are authored right-handed; lefties are mirrored.
   Public API (unchanged): VB.Athlete.{player, build, sample, handAt, CLIPS, forPos, byTech, ballGeo, ballMat}. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const G=VB.GL,{M4,V3,Node}=G,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sm=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},lerp=(a,b,t)=>a+(b-a)*t;
const D=window.VB_PLAYER;
const b64=s=>{const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;};

/* ---------- skeleton ---------- */
const BN=D.bones.names,BP=D.bones.parents,NB=BN.length,BI={};BN.forEach((n,i)=>BI[n]=i);
const SWAP=BN.map(n=>n.endsWith(".L")?BI[n.slice(0,-2)+".R"]:n.endsWith(".R")?BI[n.slice(0,-2)+".L"]:BI[n]);
const HEADS={};for(const k in D.bones.heads)HEADS[k]=new Float32Array(D.bones.heads[k].flat());
const TAILS=new Float32Array(D.bones.tails.flat());const PALM=D.bones.palm;
/* ---------- comic morphology ----------
   The players are drawn as cartoon characters (big round head, short sturdy body and limbs, big hands and feet, no nose),
   on top of the realistic rig and animation: each bone scales the mesh around its head (along the bone and across it),
   and the bones below it move with the scaled lengths. The clips play unchanged; the pelvis path is scaled to the new leg
   length and the feet are kept on the floor. */
/* [along the bone, across (depth), across (width)]: anime sports proportions, about seven and a half heads tall: lean and
   athletic, long legs, square shoulders, slim waist, a slightly larger head with a pointed chin */
const MS={hips:[1,.96,1],spine1:[1,.92,.93],spine2:[1,.95,.98],chest:[1,1,1.04],neck:[1.05,.88,.88],head:[1.08,1.08,1.08],jaw:[1.08,1.08,1.08],
  clavicle:[1.06,1,1],upperarm:[1.02,.95,.95],forearm:[1.02,.92,.92],forearmTwist:[1.02,.92,.92],hand:[1,.98,.98],
  thigh:[1.06,.94,.94],shin:[1.07,.9,.9],foot:[1.02,1,1],toe:[1,1,1]};
const KXZ=1.065,ANK0=(()=>{const h=D.bones.heads.athletic;return h[BN.indexOf("foot.L")][1];})(),ANK1=ANK0*MS.foot[0];
const SB=new Float32Array(NB*9);
{const H=D.bones.heads.athletic,T=D.bones.tails;for(let b=0;b<NB;b++){const k=BN[b].split(".")[0],m=MS[k]||[1,1,1],sl=m[0],sD=m[1],sW=m[2]==null?m[1]:m[2];
  let d=[T[b][0]-H[b][0],T[b][1]-H[b][1],T[b][2]-H[b][2]];const l=Math.hypot(d[0],d[1],d[2])||1;d=d.map(v=>v/l);
  // width axis: the body's left-right direction made perpendicular to the bone (up-down for bones that point sideways)
  let a=Math.abs(d[2])<.85?[0,0,1]:[0,1,0];const k2=a[0]*d[0]+a[1]*d[1]+a[2]*d[2];a=[a[0]-k2*d[0],a[1]-k2*d[1],a[2]-k2*d[2]];const la=Math.hypot(a[0],a[1],a[2]);a=a.map(v=>v/la);
  const c=[d[1]*a[2]-d[2]*a[1],d[2]*a[0]-d[0]*a[2],d[0]*a[1]-d[1]*a[0]];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)SB[b*9+i*3+j]=sl*d[i]*d[j]+sW*a[i]*a[j]+sD*c[i]*c[j];}}
/* ---------- art styles ----------
   real (default): the body exactly as rigged and animated (true proportions, no per-bone scaling), the MakeHuman head with
     its own eyes, hair and shoe pieces, lit shading and dual-quaternion skinning, so every joint keeps its volume and the
     hands and feet land exactly where the motion puts them.
   anime: the comic look above (scaled bones, round head, drawn face, ink outlines). The style lives on the athlete's
   bone-head array (heads._st), so every function that receives the heads knows which skeleton it is posing. */
const SB_ID=new Float32Array(NB*9);for(let b=0;b<NB;b++){SB_ID[b*9]=SB_ID[b*9+4]=SB_ID[b*9+8]=1;}
const STY={anime:{name:"anime",SB,kxz:KXZ,ank1:ANK1,dq:false},real:{name:"real",SB:SB_ID,kxz:1,ank1:ANK0,dq:true}};
const ART_DEFAULT="real",artOf=o=>o&&o.art==="anime"?"anime":"real",stOf=h=>(h&&h._st)||STY[ART_DEFAULT];
/* real players: the mesh is 1.924 m tall from sole to crown at the athletic shape; scale to the player's height */
const REAL_H=1.924;
const smul=(b,v,o,S)=>{const m=(S||SB).subarray(b*9,b*9+9);o=o||[0,0,0];const x=v[0],y=v[1],z=v[2];o[0]=m[0]*x+m[1]*y+m[2]*z;o[1]=m[3]*x+m[4]*y+m[5]*z;o[2]=m[6]*x+m[7]*y+m[8]*z;return o;};
/* overall size: legs are a little longer than life; scaled up so a player keeps roughly their real height on court */
const GS=.96;
const INK="#2a2233";
function shapeW(o){const w={lean:0,power:0,female:0};if(o.build==="lean")w.lean=1;else if(o.build==="power")w.power=1;if(o.frame==="female")w.female=1;return w;}
function headsFor(w){const A=HEADS.athletic,o=new Float32Array(A);for(const k in w)if(w[k]&&HEADS[k]){const B=HEADS[k];for(let i=0;i<o.length;i++)o[i]+=(B[i]-A[i])*w[k];}return o;}

/* ---------- quaternions ---------- */
function qmul(a,b,o){const aw=a[0],ax=a[1],ay=a[2],az=a[3],bw=b[0],bx=b[1],by=b[2],bz=b[3];o[0]=aw*bw-ax*bx-ay*by-az*bz;o[1]=aw*bx+ax*bw+ay*bz-az*by;o[2]=aw*by-ax*bz+ay*bw+az*bx;o[3]=aw*bz+ax*by-ay*bx+az*bw;return o;}
function qrot(q,v,o){const w=q[0],x=q[1],y=q[2],z=q[3],tx=2*(y*v[2]-z*v[1]),ty=2*(z*v[0]-x*v[2]),tz=2*(x*v[1]-y*v[0]);o[0]=v[0]+w*tx+y*tz-z*ty;o[1]=v[1]+w*ty+z*tx-x*tz;o[2]=v[2]+w*tz+x*ty-y*tx;return o;}
function qaxis(ax,a){const s=Math.sin(a/2),l=Math.hypot(ax[0],ax[1],ax[2])||1;return [Math.cos(a/2),ax[0]/l*s,ax[1]/l*s,ax[2]/l*s];}
function qconj(q){return [q[0],-q[1],-q[2],-q[3]];}

/* ---------- clips (baked in Blender) ---------- */
const CLIPS={};
for(const name in D.clips){const c=D.clips[name],r=new Float32Array(b64(c.root));let q=new Int16Array(b64(c.q));
  {const n=c.n,K=Math.min(n-2,Math.round(.4*c.fps)),F=new Float32Array(q.length);for(let i=0;i<q.length;i++)F[i]=q[i];
    // remove "out and back" hiccups: a joint that leaves its path for one to three frames and comes straight back
    const qa=(i,b)=>F.subarray((i*NB+b)*4,(i*NB+b)*4+4),ang=(x,y)=>{let d=0,lx=0,ly=0;for(let j=0;j<4;j++){d+=x[j]*y[j];lx+=x[j]*x[j];ly+=y[j]*y[j];}return 2*Math.acos(Math.min(1,Math.abs(d)/Math.sqrt(lx*ly)))*57.3;};
    const ARMB=new Set(BN.map((x,i)=>/^(upperarm|forearm|forearmTwist|hand|clavicle)/.test(x)?i:-1));
    for(let b=0;b<NB;b++)if(ARMB.has(b))for(let w=3;w>=1;w--)for(let k=1;k+w<n;k++){const A=qa(k-1,b),B=qa(k+w,b),ab=ang(A,B);if(ab>6)continue;
      let dev=0;for(let j=0;j<w;j++)dev=Math.max(dev,ang(qa(k+j,b),A));if(dev<12)continue;
      const sg=A[0]*B[0]+A[1]*B[1]+A[2]*B[2]+A[3]*B[3]<0?-1:1;for(let j=0;j<w;j++){const t=(j+1)/(w+1),Q=qa(k+j,b);for(let m=0;m<4;m++)Q[m]=A[m]*(1-t)+B[m]*sg*t;}}
    for(let k=n-K;k<n;k++){const s=sm((k-(n-K)+1)/K);
      for(let b=0;b<NB;b++){const a=(k*NB+b)*4,z=b*4,e=((n-1)*NB+b)*4;const sg=q[e]*q[z]+q[e+1]*q[z+1]+q[e+2]*q[z+2]+q[e+3]*q[z+3]<0?-1:1;for(let j=0;j<4;j++)F[a+j]=F[a+j]*(1-s)+F[z+j]*sg*s;}
      for(let j=0;j<3;j++)r[k*3+j]=r[k*3+j]*(1-s)+r[j]*s;}
    q=F;}
  CLIPS[name]={name,dur:c.dur,fps:c.fps,n:c.n,contact:c.contact>=0?c.contact:null,tTO:c.tTO>=0?c.tTO:null,tLand:c.tLand>=0?c.tLand:null,hand:c.hand||"R",labels:c.labels||[],q,root:r};}
/* ball paths: the ball meets the hand exactly at contact (h.contact is the hand position the pose produces there) */
const BALL={
  spike:(t,h)=>{const tc=h.tc+.02,setT=.95,S=[-.55,2.62,3.6],C=h.contact;
    if(t<setT){const u=t/setT,A=[-5.2,.8,1.4];return [lerp(A[0],S[0],u),lerp(A[1],S[1],u)+4*2.2*u*(1-u),lerp(A[2],S[2],u)];}
    if(t<tc){const u=(t-setT)/(tc-setT);return [lerp(S[0],C[0],u),lerp(S[1],C[1],u)+4*2.2*u*(1-u),lerp(S[2],C[2],u)];}
    const u=(t-tc)/.36,E=[5.4,.11,-.8];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.25*u*(1-u),lerp(C[2],E[2],u)];
    const v=t-tc-.36;if(v<.9)return [E[0]+v*2.6,.11+Math.abs(Math.sin(v*5))*Math.exp(-v*2.5)*1.2,E[2]-v*.6];return null;},
  block:(t,h)=>{const tc=h.tc,C=h.contact,A=[3.2,3.1,1.6];if(t<tc-.66)return null;if(t<tc){const u=(t-(tc-.66))/.66;return [lerp(A[0],C[0]+.12,u),lerp(A[1],C[1]+.06,u)+.25*u*(1-u),lerp(A[2],C[2],u)];}
    const v=t-tc;if(v<1.0)return [C[0]+.12+v*3.2,Math.max(.11,C[1]+v*.6-4.9*v*v),C[2]+v*.4];return null;},
  set:(t,h)=>{const tc=h.tc,C=h.contact,A=[-6,1.0,1.2];if(t<.2)return null;if(t<tc){const u=(t-.2)/(tc-.2);return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+4*2.6*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.25,E=[-.8,2.4,-4.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*1.6*u*(1-u),lerp(C[2],E[2],u)];return null;},
  dig:(t,h)=>{const tc=h.tc,C=h.contact,A=[.2,3.0,-1.2];if(t<tc-.44)return null;if(t<tc){const u=(t-(tc-.44))/.44;return [lerp(A[0],C[0],u),lerp(A[1],C[1],u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.3,E=[-.9,2.6,.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*3.4*u*(1-u),lerp(C[2],E[2],u)];return null;},
  serve:(t,h)=>{const tc=h.tc,C=h.contact,tr=.5;if(t<tr)return h.hand(t);if(t<tc){const A=h.hand(tr),u=(t-tr)/(tc-tr);return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+4*2.0*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/.95,E=[6.5,.11,.5];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*.9*u*(1-u),lerp(C[2],E[2],u)];const v=t-tc-.95;if(v<.7)return [E[0]+v*2,.11+Math.abs(Math.sin(v*5))*Math.exp(-v*3),E[2]];return null;},
  pipe:(t,h)=>{const tc=h.tc,setT=.95,St=[-.55,2.62,3.6],C=h.contact;
    if(t<setT){const u=t/setT,A=[-6.4,.8,1.6];return [lerp(A[0],St[0],u),lerp(A[1],St[1],u)+4*2.0*u*(1-u),lerp(A[2],St[2],u)];}
    if(t<tc){const u=(t-setT)/(tc-setT);return [lerp(St[0],C[0],u),lerp(St[1],C[1],u)+4*1.6*u*(1-u),lerp(St[2],C[2],u)];}
    const u=(t-tc)/.5,E=[7.4,.11,-1.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.5*u*(1-u),lerp(C[2],E[2],u)];return null;},
  slide:(t,h)=>{const tc=h.tc,C=h.contact,S=[-.75,2.4,.3];if(t<.75)return null;if(t<1.0){const u=(t-.75)/.25,A=[-5.5,.9,-1];return [lerp(A[0],S[0],u),lerp(A[1],S[1],u)+.6*u,lerp(A[2],S[2],u)];}
    if(t<tc){const u=(t-1.0)/(tc-1.0);return [lerp(S[0],C[0],u),lerp(S[1],C[1],u)+4*.5*u*(1-u),lerp(S[2],C[2],u)];}
    const u=(t-tc)/.42,E=[6.4,.11,3.4];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.3*u*(1-u),lerp(C[2],E[2],u)];return null;},
  float:(t,h)=>{const tc=h.tc,C=h.contact,tr=.8,L=h.left(tr);if(t<tr)return h.left(t);if(t<tc){const u=(t-tr)/(tc-tr);return [lerp(L[0],C[0],u),lerp(L[1],C[1],u)+4*.45*u*(1-u),lerp(L[2],C[2],u)];}
    const u=(t-tc)/1.25,E=[6.4,.11,-1.2];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*1.1*u*(1-u),lerp(C[2],E[2],u)+.16*Math.sin(u*14)];return null;},
  sprawl:(t,h)=>{const tc=h.tc,C=h.contact;if(t<.75)return null;if(t<tc){const u=(t-.75)/(tc-.75),A=[-.3,3.1,-.4];return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+.6*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.1,E=[-1.4,2.4,1.2];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*1.6*u*(1-u),lerp(C[2],E[2],u)];return null;},
  jumpfloat:(t,h)=>{const tc=h.tc,C=h.contact,tr=.72,L=h.left(tr);if(t<tr)return h.left(t);if(t<tc){const u=(t-tr)/(tc-tr);return [lerp(L[0],C[0],u),lerp(L[1],C[1],u)+4*1.15*u*(1-u),lerp(L[2],C[2],u)];}
    const u=(t-tc)/1.2,E=[7.4,.11,-2.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*.9*u*(1-u),lerp(C[2],E[2],u)+.18*Math.sin(u*12)];return null;},
  // attack variations: same set as the spike (or a faster one) and a different ball after contact
  quick:(t,h)=>{const tc=h.tc+.01,setT=1.16,S=[-.5,2.5,1.0],C=h.contact;
    if(t<setT){const u=t/setT,A=[-5.2,.8,1.4];return [lerp(A[0],S[0],u),lerp(A[1],S[1],u)+4*2.0*u*(1-u),lerp(A[2],S[2],u)];}
    if(t<tc){const u=(t-setT)/(tc-setT);return [lerp(S[0],C[0],u),lerp(S[1],C[1],u)+4*.25*u*(1-u),lerp(S[2],C[2],u)];}
    const u=(t-tc)/.28,E=[3.6,.11,-.9];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.15*u*(1-u),lerp(C[2],E[2],u)];
    const v=t-tc-.28;if(v<.8)return [E[0]+v*2.4,.11+Math.abs(Math.sin(v*5))*Math.exp(-v*2.5)*1.1,E[2]-v*.5];return null;},
  shoot:(t,h)=>{const tc=h.tc+.02,setT=1.08,S=[-.55,2.62,3.6],C=h.contact;
    if(t<setT){const u=t/setT,A=[-5.2,.8,1.4];return [lerp(A[0],S[0],u),lerp(A[1],S[1],u)+4*2.2*u*(1-u),lerp(A[2],S[2],u)];}
    if(t<tc){const u=(t-setT)/(tc-setT);return [lerp(S[0],C[0],u),lerp(S[1],C[1],u)+4*.7*u*(1-u),lerp(S[2],C[2],u)];}
    const u=(t-tc)/.34,E=[5.8,.11,-1.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+.2*u*(1-u),lerp(C[2],E[2],u)];
    const v=t-tc-.34;if(v<.8)return [E[0]+v*2.6,.11+Math.abs(Math.sin(v*5))*Math.exp(-v*2.5)*1.2,E[2]-v*.6];return null;},
  dump:(t,h)=>{const tc=h.tc,C=h.contact,A=[-6,1.0,1.2];if(t<.2)return null;if(t<tc){const u=(t-.2)/(tc-.2);return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+4*2.6*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/.62,E=[1.5,.11,-.7];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*.35*u*(1-u),lerp(C[2],E[2],u)];
    const v=t-tc-.62;if(v<.7)return [E[0]+v*1.2,.11+Math.abs(Math.sin(v*6))*Math.exp(-v*3)*.6,E[2]];return null;},
  collapse:(t,h)=>{const tc=h.tc,C=h.contact,A=[.4,2.4,.1];if(t<tc-.5)return null;if(t<tc){const u=(t-(tc-.5))/.5;return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+.2*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.3,E=[-1.0,2.6,.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*3.2*u*(1-u),lerp(C[2],E[2],u)];return null;},
  sidedive:(t,h)=>{const tc=h.tc,C=h.contact;if(t<.85)return null;if(t<tc){const u=(t-.85)/(tc-.85),A=[.3,3.0,.9];return [lerp(A[0],C[0],u),lerp(A[1],C[1],u)+.5*u*(1-u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.1,E=[-1.6,2.3,.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*1.6*u*(1-u),lerp(C[2],E[2],u)];return null;},
  tomahawk:(t,h)=>{const tc=h.tc,C=h.contact,A=[.4,3.4,-.9];if(t<tc-.46)return null;if(t<tc){const u=(t-(tc-.46))/.46;return [lerp(A[0],C[0],u),lerp(A[1],C[1],u),lerp(A[2],C[2],u)];}
    const u=(t-tc)/1.2,E=[-1.2,2.8,.6];if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*2.0*u*(1-u),lerp(C[2],E[2],u)];return null;},
  ready:()=>null};
// tip, roll and cut share the spike's set; only the ball after contact changes
const afterSpike=(E,dur,arc,bounce)=>(t,h)=>{const tc=h.tc+.02;if(t<tc)return BALL.spike(t,h);const C=h.contact,u=(t-tc)/dur;
  if(u<=1)return [lerp(C[0],E[0],u),lerp(C[1],E[1],u)+4*arc*u*(1-u),lerp(C[2],E[2],u)];const v=t-tc-dur;if(v<.8)return [E[0]+v*bounce[0],.11+Math.abs(Math.sin(v*6))*Math.exp(-v*3)*bounce[1],E[2]+v*bounce[2]];return null;};
BALL.tip=afterSpike([2.0,.11,.3],.72,.45,[.8,.4,.1]);BALL.roll=afterSpike([5.2,.11,.9],.95,.95,[1.6,.7,.2]);BALL.cut=afterSpike([2.6,.11,3.0],.34,.08,[1.2,.8,1.4]);
const HANDK={spike:"R",pipe:"R",slide:"R",serve:"R",float:"R",jumpfloat:"R",block:"both",set:"both",dig:"platform",sprawl:"pancake",
  quick:"R",shoot:"R",tip:"R",roll:"R",cut:"R",dump:"L",collapse:"platform",sidedive:"pancake",tomahawk:"both"};
for(const k in CLIPS){CLIPS[k].ball=BALL[k]||(()=>null);CLIPS[k].hand=HANDK[k]||CLIPS[k].hand;}

/* pose at time t: local quaternions (Float32Array NB*4) + root position. Lefties: mirror across the body's midplane. */
function pose(clip,t,lefty,out){t=((t%clip.dur)+clip.dur)%clip.dur;const n=clip.n,f=t*clip.fps,fl=Math.floor(f),u=f-fl,i0=fl%n,im=(i0-1+n)%n,i1=(i0+1)%n,i2=(i0+2)%n;
  // Catmull-Rom between the baked frames: velocity stays continuous through every frame (no 30 fps stepping)
  const u2=u*u,u3=u2*u,wm=(-u+2*u2-u3)/2,w0=(2-5*u2+3*u3)/2,w1=(u+4*u2-3*u3)/2,w2=(-u2+u3)/2;
  const Q=clip.q,R=clip.root,o=out||{q:new Float32Array(NB*4),root:[0,0,0]},q=o.q;
  for(let b=0;b<NB;b++){const A0=(i0*NB+b)*4,Am=(im*NB+b)*4,A1=(i1*NB+b)*4,A2=(i2*NB+b)*4;
    const sm_=Q[Am]*Q[A0]+Q[Am+1]*Q[A0+1]+Q[Am+2]*Q[A0+2]+Q[Am+3]*Q[A0+3]<0?-1:1,s1=Q[A1]*Q[A0]+Q[A1+1]*Q[A0+1]+Q[A1+2]*Q[A0+2]+Q[A1+3]*Q[A0+3]<0?-1:1;
    const s2=(Q[A2]*Q[A1]+Q[A2+1]*Q[A1+1]+Q[A2+2]*Q[A1+2]+Q[A2+3]*Q[A1+3]<0?-1:1)*s1;
    let w=Q[Am]*wm*sm_+Q[A0]*w0+Q[A1]*w1*s1+Q[A2]*w2*s2,x=Q[Am+1]*wm*sm_+Q[A0+1]*w0+Q[A1+1]*w1*s1+Q[A2+1]*w2*s2,
      y=Q[Am+2]*wm*sm_+Q[A0+2]*w0+Q[A1+2]*w1*s1+Q[A2+2]*w2*s2,z=Q[Am+3]*wm*sm_+Q[A0+3]*w0+Q[A1+3]*w1*s1+Q[A2+3]*w2*s2;const l=Math.hypot(w,x,y,z)||1;
    const d=(lefty?SWAP[b]:b)*4;if(lefty){q[d]=w/l;q[d+1]=-x/l;q[d+2]=-y/l;q[d+3]=z/l;}else{q[d]=w/l;q[d+1]=x/l;q[d+2]=y/l;q[d+3]=z/l;}}
  for(let k=0;k<3;k++)o.root[k]=R[im*3+k]*wm+R[i0*3+k]*w0+R[i1*3+k]*w1+R[i2*3+k]*w2;if(lefty)o.root[2]=-o.root[2];
  o.ik=PLAT[clip.name]?platW(PLAT[clip.name],t):0;
  return o;}
/* forward kinematics: world (model-space) rotation quaternion and head position per bone */
function fk(P,heads,W){W=W||{q:new Float32Array(NB*4),p:new Float32Array(NB*3)};const q=P.q;
  for(let b=0;b<NB;b++){const p=BP[b],o=b*4;
    if(p<0){W.q.set(q.subarray(o,o+4),o);continue;}
    qmul(W.q.subarray(p*4,p*4+4),q.subarray(o,o+4),W.q.subarray(o,o+4));}
  place(W,heads,P.root);
  if(P.ik>0)platformIK(P,W,heads,P.ik);
  if(P.reach&&P.reach.k>0){for(const S of ["L","R"])if(P.reach[S])armIK(P,W,heads,S,P.reach[S],P.reach.k);}
  return W;}
/* forearm platform (dig, sprawl): both arms straight and together, hands clasped. A two-bone IK layer brings the hands
   to a shared point in front of the body, keeping each elbow's bend plane; it fades in and out around contact. */
const PLAT={dig:[.95,1.1,1.55,1.75],sprawl:[.9,1.05,1.5,1.7],collapse:[1.0,1.15,1.65,1.85]};
function platW(w,t){return sm((t-w[0])/(w[1]-w[0]))*(1-sm((t-w[2])/(w[3]-w[2])));}
const qfrom=(a,b)=>{const la=Math.hypot(a[0],a[1],a[2]),lb=Math.hypot(b[0],b[1],b[2]);const x=a.map(v=>v/la),y=b.map(v=>v/lb);
  const c=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],d=x[0]*y[0]+x[1]*y[1]+x[2]*y[2];const q=[1+d,c[0],c[1],c[2]];const l=Math.hypot(...q)||1;return q.map(v=>v/l);};
const qslerpId=(q,k)=>{const r=[1+(q[0]-1)*k,q[1]*k,q[2]*k,q[3]*k];const l=Math.hypot(...r);return r.map(v=>v/l);};
/* two-bone arm IK in the skeleton's own space: hand to T, keeping the elbow's bend plane; k blends it in */
function armIK(P,W,heads,S,T,k){const pt=b=>[W.p[b*3],W.p[b*3+1],W.p[b*3+2]],wq=b=>Array.from(W.q.subarray(b*4,b*4+4));
  const u=BI["upperarm."+S],f=BI["forearm."+S],h=BI["hand."+S],Sh=pt(u),E=pt(f),H=pt(h),L1=V3.len(V3.sub(E,Sh)),L2=V3.len(V3.sub(H,E));
  let d=V3.sub(T,Sh),dl=V3.len(d);const mx=(L1+L2)*.995;if(dl>mx){T=V3.add(Sh,V3.sc(d,mx/dl));d=V3.sub(T,Sh);dl=mx;}
  const dn=V3.sc(d,1/dl);let pole=V3.sub(E,V3.add(Sh,V3.sc(dn,V3.dot(V3.sub(E,Sh),dn))));if(V3.len(pole)<1e-4)pole=[0,-1,0];pole=V3.norm(pole);
  const ca=clamp((L1*L1+dl*dl-L2*L2)/(2*L1*dl),-1,1),E2=V3.add(Sh,V3.add(V3.sc(dn,L1*ca),V3.sc(pole,L1*Math.sqrt(1-ca*ca))));
  const r1=qslerpId(qfrom(V3.sub(E,Sh),V3.sub(E2,Sh)),k),pu=wq(BP[u]),nu=qmul(r1,wq(u),[0,0,0,0]);P.q.set(qmul(qconj(pu),nu,[0,0,0,0]),u*4);fk1(P,W,heads);
  const E3=pt(f),H3=pt(h),r2=qslerpId(qfrom(V3.sub(H3,E3),V3.sub(T,E3)),k),nf=qmul(r2,wq(f),[0,0,0,0]);P.q.set(qmul(qconj(wq(u)),nf,[0,0,0,0]),f*4);fk1(P,W,heads);}
function platformIK(P,W,heads,k){const pt=b=>[W.p[b*3],W.p[b*3+1],W.p[b*3+2]],wq=b=>Array.from(W.q.subarray(b*4,b*4+4));
  const hL=pt(BI["hand.L"]),hR=pt(BI["hand.R"]),ch=wq(BI.chest),lat=qrot(ch,[0,0,1],[0,0,0]);
  // the clasp point: between the hands, at the reach of straight arms from the shoulders' midpoint
  const sL=pt(BI["upperarm.L"]),sR=pt(BI["upperarm.R"]),sm2=[(sL[0]+sR[0])/2,(sL[1]+sR[1])/2,(sL[2]+sR[2])/2];
  let m=[(hL[0]+hR[0])/2,(hL[1]+hR[1])/2,(hL[2]+hR[2])/2];
  for(const S of ["L","R"]){const u=BI["upperarm."+S],f=BI["forearm."+S],h=BI["hand."+S],sg=S==="L"?-1:1;
    const Sh=pt(u),E=pt(f),H=pt(h),L1=V3.len(V3.sub(E,Sh)),L2=V3.len(V3.sub(H,E));
    let T=V3.add(V3.add(m,V3.sc(lat,.016*sg)),[0,S==="R"?.012:0,0]);let d=V3.sub(T,Sh),dl=V3.len(d);const mx=(L1+L2)*.985;if(dl>mx){T=V3.add(Sh,V3.sc(d,mx/dl));d=V3.sub(T,Sh);dl=mx;}
    // elbow on the current bend plane
    const dn=V3.sc(d,1/dl);let pole=V3.sub(E,V3.add(Sh,V3.sc(dn,V3.dot(V3.sub(E,Sh),dn))));if(V3.len(pole)<1e-4)pole=[0,-1,0];pole=V3.norm(pole);
    const ca=clamp((L1*L1+dl*dl-L2*L2)/(2*L1*dl),-1,1),E2=V3.add(Sh,V3.add(V3.sc(dn,L1*ca),V3.sc(pole,L1*Math.sqrt(1-ca*ca))));
    // upper arm
    const r1=qslerpId(qfrom(V3.sub(E,Sh),V3.sub(E2,Sh)),k),pu=wq(BP[u]),nu=qmul(r1,wq(u),[0,0,0,0]);P.q.set(qmul(qconj(pu),nu,[0,0,0,0]),u*4);
    fk1(P,W,heads);
    const E3=pt(f),H3=pt(h),r2=qslerpId(qfrom(V3.sub(H3,E3),V3.sub(T,E3)),k),nf=qmul(r2,wq(f),[0,0,0,0]);P.q.set(qmul(qconj(wq(u)),nf,[0,0,0,0]),f*4);
    fk1(P,W,heads);}}
function fk1(P,W,heads){const q=P.q;for(let b=0;b<NB;b++){const p=BP[b],o=b*4;if(p<0){W.q.set(q.subarray(o,o+4),o);continue;}qmul(W.q.subarray(p*4,p*4+4),q.subarray(o,o+4),W.q.subarray(o,o+4));}place(W,heads,P.root);}
/* bone head positions from world rotations: the cartoon (scaled) skeleton, with the pelvis path scaled to its legs and the
   lower foot put where the realistic skeleton's lower foot is (scaled), so planted feet stay on the floor */
const _o=new Float32Array(NB*3),_t=[0,0,0],_u=[0,0,0],_f=[0,0,0];
function place(W,heads,root){const st=stOf(heads),K=st.kxz,S=st.SB;
  for(let b=0;b<NB;b++){const p=BP[b];
    if(p<0){W.p[0]=root[0]*K;W.p[1]=root[1]*K;W.p[2]=root[2]*K;_o[0]=root[0];_o[1]=root[1];_o[2]=root[2];continue;}
    const pq=W.q.subarray(p*4,p*4+4);_f[0]=heads[b*3]-heads[p*3];_f[1]=heads[b*3+1]-heads[p*3+1];_f[2]=heads[b*3+2]-heads[p*3+2];
    qrot(pq,_f,_t);_o[b*3]=_o[p*3]+_t[0];_o[b*3+1]=_o[p*3+1]+_t[1];_o[b*3+2]=_o[p*3+2]+_t[2];
    qrot(pq,smul(p,_f,_u,S),_t);W.p[b*3]=W.p[p*3]+_t[0];W.p[b*3+1]=W.p[p*3+1]+_t[1];W.p[b*3+2]=W.p[p*3+2]+_t[2];}
  const fl=BI["foot.L"],fr=BI["foot.R"],yo=Math.min(_o[fl*3+1],_o[fr*3+1]),yn=Math.min(W.p[fl*3+1],W.p[fr*3+1]);
  if(st.kxz===1&&st.SB===SB_ID)return W;   // real skeleton: nothing rescaled, the feet are already where the clip put them
  const dy=K*(yo-ANK0)+st.ank1-yn;for(let b=0;b<NB;b++)W.p[b*3+1]+=dy;
  return W;}
/* skin matrices (3 rows of a 3x4 affine per bone): x' = R (x - h_rest) + p */
function skinRows(W,heads,out){const st=stOf(heads);if(st.dq)return skinDQ(W,heads,out);const SBs=st.SB;for(let b=0;b<NB;b++){const q=W.q.subarray(b*4,b*4+4),w=q[0],x=q[1],y=q[2],z=q[3];
    const r00=1-2*(y*y+z*z),r01=2*(x*y-w*z),r02=2*(x*z+w*y),r10=2*(x*y+w*z),r11=1-2*(x*x+z*z),r12=2*(y*z-w*x),r20=2*(x*z-w*y),r21=2*(y*z+w*x),r22=1-2*(x*x+y*y);
    const hx=heads[b*3],hy=heads[b*3+1],hz=heads[b*3+2],px=W.p[b*3],py=W.p[b*3+1],pz=W.p[b*3+2],o=b*12;
    // rotation times the bone's cartoon scale (rest frame)
    {const m=SBs.subarray(b*9,b*9+9);const a00=r00*m[0]+r01*m[3]+r02*m[6],a01=r00*m[1]+r01*m[4]+r02*m[7],a02=r00*m[2]+r01*m[5]+r02*m[8],
      a10=r10*m[0]+r11*m[3]+r12*m[6],a11=r10*m[1]+r11*m[4]+r12*m[7],a12=r10*m[2]+r11*m[5]+r12*m[8],
      a20=r20*m[0]+r21*m[3]+r22*m[6],a21=r20*m[1]+r21*m[4]+r22*m[7],a22=r20*m[2]+r21*m[5]+r22*m[8];
      out[o]=a00;out[o+1]=a01;out[o+2]=a02;out[o+3]=px-(a00*hx+a01*hy+a02*hz);
      out[o+4]=a10;out[o+5]=a11;out[o+6]=a12;out[o+7]=py-(a10*hx+a11*hy+a12*hz);
      out[o+8]=a20;out[o+9]=a21;out[o+10]=a22;out[o+11]=pz-(a20*hx+a21*hy+a22*hz);continue;}
    out[o]=r00;out[o+1]=r01;out[o+2]=r02;out[o+3]=px-(r00*hx+r01*hy+r02*hz);
    out[o+4]=r10;out[o+5]=r11;out[o+6]=r12;out[o+7]=py-(r10*hx+r11*hy+r12*hz);
    out[o+8]=r20;out[o+9]=r21;out[o+10]=r22;out[o+11]=pz-(r20*hx+r21*hy+r22*hz);}return out;}

/* dual-quaternion skin data (real style, no scaling): per bone the rotation q = (x,y,z,w) and its dual part, two vec4s.
   Blending dual quaternions instead of matrices keeps elbows, knees and shoulders from collapsing ("candy wrapper") in
   the deep bends and twists of a spike or a dig. x' = R (x - h_rest) + p, so the translation is t = p - R h_rest. */
function skinDQ(W,heads,out){for(let b=0;b<NB;b++){const q=W.q.subarray(b*4,b*4+4),w=q[0],x=q[1],y=q[2],z=q[3],hx=heads[b*3],hy=heads[b*3+1],hz=heads[b*3+2];
    const r00=1-2*(y*y+z*z),r01=2*(x*y-w*z),r02=2*(x*z+w*y),r10=2*(x*y+w*z),r11=1-2*(x*x+z*z),r12=2*(y*z-w*x),r20=2*(x*z-w*y),r21=2*(y*z+w*x),r22=1-2*(x*x+y*y);
    const tx=W.p[b*3]-(r00*hx+r01*hy+r02*hz),ty=W.p[b*3+1]-(r10*hx+r11*hy+r12*hz),tz=W.p[b*3+2]-(r20*hx+r21*hy+r22*hz),o=b*8;
    out[o]=x;out[o+1]=y;out[o+2]=z;out[o+3]=w;
    // dual = 1/2 (t, 0) * q
    out[o+4]=.5*(w*tx+ty*z-tz*y);out[o+5]=.5*(w*ty+tz*x-tx*z);out[o+6]=.5*(w*tz+tx*y-ty*x);out[o+7]=-.5*(tx*x+ty*y+tz*z);}
  return out;}

/* ---------- mesh pieces ---------- */
const RAW={};
function raw(name){if(RAW[name])return RAW[name];const r=D.pieces[name];if(!r)return null;
  const p=new Int16Array(b64(r.p)),P=new Float32Array(p.length);for(let i=0;i<p.length;i++)P[i]=p[i]/10000;
  const o={n:r.n,P,J:new Uint8Array(b64(r.j)),W:new Uint8Array(b64(r.w)),I:r.i32?new Uint32Array(b64(r.i)):new Uint16Array(b64(r.i)),groups:r.groups,
    UV:r.uv?Float32Array.from(new Uint16Array(b64(r.uv)),v=>v/16384):null,C:r.c?new Uint8Array(b64(r.c)):null,cov:r.cov?new Uint16Array(b64(r.cov)):null,M:{}};
  for(const k in r.m)o.M[k]={s:r.m[k].s,d:new Int8Array(b64(r.m[k].d))};
  return RAW[name]=o;}
/* smooth normals, welding vertices that share a position (seams, rims) */
function normals(P,I){const n=P.length/3,N=new Float32Array(P.length),key=new Map(),rep=new Int32Array(n);
  for(let v=0;v<n;v++){const k=Math.round(P[v*3]*2e4)+","+Math.round(P[v*3+1]*2e4)+","+Math.round(P[v*3+2]*2e4);let r=key.get(k);if(r===undefined){r=v;key.set(k,v);}rep[v]=r;}
  for(let t=0;t<I.length;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3,ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const v of [I[t],I[t+1],I[t+2]]){const r=rep[v]*3;N[r]+=nx;N[r+1]+=ny;N[r+2]+=nz;}}
  for(let v=0;v<n;v++){const r=rep[v]*3,l=Math.hypot(N[r],N[r+1],N[r+2])||1;N[v*3]=N[r]/l;N[v*3+1]=N[r+1]/l;N[v*3+2]=N[r+2]/l;}return N;}
const GEO={};
/* geometry of a piece for a body shape (cached); keep: optional triangle filter on vertex positions */
const HEADFIX=/^(skin|hair_|headband_|beard_)/,HSH={};
/* the round head every player gets: an ellipsoid, and the skin's own radius per direction (so pieces can be moved onto it) */
function headShape(w){const key=""+w.lean+w.power+w.female;if(HSH[key])return HSH[key];const r=raw("skin");
  const P=new Float32Array(r.P);for(const m in w){if(!w[m]||!r.M[m])continue;const M=r.M[m],s=M.s*w[m];for(let i=0;i<P.length;i++)P[i]+=M.d[i]*s;}
  const c=[.03,1.8,0],rx=.104,ry=.122,rz=.088,NA=36,NE=18,sum=new Float32Array(NA*NE),cnt=new Float32Array(NA*NE);
  const bin=u=>{const a=Math.atan2(u[2],u[0]),e=Math.asin(clamp(u[1],-1,1));return [(a+Math.PI)/(2*Math.PI)*NA-.5,(e+Math.PI/2)/Math.PI*NE-.5];};
  for(let v=0;v<P.length/3;v++){const y=P[v*3+1];if(y<1.64)continue;const dx=P[v*3]-c[0],dy=y-c[1],dz=P[v*3+2]-c[2],rr=Math.hypot(dx,dy,dz);if(rr>.25)continue;
    const [ba,be]=bin([dx/rr,dy/rr,dz/rr]),i=((Math.round(ba)%NA)+NA)%NA,j=clamp(Math.round(be),0,NE-1);sum[j*NA+i]+=rr;cnt[j*NA+i]++;}
  let R=new Float32Array(NA*NE);for(let k=0;k<R.length;k++)R[k]=cnt[k]?sum[k]/cnt[k]:0;
  for(let it=0;it<40;it++){const Q=R.slice();for(let j=0;j<NE;j++)for(let i=0;i<NA;i++){const k=j*NA+i;let s2=0,n2=0;
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const jj=j+dj;if(jj<0||jj>=NE)continue;const v=R[jj*NA+((i+di)%NA+NA)%NA];if(v){s2+=v;n2++;}}
      if(!cnt[k])Q[k]=n2?s2/n2:0;else if(it>36&&n2)Q[k]=R[k]*.6+s2/n2*.4;}R=Q;}
  const Rs=u=>{const [ba,be]=bin(u),i0=Math.floor(ba),j0=clamp(Math.floor(be),0,NE-2),fa=ba-i0,fe=clamp(be-j0,0,1),g=(i,j)=>R[j*NA+((i%NA)+NA)%NA];
    return (g(i0,j0)*(1-fa)+g(i0+1,j0)*fa)*(1-fe)+(g(i0,j0+1)*(1-fa)+g(i0+1,j0+1)*fa)*fe;};
  const RE=u=>{let r=1/Math.hypot(u[0]/rx,u[1]/ry,u[2]/rz);if(u[1]<0){const q=Math.pow(-u[1],1.3);r*=1-.38*q*Math.abs(u[2])-.22*q*Math.max(0,-u[0])+.03*q*Math.max(0,u[0]);}return r;};
  return HSH[key]={c,Rs,RE};}
/* face: two dark oval eyes with a highlight, a small mouth and pink cheeks, drawn on the round head (rigid on the head bone) */
function faceGeo(w,skin,eyeCol){const H=headShape(w),list=[];
  const at=(az,el,lift)=>{az*=Math.PI/180;el*=Math.PI/180;const u=[Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)],R=H.RE(u)+(lift||0);
    const z=u,x=V3.norm(V3.cross([0,1,0],z)),y=V3.cross(z,x);return {p:V3.add(H.c,V3.sc(u,R)),x,y,z};};
  const put=(f,sx,sy,sz,col)=>{const m=new Float32Array(16);m.set([f.x[0]*sx,f.x[1]*sx,f.x[2]*sx,0,f.y[0]*sy,f.y[1]*sy,f.y[2]*sy,0,f.z[0]*sz,f.z[1]*sz,f.z[2]*sz,0,f.p[0],f.p[1],f.p[2],1]);list.push([G.sphere(1,14,10),m,col]);};
  const ink=G.hex(INK),sk=G.hex(skin),iris=G.hex(eyeCol||"#5b3a24"),nose=sk.map(v=>v*.86),white=[.98,.97,.95];
  for(const s of [-1,1]){
    put(at(22*s,-7,-.0012),.0105,.0105,.004,white);                       // eye white
    put(at(22.5*s,-7.5,.0004),.0068,.0088,.003,iris);                      // iris
    put(at(22.5*s,-8,.0012),.0034,.0044,.002,ink);                         // pupil
    put(at(20*s,-5,.0022),.0022,.0026,.0012,[1,1,1]);put(at(25*s,-10.5,.002),.0012,.0012,.001,[1,1,1]);   // highlights
    const lid=at(22*s,-2.2,.0012);lid.x=V3.norm(V3.add(lid.x,V3.sc(lid.y,-.12*s)));put(lid,.0125,.0019,.003,ink);   // upper lash line
    const br=at(22*s,7.5,.0005);br.x=V3.norm(V3.add(br.x,V3.sc(br.y,-.2*s)));put(br,.012,.0018,.0022,ink);}        // brow
  put(at(0,-19,-.0035),.004,.008,.008,nose);
  put(at(0,-33,-.001),.0075,.0013,.0025,ink);
  const g=G.merge(list),n=g.p.length/3;g.j=new Uint8Array(n*4);g.w=new Uint8Array(n*4);for(let v=0;v<n;v++){g.j[v*4]=BI.head;g.w[v*4]=255;}g.bs={c:[0,1,0],r:1.2};return g;}
/* cartoon sneakers: a chunky rounded shoe with a flat sole on each foot (the front follows the toe bone) */
function shoeGeo(heads,col,sole){const list=[];
  for(const S of ["L","R"]){const f=BI["foot."+S],t=BI["toe."+S],z=heads[f*3+2],ax=heads[f*3],tx=heads[t*3];
    const g=G.sphere(1,22,14),P=g.p,cx=(ax-.075+tx+.06)/2,rx=(tx+.06-(ax-.075))/2;
    for(let v=0;v<P.length/3;v++){let x=P[v*3],y=P[v*3+1],zz=P[v*3+2];
      const fr=sm((x+.2)/1.2);P[v*3]=cx+x*rx;P[v*3+1]=y>0?.045+y*(.062-.02*fr):.045+y*.045;P[v*3+2]=z+zz*(.052+.008*fr);
      if(P[v*3+1]<.004)P[v*3+1]=.004+(P[v*3+1]-.004)*.15;}
    const c=new Float32Array(P.length);for(let v=0;v<P.length/3;v++){const k=P[v*3+1]<.02?1:0;const cc=k?sole:col;c[v*3]=cc[0];c[v*3+1]=cc[1];c[v*3+2]=cc[2];}
    // flat sole: normals of the bottom face straight down
    const N=g.n;for(let v=0;v<P.length/3;v++)if(P[v*3+1]<.006){N[v*3]=0;N[v*3+1]=-1;N[v*3+2]=0;}
    const n=P.length/3;g.c=c;g.j=new Uint8Array(n*4);g.w=new Uint8Array(n*4);
    for(let v=0;v<n;v++){const wt=Math.round(255*sm((P[v*3]-(tx-.035))/.06));g.j[v*4]=f;g.j[v*4+1]=t;g.w[v*4]=255-wt;g.w[v*4+1]=wt;}
    list.push(g);}
  const n0=list[0].p.length/3,out=G.geo(new Float32Array([...list[0].p,...list[1].p]),new Float32Array([...list[0].n,...list[1].n]),
    new Uint16Array([...list[0].i,...Array.from(list[1].i,v=>v+n0)]));
  out.c=new Float32Array([...list[0].c,...list[1].c]);out.j=new Uint8Array([...list[0].j,...list[1].j]);out.w=new Uint8Array([...list[0].w,...list[1].w]);out.bs={c:[0,1,0],r:1.2};return out;}
/* cartoon hair and headband, built on the round head: a thick cap with a fringe of bangs, cut per style (rigid on the head) */
function capGeo(H,keep,rad,seg){const g=G.sphere(1,seg||150,seg?Math.round(seg*.6):90),P=g.p,n=P.length/3,ok=new Uint8Array(n);
  for(let v=0;v<n;v++){const u=[P[v*3],P[v*3+1],P[v*3+2]],az=Math.atan2(u[2],u[0])*180/Math.PI,el=Math.asin(clamp(u[1],-1,1))*180/Math.PI;
    ok[v]=keep(az,el,u)?1:0;const R=H.RE(u)*rad(az,el,u);P[v*3]=H.c[0]+u[0]*R;P[v*3+1]=H.c[1]+u[1]*R;P[v*3+2]=H.c[2]+u[2]*R;}
  const I=[];for(let t=0;t<g.i.length;t+=3){const a=g.i[t],b=g.i[t+1],c=g.i[t+2];if(ok[a]&&ok[b]&&ok[c])I.push(a,b,c);}
  const out=G.geo(P,g.n,new Uint16Array(I));out.j=new Uint8Array(n*4);out.w=new Uint8Array(n*4);for(let v=0;v<n;v++){out.j[v*4]=BI.head;out.w[v*4]=255;}out.bs={c:[0,1,0],r:1.2};return out;}
function hairGeo(w,style){if(style==="bald")return null;const H=headShape(w),A=Math.abs;
  // hairline: el (degrees) above which there is hair, by azimuth (0 = face, 180 = back)
  const bangs=(az)=>9+9*Math.pow(A(Math.sin(az*Math.PI/180*7)),.7);
  const line={short:az=>A(az)<55?bangs(az):A(az)<115?lerp(bangs(55),-18,(A(az)-55)/60):lerp(-18,-48,clamp((A(az)-115)/40,0,1)),
    buzz:az=>A(az)<55?26:A(az)<115?lerp(26,2,(A(az)-55)/60):lerp(2,-38,clamp((A(az)-115)/40,0,1)),
    long:az=>A(az)<45?bangs(az):A(az)<100?lerp(bangs(45),-70,(A(az)-45)/55):-75,
    pulled:az=>A(az)<55?18:A(az)<115?lerp(18,-10,(A(az)-55)/60):lerp(-10,-45,clamp((A(az)-115)/40,0,1))};
  const L={short:line.short,curly:line.short,buzz:line.buzz,long:line.long,bun:line.pulled,ponytail:line.pulled}[style]||line.short;
  const th=style==="buzz"?.03:style==="curly"?.13:.1;
  const rad=(az,el,u)=>{let r=1+th*(.55+.45*Math.max(0,u[1]))+(style==="long"&&el<0?.05*(-el/75):0);
    if(style==="curly")r+=.035*Math.abs(Math.sin(az*.21)*Math.sin(el*.25));
    else if(style!=="buzz")r+=.05*Math.pow(Math.abs(Math.sin(az*.11+el*.05)*Math.sin(el*.13-az*.03)),3)*(.5+.5*Math.max(0,u[1]));return r;};
  return capGeo(H,(az,el)=>el>L(az),rad);}
function bandGeo(w,thin){const H=headShape(w),n=V3.norm([-.42,1,0]),e1=V3.norm(V3.cross(n,[0,0,1])),e2=V3.cross(n,e1),SEG=72,rows=thin?[.17,.23,.29]:[.16,.25,.35],p=[],nn=[],ix=[];
  rows.forEach((d,ri)=>{const out=(ri===1?(thin?1.07:1.2):(thin?1.055:1.175));for(let k=0;k<=SEG;k++){const a=k/SEG*Math.PI*2,q=Math.sqrt(1-d*d),u=V3.norm(V3.add(V3.sc(n,d),V3.add(V3.sc(e1,Math.cos(a)*q),V3.sc(e2,Math.sin(a)*q)))),R=H.RE(u)*out;
    p.push(H.c[0]+u[0]*R,H.c[1]+u[1]*R,H.c[2]+u[2]*R);nn.push(u[0],u[1],u[2]);}});
  for(let r=0;r<rows.length-1;r++)for(let k=0;k<SEG;k++){const a=r*(SEG+1)+k,b=a+SEG+1;ix.push(a,a+1,b,a+1,b+1,b);}
  const g=G.geo(p,nn,new Uint16Array(ix)),nv=p.length/3;g.j=new Uint8Array(nv*4);g.w=new Uint8Array(nv*4);for(let v=0;v<nv;v++){g.j[v*4]=BI.head;g.w[v*4]=255;}g.bs={c:[0,1,0],r:1.2};return g;}
/* the head itself: a clean round head with two small ears (the body's own head is not drawn) */
function headGeo(w){const H=headShape(w),list=[];const g=G.sphere(1,48,32),P=g.p;
  for(let v=0;v<P.length/3;v++){const u=[P[v*3],P[v*3+1],P[v*3+2]],R=H.RE(u);P[v*3]=H.c[0]+u[0]*R;P[v*3+1]=H.c[1]+u[1]*R;P[v*3+2]=H.c[2]+u[2]*R;}
  list.push([g,null]);
  for(const sd of [-1,1]){const u=V3.norm([-.08,-.12,sd]),R=H.RE(u),m=new Float32Array([.016,0,0,0, 0,.024,0,0, 0,0,.012,0, H.c[0]+u[0]*R,H.c[1]+u[1]*R,H.c[2]+u[2]*R,1]);list.push([G.sphere(1,12,10),m]);}
  const out=G.merge(list),n=out.p.length/3;out.c=null;out.j=new Uint8Array(n*4);out.w=new Uint8Array(n*4);for(let v=0;v<n;v++){out.j[v*4]=BI.head;out.w[v*4]=255;}out.bs={c:[0,1,0],r:1.2};return out;}
/* buns and ponytails on the round head */
function hairBits(w,style){const H=headShape(w),at=(az,el,s)=>{az*=Math.PI/180;el*=Math.PI/180;const u=[Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)];return V3.add(H.c,V3.sc(u,H.RE(u)*s));},list=[];
  if(style==="bun"){const p=at(180,42,1.1);list.push([G.sphere(1,18,14),G.T(p[0],p[1],p[2],0,0,0,.052,.048,.056)]);}
  if(style==="ponytail"){const p=at(180,18,1.08);list.push([G.sphere(1,14,10),G.T(p[0],p[1],p[2],0,0,0,.03,.03,.034)]);
    const pts=[];for(let i=0;i<=10;i++){const u=i/10;pts.push([p[0]-.03-.05*u,p[1]-.2*u+.03*Math.sin(u*3),p[2]]);}const tb=G.tube(pts,1,14);
    for(let v=0;v<tb.p.length/3;v++){const u=clamp((p[1]-tb.p[v*3+1])/.2,0,1),rr=.045*(1-.55*u)*(1+.35*Math.sin(u*3.1)),cx=p[0]-.03-.05*u,cy=p[1]-.2*u+.03*Math.sin(u*3);
      tb.p[v*3]=cx+(tb.p[v*3]-cx)*rr;tb.p[v*3+1]=cy+(tb.p[v*3+1]-cy)*rr;tb.p[v*3+2]=tb.p[v*3+2]*rr;}list.push([tb,null]);}
  if(!list.length)return null;const g=G.merge(list),n=g.p.length/3;g.c=null;g.j=new Uint8Array(n*4);g.w=new Uint8Array(n*4);for(let v=0;v<n;v++){g.j[v*4]=BI.head;g.w[v*4]=255;}g.bs={c:[0,1,0],r:1.2};return g;}
function pieceGeo(name,w,keepTri,tag,art){art=art||"anime";const k=name+"|"+w.lean+w.power+w.female+"|"+(tag||"")+"|"+art;if(GEO[k])return GEO[k];const r=raw(name);if(!r)return null;
  const P=new Float32Array(r.P);for(const m in w){if(!w[m]||!r.M[m])continue;const M=r.M[m],s=M.s*w[m];for(let i=0;i<P.length;i++)P[i]+=M.d[i]*s;}
  // cartoon head: everything above the neck is moved onto a round head shape (no nose, smooth face, small ears);
  // shells (hair, headband) move with the skin under them, so they keep their thickness
  if(art==="anime"&&HEADFIX.test(name)){const H=headShape(w);for(let v=0;v<P.length/3;v++){const y=P[v*3+1];if(y<1.62)continue;
      const k=.94*sm((y-1.655)/.06);if(k<=0)continue;const dx=P[v*3]-H.c[0],dy=y-H.c[1],dz=P[v*3+2]-H.c[2],r=Math.hypot(dx,dy,dz)||1;if(r>.3)continue;
      const u=[dx/r,dy/r,dz/r],sh=name==="skin"?Math.min(1,k/.94)*(H.RE(u)-r):k*(H.RE(u)-H.Rs(u));P[v*3]+=u[0]*sh;P[v*3+1]+=u[1]*sh;P[v*3+2]+=u[2]*sh;}}
  // chunky shoes
  // realistic shoes: the piece is cut from the foot surface, so the toes show through. Relax it into a smooth upper
  // (the sole keeps its height), thicken it a little and give it a flat sole and a rounded toe box
  if(art==="real"&&name==="shoes"){const nv=P.length/3,adj=Array.from({length:nv},()=>new Set()),I=r.I;for(let t=0;t<I.length;t+=3)for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(a!==b)adj[I[t+a]].add(I[t+b]);
    // Taubin smoothing (shrink, then inflate) removes the toes without shrinking the shoe
    for(let it=0;it<60;it++){const lam=it%2?-.53:.5,Q=new Float32Array(P);for(let v=0;v<nv;v++){const n=adj[v];if(!n.size)continue;let x=0,y=0,z=0;n.forEach(u=>{x+=P[u*3];y+=P[u*3+1];z+=P[u*3+2];});
      Q[v*3]=P[v*3]+(x/n.size-P[v*3])*lam;Q[v*3+2]=P[v*3+2]+(z/n.size-P[v*3+2])*lam;if(P[v*3+1]>.018)Q[v*3+1]=P[v*3+1]+(y/n.size-P[v*3+1])*lam;}P.set(Q);}
    const N0=normals(P,r.I);for(let v=0;v<nv;v++){const lo=P[v*3+1]<.03?.4:1;for(let k=0;k<3;k++)P[v*3+k]+=N0[v*3+k]*.009*lo;if(P[v*3+1]<.012)P[v*3+1]=.004+(P[v*3+1]-.004)*.2;}}
  // realistic jerseys: volleyball tops are tight, but the piece is cut from the body surface, so it shows details no
  // fabric would (nipples, small hollows). Fabric bridges the
  // hollows instead (under the chest, along the spine, between the shoulder blades) and only blunts what sticks out, so
  // each vertex moves toward a 5 cm neighbourhood average: freely outward, at most 12 mm inward (enough to take out the nipples, not the chest). Hems, armholes and the
  // collar (open edges) stay where they are and the effect fades in over the first 4 cm from them.
  if(art==="real"&&/^jersey_/.test(name)){const nv=P.length/3,I=r.I,N0=normals(P,I),ec=new Map(),bnd=[];
    for(let t=0;t<I.length;t+=3)for(let e=0;e<3;e++){const a=I[t+e],b=I[t+(e+1)%3],k=a<b?a+","+b:b+","+a;ec.set(k,(ec.get(k)||0)+1);}
    const isB=new Uint8Array(nv);ec.forEach((c,k)=>{if(c===1){const [a,b]=k.split(",");isB[+a]=isB[+b]=1;}});
    // seam duplicates are not real edges: a boundary vertex with another vertex at the same spot is interior
    const key=v=>Math.round(P[v*3]*2e3)+","+Math.round(P[v*3+1]*2e3)+","+Math.round(P[v*3+2]*2e3),cnt=new Map();for(let v=0;v<nv;v++){const k=key(v);cnt.set(k,(cnt.get(k)||0)+1);}
    for(let v=0;v<nv;v++)if(isB[v]&&cnt.get(key(v))<2)bnd.push(v);
    const R=.05,Q=new Float32Array(P);
    for(let pass=0;pass<2;pass++){const S=new Float32Array(Q);
      for(let v=0;v<nv;v++){let x=0,y=0,z=0,ws=0;for(let u=0;u<nv;u++){const dx=S[u*3]-S[v*3],dy=S[u*3+1]-S[v*3+1],dz=S[u*3+2]-S[v*3+2],d2=dx*dx+dy*dy+dz*dz;if(d2>R*R)continue;
          if(N0[u*3]*N0[v*3]+N0[u*3+1]*N0[v*3+1]+N0[u*3+2]*N0[v*3+2]<.2)continue;const wv=Math.exp(-d2/(R*R*.3));x+=S[u*3]*wv;y+=S[u*3+1]*wv;z+=S[u*3+2]*wv;ws+=wv;}
        let db=1;for(const b of bnd){const dx=S[b*3]-S[v*3],dy=S[b*3+1]-S[v*3+1],dz=S[b*3+2]-S[v*3+2];db=Math.min(db,Math.hypot(dx,dy,dz)/.04);if(db<=0)break;}
        const f=sm(db),d=[x/ws-S[v*3],y/ws-S[v*3+1],z/ws-S[v*3+2]],nv3=[N0[v*3],N0[v*3+1],N0[v*3+2]],dn=d[0]*nv3[0]+d[1]*nv3[1]+d[2]*nv3[2],cl=clamp(dn,-.012,.03);
        for(let k=0;k<3;k++)Q[v*3+k]=S[v*3+k]+f*nv3[k]*cl;}}   // along the normal only: sliding sideways would fold the cloth
    P.set(Q);
    const N1=normals(P,I);for(let i=0;i<P.length;i++)P[i]+=N1[i]*.002;}
  if(art==="anime"&&name==="shoes"){const nv=P.length/3,adj=Array.from({length:nv},()=>new Set()),I=r.I;for(let t=0;t<I.length;t+=3)for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(a!==b)adj[I[t+a]].add(I[t+b]);
    for(let it=0;it<30;it++){const Q=new Float32Array(P);for(let v=0;v<nv;v++){const n=adj[v];if(!n.size)continue;let x=0,y=0,z=0;n.forEach(u=>{x+=P[u*3];y+=P[u*3+1];z+=P[u*3+2];});
      Q[v*3]=P[v*3]*.4+x/n.size*.6;Q[v*3+2]=P[v*3+2]*.4+z/n.size*.6;if(P[v*3+1]>.02)Q[v*3+1]=P[v*3+1]*.4+y/n.size*.6;}P.set(Q);}
    const N0=normals(P,r.I);for(let i=0;i<P.length;i++)P[i]+=N0[i]*.014;}
  const out={};
  for(const [mat,start,count] of r.groups){let I=r.I.subarray(start,start+count);
    if(keepTri){const f=[];for(let t=0;t<I.length;t+=3)if(keepTri(P,I[t],I[t+1],I[t+2]))f.push(I[t],I[t+1],I[t+2]);I=r.n>65535?new Uint32Array(f):new Uint16Array(f);}
    (out[mat]=out[mat]||[]).push(I);}
  const N=normals(P,r.I);const res={};
  for(const mat in out){const parts=out[mat];let tot=0;parts.forEach(a=>tot+=a.length);const I=r.n>65535?new Uint32Array(tot):new Uint16Array(tot);let o=0;parts.forEach(a=>{I.set(a,o);o+=a.length;});
    const g=G.geo(P,N,I,r.UV,null);g.j=r.J;g.w=r.W;g.bs={c:[0,1,0],r:1.2};g.rawC=r.C;res[mat]=g;}
  return GEO[k]=res;}
/* extra hair volumes (bun, ponytail, curls, long hair), rigid on the head, built at the rest head position */
function hairExtra(style,heads){const h=[heads[BI.head*3],heads[BI.head*3+1],heads[BI.head*3+2]],list=[],hb=BI.head;
  const add=(g,m)=>list.push([g,m]);
  // tapered tail of hair from (x0,y0) hanging down and back; flat > 1 makes it wider than deep (long hair)
  const tail=(x0,y0,len,r0,flat,back)=>{const pts=[];for(let i=0;i<=12;i++){const u=i/12;pts.push([x0-back*u,y0-len*u,0]);}const tb=G.tube(pts,1,14);
    for(let v=0;v<tb.p.length/3;v++){const u=clamp((y0-tb.p[v*3+1])/len,0,1),rr=r0*(1-.5*u)*(1+.3*Math.sin(u*3.1)),cx=x0-back*u,cy=y0-len*u;
      tb.p[v*3]=cx+(tb.p[v*3]-cx)*rr;tb.p[v*3+1]=cy+(tb.p[v*3+1]-cy)*rr;tb.p[v*3+2]=tb.p[v*3+2]*rr*flat;}return tb;};
  if(style==="bun")add(G.sphere(1,20,14),G.T(h[0]-.088,h[1]+.125,0,0,0,0,.042,.038,.044));
  if(style==="ponytail"){add(G.sphere(.03,14,10),G.T(h[0]-.1,h[1]+.11,0));add(tail(h[0]-.11,h[1]+.11,.26,.032,1,.06),null);}
  if(style==="long")add(tail(h[0]-.08,h[1]+.12,.32,.06,1.55,.04),null);
  if(!list.length)return null;const g=G.merge(list);const n=g.p.length/3;g.j=new Uint8Array(n*4);g.w=new Uint8Array(n*4);for(let v=0;v<n;v++){g.j[v*4]=hb;g.w[v*4]=255;}
  // hair below the nape follows the neck and upper back a little, so it doesn't cut through the shoulders when the head turns
  for(let v=0;v<n;v++){const y=g.p[v*3+1],u=clamp((h[1]-y)/.22,0,1);if(u>0){g.j[v*4+1]=BI.neck;g.j[v*4+2]=BI.chest;const wc=Math.round(255*u*.7),wn=Math.round(255*u*.25);g.w[v*4]=255-wc-wn;g.w[v*4+1]=wn;g.w[v*4+2]=wc;}}
  g.bs={c:[0,1,0],r:1.2};return g;}
/* curly: the short-hair shell, pushed out in tight bumps */
function curlGeo(g){const P=new Float32Array(g.p),N=g.n;for(let v=0;v<P.length/3;v++){const x=P[v*3],y=P[v*3+1],z=P[v*3+2];
    const b=.5+.5*Math.sin(x*180)*Math.sin(y*170+1.3)*Math.sin(z*190+.7),d=.012+.016*b*b;P[v*3]+=N[v*3]*d;P[v*3+1]+=N[v*3+1]*d;P[v*3+2]+=N[v*3+2]*d;}
  const r=G.geo(P,new Float32Array(N),g.i,g.uv,null);r.j=g.j;r.w=g.w;r.bs=g.bs;r.n=normals(P,g.i);return r;}
/* ---------- textures ---------- */
const TEX={};
function jerseyTex(col,acc,num,pat){const k="j"+col+acc+num+(pat||"");if(TEX[k])return TEX[k];
  return TEX[k]=G.canvasTex(512,512,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);jerseyPattern(g,w,h,pat,acc);
    // side panels (u .25 left, .75 right) in a darker shade, and a thin accent piping along them
    // they stop at the armpit (v about .64): above it the cylindrical mapping wraps round the shoulders and sleeves
    const top=h*(1-.64),dark=G.hex(col).map(v=>Math.round(v*255*.78));g.fillStyle=`rgb(${dark})`;[.25,.75].forEach(u=>{g.fillRect(u*w-22,top,44,h-top);});
    g.fillStyle=acc;[.25,.75].forEach(u=>{g.fillRect(u*w-24,top,3,h-top);g.fillRect(u*w+21,top,3,h-top);});
    // numbers: front on the chest, back between the shoulder blades (the back is split across the texture seam)
    const sy=(h/.82)/(w/.98);g.textAlign="center";g.textBaseline="middle";g.lineJoin="round";
    const draw=(x,y,size)=>{g.save();g.translate(x,y);g.scale(1,sy);g.font=`800 ${size}px 'Barlow Condensed','Arial Narrow',sans-serif`;g.lineWidth=size*.09;g.strokeStyle="rgba(0,0,0,.28)";g.strokeText(num,0,0);g.fillStyle=acc;g.fillText(num,0,0);g.restore();};
    const vy=v=>h*(1-v);if(num!==""&&num!=null){draw(w*.5,vy(.56),62);draw(0,vy(.56),96);draw(w,vy(.56),96);}
    // fabric: a faint mesh weave
    g.globalAlpha=.05;g.fillStyle="#000";for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1);g.globalAlpha=1;},true);}
/* jersey designs, drawn under the numbers. u runs round the body (front at .5), v from hem (0) to neck (1) */
function jerseyPattern(g,w,h,pat,acc){if(!pat||pat==="plain")return;const vy=v=>h*(1-v);g.save();
  if(pat==="band"){g.globalAlpha=.9;g.fillStyle=acc;g.fillRect(0,vy(.47),w,h*.05);g.globalAlpha=.45;g.fillRect(0,vy(.40),w,h*.015);}
  else if(pat==="sash"){g.globalAlpha=.55;g.fillStyle=acc;[[0,.5],[.5,1]].forEach(([a,b])=>{g.beginPath();g.moveTo(w*a,vy(.62));g.lineTo(w*(a+.1),vy(.62));g.lineTo(w*b,vy(.05));g.lineTo(w*(b-.1),vy(.05));g.closePath();g.fill();});}
  else if(pat==="bolt"){g.globalAlpha=.75;g.fillStyle=acc;[.25,.75].forEach(u=>{const x=u*w;g.beginPath();g.moveTo(x-6,vy(.64));g.lineTo(x+22,vy(.64));g.lineTo(x+4,vy(.38));g.lineTo(x+26,vy(.38));g.lineTo(x-14,vy(.02));g.lineTo(x-2,vy(.30));g.lineTo(x-22,vy(.30));g.closePath();g.fill();});}
  else if(pat==="chevron"){g.globalAlpha=.5;g.strokeStyle=acc;g.lineWidth=14;[.18,.3].forEach(v=>{for(const c of [0,.5,1]){g.beginPath();g.moveTo(w*(c-.18),vy(v+.1));g.lineTo(w*c,vy(v));g.lineTo(w*(c+.18),vy(v+.1));g.stroke();}});}
  else if(pat==="stripes"){g.globalAlpha=.16;g.fillStyle=acc;for(let x=0;x<w;x+=28)g.fillRect(x,0,10,h);}
  else if(pat==="fade"){const gr=g.createLinearGradient(0,vy(.65),0,vy(0));gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(1,acc);g.globalAlpha=.55;g.fillStyle=gr;g.fillRect(0,vy(.65),w,h*.65);}
  g.restore();}
function shortsTex(col,acc){const k="s"+col+acc;if(TEX[k])return TEX[k];
  return TEX[k]=G.canvasTex(256,256,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);g.fillStyle=acc;[.25,.75].forEach(u=>g.fillRect(u*w-5,0,10,h));
    g.globalAlpha=.08;g.fillStyle="#000";g.fillRect(0,0,w,h*.1);g.globalAlpha=1;},true);}
function hairTex(){if(TEX.hair)return TEX.hair;
  return TEX.hair=G.canvasTex(256,256,(g,w,h)=>{g.fillStyle="#c8c8c8";g.fillRect(0,0,w,h);
    for(let i=0;i<1400;i++){const x=Math.random()*w,l=10+Math.random()*40,b=150+Math.random()*105;g.strokeStyle=`rgb(${b},${b},${b})`;g.globalAlpha=.55;g.lineWidth=1+Math.random();g.beginPath();g.moveTo(x,Math.random()*h);g.lineTo(x+(Math.random()-.5)*4,Math.random()*h+l);g.stroke();}
    // wrap the strands so the texture tiles around the head
    const im=g.getImageData(0,0,24,h);g.globalAlpha=.5;g.putImageData(im,w-24,0);g.globalAlpha=1;},true);}

/* realistic court shoe: a low-cut volleyball shoe around each foot, sized from the foot bones (heel ~7.5 cm behind the
   ankle, toe ~6.5 cm past the toe joint, ~11 cm wide at the ball, up to the ankle; the rest-pose sole of the foot is
   6.7 cm off the floor, so the shoe fills that), with a flat sole, a sole wall and a slight
   toe spring; the front flexes with the toe bone. Built from a squared-off ellipsoid so it reads as a shoe, not a foot. */
function realShoeGeo(heads,col,sole){const parts=[];
  for(const S of ["L","R"]){const f=BI["foot."+S],t=BI["toe."+S],z0=heads[f*3+2],ax=heads[f*3],tx=heads[t*3],x0=ax-.078,x1=tx+.066,cx=(x0+x1)/2,rx=(x1-x0)/2;
    const g=G.sphere(1,48,28),P=g.p,n=P.length/3,c=new Float32Array(n*3),j=new Uint8Array(n*4),wt=new Uint8Array(n*4),SC=G.hex(col),SO=G.hex(sole);
    const sp=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);
    for(let v=0;v<n;v++){const x=P[v*3],y=P[v*3+1],zz=P[v*3+2],fr=(x+1)/2;   // fr: 0 heel .. 1 toe
      const wd=.046+.011*Math.sin(Math.PI*Math.min(1,fr*1.15))-.007*sm((fr-.85)/.15),top=.134-.034*sm((fr-.3)/.6)-.022*sm((fr-.86)/.14),sl=.03;
      const X=cx+sp(x,.5)*rx,Z=z0+sp(zz,.55)*wd+.006*fr*(S==="L"?-1:1);
      let Y=y>=0?sl+sp(y,.8)*(top-sl):sl*(1+sp(y,.35));Y=Math.max(.004,Y)+.014*sm((fr-.82)/.18)*(1-Math.max(0,y));
      P[v*3]=X;P[v*3+1]=Y;P[v*3+2]=Z;
      // outsole (sole colour), a light midsole wall, the upper, and a side stripe in the sole colour
      const out=1-sm((Y-.011)/.004),mid=1-sm((Y-.031)/.004),side=Math.abs(zz)>.55?sm(1-Math.abs((Y-(.05+.03*(1-fr)))/.007))*sm((fr-.22)/.08)*(1-sm((fr-.7)/.08)):0,MS=[.93,.93,.92];
      const cc=[0,1,2].map(i=>{let u=SC[i];u=u*(1-side)+SO[i]*side;u=u*(1-mid)+MS[i]*mid;return u*(1-out)+SO[i]*out;});c.set(cc,v*3);
      const tw=Math.round(255*sm((X-(tx-.03))/.06));j[v*4]=f;j[v*4+1]=t;wt[v*4]=255-tw;wt[v*4+1]=tw;}
    g.n=normals(P,g.i);g.c=c;g.j=j;g.w=wt;parts.push(g);}
  const a=parts[0],b=parts[1],n0=a.p.length/3,out=G.geo(new Float32Array([...a.p,...b.p]),new Float32Array([...a.n,...b.n]),new Uint16Array([...a.i,...Array.from(b.i,v=>v+n0)]));
  out.c=new Float32Array([...a.c,...b.c]);out.j=new Uint8Array([...a.j,...b.j]);out.w=new Uint8Array([...a.w,...b.w]);out.bs={c:[0,1,0],r:1.2};return out;}

/* realistic hair, grown from the scalp of the skin mesh: the skin triangles above a hairline (per style, by direction
   from the head centre: low at the nape, clear of the ears, a natural forehead line) pushed out along the normal by the
   hair thickness, thinning to nothing at the hairline. It carries the skin's bone weights, so it moves exactly with the head. */
const SCALP={};
function scalpHair(w,style){const key=style+w.lean+w.power+w.female;if(key in SCALP)return SCALP[key];
  if(style==="bald")return SCALP[key]=null;
  const sk=pieceGeo("skin",w,null,"",'real').skin,P=sk.p,N=sk.n,I=sk.i,n=P.length/3;
  let cx=0,cn=0;for(let v=0;v<n;v++)if(P[v*3+1]>1.8){cx+=P[v*3];cn++;}cx/=cn||1;const c=[cx,1.80,0];
  const A=Math.abs,L=(a,b,t)=>a+(b-a)*clamp(t,0,1);
  // hairline: elevation (deg) above which there is hair, by azimuth from the face (0) to the back (180)
  // hairline as a height on the head (m) by azimuth from the face (0) to the back (180): the brows sit at 1.82-1.84,
  // a natural forehead line ~5-6 cm above them, back over the temples, clear above the ears, down to the nape
  const seg=(pts)=>az=>{const x=A(az);for(let i=1;i<pts.length;i++)if(x<=pts[i][0])return L(pts[i-1][1],pts[i][1],(x-pts[i-1][0])/(pts[i][0]-pts[i-1][0]));return pts[pts.length-1][1];};
  const lines={short:seg([[0,1.897],[22,1.895],[48,1.877],[72,1.853],[100,1.849],[124,1.82],[150,1.752],[180,1.728]]),
    buzz:seg([[0,1.902],[22,1.9],[48,1.882],[72,1.858],[100,1.853],[124,1.826],[150,1.76],[180,1.735]]),
    long:seg([[0,1.896],[22,1.894],[48,1.868],[72,1.835],[100,1.812],[124,1.75],[150,1.705],[180,1.69]])};
  const line={short:lines.short,curly:lines.short,buzz:lines.buzz,long:lines.long,bun:lines.long,ponytail:lines.long}[style]||lines.short;
  const th={buzz:.0032,curly:.016,short:.011,long:.009,bun:.008,ponytail:.008}[style]||.011;
  const keep=new Uint8Array(n),off=new Float32Array(n),AZ=new Float32Array(n),EL=new Float32Array(n);
  for(let v=0;v<n;v++){const dx=P[v*3]-c[0],dy=P[v*3+1]-c[1],dz=P[v*3+2]-c[2],r=Math.hypot(dx,dy,dz);if(P[v*3+1]<1.62||r>.2)continue;
    const az=Math.atan2(dz,dx)*180/Math.PI,el=Math.asin(clamp(dy/r,-1,1))*180/Math.PI,d=P[v*3+1]-line(az);AZ[v]=az;EL[v]=el;
    // past the hairline the shell dips under the skin: the visible edge is then where the two surfaces cross, which
    // runs smoothly through the triangles instead of following their zig-zag edges
    if(d<-.03)continue;keep[v]=1;const u=sm((d+.012)/.03);off[v]=-.004*(1-u)+th*u*(1+.35*Math.max(0,dy/r));}
  const map=new Int32Array(n).fill(-1),ix=[];let m=0;
  for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],cc=I[t+2];if(!(keep[a]&&keep[b]&&keep[cc]))continue;for(const v of [a,b,cc])if(map[v]<0)map[v]=m++;ix.push(map[a],map[b],map[cc]);}
  if(!m)return SCALP[key]=null;
  const Q=new Float32Array(m*3),UV=new Float32Array(m*2),J=new Uint8Array(m*4),Wt=new Uint8Array(m*4);
  for(let v=0;v<n;v++){const k=map[v];if(k<0)continue;for(let j=0;j<3;j++)Q[k*3+j]=P[v*3+j]+N[v*3+j]*off[v];
    UV[k*2]=(AZ[v]+180)/360*3;UV[k*2+1]=(EL[v]+60)/150*2;for(let j=0;j<4;j++){J[k*4+j]=sk.j[v*4+j];Wt[k*4+j]=sk.w[v*4+j];}}
  const I2=new Uint16Array(ix),g=G.geo(Q,normals(Q,I2),I2,UV,null);g.j=J;g.w=Wt;g.bs={c:[0,1,0],r:1.2};
  const out=style==="curly"?curlGeo(g):g;
  // where the hair surface is (skin vertex -> outward offset), so a headband can sit on the hair rather than inside it
  out._scalp={P,N,keep,off:style==="curly"?off.map(x=>x>0?x+.02:x):off};
  return SCALP[key]=out;}
/* a headband on the realistic head: each band vertex is pushed out past the hair under it (or onto the skin where
   there is none), so the band wraps the hair instead of disappearing into it */
function fitBand(g,hair){const P=new Float32Array(g.p),n=P.length/3,S=hair&&hair._scalp;
  const N0=normals(P,g.i),PU=new Float32Array(n);
  for(let v=0;v<n;v++){let best=1e9,bo=0;if(S){for(let k=0;k<S.keep.length;k++){if(!S.keep[k])continue;const dx=S.P[k*3]-P[v*3],dy=S.P[k*3+1]-P[v*3+1],dz=S.P[k*3+2]-P[v*3+2],d=dx*dx+dy*dy+dz*dz;if(d<best){best=d;bo=S.off[k];}}}
    PU[v]=.0035+Math.max(0,bo);}
  // even the push out along the band (the hair under it is uneven), so the band stays a smooth strip
  const adj=Array.from({length:n},()=>[]);for(let t=0;t<g.i.length;t+=3)for(let a=0;a<3;a++)adj[g.i[t+a]].push(g.i[t+(a+1)%3],g.i[t+(a+2)%3]);
  for(let it=0;it<25;it++){const Q=PU.slice();for(let v=0;v<n;v++){let s2=0;for(const u of adj[v])s2+=PU[u];if(adj[v].length)Q[v]=Math.max(PU[v]*.3+s2/adj[v].length*.7,.0035);}PU.set(Q);}
  for(let v=0;v<n;v++)for(let j=0;j<3;j++)P[v*3+j]+=N0[v*3+j]*PU[v];
  const r=G.geo(P,normals(P,g.i),g.i,g.uv,null);r.j=g.j;r.w=g.w;r.bs=g.bs;return r;}

/* ---------- realistic athlete ----------
   The MakeHuman body exactly as rigged (no bone scaling), its own head and face, eyes with iris and pupil, hair, headband
   and shoe pieces fitted to the head and feet in Blender, physically lit materials (no toon bands, no ink outlines). */
function buildReal(o,w,heads,root,body){
  const mix=(a,b,t)=>{const A=G.hex(a),B=G.hex(b);return A.map((v,i)=>v+(B[i]-v)*t);};
  // gain: the scenes are lit for the comic look, which ignores light strength; lit materials need a little less of it
  const M=(c,r,extra)=>G.mat(Object.assign({color:c,rough:r==null?.6:r,rim:.12,gain:.8},extra||{}));
  const bandCol={white:"#ffffff",black:"#1a1a22",orange:"#ff7a1a",team:o.jersey}[o.headband]||"#ffffff";
  // lighter skin tones lose their colour first under strong light, so the skin's light gain falls with its brightness
  const lum=G.hex(o.skin).reduce((a,v)=>a+v,0)/3;
  const mt={skin:M(o.skin,.52,{wrap:.38,sheen:.1,rim:.1,vcolor:true,gain:.74-.14*sm((lum-.45)/.4)}),
    jersey:M("#ffffff",.8,{map:jerseyTex(o.jersey,o.accent,String(o.number==null?"":o.number),o.pattern),sheen:.28,rim:.08,wrap:.1}),
    shorts:M("#ffffff",.76,{map:shortsTex(o.shorts,o.accent),sheen:.3,rim:.08,wrap:.1}),hair:M(o.hair,.6,{map:hairTex(),sheen:.4,rim:.14,double:true,polyOffset:true}),
    hairx:M(o.hair,.64,{sheen:.25,rim:0,gain:.7}),shoe:M(o.shoe,.48,{sheen:.15}),shoeV:M("#ffffff",.5,{sheen:.12,vcolor:true}),sole:M(o.sole,.75),pad:M({white:"#f1f0f5",orange:"#ff7a1a"}[o.pads]||"#1d1b29",.82,{sheen:.25}),
    sock:M(/^#[0-9a-f]{6}$/i.test(o.sockColor)?o.sockColor:"#f2f2f5",.9,{sheen:.3}),band:M(bandCol,.8,{sheen:.3}),
    beard:M(o.beard==="stubble"?mix(o.skin,mix(o.hair,"#000000",.55),.4):mix(o.hair,o.skin,.1),.9,{polyOffset:o.beard==="stubble",sheen:.15}),sleeve:M(o.sleeveColor||"#17144d",.65,{sheen:.35}),
    eye:M("#f3efe8",.18,{rim:0}),iris:M(o.eyes||"#5b3a24",.25,{rim:0}),pupil:M("#09090b",.15,{rim:0}),accent:M(o.accent,.7)};
  // skin colour: the base mesh's vertex colours (lips, a little warmth) and the brow mask blended toward the hair colour
  const sk=G.hex(o.skin),br=G.hex(mix(o.hair,"#000000",.3));
  const covBits=D.covBits||[],worn=new Set(["shorts","shoes",o.cut==="sleeveless"?"jersey_sleeveless":"jersey_short"]);
  if(o.socks==="crew"||o.socks==="high")worn.add("socks_"+o.socks);if(o.pads!=="none")worn.add("kneepads");
  if(o.sleeve==="both"){worn.add("armsleeve.L");worn.add("armsleeve.R");}else if(o.sleeve==="hit")worn.add(o.lefty?"armsleeve.L":"armsleeve.R");
  let wm=0;covBits.forEach((b,i)=>{if(worn.has(b))wm|=1<<i;});const sr=raw("skin"),cv=sr&&sr.cov;
  const skinKeep=(P,a,b,c)=>Math.max(P[a*3+1],P[b*3+1],P[c*3+1])>.105&&!(cv&&wm&&(cv[a]&wm)&&(cv[b]&wm)&&(cv[c]&wm));
  const pieces=[["skin",skinKeep,"c"+wm],["shorts",(P,a,b,c)=>Math.min(P[a*3+1],P[b*3+1],P[c*3+1])<1.13,"w"],[o.cut==="sleeveless"?"jersey_sleeveless":"jersey_short"],
    ["eye.L"],["eye.R"]];
  if(o.socks==="crew")pieces.push(["socks_crew"]);else if(o.socks==="high")pieces.push(["socks_high"]);
  if(o.pads!=="none")pieces.push(["kneepads"]);
  if(o.sleeve==="both")pieces.push(["armsleeve"]);
  else if(o.sleeve==="hit"){const right=!o.lefty;pieces.push(["armsleeve",(P,a,b,c)=>(P[a*3+2]+P[b*3+2]+P[c*3+2]>0)===right,right?"R":"L"]);}
  const bd={stubble:"beard_stubble",beard:"beard_full",moustache:"beard_moustache",goatee:"beard_goatee"}[o.beard];if(bd)pieces.push([bd]);
  // hair: the fitted shells (short, buzz, a close cap under long hair, buns and ponytails), plus volumes for the long styles
  if(o.headband!=="none"&&o.style!=="bald")pieces.push(["headband_thin"]);
  const skinRowsBuf=new Float32Array(G.MAXB*12),meshes=[];
  const skinObj={dq:true,compute(){return skinRowsBuf;}};
  const addMesh=(geo,mat)=>{const n=new Node(geo,mat);n.castShadow=true;n.skin=skinObj;n.userData.athlete=root;body.add(n);meshes.push(n);return n;};
  for(const [name,keep,tag] of pieces){const gs=pieceGeo(name,w,keep,tag,"real");if(!gs)continue;
    for(const mat in gs){let g=gs[mat];
      if(name==="skin"&&g.rawC){const C=g.rawC,n=C.length/4,c=new Float32Array(n*3);
        // the base mesh's lip tint is a cool pink that turns purple under the arena's blue fill: warm it toward a natural lip
        const LIP=[.93,.73,.68];
        for(let v=0;v<n;v++){const a=C[v*4+3]/255*.85,t=clamp((1-C[v*4+1]/255)/.235,0,1);for(let k=0;k<3;k++)c[v*3+k]=(1-t+t*LIP[k])*(1-a)+a*(br[k]/Math.max(.05,sk[k]));}
        g=Object.assign({},g,{c,bufs:null,buf:null});}
      if(name==="hair_short"&&o.style==="curly")g=g._curl||(g._curl=curlGeo(g));
      if(name.startsWith("headband")){addMesh(g._fit&&g._fit[o.style]||((g._fit=g._fit||{})[o.style]=fitBand(g,scalpHair(w,o.style))),mt.band);continue;}
      addMesh(g,mt[mat]||mt.skin);}}
  const hs=scalpHair(w,o.style);if(hs)addMesh(hs,mt.hair);
  addMesh(realShoeGeo(heads,o.shoe,o.sole),mt.shoeV);
  const hx=hairExtra(o.style,heads);if(hx)addMesh(hx,mt.hairx);
  const k=o.height/REAL_H;root.scl=[k,k,k];
  const pelvis={pos:[0,1,0]};
  return {root,body,meshes,opts:o,mats:mt,lefty:!!o.lefty,heads,pelvis,skinRows:skinRowsBuf,W:null,art:"real"};}

/* ---------- build ---------- */
function build(o){o=Object.assign({jersey:"#ec3b52",accent:"#ffffff",shorts:"#17144d",skin:"#c98d68",hair:"#2b1d16",shoe:"#f4f2ee",sole:"#17144d",number:7,lefty:false,height:1.9,
    style:"short",build:"athletic",frame:"male",beard:"none",art:ART_DEFAULT,headband:"white",sleeve:"none",sleeveColor:"#17144d",pads:"black",socks:"crew",cut:"short",kit:"club",sockColor:"#f2f2f5",pattern:"plain",shortsColor:""},o||{});
  if(/^#[0-9a-f]{6}$/i.test(o.shortsColor||""))o.shorts=o.shortsColor;
  /* kits: "crow" is black with orange numbers and piping, "guardian" is the orange libero top; both override the team colour */
  if(o.kit==="crow"){o.jersey="#141317";o.accent="#ff7a1a";o.shorts="#141317";}
  else if(o.kit==="guardian"){o.jersey="#ff7a1a";o.accent="#141317";o.shorts="#141317";}
  else if(o.kit==="fearless"){o.jersey="#f4f1ea";o.accent="#ff7a1a";o.shorts="#141317";if(o.pattern==="plain")o.pattern="bolt";}
  const art=artOf(o);o.art=art;
  const w=shapeW(o),heads=headsFor(w),root=new Node(),body=new Node();root.add(body);heads._st=STY[art];
  if(art==="real")return buildReal(o,w,heads,root,body);
  const mix=(a,b,t)=>{const A=G.hex(a),B=G.hex(b);return A.map((v,i)=>v+(B[i]-v)*t);};
  const M=(c,r,extra)=>G.mat(Object.assign({color:c,rough:r==null?.6:r,toon:true,ink:true,inkColor:INK},extra||{}));
  const bandCol={white:"#ffffff",black:"#1a1a22",orange:"#ff7a1a",team:o.jersey}[o.headband]||"#ffffff";
  const mt={skin:M(o.skin,.5,{wrap:.45,rim:.4,vcolor:true}),jersey:M("#ffffff",.85,{map:jerseyTex(o.jersey,o.accent,String(o.number==null?"":o.number),o.pattern),sheen:.45,rim:.32,wrap:.15}),
    shorts:M("#ffffff",.82,{map:shortsTex(o.shorts,o.accent),sheen:.4,rim:.3,wrap:.15}),hair:M(o.hair,.72,{map:hairTex(),sheen:.4,rim:.35}),hairx:M(o.hair,.8,{sheen:.22,rim:.15}),
    shoe:M(o.shoe,.45),sole:M(o.sole,.7),pad:M({white:"#f1f0f5",orange:"#ff7a1a"}[o.pads]||"#1d1b29",.85,{sheen:.2}),sock:M(/^#[0-9a-f]{6}$/i.test(o.sockColor)?o.sockColor:"#f2f2f5",.9),band:M(bandCol,.7),
    beard:M(o.beard==="stubble"?mix(o.skin,o.hair,.5):mix(o.hair,o.skin,.12),.95,{polyOffset:o.beard==="stubble",rim:.2,sheen:.1}),sleeve:M(o.sleeveColor||"#17144d",.7),
    eye:M(INK,.25,{ink:false}),iris:M(INK,.3,{ink:false}),pupil:M(INK,.2,{ink:false}),accent:M(o.accent,.7)};
  mt.beard.ink=o.beard!=="stubble";
  // brows: the skin's vertex colour blends toward the hair colour where the brow mask is
  const sk=G.hex(o.skin),br=G.hex(mix(o.hair,"#000000",.25));
  // skin under worn clothing is dropped so it can't poke through when the body bends
  const covBits=D.covBits||[],worn=new Set(["shorts","shoes",o.cut==="sleeveless"?"jersey_sleeveless":"jersey_short"]);
  if(o.socks==="crew"||o.socks==="high")worn.add("socks_"+o.socks);if(o.pads!=="none")worn.add("kneepads");
  if(o.sleeve==="both"){worn.add("armsleeve.L");worn.add("armsleeve.R");}else if(o.sleeve==="hit")worn.add(o.lefty?"armsleeve.L":"armsleeve.R");
  let wm=0;covBits.forEach((b,i)=>{if(worn.has(b))wm|=1<<i;});const sr=raw("skin"),cv=sr&&sr.cov;
  const skinKeep=(P,a,b,c)=>Math.max(P[a*3+1],P[b*3+1],P[c*3+1])>.105&&Math.min(P[a*3+1],P[b*3+1],P[c*3+1])<1.676&&!(cv&&wm&&(cv[a]&wm)&&(cv[b]&wm)&&(cv[c]&wm));
  const pieces=[["skin",skinKeep,"c"+wm],["shorts",(P,a,b,c)=>Math.min(P[a*3+1],P[b*3+1],P[c*3+1])<1.13,"w"],[o.cut==="sleeveless"?"jersey_sleeveless":"jersey_short"]];
  if(o.socks==="crew")pieces.push(["socks_crew"]);else if(o.socks==="high")pieces.push(["socks_high"]);
  if(o.pads!=="none")pieces.push(["kneepads"]);
  if(o.sleeve==="both")pieces.push(["armsleeve"]);
  else if(o.sleeve==="hit"){const right=!o.lefty;pieces.push(["armsleeve",(P,a,b,c)=>(P[a*3+2]+P[b*3+2]+P[c*3+2]>0)===right,right?"R":"L"]);}

  const bd={stubble:"beard_stubble",beard:"beard_full",moustache:"beard_moustache",goatee:"beard_goatee"}[o.beard];if(bd)pieces.push([bd]);
  const skinRowsBuf=new Float32Array(G.MAXB*12),meshes=[];
  const skinObj={compute(){return skinRowsBuf;}};
  const addMesh=(geo,mat)=>{const n=new Node(geo,mat);n.castShadow=true;n.skin=skinObj;n.userData.athlete=root;body.add(n);meshes.push(n);return n;};
  for(const [name,keep,tag] of pieces){const gs=pieceGeo(name,w,keep,tag);if(!gs)continue;
    for(const mat in gs){let g=gs[mat];
      if(name==="skin"&&g.rawC){const C=g.rawC,n=C.length/4,c=new Float32Array(n*3);for(let v=0;v<n;v++){const a=0;for(let k=0;k<3;k++){const base=1;c[v*3+k]=base*(1-a)+a*(br[k]/Math.max(.05,sk[k]));}}
        g=Object.assign({},g,{c,bufs:null,buf:null});}
      if(name==="hair_short"&&o.style==="curly")g=g._curl||(g._curl=curlGeo(g));
      addMesh(g,mt[mat]||mt.skin);}}
  const hg=hairGeo(w,o.style);if(hg)addMesh(hg,M(o.hair,.7,{double:true,inkW:1.1}));
  if(o.headband!=="none"&&o.style!=="bald")addMesh(bandGeo(w,o.style==="buzz"),M(bandCol,.7,{double:true}));
  addMesh(headGeo(w),M(o.skin,.5,{wrap:1.5,rim:.4}));   // faces stay mostly lit, as in anime
  const hx=hairBits(w,o.style);if(hx)addMesh(hx,M(o.hair,.7));
  addMesh(faceGeo(w,o.skin,o.eyes),M("#ffffff",.6,{vcolor:true,ink:false}));
  addMesh(shoeGeo(heads,G.hex(o.shoe),G.hex(o.sole)),M("#ffffff",.5,{vcolor:true}));
  root.scl=[o.height/1.9*GS,o.height/1.9*GS,o.height/1.9*GS];
  const pelvis={pos:[0,1,0]};
  return {root,body,meshes,opts:o,mats:mt,lefty:!!o.lefty,heads,pelvis,skinRows:skinRowsBuf,W:null,art:"anime"};}

/* ---------- runtime layers on top of the baked clip ---------- */
const TMPP={q:new Float32Array(NB*4),root:[0,0,0]};
/* eyes on the ball: turn neck and head toward a target (clip-space point), split 35 / 65 */
function lookAt(P,W,heads,target,k){const ch=BI.chest,hq=W.q.subarray(BI.head*4,BI.head*4+4),hp=[W.p[BI.head*3],W.p[BI.head*3+1]+.1,W.p[BI.head*3+2]];
  const d=[target[0]-hp[0],target[1]-hp[1],target[2]-hp[2]],cq=W.q.subarray(ch*4,ch*4+4),ci=qconj(cq),dl=qrot(ci,d,[0,0,0]);
  const yaw=clamp(Math.atan2(-dl[2],dl[0]),-1.2,1.2),pit=clamp(Math.atan2(dl[1],Math.hypot(dl[0],dl[2])),-.7,.8);
  // current head forward in chest space
  const hf=qrot(ci,qrot(hq,[1,0,0],[0,0,0]),[0,0,0]),cy=Math.atan2(-hf[2],hf[0]),cp=Math.atan2(hf[1],Math.hypot(hf[0],hf[2]));
  const back=1-sm((Math.abs(Math.atan2(-dl[2],dl[0]))-1.8)/.6);let dy=(yaw-cy)*k*back,dp=(pit-cp)*k*back;
  const apply=(b,f)=>{const o=b*4,q=P.q.subarray(o,o+4),r1=qaxis([0,1,0],dy*f),r2=qaxis([0,0,1],dp*f),t=qmul(r1,r2,[0,0,0,0]);qmul(q,t,q);const l=Math.hypot(q[0],q[1],q[2],q[3]);for(let i=0;i<4;i++)q[i]/=l;};
  apply(BI.neck,.35);apply(BI.head,.65);}
function addRot(P,b,axis,a){if(!a)return;const o=b*4,q=P.q.subarray(o,o+4);qmul(q,qaxis(axis,a),q);}
/* effort per clip: where the legs drive (pelvis upward acceleration) and around ball contact -> mouth opens, breath follows */
function effortOf(clip){if(clip._eff)return clip._eff;const n=clip.n,dt=1/clip.fps,R=clip.root,E=new Float32Array(n),F=new Float32Array(n);
  const y=i=>R[(((i%n)+n)%n)*3+1];let e=0,f=0;const kE=Math.exp(-dt/.28),kF=Math.exp(-dt/2.4);
  for(let r=0;r<2;r++)for(let i=0;i<n;i++){const ay=(y(i+1)-2*y(i)+y(i-1))/(dt*dt),t=i*dt,cd=clip.contact==null?9:Math.abs(t-clip.contact);
    const drive=Math.min(1,Math.max(0,ay-6)/30+Math.exp(-((cd/.12)**2))*.9);e=Math.max(drive,e*kE);f=Math.max(e*.8,f*kF);if(r)E[i]=e,F[i]=f;}
  return clip._eff={E,F};}

/* full pose for a player at time t (clip pose + runtime layers), written into a.W and the skin matrices */
function posePlayer(a,clip,t,opt){const P=pose(clip,t,a.lefty,TMPP);opt=opt||{};P.reach=a.reach?a.reach(t):null;
  if(opt.clock!=null){const ef=effortOf(clip),i=Math.floor((((t%clip.dur)+clip.dur)%clip.dur)*clip.fps)%clip.n,fat=ef.F[i],e=ef.E[i];
    const br=Math.sin(opt.clock*(1.7+3*fat)),amp=.012+.03*fat*(1-Math.min(1,e*1.5));
    addRot(P,BI.chest,[0,0,1],br*amp*.6);addRot(P,BI.neck,[0,0,1],-br*amp*.4);
    addRot(P,BI.jaw,[0,0,1],-(Math.max(e,fat*.5*(.6+.4*br)))*.16);}
  let W=fk(P,a.heads,a.W);a.W=W;
  if(opt.look&&opt.look.k>.001){lookAt(P,W,a.heads,opt.look.p,opt.look.k);W=fk(P,a.heads,a.W);}
  skinRows(W,a.heads,a.skinRows);a.pelvis.pos=[W.p[0],W.p[1],W.p[2]];return W;}

/* ---------- public helpers ---------- */
function sample(clip,t,lefty,a){const P=pose(clip,t,lefty,{q:new Float32Array(NB*4),root:[0,0,0]}),q=P.q.subarray(0,4),KXZ=stOf(a&&a.heads).kxz;
  const f=qrot(q,[1,0,0],[0,0,0]);let lab="";(clip.labels||[]).forEach(l=>{if(t>=l[0])lab=l[1];});
  return {x:P.root[0]*KXZ,y:P.root[1]*KXZ,z:P.root[2]*KXZ,yaw:Math.atan2(-f[2],f[0])*180/Math.PI,label:lab,t};}
const handPt=(W,heads,S,lefty)=>{const b=BI["hand."+S],q=W.q.subarray(b*4,b*4+4),hx=heads[b*3],tl=[TAILS[b*3]-hx,TAILS[b*3+1]-heads[b*3+1],TAILS[b*3+2]-heads[b*3+2]];
  const c=qrot(q,smul(b,[tl[0]*.55,tl[1]*.55,tl[2]*.55],null,stOf(heads).SB),[0,0,0]);const n=qrot(q,PALM[S],[0,0,0]);
  return {p:[W.p[b*3]+c[0],W.p[b*3+1]+c[1],W.p[b*3+2]+c[2]],n};};
/* where the ball sits against the body at time t (clip space, before the player's root transform) */
function handAt(a,clip,t,which){const W=fk(pose(clip,t,a.lefty,{q:new Float32Array(NB*4),root:[0,0,0]}),a.heads);const R=.105;
  if(which==="both"){const l=handPt(W,a.heads,"L",a.lefty),r=handPt(W,a.heads,"R",a.lefty),n=V3.norm(V3.add(l.n,r.n));return V3.add(V3.lerp(l.p,r.p,.5),V3.sc(n,R+.01));}
  if(which==="platform"){const pt=S=>{const e=BI["forearm."+S],h=BI["hand."+S];return V3.lerp([W.p[e*3],W.p[e*3+1],W.p[e*3+2]],[W.p[h*3],W.p[h*3+1],W.p[h*3+2]],.72);};
    const l=handPt(W,a.heads,"L",a.lefty),r=handPt(W,a.heads,"R",a.lefty),n=V3.norm(V3.add(l.n,r.n));return V3.add(V3.lerp(pt("L"),pt("R"),.5),V3.sc(n,R+.035));}
  const k=(which==="pancake"||which==="R"||!which)?(a.lefty?"L":"R"):(a.lefty?"R":"L");const h=handPt(W,a.heads,k,a.lefty);
  if(which==="pancake")return V3.add(h.p,V3.sc(h.n,-(R+.02)));
  return V3.add(h.p,V3.sc(h.n,R+.012));}

/* ---------- player = athlete + clip + ball ---------- */
function player(o){const a=build(o),clipName=o.clip||"ready",clip=CLIPS[clipName]||CLIPS.ready;let t=o.t0||0;
  const LK=(VB.locker&&o.ballKind===undefined)?VB.locker():{ball:o.ballKind||"classic",fx:o.fx||"trail"},ballN=o.ball===false?null:new Node(VB.Athlete.ballGeo(),VB.Athlete.ballMatKind?VB.Athlete.ballMatKind(LK.ball,o.fxColor||o.jersey):VB.Athlete.ballMat());if(ballN){ballN.mat=Object.assign({},ballN.mat,{toon:true,ink:true,inkColor:G.hex(INK)});ballN.scl=[1/GS,1/GS,1/GS];ballN.castShadow=true;a.root.add(ballN);}
  const fx=ballN&&o.trail!==false&&VB.BallFX?VB.BallFX(a.root,o.fx||LK.fx,o.fxColor||o.trailColor||o.jersey):null;let prevT=t;
  // ball paths are written for a right-hander and mirrored for lefties in update(), so the hand points they aim at are
  // given back in right-handed space (the serves are the exception: their ball is not mirrored)
  const mz=a.lefty&&!/^(serve|float|jumpfloat)$/.test(clipName)?(v=>[v[0],v[1],-v[2]]):(v=>v);
  const hc={},hl={},HZ=120,hs=(cache,S,tt)=>{const f=tt*HZ,k=Math.floor(f),u=f-k,g=j=>cache[j]||(cache[j]=mz(handAt(a,clip,j/HZ,S)));const p=g(k),q=g(k+1);return [p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u,p[2]+(q[2]-p[2])*u];},
    h={tc:clip.contact,contact:[0,2.8,0],hand:tt=>hs(hc,"R",tt),left:tt=>hs(hl,"L",tt)};
  if(clip.contact!=null)h.contact=mz(handAt(a,clip,clip.contact,clip.hand||"R"));
  let label="",clock=Math.random()*10,lookAtP=null,lastT=null,blendFrom=null,bt=0,lastNow=0;
  // eyes on the ball, eased: the gaze point follows the target with a short lag (~60 ms) and the head turns in and out
  // over ~120 ms when the ball appears, leaves or the target changes, instead of snapping between frames
  const gaze={p:null,k:0};
  function gazeStep(T,dt,jump){const want=T?.8:0;if(jump||!(dt>0)){gaze.k=want;if(T)gaze.p=T.slice();return;}
    gaze.k+=(want-gaze.k)*(1-Math.exp(-dt/.12));if(T){if(!gaze.p)gaze.p=T.slice();else{const f=1-Math.exp(-dt/.06);for(let i=0;i<3;i++)gaze.p[i]+=(T[i]-gaze.p[i])*f;}}}
  const natural=o.natural!==false;
  function update(dt){t=(t+dt)%clip.dur;clock+=dt||1/60;let b=o.ballFn?o.ballFn(t,h):clip.ball?clip.ball(t,h):null;if(b&&!o.ballFn&&a.lefty&&!/^(serve|float|jumpfloat)$/.test(clipName))b=[b[0],b[1],-b[2]];
    const now=performance.now(),real=lastNow?Math.min(.1,(now-lastNow)/1000):0;lastNow=now;
    // when the clip time jumps (scrubbing, a scene restart), blend from the previous skeleton instead of snapping
    if(lastT!=null){let d=Math.abs(t-lastT-(dt||0));d=Math.min(d,clip.dur-d);if(d>.08&&a.W){blendFrom={q:Float32Array.from(a.W.q),p:Float32Array.from(a.W.p)};bt=0;}}
    gazeStep(lookAtP||b,dt>0?dt:(lastT!=null?clamp(t-lastT,0,.1):0),blendFrom&&bt===0);const W=posePlayer(a,clip,t,natural?{clock,look:gaze.p?gaze:null}:{});
    if(blendFrom){bt+=Math.max(dt||0,real);const k=sm(bt/.3);if(k>=1)blendFrom=null;else{for(let i=0;i<NB;i++){const o4=i*4;let d=0;for(let j=0;j<4;j++)d+=W.q[o4+j]*blendFrom.q[o4+j];const s=d<0?-1:1;let l=0;
          for(let j=0;j<4;j++){W.q[o4+j]=blendFrom.q[o4+j]*s*(1-k)+W.q[o4+j]*k;l+=W.q[o4+j]*W.q[o4+j];}l=Math.sqrt(l);for(let j=0;j<4;j++)W.q[o4+j]/=l;
          for(let j=0;j<3;j++)W.p[i*3+j]=blendFrom.p[i*3+j]*(1-k)+W.p[i*3+j]*k;}skinRows(W,a.heads,a.skinRows);a.pelvis.pos=[W.p[0],W.p[1],W.p[2]];}}
    lastT=t;let lab="";(clip.labels||[]).forEach(l=>{if(t>=l[0])lab=l[1];});label=lab;
    if(ballN){if(b){ballN.visible=true;ballN.pos=b;ballN.rot=[t*9,t*4,0];}else ballN.visible=false;
      if(fx){const c=clip.contact,hit=c!=null&&((prevT<=c&&t>c)||(prevT>t&&(t>c||prevT<=c)));fx.update(dt||0,b,hit);}prevT=t;}
    return {x:a.pelvis.pos[0],y:a.pelvis.pos[1],z:a.pelvis.pos[2],label};}
  update(0);
  return {a,root:a.root,clip,update,look(v){lookAtP=v;},snap(){blendFrom=null;lastT=null;gaze.k=0;gaze.p=null;},get t(){return t;},set t(v){t=v;},get label(){return label;},get frac(){return t/clip.dur;},ball:ballN};}

/* ---------- the net: players never touch it ----------
   keepOffNet moves a player back from the net until no joint touches its mesh during the whole clip (below 1.4 m nothing
   can; inside the net's height keep a clearance; above the tape only a blocker's hands may go over). blockerArms adds an arm
   IK layer: hands held just behind the net before the block, up and over the tape at the block, back on the way down. */
const toWorldP=(p,pt)=>{const r=p.root,s=r.scl[0],c=Math.cos(r.rot[1]||0),sn=Math.sin(r.rot[1]||0),x=pt[0]*s,z=pt[2]*s;return [r.pos[0]+c*x+sn*z,r.pos[1]+pt[1]*s,r.pos[2]-sn*x+c*z];};
const toLocalP=(p,w)=>{const r=p.root,s=r.scl[0],c=Math.cos(r.rot[1]||0),sn=Math.sin(r.rot[1]||0),x=w[0]-r.pos[0],z=w[2]-r.pos[2];return [(c*x-sn*z)/s,(w[1]-r.pos[1])/s,(sn*x+c*z)/s];};
const ARMRE=/^(upperarm|forearm|forearmTwist|hand|thumb|fingers)/,UPPER=/^(upperarm|forearm)\./;
function keepOffNet(p,o){o=o||{};const NET=o.net||2.43,blocker=!!o.blocker,c=p.clip,dir=Math.cos(p.root.rot[1]||0)>0?1:-1;let worst=-9;
  for(let t=0;t<c.dur;t+=.02){const Wp=fk(pose(c,t,p.a.lefty),p.a.heads).p;
    for(let b=0;b<NB;b++){const arm=ARMRE.test(BN[b]);if(blocker&&arm&&!UPPER.test(BN[b]))continue;
      const w=toWorldP(p,[Wp[b*3],Wp[b*3+1],Wp[b*3+2]]),x=w[0]*dir,band=w[1]>1.4&&w[1]<NET+.03;
      const lim=w[1]<=1.4?-.06:band?(arm?(blocker?-.12:-.1):(blocker?-.2:-.14)):(blocker&&arm?9:-.06);if(x-lim>worst)worst=x-lim;}}
  if(worst>0||o.snap)p.root.pos[0]-=worst*dir;return worst;}
function blockerArms(p,o){o=o||{};const NET=o.net||2.43,tC=o.tC!=null?o.tC:p.clip.contact,BR=.105,dir=Math.cos(p.root.rot[1]||0)>0?1:-1;
  const W3=(Wp,b)=>toWorldP(p,[Wp[b*3],Wp[b*3+1],Wp[b*3+2]]);
  p.a.reach=t=>{const Wp=fk(pose(p.clip,t,p.a.lefty),p.a.heads).p,out={k:1},kb=sm((t-(tC-.3))/.16)*(1-sm((t-(tC+.5))/.25)),back=sm((t-(tC+.08))/.22);let any=false;
    const zm=(W3(Wp,BI["hand.L"])[2]+W3(Wp,BI["hand.R"])[2])/2;
    for(const S of ["L","R"]){const w=W3(Wp,BI["hand."+S]);let tx=w[0],ty=w[1];
      w[2]=w[2]+((zm+Math.sign(w[2]-zm)*.12)-w[2])*kb;            // a seal: hands a ball's width apart at the block
      if(w[1]>1.3&&w[0]*dir>-.28){tx=-.28*dir;any=true;}  // fingers reach ~15 cm past the hand joint
      if(kb>0){const ox=(.06*(1-back)-.3*back)*dir,oy=NET+.3-back*.45;tx=tx+(ox-tx)*kb;ty=ty+(oy-ty)*kb;any=true;}
      // hands only cross the plane of the net above the tape: if the arm can't get the hand up there yet, it stays behind
      const Sw=W3(Wp,BI["upperarm."+S]),Ew=W3(Wp,BI["forearm."+S]),len=V3.len(V3.sub(Ew,Sw))+V3.len(V3.sub(w,Ew)),d=[tx-Sw[0],ty-Sw[1],w[2]-Sw[2]],dl=V3.len(d);
      const ry=dl>len?Sw[1]+d[1]/dl*len:ty,rx=dl>len?Sw[0]+d[0]/dl*len:tx;
      if(ry<NET+.12&&ry>1.3&&rx*dir>-.28){tx=-.28*dir;ty=Math.min(ty,ry);}
      out[S]=toLocalP(p,[tx,ty,w[2]]);}
    return any?out:null;};
  // where the ball meets the palms at the block (if the hands are still behind the net it comes over the tape to them)
  return ()=>{const P=pose(p.clip,tC,p.a.lefty);P.reach=p.a.reach(tC);const Wp=fk(P,p.a.heads).p,L=W3(Wp,BI["hand.L"]),R=W3(Wp,BI["hand.R"]);
    const hx=(L[0]+R[0])/2*dir,hy=(L[1]+R[1])/2;return [(hx+BR+.02)*dir,Math.max(hy+.06,NET+BR+.04),(L[2]+R[2])/2];};}
/* pose the athlete from world-space bone rotations (quaternions, model space) and a root position: used by the exercise demos */
function applyWorld(a,Wq,root){const W=place({q:Wq,p:new Float32Array(NB*3)},a.heads,root);
  a.W=W;skinRows(W,a.heads,a.skinRows);a.pelvis.pos=[W.p[0],W.p[1],W.p[2]];return W;}
let _bg=null,_bt=null;
VB.Athlete={KXZ,kxzOf:a=>stOf(a&&a.heads).kxz,ART_DEFAULT,keepOffNet,blockerArms,toWorld:toWorldP,toLocal:toLocalP,build,sample,CLIPS,player,handAt,effortOf,pose,fk,BONES:BN,BI,PARENTS:BP,SEG:D.bones.seg||{},applyWorld,qmul,qrot,
  ballGeo(){return _bg||(_bg=G.sphere(.105,28,20));},
  ballMat(){if(!_bt)_bt=G.canvasTex(256,128,(g,w,h)=>{g.fillStyle="#f6f3ea";g.fillRect(0,0,w,h);[["#f5c518",0],["#1f4fae",h/3]].forEach(([c,y0])=>{g.fillStyle=c;g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,y0+h/6+Math.sin(x/w*Math.PI*4)*h/7);for(let x=w;x>=0;x-=4)g.lineTo(x,y0+h/3+Math.sin(x/w*Math.PI*4)*h/7);g.fill();});g.strokeStyle="rgba(0,0,0,.28)";g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,i*h/6+h/12+Math.sin(x/w*Math.PI*4)*h/7);g.stroke();}});
    return G.mat({map:_bt,rough:.45});},
  forPos:{outside:"spike",opposite:"serve",middle:"block",setter:"set",libero:"dig",any:"spike"},byTech:{float:"float",jump_float:"jumpfloat",jumpserve:"serve",spike:"spike",tip_roll:"tip",roll_shot:"roll",cut_shot:"cut",quick_attack:"quick",shoot_go:"shoot",tool_shot:"spike",line_cross:"spike",slide:"slide",back_row_attack:"pipe",bic_pipe:"pipe",setter_dump:"dump",block:"block",swing_block:"block",dig:"dig",sprawl_pancake:"sprawl",collapse_dig:"collapse",side_dive:"sidedive",overhead_pass:"tomahawk",overhead_dig:"tomahawk",jump_set:"set",set:"set",back_set:"set"}};
})();
