/* core.js: state, storage and the adaptive training engine. No DOM access in this file. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const EX=()=>window.VB_EXERCISES||[], CH=()=>window.VB_CHAINS||{}, MI=()=>window.VB_MUSCLE_INFO||{}, DR=()=>window.VB_DRILLS||[];

/* ---------- utils ---------- */
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
VB.iso=iso; VB.today=()=>iso(new Date());
VB.addDays=(ds,n)=>{const d=new Date(ds+"T12:00:00");d.setDate(d.getDate()+n);return iso(d);};
VB.weekStart=ds=>{const d=new Date(ds+"T12:00:00");d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d);};
VB.daysBetween=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5);
VB.shortDate=ds=>new Date(ds+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
VB.esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
VB.uid=uid;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- constants ---------- */
VB.TIER={none:0,few:1,varied:2};
VB.TIER_INFO={
  none:{name:"None",sub:"Bodyweight, a wall, a towel, a chair. A ball if you have one."},
  few:{name:"A few things",sub:"Bands, dumbbells or a kettlebell, a ball, a rope, a box or bench."},
  varied:{name:"Varied",sub:"Full gym: barbell and rack, cables, pull-up bar, med balls, plyo boxes."}};
VB.PLAYERS={solo:0,pair:1,small:2,team:3};
VB.PLAYERS_INFO={solo:"On my own",pair:"With one partner",small:"Small group, 3 to 5",team:"Full team"};
VB.GOALS=[["jump","Jump higher"],["power","Hit harder"],["serve","Serve tougher"],["pass","Pass cleaner"],["defense","Faster on defence"],["block","Block better"],["endurance","Last five sets"],["prevent","Stay injury free"]];
VB.LIMITS=[["shoulder","Shoulder"],["knee","Knee"],["ankle","Ankle"],["back","Lower back"],["finger","Fingers or wrist"]];
VB.ACTIONS=[["overall","Overall"],["jump","Jumping"],["hit","Hitting and serving"],["block","Blocking"],["pass","Passing and defence"],["land","Landing and injury-proofing"]];
VB.SKILLS={pass:"Passing",set:"Setting",serve:"Serving",attack:"Attacking",block:"Blocking",dig:"Digging",transition:"Transition",team:"Team play"};
VB.POS={
 outside:{label:"Outside hitter",w:{jump:1,hit:1,block:.6,pass:.9,land:1},skills:["attack","pass","serve","dig","block","transition"]},
 opposite:{label:"Opposite",w:{jump:1,hit:1,block:.9,pass:.4,land:1},skills:["attack","block","serve","dig","transition"]},
 middle:{label:"Middle blocker",w:{jump:1,hit:.8,block:1,pass:.2,land:1},skills:["block","attack","serve","transition"]},
 setter:{label:"Setter",w:{jump:.7,hit:.4,block:.7,pass:.6,land:.8},skills:["set","block","serve","dig","transition"]},
 libero:{label:"Libero",w:{jump:.2,hit:.1,block:0,pass:1,land:.6},skills:["pass","dig","set","transition"]},
 any:{label:"All-round player",w:{jump:.8,hit:.8,block:.6,pass:.8,land:.9},skills:["pass","set","serve","attack","dig","block"]}};
const GOAL_ACTION={jump:["jump",.4],power:["hit",.4],serve:["hit",.2],pass:["pass",.4],defense:["pass",.3],block:["block",.4],prevent:["land",.5]};
const GOAL_PROGRAM={jump:["jump"],power:["hitting"],serve:["hitting"],pass:["defense"],defense:["defense"],block:["jump"],prevent:["landing","armcare"],endurance:["core"]};
const GOAL_SKILL={serve:"serve",pass:"pass",defense:"dig",block:"block",power:"attack"};
const LIMIT_PROGRAM={shoulder:"armcare",knee:"landing",ankle:"landing",back:"core",finger:null};
VB.PROGRAMS={jump:"Vertical jump",hitting:"Hitting power",armcare:"Arm care",landing:"Landing and knee health",core:"Core",defense:"Defensive movement",mobility:"Mobility"};
VB.PHASES=[{name:"Build",note:"Learn the movements and add reps."},{name:"Build",note:"Same sessions, a little more work."},{name:"Push",note:"One extra set on strength and power work."},{name:"Deload and retest",note:"Less volume. Retest your vertical and film a skill."}];

/* technique faults the film analysis can report */
VB.FAULTS={
 knee_valgus:{name:"Knees collapsing inward",fix:"Push the knees out over the little toes when you load and when you land."},
 stiff_landing:{name:"Stiff landing",fix:"Land toe to heel and bend to a quarter squat so the muscles, not the joints, take the load."},
 one_leg_landing:{name:"Landing on one leg",fix:"Bring both feet down together, hip-width apart."},
 forward_drift:{name:"Drifting forward in the air",fix:"Plant with the heels first and jump up, not out."},
 shallow_dip:{name:"Shallow dip before the jump",fix:"Load deeper and faster so the legs have range to push through."},
 deep_dip:{name:"Dip too deep and slow",fix:"Shorten the dip. A quick quarter-to-half squat returns more energy."},
 no_arm_swing:{name:"Little or no arm swing",fix:"Throw both arms back on the load and drive them up through take-off."},
 incomplete_extension:{name:"Not fully extending at take-off",fix:"Finish tall through hips, knees and ankles before your feet leave the floor."},
 slow_last_steps:{name:"Slow last two steps",fix:"Accelerate into a long penultimate step and a fast close."},
 low_elbow:{name:"Hitting elbow drops below the shoulder",fix:"Draw the elbow back high, level with or above the ear."},
 bent_arm_contact:{name:"Contact with a bent arm",fix:"Reach to full extension and meet the ball as high as you can."},
 contact_behind:{name:"Contact behind the head",fix:"Stay behind the ball so contact is in front of the hitting shoulder."},
 no_trunk_rotation:{name:"No hip and shoulder rotation",fix:"Open the shoulders to the ball, then rotate hips first and shoulders after."},
 upright_posture:{name:"Standing tall in the pass",fix:"Sit lower with shoulders ahead of knees before the ball arrives."},
 bent_elbows_platform:{name:"Bent elbows in the platform",fix:"Lock the elbows and press the wrists down to make one flat surface."},
 swinging_platform:{name:"Swinging the arms at the ball",fix:"Keep the platform below shoulder height and lift with the legs."},
 narrow_base:{name:"Feet too close together",fix:"Set the feet wider than the shoulders."},
 weight_back:{name:"Weight on the heels",fix:"Lean forward onto the balls of the feet."},
 low_set_contact:{name:"Setting from below the forehead",fix:"Take the ball above the hairline with the hands up early."},
 no_leg_drive_set:{name:"Setting with the arms only",fix:"Extend the legs and arms together."},
 toss_off:{name:"Inconsistent serve toss",fix:"Lift the ball with a still wrist, in front of the hitting shoulder."},
 block_arm_drop:{name:"Dropping the arms before the block",fix:"Keep the hands above the shoulders and jump from there."},
 no_penetration:{name:"Hands going up, not over",fix:"Press the hands across the net and shrug the shoulders to the ears."},
 heels_lift:{name:"Heels lifting in the squat",fix:"Keep the whole foot down. Work on ankle mobility."},
 forward_lean:{name:"Chest falling forward",fix:"Brace and keep the chest up. Strengthen the upper back and core."},
 shallow_depth:{name:"Squat stops short",fix:"Lower until the thighs are at least parallel, with control."}};
VB.MOVES={
 jump:{name:"Vertical jump test",tip:"Side-on. Stand still for a second, jump, land, stay in frame.",airborne:true,faults:["shallow_dip","deep_dip","no_arm_swing","incomplete_extension","forward_drift","stiff_landing","one_leg_landing","knee_valgus"]},
 spike:{name:"Spike or attack",tip:"Side-on from your hitting side, far enough back to see the whole approach and landing.",airborne:true,faults:["slow_last_steps","no_arm_swing","low_elbow","bent_arm_contact","contact_behind","no_trunk_rotation","forward_drift","stiff_landing","one_leg_landing","knee_valgus"]},
 pass:{name:"Serve receive or pass",tip:"From the side or front quarter, whole body in frame as the ball arrives.",faults:["upright_posture","bent_elbows_platform","swinging_platform","narrow_base","weight_back"]},
 set:{name:"Set",tip:"Side-on, whole body and the ball in frame.",faults:["low_set_contact","no_leg_drive_set","upright_posture"]},
 serve:{name:"Serve",tip:"Side-on from your hitting side, toss included.",faults:["toss_off","low_elbow","bent_arm_contact","contact_behind","no_trunk_rotation"]},
 block:{name:"Block",tip:"Side-on along the net, or from behind you.",airborne:true,faults:["block_arm_drop","no_penetration","forward_drift","stiff_landing","one_leg_landing","knee_valgus"]},
 squat:{name:"Squat or other exercise",tip:"Front or side view, feet and head in frame.",faults:["knee_valgus","heels_lift","forward_lean","shallow_depth"]}};

/* ---------- state ---------- */
const KEY="vb-journey-v2", OLDKEY="vb-journey-v1";
const blank=()=>({v:2,updatedAt:0,profile:null,muscles:[],tech:{},chain:{},drill:{},drillLast:{},sessions:[],tests:[],weights:[],faults:{},film:[],coach:[],queue:[],today:null,blockStart:null,jumpBias:"strength",program:null,customPrograms:[],social:{joined:false,friends:[],shares:[],meets:[],rsvp:{}}});
const OLDM={delts:["ant_delt","mid_delt"],cuff:["infraspinatus","supraspinatus"],chest:["pec_major"],biceps:["biceps"],triceps:["triceps"],forearms:["forearm_flex","forearm_ext"],abs:["rectus_abs"],obliques:["obliques"],traps:["lower_traps","rhomboids"],lats:["lats"],lowback:["erectors"],glutes:["glute_max","glute_med"],hips:["hip_flexors","adductors"],quads:["rectus_fem","vastus_lat","vmo"],hams:["biceps_fem","medial_hams"],calves:["gastroc","soleus"]};
const OLDT={pass:"pass",set:"set",float:"serve",jumpserve:"serve",spike:"attack",block:"block",dig:"dig",receive:"team"};
VB.TECH_SKILL=OLDT;
function migrate(s){
  const b=blank();if(!s||typeof s!=="object")return b;
  if(s.v===2){for(const k in b)if(s[k]===undefined||s[k]===null&&Array.isArray(b[k]))s[k]=b[k];
    ["muscles","sessions","tests","weights","film","coach","queue","customPrograms"].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[];});
    s.tests=s.tests.filter(t=>!(t&&t.kind==="vert"&&(!(+t.cm>=3)||+t.cm>130)));(s.film||[]).forEach(r=>{if(r&&r.jump!=null&&(r.jump<3||r.jump>130))r.jump=null;});
    ["tech","chain","drill","drillLast","faults"].forEach(k=>{if(!s[k]||typeof s[k]!=="object")s[k]={};});
    return s;}
  // v1 -> v2
  b.updatedAt=+s.updatedAt||0;
  if(s.profile){const p=Object.assign({},s.profile),e=p.equip||[];p.tier=e.includes("gym")?"varied":(e.includes("db")||e.includes("band"))?"few":"none";p.partner=e.includes("court")?"pair":"solo";delete p.equip;b.profile=p;b.blockStart=VB.today();}
  (s.muscles||[]).forEach(id=>(OLDM[id]||[]).forEach(n=>{if(!b.muscles.includes(n))b.muscles.push(n);}));
  b.tech=s.tech||{};
  (s.sessions||[]).forEach(x=>{if(!x||!x.date)return;const items=[];if(x.tech&&x.att)items.push({k:"drill",id:null,skill:OLDT[x.tech]||"pass",suc:x.suc||0,att:x.att});
    b.sessions.push({id:x.id||uid(),ex:x.ex,date:x.date,type:x.type||"skills",mins:x.mins||0,rpe:x.rpe||null,items,notes:x.notes||"",legacyMuscles:x.muscles||[]});
    if(x.jump!=null)b.tests.push({date:x.date,kind:"vert",cm:x.jump,src:"manual",ex:x.ex});if(x.weight!=null)b.weights.push({date:x.date,kg:x.weight,ex:x.ex});});
  return b;}
