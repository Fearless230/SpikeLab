/* arena.js: indoor volleyball arena for gl.js. Regulation court (18 x 9 m, net at x = 0), net with antennas and posts,
   stands with a crowd, light beams, LED boards and floating dust. Shared by the home screen and the Skills court. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const G=VB.GL,{Node}=G;
function rgbStr(c,a){const h=G.hex(c);return `rgba(${Math.round(h[0]*255)},${Math.round(h[1]*255)},${Math.round(h[2]*255)},${a==null?1:a})`;}
function floorTex(o){const W=2048,H=1024,X=W/36,Z=H/18,px=x=>(x+18)*X,pz=z=>(z+9)*Z;
  return G.canvasTex(W,H,(g)=>{
    // free zone with subtle planks
    g.fillStyle=o.free;g.fillRect(0,0,W,H);
    for(let i=0;i<220;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.018})`;g.fillRect(0,Math.random()*H,W,1+Math.random()*2);}
    // court
    g.fillStyle=o.court;g.fillRect(px(-9),pz(-4.5),18*X,9*Z);
    // front zones tinted with the accent
    g.fillStyle=rgbStr(o.accent,.22);g.fillRect(px(-3),pz(-4.5),6*X,9*Z);
    const grd=g.createRadialGradient(px(0),pz(0),10,px(0),pz(0),9*X);grd.addColorStop(0,"rgba(255,255,255,.08)");grd.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=grd;g.fillRect(0,0,W,H);
    g.strokeStyle="#f4f2ff";g.lineWidth=.05*X;g.strokeRect(px(-9)+.025*X,pz(-4.5)+.025*Z,18*X-.05*X,9*Z-.05*Z);
    [[-3],[3],[0]].forEach(([x])=>{g.beginPath();g.moveTo(px(x),pz(-4.5));g.lineTo(px(x),pz(4.5));g.stroke();});
    // dashed attack line extensions
    g.setLineDash([.15*X,.2*X]);[-3,3].forEach(x=>{[[-4.5,-6.25],[4.5,6.25]].forEach(([a,b])=>{g.beginPath();g.moveTo(px(x),pz(a));g.lineTo(px(x),pz(b));g.stroke();});});g.setLineDash([]);
    // centre ball logo + wordmark in the free zone
    g.save();g.translate(px(-13.3),pz(0));g.rotate(-Math.PI/2);g.fillStyle="rgba(255,255,255,.1)";g.font=`800 ${1.15*Z}px 'Barlow Condensed','Arial Narrow',sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(o.word||"PUSH YOUR LIMITS",0,0);g.restore();
    g.save();g.translate(px(13.3),pz(0));g.rotate(Math.PI/2);g.fillStyle="rgba(255,255,255,.1)";g.font=`800 ${1.15*Z}px 'Barlow Condensed','Arial Narrow',sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(o.word2||"VOLLEYBALL JOURNEY",0,0);g.restore();
  });}
function netTex(){return G.canvasTex(1024,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle="rgba(15,14,22,.75)";g.lineWidth=1.2;const c=w/95;for(let x=0;x<=w;x+=c){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<=h;y+=c){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
  g.fillStyle="#f6f6f6";g.fillRect(0,0,w,h*.07);g.fillRect(0,h*.95,w,h*.05);g.fillStyle="rgba(0,0,0,.2)";g.fillRect(0,h*.07,w,2);});}
function stripeTex(){return G.canvasTex(32,256,(g,w,h)=>{for(let i=0;i<10;i++){g.fillStyle=i%2?"#ffffff":"#e8213b";g.fillRect(0,i*h/10,w,h/10);}});}
function ledTex(text,accent){return G.canvasTex(2048,128,(g,w,h)=>{g.fillStyle="#0b0920";g.fillRect(0,0,w,h);const grd=g.createLinearGradient(0,0,w,0);grd.addColorStop(0,rgbStr(accent,.0));grd.addColorStop(.5,rgbStr(accent,.35));grd.addColorStop(1,rgbStr(accent,0));g.fillStyle=grd;g.fillRect(0,0,w,h);
  g.font="800 92px 'Barlow Condensed','Arial Narrow',sans-serif";g.textBaseline="middle";g.fillStyle="#ffffff";let x=20;const parts=text.split("|");let i=0;while(x<w){const t=parts[i%parts.length];g.fillStyle=i%2?rgbStr(accent):"#ffffff";g.fillText(t,x,h/2+4);x+=g.measureText(t).width+70;i++;}
  g.fillStyle="rgba(0,0,0,.25)";for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1);});}
function build(o){o=Object.assign({accent:"#ec3b52",court:"#2b2486",free:"#151140",netH:2.43,crowd:true,beams:true,dust:true,boards:true,glossy:true},o||{});
  const root=new Node(),acc=G.hex(o.accent);
  const floor=new Node(G.plane(36,18),G.mat({map:floorTex(o),rough:o.glossy?.32:.6,rim:0}));root.add(floor);
  const under=new Node(G.plane(160,120),G.mat({color:"#0a0820",rough:.9,rim:0}));under.pos=[0,-.01,0];root.add(under);
  // net, band, cable, posts, antennas
  const netG=new Node();root.add(netG);
  function buildNet(h){netG.clear();const net=new Node(G.quad(9.5,1),G.mat({map:netTex(),transparent:true,double:true,depthWrite:false,rough:.9,rim:0}));net.pos=[0,h-.5,0];net.rot=[0,Math.PI/2,0];netG.add(net);
    const post=G.mat({color:"#d9d7e6",rough:.35,metal:.6});[-5.1,5.1].forEach(z=>{const p=new Node(G.cyl(.05,.05,h+.35,16,true),post);p.pos=[0,0,z];p.castShadow=true;netG.add(p);const pad=new Node(G.cyl(.14,.14,1.8,20,true),G.mat({color:o.accent,rough:.7}));pad.pos=[0,0,z];pad.castShadow=true;netG.add(pad);});
    const cable=new Node(G.cyl(.006,.006,10.2,6),G.mat({color:"#cccccc",rough:.4}));cable.pos=[0,h,-5.1];cable.rot=[Math.PI/2,0,0];netG.add(cable);
    const st=stripeTex();[-4.5,4.5].forEach(z=>{const a=new Node(G.cyl(.005,.005,1.8,10,true),G.mat({map:st,rough:.5}));a.scl=[2,1,2];a.pos=[0,h-1.0,z];a.castShadow=true;netG.add(a);});}
  buildNet(o.netH);
  // stands and crowd
  if(o.crowd){const parts=[],cols=[[.32,.32,.38],[.1,.08,.24],acc.map(v=>v*.45),[.18,.1,.42],[.34,.27,.2],[.22,.15,.12],[.07,.07,.09]];
    const tier=(x0,x1,z,dir,along)=>{for(let r=0;r<9;r++){const y=.5+r*.55,d=r*.75;for(let s=x0;s<x1;s+=.55){if(Math.random()<.12)continue;const c=cols[Math.floor(Math.random()*cols.length)],jit=(Math.random()-.5)*.12;
      const px=along?s:z+dir*d,pz=along?z+dir*d:s;parts.push([G.sphere(1,7,5),G.T(px+(along?jit:0),y+.26,pz+(along?0:jit),0,0,0,.2,.3,.15),c]);parts.push([G.sphere(.1,7,5),G.T(px+(along?jit:0),y+.64,pz+(along?0:jit)),[.26,.19,.16]]);}}
      const stepG=G.box(along?(x1-x0):9*.75,.04,along?9*.75:(x1-x0));};
    tier(-15,15,-11,-1,true);tier(-15,15,11,1,true);tier(-8,8,-16,-1,false);tier(-8,8,16,1,false);
    const crowd=new Node(G.merge(parts),G.mat({vcolor:true,rough:.9,rim:.4}));root.add(crowd);
    const sp=[];[[0,-14.7,30,7.4,true],[0,14.7,30,7.4,true],[-19.6,0,22,7.4,false],[19.6,0,22,7.4,false]].forEach(([x,z,l,dp,al])=>{for(let r=0;r<9;r++){sp.push([G.box(al?l:.75,.5+r*.55,al?.75:l),G.T(al?x:x+Math.sign(x)*(r*.75-3.4),(.5+r*.55)/2,al?z+Math.sign(z)*(r*.75-3.4):z),[.12,.1,.3]]);}});
    root.add(new Node(G.merge(sp),G.mat({vcolor:true,rough:.8,rim:.2})));
    const wall=G.mat({color:"#0d0b2a",rough:.9,rim:0});[[0,-19,40,0],[0,19,40,Math.PI],[-23,0,40,Math.PI/2],[23,0,40,-Math.PI/2]].forEach(([x,z,w,ry])=>{const q=new Node(G.quad(w*1.4,22),wall);q.pos=[x,11,z];q.rot=[0,ry,0];root.add(q);});}
  // LED boards
  if(o.boards){const tx=ledTex(o.led||"PUSH YOUR LIMITS|EVERY REP ON THE RECORD|VOLLEYBALL TRAINING JOURNEY",o.accent),m=G.mat({map:tx,unlit:true,fog:false});
    [[0,-8.3,28,0],[0,8.3,28,Math.PI],[-13.2,0,14,Math.PI/2],[13.2,0,14,-Math.PI/2]].forEach(([x,z,w,ry])=>{const b=new Node(G.quad(w,.9),m);b.pos=[x,.45,z];b.rot=[0,ry,0];root.add(b);const back=new Node(G.box(w,.92,.12),G.mat({color:"#0b0920"}));back.pos=[x-Math.sin(ry)*.07,.46,z-Math.cos(ry)*.07];back.rot=[0,ry,0];root.add(back);});}
  // light beams and fixtures
  const beams=new Node();root.add(beams);
  if(o.beams){[[-5,-2.5],[5,2.5],[-1.5,3],[2,-3.5],[-9,1],[8.5,-1]].forEach(([x,z],i)=>{const h=17,cone=new Node(G.lathe([[2.6,0],[.35,h]],32),G.mat({color:i%2?"#ffffff":o.accent,unlit:true,additive:true,transparent:true,opacity:.055,double:true,depthWrite:false,fog:false}));cone.pos=[x,0,z];cone.userData.base=.055;cone.userData.ph=i*1.7;beams.add(cone);
      const lamp=new Node(G.sphere(.35,12,8),G.mat({color:"#ffffff",unlit:true,fog:false}));lamp.pos=[x,h,z];beams.add(lamp);
      const pool=new Node(G.ring(0,2.4,40),G.mat({color:i%2?"#ffffff":o.accent,unlit:true,additive:true,transparent:true,opacity:.06,depthWrite:false}));pool.pos=[x,.012,z];beams.add(pool);});}
  // dust in the light
  let dust=null;if(o.dust){const parts=[];for(let i=0;i<260;i++){const r=Math.sqrt(Math.random())*7,a=Math.random()*6.283;parts.push([G.sphere(.012+Math.random()*.02,4,3),G.T(Math.cos(a)*r*1.6,.3+Math.random()*9,Math.sin(a)*r)]);}
    dust=new Node(G.merge(parts),G.mat({color:"#ffffff",unlit:true,additive:true,transparent:true,opacity:.45,depthWrite:false,fog:false}));root.add(dust);}
  return {root,netG,setNet:buildNet,beams,dust,update(t){beams.children.forEach(c=>{if(c.userData.base)c.mat.opacity=c.userData.base*(.8+.2*Math.sin(t*.7+c.userData.ph));});if(dust){dust.rot=[0,t*.02,0];dust.pos=[0,Math.sin(t*.3)*.2,0];}}};}
VB.Arena={build,scene(o){o=o||{};return {clear:G.hex(o.clear||"#07061a").concat([1]),light:{sky:o.sky||[.42,.42,.62],gnd:o.gnd||[.1,.08,.2],d1:[.35,1,.45],c1:o.c1||[1,.95,.9],d2:[-.6,.35,-.5],c2:o.c2||[.32,.26,.62],rim:o.rim||[.45,.38,.95],spot:o.spot||null},fog:{col:G.hex(o.fogc||"#07061a"),near:o.fogN||18,far:o.fogF||48},shadow:{dir:[.35,1,.45],opacity:.42}};}};
})();
