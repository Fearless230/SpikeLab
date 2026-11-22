"""Renders the benchmark clips: the app's 3D player filmed by a fixed camera, saved as MP4 plus the true joint positions.
Needs: a local server at the repo root (python3 -m http.server 8765), Playwright for Python, ffmpeg.
usage: python3 tests/film-bench/render_clips.py [clip names]   (CHROME=/path/to/chrome to pick a browser)"""
import base64, json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
OUT=os.environ.get("FILM_BENCH",os.path.join(os.path.dirname(os.path.abspath(__file__)),"out"))
URL=os.environ.get("BASE_URL","http://127.0.0.1:8765")
CHROME=os.environ.get("CHROME")
CLIPS=[
 dict(name="block60", clip="block", fps=60, w=1280, h=720, tx=-0.51, dist=6.5, camh=1.45),
 dict(name="spike30", clip="spike", fps=30, w=1280, h=720, tx=-2.3, dist=8.0, camh=1.6),
 dict(name="jumpfloat60", clip="jumpfloat", fps=60, w=1280, h=720, tx=-11.6, dist=7.0, camh=1.45),
 dict(name="set30", clip="set", fps=30, w=1280, h=720, tx=-1.4, dist=6.5, camh=1.45),
 dict(name="block30portrait", clip="block", fps=30, w=720, h=1280, tx=-0.51, dist=5.0, camh=1.5),
]
only=sys.argv[1:] or [c["name"] for c in CLIPS]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
    for c in CLIPS:
        if c["name"] not in only: continue
        t0=time.time(); d=f"{OUT}/{c['name']}"; os.makedirs(d, exist_ok=True)
        pg = b.new_page(viewport={"width":c["w"],"height":c["h"]})
        pg.goto(f"{URL}/tests/film-bench/render.html?clip={c['clip']}&w={c['w']}&h={c['h']}&tx={c['tx']}&x=0&dist={c['dist']}&camh={c['camh']}")
        pg.wait_for_function("window.ready", timeout=180000)
        info = pg.evaluate("info()"); n=int(info["dur"]*c["fps"]); gts=[]
        for i in range(n):
            t=i/c["fps"]; gt=pg.evaluate(f"frame({t})"); gts.append({"t":t,"j":gt})
            data=pg.evaluate("document.getElementById('c').toDataURL('image/jpeg',0.95)")
            open(f"{d}/f{i:04d}.jpg","wb").write(base64.b64decode(data.split(",")[1]))
        json.dump({"info":info,"cfg":c,"frames":gts}, open(f"{OUT}/{c['name']}.json","w"))
        subprocess.run(["ffmpeg","-y","-loglevel","error","-framerate",str(c["fps"]),"-i",f"{d}/f%04d.jpg","-vf","noise=alls=7:allf=t,format=yuv420p","-c:v","libx264","-crf","26","-preset","veryfast","-r",str(c["fps"]),f"{OUT}/{c['name']}.mp4"],check=True)
        pg.close(); print(c["name"], n, "frames", round(time.time()-t0), "s", flush=True)
    b.close()