VB.state=blank();
VB.reset=function(){VB.state=blank();try{localStorage.removeItem(OLDKEY);}catch(e){}VB.save();};
VB.loadLocal=function(){try{let raw=localStorage.getItem(KEY);if(!raw)raw=localStorage.getItem(OLDKEY);if(raw)VB.state=migrate(JSON.parse(raw));}catch(e){}};
const localSave=()=>{try{localStorage.setItem(KEY,JSON.stringify(VB.state));}catch(e){}};
let cloudRef=null,cloudTimer=0,cloudBusy=false,cloudDirty=false;
VB.onSync=function(){};
VB.save=function(){VB.state.updatedAt=Date.now();localSave();if(VB.squad)VB.squad.changed();if(cloudRef){cloudDirty=true;clearTimeout(cloudTimer);cloudTimer=setTimeout(push,800);}};
async function push(){if(!cloudRef||cloudBusy||!cloudDirty)return;cloudBusy=true;cloudDirty=false;
  try{await cloudRef.set({json:JSON.stringify(VB.state),updatedAt:VB.state.updatedAt});}
  catch(e){if(e&&(e.code==="invalid_argument"||e.code==="revoked"||e.code==="quota_exceeded")){cloudRef=null;VB.onSync("device");}else cloudDirty=true;}
  cloudBusy=false;if(cloudDirty&&cloudRef){clearTimeout(cloudTimer);cloudTimer=setTimeout(push,3000);}}
