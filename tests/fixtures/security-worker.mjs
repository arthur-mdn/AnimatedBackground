import {writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
const input=JSON.parse(process.env.RENDER_INPUT);
if(input.firstName==='FAIL'){
 process.send({status:'error',error:'sensitive /internal/path and secret'});process.disconnect();
}else if(input.firstName==='HANG'){
 // A render timeout/cancellation must terminate subprocesses, not only the parent.
 const descendant=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
 await writeFile(join(process.env.TMPDIR,'probe'),Buffer.alloc(1024));
 await writeFile(process.env.RENDER_OUTPUT+'.temp',process.env.TMPDIR);
 await writeFile(process.env.RENDER_OUTPUT+'.pid',String(descendant.pid));
 process.send({status:'rendering',progress:.1});setInterval(()=>{},1000);
}else if(input.firstName==='DISK'){
 await writeFile(process.env.RENDER_OUTPUT,Buffer.alloc(65536));setInterval(()=>{},1000);
}else{
 await writeFile(process.env.RENDER_OUTPUT,Buffer.alloc(2048,1));
 process.send({status:'done',progress:1,finishedAt:Date.now()});process.disconnect();
}
