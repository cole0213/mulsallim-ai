(()=>{
  const hero=document.querySelector('.hero'), lookup=document.querySelector('.lookup');
  if(!hero||!lookup||document.querySelector('#landingProof')) return;
  const proof=document.createElement('div');
  proof.id='landingProof'; proof.className='landing-proof';
  proof.innerHTML='<span>코드 입력 없음</span><span>KRC 원자료</span><span>현장 협의까지</span>';
  hero.querySelector('.lead')?.after(proof);
  const live=document.createElement('p');
  live.id='landingLive'; live.className='landing-live'; live.innerHTML='<i></i> 공공데이터 연결 상태를 확인하고 있습니다.';
  lookup.querySelector('small')?.before(live);
  fetch('/api/health').then(r=>r.json()).then(x=>{live.innerHTML=x.krcConfigured?'<i class="ok"></i> KRC 공공데이터 연결 준비됨 · 지역을 선택해 시작하세요.':'<i class="bad"></i> 데이터 연결 설정을 확인 중입니다.'}).catch(()=>{live.innerHTML='<i class="bad"></i> 연결 상태를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'});
  const style=document.createElement('style');
  style.textContent=`.hero{position:relative;overflow:hidden}.hero:before,.hero:after{content:'';position:absolute;border-radius:999px;filter:blur(1px);pointer-events:none}.hero:before{width:420px;height:420px;right:-120px;top:-220px;background:radial-gradient(circle,#8fd4bd55 0 22%,transparent 65%);animation:waterFloat 12s ease-in-out infinite}.hero:after{width:300px;height:300px;left:43%;bottom:-250px;background:radial-gradient(circle,#7fc8d644 0 18%,transparent 66%);animation:waterFloat 14s ease-in-out infinite reverse}.hero .wrap{position:relative;z-index:1}.landing-proof{display:flex;flex-wrap:wrap;gap:7px;margin-top:19px}.landing-proof span{border:1px solid #b8d9cc;background:#ffffffaa;backdrop-filter:blur(8px);color:#17645d;padding:7px 9px;font-size:12px;font-weight:800}.landing-live{display:flex;align-items:center;gap:7px;color:#496b63!important;font-size:12px!important;margin:15px 0 0!important}.landing-live i{width:8px;height:8px;border-radius:50%;background:#9a6a1a;display:inline-block;box-shadow:0 0 0 4px #f5ead5}.landing-live i.ok{background:#248461;box-shadow:0 0 0 4px #dff0e8}.landing-live i.bad{background:#b7463d;box-shadow:0 0 0 4px #f8e1df}.lookup{transition:transform .25s ease,box-shadow .25s ease}.lookup:hover{transform:translate(-3px,-3px);box-shadow:17px 17px 0 #b9ddcf}@keyframes waterFloat{50%{transform:translate(-24px,35px) scale(1.08)}}@media(prefers-reduced-motion:reduce){.hero:before,.hero:after{animation:none}.lookup{transition:none}}@media(max-width:760px){.lookup:hover{transform:none;box-shadow:7px 7px 0 #cde6dc}}`;
  document.head.append(style);
})();