VB.initCloud=async function(onReplace){
  try{
    if(!window.claude||!window.claude.use){VB.onSync("device");VB.net=null;VB.onNet&&VB.onNet();return;}
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(!db||!user){VB.onSync("device");VB.net=null;VB.onNet&&VB.onNet();return;}
    const id=await user.id();if(!id){VB.onSync("device");VB.net=null;VB.onNet&&VB.onNet();return;}
    VB.net={db,user,uid:id};
    const ref=db.doc("data/users/"+id+"/journey");
    const snap=await Promise.race([ref.get(),new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),10000))]);
    cloudRef=ref;
    if(snap.exists){let remote=null;try{remote=migrate(JSON.parse(snap.data().json));}catch(e){}
      if(remote&&remote.updatedAt>=VB.state.updatedAt){VB.state=remote;localSave();onReplace&&onReplace();}
      else if(VB.state.updatedAt){cloudDirty=true;push();}}
    else if(VB.state.updatedAt){cloudDirty=true;push();}
    VB.onSync("cloud");VB.onNet&&VB.onNet();
  }catch(e){VB.onSync("device");VB.onNet&&VB.onNet();}
};

/* ---------- units ---------- */
const imp=()=>!!(VB.state.profile&&VB.state.profile.units==="imperial");
VB.imp=imp;
VB.lenOut=cm=>cm==null?null:(imp()?Math.round(cm/2.54*10)/10:Math.round(cm*10)/10);
VB.lenIn=v=>v===""||v==null||isNaN(+v)?null:(imp()?+v*2.54:+v);
VB.wOut=kg=>kg==null?null:(imp()?Math.round(kg*2.2046*10)/10:Math.round(kg*10)/10);
VB.wIn=v=>v===""||v==null||isNaN(+v)?null:(imp()?+v/2.2046:+v);
VB.lu=()=>imp()?"in":"cm"; VB.wu=()=>imp()?"lb":"kg";

/* ---------- programs: prebuilt and custom ---------- */
const ALLB={prep:true,skills:true,power:true,strength:true,care:true};
VB.PREBUILT=[
 {id:"auto",name:"Adaptive all-round",tag:"Ongoing · built from your profile",weeks:0,w:{},skill:null,
  desc:"The default. Balances every pillar by your position, goals and focus muscles, and rebalances as your results come in.",best:"Anyone who wants the plan to decide.",outline:["Skills and physical work alternate in emphasis","Priority follows your position and focus muscles","Film faults and load spikes adjust each session"]},
 {id:"vert8",name:"Vertical jump",tag:"8 weeks · jump higher",weeks:8,w:{jump:1,landing:.45,mobility:.2},skill:.22,power:2,skills:["attack","block"],
  desc:"Leg strength first, then fast and reactive jumping, with landing control in every session so the extra height is safe to use.",best:"Hitters and blockers chasing reach.",outline:["Weeks 1 to 3: squat, hinge and calf strength with stuck landings","Weeks 4 to 6: loaded and approach jumps, fewer reps, full rest","Weeks 7 to 8: reactive jumps, then retest your vertical on film"]},
 {id:"power",name:"Hit harder",tag:"6 weeks · arm speed and rotation",weeks:6,w:{hitting:1,core:.6,jump:.35,armcare:.4},skill:.35,power:1,skills:["attack","serve"],
  desc:"Rotational core power, pulling strength and overhead speed, paired with hitting and serving drills and enough arm care to absorb it.",best:"Outside hitters, opposites and jump servers.",outline:["Rotation and anti-rotation core in every session","Pulling and overhead strength, then throws","Hitting and serving drills scored each time"]},
 {id:"armor",name:"Bulletproof shoulder",tag:"6 weeks · arm care",weeks:6,w:{armcare:1,mobility:.5,core:.3,hitting:.3},skill:.3,power:1,skills:["serve","attack","set"],
  desc:"Rotator cuff, scapular control and deceleration strength for the arm that swings hundreds of times a week.",best:"Anyone with a sore or overworked hitting shoulder.",outline:["Cuff and scapular work opens every session","Deceleration strength for the back of the shoulder","Thoracic and shoulder mobility to free the swing"]},
 {id:"knees",name:"Knees and ankles",tag:"6 weeks · landing health",weeks:6,w:{landing:1,mobility:.45,jump:.2,core:.25},skill:.25,power:0,
  desc:"Tendon-loading isometrics, landing mechanics, hamstring and hip strength. Jump volume is held down while the tissues catch up.",best:"Jumper's knee, rolled ankles, or a heavy match schedule.",outline:["Isometric tendon holds and slow strength","Stick landings before any jumping","Hip, hamstring and ankle stability every week"]},
 {id:"defense",name:"Back-row defence",tag:"6 weeks · passing and digging",weeks:6,w:{defense:1,core:.4,landing:.3,mobility:.3},skill:.55,power:1,skills:["pass","dig","transition","serve"],
  desc:"Low-posture strength, lateral speed and a lot of scored passing and digging.",best:"Liberos, defensive specialists and outsides who pass.",outline:["More than half of each session is ball work","Lateral speed and low holds for the legs","Passing and digging standards rise as you meet them"]},
 {id:"preseason",name:"Pre-season build",tag:"8 weeks · everything",weeks:8,w:{jump:.6,hitting:.5,landing:.5,core:.5,defense:.4,armcare:.45,mobility:.3},skill:.4,power:2,vol:1,
  desc:"A broad, higher-volume block that raises strength, jump, arm and skill work together before the season starts.",best:"The two months before competition.",outline:["One extra set on main work","Every pillar trained each week","Skills at 40% of each session"]},
 {id:"inseason",name:"In-season maintenance",tag:"Ongoing · stay fresh",weeks:0,w:{armcare:.6,landing:.5,core:.4,mobility:.4},skill:.25,power:1,vol:-1,
  desc:"Short, low-volume sessions that keep strength and protect shoulders and knees between matches.",best:"Weeks with matches and team practice.",outline:["One set less than usual","Arm care and landing work kept in","Just enough strength to hold your gains"]},
 {id:"skills",name:"Skills first",tag:"6 weeks · ball control",weeks:6,w:{core:.3,mobility:.3},skill:.68,power:1,
  desc:"Two thirds of every session is scored drills across your position's skills. Physical work is trimmed to the essentials.",best:"Players newer to the game or returning after time off.",outline:["Three or more drills a session","Levels move up when you meet the standard twice","Short strength and core finishers"]},
 {id:"quick",name:"Quick session, no equipment",tag:"Ongoing · about 25 minutes",weeks:0,w:{jump:.4,core:.5,landing:.4},skill:.3,power:1,mins:20,tier:"none",
  desc:"A compact bodyweight session for travel days and busy weeks. One drill, one jump, two strength moves, one core.",best:"When time and space are short.",outline:["About 25 minutes including warm-up","Bodyweight only","Still logged and progressed"]}
];
VB.PREBUILT.push(...(window.VB_POSPROG||[]));
VB.programDef=function(id){return VB.PREBUILT.find(p=>p.id===id)||(VB.state.customPrograms||[]).find(p=>p.id===id)||null;};
VB.activeProgram=function(){const st=VB.state,pr=st.program||{id:"auto"},def=VB.programDef(pr.id)||VB.PREBUILT[0];
  const start=pr.start||st.blockStart||VB.today(),days=Math.max(0,VB.daysBetween(start,VB.today())),week=Math.floor(days/7)+1;
  let d2=def,phase=null;if(def.phases){phase=def.phases.find(f=>week>=f.from&&week<=f.to)||def.phases[def.phases.length-1];d2=Object.assign({},def,{w:phase.w,skill:phase.skill,power:phase.power,vol:phase.vol||0,skills:phase.skills,drills:phase.drills,phase});}
  return {def:d2,phase,start,week,finished:!!def.weeks&&week>def.weeks,pct:def.weeks?Math.min(100,Math.round(days/(def.weeks*7)*100)):null};};
