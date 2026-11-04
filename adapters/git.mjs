#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,realpathSync,existsSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {args,contains,digest,readSource,node,edge,put,cite,writeJSON} from './local-common.mjs';

export function gitEnv(extra={}){
  // Avoid inheriting alternate repositories, injected config, identities or hooks.
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('GIT_')));
  return {...env,GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0',...extra};
}
export function gitRead(repo,...args){
  const bytes=execFileSync('git',['--no-pager','--no-replace-objects','-c','core.fsmonitor=false','-C',repo,...args],{
    env:gitEnv(),maxBuffer:8*1024*1024,timeout:15000,stdio:['ignore','pipe','pipe']
  });
  return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
}
/** Read real commit objects; explicit trailers remain assertions, not proof.
 * Bare mentions of T42 or D1 do not establish implementsTicket or decidedIn.
 * Supported trailers (in the terminal trailer block): Implements: T42 / Decision: D1.
 * Tickets must exist at that commit at tickets/T42.md and declare Ticket: T42.
 */
export function extractGit({repo,sourceRoot,graph,ref='HEAD',maxCommits=100}){
  const root=realpathSync(sourceRoot),repository=realpathSync(repo);
  if(!contains(root,repository))throw Error('Git repository must be within sourceRoot');
  if(!Number.isInteger(maxCommits)||maxCommits<1||maxCommits>1000)throw Error('maxCommits must be 1..1000');
  const head=gitRead(repository,'rev-parse','--verify','--end-of-options',`${ref}^{commit}`).trim();
  if(!/^(?:[a-f\d]{40}|[a-f\d]{64})$/.test(head))throw Error('Unable to resolve a full commit ID');
  const hashes=gitRead(repository,'rev-list','--reverse',`--max-count=${maxCommits+1}`,head).trim().split('\n').filter(Boolean);
  if(hashes.length>maxCommits)throw Error('Commit limit exceeded; choose a narrower demo repository');
  const out=structuredClone(graph),report={commits:hashes.length,implementsLinks:0,decisionLinks:0,unresolved:[]};
  let snapshotDir=root;
  for(const segment of ['snapshots','git']){
    snapshotDir=join(snapshotDir,segment);
    if(!existsSync(snapshotDir))mkdirSync(snapshotDir);
    if(!contains(root,realpathSync(snapshotDir)))throw Error('Snapshot directory escapes sourceRoot');
  }
  function snapshot(file,text){
    const path=join(snapshotDir,file);
    if(existsSync(path)){
      if(realpathSync(path)!==path)throw Error('Snapshot file is a symlink');
      if(readFileSync(path,'utf8')!==text)throw Error('Refusing to overwrite a different snapshot');
    }else writeFileSync(path,text,{flag:'wx'});
    return readSource(root,relative(root,path).split('\\').join('/'));
  }
  for(const sha of hashes){
    if(!/^(?:[a-f\d]{40}|[a-f\d]{64})$/.test(sha))throw Error('Malformed commit ID from Git');
    const raw=gitRead(repository,'cat-file','commit',sha);
    const text=`Commit: ${sha}\n${raw}`;
    const source=snapshot(`${sha}.txt`,text);
    source.node.properties.kind='git-commit-snapshot';
    source.node.properties.revision=sha;
    source.node.properties.repository=relative(root,repository).split('\\').join('/');
    source.node.properties.objectFormat='git-cat-file-commit-with-sha-header';
    const files=gitRead(repository,'diff-tree','--no-commit-id','--name-only','-r','--root','-z',sha).split('\0').filter(Boolean);
    const commit=`commit:${sha}`;
    put(out,node(commit,'Commit',{sha,changedPaths:files}));
    const ev=cite(out,source,1);put(out,edge('documentedIn',commit,source.node.id,[ev]),'edges');
    // Parse only a final, well-formed trailer paragraph after the subject/body.
    const msgStart=text.indexOf('\n\n');
    const message=msgStart<0?'':text.slice(msgStart+2).replace(/\n+$/,'');
    const paragraphs=message.split(/\n\n/),last=paragraphs.at(-1)||'';
    const trailerLines=last.split('\n');
    if(paragraphs.length<2||!trailerLines.every(l=>/^[A-Za-z][A-Za-z-]*: .+$/.test(l)))continue;
    const firstLine=text.slice(0,text.lastIndexOf(last)).split('\n').length;
    const trailers=[];
    for(let i=0;i<trailerLines.length;i++){
      const match=/^(Implements|Decision): ([A-Z][A-Z0-9]*\d+)$/.exec(trailerLines[i]);
      if(match)trailers.push({kind:match[1],key:match[2],line:firstLine+i});
    }
    for(const t of trailers){
      if(t.kind==='Decision'){
        const target=`decision:${t.key}`;
        if(!out.nodes.some(n=>n.id===target&&n.type==='Decision')){report.unresolved.push({commit:sha,reference:t.key,reason:'decision-not-in-input-graph'});continue;}
        const e=cite(out,source,t.line);put(out,edge('decidedIn',commit,target,[e]),'edges');report.decisionLinks++;
      }else{
        let ticketText;
        try{ticketText=gitRead(repository,'show',`${sha}:tickets/${t.key}.md`);}
        catch{report.unresolved.push({commit:sha,reference:t.key,reason:'ticket-not-at-commit'});continue;}
        const ticketSource=snapshot(`${sha}-${t.key}.md`,ticketText);
        ticketSource.node.properties.kind='git-file-snapshot';ticketSource.node.properties.revision=sha;ticketSource.node.properties.pathAtRevision=`tickets/${t.key}.md`;
        const index=ticketSource.lines.findIndex(l=>l===`Ticket: ${t.key}`);
        if(index<0){report.unresolved.push({commit:sha,reference:t.key,reason:'ticket-header-mismatch'});continue;}
        const target=`ticket:${t.key}`;put(out,node(target,'Ticket',{key:t.key}));
        const e=cite(out,source,t.line),ticketEvidence=cite(out,ticketSource,index+1);
        put(out,edge('implementsTicket',commit,target,[e,ticketEvidence]),'edges');report.implementsLinks++;
      }
    }
  }
  out.metadata={...out.metadata,producer:'oes/meeting+git-adapters',gitHead:head};
  return {graph:out,report};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const a=args(process.argv.slice(2),['--repo','--source-root','--graph','--ref','--out']);
    if(!a['--repo']||!a['--source-root']||!a['--graph']||!a['--out'])throw Error('Usage: node adapters/git.mjs --repo REPO --source-root ROOT --graph GRAPH --out GRAPH [--ref REF]');
    const result=extractGit({repo:a['--repo'],sourceRoot:a['--source-root'],graph:JSON.parse(readFileSync(a['--graph'],'utf8')),ref:a['--ref']||'HEAD'});
    writeJSON(a['--out'],result.graph);console.log(JSON.stringify(result.report,null,2));
  }catch(e){console.error(e.message);process.exitCode=2;}
}
