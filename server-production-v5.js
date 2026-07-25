/* v5 keeps the audited v4 server unchanged and changes only the default UI entry. */
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'server-production-v4.js'),'utf8');
const oldEntry="'/mulsallim-public-county-v4.html'";
const nextEntry="'/mulsallim-public-county-v5.html'";
if(!source.includes(oldEntry))throw new Error('Expected v4 default entry was not found.');
eval(source.replace(oldEntry,nextEntry));
