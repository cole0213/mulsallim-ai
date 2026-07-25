const waterData = [
  {id:'damyang',name:'담양저수지',district:'전남 해남군',rate:37,normal:-18,days:11,rain:4,status:'danger',label:'주의',trend:[48,47,45,44,42,40,37],historyDate:'07.17 ~ 07.23',farmer:'향후 48시간 내 관개 일정을 재검토하고, 필수 급수 외 사용은 보류하세요.',manager:'우선 현장 점검 대상으로 지정하고 인근 대체 수원 가능량을 확인하세요.',factors:[['평년 대비 저수율','-18%p'],['최근 7일 수위 변화','-11%p'],['향후 3일 강수','4mm'],['가뭄 위험 기여도','높음']]},
  {id:'geumcheon',name:'금천저수지',district:'전남 나주시',rate:46,normal:-9,days:18,rain:12,status:'watch',label:'관심',trend:[53,52,50,49,48,47,46],historyDate:'07.17 ~ 07.23',farmer:'이번 주 관개는 가능하나, 강수 전까지 계획 급수량을 10% 절감하세요.',manager:'3일 후 수위 회복 여부를 확인하고 하락이 지속되면 점검 대상으로 전환하세요.',factors:[['평년 대비 저수율','-9%p'],['최근 7일 수위 변화','-7%p'],['향후 3일 강수','12mm'],['가뭄 위험 기여도','중간']]},
  {id:'wolchul',name:'월출저수지',district:'전남 영암군',rate:52,normal:-4,days:24,rain:19,status:'stable',label:'안정',trend:[55,55,54,54,53,52,52],historyDate:'07.17 ~ 07.23',farmer:'현재 관개 계획을 유지하되, 다음 예보 갱신일에 다시 확인하세요.',manager:'정기 모니터링을 유지하세요.',factors:[['평년 대비 저수율','-4%p'],['최근 7일 수위 변화','-3%p'],['향후 3일 강수','19mm'],['가뭄 위험 기여도','낮음']]},
  {id:'byeongyeong',name:'병영저수지',district:'전남 강진군',rate:34,normal:-21,days:8,rain:3,status:'danger',label:'주의',trend:[46,44,42,40,38,36,34],historyDate:'07.17 ~ 07.23',farmer:'절수 모드로 전환하고, 생육 단계상 필수 급수 여부를 우선 판단하세요.',manager:'긴급 점검 후보입니다. 수혜구역과 대체 급수 가능량을 우선 확인하세요.',factors:[['평년 대비 저수율','-21%p'],['최근 7일 수위 변화','-12%p'],['향후 3일 강수','3mm'],['가뭄 위험 기여도','매우 높음']]},
  {id:'tamjin',name:'탐진저수지',district:'전남 장흥군',rate:41,normal:-13,days:14,rain:7,status:'watch',label:'관심',trend:[49,48,46,46,44,42,41],historyDate:'07.17 ~ 07.23',farmer:'고수요 시간대 관개를 피하고, 3일 뒤 예측을 다시 확인하세요.',manager:'수위 급감 원인을 확인할 수 있도록 현장 기록을 검토하세요.',factors:[['평년 대비 저수율','-13%p'],['최근 7일 수위 변화','-8%p'],['향후 3일 강수','7mm'],['가뭄 위험 기여도','중간']]},
  {id:'boknae',name:'복내저수지',district:'전남 보성군',rate:58,normal:2,days:29,rain:17,status:'stable',label:'안정',trend:[59,59,58,59,58,58,58],historyDate:'07.17 ~ 07.23',farmer:'계획 관개를 유지하세요.',manager:'정기 모니터링을 유지하세요.',factors:[['평년 대비 저수율','+2%p'],['최근 7일 수위 변화','-1%p'],['향후 3일 강수','17mm'],['가뭄 위험 기여도','낮음']]}
];

const $ = (q) => document.querySelector(q);
let selectedId = 'damyang';
const mean = (key) => Math.round(waterData.reduce((sum, item) => sum + item[key], 0) / waterData.length);
const esc = (text) => String(text).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));

