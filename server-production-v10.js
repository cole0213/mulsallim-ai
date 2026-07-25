/* v10 retains v9 APIs and moves the default UI entry to the fully linked v10 journey. */
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'server-production-v9.js'),'utf8');
const oldEntry="'/mulsallim-public-county-v9.html'";
const nextEntry="'/mulsallim-public-county-v10.html'";
if(!source.includes(oldEntry))throw new Error('Expected v9 default entry was not found.');
eval(source.replace(oldEntry,nextEntry));
