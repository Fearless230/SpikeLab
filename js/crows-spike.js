/* crows-spike.js: Crow Spike, the Crow's Nest volleyball game (v10). One game in the spirit of The Spike, and then some:
   - 3 against 3 on a side-view court. You play one player (wing spiker, middle blocker or setter); the AI plays the rest.
   - Full rallies: serve (standing, jump float or jump spin), receive, set, attack (sharp, middle, deep, tip, roll), block, dig, dive,
     cover. Real ball physics with topspin, blocks you can stuff or tool, a ball that can clip the tape.
   - Players have stats (attack, jump, speed, defence, serve, setting) you upgrade with feathers. Rivals have their own strengths.
   - Specials: fill your Spirit gauge with good plays, then unleash Thunder Spike, Iron Wall or Tempo Toss. Their ace has one too.
   - Story (ten chapters to the Spring Cup), Quick match, Tournament, Training drills and 2-player versus on one keyboard.
   - Instant replays of the big points, a broadcast scoreboard, match stats and an MVP.
   Uses the court kit (crows-court.js) and the effects of the arcade engine (crows-arcade.js). */
(function(){
"use strict";
const VB=window.VB,A=VB.crowArcade;if(!A||!A.court)return;
const {clamp,lerp,ease,rand,pick,damp}=A.M,D=A.draw,C=A.court,TAU=Math.PI*2;
const SP=VB.crowSpike={};
const acc=()=>A.K.col(),accRgb=()=>A.K.rgb();
const W=960,H=560;

/* ---------- teams and players ---------- */
const ROLES={WS:{label:"Wing spiker",job:"Receive, then hit. The ace."},MB:{label:"Middle blocker",job:"Block at the net, hit the quick."},SE:{label:"Setter",job:"Touch two, every time. Pick the hitter."}};
const SPECIAL={WS:{name:"Thunder Spike",txt:"Your next spike goes through the block and is too hot to dig"},MB:{name:"Iron Wall",txt:"Your next block reaches higher and stuffs anything it touches"},SE:{name:"Tempo Toss",txt:"A perfect set: your hitter's next spike is a Thunder Spike"}};
/* stats are levels 1 to 10 */
const STATS=[["atk","Attack","Spike and serve speed"],["jmp","Jump","Higher contact, higher block"],["spd","Speed","Run faster, reach more balls"],["def","Defence","Cleaner receives and digs"],["srv","Serve","Faster, more accurate serves"],["set","Setting","Cleaner, faster sets"]];
/* our team: you plus two crows. Their starting levels; you upgrade them with feathers */
const OURS={WS:{name:"",num:"4",h:188,st:{atk:5,jmp:5,spd:5,def:4,srv:4,set:2}},MB:{name:"Taiga",num:"11",h:196,st:{atk:4,jmp:5,spd:4,def:3,srv:3,set:2}},SE:{name:"Sora",num:"9",h:182,st:{atk:3,jmp:4,spd:5,def:4,srv:4,set:5}}};
/* the rivals. lv: how good they are overall; trait: what they're good at */
const RIVALS=[
  {id:"rams",name:"Granite Hill Rams",short:"RAMS",col:"#9aa3ad",col2:"#6c747d",num:"#1b1f24",shorts:"#2b3036",lv:2,trait:"Learning the game, like you",style:"balanced"},
  {id:"herons",name:"Lakeside Herons",short:"HERONS",col:"#8fd3f4",col2:"#5aa9d1",num:"#0e3550",shorts:"#0e3550",lv:3,trait:"Fast and scrappy: they run everything quick",style:"speed"},
  {id:"wolves",name:"Northgate Wolves",short:"WOLVES",col:"#5b6470",col2:"#3a4048",num:"#f0f2f5",shorts:"#1d2126",lv:4,trait:"Big jump serves",style:"serve"},
  {id:"sharks",name:"Harbor Sharks",short:"SHARKS",col:"#2f7fb5",col2:"#205a82",num:"#e9f4ff",shorts:"#123a57",lv:4.5,trait:"Tall blockers. Tip and tool",style:"block"},
  {id:"lynx",name:"Cedar Point Lynx",short:"LYNX",col:"#d9a441",col2:"#a87a25",num:"#241708",shorts:"#3a2810",lv:5.2,trait:"A libero who digs everything",style:"defence"},
  {id:"eagles",name:"Thunder Bay Eagles",short:"EAGLES",col:"#e8ecf2",col2:"#b9c3d2",num:"#1f3b73",shorts:"#1f3b73",lv:6,trait:"Their ace hits 120 km/h",style:"ace"},
  {id:"storm",name:"Sendai Storm",short:"STORM",col:"#7b5cff",col2:"#5338cc",num:"#f3efff",shorts:"#241a52",lv:6.8,trait:"Quick tempo and a setter who dumps",style:"speed"},
  {id:"hussars",name:"Krakow Hussars",short:"HUSSARS",col:"#d23b3b",col2:"#9e2626",num:"#fff",shorts:"#3a0d0d",lv:7.5,trait:"Iron wall at the net",style:"block"},
  {id:"hawks",name:"Belo Horizonte Hawks",short:"HAWKS",col:"#27a86b",col2:"#1a7a4c",num:"#f3fff8",shorts:"#0d3b25",lv:8.3,trait:"Serve cannons and a jump-float queen",style:"serve"},
  {id:"titans",name:"Shiratori Titans",short:"TITANS",col:"#f4f1ea",col2:"#d8d0bf",num:"#6b3fa0",shorts:"#4b2a75",lv:9.2,trait:"The champions. No weakness",style:"ace"}];
const NAMES=["Kenji","Mateo","Ravi","Lukas","Noah","Theo","Iker","Bruno","Yuto","Malik","Elias","Joon","Andrei","Hugo","Kai","Leo","Omar","Rafa","Sami","Tomas","Rin","Arjun","Felix","Oskar","Dario","Emil","Nico","Pavel","Ren","Zane"];
/* a rival's three players from its level and style */
function rivalPlayers(R){const base=R.lv,s=R.style,boost={ace:{atk:1.5,jmp:1},serve:{srv:2},block:{jmp:1.5,atk:.5},defence:{def:2,spd:.5},speed:{spd:1.5,set:1},balanced:{}}[s]||{};
  const mk=(role,num,h,tilt)=>{const st={};STATS.forEach(([k])=>{st[k]=clamp(Math.round(base+(tilt[k]||0)+(boost[k]||0)*(role==="WS"||k==="def"||k==="srv"?1:.5)+rand(-.6,.6)),1,10);});
    return {name:NAMES[(R.id.charCodeAt(0)+num*7)%NAMES.length],num:String(num),h,st,role};};
  return {WS:mk("WS",[7,10,1,8][R.lv|0&3]||10,190+(R.lv|0),{atk:.8,set:-2}),MB:mk("MB",2+(R.lv|0)%7,197+(R.lv|0)%5,{jmp:.6,def:-1,set:-2}),SE:mk("SE",3+(R.lv|0)%5,183,{set:1.5,atk:-1.5})};}

/* ---------- helpers ---------- */
const sdOf=t=>t===0?-1:1;                 /* which side: team 0 plays on the left (x < 0) */
const wx=(t,d)=>d*sdOf(t);                /* a depth on a team's side (0 at the net, 9 at their end line) to world x */
const ld=(t,x)=>x*sdOf(t);                /* world x to that team's depth (negative: the other side) */
const faceOf=t=>-sdOf(t);                 /* players face the net */
const derive=p=>{const s=p.st;return {run:4.5+s.spd*.22,jv:6.05+s.jmp*.1,reach:(p.h-190)*.006,pow:s.atk,def:s.def,srv:s.srv,set:s.set};};
const apexOf=jv=>jv*jv/(2*C.PG);
const SUB=.008,DIP=5,SDIP=7,BJ=5.5,SETG=3.4,HW=.72;/* block jump speed, set backspin (lighter gravity), hit window */
/* perks from the player card's grades (Technique, Power, Game sense, Stamina) */
const perk=k=>{try{const p=A.K.perks();return k==="win"?p.win:k==="power"?1+(p.power-1)*.25:k==="fill"?p.fill:k==="dur"?p.dur:1;}catch(e){return 1;}};
/* mirror a calculation done from the left side for a team on the right */
const mx=(t,x)=>t===0?x:-x;

/* ---------- a match ---------- */
function newMatch(cfg){const M={cfg,teams:[],time:0,phase:"intro",pt:0,ball:C.ball(),tt:0,tn:0,lastT:-1,lastP:null,plan:null,serveT:cfg.firstServe==null?0:cfg.firstServe,set:1,setsWon:[0,0],
    score:[0,0],rally:[],touches:0,events:[],buf:[],replay:null,hype:0,rallyN:0,log:[],cam:C.camera({x:0,s:55,fy:470,W,H}),pause:false,spirit:[0,0],bigT:0,streak:[0,0],history:[]};
  M.cam.live=true;
  const ourCol=A.K.col();
  const mkTeam=(t,def,players)=>{const T={t,name:def.name,short:def.short,col:def.col,trait:def.trait||"",players:[],serveIdx:0,lv:def.lv||5,ai:def.ai||1};
    ["SE","WS","MB"].forEach(role=>{const pd=players[role],kit=t===0?C.ours({num:pd.num,me:false}):C.theirs({col:def.col,col2:def.col2,numCol:def.num,shorts:def.shorts,num:pd.num});
      const a=C.athlete(Object.assign(kit,{x:wx(t,4),f:faceOf(t),band:role==="MB"?(t===0?"#f4efe6":def.col2||"#1f3b73"):null}));const p={t,role,name:pd.name||"",num:pd.num,h:pd.h,st:Object.assign({},pd.st),a,human:null,goal:wx(t,4),rec:-1,dive:0,down:0,swung:false,sw:null,busy:0,
        stats:{kills:0,att:0,err:0,aces:0,srv:0,srvErr:0,blocks:0,digs:0,perfect:0,assists:0,top:0,pts:0,tools:0,tips:0,specials:0,dumps:0}};p.k=derive(p);T.players.push(p);T[role]=p;});
    return T;};
  M.teams[0]=mkTeam(0,{name:cfg.ourName||"Crows",short:cfg.ourShort||"CROWS",col:ourCol,lv:5},cfg.ours);
  M.teams[1]=mkTeam(1,cfg.opp,cfg.oppPlayers||rivalPlayers(cfg.opp));
  /* skill of each side's AI: our teammates are steady; theirs depends on the difficulty */
  M.teams[0].sk=1;M.teams[1].sk=cfg.diff==="rookie"?.72:cfg.diff==="national"?1.22:1;if(cfg.versus)M.teams[1].sk=1;
  /* humans */
  M.humans=[];const me=M.teams[0][cfg.role||"WS"];me.human={pad:cfg.pads[0],n:1};me.a.me=true;me.a.label=cfg.versus?"P1":"";M.humans.push(me);
  if(cfg.versus){const p2=M.teams[1][cfg.role2||"WS"];p2.human={pad:cfg.pads[1],n:2};p2.a.me=true;p2.a.label="P2";M.humans.push(p2);}
  M.toWin=cfg.pts||15;M.bestOf=cfg.sets||1;
  return M;}

/* where everyone stands. sit: "recv" (receiving serve), "serve" (our serve), "def" (they attack), "off" (we attack) */
const SPOTS={recv:{SE:1.5,MB:3.4,WS:6.5},serve:{SE:2.4,MB:.7,WS:6.2},def:{SE:2.3,MB:.5,WS:6.3},off:{SE:.9,MB:2.9,WS:4.6}};
function spot(p,sit){return wx(p.t,SPOTS[sit][p.role]);}

/* ---------- points and serving ---------- */
function startPoint(M){const b=M.ball=C.ball();b.held=true;M.phase="pre";M.tool=null;M.stuff=null;M.shot=null;M.serve=null;M.attack=null;M.say=null;M.lastPassQ=null;M.lastTouchT=null;M.humans.forEach(h=>{h.human.ghost=null;});M.pt=0;M.tt=1-M.serveT;M.tn=0;M.lastT=-1;M.lastP=null;M.plan=null;M.attack=null;M.touches=0;M.rallyN++;M.buf=[];
  const sT=M.teams[M.serveT];const order=["SE","WS","MB"];const server=sT[order[sT.serveIdx%3]];M.server=server;
  M.teams.forEach(T=>T.players.forEach(p=>{p.goal=p===server?wx(T.t,10.4):spot(p,T.t===M.serveT?"serve":"recv");p.rec=-1;p.dive=0;p.down=0;p.swung=false;p.sw=null;p.script=null;p.blk=null;p.a.rot=0;p.a.y=0;p.a.air=false;p.a.vy=0;p.busy=0;p.ai={};p.cel=null;p.sl=null;p.a.ghosts=[];C.pose(p.a,"ready",10);}));M.marks=[];M.rip=null;M.fxl=null;M.impact=null;M.sfx=[];M.spk=[];M.ball.zap=false;
  M.sv={p:server,kind:server.human?(server.human.kind||"spin"):aiServeKind(server,M),phase:"walk",t:0,aim:server.human?(server.human.aim!=null?server.human.aim:.6):rand(.2,.95),held:false};
  if(M.cfg.drill)drillPoint(M);}
function aiServeKind(p,M){const s=p.st.srv;if(M.cfg.opp&&M.cfg.opp.style==="serve"&&p.t===1)return Math.random()<.5?"spin":"float";return s>=7&&Math.random()<.6?"spin":s>=4&&Math.random()<.6?"float":"stand";}
/* a point is over */
function pointTo(M,w,why,o){if(M.phase!=="live"&&M.phase!=="serve")return;o=o||{};SP.L&&SP.L(M,"POINT",w,why,"b"+M.ball.x.toFixed(1),"tt"+M.tt,"tn"+M.tn,M.plan?M.plan.type+(M.plan.p?M.plan.p.t+M.plan.p.role:""):"noplan");
  if(M.cfg.drill){const d=M.cfg.drill;let pts=0,txt=why;
    if(d==="recv"){pts=why==="OUT!"&&M.lastT===1?1:0;txt=pts?"GOOD LEAVE":why;}
    else if(d==="spike")pts=w===0&&o.kind==="kill"?(M.shot&&M.shot.q>=.78?4:3):0;
    else if(d==="serve")pts=w===0&&o.kind==="ace"?3:0;
    else if(d==="block")pts=w===0?(o.kind==="block"?3:1):0;
    drillEnd(M,pts,txt,o.sub);return;}M.phase="dead";M.pt=0;M.plan=null;const F=SP.F;
  const L=M.teams[1-w];M.score[w]++;M.streak[w]++;M.streak[1-w]=0;
  if(w!==M.serveT){M.serveT=w;M.teams[w].serveIdx++;}
  /* credit */const lp=M.lastP;let big=false,tag=why;
  if(o.kind==="kill"&&o.p){o.p.stats.kills++;o.p.stats.pts++;if(o.set)o.set.stats.assists++;big=o.v>19||o.pw;}
  if(o.kind==="ace"&&o.p){o.p.stats.aces++;o.p.stats.pts++;big=true;}
  if(o.kind==="block"&&o.p){o.p.stats.blocks++;o.p.stats.pts++;big=true;}
  if(o.kind==="err"&&o.p){o.p.stats.err++;}
  M.history.push({w,why,score:M.score.slice(),set:M.set});
  M.hype=1;M.punch=big?1:.55;M.punchX=o.x!=null?o.x:M.ball.x;M.say={txt:why,sub:o.sub||"",w,t:0};SP.sfx(w===0?"kill":"drop");
  if(o.x!=null)C.dust(SP.X,M.cam,o.x,20,w===0?[acc(),"#fff"]:["#fff","#aab"]);
  /* spirit: big plays fill it */
  M.teams.forEach(T=>{const g=(T.t===w?(big?.22:.12):.05)*(T.t===0&&!M.cfg.versus?perk("fill"):1);M.spirit[T.t]=clamp(M.spirit[T.t]+g,0,1);});
  /* a replay for the big ones */
  M.replay=big&&M.buf.length>40&&!M.cfg.drill?{frames:M.buf.slice(),i:0,t:0,why}:null;
  if(M.cfg.onPoint)M.cfg.onPoint(M,w,o);}
function checkSetEnd(M){const a=M.score[0],b=M.score[1],tw=M.toWin;if(Math.max(a,b)>=tw&&Math.abs(a-b)>=2){const w=a>b?0:1;M.setsWon[w]++;M.setLog=(M.setLog||[]).concat([[a,b]]);
    const need=Math.ceil(M.bestOf/2);if(M.setsWon[w]>=need){M.phase="over";M.winner=w;return true;}
    M.set++;M.score=[0,0];M.serveT=M.set%2===0?1:0;M.banner={txt:`SET ${M.set}`,sub:`${M.teams[0].short} ${M.setsWon[0]} – ${M.setsWon[1]} ${M.teams[1].short}`,t:0};}return false;}

/* ---------- contacts: every touch of the ball goes through one of these ---------- */
/* after a touch: does the ball go over (the other team's ball, first touch) or stay (our next touch)? */
function afterTouch(M,p,stays){SP.L&&SP.L(M,"touch",p.t+p.role,stays?"stays":"over","n"+M.tn,"b"+M.ball.x.toFixed(1)+","+M.ball.y.toFixed(1),"v"+M.ball.vx.toFixed(1)+","+M.ball.vy.toFixed(1));M.lastT=p.t;M.lastP=p;M.touches++;M.plan=null;M.lastTouchT=M.time;if(stays){M.tt=p.t;M.tn++;}else{M.tt=1-p.t;M.tn=0;}
  /* training drills end at the touch that matters */
  const d=M.cfg.drill;if(d&&M.phase==="live"){const q=M.lastPassQ==null?1:M.lastPassQ;
    if(d==="recv"&&p.t===0)drillEnd(M,q>=.78?3:q>=.55?2:q>=.26?1:0,q>=.78?"PERFECT":q>=.55?"GOOD PASS":q>=.26?"UP":"SHANKED");
    else if(d==="spike"&&p.t===1&&M.shot&&M.shot.t===0)drillEnd(M,1,"DUG","They got to it: look for the gap");
    else if(d==="serve"&&p.t===1)drillEnd(M,q<.55?1:0,q<.55?"TOUGH SERVE":"PASSED");
    else if(d==="block"&&p.t===0)drillEnd(M,0,"THROUGH THE BLOCK","Be in front of the hitter, hands high");}}
/* pass quality to a target near the net; q 0..1 */
function passTo(M,p,q,from){const b=M.ball,t=p.t,err=q>=.78?rand(-.15,.15):q>=.55?rand(-.8,.5):rand(-2.4,.6),d=clamp(.9+err*(Math.random()<.5?1:-.6),.25,6);
  const tx=wx(t,d),ty=q<.55?2.15:2.65,T=q>=.78?1.05:q>=.55?.95:.85;const v=C.throwT([b.x,b.y],[tx,ty],T);b.dip=0;b.float=0;b.vx=v[0];b.vy=v[1];b.spin=6;b.heat=0;b.live=true;b.netDone=true;b.held=false;
  afterTouch(M,p,true);}
/* a wild ball: off the arms, anywhere */
function shank(M,p){const b=M.ball;b.dip=0;b.float=0;b.vx=rand(-5,5);b.vy=rand(2,5.5);b.spin=12;b.heat=0;b.live=true;b.netDone=false;b.held=false;afterTouch(M,p,ld(p.t,b.x+b.vx*1.1)>0);}
/* the first touch: serve receive or a dig */
function receive(M,p,q,how){const F=SP.F,b=M.ball,X=M.cam.X(b.x),Y=M.cam.Y(b.y),inc=Math.hypot(b.vx,b.vy);
  p.stats.digs++;if(q<.26){shank(M,p);if(p.t===0||M.cfg.versus)F.pop(X,Y-40,"SHANKED",{col:"#ffb3a1",size:28,sub:p.human?"Get behind the ball":""});SP.sfx("miss");return "shank";}
  if(q>=.78)p.stats.perfect++;
  /* the third touch can't be a pass: send it over */
  if(M.tt===p.t&&M.tn>=2){freeOver(M,p,q);return "over";}
  passTo(M,p,q);
  const name=how==="pancake"?"PANCAKE!":q>=.78?"PERFECT":q>=.55?"NICE":"UP!";
  if(p.human||p.t===0||inc>15)F.pop(X,Y-46,name,{col:q>=.78?(p.t===0?acc():"#fff"):"#fff",size:q>=.78?32:24,sub:p.human&&inc>14?`off a ${C.kmh(inc)} km/h hit`:""});
  if(q>=.78){F.ring(X,Y,p.t===0?accRgb():"255,255,255",60,6);if(p.human){F.freeze(.05);F.flashOn(.18,accRgb());M.spirit[p.t]=clamp(M.spirit[p.t]+.06,0,1);}}
  F.burst(X,Y,q>=.78?18:10,{col:[p.t===0?acc():"#fff","#fff"],speed:300,up:100,size:4});SP.sfx(q>=.78?"perfect":"dig");F.hit(.12);
  if(!p.human){C.pose(p.a,"dig",40);p.poseT=.3;}return "pass";}
/* send it over with a bump or a free ball */
function freeOver(M,p,q){const b=M.ball,t=p.t,d=rand(2.5,7.5),T=1.15;const v=C.throwT([b.x,b.y],[wx(1-t,d),C.BR],T);b.dip=0;b.vx=v[0];b.vy=v[1];b.spin=4;b.heat=0;b.live=true;b.netDone=false;
  afterTouch(M,p,false);SP.sfx("set");}

/* the setter picks a hitter and sets. who: player to set, tempo "quick" | "shoot" | "high" | "pipe" */
function setBall(M,p,who,tempo,q,spec){const b=M.ball,t=p.t,f=faceOf(t);if(!who||who===p){freeOver(M,p,q);return;}
  const k=1+(p.st.set-5)*.03,qq=clamp(q,0,1);
  const D={quick:[.55,.52],shoot:[.78,.88],high:[.95,1.52],pipe:[3.5,1.3]}[tempo]||[.95,1.52];
  const jv=who.k.jv,cy=2.06+apexOf(jv)+who.k.reach-.02,err=(1-qq)*rand(-.6,.6);
  const cp=[wx(t,clamp(D[0]+err,.35,4)),cy+(1-qq)*rand(-.25,.1)],T=D[1]/k*(qq<.5?1.15:1);
  const v=C.throwT([b.x,b.y],cp,T,C.G-SETG);b.dip=-SETG;b.float=0;b.vx=v[0];b.vy=v[1];b.spin=-3*f;b.heat=0;b.live=true;b.netDone=true;b.held=false;
  afterTouch(M,p,true);p.stats.setsMade=(p.stats.setsMade||0)+1;
  M.attack={p:who,setter:p,cp,tc:M.time+T,tempo,q:qq,spec:!!spec,t};
  if(who.human&&!SP.autoplay){who.human.ghost={x:cp[0],y:cp[1],t0:M.time,tc:M.time+T};}
  else{const JT=who.k.jv/C.PG,xt=cp[0]-f*(.5*JT+.42);who.script={x0:who.a.x,xt,tc:M.time+T,jv:who.k.jv,f,tip:false};}
  /* their block reads the tempo */
  scheduleBlock(M,1-t,M.attack);
  if(!p.human)C.pose(p.a,"setgo",30);SP.sfx("set");
  if(spec){SP.F.pop(M.cam.X(b.x),M.cam.Y(b.y)-60,"TEMPO TOSS!",{col:"#ffd34d",size:34});}}
/* the AI setter's choice */
function aiSetChoice(M,p){if(M.forceSet&&M.forceSet.t===p.t)return {who:M.forceSet,tempo:pick(["shoot","high","high","pipe"])};const T=M.teams[p.t],q=M.lastPassQ==null?.7:M.lastPassQ,hs=T.players.filter(x=>x!==p&&!x.a.air&&x.down<=0&&x.dive<=0);
  const ws=hs.find(x=>x.role==="WS"),mb=hs.find(x=>x.role==="MB");let who=ws||mb||hs[0],tempo="high";
  const humanH=hs.find(x=>x.human);
  if(q>=.7&&mb&&Math.random()<(humanH===mb?.6:humanH?.25:.35)&&Math.abs(ld(p.t,mb.a.x))<4){who=mb;tempo="quick";}
  else if(who){tempo=q>=.7&&Math.random()<.45?"shoot":q<.45?"high":Math.random()<.18&&Math.abs(ld(p.t,who.a.x))>3.6?"pipe":"high";}
  if(humanH&&humanH.role==="WS"&&who!==humanH&&Math.random()<.65&&!(who===mb&&tempo==="quick"&&humanH===mb))who=humanH,tempo=tempo==="quick"?"high":tempo;
  /* the setter dumps it on two now and then */
  if(q>=.78&&!p.human&&Math.random()<.07*(M.teams[p.t].sk)&&Math.abs(ld(p.t,p.a.x))<1.3)return {dump:true};
  return {who,tempo};}

/* an attack leaves a hand. kind: "spike" | "tip" | "roll". aim -1 sharp, 0 middle, 1 deep. q: contact quality */
function attack(M,p,kind,aim,q,pw,want){const b=M.ball,t=p.t,F=SP.F,hx=b.x,hy=b.y,o=1-t,cam=M.cam;let v,tx;
  /* in local coordinates of a left-side hitter */
  const lx=mx(t,hx);
  if(kind!=="spike"){const T=kind==="roll"?1.05:.8;const dd=kind==="roll"?rand(6,8.4):rand(.9,2.2)+(1-q)*rand(-.4,.6);tx=wx(o,dd);const vv=C.throwT([hx,hy],[tx,C.BR],T);b.dip=0;b.vx=vv[0];b.vy=vv[1];v=Math.hypot(...vv);b.spin=4;b.heat=0;}
  else{v=(14.6+p.st.atk*.6+5.4*q*q+clamp((hy-3.25)*4,-1.2,1.6))*(pw?1.3:1)*(p.human&&!M.cfg.versus?perk("power"):1)*(p.fire?1.08:1);if(pw)v=Math.max(v,24);
    const g=C.G+DIP,lo=clamp(C.clearX([lx,hy],v,g,.16),1.2,7.6),base=want!=null?clamp(want,lo+.2,8.3):aim<0?lo+rand(0,.5):aim>0?clamp(Math.max(lo+2.2,rand(7.2,8.2)),lo,8.4):clamp(Math.max(lo+1.4,rand(4.4,5.6)),lo,7.4);
    const dd=base+(1-q)*rand(-1.5,1.2)+(aim>0?(1-q)*.8:0);tx=wx(o,dd);
    let vv=C.solve([lx,hy],[dd,C.BR],v,false,g);if(!vv)vv=C.throwT([lx,hy],[dd,C.BR],Math.abs(dd-lx)/(v*.85),g);b.dip=DIP;b.vx=t===0?vv[0]:-vv[0];b.vy=vv[1];b.spin=-24*(t===0?1:-1);b.heat=pw?1.4:p.fire||v>20?1:v>18?.6:.25;}
  b.live=true;b.netDone=false;b.float=0;b.held=false;b.t=0;SP.L&&SP.L(M,"ATTACK",p.t+p.role,kind,"aim"+aim,"q"+q.toFixed(2),"v"+v.toFixed(1),"tx"+(tx||0).toFixed(1),"from"+hx.toFixed(1)+","+hy.toFixed(1),"land"+((C.land(b)||{}).x||0).toFixed(1));
  M.shot={p,kind,aim,q,v,pw,t,setter:M.attack&&M.attack.setter,blocked:false,time:M.time};M.attack=null;p.stats.att++;p.stats.top=Math.max(p.stats.top,C.kmh(v));if(kind!=="spike")p.stats.tips++;
  afterTouch(M,p,false);
  C.pose(p.a,kind==="spike"?"swing":"tip",65);p.a.followAt=M.time+.11;
  if(kind==="spike"&&p.human&&!SP.autoplay){p.streak=q>=.78?(p.streak|0)+1:0;const was=p.fire;p.fire=p.streak>=3;if(p.fire&&!was){F.pop(cam.X(hx),cam.Y(hy)-100,"ON FIRE!",{col:"#ff9a3c",size:34,sub:"Three perfect spikes: your hits burn hotter"});SP.sfx("power");}}
  if(kind==="spike"){const perfect=q>=.78,hard=v>19,col=pw?"255,211,77":perfect?(t===0?accRgb():"200,225,255"):"255,255,255",ang=Math.atan2(b.vy,b.vx);
    /* every spike: a glint where the hand meets the ball, a ring of air, a few sparks off the palm */
    fx(M,"glint",{x:hx,y:hy,col,size:pw?1.7:perfect?1.2:.8,rot:rand(-.4,.4)});fx(M,"ripple",{x:hx,y:hy,col:perfect||pw?col:"255,255,255",r:pw?1.9:perfect?1.3:.9});
    sparks(M,hx,hy,pw?12:perfect?7:3,pw?"255,211,77":perfect?col:"255,240,220",7,ang,.6);
    /* timed well or hit hard: streaks that ride with the ball */
    if(perfect||hard||pw)fx(M,"streak",{col:pw?"255,211,77":"255,255,255",n:pw?12:perfect&&hard?9:6,seed:rand(0,99),life:pw?.55:.34});
    if(pw){b.zap=true;fx(M,"flare",{x:hx,y:hy,col:"255,211,77"});M.impact={p,t:0,d:.08};M.fxl={x:hx,y:hy,t:0,col:"255,211,77",n:.6,seed:Math.random()*99};}
    M.punch=Math.max(M.punch||0,pw?.8:perfect?.35:.18);M.punchX=hx;
    SP.sfx("kill");if(pw||perfect||hard)C.speedPop(SP.X,cam,hx,hy,v,pw?"#ffd34d":perfect?(t===0?acc():"#fff"):"#fff");F.hit(pw?.8:.18+q*.25);F.freeze(pw?.1:perfect?.05:.02);
    if(p.human&&!SP.autoplay&&!pw)F.pop(cam.X(hx),cam.Y(hy)-58,perfect?"PERFECT":q>=.5?"GOOD":"OFF-CENTRE",{col:perfect?"#ffd34d":q>=.5?"#f4efe6":"#a59c90",size:perfect?26:19,life:.7});
    if(pw){SP.sfx("power");F.slowmo(.3,.35);F.flashOn(.32,"255,211,77");F.pop(cam.X(hx),cam.Y(hy)-90,"THUNDER SPIKE!",{col:"#ffd34d",size:42});}}
  else SP.sfx("set");
  M.hype=Math.max(M.hype,.4);}

/* ---------- the block: their hands at the net ---------- */
function scheduleBlock(M,t,att){if(M.cfg.drill==="recv"&&t===0)return;const T=M.teams[t],sk=T.sk,tempoLate={quick:.2,shoot:.08,high:0,pipe:.03}[att.tempo]||0;
  T.players.forEach(p=>{p.blk=null;if(p.human)return;const dn=Math.abs(ld(t,p.a.x));const mb=p.role==="MB",front=dn<2.2;
    if(!mb&&!(front&&att.tempo==="high"&&p.role==="SE"))return;
    /* a good block jumps so its hands peak as the hitter swings; a worse one is late or early */
    const jt=att.tc-(BJ/C.PG)+tempoLate/sk+rand(-.12,.12)/sk;p.blk={at:jt,x:wx(t,.42)};});}
function blockCheck(M,dt){const b=M.ball,sh=M.shot;if(!sh||sh.blocked||!b.live)return;const o=1-sh.t,plane=wx(o,.22),px=b.x-b.vx*dt;
  if(!((ld(o,px)<.22)&&(ld(o,b.x)>=.22)))return;
  for(const p of M.teams[o].players){if(!p.a.air||Math.abs(ld(o,p.a.x))>.95)continue;const iron=p.iron&&M.time<p.iron,top=C.joint(p.a,"h2")[1]+.07+(iron?.25:0)+p.k.reach*.5;
    if(b.y>top||b.y<C.NET-.06)continue;
    /* side-on, every ball crosses the block's line: whether it's really in front of the hands is a matter of angle */
    const cover=p.human?(SP.autoplay?.52:.8):(p.role==="MB"?.46:.3)*M.teams[o].sk+(iron?1:0);if(Math.random()>cover){sh.blockMiss=true;continue;}
    sh.blocked=true;M.rip={a:sh.pw?1:.7,y:b.y-.15,t:0,dir:sdOf(o)};M.punch=Math.max(M.punch||0,.5);M.punchX=b.x;b.dip=0;const F=SP.F,cam=M.cam,X=cam.X(b.x),Y=cam.Y(b.y),tips=b.y>top-(sh.aim>0?.3:.18);F.burst(X,Y,16,{col:["#fff",sh.pw?"#ffd34d":acc()],speed:340,size:4});SP.sfx("block");F.hit(.45);
    M.lastT=o;M.lastP=p;
    if(sh.pw&&!iron){b.vx*=.82;F.pop(X,Y-40,"BLOCK BUSTED!",{col:"#ffd34d",size:36});C.pose(p.a,"slump",20);M.tt=o;M.tn=0;M.plan=null;return;}
    if(!iron&&tips&&sh.v>15.2&&sh.kind==="spike"&&Math.random()<.17+.3*sh.q){M.tool={p:sh.p,t0:M.time};b.vx=sdOf(o)*rand(3.6,5.2);b.vy=rand(5.2,7);b.spin=20;b.netDone=true;b.heat=.2;F.pop(X,Y-40,"TOUCHOUT!",{col:sh.t===0?acc():"#ff9a9a",size:32,sub:"Off the block and out"});M.tt=sh.t;M.tn=3;M.plan=null;return;}
    if(iron||Math.random()<(p.human?.66:.47)+(sh.kind!=="spike"?.25:0)){/* stuffed: back down on their side; they can still cover it */
      b.vx=sdOf(sh.t)*rand(3,4.6);b.vy=-rand(2.5,4.5);b.netDone=true;b.heat=0;
      M.stuff={p,shot:sh};{const c=o===0?accRgb():"200,225,255";fx(M,"glint",{x:b.x,y:b.y,col:c,size:1.3});fx(M,"ripple",{x:b.x,y:b.y,col:c,r:1.4});sparks(M,b.x,b.y,8,c,6,Math.atan2(b.vy,b.vx),.8);if(iron)fx(M,"hex",{x:b.x,y:b.y+.2,col:"159,208,255"});}if(M.cfg.drill==="block"){drillEnd(M,3,"STUFF BLOCK!","");return;}F.pop(X,Y-40,iron?"IRON WALL!":"STUFF BLOCK!",{col:o===0?acc():"#ff6b6b",size:40});if(o===0)F.flashOn(.3,accRgb());M.tt=sh.t;M.tn=0;M.plan=null;C.pose(p.a,"press",30);return;}
    /* soft block: up on the blockers' side, their first touch is free */
    b.vx=sdOf(o)*rand(.8,1.8);b.vy=rand(2.6,3.6);b.netDone=true;b.heat=0;if(M.cfg.drill==="block"){drillEnd(M,1,"TOUCH","Soft block: hold jump to reach higher");return;}F.pop(X,Y-40,"TOUCH",{col:"#cfc8bd",size:26,sub:"Soft block"});M.tt=o;M.tn=0;M.plan=null;return;}}

/* ---------- who plays the next ball ---------- */
const isAI=p=>!p.human||SP.autoplay;
function planNext(M){M.plan=null;const b=M.ball;if(!b.live||M.phase!=="live")return;const T=M.tt,n=M.tn,team=M.teams[T];if(n>=3)return;
  if(n===2&&M.attack&&M.attack.t===T){M.plan={type:"attack",p:M.attack.p,T};return;}
  const want=n===1?"set":n===2?"free":"recv";let h=want==="set"?2.45:.85,t=C.timeToY(b,h),bump=false;
  if(want==="set"&&(t==null||t<.15)){h=.9;t=C.timeToY(b,h);bump=true;}
  if(t==null)return;const x=b.x+b.vx*t,d=ld(T,x);if(d<-.15)return;
  /* going out and nobody on our side touched it: leave it (good teams read it better) */
  if(want==="recv"&&(d>9.15||(M.lastT!==T&&false))&&M.lastT!==T&&!M.tool){const read=.72+.2*team.sk-(d<9.5?.25:0);if(Math.random()<read){M.plan={type:"leave",T,x};return;}}
  const f=faceOf(T),off=want==="set"&&!bump?.12:.42,stand=x-f*off;
  const cands=team.players.filter(p=>!(n>0&&p===M.lastP&&M.lastT===T)&&p.down<=0&&!(p.a.air&&p.a.y>.3)&&!p.script);
  if(!cands.length)return;
  const eta=p=>Math.abs(p.a.x-stand)/p.k.run+(p.human?.1:.08);
  let p=null;
  if(want==="set"&&!bump){const se=cands.find(c=>c.role==="SE");if(se&&eta(se)<t+.35)p=se;}
  if(!p){const hum=cands.find(c=>c.human&&!SP.autoplay);if(hum&&eta(hum)<=t+.08&&!(want!=="recv"&&hum.role!=="SE"&&cands.some(c=>c!==hum&&eta(c)<=t)))p=hum;}
  if(!p)p=cands.slice().sort((a,c)=>eta(a)-eta(c))[0];
  M.plan={type:bump?"bumpset":want,p,T,x,h,tc:M.time+t,made:M.time};SP.L&&SP.L(M,"plan",M.plan.type,p.t+p.role,"x"+x.toFixed(1),"in"+t.toFixed(2),"px"+p.a.x.toFixed(1));}

/* ---------- a scripted spiker (any AI hitter): runs in, jumps so the swing meets the set ---------- */
function scriptStep(M,p){const o=p.script,at=M.time,JT=o.jv/C.PG,tj=o.tc-JT,ta=tj-.72,land=tj+2*JT,f=o.f,a=p.a;a.f=f;
  const runX=t=>t<=ta?o.x0:t>=tj?o.xt:lerp(o.x0,o.xt,ease.inOut((t-ta)/(tj-ta)));
  if(at<tj){a.air=false;a.y=0;a.x=runX(at);a.vx=(runX(at+.02)-runX(at))/.02;C.pose(a,at>tj-.17?"load":"ready",at>tj-.17?30:14);return;}
  if(at<land){const t=at-tj;a.air=true;a.y=Math.max(0,o.jv*t-.5*C.PG*t*t);a.x=o.xt+f*.5*t;a.vx=0;
    if(at<o.tc-.3)C.pose(a,"rise",22);else if(at<o.tc-.03)C.pose(a,o.tip?"tip":"cock",26);else if(at<o.tc+.13)C.pose(a,o.tip?"tip":"swing",65);else C.pose(a,"follow",14);
    if(!o.done&&at>=o.tc){o.done=true;aiSwing(M,p);}return;}
  a.air=false;a.y=0;a.vx=0;p.script=null;C.pose(a,"low",12);p.poseT=.15;}
/* the AI hitter's swing: where to hit it */
function aiSwing(M,p){const b=M.ball,f=faceOf(p.t),hand=[p.a.x+f*.42,C.hipY(p.a)+1.1],d=Math.hypot(b.x-hand[0],b.y-hand[1]),att=M.attack;
  if(!att||att.p!==p||d>.85||ld(p.t,b.x)<-.1){M.attack=null;M.plan=null;return;}
  const T=M.teams[p.t],o=M.teams[1-p.t],sk=T.sk;let q=clamp(.5+.035*p.st.atk+.25*att.q+(sk-1)*.25+rand(-.18,.14)-Math.max(0,d-.4)*.3,0,1);
  /* read their block: is a blocker up in time? */
  const up=o.players.some(x=>x.blk&&Math.abs(M.time-(x.blk.at+BJ/C.PG))<.14)||o.players.some(x=>x.human&&x.a.air&&Math.abs(ld(o.t,x.a.x))<1);
  let kind="spike",aim=0,want=null;
  if(up&&Math.random()<.5*sk){if(Math.random()<.5)kind=Math.random()<.5?"tip":"roll";else aim=1;}
  else{/* the gap in their defence: the spot furthest from anyone who can dig, not too close to the end line */const ds=o.players.filter(x=>!x.a.air).map(x=>ld(o.t,x.a.x)-.42);let bd=-1;
    for(let z=2;z<=8.2;z+=.3){const dd=Math.min(...ds.map(x=>Math.abs(x-z)))-(z>7.6?(z-7.6)*1.5:0)+rand(0,1.4/sk);if(dd>bd){bd=dd;want=z;}}aim=want<3.2?-1:want>6.8?1:0;}
  let pw=att.spec;if(!pw&&p.t===1&&!M.cfg.versus&&p.role==="WS"&&M.spirit[1]>=1&&kind==="spike"){pw=true;M.spirit[1]=0;cutIn(M,p,"THUNDER SPIKE");}
  if(pw)kind="spike";attack(M,p,kind,aim,q,pw,kind==="spike"?want:null);}
/* a cut-in banner for a special */
function cutIn(M,p,name){M.cut={p,name,t:0};SP.sfx("thunder");SP.F.flashOn(.5,p.t===0?accRgb():"255,255,255");SP.F.slowmo(.35,.5);}

/* ---------- AI players: move, block, dive and play the ball ---------- */
function aiStep(M,p,dt){const a=p.a,f=faceOf(p.t),T=M.teams[p.t],sk=T.sk;
  if(p.script){scriptStep(M,p);return;}
  if(p.poseT>0)p.poseT-=dt;
  if(p.down>0){p.down-=dt;a.vx=damp(a.vx,0,8,dt);a.rot=damp(a.rot,0,7,dt);if(p.down<=0){a.rot=0;C.pose(a,"ready",12);}return;}
  if(p.dive>0){p.dive+=dt;a.vx=damp(a.vx,0,3.2,dt);a.rot=damp(a.rot,1.3,18,dt);if(p.dive>.55){p.dive=0;p.down=.38;C.pose(a,"low",8);}return;}
  if(a.air){if(a.pose!=="block"&&a.pose!=="press"&&a.pose!=="slump")C.pose(a,"block",30);return;}
  /* a block jump */
  if(p.blk&&M.time>=p.blk.at&&M.time<p.blk.at+.15&&Math.abs(a.x-p.blk.x)<.7){a.air=true;a.vy=BJ+(p.st.jmp-5)*.06;a.vx=0;C.pose(a,"block",30);p.blk=null;return;}
  let goal=p.goal,v=p.k.run*(.86+.14*sk);const pl=M.plan;
  if(M.phase==="live"){
    const sh=M.shot,react=sh&&sh.t!==p.t&&M.time-sh.time<(.26-.012*p.st.def)/sk;
    if(react){goal=a.x;}
    else if(pl&&pl.p===p&&pl.type!=="attack"&&pl.type!=="leave"){const off=pl.type==="set"?.12:.42;goal=pl.x-f*off;
      /* dive for a ball that will land just out of reach */
      const tl=pl.tc-M.time,gap=pl.x-(a.x+f*off*0+f*.42);if(pl.type!=="set"&&tl<.3&&tl>0&&Math.abs(gap)>.65&&Math.abs(gap)<1.9){p.dive=.01;a.f=gap*f>0?f:-f;a.vx=Math.sign(gap)*7.2;C.pose(a,"dive",22);SP.sfx("whoosh");return;}}
    else if(p.blk)goal=p.blk.x;
    else{const ours=M.tt===p.t,n=M.tn;
      if(ours){if(p.role==="SE")goal=n<=1?wx(p.t,.9):wx(p.t,2.2);else if(n<=1)goal=wx(p.t,p.role==="MB"?2.9:4.6);else goal=wx(p.t,p.role==="MB"?2:3.4);}
      else{const sit=M.shot&&M.shot.t!==p.t&&M.time-M.shot.time<1.5?null:"def";if(sit)goal=spot(p,"def");}}
    p.goal=goal;}
  C.goTo(a,goal,v,dt,f);a.x+=a.vx*dt;
  if(!(p.poseT>0))C.pose(a,Math.abs(a.vx)>.4?"ready":pl&&pl.p===p?"low":"ready",12);}
/* does an AI player get the ball now? */
function aiContact(M){const pl=M.plan;if(!pl||pl.type==="attack"||pl.type==="leave")return;const p=pl.p;if(!isAI(p)||p.script)return;const b=M.ball,a=p.a,f=faceOf(p.t),sk=M.teams[p.t].sk;if(!b.live||b.vy>0)return;
  if(pl.type==="set"){if(b.y<=2.55&&b.y>1.6&&Math.abs(b.x-(a.x+f*.12))<.6){const ch=aiSetChoice(M,p);const q=clamp(.5+.045*p.st.set+(sk-1)*.2+rand(-.16,.14)-(1-(M.lastPassQ==null?.7:M.lastPassQ))*.3,0,1);
      if(ch.dump){const tx=wx(1-p.t,rand(.8,2)),v=C.throwT([b.x,b.y],[tx,C.BR],.62);b.vx=v[0];b.vy=v[1];b.dip=0;M.shot={p,kind:"tip",aim:0,q:.9,v:5,pw:false,t:p.t,time:M.time,dump:true};afterTouch(M,p,false);C.pose(a,"tip",30);SP.F.pop(M.cam.X(b.x),M.cam.Y(b.y)-40,"DUMP!",{col:"#fff",size:26});return;}
      setBall(M,p,ch.who,ch.tempo,q,false);}return;}
  /* bumps: receive, free ball, bump set */
  const reach=p.dive>0?[Math.min(a.x,a.x+a.f*1.5)-.25,Math.max(a.x,a.x+a.f*1.5)+.25]:[Math.min(a.x+f*.42-.62,a.x+f*.42+.62),Math.max(a.x+f*.42-.62,a.x+f*.42+.62)];
  if(b.y<=pl.h+.1&&b.y>.06&&b.x>=reach[0]&&b.x<=reach[1]){const sh=M.shot,inc=Math.hypot(b.vx,b.vy),offc=Math.abs(b.x-(a.x+f*.42));
    let q=clamp(.38+.05*p.st.def+(sk-1)*.28+rand(-.24,.18)-Math.max(0,inc-14.5)*.035-offc*.35,0,1);if(p.dive>0)q=Math.min(.62,q);
    const hot=sh&&sh.pw&&M.lastP===sh.p;if(hot&&q<.92){q=.1;SP.F.pop(M.cam.X(b.x),M.cam.Y(b.y)-40,"TOO HOT!",{col:"#ffd34d",size:30});}
    if(b.float>0)q-=.1;
    /* a hard, clean spike straight at the defence beats them more often than not on a bad read */
    if(!hot&&sh&&sh.kind==="spike"&&M.lastP===sh.p&&!sh.blocked&&Math.random()<clamp((inc-15.5)*.08,0,.55)*(1.2-.04*p.st.def)/sk)q=Math.min(q,.04);
    M.lastPassQ=q;
    if(pl.type==="free"){freeOver(M,p,q);if(!p.human)C.pose(a,"dig",40);return;}
    if(pl.type==="bumpset"){const T=M.teams[p.t],hs=T.players.filter(x=>x!==p&&!x.a.air&&x.down<=0);const who=hs.find(x=>x.human&&!SP.autoplay&&x.role!=="SE")||hs.find(x=>x.role==="WS")||hs[0];setBall(M,p,who,"high",clamp(q-.25,0,1),false);C.pose(a,"dig",40);p.poseT=.3;return;}
    receive(M,p,q,p.dive>0&&b.y<.35?"pancake":"");}
  else if(b.y<.06&&pl.tc<M.time-.05){M.plan=null;}}

/* ---------- the human player ---------- */
function humanStep(M,p,dt){const P=p.human.pad,a=p.a,f=faceOf(p.t),F=SP.F;C.tick(P,dt);
  if(C.take(P,"special",.3))useSpecial(M,p);
  if(M.phase==="serve"&&M.sv.p===p){serveControl(M,p,P,dt);return;}
  if(M.phase!=="live"&&M.phase!=="serve"){/* between points: walk to your spot */if(!a.air){C.goTo(a,p.goal,p.k.run,dt,f);a.x+=a.vx*dt;C.pose(a,Math.abs(a.vx)>.3?"ready":"stand",10);}return;}
  if(p.poseT>0)p.poseT-=dt;p.recCool=Math.max(0,(p.recCool||0)-dt);
  if(p.down>0){p.down-=dt;a.vx=damp(a.vx,0,8,dt);a.rot=damp(a.rot,0,7,dt);if(p.down<=0){a.rot=0;C.pose(a,"ready",12);}return;}
  if(p.dive>0){p.dive+=dt;a.vx=damp(a.vx,0,3.2,dt);a.rot=damp(a.rot,1.3,18,dt);if(p.dive>.55){p.dive=0;p.down=.4;C.pose(a,"low",8);}return;}
  let dir=C.dir(P);
  if(!a.air){
    const overhead=ballOverhead(M,p);
    if(C.take(P,"c",.15)){if(overhead&&M.tt===p.t){dump(M,p);return;}const d=dir||(M.ball.live&&M.ball.x<a.x?-1:1);p.dive=.01;p.rec=-1;a.f=d;a.vx=d*(7.6+p.st.spd*.12);C.pose(a,"dive",22);SP.sfx("whoosh");return;}
    if(p.recCool<=0&&C.take(P,"b",.14)){p.rec=0;C.pose(a,overhead?"set":"platform",30);}
    if(C.take(P,"a",.14)){const block=M.tt!==p.t&&Math.abs(ld(p.t,a.x))<1.7;C.jump(a,block?BJ-.2+p.st.jmp*.04:p.k.jv,block?.2:.55);p.jumpX=a.x;p.swung=false;p.blockJump=block;C.pose(a,block?"block":"rise",24);SP.sfx("jump");return;}
    if(p.rec>=0){p.rec+=dt;if(p.rec>.55){p.rec=-1;C.pose(a,"ready",14);}}
    /* a set is coming to you: the jump cue, and on Rookie/Varsity your feet carry you to the take-off spot (any arrow key takes over) */
    const att=M.attack,mine=att&&att.p===p&&p.rec<0&&!M.cfg.versus&&M.time<att.tc+.2;p.cue=mine?att.tc-p.k.jv/C.PG:null;
    if(mine&&!dir&&M.cfg.diff!=="national"&&M.time<p.cue){const xt=att.cp[0]-f*.5;C.goTo(a,xt,p.k.run*1.05,dt,f);a.x+=a.vx*dt;a.f=f;
      if(M.cfg.diff==="rookie"&&!att.autoJ&&M.time>=p.cue-.02){att.autoJ=true;C.jump(a,p.k.jv,.55);p.jumpX=a.x;p.swung=false;p.blockJump=false;C.pose(a,"rise",24);SP.sfx("jump");return;}}
    else{const max=(p.rec>=0?2.4:p.k.run)*(dir*f<0?.86:1);C.run(a,dir,dt,{max,acc:42,face:f});if(!dir)a.vx=damp(a.vx,0,14,dt);a.f=f;}
    if(p.rec<0&&!(p.poseT>0))C.pose(a,Math.abs(a.vx)>.3?"ready":"ready",14);}
  else{C.run(a,dir,dt,{max:p.k.run,airAcc:3,face:f});a.f=f;
    /* near the top of the jump with the ball close: the arm draws back on its own, ready to fire */
    if(!p.swung&&!p.blockJump&&a.vy<2.6&&a.pose!=="cock"){const b=M.ball;if(b.live&&!(M.tt===p.t&&M.tn>=3)&&Math.hypot(b.x-(a.x+f*.42),b.y-(C.hipY(a)+1.1))<3.2)C.pose(a,"cock",20);}
    if(!p.swung&&!p.blockJump){const k=C.take(P,"a",.1)?"spike":C.take(P,"c",.1)?"tip":null;if(k){p.swung=true;p.sw={kind:k,t:0,aim:P.h.up?1:P.h.down?-1:0,min:9};C.pose(a,k==="tip"?"tip":"cock",38);}}
    if(p.blockJump&&P.h.up)C.pose(a,"press",30);}
  /* the swing: contact at the closest moment */
  if(p.sw){const sw=p.sw;sw.t+=dt;if(sw.kind==="spike"&&sw.t>.03&&a.pose==="cock")C.pose(a,"swing",60);if(!sw.aim)sw.aim=P.h.up?1:P.h.down?-1:0;
    const b=M.ball,ok=b.live&&ld(p.t,b.x)>-.1&&!(M.tt===p.t&&M.tn>=3);
    if(ok&&sw.t<=.24){const cx=a.x+f*.42,cy=C.hipY(a)+1.1,d=Math.hypot(b.x-cx,b.y-cy);
      if(d<HW){if(d>sw.min+.003)humanHit(M,p,sw.min);else sw.min=d;}else if(sw.min<HW)humanHit(M,p,sw.min);
      if(p.sw&&sw.t>.23&&sw.min<HW)humanHit(M,p,sw.min);}
    if(p.sw&&sw.t>.3)p.sw=null;}
  /* a set you didn't press for: a late, safe ball to the wing */
  {const b=M.ball;if(M.plan&&M.plan.p===p&&M.plan.type==="set"&&p.rec<0&&b.live&&b.vy<0&&b.y<1.8&&b.y>1.4&&Math.abs(b.x-(a.x+f*.12))<.7){const T=M.teams[p.t],ws=T.players.find(x=>x.role==="WS"&&x!==p)||T.players.find(x=>x!==p);setBall(M,p,ws,"high",.4,false);SP.F.pop(M.cam.X(b.x),M.cam.Y(b.y)-40,"LATE SET",{col:"#cfc8bd",size:22,sub:"Press X as it comes down"});return;}}
  /* hands: a bump low, a set high */
  if(p.rec>=0||p.dive>0)humanHands(M,p);
  else if(M.cfg.diff==="rookie"&&M.plan&&M.plan.p===p&&M.plan.type==="recv"){/* Rookie: a gentle auto-bump if you're in the right spot */const b=M.ball;if(b.live&&b.vy<0&&b.y<.9&&Math.abs(b.x-(a.x+f*.42))<.45&&!a.air){receive(M,p,.5,"");p.recCool=.2;}}}
function humanHit(M,p,d){const sw=p.sw,q=clamp(1-Math.max(0,d-.1)/(.58*(M.cfg.versus?1:perk("win"))),0,1);p.sw=null;const pw=!!(p.thunder&&M.time<p.thunder)||!!(M.attack&&M.attack.p===p&&M.attack.spec);if(pw)p.thunder=0;
  if(p.jumpX!=null&&M.attack&&M.attack.p===p&&M.attack.tempo==="pipe"&&Math.abs(ld(p.t,p.jumpX))<3){pointTo(M,1-p.t,"BACK-ROW FAULT",{kind:"err",p,sub:"Pipe hitters take off behind the 3 m line"});return;}
  attack(M,p,sw.kind==="tip"?(sw.aim>0?"roll":"tip"):"spike",sw.aim,q,pw&&sw.kind!=="tip");
  if(q>=.78&&sw.kind!=="tip")M.spirit[p.t]=clamp(M.spirit[p.t]+.05,0,1);}
const ballOverhead=(M,p)=>{const b=M.ball,f=faceOf(p.t);return b.live&&b.y>1.7&&b.y<3.4&&Math.abs(b.x-(p.a.x+f*.12))<1.1&&M.tt===p.t;};
function humanHands(M,p){const b=M.ball,a=p.a,f=faceOf(p.t);if(!b.live||M.tt!==p.t&&ld(p.t,b.x)<0)return;
  /* a set: the ball comes down onto your hands */
  if(p.rec>=0&&b.vy<0&&b.y<=2.6&&b.y>1.6&&Math.abs(b.x-(a.x+f*.12))<.6&&(M.tt===p.t)){const P=p.human.pad,q=clamp(.62+.035*p.st.set-Math.abs(b.x-(a.x+f*.12))*.5-(p.rec>.35?.12:0),0,1);p.rec=-1;
    if(M.tn>=2){freeOver(M,p,q);return;}
    const T=M.teams[p.t],hs=T.players.filter(x=>x!==p),mb=hs.find(x=>x.role==="MB"),ws=hs.find(x=>x.role==="WS")||hs[0];
    let who=ws,tempo=(M.lastPassQ||.7)>=.7?"shoot":"high";if(P.h.up&&mb){who=mb;tempo="quick";}else if(P.h.down){tempo="pipe";}
    const spec=!!(p.tempo&&M.time<p.tempo);if(spec)p.tempo=0;setBall(M,p,who,tempo,spec?1:q,spec);C.pose(a,"setgo",30);p.poseT=.3;return;}
  /* a bump: the ball is played at its closest moment to the middle of your platform */
  const dv=p.dive>0;if(dv&&(p.dive<.04||p.dive>.5))return;const c=dv?a.x+a.f*1.0:a.x+f*.42,x0=dv?Math.min(a.x+a.f*.15,a.x+a.f*1.55):c-.6,x1=dv?Math.max(a.x+a.f*.15,a.x+a.f*1.55):c+.6,y0=dv?.02:.18,y1=dv?.85:1.75;
  if(b.x>=x0&&b.x<=x1&&b.y>=y0&&b.y<=y1&&b.vy<.5){const d=Math.hypot(b.x-c,(b.y-(dv?.3:.85))*.8);if(p.near&&d>p.near.d+.004)bumpNow(M,p,p.near.d,dv);else p.near={d};}
  else if(p.near)bumpNow(M,p,p.near.d,dv);}
function bumpNow(M,p,d,dv){p.near=null;const b=M.ball,sh=M.shot,inc=Math.hypot(b.vx,b.vy),timed=!dv&&p.rec<=.32;
  if(M.lastT!==p.t&&M.tt!==p.t&&ld(p.t,b.x)<0)return;
  /* touching a ball that was going out gives them the point */
  const L=C.land(b);if(M.lastT!==p.t&&L&&ld(p.t,L.x)>9.2&&!M.tool&&M.tn===0){p.rec=-1;pointTo(M,1-p.t,"IT WAS OUT!",{kind:"err",p,sub:"Leave the ones going long"});return;}
  let q=1-d/(dv?.75:.6)*.6-Math.max(0,inc-15.5)*.035-(timed?0:.12)+(p.st.def-5)*.02;if(dv)q=Math.min(.68,q);
  if(sh&&sh.pw&&M.lastP===sh.p&&q<.9){q=.1;SP.F.pop(M.cam.X(b.x),M.cam.Y(b.y)-40,"TOO HOT!",{col:"#ffd34d",size:30});}
  if(b.float>0)q-=.05;p.rec=-1;p.recCool=.15;M.lastPassQ=q;
  if(M.tt===p.t&&M.tn===1){/* a bump set to a hitter */const T=M.teams[p.t],hs=T.players.filter(x=>x!==p);setBall(M,p,hs.find(x=>x.role==="WS")||hs[0],"high",clamp(q-.2,0,1),false);return;}
  receive(M,p,q,dv&&b.y<.35?"pancake":"");if(!dv){C.pose(p.a,"dig",40);p.poseT=.3;}}
function dump(M,p){const b=M.ball;if(M.tn>=3)return;const tx=wx(1-p.t,rand(.8,2.2)),v=C.throwT([b.x,b.y],[tx,C.BR],.62);b.vx=v[0];b.vy=v[1];b.dip=0;b.live=true;b.netDone=false;
  M.shot={p,kind:"tip",aim:0,q:.9,v:5,pw:false,t:p.t,time:M.time,dump:true};afterTouch(M,p,false);C.pose(p.a,"tip",30);p.poseT=.25;SP.F.pop(M.cam.X(b.x),M.cam.Y(b.y)-40,"SETTER DUMP!",{col:p.t===0?acc():"#fff",size:28});SP.sfx("set");}
function useSpecial(M,p){if(M.spirit[p.t]<1)return;M.spirit[p.t]=0;p.stats.specials++;const until=M.time+9*(p.t===0&&!M.cfg.versus?perk("dur"):1);
  if(p.role==="WS")p.thunder=until;else if(p.role==="MB")p.iron=until;else p.tempo=until;
  cutIn(M,p,SPECIAL[p.role].name.toUpperCase());}

/* ---------- serving: the same controls for you and the AI (the AI presses virtual buttons) ---------- */
function serveControl(M,p,P,dt){const sv=M.sv,a=p.a,b=M.ball,f=faceOf(p.t),F=SP.F;sv.t+=dt;
  if(sv.phase==="walk"){C.goTo(a,wx(p.t,10.4),5,dt,f);a.x+=a.vx*dt;C.pose(a,"stand",10);if(Math.abs(a.x-wx(p.t,10.4))<.1||sv.t>1.8){sv.phase="ready";sv.t=0;}holdBall(M,p);return;}
  if(sv.phase==="ready"){const dir=C.dir(P);C.run(a,dir,dt,{max:2.6,acc:20,face:f});if(!dir)a.vx=damp(a.vx,0,12,dt);a.x+=a.vx*dt;const d=clamp(ld(p.t,a.x),9.25,11.8);a.x=wx(p.t,d);a.f=f;
    if(P.h.up)sv.aim=clamp(sv.aim+dt*.75,0,1);if(P.h.down)sv.aim=clamp(sv.aim-dt*.75,0,1);
    if(C.take(P,"kind",.2)){sv.kind=sv.kind==="spin"?"float":sv.kind==="float"?"stand":"spin";if(p.human)p.human.kind=sv.kind;SP.sfx("tick");}
    if(p.human){p.human.aim=sv.aim;}C.pose(a,Math.abs(a.vx)>.3?"ready":"stand",10);holdBall(M,p);
    if(C.take(P,"a",.12)||(!p.human&&sv.t>8)){toss(M,p);}return;}
  if(sv.phase==="toss"){sv.t+=0;const pt=sv.tt=(sv.tt||0)+dt;
    if(sv.kind==="spin"){if(!a.air){if(pt>.35){a.vx=damp(a.vx,f*2.4,10,dt);a.x+=a.vx*dt;C.pose(a,"ready",12);}if(pt>.12&&C.take(P,"a",.12)){C.jump(a,p.k.jv,.55);p.jumpX=a.x;C.pose(a,"rise",24);SP.sfx("jump");}}
      else if(!p.swung&&C.take(P,"a",.1)){p.swung=true;sv.sw={t:0,min:9};C.pose(a,"cock",40);}}
    else if(sv.kind==="float"){if(!a.air&&pt>.18&&!p.jumpX){C.jump(a,4.3,.4);p.jumpX=a.x;a.vx=f*.6;C.pose(a,"cock",14);}if(sv.held&&!P.h.a&&pt>.08){sv.held=false;if(!p.swung){p.swung=true;sv.sw={t:0,min:9};C.pose(a,"swing",40);}}}
    else{/* standing serve: tap when it drops to your hand */if(!p.swung&&pt>.1&&C.take(P,"a",.12)){p.swung=true;sv.sw={t:0,min:9};C.pose(a,"swing",40);}}
    if(!a.air&&sv.kind!=="stand")a.x+=0;
    if(sv.sw&&!sv.hit){const sw=sv.sw;sw.t+=dt;if(sv.kind==="spin"&&sw.t>.05)C.pose(a,"swing",40);const cx=a.x+f*.42,cy=C.hipY(a)+(sv.kind==="stand"?.95:1.1),d=Math.hypot(b.x-cx,b.y-cy);
      if(sw.t<=.17){if(d<.55){if(d>sw.min+.003)strike(M,p,sw.min);else sw.min=d;}else if(sw.min<.55)strike(M,p,sw.min);if(!sv.hit&&sw.t>.16&&sw.min<.55)strike(M,p,sw.min);}
      if(!sv.hit&&sw.t>.2){sv.sw=null;servFault(M,p,"WHIFF","Hit it as it reaches your hand");return;}}
    if(!sv.hit&&b.y<.7&&b.vy<0)servFault(M,p,"DROPPED THE TOSS","Tap to toss, then time the hit");}}
function holdBall(M,p){const b=M.ball,h=C.joint(p.a,"h1");b.held=true;b.x=h[0]+faceOf(p.t)*.1;b.y=h[1]+.12;b.vx=b.vy=0;b.trail=[];b.live=false;}
function toss(M,p){const sv=M.sv,b=M.ball,f=faceOf(p.t);b.held=false;b.t=0;b.trail=[];sv.phase="toss";sv.tt=0;p.swung=false;p.jumpX=null;SP.sfx("whoosh");
  if(sv.kind==="spin"){b.x=p.a.x+f*.3;b.y=1.95;b.vx=f*1.32;b.vy=6.6;b.spin=6;}else if(sv.kind==="float"){b.x=p.a.x+f*.36;b.y=1.95;b.vx=f*.45;b.vy=4.4;sv.held=true;}else{b.x=p.a.x+f*.3;b.y=1.7;b.vx=f*.15;b.vy=3.5;}
  C.pose(p.a,"toss",22);}
const tdepth=a=>lerp(3.3,8.75,a);
function strike(M,p,d){const sv=M.sv,b=M.ball,F=SP.F,q=clamp(1-d/.55,0,1),hx=b.x,hy=b.y,t=p.t,cam=M.cam;sv.hit=true;sv.sw=null;
  if(sv.kind!=="stand"&&p.jumpX!=null&&ld(t,p.jumpX)<C.HALF){servFault(M,p,"FOOT FAULT","Take off behind the end line");return;}
  const spin=sv.kind==="spin",g=spin?C.G+SDIP:C.G,lx=mx(t,hx),aimD=tdepth(sv.aim),vmax=spin?15+p.st.srv*.6+3.5*q:sv.kind==="float"?13.5+p.st.srv*.45+3*q:12+p.st.srv*.3+2*q;
  const v=(C.maxV([lx,hy],aimD,g,8.5,vmax,.12+.12*q)||8.5)*(1+(1-q)*rand(-.12,.1)),dd=aimD+(1-q)*rand(-1.8,1.6);
  let vv=C.solve([lx,hy],[dd,C.BR],v,false,g);if(!vv)vv=C.throwT([lx,hy],[dd,C.BR],Math.abs(dd-lx)/(v*.85),g);
  b.dip=spin?SDIP:0;b.vx=t===0?vv[0]:-vv[0];b.vy=vv[1];b.spin=spin?-26*(t===0?1:-1):0;b.heat=spin?(v>19.5?1:.55):0;if(sv.kind==="float"){b.float=1+.3*q;b.wob=rand(0,6);}
  b.live=true;b.netDone=false;b.t=0;M.phase="live";M.serve={p,v,kind:sv.kind,q};M.shot=null;p.stats.srv++;
  afterTouch(M,p,false);C.pose(p.a,"swing",45);SP.sfx(spin?"kill":"set");C.speedPop(SP.X,cam,hx,hy,v,q>.8?(t===0?acc():"#fff"):"#fff");F.hit(spin?.2+q*.3:.12);}
function servFault(M,p,txt,sub){p.stats.srvErr++;M.phase="live";pointTo(M,1-p.t,txt,{kind:"err",p,sub});}
/* the AI server's virtual thumbs */
function aiServePad(M,p){const P=p.ai.pad=p.ai.pad||C.pad({});const sv=M.sv,b=M.ball,a=p.a,sk=M.teams[p.t].sk;P.h={};
  if(!p.ai.sv||p.ai.svN!==M.rallyN){p.ai.svN=M.rallyN;const o=M.teams[1-p.t];let best=.5,bd=-1;for(let k=0;k<=1;k+=.05){const x=wx(o.t,tdepth(k)),dd=Math.min(...o.players.map(r=>Math.abs(r.a.x-x)));if(dd+rand(0,1.5/sk)>bd){bd=dd;best=k;}}
    p.ai.sv={aim:best,wait:rand(.5,1.3),jt:rand(-.09,.09)/sk,ht:rand(-.06,.06)/sk};}
  const s=p.ai.sv;
  if(sv.phase==="ready"){if(Math.abs(sv.aim-s.aim)>.03){P.h[sv.aim<s.aim?"up":"down"]=true;}else if(sv.t>s.wait)P.p.a=0;}
  else if(sv.phase==="toss"){if(sv.kind==="spin"){if(!a.air){const t=C.timeToY(b,2.05+apexOf(p.k.jv));if(t!=null&&t<p.k.jv/C.PG+.02+s.jt)P.p.a=0;}else if(!p.swung){const cx=a.x+faceOf(p.t)*.42,cy=C.hipY(a)+1.1;if(Math.hypot(b.x-cx,b.y-cy)<.72+s.ht)P.p.a=0;}}
    else if(sv.kind==="float"){P.h.a=sv.tt<.5+s.ht;}
    else{if(!p.swung&&b.vy<0){const cy=C.hipY(a)+.95;if(b.y<cy+.35+s.ht)P.p.a=0;}}}
  return P;}

/* ---------- the rally loop ---------- */
const PK=Object.keys(C.POSES.stand);
function step(M,dt){M.time+=dt;const b=M.ball;
  if(M.phase==="pre"){M.pt+=dt;if(M.pt>1.1&&!(M.cfg.drill&&M.cfg.drill!=="serve")){M.phase="serve";M.sv.phase="walk";M.sv.t=0;}}
  /* a human hitter who didn't swing: the others can still play it */
  if(M.attack&&M.attack.p.human&&!SP.autoplay&&M.time>M.attack.tc+.3){M.attack=null;M.plan=null;}
  M.teams.forEach(T=>T.players.forEach(p=>{
    if(p.human&&!SP.autoplay)humanStep(M,p,dt);
    else if(M.phase==="serve"&&M.sv.p===p)serveControl(M,p,aiServePad(M,p),dt);
    else if(M.phase==="pre"||M.phase==="serve"||M.phase==="dead"||M.phase==="over"){const a=p.a;if(!a.air){const post=(M.phase==="dead"||M.phase==="over")&&M.say&&M.pt>.15,won=post&&M.say.w===p.t,lost=post&&!won;
      if(won&&!p.cel)p.cel=pick(["fist","celebrate","roar"]);if(lost&&!p.sl)p.sl=pick(["slump","hands","slump"]);
      if(post&&M.pt<1.2){a.vx=damp(a.vx,0,6,dt);if(won&&Math.random()<dt*1.6){C.jump(a,3.4+Math.random(),0);C.pose(a,Math.random()<.5?"celebrate":"roar",20);}else C.pose(a,won?p.cel:p.sl,won?18:9);}
      else{C.goTo(a,p.goal,p.k.run,dt,faceOf(p.t));a.x+=a.vx*dt;C.pose(a,Math.abs(a.vx)>.3?"ready":won?p.cel:"ready",10);}}}
    else aiStep(M,p,dt);
    const a=p.a;if(a.air||p.human){if(C.physics(a,dt,{hold:!!(p.human&&p.human.pad.h.a&&!SP.autoplay)})){C.pose(a,M.phase==="live"?"land":"low",18);if(!A.K.reduced())C.dust(SP.X,M.cam,a.x,M.phase==="live"?6:3);p.poseT=.15;p.sw=null;p.blockJump=false;if(!p.human)p.blk=null;}}
    /* nobody crosses the centre line */
    if(ld(p.t,a.x)<.15)a.x=wx(p.t,.15);if(ld(p.t,a.x)>12.5)a.x=wx(p.t,12.5);}));
  if(M.phase==="live"){if(!M.plan)planNext(M);else if(M.plan.type==="recv"&&isAI(M.plan.p)&&M.time-M.plan.made>.3&&M.ball.float>0)planNext(M);}
  const px=b.x,ev=C.stepBall(b,dt);
  if(M.phase==="live"&&b.live){
    /* the ball crossed the net: it's the other team's now */
    if((px<0)!==(b.x<0)){const S=b.x<0?0:1;if(M.tt!==S){M.tt=S;M.tn=0;M.plan=null;}}
    blockCheck(M,dt);aiContact(M);}
  ev.forEach(e=>{if(e.k==="floor")floorHit(M,e.x);if(e.k==="net"||e.k==="tape"){M.rip={a:e.k==="net"?1:.5,y:e.k==="net"?clamp(b.y,C.NET-.9,C.NET-.1):C.NET,t:0,dir:-Math.sign(b.vx)||1};SP.sfx("block");M.plan=null;if(e.k==="tape"&&M.phase==="live")SP.F.pop(M.cam.X(0),M.cam.Y(2.6)-30,"OFF THE TAPE",{col:"#fff",size:22});}});
  /* a watchdog for a ball nobody can reach */
  if(M.phase==="live"&&M.time-(M.lastTouchT||M.time)>7)floorHit(M,b.x);}
function floorHit(M,x){if(M.phase!=="live")return;{const bb=M.ball,pv=bb.pv||[0,0],v=Math.hypot(pv[0],pv[1]);M.marks=M.marks||[];M.marks.push({x,t:M.time,v,crack:v>19||bb.zap,seed:Math.random()*99});const hot=bb.heat>.5,zc=bb.zap?"255,211,77":hot?"255,170,80":"255,255,255";
    fx(M,"shock",{x,col:zc,n:v>16?2:1,r:1+Math.min(1.8,v*.09),life:.55+Math.min(.3,v*.015)});if(v>16){C.dust(SP.X,M.cam,x,v>19?12:7);sparks(M,x,.05,v>19?9:5,zc,5.5,Math.PI/2,.9);}
    if(bb.zap){fx(M,"bolt",{x,seed:Math.random()*99});bb.zap=false;SP.F.flashOn(.22,"255,211,77");}
    const sh=M.shot;if(sh&&sh.p&&sh.p.human&&!SP.autoplay&&sh.kind==="spike"&&sh.q>=.78&&!sh.blocked&&M.tt!==1-sh.t)SP.F.slowmo(.22,.45);}
  const b=M.ball,side=x<0?0:1,inC=Math.abs(x)<=C.HALF;let w,why,o={x};
  const sh=M.shot,sv=M.serve,lp=M.lastP;
  if(M.tool){w=M.tool.p.t;why="TOUCHOUT!";o.kind="kill";o.p=M.tool.p;o.set=sh&&sh.setter;o.v=sh?sh.v:0;M.tool.p.stats.tools++;o.sub="Off the block";}
  else if(inC){w=1-side;
    if(M.stuff&&lp===M.stuff.p&&lp.t===w){why=lp.iron?"IRON WALL!":"STUFF BLOCK!";o.kind="block";o.p=lp;o.sub=`${lp.name||"Block"} at the net`;}
    else if(sh&&lp===sh.p&&sh.t===w){why=sh.pw?"THUNDER SPIKE!":sh.kind==="tip"?(sh.p.role==="SE"&&sh.dump?"SETTER DUMP!":"TIP KILL"):sh.kind==="roll"?"ROLL SHOT":sh.q>=.78?"PERFECT KILL":"KILL";o.kind="kill";o.p=sh.p;if(sh.dump)sh.p.stats.dumps++;o.set=sh.setter;o.v=sh.v;o.pw=sh.pw;o.sub=sh.kind==="spike"?`${C.kmh(sh.v)} km/h`:"Into the gap";}
    else if(sv&&lp===sv.p&&lp.t===w&&M.touches<=1){why=sv.kind==="float"?"FLOAT ACE!":"ACE!";o.kind="ace";o.p=sv.p;o.sub=`${C.kmh(sv.v)} km/h ${sv.kind==="spin"?"jump serve":sv.kind==="float"?"jump float":"serve"}`;}
    else{why=lp&&lp.t===side?"DROPPED":"NOBODY HOME";o.sub=lp&&lp.t===side?"It hit the floor on your side":"";}}
  else if(sh&&sh.kind==="spike"&&lp&&lp.t!==sh.t&&M.lastT!==sh.t&&!sh.blocked&&M.time-sh.time<2.2){/* a hard spike they couldn't control: the hitter's point */w=sh.t;why=sh.pw?"THUNDER SPIKE!":"KILL";o.kind="kill";o.p=sh.p;o.set=sh.setter;o.v=sh.v;o.pw=sh.pw;o.sub="Too hot to handle";}
  else{w=M.lastT<0?1-side:1-M.lastT;why="OUT!";o.kind="err";o.p=lp;o.sub=lp?`Off ${lp.t===0?"your":"their"} ${lp===sv?.p?"serve":"hands"}`:"";if(lp&&sv&&lp===sv.p&&M.touches<=1)lp.stats.srvErr++;}
  pointTo(M,w,why,o);}

/* ---------- replays: the last few seconds, kept as snapshots ---------- */
function snap(M){const b=M.ball,f={b:[b.x,b.y,b.rot,b.heat],p:[]};M.teams.forEach(T=>T.players.forEach(p=>{const a=p.a;f.p.push([a.x,a.y,a.f,a.rot,...PK.map(k=>a.cur[k])]);}));M.buf.push(f);if(M.buf.length>200)M.buf.shift();}
function applySnap(M,f){const b=M.ball;[b.x,b.y,b.rot,b.heat]=f.b;b.trail=[];let i=0;M.teams.forEach(T=>T.players.forEach(p=>{const a=p.a,v=f.p[i++];a.x=v[0];a.y=v[1];a.f=v[2];a.rot=v[3];PK.forEach((k,j)=>a.cur[k]=v[4+j]);a.vx=0;}));}

/* ---------- the camera director: frames the action, zooms in close, punches in on big hits ---------- */
function director(M,dt){const cam=M.cam,b=M.ball,ph=M.phase,xs=[b.x];let top=Math.max(b.held?1.8:b.y,2.4),minSpan=8.6;
  if(ph==="intro"){xs.push(-8.5,8.5);}
  else if(ph==="serve"||ph==="pre"){const sv=M.sv;if(sv&&sv.p){xs.push(sv.p.a.x,sv.p.a.x>0?-1:1);if(!sv.hit)minSpan=7.4;}}
  else if(ph==="live"){if(b.live){const L=C.land(b);if(L&&L.t<1.5&&Math.abs(L.x)<12)xs.push(L.x);}if(M.plan&&M.plan.p)xs.push(M.plan.p.a.x);if(M.attack&&M.attack.p){xs.push(M.attack.p.a.x);minSpan=7.6;}
    M.teams.forEach(T=>T.players.forEach(p=>{if(p.a.air)top=Math.max(top,C.hipY(p.a)+1.4);}));}
  else if(ph==="replay"){minSpan=6.2;}
  else{const w=M.say?M.say.w:0;const xsW=M.teams[w].players.map(p=>p.a.x);xs.push(xsW.reduce((a,c)=>a+c,0)/xsW.length);minSpan=8;}
  let lo=Math.min(...xs)-1.7,hi=Math.max(...xs)+1.7;if(hi-lo<minSpan){const m=(lo+hi)/2;lo=m-minSpan/2;hi=m+minSpan/2;}
  const base=H*.8;let s=Math.min(W*.94/(hi-lo),(base-58)/(top+.8));s=clamp(s,48,92);
  const pu=M.punch||0;s*=1+pu*.08;
  const fy=clamp(Math.max(base,58+(top+.5)*s),base,H*.94);
  let x=(lo+hi)/2;if(pu>0&&M.punchX!=null)x=lerp(x,M.punchX,pu*.35);const half=W/2/s;x=clamp(x,-12.6+half,12.6-half);
  const k=ph==="replay"?1.6:pu>.3?4:2.4;cam.s=damp(cam.s,s,k,dt);cam.x=damp(cam.x,x,k*1.2,dt);cam.fy=damp(cam.fy,fy,3,dt);cam.upd();M.punch=Math.max(0,pu-dt*1.8);}
/* anime focus lines around a big hit */
function speedLines(g,M){const L=M.fxl;if(!L)return;const cam=M.cam,cx=cam.X(L.x),cy=cam.Y(L.y),k=L.t/.5,a=(1-k)*(1-k)*.4*L.n,fr=Math.floor(L.t*30);
  g.save();g.fillStyle=`rgba(${L.col},${a})`;for(let i=0;i<30;i++){const h=Math.sin((i+1)*91.7+L.seed+fr*13.1)*43758.5,f=h-Math.floor(h),an=i/30*TAU+f*.15,r0=170+f*140+k*80,r1=1100,w=.006+f*.012;
    g.beginPath();g.moveTo(cx+Math.cos(an)*r0,cy+Math.sin(an)*r0);g.lineTo(cx+Math.cos(an-w)*r1,cy+Math.sin(an-w)*r1);g.lineTo(cx+Math.cos(an+w)*r1,cy+Math.sin(an+w)*r1);g.closePath();g.fill();}g.restore();}
/* the impact frame: two or three frames of black with the hitter and the ball in white */
function impactFrame(g,M){const I=M.impact;if(!I||A.K.reduced())return;const cam=M.cam,b=M.ball;g.save();const ix=cam.X(b.x),iy=cam.Y(b.y),vg=g.createRadialGradient(ix,iy,30,ix,iy,W*.7);vg.addColorStop(0,"rgba(6,5,8,.45)");vg.addColorStop(1,"rgba(6,5,8,.85)");g.fillStyle=vg;g.fillRect(0,0,W,H);
  const col=I.p.t===0?acc():"#ffffff";C.drawAthlete(g,cam,I.p.a,{flat:"#fff"});g.fillStyle=col;g.beginPath();g.arc(cam.X(b.x),cam.Y(b.y),C.BR*C.BVIS*cam.s*1.2,0,TAU);g.fill();
  g.strokeStyle=col;g.lineWidth=4;g.beginPath();g.arc(cam.X(b.x),cam.Y(b.y),C.BR*C.BVIS*cam.s*(2+I.t*30),0,TAU);g.stroke();g.restore();}

/* ---------- spike effects: small and sharp, layered by how good the hit was ----------
   glint (a star where the hand meets the ball), ripple (a ring of air), streak (lines riding with the ball),
   shock (rings across the floor), bolt (Thunder Spike lightning), flare (a lens streak), hex (Iron Wall), sparks */
const FXL={glint:.2,ripple:.34,streak:.34,shock:.7,bolt:.34,flare:.5,hex:.45};
function fx(M,k,o){if(A.K.reduced()&&k!=="shock"&&k!=="glint")return;(M.sfx||(M.sfx=[])).push(Object.assign({k,t:0,life:FXL[k]},o));if(M.sfx.length>30)M.sfx.shift();}
function sparks(M,x,y,n,col,sp,ang,spread){if(A.K.reduced())return;M.spk=M.spk||[];for(let i=0;i<n;i++){const a=ang+rand(-spread,spread),s=sp*rand(.35,1);M.spk.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,life:rand(.22,.45),col});}if(M.spk.length>90)M.spk.splice(0,M.spk.length-90);}
function stepFx(M,dt){if(M.sfx){M.sfx.forEach(e=>e.t+=dt);M.sfx=M.sfx.filter(e=>e.t<e.life);}
  if(M.spk){M.spk.forEach(s=>{s.t+=dt;s.vy-=10*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.y<0){s.y=0;s.vy*=-.3;s.vx*=.5;}});M.spk=M.spk.filter(s=>s.t<s.life);}}
