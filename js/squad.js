/* squad.js: account, friends, comparison, sharing and joint session planning. Shared data lives in db under players/<id>. */
(function(){
"use strict";
const VB=window.VB,esc=VB.esc,$=(s,r=document)=>r.querySelector(s);
const DRS=window.VB_DRILLS||[];
/* position compatibility: [score 1-5, why, skills to train together] */
const CP={
 "outside|setter":[5,"Setter and pin hitter: the connection every offence is built on.",["set","attack","transition"]],
 "opposite|setter":[5,"Back sets and right-side tempo only come from reps together.",["set","attack","block"]],
 "middle|setter":[5,"Quick-attack timing takes hundreds of touches with the same setter.",["set","attack","block"]],
 "libero|setter":[4,"The libero passes, the setter runs the second ball, and you trade out-of-system sets.",["pass","set","dig"]],
 "setter|setter":[3,"Set to each other, compare hand contact and run setter footwork.",["set","serve"]],
 "outside|outside":[3,"Serve and pass at each other, then hit against each other's block.",["pass","serve","attack"]],
 "opposite|outside":[3,"Pin hitters: attack against each other's block and trade tough serves.",["attack","block","serve"]],
 "middle|outside":[4,"Close the double block together and duel hitter against blocker.",["block","attack","transition"]],
 "libero|outside":[4,"Serve-receive partners: seams, calls and passing volume.",["pass","dig","serve"]],
 "opposite|opposite":[3,"Right-side attack and block duels.",["attack","block","serve"]],
 "middle|opposite":[4,"Right-side double block and hitter-blocker duels.",["block","attack","transition"]],
 "libero|opposite":[3,"Hard attacks for the libero to dig, controlled balls back for the hitter.",["dig","attack","serve"]],
 "middle|middle":[3,"Mirror blocking footwork and quick-attack reps off a toss.",["block","attack"]],
 "libero|middle":[3,"You swap on court, so train serve against dig and block against cover.",["dig","serve","block"]],
 "libero|libero":[4,"Pepper, serve receive and digging at full volume.",["pass","dig"]]};
const GENERIC=[3,"All-round partners: pass, set and serve to each other.",["pass","set","serve"]];
VB.compat=function(a,b){if(!a||!b||a==="any"||b==="any")return GENERIC;return CP[[a,b].sort().join("|")]||GENERIC;};
VB.groupCompat=function(pos){const pairs=[];for(let i=0;i<pos.length;i++)for(let j=i+1;j<pos.length;j++)pairs.push(VB.compat(pos[i],pos[j]));
  if(!pairs.length)return {score:0,why:"Invite at least one friend.",skills:[],notes:[]};
  const score=Math.round(pairs.reduce((a,p)=>a+p[0],0)/pairs.length*10)/10,cnt={};pairs.forEach(p=>p[2].forEach(s=>cnt[s]=(cnt[s]||0)+p[0]));
  const skills=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,4),has=p=>pos.includes(p),hit=has("outside")||has("opposite")||has("middle"),notes=[];
  if(has("setter")&&hit&&(has("libero")||has("outside")))notes.push("You have a passer, a setter and a hitter: run full pass-set-hit sequences.");
  else if(has("setter")&&hit)notes.push("Setter plus hitter: run set-and-hit reps off a toss or a free ball.");
  if(!has("setter")&&pos.length>=3)notes.push("No setter in the group: rotate who sets so everyone hits a live ball.");
  if(pos.filter(p=>p==="middle"||p==="outside"||p==="opposite").length>=2)notes.push("Two front-row players: add double-block footwork.");
  if(has("libero")&&hit)notes.push("Hitter against libero: live digging at game speed.");
  return {score,why:pairs.slice().sort((a,b)=>b[0]-a[0])[0][1],skills,notes};};
function suggestDrills(skills,n,lvl){const cat=n<=1?0:n===2?1:n<=5?2:3;
  return DRS.filter(d=>skills.includes(d.skill)&&VB.PLAYERS[d.players]<=cat&&VB.PLAYERS[d.players]>=Math.min(cat,1)&&(VB.TIER[d.tier]||0)<=2)
    .sort((a,b)=>(VB.PLAYERS[b.players]-VB.PLAYERS[a.players])||Math.abs(a.level-lvl)-Math.abs(b.level-lvl)||skills.indexOf(a.skill)-skills.indexOf(b.skill)).slice(0,6);}

VB.squad=(function(){
  let tab="teams",selTeam=null,rot=1,thread=null,draft="",teamDraft=null,root,players={},profs={},me=null,status="wait",pushT=0,lastPush="",metric="vert",pick={friends:[],drills:null},filter="",medias={},mediaPushed=0,mediaAts={},rT=0;
  const soc=()=>{const s=VB.state;if(!s.social||typeof s.social!=="object")s.social={};const o=s.social;o.friends=o.friends||[];o.shares=o.shares||[];o.meets=o.meets||[];o.rsvp=o.rsvp||{};o.teams=o.teams||[];o.msgs=o.msgs||[];o.seen=o.seen||{};return o;};
  const uid=()=>VB.net&&VB.net.uid;
  const POSL=p=>(VB.POS[p]||VB.POS.any).label;
  function stats(){const st=VB.state,from=VB.addDays(VB.today(),-28),T=st.tests.filter(t=>t.kind==="vert").sort((a,b)=>a.date<b.date?-1:1);let n=0,m=0;
    st.sessions.forEach(s=>{if(s.date>=from&&!s.ex){n++;m+=s.mins||0;}});const lv={};Object.entries(st.drill).forEach(([k,v])=>{if(v&&v.lvl)lv[k]=v.lvl;});
    return {vert:T.length?Math.round(T[T.length-1].cm*10)/10:null,best:T.length?Math.round(Math.max(...T.map(t=>t.cm))*10)/10:null,sess28:n,min28:m,streak:VB.streak(),lv,fixed:Object.values(st.faults).filter(f=>f&&!f.open).length,prog:VB.activeProgram().def.name};}
  function card(){const p=VB.state.profile||{},o=soc();return {v:1,mediaAt:(VB.media&&(VB.media.pfp||VB.media.bg))?VB.media.at:0,nick:(p.name||"").slice(0,40),number:p.number==null?null:p.number,pos:p.pos||"any",exp:p.exp||"",look:p.look||null,hand:p.hand||"right",stats:stats(),friends:o.friends.slice(0,200),shares:o.shares.slice(0,20),meets:o.meets.slice(0,20),rsvp:o.rsvp,teams:o.teams.slice(0,6),msgs:o.msgs.slice(0,80)};}
  function push(){if(!VB.net||!soc().joined)return;const c=card(),j=JSON.stringify(c);if(j===lastPush)return;lastPush=j;c.at=Date.now();
    VB.net.db.doc("players/"+uid()).set(c).catch(e=>{if(e&&e.code==="invalid_argument"){status="readonly";render();}});
    const M=VB.media||{};if((M.at||0)>mediaPushed){mediaPushed=M.at||0;VB.net.db.doc("players/"+uid()+"/media/img").set({pfp:M.pfp||null,bg:M.bg||null,accent:M.accent||null,at:M.at||0}).catch(()=>{mediaPushed=0;});}}
  function schedule(){clearTimeout(pushT);pushT=setTimeout(push,1200);}
  const nameOf=id=>{const c=players[id]||{},n=c.nick||(profs[id]&&profs[id].name)||"Player";return n+(c.number!=null?" · "+c.number:"");};
  function want(id){if(id in medias||!VB.mediaOf)return;medias[id]=null;VB.mediaOf(id).then(m=>{medias[id]=m||{};clearTimeout(rT);rT=setTimeout(render,120);});}
  const avatar=id=>{want(id);const m=medias[id];if(m&&m.pfp)return `<img class="av" src="${m.pfp}" alt="">`;return profs[id]&&profs[id].avatarUrl?`<img class="av" src="${esc(profs[id].avatarUrl)}" alt="">`:`<span class="av"></span>`;};
  const friendsOf=id=>(players[id]&&players[id].friends)||[];
  function rel(){const o=soc(),u=uid(),mutual=o.friends.filter(f=>players[f]&&friendsOf(f).includes(u));
    return {mutual,out:o.friends.filter(f=>!mutual.includes(f)),inc:Object.keys(players).filter(id=>id!==u&&friendsOf(id).includes(u)&&!o.friends.includes(id)),others:Object.keys(players).filter(id=>id!==u&&!o.friends.includes(id)&&!friendsOf(id).includes(u))};}
  async function connect(){if(!VB.net){status="off";render();return;}
    try{me=await VB.net.user.me();}catch(e){me=null;}
    status="on";render();
    VB.net.db.collection("players").onSnapshot(async snap=>{const next={};snap.docs.forEach(d=>{const v=d.data();if(v)next[d.id]=v;});players=next;
      Object.keys(players).forEach(id=>{const a=players[id].mediaAt||0;if(mediaAts[id]!==undefined&&mediaAts[id]!==a){VB.mediaForget&&VB.mediaForget(id);delete medias[id];}mediaAts[id]=a;});
      try{profs=await VB.net.user.profiles(Object.keys(players));}catch(e){}
      if(soc().joined&&uid()&&!players[uid()])schedule();render();},()=>{status="off";render();});
    if(soc().joined)schedule();}
  const lvlAvg=s=>{const v=Object.values((s&&s.lv)||{});return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10:null;};
  const METRICS={vert:["Vertical jump",s=>s.vert,v=>VB.lenOut(v)+" "+VB.lu()],sess28:["Sessions, 28 days",s=>s.sess28,v=>v],min28:["Minutes, 28 days",s=>s.min28,v=>v],streak:["Week streak",s=>s.streak,v=>v],lvl:["Average drill level",lvlAvg,v=>v],fixed:["Faults fixed",s=>s.fixed,v=>v]};


  /* ---------- teams, chat helpers ---------- */
  const SLOTS=[["S","Setter","setter"],["OH1","Outside 1","outside"],["MB1","Middle 1","middle"],["OPP","Opposite","opposite"],["OH2","Outside 2","outside"],["MB2","Middle 2","middle"],["L","Libero","libero"]];
  const posOf=id=>id===uid()?(VB.state.profile||{}).pos:(players[id]||{}).pos;
  const membersOf=t=>[...SLOTS.map(x=>(t.slots||{})[x[0]]).filter(Boolean),...(t.subs||[])];
  function allTeams(){const u=uid(),out=soc().teams.map(t=>({owner:u,t}));Object.keys(players).forEach(id=>{if(id===u)return;((players[id]||{}).teams||[]).forEach(t=>{if(t&&membersOf(t).includes(u))out.push({owner:id,t});});});return out;}
  function autoFill(ids){const slots={},left=ids.slice();SLOTS.forEach(([k,,want])=>{const i=left.findIndex(id=>posOf(id)===want);if(i>=0)slots[k]=left.splice(i,1)[0];});
    SLOTS.forEach(([k])=>{if(!slots[k]&&k!=="L"&&left.length)slots[k]=left.shift();});return {slots,subs:left.slice(0,8)};}
  const teamKey=x=>x.owner+":"+x.t.id;
  function allMsgs(){const u=uid(),out=[];soc().msgs.forEach(m=>out.push(Object.assign({from:u},m)));Object.keys(players).forEach(id=>{if(id===u)return;((players[id]||{}).msgs||[]).forEach(m=>{if(m&&m.th)out.push(Object.assign({from:id},m));});});return out;}
  function threads(R){const u=uid(),list=[];allTeams().forEach(x=>list.push({th:"t:"+teamKey(x),title:x.t.name||"Team",sub:"Team chat",color:x.t.color,ids:membersOf(x.t)}));
    const ev=[];soc().meets.forEach(m=>ev.push(Object.assign({host:u},m)));R.mutual.forEach(f=>((players[f].meets)||[]).forEach(m=>{if(m&&(m.inv||[]).includes(u))ev.push(Object.assign({host:f},m));}));
    ev.filter(m=>m.date>=VB.addDays(VB.today(),-3)).forEach(m=>list.push({th:"e:"+m.host+":"+m.id,title:m.title||((m.kind||"Session")+" "+VB.shortDate(m.date)),sub:"Event chat",ids:[m.host,...(m.inv||[])]}));
    R.mutual.forEach(f=>list.push({th:"d:"+[u,f].sort().join(":"),title:nameOf(f),sub:"Direct",ids:[u,f],dm:f}));
    const M=allMsgs();list.forEach(t=>{const ms=M.filter(m=>m.th===t.th&&t.ids.includes(m.from)).sort((a,b)=>a.at-b.at);t.msgs=ms;t.last=ms[ms.length-1]||null;t.unread=ms.filter(m=>m.from!==u&&m.at>(soc().seen[t.th]||0)).length;});
    return list.sort((a,b)=>((b.last&&b.last.at)||0)-((a.last&&a.last.at)||0));}
  const ago=t=>{const d=(Date.now()-t)/1000;return d<60?"now":d<3600?Math.round(d/60)+" min":d<86400?Math.round(d/3600)+" h":Math.round(d/86400)+" d";};
  function render(){if(!root)return;const st=VB.state,p=st.profile;if(!p){root.innerHTML="";return;}const o=soc(),u=uid();
    if(status==="wait"){root.innerHTML=`<div class="card"><p class="muted">Checking your account.</p></div>`;return;}
    if(status==="off"){root.innerHTML=`<div class="card"><div class="kicker">Sign in to use Squad</div><p>Friends, sharing and joint sessions use your Claude account as your login. Open this page inside Claude while signed in. Each person you share the page with needs Contributor access to create a player card.</p><p class="small muted">Your own training data keeps working without it.</p></div>`;return;}
    const myAv=VB.media&&VB.media.pfp?VB.media.pfp:(me&&me.avatarUrl);const acct=`<div class="card acct band"><div class="row" style="flex-wrap:nowrap;gap:14px">${myAv?`<img class="av lg" src="${esc(myAv)}" alt="">`:`<span class="av lg"></span>`}<div style="min-width:0"><div class="stat">Signed in with your Claude account</div><h3 style="font-size:1.4rem">${esc((me&&me.name)||p.name||"You")}</h3><p class="small muted">${POSL(p.pos)}${p.number!=null?" · No. "+p.number:""}</p>${me&&me.email?`<p class="small acctmail"><span class="pill">Email</span> ${esc(me.email)}</p>`:""}</div></div>
      ${status==="readonly"?`<p class="note">Your access to this page is view-only, so you cannot publish a player card. Ask the owner for Contributor access.</p>`:o.joined?`<p class="small muted">Your player card is live. Friends see your name, number, position, level, vertical, session counts, drill levels and current program. Film, notes and body weight stay private.</p><div class="row"><span class="pill ok">Card published</span><a class="btn sm primary" href="#profile">Show my card and code</a><button type="button" class="btn sm" data-scan>Scan a card</button><button type="button" class="btn sm" data-act="leave">Remove my card</button></div>`
       :`<p>Create a player card to add friends, compare progress, share programs and drills, and plan sessions together.</p><p class="small muted">The card shows your name, number, position, level, vertical, session counts, drill levels and current program to everyone who can open this page. Film, notes and body weight stay private.</p><div class="row"><button type="button" class="btn primary" data-act="join">Create my player card</button></div>`}</div>`;
    if(!o.joined||status==="readonly"){root.innerHTML=`<div class="cols">${acct}<div class="card"><div class="kicker">What Squad does</div><ul class="plain"><li><b>Friends:</b> add teammates who use this page.</li><li><b>Compare:</b> vertical, sessions, streaks and drill levels side by side.</li><li><b>Share:</b> send a custom program or a drill to your friends.</li><li><b>Plan together:</b> pick a date, invite friends, and get drills that fit your positions.</li></ul></div></div>`;return;}
    const R=rel(),fl=filter.toLowerCase(),pc=id=>{const c=players[id]||{},cp=VB.compat(p.pos,c.pos);return {c,cp};};
    const person=(id,actions,extra)=>{const {c,cp}=pc(id),s=c.stats||{};return `<div class="pl">${avatar(id)}<div style="min-width:0"><b>${esc(nameOf(id))}</b><div class="small muted">${POSL(c.pos)}${c.exp?" · "+esc(c.exp):""}${s.vert!=null?" · "+VB.lenOut(s.vert)+" "+VB.lu()+" vertical":""}</div><div class="small"><span class="fit f${cp[0]}">${"●".repeat(cp[0])}${"○".repeat(5-cp[0])}</span> <span class="muted">${esc(cp[1])}</span></div>${extra||""}</div><div class="row" style="justify-content:flex-end">${actions}</div></div>`;};
    // friends
    const friendsHTML=`<div class="card"><div class="kicker">Friends · ${R.mutual.length}</div>
      ${R.inc.length?`<div class="grp">Requests</div>${R.inc.map(id=>person(id,`<button type="button" class="btn sm primary" data-add="${id}">Accept</button>`)).join("")}`:""}
      ${R.mutual.length?R.mutual.map(id=>person(id,`<button type="button" class="btn sm" data-rm="${id}">Remove</button>`)).join(""):`<p class="small muted">No friends yet. Add players below. They become friends once they add you back.</p>`}
      ${R.out.length?`<div class="grp">Waiting for them to add you back</div>${R.out.map(id=>person(id,`<button type="button" class="btn sm" data-rm="${id}">Cancel</button>`)).join("")}`:""}
      <div class="grp" style="margin-top:6px">Add by email or name</div><input class="in" id="sqEmail" type="search" autocomplete="off" placeholder="teammate@club.com" aria-label="Find a player by email or name"><div id="sqEmailHits" class="small muted">Type an email address or a name. Only people who can open this page are found.</div><div class="grp" style="margin-top:6px">Players on this page</div><input class="in" id="sqFilter" placeholder="Filter by name or position" value="${esc(filter)}" aria-label="Filter players">
      <div id="sqOthers">${othersHTML(R,fl,person)}</div></div>`;
    // compare
    const ids=[u,...R.mutual],M=METRICS[metric],rows=ids.map(id=>({id,v:M[1](id===u?stats():(players[id]&&players[id].stats)||{})})).sort((a,b)=>(b.v==null?-1:b.v)-(a.v==null?-1:a.v)),mx=Math.max(1,...rows.map(r=>r.v||0));
    const compareHTML=`<div class="card"><div class="kicker">Compare progress</div><div class="chips">${Object.entries(METRICS).map(([k,m])=>`<button type="button" class="chip" data-metric="${k}" aria-pressed="${k===metric}">${m[0]}</button>`).join("")}</div>
      ${R.mutual.length?"":`<p class="small muted">Add a friend to see them here. This is how your own numbers will appear.</p>`}
      <div class="lb">${rows.map((r,i)=>`<div class="lbrow ${r.id===u?"me":""}"><span class="rk">${r.v==null?"–":i+1}</span><span class="nm">${esc(r.id===u?"You":nameOf(r.id))}<small>${POSL((r.id===u?p:players[r.id]||{}).pos)}</small></span><span class="lbar"><i style="width:${r.v?Math.max(4,r.v/mx*100):0}%"></i></span><b class="num">${r.v==null?"No data":M[2](r.v)}</b></div>`).join("")}</div>
      ${R.mutual.length?`<div class="tablewrap"><table><thead><tr><th>Player</th><th>Program</th>${Object.entries(VB.SKILLS).slice(0,6).map(([k,l])=>`<th class="r">${l}</th>`).join("")}</tr></thead><tbody>${ids.map(id=>{const s=id===u?stats():(players[id]&&players[id].stats)||{};return `<tr><td>${esc(id===u?"You":nameOf(id))}</td><td>${esc(s.prog||"–")}</td>${Object.keys(VB.SKILLS).slice(0,6).map(k=>`<td class="r num">${(s.lv&&s.lv[k])?"L"+s.lv[k]:"–"}</td>`).join("")}</tr>`;}).join("")}</tbody></table></div>`:""}</div>`;
    // shared
    const inbox=[];R.mutual.forEach(f=>((players[f].shares)||[]).forEach(s=>{if(s&&(s.to==="friends"||(Array.isArray(s.to)&&s.to.includes(u))))inbox.push(Object.assign({from:f},s));}));inbox.sort((a,b)=>(b.at||0)-(a.at||0));
    const shareRow=(s,mine)=>{const isP=s.kind==="program",d=isP?(s.data&&s.data.name?s.data:VB.programDef(s.data&&s.data.id)):VB.drMap()[s.data&&s.data.id];if(!d)return"";
      return `<div class="pl"><span class="pill ${isP?"on":""}">${isP?"Program":"Drill"}</span><div style="min-width:0"><b>${esc(d.name)}</b><div class="small muted">${mine?"Shared with your friends":"From "+esc(nameOf(s.from))}${isP?(d.weeks?" · "+d.weeks+" weeks":" · ongoing"):" · "+VB.SKILLS[d.skill]+" · level "+d.level}${s.note?" · “"+esc(s.note)+"”":""}</div></div><div class="row" style="justify-content:flex-end">${mine?`<button type="button" class="btn sm" data-unshare="${s.id}">Stop sharing</button>`:isP?`<button type="button" class="btn sm primary" data-getp="${s.from}:${s.id}">Add and start</button>`:`<button type="button" class="btn sm" data-opend="${d.id}">Open</button><button type="button" class="btn sm primary" data-getd="${d.id}">Add to next session</button>`}</div></div>`;};
    const sharedHTML=`<div class="card"><div class="kicker">Shared with you · ${inbox.length}</div>${inbox.length?inbox.map(s=>shareRow(s,false)).join(""):`<p class="small muted">Programs and drills your friends share appear here.</p>`}
      <div class="grp" style="margin-top:6px">You are sharing</div>${o.shares.length?o.shares.map(s=>shareRow(s,true)).join(""):`<p class="small muted">Share a custom program from the Programs tab, or a drill from the Skills tab.</p>`}</div>`;
    // sessions together
    if(pick.team){const x=allTeams().find(y=>teamKey(y)===pick.team);if(x)pick.friends=membersOf(x.t).filter(id=>id!==u&&R.mutual.includes(id));}
    const inv=pick.friends.filter(f=>R.mutual.includes(f)),gc=VB.groupCompat([p.pos,...inv.map(f=>(players[f]||{}).pos||"any")]),myLvl=Math.round(lvlAvg(stats())||2),sug=inv.length?suggestDrills(gc.skills,inv.length+1,myLvl):[];
    if(pick.drills===null||pick.drills.some(id=>!sug.some(d=>d.id===id)))pick.drills=sug.slice(0,3).map(d=>d.id);
    const meets=[];o.meets.forEach(m=>meets.push(Object.assign({host:u},m)));R.mutual.forEach(f=>((players[f].meets)||[]).forEach(m=>{if(m&&(m.inv||[]).includes(u))meets.push(Object.assign({host:f},m));}));
    const upcoming=meets.filter(m=>m.date>=VB.addDays(VB.today(),-1)).sort((a,b)=>(a.date+(a.time||""))<(b.date+(b.time||""))?-1:1);
    const meetCard=m=>{const all=[m.host,...(m.inv||[])],g=VB.groupCompat(all.map(id=>id===u?p.pos:(players[id]||{}).pos||"any")),mine=m.host===u;
      const rs=id=>id===m.host?"Host":({yes:"Going",no:"Can't"}[(id===u?o.rsvp:(players[id]||{}).rsvp||{})[m.id]]||"No reply");
      const dt=new Date(m.date+"T12:00:00");
      return `<div class="meet"><div class="evdate"><b>${dt.getDate()}</b><span>${dt.toLocaleDateString(undefined,{month:"short"})}</span></div><div class="evbody"><div class="row" style="justify-content:space-between"><b class="evtitle">${esc(m.title||(m.kind||"Session"))}</b><span class="pill">${esc(m.kind||"Session")}</span></div><div class="small muted">${m.time?esc(m.time):"Time to be set"}${m.place?" · "+esc(m.place):""} · <span class="fit f${Math.round(g.score)}">Fit ${g.score} / 5</span></div><div class="avrow">${all.map(id=>`<span class="avs ${({yes:"go",no:"no"}[(id===u?o.rsvp:(players[id]||{}).rsvp||{})[m.id]]||(id===m.host?"go":""))}" title="${esc(id===u?"You":nameOf(id))}">${avatar(id)}</span>`).join("")}</div>
        <div class="small muted">${(()=>{const c={Host:0,Going:0,"Can't":0,"No reply":0};all.forEach(id=>c[rs(id)]++);return `${c.Going+c.Host} going · ${c["Can't"]} can't · ${c["No reply"]} no reply`;})()}${m.team?" · "+esc((allTeams().find(x=>teamKey(x)===m.team)||{t:{name:"Team"}}).t.name):""}</div>
        ${(m.drills||[]).length?`<div class="small"><span class="grp">Drills</span> ${m.drills.map(id=>VB.drMap()[id]?`<button type="button" class="linkbtn" data-opend="${id}">${esc(VB.drMap()[id].name)}</button>`:"").join(" · ")}</div>`:""}${m.note?`<div class="small muted">${esc(m.note)}</div>`:""}
        <div class="row">${mine?`<button type="button" class="btn sm" data-delmeet="${m.id}">Cancel session</button>`:`<span class="seg"><button type="button" data-rsvp="${m.id}:yes" aria-pressed="${o.rsvp[m.id]==="yes"}">Going</button><button type="button" data-rsvp="${m.id}:no" aria-pressed="${o.rsvp[m.id]==="no"}">Can't</button></span>`}${(m.drills||[]).length?`<button type="button" class="btn sm primary" data-usemeet="${m.host}:${m.id}">Add drills to my next session</button>`:""}<button type="button" class="btn sm" data-chat="e:${m.host}:${m.id}">Event chat</button></div></div></div>`;};
    const planHTML=`<div class="card"><div class="kicker">Plan an event</div>
      ${R.mutual.length?`<div class="grid"><label class="f">Title<input id="mTitle" maxlength="40" value="${esc(pick.title||"")}" placeholder="Tuesday serve receive"></label><label class="f">Type<select id="mKind">${["Practice","Match","Scrimmage","Open gym","Team meeting"].map(k=>`<option${(pick.kind||"Practice")===k?" selected":""}>${k}</option>`).join("")}</select></label><label class="f">Invite a team<select id="mTeam"><option value="">No team, pick friends</option>${allTeams().map(x=>`<option value="${esc(teamKey(x))}"${pick.team===teamKey(x)?" selected":""}>${esc(x.t.name||"Team")}</option>`).join("")}</select></label><label class="f">Date<input type="date" id="mDate" value="${esc(pick.date||VB.addDays(VB.today(),1))}"></label><label class="f">Time<input type="time" id="mTime" value="${esc(pick.time||"18:00")}"></label><label class="f">Where<input id="mPlace" maxlength="40" value="${esc(pick.place||"")}" placeholder="Gym, court or park"></label></div>
       <div><div class="grp" style="margin-bottom:6px">Invite</div><div class="chips">${R.mutual.map(f=>`<button type="button" class="chip" data-inv="${f}" aria-pressed="${inv.includes(f)}">${esc(nameOf(f))} · ${POSL((players[f]||{}).pos)}</button>`).join("")}</div></div>
       ${inv.length?`<div class="fitbox"><div class="row" style="justify-content:space-between"><span class="stat">Position fit</span><span class="fit f${Math.round(gc.score)}">${gc.score} / 5</span></div><p>${esc(gc.why)}</p>${gc.notes.map(n=>`<p class="small muted">${esc(n)}</p>`).join("")}<p class="small"><span class="grp">Best to train</span> ${gc.skills.map(s=>VB.SKILLS[s]).join(" · ")}</p></div>
        <div><div class="grp" style="margin-bottom:6px">Suggested drills for ${inv.length+1} players</div><div class="chips">${sug.map(d=>`<button type="button" class="chip" data-pd="${d.id}" aria-pressed="${pick.drills.includes(d.id)}">${esc(d.name)} · L${d.level}</button>`).join("")||`<span class="small muted">No drills in the library fit this group size.</span>`}</div></div>
        <label class="f">Note<input id="mNote" maxlength="120" value="${esc(pick.note||"")}" placeholder="What to bring, what to focus on"></label>
        <div class="row"><button type="button" class="btn primary" data-act="savemeet">Send the invite</button></div>`:`<p class="small muted">Pick who is coming and the page works out how well your positions fit and which drills suit the group.</p>`}`
       :`<p class="small muted">Add a friend first. Then pick a date, invite them, and get drills matched to your positions.</p>`}
      <div class="grp" style="margin-top:6px">Coming up</div>${upcoming.length?upcoming.map(meetCard).join(""):`<p class="small muted">No sessions planned.</p>`}</div>`;
    // ---------- teams ----------
    const TM=allTeams();if(selTeam&&!TM.some(x=>teamKey(x)===selTeam))selTeam=null;if(!selTeam&&TM.length)selTeam=teamKey(TM[0]);
    const cur=TM.find(x=>teamKey(x)===selTeam),mine=cur&&cur.owner===u,cand=[u,...R.mutual];
    const pname=id=>id===u?"You":nameOf(id),chosen=id=>POSL(posOf(id));
    const slotRow=(k,label,want)=>{const id=cur.t.slots&&cur.t.slots[k],warn=id&&posOf(id)&&posOf(id)!==want&&posOf(id)!=="any";
      return `<div class="slot ${id?"":"open"}"><span class="sk">${k==="L"?"L":k.replace(/\d/,"")}</span><div class="sinfo"><b>${label}</b>${id?`<span class="small ${warn?"warnc":"muted"}">${esc(pname(id))} · plays ${esc(chosen(id))}${warn?" (out of position)":""}</span>`:`<span class="small muted">Open spot</span>`}</div>${id?avatar(id):`<span class="av"></span>`}
        ${mine?`<select data-slot="${k}" aria-label="${label}"><option value="">Open</option>${cand.map(c=>`<option value="${c}"${c===id?" selected":""}>${esc(pname(c))} · ${esc(chosen(c))}</option>`).join("")}</select>`:""}</div>`;};
    let teamsHTML;
    if(!cur){teamsHTML=`<div class="tempty"><div class="tempty-in"><span class="stat">Teams</span><h3>Build your six</h3><p>Pick friends for setter, outsides, middles, opposite and libero, add subs, and see the lineup on a 3D court with everyone's photo. Each friend goes in at the position they chose.</p>
        ${R.mutual.length?`<button type="button" class="btn primary" data-act="newteam">Create a team</button>`:`<p class="small muted">Add friends first in the Friends tab. Teams use mutual friends.</p><button type="button" class="btn" data-tab="friends">Find friends</button>`}</div></div>`;}
    else{const t=cur.t,ids=membersOf(t),gcT=VB.groupCompat(ids.map(id=>posOf(id)||"any")),lvl=Math.round(lvlAvg(stats())||2),sugT=suggestDrills(gcT.skills.length?gcT.skills:["pass","set","attack"],Math.max(2,ids.length),lvl).filter(d=>!(t.drills||[]).includes(d.id)).slice(0,5);
      const benchIds=(t.subs||[]),free=cand.filter(c=>!ids.includes(c));
      teamsHTML=`<div class="teambar">${TM.map(x=>`<button type="button" class="tchip" data-team="${esc(teamKey(x))}" aria-pressed="${teamKey(x)===selTeam}" style="--tc:${esc(x.t.color||"#ec3b52")}"><b>${esc(x.t.name||"Team")}</b><span>${membersOf(x.t).length} players${x.owner===u?" · yours":" · by "+esc(nameOf(x.owner))}</span></button>`).join("")}${R.mutual.length?`<button type="button" class="tchip add" data-act="newteam">+ New team</button>`:""}</div>
      <div class="teamgrid"><div class="teamstage-wrap"><div class="stage teamstage" id="teamStage"><div class="hud t"><span class="tname" style="--tc:${esc(t.color||"#ec3b52")}">${esc(t.name||"Team")}</span><span class="hint">Drag to turn</span></div>
          <div class="hud b"><span class="small" style="color:#fff">Rotation</span>${[1,2,3,4,5,6].map(r=>`<button type="button" class="sbtn" data-rot="${r}" aria-pressed="${r===rot}">${r}</button>`).join("")}</div></div>
          <p class="small muted">Rotation ${rot}: the libero replaces the middle in the back row. Subs stand on the bench line.</p></div>
        <div class="stack"><div class="card lineup"><div class="row" style="justify-content:space-between"><div class="kicker">Lineup</div>${mine?`<input class="in tnamein" id="tName" maxlength="28" value="${esc(t.name||"")}" aria-label="Team name">`:""}</div>
          ${SLOTS.map(([k,l,w])=>slotRow(k,l,w)).join("")}
          <div class="grp">Subs · ${benchIds.length}</div><div class="subs">${benchIds.map(id=>`<span class="subchip">${avatar(id)}<b>${esc(pname(id))}</b><small>${esc(chosen(id))}</small>${mine?`<button type="button" class="x" data-unsub="${id}" aria-label="Remove ${esc(pname(id))}">×</button>`:""}</span>`).join("")||`<span class="small muted">No subs yet.</span>`}</div>
          ${mine&&free.length?`<div class="row"><select id="addSub" aria-label="Add a sub"><option value="">Add a sub</option>${free.map(c=>`<option value="${c}">${esc(pname(c))} · ${esc(chosen(c))}</option>`).join("")}</select></div>`:""}
          ${mine?`<div class="row"><button type="button" class="btn sm" data-act="autofill">Fill by chosen positions</button><span class="colors">${["#ec3b52","#5b2bff","#20c4b4","#f5a524","#ff5fa2","#17144d"].map(c=>`<button type="button" class="cdot" data-tcolor="${c}" style="--c:${c}" aria-label="Team colour" aria-pressed="${t.color===c}"></button>`).join("")}</span><button type="button" class="btn sm" data-act="delteam">Delete team</button></div>`:`<p class="small muted">Only ${esc(nameOf(cur.owner))} can change this lineup.</p>`}</div>
        <div class="card"><div class="row" style="justify-content:space-between"><div class="kicker">Team drills</div><span class="fit f${Math.round(gcT.score)}">Fit ${gcT.score} / 5</span></div>
          <p class="small muted">${esc(gcT.why)}</p>
          ${(t.drills||[]).length?(t.drills||[]).map(id=>{const d=VB.drMap()[id];return d?`<div class="drow"><button type="button" class="linkbtn" data-opend="${id}">${esc(d.name)}</button><span class="small muted">${VB.SKILLS[d.skill]} · L${d.level}</span><button type="button" class="btn sm" data-getd="${id}">Add to my session</button>${mine?`<button type="button" class="x" data-rmdrill="${id}" aria-label="Remove">×</button>`:""}</div>`:"";}).join(""):`<p class="small muted">No team drills yet.</p>`}
          ${mine&&sugT.length?`<div class="grp">Suggested for this lineup</div><div class="chips">${sugT.map(d=>`<button type="button" class="chip" data-tdrill="${d.id}">+ ${esc(d.name)} · L${d.level}</button>`).join("")}</div>`:""}
          <div class="row"><button type="button" class="btn sm primary" data-teamplan="${esc(selTeam)}">Plan a team practice</button><button type="button" class="btn sm" data-chat="t:${esc(selTeam)}">Team chat</button></div></div></div></div>`;}
    // ---------- chat ----------
    const TH=threads(R);if(thread&&!TH.some(t=>t.th===thread))thread=null;if(!thread&&TH.length&&tab==="chat"&&window.innerWidth>760)thread=TH[0].th;
    const curT=TH.find(t=>t.th===thread);
    const chatHTML=`<div class="chat ${curT?"open":""}"><div class="threads">${TH.length?TH.map(t=>`<button type="button" class="thr" data-chat="${esc(t.th)}" aria-pressed="${t.th===thread}">${t.dm?avatar(t.dm):`<span class="av tav" style="--tc:${esc(t.color||"#5b2bff")}">${esc((t.title||"?")[0])}</span>`}<span class="tt"><b>${esc(t.title)}</b><small>${t.last?esc((t.last.from===u?"You: ":"")+t.last.text.slice(0,40)):esc(t.sub)}</small></span>${t.unread?`<i class="unread">${t.unread}</i>`:""}</button>`).join(""):`<p class="small muted" style="padding:14px">Add friends or make a team to start chatting.</p>`}</div>
      <div class="thread">${curT?`<div class="thead"><button type="button" class="linkbtn back" data-chat="">‹ All chats</button><b>${esc(curT.title)}</b><span class="small muted">${esc(curT.sub)} · ${curT.ids.length} people</span></div>
        <div class="msgs" id="msgs">${curT.msgs.length?curT.msgs.map((m,i)=>{const mine2=m.from===u,prev=curT.msgs[i-1],grp=prev&&prev.from===m.from&&m.at-prev.at<300000;return `<div class="msg ${mine2?"me":""} ${grp?"grp":""}">${mine2||grp?"":avatar(m.from)}<div class="bub">${mine2||grp?"":`<span class="who">${esc(nameOf(m.from))}</span>`}${esc(m.text)}<span class="when">${ago(m.at)}</span></div></div>`;}).join(""):`<p class="small muted" style="text-align:center;margin-top:30px">No messages yet. Say hi.</p>`}</div>
        <div class="composer"><input class="in" id="chatIn" maxlength="300" placeholder="Message ${esc(curT.title)}" value="${esc(draft)}" autocomplete="off"><button type="button" class="btn primary" data-act="send">Send</button></div>
        <p class="small muted chatnote">Messages are saved on your player card, so anyone who can open this page could read them.</p>`:`<div class="noth"><b>Pick a chat</b><span class="small muted">Team, event and direct chats with your friends.</span></div>`}</div></div>`;
    const unreadAll=TH.reduce((a,t)=>a+t.unread,0),upN=upcoming.length;
    const tabs=[["teams","Teams",TM.length||""],["friends","Friends",R.inc.length?R.inc.length+" new":R.mutual.length||""],["events","Events",upN||""],["chat","Chat",unreadAll?unreadAll+" new":""]];
    const pane={teams:teamsHTML,friends:`<div class="cols even"><div class="stack">${friendsHTML}</div><div class="stack">${compareHTML}${sharedHTML}</div></div>`,events:planHTML,chat:chatHTML}[tab];
    const keep=document.activeElement&&document.activeElement.id,pos=keep&&document.activeElement.selectionStart;
    const stage=document.getElementById("teamStage");if(stage&&VB.team3d)VB.team3d.park();
    root.innerHTML=`${acct}<nav class="sqtabs" role="tablist">${tabs.map(([k,l,b])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${tab===k}"><span>${l}</span>${b!==""?`<i>${b}</i>`:""}</button>`).join("")}</nav><div class="sqpane" data-pane="${tab}">${pane}</div>`;
    if(tab==="teams"&&cur&&VB.team3d){const info={};membersOf(cur.t).forEach(id=>{const c=id===u?VB.myCard():(players[id]||{}),m=id===u?{pfp:VB.media&&VB.media.pfp}:(medias[id]||{});info[id]={name:id===u?(VB.state.profile.name||"You"):(c.nick||nameOf(id)),pos:posOf(id),number:c.number,look:c.look,hand:c.hand,pfp:(m&&m.pfp)||(profs[id]&&profs[id].avatarUrl)||null,me:id===u};});
      VB.team3d.show($("#teamStage",root),{team:cur.t,info,rot,color:cur.t.color||"#ec3b52"});}
    if(tab==="chat"&&curT){const box=$("#msgs",root);if(box)box.scrollTop=box.scrollHeight;const last=curT.last;if(last&&last.at>(soc().seen[curT.th]||0)){soc().seen[curT.th]=last.at;VB.save();}}
    if(keep&&$("#"+keep,root)){const el=$("#"+keep,root);el.focus();try{if(pos!=null)el.setSelectionRange(pos,pos);}catch(e){}}}
  function othersHTML(R,fl,person){const list=R.others.filter(id=>{const c=players[id]||{};return !fl||(nameOf(id)+" "+POSL(c.pos)).toLowerCase().includes(fl);});
    return list.length?list.slice(0,30).map(id=>person(id,`<button type="button" class="btn sm primary" data-add="${id}">Add friend</button>`)).join(""):`<p class="small muted">${R.others.length?"No one matches that filter.":"Nobody else has a player card yet. Share this page with your teammates so they can join."}</p>`;}
  function readPlan(){["Date","Time","Place","Note","Title","Kind","Team"].forEach(k=>{const el=$("#m"+k,root);if(el)pick[k.toLowerCase()]=el.value;});const c=$("#chatIn",root);if(c)draft=c.value;const tn=$("#tName",root);if(tn&&teamDraft)teamDraft.name=tn.value;}
  function commit(msg){VB.save();lastPush="";push();render();if(msg)VB.ui.toast(msg);}
  function onClick(e){const b=e.target.closest("button");if(!b)return;const o=soc(),d=b.dataset;readPlan();
    if(d.act==="join"){o.joined=true;commit("Player card created.");return;}
    if(d.tab!=null&&b.getAttribute("role")==="tab"||d.tab&&!b.getAttribute("role")){tab=d.tab;render();return;}
    if(d.team){selTeam=d.team;render();return;}
    if(d.rot){rot=+d.rot;render();return;}
    if(d.chat!=null&&d.chat!==undefined&&b.hasAttribute("data-chat")){thread=d.chat||null;tab="chat";render();const ci=$("#chatIn",root);if(ci&&thread)ci.focus();return;}
    if(d.act==="send"){const ci=$("#chatIn",root),txt=(ci&&ci.value||"").trim().slice(0,300);if(!txt||!thread)return;o.msgs.unshift({id:VB.uid(),th:thread,text:txt,at:Date.now()});o.msgs=o.msgs.slice(0,80);o.seen[thread]=Date.now();draft="";commit();const c2=$("#chatIn",root);if(c2)c2.focus();return;}
    if(d.act==="newteam"){const R=rel(),f=autoFill([uid(),...R.mutual].slice(0,14)),t={id:VB.uid(),name:((VB.state.profile||{}).name?(VB.state.profile.name.split(" ")[0]+"'s team"):"My team").slice(0,28),color:"#ec3b52",slots:f.slots,subs:f.subs,drills:[],at:Date.now()};o.teams.push(t);o.teams=o.teams.slice(-6);selTeam=uid()+":"+t.id;tab="teams";commit("Team created. Everyone is in at their chosen position.");return;}
    const T=o.teams.find(t=>selTeam&&selTeam===uid()+":"+t.id);
    if(T){if(d.act==="autofill"){const f=autoFill(membersOf(T));T.slots=f.slots;T.subs=f.subs;commit("Lineup filled by chosen positions.");return;}
      if(d.act==="delteam"){o.teams=o.teams.filter(t=>t!==T);selTeam=null;commit("Team deleted.");return;}
      if(d.unsub){T.subs=(T.subs||[]).filter(x=>x!==d.unsub);commit();return;}
      if(d.tcolor){T.color=d.tcolor;commit();return;}
      if(d.tdrill){T.drills=[...(T.drills||[]),d.tdrill].slice(0,12);commit("Drill added to the team.");return;}
      if(d.rmdrill){T.drills=(T.drills||[]).filter(x=>x!==d.rmdrill);commit();return;}}
    if(d.teamplan){const x=allTeams().find(y=>teamKey(y)===d.teamplan);pick={friends:[],drills:x?(x.t.drills||[]).slice(0,6):null,team:d.teamplan,kind:"Practice",title:x?((x.t.name||"Team")+" practice"):""};tab="events";render();return;}
    if(d.act==="leave"){o.joined=false;VB.save();mediaPushed=0;if(VB.net){VB.net.db.doc("players/"+uid()).delete().catch(()=>{});VB.net.db.doc("players/"+uid()+"/media/img").delete().catch(()=>{});}lastPush="";render();VB.ui.toast("Your player card was removed.");return;}
    if(d.add){if(!o.friends.includes(d.add))o.friends.push(d.add);commit("Friend added.");return;}
    if(d.rm){o.friends=o.friends.filter(f=>f!==d.rm);pick.friends=pick.friends.filter(f=>f!==d.rm);commit("Removed.");return;}
    if(d.metric){metric=d.metric;render();return;}
    if(d.inv){const i=pick.friends.indexOf(d.inv);if(i>=0)pick.friends.splice(i,1);else pick.friends.push(d.inv);pick.drills=null;render();return;}
    if(d.pd){const i=pick.drills.indexOf(d.pd);if(i>=0)pick.drills.splice(i,1);else pick.drills.push(d.pd);render();return;}
    if(d.act==="savemeet"){const R=rel(),inv=pick.friends.filter(f=>R.mutual.includes(f));if(!inv.length||!pick.date){VB.ui.toast("Pick a date and at least one friend.");return;}
      o.meets.push({id:VB.uid(),title:(pick.title||"").slice(0,40),kind:pick.kind||"Practice",team:pick.team||null,date:pick.date,time:pick.time||"",place:(pick.place||"").slice(0,40),inv,drills:(pick.drills||[]).slice(0,6),note:(pick.note||"").slice(0,120)});o.meets=o.meets.filter(m=>m.date>=VB.addDays(VB.today(),-14)).slice(-20);
      pick={friends:[],drills:null};commit("Invite sent.");return;}
    if(d.delmeet){o.meets=o.meets.filter(m=>m.id!==d.delmeet);commit("Session cancelled.");return;}
    if(d.rsvp){const [id,v]=d.rsvp.split(":");o.rsvp[id]=v;commit();return;}
    if(d.usemeet){const [host,id]=d.usemeet.split(":"),src=host===uid()?o.meets:((players[host]||{}).meets||[]),m=src.find(x=>x.id===id);if(m){(m.drills||[]).forEach(x=>{if(VB.drMap()[x]&&!VB.state.queue.includes(x))VB.state.queue.push(x);});VB.invalidatePlan();VB.save();VB.ui.toast("Drills added to your next session.");}return;}
    if(d.unshare){o.shares=o.shares.filter(s=>s.id!==d.unshare);commit("Stopped sharing.");return;}
    if(d.opend){VB.ui.openDrill(d.opend);return;}
    if(d.getd){if(!VB.state.queue.includes(d.getd))VB.state.queue.push(d.getd);VB.invalidatePlan();VB.save();VB.ui.toast("Added to your next session.");return;}
    if(d.getp){const [from,id]=d.getp.split(":"),s=((players[from]||{}).shares||[]).find(x=>x.id===id);if(!s)return;
      if(s.data&&s.data.name){const def=JSON.parse(JSON.stringify(s.data));def.id=null;def.name=String(def.name).slice(0,40);def.chains=(def.chains||[]).filter(c=>(window.VB_CHAINS||{})[c]);def.drills=(def.drills||[]).filter(x=>VB.drMap()[x]);VB.startProgram(VB.saveCustom(def));}
      else if(s.data&&VB.programDef(s.data.id))VB.startProgram(s.data.id);VB.ui.toast("Program added and started.");return;}}
  let eT=0,eSeq=0;
  async function emailSearch(q){const box=$("#sqEmailHits",root);if(!box)return;const seq=++eSeq;
    if(!q){box.innerHTML="Type an email address or a name. Only people who can open this page are found.";return;}
    let hits=[];try{hits=(await VB.net.user.search(q))||[];}catch(e){hits=[];}if(seq!==eSeq||!$("#sqEmailHits",root))return;
    hits=hits.filter(h=>h&&h.id&&h.id!==uid()).slice(0,6);
    if(!hits.length){box.innerHTML=`No one with access to this page matches “${esc(q)}”. Share the page with them first.`;return;}
    const R=rel();box.innerHTML=hits.map(h=>{const has=!!players[h.id],r=R.mutual.includes(h.id)?"friend":R.out.includes(h.id)?"out":R.inc.includes(h.id)?"inc":"none";
      const act=!has?`<span class="pill">No player card yet</span>`:r==="friend"?`<span class="pill ok">Friend</span>`:r==="out"?`<span class="pill">Request sent</span>`:`<button type="button" class="btn sm primary" data-add="${esc(h.id)}">${r==="inc"?"Accept":"Add friend"}</button>`;
      return `<div class="pl">${avatar(h.id)}<div style="min-width:0"><b>${esc(h.name||nameOf(h.id))}</b>${h.email?`<div class="small muted">${esc(h.email)}</div>`:""}${has?`<div class="small muted">${POSL(players[h.id].pos)}</div>`:""}</div><div class="row" style="justify-content:flex-end">${act}</div></div>`;}).join("");}
  return {
    init(el){root=el;root.addEventListener("click",onClick);root.addEventListener("change",e=>{const o=soc(),T=o.teams.find(t=>selTeam===uid()+":"+t.id),el=e.target;
      if(T&&el.dataset.slot){const k=el.dataset.slot,v=el.value||null;SLOTS.forEach(([q])=>{if(q!==k&&T.slots[q]===v&&v)T.slots[q]=null;});T.subs=(T.subs||[]).filter(x=>x!==v);T.slots[k]=v;commit();return;}
      if(T&&el.id==="addSub"&&el.value){T.subs=[...(T.subs||[]),el.value].slice(0,8);commit();return;}
      if(T&&el.id==="tName"){T.name=(el.value||"Team").slice(0,28);commit();return;}
      if(el.id==="mTeam"){pick.team=el.value;if(!el.value)pick.friends=[];pick.drills=null;render();return;}});
    root.addEventListener("keydown",e=>{if(e.target.id==="chatIn"&&e.key==="Enter"){e.preventDefault();const b=$('[data-act="send"]',root);b&&b.click();}});
    root.addEventListener("focusin",e=>{if(e.target.id==="sqEmail"&&!e.target.value&&VB.net)VB.net.user.search("").catch(()=>{});});root.addEventListener("input",e=>{if(e.target.id==="chatIn"){draft=e.target.value;return;}if(e.target.id==="sqEmail"){clearTimeout(eT);const q=e.target.value.trim();eT=setTimeout(()=>emailSearch(q),250);return;}if(e.target.id==="sqFilter"){filter=e.target.value;const R=rel(),p=VB.state.profile,box=$("#sqOthers",root);if(box)render();}});render();},
    onNet(){connect();},refresh(){render();},changed(){if(soc().joined)schedule();},
    mediaChanged(){if(soc().joined){lastPush="";schedule();}},myStats:stats,
    relation(id){const R=rel();return R.mutual.includes(id)?"friend":R.out.includes(id)?"out":R.inc.includes(id)?"inc":"none";},
    addFriend(id){const o=soc();if(!o.friends.includes(id))o.friends.push(id);VB.save();lastPush="";push();render();},
    share(kind,data,note){const o=soc();if(status!=="on"||!o.joined){VB.ui.toast("Create your player card in the Squad tab first.");return false;}
      const key=JSON.stringify(kind==="program"&&data.name?data.name:data.id);if(o.shares.some(s=>s.kind===kind&&JSON.stringify(s.data&&(s.data.name||s.data.id))===key)){VB.ui.toast("You are already sharing this.");return false;}
      o.shares.unshift({id:VB.uid(),kind,to:"friends",at:Date.now(),note:(note||"").slice(0,80),data});o.shares=o.shares.slice(0,20);VB.save();lastPush="";push();const n=rel().mutual.length;VB.ui.toast(n?"Shared with your "+n+" friend"+(n>1?"s":"")+".":"Shared. Friends will see it once you add each other.");return true;}
  };
})();
})();
