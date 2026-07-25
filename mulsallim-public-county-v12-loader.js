fetch('mulsallim-public-county-v5.js')
  .then(r=>r.text())
  .then(source=>{(0,eval)(source.replaceAll('mulsallim-dashboard-county-v5.html','mulsallim-dashboard-county-v12.html'))})
  .catch(()=>{const hint=document.querySelector('#hint');if(hint)hint.textContent='지역 선택 기능을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'});
