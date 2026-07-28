(()=>{
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const key=()=>typeof target!=='undefined'&&target?`mulsallim-field-note:${target.code}`:null;
  function plan(){
    const a=typeof lastAnalysis!=='undefined'?lastAnalysis:null;
    if(!a)return {title:'다음 관측이 갱신되면 다시 확인하세요',items:['최신 관측일과 저수율을 확인합니다.','급격한 하락 신호가 있는지 확인합니다.','필요하면 담당자와 같은 요약을 공유합니다.'],when:'관측값 갱신 후 재확인'};
    if(a.level==='danger')return {title:'오늘: 현장 점검·절수 협의를 시작하세요',items:['수로·급수 가능 여부를 현장에서 먼저 확인합니다.','동일 지역 이용자와 급수 여건을 확인합니다.','공식 가뭄·급수 지시와 담당기관 안내를 함께 확인합니다.'],when:'오늘 안에 1차 확인'};
    if(a.level==='watch')return {title:'이번 주: 절수 전환 준비를 확인하세요',items:['다음 관측일에 하락이 이어지는지 확인합니다.','영농 일정과 급수 여건을 담당자에게 공유합니다.','절수 방식이 필요한 구간을 미리 점검합니다.'],when:'다음 관측값 갱신 시 재확인'};
    return {title:'정기 관측: 현재는 변화를 지켜보세요',items:['다음 관측값이 갱신되면 수치와 7일 변화를 확인합니다.','급격한 하락이나 현장 급수 불편이 있으면 바로 공유합니다.','공식 가뭄·급수 정보는 ADMS에서 함께 확인합니다.'],when:'다음 관측값 갱신 시 재확인'};
  }
  function ics(){
    const observed=$('#latestMeta')?.textContent.match(/(\d{8})/)?.[1];
    if(!observed)return null;
    const d=new Date(`${observed.slice(0,4)}-${observed.slice(4,6)}-${observed.slice(6,8)}T09:00:00`);
    const a=typeof lastAnalysis!=='undefined'?lastAnalysis:null;
    d.setDate(d.getDate()+(a?.level==='danger'?1:a?.level==='watch'?3:7));
    const stamp=x=>`${x.getFullYear()}${String(x.getMonth()+1).padStart(2,'0')}${String(x.getDate()).padStart(2,'0')}T${String(x.getHours()).padStart(2,'0')}${String(x.getMinutes()).padStart(2,'0')}00`;
    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:mulsallim-${target.code}-${Date.now()}\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(d)}\r\nSUMMARY:[물살림 AI] ${target.name} 관측값 재확인\r\nDESCRIPTION:KRC 저수지 수위정보가 갱신되면 현황과 변화 추이를 다시 확인하세요.\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  }
  function setNote(text){try{const k=key();if(k)localStorage.setItem(k,text)}catch{}}
  function getNote(){try{return key()?localStorage.getItem(key())||'':''}catch{return ''}}
  function enhance(){
    const ws=$('#workspace');
    if(!ws||ws.hidden||ws.dataset.practice)return;
    ws.dataset.practice='yes';
    const p=plan();
    const lower=$('.lower'); if(lower) lower.hidden=true;
    const next=$('.user-next');
    if(next){next.querySelector('b').textContent=p.title;next.querySelector('span').textContent=p.items[0];next.querySelector('small').textContent=p.when;}
    const section=document.createElement('section');
    section.className='panel field-action';
    section.innerHTML=`<div class="field-action-head"><div><p class="eyebrow">THIS WEEK'S FIELD ACTION</p><h2>${esc(p.title)}</h2><p class="muted">이 화면의 판단은 KRC 관측값을 정리한 보조 정보입니다. 실제 급수·절수 결정은 현장 여건과 공식 안내를 함께 확인해 주세요.</p></div><a class="adms-link" target="_blank" rel="noopener" href="https://adms.ekr.or.kr/">공식 가뭄정보 확인 ↗</a></div><ol class="action-list">${p.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="field-note"><label for="fieldNote">현장 메모 <small>이 브라우저에만 저장됩니다</small></label><textarea id="fieldNote" maxlength="300" placeholder="예: ○○ 용수로 유량이 평소보다 적음 / 다음 급수 일정 확인 필요"></textarea><div><button id="saveFieldNote" class="secondary">메모 저장</button><span id="noteStatus" class="muted"></span></div></div></section>`;
    $('.share')?.before(section);
    const note=$('#fieldNote');note.value=getNote();
    $('#saveFieldNote').onclick=()=>{setNote(note.value.trim());$('#noteStatus').textContent='이 기기에 저장했습니다.'};
    const share=$('.share'); if(share){
      const reminder=document.createElement('button');reminder.id='reminderBtn';reminder.className='secondary';reminder.textContent='재확인 일정 저장';
      share.querySelector('.share-buttons')?.prepend(reminder);
      reminder.onclick=()=>{const text=ics();if(!text){alert('관측값을 불러온 뒤 저장할 수 있습니다.');return}const u=URL.createObjectURL(new Blob([text],{type:'text/calendar'})),a=document.createElement('a');a.href=u;a.download=`물살림AI_${target.name}_재확인.ics`;a.click();URL.revokeObjectURL(u)};
      const oldBrief=typeof brief==='function'?brief:null;
      if(oldBrief){brief=()=>{const memo=getNote();return oldBrief()+(memo?`\n현장 메모(기기 저장): ${memo}`:'')};renderBrief();}
    }
  }
  const css=document.createElement('style');
  css.textContent=`.lower[hidden]{display:none}.field-action{margin-top:18px;border-color:#b9d8cc;background:#f8fcfa}.field-action-head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.field-action h2{margin:4px 0 10px}.adms-link{display:inline-flex;white-space:nowrap;text-decoration:none;background:#e2f0ea;color:#164c47;border:1px solid #bdd8cd;font-size:13px;font-weight:800;padding:10px 12px}.action-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0;margin:20px 0;counter-reset:act}.action-list li{list-style:none;background:#fff;border:1px solid #d4e5de;padding:16px 14px;line-height:1.55;font-size:14px}.action-list li:before{counter-increment:act;content:'0' counter(act);display:block;color:#087a77;font-weight:900;font-size:12px;margin-bottom:8px}.field-note{border-top:1px solid #d4e5de;padding-top:16px}.field-note label{font-weight:800;color:#1c4a45}.field-note label small{font-weight:400;color:#67817b;margin-left:6px}.field-note textarea{display:block;width:100%;min-height:74px;margin:9px 0;border:1px solid #bdd8cd;padding:10px;font:inherit;resize:vertical}.field-note>div{display:flex;gap:10px;align-items:center}@media(max-width:760px){.field-action-head{display:block}.adms-link{margin-top:10px}.action-list{grid-template-columns:1fr}}`;
  document.head.append(css);
  new MutationObserver(enhance).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  enhance();
})();