VB.startProgram=function(id){const def=VB.programDef(id);if(!def)return;const st=VB.state;st.program={id,start:VB.today()};st.blockStart=VB.today();
  VB.invalidatePlan();VB.log("Program started: "+def.name+(def.weeks?", "+def.weeks+" weeks.":"."),"info");VB.save();};
VB.saveCustom=function(def){const st=VB.state;def.custom=true;if(!def.id)def.id="c_"+uid();const i=st.customPrograms.findIndex(p=>p.id===def.id);if(i>=0)st.customPrograms[i]=def;else st.customPrograms.push(def);VB.save();return def.id;};
VB.deleteCustom=function(id){const st=VB.state;st.customPrograms=st.customPrograms.filter(p=>p.id!==id);if(st.program&&st.program.id===id){st.program=null;VB.invalidatePlan();}VB.save();};

/* ---------- coach log ---------- */
VB.log=function(msg,kind){VB.state.coach.unshift({d:VB.today(),msg,kind:kind||"info"});if(VB.state.coach.length>80)VB.state.coach.length=80;};

/* ---------- priority model ---------- */
function actionWeights(){const p=VB.state.profile,pos=VB.POS[p&&p.pos]||VB.POS.any,w=Object.assign({},pos.w);
  (p&&p.goals||[]).forEach(g=>{const a=GOAL_ACTION[g];if(a)w[a[0]]=(w[a[0]]||0)+a[1];});return w;}
VB.musclePrio=function(id,action){const m=MI()[id];if(!m)return 1;const pr=m.priority||{};
  if(action&&action!=="overall")return pr[action]||1;
  const w=actionWeights();let s=0,t=0;for(const a in w){s+=w[a]*(pr[a]||1);t+=w[a];}return t?s/t:(pr.overall||1);};
VB.rankMuscles=function(action){return Object.keys(MI()).map(id=>({id,p:VB.musclePrio(id,action)})).sort((a,b)=>b.p-a.p);};
VB.tierOf=p=>p>=4.2?0:p>=3.3?1:p>=2.4?2:3;
VB.TIER_NAMES=["Engine","Key","Support","Maintenance"];

/* sets per muscle over the last n days */
VB.muscleVolume=function(days){const out={},from=VB.addDays(VB.today(),-days),exm=VB.exMap();
  VB.state.sessions.forEach(s=>{if(s.date<from)return;(s.items||[]).forEach(it=>{if(it.k!=="ex")return;const e=exm[it.id];if(!e)return;
    (e.primary||[]).forEach(m=>out[m]=(out[m]||0)+(it.sets||0));(e.secondary||[]).forEach(m=>out[m]=(out[m]||0)+(it.sets||0)*.5);});});return out;};
let _exm=null;VB.exMap=function(){if(!_exm||_exm.__n!==EX().length){_exm={};EX().forEach(e=>_exm[e.id]=e);Object.defineProperty(_exm,"__n",{value:EX().length,enumerable:false});}return _exm;};
let _drm=null;VB.drMap=function(){if(!_drm){_drm={};DR().forEach(d=>_drm[d.id]=d);}return _drm;};
VB.openFaults=function(){return Object.entries(VB.state.faults).filter(e=>e[1]&&e[1].open).sort((a,b)=>(b[1].sev||0)-(a[1].sev||0)).map(e=>e[0]);};

function userTier(){const p=VB.state.profile,t=VB.TIER[p&&p.tier]||0,d=VB.activeProgram().def;return d.tier?Math.min(t,VB.TIER[d.tier]||0):t;}
function userPlayers(){const p=VB.state.profile;return VB.PLAYERS[p&&p.partner]||0;}
function limits(){const p=VB.state.profile;return p&&p.limits||[];}

/* exercises of a chain the athlete can do, grouped by difficulty step */
VB.chainSteps=function(c){const t=userTier(),lim=limits();let list=EX().filter(e=>e.chain===c&&(VB.TIER[e.tier]||0)<=t);
  const steps=[...new Set(list.map(e=>e.step))].sort((a,b)=>a-b);
  return steps.map(st=>{let opts=list.filter(e=>e.step===st);const safe=opts.filter(e=>!(e.caution||[]).some(x=>lim.includes(x)));
    return {step:st,opts:(safe.length?safe:opts).sort((a,b)=>(VB.TIER[b.tier]||0)-(VB.TIER[a.tier]||0)),flag:!safe.length};});};
function startIndex(n){const exp=VB.state.profile&&VB.state.profile.exp;const i={beginner:0,intermediate:1,advanced:2,elite:2}[exp]||0;return clamp(i,0,Math.max(0,n-2));}
VB.chainState=function(c){const steps=VB.chainSteps(c);if(!steps.length)return null;
  let cs=VB.state.chain[c];if(!cs){cs=VB.state.chain[c]={i:startIndex(steps.length),ex:null,reps:null,load:null,top:0,bumps:0,down:0,extra:0,last:null};}
  cs.i=clamp(cs.i,0,steps.length-1);const st=steps[cs.i];let ex=st.opts.find(e=>e.id===cs.ex)||st.opts[0];
  if(cs.ex!==ex.id){cs.ex=ex.id;cs.reps=null;}
  if(cs.reps==null)cs.reps=ex.reps[0];cs.reps=clamp(cs.reps,ex.reps[0],ex.reps[1]);
  return {cs,ex,steps,flag:st.flag};};

