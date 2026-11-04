#!/usr/bin/env node
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join,dirname} from 'node:path';
import {compileTemplate,validateTemplate,validateGraph,exportJSONLD,exportDOT} from '../lib/engine.mjs';
import {validateEvidence} from '../lib/evidence.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=path=>JSON.parse(readFileSync(path,'utf8'));
function registry(){
  const r={core:load(join(ROOT,'core/ontology.json'))};
  for(const name of readdirSync(join(ROOT,'templates'))){
    const path=join(ROOT,'templates',name,'ontology.json');
    if(existsSync(path))r[name]=load(path);
  }
  return r;
}
function usage(){
  console.log(`oes templates
 oes check-all [--warnings-as-errors] [--require-hash] [--json]
 oes check-template <id> [--json]
 oes compile-template <id> -o <path>
 oes check-graph <graph.json> [--template <id>] [--with-evidence] [--source-root <path>]
 oes check-evidence <graph.json> [--source-root <path>] [--require-hash]
 oes export-jsonld <graph.json> -o <path> [--with-evidence] [--source-root <path>]
 oes export-dot <graph.json> -o <path> [--with-evidence] [--source-root <path>]
Validation commands accept --warnings-as-errors and --json. Evidence checks never fetch remote sources.`);
}
const VALUE_FLAGS=new Set(['-o','--output','--template','--source-root']);
const BOOL_FLAGS=new Set(['--warnings-as-errors','--json','--with-evidence','--require-hash']);
function parse(args){
  const options={},positionals=[];
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(VALUE_FLAGS.has(arg)){
      if(!args[i+1]||args[i+1].startsWith('-'))throw Error(`Missing value for ${arg}`);
      options[arg]=args[++i];
    }else if(BOOL_FLAGS.has(arg))options[arg]=true;
    else if(arg.startsWith('-'))throw Error(`Unknown option ${arg}`);
    else positionals.push(arg);
  }
  return {options,positionals};
}
function emit(command,diagnostics,options,evidence){
  const passed=!diagnostics.some(d=>d.severity==='error'||(options['--warnings-as-errors']&&d.severity==='warning'));
  const report={command,passed,diagnostics,...(evidence?{evidence}:{})};
  if(options['--json'])console.log(JSON.stringify(report,null,2));
  else{
    for(const d of diagnostics)console.log(`${d.severity.toUpperCase()} ${d.code} ${d.path}: ${d.message}`);
    if(evidence)console.log(`Evidence: ${evidence.checked} checked, ${evidence.skipped} skipped`);
    console.log(passed?'OK':'FAILED');
  }
  return passed?0:1;
}
function run(){
  const args=process.argv.slice(2);
  if(!args.length||['help','-h','--help'].includes(args[0])){usage();return 0;}
  const cmd=args.shift(),{options:o,positionals:p}=parse(args),r=registry();
  const output=o['-o']||o['--output'];
  if(cmd==='templates'){console.log(Object.keys(r).filter(x=>x!=='core').sort().join('\n'));return 0;}
  if(cmd==='check-all'){
    if(p.length)throw Error('check-all takes no positional arguments');
    const diagnostics=[],evidence={checked:0,skipped:0};
    for(const id of Object.keys(r))diagnostics.push(...validateTemplate(compileTemplate(id,r)));
    for(const file of readdirSync(join(ROOT,'examples')).filter(x=>x.endsWith('.graph.json'))){
      const graph=load(join(ROOT,'examples',file)),schema=compileTemplate(graph.template,r);
      const report=validateEvidence(graph,{sourceRoot:ROOT,requireHash:!!o['--require-hash']});
      for(const d of [...validateGraph(graph,schema),...report.diagnostics])diagnostics.push({...d,path:`${file}:${d.path}`});
      evidence.checked+=report.checked;evidence.skipped+=report.skipped;
    }
    return emit(cmd,diagnostics,o,evidence);
  }
  if(['check-template','compile-template'].includes(cmd)){
    if(p.length!==1)throw Error('Expected one template ID');
    const schema=compileTemplate(p[0],r),issues=validateTemplate(schema);
    if(cmd==='compile-template'&&!output)throw Error('Missing -o <path>');
    const code=emit(cmd,issues,o);
    if(!code&&cmd==='compile-template')writeFileSync(output,JSON.stringify(schema,null,2)+'\n');
    return code;
  }
  if(!['check-graph','check-evidence','export-jsonld','export-dot'].includes(cmd))throw Error(`Unknown command ${cmd}`);
  if(p.length!==1)throw Error('Expected one graph path');
  const withEvidence=cmd==='check-evidence'||!!o['--with-evidence'];
  if(!withEvidence&&(o['--require-hash']||o['--source-root']))throw Error('Use --with-evidence to enable source checking');
  if(cmd.startsWith('export-')&&!output)throw Error('Missing -o <path>');
  const graph=load(p[0]),schema=compileTemplate(o['--template']||graph.template,r);
  const diagnostics=validateGraph(graph,schema);let evidence;
  if(withEvidence){
    const result=validateEvidence(graph,{sourceRoot:resolve(o['--source-root']||process.cwd()),requireHash:!!o['--require-hash']});
    diagnostics.push(...result.diagnostics);evidence={checked:result.checked,skipped:result.skipped};
  }
  const code=emit(cmd,diagnostics,o,evidence);
  if(!code&&cmd.startsWith('export-')){
    const data=cmd==='export-dot'?exportDOT(graph):JSON.stringify(exportJSONLD(graph),null,2)+'\n';
    writeFileSync(output,data);
  }
  return code;
}
try{process.exitCode=run();}
catch(error){
  const message=error.message||'Unknown command error';
  if(process.argv.includes('--json'))console.log(JSON.stringify({command:process.argv[2]||'',passed:false,diagnostics:[{severity:'error',code:'command-error',path:'$',message}]},null,2));
  else console.error('ERROR:',message);
  process.exitCode=2;
}
