/* gl.js: a small WebGL engine for this site. Scene graph, lit materials, canvas textures, planar shadows,
   picking, orbit camera. Written for this app so every 3D view works without an outside library. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
/* ---------- math (column-major 4x4) ---------- */
const TMP=new Float32Array(16);
const M4={
  id(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m;},
  mul(a,b,o){o=o||new Float32Array(16);const r=TMP;
    for(let c=0;c<4;c++)for(let rr=0;rr<4;rr++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+rr]*b[c*4+k];r[c*4+rr]=s;}o.set(r);return o;},
  persp(fov,asp,n,f){const t=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m;},
  lookAt(e,c,u){let z=norm(sub(e,c)),x=norm(cross(u||[0,1,0],z));if(len(x)<1e-6)x=[1,0,0];const y=cross(z,x),m=new Float32Array(16);
    m[0]=x[0];m[4]=x[1];m[8]=x[2];m[1]=y[0];m[5]=y[1];m[9]=y[2];m[2]=z[0];m[6]=z[1];m[10]=z[2];m[12]=-dot(x,e);m[13]=-dot(y,e);m[14]=-dot(z,e);m[15]=1;return m;},
  inv(m){const a=m,o=new Float32Array(16);
    const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],
      b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
    let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;if(!d)return M4.id();d=1/d;
    o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
    o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
    o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
    o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d;return o;},
  rx(a){const m=M4.id(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;},
  ry(a){const m=M4.id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;},
  rz(a){const m=M4.id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;},
  xf(m,v,w){const x=v[0],y=v[1],z=v[2];if(w===0)return [m[0]*x+m[4]*y+m[8]*z,m[1]*x+m[5]*y+m[9]*z,m[2]*x+m[6]*y+m[10]*z];
    const ww=m[3]*x+m[7]*y+m[11]*z+m[15]||1;return [(m[0]*x+m[4]*y+m[8]*z+m[12])/ww,(m[1]*x+m[5]*y+m[9]*z+m[13])/ww,(m[2]*x+m[6]*y+m[10]*z+m[14])/ww];},
  nrm3(m){const i=M4.inv(m);return new Float32Array([i[0],i[4],i[8],i[1],i[5],i[9],i[2],i[6],i[10]]);}
};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sc=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(a[0],a[1],a[2]),norm=a=>{const l=len(a)||1;return [a[0]/l,a[1]/l,a[2]/l];};
const V3={sub,add,sc,dot,cross,len,norm,lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
const hex=h=>{if(Array.isArray(h))return h;if(typeof h==="string"){h=h.trim().replace("#","");if(h.length===3)h=h.split("").map(c=>c+c).join("");h=parseInt(h,16)||0;}return [(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];};

/* ---------- scene graph ---------- */
class Node{
  constructor(geo,mat){this.geo=geo||null;this.mat=mat||null;this.pos=[0,0,0];this.rot=[0,0,0];this.order="XYZ";this.scl=[1,1,1];this.children=[];this.parent=null;
    this.visible=true;this.world=M4.id();this.castShadow=false;this.pickable=false;this.billboard=false;this.renderOrder=0;this.userData={};this.matrix=null;}
  add(...cs){cs.forEach(c=>{if(c.parent)c.parent.remove(c);c.parent=this;this.children.push(c);});return this;}
  remove(c){const i=this.children.indexOf(c);if(i>=0){this.children.splice(i,1);c.parent=null;}return this;}
  clear(){this.children.slice().forEach(c=>this.remove(c));}
  traverse(fn){fn(this);this.children.forEach(c=>c.traverse(fn));}
  local(){if(this.matrix)return this.matrix;let m=M4.id();m[12]=this.pos[0];m[13]=this.pos[1];m[14]=this.pos[2];
    for(const a of this.order){const v=a==="X"?this.rot[0]:a==="Y"?this.rot[1]:this.rot[2];if(v)m=M4.mul(m,a==="X"?M4.rx(v):a==="Y"?M4.ry(v):M4.rz(v),m);}
    if(this.scl[0]!==1||this.scl[1]!==1||this.scl[2]!==1){m[0]*=this.scl[0];m[1]*=this.scl[0];m[2]*=this.scl[0];m[4]*=this.scl[1];m[5]*=this.scl[1];m[6]*=this.scl[1];m[8]*=this.scl[2];m[9]*=this.scl[2];m[10]*=this.scl[2];}
    return m;}
  update(pw,cam){let l=this.local();if(this.billboard&&cam){const v=cam.view,m=M4.id();m[0]=v[0];m[1]=v[4];m[2]=v[8];m[4]=v[1];m[5]=v[5];m[6]=v[9];m[8]=v[2];m[9]=v[6];m[10]=v[10];
      m[12]=this.pos[0];m[13]=this.pos[1];m[14]=this.pos[2];m[0]*=this.scl[0];m[1]*=this.scl[0];m[2]*=this.scl[0];m[4]*=this.scl[1];m[5]*=this.scl[1];m[6]*=this.scl[1];l=m;
      if(pw){const w=M4.mul(pw,M4.id());w[0]=1;w[1]=0;w[2]=0;w[4]=0;w[5]=1;w[6]=0;w[8]=0;w[9]=0;w[10]=1;this.world=M4.mul(w,l);}else this.world=l;}
    else this.world=pw?M4.mul(pw,l):l;this.children.forEach(c=>c.update(this.world,cam));}
  worldPos(){return [this.world[12],this.world[13],this.world[14]];}
}
const mat=o=>Object.assign({color:[1,1,1],emissive:[0,0,0],opacity:1,transparent:false,depthWrite:true,depthTest:true,double:false,unlit:false,map:null,vcolor:false,rough:.6,metal:0,fog:true,rim:1,additive:false},o||{},
  {color:hex(o&&o.color!=null?o.color:[1,1,1]),emissive:hex(o&&o.emissive!=null?o.emissive:[0,0,0]),inkColor:hex(o&&o.inkColor!=null?o.inkColor:"#2a2233")});

/* ---------- geometry ---------- */
function geo(p,n,i,uv,c){return {p:p instanceof Float32Array?p:new Float32Array(p),n:n instanceof Float32Array?n:new Float32Array(n),i:(i instanceof Uint32Array||i instanceof Uint16Array)?i:(p.length/3>65535?new Uint32Array(i):new Uint16Array(i)),uv:uv?(uv instanceof Float32Array?uv:new Float32Array(uv)):null,c:c?(c instanceof Float32Array?c:new Float32Array(c)):null,buf:null,bs:null};}
/* surface of revolution around Y: prof=[[r,y],...], seg around; optional ellipse scale sx,sz; caps */
function lathe(prof,seg,sx,sz,o){seg=seg||20;sx=sx||1;sz=sz||1;o=o||{};const p=[],n=[],uv=[],ix=[],R=prof.length;
  for(let j=0;j<R;j++){const [r,y]=prof[j],pr=prof[Math.max(0,j-1)],nx=prof[Math.min(R-1,j+1)],dy=nx[1]-pr[1],dr=nx[0]-pr[0];
    for(let k=0;k<=seg;k++){const a=k/seg*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),bulge=o.front?1+o.front*Math.max(0,ca):1;
      p.push(r*ca*sx*bulge,y,r*sa*sz);let nn=[dy*ca/sx,-dr,dy*sa/sz];const l=Math.hypot(...nn)||1;n.push(nn[0]/l,nn[1]/l,nn[2]/l);uv.push(k/seg,j/(R-1));}}
  for(let j=0;j<R-1;j++)for(let k=0;k<seg;k++){const a=j*(seg+1)+k,b=a+seg+1;ix.push(a,b,a+1,b,b+1,a+1);}
  return geo(p,n,ix,uv);}
function sphere(r,ws,hs){ws=ws||24;hs=hs||16;const prof=[];for(let j=0;j<=hs;j++){const t=j/hs*Math.PI;prof.push([Math.sin(t)*r,-Math.cos(t)*r]);}const g=lathe(prof,ws);
  for(let i=0;i<g.p.length;i+=3){const l=Math.hypot(g.p[i],g.p[i+1],g.p[i+2])||1;g.n[i]=g.p[i]/l;g.n[i+1]=g.p[i+1]/l;g.n[i+2]=g.p[i+2]/l;}return g;}
function box(w,h,d){const x=w/2,y=h/2,z=d/2,F=[[[1,0,0],[[x,-y,z],[x,-y,-z],[x,y,-z],[x,y,z]]],[[-1,0,0],[[-x,-y,-z],[-x,-y,z],[-x,y,z],[-x,y,-z]]],[[0,1,0],[[-x,y,z],[x,y,z],[x,y,-z],[-x,y,-z]]],[[0,-1,0],[[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]]],[[0,0,1],[[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]]],[[0,0,-1],[[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z]]]];
  const p=[],n=[],uv=[],ix=[];F.forEach(([nn,vs],f)=>{vs.forEach((v,k)=>{p.push(...v);n.push(...nn);uv.push([0,1,1,0][k],[0,0,1,1][k]);});ix.push(f*4,f*4+1,f*4+2,f*4,f*4+2,f*4+3);});return geo(p,n,ix,uv);}
function plane(w,d){const p=[-w/2,0,d/2,w/2,0,d/2,w/2,0,-d/2,-w/2,0,-d/2];return geo(p,[0,1,0,0,1,0,0,1,0,0,1,0],[0,1,2,0,2,3],[0,0,1,0,1,1,0,1]);}
function quad(w,h){const p=[-w/2,-h/2,0,w/2,-h/2,0,w/2,h/2,0,-w/2,h/2,0];return geo(p,[0,0,1,0,0,1,0,0,1,0,0,1],[0,1,2,0,2,3],[0,0,1,0,1,1,0,1]);}
function ring(r0,r1,seg,a0,a1){seg=seg||48;a0=a0||0;a1=a1==null?Math.PI*2:a1;const p=[],n=[],uv=[],ix=[];for(let k=0;k<=seg;k++){const a=a0+(a1-a0)*k/seg,c=Math.cos(a),s=Math.sin(a);p.push(c*r0,0,-s*r0,c*r1,0,-s*r1);n.push(0,1,0,0,1,0);uv.push(k/seg,0,k/seg,1);if(k<seg){const b=k*2;ix.push(b,b+1,b+3,b,b+3,b+2);}}return geo(p,n,ix,uv);}
function cyl(r0,r1,h,seg,caps){const g=lathe(caps?[[0,0],[r0,0],[r0,0],[r1,h],[r1,h],[0,h]]:[[r0,0],[r1,h]],seg||16);return g;}
function torus(R,r,ts,rs,arc){ts=ts||32;rs=rs||10;arc=arc||Math.PI*2;const p=[],n=[],ix=[];for(let i=0;i<=ts;i++){const u=i/ts*arc,cu=Math.cos(u),su=Math.sin(u);for(let j=0;j<=rs;j++){const v=j/rs*Math.PI*2,cv=Math.cos(v),sv=Math.sin(v);p.push((R+r*cv)*cu,(R+r*cv)*su,r*sv);n.push(cv*cu,cv*su,sv);}}
  for(let i=0;i<ts;i++)for(let j=0;j<rs;j++){const a=i*(rs+1)+j,b=a+rs+1;ix.push(a,b,a+1,b,b+1,a+1);}return geo(p,n,ix);}
function tube(pts,r,rs){rs=rs||8;const p=[],n=[],ix=[];let prevN=null;
  for(let i=0;i<pts.length;i++){const t=norm(sub(pts[Math.min(pts.length-1,i+1)],pts[Math.max(0,i-1)]));let a=prevN?norm(sub(prevN,sc(t,dot(prevN,t)))):norm(cross(t,Math.abs(t[1])<.9?[0,1,0]:[1,0,0]));prevN=a;const b=cross(t,a);
    for(let j=0;j<=rs;j++){const v=j/rs*Math.PI*2,d=add(sc(a,Math.cos(v)),sc(b,Math.sin(v)));p.push(...add(pts[i],sc(d,r)));n.push(...d);}}
  for(let i=0;i<pts.length-1;i++)for(let j=0;j<rs;j++){const a=i*(rs+1)+j,b=a+rs+1;ix.push(a,b,a+1,b,b+1,a+1);}return geo(p,n,ix);}
/* bake a list of [geometry, matrix] into one */
function merge(list){if(list.some(x=>x[0].j)){let nv=0;list.forEach(([g])=>nv+=g.p.length/3);const J=new Uint8Array(nv*4),Wt=new Uint8Array(nv*4);let o=0;list.forEach(([g])=>{const c=g.p.length/3;if(g.j){J.set(g.j,o*4);Wt.set(g.w,o*4);}else for(let k=0;k<c;k++)Wt[(o+k)*4]=255;o+=c;});const out=merge(list.map(x=>[Object.assign({},x[0],{j:null,w:null}),x[1],x[2]]));out.j=J;out.w=Wt;return out;}let np=0,ni=0;list.forEach(([g])=>{np+=g.p.length;ni+=g.i.length;});const p=new Float32Array(np),n=new Float32Array(np),hasC=list.some(x=>x[2]),c=hasC?new Float32Array(np):null,I=np/3>65535?new Uint32Array(ni):new Uint16Array(ni);let op=0,oi=0;
  list.forEach(([g,m,col])=>{const nm=m?M4.nrm3(m):null,base=op/3;for(let k=0;k<g.p.length;k+=3){const v=m?M4.xf(m,[g.p[k],g.p[k+1],g.p[k+2]]):[g.p[k],g.p[k+1],g.p[k+2]];p.set(v,op+k);
      let q=[g.n[k],g.n[k+1],g.n[k+2]];if(nm)q=norm([nm[0]*q[0]+nm[3]*q[1]+nm[6]*q[2],nm[1]*q[0]+nm[4]*q[1]+nm[7]*q[2],nm[2]*q[0]+nm[5]*q[1]+nm[8]*q[2]]);n.set(q,op+k);if(c)c.set(col||[1,1,1],op+k);}
    for(let k=0;k<g.i.length;k++)I[oi+k]=g.i[k]+base;op+=g.p.length;oi+=g.i.length;});
  const out=geo(p,n,I);out.c=c;return out;}
const T=(x,y,z,rx,ry,rz,sx,sy,sz)=>{let m=M4.id();m[12]=x||0;m[13]=y||0;m[14]=z||0;if(rx)m=M4.mul(m,M4.rx(rx));if(ry)m=M4.mul(m,M4.ry(ry));if(rz)m=M4.mul(m,M4.rz(rz));if(sx!=null){m[0]*=sx;m[1]*=sx;m[2]*=sx;m[4]*=sy;m[5]*=sy;m[6]*=sy;m[8]*=sz;m[9]*=sz;m[10]*=sz;}return m;};
function bounds(g){if(g.bs)return g.bs;let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<g.p.length;i+=3)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],g.p[i+k]);mx[k]=Math.max(mx[k],g.p[i+k]);}
  const c=sc(add(mn,mx),.5);let r=0;for(let i=0;i<g.p.length;i+=3)r=Math.max(r,Math.hypot(g.p[i]-c[0],g.p[i+1]-c[1],g.p[i+2]-c[2]));return g.bs={c,r};}

