fetch('mulsallim-collaboration.js')
  .then(r=>r.text())
  .then(source=>{(0,eval)(source.replaceAll('mulsallim-action-card.html','mulsallim-action-card-v2.html'))})
  .catch(()=>{});
