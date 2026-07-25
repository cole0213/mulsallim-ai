(()=>{
 const regions={
  '강원특별자치도':['춘천시','원주시','강릉시','속초시','횡성군','철원군','양양군'], '경기도':['평택시','안성시','화성시','이천시','여주시','파주시'], '경상남도':['진주시','창녕군','의령군','고성군'], '경상북도':['안동시','상주시','의성군','영천시','예천군'], '광주광역시':['광산구'], '대구광역시':['달성군'], '대전광역시':['유성구'], '부산광역시':['강서구','기장군'], '서울특별시':['광진구','강서구','강남구'], '세종특별자치시':['세종시'], '울산광역시':['울주군'], '인천광역시':['강화군'], '전라남도':['나주시','강진군','해남군','무안군','보성군','담양군'], '전북특별자치도':['전주시','익산시','김제시','정읍시','완주군'], '제주특별자치도':['제주시','서귀포시'], '충청남도':['아산시','논산시','천안시','공주시','당진시','서산시','서천군','예산군','부여군','보령시'], '충청북도':['청주시','충주시','제천시','괴산군','음성군']};
 const p=document.querySelector('#province'),c=document.querySelector('#city');
 p.innerHTML='<option value="">시·도 선택</option>'+Object.keys(regions).map(x=>`<option>${x}</option>`).join('');
 p.onchange=()=>c.innerHTML='<option value="">시·군·구 선택</option>'+((regions[p.value]||[]).map(x=>`<option>${x}</option>`).join(''));
 document.querySelector('#go').onclick=()=>{if(!p.value||!c.value){alert('시·도와 시·군·구를 모두 선택해 주세요.');return}location.href=`mulsallim-dashboard-final.html?province=${encodeURIComponent(p.value)}&city=${encodeURIComponent(c.value)}`};
 try{const favs=JSON.parse(localStorage.getItem('mulsallim-favorites')||'[]'),recent=JSON.parse(localStorage.getItem('mulsallim-recent')||'null'),all=[];if(recent)all.push(recent);favs.forEach(x=>{if(!all.some(y=>y.code===x.code))all.push(x)});if(all.length){const root=document.querySelector('#saved'),list=document.querySelector('#savedList');root.hidden=false;list.innerHTML=all.map(x=>`<a href="mulsallim-dashboard-final.html?code=${encodeURIComponent(x.code)}&name=${encodeURIComponent(x.name)}&place=${encodeURIComponent(x.place)}">${x.name} · ${x.place}</a>`).join('')}}catch{}
})();