const hsh=(i,sd)=>{const h=Math.sin(i*78.233+sd*12.9898)*43758.5453;return h-Math.floor(h);};
function jag(g,pts,amp,sd){g.beginPath();pts.forEach((p,i)=>{const j=i&&i<pts.length-1?(hsh(i,sd)-.5)*amp:0;i?g.lineTo(p[0]+j,p[1]+j*.4):g.moveTo(p[0],p[1]);});g.stroke();}
function drawFx(g,M,layer){const cam=M.cam,s=cam.s,b=M.ball;
  if(layer==="floor"){(M.sfx||[]).forEach(e=>{if(e.k!=="shock")return;const k=e.t/e.life,x=cam.X(e.x),y=cam.DY(.5);g.save();
      for(let i=0;i<e.n;i++){const kk=clamp(k*1.3-i*.25,0,1);if(kk<=0||kk>=1)continue;const r=(.25+(1-Math.pow(1-kk,3))*e.r)*s;g.strokeStyle=`rgba(${e.col},${.75*(1-kk)})`;g.lineWidth=(i?1.5:3)*(1-kk)+.5;g.beginPath();g.ellipse(x,y,r,r*.22,0,0,TAU);g.stroke();}
      const R=(.35+k*.9)*s;g.translate(x,y);g.scale(1,.24);const gr=g.createRadialGradient(0,0,0,0,0,R);gr.addColorStop(0,`rgba(${e.col},${.22*(1-k)})`);gr.addColorStop(1,`rgba(${e.col},0)`);g.fillStyle=gr;g.beginPath();g.arc(0,0,R,0,TAU);g.fill();g.restore();});return;}
  g.save();g.lineCap="round";
  /* the ball itself: spin arcs when it's hot, crackling lightning on a Thunder Spike */
  if(b.live&&!b.held&&b.heat>.5&&M.phase==="live"){const x=cam.X(b.x),y=cam.Y(b.y),r=C.BR*C.BVIS*s*1.75,a0=M.time*-26*Math.sign(b.vx||1);g.strokeStyle=`rgba(255,${b.zap?220:190},${b.zap?90:120},${.5*Math.min(1,b.heat)})`;g.lineWidth=1.6;
    for(let i=0;i<2;i++){g.beginPath();g.arc(x,y,r,a0+i*Math.PI,a0+i*Math.PI+1.1);g.stroke();}}
  if(b.zap&&b.live&&b.trail.length>3){g.save();g.globalCompositeOperation="lighter";g.shadowColor="#ffd34d";g.shadowBlur=10;const fr=Math.floor(M.time*24);
    for(let n=0;n<2;n++){g.strokeStyle=n?"rgba(255,255,255,.85)":"rgba(255,211,77,.8)";g.lineWidth=n?1:2.5;jag(g,b.trail.slice(-9).map(([tx,ty])=>[cam.X(tx),cam.Y(ty)]),14,fr+n*7);}g.restore();}
  (M.sfx||[]).forEach(e=>{const k=e.t/e.life;
    if(e.k==="glint"){const x=cam.X(e.x),y=cam.Y(e.y),a=Math.sin(Math.min(1,k*1.6)*Math.PI*.5+(k>.3?(k-.3)/.7*Math.PI*.5:0)),L=e.size*s*.6*(k<.3?k/.3:1),al=1-k;
      g.save();g.globalCompositeOperation="lighter";const gr=g.createRadialGradient(x,y,0,x,y,L*.7);gr.addColorStop(0,`rgba(${e.col},${.6*al})`);gr.addColorStop(1,`rgba(${e.col},0)`);g.fillStyle=gr;g.beginPath();g.arc(x,y,L*.7,0,TAU);g.fill();
      g.translate(x,y);g.rotate(e.rot||0);const ray=(len,w)=>{g.beginPath();g.moveTo(-len,0);g.lineTo(0,-w);g.lineTo(len,0);g.lineTo(0,w);g.closePath();g.fill();};
      g.fillStyle=`rgba(255,255,255,${al})`;ray(L,L*.06);g.rotate(Math.PI/2);ray(L*.8,L*.06);g.rotate(Math.PI/4);g.fillStyle=`rgba(${e.col},${.8*al})`;ray(L*.4,L*.05);g.rotate(Math.PI/2);ray(L*.4,L*.05);g.restore();}
    else if(e.k==="ripple"){const x=cam.X(e.x),y=cam.Y(e.y),kk=1-Math.pow(1-k,2.5),r=(.15+kk*e.r)*s;g.strokeStyle=`rgba(${e.col},${.6*(1-k)})`;g.lineWidth=.6+2.4*(1-k);g.beginPath();g.arc(x,y,r,0,TAU);g.stroke();
      g.strokeStyle=`rgba(${e.col},${.25*(1-k)})`;g.lineWidth=1;g.beginPath();g.arc(x,y,r*.7,0,TAU);g.stroke();}
    else if(e.k==="streak"&&b.live&&!b.held){/* lines that ride behind the ball, thinning out */const sp=Math.hypot(b.vx,b.vy)||1,ux=b.vx/sp,uy=b.vy/sp,px=-uy,py=ux;g.save();g.globalCompositeOperation="lighter";
      for(let i=0;i<e.n;i++){const f=hsh(i,e.seed),off=(f-.5)*.75,d0=.25+f*.35,d1=d0+(.6+hsh(i+9,e.seed)*1.3)*(1-k*.6),x0=b.x-ux*d0+px*off,y0=b.y-uy*d0+py*off,x1=b.x-ux*d1+px*off,y1=b.y-uy*d1+py*off;
        const gr=g.createLinearGradient(cam.X(x0),cam.Y(y0),cam.X(x1),cam.Y(y1));gr.addColorStop(0,`rgba(${e.col},${(.55+f*.3)*(1-k)})`);gr.addColorStop(1,`rgba(${e.col},0)`);g.strokeStyle=gr;g.lineWidth=.8+f*1.6;g.beginPath();g.moveTo(cam.X(x0),cam.Y(y0));g.lineTo(cam.X(x1),cam.Y(y1));g.stroke();}g.restore();}
    else if(e.k==="flare"){const x=cam.X(e.x),y=cam.Y(e.y),al=(1-k)*(1-k),w=W*(.25+k*.35);g.save();g.globalCompositeOperation="lighter";const gr=g.createLinearGradient(x-w,y,x+w,y);gr.addColorStop(0,`rgba(${e.col},0)`);gr.addColorStop(.5,`rgba(255,255,255,${.7*al})`);gr.addColorStop(1,`rgba(${e.col},0)`);g.fillStyle=gr;g.fillRect(x-w,y-1.5,w*2,3);
      g.globalAlpha=.35*al;g.fillRect(x-w*.6,y-5,w*1.2,10);g.restore();}
    else if(e.k==="bolt"){/* Thunder Spike lands: a bolt down from the roof, re-forking every couple of frames */const x=cam.X(e.x),y=cam.DY(.5),al=k<.15?1:1-(k-.15)/.85,fr=Math.floor(e.t*20),pts=[];
      for(let i=0;i<=10;i++){const yy=lerp(-10,y,i/10);pts.push([x+(i?(hsh(i,e.seed+fr)-.5)*40*(1-i/10):0)+(hsh(i+3,e.seed)-.5)*20*(1-i/10),yy]);}
      g.save();g.globalCompositeOperation="lighter";g.shadowColor="#ffd34d";g.shadowBlur=18;g.strokeStyle=`rgba(255,211,77,${al})`;g.lineWidth=5*al+1;jag(g,pts,10,fr);g.strokeStyle=`rgba(255,255,255,${al})`;g.lineWidth=1.8;jag(g,pts,10,fr);
      const fork=pts.slice(4,8).map(([px,py],i)=>[px+i*14*(hsh(2,e.seed)>.5?1:-1),py]);g.strokeStyle=`rgba(255,211,77,${.6*al})`;g.lineWidth=1.5;jag(g,fork,8,fr+3);g.restore();}
    else if(e.k==="hex"){const x=cam.X(e.x),y=cam.Y(e.y),r=(.55+k*.45)*s,al=1-k;g.save();g.translate(x,y);g.rotate(k*.4);g.beginPath();for(let i=0;i<6;i++){const an=i/6*TAU+Math.PI/6;i?g.lineTo(Math.cos(an)*r,Math.sin(an)*r):g.moveTo(Math.cos(an)*r,Math.sin(an)*r);}g.closePath();
      g.fillStyle=`rgba(${e.col},${.15*al})`;g.fill();g.strokeStyle=`rgba(${e.col},${.85*al})`;g.lineWidth=2.5;g.stroke();g.restore();}});
  (M.spk||[]).forEach(p=>{const a=1-p.t/p.life,x=cam.X(p.x),y=cam.Y(p.y);g.strokeStyle=`rgba(${p.col},${a})`;g.lineWidth=1.6;g.beginPath();g.moveTo(x,y);g.lineTo(x-p.vx*.022*s,y+p.vy*.022*s);g.stroke();});
  g.restore();}