/* ---------- load management ---------- */
VB.loadStats=function(){const t=VB.today(),S=VB.state.sessions;let a=0,c=0,n28=0;
  S.forEach(s=>{const d=VB.daysBetween(s.date,t);if(d<0||d>27)return;const l=(s.mins||0)*(s.rpe||5);c+=l;n28++;if(d<7)a+=l;});
  const chronic=c/4,first=S.length?S.reduce((m,s)=>s.date<m?s.date:m,t):t;
  const enough=VB.daysBetween(first,t)>=14&&n28>=4;
  return {acute:a,chronic,acwr:enough&&chronic>0?a/chronic:null};};
VB.phase=function(){const st=VB.state.blockStart||VB.today();const wk=Math.floor(Math.max(0,VB.daysBetween(st,VB.today()))/7);return {week:wk%4+1,block:Math.floor(wk/4)+1,info:VB.PHASES[wk%4]};};
VB.weekly=function(){const m={};VB.state.sessions.forEach(s=>{const w=VB.weekStart(s.date);(m[w]=m[w]||{mins:0,n:0,load:0});m[w].mins+=s.mins||0;m[w].n++;m[w].load+=(s.mins||0)*(s.rpe||5);});return m;};
VB.streak=function(){const target=VB.state.profile?VB.state.profile.days:3,w=VB.weekly();let k=VB.weekStart(VB.today()),n=0;if(!(w[k]&&w[k].n>=target))k=VB.addDays(k,-7);while(w[k]&&w[k].n>=target){n++;k=VB.addDays(k,-7);}return n;};

/* ---------- chain scoring ---------- */
VB.chainScores=function(){const mi=MI(),chains=CH(),p=VB.state.profile||{},vol=VB.muscleVolume(7),open=VB.openFaults(),lim=limits(),t=userTier();
  const need={};Object.keys(mi).forEach(id=>{let n=VB.musclePrio(id)/5;if(VB.state.muscles.includes(id))n+=.35;n-=Math.min(1,(vol[id]||0)/12)*.35;need[id]=Math.max(.05,n);});
  const wantProg={};(p.goals||[]).forEach(g=>(GOAL_PROGRAM[g]||[]).forEach(x=>wantProg[x]=(wantProg[x]||0)+.25));
  lim.forEach(l=>{const x=LIMIT_PROGRAM[l];if(x)wantProg[x]=(wantProg[x]||0)+.3;});
  const pdef=VB.activeProgram().def,pw=pdef.w||{},pins=pdef.chains||[];
  const lastDone={};VB.state.sessions.forEach(s=>(s.items||[]).forEach(it=>{if(it.k==="ex"&&it.chain&&(!lastDone[it.chain]||s.date>lastDone[it.chain]))lastDone[it.chain]=s.date;}));
  const out={};
  for(const c in chains){const exs=EX().filter(e=>e.chain===c&&(VB.TIER[e.tier]||0)<=t);if(!exs.length)continue;
    const w={};exs.forEach(e=>{(e.primary||[]).forEach(m=>w[m]=(w[m]||0)+1/exs.length);(e.secondary||[]).forEach(m=>w[m]=(w[m]||0)+.4/exs.length);});
    let s=0,tw=0;for(const m in w){s+=(need[m]||0)*w[m];tw+=w[m];}s=tw?s/Math.sqrt(tw):0;
    const why=[];let top=null,tv=0;for(const m in w){const v=(need[m]||0)*w[m];if(v>tv){tv=v;top=m;}}
    (chains[c].programs||[]).forEach(pr=>{if(wantProg[pr]){s+=wantProg[pr];why.push(VB.PROGRAMS[pr]+" is one of your goals");}});
    let pb=0;(chains[c].programs||[]).forEach(pr=>{if(pw[pr])pb=Math.max(pb,pw[pr]);});if(pb){s+=pb*1.7;if(pb>=.5)why.unshift("Part of your program: "+pdef.name);}
    if(pins.includes(c)){s+=5;why.unshift("You pinned this in "+pdef.name);}
    const fx=open.find(f=>exs.some(e=>(e.fixes||[]).includes(f)));if(fx){s+=.8;why.unshift("Corrects: "+VB.FAULTS[fx].name.toLowerCase());}
    if(VB.state.jumpBias==="reactive"&&(c==="jump_reactive"||c==="jump_vertical"))s+=.3;
    if(VB.state.jumpBias==="strength"&&(c==="squat"||c==="hinge"))s+=.15;
    const ld=lastDone[c],ago=ld?VB.daysBetween(ld,VB.today()):99;
    if(ago<2)s*=.35;else if(ago>6&&ld){s*=1.15;why.push("Not trained for "+ago+" days");}
    if(top&&mi[top]){if(VB.state.muscles.includes(top))why.push("Trains your focus muscle: "+mi[top].common.toLowerCase());else why.push("High priority for your position: "+mi[top].common.toLowerCase());}
    out[c]={score:s,why:why[0]||chains[c].why||"",fault:fx||null};}
  return out;};

/* ---------- drills ---------- */
VB.skillLevel=function(skill){let d=VB.state.drill[skill];if(!d){const exp=VB.state.profile&&VB.state.profile.exp;d=VB.state.drill[skill]={lvl:{beginner:1,intermediate:2,advanced:3,elite:3}[exp]||1,up:0,down:0};}return d;};
VB.drillFits=function(d){return (VB.TIER[d.tier]||0)<=userTier()&&(VB.PLAYERS[d.players]||0)<=userPlayers();};
VB.drillFor=function(skill,exclude,fault){const lvl=VB.skillLevel(skill).lvl;
  let list=DR().filter(d=>(fault?(d.fixes||[]).includes(fault):d.skill===skill)&&VB.drillFits(d)&&!(exclude||[]).includes(d.id));
  if(!list.length)return null;const tgt=fault?null:lvl;
  list.sort((a,b)=>{const da=tgt?Math.abs(a.level-tgt)+(a.level>tgt?.5:0):Math.abs(a.level-VB.skillLevel(a.skill).lvl),db=tgt?Math.abs(b.level-tgt)+(b.level>tgt?.5:0):Math.abs(b.level-VB.skillLevel(b.skill).lvl);
    if(da!==db)return da-db;const la=VB.state.drillLast[a.id]||"",lb=VB.state.drillLast[b.id]||"";return la<lb?-1:la>lb?1:0;});
  return list[0];};
