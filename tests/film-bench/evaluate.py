"""Runs the app's Film analysis on a benchmark clip and compares it with the ground truth.
usage: python3 tests/film-bench/evaluate.py <port> <clipname> [label]
  The first run records the pose model's raw output next to the clip (<clip>.full.lm.json); later runs replay it, so
  changes to the cleaning and scoring code can be tested in seconds. FRESH=1 runs the model again.
  Reports joint position error (% of body height), joint angle error, and flight time / jump height against the truth
  (taken from when the rendered feet actually leave and touch the floor)."""
import json, math, os, sys, time
from playwright.sync_api import sync_playwright
port, name = sys.argv[1], sys.argv[2]; label = sys.argv[3] if len(sys.argv) > 3 else port
B = os.environ.get("FILM_BENCH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")); G = json.load(open(f"{B}/{name}.json"))
MOVE = {"block": "block", "spike": "spike", "jumpfloat": "serve", "set": "set"}[G["cfg"]["clip"]]
def ang(a, b, c):
    v1 = (a[0]-b[0], a[1]-b[1]); v2 = (c[0]-b[0], c[1]-b[1]); m = math.hypot(*v1)*math.hypot(*v2)
    return math.degrees(math.acos(max(-1, min(1, (v1[0]*v2[0]+v1[1]*v2[1])/m)))) if m else None
with sync_playwright() as p:
    br = p.chromium.launch(executable_path=os.environ.get("CHROME"), args=["--disable-3d-apis"])
    ctx = br.new_context(viewport={"width": 1280, "height": 1000}, service_workers="block", bypass_csp=True)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.route("**/*supabase.co/**", lambda r: r.abort()); pg.route("**/fonts.g*/**", lambda r: r.abort())
    pg.set_default_timeout(300000)
    pg.goto(f"http://127.0.0.1:{port}/"); pg.locator(".auth button").last.click()
    pg.fill("#p-name", "Bench"); pg.fill("#p-age", "20"); pg.fill("#p-height-cm", "180"); pg.fill("#p-weight", "75")
    pg.click("#wizNext"); pg.select_option("#p-pos", "outside"); pg.select_option("#p-exp", index=2); pg.click("#wizNext"); pg.click("#wizNext")
    pg.evaluate("""(()=>{const g=document.querySelector('input[name="goal"]');g.checked=true;g.dispatchEvent(new Event('change',{bubbles:true}));})()""")
    pg.click("#wizSave"); pg.wait_for_timeout(600)
    pg.evaluate("location.hash='#film'"); pg.wait_for_timeout(800)
    pg.click(f'[data-move="{MOVE}"]')
    if pg.locator('[data-view="side"]').count(): pg.click('[data-view="side"]')
    pg.set_input_files("#fFile", f"{B}/{name}.mp4"); pg.wait_for_timeout(1500)
    import os
    REC = f"{B}/{name}.{os.environ.get('MODEL','full')}{'.img' if os.environ.get('IMG') else ''}.lm.json"
    if os.environ.get("IMG"): pg.evaluate("VB.filmPose.mode='IMAGE'")
    if os.environ.get("MODEL"): pg.evaluate("m=>{const L=VB.filmPose.load;VB.filmPose.load=k=>L(m);}", os.environ["MODEL"])
    if os.path.exists(REC) and port == "8765" and not os.environ.get("FRESH"):
        pg.evaluate("r=>{let i=0;VB.filmPose.load=async()=>({detectForVideo:()=>r[i++]||null,detect:()=>r[i++]||null});VB.filmPose.loadImage=async()=>({detect:()=>r[i++]||null});}", json.load(open(REC)))
    elif port == "8765":
        pg.evaluate("""()=>{const L=VB.filmPose.load,LI=VB.filmPose.loadImage;window.__rec=[];VB.filmPose.loadImage=async k=>{const m=await LI(k);return {detect:(v)=>{const r=m.detect(v);window.__rec.push(r&&r.landmarks?{landmarks:r.landmarks}:null);return r;}};};VB.filmPose.load=async k=>{const m=await L(k);return {detectForVideo:(v,t)=>{const r=m.detectForVideo(v,t);window.__rec.push(r&&r.landmarks?{landmarks:r.landmarks}:null);return r;},detect:(v)=>{const r=m.detect(v);window.__rec.push(r&&r.landmarks?{landmarks:r.landmarks}:null);return r;}};};}""")
    t0 = time.time()
    if pg.locator("#fAnalyse").count():          # new one-step flow
        pg.click("#fAnalyse")
    else:                                         # old flow: place dots, then track
        pg.click("#fGo"); pg.wait_for_selector("#fRun:not([hidden])"); pg.click("#fRun")
    pg.wait_for_function("VB.film._debug.res!=null", timeout=600000); el = time.time() - t0
    d = pg.evaluate("""(()=>{const D=VB.film._debug,r=D.res;return {P:D.P,F:D.F.map(f=>f.t),AW:D.AW,AH:D.AH,flight:r.flight,jumpFlight:r.jumpFlight,hipRise:r.hipRise,jumpSure:r.jumpSure,score:r.score,ph:r.ph,
       tTO:r.tTO!=null?r.tTO:null,tLand:r.tLand!=null?r.tLand:null,thr:r.diag?r.diag.thr:null,bodyPx:r.bodyPx,cmPx:r.cmPx,checks:r.checks.map(c=>[c.id,c.val,c.score]),diag:r.diag?{ground:r.diag.ground,thr:r.diag.thr,footY:r.diag.footY,best:r.diag.best}:null};})()""")
    if os.environ.get("SHOT"):
        pg.evaluate("document.querySelector('#fVideo').currentTime=1.5"); pg.wait_for_timeout(800)
        pg.screenshot(path=os.environ["SHOT"], full_page=True)
    if port == "8765" and pg.evaluate("!!window.__rec"): json.dump(pg.evaluate("window.__rec"), open(REC, "w"))
    if os.environ.get("DUMP"): json.dump(pg.evaluate("(()=>{const D=VB.film._debug;return D.dump?D.dump():null})()"), open(f"dump_{name}.json","w"))
    br.close()