/* your timing guide: a ring at the sweet spot of your hand that the ball closes in on; gold when it's perfect */
function timingRing(g,M){if(SP.autoplay)return;const b=M.ball;if(!b.live||M.phase!=="live")return;
  M.teams.forEach(T=>T.players.forEach(p=>{if(!p.human||!p.a.air||p.dive>0)return;const a=p.a,f=a.f,cx=a.x+f*.42,cy=C.hipY(a)+1.1,d=Math.hypot(b.x-cx,b.y-cy);
    if(d>2.2||(M.tt===p.t&&M.tn>=3)||ld(p.t,b.x)<-.3)return;const cam=M.cam,x=cam.X(cx),y=cam.Y(cy),s=cam.s,pr=.23*s,win=HW*s,k=clamp(1-(d-.12)/2.1,0,1);
    g.save();g.lineWidth=1.5;g.strokeStyle=`rgba(255,255,255,${.18*k})`;g.setLineDash([3,4]);g.beginPath();g.arc(x,y,win,0,TAU);g.stroke();g.setLineDash([]);
    const hot=d<=.23,inw=d<HW,col=hot?"255,211,77":inw?accRgb():"255,255,255";g.strokeStyle=`rgba(${col},${.35+.55*k})`;g.lineWidth=hot?3:2;g.beginPath();g.arc(x,y,Math.max(pr,d*s),0,TAU);g.stroke();
    g.fillStyle=`rgba(255,211,77,${hot?.85:.35*k})`;g.beginPath();g.arc(x,y,Math.max(2.5,pr*.45),0,TAU);g.fill();g.restore();}));}