VB.skillOrder=function(){const p=VB.state.profile||{},pos=VB.POS[p.pos]||VB.POS.any,order=pos.skills.slice();
  (p.goals||[]).forEach(g=>{const s=GOAL_SKILL[g];if(s){const i=order.indexOf(s);if(i>0){order.splice(i,1);order.unshift(s);}else if(i<0)order.unshift(s);}});
  Object.entries(VB.state.tech).forEach(([id,st])=>{const s=OLDT[id]||((window.VB_TECHS||[]).find(t=>t.id===id)||{}).skill;if(st==="practising"&&s&&!order.includes(s))order.push(s);});
  return order;};

/* ---------- session builder ---------- */
const EX_MIN={strength:2,power:1.6,plyo:1.5,stability:1.3,armcare:1.2,core:1.3,mobility:1};
function exItem(c,block,why,phaseAdj){const r=VB.chainState(c);if(!r)return null;const {cs,ex,flag}=r,ch=CH()[c]||{};
  let sets=ex.sets+(cs.extra||0);if(phaseAdj>0&&(ex.kind==="strength"||ex.kind==="power"))sets+=1;if(phaseAdj<0)sets-=1;sets=clamp(sets,ex.kind==="mobility"?1:2,5);
  return {key:"ex:"+ex.id,k:"ex",id:ex.id,chain:c,block,sets,reps:cs.reps,load:cs.load,why,flag,min:Math.round(sets*(EX_MIN[ex.kind]||1.5)+ (ex.perSide?sets*.6:0)),chainName:ch.name||c};}
function drillItem(d,block,why){return {key:"dr:"+d.id,k:"drill",id:d.id,skill:d.skill,block,why,min:d.minutes||8};}
VB.buildSession=function(feel){const st=VB.state,p=st.profile;if(!p)return null;
  const scores=VB.chainScores(),chains=CH(),ph=VB.phase(),ls=VB.loadStats(),open=VB.openFaults(),lim=limits();
  const pa=VB.activeProgram(),pd=pa.def,B=Object.assign({},ALLB,pd.blocks||{}),mins=pd.mins||p.mins||60;
  const f=feel||"normal",easeLoad=ls.acwr!=null&&ls.acwr>1.4,ease=f==="beat"||easeLoad;
  const phaseAdj=(ease?-1:ph.week===3?1:ph.week===4?-1:0)+(ease?0:(pd.vol||0));
  let budget=mins*(f==="beat"?.7:f==="fresh"?1.05:1)-5;
  const n=st.sessions.filter(s=>!s.ex).length,manyDays=(p.days||3)>=3;
  let skillShare=manyDays?(n%2===0?.4:.25):.33;if(userPlayers()===0&&userTier()===0)skillShare=Math.min(skillShare,.35);
  if(pd.skill!=null)skillShare=Math.max(0,pd.skill+(manyDays?(n%2===0?.06:-.06):0));if(!B.skills)skillShare=0;
  if(pa.finished)notes.push("You have finished "+pd.name+". Retest, then pick your next program in the Programs tab.");
  const items=[],used=new Set(),usedDr=[];const notes=[];
  if(easeLoad)notes.push("Your last 7 days were "+Math.round(ls.acwr*100)+"% of your 4-week average load. Today is trimmed: one set less and no jumping.");
  if(f==="beat")notes.push("You said you feel beat up, so volume is cut by about a third and jumping is replaced with landing control.");
  if(ph.week===4)notes.push("Deload week. Retest your vertical and film one skill so the plan can recalibrate.");
  const byKind=k=>Object.keys(scores).filter(c=>(chains[c]||{}).kind===k&&!used.has(c)).sort((a,b)=>scores[b].score-scores[a].score);
  const take=(c,block)=>{const it=exItem(c,block,scores[c].why,phaseAdj);if(it){items.push(it);used.add(c);budget-=it.min;}return it;};
  // prep
  if(B.prep&&mins>20)byKind("mobility").slice(0,mins<=30?1:2).forEach(c=>take(c,"Prep"));
  // fixes from film
  let skillMin=budget*skillShare;
  open.slice(0,2).forEach(fid=>{const d=VB.drillFor(null,usedDr,fid);if(d){items.push(drillItem(d,"Fix","Corrects: "+VB.FAULTS[fid].name.toLowerCase()));usedDr.push(d.id);skillMin-=d.minutes||8;budget-=d.minutes||8;}});
  // queued by the athlete
  st.queue.forEach(id=>{const d=VB.drMap()[id];if(d&&!usedDr.includes(id)){items.push(drillItem(d,"Skills","You added this drill"));usedDr.push(id);skillMin-=d.minutes||8;budget-=d.minutes||8;}});
  // skills
  (pd.drills||[]).filter(id=>VB.drMap()[id]&&VB.drillFits(VB.drMap()[id])&&!usedDr.includes(id)).sort((a,b)=>((st.drillLast[a]||"")<(st.drillLast[b]||"")?-1:1)).slice(0,2).forEach(id=>{const d=VB.drMap()[id];if(skillShare<=0)return;items.push(drillItem(d,"Skills","You pinned this in "+pd.name));usedDr.push(id);skillMin-=d.minutes||8;budget-=d.minutes||8;});
  const order=pd.skills&&pd.skills.length?pd.skills:VB.skillOrder();let si=n,guard=0;
  while(skillMin>4&&guard++<order.length*2){const sk=order[si++%order.length],d=VB.drillFor(sk,usedDr);if(!d)continue;if(skillMin<(d.minutes||8)*.6&&usedDr.length)break;
    items.push(drillItem(d,"Skills",VB.SKILLS[sk]+", level "+VB.skillLevel(sk).lvl+" of 4"));usedDr.push(d.id);skillMin-=d.minutes||8;budget-=d.minutes||8;}
  // power / plyo
  const kneeCare=lim.includes("knee")||lim.includes("ankle");
  if(!B.power){}
  else if(ease||pd.power===0){const c=["landing","ankle_stability"].find(c=>scores[c]&&!used.has(c));if(c)take(c,"Power");}
  else{const pw=[...byKind("plyo"),...byKind("power")].sort((a,b)=>scores[b].score-scores[a].score);
    const cnt=kneeCare?1:pd.power!=null?Math.min(pd.power,mins>=45?2:1):mins>=75?2:1;pw.slice(0,cnt).forEach(c=>take(c,"Power"));
    if(kneeCare&&scores.landing&&!used.has("landing"))take("landing","Power");}
  // arm care + core (reserve time)
  const tail=[];const ac=byKind("armcare")[0],co=byKind("core")[0],sb=byKind("stability")[0];
  const pwt=pd.w||{},acs=byKind("armcare"),cos=byKind("core");if(B.care){[ac,co].forEach(c=>{if(c)tail.push(c);});if((pwt.armcare||0)>=.8&&acs[1])tail.push(acs[1]);if((pwt.core||0)>=.6&&cos[1])tail.push(cos[1]);if(mins>=75&&sb)tail.push(sb);if(mins<=20)tail.length=Math.min(tail.length,1);}
  const tailMin=tail.length*4;
  // strength
  const str=byKind("strength");let k=0;
  if(B.strength){while(budget-tailMin>5&&k<str.length&&k<5){take(str[k++],"Strength");}
  const minStr=mins>=45&&budget-tailMin>-6?2:1;while(k<minStr&&k<str.length)take(str[k++],"Strength");}
  tail.forEach(c=>{if(!used.has(c))take(c,"Arm care and core");});
  const est=()=>items.reduce((x,i)=>x+i.min,0)+5,dropLast=b=>{const list=items.filter(i=>i.block===b);if(list.length<2)return false;items.splice(items.lastIndexOf(list[list.length-1]),1);return true;};
  let g2=0;while(est()>mins*(f==="beat"?.8:1.12)&&g2++<6){if(!(pd.skill>=.5?dropLast("Strength")||dropLast("Skills"):dropLast("Skills")||dropLast("Strength"))&&!dropLast("Arm care and core"))break;}
  const blocks=["Prep","Fix","Skills","Power","Strength","Arm care and core"];
  items.sort((a,b)=>blocks.indexOf(a.block)-blocks.indexOf(b.block));
  return {date:VB.today(),feel:f,items,notes,est:items.reduce((a,i)=>a+i.min,0)+5,phase:ph.week,program:pd.id};};
