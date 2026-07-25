/* Run with: node smoke-test-v3.js  (v6 local server must be on 4183) */
const base='http://localhost:4183';
const today=()=>{const d=new Date();return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`};
const start=()=>{const d=new Date();d.setDate(d.getDate()-2);return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`};
async function json(path,status=200){const r=await fetch(base+path);if(r.status!==status)throw Error(`${path}: expected ${status}, got ${r.status}`);return r.json()}
async function run(){
  const health=await json('/api/health');if(!health.krcConfigured)throw Error('KRC key is not configured');
  const range=`from=${start()}&to=${today()}`;
  const jeju=await json(`/api/krc/reservoir-by-county?county=${encodeURIComponent('제주특별자치도')}&${range}`);
  if(!jeju.items.length)throw Error('Jeju returned no observations');
  const latest=new Map();for(const x of jeju.items){const old=latest.get(x.facilityCode);if(!old||x.checkDate>old.checkDate)latest.set(x.facilityCode,x)}
  const sample=[...latest.values()][0];
  const detail=await json(`/api/krc/reservoir-levels?facCode=${encodeURIComponent(sample.facilityCode)}&from=${start()}&to=${today()}`);
  if(!detail.items.length)throw Error('Reservoir detail returned no observations');
  const noData=await json(`/api/krc/reservoir-by-county?county=${encodeURIComponent('서울특별시')}&${range}`,502);
  if(noData.detail!=='NO_DATA')throw Error('Expected NO_DATA for Seoul guard');
  console.log(JSON.stringify({ok:true,jejuObservations:jeju.items.length,jejuReservoirs:latest.size,sample:{name:sample.facilityName,code:sample.facilityCode,date:sample.checkDate},detailObservations:detail.items.length,seoul:noData.detail},null,2));
}
run().catch(e=>{console.error(e.stack||e.message);process.exitCode=1});
