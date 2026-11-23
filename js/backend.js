/* backend.js: accounts and cloud saving through Supabase when the site runs on its own domain.
   It exposes the same small interface the app already uses (window.claude.use("db") and use("user")),
   so core.js, squad.js and profile.js work unchanged. On claude.ai the built-in account is used instead. */
(function(){
const C=window.VB_CONFIG||{},VB=window.VB=window.VB||{};
const onClaude=/(^|\.)claude\.(ai|site)$|claudeusercontent|anthropic/.test(location.hostname);
const configured=!!(C.supabaseUrl&&C.supabaseAnonKey&&!/PASTE_/.test(C.supabaseAnonKey));
if(onClaude||window.claude||!configured){if(!onClaude&&!configured)console.info("Supabase is not configured yet: add your anon key in js/config.js. Saving stays on this device.");return;}

let sb=null,session=null,readyRes,decided=false,decidedVal=null;const ready=new Promise(r=>readyRes=r);
const uid=()=>session&&session.user&&session.user.id;
/* userAuth: the person used the log-in form on this page. Only then does a SIGNED_IN mean "someone new signed in":
   Supabase also sends SIGNED_IN when it quietly restores or refreshes a saved login (on load, when the tab comes back,
   or from another tab), and reloading on those caused an endless reload loop. reloadOnce adds a second guard. */
let userAuth=false;
function reloadOnce(){try{const k="vbj-auth-reload",t=+sessionStorage.getItem(k)||0;if(Date.now()-t<30000)return false;sessionStorage.setItem(k,String(Date.now()));}catch(e){return false;}location.reload();return true;}
function decide(v){if(decided)return;decided=true;decidedVal=v;readyRes(v);}

/* ---------- keeping the sign-in fresh ----------
   The access token lasts an hour. A phone or laptop that wakes from sleep can ask the database for data before the
   library has renewed it, and the database refuses. So: renew first when the token is about to run out, and if a request
   is still refused for an expired token, renew and try once more. A failed request never signs anyone out. */
let refreshing=null,explicitLogout=false;
const authErr=e=>!!e&&/jwt|token|expired|unauthori[sz]ed|401|PGRST30[13]/i.test([e.message,e.code,e.status,e.hint].join(" "));
function fresh(){if(!session)return Promise.resolve();const exp=(session.expires_at||0)*1000;if(exp-Date.now()>60000)return Promise.resolve();
  if(!refreshing)refreshing=sb.auth.refreshSession().catch(()=>{}).finally(()=>{refreshing=null;});return refreshing;}
async function q(make){await fresh();let r=await make();if(r&&r.error&&authErr(r.error)){if(!refreshing)refreshing=sb.auth.refreshSession().catch(()=>{}).finally(()=>{refreshing=null;});await refreshing;r=await make();}return r;}

/* ---------- data: one row per document path in the "docs" table ---------- */
function db(){
  const doc=path=>({
    async get(){const {data,error}=await q(()=>sb.from("docs").select("path,data").eq("path",path).maybeSingle());if(error)throw error;return {exists:!!data,data:()=>data?data.data:null,id:path.split("/").pop()};},
    async set(obj){const {error}=await q(()=>sb.from("docs").upsert({path,owner:uid(),data:obj,updated_at:new Date().toISOString()}));if(error){const e=new Error(error.message);e.code=/too large|payload/i.test(error.message)?"quota_exceeded":"unavailable";throw e;}},
    async delete(){const {error}=await q(()=>sb.from("docs").delete().eq("path",path));if(error)throw error;}});
  /* a collection of top-level docs (for example players/<uid>). To keep downloads small (Supabase's free plan counts every byte):
     - only top-level docs are requested: nested ones (players/<uid>/media/img with photos, players/<uid>/m/... chat) are
       excluded by the database, not downloaded and thrown away;
     - after one full load, refreshes ask only for docs changed since the newest one seen (with a minute of overlap);
     - live change signals update the list directly from the change itself, and changes to nested docs are ignored;
     - the backup check runs every 2 minutes, with a full reload every 10 minutes and when the tab comes back. */
  const collection=name=>{const top=name+"/%",nested=name+"/%/%";
    const rowsQ=since=>{let b=sb.from("docs").select("path,data,updated_at").like("path",top).not("path","like",nested);if(since)b=b.gt("updated_at",since);return b;};
    const isTop=path=>path.indexOf(name+"/")===0&&path.split("/").length===2;
    return {
    async get(){const {data,error}=await q(()=>rowsQ());if(error)throw error;
      return {docs:(data||[]).filter(r=>isTop(r.path)).map(r=>({id:r.path.split("/")[1],data:()=>r.data}))};},
    onSnapshot(cb,onErr){let dead=false,t=0,lastFull=0,maxAt=0,busy=null;const rows=new Map();
      const emit=()=>{if(!dead)cb({docs:[...rows.values()].map(r=>({id:r.path.split("/")[1],data:()=>r.data}))});};
      const take=r=>{if(!r||!r.path||!isTop(r.path))return;rows.set(r.path,{path:r.path,data:r.data});const at=Date.parse(r.updated_at||"");if(at>maxAt)maxAt=at;};
      const load=full=>{if(dead)return Promise.resolve();if(busy)return busy;
        busy=(async()=>{try{full=full||!maxAt||Date.now()-lastFull>600000;const since=full?null:new Date(maxAt-60000).toISOString();
          const {data,error}=await q(()=>rowsQ(since));if(error)throw error;if(dead)return;
          if(full){rows.clear();maxAt=0;lastFull=Date.now();}(data||[]).forEach(take);if(full||(data&&data.length))emit();}
          catch(e){if(!dead&&onErr)onErr(e);}finally{busy=null;}})();return busy;};
      const soon=full=>{clearTimeout(t);t=setTimeout(()=>load(full),250);};
      load(true);
      const ch=sb.channel("docs-"+name+"-"+Math.random().toString(36).slice(2,7)).on("postgres_changes",{event:"*",schema:"public",table:"docs"},p=>{
        const path=(p.new&&p.new.path)||(p.old&&p.old.path)||"";if(!isTop(path))return;
        if(p.eventType==="DELETE"){rows.delete(path);emit();return;}
        if(p.new&&p.new.data!==undefined&&!p.errors){take(p.new);emit();return;}
        soon(false);}).subscribe();
      const poll=setInterval(()=>{if(!document.hidden)load(false);},120000),vis=()=>{if(!document.hidden)soon(true);};document.addEventListener("visibilitychange",vis);
      return ()=>{dead=true;clearInterval(poll);clearTimeout(t);document.removeEventListener("visibilitychange",vis);try{sb.removeChannel(ch);}catch(e){}};}};};
  /* chat threads I can read (players/<sender>/m/<thread>); the database only returns threads I am part of */
  const inbox={onSnapshot(cb){let dead=false,t=0;const load=async()=>{if(dead)return;try{const {data,error}=await q(()=>sb.from("docs").select("path,data").like("path","players/%/m/%"));if(!error&&!dead)cb((data||[]).map(r=>({from:r.path.split("/")[1],th:r.data&&r.data.th,msgs:(r.data&&r.data.msgs)||[]})));}catch(e){}};
      const soon=()=>{clearTimeout(t);t=setTimeout(load,250);};load();
      const ch=sb.channel("docs-inbox-"+Math.random().toString(36).slice(2,7)).on("postgres_changes",{event:"*",schema:"public",table:"docs"},p=>{const path=(p.new&&p.new.path)||(p.old&&p.old.path)||"";if(/^players\/[^/]+\/m\//.test(path))soon();}).subscribe();
      const poll=setInterval(()=>{if(!document.hidden)load();},20000),vis=()=>{if(!document.hidden)soon();};document.addEventListener("visibilitychange",vis);
      return ()=>{dead=true;clearInterval(poll);clearTimeout(t);document.removeEventListener("visibilitychange",vis);try{sb.removeChannel(ch);}catch(e){}};}};
  return {doc,collection,inbox};}
/* ---------- user: identity, names for friends, and friend search ---------- */
function user(){const u=session.user,meta=u.user_metadata||{};
  return {
    async id(){return uid();},
    async me(){return {id:u.id,name:meta.name||(u.email||"").split("@")[0],email:u.email,avatarUrl:meta.avatar_url||null};},
    async profiles(ids){const out={};if(!ids||!ids.length)return out;const {data}=await q(()=>sb.from("profiles").select("id,name,avatar_url").in("id",ids));(data||[]).forEach(p=>out[p.id]={name:typeof p.name==="string"?p.name.slice(0,60):"",avatarUrl:(VB.safeImg&&VB.safeImg(p.avatar_url))||null});return out;},
    async search(q){q=(q||"").trim();if(q.length<2)return [];const {data,error}=await q(()=>sb.rpc("find_players",{q}));if(error)throw error;return (data||[]).map(r=>({id:r.id,name:r.name,email:r.email||""}));}};}
async function saveProfileRow(){const u=session.user,meta=u.user_metadata||{};const minor=!!(VB.minor&&VB.minor());try{await sb.from("profiles").upsert({id:u.id,name:meta.name||(u.email||"").split("@")[0],minor,updated_at:new Date().toISOString()});}catch(e){}}

/* the interface core.js asks for; waits until the person has signed in or chosen to stay on this device */
window.claude={use:async k=>{const ok=await ready;if(!ok)return null;return k==="db"?db():k==="user"?user():null;}};

/* ---------- login screen ---------- */
const css=`.auth{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(23,20,77,.55);backdrop-filter:blur(6px)}
.auth .box{width:min(420px,100%);background:#fff;color:#17144d;border-radius:18px;padding:26px 24px;box-shadow:0 30px 80px -30px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:12px}
.auth h2{margin:0;font-size:1.6rem;line-height:1.1;text-transform:uppercase;letter-spacing:.01em}.auth p{margin:0;color:#5c5880;font-size:.95rem}
.auth label{display:flex;flex-direction:column;gap:5px;font-weight:600;font-size:.85rem}.auth input{padding:11px 12px;border:1.5px solid #d9d6ea;border-radius:10px;font:inherit;font-size:1rem;color:#17144d;background:#fff}
.auth input:focus{outline:2px solid #ec3b52;outline-offset:1px}.auth .go{padding:12px;border:0;border-radius:999px;background:#cf2840;color:#fff;font-weight:800;font-size:1rem;cursor:pointer}
.auth .go[disabled]{opacity:.6}.auth .lnk{background:none;border:0;color:#5b2bff;font-weight:700;cursor:pointer;padding:2px;font:inherit;font-size:.9rem;text-align:left}
.auth .row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.auth .msg{min-height:1.2em;font-size:.9rem;font-weight:600}.auth .msg.err{color:#c4142f}.auth .msg.ok{color:#127a3d}
.auth .chk{flex-direction:column;font-weight:600}.auth .chk span{display:flex;gap:8px;align-items:center}.auth .chk input{width:18px;height:18px}.auth .chk small{font-weight:400;color:#5c5880}
.auth .skip{font-size:.85rem;color:#5c5880;border-top:1px solid #eceaf5;padding-top:10px}
.acct{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 16px;margin:0 0 16px;border-radius:12px;background:#fff;box-shadow:0 0 0 1px rgba(23,20,77,.08);font-size:.92rem}
.acct button{padding:8px 16px;border-radius:999px;border:1.5px solid #17144d;background:#fff;color:#17144d;font-weight:700;cursor:pointer}`;
let box=null,mode="in";
function show(m,msg,kind){mode=m||mode;if(!box){const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);box=document.createElement("div");box.className="auth";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-labelledby","authT");document.body.appendChild(box);box.addEventListener("submit",submit);box.addEventListener("click",click);}
  const T={in:["Log in","Pick up your training journey on any device."],up:["Create your account","Your plan, progress and squad are saved to your account."],reset:["Reset password","We will email you a link to choose a new password."],newpw:["Choose a new password","Type the new password you want to use."],check:["Check your email","Open the link we just sent to confirm your account, then come back and log in."]}[mode];
  box.hidden=false;box.innerHTML=`<form class="box" novalidate><h2 id="authT">${T[0]}</h2><p>${T[1]}</p>
    ${mode==="up"?`<label>Name<input name="name" autocomplete="name" required maxlength="40"></label>`:""}
    ${mode==="in"||mode==="up"||mode==="reset"?`<label>Email<input name="email" type="email" autocomplete="email" required></label>`:""}
    ${mode==="in"||mode==="up"||mode==="newpw"?`<label>Password<input name="pw" type="password" autocomplete="${mode==="in"?"current-password":"new-password"}" minlength="6" required></label>`:""}
    ${mode==="up"?`<label class="chk"><span><input type="checkbox" name="age12"> I am 12 or older</span><small>Under 12? Choose "Continue without an account" below: everything still works and stays on this device.</small></label><label class="chk"><span><input type="checkbox" name="guardian"> If I am 12 or 13, a parent or guardian has agreed to this account</span><small>Squad (friends, teams and chat) shares your card with people you add. A parent or guardian should know about that.</small></label>`:""}
    <div class="msg ${kind||""}" role="status" aria-live="polite">${msg||""}</div>
    ${mode!=="check"?`<button class="go" type="submit">${{in:"Log in",up:"Create account",reset:"Send reset link",newpw:"Save password"}[mode]}</button>`:`<button class="go" type="button" data-m="in">Back to log in</button>`}
    <div class="row">${mode==="in"?`<button type="button" class="lnk" data-m="up">New here? Create an account</button><button type="button" class="lnk" data-m="reset">Forgot password?</button>`:mode==="newpw"||mode==="check"?"":`<button type="button" class="lnk" data-m="in">I already have an account</button>`}</div>
    ${(mode==="in"||mode==="up")&&!decided?`<button type="button" class="lnk skip" data-skip="1">Continue without an account (saved on this device only)</button>`:""}${decided?`<button type="button" class="lnk skip" data-close="1">Not now</button>`:""}</form>`;
  const f=box.querySelector("input");if(f)setTimeout(()=>f.focus(),30);}
function hide(){if(box)box.hidden=true;}
function click(e){const b=e.target.closest("button");if(!b)return;if(b.dataset.m){show(b.dataset.m);}else if(b.dataset.skip){hide();decide(false);}else if(b.dataset.close){hide();}}
const site=()=>location.origin+location.pathname;
async function submit(e){e.preventDefault();userAuth=true;const f=e.target,v=n=>(f.elements[n]&&f.elements[n].value||"").trim(),go=f.querySelector(".go"),say=(m,k)=>{const el=f.querySelector(".msg");el.textContent=m;el.className="msg "+(k||"err");};
  if(mode!=="newpw"&&v("email")&&!/^\S+@\S+\.\S+$/.test(v("email")))return say("Enter a valid email address.");
  if((mode==="in"||mode==="up"||mode==="newpw")&&(f.elements.pw.value||"").length<6)return say("Use at least 6 characters for the password.");
  if(mode==="up"&&!v("name"))return say("Add your name so friends can find you.");
  if(mode==="up"&&!f.elements.age12.checked)return say("Accounts are for players 12 and older. Use \"Continue without an account\" instead.");
  {const a=VB.ageOf&&VB.ageOf();if(mode==="up"&&a!=null&&a<14&&!f.elements.guardian.checked)return say("Players aged 12 and 13 need a parent or guardian to agree first. Tick the second box once they have.");}
  go.disabled=true;say("Working…","ok");
  try{
    if(mode==="in"){const {error}=await sb.auth.signInWithPassword({email:v("email"),password:f.elements.pw.value});if(error)throw error;}
    else if(mode==="up"){const {data,error}=await sb.auth.signUp({email:v("email"),password:f.elements.pw.value,options:{data:{name:v("name"),guardian_ok:!!f.elements.guardian.checked,signup_age_ok:true},emailRedirectTo:site()}});if(error)throw error;if(!data.session){show("check");return;}}
    else if(mode==="reset"){const {error}=await sb.auth.resetPasswordForEmail(v("email"),{redirectTo:site()});if(error)throw error;say("If that email has an account, a reset link is on its way.","ok");go.disabled=false;return;}
    else if(mode==="newpw"){const {error}=await sb.auth.updateUser({password:f.elements.pw.value});if(error)throw error;hide();toast("Password updated.");}
  }catch(err){go.disabled=false;const m=(err&&err.message)||"Something went wrong. Try again.";say(/invalid login/i.test(m)?"Email or password is wrong.":/not confirmed/i.test(m)?"Confirm your email first: open the link we sent you.":/rate limit/i.test(m)?"Too many tries. Wait a minute and try again.":m);}}
function toast(m){if(VB.ui&&VB.ui.toast)VB.ui.toast(m);}
/* signed-in strip on the profile page with a log out button */
function acctBar(){const host=document.getElementById("v-profile");if(!host)return;let el=document.getElementById("acctBar");if(!session){if(el)el.remove();return;}
  if(!el){el=document.createElement("div");el.id="acctBar";el.className="acct";host.insertBefore(el,host.firstChild);el.addEventListener("click",async e=>{if(!e.target.closest("[data-out]"))return;VB.backend.logout();});}
  el.innerHTML=`<span>Signed in as <b>${(session.user.email||"").replace(/</g,"&lt;")}</b></span><button type="button" data-out="1">Log out</button>`;}

/* ---------- boot: load the Supabase library, then restore the session or ask to log in ---------- */
function boot(){const s=document.createElement("script");s.src="js/vendor/supabase-2.119.2.js";s.async=true;  // a pinned copy kept in the repo: no outside code can change under you
  s.onload=start;s.onerror=()=>{loadFailed=true;console.warn("Could not load Supabase. Saving stays on this device.");decide(false);if(box&&!box.hidden)show(mode,"Couldn't reach the sign-in service. Check your connection and try again.","err");};document.head.appendChild(s);}
let loadFailed=false;
async function start(){sb=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  // Supabase asks that no other Supabase calls run inside this callback, so the follow-up work is deferred
  sb.auth.onAuthStateChange((ev,s)=>{const before=uid();session=s;setTimeout(()=>{if(ev==="PASSWORD_RECOVERY"){show("newpw");return;}
    if(s&&!decided){hide();saveProfileRow();decide(true);}
    /* signed in after starting without an account, after being signed out, or as someone else: reload so every part of
       the app (cloud saving, Squad, chat) connects to the account */
    else if(ev==="SIGNED_IN"&&decided&&s){hide();const other=before&&before!==s.user.id;
      if((userAuth&&(decidedVal===false||!before))||other){if(reloadOnce())return;}
      if(!before)saveProfileRow();}
    if(ev==="SIGNED_OUT"&&decided){
      if(explicitLogout)return;
      /* not chosen by the person (for example the session ran out on this device): keep everything on the device and ask
         them to log in again, instead of wiping the device */
      show("in","You were signed out on this device. Log in again to keep saving to your account and use Squad.","err");}
    acctBar();},0);});
  try{const {data}=await sb.auth.getSession();session=data.session;}catch(e){console.warn(e);session=null;}
  if(session){saveProfileRow();decide(true);acctBar();}
  else if(!/type=recovery/.test(location.hash))show("in");}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
VB.backend={saveProfileRow:()=>session&&saveProfileRow(),get client(){return sb;},get session(){return session;},login(m){if(session){location.reload();return;}if(sb){show(m||"in");return;}
    /* the sign-in library is not loaded (offline when the page opened): say so, and try again */
    show(m||"in",loadFailed?"Connecting to the sign-in service…":"Starting up…","ok");if(loadFailed){loadFailed=false;boot();}},async deleteAccount(){if(!sb||!session)throw new Error("Not signed in");const {error}=await sb.rpc("delete_my_account");if(error)throw error;try{explicitLogout=true;await sb.auth.signOut();}catch(e){}try{localStorage.clear();}catch(_){}},
  /* logging out on purpose clears this device, so the next person using it starts fresh */
  logout:async()=>{explicitLogout=true;try{if(sb)await sb.auth.signOut();}catch(e){}try{localStorage.clear();}catch(_){}location.reload();}};
})();
