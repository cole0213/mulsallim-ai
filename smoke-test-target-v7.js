const fs=require('node:fs');
const root=process.env.BASE_URL||'http://localhost:4184';
async function request(path,init){const r=await fetch(root+path,init);let body;try{body=await r.json()}catch{body=await r.text()}return{status:r.status,body}}
async function main(){
  const health=await request('/api/health');
  if(health.status!==200||!health.body.krcConfigured)throw Error('health failed');
  const county=await request('/api/krc/reservoir-by-county?county=%EC%A0%9C%EC%A3%BC%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84&from=20260721&to=20260723');
  if(county.status!==200||!county.body.items?.length)throw Error('county lookup failed');
  const code=county.body.items[0].facilityCode;
  const detail=await request(`/api/krc/reservoir-levels?facCode=${encodeURIComponent(code)}&from=20260701&to=20260723`);
  if(detail.status!==200||!detail.body.items?.length)throw Error('detail lookup failed');
  const seoul=await request('/api/krc/reservoir-by-county?county=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C&from=20260721&to=20260723');
  if(seoul.status!==200||seoul.body.noData!==true)throw Error('no-data handling failed');
  for(const asset of ['/','/mulsallim-public-county-v7.html','/mulsallim-dashboard-county-v7.html','/mulsallim-ai-model-card.html','/mulsallim-action-card.html']){
    const r=await fetch(root+asset);if(!r.ok)throw Error(`asset failed: ${asset}`);
  }
  const cards=JSON.parse(fs.readFileSync('server/action-cards.json','utf8'));
  const card=cards.find(x=>Date.parse(x.expiresAt)>Date.now());
  if(!card)throw Error('no collaboration card available for read test');
  const publicCard=await request(`/api/action-cards/${card.id}`);
  if(publicCard.status!==200||publicCard.body.card.editKey)throw Error('public card privacy failed');
  const forbidden=await request(`/api/action-cards/${card.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'done'})});
  if(forbidden.status!==403)throw Error('owner permission test failed');
  console.log(JSON.stringify({ok:true,countyRows:county.body.items.length,detailRows:detail.body.items.length,seoulNoData:seoul.body.noData,cardPrivacy:true,ownerProtection:true},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