info = G["info"]; W, H = G["cfg"]["w"], G["cfg"]["h"]; fps = G["cfg"]["fps"]; GTF = G["frames"]
sx, sy = W / d["AW"], H / d["AH"]
def gt_at(t):
    i = min(len(GTF)-1, max(0, round(t*fps))); return GTF[i]["j"]
# body height from the first frame (head to ankle)
g0 = GTF[0]["j"]; body = abs(g0["ankle"][1] - g0["head"][1])
J = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "toe"]
perr = {j: [] for j in J}; aerr = {"knee": [], "hip": [], "elbow": []}
for o, t in zip(d["P"], d["F"]):
    if not o: continue
    g = gt_at(t)
    for j in J:
        if o.get(j): perr[j].append(math.hypot(o[j][0]*sx - g[j][0], o[j][1]*sy - g[j][1]) / body * 100)
    P2 = {k: (v[0]*sx, v[1]*sy) for k, v in o.items() if v}
    for a, (x, y, z) in {"knee": ("hip", "knee", "ankle"), "hip": ("shoulder", "hip", "knee"), "elbow": ("shoulder", "elbow", "wrist")}.items():
        if all(k in P2 for k in (x, y, z)):
            m, tr = ang(P2[x], P2[y], P2[z]), ang(g[x], g[y], g[z])
            if m is not None and tr is not None: aerr[a].append(abs(m - tr))
mean = lambda v: sum(v)/len(v) if v else float("nan")
true_flight = (info["tLand"] - info["tTO"]) if info["tTO"] is not None and info["tTO"] >= 0 else None
# truth from the rendered feet: when the lowest foot point leaves and touches the floor (the animation labels are approximate)
if true_flight:
    low=[max(f["j"]["l_ankle"][1],f["j"]["r_ankle"][1],f["j"]["toe"][1]) for f in GTF]; i0=round(info["tTO"]*fps); i1=round(info["tLand"]*fps)
    med=lambda v: sorted(v)[len(v)//2]
    pre=med(low[max(0,i0-int(.3*fps)):max(1,i0-int(.05*fps))]); post=med(low[i1+int(.05*fps):i1+int(.3*fps)]); thr=4
    pk=min(range(i0,i1+1),key=lambda k:low[k]); a=pk
    while low[a-1]<pre-thr: a-=1
    tA=(a-1+(low[a-1]-(pre-thr))/(low[a-1]-low[a]))/fps
    b=pk
    while low[b]<post-thr: b+=1
    tB=(b-1+((post-thr)-low[b-1])/(low[b]-low[b-1]))/fps
    true_flight=tB-tA
    if os.environ.get("TT"): print("TRUTH tA",round(tA,4),"tB",round(tB,4),"pre",round(pre,1),"post",round(post,1))
true_h = 9.81 * true_flight**2 / 8 * 100 if true_flight else None
out = {"label": label, "clip": name, "secs": round(el, 1), "frames": len(d["F"]),
       "pos_err_%body": round(mean([e for j in J for e in perr[j]]), 2),
       "pos_err_by_joint": {j: round(mean(perr[j]), 2) for j in J},
       "angle_err_deg": {k: round(mean(v), 1) for k, v in aerr.items()},
       "flight_ms": round(d["flight"]*1000) if d["flight"] else None, "true_flight_ms": round(true_flight*1000) if true_flight else None,
       "jump_cm": d["jumpFlight"], "true_jump_cm": round(true_h, 1) if true_h else None, "hip_rise_cm": d["hipRise"], "jump_saved": d["jumpSure"], "score": d["score"]}
if os.environ.get("PERFRAME"):
    rows=[]
    for o,t in zip(d["P"],d["F"]):
        g=gt_at(t); e={j:round(math.hypot(o[j][0]*sx-g[j][0],o[j][1]*sy-g[j][1])/body*100) for j in J if o.get(j)}
        rows.append((round(t,2),e.get("hip"),e.get("knee"),e.get("wrist"),e.get("ankle")))
    out["perframe"]=rows[::4]
if os.environ.get("LAG"):
    res=[]
    for off in range(-5,6):
        e=[]
        for o,t in zip(d["P"],d["F"]):
            if not o: continue
            g=gt_at(t+off/fps)
            for j in J:
                if o.get(j): e.append(math.hypot(o[j][0]*sx-g[j][0],o[j][1]*sy-g[j][1])/body*100)
        res.append((off,round(mean(e),2)))
    out["lag_scan"]=res
print(json.dumps(out))
if os.environ.get("TT"): print("MEAS tTO",d["tTO"],"tLand",d["tLand"],"thr px",d["thr"],"bodyPx",d["bodyPx"],"cmPx",d["cmPx"], "AW",d["AW"])
if os.environ.get("DIAG"): json.dump(d.get("diag"), open(f"diag_{name}.json","w"))
if errs: print("ERRORS:", errs[:5])
