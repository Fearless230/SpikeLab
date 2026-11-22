/* clips.js: film clips kept on this device (IndexedDB), so a clip can be watched again later, even offline.
   Clips never leave the device and are not part of cloud saving. VB.clips.{put,get,del,clear,count,usage} */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
const DB="vbj-clips",ST="clips";let dbP=null;
function open(){if(dbP)return dbP;dbP=new Promise((res,rej)=>{if(!("indexedDB" in window))return rej(new Error("no indexedDB"));const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{r.result.createObjectStore(ST);};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});dbP.catch(()=>{dbP=null;});return dbP;}
function tx(mode,fn){return open().then(db=>new Promise((res,rej)=>{const t=db.transaction(ST,mode),s=t.objectStore(ST);let out;const r=fn(s);if(r)r.onsuccess=()=>{out=r.result;};t.oncomplete=()=>res(out);t.onerror=t.onabort=()=>rej(t.error||new Error("clip storage failed"));}));}
const MAX=40;
VB.clips={
  supported:"indexedDB" in window,
  async put(id,blob){const n=await this.count();if(n>=MAX)throw new Error("Up to "+MAX+" clips can be kept. Delete an old one first.");
    try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
    return tx("readwrite",s=>s.put({blob,type:blob.type||"video/mp4",size:blob.size||0,at:Date.now()},id));},
  async get(id){const r=await tx("readonly",s=>s.get(id));return r?r.blob:null;},
  del(id){return tx("readwrite",s=>s.delete(id));},
  clear(){return tx("readwrite",s=>s.clear());},
  count(){return tx("readonly",s=>s.count()).catch(()=>0);},
  async usage(){const n=await this.count();let used=null,quota=null;try{if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();used=e.usage;quota=e.quota;}}catch(e){}return {n,used,quota};}};
/* "delete my data" also removes kept clips */
const _reset=VB.reset;if(_reset)VB.reset=function(){VB.clips.clear().catch(()=>{});return _reset.apply(this,arguments);};
})();
