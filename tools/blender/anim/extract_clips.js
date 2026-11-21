// Pull the existing technique clips out of athlete.js as plain data (functions sampled densely).
const vm=require('vm'),fs=require('fs');
const ctx={window:{},performance:{now:()=>0},console};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
for(const f of ['js/gl.js','js/athlete.js'])vm.runInContext(fs.readFileSync(__dirname+'/../../../'+f,'utf8'),ctx,{filename:f});
const C=ctx.VB.Athlete.CLIPS,out={};
for(const [name,c] of Object.entries(C)){
  const ch={};
  for(const [k,v] of Object.entries(c.ch)){
    if(typeof v==='function'){const a=[];for(let t=0;t<=c.dur+1e-9;t+=1/120)a.push([+t.toFixed(5),+v(t).toFixed(5)]);ch[k]={dense:a};}
    else ch[k]=v;
  }
  out[name]={dur:c.dur,contact:c.contact,tTO:c.tTO||null,tLand:c.tLand||null,hand:c.hand||'R',ch,feet:c.feet,labels:c.labels||[]};
}
fs.writeFileSync(__dirname+'/clips_base.json',JSON.stringify(out));
console.log(Object.keys(out).join(' '));
