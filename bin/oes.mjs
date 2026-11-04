#!/usr/bin/env node
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join,dirname} from 'node:path';
import {compileTemplate,validateTemplate,validateGraph,exportJSONLD,exportDOT} from '../lib/engine.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=path=>JSON.parse(readFileSync(path,'utf8'));
function registry(){
  const r={core:load(join(ROOT,'core/ontology.json'))},dir=join(ROOT,'templates');
  for(const name of readdirSync(dir)){
    const p=join(dir,name,'ontology.json');
    if(existsSync(p))r[name]=load(p);
  }
  return r;
}
function output(issues){
  for(const d of issues)console.log(d.severity.toUpperCase()+' '+d.code+' '+d.path+': '+d.message);
  if(!issues.length)console.log('OK');
  return issues.some(x=>x.severity==='error')?1:0;
}
function usage(){
  console.log('oes templates');
  console.log('oes check-all');
  console.log('oes check-template <template-id>');
  console.log('oes compile-template <template-id> -o <path>');
  console.log('oes check-graph <graph.json> [--template <template-id>] [--warnings-as-errors]');
  console.log('oes export-jsonld <graph.json> -o <path>');
  console.log('oes export-dot <graph.json> -o <path>');
}
function option(args,flag){const index=args.indexOf(flag);return index<0?null:args[index+1];}
function run(){
  const args=process.argv.slice(2),cmd=args[0],r=registry();
  if(!cmd||['-h','--help','help'].includes(cmd)){usage();return 0;}
  if(cmd==='templates'){console.log(Object.keys(r).filter(x=>x!=='core').sort().join('\n'));return 0;}
  if(cmd==='check-template')return output(validateTemplate(compileTemplate(args[1],r)));
  if(cmd==='compile-template'){
    const compiled=compileTemplate(args[1],r),issues=validateTemplate(compiled);
    if(output(issues))return 1;
    const p=option(args,'-o')||option(args,'--output');if(!p)throw Error('missing -o <path>');
    writeFileSync(p,JSON.stringify(compiled,null,2)+'\n');return 0;
  }
  if(cmd==='check-all'){
    let errors=0;
    for(const id of Object.keys(r)){
      const issues=validateTemplate(compileTemplate(id,r));
      if(issues.length)console.log('Template '+id);
      errors+=output(issues);
    }
    for(const file of readdirSync(join(ROOT,'examples')).filter(x=>x.endsWith('.graph.json'))){
      const graph=load(join(ROOT,'examples',file)),issues=validateGraph(graph,compileTemplate(graph.template,r));
      console.log('Graph '+file);errors+=output(issues);
    }
    return errors?1:0;
  }
  if(['check-graph','export-jsonld','export-dot'].includes(cmd)){
    if(!args[1])throw Error('missing graph path');
    const graph=load(args[1]),t=compileTemplate(option(args,'--template')||graph.template,r),issues=validateGraph(graph,t);
    const result=output(issues);
    if(result||(args.includes('--warnings-as-errors')&&issues.length))return 1;
    if(cmd!=='check-graph'){
      const p=option(args,'-o')||option(args,'--output');if(!p)throw Error('missing -o <path>');
      const data=cmd==='export-dot'?exportDOT(graph):JSON.stringify(exportJSONLD(graph),null,2)+'\n';
      writeFileSync(p,data);console.log('Wrote '+p);
    }
    return 0;
  }
  usage();return 2;
}
try{process.exitCode=run();}catch(error){console.error('ERROR:',error.message);process.exitCode=2;}
