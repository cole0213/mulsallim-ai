/* v8: v4's audited KRC/card API plus anonymous pilot feedback and aggregate metrics. */
const fs=require('node:fs');
const path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'server-production-v4.js'),'utf8');
const oldEntry="'/mulsallim-public-county-v4.html'";
const nextEntry="'/mulsallim-public-county-v8.html'";
if(!source.includes(oldEntry))throw new Error('Expected v4 default entry was not found.');

const additions=`
const PILOT=path.join(root,'server','pilot-feedback.json'),PILOT_TTL=90*86400000;
function pilotRows(){try{const all=JSON.parse(fs.readFileSync(PILOT,'utf8'));const live=all.filter(x=>Date.now()-Date.parse(x.createdAt)<PILOT_TTL);if(live.length!==all.length)fs.writeFileSync(PILOT,JSON.stringify(live,null,2),'utf8');return live}catch{return []}}
function pilotMetrics(){const rows=pilotRows(),avg=k=>rows.length?Math.round(rows.reduce((s,x)=>s+Number(x[k]||0),0)/rows.length*10)/10:null,cards=cards();return{periodDays:30,feedbackRetentionDays:90,responses:rows.length,averages:{ease:avg('ease'),understanding:avg('understanding'),wouldUse:avg('wouldUse')},roles:rows.reduce((o,x)=>(o[x.role]=(o[x.role]||0)+1,o),{}),cards:{created30d:cards.length,open:cards.filter(x=>x.status==='open').length,checking:cards.filter(x=>x.status==='checking').length,done:cards.filter(x=>x.status==='done').length}}}
async function addPilotFeedback(req){let b;try{b=await read(req)}catch{return{status:400,body:{error:'설문 형식이 올바르지 않습니다.'}}}const role=['farmer','field','localgov','other'].includes(b.role)?b.role:'other',score=k=>Number.isInteger(Number(b[k]))&&Number(b[k])>=1&&Number(b[k])<=5?Number(b[k]):null,ease=score('ease'),understanding=score('understanding'),wouldUse=score('wouldUse'),comment=text(b.comment,400);if(!ease||!understanding||!wouldUse)return{status:400,body:{error:'세 개의 1~5점 문항을 모두 선택해 주세요.'}};const rows=pilotRows();rows.push({id:crypto.randomBytes(6).toString('hex'),role,ease,understanding,wouldUse,comment,createdAt:new Date().toISOString()});fs.mkdirSync(path.dirname(PILOT),{recursive:true});fs.writeFileSync(PILOT,JSON.stringify(rows,null,2),'utf8');return{status:201,body:{ok:true,metrics:pilotMetrics()}}}
`;
source=source.replace('http.createServer(async(req,res)=>{',additions+'http.createServer(async(req,res)=>{');
source=source.replace("const wanted=u.pathname==='/'?'/mulsallim-public-county-v4.html':decodeURIComponent(u.pathname),file=", "if(u.pathname==='/api/pilot/metrics'&&req.method==='GET')return send(res,200,pilotMetrics());if(u.pathname==='/api/pilot/feedback'&&req.method==='POST'){const r=await addPilotFeedback(req);return send(res,r.status,r.body)}const wanted=u.pathname==='/'?'/mulsallim-public-county-v4.html':decodeURIComponent(u.pathname),file=");
if(!source.includes('/api/pilot/feedback'))throw new Error('Pilot endpoint insertion failed.');
eval(source.replace(oldEntry,nextEntry));