/* ---------- renderer ---------- */
const VS=`attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;attribute vec2 aU;attribute vec4 aJ;attribute vec4 aWt;uniform mat4 uM,uVP;uniform mat3 uNM;uniform vec4 uB[99];uniform float uSkin,uInk,uOut;uniform vec3 uCam;varying vec3 vN,vW,vC,vR;varying vec2 vU;
mat4 bm(float f){int i=int(f+.5)*3;vec4 a=uB[i],b=uB[i+1],c=uB[i+2];return mat4(a.x,b.x,c.x,0.,a.y,b.y,c.y,0.,a.z,b.z,c.z,0.,a.w,b.w,c.w,1.);}
vec3 qr(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
void dq(float f,float wt,vec4 q0,inout vec4 r,inout vec4 d,inout vec3 lp,inout vec3 ln){int i=int(f+.5)*2;vec4 a=uB[i],b=uB[i+1];float s=dot(a,q0)<0.?-wt:wt;r+=a*s;d+=b*s;
  /* the same bone as a rigid transform, for the linear blend */
  lp+=wt*(qr(a,aP)+2.*(a.w*b.xyz-b.w*a.xyz+cross(a.xyz,b.xyz)));ln+=wt*qr(a,aN);}
void main(){vec4 p=vec4(aP,1.);vec3 n=aN;if(uSkin>1.5){
  /* dual-quaternion skinning: bones as (rotation, dual) pairs, blended on the same hemisphere as the first bone */
  /* 40% dual-quaternion, 60% linear blend: the dual quaternion keeps twisted forearms and bent knees and elbows from
     collapsing, the linear blend keeps the shoulder from ballooning when the arm goes overhead (block, set, spike) */
  vec4 q0=uB[int(aJ.x+.5)*2],r=vec4(0.),d=vec4(0.);vec3 lp=vec3(0.),ln=vec3(0.);
  dq(aJ.x,aWt.x,q0,r,d,lp,ln);dq(aJ.y,aWt.y,q0,r,d,lp,ln);dq(aJ.z,aWt.z,q0,r,d,lp,ln);dq(aJ.w,aWt.w,q0,r,d,lp,ln);
  float l=length(r);r/=l;d/=l;vec3 t=2.*(r.w*d.xyz-d.w*r.xyz+cross(r.xyz,d.xyz));
  p.xyz=mix(lp,qr(r,aP)+t,.4);n=mix(ln,qr(r,aN),.4);}
 else if(uSkin>.5){mat4 m=bm(aJ.x)*aWt.x+bm(aJ.y)*aWt.y+bm(aJ.z)*aWt.z+bm(aJ.w)*aWt.w;p=m*p;n=(m*vec4(aN,0.)).xyz;}vec4 w=uM*p;if(uInk>.5){vec3 nw=normalize(mat3(uM)*n);w.xyz+=nw*uOut*length(uCam-w.xyz);}vW=w.xyz;vN=uNM*n;vC=aC;vU=aU;vR=aP;gl_Position=uVP*w;}`;
