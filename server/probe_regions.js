const counties=['강원특별자치도','경기도','경상남도','경상북도','전남','전북','충청남도','충청북도','제주특별자치도'];
const stamp=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10).replaceAll('-','');

(async()=>{
  const to=stamp(new Date()),from=stamp(new Date(Date.now()-2*86400000)),out=[];
  for(const county of counties){
    const r=await fetch('http://localhost:4184/api/krc/reservoir-by-county?'+new URLSearchParams({county,from,to}));
    const x=await r.json(),latest=new Map();
    for(const item of x.items||[]) if(!latest.has(item.facilityCode)||latest.get(item.facilityCode).checkDate<item.checkDate) latest.set(item.facilityCode,item);
    out.push({county,status:r.status,rows:(x.items||[]).length,sample:[...latest.values()].slice(0,3).map(({facilityCode,facilityName,county,checkDate,storageRate})=>({facilityCode,facilityName,county,checkDate,storageRate}))});
  }
  console.log(JSON.stringify(out,null,2));
})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1});
