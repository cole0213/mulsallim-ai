const DEFAULT_ORIGIN='http://163.152.223.16:4184';

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
