/* team-plus.js: what players choose to share with their team, and what the team gets back.
   - Readiness for coaches: a player can turn on "Share readiness with my coaches". Their card then carries today's
     readiness score, training load, swings this week and sore spots, shown as extra columns in Coach tools.
   - Team season stats: matches saved in the Match tracker can be shared with a team. Everyone on the team sees the
     combined season table (per player and team totals); the coach sees it in Coach tools.
   Nothing here is shared unless the player turns it on or picks a team for a match. */
(function(){
"use strict";
const VB=window.VB,S=()=>VB.state,esc=VB.esc,$=(s,r=document)=>r.querySelector(s);
const prv=()=>{const s=S();if(!s.privacy||typeof s.privacy!=="object")s.privacy={};return s.privacy;};
const sq=()=>VB.squad&&VB.squad.data?VB.squad.data():null;
const SORE_L={shoulder:"Shoulder",upperback:"Upper back",lowerback:"Lower back",hip:"Hips",quad:"Thigh",ham:"Hamstring",knee:"Knee",achilles:"Achilles",ankle:"Ankle",wrist:"Wrist"};

/* ---------- readiness shared with coaches ---------- */
VB.sharedReadiness=function(){if(!prv().shareReady)return null;
  const r=VB.v5&&VB.v5.readyToday?VB.v5.readyToday():null,ls=VB.loadStats?VB.loadStats():{},t=VB.today();
  const sore=((S().soreness||{})[t])||{},sl=Object.keys(sore).filter(k=>sore[k]>=2).map(k=>(SORE_L[k]||k)+(sore[k]>=3?" (painful)":"")).join(", ");
  const arm=VB.armLoad?VB.armLoad():null;
  return {score:r&&r.score!=null?Math.round(r.score):null,date:r?t:null,load7:ls.acute!=null?Math.round(ls.acute):null,acwr:ls.acwr!=null?Math.round(ls.acwr*100)/100:null,sore:sl.slice(0,60),arm7:arm?arm.d7:null};};
/* three table cells for Coach tools */
VB.readyCells=function(c){const r=c&&c.ready;if(!r)return `<td colspan="3"><span class="small muted">Not shared</span></td>`;
  const today=r.date===VB.today(),sc=today?r.score:null,col=sc==null?"":sc>=80?"good":sc>=50?"":"warn";
  const load=r.acwr!=null?`<span class="${r.acwr>1.4?"warnc":""}">${Math.round(r.acwr*100)}%</span><small class="muted"> of usual</small>`:"–";
  return `<td>${sc!=null?`<b class="rdy ${col}">${sc}</b>`:`<span class="small muted">No check-in</span>`}${r.sore?`<br><span class="small warnc">Sore: ${esc(r.sore)}</span>`:""}</td><td>${load}</td><td>${r.arm7!=null?r.arm7:"–"}</td>`;};

/* ---------- match stats shared with a team ---------- */
VB.teamsForShare=function(){const d=sq();if(!d||d.status!=="on"||!d.joined)return [];return d.teams.map(x=>({key:x.owner+":"+x.t.id,name:(x.t.name||"Team")+(x.owner===d.uid?"":" · "+d.nameOf(x.owner))}));};
const KEYS=["k","ae","ta0","sa","se","sin","r3","r2","r1","r0","bs","ba","be","dg","de","as","bhe"];
VB.sharedTeamStats=function(){const M=(S().matches||[]).filter(m=>m&&m.team);const won=VB.match?VB.match.won:()=>[0,0];
  return M.slice(-40).map(m=>{const st={};KEYS.forEach(k=>{if(m.stats&&m.stats[k])st[k]=Math.min(999,m.stats[k]|0);});return {id:m.id,team:m.team,date:m.date,opp:(m.opp||"").slice(0,40),sets:won(m),s:st};});};
function rowsFor(team,ids,d){return ids.map(id=>{const list=id===d.uid?VB.sharedTeamStats():(((d.players[id]||{}).teamStats)||[]);
    const mine=list.filter(x=>x&&x.team===team),tot={};mine.forEach(x=>KEYS.forEach(k=>{const v=+((x.s||{})[k])||0;if(v>0&&v<1000)tot[k]=(tot[k]||0)+v;}));return {id,n:mine.length,tot};});}
VB.teamStatsHTML=function(team,ids,d){if(!VB.match)return "";const R=rowsFor(team,ids,d).filter(r=>r.n);
  if(!R.length)return `<div class="tstats"><div class="kicker">Team season stats</div><p class="small muted">When players save a match in Tools › Match tracker and pick this team, their numbers add up here.</p></div>`;
  const D=VB.match.derive,p3=VB.match.pct3,pc=VB.match.pct,all={};R.forEach(r=>KEYS.forEach(k=>{all[k]=(all[k]||0)+(r.tot[k]||0);}));
  const row=(name,n,t,cls)=>{const x=D(t);return `<tr class="${cls||""}"><td><b>${esc(name)}</b></td><td>${n}</td><td>${p3(x.hit)}</td><td>${t.k||0}</td><td>${x.pass==null?"–":x.pass.toFixed(2)}</td><td>${x.aces}</td><td>${pc(x.serveIn)}</td><td>${x.blocks%1?x.blocks.toFixed(1):x.blocks}</td><td>${x.digs}</td><td>${x.assists}</td></tr>`;};
  return `<div class="tstats"><div class="kicker">Team season stats</div><div class="tblwrap"><table class="ctbl"><thead><tr><th>Player</th><th>Matches</th><th>Hitting %</th><th>Kills</th><th>Pass</th><th>Aces</th><th>Serve in</th><th>Blocks</th><th>Digs</th><th>Assists</th></tr></thead>
    <tbody>${R.sort((a,b)=>b.n-a.n).map(r=>row(r.id===d.uid?"You":d.nameOf(r.id),r.n,r.tot)).join("")}${R.length>1?row("Team",Math.max(...R.map(r=>r.n)),all,"tot"):""}</tbody></table></div>
    <p class="small muted">Each player's own tracked numbers. Pass is the 0 to 3 average; hitting % = (kills − errors) ÷ attempts.</p></div>`;};
/* players on someone else's team see the same table, read-only */
VB.memberTeamStats=function(d){if(!d||!d.teams)return "";return d.teams.filter(x=>x.owner!==d.uid).map(x=>{const ids=d.membersOf(x.t);const h=VB.teamStatsHTML(x.owner+":"+x.t.id,[x.owner,...ids.filter(i=>i!==x.owner)],d);
    return /Team season stats<\/div><p/.test(h)?"":`<div class="card coach"><div class="kicker">${esc(x.t.name||"Team")}</div>${h}</div>`;}).join("");};

/* ---------- the sharing switch, shown in Squad once a card exists ---------- */
function shareCard(){const host=$("#coachHost");if(!host)return;const d=sq();let c=$("#shareReadyCard");
  if(!d||d.status!=="on"||!d.joined){if(c)c.remove();return;}
  if(!c){c=document.createElement("div");c.id="shareReadyCard";c.className="card";host.parentNode.insertBefore(c,host);}
  const on=!!prv().shareReady;
  c.innerHTML=`<div class="row" style="justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="kicker">Share readiness with my coaches</div>
    <p class="small muted">Coaches of teams you have joined see today's readiness score, your training load compared with usual, swings this week and any sore spots. Off by default. Nobody else sees it.</p></div>
    <label class="switch"><input type="checkbox" id="shareReady" ${on?"checked":""}><span>${on?"On":"Off"}</span></label></div>`;}
document.addEventListener("change",e=>{if(e.target.id!=="shareReady")return;prv().shareReady=e.target.checked;VB.save();shareCard();VB.ui&&VB.ui.toast&&VB.ui.toast(e.target.checked?"Your coaches can now see your readiness.":"Readiness is no longer shared.");});
const kick=()=>{clearTimeout(kick.t);kick.t=setTimeout(shareCard,250);};
window.addEventListener("hashchange",()=>{if((location.hash||"").startsWith("#squad"))kick();});
document.addEventListener("click",e=>{if(e.target.closest("#squadRoot"))kick();});
if(VB.v3&&VB.v3.onRoute)VB.v3.onRoute(v=>{if(v==="squad")kick();});
})();
