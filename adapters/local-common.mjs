// Trusted local sources only. Deterministic extraction, no LLM/network calls.
import {readFileSync,writeFileSync,realpathSync,statSync,mkdirSync} from 'node:fs';
import {relative,resolve,isAbsolute,dirname,sep} from 'node:path';
import {createHash} from 'node:crypto';
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const idFor=(kind,value)=>`${kind}:${digest(value).slice(0,24)}`;
export function contains(root,path){
  const rel=relative(root,path);
  return rel!==''&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep);
}
export function readSource(root,uri){
  root=realpathSync(root);
  if(typeof uri!=='string'||!uri||isAbsolute(uri)||/^[a-z][a-z\d+.-]*:/i.test(uri)||/[\\\0%?#]/.test(uri)||uri.split('/').includes('..'))throw Error('Expected a safe root-relative source path');
  const path=realpathSync(resolve(root,uri));
  if(!contains(root,path))throw Error('Source is outside the selected root');
  if(!statSync(path).isFile()||statSync(path).size>5*1024*1024)throw Error('Expected a text file no larger than 5 MiB');
  const bytes=readFileSync(path);
  if(bytes.length>5*1024*1024)throw Error('Source is too large');
  const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
  if(text.includes('\0'))throw Error('NUL-containing input is not supported');
  const lines=text.replace(/\r\n?/g,'\n').split('\n');if(lines.at(-1)==='')lines.pop();
  return {bytes,text,lines,node:{id:idFor('source',uri),type:'Source',properties:{uri,sha256:digest(bytes),kind:'local-text'}}};
}
export function node(id,type,properties){return {id,type,properties};}
export function evidence(source,line){
  if(line<1||line>source.lines.length)throw Error('Invalid source line');
  return node(`${source.node.id}:L${line}`,'Evidence',{sourceId:source.node.id,locator:`L${line}`,excerpt:source.lines[line-1]});
}
export function edge(type,from,to,evidenceIds){
  return {id:idFor('edge',JSON.stringify([type,from,to])),type,from,to,assertionStatus:'asserted',...(type==='supportedBy'?{}:{evidenceIds})};
}
export function put(graph,item,section='nodes'){
  const existing=graph[section].find(x=>x.id===item.id);
  if(existing&&JSON.stringify(existing)!==JSON.stringify(item))throw Error(`Conflicting ${section} ID: ${item.id}`);
  if(!existing)graph[section].push(item);
}
export function supported(graph,subject,source,line){
  const ev=evidence(source,line);put(graph,source.node);put(graph,ev);
  put(graph,edge('supportedBy',subject,ev.id), 'edges');return ev.id;
}
export function cite(graph,source,line){const ev=evidence(source,line);put(graph,source.node);put(graph,ev);return ev.id;}
export function writeJSON(path,data){mkdirSync(dirname(resolve(path)),{recursive:true});writeFileSync(path,JSON.stringify(data,null,2)+'\n');}
export function args(argv,allowed){
  const out={};for(let i=0;i<argv.length;i++){
    const key=argv[i];if(!allowed.includes(key))throw Error(`Unknown argument ${key}`);
    if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error(`Missing value for ${key}`);
    if(key in out)throw Error(`Repeated argument ${key}`);out[key]=argv[++i];
  }return out;
}
