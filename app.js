const reservoirs = [
  { id: 'haenam', name: '해남 담양저수지', location: '전남 해남군', rate: 37, normal: -18, days: 11, rainfall: 4, status: 'danger', label: '주의', reason: '평년 대비 저수율이 낮고 최근 수위 하락 속도가 빠릅니다.', farmer: '향후 48시간 내 관개 계획을 재검토하고, 불필요한 급수는 보류하세요.', manager: '우선 현장 점검 대상으로 지정하고 인근 대체 수원 가능 여부를 확인하세요.' },
  { id: 'naju', name: '나주 금천저수지', location: '전남 나주시', rate: 46, normal: -9, days: 18, rainfall: 12, status: 'watch', label: '관심', reason: '강수예보는 있으나 평년보다 저수율이 낮아 추이를 관찰해야 합니다.', farmer: '이번 주 관개는 가능하나, 강수 전까지 계획 급수량을 10% 절감하세요.', manager: '3일 후 수위 회복 여부를 확인하고, 하락 지속 시 점검 대상으로 전환하세요.' },
  { id: 'yeongam', name: '영암 월출저수지', location: '전남 영암군', rate: 52, normal: -4, days: 24, rainfall: 19, status: 'stable', label: '안정', reason: '저수율과 단기 강수예보가 안정 범위에 있습니다.', farmer: '현재 관개 계획을 유지하되 다음 예보 갱신일에 다시 확인하세요.', manager: '정기 모니터링을 유지하세요.' },
  { id: 'gangjin', name: '강진 병영저수지', location: '전남 강진군', rate: 34, normal: -21, days: 8, rainfall: 3, status: 'danger', label: '주의', reason: '저수율이 낮고 강수 회복 가능성이 제한적입니다.', farmer: '절수 모드로 전환하고, 생육 단계상 필수 급수 여부를 우선 판단하세요.', manager: '긴급 점검 후보입니다. 수혜구역과 대체 급수 가능량을 우선 확인하세요.' },
  { id: 'jangheung', name: '장흥 탐진저수지', location: '전남 장흥군', rate: 41, normal: -13, days: 14, rainfall: 7, status: 'watch', label: '관심', reason: '최근 수위 하락 추세가 인근 저수지 평균보다 높습니다.', farmer: '고수요 시간대 관개를 피하고, 3일 후 예측을 확인하세요.', manager: '수위 급감 원인을 확인할 수 있도록 현장 기록을 검토하세요.' },
  { id: 'boseong', name: '보성 복내저수지', location: '전남 보성군', rate: 58, normal: 2, days: 29, rainfall: 17, status: 'stable', label: '안정', reason: '평년 수준의 저수율과 충분한 단기 강수예보가 확인됩니다.', farmer: '계획 관개를 유지하세요.', manager: '정기 모니터링을 유지하세요.' }
];

const average = Math.round(reservoirs.reduce((sum, item) => sum + item.days, 0) / reservoirs.length);
const normal = Math.round(reservoirs.reduce((sum, item) => sum + item.normal, 0) / reservoirs.length);
const rain = Math.round(reservoirs.reduce((sum, item) => sum + item.rainfall, 0) / reservoirs.length);
const risky = reservoirs.filter((item) => item.status === 'danger');
const $ = (selector) => document.querySelector(selector);

function renderCards() {
  $('#reservoirGrid').innerHTML = reservoirs.map((item) => `
    <button class="reservoir-card" data-id="${item.id}" aria-label="${item.name} 상세 행동처방 보기">
      <div class="card-top"><span class="location">${item.location}</span><span class="risk ${item.status}">${item.label}</span></div>
      <h3>${item.name}</h3>
      <div class="level-row"><strong>${item.days}일</strong><small>안정 관개 가능</small></div>
      <div class="mini-meter"><span style="width:${Math.min(item.rate, 100)}%"></span></div>
      <div class="card-stats"><span>현재 저수율<b>${item.rate}%</b></span><span>평년 대비<b>${item.normal > 0 ? '+' : ''}${item.normal}%p</b></span></div>
    </button>`).join('');
  document.querySelectorAll('.reservoir-card').forEach((card) => card.addEventListener('click', () => selectReservoir(card.dataset.id)));
}

function selectReservoir(id) {
  const item = reservoirs.find((reservoir) => reservoir.id === id);
  document.querySelectorAll('.reservoir-card').forEach((card) => card.classList.toggle('selected', card.dataset.id === id));
  $('#recommendation').innerHTML = `<p class="recommendation-label">${item.location} · ${item.label} 단계</p><h3>${item.name}<br />${item.days}일 안전권입니다.</h3><p>${item.reason}</p><ul><li><b>농민:</b> ${item.farmer}</li><li><b>관리자:</b> ${item.manager}</li></ul>`;
  $('#action').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderSummary() {
  $('#safeDays').textContent = `${average}일`;
  $('#averageDays').textContent = `${average}일`;
  $('#normalDiff').textContent = `${normal}%p`;
  $('#rainfall').textContent = `${rain}mm`;
  $('#riskCount').textContent = `${risky.length}곳`;
  $('#inspectionCount').textContent = `${risky.length}곳`;
  $('#regionalMeter').style.width = `${Math.min(100, average * 3.5)}%`;
  $('#briefingHeadline').textContent = `${risky.length}개 저수지에 선제 점검이 필요합니다.`;
  $('#asOfDate').textContent = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

$('#explainButton').addEventListener('click', () => $('#methodDialog').showModal());
$('.close').addEventListener('click', () => $('#methodDialog').close());
$('#methodDialog').addEventListener('click', (event) => { if (event.target === $('#methodDialog')) $('#methodDialog').close(); });
renderSummary();
renderCards();
