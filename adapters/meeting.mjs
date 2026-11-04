#!/usr/bin/env node
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {args,readSource,node,edge,put,supported,cite,writeJSON} from './local-common.mjs';

/** Deliberately narrow grammar. Unknown prose stays unmodeled; not an NLP parser.
 * Meeting: M1 | date=2026-10-20
 * Decision: D1 | Statement
 * Approval: D1 | An | approved
 * Action: A1 | Binh | Task summary
 * Claim: C1 | Statement
 */
export function extractMeeting({sourceRoot,input}){
  const source=readSource(sourceRoot,input),graph={apiVersion:'oes.graph/v1',template:'cross-domain',metadata:{id:'meeting-candidates',producer:'oes/meeting-adapter',inputTrust:'unverified'},nodes:[],edges:[]};
  const records=[],ids=new Set();let meeting;
  const key=/^[A-Za-z][A-Za-z0-9_-]*$/;
  for(const [i,text] of source.lines.entries()){
    const m=/^(Meeting|Decision|Approval|Action|Claim): (.+)$/.exec(text);if(!m)continue;
    const fields=m[2].split(' | '),kind=m[1],line=i+1;
    if(!key.test(fields[0])||fields.some(s=>!s.trim()))throw Error(`Invalid ${kind} record at L${line}`);
    const expected=kind==='Approval'||kind==='Action'?3:2;
    if(fields.length!==expected)throw Error(`Expected ${expected} fields at L${line}`);
    if(kind==='Meeting'){
      if(meeting)throw Error('Only one Meeting header is supported per file');
      if(!/^date=\d{4}-\d{2}-\d{2}$/.test(fields[1]))throw Error(`Invalid Meeting date at L${line}`);
      const date=fields[1].slice(5);if(Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Invalid calendar date');
      meeting={id:`meeting:${fields[0]}`,type:'Conversation',properties:{title:fields[0],occurredAt:date}};
    }else records.push({kind,fields,line});
  }
  if(!meeting)throw Error('Missing Meeting: header');put(graph,meeting);put(graph,source.node);
  // First create definitions; references in approvals are resolved in a second pass.
  for(const {kind,fields,line} of records){
    const [id,a,b]=fields;if(kind==='Approval')continue;
    const full=`${kind.toLowerCase()}:${id}`;
    if(ids.has(full))throw Error(`Duplicate ${kind} ID ${id}`);ids.add(full);
    if(kind==='Decision'){
      put(graph,node(full,'Decision',{statement:a,status:'proposed'}));const ev=supported(graph,full,source,line);
      put(graph,edge('recordedIn',full,meeting.id,[ev]),'edges');
    }else if(kind==='Claim'){
      put(graph,node(full,'Claim',{statement:a,status:'proposed'}));supported(graph,full,source,line);
    }else if(kind==='Action'){
      // An owner is not a speaker. No authoredBy relation is created.
      const actor=`${source.node.id}:actor:${encodeURIComponent(a)}`;put(graph,node(actor,'Actor',{name:a}));
      put(graph,node(full,'ActionItem',{summary:b}));const ev=cite(graph,source,line);
      put(graph,edge('assignedTo',full,actor,[ev]),'edges');
      put(graph,edge('recordedIn',full,meeting.id,[ev]),'edges');
    }
  }
  for(const {kind,fields,line} of records){
    if(kind!=='Approval')continue;
    const [id,approver,status]=fields;
    if(!['approved','rejected'].includes(status))throw Error(`Invalid approval status at L${line}`);
    const decision=graph.nodes.find(n=>n.id===`decision:${id}`);if(!decision)throw Error(`Unknown decision ${id}`);
    // This is a source's assertion of approval, NOT a verified human signature.
    const claim=`approval:${id}:${line}`;
    put(graph,node(claim,'Claim',{statement:`${approver} ${status} ${id}.`,status:'proposed',recordKind:'approval',decisionId:decision.id,approver,approvalStatus:status}));
    const ev=supported(graph,claim,source,line);
    put(graph,edge('supportedBy',decision.id,ev),'edges');
  }
  return graph;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const a=args(process.argv.slice(2),['--source-root','--input','--out']);
    if(!a['--source-root']||!a['--input']||!a['--out'])throw Error('Usage: node adapters/meeting.mjs --source-root ROOT --input RELATIVE_PATH --out GRAPH');
    writeJSON(a['--out'],extractMeeting({sourceRoot:a['--source-root'],input:a['--input']}));
  }catch(e){console.error(e.message);process.exitCode=2;}
}
