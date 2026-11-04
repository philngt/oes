// Local, deterministic text-integrity checks. Does NOT judge entailment or truth.
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';

const normalizeEOL = text => text.replace(/\r\n?/g, '\n');
function inside(root,path){
  const rel=relative(root,path);
  return rel!==''&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep);
}
function failure(code,message){return Object.assign(new Error(message),{code});}

/** Verify exact UTF-8 Lx or Lx-Ly excerpts within an explicitly trusted local root.
 * Remote sources are never fetched; they produce warnings and increment skipped.
 * sha256, when supplied, hashes full raw file bytes (including line endings).
 * A passing result is NOT semantic verification. Run validateGraph separately.
 */
export function validateEvidence(graph,{sourceRoot=process.cwd(),requireHash=false,maxBytes=5*1024*1024}={}){
  const diagnostics=[];let checked=0,skipped=0;
  const add=(severity,code,path,message)=>diagnostics.push({severity,code,path,message});
  if(!graph||!Array.isArray(graph.nodes)){
    add('error','nodes-array','nodes','Expected graph.nodes array');
    return {checked,skipped,diagnostics};
  }
  let root;
  try{root=realpathSync(sourceRoot);if(!statSync(root).isDirectory())throw Error('not a directory');}
  catch{add('error','source-root','sourceRoot','Source root must be an existing directory');return {checked,skipped,diagnostics};}
  const nodes=new Map();
  for(const [i,node] of graph.nodes.entries()){
    if(!node||typeof node.id!=='string'){add('error','node-id',`nodes[${i}]`,'Expected string node ID');continue;}
    if(nodes.has(node.id))add('error','duplicate-id',`nodes[${i}]`,node.id);
    nodes.set(node.id,node);
  }
  const cache=new Map();
  function sourceLines(source){
    if(cache.has(source.id)){const item=cache.get(source.id);if(item instanceof Error)throw item;return item;}
    try{
      const {uri,sha256}=source.properties||{};
      if(typeof uri!=='string'||!uri)throw failure('source-uri','Source.uri is required');
      if(/^https?:\/\//i.test(uri))throw failure('external-source','Remote source not checked; provide an authorized local snapshot');
      // Portable, literal relative paths only. Never resolve URLs or encoded paths.
      if(isAbsolute(uri)||/^[a-z][a-z\d+.-]*:/i.test(uri)||/[\\\0%?#]/.test(uri)||uri.split('/').includes('..'))
        throw failure('source-path','Expected a relative path without traversal, URI scheme or encoding');
      const lexical=resolve(root,uri);
      if(!inside(root,lexical))throw failure('source-path','Source escapes the trusted root');
      const actual=realpathSync(lexical);
      if(!inside(root,actual))throw failure('source-path','Source symlink escapes the trusted root');
      const stat=statSync(actual);
      if(!stat.isFile())throw failure('source-not-file','Source is not a regular file');
      if(stat.size>maxBytes)throw failure('source-size','Source exceeds the local text size limit');
      const bytes=readFileSync(actual);
      if(bytes.length>maxBytes)throw failure('source-size','Source exceeds the local text size limit');
      if(sha256!==undefined){
        if(typeof sha256!=='string'||!/^[a-f\d]{64}$/i.test(sha256))throw failure('invalid-source-hash','sha256 must contain 64 hexadecimal characters');
        if(createHash('sha256').update(bytes).digest('hex')!==sha256.toLowerCase())throw failure('source-hash-mismatch','Local source bytes do not match sha256');
      }else if(requireHash)throw failure('missing-source-hash','Source.sha256 is required in this mode');
      let text;
      try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}
      catch{throw failure('source-encoding','Source is not valid UTF-8 text');}
      if(text.includes('\0'))throw failure('source-encoding','NUL-containing source is not supported text');
      const normalized=normalizeEOL(text),lines=normalized.split('\n');
      if(normalized.endsWith('\n'))lines.pop();
      cache.set(source.id,lines);return lines;
    }catch(error){
      const known=['external-source','source-uri','source-path','source-not-file','source-size','invalid-source-hash','source-hash-mismatch','missing-source-hash','source-encoding'];
      const safe=known.includes(error.code)?error:failure('source-unreadable','Local source cannot be read');
      cache.set(source.id,safe);throw safe;
    }
  }
  const evidence=graph.nodes.filter(n=>n?.type==='Evidence');
  if(!evidence.length)add('warning','no-evidence','nodes','No Evidence nodes to verify');
  for(const node of evidence){
    const path=node.id,props=node.properties||{},source=nodes.get(props.sourceId);
    if(source?.type!=='Source'){add('error','evidence-source',path,'sourceId must reference a Source node');continue;}
    const match=typeof props.locator==='string'&&/^L([1-9]\d*)(?:-L([1-9]\d*))?$/.exec(props.locator);
    if(!match){add('error','invalid-locator',path,'Expected Lx or Lx-Ly with 1-based inclusive lines');continue;}
    const start=Number(match[1]),end=Number(match[2]||match[1]);
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end){add('error','invalid-locator',path,'Line bounds must be increasing safe positive integers');continue;}
    if(typeof props.excerpt!=='string'||!props.excerpt.length){add('error','missing-excerpt',path,'An exact, non-empty excerpt is required');continue;}
    try{
      const lines=sourceLines(source);
      if(end>lines.length){add('error','locator-range',path,`Locator exceeds source length (${lines.length} lines)`);continue;}
      const actual=lines.slice(start-1,end).join('\n');
      if(normalizeEOL(props.excerpt)!==actual){add('error','excerpt-mismatch',path,'Excerpt differs from the selected source lines');continue;}
      checked++;
    }catch(error){
      const remote=error.code==='external-source';
      if(remote)skipped++;
      add(remote?'warning':'error',error.code,path,error.message);
    }
  }
  return {checked,skipped,diagnostics};
}