/* the jump cue: a ring on the floor closes onto your feet; jump when it's gold */
function jumpCue(g,M){if(SP.autoplay||M.phase!=="live")return;M.humans.forEach(h=>{if(h.cue==null||h.a.air)return;const dtj=h.cue-M.time;if(dtj>.8||dtj<-.18)return;
  const cam=M.cam,x=cam.X(h.a.x),y=cam.DY(.5),s=cam.s,k=clamp(dtj/.8,0,1),now=Math.abs(dtj)<.1,col=now?"255,211,77":accRgb();g.save();
  g.strokeStyle=`rgba(${col},.85)`;g.lineWidth=now?3:2;g.beginPath();g.ellipse(x,y,.45*s,.12*s,0,0,TAU);g.stroke();
  if(dtj>0){g.strokeStyle=`rgba(${col},${.25+.5*(1-k)})`;g.lineWidth=1.5;g.beginPath();g.ellipse(x,y,(.45+1.6*k)*s,(.12+.43*k)*s,0,0,TAU);g.stroke();}
  if(now){const hy=cam.Y(C.hipY(h.a)+1.25);D.small(g,"JUMP!",x,hy-12,15,"#ffd34d","center");}g.restore();});}
SP._fx={timingRing:(g,M)=>timingRing(g,M),drawFx:(g,M,l)=>drawFx(g,M,l),fx:(M,k,o)=>fx(M,k,o),sparks:(...a)=>sparks(...a)};
/* ---------- drawing ---------- */
function drawMatch(g,M){const cam=M.cam,b=M.ball,F=SP.F,t=F.t;
  C.drawGym(g,cam,acc(),M.hype,t,{col2:M.teams[1].col,led:`${M.teams[0].short}  ${M.score[0]} - ${M.score[1]}  ${M.teams[1].short}  ·  CROW SPIKE  ·  `});
  const rep=M.phase==="replay";
  /* ball marks where it hit the floor */
  (M.marks||[]).forEach(m=>{const age=M.time-m.t;if(age>4)return;const al=clamp(1-age/4,0,1),x=cam.X(m.x),y=cam.DY(.5),r=(.22+Math.min(.25,m.v*.012))*cam.s;g.fillStyle=`rgba(40,14,4,${.35*al})`;g.beginPath();g.ellipse(x,y,r,r*.28,0,0,TAU);g.fill();g.strokeStyle=`rgba(255,255,255,${.25*al})`;g.lineWidth=1.5;g.beginPath();g.ellipse(x,y,r*1.15,r*.32,0,0,TAU);g.stroke();
    if(m.crack){g.strokeStyle=`rgba(30,10,2,${.55*al})`;g.lineWidth=1.4;for(let i=0;i<7;i++){const h=Math.sin(i*41.3+m.seed)*4375.5,f=h-Math.floor(h),an=i/7*TAU+f*.6,L=r*(1.1+f*1.2);g.beginPath();g.moveTo(x+Math.cos(an)*r*.4,y+Math.sin(an)*r*.12);g.lineTo(x+Math.cos(an+.15)*L*.6,y+Math.sin(an+.15)*L*.17);g.lineTo(x+Math.cos(an)*L,y+Math.sin(an)*L*.28);g.stroke();}}});
  drawFx(g,M,"floor");
  /* reflections in the varnished floor */
  if(!A.K.reduced()&&C.Q.refl){g.save();g.beginPath();g.rect(0,cam.FY0,W,H-cam.FY0);g.clip();g.translate(0,2*cam.Y(0));g.scale(1,-1);M.teams.forEach(T=>T.players.forEach(p=>C.drawAthlete(g,cam,p.a,{refl:true,alpha:.11})));
    if(b.y<4)C.drawBall(g,cam,b,acc(),{alpha:.16*(1-b.y/4),noTrail:true});g.restore();}
  /* reading aids: where the ball will come down on your side (not on National), your ball, your set */
  if(!rep&&M.phase==="live"&&b.live&&M.cfg.diff!=="national"){M.humans.forEach(h=>{if(M.tt!==h.t||M.tn>0)return;const L=C.land(b);if(!L||ld(h.t,L.x)<0)return;const out=ld(h.t,L.x)>C.HALF&&M.lastT!==h.t;
      if(M.cfg.diff==="varsity"&&ld(h.t,b.x)<0)return;const x=cam.X(L.x),y=cam.DY(.5);g.save();g.strokeStyle=out?"rgba(255,90,90,.85)":`rgba(${accRgb()},.8)`;g.lineWidth=3;g.setLineDash(out?[6,5]:[]);g.beginPath();g.ellipse(x,y,22,7,0,0,TAU);g.stroke();g.restore();if(out)D.text(g,"OUT",x,y-12,15,"#ff8a8a","center",800,true);});}
  M.humans.forEach(h=>{const gh=h.human.ghost;if(!rep&&gh&&M.attack&&M.attack.p===h&&M.time<gh.tc+.25){const k=clamp((M.time-gh.t0)/(gh.tc-gh.t0),0,1),x=cam.X(gh.x),y=cam.Y(gh.y);g.save();g.strokeStyle=`rgba(${accRgb()},${.35+.45*k})`;g.setLineDash([6,6]);g.lineWidth=2;g.beginPath();g.arc(x,y,.55*cam.s*(1.3-.35*k),0,TAU);g.stroke();g.restore();
    if(M.attack.tempo==="pipe"){g.strokeStyle="rgba(255,90,90,.55)";g.lineWidth=3;g.beginPath();g.moveTo(cam.DX(wx(h.t,3),.1),cam.DY(.1));g.lineTo(cam.DX(wx(h.t,3),.9),cam.DY(.9));g.stroke();}}});
  /* serve aim line for a human server */
  const sv=M.sv;if(!rep&&M.phase==="serve"&&sv&&sv.p.human&&!SP.autoplay&&(sv.phase==="ready"||sv.phase==="toss")&&!sv.hit){const p=sv.p,sp=sv.kind==="spin",gg=sp?C.G+SDIP:C.G,lx=mx(p.t,p.a.x)+(sp?2.1:.5),p0=[lx,sp?3.0:sv.kind==="float"?2.7:2.4],dd=tdepth(sv.aim),key=sv.kind+sv.aim.toFixed(3)+lx.toFixed(2);
    if(sv.pk!==key){sv.pk=key;const v=C.maxV(p0,dd,gg,8.5,sp?15+p.st.srv*.6+3.5:sv.kind==="float"?13.5+p.st.srv*.45+3:12+p.st.srv*.3+2,.24)||8.5;sv.pv=[C.solve(p0,[dd,C.BR],v,false,gg)||C.throwT(p0,[dd,C.BR],1,gg),v];}
    const [vv,v]=sv.pv,show=M.cfg.diff==="rookie"?1:M.cfg.diff==="national"?.22:.55,T=(dd-p0[0])/vv[0];g.fillStyle="rgba(255,255,255,.75)";for(let i=1;i<=24*show;i++){const tt=T*i/24,x=p0[0]+vv[0]*tt,y=p0[1]+vv[1]*tt-.5*gg*tt*tt;g.globalAlpha=.85-i/30;g.beginPath();g.arc(cam.X(mx(p.t,x)),cam.Y(y),2.6,0,TAU);g.fill();}g.globalAlpha=1;
    if(sv.phase==="ready")D.small(g,`${sv.kind==="spin"?"Jump serve":sv.kind==="float"?"Jump float":"Standing serve"} · ${C.kmh(v)} km/h max`,cam.X(p.a.x),cam.Y(3.3),12,"rgba(255,255,255,.8)","center");}
  /* players, the net, the ball */
  M.teams[1].players.forEach(p=>C.drawAthlete(g,cam,p.a));C.drawNet(g,cam,0,M.rip);M.teams[0].players.forEach(p=>C.drawAthlete(g,cam,p.a));
  const fade=M.tool&&!rep?clamp(1-(M.time-M.tool.t0-.15)/.9,0,1):1;
  if(!b.held||M.phase!=="dead")C.drawShadow(g,cam,b.x,b.y);C.drawBall(g,cam,b,acc(),{alpha:fade,scale:M.tool&&!rep?.6+.4*fade:1});
  drawFx(g,M,"over");speedLines(g,M);impactFrame(g,M);C.drawVignette(g,cam);timingRing(g,M);jumpCue(g,M);
  /* markers over people: you, and whose ball it is */
  M.humans.forEach(h=>{const a=h.a,x=cam.X(a.x),y=cam.Y(C.hipY(a)+1.05)-14,mine=M.plan&&M.plan.p===h&&M.phase==="live";g.fillStyle=mine?A.K.col():"rgba(255,255,255,.85)";g.beginPath();g.moveTo(x-7,y-10);g.lineTo(x+7,y-10);g.lineTo(x,y);g.closePath();g.fill();
    if(mine&&!SP.autoplay)D.text(g,M.plan.type==="set"?"SET IT":"YOURS",x,y-16,15,A.K.col(),"center",800,true);
    if(M.cfg.versus)D.small(g,h.human.n===1?"P1":"P2",x,y-30,11,"#fff","center");});
  if(rep){g.fillStyle="rgba(0,0,0,.18)";g.fillRect(0,0,W,H);g.strokeStyle="rgba(255,255,255,.12)";for(let y=0;y<H;y+=4){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
    D.text(g,"● REPLAY",W-28,140,22,"#ff4d4d","right",800,true);D.small(g,"tap or press any key to skip",W-28,158,12,"rgba(255,255,255,.7)","right");}}
/* the broadcast scoreboard */
function scoreboard(g,M){const T0=M.teams[0],T1=M.teams[1],w=420,x=W/2-w/2,y=10;D.glass(g,x,y,w,54,.78);
  const sv=M.serveT,dot=(cx,on)=>{if(!on)return;g.fillStyle="#ffd34d";g.beginPath();g.arc(cx,y+27,5,0,TAU);g.fill();};
  g.fillStyle=T0.col;g.fillRect(x,y,6,54);g.fillStyle=T1.col;g.fillRect(x+w-6,y,6,54);
  D.text(g,T0.short,x+18,y+34,22,"#fff","left",800,true);D.text(g,T1.short,x+w-18,y+34,22,"#fff","right",800,true);
  D.text(g,String(M.score[0]),W/2-34,y+42,40,"#fff","right",800,true);D.text(g,String(M.score[1]),W/2+34,y+42,40,"#fff","left",800,true);
  dot(W/2-120+(T0.short.length>6?-14:0),sv===0&&M.phase!=="over");dot(W/2+120,sv===1&&M.phase!=="over");
  D.small(g,M.bestOf>1?`SET ${M.set} · ${M.setsWon[0]}-${M.setsWon[1]}`:`TO ${M.toWin}`,W/2,y+16,10,"rgba(255,255,255,.65)","center");
  if(Math.max(...M.score)>=M.toWin-1&&Math.abs(M.score[0]-M.score[1])>=1&&M.phase!=="over"){const lead=M.score[0]>M.score[1]?0:1;const need=Math.ceil(M.bestOf/2);D.small(g,(M.setsWon[lead]===need-1?"MATCH POINT":"SET POINT")+" "+M.teams[lead].short,W/2,y+70,12,"#ffd34d","center");}}
function hud(g,M,X){scoreboard(g,M);const F=SP.F;
  /* what just happened */
  if(M.say&&M.phase==="dead"){const k=M.say.t,al=k<.15?k/.15:k>1.3?Math.max(0,1-(k-1.3)/.3):1;g.globalAlpha=al;const col=M.say.w===0?acc():"#ff9a9a";
    D.text(g,M.say.txt,W/2,H*.36,54,col,"center",800,true);if(M.say.sub)D.small(g,M.say.sub,W/2,H*.36+24,15,"rgba(255,255,255,.9)","center");D.small(g,`Point ${M.teams[M.say.w].short}`,W/2,H*.36+44,12,"rgba(255,255,255,.65)","center");g.globalAlpha=1;}
  if(M.banner){const k=M.banner.t,al=k<.3?k/.3:k>1.9?1-(k-1.9)/.5:1;g.globalAlpha=clamp(al,0,1);D.glass(g,W/2-240,H*.2,480,80,.8);D.text(g,M.banner.txt,W/2,H*.2+44,38,"#fff","center",800,true);D.small(g,M.banner.sub,W/2,H*.2+66,14,"rgba(255,255,255,.85)","center");g.globalAlpha=1;}
  /* a special's cut-in */
  if(M.cut){const k=M.cut.t,al=k<.15?k/.15:k>1.1?Math.max(0,1-(k-1.1)/.3):1,p=M.cut.p;g.save();g.globalAlpha=al;g.translate(0,H*.55);g.fillStyle=p.t===0?`rgba(${accRgb()},.85)`:"rgba(240,240,255,.85)";g.beginPath();g.moveTo(-20,-46);g.lineTo(W+20,-70);g.lineTo(W+20,10);g.lineTo(-20,34);g.closePath();g.fill();
    const sx=lerp(-200,W*.32,ease.out(Math.min(1,k/.25)));D.text(g,M.cut.name,sx,0,46,"#141217","left",800,false);D.small(g,`${p.name||ROLES[p.role].label} · ${M.teams[p.t].short}`,sx+4,22,13,"#141217");g.restore();}
  /* your spirit gauge */
  M.humans.forEach((h,i)=>{const x=i===0?14:W-184,y=78,s=M.spirit[h.t],full=s>=1;D.glass(g,x,y,170,40,.6);D.meter(g,x+10,y+26,150,8,s,full?"#ffd34d":acc());
    D.small(g,full?`★ ${SPECIAL[h.role].name.toUpperCase()} READY (${M.cfg.versus?(h.human.n===1?"R":"O"):"V"})`:`SPIRIT · ${SPECIAL[h.role].name}`,x+10,y+16,10,full?"#ffd34d":"rgba(255,255,255,.75)");
    const act=(h.thunder&&M.time<h.thunder)||(h.iron&&M.time<h.iron)||(h.tempo&&M.time<h.tempo);if(act)D.small(g,"ACTIVE",x+120,y+16,10,"#ffd34d");});
  /* controls on screen */
  if(!M.cfg.versus&&M.humans[0]){const h=M.humans[0],P=h.human.pad,air=h.a.air,srv=M.phase==="serve"&&M.sv.p===h,sv=M.sv;
    const acts=srv?[{a:"kind",label:sv.kind==="spin"?"SPIN":sv.kind==="float"?"FLOAT":"STAND",sub:"Q",dim:sv.phase!=="ready"},{a:"a",label:sv.phase==="ready"?"SERVE":sv.kind==="float"?(h.a.air?"LET GO":"HOLD"):h.a.air?"HIT":sv.kind==="spin"?"JUMP":"HIT",sub:"Space",big:true,hot:sv.phase==="toss"}]
      :air?[{a:"special",label:"★",sub:"V",dim:M.spirit[h.t]<1,hot:M.spirit[h.t]>=1},{a:"c",label:"TIP",sub:"C"},{a:"a",label:"SPIKE",sub:"Space",big:true}]
      :[{a:"special",label:"★",sub:"V",dim:M.spirit[h.t]<1,hot:M.spirit[h.t]>=1},{a:"c",label:ballOverhead(M,h)?"DUMP":"DIVE",sub:"C"},{a:"b",label:ballOverhead(M,h)?"SET":"BUMP",sub:"X",hot:M.plan&&M.plan.p===h},{a:"a",label:"JUMP",sub:"Space",big:true,hot:!!(M.attack&&M.attack.p===h)}];
    C.layout(P,W,H,acts);const R=P.btns[0].r;P.btns.push({a:"up",x:18+R*5.6,y:H-12-R*1.55,r:R*.62,label:"▲",fs:18},{a:"down",x:18+R*5.6,y:H-12-R*.5,r:R*.62,label:"▼",fs:18});C.drawPad(g,P,F.t);}}

/* ---------- training drills: the same engine, one skill at a time ---------- */
const DRILLS={recv:{name:"Receive",n:15,role:"WS",txt:"Their hitter attacks, you dig it up to your setter. Perfect 3, good 2, scramble 1. Leave the ones going out (+1)."},
  spike:{name:"Spike",n:15,role:"WS",txt:"Your setter sets you every tempo. Kill 3 (+1 perfect contact), dug 1. Read their block and defence."},
  serve:{name:"Serve",n:12,role:"WS",txt:"Twelve serves. Ace 3, tough serve 1. Try all three serves (Q switches)."},
  block:{name:"Block",n:15,role:"MB",txt:"You're at the net. Their setter sets, you jump with the hitter: stuff 3, touch 1."}};
function drillPoint(M){const d=M.cfg.drill,b=M.ball;M.drill=M.drill||{rep:0,score:0,n:DRILLS[d].n,log:[]};M.drill.rep++;
  if(d==="serve"){M.serveT=0;const me=M.humans[0];M.server=me;M.sv.p=me;me.goal=wx(0,10.4);M.teams[0].players.forEach(p=>{if(p!==me)p.goal=spot(p,"serve");});M.teams[1].players.forEach(p=>p.goal=spot(p,"recv"));M.tt=1;return;}
  /* a ball dropped into a setter's hands: theirs (they attack) or ours (we attack) */
  const T=d==="spike"?0:1;M.teams.forEach(Tm=>Tm.players.forEach(p=>{p.goal=spot(p,Tm.t===T?"off":"def");}));
  M.dstart=T;M.server=null;}
function drillLaunch(M){const T=M.dstart,se=M.teams[T].SE,b=M.ball;b.held=false;b.x=wx(T,1.0);b.y=3.4;b.vx=0;b.vy=.5;b.live=true;b.netDone=true;b.dip=0;
  M.phase="live";M.tt=T;M.tn=1;M.lastT=T;M.lastP=M.teams[T].MB;M.lastPassQ=rand(.62,.95);M.plan=null;M.lastTouchT=M.time;
  if(M.cfg.drill==="spike"){const me=M.humans[0];M.forceSet=me;}}
function drillEnd(M,pts,txt,sub){if(M.phase!=="live")return;M.phase="dead";M.pt=0;M.drill.score+=pts;M.drill.log.push(pts);M.say={txt:`${txt}${pts?" +"+pts:""}`,sub:sub||"",w:pts?0:1,t:0};SP.sfx(pts>=3?"kill":pts?"dig":"miss");M.replay=null;}

/* ---------- the runtime: canvas, loop, keys and touch ---------- */
const KEYS1={ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right",ArrowUp:"up",w:"up",ArrowDown:"down",s:"down"," ":"a",z:"a",j:"a",x:"b",k:"b",c:"c",l:"c",Shift:"c",v:"special",e:"special",q:"kind",Tab:"kind"};
const KEYSP1={a:"left",d:"right",w:"up",s:"down",f:"a",g:"b",h:"c",r:"special",q:"kind"};
const KEYSP2={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",k:"a",l:"b",";":"c",o:"special",i:"kind"};
let RT=null;
function runMatch(host,cfg,onEnd){stopRun();host.innerHTML=`<div class="spk-stage"><div class="spk-bar"><span class="spk-mode">${esc(cfg.label||"")}</span><span class="spk-sp"></span><button type="button" class="btn sm ghost" data-sk="pause">Pause</button><button type="button" class="btn sm ghost" data-sk="full">Full screen</button><button type="button" class="btn sm ghost" data-sk="quit">Quit</button></div>
    <p class="arcrot">Turn your phone sideways (or tap Full screen) for a bigger court.</p><div class="gstage spk-gs"><canvas id="spkCv" width="960" height="560" aria-label="Crow Spike match. ${cfg.versus?"Player 1: A D move, W S aim, F jump and spike, G bump and set, H dive and tip. Player 2: arrows, K, L and semicolon.":"Arrow keys move, Space jumps and spikes, X bumps and sets, C dives and tips, up and down aim, V special, Q switches serves."}"></canvas><div class="gover spk-over" hidden></div></div></div>`;
  const cv=host.querySelector("#spkCv"),st=A.stage(cv,W,H),F=A.fx(),over=host.querySelector(".spk-over");SP.F=F;SP.X={F};
  const pads=[C.pad(cfg.versus?KEYSP1:KEYS1),C.pad(KEYSP2)];cfg.pads=pads;const M=newMatch(cfg);SP.M=M;M.banner={txt:`${M.teams[0].short}  VS  ${M.teams[1].short}`,sub:cfg.sub||M.teams[1].trait,t:0};M.phase="intro";M.pt=0;
  let paused=false,done=false;const qa={ema:1/60,bad:0,good:0,age:0};SP.qtier=SP.qtier==null?3:SP.qtier;
  /* adaptive quality: if frames get slow, drop the costliest layers, then the resolution */
  const tier=k=>{SP.qtier=k;Object.assign(C.Q,{refl:k>=3?1:0,gloss:k>=3?1:0,shafts:k>=2?1:0,vig:k>=2?1:0,cel:k>=1?1:0,ghost:1,crowd:1,led:1,bg:1,floor:1});st.res(k>=1?st.full:Math.min(st.full,k>=0?1:.75));};tier(SP.qtier);
  const keymap=e=>{const k=e.key&&e.key.length===1?e.key.toLowerCase():e.key;return k;};
  const kd=e=>{if(!RT||RT.M!==M)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=keymap(e);
    if(M.phase==="replay"&&!e.repeat){M.replay=null;M.phase="dead";M.pt=Math.max(M.pt,1.6);e.preventDefault();return;}
    if(k==="Escape"||k==="p"){togglePause();e.preventDefault();return;}
    let used=false;pads.forEach((P,i)=>{if((i===0||cfg.versus)&&P.map[k]){C.keyDown(P,k,e);used=true;}});if(used||k===" "||k.startsWith("Arrow")||k==="Tab")e.preventDefault();};
  const ku=e=>{const k=keymap(e);pads.forEach(P=>C.keyUp(P,k));};
  const pd=e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(err){}if(M.phase==="replay"){M.replay=null;M.phase="dead";M.pt=Math.max(M.pt,1.6);return;}const [x,y]=st.pt(e);C.ptrDown(pads[0],x,y,e);};
  const pm=e=>{const [x,y]=st.pt(e);C.ptrMove(pads[0],x,y,e);},pu=e=>{C.ptrUp(pads[0],e);};
  const blur=()=>{pads.forEach(C.release);if(!done)togglePause(true);};
  window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);window.addEventListener("blur",blur);cv.addEventListener("pointerdown",pd);cv.addEventListener("pointermove",pm);cv.addEventListener("pointerup",pu);cv.addEventListener("pointercancel",pu);cv.addEventListener("contextmenu",e=>e.preventDefault());
  const togglePause=v=>{if(done)return;paused=v==null?!paused:v;pads.forEach(C.release);const b=host.querySelector('[data-sk="pause"]');if(b)b.textContent=paused?"Resume":"Pause";
    if(paused){over.hidden=false;over.innerHTML=`<div class="otag">Paused</div><div class="row"><button class="btn primary" type="button" data-sk="pause">Resume</button><button class="btn" type="button" data-sk="quit">Quit match</button></div><div class="octl">${cfg.versus?"<b>P1</b> A D move · W S aim · <b>F</b> jump/spike · <b>G</b> bump/set · <b>H</b> dive/tip · <b>R</b> special<br><b>P2</b> arrows · <b>K</b> jump/spike · <b>L</b> bump/set · <b>;</b> dive/tip · <b>O</b> special":CONTROLS}</div>`;}else{over.hidden=true;cv.focus({preventScroll:true});}};
  const hc=e=>{const b=e.target.closest("[data-sk]");if(!b)return;const k=b.dataset.sk;
    if(k==="pause")togglePause();else if(k==="quit"){done=true;stopRun();onEnd(null);}else if(k==="full"){const gs=host.querySelector(".gstage"),d=document;if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;}const rq=gs.requestFullscreen||gs.webkitRequestFullscreen;if(rq)Promise.resolve(rq.call(gs)).then(()=>{try{screen.orientation.lock("landscape").catch(()=>{});}catch(er){}}).catch(()=>{});}};host.addEventListener("click",hc);
  cv.tabIndex=0;setTimeout(()=>cv.focus({preventScroll:true}),50);
  const update=raw=>{const g=st.g;st.begin();A.ui=clamp(560/(cv.clientWidth||W),1,1.6);
    if(!paused&&!done){qa.age+=raw;if(!SP.noAdapt&&qa.age>2&&raw<.2){qa.ema+=(raw-qa.ema)*.06;if(qa.ema>1/40){qa.bad+=raw;if(qa.bad>1.5&&SP.qtier>-1){tier(SP.qtier-1);qa.bad=0;qa.ema=1/50;}}else qa.bad=Math.max(0,qa.bad-raw);}
      const gdt=F.step(raw);M.hype=Math.max(0,M.hype-raw*.5);if(M.banner){M.banner.t+=raw;if(M.banner.t>2.4)M.banner=null;}if(M.cut){M.cut.t+=raw;if(M.cut.t>1.4)M.cut=null;}if(M.say)M.say.t+=raw;
      if(M.phase==="intro"){M.pt+=raw;if(M.pt>2.2){startPoint(M);}}
      else if(M.phase==="replay"){const r=M.replay;r.t+=raw*.5;const i=Math.min(r.frames.length-1,Math.floor(r.t*60));applySnap(M,r.frames[i]);if(i>=r.frames.length-1){M.replay=null;M.phase="dead";M.pt=9;}}
      else{const n=Math.max(1,Math.ceil(gdt/SUB)),h=gdt/n;for(let i=0;i<n;i++)step(M,h);
        if(M.phase==="live"||M.phase==="serve")snap(M);
        if(M.phase==="pre"&&M.cfg.drill&&M.cfg.drill!=="serve"&&M.pt>1.0)drillLaunch(M);
        if(M.phase==="dead"){M.pt+=raw;
          if(M.replay&&M.pt>1.3&&M.phase==="dead"){M.phase="replay";M.replay.t=0;M.marks=[];M.teams.forEach(T=>T.players.forEach(p=>{p.a.ghosts=[];p.a.smear=0;p.a.hh=[];}));}
          else if(M.pt>(M.cfg.drill?1.2:1.7)){if(M.cfg.drill){if(M.drill.rep>=M.drill.n){M.phase="over";M.winner=0;}else startPoint(M);}else if(!checkSetEnd(M))startPoint(M);}}
        if(M.phase==="over"&&!done){done=true;M.say=null;setTimeout(()=>{if(RT&&RT.M===M){showResult();}},1600);}}
      const fxOn=!A.K.reduced();
      M.teams.forEach(T=>T.players.forEach(p=>{const a=p.a;a.look=M.phase==="dead"||M.phase==="over"||M.phase==="intro"?null:[M.ball.x,M.ball.y];a.fx=fxOn;
        const sp=(p.thunder&&M.time<p.thunder)||(p.iron&&M.time<p.iron)||(p.tempo&&M.time<p.tempo);a.glow=damp(a.glow||0,fxOn?(sp?1:p.fire?.45:0):0,6,raw);a.glowCol=sp?(p.t===0?acc():"#9fd0ff"):"#ff7a1a";
        if(a.followAt&&M.time>a.followAt){a.followAt=0;if(a.air&&!p.script)C.pose(a,"follow",26);}a.ghostCol=p.t===0?acc():"#cfe3ff";
        if(M.phase!=="replay"){C.animate(a,gdt);if(fxOn&&a.step&&Math.abs(a.vx)>4.2)C.dust(SP.X,M.cam,a.x,2);if(fxOn&&p.dive>.05&&p.dive<.5&&!a.air&&Math.random()<.5)C.dust(SP.X,M.cam,a.x,2);}}));
      if(M.phase!=="replay")C.ballFx(M.ball,gdt);
      stepFx(M,raw*(gdt>0?Math.min(1,gdt/raw+.25):.25));if(M.rip){M.rip.t+=gdt;if(M.rip.t>1.2)M.rip=null;}if(M.fxl){M.fxl.t+=raw;if(M.fxl.t>.5)M.fxl=null;}if(M.impact){M.impact.t+=raw;if(M.impact.t>M.impact.d)M.impact=null;}
      director(M,raw);}
    const [ox,oy]=A.K.reduced()?[0,0]:F.offset();g.save();g.translate(ox,oy);drawMatch(g,M);F.draw(g,W,H);g.restore();hud(g,M);};
  const showResult=()=>{const res=summarize(M);onEnd(res);};
  RT={M,update,stop(){host.removeEventListener("click",hc);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);window.removeEventListener("blur",blur);}};}
