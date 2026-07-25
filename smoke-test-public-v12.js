const base=process.env.BASE_URL||'http://127.0.0.1:4184';
async function get(path){const r=await fetch(base+path);const type=r.headers.get('content-type')||'';const body=type.includes('application/json')?await r.json():await r.text();return{status:r.status,headers:Object.fromEntries(r.headers),body}}
(async()=>{
  const health=await get('/api/health');if(health.status!==200||!health.body.krcConfigured)throw Error('health/KRC configuration failed');
  const root=await get('/');if(root.status!==200||!root.body.includes('mulsallim-public-county-v12'))throw Error('v12 landing entry failed');
  for(const page of ['/mulsallim-dashboard-county-v12.html','/mulsallim-ai-model-card-v3.html','/mulsallim-pilot.html']){const r=await get(page);if(r.status!==200)throw Error(`page failed: ${page}`)}
  const pilot=await get('/api/pilot/metrics');if(pilot.status!==200||pilot.body.feedbackRetentionDays!==90)throw Error('pilot metrics failed');
  console.log(JSON.stringify({ok:true,base,apiMode:health.body.apiMode,krcConfigured:health.body.krcConfigured,pilotResponses:pilot.body.responses,entry:'v12'},null,2));
})().catch(error=>{console.error(error.stack||error.message);process.exit(1)});
