/* film-pose.js: automatic body tracking for Film, on this device.
   The MediaPipe pose model (self-hosted in js/vendor/mediapipe and models/) runs on every frame of the trimmed clip in
   video mode, so it follows the athlete from frame to frame. The raw points are then cleaned the way biomechanics labs
   clean motion data:
     1. left/right identity is kept consistent through the clip (side-on, the model sometimes swaps the legs or arms),
     2. low-confidence points are dropped and outliers removed with a Hampel filter,
     3. short gaps are filled, and
     4. every path is smoothed with a zero-lag Butterworth low-pass filter (cut-off chosen per joint).
   Foot contact uses the raw (unsmoothed) feet so take-off and landing are not blurred.
   VB.filmPose.{supported, load(kind), track(video, opts, onProgress), fps(video)} */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const BASE=new URL(".",document.baseURI).href;
const LIB=BASE+"js/vendor/mediapipe/vision_bundle.mjs",WASM=BASE+"js/vendor/mediapipe/wasm",MODELS={full:BASE+"models/pose_landmarker_full.task"};
let libP=null,lmP={},lastTs=0;
function lib(){if(!libP){libP=import(LIB).then(async V=>({V,fs:await V.FilesetResolver.forVisionTasks(WASM)}));libP.catch(()=>{libP=null;});}return libP;}
let MODE="VIDEO";
async function create(kind,delegate){const {V,fs}=await lib();return V.PoseLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MODELS[kind],delegate},runningMode:MODE,numPoses:1,
  minPoseDetectionConfidence:.4,minPosePresenceConfidence:.4,minTrackingConfidence:.5,outputSegmentationMasks:false});}
let imgP={};
function loadImage(kind){kind=MODELS[kind]?kind:"full";if(!imgP[kind]){imgP[kind]=(async()=>{const {V,fs}=await lib();const mk=d=>V.PoseLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MODELS[kind],delegate:d},runningMode:"IMAGE",numPoses:1,minPoseDetectionConfidence:.3,minPosePresenceConfidence:.3});try{return await mk("GPU");}catch(e){return await mk("CPU");}})();imgP[kind].catch(()=>{delete imgP[kind];});}return imgP[kind];}
function load(kind){kind=MODELS[kind]?kind:"full";if(!lmP[kind]){lmP[kind]=(async()=>{try{return await create(kind,"GPU");}catch(e){return await create(kind,"CPU");}})();lmP[kind].catch(()=>{delete lmP[kind];});}return lmP[kind];}

/* MediaPipe landmark ids */
const L={nose:0,l_ear:7,r_ear:8,l_shoulder:11,r_shoulder:12,l_elbow:13,r_elbow:14,l_wrist:15,r_wrist:16,l_hip:23,r_hip:24,l_knee:25,r_knee:26,l_ankle:27,r_ankle:28,l_heel:29,r_heel:30,l_toe:31,r_toe:32};
const ARM=["shoulder","elbow","wrist"],LEG=["hip","knee","ankle","heel","toe"];

/* ---------- frame rate: read from the video itself where the browser allows it ---------- */
async function fps(video){if(!("requestVideoFrameCallback" in HTMLVideoElement.prototype))return 30;
  const t0=video.currentTime,rate=video.playbackRate,muted=video.muted;const times=[];
  try{video.muted=true;video.playbackRate=1;await new Promise(res=>{let n=0;const cb=(now,md)=>{times.push(md.mediaTime);if(++n<14&&!video.paused)video.requestVideoFrameCallback(cb);else res();};video.requestVideoFrameCallback(cb);video.play().catch(res);setTimeout(res,1500);});}
  catch(e){}video.pause();video.playbackRate=rate;video.muted=muted;video.currentTime=t0;
  const d=[];for(let i=1;i<times.length;i++){const x=times[i]-times[i-1];if(x>.003&&x<.1)d.push(x);}if(d.length<4)return 30;d.sort((a,b)=>a-b);
  const f=1/d[Math.floor(d.length/2)];const std=[24,25,30,48,50,60,90,100,120,240];let best=f;std.forEach(s=>{if(Math.abs(s-f)/s<.06)best=s;});return Math.round(best*100)/100;}

