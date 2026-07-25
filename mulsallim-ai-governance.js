(()=>{
  const whenReady=()=>{
    const host=document.querySelector('.governance');
    if(!host||document.querySelector('#aiGovernanceCard')) return;
    const card=document.createElement('section');
    card.id='aiGovernanceCard';
    card.className='panel ai-governance-card';
    card.innerHTML=`
      <div>
        <p class="eyebrow">RESPONSIBLE AI · MODEL CARD</p>
        <h2>이 화면의 AI는 무엇을 하고, 무엇을 하지 않나요?</h2>
        <p class="muted">현재 전환 신호는 저수율, 단기 변화, 관측 연속성을 함께 읽어 <b>현장 확인 우선순위</b>를 제시합니다. 공식 가뭄 경보·급수 지시·저수지 운영 결정을 자동으로 내리지 않습니다.</p>
      </div>
      <div class="ai-boundaries">
        <article><b>현재 제공</b><span>근거가 보이는 위험 신호, 변화 그래프, 확인 행동</span></article>
        <article><b>배포 보류</b><span>미래 저수율 예측값·자동 경보 — 검증 성능이 기준 미달이면 제공하지 않음</span></article>
        <article><b>사람의 결정</b><span>담당자·농업인이 현장 확인 후 협의 카드에서 상태를 갱신</span></article>
      </div>
      <a class="ai-card-link" href="mulsallim-ai-model-card.html" target="_blank" rel="noopener">모델카드와 검증 결과 보기 →</a>`;
    host.after(card);
  };
  const style=document.createElement('style');
  style.textContent=`.ai-governance-card{margin-top:12px}.ai-governance-card h2{margin:4px 0 8px}.ai-boundaries{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.ai-boundaries article{padding:13px;background:#f5f8f6;border-left:3px solid #087a77}.ai-boundaries article:nth-child(2){border-left-color:#9b6515}.ai-boundaries article:nth-child(3){border-left-color:#287653}.ai-boundaries b,.ai-boundaries span{display:block}.ai-boundaries b{font-size:13px}.ai-boundaries span{margin-top:5px;color:#617774;font-size:12px;line-height:1.65}.ai-card-link{color:#075e5b;font-size:13px;font-weight:800}@media(max-width:700px){.ai-boundaries{grid-template-columns:1fr}}`;
  document.head.append(style);
  new MutationObserver(whenReady).observe(document.body,{childList:true,subtree:true});
  whenReady();
})();
