#!/usr/bin/env node
// Bounded demonstration query, not a general ontology reasoner or query service.
import {readFileSync,readdirSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileTemplate,validateGraph} from '../lib/engine.mjs';
import {validateEvidence} from '../lib/evidence.mjs';
import {args} from '../adapters/local-common.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function loadRegistry(){
  const read=p=>JSON.parse(readFileSync(join(ROOT,p),'utf8'));
  const r={core:read('core/ontology.json')};
  for(const name of readdirSync(join(ROOT,'templates')))r[name]=read(`templates/${name}/ontology.json`);
  return r;
}
export function traceCommit(graph,sha,{sourceRoot}={}){
  if(!/^(?:[a-f\d]{40}|[a-f\d]{64})$/.test(sha))throw Error('A full commit SHA is required');
  const structure=validateGraph(graph,compileTemplate(graph.template,loadRegistry()));
  const check=validateEvidence(graph,{sourceRoot,requireHash:true});
  const diagnostics=[...structure,...check.diagnostics];
  if(diagnostics.length)throw Error('Trace refused: '+diagnostics.map(d=>d.code).join(', '));
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  const id=`commit:${sha}`;if(nodes.get(id)?.type!=='Commit')throw Error('Commit not in graph');
  function citation(evId){
    const e=nodes.get(evId),s=nodes.get(e?.properties?.sourceId);
    if(e?.type!=='Evidence'||s?.type!=='Source')throw Error('Invalid citation');
    return {evidenceId:evId,source:s.properties.uri,locator:e.properties.locator,excerpt:e.properties.excerpt,sha256:s.properties.sha256,...(s.properties.revision?{revision:s.properties.revision}:{})};
  }
  const supporting=id=>graph.edges.filter(e=>e.from===id&&e.type==='supportedBy').map(e=>citation(e.to));
  const links=graph.edges.filter(e=>e.from===id&&['decidedIn','implementsTicket'].includes(e.type));
  const decisions=links.filter(e=>e.type==='decidedIn').map(e=>({
    id:e.to,statement:nodes.get(e.to).properties.statement,
    edgeId:e.id,assertionStatus:e.assertionStatus,
    linkEvidence:(e.evidenceIds||[]).map(citation),decisionEvidence:supporting(e.to)
  }));
  const decisionIds=new Set(decisions.map(d=>d.id));
  // Approver is extracted from an explicit grammar record, NEVER the git author.
  const approvals=[];
  for(const claim of graph.nodes.filter(n=>n.type==='Claim'&&n.properties.recordKind==='approval'&&decisionIds.has(n.properties.decisionId))){
    const p=claim.properties,evs=supporting(claim.id);
    const expected=`Approval: ${p.decisionId.slice('decision:'.length)} | ${p.approver} | ${p.approvalStatus}`;
    if(!evs.some(ev=>ev.excerpt===expected))throw Error('Approval metadata does not match the cited record');
    approvals.push({claimId:claim.id,decisionId:p.decisionId,approver:p.approver,status:p.approvalStatus,evidence:evs});
  }
  return {
    question:'Which decision led to this commit, who is recorded as approver, and where is the evidence?',
    commit:sha,tickets:links.filter(e=>e.type==='implementsTicket').map(e=>({id:e.to,edgeId:e.id,assertionStatus:e.assertionStatus,evidence:(e.evidenceIds||[]).map(citation)})),
    decisions,approvals,unknowns:[...(!decisions.length?['No explicit decision link']:[]),...(!approvals.length?['No approval record found']:[])],
    verification:{structure:'pass',textIntegrity:'pass',checked:check.checked,skipped:check.skipped,semanticTruth:'not-verified'},
    limitations:['A commit trailer is an author assertion, not proof of correct implementation.','An approval record is not a verified human signature.','Local hashes establish byte consistency, not authenticity of the source.']
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const a=args(process.argv.slice(2),['--graph','--commit','--source-root']);
    if(!a['--graph']||!a['--commit']||!a['--source-root'])throw Error('Usage: node demo/trace.mjs --graph GRAPH --commit SHA --source-root ROOT');
    console.log(JSON.stringify(traceCommit(JSON.parse(readFileSync(a['--graph'],'utf8')),a['--commit'],{sourceRoot:a['--source-root']}),null,2));
  }catch(e){console.error(e.message);process.exitCode=1;}
}
