/* sw.js: offline support. The app shell and data files are cached on first visit; pages work without a connection,
   and training saved offline syncs to your account when you are back online.
   Bump VERSION whenever you publish changes so phones pick up the new files. */
const VERSION="vbj-v8-23";
const CORE=["./", "index.html", "manifest.webmanifest", "css/app.css", "css/crows.css", "css/fonts.css", "css/home-toolkit.css", "fonts/barlow-condensed-latin-500-normal.woff2", "fonts/barlow-condensed-latin-600-normal.woff2", "fonts/barlow-condensed-latin-700-normal.woff2", "fonts/barlow-condensed-latin-800-italic.woff2", "fonts/barlow-condensed-latin-800-normal.woff2", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-500-normal.woff2", "fonts/barlow-latin-600-normal.woff2", "fonts/barlow-latin-700-normal.woff2", "img/apple-touch-icon.png", "img/figure.webp", "img/icon-192.png", "img/icon-512.png", "img/og.png", "js/app-features.js", "js/arena.js", "js/athlete.js", "js/backend.js", "js/body-mesh.js", "js/body3d.js", "js/calendar.js", "js/clips.js", "js/config.js", "js/core.js", "js/court3d.js", "js/crows-arcade.js", "js/crows-court.js", "js/crows-data.js", "js/crows-iq.js", "js/crows-spike.js", "js/crows.js", "js/data-drills.js", "js/data-exercise-detail.js", "js/data-extras.js", "js/data-knowledge.js", "js/data-offcourt.js", "js/data-plays.js", "js/data-posprog.js", "js/data-rules.js", "js/data-tech-more.js", "js/data-tech.js", "js/data-training.js", "js/demo3d.js", "js/diagram.js", "js/exmotion-data.js", "js/exmotion.js", "js/film-pose.js", "js/film.js", "js/gl.js", "js/hero.js", "js/home.js", "js/i18n-fr-content.js", "js/i18n-fr.js", "js/i18n.js", "js/icons.js", "js/locker.js", "js/player-data.js", "js/profile.js", "js/qr.js", "js/squad.js", "js/team-plus.js", "js/team3d.js", "js/toolkit-plus.js", "js/toolkit.js", "js/ui.js", "js/vendor/chart-4.4.1.umd.js", "js/vendor/jsqr-1.4.0.js", "js/vendor/supabase-2.119.2.js", "js/week-gameday.js"];
/* large files that never change at the same address (pose model, WebAssembly, fonts, pinned libraries): served from the cache once fetched */
const IMMUTABLE=/\/(models|fonts|js\/vendor)\//,KEEP="vbj-immutable-1",SETTINGS="vbj-settings";
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE.filter(f=>f!=="js/body-mesh.js"))).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!==KEEP&&k!==SETTINGS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);if(r.method!=="GET")return;
  // never cache account and database traffic
  if(/supabase\.co$/.test(u.hostname))return;
  const same=u.origin===location.origin;if(!same)return;
  // the big unchanging files: cache first, kept across releases
  if(IMMUTABLE.test(u.pathname)){e.respondWith(caches.open(KEEP).then(async c=>{const hit=await caches.match(r);if(hit)return hit;const res=await fetch(r);if(res&&res.ok)c.put(r,res.clone());return res;}));return;}
  // everything else: stale-while-revalidate, answer from the cache at once and refresh it in the background
  e.respondWith(caches.open(VERSION).then(async c=>{const hit=await c.match(r,{ignoreSearch:same});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res;}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit;}const res=await net;if(res)return res;
    if(r.mode==="navigate")return c.match("index.html");return new Response("",{status:504});}));});
/* training reminders: shown by the browser on supported phones (installed app, Chrome on Android) */
self.addEventListener("periodicsync",e=>{if(e.tag!=="vbj-reminder")return;e.waitUntil((async()=>{const c=await caches.open(SETTINGS),r=await c.match("reminder");if(!r)return;
  const s=await r.json(),now=new Date(),day=now.getDay(),done=s.lastDone===now.toISOString().slice(0,10);
  if(!s.on||done||!(s.days||[]).includes(day)||now.getHours()<s.hour)return;
  await self.registration.showNotification("Time to train",{body:s.text||"Today's session is ready.",icon:"img/icon-192.png",badge:"img/icon-192.png",tag:"vbj-reminder",data:{url:"./#today"}});})());});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window"}).then(ws=>{for(const w of ws){if("focus" in w)return w.focus();}return self.clients.openWindow(e.notification.data&&e.notification.data.url||"./");}));});