const seek=(video,t)=>new Promise(r=>{if(Math.abs(video.currentTime-t)<1e-4&&video.readyState>=2)return r();let done=false;const fin=()=>{if(done)return;done=true;video.removeEventListener("seeked",fin);
  /* wait for the frame to be painted, where supported, so the model sees the new frame */
  if("requestVideoFrameCallback" in video&&!video.paused)video.requestVideoFrameCallback(()=>r());else r();};video.addEventListener("seeked",fin);video.currentTime=t;setTimeout(fin,2500);});

/* ---------- signal helpers ---------- */
const nan=v=>v==null||!isFinite(v);
function hampel(a,k,n){const out=a.slice();for(let i=0;i<a.length;i++){if(nan(a[i]))continue;const w=[];for(let j=Math.max(0,i-k);j<=Math.min(a.length-1,i+k);j++)if(!nan(a[j]))w.push(a[j]);if(w.length<3)continue;
  w.sort((x,y)=>x-y);const med=w[w.length>>1],mad=w.map(x=>Math.abs(x-med)).sort((x,y)=>x-y)[w.length>>1]*1.4826;if(Math.abs(a[i]-med)>n*Math.max(mad,.5))out[i]=med;}return out;}
function fill(a,maxGap){const out=a.slice();let i=0;while(i<out.length){if(!nan(out[i])){i++;continue;}let j=i;while(j<out.length&&nan(out[j]))j++;const L=i-1,R=j;
    if(L>=0&&R<out.length&&j-i<=maxGap){for(let k=i;k<j;k++)out[k]=out[L]+(out[R]-out[L])*(k-L)/(R-L);}
    else if(L<0&&R<out.length&&j-i<=maxGap){for(let k=i;k<j;k++)out[k]=out[R];}else if(R>=out.length&&L>=0&&j-i<=maxGap){for(let k=i;k<j;k++)out[k]=out[L];}i=j;}return out;}
/* 2nd-order Butterworth low-pass, run forward then backward (zero lag, effectively 4th order) */
function butter(a,fc,fs){if(!(fs>2.2*fc)||a.length<7)return a.slice();const out=a.slice();
  // only filter runs without gaps
  let i=0;while(i<a.length){if(nan(a[i])){i++;continue;}let j=i;while(j<a.length&&!nan(a[j]))j++;if(j-i>=7){const seg=a.slice(i,j),f=filtfilt(seg,fc,fs);for(let k=i;k<j;k++)out[k]=f[k-i];}i=j;}return out;}
function filtfilt(x,fc,fs){/* Winter: correct the cut-off for the second pass */const wc=Math.tan(Math.PI*Math.min(fc/.802,fs*.45)/fs),k1=Math.SQRT2*wc,k2=wc*wc,a0=k2/(1+k1+k2),a1=2*a0,a2=a0,k3=2*a0/k2,b1=-2*a0+k3,b2=1-2*a0-k3;
  const pad=Math.min(x.length-1,12),ext=[];for(let i=pad;i>0;i--)ext.push(2*x[0]-x[i]);ext.push(...x);for(let i=1;i<=pad;i++)ext.push(2*x[x.length-1]-x[x.length-1-i]);
  const run=s=>{const y=new Array(s.length);y[0]=s[0];y[1]=s[1];for(let n=2;n<s.length;n++)y[n]=a0*s[n]+a1*s[n-1]+a2*s[n-2]+b1*y[n-1]+b2*y[n-2];return y;};
  let y=run(ext);y=run(y.reverse()).reverse();return y.slice(pad,pad+x.length);}

