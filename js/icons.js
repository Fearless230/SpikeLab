/* icons.js: one consistent set of simple line icons (24x24, 1.8 px stroke, round caps), drawn for this app.
   VB.icon(name) returns the SVG markup. A decorator adds them to skill filters, program tabs, the Train sub-nav,
   pillar cards and milestones as those render. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const P={
  // skills
  pass:'<path d="M5 14l7 4 7-4"/><path d="M5 14l7-3 7 3"/><circle cx="12" cy="6" r="2.6"/>',
  set:'<circle cx="12" cy="5.5" r="2.6"/><path d="M7.5 13.5c0-3 2-5 4.5-5s4.5 2 4.5 5"/><path d="M8 20l1.5-6.5M16 20l-1.5-6.5"/>',
  serve:'<circle cx="16.5" cy="5" r="2.6"/><path d="M6 20l3-7 4-2.5 3.5-3"/><path d="M9 13l-3.5-1.5"/>',
  attack:'<circle cx="17.5" cy="4.5" r="2.4"/><path d="M5 21l4.5-6.5L14 12l3-5"/><path d="M14 12l3.5 3.5L20 21"/><path d="M3 10h5M2 13.5h4"/>',
  block:'<path d="M3 18h18"/><path d="M3 14h18" stroke-dasharray="2 2"/><path d="M8.5 13V5.5M11 13V4.5M13.5 13V4.5M16 13V5.5"/>',
  dig:'<circle cx="12" cy="17.5" r="2.6"/><path d="M4 9l8 4.5L20 9"/><path d="M8 4l4 9.5L16 4"/>',
  transition:'<path d="M4 8h12l-3-3M20 16H8l3 3"/>',
  team:'<circle cx="7" cy="8" r="2.6"/><circle cx="17" cy="8" r="2.6"/><circle cx="12" cy="6" r="2.6"/><path d="M3 19c.6-3 2.2-4.6 4-4.6M21 19c-.6-3-2.2-4.6-4-4.6M8 19c.7-3.2 2.2-5 4-5s3.3 1.8 4 5"/>',
  all:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  wall:'<path d="M4 4v16M4 8h4M4 13h4M4 18h4"/><circle cx="15" cy="10" r="3"/><path d="M12 19l2-5"/>',
  fit:'<path d="M5 12.5l4 4L19 7"/>',
  // pillars
  jump:'<path d="M12 3v10M8 7l4-4 4 4"/><path d="M5 21h14"/><path d="M8 17.5l4-2.5 4 2.5"/>',
  hitting:'<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  armcare:'<path d="M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z"/><path d="M9 11.5h6M12 8.5v6"/>',
  landing:'<path d="M12 3v9M8.5 8.5L12 12l3.5-3.5"/><path d="M4 20h16"/><path d="M7 16.5c1.5 1 3.2 1.5 5 1.5s3.5-.5 5-1.5"/>',
  core:'<rect x="7" y="3.5" width="10" height="17" rx="4"/><path d="M7 9h10M7 14h10M12 3.5v17"/>',
  defense:'<path d="M12 3l7 3v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6z"/>',
  mobility:'<path d="M4 12a8 8 0 0113.7-5.6M20 12a8 8 0 01-13.7 5.6"/><path d="M17.5 3v4h-4M6.5 21v-4h4"/>',
  // tabs and sections
  foryou:'<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/>',
  position:'<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M12 4v16"/><circle cx="7.5" cy="9" r="1.2"/><circle cx="7.5" cy="15" r="1.2"/><circle cx="16.5" cy="12" r="1.2"/>',
  ready:'<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  build:'<path d="M4 20l4.5-1 10-10a2.1 2.1 0 00-3-3l-10 10z"/><path d="M14 7l3 3"/>',
  pillars:'<path d="M3 20h18M5 20V9M10 20V9M14 20V9M19 20V9M3 9l9-5 9 5z"/>',
  skills:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5c-2.5 3-2.5 14 0 17M12 3.5c2.5 3 2.5 14 0 17M3.5 12h17"/>',
  programs:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  body:'<circle cx="12" cy="4.8" r="2.3"/><path d="M6 9l6 1.2L18 9M12 10.2v5M9 21l3-5.8 3 5.8"/>',
  // milestones
  session:'<path d="M5 12.5l4 4L19 7"/>',streak:'<path d="M12 3c1 3.2 4.5 4.8 4.5 9.2A4.5 4.5 0 0112 17a4.5 4.5 0 01-4.5-4.8C7.5 9.5 9.5 9 10 6.5c1.2 1 2 2.2 2 3.5"/><path d="M8 21h8"/>',
  test:'<path d="M5 21V4M5 4h3M5 9h2M5 14h3M5 19h2"/><path d="M13 20V9M10 12l3-3 3 3"/>',
  film:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>',
  fix:'<path d="M14.5 6.5a4 4 0 00-5.2 5.2L4 17l3 3 5.3-5.3a4 4 0 005.2-5.2l-2.4 2.4-2.6-.4-.4-2.6z"/>',
  level:'<path d="M5 19h4v-5H5zM10 19h4V9h-4zM15 19h4V5h-4z"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 3M16 6h3a3 3 0 01-3 3M12 13v4M8.5 20h7"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3"/>',
  ball:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5c3 2.4 4.2 6 3.5 9.5M5.2 7c3.8-.5 7.4 1.3 9.3 4.4M5.6 17.4c.6-3.6 3-6.4 6.4-7.5"/>',
  // misc
  coach:'<path d="M4 20v-1.5A4.5 4.5 0 018.5 14h3"/><circle cx="9" cy="7.5" r="3.5"/><path d="M15 15l2 2 4-4.5"/>',
  share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
  speaker:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  whistle:'<path d="M3 12a5 5 0 0010 0V8.5h8V12h-4"/><circle cx="8" cy="12" r="1.3"/><path d="M8 5V3"/>',
};
VB.icon=(n,cls)=>P[n]?`<svg class="ic${cls?" "+cls:""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`:"";
const has=el=>el.querySelector(":scope > svg.ic");
const put=(el,n)=>{if(!el||has(el)||!P[n])return;el.insertAdjacentHTML("afterbegin",VB.icon(n));el.classList.add("hasic");};
let PIL0=null;const PIL=()=>PIL0||(VB.PROGRAMS?(PIL0=Object.entries(VB.PROGRAMS).reduce((o,[k,v])=>(o[v]=k,o),{})):{});
const BADGE={s1:"session",s10:"session",s25:"session",s50:"session",s100:"trophy",w2:"streak",w4:"streak",w8:"streak",w12:"streak",t1:"test",j5:"jump",j10:"jump",f1:"film",fx:"fix",lv:"level",p1:"trophy",g1:"calendar",jl:"ball"};
function decorate(root){
  root.querySelectorAll("[data-fs]").forEach(b=>put(b,b.dataset.fs));
  root.querySelectorAll("[data-off]").forEach(b=>put(b,"wall"));root.querySelectorAll("[data-fit]").forEach(b=>put(b,"fit"));
  root.querySelectorAll("[data-ptab]").forEach(b=>put(b,b.dataset.ptab));
  root.querySelectorAll(".trainnav a").forEach(a=>put(a,{"#skills":"skills","#plan":"programs","#body":"body"}[a.getAttribute("href")]));
  root.querySelectorAll("#progGrid .card h3").forEach(h=>{const k=PIL()[(h.dataset.en||h.textContent).trim()];if(k&&!h.dataset.en)h.dataset.en=h.textContent.trim();put(h,k);});
  root.querySelectorAll(".badge[data-b]").forEach(b=>put(b,BADGE[b.dataset.b]||"trophy"));}
let q=0;const run=()=>{q=0;decorate(document);};
new MutationObserver(()=>{if(!q)q=requestAnimationFrame(run);}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState!=="loading")run();else document.addEventListener("DOMContentLoaded",run);
})();