function stopRun(){if(RT){RT.stop();RT=null;}}
const CONTROLS="<b>← →</b> move · <b>Space</b> jump, then <b>Space</b> again to spike (hold <b>↑</b> deep, <b>↓</b> sharp) · <b>X</b> bump, or set when the ball is over your head (<b>↑ X</b> quick, <b>↓ X</b> pipe) · <b>C</b> dive, tip in the air (<b>↑ C</b> roll), dump over your head · <b>V</b> special · serving: <b>↑ ↓</b> aim, <b>Q</b> serve type";
/* what happened in the match */
function summarize(M){const me=M.humans[0],T0=M.teams[0],T1=M.teams[1];const tot=T=>T.players.reduce((s,p)=>{Object.keys(p.stats).forEach(k=>s[k]=(s[k]||0)+p.stats[k]);return s;},{});
  const all=[...T0.players,...T1.players],mvp=all.slice().sort((a,b)=>(b.stats.pts*2+b.stats.digs*.5+b.stats.assists*.6+b.stats.perfect*.5)-(a.stats.pts*2+a.stats.digs*.5+a.stats.assists*.6+a.stats.perfect*.5))[0];
  return {M,win:M.winner===0,score:M.setLog||[M.score],me:me.stats,t0:tot(T0),t1:tot(T1),mvp,drill:M.drill||null,cfg:M.cfg};}