/* ---------- tracking ---------- */
/* opts: {t0,t1,fps,maxFrames,kind,view,AW,AH,signal} -> {frames:[{t}], pts:[{joint:[x,y]}], raw, side, fps, conf} */
async function track(video,opts,onP){const lm=await VB.filmPose.load(opts.kind||"full");const t0=opts.t0,t1=opts.t1,len=t1-t0;
  let f=opts.fps||30;const maxN=opts.maxFrames||300;let n=Math.floor(len*f)+1;if(n>maxN){f=(maxN-1)/len;n=maxN;}
  const AW=opts.AW,AH=opts.AH,raw=[],times=[],step=1/f;const wasPaused=video.paused;video.pause();
  for(let i=0;i<n;i++){if(opts.signal&&opts.signal.aborted)throw new Error("cancelled");const t=Math.min(t1,t0+i*step);await seek(video,t+Math.min(.5*step,.004));
    let r=null;lastTs=Math.max(lastTs+1,Math.round(performance.now()));try{r=MODE==="IMAGE"?lm.detect(video):lm.detectForVideo(video,lastTs);}catch(e){r=null;}
    const P=r&&r.landmarks&&r.landmarks[0];raw.push(P?P.map(p=>({x:p.x*AW,y:p.y*AH,v:p.visibility==null?1:p.visibility})):null);times.push(t);onP&&onP((i+1)/n);
    if(i%6===5)await new Promise(r=>setTimeout(r,0));}
  /* second pass: frames where no one was found (a small or still athlete is easy to miss) are searched again on a
     zoomed-in crop around where the athlete is in the nearest frame that worked, moving outward from those frames */
  const miss=raw.map((r,i)=>r?-1:i).filter(i=>i>=0);
  if(miss.length&&miss.length<n){try{const im=await VB.filmPose.loadImage(opts.kind||"full"),vw=video.videoWidth,vh=video.videoHeight,cv=document.createElement("canvas"),g=cv.getContext("2d");
      const box=r=>{const pts=r.filter(p=>p.v>.3);if(pts.length<6)return null;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);});return [x0/AW*vw,y0/AH*vh,x1/AW*vw,y1/AH*vh];};
      const near=i=>{for(let d=1;d<n;d++){for(const j of [i-d,i+d])if(j>=0&&j<n&&raw[j])return raw[j];}return null;};
      const order=miss.slice().sort((a,b)=>{const dist=i=>{for(let d=1;d<n;d++)if((raw[i-d])||(raw[i+d]))return d;return n;};return dist(a)-dist(b);});
      let done=0;for(const i of order){if(opts.signal&&opts.signal.aborted)break;const ref=near(i),b=ref&&box(ref);if(!b){done++;continue;}
        const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,side=Math.min(Math.max(vw,vh),Math.max(b[2]-b[0],b[3]-b[1])*1.7),x0=Math.max(0,Math.min(vw-side,cx-side/2)),y0=Math.max(0,Math.min(vh-side,cy-side/2)),cw=Math.min(side,vw),ch=Math.min(side,vh);
        cv.width=cv.height=384;await seek(video,times[i]+Math.min(.5*step,.004));g.drawImage(video,x0,y0,cw,ch,0,0,384,384);let r=null;try{r=im.detect(cv);}catch(e){}
        const P=r&&r.landmarks&&r.landmarks[0];if(P)raw[i]=P.map(p=>({x:(x0+p.x*cw)/vw*AW,y:(y0+p.y*ch)/vh*AH,v:p.visibility==null?1:p.visibility}));done++;onP&&onP(1,done/order.length);}}
    catch(e){}}
  if(!wasPaused)video.play().catch(()=>{});
  return clean(raw,times,f,opts.view||"side",AW,AH);}

