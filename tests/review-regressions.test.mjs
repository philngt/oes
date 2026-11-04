import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,symlinkSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {canonicalJSON,compileTemplate,validateGraph,exportJSONLD} from '../lib/engine.mjs';
import {validateEvidence} from '../lib/evidence.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(join(ROOT,p),'utf8'));
const registry={core:read('core/ontology.json')};
for(const dir of readdirSync(join(ROOT,'templates')))registry[dir]=read(`templates/${dir}/ontology.json`);
const schema=compileTemplate('knowledge-evidence',registry);
const hash=s=>createHash('sha256').update(s).digest('hex');
const codes=report=>report.diagnostics.map(d=>d.code);
function fixture(t,text='heading\nDecision: Keep Kafka.\n'){
  const root=mkdtempSync(join(tmpdir(),'oes-evidence-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  writeFileSync(join(root,'source.md'),text);
  const graph={nodes:[{id:'s',type:'Source',properties:{uri:'source.md',sha256:hash(text)}},{id:'e',type:'Evidence',properties:{sourceId:'s',locator:'L2',excerpt:'Decision: Keep Kafka.'}}],edges:[]};
  return {root,graph,source:graph.nodes[0].properties,evidence:graph.nodes[1].properties};
}
for(const file of ['kafka-meeting','software-kafka','approval-workflow','family']){
  test(`${file}: every local excerpt and source hash is correct`,()=>{
    const r=validateEvidence(read(`examples/${file}.graph.json`),{sourceRoot:ROOT,requireHash:true});
    assert.deepEqual(r.diagnostics,[]);assert.ok(r.checked>=3);assert.equal(r.skipped,0);
  });
}
test('review reproduction: invented excerpt fails',t=>{
  const {root,graph,evidence}=fixture(t);evidence.excerpt='Team agreed to drop Kafka entirely';
  assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('excerpt-mismatch'));
});
test('review reproduction: L999 fails',t=>{
  const {root,graph,evidence}=fixture(t);evidence.locator='L999';
  assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('locator-range'));
});
test('exact selected span required; partial substring fails',t=>{
  const {root,graph,evidence}=fixture(t);evidence.excerpt='Keep Kafka.';
  assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('excerpt-mismatch'));
});
test('multiline ranges match exactly',t=>{
  const {root,graph,evidence}=fixture(t);evidence.locator='L1-L2';evidence.excerpt='heading\nDecision: Keep Kafka.';
  assert.equal(validateEvidence(graph,{sourceRoot:root}).checked,1);
});
test('CRLF and LF match but raw-file hashes retain EOL sensitivity',t=>{
  const {root,graph}=fixture(t,'heading\r\nDecision: Keep Kafka.\r\n');
  assert.equal(validateEvidence(graph,{sourceRoot:root,requireHash:true}).checked,1);
});
for(const loc of ['L0','L2-L1','L-1','L1-L999','L1;rm -rf /','L9007199254740999']){
  test(`bad locator rejected: ${loc}`,t=>{const {root,graph,evidence}=fixture(t);evidence.locator=loc;assert.ok(validateEvidence(graph,{sourceRoot:root}).diagnostics.some(d=>d.severity==='error'));});
}
test('missing excerpt is an error',t=>{const {root,graph,evidence}=fixture(t);delete evidence.excerpt;assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('missing-excerpt'));});
test('hash mismatch flags stale or tampered sources',t=>{const {root,graph,source}=fixture(t);source.sha256='0'.repeat(64);assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('source-hash-mismatch'));});
test('hash requirement is optional and explicit',t=>{const {root,graph,source}=fixture(t);delete source.sha256;assert.equal(validateEvidence(graph,{sourceRoot:root}).checked,1);assert.ok(codes(validateEvidence(graph,{sourceRoot:root,requireHash:true})).includes('missing-source-hash'));});
for(const uri of ['../secret.txt','/etc/passwd','file:///etc/passwd','C:\\Windows\\x','%2e%2e/secret','source.md#L2']){
  test(`unsafe path rejected: ${uri}`,t=>{const {root,graph,source}=fixture(t);source.uri=uri;assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('source-path'));});
}
test('symlink outside root is refused',t=>{
  const {root,graph,source}=fixture(t),outside=mkdtempSync(join(tmpdir(),'oes-outside-'));
  t.after(()=>rmSync(outside,{recursive:true,force:true}));writeFileSync(join(outside,'private'),'secret');
  try{symlinkSync(join(outside,'private'),join(root,'link'));}catch(e){if(['EPERM','ENOSYS'].includes(e.code)){t.skip('Symlink creation is unavailable on this host');return;}throw e;}
  source.uri='link';assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('source-path'));
});
test('remote source is explicitly skipped, not silently checked',t=>{
  const {root,graph,source}=fixture(t);source.uri='https://example.invalid/source';const r=validateEvidence(graph,{sourceRoot:root});
  assert.equal(r.checked,0);assert.equal(r.skipped,1);assert.equal(r.diagnostics[0].severity,'warning');
});
test('size limit and invalid UTF-8 are rejected',t=>{
  const {root,graph,source}=fixture(t);assert.ok(codes(validateEvidence(graph,{sourceRoot:root,maxBytes:2})).includes('source-size'));
  writeFileSync(join(root,'source.md'),Buffer.from([0xff,0xff]));delete source.sha256;
  assert.ok(codes(validateEvidence(graph,{sourceRoot:root})).includes('source-encoding'));
});
test('missing files and duplicate node IDs give diagnostics',t=>{
  const {root,graph,source}=fixture(t);source.uri='missing';graph.nodes.push({...graph.nodes[0]});
  const cs=codes(validateEvidence(graph,{sourceRoot:root}));assert.ok(cs.includes('source-unreadable'));assert.ok(cs.includes('duplicate-id'));
});
test('composition ignores object key order including nested rules',()=>{
  const r=structuredClone(registry),definition=r.core.entityTypes.Source;
  r.reordered={apiVersion:'oes/v1',kind:'OntologyTemplate',metadata:{id:'reordered'},extends:['core'],entityTypes:{Source:{properties:{kind:{type:'string'},uri:{required:true,type:'string'}},parent:definition.parent,description:definition.description}},relationTypes:{}};
  assert.doesNotThrow(()=>compileTemplate('reordered',r));
});
test('canonical comparison does not reorder arrays or erase semantic changes',()=>{
  assert.notEqual(canonicalJSON({enum:['a','b']}),canonicalJSON({enum:['b','a']}));
  assert.notEqual(canonicalJSON({type:'string'}),canonicalJSON({type:'number'}));
});
test('inherited constraints with the same ID but different semantics conflict',()=>{
  const r=structuredClone(registry),base={apiVersion:'oes/v1',kind:'OntologyTemplate',entityTypes:{},relationTypes:{},extends:['core']};
  const c={id:'same',kind:'requiresEdge',nodeType:'Claim',edgeType:'supportedBy',direction:'out',severity:'warning'};
  r.a={...base,metadata:{id:'a'},constraints:[c]};r.b={...base,metadata:{id:'b'},constraints:[{...c,severity:'error'}]};
  r.both={...base,metadata:{id:'both'},extends:['a','b'],constraints:[]};
  assert.throws(()=>compileTemplate('both',r),/constraint same conflicts/);
});
test('supportedBy uses target evidence without circular metadata',()=>{
  const g=read('examples/kafka-meeting.graph.json');assert.equal(g.edges.find(e=>e.id==='m3').evidenceIds,undefined);
  assert.deepEqual(validateGraph(g,schema),[]);
  g.edges.find(e=>e.id==='m3').to='decision';assert.ok(validateGraph(g,schema).some(d=>d.code==='missing-evidence'));
});
test('fixtures omit unsupported authorship and preserve limitation without false contradiction',()=>{
  const g=read('examples/kafka-meeting.graph.json');assert.ok(!g.edges.some(e=>e.type==='authoredBy'||e.type==='contradicts'));
  assert.match(g.nodes.find(n=>n.id==='limitation').properties.statement,/does not by itself fix lost writes/);
});
test('verified without evidence remains a documented warning',()=>{
  const g=read('examples/kafka-meeting.graph.json');g.edges[0].assertionStatus='verified';g.edges[0].evidenceIds=[];
  assert.equal(validateGraph(g,schema).find(d=>d.code==='untraced-verified').severity,'warning');
});
test('JSON-LD namespace uses repository-controlled GitHub URI',()=>{
  assert.equal(exportJSONLD(read('examples/kafka-meeting.graph.json'))['@context'].oes,'https://github.com/philngt/oes#');
});
test('invalid hierarchy returns diagnostics without crashing graph validation',()=>{
  const bad=structuredClone(schema);bad.entityTypes.Entity.parent='Claim';
  assert.ok(validateGraph(read('examples/kafka-meeting.graph.json'),bad).some(d=>d.code==='type-cycle'));
});
function cli(...args){return spawnSync(process.execPath,[join(ROOT,'bin/oes.mjs'),...args],{cwd:ROOT,encoding:'utf8'});}
test('check-all runs both structural and textual verification with JSON output',()=>{
  const r=cli('check-all','--warnings-as-errors','--require-hash','--json');assert.equal(r.status,0,r.stdout+r.stderr);
  const report=JSON.parse(r.stdout);assert.equal(report.passed,true);assert.equal(report.evidence.checked,16);assert.equal(report.evidence.skipped,0);
});
test('check-evidence CLI fails on tampered excerpt',t=>{
  const {root}=fixture(t),g=read('examples/kafka-meeting.graph.json');g.nodes.find(n=>n.id==='ev-decision').properties.excerpt='Drop Kafka';
  const path=join(root,'bad.json');writeFileSync(path,JSON.stringify(g));
  const r=cli('check-evidence',path,'--source-root',ROOT,'--json');assert.equal(r.status,1);assert.ok(codes(JSON.parse(r.stdout)).includes('excerpt-mismatch'));
});
test('warnings-as-errors rejects remote unverified provenance',t=>{
  const {root}=fixture(t),g=read('examples/kafka-meeting.graph.json');g.nodes.find(n=>n.type==='Source').properties.uri='https://example.invalid/x';
  const path=join(root,'remote.json');writeFileSync(path,JSON.stringify(g));
  const r=cli('check-evidence',path,'--source-root',ROOT,'--warnings-as-errors','--json');assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).evidence.skipped,3);
});
test('CLI rejects unknown flags and unactivated hash checking',()=>{
  assert.equal(cli('check-all','--unknown').status,2);
  assert.equal(cli('check-graph','examples/kafka-meeting.graph.json','--require-hash').status,2);
});
