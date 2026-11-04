#!/usr/bin/env node
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,realpathSync} from 'node:fs';
import {tmpdir,devNull} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {args,writeJSON} from '../adapters/local-common.mjs';
import {extractMeeting} from '../adapters/meeting.mjs';
import {extractGit,gitEnv,gitRead} from '../adapters/git.mjs';
import {traceCommit} from './trace.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function runDemo({out}={}){
  const dir=out?resolve(out):mkdtempSync(join(tmpdir(),'oes-demo-'));
  if(out){if(existsSync(dir))throw Error('Output path already exists; choose a new directory (nothing is overwritten)');mkdirSync(dir,{recursive:true});}
  const root=realpathSync(dir),repo=join(root,'repo'),hooks=join(root,'empty-hooks');mkdirSync(repo);mkdirSync(hooks);
  for(const name of ['meetings','tickets','services'])mkdirSync(join(repo,name));
  const meeting=`# Synthetic reliability review\nMeeting: M1 | date=2026-10-20\nDecision: D1 | Increase producer delivery.timeout.ms to 300000 for a configuration PoC.\nApproval: D1 | An | approved\nAction: A1 | Binh | Implement the producer configuration PoC.\nClaim: C1 | Changing the producer timeout alone does not fix writes lost to swallowed consumer DB timeouts.\n`;
  const ticket=`# Synthetic ticket\nTicket: T42\nDecision: D1\nAction: A1\nSummary: Implement the producer timeout PoC; consumer persistence requires a separate fix.\n`;
  writeFileSync(join(repo,'meetings/review.md'),meeting);writeFileSync(join(repo,'tickets/T42.md'),ticket);
  writeFileSync(join(repo,'services/producer.properties'),'delivery.timeout.ms=120000\n');
  const env=gitEnv({GIT_CONFIG_GLOBAL:devNull,GIT_AUTHOR_NAME:'Demo Engineer',GIT_AUTHOR_EMAIL:'engineer@example.invalid',GIT_COMMITTER_NAME:'Demo Engineer',GIT_COMMITTER_EMAIL:'engineer@example.invalid',GIT_AUTHOR_DATE:'2026-10-20T08:00:00+00:00',GIT_COMMITTER_DATE:'2026-10-20T08:00:00+00:00'});
  const git=(...a)=>execFileSync('git',['-c',`core.hooksPath=${hooks}`,'-c','commit.gpgsign=false','-c','core.autocrlf=false','-C',repo,...a],{env,encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']});
  git('init','--initial-branch=main');git('add','.');git('commit','-m','docs: record meeting D1 and ticket T42');
  const initial=git('rev-parse','HEAD').trim();
  writeFileSync(join(repo,'services/producer.properties'),'delivery.timeout.ms=300000\n');
  git('add','.');git('commit','-m','chore: adjust producer timeout\n\nImplements: T42\nDecision: D1');
  const head=git('rev-parse','HEAD').trim();
  // Exercise the same deterministic functions exported by the two adapter CLIs.
  const candidates=extractMeeting({sourceRoot:root,input:'repo/meetings/review.md'});
  candidates.metadata.synthetic=true;writeJSON(join(root,'candidates.graph.json'),candidates);
  const extraction=extractGit({repo,sourceRoot:root,graph:candidates});
  extraction.graph.metadata.id='meeting-ticket-git-demo';extraction.graph.metadata.synthetic=true;
  const graphFile=join(root,'graph.json');writeJSON(graphFile,extraction.graph);writeJSON(join(root,'adapter-report.json'),extraction.report);
  function check(...a){
    const result=spawnSync(process.execPath,[join(ROOT,'bin/oes.mjs'),...a,'--json'],{encoding:'utf8',cwd:ROOT});
    assert.equal(result.status,0,result.stdout+result.stderr);return JSON.parse(result.stdout);
  }
  const shape=check('check-graph',graphFile,'--warnings-as-errors');
  const evidence=check('check-evidence',graphFile,'--source-root',root,'--require-hash','--warnings-as-errors');
  const answer=traceCommit(extraction.graph,head,{sourceRoot:root});writeJSON(join(root,'answer.json'),answer);
  assert.equal(answer.decisions[0]?.id,'decision:D1');assert.equal(answer.approvals[0]?.approver,'An');assert.equal(answer.tickets[0]?.id,'ticket:T42');
  // Negative control: a bare T42 mention in the first real commit is not an implementation.
  assert.ok(!extraction.graph.edges.some(e=>e.from===`commit:${initial}`&&e.type==='implementsTicket'));
  assert.equal(extraction.report.implementsLinks,1);assert.equal(extraction.report.decisionLinks,1);
  // A fabricated quote must fail even though all references and shapes still exist.
  const tampered=structuredClone(extraction.graph);tampered.nodes.find(n=>n.type==='Evidence').properties.excerpt='The team decided to delete Kafka.';
  const badFile=join(root,'tampered.graph.json');writeJSON(badFile,tampered);
  const negative=spawnSync(process.execPath,[join(ROOT,'bin/oes.mjs'),'check-evidence',badFile,'--source-root',root,'--json'],{encoding:'utf8'});
  assert.equal(negative.status,1);const negativeReport=JSON.parse(negative.stdout);assert.ok(negativeReport.diagnostics.some(d=>d.code==='excerpt-mismatch'));
  writeJSON(join(root,'negative-report.json'),negativeReport);
  // Confirm generated commit snapshots were actually derived from Git, not invented SHAs.
  for(const sha of [initial,head])assert.equal(readFileSync(join(root,'snapshots/git',sha+'.txt'),'utf8'),`Commit: ${sha}\n${gitRead(repo,'cat-file','commit',sha)}`);
  const result={passed:true,output:root,sourceKind:'synthetic-content-with-real-local-git-history',agentRun:false,commits:[initial,head],nodes:extraction.graph.nodes.length,edges:extraction.graph.edges.length,structure:shape.passed,evidence:evidence.evidence,answer:{ticket:'T42',decision:'D1',recordedApprover:'An'},negativeControls:{bareTicketMention:'no-implements-edge',inventedExcerpt:'rejected'},artifacts:['graph.json','answer.json','adapter-report.json','negative-report.json','repo/','snapshots/']};
  writeJSON(join(root,'run-report.json'),result);return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const a=args(process.argv.slice(2),['--out']);console.log(JSON.stringify(runDemo({out:a['--out']}),null,2));}
  catch(e){console.error(e.stack||e.message);process.exitCode=1;}
}
