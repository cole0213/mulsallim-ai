const fs=require('node:fs');
const root=process.env.BASE_URL||'http://localhost:4184';
async function request(path,init){const r=await fetch(root+path,init);let body;try{body=await r.json()}catch{body=await r.text()}return{status:r.status,body}}
(async()=>{
  const health=await request('/api/health'); if(health.status!==200||!health.body.krcConfigured)throw Error('health failed');
  const pilotBefore=await request('/api/pilot/metrics'); if(pilotBefore.status!==200)throw Error('pilot metrics failed');
  const invalid=await request('/api/pilot/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role:'farmer',ease:6,understanding:5,wouldUse:5})});
  if(invalid.status!==400)throw Error('invalid feedback should be rejected');
  const pilotAfter=await request('/api/pilot/metrics'); if(pilotAfter.body.responses!==pilotBefore.body.responses)throw Error('invalid feedback changed metrics');
  const now=new Date(),stamp=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10).replaceAll('-',''),from=stamp(new Date(now-2*86400000)),to=stamp(now);
  const regional=await request('/api/krc/reservoir-by-county?'+new URLSearchParams({county:'경상북도',from,to})); if(regional.status!==200||!regional.body.items?.length)throw Error('regional lookup failed');
  const code=regional.body.items[0].facilityCode,detail=await request('/api/krc/reservoir-levels?'+new URLSearchParams({facCode:code,from:stamp(new Date(now-30*86400000)),to})); if(detail.status!==200||!detail.body.items?.length)throw Error('detail lookup failed');
  for(const path of ['/','/mulsallim-public-county-v10.html','/mulsallim-dashboard-county-v10.html','/mulsallim-ai-model-card-v3.html','/mulsallim-pilot.html','/mulsallim-action-card-v2.html']){const r=await fetch(root+path);if(!r.ok)throw Error('asset failed '+path)}
  const source=fs.readFileSync('server/multiregion_evaluation.json','utf8');const evalResult=JSON.parse(source);if(evalResult.coverage.reservoirs!==18||evalResult.coverage.testExamples<1000)throw Error('evaluation evidence missing');
  console.log(JSON.stringify({ok:true,regionalRows:regional.body.items.length,detailRows:detail.body.items.length,pilotResponses:pilotAfter.body.responses,multiregion:{reservoirs:evalResult.coverage.reservoirs,testExamples:evalResult.coverage.testExamples}},null,2));
})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1});