/* ---------- the hub ---------- */
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const STORY=[
  {r:"rams",pts:11,lines:[["Coach","First practice match of the season. Granite Hill are where you were last year. Show them how far you've come."],["Sora","Call for the ball. I'll find you."]]},
  {r:"herons",pts:11,lines:[["Taiga","The Herons run everything fast. If we block late, we're dead."],["Coach","Read their setter's hands. And dig the tips: they love the short ball."]]},
  {r:"wolves",pts:11,lines:[["Sora","Northgate's serves are heavy. Stand a step deeper and pass high."],["Coach","A good pass and Sora can set anything. Win the first touch."]]},
  {r:"sharks",pts:11,lines:[["Taiga","Their middle is two metres tall. Hitting straight into him is a gift."],["Coach","Go deep off his hands, or tip it over. Make him jump for nothing."]]},
  {r:"lynx",pts:11,lines:[["Sora","Their libero digs everything. Rallies will be long."],["Coach","Long rallies are won with patience. Hit where she isn't, not as hard as you can."]]},
  {r:"eagles",pts:11,lines:[["Taiga","Their ace hits 120. I've watched the film three times."],["Coach","Their best hitter will score. Get a hand on him and we'll get the next one."]]},
  {r:"storm",pts:15,lines:[["Coach","Sendai play fast and their setter dumps. Middle: don't fall asleep on two."],["Sora","If they're quick, we'll be quicker."]]},
  {r:"hussars",pts:15,lines:[["Taiga","The Iron Wall of Krakow. Nobody gets through them."],["Coach","Then don't go through. Go off them, over them, around them."]]},
  {r:"hawks",pts:15,lines:[["Sora","Belo Horizonte serve rockets and floats that dance."],["Coach","Semi-final. Breathe, pass, and trust the crow next to you."]]},
  {r:"titans",pts:11,sets:3,lines:[["Coach","The Spring Cup final. Shiratori haven't lost in two years."],["Taiga","Then today's the day."],["Sora","Fly."]]}];
