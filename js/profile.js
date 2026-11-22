/* profile.js: profile photo and background, the scannable 3D player card, and scanning other players' cards. */
(function(){
"use strict";
const VB=window.VB,esc=VB.esc,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
VB.SHARE_URL="https://claude.ai/artifact/MWkU4rsCTwCUYVc182oYtm";
const POS_ABBR={outside:"OH",opposite:"OPP",middle:"MB",setter:"S",libero:"L",any:"ALL"};
const POS_ZONE={outside:[4],opposite:[2],middle:[3],setter:[2,1],libero:[5,6,1],any:[1,2,3,4,5,6]};
const hexRgb=h=>{const n=parseInt(String(h).replace("#",""),16);return [n>>16&255,n>>8&255,n&255];};
const rgbHex=(r,g,b)=>"#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
VB.encId=id=>String(id).replace(/[^A-Za-z0-9]/g,c=>"-"+c.charCodeAt(0).toString(16).padStart(2,"0"));
VB.decId=s=>String(s).replace(/-([0-9a-f]{2})/g,(m,h)=>String.fromCharCode(parseInt(h,16)));
VB.cardLink=id=>VB.SHARE_URL+"#p-"+VB.encId(id);

/* ---------- media: my photo, background, accent ---------- */
const MKEY="vb-media-v1";
VB.media={pfp:null,bg:null,bgMode:"arena",accent:null,at:0};
try{const m=JSON.parse(localStorage.getItem(MKEY)||"null");if(m&&typeof m==="object")Object.assign(VB.media,m);}catch(e){}
let mediaCloudBusy=false;
function saveMedia(){VB.media.at=Date.now();try{localStorage.setItem(MKEY,JSON.stringify(VB.media));}catch(e){VB.ui&&VB.ui.toast("This browser is out of space for photos. They are still saved to your account if you are signed in.");}
  if(VB.net&&!mediaCloudBusy){mediaCloudBusy=true;VB.net.db.doc("data/users/"+VB.net.uid+"/media").set({json:JSON.stringify(VB.media)}).catch(()=>{}).finally(()=>{mediaCloudBusy=false;});}
  VB.squad&&VB.squad.mediaChanged&&VB.squad.mediaChanged();}
VB.loadMediaCloud=async function(){if(!VB.net)return;try{const s=await VB.net.db.doc("data/users/"+VB.net.uid+"/media").get();if(s.exists){const m=JSON.parse(s.data().json||"null");if(m&&(m.at||0)>(VB.media.at||0)){Object.assign(VB.media,m);try{localStorage.setItem(MKEY,JSON.stringify(VB.media));}catch(e){}VB.profile.refresh();}}
  else if(VB.media.at)saveMedia();}catch(e){}};
VB.myAccent=()=>VB.media.accent||((VB.THEMES||{})[(VB.state.profile&&VB.state.profile.pos)||"any"]||{c:"#d8b25a"}).c;
const others={};
VB.mediaOf=function(id){if(!id)return Promise.resolve(null);if(VB.net&&id===VB.net.uid)return Promise.resolve(VB.media);
  if(!others[id])others[id]=VB.net?VB.net.db.doc("players/"+id+"/media/img").get().then(s=>s.exists?VB.cleanMedia(s.data()):null).catch(()=>null):Promise.resolve(null);return others[id];};
VB.mediaForget=id=>{delete others[id];};

/* ---------- image helpers ---------- */
function fileImage(file){return new Promise((res,rej)=>{if(!file||!/^image\//.test(file.type||"image/")){rej(new Error("type"));return;}const u=URL.createObjectURL(file),im=new Image();im.onload=()=>res({im,u});im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error("decode"));};im.src=u;});}
const dataImage=src=>new Promise(res=>{if(!src){res(null);return;}const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src;});
function palette(im){const c=document.createElement("canvas");c.width=c.height=40;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(im,0,0,40,40);const d=g.getImageData(0,0,40,40).data,B={};
  for(let i=0;i<d.length;i+=4){const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),s=mx?(mx-mn)/mx:0;if(s<.22||mx<.2||mx>.98&&s<.3)continue;
    let h=0;if(mx===r)h=((gg-b)/(mx-mn))%6;else if(mx===gg)h=(b-r)/(mx-mn)+2;else h=(r-gg)/(mx-mn)+4;h=(h*60+360)%360;const k=Math.floor(h/15),w=s*mx;B[k]=B[k]||{w:0,r:0,g:0,b:0};B[k].w+=w;B[k].r+=d[i]*w;B[k].g+=d[i+1]*w;B[k].b+=d[i+2]*w;}
  const ks=Object.keys(B).sort((a,b)=>B[b].w-B[a].w),out=[];
  for(const k of ks){if(out.some(o=>Math.min(Math.abs(o.k-k),24-Math.abs(o.k-k))<2))continue;const b=B[k];out.push({k:+k,c:vivid(b.r/b.w,b.g/b.w,b.b/b.w)});if(out.length>=4)break;}
  return out.map(o=>o.c);}
function vivid(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
  s=Math.max(s,.6);l=Math.min(.64,Math.max(.52,l));const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};return rgbHex(f(h+1/3)*255,f(h)*255,f(h-1/3)*255);}
function applyFilter(c,name,accent){if(!name||name==="original")return;const g=c.getContext("2d",{willReadFrequently:true}),im=g.getImageData(0,0,c.width,c.height),d=im.data,A=hexRgb(accent||"#d8b25a"),D=[11,10,15],Lt=[255,246,228];
  for(let i=0;i<d.length;i+=4){let r=d[i],gg=d[i+1],b=d[i+2];const y=.299*r+.587*gg+.114*b;
    if(name==="mono"){const v=Math.max(0,Math.min(255,(y-128)*1.18+128));r=gg=b=v;}
    else if(name==="duotone"){const t=y/255,k=t<.55?t/.55:(t-.55)/.45,a=t<.55?D:A,z=t<.55?A:Lt;r=a[0]+(z[0]-a[0])*k;gg=a[1]+(z[1]-a[1])*k;b=a[2]+(z[2]-a[2])*k;}
    else if(name==="punch"){r=y+(r-y)*1.4;gg=y+(gg-y)*1.4;b=y+(b-y)*1.4;r=(r-128)*1.15+128;gg=(gg-128)*1.15+128;b=(b-128)*1.15+128;}
    else if(name==="warm"){r=r*1.08+12;gg=gg*1.02+4;b=b*.86;}
    else if(name==="night"){r=r*.55;gg=gg*.62;b=b*.85+14;const v=(r+gg+b)/3;r=v+(r-v)*.7;gg=v+(gg-v)*.7;}
    d[i]=r;d[i+1]=gg;d[i+2]=b;}g.putImageData(im,0,0);}
function grain(g,W,H,a){const n=document.createElement("canvas");n.width=n.height=128;const ng=n.getContext("2d"),im=ng.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}ng.putImageData(im,0,0);
  g.save();g.globalAlpha=a;g.globalCompositeOperation="overlay";g.fillStyle=g.createPattern(n,"repeat");g.fillRect(0,0,W,H);g.restore();}
const rgba=(h,a)=>{const c=hexRgb(h);return `rgba(${c[0]},${c[1]},${c[2]},${a})`;};
/* generated backgrounds, all volleyball scenes tinted by the accent */
VB.genBg=function(mode,accent,photo){const W=1200,H=480,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d"),A=accent||"#d8b25a";
  if(mode==="photo"&&photo){const s=document.createElement("canvas");s.width=30;s.height=12;const sg=s.getContext("2d"),sc=Math.max(30/photo.width,12/photo.height);sg.drawImage(photo,(30-photo.width*sc)/2,(12-photo.height*sc)/2,photo.width*sc,photo.height*sc);
    g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(s,-60,-40,W+120,H+80);const pal=palette(photo);const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,rgba(pal[0]||A,.55));gr.addColorStop(.6,"rgba(11,10,15,.35)");gr.addColorStop(1,rgba(pal[1]||A,.45));g.fillStyle=gr;g.fillRect(0,0,W,H);
    courtLines(g,W,H,"rgba(255,255,255,.18)");}
  else if(mode==="net"){g.fillStyle="#08070b";g.fillRect(0,0,W,H);const r=g.createRadialGradient(W*.7,H*.3,0,W*.7,H*.3,W*.7);r.addColorStop(0,rgba(A,.5));r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,W,H);
    const top=y=>H*.22+y*.08,X0=-50,X1=W+50;g.strokeStyle="rgba(230,230,240,.35)";g.lineWidth=1.2;for(let i=0;i<=46;i++){const x=X0+(X1-X0)*i/46,sk=(x/W)*30;g.beginPath();g.moveTo(x,top(x)+8);g.lineTo(x-sk,H*.82+x*.04);g.stroke();}
    for(let j=0;j<=10;j++){const f=j/10;g.beginPath();for(let i=0;i<=24;i++){const x=X0+(X1-X0)*i/24,y=top(x)+8+(H*.82+x*.04-top(x)-8)*f,sk=(x/W)*30*f;i?g.lineTo(x-sk,y):g.moveTo(x-sk,y);}g.stroke();}
    g.strokeStyle="#f1ede4";g.lineWidth=14;g.beginPath();g.moveTo(X0,top(X0));g.lineTo(X1,top(X1));g.stroke();g.strokeStyle="rgba(0,0,0,.25)";g.lineWidth=2;g.beginPath();g.moveTo(X0,top(X0)+6);g.lineTo(X1,top(X1)+6);g.stroke();
    for(let k=0;k<12;k++){g.fillStyle=k%2?"#f4f1ea":"#e0483f";g.fillRect(W*.86,top(W*.86)-150+k*22,7,22);}}
  else if(mode==="beach"){const sky=g.createLinearGradient(0,0,0,H*.62);sky.addColorStop(0,"#12101e");sky.addColorStop(.55,rgba(A,.85));sky.addColorStop(1,"#ffc98a");g.fillStyle=sky;g.fillRect(0,0,W,H*.62);
    const sun=g.createRadialGradient(W*.68,H*.6,0,W*.68,H*.6,170);sun.addColorStop(0,"rgba(255,244,214,1)");sun.addColorStop(.25,"rgba(255,220,160,.9)");sun.addColorStop(1,"rgba(255,200,140,0)");g.fillStyle=sun;g.fillRect(0,0,W,H);
    g.fillStyle="#2a1d1a";g.fillRect(0,H*.6,W,6);const sand=g.createLinearGradient(0,H*.6,0,H);sand.addColorStop(0,"#6e4b35");sand.addColorStop(1,"#c69a68");g.fillStyle=sand;g.fillRect(0,H*.6+4,W,H*.4);
    g.fillStyle="#0d0b10";[[W*.18,H*.18],[W*.86,H*.22]].forEach(([x,y])=>g.fillRect(x,y,8,H*.62-y+20));g.strokeStyle="rgba(13,11,16,.9)";g.lineWidth=5;g.beginPath();g.moveTo(W*.18,H*.2);g.lineTo(W*.86,H*.24);g.stroke();
    g.lineWidth=1;g.strokeStyle="rgba(13,11,16,.6)";for(let i=0;i<40;i++){const x=W*.18+(W*.68)*i/40;g.beginPath();g.moveTo(x,H*.2+i*.6);g.lineTo(x,H*.36+i*.6);g.stroke();}for(let j=0;j<6;j++){g.beginPath();g.moveTo(W*.18,H*.2+j*25);g.lineTo(W*.86,H*.24+j*25);g.stroke();}
    g.strokeStyle="rgba(255,255,255,.28)";g.lineWidth=4;g.beginPath();g.moveTo(-40,H);g.lineTo(W*.3,H*.66);g.lineTo(W*1.05,H*.68);g.stroke();}
  else if(mode==="court"){g.fillStyle="#5a3a22";g.fillRect(0,0,W,H);for(let y=0;y<H;y+=24){let x=-Math.random()*140;while(x<W){const L=120+Math.random()*160,v=Math.random()*22-11;g.fillStyle=`rgb(${120+v},${82+v*.8},${50+v*.6})`;g.fillRect(x,y,L-2,23);x+=L;}}
    g.fillStyle="rgba(11,10,15,.55)";g.fillRect(0,0,W,H);courtLines(g,W,H,rgba(A,.95),6);const r=g.createRadialGradient(W*.6,H*.4,0,W*.6,H*.4,W*.6);r.addColorStop(0,rgba(A,.25));r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,W,H);}
  else{g.fillStyle="#07060a";g.fillRect(0,0,W,H);const r=g.createRadialGradient(W*.72,H*.15,0,W*.72,H*.15,W*.75);r.addColorStop(0,rgba(A,.45));r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,W,H);
    g.globalCompositeOperation="lighter";[[.25,.32],[.55,.24],[.82,.3]].forEach(([x,w],i)=>{const gr=g.createLinearGradient(W*x,0,W*x,H);gr.addColorStop(0,i===1?rgba(A,.32):"rgba(255,240,220,.18)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.beginPath();g.moveTo(W*x-12,0);g.lineTo(W*x+12,0);g.lineTo(W*(x+w/2),H);g.lineTo(W*(x-w/2),H);g.closePath();g.fill();});
    for(let i=0;i<140;i++){const x=Math.random()*W,y=H*.15+Math.random()*H*.5,rr=2+Math.random()*9,gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,Math.random()<.3?rgba(A,.35):"rgba(255,236,210,.22)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
    g.globalCompositeOperation="source-over";courtLines(g,W,H,"rgba(255,255,255,.22)");}
  const v=g.createLinearGradient(0,0,0,H);v.addColorStop(0,"rgba(0,0,0,.15)");v.addColorStop(.6,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(11,10,15,.75)");g.fillStyle=v;g.fillRect(0,0,W,H);grain(g,W,H,.06);return c;};
function courtLines(g,W,H,style,lw){const P=(x,z)=>{const d=1+z*.9;return [W*.55+x*W*.55/d,H*.62+z*H*.38/d*1.4];};g.strokeStyle=style;g.lineWidth=lw||3;const L=(a,b)=>{const p=P(...a),q=P(...b);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();};
  L([-1,0],[1,0]);L([-1,0],[-1.25,1.2]);L([1,0],[1.25,1.2]);L([-1.08,.4],[1.08,.4]);}

/* ---------- player card ---------- */
let sheet=null,sheetP=null;const tinted={};
function loadSheet(){if(!sheetP)sheetP=new Promise(res=>{const im=new Image();im.onload=()=>{sheet=im;res(im);};im.onerror=()=>res(null);im.src="img/figure.webp";});return sheetP;}
function tint(color){if(tinted[color])return tinted[color];if(!sheet)return null;const c=document.createElement("canvas");c.width=sheet.width;c.height=sheet.height;const g=c.getContext("2d");g.drawImage(sheet,0,0);g.globalCompositeOperation="multiply";g.fillStyle=color;g.fillRect(0,0,c.width,c.height);
  g.globalCompositeOperation="screen";g.globalAlpha=.18;g.drawImage(sheet,0,0);g.globalAlpha=1;g.globalCompositeOperation="destination-in";g.drawImage(sheet,0,0);return tinted[color]=c;}
const FR=24,FW=280,FH=560,live=new Set();
function miniCourt(pos,acc){const z=POS_ZONE[pos]||[],cell=(n,x,y)=>`<rect x="${x}" y="${y}" width="20" height="${y<20?18:28}" fill="${z.includes(n)?acc:"none"}" fill-opacity=".85" stroke="rgba(255,255,255,.35)"/>`;
  return `<svg class="pc-court" viewBox="-1 -1 62 48" aria-hidden="true">${cell(4,0,0)}${cell(3,20,0)}${cell(2,40,0)}${cell(5,0,18)}${cell(6,20,18)}${cell(1,40,18)}<line x1="0" y1="-1" x2="60" y2="-1" stroke="#fff" stroke-width="2"/></svg>`;}
VB.renderCard=function(host,d,opt){opt=opt||{};const acc=d.accent||(VB.THEMES&&VB.THEMES[d.pos]||{c:"#d8b25a"}).c,ac=hexRgb(acc),s=d.stats||{},name=(d.nick||"Player").toUpperCase(),lvl=(()=>{const v=Object.values(s.lv||{});return v.length?(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):"–";})();
  const posL=(VB.POS[d.pos]||VB.POS.any).label,link=d.uid?VB.cardLink(d.uid):null,ini=(d.nick||"?").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
  host.innerHTML=`<div class="pcard3d" style="--acc:${acc};--acc-rgb:${ac.join(",")}"><div class="pc-inner">
    <div class="pc-face pc-front">
      <div class="pc-bg"${d.bg?` style="background-image:url('${d.bg}')"`:""}></div><div class="pc-shade"></div>
      <div class="pc-stripes"></div>
      <canvas class="pc-fig" width="${FW}" height="${FH}" aria-label="3D figure, drag to turn it"></canvas>
      <div class="pc-top"><div><span class="pc-pos">${POS_ABBR[d.pos]||"ALL"}</span><span class="pc-num">${d.number!=null?esc(d.number):"--"}</span></div>${miniCourt(d.pos,acc)}</div>
      <div class="pc-id">${d.pfp?`<img class="pc-pfp" src="${d.pfp}" alt="">`:`<span class="pc-pfp pc-ini">${esc(ini)}</span>`}<div><b class="pc-name">${esc(name)}</b><span>${esc(posL)}${d.exp?" · "+esc(d.exp):""}</span></div></div>
      <div class="pc-stats"><div><b>${s.vert!=null?VB.lenOut(s.vert):"–"}</b><span>Vert ${VB.lu()}</span></div><div><b>${s.sess28!=null?s.sess28:"–"}</b><span>Sess 28d</span></div><div><b>${s.streak!=null?s.streak:"–"}</b><span>Streak</span></div><div><b>${lvl}</b><span>Drill lvl</span></div></div>
      <div class="pc-sheen"></div>
    </div>
    <div class="pc-face pc-back"><div class="pc-bg"${d.bg?` style="background-image:url('${d.bg}')"`:""}></div><div class="pc-shade back"></div>
      ${link?`<div class="pc-qrbox"><canvas class="pc-qr" aria-label="QR code for ${esc(d.nick||"this player")}'s card"></canvas></div><b class="pc-scan">Scan to add ${esc(name)}</b><span class="pc-sub">Point a phone camera at the code. It opens this page on ${d.nick?esc(d.nick)+"'s":"their"} card.</span>`
        :`<b class="pc-scan">Sign in to get your code</b><span class="pc-sub">Open this page inside Claude while signed in, then create your player card in Squad.</span>`}
      <span class="pc-mark">VOLLEYBALL TRAINING JOURNEY</span><div class="pc-sheen"></div></div>
  </div></div>`;
  const card=$(".pcard3d",host),inner=$(".pc-inner",host),fig=$(".pc-fig",host);
  if(link){try{const ac=(getComputedStyle(document.documentElement).getPropertyValue("--gold")||"#ec3b52").trim(),lum=(h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h);if(!m)return 1;const v=parseInt(m[1],16);return (.299*(v>>16)+.587*(v>>8&255)+.114*(v&255))/255;})(ac);
    VB.qrStyled($(".pc-qr",host),link,{px:420,fg:"#17144d",eye:lum<.62?ac:"#ec3b52",eye2:"#5b2bff",bg:"#ffffff",quiet:2});}catch(e){}}
  const light=(()=>{const q=hexRgb(acc);return rgbHex(q[0]+(255-q[0])*.78,q[1]+(255-q[1])*.78,q[2]+(255-q[2])*.78);})(),st={f:Math.floor(Math.random()*FR),acc:light,fig,last:0,drag:null,host,d,accent:acc,yaw:-.6};
  card.addEventListener("pointermove",e=>{if(st.drag)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.style.setProperty("--rx",((.5-y)*14).toFixed(2)+"deg");card.style.setProperty("--ry",((x-.5)*18).toFixed(2)+"deg");card.style.setProperty("--mx",(x*100).toFixed(1)+"%");card.style.setProperty("--my",(y*100).toFixed(1)+"%");});
  card.addEventListener("pointerleave",()=>{card.style.setProperty("--rx","0deg");card.style.setProperty("--ry","0deg");});
  fig.addEventListener("pointerdown",e=>{st.drag={x:e.clientX,f:st.f,yaw:st.yaw||0};fig.setPointerCapture(e.pointerId);});
  fig.addEventListener("pointermove",e=>{if(!st.drag)return;st.f=((st.drag.f+Math.round((e.clientX-st.drag.x)/12))%FR+FR)%FR;st.yaw=st.drag.yaw+(e.clientX-st.drag.x)*.012;});
  fig.addEventListener("pointerup",()=>{st.drag=null;});fig.addEventListener("pointercancel",()=>{st.drag=null;});
  live.add(st);if(!cardGL3(st))loadSheet().then(()=>drawFig(st,true));
  return {flip(){card.classList.toggle("flipped");return card.classList.contains("flipped");},el:card};};
/* live 3D athlete on the card: one shared WebGL canvas renders each card's player, then it is copied into the card */
let CGL=null,cglFail=false;
function cardGL3(st){if(cglFail||!VB.GL||!VB.Athlete)return false;try{if(!CGL){const c=document.createElement("canvas");const R=VB.GL.renderer(c,{alpha:true});if(!R){cglFail=true;return false;}R.setSize(FW,FH,1);CGL={c,R};}}catch(e){cglFail=true;return false;}
  const G=VB.GL,d=st.d||{},clip=(VB.Athlete.forPos[d.pos]||"spike"),mine=VB.net&&d.uid===VB.net.uid||!d.uid,pl=VB.Athlete.player({...VB.lookOpts(d.look),clip,jersey:st.accent,accent:"#ffffff",number:d.number!=null?d.number:7,lefty:d.hand==="left",t0:Math.random()*2,fxColor:st.accent,...(mine?{}:{ballKind:"classic",fx:"trail"})});
  const root=new G.Node();root.add(pl.root);const glow=new G.Node(G.ring(0,1.1,48),G.mat({color:st.accent,unlit:true,transparent:true,opacity:.35,depthWrite:false}));root.add(glow);
  st.gl={scene:{root,clear:[0,0,0,0],light:{sky:[.75,.72,.95],gnd:[.15,.1,.3],d1:[.4,1,.7],c1:[1,.95,.92],d2:[-.6,.3,-.6],c2:[.5,.35,1],rim:[.7,.5,1]},shadow:{dir:[.35,1,.45],opacity:.35}},pl,glow,cam:{fov:30,pos:[0,0,0],target:[0,1,0],near:.1,far:50},last:0};return true;}
function drawGL(st,now){const g=st.gl,dt=Math.min(.05,(now-g.last)/1000||0);g.last=now;if(!VB.reduced)g.pl.update(dt);if(!st.drag&&!VB.reduced)st.yaw+=dt*.25;
  const P=g.pl.a.pelvis.pos,cx=P[0],cz=P[2],r=4.4,y=Math.max(.95,P[1]);g.glow.pos=[cx,.01,cz];
  g.cam.target=[cx,y*.95+.15,cz];g.cam.pos=[cx+Math.sin(st.yaw)*r,y+.5,cz+Math.cos(st.yaw)*r];CGL.R.render(g.scene,g.cam);
  const x=st.fig.getContext("2d");x.clearRect(0,0,FW,FH);x.drawImage(CGL.c,0,0,FW,FH);}
function drawFig(st,force){if(!st.fig.isConnected){live.delete(st);return;}if(st.gl){drawGL(st,performance.now());return;}const t=tint(st.acc);if(!t)return;const g=st.fig.getContext("2d"),r=Math.floor(st.f/6),c=st.f%6;if(!force&&st.drawn===st.f)return;st.drawn=st.f;g.clearRect(0,0,FW,FH);g.drawImage(t,c*FW,r*FH,FW,FH,0,0,FW,FH);}
VB.cardFrame=function(now){live.forEach(st=>{if(!st.fig.isConnected){live.delete(st);return;}if(st.gl){drawGL(st,now);return;}if(!st.drag&&!VB.reduced&&now-st.last>110){st.last=now;st.f=(st.f+1)%FR;}drawFig(st);});};

/* ---------- modal ---------- */
function modal(html,cls){const m=$("#modal");$("#mbody").innerHTML=html;m.className="modal "+(cls||"");m.hidden=false;document.body.classList.add("noscroll");setTimeout(()=>{const f=$("#mbody [data-autofocus]")||$(".mclose");f&&f.focus();},30);return $("#mbody");}
function closeModal(){$("#modal").hidden=true;$("#mbody").innerHTML="";document.body.classList.remove("noscroll");ed=null;}
VB.closeModal=closeModal;

/* ---------- my card data ---------- */
VB.myCard=function(){const p=VB.state.profile||{},st=VB.squad&&VB.squad.myStats?VB.squad.myStats():{};return {uid:VB.net&&VB.net.uid,nick:p.name||"",number:p.number,pos:p.pos||"any",exp:p.exp||"",look:p.look||null,hand:p.hand||"right",stats:st,pfp:VB.media.pfp,bg:VB.media.bg,accent:VB.media.accent};};

/* ---------- photo editor ---------- */
let ed=null;
const FILTERS=[["original","Original"],["punch","Punch"],["mono","Mono"],["duotone","Duotone"],["warm","Warm"],["night","Night"]];
const BGMODES=[["photo","From my photo"],["upload","Upload a photo"],["arena","Arena lights"],["net","At the net"],["beach","Beach sunset"],["court","Hardwood"]];
function openEditor(tab){ed={tab:tab||"photo",img:null,url:null,zoom:1,ox:0,oy:0,filter:"original",bgImg:null,bgUrl:null,bgZoom:1,bgox:0,bgoy:0,bgFilter:"original",bgMode:VB.media.bgMode||"arena",accent:VB.media.accent};
  modal(`<div class="mhead"><div class="stat">Profile</div><h3>Photo, background and card colour</h3></div>
   <div class="tabs" id="edTabs"><button type="button" data-et="photo">Profile photo</button><button type="button" data-et="bg">Background</button><button type="button" data-et="color">Card colour</button></div><div id="edBody"></div>`,"wide");
  $("#edTabs").addEventListener("click",e=>{const b=e.target.closest("[data-et]");if(b){ed.tab=b.dataset.et;edRender();}});edRender();}
function edRender(){if(!ed)return;$$("#edTabs button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.et===ed.tab));const body=$("#edBody"),acc=VB.myAccent();
  if(ed.tab==="photo"){body.innerHTML=`<div class="edgrid"><div class="cropwrap round"><canvas id="cropCv" width="560" height="560" aria-label="Drag to position your photo"></canvas>${ed.img||VB.media.pfp?"":`<div class="cropempty">Add a photo of yourself</div>`}</div>
     <div class="stack" style="gap:12px"><div class="row"><label class="btn primary filebtn">Take a photo<input type="file" accept="image/*" capture="user" id="pfFile1"></label><label class="btn filebtn">Choose a photo<input type="file" accept="image/*" id="pfFile2"></label></div>
     ${ed.img?`<label class="f">Zoom<input type="range" id="pfZoom" min="1" max="4" step=".01" value="${ed.zoom}"></label><p class="small muted">Drag the photo to position it.</p>
      <div><div class="grp" style="margin-bottom:6px">Filter</div><div class="chips">${FILTERS.map(([k,l])=>`<button type="button" class="chip" data-pf="${k}" aria-pressed="${ed.filter===k}">${l}</button>`).join("")}</div></div>
      <div class="row"><button type="button" class="btn primary" id="pfSave">Save photo</button></div>`:`<p class="small muted">Your photo shows on your profile and your player card. Friends who can open this page see it once you publish your card in Squad.</p>`}
     ${VB.media.pfp&&!ed.img?`<div class="row"><button type="button" class="btn sm" id="pfRemove">Remove my photo</button></div>`:""}<p class="err" id="edErr" role="alert" hidden></p></div></div>`;
    drawCrop();bindCrop("cropCv","pf");}
  else if(ed.tab==="bg"){body.innerHTML=`<div class="stack" style="gap:12px"><div class="cropwrap wide"><canvas id="bgCv" width="1200" height="480" aria-label="Background preview"></canvas></div>
     <div class="chips">${BGMODES.map(([k,l])=>`<button type="button" class="chip" data-bm="${k}" aria-pressed="${ed.bgMode===k}" ${k==="photo"&&!VB.media.pfp&&!ed.img?"disabled":""}>${l}</button>`).join("")}</div>
     ${ed.bgMode==="photo"&&!VB.media.pfp?`<p class="small muted">Add a profile photo first. This background is built from its colours.</p>`:""}
     ${ed.bgMode==="upload"?`<div class="row"><label class="btn filebtn">Choose a background photo<input type="file" accept="image/*" id="bgFile"></label>${ed.bgImg?`<label class="f" style="flex:1;min-width:160px">Zoom<input type="range" id="bgZoom" min="1" max="4" step=".01" value="${ed.bgZoom}"></label>`:""}</div>
       ${ed.bgImg?`<div class="chips">${FILTERS.map(([k,l])=>`<button type="button" class="chip" data-bf="${k}" aria-pressed="${ed.bgFilter===k}">${l}</button>`).join("")}</div><p class="small muted">Drag the photo to position it.</p>`:""}`:""}
     <div class="row"><button type="button" class="btn primary" id="bgSave" ${ed.bgMode==="upload"&&!ed.bgImg?"disabled":""}>Save background</button><span class="small muted">The generated scenes use your card colour.</span></div><p class="err" id="edErr" role="alert" hidden></p></div>`;
    drawBgPreview();if(ed.bgImg)bindCrop("bgCv","bg");}
  else{const pal=VB.media.pfp?ed.pal||[]:[];body.innerHTML=`<div class="stack" style="gap:14px"><p class="small muted">Your card colour tints your profile, your card's 3D figure and the generated backgrounds.</p>
     <div class="swatches"><button type="button" class="sw" data-acc="" aria-pressed="${!ed.accent}" style="--c:${(VB.THEMES[(VB.state.profile||{}).pos||"any"]||{c:"#d8b25a"}).c}"><i></i>Position colour</button>
     ${pal.map(c=>`<button type="button" class="sw" data-acc="${c}" aria-pressed="${ed.accent===c}" style="--c:${c}"><i></i>From photo</button>`).join("")}
     ${["#e0483f","#f2c14a","#ff7a3d","#4fe0a8","#5cc8ff","#b79bff","#ff7aa8","#f4f1e8"].map(c=>`<button type="button" class="sw dot" data-acc="${c}" aria-pressed="${ed.accent===c}" style="--c:${c}" aria-label="Colour ${c}"><i></i></button>`).join("")}</div>
     ${VB.media.pfp?"":`<p class="small muted">Add a profile photo to get colours picked from it.</p>`}
     <div class="row"><button type="button" class="btn primary" id="accSave">Save colour</button></div></div>`;
    if(VB.media.pfp&&!ed.pal)dataImage(VB.media.pfp).then(im=>{if(im&&ed){ed.pal=palette(im);if(ed.tab==="color")edRender();}});}}
function coverDraw(g,im,W,H,zoom,ox,oy){const sc=Math.max(W/im.width,H/im.height)*zoom,w=im.width*sc,h=im.height*sc;g.drawImage(im,(W-w)/2+ox*W,(H-h)/2+oy*H,w,h);}
function clampOff(im,W,H,zoom,o){const sc=Math.max(W/im.width,H/im.height)*zoom,mx=Math.max(0,(im.width*sc-W)/2/W),my=Math.max(0,(im.height*sc-H)/2/H);o[0]=Math.max(-mx,Math.min(mx,o[0]));o[1]=Math.max(-my,Math.min(my,o[1]));return o;}
function drawCrop(){const c=$("#cropCv");if(!c)return;const g=c.getContext("2d");g.fillStyle="#15141b";g.fillRect(0,0,c.width,c.height);
  if(ed.img){coverDraw(g,ed.img,c.width,c.height,ed.zoom,ed.ox,ed.oy);applyFilter(c,ed.filter,VB.myAccent());}else if(VB.media.pfp)dataImage(VB.media.pfp).then(im=>{if(im&&!ed.img&&$("#cropCv")===c)g.drawImage(im,0,0,c.width,c.height);});}
function drawBgPreview(){const c=$("#bgCv");if(!c)return;const g=c.getContext("2d"),acc=VB.myAccent();
  if(ed.bgMode==="upload"){g.fillStyle="#15141b";g.fillRect(0,0,c.width,c.height);if(ed.bgImg){coverDraw(g,ed.bgImg,c.width,c.height,ed.bgZoom,ed.bgox,ed.bgoy);applyFilter(c,ed.bgFilter,acc);const v=g.createLinearGradient(0,0,0,c.height);v.addColorStop(.55,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(11,10,15,.7)");g.fillStyle=v;g.fillRect(0,0,c.width,c.height);}
    else{g.fillStyle="#9a97a6";g.font="600 34px sans-serif";g.textAlign="center";g.fillText("Choose a photo for your background",c.width/2,c.height/2);}return;}
  const go=im=>{const out=VB.genBg(ed.bgMode,acc,im);g.drawImage(out,0,0,c.width,c.height);};
  if(ed.bgMode==="photo"){if(ed.img){const t=document.createElement("canvas");t.width=t.height=400;coverDraw(t.getContext("2d"),ed.img,400,400,ed.zoom,ed.ox,ed.oy);go(t);}else dataImage(VB.media.pfp).then(im=>go(im));}else go(null);}
function bindCrop(id,kind){const c=$("#"+id);if(!c)return;let drag=null;c.style.touchAction="none";
  c.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,o:kind==="pf"?[ed.ox,ed.oy]:[ed.bgox,ed.bgoy]};c.setPointerCapture(e.pointerId);});
  c.addEventListener("pointermove",e=>{if(!drag)return;const r=c.getBoundingClientRect(),o=[drag.o[0]+(e.clientX-drag.x)/r.width,drag.o[1]+(e.clientY-drag.y)/r.height];
    if(kind==="pf"){if(!ed.img)return;clampOff(ed.img,c.width,c.height,ed.zoom,o);ed.ox=o[0];ed.oy=o[1];drawCrop();}else{clampOff(ed.bgImg,c.width,c.height,ed.bgZoom,o);ed.bgox=o[0];ed.bgoy=o[1];drawBgPreview();}});
  c.addEventListener("pointerup",()=>{drag=null;});c.addEventListener("pointercancel",()=>{drag=null;});}
async function pickFile(input,kind){const f=input.files&&input.files[0];input.value="";if(!f)return;const err=$("#edErr");
  try{const {im,u}=await fileImage(f);if(kind==="pf"){if(ed.url)URL.revokeObjectURL(ed.url);ed.img=im;ed.url=u;ed.zoom=1;ed.ox=ed.oy=0;ed.pal=palette(im);}else{if(ed.bgUrl)URL.revokeObjectURL(ed.bgUrl);ed.bgImg=im;ed.bgUrl=u;ed.bgZoom=1;ed.bgox=ed.bgoy=0;}edRender();}
  catch(e){if(err){err.hidden=false;err.textContent="That file could not be opened as a photo. Try a JPEG or PNG.";}}}
function exportJpeg(c,q){let u=c.toDataURL("image/jpeg",q);if(u.length>170000)u=c.toDataURL("image/jpeg",q-.15);return u;}
document.addEventListener("change",e=>{if(!ed)return;const id=e.target.id;if(id==="pfFile1"||id==="pfFile2")pickFile(e.target,"pf");if(id==="bgFile")pickFile(e.target,"bg");});
document.addEventListener("input",e=>{if(!ed)return;if(e.target.id==="pfZoom"){ed.zoom=+e.target.value;const o=clampOff(ed.img,560,560,ed.zoom,[ed.ox,ed.oy]);ed.ox=o[0];ed.oy=o[1];drawCrop();}
  if(e.target.id==="bgZoom"){ed.bgZoom=+e.target.value;const o=clampOff(ed.bgImg,1200,480,ed.bgZoom,[ed.bgox,ed.bgoy]);ed.bgox=o[0];ed.bgoy=o[1];drawBgPreview();}});
document.addEventListener("click",e=>{const b=e.target.closest("button");
  if(e.target.id==="modal"||(b&&b.classList.contains("mclose"))){closeModal();return;}
  if(!b||!ed||!b.closest("#mbody"))return;const d=b.dataset;
  if(d.pf){ed.filter=d.pf;edRender();return;}
  if(d.bf){ed.bgFilter=d.bf;edRender();return;}
  if(d.bm){ed.bgMode=d.bm;edRender();return;}
  if(d.acc!=null){ed.accent=d.acc||null;edRender();return;}
  if(b.id==="pfSave"&&ed.img){const c=document.createElement("canvas");c.width=c.height=320;coverDraw(c.getContext("2d"),ed.img,320,320,ed.zoom,ed.ox,ed.oy);applyFilter(c,ed.filter,VB.myAccent());VB.media.pfp=exportJpeg(c,.86);
    if(VB.media.bgMode==="photo"){const out=VB.genBg("photo",VB.myAccent(),c);VB.media.bg=exportJpeg(out,.74);}saveMedia();ed.img=null;VB.profile.refresh();VB.ui.toast("Profile photo saved.");ed.tab="bg";edRender();return;}
  if(b.id==="pfRemove"){VB.media.pfp=null;if(VB.media.bgMode==="photo"){VB.media.bgMode="arena";VB.media.bg=null;}saveMedia();VB.profile.refresh();edRender();VB.ui.toast("Photo removed.");return;}
  if(b.id==="bgSave"){const acc=VB.myAccent();VB.media.bgMode=ed.bgMode;
    if(ed.bgMode==="upload"&&ed.bgImg){const c=document.createElement("canvas");c.width=1200;c.height=480;const g=c.getContext("2d");coverDraw(g,ed.bgImg,1200,480,ed.bgZoom,ed.bgox,ed.bgoy);applyFilter(c,ed.bgFilter,acc);const v=g.createLinearGradient(0,0,0,480);v.addColorStop(.55,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(11,10,15,.7)");g.fillStyle=v;g.fillRect(0,0,1200,480);VB.media.bg=exportJpeg(c,.74);}
    else if(ed.bgMode==="photo"){dataImage(VB.media.pfp).then(im=>{if(!im)return;VB.media.bg=exportJpeg(VB.genBg("photo",acc,im),.74);saveMedia();VB.profile.refresh();});closeModal();VB.ui.toast("Background saved.");return;}
    else VB.media.bg=exportJpeg(VB.genBg(ed.bgMode,acc,null),.74);
    saveMedia();VB.profile.refresh();closeModal();VB.ui.toast("Background saved.");return;}
  if(b.id==="accSave"){VB.media.accent=ed.accent||null;const m=VB.media.bgMode;if(m&&m!=="upload"){if(m==="photo")dataImage(VB.media.pfp).then(im=>{VB.media.bg=im?exportJpeg(VB.genBg("photo",VB.myAccent(),im),.74):null;saveMedia();VB.profile.refresh();});else VB.media.bg=exportJpeg(VB.genBg(m,VB.myAccent(),null),.74);}
    saveMedia();VB.profile.refresh();closeModal();VB.ui.toast("Card colour saved.");return;}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)closeModal();});

/* ---------- scanning ---------- */
let jsqrP=null;
function loadJsQR(){if(window.jsQR)return Promise.resolve(window.jsQR);if(!jsqrP)jsqrP=new Promise(res=>{const s=document.createElement("script");s.src="js/vendor/jsqr-1.4.0.js";s.onload=()=>res(window.jsQR||null);s.onerror=()=>res(null);document.head.appendChild(s);});return jsqrP;}
async function decodeImage(im){if("BarcodeDetector" in window){try{const bd=new window.BarcodeDetector({formats:["qr_code"]}),r=await bd.detect(im);if(r&&r[0])return r[0].rawValue;}catch(e){}}
  const jq=await loadJsQR();if(!jq)return null;for(const M of [1000,640,1400]){const sc=Math.min(1,M/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(im,0,0,c.width,c.height);
    const r=jq(g.getImageData(0,0,c.width,c.height).data,c.width,c.height);if(r&&r.data)return r.data;}return null;}
function idFromText(t){const m=String(t||"").match(/#p-([A-Za-z0-9-]+)/);return m?VB.decId(m[1]):null;}
VB.openScanner=function(){modal(`<div class="mhead"><div class="stat">Squad</div><h3>Scan a player card</h3></div>
   <p class="small muted">Take a photo of the code on the back of a teammate's card, or paste the link they sent you. Your phone's own camera app also works: point it at the code and open the link.</p>
   <div class="row"><label class="btn primary filebtn">Take a photo of the code<input type="file" accept="image/*" capture="environment" id="scFile"></label><label class="btn filebtn">Choose a screenshot<input type="file" accept="image/*" id="scFile2"></label></div>
   <div class="row"><input class="in" id="scLink" placeholder="Or paste a card link" style="flex:1;min-width:200px" aria-label="Card link" data-autofocus><button type="button" class="btn" id="scGo">Open card</button></div>
   <p class="small" id="scMsg" role="status"></p>`);
  const msg=t=>{$("#scMsg").textContent=t;};
  const onFile=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;msg("Reading the code.");try{const {im,u}=await fileImage(f),txt=await decodeImage(im);URL.revokeObjectURL(u);const id=idFromText(txt);
      if(id)VB.openPlayer(id);else msg(txt?"That code is not a player card from this page.":"No code found. Fill the frame with the code, hold steady, and try again.");}catch(err){msg("That file could not be opened as a photo.");}};
  $("#scFile").addEventListener("change",onFile);$("#scFile2").addEventListener("change",onFile);
  $("#scGo").addEventListener("click",()=>{const id=idFromText($("#scLink").value);if(id)VB.openPlayer(id);else msg("That link is not a player card link. It should end with #p- and a code.");});};
VB.openPlayer=async function(id){id=VB.safeUid(id);if(!id)return;const mine=VB.net&&id===VB.net.uid;
  const body=modal(`<div class="pmodal"><div id="pmCard" class="cardhost"><div class="card"><p class="muted">Loading the card.</p></div></div><div class="stack" id="pmSide" style="gap:12px"></div></div>`,"wide");
  if(mine){VB.renderCard($("#pmCard"),VB.myCard());$("#pmSide").innerHTML=`<div class="stat">This is you</div><h3>Your player card</h3><p class="small muted">This is what teammates see when they scan your code.</p><a class="btn" href="#profile" data-close>Go to my profile</a>`;return;}
  if(!VB.net){$("#pmCard").innerHTML=`<div class="card"><p>Open this page inside Claude while signed in to see other players' cards.</p></div>`;return;}
  let doc=null;try{const s=await VB.net.db.doc("players/"+id).get();doc=s.exists?VB.cleanCard(s.data()):null;}catch(e){}
  if(!doc){$("#pmCard").innerHTML=`<div class="card"><h3>Card not found</h3><p class="small muted">This player has removed their card, or the code is from a page you cannot open.</p></div>`;return;}
  const md=await VB.mediaOf(id)||{};const d={uid:id,nick:doc.nick,number:doc.number,pos:doc.pos,exp:doc.exp,look:doc.look||null,hand:doc.hand||"right",stats:doc.stats||{},pfp:md.pfp,bg:md.bg,accent:md.accent};
  VB.renderCard($("#pmCard"),d);const cp=VB.compat((VB.state.profile||{}).pos,doc.pos),rel=VB.squad.relation(id);
  $("#pmSide").innerHTML=`<div class="stat">${esc((VB.POS[doc.pos]||VB.POS.any).label)}</div><h3>${esc(doc.nick||"Player")}${doc.number!=null?" · "+esc(doc.number):""}</h3>
    <div class="fitbox"><div class="row" style="justify-content:space-between"><span class="stat">Position fit with you</span><span class="fit f${cp[0]}">${cp[0]} / 5</span></div><p class="small">${esc(cp[1])}</p><p class="small"><span class="grp">Train together</span> ${cp[2].map(s=>VB.SKILLS[s]).join(" · ")}</p></div>
    ${rel==="friend"?`<span class="pill ok">Friends</span>`:rel==="out"?`<span class="pill">Request sent</span>`:!(VB.state.social&&VB.state.social.joined)?`<p class="small muted">Create your own player card to add friends.</p><a class="btn primary" href="#squad" data-close>Create my card</a>`:`<button type="button" class="btn primary" id="pmAdd">${rel==="inc"?"Accept friend request":"Add friend"}</button>`}`;
  const add=$("#pmAdd");if(add)add.addEventListener("click",()=>{VB.squad.addFriend(id);add.outerHTML=`<span class="pill ok">${rel==="inc"?"Friends":"Request sent"}</span>`;});};
document.addEventListener("click",e=>{const a=e.target.closest("[data-close]");if(a&&a.closest("#mbody"))closeModal();});

/* ---------- profile page ---------- */
VB.profile=(function(){let cardApi=null;
  function render(){setTimeout(()=>VB.renderLocker&&VB.renderLocker(),0);const host=$("#profTop");if(!host||!VB.state.profile)return;const p=VB.state.profile,acc=VB.myAccent(),c=hexRgb(acc),d=VB.myCard(),posL=(VB.POS[p.pos]||VB.POS.any).label,ini=(p.name||"?").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const words=(p.name||posL).trim().split(/\s+/).slice(0,2);
    host.className="ptop2";host.style.setProperty("--acc",acc);host.style.setProperty("--acc-rgb",c.join(","));
    host.innerHTML=`<div class="ptbg"${VB.media.bg?` style="background-image:url('${VB.media.bg}')"`:""}></div><div class="ptduo"></div>
     <div class="ptbig" aria-hidden="true">${words.map(w=>`<span>${esc(w)}</span>`).join("")}</div>
     <div class="ptbtns"><button type="button" class="btn sm" data-ed="bg">Change background</button><button type="button" class="btn sm" data-ed="color">Card colour</button></div>
     <div class="ptcenter"><button type="button" class="ptcircle" data-ed="photo" aria-label="Change profile photo">${VB.media.pfp?`<img src="${VB.media.pfp}" alt="">`:`<span class="ini">${esc(ini)}</span>`}</button>
      <div class="pttext"><div class="role">${esc(posL)}${p.number!=null?" · No. "+esc(p.number):""}</div><h1 class="pname">${esc(p.name||"Your profile")}</h1><p>${esc(p.exp?p.exp[0].toUpperCase()+p.exp.slice(1):"")} · ${esc(VB.activeProgram().def.name)}</p>
       <button type="button" class="arrowlink" data-ed="photo"><span>${VB.media.pfp?"Edit photo":"Add a photo"}</span><i aria-hidden="true">→</i></button></div></div>`;
    const ch=$("#cardHost");if(ch){cardApi=VB.renderCard(ch,d);}
    const ql=$("#cardLink");if(ql)ql.hidden=!d.uid;}
  document.addEventListener("click",e=>{const b=e.target.closest("[data-ed]");if(b&&b.closest("#v-profile")){openEditor(b.dataset.ed);return;}
    if(e.target.closest("#cardFlip")){if(cardApi){const f=cardApi.flip();e.target.closest("#cardFlip").textContent=f?"Show the front":"Show my code";}}
    if(e.target.closest("#cardLink")){const d=VB.myCard();if(!d.uid)return;navigator.clipboard.writeText(VB.cardLink(d.uid)).then(()=>VB.ui.toast("Card link copied. Send it to a teammate."),()=>VB.ui.toast("Copying was blocked. Show them your code instead."));}
    if(e.target.closest("[data-scan]"))VB.openScanner();});
  return {refresh(){render();VB.squad&&VB.squad.refresh();},render};
})();
})();