function renderSummary(){
  $('#meanSafetyDays').textContent = `${mean('days')}일`;
  $('#priorityCount').textContent = `${waterData.filter((x) => x.status === 'danger').length}곳`;
  $('#meanStorage').textContent = `${mean('rate')}%`;
  $('#meanDeviation').textContent = `${mean('normal')}%p`;
  $('#meanRainfall').textContent = `${mean('rain')}mm`;
  $('#updatedAt').textContent = `시연 기준시각 ${new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
}
function getFiltered(){
  const query = $('#searchInput').value.trim().toLowerCase();
  const status = $('#statusFilter').value;
  const sort = $('#sortSelect').value;
  const rows = waterData.filter((x) => (status === 'all' || x.status === status) && `${x.name} ${x.district}`.toLowerCase().includes(query));
  return rows.sort((a,b) => sort === 'days' ? a.days-b.days : sort === 'storage' ? a.rate-b.rate : ({danger:0,watch:1,stable:2}[a.status]-{danger:0,watch:1,stable:2}[b.status]) || a.days-b.days);
}
function renderRows(){
  const rows = getFiltered();
  $('#reservoirRows').innerHTML = rows.map((x) => `<tr class="data-row ${x.id===selectedId?'selected':''}" data-id="${x.id}"><td class="name-cell"><b>${esc(x.name)}</b><small>${esc(x.district)}</small></td><td><span class="status-pill ${x.status}">${x.label}</span></td><td>${x.rate}%</td><td class="${x.normal < -10 ? 'low' : ''}">${x.normal > 0 ? '+' : ''}${x.normal}%p</td><td><b>${x.days}일</b></td><td>${x.status==='danger'?'우선 점검':x.status==='watch'?'추이 확인':'정기 확인'}</td></tr>`).join('') || '<tr><td colspan="6">조건에 맞는 저수지가 없습니다.</td></tr>';
  $('#tableCaption').textContent = `총 ${rows.length}개 저수지 표시 · 현재는 시연 데이터입니다.`;
  document.querySelectorAll('.data-row').forEach((row) => row.addEventListener('click', () => { selectedId=row.dataset.id; renderRows(); renderDetail(); }));
}
function chartPath(values){
  const width=330,height=120,pad=8,min=Math.min(...values)-2,max=Math.max(...values)+2;
  const pts=values.map((value,index)=>[pad+index*((width-pad*2)/(values.length-1)),height-pad-((value-min)/(max-min))*(height-pad*2)]);
  return {line:pts.map((point,index)=>`${index?'L':'M'} ${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' '),area:`M ${pts[0][0]} ${height-pad} ${pts.map((point)=>`L ${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ')} L ${pts[pts.length-1][0]} ${height-pad} Z`};
}
function renderDetail(){
  const x=waterData.find((item)=>item.id===selectedId); const path=chartPath(x.trend);
  $('#detailPanel').innerHTML=`<div><p class="detail-label">SELECTED RESERVOIR · ${x.label}</p><h3>${esc(x.name)}</h3><p>${esc(x.district)}</p><div class="detail-metric">${x.days}일 <small>안정 관개 가능</small></div><p>현재 저수율 ${x.rate}% · 평년 대비 ${x.normal>0?'+':''}${x.normal}%p</p></div><div class="chart-wrap"><p class="detail-label">최근 7일 저수율 추세</p><svg viewBox="0 0 330 140" role="img" aria-label="최근 7일 저수율 추세"><line class="chart-grid" x1="0" y1="30" x2="330" y2="30"/><line class="chart-grid" x1="0" y1="75" x2="330" y2="75"/><line class="chart-grid" x1="0" y1="120" x2="330" y2="120"/><path class="chart-area" d="${path.area}"/><path class="chart-line" d="${path.line}"/></svg><div class="chart-caption"><span>${x.historyDate.split(' ~ ')[0]}</span><span>${x.historyDate.split(' ~ ')[1]}</span></div><ul class="factor-list">${x.factors.map(([name,value])=>`<li><span>${name}</span><b>${value}</b></li>`).join('')}</ul></div><div><p class="detail-label">AI 행동 처방</p><div class="action-box"><p><b>농민</b><br />${esc(x.farmer)}</p><p><b>관리자</b><br />${esc(x.manager)}</p></div></div>`;
}
function fillAdvisory(){ $('#advisoryReservoir').innerHTML=waterData.map((x)=>`<option value="${x.id}">${x.name} · ${x.district}</option>`).join(''); $('#advisoryReservoir').value=selectedId; }
function advisory(event){
  event.preventDefault(); const x=waterData.find((item)=>item.id===$('#advisoryReservoir').value); const crop=$('#crop').value,stage=$('#stage').value,area=Number($('#area').value);
  const base={rice:5.5,vegetable:4.2,fruit:3.1}[crop],multiplier={growth:1,peak:1.25,late:.7}[stage],daily=Math.round(area*base*multiplier/1000); const cropName={rice:'벼',vegetable:'노지 채소',fruit:'과수'}[crop];
  const caution=x.status==='danger'?'절수 전환이 필요합니다. 필수 급수 외 관개를 보류하고 현장 담당자와 대체 급수 가능 여부를 확인하세요.':x.status==='watch'?'계획 관개는 가능하나 강수예보 갱신 전까지 일일 급수량을 10% 줄이세요.':'현재 조건에서는 계획 관개를 유지할 수 있습니다. 다음 예보 갱신일에 다시 확인하세요.';
  $('#advisoryResult').innerHTML=`<p class="eyebrow">ADVISORY RESULT · ${x.label}</p><h3>${x.name} 수원 기준<br />${cropName} 관개 처방</h3><div class="result-numbers"><div><strong>${daily}㎥</strong><span>추정 일일 용수 수요</span></div><div><strong>${x.days}일</strong><span>현재 안전일 지표</span></div></div><p>${caution}</p><p><small>※ 추정 수요는 작물·생육단계·면적 입력값으로 산출한 시뮬레이션입니다. 실제 처방에는 토양수분, 수혜구역, 급수량 등 추가 데이터가 필요합니다.</small></p>`;
}
function exportReport(){
  const priority=waterData.filter((x)=>x.status==='danger').map((x)=>({저수지:x.name,지역:x.district,저수율:`${x.rate}%`,안전일:`${x.days}일`,조치:x.manager}));
  const content=JSON.stringify({생성시각:new Date().toISOString(),데이터상태:'시연 데이터',우선점검대상:priority},null,2); const blob=new Blob([content],{type:'application/json;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='water-ai-daily-checklist.json';a.click();URL.revokeObjectURL(url);
}
['input','change'].forEach((event)=>{ $('#searchInput').addEventListener(event,renderRows); $('#statusFilter').addEventListener(event,renderRows); $('#sortSelect').addEventListener(event,renderRows); });
$('#advisoryForm').addEventListener('submit',advisory); $('#exportReport').addEventListener('click',exportReport); $('#openDataModal').addEventListener('click',()=>$('#dataModal').showModal()); $('#sourceDetail').addEventListener('click',()=>$('#dataModal').showModal()); $('.dialog-close').addEventListener('click',()=>$('#dataModal').close()); $('#dataModal').addEventListener('click',(event)=>{if(event.target===$('#dataModal'))$('#dataModal').close();});
renderSummary(); renderRows(); renderDetail(); fillAdvisory();
