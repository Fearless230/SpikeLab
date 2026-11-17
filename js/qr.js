/* qr.js: QR code encoder (byte mode, error correction M, versions 1-10), after the reference algorithm in ISO 18004. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const ECC={M:[[0,10,16,26,18,24,16,18,22,22,26],[0,1,1,1,2,2,4,4,4,5,5],0],Q:[[0,13,22,18,26,18,24,18,22,20,24],[0,1,1,2,2,4,4,6,6,8,8],3],H:[[0,17,28,22,16,22,28,26,26,24,28],[0,1,1,2,4,4,4,5,6,8,8],2]};
let ECC_PER_BLOCK=ECC.M[0],BLOCKS=ECC.M[1],FB=0;
function rawModules(v){let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36;}return r;}
const dataCap=v=>Math.floor(rawModules(v)/8)-ECC_PER_BLOCK[v]*BLOCKS[v];
function mul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x;}return z&255;}
function rsDivisor(deg){const r=new Array(deg).fill(0);r[deg-1]=1;let root=1;for(let i=0;i<deg;i++){for(let j=0;j<r.length;j++){r[j]=mul(r[j],root);if(j+1<r.length)r[j]^=r[j+1];}root=mul(root,2);}return r;}
function rsRem(data,div){const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=mul(c,f));}return r;}
function alignPos(v,size){if(v===1)return [];const n=Math.floor(v/7)+2,step=Math.ceil((v*4+4)/(n*2-2))*2,r=[6];for(let p=size-7;r.length<n;p-=step)r.splice(1,0,p);return r;}
VB.qr=function(text,level){const E=ECC[level||"M"]||ECC.M;ECC_PER_BLOCK=E[0];BLOCKS=E[1];FB=E[2];
  const bytes=Array.from(new TextEncoder().encode(text));let v=1;
  for(;v<=10;v++){const cc=v<10?8:16;if(4+cc+bytes.length*8<=dataCap(v)*8)break;}if(v>10)throw new Error("Text too long for this QR encoder");
  const bits=[];const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1);};
  put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));const cap=dataCap(v)*8;put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
  const data=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=b<<1|bits[i+j];data.push(b);}for(let pad=0xEC;data.length<dataCap(v);pad^=0xEC^0x11)data.push(pad);
  // error correction and interleave
  const nb=BLOCKS[v],el=ECC_PER_BLOCK[v],raw=Math.floor(rawModules(v)/8),nShort=nb-raw%nb,shortLen=Math.floor(raw/nb),div=rsDivisor(el),blocks=[];
  for(let i=0,k=0;i<nb;i++){const dat=data.slice(k,k+shortLen-el+(i<nShort?0:1));k+=dat.length;const ecc=rsRem(dat,div);if(i<nShort)dat.push(0);blocks.push(dat.concat(ecc));}
  const cw=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==shortLen-el||j>=nShort)cw.push(b[i]);});
  // modules
  const size=v*4+17,M=[],F=[];for(let y=0;y<size;y++){M.push(new Array(size).fill(false));F.push(new Array(size).fill(false));}
  const fn=(x,y,d)=>{M[y][x]=d;F[y][x]=true;};
  for(let i=0;i<size;i++){fn(6,i,i%2===0);fn(i,6,i%2===0);}
  [[3,3],[size-4,3],[3,size-4]].forEach(([cx,cy])=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<size&&y>=0&&y<size)fn(x,y,d!==2&&d!==4);}});
  const ap=alignPos(v,size),na=ap.length;for(let i=0;i<na;i++)for(let j=0;j<na;j++){if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)fn(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);}
  const format=mask=>{const d=FB<<3|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=(d<<10|r)^0x5412,g=i=>((b>>>i)&1)===1;
    for(let i=0;i<=5;i++)fn(8,i,g(i));fn(8,7,g(6));fn(8,8,g(7));fn(7,8,g(8));for(let i=9;i<15;i++)fn(14-i,8,g(i));
    for(let i=0;i<8;i++)fn(size-1-i,8,g(i));for(let i=8;i<15;i++)fn(8,size-15+i,g(i));fn(8,size-8,true);};
  format(0);
  if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=v<<12|r;for(let i=0;i<18;i++){const c=((b>>>i)&1)===1,a=size-11+i%3,bb=Math.floor(i/3);fn(a,bb,c);fn(bb,a,c);}}
  let i=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-vert:vert;if(!F[y][x]&&i<cw.length*8){M[y][x]=((cw[i>>>3]>>>(7-(i&7)))&1)===1;i++;}}}
  const MASKS=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&MASKS[m](x,y))M[y][x]=!M[y][x];};
  const penalty=()=>{let p=0,dark=0;for(let y=0;y<size;y++){let run=1;for(let x=0;x<size;x++){if(M[y][x])dark++;if(x>0){if(M[y][x]===M[y][x-1]){run++;if(run===5)p+=3;else if(run>5)p++;}else run=1;}}}
    for(let x=0;x<size;x++){let run=1;for(let y=1;y<size;y++){if(M[y][x]===M[y-1][x]){run++;if(run===5)p+=3;else if(run>5)p++;}else run=1;}}
    for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3;}
    const t=size*size;p+=Math.floor(Math.abs(dark*20-t*10)/t)*10;return p;};
  let best=0,bp=Infinity;for(let m=0;m<8;m++){apply(m);format(m);const p=penalty();if(p<bp){bp=p;best=m;}apply(m);}
  apply(best);format(best);
  return {size,version:v,get:(x,y)=>M[y][x],isFn:(x,y)=>F[y][x]};
};
/* draws the code into a canvas with a quiet zone; dark modules rounded */
VB.qrDraw=function(canvas,text,opt){const o=Object.assign({px:300,fg:"#0b0a0f",bg:"#ffffff",quiet:3},opt||{}),q=VB.qr(text),n=q.size+o.quiet*2,cell=o.px/n,c=canvas.getContext("2d");
  canvas.width=canvas.height=o.px;c.fillStyle=o.bg;c.fillRect(0,0,o.px,o.px);c.fillStyle=o.fg;
  for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.get(x,y)){const X=(x+o.quiet)*cell,Y=(y+o.quiet)*cell;c.fillRect(Math.floor(X),Math.floor(Y),Math.ceil(cell)+.5,Math.ceil(cell)+.5);}
  return q;};
})();

