import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'dist');
const publishable=/\.(html|js|css|json)$/i;

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const entry of await readdir(root,{withFileTypes:true})){
  if(entry.isFile()&&publishable.test(entry.name)){
    await cp(path.join(root,entry.name),path.join(out,entry.name));
  }
}
await cp(path.join(root,'_headers'),path.join(out,'_headers'));
await writeFile(path.join(out,'index.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>물살림 AI</title><meta http-equiv="refresh" content="0;url=/mulsallim-public-county-v12.html"></head><body><p><a href="/mulsallim-public-county-v12.html">물살림 AI 시작하기</a></p></body></html>`,'utf8');