VB.ensureToday=function(feel){const st=VB.state;if(!st.profile)return null;
  if(!st.today||(feel&&feel!==st.today.plan.feel)){const old=st.today?st.today.done:{},plan=VB.buildSession(feel||"normal"),done={};plan.items.forEach(i=>{if(old[i.key])done[i.key]=old[i.key];});st.today={plan,done};VB.save();}
  return st.today;};
VB.invalidatePlan=function(){const st=VB.state,t=st.today;if(!t)return;if(!Object.keys(t.done||{}).length){st.today=null;return;}
  // a session is in progress: rebuild around what is already ticked
  const plan=VB.buildSession(t.plan.feel),done={};t.plan.items.forEach(i=>{if(t.done[i.key]){done[i.key]=t.done[i.key];if(!plan.items.some(x=>x.key===i.key))plan.items.unshift(i);}});
  const blocks=["Prep","Fix","Skills","Power","Strength","Arm care and core"];plan.items.sort((a,b)=>blocks.indexOf(a.block)-blocks.indexOf(b.block));st.today={plan,done};};

/* ---------- adaptation ---------- */
function adaptExercise(it,r){ // r: {sets,reps,load,feel}
  const res=VB.chainState(it.chain);if(!res)return;const {cs,ex,steps}=res,name=ex.name,u=ex.unit==="s"?" s":ex.unit==="m"?" m":"";
  cs.last=VB.today();if(r.load!=null&&!isNaN(r.load))cs.load=r.load;
  const hit=r.reps>=it.reps&&r.sets>=it.sets&&r.feel!=="hard", miss=r.feel==="hard"||r.reps<it.reps-2||r.sets<it.sets-1;
  const inc=ex.unit==="s"?5:ex.unit==="m"?2:(ex.reps[1]-ex.reps[0]>=6?2:1);
  if(hit){cs.down=0;
    if(cs.reps<ex.reps[1]){cs.reps=Math.min(ex.reps[1],cs.reps+(r.feel==="easy"?inc*2:inc));VB.log(name+": all sets done. Next time aim for "+cs.reps+u+".","up");}
    else{cs.top++;const harder=cs.i<steps.length-1;
      if(ex.loadable&&ex.tier!=="none"&&cs.bumps<3&&r.feel!=="easy"){cs.bumps++;cs.reps=ex.reps[0];if(cs.load)cs.load=Math.round(cs.load*1.05*2)/2;VB.log(name+": top of the range reached. Add about 5% load"+(cs.load?" ("+VB.wOut(cs.load)+" "+VB.wu()+")":"")+" and start again at "+cs.reps+u+".","up");}
      else if(harder&&(r.feel==="easy"||cs.top>=2||ex.loadable)){cs.i++;cs.ex=null;cs.reps=null;cs.top=0;cs.bumps=0;cs.extra=0;cs.load=null;const nx=VB.chainState(it.chain);VB.log(name+" mastered. Progressed to "+nx.ex.name+".","up");}
      else if(!harder&&cs.top>=2&&(cs.extra||0)<1){cs.extra=1;cs.top=0;VB.log(name+": top of this progression. Added one set.","up");}
      else VB.log(name+": top of the range. One more clean session moves you up.","hold");}}
  else if(miss){cs.top=0;cs.down++;
    if(cs.down>=2){cs.down=0;
      if(cs.reps>ex.reps[0]){cs.reps=ex.reps[0];VB.log(name+" felt too hard twice. Reps reset to "+cs.reps+u+".","down");}
      else if(cs.i>0){cs.i--;cs.ex=null;cs.reps=null;cs.bumps=0;cs.extra=0;cs.load=null;const nx=VB.chainState(it.chain);VB.log(name+" is too much right now. Stepped back to "+nx.ex.name+".","down");}
      else VB.log(name+": keep working at this level. Shorten the range of motion if you need to.","hold");}
    else VB.log(name+": tough today. Same target next time.","hold");}
  else{cs.top=0;}}
function adaptDrill(it,r){const d=VB.drMap()[it.id];if(!d||!r.att)return;const sk=VB.skillLevel(d.skill),ratio=r.suc/r.att,std=d.score&&d.score.attempts?d.score.target/d.score.attempts:.7;
  VB.state.drillLast[d.id]=VB.today();
  if(d.level>sk.lvl){if(ratio>=std){sk.lvl=Math.min(4,d.level);sk.up=0;VB.log(d.name+": standard met above your level. "+VB.SKILLS[d.skill]+" moved to level "+sk.lvl+".","up");}return;}
  if(d.level<sk.lvl-1)return;
  if(ratio>=std){sk.down=0;sk.up++;if(sk.up>=2&&sk.lvl<4){sk.lvl++;sk.up=0;VB.log(VB.SKILLS[d.skill]+": standard met twice. Drills move up to level "+sk.lvl+".","up");}
    else VB.log(d.name+": standard met ("+r.suc+"/"+r.att+").","hold");}
  else if(ratio<std*.6){sk.up=0;sk.down++;if(sk.down>=2&&sk.lvl>1){sk.lvl--;sk.down=0;VB.log(VB.SKILLS[d.skill]+": well under the standard twice. Drills step down to level "+sk.lvl+" to rebuild.","down");}}
  else{sk.up=0;sk.down=0;}}