const DIFFS={rookie:"Rookie",varsity:"Varsity",national:"National"};
function sk(K){const c=K.C();c.spike=c.spike&&typeof c.spike==="object"?c.spike:{};const s=c.spike;s.story=s.story|0;s.stars=s.stars||{};s.lv=s.lv||{};["WS","MB","SE"].forEach(r=>{s.lv[r]=s.lv[r]||{};STATS.forEach(([k])=>{s.lv[r][k]=clamp(s.lv[r][k]||OURS[r].st[k],1,10);});});
  s.role=s.role||"WS";s.diff=s.diff||"varsity";s.career=s.career||{};s.wins=s.wins|0;s.losses=s.losses|0;s.trophies=s.trophies|0;s.drills=s.drills||{};s.matches=s.matches|0;s.versus=s.versus|0;return s;}
function ourPlayers(K,role){const s=sk(K),me=K.ME(),pr=VB.state.profile||{};const out={};["WS","MB","SE"].forEach(r=>{const base=OURS[r];out[r]={name:base.name||"Ren",num:base.num,h:base.h,st:Object.assign({},s.lv[r])};});
  out[role].name=(pr.name||me.name||"You").split(/\s+/)[0];if(pr.number!=null)out[role].num=String(pr.number);if(role!=="WS")out.WS.name="Ren";return out;}