/* skinning: up to 33 bones, each a 3x4 affine matrix packed as three rows (keeps the vertex shader inside the
   128-vector uniform budget WebGL guarantees on every phone); 4 bone influences per vertex, weights in aWt. */
const MAXB=33;
const FS=`precision highp float;varying vec3 vN,vW,vC,vR;varying vec2 vU;uniform float uToon,uInk;
float h2(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
uniform vec3 uCol,uEm,uSky,uGnd,uD1,uC1,uD2,uC2,uRimC,uCam,uFogC;uniform float uGain,uOp,uRough,uMetal,uUnlit,uMap,uVC,uFogN,uFogF,uShadow,uRim,uSpot,uWrap,uSheen,uExp;uniform vec3 uSpP,uSpC;uniform sampler2D uTex;
void main(){if(uShadow>.5){gl_FragColor=vec4(0.,0.,.02,uOp);return;}
 vec3 base=uCol;if(uVC>.5)base*=vC;float a=uOp;if(uMap>.5){vec4 t=texture2D(uTex,vU);base*=t.rgb;a*=t.a;}if(a<.004)discard;
 vec3 col;
 if(uInk>.5){gl_FragColor=vec4(uCol,1.);return;}
 if(uToon>.5){
  /* comic look: flat colour with one cool shadow wash and a soft terminator, watercolour blotches that stay on the body
     (rest position), a faint paper grain, and pigment pooling toward the edges */
  vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uCam-vW);
  float d=dot(N,normalize(uD1+vec3(0.,.15,0.)))+uWrap*.6;float lt=smoothstep(.0,.06,d);
  float ao=smoothstep(-.6,.2,N.y)*.08;
  vec3 sh=base*vec3(.68,.69,.86);col=mix(sh,base,lt)*(1.-.08+ao);
  float b1=vn(vR*4.)*.65+vn(vR*9.)*.35;col*=1.+(b1-.5)*.07;
  col*=.985+h2(floor(gl_FragCoord.xy*.5))*.02;
  float e=1.-max(dot(N,V),0.);col=mix(col,col*vec3(.78,.76,.9),smoothstep(.45,.9,e)*.45);
  col+=pow(uRimC,vec3(.8))*smoothstep(.7,.95,e)*lt*.12;
  col=clamp(col+uEm,0.,1.);}
 else if(uUnlit>.5){col=base+uEm;}
 else{vec3 alb=pow(base,vec3(2.2));vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uCam-vW);
  vec3 sky=pow(uSky,vec3(2.2)),gnd=pow(uGnd,vec3(2.2));vec3 amb=mix(gnd,sky,N.y*.5+.5)*1.15;
  float w=uWrap;float d1=max((dot(N,uD1)+w)/(1.+w),0.),d2=max((dot(N,uD2)+w)/(1.+w),0.);
  vec3 c1=pow(uC1,vec3(2.2))*2.1,c2=pow(uC2,vec3(2.2))*1.3;
  float sh=mix(110.,10.,uRough);vec3 H=normalize(uD1+V);float s1=pow(max(dot(N,H),0.),sh)*(sh+8.)/(8.*3.1416)*(1.-uRough*.75)*max(dot(N,uD1),0.);
  float fres=pow(1.-max(dot(N,V),0.),5.);vec3 F0=mix(vec3(.04),alb,uMetal);vec3 spec=(F0+(1.-F0)*fres*.6)*s1;
  vec3 lit=amb+c1*d1+c2*d2;
  if(uSpot>0.){vec3 L=uSpP-vW;float dl=length(L);L/=dl;float fall=smoothstep(.55,.95,dot(-L,vec3(0.,-1.,0.)));lit+=pow(uSpC,vec3(2.2))*2.*max(dot(N,L),0.)*fall*uSpot;}
  float rim=pow(1.-max(dot(N,V),0.),2.6)*uRim;float sheen=pow(1.-max(dot(N,V),0.),3.)*uSheen;
  vec3 lin=alb*lit*(1.-uMetal*.6)+c1*spec+pow(uRimC,vec3(2.2))*rim*1.4+alb*sheen*.8+pow(max(uEm,vec3(0.)),vec3(2.2))*1.6;
  if(w>.3){lin+=alb*vec3(.9,.25,.15)*pow(max(0.,dot(-N,uD1)*.5+.5),2.)*.12*w;}
  lin*=uExp*uGain;vec3 x=lin;col=clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);col=pow(col,vec3(1./2.2));}
 if(uFogF>0.){float f=smoothstep(uFogN,uFogF,length(uCam-vW));col=mix(col,uFogC,f);}
 gl_FragColor=vec4(col,a);}`;