function clean(raw,times,f,view,AW,AH){const N=raw.length,found=raw.filter(Boolean).length;if(found<Math.max(4,N*.35))return {frames:times.map(t=>({t})),pts:null,found,n:N,fps:f};
  const get=(i,name)=>{const r=raw[i];if(!r)return null;const p=r[L[name]];return p&&p.v>=.35?[p.x,p.y,p.v]:null;};
  /* 1. keep each limb's identity consistent: side-on, the model can swap left and right from one frame to the next */
  const swap=(i,parts)=>{parts.forEach(pt=>{const a=raw[i][L["l_"+pt]],b=raw[i][L["r_"+pt]];raw[i][L["l_"+pt]]=b;raw[i][L["r_"+pt]]=a;});};
  [ARM,LEG].forEach(parts=>{let prev=null;for(let i=0;i<N;i++){if(!raw[i])continue;const cur=s=>parts.map(pt=>{const p=raw[i][L[s+"_"+pt]];return [p.x,p.y];});const l=cur("l"),r=cur("r");
      if(prev){const d=(A,B)=>A.reduce((s,p,k)=>s+Math.hypot(p[0]-B[k][0],p[1]-B[k][1]),0),keep=d(l,prev.l)+d(r,prev.r),sw=d(l,prev.r)+d(r,prev.l);
        // only swap when it is clearly better: the two limbs can pass each other legitimately
        if(sw<keep*.6){swap(i,parts);prev={l:r,r:l};continue;}}prev={l,r};}});
  /* 2. near side: the one the model saw more clearly over the whole clip */
  let lv=0,rv=0;raw.forEach(r=>{if(!r)return;["shoulder","elbow","hip","knee","ankle"].forEach(p=>{lv+=r[L["l_"+p]].v;rv+=r[L["r_"+p]].v;});});const near=lv>=rv?"l":"r",far=near==="l"?"r":"l";
  /* 3. series per output joint */
  const series={};const put=(k,fn)=>{series[k]={x:[],y:[]};for(let i=0;i<N;i++){const p=fn(i);series[k].x.push(p?p[0]:NaN);series[k].y.push(p?p[1]:NaN);}};
  const head=i=>{const e=get(i,near+"_ear")||get(i,far+"_ear"),n=get(i,"nose"),s=get(i,near+"_shoulder");const top=e||n;if(!top)return null;const d=s?Math.max(4,s[1]-top[1]):20;return [top[0],top[1]-.45*d];};
  if(view==="front"){put("head",head);["shoulder","hip","knee","ankle","heel","toe"].forEach(p=>{put("l_"+p,i=>get(i,"l_"+p));put("r_"+p,i=>get(i,"r_"+p));});}
  else{put("head",head);ARM.forEach(p=>put(p,i=>get(i,near+"_"+p)));LEG.forEach(p=>put(p,i=>get(i,near+"_"+p)));
    // far leg too, for foot contact (the far foot may still be on the floor)
    put("far_heel",i=>get(i,far+"_heel"));put("far_toe",i=>get(i,far+"_toe"));put("far_ankle",i=>get(i,far+"_ankle"));}
  /* 4. clean: outliers, gaps, then smooth; keep a lightly cleaned copy of the feet for contact timing */
  const gap=Math.max(2,Math.round(f*.2)),FC={head:6,shoulder:7,hip:7,knee:10,ankle:12,heel:12,toe:12,elbow:12,wrist:14};
  const feet={},pts=new Array(N).fill(null).map(()=>({}));
  for(const k in series){const s=series[k],fc=FC[k.replace(/^(l_|r_|far_)/,"")]||9;
    ["x","y"].forEach(ax=>{const h=fill(hampel(s[ax],Math.max(2,Math.round(f*.06)),3),gap);s[ax+"r"]=h;s[ax]=butter(h,fc,f);});
    if(/heel|toe|ankle/.test(k))feet[k]={x:s.xr,y:s.yr};
    for(let i=0;i<N;i++){const x=s.x[i],y=s.y[i];if(!nan(x)&&!nan(y))pts[i][k]=[Math.max(0,Math.min(AW,x)),Math.max(0,Math.min(AH,y))];}}
  /* side view: toe for the app's skeleton is the foot index; keep the far leg out of the drawn skeleton */
  const conf=raw.map(r=>r?["shoulder","hip","knee","ankle"].reduce((s,p)=>s+r[L[near+"_"+p]].v,0)/4:0);
  return {frames:times.map(t=>({t})),pts,feet,found,n:N,fps:f,near,conf};}

VB.filmPose={loadImage,get supported(){return typeof WebAssembly==="object";},set mode(m){MODE=m;lmP={};},get mode(){return MODE;},load,track,fps,_clean:clean,_butter:butter};
})();
