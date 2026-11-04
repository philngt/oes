import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileTemplate,validateTemplate,validateGraph,exportJSONLD,exportDOT} from '../lib/engine.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const registry={core:read('core/ontology.json')};
for(const id of readdirSync(join(root,'templates')))registry[id]=read('templates/'+id+'/ontology.json');
const clean=d=>d.filter(x=>x.severity==='error');
test('all templates compile with valid endpoints, inheritance and inverses',()=>{
  for(const id of Object.keys(registry))assert.deepEqual(clean(validateTemplate(compileTemplate(id,registry))),[],id);
});
test('all synthetic graph fixtures validate with no errors',()=>{
  for(const file of readdirSync(join(root,'examples')).filter(x=>x.endsWith('.graph.json'))){
    const graph=read('examples/'+file);
    assert.deepEqual(clean(validateGraph(graph,compileTemplate(graph.template,registry))),[],file);
  }
});
test('bad node IDs, wrong relation types and missing evidence fail',()=>{
  const g=read('examples/kafka-meeting.graph.json'),t=compileTemplate(g.template,registry);
  g.nodes.push(structuredClone(g.nodes[0]));
  g.edges[0].type='notARelation';g.edges[0].evidenceIds=[];
  const codes=validateGraph(g,t).map(x=>x.code);
  for(const code of ['duplicate-id','unknown-relation','missing-evidence'])assert.ok(codes.includes(code),code);
});
test('cardinality and entity type mismatch are rejected',()=>{
  const g=read('examples/kafka-meeting.graph.json'),t=compileTemplate(g.template,registry);
  g.edges.push({id:'repeat',type:'assignedTo',from:'action',to:'decision',evidenceIds:['ev-action'],assertionStatus:'asserted'});
  const codes=validateGraph(g,t).map(x=>x.code);
  assert.ok(codes.includes('cardinality-out'));
  assert.ok(codes.includes('invalid-target-type'));
});
test('inheritance conflict and cycle cannot silently override a schema',()=>{
  const r=structuredClone(registry);
  r.foo={apiVersion:'oes/v1',kind:'OntologyTemplate',metadata:{id:'foo'},extends:['core'],entityTypes:{Source:{description:'other'}},relationTypes:{}};
  assert.throws(()=>compileTemplate('foo',r),/conflicts/);
  r.loop={apiVersion:'oes/v1',kind:'OntologyTemplate',metadata:{id:'loop'},extends:['loop'],entityTypes:{},relationTypes:{}};
  assert.throws(()=>compileTemplate('loop',r),/cycle/);
});
test('exports retain assertions including implicit supportedBy provenance',()=>{
  const graph=read('examples/kafka-meeting.graph.json');
  const out=exportJSONLD(graph);
  assert.equal(out['@graph'].length,graph.nodes.length+graph.edges.length);
  const statement=out['@graph'].find(x=>x['@id']==='urn:oes:edge:m3');
  assert.deepEqual(statement['oes:evidence'],[{'@id':'urn:oes:node:ev-decision'}]);
  assert.equal(statement['oes:assertionStatus'],'asserted');
  assert.match(exportDOT(graph),/digraph ontology/);
});
