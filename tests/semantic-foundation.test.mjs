import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileTemplate,validateTemplate,validateGraph} from '../lib/engine.mjs';
import {validateEvidence} from '../lib/evidence.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>JSON.parse(readFileSync(join(ROOT,path),'utf8'));
const registry={core:read('core/ontology.json')};
for(const id of readdirSync(join(ROOT,'templates')))registry[id]=read(`templates/${id}/ontology.json`);
const graph=read('examples/cross-domain.graph.json');
const schema=compileTemplate(graph.template,registry);
const targets=(g,id,type)=>g.edges.filter(e=>e.from===id&&e.type===type).map(e=>e.to).sort();
const sources=(g,id,type)=>g.edges.filter(e=>e.to===id&&e.type===type).map(e=>e.from).sort();
const node=(g,id)=>g.nodes.find(n=>n.id===id);

// These are bounded fixture traversals, not a query language or semantic reasoner.
function attributedPeople(g,actorId){
  return targets(g,actorId,'representsPerson');
}
function trackedTasks(g){
  const realized=targets(g,'action:a1','realizedAsTask');
  const tracked=targets(g,'ticket:rel-42','tracksTask');
  return realized.filter(id=>tracked.includes(id)).map(id=>({
    task:id,
    assignees:targets(g,id,'assignedToPerson')
  }));
}
function decisionTrace(g){
  return sources(g,'decision:d1','decidedIn').map(id=>({
    commit:id,
    tickets:targets(g,id,'implementsTicket'),
    services:targets(g,id,'changesService')
  }));
}
function compose(id,parents){
  const r={...registry,[id]:{
    apiVersion:'oes/v1',kind:'OntologyTemplate',metadata:{id,version:'0.1.0'},
    extends:parents,entityTypes:{},relationTypes:{},constraints:[]
  }};
  return compileTemplate(id,r);
}

test('every bundled relation has an explicit semantic description',()=>{
  for(const [templateId,template] of Object.entries(registry)){
    for(const [relationId,relation] of Object.entries(template.relationTypes)){
      assert.equal(typeof relation.description,'string',`${templateId}.${relationId}`);
      assert.ok(relation.description.trim().length>0,`${templateId}.${relationId}`);
    }
  }
});

test('shared agents compose workflow and people, and all six templates share one core',()=>{
  const peopleWorkflow=compose('test-people-workflow',['workflow-process','people-relationship']);
  assert.deepEqual(validateTemplate(peopleWorkflow),[]);
  assert.deepEqual(peopleWorkflow.entityTypes.Person,registry.agents.entityTypes.Person);
  const combined=compose('test-all-domains',[
    'agents','knowledge-evidence','software-system','workflow-process','people-relationship','cross-domain'
  ]);
  assert.deepEqual(validateTemplate(combined),[]);
  assert.deepEqual(combined.entityTypes.Actor,registry.agents.entityTypes.Actor);
  assert.deepEqual(combined.entityTypes.Source,registry.core.entityTypes.Source);
  assert.deepEqual(validateGraph(graph,combined),[]);
});

test('cross-domain fixture has valid structure and exact local evidence with a required raw-file hash',()=>{
  assert.equal(graph.metadata.synthetic,true);
  assert.deepEqual(validateGraph(graph,schema),[]);
  const result=validateEvidence(graph,{sourceRoot:ROOT,requireHash:true});
  assert.deepEqual(result,{checked:22,skipped:0,diagnostics:[]});
  assert.equal(graph.nodes.filter(n=>n.type==='Evidence').length,graph.edges.length);
  assert.ok(graph.edges.every(e=>e.assertionStatus==='asserted'));
  assert.equal(node(graph,'decision:d1').properties.status,'accepted');
  assert.ok(!graph.nodes.some(n=>n.type==='Deployment'));
  assert.match(readFileSync(join(ROOT,'examples/sources/cross-domain.md'),'utf8'),/Task TASK-42 remains open and uncompleted/);
});

test('SF-CQ1: which exact source span supports the decision statement?',()=>{
  const evidenceIds=targets(graph,'decision:d1','supportedBy');
  assert.deepEqual(evidenceIds,['ev:decision-statement']);
  const evidence=node(graph,evidenceIds[0]);
  assert.equal(evidence.properties.locator,'L8');
  assert.equal(evidence.properties.sourceId,'source:cross-domain');
  assert.equal(node(graph,evidence.properties.sourceId).properties.uri,'examples/sources/cross-domain.md');
  assert.equal(evidence.properties.excerpt,'Decision D1 states: Keep database-write failures eligible for retry in the proof of concept.');
});