let CTXID=0,FID=0;
function renderer(canvas,opt){opt=opt||{};const cid=++CTXID;
  const gl=canvas.getContext("webgl",{antialias:true,alpha:!!opt.alpha,stencil:true,premultipliedAlpha:false,preserveDrawingBuffer:!!opt.preserve});if(!gl)return null;
  const u32=gl.getExtension("OES_element_index_uint");
  const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);const A={},U={};["aP","aN","aC","aU","aJ","aWt"].forEach(k=>A[k]=gl.getAttribLocation(pr,k));
  "uGain uToon uInk uOut uWrap uSheen uExp uSkin uM uVP uNM uCol uEm uSky uGnd uD1 uC1 uD2 uC2 uRimC uCam uFogC uOp uRough uMetal uUnlit uMap uVC uFogN uFogF uShadow uRim uTex uSpot uSpP uSpC".split(" ").forEach(k=>U[k]=gl.getUniformLocation(pr,k));U.uB=gl.getUniformLocation(pr,"uB[0]")||gl.getUniformLocation(pr,"uB");
  const white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  function upload(g){g.bufs=g.bufs||{};if(g.bufs[cid]){g.buf=g.bufs[cid];return g.buf;}if(g.i instanceof Uint32Array&&!u32){g.i=new Uint16Array(g.i);}const mk=(d,el)=>{const b=gl.createBuffer();gl.bindBuffer(el?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER,b);gl.bufferData(el?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);return b;};
    g.buf=g.bufs[cid]={p:mk(g.p),n:mk(g.n),c:g.c?mk(g.c):null,u:g.uv?mk(g.uv):null,j:g.j?mk(g.j):null,w:g.w?mk(g.w):null,i:mk(g.i,true),cnt:g.i.length,type:g.i instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT};return g.buf;}
  function texOf(t){if(!t)return white;t.gls=t.gls||{};t.ver=t.ver||1;if(t.dirty){t.ver++;t.dirty=false;}const e=t.gls[cid];if(e&&e.v===t.ver)return e.tex;const tex=e?e.tex:gl.createTexture();t.gls[cid]={tex,v:t.ver};gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,t.img);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);const pot=v=>(v&(v-1))===0,P=pot(t.img.width)&&pot(t.img.height);
    if(P){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);const ext=gl.getExtension("EXT_texture_filter_anisotropic");if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,4);}
    else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    const wr=P&&t.repeat?gl.REPEAT:gl.CLAMP_TO_EDGE;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wr);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wr);return tex;}
  let W=1,H=1,fogF=0,inkW=.002;
  const api={gl,canvas,
    setSize(w,h,dpr){dpr=Math.min(dpr||window.devicePixelRatio||1,2);W=w;H=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);},
    camMats(cam){cam.aspect=W/H;cam.proj=M4.persp((cam.fov||40)*Math.PI/180,cam.aspect,cam.near||.1,cam.far||200);if(cam.shift)cam.proj[8]+=cam.shift;if(cam.shiftY)cam.proj[9]+=cam.shiftY;cam.view=M4.lookAt(cam.pos,cam.target,cam.up);cam.vp=M4.mul(cam.proj,cam.view);return cam;},
    render(scene,cam){FID++;api.camMats(cam);scene.root.update(null,cam);
      gl.viewport(0,0,canvas.width,canvas.height);const cc=scene.clear||[0,0,0,0];gl.clearColor(cc[0],cc[1],cc[2],cc[3]==null?1:cc[3]);gl.clearStencil(0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
      gl.useProgram(pr);gl.uniformMatrix4fv(U.uVP,false,cam.vp);gl.uniform3fv(U.uCam,cam.pos);gl.uniform1f(U.uInk,0);
      // ink outline width: about 1.6 CSS pixels whatever the distance
      inkW=2.1*(canvas.width/Math.max(1,W))*2*Math.tan((cam.fov||40)*Math.PI/360)/Math.max(1,canvas.height)*(scene.inkScale||1);
      const L=scene.light||{};gl.uniform3fv(U.uSky,hex(L.sky||[.6,.6,.7]));gl.uniform3fv(U.uGnd,hex(L.gnd||[.15,.12,.2]));gl.uniform3fv(U.uD1,norm(L.d1||[.4,1,.5]));gl.uniform3fv(U.uC1,hex(L.c1||[.8,.8,.8]));
      gl.uniform3fv(U.uD2,norm(L.d2||[-.5,.3,-.6]));gl.uniform3fv(U.uC2,hex(L.c2||[.2,.2,.3]));gl.uniform3fv(U.uRimC,hex(L.rim||[.3,.3,.5]));
      const sp=L.spot;gl.uniform1f(U.uSpot,sp?sp.k:0);gl.uniform3fv(U.uSpP,sp?sp.pos:[0,10,0]);gl.uniform3fv(U.uSpC,hex(sp?sp.col:[0,0,0]));
      const F=scene.fog;fogF=F?F.far:0;gl.uniform3fv(U.uFogC,hex(F?F.col:[0,0,0]));gl.uniform1f(U.uFogN,F?F.near:0);gl.uniform1f(U.uFogF,F?F.far:0);gl.uniform1i(U.uTex,0);gl.uniform1f(U.uShadow,0);gl.uniform1f(U.uExp,scene.exposure||1);
      const op=[],tr=[],cs=[];scene.root.traverse(n=>{if(!n.visible){n._hid=true;return;}n._hid=n.parent&&n.parent._hid;if(n._hid||!n.geo||!n.mat)return;if(n.mat.transparent||n.mat.additive)tr.push(n);else op.push(n);if(n.castShadow)cs.push(n);});
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
      op.sort((a,b)=>a.renderOrder-b.renderOrder).forEach(n=>draw(n));
      if(scene.shadow&&cs.length){const s=scene.shadow,d=norm(s.dir),e=s.y||0.004,kx=d[0]/d[1],kz=d[2]/d[1],S=new Float32Array([1,0,0,0,-kx,0,-kz,0,0,0,1,0,kx*e,e,kz*e,1]);
        gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.EQUAL,0,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.disable(gl.CULL_FACE);
        gl.uniform1f(U.uShadow,1);gl.uniform1f(U.uOp,s.opacity||.35);cs.forEach(n=>{const m=M4.mul(S,n.world);bind(n.geo);skin(n);gl.uniformMatrix4fv(U.uM,false,m);const b=n.geo.buf;gl.drawElements(gl.TRIANGLES,b.cnt,b.type,0);});
        gl.uniform1f(U.uShadow,0);gl.disable(gl.STENCIL_TEST);gl.depthMask(true);}
      tr.forEach(n=>{const w=n.world,p=[w[12],w[13],w[14]];n._d=n.renderOrder*1e4-len(sub(p,cam.pos));});tr.sort((a,b)=>a._d-b._d);tr.forEach(n=>draw(n));
      gl.disable(gl.BLEND);gl.depthMask(true);},
    pick(list,nx,ny,cam){if(!cam.vp)return null;const iv=M4.inv(cam.vp),o=M4.xf(iv,[nx,ny,-1]),f=M4.xf(iv,[nx,ny,1]),d=norm(sub(f,o));let best=null;
      list.forEach(n=>{if(!n.geo)return;let h=n;while(h){if(!h.visible)return;h=h.parent;}const im=M4.inv(n.world),lo=M4.xf(im,o),ld=M4.xf(im,d,0),bs=bounds(n.geo);
        const oc=sub(lo,bs.c),b=dot(oc,ld),c=dot(oc,oc)-bs.r*bs.r,ll=dot(ld,ld);if(b*b-ll*c<0)return;const t=hitTri(n.geo,lo,ld);if(t==null)return;
        const wp=M4.xf(n.world,add(lo,sc(ld,t))),dist=len(sub(wp,o));if(!best||dist<best.dist)best={node:n,dist,point:wp};});return best;},
    project(v,cam){const p=M4.xf(cam.vp,v);return p;},
    ray(nx,ny,cam){const iv=M4.inv(cam.vp),o=M4.xf(iv,[nx,ny,-1]),f=M4.xf(iv,[nx,ny,1]);return {o,d:norm(sub(f,o))};}
  };
  function bind(g){const b=upload(g);gl.bindBuffer(gl.ARRAY_BUFFER,b.p);gl.enableVertexAttribArray(A.aP);gl.vertexAttribPointer(A.aP,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,b.n);gl.enableVertexAttribArray(A.aN);gl.vertexAttribPointer(A.aN,3,gl.FLOAT,false,0,0);
    if(A.aC>=0){if(b.c){gl.bindBuffer(gl.ARRAY_BUFFER,b.c);gl.enableVertexAttribArray(A.aC);gl.vertexAttribPointer(A.aC,3,gl.FLOAT,false,0,0);}else{gl.disableVertexAttribArray(A.aC);gl.vertexAttrib3f(A.aC,1,1,1);}}
    if(A.aU>=0){if(b.u){gl.bindBuffer(gl.ARRAY_BUFFER,b.u);gl.enableVertexAttribArray(A.aU);gl.vertexAttribPointer(A.aU,2,gl.FLOAT,false,0,0);}else{gl.disableVertexAttribArray(A.aU);gl.vertexAttrib2f(A.aU,0,0);}}
    if(A.aJ>=0){if(b.j){gl.bindBuffer(gl.ARRAY_BUFFER,b.j);gl.enableVertexAttribArray(A.aJ);gl.vertexAttribPointer(A.aJ,4,gl.UNSIGNED_BYTE,false,0,0);}else{gl.disableVertexAttribArray(A.aJ);gl.vertexAttrib4f(A.aJ,0,0,0,0);}}
    if(A.aWt>=0){if(b.w){gl.bindBuffer(gl.ARRAY_BUFFER,b.w);gl.enableVertexAttribArray(A.aWt);gl.vertexAttribPointer(A.aWt,4,gl.UNSIGNED_BYTE,true,0,0);}else{gl.disableVertexAttribArray(A.aWt);gl.vertexAttrib4f(A.aWt,1,0,0,0);}}
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.i);}
  function skin(n){if(n.skin){gl.uniform1f(U.uSkin,n.skin.dq?2:1);gl.uniform4fv(U.uB,n.skin.compute(n,FID));}else gl.uniform1f(U.uSkin,0);}
  function draw(n){const m=n.mat,g=n.geo;bind(g);skin(n);gl.uniformMatrix4fv(U.uM,false,n.world);gl.uniformMatrix3fv(U.uNM,false,M4.nrm3(n.world));
    gl.uniform3fv(U.uCol,m.color);gl.uniform3fv(U.uEm,m.emissive);gl.uniform1f(U.uOp,m.opacity);gl.uniform1f(U.uRough,m.rough);gl.uniform1f(U.uMetal,m.metal);gl.uniform1f(U.uUnlit,m.unlit?1:0);gl.uniform1f(U.uRim,m.rim);gl.uniform1f(U.uWrap,m.wrap||0);gl.uniform1f(U.uSheen,m.sheen||0);
    gl.uniform1f(U.uVC,m.vcolor&&g.c?1:0);gl.uniform1f(U.uMap,m.map?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texOf(m.map));
    gl.uniform1f(U.uFogF,m.fog===false?0:fogF);
    if(m.transparent||m.additive){gl.enable(gl.BLEND);if(m.additive)gl.blendFunc(gl.SRC_ALPHA,gl.ONE);else gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}else gl.disable(gl.BLEND);
    gl.depthMask(m.depthWrite!==false&&!m.additive);if(m.depthTest===false)gl.disable(gl.DEPTH_TEST);else gl.enable(gl.DEPTH_TEST);
    if(m.double)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);}
    if(m.polyOffset){gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-1,-1);}
    gl.uniform1f(U.uToon,m.toon?1:0);gl.uniform1f(U.uGain,m.gain||1);
    gl.drawElements(gl.TRIANGLES,g.buf.cnt,g.buf.type,0);
    if(m.polyOffset)gl.disable(gl.POLYGON_OFFSET_FILL);
    // ink outline: the back faces, pushed out along the normal, in the ink colour
    if(m.ink&&!m.transparent){gl.uniform1f(U.uInk,1);gl.uniform1f(U.uOut,inkW*(m.inkW||1));gl.uniform3fv(U.uCol,m.inkColor);gl.enable(gl.CULL_FACE);gl.cullFace(gl.FRONT);
      gl.drawElements(gl.TRIANGLES,g.buf.cnt,g.buf.type,0);gl.cullFace(gl.BACK);gl.uniform1f(U.uInk,0);}
}
  return api;}
