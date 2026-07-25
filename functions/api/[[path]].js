// Cloudflare Pages fetch()는 오리진의 비표준 포트(4184)에 도달하지 못해 522가 난다.
// 오리진(nmlab16:4184) 앞에 cloudflared 빠른 터널을 두고 그 HTTPS(443) 주소로 프록시한다.
// 터널 주소는 cloudflared 프로세스가 살아있는 동안 유지된다. 재시작 시 이 값 갱신 필요.
// (더 안정적으로는 Pages 환경변수 MULSALLIM_ORIGIN 설정 — 코드보다 우선 적용됨.)
const DEFAULT_ORIGIN='https://simultaneously-beta-garden-dishes.trycloudflare.com';

export async function onRequest(context){
  const {request,env}=context;
  const incoming=new URL(request.url);
  let upstream;
  try{
    upstream=new URL(incoming.pathname+incoming.search,env.MULSALLIM_ORIGIN||DEFAULT_ORIGIN);
  }catch{
    return Response.json({error:'API upstream configuration is invalid.'},{status:500});
  }

  const headers=new Headers(request.headers);
  for(const name of ['host','content-length','cf-connecting-ip','cf-ipcountry','cf-ray','x-forwarded-proto']) headers.delete(name);
  headers.set('x-forwarded-host',incoming.host);
  const init={method:request.method,headers,redirect:'manual'};
  if(!['GET','HEAD'].includes(request.method)) init.body=request.body;

  try{
    const response=await fetch(upstream,init);
    const outputHeaders=new Headers(response.headers);
    outputHeaders.set('cache-control','no-store');
    outputHeaders.set('x-content-type-options','nosniff');
    return new Response(response.body,{status:response.status,headers:outputHeaders});
  }catch{
    return Response.json({error:'물살림 AI 운영 API에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:502,headers:{'cache-control':'no-store'}});
  }
}