test('SF-CQ2: which person is explicitly represented when two people have the same name?',()=>{
  assert.equal(node(graph,'person:binh').properties.name,node(graph,'person:binh-unrelated').properties.name);
  assert.deepEqual(attributedPeople(graph,'actor:binh'),['person:binh']);
  assert.deepEqual(sources(graph,'person:binh-unrelated','representsPerson'),[]);
  const unresolved=structuredClone(graph);
  unresolved.edges=unresolved.edges.filter(e=>e.id!=='edge:identity-binh');
  assert.deepEqual(validateGraph(unresolved,schema),[]);
  assert.deepEqual(attributedPeople(unresolved,'actor:binh'),[]);
});

test('SF-CQ2 negative: a same-name second identity link violates the actor cardinality',()=>{
  const ambiguous=structuredClone(graph);
  ambiguous.edges.push({
    ...structuredClone(ambiguous.edges.find(e=>e.id==='edge:identity-binh')),
    id:'edge:unsupported-same-name-identity',to:'person:binh-unrelated'
  });
  assert.ok(validateGraph(ambiguous,schema).some(d=>d.code==='cardinality-out'));
});

test('SF-CQ3: who made and spoke the decision, distinct from the assigned worker?',()=>{
  const messageIds=targets(graph,'decision:d1','statedIn');
  const makers=targets(graph,'decision:d1','decidedBy');
  const speakers=messageIds.flatMap(id=>targets(graph,id,'authoredBy'));
  assert.deepEqual({
    messages:messageIds,makers,speakers,
    makerPeople:makers.flatMap(id=>attributedPeople(graph,id)),
    actionAssignees:targets(graph,'action:a1','assignedTo')
  },{
    messages:['message:msg1'],makers:['actor:an'],speakers:['actor:an'],
    makerPeople:['person:an'],actionAssignees:['actor:binh']
  });
});

test('SF-CQ3 negative: structural and text checks do not certify a misattributed decision',()=>{
  const misattributed=structuredClone(graph);
  misattributed.edges.find(e=>e.id==='edge:decision-maker').to='actor:binh';
  // The quotation still exists, but it names An. Neither validator judges entailment.
  assert.deepEqual(validateGraph(misattributed,schema),[]);
  assert.deepEqual(validateEvidence(misattributed,{sourceRoot:ROOT,requireHash:true}).diagnostics,[]);
  assert.notDeepEqual(targets(misattributed,'decision:d1','decidedBy'),['actor:an']);
  assert.deepEqual(targets(misattributed,'decision:d1','decidedBy'),['actor:binh']);
  assert.match(node(misattributed,'ev:decision-maker').properties.excerpt,/Actor A-AN adopted Decision D1/);
});

test('SF-CQ4: which task realizes the action, is tracked by the ticket, and has an owner?',()=>{
  assert.deepEqual(targets(graph,'ticket:rel-42','tracks'),['action:a1']);
  assert.deepEqual(trackedTasks(graph),[{task:'task:42',assignees:['person:binh']}]);
});
for(const bridgeId of ['edge:action-task','edge:ticket-task']){
  test(`SF-CQ4 negative: removing ${bridgeId} leaves the explicit work trace incomplete`,()=>{
    const missing=structuredClone(graph);
    missing.edges=missing.edges.filter(e=>e.id!==bridgeId);
    assert.deepEqual(validateGraph(missing,schema),[]);
    assert.deepEqual(trackedTasks(missing),[]);
  });
}

test('SF-CQ5: which declared commit connects the decision, ticket and changed service?',()=>{
  assert.deepEqual(decisionTrace(graph),[{
    commit:'commit:c1',tickets:['ticket:rel-42'],services:['service:orders-consumer']
  }]);
  assert.deepEqual(targets(graph,'commit:c2','implementsTicket'),[]);
  assert.deepEqual(targets(graph,'commit:c2','decidedIn'),[]);
  assert.match(readFileSync(join(ROOT,'examples/sources/cross-domain.md'),'utf8'),/C2 has message "docs: discuss REL-42"; it only mentions the ticket/);
  // This static fixture checks the intended boundary; demo.test.mjs tests the actual Git adapter.
});

