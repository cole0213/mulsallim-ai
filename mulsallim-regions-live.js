(()=>{
  const province=document.querySelector('#province'),city=document.querySelector('#city'),message=document.querySelector('#searchMsg');
  if(!province||!city)return;
  const clean=(county,p)=>String(county||'').replace(p,'').trim();
  async function loadCities(p){
    city.innerHTML='<option value="">시·군·구 불러오는 중…</option>';city.disabled=true;
    try{
      const r=await fetch('/api/krc/reservoir-codes?'+new URLSearchParams({county:p})),data=await r.json();
      if(!r.ok)throw Error(data.detail||data.error||'지역 목록을 불러오지 못했습니다.');
      const cities=[...new Set((data.items||[]).map(x=>clean(x.county,p)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
      city.innerHTML='<option value="">시·군·구 선택</option>'+cities.map(x=>`<option value="${x.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${x}</option>`).join('');
      city.disabled=false;
      if(message)message.textContent=`KRC 관리 저수지가 있는 ${cities.length}개 시·군·구를 불러왔습니다.`;
      return cities;
    }catch(e){city.innerHTML='<option value="">목록을 불러오지 못했습니다</option>';city.disabled=false;if(message)message.textContent='시·군·구 목록 조회 실패: '+e.message;return []}
  }
  province.onchange=()=>{if(province.value)loadCities(province.value);else{city.innerHTML='<option value="">시·군·구 선택</option>';city.disabled=false}};
  window.mulsallimLoadCities=loadCities;
})();
