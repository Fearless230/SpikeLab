/* test double for supabase-js: scripted auth and a tiny in-memory "docs" table */
window.__refreshes=0;window.__tokenOk=localStorage.getItem('fake-tokenok')!=='0';window.__netDown=false;window.__queries=0;
window.supabase={createClient(){const L=[];let sess=JSON.parse(localStorage.getItem('fake-sess')||'null');
  const store=JSON.parse(localStorage.getItem('fake-docs')||'{}');const persist=()=>localStorage.setItem('fake-docs',JSON.stringify(store));
  const result=(fn)=>{window.__queries++;if(window.__netDown)return {data:null,error:{message:'Failed to fetch',code:''}};if(!window.__tokenOk)return {data:null,error:{message:'JWT expired',code:'PGRST301'}};return fn();};
  const builder=t=>{const f={};let op='select',row=null;const b={select(){return b;},eq(k,v){f.eq=v;return b;},like(k,v){f.like=v;return b;},in(k,v){f.in=v;return b;},maybeSingle(){f.single=true;return b;},
    upsert(r){op='upsert';row=r;return b;},delete(){op='delete';return b;},
    then(res,rej){const r=result(()=>{if(t==='profiles')return {data:[],error:null};
      if(op==='upsert'){if(t==='docs'){store[row.path]=row.data;persist();}return {data:null,error:null};}
      if(op==='delete'){delete store[f.eq];persist();return {data:null,error:null};}
      if(f.single){return {data:store[f.eq]?{path:f.eq,data:store[f.eq]}:null,error:null};}
      const re=new RegExp('^'+String(f.like).replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/%/g,'.*')+'$');
      return {data:Object.keys(store).filter(k=>re.test(k)).map(k=>({path:k,data:store[k]})),error:null};});return Promise.resolve(r).then(res,rej);}};return b;};
  const api={auth:{onAuthStateChange(cb){L.push(cb);return {data:{subscription:{unsubscribe(){}}}};},async getSession(){return {data:{session:sess}};},
      async refreshSession(){window.__refreshes++;await new Promise(r=>setTimeout(r,50));window.__tokenOk=true;localStorage.setItem('fake-tokenok','1');if(sess){sess=Object.assign({},sess,{expires_at:Math.floor(Date.now()/1000)+3600});localStorage.setItem('fake-sess',JSON.stringify(sess));}L.forEach(f=>f('TOKEN_REFRESHED',sess));return {data:{session:sess},error:null};},
      async signInWithPassword({email}){sess={access_token:'x',user:{id:'aaaaaaaa-0000-4000-8000-000000000001',email,user_metadata:{name:'Maya'}},expires_at:Math.floor(Date.now()/1000)+3600};window.__tokenOk=true;localStorage.setItem('fake-tokenok','1');localStorage.setItem('fake-sess',JSON.stringify(sess));L.forEach(f=>f('SIGNED_IN',sess));return {error:null};},
      async signOut(){sess=null;localStorage.removeItem('fake-sess');L.forEach(f=>f('SIGNED_OUT',null));return {};},async updateUser(){return {error:null};}},
    from:builder,rpc(){return builder('rpc');},channel(){const c={on(){return c;},subscribe(){return c;}};return c;},removeChannel(){}};
  window.__emit=(ev,s)=>{sess=s;if(!s)localStorage.removeItem('fake-sess');L.forEach(f=>f(ev,s));};
  return api;}};
