const fs=require('node:fs');
const path=require('node:path');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'multiregion_manifest.json'),'utf8'));
const base=process.env.BASE_URL||'http://localhost:4184';
const stamp=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10).replaceAll('-','');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function collect(target){
  const to=stamp(new Date()),from=stamp(new Date(Date.now()-365*86400000));
  const url=base+'/api/krc/reservoir-levels?'+new URLSearchParams({facCode:target.facilityCode,from,to});
  const response=await fetch(url),data=await response.json();
  if(!response.ok)throw new Error(`${target.facilityCode}: ${data.error||response.status}`);
  const items=(data.items||[]).filter(x=>Number.isFinite(x.storageRate)).sort((a,b)=>a.checkDate.localeCompare(b.checkDate));
  if(items.length<120)throw new Error(`${target.facilityCode}: insufficient observations (${items.length})`);
  return {...target,observations:items.map(({checkDate,storageRate,waterLevelM})=>({checkDate,storageRate,waterLevelM}))};
}

(async()=>{
  const collected=[],failed=[];
  for(const target of manifest){
    try{const row=await collect(target);collected.push(row);console.log(`OK ${target.region} ${target.facilityName}: ${row.observations.length}`)}
    catch(error){failed.push({facilityCode:target.facilityCode,message:error.message});console.error(`FAIL ${error.message}`)}
    await wait(250);
  }
  const output={collectedAt:new Date().toISOString(),source:'KRC 농촌용수 저수지 수위정보 API via local production proxy',windowDays:365,reservoirs:collected,failed};
  const out=path.join(__dirname,'multiregion_365d.json');
  fs.writeFileSync(out,JSON.stringify(output,null,2),'utf8');
  console.log(JSON.stringify({out,reservoirs:collected.length,observations:collected.reduce((n,x)=>n+x.observations.length,0),failed:failed.length},null,2));
  if(collected.length<12)process.exitCode=1;
})().catch(error=>{console.error(error.stack||error.message);process.exitCode=1});