test('SF-CQ6: which policy does the decision motivate, and which process is governed by it?',()=>{
  const policies=targets(graph,'decision:d1','motivatesPolicy');
  assert.deepEqual(policies,['policy:pol1']);
  assert.deepEqual(policies.flatMap(id=>sources(graph,id,'governedBy')),['process:proc1']);
  assert.deepEqual(targets(graph,'process:proc1','hasStep'),['step:step1']);
  assert.deepEqual(targets(graph,'step:step1','createsTask'),['task:42']);
});

test('legacy Actor and Person fixtures remain structurally valid without new required fields',()=>{
  for(const fixture of ['kafka-meeting','software-kafka','approval-workflow','family']){
    const old=read(`examples/${fixture}.graph.json`);
    assert.deepEqual(validateGraph(old,compileTemplate(old.template,registry)),[],fixture);
    assert.deepEqual(validateEvidence(old,{sourceRoot:ROOT,requireHash:true}).diagnostics,[],fixture);
  }
});

test('SF-CQ7: the legacy workflow still identifies the assigned reviewer',()=>{
  const old=read('examples/approval-workflow.graph.json');
  assert.deepEqual(targets(old,'task','assignedToPerson'),['linh']);
  assert.deepEqual(targets(old,'process','hasStep'),['finance','manager']);
});

test('SF-CQ8: the legacy software graph traces a configuration change and event channel',()=>{
  const old=read('examples/software-kafka.graph.json');
  const changed=targets(old,'commit','changesConfig');
  assert.deepEqual(changed,['config']);
  assert.deepEqual(changed.flatMap(id=>targets(old,id,'configures')),['service']);
  const events=targets(old,'service','publishes');
  assert.deepEqual(events,['event']);
  assert.deepEqual(events.flatMap(id=>targets(old,id,'carriedBy')),['topic']);
  assert.equal(old.edges.find(e=>e.type==='publishes').properties.observationKind,'declared-configuration');
});

test('SF-CQ9: the legacy people graph retains explicit parenthood without materializing an inverse',()=>{
  const old=read('examples/family.graph.json');
  assert.deepEqual(targets(old,'lan','parentOf'),['mai']);
  assert.deepEqual(targets(old,'mai','childOf'),['lan']);
  assert.equal(old.edges.find(e=>e.type==='childOf').assertionStatus,'inferred');
  old.edges=old.edges.filter(e=>e.type!=='childOf');
  assert.deepEqual(validateGraph(old,compileTemplate(old.template,registry)),[]);
  assert.deepEqual(targets(old,'mai','childOf'),[]);
  assert.deepEqual(targets(old,'lan','parentOf'),['mai']);
});

test('SF-CQ10: the legacy meeting assignment does not invent a speaker or decision maker',()=>{
  const old=read('examples/kafka-meeting.graph.json');
  assert.deepEqual(targets(old,'action','assignedTo'),['binh']);
  assert.deepEqual(targets(old,'message','authoredBy'),[]);
  assert.deepEqual(targets(old,'decision','decidedBy'),[]);
});

test('new bridge endpoint and evidence contracts reject malformed candidate links',()=>{
  for(const relation of ['representsPerson','statedIn','decidedBy','realizedAsTask','tracksTask','motivatesPolicy']){
    const wrongEndpoint=structuredClone(graph);
    wrongEndpoint.edges.find(e=>e.type===relation).to='source:cross-domain';
    assert.ok(validateGraph(wrongEndpoint,schema).some(d=>d.code==='invalid-target-type'),relation);
    const ungrounded=structuredClone(graph);
    delete ungrounded.edges.find(e=>e.type===relation).evidenceIds;
    assert.ok(validateGraph(ungrounded,schema).some(d=>d.code==='missing-evidence'),relation);
  }
});

test('source metadata remains optional but declared non-string values fail structural validation',()=>{
  const optional=structuredClone(graph);
  const source=node(optional,'source:cross-domain');
  for(const field of ['sha256','version','retrievedAt'])delete source.properties[field];
  assert.deepEqual(validateGraph(optional,schema),[]);
  assert.ok(validateEvidence(optional,{sourceRoot:ROOT,requireHash:true}).diagnostics.some(d=>d.code==='missing-source-hash'));
  for(const field of ['sha256','version','retrievedAt']){
    const malformed=structuredClone(graph);
    node(malformed,'source:cross-domain').properties[field]=42;
    assert.ok(validateGraph(malformed,schema).some(d=>d.code==='property-type'&&d.path.endsWith('.'+field)),field);
  }
});