VB.addTest=function(cm,src,date){if(cm==null||isNaN(cm))return false;cm=+cm;if(cm<3||cm>130){VB.log("A vertical of "+Math.round(cm)+" cm is not physically possible, so it was not saved. Check the units in your profile.","info");return false;}const st=VB.state;st.tests.push({date:date||VB.today(),kind:"vert",cm:+cm,src:src||"manual"});
  const T=st.tests.filter(t=>t.kind==="vert"&&!t.ex).sort((a,b)=>a.date<b.date?-1:1);
  if(T.length>=3){const a=T[T.length-3],b=T[T.length-1];if(VB.daysBetween(a.date,b.date)>=18&&b.cm-a.cm<1){st.jumpBias=st.jumpBias==="strength"?"reactive":"strength";
    VB.log("Vertical has not moved in "+VB.daysBetween(a.date,b.date)+" days. Jump work now leans toward "+(st.jumpBias==="reactive"?"fast, reactive jumps":"heavy leg strength")+".","load");}}return true;};
VB.finishSession=function(meta){const st=VB.state,t=st.today;if(!t)return null;const before=st.coach.length,items=[];
  t.plan.items.forEach(it=>{const r=t.done[it.key];if(!r)return;
    if(it.k==="ex"){items.push({k:"ex",id:it.id,chain:it.chain,sets:r.sets,reps:r.reps,load:r.load,feel:r.feel});adaptExercise(it,r);}
    else{items.push({k:"drill",id:it.id,skill:it.skill,suc:r.suc,att:r.att});adaptDrill(it,r);st.queue=st.queue.filter(q=>q!==it.id);}});
  const sess={id:uid(),date:VB.today(),type:"plan",mins:meta.mins,rpe:meta.rpe,items,notes:meta.notes||""};st.sessions.push(sess);
  if(meta.jump!=null)VB.addTest(meta.jump,"manual");if(meta.weight!=null)st.weights.push({date:VB.today(),kg:meta.weight});
  const ls=VB.loadStats();if(ls.acwr!=null&&ls.acwr>1.4)VB.log("Training load jumped to "+Math.round(ls.acwr*100)+"% of your 4-week average. The next session will be lighter.","load");
  const changes=st.coach.slice(0,st.coach.length-before);st.today=null;VB.save();return {sess,changes};};

/* faults from film */
VB.recordFilm=function(rec){const st=VB.state;st.film.unshift(rec);if(st.film.length>40)st.film.length=40;
  const moveFaults=(VB.MOVES[rec.move]||{}).faults||[],found=rec.faults.map(f=>f.id);
  rec.faults.forEach(f=>{const cur=st.faults[f.id];if(cur){cur.last=rec.date;cur.count++;cur.sev=f.sev;cur.clean=0;if(!cur.open){cur.open=true;VB.log(VB.FAULTS[f.id].name+" is back in your "+VB.MOVES[rec.move].name.toLowerCase()+". Corrections are in your plan again.","fix");}}
    else{st.faults[f.id]={first:rec.date,last:rec.date,count:1,sev:f.sev,open:true,move:rec.move,clean:0};VB.log("Film found: "+VB.FAULTS[f.id].name.toLowerCase()+". Corrective work added to your sessions.","fix");}});
  moveFaults.forEach(id=>{const cur=st.faults[id];if(cur&&cur.open&&!found.includes(id)&&rec.quality!=="poor"){cur.clean=(cur.clean||0)+1;if(cur.clean>=1){cur.open=false;cur.fixed=rec.date;VB.log("Fixed: "+VB.FAULTS[id].name.toLowerCase()+" did not show in your latest film.","up");}}});
  if(st.today&&!Object.keys(st.today.done||{}).length)st.today=null;VB.save();};
VB.correctives=function(fid){const drills=DR().filter(d=>(d.fixes||[]).includes(fid)).sort((a,b)=>(VB.drillFits(b)?1:0)-(VB.drillFits(a)?1:0)||a.level-b.level).slice(0,3);
  const t=userTier(),exs=EX().filter(e=>(e.fixes||[]).includes(fid)&&(VB.TIER[e.tier]||0)<=t).sort((a,b)=>(VB.TIER[b.tier]||0)-(VB.TIER[a.tier]||0)||a.step-b.step).slice(0,3);return {drills,exs};};

/* ---------- derived stats ---------- */
VB.skillStats=function(){const out={};VB.state.sessions.slice().sort((a,b)=>a.date<b.date?-1:1).forEach(s=>(s.items||[]).forEach(it=>{if(it.k!=="drill"||!it.att)return;(out[it.skill]=out[it.skill]||[]).push({date:s.date,pct:Math.round(it.suc/it.att*100),id:it.id});}));return out;};
VB.records=function(){const st=VB.state,recs=[],p=st.profile;
  const T=st.tests.filter(t=>t.kind==="vert");if(T.length){const b=T.reduce((a,t)=>t.cm>a.cm?t:a);recs.push([VB.lenOut(b.cm)+" "+VB.lu(),"Highest vertical jump",b.date]);
    if(p&&p.reach){const touch=b.cm+p.reach;recs.push([VB.lenOut(touch)+" "+VB.lu(),"Highest touch, "+(touch>=p.net*100?"above":"below")+" the "+p.net.toFixed(2)+" m net",b.date]);}}
  if(st.sessions.length){const l=st.sessions.reduce((a,s)=>(s.mins||0)>(a.mins||0)?s:a);recs.push([l.mins+" min","Longest session",l.date]);
    const wk=VB.weekly(),bw=Object.entries(wk).reduce((a,e)=>e[1].n>a[1].n?e:a);recs.push([bw[1].n+" sessions","Busiest week",bw[0]]);}
  const ss=VB.skillStats();Object.keys(ss).forEach(k=>{const b=ss[k].reduce((a,x)=>x.pct>a.pct?x:a);recs.push([b.pct+"%","Best "+VB.SKILLS[k].toLowerCase()+" score",b.date]);});
  const ups=st.coach.filter(c=>c.kind==="up"&&/Progressed to/.test(c.msg)).length;if(ups)recs.push([String(ups),"Exercises mastered",st.coach.find(c=>/Progressed to/.test(c.msg)).d]);
  const fixed=Object.values(st.faults).filter(f=>f&&!f.open&&f.fixed).length;if(fixed)recs.push([String(fixed),"Technique faults fixed",VB.today()]);
  return recs;};
})();
