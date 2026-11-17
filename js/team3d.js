/* team3d.js: your team's lineup on the 3D court. Six starters stand in their rotation zones, the libero takes the
   back-row middle's spot, subs line the bench. Each player wears the team colour, their own look and number,
   with their profile photo floating above them. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
VB.team3d=(function(){
  const G=VB.GL;let R=null,cv=null,host=null,scene=null,arena=null,cam={fov:38,pos:[-15,7,7],target:[-4,.9,0],near:.1,far:140},orbit=null,people=[],sig="",last=0,W=0,H=0,failed=false;
  // zones on our side (net at x = 0, we face +x, our right is +z)
  const ZONE={1:[-6.2,3],2:[-1.6,3],3:[-1.6,0],4:[-1.6,-3],5:[-6.2,-3],6:[-6.2,0]};
  const BASE={S:1,OH1:6,MB1:5,OPP:4,OH2:3,MB2:2};
  const zoneAt=(k,r)=>((BASE[k]-1-(r-1))%6+6)%6+1;
  const POSN={setter:"Setter",outside:"Outside",middle:"Middle",opposite:"Opposite",libero:"Libero",any:"Player"};
  function badge(info,color){const tex=G.canvasTex(256,320,()=>{});const c=tex.img,g=c.getContext("2d");
    const draw=img=>{g.clearRect(0,0,256,320);g.save();g.beginPath();g.arc(128,118,100,0,7);g.closePath();g.fillStyle="#17144d";g.fill();g.clip();
      if(img){const s=Math.max(200/img.width,200/img.height),w=img.width*s,h=img.height*s;g.drawImage(img,128-w/2,118-h/2,w,h);}
      else{g.fillStyle=color;g.fillRect(0,0,256,256);g.fillStyle="#fff";g.font="800 96px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(((info.name||"?").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2)||"?").toUpperCase(),128,124);}
      g.restore();g.lineWidth=12;g.strokeStyle=color;g.beginPath();g.arc(128,118,100,0,7);g.stroke();g.lineWidth=4;g.strokeStyle="#fff";g.beginPath();g.arc(128,118,108,0,7);g.stroke();
      g.fillStyle="rgba(23,20,77,.92)";const nm=(info.name||"Player").toUpperCase().slice(0,14);g.font="800 38px 'Barlow Condensed','Arial Narrow',sans-serif";const tw=Math.min(250,g.measureText(nm).width+28);g.fillRect(128-tw/2,234,tw,46);
      g.fillStyle=color;g.fillRect(128-tw/2,234,6,46);g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";g.fillText(nm,128,258,240);
      g.font="700 26px 'Barlow Condensed',sans-serif";g.fillStyle="#fff";g.fillText(((info.slotLabel||POSN[info.pos]||"")+(info.number!=null?" · "+info.number:"")).toUpperCase(),128,300);tex.dirty=true;};
    draw(null);if(info.pfp){const im=new Image();im.onload=()=>draw(im);im.src=info.pfp;}
    const n=new G.Node(G.quad(.62,.78),G.mat({map:tex,unlit:true,transparent:true,depthWrite:false,fog:false}));n.billboard=true;n.renderOrder=6;return n;}
  function build(o){scene=VB.Arena.scene({fogN:28,fogF:62});scene.root=new G.Node();arena=VB.Arena.build({accent:o.color,dust:false});scene.root.add(arena.root);people=[];
    const t=o.team,slots=t.slots||{},r=o.rot||1,lib=slots.L,place=[];
    // which middle is in the back row this rotation: the libero takes that spot
    let outMB=null;["MB1","MB2"].forEach(k=>{if(slots[k]&&[1,5,6].includes(zoneAt(k,r)))outMB=k;});
    Object.keys(BASE).forEach(k=>{let id=slots[k];if(!id)return;let z=zoneAt(k,r);if(k===outMB&&lib){place.push({id:lib,zone:z,label:"Libero"});return;}place.push({id,zone:z,label:{S:"Setter",OH1:"Outside 1",OH2:"Outside 2",MB1:"Middle 1",MB2:"Middle 2",OPP:"Opposite"}[k]});});
    const bench=[...(outMB&&lib?[slots[outMB]]:[]),...(lib&&!outMB?[lib]:[]),...(t.subs||[])];
    const mk=(id,label,pos,yaw,clip)=>{const inf=o.info[id]||{name:"Player"},lk=inf.look||{};
      const pl=VB.Athlete.player({...VB.lookOpts(lk),clip:clip||"ready",ball:false,jersey:(label==="Libero"?"#f2f1fa":o.color),accent:label==="Libero"?o.color:"#ffffff",shorts:"#17144d",number:inf.number!=null?inf.number:"",lefty:inf.hand==="left",t0:Math.random()*2});
      pl.root.pos=[pos[0],0,pos[1]];pl.root.rot=[0,yaw,0];scene.root.add(pl.root);
      const b=badge(Object.assign({},inf,{slotLabel:label}),o.color);b.pos=[pos[0],2.55,pos[1]];scene.root.add(b);
      const ring=new G.Node(G.ring(.36,.44,36),G.mat({color:inf.me?"#ffffff":o.color,unlit:true,transparent:true,opacity:.9,depthWrite:false}));ring.pos=[pos[0],.02,pos[1]];scene.root.add(ring);
      people.push({pl,id});};
    place.forEach(p=>{const z=ZONE[p.zone];mk(p.id,p.label,[z[0]+(Math.random()-.5)*.2,z[1]],0);});
    bench.forEach((id,i)=>mk(id,id===lib?"Libero":(o.info[id]&&POSN[o.info[id].pos])||"Sub",[-2.2-i*1.05,5.6],Math.PI/2));
    // zone numbers on the floor
    Object.entries(ZONE).forEach(([n,z])=>{const tx=G.canvasTex(128,128,(g)=>{g.fillStyle="rgba(255,255,255,.18)";g.font="800 110px 'Barlow Condensed',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(n,64,70);});
      const q=new G.Node(G.plane(1.1,1.1),G.mat({map:tx,unlit:true,transparent:true,depthWrite:false}));q.pos=[z[0]-1.2,.015,z[1]+.9];q.rot=[0,Math.PI/2,0];scene.root.add(q);});}
  function size(){if(!R||!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h||(w===W&&h===H))return;W=w;H=h;R.setSize(w,h,Math.min(window.devicePixelRatio||1,1.75));}
  return {
    show(el,o){if(failed||!el)return;if(!cv){cv=document.createElement("canvas");cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";try{R=G.renderer(cv,{});}catch(e){R=null;}
        if(!R){failed=true;el.insertAdjacentHTML("afterbegin",`<div class="fallback">The 3D lineup could not start in this browser.</div>`);return;}orbit=G.orbit(cv,cam,{min:6,max:34,maxPolar:Math.PI/2-.06});new ResizeObserver(()=>size()).observe(document.body);}
      host=el;el.insertBefore(cv,el.firstChild);W=H=0;size();
      const s=JSON.stringify([o.team.slots,o.team.subs,o.team.color,o.rot,Object.entries(o.info).map(([k,v])=>[k,v.pfp?v.pfp.length:0,v.look,v.number,v.name])]);
      if(s!==sig){sig=s;build(o);}},
    park(){if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);},
    frame(now){if(!R||!scene||!cv||!cv.isConnected)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;size();people.forEach(p=>p.pl.update(dt));arena.update(now/1000);orbit.update();R.render(scene,cam);}
  };
})();
})();
