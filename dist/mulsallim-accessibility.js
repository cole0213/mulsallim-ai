(()=>{
  const $=s=>document.querySelector(s);
  const css=document.createElement('style');
  css.textContent=`.skip-link{position:fixed;left:12px;top:-60px;z-index:99;background:#fff;color:#103d3e;border:2px solid #087a77;padding:10px 13px;font-weight:800}.skip-link:focus{top:12px}a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #e39a24;outline-offset:3px}.chart-wrap svg:focus-visible{outline:3px solid #e39a24;outline-offset:3px}.tooltip{z-index:2}.field-note textarea:focus-visible{outline:3px solid #e39a24;outline-offset:2px}`;
  document.head.append(css);
  const skip=document.createElement('a');skip.href='#mainContent';skip.className='skip-link';skip.textContent='본문으로 건너뛰기';document.body.prepend(skip);
  const main=document.querySelector('main');if(main)main.id='mainContent';
  const msg=$('#searchMsg');if(msg){msg.setAttribute('role','status');msg.setAttribute('aria-live','polite')}
  const choices=$('#choices');if(choices){choices.setAttribute('role','list');new MutationObserver(()=>{choices.querySelectorAll('button').forEach(b=>{b.setAttribute('role','listitem');if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.textContent.trim()+' 저수지 선택')})}).observe(choices,{childList:true})}
  function enableChart(){
    const svg=$('#chart'),tip=$('#tooltip');
    if(!svg||svg.dataset.a11y)return;
    svg.dataset.a11y='yes';svg.setAttribute('tabindex','0');svg.setAttribute('role','img');svg.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight Home End');
    let index=0;
    const points=()=>typeof all!=='undefined'?all:[];
    const speak=()=>{const a=points();if(!a.length)return;index=Math.max(0,Math.min(a.length-1,index));const x=a[index],text=`${x.checkDate}, 저수율 ${Number(x.storageRate).toFixed(1)}%, 수위 ${Number(x.waterLevelM).toFixed(2)}미터`;svg.setAttribute('aria-label','저수율 관측 추세. '+text+'. 좌우 화살표로 날짜별 수치를 확인합니다.');if(tip){tip.hidden=false;tip.innerHTML=`<b>${x.checkDate}</b><br>저수율 ${Number(x.storageRate).toFixed(1)}%<br>수위 ${Number(x.waterLevelM).toFixed(2)}m`;tip.style.left='16px';tip.style.top='28px'}};
    svg.addEventListener('focus',()=>{index=Math.max(0,points().length-1);speak()});svg.addEventListener('blur',()=>{if(tip)tip.hidden=true});svg.addEventListener('keydown',e=>{const n=points().length;if(!n)return;if(e.key==='ArrowLeft'){index--;e.preventDefault()}else if(e.key==='ArrowRight'){index++;e.preventDefault()}else if(e.key==='Home'){index=0;e.preventDefault()}else if(e.key==='End'){index=n-1;e.preventDefault()}else return;speak()});
  }
  function enhance(){if(!$('#workspace')||$('#workspace').hidden)return;enableChart();const note=$('#fieldNote');if(note&&!note.getAttribute('aria-describedby')){const status=$('#noteStatus');if(status){status.id='fieldNoteHelp';note.setAttribute('aria-describedby','fieldNoteHelp');status.setAttribute('role','status')}}}
  new MutationObserver(enhance).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});enhance();
})();