const rival=id=>RIVALS.find(r=>r.id===id)||RIVALS[0];
SP.mount=(P,K)=>{SP.K=K;let view="home",tour=null;
  const c=()=>K.C(),S=()=>sk(K);
  const go=v=>{view=v;draw();};
  function draw(){stopRun();const s=S();
    if(view==="home"){const ch=Math.min(s.story,STORY.length-1);P.innerHTML=`<div class="spk">
      <div class="spk-hero"><div><div class="kicker">Crow's Nest · the game</div><h3>Crow Spike</h3><p class="small muted">3 against 3, side-on, every touch yours to win. Receive, set, spike, block and serve against ten rival schools on the road to the Spring Cup.</p></div>
        <div class="spk-rec"><div><b>${s.wins}</b><span>Wins</span></div><div><b>${s.story}/${STORY.length}</b><span>Story</span></div><div><b>${s.trophies}</b><span>Trophies</span></div><div><b>${(s.career.top|0)||"–"}</b><span>Top km/h</span></div></div></div>
      <div class="spk-modes">
        <button type="button" class="spk-m big" data-sgo="story"><span class="kicker">Story</span><b>${s.story>=STORY.length?"Spring Cup champions":"Chapter "+(ch+1)+": vs "+esc(rival(STORY[ch].r).name)}</b><span>Ten chapters, ten rivals, one cup.</span></button>
        <button type="button" class="spk-m" data-sgo="quick"><span class="kicker">Quick match</span><b>Pick a rival</b><span>Points, sets, difficulty: your call.</span></button>
        <button type="button" class="spk-m" data-sgo="tour"><span class="kicker">Tournament</span><b>${s.tourNow?"Continue your run":"Eight-team knockout"}</b><span>Three wins to lift a trophy.</span></button>
        <button type="button" class="spk-m" data-sgo="train"><span class="kicker">Training</span><b>Four drills</b><span>Receive, spike, serve and block on their own.</span></button>
        <button type="button" class="spk-m" data-sgo="versus"><span class="kicker">2 players</span><b>Versus</b><span>One keyboard, two aces.</span></button>
        <button type="button" class="spk-m wide" data-sgo="team"><span class="kicker">Your team</span><b>Upgrade and pick your role</b><span>You have <b>${c().feathers}</b> feathers to spend.</span></button></div>
      <details class="spk-how"><summary>How to play</summary><div class="octl">${CONTROLS}</div><ul class="small"><li><b>Receive</b>: get behind the ball and press X a moment before it arrives: centred and on time is a Perfect.</li><li><b>Spike</b>: when the setter sets you, run in, jump (Space) and swing (Space) as the ball reaches your hand. Look at their block: tip or go deep over a big one, hit sharp past a late one.</li><li><b>Block</b>: near the net, Space jumps with your hands up. Hold it to go higher.</li><li><b>Set</b>: when the ball comes over your head, X sets your wing spiker, ↑ X the quick, ↓ X a pipe, C dumps it over.</li><li><b>Serve</b>: Q picks standing, jump float or jump spin; ↑ ↓ aim; Space tosses and hits (float: hold, let go to hit).</li><li><b>Spirit</b>: good plays fill it. Full, press V for your role's special: Thunder Spike, Iron Wall or Tempo Toss.</li></ul></details></div>`;}
    else if(view==="story"){P.innerHTML=`<div class="spk"><div class="spk-top"><button class="btn sm ghost" data-sgo="home">← Back</button><div class="kicker">Story · Road to the Spring Cup</div></div>
      <ol class="spk-ch">${STORY.map((st,i)=>{const R=rival(st.r),won=i<s.story,next=i===s.story,stars=s.stars[st.r]|0;return `<li class="${won?"won":next?"next":"locked"}"><span class="spk-chn">${i+1}</span><div><b>vs ${esc(R.name)}</b><span>${esc(R.trait)} · to ${st.pts}${st.sets?`, best of ${st.sets}`:""}</span></div><span class="spk-st">${"★".repeat(stars)}${"☆".repeat(3-stars)}</span>${won||next?`<button class="btn sm ${next?"primary":""}" data-sstory="${i}">${won?"Replay":"Play"}</button>`:`<span class="small muted">Locked</span>`}</li>`;}).join("")}</ol>
      <p class="small muted">Stars: 1 for a win, 2 for winning by 4 or more, 3 for doing it on National.</p>${setupBits(s,true)}</div>`;}
    else if(view==="quick"){const pool=RIVALS.filter((r,i)=>i<=Math.max(2,s.story+1));P.innerHTML=`<div class="spk"><div class="spk-top"><button class="btn sm ghost" data-sgo="home">← Back</button><div class="kicker">Quick match</div></div>
      <div class="spk-pick">${pool.map((r,i)=>`<label class="spk-opp"><input type="radio" name="spkOpp" value="${r.id}" ${i===0?"checked":""}><span class="spk-sw" style="--c:${r.col}"></span><b>${esc(r.name)}</b><small>${esc(r.trait)} · ${"●".repeat(Math.round(r.lv/2))}</small></label>`).join("")}</div>
      <div class="spk-opts"><label>Points <select id="spkPts"><option selected>11</option><option>15</option><option>21</option><option>25</option></select></label><label>Sets <select id="spkSets"><option value="1">1</option><option value="3">Best of 3</option></select></label></div>
      ${setupBits(s)}<button class="btn primary" data-splay="quick">Play</button><p class="small muted">Win more story chapters to unlock more rivals.</p></div>`;}
    else if(view==="tour"){tour=s.tourNow||null;P.innerHTML=`<div class="spk"><div class="spk-top"><button class="btn sm ghost" data-sgo="home">← Back</button><div class="kicker">Tournament</div></div>${tour?bracket(tour):`<p>Eight teams, three knockout rounds to 15. Win them all for a trophy (+120 feathers).</p>${setupBits(s)}<button class="btn primary" data-stour="new">Draw the bracket</button>`}</div>`;}
    else if(view==="train"){P.innerHTML=`<div class="spk"><div class="spk-top"><button class="btn sm ghost" data-sgo="home">← Back</button><div class="kicker">Training</div></div><div class="spk-modes">${Object.entries(DRILLS).map(([k,d])=>`<button type="button" class="spk-m" data-sdrill="${k}"><span class="kicker">${d.n} balls · best ${s.drills[k]|0}</span><b>${d.name}</b><span>${esc(d.txt)}</span></button>`).join("")}</div>${setupBits(s,false,true)}</div>`;}
    else if(view==="versus"){P.innerHTML=`<div class="spk"><div class="spk-top"><button class="btn sm ghost" data-sgo="home">← Back</button><div class="kicker">2 players · one keyboard</div></div>
      <div class="spk-vs"><div><b>Player 1 · Crows (left)</b><div class="octl"><b>A</b> <b>D</b> move · <b>W</b> <b>S</b> aim · <b>F</b> jump, spike, serve · <b>G</b> bump, set · <b>H</b> dive, tip · <b>R</b> special · <b>Q</b> serve type</div></div><div><b>Player 2 · rivals (right)</b><div class="octl"><b>← →</b> move · <b>↑ ↓</b> aim · <b>K</b> jump, spike, serve · <b>L</b> bump, set · <b>;</b> dive, tip · <b>O</b> special · <b>I</b> serve type</div></div></div>
      <div class="spk-opts"><label>Player 2 plays as <select id="spkVsT">${RIVALS.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join("")}</select></label><label>Points <select id="spkPts"><option>11</option><option selected>15</option><option>21</option></select></label></div>
      <button class="btn primary" data-splay="versus">Play</button><p class="small muted">Both players are wing spikers; the AI plays the setters and middles. Needs a keyboard.</p></div>`;}
    else if(view==="team"){const lv=s.lv;P.innerHTML=`<div class="spk"><div class="spk-top"><button class="btn sm ghost" data-sgo="home">← Back</button><div class="kicker">Your team · ${c().feathers} feathers</div></div>
      <div class="spk-team">${["WS","MB","SE"].map(r=>{const pl=ourPlayers(K,s.role)[r];return `<div class="spk-card ${s.role===r?"you":""}"><div class="row" style="justify-content:space-between"><div><span class="kicker">${ROLES[r].label}${s.role===r?" · you":""}</span><b class="spk-nm">${esc(pl.name)} <small>#${esc(pl.num)}</small></b></div>${s.role===r?"":`<button class="btn sm" data-srole="${r}">Play as</button>`}</div><p class="small muted">${esc(ROLES[r].job)} Special: <b>${SPECIAL[r].name}</b>.</p>
        ${STATS.map(([k,l,d])=>{const v=lv[r][k],cost=upCost(v);return `<div class="spk-stat"><span title="${esc(d)}">${l}</span><span class="spk-bar"><i style="width:${v*10}%"></i></span><b>${v}</b>${v<10?`<button class="btn sm" data-sup="${r}:${k}" ${c().feathers<cost?"disabled":""}>+ ${cost}</button>`:`<small>MAX</small>`}</div>`;}).join("")}</div>`;}).join("")}</div>
      <p class="small muted">Feathers come from matches, the quiz, the camp, badges and the season. Upgrades are for good.</p></div>`;}}
  const upCost=v=>15+v*15;
  function setupBits(s,story,drill){return `<div class="spk-opts">${drill?"":`<label>You play <select id="spkRole">${Object.entries(ROLES).map(([k,r])=>`<option value="${k}" ${s.role===k?"selected":""}>${r.label}</option>`).join("")}</select></label>`}<label>Difficulty <select id="spkDiff">${Object.entries(DIFFS).map(([k,l])=>`<option value="${k}" ${s.diff===k?"selected":""}>${l}</option>`).join("")}</select></label></div>`;}
  function readSetup(){const s=S(),r=P.querySelector("#spkRole"),d=P.querySelector("#spkDiff");if(r)s.role=r.value;if(d)s.diff=d.value;K.save();return s;}
  function bracket(t){const name=id=>id==="us"?"Crows (you)":rival(id).name;const rounds=["Quarter-finals","Semi-finals","Final"];
    return `<div class="spk-br">${t.rounds.map((rd,i)=>`<div class="spk-rd"><span class="kicker">${rounds[i]}</span>${rd.map(m=>`<div class="spk-mt ${m.w?"done":""}"><span class="${m.w===m.a?"w":""}">${esc(name(m.a))}</span><span class="${m.w===m.b?"w":""}">${esc(name(m.b))}</span></div>`).join("")}</div>`).join("")}</div>
      ${t.out?`<p><b>Knocked out.</b> ${esc(t.out)}</p><button class="btn primary" data-stour="end">Finish</button>`:t.champ?`<p class="spk-champ">🏆 Tournament champions!</p><button class="btn primary" data-stour="end">Lift the trophy</button>`:`<button class="btn primary" data-stour="play">Play the ${rounds[t.round].toLowerCase().replace(/s$/,"")}: vs ${esc(name(nextOpp(t)))}</button>`}`;}
  const nextOpp=t=>{const m=t.rounds[t.round].find(x=>x.a==="us"||x.b==="us");return m.a==="us"?m.b:m.a;};
  function newTour(){const s=S(),pool=RIVALS.map(r=>r.id).filter((id,i)=>i<=Math.max(4,s.story+2));const picks=pool.sort(()=>Math.random()-.5).slice(0,7);const ids=["us",...picks].sort(()=>Math.random()-.5);
    const r0=[];for(let i=0;i<8;i+=2)r0.push({a:ids[i],b:ids[i+1]});s.tourNow={rounds:[r0],round:0};K.save();}
  function simOthers(t){const rd=t.rounds[t.round];rd.forEach(m=>{if(m.w||m.a==="us"||m.b==="us")return;const la=rival(m.a).lv,lb=rival(m.b).lv;m.w=Math.random()<la/(la+lb)?m.a:m.b;});}
  function advanceTour(t){const rd=t.rounds[t.round];if(rd.length===1){t.champ=true;return;}const ws=rd.map(m=>m.w),nx=[];for(let i=0;i<ws.length;i+=2)nx.push({a:ws[i],b:ws[i+1]});t.rounds.push(nx);t.round++;}
  /* start a match */
  function play(cfg){const s=readSetup();cfg=Object.assign({diff:s.diff,role:s.role,pts:15,sets:1},cfg);const R=cfg.opp;cfg.ours=ourPlayers(K,cfg.role);cfg.oppPlayers=rivalPlayers(R);view="match";
    runMatch(P,cfg,res=>{if(!res){go(cfg.back||"home");return;}finish(cfg,res);});}
  function finish(cfg,res){stopRun();const s=S(),C2=c(),me=res.me,M=res.M;let fe=0,head,sub="",extra="";
    if(cfg.drill){const sc=res.drill.score,nb=sc>(s.drills[cfg.drill]|0);if(nb)s.drills[cfg.drill]=sc;const th={recv:[15,28,38],spike:[15,30,42],serve:[10,20,28],block:[12,25,36]}[cfg.drill],ds=th.filter(x=>sc>=x).length;C2.stars=C2.stars||{};C2.stars.drill=C2.stars.drill||{};C2.stars.drill[cfg.drill]=Math.max(C2.stars.drill[cfg.drill]|0,ds);fe=Math.round(sc/2);head=`${sc} points`;sub=`${DRILLS[cfg.drill].name} drill${nb?" · new best":""}`;}
    else{const win=res.win;s.matches++;if(!cfg.versus){if(win)s.wins++;else s.losses++;}else s.versus++;
      const car=s.career;["kills","aces","blocks","digs","perfect","assists","tools","tips","pts","specials","dumps"].forEach(k=>{car[k]=(car[k]|0)+(me[k]|0);});car.top=Math.max(car.top|0,me.top|0);s.bestKills=Math.max(s.bestKills|0,me.kills|0);
      if(win&&!cfg.versus){s.roleWins=s.roleWins||{};s.roleWins[cfg.role]=(s.roleWins[cfg.role]|0)+1;if(cfg.diff==="national")s.natWins=(s.natWins|0)+1;}
      const sets=res.score.map(x=>x.join("–")).join(", ");head=cfg.versus?(win?"Player 1 wins":"Player 2 wins"):win?"Victory!":"Defeat";sub=`${M.teams[0].short} vs ${M.teams[1].short} · ${sets}`;
      const dm=cfg.diff==="national"?1.5:cfg.diff==="rookie"?.7:1;fe=Math.round(((win?20:6)+(me.pts|0))*dm);
      if(cfg.story!=null&&win){const i=cfg.story,last=res.score[res.score.length-1],margin=Math.abs(last[0]-last[1]),stars=1+(margin>=4?1:0)+(cfg.diff==="national"?1:0),key=STORY[i].r;
        if(i===s.story){s.story++;fe+=40+i*12;extra=s.story>=STORY.length?"Spring Cup champions! The whole story is yours.":`Chapter ${i+2} unlocked: vs ${rival(STORY[i+1].r).name}.`;}
        s.stars[key]=Math.max(s.stars[key]|0,stars);C2.stars=C2.stars||{};C2.stars.spike=C2.stars.spike||{};C2.stars.spike[key]=s.stars[key];}
      if(cfg.tour&&s.tourNow){const t=s.tourNow,m=t.rounds[t.round].find(x=>x.a==="us"||x.b==="us");if(win){m.w="us";simOthers(t);advanceTour(t);fe+=20;if(t.champ){s.trophies++;fe+=120;extra="Tournament champions!";}}else{m.w=m.a==="us"?m.b:m.a;t.out=`${rival(m.w).name} beat you in the ${["quarter-finals","semi-finals","final"][t.round]}.`;}}}
    K.award(fe);C2.games++;K.save();K.checkBadges();K.refreshStats();
    const st=me,T0=res.t0,T1=res.t1,mv=res.mvp;
    P.innerHTML=`<div class="spk spk-res"><div class="kicker">${esc(cfg.label||"Match")}</div><h3 class="${res.win||cfg.drill?"win":"loss"}">${esc(head)}</h3><p>${esc(sub)}</p>${extra?`<p class="spk-champ">${esc(extra)}</p>`:""}
      ${cfg.drill?`<div class="spk-drl">${res.drill.log.map(v=>`<i class="d${v}">${v}</i>`).join("")}</div>`:`<table class="spk-tbl"><thead><tr><th></th><th>Kills</th><th>Aces</th><th>Blocks</th><th>Digs</th><th>Errors</th></tr></thead><tbody>
        <tr><td>${esc(M.teams[0].short)}</td><td>${T0.kills|0}</td><td>${T0.aces|0}</td><td>${T0.blocks|0}</td><td>${T0.digs|0}</td><td>${(T0.err|0)+(T0.srvErr|0)}</td></tr>
        <tr><td>${esc(M.teams[1].short)}</td><td>${T1.kills|0}</td><td>${T1.aces|0}</td><td>${T1.blocks|0}</td><td>${T1.digs|0}</td><td>${(T1.err|0)+(T1.srvErr|0)}</td></tr></tbody></table>
      <div class="spk-rec"><div><b>${st.pts|0}</b><span>Your points</span></div><div><b>${st.kills|0}</b><span>Kills</span></div><div><b>${st.digs|0}</b><span>Digs</span></div><div><b>${st.perfect|0}</b><span>Perfect</span></div><div><b>${st.top|0}</b><span>Top km/h</span></div></div>
      <p class="small">MVP: <b>${esc(mv.name||ROLES[mv.role].label)}</b> (${esc(M.teams[mv.t].short)}) · ${mv.stats.pts} points, ${mv.stats.digs} digs</p>`}
      <p class="spk-fe">+${fe} feathers</p><div class="row"><button class="btn primary" data-sagain="1">${cfg.tour&&S().tourNow&&!S().tourNow.out&&!S().tourNow.champ?"Next round":"Play again"}</button><button class="btn" data-sgo="${cfg.back||"home"}">Back</button></div></div>`;
    P._again=()=>{if(cfg.tour){go("tour");return;}if(cfg.story!=null&&res.win&&S().story<STORY.length){startStory(S().story);return;}play(Object.assign({},cfg,{pads:null}));};
    SP.sfx(res.win?"unlock":"miss");}
  function startStory(i){const st=STORY[i],R=rival(st.r);view="dialog";P.innerHTML=`<div class="spk spk-dlg"><div class="kicker">Chapter ${i+1} · vs ${esc(R.name)}</div><h3>${esc(R.name)}</h3><p class="small muted">${esc(R.trait)}</p>
    <div class="spk-lines">${st.lines.map(([who,t],k)=>`<p style="--k:${k}"><b>${esc(who)}</b> ${esc(t)}</p>`).join("")}</div>${setupBits(S(),true)}<div class="row"><button class="btn primary" data-sstory-go="${i}">Play</button><button class="btn" data-sgo="story">Back</button></div></div>`;}
  P.onclick=e=>{const b=e.target.closest("button,[data-sgo]");if(!b||!P.contains(b))return;const d=b.dataset;
    if(d.sgo){go(d.sgo);return;}
    if(d.sstory!=null){startStory(+d.sstory);return;}
    if(d.sstoryGo!=null){const i=+d.sstoryGo,st=STORY[i];play({opp:rival(st.r),pts:st.pts,sets:st.sets||1,story:i,back:"story",label:`Story · Chapter ${i+1}`,sub:rival(st.r).trait});return;}
    if(d.splay==="quick"){const id=(P.querySelector('input[name="spkOpp"]:checked')||{}).value||"rams";play({opp:rival(id),pts:+P.querySelector("#spkPts").value,sets:+P.querySelector("#spkSets").value,back:"quick",label:"Quick match"});return;}
    if(d.splay==="versus"){const R=rival(P.querySelector("#spkVsT").value);play({opp:R,pts:+P.querySelector("#spkPts").value,versus:true,role:"WS",role2:"WS",diff:"varsity",back:"versus",label:"Versus"});return;}
    if(d.sdrill){const dr=DRILLS[d.sdrill];const s=readSetup();play({opp:rival("wolves"),drill:d.sdrill,role:dr.role,pts:99,back:"train",label:`Training · ${dr.name}`,sub:dr.txt});return;}
    if(d.stour==="new"){readSetup();newTour();go("tour");return;}
    if(d.stour==="play"){const t=S().tourNow;play({opp:rival(nextOpp(t)),pts:15,tour:true,back:"tour",label:`Tournament · ${["Quarter-final","Semi-final","Final"][t.round]}`});return;}
    if(d.stour==="end"){S().tourNow=null;K.save();go("home");return;}
    if(d.srole){S().role=d.srole;K.save();draw();return;}
    if(d.sup){const [r,k]=d.sup.split(":"),s=S(),v=s.lv[r][k],cost=upCost(v),cc=c();if(v<10&&cc.feathers>=cost){cc.feathers-=cost;s.lv[r][k]=v+1;K.save();K.refreshStats();SP.sfx("coin");draw();}return;}
    if(d.sagain){P._again&&P._again();return;}};
  draw();
  return {update(dt){if(RT)RT.update(dt);},stop(){stopRun();P.onclick=null;}};};
SP.sfx=(k,a)=>{try{SP.K&&SP.K.sfx(k,a);}catch(e){}};
SP.rec=()=>{};
SP.STORY=STORY;SP.RIVALS=RIVALS;SP.sk=K=>sk(K);
/* for tests: run a match with no screen */
SP.newMatch=newMatch;SP.startPoint=startPoint;SP.step=step;
})();