/* styled code: round dots, rounded finder eyes in two colours, the volleyball mark in the middle (error correction H) */
VB.ballPath=function(g,cx,cy,r,col,lw){g.save();g.translate(cx,cy);g.strokeStyle=col;g.lineWidth=lw;g.lineCap="round";g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();
  for(let k=0;k<3;k++){g.save();g.rotate(k*Math.PI*2/3);g.beginPath();g.moveTo(0,0);g.bezierCurveTo(r*.28,-r*.28,r*.38,-r*.66,r*.19,-r);g.stroke();g.beginPath();g.moveTo(-r*.24,-r*.1);g.bezierCurveTo(r*.05,-r*.42,r*.08,-r*.72,-r*.14,-r*.97);g.stroke();g.restore();}g.restore();};
VB.qrStyled=function(canvas,text,opt){const o=Object.assign({px:420,fg:"#17144d",eye:"#ec3b52",eye2:"#5b2bff",bg:"#ffffff",quiet:3,dot:.46,round:1.2,hole:.11,logo:true},opt||{}),q=VB.qr(text,"H"),n=q.size,N=n+o.quiet*2,cell=o.px/N,g=canvas.getContext("2d");
  canvas.width=canvas.height=o.px;g.fillStyle=o.bg;g.fillRect(0,0,o.px,o.px);const off=o.quiet*cell,c0=(n-1)/2,hole=o.logo?Math.ceil(n*o.hole):-1;
  const inEye=(x,y)=>(x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(!q.get(x,y)||inEye(x,y))continue;if(Math.abs(x-c0)<=hole&&Math.abs(y-c0)<=hole)continue;
    const X=off+x*cell+cell/2,Y=off+y*cell+cell/2,fn=q.isFn(x,y);g.fillStyle=fn?o.fg:o.fg;g.beginPath();if(o.dot>=.5){g.fillRect(X-cell/2,Y-cell/2,cell+.5,cell+.5);}else{g.arc(X,Y,cell*(fn?.5:o.dot),0,Math.PI*2);g.fill();}}
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
  [[0,0],[n-7,0],[0,n-7]].forEach(([ex,ey])=>{const X=off+ex*cell,Y=off+ey*cell;g.fillStyle=o.eye;rr(X,Y,7*cell,7*cell,cell*o.round);g.fill();g.fillStyle=o.bg;rr(X+cell,Y+cell,5*cell,5*cell,cell*o.round*.68);g.fill();g.fillStyle=o.eye2;rr(X+2*cell,Y+2*cell,3*cell,3*cell,cell*o.round*.5);g.fill();});
  if(!o.logo)return q;const cx=off+(c0+.5)*cell,cy=cx,R=(hole+.4)*cell;g.fillStyle=o.bg;g.beginPath();g.arc(cx,cy,R*1.12,0,Math.PI*2);g.fill();g.fillStyle=o.eye;g.beginPath();g.arc(cx,cy,R*.9,0,Math.PI*2);g.fill();VB.ballPath(g,cx,cy,R*.72,"#ffffff",Math.max(2,R*.11));
  return q;};