function hitTri(g,o,d){const P=g.p,I=g.i;let best=null;
  for(let k=0;k<I.length;k+=3){const a=I[k]*3,b=I[k+1]*3,c=I[k+2]*3;
    const e1x=P[b]-P[a],e1y=P[b+1]-P[a+1],e1z=P[b+2]-P[a+2],e2x=P[c]-P[a],e2y=P[c+1]-P[a+1],e2z=P[c+2]-P[a+2];
    const px=d[1]*e2z-d[2]*e2y,py=d[2]*e2x-d[0]*e2z,pz=d[0]*e2y-d[1]*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-12)continue;const inv=1/det;
    const tx=o[0]-P[a],ty=o[1]-P[a+1],tz=o[2]-P[a+2],u=(tx*px+ty*py+tz*pz)*inv;if(u<0||u>1)continue;
    const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(d[0]*qx+d[1]*qy+d[2]*qz)*inv;if(v<0||u+v>1)continue;const t=(e2x*qx+e2y*qy+e2z*qz)*inv;if(t>0&&(best==null||t<best))best=t;}
  return best;}
/* canvas texture */
function canvasTex(w,h,drawFn,repeat){const c=document.createElement("canvas");c.width=w;c.height=h;drawFn(c.getContext("2d"),w,h);return {img:c,repeat:!!repeat,dirty:true,gl:null};}
/* orbit camera on a canvas */
function orbit(el,cam,o){o=Object.assign({min:2,max:30,maxPolar:Math.PI/2-.03,minPolar:.05,damp:.12,rotSpeed:.0065,onStart:null},o||{});
  const st={th:0,ph:1,r:10,vth:0,vph:0,vr:0,drag:null,pts:new Map(),pinch:0,enabled:true,auto:0};
  function fromCam(){const d=sub(cam.pos,cam.target);st.r=len(d);st.ph=Math.acos(Math.max(-1,Math.min(1,d[1]/st.r)));st.th=Math.atan2(d[0],d[2]);}
  fromCam();
  el.style.touchAction="none";
  el.addEventListener("pointerdown",e=>{if(!st.enabled)return;st.pts.set(e.pointerId,[e.clientX,e.clientY]);try{el.setPointerCapture(e.pointerId);}catch(_){}o.onStart&&o.onStart();if(st.pts.size===2){const [a,b]=[...st.pts.values()];st.pinch=Math.hypot(a[0]-b[0],a[1]-b[1]);}});
  el.addEventListener("pointermove",e=>{if(!st.pts.has(e.pointerId))return;const p=st.pts.get(e.pointerId),dx=e.clientX-p[0],dy=e.clientY-p[1];st.pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(st.pts.size===1){st.vth=-dx*o.rotSpeed;st.vph=-dy*o.rotSpeed;st.th+=st.vth;st.ph+=st.vph;}
    else if(st.pts.size===2){const [a,b]=[...st.pts.values()],dd=Math.hypot(a[0]-b[0],a[1]-b[1]);if(st.pinch){st.r*=st.pinch/dd;}st.pinch=dd;}apply();});
  const up=e=>{st.pts.delete(e.pointerId);if(st.pts.size<2)st.pinch=0;};el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
  el.addEventListener("wheel",e=>{if(!st.enabled)return;e.preventDefault();st.r*=Math.exp(e.deltaY*.0012);apply();},{passive:false});
  function apply(){st.ph=Math.max(o.minPolar,Math.min(o.maxPolar,st.ph));st.r=Math.max(o.min,Math.min(o.max,st.r));const s=Math.sin(st.ph);
    cam.pos=[cam.target[0]+st.r*s*Math.sin(st.th),cam.target[1]+st.r*Math.cos(st.ph),cam.target[2]+st.r*s*Math.cos(st.th)];}
  return {update(){if(!st.pts.size&&(Math.abs(st.vth)>1e-5||Math.abs(st.vph)>1e-5)){st.th+=st.vth;st.ph+=st.vph;st.vth*=1-o.damp*2;st.vph*=1-o.damp*2;apply();}if(st.auto&&!st.pts.size){st.th+=st.auto;apply();}},
    sync(){fromCam();st.vth=st.vph=0;},set auto(v){st.auto=v;},get dragging(){return st.pts.size>0;},opts:o,state:st,apply};}
VB.GL={MAXB,M4,V3,Node,mat,geo,lathe,sphere,box,plane,quad,ring,cyl,torus,tube,merge,T,renderer,canvasTex,orbit,hex,bounds};
})();
